/**
 * m39-neo — the TENTH module of the JLPT N4 tier. Spine unit `n4-10`
 * (`docs/spine-n4.md` §`n4-10`), "Concession & reasons — 〜のに vs 〜ので,
 * 〜ても/〜でも, 〜し".
 *
 * のに and ので (module 16, id `node-because`) are built from the identical
 * joint — plain form, な before a noun/な-adjective, never だ — which is
 * exactly why they're confusable, and exactly why this module exists: のに
 * is ので's minimal pair, not a fresh grammar point bolted alongside it.
 * ので states a reason as flat fact; のに demands the second half CLASH
 * with the first, and it never leaves the room emotionally neutral.
 *
 *  - **L1–L2, のに**: introduced resolve-first (たかいのに かった), then
 *    pushed into its real register — complaint, reproach (ねつが あるのに
 *    がっこうに いった). Every production prompt for のに carries an
 *    explicit emotional-colour or contradiction cue; a register-neutral
 *    gloss is a sign of drifting toward ので's job, not のに's.
 *  - **L3, 〜ても**: concession over an action/quality, reaching forward
 *    into something not yet decided and holding regardless — resolve, not
 *    regret. Hosts the module's first dialogue_sim (weekend plans despite
 *    rain, run twice: あめが ふっても いく / いそがしくても いく).
 *  - **L5, 〜でも**: ても's cousin for nouns/な-adjectives (がくせいでも
 *    わかる), carefully distinguished from the sentence-opening でも
 *    ("but", the existing "demo" atom) — same two kana, different job.
 *  - **L6, 疑問詞+でも／も, closed set**: なんでも/だれでも/どこでも/だれも/
 *    なにも, five fixed phrases memorized whole, never derived — no
 *    novel question-word+でも/も combination appears anywhere else in the
 *    module (bespoke test ratchet).
 *  - **L7, 〜し**: reasons piled up toward one conclusion ("and what's
 *    more") — a third resident of から/ので/けど's joint, with a
 *    different job: a pile, not one reason and not a contrast.
 *  - **L9**: production + the swap-test discrimination lesson for
 *    のに vs ので, by particle-cloze on matched near-pairs — not a
 *    `kind: contrast` beat (that type stays unshipped, per the brief).
 *  - **L10**: ても and し combined in production; second dialogue_sim (the
 *    errand that won't wait) runs both grammars across one exchange.
 *
 * A homograph fix rides along in `moduleCompiler.ts`'s `exercised()`: し
 * (the 〜し listing suffix) collides with courseAtoms id "shi" (四, "four",
 * m13, blocked) the same way さん collides with 三 — a second positional
 * exception was added there, mirroring the さん/三 guard. See that file's
 * doc comment and `ir/m39.ir.yaml`'s notes block for the full reasoning
 * and the one accepted tradeoff (a hypothetical future 十四 sentence).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m39.ir.yaml`
 * (`node scripts/compile-ir.mjs m39`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m39Ir from "./ir/m39.ir.json";

const COMPILED: LessonContent[] = compileModule(m39Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m39-neo: compiled lesson ${id} missing`);
  return l;
};

export const M39_NEO_LESSONS: LessonContent[] = [
  byId("ja-m39-neo-1"),
  byId("ja-m39-neo-2"),
  byId("ja-m39-neo-3"),
  byId("ja-m39-neo-review-1"),
  byId("ja-m39-neo-5"),
  byId("ja-m39-neo-6"),
  byId("ja-m39-neo-7"),
  byId("ja-m39-neo-review-2"),
  byId("ja-m39-neo-9"),
  byId("ja-m39-neo-10"),
  byId("ja-m39-neo-review-3"),
  byId("ja-m39-neo-challenge"),
];
