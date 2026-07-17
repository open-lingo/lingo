/**
 * Spanish Module 16 — De viaje (survival Spanish, yo-irregulars, the
 * present progressive, and the A1 grand review).
 *
 * The capstone. New material lands in L1–L4: the yo-irregulars (hago,
 * vengo — light touch, as vocabulary, with the c→g mutation and the
 * g-insertion pattern taught as two SEPARATE histories, not one shared
 * "g" trick), saber vs conocer (with a dedicated selfExplain), estar +
 * -ando/-iendo, and the hotel-and-directions survival kit — where the
 * learner now SAYS "¿me puede ayudar?" and "siga derecho" out loud, not
 * just recognizes them. Then the course folds back on itself: L5–L7 are
 * cumulative review lessons weaving m1–m15 vocabulary and grammar (spaced
 * review, no new atoms) — deepened here to also loop m16's own new verbs
 * (sé/conozco/vengo/hago) back through the earlier-module carriers — and
 * L8 is the course mastery test.
 *
 * Lesson arc (m16 variant of the spine rhythm — L1 teach-intro ·
 * L2–L4 topics · L5–L7 grand review · L8 mastery test):
 *
 *   es-m16-1  Yo irregular — hago, vengo (+ maleta, pasaporte)
 *   es-m16-2  ¿Saber o conocer? — sé vs conozco (+ mapa), selfExplain
 *   es-m16-3  Estoy aprendiendo — progressive + classroom survival
 *   es-m16-4  En el hotel — room, help, directions (SAY it, not just pick it)
 *   es-m16-5  Repaso I — people, family & things (m1–m5 weave)
 *   es-m16-6  Repaso II — listening review (m6–m10 weave)
 *   es-m16-7  Repaso III — integration & speaking (m11–m15 weave)
 *   es-m16-8  M16 Mastery Test
 *
 * Review lessons reuse earlier-module surfaces freely WITHOUT
 * re-registering them (spine reuse rule) and stay inside m1–m16 vocab.
 * L1–L4 additionally close on a `reviewMatchPairs`/`pickReviewSurfaces`
 * tail (beforeModule="m16") per the compounding-review contract.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, findEsAtomBySurface, type EsAtom } from "../courseAtoms";
import {
  agreementCloze,
  build,
  capstoneMatchPairs,
  cloze,
  dialogueListen,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  phrase,
  pickReviewSurfaces,
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
import "./m15";

const COURSE_ID = "mock-1";

// ─── M16 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M16_ATOMS: EsAtom[] = [
  // Yo-irregulars (taught as vocabulary, light touch)
  atom({ surface: "hacer", meaningEn: "to do / make", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "hago", meaningEn: "I do / make", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "venir", meaningEn: "to come", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "vengo", meaningEn: "I come", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "saber", meaningEn: "to know (facts)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "sé", meaningEn: "I know", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "conocer", meaningEn: "to know (people/places)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "conozco", meaningEn: "I know (am familiar with)", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  // Travel survival nouns
  atom({ surface: "maleta", meaningEn: "suitcase", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "🧳" }),
  atom({ surface: "pasaporte", meaningEn: "passport", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "m" }),
  atom({ surface: "reservación", meaningEn: "reservation", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f" }),
  atom({ surface: "habitación", meaningEn: "room (hotel)", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "🛏️" }),
  // Directions
  atom({ surface: "derecha", meaningEn: "right (side)", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "➡️" }),
  atom({ surface: "izquierda", meaningEn: "left", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f", emoji: "⬅️" }),
  atom({ surface: "derecho", meaningEn: "straight ahead", partOfSpeech: "adverb", fromModule: "m16", kind: "vocab", emoji: "⬆️" }),
  atom({ surface: "esquina", meaningEn: "corner", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f" }),
  atom({ surface: "mapa", meaningEn: "map", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "m", emoji: "🗺️" }),
  atom({ surface: "ayuda", meaningEn: "help", partOfSpeech: "noun", fromModule: "m16", kind: "vocab", gender: "f" }),
  // Survival phrases
  atom({ surface: "¿me puede ayudar?", meaningEn: "can you help me?", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "estoy aprendiendo", meaningEn: "I am learning", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "hablando", meaningEn: "speaking", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "comiendo", meaningEn: "eating", partOfSpeech: "verb", fromModule: "m16", kind: "vocab" }),
  atom({ surface: "no entiendo", meaningEn: "I don't understand", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "¿habla inglés?", meaningEn: "do you speak English?", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
  atom({ surface: "más despacio", meaningEn: "more slowly", partOfSpeech: "phrase", fromModule: "m16", kind: "phrase" }),
];

// Shared distractor pool for travel-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg):
// 🧳 1f9f3 · 🗺️ 1f5fa · 🛏️ 1f6cf · ➡️ 27a1 · ⬅️ 2b05 · ⬆️ 2b06.
// (🛂 and 🆘 are NOT in the subset — pasaporte and ayuda ship without art.)
const MALETA = { surface: "maleta", emoji: "🧳" };
const MAPA = { surface: "mapa", emoji: "🗺️" };
const HABITACION = { surface: "habitación", emoji: "🛏️" };
const DERECHA = { surface: "derecha", emoji: "➡️" };
const IZQUIERDA = { surface: "izquierda", emoji: "⬅️" };
const DERECHO = { surface: "derecho", emoji: "⬆️" };

// ─── es-m16-1 — Yo irregular: hago, vengo ───────────────────────────────────

const M16_1_REVIEW = pickReviewSurfaces("es-m16-1-rev", "m16", 4);

const M16_1: LessonContent = {
  id: "es-m16-1",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Yo irregular — hago, vengo",
  description: "A handful of verbs bend only in the yo form. Pack your suitcase.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m16-1-info-yoirr",
      "Two ways a verb bends for yo",
      "Hacer (to do / make) and venir (to come) look nothing alike, but both surprise you only in the yo form: hago, vengo. They get there differently, though. Hacer swaps its c for a g: hago (compare digo, from decir). Venir has no c to swap — it just inserts a g before the ending: vengo, the same insertion salir makes in salgo (module 15) and tener makes in tengo. Two separate patterns, one shared letter. Every other person stays perfectly regular: haces, hace, hacemos… vienes, viene, venimos…",
      "grammar",
    ),
    vocab("es-m16-1-p-hago", "I do / make", "hago"),
    sentenceMcq({
      id: "es-m16-1-q-hago",
      prompt: "Pick the yo form of hacer.",
      correctText: "hago",
      distractorsText: ["haces", "hace", "hacer"],
      explanation: "Hacer swaps c for g only in the yo form.",
      exercisedAtomSurfaces: ["hago"],
    }),
    vocabMcq(
      "es-m16-1-mcq-maleta",
      { surface: "maleta", meaningEn: "suitcase", emoji: "🧳" },
      [MAPA, HABITACION, DERECHA],
    ),
    build(
      "es-m16-1-b-maleta",
      "Build: 'I pack the suitcase before the trip.'",
      "hago la maleta antes del viaje",
      ["hago", "la", "maleta", "antes", "del", "viaje", "hace"],
      ["hago", "la", "maleta", "antes", "del", "viaje"],
      ["hago", "maleta"],
    ),
    vocab("es-m16-1-p-vengo", "I come", "vengo"),
    sentenceMcq({
      id: "es-m16-1-q-vengo",
      prompt: "Pick the yo form of venir.",
      correctText: "vengo",
      distractorsText: ["viene", "vienes", "venimos"],
      explanation: "Venir inserts a g in the yo form — the same insertion tengo and salgo make, not the c-swap hago makes.",
      exercisedAtomSurfaces: ["vengo"],
    }),
    speaking("es-m16-1-speak-vengo", "vengo del aeropuerto", "I come from the airport", ["vengo"]),
    phrase("es-m16-1-p-pasaporte", "passport", "el pasaporte", undefined, { atomId: "es:pasaporte" }),
    build(
      "es-m16-1-b-pasaporte",
      "Build: 'My passport is in the suitcase.'",
      "mi pasaporte está en la maleta",
      ["mi", "pasaporte", "está", "en", "la", "maleta", "mochila"],
      ["mi", "pasaporte", "está", "en", "la", "maleta"],
      ["pasaporte", "maleta"],
    ),
    vocabTextMcq("es-m16-1-tmcq-pasaporte", "pasaporte", ["maleta", "mapa", "boleto"]),
    listeningCompSentence({
      id: "es-m16-1-lc-vengo",
      audioText: "vengo de España, no de México",
      correctMeaningEn: "I come from Spain, not Mexico",
      distractorsEn: [
        "I come from Mexico, not Spain",
        "I go to Spain, not Mexico",
        "I come from Spain and Mexico",
      ],
      exercisedAtomSurfaces: ["vengo"],
    }),
    translateStep({
      id: "es-m16-1-tr-desayuno",
      promptEn: "I make breakfast every morning.",
      acceptedAnswers: [
        "hago el desayuno todos los días",
        "Hago el desayuno todos los días",
        "hago el desayuno todos los dias",
        "Hago el desayuno todos los dias",
      ],
      audioText: "hago el desayuno todos los días",
      exercisedAtomSurfaces: ["hago"],
    }),
    selfExplain({
      id: "es-m16-1-self-explain",
      anchorLabel: "You wrote hago earlier and used vengo just now",
      anchorAudioText: "hago... vengo",
      question: "Why do both hago and vengo have a g, even though they come from different verbs?",
      rule: {
        text: "hago comes from hacer's c changing to g; vengo comes from venir inserting a g that was never a c — two different histories that land on the same letter.",
      },
      surface: { text: "hago and vengo both just add -go to the verb stem the same way." },
      distractor: { text: "Both verbs end in a hard consonant, and Spanish always inserts g before -o in that case." },
      ruleExplanation:
        "hacer → hago is a sound change (c→g); venir → vengo, like tener → tengo and salir → salgo, is a g-insertion. Different mechanisms, same letter.",
    }),
    speaking(
      "es-m16-1-speak-close",
      "hago la maleta y vengo al hotel",
      "I pack the suitcase and I come to the hotel",
      ["hago", "maleta", "vengo"],
    ),
    vocabTextMcq("es-m16-1-rev-tmcq", M16_1_REVIEW[0], [M16_1_REVIEW[1], M16_1_REVIEW[2], M16_1_REVIEW[3]]),
    speaking(
      "es-m16-1-rev-speak",
      M16_1_REVIEW[1],
      findEsAtomBySurface(M16_1_REVIEW[1])?.gloss ?? M16_1_REVIEW[1],
      [M16_1_REVIEW[1]],
    ),
    reviewMatchPairs("es-m16-1-rev-mp", "es-m16-1-rev-mp-seed", "m16", 6),
    infoStep(
      "es-m16-1-info-win",
      "Two verbs down",
      "You can now announce what you're doing (hago) and where you're arriving from (vengo) — and you know why they share a letter without sharing a history.",
      "win",
    ),
  ],
};

// ─── es-m16-2 — ¿Saber o conocer? ───────────────────────────────────────────

const M16_2_REVIEW = pickReviewSurfaces("es-m16-2-rev", "m16", 4);

const M16_2: LessonContent = {
  id: "es-m16-2",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Saber o conocer? — sé, conozco",
  description: "Two verbs for 'to know' — facts vs familiarity.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m16-2-info-saberconocer",
      "Two ways to know",
      "Spanish splits 'to know' in two. Saber is for facts and how-to: knowing where, when, how, or a memorized fact. Conocer is for familiarity: knowing people, places, and things you've experienced firsthand. Both are yo-irregular — saber gives sé (accented, to stand apart from the pronoun se), conocer gives conozco.",
      "grammar",
    ),
    vocab("es-m16-2-p-se", "I know (a fact)", "sé"),
    sentenceMcq({
      id: "es-m16-2-q-se",
      prompt: "Complete with the right verb: Yo ___ dónde está el hotel.",
      correctText: "sé",
      distractorsText: ["conozco", "saber", "conocer"],
      explanation: "Where the hotel is — that's a fact, so the facts-verb wins.",
      exercisedAtomSurfaces: ["sé"],
    }),
    vocabMcq(
      "es-m16-2-mcq-mapa",
      { surface: "mapa", meaningEn: "map", emoji: "🗺️" },
      [MALETA, HABITACION, IZQUIERDA],
    ),
    build(
      "es-m16-2-b-se",
      "Build: 'I know the map is here.'",
      "sé que el mapa está aquí",
      ["sé", "que", "el", "mapa", "está", "aquí", "conozco"],
      ["sé", "que", "el", "mapa", "está", "aquí"],
      ["sé", "mapa"],
    ),
    vocab("es-m16-2-p-conozco", "I know (am familiar with)", "conozco"),
    sentenceMcq({
      id: "es-m16-2-q-conozco",
      prompt: "Complete with the right verb: Yo ___ la Ciudad de México.",
      correctText: "conozco",
      distractorsText: ["sé", "saber", "conocer"],
      explanation: "A city you're familiar with — that's the familiarity verb.",
      exercisedAtomSurfaces: ["conozco"],
    }),
    speaking("es-m16-2-speak-conozco", "conozco a mi vecino", "I know my neighbor", ["conozco"]),
    listeningCompSentence({
      id: "es-m16-2-lc-se",
      audioText: "no sé dónde está el restaurante",
      correctMeaningEn: "I don't know where the restaurant is",
      distractorsEn: [
        "I know where the restaurant is",
        "I don't know where the bank is",
        "the restaurant is far from here",
      ],
      exercisedAtomSurfaces: ["sé"],
    }),
    cloze(
      "es-m16-2-cloze-conocer",
      "yo no",
      "bien esta ciudad",
      "conozco",
      ["conozco", "sé", "conoces", "sabes"],
      "I don't know this city well",
      "yo no conozco bien esta ciudad",
      "Cities are known through familiarity, not facts.",
    ),
    translateStep({
      id: "es-m16-2-tr-conozco",
      promptEn: "I know Mexico. (I'm familiar with it)",
      acceptedAnswers: [
        "conozco México",
        "Conozco México",
        "conozco Mexico",
        "Conozco Mexico",
        "yo conozco México",
        "yo conozco Mexico",
      ],
      audioText: "conozco México",
      exercisedAtomSurfaces: ["conozco"],
    }),
    build(
      "es-m16-2-b-mapa",
      "Build: 'I don't know where the map is.'",
      "no sé dónde está el mapa",
      ["no", "sé", "dónde", "está", "el", "mapa", "conozco"],
      ["no", "sé", "dónde", "está", "el", "mapa"],
      ["sé", "mapa"],
    ),
    sentenceMcq({
      id: "es-m16-2-q-mapa",
      prompt: "El mapa es muy ___.",
      correctText: "viejo",
      distractorsText: ["nuevo", "grande", "bonito"],
      exercisedAtomSurfaces: ["mapa"],
    }),
    selfExplain({
      id: "es-m16-2-self-explain",
      anchorLabel: "You picked sé for the hotel and conozco for the city",
      anchorAudioText: "sé... conozco",
      question: "Why does saber fit 'where the hotel is' but conocer fits 'the city'?",
      rule: {
        text: "Saber covers facts, information, and how-to knowledge; conocer covers familiarity with people, places, and things — being acquainted with them, not just informed.",
      },
      surface: { text: "Saber goes with questions and conocer goes with nouns." },
      distractor: { text: "Saber is for things you learned in school; conocer is for things you learned outside school." },
      ruleExplanation:
        "The line isn't where you learned it — it's what KIND of knowing: a fact/skill (saber) vs. firsthand familiarity with a person, place, or thing (conocer).",
    }),
    speaking(
      "es-m16-2-speak-close",
      "conozco la ciudad pero no sé la dirección",
      "I know the city but I don't know the address",
      ["conozco", "sé"],
    ),
    vocabTextMcq("es-m16-2-rev-tmcq", M16_2_REVIEW[0], [M16_2_REVIEW[1], M16_2_REVIEW[2], M16_2_REVIEW[3]]),
    speaking(
      "es-m16-2-rev-speak",
      M16_2_REVIEW[1],
      findEsAtomBySurface(M16_2_REVIEW[1])?.gloss ?? M16_2_REVIEW[1],
      [M16_2_REVIEW[1]],
    ),
    reviewMatchPairs("es-m16-2-rev-mp", "es-m16-2-rev-mp-seed", "m16", 6),
    infoStep(
      "es-m16-2-info-win",
      "You know the difference",
      "Facts and how-to live in saber; people, places, and things you've actually met live in conocer. You'll never mix them up again.",
      "win",
    ),
  ],
};

// ─── es-m16-3 — Estoy aprendiendo (present progressive) ─────────────────────

const M16_3_REVIEW = pickReviewSurfaces("es-m16-3-rev", "m16", 4);

const M16_3: LessonContent = {
  id: "es-m16-3",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Estoy aprendiendo — right now",
  description: "Estar + -ando/-iendo for what's happening this second.",
  estimatedMinutes: 9,
  xpReward: 21,
  steps: [
    infoStep(
      "es-m16-3-info-gerundio",
      "Right now: estar + -ando / -iendo",
      "For actions happening this very moment, pair estar with a gerund: -ar verbs swap -ar for -ando (hablar → hablando), while -er and -ir verbs take -iendo (comer → comiendo, aprender → aprendiendo). Estoy hablando = I am speaking, right now. Spanish leans on this less than English does — the plain present already covers routines, so save the progressive for 'this instant.'",
      "grammar",
    ),
    phrase(
      "es-m16-3-p-aprendiendo",
      "I am learning Spanish",
      "estoy aprendiendo español",
      undefined,
      { atomId: "es:estoy aprendiendo" },
    ),
    sentenceMcq({
      id: "es-m16-3-q-aprendiendo",
      prompt: "'I am learning Spanish' — pick the Spanish.",
      correctText: "estoy aprendiendo español",
      distractorsText: [
        "estoy aprendiendo inglés",
        "estás aprendiendo español",
        "aprender español",
      ],
      exercisedAtomSurfaces: ["estoy aprendiendo"],
    }),
    build(
      "es-m16-3-b-aprendiendo",
      "Build: 'I am learning Spanish right now.'",
      "estoy aprendiendo español ahora",
      ["estoy", "aprendiendo", "español", "ahora", "estudiando"],
      ["estoy", "aprendiendo", "español", "ahora"],
      ["estoy aprendiendo"],
    ),
    cloze(
      "es-m16-3-cloze-hablando",
      "estoy",
      "con mi amiga",
      "hablando",
      ["hablando", "comiendo", "hablar", "hablo"],
      "I am talking with my friend",
      "estoy hablando con mi amiga",
      "After estar, an -ar verb takes its -ando gerund — the action is underway right now.",
    ),
    listeningCompSentence({
      id: "es-m16-3-lc-comiendo",
      audioText: "estamos comiendo en el restaurante",
      correctMeaningEn: "we are eating at the restaurant",
      distractorsEn: [
        "we are cooking at the restaurant",
        "they are eating at home",
        "we eat at the restaurant every day",
      ],
      exercisedAtomSurfaces: ["comiendo"],
    }),
    speaking("es-m16-3-speak-comiendo", "estoy comiendo pan con queso", "I am eating bread with cheese", ["comiendo"]),
    phrase("es-m16-3-p-noentiendo", "I don't understand", "no entiendo"),
    sentenceMcq({
      id: "es-m16-3-q-noentiendo",
      prompt: "The clerk is speaking too fast and you're lost. Say it:",
      correctText: "no entiendo",
      distractorsText: ["no sé", "más despacio, por favor", "estoy aprendiendo"],
      exercisedAtomSurfaces: ["no entiendo"],
    }),
    build(
      "es-m16-3-b-masdespacio",
      "Build: 'More slowly, please.'",
      "más despacio, por favor",
      ["más", "despacio", "por", "favor", "rápido"],
      ["más", "despacio", "por", "favor"],
      ["más despacio"],
    ),
    translateStep({
      id: "es-m16-3-tr-noentiendo",
      promptEn: "I don't understand.",
      acceptedAnswers: ["no entiendo", "No entiendo", "no entiendo.", "No entiendo."],
      audioText: "no entiendo",
      exercisedAtomSurfaces: ["no entiendo"],
    }),
    phrase(
      "es-m16-3-p-hablainges",
      "do you speak English?",
      "¿habla inglés?",
      "Hotel and restaurant staff are addressed with formal usted — that's why it's habla, not hablas.",
    ),
    sentenceMcq({
      id: "es-m16-3-q-hablainges",
      prompt: "You need directions in English. Ask the hotel clerk politely:",
      correctText: "¿habla inglés?",
      distractorsText: ["¿hablas español?", "más despacio, por favor", "estoy comiendo"],
      explanation: "The formal you-form fits a clerk you've just met.",
      exercisedAtomSurfaces: ["¿habla inglés?"],
    }),
    speaking("es-m16-3-speak-hablainges", "¿habla inglés, por favor?", "do you speak English, please?", ["¿habla inglés?"]),
    selfExplain({
      id: "es-m16-3-self-explain",
      anchorLabel: "You wrote hablando for hablar but comiendo for comer",
      anchorAudioText: "hablando... comiendo",
      question: "Why does hablar take -ando but comer take -iendo?",
      rule: { text: "The gerund ending depends on the infinitive's group: -ar verbs take -ando, -er/-ir verbs take -iendo." },
      surface: { text: "-ando is for actions you do with your mouth; -iendo is for everything else." },
      distractor: { text: "The ending depends on whether the sentence is a question or a statement." },
      ruleExplanation:
        "Gerunds split by conjugation class, not meaning: hablar→hablando (-ar class), comer→comiendo, aprender→aprendiendo (-er/-ir class).",
    }),
    speaking(
      "es-m16-3-speak-close",
      "estoy aprendiendo pero no entiendo todo",
      "I am learning but I don't understand everything",
      ["estoy aprendiendo", "no entiendo"],
    ),
    vocabTextMcq("es-m16-3-rev-tmcq", M16_3_REVIEW[0], [M16_3_REVIEW[1], M16_3_REVIEW[2], M16_3_REVIEW[3]]),
    speaking(
      "es-m16-3-rev-speak",
      M16_3_REVIEW[1],
      findEsAtomBySurface(M16_3_REVIEW[1])?.gloss ?? M16_3_REVIEW[1],
      [M16_3_REVIEW[1]],
    ),
    reviewMatchPairs("es-m16-3-rev-mp", "es-m16-3-rev-mp-seed", "m16", 6),
    infoStep(
      "es-m16-3-info-win",
      "You can narrate the moment",
      "You can now say what's happening right this second — and ask someone to slow down or switch to English if you need to.",
      "win",
    ),
  ],
};

// ─── es-m16-4 — En el hotel: room, help, directions ─────────────────────────

const M16_4_REVIEW = pickReviewSurfaces("es-m16-4-rev", "m16", 4);

const M16_4: LessonContent = {
  id: "es-m16-4",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En el hotel — la habitación, direcciones",
  description: "Check in, ask for help, and follow — and give — directions.",
  estimatedMinutes: 10,
  xpReward: 22,
  steps: [
    phrase(
      "es-m16-4-p-ayudar",
      "can you help me?",
      "¿me puede ayudar?",
      "Hotel and restaurant staff are addressed with formal usted — that's why it's puede, not puedes.",
    ),
    sentenceMcq({
      id: "es-m16-4-q-ayudar",
      prompt: "Your suitcase is lost. Get the front desk's attention:",
      correctText: "perdón, ¿me puede ayudar?",
      distractorsText: ["gracias, hasta luego", "sí, por favor", "buenas noches, señor"],
      exercisedAtomSurfaces: ["¿me puede ayudar?"],
    }),
    speaking(
      "es-m16-4-speak-ayudar",
      "perdón, ¿me puede ayudar?",
      "excuse me, can you help me?",
      ["¿me puede ayudar?"],
    ),
    phrase("es-m16-4-p-habitacion", "room (hotel)", "la habitación", undefined, { atomId: "es:habitación", emoji: "🛏️" }),
    vocabMcq(
      "es-m16-4-mcq-habitacion",
      { surface: "habitación", meaningEn: "room (hotel)", emoji: "🛏️" },
      [MALETA, DERECHA, IZQUIERDA],
    ),
    build(
      "es-m16-4-b-habitacion",
      "Build: 'My room is on the corner.'",
      "mi habitación está en la esquina",
      ["mi", "habitación", "está", "en", "la", "esquina", "derecha"],
      ["mi", "habitación", "está", "en", "la", "esquina"],
      ["habitación", "esquina"],
    ),
    sentenceMcq({
      id: "es-m16-4-q-reservacion",
      prompt: "Checking in: 'Tengo una reservación. ¿Dónde está la ___?'",
      correctText: "habitación",
      distractorsText: ["esquina", "maleta", "ayuda"],
      exercisedAtomSurfaces: ["habitación", "reservación"],
    }),
    phrase("es-m16-4-p-derecha", "to the right", "a la derecha", undefined, { atomId: "es:derecha", emoji: "➡️" }),
    vocabMcq(
      "es-m16-4-mcq-derecha",
      { surface: "derecha", meaningEn: "right (side)", emoji: "➡️" },
      [IZQUIERDA, DERECHO, MAPA],
    ),
    build(
      "es-m16-4-b-derecha",
      "Build: 'The bathroom is to the right.'",
      "el baño está a la derecha",
      ["el", "baño", "está", "a", "la", "derecha", "izquierda"],
      ["el", "baño", "está", "a", "la", "derecha"],
      ["derecha"],
    ),
    phrase("es-m16-4-p-izquierda", "to the left", "a la izquierda", undefined, { atomId: "es:izquierda", emoji: "⬅️" }),
    sentenceMcq({
      id: "es-m16-4-q-izquierda",
      prompt: "'The bank is on the left.' — El banco está a la ___.",
      correctText: "izquierda",
      distractorsText: ["derecha", "derecho", "esquina"],
      exercisedAtomSurfaces: ["izquierda"],
    }),
    speaking(
      "es-m16-4-speak-izquierda",
      "la tienda está a la izquierda del hotel",
      "the store is to the left of the hotel",
      ["izquierda"],
    ),
    cloze(
      "es-m16-4-cloze-derecho",
      "siga",
      "hasta la esquina",
      "derecho",
      ["derecho", "derecha", "izquierda", "recto"],
      "go straight ahead until the corner",
      "siga derecho hasta la esquina",
      "Derecho here is the fixed adverb for 'straight ahead' — no article, unlike a la derecha (to the right).",
    ),
    speaking(
      "es-m16-4-speak-derecho",
      "siga derecho hasta la esquina",
      "go straight ahead until the corner",
      ["derecho", "esquina"],
    ),
    sentenceMcq({
      id: "es-m16-4-q-derecho",
      prompt: "The clerk points down the street, without turning:",
      correctText: "siga derecho",
      distractorsText: ["doble a la derecha", "doble a la izquierda", "pare en la esquina"],
      explanation: "Continuing without turning — the fixed phrase for 'straight ahead.'",
      exercisedAtomSurfaces: ["derecho"],
    }),
    agreementCloze(
      "es-m16-4-agree-reservacion",
      [
        { text: "tengo " },
        { blank: { id: "b1", correctAnswer: "una", options: ["una", "un", "unas", "unos"] } },
        { text: " reservación y " },
        { blank: { id: "b2", correctAnswer: "la", options: ["la", "el", "las", "los"] } },
        { text: " habitación está a " },
        { blank: { id: "b3", correctAnswer: "la", options: ["la", "el", "las", "los"] } },
        { text: " izquierda." },
      ],
      "I have a reservation and the room is to the left.",
      "tengo una reservación y la habitación está a la izquierda",
      ["reservación", "habitación", "izquierda"],
    ),
    translateStep({
      id: "es-m16-4-tr-derecha",
      promptEn: "The room is to the right, on the corner.",
      acceptedAnswers: [
        "la habitación está a la derecha, en la esquina",
        "La habitación está a la derecha, en la esquina",
        "la habitacion esta a la derecha, en la esquina",
        "La habitacion esta a la derecha, en la esquina",
      ],
      audioText: "la habitación está a la derecha, en la esquina",
      exercisedAtomSurfaces: ["habitación", "derecha", "esquina"],
    }),
    vocabTextMcq("es-m16-4-tmcq-esquina", "esquina", ["derecha", "izquierda", "mapa"]),
    speaking(
      "es-m16-4-rev-speak",
      M16_4_REVIEW[1],
      findEsAtomBySurface(M16_4_REVIEW[1])?.gloss ?? M16_4_REVIEW[1],
      [M16_4_REVIEW[1]],
    ),
    reviewMatchPairs("es-m16-4-rev-mp", "es-m16-4-rev-mp-seed", "m16", 6),
    infoStep(
      "es-m16-4-info-win",
      "You can navigate a real hotel",
      "You can now check in, ask a stranger for help out loud, and follow — or give — directions to the corner.",
      "win",
    ),
  ],
};

// ─── es-m16-5 — Repaso I: people, family & things (m1–m5) ───────────────────

const M16_5: LessonContent = {
  id: "es-m16-5",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Repaso I — gente y cosas",
  description: "Grand review, part one: greetings, ser, articles, family — woven with the new travel verbs.",
  estimatedMinutes: 10,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m16-5-info-repaso",
      "The grand review begins",
      "Three review lessons close the course, weaving together everything from module 1 on — and looping this module's own new verbs (sé, conozco, vengo, hago) back through them. Nothing here is new; everything here is yours.",
      "default",
    ),
    sentenceMcq({
      id: "es-m16-5-r-ser",
      prompt: "'She is my sister' — pick the Spanish.",
      correctText: "ella es mi hermana",
      distractorsText: ["ella está mi hermana", "ella eres mi hermana", "él es mi hermano"],
      exercisedAtomSurfaces: ["es", "hermana"],
    }),
    build(
      "es-m16-5-b-hermana",
      "Build: 'My sister is tall and nice.'",
      "mi hermana es alta y simpática",
      ["mi", "hermana", "es", "alta", "y", "simpática", "baja"],
      ["mi", "hermana", "es", "alta", "y", "simpática"],
      ["hermana"],
    ),
    cloze(
      "es-m16-5-cloze-la",
      "¿dónde está",
      "llave de la habitación?",
      "la",
      ["la", "el", "una", "los"],
      "where is the room key?",
      "¿dónde está la llave de la habitación?",
    ),
    sentenceMcq({
      id: "es-m16-5-r-tengo",
      prompt: "'I am twenty years old' — pick the Spanish.",
      correctText: "tengo veinte años",
      distractorsText: ["soy veinte años", "estoy veinte años", "tienes veinte años"],
      explanation: "Spanish states age with the having-verb, never with the being-verbs.",
      exercisedAtomSurfaces: ["tengo", "años"],
    }),
    build(
      "es-m16-5-b-casa",
      "Build: 'The new house is big.'",
      "la casa nueva es grande",
      ["la", "casa", "nueva", "es", "grande", "pequeña"],
      ["la", "casa", "nueva", "es", "grande"],
      ["casa", "grande"],
    ),
    listeningCompSentence({
      id: "es-m16-5-lc-familia",
      audioText: "tengo dos hermanos y una hermana",
      correctMeaningEn: "I have two brothers and one sister",
      distractorsEn: [
        "I have three brothers",
        "I have two sisters and one brother",
        "my brother has two daughters",
      ],
      exercisedAtomSurfaces: ["hermana", "tengo"],
    }),
    sentenceMcq({
      id: "es-m16-5-r-hay",
      prompt: "'There are five books on the table' — pick the Spanish.",
      correctText: "hay cinco libros en la mesa",
      distractorsText: [
        "hay cinco libro en la mesa",
        "está cinco libros en la mesa",
        "hay cinco libros en la silla",
      ],
      exercisedAtomSurfaces: ["hay", "mesa"],
    }),
    translateStep({
      id: "es-m16-5-tr-madre",
      promptEn: "My mother is very nice.",
      acceptedAnswers: [
        "mi madre es muy simpática",
        "Mi madre es muy simpática",
        "mi madre es muy simpatica",
        "Mi madre es muy simpatica",
        "mi mamá es muy simpática",
        "mi mama es muy simpatica",
      ],
      audioText: "mi madre es muy simpática",
      exercisedAtomSurfaces: ["madre", "muy"],
    }),
    cloze(
      "es-m16-5-cloze-de",
      "el carro",
      "mi padre es nuevo",
      "de",
      ["de", "del", "en", "y"],
      "my father's car is new",
      "el carro de mi padre es nuevo",
    ),
    speaking(
      "es-m16-5-speak-mapa",
      "mi padre tiene el mapa y el pasaporte",
      "my father has the map and the passport",
      ["mapa", "pasaporte"],
    ),
    listeningCompSentence({
      id: "es-m16-5-lc-saberconocer",
      audioText: "yo sé dónde está el banco, pero no conozco el barrio",
      correctMeaningEn: "I know where the bank is, but I don't know (I'm not familiar with) the neighborhood",
      distractorsEn: [
        "I know the neighborhood, but I don't know where the bank is",
        "I don't know where the bank or the neighborhood are",
        "my neighbor knows where the bank is",
      ],
      exercisedAtomSurfaces: ["sé", "conozco"],
    }),
    build(
      "es-m16-5-b-vengo",
      "Build: 'I come with the suitcase and the passport.'",
      "vengo con la maleta y el pasaporte",
      ["vengo", "con", "la", "maleta", "y", "el", "pasaporte", "voy"],
      ["vengo", "con", "la", "maleta", "y", "el", "pasaporte"],
      ["vengo", "maleta", "pasaporte"],
    ),
    sentenceMcq({
      id: "es-m16-5-r-hago-cena",
      prompt: "'I make dinner every night' — pick the Spanish.",
      correctText: "hago la cena todas las noches",
      distractorsText: [
        "hice la cena todas las noches",
        "hago la cena todos los días",
        "hace la cena todas las noches",
      ],
      exercisedAtomSurfaces: ["hago"],
    }),
    cloze(
      "es-m16-5-cloze-gusta",
      "me",
      "el café de la mañana",
      "gusta",
      ["gusta", "gustan", "gusto", "gustas"],
      "I like the morning coffee",
      "me gusta el café de la mañana",
      "Gusta agrees with the singular thing liked — el café.",
    ),
    listeningBuildSentence({
      id: "es-m16-5-lb-mapamaleta",
      target: "el mapa está en mi maleta",
      tiles: ["el", "mapa", "está", "en", "mi", "maleta", "pasaporte"],
      correctOrder: ["el", "mapa", "está", "en", "mi", "maleta"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mapa", "maleta"],
    }),
    speaking("es-m16-5-speak-abuelos", "conozco bien a mis abuelos", "I know my grandparents well", ["conozco"]),
    translateStep({
      id: "es-m16-5-tr-maleta",
      promptEn: "I don't know where my suitcase is.",
      acceptedAnswers: [
        "no sé dónde está mi maleta",
        "No sé dónde está mi maleta",
        "no se donde esta mi maleta",
        "No se donde esta mi maleta",
      ],
      audioText: "no sé dónde está mi maleta",
      exercisedAtomSurfaces: ["sé", "maleta"],
    }),
    // Capstone grid — one word from each stretch of the course (m3–m16).
    // Uses the registry-free variant with inline glosses: the registry
    // resolver throws whenever a referenced module sits mid-import-cycle
    // (any test entry that imports a curriculum module directly). Glosses
    // must stay byte-identical to each atom's meaningEn.
    capstoneMatchPairs("es-m16-5-rev", [
      { surface: "casa", gloss: "house" },
      { surface: "hermana", gloss: "sister" },
      { surface: "escuela", gloss: "school" },
      { surface: "café", gloss: "coffee" },
      { surface: "playa", gloss: "beach" },
      { surface: "sombrero", gloss: "hat" },
      { surface: "película", gloss: "movie" },
      { surface: "maleta", gloss: "suitcase" },
    ]),
  ],
};

// ─── es-m16-6 — Repaso II: listening review (m6–m10) ────────────────────────

const M16_6: LessonContent = {
  id: "es-m16-6",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Repaso II — escucha",
  description: "Grand review, part two: time, places, and food — by ear, with a few new verbs mixed in.",
  estimatedMinutes: 10,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m16-6-info-escucha",
      "Review by ear",
      "Part two of the grand review is mostly listening: clock times, locations, routines, and food orders. Every sentence is built from words you already know — trust your ear.",
      "default",
    ),
    listeningCompSentence({
      id: "es-m16-6-lc-hora",
      audioText: "son las dos y media",
      correctMeaningEn: "it's half past two",
      distractorsEn: ["it's a quarter past two", "it's half past three", "it's two o'clock exactly"],
      exercisedAtomSurfaces: ["media"],
    }),
    listeningBuildSentence({
      id: "es-m16-6-lb-banco",
      target: "el banco está cerca del hotel",
      tiles: ["el", "banco", "está", "cerca", "del", "hotel", "lejos"],
      correctOrder: ["el", "banco", "está", "cerca", "del", "hotel"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["banco", "cerca", "del"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-gusta",
      audioText: "me gusta el café pero no me gusta el té",
      correctMeaningEn: "I like coffee but I don't like tea",
      distractorsEn: [
        "I like tea but I don't like coffee",
        "I don't like coffee or tea",
        "I like coffee and tea",
      ],
      exercisedAtomSurfaces: ["me gusta", "café", "té"],
    }),
    build(
      "es-m16-6-b-conozco",
      "Build: 'I know this restaurant very well.'",
      "conozco este restaurante muy bien",
      ["conozco", "este", "restaurante", "muy", "bien", "sé"],
      ["conozco", "este", "restaurante", "muy", "bien"],
      ["conozco"],
    ),
    listeningBuildSentence({
      id: "es-m16-6-lb-estudio",
      target: "estudio español todos los días",
      tiles: ["estudio", "español", "todos", "los", "días", "siempre"],
      correctOrder: ["estudio", "español", "todos", "los", "días"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["todos los días", "español"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-comida",
      audioText: "quiero pollo con arroz, por favor",
      correctMeaningEn: "I want chicken with rice, please",
      distractorsEn: [
        "I want fish with rice, please",
        "I want chicken with salad, please",
        "he wants chicken with rice",
      ],
      exercisedAtomSurfaces: ["quiero", "pollo", "arroz"],
    }),
    speaking("es-m16-6-speak-vengo", "vengo del banco ahora", "I come from the bank now", ["vengo"]),
    listeningCompSentence({
      id: "es-m16-6-lc-derecha",
      audioText: "la habitación está a la derecha",
      correctMeaningEn: "the room is to the right",
      distractorsEn: [
        "the room is to the left",
        "the bathroom is to the right",
        "the room is on the corner",
      ],
      exercisedAtomSurfaces: ["habitación", "derecha"],
    }),
    listeningBuildSentence({
      id: "es-m16-6-lb-boleto",
      target: "el boleto de tren cuesta cincuenta pesos",
      tiles: ["el", "boleto", "de", "tren", "cuesta", "cincuenta", "pesos", "avión"],
      correctOrder: ["el", "boleto", "de", "tren", "cuesta", "cincuenta", "pesos"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["boleto", "tren", "cuesta", "cincuenta"],
    }),
    listeningCompSentence({
      id: "es-m16-6-lc-desayuno",
      audioText: "el desayuno es a las ocho de la mañana",
      correctMeaningEn: "breakfast is at eight in the morning",
      distractorsEn: [
        "dinner is at eight at night",
        "breakfast is at seven in the morning",
        "lunch is at eight in the morning",
      ],
      exercisedAtomSurfaces: ["desayuno", "ocho", "mañana"],
    }),
    translateStep({
      id: "es-m16-6-tr-estacion",
      promptEn: "I don't know where the train station is.",
      acceptedAnswers: [
        "no sé dónde está la estación de tren",
        "No sé dónde está la estación de tren",
        "no se donde esta la estacion de tren",
        "No se donde esta la estacion de tren",
      ],
      audioText: "no sé dónde está la estación de tren",
      exercisedAtomSurfaces: ["sé"],
    }),
    sentenceMcq({
      id: "es-m16-6-q-conozco",
      prompt: "Yo ___ esta ciudad muy bien.",
      correctText: "conozco",
      distractorsText: ["sé", "conoces", "sabes"],
      exercisedAtomSurfaces: ["conozco"],
    }),
    vocabMcq(
      "es-m16-6-mcq-mapa",
      { surface: "mapa", meaningEn: "map", emoji: "🗺️" },
      [MALETA, HABITACION, IZQUIERDA],
    ),
    speaking(
      "es-m16-6-speak-hambre",
      "tengo hambre; ¿hay un restaurante cerca?",
      "I'm hungry; is there a restaurant nearby?",
    ),
    listeningCompSentence({
      id: "es-m16-6-lc-almuerzo",
      audioText: "el desayuno es a las siete y el almuerzo es al mediodía",
      correctMeaningEn: "breakfast is at seven and lunch is at noon",
      distractorsEn: [
        "breakfast is at eight and lunch is at noon",
        "dinner is at seven and lunch is at noon",
        "breakfast is at seven and dinner is at noon",
      ],
    }),
    listeningBuildSentence({
      id: "es-m16-6-lb-mapa",
      target: "el mapa está en la mochila",
      tiles: ["el", "mapa", "está", "en", "la", "mochila", "maleta"],
      correctOrder: ["el", "mapa", "está", "en", "la", "mochila"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mapa"],
    }),
    infoStep(
      "es-m16-6-info-win",
      "Your ear caught up",
      "Every sentence in this lesson was built from words you already knew — that's what a caught-up ear sounds like.",
      "win",
    ),
  ],
};

// ─── es-m16-7 — Repaso III: integration & speaking (m11–m15) ────────────────

const M16_7: LessonContent = {
  id: "es-m16-7",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Repaso III — un día de viaje",
  description: "Grand review, part three: plans, shopping, routines — out loud, closing the loop on m16's survival Spanish.",
  estimatedMinutes: 10,
  xpReward: 21,
  steps: [
    infoStep(
      "es-m16-7-info-dialogo",
      "Un día de viaje",
      "—Buenos días. Tengo una reservación. Me llamo Ana.\n—Mucho gusto, señora. Su habitación está a la izquierda.\n—Gracias. ¿Hay un restaurante cerca?\n—Sí, en la esquina.\nA whole hotel check-in, from module 1 greetings to module 16 directions — read it out loud before you go on.",
      "default",
    ),
    dialogueListen({
      id: "es-m16-7-dl-hotel",
      lines: [
        { speaker: "Ana", text: "Perdón, señor. ¿Me puede ayudar? No sé dónde está el hotel." },
        { speaker: "Carlos", text: "Sí, claro. El hotel está a la derecha, en la esquina." },
        { speaker: "Ana", text: "Gracias. ¿Hay un restaurante cerca?" },
        { speaker: "Carlos", text: "Sí, hay un restaurante muy bueno al lado del hotel." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where is the hotel?",
          correctText: "To the right, on the corner.",
          distractors: [
            "To the left, on the corner.",
            "Straight ahead, near the bank.",
            "Behind the restaurant.",
          ],
        },
        {
          id: "q2",
          prompt: "What does Ana ask about at the end?",
          correctText: "Whether there is a restaurant nearby.",
          distractors: [
            "Whether there is a bank nearby.",
            "Where the train station is.",
            "What time breakfast is.",
          ],
        },
      ],
      exercisedAtomSurfaces: ["¿me puede ayudar?", "sé", "hotel", "derecha", "esquina"],
    }),
    speaking(
      "es-m16-7-speak-echo",
      "perdón, ¿me puede ayudar? no sé dónde está el hotel",
      "excuse me, can you help me? I don't know where the hotel is",
      ["¿me puede ayudar?", "sé"],
    ),
    sentenceMcq({
      id: "es-m16-7-r-vamos",
      prompt: "'We're going to the beach tomorrow' — pick the Spanish.",
      correctText: "vamos a la playa mañana",
      distractorsText: ["vamos a la playa hoy", "van a la playa mañana", "vamos al cine mañana"],
      exercisedAtomSurfaces: ["vamos", "playa", "mañana"],
    }),
    cloze(
      "es-m16-7-cloze-este",
      "¿cuánto cuesta",
      "sombrero?",
      "este",
      ["este", "esta", "ese", "esos"],
      "how much does this hat cost?",
      "¿cuánto cuesta este sombrero?",
    ),
    build(
      "es-m16-7-b-levanto",
      "Build: 'I get up at seven in the morning.'",
      "me levanto a las siete de la mañana",
      ["me", "levanto", "a", "las", "siete", "de", "la", "mañana", "tarde"],
      ["me", "levanto", "a", "las", "siete", "de", "la", "mañana"],
      ["me levanto", "siete"],
    ),
    listeningCompSentence({
      id: "es-m16-7-lc-clima",
      audioText: "hace frío y nieva en invierno",
      correctMeaningEn: "it's cold and it snows in winter",
      distractorsEn: [
        "it's hot and sunny in summer",
        "it rains in the fall",
        "it's cold and windy in spring",
      ],
      exercisedAtomSurfaces: ["hace frío", "nieva", "invierno"],
    }),
    speaking("es-m16-7-speak-aprendiendo", "estoy aprendiendo español", "I am learning Spanish", ["estoy aprendiendo", "español"]),
    sentenceMcq({
      id: "es-m16-7-r-rutina",
      prompt: "'First I shower, then I have breakfast' — pick the Spanish.",
      correctText: "primero me ducho, luego desayuno",
      distractorsText: [
        "primero desayuno, luego me ducho",
        "primero me ducho, luego desayunas",
        "luego me ducho, primero desayuno",
      ],
      exercisedAtomSurfaces: ["primero", "luego"],
    }),
    speaking("es-m16-7-speak-ayudar", "perdón, ¿me puede ayudar?", "excuse me, can you help me?", ["¿me puede ayudar?", "perdón"]),
    translateStep({
      id: "es-m16-7-tr-cena",
      promptEn: "Tonight we're going to eat at the restaurant.",
      acceptedAnswers: [
        "esta noche vamos a comer en el restaurante",
        "Esta noche vamos a comer en el restaurante",
        "vamos a comer en el restaurante esta noche",
        "Vamos a comer en el restaurante esta noche",
      ],
      audioText: "esta noche vamos a comer en el restaurante",
      exercisedAtomSurfaces: ["esta noche", "vamos", "comer"],
    }),
    sentenceMcq({
      id: "es-m16-7-r-conozco-playa",
      prompt: "Vengo de la playa y ___ un buen restaurante cerca.",
      correctText: "conozco",
      distractorsText: ["sé", "conoces", "sabes"],
      exercisedAtomSurfaces: ["vengo", "conozco"],
    }),
    cloze(
      "es-m16-7-cloze-tren",
      "el tren sale",
      "las nueve de la mañana",
      "a",
      ["a", "en", "de", "por"],
      "the train leaves at nine in the morning",
      "el tren sale a las nueve de la mañana",
    ),
    build(
      "es-m16-7-b-maletapasaporte",
      "Build: 'The suitcase is heavy but the passport is light.'",
      "la maleta es pesada pero el pasaporte es ligero",
      ["la", "maleta", "es", "pesada", "pero", "el", "pasaporte", "ligero", "pequeña"],
      ["la", "maleta", "es", "pesada", "pero", "el", "pasaporte", "ligero"],
      ["maleta", "pasaporte"],
    ),
    listeningCompSentence({
      id: "es-m16-7-lc-despacio",
      audioText: "no entiendo, ¿puede hablar más despacio, por favor?",
      correctMeaningEn: "I don't understand, can you speak more slowly, please?",
      distractorsEn: [
        "I understand, thank you for speaking slowly",
        "I don't understand, can you speak English, please?",
        "I don't understand the map, please help me",
      ],
      exercisedAtomSurfaces: ["no entiendo", "más despacio"],
    }),
    speaking(
      "es-m16-7-speak-close",
      "más despacio, por favor; no entiendo todo",
      "more slowly, please; I don't understand everything",
      ["más despacio", "no entiendo"],
    ),
    translateStep({
      id: "es-m16-7-tr-close",
      promptEn: "I am learning Spanish, but I don't understand everything yet.",
      acceptedAnswers: [
        "estoy aprendiendo español, pero no entiendo todo todavía",
        "Estoy aprendiendo español, pero no entiendo todo todavía",
        "estoy aprendiendo espanol, pero no entiendo todo todavia",
        "Estoy aprendiendo espanol, pero no entiendo todo todavia",
      ],
      audioText: "estoy aprendiendo español, pero no entiendo todo todavía",
      exercisedAtomSurfaces: ["estoy aprendiendo", "no entiendo"],
    }),
    infoStep(
      "es-m16-7-info-win",
      "A whole day, in Spanish",
      "Waking up, getting directions, ordering food, asking for help, explaining you're still learning — you can now carry a full day of travel in Spanish, start to finish.",
      "win",
    ),
  ],
};

// ─── es-m16-8 — Mastery test ────────────────────────────────────────────────

const M16_8_REVIEW = pickReviewSurfaces("es-m16-8-rev", "m16", 4);

const M16_8: LessonContent = {
  id: "es-m16-8",
  moduleId: "m16",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M16 Mastery Test",
  description: "Yo-irregulars, saber vs conocer, the progressive, survival Spanish.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m16-8-q-hago",
      prompt: "Pick the yo form of hacer (to do / make).",
      correctText: "hago",
      distractorsText: ["haces", "hace", "hacemos"],
      exercisedAtomSurfaces: ["hago"],
    }),
    translateStep({
      id: "es-m16-8-tr-reservacion",
      promptEn: "I have a reservation.",
      acceptedAnswers: [
        "tengo una reservación",
        "Tengo una reservación",
        "tengo una reservacion",
        "Tengo una reservacion",
      ],
      audioText: "tengo una reservación",
      exercisedAtomSurfaces: ["reservación", "tengo"],
    }),
    sentenceMcq({
      id: "es-m16-8-q-conozco",
      prompt: "Complete with the right verb: Yo ___ la ciudad.",
      correctText: "conozco",
      distractorsText: ["sé", "saber", "conocer"],
      exercisedAtomSurfaces: ["conozco"],
    }),
    listeningBuildSentence({
      id: "es-m16-8-lb-derecha",
      target: "el baño está a la derecha",
      tiles: ["el", "baño", "está", "a", "la", "derecha", "izquierda"],
      correctOrder: ["el", "baño", "está", "a", "la", "derecha"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["derecha", "baño"],
    }),
    listeningCompSentence({
      id: "es-m16-8-lc-comiendo",
      audioText: "estoy comiendo pan con queso",
      correctMeaningEn: "I am eating bread with cheese",
      distractorsEn: [
        "I am eating rice with chicken",
        "I eat bread every day",
        "she is eating bread with cheese",
      ],
      exercisedAtomSurfaces: ["comiendo", "pan", "queso"],
    }),
    sentenceMcq({
      id: "es-m16-8-q-se",
      prompt: "Complete with the right verb: Yo ___ dónde está la parada de autobús.",
      correctText: "sé",
      distractorsText: ["conozco", "sabes", "conoces"],
      exercisedAtomSurfaces: ["sé"],
    }),
    translateStep({
      id: "es-m16-8-tr-masdespacio",
      promptEn: "More slowly, please.",
      acceptedAnswers: [
        "más despacio, por favor",
        "Más despacio, por favor",
        "mas despacio, por favor",
        "Mas despacio, por favor",
        "más despacio por favor",
        "mas despacio por favor",
      ],
      audioText: "más despacio, por favor",
      exercisedAtomSurfaces: ["más despacio", "por favor"],
    }),
    sentenceMcq({
      id: "es-m16-8-q-vengo",
      prompt: "'I come from the United States' — pick the Spanish.",
      correctText: "vengo de Estados Unidos",
      distractorsText: ["voy a Estados Unidos", "vengo a Estados Unidos", "viene de Estados Unidos"],
      exercisedAtomSurfaces: ["vengo"],
    }),
    build(
      "es-m16-8-b-esquina",
      "Build: 'The bank is on the corner.'",
      "el banco está en la esquina",
      ["el", "banco", "está", "en", "la", "esquina", "derecho"],
      ["el", "banco", "está", "en", "la", "esquina"],
      ["esquina", "banco"],
    ),
    speaking("es-m16-8-speak-ingles", "¿habla inglés?", "do you speak English?", ["¿habla inglés?"]),
    agreementCloze(
      "es-m16-8-agree-close",
      [
        { text: "tengo " },
        { blank: { id: "b1", correctAnswer: "una", options: ["una", "un", "unas", "unos"] } },
        { text: " reservación y " },
        { blank: { id: "b2", correctAnswer: "el", options: ["el", "la", "los", "las"] } },
        { text: " pasaporte está en " },
        { blank: { id: "b3", correctAnswer: "la", options: ["la", "el", "las", "los"] } },
        { text: " maleta." },
      ],
      "I have a reservation and the passport is in the suitcase.",
      "tengo una reservación y el pasaporte está en la maleta",
      ["reservación", "pasaporte", "maleta"],
    ),
    vocabTextMcq("es-m16-8-rev-tmcq", M16_8_REVIEW[0], [M16_8_REVIEW[1], M16_8_REVIEW[2], M16_8_REVIEW[3]]),
    speaking(
      "es-m16-8-rev-speak",
      M16_8_REVIEW[1],
      findEsAtomBySurface(M16_8_REVIEW[1])?.gloss ?? M16_8_REVIEW[1],
      [M16_8_REVIEW[1]],
    ),
  ],
};

export const ES_M16_LESSONS: LessonContent[] = [
  M16_1,
  M16_2,
  M16_3,
  M16_4,
  M16_5,
  M16_6,
  M16_7,
  M16_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M16_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m16",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m16",
          prompt: "'I am learning Spanish' — pick the Spanish.",
          correctText: "estoy aprendiendo español",
          distractorsText: [
            "estoy aprendiendo inglés",
            "estás aprendiendo español",
            "aprender español",
          ],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m16-1",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-m16-1",
          prompt: "Pick the yo form of hacer (to do / make).",
          correctText: "hago",
          distractorsText: ["haces", "hace", "hacemos"],
        }),
    },
    {
      id: "pt-es-m16-2",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-m16-2",
          prompt: "Complete with the right verb: Yo ___ la Ciudad de México.",
          correctText: "conozco",
          distractorsText: ["sé", "saber", "conocer"],
        }),
    },
    {
      id: "pt-es-m16-3",
      moduleId: "m16",
      build: () =>
        cloze(
          "pt-es-m16-3",
          "estoy",
          "con mi amiga",
          "hablando",
          ["hablando", "hablar", "hablo", "hablas"],
          "I am talking with my friend",
          "estoy hablando con mi amiga",
        ),
    },
    {
      id: "pt-es-m16-4",
      moduleId: "m16",
      build: () =>
        sentenceMcq({
          id: "pt-es-m16-4",
          prompt: "'The bathroom is to the right.' — El baño está a la ___.",
          correctText: "derecha",
          distractorsText: ["izquierda", "derecho", "esquina"],
        }),
    },
  ],
};
