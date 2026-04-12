'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileDrawerOpen: boolean;
  toggle: () => void;
  closeMobileDrawer: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  isMobileDrawerOpen: false,
  toggle: () => {},
  closeMobileDrawer: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggle = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setMobileDrawerOpen((v) => !v);
    } else {
      setIsCollapsed((v) => !v);
    }
  }, []);

  const closeMobileDrawer = useCallback(() => setMobileDrawerOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, isMobileDrawerOpen, toggle, closeMobileDrawer }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
