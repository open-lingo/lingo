/**
 * m25-neo — CONJECTURE. Spine tile n13.
 *
 * でしょう is a SENTENCE-ENDER, not a verb ending: it stands behind a finished
 * plain sentence and downgrades it from a claim to an expectation. That is why
 * the module teaches it as three cheap rungs rather than a conjugation table —
 * after a noun or な-adjective the だ disappears (「あめだ」 → 「あめでしょう」),
 * after an い-adjective nothing happens at all, and after a verb nothing happens
 * either (「ふるでしょう」, 「たべたでしょう」, 「こないでしょう」). Weather and the
 * four seasons are the domain, because a forecast is where the form lives.
 *
 * **The module is deliberately NOT a certainty ladder.** m43 (spine n4-14) owns
 * かもしれない < でしょう/だろう < はず < にちがいない and files m25 as its DEEPEN
 * target, so none of those three appears here, not even as recognition.
 *
 * **だろう is RECOGNITION, with ONE production carve-out: 何だろう.** The spine's
 * audit note is the reason — sentence-final だろう aimed at a listener reads
 * blunt and markedly masculine — so the module produces question-word + だろう
 * (「なんだろう」, 「だれだろう」, self-talk, no listener) and only ever HEARS the
 * sentence-final kind. Same shape m24 used for ら抜き. Machine-checked in
 * `m25-neo.test.ts`.
 *
 * かな is the casual production target the spine asks for and it is NOT a
 * question — every gloss is "I wonder …", never "Is it …?". でしょ is でしょう
 * with the tail clipped, and its rising contour asks the listener to agree
 * ("あついでしょ？" — it's hot, right?). L11 is the spine's ⟳ deepen of n08:
 * 〜と おもう says whose view it is, でしょう says how likely the claim is, and
 * the card's antiPattern (「ふるでしょうと おもう」) is wrong for m18's own reason
 * — politeness never goes inside a quotation.
 *
 * FIVE new courseAtoms rows (でしょう / でしょ / だろう / かな / きっと); the whole
 * weather + seasons domain already had rows under stale old-course tags and is
 * declared in the IR's `newAtoms` only. かな was the risky registration — the
 * string sits inside 520 live surfaces (いかない, さかな, しずかな) — and it was
 * MEASURED: the whole-course compiled-tile dump was byte-identical before and
 * after. No past-tense weather verb ships anywhere, because 「ふった」 has no
 * atom row and no lexicon here can spell it.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m25.ir.yaml`
 * (`node scripts/compile-ir.mjs m25`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the programme ended at m11, so the compiled order IS
 * the shipped order. NO kanji beats — kanji-set-3 is m28's ledger row.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m25Ir from "./ir/m25.ir.json";

const COMPILED: LessonContent[] = compileModule(m25Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m25-neo: compiled lesson ${id} missing`);
  return l;
};

export const M25_NEO_LESSONS: LessonContent[] = [
  byId("ja-m25-neo-1"),
  byId("ja-m25-neo-2"),
  byId("ja-m25-neo-3"),
  byId("ja-m25-neo-review-1"),
  byId("ja-m25-neo-5"),
  byId("ja-m25-neo-6"),
  byId("ja-m25-neo-7"),
  byId("ja-m25-neo-review-2"),
  byId("ja-m25-neo-9"),
  byId("ja-m25-neo-10"),
  byId("ja-m25-neo-11"),
  byId("ja-m25-neo-review-3"),
  byId("ja-m25-neo-challenge"),
];
