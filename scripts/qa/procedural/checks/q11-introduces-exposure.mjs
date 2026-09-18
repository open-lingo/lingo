/**
 * Q11 introduces-exposure: does every atom this lesson's `introduces:`
 * declares actually appear somewhere in the lesson it debuts in?
 *
 * Origin: TestFlight #202/#204 (`docs/user-feedback/2026-09-18-testflight-
 * b30.md` §2) — とお sits in `m32-neo-5`'s `introduces:` array
 * (`m32.ir.yaml:491`) but never appears in any sentence/beat/tile/option of
 * that lesson; it only surfaces later, divorced from any counting context,
 * on a flashcard. `atomExposureAudit` (B065) checks that a word gets
 * exposure SOMEWHERE across later modules — nothing checked that a word
 * declared "taught here" is actually used in its OWN debut lesson. This is
 * that floor.
 *
 * Lesson-scoped, not step-scoped (same shape as Q9's step-variety check):
 * reported once, on the lesson's first step; every other step is n/a.
 *
 * Tool: `lib/introduces.mjs` reads each JA module's compiled `.ir.json` for
 * the lesson's own `introduces:` word list (the ONLY place this
 * declaration exists — never emitted into the runtime bundle, see that
 * file's doc comment). Presence is checked against the RUNTIME JSON (what
 * ships) by stringifying the lesson's own `steps` array and substring-
 * matching — the same three-way "verbatim / kana variant / kanji variant"
 * detector `atomExposureAudit.test.ts` already uses course-wide, narrowed
 * to one lesson's own steps. An `introduces:` word is also resolved
 * against `getNormalizedCourseAtoms('ja')` (`courseAtoms.ts`'s cross-
 * language view, `lib/lexicon.mjs`'s `getAtoms`) to pull in its OTHER
 * registered surface (kana word found only by its kanji, or vice versa).
 *
 * Conjugation fallback (2026-09-18, added after the first hand-audit — see
 * the doc's §14 precision table): a raw verbatim/atom-surface pass over the
 * whole JA course measured 9 lesson-level findings / 15 (lessonId, atom)
 * pairs, hand-audited 15/15 (all of them) at 2/15 = 13% precision — 13 of
 * the 15 were the SAME class, a dictionary-form `introduces:` entry
 * (こわす, あるきやすい, しかられる…) exercised in its lesson ONLY as a
 * conjugated tile (こわした, あるきやすかった, しかられた) that a plain
 * substring match can't see. Rather than accept 13% precision, this reuses
 * Q3's own existing reverse-deconjugator (`lib/jaDeconjugate.mjs`'s
 * `tryDeconjugate`, already shared tooling, not reinvented) against every
 * literal TILE in the lesson's `tiles`/`correctOrder` arrays (already
 * word-segmented — no new tokenization), strict-matched (`candidate ===
 * word`, so it can only ever confirm THIS word, never a different one).
 * `tryDeconjugate` alone closed 9/13; the remaining 4 were two classes it
 * doesn't cover (documented in its own header as out of scope): the
 * てくる/ていく "arriving/heading" compound aux (ふえてきた, へっていく,
 * かわっていく, なれてきた — base verb + て/で + くる/いく, not a bare て/た
 * ending) and い-adjective past ~かった (あるきやすかった). Both are small,
 * bounded, STRIP-then-retry additions kept local to this check (not a
 * change to the shared jaDeconjugate.mjs, which Q3 owns and which this
 * lane has no reason to touch) — re-measured after adding them: 15/15
 * (100%) of the hand-audited sample now classifies correctly (2 real
 * orphans stay flagged, 13 false positives clear). See
 * docs/procedural-qa-2026-09-17.md §14 for the full audit table.
 */
import { loadLessonIntroduces, introducesConceptAvailable } from "../lib/introduces.mjs";
import { tryDeconjugate } from "../lib/jaDeconjugate.mjs";

export const id = "Q11";
export const question =
  "does every `introduces` atom of this lesson appear in at least one of its sentences/beats/tiles/options?";
// INFORMATIONAL (2026-09-18, lane INTROFLOOR) — new floor, baselined at
// today's true count per `regression-classes` C7/C8: a human still judges
// whether each flagged (lessonId, atom) pair is a real orphan (fix the
// content) or deliberate (document why). Promote to enforced only after a
// hand-audited precision pass clears the bar the doc's other promoted
// questions (Q2/Q3) did — this lane's 15-sample audit (100% after the
// conjugation fallback above) is a good start but is not, on its own, the
// whole-course measurement that promotion doctrine (§5) asks for.
export const enforced = false;

function splitVariants(s) {
  return (s ?? "")
    .split(/[/、,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Every literal surface form worth searching for `word` — itself, plus (if
 *  `word` matches a registered course atom's kana or kanji) that atom's
 *  OTHER registered surface(s). No stemming/conjugation invention here —
 *  that's `deconjugatedMatch` below, deliberately kept separate since it
 *  needs a per-tile candidate, not a whole-corpus substring. */
function surfaceFormsFor(word, atoms) {
  const forms = new Set([word]);
  for (const a of atoms) {
    const kanaVariants = splitVariants(a.display);
    const kanjiVariants = splitVariants(a.secondary);
    if (kanaVariants.includes(word) || kanjiVariants.includes(word)) {
      for (const v of kanaVariants) forms.add(v);
      for (const v of kanjiVariants) forms.add(v);
    }
  }
  return [...forms];
}

/** Every literal tile/correctOrder entry across the lesson's steps — the
 *  word-segmented candidates the conjugation fallback tests. */
function tileWords(steps) {
  const words = new Set();
  for (const s of steps) {
    const list = Array.isArray(s.correctOrder) ? s.correctOrder : Array.isArray(s.tiles) ? s.tiles : [];
    for (const t of list) if (typeof t === "string") words.add(t);
  }
  return words;
}

// Compound-aux continuations riding on a plain て/で-form — jaDeconjugate's
// own scope is a single bare て/た ending; these strip the compound tail
// back to a plain て/で form and hand THAT to tryDeconjugate, reusing its
// て-form table rather than duplicating it. Two grammar points measured in
// the 15-sample audit (docs/procedural-qa-2026-09-17.md §14): てくる/ていく
// "arriving/heading" (`te-kuru-iku-time`) and てしまう "regret/completion"
// (`te-shimau` — なくしてしまった only ever exercises なくす through this
// aux, m38-neo-2).
const COMPOUND_AUX_SUFFIXES = [
  "てきた",
  "てきて",
  "ていく",
  "ていった",
  "ていって",
  "でくる",
  "でいく",
  "できた",
  "でいった",
  "てしまった",
  "てしまう",
  "てしまって",
  "でしまった",
  "でしまう",
  "でしまって",
];

function stripCompoundAux(tile) {
  for (const suf of COMPOUND_AUX_SUFFIXES) {
    if (tile.endsWith(suf) && tile.length > suf.length) {
      return tile.slice(0, -suf.length) + (suf.startsWith("で") ? "で" : "て");
    }
  }
  return null;
}

/** Does `tile` deconjugate to exactly `word`? Tries jaDeconjugate's table
 *  first, then the two small local extensions it doesn't cover. */
function deconjugatesTo(tile, word) {
  const existsFn = (candidate) => candidate === word;
  if (tryDeconjugate(tile, existsFn)) return true;
  const stripped = stripCompoundAux(tile);
  if (stripped && tryDeconjugate(stripped, existsFn)) return true;
  // い-adjective past: ~かった -> ~い (school-grammar rule; not covered by
  // jaDeconjugate, which only strips たい's OWN -たかった desiderative).
  if (tile.endsWith("かった") && tile.length > 3) {
    const candidate = tile.slice(0, -3) + "い";
    if (existsFn(candidate)) return true;
  }
  return false;
}

/** "Has ≥1 sentence": at least one step in the lesson carries real
 *  learner-facing kana text (`jaSurfaces`, the same extractor Q1/Q6 use) —
 *  excludes lessons whose only steps are structurally textless (guards
 *  against a false "no" on a shape this question was never meant to grade,
 *  same doctrine as Q9's kana-row exemption). */
function hasAnySentence(steps, ctx) {
  return steps.some((s) => ctx.jaSurfaces(s).length > 0);
}

export function appliesTo(step, ctx) {
  if (ctx.stepIndex !== 0) return false;
  if (!introducesConceptAvailable(ctx.lang)) return false;
  const words = ctx.lessonIntroduces ?? [];
  if (words.length === 0) return false;
  return hasAnySentence(ctx.lessonSteps, ctx);
}

export function naReason(step, ctx) {
  if (!introducesConceptAvailable(ctx.lang)) {
    return "no `introduces:` concept for this language — no live IR directory with the field (ko has no IR pipeline; es's IR yaml never sets it; fr has no live IR dir) — docs/procedural-qa-2026-09-17.md §14";
  }
  if (ctx.stepIndex !== 0) return "lesson-scoped — reported once, on the lesson's first step";
  const words = ctx.lessonIntroduces ?? [];
  if (words.length === 0) return "this lesson's `introduces:` array is empty or absent from the IR";
  return "lesson has no step carrying learner-facing kana text (jaSurfaces) — nothing to search";
}

export async function run(_step, ctx) {
  const words = ctx.lessonIntroduces ?? [];
  const corpus = JSON.stringify(ctx.lessonSteps);
  const tiles = tileWords(ctx.lessonSteps);
  const orphans = [];
  for (const word of words) {
    const forms = surfaceFormsFor(word, ctx.atoms ?? []);
    let found = forms.some((f) => corpus.includes(f));
    if (!found) {
      for (const tile of tiles) {
        if (deconjugatesTo(tile, word)) {
          found = true;
          break;
        }
      }
    }
    if (!found) orphans.push(word);
  }
  if (orphans.length > 0) {
    return {
      answer: "no",
      evidence: [
        `introduces atom(s) with zero supporting sentence/beat/tile/option in their own debut lesson: ${orphans.join(", ")}`,
      ],
    };
  }
  return {
    answer: "yes",
    evidence: [`${words.length} introduces atom(s), all exposed somewhere in this lesson's steps`],
  };
}

/** Plant: append a word that provably cannot appear anywhere in the
 *  lesson's real content (not a registered atom, not real kana, not
 *  reachable by any deconjugation rule). */
export function plant(step, ctx) {
  ctx.lessonIntroduces = [...(ctx.lessonIntroduces ?? []), "ぬぽぬぽ__planted-orphan__"];
  return step;
}
