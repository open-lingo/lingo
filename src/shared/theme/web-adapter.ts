import type { ThemeTokens } from "./types";

/**
 * Convert a hex color (`#rgb` or `#rrggbb`) into a space-separated RGB channel
 * triple (e.g. `#9c2c2c` → `"156 44 44"`) so Tailwind's `<alpha-value>` slot
 * can apply alpha to token colors (`bg-accent/10`). Non-hex values
 * (`rgba(...)`, `transparent`, `currentColor`, an already-converted triple)
 * are returned untouched — only literal hex is converted.
 */
export function hexToRgbChannels(value: string): string {
  const hex = value.trim();
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return value;
  let h = m[1];
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Apply theme tokens to document root as CSS variables. */
export function applyThemeToDOM(tokens: ThemeTokens): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  Object.entries(tokens.colors).forEach(([key, value]) => {
    const varName = `--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "")}`;
    // Store colors as RGB channel triples so Tailwind aliases
    // (`rgb(var(--color-x) / <alpha-value>)`) can apply alpha modifiers.
    // Non-hex tokens (e.g. `overlay: rgba(...)`) pass through unchanged.
    root.style.setProperty(varName, hexToRgbChannels(value));
  });

  Object.entries(tokens.radius).forEach(([key, value]) => {
    // `--radius-card` is driven by the user's corner-style preset (with the
    // theme's `radius.card` as the "default"-preset baseline) and is applied
    // separately in ThemeContext — skip it here so the two don't fight, and
    // skip any non-numeric entry which isn't a px-suffixed scalar.
    if (key === "card" || typeof value !== "number") return;
    root.style.setProperty(`--radius-${key}`, `${value}px`);
  });

  root.style.setProperty("--shadow-card", tokens.shadow.card);
  root.style.setProperty("--shadow-popover", tokens.shadow.popover);
  root.style.setProperty("--font-family", tokens.font.family);
  // Display + mono are optional — only set the CSS var when the theme
  // provides one. Default Tailwind fallbacks in tailwind.config.js handle
  // the unset case (display inherits body; mono falls back to ui-monospace).
  if (tokens.font.display) {
    root.style.setProperty("--font-display", tokens.font.display);
  } else {
    root.style.removeProperty("--font-display");
  }
  if (tokens.font.mono) {
    root.style.setProperty("--font-family-mono", tokens.font.mono);
  } else {
    root.style.removeProperty("--font-family-mono");
  }
}
