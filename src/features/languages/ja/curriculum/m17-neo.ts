/**
 * m17-neo — FAMILY I: YOUR SIDE (うち). The humble family set (ちち / はは /
 * あに / あね / おとうと / いもうと + きょうだい), the two counters it
 * immediately needs (〜にん for people, 〜さい for age), and the adnominal
 * demonstratives この / その / あの / どの — spine tile n07.
 *
 * Per spinePlan n07 this module teaches the YOUR-SIDE set ONLY; the
 * others'-side honorific words (おとうさん / おかあさん / おにいさん /
 * おねえさん) wait for Family II at m21 so a learner never holds two words
 * for "mother" at once. See the IR notes for the full ruling.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m17.ir.yaml`
 * (`node scripts/compile-ir.mjs m17`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m17Ir from "./ir/m17.ir.json";

const COMPILED: LessonContent[] = compileModule(m17Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m17-neo: compiled lesson ${id} missing`);
  return l;
};

export const M17_NEO_LESSONS: LessonContent[] = [
  byId("ja-m17-neo-1"),
  byId("ja-m17-neo-2"),
  byId("ja-m17-neo-3"),
  byId("ja-m17-neo-review-1"),
  byId("ja-m17-neo-4"),
  byId("ja-m17-neo-5"),
  byId("ja-m17-neo-6"),
  byId("ja-m17-neo-review-2"),
  byId("ja-m17-neo-7"),
  byId("ja-m17-neo-8"),
  byId("ja-m17-neo-9"),
  byId("ja-m17-neo-review-3"),
  byId("ja-m17-neo-challenge"),
];
