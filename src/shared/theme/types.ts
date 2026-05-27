/**
 * Platform-agnostic theme tokens.
 * Same shape works for web (CSS vars) and React Native (useTheme()).
 */
export type ThemeTokens = {
  colors: {
    background: string;
    surface: string;
    surfaceMuted: string;
    surfaceElevated: string;
    border: string;
    borderMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    /** Text/icons on solid accent (primary buttons, etc.). */
    onAccent: string;
    error: string;
    success: string;
    warning: string;
    overlay: string;
    info: string;
    destructive: string;
    link: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadow: {
    card: string;
    popover: string;
  };
  font: {
    /** Primary body font. Applied as `--font-family`. */
    family: string;
    /** Optional display font for headings — applied as `--font-display`.
     *  When unset the `font-display` Tailwind class inherits the body font,
     *  so default themes don't surprise users with a different serif voice. */
    display?: string;
    /** Optional monospace font — applied as `--font-family-mono`. */
    mono?: string;
  };
};

/** Minimal theme definition (for community themes, storage). */
export type ThemeDefinition = {
  id: string;
  name: string;
  author?: string;
  version?: string;
  tokens: ThemeTokens;
};

/** Built-in preset IDs. */
export type BuiltInThemeId = "light" | "dark" | "sepia" | "amoled";
