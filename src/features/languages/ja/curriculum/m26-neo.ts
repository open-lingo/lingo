/**
 * m26-neo — COMPARISONS II: 〜の なかで … いちばん. Spine tile n14, the DEEPEN
 * beat of the comparison spiral m20 opened (n09 shipped のほうが…より and
 * deliberately withheld いちばん — the s20 split).
 *
 * A superlative here is a comparison with the FIELD NAMED, assembled from four
 * things the learner already owns: なか is m6's ordinary noun "inside", so it
 * takes の in front and で behind (「たべものの なかで」); the winner takes が,
 * which is が's oldest job; and いちばん is an ADVERB that never touches the
 * predicate — たかい stays たかい, しずかだ keeps its だ, はたらく takes none.
 *
 * The one decision the learner has to make is how many things are on the table.
 * TWO take m20's ほうが…より. THREE OR MORE take なかで…いちばん. The frames
 * never stack, which is L5's antiPattern and the whole point of the spiral beat.
 *
 * ほど is DEFERRED to m37 (spine-n4 §1.1) and appears nowhere.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m26.ir.yaml`
 * (`node scripts/compile-ir.mjs m26`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m26Ir from "./ir/m26.ir.json";

const COMPILED: LessonContent[] = compileModule(m26Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m26-neo: compiled lesson ${id} missing`);
  return l;
};

export const M26_NEO_LESSONS: LessonContent[] = [
  byId("ja-m26-neo-1"),
  byId("ja-m26-neo-2"),
  byId("ja-m26-neo-3"),
  byId("ja-m26-neo-review-1"),
  byId("ja-m26-neo-5"),
  byId("ja-m26-neo-6"),
  byId("ja-m26-neo-7"),
  byId("ja-m26-neo-review-2"),
  byId("ja-m26-neo-9"),
  byId("ja-m26-neo-10"),
  byId("ja-m26-neo-11"),
  byId("ja-m26-neo-review-3"),
  byId("ja-m26-neo-challenge"),
];
