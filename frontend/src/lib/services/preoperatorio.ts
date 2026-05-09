/**
 * lib/services/preoperatorio.ts
 *
 * CRUD de preoperatorios (CU13).
 * Rutas del backend:
 *   GET    /preoperatorios/           — lista paginada con filtros
 *   POST   /preoperatorios/           — crear preoperatorio
 *   GET    /preoperatorios/{id}/      — detalle
 *   PATCH  /preoperatorios/{id}/      — editar parcial
 *   DELETE /preoperatorios/{id}/      — eliminar
 *
 * Query params soportados:
 *   ?search=                   — busca en nombres/apellidos, checklist_detalle, exámenes, observaciones
 *   ?estado_preoperatorio=     — filtra por estado
 *   ?id_paciente=              — filtra por paciente ID
 *   ?id_historia_clinica=      — filtra por historia ID
 *   ?id_evaluacion_quirurgica= — filtra por evaluación quirúrgica
 *   ?ordering=                 — created_at, updated_at, fecha_programada_cirugia, fecha_validacion
 *   ?page=                     — paginación
 *
 * Regla de negocio (validada también en frontend):
 *   Para estado = APROBADO → checklist_completado y apto_anestesia deben ser true.
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

// ── Constantes ──────────────────────────────────────────────────────────────
export const ESTADO_PREOPERATORIO = {
  PENDIENTE:  'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  APROBADO:   'APROBADO',
  OBSERVADO:  'OBSERVADO',
  RECHAZADO:  'RECHAZADO',
} as const;

export type EstadoPreoperatorio = keyof typeof ESTADO_PREOPERATORIO;

export const ESTADO_PREOP_LABELS: Record<string, string> = {
  PENDIENTE:  'Pendiente',
  EN_PROCESO: 'En proceso',
  APROBADO:   'Aprobado',
  OBSERVADO:  'Observado',
  RECHAZADO:  'Rechazado',
};

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface Preoperatorio {
  id_preoperatorio: number;
  id_paciente: number;
  id_historia_clinica: number;
  id_evaluacion_quirurgica: number | null;
  id_cita: number | null;
  estado_preoperatorio: string;
  checklist_completado: boolean;
  checklist_detalle: string | null;
  examenes_requeridos: string | null;
  examenes_completados: string | null;
  apto_anestesia: boolean;
  fecha_programada_cirugia: string | null;
  observaciones: string | null;
  validado_por: number | null;
  fecha_validacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreoperatorioCreate {
  id_paciente: number;
  id_historia_clinica: number;
  id_evaluacion_quirurgica?: number | null;
  id_cita?: number | null;
  estado_preoperatorio?: string;
  checklist_completado?: boolean;
  checklist_detalle?: string;
  examenes_requeridos?: string;
  examenes_completados?: string;
  apto_anestesia?: boolean;
  fecha_programada_cirugia?: string | null;
  observaciones?: string;
}

export interface PreoperatorioParams {
  search?: string;
  estado_preoperatorio?: string;
  id_paciente?: number;
  id_historia_clinica?: number;
  id_evaluacion_quirurgica?: number;
  ordering?: string;
  page?: number;
}

// ── Servicio ────────────────────────────────────────────────────────────────
export const preoperatorioService = {
  async list(
    params?: PreoperatorioParams,
  ): Promise<PaginatedResponse<Preoperatorio>> {
    const { data } = await api.get<PaginatedResponse<Preoperatorio>>(
      '/preoperatorios/',
      { params },
    );
    return data;
  },

  async get(id: number): Promise<Preoperatorio> {
    const { data } = await api.get<Preoperatorio>(`/preoperatorios/${id}/`);
    return data;
  },

  async create(payload: PreoperatorioCreate): Promise<Preoperatorio> {
    const { data } = await api.post<Preoperatorio>('/preoperatorios/', payload);
    return data;
  },

  async update(
    id: number,
    payload: Partial<PreoperatorioCreate>,
  ): Promise<Preoperatorio> {
    const { data } = await api.patch<Preoperatorio>(
      `/preoperatorios/${id}/`,
      payload,
    );
    return data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/preoperatorios/${id}/`);
  },
};
