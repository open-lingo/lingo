/**
 * m40-neo — the ELEVENTH module of the JLPT N4 tier. Spine unit `n4-11`
 * (`docs/spine-n4.md` §`n4-11`), "Passive I — direct passive られる".
 *
 * The direct passive turns the sentence around: the one something HAPPENS TO
 * becomes topic (は/が), and the doer takes に. Taught with deliberately
 * mixed valence from the first lesson — せんせいに ほめられた (good news)
 * sits beside がくせいは せんせいに しかられた (bad news) — so the grammar
 * itself is never framed as inherently negative, a common learner
 * misconception this module avoids on purpose.
 *
 *  - **L1**: vocabulary priming only (けいさつ/どろぼう/きず/しかる/ほめる/
 *    ぬすむ) through は/が/を already known — no passive yet. ぬすむ and
 *    ほめる MUST debut here, strictly before L2 ramps their passive forms.
 *  - **L2, id `passive-form`**: mechanical formation, both classes —
 *    godan bends to its a-stem (ぬすむ→ぬすまれる), ichidan drops る
 *    (ほめる→ほめられる), irregulars are memorized whole (する→される,
 *    くる→こられる, くる unused). Auto-ramped via `conjugation_transform`
 *    for ぬすむ/ほめる/する only — every other new verb this module teaches
 *    is hand-authored, so its plain and passive forms may debut in the same
 *    lesson. Also carries `passive-rareru` — the semantic turn (agent → に).
 *  - **L3, id `possessed-object-passive`**: when what's affected is
 *    something OWNED, the owner becomes topic and the owned thing keeps を
 *    — どろぼうに さいふを ぬすまれた, not さいふは ぬすまれた. The
 *    opposite promotion English makes. Also debuts たのむ/よぶ/さそう
 *    (たのむ/よぶ repointed from stale "future" courseAtoms stubs).
 *  - **L5, id `niyotte-creation-passive`**: によって for who MADE something
 *    (invention/construction/research), the formal cousin of に, alongside
 *    agentless される for facts nobody needs a name attached to.
 *  - **L6, id `suffering-passive-recognition`, RECOGNITION ONLY**: 迷惑の
 *    受身 — intransitive verbs turned passive purely to mark the speaker
 *    was inconvenienced (あめに ふられた, どろぼうに はいられた), no
 *    English passive to match. Ships via `rule` prose + `listening-comp` +
 *    `dialogue` lines ONLY — never a `mode: build`/`translate`/`listening`
 *    sentence, particle-cloze answer, or challenge `combines`/`ja`.
 *    Production is a later module's job; enforced by this file's own
 *    bespoke test ratchet (`__tests__/m40-neo.test.ts`).
 *  - **L7**: discrimination across に／によって／を, extends the けいさつ
 *    vocabulary family (ひがい, そうさ).
 *  - **L9**: production capstone riding し/のに/てから; second dialogue_sim
 *    (a police investigation exchange).
 *  - **L10**: full production sweep, no new vocabulary.
 *  - **challenge**: every passive pattern combined with prior N4 grammar.
 *
 * COLLISION GUARD (brief's own ratchet): たべられる／みられる／こられる are
 * byte-identical to m24's already-live POTENTIAL-form atoms. This module
 * never drills any of the three as a graded answer. たべられる appears
 * exactly once, inside `passive-rareru`'s `rule` prose (never graded) to
 * name the ambiguity honestly; みられる/こられる don't appear in this
 * module's own IR at all — they only surface in the SHARED
 * `TRANSFORM_RULESETS.passive` legend (`conjugation/transformRulesets.ts`),
 * a non-graded reference table, identical in kind to m24's own potential
 * legend already doing the same thing with the same strings. する's
 * passive (される) is NOT a collision — する's potential is the suppletive
 * できる — so it drills freely as graded production via the ramp.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m40.ir.yaml`
 * (`node scripts/compile-ir.mjs m40`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m40Ir from "./ir/m40.ir.json";

const COMPILED: LessonContent[] = compileModule(m40Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m40-neo: compiled lesson ${id} missing`);
  return l;
};

export const M40_NEO_LESSONS: LessonContent[] = [
  byId("ja-m40-neo-1"),
  byId("ja-m40-neo-2"),
  byId("ja-m40-neo-3"),
  byId("ja-m40-neo-review-1"),
  byId("ja-m40-neo-5"),
  byId("ja-m40-neo-6"),
  byId("ja-m40-neo-7"),
  byId("ja-m40-neo-review-2"),
  byId("ja-m40-neo-9"),
  byId("ja-m40-neo-10"),
  byId("ja-m40-neo-review-3"),
  byId("ja-m40-neo-challenge"),
];
