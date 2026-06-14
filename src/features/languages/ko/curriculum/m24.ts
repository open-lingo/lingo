/**
 * Korean Module 24 — Hobbies & activities.
 *
 * KO analog of JA M24 (hobby vocab + 〜のがすきです like-doing + 〜たり〜たり
 * non-exhaustive listing + counter 〜かい/回 times). Re-expressed in Korean's
 * own grammar:
 *
 *   ko-m24-1  Hobby vocab — 취미 / 그림 / 사진 / 음악 / 게임
 *   ko-m24-2  (으)ㄹ 줄 알다 / 모르다 — know / don't know how to
 *   ko-m24-3  거나 — "or" (listing alternatives): 책을 읽거나 음악을 들어요
 *   ko-m24-4  Frequency counter 번 — 한 번, 두 번 (X times)
 *   ko-m24-5  Frequency adverbs review + 번 — 일주일에 두 번
 *   ko-m24-6  Putting it together — describing your hobbies
 *   ko-m24-7  Mini-dialogue — talking about hobbies
 *   ko-m24-8  M24 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 취미 = 'hobby'. 취미가 뭐예요? = 'what's your hobby?'.
 *   - (으)ㄹ 줄 알다 = 'know how to (do)', (으)ㄹ 줄 모르다 = 'not know how to'.
 *     This is about LEARNED SKILL, distinct from M23's (으)ㄹ 수 있다 (general
 *     possibility): 수영할 줄 알아요 = 'I know how to swim'; 운전할 줄 몰라요
 *     = 'I don't know how to drive'. After a vowel stem → ㄹ 줄 (수영할 줄);
 *     after a consonant stem → 을 줄 (먹을 줄). 모르다 is irregular → 몰라요.
 *   - 거나 = 'or' joining two verb clauses (alternatives): 책을 읽거나 음악을
 *     들어요 = 'I read books or listen to music'. Attaches to the verb stem
 *     (읽 → 읽거나, no vowel-harmony split). This is the KO match to JA's
 *     たり…たり 'doing things like X and Y'.
 *   - Counter 번 = '(number of) times': 한 번 (once), 두 번 (twice), 세 번
 *     (3 times) — NATIVE numbers + 번, same pre-counter 한/두/세/네. With a
 *     period it gives frequency: 일주일에 두 번 = 'twice a week' (에 = 'per').
 *
 * This is the FINAL authored KO module in this batch (JA tops out at M27;
 * KO M25-M27 remain). Builds on: 읽다/듣다 (read/listen), 음악, frequency
 * adverbs (자주/가끔, M13), 일주일 implied. NATIVE-REVIEW flags inline.
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

// ─── ko-m24-1 — Hobby vocab ─────────────────────────────────────────────────

const M24_1: LessonContent = {
  id: "ko-m24-1",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Hobbies — 취미, 그림, 사진, 음악",
  description: "Hobby, drawing, photos, music, games.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "ko-m24-1-info",
      "Talking about hobbies",
      "취미 = 'hobby' (취미가 뭐예요? = 'what's your hobby?'). 그림 = 'a drawing/picture' (그림을 그려요 'I draw'). 사진 = 'a photo' (사진을 찍어요 'I take photos'). 음악 = 'music' (음악을 들어요 'I listen to music'). 게임 = 'a game'.",
      "default",
    ),
    phrase("ko-m24-1-p-hobby", "hobby", "chwimi", "취미", undefined, { emoji: "🎨" }),
    phrase("ko-m24-1-p-drawing", "drawing / picture", "geurim", "그림", undefined, { emoji: "🖼️" }),
    phrase("ko-m24-1-p-photo", "photo", "sajin", "사진", undefined, { emoji: "📷" }),
    phrase("ko-m24-1-p-music", "music", "eumak", "음악", undefined, { emoji: "🎵" }),
    phrase("ko-m24-1-p-game", "game", "geim", "게임", undefined, { emoji: "🎮" }),
    sentenceMcq({
      id: "ko-m24-1-q-hobby",
      prompt: "Which means 'hobby'?",
      correctHangul: "취미",
      distractorsHangul: ["그림", "사진", "음악"],
      explanation: "취미 = hobby.",
      exercisedAtomSurfaces: ["취미"],
    }),
    sentenceMcq({
      id: "ko-m24-1-q-music",
      prompt: "Which means 'music'?",
      correctHangul: "음악",
      distractorsHangul: ["게임", "사진", "그림"],
      explanation: "음악 = music.",
      exercisedAtomSurfaces: ["음악"],
    }),
    listeningCompSentence({
      id: "ko-m24-1-lc-photo",
      audioText: "사진",
      correctMeaningEn: "a photo",
      distractorsEn: ["a drawing", "music", "a game"],
      exercisedAtomSurfaces: ["사진"],
    }),
    speaking("ko-m24-1-speak-drawing", "그림", "drawing / picture", ["그림"]),
  ],
};

// ─── ko-m24-2 — (으)ㄹ 줄 알다 / 모르다 (know how to) ───────────────────────

const M24_2: LessonContent = {
  id: "ko-m24-2",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)ㄹ 줄 알다 / 모르다 — know how to",
  description: "Say what skills you have (or don't).",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m24-2-info",
      "(으)ㄹ 줄 알아요 / 몰라요",
      "(으)ㄹ 줄 알다 = 'know HOW to (do)' — a learned skill. (으)ㄹ 줄 모르다 = 'not know how to'. 수영할 줄 알아요 = 'I know how to swim'; 운전할 줄 몰라요 = 'I don't know how to drive'. After a VOWEL stem → ㄹ 줄 (수영할 줄); after a CONSONANT → 을 줄 (먹을 줄). NOTE: this is about SKILL — compare M23's (으)ㄹ 수 있어요 ('it's possible'). 모르다 is irregular → 몰라요.",
      "grammar",
    ),
    phrase("ko-m24-2-p-knowhow", "know how to (after ㄹ)", "-l jul arayo", "ㄹ 줄 알아요"),
    phrase("ko-m24-2-p-dontknowhow", "don't know how to (after ㄹ)", "-l jul mollayo", "ㄹ 줄 몰라요"),
    sentenceMcq({
      id: "ko-m24-2-q-knowswim",
      prompt: "'I know how to swim.' —",
      correctHangul: "수영할 줄 알아요",
      distractorsHangul: ["수영할 줄 몰라요", "수영을 줄 알아요", "수영할 줄 알아요보다"],
      explanation: "수영하다 (vowel stem) → 수영할 줄 알아요.",
      exercisedAtomSurfaces: ["수영"],
    }),
    cloze(
      "ko-m24-2-cloze-knowread",
      "한글을 읽",
      "줄 알아요",
      "을",
      ["을", "ㄹ", "고", "어서"],
      "I know how to read Hangul.",
      "한글을 읽을 줄 알아요",
      "읽다 (consonant stem) → 읽을 줄 알아요.",
    ),
    sentenceMcq({
      id: "ko-m24-2-q-dontknowdrive",
      prompt: "'I don't know how to drive.' —",
      correctHangul: "운전할 줄 몰라요",
      distractorsHangul: ["운전할 줄 알아요", "운전을 줄 몰라요", "운전할 줄 모르요"],
      // NATIVE-REVIEW: 모르다 is a 르-irregular → 몰라요 (not 모르요). Confirm
      // 운전할 줄 몰라요 reads natural for 'I don't know how to drive'.
      explanation: "모르다 → 몰라요 (irregular). 운전할 줄 몰라요.",
      exercisedAtomSurfaces: ["운전"],
    }),
    listeningCompSentence({
      id: "ko-m24-2-lc-knowswim",
      audioText: "수영할 줄 알아요",
      correctMeaningEn: "I know how to swim",
      distractorsEn: ["I don't know how to swim", "I can swim today", "I like swimming"],
      exercisedAtomSurfaces: ["수영"],
    }),
    speaking("ko-m24-2-speak-dontknowdrive", "운전할 줄 몰라요", "I don't know how to drive", ["운전"]),
  ],
};

// ─── ko-m24-3 — 거나 (or) ───────────────────────────────────────────────────

const M24_3: LessonContent = {
  id: "ko-m24-3",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "거나 — or (doing X or Y)",
  description: "List alternative activities.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m24-3-info",
      "거나 joins verb clauses with 'or'",
      "거나 = 'or', attached to a verb stem to list alternative actions: 책을 읽거나 음악을 들어요 = 'I read books or listen to music.' 주말에 영화를 보거나 게임을 해요 = 'On weekends I watch movies or play games.' It attaches straight to the stem (읽 → 읽거나, 보 → 보거나) with no vowel-harmony split.",
      "grammar",
    ),
    phrase("ko-m24-3-p-or", "or (joining verbs)", "geona", "거나"),
    sentenceMcq({
      id: "ko-m24-3-q-readorlisten",
      prompt: "'I read books or listen to music.' —",
      correctHangul: "책을 읽거나 음악을 들어요",
      distractorsHangul: ["책을 읽고 음악을 들어요", "책을 읽거나 음악을 들어요보다", "책을 읽어서 음악을 들어요"],
      // NATIVE-REVIEW: 듣다 is a ㄷ-irregular → 들어요. 책을 읽거나 음악을
      // 들어요 is natural. The 읽고 distractor means 'and' (not 'or'). Confirm.
      explanation: "거나 = 'or'; 읽고 (the distractor) means 'and then'.",
      exercisedAtomSurfaces: ["책", "음악"],
    }),
    cloze(
      "ko-m24-3-cloze-watchorgame",
      "영화를 보",
      "게임을 해요",
      "거나",
      ["거나", "고", "어서", "지만"],
      "I watch movies or play games.",
      "영화를 보거나 게임을 해요",
      "거나 = 'or' between two actions.",
    ),
    sentenceMcq({
      id: "ko-m24-3-q-drawortakephoto",
      prompt: "'I draw or take photos.' —",
      correctHangul: "그림을 그리거나 사진을 찍어요",
      distractorsHangul: ["그림을 그리고 사진을 찍어요", "그림을 그리거나 사진을 찍어요보다", "그림을 그려서 사진을 찍어요"],
      explanation: "그리다 → 그리거나 ('draw or …').",
      exercisedAtomSurfaces: ["그림", "사진"],
    }),
    listeningCompSentence({
      id: "ko-m24-3-lc-readorlisten",
      audioText: "책을 읽거나 음악을 들어요",
      correctMeaningEn: "I read books or listen to music",
      distractorsEn: ["I read books and listen to music", "I read books, so I listen to music", "I don't read or listen"],
      exercisedAtomSurfaces: ["책", "음악"],
    }),
    speaking("ko-m24-3-speak-readorlisten", "책을 읽거나 음악을 들어요", "I read books or listen to music", ["책", "음악"]),
  ],
};

// ─── ko-m24-4 — Counter 번 (times) ──────────────────────────────────────────

const M24_4: LessonContent = {
  id: "ko-m24-4",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Counting times — 번",
  description: "한 번, 두 번: count how many times.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m24-4-info",
      "Native numbers + 번",
      "번 = '(number of) times', counted with NATIVE numbers: 한 번 (once), 두 번 (twice), 세 번 (3 times), 네 번 (4 times). Same pre-counter forms 한/두/세/네 you used for 명, 시, 살, 잔. 한 번 더 = 'one more time'.",
      "grammar",
    ),
    phrase("ko-m24-4-p-beon", "(counter for times)", "beon", "번"),
    sentenceMcq({
      id: "ko-m24-4-q-twice",
      prompt: "'twice (two times)' —",
      correctHangul: "두 번",
      distractorsHangul: ["둘 번", "이 번", "두 개"],
      explanation: "두 (pre-counter form) + 번. (이 번 with Sino 이 would mean 'this time', different word.)",
      exercisedAtomSurfaces: ["번"],
    }),
    cloze(
      "ko-m24-4-cloze-threetimes",
      "세",
      "봤어요",
      "번",
      ["번", "개", "명", "잔"],
      "I saw it three times.",
      "세 번 봤어요",
      "번 counts occurrences (times).",
    ),
    sentenceMcq({
      id: "ko-m24-4-q-onemore",
      prompt: "'one more time' —",
      correctHangul: "한 번 더",
      distractorsHangul: ["한 개 더", "하나 번 더", "한 번 제일"],
      explanation: "한 번 더 = 'once more / one more time.'",
      exercisedAtomSurfaces: ["번", "더"],
    }),
    listeningCompSentence({
      id: "ko-m24-4-lc-threetimes",
      audioText: "세 번 봤어요",
      correctMeaningEn: "I saw it three times",
      distractorsEn: ["I saw three of them", "I'll see it three times", "There are three people"],
      exercisedAtomSurfaces: ["번"],
    }),
    speaking("ko-m24-4-speak-onemore", "한 번 더", "one more time", ["번", "더"]),
  ],
};

// ─── ko-m24-5 — Frequency (일주일에 두 번) ──────────────────────────────────

const M24_5: LessonContent = {
  id: "ko-m24-5",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "How often — 일주일에 두 번",
  description: "Say how many times per week or day.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m24-5-info",
      "[period]에 [number] 번 — '… times per …'",
      "Combine a period + 에 ('per') with the 번 counter: 일주일에 두 번 = 'twice a week', 하루에 한 번 = 'once a day', 한 달에 세 번 = 'three times a month'. The frequency adverbs from M13 (자주 'often', 가끔 'sometimes') still work too: 가끔 그림을 그려요.",
      "grammar",
    ),
    phrase("ko-m24-5-p-week", "one week", "iljuil", "일주일", undefined, { emoji: "📅" }),
    sentenceMcq({
      id: "ko-m24-5-q-twiceweek",
      prompt: "'twice a week' —",
      correctHangul: "일주일에 두 번",
      distractorsHangul: ["일주일에 두 개", "일주일을 두 번", "일주일에 둘 번"],
      explanation: "일주일에 ('per week') + 두 번 ('two times').",
      exercisedAtomSurfaces: ["일주일", "번"],
    }),
    cloze(
      "ko-m24-5-cloze-onceaday",
      "하루",
      "한 번 운동해요",
      "에",
      ["에", "에서", "을", "보다"],
      "I exercise once a day.",
      "하루에 한 번 운동해요",
      "에 marks 'per': 하루에 = 'per day'.",
    ),
    sentenceMcq({
      id: "ko-m24-5-q-sometimesdraw",
      prompt: "'I sometimes draw.' —",
      correctHangul: "가끔 그림을 그려요",
      distractorsHangul: ["가끔 그림을 그리거나", "가끔 그림이 그려요", "자주 그림을 그려요"],
      // NATIVE-REVIEW: 가끔 ('sometimes', M13). 가끔 그림을 그려요 is natural.
      // The last distractor (자주) is a real word but wrong meaning ('often').
      explanation: "가끔 = sometimes; 그림을 그려요 = 'I draw.'",
      exercisedAtomSurfaces: ["그림"],
    }),
    listeningCompSentence({
      id: "ko-m24-5-lc-twiceweek",
      audioText: "일주일에 두 번 수영해요",
      correctMeaningEn: "I swim twice a week",
      distractorsEn: ["I swim once a week", "I swim twice a day", "I swam twice this week"],
      exercisedAtomSurfaces: ["일주일", "번", "수영"],
    }),
    speaking("ko-m24-5-speak-twiceweek", "일주일에 두 번 수영해요", "I swim twice a week", ["일주일", "번", "수영"]),
  ],
};

// ─── ko-m24-6 — Putting it together ─────────────────────────────────────────

const M24_6: LessonContent = {
  id: "ko-m24-6",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Describing your hobbies",
  description: "Combine hobby vocab, 거나, 줄 알다, and 번.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m24-6-info",
      "A hobby summary",
      "제 취미는 음악이에요. 일주일에 두 번 노래를 불러요 = 'My hobby is music. I sing twice a week.' 저는 그림을 그리거나 사진을 찍어요 = 'I draw or take photos.' Stack the M24 거나, the 번 frequency, and 줄 알다.",
      "default",
    ),
    build(
      "ko-m24-6-build-drawortakephoto",
      "Build: 'I draw or take photos.' (drawing-obj + draw-or + photo-obj + take)",
      "그림을 그리거나 사진을 찍어요",
      ["그림을", "그리거나", "사진을", "찍어요", "그리고"],
      ["그림을", "그리거나", "사진을", "찍어요"],
      ["그림", "사진"],
    ),
    sentenceMcq({
      id: "ko-m24-6-q-hobbyismusic",
      prompt: "'My hobby is music.' —",
      correctHangul: "제 취미는 음악이에요",
      distractorsHangul: ["제 취미는 음악예요", "제 취미가 음악이에요보다", "제 취미를 음악이에요"],
      // NATIVE-REVIEW: 음악 ends in a consonant (ㄱ) → 음악이에요 (not 음악예요).
      // 제 취미는 음악이에요 is natural. Note: for a HOBBY (not in-group kin),
      // 제 취미 is fine — unlike 우리 엄마 in M19.
      explanation: "음악 ends in a consonant → 음악이에요.",
      exercisedAtomSurfaces: ["취미", "음악"],
    }),
    translateStep({
      id: "ko-m24-6-tr-knowswim",
      promptEn: "I know how to swim.",
      acceptedAnswers: ["수영할 줄 알아요", "수영할 줄 알아요.", "저는 수영할 줄 알아요"],
      audioText: "수영할 줄 알아요",
      exercisedAtomSurfaces: ["수영"],
    }),
    listeningCompSentence({
      id: "ko-m24-6-lc-drawortakephoto",
      audioText: "그림을 그리거나 사진을 찍어요",
      correctMeaningEn: "I draw or take photos",
      distractorsEn: ["I draw and take photos", "I look at drawings and photos", "I can draw and take photos"],
      exercisedAtomSurfaces: ["그림", "사진"],
    }),
    speaking("ko-m24-6-speak-drawortakephoto", "그림을 그리거나 사진을 찍어요", "I draw or take photos", ["그림", "사진"]),
  ],
};

// ─── ko-m24-7 — Mini-dialogue ───────────────────────────────────────────────

const M24_7: LessonContent = {
  id: "ko-m24-7",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — talking about hobbies",
  description: "Ask and answer about each other's hobbies.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m24-7-info",
      "A hobby chat",
      "친구: 취미가 뭐예요? (What's your hobby?)\nYou: 저는 음악을 들어요. 노래도 할 줄 알아요. (I listen to music. I also know how to sing.)\n친구: 일주일에 몇 번 노래해요? (How many times a week do you sing?)\nYou: 두 번 해요. 같이 할까요? (Twice. Shall we do it together?)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m24-7-q-whathobby",
      prompt: "'What's your hobby?' —",
      correctHangul: "취미가 뭐예요?",
      distractorsHangul: ["취미를 뭐예요?", "취미가 어디예요?", "취미가 몇 번이에요?"],
      explanation: "취미가 뭐예요? = 'what is your hobby?'",
      exercisedAtomSurfaces: ["취미"],
    }),
    build(
      "ko-m24-7-build-listenknowsing",
      "Build: 'I listen to music. I also know how to sing.' (music-obj + listen + singing-also + know-how-to)",
      "음악을 들어요. 노래도 할 줄 알아요",
      ["음악을", "들어요.", "노래도", "할 줄 알아요", "몰라요"],
      ["음악을", "들어요.", "노래도", "할 줄 알아요"],
      ["음악", "노래"],
    ),
    sentenceMcq({
      id: "ko-m24-7-q-howmanytimes",
      prompt: "'How many times a week do you sing?' —",
      correctHangul: "일주일에 몇 번 노래해요?",
      distractorsHangul: ["일주일에 몇 개 노래해요?", "일주일을 몇 번 노래해요?", "일주일에 몇 명 노래해요?"],
      explanation: "몇 번 = 'how many times'; 개 counts objects, 명 counts people.",
      exercisedAtomSurfaces: ["일주일", "번", "노래"],
    }),
    listeningCompSentence({
      id: "ko-m24-7-lc-listenknowsing",
      audioText: "음악을 들어요. 노래도 할 줄 알아요",
      correctMeaningEn: "I listen to music. I also know how to sing",
      distractorsEn: ["I listen to music but can't sing", "I sing and listen to music twice", "Do you like music?"],
      exercisedAtomSurfaces: ["음악", "노래"],
    }),
    speaking("ko-m24-7-speak-whathobby", "취미가 뭐예요?", "What's your hobby?", ["취미"]),
  ],
};

// ─── ko-m24-8 — Mastery test ────────────────────────────────────────────────

const M24_8: LessonContent = {
  id: "ko-m24-8",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M24 Mastery Test",
  description: "Hobbies, 줄 알다, 거나, and the 번 counter.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m24-8-q-hobby",
      prompt: "Which means 'hobby'?",
      correctHangul: "취미",
      distractorsHangul: ["사진", "음악", "게임"],
      exercisedAtomSurfaces: ["취미"],
    }),
    sentenceMcq({
      id: "ko-m24-8-q-knowswim",
      prompt: "'I know how to swim.' —",
      correctHangul: "수영할 줄 알아요",
      distractorsHangul: ["수영할 줄 몰라요", "수영을 줄 알아요", "수영할 줄 알아요보다"],
      exercisedAtomSurfaces: ["수영"],
    }),
    cloze(
      "ko-m24-8-cloze-watchorgame",
      "영화를 보",
      "게임을 해요",
      "거나",
      ["거나", "고", "어서", "지만"],
      "I watch movies or play games.",
      "영화를 보거나 게임을 해요",
      "거나 = 'or' between two actions.",
    ),
    sentenceMcq({
      id: "ko-m24-8-q-twice",
      prompt: "'twice (two times)' —",
      correctHangul: "두 번",
      distractorsHangul: ["둘 번", "두 개", "두 명"],
      exercisedAtomSurfaces: ["번"],
    }),
    sentenceMcq({
      id: "ko-m24-8-q-twiceweek",
      prompt: "'twice a week' —",
      correctHangul: "일주일에 두 번",
      distractorsHangul: ["일주일에 두 개", "일주일을 두 번", "일주일에 둘 번"],
      exercisedAtomSurfaces: ["일주일", "번"],
    }),
    listeningCompSentence({
      id: "ko-m24-8-lc-readorlisten",
      audioText: "책을 읽거나 음악을 들어요",
      correctMeaningEn: "I read books or listen to music",
      distractorsEn: ["I read books and listen to music", "I read books, so I listen to music", "I don't read or listen"],
      exercisedAtomSurfaces: ["책", "음악"],
    }),
    speaking("ko-m24-8-speak-recap", "취미가 뭐예요?", "What's your hobby?", ["취미"]),
  ],
};

export const KO_M24_LESSONS: LessonContent[] = [
  M24_1,
  M24_2,
  M24_3,
  M24_4,
  M24_5,
  M24_6,
  M24_7,
  M24_8,
];
