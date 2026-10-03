/**
 * API do catálogo — uma única Netlify Function atende todas as rotas /api/*.
 *
 * Públicas:  GET  /api/health
 *            GET  /api/products            (filtros: q, brand, size, minPrice, maxPrice, status, condition, sort, limit)
 *            GET  /api/products/meta
 *            GET  /api/products/:id
 *            GET  /api/images/:key
 *            POST /api/auth/login
 * Admin:     GET  /api/auth/me
 *            POST /api/products            (multipart/form-data, campo "image")
 *            PUT  /api/products/:id        (multipart/form-data, "image" opcional)
 *            PATCH /api/products/:id/status
 *            DELETE /api/products/:id
 *            POST /api/products/seed       (adiciona exemplos com catálogo vazio)
 */
import { HttpError, json, errorResponse, readJson, readForm } from '../lib/http.mjs';
import { login, requireAuth } from '../lib/auth.mjs';
import { parseFilters } from '../lib/validators.mjs';
import { readImage } from '../lib/storage.mjs';
import * as Products from '../lib/products.mjs';

async function serveImage(key) {
  if (!/^[\w.-]+$/.test(key)) throw new HttpError('Imagem não encontrada.', 404);
  const found = await readImage(key);
  if (!found) throw new HttpError('Imagem não encontrada.', 404);
  return new Response(found.data, {
    headers: {
      'Content-Type': found.metadata?.contentType || 'application/octet-stream',
      // A chave é única por upload, então a imagem nunca muda: cache longo
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function route(req, context) {
  const url = new URL(req.url);
  const parts = url.pathname
    .replace(/^\/api\/?/, '')
    .replace(/\/index\.html?$/, '') // o "netlify dev" reenvia 404 com /index.htm no final
    .split('/')
    .filter(Boolean);
  const method = req.method;
  const [resource, id, action] = parts;

  if (resource === 'health' && method === 'GET') {
    return json({ status: 'ok', time: new Date().toISOString() });
  }

  if (resource === 'images' && id && method === 'GET') return serveImage(id);

  if (resource === 'auth') {
    if (id === 'login' && method === 'POST') return json(await login(await readJson(req), context.ip));
    if (id === 'me' && method === 'GET') return json({ user: requireAuth(req) });
  }

  if (resource === 'products') {
    if (!id) {
      if (method === 'GET') return json(await Products.list(parseFilters(url.searchParams)));
      if (method === 'POST') {
        requireAuth(req);
        return json(await Products.create(await readForm(req)), 201);
      }
    } else if (id === 'meta' && method === 'GET') {
      return json(await Products.meta());
    } else if (id === 'seed' && method === 'POST') {
      requireAuth(req);
      const body = await readJson(req).catch(() => ({}));
      const phone = String(body?.sellerPhone || process.env.VITE_STORE_WHATSAPP || '5511999999999').replace(/\D/g, '');
      const total = await Products.seed({ name: body?.sellerName || 'Vendedor', phone });
      return json({ total }, 201);
    } else if (action === 'status' && method === 'PATCH') {
      requireAuth(req);
      return json(await Products.setStatus(id, await readJson(req)));
    } else if (!action) {
      if (method === 'GET') return json(await Products.get(id));
      if (method === 'PUT') {
        requireAuth(req);
        return json(await Products.update(id, await readForm(req)));
      }
      if (method === 'DELETE') {
        requireAuth(req);
        await Products.remove(id);
        return json(null, 204);
      }
    }
  }

  throw new HttpError(`Rota não encontrada: ${method} ${url.pathname}`, 404);
}

export default async (req, context) => {
  try {
    return await route(req, context);
  } catch (err) {
    return errorResponse(err);
  }
};

export const config = {
  path: '/api/*',
};
