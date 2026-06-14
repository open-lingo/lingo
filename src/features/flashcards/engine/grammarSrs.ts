/**
 * Track B — grammar/production SRS (retention design 2026-06-13, §4 Track B).
 *
 * A SECOND spaced-repetition track, separate from the vocab card store
 * (`open-lingo-srs:v2`). The reviewable unit is a GRAMMAR POINT from the
 * existing `n5-grammar-points.json` registry (te-form, は-topic, ます-form…) —
 * NOT a vocab word. Grammar points never render as flashcards; they surface
 * only as lesson-style review steps (cloze/build/translate/speak), because
 * building/producing a sentence is not a flashcard interaction.
 *
 * Reuses the pure FSRS engine (`./srs`) + `SRSCardState` shape; only the
 * store key differs (D6: piggyback the local-first store with a new
 * namespace). v1 activates a point COARSELY when its module is reached
 * (some atom from that module unlocked); per-step `exercisedGrammar` tagging
 * is a later precision pass.
 */
import grammarPointsJson from "@/features/lesson/data/n5-grammar-points.json";
import type { SRSCardState, SRSModality, SRSRating } from "../data/types";
import { createInitialState, isDue, reviewCard, getDueModalities } from "./srs";
import { adaptiveNewCardsPerDay } from "./reviewQueue";
import { JA_COURSE_ATOMS, canonicalAtomId } from "@/features/languages/ja/courseAtoms";
import { getUnlockedAtomIds } from "@/features/lesson/data/unlockLessonAtoms";

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

function loadStore(): GrammarStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GrammarStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: GrammarStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
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

/** Shipped grammar points whose module the learner has reached. */
export function getActiveGrammarPoints(
  unlocked: ReadonlySet<string> = getUnlockedAtomIds(),
): GrammarPoint[] {
  const reached = getReachedModules(unlocked);
  return GRAMMAR_POINTS.filter(
    (p) => p.status === "shipped" && reached.has(p.module),
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
};

/**
 * Build the Track B review queue: active grammar points that are due, plus a
 * throttled slice of never-reviewed ones. Mirrors `buildReviewQueue`'s
 * due/unseen split + adaptive new-item cap so the two tracks pace alike.
 */
export function buildGrammarReviewQueue(
  unlocked: ReadonlySet<string> = getUnlockedAtomIds(),
  newPerDay?: number,
): GrammarReviewQueue {
  const active = getActiveGrammarPoints(unlocked);
  const review: GrammarReviewItem[] = [];
  const unseen: GrammarReviewItem[] = [];

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
    }
  }

  const cap = newPerDay ?? adaptiveNewCardsPerDay(unseen.length);
  const newItems = unseen.slice(0, cap);
  const queue = [...review, ...newItems];

  return {
    review,
    newItems,
    queue,
    dueCount: review.length,
    newCount: newItems.length,
    unseenTotal: unseen.length,
    newCardsAllowed: cap,
  };
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
