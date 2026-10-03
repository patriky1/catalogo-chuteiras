export const CONDITIONS = ['nova', 'usada'];
export const STATUSES = ['disponivel', 'vendida'];

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

export function parseNumber(value) {
  if (typeof value === 'number') return value;
  const s = str(value);
  if (!s) return NaN;
  // Aceita "1.299,90", "1299,90" e "1299.90"
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normalized);
}

/** Valida e normaliza os dados de uma chuteira. Retorna { data, errors } (errors = null se válido). */
export function validateProduct(input = {}) {
  const errors = {};
  const data = {};

  data.name = str(input.name);
  if (data.name.length < 2 || data.name.length > 120) errors.name = 'Informe o nome (2 a 120 caracteres).';

  const price = parseNumber(input.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) errors.price = 'Informe um preço válido maior que zero.';
  else data.price = Math.round(price * 100) / 100;

  data.description = str(input.description);
  if (data.description.length < 10 || data.description.length > 2000) {
    errors.description = 'A descrição deve ter entre 10 e 2000 caracteres.';
  }

  const size = Number(str(input.size));
  if (!Number.isInteger(size) || size < 20 || size > 50) errors.size = 'Informe um tamanho inteiro entre 20 e 50.';
  else data.size = size;

  data.brand = str(input.brand);
  if (data.brand.length < 2 || data.brand.length > 60) errors.brand = 'Informe a marca (2 a 60 caracteres).';

  data.condition = str(input.condition).toLowerCase();
  if (!CONDITIONS.includes(data.condition)) errors.condition = 'Condição deve ser "nova" ou "usada".';

  data.status = str(input.status).toLowerCase() || 'disponivel';
  if (!STATUSES.includes(data.status)) errors.status = 'Status deve ser "disponivel" ou "vendida".';

  data.sellerName = str(input.sellerName);
  if (data.sellerName.length < 2 || data.sellerName.length > 80) {
    errors.sellerName = 'Informe o nome do vendedor (2 a 80 caracteres).';
  }

  data.sellerPhone = str(input.sellerPhone).replace(/\D/g, '');
  if (data.sellerPhone.length < 10 || data.sellerPhone.length > 15) {
    errors.sellerPhone = 'Informe o WhatsApp com DDI e DDD (ex.: 5511999999999).';
  }

  return { data, errors: Object.keys(errors).length ? errors : null };
}

export function validateStatus(value) {
  const status = str(value).toLowerCase();
  return STATUSES.includes(status) ? status : null;
}

/** Filtros públicos da listagem, sanitizados. */
export function parseFilters(params) {
  const get = (k) => str(params.get(k));
  const f = {};
  const q = get('q').slice(0, 100);
  if (q) f.q = q.toLowerCase();
  const brand = get('brand').slice(0, 60);
  if (brand) f.brand = brand.toLowerCase();
  const size = Number(get('size'));
  if (Number.isInteger(size) && size > 0) f.size = size;
  const minPrice = parseNumber(get('minPrice'));
  if (Number.isFinite(minPrice) && minPrice >= 0) f.minPrice = minPrice;
  const maxPrice = parseNumber(get('maxPrice'));
  if (Number.isFinite(maxPrice) && maxPrice > 0) f.maxPrice = maxPrice;
  const status = validateStatus(get('status'));
  if (status) f.status = status;
  const condition = get('condition').toLowerCase();
  if (CONDITIONS.includes(condition)) f.condition = condition;
  const sort = get('sort');
  if (sort) f.sort = sort;
  const limit = Number(get('limit'));
  if (Number.isInteger(limit) && limit > 0) f.limit = Math.min(limit, 100);
  return f;
}
