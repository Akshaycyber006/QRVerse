import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeMode, createTheme } from './index';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Default to dark for premium feel unless user toggles
    if (system === 'light') {
      // keep user choice; do not auto override
    }
  }, [system]);

  const theme = useMemo(() => createTheme(mode), [mode]);

  const value = useMemo(
    () => ({ theme, mode, setMode, toggleMode: () => setMode(m => (m === 'dark' ? 'light' : 'dark')) }),
    [theme, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};