import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

// Debug tracking to detect multiple module instances
const MODULE_INSTANCE_ID = Math.random().toString(36).substring(7);

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  instanceId: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  
  const value = useMemo(() => ({
    isCollapsed,
    setIsCollapsed,
    toggleSidebar,
    isMobileOpen,
    setMobileOpen,
    instanceId: MODULE_INSTANCE_ID
  }), [isCollapsed, isMobileOpen]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    console.error(`[SidebarContext] Error: Hook called in module ${MODULE_INSTANCE_ID} but no Provider found in this instance tree.`);
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
