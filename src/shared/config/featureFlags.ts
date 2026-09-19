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
  /** Experimental, off-by-default surfaces — see docs/learning-loop-2026-09-17.md. */
  experimental: {
    /**
     * A8 (2026-09-17): rank review-grid / practice-padding candidate atoms by
     * live FSRS due-ness (most overdue, then lowest stability) instead of the
     * heuristic (recency-window / seeded-shuffle) order, falling back to the
     * heuristic when too few candidates carry FSRS state. OFF by default —
     * this is the instrumentation/experiment flag, not a shipped decision;
     * see docs/learning-loop-2026-09-17.md for the A/B design that would
     * turn it on.
     */
    reviewGridsFromFsrs: boolean;
    /**
     * A8 (2026-09-17): on a learner's first exposure to a grammar atom, hold
     * the first 3 review reps same-type before interleaving resumes (Hwang
     * 2025 floor condition). DESIGN ONLY as of this flag's introduction —
     * see docs/learning-loop-2026-09-17.md §4 for why it isn't wired to a
     * selector yet. OFF by default.
     */
    firstExposureBlockedWarmup: boolean;
  };
  /** Server-bound telemetry, each stream its own switch. */
  telemetry: {
    /**
     * T7 (2026-09-18): per-word difficulty stats — one `atom_outcome` event
     * per graded step, batched to `POST /telemetry/outcomes`. OFF by
     * default for build 32 (Spencer's call) — no client traffic exists
     * until this flips true in `feature-flags.json`. See
     * `docs/atom-outcome-telemetry-2026-09-18.md`.
     */
    atomOutcomes: boolean;
  };
  /**
   * Per-course beta gates (docs/pt-course-design-2026-09-18.md §5) — a
   * course with lesson content but not yet a general release. Each key is a
   * flag name (`ptBeta` today); `enabled: false` means the course is
   * invisible to everyone regardless of `allowlist`. `allowlist` matches a
   * user by email or id, case-insensitively — see
   * `shared/domain/betaAccess.ts`, the only reader of this block.
   */
  courses: {
    ptBeta: {
      enabled: boolean;
      allowlist: string[];
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
  experimental: {
    reviewGridsFromFsrs: false,
    firstExposureBlockedWarmup: false,
  },
  telemetry: {
    atomOutcomes: false,
  },
  // Safe fallback (used before the first fetch resolves, or if it fails):
  // disabled, empty allowlist. The real allowlist lives only in the
  // deployed `feature-flags.json` (docs/pt-course-design-2026-09-18.md §5)
  // — never baked into this code default, so a stale bundle never grants
  // access it wasn't redeployed to grant.
  courses: {
    ptBeta: {
      enabled: false,
      allowlist: [],
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
  if (isPlainObject(override.experimental)) {
    const x = override.experimental;
    if (typeof x.reviewGridsFromFsrs === "boolean")
      out.experimental.reviewGridsFromFsrs = x.reviewGridsFromFsrs;
    if (typeof x.firstExposureBlockedWarmup === "boolean")
      out.experimental.firstExposureBlockedWarmup = x.firstExposureBlockedWarmup;
  }
  if (isPlainObject(override.telemetry)) {
    const t = override.telemetry;
    if (typeof t.atomOutcomes === "boolean") out.telemetry.atomOutcomes = t.atomOutcomes;
  }
  if (isPlainObject(override.courses)) {
    const c = override.courses;
    if (isPlainObject(c.ptBeta)) {
      const pb = c.ptBeta;
      if (typeof pb.enabled === "boolean") out.courses.ptBeta.enabled = pb.enabled;
      if (Array.isArray(pb.allowlist) && pb.allowlist.every((x) => typeof x === "string")) {
        out.courses.ptBeta.allowlist = pb.allowlist;
      }
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
 * Whether the learn homepage for `lang` is the transit map (map + new list
 * view). The map derives from the real course; ja/ko/es designs are signed
 * off. The classic pathway page stays mounted at learn/classic either way.
 */
const TRANSIT_LANGS = new Set(["ja", "ko", "es"]);

export function isTransitLearnHome(
  flags: FeatureFlags,
  lang: string | undefined,
): boolean {
  return !!lang && TRANSIT_LANGS.has(lang) && flags.learn.transitMapHome;
}

/**
 * Last flags this tab resolved, for synchronous non-React readers (e.g.
 * `getMockLessonContent`'s pad pass, which runs outside React and can't
 * `await` a fetch). Starts at the code defaults; `fetchFeatureFlags()`
 * updates it as a side effect every time it resolves (success or failure —
 * a failed fetch still resolves to the defaults, which is what this should
 * read back). A caller that runs BEFORE the first `FeatureFlagsProvider`
 * fetch resolves (e.g. compiling the first lesson on cold boot) sees the
 * defaults — false for every experimental flag — which is the same
 * fail-safe direction as the flag file itself.
 */
let _lastResolvedFlags: FeatureFlags = DEFAULT_FEATURE_FLAGS;

/** Synchronous read of the last-resolved flags. See `_lastResolvedFlags`. */
export function getCachedFeatureFlags(): FeatureFlags {
  return _lastResolvedFlags;
}

/** Test-only: reset the synchronous cache between tests. */
export function __resetCachedFeatureFlagsForTest(): void {
  _lastResolvedFlags = DEFAULT_FEATURE_FLAGS;
}

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  try {
    const res = await fetch("/feature-flags.json", { cache: "no-store" });
    if (!res.ok) {
      _lastResolvedFlags = DEFAULT_FEATURE_FLAGS;
      return _lastResolvedFlags;
    }
    const json: unknown = await res.json();
    _lastResolvedFlags = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, json);
    return _lastResolvedFlags;
  } catch {
    _lastResolvedFlags = DEFAULT_FEATURE_FLAGS;
    return _lastResolvedFlags;
  }
}
