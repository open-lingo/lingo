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

/**
 * ⚠️ The te ladder runs 1 → 2 → 10 → review → 11 → 3. The two high ids are
 * NEW lessons (2026-08-06) slotted into the middle of the ladder, not appended
 * to the end: every ending of the sound-change table now gets its own lesson
 * beat, which took the module from three te lessons to five. They kept fresh
 * ids rather than renumbering 3-9, because `courseAtoms.introducedByLessonId`
 * pins atoms to specific lesson ids and a static entry SUPPRESSES the
 * module-fallback unlock path (CLAUDE.md landmine) — renumbering would have
 * silently orphaned every m8 word. Read the ORDER here, not the ids.
 */
export const M8_NEO_LESSONS: LessonContent[] = [
  NEO_KATAKANA_ROW_LESSONS["sa"],
  byId("ja-m8-neo-1"), // る-verbs → て
  byId("ja-m8-neo-2"), // う・つ・る → って
  byId("ja-m8-neo-10"), // む・ぶ・ぬ → んで
  byId("ja-m8-neo-review-1"),
  byId("ja-m8-neo-11"), // く → いて, ぐ → いで, す → して
  byId("ja-m8-neo-3"), // the rebels: いく, する, くる
  byId("ja-m8-neo-4"),
  byId("ja-m8-neo-5"),
  byId("ja-m8-neo-6"),
  byId("ja-m8-neo-review-2"),
  NEO_KATAKANA_ROW_LESSONS["ta"],
  byId("ja-m8-neo-7"),
  byId("ja-m8-neo-8"),
  byId("ja-m8-neo-9"),
  byId("ja-m8-neo-review-3"),
  byId("ja-m8-neo-challenge"),
];
