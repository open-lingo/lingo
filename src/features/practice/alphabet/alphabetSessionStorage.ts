/**
 * Persists an in-flight alphabet lesson so the user can resume after closing
 * a tab, switching alphabets, or coming back tomorrow.
 *
 * Stores the full step list (not just `currentStepIdx`) so resume is exact —
 * the user lands on the same step in the same order they were on, not on a
 * freshly-rebuilt session that may have re-prioritized.
 *
 * Sessions are keyed by `(languageId, alphabetId, sectionId, mode)` so the
 * user can have hiragana and katakana in flight simultaneously without one
 * stomping the other.
 *
 * Format is versioned via `SESSION_VERSION`; bump and discard older sessions
 * if the {@link LessonStep} shape ever changes incompatibly.
 */

import type { LessonStep } from "@/features/lesson/types";

const STORAGE_PREFIX = "lingo_alphabet_session_";
const SESSION_VERSION = 1;
const FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type StoredAlphabetSession = {
  version: number;
  languageId: string;
  alphabetId: string;
  sectionId: string | null;
  mode: "learn" | "test";
  steps: LessonStep[];
  currentStepIdx: number;
  results: Record<string, boolean>;
  inReviewRound: boolean;
  reviewSymbols: string[];
  createdAt: string;
  updatedAt: string;
};

function storageKey(
  languageId: string,
  alphabetId: string,
  sectionId: string | null,
  mode: "learn" | "test",
): string {
  return `${STORAGE_PREFIX}${languageId}_${alphabetId}_${sectionId ?? "default"}_${mode}`;
}

export function loadStoredSession(
  languageId: string,
  alphabetId: string,
  sectionId: string | null,
  mode: "learn" | "test",
): StoredAlphabetSession | null {
  try {
    const raw = localStorage.getItem(
      storageKey(languageId, alphabetId, sectionId, mode),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAlphabetSession;
    if (parsed.version !== SESSION_VERSION) return null;
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (Number.isNaN(age) || age > FRESHNESS_MS) return null;
    if (parsed.currentStepIdx >= parsed.steps.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: Omit<StoredAlphabetSession, "version" | "createdAt" | "updatedAt"> & {
  createdAt?: string;
}): void {
  try {
    const now = new Date().toISOString();
    const payload: StoredAlphabetSession = {
      version: SESSION_VERSION,
      ...session,
      createdAt: session.createdAt ?? now,
      updatedAt: now,
    };
    localStorage.setItem(
      storageKey(
        session.languageId,
        session.alphabetId,
        session.sectionId,
        session.mode,
      ),
      JSON.stringify(payload),
    );
  } catch {
    /* localStorage full, private mode, etc — silent best-effort. */
  }
}

export function clearStoredSession(
  languageId: string,
  alphabetId: string,
  sectionId: string | null,
  mode: "learn" | "test",
): void {
  try {
    localStorage.removeItem(
      storageKey(languageId, alphabetId, sectionId, mode),
    );
  } catch {
    /* ignore */
  }
}
