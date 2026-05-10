'use client';

import { useEffect, useRef, useState } from 'react';
import { Columns2, ChevronDown } from 'lucide-react';

export interface ReportColumnPickerProps {
  columns: string[];
  visibility: Record<string, boolean>;
  onToggle: (columnKey: string) => void;
  disabled?: boolean;
}

function labelize(key: string): string {
  return key.replace(/_/g, ' ');
}

export default function ReportColumnPicker({
  columns,
  visibility,
  onToggle,
  disabled = false,
}: ReportColumnPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const visibleCount = columns.filter((c) => visibility[c] !== false).length;

  if (!columns.length) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns2 className="h-4 w-4 text-indigo-600" aria-hidden />
        Columnas
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {visibleCount}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-72 max-h-[min(70vh,22rem)] overflow-y-auto rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/5"
          role="listbox"
          aria-label="Selección de columnas"
        >
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Mostrar u ocultar
          </p>
          <ul className="space-y-1">
            {columns.map((col) => {
              const checked = visibility[col] !== false;
              return (
                <li key={col}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-800 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={checked}
                      onChange={() => onToggle(col)}
                    />
                    <span className="min-w-0 flex-1 truncate" title={col}>
                      {labelize(col)}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
