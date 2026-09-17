/**
 * Q10 no-kanji-before-intro: a kanji surface appears only after its
 * reveal/intro.
 *
 * The runtime JSON this runner reads is KANA-FIRST BY DESIGN (see
 * `docs/tile-shrapnel-2026-09-17.md` §1, and pinned invariant #3: "Grading,
 * `tiles`, and `correctOrder` stay KANA — display-only"). Kanji is layered
 * on at RENDER time, per-learner, by `applyKanjiSurfaces()`
 * (`src/features/languages/ja/secondScript/applyKanjiSurfaces.ts`), gated
 * on that learner's actual mastery — it is not baked into the shipped JSON,
 * so there is no static "kanji before intro" instant to catch post-hoc from
 * this file alone.
 *
 * What IS staticaly checkable, and is the direct static proxy for the same
 * invariant: kanji characters must never be typed literally into a
 * KANA-GRADED field (tiles/correctOrder/targetSentence/targetPhrase/
 * transcript/audioText/dialogue kana lines/match_pairs source/cloze
 * prompt+correctParticle) outside the two step types whose whole point is
 * showing the kanji surface (`kanji_reading`, `grammar_rule`). A raw kanji
 * character in any other field is either an authoring slip (bypasses the
 * furigana/mastery ladder entirely — the exact "kana floating above
 * identical kana is always a defect" class from `authoring-invariants-
 * pinned.md` #2) or, if intentional, a kanji surface the reveal mechanism
 * was never asked to gate — i.e. a kanji shown before ANY intro logic runs
 * on it. Measured clean (0 hits) across the corpus outside those two types
 * (see the doc for the sweep) — see `q2-whole-word-tiles.mjs`'s doc-comment
 * pattern for the "measure, then decide enforced" doctrine this follows.
 */
const KANJI_RE = /[一-鿿]/;
const KANJI_INTRO_TYPES = new Set(["kanji_reading", "grammar_rule"]);

/** Fields carrying kana-graded/display text, per step shape. Prose/commentary
 *  fields (explanation, gloss, meaningEn, title, rule, examples) are
 *  deliberately excluded — kanji legitimately appears there as English-
 *  adjacent commentary about the word, never as the tested surface. */
const GRADED_FIELDS = [
  "targetSentence",
  "targetPhrase",
  "audioKey",
  "audioText",
  "transcript",
  "correctParticle",
];

function gradedTexts(step) {
  const out = [];
  for (const f of GRADED_FIELDS) if (typeof step[f] === "string") out.push([f, step[f]]);
  if (Array.isArray(step.tiles)) step.tiles.forEach((t, i) => out.push([`tiles[${i}]`, t]));
  if (Array.isArray(step.correctOrder))
    step.correctOrder.forEach((t, i) => out.push([`correctOrder[${i}]`, t]));
  if (step.prompt && typeof step.prompt === "object") {
    if (typeof step.prompt.before === "string") out.push(["prompt.before", step.prompt.before]);
    if (typeof step.prompt.after === "string") out.push(["prompt.after", step.prompt.after]);
  }
  if (Array.isArray(step.lines))
    step.lines.forEach((l, i) => {
      if (typeof l.kana === "string") out.push([`lines[${i}].kana`, l.kana]);
    });
  if (Array.isArray(step.pairs))
    step.pairs.forEach((p, i) => {
      if (typeof p.source === "string") out.push([`pairs[${i}].source`, p.source]);
    });
  if (Array.isArray(step.acceptedAnswers))
    step.acceptedAnswers.forEach((a, i) => out.push([`acceptedAnswers[${i}]`, a]));
  return out;
}

export const id = "Q10";
export const question = "does this step avoid a raw kanji surface outside its dedicated reveal type?";
export const enforced = true;

export function appliesTo(step, ctx) {
  if (ctx?.lang && ctx.lang !== "ja") return false; // kanji/kana script mechanics are JA-only
  return !KANJI_INTRO_TYPES.has(step.type) && gradedTexts(step).length > 0;
}

export function naReason(step, ctx) {
  if (ctx?.lang && ctx.lang !== "ja") {
    return "Q10 is JA-only — kanji/kana second-script mechanics have no KO/ES/FR equivalent (docs/procedural-qa-2026-09-17.md §7)";
  }
  return "not applicable to this step";
}

export async function run(step) {
  const hits = gradedTexts(step).filter(([, text]) => KANJI_RE.test(text));
  if (hits.length === 0) return { answer: "yes", evidence: ["no kanji in any kana-graded field"] };
  return { answer: "no", evidence: hits.map(([field, text]) => `${field}="${text}" has a raw kanji`) };
}

/** Plant: substitute a kanji into the step's own target sentence, the exact
 *  defect class this catches. */
export function plant(step) {
  const clone = structuredClone(step);
  const swap = (s) => (typeof s === "string" ? s.replace("を", "を").concat("食") : s);
  if (typeof clone.targetSentence === "string") clone.targetSentence = swap(clone.targetSentence);
  else if (Array.isArray(clone.tiles) && clone.tiles.length > 0)
    clone.tiles = [...clone.tiles.slice(0, -1), `${clone.tiles.at(-1)}食`];
  else if (typeof clone.audioKey === "string") clone.audioKey = `${clone.audioKey}食`;
  return clone;
}
