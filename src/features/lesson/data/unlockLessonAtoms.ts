import { getAtomsForLesson } from "./lessonAtomIndex";

const STORAGE_KEY = "lingo:unlocked-atoms";

// Phase 2 (2026-06-01) — atom-id namespace migration (ADR-005). Same
// canonicalization story as srsStorage: bare ids written pre-Phase-2 get
// normalized to `ja:<bare>` on read; subsequent writes use the canonical
// form. JA is the only shipped language today, so `ja:` is the default
// prefix.
const DEFAULT_LANG_PREFIX = "ja";

function canonicalize(atomId: string): string {
  if (atomId.includes(":")) return atomId;
  return `${DEFAULT_LANG_PREFIX}:${atomId}`;
}

function getUnlockedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    const canon = new Set(arr.map(canonicalize));
    // Migrate-on-read: if any element was bare, rewrite the store so we
    // never split bare/prefixed across subsequent writes.
    const someBare = arr.some((a) => !a.includes(":"));
    if (someBare) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...canon]));
      } catch {
        // ignore quota errors.
      }
    }
    return canon;
  } catch {
    return new Set();
  }
}

function saveUnlockedSet(set: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/**
 * Server-backup channel (M1, 2026-06-13). The unlock ladder used to be
 * localStorage-only, so a storage clear / device switch lost progression.
 * On every local unlock we dispatch the NEWLY-added ids; `useUnlockMapSync`
 * listens and fire-and-forget pushes them to `POST /progress/me/unlocks`
 * (server unions, never drops). Kept as a window event — same decoupling as
 * `lingo:vocab-graduated` — so this sync utility stays React-free.
 */
export const ATOMS_UNLOCKED_EVENT = "lingo:atoms-unlocked";

export interface AtomsUnlockedDetail {
  atomIds: string[];
}

function notifyAtomsUnlocked(atomIds: string[]): void {
  if (typeof window === "undefined") return;
  if (atomIds.length === 0) return;
  const detail: AtomsUnlockedDetail = { atomIds };
  window.dispatchEvent(new CustomEvent(ATOMS_UNLOCKED_EVENT, { detail }));
}

/**
 * Merge a server-provided set into the local store WITHOUT dispatching a
 * push event (these ids already live on the server). Used by the hydrate
 * union path. Returns the count of ids that were new locally.
 */
export function mergeServerUnlockedAtomIds(atomIds: Iterable<string>): number {
  const set = getUnlockedSet();
  let added = 0;
  for (const atomId of atomIds) {
    const id = canonicalize(atomId);
    if (!set.has(id)) {
      set.add(id);
      added++;
    }
  }
  if (added > 0) saveUnlockedSet(set);
  return added;
}

export function unlockLessonAtoms(lessonId: string): number {
  const atoms = getAtomsForLesson(lessonId);
  if (atoms.length === 0) return 0;
  return unlockAtomIds(atoms.map((a) => a.id));
}

/**
 * Dev-panel simulation path: unlock the atoms of the given lessons locally
 * WITHOUT the `ATOMS_UNLOCKED_EVENT` server-push (simulated unlocks must not
 * pollute the account's server backup). Everything atom-derived — course
 * deck, grammar review queue, reached modules — follows real completion the
 * same way it would for a genuine learner. Returns newly-unlocked count.
 */
export function devUnlockAtomsForLessons(lessonIds: Iterable<string>): number {
  const ids: string[] = [];
  for (const lessonId of lessonIds) {
    for (const atom of getAtomsForLesson(lessonId)) ids.push(atom.id);
  }
  return mergeServerUnlockedAtomIds(ids);
}

/**
 * Unlock atoms by id directly. Used by placement/test-out seeding
 * (2026-06-12): passed modules seed SRS state per `fromModule`, and those
 * same atoms must be unlocked or review lessons will skip them.
 */
export function unlockAtomIds(atomIds: Iterable<string>): number {
  const set = getUnlockedSet();
  const newlyAdded: string[] = [];
  for (const atomId of atomIds) {
    const id = canonicalize(atomId);
    if (!set.has(id)) {
      set.add(id);
      newlyAdded.push(id);
    }
  }
  if (newlyAdded.length > 0) {
    saveUnlockedSet(set);
    // Fire-and-forget server backup of just the new ids.
    notifyAtomsUnlocked(newlyAdded);
  }
  return newlyAdded.length;
}

export function isAtomUnlocked(atomId: string): boolean {
  return getUnlockedSet().has(canonicalize(atomId));
}

export function getUnlockedAtomIds(): Set<string> {
  return getUnlockedSet();
}
