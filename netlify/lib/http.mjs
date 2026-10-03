export class HttpError extends Error {
  constructor(message, status = 400, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export function json(data, status = 200) {
  if (status === 204) return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
  return new Response(JSON.stringify({ data }), { status, headers: BASE_HEADERS });
}

export function errorResponse(err) {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error('[api] erro inesperado:', err);
  const message = status >= 500 ? 'Erro interno do servidor. Tente novamente.' : err.message;
  const body = { error: { message, ...(err.details ? { details: err.details } : {}) } };
  return new Response(JSON.stringify(body), { status, headers: BASE_HEADERS });
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError('JSON inválido no corpo da requisição.', 400);
  }
}

export async function readForm(req) {
  try {
    return await req.formData();
  } catch {
    throw new HttpError('Formulário inválido.', 400);
  }
}
