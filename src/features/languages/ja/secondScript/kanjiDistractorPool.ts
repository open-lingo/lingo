import { JA_COURSE_ATOMS } from "../courseAtoms";
import { seededShuffle } from "@/shared/utils/seededShuffle";

/**
 * Shape-matched kanji distractors for the switchover cloze (B061).
 *
 * Spencer, 2026-07-29, overruling the earlier constraint that distractors had to
 * be already-taught kanji:
 *
 *   "we can just use the cloze and then use kanji they dont even know, they are
 *    still getting good distractors if we can get two symbol words"
 *
 * That is the right call and it removes a real scheduling problem. Under the old
 * rule the distractor pool was words whose kanji unlocked in an EARLIER module —
 * measured at **0 at m8**, 13 at m9, 34 at m14. m8's only options were its own 13
 * glyphs, all numbers (一 二 三 … 十), so an m8 cloze would have been a
 * number-discrimination drill wearing a switchover costume. Drawing from real
 * words regardless of whether their glyphs are taught makes the step viable from
 * the first switchover onward.
 *
 * **Pool** (measured 2026-07-29): every `kind: "vocab"` course atom carrying a
 * `kanji` surface — 555 of them, of which 166 are two-glyph pure-kanji words (96
 * containing at least one untaught glyph) and 138 are one-glyph (61 untaught).
 * These are REAL words with correct readings and glosses that the course registry
 * already tracks, which matters: invented glyph pairs would be non-words, and a
 * sharp learner spots a non-word without reading it.
 *
 * **What this actually tests, stated honestly.** Unknown-kanji distractors make
 * the step EASIER, not harder: the learner succeeds by recognising the one word
 * they know rather than by discriminating between candidates they can all read.
 * That is still exactly the switchover skill — "do you recognise this word's
 * written form" — but it is recognition against noise, not a reading test. Worth
 * being clear about so the step is not credited with more than it does.
 */

const HAN = /\p{Script=Han}/u;

export type PoolWord = {
  /** Pure kanji surface, e.g. 病院. */
  surface: string;
  kana: string;
  gloss: string;
  /** Number of Han glyphs. */
  glyphs: string[];
};

let cached: PoolWord[] | null = null;

/** Every course-registry word with a pure-kanji surface, built once. */
export function getKanjiWordPool(): PoolWord[] {
  if (cached) return cached;
  const seen = new Set<string>();
  const out: PoolWord[] = [];
  for (const atom of JA_COURSE_ATOMS) {
    if (atom.kind !== "vocab" || !atom.kanji) continue;
    // `kanji` can hold several space/slash-separated forms; take the first with
    // Han in it, matching `dictionaryKanjiSurface` in applyKanjiSurfaces.
    const surface = atom.kanji.split(/[\s/]+/).find((t) => HAN.test(t));
    if (!surface || seen.has(surface)) continue;
    const chars = [...surface];
    const glyphs = chars.filter((c) => HAN.test(c));
    // Pure kanji only: mixing 食べる into a bank of 病院/銀行 makes the
    // okurigana itself the giveaway, so shape-matching means glyphs AND no kana.
    if (glyphs.length === 0 || glyphs.length !== chars.length) continue;
    seen.add(surface);
    out.push({ surface, kana: atom.kana, gloss: atom.meaningEn, glyphs });
  }
  cached = out;
  return out;
}

export type DistractorOptions = {
  /**
   * When true, prefer distractors that SHARE a glyph with the answer (明日 vs
   * 毎日). That removes the shortcut of spotting one known glyph and forces the
   * whole word to be read — a genuinely harder step.
   *
   * Default false: right after the reveal, letting the learner cash in the glyph
   * they were just taught is the fair version. This is a real pedagogical fork,
   * not a tuning knob, which is why both are reachable.
   */
  shareGlyph?: boolean;
};

/**
 * `count` wrong tiles for `answer`, shape-matched and deterministic for `seed`.
 *
 * Excludes, in order of importance:
 *  - the answer itself — the switched word's kanji is ONLY ever the correct tile,
 *    since offering it as wrong would teach that a known word's written form is
 *    incorrect. (That constraint survives Spencer's relaxation; it is about a
 *    different failure.)
 *  - anything sharing the answer's reading (homophones would make two tiles
 *    defensibly correct against an English cue).
 *  - by default, anything sharing a glyph with the answer — see `shareGlyph`.
 */
/**
 * Whether `shareGlyph` mode can actually be satisfied for this answer.
 *
 * It often cannot, and that is a property of the word rather than a bug: hard
 * mode needs another shape-matched real word sharing one of the answer's glyphs.
 * 明日 has plenty (今日, 毎日, 昨日 — 日 is enormously productive); 友達 has none,
 * because no other two-glyph word in the pool uses 友 or 達, and single-glyph
 * answers like 猫 can never have one. Callers should ask before offering the
 * option, instead of asking for it and quietly getting the easy bank.
 */
export function hasShareGlyphOption(answer: string, answerKana: string): boolean {
  const answerGlyphs = new Set([...answer].filter((c) => HAN.test(c)));
  return getKanjiWordPool().some(
    (w) =>
      w.glyphs.length === answerGlyphs.size &&
      w.surface !== answer &&
      w.kana !== answerKana &&
      w.glyphs.some((g) => answerGlyphs.has(g)),
  );
}

export function buildKanjiDistractors(
  answer: string,
  answerKana: string,
  count: number,
  seed: string,
  opts: DistractorOptions & {
    /**
     * The answer's own English gloss. Any pool word with the same gloss is
     * dropped: the cloze is answered against an English cue, so a synonym tile
     * would be defensibly correct and the step would mark a right answer wrong.
     *
     * Exact normalised match only — this catches 友達/友人-style duplicates in the
     * registry but NOT near-synonyms ("house" vs "home"), which would need a real
     * semantic check. Flagged rather than silently assumed complete.
     */
    excludeGloss?: string;
  } = {},
): string[] {
  const norm = (g: string) => g.trim().toLowerCase().replace(/\s+/g, " ");
  const banned = opts.excludeGloss ? norm(opts.excludeGloss) : null;
  const answerGlyphs = new Set([...answer].filter((c) => HAN.test(c)));
  const n = answerGlyphs.size;

  const shaped = getKanjiWordPool().filter(
    (w) =>
      w.glyphs.length === n &&
      w.surface !== answer &&
      w.kana !== answerKana &&
      (banned === null || norm(w.gloss) !== banned),
  );

  const overlaps = (w: PoolWord) => w.glyphs.some((g) => answerGlyphs.has(g));
  const preferred = opts.shareGlyph
    ? shaped.filter(overlaps)
    : shaped.filter((w) => !overlaps(w));
  // Fall back to the rest of the shape-matched pool rather than returning short:
  // a bank with two tiles is a broken step, a bank with one imperfect tile is a
  // slightly easier one.
  const rest = shaped.filter((w) => !preferred.includes(w));

  const picked = [
    ...seededShuffle(preferred, `${seed}-pref`),
    ...seededShuffle(rest, `${seed}-rest`),
  ].slice(0, count);

  return picked.map((w) => w.surface);
}
