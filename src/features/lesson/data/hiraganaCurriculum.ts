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
      { kana: "かお", romaji: "kao", meaning: "face" },
      { kana: "くち", romaji: "kuchi", meaning: "mouth" },
      { kana: "こえ", romaji: "koe", meaning: "voice" },
    ],
    audioPick: { word: "かお", pickIndex: 0, distractors: ["き", "く", "さ"] },
    build: { meaning: "face", answer: "かお", decoys: ["き", "い", "う"] },
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
      { kana: "あさ", romaji: "asa", meaning: "morning" },
      { kana: "すし", romaji: "sushi", meaning: "sushi" },
      { kana: "いす", romaji: "isu", meaning: "chair" },
    ],
    audioPick: { word: "すし", pickIndex: 0, distractors: ["し", "つ", "む"] },
    build: { meaning: "sushi", answer: "すし", decoys: ["さ", "む", "つ"] },
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
      { kana: "つき", romaji: "tsuki", meaning: "moon" },
      { kana: "て", romaji: "te", meaning: "hand" },
      { kana: "とけい", romaji: "tokei", meaning: "clock / watch" },
    ],
    audioPick: { word: "つき", pickIndex: 0, distractors: ["し", "う", "ち"] },
    build: { meaning: "moon", answer: "つき", decoys: ["し", "う", "ち"] },
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
      { kana: "ねこ", romaji: "neko", meaning: "cat" },
      { kana: "いぬ", romaji: "inu", meaning: "dog" },
      { kana: "なつ", romaji: "natsu", meaning: "summer" },
    ],
    audioPick: { word: "ねこ", pickIndex: 0, distractors: ["れ", "の", "わ"] },
    build: { meaning: "cat", answer: "ねこ", decoys: ["ぬ", "の", "き"] },
    // で in です uses the AnnotatedJa romaji-helper fallback until the
    // learner drills da-ba in m2 — by design (see file-header curation rules).
    sentencePractice: [
      {
        prompt: "It's a cat.",
        target: "ねこ です",
        correctOrder: ["ねこ", "です"],
        decoys: ["いぬ", "なつ"],
      },
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
      { kana: "はな", romaji: "hana", meaning: "flower" },
      { kana: "ひと", romaji: "hito", meaning: "person" },
      { kana: "ほし", romaji: "hoshi", meaning: "star" },
    ],
    audioPick: { word: "はな", pickIndex: 0, distractors: ["ほ", "ま", "ぱ"] },
    build: { meaning: "flower", answer: "はな", decoys: ["ほ", "な", "に"] },
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
        prompt: "It's a flower.",
        target: "はな です",
        correctOrder: ["はな", "です"],
        decoys: ["ほし", "ひと"],
      },
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
      { kana: "みみ", romaji: "mimi", meaning: "ear" },
      { kana: "もも", romaji: "momo", meaning: "peach" },
      { kana: "あめ", romaji: "ame", meaning: "rain / candy" },
    ],
    audioPick: { word: "みみ", pickIndex: 0, distractors: ["ゆ", "む", "に"] },
    build: { meaning: "peach", answer: "もも", decoys: ["し", "ま", "の"] },
    sentencePractice: [
      {
        prompt: "It's an ear.",
        target: "みみ です",
        correctOrder: ["みみ", "です"],
        decoys: ["もも", "あめ"],
      },
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
      { kana: "ゆめ", romaji: "yume", meaning: "dream" },
    ],
    audioPick: { word: "やま", pickIndex: 0, distractors: ["か", "わ", "ま"] },
    build: { meaning: "mountain", answer: "やま", decoys: ["か", "ね", "き"] },
    sentencePractice: [
      {
        prompt: "It's a mountain.",
        target: "やま です",
        correctOrder: ["やま", "です"],
        decoys: ["ゆき", "ゆめ"],
      },
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
      { kana: "とり", romaji: "tori", meaning: "bird" },
      { kana: "はる", romaji: "haru", meaning: "spring (season)" },
    ],
    audioPick: { word: "とり", pickIndex: 1, distractors: ["い", "り", "う"] },
    build: { meaning: "spring (season)", answer: "はる", decoys: ["れ", "ら", "ろ"] },
    sentencePractice: [
      {
        prompt: "It's a bird.",
        target: "とり です",
        correctOrder: ["とり", "です"],
        decoys: ["さくら", "はる"],
      },
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
      { kana: "わたし", romaji: "watashi", meaning: "I / me" },
      { kana: "にほん", romaji: "nihon", meaning: "Japan" },
      { kana: "ほん", romaji: "hon", meaning: "book" },
    ],
    audioPick: { word: "にほん", pickIndex: 2, distractors: ["そ", "ろ", "や"] },
    build: { meaning: "Japan", answer: "にほん", decoys: ["は", "う", "ま"] },
    sentenceExamples: [
      {
        kana: "を",
        sentence: "パン を たべる",
        reading: "pan o taberu",
        meaning: "\"I eat bread\" — を marks the object, pronounced 'o'.",
      },
    ],
    sentencePractice: [
      {
        prompt: "I'm Japanese.",
        target: "わたし は にほんじん です",
        correctOrder: ["わたし", "は", "にほんじん", "です"],
        decoys: ["ほん", "を"],
      },
    ],
  },
];

/**
 * Voiced kana lessons. Dakuten (゛) voices the consonant; handakuten (゜)
 * only applies to the h-row, turning it into p-. Pedagogically these
 * follow the basic rows because every voiced kana shares its shape with
 * a previously-learned unvoiced kana.
 */
export const DAKUTEN_ROWS: RowDef[] = [
  {
    id: "ga",
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
      { kana: "げんき", romaji: "genki", meaning: "energy / well" },
      { kana: "ごはん", romaji: "gohan", meaning: "rice / meal" },
      { kana: "いちご", romaji: "ichigo", meaning: "strawberry" },
    ],
    audioPick: { word: "ごはん", pickIndex: 0, distractors: ["こ", "が", "ぐ"] },
    build: { meaning: "rice / meal", answer: "ごはん", decoys: ["こ", "が", "ぐ"] },
    sentenceExamples: [
      {
        kana: "ぐ",
        sentence: "か ぐ",
        reading: "kagu",
        meaning: "\"furniture\" — one of the few common words using ぐ.",
      },
    ],
    sentencePractice: [
      {
        prompt: "I'm well. (How are you? answer)",
        target: "げんき です",
        correctOrder: ["げんき", "です"],
        decoys: ["いちご", "ごはん"],
      },
    ],
  },
  {
    id: "za",
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
      { kana: "かぜ", romaji: "kaze", meaning: "wind / cold (illness)" },
      { kana: "ぞう", romaji: "zou", meaning: "elephant" },
    ],
    audioPick: { word: "ぞう", pickIndex: 0, distractors: ["そ", "じ", "ぐ"] },
    build: { meaning: "water", answer: "みず", decoys: ["む", "ず", "し"] },
    sentenceExamples: [
      {
        kana: "ざ",
        sentence: "ざっし",
        reading: "zasshi",
        meaning: "\"magazine\" — the small つ doubles the next consonant; you'll meet that pattern soon.",
      },
    ],
    sentencePractice: [
      {
        prompt: "It's water.",
        target: "みず です",
        correctOrder: ["みず", "です"],
        decoys: ["かぜ", "ぞう"],
      },
    ],
  },
  {
    id: "da-ba",
    title: "Voiced t → d, h → b: だぢづでど ばびぶべぼ",
    intro:
      "Dakuten on t-kana gives d-sounds. ち→ぢ and つ→づ are rare in modern writing (use じ/ず instead). Dakuten on h-kana gives b-sounds.",
    introduces: [
      { kana: "だ", romaji: "da", hint: "voiced た (ta → da)" },
      { kana: "で", romaji: "de", hint: "voiced て (te → de)" },
      { kana: "ど", romaji: "do", hint: "voiced と (to → do)" },
      { kana: "ば", romaji: "ba", hint: "voiced は (ha → ba)" },
      { kana: "び", romaji: "bi", hint: "voiced ひ (hi → bi)" },
      { kana: "ぶ", romaji: "bu", hint: "voiced ふ (fu → bu)" },
      { kana: "べ", romaji: "be", hint: "voiced へ (he → be)" },
      { kana: "ぼ", romaji: "bo", hint: "voiced ほ (ho → bo)" },
    ],
    anchorWords: [
      { kana: "ともだち", romaji: "tomodachi", meaning: "friend" },
      { kana: "でんわ", romaji: "denwa", meaning: "telephone" },
      { kana: "たべる", romaji: "taberu", meaning: "to eat" },
      { kana: "ぶた", romaji: "buta", meaning: "pig" },
    ],
    audioPick: { word: "ともだち", pickIndex: 2, distractors: ["と", "の", "ぼ"] },
    build: { meaning: "friend", answer: "ともだち", decoys: ["の", "ぼ", "ぱ"] },
    // ぱん would need pa-row which lands AFTER da-ba in m2 ordering, so the
    // bread sentence is deferred to pa-row. Use a da-ba-only sentence here.
    sentencePractice: [
      {
        prompt: "It's a friend.",
        target: "ともだち です",
        correctOrder: ["ともだち", "です"],
        decoys: ["でんわ", "ぶた"],
      },
    ],
  },
  {
    id: "pa",
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
      { kana: "えんぴつ", romaji: "enpitsu", meaning: "pencil" },
      { kana: "さんぽ", romaji: "sanpo", meaning: "walk / stroll" },
    ],
    audioPick: { word: "ぱん", pickIndex: 0, distractors: ["ば", "は", "ぽ"] },
    build: { meaning: "bread", answer: "ぱん", decoys: ["ば", "ん", "は"] },
    sentenceExamples: [
      {
        kana: "ぷ",
        sentence: "プリン / ペン",
        reading: "purin / pen",
        meaning: "ぷ and ぺ mostly appear in katakana loanwords like プリン (pudding) and ペン (pen). You'll meet them properly in katakana.",
      },
    ],
    sentencePractice: [
      {
        prompt: "I eat bread.",
        target: "ぱん を たべる",
        correctOrder: ["ぱん", "を", "たべる"],
        decoys: ["みず", "ともだち"],
      },
    ],
  },
];

/**
 * Yōon (拗音) — combination kana. A consonant kana shrinks the following
 * や/ゆ/よ into ゃ/ゅ/ょ so the pair pronounces as a single mora:
 * き + ゃ → きゃ (kya). 33 total: 11 consonant onsets × 3 small-y endings.
 *
 * Pedagogically grouped 3 consonants per lesson (~9 yōon each) so each
 * lesson is the same shape as the basic-row lessons.
 */
export const YOON_ROWS: RowDef[] = [
  {
    id: "yo-k",
    title: "Yōon 1: きゃ・きゅ・きょ",
    intro:
      "Small ゃゅょ stuck to a consonant kana = one syllable. き + ゃ → きゃ (kya).",
    introduces: [
      { kana: "きゃ", romaji: "kya", hint: "ki + small ya — one syllable 'kya'" },
      { kana: "きゅ", romaji: "kyu", hint: "ki + small yu — 'kyu'" },
      { kana: "きょ", romaji: "kyo", hint: "ki + small yo — 'kyo'" },
    ],
    anchorWords: [
      { kana: "きょう", romaji: "kyou", meaning: "today" },
      { kana: "きゃく", romaji: "kyaku", meaning: "guest / customer" },
      { kana: "きゅう", romaji: "kyuu", meaning: "nine" },
    ],
    audioPick: { word: "きょう", pickIndex: 0, distractors: ["きゃ", "きゅ", "しゃ"] },
    build: { meaning: "today", answer: "きょう", decoys: ["きゃ", "きゅ", "う"] },
  },
  {
    id: "yo-sh-ch",
    title: "Yōon 2: しゃ・ちゃ families",
    intro:
      "Same rule for s and t consonants. し + ゃ → しゃ. ち + ゃ → ちゃ.",
    introduces: [
      { kana: "しゃ", romaji: "sha", hint: "shi + small ya — 'sha'" },
      { kana: "しゅ", romaji: "shu", hint: "shi + small yu — 'shu'" },
      { kana: "しょ", romaji: "sho", hint: "shi + small yo — 'sho'" },
      { kana: "ちゃ", romaji: "cha", hint: "chi + small ya — 'cha'" },
      { kana: "ちゅ", romaji: "chu", hint: "chi + small yu — 'chu'" },
      { kana: "ちょ", romaji: "cho", hint: "chi + small yo — 'cho'" },
    ],
    anchorWords: [
      { kana: "しゃしん", romaji: "shashin", meaning: "photograph" },
      { kana: "しゅみ", romaji: "shumi", meaning: "hobby" },
      { kana: "おちゃ", romaji: "ocha", meaning: "tea" },
      { kana: "ちょっと", romaji: "chotto", meaning: "a little" },
      { kana: "ちゅうい", romaji: "chuui", meaning: "caution" },
    ],
    audioPick: { word: "しゃしん", pickIndex: 0, distractors: ["ちゃ", "しゅ", "ちょ"] },
    build: { meaning: "tea", answer: "おちゃ", decoys: ["ちょ", "しゃ", "ちゅ"] },
    sentencePractice: [
      {
        prompt: "It's tea.",
        target: "おちゃ です",
        correctOrder: ["おちゃ", "です"],
        decoys: ["しゃしん", "しゅみ"],
      },
    ],
  },
  {
    id: "yo-g-j",
    title: "Yōon 3: ぎゃ・じゃ families",
    intro:
      "Dakuten yōon — same rule, voiced consonant. ぎ + ゃ → ぎゃ. じ + ゃ → じゃ.",
    introduces: [
      { kana: "ぎゃ", romaji: "gya", hint: "gi + small ya — 'gya'" },
      { kana: "ぎゅ", romaji: "gyu", hint: "gi + small yu — 'gyu'" },
      { kana: "ぎょ", romaji: "gyo", hint: "gi + small yo — 'gyo'" },
      { kana: "じゃ", romaji: "ja", hint: "ji + small ya — 'ja'" },
      { kana: "じゅ", romaji: "ju", hint: "ji + small yu — 'ju'" },
      { kana: "じょ", romaji: "jo", hint: "ji + small yo — 'jo'" },
    ],
    anchorWords: [
      { kana: "ぎゅうにゅう", romaji: "gyuunyuu", meaning: "milk" },
      { kana: "じゅう", romaji: "juu", meaning: "ten" },
      { kana: "じょうず", romaji: "jouzu", meaning: "skillful" },
    ],
    audioPick: { word: "じゅう", pickIndex: 0, distractors: ["じゃ", "じょ", "ぎゅ"] },
    build: { meaning: "ten", answer: "じゅう", decoys: ["じゃ", "じょ", "う"] },
    sentencePractice: [
      {
        prompt: "It's ten.",
        target: "じゅう です",
        correctOrder: ["じゅう", "です"],
        decoys: ["じょうず", "ぎゅうにゅう"],
      },
    ],
  },
  {
    id: "yo-n-h-m-r",
    title: "Yōon 4: にゃ・ひゃ・みゃ・りゃ (rare)",
    intro:
      "These yōon are genuinely rare — you'll meet them in the wild but they don't all get their own everyday word. Recognition is the bar here.",
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
      { kana: "りゅう", romaji: "ryuu", meaning: "dragon" },
      { kana: "りょこう", romaji: "ryokou", meaning: "trip / travel" },
    ],
    audioPick: { word: "ひゃく", pickIndex: 0, distractors: ["ひゅ", "ひょ", "きゃ"] },
    build: { meaning: "hundred", answer: "ひゃく", decoys: ["ひゅ", "く", "ひょ"] },
  },
  {
    id: "yo-b-p",
    title: "Yōon 5: びゃ・ぴゃ (rare)",
    intro:
      "Same idea with b and p. Mostly びょういん (hospital) and びょうき (sick) here — the rest are recognition-only.",
    introduces: [
      { kana: "びゃ", romaji: "bya", hint: "bi + small ya — 'bya'" },
      { kana: "びゅ", romaji: "byu", hint: "bi + small yu — 'byu'" },
      { kana: "びょ", romaji: "byo", hint: "bi + small yo — 'byo'" },
      { kana: "ぴゃ", romaji: "pya", hint: "pi + small ya — 'pya'" },
      { kana: "ぴゅ", romaji: "pyu", hint: "pi + small yu — 'pyu'" },
      { kana: "ぴょ", romaji: "pyo", hint: "pi + small yo — 'pyo'" },
    ],
    anchorWords: [
      { kana: "びょういん", romaji: "byouin", meaning: "hospital" },
      { kana: "びょうき", romaji: "byouki", meaning: "illness / sick" },
    ],
    audioPick: { word: "びょういん", pickIndex: 0, distractors: ["びゃ", "びゅ", "ぴょ"] },
    // Decoys are mora-form to match the tokenized answer tiles (びょういん → [びょ, う, い, ん]).
    build: { meaning: "hospital", answer: "びょういん", decoys: ["びゃ", "ぴょ", "ぴゅ"] },
  },
];

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
