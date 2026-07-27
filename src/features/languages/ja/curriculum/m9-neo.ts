/**
 * m9-neo — NUMBERS AND FIRST PURCHASES (spine tile n03).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m9.ir.yaml`
 * (`node scripts/compile-ir.mjs m9`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 15 lessons = 11 teaching + 3 review + 1 challenge. Two of
 * the teaching slots are KATAKANA rows (ナ, ハ — neoModuleIndex 9), spliced
 * in here because they are symbol lessons, not IR beats.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m9Ir from "./ir/m9.ir.json";
import { NEO_KATAKANA_ROW_LESSONS } from "./katakanaRows";

const COMPILED: LessonContent[] = compileModule(m9Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m9-neo: compiled lesson ${id} missing`);
  return l;
};

export const M9_NEO_LESSONS: LessonContent[] = [
  NEO_KATAKANA_ROW_LESSONS["na"],
  byId("ja-m9-neo-1"),
  byId("ja-m9-neo-2"),
  byId("ja-m9-neo-3"),
  byId("ja-m9-neo-review-1"),
  byId("ja-m9-neo-4"),
  byId("ja-m9-neo-5"),
  byId("ja-m9-neo-6"),
  NEO_KATAKANA_ROW_LESSONS["ha"],
  byId("ja-m9-neo-review-2"),
  byId("ja-m9-neo-7"),
  byId("ja-m9-neo-8"),
  byId("ja-m9-neo-9"),
  byId("ja-m9-neo-review-3"),
  byId("ja-m9-neo-challenge"),
];
