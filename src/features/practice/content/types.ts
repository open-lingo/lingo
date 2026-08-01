/**
 * Curated content data layer — types.
 *
 * Authored, module-gated narratives (`Story`) and dialogues (`Conversation`)
 * for the comprehension surfaces (reading / listening / conversation). The
 * whole point of curated content is comprehensibility: every content word
 * decomposes into course atoms the learner has already met at the item's
 * `module` (enforced by `gate.ts` + `content.gate.test.ts`). This is what
 * keeps curated content from regressing into the old "static list of
 * sentences the learner can't yet read" problem.
 *
 * Structure is LANGUAGE-AGNOSTIC; the actual content lives in per-language
 * directories (`ja/`, `ko/`) and is surfaced through the module-gated
 * registry in `index.ts`.
 */

/** One line of a narrative — target text + gloss + optional reading aid. */
export interface StorySentence {
  /** Target-language text (kana/hangul/…), in the native script. */
  text: string;
  /** Natural English translation. */
  translation: string;
  /** Romanization reading aid (JA romaji / KO Revised Romanization). */
  reading?: string;
}

/** Story difficulty, independent of the module that unlocks it. */
export type StoryLevel = 1 | 2 | 3 | 4 | 5;

/**
 * An above-level word the story is allowed to use. Declaring it is what lets
 * the comprehensibility gate pass — the word is taught in place rather than
 * being an accidental unknown.
 */
export interface StoryGloss {
  /** Surface exactly as it appears in the story text. */
  surface: string;
  /** Reading aid, derived at first access like sentence readings. */
  reading?: string;
  /** Short English meaning shown when the learner taps the word. */
  meaning: string;
  /**
   * Set when the word IS a course atom the learner meets at a later module, so
   * "Add to my words" seeds the canonical card. Omitted for story-only culture
   * words (추석, 花見) that have no atom anywhere in the course.
   */
  atomId?: string;
}

/** A comprehension question. Prompts and options are in the TARGET language. */
export interface StoryQuestion {
  id: string;
  kind: "gist" | "detail";
  prompt: string;
  options: string[];
  /** Must be one of `options`. */
  answer: string;
}

/**
 * A coherent narrative gated to a module. Uses only vocab/grammar available at
 * `module`, plus the above-level words it declares in `glosses`. Length and
 * gloss budget are set by `level` (see `levels.ts`), enforced by
 * `content.test.ts`. Consumed by the story reader.
 */
export interface Story {
  /** Stable id, e.g. "ko-m5-cafe-morning". Never renumbered once shipped. */
  id: string;
  /** Owning language, e.g. "ja" | "ko". */
  languageId: string;
  /** UNLOCK module (1-indexed, matches curriculum `mN`). Gated `<=` reached. */
  module: number;
  /** DIFFICULTY, independent of `module`. Drives length + gloss budget. */
  level: StoryLevel;
  /** Short display title. */
  title: string;
  /** One-line theme / setup shown before the read. */
  theme: string;
  /** Browse filters: "festival" | "food" | "work" | "travel" | "school" | … */
  tags?: string[];
  /** Declared above-level words. Count is bounded by the level's budget. */
  glosses?: StoryGloss[];
  /** Ordered sentences. Count is bounded by the level's band. */
  sentences: StorySentence[];
  /**
   * Authored comprehension questions. At least one `gist` once the content
   * backfill (Task 14) lands; optional until then so the schema change and the
   * content pass can ship separately.
   */
  questions?: StoryQuestion[];
}

/** A speaker in a conversation. */
export interface ConversationSpeaker {
  /** Line-local id referenced by `ConversationLine.speaker` (e.g. "A"|"B"). */
  id: string;
  /** Human label shown on the speaker chip (e.g. "You", "Staff", "친구"). */
  label: string;
  /**
   * Optional voice tag for multi-voice TTS. When absent the player uses the
   * language default voice. (JA: `ja-keita`; KO: `ko-injoon` once shipped.)
   */
  voice?: string;
}

/** One line of a conversation, attributed to a declared speaker. */
export interface ConversationLine {
  /** `ConversationSpeaker.id` of the speaker. */
  speaker: string;
  /** Target-language line, in the native script. */
  text: string;
  /** Natural English translation. */
  translation: string;
  /** Romanization reading aid (JA romaji / KO Revised Romanization). */
  reading?: string;
}

/**
 * A short scripted dialogue gated to a module. Powers both the conversation
 * *listener* (comprehension) and the interactive *roleplay* trainer, where
 * `learnerRole` marks which side the learner produces.
 */
export interface Conversation {
  /** Stable id, e.g. "ko-m5-cafe". Never renumbered once shipped. */
  id: string;
  /** Owning language. */
  languageId: string;
  /** Unlock module (1-indexed). Gated `<=` reached. */
  module: number;
  /** Short display title, e.g. "At a cafe". */
  title: string;
  /** One-line setup shown before play. */
  situation: string;
  /** Declared speakers. Every line's `speaker` must be one of these ids. */
  speakers: ConversationSpeaker[];
  /** Ordered, linear (no branching). */
  lines: ConversationLine[];
  /**
   * Which side the learner plays in interactive mode. Must be one of
   * `speakers[].id`. Absent → listener-only content.
   */
  learnerRole?: string;
}
