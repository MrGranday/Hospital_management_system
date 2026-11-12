// ============================================================================
// Theme system: light/dark mode, accent color, persistence.
// ============================================================================
// Uses CSS variables in globals.css. This module reads/writes a single
// `medicore-theme` localStorage key, and applies the active theme to
// <html> via class + inline CSS variable overrides.
// ============================================================================

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

export type AccentKey =
  | "blue"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "cyan"
  | "teal"
  | "indigo";

export interface ThemePrefs {
  mode: ThemeMode;
  accent: AccentKey;
  radius: "none" | "sm" | "md" | "lg";
  density: "compact" | "comfortable" | "spacious";
}

export const DEFAULT_THEME: ThemePrefs = {
  mode: "light",
  accent: "blue",
  radius: "md",
  density: "comfortable",
};

// ============================================================================
// Accent color palette (oklch)
// Hues chosen for hospital/medical context — calm, professional, accessible.
// ============================================================================
export interface AccentPalette {
  key: AccentKey;
  label: string;
  description: string;
  hue: number;
  // 50..950 shades — interpolated at runtime
  swatch: string; // oklch for accent-500 equivalent
}

export const ACCENTS: AccentPalette[] = [
  { key: "blue", label: "Medical Blue", description: "Clean, professional default", hue: 245, swatch: "oklch(0.608 0.180 245)" },
  { key: "emerald", label: "Soft Emerald", description: "Calming green", hue: 155, swatch: "oklch(0.62 0.150 155)" },
  { key: "violet", label: "Royal Violet", description: "Sophisticated", hue: 290, swatch: "oklch(0.58 0.150 290)" },
  { key: "rose", label: "Coral Rose", description: "Warm, friendly", hue: 15, swatch: "oklch(0.65 0.200 15)" },
  { key: "amber", label: "Amber Gold", description: "Energetic", hue: 75, swatch: "oklch(0.72 0.160 75)" },
  { key: "cyan", label: "Ocean Cyan", description: "Modern, fresh", hue: 200, swatch: "oklch(0.62 0.150 200)" },
  { key: "teal", label: "Healing Teal", description: "Calm and reassuring", hue: 180, swatch: "oklch(0.60 0.130 180)" },
  { key: "indigo", label: "Deep Indigo", description: "Premium, authoritative", hue: 265, swatch: "oklch(0.55 0.180 265)" },
];

// Generate CSS variable definitions for an accent (50..950 in oklch)
export function accentVars(accent: AccentKey): Record<string, string> {
  const palette = ACCENTS.find((a) => a.key === accent) ?? ACCENTS[0];
  const h = palette.hue;
  // L, C pairs approximating a perceptual 50..950 ramp
  const shades: Array<[number, number, number]> = [
    [50, 0.978, 0.012],
    [100, 0.953, 0.024],
    [200, 0.910, 0.046],
    [300, 0.855, 0.078],
    [400, 0.780, 0.115],
    [500, 0.690, 0.150],
    [600, 0.608, 0.180],
    [700, 0.535, 0.195],
    [800, 0.445, 0.175],
    [900, 0.385, 0.140],
    [950, 0.305, 0.100],
  ];
  const out: Record<string, string> = {};
  for (const [shade, l, c] of shades) {
    out[`--color-brand-${shade}`] = `oklch(${l} ${c} ${h})`;
  }
  return out;
}

const STORAGE_KEY = "medicore-theme";

// ============================================================================
// Theme application — runs on <html> element
// ============================================================================
export function applyTheme(prefs: ThemePrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Mode
  const resolvedMode =
    prefs.mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : prefs.mode;
  if (resolvedMode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  // Accent — override CSS variables on :root
  const vars = accentVars(prefs.accent);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
  // Also bind primary/ring to brand-600 for shadcn components
  root.style.setProperty("--primary", vars["--color-brand-600"]);
  root.style.setProperty("--ring", vars["--color-brand-600"]);
  root.style.setProperty("--sidebar-primary", vars["--color-brand-600"]);
  root.style.setProperty("--sidebar-ring", vars["--color-brand-600"]);

  // Radius
  const radiusMap = { none: "0px", sm: "0.375rem", md: "0.75rem", lg: "1rem" };
  root.style.setProperty("--radius", radiusMap[prefs.radius]);

  // Density — affects base font scale via a custom prop consumed by AppShell
  const densityScale = { compact: "0.9375rem", comfortable: "1rem", spacious: "1.0625rem" };
  root.style.setProperty("--app-density-base", densityScale[prefs.density]);
}

export function loadTheme(): ThemePrefs {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(prefs: ThemePrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

// ============================================================================
// React hook for theme access + updates
// ============================================================================
export function useTheme() {
  const [prefs, setPrefs] = useState<ThemePrefs>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadTheme();
    setPrefs(loaded);
    applyTheme(loaded);
    setReady(true);
    // Listen for system theme changes if in system mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (prefs.mode === "system") applyTheme(prefs);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((partial: Partial<ThemePrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      applyTheme(next);
      saveTheme(next);
      return next;
    });
  }, []);

  return { prefs, update, ready };
}
