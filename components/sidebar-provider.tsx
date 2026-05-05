"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "codex-sidebar-open";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function applyDataAttr(open: boolean) {
  document.documentElement.setAttribute(
    "data-sidebar",
    open ? "open" : "closed",
  );
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default closed during SSR. The pre-paint script in <head> sets the
  // <html data-sidebar> attribute synchronously so the layout doesn't
  // jump; we mirror that decision in React state on hydration.
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let initial: boolean;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") initial = true;
      else if (stored === "0") initial = false;
      else initial = window.matchMedia("(min-width: 640px)").matches;
    } catch {
      initial = window.matchMedia("(min-width: 640px)").matches;
    }
    setIsOpen(initial);
    applyDataAttr(initial);
  }, []);

  useEffect(() => {
    applyDataAttr(isOpen);
    try {
      window.localStorage.setItem(STORAGE_KEY, isOpen ? "1" : "0");
    } catch {
      // ignore quota / disabled storage
    }
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<SidebarContextValue>(
    () => ({ isOpen, toggle, open, close }),
    [isOpen, toggle, open, close],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used inside a SidebarProvider");
  }
  return ctx;
}
