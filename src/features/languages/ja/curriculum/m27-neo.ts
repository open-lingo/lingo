/**
 * m27-neo — EXPLAINING: んだ/んです, すぎる, く/に なる. Spine tile s23, whose
 * own line reads "んだ/んです explanatory — one item, two skins; すぎる;
 * く/になる change of state". RUN-PLAN-n4 row 27 owes `n-desu`, `sugiru` and
 * `ku-ni-naru`, and all three are taught on rule cards (L1, L6, L9).
 *
 * Three shapes, each attaching to something the learner already owns and none
 * of them touching the word in front of it:
 *
 *  - **んだ** is a whole-sentence suffix, not a verb ending. Say the plain
 *    sentence and put んだ on the end (いくんだ / たかいんだ / いかないんだ).
 *    After a NOUN or な-adjective the copula comes first and だ turns into な:
 *    びょうきなんだ. **んです is the SAME ITEM in the other skin** — the tile's
 *    "one item, two skins" — and the clause in front of ん stays PLAIN in both.
 *  - **すぎる** attaches to a STEM: the ます-stem for verbs (たべすぎる, two
 *    tiles, the surface m19's 〜に いく already built), and the bare stem for
 *    adjectives — which exists in no lexicon here, so たかすぎる / さむすぎる /
 *    しずかすぎる are registered WHOLE, exactly as m12 registered たかくない.
 *  - **なる** takes く from an い-adjective and に from everything else. なった
 *    is the past, and a change is usually reported in it (L11).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m27.ir.yaml`
 * (`node scripts/compile-ir.mjs m27`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m27Ir from "./ir/m27.ir.json";

const COMPILED: LessonContent[] = compileModule(m27Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m27-neo: compiled lesson ${id} missing`);
  return l;
};

export const M27_NEO_LESSONS: LessonContent[] = [
  byId("ja-m27-neo-1"),
  byId("ja-m27-neo-2"),
  byId("ja-m27-neo-3"),
  byId("ja-m27-neo-review-1"),
  byId("ja-m27-neo-5"),
  byId("ja-m27-neo-6"),
  byId("ja-m27-neo-7"),
  byId("ja-m27-neo-review-2"),
  byId("ja-m27-neo-9"),
  byId("ja-m27-neo-10"),
  byId("ja-m27-neo-11"),
  byId("ja-m27-neo-review-3"),
  byId("ja-m27-neo-challenge"),
];
