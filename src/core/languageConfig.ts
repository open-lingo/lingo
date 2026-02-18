/**
 * Single source of truth for language display + feature config.
 * Drives practice types, alphabet/character learner, intro lesson, etc.
 * Can be replaced later by loading from languages.json or API.
 */

export type PracticeType =
  | "general"
  | "particles"
  | "kanji"
  | "alphabet"
  | "components";

/** One row in the practice dropdown: label + optional sample character. */
export type PracticeOption = {
  type: PracticeType;
  /** For alphabet: id for route /practice/alphabet/:id */
  id?: string;
  label: string;
  /** Shown next to label in dropdown (e.g. し, 日, 한) */
  sampleCharacter?: string;
};

export type AlphabetDef = {
  id: string;
  name: string;
  description?: string;
  characters?: string[];
};

export type LanguageConfig = {
  id: string;
  name: string;
  flag: string;
  /** Which practice types this language supports (used when practiceOptions not set). */
  practiceTypes: PracticeType[];
  /** Dropdown options with labels and sample characters. Overrides practiceTypes when set. */
  practiceOptions?: PracticeOption[];
  /** Single alphabet (backward compat). Use alphabets when language has more than one. */
  alphabet?: AlphabetDef;
  /** Multiple alphabets (e.g. Japanese: Hiragana, Katakana). */
  alphabets?: AlphabetDef[];
  /** Japanese/Chinese: kanji/hanzi component breakdowns and meanings. */
  hasComponentBreakdown?: boolean;
  /** First lesson in Basics: "Introduction to the language concepts" (Duolingo-style apps often skip this). */
  introLessonTitle?: string;
};

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  ko: {
    id: "ko",
    name: "Korean",
    flag: "🇰🇷",
    practiceTypes: ["general", "particles", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "particles", label: "Particle practice" },
      { type: "alphabet", id: "hangul", label: "Hangul (Alphabet)", sampleCharacter: "한" },
    ],
    alphabet: {
      id: "hangul",
      name: "Hangul",
      description: "Korean alphabet",
      characters: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
    },
    introLessonTitle: "Introduction to Korean",
  },
  ja: {
    id: "ja",
    name: "Japanese",
    flag: "🇯🇵",
    practiceTypes: ["general", "particles", "kanji", "alphabet", "components"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "particles", label: "Particle practice" },
      { type: "kanji", label: "Kanji (Characters)", sampleCharacter: "日" },
      { type: "alphabet", id: "hiragana", label: "Hiragana (Alphabet)", sampleCharacter: "し" },
      { type: "alphabet", id: "katakana", label: "Katakana (Alphabet)", sampleCharacter: "シ" },
      { type: "components", label: "Character components" },
    ],
    alphabets: [
      { id: "hiragana", name: "Hiragana", description: "Japanese syllabary" },
      { id: "katakana", name: "Katakana", description: "Japanese syllabary" },
    ],
    alphabet: {
      id: "hiragana",
      name: "Hiragana",
      description: "Japanese syllabary",
    },
    hasComponentBreakdown: true,
    introLessonTitle: "Introduction to Japanese",
  },
  zh: {
    id: "zh",
    name: "Chinese",
    flag: "🇨🇳",
    practiceTypes: ["general", "kanji", "alphabet", "components"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "kanji", label: "Characters (汉字)", sampleCharacter: "字" },
      { type: "alphabet", id: "pinyin", label: "Pinyin (Alphabet)", sampleCharacter: "a" },
      { type: "components", label: "Character components" },
    ],
    alphabet: {
      id: "pinyin",
      name: "Pinyin",
      description: "Romanization",
    },
    hasComponentBreakdown: true,
    introLessonTitle: "Introduction to Chinese",
  },
  es: {
    id: "es",
    name: "Spanish",
    flag: "🇪🇸",
    practiceTypes: ["general", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "alphabet", id: "spanish-alphabet", label: "Spanish (Alphabet)", sampleCharacter: "ñ" },
    ],
    alphabet: {
      id: "spanish-alphabet",
      name: "Spanish alphabet",
      description: "Letters and sounds",
    },
    introLessonTitle: "Introduction to Spanish",
  },
  de: {
    id: "de",
    name: "German",
    flag: "🇩🇪",
    practiceTypes: ["general", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "alphabet", id: "german-alphabet", label: "German (Alphabet)", sampleCharacter: "ß" },
    ],
    alphabet: { id: "german-alphabet", name: "German alphabet", description: "Letters and sounds" },
    introLessonTitle: "Introduction to German",
  },
  fr: {
    id: "fr",
    name: "French",
    flag: "🇫🇷",
    practiceTypes: ["general", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "alphabet", id: "french-alphabet", label: "French (Alphabet)", sampleCharacter: "é" },
    ],
    alphabet: { id: "french-alphabet", name: "French alphabet", description: "Letters and sounds" },
    introLessonTitle: "Introduction to French",
  },
  en: {
    id: "en",
    name: "English",
    flag: "🇺🇸",
    practiceTypes: ["general"],
    practiceOptions: [{ type: "general", label: "General practice" }],
    introLessonTitle: "Introduction to English",
  },
};

export function getLanguageConfig(languageId: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[languageId];
}

/** List for picker; derived from config. */
export const LANGUAGES = Object.values(LANGUAGE_CONFIGS);

export function getLanguageById(id: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[id];
}

/** Resolve alphabet by id (path or query). Checks alphabets[] then alphabet. */
export function getAlphabetById(languageId: string, alphabetId: string): AlphabetDef | undefined {
  const config = LANGUAGE_CONFIGS[languageId];
  const fromArray = config?.alphabets?.find((a) => a.id === alphabetId);
  if (fromArray) return fromArray;
  const single = config?.alphabet;
  return single?.id === alphabetId ? single : undefined;
}

/** All alphabets for a language (for dropdown / multiple scripts). */
export function getAlphabetsForLanguage(languageId: string): AlphabetDef[] {
  const config = LANGUAGE_CONFIGS[languageId];
  if (config?.alphabets?.length) return config.alphabets;
  if (config?.alphabet) return [config.alphabet];
  return [];
}

/** Build shareable alphabet URL: /practice/alphabet/:id or /practice/alphabet?name=:id */
export function alphabetPracticePath(alphabetId: string, useQuery = false): string {
  return useQuery ? `/practice/alphabet?name=${encodeURIComponent(alphabetId)}` : `/practice/alphabet/${encodeURIComponent(alphabetId)}`;
}
