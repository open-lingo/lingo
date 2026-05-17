/**
 * M7 — Verbs in motion (NEW content, 2026-05-16).
 *
 * New grammar:
 *   - Verb forms: dictionary form (taberu) + polite ます stem (tabemasu).
 *     Tae Kim framing: dictionary is the citation form; ます is the polite
 *     stem derived from it.
 *   - を (direct-object particle) — marks the thing being acted on.
 *
 * Reuses M3-M6: every drill leans on は + の + に + で. に re-appears for
 * direction (interleave). Numbers + counters from M5 carry into the
 * restaurant dialogue.
 *
 * Lesson list (9 lessons):
 *   M7-1  Verbs vocab — 6 common verbs in dictionary + ます forms
 *   M7-2  Grammar Rule Card — dictionary form ↔ ます stem
 *   M7-3  Grammar Rule Card — を (direct-object particle)
 *   M7-4  Vocab — food + drink (object pool for を drills)
 *   M7-5  Iteration — を drills + verb conjugation
 *   M7-6  Iteration — に + で + を interleaved
 *   M7-7  Sentence Build (5 cumulative sentences)
 *   M7-8  Dialogue — ordering at a restaurant (verbs + を + numbers)
 *   M7-9  Row test (mastery ★)
 */
import type {
  LessonContent,
  MatchPairsStep,
  MultipleChoiceStep,
  RowTestItem,
  RowTestStep,
  BuildSentenceStep,
} from "../types";
import {
  build,
  cloze,
  dialogueLesson,
  grammarRule,
  infoStep,
  phrase,
  vocab,
} from "./_jaGrammarHelpers";

const COURSE = "mock-1";
const LANG = "ja";

export const M7_1: LessonContent = {
  id: "ja-m7-1",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Verbs — dictionary + polite stem",
  description:
    "Six high-frequency verbs in BOTH forms: dictionary (taberu) and polite ます (tabemasu).",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-1-info-open",
      "Two forms, same verb",
      "Every Japanese verb has at least two faces: the dictionary form (the citation form, used between friends + in writing) and the ます-polite form (the careful form, used with strangers + at work). Memorize both at once — you'll need both.",
      "grammar",
    ),
    phrase(
      "ja-m7-1-taberu",
      "to eat / eat (polite)",
      "taberu / tabemasu",
      "たべる / たべます",
      "Pair the two forms in your head as one verb. たべる = casual, たべます = polite.",
    ),
    phrase(
      "ja-m7-1-nomu",
      "to drink / drink (polite)",
      "nomu / nomimasu",
      "のむ / のみます",
      "Different ending pattern. のむ → のみ + ます.",
    ),
    phrase(
      "ja-m7-1-iku",
      "to go / go (polite)",
      "iku / ikimasu",
      "いく / いきます",
      "Already met いきます across M6 — this is the dictionary form.",
    ),
    phrase(
      "ja-m7-1-miru",
      "to see / watch (polite)",
      "miru / mimasu",
      "みる / みます",
      "Used for watching TV, looking at a picture, seeing a movie — all of it.",
    ),
    phrase(
      "ja-m7-1-yomu",
      "to read / read (polite)",
      "yomu / yomimasu",
      "よむ / よみます",
      "Pair with ほん (book) and しんぶん (newspaper).",
    ),
    phrase(
      "ja-m7-1-kaku",
      "to write / write (polite)",
      "kaku / kakimasu",
      "かく / かきます",
      "Pair with なまえ (name) and てがみ (letter).",
    ),
    infoStep(
      "ja-m7-1-info-end",
      "Six verbs in two registers",
      "You can now describe six actions in both polite and casual form. Next: the rule that links them.",
      "win",
    ),
  ],
};

const RULE_DICT_MASU = grammarRule({
  id: "ja-m7-2-rule-dict-masu",
  title: "Dictionary form ↔ polite ます stem",
  rule:
    "Every Japanese verb has a dictionary form (taberu, nomu, iku) — the citation form, used in writing + between friends. The polite ます-form (tabemasu, nomimasu, ikimasu) is derived from it by trimming the ending and attaching ます. The polite form is what you use with strangers, shop staff, and at work. Learn both as one unit per verb.",
  examples: [
    {
      ja: "わたしは すしを たべます。",
      romaji: "watashi wa sushi wo tabemasu.",
      en: "I eat sushi. (polite)",
    },
    {
      ja: "ともだちと コーヒーを のみます。",
      romaji: "tomodachi to koohii wo nomimasu.",
      en: "I drink coffee with a friend. (と = with — preview)",
    },
  ],
  antiPattern: {
    ja: "わたしは すしを たべる です。",
    romaji: "watashi wa sushi wo taberu desu.",
    en: "(broken — dictionary form does NOT take です)",
    why: "Dictionary form is already a full verb. Adding です creates a double-verb error. Use either たべる (casual standalone) or たべます (polite standalone) — never both.",
  },
  cultureNote:
    "Tae Kim's framing: the dictionary form is the authentic verb; ます is a polite suffix layered on top. Learn dictionary first, then derive ます from it — the reverse (learning ます first and trying to back-form dictionary) confuses learners about which form is the 'real' verb.",
});

export const M7_2: LessonContent = {
  id: "ja-m7-2",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Dictionary form ↔ ます stem",
  description: "The two forms of every verb, and when to use which.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-2-info-open",
      "Why two forms?",
      "The polite form (ます) is the safe traveler default — never wrong with strangers. The dictionary form is what dictionaries cite + what friends use. Learn both, deploy based on context.",
    ),
    RULE_DICT_MASU,
    phrase(
      "ja-m7-2-ex-1",
      "I eat sushi.",
      "watashi wa sushi wo tabemasu",
      "わたしは すしを たべます",
      "を marks すし as the direct object — what's being eaten.",
    ),
    phrase(
      "ja-m7-2-ex-2",
      "I drink water.",
      "watashi wa mizu wo nomimasu",
      "わたしは みずを のみます",
    ),
    phrase(
      "ja-m7-2-ex-3",
      "I read a book.",
      "watashi wa hon wo yomimasu",
      "わたしは ほんを よみます",
    ),
    infoStep(
      "ja-m7-2-info-end",
      "Two forms anchored",
      "Three example sentences using polite verbs + direct objects. The を particle that appeared three times — that's the next card.",
      "win",
    ),
  ],
};

const RULE_WO = grammarRule({
  id: "ja-m7-3-rule-wo",
  title: "を — the direct-object particle",
  rule:
    "を marks the thing being acted on by a transitive verb. すしを たべる = eat sushi. みずを のむ = drink water. ほんを よむ = read a book. The verb does something TO the を-marked noun.",
  examples: [
    {
      ja: "すしを たべます。",
      romaji: "sushi wo tabemasu.",
      en: "I eat sushi.",
    },
    {
      ja: "コーヒーを のみます。",
      romaji: "koohii wo nomimasu.",
      en: "I drink coffee.",
    },
  ],
  antiPattern: {
    ja: "すしは たべます。",
    romaji: "sushi wa tabemasu.",
    en: "(odd — 'as for sushi, [someone] eats it.' Grammatically possible but unusual as a beginner sentence)",
    why: "は marks the topic, not the direct object. 'I eat sushi' standardly uses わたしは すしを たべます — topic = me, direct object = sushi. Swapping は for を misframes the sentence as 'as for sushi, [someone] eats.'",
  },
  cultureNote:
    "を is written like the hiragana for 'wo' but pronounced 'o' (same sound as お). Yet another historical spelling quirk. The particle appears only as を — never as お.",
});

export const M7_3: LessonContent = {
  id: "ja-m7-3",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "を — the direct-object particle",
  description:
    "What's being acted on. Eat WHAT, drink WHAT, read WHAT — the WHAT takes を.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-3-info-open",
      "The action-target",
      "Every transitive verb (eat, drink, read, watch, write) takes a direct object. In Japanese, that object gets marked by を.",
    ),
    RULE_WO,
    cloze(
      "ja-m7-3-cloze-1",
      "すし",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat sushi.",
      "すしを たべます。",
      "すし is the thing being eaten — を.",
    ),
    cloze(
      "ja-m7-3-cloze-2",
      "みず",
      " のみます。",
      "を",
      ["を", "は", "が", "に"],
      "I drink water.",
      "みずを のみます。",
    ),
    cloze(
      "ja-m7-3-cloze-3",
      "ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "の"],
      "I read a book.",
      "ほんを よみます。",
    ),
    cloze(
      "ja-m7-3-cloze-4",
      "なまえ",
      " かきます。",
      "を",
      ["を", "は", "が", "に"],
      "I write [my] name.",
      "なまえを かきます。",
    ),
    infoStep(
      "ja-m7-3-info-end",
      "Direct objects unlocked",
      "Four drills, one pattern: [thing acted on] + を + [verb]. Next: a food/drink vocab pool to drill it with.",
      "win",
    ),
  ],
};

export const M7_4: LessonContent = {
  id: "ja-m7-4",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Food + drink vocab",
  description: "Six common foods and drinks — direct-object material for the verb drills.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m7-4-info-open",
      "Things you'll eat and drink",
      "Six foods/drinks. Each pairs naturally with たべる / のむ + を.",
    ),
    vocab(
      "ja-m7-4-sushi",
      "Sushi",
      "sushi",
      "すし",
      "Often written 寿司 in restaurants. Polite version: おすし (the お is a politeness prefix).",
    ),
    vocab(
      "ja-m7-4-ramen",
      "Ramen",
      "raamen",
      "ラーメン",
      "Always katakana — even though it's a Japanese dish, the word came via Chinese.",
    ),
    vocab(
      "ja-m7-4-pan",
      "Bread",
      "pan",
      "パン",
      "Loanword from Portuguese (pão), not English. One of the oldest loanwords in Japanese.",
    ),
    vocab("ja-m7-4-gohan", "Rice / a meal", "gohan", "ごはん"),
    vocab(
      "ja-m7-4-juusu",
      "Juice",
      "juusu",
      "ジュース",
      "Loanword. Generic term for any fruit drink.",
    ),
    vocab(
      "ja-m7-4-sake",
      "Sake (Japanese rice wine)",
      "sake",
      "さけ",
      "Use おさけ for politeness in formal/restaurant settings.",
    ),
    infoStep(
      "ja-m7-4-info-end",
      "Object pool loaded",
      "Six foods/drinks. Next: drill verb + を + object across the new vocab.",
      "win",
    ),
  ],
};

export const M7_5: LessonContent = {
  id: "ja-m7-5",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Drill — verbs + を",
  description: "Six clozes practicing transitive verbs with direct objects.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-5-info-open",
      "Verb + object",
      "Six clozes. Each one is a [object] + を + [verb] sentence. Pattern repetition.",
    ),
    cloze(
      "ja-m7-5-cloze-1",
      "ラーメン",
      " たべます。",
      "を",
      ["を", "は", "が", "に"],
      "I eat ramen.",
      "ラーメンを たべます。",
    ),
    cloze(
      "ja-m7-5-cloze-2",
      "ジュース",
      " のみます。",
      "を",
      ["を", "は", "が", "の"],
      "I drink juice.",
      "ジュースを のみます。",
    ),
    cloze(
      "ja-m7-5-cloze-3",
      "ともだちの ほん",
      " よみます。",
      "を",
      ["を", "は", "が", "に"],
      "I read my friend's book.",
      "ともだちの ほんを よみます。",
      "Combines の (possessive) + を (direct object). Two M-blocks in one sentence.",
    ),
    cloze(
      "ja-m7-5-cloze-4",
      "パン",
      " たべます。",
      "を",
      ["を", "は", "が", "の"],
      "I eat bread.",
      "パンを たべます。",
    ),
    cloze(
      "ja-m7-5-cloze-5",
      "テレビ",
      " みます。",
      "を",
      ["を", "は", "が", "に"],
      "I watch TV.",
      "テレビを みます。",
      "テレビ = TV (katakana loanword — one more sprinkle exposure).",
    ),
    cloze(
      "ja-m7-5-cloze-6",
      "てがみ",
      " かきます。",
      "を",
      ["を", "は", "が", "に"],
      "I write a letter.",
      "てがみを かきます。",
    ),
    infoStep(
      "ja-m7-5-info-end",
      "Six transitive sentences",
      "Pattern hammered. Next: full sentence interleaving with に + で + を all in play.",
      "win",
    ),
  ],
};

export const M7_6: LessonContent = {
  id: "ja-m7-6",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — に + で + を",
  description: "Six clozes mixing all three high-leverage particles.",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-6-info-open",
      "Three particles, one drill",
      "Each cloze picks between に (destination/existence), で (setting/means), and を (direct object). No new rules — pattern sorting.",
    ),
    cloze(
      "ja-m7-6-cloze-1",
      "こうえん",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to the park.",
      "こうえんに いきます。",
    ),
    cloze(
      "ja-m7-6-cloze-2",
      "うち",
      " ごはんを たべます。",
      "で",
      ["に", "で", "を", "は"],
      "I eat a meal at home.",
      "うちで ごはんを たべます。",
      "うち = setting → で. ごはん = direct object → を. Both in one sentence.",
    ),
    cloze(
      "ja-m7-6-cloze-3",
      "ほん",
      " よみます。",
      "を",
      ["を", "に", "で", "は"],
      "I read a book.",
      "ほんを よみます。",
    ),
    cloze(
      "ja-m7-6-cloze-4",
      "じてんしゃ",
      " がっこうに いきます。",
      "で",
      ["で", "に", "を", "は"],
      "I go to school by bicycle.",
      "じてんしゃで がっこうに いきます。",
      "じてんしゃ = means → で. がっこう = destination → に. Two particles, distinct roles.",
    ),
    cloze(
      "ja-m7-6-cloze-5",
      "コーヒー",
      " のみます。",
      "を",
      ["を", "に", "で", "は"],
      "I drink coffee.",
      "コーヒーを のみます。",
    ),
    cloze(
      "ja-m7-6-cloze-6",
      "えき",
      " ともだちが います。",
      "に",
      ["に", "で", "を", "は"],
      "My friend is at the station.",
      "えきに ともだちが います。",
      "Existence verb (います) + location point → に. ともだち is the subject of existence → が.",
    ),
    infoStep(
      "ja-m7-6-info-end",
      "Three-particle fluency",
      "Six drills, three particles cleanly sorted. You can now describe motion, setting, means, AND direct objects in one sentence.",
      "win",
    ),
  ],
};

export const M7_7: LessonContent = {
  id: "ja-m7-7",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — actions in the world",
  description: "Five sentences combining verbs + objects + locations.",
  estimatedMinutes: 6,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m7-7-info-open",
      "Build five real sentences",
      "Combine M6 locations + M7 verbs + M7 を. Tap tiles in order.",
    ),
    build(
      "ja-m7-7-s1",
      "Say: I go to the park.",
      "こうえんに いきます",
      ["こうえんに", "いきます", "うちに", "がっこうで"],
      ["こうえんに", "いきます"],
    ),
    build(
      "ja-m7-7-s2",
      "Say: I eat sushi.",
      "わたしは すしを たべます",
      ["わたしは", "すしを", "たべます", "のみます", "ジュースを"],
      ["わたしは", "すしを", "たべます"],
    ),
    build(
      "ja-m7-7-s3",
      "Say: I eat a meal at home.",
      "うちで ごはんを たべます",
      ["うちで", "ごはんを", "たべます", "うちに", "のみます"],
      ["うちで", "ごはんを", "たべます"],
    ),
    build(
      "ja-m7-7-s4",
      "Say: I read my friend's book.",
      "ともだちの ほんを よみます",
      ["ともだちの", "ほんを", "よみます", "わたしの", "かきます"],
      ["ともだちの", "ほんを", "よみます"],
    ),
    build(
      "ja-m7-7-s5",
      "Say: I drink coffee at a café.",
      "カフェで コーヒーを のみます",
      ["カフェで", "コーヒーを", "のみます", "カフェに", "たべます"],
      ["カフェで", "コーヒーを", "のみます"],
    ),
    infoStep(
      "ja-m7-7-info-end",
      "Five real actions",
      "Verbs + objects + locations — full beginner-Japanese sentences.",
      "win",
    ),
  ],
};

export const M7_8: LessonContent = {
  id: "ja-m7-8",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — at a restaurant",
  description: "Order food and drinks. Verbs + を + numbers + ください all in play.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m7-8-info-open",
      "Drop into the scene",
      "You sit down at a Tokyo ramen shop with a friend. Staff brings water; you order; you confirm the bill.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m7-8",
      representative: {
        phrase: "ラーメンを ふたつ ください",
        translation: "Two ramen, please.",
      },
      lines: [
        {
          speaker: "Staff",
          meaningEn: "Welcome. How many?",
          romaji: "irasshaimase. nan-mei sama desu ka",
          kana: "いらっしゃいませ。なんめいさまですか",
          cultureNote: "なんめいさま = polite form of 'how many people.' Standard restaurant greeting.",
        },
        {
          speaker: "You",
          meaningEn: "Two people, please.",
          romaji: "futari desu",
          kana: "ふたりです",
          speakingPhrase: "ふたりです",
        },
        {
          speaker: "Staff",
          meaningEn: "What would you like?",
          romaji: "go-chuumon wa",
          kana: "ごちゅうもんは？",
          cultureNote: "ちゅうもん = order. ご- prefix is the respectful version.",
        },
        {
          speaker: "You",
          meaningEn: "Two ramen and one juice, please.",
          romaji: "raamen wo futatsu to juusu wo hitotsu kudasai",
          kana: "ラーメンを ふたつ と ジュースを ひとつ ください",
          cultureNote: "と (to) connects two items in a list — 'ramen AND juice.'",
          speakingPhrase: "ラーメンを ふたつ ください",
        },
        {
          speaker: "Staff",
          meaningEn: "Understood.",
          romaji: "kashikomarimashita",
          kana: "かしこまりました",
          cultureNote: "Restaurant/shop-service way of saying 'understood.' Don't reply — just nod.",
        },
      ],
    }),
    infoStep(
      "ja-m7-8-info-end",
      "Restaurant Japanese — handled",
      "Five lines, full transaction. M3-M7 grammar synthesized into a real ordering exchange.",
      "win",
    ),
  ],
};

function particleMc(
  id: string,
  prompt: string,
  audioText: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): MultipleChoiceStep {
  return {
    id,
    type: "multiple_choice",
    prompt,
    promptAudioText: audioText,
    options: [
      { id: "correct", text: correct },
      { id: "opt-1", text: distractors[0] },
      { id: "opt-2", text: distractors[1] },
      { id: "opt-3", text: distractors[2] },
    ],
    correctOptionId: "correct",
    explanation,
    optionsHideRomaji: true,
  };
}

const M7_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-1",
      "すし___ たべます。 (I eat sushi.)",
      "すしを たべます",
      "を",
      ["は", "が", "に"],
      "Direct object — を marks what's being acted on.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-2",
      "みず___ のみます。 (I drink water.)",
      "みずを のみます",
      "を",
      ["は", "が", "に"],
      "Direct object → を.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-3",
      "うち___ ごはんを たべます。 (I eat a meal at home.)",
      "うちで ごはんを たべます",
      "で",
      ["に", "は", "を"],
      "Action setting → で.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-4",
      "こうえん___ いきます。 (I go to the park.)",
      "こうえんに いきます",
      "に",
      ["で", "は", "を"],
      "Destination → に. Reuse from M6.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m7-9-mc-5",
      "ほん___ よみます。 (I read a book.)",
      "ほんを よみます",
      "を",
      ["は", "が", "に"],
      "Direct object → を.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m7-9-match-verbs",
      type: "match_pairs",
      prompt: "Match each verb to its meaning",
      pairs: [
        { id: "p1", source: "たべます", target: "eat", sourceAnnotation: [{ surface: "たべます", reading: "たべます" }] },
        { id: "p2", source: "のみます", target: "drink", sourceAnnotation: [{ surface: "のみます", reading: "のみます" }] },
        { id: "p3", source: "いきます", target: "go", sourceAnnotation: [{ surface: "いきます", reading: "いきます" }] },
        { id: "p4", source: "みます", target: "see / watch", sourceAnnotation: [{ surface: "みます", reading: "みます" }] },
        { id: "p5", source: "よみます", target: "read", sourceAnnotation: [{ surface: "よみます", reading: "よみます" }] },
        { id: "p6", source: "かきます", target: "write", sourceAnnotation: [{ surface: "かきます", reading: "かきます" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m7-9-build",
      type: "build_sentence",
      prompt: "Say: I eat a meal at home.",
      targetSentence: "うちで ごはんを たべます",
      tiles: ["うちで", "ごはんを", "たべます", "うちに", "のみます"],
      correctOrder: ["うちで", "ごはんを", "たべます"],
      granularity: "word",
      audioKey: "うちで ごはんを たべます",
      targetAnnotation: [{ surface: "うちで ごはんを たべます", reading: "うちで ごはんを たべます" }],
    } as BuildSentenceStep,
  },
];

const M7_ROW_TEST: RowTestStep = {
  id: "ja-m7-9-test",
  type: "row_test",
  rowId: "m7",
  items: M7_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M7_9: LessonContent = {
  id: "ja-m7-9",
  moduleId: "m7",
  courseId: COURSE,
  languageId: LANG,
  title: "M7 Mastery Test",
  description: "Cumulative test on verbs + を + interleaving with all prior particles.",
  estimatedMinutes: 7,
  xpReward: 35,
  steps: [
    infoStep(
      "ja-m7-9-info-open",
      "Module 7 mastery",
      "Cumulative items across verbs, the を particle, and all prior-module particles. Wrong answers re-queue. Pass once and Module 7 is mastered.",
    ),
    M7_ROW_TEST,
    infoStep(
      "ja-m7-9-info-end",
      "Module 7 complete",
      "You can now describe actions in the world: who eats what, where you go, what you read, how you got there. That's real productive Japanese.",
      "win",
    ),
  ],
};
