import type { ThemeTokens } from "./types";
import { BUILT_IN_THEMES } from "./presets";
export type { ThemeTokens, ThemeDefinition, BuiltInThemeId } from "./types";
export { BUILT_IN_THEMES };
export { applyThemeToDOM } from "./web-adapter";

/** Merge partial tokens with defaults; fills in any missing color keys. */
export function mergeTokensWithDefaults(
  partial: Partial<ThemeTokens> & { colors: Partial<ThemeTokens["colors"]> },
  defaults: ThemeTokens
): ThemeTokens {
  const colors = { ...defaults.colors, ...partial.colors };
  return {
    colors,
    radius: { ...defaults.radius, ...partial.radius },
    shadow: { ...defaults.shadow, ...partial.shadow },
    // Only `family` inherits from defaults — every theme needs a body font.
    // `display` / `mono` must NOT be backfilled: BUILT_IN_THEMES.dark carries
    // Fraunces as its display font, and inheriting it here would silently
    // flip every custom/community theme's `font-display` surfaces to serif.
    font: {
      family: partial.font?.family ?? defaults.font.family,
      display: partial.font?.display,
      mono: partial.font?.mono,
    },
  };
}

/** Ensures new palette keys (e.g. `onAccent`) exist for stored or partial themes. */
export function ensureThemeTokens(tokens: Partial<ThemeTokens>): ThemeTokens {
  return mergeTokensWithDefaults(
    {
      colors: { ...(tokens.colors ?? {}) },
      radius: tokens.radius,
      shadow: tokens.shadow,
      font: tokens.font,
    } as Partial<ThemeTokens> & {
      colors: Partial<ThemeTokens["colors"]>;
    },
    BUILT_IN_THEMES.dark.tokens
  );
}
export { MOCK_COMMUNITY_THEMES } from "./community-mock";
export { FONT_PRESETS, getFontFamily, getFontIdFromFamily, getDefaultFontTokens, DEFAULT_FONT_ID } from "./fonts";
export { loadFontFamily } from "./fontLoader";
