import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

export type ThemePrefs = {
  mode: ThemeMode;
};

export const DEFAULT_THEME: ThemePrefs = { mode: "light" };

const STORAGE_KEY = "medicore-theme";

export function applyTheme(prefs: ThemePrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (prefs.mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function loadTheme(): ThemePrefs {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "mode" in parsed &&
      (parsed.mode === "light" || parsed.mode === "dark")
    ) {
      return { mode: parsed.mode };
    }
    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(prefs: ThemePrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage can be unavailable in private browsing; theme still applies.
  }
}

export function useTheme() {
  const [prefs, setPrefs] = useState<ThemePrefs>(() =>
    typeof window === "undefined" ? DEFAULT_THEME : loadTheme(),
  );

  useEffect(() => {
    applyTheme(prefs);
  }, [prefs]);

  const update = useCallback((partial: Partial<ThemePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      applyTheme(next);
      saveTheme(next);
      return next;
    });
  }, []);

  return { prefs, update };
}
