/**
 * Spanish Module 11 — Vamos (ir, ir + a + infinitive, transport).
 *
 * The learner can already like, want, and order (M10). M11's job: the
 * wildly irregular ir (voy/vas/va/vamos/van), destinations with a + place
 * (and the al contraction from M7), the near future ir a + infinitive,
 * vamos a as "let's", and the vocabulary of getting around — transport,
 * places to go, and the time words to pin plans down.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m11-1  Ir — voy, vas, va
 *   es-m11-2  A + place — playa, cine, museo, mercado
 *   es-m11-3  Getting around town — autobús, metro, taxi, a pie
 *   es-m11-4  De viaje — tren, avión, boleto
 *   es-m11-5  The near future — voy a + infinitive, vamos & van
 *   es-m11-6  Listening focus — ahora, después, esta noche, el finde
 *   es-m11-7  Integration — making plans + speaking
 *   es-m11-8  M11 Mastery Test
 *
 * All listening here is sentence-level (M5+ ratchet). Nouns are taught
 * WITH their article on the card (el tren, la playa) while atom surfaces
 * stay bare (tren, playa) per the spine's gender rule.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, type EsAtom } from "../courseAtoms";
import {
  build,
  cloze,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabMcq,
} from "../grammarHelpers";
// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m10";

const COURSE_ID = "mock-1";

// ─── M11 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M11_ATOMS: EsAtom[] = [
  // ir and its present forms
  atom({ surface: "ir", meaningEn: "to go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "voy", meaningEn: "I go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "vas", meaningEn: "you go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "va", meaningEn: "he/she goes", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "vamos", meaningEn: "we go / let's go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "van", meaningEn: "they go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  // Transport
  atom({ surface: "viaje", meaningEn: "trip", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🧳" }),
  atom({ surface: "autobús", meaningEn: "bus", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚌" }),
  atom({ surface: "tren", meaningEn: "train", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚆" }),
  atom({ surface: "avión", meaningEn: "airplane", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "✈️" }),
  atom({ surface: "metro", meaningEn: "subway", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚇" }),
  atom({ surface: "taxi", meaningEn: "taxi", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚕" }),
  atom({ surface: "bicicleta", meaningEn: "bicycle", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f", emoji: "🚲" }),
  atom({ surface: "a pie", meaningEn: "on foot", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", emoji: "🚶" }),
  atom({ surface: "boleto", meaningEn: "ticket", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🎫" }),
  // Places to go
  atom({ surface: "playa", meaningEn: "beach", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f", emoji: "🏖️" }),
  atom({ surface: "cine", meaningEn: "movie theater", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🎬" }),
  atom({ surface: "museo", meaningEn: "museum", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🏛️" }),
  atom({ surface: "iglesia", meaningEn: "church", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f" }),
  atom({ surface: "mercado", meaningEn: "market", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🛒" }),
  atom({ surface: "centro", meaningEn: "downtown", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🌆" }),
  atom({ surface: "trabajo", meaningEn: "work / job", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "💼" }),
  atom({ surface: "fiesta", meaningEn: "party", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f", emoji: "🎉" }),
  // Time words for plans
  atom({ surface: "este fin de semana", meaningEn: "this weekend", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", emoji: "📅" }),
  atom({ surface: "después", meaningEn: "after / later", partOfSpeech: "adverb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "ahora", meaningEn: "now", partOfSpeech: "adverb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "esta noche", meaningEn: "tonight", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", emoji: "🌃" }),
];

// Shared distractor pool for transport/place image MCQs. Every emoji here
// has verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// checked at authoring time. iglesia has no viable glyph in the subset,
// so it never enters an image MCQ.
const AUTOBUS = { surface: "autobús", emoji: "🚌" };
const TREN = { surface: "tren", emoji: "🚆" };
const AVION = { surface: "avión", emoji: "✈️" };
const METRO = { surface: "metro", emoji: "🚇" };
const TAXI = { surface: "taxi", emoji: "🚕" };
const BICICLETA = { surface: "bicicleta", emoji: "🚲" };
const PLAYA = { surface: "playa", emoji: "🏖️" };
const MUSEO = { surface: "museo", emoji: "🏛️" };
const MERCADO = { surface: "mercado", emoji: "🛒" };

// ─── es-m11-1 — Ir: voy, vas, va ────────────────────────────────────────────

const M11_1: LessonContent = {
  id: "es-m11-1",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Ir — voy, vas, va",
  description: "The go-everywhere verb and its first three forms.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m11-1-info-ir",
      "ir — the go-everywhere verb",
      "ir means 'to go', and it is wildly irregular: yo voy, tú vas, él/ella/usted va, nosotros vamos, ellos/ustedes van. It never travels alone — a destination follows with a: Voy a la escuela. And remember from M7: a + el squeezes into al, so it's Voy al parque.",
      "grammar",
    ),
    vocab("es-m11-1-p-voy", "I go", "voy"),
    vocab("es-m11-1-p-vas", "you go", "vas"),
    sentenceMcq({
      id: "es-m11-1-q-voy",
      prompt: "'I go to school' — pick it.",
      correctText: "Voy a la escuela.",
      distractorsText: ["Vas a la escuela.", "Va a la escuela.", "Van a la escuela."],
      exercisedAtomSurfaces: ["voy"],
    }),
    sentenceMcq({
      id: "es-m11-1-q-vas",
      prompt: "Ask a friend: 'Where are you going?'",
      correctText: "¿A dónde vas?",
      distractorsText: ["¿A dónde voy?", "¿De dónde eres?", "¿Dónde estás?"],
      exercisedAtomSurfaces: ["vas"],
    }),
    vocab("es-m11-1-p-va", "he/she goes", "va"),
    sentenceMcq({
      id: "es-m11-1-q-ir",
      prompt: "Which infinitive means 'to go'?",
      correctText: "ir",
      distractorsText: ["ser", "estar", "tener"],
      exercisedAtomSurfaces: ["ir"],
    }),
    listeningCompSentence({
      id: "es-m11-1-lc-va",
      audioText: "Ella va al parque",
      correctMeaningEn: "She goes to the park",
      distractorsEn: ["He goes to the park", "She is in the park", "She goes to school"],
      exercisedAtomSurfaces: ["va"],
    }),
    speaking("es-m11-1-speak-voy", "Voy a la escuela.", "I go to school.", ["voy"]),
  ],
};

// ─── es-m11-2 — A + place ───────────────────────────────────────────────────

const M11_2: LessonContent = {
  id: "es-m11-2",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿A dónde? — playa, cine, museo",
  description: "Four places worth going, and the a that takes you there.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m11-2-info-aplace",
      "a + place",
      "Every destination rides behind a: Voy a la playa, Voy al cine (a + el = al). Ask ¿A dónde vas? — 'where are you going TO?' — and answer with any place you know.",
      "grammar",
    ),
    vocab("es-m11-2-p-playa", "beach", "la playa", undefined, { atomId: "es:playa", emoji: "🏖️" }),
    vocab("es-m11-2-p-cine", "movie theater", "el cine", undefined, { atomId: "es:cine", emoji: "🎬" }),
    build(
      "es-m11-2-build-playa",
      "Build: 'I'm going to the beach.'",
      "Voy a la playa",
      ["Voy", "a", "la", "playa", "al"],
      ["Voy", "a", "la", "playa"],
      ["voy", "playa"],
    ),
    sentenceMcq({
      id: "es-m11-2-q-cine",
      prompt: "'I'm going to the movies' — pick it.",
      correctText: "Voy al cine.",
      distractorsText: ["Voy a el cine.", "Voy a la cine.", "Voy del cine."],
      explanation: "Masculine place, so the a and the article squeeze into one little word.",
      exercisedAtomSurfaces: ["voy", "cine"],
    }),
    vocab("es-m11-2-p-museo", "museum", "el museo", undefined, { atomId: "es:museo", emoji: "🏛️" }),
    vocab("es-m11-2-p-mercado", "market", "el mercado", undefined, { atomId: "es:mercado", emoji: "🛒" }),
    listeningCompSentence({
      id: "es-m11-2-lc-museo",
      audioText: "Ella va al museo",
      correctMeaningEn: "She goes to the museum",
      distractorsEn: ["She goes to the market", "He goes to the museum", "She is in the museum"],
      exercisedAtomSurfaces: ["va", "museo"],
    }),
    translateStep({
      id: "es-m11-2-tr-mercado",
      promptEn: "I'm going to the market",
      acceptedAnswers: ["voy al mercado", "Voy al mercado", "Voy al mercado."],
      audioText: "voy al mercado",
      exercisedAtomSurfaces: ["voy", "mercado"],
    }),
  ],
};

// ─── es-m11-3 — Getting around town ─────────────────────────────────────────

const M11_3: LessonContent = {
  id: "es-m11-3",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En metro, a pie — around town",
  description: "How you get there: bus, subway, taxi, or your own two feet.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m11-3-info-en",
      "en + transport",
      "The vehicle rides behind en: en autobús, en metro, en taxi, en carro. The one exception walks: a pie — 'on foot'. Voy al trabajo en metro; voy al parque a pie.",
      "grammar",
    ),
    phrase(
      "es-m11-3-p-autobus",
      "bus",
      "el autobús",
      "From city micros to sleek long-distance coaches, buses are how Latin America moves.",
      { atomId: "es:autobús", emoji: "🚌" },
    ),
    vocab("es-m11-3-p-metro", "subway", "el metro", undefined, { atomId: "es:metro", emoji: "🚇" }),
    vocabMcq(
      "es-m11-3-mcq-autobus",
      { surface: "autobús", meaningEn: "bus", emoji: "🚌" },
      [TAXI, TREN, AVION],
    ),
    vocabMcq(
      "es-m11-3-mcq-metro",
      { surface: "metro", meaningEn: "subway", emoji: "🚇" },
      [AUTOBUS, BICICLETA, TREN],
    ),
    vocab("es-m11-3-p-taxi", "taxi", "el taxi", undefined, { atomId: "es:taxi", emoji: "🚕" }),
    phrase("es-m11-3-p-apie", "on foot", "a pie", undefined, { emoji: "🚶" }),
    sentenceMcq({
      id: "es-m11-3-q-taxi",
      prompt: "'She goes to the hotel by taxi' — pick it.",
      correctText: "Ella va al hotel en taxi.",
      distractorsText: ["Ella va al hotel a taxi.", "Ella vas al hotel en taxi.", "Ella va al hotel con taxi."],
      exercisedAtomSurfaces: ["va", "taxi"],
    }),
    build(
      "es-m11-3-build-apie",
      "Build: 'I go to the park on foot.'",
      "Voy al parque a pie",
      ["Voy", "al", "parque", "a", "pie"],
      ["Voy", "al", "parque", "a", "pie"],
      ["voy", "a pie"],
    ),
  ],
};

// ─── es-m11-4 — De viaje: train, plane, ticket ──────────────────────────────

const M11_4: LessonContent = {
  id: "es-m11-4",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "De viaje — tren, avión, boleto",
  description: "Bigger trips need bigger machines — and a ticket.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    vocab("es-m11-4-p-tren", "train", "el tren", undefined, { atomId: "es:tren", emoji: "🚆" }),
    vocab("es-m11-4-p-avion", "airplane", "el avión", undefined, { atomId: "es:avión", emoji: "✈️" }),
    vocabMcq(
      "es-m11-4-mcq-tren",
      { surface: "tren", meaningEn: "train", emoji: "🚆" },
      [AVION, AUTOBUS, METRO],
    ),
    vocabMcq(
      "es-m11-4-mcq-avion",
      { surface: "avión", meaningEn: "airplane", emoji: "✈️" },
      [TREN, TAXI, BICICLETA],
    ),
    vocab("es-m11-4-p-viaje", "trip", "el viaje", undefined, { atomId: "es:viaje", emoji: "🧳" }),
    vocab("es-m11-4-p-boleto", "ticket", "el boleto", undefined, { atomId: "es:boleto", emoji: "🎫" }),
    sentenceMcq({
      id: "es-m11-4-q-viaje",
      prompt: "'the trip' — pick it.",
      correctText: "el viaje",
      distractorsText: ["el boleto", "el tren", "el aeropuerto"],
      exercisedAtomSurfaces: ["viaje"],
    }),
    build(
      "es-m11-4-build-boleto",
      "Build: 'I want a train ticket.'",
      "Quiero un boleto de tren",
      ["Quiero", "un", "boleto", "de", "tren"],
      ["Quiero", "un", "boleto", "de", "tren"],
      ["quiero", "boleto", "tren"],
    ),
    vocabMcq(
      "es-m11-4-mcq-bicicleta",
      { surface: "bicicleta", meaningEn: "bicycle", emoji: "🚲" },
      [TREN, AVION, TAXI],
    ),
  ],
};

// ─── es-m11-5 — The near future ─────────────────────────────────────────────

const M11_5: LessonContent = {
  id: "es-m11-5",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Voy a + infinitive — the near future",
  description: "Tomorrow without new endings: conjugate ir, add a, drop in a verb.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m11-5-info-nearfuture",
      "The near future: ir a + infinitive",
      "Conjugate ir, add a, then any infinitive: Voy a comer — I'm going to eat. ¿Vas a estudiar? — are you going to study? The nosotros form doubles as an invitation: ¡Vamos a bailar! means 'let's dance!'. And the last two forms of ir: nosotros vamos, ellos/ustedes van.",
      "grammar",
    ),
    vocab("es-m11-5-p-trabajo", "work / job", "el trabajo", undefined, { atomId: "es:trabajo", emoji: "💼" }),
    vocab("es-m11-5-p-fiesta", "party", "la fiesta", undefined, { atomId: "es:fiesta", emoji: "🎉" }),
    sentenceMcq({
      id: "es-m11-5-q-trabajo",
      prompt: "'I go to work' — pick it.",
      correctText: "Voy al trabajo.",
      distractorsText: ["Voy a la trabajo.", "Vas al trabajo.", "Voy del trabajo."],
      exercisedAtomSurfaces: ["voy", "trabajo"],
    }),
    sentenceMcq({
      id: "es-m11-5-q-fiesta",
      prompt: "Suggest: 'Let's go to the party!'",
      correctText: "¡Vamos a la fiesta!",
      distractorsText: ["¡Van a la fiesta!", "¡Vas a la fiesta!", "¡Voy a la fiesta!"],
      exercisedAtomSurfaces: ["vamos", "fiesta"],
    }),
    cloze(
      "es-m11-5-cloze-van",
      "ellos",
      "a bailar",
      "van",
      ["van", "va", "vamos", "voy"],
      "they are going to dance",
      "ellos van a bailar",
      "The ellos/ustedes form of ir.",
    ),
    vocabMcq(
      "es-m11-5-mcq-centro",
      { surface: "centro", meaningEn: "downtown", emoji: "🌆" },
      [PLAYA, MERCADO, MUSEO],
    ),
    listeningCompSentence({
      id: "es-m11-5-lc-vas",
      audioText: "¿Vas a trabajar mañana?",
      correctMeaningEn: "Are you going to work tomorrow?",
      distractorsEn: ["Are you working now?", "Is she going to work tomorrow?", "Are you going to the party tomorrow?"],
      exercisedAtomSurfaces: ["vas"],
    }),
    speaking("es-m11-5-speak-vamos", "Vamos a la playa.", "Let's go to the beach.", ["vamos", "playa"]),
  ],
};

// ─── es-m11-6 — Listening focus: pinning plans down ─────────────────────────

const M11_6: LessonContent = {
  id: "es-m11-6",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — ahora, después, esta noche",
  description: "When is it happening? Train your ear on the time words.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    vocab("es-m11-6-p-ahora", "now", "ahora"),
    vocab("es-m11-6-p-despues", "after / later", "después"),
    listeningCompSentence({
      id: "es-m11-6-lc-ahora",
      audioText: "Voy al banco ahora",
      correctMeaningEn: "I'm going to the bank now",
      distractorsEn: ["I'm going to the bank later", "I'm going to the park now", "He goes to the bank now"],
      exercisedAtomSurfaces: ["voy", "ahora"],
    }),
    listeningBuildSentence({
      id: "es-m11-6-lb-despues",
      target: "Voy a comer después",
      tiles: ["Voy", "a", "comer", "después", "ahora"],
      correctOrder: ["Voy", "a", "comer", "después"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["después", "voy"],
    }),
    phrase("es-m11-6-p-estanoche", "tonight", "esta noche", undefined, { emoji: "🌃" }),
    phrase("es-m11-6-p-finde", "this weekend", "este fin de semana", undefined, { emoji: "📅" }),
    listeningCompSentence({
      id: "es-m11-6-lc-estanoche",
      audioText: "Esta noche vamos al cine",
      correctMeaningEn: "Tonight we're going to the movies",
      distractorsEn: ["Tonight they're going to the movies", "This weekend we're going to the movies", "Tonight we're going to the market"],
      exercisedAtomSurfaces: ["esta noche", "vamos"],
    }),
    listeningBuildSentence({
      id: "es-m11-6-lb-finde",
      target: "Voy a la playa este fin de semana",
      tiles: ["Voy", "a", "la", "playa", "este", "fin", "de", "semana"],
      correctOrder: ["Voy", "a", "la", "playa", "este", "fin", "de", "semana"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["este fin de semana", "playa"],
    }),
    listeningCompSentence({
      id: "es-m11-6-lc-autobus",
      audioText: "Ellos van en autobús al centro",
      correctMeaningEn: "They're going downtown by bus",
      distractorsEn: ["They're going downtown by train", "We're going downtown by bus", "They're going to the beach by bus"],
      exercisedAtomSurfaces: ["van", "autobús", "centro"],
    }),
  ],
};

// ─── es-m11-7 — Integration: making plans ───────────────────────────────────

const M11_7: LessonContent = {
  id: "es-m11-7",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Vamos? — making plans",
  description: "Put ir to work: ask, answer, and make a plan out loud.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m11-7-info-dialogo",
      "A plan on the corner",
      "—¡Hola! ¿A dónde vas?\n—Voy al mercado. ¿Y tú?\n—Voy a la iglesia (church).\n—¿Vamos al cine esta noche?\n—¡Sí! ¡Hasta luego!\nEvery move here is ir + a — where you're going, and what you're going to do.",
      "default",
    ),
    vocab("es-m11-7-p-iglesia", "church", "la iglesia", undefined, { atomId: "es:iglesia" }),
    sentenceMcq({
      id: "es-m11-7-q-reply",
      prompt: "A friend asks: '¿A dónde vas?' — pick a natural reply.",
      correctText: "Voy al centro.",
      distractorsText: ["Soy de México.", "Está en la mesa.", "Tengo diez años."],
      exercisedAtomSurfaces: ["voy", "centro"],
    }),
    sentenceMcq({
      id: "es-m11-7-q-iglesia",
      prompt: "'She goes to church' — pick it.",
      correctText: "Ella va a la iglesia.",
      distractorsText: ["Ella va al iglesia.", "Ella vas a la iglesia.", "Ella va a la playa."],
      exercisedAtomSurfaces: ["va", "iglesia"],
    }),
    translateStep({
      id: "es-m11-7-tr-fiesta",
      promptEn: "We're going to the party tonight",
      acceptedAnswers: ["vamos a la fiesta esta noche", "Vamos a la fiesta esta noche", "Vamos a la fiesta esta noche."],
      audioText: "vamos a la fiesta esta noche",
      exercisedAtomSurfaces: ["vamos", "fiesta", "esta noche"],
    }),
    build(
      "es-m11-7-build-ir",
      "Build: 'Are you going to go to the movies?'",
      "¿Vas a ir al cine?",
      ["¿Vas", "a", "ir", "al", "cine?"],
      ["¿Vas", "a", "ir", "al", "cine?"],
      ["vas", "ir", "cine"],
    ),
    speaking("es-m11-7-speak-vas", "¿A dónde vas?", "Where are you going?", ["vas"]),
    translateStep({
      id: "es-m11-7-tr-playa",
      promptEn: "I'm going to the beach this weekend",
      acceptedAnswers: ["voy a la playa este fin de semana", "Voy a la playa este fin de semana", "Voy a la playa este fin de semana."],
      audioText: "voy a la playa este fin de semana",
      exercisedAtomSurfaces: ["voy", "playa", "este fin de semana"],
    }),
    speaking(
      "es-m11-7-speak-vamos",
      "Vamos al cine esta noche.",
      "Let's go to the movies tonight.",
      ["vamos", "cine", "esta noche"],
    ),
  ],
};

// ─── es-m11-8 — Mastery test ────────────────────────────────────────────────

const M11_8: LessonContent = {
  id: "es-m11-8",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M11 Mastery Test",
  description: "Ir in every person, destinations, transport, and the near future.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m11-8-q-vamos",
      prompt: "Which form of ir goes with nosotros?",
      correctText: "vamos",
      distractorsText: ["van", "voy", "va"],
      exercisedAtomSurfaces: ["vamos"],
    }),
    cloze(
      "es-m11-8-cloze-va",
      "ella",
      "al museo en metro",
      "va",
      ["va", "vas", "van", "voy"],
      "she goes to the museum by subway",
      "ella va al museo en metro",
    ),
    vocabMcq(
      "es-m11-8-mcq-tren",
      { surface: "tren", meaningEn: "train", emoji: "🚆" },
      [AVION, AUTOBUS, TAXI],
    ),
    translateStep({
      id: "es-m11-8-tr-fiesta",
      promptEn: "I'm going to the party tonight",
      acceptedAnswers: ["voy a la fiesta esta noche", "Voy a la fiesta esta noche", "Voy a la fiesta esta noche."],
      audioText: "voy a la fiesta esta noche",
      exercisedAtomSurfaces: ["voy", "fiesta", "esta noche"],
    }),
    listeningCompSentence({
      id: "es-m11-8-lc-centro",
      audioText: "Ellos van al centro en autobús",
      correctMeaningEn: "They go downtown by bus",
      distractorsEn: ["We go downtown by bus", "They go to the beach by bus", "They go downtown by train"],
      exercisedAtomSurfaces: ["van", "centro", "autobús"],
    }),
    listeningBuildSentence({
      id: "es-m11-8-lb-despues",
      target: "Voy a estudiar después",
      tiles: ["Voy", "a", "estudiar", "después", "ahora"],
      correctOrder: ["Voy", "a", "estudiar", "después"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["voy", "después"],
    }),
    sentenceMcq({
      id: "es-m11-8-q-nearfuture",
      prompt: "'She is going to cook' — pick it.",
      correctText: "Ella va a cocinar.",
      distractorsText: ["Ella va cocinar.", "Ella va a cocina.", "Ella vamos a cocinar."],
      exercisedAtomSurfaces: ["va"],
    }),
    sentenceMcq({
      id: "es-m11-8-q-boleto",
      prompt: "'I want a bus ticket' — pick it.",
      correctText: "Quiero un boleto de autobús.",
      distractorsText: ["Quiero un boleto de tren.", "Quiero una bicicleta de autobús.", "Quiero un viaje de taxi."],
      exercisedAtomSurfaces: ["quiero", "boleto", "autobús"],
    }),
    speaking(
      "es-m11-8-speak-ir",
      "¿Vas a ir al cine esta noche?",
      "Are you going to go to the movies tonight?",
      ["vas", "ir", "cine", "esta noche"],
    ),
  ],
};

export const ES_M11_LESSONS: LessonContent[] = [
  M11_1,
  M11_2,
  M11_3,
  M11_4,
  M11_5,
  M11_6,
  M11_7,
  M11_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M11_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m11",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m11",
          prompt: "'We are going to eat' — pick it.",
          correctText: "Vamos a comer.",
          distractorsText: ["Vamos comer.", "Vamos a comemos.", "Van a como."],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m11-1",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-m11-1",
          prompt: "Which form of ir goes with yo?",
          correctText: "voy",
          distractorsText: ["vas", "va", "van"],
        }),
    },
    {
      id: "pt-es-m11-2",
      moduleId: "m11",
      build: () =>
        cloze(
          "pt-es-m11-2",
          "ellos",
          "a bailar",
          "van",
          ["van", "va", "vamos", "vas"],
          "they are going to dance",
          "ellos van a bailar",
        ),
    },
    {
      id: "pt-es-m11-3",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-m11-3",
          prompt: "'I'm going to the movies' — pick it.",
          correctText: "Voy al cine.",
          distractorsText: ["Voy a el cine.", "Voy a la cine.", "Voy del cine."],
        }),
    },
    {
      id: "pt-es-m11-4",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-m11-4",
          prompt: "Suggest: 'Let's go to the beach!'",
          correctText: "¡Vamos a la playa!",
          distractorsText: ["¡Van a la playa!", "¡Voy a la playa!", "¡Vas a la playa!"],
        }),
    },
  ],
};
