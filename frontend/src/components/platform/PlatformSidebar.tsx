'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { PlatformTokenStorage } from '@/lib/platformApi';

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ElementType;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        title={collapsed ? label : undefined}
        onClick={onNavigate}
        className={`group flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all duration-150
          ${collapsed ? 'px-[13px] py-[9px] justify-center' : 'px-3 py-[9px]'}
          ${active
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
      >
        <Icon
          className={`flex-shrink-0 transition-colors
            ${collapsed ? 'h-[18px] w-[18px]' : 'h-[15px] w-[15px]'}
            ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
          strokeWidth={active ? 2.2 : 1.8}
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    </li>
  );
}

/**
 * Sidebar del panel superadmin — mismo patrón visual que el dashboard de clínica
 * (`Sidebar.tsx`): fondo blanco, borde, colapsable, drawer en móvil.
 * No enlaza a `/login` (portal clínica): el shell queda acotado a operación plataforma;
 * el acceso público de clínicas es otra URL y otra sesión (JWT tenant vs platform).
 */
export default function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, isMobileDrawerOpen, toggle, closeMobileDrawer } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 768px)', false);

  const widthPx = isDesktop ? (isCollapsed ? 64 : 220) : 220;
  const offCanvas = !isDesktop && !isMobileDrawerOpen;

  const is = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const logout = () => {
    PlatformTokenStorage.clear();
    closeMobileDrawer();
    router.replace('/platform/login');
  };

  return (
    <aside
      style={{ width: widthPx }}
      className={`fixed left-0 top-0 z-[45] flex h-screen select-none flex-col overflow-hidden border-r border-gray-200 bg-white transition-[transform,width] duration-300 ease-out ${
        offCanvas ? '-translate-x-full' : 'translate-x-0'
      }`}
    >
      <div
        className={`flex h-[60px] flex-shrink-0 items-center border-b border-gray-100 px-3 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed && (
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl shadow-sm"
              style={{ backgroundColor: '#2563eb' }}
            >
              <Building2 className="h-[17px] w-[17px] text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-gray-900">
                OftalmoCRM
              </p>
              <p className="truncate text-[9.5px] leading-tight text-gray-400">
                Plataforma SaaS
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 pt-3">
        <p
          className={`mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400 ${
            isCollapsed ? 'sr-only' : ''
          }`}
        >
          Operación
        </p>
        <ul className="space-y-0.5">
          <NavItem
            href="/platform/dashboard"
            label="Organizaciones"
            icon={LayoutGrid}
            active={is('/platform/dashboard')}
            collapsed={isCollapsed}
            onNavigate={closeMobileDrawer}
          />
        </ul>
      </nav>

      <div className="flex-shrink-0 border-t border-gray-100 p-2">
        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? 'Cerrar sesión plataforma' : undefined}
          className={`flex w-full items-center gap-2.5 rounded-lg py-2.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 ${
            isCollapsed ? 'justify-center px-2' : 'px-3'
          }`}
        >
          <LogOut className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.8} />
          {!isCollapsed && <span>Salir plataforma</span>}
        </button>
      </div>
    </aside>
  );
}
