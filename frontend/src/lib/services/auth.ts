/**
 * lib/services/auth.ts
 *
 * Todos los llamados relacionados con autenticación.
 * Rutas del backend:
 *   POST /api/auth/login/
 *   POST /api/auth/logout/
 *   GET  /api/auth/me/
 *   PATCH /api/auth/me/
 *   POST /api/auth/change-password/
 */

import api, { TokenStorage, TenantStorage } from '@/lib/api';
import type { LoginCredentials, LoginResponse, Usuario } from '@/lib/types';

export const authService = {
  /** Inicia sesión y guarda los tokens + datos del tenant (si el backend los devuelve) */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);
    TokenStorage.setTokens(data.access, data.refresh);
    // El login multi-tenant devuelve { usuario, tenant, access, refresh }.
    // Actualizamos TenantStorage con los datos frescos del tenant.
    if (data.tenant) {
      TenantStorage.setTenantData(data.tenant);
      if (data.tenant.slug) TenantStorage.setSlug(data.tenant.slug);
    }
    return data;
  },

  /** Cierra sesión (invalida el refresh token en el backend) */
  async logout(): Promise<void> {
    const refresh = TokenStorage.getRefresh();
    if (refresh) {
      await api.post('/auth/logout/', { refresh }).catch(() => {
        // Si falla, limpiamos igual
      });
    }
    TokenStorage.clear();
    TenantStorage.clear();
  },

  /** Obtiene el usuario autenticado actual */
  async me(): Promise<Usuario> {
    const { data } = await api.get<Usuario>('/auth/me/');
    return data;
  },

  /** Actualiza datos del perfil propio */
  async updateMe(patch: Partial<Pick<Usuario, 'nombres' | 'apellidos' | 'telefono'>>): Promise<Usuario> {
    const { data } = await api.patch<Usuario>('/auth/me/', patch);
    return data;
  },

  /** Cambia la contraseña */
  async changePassword(old_password: string, new_password: string): Promise<void> {
    await api.post('/auth/change-password/', { old_password, new_password });
  },
};
