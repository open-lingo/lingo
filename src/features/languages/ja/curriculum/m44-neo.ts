/**
 * m44-neo — the FIFTEENTH module of the JLPT N4 tier. Spine unit `n4-15`
 * (`docs/spine-n4.md` §`n4-15`), "Evidential-family reassembly: ようだ /
 * みたい / のように・のような" (`docs/ja-m44-brief-2026-09-10.md`).
 *
 * Four surfaces of one root よう, sorted by JOB (evidence-guess vs simile,
 * predicate vs adnominal) — NOT another certainty ladder; m43 already owns
 * that framing and this module's own review card says so explicitly:
 *
 *  - **L2, id `youda-direct-evidence`, variant `plain`**: a direct-evidence
 *    guess off a plain verb/い-adjective host, attached as-is —
 *    かぜを ひいたようだ, never かぜを ひきましたようだ (mixed register).
 *  - **L3, same id, variant `noun-na`**: the same connector move はず
 *    already taught — noun hosts insert の, な-adjective hosts insert な,
 *    never だ. A second `kind: rule` card sharing the `youda-direct-
 *    evidence` id via a distinct `variant` key (the m43 hazu intro/spends
 *    precedent, generalized a second time; `resolveGrammarPoint`
 *    disambiguates on `beat.variant` when 2+ grammarPoints share an id).
 *  - **L5, id `mitai-casual`**: みたい, ようだ's exact casual twin — same
 *    verb/い-adjective attachment, but its own bare-noun rule (no の at
 *    all): こどもみたいだ, never こどものみたいだ.
 *  - **L6, id `you-ni-simile`**: のように, an adverbial simile describing
 *    HOW something is/happens, by comparison to a noun — always
 *    Noun+の+よう+に, no exceptions.
 *  - **L7, id `you-na-simile`**: のような, its adnominal twin, describing a
 *    following NOUN instead — Noun1+の+よう+な+Noun2. Folded into a
 *    dialogue_sim over the resemblance/appearance domain (かがみ,
 *    にんぎょう, そっくり, にる/にている).
 *  - **L10 (neo-10), id `evidential-family`**: a REVIEW-OBJECT synthesis
 *    card (inv 26 shape), not new teaching — reassembles all four
 *    surfaces explicitly framed as a source-of-evidence family, never a
 *    strength ladder (that framing stays m43's alone).
 *
 * CORRECTED mid-authoring (self-caught before any file was written, so no
 * revert needed): the brief's own working assumption was that みたい needs
 * ZERO new atom registration, relying on the m13 priorAtoms fallback for
 * the kana string "みたい". Verified FALSE by reading `ir/m13.ir.yaml`
 * directly — m13's own みたい is a completely different word: the
 * たい-form (want-to) of みる (見る, "to watch"), registered
 * `kind: tai-form, derivedFrom: みる`. It is a pure kana homograph with
 * this module's comparative みたい, not the same atom. Fix: みたい is
 * registered as its OWN new atom here (`kind: vocab`, comparative gloss,
 * its own `courseAtoms.ts` row) so last-wins layering makes this module's
 * own compiled lessons resolve it correctly — the かもしれない
 * tokenizer-safety fused-atom precedent, generalized to a same-kana
 * cross-meaning collision instead of a greedy-match collision.
 *
 * にる (似る, ichidan, "to resemble") has no `VERB_ENTRIES` row, so
 * CHAIN_FORMS derives nothing for it (the m43 うたがう/しんじる precedent,
 * generalized) — its て-iru resultative にている is hand-registered as an
 * IR-only `kind: verb-form, derivedFrom: にる` atom, exempt from the
 * courseAtoms.ts row requirement (DERIVED_KINDS).
 *
 * Register discipline: plain ようだ/みたい/のように/のような are the
 * production bases throughout; every dialogue and challenge line stays
 * plain-register (no ようです anywhere in this module).
 *
 * Emoji-vendoring discipline: こおり (🧊, `emoji_u1f9ca.svg` vendored) is
 * the only new atom marked `imageable: true`. かがみ (🪞) and にんぎょう
 * (🪆/🧸) have no vendored SVG — both kept `imageable: false`.
 *
 *  - **L1**: pure domain-vocabulary lesson (sensory evidence: におい/あじ/
 *    けむり/こおり), no new grammar on purpose.
 *  - **L9**: domain integration over atmosphere-and-signs vocabulary
 *    (ふんいき/きざし/ようす), no new grammar.
 *  - **L10 (neo-10)**: pre-review integration, evidential-family review
 *    object, no new vocabulary.
 *  - **challenge**: every よう-family surface combined with prior N4
 *    grammar (m43's certainty family included), no new vocabulary.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m44.ir.yaml`
 * (`node scripts/compile-ir.mjs m44`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m44Ir from "./ir/m44.ir.json";

const COMPILED: LessonContent[] = compileModule(m44Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m44-neo: compiled lesson ${id} missing`);
  return l;
};

export const M44_NEO_LESSONS: LessonContent[] = [
  byId("ja-m44-neo-1"),
  byId("ja-m44-neo-2"),
  byId("ja-m44-neo-3"),
  byId("ja-m44-neo-review-1"),
  byId("ja-m44-neo-5"),
  byId("ja-m44-neo-6"),
  byId("ja-m44-neo-7"),
  byId("ja-m44-neo-review-2"),
  byId("ja-m44-neo-9"),
  byId("ja-m44-neo-10"),
  byId("ja-m44-neo-review-3"),
  byId("ja-m44-neo-challenge"),
];
