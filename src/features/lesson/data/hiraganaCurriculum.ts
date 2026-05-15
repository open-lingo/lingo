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
      { kana: "いか", romaji: "ika", meaning: "squid" },
      { kana: "きく", romaji: "kiku", meaning: "to listen / chrysanthemum" },
      { kana: "こえ", romaji: "koe", meaning: "voice" },
      { kana: "かい", romaji: "kai", meaning: "shellfish" },
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
      { kana: "いす", romaji: "isu", meaning: "chair" },
      { kana: "すし", romaji: "sushi", meaning: "sushi" },
      { kana: "あし", romaji: "ashi", meaning: "foot" },
      { kana: "しお", romaji: "shio", meaning: "salt" },
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
      { kana: "たこ", romaji: "tako", meaning: "octopus" },
      { kana: "いち", romaji: "ichi", meaning: "one" },
      { kana: "つき", romaji: "tsuki", meaning: "moon" },
      { kana: "て", romaji: "te", meaning: "hand" },
      { kana: "あつい", romaji: "atsui", meaning: "hot" },
    ],
    audioPick: { word: "つき", pickIndex: 0, distractors: ["し", "う", "ち"] },
    build: { meaning: "octopus", answer: "たこ", decoys: ["な", "き", "ち"] },
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
      { kana: "なに", romaji: "nani", meaning: "what" },
      { kana: "いぬ", romaji: "inu", meaning: "dog" },
      { kana: "ねこ", romaji: "neko", meaning: "cat" },
      { kana: "なつ", romaji: "natsu", meaning: "summer" },
      { kana: "おかね", romaji: "okane", meaning: "money" },
    ],
    audioPick: { word: "ねこ", pickIndex: 0, distractors: ["れ", "の", "わ"] },
    build: { meaning: "cat", answer: "ねこ", decoys: ["ぬ", "の", "き"] },
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
      { kana: "はな", romaji: "hana", meaning: "flower / nose" },
      { kana: "はし", romaji: "hashi", meaning: "chopsticks" },
      { kana: "ふね", romaji: "fune", meaning: "boat" },
      { kana: "ひと", romaji: "hito", meaning: "person" },
      { kana: "ほし", romaji: "hoshi", meaning: "star" },
    ],
    audioPick: { word: "はな", pickIndex: 0, distractors: ["ほ", "ま", "ぱ"] },
    build: { meaning: "flower", answer: "はな", decoys: ["ほ", "な", "に"] },
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
      { kana: "まめ", romaji: "mame", meaning: "bean" },
      { kana: "もも", romaji: "momo", meaning: "peach" },
      { kana: "むし", romaji: "mushi", meaning: "insect" },
      { kana: "あめ", romaji: "ame", meaning: "rain / candy" },
    ],
    audioPick: { word: "みみ", pickIndex: 0, distractors: ["ゆ", "む", "に"] },
    build: { meaning: "peach", answer: "もも", decoys: ["し", "ま", "の"] },
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
      { kana: "ゆめ", romaji: "yume", meaning: "dream" },
      { kana: "ゆき", romaji: "yuki", meaning: "snow" },
      { kana: "やね", romaji: "yane", meaning: "roof" },
    ],
    audioPick: { word: "やま", pickIndex: 0, distractors: ["か", "わ", "ま"] },
    build: { meaning: "mountain", answer: "やま", decoys: ["か", "ね", "き"] },
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
      { kana: "よる", romaji: "yoru", meaning: "night" },
      { kana: "はる", romaji: "haru", meaning: "spring (season)" },
      { kana: "とり", romaji: "tori", meaning: "bird" },
      { kana: "くろ", romaji: "kuro", meaning: "black" },
    ],
    audioPick: { word: "とり", pickIndex: 1, distractors: ["い", "り", "う"] },
    build: { meaning: "spring (season)", answer: "はる", decoys: ["れ", "ら", "ろ"] },
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
        romaji: "wo",
        hint: "object-marker particle (sounds like 'o')",
        note: "Only used as a particle in modern Japanese.",
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
      { kana: "さん", romaji: "san", meaning: "three / Mr./Ms." },
      { kana: "ほん", romaji: "hon", meaning: "book" },
      { kana: "きん", romaji: "kin", meaning: "gold" },
    ],
    audioPick: { word: "にほん", pickIndex: 3, distractors: ["そ", "ろ", "や"] },
    build: { meaning: "Japan", answer: "にほん", decoys: ["は", "う", "ま"] },
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
      { kana: "ごはん", romaji: "gohan", meaning: "rice / meal" },
      { kana: "かぎ", romaji: "kagi", meaning: "key" },
      { kana: "がっこう", romaji: "gakkou", meaning: "school" },
      { kana: "いちご", romaji: "ichigo", meaning: "strawberry" },
      { kana: "げんき", romaji: "genki", meaning: "energy / well" },
    ],
    audioPick: { word: "ごはん", pickIndex: 0, distractors: ["こ", "が", "ぐ"] },
    build: { meaning: "key", answer: "かぎ", decoys: ["き", "ご", "ぐ"] },
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
      { kana: "ぞう", romaji: "zou", meaning: "elephant" },
      { kana: "じこ", romaji: "jiko", meaning: "accident / oneself" },
      { kana: "かぜ", romaji: "kaze", meaning: "wind / cold (illness)" },
      { kana: "ちず", romaji: "chizu", meaning: "map" },
    ],
    audioPick: { word: "ぞう", pickIndex: 0, distractors: ["そ", "じ", "ぐ"] },
    build: { meaning: "water", answer: "みず", decoys: ["む", "ず", "し"] },
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
      { kana: "でんわ", romaji: "denwa", meaning: "telephone" },
      { kana: "まど", romaji: "mado", meaning: "window" },
      { kana: "たべる", romaji: "taberu", meaning: "to eat" },
      { kana: "ばら", romaji: "bara", meaning: "rose" },
      { kana: "ぶた", romaji: "buta", meaning: "pig" },
    ],
    audioPick: { word: "まど", pickIndex: 1, distractors: ["と", "の", "ぼ"] },
    build: { meaning: "rose", answer: "ばら", decoys: ["ぱ", "ば", "ろ"] },
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
      { kana: "えんぴつ", romaji: "enpitsu", meaning: "pencil" },
      { kana: "ぱん", romaji: "pan", meaning: "bread" },
      { kana: "さんぽ", romaji: "sanpo", meaning: "walk / stroll" },
      { kana: "ぴあの", romaji: "piano", meaning: "piano" },
      { kana: "てんぷら", romaji: "tenpura", meaning: "tempura" },
    ],
    audioPick: { word: "ぱん", pickIndex: 0, distractors: ["ば", "は", "ぽ"] },
    build: { meaning: "bread", answer: "ぱん", decoys: ["ば", "ん", "は"] },
  },
];

export const ALL_ROWS = [...HIRAGANA_ROWS, ...DAKUTEN_ROWS];

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
  }
  return phrases;
}
