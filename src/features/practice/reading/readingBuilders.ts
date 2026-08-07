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
 *    answer alongside SAME-CATEGORY words the learner already knows, so the
 *    sentence has to be read rather than solved by elimination.
 *
 * Everything here is a pure function of its arguments (authored content + the
 * learner's known atoms), so it is trivially unit-testable and carries no React
 * or storage dependency.
 */
import type { Conversation, Story } from "@/features/practice/content";
import type { KnownAtom } from "@/features/practice/engine";
import { getSiblingSurfaces } from "@/features/languages/siblingResolver";

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
  /** Answer + {@link CLOZE_DISTRACTORS} competitive distractors, shuffled. */
  options: ClozeOption[];
}

/* --------------------------------------------------------------------------
 * Deterministic PRNG helpers — stable option order per (content, seed) so a
 * card doesn't reshuffle on every re-render, but still varies item-to-item.
 *
 * Everything downstream mixes the SESSION seed into its per-card seed. Seeding
 * off the sentence id alone froze both the distractor draw and the answer's
 * screen slot forever, so a returning learner could answer a familiar sentence
 * from position memory without reading it. Mixing the session seed in keeps the
 * order stable WITHIN an attempt (the builder is memoised on the seed) while
 * reshuffling across sessions — and the builder stays a pure function of its
 * arguments, so no `Math.random()` may appear below this line.
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
 * Wrong options offered alongside the answer — so three options on screen, down
 * from four.
 *
 * Rodriguez (2005), 27 studies / 2,406 items: going 4 → 3 options is a small
 * GAIN in both discrimination (+.031) and reliability (+.019), because the
 * fourth slot is where implausible distractors end up. The slot is better spent
 * on making the remaining two genuinely competitive.
 */
export const CLOZE_DISTRACTORS = 2;

/** Length of the shared leading run of two strings. */
function commonPrefixLength(a: string, b: string): number {
  const limit = Math.min(a.length, b.length);
  let i = 0;
  while (i < limit && a[i] === b[i]) i++;
  return i;
}

/**
 * True when `candidate` is a mere inflection of `answer` rather than a different
 * word — たべる / たべた, いく / いかない. Offering one against the other tests
 * conjugation, not the vocabulary the blank is about, and is frequently ALSO a
 * defensible reading of the sentence.
 */
function isInflectionOf(candidate: string, answer: string): boolean {
  if (candidate === answer) return true;
  if (candidate.startsWith(answer) || answer.startsWith(candidate)) return true;
  const shared = commonPrefixLength(candidate, answer);
  return shared >= 2 && shared >= Math.min(candidate.length, answer.length) - 1;
}

/**
 * Competitive distractors for a blanked word: same-category siblings the learner
 * already knows, minus anything that could ALSO be a correct answer.
 *
 * Rejected candidates, in order of why they'd poison the item:
 *  - **already in the stem.** If the word appears elsewhere in the sentence the
 *    learner can rule it out on repetition alone — and it may genuinely fit.
 *  - **an inflection of the answer** (see {@link isInflectionOf}).
 *  - **a different part of speech**, which would make the sentence ungrammatical
 *    and therefore eliminable without reading it.
 *
 * Returns fewer than {@link CLOZE_DISTRACTORS} when the language/word has no
 * usable siblings. Callers MUST skip the sentence rather than top up with random
 * words — fewer, better items (see `siblingResolver.ts`).
 */
function competitiveDistractors(
  languageId: string,
  answer: KnownAtom,
  sentenceText: string,
  bySurface: Map<string, KnownAtom>,
  seed: number,
): KnownAtom[] {
  const out: KnownAtom[] = [];
  for (const surface of getSiblingSurfaces(languageId, answer.surface)) {
    const atom = bySurface.get(surface);
    if (!atom) continue; // sibling the learner hasn't been taught yet
    if (atom.pos !== answer.pos) continue;
    if (sentenceText.includes(surface)) continue;
    if (isInflectionOf(surface, answer.surface)) continue;
    out.push(atom);
  }
  return seededShuffle(out, seed);
}

/**
 * Build up to `max` cloze cards from authored sentences. For each sentence we
 * find a known CONTENT word that appears verbatim in it, blank it, and offer it
 * against {@link CLOZE_DISTRACTORS} same-category words the learner also knows.
 *
 * Sentences that can't produce a full set of COMPETITIVE distractors are
 * skipped, not padded with random same-POS words: a distractor the learner can
 * eliminate without reading the stem makes the item worthless (Little & Bjork
 * 2015 measured it as indistinguishable from never showing the item). Since only
 * JA ships sibling sets today, other languages currently yield no cloze cards at
 * all — deliberate, and visible, rather than silently inert practice.
 */
export function buildClozeCards(
  sentences: SentenceSource[],
  knownContent: KnownAtom[],
  seed: number,
  max: number,
  languageId: string,
): ClozeCard[] {
  const content = knownContent.filter((a) => a.surface.length >= 2).slice().sort(byLengthDesc);
  const bySurface = new Map<string, KnownAtom>();
  for (const atom of knownContent) {
    if (!bySurface.has(atom.surface)) bySurface.set(atom.surface, atom);
  }

  const cards: ClozeCard[] = [];
  const ordered = seededShuffle(sentences, seed);

  for (const sentence of ordered) {
    if (cards.length >= max) break;

    // Longest known content word that appears verbatim in the sentence AND can
    // be offered against competitive alternatives. Longest-first is the old
    // preference kept as a tie-break; a blank we can't make competitive is worse
    // than a shorter one we can, so we walk on rather than stopping at the first.
    let answer: KnownAtom | undefined;
    let distractors: KnownAtom[] = [];
    for (const candidate of content) {
      if (!sentence.text.includes(candidate.surface)) continue;
      const options = competitiveDistractors(
        languageId,
        candidate,
        sentence.text,
        bySurface,
        hashSeed(`${sentence.id}:${seed}:pool`),
      );
      if (options.length < CLOZE_DISTRACTORS) continue;
      answer = candidate;
      distractors = options.slice(0, CLOZE_DISTRACTORS);
      break;
    }
    if (!answer) continue;

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
      hashSeed(`${sentence.id}:${seed}:opts`),
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
