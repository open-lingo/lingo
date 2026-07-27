/**
 * m23-neo — EXPERIENCE & INTENT. Spine tile s22.
 *
 * The module's argument is that neither of its constructions is a tense.
 * 「にほんに いった」 is I went to Japan, one trip on a calendar; 「にほんに
 * いった ことが ある」 is I have been to Japan, at some point, ever — a
 * statement that the EXPERIENCE exists, built out of m15's こと, m6's が and
 * m6's ある, which is why its negative is 「ことが ない」 and never a past
 * negative. And 「いく つもりだ」 is a DECISION, not a future and not a wish:
 * L5 exists so the learner can say 「にほんに いきたいけど いく つもりは ない」
 * and mean it.
 *
 * It is also the DEEPEN beat on subordinate clauses — the spiral partner of
 * s11 (m15) — so the second half takes the clause machinery further than m15
 * ever did: L9 is the relative-tense flip s11 explicitly deferred here
 * (「いく とき」 buys the plane ticket, 「いった とき」 eats the sushi), L10 puts
 * 〜てから against 〜まえに on one itinerary, and L11 embeds a whole つもり /
 * ことが ある clause under と おもう.
 *
 * **する's plain past is BANNED from this module**, verified rather than
 * assumed: 「した」 is the registered atom for 下 "below", so 「〜した ことが
 * ある」 would tile した and credit the wrong word with nothing erroring. くる's
 * 「きた」 is banned for the same reason (北 "north"), and ある's 「あった」 is
 * unregistered because it would collide with 会った "met". A trip is
 * 「りょこうに いった ことが ある」, which is what a Japanese speaker says anyway.
 * `m23-neo.test.ts` holds all three lines.
 *
 * kanji-set-2 ships as m18 shipped set 1 — the `kind: kanji` beat compiling to
 * the shipped `kanji_reading` factory, eight glyphs (山 川 海 上 下 小さい 足
 * 来る), sprinkled five/one/one/one rather than walled, every one on a word the
 * course taught and whose rollout unlock is m9–m21, so all eight read BARE at
 * m23.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m23.ir.yaml`
 * (`node scripts/compile-ir.mjs m23`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m23Ir from "./ir/m23.ir.json";

const COMPILED: LessonContent[] = compileModule(m23Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m23-neo: compiled lesson ${id} missing`);
  return l;
};

export const M23_NEO_LESSONS: LessonContent[] = [
  byId("ja-m23-neo-1"),
  byId("ja-m23-neo-2"),
  byId("ja-m23-neo-3"),
  byId("ja-m23-neo-review-1"),
  byId("ja-m23-neo-5"),
  byId("ja-m23-neo-6"),
  byId("ja-m23-neo-7"),
  byId("ja-m23-neo-review-2"),
  byId("ja-m23-neo-9"),
  byId("ja-m23-neo-10"),
  byId("ja-m23-neo-11"),
  byId("ja-m23-neo-review-3"),
  byId("ja-m23-neo-challenge"),
];
