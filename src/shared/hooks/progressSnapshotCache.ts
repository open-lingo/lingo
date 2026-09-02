/**
 * Persists the last successful `/progress/me` summary per user so
 * `useProgressMe` can hydrate optimistically on the next cold start instead
 * of full-page-gating the home paint on a fresh round-trip (Option B,
 * see `docs/handoff-2026-08-26-appstore-wave.md`).
 */
import type { ProgressSummary } from "@/shared/api/progress";

const KEY_PREFIX = "open-lingo-progress-snapshot:v1:";

interface StoredSnapshot {
  data: ProgressSummary;
  savedAt: number;
}

export function readProgressSnapshot(userId: string): StoredSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSnapshot>;
    if (!parsed.data || typeof parsed.savedAt !== "number") return null;
    return { data: parsed.data, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

export function writeProgressSnapshot(userId: string, data: ProgressSummary): void {
  try {
    const snapshot: StoredSnapshot = { data, savedAt: Date.now() };
    localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(snapshot));
  } catch {
    // Private browsing / quota exceeded — optimistic hydration is a nice-to
    // have, never a hard dependency.
  }
}
