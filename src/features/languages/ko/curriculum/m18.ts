/**
 * Korean Module 18 — Weather & nature + future / probability.
 *
 * KO analog of JA M18 (weather/nature vocab + でしょう 'probably' +
 * とおもいます 'I think'). Re-expressed in Korean's own grammar:
 *
 *   ko-m18-1  Weather — 날씨 / 맑다 / 흐리다 / 비 / 눈 / 바람
 *   ko-m18-2  Hot & cold — 덥다 / 춥다 (ㅂ-irregular)
 *   ko-m18-3  Seasons — 봄 / 여름 / 가을 / 겨울
 *   ko-m18-4  (으)ㄹ 거예요 — will / probably (future)
 *   ko-m18-5  것 같아요 — I think / it seems
 *   ko-m18-6  Putting it together — forecasting
 *   ko-m18-7  Mini-dialogue — talking about the weather
 *   ko-m18-8  M18 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 덥다 ('hot') and 춥다 ('cold') are ㅂ-IRREGULAR adjectives: the final ㅂ
 *     turns to 우 before a vowel ending, so 덥다 → 더워요, 춥다 → 추워요. This
 *     is a real, productive irregular class worth flagging explicitly.
 *   - The future 'will / probably' is (으)ㄹ + 거예요: after a vowel stem just
 *     ㄹ 거예요 (갈 거예요 'I will go'); after a consonant stem 을 거예요 (먹을
 *     거예요 'I will eat'). With a 3rd-person/weather subject it shades toward
 *     'probably' (비가 올 거예요 'it'll probably rain'). This is the closest
 *     KO match to JA's でしょう.
 *   - 것 같아요 ('I think / it seems') follows a modifier form: 비가 올 것
 *     같아요 ('it looks like it'll rain'), 맛있는 것 같아요 ('it seems
 *     delicious'). Taught here as a high-frequency set frame, lightly.
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

// ─── ko-m18-1 — Weather vocab ───────────────────────────────────────────────

const M18_1: LessonContent = {
  id: "ko-m18-1",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Weather — 날씨, 맑다, 비, 눈",
  description: "Talk about a clear, cloudy, rainy, or snowy day.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m18-1-info",
      "Describing the sky",
      "날씨 = 'weather'. 맑다 → 맑아요 ('it's clear/sunny'), 흐리다 → 흐려요 ('it's cloudy'). For precipitation use 오다 ('to come'): 비가 와요 ('it's raining'), 눈이 와요 ('it's snowing'). 바람이 불어요 = 'it's windy' (바람 = wind).",
      "grammar",
    ),
    phrase("ko-m18-1-p-weather", "weather", "nalssi", "날씨", undefined, { emoji: "🌤️" }),
    phrase("ko-m18-1-p-clear", "is clear / sunny", "malgayo", "맑아요"),
    phrase("ko-m18-1-p-cloudy", "is cloudy", "heuryeoyo", "흐려요"),
    phrase("ko-m18-1-p-snow", "snow", "nun", "눈", undefined, { emoji: "❄️" }),
    sentenceMcq({
      id: "ko-m18-1-q-raining",
      prompt: "'It's raining.' —",
      correctHangul: "비가 와요",
      distractorsHangul: ["비를 와요", "비가 가요", "비가 봐요"],
      explanation: "Precipitation uses 오다: 비가 와요.",
      exercisedAtomSurfaces: ["비"],
    }),
    sentenceMcq({
      id: "ko-m18-1-q-clear",
      prompt: "'It's clear (sunny).' —",
      correctHangul: "날씨가 맑아요",
      distractorsHangul: ["날씨가 맑어요", "날씨가 흐려요", "날씨를 맑아요"],
      explanation: "맑다 → 맑아요 (ㅏ harmony). 흐려요 = cloudy.",
      exercisedAtomSurfaces: ["날씨", "맑아요"],
    }),
    listeningCompSentence({
      id: "ko-m18-1-lc-snowing",
      audioText: "눈이 와요",
      correctMeaningEn: "It's snowing",
      distractorsEn: ["It's raining", "It's clear", "It's windy"],
      exercisedAtomSurfaces: ["눈"],
    }),
    speaking("ko-m18-1-speak-cloudy", "날씨가 흐려요", "It's cloudy", ["날씨", "흐려요"]),
  ],
};

// ─── ko-m18-2 — Hot & cold (ㅂ-irregular) ───────────────────────────────────

const M18_2: LessonContent = {
  id: "ko-m18-2",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "덥다 / 춥다 — hot & cold",
  description: "ㅂ-irregular adjectives: 더워요, 추워요.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m18-2-info",
      "The ㅂ → 우 irregular",
      "덥다 ('to be hot') and 춥다 ('to be cold') are ㅂ-IRREGULAR: the final ㅂ becomes 우 before the ending, so 덥다 → 더워요 and 춥다 → 추워요 (NOT 덥어요 / 춥어요). Use them for weather: 오늘 더워요 = 'It's hot today.'",
      "grammar",
    ),
    phrase("ko-m18-2-p-hot", "is hot (weather)", "deowoyo", "더워요"),
    phrase("ko-m18-2-p-cold", "is cold (weather)", "chuwoyo", "추워요"),
    sentenceMcq({
      id: "ko-m18-2-q-hot",
      prompt: "'It's hot today.' —",
      correctHangul: "오늘 더워요",
      distractorsHangul: ["오늘 덥어요", "오늘 추워요", "오늘 더요"],
      explanation: "덥다 is ㅂ-irregular → 더워요 (not 덥어요).",
      exercisedAtomSurfaces: ["오늘", "더워요"],
    }),
    sentenceMcq({
      id: "ko-m18-2-q-cold",
      prompt: "'It's cold today.' —",
      correctHangul: "오늘 추워요",
      distractorsHangul: ["오늘 춥어요", "오늘 더워요", "오늘 추요"],
      explanation: "춥다 is ㅂ-irregular → 추워요.",
      exercisedAtomSurfaces: ["오늘", "추워요"],
    }),
    cloze(
      "ko-m18-2-cloze-coldso",
      "추워",
      "집에 있어요",
      "서",
      ["서", "고", "지만", "도"],
      "It's cold, so I stay home.",
      "추워서 집에 있어요",
      "추워요 → 추워서 (the M14 reason 어서, already irregular-resolved).",
    ),
    listeningCompSentence({
      id: "ko-m18-2-lc-hot",
      audioText: "오늘 더워요",
      correctMeaningEn: "It's hot today",
      distractorsEn: ["It's cold today", "It was hot", "It's clear today"],
      exercisedAtomSurfaces: ["오늘", "더워요"],
    }),
    speaking("ko-m18-2-speak-cold", "오늘 추워요", "It's cold today", ["오늘", "추워요"]),
  ],
};

// ─── ko-m18-3 — Seasons ─────────────────────────────────────────────────────

const M18_3: LessonContent = {
  id: "ko-m18-3",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Seasons — 봄, 여름, 가을, 겨울",
  description: "Spring, summer, autumn, winter.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m18-3-info",
      "The four seasons",
      "봄 (spring), 여름 (summer), 가을 (autumn/fall), 겨울 (winter). 여름에 더워요 = 'It's hot in summer'; 겨울에 추워요 = 'It's cold in winter' (the time 에 from M12).",
      "default",
    ),
    phrase("ko-m18-3-p-spring", "spring", "bom", "봄", undefined, { emoji: "🌸" }),
    phrase("ko-m18-3-p-summer", "summer", "yeoreum", "여름", undefined, { emoji: "🏖️" }),
    phrase("ko-m18-3-p-autumn", "autumn / fall", "gaeul", "가을", undefined, { emoji: "🍂" }),
    phrase("ko-m18-3-p-winter", "winter", "gyeoul", "겨울", undefined, { emoji: "⛄" }),
    sentenceMcq({
      id: "ko-m18-3-q-summer",
      prompt: "Which means 'summer'?",
      correctHangul: "여름",
      distractorsHangul: ["겨울", "봄", "가을"],
      explanation: "여름 = summer. 겨울 = winter.",
      exercisedAtomSurfaces: ["여름"],
    }),
    cloze(
      "ko-m18-3-cloze-hotsummer",
      "여름",
      "더워요",
      "에",
      ["에", "에서", "로", "도"],
      "It's hot in summer.",
      "여름에 더워요",
      "여름에 = 'in summer' (time 에).",
    ),
    listeningCompSentence({
      id: "ko-m18-3-lc-winter",
      audioText: "겨울에 추워요",
      correctMeaningEn: "It's cold in winter",
      distractorsEn: ["It's hot in summer", "It snows in winter", "It's cold today"],
      exercisedAtomSurfaces: ["겨울", "추워요"],
    }),
    speaking("ko-m18-3-speak-summer", "여름에 더워요", "It's hot in summer", ["여름", "더워요"]),
  ],
};

// ─── ko-m18-4 — (으)ㄹ 거예요 (future / probably) ───────────────────────────

const M18_4: LessonContent = {
  id: "ko-m18-4",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㄹ 거예요 — will / probably",
  description: "Talk about the future and make predictions.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m18-4-info",
      "ㄹ 거예요 (vowel) / 을 거예요 (consonant)",
      "The future is the (으)ㄹ modifier + 거예요. After a VOWEL stem → ㄹ 거예요: 가다 → 갈 거예요 ('I will go'). After a CONSONANT stem → 을 거예요: 먹다 → 먹을 거예요 ('I will eat'). With a weather/3rd-person subject it means 'probably': 비가 올 거예요 = 'It'll probably rain.' This is Korean's closest match to 'will / probably'.",
      "grammar",
    ),
    phrase("ko-m18-4-p-future", "will / probably (after ㄹ)", "geoyeyo", "거예요"),
    sentenceMcq({
      id: "ko-m18-4-q-willgo",
      prompt: "'I will go.' —",
      correctHangul: "갈 거예요",
      distractorsHangul: ["가을 거예요", "가 거예요", "갈 거에요"],
      // NATIVE-REVIEW: 거예요 vs 거에요 — 거예요 is the standard spelling
      // (it's 것이에요 → 거예요); 거에요 is a common misspelling used as the
      // distractor. Confirm teaching 거예요 as the only correct form.
      explanation: "가다 (vowel stem) → 갈 거예요. Standard spelling is 거예요.",
      exercisedAtomSurfaces: ["거예요", "가요"],
    }),
    cloze(
      "ko-m18-4-cloze-willeat",
      "밥을 먹",
      "거예요",
      "을",
      ["을", "ㄹ", "고", "어서"],
      "I will eat.",
      "밥을 먹을 거예요",
      "먹다 (consonant stem) → 먹을 거예요.",
    ),
    sentenceMcq({
      id: "ko-m18-4-q-willrain",
      prompt: "'It'll probably rain.' —",
      correctHangul: "비가 올 거예요",
      distractorsHangul: ["비가 오을 거예요", "비가 와요 거예요", "비가 올 거에요"],
      explanation: "오다 (vowel stem) → 올 거예요; weather subject → 'probably'.",
      exercisedAtomSurfaces: ["거예요", "비"],
    }),
    listeningCompSentence({
      id: "ko-m18-4-lc-willgo",
      audioText: "갈 거예요",
      correctMeaningEn: "I will go",
      distractorsEn: ["I'm going", "I went", "I want to go"],
      exercisedAtomSurfaces: ["거예요", "가요"],
    }),
    speaking("ko-m18-4-speak-willrain", "비가 올 거예요", "It'll probably rain", ["거예요", "비"]),
  ],
};

// ─── ko-m18-5 — 것 같아요 (I think / it seems) ──────────────────────────────

const M18_5: LessonContent = {
  id: "ko-m18-5",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "것 같아요 — I think / it seems",
  description: "Soften a statement into an impression.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m18-5-info",
      "modifier + 것 같아요",
      "것 같아요 ('it seems / I think') hedges a statement. For a guess about the future, use the ㄹ/을 modifier: 비가 올 것 같아요 = 'It looks like it'll rain.' For something happening now, use the 는 modifier on verbs (맛있는 것 같아요 'it seems delicious' uses the adjective modifier). Learn it as a set frame: [modifier] + 것 같아요.",
      "grammar",
    ),
    phrase("ko-m18-5-p-seems", "I think / it seems", "geot gatayo", "것 같아요"),
    sentenceMcq({
      id: "ko-m18-5-q-seemsrain",
      prompt: "'It looks like it'll rain.' —",
      correctHangul: "비가 올 것 같아요",
      distractorsHangul: ["비가 와 것 같아요", "비가 올 거 같아요만", "비가 오을 것 같아요"],
      // NATIVE-REVIEW: 올 것 같아요 (full) vs the very common spoken
      // contraction 올 거 같아요 — both are heard; confirm teaching the full
      // 것 같아요 form is the right canonical target for a learner.
      explanation: "오다 → 올 (ㄹ modifier) + 것 같아요 ('seems like it'll rain').",
      exercisedAtomSurfaces: ["것 같아요", "비"],
    }),
    translateStep({
      id: "ko-m18-5-tr-seemscold",
      promptEn: "It seems cold today.",
      acceptedAnswers: ["오늘 추운 것 같아요", "오늘 추운 것 같아요."],
      audioText: "오늘 추운 것 같아요",
      // NATIVE-REVIEW: 춥다 → 추운 (the ㅂ-irregular adjective modifier). 추운
      // 것 같아요 is natural; confirm the modifier form 추운 (not 추워운/추울)
      // is what reads correctly here.
      exercisedAtomSurfaces: ["것 같아요", "오늘"],
    }),
    sentenceMcq({
      id: "ko-m18-5-q-seemsdelicious",
      prompt: "'It seems delicious.' —",
      correctHangul: "맛있는 것 같아요",
      distractorsHangul: ["맛있을 것 같아요", "맛있어 것 같아요", "맛있는 거 같아요만"],
      explanation: "맛있다 → 맛있는 (present modifier) + 것 같아요.",
      exercisedAtomSurfaces: ["것 같아요"],
    }),
    listeningCompSentence({
      id: "ko-m18-5-lc-seemsrain",
      audioText: "비가 올 것 같아요",
      correctMeaningEn: "It looks like it'll rain",
      distractorsEn: ["It's raining now", "It rained", "It won't rain"],
      exercisedAtomSurfaces: ["것 같아요", "비"],
    }),
    speaking("ko-m18-5-speak-seemsrain", "비가 올 것 같아요", "It looks like it'll rain", ["것 같아요", "비"]),
  ],
};

// ─── ko-m18-6 — Putting it together ─────────────────────────────────────────

const M18_6: LessonContent = {
  id: "ko-m18-6",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Forecasting",
  description: "Combine weather, the future, and impressions.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m18-6-info",
      "Talking about tomorrow's weather",
      "내일 비가 올 거예요 = 'It'll rain tomorrow.' 추워서 집에 있을 거예요 = 'It's cold, so I'll stay home.' Stack the M14 아서/어서 reason with the M18 future 거예요 and 것 같아요.",
      "default",
    ),
    build(
      "ko-m18-6-build-coldstayhome",
      "Build: 'It's cold, so I'll stay home.' (cold-so + home + at + will-be)",
      "추워서 집에 있을 거예요",
      ["추워서", "집에", "있을 거예요", "더워서"],
      ["추워서", "집에", "있을 거예요"],
      ["어서", "거예요", "추워요"],
    ),
    sentenceMcq({
      id: "ko-m18-6-q-rainytomorrow",
      prompt: "'It'll rain tomorrow.' —",
      correctHangul: "내일 비가 올 거예요",
      distractorsHangul: ["내일 비가 와요 거예요", "내일 비가 오을 거예요", "내일 비가 올 거에요"],
      // NATIVE-REVIEW: 내일 ('tomorrow') is used here but not a registered atom
      // (어제/오늘 are taught in M10; 내일 is the natural next word) — confirm
      // acceptable as recognition-only, or backfill it as an atom.
      explanation: "오다 → 올 거예요 ('will/probably rain').",
      exercisedAtomSurfaces: ["거예요", "비"],
    }),
    translateStep({
      id: "ko-m18-6-tr-seemshot",
      promptEn: "It seems hot today.",
      acceptedAnswers: ["오늘 더운 것 같아요", "오늘 더운 것 같아요."],
      audioText: "오늘 더운 것 같아요",
      // NATIVE-REVIEW: 덥다 → 더운 (ㅂ-irregular adjective modifier). Confirm
      // 더운 것 같아요 reads naturally.
      exercisedAtomSurfaces: ["것 같아요", "오늘"],
    }),
    listeningCompSentence({
      id: "ko-m18-6-lc-coldstayhome",
      audioText: "추워서 집에 있을 거예요",
      correctMeaningEn: "It's cold, so I'll stay home",
      distractorsEn: ["It's hot, so I'll go out", "It's cold, but I'll go", "It was cold at home"],
      exercisedAtomSurfaces: ["어서", "거예요"],
    }),
    speaking("ko-m18-6-speak-rainytomorrow", "내일 비가 올 거예요", "It'll rain tomorrow", ["거예요", "비"]),
  ],
};

// ─── ko-m18-7 — Mini-dialogue ───────────────────────────────────────────────

const M18_7: LessonContent = {
  id: "ko-m18-7",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — the weather",
  description: "Ask about the weather and make plans around it.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m18-7-info",
      "A weather chat",
      "A: 오늘 날씨 어때요? (How's the weather today?)\nB: 흐려요. 비가 올 것 같아요. (It's cloudy. Looks like it'll rain.)\nA: 그래서 집에 있을 거예요. (So I'll stay home.)\nB: 내일은 맑을 거예요. (Tomorrow will be clear.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m18-7-q-howweather",
      prompt: "'How's the weather today?' —",
      correctHangul: "오늘 날씨 어때요?",
      distractorsHangul: ["오늘 날씨 뭐예요?", "오늘 날씨 어디예요?", "오늘 날씨 언제예요?"],
      // NATIVE-REVIEW: 어때요 ('how is it') is used without being a registered
      // atom — confirm acceptable as a recognition-only set question at M18.
      explanation: "어때요? = 'how is it?' → 날씨 어때요?.",
      exercisedAtomSurfaces: ["오늘", "날씨"],
    }),
    sentenceMcq({
      id: "ko-m18-7-q-looksrain",
      prompt: "'It looks like it'll rain.' —",
      correctHangul: "비가 올 것 같아요",
      distractorsHangul: ["비가 와 것 같아요", "비가 올 거에요", "비가 오을 것 같아요"],
      explanation: "올 (ㄹ modifier) + 것 같아요.",
      exercisedAtomSurfaces: ["것 같아요", "비"],
    }),
    build(
      "ko-m18-7-build-clearTomorrow",
      "Build: 'Tomorrow will be clear.' (tomorrow + clear-will-be)",
      "내일은 맑을 거예요",
      ["내일은", "맑을 거예요", "흐릴 거예요", "추울 거예요"],
      ["내일은", "맑을 거예요"],
      ["거예요"],
    ),
    listeningCompSentence({
      id: "ko-m18-7-lc-staystation",
      audioText: "그래서 집에 있을 거예요",
      correctMeaningEn: "So I'll stay home",
      distractorsEn: ["So I'll go out", "I stayed home", "I want to stay home"],
      exercisedAtomSurfaces: ["그래서", "거예요"],
    }),
    speaking("ko-m18-7-speak-looksrain", "비가 올 것 같아요", "It looks like it'll rain", ["것 같아요", "비"]),
  ],
};

// ─── ko-m18-8 — Mastery test ────────────────────────────────────────────────

const M18_8: LessonContent = {
  id: "ko-m18-8",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M18 Mastery Test",
  description: "Weather, seasons, the future, and 것 같아요.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m18-8-q-hot",
      prompt: "'It's hot today.' —",
      correctHangul: "오늘 더워요",
      distractorsHangul: ["오늘 덥어요", "오늘 추워요", "오늘 더요"],
      exercisedAtomSurfaces: ["오늘", "더워요"],
    }),
    sentenceMcq({
      id: "ko-m18-8-q-summer",
      prompt: "Which means 'summer'?",
      correctHangul: "여름",
      distractorsHangul: ["겨울", "봄", "가을"],
      exercisedAtomSurfaces: ["여름"],
    }),
    sentenceMcq({
      id: "ko-m18-8-q-willgo",
      prompt: "'I will go.' —",
      correctHangul: "갈 거예요",
      distractorsHangul: ["가을 거예요", "가 거예요", "갈 거에요"],
      exercisedAtomSurfaces: ["거예요", "가요"],
    }),
    cloze(
      "ko-m18-8-cloze-willeat",
      "밥을 먹",
      "거예요",
      "을",
      ["을", "ㄹ", "고", "어서"],
      "I will eat.",
      "밥을 먹을 거예요",
      "Consonant stem → 을 거예요.",
    ),
    sentenceMcq({
      id: "ko-m18-8-q-seemsrain",
      prompt: "'It looks like it'll rain.' —",
      correctHangul: "비가 올 것 같아요",
      distractorsHangul: ["비가 와 것 같아요", "비가 올 거에요", "비가 오을 것 같아요"],
      exercisedAtomSurfaces: ["것 같아요", "비"],
    }),
    listeningCompSentence({
      id: "ko-m18-8-lc-cold",
      audioText: "오늘 추워요",
      correctMeaningEn: "It's cold today",
      distractorsEn: ["It's hot today", "It's clear today", "It was cold"],
      exercisedAtomSurfaces: ["오늘", "추워요"],
    }),
    speaking("ko-m18-8-speak-recap", "비가 올 거예요", "It'll probably rain", ["거예요", "비"]),
  ],
};

export const KO_M18_LESSONS: LessonContent[] = [
  M18_1,
  M18_2,
  M18_3,
  M18_4,
  M18_5,
  M18_6,
  M18_7,
  M18_8,
];
