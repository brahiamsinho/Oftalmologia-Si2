import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export interface HistoriaClinica {
  id_historia_clinica: number;
  id_paciente: number;
  paciente_nombre: string;
  fecha_apertura: string;
  motivo_apertura: string | null;
  estado: string;
  observaciones: string | null;
}

export interface HistoriaClinicaDetalle extends HistoriaClinica {
  antecedentes: unknown[];
  diagnosticos: unknown[];
  evoluciones: unknown[];
  recetas: unknown[];
}

export interface HistoriaClinicaCreate {
  id_paciente: number;
  fecha_apertura?: string;
  motivo_apertura?: string;
  estado?: string;
  observaciones?: string;
}

export interface HistoriasParams {
  search?: string;
  estado?: string;
  page?: number;
}

export const historialService = {
  async list(params?: HistoriasParams): Promise<PaginatedResponse<HistoriaClinica>> {
    const { data } = await api.get<PaginatedResponse<HistoriaClinica>>('/historias-clinicas/', { params });
    return data;
  },

  async get(id: number): Promise<HistoriaClinicaDetalle> {
    const { data } = await api.get<HistoriaClinicaDetalle>(`/historias-clinicas/${id}/`);
    return data;
  },

  async create(payload: HistoriaClinicaCreate): Promise<HistoriaClinica> {
    const { data } = await api.post<HistoriaClinica>('/historias-clinicas/', payload);
    return data;
  },

  async update(id: number, payload: Partial<HistoriaClinicaCreate>): Promise<HistoriaClinica> {
    const { data } = await api.patch<HistoriaClinica>(`/historias-clinicas/${id}/`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/historias-clinicas/${id}/`);
  },
};
