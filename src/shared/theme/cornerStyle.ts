/**
 * Card/modal corner radius is theme-scoped: a theme ships its `radius.card`
 * (a CSS length) and that drives the `--radius-card` variable app-wide (see
 * ThemeContext). These named presets back the Theme Editor's "Corners"
 * control — pick one and it writes the matching length into the (custom)
 * theme. There is no per-user corner override; to change corners you dupe a
 * theme and edit it.
 */

/** Named corner presets surfaced in the Theme Editor's corner picker. */
export type CornerStyle = "sharp" | "default" | "rounded" | "pill";

/** Maps each corner preset to its `radius.card` CSS length. */
export const CORNER_STYLE_RADIUS: Record<CornerStyle, string> = {
  sharp: "0.25rem",
  default: "0.625rem",
  rounded: "1.5rem",
  pill: "2rem",
};

/** Ordered presets for the editor's corner picker. */
export const CORNER_STYLES: CornerStyle[] = [
  "sharp",
  "default",
  "rounded",
  "pill",
];

/**
 * Resolve the `--radius-card` value for the active theme. A theme that ships a
 * `radius.card` wins; everything else gets the shared "default" length.
 */
export function resolveCardRadius(themeCard?: string): string {
  return themeCard ?? CORNER_STYLE_RADIUS.default;
}

/**
 * Reverse-map a theme's `radius.card` length back to a named preset so the
 * editor's select can show the current choice. Unset / unknown lengths read as
 * "default".
 */
export function cornerStyleFromRadius(themeCard?: string): CornerStyle {
  const match = (
    Object.entries(CORNER_STYLE_RADIUS) as [CornerStyle, string][]
  ).find(([, len]) => len === themeCard);
  return match ? match[0] : "default";
}
