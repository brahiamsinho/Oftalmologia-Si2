import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface TipoCita {
  id_tipo_cita: number;
  nombre: string;
  nombre_display: string;
  descripcion: string | null;
}

export interface Cita {
  id_cita: number;
  id_paciente: number;
  paciente_nombre: string;
  id_especialista: number;
  especialista_nombre: string;
  id_tipo_cita: number;
  tipo_cita_nombre: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  estado_display: string;
  motivo: string | null;
  observaciones: string | null;
  confirmada_en: string | null;
  id_cita_reprogramada_desde: number | null;
  creado_por: number | null;
  fecha_creacion: string;
}

export interface CitaCreate {
  id_paciente: number;
  id_especialista: number;
  id_tipo_cita: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado?: string;
  motivo?: string;
  observaciones?: string;
  id_cita_reprogramada_desde?: number | null;
}

export interface CitasParams {
  search?: string;
  estado?: string;
  id_especialista?: number | string;
  page?: number;
  ordering?: string;
}

export const citasService = {
  async list(params?: CitasParams): Promise<PaginatedResponse<Cita>> {
    const { data } = await api.get<PaginatedResponse<Cita>>('/citas/', { params });
    return data;
  },

  async get(id: number): Promise<Cita> {
    const { data } = await api.get<Cita>(`/citas/${id}/`);
    return data;
  },

  async create(payload: CitaCreate): Promise<Cita> {
    const { data } = await api.post<Cita>('/citas/', payload);
    return data;
  },

  async update(id: number, payload: Partial<CitaCreate>): Promise<Cita> {
    const { data } = await api.patch<Cita>(`/citas/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/citas/${id}/`);
  },

  async listTipos(): Promise<PaginatedResponse<TipoCita>> {
    const { data } = await api.get<PaginatedResponse<TipoCita>>('/tipos-cita/');
    return data;
  },
};
