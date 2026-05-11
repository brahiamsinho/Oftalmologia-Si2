'use client';

/**
 * Segmentaciones de pacientes para CRM (audiencias / filtros guardados).
 * Ruta: /crm/segmentaciones
 * Backend: GET /crm-segmentaciones/
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Tags, RefreshCw, AlertTriangle, CheckCircle2, CircleSlash } from 'lucide-react';
import {
  segmentacionCRMService,
  type SegmentacionPaciente,
} from '@/lib/services/crm';

export default function CRMSegmentacionesPage() {
  const [items, setItems] = useState<SegmentacionPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await segmentacionCRMService.list();
      setItems(res.results ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar las segmentaciones.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activas = items.filter((s) => s.activo).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-600 shadow-sm">
            <Tags className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">CRM</p>
            <h1 className="text-2xl font-bold text-gray-900">Segmentaciones</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-gray-600">
              Grupos de pacientes definidos por criterios; las{' '}
              <Link href="/crm/campanas" className="font-medium text-violet-700 underline-offset-2 hover:underline">
                campañas
              </Link>{' '}
              pueden apuntar a un segmento para organizar comunicaciones.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Actualizar
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-gray-900">{items.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Activas</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-emerald-900">{activas}</p>
        </div>
        <div className="hidden rounded-xl border border-gray-100 bg-white px-4 py-3 sm:block">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Comunicaciones</p>
          <Link
            href="/crm/contactos"
            className="mt-2 inline-flex text-sm font-semibold text-violet-700 hover:underline"
          >
            Ir a comunicaciones →
          </Link>
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">No se pudo cargar el listado</p>
            <p className="mt-1 text-red-700/90">{error}</p>
          </div>
        </div>
      )}

      {loading && !items.length && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100"
            />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Tags className="h-7 w-7" strokeWidth={1.8} aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Sin segmentaciones</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Cuando se definan grupos de pacientes (por ejemplo desde administración o futuros asistentes),
            aparecerán aquí para usarlos en campañas.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <li key={s.id_segmentacion}>
              <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="min-w-0 text-[15px] font-bold leading-snug text-gray-900">{s.nombre}</h2>
                  {s.activo ? (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                      <CircleSlash className="h-3 w-3" aria-hidden />
                      Inactiva
                    </span>
                  )}
                </div>
                {s.descripcion ? (
                  <p className="mb-3 line-clamp-3 text-sm text-gray-600">{s.descripcion}</p>
                ) : (
                  <p className="mb-3 text-sm italic text-gray-400">Sin descripción</p>
                )}
                {s.criterios ? (
                  <p className="mt-auto border-t border-gray-100 pt-3 font-mono text-[11px] leading-relaxed text-gray-500">
                    {s.criterios}
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
