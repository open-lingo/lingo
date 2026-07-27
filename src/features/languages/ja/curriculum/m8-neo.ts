/**
 * m8-neo — ASKING FOR THINGS: て-form and ください (spine tile n02).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m8.ir.yaml`
 * (`node scripts/compile-ir.mjs m8`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 15 lessons = 11 teaching + 3 review + 1 challenge. Two of
 * the teaching slots are KATAKANA rows (サ, タ — neoModuleIndex 8), spliced
 * in here because they are symbol lessons, not IR beats.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m8Ir from "./ir/m8.ir.json";
import { NEO_KATAKANA_ROW_LESSONS } from "./katakanaRows";

const COMPILED: LessonContent[] = compileModule(m8Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m8-neo: compiled lesson ${id} missing`);
  return l;
};

export const M8_NEO_LESSONS: LessonContent[] = [
  NEO_KATAKANA_ROW_LESSONS["sa"],
  byId("ja-m8-neo-1"),
  byId("ja-m8-neo-2"),
  byId("ja-m8-neo-3"),
  byId("ja-m8-neo-review-1"),
  byId("ja-m8-neo-4"),
  byId("ja-m8-neo-5"),
  byId("ja-m8-neo-6"),
  NEO_KATAKANA_ROW_LESSONS["ta"],
  byId("ja-m8-neo-review-2"),
  byId("ja-m8-neo-7"),
  byId("ja-m8-neo-8"),
  byId("ja-m8-neo-9"),
  byId("ja-m8-neo-review-3"),
  byId("ja-m8-neo-challenge"),
];
