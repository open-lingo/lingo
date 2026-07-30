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
 * data files (`ja.ts`, `ko.ts`) and is surfaced through the module-gated
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

/**
 * A short (4-8 sentence) coherent narrative gated to a module. Uses ONLY
 * vocab/grammar available at `module`. Consumed by the reading surface
 * (read + inline lookup + comprehension questions).
 */
export interface Story {
  /** Stable id, e.g. "ko-m5-cafe-morning". Never renumbered once shipped. */
  id: string;
  /** Owning language, e.g. "ja" | "ko". */
  languageId: string;
  /** Unlock module (1-indexed, matches curriculum `mN`). Gated `<=` reached. */
  module: number;
  /** Short display title. */
  title: string;
  /** One-line theme / setup shown before the read. */
  theme: string;
  /** Ordered sentences. */
  sentences: StorySentence[];
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
