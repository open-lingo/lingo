/**
 * Reading practice — pure content builders.
 *
 * The reading surface is built entirely from CURATED, authored content
 * (`Story` / `Conversation`), never from the random sentence generator — so a
 * learner only ever reads hand-written sentences that make sense. These helpers
 * turn that authored content into the two reading beats:
 *
 * Story comprehension questions now live in `features/practice/stories/storyQuestions.ts`
 * (target-language questions with swap distractors, not this file).
 *
 *  - **Cloze** — blank ONE content word in an authored sentence and offer the
 *    answer alongside same-part-of-speech words the learner already knows.
 *
 * Everything here is a pure function of its arguments (authored content + the
 * learner's known atoms), so it is trivially unit-testable and carries no React
 * or storage dependency.
 */
import type { Conversation, Story } from "@/features/practice/content";
import type { KnownAtom } from "@/features/practice/engine";

/** Content parts of speech that make good, unambiguous cloze blanks. */
export const CLOZE_POS = ["noun", "verb", "adjective", "adverb"] as const;

/** One authored sentence usable as reading / cloze source. */
export interface SentenceSource {
  /** Stable id for keys + deterministic seeding. */
  id: string;
  text: string;
  translation: string;
  reading?: string;
}

/** A single tap option in a cloze card. */
export interface ClozeOption {
  surface: string;
  reading: string;
  meaningEn?: string;
  isAnswer: boolean;
}

/** A cloze over one authored sentence — one content word masked out. */
export interface ClozeCard {
  id: string;
  /** Full authored sentence (shown, tappable, on reveal). */
  text: string;
  translation: string;
  reading?: string;
  /** Text before / after the masked blank. */
  before: string;
  after: string;
  /** The masked word + the atom it exercises (for conservative SRS credit). */
  answer: { surface: string; reading: string; atomId: string };
  /** Answer + same-POS known distractors, shuffled. */
  options: ClozeOption[];
}

/* --------------------------------------------------------------------------
 * Deterministic PRNG helpers — stable option order per (content, seed) so a
 * card doesn't reshuffle on every re-render, but still varies item-to-item.
 * ------------------------------------------------------------------------ */

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const out = arr.slice();
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Unique, order-preserving. */
function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/* --------------------------------------------------------------------------
 * Sentence collection
 * ------------------------------------------------------------------------ */

/** Flatten stories + conversations into a single authored-sentence pool. */
export function collectSentences(
  stories: Story[],
  conversations: Conversation[],
): SentenceSource[] {
  const out: SentenceSource[] = [];
  for (const story of stories) {
    story.sentences.forEach((s, i) => {
      out.push({ id: `${story.id}:${i}`, text: s.text, translation: s.translation, reading: s.reading });
    });
  }
  for (const convo of conversations) {
    convo.lines.forEach((l, i) => {
      out.push({ id: `${convo.id}:${i}`, text: l.text, translation: l.translation, reading: l.reading });
    });
  }
  return out;
}

/* --------------------------------------------------------------------------
 * Cloze
 * ------------------------------------------------------------------------ */

/** Longest first, so multi-character words win over a shorter substring. */
function byLengthDesc(a: KnownAtom, b: KnownAtom): number {
  return b.surface.length - a.surface.length;
}

/**
 * Build up to `max` cloze cards from authored sentences. For each sentence we
 * find a known CONTENT word that appears verbatim in it, blank it, and offer
 * three same-POS distractors the learner also knows. Sentences with no blankable
 * known word (or no same-POS distractors) are skipped — the base sentence is
 * always hand-written, so the cloze is never nonsense.
 */
export function buildClozeCards(
  sentences: SentenceSource[],
  knownContent: KnownAtom[],
  seed: number,
  max: number,
): ClozeCard[] {
  const content = knownContent.filter((a) => a.surface.length >= 2).slice().sort(byLengthDesc);
  const byPos = new Map<string, KnownAtom[]>();
  for (const atom of knownContent) {
    const list = byPos.get(atom.pos) ?? [];
    list.push(atom);
    byPos.set(atom.pos, list);
  }

  const cards: ClozeCard[] = [];
  const ordered = seededShuffle(sentences, seed);

  for (const sentence of ordered) {
    if (cards.length >= max) break;

    // Longest known content word that appears verbatim in the sentence.
    const answer = content.find((a) => sentence.text.includes(a.surface));
    if (!answer) continue;

    const pool = (byPos.get(answer.pos) ?? []).filter((a) => a.surface !== answer.surface);
    if (pool.length === 0) continue;

    const distractors = seededShuffle(pool, hashSeed(sentence.id)).slice(0, 3);

    const at = sentence.text.indexOf(answer.surface);
    const options = seededShuffle<ClozeOption>(
      [
        { surface: answer.surface, reading: answer.reading, meaningEn: answer.meaningEn, isAnswer: true },
        ...distractors.map((d) => ({
          surface: d.surface,
          reading: d.reading,
          meaningEn: d.meaningEn,
          isAnswer: false,
        })),
      ],
      hashSeed(`${sentence.id}:opts`),
    );

    cards.push({
      id: sentence.id,
      text: sentence.text,
      translation: sentence.translation,
      reading: sentence.reading,
      before: sentence.text.slice(0, at),
      after: sentence.text.slice(at + answer.surface.length),
      answer: { surface: answer.surface, reading: answer.reading, atomId: answer.id },
      options,
    });
  }

  return cards;
}

/**
 * Atom ids a story exercises — known content words that appear in its text.
 * Used for conservative recognition SRS credit on a successful read.
 */
export function storyExercisedAtomIds(story: Story, knownContent: KnownAtom[]): string[] {
  const text = story.sentences.map((s) => s.text).join(" ");
  const ids: string[] = [];
  for (const atom of knownContent) {
    if (atom.surface.length >= 2 && text.includes(atom.surface)) ids.push(atom.id);
  }
  return uniq(ids);
}
