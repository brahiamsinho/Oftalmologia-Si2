'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, Clock, Loader2, UserRound } from 'lucide-react';
import { AxiosError } from 'axios';

import { useAuth } from '@/context/AuthContext';
import { listHandoffs } from '@/services/iaService';
import type { CriticalHandoffListItem } from '@/services/iaService';

const ESTADO_STYLE: Record<string, string> = {
  PENDIENTE:  'bg-yellow-50 text-yellow-700 border-yellow-100',
  NOTIFICADA: 'bg-orange-50 text-orange-700 border-orange-100',
  ASIGNADA:   'bg-blue-50 text-blue-700 border-blue-100',
  ACEPTADA:   'bg-indigo-50 text-indigo-700 border-indigo-100',
  EN_ATENCION:'bg-purple-50 text-purple-700 border-purple-100',
  RESUELTA:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  FALLIDA:    'bg-red-50 text-red-700 border-red-100',
  CANCELADA:  'bg-gray-50 text-gray-500 border-gray-200',
};

const URGENCIA_STYLE: Record<string, string> = {
  CRITICO: 'bg-red-100 text-red-800',
  ALTO:    'bg-orange-100 text-orange-800',
  MEDIO:   'bg-yellow-100 text-yellow-800',
  BAJO:    'bg-green-100 text-green-800',
};

export default function DerivacionesCriticasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CriticalHandoffListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canView = !!user && user.tipo_usuario !== 'PACIENTE';

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    listHandoffs()
      .then(setItems)
      .catch((e) => {
        if (e instanceof AxiosError && e.response?.status === 403) {
          setError('Tu usuario no tiene permiso para ver las derivaciones criticas.');
          return;
        }
        setError(e instanceof Error ? e.message : 'Error al cargar derivaciones');
      })
      .finally(() => setLoading(false));
  }, [canView]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <h1 className="text-base font-bold">Acceso restringido</h1>
          <p className="mt-2 leading-6">
            Esta pantalla es solo para personal de la clínica. Las derivaciones criticas no están disponibles para cuentas de paciente.
          </p>
          <Link href="/dashboard" className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700">
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

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
          <AlertTriangle className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Inteligencia artificial</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Derivaciones críticas</h1>
        <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
          Casos críticos derivados del chatbot que requieren atención humana inmediata.
        </p>
      </header>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-500">No hay derivaciones críticas pendientes.</p>
        </div>
      )}

      {items.length > 0 && (
        <section className="grid gap-3">
          {items.map((h) => (
            <Link
              key={h.handoff_id}
              href={`/derivaciones-criticas/${h.handoff_id}`}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <UserRound className="h-4 w-4 text-gray-400" />
                    {h.paciente_nombre}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCIA_STYLE[h.nivel_urgencia] || 'bg-gray-100 text-gray-700'}`}>
                    {h.nivel_urgencia}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${ESTADO_STYLE[h.estado] || ''}`}>
                    {h.estado}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(h.created_at).toLocaleDateString('es-BO', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 transition group-hover:text-indigo-500" />
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
