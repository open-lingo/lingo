/**
 * Client feature flags. Defaults ship in code; `/feature-flags.json` overrides at runtime
 * (swap the file per deploy without rebuilding). Replace with an API later if needed.
 */

export type FeatureFlags = {
  version: number;
  learn: {
    /** Transit-map network as the ja learn homepage; classic page stays at learn/classic */
    transitMapHome: boolean;
  };
  practice: {
    /** /practice/stories and story reader under practice */
    stories: boolean;
    /** /practice/external-content */
    externalContent: boolean;
  };
  social: {
    /** Social hub + friends + messenger surfaces and every nav entry into them */
    enabled: boolean;
  };
  community: {
    /** Master switch for the whole community surface (nav, routes, cross-page links) */
    enabled: boolean;
    tabs: {
      explore: boolean;
      externalContent: boolean;
      discuss: boolean;
      contribute: boolean;
      leaderboard: boolean;
    };
    explore: {
      flashcardDecks: boolean;
      courses: boolean;
      stories: boolean;
      /** Hot threads block on explore */
      activeDiscussions: boolean;
    };
  };
};

/** MVP defaults when fetch fails or before merge. Keep in sync with `public/feature-flags.json`. */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  version: 1,
  learn: {
    transitMapHome: true,
  },
  practice: {
    stories: false,
    externalContent: false,
  },
  // MVP (Spencer + Trevor, 2026-07-16): social + community ship dark. Code
  // stays; flip these in feature-flags.json to bring them back post-MVP.
  social: {
    enabled: false,
  },
  community: {
    enabled: false,
    tabs: {
      explore: true,
      externalContent: false,
      discuss: false,
      contribute: false,
      leaderboard: false,
    },
    explore: {
      flashcardDecks: true,
      courses: false,
      stories: false,
      activeDiscussions: false,
    },
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Deep-merge partial overrides into base (objects only; replaces scalars). */
export function mergeFeatureFlags(
  base: FeatureFlags,
  override: unknown
): FeatureFlags {
  if (!isPlainObject(override)) return base;
  const out = structuredClone(base) as FeatureFlags;
  if (typeof override.version === "number") out.version = override.version;
  if (isPlainObject(override.learn)) {
    const l = override.learn;
    if (typeof l.transitMapHome === "boolean")
      out.learn.transitMapHome = l.transitMapHome;
  }
  if (isPlainObject(override.social)) {
    const s = override.social;
    if (typeof s.enabled === "boolean") out.social.enabled = s.enabled;
  }
  if (isPlainObject(override.practice)) {
    const p = override.practice;
    if (typeof p.stories === "boolean") out.practice.stories = p.stories;
    if (typeof p.externalContent === "boolean")
      out.practice.externalContent = p.externalContent;
  }
  if (isPlainObject(override.community)) {
    const c = override.community;
    if (typeof c.enabled === "boolean") out.community.enabled = c.enabled;
    if (isPlainObject(c.tabs)) {
      const t = c.tabs;
      if (typeof t.explore === "boolean") out.community.tabs.explore = t.explore;
      if (typeof t.externalContent === "boolean")
        out.community.tabs.externalContent = t.externalContent;
      if (typeof t.discuss === "boolean") out.community.tabs.discuss = t.discuss;
      if (typeof t.contribute === "boolean")
        out.community.tabs.contribute = t.contribute;
      if (typeof t.leaderboard === "boolean")
        out.community.tabs.leaderboard = t.leaderboard;
    }
    if (isPlainObject(c.explore)) {
      const e = c.explore;
      if (typeof e.flashcardDecks === "boolean")
        out.community.explore.flashcardDecks = e.flashcardDecks;
      if (typeof e.courses === "boolean")
        out.community.explore.courses = e.courses;
      if (typeof e.stories === "boolean")
        out.community.explore.stories = e.stories;
      if (typeof e.activeDiscussions === "boolean")
        out.community.explore.activeDiscussions = e.activeDiscussions;
    }
  }
  return out;
}

/** Leaderboard in main nav, community tab, and /:lang/leaderboard routes. */
export function isLeaderboardEnabled(flags: FeatureFlags): boolean {
  return flags.community.enabled && flags.community.tabs.leaderboard;
}

/** Social hub, friends list, messenger, public profiles + their entry points. */
export function isSocialEnabled(flags: FeatureFlags): boolean {
  return flags.social.enabled;
}

/** The whole community surface: nav entry, routes, cross-page deck/discuss links. */
export function isCommunityEnabled(flags: FeatureFlags): boolean {
  return flags.community.enabled;
}

/**
 * Whether the learn homepage for `lang` is the transit map. ja-only for now
 * (the map derives from the real course, but only ja's design is signed off).
 * The classic pathway page stays mounted at learn/classic either way.
 */
export function isTransitLearnHome(
  flags: FeatureFlags,
  lang: string | undefined,
): boolean {
  return lang === "ja" && flags.learn.transitMapHome;
}

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  try {
    const res = await fetch("/feature-flags.json", { cache: "no-store" });
    if (!res.ok) return DEFAULT_FEATURE_FLAGS;
    const json: unknown = await res.json();
    return mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, json);
  } catch {
    return DEFAULT_FEATURE_FLAGS;
  }
}
