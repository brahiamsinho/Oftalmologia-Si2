'use client';

import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import PlatformHeader from '@/components/platform/PlatformHeader';
import PlatformSidebar from '@/components/platform/PlatformSidebar';

function PlatformDashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileDrawerOpen, closeMobileDrawer } = useSidebar();
  const isDesktop = useMediaQuery('(min-width: 768px)', false);
  const marginLeft = isDesktop ? (isCollapsed ? 64 : 220) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {isMobileDrawerOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-[35] bg-black/40 md:hidden"
          onClick={closeMobileDrawer}
        />
      )}
      <PlatformSidebar />
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-300"
        style={{ marginLeft }}
      >
        <PlatformHeader />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function PlatformDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PlatformDashboardShell>{children}</PlatformDashboardShell>
    </SidebarProvider>
  );
}
