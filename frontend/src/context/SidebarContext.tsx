'use client';

import { createContext, useContext, useState } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle: () => setIsCollapsed(v => !v) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
