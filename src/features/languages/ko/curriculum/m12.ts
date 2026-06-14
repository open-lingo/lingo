/**
 * Korean Module 12 — Time & the week (clock + days).
 *
 * M12 closes the M7-M12 arc by letting the learner say WHEN. Telling time
 * in Korean famously uses BOTH number systems at once — native numbers for
 * the hour (한 시 = 1 o'clock) and Sino numbers for the minutes (삼십 분 =
 * 30 minutes). The module also adds the days of the week (요일) and the time
 * particle 에 ('at'), so the learner can schedule actions.
 *
 * Grammar spine mirrors the JA M12 arc (〜じ hours / 〜ふん minutes + days +
 * に time marker), re-expressed in Korean's own grammar:
 *
 *   ko-m12-1  시 — the hour (native numbers + 시)
 *   ko-m12-2  분 / 반 — minutes & half past (Sino numbers + 분)
 *   ko-m12-3  몇 시예요? — asking the time
 *   ko-m12-4  Days of the week — 월요일 … 일요일
 *   ko-m12-5  에 — the time particle ('at')
 *   ko-m12-6  Scheduling — time + day + action
 *   ko-m12-7  Mini-dialogue — making plans
 *   ko-m12-8  M12 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - Hours use NATIVE numbers with their pre-counter contractions (한/두/세,
 *     taught in M5) + 시. So 1:00 = 한 시, 2:00 = 두 시, 3:00 = 세 시.
 *   - Minutes use SINO numbers (taught in M3) + 분. 30 min = 삼십 분.
 *   - 반 = 'half past': 한 시 반 = 1:30.
 *   - 에 marks the time of an event (세 시에 = 'at 3:00') — same 에 as the M6
 *     location particle, a discrimination point worth flagging.
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

const COURSE_ID = "mock-1";

// ─── ko-m12-1 — 시 (the hour) ───────────────────────────────────────────────

const M12_1: LessonContent = {
  id: "ko-m12-1",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "시 — o'clock",
  description: "Hours use NATIVE numbers: 한 시, 두 시, 세 시.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m12-1-info",
      "Native numbers + 시",
      "For the hour, use the NATIVE numbers in their before-a-counter form (the same 한/두/세 you learned in M5) plus 시. 한 시 = 1:00, 두 시 = 2:00, 세 시 = 3:00, 네 시 = 4:00. Don't use the Sino numbers (일/이/삼) for hours.",
      "grammar",
    ),
    phrase("ko-m12-1-p-hour", "o'clock (hour counter)", "si", "시"),
    phrase("ko-m12-1-p-one", "1 o'clock", "han si", "한 시"),
    phrase("ko-m12-1-p-three", "3 o'clock", "se si", "세 시"),
    sentenceMcq({
      id: "ko-m12-1-q-twoclock",
      prompt: "'2 o'clock' —",
      correctHangul: "두 시",
      distractorsHangul: ["이 시", "둘 시", "두 분"],
      explanation: "Hours use native numbers in counter form: 두 시 (not 이 시, not 둘 시).",
      exercisedAtomSurfaces: ["시"],
    }),
    sentenceMcq({
      id: "ko-m12-1-q-oneclock",
      prompt: "'1 o'clock' —",
      correctHangul: "한 시",
      distractorsHangul: ["일 시", "하나 시", "한 분"],
      explanation: "1:00 = 한 시 (contracted native number + 시).",
      exercisedAtomSurfaces: ["시"],
    }),
    listeningCompSentence({
      id: "ko-m12-1-lc-threeclock",
      audioText: "세 시",
      correctMeaningEn: "3 o'clock",
      distractorsEn: ["2 o'clock", "3 minutes", "1 o'clock"],
      exercisedAtomSurfaces: ["시"],
    }),
    speaking("ko-m12-1-speak-threeclock", "세 시", "3 o'clock", ["시"]),
  ],
};

// ─── ko-m12-2 — 분 / 반 (minutes & half) ────────────────────────────────────

const M12_2: LessonContent = {
  id: "ko-m12-2",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "분 / 반 — minutes & half past",
  description: "Minutes use SINO numbers; 반 means 'half past'.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m12-2-info",
      "Sino numbers + 분",
      "Minutes flip to the SINO numbers (일/이/삼…, from M3) + 분. 삼십 분 = 30 minutes, 십 분 = 10 minutes. So 3:30 is 세 시 (native hour) 삼십 분 (Sino minutes) — two systems in one time! For :30 you can also just say 반 ('half'): 세 시 반 = 3:30.",
      "grammar",
    ),
    phrase("ko-m12-2-p-minute", "minute(s)", "bun", "분"),
    phrase("ko-m12-2-p-half", "half (past)", "ban", "반"),
    sentenceMcq({
      id: "ko-m12-2-q-thirty",
      prompt: "'30 minutes' —",
      correctHangul: "삼십 분",
      distractorsHangul: ["서른 분", "삼십 시", "세 분"],
      explanation: "Minutes use Sino numbers: 삼십 분 (not the native 서른).",
      exercisedAtomSurfaces: ["분"],
    }),
    sentenceMcq({
      id: "ko-m12-2-q-halfpastthree",
      prompt: "'3:30' (using 'half') —",
      correctHangul: "세 시 반",
      distractorsHangul: ["삼 시 반", "세 분 반", "세 시 삼"],
      explanation: "세 시 (3:00, native) + 반 (half) = 3:30.",
      exercisedAtomSurfaces: ["시", "반"],
    }),
    cloze(
      "ko-m12-2-cloze-tenmin",
      "십",
      "이에요",
      "분",
      ["분", "시", "반", "에"],
      "It's 10 minutes.",
      "십 분이에요",
      "Minutes → Sino number + 분.",
    ),
    listeningCompSentence({
      id: "ko-m12-2-lc-halfpast",
      audioText: "두 시 반",
      correctMeaningEn: "2:30 (half past two)",
      distractorsEn: ["2:00", "3:30", "12:30"],
      exercisedAtomSurfaces: ["시", "반"],
    }),
    speaking("ko-m12-2-speak-halfpastthree", "세 시 반", "half past three", ["시", "반"]),
  ],
};

// ─── ko-m12-3 — 몇 시예요? (asking the time) ────────────────────────────────

const M12_3: LessonContent = {
  id: "ko-m12-3",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "몇 시예요? — what time is it?",
  description: "Ask the time and answer with the clock.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m12-3-info",
      "몇 = how many / what number",
      "몇 means 'how many / what number'. 몇 시예요? = 'What time is it?' (literally 'what-number o'clock is it?'). 지금 몇 시예요? = 'What time is it now?'. Answer with TIME + 이에요/예요: 한 시예요 = 'It's 1 o'clock'.",
      "grammar",
    ),
    phrase("ko-m12-3-p-now", "now", "jigeum", "지금"),
    phrase("ko-m12-3-p-whattime", "What time is it?", "myeot siyeyo", "몇 시예요?"),
    sentenceMcq({
      id: "ko-m12-3-q-whattime",
      prompt: "'What time is it now?' —",
      correctHangul: "지금 몇 시예요?",
      distractorsHangul: ["지금 어디예요?", "지금 뭐예요?", "지금 몇 분이에요?"],
      explanation: "지금 (now) + 몇 시예요? (what time).",
      exercisedAtomSurfaces: ["지금", "시"],
    }),
    sentenceMcq({
      id: "ko-m12-3-q-itsone",
      prompt: "'It's 1 o'clock.' —",
      correctHangul: "한 시예요",
      distractorsHangul: ["일 시예요", "한 시에요", "한 분이에요"],
      explanation: "한 시 (1:00) + 예요 (after the vowel 시).",
      exercisedAtomSurfaces: ["시"],
    }),
    cloze(
      "ko-m12-3-cloze-whattime",
      "지금",
      "시예요?",
      "몇",
      ["몇", "뭐", "어디", "누구"],
      "What time is it now?",
      "지금 몇 시예요?",
      "몇 = 'what number' → 몇 시예요?.",
    ),
    listeningCompSentence({
      id: "ko-m12-3-lc-whattime",
      audioText: "지금 몇 시예요?",
      correctMeaningEn: "What time is it now?",
      distractorsEn: ["Where are you now?", "What is it now?", "What day is it?"],
      exercisedAtomSurfaces: ["지금", "시"],
    }),
    speaking("ko-m12-3-speak-whattime", "지금 몇 시예요?", "What time is it now?", ["지금", "시"]),
  ],
};

// ─── ko-m12-4 — Days of the week ────────────────────────────────────────────

const M12_4: LessonContent = {
  id: "ko-m12-4",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Days of the week — 요일",
  description: "Monday through Sunday, all ending in 요일.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m12-4-info",
      "Every day ends in 요일",
      "Each day of the week ends in 요일 ('day of the week'): 월요일 (Mon), 화요일 (Tue), 수요일 (Wed), 목요일 (Thu), 금요일 (Fri), 토요일 (Sat), 일요일 (Sun). The first syllable is the classic element — 월(moon), 화(fire), 수(water)… — but you can just learn them as set words.",
      "grammar",
    ),
    phrase("ko-m12-4-p-mon", "Monday", "woryoil", "월요일"),
    phrase("ko-m12-4-p-wed", "Wednesday", "suyoil", "수요일"),
    phrase("ko-m12-4-p-fri", "Friday", "geumyoil", "금요일"),
    phrase("ko-m12-4-p-sun", "Sunday", "iryoil", "일요일"),
    sentenceMcq({
      id: "ko-m12-4-q-monday",
      prompt: "Which means 'Monday'?",
      correctHangul: "월요일",
      distractorsHangul: ["일요일", "화요일", "금요일"],
      explanation: "월요일 = Monday. 일요일 = Sunday.",
      exercisedAtomSurfaces: ["월요일"],
    }),
    sentenceMcq({
      id: "ko-m12-4-q-saturday",
      prompt: "Which means 'Saturday'?",
      correctHangul: "토요일",
      distractorsHangul: ["목요일", "수요일", "월요일"],
      explanation: "토요일 = Saturday.",
      exercisedAtomSurfaces: ["토요일"],
    }),
    listeningCompSentence({
      id: "ko-m12-4-lc-friday",
      audioText: "금요일",
      correctMeaningEn: "Friday",
      distractorsEn: ["Monday", "Sunday", "Thursday"],
      exercisedAtomSurfaces: ["금요일"],
    }),
    speaking("ko-m12-4-speak-monday", "월요일", "Monday", ["월요일"]),
  ],
};

// ─── ko-m12-5 — 에 (time particle) ──────────────────────────────────────────

const M12_5: LessonContent = {
  id: "ko-m12-5",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "에 — 'at' (a time)",
  description: "Mark WHEN something happens with 에.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m12-5-info",
      "에 marks a point in time",
      "The same 에 you used for location (M6) also marks TIME: 세 시에 = 'at 3:00', 월요일에 = 'on Monday'. 세 시에 가요 = 'I go at 3:00'. (Note: 지금/오늘/어제 do NOT take 에 — they're already time-words.)",
      "grammar",
    ),
    cloze(
      "ko-m12-5-cloze-atthree",
      "세 시",
      "가요",
      "에",
      ["에", "에서", "을", "도"],
      "I go at 3:00.",
      "세 시에 가요",
      "에 marks the time of the action.",
    ),
    cloze(
      "ko-m12-5-cloze-onmonday",
      "월요일",
      "공부해요",
      "에",
      ["에", "에서", "을", "도"],
      "I study on Monday.",
      "월요일에 공부해요",
      "에 also marks the day.",
    ),
    sentenceMcq({
      id: "ko-m12-5-q-atone",
      prompt: "'I eat at 1 o'clock.' —",
      correctHangul: "한 시에 밥을 먹어요",
      distractorsHangul: ["한 시 밥을 먹어요", "한 시에서 밥을 먹어요", "한 시를 밥을 먹어요"],
      explanation: "Time of action → 에. 한 시에 먹어요.",
      exercisedAtomSurfaces: ["시", "밥", "먹어요"],
    }),
    listeningCompSentence({
      id: "ko-m12-5-lc-atthree",
      audioText: "세 시에 가요",
      correctMeaningEn: "I go at 3:00",
      distractorsEn: ["I go to 3 places", "I'm at 3:00", "I went at 3:00"],
      exercisedAtomSurfaces: ["시", "가요"],
    }),
    speaking("ko-m12-5-speak-atthree", "세 시에 가요", "I go at 3:00", ["시", "가요"]),
  ],
};

// ─── ko-m12-6 — Scheduling ──────────────────────────────────────────────────

const M12_6: LessonContent = {
  id: "ko-m12-6",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Scheduling — day + time + action",
  description: "Combine a day, a clock time, and a verb.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m12-6-info",
      "Day, then time, then action",
      "Stack them in order: 월요일에 세 시에 영화를 봐요 = 'On Monday at 3:00 I watch a movie'. In casual speech you often drop one 에, but both are correct. The verb still anchors the end.",
      "grammar",
    ),
    build(
      "ko-m12-6-build-mondaymovie",
      "Build: 'On Monday I watch a movie.' (Monday + at + movie + watch)",
      "월요일에 영화를 봐요",
      ["월요일에", "영화를", "봐요", "세 시에"],
      ["월요일에", "영화를", "봐요"],
      ["월요일", "영화", "봐요"],
    ),
    sentenceMcq({
      id: "ko-m12-6-q-atthreestudy",
      prompt: "'I study at 3:00.' —",
      correctHangul: "세 시에 공부해요",
      distractorsHangul: ["세 시 공부해요", "세 시에서 공부해요", "삼 시에 공부해요"],
      explanation: "세 시 (3:00, native) + 에 (at) + 공부해요.",
      exercisedAtomSurfaces: ["시", "공부", "해요"],
    }),
    translateStep({
      id: "ko-m12-6-tr-sundayrest",
      promptEn: "I eat at 1 o'clock.",
      acceptedAnswers: ["한 시에 밥을 먹어요", "한 시에 밥을 먹어요."],
      audioText: "한 시에 밥을 먹어요",
      exercisedAtomSurfaces: ["시", "밥", "먹어요"],
    }),
    listeningCompSentence({
      id: "ko-m12-6-lc-mondaymovie",
      audioText: "월요일에 영화를 봐요",
      correctMeaningEn: "On Monday I watch a movie",
      distractorsEn: ["On Sunday I watch a movie", "On Monday I eat", "At 3:00 I watch a movie"],
      exercisedAtomSurfaces: ["월요일", "영화", "봐요"],
    }),
    speaking("ko-m12-6-speak-atthreestudy", "세 시에 공부해요", "I study at 3:00", ["시", "공부", "해요"]),
  ],
};

// ─── ko-m12-7 — Mini-dialogue ───────────────────────────────────────────────

const M12_7: LessonContent = {
  id: "ko-m12-7",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — making plans",
  description: "Ask the time, pick a day, make a plan.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m12-7-info",
      "Planning together",
      "A: 지금 몇 시예요? (What time is it now?)\nB: 두 시예요. (It's 2 o'clock.)\nA: 금요일에 영화 보고 싶어요. (I want to watch a movie on Friday.)\nB: 좋아요! 세 시에 만나요. (Great! Let's meet at 3:00.)\nYou can run this whole plan now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m12-7-q-itstwo",
      prompt: "'It's 2 o'clock.' —",
      correctHangul: "두 시예요",
      distractorsHangul: ["이 시예요", "두 분이에요", "둘 시예요"],
      explanation: "2:00 = 두 시 (native) + 예요.",
      exercisedAtomSurfaces: ["시"],
    }),
    build(
      "ko-m12-7-build-fridaymovie",
      "Build: 'I want to watch a movie on Friday.' (Friday + at + movie + want-to-watch)",
      "금요일에 영화를 보고 싶어요",
      ["금요일에", "영화를", "보고 싶어요", "세 시에"],
      ["금요일에", "영화를", "보고 싶어요"],
      ["금요일", "영화"],
    ),
    translateStep({
      id: "ko-m12-7-tr-meetatthree",
      // NATIVE-REVIEW: 만나요 ('let's meet' / 'I meet') appears only in the info
      // card; the accepted answer set keeps it but the verb 만나다 isn't drilled
      // as its own atom — confirm it's acceptable as a recognition-only word here.
      promptEn: "Let's meet at 3:00.",
      acceptedAnswers: ["세 시에 만나요", "세 시에 만나요."],
      audioText: "세 시에 만나요",
      exercisedAtomSurfaces: ["시"],
    }),
    listeningCompSentence({
      id: "ko-m12-7-lc-whattime",
      audioText: "지금 몇 시예요?",
      correctMeaningEn: "What time is it now?",
      distractorsEn: ["What day is it?", "Where are you now?", "What do you want to do?"],
      exercisedAtomSurfaces: ["지금", "시"],
    }),
    speaking("ko-m12-7-speak-fridaymovie", "금요일에 영화를 보고 싶어요", "I want to watch a movie on Friday", ["금요일", "영화"]),
  ],
};

// ─── ko-m12-8 — Mastery test ────────────────────────────────────────────────

const M12_8: LessonContent = {
  id: "ko-m12-8",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M12 Mastery Test",
  description: "The clock, the week, and the time particle 에.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m12-8-q-twoclock",
      prompt: "'2 o'clock' —",
      correctHangul: "두 시",
      distractorsHangul: ["이 시", "둘 시", "두 분"],
      exercisedAtomSurfaces: ["시"],
    }),
    sentenceMcq({
      id: "ko-m12-8-q-thirtymin",
      prompt: "'30 minutes' —",
      correctHangul: "삼십 분",
      distractorsHangul: ["서른 분", "삼십 시", "세 분"],
      exercisedAtomSurfaces: ["분"],
    }),
    sentenceMcq({
      id: "ko-m12-8-q-monday",
      prompt: "Which means 'Monday'?",
      correctHangul: "월요일",
      distractorsHangul: ["일요일", "금요일", "수요일"],
      exercisedAtomSurfaces: ["월요일"],
    }),
    cloze(
      "ko-m12-8-cloze-atthree",
      "세 시",
      "가요",
      "에",
      ["에", "에서", "을", "도"],
      "I go at 3:00.",
      "세 시에 가요",
      "Time of action → 에.",
    ),
    sentenceMcq({
      id: "ko-m12-8-q-whattime",
      prompt: "'What time is it now?' —",
      correctHangul: "지금 몇 시예요?",
      distractorsHangul: ["지금 어디예요?", "지금 뭐예요?", "지금 몇 분이에요?"],
      exercisedAtomSurfaces: ["지금", "시"],
    }),
    listeningCompSentence({
      id: "ko-m12-8-lc-mondaymovie",
      audioText: "월요일에 영화를 봐요",
      correctMeaningEn: "On Monday I watch a movie",
      distractorsEn: ["On Sunday I watch a movie", "At 3:00 I watch a movie", "On Monday I eat"],
      exercisedAtomSurfaces: ["월요일", "영화", "봐요"],
    }),
    speaking("ko-m12-8-speak-recap", "세 시에 가요", "I go at 3:00", ["시", "가요"]),
  ],
};

export const KO_M12_LESSONS: LessonContent[] = [
  M12_1,
  M12_2,
  M12_3,
  M12_4,
  M12_5,
  M12_6,
  M12_7,
  M12_8,
];
