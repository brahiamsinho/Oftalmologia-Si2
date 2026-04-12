'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header  from '@/components/layout/Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileDrawerOpen, closeMobileDrawer } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 768px)', false);
  const marginLeft = isDesktop ? (isCollapsed ? 64 : 220) : 0;

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
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  );
}
