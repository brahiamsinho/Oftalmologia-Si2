/**
 * lib/api.ts
 *
 * Instancia central de Axios configurada para la API Django.
 * Maneja:
 *  - Base URL desde variable de entorno
 *  - Inyección automática del token JWT en cada request
 *  - Inyección automática del prefijo de tenant /t/<slug>/api en rutas privadas
 *  - Refresh automático cuando el access token expira (401)
 *  - Redirección al login cuando el refresh también falla
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ── Base URL (obligatoria: NEXT_PUBLIC_API_URL en .env de la raíz del monorepo) ─
function resolveApiBaseUrl(): string {
  let raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      'NEXT_PUBLIC_API_URL no está definida. Copiá .env.example a .env en la raíz del repo y definí la URL del backend.',
    );
  }
  // Coma en .env suele ser error (p.ej. dos URLs); CORS sí admite lista separada por coma, esto NO.
  if (raw.includes(',')) {
    const first = raw.split(',')[0].trim();
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        '[api] NEXT_PUBLIC_API_URL no puede listar varias URLs. Usando solo la primera:',
        first,
      );
    }
    raw = first;
  }
  return raw.replace(/\/+$/, '');
}

const BASE_URL = resolveApiBaseUrl();

/**
 * Calcula el origin del backend (sin el sufijo /api).
 * Ej: "http://localhost:8000/api" → "http://localhost:8000"
 */
export function resolveApiOrigin(): string {
  return BASE_URL.replace(/\/api\/?$/, '');
}

/**
 * Construye la base URL del tenant dado su slug.
 * Ej: slug="clinica-demo" → "http://localhost:8000/t/clinica-demo/api"
 */
export function resolveTenantBaseUrl(slug: string): string {
  return `${resolveApiOrigin()}/t/${slug}/api`;
}

// ── Instancia principal ───────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Helpers de token (localStorage en cliente) ────────────────────────────────
// Helpers: persiste en localStorage Y en una cookie HttpOnly-compatible para el middleware
export const TokenStorage = {
  getAccess:  () => (typeof window !== 'undefined' ? localStorage.getItem('access_token')  : null),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null),

  setAccess: (t: string) => {
    localStorage.setItem('access_token', t);
    document.cookie = `access_token=${t}; path=/; SameSite=Lax`;
  },
  setRefresh: (t: string) => {
    localStorage.setItem('refresh_token', t);
    document.cookie = `refresh_token=${t}; path=/; SameSite=Lax`;
  },
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    document.cookie = `access_token=${access};  path=/; SameSite=Lax`;
    document.cookie = `refresh_token=${refresh}; path=/; SameSite=Lax`;
  },
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    document.cookie = 'access_token=;  path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
  },
};

// ── Almacenamiento del tenant activo ─────────────────────────────────────────
/**
 * TenantStorage persiste el slug y los datos del tenant en localStorage + cookie.
 * El interceptor de request lo usa para reescribir la baseURL automáticamente.
 */
export const TenantStorage = {
  getSlug: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('tenant_slug') : null,

  getTenantData: (): TenantPublicData | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('tenant_data');
      return raw ? (JSON.parse(raw) as TenantPublicData) : null;
    } catch {
      return null;
    }
  },

  setSlug: (slug: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tenant_slug', slug);
    document.cookie = `tenant_slug=${slug}; path=/; SameSite=Lax`;
  },

  setTenantData: (data: TenantPublicData): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tenant_data', JSON.stringify(data));
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('tenant_slug');
    localStorage.removeItem('tenant_data');
    document.cookie = 'tenant_slug=; path=/; max-age=0';
  },
};

// ── Tipos públicos del tenant (espeja TenantPublicSerializer del backend) ─────
export interface TenantBranding {
  nombre: string;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
}

export interface TenantSubscriptionPlan {
  codigo: string;
  nombre: string;
  precio_mensual: number;
  max_usuarios: number;
  max_pacientes: number;
  max_citas_mes: number;
  max_almacenamiento_mb: number;
  permite_crm: boolean;
  permite_notificaciones: boolean;
  permite_reportes_avanzados: boolean;
  permite_soporte_prioritario: boolean;
}

export interface TenantPublicData {
  id: number;
  slug: string;
  nombre: string;
  branding: TenantBranding;
  subscription: {
    plan: TenantSubscriptionPlan;
    estado: string;
    esta_activa: boolean;
  } | null;
}

// ── Request interceptor: agrega Authorization header + prefijo de tenant ──────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = TokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Multi-tenant: reescribe baseURL de /api a /t/<slug>/api en rutas privadas.
  // Solo aplica si hay un slug guardado y la baseURL aún es la original (evita
  // doble-reescritura si algo llama al interceptor más de una vez).
  const slug = TenantStorage.getSlug();
  if (slug && config.baseURL === BASE_URL) {
    config.baseURL = resolveTenantBaseUrl(slug);
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

    // ── 403: tenant inactivo/suspendido ──────────────────────────────────────
    // Si el backend responde 403 (que no sea en el login), interpretamos que el
    // tenant fue suspendido. Limpiamos sesión y redirigimos al login.
    if (error.response?.status === 403) {
      const isLoginRoute = original?.url?.includes('/auth/login/');
      if (!isLoginRoute && typeof window !== 'undefined') {
        TenantStorage.clear();
        TokenStorage.clear();
        window.location.href = '/login?motivo=tenant_inactivo';
        return Promise.reject(error);
      }
    }

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

      // El endpoint de refresh también debe usar el prefijo del tenant si está activo.
      const slug = TenantStorage.getSlug();
      const refreshBase = slug ? resolveTenantBaseUrl(slug) : BASE_URL;
      const { data } = await axios.post(`${refreshBase}/auth/token/refresh/`, { refresh });
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

// ── Helper: trae TODAS las páginas de un endpoint paginado ───────────────────
interface DRFPage { results: unknown[]; next: string | null }

/** Evita fallar en el navegador si DRF devuelve `next` con host 0.0.0.0 o `backend` (Docker). */
function resolvePaginationUrl(next: string | null): string | null {
  if (!next) return null;
  if (!/^https?:\/\//i.test(next)) return next;
  try {
    const u = new URL(next);
    if (u.hostname === '0.0.0.0' || u.hostname === 'backend') {
      const base = new URL(BASE_URL);
      return `${base.origin}${u.pathname}${u.search}`;
    }
  } catch {
    /* ignore */
  }
  return next;
}

export async function fetchAll<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const raw: unknown = (await api.get(resolvePaginationUrl(nextUrl) ?? nextUrl)).data;

    if (Array.isArray(raw)) {
      results.push(...(raw as T[]));
      break;
    }
    const page = raw as DRFPage;
    results.push(...(page.results as T[]));
    nextUrl = resolvePaginationUrl(page.next);
  }

  return results;
}

export default api;
