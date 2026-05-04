"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ACCENT_COLORS,
  DEFAULT_ACCENT,
  STORAGE_KEY,
  type AccentId,
} from "@/lib/themes";

type ThemeContextValue = {
  accent: AccentId;
  setAccent: (id: AccentId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyAccent(id: AccentId) {
  const color = ACCENT_COLORS.find((c) => c.id === id);
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty("--accent", color.value);
  root.style.setProperty("--accent-text", color.textOn);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>(DEFAULT_ACCENT);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as AccentId | null;
    if (stored && ACCENT_COLORS.some((c) => c.id === stored)) {
      setAccentState(stored);
      applyAccent(stored);
    } else {
      applyAccent(DEFAULT_ACCENT);
    }
  }, []);

  const setAccent = useCallback((id: AccentId) => {
    setAccentState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
    applyAccent(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
