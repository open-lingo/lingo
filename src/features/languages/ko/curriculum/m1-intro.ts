import type { LessonContent } from "@/features/lesson/types";

/**
 * Hangul concept intro — the first thing a Korean learner sees.
 *
 * No vocab. No alphabet drill yet. Just the load-bearing mental model:
 *   - Hangul was designed (not evolved) — King Sejong, 1443
 *   - Consonant shapes mimic the mouth/tongue producing the sound
 *   - Letters STACK into syllable blocks (CV or CVC) — one block ≈ one syllable
 *   - Read left-to-right, top-to-bottom within a block
 *   - Once you can read blocks, you can read every Korean word
 *
 * The user's directive: concepts FIRST, before "wasting their time with
 * words". So this lesson is pure info cards — narrative + diagram-style
 * exposition. Vowel + consonant drills start the next lesson.
 *
 * Structure (one info card per concept, ~5 min total):
 *   1. Welcome / why Hangul is special
 *   2. The block (one syllable = one block)
 *   3. Reading order inside a block
 *   4. The two ingredients (consonants + vowels)
 *   5. The silent ㅇ trick — how a vowel stands alone as a block
 *   6. A worked example: 한글 = 한 + 글
 *   7. What's next
 */

export const MOCK_LESSON_KO_M1_INTRO: LessonContent = {
  id: "ko-m1-intro",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ko",
  title: "How Hangul works",
  description:
    "Before any vocabulary: the shape of the Korean writing system. ~5 minutes.",
  estimatedMinutes: 5,
  xpReward: 8,
  steps: [
    {
      id: "ko-intro-1-welcome",
      type: "info",
      title: "Welcome to Korean",
      body:
        "Hangul (한글) is the Korean alphabet. Unlike most writing systems, it didn't evolve from older scripts — it was designed from scratch in 1443 by King Sejong the Great so that ordinary people could learn to read in a single morning. You're about to find out he wasn't bluffing.",
      variant: "culture",
    },
    {
      id: "ko-intro-2-blocks",
      type: "info",
      title: "Letters stack into blocks",
      body:
        "Korean letters don't sit in a flat line like English. They stack into square 'syllable blocks' — one block per syllable. The word 한글 (hangeul) is two blocks: 한 (han) + 글 (geul). Each block packs 2 to 4 letters into roughly the same square space, which is why Korean text looks neat and even.",
      variant: "default",
    },
    {
      id: "ko-intro-3-read-order",
      type: "info",
      title: "Reading order inside a block",
      body:
        "Inside a block, read: consonant → vowel → bottom consonant (if any). Where the vowel SITS depends on its shape. Tall vowels (ㅏ ㅓ ㅣ) stand to the RIGHT: 한 is ㅎ (left) → ㅏ (right) → ㄴ (bottom). Flat vowels (ㅗ ㅜ ㅡ) lie UNDERNEATH: 글 stacks ㄱ → ㅡ → ㄹ top-to-bottom. Different layouts, same reading order every time.",
      variant: "tip",
    },
    {
      id: "ko-intro-4-ingredients",
      type: "info",
      title: "Two ingredients: consonants + vowels",
      body:
        "Every block is built from consonants (자음) and vowels (모음). There are 14 basic consonants and 10 basic vowels — that's it. Every Korean syllable in existence is some combination of these 24 pieces. You'll meet the 6 most common vowels first, then the consonants, one row at a time.",
      variant: "default",
    },
    {
      id: "ko-intro-5-silent-ieung",
      type: "info",
      title: "The silent ㅇ trick",
      body:
        "Korean rule: every block needs a consonant on the left. So what about a syllable that starts with a vowel sound? Hangul uses ㅇ (ieung) as a silent placeholder. ㅇ + ㅏ = 아 (a). The ㅇ is invisible to the ear — it just holds the spot so the block is legal. (At the bottom of a block, ㅇ does make a sound: 'ng'. More on that later.)",
      variant: "grammar",
    },
    {
      id: "ko-intro-6-example",
      type: "info",
      title: "Worked example: 한국 (Korea)",
      body:
        "한 = ㅎ (h) + ㅏ (a) + ㄴ (n) → 'han'.\n국 = ㄱ (g/k) + ㅜ (u) + ㄱ (k) → 'guk'.\nTogether: han-guk = 'Korea'. You can't read this yet — but in 30 minutes you will. That's the promise of Hangul: every block decomposes the same way, every time.",
      variant: "culture",
    },
    {
      id: "ko-intro-7-next",
      type: "info",
      title: "Up next: the 6 basic vowels",
      body:
        "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ — half the alphabet right there. We'll pair each with the silent ㅇ so you can read your first standalone blocks: 아 어 오 우 으 이. By the end of the next lesson you'll read your first real word: 아이 (child).",
      variant: "win",
    },
  ],
};
