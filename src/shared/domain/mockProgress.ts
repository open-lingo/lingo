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
/**
 * One-time migration flag for the alphabet-streamline change. When set,
 * the legacy row ids (`ja-m1-ka`, etc.) have already been expanded into
 * sub-lesson ids (`ja-m1-ka-1`, `ja-m1-ka-2`, ..., `ja-m1-ka-test`).
 *
 * Idempotent: re-running the migration on already-migrated data is a no-op.
 * Versioned key allows future migrations to chain.
 */
const MIGRATION_FLAG_KEY = "lingo_progress_migration_v1";
/**
 * Curriculum-restructure migration flag (2026-05-15). When set, legacy
 * yōon sub-lesson ids (`ja-m1-yo-k-*`, `ja-m1-yo-sh-ch-*`, `ja-m1-yo-g-j-*`,
 * `ja-m1-yo-n-h-*`, `ja-m1-yo-m-r-*`, `ja-m1-yo-b-p-*`) have already been
 * remapped to the consolidated row ids (`ja-m1-yoon-intro-*`,
 * `ja-m1-yoon-sh-ch-*`, `ja-m1-yoon-voiced-*`, `ja-m1-yoon-rare-*`).
 *
 * Dakuten -3 sub-lessons (e.g. `ja-m1-ga-3`) orphan harmlessly — the new
 * compressed dakuten only has -1/-2/-test sub-lessons, but leftover -3
 * entries in `store.completed` aren't referenced and don't cost anything.
 *
 * Idempotent: re-running on already-migrated data is a no-op.
 */
const MIGRATION_FLAG_KEY_V3 = "lingo_progress_migration_v3";

/**
 * Yōon row migration map (curriculum-restructure 2026-05-15).
 * Old yo-* row id → new yoon-* row id.
 * yo-b-p folds into yoon-voiced (b+p families joined the dakuten yōon block).
 */
const YOON_ROW_MIGRATION_V3: Record<string, string> = {
  "yo-k": "yoon-intro",
  "yo-sh-ch": "yoon-sh-ch",
  "yo-g-j": "yoon-voiced",
  "yo-b-p": "yoon-voiced",
  "yo-n-h": "yoon-rare",
  "yo-m-r": "yoon-rare",
};

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
    if (!raw) {
      // Even with no progress yet, mark migration done so first-run users
      // skip the check on subsequent loads.
      markStreamlineMigrationDone();
      markV3MigrationDone();
      return { completed: {} };
    }
    const parsed = JSON.parse(raw) as ProgressStore;
    const store: ProgressStore =
      parsed && parsed.completed ? parsed : { completed: {} };
    runStreamlineMigration(store);
    runCurriculumRestructureMigration(store);
    return store;
  } catch {
    return { completed: {} };
  }
}

/**
 * Alphabet-streamline migration: any legacy row-lesson id (`ja-m1-ka`)
 * that's already completed gets credit duplicated across every sub-lesson
 * id (`ja-m1-ka-1`, `ja-m1-ka-2`, `ja-m1-ka-3`, `ja-m1-ka-test`).
 *
 * The migration flag guards against re-running, but the function is also
 * structurally idempotent — re-applying it to already-migrated data is
 * a no-op because the sub-lesson ids already exist in `store.completed`.
 */
function runStreamlineMigration(store: ProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === "1") return;
  } catch {
    return;
  }
  // Lazy-load to avoid an import cycle: mockProgress → generatedHiragana →
  // lessonBuilder → struggleStore → SRSStoreRevisionContext.
  // The map is computed at curriculum import time so this is cheap.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let rowMap: Record<string, string[]> = {};
  try {
    // Synchronous CommonJS-style require isn't available under Vite ESM,
    // so guard in a try/catch and accept that the migration is a no-op
    // if the curriculum module hasn't loaded yet. The flag is left UNSET
    // so the migration retries on the next loadStore() call.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (globalThis as any).__lingo_row_sub_lesson_ids__;
    if (mod) rowMap = mod;
  } catch {
    rowMap = {};
  }
  if (Object.keys(rowMap).length === 0) {
    // First-pass: no map yet. The curriculum module registers itself
    // via the global below; we just bail and retry on next load.
    return;
  }
  let mutated = false;
  for (const [rowId, subIds] of Object.entries(rowMap)) {
    const legacyId = `ja-m1-${rowId}`;
    const legacy = store.completed[legacyId];
    if (!legacy) continue;
    for (const subId of subIds) {
      if (store.completed[subId]) continue; // idempotent
      store.completed[subId] = {
        lessonId: subId,
        firstCompletedAt: legacy.firstCompletedAt,
        lastCompletedAt: legacy.lastCompletedAt,
        bestAccuracy: legacy.bestAccuracy,
        lastXp: 0, // credit but don't double-count XP
        reviewCount: 0,
      };
      mutated = true;
    }
  }
  if (mutated) saveStore(store);
  markStreamlineMigrationDone();
}

function markStreamlineMigrationDone(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

/**
 * Curriculum-restructure migration (2026-05-15):
 *   Rewrite legacy yōon lesson ids to the new consolidated row ids so a
 *   user mid-flight doesn't re-learn anything.
 *
 *   - `ja-m1-yo-k-{suffix}`     → `ja-m1-yoon-intro-1`     (any suffix → -1)
 *   - `ja-m1-yo-sh-ch-{suffix}` → `ja-m1-yoon-sh-ch-1`
 *   - `ja-m1-yo-g-j-{suffix}`   → `ja-m1-yoon-voiced-1`
 *   - `ja-m1-yo-b-p-{suffix}`   → `ja-m1-yoon-voiced-1`    (fold into voiced)
 *   - `ja-m1-yo-n-h-{suffix}`   → `ja-m1-yoon-rare-1`
 *   - `ja-m1-yo-m-r-{suffix}`   → `ja-m1-yoon-rare-1`      (fold into rare)
 *
 *   New rows have a single intro sub-lesson (`-1`), so any legacy completion
 *   maps to that one node. Test/recap suffixes also collapse onto `-1`
 *   because the new structure has no per-row test (capstone covers all yōon).
 *
 *   Dakuten `-3` sub-lessons orphan harmlessly — leftover keys in
 *   `store.completed` aren't referenced by any new lesson id but don't cost
 *   anything to keep around.
 *
 *   Idempotent: the flag guard prevents re-run, and the function is also
 *   structurally idempotent (new ids are written only if absent).
 */
function runCurriculumRestructureMigration(store: ProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY_V3) === "1") return;
  } catch {
    return;
  }
  let mutated = false;
  // Match `ja-m{N}-{oldRow}-{suffix}` for each legacy yōon row id.
  for (const [oldRow, newRow] of Object.entries(YOON_ROW_MIGRATION_V3)) {
    // Scan a snapshot of keys so adding new ones in-loop doesn't trip the
    // iterator. The new ids are not legacy-prefixed so we don't re-match.
    const legacyKeys = Object.keys(store.completed).filter((k) =>
      k.startsWith(`ja-m1-${oldRow}-`) || k.startsWith(`ja-m2-${oldRow}-`),
    );
    for (const legacyKey of legacyKeys) {
      const legacy = store.completed[legacyKey];
      const newKey = `ja-m1-${newRow}-1`;
      if (store.completed[newKey]) continue; // already credited
      store.completed[newKey] = {
        lessonId: newKey,
        firstCompletedAt: legacy.firstCompletedAt,
        lastCompletedAt: legacy.lastCompletedAt,
        bestAccuracy: legacy.bestAccuracy,
        lastXp: 0, // credit but don't double-count XP
        reviewCount: 0,
      };
      mutated = true;
    }
  }
  if (mutated) saveStore(store);
  markV3MigrationDone();
}

function markV3MigrationDone(): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY_V3, "1");
  } catch {
    // ignore
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
