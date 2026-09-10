/**
 * m42-neo — the THIRTEENTH module of the JLPT N4 tier. Spine unit `n4-13`
 * (`docs/spine-n4.md` §`n4-13`), "Hearsay: 〜そうだ, 〜って, 〜らしい"
 * (`docs/ja-m42-brief-2026-09-10.md`).
 *
 * Three distinct hearsay mechanisms, never merged into one labeled card:
 *
 *  - **L2, id `sou-hearsay`**: a FULL plain-form clause + そうだ/そうです
 *    reports what was HEARD. Registered as one free-standing base lemma
 *    (`そうだ`) mirroring m11's だった/でした "copula — no concrete
 *    referent" template, plus one IR-only derived polite form (そうです).
 *    Glues to any known host word via ordinary longest-match tokenizing —
 *    the same mechanism m41 validated for あけてある — so zero additional
 *    atoms are needed per host sentence. Deliberately NOT drilled against
 *    m36's appearance そう (stem-only, い/だ dropped) as a labeled minimal
 *    pair; that contrast is reserved for the m51 capstone six modules out.
 *  - **L3, id `tte-quotative`**: cashes in the `p-tte` stub courseAtoms has
 *    carried since m18 (never live content) — casual spoken quoting,
 *    functionally ≈ と言っていた, compressed.
 *  - **L5, id `to-itte-ita`**: reported PAST speech, extending m18's
 *    と-quotation (という) and と思う into the past with a new fused
 *    carrier atom いっていた (word-level ownership, avoiding the forbidden
 *    bare いって/いった collision with m8's/m11's live 行く atoms — the
 *    m18 いった homograph ruling m21's "ittari" row already names). One
 *    IR-only derived polite past, いっていました, Tanaka-voiced only.
 *  - **L7, id `rashii-hearsay`**: らしい, evidential hearsay one step more
 *    distanced than そうだ ("apparently," from indirect evidence).
 *    Registered as a genuine free-standing `pos: adjective` / i-adj lemma
 *    mirroring m12's おいしい, gluing to known hosts with zero per-sentence
 *    derived atoms — same mechanism as って.
 *
 * Register discipline (inv 7, DICT-FORM-FIRST): plain そうだ/いっていた are
 * the production bases throughout; polite そうです/いっていました are
 * IR-only `verb-form` derived atoms appearing only in Tanaka-voiced
 * recognition-only dialogue lines, never a production target.
 *
 * Zero new `ChainForm`/`TRANSFORM_RULESETS` entries — all three
 * constructions are compositional attachments to the already-live plain/
 * dictionary-form surface, the m30(ておく)/m38(てしまう)/m41(てある)
 * precedent, confirmed against inv 49's closed transform list.
 *
 *  - **L1/L6/L9**: pure domain-vocabulary / recombination lessons, no new
 *    grammar on purpose (interleave-dont-block-teach). ひなん/けいほう cut
 *    entirely (both outside top-3000 frequency, brief's own first-cut
 *    suggestion) — so L7 and L9 introduce no new vocabulary.
 *  - **L7 (dialogue_sim)**: そうだ/って/と言っていた/らしい inside one
 *    conversation, no new vocabulary.
 *  - **L8**: pre-review integration, every beat combines ≥3 grammar points
 *    (inv 26), no new vocabulary.
 *  - **challenge**: every hearsay marker combined with prior N4 grammar,
 *    no new vocabulary.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m42.ir.yaml`
 * (`node scripts/compile-ir.mjs m42`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m42Ir from "./ir/m42.ir.json";

const COMPILED: LessonContent[] = compileModule(m42Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m42-neo: compiled lesson ${id} missing`);
  return l;
};

export const M42_NEO_LESSONS: LessonContent[] = [
  byId("ja-m42-neo-1"),
  byId("ja-m42-neo-2"),
  byId("ja-m42-neo-3"),
  byId("ja-m42-neo-review-1"),
  byId("ja-m42-neo-4"),
  byId("ja-m42-neo-5"),
  byId("ja-m42-neo-6"),
  byId("ja-m42-neo-review-2"),
  byId("ja-m42-neo-7"),
  byId("ja-m42-neo-8"),
  byId("ja-m42-neo-review-3"),
  byId("ja-m42-neo-challenge"),
];
