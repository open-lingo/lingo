import type { CornerStyle } from "@/shared/settings/types";

/**
 * Maps each corner-style preset to its `--radius-card` value.
 *
 * "default" is the current card feel (0.75rem ≈ Tailwind `rounded-xl`); the
 * other presets dial corners sharper or rounder. Themes may ship their own
 * default via `ThemeTokens.radiusCard`, which is used when the user keeps the
 * "default" preset (see `cardRadius`).
 */
export const CORNER_STYLE_RADIUS: Record<CornerStyle, string> = {
  sharp: "0.25rem",
  default: "0.75rem",
  rounded: "1.5rem",
  pill: "2rem",
};

/** Ordered presets for the settings picker. */
export const CORNER_STYLES: CornerStyle[] = [
  "sharp",
  "default",
  "rounded",
  "pill",
];

/**
 * Resolve the `--radius-card` value for the active corner style. When the user
 * keeps "default", the theme's own default (if any) wins so a theme can ship a
 * distinct baseline; every other preset is an explicit user override.
 */
export function cardRadius(
  cornerStyle: CornerStyle | undefined,
  themeDefault?: string,
): string {
  const style = cornerStyle ?? "default";
  if (style === "default" && themeDefault) return themeDefault;
  return CORNER_STYLE_RADIUS[style];
}
