/**
 * lib/rules.mjs — the numeric/named constants lane PTTOOL distilled from
 * `docs/pt-course-design-2026-09-18.md` §4's shared rules,
 * `docs/es-lesson-authoring-guide.md` §13, and
 * `docs/es-ir-sources/es-m20-brief.md`'s "Hard rules" — the single place
 * both `from-spec.mjs`'s scheduler and `check.sh`'s independent re-check
 * read these numbers from, so the two can never silently drift apart.
 *
 * PT_CONTRACTIONS is a DELIBERATE, commented duplicate of
 * `scripts/draft/pt-ir/assemble.mjs`'s private `PT_CONTRACTIONS` set (not
 * exported, and editing the compiler is off-limits for this lane) — kept
 * byte-identical on purpose; `lib/rules.test.mjs` pins the two lists equal
 * by re-reading assemble.mjs's source text, so drift fails loudly instead
 * of silently.
 */

export const PT_CONTRACTIONS = new Set(
  [
    "do", "da", "dos", "das", "no", "na", "nos", "nas", "ao", "aos", "à", "às",
    "num", "numa", "nuns", "numas", "pelo", "pela", "pelos", "pelas",
    "dele", "dela", "deles", "delas",
    "desse", "dessa", "desses", "dessas", "deste", "desta", "destes", "destas",
    "disso", "disto", "daquilo", "daquele", "daquela", "naquele", "naquela",
  ].map((s) => s.toLowerCase()),
);

/** A step whose grading is pick-from-options with no production/listening
 *  demand — the "selection-only run" §4 caps at < 4 in a row. `sim`,
 *  `buildLit`, `speakLit`, `listenCompLit`, `listenBuildLit`, `agreementLit`,
 *  `matchLit`, `map` all require production, audio, or matching motion and
 *  are NOT selection-only. */
export const SELECTION_ONLY_KINDS = new Set(["imageMcq", "textMcq", "mcq", "clozeLit"]);

/** Kinds legal as a NEW atom's first printed appearance (§4 shared rules:
 *  "info/phrase/speakLit/buildLit/listenCompLit/imageMcq — never a
 *  distractor, never a sim first"). */
export const INTRO_CAPABLE_KINDS = new Set([
  "info", "phrase", "speakLit", "buildLit", "listenCompLit", "imageMcq",
]);

export const STEP_COUNT_MIN = 10;
export const STEP_COUNT_MAX = 25;
export const TILE_FLOOR = 5;
export const MATCH_PAIR_FLOOR = 6;
export const ANSWER_FLOOR = 3;
export const MAX_USES_PER_SENTENCE = 3;
export const MAX_SELECTION_RUN = 3; // no 4+ selection-only run
export const MAX_IMAGE_MCQ_PER_LESSON = 2;
export const MAX_NEW_WORDS = 8;

/** Valid `Atom.partOfSpeech` values (`src/shared/language/types.ts`). A
 *  spec author may write a more descriptive `pos` (e.g. "verb-form", for
 *  "tenho" — the brief's own worked example) that isn't itself a member of
 *  this union; `mapPartOfSpeech` folds it onto the nearest real bucket so
 *  the emitted TS still type-checks. */
const VALID_POS = new Set([
  "noun", "verb", "adjective", "adverb", "particle", "counter", "number",
  "pronoun", "determiner", "conjunction", "interjection", "expression",
  "proper-noun", "phrase", "grammar", "other",
]);
const POS_ALIASES = { "verb-form": "verb", preposition: "particle", article: "determiner" };

export function mapPartOfSpeech(pos) {
  if (VALID_POS.has(pos)) return pos;
  return POS_ALIASES[pos] ?? "other";
}

/**
 * Small, curated fallback distractor pool — common, unambiguous, already
 * vendor-checkable concrete nouns — used ONLY when no taught-vocab pool is
 * available to draw prior-lesson distractors from (m1 L1's own situation:
 * there IS no prior lesson). A later lesson's `from-spec.mjs` run prefers
 * real taught vocabulary (see `lib/taughtVocab.mjs`) over this pool.
 */
export const FALLBACK_IMAGE_DISTRACTORS = [
  { surface: "livro", meaningEn: "book", emoji: "📖" },
  { surface: "casa", meaningEn: "house", emoji: "🏠" },
  { surface: "cachorro", meaningEn: "dog", emoji: "🐶" },
  { surface: "gato", meaningEn: "cat", emoji: "🐱" },
  { surface: "carro", meaningEn: "car", emoji: "🚗" },
  { surface: "médico", meaningEn: "doctor", emoji: "👨‍⚕️" },
  { surface: "pássaro", meaningEn: "bird", emoji: "🐦" },
  { surface: "peixe", meaningEn: "fish", emoji: "🐟" },
];
