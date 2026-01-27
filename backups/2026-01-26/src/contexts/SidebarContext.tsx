import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  isMobile: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Sidebar collapsed state (default: open on desktop, closed on mobile)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check localStorage
    const saved = localStorage.getItem('lele-hcm-sidebar-collapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default: collapsed on mobile
    return window.innerWidth < 768;
  });

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-collapse on mobile if not manually set
      if (mobile && !localStorage.getItem('lele-hcm-sidebar-collapsed')) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('lele-hcm-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const collapseSidebar = () => {
    setIsCollapsed(true);
  };

  const expandSidebar = () => {
    setIsCollapsed(false);
  };

  const value: SidebarContextType = {
    isCollapsed,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    isMobile,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
