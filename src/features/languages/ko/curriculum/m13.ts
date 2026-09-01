/**
 * Korean Module 13 — Months, frequency, and ranges (부터/까지 + 그래서).
 *
 * M13 opens the M13-M18 arc (N4 territory) and mirrors the JA M13 grammar
 * arc (months + frequency spectrum + から time-range/because), re-expressed
 * in Korean's own grammar:
 *
 *   ko-m13-1  월 — months (Sino number + 월), incl. the 유월/시월 irregulars
 *   ko-m13-2  Frequency — 항상 / 자주 / 가끔 / 별로~안 / 전혀~안
 *   ko-m13-3  부터 / 까지 — from … until (time ranges)
 *   ko-m13-4  그래서 — so / therefore (joining two sentences)
 *   ko-m13-5  Routine — frequency + a daily action
 *   ko-m13-6  Putting ranges to work — schedules
 *   ko-m13-7  Mini-dialogue — talking about routines
 *   ko-m13-8  M13 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - Months are SINO number + 월: 일월 (Jan), 이월 (Feb) … but 6월 = 유월
 *     (NOT 육월) and 10월 = 시월 (NOT 십월). These two are mandatory spelling
 *     contractions, taught explicitly.
 *   - 별로 and 전혀 are negative-polarity adverbs: they REQUIRE a following
 *     negative (별로 안 좋아요 = 'not really good'; 전혀 안 가요 = 'I never go').
 *   - 부터 = 'from (a start time)' vs 에서 = 'from (a place)'. 까지 = 'until'.
 *     A range is 월요일부터 금요일까지 = 'from Monday to Friday'.
 *   - 그래서 starts a NEW sentence ('so/therefore'); the in-clause 아서/어서
 *     reason connective is taught in M14.
 *
 * NATIVE-REVIEW flags are inline at the relevant steps. See WORKTREE_REPORT.md.
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
import { withReviewInterleave } from "./_reviewInterleave";

const COURSE_ID = "mock-1";

// ─── ko-m13-1 — 월 (months) ─────────────────────────────────────────────────

const M13_1: LessonContent = {
  id: "ko-m13-1",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "월 — months",
  description: "Sino number + 월. Watch out for 유월 and 시월.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m13-1-info",
      "Sino numbers + 월",
      "A month is a SINO number (일/이/삼…, from M3) + 월. 일월 = January, 이월 = February, 삼월 = March. TWO are irregular and you must memorize them: 6월 = 유월 (not 육월) and 10월 = 시월 (not 십월). Everything else is regular.",
      "grammar",
    ),
    phrase("ko-m13-1-p-month", "month (counter)", "wol", "월"),
    phrase("ko-m13-1-p-jan", "January", "irwol", "일월"),
    phrase("ko-m13-1-p-jun", "June (irregular!)", "yuwol", "유월"),
    phrase("ko-m13-1-p-oct", "October (irregular!)", "siwol", "시월"),
    sentenceMcq({
      id: "ko-m13-1-q-june",
      prompt: "'June' —",
      correctHangul: "유월",
      distractorsHangul: ["육월", "유일", "육일"],
      explanation: "6월 contracts to 유월 (not 육월) — a fixed spelling.",
      exercisedAtomSurfaces: ["유월"],
    }),
    sentenceMcq({
      id: "ko-m13-1-q-march",
      prompt: "'March' —",
      correctHangul: "삼월",
      distractorsHangul: ["세월", "삼일", "삼분"],
      explanation: "삼 (Sino 3) + 월 = 삼월. Regular.",
      exercisedAtomSurfaces: ["월"],
    }),
    listeningCompSentence({
      id: "ko-m13-1-lc-october",
      audioText: "시월",
      correctMeaningEn: "October",
      distractorsEn: ["September", "January", "ten o'clock"],
      exercisedAtomSurfaces: ["시월"],
    }),
    speaking("ko-m13-1-speak-june", "유월", "June", ["유월"]),
  ],
};

// ─── ko-m13-2 — Frequency adverbs ───────────────────────────────────────────

const M13_2: LessonContent = {
  id: "ko-m13-2",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Frequency — 항상 / 자주 / 가끔",
  description: "How often? always → often → sometimes → never.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m13-2-info",
      "The frequency spectrum",
      "항상 (always) > 자주 (often) > 가끔 (sometimes). The bottom of the scale needs a NEGATIVE verb: 별로 안 ~ ('not really') and 전혀 안 ~ ('never / not at all'). The adverb sits right before the verb: 자주 가요 = 'I often go'; 전혀 안 가요 = 'I never go'.",
      "grammar",
    ),
    phrase("ko-m13-2-p-always", "always", "hangsang", "항상"),
    phrase("ko-m13-2-p-often", "often", "jaju", "자주"),
    phrase("ko-m13-2-p-sometimes", "sometimes", "gakkeum", "가끔"),
    phrase("ko-m13-2-p-never", "never (with 안)", "jeonhyeo", "전혀"),
    // 2026-09-01 audit: 운동 was graded in the listening step below three
    // lessons before its old m13-5 intro — the intro card moved here.
    phrase("ko-m13-2-p-exercise", "exercise", "undong", "운동", undefined, { emoji: "🏃" }),
    sentenceMcq({
      id: "ko-m13-2-q-often",
      prompt: "'I often eat (it).' —",
      correctHangul: "자주 먹어요",
      distractorsHangul: ["가끔 먹어요", "항상 먹어요", "전혀 먹어요"],
      explanation: "자주 = 'often'. (전혀 would need an 안 after it.)",
      exercisedAtomSurfaces: ["자주", "먹어요"],
    }),
    sentenceMcq({
      id: "ko-m13-2-q-never",
      prompt: "'I never drink coffee.' —",
      correctHangul: "커피를 전혀 안 마셔요",
      distractorsHangul: ["커피를 전혀 마셔요", "커피를 자주 마셔요", "커피를 항상 마셔요"],
      explanation: "전혀 ('at all') is negative-polarity → it needs 안: 전혀 안 마셔요.",
      exercisedAtomSurfaces: ["전혀", "마셔요"],
    }),
    cloze(
      "ko-m13-2-cloze-notreally",
      "별로",
      "좋아요",
      "안",
      ["안", "못", "도", "은"],
      "It's not really good.",
      "별로 안 좋아요",
      // NATIVE-REVIEW: 별로 + 안 + 좋아요 is natural; some speakers also say
      // 별로 안 좋아해요 for the verb 'like'. Confirm 별로 안 좋아요 reads as
      // the intended '(it) is not really good' rather than 'I don't like it'.
      "별로 is negative-polarity → pair it with 안.",
    ),
    listeningCompSentence({
      id: "ko-m13-2-lc-always",
      audioText: "항상 운동해요",
      correctMeaningEn: "I always exercise",
      distractorsEn: ["I sometimes exercise", "I never exercise", "I often study"],
      exercisedAtomSurfaces: ["항상", "운동"],
    }),
    speaking("ko-m13-2-speak-often", "자주 가요", "I often go", ["자주", "가요"]),
  ],
};

// ─── ko-m13-3 — 부터 / 까지 (from … until) ──────────────────────────────────

const M13_3: LessonContent = {
  id: "ko-m13-3",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "부터 / 까지 — from … until",
  description: "Mark the start and end of a time range.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m13-3-info",
      "부터 = 'from', 까지 = 'until'",
      "부터 marks a STARTING time, 까지 marks an ending point. They pair up: 월요일부터 금요일까지 = 'from Monday to Friday'; 한 시부터 세 시까지 = 'from 1:00 to 3:00'. Don't confuse 부터 ('from a time') with 에서 ('from a place', M6).",
      "grammar",
    ),
    phrase("ko-m13-3-p-from", "from (a time)", "buteo", "부터"),
    phrase("ko-m13-3-p-until", "until", "kkaji", "까지"),
    cloze(
      "ko-m13-3-cloze-fromone",
      "한 시",
      "세 시까지",
      "부터",
      ["부터", "까지", "에서", "에"],
      "From 1:00 to 3:00.",
      "한 시부터 세 시까지",
      "부터 marks the start time.",
    ),
    cloze(
      "ko-m13-3-cloze-untilfive",
      "한 시부터 다섯 시",
      "공부해요",
      "까지",
      ["까지", "부터", "에서", "도"],
      "I study from 1:00 to 5:00.",
      "한 시부터 다섯 시까지 공부해요",
      "까지 marks the end point.",
    ),
    sentenceMcq({
      id: "ko-m13-3-q-monfri",
      prompt: "'From Monday to Friday' —",
      correctHangul: "월요일부터 금요일까지",
      distractorsHangul: ["월요일까지 금요일부터", "월요일에서 금요일까지", "월요일부터 금요일에"],
      explanation: "Start → 부터, end → 까지. 월요일부터 금요일까지.",
      exercisedAtomSurfaces: ["부터", "까지"],
    }),
    listeningCompSentence({
      id: "ko-m13-3-lc-range",
      audioText: "한 시부터 세 시까지 공부해요",
      correctMeaningEn: "I study from 1:00 to 3:00",
      distractorsEn: ["I study at 3:00", "I study from 3:00 to 1:00", "I study until 1:00"],
      exercisedAtomSurfaces: ["부터", "까지"],
    }),
    speaking("ko-m13-3-speak-range", "월요일부터 금요일까지", "from Monday to Friday", ["부터", "까지"]),
  ],
};

// ─── ko-m13-4 — 그래서 (so / therefore) ─────────────────────────────────────

const M13_4: LessonContent = {
  id: "ko-m13-4",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "그래서 — so / therefore",
  description: "Link a reason to a result across two sentences.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m13-4-info",
      "그래서 connects sentences",
      "그래서 = 'so / therefore'. It starts a NEW sentence whose cause was just stated: 비가 와요. 그래서 집에 있어요. = 'It's raining. So I'm staying home.' (The shorter in-clause reason connective 아서/어서 — gluing cause and result into one clause — comes in M14.)",
      "grammar",
    ),
    phrase("ko-m13-4-p-so", "so / therefore", "geuraeseo", "그래서"),
    // 2026-09-01 audit: the rain idiom 비가 와요 (lit. "rain comes") had to be
    // PRODUCED in the translate step below but was only ever shown inside an
    // info card — explicit phrase-card intro added. 비 is the M1 reading word;
    // 와요 is the M7 "come" — the idiom pairing is what's new.
    phrase(
      "ko-m13-4-p-rain",
      "it's raining (lit. rain comes)",
      "biga wayo",
      "비가 와요",
      undefined,
      { emoji: "🌧️" },
    ),
    sentenceMcq({
      id: "ko-m13-4-q-sostayhome",
      prompt: "'It's raining. So I'm staying home.' —",
      correctHangul: "비가 와요. 그래서 집에 있어요",
      distractorsHangul: ["비가 와요. 그리고 집에 있어요", "비가 와요. 하지만 집에 있어요", "비가 와요. 그래서 집에 가요"],
      explanation: "그래서 = result of the stated cause. 그리고 = just 'and'; 하지만 = 'but'.",
      exercisedAtomSurfaces: ["그래서", "비"],
    }),
    build(
      "ko-m13-4-build-sostudy",
      "Build: 'I have a test. So I study.' (test exists + 그래서 + study)",
      "시험이 있어요. 그래서 공부해요",
      ["시험이", "있어요.", "그래서", "공부해요", "그리고"],
      ["시험이", "있어요.", "그래서", "공부해요"],
      // NATIVE-REVIEW: 시험 ('test/exam') appears only in this build prompt and
      // is not registered as its own atom — confirm it's acceptable as a
      // recognition-only support word, or swap to an M-taught noun.
      ["그래서", "공부", "해요"],
    ),
    translateStep({
      id: "ko-m13-4-tr-sogohome",
      promptEn: "It's raining. So I go home.",
      acceptedAnswers: ["비가 와요. 그래서 집에 가요", "비가 와요. 그래서 집에 가요."],
      audioText: "비가 와요. 그래서 집에 가요",
      exercisedAtomSurfaces: ["그래서", "비", "가요"],
    }),
    listeningCompSentence({
      id: "ko-m13-4-lc-so",
      audioText: "비가 와요. 그래서 집에 있어요",
      correctMeaningEn: "It's raining, so I'm staying home",
      distractorsEn: ["It's raining, but I go out", "It's sunny, so I go home", "It's raining and I study"],
      exercisedAtomSurfaces: ["그래서", "비"],
    }),
    speaking("ko-m13-4-speak-so", "비가 와요. 그래서 집에 있어요", "It's raining, so I'm staying home", ["그래서", "비"]),
  ],
};

// ─── ko-m13-5 — Routine (frequency + action) ────────────────────────────────

const M13_5: LessonContent = {
  id: "ko-m13-5",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Routine — how often you do things",
  description: "Combine a frequency adverb with a daily action.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m13-5-info",
      "Frequency + place + verb",
      "Stack a frequency adverb with the rest of the sentence: 저는 자주 회사에 가요 = 'I often go to the office'; 가끔 운동해요 = 'I sometimes exercise'. The adverb hugs the verb, after any topic/place.",
      "default",
    ),
    phrase("ko-m13-5-p-company", "company / workplace", "hoesa", "회사"),
    sentenceMcq({
      id: "ko-m13-5-q-oftenoffice",
      prompt: "'I often go to the office.' —",
      correctHangul: "자주 회사에 가요",
      distractorsHangul: ["자주 회사에서 가요", "회사에 자주 가요?", "자주 회사를 가요"],
      // NATIVE-REVIEW: both 자주 회사에 가요 and 회사에 자주 가요 are natural;
      // the chosen distractor 회사에 자주 가요? is wrong only because of the
      // question mark/intonation, not word order. Confirm this isn't confusing.
      explanation: "Destination → 에; 자주 hugs the verb. 자주 회사에 가요.",
      exercisedAtomSurfaces: ["자주", "회사", "가요"],
    }),
    cloze(
      "ko-m13-5-cloze-sometimesexercise",
      "가끔",
      "해요",
      "운동",
      ["운동", "공부", "전화", "운전"],
      "I sometimes exercise.",
      "가끔 운동해요",
      "가끔 (sometimes) + 운동해요 (exercise).",
    ),
    translateStep({
      id: "ko-m13-5-tr-alwaysstudy",
      promptEn: "I always study at home.",
      acceptedAnswers: ["항상 집에서 공부해요", "저는 항상 집에서 공부해요", "항상 집에서 공부해요."],
      audioText: "항상 집에서 공부해요",
      exercisedAtomSurfaces: ["항상", "공부", "해요"],
    }),
    listeningCompSentence({
      id: "ko-m13-5-lc-oftenoffice",
      audioText: "자주 회사에 가요",
      correctMeaningEn: "I often go to the office",
      distractorsEn: ["I never go to the office", "I sometimes go home", "I always exercise"],
      exercisedAtomSurfaces: ["자주", "회사", "가요"],
    }),
    speaking("ko-m13-5-speak-sometimes", "가끔 운동해요", "I sometimes exercise", ["가끔", "운동"]),
  ],
};

// ─── ko-m13-6 — Ranges at work (schedules) ──────────────────────────────────

const M13_6: LessonContent = {
  id: "ko-m13-6",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Schedules — ranges + actions",
  description: "Say what you do from when to when.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m13-6-info",
      "A range plus an action",
      "Put a 부터…까지 range in front of a verb: 아홉 시부터 다섯 시까지 일해요 = 'I work from 9:00 to 5:00'. With months: 유월부터 시월까지 = 'from June to October'.",
      "default",
    ),
    build(
      "ko-m13-6-build-worknine",
      "Build: 'I work from 9:00 to 5:00.' (9:00 + from + 5:00 + until + work)",
      "아홉 시부터 다섯 시까지 일해요",
      ["아홉 시부터", "다섯 시까지", "일해요", "운동해요"],
      ["아홉 시부터", "다섯 시까지", "일해요"],
      // NATIVE-REVIEW: 일하다/일해요 ('to work') is used here but not registered
      // as its own atom — confirm it's acceptable as a recognition-only word at
      // M13, or swap to 공부해요 (already taught).
      ["시", "부터", "까지"],
    ),
    sentenceMcq({
      id: "ko-m13-6-q-juneoct",
      prompt: "'From June to October' —",
      correctHangul: "유월부터 시월까지",
      distractorsHangul: ["육월부터 십월까지", "유월까지 시월부터", "유월에서 시월까지"],
      explanation: "Irregular months + range: 유월부터 시월까지.",
      exercisedAtomSurfaces: ["유월", "시월", "부터", "까지"],
    }),
    translateStep({
      id: "ko-m13-6-tr-studyrange",
      promptEn: "I study from 1:00 to 3:00.",
      acceptedAnswers: ["한 시부터 세 시까지 공부해요", "한 시부터 세 시까지 공부해요."],
      audioText: "한 시부터 세 시까지 공부해요",
      exercisedAtomSurfaces: ["부터", "까지", "공부", "해요"],
    }),
    listeningCompSentence({
      id: "ko-m13-6-lc-juneoct",
      audioText: "유월부터 시월까지",
      correctMeaningEn: "from June to October",
      distractorsEn: ["from October to June", "from June to September", "until October"],
      exercisedAtomSurfaces: ["유월", "시월", "부터", "까지"],
    }),
    speaking("ko-m13-6-speak-juneoct", "유월부터 시월까지", "from June to October", ["유월", "시월"]),
  ],
};

// ─── ko-m13-7 — Mini-dialogue ───────────────────────────────────────────────

const M13_7: LessonContent = {
  id: "ko-m13-7",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — your routine",
  description: "Ask and answer about how often and when.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m13-7-info",
      "Talking about routines",
      "A: 자주 운동해요? (Do you exercise often?)\nB: 아니요, 가끔 해요. (No, sometimes.)\nA: 언제 공부해요? (When do you study?)\nB: 한 시부터 세 시까지 공부해요. (From 1:00 to 3:00.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m13-7-q-doyouexercise",
      prompt: "'Do you exercise often?' —",
      correctHangul: "자주 운동해요?",
      distractorsHangul: ["가끔 운동해요?", "전혀 운동해요?", "자주 공부해요?"],
      explanation: "자주 (often) + 운동해요? with rising intonation = a yes/no question.",
      exercisedAtomSurfaces: ["자주", "운동"],
    }),
    sentenceMcq({
      id: "ko-m13-7-q-sometimesdo",
      prompt: "'No, I do (it) sometimes.' —",
      correctHangul: "아니요, 가끔 해요",
      distractorsHangul: ["아니요, 항상 해요", "네, 전혀 해요", "아니요, 자주 안 해요"],
      explanation: "가끔 = 'sometimes'.",
      exercisedAtomSurfaces: ["가끔", "해요"],
    }),
    build(
      "ko-m13-7-build-studyrange",
      "Build: 'I study from 1:00 to 3:00.' (1:00 + from + 3:00 + until + study)",
      "한 시부터 세 시까지 공부해요",
      ["한 시부터", "세 시까지", "공부해요", "운동해요"],
      ["한 시부터", "세 시까지", "공부해요"],
      ["부터", "까지", "공부"],
    ),
    listeningCompSentence({
      id: "ko-m13-7-lc-when",
      audioText: "한 시부터 세 시까지 공부해요",
      correctMeaningEn: "I study from 1:00 to 3:00",
      distractorsEn: ["I exercise at 3:00", "I study until 1:00", "I study from 3:00"],
      exercisedAtomSurfaces: ["부터", "까지", "공부"],
    }),
    speaking("ko-m13-7-speak-sometimes", "아니요, 가끔 해요", "No, I do it sometimes", ["가끔", "해요"]),
  ],
};

// ─── ko-m13-8 — Mastery test ────────────────────────────────────────────────

const M13_8: LessonContent = {
  id: "ko-m13-8",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M13 Mastery Test",
  description: "Months, frequency, ranges, and 그래서.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m13-8-q-june",
      prompt: "'June' —",
      correctHangul: "유월",
      distractorsHangul: ["육월", "유일", "육일"],
      exercisedAtomSurfaces: ["유월"],
    }),
    sentenceMcq({
      id: "ko-m13-8-q-never",
      prompt: "'I never drink coffee.' —",
      correctHangul: "커피를 전혀 안 마셔요",
      distractorsHangul: ["커피를 전혀 마셔요", "커피를 자주 마셔요", "커피를 항상 마셔요"],
      exercisedAtomSurfaces: ["전혀", "마셔요"],
    }),
    cloze(
      "ko-m13-8-cloze-from",
      "한 시",
      "세 시까지",
      "부터",
      ["부터", "까지", "에서", "에"],
      "From 1:00 to 3:00.",
      "한 시부터 세 시까지",
      "Start time → 부터.",
    ),
    sentenceMcq({
      id: "ko-m13-8-q-monfri",
      prompt: "'From Monday to Friday' —",
      correctHangul: "월요일부터 금요일까지",
      distractorsHangul: ["월요일까지 금요일부터", "월요일에서 금요일까지", "월요일부터 금요일에"],
      exercisedAtomSurfaces: ["부터", "까지"],
    }),
    sentenceMcq({
      id: "ko-m13-8-q-so",
      prompt: "'It's raining. So I'm staying home.' —",
      correctHangul: "비가 와요. 그래서 집에 있어요",
      distractorsHangul: ["비가 와요. 그리고 집에 있어요", "비가 와요. 하지만 집에 있어요", "비가 와요. 그래서 집에 가요"],
      exercisedAtomSurfaces: ["그래서", "비"],
    }),
    listeningCompSentence({
      id: "ko-m13-8-lc-range",
      audioText: "유월부터 시월까지",
      correctMeaningEn: "from June to October",
      distractorsEn: ["from October to June", "until October", "from June to September"],
      exercisedAtomSurfaces: ["유월", "시월", "부터", "까지"],
    }),
    speaking("ko-m13-8-speak-recap", "자주 운동해요", "I often exercise", ["자주", "운동"]),
  ],
};

export const KO_M13_LESSONS: LessonContent[] = withReviewInterleave("m13", [
  M13_1,
  M13_2,
  M13_3,
  M13_4,
  M13_5,
  M13_6,
  M13_7,
  M13_8,
]);
