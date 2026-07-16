/**
 * Client feature flags. Defaults ship in code; `/feature-flags.json` overrides at runtime
 * (swap the file per deploy without rebuilding). Replace with an API later if needed.
 */

export type FeatureFlags = {
  version: number;
  practice: {
    /** /practice/stories and story reader under practice */
    stories: boolean;
    /** /practice/external-content */
    externalContent: boolean;
  };
  community: {
    /** Whole community surface: explore, browse, library, decks, discuss, contribute. */
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
  social: {
    /** Whole social surface: friends, activity feed, leagues/leaderboards, invites, spotlight. */
    enabled: boolean;
  };
};

/** MVP defaults when fetch fails or before merge. Keep in sync with `public/feature-flags.json`. */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  version: 1,
  practice: {
    stories: false,
    externalContent: false,
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
  social: {
    enabled: false,
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
  if (isPlainObject(override.social)) {
    const s = override.social;
    if (typeof s.enabled === "boolean") out.social.enabled = s.enabled;
  }
  return out;
}

/** Leaderboard in main nav, community tab, and /:lang/leaderboard routes. */
export function isLeaderboardEnabled(flags: FeatureFlags): boolean {
  return flags.community.tabs.leaderboard;
}

/** Whole social surface (friends, activity, leaderboards, invites). Default off. */
export function isSocialEnabled(flags: FeatureFlags): boolean {
  return flags.social.enabled;
}

/** Whole community surface (explore, browse, decks, discuss, contribute). Default off. */
export function isCommunityEnabled(flags: FeatureFlags): boolean {
  return flags.community.enabled;
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
