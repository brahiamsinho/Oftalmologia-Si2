'use client';

import { useCallback, useState } from 'react';
import { AxiosError } from 'axios';

import { postNlpToReport } from '@/services/iaService';
import type { NlpToReportResponse } from '@/types/reportes';

function extractAxiosMessage(err: unknown): string | null {
  if (!(err instanceof AxiosError)) return null;
  const d = err.response?.data as { detail?: unknown } | undefined;
  const detail = d?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.join(' ');
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return err.message || null;
}

export interface UseAIReportResult {
  data: NlpToReportResponse | null;
  loading: boolean;
  error: string | null;
  runReport: (query: string) => Promise<void>;
  reset: () => void;
}

/**
 * Orquesta la llamada NL → QBE + datos del reporte (tenant + JWT vía axios).
 */
export function useAIReport(): UseAIReportResult {
  const [data, setData] = useState<NlpToReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const runReport = useCallback(async (query: string) => {
    setLoading(true);
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

  return { data, loading, error, runReport, reset };
}
