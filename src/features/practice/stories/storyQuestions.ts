/**
 * Story comprehension questions.
 *
 * The old generator asked its questions in ENGLISH — pick the story's own
 * theme string among other stories' themes, pick the story's own translations
 * among other stories' translations. Both were answerable without reading a
 * single character of the target language, and the distractors came from
 * unrelated stories, so they were eliminable on topic alone.
 *
 * This replaces it with two question types that require having read the text:
 *
 *  - **Gist** — authored per story, in the target language, with deliberate
 *    distractors. Not generated: only the author knows what the story is about.
 *  - **Detail** — generated as SWAP DISTRACTORS. Take a true sentence from the
 *    story and substitute one content word with a same-part-of-speech word the
 *    learner also knows. The result is a near-miss: same shape, same register,
 *    one fact different. The only way to reject it is to have read the story.
 */
import type { Story, StoryQuestion } from "@/features/practice/content";
import type { KnownAtom } from "@/features/practice/engine";
import { hashSeed, seededShuffle } from "@/features/practice/reading/readingBuilders";

const MAX_DETAIL = 3;
const MAX_TOTAL = 4;
const OPTIONS_PER_QUESTION = 4;

/** Content words worth swapping. Function words make unfair distractors. */
const SWAP_POS = new Set(["noun", "verb", "adjective", "adverb"]);

/** Detail prompt per language — "Which of these is in the story?" */
const DETAIL_PROMPT: Record<string, string> = {
  ja: "どれが はなしに ありますか？",
  ko: "어느 것이 이야기에 있어요?",
};

interface Swap {
  /** The story sentence used as the correct answer. */
  answer: string;
  /** Near-miss variants, each one word different from `answer`. */
  distractors: string[];
}

/**
 * Build near-miss variants of one sentence by swapping a single content word
 * for same-POS words the learner knows. Returns `null` when the sentence has
 * no swappable word or there are too few same-POS alternatives.
 */
function buildSwap(
  sentence: string,
  known: KnownAtom[],
  ownSentences: Set<string>,
  seed: number,
  wanted: number,
): Swap | null {
  const present = known
    .filter((a) => SWAP_POS.has(a.pos) && a.surface.length >= 2 && sentence.includes(a.surface))
    .sort((a, b) => b.surface.length - a.surface.length);

  for (const target of present) {
    const pool = known.filter(
      (a) => a.pos === target.pos && a.surface !== target.surface && a.surface.length >= 2,
    );
    if (pool.length < wanted) continue;

    // Draw from a larger candidate window than `wanted` so we have room to
    // drop picks whose swap collides with a real story sentence.
    const candidates = seededShuffle(pool, seed);
    const distractors: string[] = [];
    const seen = new Set<string>();
    for (const p of candidates) {
      if (distractors.length >= wanted) break;
      const swapped = sentence.replace(target.surface, p.surface);
      if (swapped === sentence || ownSentences.has(swapped) || seen.has(swapped)) continue;
      seen.add(swapped);
      distractors.push(swapped);
    }
    if (distractors.length < wanted) continue;

    return { answer: sentence, distractors };
  }
  return null;
}

/**
 * Authored gist questions first, then generated detail questions. Deterministic
 * for a given `seed` so options don't reshuffle on re-render.
 */
export function buildQuestions(
  story: Story,
  knownContent: KnownAtom[],
  seed: number,
): StoryQuestion[] {
  const authored = story.questions.filter((q) => q.kind === "gist");
  const out: StoryQuestion[] = authored.map((q) => ({
    ...q,
    options: seededShuffle(q.options, hashSeed(`${story.id}:${q.id}`)),
  }));

  const ownSentences = new Set(story.sentences.map((s) => s.text));
  const sentences = seededShuffle([...ownSentences], seed);

  const prompt = DETAIL_PROMPT[story.languageId] ?? DETAIL_PROMPT.ja;

  for (const sentence of sentences) {
    if (out.length >= MAX_TOTAL) break;
    if (out.filter((q) => q.kind === "detail").length >= MAX_DETAIL) break;

    const swap = buildSwap(
      sentence,
      knownContent,
      ownSentences,
      hashSeed(`${story.id}:${sentence}`),
      OPTIONS_PER_QUESTION - 1,
    );
    if (!swap) continue;

    out.push({
      id: `${story.id}:detail:${out.length}`,
      kind: "detail",
      prompt,
      options: seededShuffle(
        [swap.answer, ...swap.distractors],
        hashSeed(`${story.id}:${sentence}:opts`),
      ),
      answer: swap.answer,
    });
  }

  return out.slice(0, MAX_TOTAL);
}
