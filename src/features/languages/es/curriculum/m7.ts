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
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m7-1  Estar — estoy, estás, está + estoy bien
 *   es-m7-2  ¿Dónde está? — first places (tienda, banco, ciudad, calle)
 *   es-m7-3  Más lugares — escuela, parque, restaurante, baño
 *   es-m7-4  Al, del — contractions + cerca / lejos / al lado de
 *   es-m7-5  ¿Ser o estar? — the contrast + feelings + estamos/están
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
import "./m6";

const COURSE_ID = "mock-1";

// ─── M7 atoms (exactly the spine allocation) ────────────────────────────────

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

// Shared distractor pool for place-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// checked at authoring time.
const CIUDAD = { surface: "ciudad", emoji: "🌆" };
const CALLE = { surface: "calle", emoji: "🛣️" };
const TIENDA = { surface: "tienda", emoji: "🏪" };
const BANCO = { surface: "banco", emoji: "🏦" };
const PARQUE = { surface: "parque", emoji: "🏞️" };
const ESCUELA = { surface: "escuela", emoji: "🏫" };
const BAÑO = { surface: "baño", emoji: "🚻" };
const HOTEL = { surface: "hotel", emoji: "🏨" };
const CANSADO = { surface: "cansado", emoji: "😴" };
const CONTENTO = { surface: "contento", emoji: "😊" };
const BIEN = { surface: "bien", emoji: "💪" };

// ─── es-m7-1 — Estar, singular ──────────────────────────────────────────────

const M7_1: LessonContent = {
  id: "es-m7-1",
  moduleId: "m7",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Estar — the other 'to be'",
  description: "Spanish has two 'to be' verbs. Meet the one for states.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "es-m7-1-info-estar",
      "The other 'to be'",
      "You know ser (soy, eres, es) for who or what something IS. Spanish has a second 'to be' — estar — for where something is and how it feels right now. Singular: estoy (I am), estás (you are), está (he/she/it is). Estoy bien = I'm fine.",
      "grammar",
    ),
    vocab("es-m7-1-p-estoy", "I am (state/location)", "estoy"),
    vocab("es-m7-1-p-estas", "you are (state/location)", "estás"),
    sentenceMcq({
      id: "es-m7-1-q-estoybien",
      prompt: "'I am fine' — which is correct?",
      correctText: "estoy bien",
      distractorsText: ["estás bien", "está bien", "soy bien"],
      explanation: "First person of the state verb — and never the identity verb here.",
      exercisedAtomSurfaces: ["estoy", "bien"],
    }),
    sentenceMcq({
      id: "es-m7-1-q-estasbien",
      prompt: "Ask your friend if they're OK:",
      correctText: "¿Estás bien?",
      distractorsText: ["¿Estoy bien?", "¿Es bien?", "¿Eres bien?"],
      exercisedAtomSurfaces: ["estás", "bien"],
    }),
    vocab("es-m7-1-p-esta", "he/she/it is (state/location)", "está"),
    translateStep({
      id: "es-m7-1-tr-estoybien",
      promptEn: "I'm fine",
      acceptedAnswers: ["estoy bien", "Estoy bien", "estoy bien.", "Estoy bien.", "¡Estoy bien!"],
      audioText: "estoy bien",
      exercisedAtomSurfaces: ["estoy", "bien"],
    }),
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
    speaking("es-m7-1-speak-estoybien", "Estoy bien.", "I'm fine.", ["estoy", "bien"]),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m7-2-info-donde",
      "Asking where",
      "¿Dónde está…? = where is…? Answer with en: la tienda está en la calle (the store is on the street). You already know en from M3 — with estar it pins anything to a place.",
      "grammar",
    ),
    vocab("es-m7-2-p-donde", "where", "dónde"),
    phrase("es-m7-2-p-tienda", "the store", "la tienda", undefined, { atomId: "es:tienda", emoji: "🏪" }),
    sentenceMcq({
      id: "es-m7-2-q-donde",
      prompt: "You're looking for the store. Ask where it is:",
      correctText: "¿Dónde está la tienda?",
      distractorsText: ["¿Dónde es la tienda?", "¿Dónde estás la tienda?", "¿Dónde soy la tienda?"],
      explanation: "Location questions take the state verb in the third person.",
      exercisedAtomSurfaces: ["dónde", "está", "tienda"],
    }),
    cloze(
      "es-m7-2-cloze-tienda",
      "la",
      "está en la calle",
      "tienda",
      ["tienda", "ciudad", "casa", "mesa"],
      "the store is on the street",
      "la tienda está en la calle",
    ),
    phrase("es-m7-2-p-banco", "the bank", "el banco", undefined, { atomId: "es:banco", emoji: "🏦" }),
    phrase("es-m7-2-p-ciudad", "the city", "la ciudad", undefined, { atomId: "es:ciudad", emoji: "🌆" }),
    vocabMcq("es-m7-2-mcq-banco", { surface: "banco", meaningEn: "bank", emoji: "🏦" }, [TIENDA, CIUDAD, HOTEL]),
    vocabMcq("es-m7-2-mcq-ciudad", { surface: "ciudad", meaningEn: "city", emoji: "🌆" }, [BANCO, TIENDA, CALLE]),
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    phrase("es-m7-3-p-escuela", "the school", "la escuela", undefined, { atomId: "es:escuela", emoji: "🏫" }),
    phrase("es-m7-3-p-parque", "the park", "el parque", undefined, { atomId: "es:parque", emoji: "🏞️" }),
    vocabMcq("es-m7-3-mcq-escuela", { surface: "escuela", meaningEn: "school", emoji: "🏫" }, [PARQUE, TIENDA, BANCO]),
    vocabMcq("es-m7-3-mcq-parque", { surface: "parque", meaningEn: "park", emoji: "🏞️" }, [ESCUELA, CIUDAD, CALLE]),
    phrase("es-m7-3-p-restaurante", "the restaurant", "el restaurante", undefined, { atomId: "es:restaurante", emoji: "🍽️" }),
    phrase("es-m7-3-p-bano", "the bathroom", "el baño", undefined, { atomId: "es:baño", emoji: "🚻" }),
    vocabMcq("es-m7-3-mcq-restaurante", { surface: "restaurante", meaningEn: "restaurant", emoji: "🍽️" }, [BAÑO, ESCUELA, PARQUE]),
    sentenceMcq({
      id: "es-m7-3-q-bano",
      prompt: "Ask where the bathroom is:",
      correctText: "¿Dónde está el baño?",
      distractorsText: ["¿Dónde es el baño?", "¿Dónde están el baño?", "¿Dónde estás el baño?"],
      exercisedAtomSurfaces: ["dónde", "está", "baño"],
    }),
    cloze(
      "es-m7-3-cloze-escuela",
      "mi hermano está en la",
      "",
      "escuela",
      ["escuela", "tienda", "ciudad", "mesa"],
      "my brother is at school",
      "mi hermano está en la escuela",
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m7-4-info-contractions",
      "The only two contractions",
      "a + el always fuses into al, and de + el always fuses into del — these are the only contractions Spanish has, and they're mandatory. Position words ride on de: cerca de (near), lejos de (far from), al lado de (next to). So 'next to the bank' is al lado del banco.",
      "grammar",
    ),
    phrase("es-m7-4-p-hotel", "the hotel", "el hotel", undefined, { atomId: "es:hotel", emoji: "🏨" }),
    phrase("es-m7-4-p-aeropuerto", "the airport", "el aeropuerto", undefined, { atomId: "es:aeropuerto", emoji: "✈️" }),
    sentenceMcq({
      id: "es-m7-4-q-hotel",
      prompt: "'The hotel is near' — which is correct?",
      correctText: "el hotel está cerca",
      distractorsText: ["el hotel es cerca", "el hotel están cerca", "el hotel estás cerca"],
      exercisedAtomSurfaces: ["hotel", "cerca", "está"],
    }),
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
    cloze(
      "es-m7-4-cloze-al",
      "el hotel está",
      "lado del aeropuerto",
      "al",
      ["al", "del", "el", "la"],
      "the hotel is next to the airport",
      "el hotel está al lado del aeropuerto",
    ),
    phrase("es-m7-4-p-allado", "next to", "al lado de"),
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
    build(
      "es-m7-4-build-allado",
      "Build: 'The restaurant is next to the hotel.'",
      "el restaurante está al lado del hotel",
      ["el", "restaurante", "está", "al", "lado", "del", "hotel"],
      ["el", "restaurante", "está", "al", "lado", "del", "hotel"],
      ["al lado de", "restaurante", "hotel"],
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
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m7-5-info-serestar",
      "Ser vs estar",
      "Ser says what something IS by nature: soy estudiante, es mi hermana. Estar says where it is or how it is right now: estoy en casa, estoy cansado. Same English 'to be', two different questions. The plural forms of estar: estamos (we are), están (they are).",
      "grammar",
    ),
    vocab("es-m7-5-p-cansado", "tired", "cansado", undefined, { emoji: "😴" }),
    vocab("es-m7-5-p-contento", "happy", "contento", undefined, { emoji: "😊" }),
    sentenceMcq({
      id: "es-m7-5-q-cansado",
      prompt: "'I am tired' — which is correct?",
      correctText: "estoy cansado",
      distractorsText: ["soy cansado", "estás cansado", "es cansado"],
      explanation: "Tiredness is a state right now, so the identity verb is wrong.",
      exercisedAtomSurfaces: ["estoy", "cansado"],
    }),
    sentenceMcq({
      id: "es-m7-5-q-contento",
      prompt: "'My dad is happy' — which is correct?",
      correctText: "mi papá está contento",
      distractorsText: ["mi papá es contento", "mi papá estás contento", "mi papá soy contento"],
      exercisedAtomSurfaces: ["está", "contento"],
    }),
    sentenceMcq({
      id: "es-m7-5-q-serestar",
      prompt: "Which verb tells you WHERE something is?",
      correctText: "estar",
      distractorsText: ["ser", "tener", "hay"],
      exercisedAtomSurfaces: ["estar"],
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
  estimatedMinutes: 6,
  xpReward: 14,
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
    listeningCompSentence({
      id: "es-m7-6-lc-contentos",
      audioText: "estamos contentos en la ciudad",
      correctMeaningEn: "we are happy in the city",
      distractorsEn: ["they are happy in the city", "we are tired in the city", "we are happy in the house"],
      exercisedAtomSurfaces: ["estamos", "ciudad"],
    }),
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
  estimatedMinutes: 6,
  xpReward: 15,
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
    build(
      "es-m7-7-build-donde",
      "Build: 'Where is the hotel?'",
      "¿dónde está el hotel?",
      ["dónde", "está", "el", "hotel", "es"],
      ["dónde", "está", "el", "hotel"],
      ["dónde", "está", "hotel"],
    ),
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
    speaking("es-m7-7-speak-donde", "¿Dónde está el baño?", "Where is the bathroom?", ["dónde", "está", "baño"]),
    sentenceMcq({
      id: "es-m7-7-q-aeropuerto",
      prompt: "'We are at the airport' — which is correct?",
      correctText: "estamos en el aeropuerto",
      distractorsText: ["somos en el aeropuerto", "están en el aeropuerto", "estamos al aeropuerto"],
      exercisedAtomSurfaces: ["estamos", "aeropuerto"],
    }),
    speaking("es-m7-7-speak-contento", "Estoy contento.", "I am happy.", ["estoy", "contento"]),
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
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m7-8-q-casa",
      prompt: "'I am at home' — which is correct?",
      correctText: "estoy en casa",
      distractorsText: ["soy en casa", "estoy a casa", "es en casa"],
      exercisedAtomSurfaces: ["estoy"],
    }),
    vocabMcq("es-m7-8-mcq-aeropuerto", { surface: "aeropuerto", meaningEn: "airport", emoji: "✈️" }, [HOTEL, BANCO, ESCUELA]),
    cloze(
      "es-m7-8-cloze-del",
      "la tienda está al lado",
      "banco",
      "del",
      ["del", "al", "de", "el"],
      "the store is next to the bank",
      "la tienda está al lado del banco",
    ),
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
    listeningBuildSentence({
      id: "es-m7-8-lb-ciudad",
      target: "estamos cerca de la ciudad",
      tiles: ["estamos", "cerca", "de", "la", "ciudad", "lejos"],
      correctOrder: ["estamos", "cerca", "de", "la", "ciudad"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["estamos", "cerca", "ciudad"],
    }),
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
    sentenceMcq({
      id: "es-m7-8-q-estas",
      prompt: "'Are you tired?' — which is correct?",
      correctText: "¿Estás cansado?",
      distractorsText: ["¿Estoy cansado?", "¿Eres cansado?", "¿Soy cansado?"],
      exercisedAtomSurfaces: ["estás", "cansado"],
    }),
    speaking("es-m7-8-speak-estamos", "Estamos en el restaurante.", "We are at the restaurant.", ["estamos", "restaurante"]),
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
