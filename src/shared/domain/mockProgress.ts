/**
 * Lesson progress and dev-mode flags, backed by localStorage.
 *
 * Two pieces of state live here:
 *   1. Per-lesson completion records (when finished, accuracy, XP earned,
 *      review count).
 *   2. A `dev_unlock` boolean that, when on, bypasses the
 *      "previous-lesson-must-be-complete" gate in moduleProgress. Useful
 *      for screenshot runs, QA, and dev-mode authoring.
 *
 * Storage shape is versioned so we can migrate later without losing data.
 * Keys are gitignored from the user's perspective — this is per-device
 * state, not a server-synced record (yet — see the followups doc).
 */

const PROGRESS_KEY = "lingo_progress_v1";
const DEV_UNLOCK_KEY = "lingo_dev_unlock";

export type LessonCompletion = {
  lessonId: string;
  /** ISO 8601 of the first time this lesson was completed. */
  firstCompletedAt: string;
  /** ISO of the most recent completion (first or review). */
  lastCompletedAt: string;
  /** Best accuracy ever achieved on this lesson, 0..1. */
  bestAccuracy: number;
  /** XP earned on the latest run. First run = full reward; reviews are reduced. */
  lastXp: number;
  /** How many times the lesson was replayed for review credit. */
  reviewCount: number;
};

type ProgressStore = {
  completed: Record<string, LessonCompletion>;
};

function loadStore(): ProgressStore {
  if (typeof window === "undefined") return { completed: {} };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: {} };
    const parsed = JSON.parse(raw) as ProgressStore;
    return parsed && parsed.completed
      ? parsed
      : { completed: {} };
  } catch {
    return { completed: {} };
  }
}

function saveStore(store: ProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function getMockCompletedLessonIds(): string[] {
  return Object.keys(loadStore().completed);
}

export function isLessonCompleted(lessonId: string): boolean {
  return Boolean(loadStore().completed[lessonId]);
}

export function getLessonCompletion(
  lessonId: string,
): LessonCompletion | null {
  return loadStore().completed[lessonId] ?? null;
}

/**
 * Record a lesson completion. `isReview` is true when the learner is
 * re-running an already-completed lesson — those bump the `reviewCount`
 * but don't shift `firstCompletedAt`.
 */
export function markLessonCompleted(
  lessonId: string,
  opts: { accuracy: number; xpEarned: number; isReview: boolean },
): void {
  const store = loadStore();
  const now = new Date().toISOString();
  const prev = store.completed[lessonId];
  store.completed[lessonId] = {
    lessonId,
    firstCompletedAt: prev?.firstCompletedAt ?? now,
    lastCompletedAt: now,
    bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, opts.accuracy),
    lastXp: opts.xpEarned,
    reviewCount: (prev?.reviewCount ?? 0) + (opts.isReview ? 1 : 0),
  };
  saveStore(store);
}

export function clearMockProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROGRESS_KEY);
}

// ----- Dev unlock --------------------------------------------------------

export function isDevUnlockOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEV_UNLOCK_KEY) === "1";
}

export function setDevUnlock(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(DEV_UNLOCK_KEY, "1");
  else localStorage.removeItem(DEV_UNLOCK_KEY);
}

// ----- Progress summary --------------------------------------------------

export type ProgressSummary = {
  streakDays: number;
  lessonsCompletedThisWeek: number;
  dailyGoalMinutes: number;
  dailyGoalCompletedMinutes: number;
  cardsDueToday: number;
  xpTotal?: number;
  xpEarnedToday?: number;
};

const MOCK_PROGRESS: ProgressSummary = {
  streakDays: 5,
  lessonsCompletedThisWeek: 3,
  dailyGoalMinutes: 10,
  dailyGoalCompletedMinutes: 4,
  cardsDueToday: 12,
  xpTotal: 1250,
  xpEarnedToday: 50,
};

export function getMockProgressSummary(): ProgressSummary {
  // Sum lastXp across completions for a live xpTotal once that surface
  // becomes real. For now keep the mock summary stable.
  return { ...MOCK_PROGRESS };
}
