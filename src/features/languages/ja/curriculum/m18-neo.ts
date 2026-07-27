/**
 * m18-neo — SAYING & THINKING: とおもう + という. The quotation particle と,
 * the two verbs it feeds (おもう, いう), and the first kanji READING set —
 * spine tile n08.
 *
 * The whole module is one idea: と closes a COMPLETE PLAIN SENTENCE and hands
 * it to a verb of thinking or saying. 「あした いくと おもう」 reorders nothing
 * and adds nothing — the clause in front of と is exactly the sentence the
 * learner would say on its own. And it stays PLAIN however polite the outer
 * sentence gets, which is the payoff of teaching plain form first.
 *
 * `kanji-set-1` lands here as a READING ladder (kanji shown bare → pick the
 * kana reading) through the new `kind: kanji` IR beat, which is a thin front
 * door onto the course's shipped `kanjiReading` factory. See the IR notes.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m18.ir.yaml`
 * (`node scripts/compile-ir.mjs m18`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m18Ir from "./ir/m18.ir.json";

const COMPILED: LessonContent[] = compileModule(m18Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m18-neo: compiled lesson ${id} missing`);
  return l;
};

export const M18_NEO_LESSONS: LessonContent[] = [
  byId("ja-m18-neo-1"),
  byId("ja-m18-neo-2"),
  byId("ja-m18-neo-3"),
  byId("ja-m18-neo-review-1"),
  byId("ja-m18-neo-4"),
  byId("ja-m18-neo-5"),
  byId("ja-m18-neo-6"),
  byId("ja-m18-neo-review-2"),
  byId("ja-m18-neo-7"),
  byId("ja-m18-neo-8"),
  byId("ja-m18-neo-9"),
  byId("ja-m18-neo-review-3"),
  byId("ja-m18-neo-challenge"),
];
