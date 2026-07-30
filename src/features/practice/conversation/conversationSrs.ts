/**
 * Production SRS credit for interactive-roleplay learner lines.
 *
 * When the learner successfully produces their line, the atoms that line
 * exercises get a conservative nudge on the PRODUCTION modality — the same
 * `gradeFromLesson` path lessons + the writing surface use (correct → Good,
 * retried → Hard). Only a success ever writes; a miss never demotes, honoring
 * the "only review cards count, and only upward from a clean/retried win"
 * invariant. Exercised atoms are recovered from the line text via the shared
 * lexical segmenter (the line data carries no per-word tagging).
 */
import {
  createInitialState,
  getCardState,
  gradeFromLesson,
  setCardState,
} from "@/features/flashcards/engine";
import { segmentLine } from "./conversationLexicon";

/** Course-atom ids a line exercises (distinct, in order of appearance). */
export function lineAtomIds(text: string, lang: string): string[] {
  return segmentLine(text, lang).atomIds;
}

/**
 * Credit the production modality of every atom `text` exercises. `retried`
 * maps a clean first-try to Good and a recovered miss to Hard.
 */
export function creditProductionForLine(
  text: string,
  lang: string,
  retried: boolean,
): void {
  for (const atomId of lineAtomIds(text, lang)) {
    const state = getCardState(atomId) ?? createInitialState();
    setCardState(
      atomId,
      gradeFromLesson(state, "production", { correct: true, retried }),
    );
  }
}
