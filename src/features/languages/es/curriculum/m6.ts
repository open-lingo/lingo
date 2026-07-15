/**
 * Spanish Module 6 — Números y tiempo (numbers 11–100, clock time, days, months).
 *
 * By M5 the learner can greet, introduce, describe, and present a family.
 * M6 gives them the clockwork: the teens (once–quince), the tens up to
 * cien with the y-connector of 31+, telling time (es la una / son las dos
 * y media / y cuarto), the seven lowercase days, and the date pattern
 * (el quince de enero). Heavy spaced recycling of m1 digits and m5 tener
 * (ages, "la semana tiene siete días").
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m6-1  Once a quince — the teens
 *   es-m6-2  Las decenas — 20 to 100, y in 31+
 *   es-m6-3  ¿Qué hora es? — es la una / son las dos
 *   es-m6-4  Y media, y cuarto — minutes past the hour
 *   es-m6-5  Los días de la semana
 *   es-m6-6  Listening focus — times, days, quantities
 *   es-m6-7  El calendario — months, dates + a street dialogue
 *   es-m6-8  M6 Mastery Test
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
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
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

// ─── es-m6-1 — The teens ────────────────────────────────────────────────────

const M6_1: LessonContent = {
  id: "es-m6-1",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Once a quince — 11 to 15",
  description: "Five new numbers with personalities of their own.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "es-m6-1-info-teens",
      "The teens",
      "Eleven through fifteen are their own words: once (11), doce (12), trece (13), catorce (14), quince (15). From sixteen on, Spanish just glues numbers together — dieciséis is 'diez y seis' said fast — so these five are the last number words you memorize one by one.",
      "grammar",
    ),
    vocab("es-m6-1-p-once", "eleven", "once"),
    vocab("es-m6-1-p-doce", "twelve", "doce"),
    sentenceMcq({
      id: "es-m6-1-q-once",
      prompt: "Which number is 'eleven'?",
      correctText: "once",
      distractorsText: ["doce", "trece", "catorce"],
      exercisedAtomSurfaces: ["once"],
    }),
    sentenceMcq({
      id: "es-m6-1-q-doce",
      prompt: "Which number is 'twelve'?",
      correctText: "doce",
      distractorsText: ["dos", "once", "quince"],
      explanation: "Twelve is the teen that starts like 'dos' but keeps going.",
      exercisedAtomSurfaces: ["doce"],
    }),
    vocab("es-m6-1-p-quince", "fifteen", "quince"),
    sentenceMcq({
      id: "es-m6-1-q-trece",
      prompt: "Which number is 'thirteen'?",
      correctText: "trece",
      distractorsText: ["catorce", "doce", "tres"],
      exercisedAtomSurfaces: ["trece"],
    }),
    sentenceMcq({
      id: "es-m6-1-q-quince",
      prompt: "Which number is 'fifteen'?",
      correctText: "quince",
      distractorsText: ["catorce", "cinco", "doce"],
      exercisedAtomSurfaces: ["quince"],
    }),
    sentenceMcq({
      id: "es-m6-1-q-catorce",
      prompt: "Which number is 'fourteen'?",
      correctText: "catorce",
      distractorsText: ["cuatro", "quince", "trece"],
      exercisedAtomSurfaces: ["catorce"],
    }),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m6-2-info-tens",
      "The tens",
      "veinte (20), treinta (30), cuarenta (40), cincuenta (50), sesenta (60), setenta (70), ochenta (80), noventa (90), cien (100). Twenty-something fuses into one word — veintiuno (21), veintidós (22). From 31 up, use y: treinta y uno, cuarenta y cinco, noventa y nueve.",
      "grammar",
    ),
    vocab("es-m6-2-p-veinte", "twenty", "veinte"),
    vocab("es-m6-2-p-cuarenta", "forty", "cuarenta"),
    sentenceMcq({
      id: "es-m6-2-q-veinte",
      prompt: "Which number is 'twenty'?",
      correctText: "veinte",
      distractorsText: ["treinta", "doce", "cincuenta"],
      exercisedAtomSurfaces: ["veinte"],
    }),
    sentenceMcq({
      id: "es-m6-2-q-cuarenta",
      prompt: "Which number is 'forty'?",
      correctText: "cuarenta",
      distractorsText: ["catorce", "cincuenta", "sesenta"],
      explanation: "Don't let the teen that sounds similar trick you — this is the ten.",
      exercisedAtomSurfaces: ["cuarenta"],
    }),
    vocab("es-m6-2-p-cien", "one hundred", "cien"),
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
    sentenceMcq({
      id: "es-m6-2-q-cien",
      prompt: "Which number is 'one hundred'?",
      correctText: "cien",
      distractorsText: ["sesenta", "setenta", "noventa"],
      exercisedAtomSurfaces: ["cien"],
    }),
    build(
      "es-m6-2-build-sesenta",
      "Build: 'sixty-seven'",
      "sesenta y siete",
      ["sesenta", "y", "siete", "setenta"],
      ["sesenta", "y", "siete"],
      ["sesenta"],
    ),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m6-3-info-hora",
      "Telling time",
      "Ask with ¿qué hora es? One o'clock is singular: es la una. Every other hour is plural: son las dos, son las tres, son las diez. The article is always feminine (la/las) because it agrees with hora.",
      "grammar",
    ),
    phrase("es-m6-3-p-quehoraes", "what time is it?", "¿qué hora es?"),
    vocab("es-m6-3-p-hora", "hour / time", "hora", undefined, { emoji: "⏰" }),
    sentenceMcq({
      id: "es-m6-3-q-ask",
      prompt: "You want to ask the time. What do you say?",
      correctText: "¿Qué hora es?",
      distractorsText: ["¿Cuántos años tienes?", "¿De dónde eres?", "¿Cómo te llamas?"],
      exercisedAtomSurfaces: ["¿qué hora es?"],
    }),
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
      id: "es-m6-3-q-launa",
      prompt: "It's 1 o'clock. How do you say it?",
      correctText: "es la una",
      distractorsText: ["son las una", "es las una", "son la una"],
      explanation: "One o'clock is the only hour that takes the singular verb form.",
      exercisedAtomSurfaces: ["hora"],
    }),
    sentenceMcq({
      id: "es-m6-3-q-sonlas",
      prompt: "It's 3 o'clock. How do you say it?",
      correctText: "son las tres",
      distractorsText: ["es la tres", "son la tres", "es las tres"],
      explanation: "Two o'clock and beyond takes the plural verb and plural article.",
      exercisedAtomSurfaces: ["tres"],
    }),
    listeningCompSentence({
      id: "es-m6-3-lc-cuatro",
      audioText: "son las cuatro",
      correctMeaningEn: "it's four o'clock",
      distractorsEn: ["it's one o'clock", "it's ten o'clock", "it's four thirty"],
      exercisedAtomSurfaces: ["cuatro"],
    }),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m6-4-info-minutos",
      "Minutes past the hour",
      "Add minutes with y: son las dos y diez (2:10). Two shortcuts do most of the work — y media (half past) and y cuarto (quarter past). So 2:30 is son las dos y media, and 5:15 is son las cinco y cuarto.",
      "grammar",
    ),
    vocab("es-m6-4-p-media", "half (past)", "media"),
    vocab("es-m6-4-p-cuarto", "quarter", "cuarto"),
    cloze(
      "es-m6-4-cloze-media",
      "son las dos y",
      "",
      "media",
      ["media", "cuarto", "minuto", "hora"],
      "it's two thirty",
      "son las dos y media",
    ),
    cloze(
      "es-m6-4-cloze-cuarto",
      "son las cinco y",
      "",
      "cuarto",
      ["cuarto", "media", "minuto", "hora"],
      "it's five fifteen",
      "son las cinco y cuarto",
    ),
    vocab("es-m6-4-p-minuto", "minute", "minuto"),
    build(
      "es-m6-4-build-diez",
      "Build: 'It's ten thirty.'",
      "son las diez y media",
      ["son", "las", "diez", "y", "media", "cuarto"],
      ["son", "las", "diez", "y", "media"],
      ["media", "diez"],
    ),
    sentenceMcq({
      id: "es-m6-4-q-minuto",
      prompt: "Which word means 'minute'?",
      correctText: "minuto",
      distractorsText: ["hora", "media", "cuarto"],
      exercisedAtomSurfaces: ["minuto"],
    }),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m6-5-info-dias",
      "The seven days",
      "lunes, martes, miércoles, jueves, viernes, sábado, domingo — always lowercase in Spanish. Say 'on Monday' with el: el lunes. Weekdays end in -es and don't change in the plural (los lunes = on Mondays).",
      "grammar",
    ),
    vocab("es-m6-5-p-lunes", "Monday", "lunes"),
    vocab(
      "es-m6-5-p-semana",
      "week",
      "semana",
      "Calendars in the Spanish-speaking world usually start the week on lunes, not Sunday.",
      { emoji: "📅" },
    ),
    sentenceMcq({
      id: "es-m6-5-q-lunes",
      prompt: "Which day is 'Monday'?",
      correctText: "lunes",
      distractorsText: ["martes", "jueves", "domingo"],
      exercisedAtomSurfaces: ["lunes"],
    }),
    cloze(
      "es-m6-5-cloze-semana",
      "los días de la",
      "",
      "semana",
      ["semana", "hora", "casa", "mesa"],
      "the days of the week",
      "los días de la semana",
    ),
    sentenceMcq({
      id: "es-m6-5-q-hoy",
      prompt: "Today is Tuesday. Which sentence says that?",
      correctText: "hoy es martes",
      distractorsText: ["mañana es martes", "hoy es jueves", "hoy es sábado"],
      exercisedAtomSurfaces: ["hoy", "martes"],
    }),
    sentenceMcq({
      id: "es-m6-5-q-manana",
      prompt: "Tomorrow is Saturday. Which sentence says that?",
      correctText: "mañana es sábado",
      distractorsText: ["hoy es sábado", "mañana es domingo", "mañana es lunes"],
      exercisedAtomSurfaces: ["mañana", "sábado"],
    }),
    build(
      "es-m6-5-build-viernes",
      "Build: 'Today is Friday.'",
      "hoy es viernes",
      ["hoy", "es", "viernes", "miércoles"],
      ["hoy", "es", "viernes"],
      ["hoy", "viernes"],
    ),
    sentenceMcq({
      id: "es-m6-5-q-miercoles",
      prompt: "Which day is 'Wednesday'?",
      correctText: "miércoles",
      distractorsText: ["jueves", "martes", "viernes"],
      exercisedAtomSurfaces: ["miércoles"],
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
  ],
};

// ─── es-m6-6 — Listening focus ──────────────────────────────────────────────

const M6_6: LessonContent = {
  id: "es-m6-6",
  moduleId: "m6",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — times and days",
  description: "Train your ear on clock times, days, and bigger numbers.",
  estimatedMinutes: 6,
  xpReward: 14,
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
  estimatedMinutes: 6,
  xpReward: 15,
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
    vocab("es-m6-7-p-enero", "January", "enero"),
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
    // Text-front recognition for the no-emoji calendar nouns.
    vocabTextMcq("es-m6-7-vm-mes", "mes", ["semana", "día", "año"]),
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
    speaking("es-m6-7-speak-hora", "¿Qué hora es?", "What time is it?", ["¿qué hora es?"]),
    translateStep({
      id: "es-m6-7-tr-lunes",
      promptEn: "Today is Monday",
      acceptedAnswers: ["hoy es lunes", "Hoy es lunes", "hoy es lunes.", "Hoy es lunes."],
      audioText: "hoy es lunes",
      exercisedAtomSurfaces: ["hoy", "lunes"],
    }),
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
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m6-8-q-doce",
      prompt: "Which number is 'twelve'?",
      correctText: "doce",
      distractorsText: ["dos", "trece", "veinte"],
      exercisedAtomSurfaces: ["doce"],
    }),
    sentenceMcq({
      id: "es-m6-8-q-ochenta",
      prompt: "Which number is 'eighty'?",
      correctText: "ochenta",
      distractorsText: ["ocho", "noventa", "sesenta"],
      exercisedAtomSurfaces: ["ochenta"],
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
    sentenceMcq({
      id: "es-m6-8-q-sietemedia",
      prompt: "It's 7:30. What time is it in Spanish?",
      correctText: "son las siete y media",
      distractorsText: ["es la siete y media", "son las siete y cuarto", "son la siete media"],
      exercisedAtomSurfaces: ["media", "siete"],
    }),
    listeningCompSentence({
      id: "es-m6-8-lc-oncecuarto",
      audioText: "son las once y cuarto",
      correctMeaningEn: "it's eleven fifteen",
      distractorsEn: ["it's eleven thirty", "it's twelve fifteen", "it's one o'clock"],
      exercisedAtomSurfaces: ["once", "cuarto"],
    }),
    listeningBuildSentence({
      id: "es-m6-8-lb-sabado",
      target: "hoy es sábado",
      tiles: ["hoy", "es", "sábado", "domingo"],
      correctOrder: ["hoy", "es", "sábado"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hoy", "sábado"],
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
    speaking("es-m6-8-speak-diez", "Son las diez y media.", "It's ten thirty.", ["media"]),
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
