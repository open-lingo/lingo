/**
 * Spanish Module 9 — Rutinas II (-er/-ir present + question words).
 *
 * M8 gave the learner the -ar engine; M9 completes the regular present
 * with the -er and -ir paradigms (como/comes/come/comemos/comen;
 * vivo/vives/vive/vivimos/viven) and hands over the full interrogative
 * set — qué, cuándo, cómo, cuánto, cuál, por qué — plus porque for the
 * answers. dónde (m7) and quién (m5) are recycled, not re-registered.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m9-1  -er verbs — comer, beber (+ con)
 *   es-m9-2  Leer y aprender — the -er family grows
 *   es-m9-3  -ir verbs — vivir, escribir, abrir, recibir
 *   es-m9-4  Questions I — qué, cuándo, cómo
 *   es-m9-5  Questions II — cuánto, cuál, ¿por qué? porque
 *   es-m9-6  Listening focus — questions & answers by ear
 *   es-m9-7  Integration — a first interview + speaking
 *   es-m9-8  M9 Mastery Test
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
import "./m8";

const COURSE_ID = "mock-1";

// ─── M9 atoms (exactly the spine allocation) ────────────────────────────────
// Emoji verified against the bundled Noto subset (src/pub/noto-emoji/svg,
// FE0F never in filenames): 1f37d, 1f964, 1f4d6, 1f393, 1f9e0, 1f3c3,
// 1f4b0, 1f3e0, 270d, 1f6aa, 2709, 1f4f0, 1f3e2.

export const ES_M9_ATOMS: EsAtom[] = [
  // Regular -er verbs
  atom({ surface: "comer", meaningEn: "to eat", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🍽️" }),
  atom({ surface: "beber", meaningEn: "to drink", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🥤" }),
  atom({ surface: "leer", meaningEn: "to read", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "📖" }),
  atom({ surface: "aprender", meaningEn: "to learn", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🎓" }),
  atom({ surface: "comprender", meaningEn: "to understand", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🧠" }),
  atom({ surface: "correr", meaningEn: "to run", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🏃" }),
  atom({ surface: "vender", meaningEn: "to sell", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "💰" }),
  // Regular -ir verbs
  atom({ surface: "vivir", meaningEn: "to live", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🏠" }),
  atom({ surface: "escribir", meaningEn: "to write", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "✍️" }),
  atom({ surface: "abrir", meaningEn: "to open", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🚪" }),
  atom({ surface: "recibir", meaningEn: "to receive", partOfSpeech: "verb", fromModule: "m9", kind: "vocab" }),
  // Question words (dónde is m7, quién is m5 — reused, never re-registered)
  atom({ surface: "qué", meaningEn: "what", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cuándo", meaningEn: "when", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cómo", meaningEn: "how", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cuánto", meaningEn: "how much", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cuál", meaningEn: "which", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "por qué", meaningEn: "why", partOfSpeech: "phrase", fromModule: "m9", kind: "phrase" }),
  atom({ surface: "porque", meaningEn: "because", partOfSpeech: "particle", fromModule: "m9", kind: "particle" }),
  // Everyday nouns
  atom({ surface: "comida", meaningEn: "food", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "f" }),
  atom({ surface: "carta", meaningEn: "letter", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "f", emoji: "✉️" }),
  atom({ surface: "periódico", meaningEn: "newspaper", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "m", emoji: "📰" }),
  atom({ surface: "apartamento", meaningEn: "apartment", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "m", emoji: "🏢" }),
  // Function words
  atom({ surface: "con", meaningEn: "with", partOfSpeech: "particle", fromModule: "m9", kind: "particle" }),
  atom({ surface: "sin", meaningEn: "without", partOfSpeech: "particle", fromModule: "m9", kind: "particle" }),
];

// ─── es-m9-1 — The -er pattern ──────────────────────────────────────────────

const M9_1: LessonContent = {
  id: "es-m9-1",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "-er verbs — comer, beber",
  description: "The -er endings and your first meals.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m9-1-info-er",
      "The -er pattern",
      "Regular -er verbs mirror the -ar recipe with e: yo como, tú comes, él/ella/usted come, nosotros comemos, ustedes/ellos/ellas comen. (Spain adds vosotros coméis — table-only here, never drilled.) Same five slots, new vowel.",
      "grammar",
    ),
    phrase("es-m9-1-p-comer", "to eat", "comer", undefined, { emoji: "🍽️" }),
    phrase("es-m9-1-p-beber", "to drink", "beber", undefined, { emoji: "🥤" }),
    sentenceMcq({
      id: "es-m9-1-q-como",
      prompt: "Yo ___ en casa todos los días. — pick the form that fits.",
      correctText: "como",
      distractorsText: ["comes", "come", "comen"],
      explanation: "The yo slot always takes -o, whatever the verb family.",
      exercisedAtomSurfaces: ["comer"],
    }),
    sentenceMcq({
      id: "es-m9-1-q-bebes",
      prompt: "Tú ___ agua. — pick the form that fits.",
      correctText: "bebes",
      distractorsText: ["bebo", "bebe", "bebemos"],
      explanation: "The tú form of an -er verb ends in -es.",
      exercisedAtomSurfaces: ["beber"],
    }),
    // Nouns are taught with their article from m3 on; the atom surface
    // stays the bare noun, so the card pins its atom id explicitly.
    phrase("es-m9-1-p-comida", "food", "la comida", undefined, { atomId: "es:comida" }),
    sentenceMcq({
      id: "es-m9-1-q-comemos",
      prompt: "Nosotros ___ la comida de mi abuela. — pick the form that fits.",
      correctText: "comemos",
      distractorsText: ["como", "comes", "comen"],
      exercisedAtomSurfaces: ["comer", "comida"],
    }),
    cloze(
      "es-m9-1-cloze-con",
      "como",
      "mi familia",
      "con",
      ["con", "sin", "y", "en"],
      "I eat with my family",
      "Como con mi familia.",
      "Names who joins the activity.",
    ),
    translateStep({
      id: "es-m9-1-tr-comida",
      promptEn: "The food is good.",
      acceptedAnswers: ["La comida es buena", "la comida es buena"],
      audioText: "La comida es buena.",
      exercisedAtomSurfaces: ["comida"],
    }),
    // Text-front recognition — comida carries no emoji.
    vocabTextMcq("es-m9-1-vm-comida", "comida", ["agua", "casa", "mesa"]),
  ],
};

// ─── es-m9-2 — The -er family grows ─────────────────────────────────────────

const M9_2: LessonContent = {
  id: "es-m9-2",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Leer y aprender",
  description: "Read, learn, understand, run — the -er family grows.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    phrase("es-m9-2-p-leer", "to read", "leer", undefined, { emoji: "📖" }),
    phrase("es-m9-2-p-periodico", "newspaper", "el periódico", undefined, {
      emoji: "📰",
      atomId: "es:periódico",
    }),
    sentenceMcq({
      id: "es-m9-2-q-leo",
      prompt: "Yo ___ un libro nuevo. — pick the form that fits.",
      correctText: "leo",
      distractorsText: ["lees", "lee", "leemos"],
      exercisedAtomSurfaces: ["leer"],
    }),
    sentenceMcq({
      id: "es-m9-2-q-periodico",
      prompt: "Mi papá lee ___ todos los días. — pick the phrase that fits.",
      correctText: "el periódico",
      distractorsText: ["la mochila", "el lápiz", "la llave"],
      exercisedAtomSurfaces: ["periódico", "leer"],
    }),
    phrase("es-m9-2-p-aprender", "to learn", "aprender", undefined, { emoji: "🎓" }),
    vocab("es-m9-2-p-comprender", "to understand", "comprender", undefined, { emoji: "🧠" }),
    sentenceMcq({
      id: "es-m9-2-q-aprendemos",
      prompt: "Nosotros ___ español todos los días. — pick the form that fits.",
      correctText: "aprendemos",
      distractorsText: ["aprendo", "aprendes", "aprenden"],
      exercisedAtomSurfaces: ["aprender"],
    }),
    sentenceMcq({
      id: "es-m9-2-q-comprende",
      prompt: "Ella no ___ el libro. — pick the form that fits.",
      correctText: "comprende",
      distractorsText: ["comprendo", "comprendes", "comprendemos"],
      exercisedAtomSurfaces: ["comprender"],
    }),
    build(
      "es-m9-2-build-correr",
      "Build: 'I need to run every day.'",
      "necesito correr todos los días",
      ["necesito", "correr", "todos", "los", "días", "corro"],
      ["necesito", "correr", "todos", "los", "días"],
      ["correr", "necesitar"],
    ),
  ],
};

// ─── es-m9-3 — The -ir pattern ──────────────────────────────────────────────

const M9_3: LessonContent = {
  id: "es-m9-3",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "-ir verbs — vivir, escribir",
  description: "-ir verbs: live, write, open, receive.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m9-3-info-ir",
      "The -ir pattern",
      "-ir verbs borrow every -er ending except one: nosotros takes -imos. vivo, vives, vive, vivimos, viven — and abrir and recibir follow right along: abro, abres… recibo, recibes… (Spain: vosotros vivís, table-only.)",
      "grammar",
    ),
    phrase("es-m9-3-p-vivir", "to live", "vivir", undefined, { emoji: "🏠" }),
    phrase("es-m9-3-p-apartamento", "apartment", "el apartamento", undefined, {
      emoji: "🏢",
      atomId: "es:apartamento",
    }),
    sentenceMcq({
      id: "es-m9-3-q-vivo",
      prompt: "Yo ___ en una ciudad grande. — pick the form that fits.",
      correctText: "vivo",
      distractorsText: ["vives", "vive", "vivimos"],
      exercisedAtomSurfaces: ["vivir"],
    }),
    sentenceMcq({
      id: "es-m9-3-q-apartamento",
      prompt: "Vivimos en ___ pequeño. — pick the phrase that fits.",
      correctText: "un apartamento",
      distractorsText: ["una casa", "un banco", "una tienda"],
      exercisedAtomSurfaces: ["apartamento", "vivir"],
    }),
    phrase("es-m9-3-p-escribir", "to write", "escribir", undefined, { emoji: "✍️" }),
    sentenceMcq({
      id: "es-m9-3-q-abre",
      prompt: "Ella ___ la puerta. — pick the form that fits.",
      correctText: "abre",
      distractorsText: ["abro", "abres", "abren"],
      exercisedAtomSurfaces: ["abrir"],
    }),
    translateStep({
      id: "es-m9-3-tr-carta",
      promptEn: "I write a letter to my grandmother.",
      acceptedAnswers: [
        "Escribo una carta a mi abuela",
        "escribo una carta a mi abuela",
        "Yo escribo una carta a mi abuela",
        "yo escribo una carta a mi abuela",
      ],
      audioText: "Escribo una carta a mi abuela.",
      exercisedAtomSurfaces: ["escribir", "carta"],
    }),
    sentenceMcq({
      id: "es-m9-3-q-recibimos",
      prompt: "Nosotros ___ las cartas en casa. — pick the form that fits.",
      correctText: "recibimos",
      distractorsText: ["recibo", "recibes", "reciben"],
      explanation: "The -imos ending is the one place -ir verbs break from -er.",
      exercisedAtomSurfaces: ["recibir", "carta"],
    }),
    // Text-front recognition — recibir carries no emoji.
    vocabTextMcq("es-m9-3-vm-recibir", "recibir", ["escribir", "abrir", "leer"]),
    // Review grid — the -er/-ir set taught so far in one recognition sweep.
    matchPairs("es-m9-3", [
      "comer",
      "beber",
      "leer",
      "aprender",
      "vivir",
      "escribir",
      "abrir",
      "correr",
    ]),
  ],
};

// ─── es-m9-4 — Questions I ──────────────────────────────────────────────────

const M9_4: LessonContent = {
  id: "es-m9-4",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Questions — qué, cuándo, cómo",
  description: "Ask what, when, and how — plus the upside-down ¿.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m9-4-info-preguntas",
      "Asking questions",
      "For a yes/no question, keep the words and raise your voice at the end — writing wraps it in ¿…?. For open questions, lead with a question word: qué (what), cuándo (when), cómo (how) — plus dónde and quién, which you already know. Question words always wear their accent, and the verb comes right after: ¿Qué comes? ¿Cuándo trabaja tu hermano?",
      "grammar",
    ),
    sentenceMcq({
      id: "es-m9-4-q-que",
      prompt: "Your friend is eating something. Ask what: 'Y tú, ¿___ comes?'",
      correctText: "qué",
      distractorsText: ["cuándo", "cómo", "quién"],
      exercisedAtomSurfaces: ["qué"],
    }),
    sentenceMcq({
      id: "es-m9-4-q-cuando",
      prompt: "You want to know which day your friend works. Ask: 'Y tú, ¿___ trabajas?'",
      correctText: "cuándo",
      distractorsText: ["qué", "cómo", "quién"],
      exercisedAtomSurfaces: ["cuándo", "trabajar"],
    }),
    sentenceMcq({
      id: "es-m9-4-q-como",
      prompt: "Complete the greeting you already know: 'Hola, ¿___ estás?'",
      correctText: "cómo",
      distractorsText: ["qué", "cuándo", "quién"],
      exercisedAtomSurfaces: ["cómo"],
    }),
    translateStep({
      id: "es-m9-4-tr-donde",
      promptEn: "Where do you live?",
      acceptedAnswers: [
        "¿Dónde vives?",
        "¿dónde vives?",
        "Dónde vives",
        "dónde vives",
        "Donde vives",
        "donde vives",
        "¿Donde vives?",
        "¿donde vives?",
      ],
      audioText: "¿Dónde vives?",
      exercisedAtomSurfaces: ["dónde", "vivir"],
    }),
    sentenceMcq({
      id: "es-m9-4-q-answer",
      prompt: "'¿Qué bebes?' — pick the natural answer.",
      correctText: "Bebo agua.",
      distractorsText: ["Vivo en México.", "Escribo una carta.", "Camino al parque."],
      exercisedAtomSurfaces: ["beber", "qué"],
    }),
    sentenceMcq({
      id: "es-m9-4-q-quien",
      prompt: "'Mira, ¿___ es ella?' — 'Es mi hermana.'",
      correctText: "quién",
      distractorsText: ["qué", "cómo", "cuándo"],
      exercisedAtomSurfaces: ["quién"],
    }),
    speaking("es-m9-4-speak-que", "¿Qué comes?", "What do you eat?", ["qué", "comer"]),
  ],
};

// ─── es-m9-5 — Questions II ─────────────────────────────────────────────────

const M9_5: LessonContent = {
  id: "es-m9-5",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Por qué? — porque",
  description: "Why and because — plus how much and which.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m9-5-info-porque",
      "Why? Because.",
      "por qué — two words, with accent — asks why. porque — one word, no accent — gives the reason: ¿Por qué estudias? Porque necesito trabajar. This lesson also adds cuánto (how much) and cuál (which one) to finish your question-word set.",
      "grammar",
    ),
    phrase("es-m9-5-p-vender", "to sell", "vender", undefined, { emoji: "💰" }),
    sentenceMcq({
      id: "es-m9-5-q-porque",
      prompt: "'¿Por qué vendes tu carro?' — '___ necesito dinero.'",
      correctText: "Porque",
      distractorsText: ["Por qué", "Sin", "Con"],
      explanation: "One word, no accent — it introduces the reason.",
      exercisedAtomSurfaces: ["porque"],
    }),
    sentenceMcq({
      id: "es-m9-5-q-vende",
      prompt: "Mi hermano ___ computadoras. — pick the form that fits.",
      correctText: "vende",
      distractorsText: ["vendo", "vendes", "vendemos"],
      exercisedAtomSurfaces: ["vender"],
    }),
    sentenceMcq({
      id: "es-m9-5-q-porque2",
      prompt: "You ask WHY your friend studies English: '¿___ estudias inglés?'",
      correctText: "Por qué",
      distractorsText: ["Porque", "Cuándo", "Cuánto"],
      explanation: "Two words with an accent ask the question.",
      exercisedAtomSurfaces: ["por qué", "estudiar"],
    }),
    sentenceMcq({
      id: "es-m9-5-q-cuanto",
      prompt: "At the market you ask the price: '¿___ es?'",
      correctText: "Cuánto",
      distractorsText: ["Cuál", "Cuándo", "Cómo"],
      exercisedAtomSurfaces: ["cuánto"],
    }),
    sentenceMcq({
      id: "es-m9-5-q-cual",
      prompt: "Two books are on the table. Ask which one is his: '¿___ es tu libro?'",
      correctText: "Cuál",
      distractorsText: ["Cuánto", "Cuándo", "Qué"],
      exercisedAtomSurfaces: ["cuál"],
    }),
    cloze(
      "es-m9-5-cloze-sin",
      "un apartamento",
      "ventanas",
      "sin",
      ["sin", "con", "de", "en"],
      "an apartment without windows",
      "un apartamento sin ventanas",
      "The opposite of having it along.",
    ),
    translateStep({
      id: "es-m9-5-tr-porque",
      promptEn: "I study Spanish because I live in Mexico.",
      acceptedAnswers: [
        "Estudio español porque vivo en México",
        "estudio español porque vivo en México",
        "Estudio espanol porque vivo en Mexico",
        "estudio espanol porque vivo en Mexico",
        "Yo estudio español porque vivo en México",
        "yo estudio español porque vivo en México",
      ],
      audioText: "Estudio español porque vivo en México.",
      exercisedAtomSurfaces: ["porque", "vivir", "estudiar"],
    }),
    // For-sale listing — each m4 adjective agrees with its own noun.
    agreementCloze(
      "es-m9-5-agr-vende",
      [
        { text: "Ellos venden una casa viej" },
        { blank: { id: "b1", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
        { text: " y un carro nuev" },
        { blank: { id: "b2", correctAnswer: "o", options: ["o", "a", "os", "as"] } },
        { text: "." },
      ],
      "they sell an old house and a new car",
      "Ellos venden una casa vieja y un carro nuevo.",
      ["vender", "casa", "carro", "viejo", "nuevo"],
    ),
  ],
};

// ─── es-m9-6 — Listening focus ──────────────────────────────────────────────

const M9_6: LessonContent = {
  id: "es-m9-6",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — questions by ear",
  description: "Questions and answers, by ear only.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "es-m9-6-lc-comen",
      audioText: "¿Dónde comen ustedes?",
      correctMeaningEn: "Where do you all eat?",
      distractorsEn: [
        "When do you all eat?",
        "What do you all eat?",
        "Where do you all live?",
      ],
      exercisedAtomSurfaces: ["comer", "dónde"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-abrir",
      target: "necesito abrir la ventana",
      tiles: ["necesito", "abrir", "la", "ventana", "abro"],
      correctOrder: ["necesito", "abrir", "la", "ventana"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["abrir", "necesitar"],
    }),
    listeningCompSentence({
      id: "es-m9-6-lc-lee",
      audioText: "Mi hermana lee el periódico todos los días.",
      correctMeaningEn: "My sister reads the newspaper every day.",
      distractorsEn: [
        "My sister writes the newspaper every day.",
        "My sister reads a letter every day.",
        "My sister reads the newspaper sometimes.",
      ],
      exercisedAtomSurfaces: ["leer", "periódico"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-vive",
      target: "ella vive en un apartamento",
      tiles: ["ella", "vive", "en", "un", "apartamento", "vivo"],
      correctOrder: ["ella", "vive", "en", "un", "apartamento"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["vivir", "apartamento"],
    }),
    listeningCompSentence({
      id: "es-m9-6-lc-corres",
      audioText: "¿Por qué corres al banco?",
      correctMeaningEn: "Why are you running to the bank?",
      distractorsEn: [
        "When are you running to the bank?",
        "Why are you walking to the bank?",
        "Why are you running to the park?",
      ],
      exercisedAtomSurfaces: ["correr", "por qué"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-aprendemos",
      target: "aprendemos español con música",
      tiles: ["aprendemos", "español", "con", "música", "aprenden"],
      correctOrder: ["aprendemos", "español", "con", "música"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["aprender", "con"],
    }),
    listeningCompSentence({
      id: "es-m9-6-lc-vende",
      audioText: "Él vende su carro porque necesita dinero.",
      correctMeaningEn: "He's selling his car because he needs money.",
      distractorsEn: [
        "He's buying his car because he needs money.",
        "He's selling his car because he needs a computer.",
        "He's selling his house because he needs money.",
      ],
      exercisedAtomSurfaces: ["vender", "porque"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-comprendes",
      target: "tú comprendes la carta",
      tiles: ["tú", "comprendes", "la", "carta", "comprendo"],
      correctOrder: ["tú", "comprendes", "la", "carta"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["comprender", "carta"],
    }),
  ],
};

// ─── es-m9-7 — Integration ──────────────────────────────────────────────────

const M9_7: LessonContent = {
  id: "es-m9-7",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Dónde vives? — a first interview",
  description: "A first interview: ask, answer, and say it out loud.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m9-7-info-entrevista",
      "A first interview",
      "—¿Dónde vives?\n—Vivo en un apartamento en la ciudad.\n—¿Qué comes todos los días?\n—Como con mi familia en casa.\n—¿Por qué estudias español?\n—Porque trabajo en México.\nEvery line runs on your question words and the new -er/-ir endings.",
      "default",
    ),
    sentenceMcq({
      id: "es-m9-7-q-reply1",
      prompt: "'¿Dónde vives?' — pick the natural answer.",
      correctText: "Vivo en la ciudad.",
      distractorsText: ["Como en la ciudad.", "Vivo los lunes.", "Escribo en la ciudad."],
      exercisedAtomSurfaces: ["vivir", "dónde"],
    }),
    build(
      "es-m9-7-build-como",
      "Build: 'I eat with my family.'",
      "como con mi familia",
      ["como", "con", "mi", "familia", "comes"],
      ["como", "con", "mi", "familia"],
      ["comer", "con"],
    ),
    sentenceMcq({
      id: "es-m9-7-q-reply2",
      prompt: "'¿Por qué estudias español?' — pick the answer that gives a reason.",
      correctText: "Porque trabajo en México.",
      distractorsText: ["Con mi familia.", "Los martes.", "En el banco."],
      exercisedAtomSurfaces: ["porque", "por qué"],
    }),
    // The interview continues — new questions, by ear this time.
    dialogueListen({
      id: "es-m9-7-dlg-entrevista",
      lines: [
        { speaker: "María", text: "¿Qué comes todos los días, Diego?" },
        { speaker: "Diego", text: "Como con mi familia en casa." },
        { speaker: "María", text: "¿Y qué bebes?" },
        { speaker: "Diego", text: "Bebo agua con la comida." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where does Diego eat every day?",
          correctText: "At home with his family",
          distractors: ["At a restaurant with friends", "At school", "At his grandmother's house"],
        },
        {
          id: "q2",
          prompt: "What does Diego drink with his food?",
          correctText: "Water",
          distractors: ["Coffee", "Milk", "Juice"],
        },
      ],
      exercisedAtomSurfaces: ["comer", "beber", "agua", "comida", "con", "qué"],
    }),
    translateStep({
      id: "es-m9-7-tr-lees",
      promptEn: "What do you read?",
      acceptedAnswers: [
        "¿Qué lees?",
        "¿qué lees?",
        "Qué lees",
        "qué lees",
        "Que lees",
        "que lees",
        "¿Que lees?",
        "¿que lees?",
      ],
      audioText: "¿Qué lees?",
      exercisedAtomSurfaces: ["qué", "leer"],
    }),
    speaking("es-m9-7-speak-donde", "¿Dónde vives?", "Where do you live?", [
      "dónde",
      "vivir",
    ]),
    sentenceMcq({
      id: "es-m9-7-q-cuando",
      prompt: "'¿Cuándo descansas?' — pick the natural answer.",
      correctText: "Los domingos.",
      distractorsText: ["En el banco.", "Con mi hermano.", "Porque trabajo."],
      exercisedAtomSurfaces: ["cuándo", "descansar"],
    }),
    speaking(
      "es-m9-7-speak-vivo",
      "Vivo en un apartamento pequeño.",
      "I live in a small apartment.",
      ["vivir", "apartamento"],
    ),
  ],
};

// ─── es-m9-8 — Mastery test ─────────────────────────────────────────────────

const M9_8: LessonContent = {
  id: "es-m9-8",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M9 Mastery Test",
  description: "-er/-ir paradigms and the full question-word set.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m9-8-q-comemos",
      prompt: "Nosotros ___ a las dos. — pick the form that fits.",
      correctText: "comemos",
      distractorsText: ["como", "comes", "comen"],
      exercisedAtomSurfaces: ["comer"],
    }),
    sentenceMcq({
      id: "es-m9-8-q-vivimos",
      prompt: "Mi amiga y yo ___ en la ciudad. — pick the form that fits.",
      correctText: "vivimos",
      distractorsText: ["vivo", "vives", "viven"],
      exercisedAtomSurfaces: ["vivir"],
    }),
    cloze(
      "es-m9-8-cloze-porque",
      "no como en casa",
      "trabajo mucho",
      "porque",
      ["porque", "por qué", "sin", "con"],
      "I don't eat at home because I work a lot",
      "No como en casa porque trabajo mucho.",
    ),
    sentenceMcq({
      id: "es-m9-8-q-cuando",
      prompt: "Ask when your friend arrives: 'Y tú, ¿___ llegas?'",
      correctText: "cuándo",
      distractorsText: ["cómo", "cuánto", "cuál"],
      exercisedAtomSurfaces: ["cuándo", "llegar"],
    }),
    listeningCompSentence({
      id: "es-m9-8-lc-escribe",
      audioText: "Mi madre escribe una carta a su amiga.",
      correctMeaningEn: "My mother writes a letter to her friend.",
      distractorsEn: [
        "My mother reads a letter to her friend.",
        "My mother writes a letter to her sister.",
        "My mother receives a letter from her friend.",
      ],
      exercisedAtomSurfaces: ["escribir", "carta"],
    }),
    translateStep({
      id: "es-m9-8-tr-vendes",
      promptEn: "Why are you selling your house?",
      acceptedAnswers: [
        "¿Por qué vendes tu casa?",
        "¿por qué vendes tu casa?",
        "Por qué vendes tu casa",
        "por qué vendes tu casa",
        "Por que vendes tu casa",
        "por que vendes tu casa",
        "¿Por que vendes tu casa?",
        "¿por que vendes tu casa?",
      ],
      audioText: "¿Por qué vendes tu casa?",
      exercisedAtomSurfaces: ["por qué", "vender"],
    }),
    sentenceMcq({
      id: "es-m9-8-q-recibir",
      prompt: "Which verb means 'to receive'?",
      correctText: "recibir",
      distractorsText: ["abrir", "aprender", "comprender"],
      exercisedAtomSurfaces: ["recibir"],
    }),
    listeningBuildSentence({
      id: "es-m9-8-lb-beben",
      target: "ellos beben agua con la comida",
      tiles: ["ellos", "beben", "agua", "con", "la", "comida", "bebo"],
      correctOrder: ["ellos", "beben", "agua", "con", "la", "comida"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["beber", "comida", "con"],
    }),
    speaking("es-m9-8-speak-cuanto", "¿Cuánto es?", "How much is it?", ["cuánto"]),
  ],
};

export const ES_M9_LESSONS: LessonContent[] = [
  M9_1,
  M9_2,
  M9_3,
  M9_4,
  M9_5,
  M9_6,
  M9_7,
  M9_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M9_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m9",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m9",
          prompt: "Nosotros ___ en un apartamento pequeño. — pick the form that fits.",
          correctText: "vivimos",
          distractorsText: ["vivo", "viven", "vives"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m9-1",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-m9-1",
          prompt: "Yo ___ agua con la comida. — pick the form that fits.",
          correctText: "bebo",
          distractorsText: ["bebes", "bebe", "bebemos"],
        }),
    },
    {
      id: "pt-es-m9-2",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-m9-2",
          prompt: "'Y tú, ¿___ trabajas?' — 'Los lunes.'",
          correctText: "cuándo",
          distractorsText: ["qué", "cómo", "cuál"],
        }),
    },
    {
      id: "pt-es-m9-3",
      moduleId: "m9",
      build: () =>
        cloze(
          "pt-es-m9-3",
          "no trabajo hoy",
          "estoy enfermo",
          "porque",
          ["porque", "por qué", "sin", "con"],
          "I'm not working today because I'm sick",
          "No trabajo hoy porque estoy enfermo.",
        ),
    },
    {
      id: "pt-es-m9-4",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-m9-4",
          prompt: "Ella ___ una carta a su amiga. — pick the form that fits.",
          correctText: "escribe",
          distractorsText: ["escribo", "escribes", "escriben"],
        }),
    },
  ],
};
