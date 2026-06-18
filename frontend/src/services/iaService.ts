/**
 * Servicios IA + ejecución QBE.
 * Usa `@/lib/api` (JWT + prefijo tenant `/t/<slug>/api`).
 */
import api from '@/lib/api';

import type { NlpToReportResponse, QBEPayload, ReportBundle } from '@/types/reportes';

const NLP_REPORT_TIMEOUT_MS = 120_000;
const QBE_EXECUTE_TIMEOUT_MS = 90_000;
const CHATBOT_TIMEOUT_MS = 90_000;
const PATIENT_ASSISTANT_TIMEOUT_MS = 30_000;

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

export type AssistantIntent =
  | 'CITAS_HORARIOS'
  | 'PROCEDIMIENTOS'
  | 'PREOPERATORIO'
  | 'POSTOPERATORIO'
  | 'SEGUROS_FACTURACION'
  | 'SISTEMA'
  | 'SALUDO'
  | 'URGENCIA'
  | 'FUERA_ALCANCE'
  | 'NO_COMPRENDIDA';

export type AssistantState =
  | 'RESPONDIDA'
  | 'REQUIERE_CU24'
  | 'FUERA_ALCANCE'
  | 'NO_COMPRENDIDA';

export type AssistantPriority = 'NO_APLICA' | 'BAJA' | 'MEDIA' | 'ALTA';

export interface UrgencyClassificationResult {
  classification_id: number;
  level: string;
  confidence: number;
  requires_human_attention: boolean;
  orientation: string;
  matched_criteria: { code: string; label: string; level: string; matched_terms: string[] }[];
  derivation_status: string;
  handoff_status: string;
  created_at: string;
}

export interface PatientAssistantInteraction {
  id_interaccion: number;
  id_conversacion: string;
  id_usuario: number;
  mensaje: string;
  respuesta: string;
  intencion: AssistantIntent;
  estado: AssistantState;
  requiere_clasificacion_urgencia: boolean;
  nivel_prioridad: AssistantPriority;
  sintomas_detectados: string[];
  metadata: Record<string, unknown>;
  fecha_creacion: string;
  clasificacion_urgencia?: UrgencyClassificationResult | null;
}

interface PaginatedPatientAssistantResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PatientAssistantInteraction[];
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

export async function postPatientAssistantMessage(payload: {
  mensaje: string;
  id_conversacion?: string;
}): Promise<PatientAssistantInteraction> {
  const mensaje = payload.mensaje.trim();
  if (!mensaje) {
    throw new Error('El mensaje no puede estar vacio.');
  }

  const { data } = await api.post<PatientAssistantInteraction>(
    '/inteligencia-artificial/asistente-virtual/',
    {
      mensaje,
      ...(payload.id_conversacion ? { id_conversacion: payload.id_conversacion } : {}),
    },
    { timeout: PATIENT_ASSISTANT_TIMEOUT_MS },
  );

  return data;
}

export async function getPatientAssistantHistory(params?: {
  id_conversacion?: string;
}): Promise<PatientAssistantInteraction[]> {
  const { data } = await api.get<PaginatedPatientAssistantResponse | PatientAssistantInteraction[]>(
    '/inteligencia-artificial/interacciones-asistente/',
    { params },
  );

  if (Array.isArray(data)) return data;
  return data.results ?? [];
}
