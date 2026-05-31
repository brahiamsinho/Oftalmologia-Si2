'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Bot, Loader2, SendHorizonal, Sparkles, Trash2, UserRound } from 'lucide-react';

import { useVirtualAssistantChat } from '@/hooks/useVirtualAssistantChat';

function formatHour(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

export default function AsistenteVirtualPage() {
  const { messages, loading, error, sendMessage, clearConversation } = useVirtualAssistantChat();
  const [draft, setDraft] = useState('');

  const emptyState = useMemo(() => messages.length === 0, [messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    setDraft('');
    await sendMessage(text);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Inteligencia artificial</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Asistente virtual</h1>
        <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
          Consultá sobre agenda, pacientes, seguros, descuentos, reportes y flujos operativos de la clínica oftalmológica.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-indigo-100 p-2 text-indigo-700">
              <Bot className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Asistente de apoyo clínico y administrativo</p>
              <p className="text-xs text-gray-500">Orientado a la operación diaria de oftalmología.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            disabled={loading || emptyState}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Limpiar chat
          </button>
        </div>

        <div className="h-[56vh] min-h-[420px] overflow-y-auto bg-gray-50/70 px-3 py-4 sm:px-5">
          {emptyState ? (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <div className="mx-auto mb-3 w-fit rounded-full bg-indigo-100 p-3 text-indigo-700">
                <Bot className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Iniciá la conversación</h2>
              <p className="mt-2 text-sm text-gray-500">
                Ejemplo: &ldquo;Necesito priorizar pacientes urgentes de hoy y organizar la agenda de controles postoperatorios.&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <article
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    aria-label={isUser ? 'Mensaje del usuario' : 'Mensaje del asistente'}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ring-1 ${
                        isUser
                          ? 'bg-indigo-600 text-white ring-indigo-600'
                          : 'bg-white text-gray-800 ring-gray-200'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-90">
                        {isUser ? <UserRound className="h-3.5 w-3.5" aria-hidden /> : <Bot className="h-3.5 w-3.5" aria-hidden />}
                        <span>{isUser ? 'Tú' : 'Asistente'}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                      <p className={`mt-2 text-[10px] ${isUser ? 'text-indigo-100' : 'text-gray-400'}`}>
                        {formatHour(message.createdAt)}
                      </p>
                    </div>
                  </article>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-gray-500 shadow-sm ring-1 ring-gray-200">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    El asistente está escribiendo...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-3 sm:p-4">
          <label htmlFor="assistant-message" className="sr-only">
            Mensaje para el asistente virtual
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="assistant-message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={4000}
              placeholder="Escribe tu consulta (ej.: reagendar control, validar cobertura de seguro, resumen de citas del día)..."
              disabled={loading}
              className="min-h-[52px] flex-1 resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || draft.trim().length === 0}
              className="inline-flex h-[46px] items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SendHorizonal className="h-4 w-4" aria-hidden />}
              Enviar
            </button>
          </div>
          {error && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
