/**
 * Spanish Module 11 — Vamos (ir, ir + a + infinitive, transport).
 *
 * The learner can already like, want, and order (M10). M11's job: the
 * wildly irregular ir (voy/vas/va/vamos/van), destinations with a + place
 * (and the al contraction from M7), the near future ir a + infinitive,
 * vamos a as "let's", and the vocabulary of getting around — transport,
 * places to go, and the time words to pin plans down.
 *
 * 2026-07-16 JA-parity rewrite: ir's forms are taught just-in-time (L1
 * teaches only voy/vas/va — the three it drills — instead of front-loading
 * all six); vamos/van are introduced in L5 where they're first used. Every
 * topic lesson now closes on a compounding review tail (reviewMatchPairs +
 * a review production/recognition item) drawing on m1-m10. selfExplain
 * lands in L1, L2, L3, and L5 (the near-future construction — why "voy a
 * comer" isn't literal motion). L6 (listening) gained real production
 * (build/translate/speaking) where it previously had zero. L7's adjacent
 * MCQ pair is fixed and it gained a review tail.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m11-1  Ir — voy, vas, va (JIT: each form taught as it's drilled)
 *   es-m11-2  A + place — playa, cine, museo, mercado (al contraction, selfExplain)
 *   es-m11-3  Getting around town — autobús, metro, taxi, a pie (selfExplain)
 *   es-m11-4  De viaje — tren, avión, boleto
 *   es-m11-5  The near future — voy a + infinitive, vamos & van (selfExplain)
 *   es-m11-6  Listening focus — ahora, después, esta noche, el finde (+ production)
 *   es-m11-7  Integration — making plans + speaking
 *   es-m11-8  M11 Mastery Test
 *
 * All listening here is sentence-level (M5+ ratchet). Nouns are taught
 * WITH their article on the card (el tren, la playa) while atom surfaces
 * stay bare (tren, playa) per the spine's gender rule.
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
import "./m10";

const COURSE_ID = "mock-1";

// ─── M11 atoms (exactly the spine allocation — UNCHANGED) ──────────────────

export const ES_M11_ATOMS: EsAtom[] = [
  // ir and its present forms
  atom({ surface: "ir", meaningEn: "to go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "voy", meaningEn: "I go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "vas", meaningEn: "you go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "va", meaningEn: "he/she goes", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "vamos", meaningEn: "we go / let's go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "van", meaningEn: "they go", partOfSpeech: "verb", fromModule: "m11", kind: "vocab" }),
  // Transport
  atom({ surface: "viaje", meaningEn: "trip", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🧳" }),
  atom({ surface: "autobús", meaningEn: "bus", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚌" }),
  atom({ surface: "tren", meaningEn: "train", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚆" }),
  atom({ surface: "avión", meaningEn: "airplane", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "✈️" }),
  atom({ surface: "metro", meaningEn: "subway", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚇" }),
  atom({ surface: "taxi", meaningEn: "taxi", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🚕" }),
  atom({ surface: "bicicleta", meaningEn: "bicycle", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f", emoji: "🚲" }),
  atom({ surface: "a pie", meaningEn: "on foot", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", emoji: "🚶" }),
  atom({ surface: "boleto", meaningEn: "ticket", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🎫" }),
  // Places to go
  atom({ surface: "playa", meaningEn: "beach", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f", emoji: "🏖️" }),
  atom({ surface: "cine", meaningEn: "movie theater", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🎬" }),
  atom({ surface: "museo", meaningEn: "museum", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🏛️" }),
  atom({ surface: "iglesia", meaningEn: "church", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f" }),
  atom({ surface: "mercado", meaningEn: "market", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🛒" }),
  atom({ surface: "centro", meaningEn: "downtown", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "🌆" }),
  atom({ surface: "trabajo", meaningEn: "work / job", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", emoji: "💼" }),
  atom({ surface: "fiesta", meaningEn: "party", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "f", emoji: "🎉" }),
  // Time words for plans
  atom({ surface: "este fin de semana", meaningEn: "this weekend", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", emoji: "📅" }),
  atom({ surface: "después", meaningEn: "after / later", partOfSpeech: "adverb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "ahora", meaningEn: "now", partOfSpeech: "adverb", fromModule: "m11", kind: "vocab" }),
  atom({ surface: "esta noche", meaningEn: "tonight", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", emoji: "🌃" }),
];

// Shared distractor pool for transport/place/time image MCQs. Every emoji
// here has verified Noto art in the bundled subset (src/pub/noto-emoji/svg)
// — checked at authoring time. iglesia has no viable glyph in the subset,
// so it never enters an image MCQ.
const AUTOBUS = { surface: "autobús", emoji: "🚌" };
const TREN = { surface: "tren", emoji: "🚆" };
const AVION = { surface: "avión", emoji: "✈️" };
const METRO = { surface: "metro", emoji: "🚇" };
const TAXI = { surface: "taxi", emoji: "🚕" };
const BICICLETA = { surface: "bicicleta", emoji: "🚲" };
const PLAYA = { surface: "playa", emoji: "🏖️" };
const CINE = { surface: "cine", emoji: "🎬" };
const MUSEO = { surface: "museo", emoji: "🏛️" };
const MERCADO = { surface: "mercado", emoji: "🛒" };
const VIAJE = { surface: "viaje", emoji: "🧳" };
const BOLETO = { surface: "boleto", emoji: "🎫" };
const TRABAJO = { surface: "trabajo", emoji: "💼" };
const FIESTA = { surface: "fiesta", emoji: "🎉" };
const CENTRO = { surface: "centro", emoji: "🌆" };
const ESTANOCHE = { surface: "esta noche", emoji: "🌃" };
const ESTEFINDE = { surface: "este fin de semana", emoji: "📅" };

// ─── es-m11-1 — Ir: voy, vas, va (just-in-time — no six-form front-load) ────

const M11_1: LessonContent = {
  id: "es-m11-1",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Ir — voy, vas, va",
  description: "The go-everywhere verb, one form at a time.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m11-1-info-ir",
      "ir — the go-everywhere verb",
      "ir means 'to go', and its yo form is voy: Voy a la escuela — 'I go to school.' Every destination needs a to follow — watch for al (a + el) as you go.",
      "grammar",
    ),
    sentenceMcq({
      id: "es-m11-1-q-voy",
      prompt: "'I'm going to the park' — pick it.",
      correctText: "Voy al parque.",
      distractorsText: ["Vas al parque.", "Va al parque.", "Van al parque."],
      exercisedAtomSurfaces: ["voy", "parque"],
    }),
    vocab("es-m11-1-p-vas", "you go", "vas"),
    build(
      "es-m11-1-build-vas",
      "Build: 'Where are you going?'",
      "¿A dónde vas?",
      ["¿A", "dónde", "vas?", "van?"],
      ["¿A", "dónde", "vas?"],
      ["vas"],
    ),
    listeningCompSentence({
      id: "es-m11-1-lc-vas",
      audioText: "¿A dónde vas?",
      correctMeaningEn: "Where are you going?",
      distractorsEn: ["Where is he going?", "Where are you from?", "Where were you?"],
      exercisedAtomSurfaces: ["vas"],
    }),
    vocab("es-m11-1-p-va", "he/she goes", "va"),
    sentenceMcq({
      id: "es-m11-1-q-va",
      prompt: "Ask about a friend: 'She goes to the museum.'",
      correctText: "Ella va al museo.",
      distractorsText: ["Ella vas al museo.", "Ellos va al museo.", "Ella voy al museo."],
      exercisedAtomSurfaces: ["va", "museo"],
    }),
    cloze(
      "es-m11-1-cloze-voy",
      "Yo",
      " a la tienda.",
      "voy",
      ["voy", "vas", "va", "van"],
      "I go to the store",
      "Yo voy a la tienda.",
    ),
    speaking("es-m11-1-speak-va", "Ella va a la playa.", "She's going to the beach.", ["va", "playa"]),
    cloze(
      "es-m11-1-cloze-vas",
      "Tú",
      " a la tienda.",
      "vas",
      ["vas", "va", "voy", "van"],
      "You go to the store",
      "Tú vas a la tienda.",
    ),
    vocabTextMcq("es-m11-1-tmcq-ir", "ir", ["ser", "estar", "tener"], "Which infinitive means 'to go'?"),
    translateStep({
      id: "es-m11-1-tr-escuela",
      promptEn: "I go to school",
      acceptedAnswers: ["voy a la escuela", "Voy a la escuela", "Voy a la escuela."],
      audioText: "voy a la escuela",
      exercisedAtomSurfaces: ["voy", "escuela"],
    }),
    listeningCompSentence({
      id: "es-m11-1-lc-va2",
      audioText: "Él va al parque",
      correctMeaningEn: "He goes to the park",
      distractorsEn: ["She goes to the park", "He is in the park", "He goes to school"],
      exercisedAtomSurfaces: ["va"],
    }),
    build(
      "es-m11-1-build-parque",
      "Build: 'She is going to the park.'",
      "Ella va al parque",
      ["Ella", "va", "al", "parque", "a"],
      ["Ella", "va", "al", "parque"],
      ["va", "parque"],
    ),
    listeningBuildSentence({
      id: "es-m11-1-lb-escuela",
      target: "Voy a la escuela",
      tiles: ["Voy", "a", "la", "escuela", "al"],
      correctOrder: ["Voy", "a", "la", "escuela"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["voy", "escuela"],
    }),
    sentenceMcq({
      id: "es-m11-1-q-banco",
      prompt: "'She's going to the bank' — pick it.",
      correctText: "Va al banco.",
      distractorsText: ["Vas al banco.", "Voy al banco.", "Van al banco."],
      exercisedAtomSurfaces: ["va", "banco"],
    }),
    selfExplain({
      id: "es-m11-1-self-explain",
      anchorLabel: "You picked: Va al banco.",
      anchorAudioText: "Va al banco.",
      question: "Why va and not vas here?",
      rule: { text: "va is for él/ella/usted — she takes va, not vas." },
      surface: { text: "va is used whenever the subject isn't named." },
      distractor: { text: "va is used because banco is masculine." },
      ruleExplanation:
        "ir agrees with its subject, not the noun that follows: yo → voy, tú → vas, él/ella/usted → va.",
    }),
    speaking("es-m11-1-speak-banco", "Va al banco.", "She's going to the bank.", ["va", "banco"]),
    infoStep(
      "es-m11-1-info-win",
      "You can say where you're going",
      "You've got voy, vas, and va down cold — and you know every trip needs a. That's enough to tell anyone where you're headed.",
      "win",
    ),
  ],
};

// ─── es-m11-2 — A + place ───────────────────────────────────────────────────

const M11_2: LessonContent = {
  id: "es-m11-2",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿A dónde? — playa, cine, museo",
  description: "Four places worth going, and the a that takes you there.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m11-2-info-aplace",
      "a + place",
      "Every destination rides behind a: Voy a la playa, Voy al cine (a + el = al). Ask ¿A dónde vas? — 'where are you going TO?' — and answer with any place you know.",
      "grammar",
    ),
    vocabMcq("es-m11-2-mcq-playa", { surface: "playa", meaningEn: "beach", emoji: "🏖️" }, [CINE, MUSEO, MERCADO]),
    build(
      "es-m11-2-build-playa",
      "Build: 'I'm going to the beach.'",
      "Voy a la playa",
      ["Voy", "a", "la", "playa", "al"],
      ["Voy", "a", "la", "playa"],
      ["voy", "playa"],
    ),
    sentenceMcq({
      id: "es-m11-2-q-cine",
      prompt: "Es sábado y quieres ver una película. ¿A dónde vas?",
      correctText: "Voy al cine.",
      distractorsText: ["Voy a la playa.", "Voy al museo.", "Voy al mercado."],
      explanation: "Masculine place, so a + el squeezes into al.",
      exercisedAtomSurfaces: ["voy", "cine"],
    }),
    vocabMcq("es-m11-2-mcq-museo", { surface: "museo", meaningEn: "museum", emoji: "🏛️" }, [PLAYA, CINE, MERCADO]),
    speaking("es-m11-2-speak-museo", "Voy al museo.", "I'm going to the museum.", ["voy", "museo"]),
    listeningCompSentence({
      id: "es-m11-2-lc-museo",
      audioText: "Ella va al museo",
      correctMeaningEn: "She goes to the museum",
      distractorsEn: ["She goes to the market", "He goes to the museum", "She is in the museum"],
      exercisedAtomSurfaces: ["va", "museo"],
    }),
    vocabMcq("es-m11-2-mcq-mercado", { surface: "mercado", meaningEn: "market", emoji: "🛒" }, [PLAYA, CINE, MUSEO]),
    build(
      "es-m11-2-build-cine2",
      "Build: 'She's going to the movies.'",
      "Ella va al cine",
      ["Ella", "va", "al", "cine", "a"],
      ["Ella", "va", "al", "cine"],
      ["va", "cine"],
    ),
    agreementCloze(
      "es-m11-2-ac-destinos",
      [
        { text: "Voy a " },
        { blank: { id: "b1", correctAnswer: "la", options: ["el", "la", "los", "las"] } },
        { text: " playa y ella va " },
        { blank: { id: "b2", correctAnswer: "al", options: ["al", "a la", "a el", "a los"] } },
        { text: " museo" },
      ],
      "I'm going to the beach and she is going to the museum",
      "Voy a la playa y ella va al museo",
      ["voy", "playa", "va", "museo"],
    ),
    sentenceMcq({
      id: "es-m11-2-q-mercado-ctx",
      prompt: "Tu amigo tiene hambre y quiere comprar fruta. ¿A dónde va?",
      correctText: "Va al mercado.",
      distractorsText: ["Va al cine.", "Va a la playa.", "Va al museo."],
      exercisedAtomSurfaces: ["va", "mercado"],
    }),
    listeningBuildSentence({
      id: "es-m11-2-lb-playa",
      target: "Voy a la playa",
      tiles: ["Voy", "a", "la", "playa", "al"],
      correctOrder: ["Voy", "a", "la", "playa"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["voy", "playa"],
    }),
    selfExplain({
      id: "es-m11-2-self-explain",
      anchorLabel: "You wrote: Voy al cine.",
      anchorAudioText: "Voy al cine.",
      question: "Why al and not a el?",
      rule: { text: "a + el always contracts to al — Spanish never writes the two words side by side." },
      surface: { text: "al is just a shorter, more casual way to say a el." },
      distractor: { text: "al is used only with masculine places whose name starts with a consonant." },
      ruleExplanation:
        "a + el contracts to al every single time — it isn't optional. a + la never contracts (a la playa stays two words).",
    }),
    translateStep({
      id: "es-m11-2-tr-mercado",
      promptEn: "I'm going to the market",
      acceptedAnswers: ["voy al mercado", "Voy al mercado", "Voy al mercado."],
      audioText: "voy al mercado",
      exercisedAtomSurfaces: ["voy", "mercado"],
    }),
    sentenceMcq({
      id: "es-m11-2-rev-q-amigo",
      prompt: "'My friend is going to the market.' — pick it.",
      correctText: "Mi amigo va al mercado.",
      distractorsText: ["Mi amigo va al cine.", "Mi amiga va al mercado.", "Mi amigo va a la playa."],
      exercisedAtomSurfaces: ["amigo", "va", "mercado"],
    }),
    speaking("es-m11-2-rev-speak", "Mi amigo va al museo.", "My friend goes to the museum.", ["amigo", "va", "museo"]),
    reviewMatchPairs("es-m11-2-rev", "es-m11-2-rev", "m11", 6),
    infoStep(
      "es-m11-2-info-win",
      "You can get anywhere",
      "You can now name a place and say you're headed there — voy, vas, va, al, a la. Every trip starts the same way.",
      "win",
    ),
  ],
};

// ─── es-m11-3 — Getting around town ─────────────────────────────────────────

const M11_3: LessonContent = {
  id: "es-m11-3",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En metro, a pie — around town",
  description: "How you get there: bus, subway, taxi, or your own two feet.",
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m11-3-info-en",
      "en + transport",
      "The vehicle rides behind en: en autobús, en metro, en taxi. The one exception walks: a pie — 'on foot'. Voy al banco en metro; voy al parque a pie.",
      "grammar",
    ),
    phrase(
      "es-m11-3-p-autobus",
      "bus",
      "el autobús",
      "From city micros to sleek long-distance coaches, buses are how Latin America moves.",
      { atomId: "es:autobús", emoji: "🚌" },
    ),
    vocabMcq("es-m11-3-mcq-autobus", { surface: "autobús", meaningEn: "bus", emoji: "🚌" }, [TAXI, TREN, AVION]),
    build(
      "es-m11-3-build-autobus-banco",
      "Build: 'She goes to the bank by bus.'",
      "Ella va al banco en autobús",
      ["Ella", "va", "al", "banco", "en", "autobús", "a"],
      ["Ella", "va", "al", "banco", "en", "autobús"],
      ["va", "banco", "autobús"],
    ),
    vocabMcq("es-m11-3-mcq-metro", { surface: "metro", meaningEn: "subway", emoji: "🚇" }, [AUTOBUS, BICICLETA, TREN]),
    speaking("es-m11-3-speak-metro", "Voy al banco en metro.", "I go to the bank by subway.", ["voy", "metro", "banco"]),
    vocabMcq("es-m11-3-mcq-taxi", { surface: "taxi", meaningEn: "taxi", emoji: "🚕" }, [AUTOBUS, TREN, BICICLETA]),
    sentenceMcq({
      id: "es-m11-3-q-taxi-ctx",
      prompt: "Ella está cansada y no quiere caminar. ¿Cómo va al hotel?",
      correctText: "Va en taxi.",
      distractorsText: ["Va en tren.", "Va a pie.", "Va en bicicleta."],
      exercisedAtomSurfaces: ["va", "taxi"],
    }),
    speaking("es-m11-3-speak-taxi", "Va en taxi.", "She goes by taxi.", ["va", "taxi"]),
    vocabMcq("es-m11-3-mcq-apie", { surface: "a pie", meaningEn: "on foot", emoji: "🚶" }, [TAXI, AUTOBUS, METRO]),
    build(
      "es-m11-3-build-apie",
      "Build: 'I go to the park on foot.'",
      "Voy al parque a pie",
      ["Voy", "al", "parque", "a", "pie", "en"],
      ["Voy", "al", "parque", "a", "pie"],
      ["voy", "parque", "a pie"],
    ),
    vocabMcq("es-m11-3-mcq-bicicleta", { surface: "bicicleta", meaningEn: "bicycle", emoji: "🚲" }, [TAXI, TREN, AUTOBUS]),
    build(
      "es-m11-3-build-bicicleta",
      "Build: 'He goes to school by bicycle.'",
      "Va a la escuela en bicicleta",
      ["Va", "a", "la", "escuela", "en", "bicicleta", "al"],
      ["Va", "a", "la", "escuela", "en", "bicicleta"],
      ["va", "escuela", "bicicleta"],
    ),
    sentenceMcq({
      id: "es-m11-3-q-en-vs-apie",
      prompt: "El museo está cerca. No necesitas el autobús. ¿Cómo vas?",
      correctText: "Voy a pie.",
      distractorsText: ["Voy en autobús.", "Voy en taxi.", "Voy en tren."],
      exercisedAtomSurfaces: ["voy", "a pie"],
    }),
    selfExplain({
      id: "es-m11-3-self-explain",
      anchorLabel: "You wrote: Voy a pie.",
      anchorAudioText: "Voy a pie.",
      question: "Why a pie instead of en pie?",
      rule: {
        text: "a pie is a fixed expression — Spanish never says en pie for 'on foot,' even though every other way to travel uses en (en autobús, en taxi).",
      },
      surface: { text: "en pie would also be understood, but a pie just sounds better." },
      distractor: { text: "a pie uses a because pie is masculine and masculine nouns take a instead of en." },
      ruleExplanation: "a pie is an idiom you memorize whole — it doesn't follow the en + vehicle pattern at all.",
    }),
    translateStep({
      id: "es-m11-3-tr-museo-autobus",
      promptEn: "I go to the museum by bus",
      acceptedAnswers: ["voy al museo en autobús", "Voy al museo en autobús", "Voy al museo en autobús."],
      audioText: "voy al museo en autobús",
      exercisedAtomSurfaces: ["voy", "museo", "autobús"],
    }),
    sentenceMcq({
      id: "es-m11-3-rev-q-grande",
      prompt: "'The bus is big.' — pick it.",
      correctText: "El autobús es grande.",
      distractorsText: ["El autobús es pequeño.", "El tren es grande.", "El taxi es grande."],
      exercisedAtomSurfaces: ["autobús", "grande"],
    }),
    speaking("es-m11-3-rev-speak", "El metro es grande.", "The subway is big.", ["metro", "grande"]),
    reviewMatchPairs("es-m11-3-rev", "es-m11-3-rev", "m11", 6),
    infoStep(
      "es-m11-3-info-win",
      "You can get around",
      "Bus, subway, taxi, bike, or your own two feet — you can now say exactly how you get anywhere in town.",
      "win",
    ),
  ],
};

// ─── es-m11-4 — De viaje: train, plane, ticket ──────────────────────────────

const M11_4: LessonContent = {
  id: "es-m11-4",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "De viaje — tren, avión, boleto",
  description: "Bigger trips need bigger machines — and a ticket.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m11-4-info-deviaje",
      "de + noun — what kind",
      "de links two nouns to say what kind: un boleto de tren (a train ticket), un boleto de avión (a plane ticket). Quiero + un boleto de ___ names any ticket you need.",
      "grammar",
    ),
    vocabMcq("es-m11-4-mcq-tren", { surface: "tren", meaningEn: "train", emoji: "🚆" }, [AVION, AUTOBUS, METRO]),
    build(
      "es-m11-4-build-tren-boleto",
      "Build: 'I want a train ticket.'",
      "Quiero un boleto de tren",
      ["Quiero", "un", "boleto", "de", "tren", "avión"],
      ["Quiero", "un", "boleto", "de", "tren"],
      ["quiero", "boleto", "tren"],
    ),
    vocabMcq("es-m11-4-mcq-avion", { surface: "avión", meaningEn: "airplane", emoji: "✈️" }, [TREN, TAXI, BICICLETA]),
    sentenceMcq({
      id: "es-m11-4-q-avion-ctx",
      prompt: "Vas de Nueva York a México y no quieres manejar cuarenta horas. ¿Cómo vas?",
      correctText: "Voy en avión.",
      distractorsText: ["Voy en tren.", "Voy en autobús.", "Voy a pie."],
      exercisedAtomSurfaces: ["voy", "avión"],
    }),
    speaking("es-m11-4-speak-avion", "Voy en avión.", "I go by plane.", ["voy", "avión"]),
    vocabMcq("es-m11-4-mcq-viaje", { surface: "viaje", meaningEn: "trip", emoji: "🧳" }, [TREN, AVION, BOLETO]),
    speaking("es-m11-4-speak-viaje", "Quiero un viaje a la playa.", "I want a trip to the beach.", ["quiero", "viaje", "playa"]),
    vocabMcq("es-m11-4-mcq-boleto", { surface: "boleto", meaningEn: "ticket", emoji: "🎫" }, [TREN, AVION, VIAJE]),
    build(
      "es-m11-4-build-boleto-avion",
      "Build: 'I want a plane ticket.'",
      "Quiero un boleto de avión",
      ["Quiero", "un", "boleto", "de", "avión", "tren"],
      ["Quiero", "un", "boleto", "de", "avión"],
      ["quiero", "boleto", "avión"],
    ),
    sentenceMcq({
      id: "es-m11-4-q-viaje-boleto",
      prompt: "'I need the ticket for the trip.' — pick it.",
      correctText: "Necesito el boleto para el viaje.",
      distractorsText: ["Necesito el viaje para el boleto.", "Necesito el boleto para el museo.", "Quiero el boleto para el viaje."],
      exercisedAtomSurfaces: ["necesitar", "boleto", "viaje"],
    }),
    listeningCompSentence({
      id: "es-m11-4-lc-avion-aeropuerto",
      audioText: "El avión llega al aeropuerto",
      correctMeaningEn: "The plane arrives at the airport",
      distractorsEn: ["The train arrives at the airport", "The plane leaves the airport", "The plane is at the airport"],
      exercisedAtomSurfaces: ["avión", "aeropuerto", "llegar"],
    }),
    translateStep({
      id: "es-m11-4-tr-playa-avion",
      promptEn: "I'm going to the beach by plane",
      acceptedAnswers: ["voy a la playa en avión", "Voy a la playa en avión", "Voy a la playa en avión."],
      audioText: "voy a la playa en avión",
      exercisedAtomSurfaces: ["voy", "playa", "avión"],
    }),
    build(
      "es-m11-4-build-tengo-boleto",
      "Build: 'I have a train ticket.'",
      "Tengo un boleto de tren",
      ["Tengo", "un", "boleto", "de", "tren", "avión"],
      ["Tengo", "un", "boleto", "de", "tren"],
      ["tengo", "boleto", "tren"],
    ),
    matchPairs("es-m11-4-review", ["autobús", "metro", "taxi", "tren", "avión", "boleto"]),
    sentenceMcq({
      id: "es-m11-4-rev-q-abuelo",
      prompt: "'My grandfather buys a ticket.' — pick it.",
      correctText: "Mi abuelo compra un boleto.",
      distractorsText: ["Mi abuelo compra una manzana.", "Mi abuela compra un boleto.", "Mi abuelo compra un viaje."],
      exercisedAtomSurfaces: ["abuelo", "comprar", "boleto"],
    }),
    speaking("es-m11-4-rev-speak", "Quiero una manzana.", "I want an apple.", ["quiero", "manzana"]),
    reviewMatchPairs("es-m11-4-rev", "es-m11-4-rev", "m11", 6),
    infoStep(
      "es-m11-4-info-win",
      "You're ready to travel",
      "Train, plane, ticket, trip — you can plan real travel now, not just trips around town.",
      "win",
    ),
  ],
};

// ─── es-m11-5 — The near future ─────────────────────────────────────────────

const M11_5: LessonContent = {
  id: "es-m11-5",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Voy a + infinitive — the near future",
  description: "Tomorrow without new endings: conjugate ir, add a, drop in a verb.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m11-5-info-nearfuture",
      "The near future: ir a + infinitive",
      "Conjugate ir, add a, then any infinitive: Voy a comer — I'm going to eat. The nosotros form doubles as 'let's': ¡Vamos a bailar! — let's dance! And ellos/ustedes use van: Van a trabajar.",
      "grammar",
    ),
    vocabMcq("es-m11-5-mcq-trabajo", { surface: "trabajo", meaningEn: "work / job", emoji: "💼" }, [FIESTA, CENTRO, VIAJE]),
    build(
      "es-m11-5-build-voy-trabajar",
      "Build: 'I'm going to work.'",
      "Voy a trabajar",
      ["Voy", "a", "trabajar", "trabajo", "al"],
      ["Voy", "a", "trabajar"],
      ["voy", "trabajar"],
    ),
    vocabMcq("es-m11-5-mcq-fiesta", { surface: "fiesta", meaningEn: "party", emoji: "🎉" }, [TRABAJO, CENTRO, VIAJE]),
    sentenceMcq({
      id: "es-m11-5-q-vamos-fiesta",
      prompt: "Suggest to your friends: 'Let's go to the party!'",
      correctText: "¡Vamos a la fiesta!",
      distractorsText: ["¡Van a la fiesta!", "¡Vas a la fiesta!", "¡Voy a la fiesta!"],
      exercisedAtomSurfaces: ["vamos", "fiesta"],
    }),
    build(
      "es-m11-5-build-vamos-bailar",
      "Build: 'Let's dance!'",
      "¡Vamos a bailar!",
      ["¡Vamos", "a", "bailar!", "Van", "al"],
      ["¡Vamos", "a", "bailar!"],
      ["vamos", "bailar"],
    ),
    vocabMcq("es-m11-5-mcq-centro", { surface: "centro", meaningEn: "downtown", emoji: "🌆" }, [PLAYA, MERCADO, MUSEO]),
    cloze(
      "es-m11-5-cloze-van",
      "ellos",
      "a bailar",
      "van",
      ["van", "va", "vamos", "voy"],
      "they are going to dance",
      "ellos van a bailar",
      "The ellos/ustedes form of ir.",
    ),
    speaking("es-m11-5-speak-vamos-playa", "Vamos a la playa.", "Let's go to the beach.", ["vamos", "playa"]),
    sentenceMcq({
      id: "es-m11-5-q-trabajo-ctx",
      prompt: "Es lunes por la mañana. ¿A dónde vas?",
      correctText: "Voy al trabajo.",
      distractorsText: ["Voy a la fiesta.", "Vas al trabajo.", "Voy del trabajo."],
      exercisedAtomSurfaces: ["voy", "trabajo"],
    }),
    listeningCompSentence({
      id: "es-m11-5-lc-vas-trabajar",
      audioText: "¿Vas a trabajar mañana?",
      correctMeaningEn: "Are you going to work tomorrow?",
      distractorsEn: ["Are you working now?", "Is she going to work tomorrow?", "Are you going to the party tomorrow?"],
      exercisedAtomSurfaces: ["vas", "trabajar", "mañana"],
    }),
    build(
      "es-m11-5-build-comer-mercado",
      "Build: 'I'm going to eat at the market.'",
      "Voy a comer en el mercado",
      ["Voy", "a", "comer", "en", "el", "mercado", "al"],
      ["Voy", "a", "comer", "en", "el", "mercado"],
      ["voy", "comer", "mercado"],
    ),
    translateStep({
      id: "es-m11-5-tr-estudiar-escuela",
      promptEn: "I'm going to study at school",
      acceptedAnswers: ["voy a estudiar en la escuela", "Voy a estudiar en la escuela", "Voy a estudiar en la escuela."],
      audioText: "voy a estudiar en la escuela",
      exercisedAtomSurfaces: ["voy", "estudiar", "escuela"],
    }),
    sentenceMcq({
      id: "es-m11-5-q-va-cocinar",
      prompt: "'She is going to cook' — pick it.",
      correctText: "Ella va a cocinar.",
      distractorsText: ["Ella va cocinar.", "Ella va a cocina.", "Ella vamos a cocinar."],
      exercisedAtomSurfaces: ["va", "cocinar"],
    }),
    selfExplain({
      id: "es-m11-5-self-explain",
      anchorLabel: "You wrote: Ella va a cocinar.",
      anchorAudioText: "Ella va a cocinar.",
      question: "Why does 'voy a comer' mean 'I'm going to eat' and not literally 'I go to eat'?",
      rule: {
        text: "ir a + infinitive is a fixed future construction — it describes what happens next, not a literal trip somewhere.",
      },
      surface: { text: "it's a literal translation: you are physically going somewhere in order to eat." },
      distractor: { text: "voy a + infinitive is only used when the action happens far from home." },
      ruleExplanation:
        "ir a + infinitive has grammaticalized into a near-future tense, just like English 'going to' — it needs no real movement: Estoy en casa y voy a dormir ('I'm home and I'm going to sleep') involves no trip at all.",
    }),
    speaking("es-m11-5-speak-vamos-comer", "Vamos a comer.", "Let's eat.", ["vamos", "comer"]),
    build(
      "es-m11-5-rev-build-recibir",
      "Build: 'I'm going to receive the lunch.'",
      "Voy a recibir el almuerzo",
      ["Voy", "a", "recibir", "el", "almuerzo", "recibo"],
      ["Voy", "a", "recibir", "el", "almuerzo"],
      ["voy", "recibir", "almuerzo"],
    ),
    sentenceMcq({
      id: "es-m11-5-rev-q-sopa",
      prompt: "'They are going to eat soup.' — pick it.",
      correctText: "Ellos van a comer sopa.",
      distractorsText: ["Ellos van a comer pan.", "Ellas van a comer sopa.", "Ellos va a comer sopa."],
      exercisedAtomSurfaces: ["ellos", "van", "comer", "sopa"],
    }),
    reviewMatchPairs("es-m11-5-rev", "es-m11-5-rev", "m11", 6),
    infoStep(
      "es-m11-5-info-win",
      "You can talk about tomorrow",
      "voy a, vamos a, van a — you can now say what's about to happen, not just what's true right now.",
      "win",
    ),
  ],
};

// ─── es-m11-6 — Listening focus: pinning plans down ─────────────────────────

const M11_6: LessonContent = {
  id: "es-m11-6",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — ahora, después, esta noche",
  description: "When is it happening? Train your ear on the time words — and say it back.",
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m11-6-info-tiempo",
      "Pin the plan down",
      "ahora (now), después (after/later), esta noche (tonight), este fin de semana (this weekend) usually close the sentence: Voy a comer ahora. Esta noche vamos al cine.",
      "grammar",
    ),
    vocabTextMcq("es-m11-6-tmcq-ahora", "ahora", ["después", "esta noche", "este fin de semana"]),
    listeningCompSentence({
      id: "es-m11-6-lc-ahora",
      audioText: "Voy al banco ahora",
      correctMeaningEn: "I'm going to the bank now",
      distractorsEn: ["I'm going to the bank later", "I'm going to the park now", "He goes to the bank now"],
      exercisedAtomSurfaces: ["voy", "ahora"],
    }),
    build(
      "es-m11-6-build-comer-ahora",
      "Build: 'I'm going to eat now.'",
      "Voy a comer ahora",
      ["Voy", "a", "comer", "ahora", "después"],
      ["Voy", "a", "comer", "ahora"],
      ["voy", "comer", "ahora"],
    ),
    vocabTextMcq("es-m11-6-tmcq-despues", "después", ["ahora", "esta noche", "este fin de semana"]),
    listeningBuildSentence({
      id: "es-m11-6-lb-despues",
      target: "Voy a comer después",
      tiles: ["Voy", "a", "comer", "después", "ahora"],
      correctOrder: ["Voy", "a", "comer", "después"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["después", "voy"],
    }),
    speaking("es-m11-6-speak-despues", "Voy a estudiar después.", "I'm going to study later.", ["voy", "estudiar", "después"]),
    vocabMcq("es-m11-6-mcq-estanoche", { surface: "esta noche", meaningEn: "tonight", emoji: "🌃" }, [ESTEFINDE, FIESTA, TRABAJO]),
    listeningCompSentence({
      id: "es-m11-6-lc-estanoche",
      audioText: "Esta noche vamos al cine",
      correctMeaningEn: "Tonight we're going to the movies",
      distractorsEn: ["Tonight they're going to the movies", "This weekend we're going to the movies", "Tonight we're going to the market"],
      exercisedAtomSurfaces: ["esta noche", "vamos"],
    }),
    build(
      "es-m11-6-build-fiesta-estanoche",
      "Build: 'Tonight we're going to the party.'",
      "Esta noche vamos a la fiesta",
      ["Esta", "noche", "vamos", "a", "la", "fiesta", "después"],
      ["Esta", "noche", "vamos", "a", "la", "fiesta"],
      ["esta noche", "vamos", "fiesta"],
    ),
    vocabMcq("es-m11-6-mcq-finde", { surface: "este fin de semana", meaningEn: "this weekend", emoji: "📅" }, [ESTANOCHE, FIESTA, TRABAJO]),
    listeningBuildSentence({
      id: "es-m11-6-lb-finde",
      target: "Voy a la playa este fin de semana",
      tiles: ["Voy", "a", "la", "playa", "este", "fin", "de", "semana"],
      correctOrder: ["Voy", "a", "la", "playa", "este", "fin", "de", "semana"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["este fin de semana", "playa"],
    }),
    listeningCompSentence({
      id: "es-m11-6-lc-autobus",
      audioText: "Ellos van en autobús al centro",
      correctMeaningEn: "They're going downtown by bus",
      distractorsEn: ["They're going downtown by train", "We're going downtown by bus", "They're going to the beach by bus"],
      exercisedAtomSurfaces: ["van", "autobús", "centro"],
    }),
    sentenceMcq({
      id: "es-m11-6-q-orden",
      prompt: "'We're going to the market after.' — pick it.",
      correctText: "Vamos al mercado después.",
      distractorsText: ["Vamos al mercado ahora.", "Van al mercado después.", "Vamos al mercado esta noche."],
      exercisedAtomSurfaces: ["vamos", "mercado", "después"],
    }),
    build(
      "es-m11-6-build-finde2",
      "Build: 'I'm going to rest this weekend.'",
      "Voy a descansar este fin de semana",
      ["Voy", "a", "descansar", "este", "fin", "de", "semana", "trabajar"],
      ["Voy", "a", "descansar", "este", "fin", "de", "semana"],
      ["voy", "descansar", "este fin de semana"],
    ),
    translateStep({
      id: "es-m11-6-tr-estanoche",
      promptEn: "We're going to the movies tonight",
      acceptedAnswers: ["vamos al cine esta noche", "Vamos al cine esta noche", "Vamos al cine esta noche."],
      audioText: "vamos al cine esta noche",
      exercisedAtomSurfaces: ["vamos", "cine", "esta noche"],
    }),
    sentenceMcq({
      id: "es-m11-6-rev-q-aeropuerto",
      prompt: "'We're going to the airport now.' — pick it.",
      correctText: "Vamos al aeropuerto ahora.",
      distractorsText: ["Vamos al aeropuerto después.", "Van al aeropuerto ahora.", "Vamos al museo ahora."],
      exercisedAtomSurfaces: ["vamos", "aeropuerto", "ahora"],
    }),
    speaking("es-m11-6-rev-speak", "Nunca voy al aeropuerto tarde.", "I never go to the airport late.", ["nunca", "voy", "aeropuerto"]),
    reviewMatchPairs("es-m11-6-rev", "es-m11-6-rev", "m11", 6),
    infoStep(
      "es-m11-6-info-win",
      "You can pin down when",
      "ahora, después, esta noche, este fin de semana — you can now say not just where you're going, but when.",
      "win",
    ),
  ],
};

// ─── es-m11-7 — Integration: making plans ───────────────────────────────────

const M11_7: LessonContent = {
  id: "es-m11-7",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Vamos? — making plans",
  description: "Put ir to work: ask, answer, and make a plan out loud.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m11-7-info-dialogo",
      "A plan on the corner",
      "—¡Hola! ¿A dónde vas?\n—Voy al mercado. ¿Y tú?\n—Voy a la iglesia (church).\n—¿Vamos al cine esta noche?\n—¡Sí! ¡Hasta luego!\nEvery move here is ir + a — where you're going, and what you're going to do.",
      "default",
    ),
    vocabTextMcq("es-m11-7-tmcq-iglesia", "iglesia", ["museo", "mercado", "cine"]),
    build(
      "es-m11-7-build-iglesia",
      "Build: 'She goes to church.'",
      "Ella va a la iglesia",
      ["Ella", "va", "a", "la", "iglesia", "al"],
      ["Ella", "va", "a", "la", "iglesia"],
      ["va", "iglesia"],
    ),
    sentenceMcq({
      id: "es-m11-7-q-reply",
      prompt: "A friend asks: '¿A dónde vas?' — pick a natural reply.",
      correctText: "Voy al centro.",
      distractorsText: ["Soy de México.", "Está en la mesa.", "Tengo diez años."],
      exercisedAtomSurfaces: ["voy", "centro"],
    }),
    speaking("es-m11-7-speak-vas", "¿A dónde vas?", "Where are you going?", ["vas"]),
    sentenceMcq({
      id: "es-m11-7-q-iglesia-ctx",
      prompt: "Es domingo por la mañana. ¿A dónde va tu familia?",
      correctText: "Va a la iglesia.",
      distractorsText: ["Va al cine.", "Va al mercado.", "Va a la playa."],
      exercisedAtomSurfaces: ["va", "iglesia"],
    }),
    build(
      "es-m11-7-build-ir",
      "Build: 'Are you going to go to the movies?'",
      "¿Vas a ir al cine?",
      ["¿Vas", "a", "ir", "al", "cine?"],
      ["¿Vas", "a", "ir", "al", "cine?"],
      ["vas", "ir", "cine"],
    ),
    translateStep({
      id: "es-m11-7-tr-fiesta",
      promptEn: "We're going to the party tonight",
      acceptedAnswers: ["vamos a la fiesta esta noche", "Vamos a la fiesta esta noche", "Vamos a la fiesta esta noche."],
      audioText: "vamos a la fiesta esta noche",
      exercisedAtomSurfaces: ["vamos", "fiesta", "esta noche"],
    }),
    sentenceMcq({
      id: "es-m11-7-q-finde",
      prompt: "Tus amigos quieren nadar. ¿A dónde van este fin de semana?",
      correctText: "Van a la playa.",
      distractorsText: ["Van al museo.", "Vamos a la playa.", "Van al mercado."],
      exercisedAtomSurfaces: ["van", "playa", "este fin de semana"],
    }),
    speaking("es-m11-7-speak-vamos-cine", "Vamos al cine esta noche.", "Let's go to the movies tonight.", ["vamos", "cine", "esta noche"]),
    translateStep({
      id: "es-m11-7-tr-playa",
      promptEn: "I'm going to the beach this weekend",
      acceptedAnswers: ["voy a la playa este fin de semana", "Voy a la playa este fin de semana", "Voy a la playa este fin de semana."],
      audioText: "voy a la playa este fin de semana",
      exercisedAtomSurfaces: ["voy", "playa", "este fin de semana"],
    }),
    dialogueListen({
      id: "es-m11-7-dl-planes",
      lines: [
        { speaker: "Luis", text: "¡Hola, Marta! ¿A dónde vas?" },
        { speaker: "Marta", text: "Voy al mercado. ¿Y tú?" },
        { speaker: "Luis", text: "Voy al cine. ¿Vamos a la playa este fin de semana?" },
        { speaker: "Marta", text: "¡Sí! Vamos en autobús." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where is Marta going now?",
          correctText: "To the market",
          distractors: ["To the movies", "To the beach", "To church"],
          explanation: "Marta answers: Voy al mercado.",
        },
        {
          id: "q2",
          prompt: "How will they get to the beach?",
          correctText: "By bus",
          distractors: ["By train", "By taxi", "On foot"],
          explanation: "Marta says: Vamos en autobús.",
        },
      ],
      exercisedAtomSurfaces: ["vas", "voy", "mercado", "cine", "vamos", "playa", "este fin de semana", "autobús"],
    }),
    build(
      "es-m11-7-build-autobus-centro",
      "Build: 'They're going downtown by bus.'",
      "Van al centro en autobús",
      ["Van", "al", "centro", "en", "autobús", "tren"],
      ["Van", "al", "centro", "en", "autobús"],
      ["van", "centro", "autobús"],
    ),
    speaking(
      "es-m11-7-speak-final",
      "¡Vamos a la fiesta esta noche!",
      "Let's go to the party tonight!",
      ["vamos", "fiesta", "esta noche"],
    ),
    sentenceMcq({
      id: "es-m11-7-rev-q-caminar",
      prompt: "'Let's walk to the park.' — pick it.",
      correctText: "Vamos a caminar al parque.",
      distractorsText: ["Vamos a caminar a la playa.", "Van a caminar al parque.", "Vamos a comer al parque."],
      exercisedAtomSurfaces: ["vamos", "caminar", "parque"],
    }),
    build(
      "es-m11-7-rev-build-lejos",
      "Build: 'The market is far.'",
      "El mercado está lejos",
      ["El", "mercado", "está", "lejos", "cerca"],
      ["El", "mercado", "está", "lejos"],
      ["mercado", "está", "lejos"],
    ),
    reviewMatchPairs("es-m11-7-rev", "es-m11-7-rev", "m11", 6),
    infoStep(
      "es-m11-7-info-win",
      "You can make real plans",
      "You can now ask where someone's going, answer with a plan of your own, and set a time for it. That's a real conversation.",
      "win",
    ),
  ],
};

// ─── es-m11-8 — Mastery test ────────────────────────────────────────────────

const M11_8: LessonContent = {
  id: "es-m11-8",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M11 Mastery Test",
  description: "Ir in every person, destinations, transport, and the near future.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "es-m11-8-q-vamos",
      prompt: "Which form of ir goes with nosotros?",
      correctText: "vamos",
      distractorsText: ["van", "voy", "va"],
      exercisedAtomSurfaces: ["vamos"],
    }),
    cloze(
      "es-m11-8-cloze-va",
      "ella",
      "al museo en metro",
      "va",
      ["va", "vas", "van", "voy"],
      "she goes to the museum by subway",
      "ella va al museo en metro",
    ),
    translateStep({
      id: "es-m11-8-tr-fiesta",
      promptEn: "I'm going to the party tonight",
      acceptedAnswers: ["voy a la fiesta esta noche", "Voy a la fiesta esta noche", "Voy a la fiesta esta noche."],
      audioText: "voy a la fiesta esta noche",
      exercisedAtomSurfaces: ["voy", "fiesta", "esta noche"],
    }),
    vocabMcq("es-m11-8-mcq-tren", { surface: "tren", meaningEn: "train", emoji: "🚆" }, [AVION, AUTOBUS, TAXI]),
    sentenceMcq({
      id: "es-m11-8-rev-q-calle",
      prompt: "'Where is the street?' — pick it.",
      correctText: "¿Dónde está la calle?",
      distractorsText: ["¿Dónde está el mercado?", "¿Dónde está la casa?", "¿Cuándo está la calle?"],
      exercisedAtomSurfaces: ["dónde", "está", "calle"],
    }),
    build(
      "es-m11-8-rev-build-desayuno",
      "Build: 'There is bread for breakfast.'",
      "Hay pan para el desayuno",
      ["Hay", "pan", "para", "el", "desayuno", "cena"],
      ["Hay", "pan", "para", "el", "desayuno"],
      ["hay", "desayuno"],
    ),
    sentenceMcq({
      id: "es-m11-8-q-nearfuture",
      prompt: "'She is going to cook' — pick it.",
      correctText: "Ella va a cocinar.",
      distractorsText: ["Ella va cocinar.", "Ella va a cocina.", "Ella vamos a cocinar."],
      exercisedAtomSurfaces: ["va", "cocinar"],
    }),
    listeningCompSentence({
      id: "es-m11-8-lc-centro",
      audioText: "Ellos van al centro en autobús",
      correctMeaningEn: "They go downtown by bus",
      distractorsEn: ["We go downtown by bus", "They go to the beach by bus", "They go downtown by train"],
      exercisedAtomSurfaces: ["van", "centro", "autobús"],
    }),
    listeningBuildSentence({
      id: "es-m11-8-lb-despues",
      target: "Voy a estudiar después",
      tiles: ["Voy", "a", "estudiar", "después", "ahora"],
      correctOrder: ["Voy", "a", "estudiar", "después"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["voy", "después"],
    }),
    sentenceMcq({
      id: "es-m11-8-q-boleto",
      prompt: "'I want a bus ticket' — pick it.",
      correctText: "Quiero un boleto de autobús.",
      distractorsText: ["Quiero un boleto de tren.", "Quiero una bicicleta de autobús.", "Quiero un viaje de taxi."],
      exercisedAtomSurfaces: ["quiero", "boleto", "autobús"],
    }),
    speaking(
      "es-m11-8-speak-ir",
      "¿Vas a ir al cine esta noche?",
      "Are you going to go to the movies tonight?",
      ["vas", "ir", "cine", "esta noche"],
    ),
    reviewMatchPairs("es-m11-8-rev", "es-m11-8-rev", "m11", 6),
  ],
};

export const ES_M11_LESSONS: LessonContent[] = [
  M11_1,
  M11_2,
  M11_3,
  M11_4,
  M11_5,
  M11_6,
  M11_7,
  M11_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M11_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m11",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m11",
          prompt: "'We are going to eat' — pick it.",
          correctText: "Vamos a comer.",
          distractorsText: ["Vamos comer.", "Vamos a comemos.", "Van a como."],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m11-1",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-m11-1",
          prompt: "Which form of ir goes with yo?",
          correctText: "voy",
          distractorsText: ["vas", "va", "van"],
        }),
    },
    {
      id: "pt-es-m11-2",
      moduleId: "m11",
      build: () =>
        cloze(
          "pt-es-m11-2",
          "ellos",
          "a bailar",
          "van",
          ["van", "va", "vamos", "vas"],
          "they are going to dance",
          "ellos van a bailar",
        ),
    },
    {
      id: "pt-es-m11-3",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-m11-3",
          prompt: "'I'm going to the movies' — pick it.",
          correctText: "Voy al cine.",
          distractorsText: ["Voy a el cine.", "Voy a la cine.", "Voy del cine."],
        }),
    },
    {
      id: "pt-es-m11-4",
      moduleId: "m11",
      build: () =>
        sentenceMcq({
          id: "pt-es-m11-4",
          prompt: "Suggest: 'Let's go to the beach!'",
          correctText: "¡Vamos a la playa!",
          distractorsText: ["¡Van a la playa!", "¡Voy a la playa!", "¡Vas a la playa!"],
        }),
    },
  ],
};
