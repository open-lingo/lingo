/**
 * m37-neo — the EIGHTH module of the JLPT N4 tier. Spine unit `n4-08`
 * (`docs/spine-n4.md` §`n4-08`), "Conditionals II: ば + なら".
 *
 * Five modules after conditionals I, deliberately non-adjacent: the four
 * conditionals are mutually confusable the way は/が are, and the standing
 * ruling is PAIRWISE on introduction, N-way only on review — here ば vs たら
 * (L3/L5) and なら vs たら (L7), never ば vs なら, never 3+ hinges in one
 * beat. The 4-way showdown belongs to the m51 capstone alone (ratcheted in
 * this module's test file).
 *
 *  - **L1–L2, formation**: the stem grid's third payout (potential m24,
 *    volitional m34, now ば): u-verbs slide to the e-row + ば; ru-verbs
 *    れば; すれば/くれば; i-adjectives ければ. And THE UNFREEZE — the
 *    highest-value five minutes in the module, per the spine: なければ
 *    ならない (m28) was a plain conditional all along. The course's
 *    signature reveal, third performance (ました, ましょう, now なきゃ).
 *  - **L3, the wall**: an action-verb ば-clause blocks request/command/
 *    invitation main clauses (×たべれば、かってください) — ば's mechanical
 *    tell, exactly as と had one. State-ば is exempt, and the L5 sim
 *    deliberately lives in that exemption (てんきが よければ、いこう).
 *  - **L6–L7, なら**: the conditional that listens — takes what was just
 *    said as its topic, which is why its result can PRECEDE its condition
 *    in time (いくなら かっておく / いったら かう — the timeline flip is
 *    the tell, and m30's ておく rides along).
 *  - **L9, ば〜ほど**: recognition rider (やすければ やすいほど いい);
 *    ほど gets its atom. まにあう/おくれる give the ifs deadline spends.
 *  - **L10, assembly**: hear a plan, pick the hinge, give the advice.
 *
 * DIALOGUE_SIM ×2: L5 Sunday plans with Mika (state-ば invitation, then a
 * たら pivot to うちで えいがを みよう); L10 travel advice for Tom
 * (いくなら、ホテルを よやくした ほうが いい + the ば〜ほど choice).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m37.ir.yaml`
 * (`node scripts/compile-ir.mjs m37`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m37Ir from "./ir/m37.ir.json";

const COMPILED: LessonContent[] = compileModule(m37Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m37-neo: compiled lesson ${id} missing`);
  return l;
};

export const M37_NEO_LESSONS: LessonContent[] = [
  byId("ja-m37-neo-1"),
  byId("ja-m37-neo-2"),
  byId("ja-m37-neo-3"),
  byId("ja-m37-neo-review-1"),
  byId("ja-m37-neo-5"),
  byId("ja-m37-neo-6"),
  byId("ja-m37-neo-7"),
  byId("ja-m37-neo-review-2"),
  byId("ja-m37-neo-9"),
  byId("ja-m37-neo-10"),
  byId("ja-m37-neo-review-3"),
  byId("ja-m37-neo-challenge"),
];
