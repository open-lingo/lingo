/**
 * m34-neo — the FIFTH module of the JLPT N4 tier. Spine unit `n4-05`
 * (`docs/spine-n4.md` §`n4-05`), "Volitional: よう/おう + とおもう, ことにする".
 *
 * The payoff module after the transitivity wall, and by design a breather:
 * every piece attaches to something already owned (ましょう m24, とおもう m18,
 * こと m15, つもり m23, なる m27), so the only genuinely new thing on screen
 * is the volitional's own conjugation.
 *
 * The module's thesis, drilled everywhere: **the volitional is the BASE, and
 * ましょう is its polite derivative.** The learner has produced のみましょう
 * since m24; L1 reveals it was のもう wearing the ます layer all along — the
 * course's "politeness is a layer" claim (m7) landing on a form learned
 * backwards.
 *
 *  - **L1–L2, formation**: u-verbs slide the last sound to the o-row + う
 *    (のもう/いこう/かおう); ru-verbs drop る + よう; しよう/こよう are two
 *    words, not a rule. Transform-card ramp + rule table per the standing
 *    formation rule (`volitional` ChainForm landed 2026-08-24).
 *  - **L3, invitation**: 「いこう？」 with the question's rise — pairwise
 *    against m24's ませんか/ましょうか, register picked by audience. Carries
 *    the JA course's FIRST `dialogue_sim` (Saturday plans with Ken).
 *  - **L5, intent**: 〜(よ)うとおもう — a volitional inside m18's とおもう;
 *    temperature-contrasted with つもり (m23).
 *  - **L6–L7, decisions**: ことにする (you push) vs ことになる (it lands on
 *    you) — the volition/no-volition minimal pair, split across two lessons
 *    and contrasted on the second.
 *  - **L9, attempt**: 〜(よ)うとする, RECOGNITION-weight, explicitly split
 *    from m30's てみる (do-and-see vs almost-did — English "try" flattens
 *    them). Hosts the m33 glance-pair spends (おちる/おとす).
 *  - **L10, goals**: もくひょう/がんばる + the polite room — the second
 *    `dialogue_sim` runs the same suggestion machine in polite dress with
 *    Tanaka (がんばります/しましょう), so the ましょう-is-derived thesis gets
 *    a lived register contrast.
 *
 * m33 RE-CEMENT (Spencer 2026-08-19, ratchet in m33-neo.test.ts): all six
 * glance verbs — はじまる/はじめる/でる/だす/おちる/おとす — appear in this
 * module's sentence examples; the second rep m33 scheduled lands here.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m34.ir.yaml`
 * (`node scripts/compile-ir.mjs m34`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m34Ir from "./ir/m34.ir.json";

const COMPILED: LessonContent[] = compileModule(m34Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m34-neo: compiled lesson ${id} missing`);
  return l;
};

export const M34_NEO_LESSONS: LessonContent[] = [
  byId("ja-m34-neo-1"),
  byId("ja-m34-neo-2"),
  byId("ja-m34-neo-3"),
  byId("ja-m34-neo-review-1"),
  byId("ja-m34-neo-5"),
  byId("ja-m34-neo-6"),
  byId("ja-m34-neo-7"),
  byId("ja-m34-neo-review-2"),
  byId("ja-m34-neo-9"),
  byId("ja-m34-neo-10"),
  byId("ja-m34-neo-review-3"),
  byId("ja-m34-neo-challenge"),
];
