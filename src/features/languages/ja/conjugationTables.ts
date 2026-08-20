export type VerbGroup = "ichidan" | "godan" | "irregular";

export type ConjugationForm =
  | "dictionary"
  | "masu"
  | "masu-neg"
  | "masu-past"
  | "masu-past-neg"
  | "nai"
  | "ta"
  | "te"
  | "tai";

export type VerbEntry = {
  id: string;
  dictionary: string;
  /**
   * Standard written (kanji) dictionary form, e.g. たべる → 食べる. OMITTED for
   * words conventionally written in kana (する、いる…). Structural contract
   * (enforced by writtenForms.test.ts): a leading kanji block replacing a
   * nonempty kana prefix + a kana tail identical to `dictionary`'s tail —
   * conjugated written forms are derived by prefix substitution
   * (`writtenForms.ts`), so mid-word kanji is not representable here.
   */
  kanji?: string;
  meaning: string;
  group: VerbGroup;
  forms: Record<ConjugationForm, string>;
  introducedAtModule: number;
};

export type AdjForm = "present" | "negative" | "past" | "past-negative";

export type AdjEntry = {
  id: string;
  dictionary: string;
  /** Standard written (kanji) dictionary form — same contract as VerbEntry.kanji. */
  kanji?: string;
  meaning: string;
  type: "i-adj" | "na-adj";
  forms: Record<AdjForm, string>;
  introducedAtModule: number;
};

export const CONJUGATION_FORM_LABELS: Record<ConjugationForm, string> = {
  dictionary: "Dictionary",
  masu: "ます form",
  "masu-neg": "ません",
  "masu-past": "ました",
  "masu-past-neg": "ませんでした",
  nai: "ない form",
  ta: "た form",
  te: "て form",
  tai: "たい form",
};

export const ADJ_FORM_LABELS: Record<AdjForm, string> = {
  present: "Present",
  negative: "Negative",
  past: "Past",
  "past-negative": "Past negative",
};

// ─── Verbs ────────────────────────────────────────────────────────────

export const VERB_ENTRIES: VerbEntry[] = [
  // ═══ M7 verbs ═══════════════════════════════════════════════════════

  // Ichidan
  {
    id: "taberu",
    dictionary: "たべる",
    kanji: "食べる",
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
    kanji: "見る",
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

  // Godan
  {
    id: "nomu",
    dictionary: "のむ",
    kanji: "飲む",
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
    id: "iku",
    dictionary: "いく",
    kanji: "行く",
    meaning: "to go",
    group: "godan",
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
  {
    id: "yomu",
    dictionary: "よむ",
    kanji: "読む",
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
    id: "kaku",
    dictionary: "かく",
    kanji: "書く",
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
    // Taught by ja-m16-neo-10 (vocab pack 5, 2026-07-30 B067) — un-parked 99 → 16.
    introducedAtModule: 16,
  },
  {
    id: "tsukau",
    dictionary: "つかう",
    kanji: "使う",
    meaning: "to use",
    group: "godan",
    forms: {
      dictionary: "つかう",
      masu: "つかいます",
      "masu-neg": "つかいません",
      "masu-past": "つかいました",
      "masu-past-neg": "つかいませんでした",
      nai: "つかわない",
      ta: "つかった",
      te: "つかって",
      tai: "つかいたい",
    },
    // New row with ja-m16-neo-10 (vocab pack 5, 2026-07-30 B067) so the
    // pack's derived cells (つかって) are real lexicon surfaces.
    introducedAtModule: 16,
  },
  {
    id: "suu",
    dictionary: "すう",
    kanji: "吸う",
    meaning: "to smoke",
    group: "godan",
    forms: {
      dictionary: "すう",
      masu: "すいます",
      "masu-neg": "すいません",
      "masu-past": "すいました",
      "masu-past-neg": "すいませんでした",
      nai: "すわない",
      ta: "すった",
      te: "すって",
      tai: "すいたい",
    },
    // New row with ja-m16-neo-11 (vocab pack 6, 2026-07-30 B067) so すわない
    // is a real lexicon surface. The すい stem is safe: every corpus すい sits
    // inside すいようび / やすい, which longest-match consumes whole.
    introducedAtModule: 16,
  },

  // ═══ M10 verbs ══════════════════════════════════════════════════════

  // Ichidan
  {
    id: "okiru",
    dictionary: "おきる",
    kanji: "起きる",
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
    // Taught by ja-m13-neo-10 (vocab pack 3, 2026-07-29 B067) — un-parked 99 → 13.
    introducedAtModule: 13,
  },
  {
    id: "neru",
    dictionary: "ねる",
    kanji: "寝る",
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
    // untaught today -- parked out of every pool; vocab pack 13 (m22, wave plan) teaches ねる: restore to 22 with that pack
    introducedAtModule: 99,
  },
  {
    id: "dekakeru",
    dictionary: "でかける",
    kanji: "出かける",
    meaning: "to go out",
    group: "ichidan",
    forms: {
      dictionary: "でかける",
      masu: "でかけます",
      "masu-neg": "でかけません",
      "masu-past": "でかけました",
      "masu-past-neg": "でかけませんでした",
      nai: "でかけない",
      ta: "でかけた",
      te: "でかけて",
      tai: "でかけたい",
    },
    introducedAtModule: 99,
  },

  // Godan
  {
    id: "aruku",
    dictionary: "あるく",
    kanji: "歩く",
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
    introducedAtModule: 19,
  },
  {
    id: "hashiru",
    dictionary: "はしる",
    kanji: "走る",
    meaning: "to run",
    group: "godan",
    forms: {
      dictionary: "はしる",
      masu: "はしります",
      "masu-neg": "はしりません",
      "masu-past": "はしりました",
      "masu-past-neg": "はしりませんでした",
      nai: "はしらない",
      ta: "はしった",
      te: "はしって",
      tai: "はしりたい",
    },
    // Taught by ja-m16-neo-11 (vocab pack 6, 2026-07-30 B067) — moved 30 → 16
    // (measured: the pack lesson is now the word's first course surface).
    introducedAtModule: 16,
  },
  {
    id: "oyogu",
    dictionary: "およぐ",
    kanji: "泳ぐ",
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
    introducedAtModule: 14,
  },
  {
    id: "asobu",
    dictionary: "あそぶ",
    kanji: "遊ぶ",
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
    introducedAtModule: 10,
  },
  {
    id: "hataraku",
    dictionary: "はたらく",
    kanji: "働く",
    meaning: "to work",
    group: "godan",
    forms: {
      dictionary: "はたらく",
      masu: "はたらきます",
      "masu-neg": "はたらきません",
      "masu-past": "はたらきました",
      "masu-past-neg": "はたらきませんでした",
      nai: "はたらかない",
      ta: "はたらいた",
      te: "はたらいて",
      tai: "はたらきたい",
    },
    introducedAtModule: 10,
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
    introducedAtModule: 6,
  },
  {
    id: "kuru",
    dictionary: "くる",
    kanji: "来る",
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
    introducedAtModule: 6,
  },
  {
    id: "benkyousuru",
    dictionary: "べんきょうする",
    kanji: "勉強する",
    meaning: "to study",
    group: "irregular",
    forms: {
      dictionary: "べんきょうする",
      masu: "べんきょうします",
      "masu-neg": "べんきょうしません",
      "masu-past": "べんきょうしました",
      "masu-past-neg": "べんきょうしませんでした",
      nai: "べんきょうしない",
      ta: "べんきょうした",
      te: "べんきょうして",
      tai: "べんきょうしたい",
    },
    // parked above the course 2026-08-09: its only exposure was the retired
    // m30 pilot (spec A1) — re-measure when an N4 module actually shows it
    introducedAtModule: 99,
  },

  // ═══ M11 verbs ══════════════════════════════════════════════════════

  {
    id: "wakaru",
    dictionary: "わかる",
    meaning: "to understand",
    group: "godan",
    forms: {
      dictionary: "わかる",
      masu: "わかります",
      "masu-neg": "わかりません",
      "masu-past": "わかりました",
      "masu-past-neg": "わかりませんでした",
      nai: "わからない",
      ta: "わかった",
      te: "わかって",
      tai: "わかりたい",
    },
    introducedAtModule: 11,
  },
  {
    id: "shiru",
    dictionary: "しる",
    kanji: "知る",
    meaning: "to know",
    group: "godan",
    forms: {
      dictionary: "しる",
      masu: "しります",
      "masu-neg": "しりません",
      "masu-past": "しりました",
      "masu-past-neg": "しりませんでした",
      nai: "しらない",
      ta: "しった",
      te: "しって",
      tai: "しりたい",
    },
    introducedAtModule: 11,
  },
  {
    id: "motsu",
    dictionary: "もつ",
    kanji: "持つ",
    meaning: "to have / hold",
    group: "godan",
    forms: {
      dictionary: "もつ",
      masu: "もちます",
      "masu-neg": "もちません",
      "masu-past": "もちました",
      "masu-past-neg": "もちませんでした",
      nai: "もたない",
      ta: "もった",
      te: "もって",
      tai: "もちたい",
    },
    // Taught by ja-m14-neo-10 (vocab pack 4, 2026-07-29 B067) — un-parked 99 → 14.
    introducedAtModule: 14,
  },
  {
    id: "kakaru",
    dictionary: "かかる",
    meaning: "to cost / take (time)",
    group: "godan",
    forms: {
      dictionary: "かかる",
      masu: "かかります",
      "masu-neg": "かかりません",
      "masu-past": "かかりました",
      "masu-past-neg": "かかりませんでした",
      nai: "かからない",
      ta: "かかった",
      te: "かかって",
      tai: "かかりたい",
    },
    introducedAtModule: 99,
  },

  // ═══ M13 verbs ══════════════════════════════════════════════════════

  // Ichidan
  {
    id: "abiru",
    dictionary: "あびる",
    meaning: "to shower",
    group: "ichidan",
    forms: {
      dictionary: "あびる",
      masu: "あびます",
      "masu-neg": "あびません",
      "masu-past": "あびました",
      "masu-past-neg": "あびませんでした",
      nai: "あびない",
      ta: "あびた",
      te: "あびて",
      tai: "あびたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "kiru-wear",
    dictionary: "きる",
    kanji: "着る",
    meaning: "to wear (upper body)",
    group: "ichidan",
    forms: {
      dictionary: "きる",
      masu: "きます",
      "masu-neg": "きません",
      "masu-past": "きました",
      "masu-past-neg": "きませんでした",
      nai: "きない",
      ta: "きた",
      te: "きて",
      tai: "きたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "tsukeru",
    dictionary: "つける",
    meaning: "to turn on",
    group: "ichidan",
    forms: {
      dictionary: "つける",
      masu: "つけます",
      "masu-neg": "つけません",
      "masu-past": "つけました",
      "masu-past-neg": "つけませんでした",
      nai: "つけない",
      ta: "つけた",
      te: "つけて",
      tai: "つけたい",
    },
    introducedAtModule: 99,
  },

  // Godan
  {
    id: "migaku",
    dictionary: "みがく",
    meaning: "to brush (teeth) / polish",
    group: "godan",
    forms: {
      dictionary: "みがく",
      masu: "みがきます",
      "masu-neg": "みがきません",
      "masu-past": "みがきました",
      "masu-past-neg": "みがきませんでした",
      nai: "みがかない",
      ta: "みがいた",
      te: "みがいて",
      tai: "みがきたい",
    },
    // Taught by ja-m13-neo-10 (vocab pack 3, 2026-07-29 B067) — un-parked 99 → 13.
    introducedAtModule: 13,
  },
  {
    id: "arau",
    dictionary: "あらう",
    kanji: "洗う",
    meaning: "to wash",
    group: "godan",
    forms: {
      dictionary: "あらう",
      masu: "あらいます",
      "masu-neg": "あらいません",
      "masu-past": "あらいました",
      "masu-past-neg": "あらいませんでした",
      nai: "あらわない",
      ta: "あらった",
      te: "あらって",
      tai: "あらいたい",
    },
    // Taught by ja-m13-neo-10 (vocab pack 3, 2026-07-29 B067) — un-parked 99 → 13.
    introducedAtModule: 13,
  },
  {
    id: "kesu",
    dictionary: "けす",
    kanji: "消す",
    meaning: "to turn off / erase",
    group: "godan",
    forms: {
      dictionary: "けす",
      masu: "けします",
      "masu-neg": "けしません",
      "masu-past": "けしました",
      "masu-past-neg": "けしませんでした",
      nai: "けさない",
      ta: "けした",
      te: "けして",
      tai: "けしたい",
    },
    introducedAtModule: 33,
  },

  // ═══ M14 verbs ══════════════════════════════════════════════════════

  // Ichidan
  // あける / しめる / ひく (below, godan): new entries for ja-m14-neo-10
  // (vocab pack 4, 2026-07-29 B067). Every derived surface was checked
  // against the live corpus first — zero existing occurrences, so
  // registering them cannot re-tokenize anything (the m16-ので class).
  {
    id: "akeru",
    dictionary: "あける",
    kanji: "開ける",
    meaning: "to open",
    group: "ichidan",
    forms: {
      dictionary: "あける",
      masu: "あけます",
      "masu-neg": "あけません",
      "masu-past": "あけました",
      "masu-past-neg": "あけませんでした",
      nai: "あけない",
      ta: "あけた",
      te: "あけて",
      tai: "あけたい",
    },
    introducedAtModule: 14,
  },
  {
    id: "shimeru",
    dictionary: "しめる",
    kanji: "閉める",
    meaning: "to close (something)",
    group: "ichidan",
    forms: {
      dictionary: "しめる",
      masu: "しめます",
      "masu-neg": "しめません",
      "masu-past": "しめました",
      "masu-past-neg": "しめませんでした",
      nai: "しめない",
      ta: "しめた",
      te: "しめて",
      tai: "しめたい",
    },
    introducedAtModule: 14,
  },
  {
    id: "miseru",
    dictionary: "みせる",
    kanji: "見せる",
    meaning: "to show",
    group: "ichidan",
    forms: {
      dictionary: "みせる",
      masu: "みせます",
      "masu-neg": "みせません",
      "masu-past": "みせました",
      "masu-past-neg": "みせませんでした",
      nai: "みせない",
      ta: "みせた",
      te: "みせて",
      tai: "みせたい",
    },
    introducedAtModule: 14,
  },
  {
    id: "oshieru",
    dictionary: "おしえる",
    kanji: "教える",
    meaning: "to teach / tell",
    group: "ichidan",
    forms: {
      dictionary: "おしえる",
      masu: "おしえます",
      "masu-neg": "おしえません",
      "masu-past": "おしえました",
      "masu-past-neg": "おしえませんでした",
      nai: "おしえない",
      ta: "おしえた",
      te: "おしえて",
      tai: "おしえたい",
    },
    introducedAtModule: 14,
  },

  // Godan
  {
    id: "matsu",
    dictionary: "まつ",
    kanji: "待つ",
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
    introducedAtModule: 14,
  },
  {
    // 引く "to pull" (ja-m14-neo-10, vocab pack 4 2026-07-29 B067) — the
    // ambiguity map pins the bare kana ひく to this sense; 弾く stays untaught.
    id: "hiku",
    dictionary: "ひく",
    kanji: "引く",
    meaning: "to pull",
    group: "godan",
    forms: {
      dictionary: "ひく",
      masu: "ひきます",
      "masu-neg": "ひきません",
      "masu-past": "ひきました",
      "masu-past-neg": "ひきませんでした",
      nai: "ひかない",
      ta: "ひいた",
      te: "ひいて",
      tai: "ひきたい",
    },
    introducedAtModule: 14,
  },
  {
    id: "tetsudau",
    dictionary: "てつだう",
    kanji: "手伝う",
    meaning: "to help",
    group: "godan",
    forms: {
      dictionary: "てつだう",
      masu: "てつだいます",
      "masu-neg": "てつだいません",
      "masu-past": "てつだいました",
      "masu-past-neg": "てつだいませんでした",
      nai: "てつだわない",
      ta: "てつだった",
      te: "てつだって",
      tai: "てつだいたい",
    },
    // parked above the course 2026-08-09: its only exposure was the retired
    // m30 pilot (spec A1) — re-measure when an N4 module actually shows it
    introducedAtModule: 99,
  },
  {
    id: "kasu",
    dictionary: "かす",
    kanji: "貸す",
    meaning: "to lend",
    group: "godan",
    forms: {
      dictionary: "かす",
      masu: "かします",
      "masu-neg": "かしません",
      "masu-past": "かしました",
      "masu-past-neg": "かしませんでした",
      nai: "かさない",
      ta: "かした",
      te: "かして",
      tai: "かしたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "toru",
    dictionary: "とる",
    kanji: "取る",
    meaning: "to take",
    group: "godan",
    forms: {
      dictionary: "とる",
      masu: "とります",
      "masu-neg": "とりません",
      "masu-past": "とりました",
      "masu-past-neg": "とりませんでした",
      nai: "とらない",
      ta: "とった",
      te: "とって",
      tai: "とりたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "kau",
    dictionary: "かう",
    kanji: "買う",
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
    id: "kaeru",
    dictionary: "かえる",
    kanji: "帰る",
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
    // measured first exposure m19 (drillPoolIsTaught); registry re-homed m14->m19 2026-07-29
    introducedAtModule: 19,
  },

  // ═══ M15 verbs ══════════════════════════════════════════════════════

  {
    id: "sumu",
    dictionary: "すむ",
    kanji: "住む",
    meaning: "to live (in a place)",
    group: "godan",
    forms: {
      dictionary: "すむ",
      masu: "すみます",
      "masu-neg": "すみません",
      "masu-past": "すみました",
      "masu-past-neg": "すみませんでした",
      nai: "すまない",
      ta: "すんだ",
      te: "すんで",
      tai: "すみたい",
    },
    introducedAtModule: 15,
  },

  // ═══ M16 verbs ══════════════════════════════════════════════════════

  // Ichidan
  {
    id: "deru",
    dictionary: "でる",
    kanji: "出る",
    meaning: "to exit / leave",
    group: "ichidan",
    forms: {
      dictionary: "でる",
      masu: "でます",
      "masu-neg": "でません",
      "masu-past": "でました",
      "masu-past-neg": "でませんでした",
      nai: "でない",
      ta: "でた",
      te: "でて",
      tai: "でたい",
    },
    introducedAtModule: 33,
  },

  // Godan
  {
    id: "suwaru",
    dictionary: "すわる",
    kanji: "座る",
    meaning: "to sit",
    group: "godan",
    forms: {
      dictionary: "すわる",
      masu: "すわります",
      "masu-neg": "すわりません",
      "masu-past": "すわりました",
      "masu-past-neg": "すわりませんでした",
      nai: "すわらない",
      ta: "すわった",
      te: "すわって",
      tai: "すわりたい",
    },
    // parked above the course 2026-08-09: its only exposure was the retired
    // m30 pilot (spec A1) — re-measure when an N4 module actually shows it
    introducedAtModule: 99,
  },
  {
    id: "sawaru",
    dictionary: "さわる",
    meaning: "to touch",
    group: "godan",
    forms: {
      dictionary: "さわる",
      masu: "さわります",
      "masu-neg": "さわりません",
      "masu-past": "さわりました",
      "masu-past-neg": "さわりませんでした",
      nai: "さわらない",
      ta: "さわった",
      te: "さわって",
      tai: "さわりたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "hairu",
    dictionary: "はいる",
    kanji: "入る",
    meaning: "to enter",
    group: "godan",
    forms: {
      dictionary: "はいる",
      masu: "はいります",
      "masu-neg": "はいりません",
      "masu-past": "はいりました",
      "masu-past-neg": "はいりませんでした",
      nai: "はいらない",
      ta: "はいった",
      te: "はいって",
      tai: "はいりたい",
    },
    introducedAtModule: 23,
  },

  // ═══ M17 verbs ══════════════════════════════════════════════════════

  // Ichidan
  {
    id: "oriru",
    dictionary: "おりる",
    kanji: "降りる",
    meaning: "to get off / descend",
    group: "ichidan",
    forms: {
      dictionary: "おりる",
      masu: "おります",
      "masu-neg": "おりません",
      "masu-past": "おりました",
      "masu-past-neg": "おりませんでした",
      nai: "おりない",
      ta: "おりた",
      te: "おりて",
      tai: "おりたい",
    },
    introducedAtModule: 99,
  },

  // Godan
  {
    id: "noru",
    dictionary: "のる",
    kanji: "乗る",
    meaning: "to ride / get on",
    group: "godan",
    forms: {
      dictionary: "のる",
      masu: "のります",
      "masu-neg": "のりません",
      "masu-past": "のりました",
      "masu-past-neg": "のりませんでした",
      nai: "のらない",
      ta: "のった",
      te: "のって",
      tai: "のりたい",
    },
    introducedAtModule: 23,
  },
  {
    id: "wataru",
    dictionary: "わたる",
    kanji: "渡る",
    meaning: "to cross",
    group: "godan",
    forms: {
      dictionary: "わたる",
      masu: "わたります",
      "masu-neg": "わたりません",
      "masu-past": "わたりました",
      "masu-past-neg": "わたりませんでした",
      nai: "わたらない",
      ta: "わたった",
      te: "わたって",
      tai: "わたりたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "magaru",
    dictionary: "まがる",
    kanji: "曲がる",
    meaning: "to turn (direction)",
    group: "godan",
    forms: {
      dictionary: "まがる",
      masu: "まがります",
      "masu-neg": "まがりません",
      "masu-past": "まがりました",
      "masu-past-neg": "まがりませんでした",
      nai: "まがらない",
      ta: "まがった",
      te: "まがって",
      tai: "まがりたい",
    },
    introducedAtModule: 99,
  },
  {
    id: "tomaru",
    dictionary: "とまる",
    kanji: "止まる",
    meaning: "to stop",
    group: "godan",
    forms: {
      dictionary: "とまる",
      masu: "とまります",
      "masu-neg": "とまりません",
      "masu-past": "とまりました",
      "masu-past-neg": "とまりませんでした",
      nai: "とまらない",
      ta: "とまった",
      te: "とまって",
      tai: "とまりたい",
    },
    // untaught today -- parked out of every pool; vocab pack 9 (m19, wave plan) teaches とまる: restore to 19 with that pack
    introducedAtModule: 32,
  },
];

// ─── Adjectives ───────────────────────────────────────────────────────

export const ADJ_ENTRIES: AdjEntry[] = [
  // ═══ M8 i-adjectives (26) ══════════════════════════════════════════

  {
    id: "ookii",
    dictionary: "おおきい",
    kanji: "大きい",
    meaning: "big",
    type: "i-adj",
    forms: {
      present: "おおきい",
      negative: "おおきくない",
      past: "おおきかった",
      "past-negative": "おおきくなかった",
    },
    introducedAtModule: 12,
  },
  {
    id: "chiisai",
    dictionary: "ちいさい",
    kanji: "小さい",
    meaning: "small",
    type: "i-adj",
    forms: {
      present: "ちいさい",
      negative: "ちいさくない",
      past: "ちいさかった",
      "past-negative": "ちいさくなかった",
    },
    // measured first exposure m12 (drillPoolIsTaught 2026-07-29)
    introducedAtModule: 12,
  },
  {
    id: "takai",
    dictionary: "たかい",
    kanji: "高い",
    meaning: "tall / expensive",
    type: "i-adj",
    forms: {
      present: "たかい",
      negative: "たかくない",
      past: "たかかった",
      "past-negative": "たかくなかった",
    },
    introducedAtModule: 9,
  },
  {
    id: "yasui",
    dictionary: "やすい",
    kanji: "安い",
    meaning: "cheap",
    type: "i-adj",
    forms: {
      present: "やすい",
      negative: "やすくない",
      past: "やすかった",
      "past-negative": "やすくなかった",
    },
    introducedAtModule: 9,
  },
  {
    id: "atarashii",
    dictionary: "あたらしい",
    kanji: "新しい",
    meaning: "new",
    type: "i-adj",
    forms: {
      present: "あたらしい",
      negative: "あたらしくない",
      past: "あたらしかった",
      "past-negative": "あたらしくなかった",
    },
    introducedAtModule: 12,
  },
  {
    id: "furui",
    dictionary: "ふるい",
    kanji: "古い",
    meaning: "old (things)",
    type: "i-adj",
    forms: {
      present: "ふるい",
      negative: "ふるくない",
      past: "ふるかった",
      "past-negative": "ふるくなかった",
    },
    introducedAtModule: 12,
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
    introducedAtModule: 12,
  },
  {
    id: "warui",
    dictionary: "わるい",
    kanji: "悪い",
    meaning: "bad",
    type: "i-adj",
    forms: {
      present: "わるい",
      negative: "わるくない",
      past: "わるかった",
      "past-negative": "わるくなかった",
    },
    // Taught by ja-m16-neo-11 (vocab pack 6, 2026-07-30 B067) — restored to 16
    // exactly as the parking note called for.
    introducedAtModule: 16,
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
    introducedAtModule: 12,
  },
  {
    id: "mazui",
    dictionary: "まずい",
    meaning: "bad-tasting",
    type: "i-adj",
    forms: {
      present: "まずい",
      negative: "まずくない",
      past: "まずかった",
      "past-negative": "まずくなかった",
    },
    introducedAtModule: 99,
  },
  {
    id: "atsui",
    dictionary: "あつい",
    kanji: "暑い",
    meaning: "hot (weather)",
    type: "i-adj",
    forms: {
      present: "あつい",
      negative: "あつくない",
      past: "あつかった",
      "past-negative": "あつくなかった",
    },
    // measured first exposure m25 (drillPoolIsTaught 2026-07-29)
    introducedAtModule: 25,
  },
  {
    id: "samui",
    dictionary: "さむい",
    kanji: "寒い",
    meaning: "cold (weather)",
    type: "i-adj",
    forms: {
      present: "さむい",
      negative: "さむくない",
      past: "さむかった",
      "past-negative": "さむくなかった",
    },
    // Taught by ja-m16-neo-1 (its debut word_image_mcq). The old m10 pin was
    // distractor-backfill luck, displaced by the 2026-07-30 m16 pack
    // re-homes (measured: drillPoolIsTaught now first sees it m13, taught
    // m16 — pin to the teaching module).
    introducedAtModule: 16,
  },
  {
    id: "tsumetai",
    dictionary: "つめたい",
    kanji: "冷たい",
    meaning: "cold (to touch)",
    type: "i-adj",
    forms: {
      present: "つめたい",
      negative: "つめたくない",
      past: "つめたかった",
      "past-negative": "つめたくなかった",
    },
    // Taught by ja-m14-neo-10 (vocab pack 4, 2026-07-29 B067) — un-parked 99 → 14.
    introducedAtModule: 14,
  },
  {
    id: "atatakai",
    dictionary: "あたたかい",
    kanji: "暖かい",
    meaning: "warm",
    type: "i-adj",
    forms: {
      present: "あたたかい",
      negative: "あたたかくない",
      past: "あたたかかった",
      "past-negative": "あたたかくなかった",
    },
    // measured first exposure m25 (drillPoolIsTaught, remeasured 2026-07-30
    // after the m16 pack re-homes shifted the distractor backfill)
    introducedAtModule: 25,
  },
  {
    id: "nagai",
    dictionary: "ながい",
    kanji: "長い",
    meaning: "long",
    type: "i-adj",
    forms: {
      present: "ながい",
      negative: "ながくない",
      past: "ながかった",
      "past-negative": "ながくなかった",
    },
    introducedAtModule: 27,
  },
  {
    id: "mijikai",
    dictionary: "みじかい",
    kanji: "短い",
    meaning: "short",
    type: "i-adj",
    forms: {
      present: "みじかい",
      negative: "みじかくない",
      past: "みじかかった",
      "past-negative": "みじかくなかった",
    },
    introducedAtModule: 27,
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
    introducedAtModule: 12,
  },
  {
    id: "tsumaranai",
    dictionary: "つまらない",
    meaning: "boring",
    type: "i-adj",
    forms: {
      present: "つまらない",
      negative: "つまらなくない",
      past: "つまらなかった",
      "past-negative": "つまらなくなかった",
    },
    // parked above the course 2026-08-09: the measured m30 first exposure
    // (drillPoolIsTaught 2026-07-29 pack wave) was the retired pilot (spec
    // A1) — re-measure when an N4 module actually shows it
    introducedAtModule: 99,
  },
  {
    id: "muzukashii",
    dictionary: "むずかしい",
    kanji: "難しい",
    meaning: "difficult",
    type: "i-adj",
    forms: {
      present: "むずかしい",
      negative: "むずかしくない",
      past: "むずかしかった",
      "past-negative": "むずかしくなかった",
    },
    // measured first exposure m18 (drillPoolIsTaught 2026-07-29 pack wave)
    introducedAtModule: 18,
  },
  {
    id: "yasashii",
    dictionary: "やさしい",
    meaning: "easy / kind",
    type: "i-adj",
    forms: {
      present: "やさしい",
      negative: "やさしくない",
      past: "やさしかった",
      "past-negative": "やさしくなかった",
    },
    // Taught by ja-m16-neo-10 (vocab pack 5, 2026-07-30 B067) — moved 24 → 16
    // (the pack lesson is now the measured first exposure).
    introducedAtModule: 16,
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
    // measured first exposure m13 — 早い taught by ja-m13-neo-10 (vocab pack 3, B067)
    introducedAtModule: 13,
  },
  {
    id: "osoi",
    dictionary: "おそい",
    kanji: "遅い",
    meaning: "slow / late",
    type: "i-adj",
    forms: {
      present: "おそい",
      negative: "おそくない",
      past: "おそかった",
      "past-negative": "おそくなかった",
    },
    // measured first exposure m27 (drillPoolIsTaught 2026-07-29 pack wave)
    introducedAtModule: 27,
  },
  {
    id: "chikai",
    dictionary: "ちかい",
    kanji: "近い",
    meaning: "near",
    type: "i-adj",
    forms: {
      present: "ちかい",
      negative: "ちかくない",
      past: "ちかかった",
      "past-negative": "ちかくなかった",
    },
    // measured first exposure m20 (drillPoolIsTaught 2026-07-29)
    introducedAtModule: 20,
  },
  {
    id: "tooi",
    dictionary: "とおい",
    kanji: "遠い",
    meaning: "far",
    type: "i-adj",
    forms: {
      present: "とおい",
      negative: "とおくない",
      past: "とおかった",
      "past-negative": "とおくなかった",
    },
    introducedAtModule: 20,
  },
  {
    id: "hiroi",
    dictionary: "ひろい",
    kanji: "広い",
    meaning: "spacious / wide",
    type: "i-adj",
    forms: {
      present: "ひろい",
      negative: "ひろくない",
      past: "ひろかった",
      "past-negative": "ひろくなかった",
    },
    // measured first exposure m27 (drillPoolIsTaught, remeasured 2026-07-30
    // after the m16 pack re-homes shifted the distractor backfill)
    introducedAtModule: 27,
  },
  {
    id: "semai",
    dictionary: "せまい",
    kanji: "狭い",
    meaning: "narrow / cramped",
    type: "i-adj",
    forms: {
      present: "せまい",
      negative: "せまくない",
      past: "せまかった",
      "past-negative": "せまくなかった",
    },
    introducedAtModule: 27,
  },

  // ═══ M9 na-adjectives (15) ═════════════════════════════════════════

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
    introducedAtModule: 12,
  },
  {
    id: "shizuka",
    dictionary: "しずか",
    kanji: "静か",
    meaning: "quiet",
    type: "na-adj",
    forms: {
      present: "しずかです",
      negative: "しずかじゃないです",
      past: "しずかでした",
      "past-negative": "しずかじゃなかったです",
    },
    introducedAtModule: 12,
  },
  {
    id: "nigiyaka",
    dictionary: "にぎやか",
    meaning: "lively / bustling",
    type: "na-adj",
    forms: {
      present: "にぎやかです",
      negative: "にぎやかじゃないです",
      past: "にぎやかでした",
      "past-negative": "にぎやかじゃなかったです",
    },
    introducedAtModule: 12,
  },
  {
    id: "yuumei",
    dictionary: "ゆうめい",
    kanji: "有名",
    meaning: "famous",
    type: "na-adj",
    forms: {
      present: "ゆうめいです",
      negative: "ゆうめいじゃないです",
      past: "ゆうめいでした",
      "past-negative": "ゆうめいじゃなかったです",
    },
    // measured first exposure m12 (drillPoolIsTaught 2026-07-29 pack wave)
    introducedAtModule: 12,
  },
  {
    id: "suki",
    dictionary: "すき",
    kanji: "好き",
    meaning: "likeable / to like",
    type: "na-adj",
    forms: {
      present: "すきです",
      negative: "すきじゃないです",
      past: "すきでした",
      "past-negative": "すきじゃなかったです",
    },
    introducedAtModule: 13,
  },
  {
    id: "kirai",
    dictionary: "きらい",
    kanji: "嫌い",
    meaning: "disliked / to dislike",
    type: "na-adj",
    forms: {
      present: "きらいです",
      negative: "きらいじゃないです",
      past: "きらいでした",
      "past-negative": "きらいじゃなかったです",
    },
    // taught by ja-m13-neo-7 (すき/きらい) — aligned with the 2026-07-29 fromModule re-home
    introducedAtModule: 13,
  },
  {
    id: "jouzu",
    dictionary: "じょうず",
    kanji: "上手",
    meaning: "skillful / good at",
    type: "na-adj",
    forms: {
      present: "じょうずです",
      negative: "じょうずじゃないです",
      past: "じょうずでした",
      "past-negative": "じょうずじゃなかったです",
    },
    introducedAtModule: 24,
  },
  {
    id: "heta",
    dictionary: "へた",
    kanji: "下手",
    meaning: "unskillful / bad at",
    type: "na-adj",
    forms: {
      present: "へたです",
      negative: "へたじゃないです",
      past: "へたでした",
      "past-negative": "へたじゃなかったです",
    },
    introducedAtModule: 24,
  },
  {
    id: "genki",
    dictionary: "げんき",
    kanji: "元気",
    meaning: "energetic / healthy",
    type: "na-adj",
    forms: {
      present: "げんきです",
      negative: "げんきじゃないです",
      past: "げんきでした",
      "past-negative": "げんきじゃなかったです",
    },
    introducedAtModule: 9,
  },
  {
    id: "hima",
    dictionary: "ひま",
    meaning: "free (time) / not busy",
    type: "na-adj",
    forms: {
      present: "ひまです",
      negative: "ひまじゃないです",
      past: "ひまでした",
      "past-negative": "ひまじゃなかったです",
    },
    introducedAtModule: 12,
  },
  {
    id: "taihen",
    dictionary: "たいへん",
    kanji: "大変",
    meaning: "tough / awful",
    type: "na-adj",
    forms: {
      present: "たいへんです",
      negative: "たいへんじゃないです",
      past: "たいへんでした",
      "past-negative": "たいへんじゃなかったです",
    },
    // untaught today -- parked out of every pool (earlier exposure was
    // distractor-fill luck, displaced by the m13 pack re-homes); vocab
    // pack 13 (m22, wave plan) teaches たいへん: restore to 22 with that pack
    introducedAtModule: 99,
  },
  {
    id: "benri",
    dictionary: "べんり",
    kanji: "便利",
    meaning: "convenient",
    type: "na-adj",
    forms: {
      present: "べんりです",
      negative: "べんりじゃないです",
      past: "べんりでした",
      "past-negative": "べんりじゃなかったです",
    },
    // parked above the course 2026-08-09: the measured m30 first exposure
    // (drillPoolIsTaught 2026-07-29 — earlier exposure was distractor-fill
    // luck) was the retired pilot (spec A1) — re-measure when an N4 module
    // actually shows it
    introducedAtModule: 99,
  },
  {
    id: "fubeni",
    dictionary: "ふべん",
    kanji: "不便",
    meaning: "inconvenient",
    type: "na-adj",
    forms: {
      present: "ふべんです",
      negative: "ふべんじゃないです",
      past: "ふべんでした",
      "past-negative": "ふべんじゃなかったです",
    },
    introducedAtModule: 99,
  },
  {
    id: "daijoubu",
    dictionary: "だいじょうぶ",
    kanji: "大丈夫",
    meaning: "all right / OK",
    type: "na-adj",
    forms: {
      present: "だいじょうぶです",
      negative: "だいじょうぶじゃないです",
      past: "だいじょうぶでした",
      "past-negative": "だいじょうぶじゃなかったです",
    },
    introducedAtModule: 9,
  },
  {
    id: "kantan",
    dictionary: "かんたん",
    kanji: "簡単",
    meaning: "simple / easy",
    type: "na-adj",
    forms: {
      present: "かんたんです",
      negative: "かんたんじゃないです",
      past: "かんたんでした",
      "past-negative": "かんたんじゃなかったです",
    },
    introducedAtModule: 99,
  },
];

// ─── Query helpers ────────────────────────────────────────────────────

export function getVerbsUpToModule(maxModule: number): VerbEntry[] {
  return VERB_ENTRIES.filter((v) => v.introducedAtModule <= maxModule);
}

export function getAdjsUpToModule(maxModule: number): AdjEntry[] {
  return ADJ_ENTRIES.filter((a) => a.introducedAtModule <= maxModule);
}
