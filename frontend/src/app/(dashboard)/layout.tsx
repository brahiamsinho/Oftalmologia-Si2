'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header  from '@/components/layout/Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const marginLeft = isCollapsed ? 64 : 220;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div
        className="flex flex-col flex-1 min-w-0 transition-[margin-left] duration-300"
        style={{ marginLeft }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
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
