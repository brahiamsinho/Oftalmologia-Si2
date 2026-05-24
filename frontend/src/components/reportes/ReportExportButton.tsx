'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

import { downloadBlob, exportReportExcel } from '@/lib/services/reportes';
import type { QBEPayload } from '@/types/reportes';

interface ReportExportButtonProps {
  qbe: QBEPayload | null | undefined;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export default function ReportExportButton({
  qbe,
  disabled = false,
  onError,
}: ReportExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!qbe?.model) return;
    setExporting(true);
    try {
      const blob = await exportReportExcel(qbe);
      const slug = qbe.model.replace(/\./g, '-').toLowerCase();
      downloadBlob(blob, `reporte-${slug}.xlsx`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo exportar a Excel.';
      onError?.(msg);
    } finally {
      setExporting(false);
    }
  };

  if (!qbe?.model) return null;

  return (
    <button
      type="button"
      disabled={disabled || exporting}
      onClick={() => void handleExport()}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {exporting ? 'Exportando…' : 'Exportar Excel'}
    </button>
  );
}
