'use client';

/**
 * Centro de notificaciones conectado al backend.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2, AlertTriangle, Inbox, RotateCcw } from 'lucide-react';

import { notificacionesService, type Notificacion } from '@/lib/services/notificaciones';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

function isUrgentNotification(notification: Notificacion): boolean {
  return notification.tipo === 'derivacion_urgente' || notification.tipo.includes('urgente');
}

export default function NotificacionesPage() {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  const urgentCount = useMemo(
    () => items.filter((notification) => isUrgentNotification(notification)).length,
    [items],
  );

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await notificacionesService.list();
      if (!mountedRef.current) return;
      setItems(data.results ?? []);
      setNoLeidas(data.no_leidas ?? 0);
      if (!silent) {
        setError(null);
      }
    } catch {
      if (!silent && mountedRef.current) {
        setError('No se pudieron cargar las notificaciones.');
      }
    } finally {
      if (mountedRef.current && !silent) {
        setLoading(false);
      }
      refreshInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    const intervalId = window.setInterval(() => {
      void refresh({ silent: true });
    }, 20_000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const markOne = async (notification: Notificacion) => {
    if (notification.leida || saving) return;
    setSaving(true);
    refreshInFlightRef.current = true;
    try {
      await notificacionesService.marcarLeida(notification.id);
      setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, leida: true } : item)));
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } finally {
      refreshInFlightRef.current = false;
      setSaving(false);
    }
  };

  const markAll = async () => {
    if (noLeidas === 0 || saving) return;
    setSaving(true);
    refreshInFlightRef.current = true;
    try {
      await notificacionesService.marcarTodasLeidas();
      setItems((prev) => prev.map((item) => ({ ...item, leida: true })));
      setNoLeidas(0);
    } finally {
      refreshInFlightRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 shadow-sm">
          <Bell className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-gray-600">
            Revisá los avisos del sistema, los recordatorios y las derivaciones urgentes del asistente.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
              No leídas: {noLeidas}
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
              Urgentes: {urgentCount}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => void markAll()}
              disabled={noLeidas === 0 || saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              Marcar todo leído
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center gap-3 px-6 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Cargando notificaciones...
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Inbox className="h-6 w-6 text-gray-300" aria-hidden />
            </div>
            <p className="mt-4 text-[15px] font-medium text-gray-800">No hay notificaciones nuevas</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Cuando el sistema derive un caso urgente o llegue un recordatorio, aparecerá aquí.
            </p>
            <Link
              href="/configuracion-org"
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Revisar configuración de la organización
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((notification) => {
              const urgent = isUrgentNotification(notification);
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => void markOne(notification)}
                    className={`w-full px-5 py-4 text-left transition-colors hover:bg-gray-50 ${!notification.leida ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${urgent ? 'bg-red-500' : !notification.leida ? 'bg-blue-500' : 'bg-transparent'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`text-sm ${!notification.leida ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notification.titulo}
                          </p>
                          {urgent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                              Derivación urgente
                            </span>
                          )}
                          {!notification.leida && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              Nueva
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-gray-600">{notification.cuerpo}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                          <span>{formatRelative(notification.creada_en)}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium uppercase tracking-wide text-gray-600">
                            {urgent ? 'Alta prioridad' : notification.tipo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
