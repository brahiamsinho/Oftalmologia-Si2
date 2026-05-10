/**
 * Cliente HTTP para la API pública de plataforma (/api/public/...).
 * No reescribe prefijo /t/<slug>/; tokens en claves distintas al panel de clínica.
 */

import axios, { InternalAxiosRequestConfig } from 'axios';
import { resolveApiOrigin, resolvePaginationUrl } from '@/lib/api';

const PUBLIC_BASE = `${resolveApiOrigin()}/api/public`;

export const PlatformTokenStorage = {
  getAccess: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('platform_access_token') : null,

  setAccess: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('platform_access_token', token);
    document.cookie = `platform_access_token=${token}; path=/; SameSite=Lax`;
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('platform_access_token');
    document.cookie = 'platform_access_token=; path=/; max-age=0';
  },
};

export const platformApi = axios.create({
  baseURL: PUBLIC_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,
});

platformApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = PlatformTokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

platformApi.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/platform') && !path.startsWith('/platform/login')) {
        PlatformTokenStorage.clear();
        window.location.href = '/platform/login';
      }
    }
    return Promise.reject(error);
  },
);

interface DRFPage<T> {
  results: T[];
  next: string | null;
}

export async function fetchPlatformAll<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = path;

  while (nextUrl) {
    const resolved = resolvePaginationUrl(nextUrl) ?? nextUrl;
    const { data } = await platformApi.get<DRFPage<T> | T[]>(resolved);
    if (Array.isArray(data)) {
      results.push(...data);
      break;
    }
    results.push(...data.results);
    nextUrl = resolvePaginationUrl(data.next);
  }
  return results;
}
