/**
 * Armazenamento no Netlify Blobs (incluído no Netlify, sem serviço externo).
 *  - store "catalogo": documento JSON com todos os produtos { seq, items }
 *  - store "imagens":  fotos enviadas pelo admin (binário + contentType)
 *  - store "seguranca": contador de tentativas de login por IP
 */
import { getStore } from '@netlify/blobs';

const PRODUCTS_KEY = 'produtos';

export const catalogStore = () => getStore({ name: 'catalogo', consistency: 'strong' });
export const imageStore = () => getStore({ name: 'imagens', consistency: 'strong' });
export const securityStore = () => getStore({ name: 'seguranca', consistency: 'strong' });

export async function loadCatalog() {
  const doc = await catalogStore().get(PRODUCTS_KEY, { type: 'json' });
  return doc && Array.isArray(doc.items) ? doc : { seq: 0, items: [] };
}

export async function saveCatalog(doc) {
  await catalogStore().setJSON(PRODUCTS_KEY, doc);
}

/** Lê o catálogo, aplica uma alteração e salva. Retorna o que `mutate` retornar. */
export async function updateCatalog(mutate) {
  const doc = await loadCatalog();
  const result = await mutate(doc);
  await saveCatalog(doc);
  return result;
}

// ---------- Imagens ----------
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function saveImage(file) {
  const key = `${Date.now()}-${crypto.randomUUID()}.${EXT[file.type] || 'img'}`;
  await imageStore().set(key, await file.arrayBuffer(), { metadata: { contentType: file.type } });
  return { key, url: `/api/images/${key}` };
}

export async function removeImage(key) {
  if (!key) return;
  try {
    await imageStore().delete(key);
  } catch (err) {
    console.warn('[storage] não foi possível remover a imagem', key, err.message);
  }
}

export async function readImage(key) {
  return imageStore().getWithMetadata(key, { type: 'stream' });
}
