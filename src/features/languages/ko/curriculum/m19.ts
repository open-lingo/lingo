/**
 * Korean Module 19 — Family & people.
 *
 * KO analog of JA M19 (family register うち/よそ + age counter 〜さい +
 * counting people 〜にんかぞく). Re-expressed in Korean's own grammar:
 *
 *   ko-m19-1  Immediate family — 가족 / 엄마·아빠 / 부모님 / 형제
 *   ko-m19-2  Siblings — 형 / 오빠 / 누나 / 언니 / 동생 (speaker-gender split)
 *   ko-m19-3  우리 — "our" as the humble in-group "my" (우리 엄마, 우리 가족)
 *   ko-m19-4  Counting people — native numbers + 명 (한 명, 두 명…)
 *   ko-m19-5  Age — 살 (the native-number age counter): 스무 살, 서른 살
 *   ko-m19-6  Putting it together — describing your family
 *   ko-m19-7  Mini-dialogue — talking about family
 *   ko-m19-8  M19 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - Sibling words split by the SPEAKER'S gender, not just the sibling's:
 *     a male's older brother = 형, older sister = 누나; a female's older
 *     brother = 오빠, older sister = 언니. 동생 (younger sibling) is shared,
 *     optionally specified 남동생 (younger brother) / 여동생 (younger sister).
 *   - 우리 ('our/we') is the everyday way to say "my" for in-group nouns:
 *     우리 엄마 = 'my mom', 우리 가족 = 'my family'. Saying 제 엄마 sounds
 *     oddly distancing. This is the closest KO match to JA's うち in-group sense.
 *   - People are counted with NATIVE numbers + 명: 한 명 (1 person), 두 명
 *     (2), 세 명 (3), 네 명 (4). Note the special pre-counter forms
 *     한/두/세/네 (not 하나/둘/셋/넷), already seen with 시 (o'clock) in M11.
 *   - Age uses NATIVE numbers + 살: 스무 살 (20), 서른 살 (30). 스물 → 스무
 *     before a counter is a real, fixed sandhi (just like 두/세/네).
 *
 * Builds on: native numbers + pre-counter forms (M11 시), 우리 hinted in
 * earlier greetings. NATIVE-REVIEW flags inline; see WORKTREE_REPORT.md.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  infoStep,
  listeningCompSentence,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// ─── ko-m19-1 — Immediate family ────────────────────────────────────────────

const M19_1: LessonContent = {
  id: "ko-m19-1",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Family — 가족, 엄마, 아빠",
  description: "Talk about your family and parents.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m19-1-info",
      "Family words",
      "가족 = 'family'. The everyday words for parents are 엄마 ('mom') and 아빠 ('dad'). 부모님 = 'parents' (the polite collective; the 님 is an honorific suffix). You'll often hear these with 우리 ('our') — that's the next lesson.",
      "default",
    ),
    phrase("ko-m19-1-p-family", "family", "gajok", "가족", undefined, { emoji: "👪" }),
    phrase("ko-m19-1-p-mom", "mom", "eomma", "엄마", undefined, { emoji: "👩" }),
    phrase("ko-m19-1-p-dad", "dad", "appa", "아빠", undefined, { emoji: "👨" }),
    phrase("ko-m19-1-p-parents", "parents", "bumonim", "부모님", undefined, { emoji: "👫" }),
    sentenceMcq({
      id: "ko-m19-1-q-mom",
      prompt: "Which means 'mom'?",
      correctHangul: "엄마",
      distractorsHangul: ["아빠", "가족", "부모님"],
      explanation: "엄마 = mom. 아빠 = dad.",
      exercisedAtomSurfaces: ["엄마"],
    }),
    sentenceMcq({
      id: "ko-m19-1-q-parents",
      prompt: "Which means 'parents'?",
      correctHangul: "부모님",
      distractorsHangul: ["가족", "엄마", "아빠"],
      explanation: "부모님 = parents (collective, with the 님 honorific).",
      exercisedAtomSurfaces: ["부모님"],
    }),
    listeningCompSentence({
      id: "ko-m19-1-lc-family",
      audioText: "가족",
      correctMeaningEn: "family",
      distractorsEn: ["parents", "mom", "dad"],
      exercisedAtomSurfaces: ["가족"],
    }),
    speaking("ko-m19-1-speak-dad", "아빠", "dad", ["아빠"]),
  ],
};

// ─── ko-m19-2 — Siblings ────────────────────────────────────────────────────

const M19_2: LessonContent = {
  id: "ko-m19-2",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Siblings — 형, 오빠, 누나, 언니",
  description: "The sibling words depend on YOUR gender.",
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m19-2-info",
      "Sibling words depend on the speaker's gender",
      "Korean older-sibling words depend on whether YOU are male or female:\n• A MALE says 형 (older brother) and 누나 (older sister).\n• A FEMALE says 오빠 (older brother) and 언니 (older sister).\nFor a younger sibling everyone uses 동생 (or 남동생 'younger brother' / 여동생 'younger sister'). This split has no English equivalent — learn the four older-sibling words as a set.",
      "grammar",
    ),
    phrase("ko-m19-2-p-hyeong", "older brother (male's)", "hyeong", "형", undefined, { emoji: "👦" }),
    phrase("ko-m19-2-p-oppa", "older brother (female's)", "oppa", "오빠", undefined, { emoji: "👦" }),
    phrase("ko-m19-2-p-nuna", "older sister (male's)", "nuna", "누나", undefined, { emoji: "👧" }),
    phrase("ko-m19-2-p-eonni", "older sister (female's)", "eonni", "언니", undefined, { emoji: "👧" }),
    phrase("ko-m19-2-p-dongsaeng", "younger sibling", "dongsaeng", "동생", undefined, { emoji: "🧒" }),
    sentenceMcq({
      id: "ko-m19-2-q-male-oldersis",
      prompt: "A MALE speaker's 'older sister' is —",
      correctHangul: "누나",
      distractorsHangul: ["언니", "오빠", "동생"],
      explanation: "A male says 누나 for an older sister; a female says 언니.",
      exercisedAtomSurfaces: ["누나"],
    }),
    sentenceMcq({
      id: "ko-m19-2-q-female-olderbro",
      prompt: "A FEMALE speaker's 'older brother' is —",
      correctHangul: "오빠",
      distractorsHangul: ["형", "누나", "동생"],
      explanation: "A female says 오빠 for an older brother; a male says 형.",
      exercisedAtomSurfaces: ["오빠"],
    }),
    listeningCompSentence({
      id: "ko-m19-2-lc-dongsaeng",
      audioText: "동생",
      correctMeaningEn: "younger sibling",
      distractorsEn: ["older brother", "older sister", "parents"],
      exercisedAtomSurfaces: ["동생"],
    }),
    speaking("ko-m19-2-speak-eonni", "언니", "older sister (female's)", ["언니"]),
  ],
};

// ─── ko-m19-3 — 우리 (our = my, in-group) ───────────────────────────────────

const M19_3: LessonContent = {
  id: "ko-m19-3",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "우리 — our / my (family)",
  description: "Use 우리 the way Koreans say 'my mom, my family'.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m19-3-info",
      "우리 = 'our', used as 'my' for in-group things",
      "우리 literally means 'our/we', but Korean uses it where English says 'my' for close, shared things: 우리 엄마 = 'my mom', 우리 가족 = 'my family', 우리 집 = 'my/our home'. Saying 제 엄마 ('my mom' with the possessive 제) sounds oddly cold here. This in-group 'we' is one of the most Korean things about the language.",
      "grammar",
    ),
    phrase("ko-m19-3-p-uri", "our / my (in-group)", "uri", "우리"),
    sentenceMcq({
      id: "ko-m19-3-q-mymom",
      prompt: "'my mom' (the natural way) —",
      correctHangul: "우리 엄마",
      distractorsHangul: ["제 엄마", "우리를 엄마", "엄마 우리"],
      explanation: "Koreans say 우리 엄마 ('our mom') for 'my mom' — the in-group 우리.",
      exercisedAtomSurfaces: ["우리", "엄마"],
    }),
    cloze(
      "ko-m19-3-cloze-myfamily",
      "",
      "가족은 네 명이에요",
      "우리",
      ["우리", "제", "그", "이"],
      "My family is four people.",
      "우리 가족은 네 명이에요",
      "우리 가족 = 'my family'. (명 = the people counter, next lesson.)",
    ),
    translateStep({
      id: "ko-m19-3-tr-myhome",
      promptEn: "My home is over there.",
      acceptedAnswers: ["우리 집은 저기예요", "우리 집은 저기예요.", "우리 집이 저기예요"],
      audioText: "우리 집은 저기예요",
      // NATIVE-REVIEW: 저기 ('over there') is from M-earlier deixis; 우리 집은
      // 저기예요 reads naturally. Confirm the topic 은 vs subject 이 choice is
      // both acceptable as authored (both accepted answers).
      exercisedAtomSurfaces: ["우리", "집"],
    }),
    listeningCompSentence({
      id: "ko-m19-3-lc-mymom",
      audioText: "우리 엄마예요",
      correctMeaningEn: "This is my mom",
      distractorsEn: ["This is our house", "She is my friend", "This is my dad"],
      exercisedAtomSurfaces: ["우리", "엄마"],
    }),
    speaking("ko-m19-3-speak-myfamily", "우리 가족", "my family", ["우리", "가족"]),
  ],
};

// ─── ko-m19-4 — Counting people (명) ────────────────────────────────────────

const M19_4: LessonContent = {
  id: "ko-m19-4",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Counting people — 명",
  description: "한 명, 두 명: count people with native numbers.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m19-4-info",
      "Native numbers + 명",
      "People are counted with NATIVE numbers + 명: 한 명 (1 person), 두 명 (2), 세 명 (3), 네 명 (4), 다섯 명 (5). Just like the o'clock counter 시 (M11), the numbers 1-4 take their short pre-counter forms 한/두/세/네 (NOT 하나/둘/셋/넷). 가족이 네 명이에요 = 'There are four people in my family.'",
      "grammar",
    ),
    phrase("ko-m19-4-p-myeong", "(counter for people)", "myeong", "명"),
    sentenceMcq({
      id: "ko-m19-4-q-twopeople",
      prompt: "'two people' —",
      correctHangul: "두 명",
      distractorsHangul: ["둘 명", "이 명", "두 개"],
      explanation: "두 (pre-counter form of 둘) + 명. 개 counts objects, not people.",
      exercisedAtomSurfaces: ["명"],
    }),
    cloze(
      "ko-m19-4-cloze-fourpeople",
      "가족이 네",
      "이에요",
      "명",
      ["명", "개", "살", "시"],
      "My family is four people.",
      "가족이 네 명이에요",
      "명 counts people. 개 = objects, 살 = age, 시 = o'clock.",
    ),
    sentenceMcq({
      id: "ko-m19-4-q-threepeople",
      prompt: "'three people' —",
      correctHangul: "세 명",
      distractorsHangul: ["셋 명", "삼 명", "세 개"],
      explanation: "세 (pre-counter form of 셋) + 명.",
      exercisedAtomSurfaces: ["명"],
    }),
    listeningCompSentence({
      id: "ko-m19-4-lc-fourpeople",
      audioText: "네 명이에요",
      correctMeaningEn: "It's four people",
      distractorsEn: ["It's four o'clock", "It's four years old", "It's four (objects)"],
      exercisedAtomSurfaces: ["명"],
    }),
    speaking("ko-m19-4-speak-twopeople", "두 명이에요", "It's two people", ["명"]),
  ],
};

// ─── ko-m19-5 — Age (살) ────────────────────────────────────────────────────

const M19_5: LessonContent = {
  id: "ko-m19-5",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Age — 살",
  description: "스무 살, 서른 살: give your age.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m19-5-info",
      "Native numbers + 살",
      "Age uses NATIVE numbers + 살 ('years old'). Tens: 스물 (20), 서른 (30), 마흔 (40). Before the counter, 스물 shrinks to 스무: 스무 살 = '20 years old'. 서른 살 = '30'. To ask, use 몇 살이에요? ('how old?'). 저는 스무 살이에요 = 'I'm twenty.'",
      "grammar",
    ),
    phrase("ko-m19-5-p-sal", "years old (age counter)", "sal", "살"),
    phrase("ko-m19-5-p-seumu", "twenty (before counter)", "seumu", "스무"),
    phrase("ko-m19-5-p-seoreun", "thirty", "seoreun", "서른"),
    sentenceMcq({
      id: "ko-m19-5-q-twenty",
      prompt: "'I'm twenty years old.' —",
      correctHangul: "스무 살이에요",
      distractorsHangul: ["스물 살이에요", "이십 살이에요", "스무 명이에요"],
      explanation: "스물 → 스무 before 살. Age uses native numbers, not Sino 이십.",
      exercisedAtomSurfaces: ["살"],
    }),
    cloze(
      "ko-m19-5-cloze-thirty",
      "서른",
      "이에요",
      "살",
      ["살", "명", "개", "시"],
      "I'm thirty (years old).",
      "서른 살이에요",
      "살 = the age counter.",
    ),
    sentenceMcq({
      id: "ko-m19-5-q-howold",
      prompt: "'How old are you?' —",
      correctHangul: "몇 살이에요?",
      distractorsHangul: ["몇 명이에요?", "몇 개예요?", "얼마예요?"],
      explanation: "몇 살이에요? = 'how old?'. 몇 명 = how many people, 얼마 = how much.",
      exercisedAtomSurfaces: ["살"],
    }),
    listeningCompSentence({
      id: "ko-m19-5-lc-twenty",
      audioText: "스무 살이에요",
      correctMeaningEn: "I'm twenty years old",
      distractorsEn: ["It's twenty o'clock", "There are twenty people", "I'm thirty years old"],
      exercisedAtomSurfaces: ["살"],
    }),
    speaking("ko-m19-5-speak-howold", "몇 살이에요?", "How old are you?", ["살"]),
  ],
};

// ─── ko-m19-6 — Putting it together ─────────────────────────────────────────

const M19_6: LessonContent = {
  id: "ko-m19-6",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Describing your family",
  description: "Combine 우리 가족, 명, and 살.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m19-6-info",
      "Introducing your family",
      "우리 가족은 네 명이에요 = 'My family is four people.' 우리 형은 스무 살이에요 = 'My older brother is twenty.' Stack 우리 (in-group 'my') with the 명 and 살 counters to introduce everyone.",
      "default",
    ),
    build(
      "ko-m19-6-build-familyfour",
      "Build: 'My family is four people.' (our + family-topic + four + people + is)",
      "우리 가족은 네 명이에요",
      ["우리", "가족은", "네 명이에요", "두 명이에요"],
      ["우리", "가족은", "네 명이에요"],
      ["우리", "가족", "명"],
    ),
    sentenceMcq({
      id: "ko-m19-6-q-broage",
      prompt: "'My older brother is twenty.' (female speaker) —",
      correctHangul: "우리 오빠는 스무 살이에요",
      distractorsHangul: ["우리 형은 스무 살이에요", "우리 오빠는 스물 살이에요", "우리 오빠는 스무 명이에요"],
      // NATIVE-REVIEW: assumes a female speaker (오빠). 우리 오빠는 스무
      // 살이에요 is natural; confirm 오빠 + 는 topic reads well here.
      explanation: "A female says 오빠; 스물 → 스무 before 살.",
      exercisedAtomSurfaces: ["우리", "살"],
    }),
    translateStep({
      id: "ko-m19-6-tr-mymomthirty",
      promptEn: "My mom is forty (years old).",
      acceptedAnswers: ["우리 엄마는 마흔 살이에요", "우리 엄마는 마흔 살이에요."],
      audioText: "우리 엄마는 마흔 살이에요",
      // NATIVE-REVIEW: 마흔 (40) is introduced only in the M19-5 info text, not
      // as its own atom. Confirm acceptable as recognition here, or backfill
      // 마흔 as an atom.
      exercisedAtomSurfaces: ["우리", "엄마", "살"],
    }),
    listeningCompSentence({
      id: "ko-m19-6-lc-familyfour",
      audioText: "우리 가족은 네 명이에요",
      correctMeaningEn: "My family is four people",
      distractorsEn: ["My family is three people", "There are four o'clock", "My family is twenty"],
      exercisedAtomSurfaces: ["우리", "가족", "명"],
    }),
    speaking("ko-m19-6-speak-familyfour", "우리 가족은 네 명이에요", "My family is four people", ["우리", "가족", "명"]),
  ],
};

// ─── ko-m19-7 — Mini-dialogue ───────────────────────────────────────────────

const M19_7: LessonContent = {
  id: "ko-m19-7",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — talking about family",
  description: "Ask and answer about each other's families.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m19-7-info",
      "A family chat",
      "A: 가족이 몇 명이에요? (How many in your family?)\nB: 네 명이에요. 엄마, 아빠, 형, 그리고 저요. (Four. Mom, dad, my older brother, and me.)\nA: 형은 몇 살이에요? (How old is your brother?)\nB: 스무 살이에요. (He's twenty.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m19-7-q-howmany",
      prompt: "'How many people in your family?' —",
      correctHangul: "가족이 몇 명이에요?",
      distractorsHangul: ["가족이 몇 살이에요?", "가족이 얼마예요?", "가족이 몇 개예요?"],
      explanation: "몇 명 = how many people; 몇 살 = how old.",
      exercisedAtomSurfaces: ["가족", "명"],
    }),
    build(
      "ko-m19-7-build-fourandme",
      "Build: 'Four people. Mom, dad, and me.' (four-people + mom + dad + and + me)",
      "네 명이에요. 엄마, 아빠, 그리고 저요",
      ["네 명이에요.", "엄마, 아빠,", "그리고 저요", "그리고 형이요"],
      ["네 명이에요.", "엄마, 아빠,", "그리고 저요"],
      ["명", "엄마", "아빠"],
    ),
    sentenceMcq({
      id: "ko-m19-7-q-howoldbro",
      prompt: "'How old is your older brother?' (male speaker) —",
      correctHangul: "형은 몇 살이에요?",
      distractorsHangul: ["형은 몇 명이에요?", "형은 얼마예요?", "오빠는 몇 살이에요?"],
      // NATIVE-REVIEW: male speaker → 형. 형은 몇 살이에요? is natural.
      explanation: "A male says 형; 몇 살 = how old.",
      exercisedAtomSurfaces: ["살"],
    }),
    listeningCompSentence({
      id: "ko-m19-7-lc-twenty",
      audioText: "스무 살이에요",
      correctMeaningEn: "He's twenty years old",
      distractorsEn: ["There are twenty people", "It's twenty o'clock", "He's thirty"],
      exercisedAtomSurfaces: ["살"],
    }),
    speaking("ko-m19-7-speak-howmany", "가족이 몇 명이에요?", "How many people in your family?", ["가족", "명"]),
  ],
};

// ─── ko-m19-8 — Mastery test ────────────────────────────────────────────────

const M19_8: LessonContent = {
  id: "ko-m19-8",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M19 Mastery Test",
  description: "Family, siblings, 우리, and the 명 / 살 counters.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m19-8-q-parents",
      prompt: "Which means 'parents'?",
      correctHangul: "부모님",
      distractorsHangul: ["가족", "동생", "엄마"],
      exercisedAtomSurfaces: ["부모님"],
    }),
    sentenceMcq({
      id: "ko-m19-8-q-female-oldersis",
      prompt: "A FEMALE speaker's 'older sister' is —",
      correctHangul: "언니",
      distractorsHangul: ["누나", "오빠", "동생"],
      exercisedAtomSurfaces: ["언니"],
    }),
    sentenceMcq({
      id: "ko-m19-8-q-mymom",
      prompt: "'my mom' (the natural way) —",
      correctHangul: "우리 엄마",
      distractorsHangul: ["제 엄마", "엄마 우리", "우리를 엄마"],
      exercisedAtomSurfaces: ["우리", "엄마"],
    }),
    cloze(
      "ko-m19-8-cloze-fourpeople",
      "가족이 네",
      "이에요",
      "명",
      ["명", "개", "살", "시"],
      "My family is four people.",
      "가족이 네 명이에요",
      "명 counts people.",
    ),
    sentenceMcq({
      id: "ko-m19-8-q-twenty",
      prompt: "'I'm twenty years old.' —",
      correctHangul: "스무 살이에요",
      distractorsHangul: ["스물 살이에요", "이십 살이에요", "스무 명이에요"],
      exercisedAtomSurfaces: ["살"],
    }),
    listeningCompSentence({
      id: "ko-m19-8-lc-howmany",
      audioText: "가족이 몇 명이에요?",
      correctMeaningEn: "How many people in your family?",
      distractorsEn: ["How old is your family?", "How much is it?", "Where is your family?"],
      exercisedAtomSurfaces: ["가족", "명"],
    }),
    speaking("ko-m19-8-speak-recap", "우리 가족은 네 명이에요", "My family is four people", ["우리", "가족", "명"]),
  ],
};

export const KO_M19_LESSONS: LessonContent[] = [
  M19_1,
  M19_2,
  M19_3,
  M19_4,
  M19_5,
  M19_6,
  M19_7,
  M19_8,
];
