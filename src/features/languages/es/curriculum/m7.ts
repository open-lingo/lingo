/**
 * Spanish Module 7 — Estar y lugares (estar, location, ser vs estar, al/del).
 *
 * The learner has ser (m2) for identity. M7 delivers the second 'to be':
 * estar for location and state — full singular plus estamos/están — with
 * the town-map vocabulary to use it (tienda, banco, parque, escuela…),
 * cerca/lejos/al lado de, Spanish's only two contractions (al, del), the
 * first ser-vs-estar contrast, and estar + feelings (bien, cansado,
 * contento, enfermo, mal).
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test). Rewritten 2026-07-16 to the
 * JA density/production/review standard (see docs/es-rewrite-brief-2026-07-16.md):
 * every topic lesson is 18-20 retrieval-heavy steps, forces typed + spoken +
 * built production, and closes on a compounding review tail from m1-m6.
 *
 *   es-m7-1  Estar — estoy, estás, está + estoy bien (selfExplain: person agreement)
 *   es-m7-2  ¿Dónde está? — first places (tienda, banco, ciudad, calle)
 *   es-m7-3  Más lugares — escuela, parque, restaurante, baño
 *   es-m7-4  Al, del — contractions + cerca / lejos / al lado de (selfExplain: contraction rule)
 *   es-m7-5  ¿Ser o estar? — the contrast + feelings + estamos/están (selfExplain: identity/nature vs location/state)
 *   es-m7-6  Listening focus — places & states
 *   es-m7-7  Integration — a tourist dialogue + speaking
 *   es-m7-8  M7 Mastery Test
 *
 * Every place-noun emoji below has verified Noto art in the bundled subset
 * (src/pub/noto-emoji/svg), checked at authoring time. Listening is
 * sentence-level throughout (M5+ ratchet).
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
  vocab,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";

// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m6";

const COURSE_ID = "mock-1";

// ─── M7 atoms (exactly the spine allocation — UNCHANGED) ────────────────────

export const ES_M7_ATOMS: EsAtom[] = [
  // estar — infinitive + presente
  atom({ surface: "estar", meaningEn: "to be (location/state)", partOfSpeech: "verb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "estoy", meaningEn: "I am (state)", partOfSpeech: "verb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "estás", meaningEn: "you are (state)", partOfSpeech: "verb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "está", meaningEn: "he/she/it is (state)", partOfSpeech: "verb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "estamos", meaningEn: "we are (state)", partOfSpeech: "verb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "están", meaningEn: "they are (state)", partOfSpeech: "verb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "dónde", meaningEn: "where", partOfSpeech: "adverb", fromModule: "m7", kind: "vocab" }),
  // Around town
  atom({ surface: "ciudad", meaningEn: "city", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "🌆" }),
  atom({ surface: "calle", meaningEn: "street", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "🛣️" }),
  atom({ surface: "tienda", meaningEn: "store", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "🏪" }),
  atom({ surface: "banco", meaningEn: "bank", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "🏦" }),
  atom({ surface: "parque", meaningEn: "park", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "🏞️" }),
  atom({ surface: "escuela", meaningEn: "school", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "f", emoji: "🏫" }),
  atom({ surface: "restaurante", meaningEn: "restaurant", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "🍽️" }),
  atom({ surface: "baño", meaningEn: "bathroom", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "🚻" }),
  atom({ surface: "hotel", meaningEn: "hotel", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "🏨" }),
  atom({ surface: "aeropuerto", meaningEn: "airport", partOfSpeech: "noun", fromModule: "m7", kind: "vocab", gender: "m", emoji: "✈️" }),
  // Position words + the two contractions
  atom({ surface: "cerca", meaningEn: "near", partOfSpeech: "adverb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "lejos", meaningEn: "far", partOfSpeech: "adverb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "al lado de", meaningEn: "next to", partOfSpeech: "phrase", fromModule: "m7", kind: "phrase" }),
  atom({ surface: "a", meaningEn: "to / at", partOfSpeech: "particle", fromModule: "m7", kind: "particle" }),
  atom({ surface: "al", meaningEn: "to the (m)", partOfSpeech: "particle", fromModule: "m7", kind: "particle" }),
  atom({ surface: "del", meaningEn: "of the (m)", partOfSpeech: "particle", fromModule: "m7", kind: "particle" }),
  // States and feelings
  atom({ surface: "bien", meaningEn: "well / fine", partOfSpeech: "adverb", fromModule: "m7", kind: "vocab", emoji: "💪" }),
  atom({ surface: "mal", meaningEn: "badly", partOfSpeech: "adverb", fromModule: "m7", kind: "vocab" }),
  atom({ surface: "cansado", meaningEn: "tired (m)", partOfSpeech: "adjective", fromModule: "m7", kind: "vocab", emoji: "😴" }),
  atom({ surface: "contento", meaningEn: "happy (m)", partOfSpeech: "adjective", fromModule: "m7", kind: "vocab", emoji: "😊" }),
  atom({ surface: "enfermo", meaningEn: "sick (m)", partOfSpeech: "adjective", fromModule: "m7", kind: "vocab", emoji: "🤒" }),
];

// Shared distractor pool for place/feeling-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// checked at authoring time.
const CIUDAD = { surface: "ciudad", emoji: "🌆" };
const CALLE = { surface: "calle", emoji: "🛣️" };
const TIENDA = { surface: "tienda", emoji: "🏪" };
const BANCO = { surface: "banco", emoji: "🏦" };
const PARQUE = { surface: "parque", emoji: "🏞️" };
const ESCUELA = { surface: "escuela", emoji: "🏫" };
const RESTAURANTE = { surface: "restaurante", emoji: "🍽️" };
const BAÑO = { surface: "baño", emoji: "🚻" };
const HOTEL = { surface: "hotel", emoji: "🏨" };
const AEROPUERTO = { surface: "aeropuerto", emoji: "✈️" };
const CANSADO = { surface: "cansado", emoji: "😴" };
const CONTENTO = { surface: "contento", emoji: "😊" };
const ENFERMO = { surface: "enfermo", emoji: "🤒" };
const BIEN = { surface: "bien", emoji: "💪" };

// ─── es-m7-1 — Estar, singular ──────────────────────────────────────────────

const M7_1: LessonContent = {
  id: "es-m7-1",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Estar — the other 'to be'",
  description: "Spanish has two 'to be' verbs. Meet the one for states.",
  estimatedMinutes: 8,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m7-1-info-estar",
      "The other 'to be'",
      "You know ser (soy, eres, es) for who or what something IS. Spanish has a second 'to be' — estar — for where something is and how it feels right now. Singular: estoy (I am), estás (you are), está (he/she/it is). Estoy bien = I'm fine.",
      "grammar",
    ),
    vocabMcq("es-m7-1-mcq-bien", { surface: "bien", meaningEn: "well / fine", emoji: "💪" }, [CANSADO, CONTENTO, BANCO]),
    sentenceMcq({
      id: "es-m7-1-q-estoybien",
      prompt: "'I am fine' — which is correct?",
      correctText: "estoy bien",
      distractorsText: ["estás bien", "está bien", "soy bien"],
      explanation: "First person of the state verb — and never the identity verb here.",
      exercisedAtomSurfaces: ["estoy", "bien"],
    }),
    speaking("es-m7-1-speak-estoybien", "Estoy bien.", "I'm fine.", ["estoy", "bien"]),
    vocab("es-m7-1-p-estas", "you are (state/location)", "estás"),
    sentenceMcq({
      id: "es-m7-1-q-estasbien",
      prompt: "Ask your friend if they're OK:",
      correctText: "¿Estás bien?",
      distractorsText: ["¿Estoy bien?", "¿Es bien?", "¿Eres bien?"],
      exercisedAtomSurfaces: ["estás", "bien"],
    }),
    build(
      "es-m7-1-build-estascansado",
      "Build: 'Are you tired?'",
      "¿estás cansado?",
      ["estás", "cansado", "tú", "estoy"],
      ["estás", "cansado"],
      ["estás", "cansado"],
    ),
    vocabMcq("es-m7-1-mcq-cansado", { surface: "cansado", meaningEn: "tired", emoji: "😴" }, [CONTENTO, BIEN, BANCO]),
    vocab("es-m7-1-p-esta", "he/she/it is (state/location)", "está"),
    cloze(
      "es-m7-1-cloze-esta",
      "mi mamá",
      "en casa",
      "está",
      ["está", "estoy", "estás", "es"],
      "my mom is at home",
      "mi mamá está en casa",
      "Third person of the state verb — mamá is a she.",
    ),
    translateStep({
      id: "es-m7-1-tr-estoybien",
      promptEn: "I'm fine",
      acceptedAnswers: ["estoy bien", "Estoy bien", "estoy bien.", "Estoy bien.", "¡Estoy bien!"],
      audioText: "estoy bien",
      exercisedAtomSurfaces: ["estoy", "bien"],
    }),
    sentenceMcq({
      id: "es-m7-1-q-papaencasa",
      prompt: "'My dad is at home today' — which is correct?",
      correctText: "mi papá está en casa hoy",
      distractorsText: ["mi papá estoy en casa hoy", "mi papá estás en casa hoy", "mi papá es en casa hoy"],
      exercisedAtomSurfaces: ["está"],
    }),
    speaking("es-m7-1-speak-estascansado", "Estás cansado.", "You are tired.", ["estás", "cansado"]),
    sentenceMcq({
      id: "es-m7-1-q-yocansado",
      prompt: "Which sentence is correct?",
      correctText: "yo estoy cansado hoy",
      distractorsText: ["yo estás cansado hoy", "yo es cansado hoy", "yo soy cansado hoy"],
      exercisedAtomSurfaces: ["estoy", "cansado"],
    }),
    build(
      "es-m7-1-build-mamabien",
      "Build: 'My mom is fine.'",
      "mi mamá está bien",
      ["mi", "mamá", "está", "bien", "estoy"],
      ["mi", "mamá", "está", "bien"],
      ["está", "bien"],
    ),
    translateStep({
      id: "es-m7-1-tr-estascansado",
      promptEn: "You are tired",
      acceptedAnswers: ["estás cansado", "Estás cansado", "estás cansado.", "Estás cansado."],
      audioText: "estás cansado",
      exercisedAtomSurfaces: ["estás", "cansado"],
    }),
    selfExplain({
      id: "es-m7-1-se-persona",
      anchorLabel: "You wrote: mi mamá está bien.",
      question: "Why está here, and not estoy or es?",
      rule: {
        text: "Estar changes by WHO is doing the being — mamá is 'she' (third person), so the verb must be está, the same person-slot as es/soy, just on the state verb instead of the identity one.",
      },
      surface: {
        text: "Feminine subjects like mamá always pair with está — the verb agrees with gender, not person.",
      },
      distractor: {
        text: "Está is the default whenever you're talking about someone else — estoy and estás are only for describing yourself.",
      },
      ruleExplanation:
        "Estar conjugates by grammatical person (I / you / he-she-it), exactly like every Spanish verb. Gender never changes the verb form — only person does. Mamá triggers está because she's 'he/she/it,' not because she's feminine.",
    }),
    infoStep(
      "es-m7-1-info-win",
      "You've got the other 'to be'",
      "You can now say where you are and how you feel — estoy, estás, está all locked in.",
      "win",
    ),
  ],
};

// ─── es-m7-2 — ¿Dónde está? + first places ──────────────────────────────────

const M7_2: LessonContent = {
  id: "es-m7-2",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Dónde está? — first places",
  description: "Ask where things are, and meet the first town words.",
  estimatedMinutes: 9,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m7-2-info-donde",
      "Asking where",
      "¿Dónde está…? = where is…? Answer with en: la tienda está en la calle (the store is on the street). You already know en from M3 — with estar it pins anything to a place.",
      "grammar",
    ),
    vocabMcq("es-m7-2-mcq-tienda", { surface: "tienda", meaningEn: "store", emoji: "🏪" }, [BANCO, CIUDAD, HOTEL]),
    sentenceMcq({
      id: "es-m7-2-q-donde",
      prompt: "You're looking for the store. Ask where it is:",
      correctText: "¿Dónde está la tienda?",
      distractorsText: ["¿Dónde es la tienda?", "¿Dónde estás la tienda?", "¿Dónde soy la tienda?"],
      explanation: "Location questions take the state verb in the third person.",
      exercisedAtomSurfaces: ["dónde", "está", "tienda"],
    }),
    build(
      "es-m7-2-build-tiendacalle",
      "Build: 'The store is on the street.'",
      "la tienda está en la calle",
      ["la", "tienda", "está", "en", "la", "calle", "el"],
      ["la", "tienda", "está", "en", "la", "calle"],
      ["tienda", "calle"],
    ),
    vocabMcq("es-m7-2-mcq-banco", { surface: "banco", meaningEn: "bank", emoji: "🏦" }, [TIENDA, CIUDAD, HOTEL]),
    cloze(
      "es-m7-2-cloze-tienda",
      "la",
      "está en la calle",
      "tienda",
      ["tienda", "ciudad", "casa", "mesa"],
      "the store is on the street",
      "la tienda está en la calle",
    ),
    speaking("es-m7-2-speak-donde-banco", "¿Dónde está el banco?", "Where is the bank?", ["dónde", "está", "banco"]),
    vocabMcq("es-m7-2-mcq-ciudad", { surface: "ciudad", meaningEn: "city", emoji: "🌆" }, [BANCO, TIENDA, CALLE]),
    sentenceMcq({
      id: "es-m7-2-q-ciudad",
      prompt: "Mi tía vive en el centro de la ciudad. ¿Qué significa 'la ciudad'?",
      correctText: "the city",
      distractorsText: ["the street", "the store", "the park"],
      exercisedAtomSurfaces: ["ciudad"],
    }),
    translateStep({
      id: "es-m7-2-tr-dondebanco",
      promptEn: "Where is the bank?",
      acceptedAnswers: ["¿dónde está el banco?", "¿Dónde está el banco?", "dónde está el banco", "donde esta el banco"],
      audioText: "¿dónde está el banco?",
      exercisedAtomSurfaces: ["dónde", "está", "banco"],
    }),
    sentenceMcq({
      id: "es-m7-2-q-dondecalle",
      prompt: "Ask a stranger where Bolívar street is:",
      correctText: "¿Dónde está la calle Bolívar?",
      distractorsText: ["¿Qué está la calle Bolívar?", "¿Cómo está la calle Bolívar?", "¿Quién está la calle Bolívar?"],
      exercisedAtomSurfaces: ["dónde", "está", "calle"],
    }),
    speaking("es-m7-2-speak-tiendacalle", "La tienda está en la calle.", "The store is on the street.", ["tienda", "calle"]),
    cloze(
      "es-m7-2-cloze-ciudad",
      "el banco está en la",
      "",
      "ciudad",
      ["ciudad", "tienda", "calle", "casa"],
      "the bank is in the city",
      "el banco está en la ciudad",
    ),
    build(
      "es-m7-2-build-dondeciudad",
      "Build: 'Where is the city?'",
      "¿dónde está la ciudad?",
      ["dónde", "está", "la", "ciudad", "el"],
      ["dónde", "está", "la", "ciudad"],
      ["dónde", "está", "ciudad"],
    ),
    reviewMatchPairs("es-m7-2-rev", "es-m7-2-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-2-q-review-hermana",
      prompt: "'My sister is at the store' — which is correct?",
      correctText: "mi hermana está en la tienda",
      distractorsText: ["mi hermana es en la tienda", "mi hermana estás en la tienda", "mi hermana están en la tienda"],
      exercisedAtomSurfaces: ["hermana", "está", "tienda"],
    }),
    translateStep({
      id: "es-m7-2-tr-review-amigo",
      promptEn: "My friend is at the bank.",
      acceptedAnswers: ["mi amigo está en el banco", "Mi amigo está en el banco", "mi amigo esta en el banco", "Mi amigo esta en el banco"],
      audioText: "mi amigo está en el banco",
      exercisedAtomSurfaces: ["amigo", "está", "banco"],
    }),
    infoStep(
      "es-m7-2-info-win",
      "You can find anything",
      "You can now ask where something is and understand the answer — the whole town is open to you.",
      "win",
    ),
  ],
};

// ─── es-m7-3 — More places ──────────────────────────────────────────────────

const M7_3: LessonContent = {
  id: "es-m7-3",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Más lugares",
  description: "School, park, restaurant — and the essential baño.",
  estimatedMinutes: 9,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m7-3-info-lugares",
      "Places keep their gender",
      "Place nouns follow the same el/la system you learned in M2 — el parque, la escuela. And estar + en 'pins' anyone to a place: mi hermano está en la escuela (my brother is at school).",
      "grammar",
    ),
    vocabMcq("es-m7-3-mcq-escuela", { surface: "escuela", meaningEn: "school", emoji: "🏫" }, [PARQUE, TIENDA, BANCO]),
    sentenceMcq({
      id: "es-m7-3-q-escuela-comp",
      prompt: "Mi hermano está en la escuela ahora. ¿Qué significa 'la escuela'?",
      correctText: "the school",
      distractorsText: ["the store", "the park", "the restaurant"],
      exercisedAtomSurfaces: ["escuela"],
    }),
    build(
      "es-m7-3-build-hermanoescuela",
      "Build: 'My brother is at school.'",
      "mi hermano está en la escuela",
      ["mi", "hermano", "está", "en", "la", "escuela", "el"],
      ["mi", "hermano", "está", "en", "la", "escuela"],
      ["hermano", "está", "escuela"],
    ),
    vocabMcq("es-m7-3-mcq-parque", { surface: "parque", meaningEn: "park", emoji: "🏞️" }, [ESCUELA, CIUDAD, CALLE]),
    cloze(
      "es-m7-3-cloze-escuela",
      "mi hermano está en la",
      "",
      "escuela",
      ["escuela", "tienda", "ciudad", "mesa"],
      "my brother is at school",
      "mi hermano está en la escuela",
    ),
    speaking("es-m7-3-speak-parque", "Estoy en el parque.", "I'm at the park.", ["estoy", "parque"]),
    vocabMcq("es-m7-3-mcq-restaurante", { surface: "restaurante", meaningEn: "restaurant", emoji: "🍽️" }, [BAÑO, ESCUELA, PARQUE]),
    cloze(
      "es-m7-3-cloze-restaurante",
      "mi familia come en el",
      "",
      "restaurante",
      ["restaurante", "baño", "escuela", "parque"],
      "my family eats at the restaurant",
      "mi familia come en el restaurante",
    ),
    speaking("es-m7-3-speak-restaurante", "Estoy en el restaurante.", "I'm at the restaurant.", ["estoy", "restaurante"]),
    vocabMcq("es-m7-3-mcq-bano", { surface: "baño", meaningEn: "bathroom", emoji: "🚻" }, [RESTAURANTE, ESCUELA, PARQUE]),
    sentenceMcq({
      id: "es-m7-3-q-bano",
      prompt: "Ask where the bathroom is:",
      correctText: "¿Dónde está el baño?",
      distractorsText: ["¿Dónde es el baño?", "¿Dónde están el baño?", "¿Dónde estás el baño?"],
      exercisedAtomSurfaces: ["dónde", "está", "baño"],
    }),
    translateStep({
      id: "es-m7-3-tr-restaurante",
      promptEn: "Where is the restaurant?",
      acceptedAnswers: ["¿dónde está el restaurante?", "¿Dónde está el restaurante?", "dónde está el restaurante", "donde esta el restaurante"],
      audioText: "¿dónde está el restaurante?",
      exercisedAtomSurfaces: ["dónde", "está", "restaurante"],
    }),
    sentenceMcq({
      id: "es-m7-3-q-escuela2",
      prompt: "'My sister studies at school' — which is correct?",
      correctText: "mi hermana estudia en la escuela",
      distractorsText: ["mi hermana estudia en el parque", "mi hermana estudia en la tienda", "mi hermana estudia en el restaurante"],
      exercisedAtomSurfaces: ["hermana", "escuela"],
    }),
    speaking("es-m7-3-speak-restciudad", "El restaurante está en la ciudad.", "The restaurant is in the city.", ["restaurante", "ciudad"]),
    reviewMatchPairs("es-m7-3-rev", "es-m7-3-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-3-q-review-familia",
      prompt: "'My family is at home' — which is correct?",
      correctText: "mi familia está en casa",
      distractorsText: ["mi familia es en casa", "mi familia estoy en casa", "mi familia están en casa"],
      exercisedAtomSurfaces: ["familia", "está"],
    }),
    translateStep({
      id: "es-m7-3-tr-review-gato",
      promptEn: "The cat is at the park.",
      acceptedAnswers: ["el gato está en el parque", "El gato está en el parque", "el gato esta en el parque"],
      audioText: "el gato está en el parque",
      exercisedAtomSurfaces: ["gato", "está", "parque"],
    }),
    infoStep(
      "es-m7-3-info-win",
      "The whole town, mapped",
      "School, park, restaurant, bathroom — you can name and locate every stop on the map now.",
      "win",
    ),
  ],
};

// ─── es-m7-4 — Al, del + position words ─────────────────────────────────────

const M7_4: LessonContent = {
  id: "es-m7-4",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Al, del — cerca y lejos",
  description: "Spanish's only two contractions, plus near, far, and next to.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m7-4-info-contractions",
      "The only two contractions",
      "a + el always fuses into al, and de + el always fuses into del — these are the only contractions Spanish has, and they're mandatory. Position words ride on de: cerca de (near), lejos de (far from), al lado de (next to). So 'next to the bank' is al lado del banco.",
      "grammar",
    ),
    vocabMcq("es-m7-4-mcq-hotel", { surface: "hotel", meaningEn: "hotel", emoji: "🏨" }, [BANCO, TIENDA, AEROPUERTO]),
    cloze(
      "es-m7-4-cloze-cerca",
      "el hotel está",
      "",
      "cerca",
      ["cerca", "lejos", "bien", "mal"],
      "the hotel is near",
      "el hotel está cerca",
    ),
    speaking("es-m7-4-speak-hotelcerca", "El hotel está cerca.", "The hotel is near.", ["hotel", "cerca"]),
    vocabMcq("es-m7-4-mcq-aeropuerto", { surface: "aeropuerto", meaningEn: "airport", emoji: "✈️" }, [HOTEL, BANCO, TIENDA]),
    sentenceMcq({
      id: "es-m7-4-q-aeropuerto",
      prompt: "'The airport is far from the city' — which is correct?",
      correctText: "el aeropuerto está lejos de la ciudad",
      distractorsText: [
        "el aeropuerto es lejos de la ciudad",
        "el aeropuerto están lejos de la ciudad",
        "el aeropuerto estás lejos de la ciudad",
      ],
      exercisedAtomSurfaces: ["aeropuerto", "lejos", "está"],
    }),
    build(
      "es-m7-4-build-allado",
      "Build: 'The hotel is next to the airport.'",
      "el hotel está al lado del aeropuerto",
      ["el", "hotel", "está", "al", "lado", "del", "aeropuerto"],
      ["el", "hotel", "está", "al", "lado", "del", "aeropuerto"],
      ["al lado de", "hotel", "aeropuerto"],
    ),
    cloze(
      "es-m7-4-cloze-al",
      "el hotel está",
      "lado del aeropuerto",
      "al",
      ["al", "del", "el", "la"],
      "the hotel is next to the airport",
      "el hotel está al lado del aeropuerto",
    ),
    speaking("es-m7-4-speak-bancolejos", "El banco está lejos.", "The bank is far.", ["banco", "lejos"]),
    cloze(
      "es-m7-4-cloze-del",
      "el banco está cerca",
      "parque",
      "del",
      ["del", "al", "de", "la"],
      "the bank is near the park",
      "el banco está cerca del parque",
      "de + el fuses — the two words never stay separate.",
    ),
    vocabTextMcq("es-m7-4-vm-lejos", "lejos", ["cerca", "bien", "mal"]),
    build(
      "es-m7-4-build-allado2",
      "Build: 'The restaurant is next to the hotel.'",
      "el restaurante está al lado del hotel",
      ["el", "restaurante", "está", "al", "lado", "del", "hotel"],
      ["el", "restaurante", "está", "al", "lado", "del", "hotel"],
      ["al lado de", "restaurante", "hotel"],
    ),
    sentenceMcq({
      id: "es-m7-4-q-alladodetienda",
      prompt: "'The hotel is next to the store' — which is correct?",
      correctText: "el hotel está al lado de la tienda",
      distractorsText: ["el hotel es al lado de la tienda", "el hotel están al lado de la tienda", "el hotel estás al lado de la tienda"],
      exercisedAtomSurfaces: ["hotel", "al lado de", "tienda"],
    }),
    translateStep({
      id: "es-m7-4-tr-bancocercaparque",
      promptEn: "The bank is near the park.",
      acceptedAnswers: [
        "el banco está cerca del parque",
        "El banco está cerca del parque",
        "el banco esta cerca del parque",
        "El banco esta cerca del parque",
      ],
      audioText: "el banco está cerca del parque",
      exercisedAtomSurfaces: ["banco", "cerca", "del", "parque"],
    }),
    reviewMatchPairs("es-m7-4-rev", "es-m7-4-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-4-q-review-gatocasa",
      prompt: "'The cat is near the house' — which is correct?",
      correctText: "el gato está cerca de la casa",
      distractorsText: ["el gato es cerca de la casa", "el gato están cerca de la casa", "el gato estás cerca de la casa"],
      exercisedAtomSurfaces: ["gato", "cerca", "casa"],
    }),
    speaking("es-m7-4-speak-review-libro", "El libro está lejos de la mesa.", "The book is far from the table.", ["libro", "lejos", "mesa"]),
    build(
      "es-m7-4-build-dondeaeropuerto",
      "Build: 'Where is the airport?'",
      "¿dónde está el aeropuerto?",
      ["dónde", "está", "el", "aeropuerto", "es"],
      ["dónde", "está", "el", "aeropuerto"],
      ["dónde", "está", "aeropuerto"],
    ),
    selfExplain({
      id: "es-m7-4-se-contraccion",
      anchorLabel: "You wrote: el banco está cerca del parque.",
      question: "Why del here, and not de el?",
      rule: {
        text: "de + el always fuses into del (and a + el into al) whenever el immediately follows — it's mandatory, in speech and in writing, every time.",
      },
      surface: {
        text: "Contracting is just casual speech — in careful or written Spanish, 'de el' and 'a el' are just as correct.",
      },
      distractor: {
        text: "del is used before masculine place words and de el before feminine ones — the contraction depends on the noun's gender.",
      },
      ruleExplanation:
        "a+el→al and de+el→del are obligatory fusions triggered by the word el itself, not by formality and not by the following noun's gender — el is already masculine singular, so gender doesn't enter into it.",
    }),
    infoStep(
      "es-m7-4-info-win",
      "You can place anything",
      "Near, far, next to — al and del are automatic now, so you can locate anything relative to anything else.",
      "win",
    ),
  ],
};

// ─── es-m7-5 — Ser vs estar + feelings ──────────────────────────────────────

const M7_5: LessonContent = {
  id: "es-m7-5",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Ser o estar? — feelings",
  description: "Identity vs state, the plural forms, and how you feel.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m7-5-info-serestar",
      "Ser vs estar",
      "Ser says what something IS by nature: soy estudiante, es mi hermana. Estar says where it is or how it is right now: estoy en casa, estoy cansado. Same English 'to be', two different questions. The plural forms of estar: estamos (we are), están (they are).",
      "grammar",
    ),
    vocabMcq("es-m7-5-mcq-cansado", { surface: "cansado", meaningEn: "tired", emoji: "😴" }, [CONTENTO, BIEN, ENFERMO]),
    sentenceMcq({
      id: "es-m7-5-q-cansado",
      prompt: "'I am tired' — which is correct?",
      correctText: "estoy cansado",
      distractorsText: ["soy cansado", "estás cansado", "es cansado"],
      explanation: "Tiredness is a state right now, so the identity verb is wrong.",
      exercisedAtomSurfaces: ["estoy", "cansado"],
    }),
    translateStep({
      id: "es-m7-5-tr-essimpatico",
      promptEn: "He is nice.",
      acceptedAnswers: ["es simpático", "Es simpático", "es simpático.", "Es simpático."],
      audioText: "es simpático",
      exercisedAtomSurfaces: ["simpático"],
    }),
    vocabMcq("es-m7-5-mcq-contento", { surface: "contento", meaningEn: "happy", emoji: "😊" }, [CANSADO, BIEN, ENFERMO]),
    sentenceMcq({
      id: "es-m7-5-q-contento",
      prompt: "'My dad is happy' — which is correct?",
      correctText: "mi papá está contento",
      distractorsText: ["mi papá es contento", "mi papá estás contento", "mi papá soy contento"],
      exercisedAtomSurfaces: ["está", "contento"],
    }),
    translateStep({
      id: "es-m7-5-tr-estacansado",
      promptEn: "He is tired.",
      acceptedAnswers: ["está cansado", "Está cansado", "está cansado.", "Está cansado."],
      audioText: "está cansado",
      exercisedAtomSurfaces: ["está", "cansado"],
    }),
    vocabMcq("es-m7-5-mcq-enfermo", { surface: "enfermo", meaningEn: "sick", emoji: "🤒" }, [CANSADO, CONTENTO, BIEN]),
    cloze(
      "es-m7-5-cloze-estamos",
      "mi amiga y yo",
      "en el parque",
      "estamos",
      ["estamos", "están", "estoy", "estás"],
      "my friend and I are in the park",
      "mi amiga y yo estamos en el parque",
      "'My friend and I' = we, so the verb takes the nosotros form.",
    ),
    speaking("es-m7-5-speak-estamosparque", "Estamos en el parque.", "We are in the park.", ["estamos", "parque"]),
    sentenceMcq({
      id: "es-m7-5-q-estan",
      prompt: "'My friends are at the restaurant' — which is correct?",
      correctText: "mis amigas están en el restaurante",
      distractorsText: [
        "mis amigas estamos en el restaurante",
        "mis amigas está en el restaurante",
        "mis amigas son en el restaurante",
      ],
      exercisedAtomSurfaces: ["están", "restaurante"],
    }),
    // Feeling adjectives agree with the person — -a for her, -o for him.
    agreementCloze(
      "es-m7-5-agr-cansada",
      [
        { text: "mi hermana está cansad" },
        { blank: { id: "b1", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
        { text: " y mi hermano está content" },
        { blank: { id: "b2", correctAnswer: "o", options: ["o", "a", "os", "as"] } },
      ],
      "my sister is tired and my brother is happy",
      "mi hermana está cansada y mi hermano está contento",
      ["cansado", "contento", "hermana", "hermano"],
    ),
    build(
      "es-m7-5-build-contrast",
      "Build: 'My friend is nice, but today he's tired.'",
      "mi amigo es simpático pero hoy está cansado",
      ["mi", "amigo", "es", "simpático", "pero", "hoy", "está", "cansado", "son"],
      ["mi", "amigo", "es", "simpático", "pero", "hoy", "está", "cansado"],
      ["amigo", "simpático", "está", "cansado"],
    ),
    vocabTextMcq("es-m7-5-vm-mal", "mal", ["bien", "cansado", "enfermo"]),
    speaking(
      "es-m7-5-speak-contrast2",
      "Mi hermana está enferma, pero es muy simpática.",
      "My sister is sick, but she's very nice.",
      ["hermana", "enfermo", "simpático"],
    ),
    reviewMatchPairs("es-m7-5-rev", "es-m7-5-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-5-q-review-abuela",
      prompt: "'My grandmother is happy today' — which is correct?",
      correctText: "mi abuela está contenta hoy",
      distractorsText: ["mi abuela es contenta hoy", "mi abuela estás contenta hoy", "mi abuela son contenta hoy"],
      exercisedAtomSurfaces: ["abuela", "está", "contento"],
    }),
    translateStep({
      id: "es-m7-5-tr-review-hermanoenfermo",
      promptEn: "My brother is sick today.",
      acceptedAnswers: ["mi hermano está enfermo hoy", "Mi hermano está enfermo hoy", "mi hermano esta enfermo hoy"],
      audioText: "mi hermano está enfermo hoy",
      exercisedAtomSurfaces: ["hermano", "está", "enfermo"],
    }),
    selfExplain({
      id: "es-m7-5-se-serestar",
      anchorLabel: "You wrote: Mi amigo es simpático, pero hoy está cansado.",
      question: "Why es for simpático but está for cansado, in the very same sentence?",
      rule: {
        text: "Es marks a trait of who your friend fundamentally IS (his nature); está marks the state he's in right now. The split is identity/nature vs. location/state — not how long each one lasts.",
      },
      surface: {
        text: "Ser is for permanent qualities and estar is for temporary ones — being nice is forever, being tired isn't.",
      },
      distractor: {
        text: "Estar always goes with adjectives that describe feelings, and ser goes with every other adjective — you choose the verb by adjective type, not meaning.",
      },
      ruleExplanation:
        "Duration isn't the rule: some estar-states last years (está casado, 'he's married') and some ser-facts are momentary (es la una, 'it's one o'clock'). The real split is what kind of fact you're stating — identity/nature (ser) vs. location/condition (estar).",
    }),
    infoStep(
      "es-m7-5-info-win",
      "You can describe anyone, any way",
      "You can now say what someone IS and how they're doing right now — and never mix up the two.",
      "win",
    ),
  ],
};

// ─── es-m7-6 — Listening focus ──────────────────────────────────────────────

const M7_6: LessonContent = {
  id: "es-m7-6",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — places & states",
  description: "Train your ear on where things are and how people feel.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    listeningCompSentence({
      id: "es-m7-6-lc-bano",
      audioText: "¿dónde está el baño?",
      correctMeaningEn: "where is the bathroom?",
      distractorsEn: ["where is the bank?", "where is the school?", "where is the store?"],
      exercisedAtomSurfaces: ["dónde", "está", "baño"],
    }),
    listeningBuildSentence({
      id: "es-m7-6-lb-parque",
      target: "estoy en el parque",
      tiles: ["estoy", "en", "el", "parque", "banco"],
      correctOrder: ["estoy", "en", "el", "parque"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["estoy", "parque"],
    }),
    listeningCompSentence({
      id: "es-m7-6-lc-enferma",
      audioText: "mi hermana está enferma",
      correctMeaningEn: "my sister is sick",
      distractorsEn: ["my sister is tired", "my brother is sick", "my sister is happy"],
      exercisedAtomSurfaces: ["está", "enfermo"],
    }),
    listeningBuildSentence({
      id: "es-m7-6-lb-cerca",
      target: "la tienda está cerca del banco",
      tiles: ["la", "tienda", "está", "cerca", "del", "banco", "lejos"],
      correctOrder: ["la", "tienda", "está", "cerca", "del", "banco"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["tienda", "cerca", "del"],
    }),
    speaking("es-m7-6-speak-hotelcerca", "Estoy cerca del hotel.", "I'm near the hotel.", ["estoy", "cerca", "hotel"]),
    listeningCompSentence({
      id: "es-m7-6-lc-mal",
      audioText: "hoy estoy mal",
      correctMeaningEn: "I'm not feeling well today",
      distractorsEn: ["I'm fine today", "I'm tired today", "I was sick yesterday"],
      exercisedAtomSurfaces: ["estoy", "mal"],
    }),
    listeningBuildSentence({
      id: "es-m7-6-lb-hotel",
      target: "mis amigos están en el hotel",
      tiles: ["mis", "amigos", "están", "en", "el", "hotel"],
      correctOrder: ["mis", "amigos", "están", "en", "el", "hotel"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["están", "hotel"],
    }),
    build(
      "es-m7-6-build-ciudadparque",
      "Build: 'The city is near the park.'",
      "la ciudad está cerca del parque",
      ["la", "ciudad", "está", "cerca", "del", "parque", "lejos"],
      ["la", "ciudad", "está", "cerca", "del", "parque"],
      ["ciudad", "cerca", "parque"],
    ),
    listeningCompSentence({
      id: "es-m7-6-lc-lejos",
      audioText: "la escuela está lejos de mi casa",
      correctMeaningEn: "the school is far from my house",
      distractorsEn: [
        "the school is near my house",
        "the store is far from my house",
        "the school is next to my house",
      ],
      exercisedAtomSurfaces: ["escuela", "lejos"],
    }),
    listeningBuildSentence({
      id: "es-m7-6-lb-aeropuerto",
      target: "mi papá está en el aeropuerto",
      tiles: ["mi", "papá", "está", "en", "el", "aeropuerto", "banco"],
      correctOrder: ["mi", "papá", "está", "en", "el", "aeropuerto"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["está", "aeropuerto"],
    }),
    listeningCompSentence({
      id: "es-m7-6-lc-contentos",
      audioText: "estamos contentos en la ciudad",
      correctMeaningEn: "we are happy in the city",
      distractorsEn: ["they are happy in the city", "we are tired in the city", "we are happy in the house"],
      exercisedAtomSurfaces: ["estamos", "ciudad"],
    }),
    listeningBuildSentence({
      id: "es-m7-6-lb-tiendalejos",
      target: "la tienda está lejos del parque",
      tiles: ["la", "tienda", "está", "lejos", "del", "parque", "cerca"],
      correctOrder: ["la", "tienda", "está", "lejos", "del", "parque"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["tienda", "lejos", "parque"],
    }),
    listeningCompSentence({
      id: "es-m7-6-lc-dondetienda",
      audioText: "¿dónde está la tienda?",
      correctMeaningEn: "where is the store?",
      distractorsEn: ["where is the bank?", "where is the school?", "where is the city?"],
      exercisedAtomSurfaces: ["dónde", "está", "tienda"],
    }),
    reviewMatchPairs("es-m7-6-rev", "es-m7-6-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-6-q-review-semana",
      prompt: "¿Qué significa 'la semana'?",
      correctText: "the week",
      distractorsText: ["the month", "the year", "the hour"],
      exercisedAtomSurfaces: ["semana"],
    }),
    speaking("es-m7-6-speak-review-lunes", "Hoy es lunes.", "Today is Monday.", ["hoy", "lunes"]),
    translateStep({
      id: "es-m7-6-tr-review-abuelaparque",
      promptEn: "My grandmother is at the park.",
      acceptedAnswers: ["mi abuela está en el parque", "Mi abuela está en el parque", "mi abuela esta en el parque"],
      audioText: "mi abuela está en el parque",
      exercisedAtomSurfaces: ["abuela", "está", "parque"],
    }),
    infoStep(
      "es-m7-6-info-win",
      "Your ear is trained",
      "You can now catch where someone is and how they're feeling without seeing a single written word.",
      "win",
    ),
  ],
};

// ─── es-m7-7 — Integration dialogue ─────────────────────────────────────────

const M7_7: LessonContent = {
  id: "es-m7-7",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En el hotel — a tourist dialogue",
  description: "Put the whole module together and say it out loud.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m7-7-info-dialogo",
      "At the hotel desk",
      "—Perdón, ¿dónde está el baño?\n—Está al lado de la puerta.\n—Gracias. ¿Y el restaurante del hotel?\n—Está cerca, señor.\n—¡Gracias!\nThe location question, the contraction, the position phrase — one tiny lobby conversation uses the whole module.",
      "default",
    ),
    sentenceMcq({
      id: "es-m7-7-q-reply",
      prompt: "A tourist asks: '¿Dónde está el baño?' — pick the natural reply.",
      correctText: "Está al lado de la puerta.",
      distractorsText: [
        "Estoy al lado de la puerta.",
        "Es al lado de la puerta.",
        "Eres al lado de la puerta.",
      ],
      exercisedAtomSurfaces: ["está", "al lado de"],
    }),
    // The lobby exchange for real — same shape as the info card, new details.
    dialogueListen({
      id: "es-m7-7-dlg-hotel",
      lines: [
        { speaker: "Diego", text: "Perdón, ¿dónde está el banco?" },
        { speaker: "Ana", text: "Está cerca del parque, señor." },
        { speaker: "Diego", text: "Gracias. ¿Y el restaurante del hotel?" },
        { speaker: "Ana", text: "Está al lado de la tienda." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where is the bank?",
          correctText: "Near the park",
          distractors: ["Next to the store", "Far from the park", "Near the school"],
        },
        {
          id: "q2",
          prompt: "Where is the hotel restaurant?",
          correctText: "Next to the store",
          distractors: ["Near the park", "Next to the bathroom", "Far from the hotel"],
        },
      ],
      exercisedAtomSurfaces: ["dónde", "está", "banco", "cerca", "del", "al lado de", "tienda"],
    }),
    build(
      "es-m7-7-build-donde",
      "Build: 'Where is the hotel?'",
      "¿dónde está el hotel?",
      ["dónde", "está", "el", "hotel", "es"],
      ["dónde", "está", "el", "hotel"],
      ["dónde", "está", "hotel"],
    ),
    cloze(
      "es-m7-7-cloze-a",
      "el banco está",
      "dos calles",
      "a",
      ["a", "al", "del", "en"],
      "the bank is two streets away",
      "el banco está a dos calles",
      "Distance from here rides on the bare preposition — no article, so no contraction.",
    ),
    speaking("es-m7-7-speak-donde", "¿Dónde está el baño?", "Where is the bathroom?", ["dónde", "está", "baño"]),
    sentenceMcq({
      id: "es-m7-7-q-aeropuerto",
      prompt: "'We are at the airport' — which is correct?",
      correctText: "estamos en el aeropuerto",
      distractorsText: ["somos en el aeropuerto", "están en el aeropuerto", "estamos al aeropuerto"],
      exercisedAtomSurfaces: ["estamos", "aeropuerto"],
    }),
    translateStep({
      id: "es-m7-7-tr-cansado",
      promptEn: "I am tired",
      acceptedAnswers: [
        "estoy cansado",
        "Estoy cansado",
        "estoy cansada",
        "Estoy cansada",
        "estoy cansado.",
        "Estoy cansado.",
      ],
      audioText: "estoy cansado",
      exercisedAtomSurfaces: ["estoy", "cansado"],
    }),
    cloze(
      "es-m7-7-cloze-cercahotel",
      "la tienda está",
      "del hotel",
      "cerca",
      ["cerca", "lejos", "bien", "mal"],
      "the store is near the hotel",
      "la tienda está cerca del hotel",
    ),
    speaking("es-m7-7-speak-contento", "Estoy contento.", "I am happy.", ["estoy", "contento"]),
    sentenceMcq({
      id: "es-m7-7-q-perdon",
      prompt: "You need to politely get a stranger's attention before asking a question. What do you say first?",
      correctText: "Perdón",
      distractorsText: ["Gracias", "Adiós", "De nada"],
      exercisedAtomSurfaces: ["perdón"],
    }),
    build(
      "es-m7-7-build-tiendahotel",
      "Build: 'The store is near the hotel.'",
      "la tienda está cerca del hotel",
      ["la", "tienda", "está", "cerca", "del", "hotel", "lejos"],
      ["la", "tienda", "está", "cerca", "del", "hotel"],
      ["tienda", "cerca", "hotel"],
    ),
    reviewMatchPairs("es-m7-7-rev", "es-m7-7-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-7-q-review-anios",
      prompt: "'My friend is ten years old' — which is correct?",
      correctText: "mi amigo tiene diez años",
      distractorsText: ["mi amigo tiene diez año", "mi amigo tienes diez años", "mi amigo es diez años"],
      exercisedAtomSurfaces: ["amigo", "tiene", "diez", "años"],
    }),
    translateStep({
      id: "es-m7-7-tr-review-familiahotel",
      promptEn: "My family is at the hotel.",
      acceptedAnswers: ["mi familia está en el hotel", "Mi familia está en el hotel", "mi familia esta en el hotel"],
      audioText: "mi familia está en el hotel",
      exercisedAtomSurfaces: ["familia", "está", "hotel"],
    }),
    speaking("es-m7-7-speak-review-extra", "Mi amiga está cerca del banco.", "My friend is near the bank.", ["amiga", "cerca", "banco"]),
    cloze(
      "es-m7-7-cloze-al-review",
      "el hotel está",
      "lado de la tienda",
      "al",
      ["al", "del", "el", "la"],
      "the hotel is next to the store",
      "el hotel está al lado de la tienda",
    ),
    infoStep(
      "es-m7-7-info-win",
      "You can navigate a whole city",
      "Ask where anything is, understand the answer, and reply — you can get around a Spanish-speaking city on your own now.",
      "win",
    ),
  ],
};

// ─── es-m7-8 — Mastery test ─────────────────────────────────────────────────

const M7_8: LessonContent = {
  id: "es-m7-8",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M7 Mastery Test",
  description: "Estar, places, al/del, cerca/lejos, and feelings.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m7-8-q-casa",
      prompt: "'I am at home' — which is correct?",
      correctText: "estoy en casa",
      distractorsText: ["soy en casa", "estoy a casa", "es en casa"],
      exercisedAtomSurfaces: ["estoy"],
    }),
    speaking("es-m7-8-speak-estamos", "Estamos en el restaurante.", "We are at the restaurant.", ["estamos", "restaurante"]),
    vocabMcq("es-m7-8-mcq-aeropuerto", { surface: "aeropuerto", meaningEn: "airport", emoji: "✈️" }, [HOTEL, BANCO, ESCUELA]),
    translateStep({
      id: "es-m7-8-tr-bano",
      promptEn: "Where is the bathroom?",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "¿dónde está el baño?",
        "¿Dónde está el baño?",
        "dónde está el baño",
        "Dónde está el baño",
        "donde esta el baño",
        "Donde esta el baño",
        "donde esta el bano",
        "¿donde esta el baño?",
        "¿Donde esta el bano?",
      ],
      audioText: "¿dónde está el baño?",
      exercisedAtomSurfaces: ["dónde", "está", "baño"],
    }),
    cloze(
      "es-m7-8-cloze-del",
      "la tienda está al lado",
      "banco",
      "del",
      ["del", "al", "de", "el"],
      "the store is next to the bank",
      "la tienda está al lado del banco",
    ),
    listeningBuildSentence({
      id: "es-m7-8-lb-ciudad",
      target: "estamos cerca de la ciudad",
      tiles: ["estamos", "cerca", "de", "la", "ciudad", "lejos"],
      correctOrder: ["estamos", "cerca", "de", "la", "ciudad"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["estamos", "cerca", "ciudad"],
    }),
    sentenceMcq({
      id: "es-m7-8-q-parque",
      prompt: "'The park is far' — which is correct?",
      correctText: "el parque está lejos",
      distractorsText: ["el parque es lejos", "el parque están lejos", "el parque estás lejos"],
      exercisedAtomSurfaces: ["parque", "lejos", "está"],
    }),
    listeningCompSentence({
      id: "es-m7-8-lc-escuela",
      audioText: "¿dónde está la escuela?",
      correctMeaningEn: "where is the school?",
      distractorsEn: ["where is the park?", "where is the city?", "where is the hotel?"],
      exercisedAtomSurfaces: ["dónde", "está", "escuela"],
    }),
    build(
      "es-m7-8-build-estascansado",
      "Build: 'Are you tired?'",
      "¿estás cansado?",
      ["estás", "cansado", "tú", "estoy"],
      ["estás", "cansado"],
      ["estás", "cansado"],
    ),
    reviewMatchPairs("es-m7-8-rev", "es-m7-8-seed", "m7", 6),
    sentenceMcq({
      id: "es-m7-8-q-review-hermano",
      prompt: "'My brother is tall' — which is correct?",
      correctText: "mi hermano es alto",
      distractorsText: ["mi hermano está alto", "mi hermano es altos", "mi hermano eres alto"],
      exercisedAtomSurfaces: ["hermano", "alto"],
    }),
    translateStep({
      id: "es-m7-8-tr-review-hermanaaeropuerto",
      promptEn: "My sister is at the airport.",
      acceptedAnswers: ["mi hermana está en el aeropuerto", "Mi hermana está en el aeropuerto", "mi hermana esta en el aeropuerto"],
      audioText: "mi hermana está en el aeropuerto",
      exercisedAtomSurfaces: ["hermana", "está", "aeropuerto"],
    }),
  ],
};

export const ES_M7_LESSONS: LessonContent[] = [
  M7_1,
  M7_2,
  M7_3,
  M7_4,
  M7_5,
  M7_6,
  M7_7,
  M7_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M7_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m7",
      moduleId: "m7",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m7",
          prompt: "'The bank is far' — which is correct?",
          correctText: "el banco está lejos",
          distractorsText: ["el banco es lejos", "el banco están lejos", "el banco soy lejos"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m7-1",
      moduleId: "m7",
      build: () =>
        sentenceMcq({
          id: "pt-es-m7-1",
          prompt: "'I am tired' — which is correct?",
          correctText: "estoy cansado",
          distractorsText: ["soy cansado", "estás cansado", "es cansado"],
        }),
    },
    {
      id: "pt-es-m7-2",
      moduleId: "m7",
      build: () =>
        cloze(
          "pt-es-m7-2",
          "la escuela está cerca",
          "parque",
          "del",
          ["del", "al", "de", "la"],
          "the school is near the park",
          "la escuela está cerca del parque",
        ),
    },
    {
      id: "pt-es-m7-3",
      moduleId: "m7",
      build: () =>
        sentenceMcq({
          id: "pt-es-m7-3",
          prompt: "Ask where the hotel is:",
          correctText: "¿Dónde está el hotel?",
          distractorsText: ["¿Dónde es el hotel?", "¿Dónde estás el hotel?", "¿Dónde son el hotel?"],
        }),
    },
    {
      id: "pt-es-m7-4",
      moduleId: "m7",
      build: () =>
        sentenceMcq({
          id: "pt-es-m7-4",
          prompt: "'We are in the park' — which is correct?",
          correctText: "estamos en el parque",
          distractorsText: ["están en el parque", "estoy en el parque", "somos en el parque"],
        }),
    },
  ],
};
