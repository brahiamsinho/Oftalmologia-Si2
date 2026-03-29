/**
 * lib/services/pacientes.ts
 *
 * CRUD de pacientes.
 * Rutas del backend:
 *   GET    /api/pacientes/          — lista con paginación, búsqueda y filtros
 *   POST   /api/pacientes/          — crear paciente
 *   GET    /api/pacientes/{id}/     — obtener uno
 *   PATCH  /api/pacientes/{id}/     — editar parcial
 *   DELETE /api/pacientes/{id}/     — eliminar
 *
 * Query params soportados por el backend:
 *   ?search=    — busca en nombres, apellidos, numero_historia, numero_documento, email
 *   ?estado_paciente=  — filtra por estado
 *   ?sexo=             — filtra por sexo
 *   ?ordering=         — campo de ordenamiento (ej. apellidos, -fecha_registro)
 *   ?page=             — paginación
 */

import api from '@/lib/api';
import type { Paciente, PacienteCreate, PaginatedResponse } from '@/lib/types';

export interface PacientesParams {
  search?: string;
  estado_paciente?: string;
  sexo?: string;
  ordering?: string;
  page?: number;
}

export const pacientesService = {
  /** Lista paginada de pacientes */
  async list(params?: PacientesParams): Promise<PaginatedResponse<Paciente>> {
    const { data } = await api.get<PaginatedResponse<Paciente>>('/pacientes/', { params });
    return data;
  },

  /** Obtener un paciente por ID */
  async get(id: number): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`/pacientes/${id}/`);
    return data;
  },

  /** Crear nuevo paciente */
  async create(payload: PacienteCreate): Promise<Paciente> {
    const { data } = await api.post<Paciente>('/pacientes/', payload);
    return data;
  },

  /** Actualizar parcialmente un paciente */
  async update(id: number, payload: Partial<PacienteCreate>): Promise<Paciente> {
    const { data } = await api.patch<Paciente>(`/pacientes/${id}/`, payload);
    return data;
  },

  /** Eliminar paciente */
  async delete(id: number): Promise<void> {
    await api.delete(`/pacientes/${id}/`);
  },
};
