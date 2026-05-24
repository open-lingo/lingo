/**
 * Per-user lesson completion cache (localStorage) + dev unlock flag.
 *
 * Source of truth for pathway unlocks is the progress API; this store is
 * hydrated on sign-in via `features/lesson/engine/progressSync.ts` and
 * updated optimistically when a lesson finishes. Pending attempts flush
 * through the lesson sync buffer.
 */

import type { LessonRollup } from "@/shared/api/progress";
import { getActiveUserStorageId } from "@/features/settings/storage";

const STORAGE_PREFIX = "open-lingo-lesson-progress:";
const DEV_UNLOCK_KEY = "lingo_dev_unlock";

export type LessonCompletion = {
  lessonId: string;
  firstCompletedAt: string;
  lastCompletedAt: string;
  bestAccuracy: number;
  lastXp: number;
  reviewCount: number;
  /** Row-test skip path — local-only until the server stores it. */
  wasSkipped?: boolean;
};

type ProgressStore = {
  completed: Record<string, LessonCompletion>;
  lastStoppedCleanly?: string;
};

const listeners = new Set<() => void>();

function progressStorageKey(): string {
  return `${STORAGE_PREFIX}${getActiveUserStorageId()}`;
}

function notifyProgressChanged(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* keep going */
    }
  });
}

export function subscribeLessonProgress(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function loadStore(): ProgressStore {
  if (typeof window === "undefined") return { completed: {} };
  try {
    const raw = localStorage.getItem(progressStorageKey());
    if (!raw) return { completed: {} };
    const parsed = JSON.parse(raw) as ProgressStore;
    return parsed?.completed ? parsed : { completed: {} };
  } catch {
    return { completed: {} };
  }
}

function saveStore(store: ProgressStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(progressStorageKey(), JSON.stringify(store));
    notifyProgressChanged();
  } catch {
    /* quota */
  }
}

function rollupToCompletion(rollup: LessonRollup): LessonCompletion {
  const firstAt = rollup.firstPassedAt ?? rollup.latestAttemptAt;
  return {
    lessonId: rollup.lessonId,
    firstCompletedAt: firstAt,
    lastCompletedAt: rollup.latestAttemptAt,
    bestAccuracy: rollup.bestScore,
    lastXp: 0,
    reviewCount: Math.max(0, rollup.attemptCount - 1),
  };
}

function mergeCompletion(
  local: LessonCompletion | undefined,
  incoming: LessonCompletion,
): LessonCompletion {
  if (!local) return incoming;

  const localTs = Date.parse(local.lastCompletedAt);
  const incomingTs = Date.parse(incoming.lastCompletedAt);

  if (incomingTs > localTs) {
    return {
      ...incoming,
      firstCompletedAt: local.firstCompletedAt,
      lastXp: local.lastXp,
      wasSkipped: local.wasSkipped,
    };
  }

  return {
    ...local,
    reviewCount: Math.max(local.reviewCount, incoming.reviewCount),
    bestAccuracy: Math.max(local.bestAccuracy, incoming.bestAccuracy),
    firstCompletedAt: local.firstCompletedAt ?? incoming.firstCompletedAt,
  };
}

/** Merge server lesson rollups into the local cache. Returns count updated. */
export function mergeServerLessonRollups(rollups: LessonRollup[]): number {
  if (rollups.length === 0) return 0;

  const store = loadStore();
  let changed = 0;

  for (const rollup of rollups) {
    const incoming = rollupToCompletion(rollup);
    const merged = mergeCompletion(store.completed[rollup.lessonId], incoming);
    const prev = store.completed[rollup.lessonId];
    if (
      !prev ||
      prev.lastCompletedAt !== merged.lastCompletedAt ||
      prev.reviewCount !== merged.reviewCount ||
      prev.bestAccuracy !== merged.bestAccuracy
    ) {
      store.completed[rollup.lessonId] = merged;
      changed += 1;
    }
  }

  if (changed > 0) saveStore(store);
  return changed;
}

export function getMockCompletedLessonIds(): string[] {
  return Object.keys(loadStore().completed);
}

export function isLessonCompleted(lessonId: string): boolean {
  return Boolean(loadStore().completed[lessonId]);
}

export function getLessonCompletion(lessonId: string): LessonCompletion | null {
  return loadStore().completed[lessonId] ?? null;
}

export function markLessonCompleted(
  lessonId: string,
  opts: {
    accuracy: number;
    xpEarned: number;
    isReview: boolean;
    wasSkipped?: boolean;
  },
): void {
  const store = loadStore();
  const now = new Date().toISOString();
  const prev = store.completed[lessonId];
  const wasSkipped = opts.wasSkipped ?? false;
  store.completed[lessonId] = {
    lessonId,
    firstCompletedAt: prev?.firstCompletedAt ?? now,
    lastCompletedAt: now,
    bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, opts.accuracy),
    lastXp: opts.xpEarned,
    reviewCount: (prev?.reviewCount ?? 0) + (opts.isReview ? 1 : 0),
    wasSkipped: wasSkipped && (prev?.wasSkipped ?? true),
  };
  saveStore(store);
}

export function clearMockProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(progressStorageKey());
  notifyProgressChanged();
}

export function markLastStoppedCleanly(now: string = new Date().toISOString()): void {
  const store = loadStore();
  store.lastStoppedCleanly = now;
  saveStore(store);
}

export function getLastStoppedCleanly(): string | null {
  return loadStore().lastStoppedCleanly ?? null;
}

export function isDevUnlockOn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEV_UNLOCK_KEY) === "1";
}

export function setDevUnlock(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(DEV_UNLOCK_KEY, "1");
  else localStorage.removeItem(DEV_UNLOCK_KEY);
}

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

function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeStreakDays(completedDays: Set<string>): number {
  if (completedDays.size === 0) return 0;
  const today = new Date();
  const todayKey = localDayKey(today);
  const cursor = new Date(today);
  if (!completedDays.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!completedDays.has(localDayKey(cursor))) return 0;
  }
  let count = 0;
  while (completedDays.has(localDayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function getMockProgressSummary(): ProgressSummary {
  if (typeof window === "undefined") return { ...MOCK_PROGRESS };

  const store = loadStore();
  const completions = Object.values(store.completed);

  if (completions.length === 0) {
    return {
      streakDays: 0,
      lessonsCompletedThisWeek: 0,
      dailyGoalMinutes: MOCK_PROGRESS.dailyGoalMinutes,
      dailyGoalCompletedMinutes: 0,
      cardsDueToday: 0,
      xpTotal: 0,
      xpEarnedToday: 0,
    };
  }

  const now = new Date();
  const todayKey = localDayKey(now);
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const completedDayKeys = new Set<string>();
  let xpTotal = 0;
  let xpEarnedToday = 0;
  let lessonsThisWeek = 0;

  for (const c of completions) {
    const last = new Date(c.lastCompletedAt);
    const dayKey = localDayKey(last);
    completedDayKeys.add(dayKey);
    xpTotal += c.lastXp ?? 0;
    if (dayKey === todayKey) xpEarnedToday += c.lastXp ?? 0;
    if (last.getTime() >= sevenDaysAgoMs) lessonsThisWeek += 1;
  }

  return {
    streakDays: computeStreakDays(completedDayKeys),
    lessonsCompletedThisWeek: lessonsThisWeek,
    dailyGoalMinutes: MOCK_PROGRESS.dailyGoalMinutes,
    dailyGoalCompletedMinutes: 0,
    cardsDueToday: 0,
    xpTotal,
    xpEarnedToday,
  };
}
