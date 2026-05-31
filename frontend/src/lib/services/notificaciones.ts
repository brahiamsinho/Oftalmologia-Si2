/**
 * lib/services/notificaciones.ts
 *
 * CU18 — Gestionar recordatorios y notificaciones automáticas
 *
 * Rutas del backend (prefijo /api/notificaciones/):
 *   GET              /                     → historial del usuario autenticado
 *   POST             /<pk>/leer/           → marcar una como leída
 *   POST             /leer-todas/          → marcar todas leídas
 *   POST             /dispositivos/        → registrar token FCM
 *   DELETE           /dispositivos/        → quitar token FCM
 *
 *   GET              /reglas/              → listar reglas de recordatorio
 *   POST             /reglas/              → crear regla
 *   PUT/PATCH        /reglas/<id>/         → editar regla
 *   DELETE           /reglas/<id>/         → eliminar regla
 *
 *   GET              /tareas/              → listar tareas programadas (?estado=)
 *   POST             /tareas/generar/      → generar tarea manual
 *   POST             /tareas/procesar/     → procesar lote pendientes
 *
 *   GET              /logs/                → historial de ejecución
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

// ── Enums ──────────────────────────────────────────────────────────────────

export const ESTADO_TAREA = {
  PENDIENTE:  'PENDIENTE',
  PROCESADA:  'PROCESADA',
  ERROR:      'ERROR',
  CANCELADA:  'CANCELADA',
} as const;

export const ESTADO_TAREA_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PROCESADA: 'Procesada',
  ERROR:     'Error',
  CANCELADA: 'Cancelada',
};

export const TIPO_REGLA = {
  RECORDATORIO_CITA:           'RECORDATORIO_CITA',
  CONTROL_POSTOPERATORIO:      'CONTROL_POSTOPERATORIO',
} as const;

export const TIPO_REGLA_LABEL: Record<string, string> = {
  RECORDATORIO_CITA:       'Recordatorio de cita',
  CONTROL_POSTOPERATORIO:  'Control postoperatorio',
};

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface Notificacion {
  id: number;
  titulo: string;
  cuerpo: string;
  tipo: string;
  leida: boolean;
  creada_en: string;
}

export interface NotificacionesListResponse {
  count: number;
  no_leidas: number;
  results: Notificacion[];
}

export interface ReglaRecordatorio {
  id_regla: string;
  nombre: string;
  tipo_regla: keyof typeof TIPO_REGLA;
  horas_antes: number;
  titulo_template: string;
  cuerpo_template: string;
  activa: boolean;
  creado_por?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReglaRecordatorioPayload {
  nombre: string;
  tipo_regla: string;
  horas_antes: number;
  titulo_template: string;
  cuerpo_template: string;
  activa?: boolean;
}

export interface TareaRecordatorioProgramada {
  id_tarea: string;
  id_regla: string;
  nombre_regla?: string;
  id_paciente: string;
  nombre_paciente?: string;
  id_postoperatorio?: string | null;
  id_cita?: string | null;
  programada_para: string;
  estado: keyof typeof ESTADO_TAREA;
  intentos: number;
  procesada_en?: string | null;
  payload?: Record<string, unknown>;
}

export interface GenerarTareaPayload {
  id_regla: string;
  id_paciente: string;
  id_cita?: string;
  id_postoperatorio?: string;
  programada_para: string;
}

export interface LogEjecucion {
  id_log: string;
  id_tarea: string;
  nivel: 'INFO' | 'ERROR';
  mensaje: string;
  detalle?: string;
  ejecutado_en: string;
}

// ── Servicio ───────────────────────────────────────────────────────────────

export const notificacionesService = {
  // ── Historial de notificaciones del usuario ──
  async list(params?: { no_leidas?: boolean }): Promise<NotificacionesListResponse> {
    const { data } = await api.get<NotificacionesListResponse>('/notificaciones/', { params });
    return data;
  },

  async marcarLeida(pk: number): Promise<void> {
    await api.post(`/notificaciones/${pk}/leer/`);
  },

  async marcarTodasLeidas(): Promise<void> {
    await api.post('/notificaciones/leer-todas/');
  },

  // ── Dispositivos FCM ──
  async registrarDispositivo(token: string, plataforma: 'android' | 'ios' | 'web' = 'web'): Promise<void> {
    await api.post('/notificaciones/dispositivos/', { token, plataforma });
  },

  async eliminarDispositivo(token: string): Promise<void> {
    await api.delete('/notificaciones/dispositivos/', { params: { token } });
  },

  // ── Reglas de recordatorio ──
  async listReglas(): Promise<ReglaRecordatorio[]> {
    const { data } = await api.get<ReglaRecordatorio[] | PaginatedResponse<ReglaRecordatorio>>(
      '/notificaciones/reglas/'
    );
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<ReglaRecordatorio>).results ?? [];
  },

  async createRegla(payload: ReglaRecordatorioPayload): Promise<ReglaRecordatorio> {
    const { data } = await api.post<ReglaRecordatorio>('/notificaciones/reglas/', payload);
    return data;
  },

  async updateRegla(id: string, payload: Partial<ReglaRecordatorioPayload>): Promise<ReglaRecordatorio> {
    const { data } = await api.patch<ReglaRecordatorio>(`/notificaciones/reglas/${id}/`, payload);
    return data;
  },

  async deleteRegla(id: string): Promise<void> {
    await api.delete(`/notificaciones/reglas/${id}/`);
  },

  // ── Tareas programadas ──
  async listTareas(params?: { estado?: string }): Promise<TareaRecordatorioProgramada[]> {
    const { data } = await api.get<TareaRecordatorioProgramada[] | PaginatedResponse<TareaRecordatorioProgramada>>(
      '/notificaciones/tareas/', { params }
    );
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<TareaRecordatorioProgramada>).results ?? [];
  },

  async generarTarea(payload: GenerarTareaPayload): Promise<TareaRecordatorioProgramada> {
    const { data } = await api.post<TareaRecordatorioProgramada>('/notificaciones/tareas/generar/', payload);
    return data;
  },

  async procesarLote(): Promise<{ procesadas: number }> {
    const { data } = await api.post<{ procesadas: number }>('/notificaciones/tareas/procesar/');
    return data;
  },

  // ── Logs de ejecución ──
  async listLogs(params?: { id_tarea?: string }): Promise<LogEjecucion[]> {
    const { data } = await api.get<LogEjecucion[] | PaginatedResponse<LogEjecucion>>(
      '/notificaciones/logs/', { params }
    );
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<LogEjecucion>).results ?? [];
  },
};
