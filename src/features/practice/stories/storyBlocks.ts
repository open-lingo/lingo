/**
 * Story layout model — turns a flat sentence list into prose blocks.
 *
 * A story is authored as an ordered array of sentences, and the reader used to
 * render exactly that: one row per sentence. A 31-sentence story therefore
 * read as a 31-item list even when the writing was continuous prose, and the
 * ~229 lines of quoted dialogue across the corpus looked identical to the
 * narration around them.
 *
 * Grouping fixes both. Consecutive narration collapses into one paragraph;
 * a run of speech by the same character breaks out as its own block so the
 * reader can inset it like a novel. A change of speaker starts a new block,
 * which is what makes an exchange read as an exchange.
 *
 * `index` is carried through on every item because the reader still addresses
 * sentences by their ORIGINAL position — the "play all" highlight, the
 * per-sentence audio button and the SRS credit all key on it.
 */
import type { StorySentence } from "@/features/practice/content";

/** One sentence plus its index in the story's original `sentences` array. */
export interface StoryBlockItem {
  sentence: StorySentence;
  index: number;
}

/**
 * A run of consecutive sentences that render together. `speaker` is present
 * exactly when the run is dialogue — narration blocks have none.
 */
export type StoryBlock =
  | { kind: "narration"; items: StoryBlockItem[] }
  | { kind: "speech"; speaker: string; items: StoryBlockItem[] };

/**
 * Group a story's sentences into narration paragraphs and speech blocks.
 * Order is preserved exactly; no sentence is dropped or duplicated.
 */
export function groupStoryBlocks(sentences: readonly StorySentence[]): StoryBlock[] {
  const blocks: StoryBlock[] = [];

  for (let index = 0; index < sentences.length; index++) {
    const sentence = sentences[index];
    const item: StoryBlockItem = { sentence, index };
    const speaker = sentence.speaker;
    const last = blocks[blocks.length - 1];

    // Extend the open block when this sentence belongs to it: narration after
    // narration, or speech that continues the SAME speaker's turn.
    if (
      last &&
      ((!speaker && last.kind === "narration") ||
        (speaker && last.kind === "speech" && last.speaker === speaker))
    ) {
      last.items.push(item);
      continue;
    }

    blocks.push(
      speaker
        ? { kind: "speech", speaker, items: [item] }
        : { kind: "narration", items: [item] },
    );
  }

  return blocks;
}

/** Does this story contain any authored dialogue at all? */
export function hasDialogue(sentences: readonly StorySentence[]): boolean {
  return sentences.some((s) => Boolean(s.speaker));
}
