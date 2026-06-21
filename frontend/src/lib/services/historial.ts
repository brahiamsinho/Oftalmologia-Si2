import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

function unwrapList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

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
  recetas: DocumentoClinicoAutorizado[];
}

export interface DocumentoClinicoAutorizado {
  id_documento_clinico: number;
  id_historia_clinica: number;
  id_paciente: number;
  paciente_nombre: string;
  tipo_documento: 'RECETA' | 'INDICACION' | string;
  estado: 'BORRADOR' | 'AUTORIZADO' | 'ANULADO' | string;
  titulo: string;
  contenido: string;
  nombre_archivo_descarga: string;
  fecha_emision: string;
  autorizado_por: number | null;
  autorizado_por_nombre: string | null;
  autorizado_en: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentoClinicoCreatePayload {
  tipo_documento: 'RECETA' | 'INDICACION';
  titulo: string;
  contenido: string;
  nombre_archivo_descarga?: string;
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

  async listDocumentos(historiaId: number): Promise<DocumentoClinicoAutorizado[]> {
    const { data } = await api.get<DocumentoClinicoAutorizado[] | PaginatedResponse<DocumentoClinicoAutorizado>>(
      `/historias-clinicas/${historiaId}/documentos-clinicos/`,
    );
    return unwrapList(data);
  },

  async createDocumento(
    historiaId: number,
    payload: DocumentoClinicoCreatePayload,
  ): Promise<DocumentoClinicoAutorizado> {
    const { data } = await api.post<DocumentoClinicoAutorizado>(
      `/historias-clinicas/${historiaId}/documentos-clinicos/`,
      payload,
    );
    return data;
  },

  async autorizarDocumento(historiaId: number, documentoId: number): Promise<DocumentoClinicoAutorizado> {
    const { data } = await api.post<DocumentoClinicoAutorizado>(
      `/historias-clinicas/${historiaId}/documentos-clinicos/${documentoId}/autorizar/`,
    );
    return data;
  },

  async downloadDocumento(historiaId: number, documentoId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(`/historias-clinicas/${historiaId}/documentos-clinicos/${documentoId}/download/`, {
      responseType: 'blob',
    });
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
