/**
 * Spanish Module 14 — Casa y clima (home, hay vs está/están, weather).
 *
 * By M14 the learner conjugates three verb classes plus the stem changers.
 * This module is a breather from morphology: two noun fields (the home and
 * the weather) hung on one grammar contrast — hay for existence vs
 * está/están for location (singular AND plural) — plus the impersonal
 * weather machine (hace calor/frío/sol/viento, llueve, nieva) and the four
 * seasons.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m14-1  Rooms of the house — la cocina, la sala, el dormitorio, el comedor
 *   es-m14-2  Furniture — la cama, el sofá, la lámpara, la televisión, el piso
 *   es-m14-3  ¿Hay o está(n)? — refrigerador, estufa, cuadro, jardín; drills están
 *   es-m14-4  ¿Qué tiempo hace? — clima, sol, hace calor, hace frío
 *   es-m14-5  Llueve y nieva — weather verbs, primavera, verano
 *   es-m14-6  Listening focus — viento, lluvia, nieve, otoño, invierno
 *   es-m14-7  Integration — Mi casa narrative + speaking
 *   es-m14-8  M14 Mastery Test
 *
 * Sentence-level listening only (M5+ ratchet): every listening_comprehension
 * carries a full sentence, every listening_build has ≥3 tiles.
 *
 * 2026-07-16 JA-standard reauthor: every topic lesson now forces typed +
 * spoken/built production (L1, L4, L5 previously had zero); están (the
 * plural half of the hay/está contrast) is now explicitly drilled, not just
 * mentioned; the canonical weather question is ¿Qué tiempo hace? (¿Cómo
 * está el clima? demoted to a colloquial note, not tested as the sole
 * right answer); a selfExplain lands at N-1 in L3 (hay vs está/están) and
 * L4 (why hace, not es/está); every lesson L2+ closes on a compounding
 * review tail drawn from m1–m13 via reviewMatchPairs/pickReviewSurfaces.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, findEsAtomBySurface, type EsAtom } from "../courseAtoms";
import {
  agreementCloze,
  build,
  cloze,
  dialogueListen,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  pickReviewSurfaces,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  vocabTextMcq,
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
const COMEDOR = { surface: "comedor", emoji: "🍽️" };
const SOL = { surface: "sol", emoji: "☀️" };
const LLUVIA = { surface: "lluvia", emoji: "🌧️" };
const VIENTO = { surface: "viento", emoji: "💨" };
const NIEVE = { surface: "nieve", emoji: "❄️" };
const CALOR = { surface: "calor", emoji: "🥵" };
const FRIO = { surface: "frío", emoji: "🥶" };
const PRIMAVERA = { surface: "primavera", emoji: "🌸" };
const VERANO = { surface: "verano", emoji: "🏖️" };
const OTONO = { surface: "otoño", emoji: "🍂" };
const INVIERNO = { surface: "invierno", emoji: "⛄" };

// ─── es-m14-1 — Rooms of the house ──────────────────────────────────────────

const M14_1_REV = pickReviewSurfaces("es-m14-1-rev-b", "m14", 5);

const M14_1: LessonContent = {
  id: "es-m14-1",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Las partes de la casa",
  description: "Name the rooms of a Spanish home.",
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m14-1-info-casa",
      "Inside la casa",
      "Spanish rooms come with their article glued on: la cocina (kitchen), la sala (living room), el dormitorio (bedroom), el comedor (dining room). To say where someone IS, use está, just like with places in town: Mamá está en la cocina.",
      "grammar",
    ),
    vocabMcq("es-m14-1-mcq-cocina", { surface: "cocina", meaningEn: "kitchen", emoji: "🍳" }, [COMEDOR, CAMA, SOL]),
    vocabTextMcq("es-m14-1-tmcq-sala", "sala", ["dormitorio", "comedor", "cocina"], "Which word means 'living room'?"),
    build(
      "es-m14-1-build-papa",
      "Build: 'Dad is in the dining room.'",
      "papá está en el comedor",
      ["papá", "está", "en", "el", "comedor", "cocina"],
      ["papá", "está", "en", "el", "comedor"],
      ["comedor"],
    ),
    sentenceMcq({
      id: "es-m14-1-q-comedor",
      prompt: "Dinner is served. Which room do you head to?",
      correctText: "el comedor",
      distractorsText: ["el dormitorio", "la sala", "el baño"],
      exercisedAtomSurfaces: ["comedor"],
    }),
    listeningCompSentence({
      id: "es-m14-1-lc-dormitorio",
      audioText: "El dormitorio es pequeño pero cómodo.",
      correctMeaningEn: "The bedroom is small but comfortable.",
      distractorsEn: [
        "The living room is small but comfortable.",
        "The bedroom is big and comfortable.",
        "The dining room is small but comfortable.",
      ],
      exercisedAtomSurfaces: ["dormitorio"],
    }),
    speaking("es-m14-1-speak-mama", "Mamá está en la cocina.", "Mom is in the kitchen.", ["cocina"]),
    vocabTextMcq("es-m14-1-tmcq-dormitorio", "dormitorio", ["comedor", "sala", "cocina"], "Which word means 'bedroom'?"),
    agreementCloze(
      "es-m14-1-agree-sala",
      [
        { blank: { id: "b1", correctAnswer: "La", options: ["La", "El", "Los", "Las"] } },
        { text: " sala es grande y " },
        { blank: { id: "b2", correctAnswer: "el", options: ["el", "la", "los", "las"] } },
        { text: " dormitorio es pequeño." },
      ],
      "The living room is big and the bedroom is small.",
      "La sala es grande y el dormitorio es pequeño.",
      ["sala", "dormitorio"],
    ),
    translateStep({
      id: "es-m14-1-tr-sala",
      promptEn: "The living room is big.",
      acceptedAnswers: ["La sala es grande.", "la sala es grande", "La sala es grande", "la sala es grande."],
      audioText: "La sala es grande.",
      exercisedAtomSurfaces: ["sala"],
    }),
    sentenceMcq({
      id: "es-m14-1-q-gato-dormitorio",
      prompt: "El gato duerme en la cama, dentro de esta habitación. ¿Cuál es?",
      correctText: "el dormitorio",
      distractorsText: ["la cocina", "el jardín", "el comedor"],
      exercisedAtomSurfaces: ["dormitorio"],
    }),
    cloze(
      "es-m14-1-cloze-el-comedor",
      "",
      " comedor es grande.",
      "El",
      ["El", "La", "Los", "Las"],
      "The dining room is big.",
      "El comedor es grande.",
      undefined,
      ["comedor"],
    ),
    listeningBuildSentence({
      id: "es-m14-1-lb-sala",
      target: "la sala es cómoda",
      tiles: ["la", "sala", "es", "cómoda", "pequeña"],
      correctOrder: ["la", "sala", "es", "cómoda"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["sala"],
    }),
    vocabTextMcq("es-m14-1-rev-tmcq", M14_1_REV[0], M14_1_REV.slice(1, 4)),
    speaking(
      "es-m14-1-rev-speak",
      findEsAtomBySurface(M14_1_REV[4])?.surface ?? "casa",
      findEsAtomBySurface(M14_1_REV[4])?.gloss ?? "house",
      [M14_1_REV[4]],
    ),
    reviewMatchPairs("es-m14-1-rev", "es-m14-1-rev-a", "m14", 6),
    infoStep(
      "es-m14-1-win",
      "You can find your way around",
      "You can now name every room in a Spanish house and say where someone is in it. On to the furniture inside those rooms.",
      "win",
    ),
  ],
};

// ─── es-m14-2 — Furniture ───────────────────────────────────────────────────

const M14_2_REV = pickReviewSurfaces("es-m14-2-rev-b", "m14", 5);

const M14_2: LessonContent = {
  id: "es-m14-2",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Los muebles",
  description: "Furniture — and where each piece is.",
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    vocabMcq("es-m14-2-mcq-cama", { surface: "cama", meaningEn: "bed", emoji: "🛏️" }, [SOFA, LAMPARA, TELEVISION]),
    build(
      "es-m14-2-build-cama-sofa",
      "Build: 'The bed is next to the sofa.'",
      "la cama está al lado del sofá",
      ["la", "cama", "está", "al", "lado", "del", "sofá", "piso"],
      ["la", "cama", "está", "al", "lado", "del", "sofá"],
      ["cama", "sofá"],
    ),
    vocabMcq("es-m14-2-mcq-sofa", { surface: "sofá", meaningEn: "sofa", emoji: "🛋️" }, [CAMA, CUADRO, LAMPARA]),
    build(
      "es-m14-2-build-piso",
      "Build: 'The lamp is on the floor.'",
      "la lámpara está en el piso",
      ["la", "lámpara", "está", "en", "el", "piso"],
      ["la", "lámpara", "está", "en", "el", "piso"],
      ["lámpara", "piso"],
    ),
    vocabMcq("es-m14-2-mcq-lampara", { surface: "lámpara", meaningEn: "lamp", emoji: "💡" }, [TELEVISION, CUADRO, CAMA]),
    cloze(
      "es-m14-2-cloze-sofa",
      "El sofá",
      " en la sala.",
      "está",
      ["está", "son", "es", "hay"],
      "The sofa is in the living room.",
      "El sofá está en la sala.",
      undefined,
      ["sofá"],
    ),
    speaking("es-m14-2-speak-lampara", "La lámpara está en el piso, cerca de la cama.", "The lamp is on the floor, near the bed.", ["lámpara", "piso", "cama"]),
    vocabMcq("es-m14-2-mcq-television", { surface: "televisión", meaningEn: "television", emoji: "📺" }, [LAMPARA, SOFA, CUADRO]),
    listeningCompSentence({
      id: "es-m14-2-lc-lampara",
      audioText: "La lámpara está en la mesa, cerca de la cama.",
      correctMeaningEn: "The lamp is on the table, near the bed.",
      distractorsEn: [
        "The lamp is on the floor, near the sofa.",
        "The television is on the table, near the bed.",
        "The lamp is under the bed.",
      ],
      exercisedAtomSurfaces: ["lámpara", "cama"],
    }),
    listeningBuildSentence({
      id: "es-m14-2-lb-television",
      target: "la televisión está en la sala",
      tiles: ["la", "televisión", "está", "en", "la", "sala", "cocina"],
      correctOrder: ["la", "televisión", "está", "en", "la", "sala"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["televisión", "sala"],
    }),
    vocabMcq("es-m14-2-mcq-cuadro", { surface: "cuadro", meaningEn: "picture / painting", emoji: "🖼️" }, [TELEVISION, LAMPARA, SOFA]),
    translateStep({
      id: "es-m14-2-tr-cuadro",
      promptEn: "The picture is on the floor.",
      acceptedAnswers: [
        "El cuadro está en el piso.",
        "el cuadro está en el piso",
        "El cuadro esta en el piso.",
        "el cuadro esta en el piso",
      ],
      audioText: "El cuadro está en el piso.",
      exercisedAtomSurfaces: ["cuadro", "piso"],
    }),
    sentenceMcq({
      id: "es-m14-2-q-lampara-cama",
      prompt: "Your friend asks where the reading lamp is. Which sentence answers 'The lamp is on the bed'?",
      correctText: "La lámpara está en la cama.",
      distractorsText: ["La cama está en la lámpara.", "Hay una lámpara.", "La lámpara es una cama."],
      exercisedAtomSurfaces: ["lámpara", "cama"],
    }),
    speaking(
      "es-m14-2-rev-speak",
      findEsAtomBySurface(M14_2_REV[4])?.surface ?? "casa",
      findEsAtomBySurface(M14_2_REV[4])?.gloss ?? "house",
      [M14_2_REV[4]],
    ),
    vocabTextMcq("es-m14-2-rev-tmcq", M14_2_REV[0], M14_2_REV.slice(1, 4)),
    reviewMatchPairs("es-m14-2-rev", "es-m14-2-rev-a", "m14", 6),
    infoStep(
      "es-m14-2-win",
      "You can furnish a room",
      "You can now name the furniture and say exactly where each piece sits. Next: telling new things apart from known ones.",
      "win",
    ),
  ],
};

// ─── es-m14-3 — ¿Hay o está(n)? ─────────────────────────────────────────────

const M14_3_REV = pickReviewSurfaces("es-m14-3-rev-b", "m14", 5);

const M14_3: LessonContent = {
  id: "es-m14-3",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Hay o está(n)?",
  description: "There is vs. it's/they're there — existence and location, singular and plural.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m14-3-info-hayesta",
      "¿Hay o está(n)?",
      "Hay says something exists: Hay una estufa en la cocina — there is a stove in the kitchen. Está says where a specific, already-known thing is: La estufa está en la cocina. New information takes hay (with un/una); a known thing takes está/están (with el/la/los/las). Plural known things take están: Los cuadros están en la sala.",
      "grammar",
    ),
    vocabTextMcq("es-m14-3-tmcq-refri", "refrigerador", ["estufa", "lámpara", "cama"]),
    vocabMcq("es-m14-3-mcq-cuadro", { surface: "cuadro", meaningEn: "picture / painting", emoji: "🖼️" }, [TELEVISION, LAMPARA, SOFA]),
    build(
      "es-m14-3-build-estufa",
      "Build: 'There is a stove in the kitchen.'",
      "hay una estufa en la cocina",
      ["hay", "una", "estufa", "en", "la", "cocina", "el"],
      ["hay", "una", "estufa", "en", "la", "cocina"],
      ["estufa", "cocina"],
    ),
    vocabTextMcq("es-m14-3-tmcq-estufa", "estufa", ["refrigerador", "lámpara", "cama"]),
    cloze(
      "es-m14-3-cloze-refri",
      "El refrigerador",
      " en la cocina.",
      "está",
      ["está", "hay", "es", "son"],
      "The refrigerator is in the kitchen.",
      "El refrigerador está en la cocina.",
      undefined,
      ["refrigerador", "cocina"],
    ),
    build(
      "es-m14-3-build-jardin",
      "Build: 'There is a garden next to the house.'",
      "hay un jardín al lado de la casa",
      ["hay", "un", "jardín", "al", "lado", "de", "la", "casa"],
      ["hay", "un", "jardín", "al", "lado", "de", "la", "casa"],
      ["jardín", "hay", "al lado de"],
    ),
    sentenceMcq({
      id: "es-m14-3-q-hay-refri",
      prompt: "'There is a refrigerator in the kitchen.' — pick the Spanish.",
      correctText: "Hay un refrigerador en la cocina.",
      distractorsText: [
        "El refrigerador está en la cocina.",
        "El refrigerador es una cocina.",
        "No hay refrigerador en la cocina.",
      ],
      exercisedAtomSurfaces: ["refrigerador", "cocina"],
    }),
    listeningCompSentence({
      id: "es-m14-3-lc-camas-estan",
      audioText: "Las camas están en el dormitorio.",
      correctMeaningEn: "The beds are in the bedroom.",
      distractorsEn: [
        "The beds are in the living room.",
        "There are beds in the bedroom.",
        "The bed is in the bedroom.",
      ],
      exercisedAtomSurfaces: ["cama", "dormitorio"],
    }),
    translateStep({
      id: "es-m14-3-tr-jardin",
      promptEn: "There is a garden.",
      acceptedAnswers: ["Hay un jardín.", "hay un jardín", "Hay un jardin.", "hay un jardin"],
      audioText: "Hay un jardín.",
      exercisedAtomSurfaces: ["jardín"],
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
    cloze(
      "es-m14-3-cloze-sofas-estan",
      "Los sofás",
      " en la sala.",
      "están",
      ["están", "está", "hay", "son"],
      "The sofas are in the living room.",
      "Los sofás están en la sala.",
      undefined,
      ["sofá", "sala"],
    ),
    build(
      "es-m14-3-build-lamparas-estan",
      "Build: 'The lamps are in the bedroom.'",
      "las lámparas están en el dormitorio",
      ["las", "lámparas", "están", "en", "el", "dormitorio", "cocina"],
      ["las", "lámparas", "están", "en", "el", "dormitorio"],
      ["lámpara", "dormitorio"],
    ),
    selfExplain({
      id: "es-m14-3-self-explain",
      anchorLabel: "You wrote: Las lámparas están en el dormitorio.",
      anchorAudioText: "Las lámparas están en el dormitorio.",
      question: "Why está/están here instead of hay?",
      rule: {
        text: "está/están locates something the listener already knows about (the lamps in question). hay only introduces something new or unspecified.",
      },
      surface: {
        text: "están is just the plural spelling of está, used whenever there's more than one thing.",
      },
      distractor: {
        text: "están is for permanent locations; está is for temporary ones.",
      },
      ruleExplanation:
        "hay = something exists / is there at all (new info, un/una). está/están = WHERE a known thing is (el/la/los/las), and está vs están agrees with singular vs plural.",
    }),
    sentenceMcq({
      id: "es-m14-3-q-cuadros-estan",
      prompt: "'The pictures are in the living room.' — pick the Spanish.",
      correctText: "Los cuadros están en la sala.",
      distractorsText: [
        "Hay unos cuadros en la sala.",
        "El cuadro está en la sala.",
        "Los cuadros son la sala.",
      ],
      exercisedAtomSurfaces: ["cuadro", "sala"],
    }),
    speaking("es-m14-3-speak-sofas", "Hay dos sofás en la sala.", "There are two sofas in the living room.", ["sofá", "sala"]),
    vocabTextMcq("es-m14-3-rev-tmcq", M14_3_REV[0], M14_3_REV.slice(1, 4)),
    speaking(
      "es-m14-3-rev-speak",
      findEsAtomBySurface(M14_3_REV[4])?.surface ?? "casa",
      findEsAtomBySurface(M14_3_REV[4])?.gloss ?? "house",
      [M14_3_REV[4]],
    ),
    reviewMatchPairs("es-m14-3-rev", "es-m14-3-rev-a", "m14", 6),
    infoStep(
      "es-m14-3-win",
      "You can describe any room",
      "You can now say what EXISTS in a place and, separately, exactly WHERE a known thing is — singular or plural. That's the whole hay/está(n) system.",
      "win",
    ),
  ],
};

// ─── es-m14-4 — ¿Qué tiempo hace? ───────────────────────────────────────────

const M14_4_REV = pickReviewSurfaces("es-m14-4-rev-b", "m14", 5);

const M14_4: LessonContent = {
  id: "es-m14-4",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Qué tiempo hace?",
  description: "Weather with hace — sun, heat, and cold.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m14-4-info-hace",
      "Weather runs on hace",
      "Spanish weather borrows hace ('it makes'): hace sol (it's sunny), hace viento (it's windy), hace calor (it's hot), hace frío (it's cold). Ask with ¿Qué tiempo hace? — what's the weather like? There's no 'it' anywhere: hace carries the whole sentence. (You may also hear ¿Cómo está el clima? in casual speech — but ¿Qué tiempo hace? is the standard question.)",
      "grammar",
    ),
    vocabTextMcq("es-m14-4-tmcq-clima", "clima", ["lluvia", "viento", "sol"]),
    vocabMcq("es-m14-4-mcq-sol", { surface: "sol", meaningEn: "sun", emoji: "☀️" }, [LLUVIA, NIEVE, VIENTO]),
    build(
      "es-m14-4-build-calor",
      "Build: 'Today it's hot at the beach.'",
      "hoy hace calor en la playa",
      ["hoy", "hace", "calor", "en", "la", "playa", "frío"],
      ["hoy", "hace", "calor", "en", "la", "playa"],
      ["hace calor"],
    ),
    vocabMcq("es-m14-4-mcq-calor", { surface: "calor", meaningEn: "heat", emoji: "🥵" }, [FRIO, SOL, VIENTO]),
    sentenceMcq({
      id: "es-m14-4-q-quetiempo",
      prompt: "'What's the weather like?' — pick the Spanish.",
      correctText: "¿Qué tiempo hace?",
      distractorsText: ["¿Dónde está el clima?", "¿Qué hora es?", "¿Cómo se llama el clima?"],
      exercisedAtomSurfaces: ["clima"],
    }),
    translateStep({
      id: "es-m14-4-tr-quetiempo",
      promptEn: "What's the weather like today?",
      acceptedAnswers: [
        "¿Qué tiempo hace hoy?",
        "que tiempo hace hoy",
        "Qué tiempo hace hoy.",
        "qué tiempo hace hoy",
      ],
      audioText: "¿Qué tiempo hace hoy?",
      exercisedAtomSurfaces: ["clima"],
    }),
    vocabMcq("es-m14-4-mcq-frio", { surface: "frío", meaningEn: "cold", emoji: "🥶" }, [CALOR, SOL, VIENTO]),
    cloze(
      "es-m14-4-cloze-sol",
      "Hoy",
      " mucho sol.",
      "hace",
      ["hace", "es", "está", "hay"],
      "Today it's very sunny.",
      "Hoy hace mucho sol.",
      undefined,
      ["sol"],
    ),
    build(
      "es-m14-4-build-frio",
      "Build: 'It's cold in the mountains.'",
      "hace frío en las montañas",
      ["hace", "frío", "en", "las", "montañas", "calor"],
      ["hace", "frío", "en", "las", "montañas"],
      ["hace frío"],
    ),
    selfExplain({
      id: "es-m14-4-self-explain",
      anchorLabel: "You wrote: Hace frío en las montañas.",
      anchorAudioText: "Hace frío en las montañas.",
      question: "Why hace instead of es or está for weather?",
      rule: {
        text: "Spanish weather expressions use hace ('it makes') as a fixed impersonal verb — hace sol/calor/frío/viento — with no subject pronoun at all.",
      },
      surface: {
        text: "hace is used because the weather is happening right now, like estar for ongoing states.",
      },
      distractor: {
        text: "hace is the formal/usted version of es, used for talking about nature.",
      },
      ruleExplanation:
        "hace + noun is a fixed impersonal construction: hace sol/calor/frío/viento. It never takes a subject — not 'it', not 'él'.",
    }),
    sentenceMcq({
      id: "es-m14-4-q-hacecalor",
      prompt: "It's a July afternoon on the beach in Cancún. What do you say?",
      correctText: "¡Hace calor!",
      distractorsText: ["¡Hace frío!", "Llueve mucho.", "Nieva mucho."],
      exercisedAtomSurfaces: ["hace calor", "calor"],
    }),
    speaking("es-m14-4-speak-solfrio", "Hace sol y no hace frío.", "It's sunny and it's not cold.", ["sol", "hace frío"]),
    sentenceMcq({
      id: "es-m14-4-q-hacefrio",
      prompt: "It's January in the mountains and you can see your breath. What do you say?",
      correctText: "¡Hace frío!",
      distractorsText: ["¡Hace calor!", "Hace sol.", "Llueve."],
      exercisedAtomSurfaces: ["hace frío", "frío"],
    }),
    listeningCompSentence({
      id: "es-m14-4-lc-desierto",
      audioText: "En el desierto hace mucho calor y hace mucho viento.",
      correctMeaningEn: "In the desert it's very hot and very windy.",
      distractorsEn: [
        "In the desert it's very cold and very windy.",
        "In the desert it's very hot and it rains a lot.",
        "In the desert it's sunny but calm.",
      ],
      exercisedAtomSurfaces: ["hace calor", "viento"],
    }),
    speaking(
      "es-m14-4-rev-speak",
      findEsAtomBySurface(M14_4_REV[4])?.surface ?? "casa",
      findEsAtomBySurface(M14_4_REV[4])?.gloss ?? "house",
      [M14_4_REV[4]],
    ),
    vocabTextMcq("es-m14-4-rev-tmcq", M14_4_REV[0], M14_4_REV.slice(1, 4)),
    reviewMatchPairs("es-m14-4-rev", "es-m14-4-rev-a", "m14", 6),
    infoStep(
      "es-m14-4-win",
      "You can talk about the weather",
      "You can now ask and answer ¿Qué tiempo hace? for sun, heat, cold, and wind — no subject pronoun required.",
      "win",
    ),
  ],
};

// ─── es-m14-5 — Llueve y nieva ──────────────────────────────────────────────

const M14_5_REV = pickReviewSurfaces("es-m14-5-rev-b", "m14", 5);

const M14_5: LessonContent = {
  id: "es-m14-5",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Llueve y nieva",
  description: "Rain, snow, and the first two seasons.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m14-5-info-llueve",
      "One-word weather",
      "llueve (it rains / it's raining) and nieva (it snows / it's snowing) are complete sentences — no subject needed, just like hace calor. Pair them with the seasons: llueve en primavera, nieva en invierno.",
      "grammar",
    ),
    vocabTextMcq("es-m14-5-tmcq-llueve", "llueve", ["nieva", "hace calor", "hace frío"], "Which word means 'it rains'?"),
    vocabMcq("es-m14-5-mcq-primavera", { surface: "primavera", meaningEn: "spring", emoji: "🌸" }, [VERANO, OTONO, INVIERNO]),
    translateStep({
      id: "es-m14-5-tr-verano",
      promptEn: "It's hot in summer.",
      acceptedAnswers: ["Hace calor en verano.", "hace calor en verano"],
      audioText: "Hace calor en verano.",
      exercisedAtomSurfaces: ["hace calor", "verano"],
    }),
    vocabTextMcq("es-m14-5-tmcq-nieva", "nieva", ["llueve", "hace calor", "hace frío"], "Which word means 'it snows'?"),
    vocabMcq("es-m14-5-mcq-verano", { surface: "verano", meaningEn: "summer", emoji: "🏖️" }, [PRIMAVERA, OTONO, INVIERNO]),
    speaking(
      "es-m14-5-speak-solllueve",
      "En verano hace sol, pero en primavera llueve.",
      "In summer it's sunny, but in spring it rains.",
      ["sol", "llueve", "verano", "primavera"],
    ),
    sentenceMcq({
      id: "es-m14-5-q-llueve",
      prompt: "'It rains a lot here.' — pick the Spanish.",
      correctText: "Llueve mucho aquí.",
      distractorsText: ["Nieva mucho aquí.", "Hace mucho calor aquí.", "Hace mucho sol aquí."],
      exercisedAtomSurfaces: ["llueve"],
    }),
    listeningCompSentence({
      id: "es-m14-5-lc-primavera",
      audioText: "En primavera llueve mucho pero no hace frío.",
      correctMeaningEn: "In spring it rains a lot but it's not cold.",
      distractorsEn: [
        "In spring it snows a lot and it's cold.",
        "In summer it rains a lot but it's not cold.",
        "In spring it rains a lot and it's cold.",
      ],
      exercisedAtomSurfaces: ["llueve", "primavera"],
    }),
    listeningBuildSentence({
      id: "es-m14-5-lb-noniveva",
      target: "no nieva en verano",
      tiles: ["no", "nieva", "en", "verano", "llueve"],
      correctOrder: ["no", "nieva", "en", "verano"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["nieva", "verano"],
    }),
    sentenceMcq({
      id: "es-m14-5-q-nieva",
      prompt: "'It snows a lot.' — pick the Spanish.",
      correctText: "Nieva mucho.",
      distractorsText: ["Llueve mucho.", "Hace mucho viento.", "Hace mucho frío."],
      exercisedAtomSurfaces: ["nieva"],
    }),
    cloze(
      "es-m14-5-cloze-nieva-aqui",
      "Aquí",
      " mucho en enero.",
      "nieva",
      ["nieva", "llueve", "hace calor", "hace frío"],
      "Here it snows a lot in January.",
      "Aquí nieva mucho en enero.",
      undefined,
      ["nieva"],
    ),
    build(
      "es-m14-5-build-primavera",
      "Build: 'It rains a lot in spring.'",
      "llueve mucho en primavera",
      ["llueve", "mucho", "en", "primavera", "nieva"],
      ["llueve", "mucho", "en", "primavera"],
      ["llueve", "primavera"],
    ),
    selfExplain({
      id: "es-m14-5-self-explain",
      anchorLabel: "You wrote: Llueve mucho en primavera.",
      anchorAudioText: "Llueve mucho en primavera.",
      question: "Why is there no yo/tú/él before llueve?",
      rule: {
        text: "llueve and nieva are impersonal weather verbs — Spanish never attaches a subject pronoun to them, unlike regular verbs (habla, come).",
      },
      surface: {
        text: "The subject is left out because it's understood to mean 'today'.",
      },
      distractor: {
        text: "llueve and nieva are commands, so they never take a subject.",
      },
      ruleExplanation:
        "Weather verbs like llueve/nieva are impersonal — there's no 'it' subject at all, not even a hidden one, exactly like hace calor.",
    }),
    sentenceMcq({
      id: "es-m14-5-q-verano",
      prompt: "'In summer it's hot.' — pick the Spanish.",
      correctText: "En verano hace calor.",
      distractorsText: ["En verano hace frío.", "En verano nieva.", "En invierno hace calor."],
      exercisedAtomSurfaces: ["verano", "hace calor"],
    }),
    speaking(
      "es-m14-5-rev-speak",
      findEsAtomBySurface(M14_5_REV[4])?.surface ?? "casa",
      findEsAtomBySurface(M14_5_REV[4])?.gloss ?? "house",
      [M14_5_REV[4]],
    ),
    vocabTextMcq("es-m14-5-rev-tmcq", M14_5_REV[0], M14_5_REV.slice(1, 4)),
    reviewMatchPairs("es-m14-5-rev", "es-m14-5-rev-a", "m14", 6),
    infoStep(
      "es-m14-5-win",
      "You can report any forecast",
      "You can now say it's raining or snowing, and place it in spring or summer — all without ever saying 'it'.",
      "win",
    ),
  ],
};

// ─── es-m14-6 — Listening focus ─────────────────────────────────────────────

const M14_6_REV = pickReviewSurfaces("es-m14-6-rev-b", "m14", 5);

const M14_6: LessonContent = {
  id: "es-m14-6",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — clima y estaciones",
  description: "Sentence-level listening: wind, rain, snow, fall, and winter.",
  estimatedMinutes: 9,
  xpReward: 16,
  steps: [
    vocabMcq("es-m14-6-mcq-viento", { surface: "viento", meaningEn: "wind", emoji: "💨" }, [LLUVIA, NIEVE, SOL]),
    build(
      "es-m14-6-build-lluviaviento",
      "Build: 'Today there's rain and wind.'",
      "hoy hay lluvia y viento",
      ["hoy", "hay", "lluvia", "y", "viento", "nieve"],
      ["hoy", "hay", "lluvia", "y", "viento"],
      ["lluvia", "viento"],
    ),
    vocabMcq("es-m14-6-mcq-lluvia", { surface: "lluvia", meaningEn: "rain", emoji: "🌧️" }, [NIEVE, SOL, VIENTO]),
    listeningBuildSentence({
      id: "es-m14-6-lb-invierno",
      target: "en invierno hay nieve",
      tiles: ["en", "invierno", "hay", "nieve", "lluvia"],
      correctOrder: ["en", "invierno", "hay", "nieve"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["invierno", "nieve"],
    }),
    vocabMcq("es-m14-6-mcq-nieve", { surface: "nieve", meaningEn: "snow", emoji: "❄️" }, [LLUVIA, SOL, VIENTO]),
    listeningCompSentence({
      id: "es-m14-6-lc-viento",
      audioText: "Hoy hace mucho viento.",
      correctMeaningEn: "It's very windy today.",
      distractorsEn: ["It's very sunny today.", "It's very cold today.", "It's raining a lot today."],
      exercisedAtomSurfaces: ["viento"],
    }),
    speaking("es-m14-6-speak-invierno", "En invierno hace mucho frío y nieva.", "In winter it's very cold and it snows.", ["invierno", "hace frío", "nieva"]),
    vocabMcq("es-m14-6-mcq-otono", { surface: "otoño", meaningEn: "fall", emoji: "🍂" }, [PRIMAVERA, VERANO, INVIERNO]),
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
    translateStep({
      id: "es-m14-6-tr-lluevehoy",
      promptEn: "It's raining a lot today.",
      acceptedAnswers: ["Hoy llueve mucho.", "hoy llueve mucho", "Llueve mucho hoy.", "llueve mucho hoy"],
      audioText: "Hoy llueve mucho.",
      exercisedAtomSurfaces: ["llueve"],
    }),
    vocabMcq("es-m14-6-mcq-invierno", { surface: "invierno", meaningEn: "winter", emoji: "⛄" }, [PRIMAVERA, VERANO, OTONO]),
    cloze(
      "es-m14-6-cloze-otono-viento",
      "En otoño",
      " mucho viento.",
      "hace",
      ["hace", "hay", "está", "es"],
      "In fall it's very windy.",
      "En otoño hace mucho viento.",
      undefined,
      ["otoño", "viento"],
    ),
    speaking(
      "es-m14-6-rev-speak",
      findEsAtomBySurface(M14_6_REV[4])?.surface ?? "casa",
      findEsAtomBySurface(M14_6_REV[4])?.gloss ?? "house",
      [M14_6_REV[4]],
    ),
    sentenceMcq({
      id: "es-m14-6-q-nieve-invierno",
      prompt: "'There's a lot of snow in winter.' — pick the Spanish.",
      correctText: "Hay mucha nieve en invierno.",
      distractorsText: [
        "Hace mucha nieve en invierno.",
        "Hay mucho viento en invierno.",
        "La nieve está en invierno.",
      ],
      exercisedAtomSurfaces: ["nieve", "invierno"],
    }),
    listeningCompSentence({
      id: "es-m14-6-lc-lluviaviento",
      audioText: "La lluvia y el viento no paran en otoño.",
      correctMeaningEn: "The rain and the wind don't stop in fall.",
      distractorsEn: [
        "The rain and the snow don't stop in fall.",
        "The rain and the wind don't stop in winter.",
        "The sun and the wind don't stop in fall.",
      ],
      exercisedAtomSurfaces: ["lluvia", "viento", "otoño"],
    }),
    reviewMatchPairs("es-m14-6-rev", "es-m14-6-rev-a", "m14", 6),
    vocabTextMcq("es-m14-6-rev-tmcq", M14_6_REV[0], M14_6_REV.slice(1, 4)),
    infoStep(
      "es-m14-6-win",
      "You can follow a forecast by ear",
      "You can now understand wind, rain, snow, fall, and winter at native speed — and still answer back.",
      "win",
    ),
  ],
};

// ─── es-m14-7 — Integration ─────────────────────────────────────────────────

const M14_7_REV = pickReviewSurfaces("es-m14-7-rev-b", "m14", 5);

const M14_7: LessonContent = {
  id: "es-m14-7",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Mi casa — integración",
  description: "Put the whole house and the forecast together.",
  estimatedMinutes: 10,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m14-7-info-micasa",
      "Mi casa",
      "Mi casa es pequeña pero bonita. Hay tres dormitorios, una sala y un jardín. La televisión está en la sala. Hoy llueve y hace frío, pero en mi casa no hace frío.\nEvery sentence is this module at work — read it out loud, then answer.",
      "default",
    ),
    build(
      "es-m14-7-build-cocina",
      "Build: 'My house has a big kitchen.'",
      "mi casa tiene una cocina grande",
      ["mi", "casa", "tiene", "una", "cocina", "grande", "pequeña"],
      ["mi", "casa", "tiene", "una", "cocina", "grande"],
      ["cocina"],
    ),
    dialogueListen({
      id: "es-m14-7-dl-clima",
      lines: [
        { speaker: "Lucía", text: "Hola, Marco. ¿Qué tiempo hace hoy?" },
        { speaker: "Marco", text: "Hace frío y llueve mucho." },
        { speaker: "Lucía", text: "¿Dónde estás?" },
        { speaker: "Marco", text: "Estoy en la sala con mi familia." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "How is the weather today?",
          correctText: "It's cold and raining a lot.",
          distractors: [
            "It's hot and sunny.",
            "It's snowing a lot.",
            "It's windy and cool.",
          ],
        },
        {
          id: "q2",
          prompt: "Where is Marco?",
          correctText: "In the living room.",
          distractors: ["In the kitchen.", "In the garden.", "In the bedroom."],
        },
      ],
      exercisedAtomSurfaces: ["clima", "hace frío", "llueve", "sala"],
    }),
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
    listeningCompSentence({
      id: "es-m14-7-lc-jardin",
      audioText: "El jardín está detrás de la casa.",
      correctMeaningEn: "The garden is behind the house.",
      distractorsEn: [
        "The garden is in front of the house.",
        "The kitchen is behind the house.",
        "There's a garden near the house.",
      ],
      exercisedAtomSurfaces: ["jardín"],
    }),
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
    cloze(
      "es-m14-7-cloze-hay-dormitorios",
      "En mi casa",
      " tres dormitorios.",
      "hay",
      ["hay", "está", "son", "es"],
      "In my house there are three bedrooms.",
      "En mi casa hay tres dormitorios.",
      undefined,
      ["dormitorio"],
    ),
    vocabTextMcq("es-m14-7-rev-tmcq", M14_7_REV[0], M14_7_REV.slice(1, 4)),
    reviewMatchPairs("es-m14-7-rev", "es-m14-7-rev-a", "m14", 6),
    infoStep(
      "es-m14-7-win",
      "You can describe anything you own or meet",
      "You just narrated a whole house and its weather in Spanish — rooms, furniture, hay vs está(n), and the forecast, all in one story.",
      "win",
    ),
  ],
};

// ─── es-m14-8 — Mastery test ────────────────────────────────────────────────

const M14_8_REV = pickReviewSurfaces("es-m14-8-rev-b", "m14", 5);

const M14_8: LessonContent = {
  id: "es-m14-8",
  moduleId: "m14",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M14 Mastery Test",
  description: "Rooms, furniture, hay vs está(n), weather, and seasons.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m14-8-q-cocina",
      prompt: "'the kitchen' — which is it?",
      correctText: "la cocina",
      distractorsText: ["la sala", "el comedor", "el dormitorio"],
      exercisedAtomSurfaces: ["cocina"],
    }),
    vocabMcq("es-m14-8-mcq-invierno", { surface: "invierno", meaningEn: "winter", emoji: "⛄" }, [PRIMAVERA, VERANO, OTONO]),
    translateStep({
      id: "es-m14-8-tr-hacecalor",
      promptEn: "It's hot.",
      acceptedAnswers: ["Hace calor.", "hace calor", "Hace calor", "¡Hace calor!"],
      audioText: "Hace calor.",
      exercisedAtomSurfaces: ["hace calor"],
    }),
    sentenceMcq({
      id: "es-m14-8-q-lamparas-estan",
      prompt: "'The lamps are in the living room.' — pick the Spanish.",
      correctText: "Las lámparas están en la sala.",
      distractorsText: [
        "Hay unas lámparas en la sala.",
        "La lámpara está en la sala.",
        "Las lámparas son la sala.",
      ],
      exercisedAtomSurfaces: ["lámpara", "sala"],
    }),
    cloze(
      "es-m14-8-cloze-hay",
      "En mi dormitorio",
      "una cama.",
      "hay",
      ["hay", "está", "es", "hace"],
      "In my bedroom there is a bed.",
      "En mi dormitorio hay una cama.",
    ),
    listeningBuildSentence({
      id: "es-m14-8-lb-sofa",
      target: "el sofá está en la sala",
      tiles: ["el", "sofá", "está", "en", "la", "sala", "cocina"],
      correctOrder: ["el", "sofá", "está", "en", "la", "sala"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["sofá", "sala"],
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
    speaking("es-m14-8-speak-verano", "En verano hace sol.", "In summer it's sunny.", ["verano", "sol"]),
    sentenceMcq({
      id: "es-m14-8-q-quetiempo",
      prompt: "'What's the weather like?' — pick the Spanish.",
      correctText: "¿Qué tiempo hace?",
      distractorsText: ["¿Qué hora es?", "¿Dónde está el clima?", "¿Cómo se llama el clima?"],
      exercisedAtomSurfaces: ["clima"],
    }),
    build(
      "es-m14-8-build-nieve-invierno",
      "Build: 'There is snow in winter.'",
      "hay nieve en invierno",
      ["hay", "nieve", "en", "invierno", "verano"],
      ["hay", "nieve", "en", "invierno"],
      ["nieve", "invierno"],
    ),
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
    reviewMatchPairs("es-m14-8-rev", "es-m14-8-rev-a", "m14", 6),
    vocabTextMcq("es-m14-8-rev-tmcq", M14_8_REV[0], M14_8_REV.slice(1, 4)),
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
