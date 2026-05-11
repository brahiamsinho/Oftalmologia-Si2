/**
 * Tipos para reportes inteligentes (NL → QBE, tabla, exportación).
 */

/** Payload QBE devuelto por la IA (compatible con QBEEngine). */
export interface QBEPayload {
  model: string;
  fields?: string[] | null;
  filters: Record<string, unknown>;
  order_by?: string[];
}

/** Metadatos tabulares devueltos por el backend junto a las filas. */
export interface ReportMeta {
  model?: string;
  columns: string[];
  total_records: number;
  returned?: number;
  truncated?: boolean;
  max_rows?: number;
  aggregations_requested?: unknown;
  count_requested?: boolean;
}

export type ReportRow = Record<string, unknown>;

/** Cuerpo `report` de la API: meta + filas. */
export interface ReportBundle {
  meta: ReportMeta;
  data: ReportRow[];
}

/**
 * Respuesta de POST `/ia/nlp-to-report/`.
 * Incluye el JSON QBE interpretado y el resultado ejecutado en tenant.
 */
export interface NlpToReportResponse {
  qbe: QBEPayload;
  report: ReportBundle;
}

/** Alias útil cuando se describe solo la capa “report”. */
export type QBEResponse = NlpToReportResponse;
