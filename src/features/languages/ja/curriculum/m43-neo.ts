/**
 * m43-neo — the FOURTEENTH module of the JLPT N4 tier. Spine unit `n4-14`
 * (`docs/spine-n4.md` §`n4-14`), "Certainty ladder: 〜かもしれない / 〜はず /
 * でしょう-deepen" (`docs/ja-m43-brief-2026-09-10.md`).
 *
 * Four rungs of a certainty ladder, never merged into one block table
 * mid-course (interleave-dont-block-teach):
 *
 *  - **L2, id `kamoshirenai`**: epistemic "might" — plain verb/い-adjective
 *    attaches as-is; noun/な-adjective DROP だ first (がくせいかもしれない,
 *    never がくせいだかもしれない). Registered as ONE fused 6-kana atom so
 *    longest-match always wins. Casual bare かも is NEVER a standalone atom
 *    — it decomposes into the pre-existing free particles か + も, and no
 *    sentence in this module ever authors bare かも at all.
 *  - **L5, id `hazu`, variant `intro`**: evidence-backed "should be" — the
 *    mirror-image connector move from かもしれない: noun hosts insert の,
 *    な-adjective hosts insert な, never だ.
 *  - **L6, id `hazu`, variant `spends`**: はずだった (broken expectation)
 *    and はずがない (flat denial) — a second `kind: rule` card sharing the
 *    `hazu` id via a distinct `variant` key (the m6 nai-form three-card
 *    precedent, generalized; `resolveGrammarPoint` disambiguates on
 *    `beat.variant` when 2+ grammarPoints share an id).
 *  - **L3, でしょう-deepen**: no new grammarPointId of its own — references
 *    m25's でしょう family (deshou, deshou-adjective, deshou-verb, darou,
 *    tabun-kitto) directly by id via `exercises:`/`combines:` tags. だろう
 *    stays strictly recognition-only throughout (Tanaka/NPC dialogue lines
 *    only), matching its own firm m25 framing — never promoted.
 *  - **L10 (neo-8), id `certainty-ladder`**: a REVIEW-OBJECT synthesis card
 *    (inv 26 shape), not new teaching — orders all four rungs by strength:
 *    にちがいない (top, recognition only) > はず > でしょう/だろう > かもしれない
 *    (bottom). にちがいない is never its own grammarPointId, so the
 *    recognition-only guarantee is structural, not just a discipline.
 *
 * Register discipline (inv 7, DICT-FORM-FIRST): plain かもしれない/はずだ are
 * the production bases throughout; polite かもしれません is an IR-only
 * `verb-form` derived atom appearing only in Tanaka-voiced recognition-only
 * dialogue lines, never a production target.
 *
 * Zero new `ChainForm`/`TRANSFORM_RULESETS` entries — かもしれない/はず are
 * compositional attachments to the already-live plain/dictionary-form
 * surface (confirmed against inv 49's closed transform list). うたがう
 * (godan) and しんじる (ichidan) ride only the closed-list nai-form/
 * volitional transforms; no hand-typed past tense for either anywhere in
 * this module.
 *
 *  - **L1**: pure domain-vocabulary lesson (promises/plans), no new
 *    grammar on purpose. みこみ/かくじつ cut entirely (both outside the
 *    brief's own first-cut suggestion), so the new-atom count stays at 15.
 *  - **L7**: pure integration (all three living rungs combined inside one
 *    dialogue_sim), no new vocabulary.
 *  - **L8 (neo-6)**: domain integration over feelings vocabulary (あんしん/
 *    しんぱい) plus a single にちがいない recognition aside — recognition
 *    only, never graded.
 *  - **L10 (neo-8)**: pre-review integration, certainty-ladder review
 *    object, every beat combines ≥3 grammar points (inv 26), no new
 *    vocabulary.
 *  - **challenge**: every certainty marker combined with prior N4 grammar,
 *    no new vocabulary.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m43.ir.yaml`
 * (`node scripts/compile-ir.mjs m43`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m43Ir from "./ir/m43.ir.json";

const COMPILED: LessonContent[] = compileModule(m43Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m43-neo: compiled lesson ${id} missing`);
  return l;
};

export const M43_NEO_LESSONS: LessonContent[] = [
  byId("ja-m43-neo-1"),
  byId("ja-m43-neo-2"),
  byId("ja-m43-neo-3"),
  byId("ja-m43-neo-review-1"),
  byId("ja-m43-neo-4"),
  byId("ja-m43-neo-5"),
  byId("ja-m43-neo-6"),
  byId("ja-m43-neo-review-2"),
  byId("ja-m43-neo-7"),
  byId("ja-m43-neo-8"),
  byId("ja-m43-neo-review-3"),
  byId("ja-m43-neo-challenge"),
];
