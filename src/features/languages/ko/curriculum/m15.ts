/**
 * Korean Module 15 — Ongoing actions, permission, and contrast.
 *
 * KO analog of JA M15 (ている progressive + てもいい permission + たい want +
 * けど contrast). 고 싶어요 ('want to') already shipped in M11, so M15 covers
 * the rest of the cluster:
 *
 *   ko-m15-1  고 있어요 — is …-ing (progressive)
 *   ko-m15-2  고 있어요 — more verbs + questions
 *   ko-m15-3  아도 / 어도 돼요 — may I…? (permission)
 *   ko-m15-4  Answering permission — 네, 돼요 / 아니요, 안 돼요
 *   ko-m15-5  지만 — but / although (one sentence)
 *   ko-m15-6  Putting it together — ongoing + contrast
 *   ko-m15-7  Mini-dialogue — at the café
 *   ko-m15-8  M15 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 고 있어요 = stem + 고 있어요: 먹고 있어요 ('am eating'), 가고 있어요
 *     ('am going'). Reuses the 고 from M14 + 있어요 from M6.
 *   - 아도/어도 돼요 = the 아/어 form (vowel harmony) + 도 돼요: 가도 돼요
 *     ('may I go?'), 먹어도 돼요 ('may I eat?'). As a question it asks
 *     permission; as a statement it grants it.
 *   - 지만 attaches to the plain stem (and works on copula/adjectives too):
 *     좋지만 ('it's good, but…'), 비싸지만 ('it's expensive, but…'). Joins two
 *     clauses inside one sentence. (Do NOT back-reference 하지만 as taught —
 *     it only ever appeared as an MCQ distractor; 2026-09-01 audit fix.)
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

// ─── ko-m15-1 — 고 있어요 (progressive) ─────────────────────────────────────

const M15_1: LessonContent = {
  id: "ko-m15-1",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "고 있어요 — is …-ing",
  description: "Say an action is happening right now.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m15-1-info",
      "stem + 고 있어요",
      "For an action happening RIGHT NOW, attach 고 (from M14) + 있어요 (from M6) to the verb stem: 먹다 → 먹고 있어요 ('am eating'), 가다 → 가고 있어요 ('am going'), 공부하다 → 공부하고 있어요 ('am studying'). Compare 먹어요 ('I eat / will eat') with 먹고 있어요 ('I'm eating right now').",
      "grammar",
    ),
    phrase("ko-m15-1-p-prog", "is …-ing (verb + 고 있어요)", "go isseoyo", "고 있어요"),
    sentenceMcq({
      id: "ko-m15-1-q-eating",
      prompt: "'I'm eating (right now).' —",
      correctHangul: "밥을 먹고 있어요",
      distractorsHangul: ["밥을 먹어요", "밥을 먹고 있어요?", "밥을 먹어 있어요"],
      explanation: "Stem 먹 + 고 있어요 = 'am eating'. (먹어요 alone = 'eat / will eat'.)",
      exercisedAtomSurfaces: ["밥", "고 있어요"],
    }),
    cloze(
      "ko-m15-1-cloze-studying",
      "공부하",
      "있어요",
      "고",
      ["고", "서", "지만", "도"],
      "I'm studying.",
      "공부하고 있어요",
      "공부하다 → 공부하고 있어요.",
    ),
    build(
      "ko-m15-1-build-going",
      "Build: 'I'm going home.' (home + to + going)",
      "집에 가고 있어요",
      ["집에", "가고 있어요", "가요", "먹고 있어요"],
      ["집에", "가고 있어요"],
      ["고 있어요", "가요"],
    ),
    listeningCompSentence({
      id: "ko-m15-1-lc-eating",
      audioText: "밥을 먹고 있어요",
      correctMeaningEn: "I'm eating (right now)",
      distractorsEn: ["I want to eat", "I ate", "I'll eat later"],
      exercisedAtomSurfaces: ["밥", "고 있어요"],
    }),
    speaking("ko-m15-1-speak-eating", "밥을 먹고 있어요", "I'm eating", ["밥", "고 있어요"]),
  ],
};

// ─── ko-m15-2 — 고 있어요 (more) ────────────────────────────────────────────

const M15_2: LessonContent = {
  id: "ko-m15-2",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "고 있어요 — questions & more verbs",
  description: "Ask 'what are you doing?' and answer.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m15-2-info",
      "뭐 하고 있어요?",
      "Make it a question with rising intonation: 뭐 하고 있어요? = 'What are you doing?' Answer with any verb + 고 있어요: 영화를 보고 있어요 ('I'm watching a movie'), 쉬고 있어요 ('I'm resting'). 쉬다 = 'to rest', 자다 = 'to sleep'.",
      "grammar",
    ),
    phrase("ko-m15-2-p-rest", "to rest", "swida", "쉬다"),
    phrase("ko-m15-2-p-whatdoing", "What are you doing?", "mwo hago isseoyo", "뭐 하고 있어요?"),
    sentenceMcq({
      id: "ko-m15-2-q-watching",
      prompt: "'I'm watching a movie.' —",
      correctHangul: "영화를 보고 있어요",
      distractorsHangul: ["영화를 봐요", "영화를 보고 있어요?", "영화를 봐고 있어요"],
      explanation: "보다 → 보고 있어요 ('am watching').",
      exercisedAtomSurfaces: ["영화", "고 있어요"],
    }),
    cloze(
      "ko-m15-2-cloze-resting",
      "지금 쉬",
      "있어요",
      "고",
      ["고", "서", "도", "만"],
      "I'm resting now.",
      "지금 쉬고 있어요",
      "쉬다 → 쉬고 있어요.",
    ),
    translateStep({
      id: "ko-m15-2-tr-whatdoing",
      promptEn: "What are you doing?",
      acceptedAnswers: ["뭐 하고 있어요?", "뭐 하고 있어요", "뭐 해요?"],
      audioText: "뭐 하고 있어요?",
      exercisedAtomSurfaces: ["고 있어요"],
    }),
    listeningCompSentence({
      id: "ko-m15-2-lc-resting",
      audioText: "지금 쉬고 있어요",
      correctMeaningEn: "I'm resting now",
      distractorsEn: ["I rested", "I want to rest", "I'm studying now"],
      exercisedAtomSurfaces: ["고 있어요"],
    }),
    speaking("ko-m15-2-speak-watching", "영화를 보고 있어요", "I'm watching a movie", ["영화", "고 있어요"]),
  ],
};

// ─── ko-m15-3 — 아도 / 어도 돼요 (permission) ───────────────────────────────

const M15_3: LessonContent = {
  id: "ko-m15-3",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아도 / 어도 돼요 — may I…?",
  description: "Ask whether something is allowed.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m15-3-info",
      "verb-아/어 + 도 돼요",
      "Take the verb's 아/어 form (vowel harmony, like the 해요 present) and add 도 돼요 to ask 'may I…?': 가다 → 가도 돼요? ('may I go?'), 먹다 → 먹어도 돼요? ('may I eat?'), 보다 → 봐도 돼요? ('may I look?'). As a plain statement (no question intonation) it GRANTS permission: 가도 돼요 = 'you may go'.",
      "grammar",
    ),
    phrase("ko-m15-3-p-mayi", "may / it's okay to (verb + 도 돼요)", "do dwaeyo", "도 돼요"),
    sentenceMcq({
      id: "ko-m15-3-q-mayigo",
      prompt: "'May I go?' —",
      correctHangul: "가도 돼요?",
      distractorsHangul: ["가도 되요?", "가어도 돼요?", "가고 돼요?"],
      // NATIVE-REVIEW: 돼요 (correct) vs the very common misspelling 되요 — the
      // distractor 가도 되요? mirrors a real learner/native typo. Confirm
      // teaching 돼요 as the only correct spelling is appropriate here.
      explanation: "가다 → 가 (아/어 form) + 도 돼요. The standard spelling is 돼요.",
      exercisedAtomSurfaces: ["도 돼요", "가요"],
    }),
    cloze(
      "ko-m15-3-cloze-mayieat",
      "여기서 밥을 먹어",
      "돼요?",
      "도",
      ["도", "고", "서", "만"],
      "May I eat here?",
      "여기서 밥을 먹어도 돼요?",
      // NATIVE-REVIEW: 여기서 ('here', contraction of 여기에서) used as support;
      // confirm the contracted form is fine to surface at M15.
      "먹다 → 먹어 + 도 돼요 = 'may I eat?'.",
    ),
    sentenceMcq({
      id: "ko-m15-3-q-mayilook",
      prompt: "'May I look (at it)?' —",
      correctHangul: "봐도 돼요?",
      distractorsHangul: ["보도 돼요?", "봐고 돼요?", "보아도 되요?"],
      explanation: "보다 → 봐 (아/어 form) + 도 돼요?.",
      exercisedAtomSurfaces: ["도 돼요", "봐요"],
    }),
    listeningCompSentence({
      id: "ko-m15-3-lc-mayigo",
      audioText: "가도 돼요?",
      correctMeaningEn: "May I go?",
      distractorsEn: ["I'm going", "I can't go", "I want to go"],
      exercisedAtomSurfaces: ["도 돼요", "가요"],
    }),
    speaking("ko-m15-3-speak-mayieat", "먹어도 돼요?", "May I eat?", ["도 돼요", "먹어요"]),
  ],
};

// ─── ko-m15-4 — Answering permission ────────────────────────────────────────

const M15_4: LessonContent = {
  id: "ko-m15-4",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Yes you may / no you may not",
  description: "네, 돼요 vs 아니요, 안 돼요.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m15-4-info",
      "돼요 / 안 돼요",
      "To grant: 네, 돼요 ('yes, you may') or repeat the verb: 가도 돼요 ('you may go'). To refuse: 아니요, 안 돼요 ('no, you may not'). 안 돼요 ('it's not okay') uses the 안 negation from M11.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m15-4-q-yesmay",
      prompt: "Someone asks 가도 돼요? You allow it. You say…",
      correctHangul: "네, 가도 돼요",
      distractorsHangul: ["네, 안 돼요", "아니요, 돼요", "네, 가고 있어요"],
      explanation: "Grant with 네, …도 돼요.",
      exercisedAtomSurfaces: ["도 돼요", "가요"],
    }),
    sentenceMcq({
      id: "ko-m15-4-q-nomay",
      prompt: "Someone asks 먹어도 돼요? You refuse. You say…",
      correctHangul: "아니요, 안 돼요",
      distractorsHangul: ["아니요, 돼요", "네, 안 돼요", "아니요, 먹어도 돼요"],
      explanation: "Refuse with 아니요, 안 돼요 (안 negation from M11).",
      exercisedAtomSurfaces: ["도 돼요"],
    }),
    cloze(
      "ko-m15-4-cloze-notok",
      "여기서는",
      "돼요",
      "안",
      ["안", "못", "도", "고"],
      "It's not okay here.",
      "여기서는 안 돼요",
      "안 돼요 = 'not allowed' (안 negation).",
    ),
    listeningCompSentence({
      id: "ko-m15-4-lc-notok",
      audioText: "아니요, 안 돼요",
      correctMeaningEn: "No, you may not",
      distractorsEn: ["Yes, you may", "Yes, go ahead", "I'm not going"],
      exercisedAtomSurfaces: ["도 돼요"],
    }),
    speaking("ko-m15-4-speak-yesmay", "네, 가도 돼요", "Yes, you may go", ["도 돼요", "가요"]),
  ],
};

// ─── ko-m15-5 — 지만 (but) ──────────────────────────────────────────────────

const M15_5: LessonContent = {
  id: "ko-m15-5",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "지만 — but / although",
  description: "Contrast two clauses inside one sentence.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m15-5-info",
      "stem + 지만",
      "지만 attaches to the plain stem of any verb or adjective to mean 'but / although': 좋지만 ('it's good, but…'), 비싸지만 ('it's expensive, but…'), 가고 싶지만 ('I want to go, but…'). It joins two clauses in ONE sentence — the contrast counterpart of M14's in-clause reason ending 아서/어서.",
      "grammar",
    ),
    phrase("ko-m15-5-p-but", "but / although (stem + 지만)", "jiman", "지만"),
    sentenceMcq({
      id: "ko-m15-5-q-goodbutexpensive",
      prompt: "'It's good, but it's expensive.' —",
      correctHangul: "좋지만 비싸요",
      distractorsHangul: ["좋고 비싸요", "좋아서 비싸요", "좋지만 비싸고"],
      explanation: "좋다 → 좋지만 ('good, but') + 비싸요.",
      exercisedAtomSurfaces: ["지만"],
    }),
    cloze(
      "ko-m15-5-cloze-wantbutcant",
      "가고 싶",
      "못 가요",
      "지만",
      ["지만", "고", "서", "도"],
      "I want to go, but I can't.",
      "가고 싶지만 못 가요",
      "싶다 → 싶지만; 못 가요 ('can't go', M11).",
    ),
    translateStep({
      id: "ko-m15-5-tr-deliciousexpensive",
      promptEn: "It's delicious, but it's expensive.",
      acceptedAnswers: ["맛있지만 비싸요", "맛있지만 비싸요."],
      audioText: "맛있지만 비싸요",
      exercisedAtomSurfaces: ["지만"],
    }),
    listeningCompSentence({
      id: "ko-m15-5-lc-goodbut",
      audioText: "좋지만 비싸요",
      correctMeaningEn: "It's good, but expensive",
      distractorsEn: ["It's good and cheap", "It's good, so I buy it", "It's bad and expensive"],
      exercisedAtomSurfaces: ["지만"],
    }),
    speaking("ko-m15-5-speak-goodbut", "좋지만 비싸요", "It's good, but expensive", ["지만"]),
  ],
};

// ─── ko-m15-6 — Putting it together ─────────────────────────────────────────

const M15_6: LessonContent = {
  id: "ko-m15-6",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Ongoing actions + contrast",
  description: "Combine progressive, permission, and 지만.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m15-6-info",
      "Mixing the three patterns",
      "지금 공부하고 있지만 졸려요 = 'I'm studying now, but I'm sleepy.' 쉬고 싶지만 일해요 = 'I want to rest, but I'm working.' Stack 고 있다, 지만, and 도 돼요 freely.",
      "default",
    ),
    build(
      "ko-m15-6-build-studyingbut",
      "Build: 'I'm studying, but I'm sleepy.' (studying + but + sleepy)",
      "공부하고 있지만 졸려요",
      ["공부하고 있지만", "졸려요", "공부하고 있어서", "자요"],
      ["공부하고 있지만", "졸려요"],
      // NATIVE-REVIEW: 졸리다 → 졸려요 ('to be sleepy') used as support, not a
      // registered atom — confirm acceptable as recognition-only at M15.
      ["고 있어요", "지만"],
    ),
    sentenceMcq({
      id: "ko-m15-6-q-restbutwork",
      prompt: "'I want to rest, but I'm working.' —",
      correctHangul: "쉬고 싶지만 일하고 있어요",
      distractorsHangul: ["쉬고 싶어서 일해요", "쉬고 싶고 일해요", "쉬고 싶지만 일했어요"],
      explanation: "싶다 → 싶지만 ('want, but'); 일하다 → 일하고 있어요 ('am working').",
      exercisedAtomSurfaces: ["지만", "고 있어요"],
    }),
    translateStep({
      id: "ko-m15-6-tr-mayirest",
      promptEn: "May I rest here?",
      acceptedAnswers: ["여기서 쉬어도 돼요?", "여기서 쉬어도 돼요"],
      audioText: "여기서 쉬어도 돼요?",
      exercisedAtomSurfaces: ["도 돼요"],
    }),
    listeningCompSentence({
      id: "ko-m15-6-lc-studyingbut",
      audioText: "공부하고 있지만 졸려요",
      correctMeaningEn: "I'm studying, but I'm sleepy",
      distractorsEn: ["I studied and slept", "I want to study", "I'm sleepy, so I study"],
      exercisedAtomSurfaces: ["고 있어요", "지만"],
    }),
    speaking("ko-m15-6-speak-restbutwork", "쉬고 싶지만 일하고 있어요", "I want to rest, but I'm working", ["지만", "고 있어요"]),
  ],
};

// ─── ko-m15-7 — Mini-dialogue ───────────────────────────────────────────────

const M15_7: LessonContent = {
  id: "ko-m15-7",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — at the café",
  description: "Ask what someone's doing and ask permission.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m15-7-info",
      "A café exchange",
      "A: 뭐 하고 있어요? (What are you doing?)\nB: 커피를 마시고 있어요. (I'm drinking coffee.)\nA: 여기 앉아도 돼요? (May I sit here?)\nB: 네, 돼요. (Yes, you may.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m15-7-q-drinkingcoffee",
      prompt: "'I'm drinking coffee.' —",
      correctHangul: "커피를 마시고 있어요",
      distractorsHangul: ["커피를 마셔요", "커피를 마시고 있어요?", "커피를 마셔서 있어요"],
      explanation: "마시다 → 마시고 있어요 ('am drinking').",
      exercisedAtomSurfaces: ["고 있어요", "마셔요"],
    }),
    sentenceMcq({
      id: "ko-m15-7-q-mayisit",
      prompt: "'May I sit here?' —",
      correctHangul: "여기 앉아도 돼요?",
      distractorsHangul: ["여기 앉아도 되요?", "여기 앉고 돼요?", "여기 앉어도 돼요?"],
      // NATIVE-REVIEW: 앉다 → 앉아도 (vowel harmony: ㅏ stem). 앉다 is a support
      // verb, not a registered atom — confirm it's fine at M15 and that 앉아도
      // (not 앉어도) is the correct harmony.
      explanation: "앉다 → 앉아 (ㅏ harmony) + 도 돼요?. Spelling 돼요.",
      exercisedAtomSurfaces: ["도 돼요"],
    }),
    build(
      "ko-m15-7-build-drinking",
      "Build: 'I'm drinking coffee.' (coffee + drinking)",
      "커피를 마시고 있어요",
      ["커피를", "마시고 있어요", "마셔요", "먹고 있어요"],
      ["커피를", "마시고 있어요"],
      ["고 있어요", "마셔요"],
    ),
    listeningCompSentence({
      id: "ko-m15-7-lc-mayisit",
      audioText: "여기 앉아도 돼요?",
      correctMeaningEn: "May I sit here?",
      distractorsEn: ["I'm sitting here", "I can't sit here", "Please sit here"],
      exercisedAtomSurfaces: ["도 돼요"],
    }),
    speaking("ko-m15-7-speak-drinking", "커피를 마시고 있어요", "I'm drinking coffee", ["고 있어요", "마셔요"]),
  ],
};

// ─── ko-m15-8 — Mastery test ────────────────────────────────────────────────

const M15_8: LessonContent = {
  id: "ko-m15-8",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M15 Mastery Test",
  description: "Progressive, permission, and 지만.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "ko-m15-8-q-eating",
      prompt: "'I'm eating (right now).' —",
      correctHangul: "밥을 먹고 있어요",
      distractorsHangul: ["밥을 먹어요", "밥을 먹어 있어요", "밥을 먹고 싶어요"],
      exercisedAtomSurfaces: ["밥", "고 있어요"],
    }),
    sentenceMcq({
      id: "ko-m15-8-q-mayigo",
      prompt: "'May I go?' —",
      correctHangul: "가도 돼요?",
      distractorsHangul: ["가도 되요?", "가어도 돼요?", "가고 돼요?"],
      exercisedAtomSurfaces: ["도 돼요", "가요"],
    }),
    sentenceMcq({
      id: "ko-m15-8-q-nomay",
      prompt: "Refuse permission: 'No, you may not.' —",
      correctHangul: "아니요, 안 돼요",
      distractorsHangul: ["아니요, 돼요", "네, 안 돼요", "아니요, 가도 돼요"],
      exercisedAtomSurfaces: ["도 돼요"],
    }),
    sentenceMcq({
      id: "ko-m15-8-q-goodbut",
      prompt: "'It's good, but it's expensive.' —",
      correctHangul: "좋지만 비싸요",
      distractorsHangul: ["좋고 비싸요", "좋아서 비싸요", "좋지만 비싸고"],
      exercisedAtomSurfaces: ["지만"],
    }),
    cloze(
      "ko-m15-8-cloze-wantbutcant",
      "가고 싶",
      "못 가요",
      "지만",
      ["지만", "고", "서", "도"],
      "I want to go, but I can't.",
      "가고 싶지만 못 가요",
      "싶다 → 싶지만.",
    ),
    listeningCompSentence({
      id: "ko-m15-8-lc-studying",
      audioText: "공부하고 있어요",
      correctMeaningEn: "I'm studying",
      distractorsEn: ["I studied", "I want to study", "I'll study"],
      exercisedAtomSurfaces: ["고 있어요"],
    }),
    speaking("ko-m15-8-speak-recap", "밥을 먹고 있어요", "I'm eating", ["밥", "고 있어요"]),
  ],
};

export const KO_M15_LESSONS: LessonContent[] = withReviewInterleave("m15", [
  M15_1,
  M15_2,
  M15_3,
  M15_4,
  M15_5,
  M15_6,
  M15_7,
  M15_8,
]);
