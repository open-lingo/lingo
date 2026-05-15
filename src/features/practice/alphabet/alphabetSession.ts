/**
 * Builds lesson steps for alphabet learning (intro → trace → recognition →
 * production, plus optional symbol-to-sound) and test-out sessions.
 */

import type {
  AlphabetDef,
  AlphabetSection,
  LetterDetail,
} from "@/shared/domain/languageConfig";
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
import { getLetterProgress, isLetterMastered } from "./alphabetProgress";

const MIN_CORRECT_ATTEMPTS = 2;
const DEFAULT_NEW_PER_SESSION = 5;
const RECOGNITION_OPTIONS_COUNT = 4;
/** Minimum number of letters that should have tracing (with sound) before any multiple-choice steps. */
const MIN_TRACE_LETTERS_AT_START = 4;

function makePayload(
  symbol: string,
  detail: LetterDetail | undefined,
  romanization: string | undefined,
  alphabet: AlphabetDef,
): SymbolStepPayload {
  const common = {
    scriptId: alphabet.id,
    hasStrokeOrder: alphabet.hasStrokeOrder ?? false,
    // Default user-facing pronunciation: configured romanization → fall back
    // to the symbol itself for Latin scripts where the glyph is already
    // readable.
    romanization: romanization ?? symbol,
  };
  if (detail) {
    return {
      symbol,
      ipa: detail.ipa,
      hint: detail.hint,
      note: detail.note,
      example: detail.example,
      audioKey: detail.audioKey,
      ...common,
    };
  }
  // No letterDetails — leave hint empty so the UI doesn't duplicate the
  // romanization (which is rendered on its own line). Letters that want a
  // descriptive hint should populate `letterDetails[symbol].hint`.
  return {
    symbol,
    ipa: "",
    hint: "",
    ...common,
  };
}

function getCharactersForSession(
  alphabet: AlphabetDef,
  sectionId?: string,
): string[] {
  if (sectionId) {
    const sections = getAlphabetDisplaySections(alphabet);
    const section = sections.find((s) => s.id === sectionId);
    return section?.characters ?? [];
  }
  if (alphabet.characters?.length) return alphabet.characters;
  return getAlphabetDisplaySections(alphabet).flatMap((s) => s.characters);
}

/** Unbiased in-place Fisher-Yates shuffle on a copy of `arr`. */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickDistractors(
  pool: string[],
  correct: string,
  count: number,
): string[] {
  const others = pool.filter((c) => c !== correct);
  return shuffle(others).slice(0, count);
}

function makeStepId(prefix: string, symbol: string, index: number): string {
  return `${prefix}-${symbol}-${index}`;
}

function shouldIncludeDrawingSteps(
  alphabet: AlphabetDef,
  symbol: string,
  sectionId?: string,
): boolean {
  // For most alphabets we always include tracing/production.
  if (alphabet.id !== "hiragana" && alphabet.id !== "katakana") return true;

  // Sections where drawing is intentionally skipped (sound + recognition only).
  const SKIP_SECTIONS = new Set([
    "dakuten",
    "handakuten",
    "hiragana-yoon-ry",
    "katakana-yoon-ry",
  ]);

  // If we're explicitly in one of these sections, skip drawing.
  if (sectionId && SKIP_SECTIONS.has(sectionId)) return false;

  // Otherwise, infer section from the alphabet's configured sections.
  const sections = alphabet.sections ?? [];
  const found = sections.find((s) => s.characters.includes(symbol));
  if (found && SKIP_SECTIONS.has(found.id)) return false;

  return true;
}

export type AlphabetLearnOptions = {
  /** Max new letters to introduce this session */
  maxNewPerSession?: number;
  /** Include optional symbol → sound step */
  includeSymbolToSound?: boolean;
  /** Restrict to this section's characters only */
  sectionId?: string;
  /**
   * Optional: restrict the session to this explicit set of symbols.
   * Used for review rounds where we only want letters that "need review".
   */
  reviewOnlySymbols?: string[];
  /**
   * Optional review mode hint. For now we support "productionOnly", which
   * builds only production steps for the given symbols.
   */
  reviewMode?: "productionOnly";
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
  options: AlphabetLearnOptions = {},
): LessonStep[] {
  const {
    maxNewPerSession = DEFAULT_NEW_PER_SESSION,
    includeSymbolToSound = false,
    sectionId,
  } = options;

  const pool = getCharactersForSession(alphabet, sectionId);
  const lettersWithDetails = pool.filter(
    (c) => alphabet.letterDetails?.[c] || alphabet.characterRomanization?.[c],
  );
  if (lettersWithDetails.length === 0) return [];

  const reviewOnly = options.reviewOnlySymbols ?? [];
  const isReview = reviewOnly.length > 0;

  // For normal learn sessions, only schedule letters that are not yet mastered.
  const learnCandidates = lettersWithDetails.filter(
    (c) => !isLetterMastered(getLetterProgress(progress, c)),
  );
  if (!isReview && learnCandidates.length === 0) return [];

  let sessionLetters: string[];
  if (isReview) {
    const allowed = new Set(lettersWithDetails);
    sessionLetters = reviewOnly.filter((c) => allowed.has(c));
  } else {
    const notIntroduced = learnCandidates.filter(
      (c) => !getLetterProgress(progress, c).introduced,
    );
    const toIntroduce = notIntroduced.slice(0, maxNewPerSession);
    const introduced = learnCandidates.filter(
      (c) => getLetterProgress(progress, c).introduced,
    );
    sessionLetters = [...toIntroduce];
    introduced.forEach((c) => {
      if (!sessionLetters.includes(c)) sessionLetters.push(c);
    });
  }

  const steps: LessonStep[] = [];
  const romanization = alphabet.characterRomanization ?? {};

  const traceAndIntroSteps: LessonStep[] = [];
  const laterSteps: LessonStep[] = [];
  let traceLettersScheduled = 0;

  for (const symbol of sessionLetters) {
    const detail = alphabet.letterDetails?.[symbol];
    const payload = makePayload(symbol, detail, romanization[symbol], alphabet);
    const letterProg = getLetterProgress(progress, symbol);
    const includeDrawing = shouldIncludeDrawingSteps(alphabet, symbol, sectionId);

    // Review mode "productionOnly": just build production steps for these
    // symbols and skip the rest of the flow.
    if (isReview && options.reviewMode === "productionOnly") {
      if (includeDrawing) {
        laterSteps.push({
          // Use a distinct prefix so the component remounts cleanly for the
          // review round (clearing local state like failedAttempts/template).
          id: makeStepId("prodReviewStep", symbol, 0),
          type: "symbol_production",
          payload,
          minCorrectAttempts: 1,
        } as SymbolProductionStep);
      }
      continue;
    }

    if (!letterProg.introduced) {
      traceAndIntroSteps.push({
        id: makeStepId("intro", symbol, 0),
        type: "symbol_intro",
        payload,
      } as SymbolIntroStep);
    }

    if (includeDrawing) {
      const needsTraceForProgress = letterProg.traceCount < MIN_CORRECT_ATTEMPTS;
      const forceTraceForFlow =
        traceLettersScheduled < MIN_TRACE_LETTERS_AT_START;

      if (needsTraceForProgress || forceTraceForFlow) {
        traceAndIntroSteps.push({
          id: makeStepId("trace", symbol, 0),
          type: "symbol_trace",
          payload,
          showGuide: true,
          minCorrectAttempts: MIN_CORRECT_ATTEMPTS,
          // Resume support: if user got 1/2 passes last session, start at 1.
          initialCorrectCount: Math.min(
            MIN_CORRECT_ATTEMPTS,
            letterProg.traceCount,
          ),
        } as SymbolTraceStep);
        traceLettersScheduled++;
      }
    }

    if (!letterProg.recognitionPassed) {
      const distractors = pickDistractors(
        pool,
        symbol,
        RECOGNITION_OPTIONS_COUNT - 1,
      );
      const optionsList = [
        { id: symbol, symbol },
        ...distractors.map((s) => ({ id: s, symbol: s })),
      ];
      const shuffled = shuffle(optionsList);
      laterSteps.push({
        id: makeStepId("recog", symbol, 0),
        type: "symbol_recognition",
        payload,
        options: shuffled,
        correctOptionId: symbol,
      } as SymbolRecognitionStep);
    }

    if (includeDrawing && !letterProg.productionPassed) {
      laterSteps.push({
        id: makeStepId("prod", symbol, 0),
        type: "symbol_production",
        payload,
        minCorrectAttempts: 1,
      } as SymbolProductionStep);
    }

    if (includeSymbolToSound && !letterProg.symbolToSoundPassed) {
      // Prefer romanization (user-readable) over IPA (phonetic notation that
      // most learners don't read). IPA stays as a deep fallback.
      const correctText =
        romanization[symbol] ?? detail?.ipa ?? symbol;
      const otherSymbols = pickDistractors(pool, symbol, 2);
      const otherTexts = otherSymbols.map(
        (s) =>
          alphabet.characterRomanization?.[s] ??
          alphabet.letterDetails?.[s]?.ipa ??
          s,
      );
      const optionsList = [
        { id: symbol, text: correctText },
        ...otherTexts.map((t, i) => ({ id: `opt-${i}`, text: t })),
      ];
      const shuffled = shuffle(optionsList);
      laterSteps.push({
        id: makeStepId("sound", symbol, 0),
        type: "symbol_to_sound",
        payload,
        options: shuffled,
        correctOptionId: symbol,
      } as SymbolToSoundStep);
    }
  }

  steps.push(...traceAndIntroSteps, ...laterSteps);
  return steps;
}

export type AlphabetTestOptions = {
  sectionId?: string;
};

/**
 * Build a test-out session: recognition steps only. Used to test out of a section or full alphabet.
 */
export function buildAlphabetTestSteps(
  _languageId: string,
  alphabet: AlphabetDef,
  options: AlphabetTestOptions = {},
): LessonStep[] {
  const { sectionId } = options;
  const pool = getCharactersForSession(alphabet, sectionId);
  const romanization = alphabet.characterRomanization ?? {};

  const steps: LessonStep[] = [];
  for (const symbol of pool) {
    const detail = alphabet.letterDetails?.[symbol];
    const payload = makePayload(symbol, detail, romanization[symbol], alphabet);
    const distractors = pickDistractors(
      pool,
      symbol,
      RECOGNITION_OPTIONS_COUNT - 1,
    );
    const optionsList = [
      { id: symbol, symbol },
      ...distractors.map((s) => ({ id: s, symbol: s })),
    ];
    const shuffled = shuffle(optionsList);
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
  section?: AlphabetSection | null,
): string {
  if (mode === "test") {
    return section ? `Test: ${section.name}` : `Test: ${alphabet.name}`;
  }
  return section ? `Learn: ${section.name}` : `Learn: ${alphabet.name}`;
}
