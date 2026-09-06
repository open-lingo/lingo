/**
 * m8.ts — La semaine — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01 per the playbook arc (docs/fr-authoring-playbook.md
 * §8): m7's L10 promised «la semaine — WHEN it all happens». The m5 plan
 * machine gets its calendar.
 *
 * SCOPE DECISIONS (all deliberate):
 *   - DAYS REGISTER AS partOfSpeech "other", NOT noun — flagged for
 *     Spencer. At this tier days are BARE adverbials («on va au cinéma
 *     samedi» = this Saturday); «le samedi» (= every Saturday, habitual)
 *     is a real meaning shift that is NOT taught yet, and registering
 *     days as gendered nouns would make withArticle/vocabTextMcq surface
 *     «le lundi» — teaching the habitual form by accident. A machine pin
 *     keeps «le <day>» (and «week-end») out; the habitual beat is future
 *     work (playbook §6 entry added).
 *   - INTERLEAVE LAW (§13.9 law 9): days are THE repetitive family — the
 *     m1 numbers shape applies: 3/2/2 across L1–L3 (lun/mar/mer ·
 *     jeu/ven · sam/dim) with unrelated sim breaks between, full-run
 *     consolidation in L4, review after. Day runs are COMMA-PACED in the
 *     audio text (the pacing law — the comma IS the pause).
 *   - Days are non-imageable (every honest glyph is the same calendar),
 *     so debuts are info-quote + run-map elimination + ear beats via
 *     listening comp — no word_image_mcq anywhere in m8, and checkpoint
 *     ear work is lc-based.
 *   - «aujourd'hui» + «c'est quand ?» complete the time kit begun by
 *     m5's demain/ce soir; «C'est quand ?» joins the question family
 *     (quoi/où/quand) and is drilled against its siblings.
 *   - «C'est lundi» (not «on est lundi» / «nous sommes lundi») for
 *     "it's Monday" — the c'est machine the course owns; the other
 *     forms wait for their verbs.
 *   - Day-vs-day and day-vs-time clozes always carry a CAPS-disambiguated
 *     meaning (the m2 «SHE is» precedent) because both options are
 *     plausibly true.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   lundi, mardi, mercredi L1 · aujourd'hui c'est mardi L1 · c'est lundi
 *   L1 · jeudi, vendredi L2 · c'est quand ? L2 · on va au cinéma
 *   vendredi ? L2 · samedi, dimanche L3 · on va à la plage samedi ? L3 ·
 *   je vais à la gare dimanche L3 · the full week run L4 · aujourd'hui
 *   c'est vendredi L4 · on va au musée jeudi ? L5 · je vais à l'école
 *   lundi L5 · on va à la plage dimanche ? L6 · aujourd'hui c'est
 *   dimanche L7
 *   recalls drawn: c'est mon père L1 (m7) · tu vas où ? L2 (m5) ·
 *   c'est quand ? L3+L10 · on va à la plage samedi ? L4+L8 ·
 *   aujourd'hui c'est vendredi L5 · je vais à la gare dimanche L5 ·
 *   on va au cinéma vendredi ? L6 · lundi, mardi, mercredi L6 ·
 *   the full week L7+L10 · on va au musée jeudi ? L7 ·
 *   jeudi, vendredi L8 · je vais à l'école lundi L8 ·
 *   on va à la plage dimanche ? L9 · aujourd'hui c'est dimanche L9.
 *
 * Cast: Léa's dateless movie plan births «c'est quand ?»; Hugo books
 * Friday dinner; Chloé quizzes your week; Inès claims Sunday's park;
 * Louis helps book next week in the «Dimanche soir» finale.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  listeningBuildSentence,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M8_ATOMS: FrAtom[] = [
  atom({ surface: "lundi", meaningEn: "Monday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "luhn-DEE — the week's first -di" }),
  atom({ surface: "mardi", meaningEn: "Tuesday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "mar-DEE" }),
  atom({ surface: "mercredi", meaningEn: "Wednesday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "mair-kruh-DEE — the long one" }),
  atom({ surface: "jeudi", meaningEn: "Thursday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "zhuh-DEE" }),
  atom({ surface: "vendredi", meaningEn: "Friday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "vahn-druh-DEE — the good one" }),
  atom({ surface: "samedi", meaningEn: "Saturday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "sam-DEE" }),
  atom({ surface: "dimanche", meaningEn: "Sunday", partOfSpeech: "other", fromModule: "m8", kind: "vocab", hint: "dee-MAHNSH — the only day without -di at the end" }),
  atom({ surface: "aujourd'hui", meaningEn: "today", partOfSpeech: "adverb", fromModule: "m8", kind: "vocab", hint: "oh-zhoor-DWEE — a whole old phrase fused into one word" }),
  atom({ surface: "c'est quand ?", meaningEn: "when is it?", partOfSpeech: "phrase", fromModule: "m8", kind: "phrase", hint: "say KAHN — quoi asks what, où asks where, quand asks when" }),
];

/** L1 — lundi/mardi/mercredi + «aujourd'hui» (the 3 of the 3/2/2 split,
 *  with an m5 break in the middle). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m8-1-info-week",
      "The week begins",
      "French days end in -di: «lundi, mardi, mercredi» — Monday, Tuesday, Wednesday (luhn-DEE, mar-DEE, mair-kruh-DEE). And «aujourd'hui» — today (oh-zhoor-DWEE, a whole old phrase fused into one word). «C'est lundi» — it's Monday. The calendar is about to be yours.",
      "grammar",
    ),
    {
      id: "fr-m8-1-map-lunmarmer",
      type: "word_map",
      tokens: ["lundi", "mardi", "mercredi"],
      pairs: [
        { en: "Monday", tokenIndex: 0 },
        { en: "Tuesday", tokenIndex: 1 },
        { en: "Wednesday", tokenIndex: 2 },
      ],
      audioText: "lundi, mardi, mercredi",
      revealNote:
        "Three -di's in a row — the ending is the family badge. Four more to come, not all today.",
    },
    speaking("fr-m8-1-speak-run", "lundi, mardi, mercredi", "Monday, Tuesday, Wednesday", []),
    listeningCompSentence({
      id: "fr-m8-1-lc-lundi",
      audioText: "c'est lundi",
      correctMeaningEn: "It's Monday.",
      distractorsEn: ["It's Tuesday.", "It's today.", "See you Monday."],
    }),
    {
      // The interleave break (§13.9 law 9): a person, mid-days.
      id: "fr-m8-1-sim-hugo",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Hugo, headed the same way" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ou",
          npc: {
            speaker: "Hugo",
            kana: "Tu vas où ?",
            audioText: "tu vas où ?",
            gloss: "Where are you going?",
          },
          goal: "The café — tell him.",
          reply: {
            mode: "build",
            tiles: ["je vais", "au", "café", "à la"],
            answer: "je vais au café",
            audioText: "je vais au café",
          },
          replyGloss: "I'm going to the café.",
        },
      ],
    },
    {
      id: "fr-m8-1-map-aujourdhui",
      type: "word_map",
      tokens: ["aujourd'hui", "c'est", "mardi"],
      pairs: [
        { en: "today", tokenIndex: 0 },
        { en: "it's", tokenIndex: 1 },
        { en: "Tuesday", tokenIndex: 2 },
      ],
      audioText: "aujourd'hui c'est mardi",
      revealNote:
        "«aujourd'hui» up front, «c'est» does the naming — today gets a name like everything else in this course.",
    },
    speaking("fr-m8-1-speak-mardi", "aujourd'hui c'est mardi", "today is Tuesday", []),
    cloze(
      "fr-m8-1-cloze-mercredi",
      "aujourd'hui c'est",
      "",
      "mercredi",
      ["mercredi", "mardi"],
      "today is WEDNESDAY",
      "aujourd'hui c'est mercredi",
      "«mercredi» — the long one: mair-kruh-DEE. «mardi» is its shorter neighbor.",
    ),
    {
      // TAIL: m7 by ear.
      id: "fr-m8-1-hear-famille",
      type: "word_image_mcq",
      meaningEn: "la famille",
      options: [
        { id: "correct", word: "la famille", emoji: "👨‍👩‍👧‍👦" },
        { id: "o1", word: "le frère", emoji: "👦" },
        { id: "o2", word: "le chat", emoji: "🐱" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m7 claims lane, from memory.
    speaking("fr-m8-1-speak-monpere-recall", "c'est mon père", "that's my father", [], "recall"),
    listeningCompSentence({
      id: "fr-m8-1-lc-mercredi",
      audioText: "c'est mercredi",
      correctMeaningEn: "It's Wednesday.",
      distractorsEn: ["It's Tuesday.", "It's Monday.", "It's today."],
    }),
    {
      id: "fr-m8-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-lundi", source: "lundi", target: "Monday" },
        { id: "p-mardi", source: "mardi", target: "Tuesday" },
        { id: "p-aujourdhui", source: "aujourd'hui", target: "today" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-bonjour", source: "bonjour", target: "hello" },
      ],
    },
    // WIN: name the day — printed first voicing.
    speaking("fr-m8-1-speak-lundi", "c'est lundi", "it's Monday", []),
  ];
}

/** L2 — jeudi/vendredi + «c'est quand ?» (the question family grows). */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m8-2-info-quand",
      "Point at the calendar",
      "«jeudi» — Thursday (zhuh-DEE), «vendredi» — Friday (vahn-druh-DEE, the good one). And the question that runs your diary: «C'est quand ?» — when is it? (say KAHN). «quoi» asks what, «où» asks where — «quand» asks when. Answer with any day you own: «Vendredi !»",
      "grammar",
    ),
    {
      id: "fr-m8-2-map-jeuven",
      type: "word_map",
      tokens: ["jeudi", "vendredi"],
      pairs: [
        { en: "Thursday", tokenIndex: 0 },
        { en: "Friday", tokenIndex: 1 },
      ],
      audioText: "jeudi, vendredi",
      revealNote:
        "Two more -di's — the week is five-sevenths yours.",
    },
    speaking("fr-m8-2-speak-jeuven", "jeudi, vendredi", "Thursday, Friday", []),
    {
      // «c'est quand ?» debuts where it lives: a plan with no date.
      id: "fr-m8-2-sim-lea",
      type: "dialogue_sim",
      scene: {
        emoji: "🎬",
        title: "Léa announces a plan",
        setting: "A great plan. Missing one detail.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-quand",
          npc: {
            speaker: "Léa",
            kana: "On va au cinéma !",
            audioText: "on va au cinéma !",
            gloss: "We're going to the movies!",
          },
          goal: "Ask when.",
          reply: {
            mode: "choice",
            options: [
              { id: "quand", text: "c'est quand ?" },
              { id: "quoi", text: "c'est quoi ?" },
              { id: "ou", text: "tu vas où ?" },
            ],
            correctOptionId: "quand",
            audioText: "c'est quand ?",
          },
          replyGloss: "When is it?",
          explanation:
            "«C'est quand ?» — the question family's third member: quoi, où, quand.",
        },
      ],
    },
    speaking("fr-m8-2-speak-quand", "c'est quand ?", "when is it?", []),
    listeningCompSentence({
      id: "fr-m8-2-lc-vendredi",
      audioText: "c'est vendredi",
      correctMeaningEn: "It's Friday.",
      distractorsEn: ["It's Thursday.", "It's Saturday.", "When is it?"],
    }),
    {
      // TAIL: m6 by ear.
      id: "fr-m8-2-hear-croissant",
      type: "word_image_mcq",
      meaningEn: "le croissant",
      options: [
        { id: "correct", word: "le croissant", emoji: "🥐" },
        { id: "o1", word: "le gâteau", emoji: "🍰" },
        { id: "o2", word: "le sandwich", emoji: "🥪" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the question that started it all, from memory.
    speaking("fr-m8-2-speak-tuvasou-recall", "tu vas où ?", "where are you going?", [], "recall"),
    cloze(
      "fr-m8-2-cloze-jeudi",
      "c'est",
      "",
      "jeudi",
      ["jeudi", "vendredi"],
      "it's THURSDAY",
      "c'est jeudi",
      "«jeudi» — zhuh-DEE. Friday's shorter, better-loved neighbor.",
    ),
    listeningCompSentence({
      // mardi/mercredi ear lane, trial 1.
      id: "fr-m8-2-lc-mardi",
      audioText: "c'est mardi",
      correctMeaningEn: "It's Tuesday.",
      distractorsEn: ["It's Wednesday.", "It's Thursday.", "It's today."],
    }),
    build(
      "fr-m8-2-build-vendredi",
      "Build: 'shall we go to the movies on Friday?'",
      "on va au cinéma vendredi ?",
      ["on va", "au", "cinéma", "vendredi ?", "lundi"],
      ["on va", "au", "cinéma", "vendredi ?"],
    ),
    {
      id: "fr-m8-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jeudi", source: "jeudi", target: "Thursday" },
        { id: "p-vendredi", source: "vendredi", target: "Friday" },
        { id: "p-quand", source: "c'est quand ?", target: "when is it?" },
        { id: "p-quoi", source: "c'est quoi ?", target: "what is that?" },
        { id: "p-tuvasou", source: "tu vas où ?", target: "where are you going?" },
        { id: "p-onva", source: "on va", target: "we're going" },
      ],
    },
    // WIN: a plan with a date — printed first voicing.
    speaking(
      "fr-m8-2-speak-vendredi",
      "on va au cinéma vendredi ?",
      "shall we go to the movies on Friday?",
      [],
    ),
  ];
}

/** L3 — samedi/dimanche: the weekend, and plans that use it. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m8-3-info-weekend",
      "The good ones",
      "«samedi» — Saturday (sam-DEE), «dimanche» — Sunday (dee-MAHNSH, the only day that drops the -di badge). «On va à la plage samedi ?» — your plans just got dates.",
      "grammar",
    ),
    {
      id: "fr-m8-3-map-samdim",
      type: "word_map",
      tokens: ["samedi", "dimanche"],
      pairs: [
        { en: "Saturday", tokenIndex: 0 },
        { en: "Sunday", tokenIndex: 1 },
      ],
      audioText: "samedi, dimanche",
      revealNote:
        "The weekend pair — and «dimanche» breaks the -di rule just to feel special.",
    },
    speaking("fr-m8-3-speak-samdim", "samedi, dimanche", "Saturday, Sunday", []),
    {
      id: "fr-m8-3-map-plagesamedi",
      type: "word_map",
      tokens: ["on va", "à la", "plage", "samedi"],
      pairs: [
        { en: "we're going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "beach", tokenIndex: 2 },
        { en: "Saturday", tokenIndex: 3 },
      ],
      audioText: "on va à la plage samedi ?",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote:
        "The m5 plan machine plus one day-word — place, then date, no 'on' needed in French.",
    },
    speaking(
      "fr-m8-3-speak-plagesamedi",
      "on va à la plage samedi ?",
      "shall we go to the beach on Saturday?",
      [],
    ),
    {
      id: "fr-m8-3-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🎬",
        title: "Chloé, planning ahead",
        setting: "You mentioned a movie plan.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-quand",
          npc: {
            speaker: "Chloé",
            kana: "C'est quand ?",
            audioText: "c'est quand ?",
            gloss: "When is it?",
          },
          goal: "Saturday — tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "samedi", text: "samedi" },
              { id: "labas", text: "là-bas" },
              { id: "daccord", text: "d'accord" },
            ],
            correctOptionId: "samedi",
            audioText: "samedi",
          },
          replyGloss: "Saturday.",
          explanation:
            "One word answers it — days work like «ici» and «là-bas»: alone and proud.",
        },
      ],
    },
    cloze(
      "fr-m8-3-cloze-samedi",
      "on va au cinéma",
      "?",
      "samedi",
      ["samedi", "dimanche"],
      "shall we go to the movies on SATURDAY?",
      "on va au cinéma samedi ?",
      "«samedi» — sam-DEE; «dimanche» would push it a day.",
    ),
    {
      // TAIL: m4 by ear.
      id: "fr-m8-3-hear-plage",
      type: "word_image_mcq",
      meaningEn: "la plage",
      options: [
        { id: "correct", word: "la plage", emoji: "🏖️" },
        { id: "o1", word: "la gare", emoji: "🚉" },
        { id: "o2", word: "le parc", emoji: "🌳" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the new question, from memory.
    speaking("fr-m8-3-speak-quand-recall", "c'est quand ?", "when is it?", [], "recall"),
    listeningCompSentence({
      id: "fr-m8-3-lc-dimanche",
      audioText: "c'est dimanche",
      correctMeaningEn: "It's Sunday.",
      distractorsEn: ["It's Saturday.", "It's Friday.", "It's today."],
    }),
    build(
      "fr-m8-3-build-garedimanche",
      "Build: 'I'm going to the station on Sunday'",
      "je vais à la gare dimanche",
      ["je vais", "à la", "gare", "dimanche", "samedi"],
      ["je vais", "à la", "gare", "dimanche"],
      undefined,
      ["dimanche je vais à la gare"],
    ),
    {
      id: "fr-m8-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-samedi", source: "samedi", target: "Saturday" },
        { id: "p-dimanche", source: "dimanche", target: "Sunday" },
        { id: "p-mercredi", source: "mercredi", target: "Wednesday" },
        { id: "p-plage", source: "plage", target: "beach" },
        { id: "p-gare", source: "gare", target: "train station" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
      ],
    },
    // WIN: Sunday's errand — printed first voicing.
    speaking(
      "fr-m8-3-speak-garedimanche",
      "je vais à la gare dimanche",
      "I'm going to the station on Sunday",
      [],
    ),
  ];
}

/** L4 — the full seven, in one breath. Zero new atoms. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m8-4-info-seven",
      "Seven in a row",
      "The whole ladder: «lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche». Say it once a day and the calendar is yours. «aujourd'hui» → «demain»: the week moves one -di at a time.",
      "grammar",
    ),
    {
      id: "fr-m8-4-map-week",
      type: "word_map",
      tokens: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"],
      pairs: [
        { en: "Monday", tokenIndex: 0 },
        { en: "Tuesday", tokenIndex: 1 },
        { en: "Wednesday", tokenIndex: 2 },
        { en: "Thursday", tokenIndex: 3 },
        { en: "Friday", tokenIndex: 4 },
        { en: "Saturday", tokenIndex: 5 },
        { en: "Sunday", tokenIndex: 6 },
      ],
      audioText: "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche",
      revealNote:
        "Seven chips, one week — you just read a French calendar out loud.",
    },
    speaking(
      "fr-m8-4-speak-week",
      "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche",
      "the days of the week",
      [],
    ),
    cloze(
      "fr-m8-4-cloze-seq1",
      "lundi, mardi,",
      "",
      "mercredi",
      ["mercredi", "jeudi"],
      "Monday, Tuesday, …?",
      "lundi, mardi, mercredi",
      "The ladder climbs one rung at a time — mercredi comes third.",
    ),
    listeningCompSentence({
      id: "fr-m8-4-lc-jeudi",
      audioText: "aujourd'hui c'est jeudi",
      correctMeaningEn: "Today is Thursday.",
      distractorsEn: ["Today is Tuesday.", "It's Friday.", "Tomorrow is Thursday."],
    }),
    {
      // Interleave break: a refill, mid-calendar.
      id: "fr-m8-4-sim-emma",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Emma lifts the pot" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-refill",
          npc: {
            speaker: "Emma",
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
              { id: "quand", text: "c'est quand ?" },
            ],
            correctOptionId: "ouisvp",
            alsoCorrectOptionIds: ["nonmerci"],
            audioText: "oui s'il vous plaît",
          },
          replyGloss: "Yes, please.",
        },
      ],
    },
    cloze(
      "fr-m8-4-cloze-seq2",
      "samedi,",
      "",
      "dimanche",
      ["dimanche", "vendredi"],
      "Saturday, …?",
      "samedi, dimanche",
      "After samedi the -di badge drops: dimanche.",
    ),
    {
      // TAIL: m7 by ear.
      id: "fr-m8-4-hear-pere",
      type: "word_image_mcq",
      meaningEn: "le père",
      options: [
        { id: "correct", word: "le père", emoji: "🧔" },
        { id: "o1", word: "la mère", emoji: "👩‍🦰" },
        { id: "o2", word: "le frère", emoji: "👦" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: Saturday's plan, from memory.
    speaking(
      "fr-m8-4-speak-plagesamedi-recall",
      "on va à la plage samedi ?",
      "shall we go to the beach on Saturday?",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m8-4-lc-samedi",
      audioText: "c'est samedi",
      correctMeaningEn: "It's Saturday.",
      distractorsEn: ["It's Sunday.", "It's today.", "When is it?"],
    }),
    build(
      "fr-m8-4-build-vendredi",
      "Build: 'today is Friday'",
      "aujourd'hui c'est vendredi",
      ["aujourd'hui", "c'est", "vendredi", "demain"],
      ["aujourd'hui", "c'est", "vendredi"],
    ),
    {
      id: "fr-m8-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jeudi", source: "jeudi", target: "Thursday" },
        { id: "p-vendredi", source: "vendredi", target: "Friday" },
        { id: "p-dimanche", source: "dimanche", target: "Sunday" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-salut", source: "salut", target: "hi / bye (casual)" },
      ],
    },
    // WIN: the best sentence of the week — printed first voicing.
    speaking(
      "fr-m8-4-speak-vendredi",
      "aujourd'hui c'est vendredi",
      "today is Friday",
      [],
    ),
  ];
}

/** L5 — plans meet the calendar. Zero new atoms. */
function lesson5(): LessonStep[] {
  return [
    {
      id: "fr-m8-5-sim-hugo",
      type: "dialogue_sim",
      scene: {
        emoji: "🍽️",
        title: "Hugo books the week",
        setting: "He has opinions about Friday.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-vendredi",
          npc: {
            speaker: "Hugo",
            kana: "On va au restaurant vendredi ?",
            audioText: "on va au restaurant vendredi ?",
            gloss: "Shall we go to the restaurant on Friday?",
          },
          goal: "Deal!",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "quoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
        {
          id: "t2-plage",
          npc: {
            speaker: "Hugo",
            kana: "Et la plage, c'est quand ?",
            audioText: "et la plage c'est quand ?",
            gloss: "And the beach — when?",
          },
          goal: "Sunday — tell him.",
          reply: {
            mode: "choice",
            options: [
              { id: "dimanche", text: "dimanche" },
              { id: "aujourdhui", text: "aujourd'hui" },
              { id: "daccord", text: "d'accord" },
            ],
            correctOptionId: "dimanche",
            audioText: "dimanche",
          },
          replyGloss: "Sunday.",
          explanation:
            "«c'est quand ?» aimed at any plan gets a one-word day back.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m8-5-lc-restovendredi",
      audioText: "on va au restaurant vendredi ?",
      correctMeaningEn: "Shall we go to the restaurant on Friday?",
      distractorsEn: [
        "Shall we go to the restaurant tonight?",
        "Are you going to the restaurant?",
        "Shall we go to the movies on Friday?",
      ],
    }),
    // TAIL: yesterday's win, from memory.
    speaking(
      "fr-m8-5-speak-vendredi-recall",
      "aujourd'hui c'est vendredi",
      "today is Friday",
      [],
      "recall",
    ),
    cloze(
      "fr-m8-5-cloze-cesoir",
      "on va au restaurant",
      "?",
      "ce soir",
      ["ce soir", "vendredi"],
      "shall we go to the restaurant TONIGHT?",
      "on va au restaurant ce soir ?",
      "«ce soir» can't wait for Friday — the m5 time-words still play.",
    ),
    build(
      "fr-m8-5-build-museejeudi",
      "Build: 'shall we go to the museum on Thursday?'",
      "on va au musée jeudi ?",
      ["on va", "au", "musée", "jeudi ?", "à la"],
      ["on va", "au", "musée", "jeudi ?"],
    ),
    {
      // TAIL: m3 by ear.
      id: "fr-m8-5-hear-cinema",
      type: "word_image_mcq",
      meaningEn: "le cinéma",
      options: [
        { id: "correct", word: "le cinéma", emoji: "🎬" },
        { id: "o1", word: "le musée", emoji: "🏛️" },
        { id: "o2", word: "la plage", emoji: "🏖️" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m8-5-speak-museejeudi", "on va au musée jeudi ?", "shall we go to the museum on Thursday?", []),
    listeningCompSentence({
      id: "fr-m8-5-lc-ecolelundi",
      audioText: "je vais à l'école lundi",
      correctMeaningEn: "I'm going to school on Monday.",
      distractorsEn: [
        "I'm going to school today.",
        "I'm going to the station on Monday.",
        "Shall we go to school on Monday?",
      ],
    }),
    cloze(
      "fr-m8-5-cloze-lundi",
      "je vais à l'école",
      "",
      "lundi",
      ["lundi", "dimanche"],
      "I'm going to school on MONDAY",
      "je vais à l'école lundi",
      "School runs on «lundi» — «dimanche» would be a very quiet classroom.",
    ),
    // TAIL: Sunday's errand, from memory.
    speaking(
      "fr-m8-5-speak-garedimanche-recall",
      "je vais à la gare dimanche",
      "I'm going to the station on Sunday",
      [],
      "recall",
    ),
    {
      id: "fr-m8-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-samedi", source: "samedi", target: "Saturday" },
        { id: "p-lundi", source: "lundi", target: "Monday" },
        { id: "p-quand", source: "c'est quand ?", target: "when is it?" },
        { id: "p-ecole", source: "école", target: "school" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: the school run, dated — printed first voicing.
    speaking(
      "fr-m8-5-speak-ecolelundi",
      "je vais à l'école lundi",
      "I'm going to school on Monday",
      [],
    ),
  ];
}

/** L6 — «La semaine de Sam»: your week, narrated and asked. Zero new. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m8-6-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "📅",
        title: "Chloé quizzes your week",
        setting: "She's building a mental calendar of you.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-lundi",
          npc: {
            speaker: "Chloé",
            kana: "Tu vas où lundi ?",
            audioText: "tu vas où lundi ?",
            gloss: "Where are you going on Monday?",
          },
          goal: "School — tell her.",
          reply: {
            mode: "build",
            tiles: ["je vais", "à", "l'école", "au"],
            answer: "je vais à l'école",
            audioText: "je vais à l'école",
          },
          replyGloss: "I'm going to school.",
        },
        {
          id: "t2-samedi",
          npc: {
            speaker: "Chloé",
            kana: "Et samedi ?",
            audioText: "et samedi ?",
            gloss: "And Saturday?",
          },
          goal: "The beach — dream big.",
          reply: {
            mode: "build",
            tiles: ["je vais", "à la", "plage", "au"],
            answer: "je vais à la plage",
            audioText: "je vais à la plage",
          },
          replyGloss: "I'm going to the beach.",
          explanation:
            "«Et samedi ?» — the tiny follow-up that keeps a diary conversation alive.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m8-6-lc-ousamedi",
      audioText: "tu vas où samedi ?",
      correctMeaningEn: "Where are you going on Saturday?",
      distractorsEn: [
        "Where are you going on Sunday?",
        "Where are you going?",
        "Are you going to the beach on Saturday?",
      ],
    }),
    // TAIL: Friday's plan, from memory.
    speaking(
      "fr-m8-6-speak-cinemavendredi-recall",
      "on va au cinéma vendredi ?",
      "shall we go to the movies on Friday?",
      [],
      "recall",
    ),
    cloze(
      "fr-m8-6-cloze-samedi",
      "tu vas où",
      "?",
      "samedi",
      ["samedi", "aujourd'hui"],
      "where are you going on SATURDAY?",
      "tu vas où samedi ?",
      "A day-word rides at the end of any question — «samedi» stamps it.",
    ),
    build(
      "fr-m8-6-build-plagedimanche",
      "Build: 'shall we go to the beach on Sunday?'",
      "on va à la plage dimanche ?",
      ["on va", "à la", "plage", "dimanche ?", "au"],
      ["on va", "à la", "plage", "dimanche ?"],
    ),
    {
      // TAIL: m6 by ear.
      id: "fr-m8-6-hear-gateau",
      type: "word_image_mcq",
      meaningEn: "le gâteau",
      options: [
        { id: "correct", word: "le gâteau", emoji: "🍰" },
        { id: "o1", word: "le fromage", emoji: "🧀" },
        { id: "o2", word: "la salade", emoji: "🥗" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1's run, from memory.
    speaking(
      "fr-m8-6-speak-run-recall",
      "lundi, mardi, mercredi",
      "Monday, Tuesday, Wednesday",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m8-6-lc-mercredi2",
      audioText: "aujourd'hui c'est mercredi",
      correctMeaningEn: "Today is Wednesday.",
      distractorsEn: ["Today is Tuesday.", "It's Thursday.", "Tomorrow is Wednesday."],
    }),
    vocabTextMcq("fr-m8-6-mc-aujourdhui", "aujourd'hui", ["demain", "ce soir", "là-bas"]),
    {
      id: "fr-m8-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-mardi", source: "mardi", target: "Tuesday" },
        { id: "p-jeudi", source: "jeudi", target: "Thursday" },
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-pardon", source: "pardon", target: "excuse me / sorry" },
        { id: "p-six", source: "six", target: "six" },
      ],
    },
    // WIN: Sunday, claimed — printed first voicing.
    speaking(
      "fr-m8-6-speak-plagedimanche",
      "on va à la plage dimanche ?",
      "shall we go to the beach on Sunday?",
      [],
    ),
  ];
}

/** L7 — zero new: sequence drills, the week from memory, and Sunday's
 *  park. */
function lesson7(): LessonStep[] {
  return [
    listeningBuildSentence({
      id: "fr-m8-7-lbuild-run",
      target: "lundi, mardi, mercredi",
      tiles: ["lundi", "mardi", "mercredi", "jeudi"],
      correctOrder: ["lundi", "mardi", "mercredi"],
      promptEn: "Build what you hear",
    }),
    // The whole week, from memory (voiced L4).
    speaking(
      "fr-m8-7-speak-week-recall",
      "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche",
      "the days of the week",
      [],
      "recall",
    ),
    cloze(
      "fr-m8-7-cloze-seq3",
      "jeudi,",
      "",
      "vendredi",
      ["vendredi", "samedi"],
      "Thursday, …?",
      "jeudi, vendredi",
      "After jeudi comes the good one: vendredi.",
    ),
    listeningCompSentence({
      id: "fr-m8-7-lc-jeudi2",
      audioText: "c'est jeudi",
      correctMeaningEn: "It's Thursday.",
      distractorsEn: ["It's Tuesday.", "It's Friday.", "It's Saturday."],
    }),
    build(
      "fr-m8-7-build-dimanche",
      "Build: 'today is Sunday'",
      "aujourd'hui c'est dimanche",
      ["aujourd'hui", "c'est", "dimanche", "samedi"],
      ["aujourd'hui", "c'est", "dimanche"],
    ),
    {
      // TAIL: m7 by ear.
      id: "fr-m8-7-hear-mere",
      type: "word_image_mcq",
      meaningEn: "la mère",
      options: [
        { id: "correct", word: "la mère", emoji: "👩‍🦰" },
        { id: "o1", word: "le père", emoji: "🧔" },
        { id: "o2", word: "la sœur", emoji: "👧" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: Thursday's museum, from memory.
    speaking(
      "fr-m8-7-speak-museejeudi-recall",
      "on va au musée jeudi ?",
      "shall we go to the museum on Thursday?",
      [],
      "recall",
    ),
    cloze(
      "fr-m8-7-cloze-aujsamedi",
      "aujourd'hui c'est",
      "",
      "samedi",
      ["samedi", "dimanche"],
      "today is SATURDAY",
      "aujourd'hui c'est samedi",
      "sam-DEE today; dee-MAHNSH must wait its turn.",
    ),
    {
      id: "fr-m8-7-sim-ines",
      type: "dialogue_sim",
      scene: { emoji: "🌳", title: "Inès claims Sunday" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-parc",
          npc: {
            speaker: "Inès",
            kana: "On va au parc dimanche ?",
            audioText: "on va au parc dimanche ?",
            gloss: "Shall we go to the park on Sunday?",
          },
          goal: "Deal.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "quoi", text: "c'est quoi ?" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m2 lane by ear.
      id: "fr-m8-7-lc-tappelles",
      audioText: "comment tu t'appelles ?",
      correctMeaningEn: "What's your name?",
      distractorsEn: ["How's it going?", "Where are you from?", "When is it?"],
    }),
    {
      id: "fr-m8-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-lundi", source: "lundi", target: "Monday" },
        { id: "p-samedi", source: "samedi", target: "Saturday" },
        { id: "p-dimanche", source: "dimanche", target: "Sunday" },
        { id: "p-tuvasou", source: "tu vas où ?", target: "where are you going?" },
        { id: "p-bonnenuit", source: "bonne nuit", target: "good night" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: the laziest, best sentence — printed first voicing.
    speaking(
      "fr-m8-7-speak-dimanche",
      "aujourd'hui c'est dimanche",
      "today is Sunday",
      [],
    ),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): days by ear on alternating
 *  answers, sequences produced, plans dated. Days have no honest image,
 *  so the ear work is listening-comp based. */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m8-8-lc-lundi",
      audioText: "c'est lundi",
      correctMeaningEn: "It's Monday.",
      distractorsEn: ["It's Tuesday.", "It's Sunday.", "It's today."],
    }),
    cloze(
      "fr-m8-8-cloze-seq",
      "mardi,",
      "",
      "mercredi",
      ["mercredi", "jeudi"],
      "Tuesday, …?",
      "mardi, mercredi",
      "The ladder never skips — mercredi follows mardi.",
    ),
    speaking(
      "fr-m8-8-speak-jeuven-recall",
      "jeudi, vendredi",
      "Thursday, Friday",
      [],
      "recall",
    ),
    vocabTextMcq("fr-m8-8-mc-quand", "c'est quand ?", ["c'est quoi ?", "tu vas où ?", "tu es d'où ?"]),
    build(
      "fr-m8-8-build-cinemasamedi",
      "Build: 'shall we go to the movies on Saturday?'",
      "on va au cinéma samedi ?",
      ["on va", "au", "cinéma", "samedi ?", "dimanche"],
      ["on va", "au", "cinéma", "samedi ?"],
    ),
    listeningCompSentence({
      id: "fr-m8-8-lc-vendredi2",
      audioText: "c'est vendredi",
      correctMeaningEn: "It's Friday.",
      distractorsEn: ["It's Thursday.", "It's Wednesday.", "It's Saturday."],
    }),
    cloze(
      "fr-m8-8-cloze-aujlundi",
      "aujourd'hui c'est",
      "",
      "lundi",
      ["lundi", "mardi"],
      "today is MONDAY",
      "aujourd'hui c'est lundi",
      "luhn-DEE — the week restarts whether we like it or not.",
    ),
    speaking(
      "fr-m8-8-speak-plagesamedi-recall",
      "on va à la plage samedi ?",
      "shall we go to the beach on Saturday?",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m8-8-lc-garedimanche",
      audioText: "je vais à la gare dimanche",
      correctMeaningEn: "I'm going to the station on Sunday.",
      distractorsEn: [
        "I'm going to the station on Saturday.",
        "I'm going to school on Sunday.",
        "Shall we go to the station on Sunday?",
      ],
    }),
    build(
      "fr-m8-8-build-aujvendredi",
      "Build: 'today is Friday'",
      "aujourd'hui c'est vendredi",
      ["aujourd'hui", "c'est", "vendredi", "lundi"],
      ["aujourd'hui", "c'est", "vendredi"],
    ),
    cloze(
      "fr-m8-8-cloze-seq4",
      "vendredi,",
      "",
      "samedi",
      ["samedi", "dimanche"],
      "Friday, …?",
      "vendredi, samedi",
      "After the good one comes the free one: samedi.",
    ),
    listeningCompSentence({
      id: "fr-m8-8-lc-parcdimanche",
      audioText: "on va au parc dimanche ?",
      correctMeaningEn: "Shall we go to the park on Sunday?",
      distractorsEn: [
        "Shall we go to the park on Saturday?",
        "Are you going to the park?",
        "There's a park here.",
      ],
    }),
    vocabTextMcq("fr-m8-8-mc-aujourdhui", "aujourd'hui", ["demain", "ce soir", "moi aussi"]),
    speaking(
      "fr-m8-8-speak-ecolelundi-recall",
      "je vais à l'école lundi",
      "I'm going to school on Monday",
      [],
      "recall",
    ),
    {
      id: "fr-m8-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-lundi", source: "lundi", target: "Monday" },
        { id: "p-mercredi", source: "mercredi", target: "Wednesday" },
        { id: "p-vendredi", source: "vendredi", target: "Friday" },
        { id: "p-dimanche", source: "dimanche", target: "Sunday" },
        { id: "p-aujourdhui", source: "aujourd'hui", target: "today" },
        { id: "p-quand", source: "c'est quand ?", target: "when is it?" },
      ],
    },
  ];
}

/** L9 — «Le grand plan»: the gang books the whole week, then the tail. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m8-9-sim-plan",
      type: "dialogue_sim",
      scene: {
        emoji: "📅",
        title: "Le grand plan",
        setting: "One calendar, four friends, zero mercy.",
      },
      exercisedAtomIds: [],
      explanation:
        "A movie, a beach date, a park, a dinner — the whole week pinned down in French.",
      turns: [
        {
          id: "t1-vendredi",
          npc: {
            speaker: "Chloé",
            kana: "On va au cinéma vendredi ?",
            audioText: "on va au cinéma vendredi ?",
            gloss: "Shall we go to the movies on Friday?",
          },
          goal: "Deal!",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "comprends", text: "je ne comprends pas" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
        {
          id: "t2-plage",
          npc: {
            speaker: "Hugo",
            kana: "Et la plage, c'est quand ?",
            audioText: "et la plage c'est quand ?",
            gloss: "And the beach — when?",
          },
          goal: "Saturday.",
          reply: {
            mode: "choice",
            options: [
              { id: "samedi", text: "samedi" },
              { id: "aujourdhui", text: "aujourd'hui" },
              { id: "labas", text: "là-bas" },
            ],
            correctOptionId: "samedi",
            audioText: "samedi",
          },
          replyGloss: "Saturday.",
        },
        {
          id: "t3-dimanche",
          npc: {
            speaker: "Emma",
            kana: "Tu vas où dimanche ?",
            audioText: "tu vas où dimanche ?",
            gloss: "Where are you going on Sunday?",
          },
          goal: "The park — tell her.",
          reply: {
            mode: "build",
            tiles: ["je vais", "au", "parc", "à la"],
            answer: "je vais au parc",
            audioText: "je vais au parc",
          },
          replyGloss: "I'm going to the park.",
        },
        {
          id: "t4-cesoir",
          npc: {
            speaker: "Léa",
            kana: "On va au restaurant ce soir ?",
            audioText: "on va au restaurant ce soir ?",
            gloss: "Shall we go to the restaurant tonight?",
          },
          goal: "Seal the week.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "quoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
      ],
    },
    build(
      "fr-m8-9-build-garedemain",
      "Build: 'shall we go to the station tomorrow?'",
      "on va à la gare demain ?",
      ["on va", "à la", "gare", "demain ?", "au"],
      ["on va", "à la", "gare", "demain ?"],
    ),
    listeningCompSentence({
      id: "fr-m8-9-lc-aujsamedi",
      audioText: "aujourd'hui c'est samedi",
      correctMeaningEn: "Today is Saturday.",
      distractorsEn: ["Today is Sunday.", "It's Friday.", "Tomorrow is Saturday."],
    }),
    // Sunday's beach, from memory (voiced L6).
    speaking(
      "fr-m8-9-speak-plagedimanche-recall",
      "on va à la plage dimanche ?",
      "shall we go to the beach on Sunday?",
      [],
      "recall",
    ),
    cloze(
      "fr-m8-9-cloze-vendredi",
      "on va au cinéma",
      "?",
      "vendredi",
      ["vendredi", "ce soir"],
      "shall we go to the movies on FRIDAY?",
      "on va au cinéma vendredi ?",
      "«vendredi» pins it to the calendar; «ce soir» couldn't wait.",
    ),
    listeningCompSentence({
      id: "fr-m8-9-lc-samedi2",
      audioText: "c'est samedi",
      correctMeaningEn: "It's Saturday.",
      distractorsEn: ["It's Sunday.", "It's Thursday.", "It's Monday."],
    }),
    listeningBuildSentence({
      id: "fr-m8-9-lbuild-mardi",
      target: "aujourd'hui c'est mardi",
      tiles: ["aujourd'hui", "c'est", "mardi", "mercredi"],
      correctOrder: ["aujourd'hui", "c'est", "mardi"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m8-9-mc-demain", "demain", ["aujourd'hui", "ce soir", "ici"]),
    {
      id: "fr-m8-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-mercredi", source: "mercredi", target: "Wednesday" },
        { id: "p-vendredi", source: "vendredi", target: "Friday" },
        { id: "p-quand", source: "c'est quand ?", target: "when is it?" },
        { id: "p-aujourdhui", source: "aujourd'hui", target: "today" },
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-dix", source: "dix", target: "ten" },
      ],
    },
    // WIN: the day of rest, from memory.
    speaking(
      "fr-m8-9-speak-dimanche-recall",
      "aujourd'hui c'est dimanche",
      "today is Sunday",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends on «Dimanche soir» —
 *  next week, booked. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m8-10-lc-aujlundi",
      audioText: "aujourd'hui c'est lundi",
      correctMeaningEn: "Today is Monday.",
      distractorsEn: ["Today is Tuesday.", "Tomorrow is Monday.", "It's Sunday."],
    }),
    build(
      "fr-m8-10-build-ecolelundi",
      "Build: 'I'm going to school on Monday'",
      "je vais à l'école lundi",
      ["je vais", "à", "l'école", "lundi", "dimanche"],
      ["je vais", "à", "l'école", "lundi"],
      undefined,
      ["lundi je vais à l'école"],
    ),
    cloze(
      "fr-m8-10-cloze-seq5",
      "lundi,",
      "",
      "mardi",
      ["mardi", "mercredi"],
      "Monday, …?",
      "lundi, mardi",
      "One rung at a time — mardi is second.",
    ),
    speaking(
      "fr-m8-10-speak-week-recall",
      "lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche",
      "the days of the week",
      [],
      "recall",
    ),
    vocabTextMcq("fr-m8-10-mc-quand", "c'est quand ?", ["c'est quoi ?", "tu vas où ?", "et toi ?"]),
    listeningCompSentence({
      id: "fr-m8-10-lc-ousamedi2",
      audioText: "tu vas où samedi ?",
      correctMeaningEn: "Where are you going on Saturday?",
      distractorsEn: [
        "Where are you going on Sunday?",
        "Shall we go to the beach on Saturday?",
        "Where are you from?",
      ],
    }),
    cloze(
      "fr-m8-10-cloze-dimanche",
      "c'est",
      "",
      "dimanche",
      ["dimanche", "samedi"],
      "it's SUNDAY",
      "c'est dimanche",
      "dee-MAHNSH — the day that broke the -di rule.",
    ),
    build(
      "fr-m8-10-build-restovendredi",
      "Build: 'shall we go to the restaurant on Friday?'",
      "on va au restaurant vendredi ?",
      ["on va", "au", "restaurant", "vendredi ?", "ce soir ?"],
      ["on va", "au", "restaurant", "vendredi ?"],
    ),
    listeningCompSentence({
      id: "fr-m8-10-lc-mardi2",
      audioText: "c'est mardi",
      correctMeaningEn: "It's Tuesday.",
      distractorsEn: ["It's Wednesday.", "It's Thursday.", "It's Friday."],
    }),
    speaking("fr-m8-10-speak-quand-recall", "c'est quand ?", "when is it?", [], "recall"),
    cloze(
      "fr-m8-10-cloze-aujmercredi",
      "aujourd'hui c'est",
      "",
      "mercredi",
      ["mercredi", "jeudi"],
      "today is WEDNESDAY",
      "aujourd'hui c'est mercredi",
      "The long one — mair-kruh-DEE — right in the middle of the week.",
    ),
    {
      id: "fr-m8-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jeudi", source: "jeudi", target: "Thursday" },
        { id: "p-samedi", source: "samedi", target: "Saturday" },
        { id: "p-aujourdhui", source: "aujourd'hui", target: "today" },
        { id: "p-quand", source: "c'est quand ?", target: "when is it?" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    {
      // THE MODULE ENDS ON DIMANCHE SOIR — next week, booked.
      id: "fr-m8-10-sim-dimanchesoir",
      type: "dialogue_sim",
      scene: {
        emoji: "📅",
        title: "Dimanche soir — next week, booked",
        setting: "The gang, a calendar, and you holding the pen.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: seven days, your plans pinned to them, and a week that answers «c'est quand ?». Module 9: describe it all — grand, petite, and the sound of agreement.",
      turns: [
        {
          id: "t1-lundi",
          npc: {
            speaker: "Louis",
            kana: "Tu vas où lundi ?",
            audioText: "tu vas où lundi ?",
            gloss: "Where are you going on Monday?",
          },
          goal: "School — tell him.",
          reply: {
            mode: "build",
            tiles: ["je vais", "à", "l'école", "au"],
            answer: "je vais à l'école",
            audioText: "je vais à l'école",
          },
          replyGloss: "I'm going to school.",
        },
        {
          id: "t2-mardi",
          npc: {
            speaker: "Louis",
            kana: "On va au café mardi ?",
            audioText: "on va au café mardi ?",
            gloss: "Shall we get a coffee on Tuesday?",
          },
          goal: "Deal!",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
        {
          id: "t3-cinema",
          npc: {
            speaker: "Léa",
            kana: "Et le cinéma, c'est quand ?",
            audioText: "et le cinéma c'est quand ?",
            gloss: "And the movies — when?",
          },
          goal: "Friday — tell her.",
          reply: {
            mode: "choice",
            options: [
              { id: "vendredi", text: "vendredi" },
              { id: "jeudi", text: "jeudi" },
              { id: "aujourdhui", text: "aujourd'hui" },
            ],
            correctOptionId: "vendredi",
            audioText: "vendredi",
          },
          replyGloss: "Friday.",
        },
        {
          id: "t4-bye",
          npc: {
            speaker: "Léa",
            kana: "Bonne nuit ! À demain.",
            audioText: "à demain",
            gloss: "Good night! See you tomorrow.",
          },
          goal: "Send them off.",
          reply: {
            mode: "choice",
            options: [
              { id: "bonnenuit", text: "bonne nuit" },
              { id: "abientot", text: "à bientôt" },
              { id: "quoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "bonnenuit",
            alsoCorrectOptionIds: ["abientot"],
            audioText: "bonne nuit",
          },
          replyGloss: "Good night!",
        },
      ],
    },
  ];
}

const FR_M8_1: LessonContent = {
  id: "fr-m8-1",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The week begins",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M8_2: LessonContent = {
  id: "fr-m8-2",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Point at the calendar",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M8_3: LessonContent = {
  id: "fr-m8-3",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The good ones",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M8_4: LessonContent = {
  id: "fr-m8-4",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Seven in a row",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M8_5: LessonContent = {
  id: "fr-m8-5",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Plans meet the calendar",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M8_6: LessonContent = {
  id: "fr-m8-6",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La semaine de Sam",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M8_7: LessonContent = {
  id: "fr-m8-7",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The ladder, from memory",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M8_8: LessonContent = {
  id: "fr-m8-8",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the grand plan",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M8_9: LessonContent = {
  id: "fr-m8-9",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le grand plan",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M8_10: LessonContent = {
  id: "fr-m8-10",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — book next week",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M8_MODULE: FrModuleDef = {
  title: "La semaine — days & when",
  eyebrow: "Module 8",
  summary:
    "Seven days, one question — «C'est quand ?» — and every m5 plan pinned to a date: «On va à la plage samedi ?»",
  lessons: [
    FR_M8_1,
    FR_M8_2,
    FR_M8_3,
    FR_M8_4,
    FR_M8_5,
    FR_M8_6,
    FR_M8_7,
    FR_M8_8,
    FR_M8_9,
    FR_M8_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M8_CHECKPOINT_INDEX = 8;

export const FR_M8_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m8-s",
    moduleId: "m8",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m8-s",
        prompt: "Complete the ladder: «lundi, mardi, ___».",
        correctText: "mercredi",
        distractorsText: ["jeudi", "samedi", "dimanche"],
      }),
  },
  {
    id: "pt-fr-m8-1",
    moduleId: "m8",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m8-1",
        prompt: "'Today is Friday' — pick the French.",
        correctText: "aujourd'hui c'est vendredi",
        distractorsText: [
          "demain c'est vendredi",
          "aujourd'hui c'est jeudi",
          "vendredi c'est aujourd'hui ?",
        ],
      }),
  },
  {
    id: "pt-fr-m8-2",
    moduleId: "m8",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m8-2",
        prompt: "A friend announces a plan. Ask WHEN.",
        correctText: "c'est quand ?",
        distractorsText: ["c'est quoi ?", "tu vas où ?", "tu es d'où ?"],
      }),
  },
  {
    id: "pt-fr-m8-3",
    moduleId: "m8",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m8-3",
        prompt: "'Shall we go to the beach on Saturday?' — pick the French.",
        correctText: "on va à la plage samedi ?",
        distractorsText: [
          "on va à la plage aujourd'hui",
          "tu vas à la plage samedi",
          "on va au plage samedi ?",
        ],
      }),
  },
  {
    id: "pt-fr-m8-4",
    moduleId: "m8",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m8-4",
        prompt: "Pick the day WITHOUT the -di ending.",
        correctText: "dimanche",
        distractorsText: ["samedi", "mardi", "jeudi"],
      }),
  },
];
