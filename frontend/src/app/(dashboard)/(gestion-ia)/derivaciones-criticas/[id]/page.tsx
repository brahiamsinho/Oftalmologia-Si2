'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, CheckCircle, Clock, Loader2,
  ShieldCheck, UserRound, UserCheck, XCircle,
} from 'lucide-react';

import {
  acceptHandoff,
  cancelHandoff,
  failHandoff,
  getHandoff,
  resolveHandoff,
  startCareHandoff,
} from '@/services/iaService';
import type { CriticalHandoffDetail } from '@/services/iaService';

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

const TERMINAL = new Set(['RESUELTA', 'CANCELADA', 'FALLIDA']);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  );
}

export default function DerivacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<CriticalHandoffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getHandoff(Number(id))
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar derivación'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAccept = useCallback(async () => {
    setActionLoading('accept');
    try {
      const updated = await acceptHandoff(Number(id));
      setData(updated);
    } catch {
      setError('Error al aceptar la derivación');
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  const handleStartCare = useCallback(async () => {
    setActionLoading('start-care');
    try {
      const updated = await startCareHandoff(Number(id));
      setData(updated);
    } catch {
      setError('Error al iniciar atención');
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  const handleResolve = useCallback(async () => {
    setActionLoading('resolve');
    try {
      const updated = await resolveHandoff(Number(id));
      setData(updated);
    } catch {
      setError('Error al resolver la derivación');
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  const handleCancel = useCallback(async () => {
    setActionLoading('cancel');
    try {
      const updated = await cancelHandoff(Number(id));
      setData(updated);
    } catch {
      setError('Error al cancelar la derivación');
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  const handleFail = useCallback(async () => {
    setActionLoading('fail');
    try {
      const updated = await failHandoff(Number(id));
      setData(updated);
    } catch {
      setError('Error al marcar como fallida');
    } finally {
      setActionLoading(null);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error || 'Derivación no encontrada'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-10">
      <button
        type="button"
        onClick={() => router.push('/derivaciones-criticas')}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a derivaciones
      </button>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Derivación crítica</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {data.paciente_nombre}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${URGENCIA_STYLE[data.nivel_urgencia] || 'bg-gray-100 text-gray-700'}`}>
            {data.nivel_urgencia}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${ESTADO_STYLE[data.estado] || ''}`}>
            {data.estado}
          </span>
        </div>
      </header>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Información del paciente</h2>
          <dl className="space-y-3">
            <Field label="Nombre">
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-gray-400" />
                {data.paciente_nombre}
              </span>
            </Field>
            <Field label="ID paciente">{data.paciente}</Field>
          </dl>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Línea de tiempo</h2>
          <dl className="space-y-3">
            <Field label="Creado">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-400" />
                {new Date(data.created_at).toLocaleString('es-BO')}
              </span>
            </Field>
            {data.notificado_en && (
              <Field label="Notificado">
                {new Date(data.notificado_en).toLocaleString('es-BO')}
              </Field>
            )}
            {data.aceptado_en && (
              <Field label="Aceptado">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  {new Date(data.aceptado_en).toLocaleString('es-BO')}
                </span>
              </Field>
            )}
            {data.resuelto_en && (
              <Field label="Resuelto">
                {new Date(data.resuelto_en).toLocaleString('es-BO')}
              </Field>
            )}
          </dl>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Mensaje original</h2>
        <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          {data.mensaje_original}
        </p>
      </section>

      {data.criterios_detectados.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Criterios detectados</h2>
          <ul className="space-y-2">
            {data.criterios_detectados.map((c: Record<string, unknown>, i: number) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-orange-50 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <div>
                  <span className="font-semibold text-orange-800">{c.label as string}</span>
                  <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.level === 'ALTO' || c.level === 'CRITICO'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {c.level as string}
                  </span>
                  {c.matched_terms && (c.matched_terms as string[]).length > 0 && (
                    <div className="mt-1 text-gray-500">
                      Términos: {(c.matched_terms as string[]).join(', ')}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!TERMINAL.has(data.estado) && (
        <section className="flex flex-wrap gap-3">
          {(data.estado === 'PENDIENTE' || data.estado === 'NOTIFICADA') && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Aceptar derivación
            </button>
          )}

          {data.estado === 'ACEPTADA' && (
            <button
              type="button"
              onClick={handleStartCare}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'start-care' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Iniciar atención
            </button>
          )}

          {data.estado !== 'PENDIENTE' && data.estado !== 'NOTIFICADA' && (
            <button
              type="button"
              onClick={handleResolve}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'resolve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Marcar como resuelto
            </button>
          )}

          {(data.estado === 'ACEPTADA' || data.estado === 'EN_ATENCION') && (
            <button
              type="button"
              onClick={handleFail}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'fail' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Marcar como fallida
            </button>
          )}

          {data.estado !== 'PENDIENTE' && data.estado !== 'NOTIFICADA' && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancelar derivación
            </button>
          )}
        </section>
      )}

      {data.estado === 'RESUELTA' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
          Esta derivación ya fue resuelta.
        </div>
      )}

      {data.estado === 'CANCELADA' && (
        <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-4 text-sm text-gray-600">
          <XCircle className="h-5 w-5 shrink-0 text-gray-400" />
          Esta derivación fue cancelada.
        </div>
      )}

      {data.estado === 'FALLIDA' && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <XCircle className="h-5 w-5 shrink-0 text-red-500" />
          Esta derivación fue marcada como fallida.
        </div>
      )}
    </div>
  );
}
