import type { ThemeTokens } from "./types";

/** Apply theme tokens to document root as CSS variables. */
export function applyThemeToDOM(tokens: ThemeTokens): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  Object.entries(tokens.colors).forEach(([key, value]) => {
    const varName = `--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "")}`;
    root.style.setProperty(varName, value);
  });

  Object.entries(tokens.radius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, `${value}px`);
  });

  root.style.setProperty("--shadow-card", tokens.shadow.card);
  root.style.setProperty("--shadow-popover", tokens.shadow.popover);
  root.style.setProperty("--font-family", tokens.font.family);
}
