/**
 * Which words in a story deserve the reader's attention.
 *
 * Two sources feed this:
 *  - **Declared glosses** — above-level words the author named. Always
 *    surfaced; they are the point of the gloss budget.
 *  - **Course atoms the learner has not learned** — resolved from live SRS
 *    state, so the same story highlights differently for two learners. A word
 *    with no card, or a card still in `new`, counts as unknown.
 *
 * Everything else renders as ordinary text. Highlighting is an affordance, not
 * a wall of buttons.
 */
import { getCardState } from "@/features/flashcards/engine";
import { getKnownAtomsByPos } from "@/features/practice/engine";
import type { Story } from "@/features/practice/content";

/** Parts of speech worth surfacing. Function words are noise here. */
const WORD_POS = ["noun", "verb", "adjective", "adverb"] as const;

export interface StoryWordInfo {
  surface: string;
  reading?: string;
  meaning: string;
  /** Canonical course atom id, when the word has one. */
  atomId?: string;
  /** `gloss` = authored above-level word; `atom` = course word not yet learned. */
  source: "gloss" | "atom";
  /** True when the learner has no established card for this word. */
  unknown: boolean;
}

export type StoryWordMap = Map<string, StoryWordInfo>;

/** A card counts as "learned" once it has left the `new` state. */
function hasLearned(atomId: string): boolean {
  const state = getCardState(atomId);
  if (!state) return false;
  return state.recognition.state !== "new" || state.production.state !== "new";
}

/**
 * Build the reader's word map for one story. Declared glosses always win over
 * an atom of the same surface — the author's meaning is the one in context.
 */
export function resolveStoryWords(story: Story, langId: string): StoryWordMap {
  const body = story.sentences.map((s) => s.text).join(" ");
  const map: StoryWordMap = new Map();

  for (const atom of getKnownAtomsByPos(langId, [...WORD_POS])) {
    if (atom.surface.length < 2) continue;
    if (!body.includes(atom.surface)) continue;
    if (hasLearned(atom.id)) continue;
    map.set(atom.surface, {
      surface: atom.surface,
      reading: atom.reading,
      meaning: atom.meaningEn,
      atomId: atom.id,
      source: "atom",
      unknown: true,
    });
  }

  for (const gloss of story.glosses ?? []) {
    map.set(gloss.surface, {
      surface: gloss.surface,
      reading: gloss.reading,
      meaning: gloss.meaning,
      atomId: gloss.atomId,
      source: "gloss",
      unknown: true,
    });
  }

  return map;
}
