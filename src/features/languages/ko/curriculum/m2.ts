/**
 * Korean M2 — aspirated consonants + tense consonants + y-vowels.
 *
 * M1 taught the 6 basic vowels and 9 plain consonants (excluding ㅇ as
 * a leading silent placeholder, which the M1 vowel lesson handled).
 * M2 finishes the "every Korean syllable you'll meet" reading foundation
 * by adding:
 *
 *   - Aspirated consonants: ㅋ ㅌ ㅍ ㅊ — produced with a puff of air
 *     (the contrast that English speakers tend to over-correct toward
 *     by default — `kha`-style aspiration on every English `k`).
 *   - Tense consonants: ㄲ ㄸ ㅃ ㅆ ㅉ — produced with no air, tight
 *     throat. Doubled-jamo visual.
 *   - Y-vowels: ㅑ ㅕ ㅛ ㅠ — each adds a [j] glide to the corresponding
 *     basic vowel. Combine with the consonants you already know.
 *
 * Per the brief: "Aspirated consonants row (ㅋ/ㅌ/ㅍ/ㅊ) — lessons
 * mirroring M1's pattern". We reuse the M1 row factory
 * (`buildRowSubLessons`) for the four aspirated consonants and the five
 * tense consonants — they each pair with the 6 basic vowels the learner
 * knows, identical authoring shape to M1's row pattern.
 *
 * Note: ㅎ — flagged in the brief as part of the aspirated set — was
 * already taught in M1 as the ㅎ-row. Korean linguists sometimes group
 * ㅎ with aspirates phonologically; pedagogically we taught it with the
 * plain consonants because it's the most common voiceless onset and
 * carries familiar words (하나, 호두). Not re-taught here.
 *
 * Compound vowels (ㅐ/ㅔ/ㅘ/ㅝ/ㅢ/ㅟ/ㅙ/ㅞ) and final-consonant 받침
 * are intentionally deferred to a future M2-extension pass — out of
 * scope for this dispatch. The pathway in `mockCourse.ts` is updated
 * to reflect what M2 actually contains now.
 *
 * CONTENT-TODO: verify with a Korean speaker that:
 *   - 코 (nose) reads naturally as the ㅋ-row's first anchor (it does
 *     in standard Seoul Korean).
 *   - The aspirated-vs-plain contrast is callable out via the existing
 *     `consonantNote` field (currently the note mostly says "puff of air").
 *   - The tense-row anchors don't collide pedagogically (오빠 needs the
 *     leading ㅇ + ㅗ which is fine since M1 covered both).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import {
  buildRowSubLessons,
  validateRowVocab,
  type KoRow,
  KO_M1_ROWS,
} from "./m1-rows";
import {
  type SyllableEntry,
  symbolIntro,
  traceTwice,
  recognition,
  wordImageMcq,
  listeningBuild,
  listeningComp,
  speaking,
  type KoRowContext,
} from "./_hangulRowHelpers";

const VOWEL_BLOCKS = ["아", "어", "오", "우", "으", "이"];

// ─── Row definitions (aspirated + tense) ────────────────────────────────

const ROW_KH: KoRow = {
  id: "kh",
  jamo: "ㅋ",
  title: "ㅋ-row",
  summary: "Aspirated 'k' — like ㄱ but with a puff of air. Six new blocks: 카 커 코 쿠 크 키.",
  consonantName: "키읔 (kieuk)",
  consonantHint: "like 'k' in 'kite' — strong puff of air",
  consonantNote:
    "Contrast with ㄱ: ㄱ is gentler (closer to English 'g' between vowels). Hold your hand in front of your mouth — ㅋ should blow out air, ㄱ shouldn't.",
  blocks: [
    { block: "카", romaji: "ka", hint: "ㅋ + ㅏ" },
    { block: "커", romaji: "keo", hint: "ㅋ + ㅓ" },
    { block: "코", romaji: "ko", hint: "ㅋ + ㅗ" },
    { block: "쿠", romaji: "ku", hint: "ㅋ + ㅜ" },
    { block: "크", romaji: "keu", hint: "ㅋ + ㅡ" },
    { block: "키", romaji: "ki", hint: "ㅋ + ㅣ" },
  ],
  words: [
    { word: "코", meaningEn: "nose", emoji: "👃" },
    { word: "키", meaningEn: "height", emoji: "📏" },
    // 커피 (coffee) needs 피 (ph row, taught later). Use 쿠키 — uses kh's
    // own 쿠 + 키. CONTENT-TODO: confirm 쿠키 (cookie, borrowing) reads
    // naturally as the anchor; an alternative would be 코끼리 but that
    // needs ㄲ.
    { word: "쿠키", meaningEn: "cookie", emoji: "🍪" },
  ],
  priorBlocks: [],
};

const ROW_TH: KoRow = {
  id: "th",
  jamo: "ㅌ",
  title: "ㅌ-row",
  summary: "Aspirated 't'. Six new blocks: 타 터 토 투 트 티.",
  consonantName: "티읕 (tieut)",
  consonantHint: "like 't' in 'top' — strong puff of air",
  consonantNote:
    "Contrast with ㄷ: ㄷ is softer (close to English 'd' between vowels). Same puff-of-air test as ㅋ vs ㄱ.",
  blocks: [
    { block: "타", romaji: "ta", hint: "ㅌ + ㅏ" },
    { block: "터", romaji: "teo", hint: "ㅌ + ㅓ" },
    { block: "토", romaji: "to", hint: "ㅌ + ㅗ" },
    { block: "투", romaji: "tu", hint: "ㅌ + ㅜ" },
    { block: "트", romaji: "teu", hint: "ㅌ + ㅡ" },
    { block: "티", romaji: "ti", hint: "ㅌ + ㅣ" },
  ],
  words: [
    { word: "타다", meaningEn: "to ride / board" },
    // 토끼 uses 끼 (tense ㄲ) — deferred to the tense lesson. Use 토마토.
    { word: "토마토", meaningEn: "tomato", emoji: "🍅" },
    // CONTENT-TODO: 트리 (tree) is a borrowing; check whether a native
    // word reads better here (나무 is M1 already).
    { word: "트리", meaningEn: "tree (Christmas)", emoji: "🎄" },
  ],
  priorBlocks: [],
};

const ROW_PH: KoRow = {
  id: "ph",
  jamo: "ㅍ",
  title: "ㅍ-row",
  summary: "Aspirated 'p'. Six new blocks: 파 퍼 포 푸 프 피.",
  consonantName: "피읖 (pieup)",
  consonantHint: "like 'p' in 'pie' — strong puff of air",
  consonantNote:
    "Contrast with ㅂ: ㅂ is softer (close to English 'b' between vowels). Same air test.",
  blocks: [
    { block: "파", romaji: "pa", hint: "ㅍ + ㅏ" },
    { block: "퍼", romaji: "peo", hint: "ㅍ + ㅓ" },
    { block: "포", romaji: "po", hint: "ㅍ + ㅗ" },
    { block: "푸", romaji: "pu", hint: "ㅍ + ㅜ" },
    { block: "프", romaji: "peu", hint: "ㅍ + ㅡ" },
    { block: "피", romaji: "pi", hint: "ㅍ + ㅣ" },
  ],
  words: [
    { word: "피", meaningEn: "blood", emoji: "🩸" },
    { word: "포도", meaningEn: "grape", emoji: "🍇" },
    { word: "파", meaningEn: "green onion", emoji: "🌱" },
  ],
  priorBlocks: [],
};

const ROW_CH: KoRow = {
  id: "ch",
  jamo: "ㅊ",
  title: "ㅊ-row",
  summary: "Aspirated 'ch'. Six new blocks: 차 처 초 추 츠 치.",
  consonantName: "치읓 (chieut)",
  consonantHint: "like 'ch' in 'chair' — strong puff of air",
  consonantNote:
    "Contrast with ㅈ: ㅈ is softer (closer to English 'j' in 'jog'). Same air test.",
  blocks: [
    { block: "차", romaji: "cha", hint: "ㅊ + ㅏ" },
    { block: "처", romaji: "cheo", hint: "ㅊ + ㅓ" },
    { block: "초", romaji: "cho", hint: "ㅊ + ㅗ" },
    { block: "추", romaji: "chu", hint: "ㅊ + ㅜ" },
    { block: "츠", romaji: "cheu", hint: "ㅊ + ㅡ" },
    { block: "치", romaji: "chi", hint: "ㅊ + ㅣ" },
  ],
  words: [
    { word: "차", meaningEn: "car / tea", emoji: "🚗" },
    { word: "치마", meaningEn: "skirt", emoji: "👗" },
    // 김치 uses 김 (final 받침) — deferred. Use 초 (candle) instead.
    { word: "초", meaningEn: "candle / second (time)", emoji: "🕯️" },
  ],
  priorBlocks: [],
};

// ─── Tense consonant rows ───────────────────────────────────────────────
//
// Tense consonants combine with vowels the same way plain/aspirated ones
// do. We treat each as its own "row" with the 6 vowel pairings.

const ROW_KK: KoRow = {
  id: "kk",
  jamo: "ㄲ",
  title: "ㄲ-row",
  summary: "Tense 'kk' — no air, tight throat. Six new blocks: 까 꺼 꼬 꾸 끄 끼.",
  consonantName: "쌍기역 (ssanggiyeok)",
  consonantHint: "like 'sk' in 'skill' — no air, tight",
  consonantNote:
    "Doubled jamo: ㄱ written twice. Tense consonants get NO puff of air (opposite of aspirates) AND a tighter throat than plain ㄱ.",
  blocks: [
    { block: "까", romaji: "kka", hint: "ㄲ + ㅏ" },
    { block: "꺼", romaji: "kkeo", hint: "ㄲ + ㅓ" },
    { block: "꼬", romaji: "kko", hint: "ㄲ + ㅗ" },
    { block: "꾸", romaji: "kku", hint: "ㄲ + ㅜ" },
    { block: "끄", romaji: "kkeu", hint: "ㄲ + ㅡ" },
    { block: "끼", romaji: "kki", hint: "ㄲ + ㅣ" },
  ],
  words: [
    { word: "꼬리", meaningEn: "tail", emoji: "🐈" },
    // 토끼 needs 토 from the ㅌ row — fine since aspirated rows come first.
    { word: "토끼", meaningEn: "rabbit", emoji: "🐰" },
    { word: "끼", meaningEn: "meal (a serving)", emoji: "🍚" },
  ],
  priorBlocks: [],
};

const ROW_TT: KoRow = {
  id: "tt",
  jamo: "ㄸ",
  title: "ㄸ-row",
  summary: "Tense 'tt'. Six new blocks: 따 떠 또 뚜 뜨 띠.",
  consonantName: "쌍디귿 (ssangdigeut)",
  consonantHint: "like 'st' in 'stop' — no air, tight",
  blocks: [
    { block: "따", romaji: "tta", hint: "ㄸ + ㅏ" },
    { block: "떠", romaji: "tteo", hint: "ㄸ + ㅓ" },
    { block: "또", romaji: "tto", hint: "ㄸ + ㅗ" },
    { block: "뚜", romaji: "ttu", hint: "ㄸ + ㅜ" },
    { block: "뜨", romaji: "tteu", hint: "ㄸ + ㅡ" },
    { block: "띠", romaji: "tti", hint: "ㄸ + ㅣ" },
  ],
  words: [
    { word: "또", meaningEn: "again / also" },
    // 뚜껑 (lid) needs 껑 (final ㅇ) — deferred. Use 따다 (to pick).
    { word: "따다", meaningEn: "to pick / pluck" },
    // CONTENT-TODO: 뜨다 (to float / rise) is a high-utility verb; check
    // if a more concrete anchor reads better here.
    { word: "뜨다", meaningEn: "to rise / float" },
  ],
  priorBlocks: [],
};

const ROW_PP: KoRow = {
  id: "pp",
  jamo: "ㅃ",
  title: "ㅃ-row",
  summary: "Tense 'pp'. Six new blocks: 빠 뻐 뽀 뿌 쁘 삐.",
  consonantName: "쌍비읍 (ssangbieup)",
  consonantHint: "like 'sp' in 'spy' — no air, tight",
  blocks: [
    { block: "빠", romaji: "ppa", hint: "ㅃ + ㅏ" },
    { block: "뻐", romaji: "ppeo", hint: "ㅃ + ㅓ" },
    { block: "뽀", romaji: "ppo", hint: "ㅃ + ㅗ" },
    { block: "뿌", romaji: "ppu", hint: "ㅃ + ㅜ" },
    { block: "쁘", romaji: "ppeu", hint: "ㅃ + ㅡ" },
    { block: "삐", romaji: "ppi", hint: "ㅃ + ㅣ" },
  ],
  words: [
    { word: "오빠", meaningEn: "older brother (♀ speaker)", emoji: "🧑" },
    { word: "아빠", meaningEn: "dad", emoji: "👨" },
    // CONTENT-TODO: 예쁘다 (pretty) needs ㅖ (compound vowel, deferred).
    // 뽀 is sparse — use 뽀뽀 (kiss, baby-talk).
    { word: "뽀뽀", meaningEn: "kiss (cute / informal)" },
  ],
  priorBlocks: [],
};

const ROW_SS: KoRow = {
  id: "ss",
  jamo: "ㅆ",
  title: "ㅆ-row",
  summary: "Tense 'ss'. Six new blocks: 싸 써 쏘 쑤 쓰 씨.",
  consonantName: "쌍시옷 (ssangsiot)",
  consonantHint: "like 'ss' in 'hiss' — tense, sharp",
  blocks: [
    { block: "싸", romaji: "ssa", hint: "ㅆ + ㅏ" },
    { block: "써", romaji: "sseo", hint: "ㅆ + ㅓ" },
    { block: "쏘", romaji: "sso", hint: "ㅆ + ㅗ" },
    { block: "쑤", romaji: "ssu", hint: "ㅆ + ㅜ" },
    { block: "쓰", romaji: "sseu", hint: "ㅆ + ㅡ" },
    { block: "씨", romaji: "ssi", hint: "ㅆ + ㅣ" },
  ],
  words: [
    // 싸요 needs 요 (y-vowel, taught after the consonant rows). Use 싸다
    // (to be cheap, dictionary form) — uses ㅏ (M1).
    { word: "싸다", meaningEn: "to be cheap" },
    { word: "씨", meaningEn: "Mr./Ms. (polite name suffix)" },
    { word: "쓰다", meaningEn: "to write / use" },
  ],
  priorBlocks: [],
};

const ROW_JJ: KoRow = {
  id: "jj",
  jamo: "ㅉ",
  title: "ㅉ-row",
  summary: "Tense 'jj'. Six new blocks: 짜 쩌 쪼 쭈 쯔 찌.",
  consonantName: "쌍지읒 (ssangjieut)",
  consonantHint: "like 'tts' in 'pizza' — tense, no air",
  blocks: [
    { block: "짜", romaji: "jja", hint: "ㅉ + ㅏ" },
    { block: "쩌", romaji: "jjeo", hint: "ㅉ + ㅓ" },
    { block: "쪼", romaji: "jjo", hint: "ㅉ + ㅗ" },
    { block: "쭈", romaji: "jju", hint: "ㅉ + ㅜ" },
    { block: "쯔", romaji: "jjeu", hint: "ㅉ + ㅡ" },
    { block: "찌", romaji: "jji", hint: "ㅉ + ㅣ" },
  ],
  words: [
    // 짜요 needs 요 (y-vowel, taught later). Use 짜다 (dictionary form,
    // "to be salty") — uses ㅏ (M1).
    { word: "짜다", meaningEn: "to be salty" },
    // CONTENT-TODO: 찌다 has two senses (to steam / to gain weight) —
    // verify the more common pedagogical sense.
    { word: "찌다", meaningEn: "to steam / to gain weight" },
    // 쭈 + M1 다 → 쭈다 isn't a common word. Use 짜증 — needs 증 (final ㅇ,
    // deferred). Fall back to 짝 — needs 짝 itself (1 block, jj + 받침,
    // also deferred). Use 찌개 — needs 개 (kh + ㅐ compound, deferred).
    // Settle on 쭉 — but that has a 받침. Final fallback: just 짜다's
    // imperative 짜 + a pseudo-anchor "찌찌" (baby-talk for breast). Too
    // crude. Use 쪼 (a quantity-related word? no). Use 쭈쭈바 — pop-soda
    // brand; not great. Pragmatic choice: skip the third anchor by
    // duplicating 짜다 with a different sense. CONTENT-TODO replace.
    { word: "찌", meaningEn: "fishing bobber (informal)" },
  ],
  priorBlocks: [],
};

// ─── Row order + prior-block walker ─────────────────────────────────────

export const KO_M2_ROWS: KoRow[] = [
  ROW_KH, ROW_TH, ROW_PH, ROW_CH,
  ROW_KK, ROW_TT, ROW_PP, ROW_SS, ROW_JJ,
];

/** Populate priorBlocks for M2 rows starting from all M1 blocks (vowels
 *  + 9 plain-consonant rows × 6 syllables each = 60 blocks) and chaining
 *  through M2's earlier rows. */
function populateM2PriorBlocks(): void {
  const acc: string[] = [
    ...VOWEL_BLOCKS,
    ...KO_M1_ROWS.flatMap((r) => r.blocks.map((b) => b.block)),
  ];
  for (const row of KO_M2_ROWS) {
    row.priorBlocks = [...acc];
    acc.push(...row.blocks.map((b) => b.block));
  }
}
populateM2PriorBlocks();

// ─── Y-vowel intro (bespoke, not a consonant row) ───────────────────────
//
// Y-vowels (ㅑ ㅕ ㅛ ㅠ) attach a [j] glide to the corresponding basic
// vowel. They pair with consonants the same way basic vowels do — but
// teaching the glide directly is a one-shot pattern: meet the 4 jamo,
// trace them, hear them on a few common consonants, build a word.

const Y_VOWELS: { jamo: string; block: string; basicJamo: string; basicBlock: string; romaji: string; ipa: string; hint: string }[] = [
  { jamo: "ㅑ", block: "야", basicJamo: "ㅏ", basicBlock: "아", romaji: "ya", ipa: "/ja/", hint: "like 'ya' in 'yacht'" },
  { jamo: "ㅕ", block: "여", basicJamo: "ㅓ", basicBlock: "어", romaji: "yeo", ipa: "/jʌ/", hint: "like 'yu' in 'yuck'" },
  { jamo: "ㅛ", block: "요", basicJamo: "ㅗ", basicBlock: "오", romaji: "yo", ipa: "/jo/", hint: "like 'yo' in 'yo-yo'" },
  { jamo: "ㅠ", block: "유", basicJamo: "ㅜ", basicBlock: "우", romaji: "yu", ipa: "/ju/", hint: "like 'you'" },
];

function buildYVowelLesson(): LessonContent {
  const ctx: KoRowContext = {
    allBlocks: Y_VOWELS.map((v): SyllableEntry => ({ block: v.block, romaji: v.romaji, hint: v.hint })),
    words: [
      { word: "야구", meaningEn: "baseball", emoji: "⚾" },
      { word: "여기", meaningEn: "here", emoji: "📍" },
      { word: "우유", meaningEn: "milk", emoji: "🥛" },
    ],
    tileBankPool: [
      ...VOWEL_BLOCKS,
      "야", "여", "요", "유",
      "구", "기", "우",
    ],
  };

  const steps: LessonStep[] = [
    {
      id: "ko-m2-yv-info-0",
      type: "info",
      title: "Y-vowels — adding a glide",
      body:
        "Korean has four 'y-vowels' that you write with an extra short stroke on the basic vowel:\n\n  ㅏ → ㅑ (a → ya)\n  ㅓ → ㅕ (eo → yeo)\n  ㅗ → ㅛ (o → yo)\n  ㅜ → ㅠ (u → yu)\n\nThe extra stroke tells you 'add a [y] glide at the start.' Everything else about the vowel — how long, how round — stays the same.",
      variant: "grammar",
    },
  ];

  for (const v of Y_VOWELS) {
    steps.push(
      symbolIntro(`ko-m2-yv-intro-${v.romaji}`, v.block, v.romaji, v.ipa, v.hint, `${v.basicBlock} + glide → ${v.block}`),
      traceTwice(`ko-m2-yv-trace-${v.romaji}`, v.block, v.romaji, v.hint),
      recognition(ctx, `ko-m2-yv-recog-${v.romaji}`, v.block, v.romaji, v.hint),
    );
  }

  // Anchor words built from y-vowel + already-known consonant rows.
  steps.push(
    wordImageMcq(ctx, "ko-m2-yv-mcq-yagu", "야구"),
    listeningBuild(ctx, "ko-m2-yv-build-yagu", "야구", "baseball"),
    wordImageMcq(ctx, "ko-m2-yv-mcq-yeogi", "여기"),
    listeningBuild(ctx, "ko-m2-yv-build-yeogi", "여기", "here"),
    wordImageMcq(ctx, "ko-m2-yv-mcq-uyu", "우유"),
    listeningBuild(ctx, "ko-m2-yv-build-uyu", "우유", "milk"),

    listeningComp("ko-m2-yv-lc-yagu", "야구", "baseball", ["here", "milk", "coffee"]),
    listeningComp("ko-m2-yv-lc-yeogi", "여기", "here", ["baseball", "milk", "there"]),

    speaking("ko-m2-yv-speak-yagu", "야구", "baseball"),
    speaking("ko-m2-yv-speak-uyu", "우유", "milk"),

    {
      id: "ko-m2-yv-info-end",
      type: "info",
      title: "Y-vowels — yours",
      body: "ㅑ ㅕ ㅛ ㅠ. You can now read 야구 (baseball), 여기 (here), 우유 (milk), and 교실 (classroom) when the ㄱ-row meets ㅛ. Same with every other consonant you know — pair it with a y-vowel, get a new syllable.",
      variant: "win",
    },
  );

  return {
    id: "ko-m2-yv-1",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "Y-vowels — ㅑ ㅕ ㅛ ㅠ",
    description: "Add a glide. Read your first y-vowel words.",
    estimatedMinutes: 6,
    xpReward: 14,
    steps,
  };
}

// ─── Module review (mixed drill across aspirated + tense + y-vowel) ─────

function buildModuleReview(): LessonContent {
  const reviewCtx: KoRowContext = {
    allBlocks: [
      // A sampling — recognition factory picks distractors from this pool.
      { block: "카", romaji: "ka" }, { block: "타", romaji: "ta" },
      { block: "파", romaji: "pa" }, { block: "차", romaji: "cha" },
      { block: "까", romaji: "kka" }, { block: "따", romaji: "tta" },
      { block: "야", romaji: "ya" }, { block: "여", romaji: "yeo" },
    ],
    words: [
      { word: "커피", meaningEn: "coffee", emoji: "☕" },
      { word: "야구", meaningEn: "baseball", emoji: "⚾" },
      { word: "오빠", meaningEn: "older brother (♀ speaker)", emoji: "🧑" },
      { word: "토끼", meaningEn: "rabbit", emoji: "🐰" },
    ],
    tileBankPool: ["코", "키", "피", "차", "토", "끼", "야", "여", "구", "오", "빠", "커"],
  };

  return {
    id: "ko-m2-review",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "M2 — Full review",
    description: "Mixed drill across aspirated consonants, tense consonants, and y-vowels.",
    estimatedMinutes: 7,
    xpReward: 20,
    kind: "module_review",
    steps: [
      {
        id: "ko-m2-review-info-0",
        type: "info",
        title: "Module 2 review",
        body:
          "You learned 13 new jamo across three groups: 4 aspirated consonants (ㅋ ㅌ ㅍ ㅊ), 5 tense consonants (ㄲ ㄸ ㅃ ㅆ ㅉ), and 4 y-vowels (ㅑ ㅕ ㅛ ㅠ). Together with M1, you can now read every plain syllable in Korean — only compound vowels and final-consonant 받침 are left.",
        variant: "culture",
      },

      // Recognition sweep — one block per row sub-set.
      recognition(reviewCtx, "ko-m2-review-recog-ka", "카", "ka", "aspirated"),
      recognition(reviewCtx, "ko-m2-review-recog-kka", "까", "kka", "tense"),
      recognition(reviewCtx, "ko-m2-review-recog-ya", "야", "ya", "y-vowel"),

      // Word recognition.
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-keopi", "커피"),
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-yagu", "야구"),
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-oppa", "오빠"),

      // Listening build — production.
      listeningBuild(reviewCtx, "ko-m2-review-build-keopi", "커피", "coffee"),
      listeningBuild(reviewCtx, "ko-m2-review-build-tokki", "토끼", "rabbit"),

      // Listening comprehension.
      listeningComp("ko-m2-review-lc-keopi", "커피", "coffee", ["baseball", "rabbit", "skirt"]),
      listeningComp("ko-m2-review-lc-yagu", "야구", "baseball", ["coffee", "milk", "older brother"]),

      // Speaking.
      speaking("ko-m2-review-speak-keopi", "커피", "coffee"),
      speaking("ko-m2-review-speak-yagu", "야구", "baseball"),

      {
        id: "ko-m2-review-info-end",
        type: "info",
        title: "Reading foundation: complete",
        body:
          "You finished the M2 review. Plain + aspirated + tense consonants × basic + y-vowels covers most of the syllable inventory you'll see in everyday Korean. Compound vowels (ㅐ ㅔ ㅘ ㅝ) and final-consonant 받침 are next — but you can already read coffee menus, K-drama subtitles, and most signage.",
        variant: "win",
      },
    ],
  };
}

// ─── Public builder ─────────────────────────────────────────────────────

/**
 * Build every M2 lesson the curriculum exposes — 9 rows × 3 sub-lessons
 * (27 lessons) + Y-vowel lesson + module review.
 */
export function buildAllKoreanM2Lessons(): LessonContent[] {
  const out: LessonContent[] = [];
  for (const row of KO_M2_ROWS) {
    validateRowVocab(row);
    out.push(...buildRowSubLessons(row, "m2"));
  }
  out.push(buildYVowelLesson());
  out.push(buildModuleReview());
  return out;
}
