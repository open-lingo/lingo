/**
 * Builds lesson steps for alphabet learning (3-step loop) and test-out sessions.
 */

import type { AlphabetDef, AlphabetSection, LetterDetail } from "@/shared/domain/languageConfig";
import type {
  LessonStep,
  SymbolStepPayload,
  SymbolIntroStep,
  SymbolTraceStep,
  SymbolRecognitionStep,
  SymbolProductionStep,
  SymbolToSoundStep,
} from "@/features/lesson/types";
import { getAlphabetDisplaySections } from "@/shared/domain/languageConfig";
import type { AlphabetProgress } from "./alphabetProgress";
import { getLetterProgress } from "./alphabetProgress";

const MIN_CORRECT_ATTEMPTS = 2;
const DEFAULT_NEW_PER_SESSION = 5;
const RECOGNITION_OPTIONS_COUNT = 4;
const TEST_PASS_THRESHOLD = 0.8;

function makePayload(
  symbol: string,
  detail: LetterDetail | undefined,
  romanization?: string
): SymbolStepPayload {
  if (detail) {
    return {
      symbol,
      ipa: detail.ipa,
      hint: detail.hint,
      note: detail.note,
      example: detail.example,
      audioKey: detail.audioKey,
    };
  }
  return {
    symbol,
    ipa: "",
    hint: romanization ? `Romanization: ${romanization}` : symbol,
  };
}

function getCharactersForSession(
  alphabet: AlphabetDef,
  sectionId?: string
): string[] {
  if (sectionId) {
    const sections = getAlphabetDisplaySections(alphabet);
    const section = sections.find((s) => s.id === sectionId);
    return section?.characters ?? [];
  }
  if (alphabet.characters?.length) return alphabet.characters;
  return getAlphabetDisplaySections(alphabet).flatMap((s) => s.characters);
}

function pickDistractors(
  pool: string[],
  correct: string,
  count: number
): string[] {
  const others = pool.filter((c) => c !== correct);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function makeStepId(prefix: string, symbol: string, index: number): string {
  return `${prefix}-${symbol}-${index}`;
}

export type AlphabetLearnOptions = {
  /** Max new letters to introduce this session */
  maxNewPerSession?: number;
  /** Include optional symbol → sound step */
  includeSymbolToSound?: boolean;
  /** Restrict to this section's characters only */
  sectionId?: string;
};

/**
 * Build a learning session. Steps per letter in order:
 * 1. Intro (audio + display)
 * 2. Trace (draw over template, with audio)
 * 3. Recognition (hear sound → multiple choice)
 * 4. Production (hear sound → draw from memory → auto check)
 */
export function buildAlphabetLearnSteps(
  _languageId: string,
  alphabet: AlphabetDef,
  progress: AlphabetProgress,
  options: AlphabetLearnOptions = {}
): LessonStep[] {
  const {
    maxNewPerSession = DEFAULT_NEW_PER_SESSION,
    includeSymbolToSound = false,
    sectionId,
  } = options;

  const pool = getCharactersForSession(alphabet, sectionId);
  const lettersWithDetails = pool.filter(
    (c) => alphabet.letterDetails?.[c] || alphabet.characterRomanization?.[c]
  );
  if (lettersWithDetails.length === 0) return [];

  const notIntroduced = lettersWithDetails.filter(
    (c) => !getLetterProgress(progress, c).introduced
  );
  const toIntroduce = notIntroduced.slice(0, maxNewPerSession);
  const introduced = lettersWithDetails.filter(
    (c) => getLetterProgress(progress, c).introduced
  );
  const sessionLetters = [...toIntroduce];
  introduced.forEach((c) => {
    if (!sessionLetters.includes(c)) sessionLetters.push(c);
  });

  const steps: LessonStep[] = [];
  const romanization = alphabet.characterRomanization ?? {};

  for (const symbol of sessionLetters) {
    const detail = alphabet.letterDetails?.[symbol];
    const payload = makePayload(symbol, detail, romanization[symbol]);
    const letterProg = getLetterProgress(progress, symbol);

    if (!letterProg.introduced) {
      steps.push({
        id: makeStepId("intro", symbol, 0),
        type: "symbol_intro",
        payload,
      } as SymbolIntroStep);
    }

    if (letterProg.traceCount < MIN_CORRECT_ATTEMPTS) {
      steps.push({
        id: makeStepId("trace", symbol, 0),
        type: "symbol_trace",
        payload,
        showGuide: true,
        minCorrectAttempts: MIN_CORRECT_ATTEMPTS,
      } as SymbolTraceStep);
    }

    if (!letterProg.recognitionPassed) {
      const distractors = pickDistractors(pool, symbol, RECOGNITION_OPTIONS_COUNT - 1);
      const optionsList = [{ id: symbol, symbol }, ...distractors.map((s) => ({ id: s, symbol: s }))];
      const shuffled = [...optionsList].sort(() => Math.random() - 0.5);
      steps.push({
        id: makeStepId("recog", symbol, 0),
        type: "symbol_recognition",
        payload,
        options: shuffled,
        correctOptionId: symbol,
      } as SymbolRecognitionStep);
    }

    if (!letterProg.productionPassed) {
      steps.push({
        id: makeStepId("prod", symbol, 0),
        type: "symbol_production",
        payload,
        minCorrectAttempts: 1,
      } as SymbolProductionStep);
    }

    if (includeSymbolToSound && !letterProg.symbolToSoundPassed) {
      const correctText = detail?.ipa ?? romanization[symbol] ?? symbol;
      const otherSymbols = pickDistractors(pool, symbol, 2);
      const otherTexts = otherSymbols.map(
        (s) => alphabet.letterDetails?.[s]?.ipa ?? alphabet.characterRomanization?.[s] ?? s
      );
      const optionsList = [
        { id: symbol, text: correctText },
        ...otherTexts.map((t, i) => ({ id: `opt-${i}`, text: t })),
      ];
      const shuffled = [...optionsList].sort(() => Math.random() - 0.5);
      steps.push({
        id: makeStepId("sound", symbol, 0),
        type: "symbol_to_sound",
        payload,
        options: shuffled,
        correctOptionId: symbol,
      } as SymbolToSoundStep);
    }
  }

  return steps;
}

export type AlphabetTestOptions = {
  sectionId?: string;
  /** Fraction correct required to pass (0–1). Default 0.8 */
  passThreshold?: number;
};

/**
 * Build a test-out session: recognition steps only. Used to test out of a section or full alphabet.
 */
export function buildAlphabetTestSteps(
  _languageId: string,
  alphabet: AlphabetDef,
  options: AlphabetTestOptions = {}
): LessonStep[] {
  const { sectionId, passThreshold: _passThreshold = TEST_PASS_THRESHOLD } = options;
  const pool = getCharactersForSession(alphabet, sectionId);
  const romanization = alphabet.characterRomanization ?? {};

  const steps: LessonStep[] = [];
  for (const symbol of pool) {
    const detail = alphabet.letterDetails?.[symbol];
    const payload = makePayload(symbol, detail, romanization[symbol]);
    const distractors = pickDistractors(pool, symbol, RECOGNITION_OPTIONS_COUNT - 1);
    const optionsList = [{ id: symbol, symbol }, ...distractors.map((s) => ({ id: s, symbol: s }))];
    const shuffled = [...optionsList].sort(() => Math.random() - 0.5);
    steps.push({
      id: makeStepId("test-recog", symbol, steps.length),
      type: "symbol_recognition",
      payload,
      options: shuffled,
      correctOptionId: symbol,
    } as SymbolRecognitionStep);
  }
  return steps;
}

export function getAlphabetSessionTitle(
  alphabet: AlphabetDef,
  mode: "learn" | "test",
  section?: AlphabetSection | null
): string {
  if (mode === "test") {
    return section
      ? `Test: ${section.name}`
      : `Test: ${alphabet.name}`;
  }
  return section ? `Learn: ${section.name}` : `Learn: ${alphabet.name}`;
}
