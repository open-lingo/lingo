import type { ThemeDefinition } from "./types";
import { BUILT_IN_THEMES } from "./presets";
import { getFontFamily } from "./fonts";

/** Mock community themes for development. Replace with API fetch later. */
export const MOCK_COMMUNITY_THEMES: (ThemeDefinition & {
  stars?: number;
  downloads?: number;
})[] = [
  {
    // "Academia" — warm paper palette + Fraunces serif. Reads as a marked-up
    // edition / old library catalog. The font auto-loads via fontLoader
    // because tokens.font.family resolves to the "fraunces" preset id.
    // (The retired sepia preset's palette lives on as the default light
    // theme — see presets.ts — so this mock now bases off that.)
    id: "comm-academia",
    name: "Academia",
    author: "open_lingo",
    version: "1.0",
    tokens: {
      ...BUILT_IN_THEMES.light.tokens,
      // Keep the body font as light's default; Academia's character comes
      // from the display-font override picking up Fraunces for headings.
      // `font-display` Tailwind class lights up wherever component code
      // already opted in (Cards, FacetSidebar, PublicProfilePage masthead).
      font: {
        ...BUILT_IN_THEMES.light.tokens.font,
        display: getFontFamily("fraunces"),
      },
      colors: {
        ...BUILT_IN_THEMES.light.tokens.colors,
        // Slightly warmer accent against the paper — leans into a
        // marginalia-pencil red without going garish.
        accent: "#9c2c2c",
        accentHover: "#7a2222",
        accentMuted: "#f0e0d6",
      },
    },
    stars: 0,
    downloads: 0,
  },
  {
    id: "comm-midnight-hangul",
    name: "Midnight Hangul",
    author: "korean_learner",
    version: "1.0",
    tokens: {
      ...BUILT_IN_THEMES.amoled.tokens,
      colors: {
        ...BUILT_IN_THEMES.amoled.tokens.colors,
        accent: "#a78bfa",
        accentHover: "#8b5cf6",
        accentMuted: "#2e1065",
      },
    },
    stars: 128,
    downloads: 452,
  },
  {
    id: "comm-ocean-breeze",
    name: "Ocean Breeze",
    author: "trevor",
    version: "1.0",
    tokens: {
      ...BUILT_IN_THEMES.dark.tokens,
      colors: {
        ...BUILT_IN_THEMES.dark.tokens.colors,
        background: "#0c4a6e",
        surface: "#0e7490",
        surfaceMuted: "#155e75",
        surfaceElevated: "#164e63",
        border: "#0369a1",
        borderMuted: "#075985",
        textPrimary: "#f0f9ff",
        textSecondary: "#bae6fd",
        textMuted: "#7dd3fc",
        accent: "#22d3ee",
        accentHover: "#06b6d4",
        accentMuted: "#164e63",
        onAccent: "#0c4a6e",
      },
    },
    stars: 89,
    downloads: 312,
  },
  {
    id: "comm-forest-study",
    name: "Forest Study",
    author: "nature_learner",
    version: "1.0",
    tokens: {
      ...BUILT_IN_THEMES.dark.tokens,
      colors: {
        ...BUILT_IN_THEMES.dark.tokens.colors,
        background: "#0f1a14",
        surface: "#162820",
        surfaceMuted: "#1c3328",
        surfaceElevated: "#243d32",
        border: "#2d4a3d",
        borderMuted: "#243832",
        textPrimary: "#e8f0eb",
        textSecondary: "#b8cfc0",
        textMuted: "#8faf9a",
        accent: "#22c55e",
        accentHover: "#16a34a",
        accentMuted: "#14532d",
        onAccent: "#f0fdf4",
        success: "#4ade80",
        link: "#86efac",
      },
    },
    stars: 64,
    downloads: 198,
  },
];
