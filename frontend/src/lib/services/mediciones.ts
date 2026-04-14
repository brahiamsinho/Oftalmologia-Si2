/**
 * Lista unificada: agudeza (medicion_visual) + demás estudios (consultas.estudios).
 */
import type { EstudioItem } from './estudios';
import { listEstudios } from './estudios';
import type { MedicionVisualItem } from './medicion_visual';
import { listMedicionesVisuales } from './medicion_visual';

export type MedicionListItem =
  | ({ rowKind: 'medicion_visual' } & MedicionVisualItem)
  | ({ rowKind: 'estudio' } & EstudioItem);

export async function listMedicionesYEstudios(): Promise<MedicionListItem[]> {
  const [mv, est] = await Promise.all([listMedicionesVisuales(), listEstudios()]);
  const rows: MedicionListItem[] = [
    ...mv.map((m) => ({ rowKind: 'medicion_visual' as const, ...m })),
    ...est.map((e) => ({ rowKind: 'estudio' as const, ...e })),
  ];
  rows.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  return rows;
}
