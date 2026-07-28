/**
 * m29-neo — REGISTER MASTERY + THE N5 CAPSTONE. **The last module of N5.**
 * Spine tile s25, whose own line reads "Mixed-register speed drills; total
 * concept coverage with all-new sentences; fail-routing back to the owning
 * module. JLPT N5 complete." RUN-PLAN-n4 row 29 owes `janai-desu`,
 * `yo-emphasis` and `ne-agreement`, and all three are taught on rule cards
 * (L1, L2, L3).
 *
 * A learner arriving here can already say almost everything an N5 sentence
 * needs to say — in exactly one register at a time. What they cannot do yet is
 * SWITCH, quickly, with somebody in front of them. So this is not a
 * new-material module; it is the module where every sentence is a choice, and
 * the choice is who is listening.
 *
 *  - **The three ledger ids all live at the END of a sentence and are decided
 *    by the listener.** 「じゃない / じゃないです / じゃありません」 is one meaning
 *    in three registers (L1); 「よ」 hands over news (L2); 「ね」 collects
 *    agreement (L3).
 *  - **The other six cards are REGISTER TWINS of things the learner owns** —
 *    the switch itself (L5), the negative (L6), the past (L7), the explanation
 *    (L9), the invitation (L10) and the refusal (L11). Zero invented ids.
 *  - **Total concept coverage rides on the `exercises:` tags**, not on
 *    hand-built cumulative reviews (inv 25 forbids those): the module spans the
 *    whole N5 grammar ladder in ALL-NEW sentences, and every tag resolves to
 *    the shipped registry, which is what a fail-router would consume.
 *  - **Register scaffolding is legal in m10 and m29 only**, and it FADES here:
 *    stage 1 (cheat sheet) in L1, stage 2 (picture only) in L1/L5, stage 3
 *    (no scaffold, a Japanese vocative frame) in L5/L11.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m29.ir.yaml`
 * (`node scripts/compile-ir.mjs m29`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m29Ir from "./ir/m29.ir.json";

const COMPILED: LessonContent[] = compileModule(m29Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m29-neo: compiled lesson ${id} missing`);
  return l;
};

export const M29_NEO_LESSONS: LessonContent[] = [
  byId("ja-m29-neo-1"),
  byId("ja-m29-neo-2"),
  byId("ja-m29-neo-3"),
  byId("ja-m29-neo-review-1"),
  byId("ja-m29-neo-5"),
  byId("ja-m29-neo-6"),
  byId("ja-m29-neo-7"),
  byId("ja-m29-neo-review-2"),
  byId("ja-m29-neo-9"),
  byId("ja-m29-neo-10"),
  byId("ja-m29-neo-11"),
  byId("ja-m29-neo-review-3"),
  byId("ja-m29-neo-challenge"),
];
