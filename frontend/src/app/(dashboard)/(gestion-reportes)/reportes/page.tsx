'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';

import ActiveFilters from '@/components/reportes/ActiveFilters';
import AIAssistantBar from '@/components/reportes/AIAssistantBar';
import { buildDefaultVisibility } from '@/components/reportes/columnUtils';
import DynamicTable from '@/components/reportes/DynamicTable';
import ReportColumnPicker from '@/components/reportes/ReportColumnPicker';
import { useSmartReport } from '@/hooks/useSmartReport';
import { useSpeechToText } from '@/hooks/useSpeechToText';

function ReportSkeleton() {
  return (
    <div
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/60"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-72 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
      </div>
      <p className="text-center text-sm text-gray-500">Generando consulta y ejecutando reporte…</p>
    </div>
  );
}

export default function ReportesInteligentesPage() {
  const { data, loading, updating, error, submitQuery, removeFilterKey } = useSmartReport();
  const speech = useSpeechToText();

  const [query, setQuery] = useState('');
  /** null = aún no hidratado para este set de columnas; se usa buildDefaultVisibility en UI. */
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    if (!speech.isListening && speech.transcript) {
      setQuery(speech.transcript);
    }
  }, [speech.isListening, speech.transcript]);

  const handleMicClick = useCallback(() => {
    if (!speech.browserSupportsSpeechRecognition) return;
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  }, [speech]);

  const handleSubmit = useCallback(
    (text: string) => {
      void submitQuery(text);
    },
    [submitQuery],
  );

  const columns = data?.report?.meta?.columns ?? [];
  const rows = data?.report?.data ?? [];
  const total = data?.report?.meta?.total_records;
  const filters = data?.qbe?.filters ?? {};
  const modelName = data?.qbe?.model;

  const columnsKey = useMemo(() => columns.join('\u0001'), [columns]);

  useEffect(() => {
    if (!columns.length) {
      setColumnVisibility(null);
      return;
    }
    setColumnVisibility(buildDefaultVisibility(columns));
  }, [columnsKey]);

  const resolvedVisibility = columnVisibility ?? (columns.length ? buildDefaultVisibility(columns) : {});

  const visibleOrderedColumns = useMemo(() => {
    return columns.filter((c) => resolvedVisibility[c] !== false);
  }, [columns, resolvedVisibility]);

  const toggleColumn = useCallback(
    (key: string) => {
      setColumnVisibility((prev) => {
        const base = prev ?? buildDefaultVisibility(columns);
        const next = { ...base, [key]: !base[key] };
        if (!columns.some((c) => next[c])) {
          return base;
        }
        return next;
      });
    },
    [columns],
  );

  const busy = loading || updating;
  const hasTableData = columns.length > 0 && rows.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles className="h-6 w-6" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Consultas en lenguaje natural · Filtros · Exportación
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reportes inteligentes</h1>
        <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
          Describí qué datos necesitás. La IA propone filtros seguros (QBE); podés quitar condiciones con las
          etiquetas y la tabla se actualiza al instante sin volver a llamar al modelo de lenguaje.
        </p>
      </header>

      <AIAssistantBar
        value={speech.isListening ? speech.transcript : query}
        onChange={(v) => setQuery(v)}
        onSubmit={() => {
          const text = (speech.isListening ? speech.transcript : query).trim();
          if (text) void handleSubmit(text);
        }}
        isListening={speech.isListening}
        onToggleListen={handleMicClick}
        loading={busy}
      />

      {loading && !data && <ReportSkeleton />}

      {error && !loading && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm"
          role="alert"
        >
          <p className="font-semibold">No se pudo completar la solicitud</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {data && (
        <section className={`relative space-y-4 ${busy ? 'opacity-95' : ''}`}>
          {updating && (
            <div
              className="absolute inset-0 z-[1] flex items-center justify-center rounded-2xl bg-white/40 backdrop-blur-[2px]"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md ring-1 ring-gray-200">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="text-sm font-medium text-gray-700">Actualizando filtros…</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
              {hasTableData && (
                <ReportColumnPicker
                  columns={columns}
                  visibility={resolvedVisibility}
                  onToggle={toggleColumn}
                  disabled={updating || loading}
                />
              )}
            </div>
            {typeof total === 'number' && (
              <p className="text-sm text-gray-500">
                {total} registro{total !== 1 ? 's' : ''} coincidente{total !== 1 ? 's' : ''}
                {data.report.meta?.truncated ? ' (vista parcial)' : ''}
              </p>
            )}
          </div>

          <ActiveFilters
            filters={filters}
            model={modelName}
            onRemoveKey={(key) => void removeFilterKey(key)}
            disabled={updating || loading}
          />

          {data.qbe && (
            <details className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm shadow-sm">
              <summary className="cursor-pointer font-medium text-gray-700">
                Ver JSON QBE (auditoría)
              </summary>
              <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-white p-3 text-xs text-gray-800 ring-1 ring-gray-100">
                {JSON.stringify(data.qbe, null, 2)}
              </pre>
            </details>
          )}

          {hasTableData ? (
            <DynamicTable columns={columns} visibleColumns={visibleOrderedColumns} data={rows} />
          ) : (
            <div className="mt-8 overflow-hidden rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-200/50">
              <p className="mx-auto max-w-sm text-sm text-gray-500">
                No hay datos para mostrar. Pídele algo a la IA.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
