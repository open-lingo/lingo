/**
 * Korean Module 21 — Food, restaurants, quotation & listing.
 *
 * KO analog of JA M21 (food/restaurant vocab + と quotation + や incomplete
 * list + cup/glass counter 〜はい). Re-expressed in Korean's own grammar:
 *
 *   ko-m21-1  Food — 고기 / 생선 / 채소 / 과일 / 빵
 *   ko-m21-2  Korean dishes — 김치 / 비빔밥 / 불고기 / 라면
 *   ko-m21-3  하고 / (이)랑 — "and / with" (listing nouns)
 *   ko-m21-4  Counting cups — 잔 (커피 한 잔, 물 두 잔)
 *   ko-m21-5  (이)라고 하다 — "they say / it's called …" (quotation/naming)
 *   ko-m21-6  Putting it together — ordering at a restaurant
 *   ko-m21-7  Mini-dialogue — at a restaurant
 *   ko-m21-8  M21 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 하고 and (이)랑 both connect nouns ('and') and mark accompaniment
 *     ('with'): 빵하고 과일 = 'bread and fruit'; 친구하고 가요 = 'I go with a
 *     friend'. 하고 is neutral; (이)랑 is more casual: 이랑 after a consonant
 *     (밥이랑), 랑 after a vowel (커피랑). 와/과 is the formal written variant
 *     (mentioned, not drilled). This is the KO match to JA's や/と-listing.
 *   - Cups/glasses are counted with NATIVE numbers + 잔: 커피 한 잔 ('one cup
 *     of coffee'), 물 두 잔 ('two glasses of water'). Same pre-counter forms
 *     한/두/세/네 as 명/시/살.
 *   - (이)라고 하다 = 'is called / they say': 이거는 김치라고 해요 = 'This is
 *     called kimchi.' Naming uses (이)라고: 라고 after a vowel (김치라고),
 *     이라고 after a consonant (불고기 → 불고기라고; 비빔밥 → 비빔밥이라고).
 *     This is the KO match to JA's quotation と…いいます.
 *
 * Builds on: 먹다/마시다 (eat/drink), 친구 (M3), 좋아하다 (M16). 김치/비빔밥
 * appear in the KO food side-quest — treated as recognition vocab here.
 * NATIVE-REVIEW flags inline.
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

// ─── ko-m21-1 — Food categories ─────────────────────────────────────────────

const M21_1: LessonContent = {
  id: "ko-m21-1",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Food — 고기, 생선, 채소, 과일",
  description: "Meat, fish, vegetables, fruit, bread.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m21-1-info",
      "Food groups",
      "고기 = 'meat', 생선 = 'fish' (the food; the live animal is 물고기), 채소 = 'vegetables', 과일 = 'fruit', 빵 = 'bread'. You already know 먹다 ('eat'): 과일을 먹어요 = 'I eat fruit.'",
      "default",
    ),
    phrase("ko-m21-1-p-meat", "meat", "gogi", "고기", undefined, { emoji: "🥩" }),
    phrase("ko-m21-1-p-fish", "fish (food)", "saengseon", "생선", undefined, { emoji: "🐟" }),
    phrase("ko-m21-1-p-veg", "vegetables", "chaeso", "채소", undefined, { emoji: "🥬" }),
    phrase("ko-m21-1-p-fruit", "fruit", "gwail", "과일", undefined, { emoji: "🍎" }),
    phrase("ko-m21-1-p-bread", "bread", "ppang", "빵", undefined, { emoji: "🍞" }),
    sentenceMcq({
      id: "ko-m21-1-q-meat",
      prompt: "Which means 'meat'?",
      correctHangul: "고기",
      distractorsHangul: ["생선", "채소", "과일"],
      explanation: "고기 = meat. 생선 = fish.",
      exercisedAtomSurfaces: ["고기"],
    }),
    sentenceMcq({
      id: "ko-m21-1-q-fruit",
      prompt: "Which means 'fruit'?",
      correctHangul: "과일",
      distractorsHangul: ["채소", "빵", "고기"],
      explanation: "과일 = fruit. 채소 = vegetables.",
      exercisedAtomSurfaces: ["과일"],
    }),
    listeningCompSentence({
      id: "ko-m21-1-lc-bread",
      audioText: "빵",
      correctMeaningEn: "bread",
      distractorsEn: ["meat", "fruit", "fish"],
      exercisedAtomSurfaces: ["빵"],
    }),
    speaking("ko-m21-1-speak-veg", "채소", "vegetables", ["채소"]),
  ],
};

// ─── ko-m21-2 — Korean dishes ───────────────────────────────────────────────

const M21_2: LessonContent = {
  id: "ko-m21-2",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Dishes — 김치, 비빔밥, 불고기, 라면",
  description: "Famous Korean dishes.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m21-2-info",
      "On the menu",
      "김치 (kimchi, fermented cabbage), 비빔밥 (bibimbap, rice with vegetables), 불고기 (bulgogi, marinated grilled beef), 라면 (ramyeon, instant noodles). These are the dishes you'll order in the next lessons.",
      "default",
    ),
    phrase("ko-m21-2-p-kimchi", "kimchi", "gimchi", "김치", undefined, { emoji: "🥬" }),
    phrase("ko-m21-2-p-bibimbap", "bibimbap", "bibimbap", "비빔밥", undefined, { emoji: "🍲" }),
    phrase("ko-m21-2-p-bulgogi", "bulgogi (grilled beef)", "bulgogi", "불고기", undefined, { emoji: "🥩" }),
    phrase("ko-m21-2-p-ramyeon", "ramyeon (noodles)", "ramyeon", "라면", undefined, { emoji: "🍜" }),
    sentenceMcq({
      id: "ko-m21-2-q-bibimbap",
      prompt: "Which is 'bibimbap'?",
      correctHangul: "비빔밥",
      distractorsHangul: ["불고기", "김치", "라면"],
      explanation: "비빔밥 = bibimbap (mixed rice).",
      exercisedAtomSurfaces: ["비빔밥"],
    }),
    sentenceMcq({
      id: "ko-m21-2-q-noodles",
      prompt: "Which is the noodle dish?",
      correctHangul: "라면",
      distractorsHangul: ["김치", "비빔밥", "불고기"],
      explanation: "라면 = ramyeon (noodles).",
      exercisedAtomSurfaces: ["라면"],
    }),
    listeningCompSentence({
      id: "ko-m21-2-lc-bulgogi",
      audioText: "불고기",
      correctMeaningEn: "bulgogi (grilled beef)",
      distractorsEn: ["kimchi", "bibimbap", "ramyeon"],
      exercisedAtomSurfaces: ["불고기"],
    }),
    speaking("ko-m21-2-speak-kimchi", "김치", "kimchi", ["김치"]),
  ],
};

// ─── ko-m21-3 — 하고 / (이)랑 (and / with) ──────────────────────────────────

const M21_3: LessonContent = {
  id: "ko-m21-3",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "하고 / (이)랑 — and / with",
  description: "List two nouns or say who you're with.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m21-3-info",
      "Connecting nouns: 하고 and (이)랑",
      "To join nouns ('A and B') use 하고 or the more casual (이)랑: 빵하고 과일 = 'bread and fruit', 빵이랑 과일 = same, casual. (이)랑 splits by the last letter: 이랑 after a consonant (밥이랑), 랑 after a vowel (커피랑). Both also mean 'with': 친구하고 가요 = 'I go with a friend.' (The formal written form is 와/과 — you'll meet it later.)",
      "grammar",
    ),
    phrase("ko-m21-3-p-hago", "and / with", "hago", "하고"),
    phrase("ko-m21-3-p-rang", "and / with (casual, after vowel)", "rang", "랑"),
    sentenceMcq({
      id: "ko-m21-3-q-breadfruit",
      prompt: "'bread and fruit' —",
      correctHangul: "빵하고 과일",
      distractorsHangul: ["빵을 과일", "빵에 과일", "빵하고에 과일"],
      explanation: "하고 connects two nouns: 빵하고 과일.",
      exercisedAtomSurfaces: ["빵", "과일", "하고"],
    }),
    cloze(
      "ko-m21-3-cloze-coffeerang",
      "커피",
      "물을 마셔요",
      "랑",
      ["랑", "이랑", "을", "에"],
      "I drink coffee and water.",
      "커피랑 물을 마셔요",
      "커피 ends in a vowel → 랑 (이랑 is for consonants).",
    ),
    sentenceMcq({
      id: "ko-m21-3-q-withfriend",
      prompt: "'I go with a friend.' —",
      correctHangul: "친구하고 가요",
      distractorsHangul: ["친구를 가요", "친구에 가요", "친구하고를 가요"],
      explanation: "하고 also means 'with': 친구하고 가요.",
      exercisedAtomSurfaces: ["친구", "하고", "가요"],
    }),
    listeningCompSentence({
      id: "ko-m21-3-lc-breadfruit",
      audioText: "빵하고 과일을 먹어요",
      correctMeaningEn: "I eat bread and fruit",
      distractorsEn: ["I eat bread or fruit", "I go with bread", "I drink coffee and water"],
      exercisedAtomSurfaces: ["빵", "과일"],
    }),
    speaking("ko-m21-3-speak-withfriend", "친구하고 가요", "I go with a friend", ["친구", "하고", "가요"]),
  ],
};

// ─── ko-m21-4 — Counting cups (잔) ──────────────────────────────────────────

const M21_4: LessonContent = {
  id: "ko-m21-4",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Counting drinks — 잔",
  description: "커피 한 잔, 물 두 잔: count cups and glasses.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m21-4-info",
      "Native numbers + 잔",
      "Cups and glasses are counted with NATIVE numbers + 잔: 커피 한 잔 ('one cup of coffee'), 물 두 잔 ('two glasses of water'), 차 세 잔 ('three cups of tea'). Word order is [drink] [number] 잔. Same short pre-counter forms 한/두/세/네 you've used for 명, 시, 살.",
      "grammar",
    ),
    phrase("ko-m21-4-p-jan", "(counter for cups/glasses)", "jan", "잔"),
    sentenceMcq({
      id: "ko-m21-4-q-onecoffee",
      prompt: "'one cup of coffee' —",
      correctHangul: "커피 한 잔",
      distractorsHangul: ["커피 하나 잔", "커피 한 개", "커피 한 명"],
      explanation: "한 (pre-counter form) + 잔 for cups. 개 = objects, 명 = people.",
      exercisedAtomSurfaces: ["커피", "잔"],
    }),
    cloze(
      "ko-m21-4-cloze-twowater",
      "물 두",
      "주세요",
      "잔",
      ["잔", "개", "명", "병"],
      "Two glasses of water, please.",
      "물 두 잔 주세요",
      "잔 counts cups/glasses.",
    ),
    sentenceMcq({
      id: "ko-m21-4-q-threetea",
      prompt: "'three cups of tea' —",
      correctHangul: "차 세 잔",
      distractorsHangul: ["차 셋 잔", "차 삼 잔", "차 세 개"],
      explanation: "세 (pre-counter form of 셋) + 잔.",
      exercisedAtomSurfaces: ["차", "잔"],
    }),
    listeningCompSentence({
      id: "ko-m21-4-lc-onecoffee",
      audioText: "커피 한 잔 주세요",
      correctMeaningEn: "One cup of coffee, please",
      distractorsEn: ["One person, please", "Two cups of coffee, please", "One coffee bottle, please"],
      exercisedAtomSurfaces: ["커피", "잔"],
    }),
    speaking("ko-m21-4-speak-onecoffee", "커피 한 잔 주세요", "One cup of coffee, please", ["커피", "잔"]),
  ],
};

// ─── ko-m21-5 — (이)라고 하다 (quotation/naming) ────────────────────────────

const M21_5: LessonContent = {
  id: "ko-m21-5",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(이)라고 하다 — it's called …",
  description: "Name things and report what they're called.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m21-5-info",
      "(이)라고 해요 — 'it's called …'",
      "To say what something is called, attach (이)라고 to the name + 해요 ('say/do'): 이거는 김치라고 해요 = 'This is called kimchi.' Split by the last letter: 라고 after a vowel (김치라고), 이라고 after a consonant (불고기 → 불고기라고; 비빔밥 → 비빔밥이라고). This is also how you report a name: 이름이 민수라고 해요 = '(My) name is Minsu.'",
      "grammar",
    ),
    phrase("ko-m21-5-p-rago", "(it's) called / they say", "(i)rago haeyo", "(이)라고 해요"),
    sentenceMcq({
      id: "ko-m21-5-q-calledkimchi",
      prompt: "'This is called kimchi.' —",
      correctHangul: "이거는 김치라고 해요",
      distractorsHangul: ["이거는 김치이라고 해요", "이거는 김치라고 가요", "이거를 김치라고 해요"],
      // NATIVE-REVIEW: 김치 ends in a vowel → 김치라고 (not 김치이라고). 이거는
      // 김치라고 해요 is natural. Confirm topic 이거는 reads well vs object 이거를.
      explanation: "김치 (vowel) → 김치라고; the verb is 해요 ('say').",
      exercisedAtomSurfaces: ["김치"],
    }),
    cloze(
      "ko-m21-5-cloze-calledbibimbap",
      "이거는 비빔밥",
      "해요",
      "이라고",
      ["이라고", "라고", "하고", "에"],
      "This is called bibimbap.",
      "이거는 비빔밥이라고 해요",
      "비빔밥 ends in a consonant (ㅂ) → 비빔밥이라고.",
    ),
    sentenceMcq({
      id: "ko-m21-5-q-namedminsu",
      prompt: "'(My) name is Minsu.' (lit. 'is called Minsu') —",
      correctHangul: "이름이 민수라고 해요",
      distractorsHangul: ["이름이 민수이라고 해요", "이름을 민수라고 해요", "이름이 민수라고 가요"],
      // NATIVE-REVIEW: 민수 (a common male given name) ends in a vowel →
      // 민수라고. 이름이 민수라고 해요 is a natural way to report a name.
      // Confirm 이름이 vs 이름은 here (both heard; 이름이 authored).
      explanation: "민수 (vowel) → 민수라고; 해요 = 'say/call'.",
      exercisedAtomSurfaces: [],
    }),
    listeningCompSentence({
      id: "ko-m21-5-lc-calledkimchi",
      audioText: "이거는 김치라고 해요",
      correctMeaningEn: "This is called kimchi",
      distractorsEn: ["This is kimchi and rice", "Please give me kimchi", "I like kimchi"],
      exercisedAtomSurfaces: ["김치"],
    }),
    speaking("ko-m21-5-speak-calledkimchi", "이거는 김치라고 해요", "This is called kimchi", ["김치"]),
  ],
};

// ─── ko-m21-6 — Putting it together ─────────────────────────────────────────

const M21_6: LessonContent = {
  id: "ko-m21-6",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Ordering food",
  description: "Combine dishes, 하고, 잔, and 주세요.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m21-6-info",
      "Putting in an order",
      "비빔밥하고 라면 주세요 = 'Bibimbap and ramyeon, please.' 물 두 잔 주세요 = 'Two glasses of water, please.' Stack the M21 listing 하고, the 잔 counter, and the M14 주세요 ('please give').",
      "default",
    ),
    build(
      "ko-m21-6-build-orderdishes",
      "Build: 'Bibimbap and ramyeon, please.' (bibimbap-and + ramyeon + please-give)",
      "비빔밥하고 라면 주세요",
      ["비빔밥하고", "라면", "주세요", "두 잔"],
      ["비빔밥하고", "라면", "주세요"],
      ["비빔밥", "라면", "하고"],
    ),
    sentenceMcq({
      id: "ko-m21-6-q-twowater",
      prompt: "'Two glasses of water, please.' —",
      correctHangul: "물 두 잔 주세요",
      distractorsHangul: ["물 두 개 주세요", "물 둘 잔 주세요", "물 두 명 주세요"],
      explanation: "잔 counts glasses; 두 is the pre-counter form.",
      exercisedAtomSurfaces: ["잔"],
    }),
    translateStep({
      id: "ko-m21-6-tr-meatfruit",
      promptEn: "I eat meat and fruit.",
      acceptedAnswers: ["고기하고 과일을 먹어요", "고기하고 과일을 먹어요.", "고기랑 과일을 먹어요"],
      audioText: "고기하고 과일을 먹어요",
      exercisedAtomSurfaces: ["고기", "과일"],
    }),
    listeningCompSentence({
      id: "ko-m21-6-lc-orderdishes",
      audioText: "비빔밥하고 라면 주세요",
      correctMeaningEn: "Bibimbap and ramyeon, please",
      distractorsEn: ["Bibimbap or ramyeon, please", "Two bibimbap, please", "Kimchi and rice, please"],
      exercisedAtomSurfaces: ["비빔밥", "라면"],
    }),
    speaking("ko-m21-6-speak-orderdishes", "비빔밥하고 라면 주세요", "Bibimbap and ramyeon, please", ["비빔밥", "라면", "하고"]),
  ],
};

// ─── ko-m21-7 — Mini-dialogue ───────────────────────────────────────────────

const M21_7: LessonContent = {
  id: "ko-m21-7",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — at a restaurant",
  description: "Order a meal and a drink.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m21-7-info",
      "A restaurant order",
      "직원 (staff): 뭐 드릴까요? (What can I get you?)\nYou: 비빔밥하고 커피 한 잔 주세요. (Bibimbap and one coffee, please.)\n직원: 이거는 김치라고 해요. 드셔 보세요. (This is called kimchi. Please try it.)\nYou: 감사합니다. (Thank you.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m21-7-q-orderbibimcoffee",
      prompt: "'Bibimbap and one coffee, please.' —",
      correctHangul: "비빔밥하고 커피 한 잔 주세요",
      distractorsHangul: ["비빔밥하고 커피 한 개 주세요", "비빔밥을 커피 한 잔 주세요", "비빔밥하고 커피 한 명 주세요"],
      explanation: "하고 lists the two; 잔 counts the coffee.",
      exercisedAtomSurfaces: ["비빔밥", "커피", "잔"],
    }),
    sentenceMcq({
      id: "ko-m21-7-q-calledkimchi",
      prompt: "'This is called kimchi.' —",
      correctHangul: "이거는 김치라고 해요",
      distractorsHangul: ["이거는 김치이라고 해요", "이거는 김치라고 가요", "이거를 김치라고 해요"],
      explanation: "김치 (vowel) → 김치라고 해요.",
      exercisedAtomSurfaces: ["김치"],
    }),
    build(
      "ko-m21-7-build-onewater",
      "Build: 'One glass of water, please.' (water + one + cup-counter + please-give)",
      "물 한 잔 주세요",
      ["물", "한", "잔", "주세요", "개"],
      ["물", "한", "잔", "주세요"],
      ["잔"],
    ),
    listeningCompSentence({
      id: "ko-m21-7-lc-orderbibimcoffee",
      audioText: "비빔밥하고 커피 한 잔 주세요",
      correctMeaningEn: "Bibimbap and one coffee, please",
      distractorsEn: ["Bibimbap and two coffees, please", "Ramyeon and one coffee, please", "Bibimbap or coffee, please"],
      exercisedAtomSurfaces: ["비빔밥", "커피", "잔"],
    }),
    speaking("ko-m21-7-speak-orderbibimcoffee", "비빔밥하고 커피 한 잔 주세요", "Bibimbap and one coffee, please", ["비빔밥", "커피", "잔"]),
  ],
};

// ─── ko-m21-8 — Mastery test ────────────────────────────────────────────────

const M21_8: LessonContent = {
  id: "ko-m21-8",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M21 Mastery Test",
  description: "Food, 하고/(이)랑, the 잔 counter, and (이)라고 하다.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m21-8-q-meat",
      prompt: "Which means 'meat'?",
      correctHangul: "고기",
      distractorsHangul: ["생선", "채소", "빵"],
      exercisedAtomSurfaces: ["고기"],
    }),
    sentenceMcq({
      id: "ko-m21-8-q-breadfruit",
      prompt: "'bread and fruit' —",
      correctHangul: "빵하고 과일",
      distractorsHangul: ["빵을 과일", "빵에 과일", "빵하고에 과일"],
      exercisedAtomSurfaces: ["빵", "과일", "하고"],
    }),
    sentenceMcq({
      id: "ko-m21-8-q-onecoffee",
      prompt: "'one cup of coffee' —",
      correctHangul: "커피 한 잔",
      distractorsHangul: ["커피 한 개", "커피 하나 잔", "커피 한 명"],
      exercisedAtomSurfaces: ["커피", "잔"],
    }),
    cloze(
      "ko-m21-8-cloze-twowater",
      "물 두",
      "주세요",
      "잔",
      ["잔", "개", "명", "병"],
      "Two glasses of water, please.",
      "물 두 잔 주세요",
      "잔 counts glasses.",
    ),
    sentenceMcq({
      id: "ko-m21-8-q-calledkimchi",
      prompt: "'This is called kimchi.' —",
      correctHangul: "이거는 김치라고 해요",
      distractorsHangul: ["이거는 김치이라고 해요", "이거는 김치라고 가요", "이거를 김치라고 해요"],
      exercisedAtomSurfaces: ["김치"],
    }),
    listeningCompSentence({
      id: "ko-m21-8-lc-orderdishes",
      audioText: "비빔밥하고 라면 주세요",
      correctMeaningEn: "Bibimbap and ramyeon, please",
      distractorsEn: ["Bibimbap or ramyeon, please", "Two bibimbap, please", "Kimchi and rice, please"],
      exercisedAtomSurfaces: ["비빔밥", "라면"],
    }),
    speaking("ko-m21-8-speak-recap", "물 두 잔 주세요", "Two glasses of water, please", ["잔"]),
  ],
};

export const KO_M21_LESSONS: LessonContent[] = [
  M21_1,
  M21_2,
  M21_3,
  M21_4,
  M21_5,
  M21_6,
  M21_7,
  M21_8,
];
