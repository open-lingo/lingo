/**
 * Korean Module 20 — Body, health & 아파요 + 으니까 (reason).
 *
 * KO analog of JA M20 (body/health vocab + 〜がいたい 'hurts' + ので 'because').
 * Re-expressed in Korean's own grammar:
 *
 *   ko-m20-1  Body parts — 머리 / 눈 / 코 / 입 / 귀
 *   ko-m20-2  More body — 손 / 발 / 배 / 목
 *   ko-m20-3  아프다 — to hurt / be sick (ㅡ-irregular → 아파요)
 *   ko-m20-4  Health vocab — 병원 / 약 / 감기 / 열
 *   ko-m20-5  (으)니까 — because / since (reason → command/suggestion)
 *   ko-m20-6  Putting it together — explaining you're sick
 *   ko-m20-7  Mini-dialogue — at the doctor's
 *   ko-m20-8  M20 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 아프다 ('to hurt / be sick') is a ㅡ-IRREGULAR adjective: the stem-final
 *     ㅡ drops before a vowel ending, and because the syllable before it (아)
 *     has a bright vowel, the ending is 아 → 아파요 (NOT 아프어요/아프아요).
 *     머리가 아파요 = 'My head hurts.' Body part + 가/이 아파요 is the frame.
 *   - (으)니까 = 'because/since', and unlike 아서/어서 (M14) it CAN precede a
 *     command or suggestion: 아프니까 약을 먹어요 = 'Take medicine because
 *     you're sick.' 머리가 아프니까 집에 가요. After a vowel/ㄹ stem → 니까;
 *     after a consonant stem → 으니까 (먹으니까). This is the closest KO match
 *     to JA's ので — a reason connector — but the canonical KO contrast is
 *     아서/어서 (fact-like) vs 으니까 (speaker's reason, allows commands).
 *
 * Builds on: 아서/어서 reason (M14), 눈 (already an atom 'snow' AND 'eye' — see
 * the disambiguation note in M20-1). NATIVE-REVIEW flags inline.
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

// ─── ko-m20-1 — Body parts (face) ───────────────────────────────────────────

const M20_1: LessonContent = {
  id: "ko-m20-1",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Body — 머리, 눈, 코, 입",
  description: "Head, eyes, nose, mouth, ears.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m20-1-info",
      "The face",
      "머리 = 'head' (also 'hair'). 눈 = 'eye' (yes — same spelling as 눈 'snow' from M18; context tells them apart). 코 = 'nose', 입 = 'mouth', 귀 = 'ear'. We'll use these with 아파요 ('hurts') in a couple of lessons.",
      "default",
    ),
    phrase("ko-m20-1-p-head", "head / hair", "meori", "머리", undefined, { emoji: "🧠" }),
    phrase("ko-m20-1-p-eye", "eye", "nun", "눈", undefined, { emoji: "👁️" }),
    phrase("ko-m20-1-p-nose", "nose", "ko", "코", undefined, { emoji: "👃" }),
    phrase("ko-m20-1-p-mouth", "mouth", "ip", "입", undefined, { emoji: "👄" }),
    phrase("ko-m20-1-p-ear", "ear", "gwi", "귀", undefined, { emoji: "👂" }),
    sentenceMcq({
      id: "ko-m20-1-q-head",
      prompt: "Which means 'head'?",
      correctHangul: "머리",
      distractorsHangul: ["코", "입", "귀"],
      explanation: "머리 = head (also hair).",
      exercisedAtomSurfaces: ["머리"],
    }),
    sentenceMcq({
      id: "ko-m20-1-q-nose",
      prompt: "Which means 'nose'?",
      correctHangul: "코",
      distractorsHangul: ["귀", "눈", "입"],
      explanation: "코 = nose. 귀 = ear.",
      exercisedAtomSurfaces: ["코"],
    }),
    listeningCompSentence({
      id: "ko-m20-1-lc-mouth",
      audioText: "입",
      correctMeaningEn: "mouth",
      distractorsEn: ["ear", "nose", "eye"],
      exercisedAtomSurfaces: ["입"],
    }),
    speaking("ko-m20-1-speak-ear", "귀", "ear", ["귀"]),
  ],
};

// ─── ko-m20-2 — More body parts ─────────────────────────────────────────────

const M20_2: LessonContent = {
  id: "ko-m20-2",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Body — 손, 발, 배, 목",
  description: "Hand, foot, stomach, neck/throat.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m20-2-info",
      "More body parts",
      "손 = 'hand', 발 = 'foot', 배 = 'stomach/belly' (also 'pear' and 'boat' — context!), 목 = 'neck' or 'throat'. 목이 아파요 = 'My throat hurts' (a sore throat).",
      "default",
    ),
    phrase("ko-m20-2-p-hand", "hand", "son", "손", undefined, { emoji: "✋" }),
    phrase("ko-m20-2-p-foot", "foot", "bal", "발", undefined, { emoji: "🦶" }),
    phrase("ko-m20-2-p-stomach", "stomach / belly", "bae", "배", undefined, { emoji: "🫃" }),
    phrase("ko-m20-2-p-neck", "neck / throat", "mok", "목", undefined, { emoji: "🧣" }),
    sentenceMcq({
      id: "ko-m20-2-q-hand",
      prompt: "Which means 'hand'?",
      correctHangul: "손",
      distractorsHangul: ["발", "목", "배"],
      explanation: "손 = hand. 발 = foot.",
      exercisedAtomSurfaces: ["손"],
    }),
    sentenceMcq({
      id: "ko-m20-2-q-stomach",
      prompt: "Which means 'stomach'?",
      correctHangul: "배",
      distractorsHangul: ["목", "손", "발"],
      explanation: "배 = stomach/belly.",
      exercisedAtomSurfaces: ["배"],
    }),
    listeningCompSentence({
      id: "ko-m20-2-lc-foot",
      audioText: "발",
      correctMeaningEn: "foot",
      distractorsEn: ["hand", "neck", "stomach"],
      exercisedAtomSurfaces: ["발"],
    }),
    speaking("ko-m20-2-speak-neck", "목", "neck / throat", ["목"]),
  ],
};

// ─── ko-m20-3 — 아프다 (to hurt, ㅡ-irregular) ──────────────────────────────

const M20_3: LessonContent = {
  id: "ko-m20-3",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아프다 — to hurt / be sick",
  description: "ㅡ-irregular: 아프다 → 아파요. 머리가 아파요.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m20-3-info",
      "아프다 → 아파요 (the ㅡ-irregular)",
      "아프다 means 'to hurt / be sick / be in pain'. It's ㅡ-IRREGULAR: the stem-final ㅡ drops before the ending, giving 아파요 (NOT 아프어요). The frame is [body part] + 가/이 아파요: 머리가 아파요 = 'My head hurts', 배가 아파요 = 'My stomach hurts.' For 'I'm sick' generally, 아파요 stands alone.",
      "grammar",
    ),
    phrase("ko-m20-3-p-hurt", "hurts / is sick", "apayo", "아파요"),
    sentenceMcq({
      id: "ko-m20-3-q-headache",
      prompt: "'My head hurts.' —",
      correctHangul: "머리가 아파요",
      distractorsHangul: ["머리가 아프어요", "머리를 아파요", "머리가 아프요"],
      explanation: "ㅡ-irregular: 아프다 → 아파요 (not 아프어요). Body part + 가.",
      exercisedAtomSurfaces: ["머리", "아파요"],
    }),
    cloze(
      "ko-m20-3-cloze-stomachache",
      "배",
      "아파요",
      "가",
      ["가", "를", "에", "도"],
      "My stomach hurts.",
      "배가 아파요",
      "The body part is the subject → 배가 아파요.",
    ),
    sentenceMcq({
      id: "ko-m20-3-q-sorethroat",
      prompt: "'My throat hurts.' —",
      correctHangul: "목이 아파요",
      distractorsHangul: ["목이 아프어요", "목을 아파요", "목이 아프아요"],
      explanation: "목 ends in a consonant → 목이; 아프다 → 아파요.",
      exercisedAtomSurfaces: ["목", "아파요"],
    }),
    listeningCompSentence({
      id: "ko-m20-3-lc-headache",
      audioText: "머리가 아파요",
      correctMeaningEn: "My head hurts",
      distractorsEn: ["My stomach hurts", "My head is big", "My throat hurts"],
      exercisedAtomSurfaces: ["머리", "아파요"],
    }),
    speaking("ko-m20-3-speak-stomachache", "배가 아파요", "My stomach hurts", ["배", "아파요"]),
  ],
};

// ─── ko-m20-4 — Health vocab ────────────────────────────────────────────────

const M20_4: LessonContent = {
  id: "ko-m20-4",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Health — 병원, 약, 감기, 열",
  description: "Hospital/clinic, medicine, a cold, a fever.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m20-4-info",
      "When you're not well",
      "병원 = 'hospital / clinic' (where you see a doctor). 약 = 'medicine' (먹다 'eat' is used for taking it: 약을 먹어요 = 'take medicine'). 감기 = 'a cold' (감기에 걸려요 = 'catch a cold'). 열 = 'a fever' (열이 나요 = 'have a fever').",
      "default",
    ),
    phrase("ko-m20-4-p-hospital", "hospital / clinic", "byeongwon", "병원", undefined, { emoji: "🏥" }),
    phrase("ko-m20-4-p-medicine", "medicine", "yak", "약", undefined, { emoji: "💊" }),
    phrase("ko-m20-4-p-cold", "a cold (illness)", "gamgi", "감기", undefined, { emoji: "🤧" }),
    phrase("ko-m20-4-p-fever", "a fever", "yeol", "열", undefined, { emoji: "🌡️" }),
    sentenceMcq({
      id: "ko-m20-4-q-takemedicine",
      prompt: "'I take medicine.' —",
      correctHangul: "약을 먹어요",
      distractorsHangul: ["약을 마셔요", "약이 먹어요", "약을 봐요"],
      explanation: "Korean uses 먹다 ('eat') for taking medicine: 약을 먹어요.",
      exercisedAtomSurfaces: ["약"],
    }),
    sentenceMcq({
      id: "ko-m20-4-q-hospital",
      prompt: "Which means 'hospital / clinic'?",
      correctHangul: "병원",
      distractorsHangul: ["감기", "약", "열"],
      explanation: "병원 = hospital/clinic.",
      exercisedAtomSurfaces: ["병원"],
    }),
    listeningCompSentence({
      id: "ko-m20-4-lc-cold",
      audioText: "감기",
      correctMeaningEn: "a cold",
      distractorsEn: ["a fever", "medicine", "a hospital"],
      exercisedAtomSurfaces: ["감기"],
    }),
    speaking("ko-m20-4-speak-medicine", "약을 먹어요", "I take medicine", ["약"]),
  ],
};

// ─── ko-m20-5 — (으)니까 (because/since → command) ──────────────────────────

const M20_5: LessonContent = {
  id: "ko-m20-5",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)니까 — because / since",
  description: "Give a reason that can lead to a command or suggestion.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m20-5-info",
      "(으)니까 — a reason you can act on",
      "(으)니까 means 'because / since'. Unlike 아서/어서 (M14), it CAN be followed by a command or suggestion: 아프니까 약을 먹어요 = 'Since you're sick, take medicine.' Attach 니까 after a vowel/ㄹ stem (아프 → 아프니까) and 으니까 after a consonant stem (먹 → 먹으니까). Use 아서/어서 for plain explanations, 으니까 when you want to tell someone what to do.",
      "grammar",
    ),
    phrase("ko-m20-5-p-since", "because / since (→ command)", "(eu)nikka", "(으)니까"),
    sentenceMcq({
      id: "ko-m20-5-q-sicksomedicine",
      prompt: "'Since you're sick, take medicine.' —",
      correctHangul: "아프니까 약을 먹어요",
      distractorsHangul: ["아프어서 약을 먹어요", "아프니까 약이 먹어요", "아프으니까 약을 먹어요"],
      // NATIVE-REVIEW: 아프다 is a vowel stem (ends in ㅡ) → 아프니까 (not
      // 아프으니까). Confirm 아프니까 약을 먹어요 reads as natural advice.
      explanation: "Vowel stem 아프 → 아프니까; 으니까 is for consonant stems.",
      exercisedAtomSurfaces: ["약"],
    }),
    cloze(
      "ko-m20-5-cloze-eatso",
      "밥을 먹",
      "병원에 가요",
      "으니까",
      ["으니까", "니까", "아서", "고"],
      "Since I've eaten, I'll go to the hospital.",
      "밥을 먹으니까 병원에 가요",
      "Consonant stem 먹 → 먹으니까.",
    ),
    sentenceMcq({
      id: "ko-m20-5-q-headache-gohome",
      prompt: "'My head hurts, so go home.' —",
      correctHangul: "머리가 아프니까 집에 가요",
      distractorsHangul: ["머리가 아프으니까 집에 가요", "머리가 아파니까 집에 가요", "머리를 아프니까 집에 가요"],
      explanation: "아프 (vowel stem) → 아프니까; reason + suggestion.",
      exercisedAtomSurfaces: ["머리", "집"],
    }),
    listeningCompSentence({
      id: "ko-m20-5-lc-sicksomedicine",
      audioText: "아프니까 약을 먹어요",
      correctMeaningEn: "Since you're sick, take medicine",
      distractorsEn: ["I'm sick, but I won't take medicine", "I take medicine every day", "I went to the hospital"],
      exercisedAtomSurfaces: ["약"],
    }),
    speaking("ko-m20-5-speak-headache-gohome", "머리가 아프니까 집에 가요", "My head hurts, so go home", ["머리", "집"]),
  ],
};

// ─── ko-m20-6 — Putting it together ─────────────────────────────────────────

const M20_6: LessonContent = {
  id: "ko-m20-6",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Explaining you're sick",
  description: "Combine body parts, 아파요, and (으)니까.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m20-6-info",
      "Talking about being unwell",
      "감기에 걸려서 열이 나요 = 'I caught a cold, so I have a fever.' 목이 아프니까 병원에 가요 = 'My throat hurts, so I'm going to the clinic.' Stack the M14 아서/어서 reason and the M20 으니까 reason with health vocab.",
      "default",
    ),
    build(
      "ko-m20-6-build-throatclinic",
      "Build: 'My throat hurts, so I go to the clinic.' (throat-subject + hurts-since + hospital-to + go)",
      "목이 아프니까 병원에 가요",
      ["목이", "아프니까", "병원에", "가요", "약을"],
      ["목이", "아프니까", "병원에", "가요"],
      ["목", "병원"],
    ),
    sentenceMcq({
      id: "ko-m20-6-q-fevermedicine",
      prompt: "'I have a fever, so I take medicine.' —",
      correctHangul: "열이 나니까 약을 먹어요",
      distractorsHangul: ["열이 나서 약이 먹어요", "열이 나니까 약을 마셔요", "열을 나니까 약을 먹어요"],
      // NATIVE-REVIEW: 나다 ('come out / occur', as in 열이 나다 'have a fever')
      // is introduced only in the M20-4 example, not as its own atom. 나니까
      // is the correct 으니까 form of the vowel stem 나-. Confirm 열이 나니까
      // 약을 먹어요 is natural.
      explanation: "나다 (vowel stem) → 나니까; medicine uses 먹다.",
      exercisedAtomSurfaces: ["열", "약"],
    }),
    translateStep({
      id: "ko-m20-6-tr-headache-home",
      promptEn: "My head hurts, so I'm going home.",
      acceptedAnswers: ["머리가 아프니까 집에 가요", "머리가 아프니까 집에 가요."],
      audioText: "머리가 아프니까 집에 가요",
      exercisedAtomSurfaces: ["머리", "집"],
    }),
    listeningCompSentence({
      id: "ko-m20-6-lc-throatclinic",
      audioText: "목이 아프니까 병원에 가요",
      correctMeaningEn: "My throat hurts, so I go to the clinic",
      distractorsEn: ["My head hurts, so I go home", "I caught a cold", "I take medicine at the clinic"],
      exercisedAtomSurfaces: ["목", "병원"],
    }),
    speaking("ko-m20-6-speak-throatclinic", "목이 아프니까 병원에 가요", "My throat hurts, so I go to the clinic", ["목", "병원"]),
  ],
};

// ─── ko-m20-7 — Mini-dialogue ───────────────────────────────────────────────

const M20_7: LessonContent = {
  id: "ko-m20-7",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — at the doctor's",
  description: "Describe your symptoms and get advice.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m20-7-info",
      "A clinic visit",
      "의사 (doctor): 어디가 아파요? (Where does it hurt?)\nYou: 머리가 아파요. 그리고 열이 나요. (My head hurts. And I have a fever.)\n의사: 감기예요. 약을 먹으니까 괜찮을 거예요. (It's a cold. Since you'll take medicine, you'll be fine.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m20-7-q-wherehurts",
      prompt: "'Where does it hurt?' —",
      correctHangul: "어디가 아파요?",
      distractorsHangul: ["어디에 아파요?", "뭐가 아파요?", "어디가 아프어요?"],
      // NATIVE-REVIEW: 어디 ('where', taught in M-earlier deixis) used as the
      // subject 어디가 아파요? — natural clinic phrasing. Confirm.
      explanation: "어디가 아파요? = 'where does it hurt?' (어디 as subject).",
      exercisedAtomSurfaces: ["아파요"],
    }),
    build(
      "ko-m20-7-build-headfever",
      "Build: 'My head hurts. And I have a fever.' (head-subject + hurts + and + fever-subject + occurs)",
      "머리가 아파요. 그리고 열이 나요",
      ["머리가", "아파요.", "그리고", "열이 나요", "배가"],
      ["머리가", "아파요.", "그리고", "열이 나요"],
      ["머리", "아파요", "열"],
    ),
    sentenceMcq({
      id: "ko-m20-7-q-itsacold",
      prompt: "'It's a cold.' —",
      correctHangul: "감기예요",
      distractorsHangul: ["감기에요", "열이에요", "병원이에요"],
      // NATIVE-REVIEW: 감기 ends in a vowel → 감기예요 (standard); 감기에요 is
      // the common misspelling distractor. Confirm teaching 예요 here.
      explanation: "감기 ends in a vowel → 감기예요.",
      exercisedAtomSurfaces: ["감기"],
    }),
    listeningCompSentence({
      id: "ko-m20-7-lc-headfever",
      audioText: "머리가 아파요. 그리고 열이 나요",
      correctMeaningEn: "My head hurts. And I have a fever",
      distractorsEn: ["My throat hurts and I have a cold", "I took medicine and went home", "My stomach hurts"],
      exercisedAtomSurfaces: ["머리", "열"],
    }),
    speaking("ko-m20-7-speak-wherehurts", "어디가 아파요?", "Where does it hurt?", ["아파요"]),
  ],
};

// ─── ko-m20-8 — Mastery test ────────────────────────────────────────────────

const M20_8: LessonContent = {
  id: "ko-m20-8",
  moduleId: "m20",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M20 Mastery Test",
  description: "Body parts, 아파요, health vocab, and (으)니까.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m20-8-q-head",
      prompt: "Which means 'head'?",
      correctHangul: "머리",
      distractorsHangul: ["코", "손", "발"],
      exercisedAtomSurfaces: ["머리"],
    }),
    sentenceMcq({
      id: "ko-m20-8-q-headache",
      prompt: "'My head hurts.' —",
      correctHangul: "머리가 아파요",
      distractorsHangul: ["머리가 아프어요", "머리를 아파요", "머리가 아프요"],
      exercisedAtomSurfaces: ["머리", "아파요"],
    }),
    sentenceMcq({
      id: "ko-m20-8-q-takemedicine",
      prompt: "'I take medicine.' —",
      correctHangul: "약을 먹어요",
      distractorsHangul: ["약을 마셔요", "약이 먹어요", "약을 봐요"],
      exercisedAtomSurfaces: ["약"],
    }),
    cloze(
      "ko-m20-8-cloze-eatso",
      "밥을 먹",
      "병원에 가요",
      "으니까",
      ["으니까", "니까", "아서", "고"],
      "Since I've eaten, I'll go to the hospital.",
      "밥을 먹으니까 병원에 가요",
      "Consonant stem 먹 → 먹으니까.",
    ),
    sentenceMcq({
      id: "ko-m20-8-q-sicksomedicine",
      prompt: "'Since you're sick, take medicine.' —",
      correctHangul: "아프니까 약을 먹어요",
      distractorsHangul: ["아프어서 약을 먹어요", "아프으니까 약을 먹어요", "아프니까 약이 먹어요"],
      exercisedAtomSurfaces: ["약"],
    }),
    listeningCompSentence({
      id: "ko-m20-8-lc-throat",
      audioText: "목이 아파요",
      correctMeaningEn: "My throat hurts",
      distractorsEn: ["My head hurts", "My foot hurts", "My stomach hurts"],
      exercisedAtomSurfaces: ["목", "아파요"],
    }),
    speaking("ko-m20-8-speak-recap", "머리가 아프니까 집에 가요", "My head hurts, so go home", ["머리", "집"]),
  ],
};

export const KO_M20_LESSONS: LessonContent[] = [
  M20_1,
  M20_2,
  M20_3,
  M20_4,
  M20_5,
  M20_6,
  M20_7,
  M20_8,
];
