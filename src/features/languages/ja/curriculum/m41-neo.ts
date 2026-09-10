/**
 * m41-neo — the TWELFTH module of the JLPT N4 tier. Spine unit `n4-12`
 * (`docs/spine-n4.md` §`n4-12`), "Transitivity II: 〜てある + the pair
 * families" (`docs/ja-m41-brief-2026-09-10.md`).
 *
 * てある rides the exact て-form slot ておく (m30) and ている (m14) already
 * occupy: a TRANSITIVE verb's て-form + ある names a state someone left
 * behind on purpose — the object drops を and takes が. It is purely
 * compositional (known て-form + known ある, m6) — no new `ChainForm`/
 * `TRANSFORM_RULESETS` entry, the same category as m30's ておく and m38's
 * てしまう.
 *
 *  - **L1**: vocabulary priming only (かべ/たな/ポスター/メモ/はる/かざる/
 *    ならべる/ならぶ) through は/が/を already known — no てある yet.
 *  - **L2, id `te-aru`**: core construction. Anchor minimal pair uses ZERO
 *    new vocabulary (まど/あける/あく known since m14/m33) so the grammar
 *    stands on its own before riding new words. First `dialogue_sim`.
 *  - **L3, id `te-aru-vs-te-iru`**: three readings of one event —
 *    自動詞+ている (state, no agent, m33) / 他動詞+ている (ongoing action) /
 *    他動詞+てある (state, agent implied). A single non-graded rule-card
 *    aside names m40's あけられる (passive) as an unrelated fourth shape —
 *    never drilled.
 *  - **L5, id `te-oku-vs-te-aru`**: ておく keeps agent framing (を stays);
 *    てある reframes the same fact as a property of the room (が) —
 *    whose-action-is-on-stage, not a tense distinction.
 *  - **L6, id `transitivity-family-noticing`**: m33 shipped NINE
 *    jidoushi/tadoushi pairs; this module adds a TENTH — ならぶ
 *    (intransitive) / ならべる (transitive), repointed from stale
 *    courseAtoms "future" stubs — then runs every pair's transitive half
 *    through てある.
 *  - **L7/L9/L10**: production sweeps combining てある with prior N4
 *    grammar (し／のに／ておく／から); second `dialogue_sim` in L9.
 *  - **challenge**: every てある pattern combined with prior N4 grammar,
 *    no new vocabulary.
 *
 * CUT (brief's own carried-forward flag, resolved with certainty, not
 * merely investigated): つく／つける. courseAtoms already reserves kana
 * つく for `tsuku` (着く, "to arrive", m23, LIVE) — `atomIndex()`
 * (`moduleCompiler.ts`) builds ONE merged entry per KANA STRING across the
 * whole course, so a second row sharing that kana (点く, "to turn on, of
 * itself") would silently overwrite the live m23 atom's gloss app-wide once
 * appended later in courseAtoms.ts file order. This is a different collision
 * class than the exercised() tokenizer's existing さん/し/でも/なんで
 * positional guards (which disambiguate grading credit after both senses
 * already coexist in the atom map) — here the collision happens one layer
 * earlier, at map construction, where no position/context exists to
 * consult. No positional exception can fix it. Independently corroborated
 * by a historical courseAtoms.ts comment recording m24's own authors
 * rejecting the identical collision for potential-form atoms. See
 * `ir/m41.ir.yaml`'s header notes for the full writeup.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m41.ir.yaml`
 * (`node scripts/compile-ir.mjs m41`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m41Ir from "./ir/m41.ir.json";

const COMPILED: LessonContent[] = compileModule(m41Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m41-neo: compiled lesson ${id} missing`);
  return l;
};

export const M41_NEO_LESSONS: LessonContent[] = [
  byId("ja-m41-neo-1"),
  byId("ja-m41-neo-2"),
  byId("ja-m41-neo-3"),
  byId("ja-m41-neo-review-1"),
  byId("ja-m41-neo-5"),
  byId("ja-m41-neo-6"),
  byId("ja-m41-neo-7"),
  byId("ja-m41-neo-review-2"),
  byId("ja-m41-neo-9"),
  byId("ja-m41-neo-10"),
  byId("ja-m41-neo-review-3"),
  byId("ja-m41-neo-challenge"),
];
