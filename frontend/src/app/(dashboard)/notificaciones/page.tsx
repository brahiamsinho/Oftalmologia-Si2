'use client';

/**
 * Centro de notificaciones (bandeja). Vista inicial; integración con API cuando aplique.
 */

import Link from 'next/link';
import { Bell, Settings } from 'lucide-react';

export default function NotificacionesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 shadow-sm">
          <Bell className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="mt-1 text-sm text-gray-600">
            Aquí verás avisos del sistema y recordatorios cuando estén conectados al backend de notificaciones.
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-[15px] font-medium text-gray-800">No hay notificaciones nuevas</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          La bandeja está lista; cuando el plan incluya envíos automáticos y reglas activas, los avisos
          aparecerán en esta vista.
        </p>
        <Link
          href="/configuracion-org"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          <Settings className="h-4 w-4" aria-hidden />
          Revisar configuración de la organización
        </Link>
      </div>
    </div>
  );
}
