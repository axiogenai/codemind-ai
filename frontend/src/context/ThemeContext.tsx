import React, { createContext, useContext, useState, useLayoutEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
  isDarkMode: true,
});

const applyThemeToDOM = (t: Theme) => {
  const root = document.documentElement;
  if (t === 'dark') {
    root.classList.add('dark');
    root.style.backgroundColor = '#0A0A0A';
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.backgroundColor = '#FAFAFA';
    root.style.colorScheme = 'light';
  }
  try {
    localStorage.setItem('codemind_theme', t);
  } catch {
    // Ignore localStorage quota errors
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('codemind_theme') as Theme | null;
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore storage read errors
    }
    return 'dark';
  });

  useLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDOM(nextTheme);
      return nextTheme;
    });
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, isDarkMode: isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
