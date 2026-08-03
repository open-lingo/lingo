import type { ThemeDefinition, ThemeTokens } from "./types";
import { getFontFamily, DEFAULT_FONT_ID } from "./fonts";

const baseFont = { family: getFontFamily(DEFAULT_FONT_ID) };
// No display slot: `font-display` is referenced only by theme plumbing and the
// theme editor — no component ever applies the class, so Fraunces was being
// fetched on every load and rendered nowhere. Themes can still set one.
const defaultFont = { ...baseFont };

// Default light — the Academia look: sepia paper, marginalia-red accent.
// (Adopted verbatim from the retired "Academia" community theme, which was
// itself the retired Sepia preset + red accent + Fraunces display.)
const lightTokens: ThemeTokens = {
  colors: {
    background: "#f5f0e6",
    surface: "#faf8f5",
    surfaceMuted: "#f0ebe3",
    surfaceElevated: "#ffffff",
    border: "#e6dfd4",
    borderMuted: "#ebe6dd",
    textPrimary: "#3d3a35",
    textSecondary: "#5c5750",
    textMuted: "#6d6860",
    // Marginalia-pencil red — muted brick, distinct from the brighter
    // scarlet error/destructive below.
    accent: "#9c2c2c",
    accentHover: "#7a2222",
    accentMuted: "#f0e0d6",
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
  font: defaultFont,
};

// Default dark — warm charcoal "dark academia" companion. Deliberately off
// the blue-grey Tailwind gray ramp; every neutral carries a brown undertone.
const darkTokens: ThemeTokens = {
  colors: {
    background: "#171310",
    surface: "#211c17",
    surfaceMuted: "#211c17",
    surfaceElevated: "#2b251f",
    border: "#352e26",
    borderMuted: "#3f372e",
    textPrimary: "#f5f1ea",
    textSecondary: "#d6cec2",
    // Must clear WCAG AA 4.5:1 against surface (#211c17) — same floor the
    // old #b0b8c4 held against #1f2937 (retiree audit P0). ~7.3:1 here.
    textMuted: "#b3a99a",
    // Brick red lifted vs light's #9c2c2c so it carries on dark surfaces;
    // hover is lighter, per dark-theme convention.
    accent: "#c14b3f",
    accentHover: "#d5675a",
    accentMuted: "#4a221d",
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
  font: defaultFont,
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
  font: baseFont,
};

export type ThemeMode = "light" | "dark";

export const BUILT_IN_THEMES: Record<string, ThemeDefinition & { mode?: ThemeMode }> = {
  light: { id: "light", name: "Light", tokens: lightTokens, mode: "light" },
  dark: { id: "dark", name: "Dark", tokens: darkTokens, mode: "dark" },
  amoled: { id: "amoled", name: "AMOLED", tokens: amoledTokens, mode: "dark" },
};
