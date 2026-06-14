/**
 * Korean Module 25 — Plans & intentions.
 *
 * KO analog of JA M25 (つもり intend-to + にいく go-to-do + ことがある
 * experience + とき when). Re-expressed in Korean's own grammar:
 *
 *   ko-m25-1  Travel vocab I — 여행 / 계획 / 출발 / 도착 / 외국
 *   ko-m25-2  Event vocab II — 온천 / 축제 / 결혼 / 졸업
 *   ko-m25-3  (으)려고 하다 — intend to / plan to
 *   ko-m25-4  (으)러 가다 — go (in order) to do
 *   ko-m25-5  (으)ㄴ 적이 있다 / 없다 — have / have never (experience)
 *   ko-m25-6  (으)ㄹ 때 / 았을 때 — when (doing / when did)
 *   ko-m25-7  Mini-dialogue — planning a trip
 *   ko-m25-8  M25 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - (으)려고 하다 = 'intend to / be about to (do)'. Attaches to the verb
 *     stem: 가다 → 가려고 해요 ('I intend to go'); 먹다 → 먹으려고 해요. The
 *     final verb is usually 하다 ('to do/intend'). This is the KO match to
 *     JA's つもりです. (으)려고 also stands alone as a purpose linker
 *     ('in order to'), but here we teach the intention reading 〜려고 하다.
 *   - (으)러 가다 = 'go IN ORDER to (do)' — purpose of movement, the exact
 *     match to JA にいく. Stem + (으)러 + 가다/오다: 밥을 먹으러 가요 ('I go
 *     to eat'); 영화를 보러 가요 ('I go to watch a movie'). After a vowel
 *     stem → 러 (보러); after a consonant stem → 으러 (먹으러). Pairs with
 *     가다 (go), 오다 (come), 다니다 (commute).
 *   - (으)ㄴ 적이 있다 = 'have (done) before' — lifetime EXPERIENCE; (으)ㄴ
 *     적이 없다 = 'have never (done)'. Past-modifier + 적 (occasion) + 이
 *     있다/없다: 일본에 간 적이 있어요 ('I've been to Japan'); 먹은 적이
 *     없어요 ('I've never eaten it'). After a vowel stem → ㄴ (간); after a
 *     consonant stem → 은 (먹은). Match to JA ことがあります.
 *   - (으)ㄹ 때 = 'when (doing X)' [present/general]; 았/었을 때 = 'when X
 *     happened / after X' [past]. 때 = 'time/occasion'. 갈 때 ('when
 *     going'); 갔을 때 ('when I went'). With nouns: 〜때 directly (방학 때
 *     'during the break'). Match to JA とき, including the tense contrast.
 *
 * Vocab: 여행 (travel), 계획 (plan), 출발 (departure), 도착 (arrival),
 *   외국 (foreign country), 온천 (hot spring), 축제 (festival),
 *   결혼 (marriage), 졸업 (graduation). Reuses 일본/한국 names implied,
 *   먹다/보다/가다 (M7), 친구 (M3), 병원 (M6). NATIVE-REVIEW flags inline.
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
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// ─── ko-m25-1 — Travel vocab I ──────────────────────────────────────────────

const M25_1: LessonContent = {
  id: "ko-m25-1",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Travel — 여행, 계획, 출발, 도착",
  description: "Travel, plan, departure, arrival, foreign country.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m25-1-info",
      "Talking about plans and journeys",
      "여행 = 'travel/trip' (여행을 가요 'I go on a trip'). 계획 = 'a plan' (계획이 있어요 'I have a plan'). 출발 = 'departure' (출발해요 'I depart'). 도착 = 'arrival' (도착해요 'I arrive'). 외국 = 'foreign country' (외국에 가요 'I go abroad'). 출발 and 도착 are opposites — leaving vs reaching.",
      "default",
    ),
    phrase("ko-m25-1-p-travel", "travel / trip", "yeohaeng", "여행", undefined, { emoji: "✈️" }),
    phrase("ko-m25-1-p-plan", "plan", "gyehoek", "계획", undefined, { emoji: "📋" }),
    phrase("ko-m25-1-p-departure", "departure", "chulbal", "출발", undefined, { emoji: "🛫" }),
    phrase("ko-m25-1-p-arrival", "arrival", "dochak", "도착", undefined, { emoji: "🛬" }),
    phrase("ko-m25-1-p-foreign", "foreign country", "oeguk", "외국", undefined, { emoji: "🌏" }),
    sentenceMcq({
      id: "ko-m25-1-q-travel",
      prompt: "Which means 'travel / trip'?",
      correctHangul: "여행",
      distractorsHangul: ["계획", "출발", "외국"],
      explanation: "여행 = travel / trip.",
      exercisedAtomSurfaces: ["여행"],
    }),
    sentenceMcq({
      id: "ko-m25-1-q-departure",
      prompt: "Which means 'departure'?",
      correctHangul: "출발",
      distractorsHangul: ["도착", "여행", "계획"],
      explanation: "출발 = departure (leaving). 도착 = arrival.",
      exercisedAtomSurfaces: ["출발"],
    }),
    listeningCompSentence({
      id: "ko-m25-1-lc-arrival",
      audioText: "도착",
      correctMeaningEn: "arrival",
      distractorsEn: ["departure", "a plan", "travel"],
      exercisedAtomSurfaces: ["도착"],
    }),
    speaking("ko-m25-1-speak-foreign", "외국", "foreign country", ["외국"]),
  ],
};

// ─── ko-m25-2 — Event vocab II ──────────────────────────────────────────────

const M25_2: LessonContent = {
  id: "ko-m25-2",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Events — 온천, 축제, 결혼, 졸업",
  description: "Hot spring, festival, marriage, graduation.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m25-2-info",
      "Life events and outings",
      "온천 = 'a hot spring' (온천에 가요 'I go to a hot spring'). 축제 = 'a festival' (축제가 있어요 'there's a festival'). 결혼 = 'marriage' (결혼해요 'I get married'). 졸업 = 'graduation' (졸업해요 'I graduate'). 결혼 and 졸업 both pair with 하다 to become verbs.",
      "default",
    ),
    phrase("ko-m25-2-p-hotspring", "hot spring", "oncheon", "온천", undefined, { emoji: "♨️" }),
    phrase("ko-m25-2-p-festival", "festival", "chukje", "축제", undefined, { emoji: "🎆" }),
    phrase("ko-m25-2-p-marriage", "marriage", "gyeolhon", "결혼", undefined, { emoji: "💍" }),
    phrase("ko-m25-2-p-graduation", "graduation", "joreop", "졸업", undefined, { emoji: "🎓" }),
    sentenceMcq({
      id: "ko-m25-2-q-festival",
      prompt: "Which means 'festival'?",
      correctHangul: "축제",
      distractorsHangul: ["온천", "결혼", "졸업"],
      explanation: "축제 = festival.",
      exercisedAtomSurfaces: ["축제"],
    }),
    sentenceMcq({
      id: "ko-m25-2-q-marriage",
      prompt: "'I get married.' —",
      correctHangul: "결혼해요",
      distractorsHangul: ["졸업해요", "결혼이에요", "결혼할까요"],
      // NATIVE-REVIEW: 결혼하다 → 결혼해요 ('get married', present/near-future).
      // Confirm 결혼해요 reads naturally as a stated plan/event here.
      explanation: "결혼 + 해요 = get married. 졸업해요 = graduate.",
      exercisedAtomSurfaces: ["결혼"],
    }),
    listeningCompSentence({
      id: "ko-m25-2-lc-hotspring",
      audioText: "온천에 가요",
      correctMeaningEn: "I go to a hot spring",
      distractorsEn: ["I go to a festival", "I graduate", "I get married"],
      exercisedAtomSurfaces: ["온천"],
    }),
    speaking("ko-m25-2-speak-graduation", "졸업", "graduation", ["졸업"]),
  ],
};

// ─── ko-m25-3 — (으)려고 하다 (intend to) ────────────────────────────────────

const M25_3: LessonContent = {
  id: "ko-m25-3",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)려고 하다 — intend to / plan to",
  description: "State what you intend or plan to do.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m25-3-info",
      "(으)려고 해요 — 'I intend to / I'm going to'",
      "(으)려고 하다 = 'intend to / plan to (do)'. Attach to the verb stem; the final verb is 하다: 가다 → 가려고 해요 ('I intend to go'); 먹다 → 먹으려고 해요. After a VOWEL stem → 려고 (가려고); after a CONSONANT → 으려고 (먹으려고). Use it for a personal plan or intention — stronger than 'maybe', softer than a promise. (KO match to JA つもりです.)",
      "grammar",
    ),
    phrase("ko-m25-3-p-intend", "intend to (after vowel)", "-ryeogo haeyo", "려고 해요"),
    phrase("ko-m25-3-p-intend-c", "intend to (after consonant)", "-euryeogo haeyo", "으려고 해요"),
    sentenceMcq({
      id: "ko-m25-3-q-intendgo",
      prompt: "'I intend to go to Japan.' —",
      correctHangul: "일본에 가려고 해요",
      distractorsHangul: ["일본에 가으려고 해요", "일본에 갈 줄 해요", "일본에 가려고 해요보다"],
      // NATIVE-REVIEW: 가다 is a vowel stem → 가려고 해요 (NOT 가으려고).
      // Confirm 일본에 가려고 해요 reads as a natural stated intention.
      explanation: "가다 (vowel stem) → 가려고 해요. The 으 only appears after a consonant stem.",
      exercisedAtomSurfaces: ["여행"],
    }),
    cloze(
      "ko-m25-3-cloze-intendeat",
      "내일 한국 음식을 먹",
      "해요",
      "으려고",
      ["으려고", "려고", "러", "거나"],
      "I intend to eat Korean food tomorrow.",
      "내일 한국 음식을 먹으려고 해요",
      "먹다 (consonant stem) → 먹으려고 해요.",
    ),
    sentenceMcq({
      id: "ko-m25-3-q-intendtravel",
      prompt: "'I plan to travel next year.' —",
      correctHangul: "내년에 여행하려고 해요",
      distractorsHangul: ["내년에 여행한 적이 있어요", "내년에 여행하러 가요", "내년에 여행하려고 해요보다"],
      // NATIVE-REVIEW: 여행하다 → 여행하려고 해요. Confirm 내년 ('next year',
      // earlier module) + 여행하려고 해요 is natural for a stated plan.
      explanation: "하다 stem → 하려고 해요 = 'plan to do'.",
      exercisedAtomSurfaces: ["여행"],
    }),
    listeningCompSentence({
      id: "ko-m25-3-lc-intendgo",
      audioText: "외국에 가려고 해요",
      correctMeaningEn: "I intend to go abroad",
      distractorsEn: ["I went abroad", "I've been abroad before", "I go abroad to study"],
      exercisedAtomSurfaces: ["외국"],
    }),
    speaking("ko-m25-3-speak-intendgo", "일본에 가려고 해요", "I intend to go to Japan", ["여행"]),
  ],
};

// ─── ko-m25-4 — (으)러 가다 (go to do) ───────────────────────────────────────

const M25_4: LessonContent = {
  id: "ko-m25-4",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)러 가다 — go (in order) to do",
  description: "Say where you're going and why.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m25-4-info",
      "(으)러 가요 — 'I go (in order) to …'",
      "(으)러 가다 = 'go IN ORDER to (do)' — the purpose of moving. Stem + (으)러 + 가다/오다: 밥을 먹으러 가요 ('I go to eat'); 영화를 보러 가요 ('I go to watch a movie'). After a VOWEL stem → 러 (보러); after a CONSONANT → 으러 (먹으러). Pairs with 가다 (go), 오다 (come), 다니다 (commute). (KO match to JA にいく.)",
      "grammar",
    ),
    phrase("ko-m25-4-p-goto", "(in order) to … go (after vowel)", "-reo gayo", "러 가요"),
    phrase("ko-m25-4-p-goto-c", "(in order) to … go (after consonant)", "-eureo gayo", "으러 가요"),
    sentenceMcq({
      id: "ko-m25-4-q-gotowatch",
      prompt: "'I go to watch a movie.' —",
      correctHangul: "영화를 보러 가요",
      distractorsHangul: ["영화를 보으러 가요", "영화를 보려고 가요", "영화를 보러 가요보다"],
      // NATIVE-REVIEW: 보다 is a vowel stem → 보러 (NOT 보으러). Confirm
      // 영화를 보러 가요 is the natural 'go to watch a movie'.
      explanation: "보다 (vowel stem) → 보러 가요. 으러 only appears after a consonant stem.",
      exercisedAtomSurfaces: ["영화"],
    }),
    cloze(
      "ko-m25-4-cloze-gotoeat",
      "밥을 먹",
      "가요",
      "으러",
      ["으러", "러", "려고", "거나"],
      "I go to eat.",
      "밥을 먹으러 가요",
      "먹다 (consonant stem) → 먹으러 가요.",
    ),
    sentenceMcq({
      id: "ko-m25-4-q-gotohotspring",
      prompt: "'I go to a hot spring (to bathe / relax).' —",
      correctHangul: "온천에 가요",
      distractorsHangul: ["온천을 가요", "온천에 간 적이 있어요", "온천에 가러 가요"],
      // NATIVE-REVIEW: with a place noun, 온천에 가요 ('go to a hot spring')
      // uses 에 (destination). The last distractor doubles 가 awkwardly.
      explanation: "에 marks the destination: 온천에 가요 = 'go to a hot spring'.",
      exercisedAtomSurfaces: ["온천"],
    }),
    listeningCompSentence({
      id: "ko-m25-4-lc-gotostudy",
      audioText: "공부하러 가요",
      correctMeaningEn: "I go to study",
      distractorsEn: ["I intend to study", "I've studied before", "I study at home"],
      exercisedAtomSurfaces: ["공부"],
    }),
    speaking("ko-m25-4-speak-gotoeat", "밥을 먹으러 가요", "I go to eat", []),
  ],
};

// ─── ko-m25-5 — (으)ㄴ 적이 있다 / 없다 (experience) ─────────────────────────

const M25_5: LessonContent = {
  id: "ko-m25-5",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㄴ 적이 있다 — have you ever",
  description: "Talk about lifetime experiences.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m25-5-info",
      "(으)ㄴ 적이 있어요 / 없어요",
      "(으)ㄴ 적이 있다 = 'have (done X) before' — lifetime EXPERIENCE; (으)ㄴ 적이 없다 = 'have never (done X)'. Past-modifier on the verb + 적 ('occasion') + 이 있다/없다: 일본에 간 적이 있어요 ('I've been to Japan'); 먹은 적이 없어요 ('I've never eaten it'). After a VOWEL stem → ㄴ (간); after a CONSONANT → 은 (먹은). (KO match to JA ことがあります.)",
      "grammar",
    ),
    phrase("ko-m25-5-p-have", "have (done) before (after vowel)", "-n jeogi isseoyo", "ㄴ 적이 있어요"),
    phrase("ko-m25-5-p-never", "have never (done) (after vowel)", "-n jeogi eopseoyo", "ㄴ 적이 없어요"),
    sentenceMcq({
      id: "ko-m25-5-q-beenjapan",
      prompt: "'I've been to Japan.' —",
      correctHangul: "일본에 간 적이 있어요",
      distractorsHangul: ["일본에 가는 적이 있어요", "일본에 갈 적이 있어요", "일본에 간 적이 있어요보다"],
      // NATIVE-REVIEW: experience uses the PAST modifier 간 (from 가다), not
      // 가는/갈. Confirm 일본에 간 적이 있어요 reads as 'I have been to Japan'.
      explanation: "가다 → past modifier 간 + 적이 있어요. 가는 (present) / 갈 (future) don't mark past experience.",
      exercisedAtomSurfaces: ["외국"],
    }),
    cloze(
      "ko-m25-5-cloze-eatensushi",
      "초밥을 먹은",
      "있어요",
      "적이",
      ["적이", "때", "거나", "려고"],
      "I have eaten sushi before.",
      "초밥을 먹은 적이 있어요",
      "먹다 → 먹은 (past modifier) + 적이 있어요 = 'have eaten before'.",
    ),
    sentenceMcq({
      id: "ko-m25-5-q-neverhotspring",
      prompt: "'I've never been to a hot spring.' —",
      correctHangul: "온천에 간 적이 없어요",
      distractorsHangul: ["온천에 간 적이 있어요", "온천에 가는 적이 없어요", "온천에 갈 적이 없어요"],
      explanation: "없어요 = 'have never'. 간 적이 없어요 = 'have never gone'.",
      exercisedAtomSurfaces: ["온천"],
    }),
    listeningCompSentence({
      id: "ko-m25-5-lc-beentofestival",
      audioText: "축제에 간 적이 있어요",
      correctMeaningEn: "I have been to a festival",
      distractorsEn: ["I've never been to a festival", "I'm going to a festival", "I go to festivals often"],
      exercisedAtomSurfaces: ["축제"],
    }),
    speaking("ko-m25-5-speak-beenjapan", "일본에 간 적이 있어요", "I have been to Japan", ["외국"]),
  ],
};

// ─── ko-m25-6 — (으)ㄹ 때 / 았을 때 (when) ──────────────────────────────────

const M25_6: LessonContent = {
  id: "ko-m25-6",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㄹ 때 — when (doing / did)",
  description: "Say 'when' something happens or happened.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m25-6-info",
      "(으)ㄹ 때 vs 았/었을 때",
      "때 = 'time / when'. (으)ㄹ 때 = 'when (doing X)' [general/present]: 여행할 때 ('when traveling'). 았/었을 때 = 'when X happened / after X' [past]: 도착했을 때 ('when I arrived'). The tense BEFORE 때 sets it: 갈 때 = before/while going; 갔을 때 = after arriving. With a noun, 때 attaches directly: 방학 때 ('during the break'). (KO match to JA とき.)",
      "grammar",
    ),
    phrase("ko-m25-6-p-when", "when (doing, after vowel)", "-l ttae", "ㄹ 때"),
    phrase("ko-m25-6-p-whenpast", "when (did)", "-asseul ttae", "았을 때"),
    sentenceMcq({
      id: "ko-m25-6-q-whentravel",
      prompt: "'When I travel, I take photos.' —",
      correctHangul: "여행할 때 사진을 찍어요",
      distractorsHangul: ["여행한 때 사진을 찍어요", "여행할 적이 사진을 찍어요", "여행할 때 사진을 찍어요보다"],
      // NATIVE-REVIEW: present/general 'when' → (으)ㄹ 때 (여행할 때).
      // Confirm 여행할 때 사진을 찍어요 reads natural ('when I travel, I take photos').
      explanation: "여행하다 → 여행할 때 ('when traveling'). 적이 is for experience, not 'when'.",
      exercisedAtomSurfaces: ["여행", "사진"],
    }),
    cloze(
      "ko-m25-6-cloze-whenarrived",
      "도착했",
      "친구를 만났어요",
      "을 때",
      ["을 때", "ㄹ 때", "적이", "려고"],
      "When I arrived, I met a friend.",
      "도착했을 때 친구를 만났어요",
      "Past 'when' → 았/었을 때: 도착했을 때 = 'when I arrived'.",
    ),
    sentenceMcq({
      id: "ko-m25-6-q-whenchild",
      prompt: "'When I was a child, I went to a festival.' —",
      correctHangul: "어렸을 때 축제에 갔어요",
      distractorsHangul: ["어릴 때 축제에 갔어요", "어렸을 적이 축제에 갔어요", "어렸을 때 축제에 갈 거예요"],
      // NATIVE-REVIEW: 어리다 ('be young') → 어렸을 때 ('when I was young/a
      // child'). Both 어렸을 때 and 어릴 때 occur in real speech; the past
      // 어렸을 때 best matches the English past 'when I was a child'. Confirm.
      explanation: "Past state → 어렸을 때 ('when I was young'). Then past verb 갔어요.",
      exercisedAtomSurfaces: ["축제"],
    }),
    listeningCompSentence({
      id: "ko-m25-6-lc-whentravel",
      audioText: "여행할 때 사진을 많이 찍어요",
      correctMeaningEn: "When I travel, I take a lot of photos",
      distractorsEn: ["I've traveled and taken photos", "I intend to take photos", "After traveling, I took photos"],
      exercisedAtomSurfaces: ["여행", "사진"],
    }),
    speaking("ko-m25-6-speak-whenarrived", "도착했을 때 친구를 만났어요", "When I arrived, I met a friend", []),
  ],
};

// ─── ko-m25-7 — Mini-dialogue: planning a trip ──────────────────────────────

const M25_7: LessonContent = {
  id: "ko-m25-7",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — planning a trip",
  description: "Combine intentions, purpose, and experience.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m25-7-info",
      "Trip-planning chat",
      "친구: 여행 계획이 있어요? (Do you have travel plans?)\nYou: 네, 일본에 가려고 해요. (Yes, I intend to go to Japan.)\n친구: 일본에 간 적이 있어요? (Have you been to Japan?)\nYou: 아니요. 온천에 가러 가고 싶어요. (No. I want to go to a hot spring.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m25-7-q-haveplans",
      prompt: "'Do you have travel plans?' —",
      correctHangul: "여행 계획이 있어요?",
      distractorsHangul: ["여행 계획을 있어요?", "여행 계획이 없어요?", "여행 계획이 어디예요?"],
      explanation: "계획이 있어요? = 'is there a plan?' (이 marks the subject of 있다).",
      exercisedAtomSurfaces: ["여행", "계획"],
    }),
    build(
      "ko-m25-7-build-intendgo",
      "Build: 'I intend to go to Japan.' (Japan-to + go-intend)",
      "일본에 가려고 해요",
      ["일본에", "가려고", "해요", "갔어요"],
      ["일본에", "가려고", "해요"],
      ["여행"],
    ),
    sentenceMcq({
      id: "ko-m25-7-q-beenjapan",
      prompt: "'Have you been to Japan?' —",
      correctHangul: "일본에 간 적이 있어요?",
      distractorsHangul: ["일본에 가는 적이 있어요?", "일본에 갈 적이 있어요?", "일본에 간 적이 없어요?"],
      explanation: "Past modifier 간 + 적이 있어요? = 'have you ever been?'",
      exercisedAtomSurfaces: ["외국"],
    }),
    listeningCompSentence({
      id: "ko-m25-7-lc-wanthotspring",
      audioText: "온천에 가고 싶어요",
      correctMeaningEn: "I want to go to a hot spring",
      distractorsEn: ["I've been to a hot spring", "I intend to go to a hot spring", "I go to a hot spring often"],
      exercisedAtomSurfaces: ["온천"],
    }),
    speaking("ko-m25-7-speak-haveplans", "여행 계획이 있어요?", "Do you have travel plans?", ["여행", "계획"]),
  ],
};

// ─── ko-m25-8 — Mastery test ────────────────────────────────────────────────

const M25_8: LessonContent = {
  id: "ko-m25-8",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M25 Mastery Test",
  description: "Travel vocab, 려고 하다, 으러 가다, 적이 있다, 을 때.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m25-8-q-travel",
      prompt: "Which means 'travel / trip'?",
      correctHangul: "여행",
      distractorsHangul: ["출발", "도착", "외국"],
      exercisedAtomSurfaces: ["여행"],
    }),
    sentenceMcq({
      id: "ko-m25-8-q-intendgo",
      prompt: "'I intend to go to Japan.' —",
      correctHangul: "일본에 가려고 해요",
      distractorsHangul: ["일본에 가으려고 해요", "일본에 간 적이 있어요", "일본에 가러 가요"],
      exercisedAtomSurfaces: ["여행"],
    }),
    cloze(
      "ko-m25-8-cloze-gotoeat",
      "밥을 먹",
      "가요",
      "으러",
      ["으러", "러", "려고", "거나"],
      "I go to eat.",
      "밥을 먹으러 가요",
      "먹다 (consonant stem) → 먹으러 가요.",
    ),
    sentenceMcq({
      id: "ko-m25-8-q-beenjapan",
      prompt: "'I've been to Japan.' —",
      correctHangul: "일본에 간 적이 있어요",
      distractorsHangul: ["일본에 가는 적이 있어요", "일본에 갈 적이 있어요", "일본에 간 적이 없어요"],
      exercisedAtomSurfaces: ["외국"],
    }),
    cloze(
      "ko-m25-8-cloze-whenarrived",
      "도착했",
      "친구를 만났어요",
      "을 때",
      ["을 때", "ㄹ 때", "적이", "려고"],
      "When I arrived, I met a friend.",
      "도착했을 때 친구를 만났어요",
      "Past 'when' → 았/었을 때.",
    ),
    listeningCompSentence({
      id: "ko-m25-8-lc-intendgo",
      audioText: "외국에 가려고 해요",
      correctMeaningEn: "I intend to go abroad",
      distractorsEn: ["I went abroad", "I've been abroad before", "I go abroad to study"],
      exercisedAtomSurfaces: ["외국"],
    }),
    speaking("ko-m25-8-speak-recap", "여행 계획이 있어요?", "Do you have travel plans?", ["여행", "계획"]),
  ],
};

export const KO_M25_LESSONS: LessonContent[] = [
  M25_1,
  M25_2,
  M25_3,
  M25_4,
  M25_5,
  M25_6,
  M25_7,
  M25_8,
];
