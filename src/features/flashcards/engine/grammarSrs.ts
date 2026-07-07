/**
 * Track B — grammar/production SRS (retention design 2026-06-13, §4 Track B).
 *
 * A SECOND spaced-repetition track, separate from the vocab card store
 * (`open-lingo-srs:v2`). The reviewable unit is a GRAMMAR POINT from the
 * existing `n5-grammar-points.json` registry (te-form, は-topic, ます-form…) —
 * NOT a vocab word. Grammar points NEVER render as flashcards (Spencer
 * 2026-07-02: flip cards are reserved for vocab). They surface as interactive
 * lesson-style review steps (cloze/build/MCQ) in review lessons AND the
 * practice-page grammar session (`GrammarReviewSessionPage`).
 *
 * Reuses the pure FSRS engine (`./srs`) + `SRSCardState` shape; only the
 * store key differs (D6: piggyback the local-first store with a new
 * namespace). v1 activates a point COARSELY when its module is reached
 * (some atom from that module unlocked); per-step `exercisedGrammar` tagging
 * is a later precision pass.
 */
import grammarPointsJson from "@/features/lesson/data/n5-grammar-points.json";
import type { SRSCardState, SRSModality, SRSRating } from "../data/types";
import {
  createInitialState,
  isDue,
  isBuried,
  reviewCard,
  getDueModalities,
  cardEarliestDueDate,
  getToday,
} from "./srs";
import { adaptiveNewCardsPerDay } from "./reviewQueue";
import { JA_COURSE_ATOMS, canonicalAtomId } from "@/features/languages/ja/courseAtoms";
import { getUnlockedAtomIds } from "@/features/lesson/data/unlockLessonAtoms";
import { isModalFsrsState } from "./srsStorage";
import { safeLocalStorageWrite } from "@/shared/utils/storageQuota";

export type GrammarPoint = {
  id: string;
  point: string;
  pointEn: string;
  category: string;
  module: string;
  status: string;
  notes?: string;
  dependsOn?: string[];
};

const GRAMMAR_POINTS = grammarPointsJson as GrammarPoint[];

const STORE_KEY = "open-lingo-srs-grammar:v1";

type GrammarStore = Record<string, SRSCardState>;

/**
 * Read the raw store, validating each entry against the modal FSRS-6 shape
 * (mirrors `srsStorage.getSRSStore`'s `isModalFsrsState` guard). v1 is the
 * only Track B schema version so there's no legacy migration path — entries
 * that don't match are simply dropped rather than upgraded.
 */
function loadStore(): GrammarStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    const valid: GrammarStore = {};
    for (const [id, state] of Object.entries(parsed)) {
      if (isModalFsrsState(state)) valid[id] = state;
    }
    return valid;
  } catch {
    return {};
  }
}

function saveStore(store: GrammarStore): void {
  if (typeof window === "undefined") return;
  // Quota-safe write — mirrors srsStorage.setSRSStore. Surfaces a toast/log
  // warning instead of silently dropping the write near/at the ceiling.
  safeLocalStorageWrite(STORE_KEY, JSON.stringify(store));
}

/** Store-level accessors for the sync layer (`./grammarSync`). */
export function getGrammarStore(): GrammarStore {
  return loadStore();
}

export function setGrammarStore(store: GrammarStore): void {
  saveStore(store);
}

export function getGrammarCardState(pointId: string): SRSCardState | undefined {
  return loadStore()[pointId];
}

export function setGrammarCardState(pointId: string, state: SRSCardState): void {
  // Re-read to avoid clobbering a concurrent tab's write (mirrors srsStorage).
  const store = loadStore();
  store[pointId] = state;
  saveStore(store);
}

/** Grade one modality of a grammar point and persist. Returns the new state. */
export function reviewGrammarPoint(
  pointId: string,
  modality: SRSModality,
  rating: SRSRating,
  at: Date = new Date(),
): SRSCardState {
  const state = getGrammarCardState(pointId) ?? createInitialState();
  const next = reviewCard(state, modality, rating, at);
  setGrammarCardState(pointId, next);
  return next;
}

/** Modules the learner has reached = any module with ≥1 unlocked atom.
 *  Coarse activation gate for v1 (introduce-before-review holds: a point's
 *  module must have content unlocked before the point can be reviewed). */
export function getReachedModules(
  unlocked: ReadonlySet<string> = getUnlockedAtomIds(),
): Set<string> {
  const reached = new Set<string>();
  for (const atom of JA_COURSE_ATOMS) {
    if (atom.fromModule && unlocked.has(canonicalAtomId(atom))) {
      reached.add(atom.fromModule);
    }
  }
  return reached;
}

/**
 * Grammar-point categories that never enter Track B review. Number/counter
 * recognition is vocab & Counters-Trainer material, not grammar application
 * (Spencer 2026-07-06: "which one is number 3 — that's not grammar").
 * Excluding at this single activation choke point keeps the deck, the
 * practice-page badge, and review-lesson grammar picks consistent. Existing
 * Track B state for an excluded point is left in place — it simply never
 * surfaces. NB: family-register rides out on its "number" categorization
 * (itself questionable, but its register-vocab MCQs are equally non-grammar).
 */
export const NON_REVIEWABLE_CATEGORIES: ReadonlySet<string> = new Set([
  "number",
  "counter",
]);

/** Shipped, reviewable-category grammar points whose module the learner has
 *  reached. */
export function getActiveGrammarPoints(
  unlocked: ReadonlySet<string> = getUnlockedAtomIds(),
): GrammarPoint[] {
  const reached = getReachedModules(unlocked);
  return GRAMMAR_POINTS.filter(
    (p) =>
      p.status === "shipped" &&
      !NON_REVIEWABLE_CATEGORIES.has(p.category) &&
      reached.has(p.module),
  );
}

export type GrammarReviewItem = {
  point: GrammarPoint;
  state: SRSCardState | null;
  dueModalities: SRSModality[];
  isNew: boolean;
};

export type GrammarReviewQueue = {
  review: GrammarReviewItem[];
  newItems: GrammarReviewItem[];
  queue: GrammarReviewItem[];
  dueCount: number;
  newCount: number;
  unseenTotal: number;
  newCardsAllowed: number;
  /** Reviewed-but-not-yet-due points appended by `includeNotDue` (else 0). */
  notDueCount: number;
};

export type BuildGrammarReviewQueueOpts = {
  /**
   * Optional pool-awareness filter, applied to the active-points list before
   * the due/unseen partition and slicing (so a filtered-out point consumes
   * neither a due slot nor a new-card slot). The engine itself stays
   * pool-UNAWARE — callers that know about `grammarReviewPools` (the practice
   * page, the review session) pass `hasPool: (id) => getGrammarPool(id).length
   * > 0` to keep points with no renderable review steps (see
   * `POOL_GAP_EXEMPTIONS`) from permanently occupying the queue. Omitted =
   * unchanged (pre-filter) behavior.
   */
  hasPool?: (pointId: string) => boolean;
  /**
   * Free/practice mode: ALSO append active points that carry state but are
   * not due (soonest-due first, after due + new items). Widens the queue
   * only — `dueCount`/`newCount` keep their scheduled meaning, so badges
   * stay honest. The no-SRS-write semantics of a practice session are the
   * caller's responsibility (see `useGrammarReviewSession({practice})`).
   */
  includeNotDue?: boolean;
};

/**
 * Build the Track B review queue: active grammar points that are due, plus a
 * throttled slice of never-reviewed ones. Mirrors `buildReviewQueue`'s
 * due/unseen split + adaptive new-item cap so the two tracks pace alike.
 */
export function buildGrammarReviewQueue(
  unlocked: ReadonlySet<string> = getUnlockedAtomIds(),
  newPerDay?: number,
  opts?: BuildGrammarReviewQueueOpts,
): GrammarReviewQueue {
  const active = getActiveGrammarPoints(unlocked).filter(
    (p) => !opts?.hasPool || opts.hasPool(p.id),
  );
  const review: GrammarReviewItem[] = [];
  const unseen: GrammarReviewItem[] = [];
  const notDue: GrammarReviewItem[] = [];

  for (const point of active) {
    const state = getGrammarCardState(point.id);
    if (!state) {
      unseen.push({ point, state: null, dueModalities: [], isNew: true });
    } else if (isDue(state)) {
      review.push({
        point,
        state,
        dueModalities: getDueModalities(state),
        isNew: false,
      });
    } else if (opts?.includeNotDue && !isBuried(state)) {
      notDue.push({ point, state, dueModalities: [], isNew: false });
    }
  }

  // Soonest-due first — the points closest to falling due are the most
  // valuable extra practice.
  notDue.sort((a, b) =>
    cardEarliestDueDate(a.state!).localeCompare(cardEarliestDueDate(b.state!)),
  );

  const cap = newPerDay ?? adaptiveNewCardsPerDay(unseen.length);
  const newItems = unseen.slice(0, cap);
  const queue = [...review, ...newItems, ...notDue];

  return {
    review,
    newItems,
    queue,
    dueCount: review.length,
    newCount: newItems.length,
    unseenTotal: unseen.length,
    newCardsAllowed: cap,
    notDueCount: notDue.length,
  };
}

export type NextGrammarDue = {
  /** Earliest upcoming due date (YYYY-MM-DD, strictly after today). */
  dueDate: string;
  /** Active points whose earliest modality falls due on that date. */
  count: number;
};

/**
 * When is the next grammar review coming? Scans active (reached + optionally
 * pooled) points that carry state but aren't due today and returns the
 * earliest upcoming due date + how many points land on it. Null when nothing
 * is scheduled ahead (no state at all, or everything is already due). Feeds
 * the review session's caught-up empty state ("3 points due tomorrow").
 */
export function nextGrammarDue(
  unlocked: ReadonlySet<string> = getUnlockedAtomIds(),
  opts?: Pick<BuildGrammarReviewQueueOpts, "hasPool">,
): NextGrammarDue | null {
  const active = getActiveGrammarPoints(unlocked).filter(
    (p) => !opts?.hasPool || opts.hasPool(p.id),
  );
  const today = getToday();
  let earliest: string | null = null;
  let count = 0;
  for (const point of active) {
    const state = getGrammarCardState(point.id);
    if (!state || isBuried(state) || isDue(state)) continue;
    const due = cardEarliestDueDate(state);
    if (due <= today) continue;
    if (earliest === null || due < earliest) {
      earliest = due;
      count = 1;
    } else if (due === earliest) {
      count += 1;
    }
  }
  return earliest === null ? null : { dueDate: earliest, count };
}

/**
 * Dev-panel helper: make every stored Track B entry due now (both modalities;
 * bury cleared). Never-reviewed points need no forcing — they already surface
 * as new cards. Returns the number of entries touched. The dev-only gating
 * lives at the call site (DevPanel renders in dev builds only).
 */
export function devForceAllGrammarDue(): number {
  const store = loadStore();
  const today = getToday();
  let touched = 0;
  for (const state of Object.values(store)) {
    state.recognition.dueDate = today;
    state.production.dueDate = today;
    delete state.buriedUntil;
    touched += 1;
  }
  if (touched > 0) saveStore(store);
  return touched;
}

/** Test/dev helper: clear Track B state. */
export function clearGrammarStore(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // ignore
  }
}
