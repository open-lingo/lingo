import type {
  LessonContent,
  GrammarRuleStep,
  ParticleClozeStep,
  PhraseCardStep,
} from "../types";

/**
 * M3-7 — Location particles に / で.
 *
 * Tae Kim framing:
 *   - に = a POINT — direction toward (gakkou ni iku = go TO school) or
 *     existence AT (gakkou ni iru = is AT school). The pinpoint particle.
 *   - で = the SETTING or MEANS — where an action HAPPENS (gakkou DE
 *     benkyou suru = study AT school) or what you do it BY (densha DE
 *     iku = go BY train).
 *
 * Misuse signal: "I'm AT school" — if you mean existence (just being),
 * use に. If you mean an action happens there (working, studying), use
 * で. English collapses both into 'at.'
 */

const RULE_NI_DE: GrammarRuleStep = {
  id: "ja-m3-7-rule-ni-de",
  type: "grammar_rule",
  title: "に vs で — point vs setting",
  rule:
    "に marks a POINT — direction toward (がっこうに いく = go TO school) or existence AT (うちに いる = be AT home). で marks the SETTING of an action (がっこうで べんきょう = study AT school) or the MEANS (でんしゃで いく = go BY train). The English 'at' collapses both; Japanese keeps them separate.",
  examples: [
    {
      ja: "がっこうに いきます。",
      romaji: "gakkou ni ikimasu.",
      en: "I go to school. (に = destination point)",
    },
    {
      ja: "がっこうで べんきょうします。",
      romaji: "gakkou de benkyou shimasu.",
      en: "I study at school. (で = where the action happens)",
    },
  ],
  antiPattern: {
    ja: "がっこうで いきます。",
    romaji: "gakkou de ikimasu.",
    en: "(broken — 'I go school-as-setting')",
    why: "Going TO somewhere is movement toward a destination point — に, never で. で works for verbs of activity (study, work, eat); movement verbs (go, come, return) take に.",
  },
  cultureNote:
    "Filter: am I pointing at the destination/location (に), or describing the place an action happens (で)? Most learners over-use に because it shows up in beginner lessons first.",
};

function vocab(
  id: string,
  meaningEn: string,
  romaji: string,
  kana: string,
  cultureNote?: string,
): PhraseCardStep {
  return { id, type: "phrase_card", meaningEn, romaji, kana, cultureNote };
}

function cloze(
  id: string,
  before: string,
  after: string,
  correctParticle: string,
  options: string[],
  meaningEn: string,
  audioText: string,
  explanation?: string,
): ParticleClozeStep {
  return {
    id,
    type: "particle_cloze",
    prompt: { before, after },
    correctParticle,
    options,
    meaningEn,
    audioText,
    explanation,
  };
}

export const MOCK_LESSON_JA_M3_7: LessonContent = {
  id: "ja-m3-7",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "に + で — destinations and settings",
  description:
    "The two location particles English collapses into 'at.' Point vs setting.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    {
      id: "ja-m3-7-info-open",
      type: "info",
      title: "Two flavors of 'at'",
      body:
        "English uses 'at' for both 'I'm at the station' (existence) and 'I work at the office' (where the action happens). Japanese uses different particles — and using the wrong one creates sentences that natives parse as 'broken English' levels of off.",
      variant: "default",
    },

    vocab(
      "ja-m3-7-v-gakkou",
      "School",
      "gakkou",
      "がっこう",
      "Generic for any educational institution from elementary up to university.",
    ),
    vocab("ja-m3-7-v-uchi", "Home", "uchi", "うち"),
    vocab(
      "ja-m3-7-v-eki",
      "Train station",
      "eki",
      "えき",
      "Recurring word from M1 ka-row. Every Japanese address starts with 'X minutes from Y eki.'",
    ),
    vocab(
      "ja-m3-7-v-kaisha",
      "Office / company",
      "kaisha",
      "かいしゃ",
      "Used for both 'the company' (as an organization) and 'the office' (the building).",
    ),
    vocab(
      "ja-m3-7-v-mise",
      "Shop",
      "mise",
      "みせ",
      "Generic word for any retail business. Pair with vocab: パンや (bakery), ほんや (bookshop), カフェ (cafe).",
    ),
    vocab(
      "ja-m3-7-v-konbini",
      "Convenience store",
      "konbini",
      "コンビニ",
      "Your sixth katakana exposure word — from English 'convenience.' 7-Eleven, FamilyMart, Lawson — these are the holy trinity of late-night Japan.",
    ),

    RULE_NI_DE,

    cloze(
      "ja-m3-7-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
      "Movement TOWARD a destination point — に. Verbs of motion (いく/くる/かえる) always take に for the destination.",
    ),
    cloze(
      "ja-m3-7-cloze-2",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
      "The action (studying) HAPPENS at home — で marks the setting. うちに べんきょう would parse as 'study TO home,' which makes no sense.",
    ),
    cloze(
      "ja-m3-7-cloze-3",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence verbs (いる for animate, ある for inanimate) take に. You ARE AT a point.",
    ),
    cloze(
      "ja-m3-7-cloze-4",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "の"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Working is an action happening at a setting — で. Note: コンビニ is in katakana (loanword from English).",
    ),
    cloze(
      "ja-m3-7-cloze-5",
      "でんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "へ"],
      "I go by train.",
      "でんしゃで いきます。",
      "で also marks the MEANS — how you do something. 'By train' = でんしゃで.",
    ),
    cloze(
      "ja-m3-7-cloze-6",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
      "かえる (to return) is a movement verb → destination takes に. Same pattern as いく.",
    ),

    {
      id: "ja-m3-7-info-end",
      type: "info",
      title: "Two-question filter",
      body:
        "に when you're pointing at a destination or existence point. で when you're naming the setting where an action happens or the means you used. The wrong choice is rarely catastrophic, but the right choice marks you as someone who's actually studied.",
      variant: "win",
    },
  ],
};
