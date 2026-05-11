/**
 * lib/services/evaluacion_quirurgica.ts
 *
 * CRUD de evaluaciones quirúrgicas.
 * Rutas del backend:
 *   GET    /evaluaciones-quirurgicas/           — lista paginada con filtros
 *   POST   /evaluaciones-quirurgicas/           — crear evaluación
 *   GET    /evaluaciones-quirurgicas/{id}/      — detalle
 *   PATCH  /evaluaciones-quirurgicas/{id}/      — editar parcial
 *   DELETE /evaluaciones-quirurgicas/{id}/      — eliminar
 *
 * Query params soportados:
 *   ?search=               — busca en nombres/apellidos paciente, hallazgos, observaciones
 *   ?estado_prequirurgico= — filtra por estado (PENDIENTE|APTO|APTO_CON_OBSERVACIONES|NO_APTO)
 *   ?id_paciente=          — filtra por paciente ID
 *   ?id_historia_clinica=  — filtra por historia ID
 *   ?ordering=             — campo de orden (fecha_evaluacion, created_at, updated_at)
 *   ?page=                 — paginación
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

// ── Constantes de estado prequirúrgico ──────────────────────────────────────
export const ESTADO_PREQUIRURGICO = {
  PENDIENTE:               'PENDIENTE',
  APTO:                    'APTO',
  APTO_CON_OBSERVACIONES:  'APTO_CON_OBSERVACIONES',
  NO_APTO:                 'NO_APTO',
} as const;

export type EstadoPrequirurgico = keyof typeof ESTADO_PREQUIRURGICO;

export const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE:              'Pendiente',
  APTO:                   'Apto',
  APTO_CON_OBSERVACIONES: 'Apto con observaciones',
  NO_APTO:                'No apto',
};

// ── Interfaces de datos ─────────────────────────────────────────────────────
export interface EvaluacionQuirurgica {
  id_evaluacion_quirurgica: number;
  id_paciente: number;
  id_historia_clinica: number;
  id_consulta: number | null;
  evaluado_por: number | null;
  fecha_evaluacion: string;
  estado_prequirurgico: string;
  riesgo_quirurgico: string | null;
  requiere_estudios_complementarios: boolean;
  estudios_solicitados: string | null;
  hallazgos: string | null;
  plan_quirurgico: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluacionQuirurgicaCreate {
  id_paciente: number;
  id_historia_clinica: number;
  id_consulta?: number | null;
  fecha_evaluacion?: string;
  estado_prequirurgico?: string;
  riesgo_quirurgico?: string;
  requiere_estudios_complementarios?: boolean;
  estudios_solicitados?: string;
  hallazgos?: string;
  plan_quirurgico?: string;
  observaciones?: string;
}

export interface EvaluacionQuirurgicaParams {
  search?: string;
  estado_prequirurgico?: string;
  id_paciente?: number;
  id_historia_clinica?: number;
  ordering?: string;
  page?: number;
}

// ── Servicio ────────────────────────────────────────────────────────────────
export const evaluacionQuirurgicaService = {
  async list(
    params?: EvaluacionQuirurgicaParams,
  ): Promise<PaginatedResponse<EvaluacionQuirurgica>> {
    const { data } = await api.get<PaginatedResponse<EvaluacionQuirurgica>>(
      '/evaluaciones-quirurgicas/',
      { params },
    );
    return data;
  },

  async get(id: number): Promise<EvaluacionQuirurgica> {
    const { data } = await api.get<EvaluacionQuirurgica>(
      `/evaluaciones-quirurgicas/${id}/`,
    );
    return data;
  },

  async create(
    payload: EvaluacionQuirurgicaCreate,
  ): Promise<EvaluacionQuirurgica> {
    const { data } = await api.post<EvaluacionQuirurgica>(
      '/evaluaciones-quirurgicas/',
      payload,
    );
    return data;
  },

  async update(
    id: number,
    payload: Partial<EvaluacionQuirurgicaCreate>,
  ): Promise<EvaluacionQuirurgica> {
    const { data } = await api.patch<EvaluacionQuirurgica>(
      `/evaluaciones-quirurgicas/${id}/`,
      payload,
    );
    return data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/evaluaciones-quirurgicas/${id}/`);
  },
};
