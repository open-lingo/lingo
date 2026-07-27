/**
 * m14-neo — て-FORM II: ている + permission/prohibition (spine tile n06b).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m14.ir.yaml`
 * (`node scripts/compile-ir.mjs m14`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m14Ir from "./ir/m14.ir.json";

const COMPILED: LessonContent[] = compileModule(m14Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m14-neo: compiled lesson ${id} missing`);
  return l;
};

export const M14_NEO_LESSONS: LessonContent[] = [
  byId("ja-m14-neo-1"),
  byId("ja-m14-neo-2"),
  byId("ja-m14-neo-3"),
  byId("ja-m14-neo-review-1"),
  byId("ja-m14-neo-4"),
  byId("ja-m14-neo-5"),
  byId("ja-m14-neo-6"),
  byId("ja-m14-neo-review-2"),
  byId("ja-m14-neo-7"),
  byId("ja-m14-neo-8"),
  byId("ja-m14-neo-9"),
  byId("ja-m14-neo-review-3"),
  byId("ja-m14-neo-challenge"),
];
