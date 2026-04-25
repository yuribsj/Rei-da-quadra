import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../constants/theme';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = '@rei_da_quadra_theme_';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!storageKey) { setIsDark(true); return; }
    AsyncStorage.getItem(storageKey).then(val => {
      if (val === 'light') setIsDark(false);
      else setIsDark(true);
    });
  }, [storageKey]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (storageKey) AsyncStorage.setItem(storageKey, next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
