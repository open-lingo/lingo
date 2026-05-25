export type VerbGroup = "ichidan" | "godan" | "irregular";

export type ConjugationForm =
  | "masu"
  | "masu-neg"
  | "masu-past"
  | "masu-past-neg"
  | "nai"
  | "ta"
  | "te"
  | "tai"
  | "dictionary";

export type VerbEntry = {
  id: string;
  dictionary: string;
  meaning: string;
  group: VerbGroup;
  forms: Record<ConjugationForm, string>;
  introducedAtModule: number;
};

export type AdjType = "i-adj" | "na-adj";

export type AdjForm =
  | "present"
  | "negative"
  | "past"
  | "past-negative";

export type AdjEntry = {
  id: string;
  dictionary: string;
  meaning: string;
  type: AdjType;
  forms: Record<AdjForm, string>;
  introducedAtModule: number;
};

// --- Verbs (M7+) ---

export const VERB_ENTRIES: VerbEntry[] = [
  // Ichidan (る-verbs)
  {
    id: "taberu",
    dictionary: "たべる",
    meaning: "to eat",
    group: "ichidan",
    forms: {
      dictionary: "たべる",
      masu: "たべます",
      "masu-neg": "たべません",
      "masu-past": "たべました",
      "masu-past-neg": "たべませんでした",
      nai: "たべない",
      ta: "たべた",
      te: "たべて",
      tai: "たべたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "miru",
    dictionary: "みる",
    meaning: "to see / watch",
    group: "ichidan",
    forms: {
      dictionary: "みる",
      masu: "みます",
      "masu-neg": "みません",
      "masu-past": "みました",
      "masu-past-neg": "みませんでした",
      nai: "みない",
      ta: "みた",
      te: "みて",
      tai: "みたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "neru",
    dictionary: "ねる",
    meaning: "to sleep",
    group: "ichidan",
    forms: {
      dictionary: "ねる",
      masu: "ねます",
      "masu-neg": "ねません",
      "masu-past": "ねました",
      "masu-past-neg": "ねませんでした",
      nai: "ねない",
      ta: "ねた",
      te: "ねて",
      tai: "ねたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "okiru",
    dictionary: "おきる",
    meaning: "to wake up",
    group: "ichidan",
    forms: {
      dictionary: "おきる",
      masu: "おきます",
      "masu-neg": "おきません",
      "masu-past": "おきました",
      "masu-past-neg": "おきませんでした",
      nai: "おきない",
      ta: "おきた",
      te: "おきて",
      tai: "おきたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "ireru",
    dictionary: "いれる",
    meaning: "to put in",
    group: "ichidan",
    forms: {
      dictionary: "いれる",
      masu: "いれます",
      "masu-neg": "いれません",
      "masu-past": "いれました",
      "masu-past-neg": "いれませんでした",
      nai: "いれない",
      ta: "いれた",
      te: "いれて",
      tai: "いれたい",
    },
    introducedAtModule: 7,
  },

  // Godan (う-verbs)
  {
    id: "nomu",
    dictionary: "のむ",
    meaning: "to drink",
    group: "godan",
    forms: {
      dictionary: "のむ",
      masu: "のみます",
      "masu-neg": "のみません",
      "masu-past": "のみました",
      "masu-past-neg": "のみませんでした",
      nai: "のまない",
      ta: "のんだ",
      te: "のんで",
      tai: "のみたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "kaku",
    dictionary: "かく",
    meaning: "to write",
    group: "godan",
    forms: {
      dictionary: "かく",
      masu: "かきます",
      "masu-neg": "かきません",
      "masu-past": "かきました",
      "masu-past-neg": "かきませんでした",
      nai: "かかない",
      ta: "かいた",
      te: "かいて",
      tai: "かきたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "hanasu",
    dictionary: "はなす",
    meaning: "to speak",
    group: "godan",
    forms: {
      dictionary: "はなす",
      masu: "はなします",
      "masu-neg": "はなしません",
      "masu-past": "はなしました",
      "masu-past-neg": "はなしませんでした",
      nai: "はなさない",
      ta: "はなした",
      te: "はなして",
      tai: "はなしたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "matsu",
    dictionary: "まつ",
    meaning: "to wait",
    group: "godan",
    forms: {
      dictionary: "まつ",
      masu: "まちます",
      "masu-neg": "まちません",
      "masu-past": "まちました",
      "masu-past-neg": "まちませんでした",
      nai: "またない",
      ta: "まった",
      te: "まって",
      tai: "まちたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "kau",
    dictionary: "かう",
    meaning: "to buy",
    group: "godan",
    forms: {
      dictionary: "かう",
      masu: "かいます",
      "masu-neg": "かいません",
      "masu-past": "かいました",
      "masu-past-neg": "かいませんでした",
      nai: "かわない",
      ta: "かった",
      te: "かって",
      tai: "かいたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "yomu",
    dictionary: "よむ",
    meaning: "to read",
    group: "godan",
    forms: {
      dictionary: "よむ",
      masu: "よみます",
      "masu-neg": "よみません",
      "masu-past": "よみました",
      "masu-past-neg": "よみませんでした",
      nai: "よまない",
      ta: "よんだ",
      te: "よんで",
      tai: "よみたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "asobu",
    dictionary: "あそぶ",
    meaning: "to play",
    group: "godan",
    forms: {
      dictionary: "あそぶ",
      masu: "あそびます",
      "masu-neg": "あそびません",
      "masu-past": "あそびました",
      "masu-past-neg": "あそびませんでした",
      nai: "あそばない",
      ta: "あそんだ",
      te: "あそんで",
      tai: "あそびたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "shinu",
    dictionary: "しぬ",
    meaning: "to die",
    group: "godan",
    forms: {
      dictionary: "しぬ",
      masu: "しにます",
      "masu-neg": "しにません",
      "masu-past": "しにました",
      "masu-past-neg": "しにませんでした",
      nai: "しなない",
      ta: "しんだ",
      te: "しんで",
      tai: "しにたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "kaeru",
    dictionary: "かえる",
    meaning: "to return (home)",
    group: "godan",
    forms: {
      dictionary: "かえる",
      masu: "かえります",
      "masu-neg": "かえりません",
      "masu-past": "かえりました",
      "masu-past-neg": "かえりませんでした",
      nai: "かえらない",
      ta: "かえった",
      te: "かえって",
      tai: "かえりたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "oyogu",
    dictionary: "およぐ",
    meaning: "to swim",
    group: "godan",
    forms: {
      dictionary: "およぐ",
      masu: "およぎます",
      "masu-neg": "およぎません",
      "masu-past": "およぎました",
      "masu-past-neg": "およぎませんでした",
      nai: "およがない",
      ta: "およいだ",
      te: "およいで",
      tai: "およぎたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "aruku",
    dictionary: "あるく",
    meaning: "to walk",
    group: "godan",
    forms: {
      dictionary: "あるく",
      masu: "あるきます",
      "masu-neg": "あるきません",
      "masu-past": "あるきました",
      "masu-past-neg": "あるきませんでした",
      nai: "あるかない",
      ta: "あるいた",
      te: "あるいて",
      tai: "あるきたい",
    },
    introducedAtModule: 7,
  },

  // Irregular
  {
    id: "suru",
    dictionary: "する",
    meaning: "to do",
    group: "irregular",
    forms: {
      dictionary: "する",
      masu: "します",
      "masu-neg": "しません",
      "masu-past": "しました",
      "masu-past-neg": "しませんでした",
      nai: "しない",
      ta: "した",
      te: "して",
      tai: "したい",
    },
    introducedAtModule: 7,
  },
  {
    id: "kuru",
    dictionary: "くる",
    meaning: "to come",
    group: "irregular",
    forms: {
      dictionary: "くる",
      masu: "きます",
      "masu-neg": "きません",
      "masu-past": "きました",
      "masu-past-neg": "きませんでした",
      nai: "こない",
      ta: "きた",
      te: "きて",
      tai: "きたい",
    },
    introducedAtModule: 7,
  },
  {
    id: "iku",
    dictionary: "いく",
    meaning: "to go",
    group: "irregular",
    forms: {
      dictionary: "いく",
      masu: "いきます",
      "masu-neg": "いきません",
      "masu-past": "いきました",
      "masu-past-neg": "いきませんでした",
      nai: "いかない",
      ta: "いった",
      te: "いって",
      tai: "いきたい",
    },
    introducedAtModule: 7,
  },
];

// --- Adjectives (M7+) ---

export const ADJ_ENTRIES: AdjEntry[] = [
  // i-adjectives
  {
    id: "takai",
    dictionary: "たかい",
    meaning: "expensive / tall",
    type: "i-adj",
    forms: {
      present: "たかい",
      negative: "たかくない",
      past: "たかかった",
      "past-negative": "たかくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "yasui",
    dictionary: "やすい",
    meaning: "cheap",
    type: "i-adj",
    forms: {
      present: "やすい",
      negative: "やすくない",
      past: "やすかった",
      "past-negative": "やすくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "oishii",
    dictionary: "おいしい",
    meaning: "delicious",
    type: "i-adj",
    forms: {
      present: "おいしい",
      negative: "おいしくない",
      past: "おいしかった",
      "past-negative": "おいしくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "ookii",
    dictionary: "おおきい",
    meaning: "big",
    type: "i-adj",
    forms: {
      present: "おおきい",
      negative: "おおきくない",
      past: "おおきかった",
      "past-negative": "おおきくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "chiisai",
    dictionary: "ちいさい",
    meaning: "small",
    type: "i-adj",
    forms: {
      present: "ちいさい",
      negative: "ちいさくない",
      past: "ちいさかった",
      "past-negative": "ちいさくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "atsui",
    dictionary: "あつい",
    meaning: "hot",
    type: "i-adj",
    forms: {
      present: "あつい",
      negative: "あつくない",
      past: "あつかった",
      "past-negative": "あつくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "samui",
    dictionary: "さむい",
    meaning: "cold (weather)",
    type: "i-adj",
    forms: {
      present: "さむい",
      negative: "さむくない",
      past: "さむかった",
      "past-negative": "さむくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "hayai",
    dictionary: "はやい",
    meaning: "fast / early",
    type: "i-adj",
    forms: {
      present: "はやい",
      negative: "はやくない",
      past: "はやかった",
      "past-negative": "はやくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "omoshiroi",
    dictionary: "おもしろい",
    meaning: "interesting / funny",
    type: "i-adj",
    forms: {
      present: "おもしろい",
      negative: "おもしろくない",
      past: "おもしろかった",
      "past-negative": "おもしろくなかった",
    },
    introducedAtModule: 7,
  },
  {
    id: "ii",
    dictionary: "いい",
    meaning: "good",
    type: "i-adj",
    forms: {
      present: "いい",
      negative: "よくない",
      past: "よかった",
      "past-negative": "よくなかった",
    },
    introducedAtModule: 7,
  },

  // na-adjectives
  {
    id: "kirei",
    dictionary: "きれい",
    meaning: "beautiful / clean",
    type: "na-adj",
    forms: {
      present: "きれいです",
      negative: "きれいじゃないです",
      past: "きれいでした",
      "past-negative": "きれいじゃなかったです",
    },
    introducedAtModule: 7,
  },
  {
    id: "genki",
    dictionary: "げんき",
    meaning: "energetic / healthy",
    type: "na-adj",
    forms: {
      present: "げんきです",
      negative: "げんきじゃないです",
      past: "げんきでした",
      "past-negative": "げんきじゃなかったです",
    },
    introducedAtModule: 7,
  },
  {
    id: "shizuka",
    dictionary: "しずか",
    meaning: "quiet",
    type: "na-adj",
    forms: {
      present: "しずかです",
      negative: "しずかじゃないです",
      past: "しずかでした",
      "past-negative": "しずかじゃなかったです",
    },
    introducedAtModule: 7,
  },
  {
    id: "nigiyaka",
    dictionary: "にぎやか",
    meaning: "lively",
    type: "na-adj",
    forms: {
      present: "にぎやかです",
      negative: "にぎやかじゃないです",
      past: "にぎやかでした",
      "past-negative": "にぎやかじゃなかったです",
    },
    introducedAtModule: 7,
  },
  {
    id: "benri",
    dictionary: "べんり",
    meaning: "convenient",
    type: "na-adj",
    forms: {
      present: "べんりです",
      negative: "べんりじゃないです",
      past: "べんりでした",
      "past-negative": "べんりじゃなかったです",
    },
    introducedAtModule: 7,
  },
];

export const CONJUGATION_FORM_LABELS: Record<ConjugationForm, string> = {
  dictionary: "Dictionary",
  masu: "ます (polite)",
  "masu-neg": "ません (polite neg.)",
  "masu-past": "ました (polite past)",
  "masu-past-neg": "ませんでした (polite past neg.)",
  nai: "ない (plain neg.)",
  ta: "た (plain past)",
  te: "て (te-form)",
  tai: "たい (want to)",
};

export const ADJ_FORM_LABELS: Record<AdjForm, string> = {
  present: "Present",
  negative: "Negative",
  past: "Past",
  "past-negative": "Past negative",
};

export function getVerbsUpToModule(module: number): VerbEntry[] {
  return VERB_ENTRIES.filter((v) => v.introducedAtModule <= module);
}

export function getAdjsUpToModule(module: number): AdjEntry[] {
  return ADJ_ENTRIES.filter((a) => a.introducedAtModule <= module);
}
