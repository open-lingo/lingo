/**
 * Tailored-practice engine — public types.
 *
 * The engine turns "what the learner has actually learned" (unlocked vocab +
 * SRS state + reached module/grammar) into modality-agnostic {@link PracticeItem}s
 * that the four practice surfaces (speaking / reading / listening / writing)
 * render. It is LANGUAGE-AGNOSTIC: the core carries no per-language code. Grammar
 * lives in per-language {@link SentenceTemplate} DATA files under
 * `data/sentenceTemplates/<lang>.ts`; the filler drops the learner's known words
 * into those templates.
 */
import type { PartOfSpeech } from "@/shared/language/types";

export type { PartOfSpeech };

/** The four practice surfaces the engine feeds. */
export type PracticeSurface = "speaking" | "reading" | "listening" | "writing";

/**
 * SRS tier of a known atom, derived from its FSRS-6 card state:
 * - `new`      — unlocked but never graded (no card state, or reps 0).
 * - `learning` — graded, still in the learning/relearning phase or short interval.
 * - `reviewing`— graduated to the review phase but not yet mature.
 * - `mastered` — both modalities at/above the mastery interval.
 */
export type KnownTier = "new" | "learning" | "reviewing" | "mastered";

/**
 * One vocabulary item the learner actually knows (has unlocked), enriched with
 * its live SRS signal. Produced by {@link "./learnedContent".getKnownAtomsByPos}.
 */
export interface KnownAtom {
  /** Canonical, language-prefixed atom id (`ja:sushi`, `ko:커피`). */
  id: string;
  /** Target-language display form (kana / hangul / surface). */
  surface: string;
  /** Reading aid — romaji (JA) / Revised Romanization (KO); surface for ES. */
  reading: string;
  /** Short English meaning. */
  meaningEn: string;
  pos: PartOfSpeech;
  tier: KnownTier;
  /** True when the card is due today (either modality). */
  due: boolean;
  /**
   * Reinforcement weight — higher means more valuable to drill now. Due and
   * high-difficulty (struggling) atoms weigh more; mastered atoms weigh less.
   * The filler picks slot fillers weighted by this so practice reinforces the
   * words the learner is weakest on.
   */
  weight: number;
}

/**
 * Injectable learner state, for tests. When a field is omitted the engine reads
 * the real store (`getUnlockedAtomIds()` / `getSRSStore()`).
 */
export interface LearnerStores {
  /** Canonical unlocked atom ids. */
  unlocked?: ReadonlySet<string>;
  /** SRS store: canonical card id → FSRS-6 state. */
  srs?: Record<string, import("@/features/flashcards/data/types").SRSCardState>;
}

/** One typed slot in a {@link SentenceTemplate}. The filler drops a known atom
 *  of the declared part(s) of speech here. */
export interface TemplateSlot {
  /** Placeholder key, referenced as `{key}` in the patterns. */
  key: string;
  /** Allowed part(s) of speech for the filler. */
  pos: PartOfSpeech | PartOfSpeech[];
  /**
   * Reserved, optional authoring hint. The filler ALWAYS applies a universal
   * "clean single token" rule (no whitespace / slashes) so any in-POS filler
   * stays grammatical; `constraint` is a place to narrow further in future.
   */
  constraint?: string;
}

/** Gate that decides whether a template is offered to a learner. */
export interface TemplateGate {
  /** Minimum reached content module (numeric, e.g. 7 for `m7`). */
  minModule?: number;
  /** Grammar-point ids that must be reached (see {@link getReachedGrammarPointIds}). */
  requiresGrammarPointIds?: string[];
}

/**
 * An authored sentence pattern with typed slots. The PATTERN carries the grammar
 * (particles, verb form, word order) as target-language text with `{slotKey}`
 * placeholders; the SLOTS carry vocabulary. A template must stay grammatical
 * with ANY in-POS filler — so slots are nouns/adjectives and the verb/particles
 * live in the fixed pattern text.
 *
 * Simple languages (JA/ES) resolve via string substitution of `pattern`,
 * `readingPattern`, and `translationPattern`. Languages whose grammar TRANSFORMS
 * the filler (KO particle alternation by batchim) provide a {@link render} hook
 * so all per-language logic stays in the per-language data file.
 */
export interface SentenceTemplate {
  id: string;
  /** Target-language pattern with `{slotKey}` placeholders. */
  pattern: string;
  slots: TemplateSlot[];
  /** English gloss pattern with `{slotKey}` placeholders filled by slot meanings. */
  translationPattern: string;
  /**
   * Reading pattern with `{slotKey}` placeholders filled by slot readings.
   * Needed where the fixed pattern text isn't already a reading (JA kana
   * particles → romaji). Falls back to substituting readings into `pattern`.
   */
  readingPattern?: string;
  grammarGate?: TemplateGate;
  /** Restrict to certain surfaces. Omitted = suitable for all. */
  surfaces?: PracticeSurface[];
  /**
   * Optional per-language renderer. When present the engine calls it with the
   * chosen atoms to produce target/reading/translation instead of doing plain
   * `{slot}` substitution. Use for grammar that transforms the filler (e.g. KO
   * subject/object particle alternation). The chosen atom's `surface` MUST still
   * appear verbatim in the returned `target` so the reading-madlibs blank can
   * mask it.
   */
  render?: (filled: Record<string, KnownAtom>) => {
    target: string;
    reading: string;
    translation: string;
  };
}

/** Reading-madlibs cloze metadata: one filled slot is masked as a blank. */
export interface PracticeBlank {
  /** Which template slot is blanked. */
  slotKey: string;
  /** Correct answer — the masked atom's target surface (appears in `target`). */
  answer: string;
  /** Reading of the correct answer. */
  answerReading: string;
  /** Same-POS known words to offer alongside the answer (all words the learner knows). */
  distractors: { surface: string; reading: string; meaningEn: string }[];
}

/**
 * The one modality-agnostic unit every surface renders. The generator produces
 * these from templates (or authored seeds); each surface decides how to present
 * `target` / `reading` / `translation` / `blank` / audio.
 */
export interface PracticeItem {
  id: string;
  languageId: string;
  /** Target-language sentence or word (the answer for writing/speaking). */
  target: string;
  /** Reading aid for `target` (romaji / RR; surface for ES). May be "" for seeds. */
  reading: string;
  /** English translation / gloss. */
  translation: string;
  /**
   * Canonical ids of the atoms this item exercises. A surface may lightly credit
   * SRS for these (via `gradeFromLesson`) after a correct interaction.
   */
  exercisedAtomIds: string[];
  /** Present on reading-madlibs items — the cloze the learner fills. */
  blank?: PracticeBlank;
  /** Text a listening/speaking surface should TTS. Usually === `target`; a
   *  question for response-mode seeds. */
  promptAudioText?: string;
  /** Template id, or seed id, this item came from. */
  sourceTemplateId?: string;
}
