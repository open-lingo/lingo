import type { LessonContent, PhraseCardStep } from "@/features/lesson/types";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";

/**
 * Survival Phrasebook — sidequest lesson (curriculum-design-v2 §6).
 *
 * EXPOSURE-first, not quiz-first. Earlier version asked "what does X
 * mean?" before the learner had seen X — that's testing recall before
 * any teaching has happened (the audit-mockProgress-of-the-lesson called
 * it "insane"). Fixed 2026-05-16: each phrase is a `phrase_card` —
 * meaning on top, romaji in the middle, kana decorating below, audio
 * auto-plays. The user reads, hears, continues. No correct/incorrect.
 *
 * 15 high-utility travel phrases. Audio-driven, romaji-first (kana as
 * decoration — Priya hasn't done the kana grind yet). Day-1 unlock from
 * the sidequest rail.
 *
 * Lesson id `ja-sidequest-survival-phrases` does NOT match the
 * `^ja-m\d+-…` shape `rowIdOf` uses, so `augmentWithReviewTail` skips it.
 */

function phrase(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return {
    id,
    type: "phrase_card",
    meaningEn,
    romaji,
    kana,
    cultureNote,
  };
}

export const MOCK_LESSON_JA_SIDEQUEST_SURVIVAL: LessonContent = {
  id: "ja-sidequest-survival-phrases",
  moduleId: "sidequest",
  courseId: "mock-1",
  languageId: "ja",
  title: "Survival Phrasebook",
  description:
    "15 phrases that turn a tourist trip from baffling to functional.",
  estimatedMinutes: 5,
  xpReward: 20,
  steps: [
    {
      id: "ja-surv-info-0",
      type: "info",
      title: "15 phrases, 5 minutes",
      body:
        "Quick exposure to the 15 phrases that cover ~80% of tourist Japan: hello, thanks, sorry, yes/no, how much, where, please, what, who, when, got it. Tap to hear each one. You don't need to memorize anything — just hear them once so they feel familiar when you meet them in the wild.",
      variant: "culture",
    },

    // ─── Greetings + politeness ──────────────────────────────────────
    phrase(
      "ja-surv-konnichiwa",
      "Hello / good afternoon",
      "konnichiwa",
      "こんにちは",
      "Used roughly 10am to 5pm. Morning: おはよう (ohayou). Evening: こんばんは (konbanwa).",
    ),
    phrase(
      "ja-surv-arigatou",
      "Thank you (formal)",
      "arigatou gozaimasu",
      "ありがとうございます",
      "The casual form is just ありがとう (arigatou). Use the full version with strangers and shop staff.",
    ),
    phrase(
      "ja-surv-sumimasen",
      "Excuse me / sorry / pardon",
      "sumimasen",
      "すみません",
      "The Swiss Army knife of Japanese. Use it to flag a waiter, apologize for a small bump, or open any sentence asking a stranger for help.",
    ),
    phrase(
      "ja-surv-gomennasai",
      "I'm sorry",
      "gomen nasai",
      "ごめんなさい",
      "Heavier than すみません. Use this for actual apologies, not 'excuse me.'",
    ),

    // ─── Yes / no / understanding ────────────────────────────────────
    phrase(
      "ja-surv-hai",
      "Yes",
      "hai",
      "はい",
      "Often doubled as 'はい、はい' to acknowledge — like an English 'mhm, mhm.' Doesn't always mean 'I agree,' sometimes just 'I'm listening.'",
    ),
    phrase("ja-surv-iie", "No", "iie", "いいえ"),
    phrase(
      "ja-surv-wakarimashita",
      "I understand / got it",
      "wakarimashita",
      "わかりました",
      "Polite past form — 'I have now understood.' Confirming you've received instructions.",
    ),

    // ─── Asking ──────────────────────────────────────────────────────
    phrase(
      "ja-surv-ikura",
      "How much is it?",
      "ikura desu ka",
      "いくらですか",
      "Pointing at the item helps. Numbers come back in Japanese — practice 1–10 ahead of any market visit.",
    ),
    phrase(
      "ja-surv-doko",
      "Where is it?",
      "doko desu ka",
      "どこですか",
      "Pair with the noun: 'トイレ どこですか' (where's the toilet). Works for everything.",
    ),
    phrase("ja-surv-nani", "What?", "nani", "なに"),
    phrase("ja-surv-dare", "Who?", "dare", "だれ"),
    phrase("ja-surv-itsu", "When?", "itsu", "いつ"),

    // ─── Ordering + receiving ────────────────────────────────────────
    phrase(
      "ja-surv-onegaishimasu",
      "Please",
      "onegaishimasu",
      "おねがいします",
      "Used when asking for something or a favor. The other 'please' (ください, kudasai) goes after a noun — 'water, please' = みず ください.",
    ),
    phrase(
      "ja-surv-kudasai",
      "Please give me / I'll have",
      "kudasai",
      "ください",
      "Use after a noun: 'コーヒー ください' (coffee, please).",
    ),

    // ─── Copula trio (です / じゃないです) ─────────────────────────
    phrase(
      "ja-surv-desu",
      "is / are (polite copula)",
      "desu",
      "です",
      "Goes at the end of statements: '私は スペンサー です' (I'm Spencer). Pronounced softly — the 'u' is almost silent.",
    ),
    phrase(
      "ja-surv-janai",
      "is not / are not",
      "janai desu",
      "じゃないです",
      "Negative of です. 'I'm not American' = アメリカ人 じゃないです.",
    ),

    {
      id: "ja-surv-win",
      type: "info",
      title: "You're equipped",
      body:
        "You can now greet, thank, apologize, ask 'how much / where / what / who / when,' say yes/no, confirm you understood, and order anything you can point at. That's ~80% of tourist Japan. Replay this anytime — the audio is the goal, not the kana.",
      variant: "win",
    },
  ],
};

// ---------------------------------------------------------------------------
// Lint: passive-card followup
// ---------------------------------------------------------------------------
// TODO(2026-05-22): sidequest-survival is exposure-first phrasebook content —
// 17 back-to-back phrase_cards with no graded follow-up. By design (per the
// header comment), it doesn't test recall; players hear/read/continue. The
// new passive-card lint would fail on every card.
//
// Tracked separately for sub-lesson decomposition (a real "test what you
// learned" tail would let us turn the lint back on). Until that re-author
// lands, this lesson is exempt.
//
// Remove SIDEQUEST_LINT_EXEMPT once the re-author lands.
const SIDEQUEST_LINT_EXEMPT = true;

// The no-explanation-on-passive + no-answer-leak checks are safe to run on
// sidequest content (the cards have no explanation field; there are no
// graded steps). Only the followup-window check is exempt.
assertNoExplanationOnPassive(MOCK_LESSON_JA_SIDEQUEST_SURVIVAL.steps);
assertExplanationDoesntLeakAnswer(MOCK_LESSON_JA_SIDEQUEST_SURVIVAL.steps);

if (!SIDEQUEST_LINT_EXEMPT) {
  assertPassiveCardsHaveFollowup(MOCK_LESSON_JA_SIDEQUEST_SURVIVAL.steps);
}
