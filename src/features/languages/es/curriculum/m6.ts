/**
 * Spanish Module 6 — Números y tiempo (numbers 11–100, clock time, days, months).
 *
 * By M5 the learner can greet, introduce, describe, and present a family.
 * M6 gives them the clockwork: the teens (once–quince), the tens up to
 * cien with the y-connector of 31+, telling time (es la una / son las dos
 * y media / y cuarto), the seven lowercase days, and the date pattern
 * (el quince de enero). Heavy spaced recycling of m1 digits, m4 adjectives,
 * and m5 tener/family (ages, "mi hermana tiene catorce años").
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m6-1  Once a quince — the teens, in real sentences (ages, phones)
 *   es-m6-2  Las decenas — 20 to 100, y in 31+
 *   es-m6-3  ¿Qué hora es? — es la una / son las dos
 *   es-m6-4  Y media, y cuarto — minutes past the hour
 *   es-m6-5  Los días de la semana
 *   es-m6-6  Listening focus — times, days, quantities (now with production)
 *   es-m6-7  El calendario — months, dates + a street dialogue
 *   es-m6-8  M6 Mastery Test
 *
 * 2026-07-16 rewrite: m6-1/m6-3/m6-6 gained production (all three were
 * zero-production number-MCQ churn before); carriers now put numbers into
 * real sentences (ages, prices, phone numbers, times) instead of "which
 * number is X" grids; every topic lesson closes on a compounding review
 * tail drawing m1–m5 (digits, tener, family, ser, alto/bajo); one
 * selfExplain lands on the singular/plural + y media clock mechanic (L4)
 * and two more on the tens y-connector (L2) and el + weekday (L5).
 *
 * M5+ listening ratchet honored: every listening step here is
 * sentence-level (listening_build ≥3 tiles, full-sentence transcripts).
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, type EsAtom } from "../courseAtoms";
import {
  agreementCloze,
  build,
  cloze,
  dialogueListen,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  matchPairs,
  phrase,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";

// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m5";

const COURSE_ID = "mock-1";

// ─── M6 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M6_ATOMS: EsAtom[] = [
  // The teens (11–15 are their own words)
  atom({ surface: "once", meaningEn: "eleven", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "doce", meaningEn: "twelve", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "trece", meaningEn: "thirteen", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "catorce", meaningEn: "fourteen", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "quince", meaningEn: "fifteen", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  // The tens
  atom({ surface: "veinte", meaningEn: "twenty", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "treinta", meaningEn: "thirty", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "cuarenta", meaningEn: "forty", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "cincuenta", meaningEn: "fifty", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "sesenta", meaningEn: "sixty", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "setenta", meaningEn: "seventy", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "ochenta", meaningEn: "eighty", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "noventa", meaningEn: "ninety", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "cien", meaningEn: "one hundred", partOfSpeech: "noun", fromModule: "m6", kind: "vocab" }),
  // Clock time
  atom({ surface: "hora", meaningEn: "hour / time", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "f", emoji: "⏰" }),
  atom({ surface: "minuto", meaningEn: "minute", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "media", meaningEn: "half (past)", partOfSpeech: "other", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "cuarto", meaningEn: "quarter", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  // The week (days are lowercase in Spanish)
  atom({ surface: "lunes", meaningEn: "Monday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "martes", meaningEn: "Tuesday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "miércoles", meaningEn: "Wednesday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "jueves", meaningEn: "Thursday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "viernes", meaningEn: "Friday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "sábado", meaningEn: "Saturday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "domingo", meaningEn: "Sunday", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "semana", meaningEn: "week", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "f", emoji: "📅" }),
  atom({ surface: "mes", meaningEn: "month", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  // Today / tomorrow + the first month
  atom({ surface: "hoy", meaningEn: "today", partOfSpeech: "adverb", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "mañana", meaningEn: "tomorrow / morning", partOfSpeech: "adverb", fromModule: "m6", kind: "vocab" }),
  atom({ surface: "enero", meaningEn: "January", partOfSpeech: "noun", fromModule: "m6", kind: "vocab", gender: "m" }),
  atom({ surface: "¿qué hora es?", meaningEn: "what time is it?", partOfSpeech: "phrase", fromModule: "m6", kind: "phrase" }),
];

// Distractor pool for the two emoji-bearing m6 atoms (hora, semana) —
// borrowed emoji atoms from m4/m5, already registered by the time this
// file's factories run (import "./m5" pulls in m4 transitively).
const CASA = { surface: "casa", emoji: "🏠" };
const GATO = { surface: "gato", emoji: "🐱" };
const CARRO = { surface: "carro", emoji: "🚗" };
const FAMILIA = { surface: "familia", emoji: "👪" };

// ─── es-m6-1 — The teens, in real sentences ─────────────────────────────────

const M6_1: LessonContent = {
  id: "es-m6-1",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Once a quince — 11 to 15",
  description: "Five new numbers, put to work on ages, phones, and prices.",
  estimatedMinutes: 6,
  xpReward: 12,
  steps: [
    infoStep(
      "es-m6-1-info-teens",
      "The teens",
      "Eleven through fifteen are their own words: once (11), doce (12), trece (13), catorce (14), quince (15). From sixteen on, Spanish just glues numbers together — dieciséis is 'diez y seis' said fast — so these five are the last number words you memorize one by one.",
      "grammar",
    ),
    build(
      "es-m6-1-build-once",
      "Build: 'I am eleven years old.'",
      "tengo once años",
      ["tengo", "once", "años", "doce", "tienes"],
      ["tengo", "once", "años"],
      ["once", "tengo"],
    ),
    sentenceMcq({
      id: "es-m6-1-q-hermana",
      prompt: "Mi hermana tiene catorce años. — how old is she?",
      correctText: "fourteen",
      distractorsText: ["four", "forty", "thirteen"],
      exercisedAtomSurfaces: ["catorce"],
    }),
    cloze(
      "es-m6-1-cloze-trece",
      "mi hermano tiene",
      "años",
      "trece",
      ["trece", "treinta", "tres", "catorce"],
      "my brother is thirteen years old",
      "mi hermano tiene trece años",
    ),
    speaking("es-m6-1-speak-doce", "tengo doce años", "I am twelve years old", ["doce"]),
    build(
      "es-m6-1-build-quince",
      "Build: 'My grandmother has fifteen grandchildren.'",
      "mi abuela tiene quince nietos",
      ["mi", "abuela", "tiene", "quince", "nietos", "catorce"],
      ["mi", "abuela", "tiene", "quince", "nietos"],
      ["catorce"],
    ),
    sentenceMcq({
      id: "es-m6-1-q-quince2",
      prompt: "El libro cuesta quince dólares. — what does the book cost?",
      correctText: "fifteen dollars",
      distractorsText: ["five dollars", "fifty dollars", "twelve dollars"],
      exercisedAtomSurfaces: ["quince"],
    }),
    translateStep({
      id: "es-m6-1-tr-catorce",
      promptEn: "I am fourteen years old",
      acceptedAnswers: [
        "tengo catorce años",
        "Tengo catorce años",
        "tengo catorce años.",
        "Tengo catorce años.",
        "yo tengo catorce años",
      ],
      audioText: "tengo catorce años",
      exercisedAtomSurfaces: ["catorce"],
    }),
    cloze(
      "es-m6-1-cloze-trece2",
      "el carro cuesta",
      "mil dólares",
      "trece",
      ["trece", "tres", "treinta", "catorce"],
      "the car costs thirteen thousand dollars",
      "el carro cuesta trece mil dólares",
    ),
    listeningCompSentence({
      id: "es-m6-1-lc-numero",
      audioText: "mi número es uno, uno, catorce",
      correctMeaningEn: "my number is one, one, fourteen",
      distractorsEn: ["my number is one, one, four", "my number is one, four, one", "my number is eleven, four"],
      exercisedAtomSurfaces: ["catorce"],
    }),
    build(
      "es-m6-1-build-doce",
      "Build: 'My sister is twelve years old.'",
      "mi hermana tiene doce años",
      ["mi", "hermana", "tiene", "doce", "años", "trece"],
      ["mi", "hermana", "tiene", "doce", "años"],
      ["doce", "hermana"],
    ),
    sentenceMcq({
      id: "es-m6-1-q-once",
      prompt: "Vivo en el apartamento once. — which apartment number?",
      correctText: "eleven",
      distractorsText: ["one", "twelve", "twenty-one"],
      exercisedAtomSurfaces: ["once"],
    }),
    listeningBuildSentence({
      id: "es-m6-1-lb-trece",
      target: "tengo trece años",
      tiles: ["tengo", "trece", "años", "catorce"],
      correctOrder: ["tengo", "trece", "años"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["trece"],
    }),
    speaking("es-m6-1-speak-once", "mi hermano tiene once años", "My brother is eleven years old", ["once"]),
    infoStep(
      "es-m6-1-info-win",
      "Five numbers, endless uses",
      "You can now give an age, a phone digit, or a price with once through quince — and you did it in real sentences, not a number chart.",
      "win",
    ),
  ],
};

// ─── es-m6-2 — The tens ─────────────────────────────────────────────────────

const M6_2: LessonContent = {
  id: "es-m6-2",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Las decenas — 20 to 100",
  description: "Count by tens to one hundred, and glue numbers with y.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m6-2-info-tens",
      "The tens",
      "veinte (20), treinta (30), cuarenta (40), cincuenta (50), sesenta (60), setenta (70), ochenta (80), noventa (90), cien (100). Twenty-something fuses into one word — veintiuno (21), veintidós (22). From 31 up, use y: treinta y uno, cuarenta y cinco, noventa y nueve.",
      "grammar",
    ),
    build(
      "es-m6-2-build-veinte",
      "Build: 'I have twenty dollars.'",
      "tengo veinte dólares",
      ["tengo", "veinte", "dólares", "treinta"],
      ["tengo", "veinte", "dólares"],
      ["treinta"],
    ),
    sentenceMcq({
      id: "es-m6-2-q-abuelo",
      prompt: "Mi abuelo tiene ochenta años. — how old is he?",
      correctText: "eighty",
      distractorsText: ["eight", "eighteen", "ninety"],
      exercisedAtomSurfaces: ["ochenta"],
    }),
    cloze(
      "es-m6-2-cloze-y",
      "treinta",
      "cinco",
      "y",
      ["y", "o", "es", "en"],
      "thirty-five",
      "treinta y cinco",
      "From 31 up, tens and units are joined by the connector.",
    ),
    speaking("es-m6-2-speak-cien", "el examen tiene cien preguntas", "the exam has a hundred questions", ["cien"]),
    build(
      "es-m6-2-build-sesenta",
      "Build: 'sixty-seven'",
      "sesenta y siete",
      ["sesenta", "y", "siete", "setenta"],
      ["sesenta", "y", "siete"],
      ["sesenta"],
    ),
    selfExplain({
      id: "es-m6-2-se-y",
      anchorLabel: "You just wrote: sesenta y siete (67).",
      anchorAudioText: "sesenta y siete",
      question: "Why does sesenta y siete need the word y, but veinte (20) alone doesn't?",
      rule: {
        text: "y only joins a ten to a unit (31 and up: treinta y uno). A bare multiple of ten — veinte, treinta, cien — needs no connector because there's nothing to join it to.",
      },
      surface: {
        text: "y is required on every number that has more than one digit, including plain tens like veinte.",
      },
      distractor: {
        text: "y is only used with numbers above cincuenta (50) — smaller tens like treinta y cuarenta never take it.",
      },
      ruleExplanation: "The connector y links a ten to the unit after it (treinta y cinco); a round ten by itself is already a complete word.",
    }),
    sentenceMcq({
      id: "es-m6-2-q-precio",
      prompt: "El carro cuesta cuarenta mil dólares. — what's the price, in thousands?",
      correctText: "forty",
      distractorsText: ["fourteen", "fifty", "sesenta"],
      exercisedAtomSurfaces: ["cuarenta"],
    }),
    translateStep({
      id: "es-m6-2-tr-noventa",
      promptEn: "My grandmother is ninety years old",
      acceptedAnswers: [
        "mi abuela tiene noventa años",
        "Mi abuela tiene noventa años",
        "mi abuela tiene noventa años.",
        "Mi abuela tiene noventa años.",
      ],
      audioText: "mi abuela tiene noventa años",
      exercisedAtomSurfaces: ["noventa"],
    }),
    cloze(
      "es-m6-2-cloze-cien",
      "el examen tiene",
      "preguntas",
      "cien",
      ["cien", "diez", "cincuenta", "cuarenta"],
      "the exam has a hundred questions",
      "el examen tiene cien preguntas",
    ),
    listeningCompSentence({
      id: "es-m6-2-lc-setenta",
      audioText: "mi número es setenta y dos",
      correctMeaningEn: "my number is seventy-two",
      distractorsEn: ["my number is seventeen", "my number is sixty-two", "my number is ninety-two"],
      exercisedAtomSurfaces: ["setenta"],
    }),
    listeningBuildSentence({
      id: "es-m6-2-lb-sesenta",
      target: "mi número es sesenta y cuatro",
      tiles: ["mi", "número", "es", "sesenta", "y", "cuatro", "setenta"],
      correctOrder: ["mi", "número", "es", "sesenta", "y", "cuatro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["sesenta"],
    }),
    // Review grid — the whole decade row in one recognition sweep.
    matchPairs("es-m6-2", [
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
      "cien",
    ]),
    speaking("es-m6-2-speak-cuarenta", "tengo cuarenta años", "I am forty years old", ["cuarenta"]),
    // Review tail — earlier-module recall in a fresh number sentence.
    reviewMatchPairs("es-m6-2-rev", "es-m6-2-rev-seed", "m6", 6),
    sentenceMcq({
      id: "es-m6-2-q-review",
      prompt: "Mi perro tiene ocho años y es muy simpático. — pick the meaning.",
      correctText: "my dog is eight years old and very friendly",
      distractorsText: [
        "my dog is eighteen years old and very friendly",
        "my cat is eight years old and very friendly",
        "my dog is eight years old and very tall",
      ],
      exercisedAtomSurfaces: ["ochenta"],
    }),
    translateStep({
      id: "es-m6-2-tr-review",
      promptEn: "My brother is tall and twenty years old",
      acceptedAnswers: [
        "mi hermano es alto y tiene veinte años",
        "Mi hermano es alto y tiene veinte años",
        "mi hermano es alto y tiene veinte años.",
      ],
      audioText: "mi hermano es alto y tiene veinte años",
      exercisedAtomSurfaces: ["veinte"],
    }),
  ],
};

// ─── es-m6-3 — Telling time ─────────────────────────────────────────────────

const M6_3: LessonContent = {
  id: "es-m6-3",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Qué hora es?",
  description: "Ask the time and answer on the hour.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m6-3-info-hora",
      "Telling time",
      "Ask with ¿qué hora es? One o'clock is singular: es la una. Every other hour is plural: son las dos, son las tres, son las diez. The article is always feminine (la/las) because it agrees with hora.",
      "grammar",
    ),
    phrase("es-m6-3-p-quehoraes", "what time is it?", "¿qué hora es?"),
    vocabMcq("es-m6-3-mcq-hora", { surface: "hora", meaningEn: "hour / time", emoji: "⏰" }, [CASA, GATO, FAMILIA]),
    sentenceMcq({
      id: "es-m6-3-q-ask",
      prompt: "Perdón, ¿qué hora es? — a stranger just asked you this. What did they want to know?",
      correctText: "the time",
      distractorsText: ["your name", "your age", "where you're from"],
      exercisedAtomSurfaces: ["hora", "¿qué hora es?"],
    }),
    build(
      "es-m6-3-build-launa",
      "Build: 'It's one o'clock.'",
      "es la una",
      ["es", "la", "una", "son", "las"],
      ["es", "la", "una"],
      ["son", "las"],
    ),
    cloze(
      "es-m6-3-cloze-hora",
      "¿qué",
      "es?",
      "hora",
      ["hora", "minuto", "casa", "día"],
      "what time is it?",
      "¿qué hora es?",
    ),
    sentenceMcq({
      id: "es-m6-3-q-sonlas",
      prompt: "Son las tres. Tengo hambre. — what time is it in the first sentence?",
      correctText: "three o'clock",
      distractorsText: ["one o'clock", "thirteen o'clock", "thirty o'clock"],
      exercisedAtomSurfaces: ["hora"],
    }),
    speaking("es-m6-3-speak-launa", "es la una", "It's one o'clock", ["hora"]),
    listeningCompSentence({
      id: "es-m6-3-lc-cuatro",
      audioText: "son las cuatro",
      correctMeaningEn: "it's four o'clock",
      distractorsEn: ["it's one o'clock", "it's ten o'clock", "it's fourteen o'clock"],
      exercisedAtomSurfaces: ["hora"],
    }),
    translateStep({
      id: "es-m6-3-tr-sonlasdiez",
      promptEn: "It's ten o'clock",
      acceptedAnswers: ["son las diez", "Son las diez", "son las diez.", "Son las diez."],
      audioText: "son las diez",
      exercisedAtomSurfaces: ["hora"],
    }),
    listeningBuildSentence({
      id: "es-m6-3-lb-once",
      target: "son las once",
      tiles: ["son", "las", "once", "doce", "trece"],
      correctOrder: ["son", "las", "once"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["once"],
    }),
    // Review tail — recall an earlier-module verb (ser/tener) inside a
    // time-adjacent sentence.
    reviewMatchPairs("es-m6-3-rev", "es-m6-3-rev-seed", "m6", 6),
    sentenceMcq({
      id: "es-m6-3-q-review",
      prompt: "Son las nueve y mi hermano es alto y simpático. — what time does the sentence open with?",
      correctText: "nine o'clock",
      distractorsText: ["nineteen o'clock", "ninety o'clock", "one o'clock"],
      exercisedAtomSurfaces: ["hora"],
    }),
    speaking("es-m6-3-speak-review", "mi hermana es muy inteligente", "My sister is very intelligent", ["hermana"]),
    infoStep(
      "es-m6-3-info-win",
      "You can tell the time",
      "Ask ¿qué hora es? and answer with es la una or son las... — the clock is yours from here.",
      "win",
    ),
  ],
};

// ─── es-m6-4 — Minutes past the hour ────────────────────────────────────────

const M6_4: LessonContent = {
  id: "es-m6-4",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Y media, y cuarto",
  description: "Half past, quarter past, and minutes with y.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m6-4-info-minutos",
      "Minutes past the hour",
      "Add minutes with y: son las dos y diez (2:10). Two shortcuts do most of the work — y media (half past) and y cuarto (quarter past). So 2:30 is son las dos y media, and 5:15 is son las cinco y cuarto.",
      "grammar",
    ),
    vocab("es-m6-4-p-media", "half (past)", "media"),
    cloze(
      "es-m6-4-cloze-media",
      "son las dos y",
      "",
      "media",
      ["media", "cuarto", "minuto", "hora"],
      "it's two thirty",
      "son las dos y media",
    ),
    translateStep({
      id: "es-m6-4-tr-dosymedia",
      promptEn: "It's two thirty",
      acceptedAnswers: [
        "son las dos y media",
        "Son las dos y media",
        "son las dos y media.",
        "Son las dos y media.",
        "son las dos y treinta",
      ],
      audioText: "son las dos y media",
      exercisedAtomSurfaces: ["media"],
    }),
    vocab("es-m6-4-p-cuarto", "quarter", "cuarto"),
    build(
      "es-m6-4-build-cuarto",
      "Build: 'It's five fifteen.'",
      "son las cinco y cuarto",
      ["son", "las", "cinco", "y", "cuarto", "media"],
      ["son", "las", "cinco", "y", "cuarto"],
      ["media"],
    ),
    listeningCompSentence({
      id: "es-m6-4-lc-diezmedia",
      audioText: "son las diez y media",
      correctMeaningEn: "it's ten thirty",
      distractorsEn: ["it's ten fifteen", "it's ten o'clock", "it's eleven thirty"],
      exercisedAtomSurfaces: ["cuarto", "media"],
    }),
    sentenceMcq({
      id: "es-m6-4-q-minuto",
      prompt: "Espera un minuto, por favor. — what is the speaker asking for?",
      correctText: "a minute",
      distractorsText: ["an hour", "a half hour", "a quarter hour"],
      exercisedAtomSurfaces: ["minuto"],
    }),
    speaking("es-m6-4-speak-cuarto", "son las cinco y cuarto", "It's five fifteen", ["cuarto"]),
    selfExplain({
      id: "es-m6-4-se-clock",
      anchorLabel: "You just said: son las cinco y cuarto — it's five fifteen.",
      anchorAudioText: "son las cinco y cuarto",
      question: "Why is it son (not es) las cinco, and why doesn't media change to medio?",
      rule: {
        text: "son/las agree with hora being plural (more than one o'clock — everything but 1:00 uses son las). media stays fixed because it silently agrees with the feminine hora ('half an hour'), not with the number of the hour.",
      },
      surface: {
        text: "son is just the normal way Spanish says 'it's' for any time, and media is a fixed clock word with no agreement at all.",
      },
      distractor: {
        text: "son las cinco is plural because cinco itself is a plural number — media would change to medio if the hour were masculine.",
      },
      ruleExplanation: "The verb and article agree with hora (feminine, and plural for every hour except one); media is a frozen feminine form tied to hora, not to the hour number.",
    }),
    listeningBuildSentence({
      id: "es-m6-4-lb-siete",
      target: "son las siete y cuarto",
      tiles: ["son", "las", "siete", "y", "cuarto", "media"],
      correctOrder: ["son", "las", "siete", "y", "cuarto"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["cuarto"],
    }),
    // Review tail.
    reviewMatchPairs("es-m6-4-rev", "es-m6-4-rev-seed", "m6", 6),
    sentenceMcq({
      id: "es-m6-4-q-review",
      prompt: "Son las ocho y media. Mi papá es alto y tiene un carro nuevo. — what time is it?",
      correctText: "eight thirty",
      distractorsText: ["eight fifteen", "eighteen o'clock", "eight o'clock"],
      exercisedAtomSurfaces: ["media"],
    }),
    build(
      "es-m6-4-build-review",
      "Build: 'My grandfather is eighty years old.'",
      "mi abuelo tiene ochenta años",
      ["mi", "abuelo", "tiene", "ochenta", "años", "noventa"],
      ["mi", "abuelo", "tiene", "ochenta", "años"],
      ["noventa"],
    ),
    infoStep(
      "es-m6-4-info-win",
      "You can read any clock",
      "Hour, half, and quarter — you can now say almost any time you'll actually need in conversation.",
      "win",
    ),
  ],
};

// ─── es-m6-5 — Days of the week ─────────────────────────────────────────────

const M6_5: LessonContent = {
  id: "es-m6-5",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Los días de la semana",
  description: "Seven lowercase days, plus hoy and mañana.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m6-5-info-dias",
      "The seven days",
      "lunes, martes, miércoles, jueves, viernes, sábado, domingo — always lowercase in Spanish. Say 'on Monday' with el: el lunes. Weekdays end in -es and don't change in the plural (los lunes = on Mondays).",
      "grammar",
    ),
    vocab("es-m6-5-p-lunes", "Monday", "lunes"),
    vocabMcq("es-m6-5-mcq-semana", { surface: "semana", meaningEn: "week", emoji: "📅" }, [CASA, CARRO, FAMILIA]),
    sentenceMcq({
      id: "es-m6-5-q-lunes",
      prompt: "El lunes tengo clase. — what day does the speaker have class?",
      correctText: "Monday",
      distractorsText: ["Tuesday", "Thursday", "Sunday"],
      exercisedAtomSurfaces: ["lunes"],
    }),
    build(
      "es-m6-5-build-hoy",
      "Build: 'Today is Tuesday.'",
      "hoy es martes",
      ["hoy", "es", "martes", "jueves"],
      ["hoy", "es", "martes"],
      ["jueves"],
    ),
    cloze(
      "es-m6-5-cloze-semana",
      "los días de la",
      "",
      "semana",
      ["semana", "hora", "casa", "mesa"],
      "the days of the week",
      "los días de la semana",
    ),
    speaking("es-m6-5-speak-domingo", "hoy es domingo", "Today is Sunday", ["domingo"]),
    sentenceMcq({
      id: "es-m6-5-q-manana",
      prompt: "Mañana es sábado. — which day is tomorrow?",
      correctText: "Saturday",
      distractorsText: ["Sunday", "Monday", "Friday"],
      exercisedAtomSurfaces: ["mañana", "sábado"],
    }),
    selfExplain({
      id: "es-m6-5-se-dia",
      anchorLabel: "You just read: el lunes tengo clase — on Monday I have class.",
      anchorAudioText: "el lunes tengo clase",
      question: "Why does el lunes mean 'on Monday' here, when el usually just means 'the'?",
      rule: {
        text: "Spanish drops any word for 'on' before a day — el/los + day already carries that meaning: el lunes = 'on Monday,' los lunes = 'on Mondays' (same spelling, no -s added to the day itself).",
      },
      surface: {
        text: "el lunes and los lunes are two separate, unrelated words that both happen to mean Monday-related things.",
      },
      distractor: {
        text: "el lunes means 'on Monday' only because tengo is a special verb that requires el before days; other verbs would need a different word for 'on'.",
      },
      ruleExplanation: "El/los + weekday IS the 'on' construction — no preposition needed, and the weekday noun itself stays unchanged between singular and plural.",
    }),
    vocab("es-m6-5-p-mañana", "tomorrow / morning", "mañana"),
    sentenceMcq({
      id: "es-m6-5-q-miercoles",
      prompt: "La reunión es el miércoles, no el jueves. — which day is the meeting?",
      correctText: "Wednesday",
      distractorsText: ["Thursday", "Tuesday", "Friday"],
      exercisedAtomSurfaces: ["miércoles"],
    }),
    translateStep({
      id: "es-m6-5-tr-viernes",
      promptEn: "Tomorrow is Friday",
      acceptedAnswers: [
        "mañana es viernes",
        "Mañana es viernes",
        "manana es viernes",
        "Manana es viernes",
        "mañana es viernes.",
      ],
      audioText: "mañana es viernes",
      exercisedAtomSurfaces: ["mañana", "viernes"],
    }),
    // Article agreement — días is masculine plural, semana feminine singular.
    agreementCloze(
      "es-m6-5-agr-semana",
      [
        { blank: { id: "b1", correctAnswer: "los", options: ["el", "la", "los", "las"] } },
        { text: " días de " },
        { blank: { id: "b2", correctAnswer: "la", options: ["el", "la", "los", "las"] } },
        { text: " semana" },
      ],
      "the days of the week",
      "los días de la semana",
      ["día", "semana"],
    ),
    listeningBuildSentence({
      id: "es-m6-5-lb-jueves",
      target: "la reunión es el jueves",
      tiles: ["la", "reunión", "es", "el", "jueves", "viernes"],
      correctOrder: ["la", "reunión", "es", "el", "jueves"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["jueves"],
    }),
    // Review tail.
    reviewMatchPairs("es-m6-5-rev", "es-m6-5-rev-seed", "m6", 6),
    sentenceMcq({
      id: "es-m6-5-q-review",
      prompt: "Mi abuelo tiene ochenta años y hoy es su cumpleaños. — 'cumpleaños' means birthday. What word tells you it's today?",
      correctText: "hoy",
      distractorsText: ["mañana", "lunes", "hora"],
      exercisedAtomSurfaces: ["hoy"],
    }),
    infoStep(
      "es-m6-5-info-win",
      "The week is yours",
      "Seven days, hoy, and mañana — you can now say when anything happens.",
      "win",
    ),
  ],
};

// ─── es-m6-6 — Listening focus (with production) ────────────────────────────

const M6_6: LessonContent = {
  id: "es-m6-6",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — times and days",
  description: "Train your ear on clock times, days, and bigger numbers — then say them back.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    listeningCompSentence({
      id: "es-m6-6-lc-tresymedia",
      audioText: "son las tres y media",
      correctMeaningEn: "it's three thirty",
      distractorsEn: ["it's three fifteen", "it's two thirty", "it's ten o'clock"],
      exercisedAtomSurfaces: ["media"],
    }),
    listeningBuildSentence({
      id: "es-m6-6-lb-once",
      target: "son las once",
      tiles: ["son", "las", "once", "doce", "trece"],
      correctOrder: ["son", "las", "once"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["once"],
    }),
    speaking("es-m6-6-speak-domingo", "hoy es domingo", "Today is Sunday", ["hoy", "domingo"]),
    listeningCompSentence({
      id: "es-m6-6-lc-domingo",
      audioText: "hoy es domingo",
      correctMeaningEn: "today is Sunday",
      distractorsEn: ["tomorrow is Sunday", "today is Saturday", "today is Thursday"],
      exercisedAtomSurfaces: ["hoy", "domingo"],
    }),
    listeningBuildSentence({
      id: "es-m6-6-lb-miercoles",
      target: "mañana es miércoles",
      tiles: ["mañana", "es", "miércoles", "martes"],
      correctOrder: ["mañana", "es", "miércoles"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mañana", "miércoles"],
    }),
    translateStep({
      id: "es-m6-6-tr-ochenta",
      promptEn: "My grandmother is eighty years old",
      acceptedAnswers: [
        "mi abuela tiene ochenta años",
        "Mi abuela tiene ochenta años",
        "mi abuela tiene ochenta años.",
        "Mi abuela tiene ochenta años.",
      ],
      audioText: "mi abuela tiene ochenta años",
      exercisedAtomSurfaces: ["ochenta"],
    }),
    listeningCompSentence({
      id: "es-m6-6-lc-ochenta",
      audioText: "mi abuela tiene ochenta años",
      correctMeaningEn: "my grandmother is eighty years old",
      distractorsEn: [
        "my grandmother is ninety years old",
        "my grandfather is eighty years old",
        "my sister is eighteen years old",
      ],
      exercisedAtomSurfaces: ["ochenta"],
    }),
    listeningBuildSentence({
      id: "es-m6-6-lb-semana",
      target: "la semana tiene siete días",
      tiles: ["la", "semana", "tiene", "siete", "días", "horas"],
      correctOrder: ["la", "semana", "tiene", "siete", "días"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["semana", "siete"],
    }),
    listeningCompSentence({
      id: "es-m6-6-lc-cuarto",
      audioText: "son las dos y cuarto",
      correctMeaningEn: "it's two fifteen",
      distractorsEn: ["it's two thirty", "it's four o'clock", "it's a quarter to two"],
      exercisedAtomSurfaces: ["cuarto"],
    }),
    speaking("es-m6-6-speak-cuarenta", "tengo cuarenta y dos años", "I am forty-two years old", ["cuarenta"]),
    listeningCompSentence({
      id: "es-m6-6-lc-lunes",
      audioText: "el lunes tengo clase",
      correctMeaningEn: "on Monday I have class",
      distractorsEn: ["on Tuesday I have class", "today I have class", "on Monday I have a car"],
      exercisedAtomSurfaces: ["lunes"],
    }),
    build(
      "es-m6-6-build-cincuenta",
      "Build: 'There are fifty books here.'",
      "hay cincuenta libros aquí",
      ["hay", "cincuenta", "libros", "aquí", "sesenta"],
      ["hay", "cincuenta", "libros", "aquí"],
      ["sesenta"],
    ),
    listeningCompSentence({
      id: "es-m6-6-lc-cincuenta",
      audioText: "hay cincuenta libros aquí",
      correctMeaningEn: "there are fifty books here",
      distractorsEn: [
        "there are fifteen books here",
        "there are sixty books here",
        "there are fifty tables here",
      ],
      exercisedAtomSurfaces: ["cincuenta"],
    }),
    // Review tail.
    reviewMatchPairs("es-m6-6-rev", "es-m6-6-rev-seed", "m6", 6),
    speaking("es-m6-6-speak-review", "mi hermano es alto y tiene veinte años", "My brother is tall and twenty years old", ["veinte"]),
    infoStep(
      "es-m6-6-info-win",
      "Your ear is trained",
      "Times, days, and numbers no longer need to be read — you can catch them by ear.",
      "win",
    ),
  ],
};

// ─── es-m6-7 — Integration: months, dates, and a street dialogue ────────────

const M6_7: LessonContent = {
  id: "es-m6-7",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "El calendario — dates & a dialogue",
  description: "Months, the date pattern, and everything in one conversation.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m6-7-info-dialogo",
      "On the street",
      "—Perdón, ¿qué hora es?\n—Son las nueve y cuarto.\n—Gracias. ¿Hoy es jueves?\n—No, hoy es viernes.\n—¡Gracias! ¡Hasta luego!\nEvery line is yours now — the time question, the day check, the courtesy words from M1.",
      "default",
    ),
    sentenceMcq({
      id: "es-m6-7-q-reply",
      prompt: "Someone asks: 'Perdón, ¿qué hora es?' — pick the natural reply.",
      correctText: "Son las nueve y cuarto.",
      distractorsText: ["Mucho gusto.", "Hasta luego.", "Tengo nueve años."],
      exercisedAtomSurfaces: ["cuarto"],
    }),
    infoStep(
      "es-m6-7-info-meses",
      "Months and dates",
      "The months — enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre — are lowercase, just like the days. Dates follow one pattern: el + number + de + month. January 15th is el quince de enero.",
      "grammar",
    ),
    vocab("es-m6-7-p-mes", "month", "mes"),
    cloze(
      "es-m6-7-cloze-mes",
      "un",
      "tiene treinta días",
      "mes",
      ["mes", "día", "semana", "hora"],
      "a month has thirty days",
      "un mes tiene treinta días",
    ),
    build(
      "es-m6-7-build-fecha",
      "Build: 'Today is January 15th.'",
      "hoy es el quince de enero",
      ["hoy", "es", "el", "quince", "de", "enero"],
      ["hoy", "es", "el", "quince", "de", "enero"],
      ["enero", "quince", "hoy"],
    ),
    // Text-front recognition for the no-emoji calendar nouns — spaced
    // from mes's passive card (i+3) and from each other by a generation beat.
    vocabTextMcq("es-m6-7-vm-mes", "mes", ["semana", "día", "año"]),
    speaking("es-m6-7-speak-hora", "¿Qué hora es?", "What time is it?", ["¿qué hora es?"]),
    vocabTextMcq("es-m6-7-vm-enero", "enero", ["lunes", "mes", "mañana"]),
    // The street exchange from the info card, now as real audio.
    dialogueListen({
      id: "es-m6-7-dlg-hora",
      lines: [
        { speaker: "Luis", text: "Perdón, ¿qué hora es?" },
        { speaker: "Ana", text: "Son las diez y media." },
        { speaker: "Luis", text: "Gracias. ¿Hoy es martes?" },
        { speaker: "Ana", text: "No, hoy es miércoles." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What time is it?",
          correctText: "Ten thirty",
          distractors: ["Ten fifteen", "Nine thirty", "Two o'clock"],
        },
        {
          id: "q2",
          prompt: "What day is today?",
          correctText: "Wednesday",
          distractors: ["Tuesday", "Thursday", "Saturday"],
        },
      ],
      exercisedAtomSurfaces: ["¿qué hora es?", "media", "hoy", "miércoles"],
    }),
    translateStep({
      id: "es-m6-7-tr-lunes",
      promptEn: "Today is Monday",
      acceptedAnswers: ["hoy es lunes", "Hoy es lunes", "hoy es lunes.", "Hoy es lunes."],
      audioText: "hoy es lunes",
      exercisedAtomSurfaces: ["hoy", "lunes"],
    }),
    // Review tail — closes the integration lesson with prior-module recall.
    reviewMatchPairs("es-m6-7-rev", "es-m6-7-rev-seed", "m6", 6),
    sentenceMcq({
      id: "es-m6-7-q-review",
      prompt: "Mi papá también tiene cuarenta años. — pick the meaning.",
      correctText: "my dad is also forty years old",
      distractorsText: [
        "my dad is also fourteen years old",
        "my mom is also forty years old",
        "my dad is also fifty years old",
      ],
      exercisedAtomSurfaces: ["cuarenta"],
    }),
    build(
      "es-m6-7-build-review",
      "Build: 'My grandmother's birthday is January 15th.'",
      "el cumpleaños de mi abuela es el quince de enero",
      ["el", "cumpleaños", "de", "mi", "abuela", "es", "el", "quince", "de", "enero"],
      ["el", "cumpleaños", "de", "mi", "abuela", "es", "el", "quince", "de", "enero"],
      ["quince", "enero", "abuela"],
    ),
    infoStep(
      "es-m6-7-info-win",
      "The whole calendar is yours",
      "Time, day, and date, all in one conversation — you just handled it like a native speaker would.",
      "win",
    ),
  ],
};

// ─── es-m6-8 — Mastery test ─────────────────────────────────────────────────

const M6_8: LessonContent = {
  id: "es-m6-8",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M6 Mastery Test",
  description: "Numbers 11–100, clock time, days, and dates.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "es-m6-8-q-doce",
      prompt: "Mi hermano tiene doce años. — how old is he?",
      correctText: "twelve",
      distractorsText: ["two", "twenty", "thirteen"],
      exercisedAtomSurfaces: ["doce"],
    }),
    cloze(
      "es-m6-8-cloze-y",
      "cuarenta",
      "dos",
      "y",
      ["y", "o", "de", "en"],
      "forty-two",
      "cuarenta y dos",
    ),
    listeningBuildSentence({
      id: "es-m6-8-lb-sabado",
      target: "hoy es sábado",
      tiles: ["hoy", "es", "sábado", "domingo"],
      correctOrder: ["hoy", "es", "sábado"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hoy", "sábado"],
    }),
    sentenceMcq({
      id: "es-m6-8-q-ochenta",
      prompt: "Which number is 'eighty'?",
      correctText: "ochenta",
      distractorsText: ["ocho", "noventa", "sesenta"],
      exercisedAtomSurfaces: ["ochenta"],
    }),
    listeningCompSentence({
      id: "es-m6-8-lc-oncecuarto",
      audioText: "son las once y cuarto",
      correctMeaningEn: "it's eleven fifteen",
      distractorsEn: ["it's eleven thirty", "it's twelve fifteen", "it's one o'clock"],
      exercisedAtomSurfaces: ["once", "cuarto"],
    }),
    translateStep({
      id: "es-m6-8-tr-jueves",
      promptEn: "Tomorrow is Thursday",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "mañana es jueves",
        "Mañana es jueves",
        "manana es jueves",
        "Manana es jueves",
        "mañana es jueves.",
      ],
      audioText: "mañana es jueves",
      exercisedAtomSurfaces: ["mañana", "jueves"],
    }),
    sentenceMcq({
      id: "es-m6-8-q-sietemedia",
      prompt: "It's 7:30. What time is it in Spanish?",
      correctText: "son las siete y media",
      distractorsText: ["es la siete y media", "son las siete y cuarto", "son la siete media"],
      exercisedAtomSurfaces: ["media", "hora"],
    }),
    speaking("es-m6-8-speak-diez", "Son las diez y media.", "It's ten thirty.", ["media"]),
    // Prior-module review items woven into the mastery sample.
    sentenceMcq({
      id: "es-m6-8-q-review1",
      prompt: "Mi hermana es alta y tiene treinta años. — pick the meaning.",
      correctText: "my sister is tall and thirty years old",
      distractorsText: [
        "my sister is short and thirty years old",
        "my brother is tall and thirty years old",
        "my sister is tall and thirteen years old",
      ],
      exercisedAtomSurfaces: ["treinta"],
    }),
    translateStep({
      id: "es-m6-8-tr-enero",
      promptEn: "Today is January 15th",
      acceptedAnswers: [
        "hoy es el quince de enero",
        "Hoy es el quince de enero",
        "hoy es el quince de enero.",
        "hoy es quince de enero",
        "Hoy es quince de enero",
      ],
      audioText: "hoy es el quince de enero",
      exercisedAtomSurfaces: ["enero", "quince"],
    }),
    build(
      "es-m6-8-build-review2",
      "Build: 'My grandfather has a red car.'",
      "mi abuelo tiene un carro rojo",
      ["mi", "abuelo", "tiene", "un", "carro", "rojo", "azul"],
      ["mi", "abuelo", "tiene", "un", "carro", "rojo"],
      ["azul"],
    ),
  ],
};

export const ES_M6_LESSONS: LessonContent[] = [
  M6_1,
  M6_2,
  M6_3,
  M6_4,
  M6_5,
  M6_6,
  M6_7,
  M6_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M6_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m6",
      moduleId: "m6",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m6",
          prompt: "It's 2:30. What time is it in Spanish?",
          correctText: "son las dos y media",
          distractorsText: ["es la dos y media", "son las dos y cuarto", "son la dos media"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m6-1",
      moduleId: "m6",
      build: () =>
        sentenceMcq({
          id: "pt-es-m6-1",
          prompt: "Which number is 'fifty'?",
          correctText: "cincuenta",
          distractorsText: ["quince", "sesenta", "cien"],
        }),
    },
    {
      id: "pt-es-m6-2",
      moduleId: "m6",
      build: () =>
        cloze(
          "pt-es-m6-2",
          "sesenta",
          "cinco",
          "y",
          ["y", "o", "de", "en"],
          "sixty-five",
          "sesenta y cinco",
        ),
    },
    {
      id: "pt-es-m6-3",
      moduleId: "m6",
      build: () =>
        sentenceMcq({
          id: "pt-es-m6-3",
          prompt: "'Today is Monday' — which is correct?",
          correctText: "hoy es lunes",
          distractorsText: ["mañana es lunes", "hoy es domingo", "hoy es viernes"],
        }),
    },
    {
      id: "pt-es-m6-4",
      moduleId: "m6",
      build: () =>
        sentenceMcq({
          id: "pt-es-m6-4",
          prompt: "It's 1 o'clock. How do you say it?",
          correctText: "es la una",
          distractorsText: ["son las una", "es las una", "son la una"],
        }),
    },
  ],
};
