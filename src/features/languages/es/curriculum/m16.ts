/**
 * Spanish Module 16 — De viaje (survival Spanish, yo-irregulars, the
 * present progressive, and the A1 grand review).
 *
 * The capstone. New material lands in L1–L4: the yo-irregulars (hago,
 * vengo, sé, conozco — light touch, as vocabulary), saber vs conocer,
 * estar + -ando/-iendo, and the hotel-and-directions survival kit. Then
 * the course folds back on itself: L5–L7 are cumulative review lessons
 * weaving m1–m15 vocabulary and grammar (spaced review, no new atoms),
 * and L8 is the course mastery test.
 *
 * Lesson arc (m16 variant of the spine rhythm — L1 teach-intro ·
 * L2–L4 topics · L5–L7 grand review · L8 mastery test):
 *
 *   es-m16-1  Yo irregular — hago, vengo (+ maleta, pasaporte)
 *   es-m16-2  ¿Saber o conocer? — sé vs conozco (+ mapa)
 *   es-m16-3  Estoy aprendiendo — progressive + classroom survival
 *   es-m16-4  En el hotel — room, help, directions
 *   es-m16-5  Repaso I — people, family & things (m1–m5 weave)
 *   es-m16-6  Repaso II — listening review (m6–m10 weave)
 *   es-m16-7  Repaso III — integration & speaking (m11–m15 weave)
 *   es-m16-8  M16 Mastery Test
 *
 * Review lessons reuse earlier-module surfaces freely WITHOUT
 * re-registering them (spine reuse rule) and stay inside m1–m16 vocab.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, type EsAtom } from "../courseAtoms";
import {
  agreementCloze,
  build,
  capstoneMatchPairs,
  cloze,
  dialogueListen,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";

// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m15";

const COURSE_ID = "mock-1";

// ─── M16 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M16_ATOMS: EsAtom[] = [
  // Yo-irregulars (taught as vocabulary, light touch)
  atom({ surface: "hacer", meaningEn: "to do / make", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "hago", meaningEn: "I do / make", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "venir", meaningEn: "to come", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "vengo", meaningEn: "I come", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "saber", meaningEn: "to know (facts)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "sé", meaningEn: "I know", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "conocer", meaningEn: "to know (people/places)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "conozco", meaningEn: "I know (am familiar with)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  // Travel survival nouns
  atom({ surface: "maleta", meaningEn: "suitcase", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "🧳" }),
  atom({ surface: "pasaporte", meaningEn: "passport", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "m" }),
  atom({ surface: "reservación", meaningEn: "reservation", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f" }),
  atom({ surface: "habitación", meaningEn: "room (hotel)", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "🛏️" }),
  // Directions
  atom({ surface: "derecha", meaningEn: "right (side)", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "➡️" }),
  atom({ surface: "izquierda", meaningEn: "left", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "⬅️" }),
  atom({ surface: "derecho", meaningEn: "straight ahead", partOfSpeech: "adverb", fromModule: "m16", kind: "vocab", emoji: "⬆️" }),
  atom({ surface: "esquina", meaningEn: "corner", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f" }),
  atom({ surface: "mapa", meaningEn: "map", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "m", emoji: "🗺️" }),
  atom({ surface: "ayuda", meaningEn: "help", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f" }),
  // Survival phrases
  atom({ surface: "¿me puede ayudar?", meaningEn: "can you help me?", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "estoy aprendiendo", meaningEn: "I am learning", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "hablando", meaningEn: "speaking", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "comiendo", meaningEn: "eating", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "no entiendo", meaningEn: "I don't understand", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "¿habla inglés?", meaningEn: "do you speak English?", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "más despacio", meaningEn: "more slowly", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
];

// Shared distractor pool for travel-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg):
// 🧳 1f9f3 · 🗺️ 1f5fa · 🛏️ 1f6cf · ➡️ 27a1 · ⬅️ 2b05 · ⬆️ 2b06.
// (🛂 and 🆘 are NOT in the subset — pasaporte and ayuda ship without art.)
const MALETA = { surface: "maleta", emoji: "🧳" };
const MAPA = { surface: "mapa", emoji: "🗺️" };
const HABITACION = { surface: "habitación", emoji: "🛏️" };
const DERECHA = { surface: "derecha", emoji: "➡️" };
const IZQUIERDA = { surface: "izquierda", emoji: "⬅️" };
const DERECHO = { surface: "derecho", emoji: "⬆️" };

// ─── es-m16-1 — Yo irregular: hago, vengo ───────────────────────────────────

const M16_1: LessonContent = {
  id: "es-m16-1",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Yo irregular — hago, vengo",
  description: "A handful of verbs bend only in the yo form. Pack your suitcase.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m16-1-info-yoirr",
      "The yo-irregulars",
      "Some very common verbs are regular everywhere except the yo form: hacer (to do / make) gives hago, venir (to come) gives vengo, and salir — from module 15 — gives salgo. Every other person behaves normally (haces, hace, hacemos...). Learn the yo form as its own word and the rest of the verb holds no surprises.",
      "grammar",
    ),
    vocab("es-m16-1-p-hago", "I do / make", "hago"),
    phrase("es-m16-1-p-maleta", "suitcase", "la maleta", undefined, { atomId: "es:maleta", emoji: "🧳" }),
    sentenceMcq({
      id: "es-m16-1-q-hago",
      prompt: "Pick the yo form of hacer (to do / make).",
      correctText: "hago",
      distractorsText: ["haces", "hace", "hacer"],
      explanation: "The yo form is irregular — the regular endings only fit the other persons.",
      exercisedAtomSurfaces: ["hago"],
    }),
    vocabMcq(
      "es-m16-1-mcq-maleta",
      { surface: "maleta", meaningEn: "suitcase", emoji: "🧳" },
      [MAPA, HABITACION, DERECHA],
    ),
    vocab("es-m16-1-p-vengo", "I come", "vengo"),
    phrase("es-m16-1-p-pasaporte", "passport", "el pasaporte", undefined, { atomId: "es:pasaporte" }),
    sentenceMcq({
      id: "es-m16-1-q-vengo",
      prompt: "Pick the yo form of venir (to come).",
      correctText: "vengo",
      distractorsText: ["viene", "vienes", "venimos"],
      explanation: "Another yo-irregular — a g sneaks in, the same one hiding in hago.",
      exercisedAtomSurfaces: ["vengo"],
    }),
    build(
      "es-m16-1-b-pasaporte",
      "Build: 'My passport is in the backpack.'",
      "mi pasaporte está en la mochila",
      ["mi", "pasaporte", "está", "en", "la", "mochila", "maleta"],
      ["mi", "pasaporte", "está", "en", "la", "mochila"],
      ["pasaporte"],
    ),
    vocabTextMcq("es-m16-1-tmcq-pasaporte", "pasaporte", ["maleta", "mapa", "boleto"]),
  ],
};

// ─── es-m16-2 — ¿Saber o conocer? ───────────────────────────────────────────

const M16_2: LessonContent = {
  id: "es-m16-2",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Saber o conocer? — sé, conozco",
  description: "Two verbs for 'to know' — facts vs familiarity.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m16-2-info-saberconocer",
      "Two ways to know",
      "Spanish splits 'to know' in two. Saber is for facts and how-to: knowing where, when, or how. Conocer is for familiarity: knowing people, places, and things you've experienced. Both are yo-irregular — saber gives sé (with an accent, to tell it apart from the pronoun se), conocer gives conozco.",
      "grammar",
    ),
    vocab("es-m16-2-p-se", "I know (a fact)", "sé"),
    vocab("es-m16-2-p-conozco", "I know (am familiar with)", "conozco"),
    sentenceMcq({
      id: "es-m16-2-q-se",
      prompt: "Complete with the right verb: Yo ___ dónde está el hotel.",
      correctText: "sé",
      distractorsText: ["conozco", "saber", "conocer"],
      explanation: "Where the hotel is — that's a fact, so the facts-verb wins.",
      exercisedAtomSurfaces: ["sé"],
    }),
    sentenceMcq({
      id: "es-m16-2-q-conozco",
      prompt: "Complete with the right verb: Yo ___ la Ciudad de México.",
      correctText: "conozco",
      distractorsText: ["sé", "saber", "conocer"],
      explanation: "A city you're familiar with — that's the familiarity verb.",
      exercisedAtomSurfaces: ["conozco"],
    }),
    phrase("es-m16-2-p-mapa", "map", "el mapa", undefined, { atomId: "es:mapa", emoji: "🗺️" }),
    listeningCompSentence({
      id: "es-m16-2-lc-se",
      audioText: "no sé dónde está el restaurante",
      correctMeaningEn: "I don't know where the restaurant is",
      distractorsEn: [
        "I know where the restaurant is",
        "I don't know where the bank is",
        "the restaurant is far from here",
      ],
      exercisedAtomSurfaces: ["sé"],
    }),
    vocabMcq(
      "es-m16-2-mcq-mapa",
      { surface: "mapa", meaningEn: "map", emoji: "🗺️" },
      [MALETA, HABITACION, IZQUIERDA],
    ),
    translateStep({
      id: "es-m16-2-tr-conozco",
      promptEn: "I know Mexico. (I'm familiar with it)",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "conozco México",
        "Conozco México",
        "conozco Mexico",
        "Conozco Mexico",
        "yo conozco México",
        "yo conozco Mexico",
      ],
      audioText: "conozco México",
      exercisedAtomSurfaces: ["conozco"],
    }),
  ],
};

// ─── es-m16-3 — Estoy aprendiendo (present progressive) ─────────────────────

const M16_3: LessonContent = {
  id: "es-m16-3",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Estoy aprendiendo — right now",
  description: "Estar + -ando/-iendo for what's happening this second.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m16-3-info-gerundio",
      "Right now: estar + -ando / -iendo",
      "For actions happening this very moment, pair estar with a gerund: -ar verbs swap -ar for -ando (hablar → hablando), while -er and -ir verbs take -iendo (comer → comiendo, aprender → aprendiendo). Estoy hablando = I am speaking, right now. Spanish leans on this less than English does — the plain present already covers routines.",
      "grammar",
    ),
    phrase(
      "es-m16-3-p-aprendiendo",
      "I am learning Spanish",
      "estoy aprendiendo español",
      undefined,
      { atomId: "es:estoy aprendiendo" },
    ),
    vocab("es-m16-3-p-comiendo", "eating", "comiendo"),
    sentenceMcq({
      id: "es-m16-3-q-aprendiendo",
      prompt: "'I am learning Spanish' — pick the Spanish.",
      correctText: "estoy aprendiendo español",
      distractorsText: [
        "estoy aprendiendo inglés",
        "estás aprendiendo español",
        "aprender español",
      ],
      exercisedAtomSurfaces: ["estoy aprendiendo"],
    }),
    cloze(
      "es-m16-3-cloze-hablando",
      "estoy",
      "con mi amiga",
      "hablando",
      ["hablando", "comiendo", "hablar", "hablo"],
      "I am talking with my friend",
      "estoy hablando con mi amiga",
      "After estar, an -ar verb takes its gerund ending — the action is underway right now.",
    ),
    listeningCompSentence({
      id: "es-m16-3-lc-comiendo",
      audioText: "estamos comiendo en el restaurante",
      correctMeaningEn: "we are eating at the restaurant",
      distractorsEn: [
        "we are cooking at the restaurant",
        "they are eating at home",
        "we eat at the restaurant every day",
      ],
      exercisedAtomSurfaces: ["comiendo"],
    }),
    phrase("es-m16-3-p-noentiendo", "I don't understand", "no entiendo"),
    sentenceMcq({
      id: "es-m16-3-q-hablaingles",
      prompt: "You need directions in English. Ask the hotel clerk politely:",
      correctText: "¿habla inglés?",
      distractorsText: [
        "¿hablas español?",
        "más despacio, por favor",
        "estoy comiendo",
      ],
      explanation: "The formal you-form fits a clerk you've just met.",
      exercisedAtomSurfaces: ["¿habla inglés?"],
    }),
    translateStep({
      id: "es-m16-3-tr-noentiendo",
      promptEn: "I don't understand.",
      acceptedAnswers: ["no entiendo", "No entiendo", "no entiendo.", "No entiendo."],
      audioText: "no entiendo",
      exercisedAtomSurfaces: ["no entiendo"],
    }),
  ],
};

// ─── es-m16-4 — En el hotel: room, help, directions ─────────────────────────

const M16_4: LessonContent = {
  id: "es-m16-4",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En el hotel — la habitación, direcciones",
  description: "Check in, ask for help, and follow directions.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    phrase(
      "es-m16-4-p-ayudar",
      "can you help me?",
      "¿me puede ayudar?",
      "Hotel and restaurant staff are addressed with formal usted — that's why it's puede, not puedes.",
    ),
    phrase("es-m16-4-p-habitacion", "room (hotel)", "la habitación", undefined, { atomId: "es:habitación", emoji: "🛏️" }),
    sentenceMcq({
      id: "es-m16-4-q-ayudar",
      prompt: "Your suitcase is lost. Get the front desk's attention:",
      correctText: "perdón, ¿me puede ayudar?",
      distractorsText: [
        "gracias, hasta luego",
        "sí, por favor",
        "buenas noches, señor",
      ],
      exercisedAtomSurfaces: ["¿me puede ayudar?", "perdón"],
    }),
    sentenceMcq({
      id: "es-m16-4-q-habitacion",
      prompt: "Checking in: 'Tengo una reservación. ¿Dónde está la ___?'",
      correctText: "habitación",
      distractorsText: ["esquina", "maleta", "ayuda"],
      exercisedAtomSurfaces: ["habitación"],
    }),
    phrase("es-m16-4-p-derecha", "to the right", "a la derecha", undefined, { atomId: "es:derecha", emoji: "➡️" }),
    phrase("es-m16-4-p-izquierda", "to the left", "a la izquierda", undefined, { atomId: "es:izquierda", emoji: "⬅️" }),
    vocabMcq(
      "es-m16-4-mcq-derecha",
      { surface: "derecha", meaningEn: "right (side)", emoji: "➡️" },
      [IZQUIERDA, DERECHO, MAPA],
    ),
    sentenceMcq({
      id: "es-m16-4-q-izquierda",
      prompt: "'The bank is on the left.' — El banco está a la ___.",
      correctText: "izquierda",
      distractorsText: ["derecha", "derecho", "esquina"],
      exercisedAtomSurfaces: ["izquierda"],
    }),
    sentenceMcq({
      id: "es-m16-4-q-derecho",
      prompt: "'Go straight ahead.' — The clerk points down the street: 'Siga ___.'",
      correctText: "derecho",
      distractorsText: ["derecha", "izquierda", "esquina"],
      explanation: "The fixed phrase for continuing without turning — no article before it.",
      exercisedAtomSurfaces: ["derecho"],
    }),
    agreementCloze(
      "es-m16-4-agree-reservacion",
      [
        { text: "tengo " },
        { blank: { id: "b1", correctAnswer: "una", options: ["una", "un", "unas", "unos"] } },
        { text: " reservación y " },
        { blank: { id: "b2", correctAnswer: "la", options: ["la", "el", "las", "los"] } },
        { text: " habitación está a " },
        { blank: { id: "b3", correctAnswer: "la", options: ["la", "el", "las", "los"] } },
        { text: " izquierda." },
      ],
      "I have a reservation and the room is to the left.",
      "tengo una reservación y la habitación está a la izquierda",
      ["reservación", "habitación", "izquierda"],
    ),
    vocabTextMcq("es-m16-4-tmcq-esquina", "esquina", ["derecha", "izquierda", "mapa"]),
  ],
};

// ─── es-m16-5 — Repaso I: people, family & things (m1–m5) ───────────────────

const M16_5: LessonContent = {
  id: "es-m16-5",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Repaso I — gente y cosas",
  description: "Grand review, part one: greetings, ser, articles, family.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m16-5-info-repaso",
      "The grand review begins",
      "Three review lessons close the course, weaving together everything from module 1 on. First up: people and things — ser, articles and gender, adjectives, family, and tener. Nothing here is new; everything here is yours.",
      "default",
    ),
    sentenceMcq({
      id: "es-m16-5-r-ser",
      prompt: "'She is my sister' — pick the Spanish.",
      correctText: "ella es mi hermana",
      distractorsText: [
        "ella está mi hermana",
        "ella eres mi hermana",
        "él es mi hermano",
      ],
      exercisedAtomSurfaces: ["es", "hermana"],
    }),
    cloze(
      "es-m16-5-cloze-la",
      "¿dónde está",
      "llave de la habitación?",
      "la",
      ["la", "el", "una", "los"],
      "where is the room key?",
      "¿dónde está la llave de la habitación?",
    ),
    sentenceMcq({
      id: "es-m16-5-r-tengo",
      prompt: "'I am twenty years old' — pick the Spanish.",
      correctText: "tengo veinte años",
      distractorsText: [
        "soy veinte años",
        "estoy veinte años",
        "tienes veinte años",
      ],
      explanation: "Spanish states age with the having-verb, never with the being-verbs.",
      exercisedAtomSurfaces: ["tengo", "años"],
    }),
    build(
      "es-m16-5-b-casa",
      "Build: 'The new house is big.'",
      "la casa nueva es grande",
      ["la", "casa", "nueva", "es", "grande", "pequeña"],
      ["la", "casa", "nueva", "es", "grande"],
      ["casa", "grande"],
    ),
    listeningCompSentence({
      id: "es-m16-5-lc-familia",
      audioText: "tengo dos hermanos y una hermana",
      correctMeaningEn: "I have two brothers and one sister",
      distractorsEn: [
        "I have three brothers",
        "I have two sisters and one brother",
        "my brother has two daughters",
      ],
      exercisedAtomSurfaces: ["hermana", "tengo"],
    }),
    sentenceMcq({
      id: "es-m16-5-r-hay",
      prompt: "'There are five books on the table' — pick the Spanish.",
      correctText: "hay cinco libros en la mesa",
      distractorsText: [
        "hay cinco libro en la mesa",
        "está cinco libros en la mesa",
        "hay cinco libros en la silla",
      ],
      exercisedAtomSurfaces: ["hay", "mesa"],
    }),
    translateStep({
      id: "es-m16-5-tr-madre",
      promptEn: "My mother is very nice.",
      acceptedAnswers: [
        "mi madre es muy simpática",
        "Mi madre es muy simpática",
        "mi madre es muy simpatica",
        "Mi madre es muy simpatica",
        "mi mamá es muy simpática",
        "mi mama es muy simpatica",
      ],
      audioText: "mi madre es muy simpática",
      exercisedAtomSurfaces: ["madre", "muy"],
    }),
    cloze(
      "es-m16-5-cloze-de",
      "el carro",
      "mi padre es nuevo",
      "de",
      ["de", "del", "en", "y"],
      "my father's car is new",
      "el carro de mi padre es nuevo",
    ),
    // Capstone grid — one word from each stretch of the course (m3–m16).
    // Uses the registry-free variant with inline glosses: the registry
    // resolver throws whenever a referenced module sits mid-import-cycle
    // (any test entry that imports a curriculum module directly). Glosses
    // must stay byte-identical to each atom's meaningEn.
    capstoneMatchPairs("es-m16-5-rev", [
      { surface: "casa", gloss: "house" },
      { surface: "hermana", gloss: "sister" },
      { surface: "escuela", gloss: "school" },
      { surface: "café", gloss: "coffee" },
      { surface: "playa", gloss: "beach" },
      { surface: "sombrero", gloss: "hat" },
      { surface: "película", gloss: "movie" },
      { surface: "maleta", gloss: "suitcase" },
    ]),
  ],
};

// ─── es-m16-6 — Repaso II: listening review (m6–m10) ────────────────────────

const M16_6: LessonContent = {
  id: "es-m16-6",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Repaso II — escucha",
  description: "Grand review, part two: time, places, and food — by ear.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m16-6-info-escucha",
      "Review by ear",
      "Part two of the grand review is pure listening: clock times, locations, routines, and food orders. Every sentence is built from words you already know — trust your ear.",
      "default",
    ),
    listeningCompSentence({
      id: "es-m16-6-lc-hora",
      audioText: "son las dos y media",
      correctMeaningEn: "it's half past two",
      distractorsEn: [
        "it's a quarter past two",
        "it's half past three",
        "it's two o'clock exactly",
      ],
      exercisedAtomSurfaces: ["media"],
    }),
    listeningBuildSentence({
      id: "es-m16-6-lb-banco",
      target: "el banco está cerca del hotel",
      tiles: ["el", "banco", "está", "cerca", "del", "hotel", "lejos"],
      correctOrder: ["el", "banco", "está", "cerca", "del", "hotel"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["banco", "cerca", "del"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-gusta",
      audioText: "me gusta el café pero no me gusta el té",
      correctMeaningEn: "I like coffee but I don't like tea",
      distractorsEn: [
        "I like tea but I don't like coffee",
        "I don't like coffee or tea",
        "I like coffee and tea",
      ],
      exercisedAtomSurfaces: ["me gusta", "café", "té"],
    }),
    listeningBuildSentence({
      id: "es-m16-6-lb-estudio",
      target: "estudio español todos los días",
      tiles: ["estudio", "español", "todos", "los", "días", "siempre"],
      correctOrder: ["estudio", "español", "todos", "los", "días"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["todos los días", "español"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-comida",
      audioText: "quiero pollo con arroz, por favor",
      correctMeaningEn: "I want chicken with rice, please",
      distractorsEn: [
        "I want fish with rice, please",
        "I want chicken with salad, please",
        "he wants chicken with rice",
      ],
      exercisedAtomSurfaces: ["quiero", "pollo", "arroz"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-derecha",
      audioText: "la habitación está a la derecha",
      correctMeaningEn: "the room is to the right",
      distractorsEn: [
        "the room is to the left",
        "the bathroom is to the right",
        "the room is on the corner",
      ],
      exercisedAtomSurfaces: ["habitación", "derecha"],
    }),
    listeningBuildSentence({
      id: "es-m16-6-lb-boleto",
      target: "el boleto de tren cuesta cincuenta pesos",
      tiles: ["el", "boleto", "de", "tren", "cuesta", "cincuenta", "pesos", "avión"],
      correctOrder: ["el", "boleto", "de", "tren", "cuesta", "cincuenta", "pesos"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["boleto", "tren", "cuesta", "cincuenta"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-desayuno",
      audioText: "el desayuno es a las ocho de la mañana",
      correctMeaningEn: "breakfast is at eight in the morning",
      distractorsEn: [
        "dinner is at eight at night",
        "breakfast is at seven in the morning",
        "lunch is at eight in the morning",
      ],
      exercisedAtomSurfaces: ["desayuno", "ocho", "mañana"],
    }),
  ],
};

// ─── es-m16-7 — Repaso III: integration & speaking (m11–m15) ────────────────

const M16_7: LessonContent = {
  id: "es-m16-7",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Repaso III — un día de viaje",
  description: "Grand review, part three: plans, shopping, routines — out loud.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m16-7-info-dialogo",
      "Un día de viaje",
      "—Buenos días. Tengo una reservación. Me llamo Ana.\n—Mucho gusto, señora. Su habitación está a la izquierda.\n—Gracias. ¿Hay un restaurante cerca?\n—Sí, en la esquina.\nA whole hotel check-in, from module 1 greetings to module 16 directions — read it out loud before you go on.",
      "default",
    ),
    dialogueListen({
      id: "es-m16-7-dl-hotel",
      lines: [
        { speaker: "Ana", text: "Perdón, señor. ¿Me puede ayudar? No sé dónde está el hotel." },
        { speaker: "Carlos", text: "Sí, claro. El hotel está a la derecha, en la esquina." },
        { speaker: "Ana", text: "Gracias. ¿Hay un restaurante cerca?" },
        { speaker: "Carlos", text: "Sí, hay un restaurante muy bueno al lado del hotel." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where is the hotel?",
          correctText: "To the right, on the corner.",
          distractors: [
            "To the left, on the corner.",
            "Straight ahead, near the bank.",
            "Behind the restaurant.",
          ],
        },
        {
          id: "q2",
          prompt: "What does Ana ask about at the end?",
          correctText: "Whether there is a restaurant nearby.",
          distractors: [
            "Whether there is a bank nearby.",
            "Where the train station is.",
            "What time breakfast is.",
          ],
        },
      ],
      exercisedAtomSurfaces: ["¿me puede ayudar?", "sé", "hotel", "derecha", "esquina"],
    }),
    sentenceMcq({
      id: "es-m16-7-r-vamos",
      prompt: "'We're going to the beach tomorrow' — pick the Spanish.",
      correctText: "vamos a la playa mañana",
      distractorsText: [
        "vamos a la playa hoy",
        "van a la playa mañana",
        "vamos al cine mañana",
      ],
      exercisedAtomSurfaces: ["vamos", "playa", "mañana"],
    }),
    cloze(
      "es-m16-7-cloze-este",
      "¿cuánto cuesta",
      "sombrero?",
      "este",
      ["este", "esta", "ese", "esos"],
      "how much does this hat cost?",
      "¿cuánto cuesta este sombrero?",
    ),
    build(
      "es-m16-7-b-levanto",
      "Build: 'I get up at seven in the morning.'",
      "me levanto a las siete de la mañana",
      ["me", "levanto", "a", "las", "siete", "de", "la", "mañana", "tarde"],
      ["me", "levanto", "a", "las", "siete", "de", "la", "mañana"],
      ["me levanto", "siete"],
    ),
    listeningCompSentence({
      id: "es-m16-7-lc-clima",
      audioText: "hace frío y nieva en invierno",
      correctMeaningEn: "it's cold and it snows in winter",
      distractorsEn: [
        "it's hot and sunny in summer",
        "it rains in the fall",
        "it's cold and windy in spring",
      ],
      exercisedAtomSurfaces: ["hace frío", "nieva", "invierno"],
    }),
    speaking(
      "es-m16-7-speak-aprendiendo",
      "estoy aprendiendo español",
      "I am learning Spanish",
      ["estoy aprendiendo", "español"],
    ),
    sentenceMcq({
      id: "es-m16-7-r-rutina",
      prompt: "'First I shower, then I have breakfast' — pick the Spanish.",
      correctText: "primero me ducho, luego desayuno",
      distractorsText: [
        "primero desayuno, luego me ducho",
        "primero me ducho, luego desayunas",
        "luego me ducho, primero desayuno",
      ],
      exercisedAtomSurfaces: ["primero", "luego"],
    }),
    speaking(
      "es-m16-7-speak-ayudar",
      "perdón, ¿me puede ayudar?",
      "excuse me, can you help me?",
      ["¿me puede ayudar?", "perdón"],
    ),
    translateStep({
      id: "es-m16-7-tr-cena",
      promptEn: "Tonight we're going to eat at the restaurant.",
      acceptedAnswers: [
        "esta noche vamos a comer en el restaurante",
        "Esta noche vamos a comer en el restaurante",
        "vamos a comer en el restaurante esta noche",
        "Vamos a comer en el restaurante esta noche",
      ],
      audioText: "esta noche vamos a comer en el restaurante",
      exercisedAtomSurfaces: ["esta noche", "vamos", "comer"],
    }),
  ],
};

// ─── es-m16-8 — Mastery test ────────────────────────────────────────────────

const M16_8: LessonContent = {
  id: "es-m16-8",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M16 Mastery Test",
  description: "Yo-irregulars, saber vs conocer, the progressive, survival Spanish.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m16-8-q-hago",
      prompt: "Pick the yo form of hacer (to do / make).",
      correctText: "hago",
      distractorsText: ["haces", "hace", "hacemos"],
      exercisedAtomSurfaces: ["hago"],
    }),
    sentenceMcq({
      id: "es-m16-8-q-conozco",
      prompt: "Complete with the right verb: Yo ___ la ciudad.",
      correctText: "conozco",
      distractorsText: ["sé", "saber", "conocer"],
      exercisedAtomSurfaces: ["conozco"],
    }),
    translateStep({
      id: "es-m16-8-tr-reservacion",
      promptEn: "I have a reservation.",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "tengo una reservación",
        "Tengo una reservación",
        "tengo una reservacion",
        "Tengo una reservacion",
      ],
      audioText: "tengo una reservación",
      exercisedAtomSurfaces: ["reservación", "tengo"],
    }),
    listeningBuildSentence({
      id: "es-m16-8-lb-derecha",
      target: "el baño está a la derecha",
      tiles: ["el", "baño", "está", "a", "la", "derecha", "izquierda"],
      correctOrder: ["el", "baño", "está", "a", "la", "derecha"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["derecha", "baño"],
    }),
    listeningCompSentence({
      id: "es-m16-8-lc-comiendo",
      audioText: "estoy comiendo pan con queso",
      correctMeaningEn: "I am eating bread with cheese",
      distractorsEn: [
        "I am eating rice with chicken",
        "I eat bread every day",
        "she is eating bread with cheese",
      ],
      exercisedAtomSurfaces: ["comiendo", "pan", "queso"],
    }),
    sentenceMcq({
      id: "es-m16-8-q-vengo",
      prompt: "'I come from the United States' — pick the Spanish.",
      correctText: "vengo de Estados Unidos",
      distractorsText: [
        "voy a Estados Unidos",
        "vengo a Estados Unidos",
        "viene de Estados Unidos",
      ],
      exercisedAtomSurfaces: ["vengo"],
    }),
    translateStep({
      id: "es-m16-8-tr-masdespacio",
      promptEn: "More slowly, please.",
      acceptedAnswers: [
        "más despacio, por favor",
        "Más despacio, por favor",
        "mas despacio, por favor",
        "Mas despacio, por favor",
        "más despacio por favor",
        "mas despacio por favor",
      ],
      audioText: "más despacio, por favor",
      exercisedAtomSurfaces: ["más despacio", "por favor"],
    }),
    build(
      "es-m16-8-b-esquina",
      "Build: 'The bank is on the corner.'",
      "el banco está en la esquina",
      ["el", "banco", "está", "en", "la", "esquina", "derecho"],
      ["el", "banco", "está", "en", "la", "esquina"],
      ["esquina", "banco"],
    ),
    speaking(
      "es-m16-8-speak-ingles",
      "¿habla inglés?",
      "do you speak English?",
      ["¿habla inglés?"],
    ),
  ],
};

export const ES_M16_LESSONS: LessonContent[] = [
  M16_1,
  M16_2,
  M16_3,
  M16_4,
  M16_5,
  M16_6,
  M16_7,
  M16_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M16_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m16",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m16",
          prompt: "'I am learning Spanish' — pick the Spanish.",
          correctText: "estoy aprendiendo español",
          distractorsText: [
            "estoy aprendiendo inglés",
            "estás aprendiendo español",
            "aprender español",
          ],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m16-1",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-m16-1",
          prompt: "Pick the yo form of hacer (to do / make).",
          correctText: "hago",
          distractorsText: ["haces", "hace", "hacemos"],
        }),
    },
    {
      id: "pt-es-m16-2",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-m16-2",
          prompt: "Complete with the right verb: Yo ___ la Ciudad de México.",
          correctText: "conozco",
          distractorsText: ["sé", "saber", "conocer"],
        }),
    },
    {
      id: "pt-es-m16-3",
      moduleId: "m16",
      build: () =>
        cloze(
          "pt-es-m16-3",
          "estoy",
          "con mi amiga",
          "hablando",
          ["hablando", "hablar", "hablo", "hablas"],
          "I am talking with my friend",
          "estoy hablando con mi amiga",
        ),
    },
    {
      id: "pt-es-m16-4",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-m16-4",
          prompt: "'The bathroom is to the right.' — El baño está a la ___.",
          correctText: "derecha",
          distractorsText: ["izquierda", "derecho", "esquina"],
        }),
    },
  ],
};
