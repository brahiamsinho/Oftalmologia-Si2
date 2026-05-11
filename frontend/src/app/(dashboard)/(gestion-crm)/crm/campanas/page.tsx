'use client';

/**
 * Campañas CRM — agrupan comunicaciones y segmentos de pacientes.
 * Ruta: /crm/campanas
 * Backend: GET /crm-campanas/
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Megaphone, CalendarRange, Layers, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { campanaCRMService, type CampanaCRM } from '@/lib/services/crm';

const ESTADO_STYLE: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700 border border-slate-200',
  ACTIVA: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  PAUSADA: 'bg-amber-50 text-amber-900 border border-amber-200',
  FINALIZADA: 'bg-gray-100 text-gray-700 border border-gray-200',
};

const ESTADO_LABEL: Record<string, string> = {
  BORRADOR: 'Borrador',
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  FINALIZADA: 'Finalizada',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CRMCampanasPage() {
  const [items, setItems] = useState<CampanaCRM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await campanaCRMService.list();
      setItems(res.results ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar las campañas.';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const byEstado = { ACTIVA: 0, BORRADOR: 0, PAUSADA: 0, FINALIZADA: 0 };
    for (const c of items) {
      const k = c.estado as keyof typeof byEstado;
      if (k in byEstado) byEstado[k] += 1;
    }
    return byEstado;
  }, [items]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm">
            <Megaphone className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">CRM</p>
            <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-gray-600">
              Agrupá mensajes y recordatorios bajo un nombre, con fechas y segmento de pacientes. Las
              comunicaciones concretas se registran en{' '}
              <Link
                href="/crm/contactos"
                className="font-medium text-indigo-600 underline-offset-2 hover:underline"
              >
                Comunicaciones
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled
            title="Creación de campañas desde el panel estará disponible próximamente."
            className="inline-flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-400 shadow-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nueva campaña
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Actualizar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill label="Activas" value={counts.ACTIVA} tone="emerald" />
        <StatPill label="Borradores" value={counts.BORRADOR} tone="slate" />
        <StatPill label="Pausadas" value={counts.PAUSADA} tone="amber" />
        <StatPill label="Finalizadas" value={counts.FINALIZADA} tone="gray" />
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
              className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100"
            />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Megaphone className="h-7 w-7" strokeWidth={1.8} aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Aún no hay campañas</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Cuando tu equipo cree campañas, aparecerán aquí con estado, fechas y vínculo al segmento de
            pacientes.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <li key={c.id_campana}>
              <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="min-w-0 text-[15px] font-bold leading-snug text-gray-900">
                    {c.nombre}
                  </h2>
                  <span
                    className={`inline-flex flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ESTADO_STYLE[c.estado] ?? ESTADO_STYLE.BORRADOR}`}
                  >
                    {ESTADO_LABEL[c.estado] ?? c.estado}
                  </span>
                </div>
                {c.descripcion ? (
                  <p className="mb-4 line-clamp-3 text-sm text-gray-600">{c.descripcion}</p>
                ) : (
                  <p className="mb-4 text-sm italic text-gray-400">Sin descripción</p>
                )}
                <dl className="mt-auto space-y-2 border-t border-gray-100 pt-4 text-[13px] text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
                    <div>
                      <dt className="sr-only">Periodo</dt>
                      <dd>
                        {formatDate(c.fecha_inicio)}
                        {c.fecha_fin ? ` → ${formatDate(c.fecha_fin)}` : ' · sin fecha de fin'}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
                    <div>
                      <dt className="sr-only">Segmentación</dt>
                      <dd>Segmento #{c.id_segmentacion}</dd>
                    </div>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'slate' | 'amber' | 'gray';
}) {
  const bg =
    tone === 'emerald'
      ? 'bg-emerald-50 border-emerald-100'
      : tone === 'amber'
        ? 'bg-amber-50 border-amber-100'
        : tone === 'slate'
          ? 'bg-slate-50 border-slate-100'
          : 'bg-gray-50 border-gray-100';
  return (
    <div className={`rounded-xl border px-4 py-3 ${bg}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}
