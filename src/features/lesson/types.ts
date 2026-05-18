import type { CardSegment } from "@/features/flashcards/data/types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

export type StepType =
  | "info"
  | "teach"
  | "multiple_choice"
  | "build_sentence"
  | "match_pairs"
  | "fill_blank"
  | "translate"
  | "listening_comprehension"
  | "listening_build"
  | "speaking"
  | "symbol_intro"
  | "symbol_trace"
  | "symbol_recognition"
  | "symbol_production"
  | "symbol_to_sound"
  | "word_image_mcq"
  | "phrase_card"
  | "grammar_rule"
  | "particle_cloze"
  | "self_explanation_mcq"
  | "row_test";

export type StepBase = {
  id: string;
  type: StepType;
  hint?: string;
};

export type InfoStep = StepBase & {
  type: "info";
  title?: string;
  body: string;
  imageKey?: string;
  variant?: "tip" | "culture" | "grammar" | "default" | "win";
};

export type TeachVocab = {
  term: string;
  translation: string;
  audioKey?: string;
  imageKey?: string;
  breakdown?: CardSegment[];
  annotation?: JapaneseAnnotation[];
};

export type TeachStep = StepBase & {
  type: "teach";
  content: {
    text: string;
    vocab?: TeachVocab;
    note?: string;
  };
};

export type Option = {
  id: string;
  text: string;
  imageKey?: string;
};

export type MultipleChoiceStep = StepBase & {
  type: "multiple_choice";
  prompt: string;
  promptAudioKey?: string;
  promptImageKey?: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
  promptAnnotation?: JapaneseAnnotation[];
  optionAnnotations?: (JapaneseAnnotation[] | undefined)[];
  /**
   * When set, looks up TTS for this phrase via the JA manifest and auto-plays
   * 500ms after mount. Used for prompt-audio-driven drills (e.g. "you hear
   * 'mizu' — which kana starts it?").
   */
  promptAudioText?: string;
  /**
   * When true, hides the prompt text and renders a large Play button instead.
   * Forces an audio-first recognition mode where the learner must listen
   * before choosing. Pairs with `promptAudioText`.
   */
  audioOnlyPrompt?: boolean;
  /**
   * When true, option text is rendered raw (no AnnotatedJa ruby helpers).
   * Use on test/quiz cards where the romaji over kana would literally
   * be the answer. Default false keeps the standard mastery-gated helper
   * scaffold for teaching cards.
   */
  optionsHideRomaji?: boolean;
  /**
   * When true, render romaji ruby above kana options ONLY when the
   * option is currently selected (clicked, pre-submit). Deselecting
   * hides it again. Used by the M2 "How do you say X?" translation MCQ
   * so the learner can verify their guess by tapping, but cannot
   * romaji-skim all 4 options at once and bypass the kana entirely
   * (Marcus/Sarah audit, 2026-05-17).
   */
  optionsRevealRomajiOnSelect?: boolean;
};

export type BuildSentenceStep = StepBase & {
  type: "build_sentence";
  prompt: string;
  targetSentence: string;
  tiles: string[];
  correctOrder: string[];
  audioKey?: string;
  granularity: "word" | "character";
  targetAnnotation?: JapaneseAnnotation[];
};

export type MatchPair = {
  id: string;
  source: string;
  target: string;
  sourceAnnotation?: JapaneseAnnotation[];
};

export type MatchPairsStep = StepBase & {
  type: "match_pairs";
  prompt: string;
  pairs: MatchPair[];
  /** When true, tapping a source-side tile plays its TTS (kana → audio).
   *  Used by M2 dakuten/yōon match steps where the kana is the recall
   *  cue and audio is the secondary reinforcement channel. Default false
   *  keeps prior behavior on existing M1 match steps. */
  playAudioOnSelect?: boolean;
};

export type Blank = {
  id: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
};

export type FillBlankStep = StepBase & {
  type: "fill_blank";
  sentence: string;
  blanks: Blank[];
  wordBank?: string[];
  sentenceAnnotation?: JapaneseAnnotation[];
};

export type TranslateStep = StepBase & {
  type: "translate";
  sourceText: string;
  sourceLanguage: "target" | "native";
  acceptedAnswers: string[];
  audioKey?: string;
  sourceAnnotation?: JapaneseAnnotation[];
};

export type ListeningComprehensionStep = StepBase & {
  type: "listening_comprehension";
  audioKey: string;
  transcript?: string;
  /** Romaji form of `transcript`, shown alongside the kana to reinforce
   * sound↔script correlation. */
  romaji?: string;
  question: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
  transcriptAnnotation?: JapaneseAnnotation[];
};

export type ListeningBuildStep = StepBase & {
  type: "listening_build";
  audioKey: string;
  prompt: string;
  targetSentence: string;
  tiles: string[];
  correctOrder: string[];
  granularity: "word" | "character";
  targetAnnotation?: JapaneseAnnotation[];
};

export type SpeakingStep = StepBase & {
  type: "speaking";
  targetPhrase: string;
  translation: string;
  audioKey?: string;
  /**
   * When true, the step is treated as ungraded "I said it!" placeholder
   * (legacy default). When false, the Whisper-backed scorer runs and
   * the learner gets the 2-attempt + reward-the-try flow. Hand-authored
   * consonant rows (M2 g/z/d/b) emit `stubbed: false` as of 2026-05-17
   * R1.3 — Whisper-small + mora tiers + kuroshiro normalization are
   * production-grade.
   */
  stubbed: boolean;
  targetAnnotation?: JapaneseAnnotation[];
};

/** Payload for alphabet steps.
 *
 *  - `romanization`: the user-facing pronunciation (romaji for kana, Revised
 *    Romanization for Hangul, the letter itself for Latin). This is what's
 *    shown to the learner.
 *  - `ipa`: technical phonetic notation — retained for completeness but not
 *    surfaced in the default UI; normal users shouldn't need to read IPA.
 *  - `scriptId`/`hasStrokeOrder`: see {@link SymbolReference} and
 *    `AlphabetDef.hasStrokeOrder`.
 */
export type SymbolStepPayload = {
  symbol: string;
  romanization: string;
  ipa: string;
  hint: string;
  note?: string;
  example?: string;
  audioKey?: string;
  scriptId?: string;
  hasStrokeOrder?: boolean;
};

export type SymbolIntroStep = StepBase & {
  type: "symbol_intro";
  payload: SymbolStepPayload;
};

export type SymbolTraceStep = StepBase & {
  type: "symbol_trace";
  payload: SymbolStepPayload;
  /** Show faded guide (true) or blank canvas (production) */
  showGuide: boolean;
  minCorrectAttempts: number;
  /**
   * Passes already credited to this letter from previous sessions. Used to
   * pre-fill the in-step progress so resumed lessons don't re-require the
   * full minCorrectAttempts when partial trace progress was persisted.
   */
  initialCorrectCount?: number;
};

export type SymbolRecognitionStep = StepBase & {
  type: "symbol_recognition";
  /** Audio plays; user picks correct symbol */
  payload: SymbolStepPayload;
  options: { id: string; symbol: string }[];
  correctOptionId: string;
};

export type SymbolProductionStep = StepBase & {
  type: "symbol_production";
  /** Sound only; user writes symbol from memory. Same as symbol_trace with showGuide: false. */
  payload: SymbolStepPayload;
  minCorrectAttempts: number;
};

export type SymbolToSoundStep = StepBase & {
  type: "symbol_to_sound";
  payload: SymbolStepPayload;
  /**
   * Each option pairs a romaji label with the kana whose audio plays when
   * the user taps it for preview. `symbol` is optional for backward-compat
   * with steps authored before the revamp; missing symbol = no preview.
   */
  options: { id: string; text: string; symbol?: string }[];
  correctOptionId: string;
};

/**
 * Word-discovery MCQ. User reads "What is the word for 'love'?" and picks
 * from a 2×2 grid of square buttons: kana inset top, emoji centered. Tapping
 * a button plays that word's TTS (preview). Then Check commits.
 *
 * Designed for FIRST-encounter vocab teaching — the four words don't have
 * to be introduced yet. The emoji is the primary semantic clue; audio +
 * kana wire the form to that meaning.
 */
export type WordImageMcqStep = StepBase & {
  type: "word_image_mcq";
  /** The english meaning the prompt asks about — e.g. "love". Rendered
   *  bold inside the prompt "What is the word for 'love'?". */
  meaningEn: string;
  options: {
    id: string;
    /** Kana form (the answer text). */
    word: string;
    /** Emoji rendered via Noto Emoji SVG. */
    emoji: string;
  }[];
  correctOptionId: string;
};

/**
 * Row-test step (alphabet-streamline). Encapsulates a queue of mc / match /
 * build items drawn from the full row. Missed items get appended to the
 * back of the queue at runtime (max 3 retries per item). Passes at >=
 * `passThreshold` correct out of total seen.
 *
 * The renderer (`RowTestStepView`) wraps the existing step renderers via
 * thin adapters so we don't duplicate UI.
 */
export type RowTestItemMC = {
  kind: "mc";
  payload: MultipleChoiceStep;
};
export type RowTestItemMatch = {
  kind: "match";
  payload: MatchPairsStep;
};
export type RowTestItemBuild = {
  kind: "build";
  payload: BuildSentenceStep;
};
export type RowTestItem = RowTestItemMC | RowTestItemMatch | RowTestItemBuild;

/**
 * Phrasebook exposure card. Teaches a single phrase via meaning-first
 * presentation: large English meaning, medium romaji, kana as decoration.
 * Audio auto-plays on mount. No correct/incorrect — the user reads,
 * hears, and continues. Used in sidequest lessons where the goal is
 * exposure + recognition, not recall.
 */
export type PhraseCardStep = StepBase & {
  type: "phrase_card";
  kana: string;
  romaji: string;
  meaningEn: string;
  cultureNote?: string;
};

/**
 * Grammar Rule Card (M3+). Tae Kim-style explicit teaching: state the rule,
 * show 2 examples, optionally show 1 anti-pattern with a "why wrong" note,
 * optional culture note. No correct/incorrect — exposure card, like
 * `phrase_card`, but structured for grammar rather than vocabulary.
 *
 * Per curriculum-design-v2 (2026-05-16): replaces Duolingo's silent
 * pattern-match. Each Grammar Rule Card is followed by drills in context
 * (typically `particle_cloze` or `multiple_choice`).
 */
export type GrammarExample = {
  ja: string;
  romaji: string;
  en: string;
};

export type GrammarRuleStep = StepBase & {
  type: "grammar_rule";
  title: string;
  rule: string;
  examples: GrammarExample[];
  antiPattern?: GrammarExample & { why: string };
  cultureNote?: string;
};

/**
 * Particle Cloze (M3+). Sentence with a blank in the middle; learner
 * picks the correct particle from 4 options. The single highest-leverage
 * grammar drill for Japanese — particles distinguish meaning in ways
 * English speakers consistently get wrong.
 *
 * Layout: prompt = `${before} [ ___ ] ${after}` rendered with AnnotatedJa
 * ruby; 4 particle buttons below. On tap → submit + reveal meaning. The
 * full `audioText` (when provided) plays once the answer commits so the
 * learner hears the assembled sentence with the correct particle.
 */
export type ParticleClozeStep = StepBase & {
  type: "particle_cloze";
  prompt: { before: string; after: string };
  correctParticle: string;
  options: string[];
  meaningEn: string;
  audioText?: string;
  explanation?: string;
};

/**
 * Self-explanation MCQ (M3+ metacognitive follow-up). After a learner
 * commits an answer in an upstream step (typically `particle_cloze` or
 * `multiple_choice`), this step asks "Why is that answer correct?" with
 * three reason options:
 *   - `rule`       — correct rule-citing answer.
 *   - `surface`    — wrong-but-plausible heuristic (close miss).
 *   - `distractor` — wrong and unrelated.
 *
 * Backed by Dunlosky 2013 (moderate-utility self-explanation effect).
 * Mechanically a tagged variant of `multiple_choice` whose correct option
 * encodes the rule rather than the surface answer; the `reasonType` tag
 * drives differentiated wrong-answer feedback copy + analytics.
 */
export type SelfExplanationOption = {
  id: string;
  text: string;
  /** "rule" = correct rule-citing answer; "surface" = wrong heuristic
   *  (close miss — fires the "that's the pattern, but the rule is…" copy);
   *  "distractor" = wrong & unrelated. */
  reasonType: "rule" | "surface" | "distractor";
};

export type SelfExplanationMcqStep = StepBase & {
  type: "self_explanation_mcq";
  /** The just-answered fact this is asking the learner to reflect on.
   *  Example: { label: "You picked は in: わたし＿ がくせいです",
   *             audioText: "わたしは がくせいです" } */
  anchor: {
    label: string;
    /** Optional Japanese to TTS as context when the learner taps the
     *  anchor's play button. */
    audioText?: string;
  };
  /** e.g. "Why is は correct here?" */
  question: string;
  options: SelfExplanationOption[];
  correctOptionId: string;
  /** Optional 1-sentence reveal shown after commit (the actual rule). */
  ruleExplanation?: string;
};

export type RowTestStep = StepBase & {
  type: "row_test";
  rowId: string;
  items: RowTestItem[];
  /** Pass threshold as a fraction in [0, 1]. Spec default: 0.70. */
  passThreshold: number;
  /** Max times one item can re-enter the back of the queue. Spec default: 3. */
  maxRetries: number;
};

export type LessonStep =
  | InfoStep
  | TeachStep
  | MultipleChoiceStep
  | BuildSentenceStep
  | MatchPairsStep
  | FillBlankStep
  | TranslateStep
  | ListeningComprehensionStep
  | ListeningBuildStep
  | SpeakingStep
  | SymbolIntroStep
  | SymbolTraceStep
  | SymbolRecognitionStep
  | SymbolProductionStep
  | SymbolToSoundStep
  | WordImageMcqStep
  | PhraseCardStep
  | GrammarRuleStep
  | ParticleClozeStep
  | SelfExplanationMcqStep
  | RowTestStep;

export type LessonContent = {
  id: string;
  moduleId: string;
  courseId: string;
  languageId: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  xpReward?: number;
  introducesVocabIds?: string[];
  introducesCardIds?: string[];
  /**
   * Optional content classification. "module_review" lessons are part of
   * the SRS-style review cycle scheduled between module completions —
   * they reuse existing step primitives (cloze + build + dialogue snippets)
   * but are gated/surfaced separately from regular module lessons.
   */
  kind?: "module_review";
  steps: LessonStep[];
};
