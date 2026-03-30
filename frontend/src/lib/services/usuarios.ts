/**
 * lib/services/usuarios.ts
 *
 * CRUD de usuarios del sistema.
 * Rutas del backend:
 *   GET    /api/users/              — lista
 *   POST   /api/users/              — crear
 *   GET    /api/users/{id}/         — obtener uno
 *   PATCH  /api/users/{id}/         — editar
 *   DELETE /api/users/{id}/         — eliminar
 *   POST   /api/users/{id}/activar/
 *   POST   /api/users/{id}/bloquear/
 *   GET    /api/users/{id}/roles/   — roles del usuario
 *   POST   /api/users/{id}/roles/   — asignar rol
 */

import api from '@/lib/api';
import type { PaginatedResponse, Rol, Usuario, UsuarioCreate } from '@/lib/types';

export const usuariosService = {
  async list(params?: { search?: string; tipo_usuario?: string; estado?: string }): Promise<PaginatedResponse<Usuario>> {
    const { data } = await api.get<PaginatedResponse<Usuario>>('/users/', { params });
    return data;
  },

  async get(id: number): Promise<Usuario> {
    const { data } = await api.get<Usuario>(`/users/${id}/`);
    return data;
  },

  async create(payload: UsuarioCreate): Promise<Usuario> {
    const { data } = await api.post<Usuario>('/users/', payload);
    return data;
  },

  async update(id: number, payload: Partial<UsuarioCreate>): Promise<Usuario> {
    const { data } = await api.patch<Usuario>(`/users/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}/`);
  },

  async activar(id: number): Promise<Usuario> {
    const { data } = await api.post<Usuario>(`/users/${id}/activar/`);
    return data;
  },

  async bloquear(id: number): Promise<Usuario> {
    const { data } = await api.post<Usuario>(`/users/${id}/bloquear/`);
    return data;
  },

  async getRoles(id: number): Promise<Rol[]> {
    const { data } = await api.get<Rol[]>(`/users/${id}/roles/`);
    return data;
  },

  async asignarRol(userId: number, rolId: number): Promise<void> {
    await api.post(`/users/${userId}/roles/`, { id_rol: rolId });
  },
};
