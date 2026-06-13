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

export function unlockLessonAtoms(lessonId: string): number {
  const atoms = getAtomsForLesson(lessonId);
  if (atoms.length === 0) return 0;
  return unlockAtomIds(atoms.map((a) => a.id));
}

/**
 * Unlock atoms by id directly. Used by placement/test-out seeding
 * (2026-06-12): passed modules seed SRS state per `fromModule`, and those
 * same atoms must be unlocked or review lessons will skip them.
 */
export function unlockAtomIds(atomIds: Iterable<string>): number {
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

export function isAtomUnlocked(atomId: string): boolean {
  return getUnlockedSet().has(canonicalize(atomId));
}

export function getUnlockedAtomIds(): Set<string> {
  return getUnlockedSet();
}
