/**
 * Descarga de reportes QBE (Excel, PDF, CSV) según intención del usuario.
 */
import api from '@/lib/api';
import type { QBEPayload, ReportExportFormat } from '@/types/reportes';

export type { ReportExportFormat };

const EXPORT_PATH: Record<ReportExportFormat, string> = {
  excel: '/reportes-qbe/plantillas/export-excel/',
  pdf: '/reportes-qbe/plantillas/export-pdf/',
  csv: '/reportes-qbe/plantillas/export-csv/',
};

const DEFAULT_EXT: Record<ReportExportFormat, string> = {
  excel: 'xlsx',
  pdf: 'pdf',
  csv: 'csv',
};

function qbeBody(payload: QBEPayload) {
  return {
    model: payload.model,
    filters: payload.filters ?? {},
    fields: payload.fields ?? undefined,
    order_by: payload.order_by ?? [],
  };
}

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(header);
  return match?.[1]?.trim() || fallback;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadQbeExport(
  format: ReportExportFormat,
  payload: QBEPayload,
  modelSlug?: string,
): Promise<void> {
  const slug = (modelSlug || payload.model || 'reporte')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const fallback = `reporte-${slug || 'datos'}.${DEFAULT_EXT[format]}`;

  const response = await api.post<Blob>(EXPORT_PATH[format], qbeBody(payload), {
    responseType: 'blob',
    timeout: 90_000,
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename = filenameFromDisposition(disposition, fallback);
  triggerBrowserDownload(response.data, filename);
}

/** Descargas secuenciales (varios formatos en una misma consulta). */
export async function downloadQbeExports(
  formats: ReportExportFormat[],
  payload: QBEPayload,
): Promise<void> {
  const unique = [...new Set(formats)];
  for (let i = 0; i < unique.length; i += 1) {
    await downloadQbeExport(unique[i], payload);
    if (i < unique.length - 1) {
      await new Promise((r) => window.setTimeout(r, 400));
    }
  }
}

export function isReportExportFormat(value: string): value is ReportExportFormat {
  return value === 'excel' || value === 'pdf' || value === 'csv';
}
