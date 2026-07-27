/**
 * m7-neo — POLITENESS AS A LAYER: ます and です (spine tile s07).
 *
 * Authored through the compiler pipeline (docs/content-ir-spec-2026-07-20.md):
 * pedagogy lives in `ir/m7.ir.yaml` (→ `ir/m7.ir.json` via
 * `node scripts/compile-ir.mjs m7`), and `compileModule` lays it out at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * FIRST module built to the 2026-07-26 shape (invariant 25): 15 lessons =
 * 11 teaching + 3 review + 1 challenge, reviews at the beginning/middle/end
 * thirds, challenge lesson LAST. Two of the eleven teaching lessons are
 * KATAKANA row lessons (ア, カ — KATAKANA_ROW_SCHEDULE.neoModuleIndex = 7);
 * those are symbol lessons rather than IR beats, so they are spliced in here
 * rather than compiled. The IR carries 9 teaching + 3 review + 1 challenge.
 *
 * Register note: this is where です/ます stop being recognition previews
 * (invariant 7) and become production targets. m7 is exempt from the
 * plain-preferred production ramp for that reason; the ramp starts at m8.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m7Ir from "./ir/m7.ir.json";
import { NEO_KATAKANA_ROW_LESSONS } from "./katakanaRows";

const COMPILED: LessonContent[] = compileModule(m7Ir as unknown as ModuleIR);

const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m7-neo: compiled lesson ${id} missing`);
  return l;
};

/**
 * Lesson order (invariant 25). Katakana lessons occupy teaching slots 1 and
 * 8 so the two rows are spread rather than adjacent.
 */
export const M7_NEO_LESSONS: LessonContent[] = [
  NEO_KATAKANA_ROW_LESSONS["a"],
  byId("ja-m7-neo-1"),
  byId("ja-m7-neo-2"),
  byId("ja-m7-neo-3"),
  byId("ja-m7-neo-review-1"),
  byId("ja-m7-neo-4"),
  byId("ja-m7-neo-5"),
  byId("ja-m7-neo-6"),
  NEO_KATAKANA_ROW_LESSONS["ka"],
  byId("ja-m7-neo-review-2"),
  byId("ja-m7-neo-7"),
  byId("ja-m7-neo-8"),
  byId("ja-m7-neo-9"),
  byId("ja-m7-neo-review-3"),
  byId("ja-m7-neo-challenge"),
];
