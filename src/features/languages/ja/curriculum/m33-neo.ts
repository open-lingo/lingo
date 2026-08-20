/**
 * m33-neo — the FOURTH module of the JLPT N4 tier. Spine unit `n4-04`
 * (`docs/spine-n4.md` §`n4-04`), "Transitivity I: 自動詞/他動詞 — が vs を".
 *
 * The spine calls this the single highest-attrition module in the tier, and it
 * is placed fourth on purpose: the passive operates on a 他動詞 (m40), the
 * causative's を/に split is a transitivity fact (m45), and てある requires a
 * 他動詞 while ている-resultative requires a 自動詞 (m41). Almost everything
 * downstream sits on this.
 *
 * The payload is three facts and one mechanical test.
 *
 *  - **Every verb is one or the other**, and a "pair" is TWO DIFFERENT VERBS
 *    rather than a conjugation. Nothing turns あく into あける; they are two
 *    dictionary entries about the same event from two sides.
 *  - **The PARTICLE is the tell.** 自動詞 takes が, 他動詞 takes を. ドアが あく /
 *    ドアを あける. The learner is never asked to feel a difference, only to
 *    read one off the sentence — which is what makes the module drillable.
 *  - **自動詞 + ている is the RESULTATIVE** (L9), and it finishes the job m14
 *    started: m14 taught that ている splits into ongoing and state and could
 *    not say which verbs do which, because the answer is verb class.
 *
 * NINE pairs, in three blocks (Spencer 2026-08-19: "teach as many as feels
 * comfortable, but split it up well… glance over the final 3 sets and then
 * re-cement them by using them in sentence examples for the next module").
 *
 *  - **A, the rule** (L1–L3, review L4): あく/あける · しまる/しめる · はいる/いれる
 *  - **B, the drill** (L5–L7, review L8): とまる/とめる · きまる/きめる · きえる/けす
 *  - **the payoff** (L9): 自動詞 + ている, no new pair
 *  - **C, the glance** (L10–L11, review L12): はじまる/はじめる · でる/だす ·
 *    おちる/おとす — recognition weight only, re-cemented in m34's sentence
 *    examples, which is where the second rep is scheduled to land
 *  - **the assessment** (L13): all nine, shuffled, no new words
 *
 * Five of the nine arrive with a half the learner already owns (あける m14,
 * しめる m14, はいる m16, とまる m32, きめる m30), so the new word is HALF a pair
 * and the lesson can spend its attention on the particle. That is why the
 * module ships 24 new atoms against the spine's 32 — the spine's own risk note
 * says the fix here is FEWER things, not more explanation.
 *
 * EVERY PAIR VERB IS `imageable: false`, and that is pedagogy rather than a
 * glyph shortage: no picture distinguishes あく from あける, so an image debut
 * for either half would teach that they are interchangeable — the one error
 * this module exists to prevent. The image budget goes to the three new carrier
 * nouns (エレベーター, ひきだし, かいぎ).
 *
 * NO SCENE. The shape m33 wants — one object drawn twice, once with an agent
 * arrow and を and once without and が — is not any of the five shipped scene
 * kinds, and `transfer` is a trap: it is hardwired to two PEOPLE either side of
 * an うち/そと boundary and would teach that transitivity is about something
 * moving between parties. Recorded in the IR as a scene candidate.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m33.ir.yaml`
 * (`node scripts/compile-ir.mjs m33`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 14 lessons = 10 teaching + 3 review + 1 challenge, challenge
 * LAST. The extra teaching lesson over m32's 13 is the resultative, which is
 * really a second grammar point and earns its own slot. NO katakana rows, so
 * the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m33Ir from "./ir/m33.ir.json";

const COMPILED: LessonContent[] = compileModule(m33Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m33-neo: compiled lesson ${id} missing`);
  return l;
};

export const M33_NEO_LESSONS: LessonContent[] = [
  byId("ja-m33-neo-1"),
  byId("ja-m33-neo-2"),
  byId("ja-m33-neo-3"),
  byId("ja-m33-neo-review-1"),
  byId("ja-m33-neo-5"),
  byId("ja-m33-neo-6"),
  byId("ja-m33-neo-7"),
  byId("ja-m33-neo-review-2"),
  byId("ja-m33-neo-9"),
  byId("ja-m33-neo-10"),
  byId("ja-m33-neo-11"),
  byId("ja-m33-neo-review-3"),
  byId("ja-m33-neo-13"),
  byId("ja-m33-neo-challenge"),
];
