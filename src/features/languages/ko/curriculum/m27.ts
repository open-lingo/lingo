/**
 * Korean Module 27 — Modal grammar (must / should / become).
 *
 * KO analog of JA M27 (なければならない must + ほうがいい should + く/に
 * なる become). Re-expressed in Korean's own grammar:
 *
 *   ko-m27-1  Modal vocab — 결정하다 / 약속 / 준비 / 연습 / 시험
 *   ko-m27-2  Health vocab — 건강 / 조심하다 (+ reuse 병원 / 약 / 운동)
 *   ko-m27-3  아/어야 되다 — must / have to (obligation)
 *   ko-m27-4  는 게 좋다 — it's better to / should (advice)
 *   ko-m27-5  아/어지다 — become (gradual change of state)
 *   ko-m27-6  이/가 되다 — become (a noun) + putting it together
 *   ko-m27-7  Mini-dialogue — giving advice
 *   ko-m27-8  M27 Mastery Test (also completes KO module parity, M1-M27)
 *
 * Korean facts taught (not bugs):
 *   - 아/어야 되다 (= 아/어야 하다) = 'must / have to (do)' — obligation.
 *     Stem + 아/어야 + 되다: 가야 돼요 ('I have to go'); 먹어야 돼요;
 *     공부해야 돼요. After a bright vowel (ㅏ/ㅗ) → 아야; else → 어야; 하다 →
 *     해야. 되다 and 하다 are interchangeable here (돼요 ~ 해요). (KO match
 *     to JA なければならない.)
 *   - 는 게 좋다 = 'it's better to / you should (do)' — advice. Verb stem +
 *     는 게 좋다 (는 것이 좋다 contracted): 운동하는 게 좋아요 ('you should
 *     exercise'); 약을 먹는 게 좋아요. For a NEGATIVE recommendation use 안 …
 *     는 게 좋아요. (KO match to JA ほうがいい.) Past advice ('should have')
 *     is a separate pattern, not taught here.
 *   - 아/어지다 = 'become / get (gradually)' — change of state on an
 *     ADJECTIVE: 좋다 → 좋아져요 ('it gets better'); 건강해지다 → 건강해져요
 *     ('become healthy'). After a bright vowel → 아지다; else → 어지다; 하다
 *     adjectives → 해지다. (KO match to JA 〜くなる / 〜になる for adjectives.)
 *   - 이/가 되다 = 'become (a NOUN)' — the noun takes 이/가, then 되다:
 *     의사가 되다 ('become a doctor'); 선생님이 되다. After a consonant → 이
 *     (선생님이); after a vowel → 가 (의사가). (KO match to JA 〜になる for
 *     nouns.) Contrast with 아/어지다 which works on adjectives.
 *
 * Vocab: 결정하다 (decide), 약속 (promise), 준비 (preparation), 연습
 *   (practice), 시험 (exam), 건강 (health), 조심하다 (be careful). Reuses
 *   병원 (M6), 약 (M20), 운동 (M13), 의사/선생님 (earlier), 좋다 (earlier).
 *   NATIVE-REVIEW flags inline.
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

// ─── ko-m27-1 — Modal vocab ─────────────────────────────────────────────────

const M27_1: LessonContent = {
  id: "ko-m27-1",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Goals — 결정하다, 약속, 준비, 연습, 시험",
  description: "Decide, promise, preparation, practice, exam.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m27-1-info",
      "Words for goals and commitments",
      "결정하다 = 'decide' (결정했어요 'I decided'). 약속 = 'a promise / appointment' (약속이 있어요 'I have an appointment'). 준비 = 'preparation' (준비해요 'I prepare'). 연습 = 'practice' (연습해요 'I practice'). 시험 = 'an exam' (시험이 있어요 'I have an exam'). 약속/준비/연습 all pair with 하다.",
      "default",
    ),
    phrase("ko-m27-1-p-decide", "decide", "gyeoljeonghada", "결정하다", undefined, { emoji: "✅" }),
    phrase("ko-m27-1-p-promise", "promise / appointment", "yaksok", "약속", undefined, { emoji: "🤝" }),
    phrase("ko-m27-1-p-prep", "preparation", "junbi", "준비", undefined, { emoji: "🎒" }),
    phrase("ko-m27-1-p-practice", "practice", "yeonseup", "연습", undefined, { emoji: "🔁" }),
    phrase("ko-m27-1-p-exam", "exam", "siheom", "시험", undefined, { emoji: "📝" }),
    sentenceMcq({
      id: "ko-m27-1-q-exam",
      prompt: "Which means 'exam'?",
      correctHangul: "시험",
      distractorsHangul: ["약속", "준비", "연습"],
      explanation: "시험 = exam.",
      exercisedAtomSurfaces: ["시험"],
    }),
    sentenceMcq({
      id: "ko-m27-1-q-practice",
      prompt: "'I practice.' —",
      correctHangul: "연습해요",
      distractorsHangul: ["준비해요", "결정했어요", "약속해요"],
      // NATIVE-REVIEW: 연습하다 → 연습해요 ('I practice'). Confirm.
      explanation: "연습 + 해요 = 'I practice'. 준비해요 = 'I prepare'.",
      exercisedAtomSurfaces: ["연습"],
    }),
    listeningCompSentence({
      id: "ko-m27-1-lc-promise",
      audioText: "약속이 있어요",
      correctMeaningEn: "I have an appointment / promise",
      distractorsEn: ["I have an exam", "I'm preparing", "I decided"],
      exercisedAtomSurfaces: ["약속"],
    }),
    speaking("ko-m27-1-speak-decide", "결정했어요", "I decided", ["결정하다"]),
  ],
};

// ─── ko-m27-2 — Health vocab ────────────────────────────────────────────────

const M27_2: LessonContent = {
  id: "ko-m27-2",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Health — 건강, 조심하다 (+ 병원, 약, 운동)",
  description: "Health, be careful — plus hospital, medicine, exercise.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m27-2-info",
      "Talking about health",
      "건강 = 'health' (건강이 좋아요 'my health is good'); 건강하다 = 'be healthy'. 조심하다 = 'be careful' (조심하세요 'be careful / take care'). You already know 병원 (hospital), 약 (medicine), 운동 (exercise) — they all come back here for health advice.",
      "default",
    ),
    phrase("ko-m27-2-p-health", "health", "geongang", "건강", undefined, { emoji: "💪" }),
    phrase("ko-m27-2-p-careful", "be careful", "josimhada", "조심하다", undefined, { emoji: "⚠️" }),
    sentenceMcq({
      id: "ko-m27-2-q-health",
      prompt: "Which means 'health'?",
      correctHangul: "건강",
      distractorsHangul: ["병원", "약", "운동"],
      explanation: "건강 = health. 병원 = hospital; 약 = medicine; 운동 = exercise.",
      exercisedAtomSurfaces: ["건강"],
    }),
    sentenceMcq({
      id: "ko-m27-2-q-careful",
      prompt: "'Be careful / take care.' —",
      correctHangul: "조심하세요",
      distractorsHangul: ["조심해요보다", "조심하거든요", "조심할까요"],
      // NATIVE-REVIEW: 조심하다 → 조심하세요 (polite command 'be careful').
      // This is the standard parting phrase. Confirm.
      explanation: "조심하세요 = polite 'be careful / take care'.",
      exercisedAtomSurfaces: ["조심하다"],
    }),
    listeningCompSentence({
      id: "ko-m27-2-lc-exercise",
      audioText: "운동을 해요",
      correctMeaningEn: "I exercise",
      distractorsEn: ["I take medicine", "I go to the hospital", "I'm healthy"],
      exercisedAtomSurfaces: ["운동"],
    }),
    speaking("ko-m27-2-speak-careful", "조심하세요", "Be careful", ["조심하다"]),
  ],
};

// ─── ko-m27-3 — 아/어야 되다 (must) ──────────────────────────────────────────

const M27_3: LessonContent = {
  id: "ko-m27-3",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아/어야 되다 — must / have to",
  description: "Express obligation: you have to do something.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m27-3-info",
      "아/어야 돼요 — 'I have to …'",
      "아/어야 되다 = 'must / have to (do)'. Stem + 아/어야 + 되다: 가야 돼요 ('I have to go'); 먹어야 돼요; 공부해야 돼요. After a bright vowel (ㅏ/ㅗ) → 아야; otherwise → 어야; 하다 → 해야. 되다 and 하다 are interchangeable here (돼요 ~ 해요). (KO match to JA なければならない.)",
      "grammar",
    ),
    phrase("ko-m27-3-p-musta", "must (bright vowel)", "-aya dwaeyo", "아야 돼요"),
    phrase("ko-m27-3-p-musteo", "must (other)", "-eoya dwaeyo", "어야 돼요"),
    sentenceMcq({
      id: "ko-m27-3-q-mustgo",
      prompt: "'I have to go now.' —",
      correctHangul: "지금 가야 돼요",
      distractorsHangul: ["지금 가어야 돼요", "지금 가는 게 좋아요", "지금 가야 돼요보다"],
      // NATIVE-REVIEW: 가다 (bright ㅏ) → 가야 돼요 (NOT 가어야). Confirm
      // 지금 가야 돼요 reads as 'I have to go now'.
      explanation: "가다 → 가야 돼요 (bright vowel → 아야). 가어야 is wrong.",
      exercisedAtomSurfaces: ["약속"],
    }),
    cloze(
      "ko-m27-3-cloze-muststudy",
      "시험이 있어서 공부",
      "돼요",
      "해야",
      ["해야", "아야", "어야", "는 게"],
      "I have an exam, so I have to study.",
      "시험이 있어서 공부해야 돼요",
      "하다 → 해야 돼요. 공부하다 → 공부해야 돼요.",
    ),
    sentenceMcq({
      id: "ko-m27-3-q-musttakemedicine",
      prompt: "'I have to take medicine.' —",
      correctHangul: "약을 먹어야 돼요",
      distractorsHangul: ["약을 먹어야 돼요보다", "약을 먹아야 돼요", "약을 먹는 게 좋아요"],
      // NATIVE-REVIEW: 먹다 (dark vowel ㅓ) → 먹어야 돼요 (NOT 먹아야).
      // 약을 먹다 = 'take medicine'. Confirm 약을 먹어야 돼요 is natural.
      explanation: "먹다 → 먹어야 돼요 (dark vowel → 어야). 먹는 게 좋아요 = 'should' (advice), not 'must'.",
      exercisedAtomSurfaces: ["약"],
    }),
    listeningCompSentence({
      id: "ko-m27-3-lc-mustgo",
      audioText: "약속이 있어서 지금 가야 돼요",
      correctMeaningEn: "I have an appointment, so I have to go now",
      distractorsEn: ["I have an appointment, but I'll stay", "I should go to the appointment", "I went to the appointment"],
      exercisedAtomSurfaces: ["약속"],
    }),
    speaking("ko-m27-3-speak-mustgo", "지금 가야 돼요", "I have to go now", []),
  ],
};

// ─── ko-m27-4 — 는 게 좋다 (should / better to) ──────────────────────────────

const M27_4: LessonContent = {
  id: "ko-m27-4",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "는 게 좋다 — it's better to / should",
  description: "Give advice: you should do something.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m27-4-info",
      "는 게 좋아요 — 'you should …'",
      "는 게 좋다 = 'it's better to / you should (do)' — advice. Verb stem + 는 게 좋다 (from 는 것이 좋다): 운동하는 게 좋아요 ('you should exercise'); 약을 먹는 게 좋아요. For a negative recommendation: 안 … 는 게 좋아요 ('it's better not to …'). (KO match to JA ほうがいい.)",
      "grammar",
    ),
    phrase("ko-m27-4-p-better", "it's better to / should", "-neun ge joayo", "는 게 좋아요"),
    sentenceMcq({
      id: "ko-m27-4-q-shouldexercise",
      prompt: "'You should exercise.' —",
      correctHangul: "운동하는 게 좋아요",
      distractorsHangul: ["운동하야 돼요", "운동한 게 좋아요", "운동하는 게 좋아요보다"],
      // NATIVE-REVIEW: 운동하다 → 운동하는 게 좋아요 (present modifier 하는 +
      // 게 좋아요). Confirm reads as 'you should/it's better to exercise'.
      explanation: "운동하다 → 운동하는 게 좋아요. 한 게 (past modifier) doesn't fit advice.",
      exercisedAtomSurfaces: ["운동"],
    }),
    cloze(
      "ko-m27-4-cloze-shouldrest",
      "피곤하면 쉬",
      "좋아요",
      "는 게",
      ["는 게", "아야", "거든요", "려고"],
      "If you're tired, you should rest.",
      "피곤하면 쉬는 게 좋아요",
      "쉬다 → 쉬는 게 좋아요 ('it's better to rest').",
    ),
    sentenceMcq({
      id: "ko-m27-4-q-shouldtakemedicine",
      prompt: "'You should take medicine.' —",
      correctHangul: "약을 먹는 게 좋아요",
      distractorsHangul: ["약을 먹어야 돼요", "약을 먹은 게 좋아요", "약을 먹는 게 좋아요보다"],
      // NATIVE-REVIEW: 먹다 → 먹는 게 좋아요 (present modifier 먹는). The 먹어야
      // 돼요 distractor means 'must' (stronger). Confirm 먹는 게 좋아요 is natural.
      explanation: "먹다 → 먹는 게 좋아요 (advice). 먹어야 돼요 = 'must' (obligation).",
      exercisedAtomSurfaces: ["약"],
    }),
    listeningCompSentence({
      id: "ko-m27-4-lc-shouldexercise",
      audioText: "건강을 위해서 운동하는 게 좋아요",
      correctMeaningEn: "For your health, you should exercise",
      distractorsEn: ["For your health, you must not exercise", "You exercised for your health", "You want to exercise for health"],
      exercisedAtomSurfaces: ["건강", "운동"],
    }),
    speaking("ko-m27-4-speak-shouldexercise", "운동하는 게 좋아요", "You should exercise", ["운동"]),
  ],
};

// ─── ko-m27-5 — 아/어지다 (become — adjective) ───────────────────────────────

const M27_5: LessonContent = {
  id: "ko-m27-5",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아/어지다 — become (gradually)",
  description: "Describe a change of state.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m27-5-info",
      "아/어지다 — 'get / become'",
      "아/어지다 = 'become / get (gradually)' — a change of state on an ADJECTIVE: 좋다 → 좋아져요 ('it gets better'); 건강하다 → 건강해져요 ('become healthy'). After a bright vowel (ㅏ/ㅗ) → 아지다; otherwise → 어지다; 하다 adjectives → 해지다. (KO match to JA 〜くなる / 〜になる for adjectives.)",
      "grammar",
    ),
    phrase("ko-m27-5-p-becomea", "become (bright vowel)", "-ajyeoyo", "아져요"),
    phrase("ko-m27-5-p-becomeeo", "become (other)", "-eojyeoyo", "어져요"),
    sentenceMcq({
      id: "ko-m27-5-q-getbetter",
      prompt: "'It gets better.' —",
      correctHangul: "좋아져요",
      distractorsHangul: ["좋어져요", "좋아야 돼요", "좋아져요보다"],
      // NATIVE-REVIEW: 좋다 (bright ㅗ) → 좋아져요 (NOT 좋어져요). Confirm
      // 좋아져요 reads as 'it gets better / improves'.
      explanation: "좋다 → 좋아져요 (bright vowel → 아져요).",
      exercisedAtomSurfaces: ["건강"],
    }),
    cloze(
      "ko-m27-5-cloze-becomehealthy",
      "운동하면 건강",
      "",
      "해져요",
      ["해져요", "아져요", "어져요", "야 돼요"],
      "If you exercise, you become healthy.",
      "운동하면 건강해져요",
      "건강하다 → 건강해져요 (하다 adjective → 해져요).",
    ),
    sentenceMcq({
      id: "ko-m27-5-q-getcold",
      prompt: "'The weather gets cold.' —",
      correctHangul: "날씨가 추워져요",
      distractorsHangul: ["날씨가 추어져요", "날씨가 추워야 돼요", "날씨가 추워져요보다"],
      // NATIVE-REVIEW: 춥다 is a ㅂ-irregular → 추워 + 져요 = 추워져요 ('gets
      // cold'). 날씨 ('weather') from an earlier module. Confirm 날씨가
      // 추워져요 is natural.
      explanation: "춥다 (ㅂ-irregular) → 추워져요 = 'gets cold'.",
      exercisedAtomSurfaces: ["건강"],
    }),
    listeningCompSentence({
      id: "ko-m27-5-lc-becomehealthy",
      audioText: "운동하면 건강해져요",
      correctMeaningEn: "If you exercise, you become healthy",
      distractorsEn: ["If you exercise, you get tired", "You must exercise to be healthy", "You became healthy by exercising"],
      exercisedAtomSurfaces: ["건강", "운동"],
    }),
    speaking("ko-m27-5-speak-becomehealthy", "건강해져요", "I become healthy", ["건강"]),
  ],
};

// ─── ko-m27-6 — 이/가 되다 (become — noun) + together ────────────────────────

const M27_6: LessonContent = {
  id: "ko-m27-6",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "이/가 되다 — become (a …)",
  description: "Become a doctor; combine must, should, and become.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m27-6-info",
      "이/가 되다 — 'become a (noun)'",
      "이/가 되다 = 'become (a NOUN)': the noun takes 이/가, then 되다. 의사가 되다 ('become a doctor'); 선생님이 되다 ('become a teacher'). After a CONSONANT → 이 (선생님이); after a VOWEL → 가 (의사가). Contrast with 아/어지다 (used on adjectives). (KO match to JA 〜になる for nouns.)",
      "grammar",
    ),
    phrase("ko-m27-6-p-becomenoun", "become (a noun, after consonant)", "-i doeyo", "이 돼요"),
    sentenceMcq({
      id: "ko-m27-6-q-becomedoctor",
      prompt: "'I want to become a doctor.' —",
      correctHangul: "의사가 되고 싶어요",
      distractorsHangul: ["의사이 되고 싶어요", "의사가 좋아져요", "의사가 되고 싶어요보다"],
      // NATIVE-REVIEW: 의사 ('doctor', earlier module) ends in a vowel → 의사가
      // 되다 (NOT 의사이). 되고 싶어요 = 'want to become'. Confirm natural.
      explanation: "의사 (vowel ending) → 의사가 되다. 의사이 되다 is wrong.",
      exercisedAtomSurfaces: ["결정하다"],
    }),
    build(
      "ko-m27-6-build-becometeacher",
      "Build: 'I want to become a teacher.' (teacher-subj + become + want)",
      "선생님이 되고 싶어요",
      ["선생님이", "되고", "싶어요", "되어요"],
      ["선생님이", "되고", "싶어요"],
      [],
    ),
    translateStep({
      id: "ko-m27-6-tr-muststudy",
      promptEn: "I have an exam, so I have to study.",
      acceptedAnswers: ["시험이 있어서 공부해야 돼요", "시험이 있어서 공부해야 돼요.", "시험이 있어서 공부해야 해요"],
      audioText: "시험이 있어서 공부해야 돼요",
      exercisedAtomSurfaces: ["시험"],
    }),
    listeningCompSentence({
      id: "ko-m27-6-lc-becomedoctor",
      audioText: "의사가 되고 싶어요",
      correctMeaningEn: "I want to become a doctor",
      distractorsEn: ["I am a doctor", "I have to become a doctor", "I met a doctor"],
      exercisedAtomSurfaces: ["결정하다"],
    }),
    speaking("ko-m27-6-speak-becomedoctor", "의사가 되고 싶어요", "I want to become a doctor", []),
  ],
};

// ─── ko-m27-7 — Mini-dialogue: giving advice ────────────────────────────────

const M27_7: LessonContent = {
  id: "ko-m27-7",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — giving advice",
  description: "Combine must, should, and become.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m27-7-info",
      "Advice chat",
      "친구: 너무 피곤해요. (I'm so tired.)\nYou: 약을 먹는 게 좋아요. (You should take medicine.)\n친구: 네. 병원에 가야 돼요? (Yes. Do I have to go to the hospital?)\nYou: 쉬면 건강해져요. 조심하세요. (If you rest, you'll get healthy. Take care.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m27-7-q-shouldtakemedicine",
      prompt: "'You should take medicine.' —",
      correctHangul: "약을 먹는 게 좋아요",
      distractorsHangul: ["약을 먹어야 돼요", "약을 먹은 게 좋아요", "약을 먹는 게 좋아요보다"],
      explanation: "는 게 좋아요 = advice ('you should'). 먹어야 돼요 = 'must'.",
      exercisedAtomSurfaces: ["약"],
    }),
    build(
      "ko-m27-7-build-musthospital",
      "Build: 'Do I have to go to the hospital?' (hospital-to + must-go?)",
      "병원에 가야 돼요?",
      ["병원에", "가야", "돼요?", "가는"],
      ["병원에", "가야", "돼요?"],
      ["병원"],
    ),
    sentenceMcq({
      id: "ko-m27-7-q-restbecomehealthy",
      prompt: "'If you rest, you'll get healthy.' —",
      correctHangul: "쉬면 건강해져요",
      distractorsHangul: ["쉬면 건강해야 돼요", "쉬면 건강한 게 좋아요", "쉬면 건강해져요보다"],
      // NATIVE-REVIEW: 쉬다 ('rest') + 면 ('if', earlier module) → 쉬면. 건강하다
      // → 건강해져요 ('become healthy'). Confirm 쉬면 건강해져요 is natural.
      explanation: "건강해져요 = 'become healthy' (아/어지다 on 건강하다).",
      exercisedAtomSurfaces: ["건강"],
    }),
    listeningCompSentence({
      id: "ko-m27-7-lc-takecare",
      audioText: "쉬면 건강해져요. 조심하세요",
      correctMeaningEn: "If you rest, you'll get healthy. Take care",
      distractorsEn: ["If you rest, you'll get sick. Take care", "You must rest. Goodbye", "You're healthy, so don't rest"],
      exercisedAtomSurfaces: ["건강", "조심하다"],
    }),
    speaking("ko-m27-7-speak-shouldtakemedicine", "약을 먹는 게 좋아요", "You should take medicine", ["약"]),
  ],
};

// ─── ko-m27-8 — Mastery test (completes KO parity M1-M27) ────────────────────

const M27_8: LessonContent = {
  id: "ko-m27-8",
  moduleId: "m27",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M27 Mastery Test",
  description: "Modal vocab, 아/어야 되다, 는 게 좋다, 아/어지다, 이/가 되다.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m27-8-q-exam",
      prompt: "Which means 'exam'?",
      correctHangul: "시험",
      distractorsHangul: ["약속", "연습", "준비"],
      exercisedAtomSurfaces: ["시험"],
    }),
    sentenceMcq({
      id: "ko-m27-8-q-mustgo",
      prompt: "'I have to go now.' —",
      correctHangul: "지금 가야 돼요",
      distractorsHangul: ["지금 가어야 돼요", "지금 가는 게 좋아요", "지금 가고 싶어요"],
      exercisedAtomSurfaces: ["약속"],
    }),
    sentenceMcq({
      id: "ko-m27-8-q-shouldexercise",
      prompt: "'You should exercise.' —",
      correctHangul: "운동하는 게 좋아요",
      distractorsHangul: ["운동하야 돼요", "운동한 게 좋아요", "운동하고 싶어요"],
      exercisedAtomSurfaces: ["운동"],
    }),
    cloze(
      "ko-m27-8-cloze-becomehealthy",
      "운동하면 건강",
      "",
      "해져요",
      ["해져요", "아져요", "어져요", "야 돼요"],
      "If you exercise, you become healthy.",
      "운동하면 건강해져요",
      "건강하다 → 건강해져요 (하다 adjective → 해져요).",
    ),
    sentenceMcq({
      id: "ko-m27-8-q-becomedoctor",
      prompt: "'I want to become a doctor.' —",
      correctHangul: "의사가 되고 싶어요",
      distractorsHangul: ["의사이 되고 싶어요", "의사가 좋아져요", "의사가 되야 돼요"],
      exercisedAtomSurfaces: ["결정하다"],
    }),
    listeningCompSentence({
      id: "ko-m27-8-lc-shouldtakemedicine",
      audioText: "약을 먹는 게 좋아요",
      correctMeaningEn: "You should take medicine",
      distractorsEn: ["You must take medicine", "I took medicine", "I want to take medicine"],
      exercisedAtomSurfaces: ["약"],
    }),
    speaking("ko-m27-8-speak-recap", "건강해져요", "I become healthy", ["건강"]),
  ],
};

export const KO_M27_LESSONS: LessonContent[] = [
  M27_1,
  M27_2,
  M27_3,
  M27_4,
  M27_5,
  M27_6,
  M27_7,
  M27_8,
];
