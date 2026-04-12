/**
 * Lista y consulta de registros clínicos (Consulta).
 * POST desde registrar-consulta usa /consultas/lista/; listado GET el mismo prefijo del router.
 */
import { fetchAll } from '../api';

export interface ConsultaListaItem {
  id: number;
  paciente: number;
  cita: number | null;
  especialista: number | null;
  fecha: string;
  motivo: string;
  sintomas: string;
  notas_clinicas: string;
}

export async function listConsultas(): Promise<ConsultaListaItem[]> {
  return fetchAll<ConsultaListaItem>('/consultas/lista/');
}
