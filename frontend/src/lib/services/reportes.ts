/**
 * Servicio de plantillas y exportación QBE.
 */
import api from '@/lib/api';

import type { NlpToReportResponse, QBEPayload, ReportBundle } from '@/types/reportes';

export interface ReportTemplate {
  id: number;
  nombre: string;
  descripcion: string;
  qbe_payload: QBEPayload;
  is_system_report: boolean;
  created_by?: number | null;
  created_by_email?: string | null;
  created_at: string;
}

export interface SaveReportTemplatePayload {
  nombre: string;
  descripcion?: string;
  qbe_payload: QBEPayload;
}

const PLANTILLAS_BASE = '/reportes-qbe/plantillas/';

export async function listReportTemplates(options?: {
  systemOnly?: boolean;
  customOnly?: boolean;
}): Promise<ReportTemplate[]> {
  const params: Record<string, string> = {};
  if (options?.systemOnly) params.is_system_report = 'true';
  if (options?.customOnly) params.is_system_report = 'false';

  const { data } = await api.get<ReportTemplate[] | { results: ReportTemplate[] }>(
    PLANTILLAS_BASE,
    { params },
  );

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}

export async function createReportTemplate(
  payload: SaveReportTemplatePayload,
): Promise<ReportTemplate> {
  const { data } = await api.post<ReportTemplate>(PLANTILLAS_BASE, {
    nombre: payload.nombre,
    descripcion: payload.descripcion ?? '',
    qbe_payload: payload.qbe_payload,
    is_system_report: false,
  });
  return data;
}

export async function deleteReportTemplate(id: number): Promise<void> {
  await api.delete(`${PLANTILLAS_BASE}${id}/`);
}

export async function runReportTemplate(id: number): Promise<NlpToReportResponse> {
  const { data } = await api.post<NlpToReportResponse>(`${PLANTILLAS_BASE}${id}/run/`);
  return data;
}

export async function exportReportExcel(payload: QBEPayload): Promise<Blob> {
  const { data } = await api.post<Blob>(
    `${PLANTILLAS_BASE}export-excel/`,
    {
      model: payload.model,
      filters: payload.filters ?? {},
      fields: payload.fields ?? undefined,
      order_by: payload.order_by ?? [],
    },
    { responseType: 'blob', timeout: 90_000 },
  );
  return data;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type ExecuteReportResponse = Pick<ReportBundle, 'meta' | 'data'>;
