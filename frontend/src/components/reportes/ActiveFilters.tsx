'use client';

import { X } from 'lucide-react';

export interface ActiveFiltersProps {
  /** Claves y valores tal cual en el payload QBE (`filters`). */
  filters: Record<string, unknown>;
  /** Modelo lógico actual (solo lectura visual). */
  model?: string;
  onRemoveKey: (key: string) => void;
  disabled?: boolean;
}

function formatFilterValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Chips de filtros activos derivados de la IA / QBE; quitar uno dispara re-ejecución en el padre.
 */
export default function ActiveFilters({
  filters,
  model,
  onRemoveKey,
  disabled = false,
}: ActiveFiltersProps) {
  const entries = Object.entries(filters).filter(([k]) => k.length > 0);

  if (entries.length === 0 && !model) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {model && (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200/80">
          Modelo: <span className="ml-1 font-semibold text-gray-800">{model}</span>
        </span>
      )}
      {entries.map(([key, raw]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 pl-3 pr-1 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100"
        >
          <span className="max-w-[min(100vw-8rem,28rem)] truncate">
            <span className="font-semibold">{key}</span>
            {raw !== undefined && (
              <>
                <span className="mx-1 text-indigo-400">·</span>
                <span className="font-normal">{formatFilterValue(raw)}</span>
              </>
            )}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onRemoveKey(key)}
            className="rounded-full p-1 text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-900 disabled:opacity-40"
            aria-label={`Quitar filtro ${key}`}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </span>
      ))}
    </div>
  );
}
