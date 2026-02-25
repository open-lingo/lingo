import type { ThemeDefinition } from "./types";
import { BUILT_IN_THEMES } from "./presets";

/** Mock community themes for development. Replace with API fetch later. */
export const MOCK_COMMUNITY_THEMES: (ThemeDefinition & { stars?: number; downloads?: number })[] = [
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
        accent: "#22d3ee",
        accentHover: "#06b6d4",
        accentMuted: "#164e63",
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
      ...BUILT_IN_THEMES.sepia.tokens,
      colors: {
        ...BUILT_IN_THEMES.sepia.tokens.colors,
        accent: "#16a34a",
        accentHover: "#15803d",
        accentMuted: "#dcfce7",
      },
    },
    stars: 64,
    downloads: 198,
  },
];
