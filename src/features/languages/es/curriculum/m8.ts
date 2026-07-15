/**
 * Spanish Module 8 — Rutinas I (regular -ar present, full paradigm).
 *
 * The learner can already say who/what/where (ser, estar, tener, hay).
 * M8 hands them their first real verb engine: the regular -ar present in
 * all six persons, the plural subject pronouns (nosotros/ustedes/ellos/
 * ellas), and the frequency toolkit (siempre, a veces, nunca, mucho,
 * poco, todos los días) — enough to narrate a daily routine.
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
  matchPairs,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m8-1-info-paradigm",
      "Six endings, one pattern",
      "Regular -ar verbs all follow one recipe. Drop the -ar, then add the ending that matches the person: yo hablo, tú hablas, él/ella/usted habla, nosotros hablamos, ustedes/ellos/ellas hablan. Spain adds one more row — vosotros habláis — which you'll see in tables but never drill in this course. Learn the five endings once and every regular -ar verb is yours.",
      "grammar",
    ),
    phrase("es-m8-1-p-hablar", "to speak", "hablar", undefined, { emoji: "🗣️" }),
    phrase("es-m8-1-p-estudiar", "to study", "estudiar", undefined, { emoji: "📚" }),
    sentenceMcq({
      id: "es-m8-1-q-hablo",
      prompt: "Yo ___ español. — pick the form that fits.",
      correctText: "hablo",
      distractorsText: ["hablas", "habla", "hablan"],
      explanation: "The yo form of every regular -ar verb ends in -o.",
      exercisedAtomSurfaces: ["hablar"],
    }),
    sentenceMcq({
      id: "es-m8-1-q-estudias",
      prompt: "Tú ___ en la escuela. — pick the form that fits.",
      correctText: "estudias",
      distractorsText: ["estudio", "estudia", "estudiamos"],
      explanation: "The tú form takes the -as ending.",
      exercisedAtomSurfaces: ["estudiar"],
    }),
    vocab("es-m8-1-p-ingles", "English (the language)", "inglés"),
    build(
      "es-m8-1-build-poco",
      "Build: 'I speak a little English.'",
      "hablo un poco de inglés",
      ["hablo", "un", "poco", "de", "inglés", "mucho"],
      ["hablo", "un", "poco", "de", "inglés"],
      ["hablar", "poco", "inglés"],
    ),
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
    speaking("es-m8-1-speak-hablo", "Yo hablo español.", "I speak Spanish.", ["hablar"]),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m8-2-info-tiempo",
      "Scheduling a habit",
      "Time phrases like todos los días (every day) usually close the sentence: Trabajo en la tienda todos los días. Drop one in whenever a habit needs a schedule — no extra grammar required.",
      "tip",
    ),
    phrase("es-m8-2-p-trabajar", "to work", "trabajar", undefined, { emoji: "💼" }),
    phrase("es-m8-2-p-llegar", "to arrive", "llegar"),
    sentenceMcq({
      id: "es-m8-2-q-trabajo",
      prompt: "Yo ___ en una tienda. — pick the form that fits.",
      correctText: "trabajo",
      distractorsText: ["trabajas", "trabaja", "trabajamos"],
      exercisedAtomSurfaces: ["trabajar"],
    }),
    sentenceMcq({
      id: "es-m8-2-q-llega",
      prompt: "El maestro ___ a la escuela. — pick the form that fits.",
      correctText: "llega",
      distractorsText: ["llego", "llegas", "llegan"],
      explanation: "Él, ella, and usted all share the -a ending.",
      exercisedAtomSurfaces: ["llegar"],
    }),
    phrase("es-m8-2-p-necesitar", "to need", "necesitar"),
    vocab("es-m8-2-p-usar", "to use", "usar"),
    sentenceMcq({
      id: "es-m8-2-q-necesita",
      prompt: "La doctora ___ una computadora nueva. — pick the form that fits.",
      correctText: "necesita",
      distractorsText: ["necesito", "necesitas", "necesitamos"],
      exercisedAtomSurfaces: ["necesitar"],
    }),
    translateStep({
      id: "es-m8-2-tr-usa",
      promptEn: "She uses the computer.",
      acceptedAnswers: [
        "Ella usa la computadora",
        "ella usa la computadora",
        "Usa la computadora",
        "usa la computadora",
      ],
      audioText: "Ella usa la computadora.",
      exercisedAtomSurfaces: ["usar"],
    }),
    // Text-front recognition — the work-day verbs carry no emoji.
    vocabTextMcq("es-m8-2-vm-llegar", "llegar", ["trabajar", "estudiar", "hablar"]),
    vocabTextMcq("es-m8-2-vm-usar", "usar", ["necesitar", "llegar", "trabajar"]),
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
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m8-3-info-plural",
      "We and they",
      "-amos is the nosotros (we) ending; -an covers ustedes (you all) and ellos/ellas (they): caminamos, compran. Use ellas when the whole group is women, ellos otherwise. And because each ending is unique, Spanish happily drops the pronoun — hablamos already means we speak.",
      "grammar",
    ),
    phrase("es-m8-3-p-caminar", "to walk", "caminar", undefined, { emoji: "🚶" }),
    phrase("es-m8-3-p-comprar", "to buy", "comprar", undefined, { emoji: "🛒" }),
    sentenceMcq({
      id: "es-m8-3-q-caminamos",
      prompt: "Nosotros ___ al parque. — pick the form that fits.",
      correctText: "caminamos",
      distractorsText: ["camino", "caminas", "caminan"],
      explanation: "The we form always carries -amos.",
      exercisedAtomSurfaces: ["caminar", "nosotros"],
    }),
    sentenceMcq({
      id: "es-m8-3-q-compran",
      prompt: "Ustedes ___ mochilas nuevas. — pick the form that fits.",
      correctText: "compran",
      distractorsText: ["compramos", "compro", "compras"],
      exercisedAtomSurfaces: ["comprar", "ustedes"],
    }),
    sentenceMcq({
      id: "es-m8-3-q-ellas",
      prompt: "Which pronoun means 'they' for a group that is all women?",
      correctText: "ellas",
      distractorsText: ["ellos", "nosotros", "ustedes"],
      explanation: "Feminine plural — one man in the group flips it to the -os form.",
      exercisedAtomSurfaces: ["ellas"],
    }),
    sentenceMcq({
      id: "es-m8-3-q-ellos",
      prompt: "Ellos ___ en el restaurante. — pick the form that fits.",
      correctText: "trabajan",
      distractorsText: ["trabajamos", "trabajo", "trabajas"],
      exercisedAtomSurfaces: ["ellos", "trabajar"],
    }),
    build(
      "es-m8-3-build-nosotros",
      "Build: 'We buy a table.'",
      "nosotros compramos una mesa",
      ["nosotros", "compramos", "una", "mesa", "compran"],
      ["nosotros", "compramos", "una", "mesa"],
      ["nosotros", "comprar"],
    ),
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
      exercisedAtomSurfaces: ["caminar", "nosotros"],
    }),
    // Plural shopping list — the m4 adjective agrees with each noun it follows.
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    phrase("es-m8-4-p-escuchar", "to listen", "escuchar"),
    // Nouns are taught with their article from m3 on; the atom surface
    // stays the bare noun, so the card pins its atom id explicitly.
    phrase("es-m8-4-p-musica", "music", "la música", undefined, {
      emoji: "🎵",
      atomId: "es:música",
    }),
    sentenceMcq({
      id: "es-m8-4-q-escucho",
      prompt: "Yo ___ música en casa. — pick the form that fits.",
      correctText: "escucho",
      distractorsText: ["escuchas", "escucha", "escuchan"],
      exercisedAtomSurfaces: ["escuchar"],
    }),
    sentenceMcq({
      id: "es-m8-4-q-musica",
      prompt: "Escuchamos ___ en el carro. — pick the word that fits.",
      correctText: "música",
      distractorsText: ["dinero", "agua", "papel"],
      exercisedAtomSurfaces: ["música", "escuchar"],
    }),
    phrase("es-m8-4-p-cantar", "to sing", "cantar", undefined, { emoji: "🎤" }),
    phrase("es-m8-4-p-bailar", "to dance", "bailar", undefined, { emoji: "💃" }),
    vocabMcq(
      "es-m8-4-vm-cantar",
      { surface: "cantar", meaningEn: "to sing", emoji: "🎤" },
      [
        { surface: "bailar", emoji: "💃" },
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
      id: "es-m8-4-q-mirar",
      prompt: "Which verb means 'to look at / watch'?",
      correctText: "mirar",
      distractorsText: ["escuchar", "bailar", "cantar"],
      exercisedAtomSurfaces: ["mirar"],
    }),
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
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m8-5-info-frecuencia",
      "How often, how much",
      "Frequency words sit before the verb or open the sentence: siempre (always), a veces (sometimes), nunca (never) — Siempre estudio. Nunca cocino. A veces descanso. Amount words follow the verb: mucho (a lot) and poco (a little) — Trabajas mucho. Hablo poco.",
      "grammar",
    ),
    phrase("es-m8-5-p-cocinar", "to cook", "cocinar", undefined, { emoji: "🍳" }),
    phrase("es-m8-5-p-descansar", "to rest", "descansar", undefined, { emoji: "😴" }),
    sentenceMcq({
      id: "es-m8-5-q-cocina",
      prompt: "Mi papá ___ los sábados. — pick the form that fits.",
      correctText: "cocina",
      distractorsText: ["cocino", "cocinas", "cocinar"],
      exercisedAtomSurfaces: ["cocinar"],
    }),
    sentenceMcq({
      id: "es-m8-5-q-descansamos",
      prompt: "Nosotros ___ los domingos. — pick the form that fits.",
      correctText: "descansamos",
      distractorsText: ["descanso", "descansas", "descansar"],
      exercisedAtomSurfaces: ["descansar"],
    }),
    cloze(
      "es-m8-5-cloze-nunca",
      "yo",
      "cocino en casa",
      "nunca",
      ["nunca", "siempre", "a veces", "mucho"],
      "I never cook at home",
      "Yo nunca cocino en casa.",
      "Rules the habit out completely.",
    ),
    cloze(
      "es-m8-5-cloze-siempre",
      "ella",
      "estudia en la escuela",
      "siempre",
      ["siempre", "nunca", "a veces", "poco"],
      "she always studies at school",
      "Ella siempre estudia en la escuela.",
      "The habit happens every single time.",
    ),
    sentenceMcq({
      id: "es-m8-5-q-aveces",
      prompt: "Which one means 'sometimes'?",
      correctText: "a veces",
      distractorsText: ["siempre", "nunca", "mucho"],
      exercisedAtomSurfaces: ["a veces"],
    }),
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
    // Review grid — the -ar verb set taught so far in one recognition sweep.
    matchPairs("es-m8-5", [
      "hablar",
      "trabajar",
      "estudiar",
      "comprar",
      "escuchar",
      "cantar",
      "bailar",
      "cocinar",
    ]),
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
  estimatedMinutes: 6,
  xpReward: 14,
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
  estimatedMinutes: 6,
  xpReward: 15,
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
    cloze(
      "es-m8-7-cloze-aveces",
      "ella",
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
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m8-8-q-hablo",
      prompt: "Yo ___ español y un poco de inglés. — pick the form that fits.",
      correctText: "hablo",
      distractorsText: ["hablas", "hablan", "hablamos"],
      exercisedAtomSurfaces: ["hablar"],
    }),
    sentenceMcq({
      id: "es-m8-8-q-trabajan",
      prompt: "Ellos ___ en un hotel. — pick the form that fits.",
      correctText: "trabajan",
      distractorsText: ["trabajo", "trabajamos", "trabajas"],
      exercisedAtomSurfaces: ["trabajar", "ellos"],
    }),
    cloze(
      "es-m8-8-cloze-nunca",
      "él",
      "descansa",
      "nunca",
      ["nunca", "siempre", "a veces", "mucho"],
      "he never rests",
      "Él nunca descansa.",
    ),
    build(
      "es-m8-8-build-compramos",
      "Build: 'We buy a computer.'",
      "nosotros compramos una computadora",
      ["nosotros", "compramos", "una", "computadora", "compran"],
      ["nosotros", "compramos", "una", "computadora"],
      ["comprar", "nosotros"],
    ),
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
      prompt: "Mi madre ___ el celular. — pick the form that fits.",
      correctText: "usa",
      distractorsText: ["uso", "usas", "usar"],
      exercisedAtomSurfaces: ["usar"],
    }),
    listeningBuildSentence({
      id: "es-m8-8-lb-llegan",
      target: "ustedes llegan a la escuela",
      tiles: ["ustedes", "llegan", "a", "la", "escuela", "llegamos"],
      correctOrder: ["ustedes", "llegan", "a", "la", "escuela"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["llegar", "ustedes"],
    }),
    speaking("es-m8-8-speak-siempre", "Siempre escucho música.", "I always listen to music.", [
      "siempre",
      "escuchar",
      "música",
    ]),
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
