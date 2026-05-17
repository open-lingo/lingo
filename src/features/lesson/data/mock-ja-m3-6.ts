import type { LessonContent, PhraseCardStep } from "../types";

/**
 * M3-6 — Numbers 1-10 + counter intro.
 *
 * Numbers 1-10 in pure-kana form (kanji 一二三 etc. ship later, with
 * furigana). Two pronunciations exist for 4/7/9 — we teach the more
 * common N5 versions (よん / なな / きゅう) and call out the alternates
 * (し / しち / く) in the culture note.
 *
 * Counters get a single-card warm intro: 人 (nin / r for people) and 個
 * (ko, generic small objects). The full counter system is deferred to
 * M11+ — this is an exposure-only nod so the learner isn't blindsided
 * when they encounter ひとつ / ふたつ etc. in the wild.
 */

function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

export const MOCK_LESSON_JA_M3_6: LessonContent = {
  id: "ja-m3-6",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "Numbers 1–10 + counting",
  description:
    "Ten numbers plus a first glimpse at the Japanese counter system.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    {
      id: "ja-m3-6-info-open",
      type: "info",
      title: "Numbers — yes, there are two of each",
      body:
        "Japanese has two number systems: the Sino-Japanese (いち, に, さん…) used for math, money, time, and counting most things; and a Native one (ひとつ, ふたつ…) used to count generic objects. We teach the Sino set first — it's what you'll hear at the register, on train platforms, and in addresses.",
      variant: "default",
    },

    vocab("ja-m3-6-1", "1 (one)", "ichi", "いち"),
    vocab("ja-m3-6-2", "2 (two)", "ni", "に"),
    vocab("ja-m3-6-3", "3 (three)", "san", "さん"),
    vocab(
      "ja-m3-6-4",
      "4 (four)",
      "yon",
      "よん",
      "Also pronounced 'shi' — but 'shi' also means 'death,' so most modern speakers prefer 'yon' for clarity and superstition both.",
    ),
    vocab("ja-m3-6-5", "5 (five)", "go", "ご"),
    vocab("ja-m3-6-6", "6 (six)", "roku", "ろく"),
    vocab(
      "ja-m3-6-7",
      "7 (seven)",
      "nana",
      "なな",
      "Also pronounced 'shichi.' 'Nana' is preferred when the alternate could be mistaken for いち.",
    ),
    vocab("ja-m3-6-8", "8 (eight)", "hachi", "はち"),
    vocab(
      "ja-m3-6-9",
      "9 (nine)",
      "kyuu",
      "きゅう",
      "Also 'ku' — but 'ku' overlaps with the word for 'pain/suffering,' so 'kyuu' wins in most contexts.",
    ),
    vocab("ja-m3-6-10", "10 (ten)", "juu", "じゅう"),

    {
      id: "ja-m3-6-info-counters",
      type: "info",
      title: "Counters — a teaser",
      body:
        "Japanese doesn't say 'three cats' — it says 'cats, three [animal-counter].' Each category of thing has its own counter: 人 (nin/r) for people, 個 (ko) for small objects, 本 (hon) for long thin things, 匹 (hiki) for small animals, 台 (dai) for machines. We'll dig into the full system in a later module — for now, recognize that the number alone isn't always enough.",
      variant: "grammar",
    },

    vocab(
      "ja-m3-6-hitori",
      "1 person",
      "hitori",
      "ひとり",
      "1 and 2 people use the native readings (ひとり, ふたり). From 3 onward it's regular: さんにん, よにん…",
    ),
    vocab("ja-m3-6-futari", "2 people", "futari", "ふたり"),
    vocab(
      "ja-m3-6-sannin",
      "3 people",
      "san nin",
      "さんにん",
      "At a restaurant entrance the staff will ask 'なんめいさまですか' (how many) — answer with the people-counter: 'さんにんです.'",
    ),
    vocab("ja-m3-6-ikko", "1 (small object)", "ikko", "いっこ"),
    vocab(
      "ja-m3-6-niko",
      "2 (small objects)",
      "niko",
      "にこ",
      "At a 7-Eleven counter, pointing at an onigiri: 'これを にこ ください' = 'two of these, please.'",
    ),

    {
      id: "ja-m3-6-info-end",
      type: "info",
      title: "Numbers unlocked",
      body:
        "You can read prices, count people for a table, and order multiples at a counter. The counter system extends far beyond 人 and 個 — that's a future module. For now, 'これを X ください' (X of these please) gets you through 90% of food orders.",
      variant: "win",
    },
  ],
};
