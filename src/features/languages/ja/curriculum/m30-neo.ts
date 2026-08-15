/**
 * m30-neo — **THE FIRST MODULE OF THE JLPT N4 TIER.** Spine unit `n4-01`
 * (`docs/spine-n4.md` §2), "て + helper I: 〜てみる / 〜ておく".
 *
 * The payload is NOT 〜てみる. It is **THE SLOT**: a て-form can have an ordinary
 * verb parked behind it whose meaning has been bleached away, and that HELPER
 * carries all the conjugation while the main verb never moves again
 * (たべてみる / たべてみた / たべてみない). Front-loading the schema is what lets
 * m35 (てくれる), m38 (てしまう / ていく), m41 (てある), m47 (てほしい) and m50
 * (ていただく) each teach ONE thing instead of re-deriving "て + verb" five times.
 *
 *  - **Two helpers.** みる — do it and see. おく — do it in advance, or leave it
 *    done. 〜とく is RECOGNITION only (spine D15).
 *  - **The antiPattern the spine names as the classic learner error:** 〜てみる
 *    does NOT mean "try to". That is 〜ようとする and it lands at m34. L7 is the
 *    whole lesson.
 *  - **Zero new morphology.** て has been owned since m8 and た since m11, so the
 *    tier opens on a confidence beat. The only derivations are the て-forms of
 *    this module's own five new verbs, and those ride two real
 *    `conjugation_transform` ramps against the shipped `te` ruleset (inv 49).
 *  - **Nothing is registered as a compound.** 「たべてみる」 tiles to たべて · みる,
 *    so the learner ASSEMBLES the schema out of parts they already own — which
 *    is also why every 〜てみる / 〜ておく surface is written CLOSED, with no
 *    space: `applyKanjiSurfaces` kanji-fies a run only when it holds exactly one
 *    dictionary word, so an authored space would have shipped 「たべて 見る」.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m30.ir.yaml`
 * (`node scripts/compile-ir.mjs m30`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the compiled
 * order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m30Ir from "./ir/m30.ir.json";

const COMPILED: LessonContent[] = compileModule(m30Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m30-neo: compiled lesson ${id} missing`);
  return l;
};

export const M30_NEO_LESSONS: LessonContent[] = [
  byId("ja-m30-neo-1"),
  byId("ja-m30-neo-2"),
  byId("ja-m30-neo-3"),
  byId("ja-m30-neo-review-1"),
  byId("ja-m30-neo-5"),
  byId("ja-m30-neo-6"),
  byId("ja-m30-neo-7"),
  byId("ja-m30-neo-review-2"),
  byId("ja-m30-neo-9"),
  byId("ja-m30-neo-10"),
  byId("ja-m30-neo-11"),
  byId("ja-m30-neo-review-3"),
  byId("ja-m30-neo-challenge"),
];
