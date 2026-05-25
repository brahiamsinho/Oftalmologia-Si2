'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Play, Trash2 } from 'lucide-react';

import {
  deleteReportTemplate,
  listReportTemplates,
  runReportTemplate,
  type ReportTemplate,
} from '@/lib/services/reportes';
import type { NlpToReportResponse } from '@/types/reportes';

interface SavedReportsPanelProps {
  refreshToken?: number;
  onReportLoaded: (result: NlpToReportResponse) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export default function SavedReportsPanel({
  refreshToken = 0,
  onReportLoaded,
  onError,
  disabled = false,
}: SavedReportsPanelProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await listReportTemplates({ customOnly: true });
      setTemplates(rows);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'No se pudieron cargar tus informes guardados.');
    } finally {
      setLoadingList(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates, refreshToken]);

  const handleRun = async (template: ReportTemplate) => {
    setBusyId(template.id);
    try {
      const result = await runReportTemplate(template.id);
      onReportLoaded(result);
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'No se pudo ejecutar el informe.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (template: ReportTemplate) => {
    if (!window.confirm(`¿Eliminar el informe "${template.nombre}"?`)) return;
    setBusyId(template.id);
    try {
      await deleteReportTemplate(template.id);
      await loadTemplates();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'No se pudo eliminar.');
    } finally {
      setBusyId(null);
    }
  };

  if (loadingList) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando informes guardados…
      </p>
    );
  }

  if (templates.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-200/50">
      <h2 className="text-base font-semibold text-gray-900">Mis informes guardados</h2>
      <ul className="mt-3 space-y-2">
        {templates.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{t.nombre}</p>
              {t.created_by_email && (
                <p className="text-xs text-gray-500">{t.created_by_email}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled || busyId !== null}
                onClick={() => void handleRun(t)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5" />
                Ejecutar
              </button>
              <button
                type="button"
                disabled={disabled || busyId !== null}
                onClick={() => void handleDelete(t)}
                className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
