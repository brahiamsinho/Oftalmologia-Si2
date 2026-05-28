'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileBarChart, Loader2, Play } from 'lucide-react';

import {
  listReportTemplates,
  runReportTemplate,
  type ReportTemplate,
} from '@/lib/services/reportes';
import type { NlpToReportResponse } from '@/types/reportes';

interface PredefinedReportsPanelProps {
  onReportLoaded: (result: NlpToReportResponse) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export default function PredefinedReportsPanel({
  onReportLoaded,
  onError,
  disabled = false,
}: PredefinedReportsPanelProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [runningId, setRunningId] = useState<number | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await listReportTemplates({ systemOnly: true });
      setTemplates(rows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar los informes predefinidos.';
      onError(msg);
    } finally {
      setLoadingList(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleRun = async (template: ReportTemplate) => {
    setRunningId(template.id);
    onError('');
    try {
      const result = await runReportTemplate(template.id);
      onReportLoaded(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo ejecutar el informe.';
      onError(msg);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <section
      className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm"
      aria-labelledby="predefined-reports-heading"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <FileBarChart className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 id="predefined-reports-heading" className="text-lg font-semibold text-gray-900">
            Informes predefinidos
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Plantillas del sistema. Un clic ejecuta el reporte sin usar la IA.
          </p>
        </div>
      </div>

      {loadingList && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Cargando plantillas…
        </div>
      )}

      {!loadingList && templates.length === 0 && (
        <p className="text-sm text-gray-500">
          No hay informes predefinidos. Ejecutá migraciones del tenant (
          <code className="text-xs">reportes.0002_reportes_predefinidos</code>).
        </p>
      )}

      {!loadingList && templates.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => {
            const isRunning = runningId === t.id;
            return (
              <li
                key={t.id}
                className="flex flex-col justify-between rounded-xl border border-white/80 bg-white p-4 shadow-sm ring-1 ring-gray-100"
              >
                <div>
                  <p className="font-semibold text-gray-900">{t.nombre}</p>
                  {t.descripcion && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{t.descripcion}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={disabled || isRunning || runningId !== null}
                  onClick={() => void handleRun(t)}
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden />
                  )}
                  {isRunning ? 'Generando…' : 'Ejecutar informe'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
