import type { LessonContent } from "../types";

/**
 * Vowels: あ い う え お — the first non-intro Japanese lesson.
 *
 * Conventions used here:
 *   - Every multiple_choice and symbol_recognition step uses **4 options**
 *     so the 2×2 grid layout is uniform across the lesson.
 *   - "Native → target" production drills use `build_sentence` with kana
 *     tiles, not free-text typing. The translate step type stays for
 *     later "hard mode" lessons that drop into a typed-input WanaKana IME.
 *   - The mizu drill is audio-first — the learner hears the word and picks
 *     a constituent kana from sound, not from visual matching.
 */
export const MOCK_LESSON_JA_M1_L1: LessonContent = {
  id: "ja-m1-l1",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels: あ い う え お",
  description:
    "Learn the five Japanese vowels and a few words you can build from them.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["ai", "ie", "ue", "aoi", "mizu"],
  steps: [
    {
      id: "ja-l1-info-0",
      type: "info",
      title: "Welcome to Japanese!",
      body:
        "In this lesson you'll learn the five vowels of Japanese — あ い う え お — and a few words built from them. You'll also meet a couple of words with kana we haven't taught yet; small romaji helpers will sit above the unfamiliar ones until you've drilled them.",
      variant: "culture",
    },
    {
      id: "ja-l1-intro-a",
      type: "symbol_intro",
      payload: {
        symbol: "あ",
        romanization: "a",
        ipa: "/a/",
        hint: "like 'a' in 'father'",
        example: "あい (love)",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
    },
    {
      id: "ja-l1-recog-a",
      type: "symbol_recognition",
      payload: {
        symbol: "あ",
        romanization: "a",
        ipa: "/a/",
        hint: "like 'a' in 'father'",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
      options: [
        { id: "a", symbol: "あ" },
        { id: "b", symbol: "い" },
        { id: "c", symbol: "う" },
        { id: "d", symbol: "お" },
      ],
      correctOptionId: "a",
    },
    {
      id: "ja-l1-intro-i",
      type: "symbol_intro",
      payload: {
        symbol: "い",
        romanization: "i",
        ipa: "/i/",
        hint: "like 'ee' in 'see'",
        example: "いえ (house)",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
    },
    {
      id: "ja-l1-recog-i",
      type: "symbol_recognition",
      payload: {
        symbol: "い",
        romanization: "i",
        ipa: "/i/",
        hint: "like 'ee' in 'see'",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
      options: [
        { id: "a", symbol: "い" },
        { id: "b", symbol: "え" },
        { id: "c", symbol: "う" },
        { id: "d", symbol: "あ" },
      ],
      correctOptionId: "a",
    },
    {
      id: "ja-l1-intro-u",
      type: "symbol_intro",
      payload: {
        symbol: "う",
        romanization: "u",
        ipa: "/ɯ/",
        hint: "like 'oo' in 'food'",
        note: "Lips stay unrounded.",
        example: "うえ (above)",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
    },
    {
      id: "ja-l1-recog-u",
      type: "symbol_recognition",
      payload: {
        symbol: "う",
        romanization: "u",
        ipa: "/ɯ/",
        hint: "like 'oo' in 'food'",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
      options: [
        { id: "a", symbol: "う" },
        { id: "b", symbol: "お" },
        { id: "c", symbol: "い" },
        { id: "d", symbol: "え" },
      ],
      correctOptionId: "a",
    },
    {
      id: "ja-l1-teach-ai",
      type: "teach",
      content: {
        text:
          "Your first word: あい. Two kana you already know, side by side. It means 'love'.",
        vocab: {
          term: "あい",
          translation: "love",
          annotation: [{ surface: "あい", reading: "あい" }],
        },
      },
    },
    {
      // Speaking step — POC only. Renders the placeholder UI by default; the
      // Web Speech API path activates with `?speech=1` (gated in
      // `SpeakingStepView`). Placed right after the あい teach step so the
      // learner is asked to say a word they just met.
      id: "ja-l1-say-ai",
      type: "speaking",
      targetPhrase: "あい",
      translation: "love",
      stubbed: true,
      targetAnnotation: [{ surface: "あい", reading: "あい" }],
    },
    {
      id: "ja-l1-mc-ai",
      type: "multiple_choice",
      prompt: "What does あい mean?",
      promptAnnotation: [
        { surface: "What does ", reading: "What does " },
        { surface: "あい", reading: "あい" },
        { surface: " mean?", reading: " mean?" },
      ],
      options: [
        { id: "a", text: "love" },
        { id: "b", text: "house" },
        { id: "c", text: "above" },
        { id: "d", text: "blue" },
      ],
      correctOptionId: "a",
      explanation: "あ + い = ai, 'love'.",
    },
    {
      id: "ja-l1-intro-e",
      type: "symbol_intro",
      payload: {
        symbol: "え",
        romanization: "e",
        ipa: "/e/",
        hint: "like 'e' in 'bed'",
        example: "え (picture)",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
    },
    {
      id: "ja-l1-recog-e",
      type: "symbol_recognition",
      payload: {
        symbol: "え",
        romanization: "e",
        ipa: "/e/",
        hint: "like 'e' in 'bed'",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
      options: [
        { id: "a", symbol: "え" },
        { id: "b", symbol: "お" },
        { id: "c", symbol: "あ" },
        { id: "d", symbol: "い" },
      ],
      correctOptionId: "a",
    },
    {
      id: "ja-l1-intro-o",
      type: "symbol_intro",
      payload: {
        symbol: "お",
        romanization: "o",
        ipa: "/o/",
        hint: "like 'o' in 'or'",
        example: "あおい (blue)",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
    },
    {
      id: "ja-l1-recog-o",
      type: "symbol_recognition",
      payload: {
        symbol: "お",
        romanization: "o",
        ipa: "/o/",
        hint: "like 'o' in 'or'",
        scriptId: "hiragana",
        hasStrokeOrder: true,
      },
      options: [
        { id: "a", symbol: "お" },
        { id: "b", symbol: "あ" },
        { id: "c", symbol: "え" },
        { id: "d", symbol: "う" },
      ],
      correctOptionId: "a",
    },
    {
      id: "ja-l1-teach-ie",
      type: "teach",
      content: {
        text:
          "Next word: いえ. Means 'house'. Notice it's just い + え.",
        vocab: {
          term: "いえ",
          translation: "house",
          annotation: [{ surface: "いえ", reading: "いえ" }],
        },
      },
    },
    {
      id: "ja-l1-teach-ue",
      type: "teach",
      content: {
        text:
          "うえ means 'above' or 'top'. It's う + え — another pure a-row word.",
        vocab: {
          term: "うえ",
          translation: "above",
          annotation: [{ surface: "うえ", reading: "うえ" }],
        },
      },
    },
    {
      id: "ja-l1-match",
      type: "match_pairs",
      prompt: "Match each Japanese word to its meaning",
      pairs: [
        {
          id: "p1",
          source: "あい",
          target: "love",
          sourceAnnotation: [{ surface: "あい", reading: "あい" }],
        },
        {
          id: "p2",
          source: "いえ",
          target: "house",
          sourceAnnotation: [{ surface: "いえ", reading: "いえ" }],
        },
        {
          id: "p3",
          source: "うえ",
          target: "above",
          sourceAnnotation: [{ surface: "うえ", reading: "うえ" }],
        },
        {
          id: "p4",
          source: "あおい",
          target: "blue",
          sourceAnnotation: [{ surface: "あおい", reading: "あおい" }],
        },
      ],
    },
    {
      id: "ja-l1-teach-mizu",
      type: "teach",
      content: {
        text:
          "One more word. みず means 'water'. The kana み and ず aren't in the a-row — we'll teach them in a later lesson. Until then, the small letters above show you how to read them.",
        vocab: {
          term: "みず",
          translation: "water",
          annotation: [{ surface: "みず", reading: "みず" }],
        },
        note:
          "Helpers above a kana stay until you've drilled it enough to remember it on your own.",
      },
    },
    {
      id: "ja-l1-mc-mizu-start",
      type: "multiple_choice",
      // Hidden when audioOnlyPrompt is on — kept for screen-reader fallback.
      prompt: "Which kana starts the word you hear?",
      audioOnlyPrompt: true,
      promptAudioText: "みず",
      options: [
        { id: "a", text: "み" },
        { id: "b", text: "な" },
        { id: "c", text: "ぬ" },
        { id: "d", text: "む" },
      ],
      correctOptionId: "a",
      explanation:
        "The word is 'mi-zu' — it starts with み. You'll drill み in a later lesson.",
    },
    {
      id: "ja-l1-build-blue",
      type: "build_sentence",
      prompt: "Build the Japanese word for 'blue'",
      targetSentence: "あおい",
      tiles: ["あ", "お", "い", "う", "え"],
      correctOrder: ["あ", "お", "い"],
      granularity: "character",
      hint: "Three kana, all from this lesson's vowel set.",
      targetAnnotation: [{ surface: "あおい", reading: "あおい" }],
    },
    {
      id: "ja-l1-info-final",
      type: "info",
      title: "Nice work!",
      body:
        "You learned five hiragana (あ い う え お) and five words built from them. The little helpers above み and ず in 'mizu' will stick around until you drill those kana later. Tap continue to finish.",
      variant: "default",
    },
  ],
};
