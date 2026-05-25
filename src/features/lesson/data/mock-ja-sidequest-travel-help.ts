import type { LessonContent } from "../types";
import {
  infoStep,
  speaking,
  listeningCompSentence,
  dialogueListen,
  build,
} from "./_jaGrammarHelpers";

/**
 * Getting Help — sidequest travel lesson (Pimsleur-style auditory drill).
 *
 * Theme: lost, confused, emergencies. Six survival phrases taught via
 * listen→speak→dialogue→build cycling. Designed as a sprint — no grammar
 * deep-dives, just enough to get help from a stranger.
 *
 * Lesson id `ja-sidequest-travel-help` does NOT match the `^ja-m\d+-…`
 * shape `rowIdOf` uses, so `augmentWithReviewTail` skips it.
 */

export const MOCK_LESSON_JA_SIDEQUEST_TRAVEL_HELP: LessonContent = {
  id: "ja-sidequest-travel-help",
  moduleId: "sidequest",
  courseId: "mock-1",
  languageId: "ja",
  title: "Getting Help",
  description:
    "Ask for help, say you don't understand, and request repetition.",
  estimatedMinutes: 4,
  xpReward: 25,
  steps: [
    // ── 1. Intro ────────────────────────────────────────────────────────
    infoStep(
      "ja-ts-help-intro",
      "When you need help",
      "When you're lost or confused in Japan, a handful of phrases can turn a stressful moment into a solvable one. You'll learn how to say you don't understand, ask if someone speaks English, request that they repeat themselves, and call for help. Listen carefully — this lesson is all about your ears.",
      "culture",
    ),

    // ── 2. Listen: わかりません ─────────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-help-listen-wakarimasen",
      audioText: "わかりません",
      correctMeaningEn: "I don't understand",
      distractorsEn: [
        "I understand",
        "I'm sorry",
        "Please wait",
      ],
      question: "What does this phrase mean?",
    }),

    // ── 3. Speaking: わかりません ────────────────────────────────────────
    speaking(
      "ja-ts-help-say-wakarimasen",
      "わかりません",
      "I don't understand",
    ),

    // ── 4. Listen: ちょっとまってください ────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-help-listen-matte",
      audioText: "ちょっとまってください",
      correctMeaningEn: "Please wait a moment",
      distractorsEn: [
        "Please help me",
        "Please say it again",
        "Please speak slowly",
      ],
      question: "What does this phrase mean?",
    }),

    // ── 5. Speaking: ちょっとまってください ──────────────────────────────
    speaking(
      "ja-ts-help-say-matte",
      "ちょっとまってください",
      "Please wait a moment",
    ),

    // ── 6. Listen: えいごをはなせますか ──────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-help-listen-eigo",
      audioText: "えいごをはなせますか",
      correctMeaningEn: "Do you speak English?",
      distractorsEn: [
        "Do you understand Japanese?",
        "Where is the station?",
        "Can you help me?",
      ],
      question: "What does this phrase mean?",
    }),

    // ── 7. Speaking: えいごをはなせますか ────────────────────────────────
    speaking(
      "ja-ts-help-say-eigo",
      "えいごをはなせますか",
      "Do you speak English?",
    ),

    // ── 8. Dialogue: lost, asking for English ───────────────────────────
    dialogueListen({
      id: "ja-ts-help-dialogue-lost",
      lines: [
        { speaker: "You", kana: "すみません、えいごをはなせますか" },
        { speaker: "Stranger", kana: "すこしだけ" },
        { speaker: "You", kana: "ちょっとまってください" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What did you ask the stranger?",
          correctText: "If they speak English",
          distractors: [
            "Where the station is",
            "What time it is",
            "If they need help",
          ],
        },
        {
          id: "q2",
          prompt: "How much English does the stranger speak?",
          correctText: "A little",
          distractors: [
            "None at all",
            "Fluently",
            "Only reading",
          ],
        },
      ],
    }),

    // ── 9. Build: にほんごがわかりません ─────────────────────────────────
    build(
      "ja-ts-help-build-nihongo",
      "I don't understand Japanese",
      "にほんごがわかりません",
      ["にほんご", "が", "わかりません", "を", "は"],
      ["にほんご", "が", "わかりません"],
    ),

    // ── 10. Speaking: たすけてください ───────────────────────────────────
    speaking(
      "ja-ts-help-say-tasukete",
      "たすけてください",
      "Help, please",
    ),

    // ── 11. Dialogue: asking someone to repeat ──────────────────────────
    dialogueListen({
      id: "ja-ts-help-dialogue-repeat",
      lines: [
        { speaker: "Stranger", kana: "つぎのかどをみぎにまがってください" },
        { speaker: "You", kana: "わかりません。もういちどおねがいします" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Why did you respond the way you did?",
          correctText: "You didn't understand and asked them to repeat",
          distractors: [
            "You thanked them for directions",
            "You asked for their name",
            "You said goodbye",
          ],
        },
      ],
    }),

    // ── 12. Win card ────────────────────────────────────────────────────
    infoStep(
      "ja-ts-help-win",
      "You can ask for help",
      "You can now tell people you don't understand, ask if they speak English, request they repeat themselves, ask them to wait, and call for help in an emergency. These six phrases will get you through most confusing moments in Japan.",
      "win",
    ),
  ],
};
