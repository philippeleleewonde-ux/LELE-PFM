import React, { createContext, useContext, useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type Theme = 'light' | 'dark' | 'bw-light' | 'bw-dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// HELPERS
// ============================================================================

const VALID_THEMES: Theme[] = ['light', 'dark', 'bw-light', 'bw-dark'];

function isValidTheme(value: string | null): value is Theme {
  return VALID_THEMES.includes(value as Theme);
}

function getIsDark(theme: Theme): boolean {
  return theme === 'dark' || theme === 'bw-dark';
}

// ============================================================================
// PROVIDER
// ============================================================================

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or default to dark mode
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('lele-hcm-theme');
    if (isValidTheme(savedTheme)) {
      return savedTheme;
    }
    // Default to dark mode for LELE HCM platform
    return 'dark';
  });

  const isDark = getIsDark(theme);

  // Apply theme classes to document and persist to localStorage
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove('light', 'dark', 'bw-light', 'bw-dark');

    // Add appropriate classes
    // 'light' or 'dark' controls Tailwind dark: prefix
    // 'bw-light' or 'bw-dark' activates B&W CSS variable overrides
    switch (theme) {
      case 'light':
        root.classList.add('light');
        break;
      case 'dark':
        root.classList.add('dark');
        break;
      case 'bw-light':
        root.classList.add('light', 'bw-light');
        break;
      case 'bw-dark':
        root.classList.add('dark', 'bw-dark');
        break;
    }

    // Persist to localStorage
    localStorage.setItem('lele-hcm-theme', theme);
  }, [theme]);

  // Toggle: preserves B&W variant when toggling light/dark
  const toggleTheme = () => {
    setThemeState((prev) => {
      switch (prev) {
        case 'light': return 'dark';
        case 'dark': return 'light';
        case 'bw-light': return 'bw-dark';
        case 'bw-dark': return 'bw-light';
      }
    });
  };

  // Set specific theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
