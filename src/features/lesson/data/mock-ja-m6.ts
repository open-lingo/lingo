/**
 * M6 — Where things are (restructure 2026-05-16).
 *
 * New grammar:
 *   - に + で (point vs setting)
 *   - が (introduced via existence: ___が あります / います) — first formal
 *     introduction of が, deliberately in the most learner-friendly context
 *
 * Reuses M3-M5: every drill leans on は + の + numbers + ください. The
 * existence construction (___が あります) is the natural home for が — no
 * は-vs-が contrast lesson; that lands in N4-territory later.
 *
 * Lesson list (9 lessons — one extra for the が/に/で synthesis):
 *   M6-1  Place vocab — 6 locations
 *   M6-2  Grammar Rule Card — に (destination + existence)
 *   M6-3  Grammar Rule Card — で (action setting + means)
 *   M6-4  Grammar Rule Card — が (the existence pattern)
 *   M6-5  Iteration — に + で interleaved
 *   M6-6  Iteration — が + あります/います drilled
 *   M6-7  Sentence Build (5 sentences)
 *   M6-8  Dialogue — asking directions / "is there a ... around here?"
 *   M6-9  Row test (mastery ★)
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
  vocab,
} from "./_jaGrammarHelpers";

const COURSE = "mock-1";
const LANG = "ja";

export const M6_1: LessonContent = {
  id: "ja-m6-1",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Places",
  description: "Six locations you'll see on every map of Japan.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m6-1-info-open",
      "Place vocab",
      "Six locations. Every Japanese address starts with 'X minutes from Y eki' (train station) — names of places are the spine of getting around.",
    ),
    vocab(
      "ja-m6-1-koen",
      "Park",
      "kouen",
      "こうえん",
      "Pronounced 'koh-en' (long o). Every neighborhood has at least one.",
    ),
    vocab(
      "ja-m6-1-gakkou",
      "School",
      "gakkou",
      "がっこう",
      "Generic for any educational institution from elementary up to university.",
    ),
    vocab(
      "ja-m6-1-uchi",
      "Home / my place",
      "uchi",
      "うち",
      "Used both for 'my house' and 'my family/in-group.' Context decides.",
    ),
    vocab(
      "ja-m6-1-eki",
      "Train station",
      "eki",
      "えき",
      "Every Japanese address starts with 'X minutes from Y eki.'",
    ),
    vocab(
      "ja-m6-1-toire",
      "Toilet",
      "toire",
      "トイレ",
      "Katakana loanword. 'トイレは どこですか' — universal travel question.",
    ),
    vocab(
      "ja-m6-1-konbini",
      "Convenience store",
      "konbini",
      "コンビニ",
      "7-Eleven, FamilyMart, Lawson — the holy trinity of late-night Japan.",
    ),
    infoStep(
      "ja-m6-1-info-end",
      "Map vocab loaded",
      "Six places. Next: three particles that put things AT and BY them.",
      "win",
    ),
  ],
};

const RULE_NI = grammarRule({
  id: "ja-m6-2-rule-ni",
  title: "に — destination point + existence",
  rule:
    "に marks a POINT — either a destination you're moving TOWARD (がっこうに いく = go TO school) or a point of existence (えきに います = I AM AT the station). Verbs of motion (いく/くる/かえる) and existence verbs (います/あります) both take に.",
  examples: [
    {
      ja: "がっこうに いきます。",
      romaji: "gakkou ni ikimasu.",
      en: "I go to school. (destination)",
    },
    {
      ja: "えきに います。",
      romaji: "eki ni imasu.",
      en: "I'm at the station. (existence)",
    },
  ],
  antiPattern: {
    ja: "がっこうで いきます。",
    romaji: "gakkou de ikimasu.",
    en: "(broken — 'I go school-as-setting')",
    why: "Going TO a place is movement toward a destination point — に, never で. で is for the place an action happens (next card).",
  },
  cultureNote:
    "に is the 'pinpoint' particle. Whenever the question is 'WHERE TO?' or 'WHERE EXACTLY?', に is your particle.",
});

export const M6_2: LessonContent = {
  id: "ja-m6-2",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "に — destination + existence",
  description: "The pinpoint particle. Direction toward a place, or being AT a place.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m6-2-info-open",
      "The pinpoint particle",
      "に marks a single point — where you're going or where you are. It pairs with movement verbs (いく/くる/かえる) and existence verbs (います/あります).",
    ),
    RULE_NI,
    cloze(
      "ja-m6-2-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
      "Movement verb (いく) + destination point. に.",
    ),
    cloze(
      "ja-m6-2-cloze-2",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
      "Existence verb (いる/います) + location point. に.",
    ),
    cloze(
      "ja-m6-2-cloze-3",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
      "Movement verb (かえる/return) + destination. に.",
    ),
    cloze(
      "ja-m6-2-cloze-4",
      "こうえん",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the park.",
      "こうえんに います。",
    ),
    infoStep(
      "ja-m6-2-info-end",
      "Pinpoint locked",
      "Four drills, one pattern: location point + に + (motion or existence verb). Next: で, the setting particle.",
      "win",
    ),
  ],
};

const RULE_DE = grammarRule({
  id: "ja-m6-3-rule-de",
  title: "で — action setting + means",
  rule:
    "で marks the SETTING of an action — the place an action happens (がっこうで べんきょう = study AT school), or the MEANS you use to do it (でんしゃで いく = go BY train). The English 'at' collapses both with に; Japanese keeps them separate.",
  examples: [
    {
      ja: "がっこうで べんきょうします。",
      romaji: "gakkou de benkyou shimasu.",
      en: "I study at school. (where the action happens)",
    },
    {
      ja: "でんしゃで いきます。",
      romaji: "densha de ikimasu.",
      en: "I go by train. (means of motion)",
    },
  ],
  antiPattern: {
    ja: "えきで います。",
    romaji: "eki de imasu.",
    en: "(broken — 'I exist at-station-as-setting')",
    why: "Existence (いる/ある) takes に, not で. で is for ACTIONS happening at a setting. Just being somewhere isn't an action.",
  },
  cultureNote:
    "Filter: am I pointing at the destination/location (に), or describing the place an action happens / the means I'm using (で)? Most learners over-use に because it shows up first in beginner lessons.",
});

export const M6_3: LessonContent = {
  id: "ja-m6-3",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "で — action setting + means",
  description: "The 'where it happens' particle. Also the 'by what means.'",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m6-3-info-open",
      "Setting + means",
      "に was the point. で is the stage. Whenever an ACTION happens somewhere, the place takes で. The means (transport, tools) also takes で.",
    ),
    RULE_DE,
    cloze(
      "ja-m6-3-cloze-1",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
      "The action (studying) HAPPENS at home — で marks the setting.",
    ),
    cloze(
      "ja-m6-3-cloze-2",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "の"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
      "Working is an action happening at a setting — で.",
    ),
    cloze(
      "ja-m6-3-cloze-3",
      "でんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "へ"],
      "I go by train.",
      "でんしゃで いきます。",
      "で also marks the MEANS — how you do something.",
    ),
    cloze(
      "ja-m6-3-cloze-4",
      "じてんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "の"],
      "I go by bicycle.",
      "じてんしゃで いきます。",
    ),
    infoStep(
      "ja-m6-3-info-end",
      "Setting locked",
      "Four drills, two roles: action-setting (うちで) and means (でんしゃで). Next: が, finally — but in its friendliest use.",
      "win",
    ),
  ],
};

const RULE_GA_EXISTENCE = grammarRule({
  id: "ja-m6-4-rule-ga",
  title: "が — the existence particle (___が あります / います)",
  rule:
    "が marks the subject — most commonly the thing being introduced as NEW information. The friendliest use: existence sentences. 'こうえん が あります' = 'there's a park.' あります for inanimate things, います for living things. Don't worry about は vs が contrast yet — that's a much later lesson.",
  examples: [
    {
      ja: "こうえんが あります。",
      romaji: "kouen ga arimasu.",
      en: "There's a park.",
    },
    {
      ja: "ねこが います。",
      romaji: "neko ga imasu.",
      en: "There's a cat. (a living thing — います, not あります)",
    },
  ],
  antiPattern: {
    ja: "こうえんは あります。",
    romaji: "kouen wa arimasu.",
    en: "(off — 'as for the park, it exists.' Grammatical but the wrong feel)",
    why: "In existence sentences (saying something is THERE), Japanese uses が because the thing IS the new information. は frames an existing topic; が introduces. The two ARE different, but you don't need to master the contrast — just learn the ___が あります / います pattern as a unit.",
  },
  cultureNote:
    "Living things (people, animals) take います. Inanimate things take あります. Robots, plants, and cars are arguments — modern usage drifts. Plants = あります (no will/movement); cars = あります (machines, no agency).",
});

export const M6_4: LessonContent = {
  id: "ja-m6-4",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "が — there is / there are",
  description:
    "The existence pattern. ___が あります (inanimate) / ___が います (living).",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m6-4-info-open",
      "Finally — が",
      "が is famous as 'the other particle' that confuses beginners. We're introducing it in its friendliest form: the existence pattern. 'X が あります/います' = 'there's an X.' Memorize this as a unit and worry about は vs が later.",
    ),
    RULE_GA_EXISTENCE,
    cloze(
      "ja-m6-4-cloze-1",
      "こうえん",
      " あります。",
      "が",
      ["が", "は", "の", "を"],
      "There's a park.",
      "こうえんが あります。",
      "Existence sentence — inanimate thing + が + あります.",
    ),
    cloze(
      "ja-m6-4-cloze-2",
      "ねこ",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a cat.",
      "ねこが います。",
      "Living thing + が + います.",
    ),
    cloze(
      "ja-m6-4-cloze-3",
      "コンビニ",
      " あります。",
      "が",
      ["が", "は", "の", "に"],
      "There's a convenience store.",
      "コンビニが あります。",
    ),
    cloze(
      "ja-m6-4-cloze-4",
      "トイレ",
      " ありますか。",
      "が",
      ["が", "は", "の", "を"],
      "Is there a toilet?",
      "トイレが ありますか。",
      "Existence + question (か). The most useful sentence in tourist Japan.",
    ),
    infoStep(
      "ja-m6-4-info-end",
      "が, unlocked (gently)",
      "Four drills, one pattern: X が あります/います. You now have the friendliest use of が — and 90% of beginner が encounters in the wild are this pattern.",
      "win",
    ),
  ],
};

export const M6_5: LessonContent = {
  id: "ja-m6-5",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — に + で",
  description: "Six clozes mixing motion + setting + means.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m6-5-info-open",
      "Sort by role",
      "Each cloze asks the two-question filter: am I pointing at a destination (に), or naming where the action happens / how I'm doing it (で)?",
    ),
    cloze(
      "ja-m6-5-cloze-1",
      "がっこう",
      " いきます。",
      "に",
      ["に", "で", "を", "は"],
      "I go to school.",
      "がっこうに いきます。",
    ),
    cloze(
      "ja-m6-5-cloze-2",
      "うち",
      " べんきょうします。",
      "で",
      ["に", "で", "を", "の"],
      "I study at home.",
      "うちで べんきょうします。",
    ),
    cloze(
      "ja-m6-5-cloze-3",
      "じてんしゃ",
      " いきます。",
      "で",
      ["に", "で", "を", "の"],
      "I go by bicycle.",
      "じてんしゃで いきます。",
    ),
    cloze(
      "ja-m6-5-cloze-4",
      "コンビニ",
      " はたらきます。",
      "で",
      ["に", "で", "を", "は"],
      "I work at a convenience store.",
      "コンビニで はたらきます。",
    ),
    cloze(
      "ja-m6-5-cloze-5",
      "うち",
      " かえります。",
      "に",
      ["に", "で", "を", "が"],
      "I'm going home.",
      "うちに かえります。",
    ),
    cloze(
      "ja-m6-5-cloze-6",
      "えき",
      " います。",
      "に",
      ["に", "で", "を", "は"],
      "I'm at the station.",
      "えきに います。",
    ),
    infoStep(
      "ja-m6-5-info-end",
      "に / で sorted",
      "Six drills, cleanly split. Next: が drilled in the existence pattern.",
      "win",
    ),
  ],
};

export const M6_6: LessonContent = {
  id: "ja-m6-6",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved — が + あります / います",
  description: "Six existence drills with location context.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m6-6-info-open",
      "X が あります/います",
      "Six drills on the existence pattern. Pick the right verb (あります for inanimate, います for living) and the right particle (almost always が).",
    ),
    cloze(
      "ja-m6-6-cloze-1",
      "ともだち",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a friend (here).",
      "ともだちが います。",
    ),
    cloze(
      "ja-m6-6-cloze-2",
      "トイレ",
      " ありますか。",
      "が",
      ["が", "は", "の", "を"],
      "Is there a toilet?",
      "トイレが ありますか。",
    ),
    cloze(
      "ja-m6-6-cloze-3",
      "こうえん",
      " あります。",
      "が",
      ["が", "は", "の", "を"],
      "There's a park.",
      "こうえんが あります。",
    ),
    cloze(
      "ja-m6-6-cloze-4",
      "せんせい",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "The teacher is here.",
      "せんせいが います。",
    ),
    cloze(
      "ja-m6-6-cloze-5",
      "コンビニ",
      " ありますか。",
      "が",
      ["が", "は", "の", "を"],
      "Is there a convenience store?",
      "コンビニが ありますか。",
      "The most useful overseas-traveler sentence after 'where's the toilet.'",
    ),
    cloze(
      "ja-m6-6-cloze-6",
      "ねこ",
      " います。",
      "が",
      ["が", "は", "の", "を"],
      "There's a cat.",
      "ねこが います。",
    ),
    infoStep(
      "ja-m6-6-info-end",
      "が in its friendliest form",
      "Six existence drills. You now have a clean mental slot for 'X が あります/います' = 'there's an X.' No is-vs-as-for confusion needed.",
      "win",
    ),
  ],
};

export const M6_7: LessonContent = {
  id: "ja-m6-7",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build — places + actions",
  description: "Five sentences combining locations + に/で/が.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m6-7-info-open",
      "Build five",
      "Each sentence uses M6 grammar with the M3-M5 baseline. Tap the tiles in order.",
    ),
    build(
      "ja-m6-7-s1",
      "Say: I go to school by bicycle.",
      "じてんしゃで がっこうに いきます",
      ["じてんしゃで", "がっこうに", "いきます", "うちで", "コンビニに"],
      ["じてんしゃで", "がっこうに", "いきます"],
    ),
    build(
      "ja-m6-7-s2",
      "Ask: Is there a toilet?",
      "トイレが ありますか",
      ["トイレが", "ありますか", "ねこが", "いますか"],
      ["トイレが", "ありますか"],
    ),
    build(
      "ja-m6-7-s3",
      "Say: There's a park.",
      "こうえんが あります",
      ["こうえんが", "あります", "ねこが", "います"],
      ["こうえんが", "あります"],
    ),
    build(
      "ja-m6-7-s4",
      "Say: I study at home.",
      "うちで べんきょうします",
      ["うちで", "べんきょうします", "がっこうで", "うちに"],
      ["うちで", "べんきょうします"],
    ),
    build(
      "ja-m6-7-s5",
      "Say: I'm at the station.",
      "えきに います",
      ["えきに", "います", "あります", "がっこうで"],
      ["えきに", "います"],
    ),
    infoStep(
      "ja-m6-7-info-end",
      "Five sentences, full grid",
      "Locations + に/で/が + verbs. You can now say where you are, where you're going, what you do there, and what's around.",
      "win",
    ),
  ],
};

export const M6_8: LessonContent = {
  id: "ja-m6-8",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — asking directions",
  description:
    "Four lines, classic 'is there a ... around here?' exchange.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m6-8-info-open",
      "Drop into the scene",
      "You're walking through Shibuya looking for a convenience store. You stop a stranger.",
      "culture",
    ),
    ...dialogueLesson({
      idPrefix: "ja-m6-8",
      representative: {
        phrase: "コンビニが ありますか",
        translation: "Is there a convenience store?",
      },
      lines: [
        {
          speaker: "You",
          meaningEn: "Excuse me. Is there a convenience store around here?",
          romaji: "sumimasen. konbini ga arimasu ka",
          kana: "すみません。コンビニが ありますか",
          speakingPhrase: "コンビニが ありますか",
        },
        {
          speaker: "Stranger",
          meaningEn: "Yes. There's a FamilyMart at the station.",
          romaji: "hai. eki ni FamilyMart ga arimasu",
          kana: "はい。えきに FamilyMart が あります",
          cultureNote: "Note える existence verb + に for the location point.",
        },
        {
          speaker: "You",
          meaningEn: "Is the station far?",
          romaji: "eki wa tooi desu ka",
          kana: "えきは とおいですか",
          cultureNote: "とおい = far (adjective exposure — same pattern as M3's あおい/あかい).",
        },
        {
          speaker: "Stranger",
          meaningEn: "No, it's close. Thank you. (you reply)",
          romaji: "iie, chikai desu. arigatou gozaimasu",
          kana: "いいえ、ちかいです。ありがとうございます",
          speakingPhrase: "ありがとうございます",
        },
      ],
    }),
    infoStep(
      "ja-m6-8-info-end",
      "Directions handled",
      "You can now find anything in Japan: 'X が ありますか' opens the conversation, location + に/で fills in the answer.",
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

const M6_TEST_ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-1",
      "がっこう___ いきます。 (I go to school.)",
      "がっこうに いきます",
      "に",
      ["で", "は", "を"],
      "Movement verb (いく) + destination point.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-2",
      "うち___ べんきょうします。 (I study at home.)",
      "うちで べんきょうします",
      "で",
      ["に", "は", "を"],
      "Studying is an action happening at a setting — で.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-3",
      "トイレ___ ありますか。 (Is there a toilet?)",
      "トイレが ありますか",
      "が",
      ["は", "を", "に"],
      "Existence pattern — X が あります.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-4",
      "ねこ___ います。 (There's a cat.)",
      "ねこが います",
      "が",
      ["は", "を", "の"],
      "Living thing + が + います.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m6-9-mc-5",
      "でんしゃ___ いきます。 (I go by train.)",
      "でんしゃで いきます",
      "で",
      ["に", "は", "を"],
      "Means of motion = で.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m6-9-match-places",
      type: "match_pairs",
      prompt: "Match each place to its meaning",
      pairs: [
        { id: "p1", source: "こうえん", target: "park", sourceAnnotation: [{ surface: "こうえん", reading: "こうえん" }] },
        { id: "p2", source: "がっこう", target: "school", sourceAnnotation: [{ surface: "がっこう", reading: "がっこう" }] },
        { id: "p3", source: "うち", target: "home", sourceAnnotation: [{ surface: "うち", reading: "うち" }] },
        { id: "p4", source: "えき", target: "station", sourceAnnotation: [{ surface: "えき", reading: "えき" }] },
        { id: "p5", source: "トイレ", target: "toilet", sourceAnnotation: [{ surface: "トイレ", reading: "トイレ" }] },
        { id: "p6", source: "コンビニ", target: "convenience store", sourceAnnotation: [{ surface: "コンビニ", reading: "コンビニ" }] },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m6-9-build",
      type: "build_sentence",
      prompt: "Say: I go to school by bicycle.",
      targetSentence: "じてんしゃで がっこうに いきます",
      tiles: ["じてんしゃで", "がっこうに", "いきます", "うちで", "コンビニに"],
      correctOrder: ["じてんしゃで", "がっこうに", "いきます"],
      granularity: "word",
      audioKey: "じてんしゃで がっこうに いきます",
      targetAnnotation: [{ surface: "じてんしゃで がっこうに いきます", reading: "じてんしゃで がっこうに いきます" }],
    } as BuildSentenceStep,
  },
];

const M6_ROW_TEST: RowTestStep = {
  id: "ja-m6-9-test",
  type: "row_test",
  rowId: "m6",
  items: M6_TEST_ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const M6_9: LessonContent = {
  id: "ja-m6-9",
  moduleId: "m6",
  courseId: COURSE,
  languageId: LANG,
  title: "M6 Mastery Test",
  description: "Cumulative test on locations + に/で + the existence pattern.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    infoStep(
      "ja-m6-9-info-open",
      "Module 6 mastery",
      "Cumulative items: location particles, existence verbs, and vocab. Wrong answers re-queue. Pass once and Module 6 is mastered.",
    ),
    M6_ROW_TEST,
    infoStep(
      "ja-m6-9-info-end",
      "Module 6 complete",
      "You can find things, describe where they are, where you are, and how you got there. M7 brings verbs in motion — full sentences with actions and direct objects (を).",
      "win",
    ),
  ],
};
