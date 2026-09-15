/**
 * Tense/shape classifier for review-lesson MCQ distractor selection
 * (TestFlight #150, Spencer: "We need better English sentence authoring
 * here no?").
 *
 * `sentenceDistractors` (buildSrsReviewLesson.ts) used to sample from the
 * WHOLE course-wide mined-sentence pool with no tense/shape filter, so a
 * present-tense correct answer could land next to three past-tense
 * distractors — the odd-one-out tense leaks the answer and reads as
 * sloppy authoring (友達がわたしにプレゼントをくれる, present, sat next to
 * three past-tense English distractors).
 *
 * Japanese is the source of truth when it's available (every mined-sentence
 * pool entry carries the Japanese `text` alongside its `translation`): the
 * verb ending is unambiguous, whereas English tense has to be guessed from
 * surface regex. `classifyEnShape` is the fallback for callers that only
 * have the English string (e.g. hand-authored strings with no JA pair, and
 * the unit tests that want to pin the English heuristic on its own).
 */

export type SentenceTense = "past" | "present" | "future" | "other";
export type SentencePerson = "I" | "you" | "third" | "other";

export type SentenceShape = {
  tense: SentenceTense;
  person: SentencePerson;
  question: boolean;
  wordCount: number;
};

// ─── English fallback classifier ───────────────────────────────────────

const FUTURE_RE = /\b(will|'ll|going to|shall)\b/i;
const PAST_AUX_RE = /\b(was|were|had|did|used to)\b/i;

// Common irregular past-tense verb forms (surface forms actually seen in
// mined sentences). Not exhaustive — English tense detection is a fallback,
// the Japanese ending is the source of truth whenever it's available.
const IRREGULAR_PAST = new Set([
  "got", "gave", "went", "came", "saw", "ate", "drank", "took", "made",
  "said", "did", "had", "was", "were", "knew", "thought", "found", "told",
  "became", "left", "felt", "kept", "held", "brought", "bought", "caught",
  "taught", "sent", "spent", "built", "understood", "wore", "broke",
  "chose", "drove", "fell", "flew", "forgot", "froze", "grew", "hid",
  "hung", "hurt", "laid", "led", "lent", "let", "lit", "lost", "meant",
  "met", "paid", "put", "quit", "rang", "rode", "rose", "ran", "sang",
  "sank", "sat", "shook", "shone", "shot", "shut", "slept", "slid",
  "spoke", "stole", "swam", "swept", "swore", "swung", "threw", "woke",
  "won", "wrote",
]);

// Base-form words that end in "ed" but are NOT past-tense verbs — kept
// small and specific (the -ed regex is a heuristic, not a parser) rather
// than trying to enumerate every false positive.
const ED_FALSE_POSITIVES = new Set([
  "need", "indeed", "speed", "exceed", "proceed", "succeed",
]);

const PAST_ED_RE = /\b([a-z]+ed)\b/i;

function hasPastEdWord(words: string[]): boolean {
  for (const w of words) {
    const lower = w.toLowerCase().replace(/[^a-z']/g, "");
    if (ED_FALSE_POSITIVES.has(lower)) continue;
    if (PAST_ED_RE.test(lower)) return true;
  }
  return false;
}

function classifyEnTense(en: string, words: string[]): SentenceTense {
  if (FUTURE_RE.test(en)) return "future";
  if (PAST_AUX_RE.test(en)) return "past";
  for (const w of words) {
    if (IRREGULAR_PAST.has(w.toLowerCase().replace(/[^a-z']/g, ""))) {
      return "past";
    }
  }
  if (hasPastEdWord(words)) return "past";
  return "present";
}

function classifyEnPerson(en: string): SentencePerson {
  // Anchored to the sentence start (subject position); \b handles
  // contractions ("I'm", "I'll", "I've") since an apostrophe is a
  // non-word char and still trips a word boundary right after "I"/"you".
  if (/^i\b/i.test(en)) return "I";
  if (/^you\b/i.test(en)) return "you";
  if (/^(he|she|it|they|we)\b/i.test(en)) return "third";
  // Question inversion / wh-fronting — "Did you...", "Where did you go...",
  // "What do I..." — the subject pronoun isn't necessarily the very next
  // word (a wh-word can front ahead of the aux), so scan the first few
  // words rather than only the second.
  const lead = en.trim().split(/\s+/).slice(0, 5).join(" ");
  const early = /\b(you|i)\b/i.exec(lead);
  if (early) return early[1].toLowerCase() === "you" ? "you" : "I";
  return "third";
}

const QUESTION_LEAD_RE =
  /^(do|does|did|is|are|was|were|will|can|could|would|should|what|who|where|when|why|how|which)\b/i;

function classifyEnQuestion(en: string): boolean {
  if (/\?\s*$/.test(en)) return true;
  return QUESTION_LEAD_RE.test(en);
}

/** Classify an English sentence from its surface form alone. Fallback path
 *  used when no paired Japanese text is available. */
export function classifyEnShape(en: string): SentenceShape {
  const trimmed = en.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  return {
    tense: trimmed ? classifyEnTense(trimmed, words) : "other",
    person: trimmed ? classifyEnPerson(trimmed) : "other",
    question: trimmed ? classifyEnQuestion(trimmed) : false,
    wordCount: words.length,
  };
}

// ─── Japanese classifier (preferred for PAST — the ending is unambiguous) ──

// NOTE: bare "んだ" (the nasal-stem godan past, 飲んだ/読んだ/死んだ...) was
// dropped from this list after course-data measurement (2026-09-15):
// checking against the real mined-sentence pool, it false-positived on any
// ordinary noun+copula sentence whose noun happens to end in ん (それは
// ほんだ。, "that is a book" — PRESENT copula だ, not verb past んだ), which
// outnumbered genuine nasal-stem past verbs in the corpus. た-final past
// (食べた, 行った) and the polite/copula ました/でした/だった forms are
// unambiguous and still caught; the んだ class falls back to "present"
// (non-past) — a documented recall loss, not a class of new false leaks.
const JA_PAST_RE = /(ました|でした|だった|た)$/;
const JA_FUTURE_RE = /(でしょう|ましょう|おう|よう)$/;

/** Classify Japanese tense + question from the verb/copula ending.
 *  た/ました/でした/だった = past; volitional おう/よう, ましょう/でしょう
 *  = future; か/？ = question. Anything else defaults to present (JA has
 *  no separately-marked present tense — the dictionary/masu form doubles
 *  as present/non-past, see `classifySentenceShape` for how that
 *  non-past ambiguity gets resolved against the English gloss). */
export function classifyJaShape(ja: string): { tense: SentenceTense; question: boolean } {
  const trimmed = ja.trim();
  if (!trimmed) return { tense: "other", question: false };
  const question = /[か？?]\s*[。]?\s*$/.test(trimmed);
  let core = trimmed.replace(/[。！!?？]+$/, "");
  if (question) core = core.replace(/か$/, "");
  if (JA_PAST_RE.test(core)) return { tense: "past", question };
  if (JA_FUTURE_RE.test(core)) return { tense: "future", question };
  return { tense: "present", question };
}

/**
 * Combined classifier: prefer the Japanese ending for PAST and explicit
 * volitional/future markers — those endings are unambiguous. Japanese
 * itself does NOT grammatically distinguish present from future (the
 * dictionary/masu non-past form covers both — 「いく」/「いきます」 reads as
 * "goes" or "I'll go" depending on context), so when JA says non-past,
 * defer to the English gloss's own present/future marking (will/'ll/going
 * to) rather than collapsing every non-past sentence into "present" —
 * course-data measurement (2026-09-15) showed that collapse was the
 * dominant source of residual odd-one-out MCQs post-fix: casual JA
 * intention statements ("のむ", "いく") are routinely glossed with an
 * English future ("I'll drink", "I'll go"), and bucketing those as
 * "present" put them in the wrong tier against real present-tense English
 * distractors. Person has no JA morphology either way, so it's always read
 * off English.
 */
export function classifySentenceShape(en: string, ja?: string): SentenceShape {
  const enShape = classifyEnShape(en);
  if (!ja) return enShape;
  const jaShape = classifyJaShape(ja);
  if (jaShape.tense === "other") return enShape;
  const tense =
    jaShape.tense === "present"
      ? (enShape.tense === "future" ? "future" : "present")
      : jaShape.tense;
  return {
    tense,
    person: enShape.person,
    question: jaShape.question,
    wordCount: enShape.wordCount,
  };
}
