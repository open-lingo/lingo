import type { ThemeDefinition, ThemeTokens } from "./types";
import { getFontFamily, DEFAULT_FONT_ID } from "./fonts";

const font = { family: getFontFamily(DEFAULT_FONT_ID) };

const lightTokens: ThemeTokens = {
  colors: {
    background: "#f3f4f6",
    surface: "#ffffff",
    surfaceMuted: "#f9fafb",
    surfaceElevated: "#ffffff",
    border: "#e5e7eb",
    borderMuted: "#f3f4f6",
    textPrimary: "#111827",
    textSecondary: "#4b5563",
    textMuted: "#6b7280",
    accent: "#047857",
    accentHover: "#065f46",
    accentMuted: "#d1fae5",
    onAccent: "#ffffff",
    error: "#dc2626",
    success: "#16a34a",
    warning: "#d97706",
    overlay: "rgba(0,0,0,0.4)",
    info: "#2563eb",
    destructive: "#dc2626",
    link: "#2563eb",
  },
  radius: { sm: 6, md: 12, lg: 20 },
  shadow: {
    card: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    popover: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  },
  font,
};

const darkTokens: ThemeTokens = {
  colors: {
    background: "#111827",
    surface: "#1f2937",
    surfaceMuted: "#1f2937",
    surfaceElevated: "#374151",
    border: "#374151",
    borderMuted: "#4b5563",
    textPrimary: "#f9fafb",
    textSecondary: "#d1d5db",
    // Bumped from #9ca3af to clear WCAG AA 4.5:1 against surface (#1f2937).
    // Surfaces affected: module-pill %, profile stat labels (10px uppercase),
    // side-quest meta line, lesson-exit X icon. Retiree audit P0.
    textMuted: "#b0b8c4",
    accent: "#047857",
    accentHover: "#059669",
    accentMuted: "#064e3b",
    onAccent: "#ffffff",
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",
    overlay: "rgba(0,0,0,0.5)",
    info: "#60a5fa",
    destructive: "#f87171",
    link: "#60a5fa",
  },
  radius: { sm: 6, md: 12, lg: 20 },
  shadow: {
    card: "0 1px 3px 0 rgb(0 0 0 / 0.3)",
    popover: "0 10px 15px -3px rgb(0 0 0 / 0.4)",
  },
  font,
};

const sepiaTokens: ThemeTokens = {
  colors: {
    background: "#f5f0e6",
    surface: "#faf8f5",
    surfaceMuted: "#f0ebe3",
    surfaceElevated: "#ffffff",
    border: "#e6dfd4",
    borderMuted: "#ebe6dd",
    textPrimary: "#3d3a35",
    textSecondary: "#5c5750",
    textMuted: "#7a756d",
    accent: "#b45309",
    accentHover: "#92400e",
    accentMuted: "#fef3c7",
    onAccent: "#ffffff",
    error: "#b91c1c",
    success: "#15803d",
    warning: "#a16207",
    overlay: "rgba(0,0,0,0.4)",
    info: "#1d4ed8",
    destructive: "#b91c1c",
    link: "#1d4ed8",
  },
  radius: { sm: 6, md: 12, lg: 20 },
  shadow: {
    card: "0 1px 3px 0 rgb(0 0 0 / 0.08)",
    popover: "0 10px 15px -3px rgb(0 0 0 / 0.12)",
  },
  font,
};

const amoledTokens: ThemeTokens = {
  colors: {
    background: "#000000",
    surface: "#0a0a0a",
    surfaceMuted: "#141414",
    surfaceElevated: "#1a1a1a",
    border: "#262626",
    borderMuted: "#1f1f1f",
    textPrimary: "#fafafa",
    textSecondary: "#d4d4d4",
    textMuted: "#a3a3a3",
    accent: "#22d3ee",
    accentHover: "#06b6d4",
    accentMuted: "#083344",
    onAccent: "#0a0a0a",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
    overlay: "rgba(0,0,0,0.6)",
    info: "#38bdf8",
    destructive: "#f87171",
    link: "#38bdf8",
  },
  radius: { sm: 6, md: 12, lg: 20 },
  shadow: {
    card: "0 1px 2px 0 rgb(0 0 0 / 0.5)",
    popover: "0 4px 6px -1px rgb(0 0 0 / 0.5)",
  },
  font,
};

export type ThemeMode = "light" | "dark";

export const BUILT_IN_THEMES: Record<string, ThemeDefinition & { mode?: ThemeMode }> = {
  light: { id: "light", name: "Light", tokens: lightTokens, mode: "light" },
  dark: { id: "dark", name: "Dark", tokens: darkTokens, mode: "dark" },
  sepia: { id: "sepia", name: "Sepia", tokens: sepiaTokens, mode: "light" },
  amoled: { id: "amoled", name: "AMOLED", tokens: amoledTokens, mode: "dark" },
};
