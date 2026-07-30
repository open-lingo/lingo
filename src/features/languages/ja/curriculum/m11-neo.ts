/**
 * m11-neo — TIME I + PLAIN PAST た (spine tile n04).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m11.ir.yaml`
 * (`node scripts/compile-ir.mjs m11`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape: 17 lessons = 13 teaching + 3 review + 1 challenge. Two of the
 * teaching slots are KATAKANA rows (ラ, ワ — neoModuleIndex 11), spliced
 * in here because they are symbol lessons, not IR beats. The two slots past
 * inv 25's 15-ceiling are the 2026-07-29 vocab-pack insertions (B065/B067):
 * ja-m11-neo-10 (weekdays, after 〜じに) and ja-m11-neo-11 (wider calendar,
 * after いつ) — ids are numbered after the module's nine original teaching
 * slots but positioned where they teach.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m11Ir from "./ir/m11.ir.json";
import { NEO_KATAKANA_ROW_LESSONS } from "./katakanaRows";

const COMPILED: LessonContent[] = compileModule(m11Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m11-neo: compiled lesson ${id} missing`);
  return l;
};

export const M11_NEO_LESSONS: LessonContent[] = [
  NEO_KATAKANA_ROW_LESSONS["ra"],
  byId("ja-m11-neo-1"),
  byId("ja-m11-neo-2"),
  byId("ja-m11-neo-3"),
  byId("ja-m11-neo-10"),
  byId("ja-m11-neo-review-1"),
  byId("ja-m11-neo-4"),
  byId("ja-m11-neo-5"),
  byId("ja-m11-neo-6"),
  NEO_KATAKANA_ROW_LESSONS["wa"],
  byId("ja-m11-neo-review-2"),
  byId("ja-m11-neo-7"),
  byId("ja-m11-neo-8"),
  byId("ja-m11-neo-9"),
  byId("ja-m11-neo-11"),
  byId("ja-m11-neo-review-3"),
  byId("ja-m11-neo-challenge"),
];
