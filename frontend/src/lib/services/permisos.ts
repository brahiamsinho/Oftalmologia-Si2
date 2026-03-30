import api, { fetchAll } from '@/lib/api';
import type { Permiso } from '@/lib/types';

export const permisosService = {
  async list(): Promise<Permiso[]> {
    return fetchAll<Permiso>('/permisos/');
  },

  async get(id: number): Promise<Permiso> {
    const { data } = await api.get<Permiso>(`/permisos/${id}/`);
    return data;
  },

  async create(payload: { nombre: string; descripcion?: string; modulo: string }): Promise<Permiso> {
    const { data } = await api.post<Permiso>('/permisos/', payload);
    return data;
  },

  async update(id: number, payload: Partial<{ nombre: string; descripcion: string; modulo: string; activo: boolean }>): Promise<Permiso> {
    const { data } = await api.patch<Permiso>(`/permisos/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/permisos/${id}/`);
  },
};
