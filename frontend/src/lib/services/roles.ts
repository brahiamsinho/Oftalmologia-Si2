/**
 * lib/services/roles.ts
 *
 * CRUD de roles y permisos.
 * Rutas del backend:
 *   GET/POST        /api/roles/
 *   GET/PATCH/DELETE /api/roles/{id}/
 *   GET             /api/permisos/
 */

import api from '@/lib/api';
import type { PaginatedResponse, Permiso, Rol } from '@/lib/types';

export const rolesService = {
  async list(): Promise<Rol[]> {
    const { data } = await api.get<Rol[] | PaginatedResponse<Rol>>('/roles/');
    // El backend puede devolver lista directa o paginada
    return Array.isArray(data) ? data : data.results;
  },

  async get(id: number): Promise<Rol> {
    const { data } = await api.get<Rol>(`/roles/${id}/`);
    return data;
  },

  async create(payload: { nombre: string; descripcion?: string }): Promise<Rol> {
    const { data } = await api.post<Rol>('/roles/', payload);
    return data;
  },

  async update(id: number, payload: Partial<{ nombre: string; descripcion: string; activo: boolean }>): Promise<Rol> {
    const { data } = await api.patch<Rol>(`/roles/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/roles/${id}/`);
  },

  async listarPermisos(): Promise<Permiso[]> {
    const { data } = await api.get<Permiso[] | PaginatedResponse<Permiso>>('/permisos/');
    return Array.isArray(data) ? data : data.results;
  },
};
