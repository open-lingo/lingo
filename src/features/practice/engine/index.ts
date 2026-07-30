/**
 * Tailored-practice engine — public API.
 *
 * The four practice surfaces build their sessions from `generatePracticeItems`;
 * `learnedContent` is available directly for surfaces that want the raw known-
 * atom pool (e.g. a "review your due words" mode).
 */
export {
  getKnownAtomsByPos,
  getDueOrStruggling,
  getReachedModule,
  getReachedGrammarPointIds,
  type KnownQueryOptions,
} from "./learnedContent";
export { generatePracticeItems, type GenerateOptions } from "./generator";
export { getSentenceTemplates } from "@/features/practice/data/sentenceTemplates";
export type {
  KnownAtom,
  KnownTier,
  LearnerStores,
  PartOfSpeech,
  PracticeBlank,
  PracticeItem,
  PracticeSurface,
  SentenceTemplate,
  TemplateGate,
  TemplateSlot,
} from "./types";
