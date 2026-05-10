/**
 * Servicios IA + ejecución QBE (CU23).
 * Usa `@/lib/api` (JWT + prefijo tenant `/t/<slug>/api`).
 */
import api from '@/lib/api';

import type { NlpToReportResponse, QBEPayload, ReportBundle } from '@/types/reportes';

const NLP_REPORT_TIMEOUT_MS = 120_000;
const QBE_EXECUTE_TIMEOUT_MS = 90_000;

export async function postNlpToReport(query: string): Promise<NlpToReportResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('La consulta no puede estar vacía.');
  }

  const { data } = await api.post<NlpToReportResponse>(
    '/ia/nlp-to-report/',
    { query: trimmed },
    { timeout: NLP_REPORT_TIMEOUT_MS },
  );

  return data;
}

/** Respuesta de `POST /reportes-qbe/plantillas/execute/` (misma forma que `QBEEngine.execute`). */
export type ExecuteReportResponse = Pick<ReportBundle, 'meta' | 'data'>;

/**
 * Re-ejecuta el QBE en servidor (sin llamar a Gemini), p. ej. tras quitar un filtro en la UI.
 */
export async function postExecuteQbe(payload: QBEPayload): Promise<ExecuteReportResponse> {
  const { data } = await api.post<ExecuteReportResponse>(
    '/reportes-qbe/plantillas/execute/',
    {
      model: payload.model,
      filters: payload.filters ?? {},
      fields: payload.fields ?? undefined,
      order_by: payload.order_by ?? [],
    },
    { timeout: QBE_EXECUTE_TIMEOUT_MS },
  );

  return data;
}
