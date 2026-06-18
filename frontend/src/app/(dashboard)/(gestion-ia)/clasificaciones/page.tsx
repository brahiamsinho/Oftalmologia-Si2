'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Brain, CheckCircle2, Clock, Loader2, UserRound, XCircle } from 'lucide-react';

import { listClassifications } from '@/services/iaService';
import type { UrgencyClassificationItem } from '@/services/iaService';

const NIVEL_STYLE: Record<string, string> = {
  CRITICO:       'bg-red-100 text-red-800',
  ALTO:          'bg-orange-100 text-orange-800',
  MEDIO:         'bg-yellow-100 text-yellow-800',
  BAJO:          'bg-green-100 text-green-800',
  INSUFICIENTE:  'bg-gray-100 text-gray-600',
  INDETERMINADO: 'bg-gray-100 text-gray-600',
};

export default function ClasificacionesPage() {
  const [items, setItems] = useState<UrgencyClassificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listClassifications()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar clasificaciones'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <Brain className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Inteligencia artificial</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Clasificaciones de urgencia</h1>
        <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
          Historial de clasificaciones de urgencia generadas por el chatbot (CU24).
          Cada fila representa una consulta de paciente analizada por el clasificador determinístico.
        </p>
      </header>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <Brain className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-500">No hay clasificaciones registradas.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 sm:px-5">Paciente</th>
                <th className="px-4 py-3 sm:px-5">Nivel</th>
                <th className="hidden px-4 py-3 sm:px-5 sm:table-cell">Confianza</th>
                <th className="hidden px-4 py-3 sm:px-5 md:table-cell">Derivación</th>
                <th className="px-4 py-3 sm:px-5">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((c) => (
                <tr key={c.classification_id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 sm:px-5">
                    <span className="flex items-center gap-1.5 font-medium text-gray-900">
                      <UserRound className="h-4 w-4 text-gray-400" />
                      {c.paciente_nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${NIVEL_STYLE[c.nivel] || 'bg-gray-100 text-gray-700'}`}>
                      {c.nivel}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:px-5 sm:table-cell">
                    <span className="text-gray-600">
                      {Math.round(c.confianza * 100)}%
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:px-5 md:table-cell">
                    {c.requiere_atencion_humana ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Requiere atención
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Sin derivación
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(c.created_at).toLocaleDateString('es-BO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
