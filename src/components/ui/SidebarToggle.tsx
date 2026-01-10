import { Menu, X } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

// ============================================================================
// SIDEBAR TOGGLE BUTTON - Animated Menu/Close Icon
// ============================================================================

export const SidebarToggle = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        'relative w-12 h-12 rounded-xl flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'hover:scale-110 hover:shadow-lg',
        'group overflow-hidden',
        // Dynamic colors based on state
        'bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700',
        'shadow-cyan-500/30 hover:shadow-cyan-500/50',
        'border border-cyan-400/30'
      )}
      aria-label={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
    >
      {/* Menu Icon (visible when collapsed) */}
      <Menu
        className={cn(
          'absolute w-5 h-5 text-white transition-all duration-300',
          isCollapsed
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 rotate-90 scale-0'
        )}
      />

      {/* X Icon (visible when expanded) */}
      <X
        className={cn(
          'absolute w-5 h-5 text-white transition-all duration-300',
          !isCollapsed
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-0'
        )}
      />

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-400/20 to-cyan-500/20" />
    </button>
  );
};
