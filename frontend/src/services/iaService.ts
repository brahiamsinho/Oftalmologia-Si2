/**
 * Servicios IA + ejecución QBE.
 * Usa `@/lib/api` (JWT + prefijo tenant `/t/<slug>/api`).
 */
import api from '@/lib/api';

import type { NlpToReportResponse, QBEPayload, ReportBundle } from '@/types/reportes';

const NLP_REPORT_TIMEOUT_MS = 120_000;
const QBE_EXECUTE_TIMEOUT_MS = 90_000;
const CHATBOT_TIMEOUT_MS = 90_000;

export type ChatRole = 'user' | 'assistant';

export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

export interface ChatbotRequest {
  message: string;
  history?: ChatHistoryItem[];
}

export interface ChatbotResponse {
  reply: string;
  model: string;
}

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

export interface UrgencyClassificationItem {
  classification_id: number;
  paciente: number;
  paciente_nombre: string;
  nivel: string;
  confianza: number;
  requiere_atencion_humana: boolean;
  created_at: string;
}

export interface CriticalHandoffListItem {
  handoff_id: number;
  paciente: number;
  paciente_nombre: string;
  nivel_urgencia: string;
  estado: string;
  asignado_a: number | null;
  created_at: string;
}

export interface CriticalHandoffDetail {
  handoff_id: number;
  classification_id: number;
  paciente: number;
  paciente_nombre: string;
  mensaje_original: string;
  nivel_urgencia: string;
  criterios_detectados: Record<string, unknown>[];
  estado: string;
  asignado_a: number | null;
  aceptado_por: number | null;
  notificado_en: string | null;
  aceptado_en: string | null;
  resuelto_en: string | null;
  created_at: string;
  updated_at: string;
}

export async function listClassifications(): Promise<UrgencyClassificationItem[]> {
  const { data } = await api.get<UrgencyClassificationItem[]>('/ia/urgency-classifications/');
  return data;
}

export async function listHandoffs(): Promise<CriticalHandoffListItem[]> {
  const { data } = await api.get<CriticalHandoffListItem[]>('/ia/human-handoffs/');
  return data;
}

export async function getHandoff(id: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.get<CriticalHandoffDetail>(`/ia/human-handoffs/${id}/`);
  return data;
}

export async function createHandoffFromClassification(classificationId: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.post<CriticalHandoffDetail>(
    `/ia/human-handoffs/from-classification/${classificationId}/`,
  );
  return data;
}

export async function acceptHandoff(id: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.post<CriticalHandoffDetail>(`/ia/human-handoffs/${id}/accept/`);
  return data;
}

export async function resolveHandoff(id: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.post<CriticalHandoffDetail>(`/ia/human-handoffs/${id}/resolve/`);
  return data;
}

export async function startCareHandoff(id: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.post<CriticalHandoffDetail>(`/ia/human-handoffs/${id}/start-care/`);
  return data;
}

export async function cancelHandoff(id: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.post<CriticalHandoffDetail>(`/ia/human-handoffs/${id}/cancel/`);
  return data;
}

export async function failHandoff(id: number): Promise<CriticalHandoffDetail> {
  const { data } = await api.post<CriticalHandoffDetail>(`/ia/human-handoffs/${id}/fail/`);
  return data;
}

export async function postChatbotMessage(payload: ChatbotRequest): Promise<ChatbotResponse> {
  const message = payload.message.trim();
  if (!message) {
    throw new Error('El mensaje no puede estar vacío.');
  }

  const history = (payload.history ?? [])
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-20);

  const { data } = await api.post<ChatbotResponse>(
    '/ia/chatbot/',
    { message, history },
    { timeout: CHATBOT_TIMEOUT_MS },
  );
  return data;
}
