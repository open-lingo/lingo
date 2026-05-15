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
  | "symbol_to_sound";

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
  variant?: "tip" | "culture" | "grammar" | "default";
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
  stubbed: true;
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
  options: { id: string; text: string }[];
  correctOptionId: string;
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
  | SymbolToSoundStep;

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
  steps: LessonStep[];
};
