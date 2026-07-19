/**
 * Korean Module 3 — First phrases.
 *
 * M1/M2 taught the script (Hangul) with minimal vocab. M3 is where real
 * language starts, now that the learner can actually read 안녕하세요. The
 * grammar spine mirrors the placement-bank M3 items (placementBank.ts):
 *
 *   ko-m3-1  Greetings — 안녕하세요 + 안녕히 가세요/계세요 + 안녕 (casual)
 *   ko-m3-2  Formality — formal (합니다) vs polite (해요) register
 *   ko-m3-3  이에요 / 예요 — the polite copula (consonant vs vowel ending)
 *   ko-m3-4  저는 X 이에요 — introducing yourself
 *   ko-m3-5  Asking names — 이름이 뭐예요?
 *   ko-m3-6  Numbers 1–10 (Sino-Korean)
 *   ko-m3-7  Mini-dialogue — meeting someone
 *   ko-m3-8  M3 Mastery Test
 *
 * Authoring follows the JA M3+ rubric (docs/lesson-authoring-guide.md §13):
 * teach steps (info / phrase_card) NEVER carry SRS weight; only the graded
 * factories (sentenceMcq / cloze / build / listening / speaking) do. The
 * `shouldWriteSrs` gate enforces this even if a teach step leaks an atom.
 *
 * Atom resolution is by Hangul surface via the KO grammarHelpers — the M3
 * vocab atoms live in courseAtoms.ts (M3_VOCAB).
 *
 * CONTENT-TODO: a Korean speaker should review register consistency
 * (해요 vs 합니다 mixing) and naturalness of the mini-dialogue before this
 * ships to learners. The grammar sequencing matches the placement spine.
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
  vocabMcq,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// Shared distractor pool for vocab-image MCQs. CRITICAL: only use surfaces
// whose emoji art is present in the local Noto subset (src/pub/noto-emoji/svg)
// — missing files render as broken images. The set below is verified against
// the bundled subset. Student/teacher (🧑‍🎓/🧑‍🏫) art is NOT bundled, so M3
// teaches those via phrase cards + text MCQs rather than image MCQs.
const MCQ_POOL = [
  { surface: "친구", emoji: "👫" },
  { surface: "어머니", emoji: "👩" },
  { surface: "커피", emoji: "☕" },
  { surface: "차", emoji: "🚗" },
  { surface: "나무", emoji: "🌳" },
  { surface: "교실", emoji: "🏫" },
  { surface: "바다", emoji: "🌊" },
  { surface: "지도", emoji: "🗺️" },
];

// ─── ko-m3-1 — Greetings ───────────────────────────────────────────────────

const M3_1: LessonContent = {
  id: "ko-m3-1",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Greetings — 안녕하세요",
  description: "Your first real Korean: hello, goodbye, and the casual 안녕.",
  estimatedMinutes: 5,
  xpReward: 10,
  steps: [
    infoStep(
      "ko-m3-1-info",
      "안녕하세요 — the all-purpose hello",
      "안녕하세요 (annyeonghaseyo) works any time of day, to anyone. It literally means 'are you at peace?' — but you just use it like 'hello'. It's polite and safe everywhere: shops, work, meeting friends' parents.",
      "culture",
    ),
    phrase("ko-m3-1-p-hello", "hello (polite)", "annyeonghaseyo", "안녕하세요"),
    phrase("ko-m3-1-p-casual", "hi / bye (casual)", "annyeong", "안녕", "Drop the ending with close friends — 안녕 alone is casual 'hi' AND 'bye'."),
    phrase("ko-m3-1-p-bye-go", "goodbye (to someone leaving)", "annyeonghi gaseyo", "안녕히 가세요"),
    phrase("ko-m3-1-p-bye-stay", "goodbye (to someone staying)", "annyeonghi gyeseyo", "안녕히 계세요", "Korean splits 'goodbye' by who moves: 가세요 (go in peace) to the leaver, 계세요 (stay in peace) to the stayer."),
    vocabMcq("ko-m3-1-mcq-friend", { surface: "친구", meaningEn: "friend", emoji: "👫" }, MCQ_POOL),
    listeningCompSentence({
      id: "ko-m3-1-lc-hello",
      audioText: "안녕하세요",
      correctMeaningEn: "hello",
      distractorsEn: ["thank you", "goodbye", "I'm sorry"],
    }),
    sentenceMcq({
      id: "ko-m3-1-q-leaver",
      prompt: "Your friend is leaving the room. What do you say?",
      correctHangul: "안녕히 가세요",
      distractorsHangul: ["안녕히 계세요", "안녕하세요", "반갑습니다"],
      explanation: "가세요 = 'go in peace' — said to the person who leaves.",
    }),
    speaking("ko-m3-1-speak-hello", "안녕하세요", "hello"),
  ],
};

// ─── ko-m3-2 — Formality ───────────────────────────────────────────────────

const M3_2: LessonContent = {
  id: "ko-m3-2",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Formality — formal vs. polite",
  description: "Korean has speech levels. Meet the two you'll use most.",
  estimatedMinutes: 5,
  xpReward: 10,
  steps: [
    infoStep(
      "ko-m3-2-info-1",
      "Korean changes by who you talk to",
      "Korean verbs end differently depending on respect level. As a learner you need just two: the POLITE 해요-style (everyday, friendly-respectful) and the FORMAL 합니다-style (announcements, first meetings, service). Both are safe with strangers — formal is just a notch stiffer.",
      "grammar",
    ),
    infoStep(
      "ko-m3-2-info-2",
      "Same meaning, two endings",
      "'Thank you' is 고마워요 (polite) or 감사합니다 (formal). 'Nice to meet you' is 반갑습니다 (formal) — common at first meetings. You'll learn the 이에요/예요 polite copula next; 합니다 forms show up in set phrases like 반갑습니다.",
      "tip",
    ),
    phrase("ko-m3-2-p-thanks-formal", "thank you (formal)", "gamsahamnida", "감사합니다"),
    phrase("ko-m3-2-p-thanks-polite", "thanks (polite)", "gomawoyo", "고마워요"),
    phrase("ko-m3-2-p-nice", "nice to meet you", "bangapseumnida", "반갑습니다"),
    listeningCompSentence({
      id: "ko-m3-2-lc-nice",
      audioText: "반갑습니다",
      correctMeaningEn: "nice to meet you",
      distractorsEn: ["goodbye", "thank you", "yes"],
    }),
    sentenceMcq({
      id: "ko-m3-2-q-firstmeet",
      prompt: "You're meeting someone for the first time. Which fits best?",
      correctHangul: "반갑습니다",
      distractorsHangul: ["안녕히 계세요", "얼마예요?", "괜찮아요"],
      explanation: "반갑습니다 — 'nice to meet you', the classic first-meeting phrase.",
    }),
    speaking("ko-m3-2-speak-nice", "반갑습니다", "nice to meet you"),
  ],
};

// ─── ko-m3-3 — 이에요 / 예요 copula ─────────────────────────────────────────

const M3_3: LessonContent = {
  id: "ko-m3-3",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "이에요 / 예요 — the copula",
  description: "How to say 'X is Y' — the most useful pattern in beginner Korean.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m3-3-info-1",
      "이에요 / 예요 = 'it is'",
      "To say 'it is X' you put 이에요 or 예요 right after the word. 학생이에요 = '(I) am a student'. 친구예요 = '(it's a) friend'. No separate word for 'am/is/are' — it attaches to the noun.",
      "grammar",
    ),
    infoStep(
      "ko-m3-3-info-2",
      "Which one? Listen to the last letter",
      "If the word ends in a CONSONANT → 이에요 (학생 ends in ㅇ → 학생이에요). If it ends in a VOWEL → 예요 (친구 ends in ㅜ → 친구예요). Say them out loud — 예요 just glides on smoother after a vowel.",
      "tip",
    ),
    phrase("ko-m3-3-p-student", "(I) am a student", "haksaeng-ieyo", "학생이에요"),
    phrase("ko-m3-3-p-friend", "(it's a) friend", "chingu-yeyo", "친구예요"),
    sentenceMcq({
      id: "ko-m3-3-q-consonant",
      prompt: "선생님 ('teacher') ends in a consonant. How do you say '(I) am a teacher'?",
      correctHangul: "선생님이에요",
      distractorsHangul: ["선생님예요", "선생님이예요", "선생님에요"],
      explanation: "Consonant ending → 이에요. 선생님 + 이에요.",
      exercisedAtomSurfaces: ["선생님", "이에요"],
    }),
    sentenceMcq({
      id: "ko-m3-3-q-vowel",
      prompt: "친구 ('friend') ends in a vowel. How do you say 'it's a friend'?",
      correctHangul: "친구예요",
      distractorsHangul: ["친구이에요", "친구이예요", "친구에요"],
      explanation: "Vowel ending → 예요. 친구 + 예요.",
      exercisedAtomSurfaces: ["친구", "예요"],
    }),
    listeningCompSentence({
      id: "ko-m3-3-lc-student",
      audioText: "학생이에요",
      correctMeaningEn: "(I) am a student",
      distractorsEn: ["(I) am a teacher", "it's a friend", "what is it?"],
      exercisedAtomSurfaces: ["학생"],
    }),
    speaking("ko-m3-3-speak-student", "학생이에요", "I am a student"),
  ],
};

// ─── ko-m3-4 — 저는 X 이에요 (introducing yourself) ─────────────────────────

const M3_4: LessonContent = {
  id: "ko-m3-4",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "저는 X 이에요 — introducing yourself",
  description: "Put 저 (I) + 는 (topic) + copula together to introduce yourself.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m3-4-info-1",
      "저 = I (polite)",
      "저 (jeo) is the humble 'I' you use with strangers and elders. (There's a casual 나, but lead with 저 to be safe.) Mark it as the topic with 는: 저는… = 'As for me…'.",
      "grammar",
    ),
    infoStep(
      "ko-m3-4-info-2",
      "The full pattern: 저는 [name/role] 이에요/예요",
      "저는 학생이에요 = 'I am a student'. 저는 민수예요 = 'I am Minsu' (민수 ends in a vowel → 예요). Same copula rule as before — just with 저는 in front.",
      "tip",
    ),
    phrase("ko-m3-4-p-me", "I / me (polite)", "jeo", "저"),
    build(
      "ko-m3-4-build-student",
      "Build: 'I am a student.'",
      "저는 학생이에요",
      ["저는", "학생", "이에요", "친구", "예요"],
      ["저는", "학생", "이에요"],
      ["저", "학생", "이에요"],
    ),
    sentenceMcq({
      id: "ko-m3-4-q-name-vowel",
      prompt: "Your name is 민수 (ends in a vowel). 'I am Minsu' is…",
      correctHangul: "저는 민수예요",
      distractorsHangul: ["저는 민수이에요", "저가 민수예요", "저는 민수에요"],
      explanation: "Topic 저는 + name + vowel-ending copula 예요.",
      exercisedAtomSurfaces: ["저", "예요"],
    }),
    translateStep({
      id: "ko-m3-4-tr-teacher",
      promptEn: "I am a teacher. (polite)",
      acceptedAnswers: ["저는 선생님이에요", "저는 선생님이에요."],
      audioText: "저는 선생님이에요",
      exercisedAtomSurfaces: ["저", "선생님", "이에요"],
    }),
    speaking("ko-m3-4-speak-intro", "저는 학생이에요", "I am a student"),
  ],
};

// ─── ko-m3-4b — 은/는 the topic marker ──────────────────────────────────────
// The topic particle is the single most common word in Korean and is used
// from 저는 onward, but was never taught explicitly (the 은/는-vs-이/가 contrast
// only surfaced at M19). This lesson introduces it right where 저는 first
// appears, so learners can actually read (2026-07-19).

const M3_4B: LessonContent = {
  id: "ko-m3-4b",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "은 / 는 — the topic marker",
  description: "Mark what you're talking about — 은 after a consonant, 는 after a vowel.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m3-4b-info-1",
      "은 / 는 — 'as for …'",
      "은/는 marks the TOPIC — what a sentence is about, like 'as for …'. You just used it in 저는 ('as for me'). It's the most common particle in Korean, so you can't read a sentence without it. The choice is purely by sound: 은 after a consonant, 는 after a vowel.",
      "grammar",
    ),
    infoStep(
      "ko-m3-4b-info-2",
      "Consonant → 은 · Vowel → 는",
      "Look at the LAST letter of the word. 저 ends in a vowel → 저는. 선생님 ends in a consonant (ㅁ) → 선생님은. 이름 ends in a consonant → 이름은. Same idea every time.",
      "tip",
    ),
    phrase("ko-m3-4b-p-topic", "as for me", "jeoneun", "저는"),
    cloze(
      "ko-m3-4b-cloze-vowel",
      "저",
      "학생이에요",
      "는",
      ["는", "은", "가", "를"],
      "As for me, I'm a student.",
      "저는 학생이에요",
      "저 ends in a vowel → 는.",
    ),
    cloze(
      "ko-m3-4b-cloze-consonant",
      "선생님",
      "친구예요",
      "은",
      ["은", "는", "이", "를"],
      "As for the teacher, (she's my) friend.",
      "선생님은 친구예요",
      "선생님 ends in a consonant → 은.",
    ),
    sentenceMcq({
      id: "ko-m3-4b-q-topic",
      prompt: "저 ends in a vowel. Pick the correct topic marking for 'I'm a student.'",
      correctHangul: "저는 학생이에요",
      distractorsHangul: ["저은 학생이에요", "저가 학생이에요", "저를 학생이에요"],
      explanation: "저 (vowel) → 는. 은 is for consonant-final words.",
      exercisedAtomSurfaces: ["저", "학생"],
    }),
    speaking("ko-m3-4b-speak-topic", "저는 학생이에요", "I'm a student"),
  ],
};

// ─── ko-m3-5 — Asking names ─────────────────────────────────────────────────

const M3_5: LessonContent = {
  id: "ko-m3-5",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Asking names — 이름이 뭐예요?",
  description: "Ask someone's name and answer back.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "ko-m3-5-info",
      "이름이 뭐예요? = What's your name?",
      "이름 = 'name', 뭐 = 'what'. 이 marks 이름 as the subject. Literally: 'Name is what?' → 이름이 뭐예요? You answer with 제 이름은 [name]이에요 or just [name]이에요/예요.",
      "grammar",
    ),
    phrase("ko-m3-5-p-name", "name", "ireum", "이름"),
    phrase("ko-m3-5-p-what", "what", "mwo", "뭐"),
    cloze(
      "ko-m3-5-cloze-subject",
      "이름",
      "뭐예요?",
      "이",
      ["이", "은", "를", "에"],
      "What is your name?",
      "이름이 뭐예요?",
      "이 marks 이름 as the subject (it ends in a consonant → 이, not 가).",
    ),
    sentenceMcq({
      id: "ko-m3-5-q-ask",
      prompt: "How do you ask 'What is your name?' politely?",
      correctHangul: "이름이 뭐예요?",
      distractorsHangul: ["이름이 누구예요?", "이름은 뭐 입니다?", "뭐가 이름이에요?"],
      explanation: "이름이 뭐예요? — 뭐 (what) for things; 누구 (who) would be wrong here.",
      exercisedAtomSurfaces: ["이름", "뭐"],
    }),
    listeningCompSentence({
      id: "ko-m3-5-lc-ask",
      audioText: "이름이 뭐예요?",
      correctMeaningEn: "What is your name?",
      distractorsEn: ["Who are you?", "How are you?", "Where are you?"],
      exercisedAtomSurfaces: ["이름"],
    }),
    speaking("ko-m3-5-speak-ask", "이름이 뭐예요?", "What is your name?"),
  ],
};

// ─── ko-m3-6 — Sino-Korean numbers 1–10 ─────────────────────────────────────

const M3_6: LessonContent = {
  id: "ko-m3-6",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Numbers 1–10 (Sino-Korean)",
  description: "The Sino-Korean number set — used for dates, money, and phone numbers.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "ko-m3-6-info",
      "Korea has two number systems",
      "This is the SINO-KOREAN set (from Chinese): 일 이 삼 사 오 육 칠 팔 구 십. You'll use it for dates, money, minutes, and phone numbers. (There's also a native set — hana, dul, set — for counting things and age; that comes later.)",
      "culture",
    ),
    phrase("ko-m3-6-p-1", "one (1)", "il", "일", undefined, { emoji: "1️⃣" }),
    phrase("ko-m3-6-p-3", "three (3)", "sam", "삼", undefined, { emoji: "3️⃣" }),
    phrase("ko-m3-6-p-6", "six (6)", "yuk", "육", undefined, { emoji: "6️⃣" }),
    phrase("ko-m3-6-p-10", "ten (10)", "sip", "십", undefined, { emoji: "🔟" }),
    sentenceMcq({
      id: "ko-m3-6-q-three",
      prompt: "Which is 'three' (Sino-Korean)?",
      correctHangul: "삼",
      distractorsHangul: ["사", "이", "오"],
      explanation: "삼 = 3. 사 = 4, 이 = 2, 오 = 5.",
      exercisedAtomSurfaces: ["삼"],
    }),
    sentenceMcq({
      id: "ko-m3-6-q-seven",
      prompt: "Which is 'seven' (Sino-Korean)?",
      correctHangul: "칠",
      distractorsHangul: ["팔", "육", "구"],
      explanation: "칠 = 7. 팔 = 8, 육 = 6, 구 = 9.",
      exercisedAtomSurfaces: ["칠"],
    }),
    listeningCompSentence({
      id: "ko-m3-6-lc-ten",
      audioText: "십",
      correctMeaningEn: "ten",
      distractorsEn: ["one", "six", "four"],
      exercisedAtomSurfaces: ["십"],
    }),
    speaking("ko-m3-6-speak-count", "일 이 삼", "one two three"),
  ],
};

// ─── ko-m3-7 — Mini-dialogue ────────────────────────────────────────────────

const M3_7: LessonContent = {
  id: "ko-m3-7",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — meeting someone",
  description: "Put it together: greet, introduce yourself, ask a name.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m3-7-info",
      "A first meeting, start to finish",
      "A: 안녕하세요! 저는 민수예요. (Hello! I'm Minsu.)\nB: 안녕하세요. 이름이 뭐예요? (Hello. What's your name?)\nA: … 반갑습니다! (Nice to meet you!)\nYou can run this whole exchange now.",
      "default",
    ),
    build(
      "ko-m3-7-build-intro",
      "Build: 'Hello! I'm Minsu.'",
      "안녕하세요 저는 민수예요",
      ["안녕하세요", "저는", "민수", "예요", "이에요"],
      ["안녕하세요", "저는", "민수", "예요"],
      ["저", "예요"],
    ),
    sentenceMcq({
      id: "ko-m3-7-q-reply",
      prompt: "Someone says 이름이 뭐예요? — they are asking…",
      correctHangul: "이름이 뭐예요?",
      distractorsHangul: ["저는 학생이에요", "반갑습니다", "안녕히 가세요"],
      explanation: "이름이 뭐예요? = 'What is your name?' — the question you'd answer with your name.",
      exercisedAtomSurfaces: ["이름", "뭐"],
    }),
    translateStep({
      id: "ko-m3-7-tr-nice",
      promptEn: "Nice to meet you!",
      acceptedAnswers: ["반갑습니다", "반갑습니다!"],
      audioText: "반갑습니다",
    }),
    listeningCompSentence({
      id: "ko-m3-7-lc-intro",
      audioText: "저는 학생이에요",
      correctMeaningEn: "I am a student",
      distractorsEn: ["What is your name?", "Nice to meet you", "I am a teacher"],
      exercisedAtomSurfaces: ["저", "학생"],
    }),
    speaking("ko-m3-7-speak-full", "안녕하세요 저는 학생이에요", "Hello, I am a student"),
  ],
};

// ─── ko-m3-8 — Mastery test ─────────────────────────────────────────────────

const M3_8: LessonContent = {
  id: "ko-m3-8",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M3 Mastery Test",
  description: "Prove you've got greetings, the copula, names, and numbers.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "ko-m3-8-q-hello",
      prompt: "'Hello' (polite, all-purpose) —",
      correctHangul: "안녕하세요",
      distractorsHangul: ["안녕히 가세요", "감사합니다", "괜찮아요"],
    }),
    sentenceMcq({
      id: "ko-m3-8-q-copula",
      prompt: "학생 ends in a consonant. '(I) am a student' is…",
      correctHangul: "학생이에요",
      distractorsHangul: ["학생예요", "학생이예요", "학생에요"],
      exercisedAtomSurfaces: ["학생", "이에요"],
    }),
    sentenceMcq({
      id: "ko-m3-8-q-intro",
      prompt: "'I am a teacher.' (polite) —",
      correctHangul: "저는 선생님이에요",
      distractorsHangul: ["저가 선생님이에요", "저는 선생님예요", "저는 선생님을 이에요"],
      exercisedAtomSurfaces: ["저", "선생님", "이에요"],
    }),
    sentenceMcq({
      id: "ko-m3-8-q-ask",
      prompt: "'What is your name?' —",
      correctHangul: "이름이 뭐예요?",
      distractorsHangul: ["이름이 누구예요?", "이름은 뭐 입니다?", "이름이 뭐이에요?"],
      exercisedAtomSurfaces: ["이름", "뭐"],
    }),
    sentenceMcq({
      id: "ko-m3-8-q-number",
      prompt: "Which is 'three' (Sino-Korean)?",
      correctHangul: "삼",
      distractorsHangul: ["셋", "이", "사"],
      exercisedAtomSurfaces: ["삼"],
    }),
    listeningCompSentence({
      id: "ko-m3-8-lc-name",
      audioText: "이름이 뭐예요?",
      correctMeaningEn: "What is your name?",
      distractorsEn: ["Nice to meet you", "I am a student", "Goodbye"],
      exercisedAtomSurfaces: ["이름"],
    }),
    speaking("ko-m3-8-speak-recap", "저는 학생이에요", "I am a student"),
  ],
};

export const KO_M3_LESSONS: LessonContent[] = [
  M3_1,
  M3_2,
  M3_3,
  M3_4,
  M3_4B,
  M3_5,
  M3_6,
  M3_7,
  M3_8,
];
