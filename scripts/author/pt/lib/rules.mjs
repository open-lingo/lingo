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
 *
 * ROUND 2 (lane PTTOOL2) additions: `printedWords` moved here from
 * `lib/checkRules.mjs` so `lib/schedule.mjs`'s debut-guarantee pass and
 * `lib/checkRules.mjs`'s independent re-check read the literal same
 * definition of "what counts as printed" — no drift between generation-time
 * and check-time. `PT_PERSONAS` names the cast whose mid-sentence
 * capitalization the new normalizer + `checkCapitalization` must preserve.
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

/** Cross-course learner + PT NPC cast (design doc §4) — the only proper
 *  nouns a generated sentence is allowed to capitalize mid-sentence without
 *  it looking like a stray capital-letter bug. Place names (Brasil, São
 *  Paulo, França, Califórnia) are carried as `proper-noun` atoms instead and
 *  capitalized because their `pt` surface is already capitalized in the spec. */
export const PT_PERSONAS = new Set(["Sam", "Bia", "Pedro", "Rafael"]);

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
 * Every literally-PRINTED word on a step, across every kind this lesson
 * can emit — the doctrine is about PRINTED first appearance (§4 shared
 * rules), not about which step first CREDITS the atom (answer-floor's job,
 * via `atoms:`) — a word can be printed on a `map`/`imageMcq` step that
 * carries no `atoms:` field at all.
 *
 * `info.body` is DELIBERATELY EXCLUDED (round 2 fix, PTTOOL2 finding 1a):
 * counting the info card's free-text prose let a lane "debut" a new atom
 * just by name-dropping it in the grammar explanation, which always sits
 * at step 2 — so the check could never actually fire (`info` is always
 * intro-capable and always early). Excluding it forces every atom to have
 * a REAL structural first appearance (phrase/buildLit/listenCompLit/
 * imageMcq, or a genuinely-earlier info card in principle) instead of a
 * prose mention standing in for one. `info.title` was never counted either.
 * Cloze *distractor* text (`s.options`) stays counted — that risk is real
 * (a word first printed as a wrong-answer option, before its own debut). */
export function printedWords(s) {
  const texts = [];
  if (s.kind !== "info" && s.pt) texts.push(s.pt);
  if (s.tokens) texts.push(s.tokens.join(" "));
  if (s.target?.surface) texts.push(s.target.surface); // imageMcq: { surface, ... }
  if (typeof s.target === "string") texts.push(s.target); // textMcq: plain PT surface
  if (s.text) texts.push(s.text); // phrase
  if (s.prompt && s.kind === "mcq") texts.push(s.prompt); // pattern mcq: filled PT frame
  if (s.options) texts.push(s.options.join(" "));
  if (s.sentence) texts.push(s.sentence);
  // textMcq/imageMcq distractors are PT surfaces; a pattern `mcq`'s
  // `distractors` are ENGLISH glosses (distractorsEn) and must NOT be
  // scanned as PT text.
  if (s.distractors && (s.kind === "textMcq" || s.kind === "imageMcq")) {
    texts.push(s.distractors.map((d) => (typeof d === "string" ? d : d.surface ?? "")).join(" "));
  }
  if (s.turns) for (const t of s.turns) {
    texts.push(t.npc?.pt ?? "");
    if (t.reply?.mode === "choice") texts.push((t.reply.options ?? []).map((o) => o.text).join(" "));
  }
  if (s.pairs) texts.push(s.pairs.map((p) => p.source ?? "").join(" "));
  return new Set(
    texts.join(" ").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean),
  );
}

/**
 * Small, curated fallback distractor pool — common, unambiguous, already
 * vendor-checkable concrete nouns — used ONLY when no taught-vocab pool is
 * available to draw prior-lesson distractors from (m1 L1's own situation:
 * there IS no prior lesson). A later lesson's `from-spec.mjs` run prefers
 * real taught vocabulary (see `lib/taughtVocab.mjs`) over this pool.
 */
export const FALLBACK_IMAGE_DISTRACTORS = [
  { surface: "livro", meaningEn: "book", emoji: "📖", pos: "noun" },
  { surface: "casa", meaningEn: "house", emoji: "🏠", pos: "noun" },
  { surface: "cachorro", meaningEn: "dog", emoji: "🐶", pos: "noun" },
  { surface: "gato", meaningEn: "cat", emoji: "🐱", pos: "noun" },
  { surface: "carro", meaningEn: "car", emoji: "🚗", pos: "noun" },
  { surface: "médico", meaningEn: "doctor", emoji: "👨‍⚕️", pos: "noun" },
  { surface: "pássaro", meaningEn: "bird", emoji: "🐦", pos: "noun" },
  { surface: "peixe", meaningEn: "fish", emoji: "🐟", pos: "noun" },
];
