'use client';

import { useState } from 'react';
import Link   from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header  from '@/components/layout/Header';
import { ClinicSessionGate } from '@/components/auth/ClinicSessionGate';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { TenantProvider, useTenant }   from '@/context/TenantContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { X, Clock, TrendingUp } from 'lucide-react';

// ── Banner de período de prueba ───────────────────────────────────────────────
function TrialBanner() {
  const { trial, loading } = useTenant();
  const [dismissed, setDismissed] = useState(false);

  if (loading || !trial.isTrial || dismissed) return null;

  const { diasRestantes } = trial;

  // Color según urgencia
  const colorClass =
    diasRestantes !== null && diasRestantes <= 3
      ? 'bg-red-600 border-red-700'
      : diasRestantes !== null && diasRestantes <= 7
        ? 'bg-orange-500 border-orange-600'
        : 'bg-amber-500 border-amber-600';

  const mensaje =
    diasRestantes === null
      ? 'Estás en período de prueba.'
      : diasRestantes === 0
        ? 'Tu período de prueba vence hoy.'
        : `Tu período de prueba vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}.`;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-white text-[12.5px] font-medium border-b ${colorClass}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{mensaje} Mejorá tu plan para no perder el acceso.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/planes"
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white
                     text-[11.5px] font-semibold px-3 py-1 rounded-lg transition-colors"
        >
          <TrendingUp className="w-3 h-3" />
          Ver Planes
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
          title="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Layout interno ─────────────────────────────────────────────────────────────
function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileDrawerOpen, closeMobileDrawer } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 768px)', false);
  const marginLeft = isDesktop ? (isCollapsed ? 64 : 244) : 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {isMobileDrawerOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-[35] bg-black/40 md:hidden"
          onClick={closeMobileDrawer}
        />
      )}
      <Sidebar />
      <div
        className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden transition-[margin-left] duration-300"
        style={{ marginLeft }}
      >
        <Header />
        <TrialBanner />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClinicSessionGate>
      <TenantProvider>
        <SidebarProvider>
          <DashboardInner>{children}</DashboardInner>
        </SidebarProvider>
      </TenantProvider>
    </ClinicSessionGate>
  );
}
