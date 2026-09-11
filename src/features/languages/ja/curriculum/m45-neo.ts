/**
 * m45-neo — the SIXTEENTH module of the JLPT N4 tier. Spine unit `n4-16`
 * (`docs/spine-n4.md` §`n4-16`), "Causative させる: make/let someone do"
 * (`docs/ja-m45-brief-2026-09-10.md`).
 *
 * Two formation classes, interleaved with an unrelated break (L2's
 * しかたが ない) between them per the interleave-don't-block-teach doctrine:
 *
 *  - **L1, id `causative-form`, variant `godan`**: bend the u-verb's final
 *    sound to its a-row (the same naiStem already known from ない/volitional)
 *    and add せる — よむ → よませる.
 *  - **L3, same id, variant `ichidan-irregular`**: ichidan drops る and adds
 *    させる whole (たべる → たべさせる); する/くる are memorized outright
 *    (させる／こさせる). This lesson also cashes in そうじする
 *    (`courseAtoms.ts`, previously a future-tagged stub) as a plain,
 *    non-causative priming sentence — its own causative そうじさせる was
 *    deliberately never authored (see below).
 *
 * MAKE vs LET rides the causee's PARTICLE for an intransitive verb, but a
 * transitive verb's causee is fixed at に (を is already the object's) —
 * two distinct mechanisms, taught as two variants of one grammarPoint id,
 * mirroring m44's own `youda-direct-evidence` two-variant precedent:
 *
 *  - **L4, id `causative-make-vs-let`, variant `intransitive`**: こどもを
 *    あるかせた (forced) vs こどもに あるかせた (permitted) — same verb,
 *    opposite reading, particle is the entire signal. Taught via a
 *    `kind: sim` build-tile contrast, NOT a particle-cloze — particle
 *    clozes never test MAKE-vs-LET semantics in this module (carried
 *    forward m41-m44 doctrine: MCQ/build for semantic contrasts, cloze
 *    only for pure conjugation-formation review).
 *  - **L6, same id, variant `transitive`**: こどもに いぬを そだてさせる —
 *    MAKE vs LET reads from むりやり's presence/absence instead, since に
 *    is the causee's only option once を is taken by the object.
 *
 * L5 is the backward-spiral interleave lesson: passive (m40, -られる) and
 * causative (-せる/させる) reviewed side by side, always on SEPARATE verbs
 * in separate clauses — this module NEVER produces or drills the
 * causative-PASSIVE stack (させられる), which is m50/n4-21's exclusive job.
 * Verified by hand on every authored sentence.
 *
 * The request ladder closes the module:
 *
 *  - **L7, id `causative-request`**: させて ください (asking permission for
 *    yourself) vs させて もらう (describing having received it, riding the
 *    m35 favor-ladder).
 *  - **L8, id `causative-politeness-recognition`**: させて いただく,
 *    させて もらう's humble twin — RECOGNITION ONLY. Confirmed via
 *    `docs/spine-n4.md` that m50/n4-21 ("Keigo II") owns both production of
 *    させて いただく and causative-passive させられる. Appears in this
 *    module only in the grammarPoint's own rule prose (unregistered, mirrors
 *    m40's passive-form かう→かわれる prose-only precedent) and in
 *    listening-comp/dialogue lines — never in a sentence/build/cloze/
 *    challenge beat.
 *
 * Verb-risk decisions (brief's "2-4 extra newAtoms budget" for まかせる/
 * そだてる/ゆるす):
 *  - まかせる (L4) kept 100% dictionary-form — no causative inflection of
 *    an already-causative-adjacent "entrust" verb.
 *  - そだてる (L6) gets exactly ONE hand-registered causative surface,
 *    そだてさせる, generalizing MAKE-vs-LET from particle-choice
 *    (intransitive あるく) to context/adverb-choice (transitive そだてる).
 *  - ゆるす (L7) gets one hand-registered NAI-FORM (ゆるさない, not
 *    causative) for the idiom きそくは それを ゆるさない.
 *
 * Engineering pre-work (done before any lesson content, per inv 49):
 * `causative` added to `TRANSFORM_RULESETS` + `RULESET_ALTERNATES`
 * (`conjugation/transformRulesets.ts`), mirroring passive's (m40) table
 * shape — godan naiStem+せる, ichidan +させる, する→させる, くる→こさせる.
 *
 * Registration-gap finding (generalizes across this module): the STEMS
 * auto-generator only derives masu-STEMS, never full conjugated surfaces or
 * い-adjective く-forms — every causative surface AND はやく (adverbial of
 * はやい, needed L7/review-3) needed its own hand-registered `newAtoms` row
 * regardless of the base verb/adjective's own registration status.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m45.ir.yaml`
 * (`node scripts/compile-ir.mjs m45`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. Lesson-id numbering follows m43's non-skipping convention
 * (1,2,3,review-1,4,5,6,review-2,7,8,review-3,challenge) rather than
 * m40/m41's skip-4/skip-8 convention — both are attested precedents; this
 * module picked the cleaner one. NO katakana rows, so the compiled order IS
 * the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m45Ir from "./ir/m45.ir.json";

const COMPILED: LessonContent[] = compileModule(m45Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m45-neo: compiled lesson ${id} missing`);
  return l;
};

export const M45_NEO_LESSONS: LessonContent[] = [
  byId("ja-m45-neo-1"),
  byId("ja-m45-neo-2"),
  byId("ja-m45-neo-3"),
  byId("ja-m45-neo-review-1"),
  byId("ja-m45-neo-4"),
  byId("ja-m45-neo-5"),
  byId("ja-m45-neo-6"),
  byId("ja-m45-neo-review-2"),
  byId("ja-m45-neo-7"),
  byId("ja-m45-neo-8"),
  byId("ja-m45-neo-review-3"),
  byId("ja-m45-neo-challenge"),
];
