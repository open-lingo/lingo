/**
 * m12-neo — ADJECTIVES AS MINI-PREDICATES, い + な (spine tile s09).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m12.ir.yaml`
 * (`node scripts/compile-ir.mjs m12`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so unlike
 * m7-m11 this module splices nothing in at module level and the compiled
 * order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m12Ir from "./ir/m12.ir.json";

const COMPILED: LessonContent[] = compileModule(m12Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m12-neo: compiled lesson ${id} missing`);
  return l;
};

export const M12_NEO_LESSONS: LessonContent[] = [
  byId("ja-m12-neo-1"),
  byId("ja-m12-neo-2"),
  byId("ja-m12-neo-3"),
  byId("ja-m12-neo-review-1"),
  byId("ja-m12-neo-4"),
  byId("ja-m12-neo-5"),
  byId("ja-m12-neo-6"),
  byId("ja-m12-neo-review-2"),
  byId("ja-m12-neo-7"),
  byId("ja-m12-neo-8"),
  byId("ja-m12-neo-9"),
  byId("ja-m12-neo-review-3"),
  byId("ja-m12-neo-challenge"),
];
