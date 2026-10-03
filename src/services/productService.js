import { request } from './api';

function toQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value != null) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const productService = {
  list: (filters, signal) => request(`/products${toQuery(filters)}`, { signal }).then((r) => r.data),
  meta: (signal) => request('/products/meta', { signal }).then((r) => r.data),
  get: (id, signal) => request(`/products/${encodeURIComponent(id)}`, { signal }).then((r) => r.data),
  create: (formData) => request('/products', { method: 'POST', body: formData, auth: true }).then((r) => r.data),
  update: (id, formData) =>
    request(`/products/${id}`, { method: 'PUT', body: formData, auth: true }).then((r) => r.data),
  setStatus: (id, status) =>
    request(`/products/${id}/status`, { method: 'PATCH', body: { status }, auth: true }).then((r) => r.data),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),
  seed: (seller) =>
    request('/products/seed', { method: 'POST', body: seller, auth: true }).then((r) => r.data),
};
