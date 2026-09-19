/**
 * PT m1 L4 atoms — «Eu estou cansado» (estar present sg.; ser-vs-estar
 * minimal pair; em -> no/na contraction debut). Lane PTAUTH-L4, per
 * `docs/pt-course-design-2026-09-18.md` §4 row L4.
 *
 * Registered as a standalone side-effect-import file (not through
 * `curriculum/m1.ts`, which is compiler-generated and today an empty
 * stub — see that file's own header) so this lesson's atoms are live in
 * the registry — and therefore SRS-eligible on Cris's flashcard deck —
 * the moment `courseAtoms.ts` is imported, ahead of the fragment-compiler
 * lane landing. `atom()` first-write-wins on duplicate surfaces (see
 * `courseAtoms.ts`'s header), so once `compile-ir-pt.mjs` regenerates
 * `curriculum/m1.ts` from `ir/m1/l4.ir.yaml` (this fragment's real source
 * of truth), the two registrations are idempotent — identical surfaces,
 * identical fields, no-op on the second write.
 *
 * Emoji ids (all pre-vendored under src/pub/noto-emoji/svg/, verified by
 * `ls`, no new SVG needed):
 *   cansado/cansada -> 😫 emoji_u1f62b.svg (KO precedent: 피곤하다 "be tired")
 *   feliz            -> 😊 emoji_u1f60a.svg
 *   hospital         -> 🏥 emoji_u1f3e5.svg (JA precedent: 病院 "hospital")
 */
import { atom, type PtAtom } from "./courseAtoms";

export const PT_M1_L4_ATOMS: PtAtom[] = [
  atom({
    surface: "estou",
    meaningEn: "I am (temporary state)",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
  }),
  atom({
    surface: "está",
    meaningEn: "is / are (temporary state)",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
  }),
  atom({
    surface: "em",
    meaningEn: "in, at",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "no",
    meaningEn: "in the (masc.) — em + o",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "na",
    meaningEn: "in the (fem.) — em + a",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "cansado",
    meaningEn: "tired (masc.)",
    partOfSpeech: "adjective",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "😫",
  }),
  atom({
    surface: "cansada",
    meaningEn: "tired (fem.)",
    partOfSpeech: "adjective",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    emoji: "😫",
  }),
  atom({
    surface: "feliz",
    meaningEn: "happy",
    partOfSpeech: "adjective",
    fromModule: "m1",
    kind: "vocab",
    emoji: "😊",
  }),
  atom({
    surface: "aqui",
    meaningEn: "here",
    partOfSpeech: "adverb",
    fromModule: "m1",
    kind: "vocab",
  }),
  atom({
    surface: "hospital",
    meaningEn: "hospital",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "🏥",
  }),
];
