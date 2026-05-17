/**
 * Module-review SRS schedule (M3 restructure, 2026-05-16).
 *
 * Mirrors `mockProgress.ts` storage style: versioned key, try/catch around
 * localStorage, idempotent writes. Per Spencer's spec:
 *
 *   - Stage 0: first review scheduled +1 day after the source module's row
 *     test is passed.
 *   - Stages 1..5 advance by completing the review module, with intervals
 *     +3d, +7d, +14d, +30d, +90d.
 *   - Stage 5 = graduated — earns its own mastery ★ on the review module.
 *
 *   - Soft gate only — `getDueReviews` surfaces the chip on Learn home and
 *     the Practice page; nothing blocks new module entry.
 */
import type { Course } from "@/shared/domain/course";

const STORAGE_KEY = "lingo_module_reviews_v1";

/** Stage → interval-from-last-completion in ms.
 *  Stage 5 has no "next" — it's the graduation stage. */
const STAGE_INTERVALS_MS: Record<number, number> = {
  0: 1 * 24 * 60 * 60 * 1000, // 1 day (first review, after module completion)
  1: 3 * 24 * 60 * 60 * 1000, // 3 days
  2: 7 * 24 * 60 * 60 * 1000, // 7 days
  3: 14 * 24 * 60 * 60 * 1000, // 14 days
  4: 30 * 24 * 60 * 60 * 1000, // 30 days
  5: 90 * 24 * 60 * 60 * 1000, // 90 days (graduated)
};

export const GRADUATED_STAGE = 5;

export type ReviewState = {
  /** Current stage 0..5. 5 = graduated (earns ★). */
  stage: number;
  /** ISO 8601. For stage 0, set this to the moment the source module
   *  was completed; stage advances on review-module completion. */
  lastCompletedAt: string;
};

type ReviewStore = Record<string, ReviewState>;

function load(): ReviewStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReviewStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function save(store: ReviewStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

/**
 * Read the current review state for a source module id. Returns null when
 * no review has been scheduled yet (i.e. the source module hasn't been
 * completed for the first time).
 */
export function getReviewSchedule(moduleId: string): ReviewState | null {
  return load()[moduleId] ?? null;
}

/**
 * Get all review schedules in the store (live snapshot, not reactive).
 */
export function getAllReviewSchedules(): ReadonlyMap<string, ReviewState> {
  return new Map(Object.entries(load()));
}

/**
 * Record that a source module has just been completed (its row-test passed
 * un-skipped). Schedules its first review at stage 0 — due +1 day from
 * `completedAt`. Idempotent: re-calling for an already-scheduled module
 * is a no-op (we don't want a re-mastery to bump back to stage 0).
 *
 * `completedAt` defaults to "now" but accepts an explicit ISO string for
 * deterministic tests.
 */
export function scheduleFirstReview(
  moduleId: string,
  completedAt: string = new Date().toISOString(),
): void {
  const store = load();
  if (store[moduleId]) return;
  store[moduleId] = { stage: 0, lastCompletedAt: completedAt };
  save(store);
}

/**
 * Advance the schedule after a review module has been completed. Bumps
 * stage by 1 (capped at GRADUATED_STAGE) and stamps `lastCompletedAt`
 * with the supplied (or live) time. Calling on a graduated review is a
 * no-op for the stage but refreshes the timestamp.
 */
export function markReviewCompleted(
  moduleId: string,
  completedAt: string = new Date().toISOString(),
): void {
  const store = load();
  const prev = store[moduleId];
  const nextStage = Math.min(
    GRADUATED_STAGE,
    (prev?.stage ?? 0) + 1,
  );
  store[moduleId] = {
    stage: nextStage,
    lastCompletedAt: completedAt,
  };
  save(store);
}

/**
 * Compute the next-due timestamp (ms epoch) for a given review state.
 * Returns null if the review is graduated (no further reviews scheduled).
 */
export function getNextDueMs(state: ReviewState): number | null {
  if (state.stage >= GRADUATED_STAGE) return null;
  const last = Date.parse(state.lastCompletedAt);
  if (!Number.isFinite(last)) return null;
  const interval = STAGE_INTERVALS_MS[state.stage] ?? 0;
  return last + interval;
}

/**
 * Has the review for `moduleId` already been graduated to stage 5?
 * (Used to award the review module its own mastery ★.)
 */
export function isReviewGraduated(moduleId: string): boolean {
  const s = load()[moduleId];
  return s ? s.stage >= GRADUATED_STAGE : false;
}

export type DueReview = {
  /** Source module id (the module being reviewed). */
  moduleId: string;
  /** Current stage 0..4 (5 = graduated, never appears here). */
  stage: number;
  /** Ms epoch when this review became due. Older = higher priority. */
  dueAtMs: number;
};

/**
 * Surface every review currently overdue. Used to render the Learn-home
 * chip ("🔄 N reviews due") and the Practice-page review entry.
 *
 * `nowMs` defaults to live `Date.now()` but accepts an explicit value for
 * deterministic tests.
 */
export function getDueReviews(
  course: Course,
  nowMs: number = Date.now(),
): DueReview[] {
  const store = load();
  const out: DueReview[] = [];
  // Only surface reviews for modules that exist in the course (avoids
  // stale data lingering after a curriculum restructure).
  const moduleIds = new Set(course.modules.map((m) => m.id));
  for (const [moduleId, state] of Object.entries(store)) {
    if (!moduleIds.has(moduleId)) continue;
    if (state.stage >= GRADUATED_STAGE) continue;
    const dueAt = getNextDueMs(state);
    if (dueAt === null) continue;
    if (dueAt > nowMs) continue;
    out.push({ moduleId, stage: state.stage, dueAtMs: dueAt });
  }
  // Oldest-due first (highest priority — most overdue).
  out.sort((a, b) => a.dueAtMs - b.dueAtMs);
  return out;
}

/**
 * For the inter-module-review lessons themselves: derive the review-module
 * id from a source module id. Convention: every source module M3..M7 has a
 * paired review module `m3-review`..`m7-review`.
 */
export function reviewModuleIdFor(sourceModuleId: string): string {
  return `${sourceModuleId}-review`;
}

/**
 * Inverse: extract the source module id from a review module id. Returns
 * null for ids that don't follow the `{moduleId}-review` convention.
 */
export function sourceModuleIdOf(reviewModuleId: string): string | null {
  const m = /^(.+)-review$/.exec(reviewModuleId);
  return m ? m[1] : null;
}

/** Clear all stored review state. Test + dev-tools helper. */
export function clearAllReviewSchedules(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
