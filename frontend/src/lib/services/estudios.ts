/**
 * Estudios oftalmológicos distintos de agudeza (modelo Estudio).
 * Agudeza visual: ver `medicion_visual.ts` (/medicion-visual/registros/).
 * Router: /consultas/estudios/
 */
import api, { fetchAll } from '../api';

export interface EstudioItem {
  id: number;
  paciente: number;
  consulta: number | null;
  tipo_estudio: string;
  ojo_derecho: string | null;
  ojo_izquierdo: string | null;
  observaciones: string | null;
  archivo_resultado: string | null;
  fecha: string;
}

export async function listEstudios(): Promise<EstudioItem[]> {
  return fetchAll<EstudioItem>('/consultas/estudios/');
}

export async function deleteEstudio(id: number): Promise<void> {
  await api.delete(`/consultas/estudios/${id}/`);
}

export type EstudioUpdatePayload = {
  paciente: number;
  tipo_estudio: string;
  ojo_derecho: string;
  ojo_izquierdo: string;
  observaciones: string;
};

export async function updateEstudioJson(id: number, body: EstudioUpdatePayload): Promise<EstudioItem> {
  const { data } = await api.patch<EstudioItem>(`/consultas/estudios/${id}/`, body);
  return data;
}

export async function updateEstudioMultipart(
  id: number,
  body: EstudioUpdatePayload,
  archivo: File,
): Promise<EstudioItem> {
  const fd = new FormData();
  fd.append('paciente', String(body.paciente));
  fd.append('tipo_estudio', body.tipo_estudio);
  fd.append('ojo_derecho', body.ojo_derecho);
  fd.append('ojo_izquierdo', body.ojo_izquierdo);
  fd.append('observaciones', body.observaciones);
  fd.append('archivo_resultado', archivo);
  const { data } = await api.patch<EstudioItem>(`/consultas/estudios/${id}/`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
