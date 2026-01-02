'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

const isResolvedTheme = (value: Theme): value is 'light' | 'dark' =>
  value === 'light' || value === 'dark';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const subscribeToSystemTheme = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'doveapp-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    const storedTheme = localStorage.getItem(storageKey);
    return isTheme(storedTheme) ? storedTheme : defaultTheme;
  });

  const systemTheme = useSyncExternalStore(
    (callback) =>
      theme === 'system' ? subscribeToSystemTheme(callback) : () => {},
    getSystemTheme,
    () => 'light' as const
  );

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (isResolvedTheme(theme)) {
      return theme;
    }
    return systemTheme;
  }, [systemTheme, theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
