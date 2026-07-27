/**
 * m19-neo — GETTING AROUND: MOTION PARTICLES. に for the place you arrive at,
 * へ for the direction you head (written he, READ e), で for the means you go
 * by, ます-stem + に いく for the purpose, 〜ふん/〜ぷん for the minutes, and
 * から / までに for the clock a journey runs on — spine tile s15.
 *
 * The module's argument is that it introduces almost nothing: destination is
 * に's third job, means is で's other job, and clock-から is から's third. The
 * ONE genuinely new surface is へ, and the single most confusing fact about it
 * is its spelling, which is why the L2 card opens on the reading rather than
 * on the meaning.
 *
 * 〜に いく was BLOCKED until 2026-07-27 — a bare ます-stem existed in no
 * lexicon here, which is why m13 deferred `ni-iku` to this row. The tokenizer
 * and `getRealFormLexicon()` both learned stems, so 「たべに いく」 builds as
 * たべ / に / いく and the deferral is paid off.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m19.ir.yaml`
 * (`node scripts/compile-ir.mjs m19`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m19Ir from "./ir/m19.ir.json";

const COMPILED: LessonContent[] = compileModule(m19Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m19-neo: compiled lesson ${id} missing`);
  return l;
};

export const M19_NEO_LESSONS: LessonContent[] = [
  byId("ja-m19-neo-1"),
  byId("ja-m19-neo-2"),
  byId("ja-m19-neo-3"),
  byId("ja-m19-neo-review-1"),
  byId("ja-m19-neo-4"),
  byId("ja-m19-neo-5"),
  byId("ja-m19-neo-6"),
  byId("ja-m19-neo-review-2"),
  byId("ja-m19-neo-7"),
  byId("ja-m19-neo-8"),
  byId("ja-m19-neo-9"),
  byId("ja-m19-neo-review-3"),
  byId("ja-m19-neo-challenge"),
];
