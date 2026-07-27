/**
 * m24-neo — CAN & LET'S. Spine tile s21.
 *
 * The milestone on the tile is "closes the old course's potential-form gap":
 * the archived course taught できる and nothing else, so a learner could say
 * they were able to DO things and never able to drink, swim, walk or come.
 * This module teaches the whole system — う-verbs slide to the え row and add
 * る (のむ → のめる), る-verbs attach られる (たべる → たべられる), くる becomes
 * こられる, and する has no potential at all because Japanese already had
 * できる. The particle flip rides along: 「おさけを のむ」 but 「おさけが
 * のめる」, and it is taught as the same が that has marked the thing under
 * discussion since 「かぎが ある」 in m6.
 *
 * Because every potential form is itself a る-verb, L5's negative is m6's
 * `nai-form` re-taught on a new stem rather than a new grammar point — which
 * is the module's own argument for learning the potential as a FORM.
 *
 * **ら抜きことば is RECOGNITION ONLY**, exactly as the spine words it: たべれる
 * and みれる are registered atoms, they appear in the L2 rule card (labelled in
 * the English), two listening-comprehension beats and one dialogue line, and
 * in ZERO production targets anywhere in the course. Understand the short
 * form, produce the long one. `m24-neo.test.ts` holds that line.
 *
 * **Three potential forms are BANNED because their kana are already taken** —
 * かう → かえる is 帰る "to go back", かく → かける is 掛ける "to call by
 * phone", つく → つける is 付ける "to turn on" — and **six verbs are banned from
 * ましょう** because their ます-stem is a registered noun: する→し 四, くる→き
 * 木, かう→かい 貝, まつ→まち 町, つく→つき 月, はなす→はなし 話. 「しましょう」
 * is registered WHOLE so the most useful volitional survives. Both lines are
 * machine-checked.
 *
 * L6 is the 見える/聞こえる nuance beat: みられる says the OPPORTUNITY exists,
 * みえる says the thing is VISIBLE and nobody chose anything. L7/L9 are the
 * ledger's 〜のが じょうず / 〜のが へた, taught with the culture rule attached
 * (じょうず about other people, へた about yourself, あまり じょうずじゃない for
 * everyone else). L10/L11 are ましょう and ませんか, and ませんか shares its
 * lesson with the casual 〜ない？ because the spine calls them "one speech act,
 * both registers".
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m24.ir.yaml`
 * (`node scripts/compile-ir.mjs m24`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order. NO kanji beats — kanji-set-3 is m28's
 * ledger row.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m24Ir from "./ir/m24.ir.json";

const COMPILED: LessonContent[] = compileModule(m24Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m24-neo: compiled lesson ${id} missing`);
  return l;
};

export const M24_NEO_LESSONS: LessonContent[] = [
  byId("ja-m24-neo-1"),
  byId("ja-m24-neo-2"),
  byId("ja-m24-neo-3"),
  byId("ja-m24-neo-review-1"),
  byId("ja-m24-neo-5"),
  byId("ja-m24-neo-6"),
  byId("ja-m24-neo-7"),
  byId("ja-m24-neo-review-2"),
  byId("ja-m24-neo-9"),
  byId("ja-m24-neo-10"),
  byId("ja-m24-neo-11"),
  byId("ja-m24-neo-review-3"),
  byId("ja-m24-neo-challenge"),
];
