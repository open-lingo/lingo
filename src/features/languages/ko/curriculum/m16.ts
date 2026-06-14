/**
 * Korean Module 16 — Prohibition, negative requests, sequence, like/dislike.
 *
 * KO analog of JA M16 (てはいけません prohibition + ないでください negative
 * request + てから sequence + すき/きらい like/dislike). Re-expressed in
 * Korean's own grammar:
 *
 *   ko-m16-1  (으)면 안 돼요 — you must not (the opposite of M15's 도 돼요)
 *   ko-m16-2  지 마세요 — please don't (negative request)
 *   ko-m16-3  고 나서 — after doing (A then B)
 *   ko-m16-4  좋아하다 — to like (doing)
 *   ko-m16-5  싫어하다 — to dislike (doing)
 *   ko-m16-6  Putting it together — rules + preferences
 *   ko-m16-7  Mini-dialogue — house rules
 *   ko-m16-8  M16 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - (으)면 안 돼요 = conditional 면 + 안 돼요. After a vowel stem just 면
 *     (가면 안 돼요 'you must not go'); after a consonant stem 으면 (먹으면 안
 *     돼요 'you must not eat'). The literal logic is 'if you do X, it's not
 *     okay' → 'you must not X'. This is the exact mirror of M15's 도 돼요.
 *   - 지 마세요 = stem + 지 마세요 ('please don't'): 가지 마세요 ('don't go'),
 *     먹지 마세요 ('don't eat'). The negative of the request, built on the M5
 *     세요 polite-command base.
 *   - 고 나서 = stem + 고 나서 ('after doing'): 밥을 먹고 나서 ('after eating').
 *     Stronger 'finish-then' than the bare 고.
 *   - 좋아하다 / 싫어하다 are TRANSITIVE verbs ('to like / dislike'), distinct
 *     from the adjective 좋다 ('to be good', M8). They take 을/를: 커피를
 *     좋아해요 ('I like coffee'). To like DOING, use 는 것을 좋아해요 (the
 *     nominalizer) — taught lightly here as a set pattern.
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

// ─── ko-m16-1 — (으)면 안 돼요 (prohibition) ────────────────────────────────

const M16_1: LessonContent = {
  id: "ko-m16-1",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "(으)면 안 돼요 — you must not",
  description: "The opposite of '도 돼요' — forbidding something.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m16-1-info",
      "면 / 으면 + 안 돼요",
      "To forbid, use the conditional 면 + 안 돼요 ('if you do X, it's not okay' → 'you must not X'). After a VOWEL stem use 면: 가다 → 가면 안 돼요 ('you must not go'). After a CONSONANT stem use 으면: 먹다 → 먹으면 안 돼요 ('you must not eat'). This is the exact mirror of M15's 도 돼요.",
      "grammar",
    ),
    phrase("ko-m16-1-p-mustnot-c", "must not (after consonant)", "eumyeon an dwaeyo", "으면 안 돼요"),
    phrase("ko-m16-1-p-mustnot-v", "must not (after vowel)", "myeon an dwaeyo", "면 안 돼요"),
    sentenceMcq({
      id: "ko-m16-1-q-mustnotgo",
      prompt: "'You must not go.' —",
      correctHangul: "가면 안 돼요",
      distractorsHangul: ["가으면 안 돼요", "가면 돼요", "가지 안 돼요"],
      explanation: "가다 is a vowel stem → 가면 안 돼요.",
      exercisedAtomSurfaces: ["면 안 돼요", "가요"],
    }),
    cloze(
      "ko-m16-1-cloze-mustnoteat",
      "여기서 밥을 먹",
      "안 돼요",
      "으면",
      ["으면", "면", "고", "도"],
      "You must not eat here.",
      "여기서 밥을 먹으면 안 돼요",
      "먹다 is a consonant stem → 먹으면 안 돼요.",
    ),
    sentenceMcq({
      id: "ko-m16-1-q-mustnotsmoke",
      prompt: "'You must not smoke (cigarettes).' —",
      correctHangul: "담배를 피우면 안 돼요",
      distractorsHangul: ["담배를 피우면 돼요", "담배를 피우으면 안 돼요", "담배를 피우지 안 돼요"],
      // NATIVE-REVIEW: 피우다 ('to smoke') → 피우면 (vowel stem). 피우다 is a
      // support verb, not a registered atom — confirm acceptable as
      // recognition-only and that 담배를 피우다 is the natural collocation.
      explanation: "피우다 is a vowel stem → 피우면 안 돼요.",
      exercisedAtomSurfaces: ["면 안 돼요", "담배"],
    }),
    listeningCompSentence({
      id: "ko-m16-1-lc-mustnotgo",
      audioText: "가면 안 돼요",
      correctMeaningEn: "You must not go",
      distractorsEn: ["You may go", "Please go", "I can't go"],
      exercisedAtomSurfaces: ["면 안 돼요", "가요"],
    }),
    speaking("ko-m16-1-speak-mustnoteat", "여기서 먹으면 안 돼요", "You must not eat here", ["으면 안 돼요"]),
  ],
};

// ─── ko-m16-2 — 지 마세요 (negative request) ────────────────────────────────

const M16_2: LessonContent = {
  id: "ko-m16-2",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "지 마세요 — please don't",
  description: "Politely ask someone not to do something.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m16-2-info",
      "stem + 지 마세요",
      "To ask someone NOT to do something, add 지 마세요 to the plain stem: 가지 마세요 ('please don't go'), 먹지 마세요 ('please don't eat'), 걱정하지 마세요 ('don't worry'). It's the negative of the polite request; the same 세요 polite-command base you met in 주세요.",
      "grammar",
    ),
    phrase("ko-m16-2-p-dont", "please don't (verb + 지 마세요)", "ji maseyo", "지 마세요"),
    sentenceMcq({
      id: "ko-m16-2-q-dontgo",
      prompt: "'Please don't go.' —",
      correctHangul: "가지 마세요",
      distractorsHangul: ["가지 마요", "안 가세요", "가면 마세요"],
      // NATIVE-REVIEW: 가지 마세요 (polite) vs 가지 마요 / 가지 마 (casual). The
      // distractor 가지 마요 is a real casual variant; confirm teaching the
      // 마세요 polite form as the target is right for this level.
      explanation: "Stem 가 + 지 마세요 = the polite 'please don't go'.",
      exercisedAtomSurfaces: ["지 마세요", "가요"],
    }),
    cloze(
      "ko-m16-2-cloze-donteat",
      "그거 먹",
      "마세요",
      "지",
      ["지", "고", "면", "서"],
      "Please don't eat that.",
      "그거 먹지 마세요",
      "먹다 → 먹지 마세요.",
    ),
    translateStep({
      id: "ko-m16-2-tr-dontworry",
      promptEn: "Please don't worry.",
      acceptedAnswers: ["걱정하지 마세요", "걱정하지 마세요."],
      audioText: "걱정하지 마세요",
      // NATIVE-REVIEW: 걱정하다 ('to worry') is a high-frequency set phrase but
      // not a registered atom — confirm 걱정하지 마세요 is fine as a taught
      // fixed expression here.
      exercisedAtomSurfaces: ["지 마세요"],
    }),
    listeningCompSentence({
      id: "ko-m16-2-lc-dontgo",
      audioText: "가지 마세요",
      correctMeaningEn: "Please don't go",
      distractorsEn: ["Please go", "You must not go", "I won't go"],
      exercisedAtomSurfaces: ["지 마세요", "가요"],
    }),
    speaking("ko-m16-2-speak-dontgo", "가지 마세요", "Please don't go", ["지 마세요", "가요"]),
  ],
};

// ─── ko-m16-3 — 고 나서 (after doing) ───────────────────────────────────────

const M16_3: LessonContent = {
  id: "ko-m16-3",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "고 나서 — after doing",
  description: "Do one thing, then the next.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m16-3-info",
      "stem + 고 나서",
      "고 나서 = 'after doing (and finishing)': 밥을 먹고 나서 자요 = 'After eating, I sleep.' It's a stronger 'finish-then-next' than the plain 고 from M14. Stem + 고 나서.",
      "grammar",
    ),
    phrase("ko-m16-3-p-after", "after doing (verb + 고 나서)", "go naseo", "고 나서"),
    sentenceMcq({
      id: "ko-m16-3-q-aftereating",
      prompt: "'After eating, I sleep.' —",
      correctHangul: "밥을 먹고 나서 자요",
      distractorsHangul: ["밥을 먹어서 자요", "밥을 먹고 나서 자고", "밥을 먹지 나서 자요"],
      explanation: "먹다 → 먹고 나서 ('after eating') + 자요.",
      exercisedAtomSurfaces: ["고 나서", "밥"],
    }),
    cloze(
      "ko-m16-3-cloze-afterstudy",
      "공부하",
      "쉬어요",
      "고 나서",
      ["고 나서", "지만", "으면", "도"],
      "After studying, I rest.",
      "공부하고 나서 쉬어요",
      "공부하다 → 공부하고 나서.",
    ),
    build(
      "ko-m16-3-build-afterwork",
      "Build: 'After working, I go home.' (work + after + home + go)",
      "일하고 나서 집에 가요",
      ["일하고 나서", "집에", "가요", "일해서"],
      ["일하고 나서", "집에", "가요"],
      ["고 나서", "가요"],
    ),
    listeningCompSentence({
      id: "ko-m16-3-lc-aftereating",
      audioText: "밥을 먹고 나서 자요",
      correctMeaningEn: "After eating, I sleep",
      distractorsEn: ["Before eating, I sleep", "I eat and want to sleep", "I sleep and then eat"],
      exercisedAtomSurfaces: ["고 나서", "밥"],
    }),
    speaking("ko-m16-3-speak-aftereating", "밥을 먹고 나서 자요", "After eating, I sleep", ["고 나서", "밥"]),
  ],
};

// ─── ko-m16-4 — 좋아하다 (to like) ──────────────────────────────────────────

const M16_4: LessonContent = {
  id: "ko-m16-4",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "좋아하다 — to like",
  description: "A verb for liking — different from the adjective 좋다.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m16-4-info",
      "좋아하다 takes 을/를",
      "좋아하다 ('to like') is a VERB and takes the object marker 을/를: 커피를 좋아해요 = 'I like coffee.' Don't confuse it with the adjective 좋다 ('to be good', M8) which takes 이/가 (커피가 좋아요 = 'coffee is good (to me)'). To like an ACTIVITY, use 는 것을 좋아해요: 영화 보는 것을 좋아해요 = 'I like watching movies.'",
      "grammar",
    ),
    phrase("ko-m16-4-p-like", "to like (likes)", "joahaeyo", "좋아해요"),
    sentenceMcq({
      id: "ko-m16-4-q-likecoffee",
      prompt: "'I like coffee.' —",
      correctHangul: "커피를 좋아해요",
      distractorsHangul: ["커피가 좋아해요", "커피를 좋아요", "커피를 좋아하고"],
      explanation: "좋아하다 is a verb → object 를: 커피를 좋아해요.",
      exercisedAtomSurfaces: ["좋아해요", "커피"],
    }),
    cloze(
      "ko-m16-4-cloze-likemovies",
      "영화",
      "좋아해요",
      "를",
      ["를", "가", "에", "도"],
      "I like movies.",
      "영화를 좋아해요",
      "Object of 좋아하다 → 를.",
    ),
    sentenceMcq({
      id: "ko-m16-4-q-likewatching",
      prompt: "'I like watching movies.' —",
      correctHangul: "영화 보는 것을 좋아해요",
      distractorsHangul: ["영화 보고 좋아해요", "영화 봐서 좋아해요", "영화 보는 것이 좋아해요"],
      // NATIVE-REVIEW: 보는 것을 좋아해요 is correct; some speakers say 보는
      // 걸 좋아해요 (contraction) or 보는 것을 좋아해요. Confirm the full form
      // is the right canonical target and that the 것이 distractor reads as
      // wrong (should be 것을 with the transitive 좋아하다).
      explanation: "Nominalize the action: 보는 것을 ('the watching') + 좋아해요.",
      exercisedAtomSurfaces: ["좋아해요", "영화"],
    }),
    listeningCompSentence({
      id: "ko-m16-4-lc-likecoffee",
      audioText: "커피를 좋아해요",
      correctMeaningEn: "I like coffee",
      distractorsEn: ["Coffee is good", "I want coffee", "I drink coffee"],
      exercisedAtomSurfaces: ["좋아해요", "커피"],
    }),
    speaking("ko-m16-4-speak-likecoffee", "커피를 좋아해요", "I like coffee", ["좋아해요", "커피"]),
  ],
};

// ─── ko-m16-5 — 싫어하다 (to dislike) ───────────────────────────────────────

const M16_5: LessonContent = {
  id: "ko-m16-5",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "싫어하다 — to dislike",
  description: "The opposite of 좋아하다.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m16-5-info",
      "싫어하다 takes 을/를 too",
      "싫어하다 ('to dislike / hate') is the opposite of 좋아하다 and also takes 을/를: 운동을 싫어해요 = 'I dislike exercising.' Both are everyday verbs for talking about preferences.",
      "grammar",
    ),
    phrase("ko-m16-5-p-dislike", "to dislike (dislikes)", "sireohaeyo", "싫어해요"),
    sentenceMcq({
      id: "ko-m16-5-q-dislikeexercise",
      prompt: "'I dislike exercising.' —",
      correctHangul: "운동을 싫어해요",
      distractorsHangul: ["운동이 싫어해요", "운동을 싫어요", "운동을 좋아해요"],
      explanation: "싫어하다 is a verb → object 을: 운동을 싫어해요.",
      exercisedAtomSurfaces: ["싫어해요", "운동"],
    }),
    cloze(
      "ko-m16-5-cloze-dislikerain",
      "비",
      "싫어해요",
      "를",
      ["를", "가", "에", "도"],
      "I dislike rain.",
      "비를 싫어해요",
      "Object of 싫어하다 → 를.",
    ),
    translateStep({
      id: "ko-m16-5-tr-dislikecoffee",
      promptEn: "I dislike coffee.",
      acceptedAnswers: ["커피를 싫어해요", "커피를 싫어해요."],
      audioText: "커피를 싫어해요",
      exercisedAtomSurfaces: ["싫어해요", "커피"],
    }),
    listeningCompSentence({
      id: "ko-m16-5-lc-dislikeexercise",
      audioText: "운동을 싫어해요",
      correctMeaningEn: "I dislike exercising",
      distractorsEn: ["I like exercising", "I exercise often", "I want to exercise"],
      exercisedAtomSurfaces: ["싫어해요", "운동"],
    }),
    speaking("ko-m16-5-speak-dislikeexercise", "운동을 싫어해요", "I dislike exercising", ["싫어해요", "운동"]),
  ],
};

// ─── ko-m16-6 — Putting it together ─────────────────────────────────────────

const M16_6: LessonContent = {
  id: "ko-m16-6",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Rules & preferences",
  description: "Combine prohibitions, requests, and likes.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m16-6-info",
      "Mixing the patterns",
      "여기서 담배를 피우면 안 돼요 = 'You must not smoke here.' 커피를 좋아하지만 가끔 마셔요 = 'I like coffee, but I only drink it sometimes.' Stack (으)면 안 돼요, 지 마세요, 고 나서, and 좋아하다/싫어하다.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m16-6-q-likebutsometimes",
      prompt: "'I like coffee, but I drink it sometimes.' —",
      correctHangul: "커피를 좋아하지만 가끔 마셔요",
      distractorsHangul: ["커피를 좋아하고 가끔 마셔요", "커피를 좋아해서 가끔 마셔요", "커피를 좋아하지만 가끔 마셔고"],
      explanation: "좋아하다 → 좋아하지만 ('like, but', M15's 지만).",
      exercisedAtomSurfaces: ["좋아해요", "지만"],
    }),
    build(
      "ko-m16-6-build-washtheneat",
      "Build: 'After washing my hands, I eat.' (hands + wash + after + eat)",
      "손을 씻고 나서 먹어요",
      ["손을", "씻고 나서", "먹어요", "씻어서"],
      ["손을", "씻고 나서", "먹어요"],
      // NATIVE-REVIEW: 손 ('hand') and 씻다 ('to wash') are support words, not
      // registered atoms — confirm 손을 씻다 reads naturally and is fine as
      // recognition-only here.
      ["고 나서", "먹어요"],
    ),
    translateStep({
      id: "ko-m16-6-tr-dontsmoke",
      promptEn: "Please don't smoke here.",
      acceptedAnswers: ["여기서 담배를 피우지 마세요", "여기서 담배를 피우지 마세요."],
      audioText: "여기서 담배를 피우지 마세요",
      exercisedAtomSurfaces: ["지 마세요", "담배"],
    }),
    listeningCompSentence({
      id: "ko-m16-6-lc-mustnotsmoke",
      audioText: "여기서 담배를 피우면 안 돼요",
      correctMeaningEn: "You must not smoke here",
      distractorsEn: ["You may smoke here", "Please smoke here", "I don't smoke"],
      exercisedAtomSurfaces: ["면 안 돼요", "담배"],
    }),
    speaking("ko-m16-6-speak-likebut", "커피를 좋아하지만 가끔 마셔요", "I like coffee, but drink it sometimes", ["좋아해요", "지만"]),
  ],
};

// ─── ko-m16-7 — Mini-dialogue ───────────────────────────────────────────────

const M16_7: LessonContent = {
  id: "ko-m16-7",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — house rules",
  description: "State a rule, make a request, share a preference.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m16-7-info",
      "Rules at home",
      "A: 여기서 담배를 피우면 안 돼요. (You can't smoke here.)\nB: 알겠어요. (Got it.)\nA: 신발을 벗고 나서 들어오세요. (Take off your shoes, then come in.)\nB: 네. 저는 깨끗한 집을 좋아해요. (Sure. I like a clean house.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m16-7-q-cantsmoke",
      prompt: "'You can't smoke here.' —",
      correctHangul: "여기서 담배를 피우면 안 돼요",
      distractorsHangul: ["여기서 담배를 피우면 돼요", "여기서 담배를 피우고 안 돼요", "여기서 담배를 피우지 돼요"],
      explanation: "피우다 → 피우면 안 돼요.",
      exercisedAtomSurfaces: ["면 안 돼요", "담배"],
    }),
    sentenceMcq({
      id: "ko-m16-7-q-dontworry",
      prompt: "'Please don't go.' —",
      correctHangul: "가지 마세요",
      distractorsHangul: ["가면 마세요", "안 가세요", "가지 않으세요"],
      explanation: "가지 마세요 = polite 'please don't go'.",
      exercisedAtomSurfaces: ["지 마세요", "가요"],
    }),
    build(
      "ko-m16-7-build-likeclean",
      "Build: 'I like coffee.' (coffee + like)",
      "커피를 좋아해요",
      ["커피를", "좋아해요", "싫어해요", "좋아요"],
      ["커피를", "좋아해요"],
      ["좋아해요", "커피"],
    ),
    listeningCompSentence({
      id: "ko-m16-7-lc-cantsmoke",
      audioText: "여기서 담배를 피우면 안 돼요",
      correctMeaningEn: "You must not smoke here",
      distractorsEn: ["You may smoke here", "I like smoking", "Please smoke outside"],
      exercisedAtomSurfaces: ["면 안 돼요", "담배"],
    }),
    speaking("ko-m16-7-speak-dontgo", "가지 마세요", "Please don't go", ["지 마세요", "가요"]),
  ],
};

// ─── ko-m16-8 — Mastery test ────────────────────────────────────────────────

const M16_8: LessonContent = {
  id: "ko-m16-8",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M16 Mastery Test",
  description: "Prohibition, requests, sequence, and like/dislike.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "ko-m16-8-q-mustnotgo",
      prompt: "'You must not go.' —",
      correctHangul: "가면 안 돼요",
      distractorsHangul: ["가으면 안 돼요", "가면 돼요", "가지 안 돼요"],
      exercisedAtomSurfaces: ["면 안 돼요", "가요"],
    }),
    sentenceMcq({
      id: "ko-m16-8-q-dontgo",
      prompt: "'Please don't go.' —",
      correctHangul: "가지 마세요",
      distractorsHangul: ["가지 마요", "안 가세요", "가면 마세요"],
      exercisedAtomSurfaces: ["지 마세요", "가요"],
    }),
    cloze(
      "ko-m16-8-cloze-aftereating",
      "밥을 먹",
      "자요",
      "고 나서",
      ["고 나서", "지만", "으면", "도"],
      "After eating, I sleep.",
      "밥을 먹고 나서 자요",
      "먹다 → 먹고 나서.",
    ),
    sentenceMcq({
      id: "ko-m16-8-q-likecoffee",
      prompt: "'I like coffee.' —",
      correctHangul: "커피를 좋아해요",
      distractorsHangul: ["커피가 좋아해요", "커피를 좋아요", "커피를 좋아하고"],
      exercisedAtomSurfaces: ["좋아해요", "커피"],
    }),
    sentenceMcq({
      id: "ko-m16-8-q-dislikeexercise",
      prompt: "'I dislike exercising.' —",
      correctHangul: "운동을 싫어해요",
      distractorsHangul: ["운동이 싫어해요", "운동을 싫어요", "운동을 좋아해요"],
      exercisedAtomSurfaces: ["싫어해요", "운동"],
    }),
    listeningCompSentence({
      id: "ko-m16-8-lc-mustnotsmoke",
      audioText: "여기서 담배를 피우면 안 돼요",
      correctMeaningEn: "You must not smoke here",
      distractorsEn: ["You may smoke here", "Please smoke here", "I don't smoke"],
      exercisedAtomSurfaces: ["면 안 돼요", "담배"],
    }),
    speaking("ko-m16-8-speak-recap", "커피를 좋아해요", "I like coffee", ["좋아해요", "커피"]),
  ],
};

export const KO_M16_LESSONS: LessonContent[] = [
  M16_1,
  M16_2,
  M16_3,
  M16_4,
  M16_5,
  M16_6,
  M16_7,
  M16_8,
];
