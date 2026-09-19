/**
 * PT m1 L1 ("Eu sou Sam") — the lesson's ≤8 new atoms.
 *
 * Lane PTAUTH-L1 (docs/pt-course-design-2026-09-18.md §4, row L1). Owned by
 * this lane ONLY per the five-lane parallel-authoring file split — do not
 * hand-edit from another lesson's lane.
 *
 * `atom()` (from `./courseAtoms`) registers each entry into the shared PT
 * atom registry as a side effect of array construction, exactly like every
 * curriculum module's atom block — this file just carries ONE lesson's
 * slice of that block so five lanes can draft atoms in parallel without
 * colliding on one m1.ir.yaml. `PT_M1_L1_ATOMS` is also exported directly
 * so the fragment-aware compiler (or a future content-as-data aggregate)
 * can read this lesson's atom list without re-deriving it from the
 * registry side effects.
 *
 * Kind convention follows the ES parent (`es/courseAtoms.ts`): pronouns and
 * greetings are kind "vocab" (kind "particle" is reserved for articles/
 * preps/conjunctions, none of which this debut lesson teaches).
 *
 * Gender: `estudante` is genuinely epicene in Portuguese ("o estudante" /
 * "a estudante" — same surface form for both genders), so `gender` is left
 * unset rather than guessed; `professor` is a real masculine/feminine pair
 * ("professor"/"professora") and only the masculine surface is taught this
 * lesson (the design doc's own "professor(a)*" notation), so gender: "m" is
 * correct and the feminine form is named in the hint rather than silently
 * dropped.
 */
import { atom, type PtAtom } from "./courseAtoms";

export const PT_M1_L1_ATOMS: PtAtom[] = [
  atom({
    surface: "olá",
    meaningEn: "hello",
    partOfSpeech: "interjection",
    fromModule: "m1",
    kind: "vocab",
    emoji: "👋",
    hint: "oh-LAH",
  }),
  atom({
    surface: "eu",
    meaningEn: "I",
    partOfSpeech: "pronoun",
    fromModule: "m1",
    kind: "vocab",
    hint: "\"eh-oo\", not English \"you\"",
  }),
  atom({
    surface: "você",
    meaningEn: "you",
    partOfSpeech: "pronoun",
    fromModule: "m1",
    kind: "vocab",
    hint: "voh-SÊ — used for both formal and informal \"you\" in Brazil",
  }),
  atom({
    surface: "sou",
    meaningEn: "I am",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "rhymes with \"know\": SOH",
  }),
  atom({
    surface: "é",
    meaningEn: "is / are (you, he, she)",
    partOfSpeech: "verb",
    fromModule: "m1",
    kind: "vocab",
    hint: "short, open e — like \"eh\", never \"ee\"",
  }),
  atom({
    surface: "estudante",
    meaningEn: "student",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    emoji: "🎓",
  }),
  atom({
    surface: "professor",
    meaningEn: "teacher (m)",
    partOfSpeech: "noun",
    fromModule: "m1",
    kind: "vocab",
    gender: "m",
    emoji: "👨‍🏫",
    hint: "cognate — feminine form is professora, coming soon",
  }),
  atom({
    surface: "Brasil",
    meaningEn: "Brazil",
    partOfSpeech: "proper-noun",
    fromModule: "m1",
    kind: "vocab",
    hint: "bra-ZEEL, not BRAH-zil",
  }),
];
