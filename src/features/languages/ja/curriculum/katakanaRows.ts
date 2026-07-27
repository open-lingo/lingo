/**
 * Katakana base-gojūon rollout — one row per module, M4–M12 (the ア row
 * lives in m3-v2.ts as the repurposed ja-m3-1-1/1-2 pair). Spec:
 * docs/katakana-rollout-romaji-fade-spec-2026-06-30.md (D2/D3).
 *
 * Authored in the spirit of the hand-written M1 hiragana rows (m1-ka.ts
 * and friends) via the script-parameterized `_consonantRowHelpers`
 * factories — NOT the bare AlphabetLessonPage trainer. Each lesson:
 *
 *   info → (symbolIntro + traceTwice + recognition) per glyph →
 *   anchor-loanword retrieval where the row unlocks readable words →
 *   symbol_to_sound / match sweep → win card
 *
 * Row schedule (base glyphs only — dakuten/handakuten/yōon are decoded
 * by the principles taught in hiragana M1/M2, never as lessons):
 *
 *   M4 カ (glyph-only)          M9  マ (readable-word review)
 *   M5 サ + ジュース            M10 ヤ (3 glyphs, loanword review)
 *   M6 タ + ッ + タクシー…      M11 ラ + カメラ/テレビ/ビール
 *   M7 ナ + ニュース/ノート…    M12 ワヲン + パン/ラーメン… (base complete)
 *   M8 ハ + コーヒー/バス…
 *
 * Word-step audio rule: `listening_*` steps only target words that
 * already have TTS clips (verified against the manifest 2026-07-01);
 * TTS-less anchors (コート, ノート, バス…) are taught via
 * word_image_mcq / speaking, which need no clip. Single-glyph audio
 * resolves through the katakana→hiragana twin fallback in getTtsUrl.
 *
 * Prior-row katakana review tails are appended centrally by
 * `kanaReviewTails.ts` (same post-pass as M1) — don't hand-author them
 * here, and keep `-rev-`/`-revtail-` out of step ids or the post-pass
 * will skip the lesson.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  type KanaEntry,
  type RowContext,
  symbolIntro,
  traceTwice,
  recognition,
  symbolToSound,
  wordImageMcq,
  listeningBuild,
  speaking,
  listeningComp,
  matchKanaToRomaji,
} from "./_consonantRowHelpers";

const COURSE = "mock-1";
const LANG = "ja";

// ─── Row schedule data ─────────────────────────────────────────────────
// Single source of truth for "which katakana exist as of module N" —
// consumed by the kanaReviewTails katakana extension and the rollout
// tests. Sound hints are word-for-word the hiragana twins' hints so the
// two scripts never drift apart in how a sound is described.

export type KatakanaGlyph = { symbol: string; romaji: string; hint: string };

export type KatakanaRowDef = {
  /** Row id, matching the hiragana row naming (a, ka, sa, …, wa). */
  rowId: string;
  /** Module that teaches this row (ア row = m3 via ja-m3-1-1/1-2). */
  moduleIndex: number;
  /** NEO schedule (ruling 2026-07-26): TWO rows per module across m7-m11,
   *  so the katakana ladder completes at m11 and m3-m6 stay katakana-free
   *  for the sentence engine. Kept SEPARATE from `moduleIndex` (which the
   *  un-rewritten old course still reads) so the two can run in parallel
   *  until the neo modules swap in. */
  neoModuleIndex?: number;
  /** In-course lesson id (M3's ア row spans ja-m3-1-1 + ja-m3-1-2). */
  lessonId: string;
  glyphs: KatakanaGlyph[];
};

export const KATAKANA_ROW_SCHEDULE: KatakanaRowDef[] = [
  {
    rowId: "a",
    moduleIndex: 3,
    neoModuleIndex: 7,
    lessonId: "ja-m3-1-1",
    glyphs: [
      { symbol: "ア", romaji: "a", hint: "like 'a' in 'father'" },
      { symbol: "イ", romaji: "i", hint: "like 'ee' in 'see'" },
      { symbol: "ウ", romaji: "u", hint: "like 'oo' in 'food'" },
      { symbol: "エ", romaji: "e", hint: "like 'e' in 'egg'" },
      { symbol: "オ", romaji: "o", hint: "like 'o' in 'more'" },
    ],
  },
  {
    rowId: "ka",
    moduleIndex: 4,
    neoModuleIndex: 7,
    lessonId: "ja-m4-kata",
    glyphs: [
      { symbol: "カ", romaji: "ka", hint: "like 'ka' in 'car'" },
      { symbol: "キ", romaji: "ki", hint: "like 'kee' in 'key'" },
      { symbol: "ク", romaji: "ku", hint: "like 'koo' in 'cuckoo'" },
      { symbol: "ケ", romaji: "ke", hint: "like 'ke' in 'kept'" },
      { symbol: "コ", romaji: "ko", hint: "like 'ko' in 'koala'" },
    ],
  },
  {
    rowId: "sa",
    moduleIndex: 5,
    neoModuleIndex: 8,
    lessonId: "ja-m5-kata",
    glyphs: [
      { symbol: "サ", romaji: "sa", hint: "like 'sa' in 'saw'" },
      { symbol: "シ", romaji: "shi", hint: "like 'she'" },
      { symbol: "ス", romaji: "su", hint: "like 'su' in 'super'" },
      { symbol: "セ", romaji: "se", hint: "like 'se' in 'set'" },
      { symbol: "ソ", romaji: "so", hint: "like 'so' in 'sort'" },
    ],
  },
  {
    rowId: "ta",
    moduleIndex: 6,
    neoModuleIndex: 8,
    lessonId: "ja-m6-kata",
    glyphs: [
      { symbol: "タ", romaji: "ta", hint: "like 'ta' in 'tan'" },
      { symbol: "チ", romaji: "chi", hint: "like 'chee' in 'cheese'" },
      { symbol: "ツ", romaji: "tsu", hint: "like 'ts' in 'cats' + u" },
      { symbol: "テ", romaji: "te", hint: "like 'te' in 'ten'" },
      { symbol: "ト", romaji: "to", hint: "like 'to' in 'tote'" },
    ],
  },
  {
    rowId: "na",
    moduleIndex: 7,
    neoModuleIndex: 9,
    lessonId: "ja-m7-kata",
    glyphs: [
      { symbol: "ナ", romaji: "na", hint: "like 'na' in 'nap'" },
      { symbol: "ニ", romaji: "ni", hint: "like 'nee' in 'knee'" },
      { symbol: "ヌ", romaji: "nu", hint: "like 'noo' in 'noodle'" },
      { symbol: "ネ", romaji: "ne", hint: "like 'ne' in 'net'" },
      { symbol: "ノ", romaji: "no", hint: "like 'no' in 'note'" },
    ],
  },
  {
    rowId: "ha",
    moduleIndex: 8,
    neoModuleIndex: 9,
    lessonId: "ja-m8-kata",
    glyphs: [
      { symbol: "ハ", romaji: "ha", hint: "like 'ha' in 'haha'" },
      { symbol: "ヒ", romaji: "hi", hint: "like 'hee' in 'heel'" },
      { symbol: "フ", romaji: "fu", hint: "soft 'f'/'h' — blow gently" },
      { symbol: "ヘ", romaji: "he", hint: "like 'he' in 'hem'" },
      { symbol: "ホ", romaji: "ho", hint: "like 'ho' in 'hope'" },
    ],
  },
  {
    rowId: "ma",
    moduleIndex: 9,
    neoModuleIndex: 10,
    lessonId: "ja-m9-kata",
    glyphs: [
      { symbol: "マ", romaji: "ma", hint: "like 'ma' in 'mama'" },
      { symbol: "ミ", romaji: "mi", hint: "like 'mee' in 'meet'" },
      { symbol: "ム", romaji: "mu", hint: "like 'moo' in 'moon'" },
      { symbol: "メ", romaji: "me", hint: "like 'me' in 'met'" },
      { symbol: "モ", romaji: "mo", hint: "like 'mo' in 'more'" },
    ],
  },
  {
    rowId: "ya",
    moduleIndex: 10,
    neoModuleIndex: 10,
    lessonId: "ja-m10-kata",
    glyphs: [
      { symbol: "ヤ", romaji: "ya", hint: "like 'ya' in 'yard'" },
      { symbol: "ユ", romaji: "yu", hint: "like 'you'" },
      { symbol: "ヨ", romaji: "yo", hint: "like 'yo' in 'yogurt'" },
    ],
  },
  {
    rowId: "ra",
    moduleIndex: 11,
    neoModuleIndex: 11,
    lessonId: "ja-m11-kata",
    glyphs: [
      { symbol: "ラ", romaji: "ra", hint: "tap the roof of your mouth — between 'r' and 'l'" },
      { symbol: "リ", romaji: "ri", hint: "tapped 'r' + ee" },
      { symbol: "ル", romaji: "ru", hint: "tapped 'r' + oo" },
      { symbol: "レ", romaji: "re", hint: "tapped 'r' + e" },
      { symbol: "ロ", romaji: "ro", hint: "tapped 'r' + o" },
    ],
  },
  {
    rowId: "wa",
    moduleIndex: 12,
    neoModuleIndex: 11,
    lessonId: "ja-m12-kata",
    glyphs: [
      { symbol: "ワ", romaji: "wa", hint: "like 'wa' in 'water'" },
      { symbol: "ヲ", romaji: "wo", hint: "sounds just like お — particle-only" },
      { symbol: "ン", romaji: "n", hint: "hum through your nose" },
    ],
  },
];

/** All base katakana taught STRICTLY BEFORE `moduleIndex` — the review
 *  pool + tile-decoy pool for that module's row lesson. */
/** NEO variant of {@link katakanaTaughtBefore} — reads `neoModuleIndex`.
 *  Use this for m*-neo authoring/provenance; the un-suffixed function
 *  stays pointed at the old course until it is fully replaced. */
export function katakanaTaughtBeforeNeo(moduleIndex: number): KatakanaGlyph[] {
  return KATAKANA_ROW_SCHEDULE.filter(
    (r) => r.neoModuleIndex !== undefined && r.neoModuleIndex < moduleIndex,
  ).flatMap((r) => r.glyphs);
}

export function katakanaTaughtBefore(moduleIndex: number): KatakanaGlyph[] {
  return KATAKANA_ROW_SCHEDULE.filter(
    (r) => r.moduleIndex < moduleIndex,
  ).flatMap((r) => r.glyphs);
}

function entriesOf(rowId: string): KanaEntry[] {
  const row = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === rowId);
  if (!row) throw new Error(`katakanaRows: unknown row ${rowId}`);
  return row.glyphs.map((g) => ({ symbol: g.symbol, romaji: g.romaji }));
}

function ctxFor(rowId: string, words: RowContext["words"]): RowContext {
  const row = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === rowId)!;
  return {
    scriptId: "katakana",
    allKana: entriesOf(rowId),
    words,
    tileBankPool: katakanaTaughtBefore(row.moduleIndex).map((g) => g.symbol),
  };
}

/** intro + trace + recognition — the per-glyph teaching beat every M1 row
 *  uses. `note` carries the shape mnemonic (the hand-authored part).
 *  Exported for the ア row, which lives in m3-v2.ts (repurposed
 *  ja-m3-1-1/1-2). */
export function glyphBlock(
  ctx: RowContext,
  idBase: string,
  g: KatakanaGlyph,
  example: string,
  note: string,
) {
  return [
    symbolIntro(
      `${idBase}-intro-${g.romaji}`,
      g.symbol,
      g.romaji,
      `/${g.romaji}/`,
      g.hint,
      example,
      note,
      "katakana",
    ),
    traceTwice(`${idBase}-trace-${g.romaji}`, g.symbol, g.romaji, g.hint, "katakana"),
    recognition(ctx, `${idBase}-recog-${g.romaji}`, g.symbol, g.romaji, g.hint),
  ];
}

/* ────────────────────────────────────────────────────────────────────────
 * M4 — カ row (glyph-only: no loanword is fully readable yet)
 * ──────────────────────────────────────────────────────────────────────── */

const KA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "ka")!.glyphs;
const kaCtx = ctxFor("ka", []);

export const KATA_M4_KA: LessonContent = {
  id: "ja-m4-kata",
  moduleId: "m4", courseId: COURSE, languageId: LANG,
  title: "Katakana — カ row",
  description: "カ キ ク ケ コ — the katakana k-sounds. Several are hiragana shapes you already know, squared off.",
  estimatedMinutes: 5, xpReward: 10,
  steps: [

    ...glyphBlock(kaCtx, "ja-m4kata", KA[0], "カメラ (camera)",
      "It's か without the little tick — hiragana and katakana twins."),
    ...glyphBlock(kaCtx, "ja-m4kata", KA[1], "ケーキ (cake)",
      "き minus the bottom curve. Same sound, sharper suit."),
    ...glyphBlock(kaCtx, "ja-m4kata", KA[2], "タクシー (taxi)",
      "A bird's beak pointing left."),
    ...glyphBlock(kaCtx, "ja-m4kata", KA[3], "ケーキ (cake)",
      "A lopsided K, conveniently for 'ke'."),
    ...glyphBlock(kaCtx, "ja-m4kata", KA[4], "コーヒー (coffee)",
      "Two corners of a box — you've been reading it in コーヒー since Module 3."),

    symbolToSound(kaCtx, "ja-m4kata-sts-ka", "カ", "ka", "like 'ka' in 'car'"),
    symbolToSound(kaCtx, "ja-m4kata-sts-ku", "ク", "ku", "like 'koo' in 'cuckoo'"),
    symbolToSound(kaCtx, "ja-m4kata-sts-ko", "コ", "ko", "like 'ko' in 'koala'"),

    matchKanaToRomaji("ja-m4kata-match", entriesOf("ka"),
      "Match the katakana to their sounds"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M5 — サ row + ジュース (first fully readable loanword)
 * ──────────────────────────────────────────────────────────────────────── */

const SA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "sa")!.glyphs;
const saCtx = ctxFor("sa", []);

export const KATA_M5_SA: LessonContent = {
  id: "ja-m5-kata",
  moduleId: "m5", courseId: COURSE, languageId: LANG,
  title: "Katakana — サ row",
  description: "サ シ ス セ ソ — and your first loanword you can read without romaji: ジュース (juice).",
  estimatedMinutes: 5, xpReward: 12,
  steps: [

    ...glyphBlock(saCtx, "ja-m5kata", SA[0], "サッカー (soccer)",
      "さ squared off — one extra stroke."),
    ...glyphBlock(saCtx, "ja-m5kata", SA[1], "ジュース (juice)",
      "Three strokes, and the long one sweeps UP from the bottom-left. Remember that — its twin ツ does the opposite."),
    ...glyphBlock(saCtx, "ja-m5kata", SA[2], "ジュース (juice)",
      "A slide seen from the side — 'suuu' down you go."),
    ...glyphBlock(saCtx, "ja-m5kata", SA[3], "セーター (sweater)",
      "Nearly identical to hiragana せ."),
    ...glyphBlock(saCtx, "ja-m5kata", SA[4], "ソース (sauce)",
      "One drop, one downward sweep. Its own twin (ン) arrives with the last row."),

    { id: "ja-m5kata-info-juice", type: "grammar_rule", title: "Decode: ジュース",
      rule: "You already know every piece of ジュース. ジ is シ + dakuten (shi→ji), small ュ glides it (ji→ju), and ー stretches it. Katakana reuses the exact hiragana rules.",
      examples: [
        { ja: "シ → ジ", romaji: "shi → ji", en: "dakuten voices it" },
        { ja: "ジュース", romaji: "jūsu", en: "juice" },
      ] },
    listeningComp("ja-m5kata-lc-juice", "ジュース", "jūsu", "juice",
      ["coffee", "tea", "water"]),
    listeningBuild(saCtx, "ja-m5kata-build-juice", "ジュース", "juice"),
    speaking("ja-m5kata-speak-juice", "ジュース", "juice"),

    matchKanaToRomaji("ja-m5kata-match", entriesOf("sa"),
      "Match the katakana to their sounds"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M6 — タ row + small ッ + タクシー comes full circle
 * ──────────────────────────────────────────────────────────────────────── */

const TA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "ta")!.glyphs;
const taCtx = ctxFor("ta", [
  { kana: "タクシー", meaningEn: "taxi", emoji: "🚕" },
  { kana: "コート", meaningEn: "coat", emoji: "🧥" },
  { kana: "ドア", meaningEn: "door", emoji: "🚪" },
  { kana: "ジュース", meaningEn: "juice", emoji: "🧃" },
]);

export const KATA_M6_TA: LessonContent = {
  id: "ja-m6-kata",
  moduleId: "m6", courseId: COURSE, languageId: LANG,
  title: "Katakana — タ row",
  description: "タ チ ツ テ ト + the small ッ — and タクシー becomes fully readable, three modules after you first ordered one.",
  estimatedMinutes: 6, xpReward: 12,
  steps: [

    ...glyphBlock(taCtx, "ja-m6kata", TA[0], "タクシー (taxi)",
      "ク with one extra stroke tucked inside."),
    ...glyphBlock(taCtx, "ja-m6kata", TA[1], "チーズ (cheese)",
      "Like a 7 with a crossbar — or 千, the kanji for thousand."),
    ...glyphBlock(taCtx, "ja-m6kata", TA[2], "シャツ (shirt)",
      "シ's twin, at last. シ's strokes lie DOWN and flick up; ツ's hang from the TOP and sweep down. Shi smiles sideways, tsu frowns from above."),
    ...glyphBlock(taCtx, "ja-m6kata", TA[3], "テスト (test)",
      "て straightened out — same skeleton, same sound."),
    ...glyphBlock(taCtx, "ja-m6kata", TA[4], "コート (coat)",
      "A trunk with one branch. Two strokes, done."),

    { id: "ja-m6kata-info-sokuon", type: "grammar_rule", title: "Small ッ — the silent beat",
      rule: "Katakana's small ッ works exactly like hiragana's small っ: a one-beat pause that doubles the next consonant. Same rule you know, new outfit.",
      examples: [
        { ja: "ベッド", romaji: "beddo", en: "bed (doubled d)" },
        { ja: "カップ", romaji: "kappu", en: "cup (doubled p)" },
      ] },

    wordImageMcq(taCtx, "ja-m6kata-mcq-taxi", "タクシー"),
    listeningBuild(taCtx, "ja-m6kata-build-taxi", "タクシー", "taxi"),
    wordImageMcq(taCtx, "ja-m6kata-mcq-coat", "コート"),
    speaking("ja-m6kata-speak-coat", "コート", "coat"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M7 — ナ row + ニュース / ノート / ネクタイ
 * ──────────────────────────────────────────────────────────────────────── */

const NA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "na")!.glyphs;
const naCtx = ctxFor("na", [
  { kana: "ニュース", meaningEn: "news", emoji: "📰" },
  { kana: "ノート", meaningEn: "notebook", emoji: "📓" },
  { kana: "ネクタイ", meaningEn: "necktie", emoji: "👔" },
  { kana: "タクシー", meaningEn: "taxi", emoji: "🚕" },
]);

export const KATA_M7_NA: LessonContent = {
  id: "ja-m7-kata",
  moduleId: "m7", courseId: COURSE, languageId: LANG,
  title: "Katakana — ナ row",
  description: "ナ ニ ヌ ネ ノ — news, notebooks, and neckties become readable.",
  estimatedMinutes: 5, xpReward: 12,
  steps: [

    ...glyphBlock(naCtx, "ja-m7kata", NA[0], "ナイフ (knife)",
      "A plus sign with a long tail."),
    ...glyphBlock(naCtx, "ja-m7kata", NA[1], "ニュース (news)",
      "Literally the kanji 二 — two strokes, and 'ni' means two."),
    ...glyphBlock(naCtx, "ja-m7kata", NA[2], "ヌードル (noodle)",
      "ス with a cross-stroke through the leg."),
    ...glyphBlock(naCtx, "ja-m7kata", NA[3], "ネクタイ (necktie)",
      "A cross with a ribbon flowing off it."),
    ...glyphBlock(naCtx, "ja-m7kata", NA[4], "ノート (notebook)",
      "One stroke. That's it. 'No' — the easiest kana you'll ever learn."),

    wordImageMcq(naCtx, "ja-m7kata-mcq-news", "ニュース"),
    listeningBuild(naCtx, "ja-m7kata-build-news", "ニュース", "news"),
    wordImageMcq(naCtx, "ja-m7kata-mcq-note", "ノート"),
    speaking("ja-m7kata-speak-necktie", "ネクタイ", "necktie"),

    matchKanaToRomaji("ja-m7kata-match", entriesOf("na"),
      "Match the katakana to their sounds"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M8 — ハ row: コーヒー comes full circle + the biggest unlock wave
 * ──────────────────────────────────────────────────────────────────────── */

const HA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "ha")!.glyphs;
const haCtx = ctxFor("ha", [
  { kana: "コーヒー", meaningEn: "coffee", emoji: "☕" },
  { kana: "バス", meaningEn: "bus", emoji: "🚌" },
  { kana: "ナイフ", meaningEn: "knife", emoji: "🔪" },
  { kana: "ノート", meaningEn: "notebook", emoji: "📓" },
]);

export const KATA_M8_HA: LessonContent = {
  id: "ja-m8-kata",
  moduleId: "m8", courseId: COURSE, languageId: LANG,
  title: "Katakana — ハ row",
  description: "ハ ヒ フ ヘ ホ — and コーヒー, the very first katakana you ever saw, is finally all yours.",
  estimatedMinutes: 6, xpReward: 12,
  steps: [

    ...glyphBlock(haCtx, "ja-m8kata", HA[0], "バス (bus)",
      "Two strokes leaning apart — like the kanji 八 (eight)."),
    ...glyphBlock(haCtx, "ja-m8kata", HA[1], "コーヒー (coffee)",
      "Two strokes, one propping the other up."),
    ...glyphBlock(haCtx, "ja-m8kata", HA[2], "ナイフ (knife)",
      "The top-left corner of a box."),
    ...glyphBlock(haCtx, "ja-m8kata", HA[3], "ヘリコプター (helicopter)",
      "Identical to hiragana へ. One kana, two scripts, zero extra work."),
    ...glyphBlock(haCtx, "ja-m8kata", HA[4], "ホテル (hotel)",
      "A tree with a spark off each side."),

    wordImageMcq(haCtx, "ja-m8kata-mcq-coffee", "コーヒー"),
    listeningBuild(haCtx, "ja-m8kata-build-coffee", "コーヒー", "coffee"),
    listeningComp("ja-m8kata-lc-knife", "ナイフ", "naifu", "knife",
      ["fork", "cup", "notebook"]),
    wordImageMcq(haCtx, "ja-m8kata-mcq-bus", "バス"),
    speaking("ja-m8kata-speak-bus", "バス", "bus"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M9 — マ row (readable-word review keeps earlier unlocks warm)
 * ──────────────────────────────────────────────────────────────────────── */

const MA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "ma")!.glyphs;
const maCtx = ctxFor("ma", [
  { kana: "ジュース", meaningEn: "juice", emoji: "🧃" },
  { kana: "コーヒー", meaningEn: "coffee", emoji: "☕" },
  { kana: "バス", meaningEn: "bus", emoji: "🚌" },
  { kana: "ニュース", meaningEn: "news", emoji: "📰" },
]);

export const KATA_M9_MA: LessonContent = {
  id: "ja-m9-kata",
  moduleId: "m9", courseId: COURSE, languageId: LANG,
  title: "Katakana — マ row",
  description: "マ ミ ム メ モ — plus retrieval on the loanwords you can already read.",
  estimatedMinutes: 5, xpReward: 12,
  steps: [

    ...glyphBlock(maCtx, "ja-m9kata", MA[0], "マッチ (match)",
      "A flag folded sharply down."),
    ...glyphBlock(maCtx, "ja-m9kata", MA[1], "ミルク (milk)",
      "Three short strokes — 'mi', think three."),
    ...glyphBlock(maCtx, "ja-m9kata", MA[2], "ゲーム (game)",
      "A closed tent flap — mouth shut, 'mmm'."),
    ...glyphBlock(maCtx, "ja-m9kata", MA[3], "メニュー (menu)",
      "An X with one leg stretched long. ナ minus nothing — careful, they rhyme visually."),
    ...glyphBlock(maCtx, "ja-m9kata", MA[4], "メモ (memo)",
      "も without the hook — twins again."),

    symbolToSound(maCtx, "ja-m9kata-sts-mu", "ム", "mu", "like 'moo' in 'moon'"),
    symbolToSound(maCtx, "ja-m9kata-sts-me", "メ", "me", "like 'me' in 'met'"),

    wordImageMcq(maCtx, "ja-m9kata-mcq-juice", "ジュース"),
    listeningBuild(maCtx, "ja-m9kata-build-news", "ニュース", "news"),

    matchKanaToRomaji("ja-m9kata-match", entriesOf("ma"),
      "Match the katakana to their sounds"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M10 — ヤ row (3 glyphs; heavier loanword retrieval fills the beat)
 * ──────────────────────────────────────────────────────────────────────── */

const YA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "ya")!.glyphs;
const yaCtx = ctxFor("ya", [
  { kana: "タクシー", meaningEn: "taxi", emoji: "🚕" },
  { kana: "コーヒー", meaningEn: "coffee", emoji: "☕" },
  { kana: "ノート", meaningEn: "notebook", emoji: "📓" },
  { kana: "バス", meaningEn: "bus", emoji: "🚌" },
]);

export const KATA_M10_YA: LessonContent = {
  id: "ja-m10-kata",
  moduleId: "m10", courseId: COURSE, languageId: LANG,
  title: "Katakana — ヤ row",
  description: "ヤ ユ ヨ — just three glyphs, so the rest is loanword retrieval.",
  estimatedMinutes: 5, xpReward: 10,
  steps: [

    ...glyphBlock(yaCtx, "ja-m10kata", YA[0], "タイヤ (tire)",
      "や minus one stroke — twins."),
    ...glyphBlock(yaCtx, "ja-m10kata", YA[1], "ユーモア (humor)",
      "A boxy U tipped on its side."),
    ...glyphBlock(yaCtx, "ja-m10kata", YA[2], "ヨーグルト (yogurt)",
      "A backwards E — three prongs for 'yo'."),

    symbolToSound(yaCtx, "ja-m10kata-sts-ya", "ヤ", "ya", "like 'ya' in 'yard'"),
    symbolToSound(yaCtx, "ja-m10kata-sts-yu", "ユ", "yu", "like 'you'"),
    symbolToSound(yaCtx, "ja-m10kata-sts-yo", "ヨ", "yo", "like 'yo' in 'yogurt'"),

    wordImageMcq(yaCtx, "ja-m10kata-mcq-taxi", "タクシー"),
    listeningBuild(yaCtx, "ja-m10kata-build-coffee", "コーヒー", "coffee"),
    wordImageMcq(yaCtx, "ja-m10kata-mcq-note", "ノート"),
    speaking("ja-m10kata-speak-juice", "ジュース", "juice"),

    matchKanaToRomaji("ja-m10kata-match", entriesOf("ya"),
      "Match the katakana to their sounds"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M11 — ラ row: the biggest word gate (hotels, cameras, TV, beer…)
 * ──────────────────────────────────────────────────────────────────────── */

const RA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "ra")!.glyphs;
const raCtx = ctxFor("ra", [
  { kana: "カメラ", meaningEn: "camera", emoji: "📷" },
  { kana: "テレビ", meaningEn: "TV", emoji: "📺" },
  { kana: "ビール", meaningEn: "beer", emoji: "🍺" },
  { kana: "トイレ", meaningEn: "toilet", emoji: "🚽" },
  { kana: "ホテル", meaningEn: "hotel", emoji: "🏨" },
]);

export const KATA_M11_RA: LessonContent = {
  id: "ja-m11-kata",
  moduleId: "m11", courseId: COURSE, languageId: LANG,
  title: "Katakana — ラ row",
  description: "ラ リ ル レ ロ — the row holding back two dozen words: hotel, camera, TV, beer, toilet…",
  estimatedMinutes: 6, xpReward: 12,
  steps: [

    ...glyphBlock(raCtx, "ja-m11kata", RA[0], "カメラ (camera)",
      "フ with a hat on."),
    ...glyphBlock(raCtx, "ja-m11kata", RA[1], "リットル (liter)",
      "Nearly identical to hiragana り — two vertical strokes."),
    ...glyphBlock(raCtx, "ja-m11kata", RA[2], "ホテル (hotel)",
      "A river forking at the bottom."),
    ...glyphBlock(raCtx, "ja-m11kata", RA[3], "トイレ (toilet)",
      "A single check-mark stroke."),
    ...glyphBlock(raCtx, "ja-m11kata", RA[4], "ロビー (lobby)",
      "A plain box — 'ro'. (コ is an OPEN box — watch the left edge.)"),

    wordImageMcq(raCtx, "ja-m11kata-mcq-camera", "カメラ"),
    listeningBuild(raCtx, "ja-m11kata-build-camera", "カメラ", "camera"),
    wordImageMcq(raCtx, "ja-m11kata-mcq-tv", "テレビ"),
    listeningComp("ja-m11kata-lc-beer", "ビール", "bīru", "beer",
      ["juice", "coffee", "water"]),
    speaking("ja-m11kata-speak-hotel", "ホテル", "hotel"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * M12 — ワ ヲ ン: base gojūon complete
 * ──────────────────────────────────────────────────────────────────────── */

const WA = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === "wa")!.glyphs;
const waCtx = ctxFor("wa", [
  { kana: "パン", meaningEn: "bread", emoji: "🍞" },
  { kana: "ペン", meaningEn: "pen", emoji: "🖊️" },
  { kana: "ラーメン", meaningEn: "ramen", emoji: "🍜" },
  { kana: "コンビニ", meaningEn: "convenience store", emoji: "🏪" },
]);

export const KATA_M12_WA: LessonContent = {
  id: "ja-m12-kata",
  moduleId: "m12", courseId: COURSE, languageId: LANG,
  title: "Katakana — ワ ヲ ン",
  description: "The last three. ン unlocks パン, ラーメン, コンビニ — then the base set is complete.",
  estimatedMinutes: 6, xpReward: 15,
  steps: [

    ...glyphBlock(waCtx, "ja-m12kata", WA[0], "ワイン (wine)",
      "ウ without its top stroke — mind the twins: ワ is wider."),
    ...glyphBlock(waCtx, "ja-m12kata", WA[1], "ヲ (particle only)",
      "You will almost never see this one — loanwords don't use it, and the particle stays hiragana を. Recognize it, tip your hat, move on."),
    ...glyphBlock(waCtx, "ja-m12kata", WA[2], "ラーメン (ramen)",
      "ソ's twin, mirrored: ソ's flick sweeps DOWN from the top; ン's sweeps UP from the bottom. Last twin pair — you've beaten them all."),

    { id: "ja-m12kata-info-pa", type: "grammar_rule", title: "Decode: パン",
      rule: "パ is ハ plus the small circle — the p-mark from hiragana. So パン = pa + n. Every dakuten, handakuten, and glide from hiragana works identically in katakana.",
      examples: [
        { ja: "ハ → パ", romaji: "ha → pa", en: "handakuten makes p" },
        { ja: "パン", romaji: "pan", en: "bread" },
      ] },

    wordImageMcq(waCtx, "ja-m12kata-mcq-bread", "パン"),
    listeningBuild(waCtx, "ja-m12kata-build-bread", "パン", "bread"),
    wordImageMcq(waCtx, "ja-m12kata-mcq-pen", "ペン"),
    listeningBuild(waCtx, "ja-m12kata-build-ramen", "ラーメン", "ramen"),
    listeningComp("ja-m12kata-lc-konbini", "コンビニ", "konbini", "convenience store",
      ["restaurant", "hotel", "department store"]),
    speaking("ja-m12kata-speak-ramen", "ラーメン", "ramen"),

    matchKanaToRomaji("ja-m12kata-match", entriesOf("wa"),
      "Match the katakana to their sounds"),

  ],
};

export const ALL_KATAKANA_ROW_LESSONS: LessonContent[] = [
  KATA_M4_KA,
  KATA_M5_SA,
  KATA_M6_TA,
  KATA_M7_NA,
  KATA_M8_HA,
  KATA_M9_MA,
  KATA_M10_YA,
  KATA_M11_RA,
  KATA_M12_WA,
];

/* ────────────────────────────────────────────────────────────────────────
 * NEO row lessons (ruling 2026-07-26)
 *
 * The hand-authored KATA_M4_KA…KATA_M12_WA lessons above belong to the
 * OLD course and keep their `ja-m<N>-kata` ids so that path keeps working
 * while the rewrite runs in parallel. The neo course schedules TWO rows per
 * module across m7-m11 (`neoModuleIndex`), so it needs its own lesson
 * objects with neo ids and the right `moduleId`.
 *
 * This factory builds them from the schedule's own glyph data — same step
 * shape as the hand-authored rows (intro → trace → recognise per glyph,
 * then a sound sweep and a match grid), minus the per-glyph mnemonic
 * flavour, which stays with the old lessons until each row is re-authored.
 * ──────────────────────────────────────────────────────────────────────── */

/** Build the neo lesson for one katakana row. */
export function neoKatakanaRowLesson(rowId: string): LessonContent {
  const def = KATAKANA_ROW_SCHEDULE.find((r) => r.rowId === rowId);
  if (!def) throw new Error(`neoKatakanaRowLesson: unknown row ${rowId}`);
  if (def.neoModuleIndex === undefined)
    throw new Error(`neoKatakanaRowLesson: row ${rowId} has no neoModuleIndex`);
  const mod = `m${def.neoModuleIndex}`;
  const idBase = `ja-${mod}-neo-kata-${rowId}`;
  const ctx = ctxFor(rowId, []);
  const label = def.glyphs.map((g) => g.symbol).join(" ");
  return {
    id: idBase,
    moduleId: mod,
    courseId: COURSE,
    languageId: LANG,
    title: `Katakana — ${def.glyphs[0].symbol} row`,
    description: `${label} — the katakana ${def.glyphs[0].romaji}-row. Same sounds you already read in hiragana, in their squared-off suit.`,
    estimatedMinutes: 5,
    xpReward: 10,
    steps: [
      ...def.glyphs.flatMap((g) => glyphBlock(ctx, idBase, g, "", "")),
      ...def.glyphs
        .slice(0, 3)
        .map((g) =>
          symbolToSound(ctx, `${idBase}-sts-${g.romaji}`, g.symbol, g.romaji, g.hint),
        ),
      matchKanaToRomaji(`${idBase}-match`, entriesOf(rowId),
        "Match the katakana to their sounds"),
    ],
  };
}

/** Neo row lessons keyed by rowId, for the module files to splice in. */
export const NEO_KATAKANA_ROW_LESSONS: Record<string, LessonContent> =
  Object.fromEntries(
    KATAKANA_ROW_SCHEDULE.filter((r) => r.neoModuleIndex !== undefined).map(
      (r) => [r.rowId, neoKatakanaRowLesson(r.rowId)] as const,
    ),
  );
