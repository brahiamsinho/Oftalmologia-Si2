/**
 * lib/services/roles.ts
 *
 * CRUD de roles y permisos.
 * Rutas del backend:
 *   GET/POST        /api/roles/
 *   GET/PATCH/DELETE /api/roles/{id}/
 *   GET             /api/permisos/
 */

import api, { fetchAll } from '@/lib/api';
import type { Permiso, Rol } from '@/lib/types';

export const rolesService = {
  async list(): Promise<Rol[]> {
    return fetchAll<Rol>('/roles/');
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
    return fetchAll<Permiso>('/permisos/');
  },

  async addPermiso(rolId: number, permisoId: number): Promise<void> {
    await api.post(`/roles/${rolId}/permisos/`, { id_permiso: permisoId });
  },

  async removePermiso(rolId: number, permisoId: number): Promise<void> {
    await api.delete(`/roles/${rolId}/permisos/${permisoId}/`);
  },
};
