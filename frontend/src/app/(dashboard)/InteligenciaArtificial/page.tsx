'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Loader2,
  MessageSquare,
  RefreshCcw,
  SendHorizonal,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { AxiosError } from 'axios';

import { useAuth } from '@/context/AuthContext';
import {
  getPatientAssistantHistory,
  postPatientAssistantMessage,
  type PatientAssistantInteraction,
} from '@/services/iaService';

type ChatRow =
  | {
      id: string;
      role: 'user';
      content: string;
      createdAt: string;
      interaction?: PatientAssistantInteraction;
    }
  | {
      id: string;
      role: 'assistant';
      content: string;
      createdAt: string;
      interaction: PatientAssistantInteraction;
    };

const QUICK_PROMPTS = [
  {
    label: 'Agendar cita',
    text: 'Quiero saber como puedo agendar una cita de oftalmologia.',
    icon: CalendarClock,
  },
  {
    label: 'Preoperatorio',
    text: 'Que debo revisar antes de mi cirugia ocular?',
    icon: FileText,
  },
  {
    label: 'Postoperatorio',
    text: 'Que cuidados generales debo tener despues de una cirugia ocular?',
    icon: HeartPulse,
  },
  {
    label: 'Senal de riesgo',
    text: 'Tengo perdida subita de vision y dolor ocular intenso.',
    icon: ShieldAlert,
  },
];

const INTENT_LABELS: Record<string, string> = {
  CITAS_HORARIOS: 'Citas y horarios',
  PROCEDIMIENTOS: 'Procedimientos',
  PREOPERATORIO: 'Preoperatorio',
  POSTOPERATORIO: 'Postoperatorio',
  SEGUROS_FACTURACION: 'Seguros y pagos',
  SISTEMA: 'Sistema',
  SALUDO: 'Saludo',
  URGENCIA: 'Posible urgencia',
  FUERA_ALCANCE: 'Fuera de alcance',
  NO_COMPRENDIDA: 'No comprendida',
};

function createConversationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `conversation-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function toRows(interactions: PatientAssistantInteraction[]): ChatRow[] {
  return interactions
    .slice()
    .sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime())
    .flatMap((item) => [
      {
        id: `u-${item.id_interaccion}`,
        role: 'user' as const,
        content: item.mensaje,
        createdAt: item.fecha_creacion,
        interaction: item,
      },
      {
        id: `a-${item.id_interaccion}`,
        role: 'assistant' as const,
        content: item.respuesta,
        createdAt: item.fecha_creacion,
        interaction: item,
      },
    ]);
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { detail?: unknown; mensaje?: unknown } | undefined;
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.mensaje === 'string') return data.mensaje;
    if (error.response?.status === 403) return 'Tu usuario no tiene permiso para usar este asistente.';
    if (error.response?.status === 401) return 'Tu sesion vencio. Vuelve a iniciar sesion.';
  }
  if (error instanceof Error) return error.message;
  return 'No se pudo completar la consulta.';
}

function StatusPill({ interaction }: { interaction: PatientAssistantInteraction }) {
  if (interaction.requiere_clasificacion_urgencia) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        Requiere CU24
      </span>
    );
  }

  if (interaction.estado === 'NO_COMPRENDIDA' || interaction.estado === 'FUERA_ALCANCE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {interaction.estado === 'NO_COMPRENDIDA' ? 'Reformular' : 'Fuera de alcance'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      Orientacion general
    </span>
  );
}

export default function InteligenciaArtificialPage() {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState('');
  const [interactions, setInteractions] = useState<PatientAssistantInteraction[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isPatient = user?.tipo_usuario === 'PACIENTE';
  const rows = useMemo(() => toRows(interactions), [interactions]);
  const lastInteraction = interactions[interactions.length - 1];

  useEffect(() => {
    setConversationId(createConversationId());
  }, []);

  useEffect(() => {
    if (!conversationId || !isPatient) return;

    setHistoryLoading(true);
    getPatientAssistantHistory({ id_conversacion: conversationId })
      .then(setInteractions)
      .catch(() => {
        setInteractions([]);
      })
      .finally(() => setHistoryLoading(false));
  }, [conversationId, isPatient]);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [rows.length, loading]);

  async function send(text: string) {
    const mensaje = text.trim();
    if (!mensaje || loading || !conversationId) return;

    setLoading(true);
    setError(null);
    setDraft('');

    try {
      const response = await postPatientAssistantMessage({
        mensaje,
        id_conversacion: conversationId,
      });
      setInteractions((current) => [...current, response]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }

  function resetConversation() {
    setConversationId(createConversationId());
    setInteractions([]);
    setDraft('');
    setError(null);
  }

  if (!isPatient) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-blue-700">
            <Bot className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Inteligencia artificial</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">Asistente virtual para pacientes</h1>
        </header>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
            <div>
              <h2 className="text-sm font-bold">Acceso restringido</h2>
              <p className="mt-1 text-sm leading-6">
                Esta pantalla corresponde al flujo del paciente. Para probarla, inicia sesion con una cuenta de tipo PACIENTE.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-blue-700">
            <Sparkles className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Inteligencia artificial</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">Asistente virtual para pacientes</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Consulta en lenguaje natural sobre citas, horarios, procedimientos, indicaciones preoperatorias,
              cuidados postoperatorios, seguros y preguntas frecuentes de atencion.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetConversation}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Nueva conversacion
        </button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-[680px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Bot className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-950">Conversacion</h2>
                <p className="text-xs text-gray-500">Orientacion general registrada en bitacora del sistema.</p>
              </div>
            </div>
            {lastInteraction && (
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill interaction={lastInteraction} />
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {INTENT_LABELS[lastInteraction.intencion] ?? lastInteraction.intencion}
                </span>
              </div>
            )}
          </div>

          <div ref={viewportRef} className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-3 py-4 sm:px-5">
            {historyLoading ? (
              <div className="flex h-full min-h-[360px] items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Cargando conversacion
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <MessageSquare className="h-7 w-7" aria-hidden />
                </div>
                <h2 className="text-lg font-bold text-gray-950">Escribe tu primera consulta</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  El asistente responde informacion general autorizada. Si detecta sintomas de riesgo, marca la consulta
                  para clasificacion de urgencia.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((row) => {
                  const isUser = row.role === 'user';
                  return (
                    <article
                      key={row.id}
                      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                      aria-label={isUser ? 'Mensaje del paciente' : 'Respuesta del asistente'}
                    >
                      {!isUser && (
                        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-blue-700 ring-1 ring-blue-100">
                          <Bot className="h-4 w-4" aria-hidden />
                        </div>
                      )}
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ring-1 sm:max-w-[76%] ${
                          isUser
                            ? 'bg-blue-700 text-white ring-blue-700'
                            : row.interaction.requiere_clasificacion_urgencia
                              ? 'bg-red-50 text-red-950 ring-red-200'
                              : 'bg-white text-gray-800 ring-gray-200'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide opacity-90">
                          {isUser ? (
                            <UserRound className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Bot className="h-3.5 w-3.5" aria-hidden />
                          )}
                          <span>{isUser ? 'Paciente' : 'Asistente'}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{row.content}</p>
                        {!isUser && row.interaction.requiere_clasificacion_urgencia && (
                          <div className="mt-3 rounded-xl border border-red-200 bg-white/70 px-3 py-2 text-xs font-medium text-red-800">
                            Posible urgencia: prioridad {row.interaction.nivel_prioridad.toLowerCase()}.
                          </div>
                        )}
                        <p className={`mt-2 text-[11px] ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(row.createdAt)}
                        </p>
                      </div>
                      {isUser && (
                        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <UserRound className="h-4 w-4" aria-hidden />
                        </div>
                      )}
                    </article>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-gray-200">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Analizando consulta
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-4">
            <label htmlFor="patient-assistant-message" className="mb-2 block text-sm font-semibold text-gray-800">
              Consulta del paciente
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                id="patient-assistant-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Ejemplo: Quiero saber como agendar una cita o que cuidados tener despues de una cirugia ocular."
                disabled={loading}
                className="min-h-[96px] flex-1 resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm leading-6 text-gray-950 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || draft.trim().length < 2}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <SendHorizonal className="h-4 w-4" aria-hidden />
                )}
                Enviar
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">{draft.trim().length}/2000 caracteres</p>
              <p className="hidden text-xs text-gray-500 sm:block">No reemplaza una evaluacion medica.</p>
            </div>
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>

        <aside className="space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Stethoscope className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-950">Temas disponibles</h2>
                <p className="text-xs text-gray-500">Consultas frecuentes autorizadas.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {QUICK_PROMPTS.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => setDraft(prompt.text)}
                    className="flex min-h-[48px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                    {prompt.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" aria-hidden />
              <div>
                <h2 className="text-sm font-bold text-red-950">Senales de riesgo</h2>
                <p className="mt-2 text-sm leading-6 text-red-800">
                  Dolor ocular intenso, perdida subita de vision, trauma, quimicos en el ojo o sangrado deben pasar a
                  clasificacion de urgencia.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-500" aria-hidden />
              <div>
                <h2 className="text-sm font-bold text-gray-950">Estado de la sesion</h2>
                <p className="text-xs text-gray-500">Interacciones registradas en esta conversacion.</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Mensajes</dt>
                <dd className="mt-1 text-xl font-bold text-gray-950">{interactions.length}</dd>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Urgencias</dt>
                <dd className="mt-1 text-xl font-bold text-gray-950">
                  {interactions.filter((item) => item.requiere_clasificacion_urgencia).length}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
