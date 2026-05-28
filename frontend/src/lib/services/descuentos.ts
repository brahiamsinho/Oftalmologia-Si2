/**
 * Descuentos y campañas clínicas.
 *
 * Rutas: /descuentos/promociones/ | /descuentos/beneficios/
 *        GET /descuentos/promociones/aplicables/?paciente_id=
 */
import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

function unwrapList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export interface PromocionDescuento {
  id_promocion: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_beneficio: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: string;
  alcance: 'GENERAL' | 'ASIGNADA';
  compatibilidad_seguro: string;
  acumulable: boolean;
  condiciones_aplicacion: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  vigente_hoy?: boolean;
}

export interface BeneficioAplicableItem {
  id_promocion: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_beneficio: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: string;
  aplicable: boolean;
  motivo_no_aplicable?: string;
  vigente_hoy?: boolean;
}

export interface BeneficiosAplicablesResult {
  paciente_id: number;
  fecha_referencia: string;
  beneficios: BeneficioAplicableItem[];
  mejor_beneficio: BeneficioAplicableItem | null;
  total_aplicables: number;
  motivo?: string;
}

const BASE = '/descuentos';

export const descuentosService = {
  async createPromocion(payload: Partial<PromocionDescuento>): Promise<PromocionDescuento> {
    const { data } = await api.post<PromocionDescuento>(`${BASE}/promociones/`, payload);
    return data;
  },
  async updatePromocion(id: number, payload: Partial<PromocionDescuento>): Promise<PromocionDescuento> {
    const { data } = await api.patch<PromocionDescuento>(`${BASE}/promociones/${id}/`, payload);
    return data;
  },
  async listPromociones(): Promise<PromocionDescuento[]> {
    const { data } = await api.get<PromocionDescuento[] | PaginatedResponse<PromocionDescuento>>(
      `${BASE}/promociones/`,
    );
    return unwrapList(data);
  },

  async beneficiosAplicables(pacienteId: number, fecha?: string): Promise<BeneficiosAplicablesResult> {
    const { data } = await api.get<BeneficiosAplicablesResult>(
      `${BASE}/promociones/aplicables/`,
      { params: { paciente_id: pacienteId, fecha } },
    );
    return data;
  },
};
