/**
 * lib/services/cirugias.ts
 *
 * CRUD de cirugías oftalmológicas (CU14).
 * Rutas del backend:
 *   GET    /cirugias/                   — lista paginada con filtros
 *   POST   /cirugias/                   — crear cirugía (cirujano = request.user auto)
 *   GET    /cirugias/{id}/              — detalle
 *   PATCH  /cirugias/{id}/              — editar parcial
 *   DELETE /cirugias/{id}/              — eliminar
 *   POST   /cirugias/{id}/reprogramar/  — acción especial: reprogramar cirugía
 *
 * Query params soportados:
 *   ?search=          — busca en nombres/apellidos paciente, procedimiento, resultado, complicaciones
 *   ?estado_cirugia=  — filtra por estado
 *   ?id_paciente=     — filtra por paciente
 *   ?cirujano=        — filtra por cirujano
 *   ?ordering=        — fecha_programada, fecha_real_inicio, fecha_real_fin, created_at
 *   ?page=            — paginación
 *
 * Reglas de negocio (validadas también en frontend):
 *   1. fecha_programada es OBLIGATORIA siempre.
 *   2. procedimiento es OBLIGATORIO siempre.
 *   3. Para estado = FINALIZADA → fecha_real_inicio y fecha_real_fin son OBLIGATORIAS.
 *   4. Si fecha_real_inicio y fecha_real_fin → fecha_real_inicio <= fecha_real_fin.
 *   5. cirujano se asigna automáticamente al usuario que crea (perform_create en backend).
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

// ── Constantes ──────────────────────────────────────────────────────────────
export const ESTADO_CIRUGIA = {
  PROGRAMADA:   'PROGRAMADA',
  REPROGRAMADA: 'REPROGRAMADA',
  EN_CURSO:     'EN_CURSO',
  FINALIZADA:   'FINALIZADA',
  CANCELADA:    'CANCELADA',
} as const;

export type EstadoCirugia = keyof typeof ESTADO_CIRUGIA;

export const ESTADO_CIRUGIA_LABELS: Record<string, string> = {
  PROGRAMADA:   'Programada',
  REPROGRAMADA: 'Reprogramada',
  EN_CURSO:     'En curso',
  FINALIZADA:   'Finalizada',
  CANCELADA:    'Cancelada',
};

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface Cirugia {
  id_cirugia: number;
  id_paciente: number;
  id_historia_clinica: number;
  id_preoperatorio: number | null;
  id_cita: number | null;
  cirujano: number | null;
  estado_cirugia: string;
  fecha_programada: string;
  fecha_real_inicio: string | null;
  fecha_real_fin: string | null;
  procedimiento: string;
  resultado: string | null;
  complicaciones: string | null;
  observaciones: string | null;
  motivo_reprogramacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface CirugiaCreate {
  id_paciente: number;
  id_historia_clinica: number;
  id_preoperatorio?: number | null;
  id_cita?: number | null;
  estado_cirugia?: string;
  fecha_programada: string;
  fecha_real_inicio?: string | null;
  fecha_real_fin?: string | null;
  procedimiento: string;
  resultado?: string;
  complicaciones?: string;
  observaciones?: string;
  motivo_reprogramacion?: string;
}

export interface CirugiaReprogramar {
  fecha_programada: string;
  motivo_reprogramacion?: string;
}

export interface CirugiaParams {
  search?: string;
  estado_cirugia?: string;
  id_paciente?: number;
  cirujano?: number;
  ordering?: string;
  page?: number;
}

// ── Servicio ────────────────────────────────────────────────────────────────
export const cirugiasService = {
  async list(params?: CirugiaParams): Promise<PaginatedResponse<Cirugia>> {
    const { data } = await api.get<PaginatedResponse<Cirugia>>(
      '/cirugias/',
      { params },
    );
    return data;
  },

  async get(id: number): Promise<Cirugia> {
    const { data } = await api.get<Cirugia>(`/cirugias/${id}/`);
    return data;
  },

  async create(payload: CirugiaCreate): Promise<Cirugia> {
    const { data } = await api.post<Cirugia>('/cirugias/', payload);
    return data;
  },

  async update(id: number, payload: Partial<CirugiaCreate>): Promise<Cirugia> {
    const { data } = await api.patch<Cirugia>(`/cirugias/${id}/`, payload);
    return data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/cirugias/${id}/`);
  },

  /** Acción especial: reprogramar cirugía → cambia fecha y estado a REPROGRAMADA */
  async reprogramar(id: number, payload: CirugiaReprogramar): Promise<Cirugia> {
    const { data } = await api.post<Cirugia>(
      `/cirugias/${id}/reprogramar/`,
      payload,
    );
    return data;
  },
};
