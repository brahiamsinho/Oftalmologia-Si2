/**
 * lib/services/postoperatorio.ts
 *
 * CRUD de seguimiento postoperatorio.
 * Rutas del backend:
 *   GET    /postoperatorios/           — lista paginada con filtros
 *   POST   /postoperatorios/           — crear registro (profesional_atiende = request.user auto)
 *   GET    /postoperatorios/{id}/      — detalle
 *   PATCH  /postoperatorios/{id}/      — editar parcial
 *   DELETE /postoperatorios/{id}/      — eliminar
 *
 * Query params soportados:
 *   ?search=                  — busca en nombres/apellidos paciente, alertas, observaciones
 *   ?estado_postoperatorio=   — filtra por estado
 *   ?id_paciente=             — filtra por paciente
 *   ?id_cirugia=              — filtra por cirugía
 *   ?fecha=YYYY-MM-DD         — filtra por fecha_control (día exacto)
 *   ?ordering=                — fecha_control, proximo_control, created_at, updated_at
 *   ?page=                    — paginación
 *
 * Reglas de negocio (validadas también en frontend):
 *   1. fecha_control es OBLIGATORIA.
 *   2. proximo_control >= fecha_control (validación cronológica).
 *   3. id_cirugia debe corresponder al paciente seleccionado.
 *   4. profesional_atiende se asigna automáticamente (no se edita desde el form).
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

// ── Constantes ──────────────────────────────────────────────────────────────
export const ESTADO_POSTOP = {
  ESTABLE:        'ESTABLE',
  EN_OBSERVACION: 'EN_OBSERVACION',
  COMPLICADO:     'COMPLICADO',
  CERRADO:        'CERRADO',
} as const;

export type EstadoPostoperatorio = keyof typeof ESTADO_POSTOP;

export const ESTADO_POSTOP_LABELS: Record<string, string> = {
  ESTABLE:        'Estable',
  EN_OBSERVACION: 'En observación',
  COMPLICADO:     'Complicado',
  CERRADO:        'Cerrado',
};

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface Postoperatorio {
  id_postoperatorio: number;
  id_paciente: number;
  id_historia_clinica: number;
  id_cirugia: number | null;
  profesional_atiende: number | null;
  estado_postoperatorio: string;
  fecha_control: string;
  proximo_control: string | null;
  alertas: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostoperatorioCreate {
  id_paciente: number;
  id_historia_clinica: number;
  id_cirugia?: number | null;
  estado_postoperatorio?: string;
  fecha_control: string;
  proximo_control?: string | null;
  alertas?: string;
  observaciones?: string;
}

export interface PostoperatorioParams {
  search?: string;
  estado_postoperatorio?: string;
  id_paciente?: number;
  id_cirugia?: number;
  fecha?: string;           // filtro especial del backend: fecha_control__date
  ordering?: string;
  page?: number;
}

// ── Servicio ────────────────────────────────────────────────────────────────
export const postoperatorioService = {
  async list(params?: PostoperatorioParams): Promise<PaginatedResponse<Postoperatorio>> {
    const { data } = await api.get<PaginatedResponse<Postoperatorio>>(
      '/postoperatorios/',
      { params },
    );
    return data;
  },

  async get(id: number): Promise<Postoperatorio> {
    const { data } = await api.get<Postoperatorio>(`/postoperatorios/${id}/`);
    return data;
  },

  async create(payload: PostoperatorioCreate): Promise<Postoperatorio> {
    const { data } = await api.post<Postoperatorio>('/postoperatorios/', payload);
    return data;
  },

  async update(
    id: number,
    payload: Partial<PostoperatorioCreate>,
  ): Promise<Postoperatorio> {
    const { data } = await api.patch<Postoperatorio>(
      `/postoperatorios/${id}/`,
      payload,
    );
    return data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/postoperatorios/${id}/`);
  },
};
