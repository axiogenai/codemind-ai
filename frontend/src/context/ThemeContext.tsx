import React, { createContext, useContext, useState, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'dark' | 'light';

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    skipTransition: () => void;
  };
};

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

  const locked = useRef(false);

  useLayoutEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleTheme = () => {
    if (locked.current) return;
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    const commit = () => {
      flushSync(() => {
        setTheme(nextTheme);
        applyThemeToDOM(nextTheme);
      });
    };

    const doc = document as TransitionDocument;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!doc.startViewTransition || reduced) {
      commit();
      return;
    }

    locked.current = true;
    document.documentElement.setAttribute('data-theme-transition', nextTheme);

    const animationDuration = 780;
    const radius = Math.hypot(window.innerWidth / 2, window.innerHeight / 2);
    const zero = 'circle(0px at 50% 50%)';
    const full = `circle(${radius}px at 50% 50%)`;

    const transition = doc.startViewTransition(commit);
    const watchdog = window.setTimeout(
      () => transition.skipTransition(),
      animationDuration + 1500
    );

    transition.ready
      .then(async () => {
        const wave = document.documentElement.animate(
          { clipPath: nextTheme === 'light' ? [zero, full] : [full, zero] },
          {
            duration: animationDuration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'none',
            pseudoElement: `::view-transition-${
              nextTheme === 'light' ? 'new' : 'old'
            }(root)`,
          }
        );
        try {
          await wave.finished;
        } catch {
          // Handled if aborted or snapshot skipped
        } finally {
          wave.cancel();
        }
      })
      .catch(() => {
        // Fallback for failed snapshots
      })
      .finally(() => {
        transition.skipTransition();
        window.clearTimeout(watchdog);
        document.documentElement.removeAttribute('data-theme-transition');
        locked.current = false;
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
