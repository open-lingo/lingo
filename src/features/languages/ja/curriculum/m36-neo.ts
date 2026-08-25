/**
 * m36-neo — the SEVENTH module of the JLPT N4 tier. Spine unit `n4-07`
 * (`docs/spine-n4.md` §`n4-07`), "Looks like: 〜そう(appearance), 〜がる,
 * 〜やすい/にくい, 〜ながら".
 *
 * An ATTACHMENT-SITE module: everything on screen hangs off the i-stem /
 * adjective-stem the learner has owned since m7, so the load is semantic
 * rather than morphological — the right shape for the module that carries
 * five items:
 *
 *  - **〜そう "looks like"** (L1 adjectives おいしそう/たかそう + the
 *    irregulars よさそう/なさそう while the rule is fresh; L2 verb stems
 *    ふりそう/おちそう + the negatives ふらなさそう/ふりそうにない). The
 *    looks-vs-knowledge gap is the meaning; hearsay そうだ (n4-13) is
 *    DELIBERATELY absent and never even appears as a distractor.
 *  - **〜がる/たがる** (L5, plus emotion がる in L9) — third-person desire,
 *    repaying the N5 binding constraint that banned "he wants".
 *  - **〜やすい/にくい** (L6) — stem + i-adjective, same site as たい; the
 *    result conjugates as a full i-adjective.
 *  - **〜ながら** (L7) — simultaneous action; the ながら-half is the
 *    background, the main clause is the point.
 *  - **〜すぎる deepen** (L7/L9) — m27's suffix, harder spends.
 *
 * DIALOGUE_SIM ×2: L3 dinner at Mika's (the おいしそう/おいしい
 * looks-vs-knowledge choice, lived); L10 the sky over the park (ふりそうだね
 * read off the clouds, then the plan pivots on m34's volitional — うちで
 * えいがを みよう).
 *
 * TOKENIZER NOTE inherited by every later module: m35's だけ atom greedily
 * intercepts unspaced だけど (だ+けど) in the compile tokenizer, so post-m35
 * IR never writes 〜だけど — put けど on the verb clause or drop the copula.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m36.ir.yaml`
 * (`node scripts/compile-ir.mjs m36`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m36Ir from "./ir/m36.ir.json";

const COMPILED: LessonContent[] = compileModule(m36Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m36-neo: compiled lesson ${id} missing`);
  return l;
};

export const M36_NEO_LESSONS: LessonContent[] = [
  byId("ja-m36-neo-1"),
  byId("ja-m36-neo-2"),
  byId("ja-m36-neo-3"),
  byId("ja-m36-neo-review-1"),
  byId("ja-m36-neo-5"),
  byId("ja-m36-neo-6"),
  byId("ja-m36-neo-7"),
  byId("ja-m36-neo-review-2"),
  byId("ja-m36-neo-9"),
  byId("ja-m36-neo-10"),
  byId("ja-m36-neo-review-3"),
  byId("ja-m36-neo-challenge"),
];
