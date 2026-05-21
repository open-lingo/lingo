import type { SRSCardState } from "../data/types";

// Bumped storage namespace for the FSRS-6 migration (2026-05-20). The
// schema changed (stability + difficulty replaced easeFactor) and we
// intentionally discard prior entries rather than mapping them — see
// docs/lesson-editor-research-2026-05-20.md and CLAUDE.md.
const STORAGE_KEY = "open-lingo-srs:v2";
const LEGACY_STORAGE_KEY = "open-lingo-srs";
const LAST_SYNC_KEY = "open-lingo-srs-last-sync";
const NEXT_SYNC_KEY = "open-lingo-srs-next-sync";

export type SRSStore = Record<string, SRSCardState>;

/** Type guard: matches the post-FSRS-6 schema. Drops any other shape. */
function isFsrsState(v: unknown): v is SRSCardState {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.stability === "number" &&
    typeof obj.difficulty === "number" &&
    typeof obj.state === "string" &&
    typeof obj.interval === "number" &&
    typeof obj.dueDate === "string" &&
    typeof obj.lastReviewDate === "string" &&
    typeof obj.reps === "number" &&
    typeof obj.lapses === "number" &&
    (obj.learningSteps === undefined || typeof obj.learningSteps === "number")
  );
}

export function getSRSStore(): SRSStore {
  if (typeof window === "undefined") return {};
  try {
    // One-time clear of any pre-FSRS-6 store still hanging around in
    // older browsers. Cheap, idempotent, and only runs while the legacy
    // key exists.
    if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const valid: SRSStore = {};
    for (const [id, state] of Object.entries(parsed)) {
      if (isFsrsState(state)) valid[id] = state;
    }
    return valid;
  } catch {
    return {};
  }
}

export function setSRSStore(store: SRSStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function getCardState(cardId: string): SRSCardState | undefined {
  return getSRSStore()[cardId];
}

export function setCardState(cardId: string, state: SRSCardState): void {
  const store = getSRSStore();
  store[cardId] = state;
  setSRSStore(store);
}

export function clearSRSStore(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** ISO timestamp of last successful SRS sync to backend. */
export function getLastSrsSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSrsSyncAt(iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

/** ISO timestamp when next auto-sync will run (during review session). Cleared when leaving reviewer. */
export function getNextSrsSyncAt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NEXT_SYNC_KEY);
}

export function setNextSrsSyncAt(iso: string | null): void {
  if (typeof window === "undefined") return;
  if (iso) localStorage.setItem(NEXT_SYNC_KEY, iso);
  else localStorage.removeItem(NEXT_SYNC_KEY);
}
