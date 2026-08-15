/**
 * m31-neo — the SECOND module of the JLPT N4 tier. Spine unit `n4-02`
 * (`docs/spine-n4.md` §2), "Give & receive I: あげる・くれる・もらう (things)".
 *
 * The payload is not three words, it is **ONE AXIS**. English has a single verb
 * where Japanese has three, and what picks between them is neither politeness
 * nor tense nor who is speaking — it is WHICH WAY THE THING MOVED relative to
 * the speaker. That うち / そと line has never been needed in this course before
 * and is needed for the rest of it.
 *
 *  - **あげる points away, くれる points in, もらう points in and moves the
 *    subject.** The first two describe one event from opposite ends; the third
 *    re-topicalises it around the receiver. One fact, taught three ways.
 *  - **The hard ban is structural, not a footnote.** ×わたしにあげる is broken
 *    the way "I gave me a present" is broken — あげる's arrow leaves the
 *    speaker's circle and has nowhere to land inside it. L7 is the whole lesson
 *    and the antiPattern names it.
 *  - **ZERO て-FORMS, of any verb, anywhere in the module.** 〜てあげる /
 *    〜てくれる / 〜てもらう are n4-06, five modules out, and the spine splits the
 *    DIRECTION axis (here) from the SCHEMA axis (m35) from the REGISTER axis
 *    (m50) so that no module carries two at once. Complexity comes from
 *    から / けど / とき instead. `m31-neo.test.ts` scans compiled output and
 *    asserts zero.
 *  - **くださる / いただく are RECOGNITION ONLY** (spine n4-02; production at
 *    n4-21). They appear on a rule card, a `listening-comp` and a dialogue line,
 *    are never a build or speaking target, and never enter a `reviewPool`.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m31.ir.yaml`
 * (`node scripts/compile-ir.mjs m31`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the compiled
 * order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m31Ir from "./ir/m31.ir.json";

const COMPILED: LessonContent[] = compileModule(m31Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m31-neo: compiled lesson ${id} missing`);
  return l;
};

export const M31_NEO_LESSONS: LessonContent[] = [
  byId("ja-m31-neo-1"),
  byId("ja-m31-neo-2"),
  byId("ja-m31-neo-3"),
  byId("ja-m31-neo-review-1"),
  byId("ja-m31-neo-5"),
  byId("ja-m31-neo-6"),
  byId("ja-m31-neo-7"),
  byId("ja-m31-neo-review-2"),
  byId("ja-m31-neo-9"),
  byId("ja-m31-neo-10"),
  byId("ja-m31-neo-11"),
  byId("ja-m31-neo-review-3"),
  byId("ja-m31-neo-challenge"),
];
