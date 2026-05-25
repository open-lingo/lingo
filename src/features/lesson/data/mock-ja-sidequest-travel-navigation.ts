import type { LessonContent } from "../types";
import {
  infoStep,
  speaking,
  listeningCompSentence,
  dialogueListen,
  build,
} from "./_jaGrammarHelpers";

/**
 * Getting Around — sidequest lesson (Pimsleur-style auditory travel sprint).
 *
 * Theme: trains, directions, asking where things are. Covers 7 high-utility
 * phrases for navigating Japan on foot or by taxi/train. Audio-driven,
 * Pimsleur listen-repeat-build cycle — no deep grammar, just functional
 * fluency for getting from A to B.
 *
 * The learner already knows some kana from earlier modules. This lesson
 * leans on listening comprehension + speaking + sentence building to drill
 * the phrases into procedural memory.
 *
 * Lesson id `ja-sidequest-travel-navigation` does NOT match the
 * `^ja-m\d+-…` shape `rowIdOf` uses, so `augmentWithReviewTail` skips it.
 */

export const MOCK_LESSON_JA_SIDEQUEST_TRAVEL_NAVIGATION: LessonContent = {
  id: "ja-sidequest-travel-navigation",
  moduleId: "sidequest",
  courseId: "mock-1",
  languageId: "ja",
  title: "Getting Around",
  description: "Ask for directions, find the station, and get a taxi.",
  estimatedMinutes: 4,
  xpReward: 25,
  steps: [
    // ── 1. Culture intro ────────────────────────────────────────────────
    infoStep(
      "ja-ts-nav-intro",
      "Getting around Japan",
      "Getting around Japan is easier than you think. Trains run on time, taxi drivers are honest, and everyone understands 'sumimasen' + pointing. This lesson gives you the 7 phrases you need to ask where things are, understand basic directions, and grab a taxi. Listen, repeat, build.",
      "culture",
    ),

    // ── 2. Listen: すみません ───────────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-nav-listen-sumimasen",
      audioText: "すみません",
      correctMeaningEn: "Excuse me",
      distractorsEn: ["Thank you", "I'm sorry (apology)", "Goodbye"],
      question: "What does this phrase mean?",
    }),

    // ── 3. Speaking: say すみません ─────────────────────────────────────
    speaking(
      "ja-ts-nav-say-sumimasen",
      "すみません",
      "Excuse me",
    ),

    // ── 4. Listen: えきはどこですか ─────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-nav-listen-eki",
      audioText: "えきはどこですか",
      correctMeaningEn: "Where is the station?",
      distractorsEn: [
        "How much is the ticket?",
        "When does the train leave?",
        "Is this the station?",
      ],
      question: "What does this sentence mean?",
    }),

    // ── 5. Speaking: say えきはどこですか ───────────────────────────────
    speaking(
      "ja-ts-nav-say-eki",
      "えきはどこですか",
      "Where is the station?",
    ),

    // ── 6. Listen: direction words ─────────────────────────────────────
    listeningCompSentence({
      id: "ja-ts-nav-listen-migi",
      audioText: "みぎ",
      correctMeaningEn: "Right",
      distractorsEn: ["Left", "Straight ahead", "Behind"],
      question: "What direction is this?",
    }),

    // ── 7. Dialogue: asking a stranger for directions ──────────────────
    dialogueListen({
      id: "ja-ts-nav-dialogue-directions",
      lines: [
        { speaker: "You", kana: "すみません、えきはどこですか" },
        { speaker: "Stranger", kana: "まっすぐ、そしてみぎです" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What is the traveler looking for?",
          correctText: "The station",
          distractors: ["A taxi", "A restaurant", "The subway"],
        },
        {
          id: "q2",
          prompt: "Which direction should they go?",
          correctText: "Straight, then right",
          distractors: [
            "Straight, then left",
            "Turn left immediately",
            "Go back the way you came",
          ],
        },
      ],
    }),

    // ── 8. Speaking: say タクシーをおねがいします ──────────────────────
    speaking(
      "ja-ts-nav-say-taxi",
      "タクシーをおねがいします",
      "Taxi please",
    ),

    // ── 9. Build sentence: "Where is the subway?" ──────────────────────
    build(
      "ja-ts-nav-build-chikatetsu",
      "Build: \"Where is the subway?\"",
      "ちかてつはどこですか",
      ["ちかてつ", "は", "どこ", "です", "か", "を", "みぎ"],
      ["ちかてつ", "は", "どこ", "です", "か"],
    ),

    // ── 10. Dialogue: taxi to the station ──────────────────────────────
    dialogueListen({
      id: "ja-ts-nav-dialogue-taxi",
      lines: [
        { speaker: "You", kana: "タクシーをおねがいします" },
        { speaker: "You", kana: "えきまでおねがいします" },
        { speaker: "Driver", kana: "はい、わかりました" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where does the passenger want to go?",
          correctText: "The station",
          distractors: ["The airport", "The hotel", "The subway"],
        },
      ],
    }),

    // ── 11. Win card ───────────────────────────────────────────────────
    infoStep(
      "ja-ts-nav-win",
      "You can navigate Japan",
      "You can now ask for directions, understand right/left/straight, find the station, and hail a taxi. Next time you land in Tokyo, these 7 phrases will get you from the airport to your hotel without a map app.",
      "win",
    ),
  ],
};
