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
 * Compound vowels are taught HERE as of the 2026-09-01 release audit
 * (Tier-2 item 3 — they were used from m3's 이에요/예요 onward but never
 * taught). Three bespoke lessons interleaved into the row march as breaks
 * (interleave-don't-block-teach):
 *   - ko-m2-cv-1 (after the aspirated rows): ㅐ ㅔ — the e-vowels, needed
 *     earliest (학생, 이에요, 주세요, 네 …).
 *   - ko-m2-cv-2 (after ㅃ, mid-tense-march): ㅘ ㅝ ㅟ — the w-vowels
 *     (사과, 뭐, 원, 귀 …).
 *   - ko-m2-cv-3 (after the y-vowel lesson, whose glide concept it needs):
 *     ㅖ ㅙ ㅚ ㅢ (예요, 왜, 회사, 의자/의). ㅒ and ㅞ are mentioned as
 *     rare, not drilled — neither appears anywhere in m1–m15 text.
 * Inventory basis: a decomposition scan of every m1–m15 Hangul literal
 * (2026-09-01) — the drilled set covers every compound vowel in use.
 *
 * 받침 (final consonants) are taught HERE as of the 2026-09-01 depth pass
 * (the follow-up to the compound-vowel audit: the tier taught only the
 * [t]-group, 1 of the 7 final sound groups, while m3 lesson 1 already
 * requires five of the others — 안녕하세요 alone carries ㄴ and ㅇ finals,
 * 학생/선생님/반갑습니다 carry ㄱ ㅁ ㅂ). Same interleave style as the
 * CV arc — four lessons spread through the march, never back-to-back:
 *   - ko-m2-bt-1 (after ㄲ, breaking the tense march): ㄴ [n] + ㅁ [m] —
 *     the hummable nasals, easiest to hear, all-m1 letters (눈, 돈, 곰,
 *     밤; builds 사람, 시간).
 *   - ko-m2-bt-2 (after ㅆ): ㅇ [ng] + ㄹ [l] — pays off m1-intro's
 *     "ㅇ makes a sound at the bottom: more on that later" promise, and
 *     the ㄹ coda-[l]-vs-flap-[r] allophony note (강, 빵, 물, 말; builds
 *     서울, 오늘).
 *   - ko-m2-bt-3 (after cv-3, whose ㅐ it needs for 책/학생): ㄱ [k] +
 *     ㅂ [p] — the unreleased stops, priming the stop concept the
 *     [t]-group lesson then leans on (책, 국, 밥, 집; builds 한국, 학생).
 *   - ko-m2-batchim-1 (existing, after the module review): the [t]-group
 *     collapse — kept last of the teach lessons because 7-letters→1-sound
 *     is the strange one; its intro now bridges from the six known groups.
 *   - ko-m2-bt-review (module tail): mixed 7-group drill + the honest
 *     연음 beats (물이→[무리], 있어요→[이써요], 좋아요→[조아요], and the
 *     없어요/많이 double-coda mention) — explanation + light drill only;
 *     the m3–m15 scan shows liaison everywhere (이에요/어요 endings) but
 *     no evidence a full drill arc is needed before m15.
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
  matchBlocksToRomaji,
  correctSlot,
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

// ─── Compound vowels (bespoke lessons, y-vowel pattern) ─────────────────
//
// 2026-09-01: compound vowels were the audit's biggest m2→m3 seam defect —
// used constantly from m3 on, taught nowhere. Three lessons, interleaved
// into the march (see file header). Each follows the y-vowel lesson shape:
// concept info → symbolIntro/trace/recognition per block → anchor words →
// listening/speaking → win info. Anchor words obey the row-lesson rule
// (every block decomposes into already-taught jamo at that position) and
// every word/block string has (or ships with) a manifest clip.

function buildCompoundVowelLesson1(): LessonContent {
  // Position: after the aspirated rows (ㅋㅌㅍㅊ), before the tense rows.
  // Known inventory: 6 basic vowels + m1 plain consonants + ㅋㅌㅍㅊ.
  const BLOCKS: SyllableEntry[] = [
    { block: "애", romaji: "ae", hint: "ㅏ + ㅣ fused — 'e' as in 'bed'" },
    { block: "에", romaji: "e", hint: "ㅓ + ㅣ fused — 'e' as in 'bed'" },
  ];
  const ctx: KoRowContext = {
    allBlocks: BLOCKS,
    words: [
      { word: "개", meaningEn: "dog", emoji: "🐶" },
      { word: "가게", meaningEn: "store / shop", emoji: "🏪" },
      { word: "노래", meaningEn: "song", emoji: "🎵" },
    ],
    tileBankPool: ["아", "어", "이", "애", "에", "가", "게", "개", "노", "래", "네"],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-cv1-info-0",
      type: "info",
      title: "Compound vowels — two vowels, one sound",
      body:
        "Korean fuses two vowel letters into one written vowel:\n\n  ㅏ + ㅣ → ㅐ (ae)\n  ㅓ + ㅣ → ㅔ (e)\n\nHere's the honest part: in today's Korean, ㅐ and ㅔ sound IDENTICAL — both like 'e' in 'bed'. Spelling tells words apart (개 'dog' vs 게 'crab'), the sound doesn't. You'll meet these two constantly — 이에요, 네, 가게, 주세요 all use ㅔ.",
      variant: "grammar",
    },
  ];
  for (const b of BLOCKS) {
    steps.push(
      symbolIntro(`ko-m2-cv1-intro-${b.romaji}`, b.block, b.romaji, "/e̞/", b.hint ?? "", `개 (dog) / 가게 (store)`),
      traceTwice(`ko-m2-cv1-trace-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
      recognition(ctx, `ko-m2-cv1-recog-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
    );
  }
  steps.push(
    wordImageMcq(ctx, "ko-m2-cv1-mcq-gae", "개"),
    listeningBuild(ctx, "ko-m2-cv1-build-gage", "가게", "store / shop"),
    wordImageMcq(ctx, "ko-m2-cv1-mcq-norae", "노래"),
    listeningBuild(ctx, "ko-m2-cv1-build-norae", "노래", "song"),
    listeningComp("ko-m2-cv1-lc-gae", "개", "dog", ["a store", "a song", "a crab"]),
    listeningComp("ko-m2-cv1-lc-gage", "가게", "store / shop", ["a dog", "a song", "meat"]),
    speaking("ko-m2-cv1-speak-gae", "개", "dog"),
    speaking("ko-m2-cv1-speak-norae", "노래", "song"),
    {
      id: "ko-m2-cv1-info-end",
      type: "info",
      title: "ㅐ and ㅔ — yours",
      body:
        "You can now read 개 (dog), 가게 (store), 노래 (song) — and, soon, the polite endings 이에요/예요 that finish half the sentences in this course. When two spellings sound the same, that's not you mishearing: it's modern Korean.",
      variant: "win",
    },
  );
  return {
    id: "ko-m2-cv-1",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "Compound vowels — ㅐ ㅔ",
    description: "Two fused vowels, one 'e' sound. Read 개, 가게, 노래.",
    estimatedMinutes: 5,
    xpReward: 13,
    steps,
  };
}

function buildCompoundVowelLesson2(): LessonContent {
  // Position: after the ㅃ row — a break in the tense-consonant march.
  const BLOCKS: SyllableEntry[] = [
    { block: "와", romaji: "wa", hint: "ㅗ + ㅏ — 'wa' as in 'water'" },
    { block: "워", romaji: "wo", hint: "ㅜ + ㅓ — 'wo' as in 'wonder'" },
    { block: "위", romaji: "wi", hint: "ㅜ + ㅣ — 'we' as in 'week'" },
  ];
  const ctx: KoRowContext = {
    allBlocks: BLOCKS,
    words: [
      { word: "사과", meaningEn: "apple", emoji: "🍎" },
      { word: "뭐", meaningEn: "what", emoji: "❓" },
      { word: "귀", meaningEn: "ear", emoji: "👂" },
    ],
    tileBankPool: ["오", "우", "아", "어", "이", "와", "워", "위", "사", "과", "구", "마"],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-cv2-info-0",
      type: "info",
      title: "W-vowels — a round vowel first",
      body:
        "Start a round vowel (ㅗ or ㅜ), glide into a second one — that's a Korean 'w':\n\n  ㅗ + ㅏ → ㅘ (wa)\n  ㅜ + ㅓ → ㅝ (wo)\n  ㅜ + ㅣ → ㅟ (wi)\n\nThe round letter is written first, on the left of the block: 과 = ㄱ + ㅘ. These carry everyday words — 사과 (apple), 뭐 (what), 원 (₩), 귀 (ear).",
      variant: "grammar",
    },
  ];
  for (const b of BLOCKS) {
    steps.push(
      symbolIntro(`ko-m2-cv2-intro-${b.romaji}`, b.block, b.romaji, "", b.hint ?? "", `사과 (apple) / 뭐 (what)`),
      traceTwice(`ko-m2-cv2-trace-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
      recognition(ctx, `ko-m2-cv2-recog-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
    );
  }
  steps.push(
    wordImageMcq(ctx, "ko-m2-cv2-mcq-sagwa", "사과"),
    listeningBuild(ctx, "ko-m2-cv2-build-sagwa", "사과", "apple"),
    wordImageMcq(ctx, "ko-m2-cv2-mcq-gwi", "귀"),
    listeningComp("ko-m2-cv2-lc-mwo", "뭐", "what", ["an apple", "an ear", "who"]),
    listeningComp("ko-m2-cv2-lc-sagwa", "사과", "apple", ["what", "an ear", "a grape"]),
    speaking("ko-m2-cv2-speak-sagwa", "사과", "apple"),
    speaking("ko-m2-cv2-speak-mwo", "뭐", "what"),
    {
      id: "ko-m2-cv2-info-end",
      type: "info",
      title: "W-vowels — yours",
      body:
        "ㅘ ㅝ ㅟ. You can now read 사과 (apple), 뭐 (what — the single most useful question word), and 귀 (ear). Back to the tense consonants next.",
      variant: "win",
    },
  );
  return {
    id: "ko-m2-cv-2",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "Compound vowels — ㅘ ㅝ ㅟ",
    description: "The w-vowels. Read 사과, 뭐, 귀.",
    estimatedMinutes: 5,
    xpReward: 13,
    steps,
  };
}

function buildCompoundVowelLesson3(): LessonContent {
  // Position: right after the y-vowel lesson — ㅖ is framed as ㅔ + the
  // y-glide the learner just met.
  const BLOCKS: SyllableEntry[] = [
    { block: "예", romaji: "ye", hint: "ㅔ + y-glide — 'ye' as in 'yes'" },
    { block: "왜", romaji: "wae", hint: "ㅗ + ㅐ — 'we' as in 'wet'" },
    { block: "외", romaji: "oe", hint: "ㅗ + ㅣ — also 'we' as in 'wet'" },
    { block: "의", romaji: "ui", hint: "ㅡ + ㅣ said quickly — 'uh-ee'" },
  ];
  const ctx: KoRowContext = {
    allBlocks: BLOCKS,
    words: [
      { word: "왜", meaningEn: "why", emoji: "❓" },
      { word: "회사", meaningEn: "company / office", emoji: "🏢" },
      { word: "의자", meaningEn: "chair", emoji: "🪑" },
    ],
    tileBankPool: ["예", "왜", "외", "의", "에", "애", "와", "회", "사", "자", "이", "으"],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-cv3-info-0",
      type: "info",
      title: "ㅖ — the y-glide meets ㅔ",
      body:
        "You just learned the y-vowels. One more takes the same glide: ㅔ → ㅖ (ye), as in 예 ('yes', polite) and the ending 예요. (Its twin ㅒ exists but is so rare you can ignore it for now.)",
      variant: "grammar",
    },
    {
      id: "ko-m2-cv3-info-1",
      type: "info",
      title: "The 'we' twins — ㅙ and ㅚ",
      body:
        "Two more w-vowels, and here's the honest part again: they sound the SAME — 'we' as in 'wet':\n\n  ㅗ + ㅐ → ㅙ (왜 'why')\n  ㅗ + ㅣ → ㅚ (회사 'company')\n\nSpelling tells the words apart, not sound. (A third twin, ㅞ, appears almost only in loanwords like 웨이터 'waiter' — recognize it, don't sweat it.)",
      variant: "tip",
    },
    {
      id: "ko-m2-cv3-info-2",
      type: "info",
      title: "ㅢ — the last vowel",
      body:
        "ㅡ + ㅣ said in one quick motion: ㅢ (의). It opens words like 의자 (chair) and 의사 (doctor). This is the LAST vowel in Korean — after this lesson you have the complete set.",
      variant: "grammar",
    },
  ];
  for (const b of BLOCKS) {
    steps.push(
      symbolIntro(`ko-m2-cv3-intro-${b.romaji}`, b.block, b.romaji, "", b.hint ?? "", `왜 (why) / 회사 (company) / 의자 (chair)`),
      traceTwice(`ko-m2-cv3-trace-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
      recognition(ctx, `ko-m2-cv3-recog-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
    );
  }
  steps.push(
    wordImageMcq(ctx, "ko-m2-cv3-mcq-hoesa", "회사"),
    listeningBuild(ctx, "ko-m2-cv3-build-hoesa", "회사", "company / office"),
    wordImageMcq(ctx, "ko-m2-cv3-mcq-uija", "의자"),
    listeningBuild(ctx, "ko-m2-cv3-build-uija", "의자", "chair"),
    listeningComp("ko-m2-cv3-lc-wae", "왜", "why", ["what", "a company", "a chair"]),
    listeningComp("ko-m2-cv3-lc-uija", "의자", "chair", ["a company", "why", "a doctor"]),
    speaking("ko-m2-cv3-speak-wae", "왜", "why"),
    speaking("ko-m2-cv3-speak-hoesa", "회사", "company / office"),
    {
      id: "ko-m2-cv3-info-end",
      type: "info",
      title: "Every Korean vowel — done",
      body:
        "ㅖ, ㅙ, ㅚ, ㅢ — plus everything before them: the vowel system is COMPLETE. 예요, 왜, 회사, 의자 are all readable now, and no vowel in this course will ever surprise you again. What's left is finishing the 받침 endings — the stopped ㄱ/ㅂ are next, and they pair with these new vowels: 책, 학생.",
      variant: "win",
    },
  );
  return {
    id: "ko-m2-cv-3",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "Compound vowels — ㅖ ㅙ ㅚ ㅢ",
    description: "Finish the vowel system. Read 예, 왜, 회사, 의자.",
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
      { block: "애", romaji: "ae" }, { block: "와", romaji: "wa" },
    ],
    words: [
      { word: "커피", meaningEn: "coffee", emoji: "☕" },
      { word: "야구", meaningEn: "baseball", emoji: "⚾" },
      { word: "오빠", meaningEn: "older brother (♀ speaker)", emoji: "🧑" },
      { word: "토끼", meaningEn: "rabbit", emoji: "🐰" },
      { word: "사과", meaningEn: "apple", emoji: "🍎" },
    ],
    tileBankPool: ["코", "키", "피", "차", "토", "끼", "야", "여", "구", "오", "빠", "커", "사", "과", "애"],
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
          "You learned 22 new jamo across four groups: 4 aspirated consonants (ㅋ ㅌ ㅍ ㅊ), 5 tense consonants (ㄲ ㄸ ㅃ ㅆ ㅉ), 4 y-vowels (ㅑ ㅕ ㅛ ㅠ), and 9 compound vowels (ㅐ ㅔ ㅖ ㅘ ㅝ ㅟ ㅙ ㅚ ㅢ) — plus six of the seven 받침 ending sounds: [n] [m] (눈, 곰), [ng] [l] (강, 물), [k] [p] (책, 밥). One ending family is still ahead.",
        variant: "culture",
      },

      // Recognition sweep — one block per row sub-set.
      recognition(reviewCtx, "ko-m2-review-recog-ka", "카", "ka", "aspirated"),
      recognition(reviewCtx, "ko-m2-review-recog-kka", "까", "kka", "tense"),
      recognition(reviewCtx, "ko-m2-review-recog-ya", "야", "ya", "y-vowel"),
      recognition(reviewCtx, "ko-m2-review-recog-ae", "애", "ae", "compound vowel"),

      // Word recognition.
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-keopi", "커피"),
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-yagu", "야구"),
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-oppa", "오빠"),
      wordImageMcq(reviewCtx, "ko-m2-review-mcq-sagwa", "사과"),

      // Listening build — production.
      listeningBuild(reviewCtx, "ko-m2-review-build-keopi", "커피", "coffee"),
      listeningBuild(reviewCtx, "ko-m2-review-build-tokki", "토끼", "rabbit"),

      // Listening comprehension — including two 받침 words from the bt arc.
      listeningComp("ko-m2-review-lc-keopi", "커피", "coffee", ["baseball", "rabbit", "skirt"]),
      listeningComp("ko-m2-review-lc-yagu", "야구", "baseball", ["coffee", "milk", "older brother"]),
      listeningComp("ko-m2-review-lc-hanguk", "한국", "Korea", ["Seoul", "a student", "a book"]),
      listeningComp("ko-m2-review-lc-bap", "밥", "rice / a meal", ["bread", "night", "water"]),

      // Speaking.
      speaking("ko-m2-review-speak-keopi", "커피", "coffee"),
      speaking("ko-m2-review-speak-yagu", "야구", "baseball"),

      {
        id: "ko-m2-review-info-end",
        type: "info",
        title: "Reading foundation: complete",
        body:
          "You finished the M2 review. Every consonant × the COMPLETE vowel set, and six of the seven 받침 ending sounds. One strange family remains: the seven letters that ALL collapse to a stopped [t] at a syllable's end. That's next — and then nothing in Hangul is unreadable: coffee menus, K-drama subtitles, signage, all of it.",
        variant: "win",
      },
    ],
  };
}

// ─── 받침 neutralization — the [t] group ────────────────────────────────
//
// The last TEACH lesson of the batchim arc (bt-1 nasals → bt-2 ㅇ/ㄹ →
// bt-3 stops → module review → THIS). Rows taught these letters as
// ONSETS; the arc teaches them as CODAS, where Korean neutralizes a
// blocked final to one of only 7 sounds ([k n t l m p ŋ]) — six of which
// the learner now knows letter-by-letter. This lesson does the biggest
// collapse: ㄷ ㅌ ㅅ ㅆ ㅈ ㅊ ㅎ all → a plain unreleased [t] at a
// syllable's end. Its intro deliberately bridges FROM the six known
// groups — don't re-introduce the 받침 concept here (bt-1 owns that).
//
// Verified against the RR engine (romanization/hangulRomanize.ts): every
// one of those 7 jongseong carries `rep: "t"`, so 옷→ot, 꽃→kkot, 밭→bat,
// 낮→nat, and the verb stems 듣/웃/있 all end [t]. (ㅎ only surfaces as a
// bare [t] utterance-finally — 좋 alone is [jot]; in 좋다 it aspirates the
// 다 → [jota] — so we mention it but drill the clean ㅅ/ㅊ/ㅌ cases.)

/**
 * A "which sound does this coda make?" MCQ. Options are Hangul blocks that
 * differ only in their 받침; the learner picks the one whose written ending
 * matches how the target word actually sounds. Romaji is hidden on options
 * so the drill tests the sound→letter mapping, not romaji-skimming.
 */
function codaSoundMcq(
  id: string,
  prompt: string,
  correctBlock: string,
  distractorBlocks: [string, string, string],
  explanation: string,
): LessonStep {
  const items = [
    { id: "correct", text: correctBlock },
    { id: "opt-1", text: distractorBlocks[0] },
    { id: "opt-2", text: distractorBlocks[1] },
    { id: "opt-3", text: distractorBlocks[2] },
  ];
  const slot = correctSlot(id);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "multiple_choice",
    prompt,
    options: items,
    correctOptionId: "correct",
    explanation,
    optionsHideRomaji: true,
  };
}

function buildBatchimLesson(): LessonContent {
  const steps: LessonStep[] = [
    {
      id: "ko-m2-batchim-info-1",
      type: "info",
      title: "받침 — the last ending",
      body:
        "You know six of the seven 받침 ending sounds: [n] 눈, [m] 곰, [ng] 강, [l] 물, [k] 책, [p] 밥 — each spelled with the letter that makes it.\n\nThe seventh slot, [t], is the strange one. It isn't one letter. SEVEN different letters all collapse into it at the bottom of a block — the biggest sound-merger in Korean.",
      variant: "grammar",
    },
    {
      id: "ko-m2-batchim-info-2",
      type: "info",
      title: "Seven letters → one [t]",
      body:
        "The biggest group all lands on a plain, stopped [t]. These seven 받침 are ALL pronounced [t] at a syllable's end:\n\n  ㄷ · ㅌ · ㅅ · ㅆ · ㅈ · ㅊ · ㅎ\n\nSo 옷 (clothes) sounds like [ot], 꽃 (flower) like [kkot], and 밭 (field) like [bat] — even though they're spelled with ㅅ, ㅊ, and ㅌ. Don't release the ending; just stop on [t]. (ㅎ joins them only at the very end of a word — 좋 on its own is [jot].)",
      variant: "tip",
    },

    // Nouns — hear the stop, then choose the block that spells the sound.
    listeningComp("ko-m2-batchim-lc-ot", "옷", "clothes", ["shoes", "a hat", "milk"]),
    codaSoundMcq(
      "ko-m2-batchim-mcq-ot",
      "옷 means 'clothes'. Which block shows how its ending SOUNDS?",
      "옫",
      ["옥", "온", "옵"],
      "옷 ends in ㅅ, but a final ㅅ is pronounced [t] — the same sound as ㄷ. So 옷 sounds like 옫 [ot].",
    ),
    listeningComp("ko-m2-batchim-lc-kkot", "꽃", "flower", ["a tree", "grass", "a car"]),
    codaSoundMcq(
      "ko-m2-batchim-mcq-kkot",
      "꽃 means 'flower'. Which block shows how its ending SOUNDS?",
      "꼳",
      ["꼭", "꼰", "꼽"],
      "The final ㅊ in 꽃 becomes a plain stopped [t]. 꽃 sounds like 꼳 [kkot].",
    ),

    {
      id: "ko-m2-batchim-info-3",
      type: "info",
      title: "Verbs end in [t] a lot",
      body:
        "You'll meet this constantly in verbs. A dictionary form is stem + 다, and many stems end in one of these seven letters:\n\n  듣다 (to listen) — 듣 is [deut]\n  웃다 (to laugh) — 웃 is [ut]\n  있다 (to exist / to have) — 있 is [it]\n\nThe stem stops on [t] right before the 다.",
      variant: "grammar",
    },

    listeningComp("ko-m2-batchim-lc-itda", "있다", "to exist / to have", ["to go", "to eat", "to sleep"]),
    codaSoundMcq(
      "ko-m2-batchim-mcq-ut",
      "웃다 means 'to laugh'. How does the 웃 stem sound?",
      "욷",
      ["욱", "운", "웁"],
      "웃 ends in ㅅ → a stopped [t]. 웃 sounds like 욷 [ut] — the same [t] you hear right before 다.",
    ),
    listeningComp("ko-m2-batchim-lc-bat", "밭", "field", ["the sea", "a mountain", "the sky"]),
    codaSoundMcq(
      "ko-m2-batchim-mcq-rule",
      "Which of these 받침 is NOT pronounced [t] at a syllable's end?",
      "ㅁ",
      ["ㅌ", "ㅅ", "ㅈ"],
      "ㅌ, ㅅ, and ㅈ all collapse to [t]. ㅁ is the odd one out — it stays [m], like the ending of 곰 (bear).",
    ),

    // Say the stop yourself, then a recognition-easy close.
    speaking("ko-m2-batchim-speak-ot", "옷", "clothes"),
    matchBlocksToRomaji(
      "ko-m2-batchim-match",
      [
        { block: "옷", romaji: "ot" },
        { block: "꽃", romaji: "kkot" },
        { block: "밭", romaji: "bat" },
        { block: "낮", romaji: "nat" },
      ],
      "Match each word to how it sounds",
    ),

    {
      id: "ko-m2-batchim-info-end",
      type: "info",
      title: "You can hear the stop",
      body:
        "ㄷ ㅌ ㅅ ㅆ ㅈ ㅊ ㅎ at a syllable's end are all one plain, stopped [t]. You can now read 옷, 꽃, 밭, 낮 and the stems of 듣다, 웃다, 있다 the way Koreans actually say them — the last big piece of Hangul pronunciation. You don't just read every syllable now; you know how its ending sounds.",
      variant: "win",
    },
  ];

  return {
    id: "ko-m2-batchim-1",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "받침 — the final [t] sound",
    description: "Seven letters, one sound: how ㄷ ㅌ ㅅ ㅆ ㅈ ㅊ ㅎ all stop on [t] at a syllable's end.",
    estimatedMinutes: 6,
    xpReward: 15,
    steps,
  };
}

// ─── 받침 depth arc (2026-09-01) — the six letter-true final groups ──────
//
// Census basis (decomposition scan of m1–m15 Hangul literals, 2026-09-01):
// every one of the 7 final sound groups is in heavy course use, and m3
// lesson 1 already requires ㄴ ㅇ ㅁ ㅂ ㄱ (안녕하세요, 학생, 선생님,
// 반갑습니다) with ㄹ close behind (이름, 얼마) — so ALL of them must be
// taught here in m2, before their first graded use. Each lesson follows
// the CV-lesson shape (concept info → per-block intro/trace/recognition →
// anchor words → listening/speaking → win) and every block/word ships
// with a manifest clip (koHangulAudioCoverage ratchet 0).

function buildBatchimNasalLesson(): LessonContent {
  // Position: after the ㄲ row — first break in the tense march, and the
  // learner's FIRST batchim exposure (this lesson owns the 받침 concept
  // intro; batchim-1's [t] lesson bridges from here). Nasals first
  // because they're the only finals you can stretch and HEAR — nothing
  // is stopped or swallowed. All blocks use m1 jamo only.
  const BLOCKS: SyllableEntry[] = [
    { block: "눈", romaji: "nun", ipa: "/nun/", hint: "ㄴ + ㅜ + ㄴ — end on a held 'n'" },
    { block: "돈", romaji: "don", ipa: "/ton/", hint: "ㄷ + ㅗ + ㄴ — end on a held 'n'" },
    { block: "곰", romaji: "gom", ipa: "/kom/", hint: "ㄱ + ㅗ + ㅁ — close your lips and hum" },
    { block: "밤", romaji: "bam", ipa: "/pam/", hint: "ㅂ + ㅏ + ㅁ — close your lips and hum" },
  ];
  const ctx: KoRowContext = {
    allBlocks: BLOCKS,
    words: [
      { word: "눈", meaningEn: "eye", emoji: "👁️" },
      { word: "돈", meaningEn: "money", emoji: "💰" },
      { word: "곰", meaningEn: "bear", emoji: "🐻" },
      { word: "밤", meaningEn: "night", emoji: "🌙" },
      { word: "사람", meaningEn: "person", emoji: "🧑" },
      { word: "시간", meaningEn: "time", emoji: "⏰" },
    ],
    tileBankPool: ["눈", "돈", "곰", "밤", "사", "시", "마", "라", "가", "나"],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-bt1-info-0",
      type: "info",
      title: "받침 — the letter at the bottom",
      body:
        "A consonant written at the BOTTOM of a block is a 받침 (batchim) — the 'support'. You read it last: 눈 = ㄴ + ㅜ + ㄴ → 'nun'.\n\nOnly SEVEN sounds can end a Korean syllable: [k] [n] [t] [l] [m] [p] [ng]. You already met [t]. Today, the two easiest — the nasals ㄴ [n] and ㅁ [m]. They're the finals you can stretch: hum the end of 눈 and it just keeps going.",
      variant: "grammar",
    },
  ];
  for (const b of BLOCKS) {
    const word = ctx.words.find((w) => w.word === b.block)!;
    steps.push(
      symbolIntro(`ko-m2-bt1-intro-${b.romaji}`, b.block, b.romaji, b.ipa ?? "", b.hint ?? "", `${b.block} (${word.meaningEn})`),
      traceTwice(`ko-m2-bt1-trace-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
      recognition(ctx, `ko-m2-bt1-recog-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
    );
  }
  steps.push(
    wordImageMcq(ctx, "ko-m2-bt1-mcq-nun", "눈"),
    wordImageMcq(ctx, "ko-m2-bt1-mcq-gom", "곰"),
    listeningBuild(ctx, "ko-m2-bt1-build-saram", "사람", "person"),
    listeningBuild(ctx, "ko-m2-bt1-build-sigan", "시간", "time"),
    listeningComp("ko-m2-bt1-lc-bam", "밤", "night", ["money", "an eye", "a bear"]),
    matchBlocksToRomaji(
      "ko-m2-bt1-match",
      [
        { block: "눈", romaji: "nun" },
        { block: "돈", romaji: "don" },
        { block: "곰", romaji: "gom" },
        { block: "밤", romaji: "bam" },
      ],
      "Match each word to how it sounds",
    ),
    speaking("ko-m2-bt1-speak-saram", "사람", "person"),
    {
      id: "ko-m2-bt1-info-end",
      type: "info",
      title: "ㄴ and ㅁ — yours",
      body:
        "눈 (eye), 돈 (money), 곰 (bear), 밤 (night), 사람 (person), 시간 (time) — your first six words with a final consonant. The trick to hearing ㄴ vs ㅁ: watch the lips. ㅁ closes them (곰), ㄴ leaves them open (돈). Back to the tense consonants next — more ending sounds later in the module.",
      variant: "win",
    },
  );
  return {
    id: "ko-m2-bt-1",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "받침 — the hummed endings ㄴ ㅁ",
    description: "Your first final consonants. Read 눈, 돈, 곰, 밤, 사람, 시간.",
    estimatedMinutes: 6,
    xpReward: 14,
    steps,
  };
}

function buildBatchimNgLLesson(): LessonContent {
  // Position: after the ㅆ row — second break in the tense march (bt-1
  // sat after ㄲ; ㄸ/ㅃ/cv-2 keep the two batchim lessons well apart).
  // ㅇ here pays off the m1-intro promise ("at the bottom, ㅇ does make a
  // sound: 'ng'. More on that later") — the learner has spent a module
  // and a half with silent ㅇ, so the reveal lands. ㄹ gets the
  // coda-[l]-vs-flap allophony note (a KO course voice strength).
  const BLOCKS: SyllableEntry[] = [
    { block: "강", romaji: "gang", ipa: "/kaŋ/", hint: "ㄱ + ㅏ + ㅇ — end on 'ng' as in 'song'" },
    { block: "빵", romaji: "ppang", ipa: "/p͈aŋ/", hint: "ㅃ + ㅏ + ㅇ — tense start, 'ng' end" },
    { block: "물", romaji: "mul", ipa: "/mul/", hint: "ㅁ + ㅜ + ㄹ — tongue tip up, hold the 'l'" },
    { block: "말", romaji: "mal", ipa: "/mal/", hint: "ㅁ + ㅏ + ㄹ — tongue tip up, hold the 'l'" },
  ];
  const ctx: KoRowContext = {
    allBlocks: BLOCKS,
    words: [
      { word: "강", meaningEn: "river", emoji: "🏞️" },
      { word: "빵", meaningEn: "bread", emoji: "🍞" },
      { word: "물", meaningEn: "water", emoji: "💧" },
      { word: "말", meaningEn: "horse", emoji: "🐴" },
      { word: "오늘", meaningEn: "today", emoji: "📅" },
      { word: "서울", meaningEn: "Seoul" },
    ],
    tileBankPool: ["강", "빵", "물", "말", "서", "울", "오", "늘", "누", "수"],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-bt2-info-0",
      type: "info",
      title: "ㅇ finds its voice",
      body:
        "Remember the promise from lesson one? At the START of a block, ㅇ is silent — a placeholder. At the BOTTOM, it finally speaks: [ng], exactly the ending of English 'song'. 강 = 'gang' (river).\n\nIt is never a hard 'g' — don't say 'gan-guh'. English already ends words this way; trust your 'song'.",
      variant: "grammar",
    },
    {
      id: "ko-m2-bt2-info-l",
      type: "info",
      title: "ㄹ at the bottom — a true [l]",
      body:
        "You learned ㄹ as a quick tongue flap (다리, 'butter'-tt). At the BOTTOM of a block it changes: the tongue tip touches the ridge behind your teeth and HOLDS — a real 'l'. 물 (water) = 'mul', 말 (horse) = 'mal'.\n\nSame letter, two honest sounds: flap between vowels, held [l] at the end.",
      variant: "tip",
    },
  ];
  for (const b of BLOCKS) {
    const word = ctx.words.find((w) => w.word === b.block)!;
    steps.push(
      symbolIntro(`ko-m2-bt2-intro-${b.romaji}`, b.block, b.romaji, b.ipa ?? "", b.hint ?? "", `${b.block} (${word.meaningEn})`),
      traceTwice(`ko-m2-bt2-trace-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
      recognition(ctx, `ko-m2-bt2-recog-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
    );
  }
  steps.push(
    wordImageMcq(ctx, "ko-m2-bt2-mcq-ppang", "빵"),
    wordImageMcq(ctx, "ko-m2-bt2-mcq-mul", "물"),
    listeningBuild(ctx, "ko-m2-bt2-build-seoul", "서울", "Seoul"),
    listeningBuild(ctx, "ko-m2-bt2-build-oneul", "오늘", "today"),
    listeningComp("ko-m2-bt2-lc-gang", "강", "river", ["bread", "water", "a horse"]),
    codaSoundMcq(
      "ko-m2-bt2-mcq-same-l",
      "물 ends on a held [l]. Which of these ends with the SAME sound?",
      "말",
      ["곰", "눈", "빵"],
      "말 (horse) also ends in ㄹ — a held [l]. 곰 hums [m], 눈 hums [n], 빵 sings [ng].",
    ),
    speaking("ko-m2-bt2-speak-mul", "물", "water"),
    speaking("ko-m2-bt2-speak-seoul", "서울", "Seoul"),
    {
      id: "ko-m2-bt2-info-end",
      type: "info",
      title: "ㅇ and ㄹ — yours",
      body:
        "강 (river), 빵 (bread), 물 (water), 말 (horse), 오늘 (today), 서울 (Seoul). Four of the seven ending sounds down — [n] [m] [ng] [l], the four you can hold and hear. The stopped endings are still ahead. Back to the last tense row next.",
      variant: "win",
    },
  );
  return {
    id: "ko-m2-bt-2",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "받침 — ㅇ sings, ㄹ holds",
    description: "The silent letter finds its voice. Read 강, 빵, 물, 말, 서울, 오늘.",
    estimatedMinutes: 6,
    xpReward: 14,
    steps,
  };
}

function buildBatchimStopLesson(): LessonContent {
  // Position: right after cv-3 — 책 and 학생 need cv-1's ㅐ, and coming
  // after the vowel-system finale this lesson starts the "finish the
  // endings" run the cv-3 win text promises. Teaching the clean stops
  // ㄱ/ㅂ BEFORE the [t]-collapse lesson is deliberate sequencing: the
  // learner meets "stopped, not released" where letter = sound, so the
  // seven-letters-one-[t] merger is the only new idea left.
  const BLOCKS: SyllableEntry[] = [
    { block: "책", romaji: "chaek", ipa: "/t͡ɕʰɛk̚/", hint: "ㅊ + ㅐ + ㄱ — stop on [k], no release" },
    { block: "국", romaji: "guk", ipa: "/kuk̚/", hint: "ㄱ + ㅜ + ㄱ — same letter, start and stop" },
    { block: "밥", romaji: "bap", ipa: "/pap̚/", hint: "ㅂ + ㅏ + ㅂ — lips close on [p], no puff" },
    { block: "집", romaji: "jip", ipa: "/t͡ɕip̚/", hint: "ㅈ + ㅣ + ㅂ — lips close on [p], no puff" },
  ];
  const ctx: KoRowContext = {
    allBlocks: BLOCKS,
    words: [
      { word: "책", meaningEn: "book", emoji: "📖" },
      { word: "국", meaningEn: "soup", emoji: "🍲" },
      { word: "밥", meaningEn: "rice / a meal", emoji: "🍚" },
      { word: "집", meaningEn: "house / home", emoji: "🏠" },
      { word: "한국", meaningEn: "Korea", emoji: "🇰🇷" },
      { word: "학생", meaningEn: "student", emoji: "🎓" },
    ],
    tileBankPool: ["책", "국", "밥", "집", "한", "학", "생", "가", "구", "바"],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-bt3-info-0",
      type: "info",
      title: "The stopped endings — ㄱ and ㅂ",
      body:
        "The other ending family doesn't hum — it STOPS. A final ㄱ is [k] and a final ㅂ is [p], but your mouth only moves INTO the shape and freezes there. Say English 'book' but never let the k out: that's 국.\n\nTheir louder cousins collapse into them at the bottom: ㅋ and ㄲ also end as [k] (부엌, 밖), ㅍ ends as [p] (앞). Recognize that when you see it; the plain letters carry almost all the words.",
      variant: "grammar",
    },
  ];
  for (const b of BLOCKS) {
    const word = ctx.words.find((w) => w.word === b.block)!;
    steps.push(
      symbolIntro(`ko-m2-bt3-intro-${b.romaji}`, b.block, b.romaji, b.ipa ?? "", b.hint ?? "", `${b.block} (${word.meaningEn})`),
      traceTwice(`ko-m2-bt3-trace-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
      recognition(ctx, `ko-m2-bt3-recog-${b.romaji}`, b.block, b.romaji, b.hint ?? ""),
    );
  }
  steps.push(
    wordImageMcq(ctx, "ko-m2-bt3-mcq-chaek", "책"),
    wordImageMcq(ctx, "ko-m2-bt3-mcq-bap", "밥"),
    // 한국 = bt-1's ㄴ final + this lesson's ㄱ final; 학생 = ㄱ final +
    // cv-1's ㅐ + bt-2's ㅇ final. Deliberate cross-arc builds: the two
    // words m3 opens with, assembled from all three batchim lessons.
    listeningBuild(ctx, "ko-m2-bt3-build-hanguk", "한국", "Korea"),
    listeningBuild(ctx, "ko-m2-bt3-build-haksaeng", "학생", "student"),
    listeningComp("ko-m2-bt3-lc-jip", "집", "house / home", ["a book", "soup", "rice"]),
    codaSoundMcq(
      "ko-m2-bt3-mcq-stop-k",
      "Which of these ends with the stopped [k] sound?",
      "책",
      ["밥", "밤", "물"],
      "책 ends in ㄱ — a stopped [k]. 밥 stops on [p], 밤 hums [m], 물 holds [l].",
    ),
    speaking("ko-m2-bt3-speak-bap", "밥", "rice / a meal"),
    speaking("ko-m2-bt3-speak-hanguk", "한국", "Korea"),
    {
      id: "ko-m2-bt3-info-end",
      type: "info",
      title: "한국 — you just read it",
      body:
        "Lesson one showed you 한국 (Korea) and promised you'd read it within the hour. Done — 한 [han] + 국 [guk], plus 책, 밥, 집, and 학생 (student), the word half of module 3 is built on. Six ending sounds down. The review is next, then the one strange family that's left.",
      variant: "win",
    },
  );
  return {
    id: "ko-m2-bt-3",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "받침 — the stopped endings ㄱ ㅂ",
    description: "Stops with no release. Read 책, 국, 밥, 집 — and 한국, 학생.",
    estimatedMinutes: 6,
    xpReward: 14,
    steps,
  };
}

function buildBatchimWrapLesson(): LessonContent {
  // Module tail: the "review after" the interleave doctrine prescribes for
  // the batchim family (all 7 groups mixed), plus the honest 연음 beats.
  // 연음 evidence (m3–m15 scan): liaison contexts are everywhere — every
  // X이에요, 있어요/없어요, 먹어요, 좋아요, 많이 — so the learner will hear
  // carried-over codas from m3 lesson 1 onward. That earns an explanation
  // + light drill HERE; it does not earn a multi-lesson drill arc (no
  // liaison-dependent GRADED distinction exists before m15).
  const ctx: KoRowContext = {
    allBlocks: [
      { block: "눈", romaji: "nun" },
      { block: "강", romaji: "gang" },
      { block: "밥", romaji: "bap" },
      { block: "곰", romaji: "gom" },
      { block: "물", romaji: "mul" },
      { block: "책", romaji: "chaek" },
    ],
    words: [],
    tileBankPool: [],
  };
  const steps: LessonStep[] = [
    {
      id: "ko-m2-btr-info-0",
      type: "info",
      title: "Seven endings — the complete set",
      body:
        "Every Korean syllable ends in a vowel or one of exactly seven sounds:\n\n  ㄱ [k] 책 · ㄴ [n] 눈 · ㄷ [t] 옷 · ㄹ [l] 물 · ㅁ [m] 곰 · ㅂ [p] 밥 · ㅇ [ng] 강\n\nThat's the whole system. Quick sweep first, then one last secret about how endings behave in real speech.",
      variant: "grammar",
    },
    recognition(ctx, "ko-m2-btr-recog-nun", "눈", "nun", "ends on a held 'n'"),
    recognition(ctx, "ko-m2-btr-recog-gang", "강", "gang", "ends on 'ng'"),
    recognition(ctx, "ko-m2-btr-recog-bap", "밥", "bap", "stops on [p]"),
    matchBlocksToRomaji(
      "ko-m2-btr-match",
      [
        { block: "밤", romaji: "bam" },
        { block: "밥", romaji: "bap" },
        { block: "말", romaji: "mal" },
        { block: "물", romaji: "mul" },
      ],
      "Two of these differ only in their ending — listen closely",
    ),
    {
      id: "ko-m2-btr-info-yeon-1",
      type: "info",
      title: "연음 — the ending slides over",
      body:
        "When a 받침 is followed by a syllable that starts with silent ㅇ, the final consonant SLIDES onto it. 물 + 이 is written 물이 but said [무리] — the ㄹ jumps across and turns back into its flap.\n\nKorean does this every single time. It's why real speech sounds smoother than the blocks look — the writing keeps the word's shape, the mouth takes the shortcut.",
      variant: "grammar",
    },
    {
      id: "ko-m2-btr-info-yeon-2",
      type: "info",
      title: "있어요 — hear it happen",
      body:
        "있어요 means 'there is / I have' — you'll hear it in half the sentences in this course. Spelled 있 + 어요; the double ㅆ slides over: [이써요].\n\nListen for the strong 'ss' starting the middle syllable — that's the 받침, relocated.",
      variant: "tip",
    },
    listeningComp("ko-m2-btr-lc-isseoyo", "있어요", "there is / I have", ["it's good", "there isn't", "a person"]),
    codaSoundMcq(
      "ko-m2-btr-mcq-isseoyo",
      "있어요 — which spelling shows how it SOUNDS?",
      "이써요",
      ["이서요", "읻어요", "이떠요"],
      "The ㅆ slides onto the next syllable at full strength: [이써요]. A single-s [이서요] is the classic learner shortcut — Koreans hear the difference.",
    ),
    {
      id: "ko-m2-btr-info-yeon-3",
      type: "info",
      title: "ㅎ is too weak to slide",
      body:
        "One exception: a final ㅎ before a vowel simply VANISHES. 좋아요 ('it's good') is said [조아요] — no h at all.\n\nAnd a preview so nothing ever ambushes you: a few words stack TWO letters in the 받침 slot — you say one of them. 없어요 ('there isn't') → [업써요], 많이 ('a lot') → [마니], 여덟 ('eight') → [여덜]. Read the survivor; the spelling keeps the history.",
      variant: "grammar",
    },
    codaSoundMcq(
      "ko-m2-btr-mcq-joayo",
      "좋아요 ('it's good') — which spelling shows how it SOUNDS?",
      "조아요",
      ["조하요", "조타요", "졸아요"],
      "Final ㅎ before a vowel disappears: [조아요]. Saying the h ([조하요]) is the giveaway of reading letter-by-letter.",
    ),
    listeningComp("ko-m2-btr-lc-eopseoyo", "없어요", "there isn't / I don't have", ["there is / I have", "it's good", "a lot"]),
    speaking("ko-m2-btr-speak-joayo", "좋아요", "it's good"),
    {
      id: "ko-m2-btr-info-end",
      type: "info",
      title: "Hangul: complete",
      body:
        "Every consonant, every vowel, all seven endings, and the way they flow together. Next module you meet 안녕하세요 — look at it now: 안 [an], 녕 [nyeong] — you can already read every ending in it. Nothing in Korean writing is a stranger anymore.",
      variant: "win",
    },
  ];
  return {
    id: "ko-m2-bt-review",
    moduleId: "m2",
    courseId: "mock-1",
    languageId: "ko",
    title: "받침 — review + 연음",
    description: "All seven endings mixed, and how they slide in real speech: 물이 → [무리].",
    estimatedMinutes: 6,
    xpReward: 15,
    steps,
  };
}

// ─── Public builder ─────────────────────────────────────────────────────

/**
 * Build every M2 lesson the curriculum exposes — 9 rows × 3 sub-lessons
 * (27 lessons) + 3 compound-vowel lessons + 3 받침 group lessons
 * (interleaved into the march as breaks: cv-1 after ㅊ, bt-1 after ㄲ,
 * cv-2 after ㅃ, bt-2 after ㅆ, bt-3 after cv-3) + Y-vowel lesson +
 * module review + 받침 [t]-group lesson + 받침 review/연음 wrap = 37.
 * Batchim teach lessons are never adjacent (interleave-don't-block-teach);
 * bt-review follows the family as its "review after". Keep this order in
 * sync with the m2 pathway in `mockCourse.ts`.
 */
export function buildAllKoreanM2Lessons(): LessonContent[] {
  const out: LessonContent[] = [];
  for (const row of KO_M2_ROWS) {
    validateRowVocab(row);
    out.push(...buildRowSubLessons(row, "m2"));
    if (row.id === "ch") out.push(buildCompoundVowelLesson1());
    if (row.id === "kk") out.push(buildBatchimNasalLesson());
    if (row.id === "pp") out.push(buildCompoundVowelLesson2());
    if (row.id === "ss") out.push(buildBatchimNgLLesson());
  }
  out.push(buildYVowelLesson());
  out.push(buildCompoundVowelLesson3());
  out.push(buildBatchimStopLesson());
  out.push(buildModuleReview());
  out.push(buildBatchimLesson());
  out.push(buildBatchimWrapLesson());
  return out;
}
