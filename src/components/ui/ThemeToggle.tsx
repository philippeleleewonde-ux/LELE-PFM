import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// ============================================================================
// THEME TOGGLE BUTTON - Animated Sun/Moon Switch
// ============================================================================

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative w-12 h-12 rounded-xl flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'hover:scale-110 hover:shadow-lg',
        'group overflow-hidden',
        // Light mode colors
        theme === 'light' && [
          'bg-gradient-to-br from-amber-400 to-orange-500',
          'shadow-amber-500/30',
          'hover:shadow-amber-500/50',
        ],
        // Dark mode colors
        theme === 'dark' && [
          'bg-gradient-to-br from-indigo-600 to-purple-700',
          'shadow-purple-500/30',
          'hover:shadow-purple-500/50',
        ]
      )}
      aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      {/* Sun Icon (visible in light mode) */}
      <Sun
        className={cn(
          'absolute w-5 h-5 text-white transition-all duration-300',
          theme === 'light'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 rotate-90 scale-0'
        )}
      />

      {/* Moon Icon (visible in dark mode) */}
      <Moon
        className={cn(
          'absolute w-5 h-5 text-white transition-all duration-300',
          theme === 'dark'
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-0'
        )}
      />

      {/* Glow effect on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          theme === 'light' && 'bg-gradient-to-br from-amber-300/20 to-orange-400/20',
          theme === 'dark' && 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20'
        )}
      />
    </button>
  );
};
