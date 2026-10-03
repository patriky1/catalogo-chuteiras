import { request } from './api';

export const authService = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }).then((r) => r.data),
  me: () => request('/auth/me', { auth: true }).then((r) => r.data.user),
};
