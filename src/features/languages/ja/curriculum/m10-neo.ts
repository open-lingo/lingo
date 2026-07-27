/**
 * m10-neo — REGISTER IN THE WILD (spine tile n15).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m10.ir.yaml`
 * (`node scripts/compile-ir.mjs m10`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 15 lessons = 11 teaching + 3 review + 1 challenge. Two of
 * the teaching slots are KATAKANA rows (マ, ヤ — neoModuleIndex 10), spliced
 * in here because they are symbol lessons, not IR beats.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m10Ir from "./ir/m10.ir.json";
import { NEO_KATAKANA_ROW_LESSONS } from "./katakanaRows";

const COMPILED: LessonContent[] = compileModule(m10Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m10-neo: compiled lesson ${id} missing`);
  return l;
};

export const M10_NEO_LESSONS: LessonContent[] = [
  NEO_KATAKANA_ROW_LESSONS["ma"],
  byId("ja-m10-neo-1"),
  byId("ja-m10-neo-2"),
  byId("ja-m10-neo-3"),
  byId("ja-m10-neo-review-1"),
  byId("ja-m10-neo-4"),
  byId("ja-m10-neo-5"),
  byId("ja-m10-neo-6"),
  NEO_KATAKANA_ROW_LESSONS["ya"],
  byId("ja-m10-neo-review-2"),
  byId("ja-m10-neo-7"),
  byId("ja-m10-neo-8"),
  byId("ja-m10-neo-9"),
  byId("ja-m10-neo-review-3"),
  byId("ja-m10-neo-challenge"),
];
