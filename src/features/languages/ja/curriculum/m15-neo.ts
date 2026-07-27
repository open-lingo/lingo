/**
 * m15-neo — RELATIVE CLAUSES + こと/の NOMINALIZERS + とき (spine tile s11),
 * plus the ordering pair まえに / てから.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m15.ir.yaml`
 * (`node scripts/compile-ir.mjs m15`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m15Ir from "./ir/m15.ir.json";

const COMPILED: LessonContent[] = compileModule(m15Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m15-neo: compiled lesson ${id} missing`);
  return l;
};

export const M15_NEO_LESSONS: LessonContent[] = [
  byId("ja-m15-neo-1"),
  byId("ja-m15-neo-2"),
  byId("ja-m15-neo-3"),
  byId("ja-m15-neo-review-1"),
  byId("ja-m15-neo-4"),
  byId("ja-m15-neo-5"),
  byId("ja-m15-neo-6"),
  byId("ja-m15-neo-review-2"),
  byId("ja-m15-neo-7"),
  byId("ja-m15-neo-8"),
  byId("ja-m15-neo-9"),
  byId("ja-m15-neo-review-3"),
  byId("ja-m15-neo-challenge"),
];
