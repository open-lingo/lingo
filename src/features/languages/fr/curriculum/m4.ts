/**
 * m4.ts — En ville — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01, straight after m3 in the same wave. No m4 spine
 * exists in any doc, so this module DESIGNS it (coordinator dispatch):
 *   - It cashes m3's forward promise ("taking all of it out into the
 *     town") and finally delivers the existence beat m3 deferred from the
 *     ES m3 spine: «il y a» (ES «hay»), plus its shadow «il n'y a pas
 *     de …» (the ES "find the keys / something ISN'T there" lesson).
 *   - «Où est … ?» + «ici» / «là-bas» is the town's second machine — the
 *     tourist survival question and its one-word answers.
 *   - THE ELISION BEAT lands here, as its own lesson (L3 "The squeeze"):
 *     m3 deliberately kept every noun consonant-initial; m4 debuts
 *     «l'école» (f) and «l'hôtel» (m, mute h) with a real §13 teaching
 *     beat — callback chain d'où → j'aime → n'aime → l', plus the
 *     un/une gender-reveal trick («l'» hides the side; «une école»
 *     gives it away). h aspiré has NO m4 word: the F3 aspiré-vs-mute
 *     contrast is deferred until the first aspiré atom exists (flagged).
 *   - No aller/«au» contraction (m2 L9's «On va au cinéma ?» tease):
 *     verb movement + à-contractions are a full system and would blow
 *     the §13.9 density budget — deferred to a later module, flagged.
 *   - «il n'y a pas de» is taught as a CHUNK (the «je ne comprends pas»
 *     / «je n'aime pas» precedent). INVENTORY RULE: the chunk ends in
 *     «de», so it is only ever followed by CONSONANT-initial nouns —
 *     «pas d'école» would need d'-elision the course hasn't taught, and
 *     the tile validator cannot see inside a multi-word tile.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   la ville L1 · il y a un café L1 · où est la gare ? L2 · là-bas L2 ·
 *   où est le musée ? L2 · l'école L3 · l'hôtel L3 · j'aime l'école L3 ·
 *   il n'y a pas de café L4 · il y a un parc ici L4 · le restaurant L5 ·
 *   j'aime la plage L5 · l'hôtel est là-bas L6 · il y a une plage là-bas L7
 *   recalls drawn: il y a un café L3 · là-bas L4 · l'école L5 ·
 *   où est la gare ? L6 · il n'y a pas de café L6 · l'hôtel est là-bas L7 ·
 *   la ville cp · il y a un parc ici cp · l'hôtel cp · j'aime la plage L9 ·
 *   il y a une plage là-bas L9 · le restaurant L10 · l'école L10
 *   cross-module: merci beaucoup L2 (m1) · j'aime le cinéma L1 (m3) ·
 *   c'est une glace L7 (m3).
 *
 * Cast continuity: Hugo new-in-town (L2), Emma coffee-less (L4), Chloé
 * weekend plans (L5) and the final tour (L10), Inès the beach dreamer
 * (L7), a madame at the corner (L6), Louis visits (L9).
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


export const FR_M4_ATOMS: FrAtom[] = [
  atom({ surface: "il y a", meaningEn: "there is / there are", partOfSpeech: "phrase", fromModule: "m4", kind: "phrase", hint: "eel-YA — three words, one smooth sound" }),
  atom({ surface: "il n'y a pas de", meaningEn: "there's no …", partOfSpeech: "phrase", fromModule: "m4", kind: "phrase", hint: "eel nya pah duh — il y a's shadow; the same n' squeeze as n'aime" }),
  atom({ surface: "où est", meaningEn: "where is", partOfSpeech: "phrase", fromModule: "m4", kind: "phrase", hint: "oo-EH — the tourist's best two words" }),
  atom({ surface: "ici", meaningEn: "here", partOfSpeech: "adverb", fromModule: "m4", kind: "vocab", hint: "ee-SEE" }),
  atom({ surface: "là-bas", meaningEn: "over there", partOfSpeech: "adverb", fromModule: "m4", kind: "vocab", hint: "la-BAH — point while you say it" }),
  atom({ surface: "ville", meaningEn: "town / city", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "f", emoji: "🏙️", hint: "veel" }),
  atom({ surface: "gare", meaningEn: "train station", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "f", emoji: "🚉", hint: "gar" }),
  atom({ surface: "parc", meaningEn: "park", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🌳", hint: "park — for once, the last letter IS spoken" }),
  atom({ surface: "musée", meaningEn: "museum", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🏛️", hint: "mu-ZAY — ends like a pink-f word but lives on the blue-m side" }),
  atom({ surface: "école", meaningEn: "school", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "f", emoji: "🏫", hint: "ay-KOHL — vowel start, so le/la squeeze to l'" }),
  atom({ surface: "hôtel", meaningEn: "hotel", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🏨", hint: "oh-TELL — the h is silent, so the article squeezes: l'hôtel" }),
  atom({ surface: "restaurant", meaningEn: "restaurant", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🍽️", hint: "res-toh-RAHN — the final t sleeps" }),
  atom({ surface: "plage", meaningEn: "beach", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "f", emoji: "🏖️", hint: "plazh — one syllable of vacation" }),
];

/** L1 — «il y a»: the town appears. Three place debuts and the
 *  existence machine. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m4-1-info-ilya",
      "Say what's there",
      "Module 3 ended with a promise: out into the town. Here's the key to it — «il y a» — there is / there are (eel-YA, three words melted into one sound). «Il y a un parc» — there's a park. Point it at «la ville» — the town — and it describes everything in sight.",
      "grammar",
    ),
    vocabMcq(
      "fr-m4-1-img-ville",
      { surface: "ville", meaningEn: "the town", emoji: "🏙️" },
      [
        { surface: "maison", emoji: "🏠" },
        { surface: "cinéma", emoji: "🎬" },
        { surface: "café", emoji: "☕" },
      ],
    ),
    speaking("fr-m4-1-speak-laville", "la ville", "the town", []),
    vocabMcq(
      "fr-m4-1-img-parc",
      { surface: "parc", meaningEn: "the park", emoji: "🌳" },
      [
        { surface: "ville", emoji: "🏙️" },
        { surface: "gare", emoji: "🚉" },
        { surface: "maison", emoji: "🏠" },
      ],
    ),
    {
      id: "fr-m4-1-map-ilyaunparc",
      type: "word_map",
      tokens: ["il y a", "un", "parc"],
      pairs: [
        { en: "there is", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "park", tokenIndex: 2 },
      ],
      audioText: "il y a un parc",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«il y a» never changes shape — there is, there are, one phrase for both. The un/une after it still obeys the sides.",
    },
    listeningCompSentence({
      id: "fr-m4-1-lc-ilyaunparc",
      audioText: "il y a un parc",
      correctMeaningEn: "There's a park.",
      distractorsEn: ["There's a station.", "Where is the park?", "It's Hugo's park."],
    }),
    {
      // TAIL: m3 by ear.
      id: "fr-m4-1-hear-lechocolat",
      type: "word_image_mcq",
      meaningEn: "le chocolat",
      options: [
        { id: "correct", word: "le chocolat", emoji: "🍫" },
        { id: "o1", word: "le thé", emoji: "🍵" },
        { id: "o2", word: "la glace", emoji: "🍨" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m3 tastes lane, from memory.
    speaking(
      "fr-m4-1-speak-cinema-recall",
      "j'aime le cinéma",
      "I like the movies",
      [],
      "recall",
    ),
    vocabMcq(
      "fr-m4-1-img-gare",
      { surface: "gare", meaningEn: "the train station", emoji: "🚉" },
      [
        { surface: "ville", emoji: "🏙️" },
        { surface: "parc", emoji: "🌳" },
        { surface: "cinéma", emoji: "🎬" },
      ],
    ),
    cloze(
      "fr-m4-1-cloze-une",
      "il y a",
      "gare",
      "une",
      ["une", "un"],
      "there's a station",
      "il y a une gare",
      "«gare» is a pink-f word — «une», even inside «il y a».",
    ),
    build(
      "fr-m4-1-build-ilyauncafe",
      "Build: 'there's a café'",
      "il y a un café",
      ["il y a", "un", "café", "une", "la"],
      ["il y a", "un", "café"],
    ),
    {
      id: "fr-m4-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ville", source: "ville", target: "town / city" },
        { id: "p-parc", source: "parc", target: "park" },
        { id: "p-gare", source: "gare", target: "train station" },
        { id: "p-ilya", source: "il y a", target: "there is / there are" },
        { id: "p-cafe", source: "café", target: "coffee" },
        { id: "p-jaime", source: "j'aime", target: "I like / I love" },
      ],
    },
    // WIN: your first town fact — printed first voicing.
    speaking("fr-m4-1-speak-ilyauncafe", "il y a un café", "there's a café", []),
  ];
}

/** L2 — «Où est … ?» and its one-word answers. Hugo is new in town;
 *  the museum debuts. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m4-2-info-ouest",
      "Where is it?",
      "«Où est la gare ?» — where is the station? (oo-EH). The answer can be a single word: «ici» — here (ee-SEE) — or «là-bas» — over there (la-BAH, best said while pointing). Two words in, one word out: the whole art of asking directions.",
      "grammar",
    ),
    {
      id: "fr-m4-2-map-ouestlagare",
      type: "word_map",
      tokens: ["où est", "la", "gare"],
      pairs: [
        { en: "where is", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "station", tokenIndex: 2 },
      ],
      audioText: "où est la gare ?",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote:
        "«où est» + any place you know = a question. The voice rises, the chin points, France answers.",
    },
    speaking("fr-m4-2-speak-ouestlagare", "où est la gare ?", "where is the station?", []),
    {
      id: "fr-m4-2-sim-hugo",
      type: "dialogue_sim",
      scene: {
        emoji: "🌳",
        title: "Hugo, new in town",
        setting: "He's looking for the park. You can see it from here.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-parc",
          npc: {
            speaker: "Hugo",
            kana: "Où est le parc ?",
            audioText: "où est le parc ?",
            gloss: "Where's the park?",
          },
          goal: "It's over there — point.",
          reply: {
            mode: "choice",
            options: [
              { id: "labas", text: "là-bas" },
              { id: "ici", text: "ici" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "labas",
            audioText: "là-bas",
          },
          replyGloss: "Over there.",
          explanation:
            "«là-bas» — over there, with a point of the chin. «ici» would mean you're both standing in it.",
        },
      ],
    },
    speaking("fr-m4-2-speak-labas", "là-bas", "over there", []),
    vocabMcq(
      "fr-m4-2-img-musee",
      { surface: "musée", meaningEn: "the museum", emoji: "🏛️" },
      [
        { surface: "gare", emoji: "🚉" },
        { surface: "parc", emoji: "🌳" },
        { surface: "cinéma", emoji: "🎬" },
      ],
    ),
    listeningCompSentence({
      id: "fr-m4-2-lc-ouestlemusee",
      audioText: "où est le musée ?",
      correctMeaningEn: "Where is the museum?",
      distractorsEn: ["Where is the station?", "There's a museum.", "It's the museum."],
    }),
    // TAIL: m1 courtesy lane, from memory.
    speaking(
      "fr-m4-2-speak-mercibeaucoup-recall",
      "merci beaucoup",
      "thank you very much",
      [],
      "recall",
    ),
    listeningCompSentence({
      // «ici» gets its own isolated ear beat (the m2 «il» precedent).
      id: "fr-m4-2-lc-ici",
      audioText: "ici",
      correctMeaningEn: "Here",
      distractorsEn: ["Over there", "There is", "And you?"],
    }),
    cloze(
      "fr-m4-2-cloze-la",
      "où est",
      "gare ?",
      "la",
      ["la", "le"],
      "where is the station?",
      "où est la gare ?",
      "«gare» keeps its pink-f side inside questions too.",
    ),
    build(
      "fr-m4-2-build-ouestleparc",
      "Build: 'where is the park?'",
      "où est le parc ?",
      ["où est", "le", "parc ?", "la", "il y a"],
      ["où est", "le", "parc ?"],
    ),
    {
      id: "fr-m4-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ouest", source: "où est", target: "where is" },
        { id: "p-ici", source: "ici", target: "here" },
        { id: "p-labas", source: "là-bas", target: "over there" },
        { id: "p-musee", source: "musée", target: "museum" },
        { id: "p-bonjour", source: "bonjour", target: "hello" },
        { id: "p-cestquoi", source: "c'est quoi ?", target: "what is that?" },
      ],
    },
    // WIN: ask after the new place — printed first voicing.
    speaking("fr-m4-2-speak-ouestlemusee", "où est le musée ?", "where is the museum?", []),
  ];
}

/** L3 — THE SQUEEZE: le/la become l' before a vowel. école (f) and
 *  hôtel (m, mute h) debut; «une école» is the gender reveal. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m4-3-info-squeeze",
      "The squeeze",
      "Some words open with a vowel, and le/la can't stand next to one — they squeeze to «l'»: «l'école» — the school. You know this move: d'où, j'aime, n'aime. It even swallows a silent h: «l'hôtel» — the hotel (oh-TELL). One catch: «l'» hides the word's side — but «une école» and «un hôtel» give the secret away.",
      "grammar",
    ),
    vocabMcq(
      "fr-m4-3-img-ecole",
      { surface: "école", meaningEn: "the school", emoji: "🏫" },
      [
        { surface: "gare", emoji: "🚉" },
        { surface: "musée", emoji: "🏛️" },
        { surface: "maison", emoji: "🏠" },
      ],
    ),
    speaking("fr-m4-3-speak-lecole", "l'école", "the school", []),
    {
      id: "fr-m4-3-map-cestlecole",
      type: "word_map",
      tokens: ["c'est", "l'école"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "the school", tokenIndex: 1 },
      ],
      audioText: "c'est l'école",
      tokenGenders: { 1: "f" },
      revealNote:
        "«le» or «la»? You can't tell from «l'» — but the chip glows pink: école is a la-word, and «une école» proves it out loud.",
    },
    vocabMcq(
      "fr-m4-3-img-hotel",
      { surface: "hôtel", meaningEn: "the hotel", emoji: "🏨" },
      [
        { surface: "école", emoji: "🏫" },
        { surface: "gare", emoji: "🚉" },
        { surface: "maison", emoji: "🏠" },
      ],
    ),
    speaking("fr-m4-3-speak-lhotel", "l'hôtel", "the hotel", []),
    cloze(
      // The gender reveal: l' hid the side, un/une shows it.
      "fr-m4-3-cloze-une",
      "c'est",
      "école",
      "une",
      ["une", "un"],
      "it's a school",
      "c'est une école",
      "«l'» hid the side — «une» shows it. École is pink-f.",
    ),
    {
      id: "fr-m4-3-hear-lhotel",
      type: "word_image_mcq",
      meaningEn: "l'hôtel",
      options: [
        { id: "correct", word: "l'hôtel", emoji: "🏨" },
        { id: "o1", word: "l'école", emoji: "🏫" },
        { id: "o2", word: "la gare", emoji: "🚉" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1's win, from memory.
    speaking("fr-m4-3-speak-ilyauncafe-recall", "il y a un café", "there's a café", [], "recall"),
    cloze(
      "fr-m4-3-cloze-un",
      "c'est",
      "hôtel",
      "un",
      ["un", "une"],
      "it's a hotel",
      "c'est un hôtel",
      "Blue-m behind the squeeze: «un hôtel» — the silent h steps aside for the sound.",
    ),
    build(
      "fr-m4-3-build-lecoledelea",
      "Build: 'it's Léa's school'",
      "c'est l'école de Léa",
      ["c'est", "l'école", "de", "Léa", "la"],
      ["c'est", "l'école", "de", "Léa"],
    ),
    listeningCompSentence({
      // TAIL: m3 dislike lane, away from its source.
      id: "fr-m4-3-lc-jenaimepas",
      audioText: "je n'aime pas le café",
      correctMeaningEn: "I don't like coffee.",
      distractorsEn: ["I like coffee.", "There's no café.", "I don't understand."],
    }),
    {
      id: "fr-m4-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ecole", source: "école", target: "school" },
        { id: "p-hotel", source: "hôtel", target: "hotel" },
        { id: "p-ilya", source: "il y a", target: "there is / there are" },
        { id: "p-une", source: "une", target: "a (pink-f side)" },
        { id: "p-madame", source: "madame", target: "ma'am / Mrs." },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: the squeeze meets m3's verb — printed first voicing.
    speaking("fr-m4-3-speak-jaimelecole", "j'aime l'école", "I like school", []),
  ];
}

/** L4 — «il n'y a pas de …»: existence's shadow. The like/there-is ear
 *  lane opens on alternating answers. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m4-4-info-pasde",
      "Say what's missing",
      "«Il n'y a pas de café» — there's no café (eel nya pah duh). It's «il y a» wearing the n' squeeze you know from «n'aime» — and after «pas», the article steps aside: bare «de», no le or la. Sad news, delivered fluently.",
      "grammar",
    ),
    {
      id: "fr-m4-4-map-pasdecafe",
      type: "word_map",
      tokens: ["il n'y a pas de", "café"],
      pairs: [
        { en: "there's no", tokenIndex: 0 },
        { en: "café", tokenIndex: 1 },
      ],
      audioText: "il n'y a pas de café",
      tokenGenders: { 1: "m" },
      revealNote:
        "One chunk does all the work — «il n'y a pas de» + the thing that's missing. The article stays home.",
    },
    speaking(
      "fr-m4-4-speak-pasdecafe",
      "il n'y a pas de café",
      "there's no café",
      [],
    ),
    listeningCompSentence({
      // Discrimination lane, trial 1 — answer THERE IS (§13.9 law 4).
      id: "fr-m4-4-lc-ilyauncafe",
      audioText: "il y a un café",
      correctMeaningEn: "There IS a café.",
      distractorsEn: ["There's no café.", "Where is the café?", "I like coffee."],
    }),
    {
      // The sim traps the lesson's own contrast.
      id: "fr-m4-4-sim-emma",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Emma, hopeful",
        setting: "New neighborhood — no coffee in sight.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cafe",
          npc: {
            speaker: "Emma",
            kana: "Il y a un café ici ?",
            audioText: "il y a un café ici ?",
            gloss: "Is there a café here?",
          },
          goal: "There isn't — break it to her.",
          reply: {
            mode: "choice",
            options: [
              { id: "pasde", text: "il n'y a pas de café" },
              { id: "ilya", text: "il y a un café" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "pasde",
            audioText: "il n'y a pas de café",
          },
          replyGloss: "There's no café.",
          explanation:
            "«il n'y a pas de…» — existence's shadow. Emma will survive. Probably.",
        },
      ],
    },
    // TAIL: L2's pointing word, from memory.
    speaking("fr-m4-4-speak-labas-recall", "là-bas", "over there", [], "recall"),
    cloze(
      "fr-m4-4-cloze-de",
      "il n'y a pas",
      "café",
      "de",
      ["de", "le"],
      "there's no café",
      "il n'y a pas de café",
      "After «pas», the article steps aside — bare «de».",
    ),
    {
      // L1 word by ear.
      id: "fr-m4-4-hear-laville",
      type: "word_image_mcq",
      meaningEn: "la ville",
      options: [
        { id: "correct", word: "la ville", emoji: "🏙️" },
        { id: "o1", word: "la gare", emoji: "🚉" },
        { id: "o2", word: "le parc", emoji: "🌳" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      // Discrimination lane, trial 2 — answer THERE'S NO (alternation).
      id: "fr-m4-4-lc-pasdegare",
      audioText: "il n'y a pas de gare",
      correctMeaningEn: "There's no station.",
      distractorsEn: ["There is a station.", "Where is the station?", "There's no park."],
    }),
    build(
      "fr-m4-4-build-pasdeparc",
      "Build: 'there's no park here'",
      "il n'y a pas de parc ici",
      ["il n'y a pas de", "parc", "ici", "il y a"],
      ["il n'y a pas de", "parc", "ici"],
    ),
    vocabTextMcq("fr-m4-4-mc-chocolat", "chocolat", ["thé", "glace", "pizza"]),
    {
      id: "fr-m4-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-pasde", source: "il n'y a pas de", target: "there's no …" },
        { id: "p-ville", source: "ville", target: "town / city" },
        { id: "p-gare", source: "gare", target: "train station" },
        { id: "p-jenaimepas", source: "je n'aime pas", target: "I don't like" },
        { id: "p-bonnenuit", source: "bonne nuit", target: "good night" },
        { id: "p-quatre", source: "quatre", target: "four" },
      ],
    },
    // WIN: good news for balance — printed first voicing.
    speaking("fr-m4-4-speak-ilyaunparcici", "il y a un parc ici", "there's a park here", []),
  ];
}

/** L5 — Dream town: restaurant and beach debut; existence meets the
 *  m3 tastes. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m4-5-info-dream",
      "Two places worth walking to",
      "«le restaurant» (res-toh-RAHN — that final t sleeps, like chat's) and «la plage» — the beach (plazh). A town with both is a town worth describing.",
      "grammar",
    ),
    vocabMcq(
      "fr-m4-5-img-restaurant",
      { surface: "restaurant", meaningEn: "the restaurant", emoji: "🍽️" },
      [
        { surface: "café", emoji: "☕" },
        { surface: "hôtel", emoji: "🏨" },
        { surface: "musée", emoji: "🏛️" },
      ],
    ),
    speaking("fr-m4-5-speak-lerestaurant", "le restaurant", "the restaurant", []),
    vocabMcq(
      "fr-m4-5-img-plage",
      { surface: "plage", meaningEn: "the beach", emoji: "🏖️" },
      [
        { surface: "gare", emoji: "🚉" },
        { surface: "ville", emoji: "🏙️" },
        { surface: "parc", emoji: "🌳" },
      ],
    ),
    {
      id: "fr-m4-5-map-ilyauneplage",
      type: "word_map",
      tokens: ["il y a", "une", "plage"],
      pairs: [
        { en: "there is", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "beach", tokenIndex: 2 },
      ],
      audioText: "il y a une plage",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote:
        "«il y a» plus a dream. The whole town-describing machine in three chips.",
    },
    {
      id: "fr-m4-5-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🚌",
        title: "Chloé, planning the weekend",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-plage",
          npc: {
            speaker: "Chloé",
            kana: "Tu aimes la plage ?",
            audioText: "tu aimes la plage ?",
            gloss: "Do you like the beach?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime la plage" },
              { id: "tuaimes", text: "oui tu aimes la plage" },
              { id: "pasde", text: "il n'y a pas de plage" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime la plage",
          },
          replyGloss: "Yes, I love the beach.",
          explanation:
            "Her «tu aimes», your «j'aime» — module 3's flip, now with sand.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m4-5-lc-restaurantici",
      audioText: "il y a un restaurant ici",
      correctMeaningEn: "There's a restaurant here.",
      distractorsEn: ["There's no restaurant.", "Where is the restaurant?", "It's Léa's restaurant."],
    }),
    // TAIL: the squeeze, from memory (voiced L3).
    speaking("fr-m4-5-speak-lecole-recall", "l'école", "the school", [], "recall"),
    cloze(
      "fr-m4-5-cloze-la",
      "où est",
      "plage ?",
      "la",
      ["la", "le"],
      "where is the beach?",
      "où est la plage ?",
      "«plage» — pink-f, so «la», even mid-question.",
    ),
    build(
      "fr-m4-5-build-plagelabas",
      "Build: 'there's a beach over there'",
      "il y a une plage là-bas",
      ["il y a", "une", "plage", "là-bas", "le"],
      ["il y a", "une", "plage", "là-bas"],
    ),
    {
      // TAIL: m3 by ear.
      id: "fr-m4-5-hear-lamusique",
      type: "word_image_mcq",
      meaningEn: "la musique",
      options: [
        { id: "correct", word: "la musique", emoji: "🎵" },
        { id: "o1", word: "le cinéma", emoji: "🎬" },
        { id: "o2", word: "la glace", emoji: "🍨" },
      ],
      correctOptionId: "correct",
    },
    {
      id: "fr-m4-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-restaurant", source: "restaurant", target: "restaurant" },
        { id: "p-plage", source: "plage", target: "beach" },
        { id: "p-labas", source: "là-bas", target: "over there" },
        { id: "p-moiaussi", source: "moi aussi", target: "me too" },
        { id: "p-etudiante", source: "étudiante", target: "student (f)" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: say the taste out loud — printed first voicing.
    speaking("fr-m4-5-speak-jaimelaplage", "j'aime la plage", "I love the beach", []),
  ];
}

/** L6 — Ask a stranger: pardon + où est, the full tourist exchange.
 *  Zero new words. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m4-6-sim-madame",
      type: "dialogue_sim",
      scene: {
        emoji: "🕰️",
        title: "A madame at the corner",
        setting: "You're lost. She isn't.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ask",
          npc: {
            speaker: "The madame",
            kana: "Bonjour !",
            audioText: "bonjour",
            gloss: "Hello!",
          },
          goal: "Ask where the station is — politely.",
          reply: {
            mode: "build",
            tiles: ["pardon", "où est", "la", "gare ?", "le"],
            answer: "pardon où est la gare ?",
            alsoAccepted: ["où est la gare ?"],
            audioText: "pardon où est la gare ?",
          },
          replyGloss: "Excuse me — where is the station?",
          explanation:
            "«pardon» opens doors before questions — the m1 word doing m4 work.",
        },
        {
          id: "t2-answer",
          npc: {
            speaker: "The madame",
            kana: "Là-bas !",
            audioText: "là-bas",
            gloss: "Over there!",
          },
          goal: "Thank her.",
          reply: {
            mode: "choice",
            options: [
              { id: "mercibeaucoup", text: "merci beaucoup" },
              { id: "pardon", text: "pardon" },
              { id: "ettoi", text: "et toi ?" },
            ],
            correctOptionId: "mercibeaucoup",
            audioText: "merci beaucoup",
          },
          replyGloss: "Thank you very much!",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m4-6-lc-ouestlecole",
      audioText: "où est l'école ?",
      correctMeaningEn: "Where is the school?",
      distractorsEn: ["Where is the hotel?", "There's a school.", "It's Léa's school."],
    }),
    // The question you just built, from memory (voiced L2).
    speaking(
      "fr-m4-6-speak-ouestlagare-recall",
      "où est la gare ?",
      "where is the station?",
      [],
      "recall",
    ),
    cloze(
      "fr-m4-6-cloze-de",
      "il n'y a pas",
      "musée",
      "de",
      ["de", "le"],
      "there's no museum",
      "il n'y a pas de musée",
      "Still bare «de» after «pas» — the rule holds for every place.",
    ),
    {
      id: "fr-m4-6-map-lhotelestlabas",
      type: "word_map",
      tokens: ["l'hôtel", "est", "là-bas"],
      pairs: [
        { en: "the hotel", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "over there", tokenIndex: 2 },
      ],
      audioText: "l'hôtel est là-bas",
      tokenGenders: { 0: "m" },
      revealNote:
        "Answering like a local: name the place, «est», point the word. The m2 «est» carries the whole town.",
    },
    {
      id: "fr-m4-6-hear-lecole",
      type: "word_image_mcq",
      meaningEn: "l'école",
      options: [
        { id: "correct", word: "l'école", emoji: "🏫" },
        { id: "o1", word: "l'hôtel", emoji: "🏨" },
        { id: "o2", word: "la plage", emoji: "🏖️" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "fr-m4-6-speak-lhotelestlabas",
      "l'hôtel est là-bas",
      "the hotel is over there",
      [],
    ),
    listeningCompSentence({
      id: "fr-m4-6-lc-ecoleici",
      audioText: "il y a une école ici",
      correctMeaningEn: "There's a school here.",
      distractorsEn: ["There's no school.", "Where is the school?", "It's Léa's school."],
    }),
    build(
      "fr-m4-6-build-restaurantdehugo",
      "Build: 'it's Hugo's restaurant'",
      "c'est le restaurant de Hugo",
      ["c'est", "le", "restaurant", "de", "Hugo", "une"],
      ["c'est", "le", "restaurant", "de", "Hugo"],
    ),
    vocabTextMcq("fr-m4-6-mc-musee", "musée", ["gare", "parc", "ville"]),
    {
      id: "fr-m4-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ouest", source: "où est", target: "where is" },
        { id: "p-ici", source: "ici", target: "here" },
        { id: "p-hotel", source: "hôtel", target: "hotel" },
        { id: "p-pardon", source: "pardon", target: "excuse me / sorry" },
        { id: "p-cest", source: "c'est", target: "it's / this is" },
        { id: "p-deux", source: "deux", target: "two" },
      ],
    },
    // WIN: the sad news, fluently, from memory (voiced L4).
    speaking(
      "fr-m4-6-speak-pasdecafe-recall",
      "il n'y a pas de café",
      "there's no café",
      [],
      "recall",
    ),
  ];
}

/** L7 — Your whole town: zero new words, the eight-place gender sort,
 *  every machine running at once. */
function lesson7(): LessonStep[] {
  return [
    genderSort({
      id: "fr-m4-7-sort",
      prompt: "Eight places, two sides — sort your town.",
      buckets: [
        { id: "m", label: "le (blue-m)" },
        { id: "f", label: "la (pink-f)" },
      ],
      items: [
        { id: "g-parc", surface: "parc", bucketId: "m", meaningEn: "park" },
        { id: "g-ville", surface: "ville", bucketId: "f", meaningEn: "town" },
        {
          id: "g-musee",
          surface: "musée",
          bucketId: "m",
          meaningEn: "museum",
          note: "Ends like a pink-f word — and lies. Blue-m.",
        },
        { id: "g-gare", surface: "gare", bucketId: "f", meaningEn: "train station" },
        {
          id: "g-hotel",
          surface: "hôtel",
          bucketId: "m",
          meaningEn: "hotel",
          note: "«l'» hides it — «un hôtel» tells you: blue-m.",
        },
        { id: "g-plage", surface: "plage", bucketId: "f", meaningEn: "beach" },
        { id: "g-restaurant", surface: "restaurant", bucketId: "m", meaningEn: "restaurant" },
        {
          id: "g-ecole",
          surface: "école",
          bucketId: "f",
          meaningEn: "school",
          note: "Behind the squeeze: «une école» — pink-f.",
        },
      ],
      endingRule:
        "The sides still live with the words — but you now own a whole town of them, squeezes included.",
    }),
    // TAIL: L6's local answer, from memory.
    speaking(
      "fr-m4-7-speak-lhotelestlabas-recall",
      "l'hôtel est là-bas",
      "the hotel is over there",
      [],
      "recall",
    ),
    cloze(
      "fr-m4-7-cloze-un",
      "il y a",
      "restaurant ici",
      "un",
      ["un", "une"],
      "there's a restaurant here",
      "il y a un restaurant ici",
      "«restaurant» rides the blue-m side — «un».",
    ),
    listeningCompSentence({
      id: "fr-m4-7-lc-ouestlerestaurant",
      audioText: "où est le restaurant ?",
      correctMeaningEn: "Where is the restaurant?",
      distractorsEn: ["There's a restaurant.", "Where is the museum?", "It's Hugo's restaurant."],
    }),
    build(
      "fr-m4-7-build-gareici",
      "Build: 'there's a station here'",
      "il y a une gare ici",
      ["il y a", "une", "gare", "ici", "le"],
      ["il y a", "une", "gare", "ici"],
    ),
    {
      id: "fr-m4-7-hear-laplage",
      type: "word_image_mcq",
      meaningEn: "la plage",
      options: [
        { id: "correct", word: "la plage", emoji: "🏖️" },
        { id: "o1", word: "la ville", emoji: "🏙️" },
        { id: "o2", word: "l'école", emoji: "🏫" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m3 naming lane, from memory.
    speaking(
      "fr-m4-7-speak-cestuneglace-recall",
      "c'est une glace",
      "it's an ice cream",
      [],
      "recall",
    ),
    cloze(
      "fr-m4-7-cloze-labas",
      "la plage est",
      "",
      "là-bas",
      ["là-bas", "ici"],
      "the beach is OVER THERE",
      "la plage est là-bas",
      "«là-bas» — the pointing word. «ici» would put the sand at your feet.",
    ),
    {
      id: "fr-m4-7-sim-ines",
      type: "dialogue_sim",
      scene: { emoji: "🏖️", title: "Inès dreams big" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-plage",
          npc: {
            speaker: "Inès",
            kana: "Il y a une plage ici ?",
            audioText: "il y a une plage ici ?",
            gloss: "Is there a beach here?",
          },
          goal: "Sadly, no.",
          reply: {
            mode: "choice",
            options: [
              { id: "pasde", text: "il n'y a pas de plage" },
              { id: "ilya", text: "il y a une plage" },
              { id: "labas", text: "là-bas" },
            ],
            correctOptionId: "pasde",
            audioText: "il n'y a pas de plage",
          },
          replyGloss: "There's no beach.",
          explanation:
            "«il n'y a pas de plage» — the truth, gently. The park will have to do.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m2 names lane by ear.
      id: "fr-m4-7-lc-tappelles",
      audioText: "comment tu t'appelles ?",
      correctMeaningEn: "What's your name?",
      distractorsEn: ["How's it going?", "Where are you from?", "Where is the school?"],
    }),
    {
      id: "fr-m4-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ville", source: "ville", target: "town / city" },
        { id: "p-restaurant", source: "restaurant", target: "restaurant" },
        { id: "p-labas", source: "là-bas", target: "over there" },
        { id: "p-cestquoi", source: "c'est quoi ?", target: "what is that?" },
        { id: "p-salut", source: "salut", target: "hi / bye (casual)" },
        { id: "p-neuf", source: "neuf", target: "nine" },
      ],
    },
    // WIN: the dream, out loud — printed first voicing.
    speaking(
      "fr-m4-7-speak-plagelabas",
      "il y a une plage là-bas",
      "there's a beach over there",
      [],
    ),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): both article pairs behind
 *  «il y a», the squeeze produced, existence discriminated, the town
 *  asked after. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m4-8-hear-lagare",
      type: "word_image_mcq",
      meaningEn: "la gare",
      options: [
        { id: "correct", word: "la gare", emoji: "🚉" },
        { id: "o1", word: "la ville", emoji: "🏙️" },
        { id: "o2", word: "le parc", emoji: "🌳" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m4-8-cloze-la",
      "",
      "plage",
      "la",
      ["la", "le"],
      "the beach",
      "la plage",
      "«plage» is a pink-f word — «la».",
    ),
    speaking("fr-m4-8-speak-laville-recall", "la ville", "the town", [], "recall"),
    listeningCompSentence({
      id: "fr-m4-8-lc-pasdemusee",
      audioText: "il n'y a pas de musée",
      correctMeaningEn: "There's no museum.",
      distractorsEn: ["There is a museum.", "Where is the museum?", "There's no station."],
    }),
    vocabTextMcq("fr-m4-8-mc-hotel", "hôtel", ["école", "gare", "restaurant"]),
    build(
      "fr-m4-8-build-museeici",
      "Build: 'there's a museum here'",
      "il y a un musée ici",
      ["il y a", "un", "musée", "ici", "une"],
      ["il y a", "un", "musée", "ici"],
    ),
    {
      id: "fr-m4-8-hear-leparc",
      type: "word_image_mcq",
      meaningEn: "le parc",
      options: [
        { id: "correct", word: "le parc", emoji: "🌳" },
        { id: "o1", word: "la plage", emoji: "🏖️" },
        { id: "o2", word: "le musée", emoji: "🏛️" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m4-8-cloze-un",
      "il y a",
      "hôtel ici",
      "un",
      ["un", "une"],
      "there's a hotel here",
      "il y a un hôtel ici",
      "Blue-m behind the squeeze — «un hôtel».",
    ),
    speaking(
      "fr-m4-8-speak-parcici-recall",
      "il y a un parc ici",
      "there's a park here",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m4-8-lc-ouestlaplage",
      audioText: "où est la plage ?",
      correctMeaningEn: "Where is the beach?",
      distractorsEn: ["The beach is over there.", "There's no beach.", "Where is the school?"],
    }),
    build(
      "fr-m4-8-build-lecoledelea",
      "Build: 'it's Léa's school'",
      "c'est l'école de Léa",
      ["c'est", "l'école", "de", "Léa", "une"],
      ["c'est", "l'école", "de", "Léa"],
    ),
    cloze(
      "fr-m4-8-cloze-de",
      "il n'y a pas",
      "plage",
      "de",
      ["de", "la"],
      "there's no beach",
      "il n'y a pas de plage",
      "Bare «de» after «pas» — no article comes along.",
    ),
    {
      id: "fr-m4-8-hear-lerestaurant",
      type: "word_image_mcq",
      meaningEn: "le restaurant",
      options: [
        { id: "correct", word: "le restaurant", emoji: "🍽️" },
        { id: "o1", word: "le café", emoji: "☕" },
        { id: "o2", word: "l'hôtel", emoji: "🏨" },
      ],
      correctOptionId: "correct",
    },
    vocabTextMcq("fr-m4-8-mc-labas", "là-bas", ["ici", "moi aussi", "non"]),
    speaking("fr-m4-8-speak-lhotel-recall", "l'hôtel", "the hotel", [], "recall"),
    {
      id: "fr-m4-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-gare", source: "gare", target: "train station" },
        { id: "p-parc", source: "parc", target: "park" },
        { id: "p-ecole", source: "école", target: "school" },
        { id: "p-ilya", source: "il y a", target: "there is / there are" },
        { id: "p-ouest", source: "où est", target: "where is" },
        { id: "p-ici", source: "ici", target: "here" },
      ],
    },
  ];
}

/** L9 — Louis visits: the tour conversation, then the retrieval tail
 *  over exactly what it used. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m4-9-sim-louis",
      type: "dialogue_sim",
      scene: {
        emoji: "🧳",
        title: "Louis visits",
        setting: "First time in your town — you're the local now.",
      },
      exercisedAtomIds: [],
      explanation:
        "Check-in, honest geography, directions, tastes — a whole visit built from four modules.",
      turns: [
        {
          id: "t1-checkin",
          npc: {
            speaker: "Louis",
            kana: "Salut ! Ça va ?",
            audioText: "ça va",
            gloss: "Hi! How's it going?",
          },
          goal: "Answer — bounce it back.",
          reply: {
            mode: "build",
            tiles: ["ça va", "bien", "et toi ?", "non merci"],
            answer: "ça va bien et toi ?",
            alsoAccepted: ["ça va bien", "ça va et toi ?", "ça va"],
            audioText: "ça va bien et toi ?",
          },
          replyGloss: "Fine — and you?",
        },
        {
          id: "t2-plage",
          npc: {
            speaker: "Louis",
            kana: "Il y a une plage ici ?",
            audioText: "il y a une plage ici ?",
            gloss: "Is there a beach here?",
          },
          goal: "Sadly, no.",
          reply: {
            mode: "choice",
            options: [
              { id: "pasde", text: "il n'y a pas de plage" },
              { id: "ilya", text: "il y a une plage" },
              { id: "labas", text: "là-bas" },
            ],
            correctOptionId: "pasde",
            audioText: "il n'y a pas de plage",
          },
          replyGloss: "There's no beach.",
        },
        {
          id: "t3-parc",
          npc: {
            speaker: "Louis",
            kana: "Où est le parc ?",
            audioText: "où est le parc ?",
            gloss: "Where's the park?",
          },
          goal: "Point him there.",
          reply: {
            mode: "choice",
            options: [
              { id: "labas", text: "là-bas" },
              { id: "ici", text: "ici" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "labas",
            audioText: "là-bas",
          },
          replyGloss: "Over there.",
        },
        {
          id: "t4-aussi",
          npc: {
            speaker: "Louis",
            kana: "J'aime le parc ! Et toi ?",
            audioText: "j'aime le parc et toi ?",
            gloss: "I love the park! And you?",
          },
          goal: "Agree — or answer honestly.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "naime", text: "je n'aime pas le parc" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "moiaussi",
            alsoCorrectOptionIds: ["naime"],
            audioText: "moi aussi",
          },
          replyGloss: "Me too.",
          explanation:
            "Both honest answers stand — m3's rule, m4's park.",
        },
      ],
    },
    build(
      "fr-m4-9-build-pardonhotel",
      "Build: 'excuse me — where is the hotel?'",
      "pardon où est l'hôtel ?",
      ["pardon", "où est", "l'hôtel ?", "ici"],
      ["pardon", "où est", "l'hôtel ?"],
    ),
    listeningCompSentence({
      id: "fr-m4-9-lc-hotelici",
      audioText: "il y a un hôtel ici",
      correctMeaningEn: "There's a hotel here.",
      distractorsEn: ["There's no hotel.", "Where is the hotel?", "The hotel is over there."],
    }),
    // The L5 win, from memory.
    speaking("fr-m4-9-speak-jaimelaplage-recall", "j'aime la plage", "I love the beach", [], "recall"),
    cloze(
      "fr-m4-9-cloze-le",
      "où est",
      "musée ?",
      "le",
      ["le", "la"],
      "where is the museum?",
      "où est le musée ?",
      "«musée» lies about its side — blue-m, «le».",
    ),
    {
      id: "fr-m4-9-hear-lecole",
      type: "word_image_mcq",
      meaningEn: "l'école",
      options: [
        { id: "correct", word: "l'école", emoji: "🏫" },
        { id: "o1", word: "la gare", emoji: "🚉" },
        { id: "o2", word: "le restaurant", emoji: "🍽️" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m4-9-lbuild-gareici",
      target: "il y a une gare ici",
      tiles: ["il y a", "une", "gare", "ici", "le"],
      correctOrder: ["il y a", "une", "gare", "ici"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m4-9-mc-plage", "plage", ["gare", "ville", "école"]),
    {
      id: "fr-m4-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-parc", source: "parc", target: "park" },
        { id: "p-plage", source: "plage", target: "beach" },
        { id: "p-pasde", source: "il n'y a pas de", target: "there's no …" },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-jaime", source: "j'aime", target: "I like / I love" },
        { id: "p-merci", source: "merci", target: "thank you" },
      ],
    },
    // WIN: the dream stays voiced — from memory (voiced L7).
    speaking(
      "fr-m4-9-speak-plagelabas-recall",
      "il y a une plage là-bas",
      "there's a beach over there",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends on Chloé's tour —
 *  you're the guide. */
function lesson10(): LessonStep[] {
  return [
    {
      id: "fr-m4-10-hear-laville",
      type: "word_image_mcq",
      meaningEn: "la ville",
      options: [
        { id: "correct", word: "la ville", emoji: "🏙️" },
        { id: "o1", word: "la plage", emoji: "🏖️" },
        { id: "o2", word: "la gare", emoji: "🚉" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m4-10-build-pasdeparc",
      "Build: 'there's no park here'",
      "il n'y a pas de parc ici",
      ["il n'y a pas de", "parc", "ici", "il y a"],
      ["il n'y a pas de", "parc", "ici"],
    ),
    cloze(
      "fr-m4-10-cloze-une",
      "il y a",
      "gare ici",
      "une",
      ["une", "un"],
      "there's a station here",
      "il y a une gare ici",
      "«gare» — pink-f, «une».",
    ),
    listeningCompSentence({
      id: "fr-m4-10-lc-ouestlecole",
      audioText: "où est l'école ?",
      correctMeaningEn: "Where is the school?",
      distractorsEn: ["Where is the hotel?", "There's a school here.", "It's Léa's school."],
    }),
    speaking("fr-m4-10-speak-lerestaurant-recall", "le restaurant", "the restaurant", [], "recall"),
    vocabTextMcq("fr-m4-10-mc-gare", "gare", ["ville", "plage", "musée"]),
    cloze(
      "fr-m4-10-cloze-de",
      "il n'y a pas",
      "restaurant",
      "de",
      ["de", "le"],
      "there's no restaurant",
      "il n'y a pas de restaurant",
      "Bare «de» after «pas», every time.",
    ),
    listeningCompSentence({
      id: "fr-m4-10-lc-hotellabas",
      audioText: "l'hôtel est là-bas",
      correctMeaningEn: "The hotel is over there.",
      distractorsEn: ["The hotel is here.", "The school is over there.", "There's no hotel."],
    }),
    build(
      "fr-m4-10-build-ouestlemusee",
      "Build: 'where is the museum?'",
      "où est le musée ?",
      ["où est", "le", "musée ?", "la", "ici"],
      ["où est", "le", "musée ?"],
    ),
    {
      id: "fr-m4-10-hear-lemusee",
      type: "word_image_mcq",
      meaningEn: "le musée",
      options: [
        { id: "correct", word: "le musée", emoji: "🏛️" },
        { id: "o1", word: "l'hôtel", emoji: "🏨" },
        { id: "o2", word: "le parc", emoji: "🌳" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m4-10-speak-lecole-recall", "l'école", "the school", [], "recall"),
    cloze(
      "fr-m4-10-cloze-labas",
      "le parc est",
      "",
      "là-bas",
      ["là-bas", "ici"],
      "the park is OVER THERE",
      "le parc est là-bas",
      "Point with «là-bas»; «ici» keeps your feet in the grass.",
    ),
    {
      id: "fr-m4-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-musee", source: "musée", target: "museum" },
        { id: "p-restaurant", source: "restaurant", target: "restaurant" },
        { id: "p-ilya", source: "il y a", target: "there is / there are" },
        { id: "p-ouest", source: "où est", target: "where is" },
        { id: "p-labas", source: "là-bas", target: "over there" },
        { id: "p-plage", source: "plage", target: "beach" },
      ],
    },
    {
      // THE MODULE ENDS ON THE TOUR — you're the guide now.
      id: "fr-m4-10-sim-tour",
      type: "dialogue_sim",
      scene: {
        emoji: "🏙️",
        title: "Chloé's tour",
        setting: "She came to see YOUR town. You lead.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: the town exists, you can find anything in it, and you can show it off — in French. Module 5: doing things in it.",
      turns: [
        {
          id: "t1-quoi",
          npc: {
            speaker: "Chloé",
            kana: "C'est quoi ?",
            audioText: "c'est quoi ?",
            gloss: "What's that?",
          },
          goal: "The museum — name it.",
          reply: {
            mode: "build",
            tiles: ["c'est", "le", "musée", "la", "une"],
            answer: "c'est le musée",
            audioText: "c'est le musée",
          },
          replyGloss: "It's the museum.",
        },
        {
          id: "t2-restaurant",
          npc: {
            speaker: "Chloé",
            kana: "Il y a un restaurant ici ?",
            audioText: "il y a un restaurant ici ?",
            gloss: "Is there a restaurant here?",
          },
          goal: "There is — point it out.",
          reply: {
            mode: "choice",
            options: [
              { id: "labas", text: "il y a un restaurant là-bas" },
              { id: "pasde", text: "il n'y a pas de restaurant" },
              { id: "moiaussi", text: "moi aussi" },
            ],
            correctOptionId: "labas",
            audioText: "il y a un restaurant là-bas",
          },
          replyGloss: "There's a restaurant over there.",
        },
        {
          id: "t3-ville",
          npc: {
            speaker: "Chloé",
            kana: "J'aime la ville !",
            audioText: "j'aime la ville",
            gloss: "I love the town!",
          },
          goal: "So do you.",
          reply: {
            mode: "choice",
            options: [
              { id: "moiaussi", text: "moi aussi" },
              { id: "cestquoi", text: "c'est quoi ?" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "moiaussi",
            audioText: "moi aussi",
          },
          replyGloss: "Me too.",
        },
        {
          id: "t4-bye",
          npc: {
            speaker: "Chloé",
            kana: "Au revoir ! À bientôt.",
            audioText: "au revoir à bientôt",
            gloss: "Bye — see you soon!",
          },
          goal: "Send her off — either way.",
          reply: {
            mode: "choice",
            options: [
              { id: "abientot", text: "à bientôt" },
              { id: "aurevoir", text: "au revoir" },
              { id: "cestquoi", text: "c'est quoi ?" },
            ],
            correctOptionId: "abientot",
            alsoCorrectOptionIds: ["aurevoir"],
            audioText: "à bientôt",
          },
          replyGloss: "See you soon!",
        },
      ],
    },
  ];
}

const FR_M4_1: LessonContent = {
  id: "fr-m4-1",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say what's there",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M4_2: LessonContent = {
  id: "fr-m4-2",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Where is it?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M4_3: LessonContent = {
  id: "fr-m4-3",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The squeeze",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M4_4: LessonContent = {
  id: "fr-m4-4",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Say what's missing",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M4_5: LessonContent = {
  id: "fr-m4-5",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Dream town",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M4_6: LessonContent = {
  id: "fr-m4-6",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Ask a stranger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M4_7: LessonContent = {
  id: "fr-m4-7",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Your whole town",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M4_8: LessonContent = {
  id: "fr-m4-8",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the visitors",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M4_9: LessonContent = {
  id: "fr-m4-9",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Louis visits",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M4_10: LessonContent = {
  id: "fr-m4-10",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — you're the guide",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M4_MODULE: FrModuleDef = {
  title: "En ville — out into the town",
  eyebrow: "Module 4",
  summary:
    "Take your French outside: say what's there («il y a») and what's missing, ask where anything is — and meet the squeeze: «l'école», «l'hôtel».",
  lessons: [
    FR_M4_1,
    FR_M4_2,
    FR_M4_3,
    FR_M4_4,
    FR_M4_5,
    FR_M4_6,
    FR_M4_7,
    FR_M4_8,
    FR_M4_9,
    FR_M4_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M4_CHECKPOINT_INDEX = 8;

export const FR_M4_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m4-s",
    moduleId: "m4",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m4-s",
        prompt: "Complete: «Il y a ___ café ici.»",
        correctText: "un",
        distractorsText: ["une", "de", "et"],
      }),
  },
  {
    id: "pt-fr-m4-1",
    moduleId: "m4",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m4-1",
        prompt: "'Where is the station?' — pick the French.",
        correctText: "où est la gare ?",
        distractorsText: ["où est le gare ?", "il y a la gare ?", "c'est quoi la gare"],
      }),
  },
  {
    id: "pt-fr-m4-2",
    moduleId: "m4",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m4-2",
        prompt: "'There's no park' — pick the French.",
        correctText: "il n'y a pas de parc",
        distractorsText: ["il n'y a pas le parc", "il y a un parc", "où est le parc ?"],
      }),
  },
  {
    id: "pt-fr-m4-3",
    moduleId: "m4",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m4-3",
        prompt: "Pick the word for 'over there'.",
        correctText: "là-bas",
        distractorsText: ["ici", "où est", "moi aussi"],
      }),
  },
  {
    id: "pt-fr-m4-4",
    moduleId: "m4",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m4-4",
        prompt: "'The school' — pick the French.",
        correctText: "l'école",
        distractorsText: ["la école", "le école", "une école"],
      }),
  },
];
