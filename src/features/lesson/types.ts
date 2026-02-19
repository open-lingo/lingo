import type { CardSegment } from "@/features/flashcards/data/types";

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
  | "speaking";

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
};

export type BuildSentenceStep = StepBase & {
  type: "build_sentence";
  prompt: string;
  targetSentence: string;
  tiles: string[];
  correctOrder: string[];
  audioKey?: string;
  granularity: "word" | "character";
};

export type MatchPair = {
  id: string;
  source: string;
  target: string;
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
};

export type TranslateStep = StepBase & {
  type: "translate";
  sourceText: string;
  sourceLanguage: "target" | "native";
  acceptedAnswers: string[];
  audioKey?: string;
};

export type ListeningComprehensionStep = StepBase & {
  type: "listening_comprehension";
  audioKey: string;
  transcript?: string;
  question: string;
  options: Option[];
  correctOptionId: string;
  explanation?: string;
};

export type ListeningBuildStep = StepBase & {
  type: "listening_build";
  audioKey: string;
  prompt: string;
  targetSentence: string;
  tiles: string[];
  correctOrder: string[];
  granularity: "word" | "character";
};

export type SpeakingStep = StepBase & {
  type: "speaking";
  targetPhrase: string;
  translation: string;
  audioKey?: string;
  stubbed: true;
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
  | SpeakingStep;

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
