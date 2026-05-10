'use client';

import React from 'react';

import { filterTechnicalColumns } from './columnUtils';

interface Props {
  /** Columnas completas devueltas por el backend (meta.columns). */
  columns: string[];
  /** Subconjunto visible y ordenado; si se omite, se ocultan por defecto `id` y `*_id`. */
  visibleColumns?: string[] | null;
  data: Record<string, unknown>[];
}

function headerLabel(col: string): string {
  return col.replace(/_/g, ' ');
}

const NEGATIVE_ESTADO = new Set([
  'CANCELADA',
  'NO_ASISTIO',
  'INACTIVO',
  'NO_APTO',
  'RECHAZADA',
]);

const POSITIVE_ESTADO = new Set([
  'ACTIVO',
  'CONFIRMADA',
  'ATENDIDA',
  'APTO',
  'PROGRAMADA',
  'EN_SEGUIMIENTO',
  'POSTOPERATORIO',
]);

const NEUTRAL_AMBER = new Set(['PENDIENTE', 'REPROGRAMADA', 'EN_PROCESO', 'APTO_CON_OBSERVACIONES']);

function estadoBadgeClass(raw: unknown): string {
  const token = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (!token) return 'bg-gray-50 text-gray-600 ring-1 ring-gray-200';
  if (NEGATIVE_ESTADO.has(token)) {
    return 'bg-red-50 text-red-800 ring-1 ring-red-200';
  }
  if (NEUTRAL_AMBER.has(token)) {
    return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200';
  }
  if (POSITIVE_ESTADO.has(token)) {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200';
  }
  return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
}

function CellContent({ col, value }: { col: string; value: unknown }) {
  const isEstado = col === 'estado' || col === 'estado_paciente';
  if (isEstado) {
    const display = value !== null && value !== undefined ? String(value) : '—';
    return (
      <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ${estadoBadgeClass(value)}`}>
        <span className="truncate">{display}</span>
      </span>
    );
  }
  if (value !== null && value !== undefined) {
    if (typeof value === 'object') return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
    return <span>{String(value)}</span>;
  }
  return <span className="text-gray-400">-</span>;
}

export default function DynamicTable({ columns, visibleColumns, data }: Props) {
  const effective =
    visibleColumns != null ? visibleColumns : filterTechnicalColumns(columns);

  if (!columns.length || !data.length) return null;

  if (effective.length === 0) {
    return (
      <div className="mt-8 overflow-hidden rounded-2xl bg-amber-50/80 py-12 text-center shadow-sm ring-1 ring-amber-200/60">
        <p className="mx-auto max-w-sm text-sm text-amber-900">
          No hay columnas visibles. Abrí <strong>Columnas</strong> y tildá al menos una.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 sm:rounded-2xl">
      <div className="max-h-[600px] overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
            <tr>
              {effective.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="whitespace-nowrap px-6 py-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  {headerLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors even:bg-gray-50/50 hover:bg-gray-100/50"
              >
                {effective.map((col) => (
                  <td
                    key={`${rowIndex}-${col}`}
                    className="whitespace-nowrap px-6 py-5 text-sm text-gray-800"
                  >
                    <CellContent col={col} value={row[col]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
