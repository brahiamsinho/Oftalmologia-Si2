import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface Especialista {
  id_especialista: number;
  usuario: number;
  usuario_nombre: string;
  especialidad: string;
  subespecialidad: string | null;
  numero_colegiado: string | null;
  activo: boolean;
}

export interface EspecialistasParams {
  search?: string;
  especialidad?: string;
  activo?: string;
  page?: number;
}

export const especialistasService = {
  async list(params?: EspecialistasParams): Promise<PaginatedResponse<Especialista>> {
    const { data } = await api.get<PaginatedResponse<Especialista>>('/especialistas/', { params });
    return data;
  },

  async get(id: number): Promise<Especialista> {
    const { data } = await api.get<Especialista>(`/especialistas/${id}/`);
    return data;
  },

  async create(payload: Partial<Especialista>): Promise<Especialista> {
    const { data } = await api.post<Especialista>('/especialistas/', payload);
    return data;
  },

  async update(id: number, payload: Partial<Especialista>): Promise<Especialista> {
    const { data } = await api.patch<Especialista>(`/especialistas/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/especialistas/${id}/`);
  },
};
