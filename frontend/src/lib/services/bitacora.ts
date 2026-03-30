/**
 * lib/services/bitacora.ts
 *
 * Solo lectura del log de auditoría.
 * Ruta del backend:
 *   GET /api/bitacora/   — lista paginada, solo admins
 *
 * Query params:
 *   ?accion=    — filtra por acción
 *   ?modulo=    — filtra por módulo
 *   ?search=    — busca en descripción
 *   ?ordering=  — campo de orden (ej. -fecha_evento)
 *   ?page=
 */

import api from '@/lib/api';
import type { PaginatedResponse, RegistroBitacora } from '@/lib/types';

export interface BitacoraParams {
  accion?: string;
  modulo?: string;
  search?: string;
  ordering?: string;
  page?: number;
}

export const bitacoraService = {
  async list(params?: BitacoraParams): Promise<PaginatedResponse<RegistroBitacora>> {
    const { data } = await api.get<PaginatedResponse<RegistroBitacora>>('/bitacora/', { params });
    return data;
  },
};
