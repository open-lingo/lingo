/**
 * Static ES review pool — a cycle-safe snapshot of every registered atom
 * (surface, gloss, kind, introducing module), GENERATED from the
 * curriculum/m*.ts `ES_M{N}_ATOMS` declarations by scripts (do not hand-edit;
 * regenerate with `node scripts/gen-es-review-pool.mjs` if atoms change).
 *
 * WHY THIS EXISTS: the compounding-review helpers (`pickReviewSurfaces` /
 * `reviewMatchPairs` in grammarHelpers.ts) must resolve PRIOR-module atoms at
 * lesson-build (import) time. Reading the live `courseAtoms` registry there is
 * unsafe: the courseAtoms↔curriculum import cycle can evaluate a later module's
 * lessons before an earlier module has registered its atoms, yielding an empty
 * pool (the same cycle `capstoneMatchPairs` sidesteps with inline glosses).
 * This static table is import-order-independent, so review draws are stable.
 */
export type EsReviewEntry = {
  surface: string;
  gloss: string;
  kind: "vocab" | "particle" | "phrase";
  fromModule: string;
  partOfSpeech: string;
};

export const ES_REVIEW_POOL: EsReviewEntry[] = [
  { surface: "hola", gloss: "hello", kind: "vocab", fromModule: "m1", partOfSpeech: "other" },
  { surface: "adiós", gloss: "goodbye", kind: "vocab", fromModule: "m1", partOfSpeech: "other" },
  { surface: "gracias", gloss: "thank you", kind: "vocab", fromModule: "m1", partOfSpeech: "other" },
  { surface: "por favor", gloss: "please", kind: "phrase", fromModule: "m1", partOfSpeech: "phrase" },
  { surface: "perdón", gloss: "excuse me / sorry", kind: "vocab", fromModule: "m1", partOfSpeech: "other" },
  { surface: "sí", gloss: "yes", kind: "vocab", fromModule: "m1", partOfSpeech: "other" },
  { surface: "no", gloss: "no", kind: "vocab", fromModule: "m1", partOfSpeech: "other" },
  { surface: "buenos días", gloss: "good morning", kind: "phrase", fromModule: "m1", partOfSpeech: "phrase" },
  { surface: "buenas tardes", gloss: "good afternoon", kind: "phrase", fromModule: "m1", partOfSpeech: "phrase" },
  { surface: "buenas noches", gloss: "good evening / good night", kind: "phrase", fromModule: "m1", partOfSpeech: "phrase" },
  { surface: "hasta luego", gloss: "see you later", kind: "phrase", fromModule: "m1", partOfSpeech: "phrase" },
  { surface: "mucho gusto", gloss: "nice to meet you", kind: "phrase", fromModule: "m1", partOfSpeech: "phrase" },
  { surface: "cero", gloss: "zero", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "uno", gloss: "one", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "dos", gloss: "two", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "tres", gloss: "three", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "cuatro", gloss: "four", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "cinco", gloss: "five", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "seis", gloss: "six", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "siete", gloss: "seven", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "ocho", gloss: "eight", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "nueve", gloss: "nine", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "diez", gloss: "ten", kind: "vocab", fromModule: "m1", partOfSpeech: "noun" },
  { surface: "y", gloss: "and", kind: "particle", fromModule: "m1", partOfSpeech: "particle" },
  { surface: "o", gloss: "or", kind: "particle", fromModule: "m1", partOfSpeech: "particle" },
  { surface: "¿cómo estás?", gloss: "how are you?", kind: "phrase", fromModule: "m2", partOfSpeech: "phrase" },
  { surface: "bien", gloss: "well / fine", kind: "vocab", fromModule: "m2", partOfSpeech: "other" },
  { surface: "¿y tú?", gloss: "and you?", kind: "phrase", fromModule: "m2", partOfSpeech: "phrase" },
  { surface: "me llamo", gloss: "my name is", kind: "phrase", fromModule: "m2", partOfSpeech: "phrase" },
  { surface: "te llamas", gloss: "your name is", kind: "phrase", fromModule: "m2", partOfSpeech: "phrase" },
  { surface: "no entiendo", gloss: "I don't understand", kind: "phrase", fromModule: "m2", partOfSpeech: "phrase" },
  { surface: "señor", gloss: "Mr. / sir", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "señora", gloss: "Mrs. / ma'am", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "yo", gloss: "I", kind: "vocab", fromModule: "m2", partOfSpeech: "pronoun" },
  { surface: "tú", gloss: "you (informal)", kind: "vocab", fromModule: "m2", partOfSpeech: "pronoun" },
  { surface: "soy", gloss: "I am", kind: "vocab", fromModule: "m2", partOfSpeech: "verb" },
  { surface: "eres", gloss: "you are", kind: "vocab", fromModule: "m2", partOfSpeech: "verb" },
  { surface: "él", gloss: "he", kind: "vocab", fromModule: "m2", partOfSpeech: "pronoun" },
  { surface: "ella", gloss: "she", kind: "vocab", fromModule: "m2", partOfSpeech: "pronoun" },
  { surface: "es", gloss: "he/she/it is", kind: "vocab", fromModule: "m2", partOfSpeech: "verb" },
  { surface: "de", gloss: "of / from", kind: "particle", fromModule: "m2", partOfSpeech: "particle" },
  { surface: "México", gloss: "Mexico", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "España", gloss: "Spain", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "Estados Unidos", gloss: "United States", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "maestro", gloss: "teacher (m)", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "maestra", gloss: "teacher (f)", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
  { surface: "estudiante", gloss: "student", kind: "vocab", fromModule: "m2", partOfSpeech: "noun" },
];
