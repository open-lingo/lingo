/**
 * m6.ts — Au café — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01 per the playbook arc (docs/fr-authoring-playbook.md
 * §8): m5's L10 promised "what you do when you get there" — you ORDER.
 *
 * SCOPE DECISIONS (all deliberate):
 *   - «je voudrais» is a CHUNK (the je vais precedent) — no vouloir
 *     paradigm, no conditional grammar; it is taught as the polite
 *     ordering word, which is what it is at a café.
 *   - PARTITIVE-SAFE INVENTORY ONLY (playbook §6): du/de la are
 *     untaught, so every food is a countable orderable — «un croissant»,
 *     «une salade», «un gâteau», «un sandwich» — plus m1/m3 reuses
 *     (café, thé, pizza, glace, chocolat-as-hot-choc). No lait, no eau,
 *     no jus d'orange: judgment goes in the inventory, and those three
 *     order as partitives or d'-elisions the course hasn't taught.
 *     «fromage» joins for the j'aime lane only — it is never "ordered".
 *   - «l'addition» rides the m4 elision machinery (bare atom «addition»,
 *     f; withArticle and the lexicon derive «l'addition» for free).
 *   - REGISTER BEAT (pin F9): «s'il te plaît» — the friend-key — against
 *     m1's «s'il vous plaît». The audience is always VISIBLE (server
 *     madame vs Hugo/Léa/Chloé), prompts/meanings say "(to a friend)" /
 *     "(to the SERVER)" when the register is the answer, and the L4
 *     friend-sim accepts BOTH («s'il vous plaît» to a friend is formal,
 *     not wrong). The one place the te-form is marked WRONG is to the
 *     working server (L9), with an explanation — flagged for Spencer.
 *   - «encore un/une X» gives second helpings WITHOUT plurals (still
 *     deferred, playbook §6).
 *   - Untaught server lines carried with glosses (house sim pattern):
 *     «Vous désirez ?», «Et pour vous ?», «Voilà !», «une salade pour
 *     moi !» — heard, glossed, never graded as learner surfaces.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   je voudrais un croissant L1 · je voudrais un café s'il vous plaît L1 ·
 *   je voudrais un sandwich L2 · un sandwich et une salade s'il vous
 *   plaît L2 · encore un café L3 · encore un café s'il vous plaît L3 ·
 *   s'il te plaît L4 · encore un gâteau s'il te plaît L4 ·
 *   j'aime le fromage L5 · l'addition s'il vous plaît L5 ·
 *   je voudrais un thé s'il vous plaît L6 ·
 *   je voudrais une pizza s'il vous plaît L7
 *   recalls drawn: s'il vous plaît L1 (m1) · on va au restaurant ce
 *   soir ? L3 (m5) · je voudrais un café s'il vous plaît L4 ·
 *   un sandwich et une salade s'il vous plaît L5+L9 · l'addition s'il
 *   vous plaît L5+L8 · encore un café s'il vous plaît L6 ·
 *   s'il te plaît L6+L10 · j'aime le fromage L7 · la pizza L7 (m3) ·
 *   je voudrais un croissant L8 · encore un gâteau s'il te plaît L8 ·
 *   je voudrais une pizza s'il vous plaît L9 · je voudrais un sandwich L10.
 *
 * Cast: a madame serves throughout; Léa offers refills; Hugo and Chloé
 * carry the friend-register beats; Léa treats at L9; Chloé co-orders in
 * the L10 finale.
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


export const FR_M6_ATOMS: FrAtom[] = [
  atom({ surface: "je voudrais", meaningEn: "I would like", partOfSpeech: "phrase", fromModule: "m6", kind: "phrase", hint: "zhuh voo-DREH — the politest want in France; it orders everything" }),
  atom({ surface: "encore", meaningEn: "another / more", partOfSpeech: "adverb", fromModule: "m6", kind: "vocab", hint: "ahn-KOR — yes, the word English borrowed for one more song" }),
  atom({ surface: "s'il te plaît", meaningEn: "please (to a friend)", partOfSpeech: "phrase", fromModule: "m6", kind: "phrase", hint: "seel tuh PLEH — the friend-key; «vous» becomes «te»" }),
  atom({ surface: "addition", meaningEn: "the bill", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "f", emoji: "🧾", hint: "la-dee-SYOHN — vowel start, so it squeezes: l'addition" }),
  atom({ surface: "croissant", meaningEn: "croissant", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m", emoji: "🥐", hint: "krwa-SAHN — oi says wah, the t sleeps" }),
  atom({ surface: "gâteau", meaningEn: "cake", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m", emoji: "🍰", hint: "gah-TOH — eau says oh, like beaucoup" }),
  atom({ surface: "salade", meaningEn: "salad", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "f", emoji: "🥗", hint: "sa-LAD" }),
  atom({ surface: "sandwich", meaningEn: "sandwich", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m", emoji: "🥪", hint: "sahnd-WEECH — borrowed, and filed blue-m" }),
  atom({ surface: "fromage", meaningEn: "cheese", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m", emoji: "🧀", hint: "fro-MAZH — a French meal isn't over before it" }),
];

/** L1 — «je voudrais»: the ordering machine, and the croissant it was
 *  invented for. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m6-1-info-voudrais",
      "The magic want",
      "«je voudrais» — I would like (zhuh voo-DREH) — the politest want in France, and the word that orders everything: «Je voudrais un croissant, s'il vous plaît.» Module 5 got you to the café; this word feeds you once you're there.",
      "grammar",
    ),
    vocabMcq(
      "fr-m6-1-img-croissant",
      { surface: "croissant", meaningEn: "the croissant", emoji: "🥐" },
      [
        { surface: "café", emoji: "☕" },
        { surface: "pizza", emoji: "🍕" },
        { surface: "glace", emoji: "🍨" },
      ],
    ),
    {
      id: "fr-m6-1-map-voudrais",
      type: "word_map",
      tokens: ["je voudrais", "un", "croissant"],
      pairs: [
        { en: "I would like", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "croissant", tokenIndex: 2 },
      ],
      audioText: "je voudrais un croissant",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«je voudrais» is softer than 'I want' — it's the version a café expects. The un/une sides ride along as always.",
    },
    speaking("fr-m6-1-speak-croissant", "je voudrais un croissant", "I would like a croissant", []),
    {
      id: "fr-m6-1-sim-madame",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Le café — the madame serves",
        setting: "Your table, her notepad.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-order",
          npc: {
            speaker: "The madame",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like? (the server's question)",
          },
          goal: "Order a coffee — politely.",
          reply: {
            mode: "build",
            tiles: ["je voudrais", "un", "café", "s'il vous plaît", "une"],
            answer: "je voudrais un café s'il vous plaît",
            alsoAccepted: ["je voudrais un café", "un café s'il vous plaît"],
            audioText: "je voudrais un café s'il vous plaît",
          },
          replyGloss: "I'd like a coffee, please.",
          explanation:
            "«je voudrais» + the thing + «s'il vous plaît» — the whole liturgy of a French counter.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m6-1-lc-the",
      audioText: "je voudrais un thé",
      correctMeaningEn: "I would like a tea.",
      distractorsEn: ["I would like a coffee.", "I like tea.", "Another tea, please."],
    }),
    {
      // TAIL: m3 hot drinks by ear.
      id: "fr-m6-1-hear-lethe",
      type: "word_image_mcq",
      meaningEn: "le thé",
      options: [
        { id: "correct", word: "le thé", emoji: "🍵" },
        { id: "o1", word: "le café", emoji: "☕" },
        { id: "o2", word: "le chocolat", emoji: "🍫" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the m1 word this module runs on, from memory.
    speaking("fr-m6-1-speak-svp-recall", "s'il vous plaît", "please", [], "recall"),
    cloze(
      "fr-m6-1-cloze-un",
      "je voudrais",
      "croissant",
      "un",
      ["un", "une"],
      "I would like a croissant",
      "je voudrais un croissant",
      "«croissant» — blue-m, like most of the pastry counter.",
    ),
    build(
      "fr-m6-1-build-glace",
      "Build: 'I would like an ice cream'",
      "je voudrais une glace",
      ["je voudrais", "une", "glace", "un"],
      ["je voudrais", "une", "glace"],
    ),
    {
      id: "fr-m6-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-voudrais", source: "je voudrais", target: "I would like" },
        { id: "p-croissant", source: "croissant", target: "croissant" },
        { id: "p-svp", source: "s'il vous plaît", target: "please" },
        { id: "p-cafe", source: "café", target: "coffee" },
        { id: "p-glace", source: "glace", target: "ice cream" },
        { id: "p-une", source: "une", target: "a (pink-f side)" },
      ],
    },
    // WIN: the full order, out loud — printed first voicing.
    speaking(
      "fr-m6-1-speak-fullorder",
      "je voudrais un café s'il vous plaît",
      "I'd like a coffee, please",
      [],
    ),
  ];
}

/** L2 — two dishes, one sentence: m1's «et» takes your order. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m6-2-info-et",
      "Order two things",
      "«un sandwich et une salade, s'il vous plaît» — a sandwich AND a salad: the tiny «et» from module 1 finally takes your order. Each dish keeps its own side: un sandwich, une salade.",
      "grammar",
    ),
    vocabMcq(
      "fr-m6-2-img-sandwich",
      { surface: "sandwich", meaningEn: "the sandwich", emoji: "🥪" },
      [
        { surface: "croissant", emoji: "🥐" },
        { surface: "pizza", emoji: "🍕" },
        { surface: "salade", emoji: "🥗" },
      ],
    ),
    speaking("fr-m6-2-speak-sandwich", "je voudrais un sandwich", "I would like a sandwich", []),
    vocabMcq(
      "fr-m6-2-img-salade",
      { surface: "salade", meaningEn: "the salad", emoji: "🥗" },
      [
        { surface: "sandwich", emoji: "🥪" },
        { surface: "glace", emoji: "🍨" },
        { surface: "croissant", emoji: "🥐" },
      ],
    ),
    {
      id: "fr-m6-2-map-etsalade",
      type: "word_map",
      tokens: ["un", "sandwich", "et", "une", "salade"],
      pairs: [
        { en: "a", tokenIndex: 0 },
        { en: "sandwich", tokenIndex: 1 },
        { en: "and", tokenIndex: 2 },
        { en: "a", tokenIndex: 3 },
        { en: "salad", tokenIndex: 4 },
      ],
      audioText: "un sandwich et une salade",
      tokenGenders: { 0: "m", 1: "m", 3: "f", 4: "f" },
      revealNote:
        "Blue-m on one side of «et», pink-f on the other — the sides never blur, even on one plate.",
    },
    listeningCompSentence({
      id: "fr-m6-2-lc-salade",
      audioText: "je voudrais une salade",
      correctMeaningEn: "I would like a salad.",
      distractorsEn: ["I would like a sandwich.", "Another salad, please.", "I like salad."],
    }),
    {
      // TAIL: m1 courtesy by ear.
      id: "fr-m6-2-hear-svp",
      type: "word_image_mcq",
      meaningEn: "s'il vous plaît",
      options: [
        { id: "correct", word: "s'il vous plaît", emoji: "🤲" },
        { id: "o1", word: "merci", emoji: "🙏" },
        { id: "o2", word: "pardon", emoji: "🙇" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: yesterday's order, from memory.
    speaking(
      "fr-m6-2-speak-croissant-recall",
      "je voudrais un croissant",
      "I would like a croissant",
      [],
      "recall",
    ),
    cloze(
      "fr-m6-2-cloze-et",
      "un sandwich",
      "une salade",
      "et",
      ["et", "ou"],
      "a sandwich AND a salad",
      "un sandwich et une salade",
      "«et» joins the plate; «ou» would make you choose.",
    ),
    build(
      "fr-m6-2-build-full",
      "Build: 'a sandwich and a salad, please'",
      "un sandwich et une salade s'il vous plaît",
      ["un", "sandwich", "et", "une", "salade", "s'il vous plaît", "ou"],
      ["un", "sandwich", "et", "une", "salade", "s'il vous plaît"],
    ),
    listeningCompSentence({
      // TAIL: m5 lane — the plan that got you here.
      id: "fr-m6-2-lc-onvacafe",
      audioText: "on va au café ?",
      correctMeaningEn: "Shall we go to the café?",
      distractorsEn: ["Are you going to the café?", "I'm going to the café.", "Where is the café?"],
    }),
    {
      id: "fr-m6-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-sandwich", source: "sandwich", target: "sandwich" },
        { id: "p-salade", source: "salade", target: "salad" },
        { id: "p-et", source: "et", target: "and" },
        { id: "p-ou", source: "ou", target: "or" },
        { id: "p-pizza", source: "pizza", target: "pizza" },
        { id: "p-deux", source: "deux", target: "two" },
      ],
    },
    // WIN: the two-dish order — printed first voicing.
    speaking(
      "fr-m6-2-speak-full",
      "un sandwich et une salade s'il vous plaît",
      "a sandwich and a salad, please",
      [],
    ),
  ];
}

/** L3 — «encore»: second helpings without plurals. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m6-3-info-encore",
      "Another, please",
      "«encore» — another, more: «Encore un café, s'il vous plaît» — another coffee, please. (ahn-KOR — yes, the word English borrowed for one more song.) One word turns any order into seconds.",
      "grammar",
    ),
    {
      id: "fr-m6-3-map-encore",
      type: "word_map",
      tokens: ["encore", "un", "café"],
      pairs: [
        { en: "another", tokenIndex: 0 },
        { en: "", tokenIndex: 1 },
        { en: "coffee", tokenIndex: 2 },
      ],
      audioText: "encore un café",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "English says 'another'; French says «encore un» — more-one. The article never takes a day off.",
    },
    speaking("fr-m6-3-speak-encore", "encore un café", "another coffee", []),
    {
      // A real offer — both answers live (the m1 café-sim law).
      id: "fr-m6-3-sim-lea",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Léa lifts the pot",
        setting: "Your cup is empty. She noticed.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-refill",
          npc: {
            speaker: "Léa",
            kana: "Encore un café ?",
            audioText: "encore un café ?",
            gloss: "Another coffee?",
          },
          goal: "Answer — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouisvp", text: "oui s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "ouisvp",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
          explanation:
            "A real offer keeps both answers — the m1 rule, one refill later.",
        },
      ],
    },
    // TAIL: m5 plans lane, from memory.
    speaking(
      "fr-m6-3-speak-onva-recall",
      "on va au restaurant ce soir ?",
      "shall we go to the restaurant tonight?",
      [],
      "recall",
    ),
    cloze(
      "fr-m6-3-cloze-encore",
      "",
      "une glace ?",
      "encore",
      ["encore", "et"],
      "another ice cream?",
      "encore une glace ?",
      "«encore» asks for seconds; «et» only joins.",
    ),
    {
      // Same-lesson food shelf by ear.
      id: "fr-m6-3-hear-sandwich",
      type: "word_image_mcq",
      meaningEn: "le sandwich",
      options: [
        { id: "correct", word: "le sandwich", emoji: "🥪" },
        { id: "o1", word: "la salade", emoji: "🥗" },
        { id: "o2", word: "le croissant", emoji: "🥐" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      id: "fr-m6-3-lc-encorecroissant",
      audioText: "encore un croissant s'il vous plaît",
      correctMeaningEn: "Another croissant, please.",
      distractorsEn: ["A croissant, please.", "Another coffee, please.", "I like croissants."],
    }),
    build(
      "fr-m6-3-build-encoresalade",
      "Build: 'another salad, please'",
      "encore une salade s'il vous plaît",
      ["encore", "une", "salade", "s'il vous plaît", "un"],
      ["encore", "une", "salade", "s'il vous plaît"],
    ),
    listeningCompSentence({
      // TAIL: m2 origins lane, by ear.
      id: "fr-m6-3-lc-paris",
      audioText: "je suis de Paris",
      correctMeaningEn: "I'm from Paris.",
      distractorsEn: ["I'm from New York.", "I'm going to Paris.", "I'm a student."],
    }),
    {
      id: "fr-m6-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-encore", source: "encore", target: "another / more" },
        { id: "p-cafe", source: "café", target: "coffee" },
        { id: "p-the", source: "thé", target: "tea" },
        { id: "p-salut", source: "salut", target: "hi / bye (casual)" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
        { id: "p-quatre", source: "quatre", target: "four" },
      ],
    },
    // WIN: seconds, politely — printed first voicing.
    speaking(
      "fr-m6-3-speak-encoresvp",
      "encore un café s'il vous plaît",
      "another coffee, please",
      [],
    ),
  ];
}

/** L4 — «s'il te plaît»: the friend-key (pin F9 — the audience is
 *  always visible). Cake debuts. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m6-4-info-stp",
      "Please, between friends",
      "«s'il vous plaît» is for the madame, the server, the stranger. For Hugo, Léa, Chloé there's «s'il te plaît» (seel tuh PLEH) — same magic, softer key: «vous» becomes «te». And «le gâteau» — cake (gah-TOH: eau says oh, like beaucoup).",
      "grammar",
    ),
    vocabMcq(
      "fr-m6-4-img-gateau",
      { surface: "gâteau", meaningEn: "the cake", emoji: "🍰" },
      [
        { surface: "croissant", emoji: "🥐" },
        { surface: "glace", emoji: "🍨" },
        { surface: "sandwich", emoji: "🥪" },
      ],
    ),
    speaking("fr-m6-4-speak-stp", "s'il te plaît", "please (to a friend)", []),
    {
      // Register trial 1: the SERVER — vous wins.
      id: "fr-m6-4-sim-madame",
      type: "dialogue_sim",
      scene: {
        emoji: "🍰",
        title: "The madame, notepad out",
        setting: "A stranger, working. Formal key.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-gateau",
          npc: {
            speaker: "The madame",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like?",
          },
          goal: "A cake — stranger rules.",
          reply: {
            mode: "choice",
            options: [
              { id: "vous", text: "un gâteau s'il vous plaît" },
              { id: "te", text: "un gâteau s'il te plaît" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "vous",
            audioText: "un gâteau s'il vous plaît",
          },
          replyGloss: "A cake, please.",
          explanation:
            "«vous» for the madame — «te» would startle her mid-order.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m6-4-lc-gateau",
      audioText: "je voudrais un gâteau",
      correctMeaningEn: "I would like a cake.",
      distractorsEn: ["I would like a croissant.", "Another cake, please.", "I like cake."],
    }),
    // TAIL: L1's full order, from memory.
    speaking(
      "fr-m6-4-speak-fullorder-recall",
      "je voudrais un café s'il vous plaît",
      "I'd like a coffee, please",
      [],
      "recall",
    ),
    cloze(
      "fr-m6-4-cloze-stp",
      "encore un café",
      "",
      "s'il te plaît",
      ["s'il te plaît", "s'il vous plaît"],
      "another coffee, please (to a FRIEND)",
      "encore un café s'il te plaît",
      "To a friend — «te». Both keys are polite; one of them is close.",
    ),
    {
      // Register trial 2: the FRIEND — both keys accepted (formal to a
      // friend is stiff, never wrong).
      id: "fr-m6-4-sim-hugo",
      type: "dialogue_sim",
      scene: {
        emoji: "🎂",
        title: "Hugo cuts the cake",
        setting: "A friend, a knife, a decision.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-part",
          npc: {
            speaker: "Hugo",
            kana: "Encore un gâteau ?",
            audioText: "encore un gâteau ?",
            gloss: "Another slice?",
          },
          goal: "Yes — friend-style please.",
          reply: {
            mode: "choice",
            options: [
              { id: "te", text: "oui s'il te plaît" },
              { id: "vous", text: "oui s'il vous plaît" },
              { id: "laddition", text: "moi aussi" },
            ],
            correctOptionId: "te",
            alsoCorrectOptionIds: ["vous"],
            audioText: "oui s'il te plaît",
          },
          replyGloss: "Yes, please!",
          explanation:
            "Both work — «te» is the friend-key, «vous» just sounds like you're at a counter.",
        },
      ],
    },
    {
      id: "fr-m6-4-hear-gateau",
      type: "word_image_mcq",
      meaningEn: "le gâteau",
      options: [
        { id: "correct", word: "le gâteau", emoji: "🍰" },
        { id: "o1", word: "le croissant", emoji: "🥐" },
        { id: "o2", word: "le sandwich", emoji: "🥪" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m6-4-build-stp",
      "Build: 'another cake, please (to a friend)'",
      "encore un gâteau s'il te plaît",
      ["encore", "un", "gâteau", "s'il te plaît", "s'il vous plaît"],
      ["encore", "un", "gâteau", "s'il te plaît"],
    ),
    listeningCompSentence({
      // TAIL: m4 lane by ear.
      id: "fr-m6-4-lc-ouest",
      audioText: "où est l'école ?",
      correctMeaningEn: "Where is the school?",
      distractorsEn: ["Where is the hotel?", "There's a school here.", "I'm going to school."],
    }),
    {
      id: "fr-m6-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-gateau", source: "gâteau", target: "cake" },
        { id: "p-stp", source: "s'il te plaît", target: "please (to a friend)" },
        { id: "p-svp", source: "s'il vous plaît", target: "please (formal)" },
        { id: "p-madame", source: "madame", target: "ma'am / Mrs." },
        { id: "p-bonjour", source: "bonjour", target: "hello" },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: the friend-key order — printed first voicing.
    speaking(
      "fr-m6-4-speak-gateaustp",
      "encore un gâteau s'il te plaît",
      "another cake, please",
      [],
    ),
  ];
}

/** L5 — «l'addition»: the meal-closer, riding the m4 squeeze. Fromage
 *  joins the j'aime lane. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m6-5-info-addition",
      "The meal-closer",
      "«l'addition» — the bill (la-dee-SYOHN). The word is «addition», but it opens with a vowel, so the article squeezes: l'addition. «L'addition, s'il vous plaît» ends every good French meal. And «le fromage» — cheese (fro-MAZH) — because no French meal is over before it.",
      "grammar",
    ),
    vocabMcq(
      "fr-m6-5-img-fromage",
      { surface: "fromage", meaningEn: "the cheese", emoji: "🧀" },
      [
        { surface: "gâteau", emoji: "🍰" },
        { surface: "salade", emoji: "🥗" },
        { surface: "croissant", emoji: "🥐" },
      ],
    ),
    {
      id: "fr-m6-5-map-fromage",
      type: "word_map",
      tokens: ["j'aime", "le", "fromage"],
      pairs: [
        { en: "I love", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "cheese", tokenIndex: 2 },
      ],
      audioText: "j'aime le fromage",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "The m3 liking machine, pointed at its truest French target. The «le» stays on, as always.",
    },
    speaking("fr-m6-5-speak-fromage", "j'aime le fromage", "I love cheese", []),
    vocabMcq(
      "fr-m6-5-img-addition",
      { surface: "addition", meaningEn: "the bill", emoji: "🧾" },
      [
        { surface: "gâteau", emoji: "🍰" },
        { surface: "sandwich", emoji: "🥪" },
        { surface: "salade", emoji: "🥗" },
      ],
    ),
    speaking("fr-m6-5-speak-addition", "l'addition s'il vous plaît", "the bill, please", []),
    {
      id: "fr-m6-5-sim-fin",
      type: "dialogue_sim",
      scene: {
        emoji: "🧾",
        title: "End of the meal",
        setting: "Plates empty, evening on.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-fin",
          npc: {
            speaker: "The madame",
            kana: "Encore un café ?",
            audioText: "encore un café ?",
            gloss: "Another coffee?",
          },
          goal: "You're done — ask for the bill.",
          reply: {
            mode: "choice",
            options: [
              { id: "laddition", text: "l'addition s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "laddition",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "l'addition s'il vous plaît",
          },
          replyGloss: "The bill, please.",
          explanation:
            "«non merci» works too — but «l'addition, s'il vous plaît» is what gets you home.",
        },
      ],
    },
    cloze(
      "fr-m6-5-cloze-le",
      "j'aime",
      "fromage",
      "le",
      ["le", "la"],
      "I love cheese",
      "j'aime le fromage",
      "«fromage» — blue-m, whatever the menu says.",
    ),
    {
      id: "fr-m6-5-hear-addition",
      type: "word_image_mcq",
      meaningEn: "l'addition",
      options: [
        { id: "correct", word: "l'addition", emoji: "🧾" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "la salade", emoji: "🥗" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L2's two-dish order, from memory.
    speaking(
      "fr-m6-5-speak-full-recall",
      "un sandwich et une salade s'il vous plaît",
      "a sandwich and a salad, please",
      [],
      "recall",
    ),
    listeningCompSentence({
      // TAIL: m3 dislike lane, still alternating.
      id: "fr-m6-5-lc-naimepas",
      audioText: "je n'aime pas le thé",
      correctMeaningEn: "I don't like tea.",
      distractorsEn: ["I like tea.", "I would like a tea.", "Another tea, please."],
    }),
    {
      id: "fr-m6-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-fromage", source: "fromage", target: "cheese" },
        { id: "p-addition", source: "addition", target: "the bill" },
        { id: "p-voudrais", source: "je voudrais", target: "I would like" },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-mercibeaucoup", source: "merci beaucoup", target: "thank you very much" },
        { id: "p-six", source: "six", target: "six" },
      ],
    },
    // WIN: the meal-closer, from memory — voiced at the top.
    speaking(
      "fr-m6-5-speak-addition-recall",
      "l'addition s'il vous plaît",
      "the bill, please",
      [],
      "recall",
    ),
  ];
}

/** L6 — Zero new: the café, start to finish, in one sitting. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m6-6-sim-visite",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Le café, start to finish",
        setting: "The madame serves; you do the rest.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-order",
          npc: {
            speaker: "The madame",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like?",
          },
          goal: "Order: a sandwich and a salad.",
          reply: {
            mode: "build",
            tiles: ["un", "sandwich", "et", "une", "salade", "s'il vous plaît"],
            answer: "un sandwich et une salade s'il vous plaît",
            alsoAccepted: ["un sandwich et une salade"],
            audioText: "un sandwich et une salade s'il vous plaît",
          },
          replyGloss: "A sandwich and a salad, please.",
        },
        {
          id: "t2-refill",
          npc: {
            speaker: "The madame",
            kana: "Encore un café ?",
            audioText: "encore un café ?",
            gloss: "Another coffee?",
          },
          goal: "Yes — politely.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouisvp", text: "oui s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "ouisvp",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
        },
        {
          id: "t3-dessert",
          npc: {
            speaker: "The madame",
            kana: "Un gâteau ? Une glace ?",
            audioText: "un gâteau ? une glace ?",
            gloss: "A cake? An ice cream? (the dessert pitch)",
          },
          goal: "You're done — the bill, please.",
          reply: {
            mode: "choice",
            options: [
              { id: "laddition", text: "l'addition s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "encore", text: "encore un café s'il vous plaît" },
            ],
            correctOptionId: "laddition",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "l'addition s'il vous plaît",
          },
          replyGloss: "The bill, please.",
          explanation:
            "Order, seconds, the bill — the whole café liturgy, and you never left French.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m6-6-lc-sandwich",
      audioText: "je voudrais un sandwich",
      correctMeaningEn: "I would like a sandwich.",
      distractorsEn: ["I would like a salad.", "Another sandwich, please.", "I like sandwiches."],
    }),
    // TAIL: L3's win, from memory.
    speaking(
      "fr-m6-6-speak-encoresvp-recall",
      "encore un café s'il vous plaît",
      "another coffee, please",
      [],
      "recall",
    ),
    cloze(
      "fr-m6-6-cloze-une",
      "je voudrais",
      "salade",
      "une",
      ["une", "un"],
      "I would like a salad",
      "je voudrais une salade",
      "«salade» — pink-f, order after order.",
    ),
    {
      id: "fr-m6-6-hear-salade",
      type: "word_image_mcq",
      meaningEn: "la salade",
      options: [
        { id: "correct", word: "la salade", emoji: "🥗" },
        { id: "o1", word: "le sandwich", emoji: "🥪" },
        { id: "o2", word: "le fromage", emoji: "🧀" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m6-6-build-the",
      "Build: 'I would like a tea, please'",
      "je voudrais un thé s'il vous plaît",
      ["je voudrais", "un", "thé", "s'il vous plaît", "une"],
      ["je voudrais", "un", "thé", "s'il vous plaît"],
    ),
    // TAIL: the friend-key, from memory (voiced L4).
    speaking("fr-m6-6-speak-stp-recall", "s'il te plaît", "please (to a friend)", [], "recall"),
    listeningCompSentence({
      // TAIL: m5 question lane.
      id: "fr-m6-6-lc-tuvasou",
      audioText: "tu vas où ?",
      correctMeaningEn: "Where are you going?",
      distractorsEn: ["Where are you from?", "How's it going?", "Shall we go?"],
    }),
    vocabTextMcq("fr-m6-6-mc-encore", "encore", ["demain", "ce soir", "là-bas"]),
    {
      id: "fr-m6-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-addition", source: "addition", target: "the bill" },
        { id: "p-encore", source: "encore", target: "another / more" },
        { id: "p-salade", source: "salade", target: "salad" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-pardon", source: "pardon", target: "excuse me / sorry" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: a fresh order, printed first voicing.
    speaking(
      "fr-m6-6-speak-the",
      "je voudrais un thé s'il vous plaît",
      "I would like a tea, please",
      [],
    ),
  ];
}

/** L7 — Zero new: the pastry counter sorted, m3 foods rejoin the menu. */
function lesson7(): LessonStep[] {
  return [
    genderSort({
      id: "fr-m6-7-sort",
      prompt: "The menu, two sides — sort every dish.",
      buckets: [
        { id: "m", label: "le (blue-m)" },
        { id: "f", label: "la (pink-f)" },
      ],
      items: [
        { id: "g-croissant", surface: "croissant", bucketId: "m", meaningEn: "croissant" },
        { id: "g-salade", surface: "salade", bucketId: "f", meaningEn: "salad" },
        { id: "g-gateau", surface: "gâteau", bucketId: "m", meaningEn: "cake" },
        { id: "g-pizza", surface: "pizza", bucketId: "f", meaningEn: "pizza" },
        { id: "g-sandwich", surface: "sandwich", bucketId: "m", meaningEn: "sandwich" },
        { id: "g-glace", surface: "glace", bucketId: "f", meaningEn: "ice cream" },
        { id: "g-fromage", surface: "fromage", bucketId: "m", meaningEn: "cheese" },
      ],
      endingRule:
        "-eau runs blue-m (gâteau — one ending you can mostly trust); the rest you know because you ordered them.",
    }),
    // TAIL: the cheese confession, from memory (voiced L5).
    speaking("fr-m6-7-speak-fromage-recall", "j'aime le fromage", "I love cheese", [], "recall"),
    cloze(
      "fr-m6-7-cloze-un",
      "encore",
      "gâteau ?",
      "un",
      ["un", "une"],
      "another cake?",
      "encore un gâteau ?",
      "«gâteau» — blue-m; «encore» changes nothing about sides.",
    ),
    listeningCompSentence({
      id: "fr-m6-7-lc-encoreglace",
      audioText: "encore une glace ?",
      correctMeaningEn: "Another ice cream?",
      distractorsEn: ["An ice cream, please.", "Another cake?", "I like ice cream."],
    }),
    build(
      "fr-m6-7-build-pizza",
      "Build: 'I would like a pizza, please'",
      "je voudrais une pizza s'il vous plaît",
      ["je voudrais", "une", "pizza", "s'il vous plaît", "un"],
      ["je voudrais", "une", "pizza", "s'il vous plaît"],
    ),
    {
      id: "fr-m6-7-hear-fromage",
      type: "word_image_mcq",
      meaningEn: "le fromage",
      options: [
        { id: "correct", word: "le fromage", emoji: "🧀" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "le croissant", emoji: "🥐" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m3 food lane, from memory.
    speaking("fr-m6-7-speak-lapizza-recall", "la pizza", "the pizza", [], "recall"),
    cloze(
      "fr-m6-7-cloze-svp",
      "encore une glace",
      "",
      "s'il vous plaît",
      ["s'il vous plaît", "s'il te plaît"],
      "another ice cream, please (to the SERVER)",
      "encore une glace s'il vous plaît",
      "The madame gets «vous» — the register alternates, the manners don't.",
    ),
    {
      id: "fr-m6-7-sim-chloe",
      type: "dialogue_sim",
      scene: { emoji: "🧀", title: "Chloé slides the plate over" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-fromage",
          npc: {
            speaker: "Chloé",
            kana: "Tu aimes le fromage ?",
            audioText: "tu aimes le fromage ?",
            gloss: "Do you like cheese?",
          },
          goal: "Obviously. Say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime le fromage" },
              { id: "tuaimes", text: "oui tu aimes le fromage" },
              { id: "laddition", text: "l'addition s'il vous plaît" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime le fromage",
          },
          replyGloss: "Yes, I love cheese.",
          explanation:
            "Her «tu aimes», your «j'aime» — the flip survives even cheese.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m1 lane by ear.
      id: "fr-m6-7-lc-mercibeaucoup",
      audioText: "merci beaucoup",
      correctMeaningEn: "Thank you very much.",
      distractorsEn: ["Please.", "You're welcome.", "Excuse me."],
    }),
    {
      id: "fr-m6-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-croissant", source: "croissant", target: "croissant" },
        { id: "p-glace", source: "glace", target: "ice cream" },
        { id: "p-ettoi", source: "et toi ?", target: "and you?" },
        { id: "p-jevais", source: "je vais", target: "I'm going" },
        { id: "p-bonsoir", source: "bonsoir", target: "good evening" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    // WIN: the m3 pizza, ordered properly — printed first voicing.
    speaking(
      "fr-m6-7-speak-pizza",
      "je voudrais une pizza s'il vous plaît",
      "I would like a pizza, please",
      [],
    ),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): orders produced, registers
 *  discriminated on alternating answers, the bill requested. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m6-8-hear-croissant",
      type: "word_image_mcq",
      meaningEn: "le croissant",
      options: [
        { id: "correct", word: "le croissant", emoji: "🥐" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "le sandwich", emoji: "🥪" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m6-8-cloze-un",
      "je voudrais",
      "sandwich",
      "un",
      ["un", "une"],
      "I would like a sandwich",
      "je voudrais un sandwich",
      "«sandwich» — blue-m, borrowed and filed.",
    ),
    speaking(
      "fr-m6-8-speak-croissant-recall",
      "je voudrais un croissant",
      "I would like a croissant",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m6-8-lc-encorecroissant",
      audioText: "encore un croissant s'il vous plaît",
      correctMeaningEn: "Another croissant, please.",
      distractorsEn: ["A croissant, please.", "Another cake, please.", "I like croissants."],
    }),
    vocabTextMcq("fr-m6-8-mc-fromage", "fromage", ["gâteau", "croissant", "salade"]),
    build(
      "fr-m6-8-build-addition",
      "Build: 'the bill, please'",
      "l'addition s'il vous plaît",
      ["l'addition", "s'il vous plaît", "encore", "un", "café"],
      ["l'addition", "s'il vous plaît"],
    ),
    {
      id: "fr-m6-8-hear-gateau",
      type: "word_image_mcq",
      meaningEn: "le gâteau",
      options: [
        { id: "correct", word: "le gâteau", emoji: "🍰" },
        { id: "o1", word: "le fromage", emoji: "🧀" },
        { id: "o2", word: "la salade", emoji: "🥗" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m6-8-cloze-ou",
      "un café",
      "un thé ?",
      "ou",
      ["ou", "et"],
      "a coffee OR a tea?",
      "un café ou un thé ?",
      "The counter's oldest question — «ou» makes you choose.",
    ),
    speaking(
      "fr-m6-8-speak-gateaustp-recall",
      "encore un gâteau s'il te plaît",
      "another cake, please (to a friend)",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m6-8-lc-gateau",
      audioText: "je voudrais un gâteau",
      correctMeaningEn: "I would like a cake.",
      distractorsEn: ["I would like an ice cream.", "Another cake?", "I like cake."],
    }),
    build(
      "fr-m6-8-build-encore",
      "Build: 'another coffee, please'",
      "encore un café s'il vous plaît",
      ["encore", "un", "café", "s'il vous plaît", "s'il te plaît"],
      ["encore", "un", "café", "s'il vous plaît"],
    ),
    cloze(
      "fr-m6-8-cloze-stp",
      "un gâteau",
      "",
      "s'il te plaît",
      ["s'il te plaît", "s'il vous plaît"],
      "a cake, please (to a FRIEND)",
      "un gâteau s'il te plaît",
      "The friend-key — «te». The L7 trial went to the server; this one stays at the table.",
    ),
    {
      id: "fr-m6-8-hear-addition",
      type: "word_image_mcq",
      meaningEn: "l'addition",
      options: [
        { id: "correct", word: "l'addition", emoji: "🧾" },
        { id: "o1", word: "le sandwich", emoji: "🥪" },
        { id: "o2", word: "le thé", emoji: "🍵" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m6-8-mc-voudrais", "je voudrais", ["j'aime", "je vais", "il y a"]),
    speaking(
      "fr-m6-8-speak-addition-recall",
      "l'addition s'il vous plaît",
      "the bill, please",
      [],
      "recall",
    ),
    {
      id: "fr-m6-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-voudrais", source: "je voudrais", target: "I would like" },
        { id: "p-encore", source: "encore", target: "another / more" },
        { id: "p-croissant", source: "croissant", target: "croissant" },
        { id: "p-salade", source: "salade", target: "salad" },
        { id: "p-stp", source: "s'il te plaît", target: "please (to a friend)" },
        { id: "p-addition", source: "addition", target: "the bill" },
      ],
    },
  ];
}

/** L9 — «Le déjeuner»: the gang lunches, Léa treats, and the register
 *  earns its keep. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m6-9-sim-dejeuner",
      type: "dialogue_sim",
      scene: {
        emoji: "🍽️",
        title: "Le déjeuner — the whole gang",
        setting: "The madame serves; Léa's in a generous mood.",
      },
      exercisedAtomIds: [],
      explanation:
        "Order, tastes, seconds, and someone else's bill — lunch, survived in style.",
      turns: [
        {
          id: "t1-order",
          npc: {
            speaker: "The madame",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like?",
          },
          goal: "Order: a sandwich and a salad.",
          reply: {
            mode: "build",
            tiles: ["un", "sandwich", "et", "une", "salade", "s'il vous plaît"],
            answer: "un sandwich et une salade s'il vous plaît",
            alsoAccepted: ["un sandwich et une salade"],
            audioText: "un sandwich et une salade s'il vous plaît",
          },
          replyGloss: "A sandwich and a salad, please.",
        },
        {
          id: "t2-fromage",
          npc: {
            speaker: "Hugo",
            kana: "Tu aimes le fromage ?",
            audioText: "tu aimes le fromage ?",
            gloss: "Do you like cheese?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime le fromage" },
              { id: "tuaimes", text: "oui tu aimes le fromage" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime le fromage",
          },
          replyGloss: "Yes, I love cheese.",
        },
        {
          id: "t3-refill",
          npc: {
            speaker: "The madame",
            kana: "Encore un café ?",
            audioText: "encore un café ?",
            gloss: "Another coffee?",
          },
          goal: "One more — server rules.",
          reply: {
            mode: "choice",
            options: [
              { id: "vous", text: "oui s'il vous plaît" },
              { id: "nonmerci", text: "non merci" },
              { id: "te", text: "oui s'il te plaît" },
            ],
            correctOptionId: "vous",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
          explanation:
            "«te» is for friends — she's working. The register IS the answer here.",
        },
        {
          id: "t4-merci",
          npc: {
            speaker: "Léa",
            kana: "L'addition, s'il vous plaît !",
            audioText: "l'addition s'il vous plaît",
            gloss: "The bill, please! (she's treating)",
          },
          goal: "Thank her — warmly.",
          reply: {
            mode: "choice",
            options: [
              { id: "mercibeaucoup", text: "merci beaucoup" },
              { id: "pardon", text: "pardon" },
              { id: "encore", text: "encore un café s'il vous plaît" },
            ],
            correctOptionId: "mercibeaucoup",
            audioText: "merci beaucoup",
          },
          replyGloss: "Thank you so much!",
        },
      ],
    },
    build(
      "fr-m6-9-build-deux",
      "Build: 'I would like a croissant and a coffee'",
      "je voudrais un croissant et un café",
      ["je voudrais", "un", "croissant", "et", "un café", "une"],
      ["je voudrais", "un", "croissant", "et", "un café"],
    ),
    listeningCompSentence({
      id: "fr-m6-9-lc-ouunthe",
      audioText: "un café ou un thé ?",
      correctMeaningEn: "A coffee or a tea?",
      distractorsEn: ["A coffee and a tea.", "Another coffee?", "I would like a tea."],
    }),
    // The L7 win, from memory.
    speaking(
      "fr-m6-9-speak-pizza-recall",
      "je voudrais une pizza s'il vous plaît",
      "I would like a pizza, please",
      [],
      "recall",
    ),
    cloze(
      "fr-m6-9-cloze-le",
      "j'aime",
      "gâteau",
      "le",
      ["le", "la"],
      "I like cake",
      "j'aime le gâteau",
      "«gâteau» stays blue-m in every sentence it sweetens.",
    ),
    {
      id: "fr-m6-9-hear-sandwich",
      type: "word_image_mcq",
      meaningEn: "le sandwich",
      options: [
        { id: "correct", word: "le sandwich", emoji: "🥪" },
        { id: "o1", word: "le croissant", emoji: "🥐" },
        { id: "o2", word: "le fromage", emoji: "🧀" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m6-9-lbuild-glace",
      target: "je voudrais une glace",
      tiles: ["je voudrais", "une", "glace", "un"],
      correctOrder: ["je voudrais", "une", "glace"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m6-9-mc-stp", "s'il te plaît", ["s'il vous plaît", "merci beaucoup", "d'accord"]),
    {
      id: "fr-m6-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-gateau", source: "gâteau", target: "cake" },
        { id: "p-fromage", source: "fromage", target: "cheese" },
        { id: "p-encore", source: "encore", target: "another / more" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-neuf", source: "neuf", target: "nine" },
      ],
    },
    // WIN: the two-dish order once more, from memory.
    speaking(
      "fr-m6-9-speak-full-recall",
      "un sandwich et une salade s'il vous plaît",
      "a sandwich and a salad, please",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends on «Le dîner» — you
 *  order for two, registers flipped live. */
function lesson10(): LessonStep[] {
  return [
    {
      id: "fr-m6-10-hear-gateau",
      type: "word_image_mcq",
      meaningEn: "le gâteau",
      options: [
        { id: "correct", word: "le gâteau", emoji: "🍰" },
        { id: "o1", word: "la salade", emoji: "🥗" },
        { id: "o2", word: "l'addition", emoji: "🧾" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m6-10-build-fullorder",
      "Build: 'I'd like a coffee, please'",
      "je voudrais un café s'il vous plaît",
      ["je voudrais", "un", "café", "s'il vous plaît", "s'il te plaît"],
      ["je voudrais", "un", "café", "s'il vous plaît"],
    ),
    cloze(
      "fr-m6-10-cloze-une",
      "encore",
      "salade ?",
      "une",
      ["une", "un"],
      "another salad?",
      "encore une salade ?",
      "«salade» — pink-f, seconds included.",
    ),
    listeningCompSentence({
      id: "fr-m6-10-lc-addition",
      audioText: "l'addition s'il vous plaît",
      correctMeaningEn: "The bill, please.",
      distractorsEn: ["Another coffee, please.", "A salad, please.", "There you go!"],
    }),
    speaking(
      "fr-m6-10-speak-sandwich-recall",
      "je voudrais un sandwich",
      "I would like a sandwich",
      [],
      "recall",
    ),
    vocabTextMcq("fr-m6-10-mc-salade", "salade", ["croissant", "gâteau", "fromage"]),
    cloze(
      "fr-m6-10-cloze-svp",
      "encore un café",
      "",
      "s'il vous plaît",
      ["s'il vous plaît", "s'il te plaît"],
      "another coffee, please (to the SERVER)",
      "encore un café s'il vous plaît",
      "The checkpoint's trial went to a friend — the server gets «vous».",
    ),
    listeningCompSentence({
      id: "fr-m6-10-lc-the",
      audioText: "je voudrais un thé s'il vous plaît",
      correctMeaningEn: "I would like a tea, please.",
      distractorsEn: ["I would like a coffee, please.", "Another tea, please.", "Do you like tea?"],
    }),
    build(
      "fr-m6-10-build-encorecroissant",
      "Build: 'another croissant, please'",
      "encore un croissant s'il vous plaît",
      ["encore", "un", "croissant", "s'il vous plaît", "une"],
      ["encore", "un", "croissant", "s'il vous plaît"],
    ),
    {
      id: "fr-m6-10-hear-croissant",
      type: "word_image_mcq",
      meaningEn: "le croissant",
      options: [
        { id: "correct", word: "le croissant", emoji: "🥐" },
        { id: "o1", word: "le sandwich", emoji: "🥪" },
        { id: "o2", word: "la pizza", emoji: "🍕" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m6-10-speak-stp-recall", "s'il te plaît", "please (to a friend)", [], "recall"),
    cloze(
      "fr-m6-10-cloze-et",
      "un croissant",
      "un café",
      "et",
      ["et", "ou"],
      "a croissant AND a coffee",
      "un croissant et un café",
      "«et» puts both on the tray.",
    ),
    {
      id: "fr-m6-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-encore", source: "encore", target: "another / more" },
        { id: "p-addition", source: "addition", target: "the bill" },
        { id: "p-fromage", source: "fromage", target: "cheese" },
        { id: "p-sandwich", source: "sandwich", target: "sandwich" },
        { id: "p-svp", source: "s'il vous plaît", target: "please (formal)" },
        { id: "p-gateau", source: "gâteau", target: "cake" },
      ],
    },
    {
      // THE MODULE ENDS ON LE DÎNER — ordering for two.
      id: "fr-m6-10-sim-diner",
      type: "dialogue_sim",
      scene: {
        emoji: "🍽️",
        title: "Le dîner — you order for two",
        setting: "Chloé beside you; the madame waits.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: want it, order it, another one, the bill — the whole café liturgy, in French. Module 7: la famille — what's YOURS.",
      turns: [
        {
          id: "t1-relay",
          npc: {
            speaker: "Chloé",
            kana: "Une salade pour moi !",
            audioText: "une salade pour moi !",
            gloss: "A salad for me! (whispered, friend-voice)",
          },
          goal: "Relay it — server rules.",
          reply: {
            mode: "choice",
            options: [
              { id: "vous", text: "une salade s'il vous plaît" },
              { id: "te", text: "une salade s'il te plaît" },
              { id: "mercibeaucoup", text: "merci beaucoup" },
            ],
            correctOptionId: "vous",
            audioText: "une salade s'il vous plaît",
          },
          replyGloss: "A salad, please.",
          explanation:
            "Chloé whispers in the friend-key; the madame hears the formal one. The flip is yours now.",
        },
        {
          id: "t2-yours",
          npc: {
            speaker: "The madame",
            kana: "Et pour vous ?",
            audioText: "et pour vous ?",
            gloss: "And for you?",
          },
          goal: "Your order — anything, politely.",
          reply: {
            mode: "build",
            tiles: ["je voudrais", "un", "sandwich", "et", "une", "glace", "s'il vous plaît"],
            answer: "je voudrais un sandwich et une glace s'il vous plaît",
            alsoAccepted: [
              "je voudrais un sandwich et une glace",
              "un sandwich et une glace s'il vous plaît",
              "un sandwich et une glace",
              "je voudrais un sandwich s'il vous plaît",
              "je voudrais une glace s'il vous plaît",
              "un sandwich s'il vous plaît",
              "une glace s'il vous plaît",
            ],
            audioText: "je voudrais un sandwich et une glace s'il vous plaît",
          },
          replyGloss: "I'd like a sandwich and an ice cream, please.",
          explanation:
            "Any honest order from this bank wins — one dish or two, «je voudrais» or straight to the point.",
        },
        {
          id: "t3-decline",
          npc: {
            speaker: "The madame",
            kana: "Encore un café ?",
            audioText: "encore un café ?",
            gloss: "Another coffee?",
          },
          goal: "You're fine — decline kindly.",
          reply: {
            mode: "choice",
            options: [
              { id: "nonmerci", text: "non merci" },
              { id: "ouisvp", text: "oui s'il vous plaît" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "nonmerci",
            audioText: "non merci",
          },
          replyGloss: "No, thank you.",
        },
        {
          id: "t4-fin",
          npc: {
            speaker: "The madame",
            kana: "Voilà !",
            audioText: "voilà !",
            gloss: "There you go!",
          },
          goal: "End it in style — the bill.",
          reply: {
            mode: "choice",
            options: [
              { id: "laddition", text: "l'addition s'il vous plaît" },
              { id: "encore", text: "encore un café s'il vous plaît" },
              { id: "bonnenuit", text: "bonne nuit" },
            ],
            correctOptionId: "laddition",
            audioText: "l'addition s'il vous plaît",
          },
          replyGloss: "The bill, please.",
        },
      ],
    },
  ];
}

const FR_M6_1: LessonContent = {
  id: "fr-m6-1",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The magic want — «je voudrais»",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M6_2: LessonContent = {
  id: "fr-m6-2",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Order two things",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M6_3: LessonContent = {
  id: "fr-m6-3",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Another, please",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M6_4: LessonContent = {
  id: "fr-m6-4",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Please, between friends",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M6_5: LessonContent = {
  id: "fr-m6-5",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The meal-closer",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M6_6: LessonContent = {
  id: "fr-m6-6",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The café, start to finish",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M6_7: LessonContent = {
  id: "fr-m6-7",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The menu, sorted",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M6_8: LessonContent = {
  id: "fr-m6-8",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for lunch",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M6_9: LessonContent = {
  id: "fr-m6-9",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le déjeuner",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M6_10: LessonContent = {
  id: "fr-m6-10",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — order for two",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M6_MODULE: FrModuleDef = {
  title: "Au café — order like a local",
  eyebrow: "Module 6",
  summary:
    "«Je voudrais…» orders everything: two dishes with «et», seconds with «encore», the friend-key «s'il te plaît» — and «l'addition» to finish.",
  lessons: [
    FR_M6_1,
    FR_M6_2,
    FR_M6_3,
    FR_M6_4,
    FR_M6_5,
    FR_M6_6,
    FR_M6_7,
    FR_M6_8,
    FR_M6_9,
    FR_M6_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M6_CHECKPOINT_INDEX = 8;

export const FR_M6_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m6-s",
    moduleId: "m6",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m6-s",
        prompt: "Complete: «___ un croissant, s'il vous plaît.»",
        correctText: "je voudrais",
        distractorsText: ["j'aime", "il y a", "tu vas"],
      }),
  },
  {
    id: "pt-fr-m6-1",
    moduleId: "m6",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m6-1",
        prompt: "'Another coffee, please' — pick the French.",
        correctText: "encore un café s'il vous plaît",
        distractorsText: [
          "encore une café s'il vous plaît",
          "et un café s'il vous plaît",
          "je voudrais le café",
        ],
      }),
  },
  {
    id: "pt-fr-m6-2",
    moduleId: "m6",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m6-2",
        prompt: "The meal is over. What do you ask for?",
        correctText: "l'addition s'il vous plaît",
        distractorsText: ["la addition s'il vous plaît", "encore une salade", "je vais au café"],
      }),
  },
  {
    id: "pt-fr-m6-3",
    moduleId: "m6",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m6-3",
        prompt: "Asking your FRIEND to pass the cake — pick the natural please.",
        correctText: "s'il te plaît",
        distractorsText: ["s'il vous plaît", "merci beaucoup", "d'accord"],
      }),
  },
  {
    id: "pt-fr-m6-4",
    moduleId: "m6",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m6-4",
        prompt: "'A sandwich and a salad' — pick the French.",
        correctText: "un sandwich et une salade",
        distractorsText: ["un sandwich ou une salade", "une sandwich et un salade", "un sandwich et un salade"],
      }),
  },
];
