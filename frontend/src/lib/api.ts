/**
 * lib/api.ts
 *
 * Instancia central de Axios configurada para la API Django.
 * Maneja:
 *  - Base URL desde variable de entorno
 *  - Inyección automática del token JWT en cada request
 *  - Refresh automático cuando el access token expira (401)
 *  - Redirección al login cuando el refresh también falla
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ── Base URL ─────────────────────────────────────────────────────────────────
// En .env: NEXT_PUBLIC_API_URL=http://localhost:8000/api
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// ── Instancia principal ───────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Helpers de token (localStorage en cliente) ────────────────────────────────
export const TokenStorage = {
  getAccess:      () => (typeof window !== 'undefined' ? localStorage.getItem('access_token')  : null),
  getRefresh:     () => (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null),
  setAccess:      (t: string) => localStorage.setItem('access_token',  t),
  setRefresh:     (t: string) => localStorage.setItem('refresh_token', t),
  setTokens:      (access: string, refresh: string) => {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
  },
  clear:          () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// ── Request interceptor: agrega Authorization header ─────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = TokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: refresh automático en 401 ──────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Solo intentar refresh en 401 y si no es la ruta de refresh/login
    const isAuthRoute = original?.url?.includes('/auth/token/') || original?.url?.includes('/auth/login/');
    if (error.response?.status !== 401 || original?._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refresh = TokenStorage.getRefresh();
      if (!refresh) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
      TokenStorage.setAccess(data.access);
      processQueue(null, data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      TokenStorage.clear();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
