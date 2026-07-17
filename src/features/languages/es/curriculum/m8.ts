/**
 * Spanish Module 8 — Rutinas I (regular -ar present, full paradigm).
 *
 * The learner can already say who/what/where (ser, estar, tener, hay).
 * M8 hands them their first real verb engine: the regular -ar present in
 * all six persons, the plural subject pronouns (nosotros/ustedes/ellos/
 * ellas), and the frequency toolkit (siempre, a veces, nunca, mucho,
 * poco, todos los días) — enough to narrate a daily routine.
 *
 * 2026-07-16 JA-parity rewrite: every lesson now forces PRODUCTION of the
 * conjugated forms (typed translateStep + build), not just recognition;
 * MCQ marathons are broken up with generation/teach beats; one
 * selfExplain lands near the end of each grammar-bearing lesson; every
 * lesson from L2 on closes with a compounding review tail (reviewMatchPairs
 * + a review production/recognition item) drawn from m1-m7.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m8-1  -ar verbs — hablar, estudiar (+ the six-ending pattern)
 *   es-m8-2  The work day — trabajar, llegar, necesitar, usar
 *   es-m8-3  Nosotros y ustedes — the plural persons
 *   es-m8-4  Música — escuchar, mirar, cantar, bailar
 *   es-m8-5  Siempre, a veces, nunca — frequency & amount
 *   es-m8-6  Listening focus — routines by ear
 *   es-m8-7  Integration — Ana's day + speaking
 *   es-m8-8  M8 Mastery Test
 *
 * REUSE note (spine §m8): `español` is an m2 atom — its language sense is
 * exercised throughout these steps WITHOUT re-registering the surface.
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
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";
// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m7";

const COURSE_ID = "mock-1";

// ─── M8 atoms (exactly the spine allocation) ────────────────────────────────
// Emoji verified against the bundled Noto subset (src/pub/noto-emoji/svg,
// FE0F never in filenames): 1f5e3, 1f4bc, 1f4da, 1f6d2, 1f6b6, 1f440,
// 1f373, 1f483, 1f3a4, 1f634, 1f3b5.

export const ES_M8_ATOMS: EsAtom[] = [
  // Regular -ar verbs
  atom({ surface: "hablar", meaningEn: "to speak", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "🗣️" }),
  atom({ surface: "trabajar", meaningEn: "to work", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "💼" }),
  atom({ surface: "estudiar", meaningEn: "to study", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "📚" }),
  atom({ surface: "comprar", meaningEn: "to buy", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "🛒" }),
  atom({ surface: "caminar", meaningEn: "to walk", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "🚶" }),
  atom({ surface: "escuchar", meaningEn: "to listen", partOfSpeech: "verb", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "mirar", meaningEn: "to look at / watch", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "👀" }),
  atom({ surface: "cocinar", meaningEn: "to cook", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "🍳" }),
  atom({ surface: "bailar", meaningEn: "to dance", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "💃" }),
  atom({ surface: "cantar", meaningEn: "to sing", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "🎤" }),
  atom({ surface: "descansar", meaningEn: "to rest", partOfSpeech: "verb", fromModule: "m8", kind: "vocab", emoji: "😴" }),
  atom({ surface: "llegar", meaningEn: "to arrive", partOfSpeech: "verb", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "necesitar", meaningEn: "to need", partOfSpeech: "verb", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "usar", meaningEn: "to use", partOfSpeech: "verb", fromModule: "m8", kind: "vocab" }),
  // Plural subject pronouns
  atom({ surface: "nosotros", meaningEn: "we", partOfSpeech: "pronoun", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "ellos", meaningEn: "they (m)", partOfSpeech: "pronoun", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "ellas", meaningEn: "they (f)", partOfSpeech: "pronoun", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "ustedes", meaningEn: "you all", partOfSpeech: "pronoun", fromModule: "m8", kind: "vocab" }),
  // Frequency & amount
  atom({ surface: "siempre", meaningEn: "always", partOfSpeech: "adverb", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "a veces", meaningEn: "sometimes", partOfSpeech: "phrase", fromModule: "m8", kind: "phrase" }),
  atom({ surface: "nunca", meaningEn: "never", partOfSpeech: "adverb", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "todos los días", meaningEn: "every day", partOfSpeech: "phrase", fromModule: "m8", kind: "phrase" }),
  atom({ surface: "mucho", meaningEn: "a lot", partOfSpeech: "adverb", fromModule: "m8", kind: "vocab" }),
  atom({ surface: "poco", meaningEn: "a little", partOfSpeech: "adverb", fromModule: "m8", kind: "vocab" }),
  // Routine nouns
  atom({ surface: "inglés", meaningEn: "English (language)", partOfSpeech: "noun", fromModule: "m8", kind: "vocab", gender: "m" }),
  atom({ surface: "música", meaningEn: "music", partOfSpeech: "noun", fromModule: "m8", kind: "vocab", gender: "f", emoji: "🎵" }),
];

// ─── es-m8-1 — The -ar pattern ──────────────────────────────────────────────

const M8_1: LessonContent = {
  id: "es-m8-1",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "-ar verbs — hablar, estudiar",
  description: "Drop -ar, add the ending — one pattern unlocks fourteen verbs.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m8-1-info-paradigm",
      "Six endings, one pattern",
      "Regular -ar verbs all follow one recipe. Drop the -ar, then add the ending that matches the person: yo hablo, tú hablas, él/ella/usted habla, nosotros hablamos, ustedes/ellos/ellas hablan. Spain adds one more row — vosotros habláis — which you'll see in tables but never drill in this course. Learn the five endings once and every regular -ar verb is yours.",
      "grammar",
    ),
    vocabMcq(
      "es-m8-1-vm-hablar",
      { surface: "hablar", meaningEn: "to speak", emoji: "🗣️" },
      [
        { surface: "trabajar", emoji: "💼" },
        { surface: "comprar", emoji: "🛒" },
        { surface: "caminar", emoji: "🚶" },
      ],
    ),
    speaking("es-m8-1-speak-hablo", "Yo hablo español.", "I speak Spanish.", ["hablar"]),
    vocabMcq(
      "es-m8-1-vm-estudiar",
      { surface: "estudiar", meaningEn: "to study", emoji: "📚" },
      [
        { surface: "mirar", emoji: "👀" },
        { surface: "cocinar", emoji: "🍳" },
        { surface: "bailar", emoji: "💃" },
      ],
    ),
    sentenceMcq({
      id: "es-m8-1-q-hablo",
      prompt: "Antes de clase, yo ___ con mis amigos.",
      correctText: "hablo",
      distractorsText: ["hablas", "habla", "hablan"],
      explanation: "The yo form of every regular -ar verb ends in -o.",
      exercisedAtomSurfaces: ["hablar"],
    }),
    build(
      "es-m8-1-build-poco",
      "Build: 'I speak a little English.'",
      "hablo un poco de inglés",
      ["hablo", "un", "poco", "de", "inglés", "mucho"],
      ["hablo", "un", "poco", "de", "inglés"],
      ["hablar", "poco", "inglés"],
    ),
    sentenceMcq({
      id: "es-m8-1-q-estudias",
      prompt: "Cada noche, tú ___ para el examen.",
      correctText: "estudias",
      distractorsText: ["estudio", "estudia", "estudiamos"],
      explanation: "The tú form takes the -as ending.",
      exercisedAtomSurfaces: ["estudiar"],
    }),
    translateStep({
      id: "es-m8-1-tr-estudio",
      promptEn: "I study English.",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "Estudio inglés",
        "estudio inglés",
        "Estudio ingles",
        "estudio ingles",
        "Yo estudio inglés",
        "yo estudio inglés",
        "Yo estudio ingles",
        "yo estudio ingles",
      ],
      audioText: "Estudio inglés.",
      exercisedAtomSurfaces: ["estudiar", "inglés"],
    }),
    listeningCompSentence({
      id: "es-m8-1-lc-hermano",
      audioText: "Mi hermano habla inglés en el trabajo.",
      correctMeaningEn: "My brother speaks English at work.",
      distractorsEn: [
        "My brother studies English at work.",
        "My sister speaks English at work.",
        "My brother speaks Spanish at work.",
      ],
      exercisedAtomSurfaces: ["hablar", "inglés"],
    }),
    build(
      "es-m8-1-build-el-habla",
      "Build: 'He speaks a little.'",
      "él habla poco",
      ["él", "habla", "poco", "hablan"],
      ["él", "habla", "poco"],
      ["hablar", "poco"],
    ),
    listeningBuildSentence({
      id: "es-m8-1-lb-hablamos",
      target: "hablamos español en casa",
      tiles: ["hablamos", "español", "en", "casa", "hablan"],
      correctOrder: ["hablamos", "español", "en", "casa"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hablar"],
    }),
    sentenceMcq({
      id: "es-m8-1-q-yo-estudio",
      prompt: "¿Qué haces en la escuela? — Yo ___.",
      correctText: "estudio",
      distractorsText: ["estudias", "estudia", "estudiamos"],
      exercisedAtomSurfaces: ["estudiar"],
    }),
    speaking("es-m8-1-speak-el-habla", "Él habla mucho.", "He talks a lot.", ["hablar", "mucho"]),
    cloze(
      "es-m8-1-cloze-hablamos",
      "Nosotros",
      "español en la clase.",
      "hablamos",
      ["hablamos", "hablan", "habla", "hablas"],
      "we speak Spanish in class",
      "Nosotros hablamos español en la clase.",
      "The nosotros ending is always -amos.",
      ["hablar"],
    ),
    sentenceMcq({
      id: "es-m8-1-q-estudiamos",
      prompt: "Mi amiga y yo somos estudiantes. Nosotros ___ mucho.",
      correctText: "estudiamos",
      distractorsText: ["estudia", "estudian", "estudio"],
      exercisedAtomSurfaces: ["estudiar", "mucho"],
    }),
    translateStep({
      id: "es-m8-1-tr-estudiamos",
      promptEn: "We study English.",
      acceptedAnswers: [
        "Estudiamos inglés",
        "estudiamos inglés",
        "Estudiamos ingles",
        "estudiamos ingles",
        "Nosotros estudiamos inglés",
        "nosotros estudiamos inglés",
        "Nosotros estudiamos ingles",
        "nosotros estudiamos ingles",
      ],
      audioText: "Estudiamos inglés.",
      exercisedAtomSurfaces: ["estudiar", "inglés"],
    }),
    speaking(
      "es-m8-1-speak-estudiamos",
      "Estudiamos mucho en casa.",
      "We study a lot at home.",
      ["estudiar", "mucho"],
    ),
    selfExplain({
      id: "es-m8-1-self-endings",
      anchorLabel: "You just wrote: Estudiamos inglés.",
      anchorAudioText: "Estudiamos inglés.",
      question: "Why does estudiar become estudiamos for nosotros, with no separate word for 'we'?",
      rule: {
        text: "The verb ending -amos already encodes 'we' as the subject, so a separate pronoun isn't needed.",
      },
      surface: {
        text: "Any -ar verb ending in -amos means the action happens as a group activity.",
      },
      distractor: {
        text: "The ending only changes to -amos in formal writing; spoken Spanish still needs nosotros.",
      },
      ruleExplanation:
        "Spanish conjugation endings uniquely identify the subject (person + number), so subject pronouns are optional — 'estudiamos' already means 'we study.'",
    }),
    infoStep(
      "es-m8-1-info-win",
      "You own the pattern",
      "Drop -ar, add the ending — you can now conjugate any regular -ar verb in all six persons, from hablo to hablamos to hablan.",
      "win",
    ),
  ],
};

// ─── es-m8-2 — The work day ─────────────────────────────────────────────────

const M8_2: LessonContent = {
  id: "es-m8-2",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "El trabajo — trabajar, llegar, necesitar",
  description: "Work, arrive, need, use — your first daily-routine sentences.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m8-2-info-tiempo",
      "Scheduling a habit",
      "Time phrases like todos los días (every day) usually close the sentence: Trabajo en la tienda todos los días. Drop one in whenever a habit needs a schedule — no extra grammar required.",
      "tip",
    ),
    vocabMcq(
      "es-m8-2-vm-trabajar",
      { surface: "trabajar", meaningEn: "to work", emoji: "💼" },
      [
        { surface: "hablar", emoji: "🗣️" },
        { surface: "cocinar", emoji: "🍳" },
        { surface: "descansar", emoji: "😴" },
      ],
    ),
    vocabTextMcq(
      "es-m8-2-vm-llegar",
      "llegar",
      ["trabajar", "estudiar", "hablar"],
      "¿Qué verbo significa 'to arrive'?",
    ),
    speaking("es-m8-2-speak-trabajo", "Trabajo en una tienda.", "I work in a store.", ["trabajar"]),
    sentenceMcq({
      id: "es-m8-2-q-trabajo",
      prompt: "Después de la universidad, yo ___ en una tienda.",
      correctText: "trabajo",
      distractorsText: ["trabajas", "trabaja", "trabajamos"],
      exercisedAtomSurfaces: ["trabajar"],
    }),
    build(
      "es-m8-2-build-todos-los-dias",
      "Build: 'I work every day.'",
      "trabajo todos los días",
      ["trabajo", "todos", "los", "días", "nunca"],
      ["trabajo", "todos", "los", "días"],
      ["trabajar", "todos los días"],
    ),
    listeningCompSentence({
      id: "es-m8-2-lc-llega",
      audioText: "Llego a la tienda todos los días.",
      correctMeaningEn: "I arrive at the store every day.",
      distractorsEn: [
        "I arrive at the bank every day.",
        "I work at the store every day.",
        "I arrive at the store sometimes.",
      ],
      exercisedAtomSurfaces: ["llegar", "todos los días"],
    }),
    translateStep({
      id: "es-m8-2-tr-llega",
      promptEn: "She arrives at the store.",
      acceptedAnswers: [
        "Ella llega a la tienda",
        "ella llega a la tienda",
        "Llega a la tienda",
        "llega a la tienda",
      ],
      audioText: "Ella llega a la tienda.",
      exercisedAtomSurfaces: ["llegar"],
    }),
    vocabTextMcq(
      "es-m8-2-vm-necesitar",
      "necesitar",
      ["usar", "llegar", "trabajar"],
      "¿Qué verbo significa 'to need'?",
    ),
    cloze(
      "es-m8-2-cloze-usa",
      "Yo no tengo carro, así que",
      "el autobús.",
      "uso",
      ["uso", "usas", "usa", "usamos"],
      "I don't have a car, so I use the bus",
      "Yo no tengo carro, así que uso el autobús.",
      undefined,
      ["usar"],
    ),
    build(
      "es-m8-2-build-usamos",
      "Build: 'We use the computer every day.'",
      "usamos la computadora todos los días",
      ["usamos", "la", "computadora", "todos", "los", "días", "necesitamos"],
      ["usamos", "la", "computadora", "todos", "los", "días"],
      ["usar", "todos los días"],
    ),
    vocabTextMcq(
      "es-m8-2-vm-usar",
      "usar",
      ["necesitar", "llegar", "trabajar"],
      "¿Qué verbo significa 'to use'?",
    ),
    speaking("es-m8-2-speak-usa", "Ella usa el celular en el trabajo.", "She uses the phone at work.", ["usar"]),
    translateStep({
      id: "es-m8-2-tr-necesitamos",
      promptEn: "We need more time.",
      acceptedAnswers: [
        "Necesitamos más tiempo",
        "necesitamos más tiempo",
        "Necesitamos mas tiempo",
        "necesitamos mas tiempo",
      ],
      audioText: "Necesitamos más tiempo.",
      exercisedAtomSurfaces: ["necesitar"],
    }),
    selfExplain({
      id: "es-m8-2-self-tiempo",
      anchorLabel: "You built: usamos la computadora todos los días.",
      anchorAudioText: "Usamos la computadora todos los días.",
      question: "Where does todos los días usually sit in the sentence?",
      rule: {
        text: "Time phrases like todos los días typically close the sentence, after the verb and its object.",
      },
      surface: {
        text: "todos los días must always sit right after the subject pronoun.",
      },
      distractor: {
        text: "todos los días changes position depending on whether the verb ends in -ar or -er.",
      },
      ruleExplanation:
        "Frequency and time phrases like todos los días default to the end of the sentence; fronting them for emphasis is possible but not required.",
    }),
    reviewMatchPairs("es-m8-2-rev", "es-m8-2-rev-seed", "m8", 6),
    sentenceMcq({
      id: "es-m8-2-q-rev-trabaja",
      prompt: "Mi hermano ___ en el banco.",
      correctText: "trabaja",
      distractorsText: ["trabajo", "trabajas", "trabajamos"],
      exercisedAtomSurfaces: ["trabajar", "hermano", "banco"],
    }),
    speaking(
      "es-m8-2-speak-rev-banco",
      "Trabajo cerca del banco.",
      "I work near the bank.",
      ["trabajar", "banco", "cerca"],
    ),
    infoStep(
      "es-m8-2-info-win",
      "Your workday, in Spanish",
      "You can now describe where you work, when you arrive, and what you need to get through the day.",
      "win",
    ),
  ],
};

// ─── es-m8-3 — The plural persons ───────────────────────────────────────────

const M8_3: LessonContent = {
  id: "es-m8-3",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Nosotros y ustedes — the plural persons",
  description: "The we and they endings, plus the plural pronouns.",
  estimatedMinutes: 8,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m8-3-info-plural",
      "We and they",
      "-amos is the nosotros (we) ending; -an covers ustedes (you all) and ellos/ellas (they): caminamos, compran. Use ellas when the whole group is women, ellos otherwise. And because each ending is unique, Spanish happily drops the pronoun — hablamos already means we speak.",
      "grammar",
    ),
    vocabMcq(
      "es-m8-3-vm-caminar",
      { surface: "caminar", meaningEn: "to walk", emoji: "🚶" },
      [
        { surface: "bailar", emoji: "💃" },
        { surface: "descansar", emoji: "😴" },
        { surface: "cocinar", emoji: "🍳" },
      ],
    ),
    speaking("es-m8-3-speak-caminamos", "Caminamos al parque.", "We walk to the park.", ["caminar"]),
    vocabMcq(
      "es-m8-3-vm-comprar",
      { surface: "comprar", meaningEn: "to buy", emoji: "🛒" },
      [
        { surface: "cantar", emoji: "🎤" },
        { surface: "mirar", emoji: "👀" },
        { surface: "trabajar", emoji: "💼" },
      ],
    ),
    sentenceMcq({
      id: "es-m8-3-q-caminamos",
      prompt: "Todos los sábados, nosotros ___ al parque.",
      correctText: "caminamos",
      distractorsText: ["camino", "caminas", "caminan"],
      explanation: "The we form always carries -amos.",
      exercisedAtomSurfaces: ["caminar", "nosotros"],
    }),
    build(
      "es-m8-3-build-nosotros",
      "Build: 'We buy a table.'",
      "nosotros compramos una mesa",
      ["nosotros", "compramos", "una", "mesa", "compran"],
      ["nosotros", "compramos", "una", "mesa"],
      ["nosotros", "comprar", "mesa"],
    ),
    sentenceMcq({
      id: "es-m8-3-q-compran",
      prompt: "Los estudiantes van a la librería porque ___ mochilas nuevas.",
      correctText: "compran",
      distractorsText: ["compramos", "compro", "compras"],
      exercisedAtomSurfaces: ["comprar", "mochila", "nuevo"],
    }),
    translateStep({
      id: "es-m8-3-tr-ustedes-compran",
      promptEn: "You all buy new backpacks.",
      acceptedAnswers: [
        "Ustedes compran mochilas nuevas",
        "ustedes compran mochilas nuevas",
        "Compran mochilas nuevas",
        "compran mochilas nuevas",
      ],
      audioText: "Ustedes compran mochilas nuevas.",
      exercisedAtomSurfaces: ["comprar", "ustedes", "mochila", "nuevo"],
    }),
    sentenceMcq({
      id: "es-m8-3-q-ellas",
      prompt: "¿Qué pronombre significa 'they' cuando el grupo es solo mujeres?",
      correctText: "ellas",
      distractorsText: ["ellos", "nosotros", "ustedes"],
      explanation: "Feminine plural — one man in the group flips it to the -os form.",
      exercisedAtomSurfaces: ["ellas"],
    }),
    build(
      "es-m8-3-build-ellos-trabajan",
      "Build: 'They (m) work at the restaurant.'",
      "ellos trabajan en el restaurante",
      ["ellos", "trabajan", "en", "el", "restaurante", "trabajamos"],
      ["ellos", "trabajan", "en", "el", "restaurante"],
      ["ellos", "trabajar", "restaurante"],
    ),
    agreementCloze(
      "es-m8-3-agr-nuevas",
      [
        { text: "Ellas compran mochilas nuev" },
        { blank: { id: "b1", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
        { text: " y libros nuev" },
        { blank: { id: "b2", correctAnswer: "os", options: ["o", "a", "os", "as"] } },
        { text: "." },
      ],
      "they buy new backpacks and new books",
      "Ellas compran mochilas nuevas y libros nuevos.",
      ["comprar", "ellas", "mochila", "libro", "nuevo"],
    ),
    speaking("es-m8-3-speak-ellos-caminan", "Ellos caminan mucho los domingos.", "They walk a lot on Sundays.", ["ellos", "caminar", "mucho"]),
    sentenceMcq({
      id: "es-m8-3-q-trabajamos-reply",
      prompt: "'¿Ustedes trabajan aquí?' — Responde por tu grupo: 'Sí, ___ aquí.'",
      correctText: "trabajamos",
      distractorsText: ["trabajan", "trabajo", "trabajas"],
      explanation: "Answering for we takes the -amos ending.",
      exercisedAtomSurfaces: ["trabajar", "ustedes"],
    }),
    translateStep({
      id: "es-m8-3-tr-caminamos",
      promptEn: "We walk to school.",
      acceptedAnswers: [
        "Caminamos a la escuela",
        "caminamos a la escuela",
        "Nosotros caminamos a la escuela",
        "nosotros caminamos a la escuela",
      ],
      audioText: "Caminamos a la escuela.",
      exercisedAtomSurfaces: ["caminar", "nosotros", "escuela"],
    }),
    selfExplain({
      id: "es-m8-3-self-drop",
      anchorLabel: "You wrote: Caminamos a la escuela (no 'nosotros' needed).",
      anchorAudioText: "Caminamos a la escuela.",
      question: "Why can nosotros be dropped from 'Caminamos a la escuela'?",
      rule: {
        text: "The verb ending -amos already means 'we,' so the pronoun nosotros is optional whenever the ending makes the subject clear.",
      },
      surface: {
        text: "nosotros can be dropped only when talking about walking, not other actions.",
      },
      distractor: {
        text: "Dropping nosotros is required in writing but forbidden in speech.",
      },
      ruleExplanation:
        "Because -amos is unique to 'we,' Spanish freely drops subject pronouns whenever the verb ending already identifies the person — this applies to every person, not just walking.",
    }),
    speaking("es-m8-3-speak-ustedes-hablan", "Ustedes hablan mucho.", "You all talk a lot.", ["ustedes", "hablar", "mucho"]),
    reviewMatchPairs("es-m8-3-rev", "es-m8-3-rev-seed", "m8", 6),
    build(
      "es-m8-3-build-rev-tienen",
      "Build: 'They have a big house.'",
      "ellos tienen una casa grande",
      ["ellos", "tienen", "una", "casa", "grande", "tiene"],
      ["ellos", "tienen", "una", "casa", "grande"],
      ["ellos", "tener", "casa", "grande"],
    ),
    infoStep(
      "es-m8-3-info-win",
      "The whole group can talk now",
      "We, you all, they — you can put any group in the sentence and give them the right ending.",
      "win",
    ),
  ],
};

// ─── es-m8-4 — Música ───────────────────────────────────────────────────────

const M8_4: LessonContent = {
  id: "es-m8-4",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Música — escuchar, cantar, bailar",
  description: "Listen, watch, sing, dance — -ar verbs go to band practice.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    vocabTextMcq(
      "es-m8-4-vm-escuchar",
      "escuchar",
      ["mirar", "cantar", "bailar"],
      "¿Qué verbo significa 'to listen'?",
    ),
    speaking("es-m8-4-speak-escucho", "Escucho música en casa.", "I listen to music at home.", ["escuchar", "música"]),
    vocabMcq(
      "es-m8-4-vm-musica",
      { surface: "música", meaningEn: "music", emoji: "🎵" },
      [
        { surface: "cantar", emoji: "🎤" },
        { surface: "bailar", emoji: "💃" },
        { surface: "cocinar", emoji: "🍳" },
      ],
    ),
    sentenceMcq({
      id: "es-m8-4-q-musica",
      prompt: "Escuchamos ___ en el carro.",
      correctText: "música",
      distractorsText: ["dinero", "agua", "papel"],
      exercisedAtomSurfaces: ["música", "escuchar", "carro"],
    }),
    build(
      "es-m8-4-build-ellos-escuchan",
      "Build: 'They listen to music every day.'",
      "ellos escuchan música todos los días",
      ["ellos", "escuchan", "música", "todos", "los", "días", "escuchamos"],
      ["ellos", "escuchan", "música", "todos", "los", "días"],
      ["ellos", "escuchar", "música", "todos los días"],
    ),
    vocabMcq(
      "es-m8-4-vm-mirar",
      { surface: "mirar", meaningEn: "to look at / watch", emoji: "👀" },
      [
        { surface: "cocinar", emoji: "🍳" },
        { surface: "bailar", emoji: "💃" },
        { surface: "descansar", emoji: "😴" },
      ],
    ),
    sentenceMcq({
      id: "es-m8-4-q-mira",
      prompt: "Antes de dormir, mi hermana ___ una película.",
      correctText: "mira",
      distractorsText: ["miro", "miras", "miran"],
      exercisedAtomSurfaces: ["mirar", "hermana"],
    }),
    translateStep({
      id: "es-m8-4-tr-miras",
      promptEn: "You watch a movie.",
      acceptedAnswers: [
        "Miras una película",
        "miras una película",
        "Tú miras una película",
        "tú miras una película",
      ],
      audioText: "Miras una película.",
      exercisedAtomSurfaces: ["mirar"],
    }),
    vocabMcq(
      "es-m8-4-vm-cantar",
      { surface: "cantar", meaningEn: "to sing", emoji: "🎤" },
      [
        { surface: "bailar", emoji: "💃" },
        { surface: "cocinar", emoji: "🍳" },
        { surface: "descansar", emoji: "😴" },
      ],
    ),
    listeningCompSentence({
      id: "es-m8-4-lc-miramos",
      audioText: "Miramos la tele en casa.",
      correctMeaningEn: "We watch TV at home.",
      distractorsEn: [
        "We watch TV at the store.",
        "We listen to music at home.",
        "They watch TV at home.",
      ],
      exercisedAtomSurfaces: ["mirar"],
    }),
    speaking("es-m8-4-speak-miro", "Miro la tele los domingos.", "I watch TV on Sundays.", ["mirar"]),
    vocabMcq(
      "es-m8-4-vm-bailar",
      { surface: "bailar", meaningEn: "to dance", emoji: "💃" },
      [
        { surface: "cantar", emoji: "🎤" },
        { surface: "cocinar", emoji: "🍳" },
        { surface: "descansar", emoji: "😴" },
      ],
    ),
    build(
      "es-m8-4-build-bailan",
      "Build: 'They dance very well.'",
      "ellas bailan muy bien",
      ["ellas", "bailan", "muy", "bien", "bailamos"],
      ["ellas", "bailan", "muy", "bien"],
      ["bailar", "ellas"],
    ),
    sentenceMcq({
      id: "es-m8-4-q-canta",
      prompt: "Los domingos, mi abuelo ___ canciones viejas.",
      correctText: "canta",
      distractorsText: ["canto", "cantas", "cantan"],
      exercisedAtomSurfaces: ["cantar", "abuelo", "viejo"],
    }),
    build(
      "es-m8-4-build-canto-bailo",
      "Build: 'I sing and dance every day.'",
      "canto y bailo todos los días",
      ["canto", "y", "bailo", "todos", "los", "días", "cantamos"],
      ["canto", "y", "bailo", "todos", "los", "días"],
      ["cantar", "bailar", "todos los días"],
    ),
    speaking("es-m8-4-speak-ustedes-cantan", "Ustedes cantan muy bien.", "You all sing very well.", ["ustedes", "cantar"]),
    cloze(
      "es-m8-4-cloze-primos",
      "Mis primos",
      "mucho en las fiestas.",
      "bailan",
      ["bailan", "bailamos", "baila", "bailo"],
      "my cousins dance a lot at parties",
      "Mis primos bailan mucho en las fiestas.",
      undefined,
      ["bailar", "mucho"],
    ),
    reviewMatchPairs("es-m8-4-rev", "es-m8-4-rev-seed", "m8", 6),
    translateStep({
      id: "es-m8-4-tr-rev-abuelo",
      promptEn: "My grandfather watches TV every day.",
      acceptedAnswers: [
        "Mi abuelo mira la tele todos los días",
        "mi abuelo mira la tele todos los días",
      ],
      audioText: "Mi abuelo mira la tele todos los días.",
      exercisedAtomSurfaces: ["mirar", "abuelo", "todos los días"],
    }),
    infoStep(
      "es-m8-4-info-win",
      "Band practice unlocked",
      "You can now say what music you listen to, what you watch, and how the people around you sing and dance.",
      "win",
    ),
  ],
};

// ─── es-m8-5 — Frequency & amount ───────────────────────────────────────────

const M8_5: LessonContent = {
  id: "es-m8-5",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Siempre, a veces, nunca",
  description: "Always, sometimes, never — say how often you do it.",
  estimatedMinutes: 8,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m8-5-info-frecuencia",
      "How often, how much",
      "Frequency words sit before the verb or open the sentence: siempre (always), a veces (sometimes), nunca (never) — Siempre estudio. Nunca cocino. A veces descanso. Amount words follow the verb: mucho (a lot) and poco (a little) — Trabajas mucho. Hablo poco.",
      "grammar",
    ),
    vocabMcq(
      "es-m8-5-vm-cocinar",
      { surface: "cocinar", meaningEn: "to cook", emoji: "🍳" },
      [
        { surface: "descansar", emoji: "😴" },
        { surface: "bailar", emoji: "💃" },
        { surface: "cantar", emoji: "🎤" },
      ],
    ),
    speaking("es-m8-5-speak-nunca-cocino", "Nunca cocino en casa.", "I never cook at home.", ["nunca", "cocinar"]),
    vocabMcq(
      "es-m8-5-vm-descansar",
      { surface: "descansar", meaningEn: "to rest", emoji: "😴" },
      [
        { surface: "cocinar", emoji: "🍳" },
        { surface: "cantar", emoji: "🎤" },
        { surface: "bailar", emoji: "💃" },
      ],
    ),
    sentenceMcq({
      id: "es-m8-5-q-cocina",
      prompt: "Mi papá siempre ___ los sábados.",
      correctText: "cocina",
      distractorsText: ["cocino", "cocinas", "cocinar"],
      exercisedAtomSurfaces: ["cocinar", "siempre"],
    }),
    speaking("es-m8-5-speak-papa-cocina", "Mi papá cocina muy bien.", "My dad cooks very well.", ["cocinar"]),
    cloze(
      "es-m8-5-cloze-nunca",
      "Yo",
      "cocino en casa.",
      "nunca",
      ["nunca", "siempre", "a veces", "mucho"],
      "I never cook at home",
      "Yo nunca cocino en casa.",
      "Rules the habit out completely.",
    ),
    build(
      "es-m8-5-build-descansamos",
      "Build: 'We rest on Sundays.'",
      "nosotros descansamos los domingos",
      ["nosotros", "descansamos", "los", "domingos", "descansan"],
      ["nosotros", "descansamos", "los", "domingos"],
      ["nosotros", "descansar", "domingo"],
    ),
    sentenceMcq({
      id: "es-m8-5-q-descansamos",
      prompt: "Después de trabajar toda la semana, nosotros ___ los domingos.",
      correctText: "descansamos",
      distractorsText: ["descanso", "descansas", "descansar"],
      exercisedAtomSurfaces: ["descansar", "domingo"],
    }),
    cloze(
      "es-m8-5-cloze-siempre",
      "Ella",
      "estudia en la escuela.",
      "siempre",
      ["siempre", "nunca", "a veces", "poco"],
      "she always studies at school",
      "Ella siempre estudia en la escuela.",
      "The habit happens every single time.",
    ),
    translateStep({
      id: "es-m8-5-tr-mucho",
      promptEn: "You work a lot.",
      acceptedAnswers: [
        "Trabajas mucho",
        "trabajas mucho",
        "Tú trabajas mucho",
        "tú trabajas mucho",
        "Tu trabajas mucho",
        "tu trabajas mucho",
      ],
      audioText: "Trabajas mucho.",
      exercisedAtomSurfaces: ["trabajar", "mucho"],
    }),
    vocabTextMcq(
      "es-m8-5-vm-aveces",
      "a veces",
      ["siempre", "nunca", "mucho"],
      "¿Cuál de estas palabras significa 'sometimes'?",
    ),
    build(
      "es-m8-5-build-poco",
      "Build: 'I rest a little on Mondays.'",
      "descanso poco los lunes",
      ["descanso", "poco", "los", "lunes", "mucho"],
      ["descanso", "poco", "los", "lunes"],
      ["descansar", "poco", "lunes"],
    ),
    listeningCompSentence({
      id: "es-m8-5-lc-escucho",
      audioText: "A veces escucho música en el carro.",
      correctMeaningEn: "Sometimes I listen to music in the car.",
      distractorsEn: [
        "I always listen to music in the car.",
        "Sometimes I sing in the car.",
        "Sometimes I listen to music at home.",
      ],
      exercisedAtomSurfaces: ["escuchar", "a veces", "música", "carro"],
    }),
    sentenceMcq({
      id: "es-m8-5-q-poco-context",
      prompt: "Mi tío trabaja doce horas al día; ___ descansa.",
      correctText: "poco",
      distractorsText: ["mucho", "siempre", "nunca"],
      exercisedAtomSurfaces: ["poco", "descansar"],
    }),
    speaking(
      "es-m8-5-speak-cocino-mucho",
      "Cocino mucho los fines de semana.",
      "I cook a lot on weekends.",
      ["cocinar", "mucho"],
    ),
    selfExplain({
      id: "es-m8-5-self-orden",
      anchorLabel: "You wrote: Trabajas mucho (not: Mucho trabajas).",
      anchorAudioText: "Trabajas mucho.",
      question: "Where do amount words like mucho and poco go, compared to frequency words like siempre and nunca?",
      rule: {
        text: "Frequency words (siempre, a veces, nunca) sit before the verb; amount words (mucho, poco) sit right after it.",
      },
      surface: {
        text: "mucho and poco always go at the very end of the sentence, even after time phrases like todos los días.",
      },
      distractor: {
        text: "mucho and poco go before the verb, just like siempre and nunca.",
      },
      ruleExplanation:
        "mucho/poco modify the verb directly and follow it. siempre/a veces/nunca set the scene for the whole sentence and lead it.",
    }),
    reviewMatchPairs("es-m8-5-rev", "es-m8-5-rev-seed", "m8", 6),
    sentenceMcq({
      id: "es-m8-5-q-rev-abuela",
      prompt: "Mi abuela nunca va al banco los domingos; siempre está en casa. ¿Qué hace la abuela los domingos?",
      correctText: "Está en casa.",
      distractorsText: ["Va al banco.", "Trabaja en la tienda.", "Camina al parque."],
      exercisedAtomSurfaces: ["nunca", "siempre", "abuela", "banco", "casa"],
    }),
    build(
      "es-m8-5-build-rev-hotel",
      "Build: 'They rest a lot at the hotel.'",
      "ellos descansan mucho en el hotel",
      ["ellos", "descansan", "mucho", "en", "el", "hotel", "descansamos"],
      ["ellos", "descansan", "mucho", "en", "el", "hotel"],
      ["ellos", "descansar", "mucho", "hotel"],
    ),
    infoStep(
      "es-m8-5-info-win",
      "Say how often, how much",
      "Always, sometimes, never, a lot, a little — you can now put a frequency on anything you do.",
      "win",
    ),
  ],
};

// ─── es-m8-6 — Listening focus ──────────────────────────────────────────────

const M8_6: LessonContent = {
  id: "es-m8-6",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — routines by ear",
  description: "Full-sentence listening with every routine verb.",
  estimatedMinutes: 8,
  xpReward: 17,
  steps: [
    listeningCompSentence({
      id: "es-m8-6-lc-trabajo",
      audioText: "Yo trabajo en un restaurante.",
      correctMeaningEn: "I work in a restaurant.",
      distractorsEn: [
        "I rest in a restaurant.",
        "I work in a store.",
        "I sing in a restaurant.",
      ],
      exercisedAtomSurfaces: ["trabajar"],
    }),
    listeningBuildSentence({
      id: "es-m8-6-lb-estudiamos",
      target: "nosotros estudiamos español",
      tiles: ["nosotros", "estudiamos", "español", "estudian", "inglés"],
      correctOrder: ["nosotros", "estudiamos", "español"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["estudiar", "nosotros"],
    }),
    speaking("es-m8-6-speak-lunes", "Trabajo mucho los lunes.", "I work a lot on Mondays.", ["trabajar", "mucho", "lunes"]),
    listeningCompSentence({
      id: "es-m8-6-lc-cocina",
      audioText: "Ella nunca cocina en casa.",
      correctMeaningEn: "She never cooks at home.",
      distractorsEn: [
        "She always cooks at home.",
        "She sometimes cooks at home.",
        "She never sings at home.",
      ],
      exercisedAtomSurfaces: ["cocinar", "nunca"],
    }),
    listeningBuildSentence({
      id: "es-m8-6-lb-hablan",
      target: "ustedes hablan mucho",
      tiles: ["ustedes", "hablan", "mucho", "hablamos"],
      correctOrder: ["ustedes", "hablan", "mucho"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hablar", "ustedes", "mucho"],
    }),
    build(
      "es-m8-6-build-llegamos",
      "Build: 'We arrive early.'",
      "llegamos temprano",
      ["llegamos", "temprano", "llegan"],
      ["llegamos", "temprano"],
      ["llegar"],
    ),
    listeningCompSentence({
      id: "es-m8-6-lc-caminan",
      audioText: "Ellos caminan al parque todos los días.",
      correctMeaningEn: "They walk to the park every day.",
      distractorsEn: [
        "They walk to the school every day.",
        "They walk to the park sometimes.",
        "They run to the park every day.",
      ],
      exercisedAtomSurfaces: ["caminar", "ellos", "todos los días"],
    }),
    listeningBuildSentence({
      id: "es-m8-6-lb-compra",
      target: "ella compra una mochila",
      tiles: ["ella", "compra", "una", "mochila", "compro"],
      correctOrder: ["ella", "compra", "una", "mochila"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["comprar"],
    }),
    listeningCompSentence({
      id: "es-m8-6-lc-escucho",
      audioText: "A veces escucho música en el carro.",
      correctMeaningEn: "Sometimes I listen to music in the car.",
      distractorsEn: [
        "I always listen to music in the car.",
        "Sometimes I sing in the car.",
        "Sometimes I listen to music at home.",
      ],
      exercisedAtomSurfaces: ["escuchar", "a veces", "música"],
    }),
    listeningBuildSentence({
      id: "es-m8-6-lb-bailan",
      target: "ellos bailan muy mal",
      tiles: ["ellos", "bailan", "muy", "mal", "bailamos"],
      correctOrder: ["ellos", "bailan", "muy", "mal"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["bailar", "ellos"],
    }),
    speaking("es-m8-6-speak-fiesta", "Bailamos y cantamos en la fiesta.", "We dance and sing at the party.", ["bailar", "cantar"]),
    listeningCompSentence({
      id: "es-m8-6-lc-abuela",
      audioText: "Mi abuela cocina todos los domingos.",
      correctMeaningEn: "My grandmother cooks every Sunday.",
      distractorsEn: [
        "My grandmother cooks every Monday.",
        "My grandmother rests every Sunday.",
        "My mother cooks every Sunday.",
      ],
      exercisedAtomSurfaces: ["cocinar", "todos los días", "abuela", "domingo"],
    }),
    listeningBuildSentence({
      id: "es-m8-6-lb-necesita",
      target: "ella necesita un carro",
      tiles: ["ella", "necesita", "un", "carro", "necesito"],
      correctOrder: ["ella", "necesita", "un", "carro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["necesitar", "carro"],
    }),
    translateStep({
      id: "es-m8-6-tr-siempre",
      promptEn: "I always listen to music.",
      acceptedAnswers: [
        "Siempre escucho música",
        "siempre escucho música",
        "Yo siempre escucho música",
        "yo siempre escucho música",
      ],
      audioText: "Siempre escucho música.",
      exercisedAtomSurfaces: ["siempre", "escuchar", "música"],
    }),
    listeningCompSentence({
      id: "es-m8-6-lc-rev-hermano",
      audioText: "Mi hermano trabaja cerca del banco.",
      correctMeaningEn: "My brother works near the bank.",
      distractorsEn: [
        "My brother works far from the bank.",
        "My sister works near the bank.",
        "My brother lives near the bank.",
      ],
      exercisedAtomSurfaces: ["trabajar", "hermano", "banco", "cerca"],
    }),
    reviewMatchPairs("es-m8-6-rev", "es-m8-6-rev-seed", "m8", 6),
    build(
      "es-m8-6-build-rev-necesitan",
      "Build: 'They need a new car.'",
      "ellos necesitan un carro nuevo",
      ["ellos", "necesitan", "un", "carro", "nuevo", "necesitamos"],
      ["ellos", "necesitan", "un", "carro", "nuevo"],
      ["ellos", "necesitar", "carro", "nuevo"],
    ),
    speaking(
      "es-m8-6-speak-rev-escuela",
      "Trabajamos cerca de la escuela.",
      "We work near the school.",
      ["trabajar", "escuela", "cerca"],
    ),
    infoStep(
      "es-m8-6-info-win",
      "Your ear is trained",
      "Fast, full-sentence Spanish about routines no longer slips past you.",
      "win",
    ),
  ],
};

// ─── es-m8-7 — Integration ──────────────────────────────────────────────────

const M8_7: LessonContent = {
  id: "es-m8-7",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Mi día — putting it all together",
  description: "Ana's whole day in Spanish you already own — then say it.",
  estimatedMinutes: 9,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m8-7-info-ana",
      "Ana's day",
      "Ana trabaja en una tienda. Llega a la tienda a las nueve. En casa estudia inglés, y a veces baila y canta. Los domingos descansa.\nEvery verb ending tells you who is doing what — read it out loud before you continue.",
      "default",
    ),
    sentenceMcq({
      id: "es-m8-7-q-ana",
      prompt: "¿Ana trabaja en un banco o en una tienda?",
      correctText: "Trabaja en una tienda.",
      distractorsText: [
        "Trabaja en un banco.",
        "Trabaja en un parque.",
        "Trabaja en una escuela.",
      ],
      exercisedAtomSurfaces: ["trabajar"],
    }),
    listeningCompSentence({
      id: "es-m8-7-lc-ana-nueve",
      audioText: "Ana llega a la tienda a las nueve.",
      correctMeaningEn: "Ana arrives at the store at nine.",
      distractorsEn: [
        "Ana arrives at the bank at nine.",
        "Ana works at the store at nine.",
        "Ana arrives at the store at ten.",
      ],
      exercisedAtomSurfaces: ["llegar"],
    }),
    // Ana tells her day herself — the info card's routine as real audio.
    dialogueListen({
      id: "es-m8-7-dlg-ana",
      lines: [
        { speaker: "Luis", text: "Ana, ¿dónde trabajas?" },
        { speaker: "Ana", text: "Trabajo en una tienda. Llego a las nueve." },
        { speaker: "Luis", text: "¿Y estudias inglés?" },
        { speaker: "Ana", text: "Sí, estudio en casa todos los días." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where does Ana work?",
          correctText: "In a store",
          distractors: ["In a bank", "In a school", "In a restaurant"],
        },
        {
          id: "q2",
          prompt: "When does Ana arrive at the store?",
          correctText: "At nine",
          distractors: ["At ten", "At two", "At seven"],
        },
      ],
      exercisedAtomSurfaces: [
        "trabajar",
        "llegar",
        "estudiar",
        "inglés",
        "todos los días",
        "tienda",
      ],
    }),
    build(
      "es-m8-7-build-estudio",
      "Build: 'I study English at home.'",
      "estudio inglés en casa",
      ["estudio", "inglés", "en", "casa", "estudias"],
      ["estudio", "inglés", "en", "casa"],
      ["estudiar", "inglés"],
    ),
    sentenceMcq({
      id: "es-m8-7-q-hermana-descansan",
      prompt: "Ana vive con su hermana. Los domingos, ellas ___ juntas.",
      correctText: "descansan",
      distractorsText: ["descansamos", "descansa", "descanso"],
      exercisedAtomSurfaces: ["descansar", "hermana"],
    }),
    cloze(
      "es-m8-7-cloze-aveces",
      "Ella",
      "baila y canta",
      "a veces",
      ["a veces", "nunca", "mucho", "poco"],
      "she sometimes dances and sings",
      "Ella a veces baila y canta.",
    ),
    translateStep({
      id: "es-m8-7-tr-llego",
      promptEn: "I arrive at the store at nine.",
      acceptedAnswers: [
        "Llego a la tienda a las nueve",
        "llego a la tienda a las nueve",
        "Yo llego a la tienda a las nueve",
        "yo llego a la tienda a las nueve",
      ],
      audioText: "Llego a la tienda a las nueve.",
      exercisedAtomSurfaces: ["llegar"],
    }),
    speaking("es-m8-7-speak-trabajo", "Trabajo todos los días.", "I work every day.", [
      "trabajar",
      "todos los días",
    ]),
    listeningBuildSentence({
      id: "es-m8-7-lb-canta",
      target: "ana canta muy bien",
      tiles: ["ana", "canta", "muy", "bien", "cantan"],
      correctOrder: ["ana", "canta", "muy", "bien"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["cantar"],
    }),
    sentenceMcq({
      id: "es-m8-7-q-estudiamos",
      prompt: "'¿Ustedes estudian español?' — answer for your group: 'Sí, ___ español.'",
      correctText: "estudiamos",
      distractorsText: ["estudian", "estudio", "estudias"],
      explanation: "Answering for we takes the -amos ending.",
      exercisedAtomSurfaces: ["estudiar", "ustedes"],
    }),
    speaking(
      "es-m8-7-speak-escucho",
      "A veces escucho música en casa.",
      "Sometimes I listen to music at home.",
      ["a veces", "escuchar", "música"],
    ),
    build(
      "es-m8-7-build-rev-hermana-banco",
      "Build: 'Ana's sister works at the bank.'",
      "la hermana de ana trabaja en el banco",
      ["la", "hermana", "de", "ana", "trabaja", "en", "el", "banco", "trabajamos"],
      ["la", "hermana", "de", "ana", "trabaja", "en", "el", "banco"],
      ["hermana", "trabajar", "banco"],
    ),
    translateStep({
      id: "es-m8-7-tr-rev-nunca-descansamos",
      promptEn: "We never rest on Mondays.",
      acceptedAnswers: [
        "Nunca descansamos los lunes",
        "nunca descansamos los lunes",
      ],
      audioText: "Nunca descansamos los lunes.",
      exercisedAtomSurfaces: ["nunca", "descansar", "lunes"],
    }),
    agreementCloze(
      "es-m8-7-agr-simpaticas",
      [
        { text: "Ana y su hermana son muy simpátic" },
        { blank: { id: "b1", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
        { text: "." },
      ],
      "Ana and her sister are very nice",
      "Ana y su hermana son muy simpáticas.",
      ["hermana", "simpático"],
    ),
    reviewMatchPairs("es-m8-7-rev", "es-m8-7-rev-seed", "m8", 6),
    sentenceMcq({
      id: "es-m8-7-q-rev-cerca",
      prompt: "Ana vive cerca del parque, pero su hermano vive lejos. ¿Quién vive cerca del parque?",
      correctText: "Ana",
      distractorsText: ["Su hermano", "Su abuela", "Su amiga"],
      exercisedAtomSurfaces: ["cerca", "lejos", "parque", "hermano"],
    }),
    speaking(
      "es-m8-7-speak-rev-parque",
      "Ana camina al parque los domingos.",
      "Ana walks to the park on Sundays.",
      ["caminar", "parque", "domingo"],
    ),
    infoStep(
      "es-m8-7-info-win",
      "You can tell someone's whole day",
      "From wake-up to bedtime, in Spanish, in the right person and the right ending — that's a real routine, told by you.",
      "win",
    ),
  ],
};

// ─── es-m8-8 — Mastery test ─────────────────────────────────────────────────

const M8_8: LessonContent = {
  id: "es-m8-8",
  moduleId: "m8",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M8 Mastery Test",
  description: "The full -ar paradigm, plural pronouns, and frequency adverbs.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m8-8-q-hablo",
      prompt: "Antes de la reunión, yo ___ con mi jefe.",
      correctText: "hablo",
      distractorsText: ["hablas", "hablan", "hablamos"],
      exercisedAtomSurfaces: ["hablar"],
    }),
    build(
      "es-m8-8-build-compramos",
      "Build: 'We buy a computer.'",
      "nosotros compramos una computadora",
      ["nosotros", "compramos", "una", "computadora", "compran"],
      ["nosotros", "compramos", "una", "computadora"],
      ["comprar", "nosotros"],
    ),
    sentenceMcq({
      id: "es-m8-8-q-trabajan",
      prompt: "Ellos ___ en un hotel.",
      correctText: "trabajan",
      distractorsText: ["trabajo", "trabajamos", "trabajas"],
      exercisedAtomSurfaces: ["trabajar", "ellos", "hotel"],
    }),
    cloze(
      "es-m8-8-cloze-nunca",
      "Él",
      "descansa.",
      "nunca",
      ["nunca", "siempre", "a veces", "mucho"],
      "he never rests",
      "Él nunca descansa.",
    ),
    listeningBuildSentence({
      id: "es-m8-8-lb-llegan",
      target: "ustedes llegan a la escuela",
      tiles: ["ustedes", "llegan", "a", "la", "escuela", "llegamos"],
      correctOrder: ["ustedes", "llegan", "a", "la", "escuela"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["llegar", "ustedes"],
    }),
    translateStep({
      id: "es-m8-8-tr-estudiamos",
      promptEn: "We study English every day.",
      acceptedAnswers: [
        "Estudiamos inglés todos los días",
        "estudiamos inglés todos los días",
        "Estudiamos ingles todos los dias",
        "estudiamos ingles todos los dias",
        "Nosotros estudiamos inglés todos los días",
        "nosotros estudiamos inglés todos los días",
        "Nosotros estudiamos ingles todos los dias",
        "nosotros estudiamos ingles todos los dias",
      ],
      audioText: "Estudiamos inglés todos los días.",
      exercisedAtomSurfaces: ["estudiar", "inglés", "todos los días"],
    }),
    sentenceMcq({
      id: "es-m8-8-q-usa",
      prompt: "Mi madre ___ el celular.",
      correctText: "usa",
      distractorsText: ["uso", "usas", "usar"],
      exercisedAtomSurfaces: ["usar"],
    }),
    listeningCompSentence({
      id: "es-m8-8-lc-cantan",
      audioText: "Ellas cantan y bailan muy bien.",
      correctMeaningEn: "They sing and dance very well.",
      distractorsEn: [
        "They sing and dance very badly.",
        "They cook and dance very well.",
        "They always sing and dance.",
      ],
      exercisedAtomSurfaces: ["cantar", "bailar", "ellas"],
    }),
    speaking("es-m8-8-speak-siempre", "Siempre escucho música.", "I always listen to music.", [
      "siempre",
      "escuchar",
      "música",
    ]),
    build(
      "es-m8-8-build-rev-abuela",
      "Build: 'My grandmother never rests.'",
      "mi abuela nunca descansa",
      ["mi", "abuela", "nunca", "descansa", "descansan"],
      ["mi", "abuela", "nunca", "descansa"],
      ["abuela", "nunca", "descansar"],
    ),
    sentenceMcq({
      id: "es-m8-8-q-rev-hermano-banco",
      prompt: "Mi hermano trabaja cerca del banco todos los días. ¿Dónde trabaja mi hermano?",
      correctText: "Cerca del banco",
      distractorsText: ["Lejos del banco", "En la escuela", "En el hotel"],
      exercisedAtomSurfaces: ["trabajar", "hermano", "banco", "cerca", "todos los días"],
    }),
    translateStep({
      id: "es-m8-8-tr-rev-parque",
      promptEn: "We walk to the park every day.",
      acceptedAnswers: [
        "Caminamos al parque todos los días",
        "caminamos al parque todos los días",
      ],
      audioText: "Caminamos al parque todos los días.",
      exercisedAtomSurfaces: ["caminar", "parque", "todos los días"],
    }),
  ],
};

export const ES_M8_LESSONS: LessonContent[] = [
  M8_1,
  M8_2,
  M8_3,
  M8_4,
  M8_5,
  M8_6,
  M8_7,
  M8_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M8_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m8",
      moduleId: "m8",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m8",
          prompt: "Nosotros ___ español todos los días. — pick the form that fits.",
          correctText: "hablamos",
          distractorsText: ["hablo", "hablan", "hablas"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m8-1",
      moduleId: "m8",
      build: () =>
        sentenceMcq({
          id: "pt-es-m8-1",
          prompt: "Yo ___ en un banco. — pick the form that fits.",
          correctText: "trabajo",
          distractorsText: ["trabaja", "trabajas", "trabajamos"],
        }),
    },
    {
      id: "pt-es-m8-2",
      moduleId: "m8",
      build: () =>
        sentenceMcq({
          id: "pt-es-m8-2",
          prompt: "Ellos ___ música en el carro. — pick the form that fits.",
          correctText: "escuchan",
          distractorsText: ["escucho", "escuchamos", "escuchas"],
        }),
    },
    {
      id: "pt-es-m8-3",
      moduleId: "m8",
      build: () =>
        cloze(
          "pt-es-m8-3",
          "yo",
          "cocino",
          "nunca",
          ["nunca", "siempre", "a veces", "mucho"],
          "I never cook",
          "Yo nunca cocino.",
        ),
    },
    {
      id: "pt-es-m8-4",
      moduleId: "m8",
      build: () =>
        sentenceMcq({
          id: "pt-es-m8-4",
          prompt: "Ella ___ una computadora nueva. — pick the form that fits.",
          correctText: "compra",
          distractorsText: ["compro", "compras", "compramos"],
        }),
    },
  ],
};
