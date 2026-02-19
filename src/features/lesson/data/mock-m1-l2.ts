import type { LessonContent } from "../types";

export const MOCK_LESSON_M1_L2: LessonContent = {
  id: "m1-l2",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ko",
  title: "Introductions",
  description: "Introduce yourself in Korean",
  estimatedMinutes: 5,
  xpReward: 10,
  introducesVocabIds: ["jeoneun", "imnida"],
  introducesCardIds: ["ko-3"],
  steps: [
    {
      id: "s1",
      type: "teach",
      content: {
        text: "To introduce yourself in Korean, say 저는 [name]입니다. This means 'I am [name]' in formal speech.",
        vocab: {
          term: "저는",
          translation: "I (topic-marked, humble)",
          breakdown: [
            { segment: "저", meaning: "I (humble)" },
            { segment: "는", meaning: "topic marker", particleId: "은/는" },
          ],
        },
        note: "저 is the humble form of 'I'. In casual speech you'd use 나.",
      },
    },
    {
      id: "s2",
      type: "teach",
      content: {
        text: "입니다 is the formal copula — it means 'am/is/are'. Attach it directly to a noun.",
        vocab: {
          term: "입니다",
          translation: "am / is / are (formal)",
          breakdown: [
            { segment: "이", meaning: "copula stem" },
            { segment: "ㅂ니다", meaning: "formal ending" },
          ],
        },
      },
    },
    {
      id: "s3",
      type: "multiple_choice",
      prompt: "How do you say 'I am Min' formally in Korean?",
      options: [
        { id: "a", text: "민은 저입니다" },
        { id: "b", text: "저는 민입니다" },
        { id: "c", text: "민입니다 저는" },
        { id: "d", text: "나는 민이다" },
      ],
      correctOptionId: "b",
      explanation: "저는 (I + topic) comes first, then the name + 입니다.",
    },
    {
      id: "s4",
      type: "build_sentence",
      prompt: "Build: 'I am Min'",
      targetSentence: "저는 민입니다",
      tiles: ["입니다", "저는", "민", "감사"],
      correctOrder: ["저는", "민", "입니다"],
      granularity: "word",
      hint: "Subject first, then name, then copula",
    },
    {
      id: "s5",
      type: "fill_blank",
      sentence: "저{{blank}} 민입니다",
      blanks: [{ id: "b1", correctAnswer: "는", acceptedAnswers: ["는"] }],
      wordBank: ["는", "을", "이", "에"],
      hint: "Which particle marks the topic?",
    },
    {
      id: "s6",
      type: "translate",
      sourceText: "I am a student.",
      sourceLanguage: "native",
      acceptedAnswers: ["저는 학생입니다", "저는 학생 입니다"],
      hint: "학생 = student",
    },
    {
      id: "s7",
      type: "match_pairs",
      prompt: "Match Korean to English",
      pairs: [
        { id: "p1", source: "저는", target: "I (topic)" },
        { id: "p2", source: "입니다", target: "am / is" },
        { id: "p3", source: "안녕하세요", target: "Hello" },
        { id: "p4", source: "감사합니다", target: "Thank you" },
      ],
    },
    {
      id: "s8",
      type: "speaking",
      targetPhrase: "저는 민입니다",
      translation: "I am Min",
      audioKey: "audio/ko/jeoneun-min-imnida.mp3",
      stubbed: true,
    },
  ],
};
