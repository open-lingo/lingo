/**
 * Korean Module 26 — Explaining & excess.
 *
 * KO analog of JA M26 (んです explanatory-の + すぎる too-much + the
 * connective set だから/でも/しかし/それで/そして). Re-expressed in Korean's
 * own grammar:
 *
 *   ko-m26-1  Feeling/trouble verbs — 피곤하다 / 늦다 / 잊어버리다 / 실수하다
 *   ko-m26-2  Connectives — 그래서 / 하지만 / 그리고 / 그런데
 *   ko-m26-3  거든요 — explaining a reason (you see, …)
 *   ko-m26-4  너무 — too / excessively (excess)
 *   ko-m26-5  아/어서 — so / because (cause → result)
 *   ko-m26-6  Putting it together — explaining why
 *   ko-m26-7  Mini-dialogue — why are you late?
 *   ko-m26-8  M26 Mastery Test
 *
 * Korean facts taught (not bugs):
 *   - 거든요 = a spoken explanatory ending: it offers a reason / new
 *     information the listener didn't have. 늦었어요. 길이 막혔거든요.
 *     ('I'm late. (You see,) the road was jammed.') Attaches to the verb
 *     stem (present 〜거든요, past 〜았/었거든요). It's conversational and
 *     polite. (KO match to JA's explanatory んです.)
 *   - 너무 = 'too / excessively' — an intensifier before adjectives/adverbs:
 *     너무 피곤해요 ('I'm too tired'); 너무 많이 먹었어요 ('I ate too much').
 *     너무 leans negative/excess; in casual speech it's also used for plain
 *     'very', but here we teach the EXCESS reading to match JA すぎる.
 *   - Connectives (sentence-initial): 그래서 ('so/therefore', result),
 *     하지만 ('but/however', contrast), 그리고 ('and', addition), 그런데
 *     ('but / by the way', mild contrast / topic shift). These join two
 *     SENTENCES, unlike the clause endings 〜고 / 〜지만.
 *   - 아/어서 = 'so / because' — joins a cause clause to a result within ONE
 *     sentence: 늦어서 죄송해요 ('I'm late, so I'm sorry'); 피곤해서 집에
 *     있어요 ('I'm tired, so I stay home'). After bright vowel (ㅏ/ㅗ) → 아서;
 *     else → 어서; 하다 → 해서. The clause before 아/어서 stays tense-neutral
 *     (no 았/었 here). This is the in-sentence cousin of 그래서.
 *
 * Vocab: 피곤하다 (tired), 늦다 (late), 잊어버리다 (forget), 실수 (mistake),
 *   하지만 (but), 그리고 (and), 그런데 (but/however), 너무 (too). Reuses
 *   그래서 (M13), 병원 (M6), 먹다/가다 (M7). NATIVE-REVIEW flags inline.
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

// ─── ko-m26-1 — Feeling / trouble verbs ─────────────────────────────────────

const M26_1: LessonContent = {
  id: "ko-m26-1",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Trouble — 피곤하다, 늦다, 잊어버리다, 실수",
  description: "Tired, late, forget, mistake.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "ko-m26-1-info",
      "Words for when things go wrong",
      "피곤하다 = 'be tired' (피곤해요 'I'm tired'). 늦다 = 'be late' (늦었어요 'I was late'). 잊어버리다 = 'forget' (잊어버렸어요 'I forgot'). 실수 = 'a mistake' (실수했어요 'I made a mistake'). These are the things you'll soon EXPLAIN with 거든요.",
      "default",
    ),
    phrase("ko-m26-1-p-tired", "be tired", "pigonhada", "피곤하다", undefined, { emoji: "😫" }),
    phrase("ko-m26-1-p-late", "be late", "neutda", "늦다", undefined, { emoji: "⏰" }),
    phrase("ko-m26-1-p-forget", "forget", "ijeobeorida", "잊어버리다", undefined, { emoji: "🤦" }),
    phrase("ko-m26-1-p-mistake", "mistake", "silsu", "실수", undefined, { emoji: "❌" }),
    sentenceMcq({
      id: "ko-m26-1-q-tired",
      prompt: "'I'm tired.' —",
      correctHangul: "피곤해요",
      distractorsHangul: ["늦었어요", "잊어버렸어요", "실수했어요"],
      // NATIVE-REVIEW: 피곤하다 → 피곤해요 ('I'm tired', adjective). Confirm.
      explanation: "피곤하다 → 피곤해요 = 'I'm tired'.",
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    sentenceMcq({
      id: "ko-m26-1-q-late",
      prompt: "'I was late.' —",
      correctHangul: "늦었어요",
      distractorsHangul: ["피곤해요", "실수했어요", "잊어버렸어요"],
      // NATIVE-REVIEW: 늦다 → 늦었어요 (past). Confirm reads as 'I was late'.
      explanation: "늦다 → 늦었어요 = 'I was late'.",
      exercisedAtomSurfaces: ["늦다"],
    }),
    listeningCompSentence({
      id: "ko-m26-1-lc-forgot",
      audioText: "잊어버렸어요",
      correctMeaningEn: "I forgot",
      distractorsEn: ["I'm tired", "I was late", "I made a mistake"],
      exercisedAtomSurfaces: ["잊어버리다"],
    }),
    speaking("ko-m26-1-speak-mistake", "실수했어요", "I made a mistake", ["실수"]),
  ],
};

// ─── ko-m26-2 — Connectives ─────────────────────────────────────────────────

const M26_2: LessonContent = {
  id: "ko-m26-2",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Connectives — 그래서, 하지만, 그리고, 그런데",
  description: "Join sentences: so, but, and, however.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m26-2-info",
      "Sentence-starting connectives",
      "그래서 = 'so / therefore' (result). 하지만 = 'but / however' (contrast). 그리고 = 'and' (addition). 그런데 = 'but / by the way' (mild contrast or topic shift). These start a NEW sentence: 피곤해요. 그래서 집에 있어요. ('I'm tired. So I stay home.')",
      "grammar",
    ),
    phrase("ko-m26-2-p-but", "but / however", "hajiman", "하지만"),
    phrase("ko-m26-2-p-and", "and", "geurigo", "그리고"),
    phrase("ko-m26-2-p-however", "but / by the way", "geureonde", "그런데"),
    sentenceMcq({
      id: "ko-m26-2-q-so",
      prompt: "'I'm tired. So I stay home.' —",
      correctHangul: "피곤해요. 그래서 집에 있어요",
      distractorsHangul: ["피곤해요. 하지만 집에 있어요", "피곤해요. 그리고 집에 있어요", "피곤해요. 그래서 집에 있어요보다"],
      explanation: "그래서 = 'so' (result). 하지만 = 'but'; 그리고 = 'and'.",
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    cloze(
      "ko-m26-2-cloze-but",
      "피곤해요.",
      "학교에 가요",
      "하지만",
      ["하지만", "그래서", "그리고", "그런데"],
      "I'm tired. But I go to school.",
      "피곤해요. 하지만 학교에 가요",
      "하지만 = 'but' — contrast between the two sentences.",
    ),
    sentenceMcq({
      id: "ko-m26-2-q-and",
      prompt: "'I went to the hospital. And I took medicine.' —",
      correctHangul: "병원에 갔어요. 그리고 약을 먹었어요",
      distractorsHangul: ["병원에 갔어요. 하지만 약을 먹었어요", "병원에 갔어요. 그런데 약을 먹었어요", "병원에 갔어요. 그래서 약을 먹었어요"],
      // NATIVE-REVIEW: 약을 먹다 ('take medicine', lit. 'eat medicine') is the
      // standard collocation. 그리고 = 'and' (simple addition). 그래서 ('so')
      // would also be plausible logically; 그리고 best fits a neutral 'and'.
      explanation: "그리고 = 'and' (adds the next action). 약을 먹다 = 'take medicine'.",
      exercisedAtomSurfaces: ["병원", "약"],
    }),
    listeningCompSentence({
      id: "ko-m26-2-lc-so",
      audioText: "피곤해요. 그래서 집에 있어요",
      correctMeaningEn: "I'm tired. So I stay home",
      distractorsEn: ["I'm tired, but I stay home", "I'm tired and I go home", "I'm tired, by the way I'm home"],
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    speaking("ko-m26-2-speak-but", "피곤해요. 하지만 학교에 가요", "I'm tired. But I go to school", ["피곤하다"]),
  ],
};

// ─── ko-m26-3 — 거든요 (explaining a reason) ─────────────────────────────────

const M26_3: LessonContent = {
  id: "ko-m26-3",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "거든요 — you see, … (explaining)",
  description: "Give the reason behind what you said.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m26-3-info",
      "거든요 offers a reason / new info",
      "거든요 = a spoken explanatory ending — it gives the listener a REASON or new information they didn't have. 늦었어요. 길이 막혔거든요. ('I'm late. (You see,) the road was jammed.') Attaches to the verb stem: present 〜거든요, past 〜았/었거든요. It's conversational and polite. (KO match to JA's explanatory んです.)",
      "grammar",
    ),
    phrase("ko-m26-3-p-because", "you see / because (explaining)", "-geodeunyo", "거든요"),
    sentenceMcq({
      id: "ko-m26-3-q-tiredbecause",
      prompt: "'(It's because) I'm tired, you see.' —",
      correctHangul: "피곤하거든요",
      distractorsHangul: ["피곤하지만", "피곤하고", "피곤하거든요보다"],
      // NATIVE-REVIEW: 피곤하다 + 거든요 → 피곤하거든요 ('you see, I'm tired').
      // 〜지만 = 'but', 〜고 = 'and' (clause linkers, different function). Confirm.
      explanation: "거든요 explains a reason; 지만 = 'but', 고 = 'and'.",
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    cloze(
      "ko-m26-3-cloze-latebecause",
      "늦었어요. 길이 막혔",
      "",
      "거든요",
      ["거든요", "지만", "그래서", "거나"],
      "I'm late. (You see,) the road was jammed.",
      "늦었어요. 길이 막혔거든요",
      "Past stem 막혔 + 거든요 = '(you see) it got jammed' — the reason.",
    ),
    sentenceMcq({
      id: "ko-m26-3-q-wenthospital",
      prompt: "'(It's because) I went to the hospital, you see.' —",
      correctHangul: "병원에 갔거든요",
      distractorsHangul: ["병원에 가거든요", "병원에 갔지만", "병원에 갔그래서"],
      // NATIVE-REVIEW: past explanatory → 갔거든요 (past stem 갔 + 거든요).
      // 갔그래서 is not valid (그래서 is sentence-initial, not a stem suffix). Confirm.
      explanation: "Past 갔 + 거든요 = 'you see, I went'. 그래서 can't attach to a stem.",
      exercisedAtomSurfaces: ["병원"],
    }),
    listeningCompSentence({
      id: "ko-m26-3-lc-tiredbecause",
      audioText: "오늘 너무 피곤하거든요",
      correctMeaningEn: "It's because I'm so tired today",
      distractorsEn: ["I'm not tired today", "I was tired but I'm fine now", "I'll be tired today"],
      exercisedAtomSurfaces: ["피곤하다", "너무"],
    }),
    speaking("ko-m26-3-speak-tiredbecause", "피곤하거든요", "You see, I'm tired", ["피곤하다"]),
  ],
};

// ─── ko-m26-4 — 너무 (too / excessively) ────────────────────────────────────

const M26_4: LessonContent = {
  id: "ko-m26-4",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "너무 — too / too much",
  description: "Express excess: too tired, ate too much.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "ko-m26-4-info",
      "너무 marks excess",
      "너무 = 'too / excessively' — placed before an adjective or adverb: 너무 피곤해요 ('I'm too tired'); 너무 많이 먹었어요 ('I ate too much'). 너무 leans toward 'more than is good'. (In casual speech 너무 is also used for plain 'very', but here it carries the EXCESS sense, matching JA すぎる.)",
      "grammar",
    ),
    phrase("ko-m26-4-p-too", "too / excessively", "neomu", "너무"),
    sentenceMcq({
      id: "ko-m26-4-q-tootired",
      prompt: "'I'm too tired.' —",
      correctHangul: "너무 피곤해요",
      distractorsHangul: ["피곤 너무해요", "너무 피곤하거든요", "너무 피곤해요보다"],
      // NATIVE-REVIEW: 너무 goes BEFORE the adjective → 너무 피곤해요. Confirm.
      explanation: "너무 + adjective = 'too …'. 너무 comes before 피곤해요.",
      exercisedAtomSurfaces: ["너무", "피곤하다"],
    }),
    cloze(
      "ko-m26-4-cloze-atetoomuch",
      "밥을",
      "많이 먹었어요",
      "너무",
      ["너무", "그래서", "하지만", "거나"],
      "I ate too much (rice/food).",
      "밥을 너무 많이 먹었어요",
      "너무 많이 = 'too much' (excess amount).",
    ),
    sentenceMcq({
      id: "ko-m26-4-q-tooexpensive",
      prompt: "'It's too expensive.' —",
      correctHangul: "너무 비싸요",
      distractorsHangul: ["비싸 너무요", "너무 비싸거든요", "비싸요 너무"],
      // NATIVE-REVIEW: 비싸다 ('expensive', earlier module) → 너무 비싸요.
      // Confirm 너무 비싸요 reads as 'it's too expensive'.
      explanation: "너무 + 비싸요 = 'too expensive'.",
      exercisedAtomSurfaces: ["너무"],
    }),
    listeningCompSentence({
      id: "ko-m26-4-lc-atetoomuch",
      audioText: "너무 많이 먹어서 배가 아파요",
      correctMeaningEn: "I ate too much, so my stomach hurts",
      distractorsEn: ["I didn't eat much, so I'm hungry", "I ate a little and I'm fine", "I'll eat too much later"],
      exercisedAtomSurfaces: ["너무"],
    }),
    speaking("ko-m26-4-speak-tootired", "너무 피곤해요", "I'm too tired", ["너무", "피곤하다"]),
  ],
};

// ─── ko-m26-5 — 아/어서 (so / because) ───────────────────────────────────────

const M26_5: LessonContent = {
  id: "ko-m26-5",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "아/어서 — so / because (in one sentence)",
  description: "Link a cause to its result in a single sentence.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m26-5-info",
      "아/어서 joins cause → result",
      "아/어서 = 'so / because' — joins a cause clause to its result WITHIN one sentence: 늦어서 죄송해요 ('I'm late, so I'm sorry'); 피곤해서 집에 있어요 ('I'm tired, so I stay home'). After a bright vowel (ㅏ/ㅗ) → 아서; otherwise → 어서; 하다 → 해서. The first clause stays tense-neutral (no 았/었 before 서). This is the in-sentence cousin of 그래서.",
      "grammar",
    ),
    phrase("ko-m26-5-p-soa", "so / because (bright vowel)", "-aseo", "아서"),
    phrase("ko-m26-5-p-soeo", "so / because (other)", "-eoseo", "어서"),
    sentenceMcq({
      id: "ko-m26-5-q-latesorry",
      prompt: "'I'm late, so I'm sorry.' —",
      correctHangul: "늦어서 죄송해요",
      distractorsHangul: ["늦었어서 죄송해요", "늦지만 죄송해요", "늦어서 죄송해요보다"],
      // NATIVE-REVIEW: 늦다 → 늦어서 (NOT 늦었어서 — no past tense before 서).
      // 죄송하다 ('be sorry', earlier module) → 죄송해요. Confirm natural.
      explanation: "늦다 → 늦어서. The cause clause before 서 takes no past 았/었.",
      exercisedAtomSurfaces: ["늦다"],
    }),
    cloze(
      "ko-m26-5-cloze-tiredstayhome",
      "피곤해",
      "집에 있어요",
      "서",
      ["서", "지만", "거나", "려고"],
      "I'm tired, so I stay home.",
      "피곤해서 집에 있어요",
      "피곤하다 → 피곤해서 ('tired, so …').",
    ),
    sentenceMcq({
      id: "ko-m26-5-q-sickhospital",
      prompt: "'I was sick, so I went to the hospital.' —",
      correctHangul: "아파서 병원에 갔어요",
      distractorsHangul: ["아팠어서 병원에 갔어요", "아프지만 병원에 갔어요", "아파서 병원에 갈 거예요"],
      // NATIVE-REVIEW: 아프다 ('be sick/hurt', earlier module) → 아파서 (르/ㅡ
      // handling: 아프 + 아서 → 아파서). No 았/었 before 서; the PAST sits on
      // the final verb 갔어요. Confirm 아파서 병원에 갔어요 is natural.
      explanation: "아프다 → 아파서. Past tense lives on the final verb 갔어요, not before 서.",
      exercisedAtomSurfaces: ["병원"],
    }),
    listeningCompSentence({
      id: "ko-m26-5-lc-tiredstayhome",
      audioText: "너무 피곤해서 집에 있어요",
      correctMeaningEn: "I'm so tired, so I stay home",
      distractorsEn: ["I'm tired, but I go out", "I stay home, so I'm tired", "I'll be tired at home"],
      exercisedAtomSurfaces: ["너무", "피곤하다"],
    }),
    speaking("ko-m26-5-speak-latesorry", "늦어서 죄송해요", "I'm late, so I'm sorry", ["늦다"]),
  ],
};

// ─── ko-m26-6 — Putting it together ─────────────────────────────────────────

const M26_6: LessonContent = {
  id: "ko-m26-6",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Explaining why",
  description: "Combine 거든요, 너무, 아/어서, and connectives.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m26-6-info",
      "Give a full explanation",
      "늦어서 죄송해요. 너무 피곤하거든요. ('I'm sorry I'm late. (You see,) I'm so tired.') Stack 아/어서 (cause→result), 너무 (excess), and 거든요 (the reason you offer).",
      "default",
    ),
    build(
      "ko-m26-6-build-latesorrytired",
      "Build: 'I'm late, so I'm sorry. (You see,) I'm too tired.' (late-so + sorry + too-tired-you-see)",
      "늦어서 죄송해요. 너무 피곤하거든요",
      ["늦어서", "죄송해요.", "너무", "피곤하거든요", "피곤해요"],
      ["늦어서", "죄송해요.", "너무", "피곤하거든요"],
      ["늦다", "너무", "피곤하다"],
    ),
    sentenceMcq({
      id: "ko-m26-6-q-forgot",
      prompt: "'I'm sorry. (You see,) I forgot.' —",
      correctHangul: "죄송해요. 잊어버렸거든요",
      distractorsHangul: ["죄송해요. 잊어버리거든요", "죄송해요. 잊어버렸지만", "죄송해요. 잊어버렸그래서"],
      // NATIVE-REVIEW: past explanatory → 잊어버렸거든요 (past stem 잊어버렸 +
      // 거든요). Confirm reads as 'you see, I forgot'.
      explanation: "Past 잊어버렸 + 거든요 = '(you see) I forgot'.",
      exercisedAtomSurfaces: ["잊어버리다"],
    }),
    translateStep({
      id: "ko-m26-6-tr-tiredstayhome",
      promptEn: "I'm tired, so I stay home.",
      acceptedAnswers: ["피곤해서 집에 있어요", "피곤해서 집에 있어요.", "너무 피곤해서 집에 있어요"],
      audioText: "피곤해서 집에 있어요",
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    listeningCompSentence({
      id: "ko-m26-6-lc-latesorrytired",
      audioText: "늦어서 죄송해요. 너무 피곤하거든요",
      correctMeaningEn: "I'm sorry I'm late. (You see,) I'm too tired",
      distractorsEn: ["I'm late but not sorry", "I'm sorry, but I'm not tired", "I'll be late because I'm tired"],
      exercisedAtomSurfaces: ["늦다", "너무", "피곤하다"],
    }),
    speaking("ko-m26-6-speak-latesorrytired", "늦어서 죄송해요. 너무 피곤하거든요", "I'm sorry I'm late. You see, I'm too tired", ["늦다", "피곤하다"]),
  ],
};

// ─── ko-m26-7 — Mini-dialogue: why are you late? ────────────────────────────

const M26_7: LessonContent = {
  id: "ko-m26-7",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "Mini-dialogue — why are you late?",
  description: "Apologize and explain a reason.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    infoStep(
      "ko-m26-7-info",
      "Apology chat",
      "친구: 왜 늦었어요? (Why are you late?)\nYou: 죄송해요. 길이 너무 막혔거든요. (Sorry. The road was too jammed, you see.)\n친구: 괜찮아요. 피곤해요? (It's OK. Are you tired?)\nYou: 네, 너무 피곤해서 집에 가고 싶어요. (Yes, I'm so tired I want to go home.)\nYou can run this whole exchange now.",
      "default",
    ),
    sentenceMcq({
      id: "ko-m26-7-q-whylate",
      prompt: "'Why are you late?' —",
      correctHangul: "왜 늦었어요?",
      distractorsHangul: ["왜 늦어요?", "왜 늦을 거예요?", "왜 늦거든요?"],
      // NATIVE-REVIEW: 왜 ('why', earlier module) + past 늦었어요 = 'why were
      // you late?'. Confirm natural. 거든요 (explanatory) wouldn't be a question.
      explanation: "왜 늦었어요? = 'why were you late?' (past).",
      exercisedAtomSurfaces: ["늦다"],
    }),
    build(
      "ko-m26-7-build-sorryjammed",
      "Build: 'Sorry. The road was too jammed, you see.' (sorry + road-subj + too + got-jammed-you-see)",
      "죄송해요. 길이 너무 막혔거든요",
      ["죄송해요.", "길이", "너무", "막혔거든요", "막혀요"],
      ["죄송해요.", "길이", "너무", "막혔거든요"],
      ["너무"],
    ),
    sentenceMcq({
      id: "ko-m26-7-q-tiredgohome",
      prompt: "'I'm so tired I want to go home.' —",
      correctHangul: "너무 피곤해서 집에 가고 싶어요",
      distractorsHangul: ["너무 피곤하지만 집에 가고 싶어요", "너무 피곤해서 집에 가고 싶어요보다", "피곤 너무해서 집에 가고 싶어요"],
      explanation: "너무 피곤해서 = 'so tired, so …'; 가고 싶어요 = 'want to go'.",
      exercisedAtomSurfaces: ["너무", "피곤하다"],
    }),
    listeningCompSentence({
      id: "ko-m26-7-lc-sorryjammed",
      audioText: "죄송해요. 길이 너무 막혔거든요",
      correctMeaningEn: "Sorry. The road was too jammed, you see",
      distractorsEn: ["Sorry, but the road was clear", "Thanks, the road was fine", "I'll be late because of the road"],
      exercisedAtomSurfaces: ["너무"],
    }),
    speaking("ko-m26-7-speak-whylate", "왜 늦었어요?", "Why are you late?", ["늦다"]),
  ],
};

// ─── ko-m26-8 — Mastery test ────────────────────────────────────────────────

const M26_8: LessonContent = {
  id: "ko-m26-8",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "ko",
  title: "M26 Mastery Test",
  description: "Trouble verbs, connectives, 거든요, 너무, 아/어서.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "ko-m26-8-q-tired",
      prompt: "'I'm tired.' —",
      correctHangul: "피곤해요",
      distractorsHangul: ["늦었어요", "실수했어요", "잊어버렸어요"],
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    cloze(
      "ko-m26-8-cloze-but",
      "피곤해요.",
      "학교에 가요",
      "하지만",
      ["하지만", "그래서", "그리고", "그런데"],
      "I'm tired. But I go to school.",
      "피곤해요. 하지만 학교에 가요",
      "하지만 = 'but' between two sentences.",
    ),
    sentenceMcq({
      id: "ko-m26-8-q-tiredbecause",
      prompt: "'(It's because) I'm tired, you see.' —",
      correctHangul: "피곤하거든요",
      distractorsHangul: ["피곤하지만", "피곤하고", "피곤해서"],
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    sentenceMcq({
      id: "ko-m26-8-q-tootired",
      prompt: "'I'm too tired.' —",
      correctHangul: "너무 피곤해요",
      distractorsHangul: ["피곤 너무해요", "너무 피곤하거든요", "피곤해요 너무"],
      exercisedAtomSurfaces: ["너무", "피곤하다"],
    }),
    cloze(
      "ko-m26-8-cloze-tiredstayhome",
      "피곤해",
      "집에 있어요",
      "서",
      ["서", "지만", "거나", "려고"],
      "I'm tired, so I stay home.",
      "피곤해서 집에 있어요",
      "피곤하다 → 피곤해서 ('tired, so …').",
    ),
    listeningCompSentence({
      id: "ko-m26-8-lc-so",
      audioText: "피곤해요. 그래서 집에 있어요",
      correctMeaningEn: "I'm tired. So I stay home",
      distractorsEn: ["I'm tired, but I stay home", "I'm tired and I go home", "I'm tired, by the way I'm home"],
      exercisedAtomSurfaces: ["피곤하다"],
    }),
    speaking("ko-m26-8-speak-recap", "왜 늦었어요?", "Why are you late?", ["늦다"]),
  ],
};

export const KO_M26_LESSONS: LessonContent[] = [
  M26_1,
  M26_2,
  M26_3,
  M26_4,
  M26_5,
  M26_6,
  M26_7,
  M26_8,
];
