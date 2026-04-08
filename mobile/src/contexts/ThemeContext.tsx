import React, { createContext, useContext, useMemo } from 'react';
import { colors } from '../theme/tokens';

type Theme = {
  colors: typeof colors;
  isDark: boolean;
};

const defaultTheme: Theme = {
  colors,
  isDark: false,
};

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => defaultTheme, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context ?? defaultTheme;
}
