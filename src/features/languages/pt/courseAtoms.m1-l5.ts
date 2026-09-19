/**
 * PT m1 L5 atoms — "O que você gosta de fazer?" (gostar de + infinitivo;
 * -ar/-er/-ir preview; module consolidation).
 *
 * Lane PTAUTH-L5 (docs/pt-course-design-2026-09-18.md §4, row L5). Owned
 * file per the lane brief's FILE OWNERSHIP section — do not edit from any
 * other lane.
 *
 * BRIDGE NOTE (unverified against the eventual fragment-merging compiler):
 * `scripts/compile-ir-pt.mjs` does not yet read per-lesson fragments
 * (`ir/m1/l*.ir.yaml`) as of this write — that lands in a separate infra
 * lane. Until it does, `src/features/languages/pt/curriculum/ir/m1/l5.ir.yaml`
 * carries the authored lesson + these same 8 atoms as its own `newAtoms:`
 * list (the source of truth once the compiler merges fragments). This file
 * exists so the atoms are live in `PT_ATOMS_BY_SURFACE` today — via the one
 * side-effect import line appended to `courseAtoms.ts` — for any tooling
 * (procedural QA, module-gate) that inspects the registry before m1.ts is
 * regenerated. `atom()`'s registry is first-write-wins, so once the real
 * compiled `m1.ts` also calls `atom()` for these same 8 surfaces (after the
 * fragment merge ships), this file becomes a no-op duplicate, not a
 * conflict.
 *
 * Cognates (marked * in the design doc's atom table): filme, música, pizza.
 * gosto/gosta/falar/comer/assistir carry no `emoji` — five abstract
 * verb/infinitive atoms are not single-image-representable, so "imageable"
 * for this batch is expressed the same way ES does it: presence of the
 * `emoji` field, set only on the three concrete nouns. PT's `PtAtom` type
 * (like ES's `Atom`) has no separate `shortGloss`/`imageable` boolean field
 * — that pair exists only on JA's atom shape; `gloss` (from `meaningEn`)
 * is the one field the flashcard deck and every SRS/gate consumer reads.
 */
import { atom, type PtAtom } from "./courseAtoms";

export const PT_M1_L5_ATOMS: PtAtom[] = [
  atom({
    surface: "gosto",
    meaningEn: "I like",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "gostar, 1st person singular — always followed by de",
  }),
  atom({
    surface: "gosta",
    meaningEn: "you like / he or she likes",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "gostar, você/ele/ela form — always followed by de",
  }),
  atom({
    surface: "falar",
    meaningEn: "to speak, to talk",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "-ar infinitive (first of the three preview endings)",
  }),
  atom({
    surface: "comer",
    meaningEn: "to eat",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "-er infinitive (second of the three preview endings)",
  }),
  atom({
    surface: "assistir",
    meaningEn: "to watch",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "-ir infinitive (third of the three preview endings)",
  }),
  atom({
    surface: "filme",
    meaningEn: "movie, film",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "🎬",
  }),
  atom({
    surface: "música",
    meaningEn: "music",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    emoji: "🎵",
    hint: "stress the first syllable: MÚ-si-ca",
  }),
  atom({
    surface: "pizza",
    meaningEn: "pizza",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    emoji: "🍕",
  }),
];
