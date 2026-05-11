/**
 * lib/services/crm.ts
 *
 * Servicios CRM — comunicación con pacientes y campañas.
 *
 * Modelos cubiertos:
 *   HistorialContacto  — comunicaciones individuales con pacientes
 *   CampanaCRM         — campañas que agrupan comunicaciones
 *
 * Rutas del backend:
 *   GET/POST            /crm-contactos/
 *   GET/PATCH/DELETE    /crm-contactos/{id}/
 *   GET/POST            /crm-campanas/
 *   GET/PATCH/DELETE    /crm-campanas/{id}/
 *
 * Filtros disponibles en /crm-contactos/:
 *   ?search=              busca en nombre paciente, asunto, mensaje, respuesta, observaciones
 *   ?id_paciente=
 *   ?id_campana=
 *   ?canal=               LLAMADA | WHATSAPP | EMAIL | SMS | OTRO
 *   ?tipo_mensaje=        RECORDATORIO | NOTIFICACION | SEGUIMIENTO | RESULTADO | INFORMATIVO | OTRO
 *   ?estado_comunicacion= PENDIENTE | ENVIADO | ENTREGADO | LEIDO | RESPONDIDO | FALLIDO
 *   ?ordering=            fecha_contacto | created_at | updated_at
 *   ?page=
 *
 * Regla de negocio:
 *   estado_comunicacion = RESPONDIDO  →  respuesta_paciente obligatoria.
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

// ── Canal de contacto ──────────────────────────────────────────────────────
export const CANAL_CONTACTO = {
  LLAMADA:  'LLAMADA',
  WHATSAPP: 'WHATSAPP',
  EMAIL:    'EMAIL',
  SMS:      'SMS',
  OTRO:     'OTRO',
} as const;

export const CANAL_LABELS: Record<string, string> = {
  LLAMADA:  'Llamada',
  WHATSAPP: 'WhatsApp',
  EMAIL:    'Email',
  SMS:      'SMS',
  OTRO:     'Otro',
};

// ── Tipo de mensaje (propósito semántico) ─────────────────────────────────
export const TIPO_MENSAJE = {
  RECORDATORIO: 'RECORDATORIO',
  NOTIFICACION: 'NOTIFICACION',
  SEGUIMIENTO:  'SEGUIMIENTO',
  RESULTADO:    'RESULTADO',
  INFORMATIVO:  'INFORMATIVO',
  OTRO:         'OTRO',
} as const;

export const TIPO_MENSAJE_LABELS: Record<string, string> = {
  RECORDATORIO: 'Recordatorio',
  NOTIFICACION: 'Notificación',
  SEGUIMIENTO:  'Seguimiento',
  RESULTADO:    'Resultado de examen',
  INFORMATIVO:  'Informativo',
  OTRO:         'Otro',
};

// ── Estado del ciclo de vida ──────────────────────────────────────────────
export const ESTADO_COMUNICACION = {
  PENDIENTE:  'PENDIENTE',
  ENVIADO:    'ENVIADO',
  ENTREGADO:  'ENTREGADO',
  LEIDO:      'LEIDO',
  RESPONDIDO: 'RESPONDIDO',
  FALLIDO:    'FALLIDO',
} as const;

export const ESTADO_COM_LABELS: Record<string, string> = {
  PENDIENTE:  'Pendiente',
  ENVIADO:    'Enviado',
  ENTREGADO:  'Entregado',
  LEIDO:      'Leído',
  RESPONDIDO: 'Respondido',
  FALLIDO:    'Fallido',
};

// ── Interfaces ────────────────────────────────────────────────────────────
export interface HistorialContacto {
  id_historial_contacto: number;
  id_paciente: number;
  id_campana: number | null;
  canal: string;
  tipo_mensaje: string;
  fecha_contacto: string;
  asunto: string | null;
  mensaje: string | null;
  respuesta_paciente: string | null;
  resultado: string | null;
  estado_comunicacion: string;
  observaciones: string | null;
  contactado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface HistorialContactoCreate {
  id_paciente: number;
  id_campana?: number | null;
  canal: string;
  tipo_mensaje?: string;
  fecha_contacto?: string;
  asunto?: string;
  mensaje?: string;
  respuesta_paciente?: string;
  resultado?: string;
  estado_comunicacion?: string;
  observaciones?: string;
}

export interface HistorialContactoParams {
  search?: string;
  id_paciente?: number;
  id_campana?: number;
  canal?: string;
  tipo_mensaje?: string;
  estado_comunicacion?: string;
  ordering?: string;
  page?: number;
}

export interface CampanaCRM {
  id_campana: number;
  nombre: string;
  descripcion: string | null;
  id_segmentacion: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentacionPaciente {
  id_segmentacion: number;
  nombre: string;
  descripcion: string | null;
  criterios: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ── Servicios ─────────────────────────────────────────────────────────────
export const historialContactoService = {
  async list(params?: HistorialContactoParams): Promise<PaginatedResponse<HistorialContacto>> {
    const { data } = await api.get<PaginatedResponse<HistorialContacto>>(
      '/crm-contactos/',
      { params },
    );
    return data;
  },

  async get(id: number): Promise<HistorialContacto> {
    const { data } = await api.get<HistorialContacto>(`/crm-contactos/${id}/`);
    return data;
  },

  async create(payload: HistorialContactoCreate): Promise<HistorialContacto> {
    const { data } = await api.post<HistorialContacto>('/crm-contactos/', payload);
    return data;
  },

  async update(
    id: number,
    payload: Partial<HistorialContactoCreate>,
  ): Promise<HistorialContacto> {
    const { data } = await api.patch<HistorialContacto>(
      `/crm-contactos/${id}/`,
      payload,
    );
    return data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/crm-contactos/${id}/`);
  },
};

export const campanaCRMService = {
  async list(params?: { search?: string; estado?: string }): Promise<PaginatedResponse<CampanaCRM>> {
    const { data } = await api.get<PaginatedResponse<CampanaCRM>>(
      '/crm-campanas/',
      { params },
    );
    return data;
  },
};

export const segmentacionCRMService = {
  async list(params?: { search?: string }): Promise<PaginatedResponse<SegmentacionPaciente>> {
    const { data } = await api.get<PaginatedResponse<SegmentacionPaciente>>(
      '/crm-segmentaciones/',
      { params },
    );
    return data;
  },
};
