/**
 * Agudeza visual (modelo MedicionVisual). Router: /medicion-visual/registros/
 */
import api, { fetchAll } from '../api';

export interface MedicionVisualItem {
  id: number;
  paciente: number;
  consulta: number | null;
  ojo_derecho: string | null;
  ojo_izquierdo: string | null;
  observaciones: string | null;
  archivo_resultado: string | null;
  fecha: string;
}

export async function listMedicionesVisuales(): Promise<MedicionVisualItem[]> {
  return fetchAll<MedicionVisualItem>('/medicion-visual/registros/');
}

export async function deleteMedicionVisual(id: number): Promise<void> {
  await api.delete(`/medicion-visual/registros/${id}/`);
}

export type MedicionVisualUpdatePayload = {
  paciente: number;
  consulta?: number | null;
  ojo_derecho: string;
  ojo_izquierdo: string;
  observaciones: string;
};

export async function updateMedicionVisualJson(
  id: number,
  body: MedicionVisualUpdatePayload,
): Promise<MedicionVisualItem> {
  const { data } = await api.patch<MedicionVisualItem>(`/medicion-visual/registros/${id}/`, body);
  return data;
}

export async function updateMedicionVisualMultipart(
  id: number,
  body: MedicionVisualUpdatePayload,
  archivo: File,
): Promise<MedicionVisualItem> {
  const fd = new FormData();
  fd.append('paciente', String(body.paciente));
  if (body.consulta != null) {
    fd.append('consulta', String(body.consulta));
  }
  fd.append('ojo_derecho', body.ojo_derecho);
  fd.append('ojo_izquierdo', body.ojo_izquierdo);
  fd.append('observaciones', body.observaciones);
  fd.append('archivo_resultado', archivo);
  const { data } = await api.patch<MedicionVisualItem>(`/medicion-visual/registros/${id}/`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
