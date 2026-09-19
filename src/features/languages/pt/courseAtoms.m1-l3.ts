/**
 * PT m1 lesson 3 atom pack — "Eu tenho uma família" (ter present sg.;
 * um/uma + gender agreement debut). Authoring lane PTAUTH-L3, per
 * `docs/pt-course-design-2026-09-18.md` §4 row L3.
 *
 * HAND-AUTHORED, not YAML-compiled: `scripts/compile-ir-pt.mjs` does not
 * yet read per-lesson fragments (`ir/m1/l*.ir.yaml`) — a separate lane is
 * adding that. This file registers these 8 atoms into the live PT atom
 * registry the moment it is imported (`atom()`'s side effect writes into
 * `courseAtoms.ts`'s module-level Map), independent of whether the lesson
 * BODY (steps) has compiled yet — so SRS/flashcards, the module conformance
 * gate, and anything else reading `getPtCourseAtoms()` see these atoms as
 * soon as `courseAtoms.ts` imports this file (see the one-line import
 * appended to that file's "per-lesson atom packs" section).
 *
 * The authoritative lesson-content source (steps, sequencing) is
 * `curriculum/ir/m1/l3.ir.yaml` — this file duplicates each atom's fields
 * there under `atoms:` for when the fragment compiler lands; the two are
 * kept in sync by hand until then.
 *
 * Gender: família/irmã are feminine, amigo/gato are masculine — every noun
 * below carries `gender` so `agreementLit` (the um/uma agreement gate) and
 * the antiPattern info card can grade against it. `um`/`uma` are the
 * articles themselves — no gender field on them (mirrors ES's `un`/`una`
 * in `es/curriculum/m3.ts`: partOfSpeech "particle", kind "particle").
 *
 * `tem` covers BOTH "you have" (você) and "he/she has" (ele/ela) — BR
 * Portuguese conjugates você with the 3rd-person singular form, so unlike
 * ES's separate `tienes`/`tiene`, PT has one form for both; the gloss below
 * says so explicitly rather than picking one and hiding the other.
 */
import { atom, type PtAtom } from "./courseAtoms";

export const PT_M1_L3_ATOMS: PtAtom[] = [
  atom({
    surface: "tenho",
    meaningEn: "I have",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
  }),
  atom({
    surface: "tem",
    meaningEn: "you have / he/she has",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
  }),
  atom({
    surface: "um",
    meaningEn: "a / an (masculine, o-words)",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "uma",
    meaningEn: "a / an (feminine, a-words)",
    partOfSpeech: "particle",
    fromModule: "m1",
    kind: "particle",
  }),
  atom({
    surface: "família",
    meaningEn: "family",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    emoji: "👪",
    hint: "cognate — stress the í: fa-MEE-lya",
  }),
  atom({
    surface: "irmã",
    meaningEn: "sister",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "f",
    hint: "nasal ã — ihr-MÃ (through the nose, not \"irma\")",
  }),
  atom({
    surface: "amigo",
    meaningEn: "friend",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "🧑‍🤝‍🧑",
  }),
  atom({
    surface: "gato",
    meaningEn: "cat",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "🐱",
  }),
];
