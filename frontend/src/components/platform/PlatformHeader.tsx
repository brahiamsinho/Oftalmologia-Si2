'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { PlatformTokenStorage } from '@/lib/platformApi';

const BREADCRUMB: Record<string, string> = {
  '/platform/dashboard': 'Organizaciones',
};

/**
 * Barra superior del panel superadmin — alineada al Header del dashboard clínica:
 * menú hamburger, jerarquía de pantalla, accesos rápidos.
 */
export default function PlatformHeader() {
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();

  const crumb =
    Object.entries(BREADCRUMB)
      .filter(([k]) => pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Plataforma';

  const logout = () => {
    PlatformTokenStorage.clear();
    router.replace('/platform/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 min-h-[44px] w-10 min-w-[44px] flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Abrir o cerrar menú lateral"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Superadmin
          </p>
          <p className="truncate text-[14px] font-semibold text-gray-800">{crumb}</p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={logout}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
