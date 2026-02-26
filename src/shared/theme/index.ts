export type { ThemeTokens, ThemeDefinition, BuiltInThemeId } from "./types";
import type { ThemeTokens } from "./types";
export { BUILT_IN_THEMES } from "./presets";
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
    font: { ...defaults.font, ...(partial.font ?? {}) },
  };
}
export { MOCK_COMMUNITY_THEMES } from "./community-mock";
export { FONT_PRESETS, getFontFamily, getDefaultFontTokens, DEFAULT_FONT_ID } from "./fonts";
