import api from '@/lib/api';
import { AxiosError } from 'axios';
import type { PaginatedResponse } from '@/lib/types';

function unwrapList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

function apiError(error: unknown, fallback: string): Error {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { detail?: string; non_field_errors?: string[]; [key: string]: unknown }
      | undefined;
    if (data?.detail && typeof data.detail === 'string') {
      return new Error(data.detail);
    }
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length > 0) {
      return new Error(String(data.non_field_errors[0]));
    }
    if (data && typeof data === 'object') {
      for (const [field, value] of Object.entries(data)) {
        if (field === 'detail' || field === 'non_field_errors') continue;
        if (Array.isArray(value) && value.length > 0) {
          return new Error(`${field}: ${String(value[0])}`);
        }
        if (typeof value === 'string' && value.trim()) {
          return new Error(`${field}: ${value}`);
        }
      }
    }
    if (error.response?.status) {
      return new Error(`Error ${error.response.status}: ${fallback}`);
    }
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export interface Aseguradora {
  id_aseguradora: number;
  codigo: string;
  nombre: string;
  razon_social: string;
  telefono: string;
  email: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Convenio {
  id_convenio: number;
  id_aseguradora: number;
  aseguradora_nombre?: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  porcentaje_cobertura: string;
  copago_monto: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  vigente_hoy?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AfiliacionSeguro {
  id_afiliacion: number;
  id_paciente: number;
  id_convenio: number;
  paciente_nombre?: string;
  convenio_nombre?: string;
  aseguradora_nombre?: string;
  numero_afiliado: string;
  numero_poliza: string;
  titular_nombre: string;
  es_titular: boolean;
  es_principal: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  vigente_hoy?: boolean;
}

export interface VerificarCoberturaResult {
  tiene_cobertura: boolean;
  motivo?: string;
  paciente_id: number;
  fecha_referencia: string;
  afiliacion_id?: number;
  numero_afiliado?: string;
  es_principal?: boolean;
  convenio?: {
    id: number;
    codigo: string;
    nombre: string;
    porcentaje_cobertura: string;
    copago_monto: string;
  };
  aseguradora?: {
    id: number;
    codigo: string;
    nombre: string;
  };
}

const BASE = '/seguros';

export const segurosService = {
  async listAseguradoras(params?: { search?: string; activo?: boolean }): Promise<Aseguradora[]> {
    const { data } = await api.get<Aseguradora[] | PaginatedResponse<Aseguradora>>(
      `${BASE}/aseguradoras/`,
      { params },
    );
    return unwrapList(data);
  },

  async updateAseguradora(id: number, payload: Partial<Aseguradora>): Promise<Aseguradora> {
    const { data } = await api.patch<Aseguradora>(`${BASE}/aseguradoras/${id}/`, payload);
    return data;
  },

  async createAseguradora(payload: Partial<Aseguradora>): Promise<Aseguradora> {
    try {
      const { data } = await api.post<Aseguradora>(`${BASE}/aseguradoras/`, payload);
      return data;
    } catch (error) {
      throw apiError(error, 'No se pudo crear la aseguradora.');
    }
  },


  async listConvenios(params?: {
    search?: string;
    activo?: boolean;
    id_aseguradora?: number;
  }): Promise<Convenio[]> {
    const { data } = await api.get<Convenio[] | PaginatedResponse<Convenio>>(
      `${BASE}/convenios/`,
      { params },
    );
    return unwrapList(data);
  },

  async updateConvenio(id: number, payload: Partial<Convenio>): Promise<Convenio> {
    const { data } = await api.patch<Convenio>(`${BASE}/convenios/${id}/`, payload);
    return data;
  },

  async createConvenio(payload: Partial<Convenio>): Promise<Convenio> {
    try {
      const { data } = await api.post<Convenio>(`${BASE}/convenios/`, payload);
      return data;
    } catch (error) {
      throw apiError(error, 'No se pudo crear el convenio.');
    }
  },


  async listAfiliaciones(params?: {
    search?: string;
    id_paciente?: number;
    id_convenio?: number;
    es_principal?: boolean;
  }): Promise<AfiliacionSeguro[]> {
    const { data } = await api.get<AfiliacionSeguro[] | PaginatedResponse<AfiliacionSeguro>>(
      `${BASE}/afiliaciones/`,
      { params },
    );
    return unwrapList(data);
  },

  async updateAfiliacion(id: number, payload: Partial<AfiliacionSeguro>): Promise<AfiliacionSeguro> {
    const { data } = await api.patch<AfiliacionSeguro>(`${BASE}/afiliaciones/${id}/`, payload);
    return data;
  },

  async createAfiliacion(payload: Partial<AfiliacionSeguro>): Promise<AfiliacionSeguro> {
    try {
      const { data } = await api.post<AfiliacionSeguro>(`${BASE}/afiliaciones/`, payload);
      return data;
    } catch (error) {
      throw apiError(error, 'No se pudo crear la afiliación.');
    }
  },

  async deleteAfiliacion(id: number): Promise<void> {
    await api.delete(`${BASE}/afiliaciones/${id}/`);
  },


  async verificarCobertura(
    pacienteId: number,
    fecha?: string,
  ): Promise<VerificarCoberturaResult> {
    try {
      const { data } = await api.get<VerificarCoberturaResult>(
        `${BASE}/convenios/verificar-cobertura/`,
        { params: { paciente_id: pacienteId, fecha } },
      );
      return data;
    } catch (error) {
      throw apiError(error, 'No se pudo verificar la cobertura.');
    }
  },
};
