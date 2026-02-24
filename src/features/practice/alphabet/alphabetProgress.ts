/**
 * Per-letter and per-section progress for the alphabet learner.
 * Stored in localStorage; keyed by languageId + alphabetId.
 */

export type LetterProgress = {
  /** User has seen the intro step for this letter */
  introduced: boolean;
  /** Number of correct trace attempts (need ≥ minCorrectAttempts to pass, typically 2) */
  traceCount: number;
  /** Passed sound → symbol recognition (choose from options) */
  recognitionPassed: boolean;
  /** Passed sound → symbol production (write from memory) */
  productionPassed: boolean;
  /** Optional: passed symbol → sound (select/type sound for symbol) */
  symbolToSoundPassed?: boolean;
};

export type AlphabetProgress = {
  languageId: string;
  alphabetId: string;
  /** Per-character progress. Key = character (e.g. "あ") */
  letters: Record<string, LetterProgress>;
  /** Section test-out: sectionId → true if user passed test-out for that section */
  sectionTests: Record<string, boolean>;
  /** True if user passed full-alphabet test-out */
  fullTestPassed?: boolean;
  /** Last time progress was updated (ISO string) */
  updatedAt: string;
};

const STORAGE_KEY_PREFIX = "lingo_alphabet_progress_";

function storageKey(languageId: string, alphabetId: string): string {
  return `${STORAGE_KEY_PREFIX}${languageId}_${alphabetId}`;
}

/** Remove all alphabet progress from localStorage (so you can retry the alphabet learner from scratch). */
export function clearAllAlphabetProgress(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) keys.push(key);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export function getAlphabetProgress(
  languageId: string,
  alphabetId: string
): AlphabetProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(languageId, alphabetId));
    if (!raw) return null;
    return JSON.parse(raw) as AlphabetProgress;
  } catch {
    return null;
  }
}

export function setAlphabetProgress(progress: AlphabetProgress): void {
  progress.updatedAt = new Date().toISOString();
  localStorage.setItem(
    storageKey(progress.languageId, progress.alphabetId),
    JSON.stringify(progress)
  );
}

export function getOrCreateProgress(
  languageId: string,
  alphabetId: string
): AlphabetProgress {
  const existing = getAlphabetProgress(languageId, alphabetId);
  if (existing) return existing;
  const created: AlphabetProgress = {
    languageId,
    alphabetId,
    letters: {},
    sectionTests: {},
    updatedAt: new Date().toISOString(),
  };
  setAlphabetProgress(created);
  return created;
}

export function getLetterProgress(
  progress: AlphabetProgress,
  character: string
): LetterProgress {
  return (
    progress.letters[character] ?? {
      introduced: false,
      traceCount: 0,
      recognitionPassed: false,
      productionPassed: false,
    }
  );
}

export function updateLetterProgress(
  progress: AlphabetProgress,
  character: string,
  patch: Partial<LetterProgress>
): void {
  const current = getLetterProgress(progress, character);
  progress.letters[character] = { ...current, ...patch };
  setAlphabetProgress(progress);
}

export function markSectionTestPassed(
  progress: AlphabetProgress,
  sectionId: string
): void {
  progress.sectionTests[sectionId] = true;
  setAlphabetProgress(progress);
}

export function markFullTestPassed(progress: AlphabetProgress): void {
  progress.fullTestPassed = true;
  setAlphabetProgress(progress);
}

/** Minimum correct trace attempts before moving on from trace step */
export const MIN_CORRECT_TRACES = 2;

/** Consider a letter "mastered" when these are true (for session ordering / test-out eligibility) */
export function isLetterMastered(
  letterProgress: LetterProgress,
  minTraces: number = MIN_CORRECT_TRACES
): boolean {
  return (
    letterProgress.introduced &&
    letterProgress.traceCount >= minTraces &&
    letterProgress.recognitionPassed &&
    letterProgress.productionPassed
  );
}
