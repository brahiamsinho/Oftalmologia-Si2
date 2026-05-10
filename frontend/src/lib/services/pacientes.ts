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
 *   ?sin_cuenta=true  — solo pacientes sin usuario vinculado (GET)
 */

import api, { fetchAll } from "@/lib/api";
import type { Paciente, PacienteCreate, PaginatedResponse } from "@/lib/types";

export interface PacientesParams {
  search?: string;
  estado_paciente?: string;
  sexo?: string;
  ordering?: string;
  page?: number;
  /** Solo pacientes sin usuario vinculado (para enlazar cuenta móvil). */
  sin_cuenta?: boolean;
}

export const pacientesService = {
  /** Lista paginada de pacientes */
  async list(params?: PacientesParams): Promise<PaginatedResponse<Paciente>> {
    const { sin_cuenta, ...rest } = params ?? {};
    const axiosParams: Record<string, string | number | undefined> = {
      ...rest,
    };
    if (sin_cuenta) axiosParams.sin_cuenta = "true";
    const { data } = await api.get<PaginatedResponse<Paciente>>("/pacientes/", {
      params: axiosParams,
    });
    return data;
  },

  /** Todas las fichas sin cuenta (paginación agregada). Opcional `search`. */
  async listAllSinCuenta(search?: string): Promise<Paciente[]> {
    const q = new URLSearchParams({
      sin_cuenta: "true",
      ordering: "apellidos",
    });
    if (search?.trim()) q.set("search", search.trim());
    return fetchAll<Paciente>(`/pacientes/?${q.toString()}`);
  },

  /** Todas las fichas (paginación agregada). Para selectores en cirugías y similares. */
  async listAll(params?: Omit<PacientesParams, "page">): Promise<Paciente[]> {
    const q = new URLSearchParams({ ordering: "apellidos" });
    if (params?.search?.trim()) q.set("search", params.search.trim());
    if (params?.estado_paciente)
      q.set("estado_paciente", params.estado_paciente);
    if (params?.sexo) q.set("sexo", params.sexo);
    if (params?.sin_cuenta) q.set("sin_cuenta", "true");
    if (params?.ordering) q.set("ordering", params.ordering);
    return fetchAll<Paciente>(`/pacientes/?${q.toString()}`);
  },

  /** Obtener un paciente por ID */
  async get(id: number): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`/pacientes/${id}/`);
    return data;
  },

  /** Crear nuevo paciente */
  async create(payload: PacienteCreate): Promise<Paciente> {
    const { data } = await api.post<Paciente>("/pacientes/", payload);
    return data;
  },

  /** Actualizar parcialmente un paciente */
  async update(
    id: number,
    payload: Partial<PacienteCreate>,
  ): Promise<Paciente> {
    const { data } = await api.patch<Paciente>(`/pacientes/${id}/`, payload);
    return data;
  },

  /** Eliminar paciente */
  async delete(id: number): Promise<void> {
    await api.delete(`/pacientes/${id}/`);
  },
};
