/**
 * m16-neo — CONNECTING CLAUSES: から (because) / ので / けど, から's origin
 * sense, the から…まで span, and the two past-negative cells that close the
 * paradigm (ませんでした, なかった) — spine tile s13. Plus the 〜まい counter.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m16.ir.yaml`
 * (`node scripts/compile-ir.mjs m16`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 15 lessons = 11 teaching + 3 review + 1 challenge,
 * challenge LAST — the inv-25 base shape plus the two 2026-07-30 vocab-pack
 * insertions (B065/B067): ja-m16-neo-10 (the classroom) and ja-m16-neo-11
 * (habits and health). NO katakana rows — the katakana programme ended at
 * m11, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m16Ir from "./ir/m16.ir.json";

const COMPILED: LessonContent[] = compileModule(m16Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m16-neo: compiled lesson ${id} missing`);
  return l;
};

export const M16_NEO_LESSONS: LessonContent[] = [
  byId("ja-m16-neo-1"),
  byId("ja-m16-neo-2"),
  byId("ja-m16-neo-3"),
  byId("ja-m16-neo-review-1"),
  byId("ja-m16-neo-4"),
  byId("ja-m16-neo-5"),
  byId("ja-m16-neo-6"),
  byId("ja-m16-neo-review-2"),
  byId("ja-m16-neo-7"),
  byId("ja-m16-neo-8"),
  byId("ja-m16-neo-9"),
  byId("ja-m16-neo-10"),
  byId("ja-m16-neo-11"),
  byId("ja-m16-neo-review-3"),
  byId("ja-m16-neo-challenge"),
];
