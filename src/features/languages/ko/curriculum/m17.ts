/**
 * Korean Module 17 — Transportation & directions.
 *
 * KO analog of JA M17 (で means of transport + に destination + へ direction
 * + までに deadline + まえに before). Re-expressed in Korean's own grammar:
 *
 *   ko-m17-1  Transport vocab — 버스 / 지하철 / 택시 / 기차 / 비행기
 *   ko-m17-2  (으)로 — by (means of transport)
 *   ko-m17-3  타다 / 내리다 — get on / get off (+ 을/를 for the vehicle)
 *   ko-m17-4  Directions — 왼쪽 / 오른쪽 / 똑바로
 *   ko-m17-5  까지 — (going) as far as a place
 *   ko-m17-6  Putting it together — getting somewhere
 *   ko-m17-7  Mini-dialogue — asking the way
 *   ko-m17-8  M17 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - (으)로 marks the MEANS: 버스로 가요 ('I go by bus'). After a vowel or ㄹ
 *     final → 로 (버스로, 지하철로); after another consonant → 으로 (택시로 is
 *     vowel-final so 로; a consonant-final word like 손 → 손으로 'by hand').
 *     지하철 ends in ㄹ, so it takes plain 로, NOT 으로 — a real exception.
 *   - 타다 ('to ride / get on') takes 을/를 in Korean (버스를 타요 = 'I take
 *     the bus'), unlike English 'get ON'. 내리다 ('to get off') takes 에서
 *     (버스에서 내려요).
 *   - 까지 (from M13, 'until') also marks a spatial endpoint: 역까지 걸어가요
 *     ('I walk as far as the station').
 *   - Directions: 왼쪽 (left), 오른쪽 (right), 똑바로 (straight). 'Turn left' =
 *     왼쪽으로 가세요 / 왼쪽으로 도세요.
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
  vocabMcq,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// ─── ko-m17-1 — Transport vocab ─────────────────────────────────────────────

const M17_1: LessonContent = {
  id: "ko-m17-1",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Getting around — 버스, 지하철, 택시",
  description: "Names for buses, subways, taxis, trains, planes.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m17-1-info",
      "Ways to travel",
      "버스 (bus), 지하철 (subway), 택시 (taxi), 기차 (train), 비행기 (airplane). The 지하철 ('underground iron' 地下鐵) is how most people get around Seoul.",
      "default",
    ),
    phrase("ko-m17-1-p-bus", "bus", "beoseu", "버스", undefined, { emoji: "🚌" }),
    phrase("ko-m17-1-p-subway", "subway", "jihacheol", "지하철", undefined, { emoji: "🚇" }),
    phrase("ko-m17-1-p-taxi", "taxi", "taeksi", "택시", undefined, { emoji: "🚕" }),
    phrase("ko-m17-1-p-plane", "airplane", "bihaenggi", "비행기", undefined, { emoji: "✈️" }),
    vocabMcq(
      "ko-m17-1-vmcq-subway",
      { surface: "지하철", meaningEn: "subway", emoji: "🚇" },
      [
        { surface: "버스", emoji: "🚌" },
        { surface: "택시", emoji: "🚕" },
        { surface: "비행기", emoji: "✈️" },
        { surface: "기차", emoji: "🚆" },
      ],
    ),
    sentenceMcq({
      id: "ko-m17-1-q-taxi",
      prompt: "Which means 'taxi'?",
      correctHangul: "택시",
      distractorsHangul: ["버스", "기차", "지하철"],
      explanation: "택시 = taxi.",
      exercisedAtomSurfaces: ["택시"],
    }),
    listeningCompSentence({
      id: "ko-m17-1-lc-bus",
      audioText: "버스",
      correctMeaningEn: "bus",
      distractorsEn: ["subway", "taxi", "train"],
      exercisedAtomSurfaces: ["버스"],
    }),
    speaking("ko-m17-1-speak-subway", "지하철", "subway", ["지하철"]),
  ],
};

// ─── ko-m17-2 — (으)로 (by means) ───────────────────────────────────────────

const M17_2: LessonContent = {
  id: "ko-m17-2",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)로 — by (transport)",
  description: "Say how you travel: 버스로 가요.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m17-2-info",
      "로 after a vowel or ㄹ, 으로 after other consonants",
      "(으)로 marks the MEANS of travel: 버스로 가요 = 'I go by bus.' Pick the form by the last letter: after a VOWEL → 로 (버스로, 택시로); after a CONSONANT → 으로 (집으로 'to/by home'). SPECIAL CASE: a word ending in ㄹ also takes plain 로 — so 지하철 → 지하철로 (NOT 지하철으로).",
      "grammar",
    ),
    phrase("ko-m17-2-p-by-v", "by (after vowel / ㄹ)", "ro", "로"),
    phrase("ko-m17-2-p-by-c", "by (after consonant)", "euro", "으로"),
    sentenceMcq({
      id: "ko-m17-2-q-bybus",
      prompt: "'I go by bus.' —",
      correctHangul: "버스로 가요",
      distractorsHangul: ["버스으로 가요", "버스에 가요", "버스를 가요"],
      explanation: "버스 ends in a vowel → 버스로.",
      exercisedAtomSurfaces: ["로", "버스", "가요"],
    }),
    sentenceMcq({
      id: "ko-m17-2-q-bysubway",
      prompt: "'I go by subway.' —",
      correctHangul: "지하철로 가요",
      distractorsHangul: ["지하철으로 가요", "지하철에 가요", "지하철를 가요"],
      explanation: "지하철 ends in ㄹ → plain 로 (the ㄹ exception), not 으로.",
      exercisedAtomSurfaces: ["로", "지하철", "가요"],
    }),
    cloze(
      "ko-m17-2-cloze-bytaxi",
      "택시",
      "가요",
      "로",
      ["로", "으로", "에", "를"],
      "I go by taxi.",
      "택시로 가요",
      "택시 ends in a vowel → 로.",
    ),
    listeningCompSentence({
      id: "ko-m17-2-lc-bybus",
      audioText: "버스로 가요",
      correctMeaningEn: "I go by bus",
      distractorsEn: ["I go to the bus", "I take the bus off", "I'm on the bus"],
      exercisedAtomSurfaces: ["로", "버스", "가요"],
    }),
    speaking("ko-m17-2-speak-bysubway", "지하철로 가요", "I go by subway", ["로", "지하철"]),
  ],
};

// ─── ko-m17-3 — 타다 / 내리다 (get on / off) ────────────────────────────────

const M17_3: LessonContent = {
  id: "ko-m17-3",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "타다 / 내리다 — get on / get off",
  description: "Board and exit — with the right particles.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m17-3-info",
      "타다 takes 을/를, 내리다 takes 에서",
      "타다 ('to ride / get on') takes the OBJECT marker 을/를 in Korean: 버스를 타요 = 'I take the bus' (not '버스에'). 내리다 ('to get off') takes 에서: 버스에서 내려요 = 'I get off the bus.' Watch the particle switch.",
      "grammar",
    ),
    phrase("ko-m17-3-p-ride", "ride / get on (polite)", "tayo", "타요"),
    phrase("ko-m17-3-p-getoff", "to get off", "naerida", "내리다"),
    sentenceMcq({
      id: "ko-m17-3-q-takebus",
      prompt: "'I take the bus.' —",
      correctHangul: "버스를 타요",
      distractorsHangul: ["버스에 타요", "버스로 타요", "버스에서 타요"],
      explanation: "타다 takes 을/를: 버스를 타요.",
      exercisedAtomSurfaces: ["타요", "버스"],
    }),
    cloze(
      "ko-m17-3-cloze-getoff",
      "지하철",
      "내려요",
      "에서",
      ["에서", "를", "로", "에"],
      "I get off the subway.",
      "지하철에서 내려요",
      "내리다 takes 에서: 지하철에서 내려요.",
    ),
    sentenceMcq({
      id: "ko-m17-3-q-taketaxi",
      prompt: "'I take a taxi.' —",
      correctHangul: "택시를 타요",
      distractorsHangul: ["택시에 타요", "택시로 타요", "택시에서 타요"],
      explanation: "타다 takes 을/를: 택시를 타요. (To say 'by taxi' you'd use 택시로.)",
      exercisedAtomSurfaces: ["타요", "택시"],
    }),
    listeningCompSentence({
      id: "ko-m17-3-lc-takebus",
      audioText: "버스를 타요",
      correctMeaningEn: "I take the bus",
      distractorsEn: ["I get off the bus", "I go by bus", "I wait for the bus"],
      exercisedAtomSurfaces: ["타요", "버스"],
    }),
    speaking("ko-m17-3-speak-getoff", "지하철에서 내려요", "I get off the subway", ["지하철"]),
  ],
};

// ─── ko-m17-4 — Directions ──────────────────────────────────────────────────

const M17_4: LessonContent = {
  id: "ko-m17-4",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Directions — 왼쪽 / 오른쪽 / 똑바로",
  description: "Left, right, and straight ahead.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m17-4-info",
      "왼쪽 (left), 오른쪽 (right), 똑바로 (straight)",
      "왼쪽 = left side, 오른쪽 = right side, 똑바로 = straight ahead. To tell someone which way: 왼쪽으로 가세요 = 'Go left' (왼쪽 ends in a consonant → 으로). 똑바로 가세요 = 'Go straight.'",
      "grammar",
    ),
    phrase("ko-m17-4-p-left", "left side", "oenjjok", "왼쪽"),
    phrase("ko-m17-4-p-right", "right side", "oreunjjok", "오른쪽"),
    phrase("ko-m17-4-p-straight", "straight ahead", "ttokbaro", "똑바로"),
    sentenceMcq({
      id: "ko-m17-4-q-goleft",
      prompt: "'Go left.' —",
      correctHangul: "왼쪽으로 가세요",
      distractorsHangul: ["왼쪽로 가세요", "왼쪽에 가세요", "왼쪽를 가세요"],
      explanation: "왼쪽 ends in a consonant → 왼쪽으로.",
      exercisedAtomSurfaces: ["왼쪽", "으로"],
    }),
    sentenceMcq({
      id: "ko-m17-4-q-goright",
      prompt: "'Go right.' —",
      correctHangul: "오른쪽으로 가세요",
      distractorsHangul: ["오른쪽로 가세요", "오른쪽에 가세요", "왼쪽으로 가세요"],
      explanation: "오른쪽 ends in a consonant → 오른쪽으로.",
      exercisedAtomSurfaces: ["오른쪽", "으로"],
    }),
    cloze(
      "ko-m17-4-cloze-straight",
      "",
      "가세요",
      "똑바로",
      ["똑바로", "왼쪽", "오른쪽", "지하철"],
      "Go straight.",
      "똑바로 가세요",
      "똑바로 = straight ahead.",
    ),
    listeningCompSentence({
      id: "ko-m17-4-lc-goleft",
      audioText: "왼쪽으로 가세요",
      correctMeaningEn: "Go left",
      distractorsEn: ["Go right", "Go straight", "Come here"],
      exercisedAtomSurfaces: ["왼쪽", "으로"],
    }),
    speaking("ko-m17-4-speak-straight", "똑바로 가세요", "Go straight", ["똑바로"]),
  ],
};

// ─── ko-m17-5 — 까지 (as far as a place) ────────────────────────────────────

const M17_5: LessonContent = {
  id: "ko-m17-5",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "까지 — as far as (a place)",
  description: "The time 까지 also marks a destination's edge.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m17-5-info",
      "역까지 = 'as far as the station'",
      "The 까지 you learned for time (M13, 'until') also works for PLACES: 역까지 가요 = 'I go as far as the station.' Pair it with 부터/에서 for a 'from … to …' route: 집에서 역까지 = 'from home to the station.'",
      "grammar",
    ),
    phrase("ko-m17-5-p-station", "station", "yeok", "역", undefined, { emoji: "🚉" }),
    cloze(
      "ko-m17-5-cloze-tostation",
      "역",
      "가요",
      "까지",
      ["까지", "부터", "로", "에서"],
      "I go as far as the station.",
      "역까지 가요",
      "까지 marks the endpoint (a place here).",
    ),
    sentenceMcq({
      id: "ko-m17-5-q-hometostation",
      prompt: "'From home to the station' —",
      correctHangul: "집에서 역까지",
      distractorsHangul: ["집까지 역에서", "집에 역까지", "집로 역까지"],
      explanation: "Place start → 에서, place end → 까지: 집에서 역까지.",
      exercisedAtomSurfaces: ["까지", "역"],
    }),
    translateStep({
      id: "ko-m17-5-tr-tostationbybus",
      promptEn: "I go to the station by bus.",
      acceptedAnswers: ["역까지 버스로 가요", "버스로 역까지 가요", "역까지 버스로 가요."],
      audioText: "역까지 버스로 가요",
      exercisedAtomSurfaces: ["까지", "역", "로", "버스"],
    }),
    listeningCompSentence({
      id: "ko-m17-5-lc-tostation",
      audioText: "역까지 가요",
      correctMeaningEn: "I go as far as the station",
      distractorsEn: ["I go from the station", "I'm at the station", "I get off at the station"],
      exercisedAtomSurfaces: ["까지", "역"],
    }),
    speaking("ko-m17-5-speak-hometostation", "집에서 역까지", "from home to the station", ["까지", "역"]),
  ],
};

// ─── ko-m17-6 — Putting it together ─────────────────────────────────────────

const M17_6: LessonContent = {
  id: "ko-m17-6",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Getting somewhere",
  description: "Combine means, route, and boarding.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m17-6-info",
      "A full trip",
      "역까지 지하철로 가서 버스를 타요 = 'I go to the station by subway and (then) take the bus.' Stack 까지 (route), (으)로 (means), 타다 (board), and the M14 아서/어서 to chain the legs of a trip.",
      "default",
    ),
    build(
      "ko-m17-6-build-subwaythenbus",
      "Build: 'I go by subway and take the bus.' (by subway + go-and + bus + take)",
      "지하철로 가서 버스를 타요",
      ["지하철로", "가서", "버스를", "타요", "버스로"],
      ["지하철로", "가서", "버스를", "타요"],
      ["로", "아서", "타요"],
    ),
    sentenceMcq({
      id: "ko-m17-6-q-tostationbysubway",
      prompt: "'I go to the station by subway.' —",
      correctHangul: "역까지 지하철로 가요",
      distractorsHangul: ["역까지 지하철으로 가요", "역에서 지하철로 가요", "역까지 지하철를 가요"],
      explanation: "역까지 (endpoint) + 지하철로 (means, ㄹ → 로) + 가요.",
      exercisedAtomSurfaces: ["까지", "역", "로", "지하철"],
    }),
    translateStep({
      id: "ko-m17-6-tr-getoffinogo",
      promptEn: "I get off the bus and go straight.",
      acceptedAnswers: ["버스에서 내려서 똑바로 가요", "버스에서 내려서 똑바로 가요."],
      audioText: "버스에서 내려서 똑바로 가요",
      exercisedAtomSurfaces: ["버스", "똑바로", "어서"],
    }),
    listeningCompSentence({
      id: "ko-m17-6-lc-subwaythenbus",
      audioText: "지하철로 가서 버스를 타요",
      correctMeaningEn: "I go by subway and take the bus",
      distractorsEn: ["I take the bus then the subway", "I go by bus", "I get off the subway"],
      exercisedAtomSurfaces: ["로", "아서", "타요"],
    }),
    speaking("ko-m17-6-speak-tostation", "역까지 지하철로 가요", "I go to the station by subway", ["까지", "역", "로"]),
  ],
};

// ─── ko-m17-7 — Mini-dialogue ───────────────────────────────────────────────

const M17_7: LessonContent = {
  id: "ko-m17-7",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — asking the way",
  description: "Ask how to get somewhere and follow directions.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m17-7-info",
      "Finding the station",
      "A: 역까지 어떻게 가요? (How do I get to the station?)\nB: 버스를 타세요. (Take the bus.)\nA: 어디서 내려요? (Where do I get off?)\nB: 다음 역에서 내려서 왼쪽으로 가세요. (Get off at the next stop and go left.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m17-7-q-howtoget",
      prompt: "'How do I get to the station?' —",
      correctHangul: "역까지 어떻게 가요?",
      distractorsHangul: ["역에서 어떻게 가요?", "역까지 왜 가요?", "역까지 언제 가요?"],
      // NATIVE-REVIEW: 어떻게 ('how') is used here without being a registered
      // atom — confirm it's fine as a recognition-only question word at M17.
      explanation: "어떻게 = 'how' → 역까지 어떻게 가요?.",
      exercisedAtomSurfaces: ["까지", "역", "가요"],
    }),
    sentenceMcq({
      id: "ko-m17-7-q-takebus",
      prompt: "'Take the bus.' —",
      correctHangul: "버스를 타세요",
      distractorsHangul: ["버스에 타세요", "버스로 타세요", "버스를 내리세요"],
      explanation: "타다 takes 을/를: 버스를 타세요 ('please take the bus').",
      exercisedAtomSurfaces: ["타요", "버스"],
    }),
    build(
      "ko-m17-7-build-getoffgoleft",
      "Build: 'Get off and go left.' (get-off-and + left + to + go)",
      "내려서 왼쪽으로 가세요",
      ["내려서", "왼쪽으로", "가세요", "오른쪽으로"],
      ["내려서", "왼쪽으로", "가세요"],
      ["왼쪽", "으로"],
    ),
    listeningCompSentence({
      id: "ko-m17-7-lc-takebus",
      audioText: "버스를 타세요",
      correctMeaningEn: "Take the bus",
      distractorsEn: ["Get off the bus", "Go by bus", "Wait for the bus"],
      exercisedAtomSurfaces: ["타요", "버스"],
    }),
    speaking("ko-m17-7-speak-goleft", "왼쪽으로 가세요", "Go left", ["왼쪽", "으로"]),
  ],
};

// ─── ko-m17-8 — Mastery test ────────────────────────────────────────────────

const M17_8: LessonContent = {
  id: "ko-m17-8",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M17 Mastery Test",
  description: "Transport, (으)로, 타다/내리다, directions, 까지.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "ko-m17-8-q-bysubway",
      prompt: "'I go by subway.' —",
      correctHangul: "지하철로 가요",
      distractorsHangul: ["지하철으로 가요", "지하철에 가요", "지하철를 가요"],
      exercisedAtomSurfaces: ["로", "지하철", "가요"],
    }),
    sentenceMcq({
      id: "ko-m17-8-q-takebus",
      prompt: "'I take the bus.' —",
      correctHangul: "버스를 타요",
      distractorsHangul: ["버스에 타요", "버스로 타요", "버스에서 타요"],
      exercisedAtomSurfaces: ["타요", "버스"],
    }),
    cloze(
      "ko-m17-8-cloze-getoff",
      "지하철",
      "내려요",
      "에서",
      ["에서", "를", "로", "에"],
      "I get off the subway.",
      "지하철에서 내려요",
      "내리다 takes 에서.",
    ),
    sentenceMcq({
      id: "ko-m17-8-q-goleft",
      prompt: "'Go left.' —",
      correctHangul: "왼쪽으로 가세요",
      distractorsHangul: ["왼쪽로 가세요", "왼쪽에 가세요", "오른쪽으로 가세요"],
      exercisedAtomSurfaces: ["왼쪽", "으로"],
    }),
    sentenceMcq({
      id: "ko-m17-8-q-hometostation",
      prompt: "'From home to the station' —",
      correctHangul: "집에서 역까지",
      distractorsHangul: ["집까지 역에서", "집에 역까지", "집로 역까지"],
      exercisedAtomSurfaces: ["까지", "역"],
    }),
    listeningCompSentence({
      id: "ko-m17-8-lc-tostation",
      audioText: "역까지 가요",
      correctMeaningEn: "I go as far as the station",
      distractorsEn: ["I go from the station", "I'm at the station", "I get off at the station"],
      exercisedAtomSurfaces: ["까지", "역"],
    }),
    speaking("ko-m17-8-speak-recap", "버스를 타요", "I take the bus", ["타요", "버스"]),
  ],
};

export const KO_M17_LESSONS: LessonContent[] = [
  M17_1,
  M17_2,
  M17_3,
  M17_4,
  M17_5,
  M17_6,
  M17_7,
  M17_8,
];
