import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeCtx {
  mode: ThemeMode;
  resolved: Resolved;
  setMode: (m: ThemeMode) => void;
}

const STORAGE_KEY = "cpcoach.theme";
const Ctx = createContext<ThemeCtx | null>(null);

function systemPref(): Resolved {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(resolved: Resolved) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("light", resolved === "light");
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<Resolved>("dark");

  // initial
  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" &&
      localStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
    const initial: ThemeMode =
      saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setModeState(initial);
    const r = initial === "system" ? systemPref() : initial;
    setResolved(r);
    applyTheme(r);
  }, []);

  // listen to system if mode === system
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      const r: Resolved = mq.matches ? "light" : "dark";
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
    const r = m === "system" ? systemPref() : m;
    setResolved(r);
    applyTheme(r);
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used inside ThemeProvider");
  return v;
}
