/**
 * Spanish Module 3 — Género y artículos (gender, articles, plurals, hay).
 *
 * The learner can introduce themselves; M3 hands them the nouns of daily
 * life and the machinery that goes around every one of them: grammatical
 * gender (-o/-a plus the famous exceptions el día and la mano), definite
 * el/la/los/las, indefinite un/una, plural formation (-s/-es), and hay
 * for what exists in a room or a bag.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m3-1  Gender + el/la — la casa, el libro
 *   es-m3-2  The -a crowd — mesa, silla, puerta, ventana
 *   es-m3-3  Un, una — desk objects
 *   es-m3-4  Los, las — plurals (-s / -es)
 *   es-m3-5  Hay — existence, en, aquí + the exceptions
 *   es-m3-6  Listening focus — articles by ear
 *   es-m3-7  Integration — a look around the house + speaking
 *   es-m3-8  M3 Mastery Test
 *
 * Per the spine, phrase cards teach nouns WITH their article (la casa)
 * while atom surfaces stay bare (casa) so match grids remain single-word.
 * M3 listening stays at short-phrase level (allowed m2–m4).
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
  vocabMcq,
} from "../grammarHelpers";

// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m2";

const COURSE_ID = "mock-1";

// ─── M3 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M3_ATOMS: EsAtom[] = [
  // Articles (definite + indefinite)
  atom({ surface: "el", meaningEn: "the (m)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "la", meaningEn: "the (f)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "los", meaningEn: "the (m pl)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "las", meaningEn: "the (f pl)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "un", meaningEn: "a (m)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "una", meaningEn: "a (f)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  // Around the house
  atom({ surface: "casa", meaningEn: "house", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🏠" }),
  atom({ surface: "libro", meaningEn: "book", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📖" }),
  atom({ surface: "mesa", meaningEn: "table", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f" }),
  atom({ surface: "silla", meaningEn: "chair", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🪑", hint: "ll sounds like y: SEE-ya" }),
  atom({ surface: "puerta", meaningEn: "door", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🚪" }),
  atom({ surface: "ventana", meaningEn: "window", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🪟" }),
  // Desk & bag
  atom({ surface: "teléfono", meaningEn: "phone", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "☎️", hint: "stress the accented é: te-LE-fo-no" }),
  atom({ surface: "celular", meaningEn: "cell phone", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📱" }),
  atom({ surface: "computadora", meaningEn: "computer", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f" }),
  atom({ surface: "lápiz", meaningEn: "pencil", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "✏️", hint: "z sounds like s in Latin America: LA-pees" }),
  atom({ surface: "pluma", meaningEn: "pen", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🖊️" }),
  atom({ surface: "papel", meaningEn: "paper", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📄" }),
  atom({ surface: "mochila", meaningEn: "backpack", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🎒" }),
  atom({ surface: "llave", meaningEn: "key", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🔑", hint: "ll sounds like y: YA-ve" }),
  atom({ surface: "dinero", meaningEn: "money", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "💰" }),
  atom({ surface: "agua", meaningEn: "water", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "💧", hint: "feminine — but the singular pairs with el: el agua" }),
  // The exceptions + odds and ends
  atom({ surface: "día", meaningEn: "day", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📅", hint: "the accented í gets its own beat: DEE-a" }),
  atom({ surface: "mano", meaningEn: "hand", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "✋" }),
  atom({ surface: "cosa", meaningEn: "thing", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f" }),
  atom({ surface: "hay", meaningEn: "there is / there are", partOfSpeech: "verb", fromModule: "m3", kind: "vocab", hint: "silent h — sounds like English 'eye'" }),
  atom({ surface: "en", meaningEn: "in / on / at", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "aquí", meaningEn: "here", partOfSpeech: "adverb", fromModule: "m3", kind: "vocab", hint: "qu is a plain k: a-KEE" }),
];

// Shared distractor pool for object-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// 1f3e0, 1f4d6, 1fa91, 1f6aa, 1fa9f, 260e, 1f4f1, 270f, 1f58a, 1f4c4,
// 1f392, 1f511, 1f4b0, checked at authoring time. (💻 is NOT in the
// subset, so computadora ships without emoji; mesa and cosa have no
// faithful glyph.)
const CASA = { surface: "casa", emoji: "🏠" };
const LIBRO = { surface: "libro", emoji: "📖" };
const SILLA = { surface: "silla", emoji: "🪑" };
const PUERTA = { surface: "puerta", emoji: "🚪" };
const VENTANA = { surface: "ventana", emoji: "🪟" };
const CELULAR = { surface: "celular", emoji: "📱" };
const LAPIZ = { surface: "lápiz", emoji: "✏️" };
const PLUMA = { surface: "pluma", emoji: "🖊️" };
const PAPEL = { surface: "papel", emoji: "📄" };
const MOCHILA = { surface: "mochila", emoji: "🎒" };
const LLAVE = { surface: "llave", emoji: "🔑" };
const DINERO = { surface: "dinero", emoji: "💰" };

// ─── es-m3-1 — Gender + el/la ───────────────────────────────────────────────

const M3_1: LessonContent = {
  id: "es-m3-1",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "El libro, la casa — gender",
  description: "Every Spanish noun picks a side. Meet el and la.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "es-m3-1-info-genero",
      "Every noun has a gender",
      "Spanish nouns are masculine or feminine — the word itself, not the object. Words ending in -o are usually masculine, -a usually feminine, and 'the' matches: el libro (the book), la casa (the house). From here on, learn every noun together with its article — it carries the gender for you.",
      "grammar",
    ),
    phrase("es-m3-1-p-lacasa", "the house", "la casa", undefined, { atomId: "es:casa", emoji: "🏠" }),
    phrase("es-m3-1-p-ellibro", "the book", "el libro", undefined, { atomId: "es:libro", emoji: "📖" }),
    vocabMcq(
      "es-m3-1-mcq-casa",
      { surface: "casa", meaningEn: "house", emoji: "🏠" },
      [LIBRO, PUERTA, LLAVE],
    ),
    sentenceMcq({
      id: "es-m3-1-q-ellibro",
      prompt: "'The book' — pick it.",
      correctText: "el libro",
      distractorsText: ["la libro", "el casa", "la casa"],
      explanation: "Words ending in -o are usually masculine, and the article agrees.",
      exercisedAtomSurfaces: ["el", "libro"],
    }),
    cloze(
      "es-m3-1-cz-la",
      "",
      "casa",
      "la",
      ["la", "el", "los", "un"],
      "the house",
      "la casa",
    ),
    cloze(
      "es-m3-1-cz-el",
      "",
      "libro",
      "el",
      ["el", "la", "los", "una"],
      "the book",
      "el libro",
    ),
    listeningCompSentence({
      id: "es-m3-1-lc-lacasa",
      audioText: "la casa",
      correctMeaningEn: "the house",
      distractorsEn: ["the book", "the door", "the table"],
      exercisedAtomSurfaces: ["la", "casa"],
    }),
    build(
      "es-m3-1-b-casaylibro",
      "Build: 'the house and the book'",
      "la casa y el libro",
      ["la", "casa", "y", "el", "libro"],
      ["la", "casa", "y", "el", "libro"],
      ["casa", "libro"],
    ),
  ],
};

// ─── es-m3-2 — The -a crowd ─────────────────────────────────────────────────

const M3_2: LessonContent = {
  id: "es-m3-2",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "La mesa, la silla — the -a crowd",
  description: "Four corners of a room, all feminine.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m3-2-info-a",
      "Four rooms-worth of -a",
      "Today's words all end in -a and all take la: la mesa (table), la silla (chair), la puerta (door), la ventana (window). Say the article as part of the word — that habit will carry you through the exceptions later.",
      "grammar",
    ),
    phrase("es-m3-2-p-mesa", "the table", "la mesa", undefined, { atomId: "es:mesa" }),
    phrase("es-m3-2-p-silla", "the chair", "la silla", undefined, { atomId: "es:silla", emoji: "🪑" }),
    sentenceMcq({
      id: "es-m3-2-q-mesa",
      prompt: "'The table' — pick it.",
      correctText: "la mesa",
      distractorsText: ["el mesa", "la silla", "la casa"],
      exercisedAtomSurfaces: ["la", "mesa"],
    }),
    vocabMcq(
      "es-m3-2-mcq-silla",
      { surface: "silla", meaningEn: "chair", emoji: "🪑" },
      [PUERTA, VENTANA, LLAVE],
    ),
    phrase("es-m3-2-p-puerta", "the door", "la puerta", undefined, { atomId: "es:puerta", emoji: "🚪" }),
    phrase("es-m3-2-p-ventana", "the window", "la ventana", undefined, { atomId: "es:ventana", emoji: "🪟" }),
    vocabMcq(
      "es-m3-2-mcq-puerta",
      { surface: "puerta", meaningEn: "door", emoji: "🚪" },
      [VENTANA, SILLA, CASA],
    ),
    vocabMcq(
      "es-m3-2-mcq-ventana",
      { surface: "ventana", meaningEn: "window", emoji: "🪟" },
      [PUERTA, MOCHILA, LIBRO],
    ),
  ],
};

// ─── es-m3-3 — Un, una ──────────────────────────────────────────────────────

const M3_3: LessonContent = {
  id: "es-m3-3",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Un lápiz, una pluma — a/an",
  description: "The indefinite pair, with everything on your desk.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m3-3-info-ununa",
      "Un, una — a/an",
      "'A/an' splits the same way as 'the': un for masculine, una for feminine. un teléfono, un lápiz — una computadora, una pluma. Same gender, different job: el points at THE one, un means any one.",
      "grammar",
    ),
    phrase("es-m3-3-p-telefono", "a phone", "un teléfono", undefined, { atomId: "es:teléfono", emoji: "☎️" }),
    phrase("es-m3-3-p-computadora", "a computer", "una computadora", undefined, { atomId: "es:computadora" }),
    vocabMcq(
      "es-m3-3-mcq-telefono",
      { surface: "teléfono", meaningEn: "phone", emoji: "☎️" },
      [CELULAR, LAPIZ, PLUMA],
    ),
    sentenceMcq({
      id: "es-m3-3-q-computadora",
      prompt: "'A computer' — pick it.",
      correctText: "una computadora",
      distractorsText: ["un computadora", "una teléfono", "un celular"],
      exercisedAtomSurfaces: ["una", "computadora"],
    }),
    phrase("es-m3-3-p-lapiz", "a pencil", "un lápiz", undefined, { atomId: "es:lápiz", emoji: "✏️" }),
    cloze(
      "es-m3-3-cz-una",
      "",
      "pluma",
      "una",
      ["una", "un", "la", "el"],
      "a pen",
      "una pluma",
    ),
    vocabMcq(
      "es-m3-3-mcq-lapiz",
      { surface: "lápiz", meaningEn: "pencil", emoji: "✏️" },
      [PLUMA, PAPEL, CELULAR],
    ),
    cloze(
      "es-m3-3-cz-un",
      "",
      "celular",
      "un",
      ["un", "una", "el", "los"],
      "a cell phone",
      "un celular",
    ),
  ],
};

// ─── es-m3-4 — Los, las (plurals) ───────────────────────────────────────────

const M3_4: LessonContent = {
  id: "es-m3-4",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Los libros, las llaves — plurals",
  description: "More than one: plural articles and the -s / -es rule.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m3-4-info-plural",
      "Los, las — and how nouns pluralize",
      "Plural 'the': los for masculine, las for feminine. The noun grows too — add -s after a vowel (libro → libros, llave → llaves) and -es after a consonant (papel → papeles). Article and noun always move together: el libro → los libros.",
      "grammar",
    ),
    phrase("es-m3-4-p-mochila", "the backpack", "la mochila", undefined, { atomId: "es:mochila", emoji: "🎒" }),
    phrase("es-m3-4-p-llave", "the key", "la llave", undefined, { atomId: "es:llave", emoji: "🔑" }),
    vocabMcq(
      "es-m3-4-mcq-mochila",
      { surface: "mochila", meaningEn: "backpack", emoji: "🎒" },
      [LLAVE, LIBRO, PAPEL],
    ),
    cloze(
      "es-m3-4-cz-las",
      "",
      "llaves",
      "las",
      ["las", "los", "la", "el"],
      "the keys",
      "las llaves",
    ),
    vocabMcq(
      "es-m3-4-mcq-llave",
      { surface: "llave", meaningEn: "key", emoji: "🔑" },
      [MOCHILA, PLUMA, PUERTA],
    ),
    cloze(
      "es-m3-4-cz-los",
      "",
      "papeles",
      "los",
      ["los", "las", "el", "la"],
      "the papers",
      "los papeles",
    ),
    sentenceMcq({
      id: "es-m3-4-q-papel",
      prompt: "'The paper' (just one) — pick it.",
      correctText: "el papel",
      distractorsText: ["los papeles", "la papel", "las papel"],
      exercisedAtomSurfaces: ["el", "papel"],
    }),
    sentenceMcq({
      id: "es-m3-4-q-cosas",
      prompt: "'The things' — pick it.",
      correctText: "las cosas",
      distractorsText: ["los cosas", "la cosa", "el cosas"],
      explanation: "Feminine plural: both words show it.",
      exercisedAtomSurfaces: ["las", "cosa"],
    }),
  ],
};

// ─── es-m3-5 — Hay ──────────────────────────────────────────────────────────

const M3_5: LessonContent = {
  id: "es-m3-5",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Hay — there is, there are",
  description: "Say what exists — plus the two famous exceptions.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m3-5-info-hay",
      "Hay — existence in one word",
      "hay covers both 'there is' and 'there are': hay un libro en la mesa (there's a book on the table), hay dos sillas (there are two chairs). en means in/on/at. And the h is silent — hay sounds like English 'eye'.",
      "grammar",
    ),
    phrase("es-m3-5-p-dinero", "the money", "el dinero", undefined, { atomId: "es:dinero", emoji: "💰" }),
    cloze(
      "es-m3-5-cz-hay",
      "",
      "un libro en la mesa",
      "hay",
      ["hay", "es", "en", "y"],
      "there is a book on the table",
      "hay un libro en la mesa",
    ),
    vocabMcq(
      "es-m3-5-mcq-dinero",
      { surface: "dinero", meaningEn: "money", emoji: "💰" },
      [LLAVE, PAPEL, CELULAR],
    ),
    cloze(
      "es-m3-5-cz-en",
      "hay dinero",
      "la mochila",
      "en",
      ["en", "y", "o", "de"],
      "there is money in the backpack",
      "hay dinero en la mochila",
    ),
    infoStep(
      "es-m3-5-info-excepciones",
      "El día, la mano",
      "Two famous rule-breakers: día ends in -a but is masculine — el día (as in buenos días) — and mano ends in -o but is feminine: la mano. One more quirk to file away: agua is feminine, yet the singular pairs with el for smoother sound — el agua.",
      "grammar",
    ),
    sentenceMcq({
      id: "es-m3-5-q-dia",
      prompt: "'The day' — pick it.",
      correctText: "el día",
      distractorsText: ["la día", "los día", "la días"],
      explanation: "One of the two famous exceptions — it keeps its -a but stays masculine.",
      exercisedAtomSurfaces: ["el", "día"],
    }),
    sentenceMcq({
      id: "es-m3-5-q-mano",
      prompt: "'The hand' — pick it.",
      correctText: "la mano",
      distractorsText: ["el mano", "los mano", "un mano"],
      explanation: "The other exception — it keeps its -o but is feminine.",
      exercisedAtomSurfaces: ["la", "mano"],
    }),
    listeningCompSentence({
      id: "es-m3-5-lc-agua",
      audioText: "hay agua aquí",
      correctMeaningEn: "there is water here",
      distractorsEn: ["there is money here", "there is a key here", "there is paper here"],
      exercisedAtomSurfaces: ["hay", "agua", "aquí"],
    }),
  ],
};

// ─── es-m3-6 — Listening focus ──────────────────────────────────────────────

const M3_6: LessonContent = {
  id: "es-m3-6",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — articles by ear",
  description: "El or la, un or una — let your ear decide.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "es-m3-6-lc-mesasilla",
      audioText: "la mesa y la silla",
      correctMeaningEn: "the table and the chair",
      distractorsEn: ["the door and the window", "a table and a chair", "the table and the door"],
      exercisedAtomSurfaces: ["la", "mesa", "silla"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-lapiz",
      target: "un lápiz",
      tiles: ["un", "lápiz", "una", "pluma"],
      correctOrder: ["un", "lápiz"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["un", "lápiz"],
    }),
    listeningCompSentence({
      id: "es-m3-6-lc-computadora",
      audioText: "una computadora",
      correctMeaningEn: "a computer",
      distractorsEn: ["a cell phone", "a telephone", "a backpack"],
      exercisedAtomSurfaces: ["una", "computadora"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-haylibros",
      target: "hay dos libros en la mesa",
      tiles: ["hay", "dos", "libros", "en", "la", "mesa"],
      correctOrder: ["hay", "dos", "libros", "en", "la", "mesa"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hay", "en", "mesa"],
    }),
    listeningCompSentence({
      id: "es-m3-6-lc-celular",
      audioText: "un celular",
      correctMeaningEn: "a cell phone",
      distractorsEn: ["a computer", "a telephone", "a key"],
      exercisedAtomSurfaces: ["un", "celular"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-llaves",
      target: "las llaves y el dinero",
      tiles: ["las", "llaves", "y", "el", "dinero"],
      correctOrder: ["las", "llaves", "y", "el", "dinero"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["las", "el", "dinero"],
    }),
    listeningCompSentence({
      id: "es-m3-6-lc-pluma",
      audioText: "hay una pluma aquí",
      correctMeaningEn: "there is a pen here",
      distractorsEn: ["there is a pencil here", "there is paper here", "is there a pen?"],
      exercisedAtomSurfaces: ["hay", "pluma", "aquí"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-papel",
      target: "el papel",
      tiles: ["el", "papel", "la", "puerta"],
      correctOrder: ["el", "papel"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["el", "papel"],
    }),
  ],
};

// ─── es-m3-7 — Integration dialogue ─────────────────────────────────────────

const M3_7: LessonContent = {
  id: "es-m3-7",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En la casa — a look around",
  description: "Walk a room in Spanish and say what's in it.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m3-7-info-dialogo",
      "What's in the house?",
      "—Aquí hay una mesa y cuatro sillas.\n—¿Hay una computadora?\n—Sí, hay una computadora y un teléfono.\n—¿Y en la mochila?\n—Hay dos libros, un lápiz y las llaves.\nNotice hay doing both jobs — 'there is' and 'there are' — without changing shape.",
      "default",
    ),
    sentenceMcq({
      id: "es-m3-7-q-dialogo",
      prompt: "In the dialogue — what is in la mochila?",
      correctText: "dos libros, un lápiz y las llaves",
      distractorsText: [
        "una computadora y un teléfono",
        "una mesa y cuatro sillas",
        "el dinero y una pluma",
      ],
      exercisedAtomSurfaces: ["un", "lápiz", "las"],
    }),
    build(
      "es-m3-7-b-sillas",
      "Say: 'There are two chairs here.'",
      "hay dos sillas aquí",
      ["hay", "dos", "sillas", "aquí", "mesa"],
      ["hay", "dos", "sillas", "aquí"],
      ["hay", "aquí"],
    ),
    translateStep({
      id: "es-m3-7-tr-agua",
      promptEn: "There is water on the table",
      acceptedAnswers: [
        "hay agua en la mesa",
        "Hay agua en la mesa",
        "hay agua en la mesa.",
        "Hay agua en la mesa.",
      ],
      audioText: "hay agua en la mesa",
      exercisedAtomSurfaces: ["hay", "agua", "en", "mesa"],
    }),
    cloze(
      "es-m3-7-cz-puerta",
      "hay una llave",
      "la puerta",
      "en",
      ["en", "y", "o", "de"],
      "there is a key in the door",
      "hay una llave en la puerta",
    ),
    speaking(
      "es-m3-7-speak-libros",
      "hay dos libros en la mesa",
      "there are two books on the table",
      ["hay", "en", "mesa"],
    ),
    sentenceMcq({
      id: "es-m3-7-q-unacasa",
      prompt: "'A house' — pick it.",
      correctText: "una casa",
      distractorsText: ["un casa", "una libro", "el casa"],
      exercisedAtomSurfaces: ["una", "casa"],
    }),
    speaking(
      "es-m3-7-speak-celular",
      "hay un celular aquí",
      "there is a cell phone here",
      ["hay", "celular", "aquí"],
    ),
  ],
};

// ─── es-m3-8 — Mastery test ─────────────────────────────────────────────────

const M3_8: LessonContent = {
  id: "es-m3-8",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M3 Mastery Test",
  description: "Gender, el/la/los/las, un/una, plurals, and hay.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    cloze(
      "es-m3-8-cz-el",
      "",
      "teléfono",
      "el",
      ["el", "la", "los", "las"],
      "the phone",
      "el teléfono",
    ),
    sentenceMcq({
      id: "es-m3-8-q-pluma",
      prompt: "'A pen' — pick it.",
      correctText: "una pluma",
      distractorsText: ["un pluma", "una lápiz", "el pluma"],
      exercisedAtomSurfaces: ["una", "pluma"],
    }),
    vocabMcq(
      "es-m3-8-mcq-mochila",
      { surface: "mochila", meaningEn: "backpack", emoji: "🎒" },
      [LLAVE, SILLA, DINERO],
    ),
    cloze(
      "es-m3-8-cz-en",
      "hay dos plumas",
      "la mesa",
      "en",
      ["en", "de", "y", "o"],
      "there are two pens on the table",
      "hay dos plumas en la mesa",
    ),
    sentenceMcq({
      id: "es-m3-8-q-dias",
      prompt: "'The days' — pick it.",
      correctText: "los días",
      distractorsText: ["las días", "los día", "el días"],
      exercisedAtomSurfaces: ["los", "día"],
    }),
    translateStep({
      id: "es-m3-8-tr-mochila",
      promptEn: "There is a book in the backpack",
      acceptedAnswers: [
        "hay un libro en la mochila",
        "Hay un libro en la mochila",
        "hay un libro en la mochila.",
        "Hay un libro en la mochila.",
      ],
      audioText: "hay un libro en la mochila",
      exercisedAtomSurfaces: ["hay", "un", "libro", "en", "mochila"],
    }),
    listeningCompSentence({
      id: "es-m3-8-lc-llaves",
      audioText: "las llaves y el celular",
      correctMeaningEn: "the keys and the cell phone",
      distractorsEn: [
        "the key and the computer",
        "the keys and the telephone",
        "a key and a cell phone",
      ],
      exercisedAtomSurfaces: ["las", "celular"],
    }),
    listeningBuildSentence({
      id: "es-m3-8-lb-agua",
      target: "hay agua aquí",
      tiles: ["hay", "agua", "aquí", "dinero"],
      correctOrder: ["hay", "agua", "aquí"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hay", "agua", "aquí"],
    }),
    sentenceMcq({
      id: "es-m3-8-q-mano",
      prompt: "'The hand' — pick it.",
      correctText: "la mano",
      distractorsText: ["el mano", "las mano", "los manos"],
      exercisedAtomSurfaces: ["la", "mano"],
    }),
  ],
};

export const ES_M3_LESSONS: LessonContent[] = [
  M3_1,
  M3_2,
  M3_3,
  M3_4,
  M3_5,
  M3_6,
  M3_7,
  M3_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M3_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m3",
      moduleId: "m3",
      build: () =>
        cloze(
          "pt-es-screen-m3",
          "",
          "casa",
          "la",
          ["la", "el", "los", "un"],
          "the house",
          "la casa",
        ),
    },
  ],
  byModule: [
    {
      id: "pt-es-m3-1",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-es-m3-1",
          prompt: "'A computer' — pick it.",
          correctText: "una computadora",
          distractorsText: ["un computadora", "el computadora", "unos computadora"],
        }),
    },
    {
      id: "pt-es-m3-2",
      moduleId: "m3",
      build: () =>
        cloze(
          "pt-es-m3-2",
          "",
          "libros",
          "los",
          ["los", "las", "el", "la"],
          "the books",
          "los libros",
        ),
    },
    {
      id: "pt-es-m3-3",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-es-m3-3",
          prompt: "'There are two chairs' — pick it.",
          correctText: "hay dos sillas",
          distractorsText: ["hay dos silla", "es dos sillas", "hay una silla"],
        }),
    },
    {
      id: "pt-es-m3-4",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-es-m3-4",
          prompt: "'The day' — pick it.",
          correctText: "el día",
          distractorsText: ["la día", "los día", "las día"],
        }),
    },
  ],
};
