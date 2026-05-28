'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Sparkles } from 'lucide-react';

import ActiveFilters from '@/components/reportes/ActiveFilters';
import AIAssistantBar from '@/components/reportes/AIAssistantBar';
import { buildDefaultVisibility } from '@/components/reportes/columnUtils';
import DynamicTable from '@/components/reportes/DynamicTable';
import PredefinedReportsPanel from '@/components/reportes/PredefinedReportsPanel';
import ReportColumnPicker from '@/components/reportes/ReportColumnPicker';
import SaveReportTemplateDialog from '@/components/reportes/SaveReportTemplateDialog';
import SavedReportsPanel from '@/components/reportes/SavedReportsPanel';
import { useSmartReport } from '@/hooks/useSmartReport';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import type { NlpToReportResponse } from '@/types/reportes';

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
  const {
    data,
    loading,
    updating,
    exporting,
    exportNotice,
    error,
    submitQuery,
    loadReportResult,
    removeFilterKey,
    downloadFormats,
  } = useSmartReport();
  const speech = useSpeechToText();

  const [query, setQuery] = useState('');
  const [panelError, setPanelError] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [savedRefresh, setSavedRefresh] = useState(0);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean> | null>(null);

  const displayError = error ?? panelError;

  useEffect(() => {
    if (speech.isListening && speech.transcript) {
      setQuery(speech.transcript);
    }
  }, [speech.isListening, speech.transcript]);

  useEffect(() => {
    if (!speech.isListening && speech.transcript.trim()) {
      setQuery(speech.transcript.trim());
    }
  }, [speech.isListening, speech.transcript]);

  const handleMicClick = useCallback(() => {
    if (!speech.browserSupportsSpeechRecognition) return;
    if (speech.isListening) {
      speech.stopListening();
      if (speech.transcript.trim()) {
        setQuery(speech.transcript.trim());
      }
    } else {
      speech.startListening();
    }
  }, [speech]);

  const handleSubmit = useCallback(
    (text: string) => {
      setPanelError(null);
      void submitQuery(text);
    },
    [submitQuery],
  );

  const handleReportLoaded = useCallback(
    (result: NlpToReportResponse) => {
      setPanelError(null);
      loadReportResult(result);
    },
    [loadReportResult],
  );

  const handlePanelError = useCallback((message: string) => {
    setPanelError(message || null);
  }, []);

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

  const busy = loading || updating || exporting;
  const hasTableData = columns.length > 0 && rows.length > 0;
  const canExport = Boolean(data?.qbe) && hasTableData;
  const canSaveTemplate = Boolean(data?.qbe?.model);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles className="h-6 w-6" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Predefinidos · Personalizados · IA
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reportes inteligentes</h1>
        <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
          Describí qué datos necesitás y, si querés archivos, indicá el formato (por ejemplo: «en excel y pdf»).
          La IA propone filtros seguros (QBE); al generar, se descargan automáticamente los formatos pedidos.
        </p>
      </header>

      <PredefinedReportsPanel
        onReportLoaded={handleReportLoaded}
        onError={handlePanelError}
        disabled={busy}
      />

      <SavedReportsPanel
        refreshToken={savedRefresh}
        onReportLoaded={handleReportLoaded}
        onError={handlePanelError}
        disabled={busy}
      />

      <AIAssistantBar
        value={query}
        onChange={(v) => setQuery(v)}
        onSubmit={() => {
          if (speech.isListening) speech.stopListening();
          const text = query.trim();
          if (text) void handleSubmit(text);
        }}
        isListening={speech.isListening}
        onToggleListen={handleMicClick}
        loading={busy}
        speechSupported={speech.browserSupportsSpeechRecognition}
        speechError={speech.recognitionError}
      />

      {loading && !data && <ReportSkeleton />}

      {displayError && !loading && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm"
          role="alert"
        >
          <p className="font-semibold">No se pudo completar la solicitud</p>
          <p className="mt-1">{displayError}</p>
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
            <div className="flex flex-wrap items-center gap-2">
              {typeof total === 'number' && (
                <p className="text-sm text-gray-500">
                  {total} registro{total !== 1 ? 's' : ''} coincidente{total !== 1 ? 's' : ''}
                  {data.report.meta?.truncated ? ' (vista parcial)' : ''}
                </p>
              )}
              {canExport && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void downloadFormats(['excel'])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden />
                    Excel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void downloadFormats(['pdf'])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4 text-red-600" aria-hidden />
                    PDF
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void downloadFormats(['excel', 'pdf'])}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-800 shadow-sm hover:bg-indigo-100 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Ambos
                  </button>
                </div>
              )}
            </div>
          </div>

          {exportNotice && (
            <p
              className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-indigo-900"
              role="status"
              aria-live="polite"
            >
              {exportNotice}
            </p>
          )}

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
                No hay filas con los filtros actuales. Ajustá condiciones o probá otro informe.
              </p>
            </div>
          )}
        </section>
      )}

      <SaveReportTemplateDialog
        open={saveDialogOpen}
        qbe={data?.qbe ?? null}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={() => setSavedRefresh((n) => n + 1)}
      />
    </div>
  );
}
