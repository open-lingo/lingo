/**
 * m32-neo — the THIRD module of the JLPT N4 tier. Spine unit `n4-03`
 * (`docs/spine-n4.md` §3), "Conditionals I: たら (と as the contrast)".
 *
 * The payload is ONE hub form and ONE minimal pair against it.
 *
 *  - **たら costs nothing to build.** It is the plain past the learner has
 *    owned since m11 with ら on the end. The tier's most useful conditional is
 *    also its cheapest, and L1 introduces no vocabulary at all so that the
 *    claim is not contradicted by the lesson making it.
 *  - **たら covers BOTH "if" and "when", and that is the form, not a
 *    simplification.** English forces the speaker to commit; Japanese does not.
 *    L2 teaches the ambiguity on seasons — an event that is CERTAIN and still
 *    takes たら — because teaching it on rain alone would leave the learner
 *    concluding たら means "if".
 *  - **と ships here, not later, because it is たら's true minimal pair.** Same
 *    English gloss; the difference is mechanical rather than a feel. と claims
 *    an INVARIABLE consequence — seasons, machines, directions — and its main
 *    clause therefore cannot be a request, an invitation, a command or an
 *    intention. ×「えきに つくと、でんわを して ください」 is broken as a shape, so
 *    the pair has a drillable tell: read the END of the sentence.
 *  - **PAIRWISE ONLY.** ば and なら are n4-08, five modules out, and the
 *    four-way contrast exists only in the m51 capstone. This module never
 *    mentions them, not even to say they exist (RUN-PLAN standing decision 5).
 *  - **NO SCENE, deliberately.** A `timeline` would draw the two clauses in
 *    order and teach the wrong fact: order is not what separates たら from と,
 *    contingency is, and no scene in the family draws that. See the IR notes.
 *
 * Fourteen of the module's words are ADOPTED rather than invented — thirteen
 * dead `courseAtoms` rows that no unlock path could reach, plus かかる. The IR
 * notes carry the measurement and the reasoning.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m32.ir.yaml`
 * (`node scripts/compile-ir.mjs m32`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the compiled
 * order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m32Ir from "./ir/m32.ir.json";

const COMPILED: LessonContent[] = compileModule(m32Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m32-neo: compiled lesson ${id} missing`);
  return l;
};

export const M32_NEO_LESSONS: LessonContent[] = [
  byId("ja-m32-neo-1"),
  byId("ja-m32-neo-2"),
  byId("ja-m32-neo-3"),
  byId("ja-m32-neo-review-1"),
  byId("ja-m32-neo-5"),
  byId("ja-m32-neo-6"),
  byId("ja-m32-neo-7"),
  byId("ja-m32-neo-review-2"),
  byId("ja-m32-neo-9"),
  byId("ja-m32-neo-10"),
  byId("ja-m32-neo-11"),
  byId("ja-m32-neo-review-3"),
  byId("ja-m32-neo-challenge"),
];
