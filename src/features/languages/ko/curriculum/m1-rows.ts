/**
 * Korean consonant-row curriculum — declarative source of truth.
 *
 * Pairs with `_hangulRowHelpers.ts` (step factories) and is consumed by
 * `mockLessons.ts` to register one `LessonContent` per sub-lesson plus
 * the Korean branch of `getMockCourse()` to wire the pathway.
 *
 * Each `KoRow` declares:
 *   - one consonant jamo (ㄱ, ㄴ, ...)
 *   - the 6 syllable blocks formed with the basic vowels (ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ)
 *   - 3 anchor words built from THIS row + previously-introduced rows
 *
 * The builder emits 3 sub-lessons per row in the JA pattern:
 *   1/3 — meet first 2 syllables + 1 anchor word
 *   2/3 — meet next 2 syllables + 1 anchor word
 *   3/3 — meet last 2 syllables + 1 anchor word + sweep + speaking
 *
 * Row order is chosen so each row's anchors only require syllables from
 * itself or earlier rows. Verified at module-load time in
 * `buildAllKoreanRowLessons` — if a row's anchor uses an unintroduced
 * block, the builder throws.
 *
 * Currently M1 only (10 plain consonants minus ㅇ, which is taught
 * implicitly via the vowel-block lessons + revisited as a final at a
 * later module). M2 (aspirated + tense + compound vowels) will extend
 * this file with additional `KoRow` entries.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import {
  type KoRowContext,
  type SyllableEntry,
  type RowWord,
  symbolIntro,
  traceTwice,
  recognition,
  symbolToSound,
  wordImageMcq,
  listeningBuild,
  listeningComp,
  speaking,
} from "./_hangulRowHelpers";

export type KoRow = {
  /** Stable row id, used in lesson ids (`ko-m1-${id}-${1|2|3}`). */
  id: string;
  /** The consonant jamo on its own (ㄱ). */
  jamo: string;
  /** Display title — used as the row title in the pathway. */
  title: string;
  /** One-line summary shown in the row description. */
  summary: string;
  /** Consonant name in Korean (기역). */
  consonantName: string;
  /** Pronunciation hint for the bare consonant. */
  consonantHint: string;
  /** Optional contrast note (e.g. "sounds like 'g' at start, 'k' between vowels"). */
  consonantNote?: string;
  /** The 6 syllables (consonant × ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ). Order is canonical. */
  blocks: [SyllableEntry, SyllableEntry, SyllableEntry, SyllableEntry, SyllableEntry, SyllableEntry];
  /** 3 anchor words. Each must use only blocks introduced in this row + earlier rows. */
  words: [RowWord, RowWord, RowWord];
  /** Block pool from prior rows (vowel blocks + earlier consonant rows).
   *  Used as decoy tiles in listening_build. Populated by the builder. */
  priorBlocks: string[];
};

/** Vowel blocks (taught in mock-ko-m1-vowels.ts). Always available. */
const VOWEL_BLOCKS = ["아", "어", "오", "우", "으", "이"];

/* ────────────────────────────────────────────────────────────────────────
 * Row definitions — order matters (each row sees the prior rows' blocks).
 * ──────────────────────────────────────────────────────────────────────── */

const ROW_G: KoRow = {
  id: "g",
  jamo: "ㄱ",
  title: "ㄱ-row",
  summary: "Your first consonant. Six new blocks: 가 거 고 구 그 기.",
  consonantName: "기역 (giyeok)",
  consonantHint: "like 'g' in 'go' or 'k' in 'skill'",
  consonantNote:
    "Sounds like 'g' between vowels; closer to 'k' at the start of a word.",
  blocks: [
    { block: "가", romaji: "ga", hint: "ㄱ + ㅏ" },
    { block: "거", romaji: "geo", hint: "ㄱ + ㅓ — 'guh'" },
    { block: "고", romaji: "go", hint: "ㄱ + ㅗ" },
    { block: "구", romaji: "gu", hint: "ㄱ + ㅜ — 'goo'" },
    { block: "그", romaji: "geu", hint: "ㄱ + ㅡ — 'guh' (tight lips)" },
    { block: "기", romaji: "gi", hint: "ㄱ + ㅣ — 'gee'" },
  ],
  words: [
    { word: "고기", meaningEn: "meat",  emoji: "🥩" },
    { word: "아기", meaningEn: "baby",  emoji: "👶" },
    { word: "거기", meaningEn: "there", emoji: "📍" },
  ],
  priorBlocks: [],
};

const ROW_N: KoRow = {
  id: "n",
  jamo: "ㄴ",
  title: "ㄴ-row",
  summary: "Six new blocks: 나 너 노 누 느 니.",
  consonantName: "니은 (nieun)",
  consonantHint: "like 'n' in 'no'",
  blocks: [
    { block: "나", romaji: "na", hint: "ㄴ + ㅏ" },
    { block: "너", romaji: "neo", hint: "ㄴ + ㅓ — 'nuh'" },
    { block: "노", romaji: "no", hint: "ㄴ + ㅗ" },
    { block: "누", romaji: "nu", hint: "ㄴ + ㅜ" },
    { block: "느", romaji: "neu", hint: "ㄴ + ㅡ" },
    { block: "니", romaji: "ni", hint: "ㄴ + ㅣ" },
  ],
  words: [
    { word: "나",   meaningEn: "I / me (casual)", emoji: "🙋" },
    { word: "너",   meaningEn: "you (casual)",    emoji: "👉" },
    { word: "누구", meaningEn: "who",             emoji: "❓" },
  ],
  priorBlocks: [],
};

const ROW_M: KoRow = {
  id: "m",
  jamo: "ㅁ",
  title: "ㅁ-row",
  summary: "Six new blocks: 마 머 모 무 므 미.",
  consonantName: "미음 (mieum)",
  consonantHint: "like 'm' in 'mom'",
  blocks: [
    { block: "마", romaji: "ma", hint: "ㅁ + ㅏ" },
    { block: "머", romaji: "meo", hint: "ㅁ + ㅓ — 'muh'" },
    { block: "모", romaji: "mo", hint: "ㅁ + ㅗ" },
    { block: "무", romaji: "mu", hint: "ㅁ + ㅜ" },
    { block: "므", romaji: "meu", hint: "ㅁ + ㅡ" },
    { block: "미", romaji: "mi", hint: "ㅁ + ㅣ" },
  ],
  words: [
    { word: "어머니", meaningEn: "mother",     emoji: "👩" },
    { word: "나무",   meaningEn: "tree",       emoji: "🌳" },
    // 무 replaced 미 (2026-08-26): 미 is a bound Sino root, not a standalone
    // word for "beauty" — 무 is a real everyday noun and has TTS audio.
    { word: "무",     meaningEn: "radish (daikon)", emoji: "🥬" },
  ],
  priorBlocks: [],
};

const ROW_D: KoRow = {
  id: "d",
  jamo: "ㄷ",
  title: "ㄷ-row",
  summary: "Six new blocks: 다 더 도 두 드 디.",
  consonantName: "디귿 (digeut)",
  consonantHint: "like 'd' in 'dog' or 't' between vowels",
  consonantNote:
    "Same g/k pattern: 'd' at the start, 't'-ish between vowels.",
  blocks: [
    { block: "다", romaji: "da", hint: "ㄷ + ㅏ" },
    { block: "더", romaji: "deo", hint: "ㄷ + ㅓ — 'duh'" },
    { block: "도", romaji: "do", hint: "ㄷ + ㅗ" },
    { block: "두", romaji: "du", hint: "ㄷ + ㅜ — 'doo'" },
    { block: "드", romaji: "deu", hint: "ㄷ + ㅡ" },
    { block: "디", romaji: "di", hint: "ㄷ + ㅣ — 'dee'" },
  ],
  words: [
    { word: "구두", meaningEn: "shoes (dress shoes)", emoji: "👞" },
    { word: "도",   meaningEn: "also / too",          emoji: "➕" },
    { word: "모두", meaningEn: "all / everyone",      emoji: "👥" },
  ],
  priorBlocks: [],
};

const ROW_R: KoRow = {
  id: "r",
  jamo: "ㄹ",
  title: "ㄹ-row",
  summary: "Six new blocks: 라 러 로 루 르 리.",
  consonantName: "리을 (rieul)",
  consonantHint: "between 'r' and 'l' — a quick tongue flap",
  consonantNote:
    "Like the Spanish single 'r' (pero), or the 'tt' in American 'butter'.",
  blocks: [
    { block: "라", romaji: "ra", hint: "ㄹ + ㅏ" },
    { block: "러", romaji: "reo", hint: "ㄹ + ㅓ" },
    { block: "로", romaji: "ro", hint: "ㄹ + ㅗ" },
    { block: "루", romaji: "ru", hint: "ㄹ + ㅜ" },
    { block: "르", romaji: "reu", hint: "ㄹ + ㅡ" },
    { block: "리", romaji: "ri", hint: "ㄹ + ㅣ" },
  ],
  words: [
    { word: "다리", meaningEn: "leg / bridge", emoji: "🦵" },
    { word: "머리", meaningEn: "head / hair",  emoji: "🧑" },
    { word: "우리", meaningEn: "we / us",      emoji: "🤝" },
  ],
  priorBlocks: [],
};

const ROW_B: KoRow = {
  id: "b",
  jamo: "ㅂ",
  title: "ㅂ-row",
  summary: "Six new blocks: 바 버 보 부 브 비.",
  consonantName: "비읍 (bieup)",
  consonantHint: "like 'b' in 'boy' or 'p' between vowels",
  blocks: [
    { block: "바", romaji: "ba", hint: "ㅂ + ㅏ" },
    { block: "버", romaji: "beo", hint: "ㅂ + ㅓ" },
    { block: "보", romaji: "bo", hint: "ㅂ + ㅗ" },
    { block: "부", romaji: "bu", hint: "ㅂ + ㅜ" },
    { block: "브", romaji: "beu", hint: "ㅂ + ㅡ" },
    { block: "비", romaji: "bi", hint: "ㅂ + ㅣ" },
  ],
  words: [
    { word: "바다", meaningEn: "sea",   emoji: "🌊" },
    { word: "비",   meaningEn: "rain",  emoji: "🌧️" },
    { word: "바보", meaningEn: "fool",  emoji: "🤪" },
  ],
  priorBlocks: [],
};

const ROW_S: KoRow = {
  id: "s",
  jamo: "ㅅ",
  title: "ㅅ-row",
  summary: "Six new blocks: 사 서 소 수 스 시.",
  consonantName: "시옷 (siot)",
  consonantHint: "like 's' in 'see' (or 'sh' before ㅣ)",
  consonantNote:
    "Before ㅣ it softens to 'sh' — 시 sounds like 'shee', not 'see'.",
  blocks: [
    { block: "사", romaji: "sa", hint: "ㅅ + ㅏ" },
    { block: "서", romaji: "seo", hint: "ㅅ + ㅓ" },
    { block: "소", romaji: "so", hint: "ㅅ + ㅗ" },
    { block: "수", romaji: "su", hint: "ㅅ + ㅜ" },
    { block: "스", romaji: "seu", hint: "ㅅ + ㅡ" },
    { block: "시", romaji: "shi", hint: "ㅅ + ㅣ — 'shee'" },
  ],
  words: [
    { word: "사",   meaningEn: "four (4)", emoji: "4️⃣" },
    { word: "소",   meaningEn: "cow",      emoji: "🐄" },
    { word: "사이", meaningEn: "between",  emoji: "↔️" },
  ],
  priorBlocks: [],
};

const ROW_J: KoRow = {
  id: "j",
  jamo: "ㅈ",
  title: "ㅈ-row",
  summary: "Six new blocks: 자 저 조 주 즈 지.",
  consonantName: "지읒 (jieut)",
  consonantHint: "like 'j' in 'jog' (softer than English 'j')",
  blocks: [
    { block: "자", romaji: "ja", hint: "ㅈ + ㅏ" },
    { block: "저", romaji: "jeo", hint: "ㅈ + ㅓ — 'juh'" },
    { block: "조", romaji: "jo", hint: "ㅈ + ㅗ" },
    { block: "주", romaji: "ju", hint: "ㅈ + ㅜ" },
    { block: "즈", romaji: "jeu", hint: "ㅈ + ㅡ" },
    { block: "지", romaji: "ji", hint: "ㅈ + ㅣ" },
  ],
  words: [
    { word: "자",   meaningEn: "sleep! (imperative)", emoji: "💤" },
    { word: "모자", meaningEn: "hat",                 emoji: "🧢" },
    { word: "지도", meaningEn: "map",                 emoji: "🗺️" },
  ],
  priorBlocks: [],
};

const ROW_H: KoRow = {
  id: "h",
  jamo: "ㅎ",
  title: "ㅎ-row",
  summary: "Six new blocks: 하 허 호 후 흐 히.",
  consonantName: "히읗 (hieut)",
  consonantHint: "like 'h' in 'hat'",
  blocks: [
    { block: "하", romaji: "ha", hint: "ㅎ + ㅏ" },
    { block: "허", romaji: "heo", hint: "ㅎ + ㅓ" },
    { block: "호", romaji: "ho", hint: "ㅎ + ㅗ" },
    { block: "후", romaji: "hu", hint: "ㅎ + ㅜ" },
    { block: "흐", romaji: "heu", hint: "ㅎ + ㅡ" },
    { block: "히", romaji: "hi", hint: "ㅎ + ㅣ" },
  ],
  words: [
    { word: "하나", meaningEn: "one (1)",    emoji: "1️⃣" },
    { word: "하루", meaningEn: "one day",    emoji: "📅" },
    { word: "호두", meaningEn: "walnut",     emoji: "🌰" },
  ],
  priorBlocks: [],
};

/** Canonical row order — determines what blocks count as "prior" for each row. */
export const KO_M1_ROWS: KoRow[] = [
  ROW_G, ROW_N, ROW_M, ROW_D, ROW_R, ROW_B, ROW_S, ROW_J, ROW_H,
];

/** Populate each row's `priorBlocks` from vowels + earlier rows. */
function populatePriorBlocks(rows: KoRow[]): KoRow[] {
  const acc: string[] = [...VOWEL_BLOCKS];
  for (const row of rows) {
    row.priorBlocks = [...acc];
    acc.push(...row.blocks.map((b) => b.block));
  }
  return rows;
}
populatePriorBlocks(KO_M1_ROWS);

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson builder — turns one KoRow into 3 LessonContent objects.
 * ──────────────────────────────────────────────────────────────────────── */

function makeCtx(row: KoRow): KoRowContext {
  return {
    allBlocks: row.blocks,
    words: row.words,
    tileBankPool: row.priorBlocks,
  };
}

export function buildRowSubLessons(row: KoRow, moduleId: string = "m1"): LessonContent[] {
  const ctx = makeCtx(row);
  const [b1, b2, b3, b4, b5, b6] = row.blocks;
  const [w1, w2, w3] = row.words;

  const sub1: LessonContent = {
    id: `ko-${moduleId}-${row.id}-1`,
    moduleId,
    courseId: "mock-1",
    languageId: "ko",
    title: `${row.title} — Intro 1`,
    description: `Meet ${b1.block} and ${b2.block}. ${row.summary}`,
    estimatedMinutes: 4,
    xpReward: 10,
    introducesVocabIds: [`ko-${row.id}-${w1.word}`],
    steps: [
      {
        id: `ko-${row.id}1-info-0`,
        type: "info",
        title: `Meet ${row.jamo} — ${row.consonantName}`,
        body: `New consonant: ${row.jamo} — ${row.consonantHint}.${
          row.consonantNote ? "\n\n" + row.consonantNote : ""
        }\n\nPaired with the 6 vowels you know, this consonant makes 6 new syllable blocks. We'll meet two now.`,
        variant: "culture",
      },

      symbolIntro(`ko-${row.id}1-intro-${b1.romaji}`, b1.block, b1.romaji, b1.ipa ?? "", b1.hint ?? "", `${w1.word} (${w1.meaningEn})`),
      traceTwice(`ko-${row.id}1-trace-${b1.romaji}`, b1.block, b1.romaji, b1.hint ?? ""),
      recognition(ctx, `ko-${row.id}1-recog-${b1.romaji}`, b1.block, b1.romaji, b1.hint ?? ""),

      symbolIntro(`ko-${row.id}1-intro-${b2.romaji}`, b2.block, b2.romaji, b2.ipa ?? "", b2.hint ?? "", `${w1.word} (${w1.meaningEn})`),
      traceTwice(`ko-${row.id}1-trace-${b2.romaji}`, b2.block, b2.romaji, b2.hint ?? ""),
      recognition(ctx, `ko-${row.id}1-recog-${b2.romaji}`, b2.block, b2.romaji, b2.hint ?? ""),

      ...(w1.emoji ? [wordImageMcq(ctx, `ko-${row.id}1-mcq-${row.id}-w1`, w1.word)] : []),
      listeningBuild(ctx, `ko-${row.id}1-build-${row.id}-w1`, w1.word, w1.meaningEn),

      symbolToSound(ctx, `ko-${row.id}1-sts-${b1.romaji}`, b1.block, b1.romaji, b1.hint ?? ""),
      symbolToSound(ctx, `ko-${row.id}1-sts-${b2.romaji}`, b2.block, b2.romaji, b2.hint ?? ""),

      {
        id: `ko-${row.id}1-info-end`,
        type: "info",
        title: "Two down",
        body: `${b1.block} and ${b2.block} — and you've read your first ${row.jamo}-word: ${w1.word} (${w1.meaningEn}). Two more blocks next lesson.`,
        variant: "default",
      },
    ],
  };

  const sub2: LessonContent = {
    id: `ko-${moduleId}-${row.id}-2`,
    moduleId,
    courseId: "mock-1",
    languageId: "ko",
    title: `${row.title} — Intro 2`,
    description: `Add ${b3.block} and ${b4.block}. Build ${w2.word} (${w2.meaningEn}).`,
    estimatedMinutes: 4,
    xpReward: 10,
    introducesVocabIds: [`ko-${row.id}-${w2.word}`],
    steps: [
      {
        id: `ko-${row.id}2-info-0`,
        type: "info",
        title: `More ${row.jamo} blocks`,
        body: `${b3.block} (${b3.romaji}) and ${b4.block} (${b4.romaji}). Build ${w2.word} — ${w2.meaningEn}.`,
        variant: "default",
      },

      symbolIntro(`ko-${row.id}2-intro-${b3.romaji}`, b3.block, b3.romaji, b3.ipa ?? "", b3.hint ?? "", `${w2.word} (${w2.meaningEn})`),
      traceTwice(`ko-${row.id}2-trace-${b3.romaji}`, b3.block, b3.romaji, b3.hint ?? ""),
      recognition(ctx, `ko-${row.id}2-recog-${b3.romaji}`, b3.block, b3.romaji, b3.hint ?? ""),

      symbolIntro(`ko-${row.id}2-intro-${b4.romaji}`, b4.block, b4.romaji, b4.ipa ?? "", b4.hint ?? "", `${w2.word} (${w2.meaningEn})`),
      traceTwice(`ko-${row.id}2-trace-${b4.romaji}`, b4.block, b4.romaji, b4.hint ?? ""),
      recognition(ctx, `ko-${row.id}2-recog-${b4.romaji}`, b4.block, b4.romaji, b4.hint ?? ""),

      listeningBuild(ctx, `ko-${row.id}2-build-${row.id}-w2`, w2.word, w2.meaningEn),

      listeningComp(`ko-${row.id}2-lc-${row.id}-w1`, w1.word, w1.meaningEn, [w2.meaningEn, w3.meaningEn, "child"]),
      listeningComp(`ko-${row.id}2-lc-${row.id}-w2`, w2.word, w2.meaningEn, [w1.meaningEn, w3.meaningEn, "cucumber"]),

      symbolToSound(ctx, `ko-${row.id}2-sts-${b3.romaji}`, b3.block, b3.romaji, b3.hint ?? ""),
      symbolToSound(ctx, `ko-${row.id}2-sts-${b4.romaji}`, b4.block, b4.romaji, b4.hint ?? ""),

      {
        id: `ko-${row.id}2-info-end`,
        type: "info",
        title: "Four down",
        body: `Two more ${row.jamo} blocks left: ${b5.block} and ${b6.block}. After that, a row sweep + speaking practice.`,
        variant: "default",
      },
    ],
  };

  const sub3Steps: LessonStep[] = [
    {
      id: `ko-${row.id}3-info-0`,
      type: "info",
      title: `${row.jamo} — finale`,
      body: `Last two: ${b5.block} and ${b6.block}. Build ${w3.word}, sweep the row, and speak.`,
      variant: "default",
    },

    symbolIntro(`ko-${row.id}3-intro-${b5.romaji}`, b5.block, b5.romaji, b5.ipa ?? "", b5.hint ?? "", `${w3.word} (${w3.meaningEn})`),
    traceTwice(`ko-${row.id}3-trace-${b5.romaji}`, b5.block, b5.romaji, b5.hint ?? ""),
    recognition(ctx, `ko-${row.id}3-recog-${b5.romaji}`, b5.block, b5.romaji, b5.hint ?? ""),

    symbolIntro(`ko-${row.id}3-intro-${b6.romaji}`, b6.block, b6.romaji, b6.ipa ?? "", b6.hint ?? "", `${w3.word} (${w3.meaningEn})`),
    traceTwice(`ko-${row.id}3-trace-${b6.romaji}`, b6.block, b6.romaji, b6.hint ?? ""),
    recognition(ctx, `ko-${row.id}3-recog-${b6.romaji}`, b6.block, b6.romaji, b6.hint ?? ""),

    listeningBuild(ctx, `ko-${row.id}3-build-${row.id}-w3`, w3.word, w3.meaningEn),

    // Row sweep — one extra recognition pass on the middle block.
    recognition(ctx, `ko-${row.id}3-rev-${b3.romaji}`, b3.block, b3.romaji, b3.hint ?? ""),

    listeningComp(`ko-${row.id}3-lc-${row.id}-w3`, w3.word, w3.meaningEn, [w1.meaningEn, w2.meaningEn, "child"]),

    speaking(`ko-${row.id}3-speak-${row.id}-w1`, w1.word, w1.meaningEn),
    speaking(`ko-${row.id}3-speak-${row.id}-w3`, w3.word, w3.meaningEn),

    symbolToSound(ctx, `ko-${row.id}3-sts-${b5.romaji}`, b5.block, b5.romaji, b5.hint ?? ""),
    symbolToSound(ctx, `ko-${row.id}3-sts-${b6.romaji}`, b6.block, b6.romaji, b6.hint ?? ""),

    {
      id: `ko-${row.id}3-info-end`,
      type: "info",
      title: "Row complete",
      body: `All six ${row.jamo} blocks: ${row.blocks.map((b) => b.block).join(" ")}. Plus 3 real words: ${row.words.map((w) => w.word).join(", ")}. On to the next consonant.`,
      variant: "win",
    },
  ];

  if (w2.emoji) {
    sub3Steps.splice(8, 0, wordImageMcq(ctx, `ko-${row.id}3-mcq-${row.id}-w2`, w2.word));
  }
  if (w3.emoji) {
    sub3Steps.splice(8, 0, wordImageMcq(ctx, `ko-${row.id}3-mcq-${row.id}-w3`, w3.word));
  }

  const sub3: LessonContent = {
    id: `ko-${moduleId}-${row.id}-3`,
    moduleId,
    courseId: "mock-1",
    languageId: "ko",
    title: `${row.title} — Review`,
    description: `Last two blocks (${b5.block}, ${b6.block}), build ${w3.word}, sweep + speak.`,
    estimatedMinutes: 5,
    xpReward: 12,
    introducesVocabIds: [`ko-${row.id}-${w3.word}`],
    steps: sub3Steps,
  };

  return [sub1, sub2, sub3];
}

/** Verify every word's blocks come from row + prior rows. Throws on the
 *  first violation. Runs at module load to catch authoring errors early. */
export function validateRowVocab(row: KoRow): void {
  const known = new Set([...row.priorBlocks, ...row.blocks.map((b) => b.block)]);
  for (const w of row.words) {
    for (const block of Array.from(w.word)) {
      if (!known.has(block)) {
        throw new Error(
          `Korean curriculum: row ${row.id} word "${w.word}" uses unintroduced block "${block}". ` +
          `Move the word to a later row, or change its blocks.`,
        );
      }
    }
  }
}

export function buildAllKoreanRowLessons(): LessonContent[] {
  const out: LessonContent[] = [];
  for (const row of KO_M1_ROWS) {
    validateRowVocab(row);
    out.push(...buildRowSubLessons(row));
  }
  return out;
}
