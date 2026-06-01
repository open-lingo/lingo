import type { SRSCardState, SRSModalityState, SRSPhase } from "../data/types";
import { isLegacyFlatFsrsState, migrateFlatToModal } from "./srsMigration";

// Bumped storage namespace for the FSRS-6 migration (2026-05-20). The
// schema changed (stability + difficulty replaced easeFactor) and we
// intentionally discard prior entries rather than mapping them — see
// docs/lesson-editor-research-2026-05-20.md and CLAUDE.md.
//
// On 2026-05-23 we added the recognition/production modality split. The
// storage key is unchanged but the in-memory shape is now nested. Legacy
// flat FSRS-6 entries are upgraded on read; legacy SM-2 entries are still
// dropped.
//
// Phase 2 (2026-06-01) — atom-id namespace migration (ADR-005). Atom ids
// are now `<lang>:<bare>` (e.g. `ja:ai`). The JA module's CourseAtom.id
// is still bare internally, so callers may pass either shape — every
// read/write canonicalizes to the prefixed form. On bulk read, legacy
// bare entries are rewritten in-place so subsequent writes never split
// a card's state across a bare/prefixed twin.
const STORAGE_KEY = "open-lingo-srs:v2";
const LEGACY_STORAGE_KEY = "open-lingo-srs";
const LAST_SYNC_KEY = "open-lingo-srs-last-sync";
const NEXT_SYNC_KEY = "open-lingo-srs-next-sync";

const DEFAULT_LANG_PREFIX = "ja";

/**
 * Canonicalize a bare atom id to its `<lang>:<bare>` form for storage.
 * Already-prefixed ids (containing `:`) pass through unchanged. Default
 * prefix is `ja:` because JA is the only shipped language as of
 * Phase 2; once a second language registers in Phase 3+, callers MUST
 * pass prefixed ids and this default becomes unreachable.
 */
function canonicalize(atomId: string): string {
  if (atomId.includes(":")) return atomId;
  return `${DEFAULT_LANG_PREFIX}:${atomId}`;
}

export type SRSStore = Record<string, SRSCardState>;

const VALID_PHASES: ReadonlySet<SRSPhase> = new Set([
  "new",
  "learning",
  "review",
  "relearning",
]);

function isValidSubState(v: unknown): v is SRSModalityState {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.stability === "number" &&
    typeof obj.difficulty === "number" &&
    typeof obj.state === "string" &&
    VALID_PHASES.has(obj.state as SRSPhase) &&
    typeof obj.interval === "number" &&
    typeof obj.dueDate === "string" &&
    typeof obj.lastReviewDate === "string" &&
    typeof obj.reps === "number" &&
    typeof obj.lapses === "number" &&
    (obj.learningSteps === undefined || typeof obj.learningSteps === "number")
  );
}

/** Type guard: matches the modal FSRS-6 schema. */
function isModalFsrsState(v: unknown): v is SRSCardState {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  return isValidSubState(obj.recognition) && isValidSubState(obj.production);
}

/**
 * Read one stored entry. Accepts already-modal states, upgrades legacy
 * flat FSRS-6 states, and drops everything else (including pre-FSRS-6
 * SM-2 entries — those have no `stability` and fail
 * `isLegacyFlatFsrsState`).
 */
function loadOne(v: unknown): SRSCardState | null {
  if (isModalFsrsState(v)) return v;
  if (isLegacyFlatFsrsState(v)) return migrateFlatToModal(v);
  return null;
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
    // Phase 2 atom-id namespace migration — bare keys (no `:`) are
    // rewritten to `ja:<key>`. Where both shapes already exist for the
    // same atom (rare; only happens if a session wrote to both before
    // this commit landed), prefixed wins.
    let migrated = false;
    for (const [id, state] of Object.entries(parsed)) {
      const loaded = loadOne(state);
      if (!loaded) continue;
      const canonical = canonicalize(id);
      if (canonical !== id) migrated = true;
      // Prefixed wins when both exist.
      if (valid[canonical] && canonical !== id) continue;
      valid[canonical] = loaded;
    }
    if (migrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      } catch {
        // ignore quota errors — next write will re-attempt.
      }
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
  return getSRSStore()[canonicalize(cardId)];
}

export function setCardState(cardId: string, state: SRSCardState): void {
  // Fix H8 — re-read immediately before write so a sibling tab's concurrent
  // setCardState for a *different* cardId isn't clobbered. This collapses
  // the two-tab race for single-card updates; full bulk overwrites (sync
  // merge, reset) still race but those are coordinated server-side.
  const store = getSRSStore();
  store[canonicalize(cardId)] = state;
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
