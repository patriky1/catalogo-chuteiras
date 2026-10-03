import { HttpError } from './http.mjs';
import { loadCatalog, updateCatalog, saveImage, removeImage } from './storage.mjs';
import { validateProduct, validateStatus } from './validators.mjs';
import { EXEMPLOS } from './exemplos.mjs';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SORTS = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
};

/** Remove campos internos antes de enviar ao navegador. */
const toApi = ({ imageKey, ...p }) => p;

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError('Produto não encontrado.', 404);
  return id;
}

function findOr404(doc, id) {
  const product = doc.items.find((p) => p.id === id);
  if (!product) throw new HttpError('Produto não encontrado.', 404);
  return product;
}

function getImageFile(form, required) {
  const file = form.get('image');
  const hasFile = file && typeof file === 'object' && file.size > 0;
  if (!hasFile) return required ? { error: 'Envie a foto principal da chuteira.' } : { file: null };
  if (!IMAGE_TYPES.includes(file.type)) return { error: 'Use uma imagem JPG, PNG ou WEBP.' };
  if (file.size > MAX_IMAGE_BYTES) return { error: 'Imagem muito grande (máx. 4 MB).' };
  return { file };
}

// ---------- Leitura (pública) ----------
export async function list(filters) {
  const { items } = await loadCatalog();
  let result = items.filter((p) => {
    if (filters.q && !`${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(filters.q)) return false;
    if (filters.brand && p.brand.toLowerCase() !== filters.brand) return false;
    if (filters.size && p.size !== filters.size) return false;
    if (filters.minPrice != null && p.price < filters.minPrice) return false;
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    return true;
  });
  const sorter = SORTS[filters.sort] || SORTS.recent;
  // Disponíveis primeiro, depois a ordenação escolhida
  result.sort((a, b) => (a.status === b.status ? sorter(a, b) : a.status === 'disponivel' ? -1 : 1));
  if (filters.limit) result = result.slice(0, filters.limit);
  return result.map(toApi);
}

export async function meta() {
  const { items } = await loadCatalog();
  const available = items.filter((p) => p.status === 'disponivel').length;
  const prices = items.map((p) => p.price);
  return {
    brands: [...new Set(items.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
    sizes: [...new Set(items.map((p) => p.size))].sort((a, b) => a - b),
    total: items.length,
    available,
    sold: items.length - available,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

export async function get(rawId) {
  const doc = await loadCatalog();
  return toApi(findOr404(doc, parseId(rawId)));
}

// ---------- Escrita (admin) ----------
export async function create(form) {
  const { data, errors } = validateProduct(Object.fromEntries(form));
  const img = getImageFile(form, true);
  const allErrors = { ...(errors || {}), ...(img.error ? { image: img.error } : {}) };
  if (Object.keys(allErrors).length) throw new HttpError('Verifique os campos destacados.', 422, allErrors);

  const saved = await saveImage(img.file);
  try {
    return await updateCatalog((doc) => {
      const now = new Date().toISOString();
      doc.seq += 1;
      const product = { id: doc.seq, ...data, image: saved.url, imageKey: saved.key, createdAt: now, updatedAt: now };
      doc.items.push(product);
      return toApi(product);
    });
  } catch (err) {
    await removeImage(saved.key);
    throw err;
  }
}

export async function update(rawId, form) {
  const id = parseId(rawId);
  const { data, errors } = validateProduct(Object.fromEntries(form));
  const img = getImageFile(form, false);
  const allErrors = { ...(errors || {}), ...(img.error ? { image: img.error } : {}) };
  if (Object.keys(allErrors).length) throw new HttpError('Verifique os campos destacados.', 422, allErrors);

  findOr404(await loadCatalog(), id); // 404 antes de enviar imagem
  const saved = img.file ? await saveImage(img.file) : null;
  let oldKey = null;
  try {
    const product = await updateCatalog((doc) => {
      const current = findOr404(doc, id);
      if (saved) {
        oldKey = current.imageKey;
        current.image = saved.url;
        current.imageKey = saved.key;
      }
      Object.assign(current, data, { updatedAt: new Date().toISOString() });
      return toApi(current);
    });
    if (oldKey) await removeImage(oldKey);
    return product;
  } catch (err) {
    if (saved) await removeImage(saved.key);
    throw err;
  }
}

export async function setStatus(rawId, body) {
  const id = parseId(rawId);
  const status = validateStatus(body?.status);
  if (!status) throw new HttpError('Status inválido.', 422, { status: 'Use "disponivel" ou "vendida".' });
  return updateCatalog((doc) => {
    const current = findOr404(doc, id);
    current.status = status;
    current.updatedAt = new Date().toISOString();
    return toApi(current);
  });
}

export async function remove(rawId) {
  const id = parseId(rawId);
  const removed = await updateCatalog((doc) => {
    const current = findOr404(doc, id);
    doc.items = doc.items.filter((p) => p.id !== id);
    return current;
  });
  await removeImage(removed.imageKey);
}

/** Adiciona os produtos de exemplo (somente se o catálogo estiver vazio). */
export async function seed(seller) {
  return updateCatalog((doc) => {
    if (doc.items.length) throw new HttpError('O catálogo já tem produtos. Exemplos só podem ser adicionados com ele vazio.', 409);
    const base = Date.now();
    EXEMPLOS.forEach((ex, i) => {
      doc.seq += 1;
      const ts = new Date(base - (EXEMPLOS.length - i) * 60000).toISOString();
      doc.items.push({
        id: doc.seq, ...ex, imageKey: null,
        sellerName: seller.name, sellerPhone: seller.phone,
        createdAt: ts, updatedAt: ts,
      });
    });
    return doc.items.length;
  });
}
