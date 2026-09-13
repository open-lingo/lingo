import type { LessonContent } from "../types";
import type { GetLessonContentOptions } from "./mockLessons";

/**
 * Holder for the sentence miner's synchronous lesson reader. Its own module
 * (rather than a `let` inside minedSentences.ts) because the eager
 * bootstrap that installs the reader is imported — and therefore evaluated
 * — BEFORE minedSentences' own top-level code runs; a `let` there is still
 * in its temporal dead zone at that moment.
 */
export type MinedLessonReader = (
  id: string,
  options?: GetLessonContentOptions,
) => LessonContent | null;

let reader: MinedLessonReader | null = null;

/** Installed by minedSentences.eager.ts (tests, emitter); absent in the app. */
export function setMinedLessonReader(fn: MinedLessonReader): void {
  reader = fn;
}

export function getMinedLessonReader(): MinedLessonReader | null {
  return reader;
}
