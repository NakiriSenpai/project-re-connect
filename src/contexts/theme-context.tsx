import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { Theme } from "@/types/common";

const STORAGE_KEY = "lms-theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Sprint 11 FINAL: aplikasi memakai satu Global Dark Design System.
 * Tema selalu dark agar seluruh halaman terlihat sebagai satu produk.
 */
function applyTheme(_theme: Theme) {
  const root = document.documentElement;
  root.classList.add("dark");
  root.style.colorScheme = "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    applyTheme("dark");
  }, []);

  const setTheme = useCallback((_next: Theme) => {
    setThemeState("dark");
    window.localStorage.setItem(STORAGE_KEY, "dark");
    applyTheme("dark");
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme("dark"),
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme harus dipakai di dalam ThemeProvider");
  return context;
}

/** Script inline untuk mencegah kedipan tema saat halaman dimuat. */
export const themeInitScript = `(function(){try{document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';localStorage.setItem('lms-theme','dark');}catch(e){}})();`;
