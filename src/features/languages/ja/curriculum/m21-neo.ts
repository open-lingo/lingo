/**
 * m21-neo — LISTING & DESCRIBING: や, たり, carrying FAMILY II. Spine tile s19.
 *
 * The module's argument is that a Japanese list tells you whether it is
 * FINISHED. と closes it (「いぬと ねこが いる」 — those two and no more); や
 * leaves it open (「いぬや ねこが いる」 — those two among others), and など
 * says the open end out loud. English has one word for both, so や taught
 * alone just becomes a second "and" — the CONTRAST is the lesson, which is
 * why L2 puts と straight back beside it.
 *
 * 〜たり 〜たり する is the same idea done to verbs, built on the plain past the
 * learner already owns: たべた → たべたり. **The PAST たり list is banned** —
 * it wants した on the end, and した is the registered atom 下 "below" (m17),
 * so it would tile a direction word and credit the wrong atom silently.
 *
 * FAMILY II is the spiral's second beat on family, deferred from m17 by the
 * spine so the learner never holds two words for "mother" at once. おかあさん /
 * おとうさん / おにいさん / おねえさん name SOMEONE ELSE'S family; m17's はは /
 * ちち / あに / あね name your own. の carries the whole distinction, and every
 * graded family item here says whose family it means.
 *
 * The ledger row also owes the cup counter 〜はい (moved m22→m21 because a
 * listing module is where a counter is actually used). **Every 〜はい cell is a
 * WHOLE ATOM**: the base form はい cannot be registered — it is already the m3
 * interjection "yes", and `JA_COURSE_ATOMS_BY_KANA` is last-wins — so no cell
 * can compose the way m19's さん + ぷん and m20's ご + ひゃく did.
 * `m21-neo.test.ts` checks every 〜はい surface against the number in front of
 * it.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m21.ir.yaml`
 * (`node scripts/compile-ir.mjs m21`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m21Ir from "./ir/m21.ir.json";

const COMPILED: LessonContent[] = compileModule(m21Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m21-neo: compiled lesson ${id} missing`);
  return l;
};

export const M21_NEO_LESSONS: LessonContent[] = [
  byId("ja-m21-neo-1"),
  byId("ja-m21-neo-2"),
  byId("ja-m21-neo-3"),
  byId("ja-m21-neo-review-1"),
  byId("ja-m21-neo-4"),
  byId("ja-m21-neo-5"),
  byId("ja-m21-neo-6"),
  byId("ja-m21-neo-review-2"),
  byId("ja-m21-neo-7"),
  byId("ja-m21-neo-8"),
  byId("ja-m21-neo-9"),
  byId("ja-m21-neo-review-3"),
  byId("ja-m21-neo-challenge"),
];
