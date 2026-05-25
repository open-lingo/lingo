import { getAtomsForLesson } from "./lessonAtomIndex";

const STORAGE_KEY = "lingo:unlocked-atoms";

function getUnlockedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
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
  const set = getUnlockedSet();
  let added = 0;
  for (const atom of atoms) {
    if (!set.has(atom.id)) {
      set.add(atom.id);
      added++;
    }
  }
  if (added > 0) saveUnlockedSet(set);
  return added;
}

export function isAtomUnlocked(atomId: string): boolean {
  return getUnlockedSet().has(atomId);
}

export function getUnlockedAtomIds(): Set<string> {
  return getUnlockedSet();
}
