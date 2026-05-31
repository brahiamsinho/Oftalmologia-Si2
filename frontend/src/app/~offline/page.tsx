import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <WifiOff className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Sin conexión</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          No hay internet en este momento. Podés volver a intentar cuando recuperes la señal.
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Por seguridad clínica, los datos del sistema no se muestran en modo offline.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Reintentar
        </Link>
      </section>
    </main>
  );
}
