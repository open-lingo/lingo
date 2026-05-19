/**
 * Shared factories for the JA M3-M7 grammar-spine modules (2026-05-16).
 *
 * Tightens repetition across the 5 newly authored modules + review pools.
 * No new step types — only thin wrappers over the existing primitives so
 * call sites stay readable.
 */
import type {
  BuildSentenceStep,
  GrammarRuleStep,
  GrammarExample,
  InfoStep,
  LessonStep,
  ListeningBuildStep,
  ListeningComprehensionStep,
  MatchPairsStep,
  MultipleChoiceStep,
  ParticleClozeStep,
  PhraseCardStep,
  SelfExplanationMcqStep,
  SelfExplanationOption,
  SpeakingStep,
  TranslateStep,
  WordImageMcqStep,
} from "../types";

export function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

export function phrase(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

export function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
): ParticleClozeStep {
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options,
    meaningEn,
    audioText,
    explanation,
  };
}

export function build(
  id: string,
  prompt: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
): BuildSentenceStep {
  return {
    id,
    type: "build_sentence",
    prompt,
    targetSentence: target,
    tiles,
    correctOrder,
    granularity: "word",
    audioKey: target,
    targetAnnotation: [{ surface: target, reading: target }],
  };
}

export function infoStep(
  id: string,
  title: string,
  body: string,
  variant: InfoStep["variant"] = "default",
): InfoStep {
  return { id, type: "info", title, body, variant };
}

export function grammarRule(opts: {
  id: string;
  title: string;
  rule: string;
  examples: GrammarExample[];
  antiPattern?: GrammarExample & { why: string };
  cultureNote?: string;
}): GrammarRuleStep {
  return {
    id: opts.id,
    type: "grammar_rule",
    title: opts.title,
    rule: opts.rule,
    examples: opts.examples,
    antiPattern: opts.antiPattern,
    cultureNote: opts.cultureNote,
  };
}

export function speaking(
  id: string,
  targetPhrase: string,
  translation: string,
): SpeakingStep {
  return {
    id,
    type: "speaking",
    targetPhrase,
    translation,
    stubbed: true,
    audioKey: targetPhrase,
    targetAnnotation: [{ surface: targetPhrase, reading: targetPhrase }],
  };
}

/**
 * Speaking-target option for the dialogue lesson factory.
 *
 * "representative": one whole-utterance speaking step appended to the
 * dialogue (default for now per Spencer's spec — wait for Whisper
 * sentence-level validation before per-line).
 *
 * "per-line": one speaking step per dialogue line where `speakingPhrase`
 * is non-null. Architectural switch only — turn on later by changing this
 * one arg at the call site.
 */
export type SpeakingTargets = "representative" | "per-line";

export type DialogueLine = {
  speaker: string;
  meaningEn: string;
  romaji: string;
  kana: string;
  cultureNote?: string;
  /** If non-null, available as a speaking target when mode is per-line. */
  speakingPhrase?: string;
};

/**
 * Dialogue lesson factory — composes a phrase-card-per-line dialogue plus
 * a speaking step. Hook for future per-line speaking via `speakingTargets`
 * option.
 */
export function dialogueLesson(opts: {
  idPrefix: string;
  /** Whole-utterance speaking phrase + translation for the representative
   *  mode. Required so that, even in per-line mode, a sane fallback exists
   *  when none of the lines declare `speakingPhrase`. */
  representative: { phrase: string; translation: string };
  lines: DialogueLine[];
  speakingTargets?: SpeakingTargets;
}): (PhraseCardStep | SpeakingStep)[] {
  const mode: SpeakingTargets = opts.speakingTargets ?? "representative";
  const out: (PhraseCardStep | SpeakingStep)[] = [];
  for (let i = 0; i < opts.lines.length; i++) {
    const line = opts.lines[i];
    out.push({
      id: `${opts.idPrefix}-l${i + 1}`,
      type: "phrase_card",
      meaningEn: `${line.speaker}: ${line.meaningEn}`,
      romaji: line.romaji,
      kana: line.kana,
      cultureNote: line.cultureNote,
    });
    if (mode === "per-line" && line.speakingPhrase) {
      out.push(
        speaking(
          `${opts.idPrefix}-l${i + 1}-say`,
          line.speakingPhrase,
          line.meaningEn,
        ),
      );
    }
  }
  if (mode === "representative") {
    out.push(
      speaking(
        `${opts.idPrefix}-say`,
        opts.representative.phrase,
        opts.representative.translation,
      ),
    );
  }
  return out;
}

/**
 * Self-explanation MCQ factory. Authors pass exactly one `rule` option +
 * one `surface` option + one `distractor` option (order at author site is
 * irrelevant — the renderer shuffles per-mount). Helper handles correct-id
 * wiring so call sites don't have to repeat the rule-option's id.
 *
 * Pedagogy: Dunlosky 2013 moderate-utility self-explanation. Use as a
 * follow-up to a committed particle_cloze / multiple_choice in M3+.
 */
export function selfExplain(opts: {
  id: string;
  anchorLabel: string;
  anchorAudioText?: string;
  question: string;
  rule: { text: string };
  surface: { text: string };
  distractor: { text: string };
  ruleExplanation?: string;
}): SelfExplanationMcqStep {
  const options: SelfExplanationOption[] = [
    { id: `${opts.id}-rule`, text: opts.rule.text, reasonType: "rule" },
    { id: `${opts.id}-surface`, text: opts.surface.text, reasonType: "surface" },
    { id: `${opts.id}-distractor`, text: opts.distractor.text, reasonType: "distractor" },
  ];
  return {
    id: opts.id,
    type: "self_explanation_mcq",
    anchor: {
      label: opts.anchorLabel,
      audioText: opts.anchorAudioText,
    },
    question: opts.question,
    options,
    correctOptionId: `${opts.id}-rule`,
    ruleExplanation: opts.ruleExplanation,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * M3-M7 rebuild factories (2026-05-18)
 *
 * Added per docs/m3-m7-rebuild-spec-2026-05-18.md §8. These keep the
 * M3-M7 rebuild call sites readable AND enforce the compounding-review
 * + same-answer-cluster contracts the spec mandates.
 * ──────────────────────────────────────────────────────────────────────── */

/** Cumulative atom pool for prior-module review-tail draws. */
export type ReviewAtom = {
  kana: string;
  meaningEn: string;
  emoji?: string;
  fromModule: "m1" | "m2" | "m3" | "m4" | "m5" | "m6" | "m7";
};

/**
 * Aggregated atom-level vocab from M1 + M2. Curated additive subset for
 * the M3-M7 grammar-spine rebuild — does NOT duplicate every entry in
 * `M1_REVIEW_POOL` (that's a `RowWord[]` for kana-row helpers). Authors
 * extend this constant per module as later modules ship.
 *
 * M1 (vowels + ka/sa/ta/na/ha/ma/ya/ra/wa anchors): traveler-useful
 * nouns the learner has actually built or recognized.
 * M2 (g/z/d/b/p + yōon): anchor words from the dakuten + yōon rows.
 */
export const M3_M7_REVIEW_POOL: ReviewAtom[] = [
  // ── M1 anchors (curated subset; emoji-bearing for visual MCQ) ──
  { kana: "ねこ", meaningEn: "cat",      emoji: "🐱", fromModule: "m1" },
  { kana: "いぬ", meaningEn: "dog",      emoji: "🐕", fromModule: "m1" },
  { kana: "やま", meaningEn: "mountain", emoji: "⛰️", fromModule: "m1" },
  { kana: "かわ", meaningEn: "river",    emoji: "🏞️", fromModule: "m1" },
  { kana: "そら", meaningEn: "sky",      emoji: "☁️", fromModule: "m1" },
  { kana: "つき", meaningEn: "moon",     emoji: "🌙", fromModule: "m1" },
  { kana: "ほし", meaningEn: "star",     emoji: "⭐", fromModule: "m1" },
  { kana: "はな", meaningEn: "flower",   emoji: "🌷", fromModule: "m1" },
  { kana: "うみ", meaningEn: "sea",      emoji: "🌊", fromModule: "m1" },
  { kana: "かい", meaningEn: "shell",    emoji: "🐚", fromModule: "m1" },
  { kana: "かお", meaningEn: "face",     emoji: "😀", fromModule: "m1" },
  { kana: "こえ", meaningEn: "voice",    emoji: "🗣️", fromModule: "m1" },
  { kana: "えき", meaningEn: "station",  emoji: "🚉", fromModule: "m1" },
  { kana: "あさ", meaningEn: "morning",  emoji: "🌅", fromModule: "m1" },
  { kana: "すし", meaningEn: "sushi",    emoji: "🍣", fromModule: "m1" },
  { kana: "ふね", meaningEn: "boat",     emoji: "🚢", fromModule: "m1" },
  { kana: "ひと", meaningEn: "person",   emoji: "👤", fromModule: "m1" },
  { kana: "うた", meaningEn: "song",     emoji: "🎵", fromModule: "m1" },
  { kana: "もも", meaningEn: "peach",    emoji: "🍑", fromModule: "m1" },
  { kana: "ゆき", meaningEn: "snow",     emoji: "❄️", fromModule: "m1" },
  // ── M2 g-row anchors ──
  { kana: "めがね", meaningEn: "glasses",     emoji: "👓", fromModule: "m2" },
  { kana: "かぎ",   meaningEn: "key",         emoji: "🔑", fromModule: "m2" },
  { kana: "げんき", meaningEn: "well/energy", emoji: "💪", fromModule: "m2" },
  { kana: "ごはん", meaningEn: "rice/meal",   emoji: "🍚", fromModule: "m2" },
  // ── M3 anchors (loanwords + people + concrete nouns from M3 v2 rebuild) ──
  { kana: "コーヒー",   meaningEn: "coffee",            emoji: "☕", fromModule: "m3" },
  { kana: "タクシー",   meaningEn: "taxi",              emoji: "🚕", fromModule: "m3" },
  { kana: "ホテル",     meaningEn: "hotel",             emoji: "🏨", fromModule: "m3" },
  { kana: "レストラン", meaningEn: "restaurant",        emoji: "🍽️", fromModule: "m3" },
  { kana: "ビール",     meaningEn: "beer",              emoji: "🍺", fromModule: "m3" },
  { kana: "がくせい",   meaningEn: "student",           emoji: "🎓", fromModule: "m3" },
  { kana: "せんせい",   meaningEn: "teacher",           emoji: "👩‍🏫", fromModule: "m3" },
  { kana: "ともだち",   meaningEn: "friend",            emoji: "🧑‍🤝‍🧑", fromModule: "m3" },
  { kana: "なまえ",     meaningEn: "name",              emoji: "📛", fromModule: "m3" },
  { kana: "ほん",       meaningEn: "book",              emoji: "📖", fromModule: "m3" },
  { kana: "みず",       meaningEn: "water",             emoji: "💧", fromModule: "m3" },
  // ── M4 anchors (possession/pointer-focused — objects you'd point at) ──
  { kana: "ペン",       meaningEn: "pen",               emoji: "🖊️", fromModule: "m4" },
  { kana: "かばん",     meaningEn: "bag",               emoji: "👜", fromModule: "m4" },
  { kana: "くるま",     meaningEn: "car",               emoji: "🚗", fromModule: "m4" },
  { kana: "カメラ",     meaningEn: "camera",            emoji: "📷", fromModule: "m4" },
  { kana: "けいたい",   meaningEn: "mobile phone",      emoji: "📱", fromModule: "m4" },
  { kana: "かさ",       meaningEn: "umbrella",          emoji: "☂️", fromModule: "m4" },
  { kana: "じしょ",     meaningEn: "dictionary",        emoji: "📕", fromModule: "m4" },
  { kana: "いす",       meaningEn: "chair",             emoji: "🪑", fromModule: "m4" },
  { kana: "てがみ",     meaningEn: "letter (postal)",   emoji: "✉️", fromModule: "m4" },
  { kana: "じてんしゃ", meaningEn: "bicycle",           emoji: "🚲", fromModule: "m4" },
  { kana: "とけい",     meaningEn: "watch/clock",       emoji: "⌚", fromModule: "m4" },
  { kana: "つくえ",     meaningEn: "desk",              emoji: "🗄️", fromModule: "m4" },
  { kana: "しんぶん",   meaningEn: "newspaper",         emoji: "📰", fromModule: "m4" },
  { kana: "ざっし",     meaningEn: "magazine",          emoji: "📔", fromModule: "m4" },
  { kana: "あね",       meaningEn: "older sister",      emoji: "👩", fromModule: "m4" },
  { kana: "あに",       meaningEn: "older brother",     emoji: "👨", fromModule: "m4" },
  { kana: "はは",       meaningEn: "(my) mother",       emoji: "👩‍👦", fromModule: "m4" },
  { kana: "ちち",       meaningEn: "(my) father",       emoji: "👨‍👦", fromModule: "m4" },
  { kana: "あなた",     meaningEn: "you",               emoji: "🫵", fromModule: "m4" },
  { kana: "わたし",     meaningEn: "I/me",              emoji: "🙋", fromModule: "m4" },
  { kana: "にほん",     meaningEn: "Japan",             emoji: "🇯🇵", fromModule: "m4" },
  { kana: "アメリカ",   meaningEn: "America",           emoji: "🇺🇸", fromModule: "m4" },
  { kana: "なん",       meaningEn: "what",              emoji: "❓", fromModule: "m4" },
  { kana: "どれ",       meaningEn: "which one",         emoji: "🤔", fromModule: "m4" },
  { kana: "これ",       meaningEn: "this (near me)",    emoji: "👇", fromModule: "m4" },
  // ── M5 anchors (numbers + counters + café/transactional) ──
  // Numbers carry digit-emoji so vocabMcq can use them as visual MCQ
  // targets for M6+ review-tails. Counter + transactions vocab give
  // M6/M7 dialogue/cloze sites concrete nouns to lean on.
  { kana: "いち",       meaningEn: "1 (one)",           emoji: "1️⃣", fromModule: "m5" },
  { kana: "に",         meaningEn: "2 (two)",           emoji: "2️⃣", fromModule: "m5" },
  { kana: "さん",       meaningEn: "3 (three)",         emoji: "3️⃣", fromModule: "m5" },
  { kana: "よん",       meaningEn: "4 (four)",          emoji: "4️⃣", fromModule: "m5" },
  { kana: "ご",         meaningEn: "5 (five)",          emoji: "5️⃣", fromModule: "m5" },
  { kana: "ろく",       meaningEn: "6 (six)",           emoji: "6️⃣", fromModule: "m5" },
  { kana: "なな",       meaningEn: "7 (seven)",         emoji: "7️⃣", fromModule: "m5" },
  { kana: "はち",       meaningEn: "8 (eight)",         emoji: "8️⃣", fromModule: "m5" },
  { kana: "きゅう",     meaningEn: "9 (nine)",          emoji: "9️⃣", fromModule: "m5" },
  { kana: "じゅう",     meaningEn: "10 (ten)",          emoji: "🔟", fromModule: "m5" },
  { kana: "ひとり",     meaningEn: "1 person",          emoji: "🧍", fromModule: "m5" },
  { kana: "ふたり",     meaningEn: "2 people",          emoji: "👥", fromModule: "m5" },
  { kana: "さんにん",   meaningEn: "3 people",          emoji: "👨‍👩‍👦", fromModule: "m5" },
  { kana: "おかね",     meaningEn: "money",             emoji: "💰", fromModule: "m5" },
  { kana: "いくら",     meaningEn: "how much (price)",  emoji: "💲", fromModule: "m5" },
  { kana: "えん",       meaningEn: "yen",               emoji: "💴", fromModule: "m5" },
  { kana: "おちゃ",     meaningEn: "green tea",         emoji: "🍵", fromModule: "m5" },
  { kana: "ください",   meaningEn: "please give me",    emoji: "🤲", fromModule: "m5" },
  // ── M6 anchors (places + transport + existence verbs) ──
  { kana: "こうえん",     meaningEn: "park",              emoji: "🌲", fromModule: "m6" },
  { kana: "がっこう",     meaningEn: "school",            emoji: "🏫", fromModule: "m6" },
  { kana: "うち",         meaningEn: "home",              emoji: "🏡", fromModule: "m6" },
  { kana: "えき",         meaningEn: "train station",     emoji: "🚉", fromModule: "m6" },
  { kana: "トイレ",       meaningEn: "toilet",            emoji: "🚽", fromModule: "m6" },
  { kana: "コンビニ",     meaningEn: "convenience store", emoji: "🏪", fromModule: "m6" },
  { kana: "ぎんこう",     meaningEn: "bank",              emoji: "🏦", fromModule: "m6" },
  { kana: "びょういん",   meaningEn: "hospital",          emoji: "🏥", fromModule: "m6" },
  { kana: "ゆうびんきょく", meaningEn: "post office",     emoji: "🏤", fromModule: "m6" },
  { kana: "としょかん",   meaningEn: "library",           emoji: "🏛️", fromModule: "m6" },
  { kana: "くうこう",     meaningEn: "airport",           emoji: "✈️", fromModule: "m6" },
  { kana: "みせ",         meaningEn: "shop",              emoji: "🏬", fromModule: "m6" },
  { kana: "へや",         meaningEn: "room",              emoji: "🛋️", fromModule: "m6" },
  { kana: "でんしゃ",     meaningEn: "train",             emoji: "🚆", fromModule: "m6" },
  { kana: "バス",         meaningEn: "bus",               emoji: "🚌", fromModule: "m6" },
  { kana: "ちかてつ",     meaningEn: "subway",            emoji: "🚇", fromModule: "m6" },
  { kana: "あります",     meaningEn: "exists (thing)",    emoji: "📦", fromModule: "m6" },
  { kana: "います",       meaningEn: "exists (alive)",    emoji: "🧑", fromModule: "m6" },
  // ── M7 anchors (verbs in ます-form + food/drink objects) ──
  { kana: "たべます",   meaningEn: "eat (polite)",      emoji: "🍴", fromModule: "m7" },
  { kana: "のみます",   meaningEn: "drink (polite)",    emoji: "🥤", fromModule: "m7" },
  { kana: "いきます",   meaningEn: "go (polite)",       emoji: "🚶", fromModule: "m7" },
  { kana: "みます",     meaningEn: "watch (polite)",    emoji: "👀", fromModule: "m7" },
  { kana: "よみます",   meaningEn: "read (polite)",     emoji: "📚", fromModule: "m7" },
  { kana: "かきます",   meaningEn: "write (polite)",    emoji: "✍️", fromModule: "m7" },
  { kana: "すし",       meaningEn: "sushi",             emoji: "🍣", fromModule: "m7" },
  { kana: "ラーメン",   meaningEn: "ramen",             emoji: "🍜", fromModule: "m7" },
  { kana: "パン",       meaningEn: "bread",             emoji: "🍞", fromModule: "m7" },
  { kana: "ごはん",     meaningEn: "rice/meal",         emoji: "🍚", fromModule: "m7" },
  { kana: "ジュース",   meaningEn: "juice",             emoji: "🧃", fromModule: "m7" },
  { kana: "おさけ",     meaningEn: "sake",              emoji: "🍶", fromModule: "m7" },
];

/**
 * Draw N atoms from a prior-module pool, deterministic by seed. Identical
 * shuffle algorithm to `pickReviewWords` in _consonantRowHelpers so atom
 * rotation across re-mounts of the same lesson stays stable.
 *
 * When `n` exceeds the pool size, returns the whole pool.
 */
export function pickReviewAtoms(
  seed: string,
  pool: ReviewAtom[],
  n: number,
): ReviewAtom[] {
  const out = pool.slice();
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.min(n, out.length));
}

/** Deterministic 32-bit FNV-like hash → [0, slots). Used for slot rotation
 *  on auto-generated MCQs so the correct answer doesn't always land in
 *  position 0. */
function slotFor(id: string, slots: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % slots;
}

/**
 * `match_pairs` factory drawing pairs from a prior atom pool — meaning
 * EN ↔ kana. Used as a review-tail step; tap-source plays TTS so the
 * grid doubles as listening reinforcement.
 *
 * Caller passes a stable id-prefix; the resulting step id is
 * `${idPrefix}-match-review`. 4-6 pairs recommended for the M3 tail (≥
 * 4 keeps the grid interesting; > 6 starts to drag).
 */
export function reviewMatchPairs(
  idPrefix: string,
  atoms: ReviewAtom[],
): MatchPairsStep {
  return {
    id: `${idPrefix}-match-review`,
    type: "match_pairs",
    prompt: "Match each Japanese word to its meaning (review)",
    playAudioOnSelect: true,
    pairs: atoms.map((a, i) => ({
      id: `p-${i}`,
      source: a.kana,
      target: a.meaningEn,
      sourceAnnotation: [{ surface: a.kana, reading: a.kana }],
    })),
  };
}

/**
 * Words whose audit-graded visual cue (Noto emoji OR custom SVG) is
 * either misleading or weak per docs/emoji-blocked-words-2026-05-18.md.
 * The kana stay in the curriculum and ride along on pools as `emoji`-bearing
 * atoms (so listeningBuild / listeningComp / build_sentence can use them),
 * but `vocabMcq` and `priorWordMcq` skip them from BOTH target and
 * distractor slots. Authors pick a different step type for these words.
 *
 * Add to this set when the audit flags a new word. Strip an entry when
 * we ship custom art the audit grades "confident."
 */
export const WORD_IMAGE_MCQ_BLOCKLIST: ReadonlySet<string> = new Set([
  "あなた",   // pronoun — context-dropped in practice
  "あに",     // older brother — age cue carried by kanji, not face
  "あね",     // older sister — same
  "ちち",     // (my) father — parent composition reads as "parent," not father
  "はは",     // (my) mother — same
  "あります", // exists (thing) — grammatical existence, no visual referent
  "います",   // exists (alive) — same
  "こえ",     // voice — 🗣️ reads as "speech/shout," not the abstract "voice"
]);

/**
 * Helper: returns a copy of `pool` with image-blocklisted atoms removed.
 * Use when declaring per-module review pools that feed `vocabMcq` —
 * blocklisted atoms can't be MCQ targets and shouldn't be MCQ distractors
 * either. The unfiltered pool stays available for matchPairs / listening
 * helpers (text + audio surfaces, no image).
 */
export function withoutMcqBlocked(pool: ReviewAtom[]): ReviewAtom[] {
  return pool.filter((a) => !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana));
}

/**
 * `word_image_mcq` factory with auto-drawn distractors from a prior atom
 * pool. Skips the target itself + any atom without an emoji (visual MCQ
 * requires the emoji as the semantic cue). Throws if the target has no
 * emoji (the call site should use `listeningComp` / `listeningBuild`
 * instead — visual MCQ on an emoji-less word is unsolvable). Also throws
 * if the target is in `WORD_IMAGE_MCQ_BLOCKLIST` — those words are
 * teachable via other step types, just not via visual MCQ.
 *
 * Used to introduce / re-encounter a vocab atom via visual recognition.
 * Distractors deterministic by id so a re-mount picks the same foils.
 */
export function vocabMcq(
  idPrefix: string,
  target: ReviewAtom,
  distractorPool: ReviewAtom[],
): WordImageMcqStep {
  if (!target.emoji) {
    throw new Error(
      `vocabMcq: target '${target.kana}' has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  if (WORD_IMAGE_MCQ_BLOCKLIST.has(target.kana)) {
    throw new Error(
      `vocabMcq: target '${target.kana}' is image-blocked (see docs/emoji-blocked-words-2026-05-18.md) — use listeningBuild / listeningComp / particle_cloze / phrase_card instead`,
    );
  }
  const filtered = distractorPool.filter(
    (a) => a.kana !== target.kana && Boolean(a.emoji) && !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
  );
  const picked = pickReviewAtoms(`${idPrefix}-distractors`, filtered, 3);
  if (picked.length < 3) {
    throw new Error(
      `vocabMcq: not enough emoji-bearing distractors for '${target.kana}' (have ${picked.length}, need 3)`,
    );
  }
  const slot = slotFor(idPrefix, 4);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: target.kana, emoji: target.emoji });
    } else {
      const d = picked[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji! });
    }
  }
  return {
    id: idPrefix,
    type: "word_image_mcq",
    meaningEn: target.meaningEn,
    options,
    correctOptionId: "correct",
  };
}

/**
 * Throws if more than `maxAdjacent` consecutive `particle_cloze` steps
 * share the same `correctParticle`. Catches the M3-5 / M6-6 / M7-5
 * "は か は か は か" / "がががが" / "をををを" anti-patterns at build
 * time before the lesson exports.
 *
 * Steps that aren't particle_cloze reset the run counter. Default
 * threshold = 2 (i.e. max 2 same-answer in a row).
 */
export function assertNoSameAnswerCluster(
  steps: LessonStep[],
  maxAdjacent = 2,
): void {
  let runParticle: string | null = null;
  let runLen = 0;
  for (const step of steps) {
    if (step.type !== "particle_cloze") {
      runParticle = null;
      runLen = 0;
      continue;
    }
    if (step.correctParticle === runParticle) {
      runLen += 1;
      if (runLen > maxAdjacent) {
        throw new Error(
          `assertNoSameAnswerCluster: ${runLen} consecutive particle_cloze steps with correct='${runParticle}' (max ${maxAdjacent}). Offending step id: ${step.id}`,
        );
      }
    } else {
      runParticle = step.correctParticle;
      runLen = 1;
    }
  }
}

/**
 * Thin wrapper to author a `translate` step (typed-bank or whole-sentence).
 * M3-M7 spec §4 mandates ≥1 generation step per sub-lesson; this is the
 * highest-leverage one when build_sentence isn't the right fit.
 *
 * `direction = "ja-from-en"` (default): prompt is English, learner types
 * the Japanese. `acceptedAnswers` includes the canonical kana plus any
 * romaji equivalents the grader should accept.
 */
export function translateStep(opts: {
  id: string;
  promptEn: string;
  acceptedAnswers: string[];
  audioText?: string;
}): TranslateStep {
  return {
    id: opts.id,
    type: "translate",
    sourceText: opts.promptEn,
    sourceLanguage: "native",
    acceptedAnswers: opts.acceptedAnswers,
    audioKey: opts.audioText,
  };
}

/**
 * `listening_build` factory for a sentence — hear a target sentence,
 * assemble it from a word-tile bank. Distinct from the kana-mora
 * listening_build in `_consonantRowHelpers` (this one uses word-level
 * granularity for grammar-spine production).
 */
export function listeningBuildSentence(opts: {
  id: string;
  target: string;
  tiles: string[];
  correctOrder: string[];
  promptEn: string;
}): ListeningBuildStep {
  return {
    id: opts.id,
    type: "listening_build",
    audioKey: opts.target,
    prompt: opts.promptEn,
    targetSentence: opts.target,
    tiles: opts.tiles,
    correctOrder: opts.correctOrder,
    granularity: "word",
    targetAnnotation: [{ surface: opts.target, reading: opts.target }],
  };
}

/**
 * `listening_comprehension` factory — hear a phrase, pick its English
 * meaning. Slot-shuffled by id so position bias doesn't leak.
 */
export function listeningCompSentence(opts: {
  id: string;
  audioText: string;
  correctMeaningEn: string;
  distractorsEn: [string, string, string];
  question?: string;
}): ListeningComprehensionStep {
  const items = [
    { id: "correct", text: opts.correctMeaningEn },
    { id: "opt-1", text: opts.distractorsEn[0] },
    { id: "opt-2", text: opts.distractorsEn[1] },
    { id: "opt-3", text: opts.distractorsEn[2] },
  ];
  const slot = slotFor(opts.id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "listening_comprehension",
    audioKey: opts.audioText,
    transcript: opts.audioText,
    question: opts.question ?? "What does this sentence mean?",
    options: items,
    correctOptionId: "correct",
    transcriptAnnotation: [{ surface: opts.audioText, reading: opts.audioText }],
  };
}

/**
 * `multiple_choice` factory for a particle-or-grammar mini-quiz where the
 * prompt is a transliterated meaning and the answer set is kana phrases.
 * Slot-shuffled by id. Distinct from `particle_cloze`: this is whole-
 * sentence selection ("which kana sentence means X?"), not particle fill.
 */
export function sentenceMcq(opts: {
  id: string;
  prompt: string;
  promptAudioText?: string;
  correctKana: string;
  distractorsKana: [string, string, string];
  explanation?: string;
}): MultipleChoiceStep {
  const items = [
    { id: "correct", text: opts.correctKana },
    { id: "opt-1", text: opts.distractorsKana[0] },
    { id: "opt-2", text: opts.distractorsKana[1] },
    { id: "opt-3", text: opts.distractorsKana[2] },
  ];
  const slot = slotFor(opts.id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id: opts.id,
    type: "multiple_choice",
    prompt: opts.prompt,
    promptAudioText: opts.promptAudioText,
    options: items,
    correctOptionId: "correct",
    explanation: opts.explanation,
    optionsHideRomaji: true,
  };
}

/**
 * Example self-explanation step (exercise / reference). Follows a
 * particle_cloze about の (possession). Not wired into a shipping lesson
 * yet — authors can import and slot it as needed.
 */
export const EXAMPLE_SELF_EXPLAIN_NO_POSSESSION: SelfExplanationMcqStep =
  selfExplain({
    id: "ja-ex-self-explain-no-1",
    anchorLabel: "You picked の in: わたし＿ ほん (my book)",
    anchorAudioText: "わたしの ほん",
    question: "Why is の correct in 'わたしの ほん'?",
    rule: { text: "の attaches the owner to what they own." },
    surface: { text: "の always comes after a noun." },
    distractor: { text: "の is the question marker." },
    ruleExplanation:
      "の is the possession particle — it links owner (わたし) to thing owned (ほん).",
  });
