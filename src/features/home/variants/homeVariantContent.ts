/**
 * Static, non-backend copy for the throwaway Home wireframe variants:
 * language tips ("Did you know?") and the Word-of-the-Day rotation.
 *
 * This is real teaching content, just not served from an API — the variants
 * are disposable comparison mockups (see App.tsx `home-:variant` route). Once
 * a design is picked, the winner gets wired to a proper source + i18n keys.
 */
import type { Flashcard } from "@/features/flashcards/data/types";
import type { Quest } from "@/features/quests/types";

export type LanguageTip = {
  title: string;
  body: string;
  example?: string;
};

const TIPS: Record<string, LanguageTip[]> = {
  ko: [
    {
      title: "Topic vs. subject",
      body: "은/는 marks the topic of the sentence — what you're talking about — not always the grammatical subject.",
      example: "저는 학생이에요. — As for me, I'm a student.",
    },
    {
      title: "Two ways to count",
      body: "Korean uses native numbers (하나, 둘, 셋) for small counts and age, but Sino-Korean (일, 이, 삼) for dates, money, and phone numbers.",
    },
    {
      title: "Hangul was designed",
      body: "Unlike most scripts, Hangul was deliberately invented in 1443 under King Sejong so any commoner could learn to read in a day.",
    },
    {
      title: "Politeness is built in",
      body: "The -요 ending softens almost any sentence into polite speech. Drop it with close friends; keep it with strangers.",
      example: "안녕하세요 → 안녕 (casual)",
    },
    {
      title: "Batchim changes sound",
      body: "A final consonant (batchim) can shift how a syllable sounds. 밥 ends in a soft, unreleased 'p'.",
    },
  ],
  ja: [
    {
      title: "Three scripts, one language",
      body: "Japanese mixes hiragana, katakana, and kanji in a single sentence — each does a different job.",
    },
    {
      title: "Particles do the heavy lifting",
      body: "は marks the topic, が the subject, を the object. Word order is flexible because particles carry the meaning.",
      example: "私はコーヒーを飲みます。",
    },
    {
      title: "Pitch, not stress",
      body: "Japanese distinguishes words by pitch accent rather than the stress English uses. 箸 and 橋 differ only in pitch.",
    },
  ],
  es: [
    {
      title: "Nouns have gender",
      body: "Every Spanish noun is masculine or feminine, and articles and adjectives agree with it.",
      example: "el libro rojo · la casa roja",
    },
    {
      title: "Upside-down punctuation",
      body: "Questions and exclamations open with ¿ or ¡ so you know the tone before you start reading.",
    },
  ],
};

const GENERIC_TIP: LanguageTip = {
  title: "Small and steady wins",
  body: "A few minutes of review every day beats a long cram session once a week — spaced repetition is on your side.",
};

/** Short "+50 XP · 20 gems" reward summary for a quest. */
export function questRewardText(q: Quest): string {
  const parts: string[] = [];
  if (q.rewards.xp) parts.push(`+${q.rewards.xp} XP`);
  if (q.rewards.lingots) parts.push(`${q.rewards.lingots} gems`);
  if (q.rewards.adFreeMinutes) parts.push(`${q.rewards.adFreeMinutes}m ad-free`);
  if (q.rewards.streakShield) parts.push("streak shield");
  return parts.join(" · ");
}

/** Deterministic day index so the tip / word rotates once per day. */
export function dayIndex(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Today's rotating tip for a language (falls back to a generic study tip). */
export function tipOfDay(langId: string): LanguageTip {
  const list = TIPS[langId];
  if (!list || list.length === 0) return GENERIC_TIP;
  return list[dayIndex() % list.length];
}

export type WordOfDay = {
  front: string;
  back: string;
  image?: string;
  reading?: { surface: string; kana: string };
};

/**
 * Pick a "word of the day" from the learner's unlocked course vocabulary so
 * it's a word they've actually met. Rotates daily; null when no word cards.
 */
export function pickWordOfDay(cards: Flashcard[]): WordOfDay | null {
  const words = cards.filter(
    (c) => c.type === "word" && c.unlocked !== false && c.front && c.back,
  );
  if (words.length === 0) return null;
  const w = words[dayIndex() % words.length];
  return { front: w.front, back: w.back, image: w.image, reading: w.reading };
}
