/**
 * m7.ts — Ma famille — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01 per the playbook arc (docs/fr-authoring-playbook.md
 * §8): m6's L10 promised «la famille — what's YOURS».
 *
 * SCOPE DECISIONS (all deliberate):
 *   - «j'ai» / «tu as» are CHUNKS (the je vais / je voudrais precedent) —
 *     no avoir paradigm; the verb machine stays m11's job.
 *   - Possessives are the FOUR that ride the gender sides the course has
 *     drilled since m3: mon/ma (my), ton/ta (your) — same two doors as
 *     un/une and le/la, sorted in L7 exactly like m5's au/à-la sort.
 *     son/sa (his/her — one more ambiguity) and notre/votre wait.
 *   - NO SIBLING COUNTING: «j'ai deux frères» writes a plural, and
 *     plurals are deferred to m10 (playbook §6). «j'ai un frère et une
 *     sœur» covers the household with m1's «et». A machine pin keeps
 *     plural family forms out.
 *   - NO «ami/amie»: «ma amie» → «mon amie» is a real French exception
 *     (ma + vowel takes MON) that deserves its own beat beside the
 *     amie debut — DEFERRED, added to the playbook registry. All m7
 *     possessed nouns are consonant-initial, so mon/ma/ton/ta compose
 *     breach-free by construction.
 *   - Family art: frère 👦 / sœur 👧 / père 🧔 / mère 👩‍🦰 keep clear of
 *     m2's monsieur 👨 / madame 👩; famille is the ZWJ family glyph.
 *   - The m2 payoff is authored on purpose: «Mon frère est étudiant» /
 *     «Ma sœur est étudiante» — est + the audible -e agreement return
 *     with possessives on top (L5), and the étudiant/étudiante cloze
 *     lane alternates across L5/L8.
 *   - m3's chat/chien become POSSESSED («mon chat», «j'aime mon chien»)
 *     — the module's promised emotional beat.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   j'ai un frère L1 · j'ai un frère et une sœur L1 · c'est mon frère L2 ·
 *   c'est ma sœur L2 · mon chat L2 · tu as un chien ? L3 · j'ai un chat L3 ·
 *   j'aime ma famille L4 · c'est mon père L4 · mon frère est étudiant L5 ·
 *   ma sœur est étudiante L5 · mon chien L6 · j'aime mon chien L7
 *   recalls drawn: je voudrais un croissant L1 (m6) · j'ai un frère et
 *   une sœur L2+L8 · c'est mon frère L3+L10 · tu as un chien ? L4 ·
 *   j'aime ma famille L5+L8 · c'est ma sœur L6 · j'ai un chat L6 ·
 *   mon chien L7 · c'est mon père L7 · ma sœur est étudiante L8+L10 ·
 *   j'aime mon chien L9 · mon frère est étudiant L9.
 *
 * Cast: Chloé shares her own brother (L2) and scrolls your photos (L9);
 * Hugo asks after your cat; Léa meets your mother (L4) and your whole
 * family hosts the gang in the L10 finale; Inès and her cat, Louis
 * meeting everyone (L6).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabMcq,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  listeningBuildSentence,
  genderSort,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M7_ATOMS: FrAtom[] = [
  atom({ surface: "j'ai", meaningEn: "I have", partOfSpeech: "phrase", fromModule: "m7", kind: "phrase", hint: "zhay — je + ai, the shortest squeeze in French" }),
  atom({ surface: "tu as", meaningEn: "you have", partOfSpeech: "phrase", fromModule: "m7", kind: "phrase", hint: "tu AH — the -s is silent, as ever" }),
  atom({ surface: "mon", meaningEn: "my (with le-words)", partOfSpeech: "particle", fromModule: "m7", kind: "particle", hint: "mohn — my, blue-m side" }),
  atom({ surface: "ma", meaningEn: "my (with la-words)", partOfSpeech: "particle", fromModule: "m7", kind: "particle", hint: "mah — my, pink-f side" }),
  atom({ surface: "ton", meaningEn: "your (with le-words)", partOfSpeech: "particle", fromModule: "m7", kind: "particle", hint: "tohn — your, blue-m side" }),
  atom({ surface: "ta", meaningEn: "your (with la-words)", partOfSpeech: "particle", fromModule: "m7", kind: "particle", hint: "tah — your, pink-f side" }),
  atom({ surface: "frère", meaningEn: "brother", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "👦", hint: "frair — è wide open" }),
  atom({ surface: "sœur", meaningEn: "sister", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "👧", hint: "seur — œ is one letter, one sound" }),
  atom({ surface: "père", meaningEn: "father", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "🧔", hint: "pair" }),
  atom({ surface: "mère", meaningEn: "mother", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "👩‍🦰", hint: "mair — sounds like père with an m" }),
  atom({ surface: "famille", meaningEn: "family", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "👨‍👩‍👧‍👦", hint: "fa-MEE — -ille melts to a y-sound" }),
];

/** L1 — «j'ai»: what's yours starts with what you have. Brother and
 *  sister debut. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m7-1-info-jai",
      "What you have",
      "«j'ai» — I have (zhay — je + ai, the shortest squeeze in French). «J'ai un frère» — I have a brother (frair). «J'ai une sœur» — a sister (seur — that œ is one letter, one sound). Module 6 fed you; this one is about who's at the table.",
      "grammar",
    ),
    vocabMcq(
      "fr-m7-1-img-frere",
      { surface: "frère", meaningEn: "the brother", emoji: "👦" },
      [
        { surface: "sœur", emoji: "👧" },
        { surface: "chat", emoji: "🐱" },
        { surface: "chien", emoji: "🐶" },
      ],
    ),
    {
      id: "fr-m7-1-map-unfrere",
      type: "word_map",
      tokens: ["j'ai", "un", "frère"],
      pairs: [
        { en: "I have", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "brother", tokenIndex: 2 },
      ],
      audioText: "j'ai un frère",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«j'ai» joins the j-squeeze family — j'aime, j'ai. The sides ride along, as always.",
    },
    speaking("fr-m7-1-speak-unfrere", "j'ai un frère", "I have a brother", []),
    vocabMcq(
      "fr-m7-1-img-soeur",
      { surface: "sœur", meaningEn: "the sister", emoji: "👧" },
      [
        { surface: "frère", emoji: "👦" },
        { surface: "chat", emoji: "🐱" },
        { surface: "chien", emoji: "🐶" },
      ],
    ),
    cloze(
      "fr-m7-1-cloze-une",
      "j'ai",
      "sœur",
      "une",
      ["une", "un"],
      "I have a sister",
      "j'ai une sœur",
      "«sœur» — pink-f: «une», even when she's yours.",
    ),
    {
      // TAIL: m6 by ear.
      id: "fr-m7-1-hear-fromage",
      type: "word_image_mcq",
      meaningEn: "le fromage",
      options: [
        { id: "correct", word: "le fromage", emoji: "🧀" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "le croissant", emoji: "🥐" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m6 ordering lane, from memory.
    speaking(
      "fr-m7-1-speak-croissant-recall",
      "je voudrais un croissant",
      "I would like a croissant",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m7-1-lc-unesoeur",
      audioText: "j'ai une sœur",
      correctMeaningEn: "I have a sister.",
      distractorsEn: ["I have a brother.", "Do you have a sister?", "That's my sister."],
    }),
    build(
      "fr-m7-1-build-both",
      "Build: 'I have a brother and a sister'",
      "j'ai un frère et une sœur",
      ["j'ai", "un", "frère", "et", "une", "sœur", "ou"],
      ["j'ai", "un", "frère", "et", "une", "sœur"],
    ),
    {
      id: "fr-m7-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jai", source: "j'ai", target: "I have" },
        { id: "p-frere", source: "frère", target: "brother" },
        { id: "p-soeur", source: "sœur", target: "sister" },
        { id: "p-chat", source: "chat", target: "cat" },
        { id: "p-merci", source: "merci", target: "thank you" },
        { id: "p-dix", source: "dix", target: "ten" },
      ],
    },
    // WIN: the whole household in one line — printed first voicing.
    speaking(
      "fr-m7-1-speak-both",
      "j'ai un frère et une sœur",
      "I have a brother and a sister",
      [],
    ),
  ];
}

/** L2 — mon/ma: make it yours. The chat becomes YOURS. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m7-2-info-monma",
      "Make it yours",
      "«mon» and «ma» — my — ride the same two sides as un/une: «mon frère» (blue-m), «ma sœur» (pink-f). Point at your people: «C'est mon frère.» — that's my brother. One system, another door.",
      "grammar",
    ),
    {
      id: "fr-m7-2-map-monfrere",
      type: "word_map",
      tokens: ["c'est", "mon", "frère"],
      pairs: [
        { en: "that's", tokenIndex: 0 },
        { en: "my", tokenIndex: 1 },
        { en: "brother", tokenIndex: 2 },
      ],
      audioText: "c'est mon frère",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«mon» glows blue with its noun — my-words wear the sides too.",
    },
    speaking("fr-m7-2-speak-monfrere", "c'est mon frère", "that's my brother", []),
    cloze(
      "fr-m7-2-cloze-mon",
      "c'est",
      "frère",
      "mon",
      ["mon", "ma"],
      "that's my brother",
      "c'est mon frère",
      "«frère» — blue-m, so «mon».",
    ),
    {
      id: "fr-m7-2-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "📱",
        title: "Chloé shows a photo",
        setting: "A guy with her exact smile.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-frere",
          npc: {
            speaker: "Chloé",
            kana: "C'est mon frère !",
            audioText: "c'est mon frère",
            gloss: "That's my brother!",
          },
          goal: "Meet him politely — you know how.",
          reply: {
            mode: "choice",
            options: [
              { id: "enchante", text: "enchanté" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "enchante",
            audioText: "enchanté",
          },
          replyGloss: "Nice to meet you.",
          explanation:
            "«enchanté» — module 1's handshake, still opening every introduction.",
        },
      ],
    },
    {
      id: "fr-m7-2-map-masoeur",
      type: "word_map",
      tokens: ["c'est", "ma", "sœur"],
      pairs: [
        { en: "that's", tokenIndex: 0 },
        { en: "my", tokenIndex: 1 },
        { en: "sister", tokenIndex: 2 },
      ],
      audioText: "c'est ma sœur",
      tokenGenders: { 1: "f", 2: "f" },
    },
    speaking("fr-m7-2-speak-masoeur", "c'est ma sœur", "that's my sister", []),
    cloze(
      "fr-m7-2-cloze-ma",
      "c'est",
      "sœur",
      "ma",
      ["ma", "mon"],
      "that's my sister",
      "c'est ma sœur",
      "«sœur» — pink-f, so «ma». Alternate until it's a reflex.",
    ),
    {
      // Same-lesson pair by EAR.
      id: "fr-m7-2-hear-lasoeur",
      type: "word_image_mcq",
      meaningEn: "la sœur",
      options: [
        { id: "correct", word: "la sœur", emoji: "👧" },
        { id: "o1", word: "le frère", emoji: "👦" },
        { id: "o2", word: "le chat", emoji: "🐱" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1's win, from memory.
    speaking(
      "fr-m7-2-speak-both-recall",
      "j'ai un frère et une sœur",
      "I have a brother and a sister",
      [],
      "recall",
    ),
    listeningCompSentence({
      // TAIL: m2 lane — planting L5's payoff.
      id: "fr-m7-2-lc-etudiant",
      audioText: "il est étudiant",
      correctMeaningEn: "He is a student.",
      distractorsEn: ["She is a student.", "That's my brother.", "He is my father."],
    }),
    {
      id: "fr-m7-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-mon", source: "mon", target: "my (le-words)" },
        { id: "p-ma", source: "ma", target: "my (la-words)" },
        { id: "p-frere", source: "frère", target: "brother" },
        { id: "p-soeur", source: "sœur", target: "sister" },
        { id: "p-enchante", source: "enchanté", target: "nice to meet you" },
        { id: "p-trois", source: "trois", target: "three" },
      ],
    },
    // WIN: the m3 cat, finally yours — printed first voicing.
    speaking("fr-m7-2-speak-monchat", "mon chat", "my cat", []),
  ];
}

/** L3 — «tu as … ?» and ton/ta: your turn to ask, their stuff to name. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m7-3-info-tuas",
      "Your turn to ask",
      "«tu as» — you have (tu AH, silent -s as ever): «Tu as un chien ?» — do you have a dog? And their side of the table: «ton chien», «ta sœur» — your, on the same two sides as mon/ma.",
      "grammar",
    ),
    {
      id: "fr-m7-3-map-tuas",
      type: "word_map",
      tokens: ["tu as", "un", "chien"],
      pairs: [
        { en: "you have", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "dog", tokenIndex: 2 },
      ],
      audioText: "tu as un chien ?",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "The rising voice makes it a question — the same cheap trick as «tu aimes… ?».",
    },
    speaking("fr-m7-3-speak-tuas", "tu as un chien ?", "do you have a dog?", []),
    {
      id: "fr-m7-3-sim-hugo",
      type: "dialogue_sim",
      scene: {
        emoji: "🐱",
        title: "Hugo hears a meow",
        setting: "From your bag. Awkward.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-chat",
          npc: {
            speaker: "Hugo",
            kana: "Tu as un chat ?",
            audioText: "tu as un chat ?",
            gloss: "Do you have a cat?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijai", text: "oui j'ai un chat" },
              { id: "ouituas", text: "oui tu as un chat" },
              { id: "nonmerci", text: "non merci" },
            ],
            correctOptionId: "ouijai",
            audioText: "oui j'ai un chat",
          },
          replyGloss: "Yes, I have a cat.",
          explanation:
            "His «tu as», your «j'ai» — the flip's third verb, same reflex.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m7-3-lc-tuasunesoeur",
      audioText: "tu as une sœur ?",
      correctMeaningEn: "Do you have a sister?",
      distractorsEn: ["I have a sister.", "Do you have a brother?", "Is that your sister?"],
    }),
    cloze(
      "fr-m7-3-cloze-ton",
      "c'est",
      "chien ?",
      "ton",
      ["ton", "ta"],
      "is that your dog?",
      "c'est ton chien ?",
      "«chien» — blue-m: «ton», your on the blue side.",
    ),
    {
      // TAIL: m6 by ear.
      id: "fr-m7-3-hear-addition",
      type: "word_image_mcq",
      meaningEn: "l'addition",
      options: [
        { id: "correct", word: "l'addition", emoji: "🧾" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "le sandwich", emoji: "🥪" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: yesterday's claim, from memory.
    speaking("fr-m7-3-speak-monfrere-recall", "c'est mon frère", "that's my brother", [], "recall"),
    cloze(
      "fr-m7-3-cloze-ta",
      "c'est",
      "sœur ?",
      "ta",
      ["ta", "ton"],
      "is that your sister?",
      "c'est ta sœur ?",
      "«sœur» — pink-f: «ta». The sides never take a day off.",
    ),
    build(
      "fr-m7-3-build-tuasunfrere",
      "Build: 'do you have a brother?'",
      "tu as un frère ?",
      ["tu as", "un", "frère ?", "une", "j'ai"],
      ["tu as", "un", "frère ?"],
    ),
    listeningCompSentence({
      // TAIL: m4 existence lane.
      id: "fr-m7-3-lc-parcici",
      audioText: "il y a un parc ici",
      correctMeaningEn: "There's a park here.",
      distractorsEn: ["There's no park.", "Where is the park?", "I'm going to the park."],
    }),
    {
      id: "fr-m7-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-tuas", source: "tu as", target: "you have" },
        { id: "p-ton", source: "ton", target: "your (le-words)" },
        { id: "p-ta", source: "ta", target: "your (la-words)" },
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-pardon", source: "pardon", target: "excuse me / sorry" },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: own the cat out loud — printed first voicing.
    speaking("fr-m7-3-speak-jaiunchat", "j'ai un chat", "I have a cat", []),
  ];
}

/** L4 — la famille, père, mère — and Léa meets yours. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m7-4-info-famille",
      "The whole set",
      "«la famille» — family (fa-MEE, the -ille melting to a y-sound). «mon père» — my father (pair). «ma mère» — my mother (mair — père with an m). «J'aime ma famille» — and now you can say it like you mean it.",
      "grammar",
    ),
    vocabMcq(
      "fr-m7-4-img-famille",
      { surface: "famille", meaningEn: "the family", emoji: "👨‍👩‍👧‍👦" },
      [
        { surface: "frère", emoji: "👦" },
        { surface: "sœur", emoji: "👧" },
        { surface: "maison", emoji: "🏠" },
      ],
    ),
    {
      id: "fr-m7-4-map-mafamille",
      type: "word_map",
      tokens: ["j'aime", "ma", "famille"],
      pairs: [
        { en: "I love", tokenIndex: 0 },
        { en: "my", tokenIndex: 1 },
        { en: "family", tokenIndex: 2 },
      ],
      audioText: "j'aime ma famille",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote:
        "m3's liking machine, m7's owners — the course compounds, pink-f all the way down.",
    },
    speaking("fr-m7-4-speak-mafamille", "j'aime ma famille", "I love my family", []),
    vocabMcq(
      "fr-m7-4-img-pere",
      { surface: "père", meaningEn: "the father", emoji: "🧔" },
      [
        { surface: "mère", emoji: "👩‍🦰" },
        { surface: "frère", emoji: "👦" },
        { surface: "chien", emoji: "🐶" },
      ],
    ),
    cloze(
      "fr-m7-4-cloze-mon",
      "c'est",
      "père",
      "mon",
      ["mon", "ma"],
      "that's my father",
      "c'est mon père",
      "«père» — blue-m: «mon père».",
    ),
    vocabMcq(
      "fr-m7-4-img-mere",
      { surface: "mère", meaningEn: "the mother", emoji: "👩‍🦰" },
      [
        { surface: "père", emoji: "🧔" },
        { surface: "sœur", emoji: "👧" },
        { surface: "famille", emoji: "👨‍👩‍👧‍👦" },
      ],
    ),
    // TAIL: L3's question, from memory.
    speaking("fr-m7-4-speak-tuas-recall", "tu as un chien ?", "do you have a dog?", [], "recall"),
    listeningCompSentence({
      id: "fr-m7-4-lc-mamere",
      audioText: "c'est ma mère",
      correctMeaningEn: "That's my mother.",
      distractorsEn: ["That's my father.", "That's my sister.", "That's my family."],
    }),
    {
      // Léa meets your mother — both openers are doors (§13.9 law 11).
      id: "fr-m7-4-sim-lea",
      type: "dialogue_sim",
      scene: {
        emoji: "🕰️",
        title: "Léa, at your door",
        setting: "Your mother answers it with you.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-mere",
          npc: {
            speaker: "Léa",
            kana: "Bonjour ! C'est ta mère ?",
            audioText: "c'est ta mère ?",
            gloss: "Hello! Is that your mother?",
          },
          goal: "It is — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouima", text: "oui c'est ma mère" },
              { id: "ouita", text: "oui c'est ta mère" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "ouima",
            audioText: "oui c'est ma mère",
          },
          replyGloss: "Yes, that's my mother.",
          explanation:
            "Her «ta», your «ma» — the possessives flip exactly like the verbs do.",
        },
      ],
    },
    build(
      "fr-m7-4-build-monpere",
      "Build: 'that's my father'",
      "c'est mon père",
      ["c'est", "mon", "père", "ma"],
      ["c'est", "mon", "père"],
    ),
    {
      id: "fr-m7-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-famille", source: "famille", target: "family" },
        { id: "p-pere", source: "père", target: "father" },
        { id: "p-mere", source: "mère", target: "mother" },
        { id: "p-madame", source: "madame", target: "ma'am / Mrs." },
        { id: "p-bonsoir", source: "bonsoir", target: "good evening" },
        { id: "p-six", source: "six", target: "six" },
      ],
    },
    // WIN: claim him out loud — printed first voicing.
    speaking("fr-m7-4-speak-monpere", "c'est mon père", "that's my father", []),
  ];
}

/** L5 — the m2 payoff: your family meets your grammar. «Mon frère est
 *  étudiant.» */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m7-5-info-etudiant",
      "Old grammar, new owners",
      "«Mon frère est étudiant» — my brother's a student. «Ma sœur est étudiante» — the -e wakes the t, exactly as module 2 promised (DYAHN → DYAHNT). Your m2 grammar just met your family.",
      "grammar",
    ),
    {
      id: "fr-m7-5-map-frereetudiant",
      type: "word_map",
      tokens: ["mon", "frère", "est", "étudiant"],
      pairs: [
        { en: "my", tokenIndex: 0 },
        { en: "brother", tokenIndex: 1 },
        { en: "is", tokenIndex: 2 },
        { en: "a student", tokenIndex: 3 },
      ],
      audioText: "mon frère est étudiant",
      tokenGenders: { 0: "m", 1: "m", 3: "m" },
      revealNote:
        "A blue chain end to end — mon, frère, étudiant — with «est» staying neutral in the middle.",
    },
    speaking(
      "fr-m7-5-speak-frereetudiant",
      "mon frère est étudiant",
      "my brother is a student",
      [],
    ),
    cloze(
      "fr-m7-5-cloze-etudiante",
      "ma sœur est",
      "",
      "étudiante",
      ["étudiante", "étudiant"],
      "my sister is a student",
      "ma sœur est étudiante",
      "«ma sœur» pulls the -e form — and the t wakes up: DYAHNT.",
    ),
    listeningCompSentence({
      id: "fr-m7-5-lc-soeuretudiante",
      audioText: "ma sœur est étudiante",
      correctMeaningEn: "My sister is a student.",
      distractorsEn: ["My brother is a student.", "That's my sister.", "She's my mother."],
    }),
    {
      id: "fr-m7-5-hear-pere",
      type: "word_image_mcq",
      meaningEn: "le père",
      options: [
        { id: "correct", word: "le père", emoji: "🧔" },
        { id: "o1", word: "le frère", emoji: "👦" },
        { id: "o2", word: "la mère", emoji: "👩‍🦰" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: yesterday's love, from memory.
    speaking("fr-m7-5-speak-mafamille-recall", "j'aime ma famille", "I love my family", [], "recall"),
    cloze(
      "fr-m7-5-cloze-ma",
      "c'est",
      "famille",
      "ma",
      ["ma", "mon"],
      "that's my family",
      "c'est ma famille",
      "«famille» — pink-f: «ma famille».",
    ),
    {
      id: "fr-m7-5-sim-emma",
      type: "dialogue_sim",
      scene: { emoji: "🎓", title: "Emma, curious" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-frere",
          npc: {
            speaker: "Emma",
            kana: "Tu as un frère ?",
            audioText: "tu as un frère ?",
            gloss: "Do you have a brother?",
          },
          goal: "You do — and he studies.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouietudiant", text: "oui mon frère est étudiant" },
              { id: "ouiton", text: "oui ton frère est étudiant" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "ouietudiant",
            audioText: "oui mon frère est étudiant",
          },
          replyGloss: "Yes — my brother's a student.",
          explanation:
            "Two flips at once: «tu as» → «j'ai» thinking, «ton» → «mon» saying.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m3 tastes lane.
      id: "fr-m7-5-lc-chocolat",
      audioText: "j'aime le chocolat",
      correctMeaningEn: "I like chocolate.",
      distractorsEn: ["I don't like chocolate.", "I would like a hot chocolate.", "I love my family."],
    }),
    build(
      "fr-m7-5-build-soeuretudiante",
      "Build: 'my sister is a student'",
      "ma sœur est étudiante",
      ["ma", "sœur", "est", "étudiante", "étudiant", "mon"],
      ["ma", "sœur", "est", "étudiante"],
    ),
    {
      id: "fr-m7-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-frere", source: "frère", target: "brother" },
        { id: "p-soeur", source: "sœur", target: "sister" },
        { id: "p-etudiant", source: "étudiant", target: "student (m)" },
        { id: "p-etudiante", source: "étudiante", target: "student (f)" },
        { id: "p-jevais", source: "je vais", target: "I'm going" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: the pink chain, out loud — printed first voicing.
    speaking(
      "fr-m7-5-speak-soeuretudiante",
      "ma sœur est étudiante",
      "my sister is a student",
      [],
    ),
  ];
}

/** L6 — zero new: Louis meets everyone. Introductions with possessives. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m7-6-sim-louis",
      type: "dialogue_sim",
      scene: {
        emoji: "👨‍👩‍👧‍👦",
        title: "Louis meets everyone",
        setting: "He's back in town; your sister is around.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-soeur",
          npc: {
            speaker: "Louis",
            kana: "Tu as une sœur ?",
            audioText: "tu as une sœur ?",
            gloss: "Do you have a sister?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijai", text: "oui j'ai une sœur" },
              { id: "ouituas", text: "oui tu as une sœur" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "ouijai",
            audioText: "oui j'ai une sœur",
          },
          replyGloss: "Yes, I have a sister.",
        },
        {
          id: "t2-intro",
          npc: {
            speaker: "Louis",
            kana: "Enchanté !",
            audioText: "enchanté",
            gloss: "Nice to meet you! (she just walked up)",
          },
          goal: "Introduce her.",
          reply: {
            mode: "choice",
            options: [
              { id: "masoeur", text: "c'est ma sœur" },
              { id: "tasoeur", text: "c'est ta sœur" },
              { id: "mamere", text: "c'est ma mère" },
            ],
            correctOptionId: "masoeur",
            audioText: "c'est ma sœur",
          },
          replyGloss: "This is my sister.",
          explanation:
            "«c'est» points, «ma» claims — introductions are just m3 plus m7.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m7-6-lc-tonchien",
      audioText: "c'est ton chien ?",
      correctMeaningEn: "Is that your dog?",
      distractorsEn: ["Is that your cat?", "That's my dog.", "Do you have a dog?"],
    }),
    // TAIL: L2's claim, from memory.
    speaking("fr-m7-6-speak-masoeur-recall", "c'est ma sœur", "that's my sister", [], "recall"),
    cloze(
      "fr-m7-6-cloze-ta",
      "c'est",
      "famille ?",
      "ta",
      ["ta", "ton"],
      "is that your family?",
      "c'est ta famille ?",
      "«famille» — pink-f: «ta», their side of yours.",
    ),
    build(
      "fr-m7-6-build-unchien",
      "Build: 'I have a dog'",
      "j'ai un chien",
      ["j'ai", "un", "chien", "une", "tu as"],
      ["j'ai", "un", "chien"],
    ),
    {
      id: "fr-m7-6-hear-famille",
      type: "word_image_mcq",
      meaningEn: "la famille",
      options: [
        { id: "correct", word: "la famille", emoji: "👨‍👩‍👧‍👦" },
        { id: "o1", word: "la sœur", emoji: "👧" },
        { id: "o2", word: "le père", emoji: "🧔" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the cat, from memory (voiced L3).
    speaking("fr-m7-6-speak-jaiunchat-recall", "j'ai un chat", "I have a cat", [], "recall"),
    listeningCompSentence({
      // TAIL: m5 plans lane.
      id: "fr-m7-6-lc-onvaauparc",
      audioText: "on va au parc ?",
      correctMeaningEn: "Shall we go to the park?",
      distractorsEn: ["Are you going to the park?", "There's a park here.", "I love the park."],
    }),
    vocabTextMcq("fr-m7-6-mc-famille", "famille", ["sœur", "mère", "maison"]),
    {
      id: "fr-m7-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-mon", source: "mon", target: "my (le-words)" },
        { id: "p-ma", source: "ma", target: "my (la-words)" },
        { id: "p-chat", source: "chat", target: "cat" },
        { id: "p-chien", source: "chien", target: "dog" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    // WIN: the dog joins the family — printed first voicing.
    speaking("fr-m7-6-speak-monchien", "mon chien", "my dog", []),
  ];
}

/** L7 — zero new: the household sorted onto the mon/ma sides, and the
 *  loves declared. */
function lesson7(): LessonStep[] {
  return [
    genderSort({
      id: "fr-m7-7-sort",
      prompt: "Yours, sorted — which 'my' does each take?",
      buckets: [
        { id: "m", label: "mon (blue-m)" },
        { id: "f", label: "ma (pink-f)" },
      ],
      items: [
        { id: "g-frere", surface: "frère", bucketId: "m", meaningEn: "brother" },
        { id: "g-soeur", surface: "sœur", bucketId: "f", meaningEn: "sister" },
        { id: "g-pere", surface: "père", bucketId: "m", meaningEn: "father" },
        { id: "g-mere", surface: "mère", bucketId: "f", meaningEn: "mother" },
        { id: "g-famille", surface: "famille", bucketId: "f", meaningEn: "family" },
        { id: "g-chat", surface: "chat", bucketId: "m", meaningEn: "cat" },
        { id: "g-chien", surface: "chien", bucketId: "m", meaningEn: "dog" },
      ],
      endingRule:
        "«mon» and «ma» ride the same two sides as un/une, le/la, au/à la — one system, four doors, no new rule.",
    }),
    // TAIL: L6's win, from memory.
    speaking("fr-m7-7-speak-monchien-recall", "mon chien", "my dog", [], "recall"),
    cloze(
      "fr-m7-7-cloze-mon",
      "j'aime",
      "chien",
      "mon",
      ["mon", "ma"],
      "I love my dog",
      "j'aime mon chien",
      "«chien» — blue-m: «mon», loved or not.",
    ),
    listeningCompSentence({
      id: "fr-m7-7-lc-tuasunchat",
      audioText: "tu as un chat ?",
      correctMeaningEn: "Do you have a cat?",
      distractorsEn: ["Do you have a dog?", "I have a cat.", "Is that your cat?"],
    }),
    build(
      "fr-m7-7-build-mafamille",
      "Build: 'I love my family'",
      "j'aime ma famille",
      ["j'aime", "ma", "famille", "mon"],
      ["j'aime", "ma", "famille"],
    ),
    {
      id: "fr-m7-7-hear-chat",
      type: "word_image_mcq",
      meaningEn: "le chat",
      options: [
        { id: "correct", word: "le chat", emoji: "🐱" },
        { id: "o1", word: "le chien", emoji: "🐶" },
        { id: "o2", word: "le frère", emoji: "👦" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L4's claim, from memory.
    speaking("fr-m7-7-speak-monpere-recall", "c'est mon père", "that's my father", [], "recall"),
    cloze(
      "fr-m7-7-cloze-tamere",
      "c'est",
      "mère ?",
      "ta",
      ["ta", "ton"],
      "is that your mother?",
      "c'est ta mère ?",
      "«mère» — pink-f: «ta mère».",
    ),
    {
      id: "fr-m7-7-sim-ines",
      type: "dialogue_sim",
      scene: { emoji: "📱", title: "Inès shows HER photo" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-chat",
          npc: {
            speaker: "Inès",
            kana: "C'est mon chat !",
            audioText: "c'est mon chat",
            gloss: "That's my cat!",
          },
          goal: "You have one too — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "cestquoi", text: "c'est quoi ?" },
              { id: "comprends", text: "je ne comprends pas" },
            ],
            correctOptionId: "moiaussi",
            audioText: "moi aussi",
          },
          replyGloss: "Me too!",
          explanation:
            "«moi aussi» answers her statement — two cat owners, one phrase.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m6 ordering lane.
      id: "fr-m7-7-lc-gateau",
      audioText: "je voudrais un gâteau",
      correctMeaningEn: "I would like a cake.",
      distractorsEn: ["I would like a croissant.", "Another cake, please.", "I like cake."],
    }),
    {
      id: "fr-m7-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-pere", source: "père", target: "father" },
        { id: "p-mere", source: "mère", target: "mother" },
        { id: "p-ton", source: "ton", target: "your (le-words)" },
        { id: "p-ta", source: "ta", target: "your (la-words)" },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-neuf", source: "neuf", target: "nine" },
      ],
    },
    // WIN: love, owned — printed first voicing.
    speaking("fr-m7-7-speak-jaimemonchien", "j'aime mon chien", "I love my dog", []),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): both possessive pairs on
 *  alternating answers, the étudiant/étudiante chain with owners, the
 *  have-questions produced. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m7-8-hear-frere",
      type: "word_image_mcq",
      meaningEn: "le frère",
      options: [
        { id: "correct", word: "le frère", emoji: "👦" },
        { id: "o1", word: "la sœur", emoji: "👧" },
        { id: "o2", word: "le père", emoji: "🧔" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m7-8-cloze-mon",
      "c'est",
      "frère",
      "mon",
      ["mon", "ma"],
      "that's my brother",
      "c'est mon frère",
      "«frère» — blue-m: «mon».",
    ),
    speaking(
      "fr-m7-8-speak-both-recall",
      "j'ai un frère et une sœur",
      "I have a brother and a sister",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m7-8-lc-mafamille",
      audioText: "c'est ma famille",
      correctMeaningEn: "That's my family.",
      distractorsEn: ["That's my mother.", "Is that your family?", "I love my family."],
    }),
    vocabTextMcq("fr-m7-8-mc-soeur", "sœur", ["frère", "mère", "famille"]),
    build(
      "fr-m7-8-build-tuas",
      "Build: 'do you have a dog?'",
      "tu as un chien ?",
      ["tu as", "un", "chien ?", "une", "j'ai"],
      ["tu as", "un", "chien ?"],
    ),
    {
      id: "fr-m7-8-hear-mere",
      type: "word_image_mcq",
      meaningEn: "la mère",
      options: [
        { id: "correct", word: "la mère", emoji: "👩‍🦰" },
        { id: "o1", word: "le père", emoji: "🧔" },
        { id: "o2", word: "la sœur", emoji: "👧" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m7-8-cloze-ta",
      "c'est",
      "sœur ?",
      "ta",
      ["ta", "ton"],
      "is that your sister?",
      "c'est ta sœur ?",
      "«sœur» — pink-f: «ta».",
    ),
    speaking(
      "fr-m7-8-speak-soeuretudiante-recall",
      "ma sœur est étudiante",
      "my sister is a student",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m7-8-lc-unesoeur",
      audioText: "j'ai une sœur",
      correctMeaningEn: "I have a sister.",
      distractorsEn: ["I have a brother.", "Do you have a sister?", "That's my sister."],
    }),
    build(
      "fr-m7-8-build-frereetudiant",
      "Build: 'my brother is a student'",
      "mon frère est étudiant",
      ["mon", "frère", "est", "étudiant", "étudiante", "ma"],
      ["mon", "frère", "est", "étudiant"],
    ),
    cloze(
      // Alternation: L5's trial answered étudiante.
      "fr-m7-8-cloze-etudiant",
      "mon frère est",
      "",
      "étudiant",
      ["étudiant", "étudiante"],
      "my brother is a student",
      "mon frère est étudiant",
      "«mon frère» keeps the t asleep: DYAHN.",
    ),
    {
      id: "fr-m7-8-hear-chien",
      type: "word_image_mcq",
      meaningEn: "le chien",
      options: [
        { id: "correct", word: "le chien", emoji: "🐶" },
        { id: "o1", word: "le chat", emoji: "🐱" },
        { id: "o2", word: "la famille", emoji: "👨‍👩‍👧‍👦" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m7-8-mc-jai", "j'ai", ["j'aime", "je vais", "je voudrais"]),
    speaking(
      "fr-m7-8-speak-mafamille-recall",
      "j'aime ma famille",
      "I love my family",
      [],
      "recall",
    ),
    {
      id: "fr-m7-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jai", source: "j'ai", target: "I have" },
        { id: "p-tuas", source: "tu as", target: "you have" },
        { id: "p-mon", source: "mon", target: "my (le-words)" },
        { id: "p-ma", source: "ma", target: "my (la-words)" },
        { id: "p-ton", source: "ton", target: "your (le-words)" },
        { id: "p-famille", source: "famille", target: "family" },
      ],
    },
  ];
}

/** L9 — «La photo»: Chloé scrolls your camera roll, then the tail. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m7-9-sim-photo",
      type: "dialogue_sim",
      scene: {
        emoji: "📱",
        title: "La photo — Chloé scrolls",
        setting: "Your camera roll, her commentary.",
      },
      exercisedAtomIds: [],
      explanation:
        "Family, studies, the dog, and a compliment — your whole world, narrated in French.",
      turns: [
        {
          id: "t1-famille",
          npc: {
            speaker: "Chloé",
            kana: "C'est ta famille ?",
            audioText: "c'est ta famille ?",
            gloss: "Is that your family?",
          },
          goal: "It is — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouima", text: "oui c'est ma famille" },
              { id: "ouita", text: "oui c'est ta famille" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "ouima",
            audioText: "oui c'est ma famille",
          },
          replyGloss: "Yes, that's my family.",
        },
        {
          id: "t2-frere",
          npc: {
            speaker: "Chloé",
            kana: "C'est ton frère ?",
            audioText: "c'est ton frère ?",
            gloss: "Is that your brother?",
          },
          goal: "It is — and he studies.",
          reply: {
            mode: "choice",
            options: [
              { id: "etudiant", text: "oui mon frère est étudiant" },
              { id: "tonfrere", text: "oui ton frère est étudiant" },
              { id: "comprends", text: "je ne comprends pas" },
            ],
            correctOptionId: "etudiant",
            audioText: "oui mon frère est étudiant",
          },
          replyGloss: "Yes — my brother's a student.",
        },
        {
          id: "t3-chien",
          npc: {
            speaker: "Chloé",
            kana: "Tu as un chien ?",
            audioText: "tu as un chien ?",
            gloss: "Do you have a dog?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijai", text: "oui j'ai un chien" },
              { id: "ouituas", text: "oui tu as un chien" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "ouijai",
            audioText: "oui j'ai un chien",
          },
          replyGloss: "Yes, I have a dog.",
        },
        {
          id: "t4-compliment",
          npc: {
            speaker: "Chloé",
            kana: "J'aime ta famille !",
            audioText: "j'aime ta famille",
            gloss: "I love your family!",
          },
          goal: "Warmly — thank her.",
          reply: {
            mode: "choice",
            options: [
              { id: "mercibeaucoup", text: "merci beaucoup" },
              { id: "pardon", text: "pardon" },
              { id: "laddition", text: "l'addition s'il vous plaît" },
            ],
            correctOptionId: "mercibeaucoup",
            audioText: "merci beaucoup",
          },
          replyGloss: "Thank you so much!",
        },
      ],
    },
    build(
      "fr-m7-9-build-mamere",
      "Build: 'that's my mother'",
      "c'est ma mère",
      ["c'est", "ma", "mère", "mon"],
      ["c'est", "ma", "mère"],
    ),
    listeningCompSentence({
      id: "fr-m7-9-lc-unchien",
      audioText: "j'ai un chien",
      correctMeaningEn: "I have a dog.",
      distractorsEn: ["I have a cat.", "Do you have a dog?", "That's my dog."],
    }),
    // The L7 win, from memory.
    speaking("fr-m7-9-speak-jaimemonchien-recall", "j'aime mon chien", "I love my dog", [], "recall"),
    cloze(
      "fr-m7-9-cloze-monchat",
      "j'aime",
      "chat",
      "mon",
      ["mon", "ma"],
      "I love my cat",
      "j'aime mon chat",
      "«chat» — blue-m, purring or not: «mon chat».",
    ),
    {
      id: "fr-m7-9-hear-soeur",
      type: "word_image_mcq",
      meaningEn: "la sœur",
      options: [
        { id: "correct", word: "la sœur", emoji: "👧" },
        { id: "o1", word: "la mère", emoji: "👩‍🦰" },
        { id: "o2", word: "le frère", emoji: "👦" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m7-9-lbuild-unesoeur",
      target: "j'ai une sœur",
      tiles: ["j'ai", "une", "sœur", "un"],
      correctOrder: ["j'ai", "une", "sœur"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m7-9-mc-tuas", "tu as", ["tu vas", "tu aimes", "j'ai"]),
    {
      id: "fr-m7-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-frere", source: "frère", target: "brother" },
        { id: "p-mere", source: "mère", target: "mother" },
        { id: "p-ton", source: "ton", target: "your (le-words)" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
        { id: "p-enchante", source: "enchanté", target: "nice to meet you" },
        { id: "p-deux", source: "deux", target: "two" },
      ],
    },
    // WIN: the family's scholar, from memory.
    speaking(
      "fr-m7-9-speak-frereetudiant-recall",
      "mon frère est étudiant",
      "my brother is a student",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends on «Le dîner en
 *  famille» — both worlds at one table. */
function lesson10(): LessonStep[] {
  return [
    {
      id: "fr-m7-10-hear-famille",
      type: "word_image_mcq",
      meaningEn: "la famille",
      options: [
        { id: "correct", word: "la famille", emoji: "👨‍👩‍👧‍👦" },
        { id: "o1", word: "le chat", emoji: "🐱" },
        { id: "o2", word: "le chien", emoji: "🐶" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m7-10-build-both",
      "Build: 'I have a brother and a sister'",
      "j'ai un frère et une sœur",
      ["j'ai", "un", "frère", "et", "une", "sœur", "ou"],
      ["j'ai", "un", "frère", "et", "une", "sœur"],
    ),
    cloze(
      "fr-m7-10-cloze-ma",
      "c'est",
      "mère",
      "ma",
      ["ma", "mon"],
      "that's my mother",
      "c'est ma mère",
      "«mère» — pink-f: «ma mère».",
    ),
    listeningCompSentence({
      id: "fr-m7-10-lc-frereetudiant",
      audioText: "mon frère est étudiant",
      correctMeaningEn: "My brother is a student.",
      distractorsEn: ["My sister is a student.", "That's my brother.", "He's my father."],
    }),
    speaking("fr-m7-10-speak-monfrere-recall", "c'est mon frère", "that's my brother", [], "recall"),
    vocabTextMcq("fr-m7-10-mc-pere", "père", ["frère", "mère", "chien"]),
    cloze(
      "fr-m7-10-cloze-ton",
      "c'est",
      "chien ?",
      "ton",
      ["ton", "ta"],
      "is that your dog?",
      "c'est ton chien ?",
      "«chien» — blue-m: «ton».",
    ),
    listeningCompSentence({
      id: "fr-m7-10-lc-tuasunesoeur",
      audioText: "tu as une sœur ?",
      correctMeaningEn: "Do you have a sister?",
      distractorsEn: ["I have a sister.", "Is that your sister?", "Do you have a brother?"],
    }),
    build(
      "fr-m7-10-build-monchat",
      "Build: 'I love my cat'",
      "j'aime mon chat",
      ["j'aime", "mon", "chat", "ma"],
      ["j'aime", "mon", "chat"],
    ),
    {
      id: "fr-m7-10-hear-chat",
      type: "word_image_mcq",
      meaningEn: "le chat",
      options: [
        { id: "correct", word: "le chat", emoji: "🐱" },
        { id: "o1", word: "la sœur", emoji: "👧" },
        { id: "o2", word: "le gâteau", emoji: "🍰" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "fr-m7-10-speak-soeuretudiante-recall",
      "ma sœur est étudiante",
      "my sister is a student",
      [],
      "recall",
    ),
    cloze(
      "fr-m7-10-cloze-mafamille",
      "j'aime",
      "famille",
      "ma",
      ["ma", "mon"],
      "I love my family",
      "j'aime ma famille",
      "«famille» — pink-f to the end: «ma famille».",
    ),
    {
      id: "fr-m7-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-pere", source: "père", target: "father" },
        { id: "p-soeur", source: "sœur", target: "sister" },
        { id: "p-jai", source: "j'ai", target: "I have" },
        { id: "p-ta", source: "ta", target: "your (la-words)" },
        { id: "p-stp", source: "s'il te plaît", target: "please (to a friend)" },
        { id: "p-quatre", source: "quatre", target: "four" },
      ],
    },
    {
      // THE MODULE ENDS AT YOUR TABLE — both worlds meet.
      id: "fr-m7-10-sim-diner",
      type: "dialogue_sim",
      scene: {
        emoji: "👨‍👩‍👧‍👦",
        title: "Le dîner en famille",
        setting: "Your family hosts; the gang arrives.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: what you have, who's yours, and a table where both worlds meet. Module 8: la semaine — WHEN it all happens.",
      turns: [
        {
          id: "t1-mere",
          npc: {
            speaker: "Léa",
            kana: "Bonjour ! C'est ta mère ?",
            audioText: "c'est ta mère ?",
            gloss: "Hello! Is that your mother?",
          },
          goal: "It is — introduce her.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouima", text: "oui c'est ma mère" },
              { id: "ouita", text: "oui c'est ta mère" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "ouima",
            audioText: "oui c'est ma mère",
          },
          replyGloss: "Yes — this is my mother.",
        },
        {
          id: "t2-lea",
          npc: {
            speaker: "Your mother",
            kana: "Enchantée !",
            audioText: "enchanté",
            gloss: "Nice to meet you! (she means Léa)",
          },
          goal: "Introduce Léa back.",
          reply: {
            mode: "choice",
            options: [
              { id: "cestlea", text: "c'est Léa" },
              { id: "mamere", text: "c'est ma mère" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "cestlea",
            audioText: "c'est Léa",
          },
          replyGloss: "This is Léa.",
          explanation:
            "«c'est» introduces in both directions — names need no article.",
        },
        {
          id: "t3-chat",
          npc: {
            speaker: "Hugo",
            kana: "Tu as un chat ?",
            audioText: "tu as un chat ?",
            gloss: "Do you have a cat? (something brushed his leg)",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijai", text: "oui j'ai un chat" },
              { id: "ouituas", text: "oui tu as un chat" },
              { id: "pasde", text: "il n'y a pas de chat" },
            ],
            correctOptionId: "ouijai",
            audioText: "oui j'ai un chat",
          },
          replyGloss: "Yes, I have a cat.",
        },
        {
          id: "t4-compliment",
          npc: {
            speaker: "Léa",
            kana: "J'aime ta famille !",
            audioText: "j'aime ta famille",
            gloss: "I love your family!",
          },
          goal: "So does everyone. Agree.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "cestquoi", text: "c'est quoi ?" },
              { id: "bonnenuit", text: "bonne nuit" },
            ],
            correctOptionId: "moiaussi",
            audioText: "moi aussi",
          },
          replyGloss: "Me too.",
        },
      ],
    },
  ];
}

const FR_M7_1: LessonContent = {
  id: "fr-m7-1",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "What you have",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M7_2: LessonContent = {
  id: "fr-m7-2",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Make it yours — mon, ma",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M7_3: LessonContent = {
  id: "fr-m7-3",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Your turn to ask",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M7_4: LessonContent = {
  id: "fr-m7-4",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The whole set",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M7_5: LessonContent = {
  id: "fr-m7-5",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Old grammar, new owners",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M7_6: LessonContent = {
  id: "fr-m7-6",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Louis meets everyone",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M7_7: LessonContent = {
  id: "fr-m7-7",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Yours, sorted",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M7_8: LessonContent = {
  id: "fr-m7-8",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the photo",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M7_9: LessonContent = {
  id: "fr-m7-9",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La photo",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M7_10: LessonContent = {
  id: "fr-m7-10",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — host the dinner",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M7_MODULE: FrModuleDef = {
  title: "Ma famille — have, and belong",
  eyebrow: "Module 7",
  summary:
    "«J'ai un frère et une sœur» — say what you have, claim who's yours with mon/ma and ton/ta, and host the dinner where both worlds meet.",
  lessons: [
    FR_M7_1,
    FR_M7_2,
    FR_M7_3,
    FR_M7_4,
    FR_M7_5,
    FR_M7_6,
    FR_M7_7,
    FR_M7_8,
    FR_M7_9,
    FR_M7_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M7_CHECKPOINT_INDEX = 8;

export const FR_M7_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m7-s",
    moduleId: "m7",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m7-s",
        prompt: "Complete: «C'est ___ sœur.» (my)",
        correctText: "ma",
        distractorsText: ["mon", "ta", "la"],
      }),
  },
  {
    id: "pt-fr-m7-1",
    moduleId: "m7",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m7-1",
        prompt: "'I have a brother' — pick the French.",
        correctText: "j'ai un frère",
        distractorsText: ["j'ai une frère", "tu as un frère", "j'aime un frère"],
      }),
  },
  {
    id: "pt-fr-m7-2",
    moduleId: "m7",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m7-2",
        prompt: "'Do you have a dog?' — pick the French.",
        correctText: "tu as un chien ?",
        distractorsText: ["tu aimes un chien ?", "j'ai un chien ?", "tu vas un chien ?"],
      }),
  },
  {
    id: "pt-fr-m7-3",
    moduleId: "m7",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m7-3",
        prompt: "'My brother is a student' — pick the French.",
        correctText: "mon frère est étudiant",
        distractorsText: ["ma frère est étudiant", "mon frère est étudiante", "ton frère est étudiant"],
      }),
  },
  {
    id: "pt-fr-m7-4",
    moduleId: "m7",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m7-4",
        prompt: "Complete: «C'est ___ famille ?» (your)",
        correctText: "ta",
        distractorsText: ["ton", "ma", "la"],
      }),
  },
];
