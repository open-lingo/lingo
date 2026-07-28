/**
 * m28-neo — MUST & SHOULD: なきゃ/なければ ならない, たほうがいい, kanji-set-3.
 * Spine tile s24, whose own line reads "なければならない + casual なきゃ/なくちゃ;
 * たほうがいい advice". RUN-PLAN-n4 row 28 owes `nakereba-naranai`,
 * `hou-ga-ii` and `kanji-set-3`, and all three are taught on rule cards
 * (L1, L6, L9).
 *
 * Japanese has no word for "must" — it has a sentence saying the alternative
 * is not an option, and the interesting half is the one that gets dropped:
 *
 *  - **なきゃ** is the ない-form with its ない swapped out (いかない → いかなきゃ).
 *    It ends the sentence on its own, and it is what the learner will actually
 *    hear. **なければ ならない** is what it contracts FROM, and **なくちゃ** is
 *    the same move on なくては. Every must-form is registered WHOLE, because
 *    the ない-STEM it attaches to (いか / のま / かえら) exists in no lexicon in
 *    this repo — probed, and 「いかなきゃ」 fragments to い · かな · き · ゃ
 *    without it.
 *  - **なければ なりません** is the polite pole; only the last piece changes,
 *    and there is no polite なきゃ because なきゃ already ate the ending.
 *  - **〜た ほうが いい** is advice, built entirely out of parts the learner
 *    already owns (m20's ほう, が, m12's いい, m11's た-forms). The negative
 *    side is the plain ない-form, never a past negative.
 *  - **kanji-set-3 is the COMPOUND set** — 会社 · 時間 · 電話 · 学校 · 先生 ·
 *    天気 · 外国 all take on-readings, and 話す is the same 話 read はな.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m28.ir.yaml`
 * (`node scripts/compile-ir.mjs m28`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m28Ir from "./ir/m28.ir.json";

const COMPILED: LessonContent[] = compileModule(m28Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m28-neo: compiled lesson ${id} missing`);
  return l;
};

export const M28_NEO_LESSONS: LessonContent[] = [
  byId("ja-m28-neo-1"),
  byId("ja-m28-neo-2"),
  byId("ja-m28-neo-3"),
  byId("ja-m28-neo-review-1"),
  byId("ja-m28-neo-5"),
  byId("ja-m28-neo-6"),
  byId("ja-m28-neo-7"),
  byId("ja-m28-neo-review-2"),
  byId("ja-m28-neo-9"),
  byId("ja-m28-neo-10"),
  byId("ja-m28-neo-11"),
  byId("ja-m28-neo-review-3"),
  byId("ja-m28-neo-challenge"),
];
