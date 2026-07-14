/**
 * Spanish Module 14 — Casa y clima (home, hay vs está, weather).
 *
 * By M14 the learner conjugates three verb classes plus the stem changers.
 * This module is a breather from morphology: two noun fields (the home and
 * the weather) hung on one grammar contrast — hay for existence vs
 * está/están for location — plus the impersonal weather machine
 * (hace calor/frío/sol/viento, llueve, nieva) and the four seasons.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m14-1  Rooms of the house — la cocina, la sala, el dormitorio, el comedor
 *   es-m14-2  Furniture — la cama, el sofá, la lámpara, la televisión, el piso
 *   es-m14-3  ¿Hay o está? — refrigerador, estufa, cuadro, jardín
 *   es-m14-4  Weather with hace — clima, sol, hace calor, hace frío
 *   es-m14-5  Llueve y nieva — weather verbs, primavera, verano
 *   es-m14-6  Listening focus — viento, lluvia, nieve, otoño, invierno
 *   es-m14-7  Integration — Mi casa narrative + speaking
 *   es-m14-8  M14 Mastery Test
 *
 * Sentence-level listening only (M5+ ratchet): every listening_comprehension
 * carries a full sentence, every listening_build has ≥3 tiles.
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
import "./m13";

const COURSE_ID = "mock-1";

// ─── M14 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M14_ATOMS: EsAtom[] = [
  // Rooms & parts of the house
  atom({ surface: "cocina", meaningEn: "kitchen", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "🍳" }),
  atom({ surface: "sala", meaningEn: "living room", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f" }),
  atom({ surface: "dormitorio", meaningEn: "bedroom", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m" }),
  atom({ surface: "comedor", meaningEn: "dining room", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🍽️" }),
  atom({ surface: "jardín", meaningEn: "garden", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🌳" }),
  atom({ surface: "piso", meaningEn: "floor", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m" }),
  // Furniture & appliances
  atom({ surface: "cama", meaningEn: "bed", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "🛏️" }),
  atom({ surface: "sofá", meaningEn: "sofa", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🛋️" }),
  atom({ surface: "lámpara", meaningEn: "lamp", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "💡" }),
  atom({ surface: "refrigerador", meaningEn: "refrigerator", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m" }),
  atom({ surface: "estufa", meaningEn: "stove", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f" }),
  atom({ surface: "televisión", meaningEn: "television", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "📺" }),
  atom({ surface: "cuadro", meaningEn: "picture / painting", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🖼️" }),
  // Weather
  atom({ surface: "clima", meaningEn: "weather / climate", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m" }),
  atom({ surface: "sol", meaningEn: "sun", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "☀️" }),
  atom({ surface: "lluvia", meaningEn: "rain", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "🌧️" }),
  atom({ surface: "viento", meaningEn: "wind", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "💨" }),
  atom({ surface: "nieve", meaningEn: "snow", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "❄️" }),
  atom({ surface: "calor", meaningEn: "heat", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🥵" }),
  atom({ surface: "frío", meaningEn: "cold", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🥶" }),
  atom({ surface: "llueve", meaningEn: "it rains", partOfSpeech: "verb", fromModule: "m14", kind: "vocab" }),
  atom({ surface: "nieva", meaningEn: "it snows", partOfSpeech: "verb", fromModule: "m14", kind: "vocab" }),
  atom({ surface: "hace calor", meaningEn: "it's hot", partOfSpeech: "phrase", fromModule: "m14", kind: "phrase" }),
  atom({ surface: "hace frío", meaningEn: "it's cold", partOfSpeech: "phrase", fromModule: "m14", kind: "phrase" }),
  // Seasons
  atom({ surface: "primavera", meaningEn: "spring", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "f", emoji: "🌸" }),
  atom({ surface: "verano", meaningEn: "summer", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🏖️" }),
  atom({ surface: "otoño", meaningEn: "fall", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "🍂" }),
  atom({ surface: "invierno", meaningEn: "winter", partOfSpeech: "noun", fromModule: "m14", kind: "vocab", gender: "m", emoji: "⛄" }),
];

// Shared distractor entries for word-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg):
// 1f6cf 1f6cb 1f4a1 1f4fa 1f5bc 2600 1f327 1f4a8 2744 1f338 1f3d6 1f342
// 26c4 1f373 1f37d 1f333 1f975 1f976 — checked at authoring time.
const CAMA = { surface: "cama", emoji: "🛏️" };
const SOFA = { surface: "sofá", emoji: "🛋️" };
const LAMPARA = { surface: "lámpara", emoji: "💡" };
const TELEVISION = { surface: "televisión", emoji: "📺" };
const CUADRO = { surface: "cuadro", emoji: "🖼️" };
const SOL = { surface: "sol", emoji: "☀️" };
const LLUVIA = { surface: "lluvia", emoji: "🌧️" };
const VIENTO = { surface: "viento", emoji: "💨" };
const NIEVE = { surface: "nieve", emoji: "❄️" };
const PRIMAVERA = { surface: "primavera", emoji: "🌸" };
const VERANO = { surface: "verano", emoji: "🏖️" };
const OTONO = { surface: "otoño", emoji: "🍂" };

// ─── es-m14-1 — Rooms of the house ──────────────────────────────────────────

const M14_1: LessonContent = {
  id: "es-m14-1",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Las partes de la casa",
  description: "Name the rooms of a Spanish home.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m14-1-info-casa",
      "Inside la casa",
      "Spanish rooms come with their article glued on: la cocina (kitchen), la sala (living room), el dormitorio (bedroom), el comedor (dining room). To say where someone is, use está, just like with places in town: Mamá está en la cocina.",
      "grammar",
    ),
    phrase("es-m14-1-p-cocina", "the kitchen", "la cocina", undefined, { atomId: "es:cocina", emoji: "🍳" }),
    phrase("es-m14-1-p-sala", "the living room", "la sala", undefined, { atomId: "es:sala" }),
    sentenceMcq({
      id: "es-m14-1-q-cocina",
      prompt: "Which room is 'the kitchen'?",
      correctText: "la cocina",
      distractorsText: ["la sala", "el comedor", "el dormitorio"],
      exercisedAtomSurfaces: ["cocina"],
    }),
    sentenceMcq({
      id: "es-m14-1-q-sala",
      prompt: "Which room is 'the living room'?",
      correctText: "la sala",
      distractorsText: ["la cocina", "el jardín", "el comedor"],
      exercisedAtomSurfaces: ["sala"],
    }),
    phrase("es-m14-1-p-dormitorio", "the bedroom", "el dormitorio", undefined, { atomId: "es:dormitorio" }),
    phrase("es-m14-1-p-comedor", "the dining room", "el comedor", undefined, { atomId: "es:comedor", emoji: "🍽️" }),
    sentenceMcq({
      id: "es-m14-1-q-dormitorio",
      prompt: "You sleep there. Which room is it?",
      correctText: "el dormitorio",
      distractorsText: ["el comedor", "la cocina", "el jardín"],
      exercisedAtomSurfaces: ["dormitorio"],
    }),
    sentenceMcq({
      id: "es-m14-1-q-comedor",
      prompt: "Dinner is served. Which room do you head to?",
      correctText: "el comedor",
      distractorsText: ["el dormitorio", "la sala", "el baño"],
      exercisedAtomSurfaces: ["comedor"],
    }),
  ],
};

// ─── es-m14-2 — Furniture ───────────────────────────────────────────────────

const M14_2: LessonContent = {
  id: "es-m14-2",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Los muebles",
  description: "Furniture — and where each piece is.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    phrase("es-m14-2-p-cama", "the bed", "la cama", undefined, { atomId: "es:cama", emoji: "🛏️" }),
    phrase("es-m14-2-p-sofa", "the sofa", "el sofá", undefined, { atomId: "es:sofá", emoji: "🛋️" }),
    vocabMcq("es-m14-2-mcq-cama", { surface: "cama", meaningEn: "bed", emoji: "🛏️" }, [SOFA, LAMPARA, TELEVISION]),
    vocabMcq("es-m14-2-mcq-sofa", { surface: "sofá", meaningEn: "sofa", emoji: "🛋️" }, [CAMA, CUADRO, LAMPARA]),
    phrase("es-m14-2-p-lampara", "the lamp", "la lámpara", undefined, { atomId: "es:lámpara", emoji: "💡" }),
    phrase("es-m14-2-p-television", "the television", "la televisión", undefined, { atomId: "es:televisión", emoji: "📺" }),
    vocabMcq("es-m14-2-mcq-lampara", { surface: "lámpara", meaningEn: "lamp", emoji: "💡" }, [TELEVISION, CUADRO, CAMA]),
    vocabMcq("es-m14-2-mcq-television", { surface: "televisión", meaningEn: "television", emoji: "📺" }, [LAMPARA, SOFA, CUADRO]),
    build(
      "es-m14-2-build-piso",
      "Build: 'The lamp is on the floor.'",
      "la lámpara está en el piso",
      ["la", "lámpara", "está", "en", "el", "piso"],
      ["la", "lámpara", "está", "en", "el", "piso"],
      ["lámpara", "piso"],
    ),
  ],
};

// ─── es-m14-3 — ¿Hay o está? ────────────────────────────────────────────────

const M14_3: LessonContent = {
  id: "es-m14-3",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Hay o está?",
  description: "There is vs. it's there — existence and location.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m14-3-info-hayesta",
      "¿Hay o está?",
      "Hay says something exists: Hay una estufa en la cocina — there is a stove in the kitchen. Está says where a specific thing is: La estufa está en la cocina — the stove is in the kitchen. New information takes hay (with un/una); a known thing takes está (with el/la). Plural things that are somewhere take están.",
      "grammar",
    ),
    phrase("es-m14-3-p-refrigerador", "the refrigerator", "el refrigerador", undefined, { atomId: "es:refrigerador" }),
    phrase("es-m14-3-p-estufa", "the stove", "la estufa", undefined, { atomId: "es:estufa" }),
    sentenceMcq({
      id: "es-m14-3-q-hay-refri",
      prompt: "'There is a refrigerator in the kitchen.' — pick the Spanish.",
      correctText: "Hay un refrigerador en la cocina.",
      distractorsText: [
        "El refrigerador está en la cocina.",
        "El refrigerador es una cocina.",
        "No hay refrigerador en la cocina.",
      ],
      exercisedAtomSurfaces: ["refrigerador", "hay", "cocina"],
    }),
    sentenceMcq({
      id: "es-m14-3-q-esta-estufa",
      prompt: "'The stove is in the kitchen.' — pick the Spanish.",
      correctText: "La estufa está en la cocina.",
      distractorsText: [
        "Hay una estufa en la cocina.",
        "La estufa está en el comedor.",
        "La cocina está en la estufa.",
      ],
      exercisedAtomSurfaces: ["estufa"],
    }),
    phrase("es-m14-3-p-cuadro", "the picture", "el cuadro", undefined, { atomId: "es:cuadro", emoji: "🖼️" }),
    phrase("es-m14-3-p-jardin", "the garden", "el jardín", undefined, { atomId: "es:jardín", emoji: "🌳" }),
    vocabMcq("es-m14-3-mcq-cuadro", { surface: "cuadro", meaningEn: "picture / painting", emoji: "🖼️" }, [TELEVISION, LAMPARA, SOFA]),
    build(
      "es-m14-3-build-jardin",
      "Build: 'There is a garden next to the house.'",
      "hay un jardín al lado de la casa",
      ["hay", "un", "jardín", "al", "lado", "de", "la", "casa"],
      ["hay", "un", "jardín", "al", "lado", "de", "la", "casa"],
      ["jardín", "hay", "al lado de"],
    ),
  ],
};

// ─── es-m14-4 — Weather with hace ───────────────────────────────────────────

const M14_4: LessonContent = {
  id: "es-m14-4",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Cómo está el clima?",
  description: "Weather with hace — sun, heat, and cold.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m14-4-info-hace",
      "Weather runs on hace",
      "Spanish weather borrows hace ('it makes'): hace sol (it's sunny), hace viento (it's windy), hace calor (it's hot), hace frío (it's cold). Ask with ¿Cómo está el clima? — how's the weather? There's no 'it' anywhere: hace carries the whole sentence.",
      "grammar",
    ),
    phrase("es-m14-4-p-clima", "the weather", "el clima", undefined, { atomId: "es:clima" }),
    phrase("es-m14-4-p-sol", "the sun", "el sol", undefined, { atomId: "es:sol", emoji: "☀️" }),
    sentenceMcq({
      id: "es-m14-4-q-clima",
      prompt: "'How's the weather?' — pick the Spanish.",
      correctText: "¿Cómo está el clima?",
      distractorsText: ["¿Dónde está el clima?", "¿Cómo es la casa?", "¿Qué hora es?"],
      exercisedAtomSurfaces: ["clima"],
    }),
    vocabMcq("es-m14-4-mcq-sol", { surface: "sol", meaningEn: "sun", emoji: "☀️" }, [LLUVIA, NIEVE, VIENTO]),
    phrase("es-m14-4-p-hacecalor", "it's hot", "hace calor"),
    phrase("es-m14-4-p-hacefrio", "it's cold", "hace frío"),
    sentenceMcq({
      id: "es-m14-4-q-hacecalor",
      prompt: "It's a July afternoon on the beach in Cancún. What do you say?",
      correctText: "¡Hace calor!",
      distractorsText: ["¡Hace frío!", "Llueve mucho.", "Nieva mucho."],
      exercisedAtomSurfaces: ["hace calor", "calor"],
    }),
    sentenceMcq({
      id: "es-m14-4-q-hacefrio",
      prompt: "It's January in the mountains and you can see your breath. What do you say?",
      correctText: "¡Hace frío!",
      distractorsText: ["¡Hace calor!", "Hace sol.", "Llueve."],
      exercisedAtomSurfaces: ["hace frío", "frío"],
    }),
  ],
};

// ─── es-m14-5 — Llueve y nieva ──────────────────────────────────────────────

const M14_5: LessonContent = {
  id: "es-m14-5",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Llueve y nieva",
  description: "Rain, snow, and the first two seasons.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m14-5-info-llueve",
      "One-word weather",
      "llueve (it rains / it's raining) and nieva (it snows / it's snowing) are complete sentences — no subject needed. Pair them with the seasons: llueve en primavera, nieva en invierno.",
      "grammar",
    ),
    vocab("es-m14-5-v-llueve", "it rains", "llueve"),
    vocab("es-m14-5-v-nieva", "it snows", "nieva"),
    sentenceMcq({
      id: "es-m14-5-q-llueve",
      prompt: "'It rains a lot here.' — pick the Spanish.",
      correctText: "Llueve mucho aquí.",
      distractorsText: ["Nieva mucho aquí.", "Hace mucho calor aquí.", "Hace mucho sol aquí."],
      exercisedAtomSurfaces: ["llueve"],
    }),
    sentenceMcq({
      id: "es-m14-5-q-nieva",
      prompt: "'It snows a lot.' — pick the Spanish.",
      correctText: "Nieva mucho.",
      distractorsText: ["Llueve mucho.", "Hace mucho viento.", "Hace mucho frío."],
      exercisedAtomSurfaces: ["nieva"],
    }),
    phrase("es-m14-5-p-primavera", "spring", "la primavera", undefined, { atomId: "es:primavera", emoji: "🌸" }),
    phrase("es-m14-5-p-verano", "summer", "el verano", undefined, { atomId: "es:verano", emoji: "🏖️" }),
    sentenceMcq({
      id: "es-m14-5-q-primavera",
      prompt: "'It rains a lot in spring.' — pick the Spanish.",
      correctText: "Llueve mucho en primavera.",
      distractorsText: [
        "Nieva mucho en primavera.",
        "Llueve mucho en invierno.",
        "Hace frío en primavera.",
      ],
      exercisedAtomSurfaces: ["primavera", "llueve"],
    }),
    sentenceMcq({
      id: "es-m14-5-q-verano",
      prompt: "'In summer it's hot.' — pick the Spanish.",
      correctText: "En verano hace calor.",
      distractorsText: ["En verano hace frío.", "En verano nieva.", "En invierno hace calor."],
      exercisedAtomSurfaces: ["verano", "hace calor"],
    }),
  ],
};

// ─── es-m14-6 — Listening focus ─────────────────────────────────────────────

const M14_6: LessonContent = {
  id: "es-m14-6",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — clima y estaciones",
  description: "Sentence-level listening: wind, rain, snow, and fall.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    phrase("es-m14-6-p-viento", "the wind", "el viento", undefined, { atomId: "es:viento", emoji: "💨" }),
    phrase("es-m14-6-p-lluvia", "the rain", "la lluvia", undefined, { atomId: "es:lluvia", emoji: "🌧️" }),
    listeningCompSentence({
      id: "es-m14-6-lc-viento",
      audioText: "Hoy hace mucho viento.",
      correctMeaningEn: "It's very windy today.",
      distractorsEn: ["It's very sunny today.", "It's very cold today.", "It's raining a lot today."],
      exercisedAtomSurfaces: ["viento"],
    }),
    vocabMcq("es-m14-6-mcq-lluvia", { surface: "lluvia", meaningEn: "rain", emoji: "🌧️" }, [NIEVE, SOL, VIENTO]),
    phrase("es-m14-6-p-nieve", "the snow", "la nieve", undefined, { atomId: "es:nieve", emoji: "❄️" }),
    phrase("es-m14-6-p-otono", "fall", "el otoño", undefined, { atomId: "es:otoño", emoji: "🍂" }),
    vocabMcq("es-m14-6-mcq-nieve", { surface: "nieve", meaningEn: "snow", emoji: "❄️" }, [LLUVIA, SOL, VIENTO]),
    listeningCompSentence({
      id: "es-m14-6-lc-otono",
      audioText: "En otoño hace viento y hace frío.",
      correctMeaningEn: "In fall it's windy and cold.",
      distractorsEn: [
        "In summer it's windy and cold.",
        "In fall it's sunny and hot.",
        "In winter it snows a lot.",
      ],
      exercisedAtomSurfaces: ["otoño", "viento"],
    }),
    listeningBuildSentence({
      id: "es-m14-6-lb-invierno",
      target: "en invierno hay nieve",
      tiles: ["en", "invierno", "hay", "nieve", "lluvia"],
      correctOrder: ["en", "invierno", "hay", "nieve"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["invierno", "nieve"],
    }),
  ],
};

// ─── es-m14-7 — Integration ─────────────────────────────────────────────────

const M14_7: LessonContent = {
  id: "es-m14-7",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Mi casa — integración",
  description: "Put the whole house and the forecast together.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m14-7-info-micasa",
      "Mi casa",
      "Mi casa es pequeña pero bonita. Hay tres dormitorios, una sala y un jardín. La televisión está en la sala. Hoy llueve y hace frío, pero en mi casa no hace frío.\nEvery sentence is this module at work — read it out loud, then answer.",
      "default",
    ),
    sentenceMcq({
      id: "es-m14-7-q-story-jardin",
      prompt: "In the story, what is there outside the house?",
      correctText: "un jardín",
      distractorsText: ["una playa", "un mercado", "un parque"],
      exercisedAtomSurfaces: ["jardín"],
    }),
    build(
      "es-m14-7-build-dormitorios",
      "Build: 'There are three bedrooms in my house.'",
      "hay tres dormitorios en mi casa",
      ["hay", "tres", "dormitorios", "en", "mi", "casa"],
      ["hay", "tres", "dormitorios", "en", "mi", "casa"],
      ["dormitorio", "hay"],
    ),
    translateStep({
      id: "es-m14-7-tr-hacefrio",
      promptEn: "It's cold today.",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "Hoy hace frío.",
        "Hoy hace frio.",
        "hoy hace frío",
        "hoy hace frio",
        "Hace frío hoy.",
        "Hace frio hoy.",
        "hace frío hoy",
        "hace frio hoy",
      ],
      audioText: "Hoy hace frío.",
      exercisedAtomSurfaces: ["hace frío"],
    }),
    sentenceMcq({
      id: "es-m14-7-q-tv-sala",
      prompt: "Someone asks where the TV is. Pick the answer that gives its location.",
      correctText: "La televisión está en la sala.",
      distractorsText: [
        "Hay una televisión.",
        "La televisión es nueva.",
        "La televisión es de mi hermana.",
      ],
      exercisedAtomSurfaces: ["televisión", "sala"],
    }),
    speaking("es-m14-7-speak-sol", "Hace sol y hace calor.", "It's sunny and it's hot.", ["sol", "hace calor"]),
    translateStep({
      id: "es-m14-7-tr-sofa",
      promptEn: "There is a sofa in the living room.",
      acceptedAnswers: [
        "Hay un sofá en la sala.",
        "Hay un sofa en la sala.",
        "hay un sofá en la sala",
        "hay un sofa en la sala",
        "En la sala hay un sofá.",
        "En la sala hay un sofa.",
        "en la sala hay un sofá",
        "en la sala hay un sofa",
      ],
      audioText: "Hay un sofá en la sala.",
      exercisedAtomSurfaces: ["sofá", "sala"],
    }),
    speaking("es-m14-7-speak-casa", "Mi casa es pequeña pero bonita.", "My house is small but pretty.", ["casa"]),
  ],
};

// ─── es-m14-8 — Mastery test ────────────────────────────────────────────────

const M14_8: LessonContent = {
  id: "es-m14-8",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M14 Mastery Test",
  description: "Rooms, furniture, hay vs está, weather, and seasons.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m14-8-q-cocina",
      prompt: "'the kitchen' — which is it?",
      correctText: "la cocina",
      distractorsText: ["la sala", "el comedor", "el dormitorio"],
      exercisedAtomSurfaces: ["cocina"],
    }),
    vocabMcq("es-m14-8-mcq-invierno", { surface: "invierno", meaningEn: "winter", emoji: "⛄" }, [PRIMAVERA, VERANO, OTONO]),
    cloze(
      "es-m14-8-cloze-hay",
      "En mi dormitorio",
      "una cama.",
      "hay",
      ["hay", "está", "es", "hace"],
      "In my bedroom there is a bed.",
      "En mi dormitorio hay una cama.",
    ),
    listeningCompSentence({
      id: "es-m14-8-lc-clima",
      audioText: "Hoy llueve y hace frío.",
      correctMeaningEn: "Today it's raining and it's cold.",
      distractorsEn: [
        "Today it's snowing and it's cold.",
        "Today it's sunny and it's hot.",
        "Today it's windy and it's hot.",
      ],
      exercisedAtomSurfaces: ["llueve", "hace frío"],
    }),
    sentenceMcq({
      id: "es-m14-8-q-esta",
      prompt: "'The refrigerator is in the kitchen.' — pick the Spanish.",
      correctText: "El refrigerador está en la cocina.",
      distractorsText: [
        "Hay un refrigerador en la cocina.",
        "El refrigerador está en el jardín.",
        "El refrigerador es una cocina.",
      ],
      exercisedAtomSurfaces: ["refrigerador", "cocina"],
    }),
    translateStep({
      id: "es-m14-8-tr-hacecalor",
      promptEn: "It's hot.",
      acceptedAnswers: ["Hace calor.", "hace calor", "Hace calor", "¡Hace calor!"],
      audioText: "Hace calor.",
      exercisedAtomSurfaces: ["hace calor"],
    }),
    listeningBuildSentence({
      id: "es-m14-8-lb-sofa",
      target: "el sofá está en la sala",
      tiles: ["el", "sofá", "está", "en", "la", "sala", "cocina"],
      correctOrder: ["el", "sofá", "está", "en", "la", "sala"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["sofá", "sala"],
    }),
    sentenceMcq({
      id: "es-m14-8-q-nieva-invierno",
      prompt: "'It snows a lot in winter.' — pick the Spanish.",
      correctText: "Nieva mucho en invierno.",
      distractorsText: [
        "Llueve mucho en invierno.",
        "Nieva mucho en verano.",
        "Hace calor en invierno.",
      ],
      exercisedAtomSurfaces: ["nieva", "invierno"],
    }),
    speaking("es-m14-8-speak-verano", "En verano hace sol.", "In summer it's sunny.", ["verano", "sol"]),
  ],
};

export const ES_M14_LESSONS: LessonContent[] = [
  M14_1,
  M14_2,
  M14_3,
  M14_4,
  M14_5,
  M14_6,
  M14_7,
  M14_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M14_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m14",
      moduleId: "m14",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m14",
          prompt: "'It's cold.' (the weather) — which is correct?",
          correctText: "Hace frío.",
          distractorsText: ["Está frío.", "Hay frío.", "Es frío."],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m14-1",
      moduleId: "m14",
      build: () =>
        cloze(
          "pt-es-m14-1",
          "En la cocina",
          "un refrigerador.",
          "hay",
          ["hay", "está", "es", "hace"],
          "There is a refrigerator in the kitchen.",
          "En la cocina hay un refrigerador.",
        ),
    },
    {
      id: "pt-es-m14-2",
      moduleId: "m14",
      build: () =>
        sentenceMcq({
          id: "pt-es-m14-2",
          prompt: "'The bed is in the bedroom.' — pick the Spanish.",
          correctText: "La cama está en el dormitorio.",
          distractorsText: [
            "Hay una cama en el dormitorio.",
            "La cama es un dormitorio.",
            "La cama está en la cocina.",
          ],
        }),
    },
    {
      id: "pt-es-m14-3",
      moduleId: "m14",
      build: () =>
        sentenceMcq({
          id: "pt-es-m14-3",
          prompt: "'It's sunny today.' — pick the Spanish.",
          correctText: "Hoy hace sol.",
          distractorsText: ["Hoy hace viento.", "Hoy llueve.", "Hoy nieva."],
        }),
    },
    {
      id: "pt-es-m14-4",
      moduleId: "m14",
      build: () =>
        sentenceMcq({
          id: "pt-es-m14-4",
          prompt: "'It snows in winter.' — pick the Spanish.",
          correctText: "Nieva en invierno.",
          distractorsText: ["Llueve en verano.", "Nieva en primavera.", "Hace calor en invierno."],
        }),
    },
  ],
};
