/**
 * Single source of truth for language display + feature config.
 * Drives practice types, alphabet/character learner, intro lesson, etc.
 * Can be replaced later by loading from languages.json or API.
 */

export type PracticeType =
  | "general"
  | "particles"
  | "kanji"
  | "alphabet"
  | "components"
  | "videos";

/** One row in the practice dropdown: label + optional sample character. */
export type PracticeOption = {
  type: PracticeType;
  /** For alphabet: id for route /practice/alphabet/:id */
  id?: string;
  label: string;
  /** Shown next to label in dropdown (e.g. し, 日, 한) */
  sampleCharacter?: string;
};

/** One section of an alphabet (e.g. consonants, vowels, a-row). */
export type AlphabetSection = {
  id: string;
  name: string;
  /** Characters in this section. When omitted, section is placeholder for future content. */
  characters: string[];
};

/** Per-letter data for the 3-step learning loop: IPA, native hint, optional note/example/audio. */
export type LetterDetail = {
  /** IPA pronunciation, e.g. "/a/" */
  ipa: string;
  /** Short native-language hint (e.g. "like 'a' in 'father'"). Keep under 6 words. */
  hint: string;
  /** Optional contrast note, e.g. "not exactly English 'a'" */
  note?: string;
  /** Optional example syllable or word */
  example?: string;
  /** Asset key or URL for pronunciation audio */
  audioKey?: string;
};

export type AlphabetDef = {
  id: string;
  name: string;
  description?: string;
  /** Flat list when no sections; also used as fallback when sections omit some chars. */
  characters?: string[];
  /** When set, UI shows characters grouped by section. Otherwise a single "Characters" block uses characters[]. */
  sections?: AlphabetSection[];
  /** Optional map: character → romanization (e.g. Revised Romanization for Hangul, romaji for Japanese). */
  characterRomanization?: Record<string, string>;
  /** Per-symbol data for alphabet learner: IPA, hint, note, example, audio. Key = character. */
  letterDetails?: Record<string, LetterDetail>;
  /**
   * When true, this script ships per-stroke SVG data (see src/shared/glyphs/data)
   * and the trace UX renders numbered stroke-order guides + animation playback.
   * Latin alphabets leave this false; kana and Hangul set it true (Hangul
   * jamo stroke data lives in src/shared/glyphs/data/hangul.json). Default:
   * false (system-font reference, no stroke-order UX).
   */
  hasStrokeOrder?: boolean;
};

export type LanguageConfig = {
  id: string;
  name: string;
  flag: string;
  /** Hero/background image URL for language-specific layouts. */
  backgroundImage?: string;
  /** How to size the background in widescreen layouts. "cover" fills the area (good when image isn't wide). */
  backgroundImageFit?: "cover" | "contain";
  /** Which practice types this language supports (used when practiceOptions not set). */
  practiceTypes: PracticeType[];
  /** Dropdown options with labels and sample characters. Overrides practiceTypes when set. */
  practiceOptions?: PracticeOption[];
  /** Single alphabet (backward compat). Use alphabets when language has more than one. */
  alphabet?: AlphabetDef;
  /** Multiple alphabets (e.g. Japanese: Hiragana, Katakana). */
  alphabets?: AlphabetDef[];
  /** Japanese/Chinese: kanji/hanzi component breakdowns and meanings. */
  hasComponentBreakdown?: boolean;
  /** First lesson in Basics: "Introduction to the language concepts" (Duolingo-style apps often skip this). */
  introLessonTitle?: string;
};

// Japanese syllabaries (shared structure; used in ja config)
const JA_HIRAGANA: AlphabetDef = {
  id: "hiragana",
  name: "Hiragana",
  description: "Japanese syllabary (ひらがな)",
  hasStrokeOrder: true,
  characters: [
    "あ",
    "い",
    "う",
    "え",
    "お",
    "か",
    "き",
    "く",
    "け",
    "こ",
    "さ",
    "し",
    "す",
    "せ",
    "そ",
    "た",
    "ち",
    "つ",
    "て",
    "と",
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "は",
    "ひ",
    "ふ",
    "へ",
    "ほ",
    "ま",
    "み",
    "む",
    "め",
    "も",
    "や",
    "ゆ",
    "よ",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "わ",
    "を",
    "ん",
    "が",
    "ぎ",
    "ぐ",
    "げ",
    "ご",
    "ざ",
    "じ",
    "ず",
    "ぜ",
    "ぞ",
    "だ",
    "ぢ",
    "づ",
    "で",
    "ど",
    "ば",
    "び",
    "ぶ",
    "べ",
    "ぼ",
    "ぱ",
    "ぴ",
    "ぷ",
    "ぺ",
    "ぽ",
    "りゃ",
    "りゅ",
    "りょ",
  ],
  sections: [
    {
      id: "a-row",
      name: "あ-row (vowels)",
      characters: ["あ", "い", "う", "え", "お"],
    },
    {
      id: "ka-row",
      name: "か-row",
      characters: ["か", "き", "く", "け", "こ"],
    },
    {
      id: "sa-row",
      name: "さ-row",
      characters: ["さ", "し", "す", "せ", "そ"],
    },
    {
      id: "ta-row",
      name: "た-row",
      characters: ["た", "ち", "つ", "て", "と"],
    },
    {
      id: "na-row",
      name: "な-row",
      characters: ["な", "に", "ぬ", "ね", "の"],
    },
    {
      id: "ha-row",
      name: "は-row",
      characters: ["は", "ひ", "ふ", "へ", "ほ"],
    },
    {
      id: "ma-row",
      name: "ま-row",
      characters: ["ま", "み", "む", "め", "も"],
    },
    { id: "ya-row", name: "や-row", characters: ["や", "ゆ", "よ"] },
    {
      id: "ra-row",
      name: "ら-row",
      characters: ["ら", "り", "る", "れ", "ろ"],
    },
    { id: "wa-row", name: "わ-row", characters: ["わ", "を", "ん"] },
    {
      id: "dakuten",
      name: "Dakuten (voiced 濁音)",
      characters: [
        "が",
        "ぎ",
        "ぐ",
        "げ",
        "ご",
        "ざ",
        "じ",
        "ず",
        "ぜ",
        "ぞ",
        "だ",
        "ぢ",
        "づ",
        "で",
        "ど",
        "ば",
        "び",
        "ぶ",
        "べ",
        "ぼ",
      ],
    },
    {
      id: "handakuten",
      name: "Handakuten (half-voiced 半濁音)",
      characters: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"],
    },
    {
      id: "hiragana-yoon-ry",
      name: "Yōon combos (りゃ・りゅ・りょ)",
      characters: ["りゃ", "りゅ", "りょ"],
    },
  ],
  characterRomanization: {
    あ: "a",
    い: "i",
    う: "u",
    え: "e",
    お: "o",
    か: "ka",
    き: "ki",
    く: "ku",
    け: "ke",
    こ: "ko",
    さ: "sa",
    し: "shi",
    す: "su",
    せ: "se",
    そ: "so",
    た: "ta",
    ち: "chi",
    つ: "tsu",
    て: "te",
    と: "to",
    な: "na",
    に: "ni",
    ぬ: "nu",
    ね: "ne",
    の: "no",
    は: "ha",
    ひ: "hi",
    ふ: "fu",
    へ: "he",
    ほ: "ho",
    ま: "ma",
    み: "mi",
    む: "mu",
    め: "me",
    も: "mo",
    や: "ya",
    ゆ: "yu",
    よ: "yo",
    ら: "ra",
    り: "ri",
    る: "ru",
    れ: "re",
    ろ: "ro",
    わ: "wa",
    // Modern Hepburn pronounces を as "o" (particle); historic "wo" survives
    // only in some hiragana charts. TTS and the hint string both say "o", so
    // the romaji helper above the kana must agree.
    を: "o",
    ん: "n",
    が: "ga",
    ぎ: "gi",
    ぐ: "gu",
    げ: "ge",
    ご: "go",
    ざ: "za",
    じ: "ji",
    ず: "zu",
    ぜ: "ze",
    ぞ: "zo",
    だ: "da",
    ぢ: "ji",
    づ: "zu",
    で: "de",
    ど: "do",
    ば: "ba",
    び: "bi",
    ぶ: "bu",
    べ: "be",
    ぼ: "bo",
    ぱ: "pa",
    ぴ: "pi",
    ぷ: "pu",
    ぺ: "pe",
    ぽ: "po",
    // Yōon (combination kana) — consonant + small ゃ/ゅ/ょ, one mora each.
    きゃ: "kya", きゅ: "kyu", きょ: "kyo",
    しゃ: "sha", しゅ: "shu", しょ: "sho",
    ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
    にゃ: "nya", にゅ: "nyu", にょ: "nyo",
    ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
    みゃ: "mya", みゅ: "myu", みょ: "myo",
    りゃ: "rya", りゅ: "ryu", りょ: "ryo",
    ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
    じゃ: "ja", じゅ: "ju", じょ: "jo",
    びゃ: "bya", びゅ: "byu", びょ: "byo",
    ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  },
  letterDetails: {
    あ: { ipa: "/a/", hint: "like 'a' in 'father'", example: "あめ (rain)" },
    い: { ipa: "/i/", hint: "like 'ee' in 'see'", example: "いぬ (dog)" },
    う: { ipa: "/ɯ/", hint: "like 'oo' in 'food'", note: "lips unrounded" },
    え: { ipa: "/e/", hint: "like 'e' in 'bed'", example: "え (picture)" },
    お: { ipa: "/o/", hint: "like 'o' in 'or'", example: "おかね (money)" },
    りゃ: {
      ipa: "/ɾʲa/",
      hint: "rya (r + small ya)",
      example: "りゃく (ryaku, abbreviation)",
      note: "Combination of り + small ゃ",
    },
    りゅ: {
      ipa: "/ɾʲu/",
      hint: "ryu (r + small yu)",
      example: "りゅう (ryū, dragon)",
      note: "Combination of り + small ゅ",
    },
    りょ: {
      ipa: "/ɾʲo/",
      hint: "ryo (r + small yo)",
      example: "りょう (ryō, quantity)",
      note: "Combination of り + small ょ",
    },
  },
};

const JA_KATAKANA: AlphabetDef = {
  id: "katakana",
  name: "Katakana",
  description: "Japanese syllabary (カタカナ)",
  hasStrokeOrder: true,
  characters: [
    "ア",
    "イ",
    "ウ",
    "エ",
    "オ",
    "カ",
    "キ",
    "ク",
    "ケ",
    "コ",
    "サ",
    "シ",
    "ス",
    "セ",
    "ソ",
    "タ",
    "チ",
    "ツ",
    "テ",
    "ト",
    "ナ",
    "ニ",
    "ヌ",
    "ネ",
    "ノ",
    "ハ",
    "ヒ",
    "フ",
    "ヘ",
    "ホ",
    "マ",
    "ミ",
    "ム",
    "メ",
    "モ",
    "ヤ",
    "ユ",
    "ヨ",
    "ラ",
    "リ",
    "ル",
    "レ",
    "ロ",
    "ワ",
    "ヲ",
    "ン",
    "ガ",
    "ギ",
    "グ",
    "ゲ",
    "ゴ",
    "ザ",
    "ジ",
    "ズ",
    "ゼ",
    "ゾ",
    "ダ",
    "ヂ",
    "ヅ",
    "デ",
    "ド",
    "バ",
    "ビ",
    "ブ",
    "ベ",
    "ボ",
    "パ",
    "ピ",
    "プ",
    "ペ",
    "ポ",
    "リャ",
    "リュ",
    "リョ",
  ],
  sections: [
    {
      id: "a-row",
      name: "ア-row (vowels)",
      characters: ["ア", "イ", "ウ", "エ", "オ"],
    },
    {
      id: "ka-row",
      name: "カ-row",
      characters: ["カ", "キ", "ク", "ケ", "コ"],
    },
    {
      id: "sa-row",
      name: "サ-row",
      characters: ["サ", "シ", "ス", "セ", "ソ"],
    },
    {
      id: "ta-row",
      name: "タ-row",
      characters: ["タ", "チ", "ツ", "テ", "ト"],
    },
    {
      id: "na-row",
      name: "ナ-row",
      characters: ["ナ", "ニ", "ヌ", "ネ", "ノ"],
    },
    {
      id: "ha-row",
      name: "ハ-row",
      characters: ["ハ", "ヒ", "フ", "ヘ", "ホ"],
    },
    {
      id: "ma-row",
      name: "マ-row",
      characters: ["マ", "ミ", "ム", "メ", "モ"],
    },
    { id: "ya-row", name: "ヤ-row", characters: ["ヤ", "ユ", "ヨ"] },
    {
      id: "ra-row",
      name: "ラ-row",
      characters: ["ラ", "リ", "ル", "レ", "ロ"],
    },
    { id: "wa-row", name: "ワ-row", characters: ["ワ", "ヲ", "ン"] },
    {
      id: "dakuten",
      name: "Dakuten (voiced 濁音)",
      characters: [
        "ガ",
        "ギ",
        "グ",
        "ゲ",
        "ゴ",
        "ザ",
        "ジ",
        "ズ",
        "ゼ",
        "ゾ",
        "ダ",
        "ヂ",
        "ヅ",
        "デ",
        "ド",
        "バ",
        "ビ",
        "ブ",
        "ベ",
        "ボ",
      ],
    },
    {
      id: "handakuten",
      name: "Handakuten (half-voiced 半濁音)",
      characters: ["パ", "ピ", "プ", "ペ", "ポ"],
    },
    {
      id: "katakana-yoon-ry",
      name: "Yōon combos (リャ・リュ・リョ)",
      characters: ["リャ", "リュ", "リョ"],
    },
  ],
  characterRomanization: {
    ア: "a",
    イ: "i",
    ウ: "u",
    エ: "e",
    オ: "o",
    カ: "ka",
    キ: "ki",
    ク: "ku",
    ケ: "ke",
    コ: "ko",
    サ: "sa",
    シ: "shi",
    ス: "su",
    セ: "se",
    ソ: "so",
    タ: "ta",
    チ: "chi",
    ツ: "tsu",
    テ: "te",
    ト: "to",
    ナ: "na",
    ニ: "ni",
    ヌ: "nu",
    ネ: "ne",
    ノ: "no",
    ハ: "ha",
    ヒ: "hi",
    フ: "fu",
    ヘ: "he",
    ホ: "ho",
    マ: "ma",
    ミ: "mi",
    ム: "mu",
    メ: "me",
    モ: "mo",
    ヤ: "ya",
    ユ: "yu",
    ヨ: "yo",
    ラ: "ra",
    リ: "ri",
    ル: "ru",
    レ: "re",
    ロ: "ro",
    ワ: "wa",
    ヲ: "o",
    ン: "n",
    ガ: "ga",
    ギ: "gi",
    グ: "gu",
    ゲ: "ge",
    ゴ: "go",
    ザ: "za",
    ジ: "ji",
    ズ: "zu",
    ゼ: "ze",
    ゾ: "zo",
    ダ: "da",
    ヂ: "ji",
    ヅ: "zu",
    デ: "de",
    ド: "do",
    バ: "ba",
    ビ: "bi",
    ブ: "bu",
    ベ: "be",
    ボ: "bo",
    パ: "pa",
    ピ: "pi",
    プ: "pu",
    ペ: "pe",
    ポ: "po",
    リャ: "rya",
    リュ: "ryu",
    リョ: "ryo",
  },
};

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  ko: {
    id: "ko",
    name: "Korean",
    flag: "🇰🇷",
    backgroundImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/View_of_Seoul.jpg/1280px-View_of_Seoul.jpg",
    practiceTypes: ["general", "particles", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "particles", label: "Particle practice" },
      {
        type: "alphabet",
        id: "hangul",
        label: "Hangul (Alphabet)",
        sampleCharacter: "한",
      },
      { type: "videos", label: "Videos", sampleCharacter: "🎬" },
    ],
    alphabet: {
      id: "hangul",
      name: "Hangul",
      description: "Korean alphabet",
      hasStrokeOrder: true,
      characters: [
        "ㄱ",
        "ㄴ",
        "ㄷ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅅ",
        "ㅇ",
        "ㅈ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ",
        "ㄲ",
        "ㄸ",
        "ㅃ",
        "ㅆ",
        "ㅉ",
        "ㅏ",
        "ㅓ",
        "ㅗ",
        "ㅜ",
        "ㅡ",
        "ㅣ",
        "ㅑ",
        "ㅕ",
        "ㅛ",
        "ㅠ",
        "ㅐ",
        "ㅔ",
        "ㅒ",
        "ㅖ",
        "ㅘ",
        "ㅙ",
        "ㅚ",
        "ㅝ",
        "ㅞ",
        "ㅟ",
        "ㅢ",
      ],
      sections: [
        {
          id: "consonants-plain",
          name: "Plain consonants (기본 자음)",
          characters: [
            "ㄱ",
            "ㄴ",
            "ㄷ",
            "ㄹ",
            "ㅁ",
            "ㅂ",
            "ㅅ",
            "ㅇ",
            "ㅈ",
            "ㅎ",
          ],
        },
        {
          id: "consonants-aspirated",
          name: "Aspirated consonants (거센소리)",
          characters: ["ㅊ", "ㅋ", "ㅌ", "ㅍ"],
        },
        {
          id: "consonants-tense",
          name: "Tense consonants (쌍자음)",
          characters: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"],
        },
        {
          id: "vowels-basic",
          name: "Basic vowels (기본 모음)",
          characters: ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"],
        },
        {
          id: "vowels-y",
          name: "Y-vowels (y 모음)",
          characters: ["ㅑ", "ㅕ", "ㅛ", "ㅠ"],
        },
        {
          id: "vowels-compound",
          name: "Compound vowels (복합 모음)",
          characters: [
            "ㅐ",
            "ㅔ",
            "ㅒ",
            "ㅖ",
            "ㅘ",
            "ㅙ",
            "ㅚ",
            "ㅝ",
            "ㅞ",
            "ㅟ",
            "ㅢ",
          ],
        },
      ],
      characterRomanization: {
        ㄱ: "g",
        ㄴ: "n",
        ㄷ: "d",
        ㄹ: "l",
        ㅁ: "m",
        ㅂ: "b",
        ㅅ: "s",
        ㅇ: "ng",
        ㅈ: "j",
        ㅎ: "h",
        ㅊ: "ch",
        ㅋ: "k",
        ㅌ: "t",
        ㅍ: "p",
        ㄲ: "kk",
        ㄸ: "tt",
        ㅃ: "pp",
        ㅆ: "ss",
        ㅉ: "jj",
        ㅏ: "a",
        ㅓ: "eo",
        ㅗ: "o",
        ㅜ: "u",
        ㅡ: "eu",
        ㅣ: "i",
        ㅑ: "ya",
        ㅕ: "yeo",
        ㅛ: "yo",
        ㅠ: "yu",
        ㅐ: "ae",
        ㅔ: "e",
        ㅒ: "yae",
        ㅖ: "ye",
        ㅘ: "wa",
        ㅙ: "wae",
        ㅚ: "oe",
        ㅝ: "wo",
        ㅞ: "we",
        ㅟ: "wi",
        ㅢ: "ui",
      },
      // First Hangul lesson: plain consonants + basic vowels with audio keys.
      letterDetails: {
        // Plain consonants (기본 자음)
        ㄱ: {
          ipa: "/k ~ g/",
          hint: "g / k",
          note: "Like 'g' in 'go' or 'k' in 'skill'",
          example: "가 (ga)",
          audioKey: "g",
        },
        ㄴ: {
          ipa: "/n/",
          hint: "n",
          example: "나 (na)",
          audioKey: "n",
        },
        ㄷ: {
          ipa: "/t ~ d/",
          hint: "d / t",
          note: "Like 'd' in 'dog' or 't' in 'star'",
          example: "다 (da)",
          audioKey: "d",
        },
        ㄹ: {
          ipa: "/ɾ ~ l/",
          hint: "r / l",
          note: "Flap like Spanish 'r' or 'l' at end",
          example: "라 (ra)",
          audioKey: "l",
        },
        ㅁ: {
          ipa: "/m/",
          hint: "m",
          example: "마 (ma)",
          audioKey: "m",
        },
        ㅂ: {
          ipa: "/p ~ b/",
          hint: "b / p",
          note: "Between 'b' and unaspirated 'p'",
          example: "바 (ba)",
          audioKey: "b",
        },
        ㅅ: {
          ipa: "/s/",
          hint: "s",
          note: "Like 's' in 'see'",
          example: "사 (sa)",
          audioKey: "s",
        },
        ㅇ: {
          ipa: "/∅ ~ ŋ/",
          hint: "silent / ng",
          note: "Silent at start; 'ng' at end",
          example: "아 (a), 강 (gang)",
          audioKey: "ng",
        },
        ㅈ: {
          ipa: "/tɕ/",
          hint: "j / ch",
          note: "Like 'j' in 'jog' (soft 'ch')",
          example: "자 (ja)",
          audioKey: "j",
        },
        ㅎ: {
          ipa: "/h/",
          hint: "h",
          example: "하 (ha)",
          audioKey: "h",
        },

        // Basic vowels (기본 모음)
        ㅏ: {
          ipa: "/a/",
          hint: "like 'a' in 'father'",
          example: "가 (ga)",
          audioKey: "a",
        },
        ㅓ: {
          ipa: "/ʌ/ (eo)",
          hint: "like 'uh' in 'sun'",
          example: "거 (geo)",
          audioKey: "eo",
        },
        ㅗ: {
          ipa: "/o/",
          hint: "like 'o' in 'so'",
          example: "고 (go)",
          audioKey: "o",
        },
        ㅜ: {
          ipa: "/u/",
          hint: "like 'oo' in 'food'",
          example: "구 (gu)",
          audioKey: "u",
        },
        ㅡ: {
          ipa: "/ɯ/ (eu)",
          hint: "like 'eu' in 'put' (unrounded)",
          example: "그 (geu)",
          audioKey: "eu",
        },
        ㅣ: {
          ipa: "/i/",
          hint: "like 'ee' in 'see'",
          example: "기 (gi)",
          audioKey: "i",
        },
      },
    },
    introLessonTitle: "Introduction to Korean",
  },
  ja: {
    id: "ja",
    name: "Japanese",
    flag: "🇯🇵",
    backgroundImage:
      "https://upload.wikimedia.org/wikipedia/commons/7/71/12-Chureito-pagoda-and-Mount-Fuji-Japan_%2829677439878%29.jpg",
    backgroundImageFit: "cover",
    practiceTypes: ["general", "particles", "kanji", "alphabet", "components"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "particles", label: "Particle practice" },
      { type: "kanji", label: "Kanji (Characters)", sampleCharacter: "日" },
      {
        type: "alphabet",
        id: "hiragana",
        label: "Hiragana (Alphabet)",
        sampleCharacter: "し",
      },
      {
        type: "alphabet",
        id: "katakana",
        label: "Katakana (Alphabet)",
        sampleCharacter: "シ",
      },
      { type: "components", label: "Character components" },
      { type: "videos", label: "Videos", sampleCharacter: "🎬" },
    ],
    alphabets: [JA_HIRAGANA, JA_KATAKANA],
    alphabet: JA_HIRAGANA,
    hasComponentBreakdown: true,
    introLessonTitle: "Introduction to Japanese",
  },
  zh: {
    id: "zh",
    name: "Chinese",
    flag: "🇨🇳",
    practiceTypes: ["general", "kanji", "alphabet", "components"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      { type: "kanji", label: "Characters (汉字)", sampleCharacter: "字" },
      {
        type: "alphabet",
        id: "pinyin",
        label: "Pinyin (Alphabet)",
        sampleCharacter: "a",
      },
      { type: "components", label: "Character components" },
    ],
    alphabet: {
      id: "pinyin",
      name: "Pinyin",
      description: "Romanization",
    },
    hasComponentBreakdown: true,
    introLessonTitle: "Introduction to Chinese",
  },
  es: {
    id: "es",
    name: "Spanish",
    flag: "🇪🇸",
    practiceTypes: ["general", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      {
        type: "alphabet",
        id: "spanish-alphabet",
        label: "Spanish (Alphabet)",
        sampleCharacter: "ñ",
      },
    ],
    alphabet: {
      id: "spanish-alphabet",
      name: "Spanish alphabet",
      description: "Letters and sounds",
    },
    introLessonTitle: "Introduction to Spanish",
  },
  de: {
    id: "de",
    name: "German",
    flag: "🇩🇪",
    practiceTypes: ["general", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      {
        type: "alphabet",
        id: "german-alphabet",
        label: "German (Alphabet)",
        sampleCharacter: "ß",
      },
    ],
    alphabet: {
      id: "german-alphabet",
      name: "German alphabet",
      description: "Letters and sounds",
    },
    introLessonTitle: "Introduction to German",
  },
  fr: {
    id: "fr",
    name: "French",
    flag: "🇫🇷",
    practiceTypes: ["general", "alphabet"],
    practiceOptions: [
      { type: "general", label: "General practice" },
      {
        type: "alphabet",
        id: "french-alphabet",
        label: "French (Alphabet)",
        sampleCharacter: "é",
      },
    ],
    alphabet: {
      id: "french-alphabet",
      name: "French alphabet",
      description: "Letters and sounds",
    },
    introLessonTitle: "Introduction to French",
  },
  en: {
    id: "en",
    name: "English",
    flag: "🇺🇸",
    practiceTypes: ["general"],
    practiceOptions: [{ type: "general", label: "General practice" }],
    introLessonTitle: "Introduction to English",
  },
};

export function getLanguageConfig(
  languageId: string,
): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[languageId];
}

/** List for picker; derived from config. */
export const LANGUAGES = Object.values(LANGUAGE_CONFIGS);

/** Languages that currently have content (flashcards, stories, etc). Only these appear in the learning language selector. */
export const AVAILABLE_LEARNING_LANGUAGE_IDS = ["ko", "ja"] as const;
export const AVAILABLE_LEARNING_LANGUAGES = LANGUAGES.filter((l) =>
  (AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]).includes(l.id),
);

export function getLanguageById(id: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[id];
}

/** Resolve alphabet by id (path or query). Checks alphabets[] then alphabet. */
export function getAlphabetById(
  languageId: string,
  alphabetId: string,
): AlphabetDef | undefined {
  const config = LANGUAGE_CONFIGS[languageId];
  const fromArray = config?.alphabets?.find((a) => a.id === alphabetId);
  if (fromArray) return fromArray;
  const single = config?.alphabet;
  return single?.id === alphabetId ? single : undefined;
}

/** Sections to display: alphabet.sections if present, else one section from alphabet.characters. */
export function getAlphabetDisplaySections(
  alphabet: AlphabetDef,
): AlphabetSection[] {
  if (alphabet.sections?.length) return alphabet.sections;
  const chars = alphabet.characters;
  if (chars?.length)
    return [{ id: "all", name: "Characters", characters: chars }];
  return [];
}

/** All alphabets for a language (for dropdown / multiple scripts). */
export function getAlphabetsForLanguage(languageId: string): AlphabetDef[] {
  const config = LANGUAGE_CONFIGS[languageId];
  if (config?.alphabets?.length) return config.alphabets;
  if (config?.alphabet) return [config.alphabet];
  return [];
}

/** Build shareable alphabet URL: /practice/alphabet/:id or /practice/alphabet?name=:id */
export function alphabetPracticePath(
  alphabetId: string,
  useQuery = false,
): string {
  return useQuery
    ? `/practice/alphabet?name=${encodeURIComponent(alphabetId)}`
    : `/practice/alphabet/${encodeURIComponent(alphabetId)}`;
}
