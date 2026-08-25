/**
 * m38-neo — the NINTH module of the JLPT N4 tier. Spine unit `n4-09`
 * (`docs/spine-n4.md` §`n4-09`), "て + helper II: 〜てしまう/ちゃう +
 * 〜ていく/〜てくる".
 *
 * The second helper beat, eight modules after m30, per the spiral spacing
 * rule — and it waits this long for a content reason: てしまう's regret
 * reading only exists over past events, and its natural spends are mistakes
 * and losses the learner couldn't narrate until た/なかった/から/ので were
 * fluent. Placed immediately before passive (m40) so "something bad happened
 * to me" will have two grammars to reach for.
 *
 *  - **L1–L2, てしまう**: completion (ぜんぶ たべてしまった) then regret —
 *    contrasted ON THE SAME VERB, the spine's named beat: the identical
 *    surface reads proud at your own dinner and sorry over someone else's
 *    cake. The tell is the content, not the form.
 *  - **L3, ちゃう/じゃう as PRODUCTION**: the majority casual form in the
 *    spoken corpora this course optimizes for — the third contraction the
 *    course has drilled as production (なきゃ m28, とく m30). Hosts the
 *    confession sim (Mika's umbrella): こわしちゃった owns it,
 *    こわれちゃった dodges it — m33's transitivity doctrine meeting the
 *    wince.
 *  - **L5–L6, trajectory in SPACE**: もっていく/もってくる; people ride
 *    つれる (the vocabulary deferred from m35 for exactly this frame); and
 *    くる's irregular て survives inside every chain (もってきて).
 *  - **L7, trajectory in TIME** — the half textbooks under-teach: change
 *    arriving (ふえてきた) vs change heading on (かわっていく), over
 *    ふえる/へる/かわる and watchable things.
 *  - **L9**: にほんごに… — なれる and まちがえる give the helpers their
 *    most personal spends; L10 hosts the party-errand sim, whose first
 *    exchange IS the viewpoint lesson: Ken asks なにを もってくる？ and
 *    the learner answers のみものを もっていく — same journey, two anchors.
 *
 * Build tiles stay kana on every helper via the auxiliary-position
 * suppression (2026-08-24) — orthography-driven, no lemma list, which is
 * why this module ships with zero new tile-layer code.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m38.ir.yaml`
 * (`node scripts/compile-ir.mjs m38`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m38Ir from "./ir/m38.ir.json";

const COMPILED: LessonContent[] = compileModule(m38Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m38-neo: compiled lesson ${id} missing`);
  return l;
};

export const M38_NEO_LESSONS: LessonContent[] = [
  byId("ja-m38-neo-1"),
  byId("ja-m38-neo-2"),
  byId("ja-m38-neo-3"),
  byId("ja-m38-neo-review-1"),
  byId("ja-m38-neo-5"),
  byId("ja-m38-neo-6"),
  byId("ja-m38-neo-7"),
  byId("ja-m38-neo-review-2"),
  byId("ja-m38-neo-9"),
  byId("ja-m38-neo-10"),
  byId("ja-m38-neo-review-3"),
  byId("ja-m38-neo-challenge"),
];
