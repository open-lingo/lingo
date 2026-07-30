/**
 * m13-neo — WANTING: たい + ほしい (spine tile n05).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m13.ir.yaml`
 * (`node scripts/compile-ir.mjs m13`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m13Ir from "./ir/m13.ir.json";

const COMPILED: LessonContent[] = compileModule(m13Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m13-neo: compiled lesson ${id} missing`);
  return l;
};

export const M13_NEO_LESSONS: LessonContent[] = [
  byId("ja-m13-neo-1"),
  byId("ja-m13-neo-2"),
  byId("ja-m13-neo-3"),
  byId("ja-m13-neo-review-1"),
  byId("ja-m13-neo-4"),
  byId("ja-m13-neo-5"),
  byId("ja-m13-neo-6"),
  byId("ja-m13-neo-review-2"),
  byId("ja-m13-neo-7"),
  byId("ja-m13-neo-8"),
  byId("ja-m13-neo-9"),
  // Vocab pack 3 (B065/B067, 2026-07-29): the morning routine, after L9 so
  // the whole module's grammar is available; R3 reviews it.
  byId("ja-m13-neo-10"),
  byId("ja-m13-neo-review-3"),
  byId("ja-m13-neo-challenge"),
];
