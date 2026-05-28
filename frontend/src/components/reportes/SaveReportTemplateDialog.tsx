'use client';

import { useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';

import { createReportTemplate } from '@/lib/services/reportes';
import type { QBEPayload } from '@/types/reportes';

interface SaveReportTemplateDialogProps {
  open: boolean;
  qbe: QBEPayload | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveReportTemplateDialog({
  open,
  qbe,
  onClose,
  onSaved,
}: SaveReportTemplateDialogProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !qbe) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createReportTemplate({
        nombre: trimmed,
        descripcion: descripcion.trim(),
        qbe_payload: qbe,
      });
      setNombre('');
      setDescripcion('');
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la plantilla.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2 id="save-template-title" className="text-lg font-semibold text-gray-900">
              Guardar informe personalizado
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="template-nombre" className="mb-1 block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="template-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ej. Citas del mes por especialista"
              disabled={saving}
            />
          </div>
          <div>
            <label
              htmlFor="template-descripcion"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Descripción (opcional)
            </label>
            <textarea
              id="template-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              disabled={saving}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-[44px] flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
