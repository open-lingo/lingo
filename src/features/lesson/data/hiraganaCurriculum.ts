/**
 * Hiragana curriculum catalog — declarative source of truth for the
 * row-by-row hiragana lesson set. Pairs with `lessonBuilder.ts` which turns
 * each `RowDef` into a fully-shaped `LessonContent`.
 *
 * Curation rules:
 *   - Anchor words prefer kana the learner has already met (this row +
 *     previous rows). When a "future" kana sneaks in, the AnnotatedJa
 *     renderer paints romaji helpers above it until the learner drills
 *     that kana later — by design.
 *   - 4 recognition options per kana (matches the 2×2 grid pattern).
 *   - Distractors are drawn first from in-row kana, then from a-row, then
 *     from the closest previously-introduced row. Visually-similar pairs
 *     get priority (あ/お, さ/き, ぬ/め, etc.).
 *   - Audio-pick word is the lesson's "phoneme-isolation" drill: hear a
 *     word, pick the constituent kana from sound only.
 *   - Build answer is the lesson's "production via tiles" drill: assemble
 *     the word from a tile bank including a few decoys.
 */

export type KanaIntro = {
  kana: string;
  romaji: string;
  /** Short pronunciation cue, e.g. "like 'ka' in 'cabin'". */
  hint: string;
  /** Optional one-line note (mouth shape, contrast, exception). */
  note?: string;
};

export type AnchorWord = {
  kana: string;
  romaji: string;
  meaning: string;
};

/**
 * Audio-only drill: learner hears `word`, picks the kana at `pickIndex`
 * (0-based char index into `word`) from a set of 4 options.
 */
export type AudioPick = {
  word: string;
  pickIndex: number;
  /** Three distractors (4 options total once `word[pickIndex]` is added). */
  distractors: [string, string, string];
};

/** Production via tile assembly. */
export type BuildAnswer = {
  meaning: string;
  answer: string;
  /** Extra decoy tiles mixed with `answer` chars when building the bank. */
  decoys: string[];
};

/**
 * Sentence-example slide for orphan kana that lack a clean early-N5 anchor
 * word. Emitted as an InfoStep near the end of the lesson (just before the
 * wrap-up). One slide per entry.
 */
export type SentenceExample = {
  /** The orphan kana this slide demonstrates. */
  kana: string;
  /** Example phrase containing the kana (kana text). */
  sentence: string;
  /** Romaji reading of the sentence. */
  reading: string;
  /** English gloss / explanation. */
  meaning: string;
};

/**
 * Multi-tile sentence-assembly drill sprinkled mid-lesson once the learner
 * has enough kana to form a short utterance. Emitted as a
 * `build_sentence` step with word-granularity tiles.
 */
export type SentencePractice = {
  /** English prompt shown to the learner. */
  prompt: string;
  /** Target JA sentence with spaces between tile boundaries. */
  target: string;
  /** Correct tile order (matches target tokenization). */
  correctOrder: string[];
  /** Decoy tiles mixed into the bank (same word-class as target tiles). */
  decoys: string[];
};

/**
 * A single sub-lesson within a row. When `RowDef.subLessons` is present,
 * the lesson builder emits one `LessonContent` per entry (plus an
 * auto-generated row-test if `isTest` is not already set somewhere).
 *
 * Stable lesson id = `ja-m1-${row.id}-${suffix}` so progress tracking
 * survives reorders inside a row.
 */
export type SubLessonDef = {
  /** Stable id suffix: "1" | "2" | "3" | "test". */
  suffix: string;
  /** Short label shown beneath the pathway node. */
  label: string;
  /** Kana introduced in THIS sub-lesson (empty for review/test). */
  introduces: KanaIntro[];
  /** Anchor words exposed in this sub-lesson (subset of row.anchorWords). */
  anchorWords: AnchorWord[];
  /** Build / production tile bank, if this sub-lesson includes a build step. */
  build?: BuildAnswer;
  /** Sentence-example slides scoped to this sub-lesson, if any. */
  sentenceExamples?: SentenceExample[];
  /** Multi-tile sentence-practice drills scoped to this sub-lesson, if any. */
  sentencePractice?: SentencePractice[];
  /** When true, this sub-lesson is the row-test; emits a RowTestStep flow. */
  isTest?: boolean;
};

export type RowDef = {
  /** Stable id used for the lesson id (`ja-m1-lN-<id>`). */
  id: string;
  /** Lesson title (`Ka-row: かきくけこ`). */
  title: string;
  /** One sentence shown on the first info step. */
  intro: string;
  /** Kana introduced in this lesson, in teaching order. */
  introduces: KanaIntro[];
  /** Anchor words taught after the kana drills. */
  anchorWords: AnchorWord[];
  audioPick: AudioPick;
  build: BuildAnswer;
  /**
   * Optional sentence-example slides for orphan kana that don't have a clean
   * anchor word. Emitted as InfoSteps near the end of the lesson.
   */
  sentenceExamples?: SentenceExample[];
  /**
   * Optional multi-tile sentence-assembly drills inserted mid-lesson after
   * the per-kana intro+teach cycle and before the match step.
   */
  sentencePractice?: SentencePractice[];
  /**
   * When present, the row is emitted as a cluster of sub-lessons (each its
   * own pathway node) rather than the single legacy row-lesson. Per the
   * alphabet-streamline spec, all production rows should populate this.
   * The lesson builder auto-appends a row-test sub-lesson when no entry
   * sets `isTest: true`.
   */
  subLessons?: SubLessonDef[];
  /**
   * Row ids that must be fully completed (every sub-lesson) before any
   * lesson in this row unlocks. Used by `isLessonLocked` to enforce the
   * ya-row → yōon prerequisite (small ゃゅょ requires the full ya-row).
   * Independent of the linear within-module gate — even if the module is
   * unlocked, a row with unmet prereqs stays locked.
   */
  prerequisites?: string[];
};

// Visually-similar kana for distractor selection. The pairs are
// pedagogy-driven (commonly confused in textbooks + learner forums).
export const CONFUSABLES: Record<string, string[]> = {
  あ: ["お", "め", "ぬ"],
  い: ["り", "こ"],
  う: ["つ", "ら", "つ"],
  え: ["ん", "ス"],
  お: ["あ", "む"],
  か: ["や", "が"],
  き: ["さ", "ち"],
  く: ["へ", "し"],
  け: ["は", "に"],
  こ: ["い"],
  さ: ["き", "ち"],
  し: ["も", "つ", "く"],
  す: ["む"],
  せ: ["ぜ"],
  そ: ["ろ", "ん"],
  た: ["な", "に"],
  ち: ["さ", "き"],
  つ: ["う", "し"],
  て: ["で"],
  と: ["ど"],
  な: ["た"],
  に: ["た", "こ"],
  ぬ: ["め", "あ"],
  ね: ["れ", "わ"],
  の: ["め"],
  は: ["ほ", "ぱ"],
  ひ: ["び", "ぴ"],
  ふ: ["ぶ", "ぷ"],
  へ: ["く"],
  ほ: ["は", "ま"],
  ま: ["も", "ほ"],
  み: ["ゆ", "む"],
  む: ["す", "み"],
  め: ["ぬ", "の"],
  も: ["し", "ま"],
  や: ["か"],
  ゆ: ["み"],
  よ: ["は"],
  ら: ["う", "ろ"],
  り: ["い"],
  る: ["ろ", "ろ"],
  れ: ["ね", "わ"],
  ろ: ["る", "ら"],
  わ: ["れ", "ね"],
  を: ["お"],
  ん: ["そ", "リ"],
};

export const HIRAGANA_ROWS: RowDef[] = [
  // a-row is special — already hand-authored in mock-ja-m1-l1.ts.
  {
    id: "ka",
    title: "Ka-row: かきくけこ",
    intro:
      "The k-sounds. Each kana adds a 'k-' to a vowel you already know: ka, ki, ku, ke, ko. Hard consonant, same five vowels.",
    introduces: [
      { kana: "か", romaji: "ka", hint: "like 'ka' in 'car'" },
      { kana: "き", romaji: "ki", hint: "like 'kee' in 'key'" },
      { kana: "く", romaji: "ku", hint: "like 'koo' in 'cuckoo'" },
      { kana: "け", romaji: "ke", hint: "like 'ke' in 'kept'" },
      { kana: "こ", romaji: "ko", hint: "like 'ko' in 'koala'" },
    ],
    anchorWords: [
      { kana: "かい", romaji: "kai", meaning: "shell" },
      { kana: "いけ", romaji: "ike", meaning: "pond" },
      { kana: "かお", romaji: "kao", meaning: "face" },
      { kana: "こえ", romaji: "koe", meaning: "voice" },
      { kana: "えき", romaji: "eki", meaning: "station" },
    ],
    audioPick: { word: "かお", pickIndex: 0, distractors: ["き", "く", "さ"] },
    build: { meaning: "face", answer: "かお", decoys: ["き", "い", "う"] },
    // 2+2+1+test pattern (refactored 2026-05-16 from the older 5+2+test
    // layout for consistency with every other consonant row). Hand-
    // authored mock-ja-m1-ka.ts overrides the auto-built sub-lessons;
    // the row-test is auto-built.
    subLessons: [
      {
        suffix: "1",
        label: "Intro 1",
        introduces: [
          { kana: "か", romaji: "ka", hint: "like 'ka' in 'car'" },
          { kana: "き", romaji: "ki", hint: "like 'kee' in 'key'" },
        ],
        anchorWords: [
          { kana: "かい", romaji: "kai", meaning: "shell" },
        ],
      },
      {
        suffix: "2",
        label: "Intro 2",
        introduces: [
          { kana: "く", romaji: "ku", hint: "like 'koo' in 'cuckoo'" },
          { kana: "け", romaji: "ke", hint: "like 'ke' in 'kept'" },
        ],
        anchorWords: [
          { kana: "いけ", romaji: "ike", meaning: "pond" },
        ],
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [
          { kana: "こ", romaji: "ko", hint: "like 'ko' in 'koala'" },
        ],
        anchorWords: [
          { kana: "こえ", romaji: "koe", meaning: "voice" },
          // Surface the two anchor words that don't get a dedicated
          // build sub-lesson so the row-test queue + recap can still
          // exercise them.
          { kana: "かお", romaji: "kao", meaning: "face" },
          { kana: "えき", romaji: "eki", meaning: "station" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "かい", romaji: "kai", meaning: "shell" },
          { kana: "いけ", romaji: "ike", meaning: "pond" },
          { kana: "かお", romaji: "kao", meaning: "face" },
          { kana: "こえ", romaji: "koe", meaning: "voice" },
          { kana: "えき", romaji: "eki", meaning: "station" },
        ],
        isTest: true,
      },
    ],
  },
  {
    id: "sa",
    title: "Sa-row: さしすせそ",
    intro:
      "The s-sounds. One quirk: し is 'shi' (not 'si'). Otherwise sa, su, se, so follow the pattern.",
    introduces: [
      { kana: "さ", romaji: "sa", hint: "like 'sa' in 'salsa'" },
      {
        kana: "し",
        romaji: "shi",
        hint: "like 'she' in 'sheet'",
        note: "Pronounced 'shi', not 'si'.",
      },
      { kana: "す", romaji: "su", hint: "like 'sue' (slightly clipped)" },
      { kana: "せ", romaji: "se", hint: "like 'se' in 'sell'" },
      { kana: "そ", romaji: "so", hint: "like 'so' in 'so'" },
    ],
    anchorWords: [
      { kana: "あさ", romaji: "asa",   meaning: "morning" },
      { kana: "すし", romaji: "sushi", meaning: "sushi" },
      { kana: "そら", romaji: "sora",  meaning: "sky" },
    ],
    audioPick: { word: "すし", pickIndex: 0, distractors: ["し", "つ", "む"] },
    build: { meaning: "sushi", answer: "すし", decoys: ["さ", "む", "つ"] },
    // Adult-traveller anchor: introduce a real survival phrase using the
    // newly-met さ + previously-met vowels. ま/せ/ん arrive in later rows so
    // AnnotatedJa renders romaji helpers above them — by design (see file
    // header curation rules). Retiree audit P0.
    sentenceExamples: [
      {
        kana: "さ",
        sentence: "すみません",
        reading: "sumimasen",
        meaning: "\"Excuse me / sorry\" — the single most useful Japanese phrase for a traveller.",
      },
    ],
    // 2+2+1+test pattern (2026-05-16). Hand-authored mock-ja-m1-sa.ts
    // overrides the auto-built sub-lessons; the row-test is auto-built.
    subLessons: [
      {
        suffix: "1",
        label: "Intro 1",
        introduces: [
          { kana: "さ", romaji: "sa", hint: "like 'sa' in 'salsa'" },
          { kana: "し", romaji: "shi", hint: "like 'she' in 'sheet'", note: "'shi', not 'si'." },
        ],
        anchorWords: [
          { kana: "あさ", romaji: "asa", meaning: "morning" },
        ],
      },
      {
        suffix: "2",
        label: "Intro 2",
        introduces: [
          { kana: "す", romaji: "su", hint: "like 'sue' (slightly clipped)" },
          { kana: "せ", romaji: "se", hint: "like 'se' in 'sell'" },
        ],
        anchorWords: [
          { kana: "すし", romaji: "sushi", meaning: "sushi" },
        ],
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [
          { kana: "そ", romaji: "so", hint: "like 'so' in 'sole'" },
        ],
        anchorWords: [
          { kana: "そら", romaji: "sora", meaning: "sky" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "あさ", romaji: "asa",   meaning: "morning" },
          { kana: "すし", romaji: "sushi", meaning: "sushi" },
          { kana: "そら", romaji: "sora",  meaning: "sky" },
        ],
        isTest: true,
      },
    ],
  },
  {
    id: "ta",
    title: "Ta-row: たちつてと",
    intro:
      "The t-sounds. Two quirks: ち is 'chi' and つ is 'tsu'. ta, te, to behave normally.",
    introduces: [
      { kana: "た", romaji: "ta", hint: "like 'ta' in 'taco'" },
      { kana: "ち", romaji: "chi", hint: "like 'chee' in 'cheese'" },
      {
        kana: "つ",
        romaji: "tsu",
        hint: "like the 'ts' in 'cats' + 'oo'",
        note: "No exact English equivalent — closest to 'tsoo'.",
      },
      { kana: "て", romaji: "te", hint: "like 'te' in 'ten'" },
      { kana: "と", romaji: "to", hint: "like 'to' in 'toe'" },
    ],
    anchorWords: [
      { kana: "うた",   romaji: "uta",   meaning: "song" },
      { kana: "つき",   romaji: "tsuki", meaning: "moon" },
      { kana: "とけい", romaji: "tokei", meaning: "clock" },
    ],
    audioPick: { word: "つき", pickIndex: 0, distractors: ["し", "う", "ち"] },
    build: { meaning: "moon", answer: "つき", decoys: ["し", "う", "ち"] },
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "た", romaji: "ta",  hint: "like 'ta' in 'taco'" },
          { kana: "ち", romaji: "chi", hint: "like 'chee' in 'cheese'", note: "'chi', not 'ki'." },
        ],
        anchorWords: [{ kana: "うた", romaji: "uta", meaning: "song" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "つ", romaji: "tsu", hint: "like 'ts' in 'cats' + 'oo'", note: "Closest English: 'tsoo'." },
          { kana: "て", romaji: "te",  hint: "like 'te' in 'ten'" },
        ],
        anchorWords: [{ kana: "つき", romaji: "tsuki", meaning: "moon" }] },
      { suffix: "3", label: "Review",
        introduces: [{ kana: "と", romaji: "to", hint: "like 'to' in 'toe'" }],
        anchorWords: [{ kana: "とけい", romaji: "tokei", meaning: "clock" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "うた",   romaji: "uta",   meaning: "song" },
          { kana: "つき",   romaji: "tsuki", meaning: "moon" },
          { kana: "とけい", romaji: "tokei", meaning: "clock" },
        ],
        isTest: true },
    ],
  },
  {
    id: "na",
    title: "Na-row: なにぬねの",
    intro:
      "The n-sounds. Regular consonant + the five vowels you know: na, ni, nu, ne, no.",
    introduces: [
      { kana: "な", romaji: "na", hint: "like 'na' in 'nacho'" },
      { kana: "に", romaji: "ni", hint: "like 'nee' in 'neat'" },
      { kana: "ぬ", romaji: "nu", hint: "like 'noo' in 'noodle'" },
      { kana: "ね", romaji: "ne", hint: "like 'ne' in 'nest'" },
      { kana: "の", romaji: "no", hint: "like 'no' in 'note'" },
    ],
    anchorWords: [
      { kana: "なに",   romaji: "nani",   meaning: "what" },
      { kana: "ねこ",   romaji: "neko",   meaning: "cat" },
      { kana: "きのこ", romaji: "kinoko", meaning: "mushroom" },
    ],
    audioPick: { word: "ねこ", pickIndex: 0, distractors: ["れ", "の", "わ"] },
    build: { meaning: "cat", answer: "ねこ", decoys: ["ぬ", "の", "き"] },
    sentencePractice: [
      {
        prompt: "It's a cat.",
        target: "ねこ です",
        correctOrder: ["ねこ", "です"],
        decoys: ["いぬ", "なつ"],
      },
    ],
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "な", romaji: "na", hint: "like 'na' in 'nacho'" },
          { kana: "に", romaji: "ni", hint: "like 'nee' in 'neat'" },
        ],
        anchorWords: [{ kana: "なに", romaji: "nani", meaning: "what" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "ぬ", romaji: "nu", hint: "like 'noo' (clipped)" },
          { kana: "ね", romaji: "ne", hint: "like 'ne' in 'net'" },
        ],
        anchorWords: [{ kana: "ねこ", romaji: "neko", meaning: "cat" }] },
      { suffix: "3", label: "Review",
        introduces: [{ kana: "の", romaji: "no", hint: "like 'no' in 'note'" }],
        anchorWords: [{ kana: "きのこ", romaji: "kinoko", meaning: "mushroom" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "なに",   romaji: "nani",   meaning: "what" },
          { kana: "ねこ",   romaji: "neko",   meaning: "cat" },
          { kana: "きのこ", romaji: "kinoko", meaning: "mushroom" },
        ],
        isTest: true },
    ],
  },
  {
    id: "ha",
    title: "Ha-row: はひふへほ",
    intro:
      "The h-sounds. One quirk: ふ is 'fu' (between an English 'f' and 'h'). The rest follow the pattern.",
    introduces: [
      { kana: "は", romaji: "ha", hint: "like 'ha' in 'hat'" },
      { kana: "ひ", romaji: "hi", hint: "like 'hee' in 'heat'" },
      {
        kana: "ふ",
        romaji: "fu",
        hint: "like blowing out a candle softly",
        note: "Between English 'f' and 'h' — gentle, no teeth on lip.",
      },
      { kana: "へ", romaji: "he", hint: "like 'he' in 'help'" },
      { kana: "ほ", romaji: "ho", hint: "like 'ho' in 'hope'" },
    ],
    anchorWords: [
      { kana: "ひと", romaji: "hito",  meaning: "person" },
      { kana: "ふね", romaji: "fune",  meaning: "boat" },
      { kana: "ほし", romaji: "hoshi", meaning: "star" },
    ],
    audioPick: { word: "ひと", pickIndex: 0, distractors: ["ほ", "ま", "ぱ"] },
    build: { meaning: "person", answer: "ひと", decoys: ["ほ", "な", "に"] },
    sentenceExamples: [
      {
        kana: "へ",
        sentence: "わたし へ",
        reading: "watashi e",
        meaning: "\"to me\" — へ is a direction particle pronounced 'e'.",
      },
    ],
    sentencePractice: [
      {
        prompt: "It's a person.",
        target: "ひと です",
        correctOrder: ["ひと", "です"],
        decoys: ["ふね", "ほし"],
      },
    ],
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "は", romaji: "ha", hint: "like 'ha' in 'hot'" },
          { kana: "ひ", romaji: "hi", hint: "like 'hee' in 'heat'" },
        ],
        anchorWords: [{ kana: "ひと", romaji: "hito", meaning: "person" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "ふ", romaji: "fu", hint: "soft 'foo' — almost a whisper",
            note: "Top teeth don't touch your bottom lip — it's a puff, not an English 'f'." },
          { kana: "へ", romaji: "he", hint: "like 'he' in 'help'" },
        ],
        anchorWords: [{ kana: "ふね", romaji: "fune", meaning: "boat" }] },
      { suffix: "3", label: "Review",
        introduces: [{ kana: "ほ", romaji: "ho", hint: "like 'ho' in 'hope'" }],
        anchorWords: [{ kana: "ほし", romaji: "hoshi", meaning: "star" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "ひと", romaji: "hito",  meaning: "person" },
          { kana: "ふね", romaji: "fune",  meaning: "boat" },
          { kana: "ほし", romaji: "hoshi", meaning: "star" },
        ],
        isTest: true },
    ],
  },
  {
    id: "ma",
    title: "Ma-row: まみむめも",
    intro:
      "The m-sounds. Standard consonant + your five vowels: ma, mi, mu, me, mo.",
    introduces: [
      { kana: "ま", romaji: "ma", hint: "like 'ma' in 'mama'" },
      { kana: "み", romaji: "mi", hint: "like 'mee' in 'meet'" },
      { kana: "む", romaji: "mu", hint: "like 'moo' in 'moon'" },
      { kana: "め", romaji: "me", hint: "like 'me' in 'met'" },
      { kana: "も", romaji: "mo", hint: "like 'mo' in 'most'" },
    ],
    anchorWords: [
      { kana: "うま", romaji: "uma",  meaning: "horse" },
      { kana: "かめ", romaji: "kame", meaning: "turtle" },
      { kana: "もも", romaji: "momo", meaning: "peach" },
    ],
    audioPick: { word: "もも", pickIndex: 0, distractors: ["ゆ", "む", "に"] },
    build: { meaning: "peach", answer: "もも", decoys: ["し", "ま", "の"] },
    sentencePractice: [
      {
        prompt: "It's a peach.",
        target: "もも です",
        correctOrder: ["もも", "です"],
        decoys: ["うま", "かめ"],
      },
    ],
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "ま", romaji: "ma", hint: "like 'ma' in 'mama'" },
          { kana: "み", romaji: "mi", hint: "like 'mee' in 'meet'" },
        ],
        anchorWords: [{ kana: "うま", romaji: "uma", meaning: "horse" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "む", romaji: "mu", hint: "like 'moo' (clipped)" },
          { kana: "め", romaji: "me", hint: "like 'me' in 'met'" },
        ],
        anchorWords: [{ kana: "かめ", romaji: "kame", meaning: "turtle" }] },
      { suffix: "3", label: "Review",
        introduces: [{ kana: "も", romaji: "mo", hint: "like 'mo' in 'more'" }],
        anchorWords: [{ kana: "もも", romaji: "momo", meaning: "peach" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "うま", romaji: "uma",  meaning: "horse" },
          { kana: "かめ", romaji: "kame", meaning: "turtle" },
          { kana: "もも", romaji: "momo", meaning: "peach" },
        ],
        isTest: true },
    ],
  },
  {
    id: "ya",
    title: "Ya-row: やゆよ",
    intro:
      "Only three kana — ya, yu, yo. Japanese doesn't have 'yi' or 'ye' as separate sounds in the standard syllabary.",
    introduces: [
      { kana: "や", romaji: "ya", hint: "like 'ya' in 'yard'" },
      { kana: "ゆ", romaji: "yu", hint: "like 'you'" },
      { kana: "よ", romaji: "yo", hint: "like 'yo' in 'yoga'" },
    ],
    anchorWords: [
      { kana: "やま", romaji: "yama", meaning: "mountain" },
      { kana: "ゆき", romaji: "yuki", meaning: "snow" },
      { kana: "よむ", romaji: "yomu", meaning: "to read" },
    ],
    audioPick: { word: "やま", pickIndex: 0, distractors: ["か", "わ", "ま"] },
    build: { meaning: "mountain", answer: "やま", decoys: ["か", "ね", "き"] },
    sentencePractice: [
      {
        prompt: "It's a mountain.",
        target: "やま です",
        correctOrder: ["やま", "です"],
        decoys: ["ゆき", "よむ"],
      },
    ],
    // 1+1+1+test pattern (2026-05-16). Hand-authored mock-ja-m1-ya.ts
    // overrides the auto-built sub-lessons; the row-test is auto-built.
    // 3-kana row so each sub introduces one kana + one anchor word.
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "や", romaji: "ya", hint: "like 'ya' in 'yard'" },
        ],
        anchorWords: [{ kana: "やま", romaji: "yama", meaning: "mountain" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "ゆ", romaji: "yu", hint: "like 'you' (clipped)" },
        ],
        anchorWords: [{ kana: "ゆき", romaji: "yuki", meaning: "snow" }] },
      { suffix: "3", label: "Review",
        introduces: [{ kana: "よ", romaji: "yo", hint: "like 'yo' in 'yoga'" }],
        anchorWords: [{ kana: "よむ", romaji: "yomu", meaning: "to read" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "やま", romaji: "yama", meaning: "mountain" },
          { kana: "ゆき", romaji: "yuki", meaning: "snow" },
          { kana: "よむ", romaji: "yomu", meaning: "to read" },
        ],
        isTest: true },
    ],
  },
  {
    id: "ra",
    title: "Ra-row: らりるれろ",
    intro:
      "The r-sounds. Soft 'r' between an English 'r' and 'l' — closer to a quick 'd' tap. ra, ri, ru, re, ro.",
    introduces: [
      {
        kana: "ら",
        romaji: "ra",
        hint: "soft, between 'la' and 'ra'",
        note: "Tongue taps the roof of the mouth lightly.",
      },
      { kana: "り", romaji: "ri", hint: "between 'lee' and 'ree'" },
      { kana: "る", romaji: "ru", hint: "between 'lue' and 'rue'" },
      { kana: "れ", romaji: "re", hint: "between 'leh' and 'reh'" },
      { kana: "ろ", romaji: "ro", hint: "between 'lo' and 'ro'" },
    ],
    anchorWords: [
      { kana: "さくら", romaji: "sakura", meaning: "cherry blossom" },
      { kana: "これ",   romaji: "kore",   meaning: "this" },
      { kana: "いろ",   romaji: "iro",    meaning: "color" },
    ],
    audioPick: { word: "さくら", pickIndex: 0, distractors: ["い", "り", "う"] },
    build: { meaning: "this", answer: "これ", decoys: ["れ", "ら", "ろ"] },
    sentencePractice: [
      {
        prompt: "This is a cherry blossom.",
        target: "これ さくら です",
        correctOrder: ["これ", "さくら", "です"],
        decoys: ["いろ"],
      },
    ],
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "ら", romaji: "ra", hint: "soft tongue tap — between 'la' and 'ra'",
            note: "Tongue taps the roof of the mouth lightly." },
          { kana: "り", romaji: "ri", hint: "tap between 'lee' and 'ree'" },
        ],
        anchorWords: [{ kana: "さくら", romaji: "sakura", meaning: "cherry blossom" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "る", romaji: "ru", hint: "tap between 'lue' and 'rue'" },
          { kana: "れ", romaji: "re", hint: "tap between 'leh' and 'reh'" },
        ],
        anchorWords: [{ kana: "これ", romaji: "kore", meaning: "this" }] },
      { suffix: "3", label: "Review",
        introduces: [{ kana: "ろ", romaji: "ro", hint: "tap between 'lo' and 'ro'" }],
        anchorWords: [{ kana: "いろ", romaji: "iro", meaning: "color" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "さくら", romaji: "sakura", meaning: "cherry blossom" },
          { kana: "これ",   romaji: "kore",   meaning: "this" },
          { kana: "いろ",   romaji: "iro",    meaning: "color" },
        ],
        isTest: true },
    ],
  },
  {
    id: "wa",
    title: "Wa-row: わをん",
    intro:
      "Three special kana. わ is 'wa'. を is used only as a grammatical particle (pronounced 'o'). ん is a syllabic 'n' that ends syllables and never starts one.",
    introduces: [
      { kana: "わ", romaji: "wa", hint: "like 'wa' in 'water'" },
      {
        kana: "を",
        romaji: "o",
        hint: "object-marker particle (pronounced 'o')",
        note: "Only used as a particle in modern Japanese. Spelled with the wa-row glyph but pronounced 'o'.",
      },
      {
        kana: "ん",
        romaji: "n",
        hint: "syllabic 'n' — ends syllables (e.g. ほん, さん)",
        note: "Never starts a word.",
      },
    ],
    anchorWords: [
      { kana: "かわ",   romaji: "kawa",    meaning: "river" },
      { kana: "わたし", romaji: "watashi", meaning: "I / me" },
      { kana: "ほん",   romaji: "hon",     meaning: "book" },
    ],
    audioPick: { word: "ほん", pickIndex: 1, distractors: ["そ", "ろ", "や"] },
    build: { meaning: "book", answer: "ほん", decoys: ["は", "う", "ま"] },
    sentenceExamples: [
      {
        kana: "を",
        sentence: "パン を たべる",
        reading: "pan o taberu",
        meaning: "\"I eat bread\" — を marks the object, pronounced 'o'.",
      },
      // Survival phrase. り arrives in ra-row; がとう uses voicing from m2.
      // AnnotatedJa romaji helpers float over un-introduced kana — by design.
      {
        kana: "わ",
        sentence: "ありがとう",
        reading: "arigatou",
        meaning: "\"Thank you\" — the other essential traveller phrase.",
      },
    ],
    sentencePractice: [
      {
        prompt: "I'm a person.",
        target: "わたし は ひと です",
        correctOrder: ["わたし", "は", "ひと", "です"],
        decoys: ["ほん", "を"],
      },
    ],
    // 1+1+1+test pattern (2026-05-16). Hand-authored mock-ja-m1-wa.ts
    // overrides the auto-built sub-lessons; the row-test is auto-built.
    // を is a pure particle in modern Japanese — sub-2 introduces it but
    // its anchor word (わたし) reinforces わ rather than building from を,
    // since no content word starts with or contains を outside particle
    // use.
    subLessons: [
      { suffix: "1", label: "Intro 1",
        introduces: [
          { kana: "わ", romaji: "wa", hint: "like 'wa' in 'water'" },
        ],
        anchorWords: [{ kana: "かわ", romaji: "kawa", meaning: "river" }] },
      { suffix: "2", label: "Intro 2",
        introduces: [
          { kana: "を", romaji: "o",
            hint: "object-marker particle (pronounced 'o')",
            note: "Modern Japanese uses it only as a particle." },
        ],
        anchorWords: [{ kana: "わたし", romaji: "watashi", meaning: "I / me" }] },
      { suffix: "3", label: "Review",
        introduces: [
          { kana: "ん", romaji: "n",
            hint: "syllabic 'n' — ends syllables, never starts a word",
            note: "Word-final or word-medial only." },
        ],
        anchorWords: [{ kana: "ほん", romaji: "hon", meaning: "book" }] },
      { suffix: "test", label: "Row test", introduces: [],
        anchorWords: [
          { kana: "かわ",   romaji: "kawa",    meaning: "river" },
          { kana: "わたし", romaji: "watashi", meaning: "I / me" },
          { kana: "ほん",   romaji: "hon",     meaning: "book" },
        ],
        isTest: true },
    ],
  },
];

/**
 * Voiced kana lessons (M2, compact). Dakuten (゛) voices the consonant;
 * handakuten (゜) only applies to the h-row, turning it into p-.
 *
 * M2 compact pattern (per curriculum-design-v2, 2026-05-16): each row is
 * a *modification* of kana the learner already knows from M1. The hand
 * already knows the shape — tracing is dropped entirely. Per row the
 * shape is ONE compact content sub-lesson (~5–7 steps, ~3 min) plus ONE
 * row-test. The content sub-lessons are hand-authored in
 * `mock-ja-m2-{g,z,d,b,p}.ts` and override the auto-built body via the
 * mockLessons.ts spread order. The row-test is auto-built from
 * `audioPick` / `build` / `anchorWords` below.
 *
 * Row ids are short single letters (g, z, d, b, p) — split from the older
 * `da-ba` combined row (2026-05-16) so each voiced family is its own
 * pathway cluster with its own mastery test.
 */
export const DAKUTEN_ROWS: RowDef[] = [
  {
    id: "g",
    title: "Voiced k → g: がぎぐげご",
    intro:
      "The little dash (゛) on the top right is called dakuten. On k-kana, it voices them into g-sounds. か→が, き→ぎ, etc.",
    introduces: [
      { kana: "が", romaji: "ga", hint: "voiced か (ka → ga)" },
      { kana: "ぎ", romaji: "gi", hint: "voiced き (ki → gi)" },
      { kana: "ぐ", romaji: "gu", hint: "voiced く (ku → gu)" },
      { kana: "げ", romaji: "ge", hint: "voiced け (ke → ge)" },
      { kana: "ご", romaji: "go", hint: "voiced こ (ko → go)" },
    ],
    anchorWords: [
      { kana: "かぎ", romaji: "kagi", meaning: "key" },
    ],
    audioPick: { word: "かぎ", pickIndex: 1, distractors: ["き", "が", "ぐ"] },
    build: { meaning: "key", answer: "かぎ", decoys: ["き", "が", "く"] },
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "が", romaji: "ga", hint: "voiced か (ka → ga)" },
          { kana: "ぎ", romaji: "gi", hint: "voiced き (ki → gi)" },
          { kana: "ぐ", romaji: "gu", hint: "voiced く (ku → gu)" },
        ],
        anchorWords: [
          { kana: "めがね", romaji: "megane", meaning: "glasses" },
          { kana: "かぎ", romaji: "kagi", meaning: "key" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "げ", romaji: "ge", hint: "voiced け (ke → ge)" },
          { kana: "ご", romaji: "go", hint: "voiced こ (ko → go)" },
        ],
        anchorWords: [
          { kana: "げんき", romaji: "genki", meaning: "well/energy" },
          { kana: "ごはん", romaji: "gohan", meaning: "rice/meal" },
        ],
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "めがね", romaji: "megane", meaning: "glasses" },
          { kana: "かぎ", romaji: "kagi", meaning: "key" },
          { kana: "げんき", romaji: "genki", meaning: "well/energy" },
          { kana: "ごはん", romaji: "gohan", meaning: "rice/meal" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "かぎ", romaji: "kagi", meaning: "key" },
        ],
        isTest: true,
      },
    ],
  },
  {
    id: "z",
    title: "Voiced s → z: ざじずぜぞ",
    intro:
      "Same dakuten rule on s-kana: さ→ざ, す→ず. One quirk: し→じ is 'ji' (not 'zi').",
    introduces: [
      { kana: "ざ", romaji: "za", hint: "voiced さ (sa → za)" },
      {
        kana: "じ",
        romaji: "ji",
        hint: "voiced し — pronounced 'ji' (not 'zi')",
      },
      { kana: "ず", romaji: "zu", hint: "voiced す (su → zu)" },
      { kana: "ぜ", romaji: "ze", hint: "voiced せ (se → ze)" },
      { kana: "ぞ", romaji: "zo", hint: "voiced そ (so → zo)" },
    ],
    anchorWords: [
      { kana: "みず", romaji: "mizu", meaning: "water" },
      { kana: "かぜ", romaji: "kaze", meaning: "wind" },
      { kana: "ぞう", romaji: "zou", meaning: "elephant" },
      { kana: "じかん", romaji: "jikan", meaning: "time" },
    ],
    audioPick: { word: "みず", pickIndex: 1, distractors: ["す", "じ", "ぐ"] },
    build: { meaning: "water", answer: "みず", decoys: ["む", "ず", "し"] },
    // 2026-05-17 Spencer: expand z-row to the g-row template — 3 sub-lessons
    // + test. sub-1 = 3 chars (ざ じ ず), sub-2 = 2 chars (ぜ ぞ) +
    // consolidation, sub-3 = review + M1 sprinkle.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "ざ", romaji: "za", hint: "voiced さ (sa → za)" },
          {
            kana: "じ",
            romaji: "ji",
            hint: "voiced し — pronounced 'ji' (not 'zi')",
          },
          { kana: "ず", romaji: "zu", hint: "voiced す (su → zu)" },
        ],
        anchorWords: [
          { kana: "みず", romaji: "mizu", meaning: "water" },
          { kana: "じかん", romaji: "jikan", meaning: "time" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "ぜ", romaji: "ze", hint: "voiced せ (se → ze)" },
          { kana: "ぞ", romaji: "zo", hint: "voiced そ (so → zo)" },
        ],
        anchorWords: [
          { kana: "かぜ", romaji: "kaze", meaning: "wind" },
          { kana: "ぞう", romaji: "zou", meaning: "elephant" },
        ],
        build: { meaning: "water", answer: "みず", decoys: ["む", "ず", "し"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "みず", romaji: "mizu", meaning: "water" },
          { kana: "かぜ", romaji: "kaze", meaning: "wind" },
          { kana: "ぞう", romaji: "zou", meaning: "elephant" },
          { kana: "じかん", romaji: "jikan", meaning: "time" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "みず", romaji: "mizu", meaning: "water" },
        ],
        isTest: true,
      },
    ],
  },
  {
    id: "d",
    title: "Voiced t → d: だでど",
    intro:
      "Dakuten on t-kana gives d-sounds. ち→ぢ and つ→づ are technically part of the chart but rare in modern writing — almost every word uses じ・ず instead, so we skip them as drillable kana here.",
    // 2026-05-17 Spencer: ぢ・づ dropped entirely from the row per the
    // task spec. They get a one-line callout in the sub-1 intro info card
    // for chart-completeness awareness, but neither lesson drills nor the
    // row-test quiz them — the modern reader meets them maybe once a year.
    introduces: [
      { kana: "だ", romaji: "da", hint: "voiced た (ta → da)" },
      { kana: "で", romaji: "de", hint: "voiced て (te → de)" },
      { kana: "ど", romaji: "do", hint: "voiced と (to → do)" },
    ],
    anchorWords: [
      { kana: "でんわ", romaji: "denwa", meaning: "telephone" },
      { kana: "からだ", romaji: "karada", meaning: "body" },
      { kana: "どあ", romaji: "doa", meaning: "door" },
    ],
    audioPick: { word: "でんわ", pickIndex: 0, distractors: ["て", "だ", "ど"] },
    build: { meaning: "telephone", answer: "でんわ", decoys: ["て", "だ", "ど"] },
    // 3 sub-lessons + test (g-row template). sub-1 = 2 chars (だ で), sub-2
    // = 1 char (ど) + consolidation, sub-3 = review.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "だ", romaji: "da", hint: "voiced た (ta → da)" },
          { kana: "で", romaji: "de", hint: "voiced て (te → de)" },
        ],
        anchorWords: [
          { kana: "でんわ", romaji: "denwa", meaning: "telephone" },
          { kana: "からだ", romaji: "karada", meaning: "body" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "ど", romaji: "do", hint: "voiced と (to → do)" },
        ],
        anchorWords: [
          { kana: "どあ", romaji: "doa", meaning: "door" },
        ],
        build: { meaning: "telephone", answer: "でんわ", decoys: ["て", "だ", "ど"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "でんわ", romaji: "denwa", meaning: "telephone" },
          { kana: "からだ", romaji: "karada", meaning: "body" },
          { kana: "どあ", romaji: "doa", meaning: "door" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "でんわ", romaji: "denwa", meaning: "telephone" },
        ],
        isTest: true,
      },
    ],
  },
  {
    id: "b",
    title: "Voiced h → b: ばびぶべぼ",
    intro:
      "Same dakuten mark on h-kana gives b-sounds. は→ば, ひ→び, etc. (The h-row also takes the handakuten mark, which makes the p-row — that's the next lesson.)",
    introduces: [
      { kana: "ば", romaji: "ba", hint: "voiced は (ha → ba)" },
      { kana: "び", romaji: "bi", hint: "voiced ひ (hi → bi)" },
      { kana: "ぶ", romaji: "bu", hint: "voiced ふ (fu → bu)" },
      { kana: "べ", romaji: "be", hint: "voiced へ (he → be)" },
      { kana: "ぼ", romaji: "bo", hint: "voiced ほ (ho → bo)" },
    ],
    anchorWords: [
      { kana: "たべる", romaji: "taberu", meaning: "to eat" },
      { kana: "かばん", romaji: "kaban", meaning: "bag" },
      { kana: "えび", romaji: "ebi", meaning: "shrimp" },
      { kana: "ぶた", romaji: "buta", meaning: "pig" },
      { kana: "ぼうし", romaji: "boushi", meaning: "hat" },
    ],
    audioPick: { word: "たべる", pickIndex: 1, distractors: ["て", "ば", "ぶ"] },
    build: { meaning: "to eat", answer: "たべる", decoys: ["て", "へ", "る"] },
    // 2026-05-17 Spencer: 3 sub-lessons + test (g-row template). 5 chars so
    // sub-1 = ば び ぶ (3 chars), sub-2 = べ ぼ (2 chars) + consolidation,
    // sub-3 = review.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "ば", romaji: "ba", hint: "voiced は (ha → ba)" },
          { kana: "び", romaji: "bi", hint: "voiced ひ (hi → bi)" },
          { kana: "ぶ", romaji: "bu", hint: "voiced ふ (fu → bu)" },
        ],
        anchorWords: [
          { kana: "かばん", romaji: "kaban", meaning: "bag" },
          { kana: "えび", romaji: "ebi", meaning: "shrimp" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "べ", romaji: "be", hint: "voiced へ (he → be)" },
          { kana: "ぼ", romaji: "bo", hint: "voiced ほ (ho → bo)" },
        ],
        anchorWords: [
          { kana: "たべる", romaji: "taberu", meaning: "to eat" },
          { kana: "ぼうし", romaji: "boushi", meaning: "hat" },
        ],
        build: { meaning: "to eat", answer: "たべる", decoys: ["て", "へ", "る"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "かばん", romaji: "kaban", meaning: "bag" },
          { kana: "えび", romaji: "ebi", meaning: "shrimp" },
          { kana: "ぶた", romaji: "buta", meaning: "pig" },
          { kana: "たべる", romaji: "taberu", meaning: "to eat" },
          { kana: "ぼうし", romaji: "boushi", meaning: "hat" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "たべる", romaji: "taberu", meaning: "to eat" },
        ],
        isTest: true,
      },
    ],
  },
  {
    id: "p",
    title: "Handakuten p-row: ぱぴぷぺぽ",
    intro:
      "The little circle (゜) is called handakuten. It only appears on h-kana and turns them into p-sounds. ぱ, ぴ, ぷ, ぺ, ぽ.",
    introduces: [
      { kana: "ぱ", romaji: "pa", hint: "は + ゜ → 'pa'" },
      { kana: "ぴ", romaji: "pi", hint: "ひ + ゜ → 'pi'" },
      { kana: "ぷ", romaji: "pu", hint: "ふ + ゜ → 'pu'" },
      { kana: "ぺ", romaji: "pe", hint: "へ + ゜ → 'pe'" },
      { kana: "ぽ", romaji: "po", hint: "ほ + ゜ → 'po'" },
    ],
    anchorWords: [
      { kana: "ぱん", romaji: "pan", meaning: "bread" },
      { kana: "ぴあの", romaji: "piano", meaning: "piano" },
      { kana: "ぷりん", romaji: "purin", meaning: "pudding" },
      { kana: "ぺん", romaji: "pen", meaning: "pen" },
    ],
    audioPick: { word: "ぱん", pickIndex: 0, distractors: ["ば", "は", "ぽ"] },
    build: { meaning: "bread", answer: "ぱん", decoys: ["ば", "ん", "は"] },
    // 2026-05-17 Spencer: 3 sub-lessons + test (g-row template). First-of-type
    // handakuten info card at top of sub-1 (mock file handles it). 5 chars
    // so sub-1 = ぱ ぴ ぷ (3 chars), sub-2 = ぺ ぽ (2 chars) + consolidation,
    // sub-3 = review.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "ぱ", romaji: "pa", hint: "は + ゜ → 'pa'" },
          { kana: "ぴ", romaji: "pi", hint: "ひ + ゜ → 'pi'" },
          { kana: "ぷ", romaji: "pu", hint: "ふ + ゜ → 'pu'" },
        ],
        anchorWords: [
          { kana: "ぱん", romaji: "pan", meaning: "bread" },
          { kana: "ぴあの", romaji: "piano", meaning: "piano" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "ぺ", romaji: "pe", hint: "へ + ゜ → 'pe'" },
          { kana: "ぽ", romaji: "po", hint: "ほ + ゜ → 'po'" },
        ],
        anchorWords: [
          { kana: "ぷりん", romaji: "purin", meaning: "pudding" },
          { kana: "ぺん", romaji: "pen", meaning: "pen" },
        ],
        build: { meaning: "bread", answer: "ぱん", decoys: ["ば", "ん", "は"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "ぱん", romaji: "pan", meaning: "bread" },
          { kana: "ぴあの", romaji: "piano", meaning: "piano" },
          { kana: "ぷりん", romaji: "purin", meaning: "pudding" },
          { kana: "ぺん", romaji: "pen", meaning: "pen" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "ぱん", romaji: "pan", meaning: "bread" },
        ],
        isTest: true,
      },
    ],
  },
];

/**
 * Yōon (拗音) — combination kana. A consonant kana shrinks the following
 * や/ゆ/よ into ゃ/ゅ/ょ so the pair pronounces as a single mora:
 * き + ゃ → きゃ (kya). 33 total: 11 consonant onsets × 3 small-y endings.
 *
 * M2 compact pattern (curriculum-design-v2, 2026-05-16): yōon are
 * *modifications* of known kana — drop tracing, ~5–7 step content
 * sub-lessons. Per row: ONE compact content sub-lesson + ONE row-test
 * (required for ★ mastery). The yoon-capstone is a separate test-only
 * lesson that drills across all yōon — it does NOT grant retroactive
 * mastery for the 4 yōon rows; each row still needs its own test pass.
 *
 * Every yōon row declares `prerequisites: ["ya"]` so the small-ゃゅょ
 * rule cannot land before the ya-row is taught.
 */
export const YOON_ROWS: RowDef[] = [
  // 1) Intro — kya/kyu/kyo as the worked example for the small-ya/yu/yo rule.
  {
    id: "yoon-intro",
    title: "Yōon intro: きゃ・きゅ・きょ",
    intro:
      "Small ゃゅょ stuck to a consonant kana = one syllable. き + ゃ → きゃ (kya). Same rule applies to every other consonant family — you'll see them in the next lessons.",
    introduces: [
      { kana: "きゃ", romaji: "kya", hint: "ki + small ya — one syllable 'kya'" },
      { kana: "きゅ", romaji: "kyu", hint: "ki + small yu — 'kyu'" },
      { kana: "きょ", romaji: "kyo", hint: "ki + small yo — 'kyo'" },
    ],
    anchorWords: [
      { kana: "きょう", romaji: "kyou", meaning: "today" },
      { kana: "きゅうり", romaji: "kyuuri", meaning: "cucumber" },
    ],
    audioPick: { word: "きょう", pickIndex: 0, distractors: ["きゃ", "きゅ", "しゃ"] },
    build: { meaning: "today", answer: "きょう", decoys: ["きゃ", "きゅ", "う"] },
    prerequisites: ["ya"],
    // 2026-05-17 Spencer: 3 sub-lessons + test (g-row template). First-of-
    // type yōon intro card at top of sub-1. 3 chars so sub-1 = きゃ きゅ
    // (2 chars), sub-2 = きょ (1 char) + consolidation, sub-3 = review.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "きゃ", romaji: "kya", hint: "ki + small ya — one syllable 'kya'" },
          { kana: "きゅ", romaji: "kyu", hint: "ki + small yu — 'kyu'" },
        ],
        anchorWords: [
          { kana: "きゅうり", romaji: "kyuuri", meaning: "cucumber" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "きょ", romaji: "kyo", hint: "ki + small yo — 'kyo'" },
        ],
        anchorWords: [
          { kana: "きょう", romaji: "kyou", meaning: "today" },
        ],
        build: { meaning: "today", answer: "きょう", decoys: ["きゃ", "きゅ", "う"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "きょう", romaji: "kyou", meaning: "today" },
          { kana: "きゅうり", romaji: "kyuuri", meaning: "cucumber" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "きょう", romaji: "kyou", meaning: "today" },
        ],
        isTest: true,
      },
    ],
  },
  // 2) sh + ch yōon — same rule, two consonant families packed in one
  //    sub-lesson now that the rule has landed.
  {
    id: "yoon-sh-ch",
    title: "Yōon: しゃ・ちゃ families",
    intro:
      "Same rule for s and t consonants. し + ゃ → しゃ. ち + ゃ → ちゃ. Six new kana, two families.",
    introduces: [
      { kana: "しゃ", romaji: "sha", hint: "shi + small ya — 'sha'" },
      { kana: "しゅ", romaji: "shu", hint: "shi + small yu — 'shu'" },
      { kana: "しょ", romaji: "sho", hint: "shi + small yo — 'sho'" },
      { kana: "ちゃ", romaji: "cha", hint: "chi + small ya — 'cha'" },
      { kana: "ちゅ", romaji: "chu", hint: "chi + small yu — 'chu'" },
      { kana: "ちょ", romaji: "cho", hint: "chi + small yo — 'cho'" },
    ],
    anchorWords: [
      { kana: "おちゃ", romaji: "ocha", meaning: "tea" },
      { kana: "しゃしん", romaji: "shashin", meaning: "photo" },
    ],
    audioPick: { word: "おちゃ", pickIndex: 1, distractors: ["ちゃ", "しゃ", "ちゅ"] },
    build: { meaning: "tea", answer: "おちゃ", decoys: ["ちょ", "しゃ", "ちゅ"] },
    prerequisites: ["ya"],
    // 2026-05-17 Spencer: 3 sub-lessons + test. 6 chars split 3+3 (sh in
    // sub-1, ch in sub-2 with consolidation), sub-3 = review.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "しゃ", romaji: "sha", hint: "shi + small ya — 'sha'" },
          { kana: "しゅ", romaji: "shu", hint: "shi + small yu — 'shu'" },
          { kana: "しょ", romaji: "sho", hint: "shi + small yo — 'sho'" },
        ],
        anchorWords: [
          { kana: "しゃしん", romaji: "shashin", meaning: "photo" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "ちゃ", romaji: "cha", hint: "chi + small ya — 'cha'" },
          { kana: "ちゅ", romaji: "chu", hint: "chi + small yu — 'chu'" },
          { kana: "ちょ", romaji: "cho", hint: "chi + small yo — 'cho'" },
        ],
        anchorWords: [
          { kana: "おちゃ", romaji: "ocha", meaning: "tea" },
        ],
        build: { meaning: "tea", answer: "おちゃ", decoys: ["ちょ", "しゃ", "ちゅ"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "おちゃ", romaji: "ocha", meaning: "tea" },
          { kana: "しゃしん", romaji: "shashin", meaning: "photo" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "おちゃ", romaji: "ocha", meaning: "tea" },
        ],
        isTest: true,
      },
    ],
  },
  // 3) Voiced yōon — g/j/b/p families combined. 12 kana in one sub-lesson;
  //    components familiar from dakuten + yōon-intro.
  {
    id: "yoon-voiced",
    title: "Yōon: ぎゃ・じゃ・びゃ・ぴゃ (voiced)",
    intro:
      "Dakuten + handakuten yōon — same small-ゃゅょ rule, voiced consonants. ぎ・じ・び・ぴ + small ya/yu/yo. 12 new kana across four voiced families.",
    introduces: [
      { kana: "ぎゃ", romaji: "gya", hint: "gi + small ya — 'gya'" },
      { kana: "ぎゅ", romaji: "gyu", hint: "gi + small yu — 'gyu'" },
      { kana: "ぎょ", romaji: "gyo", hint: "gi + small yo — 'gyo'" },
      { kana: "じゃ", romaji: "ja", hint: "ji + small ya — 'ja'" },
      { kana: "じゅ", romaji: "ju", hint: "ji + small yu — 'ju'" },
      { kana: "じょ", romaji: "jo", hint: "ji + small yo — 'jo'" },
      { kana: "びゃ", romaji: "bya", hint: "bi + small ya — 'bya'" },
      { kana: "びゅ", romaji: "byu", hint: "bi + small yu — 'byu'" },
      { kana: "びょ", romaji: "byo", hint: "bi + small yo — 'byo'" },
      { kana: "ぴゃ", romaji: "pya", hint: "pi + small ya — 'pya'" },
      { kana: "ぴゅ", romaji: "pyu", hint: "pi + small yu — 'pyu'" },
      { kana: "ぴょ", romaji: "pyo", hint: "pi + small yo — 'pyo'" },
    ],
    anchorWords: [
      { kana: "じゅう", romaji: "juu", meaning: "ten" },
    ],
    audioPick: { word: "じゅう", pickIndex: 0, distractors: ["じゃ", "じょ", "ぎゅ"] },
    build: { meaning: "ten", answer: "じゅう", decoys: ["じゃ", "じょ", "う"] },
    prerequisites: ["ya"],
    // 2026-05-17 Spencer: 3 sub-lessons + test. 12 chars total — too many
    // for full per-char intros. Strategy: sub-1 teaches the 3 j-family
    // (highest utility — じゃ じゅ じょ) with the anchor じゅう; sub-2
    // does a recognition + s2s sweep of the g/b/p families with no new
    // anchor word; sub-3 = review. Row test still quizzes all 12.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "じゃ", romaji: "ja", hint: "ji + small ya — 'ja'" },
          { kana: "じゅ", romaji: "ju", hint: "ji + small yu — 'ju'" },
          { kana: "じょ", romaji: "jo", hint: "ji + small yo — 'jo'" },
        ],
        anchorWords: [
          { kana: "じゅう", romaji: "juu", meaning: "ten" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        // sub-2 introduces the g/b/p yōon as a wide sweep — recognition
        // + s2s only, no anchor words. The 6 most common are taught;
        // rare ぴゅ・びゅ・ぎゅ get the sweep as well via the lesson file.
        introduces: [
          { kana: "ぎゃ", romaji: "gya", hint: "gi + small ya — 'gya'" },
          { kana: "ぎゅ", romaji: "gyu", hint: "gi + small yu — 'gyu'" },
          { kana: "ぎょ", romaji: "gyo", hint: "gi + small yo — 'gyo'" },
          { kana: "びゃ", romaji: "bya", hint: "bi + small ya — 'bya'" },
          { kana: "びゅ", romaji: "byu", hint: "bi + small yu — 'byu'" },
          { kana: "びょ", romaji: "byo", hint: "bi + small yo — 'byo'" },
          { kana: "ぴゃ", romaji: "pya", hint: "pi + small ya — 'pya'" },
          { kana: "ぴゅ", romaji: "pyu", hint: "pi + small yu — 'pyu'" },
          { kana: "ぴょ", romaji: "pyo", hint: "pi + small yo — 'pyo'" },
        ],
        anchorWords: [],
        build: { meaning: "ten", answer: "じゅう", decoys: ["じゃ", "じょ", "う"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "じゅう", romaji: "juu", meaning: "ten" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "じゅう", romaji: "juu", meaning: "ten" },
        ],
        isTest: true,
      },
    ],
  },
  // 4) Rare yōon — n/h/m/r families. Recognition-only for most; ひゃ・りゅ
  //    ・りょ have real anchors. にゃ gets a sentence-example slide (no
  //    everyday word uses it cleanly).
  {
    id: "yoon-rare",
    title: "Yōon: にゃ・ひゃ・みゃ・りゃ (rare)",
    intro:
      "The last yōon families — n/h/m/r kana with small ゃゅょ. Many are recognition-only; the high-utility ones are ひゃく (hundred), りゅう (dragon), りょこう (trip).",
    introduces: [
      { kana: "にゃ", romaji: "nya", hint: "ni + small ya — 'nya'" },
      { kana: "にゅ", romaji: "nyu", hint: "ni + small yu — 'nyu'" },
      { kana: "にょ", romaji: "nyo", hint: "ni + small yo — 'nyo'" },
      { kana: "ひゃ", romaji: "hya", hint: "hi + small ya — 'hya'" },
      { kana: "ひゅ", romaji: "hyu", hint: "hi + small yu — 'hyu'" },
      { kana: "ひょ", romaji: "hyo", hint: "hi + small yo — 'hyo'" },
      { kana: "みゃ", romaji: "mya", hint: "mi + small ya — 'mya'" },
      { kana: "みゅ", romaji: "myu", hint: "mi + small yu — 'myu'" },
      { kana: "みょ", romaji: "myo", hint: "mi + small yo — 'myo'" },
      { kana: "りゃ", romaji: "rya", hint: "ri + small ya — 'rya'" },
      { kana: "りゅ", romaji: "ryu", hint: "ri + small yu — 'ryu'" },
      { kana: "りょ", romaji: "ryo", hint: "ri + small yo — 'ryo'" },
    ],
    anchorWords: [
      { kana: "ひゃく", romaji: "hyaku", meaning: "hundred" },
      { kana: "りょうり", romaji: "ryouri", meaning: "cooking" },
    ],
    audioPick: { word: "ひゃく", pickIndex: 0, distractors: ["ひゅ", "ひょ", "きゃ"] },
    build: { meaning: "hundred", answer: "ひゃく", decoys: ["ひゅ", "ひょ", "く"] },
    prerequisites: ["ya"],
    // 2026-05-17 Spencer: 3 sub-lessons + test. 12 chars total — split
    // sub-1 = h-family (ひゃ ひゅ ひょ, anchor ひゃく), sub-2 = r-family
    // (りゃ りゅ りょ, anchor りょうり) + recognition sweep across the rare
    // n + m families, sub-3 = review. Row test still quizzes all 12.
    subLessons: [
      {
        suffix: "1",
        label: "Intro",
        introduces: [
          { kana: "ひゃ", romaji: "hya", hint: "hi + small ya — 'hya'" },
          { kana: "ひゅ", romaji: "hyu", hint: "hi + small yu — 'hyu'" },
          { kana: "ひょ", romaji: "hyo", hint: "hi + small yo — 'hyo'" },
        ],
        anchorWords: [
          { kana: "ひゃく", romaji: "hyaku", meaning: "hundred" },
        ],
      },
      {
        suffix: "2",
        label: "Practice",
        introduces: [
          { kana: "りゃ", romaji: "rya", hint: "ri + small ya — 'rya'" },
          { kana: "りゅ", romaji: "ryu", hint: "ri + small yu — 'ryu'" },
          { kana: "りょ", romaji: "ryo", hint: "ri + small yo — 'ryo'" },
          // n + m families included for chart-completeness + row-test items;
          // taught via recognition sweep in the lesson file rather than full
          // intro+anchor blocks (functionally rare in everyday text).
          { kana: "にゃ", romaji: "nya", hint: "ni + small ya — 'nya'" },
          { kana: "にゅ", romaji: "nyu", hint: "ni + small yu — 'nyu'" },
          { kana: "にょ", romaji: "nyo", hint: "ni + small yo — 'nyo'" },
          { kana: "みゃ", romaji: "mya", hint: "mi + small ya — 'mya'" },
          { kana: "みゅ", romaji: "myu", hint: "mi + small yu — 'myu'" },
          { kana: "みょ", romaji: "myo", hint: "mi + small yo — 'myo'" },
        ],
        anchorWords: [
          { kana: "りょうり", romaji: "ryouri", meaning: "cooking" },
        ],
        build: { meaning: "hundred", answer: "ひゃく", decoys: ["ひゅ", "ひょ", "く"] },
      },
      {
        suffix: "3",
        label: "Review",
        introduces: [],
        anchorWords: [
          { kana: "ひゃく", romaji: "hyaku", meaning: "hundred" },
          { kana: "りょうり", romaji: "ryouri", meaning: "cooking" },
        ],
      },
      {
        suffix: "test",
        label: "Row test",
        introduces: [],
        anchorWords: [
          { kana: "ひゃく", romaji: "hyaku", meaning: "hundred" },
        ],
        isTest: true,
      },
    ],
  },
  // 5) Yōon capstone — test-only row covering ALL yōon. Items are sourced
  //    by the row-test builder from this row's `introduces` (union of all
  //    yōon kana across the previous 4 rows). No intro/teach steps — the
  //    auto-appended `isTest: true` sub-lesson is the only emission, which
  //    in turn produces a single LessonContent with a RowTestStep.
  //
  //    NOTE: This row has NO `introduces` in the usual sense — instead it
  //    relays the kana set so the row-test MC items can spawn. We populate
  //    `introduces` with the union of yōon kana but mark every sub-lesson
  //    as `isTest` so the lesson-builder's coverage assertion ("every
  //    kana lives in a non-test sub-lesson") doesn't fire on this row.
  {
    id: "yoon-capstone",
    title: "Yōon capstone test",
    intro:
      "Single test across every yōon you've met. Wrong answers come back at the end of the queue — finish them all to clear. Skippable.",
    // Empty introduces — the test-only row pulls its MC item pool from the
    // four preceding yōon rows at row-test build time (override below).
    introduces: [],
    anchorWords: [],
    audioPick: { word: "きょう", pickIndex: 0, distractors: ["きゃ", "きゅ", "しゃ"] },
    build: { meaning: "today", answer: "きょう", decoys: ["きゃ", "きゅ", "う"] },
    prerequisites: ["ya"],
    subLessons: [
      {
        suffix: "test",
        label: "Yōon test",
        introduces: [],
        anchorWords: [],
        isTest: true,
      },
    ],
  },
];

/**
 * Canonical split rule (alphabet-streamline spec):
 *   - 3 kana  → 2+1 + test     (3 nodes)
 *   - 5 kana  → 2+2+1 + test   (4 nodes)
 *   - 6 kana  → 2+2+2 + test   (4 nodes)  — yōon
 *   - 8 kana  → 2+2+2+2 + test (5 nodes)  — legacy da-ba (split into d+b in M2 compact)
 *   - 12 kana → 1 wide intro + test (2 nodes) — legacy yōon capstone path
 *     (kept as a safety net; not exercised since the yo-n-h-m-r split into
 *     yo-n-h + yo-m-r).
 *
 * Returns the per-sub-lesson kana group sizes (NOT including the trailing
 * row-test, which is appended automatically by `deriveSubLessons`).
 */
function canonicalSplit(n: number): number[] {
  if (n === 3) return [2, 1];
  if (n === 5) return [2, 2, 1];
  if (n === 6) return [2, 2, 2];
  if (n === 8) return [2, 2, 2, 2];
  if (n === 12) return [12]; // capstone: single wide intro
  // Fallback: pairs with a 1-tail.
  const out: number[] = [];
  let rem = n;
  while (rem > 0) {
    if (rem >= 2) {
      out.push(2);
      rem -= 2;
    } else {
      out.push(1);
      rem -= 1;
    }
  }
  return out;
}

/**
 * Picks which anchor words a sub-lesson surfaces. Greedy: each anchor word
 * is assigned to the earliest sub-lesson whose accumulated kana set covers
 * all of the word's characters. Words whose kana span multiple sub-lessons
 * get pushed to the latest contributing sub-lesson so the build step doesn't
 * reference yet-to-introduce kana. Any unassigned anchor words get appended
 * to the row-final (non-test) sub-lesson so coverage stays complete.
 */
function distributeAnchorWords(
  groups: KanaIntro[][],
  anchors: AnchorWord[],
): AnchorWord[][] {
  const out: AnchorWord[][] = groups.map(() => []);
  const cumulative: Set<string>[] = [];
  let acc = new Set<string>();
  for (const g of groups) {
    for (const k of g) acc.add(k.kana);
    cumulative.push(new Set(acc));
  }
  const assigned = new Set<AnchorWord>();
  for (const word of anchors) {
    const chars = Array.from(word.kana);
    for (let i = 0; i < cumulative.length; i++) {
      // All chars must be in the cumulative kana-set OR be a kana already
      // introduced in an earlier row (we can't check earlier rows here, so
      // accept any non-row kana as carryover — the renderer's romaji-helper
      // fallback handles unknown kana).
      const allInRow = chars.every((c) => {
        // Kana introduced in this or earlier sub-lesson of this row
        if (cumulative[i].has(c)) return true;
        // Kana NOT in this row at all → assume earlier row
        const inThisRow = groups.some((g) => g.some((k) => k.kana === c));
        return !inThisRow;
      });
      if (allInRow) {
        out[i].push(word);
        assigned.add(word);
        break;
      }
    }
  }
  // Anything left over → push to the final non-test sub-lesson.
  const tail = out.length - 1;
  for (const word of anchors) {
    if (!assigned.has(word)) out[tail].push(word);
  }
  return out;
}

/**
 * Derive a canonical `subLessons` array from a RowDef. Splits kana per
 * `canonicalSplit`, distributes anchor words to the earliest sub-lesson
 * that can spell them, places `build` + `sentencePractice` on the final
 * non-test sub-lesson, places `sentenceExamples` on the latest sub-lesson
 * whose kana set introduces the example's target kana, then appends a
 * row-test sub-lesson.
 */
export function deriveSubLessons(row: RowDef): SubLessonDef[] {
  if (row.subLessons && row.subLessons.length > 0) return row.subLessons;
  const sizes = canonicalSplit(row.introduces.length);
  const groups: KanaIntro[][] = [];
  let cursor = 0;
  for (const size of sizes) {
    groups.push(row.introduces.slice(cursor, cursor + size));
    cursor += size;
  }
  const anchorGroups = distributeAnchorWords(groups, row.anchorWords);
  const out: SubLessonDef[] = [];
  for (let i = 0; i < groups.length; i++) {
    const isFinal = i === groups.length - 1;
    const introsHere = groups[i];
    const anchorsHere = anchorGroups[i];
    const subLesson: SubLessonDef = {
      suffix: String(i + 1),
      label:
        groups.length === 1
          ? "Intro"
          : isFinal
            ? "Review"
            : `Intro ${i + 1}`,
      introduces: introsHere,
      anchorWords: anchorsHere,
    };
    if (isFinal) {
      subLesson.build = row.build;
      if (row.sentencePractice) subLesson.sentencePractice = row.sentencePractice;
    }
    // Place sentence-examples on the latest sub-lesson whose introduces[]
    // (or any earlier kana from this row) introduce the example kana.
    if (row.sentenceExamples) {
      for (const ex of row.sentenceExamples) {
        // Find the sub-lesson that introduces ex.kana in this row.
        let target = -1;
        for (let j = 0; j < groups.length; j++) {
          if (groups[j].some((k) => k.kana === ex.kana)) {
            target = j;
            break;
          }
        }
        if (target === -1) target = groups.length - 1; // fallback: final
        if (target === i) {
          subLesson.sentenceExamples = [
            ...(subLesson.sentenceExamples ?? []),
            ex,
          ];
        }
      }
    }
    out.push(subLesson);
  }
  // Row-test
  out.push({
    suffix: "test",
    label: "Row test",
    introduces: [],
    anchorWords: row.anchorWords,
    isTest: true,
  });
  return out;
}

/** Populate every row with derived sub-lessons (in place). Idempotent. */
function populateSubLessons(rows: RowDef[]): RowDef[] {
  return rows.map((r) => ({ ...r, subLessons: deriveSubLessons(r) }));
}

// Apply the streamline split to every row at module load.
const HIRAGANA_ROWS_SPLIT = populateSubLessons(HIRAGANA_ROWS);
const DAKUTEN_ROWS_SPLIT = populateSubLessons(DAKUTEN_ROWS);
const YOON_ROWS_SPLIT = populateSubLessons(YOON_ROWS);

// Re-export the split rows under the same names so all consumers see them.
// (Direct mutation of `HIRAGANA_ROWS` is avoided so the source arrays
// remain the canonical declarative catalog.)
for (let i = 0; i < HIRAGANA_ROWS.length; i++) {
  HIRAGANA_ROWS[i] = HIRAGANA_ROWS_SPLIT[i];
}
for (let i = 0; i < DAKUTEN_ROWS.length; i++) {
  DAKUTEN_ROWS[i] = DAKUTEN_ROWS_SPLIT[i];
}
for (let i = 0; i < YOON_ROWS.length; i++) {
  YOON_ROWS[i] = YOON_ROWS_SPLIT[i];
}

export const ALL_ROWS = [...HIRAGANA_ROWS, ...DAKUTEN_ROWS, ...YOON_ROWS];

/** Every kana referenced by any RowDef (introduces + anchor words + audio/build distractors). */
export function collectAllKana(): Set<string> {
  const all = new Set<string>();
  for (const row of ALL_ROWS) {
    for (const k of row.introduces) all.add(k.kana);
    for (const w of row.anchorWords) {
      for (const ch of Array.from(w.kana)) all.add(ch);
    }
    all.add(row.audioPick.word[row.audioPick.pickIndex]);
    for (const d of row.audioPick.distractors) all.add(d);
    for (const d of row.build.decoys) all.add(d);
  }
  return all;
}

/** Every phrase that needs TTS audio. */
export function collectAllPhrases(): Set<string> {
  const phrases = new Set<string>();
  for (const row of ALL_ROWS) {
    for (const k of row.introduces) phrases.add(k.kana);
    for (const w of row.anchorWords) phrases.add(w.kana);
    phrases.add(row.audioPick.word);
    phrases.add(row.build.answer);
    // Also single-kana audio for distractors so the recognition step plays.
    for (const d of row.audioPick.distractors) phrases.add(d);
    // Sentence-example sentences also need TTS so the info slide can play.
    if (row.sentenceExamples) {
      for (const ex of row.sentenceExamples) phrases.add(ex.sentence);
    }
    // Multi-tile sentence-practice targets need TTS so the build_sentence
    // step can play the full utterance after a correct assembly.
    if (row.sentencePractice) {
      for (const sp of row.sentencePractice) phrases.add(sp.target);
    }
  }
  return phrases;
}
