/**
 * Login do administrador sem banco de usuários:
 * e-mail e senha ficam nas variáveis de ambiente do Netlify (ADMIN_EMAIL / ADMIN_PASSWORD).
 * O token é assinado com HMAC-SHA256 e expira (padrão 8 h).
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.mjs';
import { securityStore } from './storage.mjs';

const TOKEN_HOURS = Number(process.env.TOKEN_HOURS) || 8;
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function adminConfig() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) {
    throw new HttpError('Login não configurado. Defina ADMIN_EMAIL e ADMIN_PASSWORD nas variáveis do Netlify.', 503);
  }
  // Se AUTH_SECRET não for definido, deriva um segredo da própria senha
  // (trocar a senha invalida as sessões abertas).
  const secret = process.env.AUTH_SECRET || createHash('sha256').update(`catalogo:${email}:${password}`).digest('hex');
  return { email, password, secret };
}

const sha = (s) => createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => timingSafeEqual(sha(a), sha(b));
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token, secret) {
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return { expired: true };
    return payload;
  } catch {
    return null;
  }
}

// ---------- Limite de tentativas ----------
async function checkRateLimit(ip) {
  const key = `login-${ip || 'desconhecido'}`.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const store = securityStore();
  const now = Date.now();
  let rec = (await store.get(key, { type: 'json' })) || { count: 0, first: now };
  if (now - rec.first > WINDOW_MS) rec = { count: 0, first: now };
  if (rec.count >= MAX_ATTEMPTS) {
    throw new HttpError('Muitas tentativas de login. Tente novamente em alguns minutos.', 429);
  }
  return {
    fail: async () => store.setJSON(key, { ...rec, count: rec.count + 1 }),
    reset: async () => store.delete(key),
  };
}

export async function login(body, ip) {
  const email = String(body?.email || '').trim().toLowerCase();
  const password = typeof body?.password === 'string' ? body.password : '';
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Informe um e-mail válido.';
  if (!password) errors.password = 'Informe a senha.';
  if (Object.keys(errors).length) throw new HttpError('Dados de login inválidos.', 422, errors);

  const cfg = adminConfig();
  const limiter = await checkRateLimit(ip);
  const ok = safeEqual(email, cfg.email) & safeEqual(password, cfg.password);
  if (!ok) {
    await limiter.fail();
    throw new HttpError('E-mail ou senha incorretos.', 401);
  }
  await limiter.reset();

  const user = { id: 1, name: process.env.ADMIN_NAME || 'Administrador', email: cfg.email };
  const token = sign({ sub: cfg.email, exp: Date.now() + TOKEN_HOURS * 3600 * 1000 }, cfg.secret);
  return { token, user };
}

/** Exige token válido no header Authorization: Bearer <token>. */
export function requireAuth(req) {
  const [scheme, token] = (req.headers.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError('Autenticação necessária.', 401);
  const cfg = adminConfig();
  const payload = verify(token, cfg.secret);
  if (!payload) throw new HttpError('Token inválido.', 401);
  if (payload.expired) throw new HttpError('Sessão expirada. Faça login novamente.', 401);
  if (payload.sub !== cfg.email) throw new HttpError('Token inválido.', 401);
  return { id: 1, name: process.env.ADMIN_NAME || 'Administrador', email: cfg.email };
}
