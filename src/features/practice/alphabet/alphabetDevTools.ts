import { getAlphabetById } from "@/shared/domain/languageConfig";
import { clearAlphabetProgress, getOrCreateProgress, setAlphabetProgress } from "./alphabetProgress";

/**
 * Dev helpers for seeding alphabet progress while user testing.
 * These are not wired to the UI in production flows; they are exposed
 * so you can call them from the console or from dev-only buttons.
 */

export function seedAlphabetFresh(languageId: string, alphabetId: string): void {
  clearAlphabetProgress(languageId, alphabetId);
  getOrCreateProgress(languageId, alphabetId);
}

export function seedAlphabetMastered(languageId: string, alphabetId: string): void {
  const alphabet = getAlphabetById(languageId, alphabetId);
  if (!alphabet) return;

  const characters =
    alphabet.characters?.length
      ? alphabet.characters
      : (alphabet.sections ?? []).flatMap((s) => s.characters);

  const progress = getOrCreateProgress(languageId, alphabetId);
  const letters: typeof progress.letters = {};

  for (const ch of characters) {
    letters[ch] = {
      introduced: true,
      traceCount: 2,
      recognitionPassed: true,
      productionPassed: true,
      symbolToSoundPassed: true,
    };
  }

  setAlphabetProgress({
    ...progress,
    letters,
  });
}

