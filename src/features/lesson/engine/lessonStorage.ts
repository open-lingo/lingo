import type { BatchAttempt } from "@/shared/api/progress";

const BUFFER_KEY = "open-lingo-lesson-attempts:v1";
const LAST_SYNC_KEY = "open-lingo-lesson-last-sync";
const NEXT_SYNC_KEY = "open-lingo-lesson-next-sync";

/** A pending lesson attempt in the local buffer.
 *
 * Mirrors `BatchAttempt` from the API client. Stored verbatim so the buffer
 * can be POSTed as-is when the SyncManager flushes.
 */
export type PendingAttempt = BatchAttempt & {
  /** Local-only field — set when this attempt was added to the buffer. */
  bufferedAt: string;
};

export function getPendingAttempts(): PendingAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BUFFER_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as PendingAttempt[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setPendingAttempts(attempts: PendingAttempt[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BUFFER_KEY, JSON.stringify(attempts));
  } catch {
    // ignore quota errors
  }
}

export function appendPendingAttempt(attempt: PendingAttempt): void {
  const list = getPendingAttempts();
  // Dedupe on clientAttemptId — if the same attempt is recorded twice
  // (e.g. user double-tapped Continue), keep the most recent payload.
  const idx = list.findIndex(
    (a) => a.clientAttemptId === attempt.clientAttemptId,
  );
  if (idx >= 0) {
    list[idx] = attempt;
  } else {
    list.push(attempt);
  }
  setPendingAttempts(list);
}

export function removePendingAttempts(ids: string[]): void {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const list = getPendingAttempts().filter(
    (a) => !idSet.has(a.clientAttemptId),
  );
  setPendingAttempts(list);
}

export function clearPendingAttempts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BUFFER_KEY);
}

/** ISO timestamp of last successful lesson sync to backend. */
export function getLastLessonSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastLessonSyncAt(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

/** ISO timestamp when next auto-sync will run. */
export function getNextLessonSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NEXT_SYNC_KEY);
}

export function setNextLessonSyncAt(iso: string | null): void {
  if (typeof window === "undefined") return;
  if (iso == null) {
    localStorage.removeItem(NEXT_SYNC_KEY);
  } else {
    localStorage.setItem(NEXT_SYNC_KEY, iso);
  }
}
