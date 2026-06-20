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

export type UrgencyLevel = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type UrgencyClassificationState = 'PENDIENTE' | 'REVISADO' | 'DERIVADO';

export interface UrgencyClassification {
  id_clasificacion: number;
  id_interaccion: number;
  id_usuario: number;
  nivel_urgencia: UrgencyLevel;
  puntaje_riesgo: number;
  factores_clinicos: Array<Record<string, unknown>>;
  criterios_evaluados: Record<string, unknown>;
  recomendacion: string;
  requiere_derivacion: boolean;
  estado: UrgencyClassificationState;
  revisado_por: number | null;
  fecha_revision: string | null;
  notas_internas: string;
  fecha_creacion: string;
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
  clasificacion_urgencia?: UrgencyClassification | null;
  fecha_creacion: string;
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
