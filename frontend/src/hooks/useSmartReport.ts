'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';

import { downloadQbeExports, isReportExportFormat } from '@/lib/reportExport';
import { postExecuteQbe, postNlpToReport } from '@/services/iaService';
import type { NlpToReportResponse, QBEPayload, ReportExportFormat } from '@/types/reportes';

function extractAxiosMessage(err: unknown): string | null {
  if (!(err instanceof AxiosError)) return null;
  const d = err.response?.data as { detail?: unknown } | undefined;
  const detail = d?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.join(' ');
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return err.message || null;
}

export interface UseSmartReportResult {
  data: NlpToReportResponse | null;
  loading: boolean;
  updating: boolean;
  exporting: boolean;
  exportNotice: string | null;
  error: string | null;
  submitQuery: (query: string) => Promise<void>;
  /** Carga resultado ya ejecutado (plantilla predefinida / guardada, sin NLP). */
  loadReportResult: (result: NlpToReportResponse) => void;
  removeFilterKey: (filterKey: string) => Promise<void>;
  downloadFormats: (formats: ReportExportFormat[]) => Promise<void>;
  reset: () => void;
}

/**
 * NL → QBE (Gemini) y re-ejecución ORM al editar filtros (human-in-the-loop).
 */
export function useSmartReport(): UseSmartReportResult {
  const [data, setData] = useState<NlpToReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<NlpToReportResponse | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const reset = useCallback(() => {
    setData(null);
    dataRef.current = null;
    setError(null);
    setExportNotice(null);
  }, []);

  const runExports = useCallback(async (formats: ReportExportFormat[], qbe: QBEPayload) => {
    if (!formats.length) return;
    setExporting(true);
    setExportNotice(`Descargando ${formats.join(' y ').toUpperCase()}…`);
    try {
      await downloadQbeExports(formats, qbe);
      setExportNotice(`Archivos descargados: ${formats.join(', ').toUpperCase()}.`);
    } catch (e: unknown) {
      const msg =
        extractAxiosMessage(e) ??
        (e instanceof Error ? e.message : null) ??
        'No se pudo exportar el reporte.';
      setError(msg);
      setExportNotice(null);
    } finally {
      setExporting(false);
    }
  }, []);

  const downloadFormats = useCallback(
    async (formats: ReportExportFormat[]) => {
      const current = dataRef.current;
      if (!current?.qbe || !formats.length) return;
      await runExports(formats, current.qbe);
    },
    [runExports],
  );

  const loadReportResult = useCallback((result: NlpToReportResponse) => {
    setLoading(false);
    setUpdating(false);
    setExporting(false);
    setError(null);
    setExportNotice(null);
    setData(result);
    dataRef.current = result;
  }, []);

  const submitQuery = useCallback(async (query: string) => {
    setLoading(true);
    setUpdating(false);
    setExportNotice(null);
    setError(null);
    setData(null);
    try {
      const result = await postNlpToReport(query);
      setData(result);
      dataRef.current = result;

      const requested = (result.export_formats ?? []).filter(isReportExportFormat);
      if (requested.length > 0 && result.qbe) {
        await runExports(requested, result.qbe);
      }
    } catch (e: unknown) {
      const msg =
        extractAxiosMessage(e) ??
        (e instanceof Error ? e.message : null) ??
        'No se pudo generar el reporte.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [runExports]);

  const removeFilterKey = useCallback(async (filterKey: string) => {
    const current = dataRef.current;
    if (!current?.qbe) return;

    const nextFilters = { ...current.qbe.filters };
    if (!(filterKey in nextFilters)) return;
    delete nextFilters[filterKey];

    const nextQbe: QBEPayload = {
      ...current.qbe,
      filters: nextFilters,
    };

    setUpdating(true);
    setError(null);
    try {
      const report = await postExecuteQbe(nextQbe);
      const next: NlpToReportResponse = {
        qbe: nextQbe,
        report: {
          meta: report.meta as NlpToReportResponse['report']['meta'],
          data: report.data,
        },
      };
      setData(next);
      dataRef.current = next;
    } catch (e: unknown) {
      const msg =
        extractAxiosMessage(e) ??
        (e instanceof Error ? e.message : null) ??
        'No se pudo actualizar el reporte.';
      setError(msg);
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
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
    reset,
  };
}
