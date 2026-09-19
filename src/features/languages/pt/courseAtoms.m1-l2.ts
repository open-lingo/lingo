/**
 * PT m1 L2 — new atoms for "De onde você é?" (ser + de/origin; contractions
 * do/da debut). Lane PTAUTH-L2, docs/pt-course-design-2026-09-18.md §4 row L2.
 *
 * Registers into the live PT atom registry via `atom()`'s side effect at
 * import time — same cycle-safe pattern `courseAtoms.ts`'s header documents
 * for curriculum files. Imported for that side effect by `courseAtoms.ts`'s
 * explicit lesson-atom-file list (one import line per lesson lane).
 *
 * GENERATED-SHAPE NOTE: once `scripts/compile-ir-pt.mjs` gains fragment
 * support (reading `ir/m1/l2.ir.yaml`), this hand-written array becomes
 * redundant with the compiler's own emitted `PT_M1_ATOMS` slice for L2 —
 * kept here now (mirroring `ir/m1/l2.ir.yaml`'s `newAtoms:` list field for
 * field) so the atom registry — and flashcards — work before that lands.
 *
 * `do`/`da` are the de+o / de+a contractions (design doc §3): cloze-only,
 * NEVER separable build/listen-build tiles — enforced at compile time by
 * `scripts/draft/pt-ir/assemble.mjs`'s `checkNoContractionTiles`.
 */
import { atom, type PtAtom } from "./courseAtoms";

export const PT_M1_L2_ATOMS: PtAtom[] = [
  atom({
    surface: "de",
    meaningEn: "of / from",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "onde",
    meaningEn: "where",
    partOfSpeech: "adverb",
    fromModule: "m1",
    kind: "vocab",
    hint: "OHN-jee",
  }),
  atom({
    surface: "do",
    meaningEn: "of the / from the (masc.)",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
    hint: "de + o — cloze only, never a separable tile",
  }),
  atom({
    surface: "da",
    meaningEn: "of the / from the (fem.)",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
    hint: "de + a — cloze only, never a separable tile",
  }),
  atom({
    surface: "cidade",
    meaningEn: "city",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    emoji: "🏙️",
  }),
  atom({
    surface: "país",
    meaningEn: "country",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "🌏",
    hint: "pa-EES",
  }),
  atom({
    surface: "França",
    meaningEn: "France",
    partOfSpeech: "proper-noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
  }),
  atom({
    surface: "Califórnia",
    meaningEn: "California",
    partOfSpeech: "proper-noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
  }),
];
