'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';

import { postExecuteQbe, postNlpToReport } from '@/services/iaService';
import type { NlpToReportResponse, QBEPayload } from '@/types/reportes';

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
  error: string | null;
  submitQuery: (query: string) => Promise<void>;
  removeFilterKey: (filterKey: string) => Promise<void>;
  reset: () => void;
}

/**
 * NL → QBE (Gemini) y re-ejecución ORM al editar filtros (human-in-the-loop).
 */
export function useSmartReport(): UseSmartReportResult {
  const [data, setData] = useState<NlpToReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef<NlpToReportResponse | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const reset = useCallback(() => {
    setData(null);
    dataRef.current = null;
    setError(null);
  }, []);

  const submitQuery = useCallback(async (query: string) => {
    setLoading(true);
    setUpdating(false);
    setError(null);
    setData(null);
    try {
      const result = await postNlpToReport(query);
      setData(result);
    } catch (e: unknown) {
      const msg =
        extractAxiosMessage(e) ??
        (e instanceof Error ? e.message : null) ??
        'No se pudo generar el reporte.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

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
    error,
    submitQuery,
    removeFilterKey,
    reset,
  };
}
