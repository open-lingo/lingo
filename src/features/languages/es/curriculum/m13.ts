/**
 * Spanish Module 13 — Cambios de raíz (stem-changing verbs).
 *
 * The learner owns the regular present (m8–m9) and has met quiero (m10)
 * and cuesta (m12) as fixed forms. M13 names the pattern behind them:
 * boot verbs. e→ie (querer, pensar, preferir, empezar, entender, cerrar),
 * o→ue (poder, dormir, volver, almorzar), e→i (pedir, servir), and the
 * lone u→ue verb jugar — with nosotros always keeping the plain stem
 * (queremos, podemos, pedimos). Functions: preferences, abilities, and
 * polite requests (¿puedo...?, ¿puedes...?).
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m13-1  The boot — e→ie with querer, pensar, entender
 *   es-m13-2  Prefiero — preferir, empezar, cerrar, película
 *   es-m13-3  ¿Puedo? — poder, permission, dormir
 *   es-m13-4  Vuelvo tarde — volver, almorzar, temprano & tarde
 *   es-m13-5  Pido y sirvo — e→i, jugar, fútbol
 *   es-m13-6  Listening focus — boots by ear
 *   es-m13-7  Integration — making plans + speaking
 *   es-m13-8  M13 Mastery Test
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
import "./m12";

const COURSE_ID = "mock-1";

// ─── M13 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M13_ATOMS: EsAtom[] = [
  // e→ie
  atom({ surface: "preferir", meaningEn: "to prefer", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "pensar", meaningEn: "to think", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "empezar", meaningEn: "to begin", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "entender", meaningEn: "to understand", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "cerrar", meaningEn: "to close", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  // o→ue
  atom({ surface: "poder", meaningEn: "to be able to", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "puedo", meaningEn: "I can", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "puedes", meaningEn: "you can", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "dormir", meaningEn: "to sleep", partOfSpeech: "verb", fromModule: "m13", kind: "vocab", emoji: "😴" }),
  atom({ surface: "volver", meaningEn: "to return", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "almorzar", meaningEn: "to have lunch", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  // e→i
  atom({ surface: "pedir", meaningEn: "to ask for / order", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "servir", meaningEn: "to serve", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  // u→ue
  atom({ surface: "jugar", meaningEn: "to play (a game/sport)", partOfSpeech: "verb", fromModule: "m13", kind: "vocab" }),
  // Fun nouns (emoji verified against src/pub/noto-emoji/svg at authoring time)
  atom({ surface: "partido", meaningEn: "game / match", partOfSpeech: "noun", fromModule: "m13", kind: "vocab", gender: "m" }),
  atom({ surface: "fútbol", meaningEn: "soccer", partOfSpeech: "noun", fromModule: "m13", kind: "vocab", gender: "m", emoji: "⚽" }),
  atom({ surface: "deporte", meaningEn: "sport", partOfSpeech: "noun", fromModule: "m13", kind: "vocab", gender: "m" }),
  atom({ surface: "película", meaningEn: "movie", partOfSpeech: "noun", fromModule: "m13", kind: "vocab", gender: "f", emoji: "🎬" }),
  atom({ surface: "libro favorito", meaningEn: "favorite book", partOfSpeech: "phrase", fromModule: "m13", kind: "phrase" }),
  atom({ surface: "favorito", meaningEn: "favorite (m)", partOfSpeech: "adjective", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "idea", meaningEn: "idea", partOfSpeech: "noun", fromModule: "m13", kind: "vocab", gender: "f", emoji: "💡" }),
  // Time adverbs
  atom({ surface: "temprano", meaningEn: "early", partOfSpeech: "adverb", fromModule: "m13", kind: "vocab" }),
  atom({ surface: "tarde", meaningEn: "late / afternoon", partOfSpeech: "noun", fromModule: "m13", kind: "vocab", gender: "f" }),
  // Phrase
  atom({ surface: "¿puedo pasar?", meaningEn: "may I come in?", partOfSpeech: "phrase", fromModule: "m13", kind: "phrase" }),
];

// ─── es-m13-1 — The boot: e→ie ──────────────────────────────────────────────

const M13_1: LessonContent = {
  id: "es-m13-1",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "The boot — e→ie",
  description: "Quiero was never irregular — meet the stem-change pattern.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "es-m13-1-info-boot",
      "Verbs with a twist",
      "You already say quiero — that's querer with its stem e swelling to ie: quiero, quieres, quiere... but queremos. The nosotros form always keeps the plain stem. Verbs that work like this are called boot verbs (circle the changed forms in a conjugation table and you draw a boot). Pensar (to think) and entender (to understand) follow the same e→ie path: pienso, entiendo.",
      "grammar",
    ),
    vocab("es-m13-1-p-pensar", "to think", "pensar"),
    phrase("es-m13-1-p-idea", "the idea", "la idea", undefined, { atomId: "es:idea", emoji: "💡" }),
    sentenceMcq({
      id: "es-m13-1-q-pienso",
      prompt: "'I think it's a good idea.' — pick the Spanish:",
      correctText: "pienso que es una buena idea",
      distractorsText: [
        "penso que es una buena idea",
        "piensas que es una buena idea",
        "pienso que es una bueno idea",
      ],
      exercisedAtomSurfaces: ["pensar", "que"],
    }),
    sentenceMcq({
      id: "es-m13-1-q-idea",
      prompt: "'She has a good idea.' — pick the Spanish:",
      correctText: "ella tiene una buena idea",
      distractorsText: [
        "ella tiene un buena idea",
        "ella tienes una buena idea",
        "ellas tiene una buena idea",
      ],
      exercisedAtomSurfaces: ["idea"],
    }),
    sentenceMcq({
      id: "es-m13-1-q-entiendo",
      prompt: "'I understand the idea.' — pick the Spanish:",
      correctText: "entiendo la idea",
      distractorsText: ["entendo la idea", "entiendes la idea", "entiendo el idea"],
      exercisedAtomSurfaces: ["entender", "idea"],
    }),
    build(
      "es-m13-1-build-entender",
      "Build: 'I want to understand the idea.'",
      "quiero entender la idea",
      ["quiero", "entender", "la", "idea", "pensar"],
      ["quiero", "entender", "la", "idea"],
      ["entender", "idea"],
    ),
    speaking("es-m13-1-speak-pienso", "pienso que es una buena idea", "I think it's a good idea", ["pensar", "idea"]),
  ],
};

// ─── es-m13-2 — Prefiero: the e→ie crew ─────────────────────────────────────

const M13_2: LessonContent = {
  id: "es-m13-2",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Prefiero — preferir, empezar, cerrar",
  description: "More e→ie verbs, your favorite movie, and your favorite book.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m13-2-info-eie",
      "The e→ie crew",
      "Three more boot verbs, same twist: preferir → prefiero (I prefer), empezar → empieza (it begins), cerrar → cierro (I close). And remember the boot's sole: nosotros stays plain — preferimos, empezamos, cerramos.",
      "grammar",
    ),
    phrase("es-m13-2-p-pelicula", "the movie", "la película", undefined, { atomId: "es:película", emoji: "🎬" }),
    phrase("es-m13-2-p-librofav", "my favorite book", "mi libro favorito", undefined, { atomId: "es:libro favorito" }),
    sentenceMcq({
      id: "es-m13-2-q-prefiero",
      prompt: "'I prefer this movie.' — pick the Spanish:",
      correctText: "prefiero esta película",
      distractorsText: [
        "prefero esta película",
        "prefieres esta película",
        "prefiero esta películas",
      ],
      exercisedAtomSurfaces: ["preferir", "película", "esta"],
    }),
    sentenceMcq({
      id: "es-m13-2-q-librofav",
      prompt: "'This is my favorite book.' — pick the Spanish:",
      correctText: "este es mi libro favorito",
      distractorsText: [
        "esta es mi libro favorito",
        "este es mi libro favorita",
        "este es mi favorito libro",
      ],
      exercisedAtomSurfaces: ["libro favorito", "favorito", "este"],
    }),
    sentenceMcq({
      id: "es-m13-2-q-empieza",
      prompt: "'The movie starts at eight.' — pick the Spanish:",
      correctText: "la película empieza a las ocho",
      distractorsText: [
        "la película empeza a las ocho",
        "la película empiezas a las ocho",
        "las película empieza a las ocho",
      ],
      exercisedAtomSurfaces: ["empezar", "película"],
    }),
    build(
      "es-m13-2-build-cierro",
      "Build: 'I close the store at nine.'",
      "cierro la tienda a las nueve",
      ["cierro", "la", "tienda", "a", "las", "nueve", "cerrar"],
      ["cierro", "la", "tienda", "a", "las", "nueve"],
      ["cerrar"],
    ),
    sentenceMcq({
      id: "es-m13-2-q-prefieres",
      prompt: "'What do you prefer?' (tú) — pick the Spanish:",
      correctText: "¿qué prefieres?",
      distractorsText: ["¿qué preferes?", "¿qué prefiero?", "¿qué prefieren?"],
      exercisedAtomSurfaces: ["preferir"],
    }),
    agreementCloze(
      "es-m13-2-ac-favorito",
      [
        { text: "Mi libro favorit" },
        { blank: { id: "b1", correctAnswer: "o", options: ["o", "a", "os", "as"] } },
        { text: " es este y mi película favorit" },
        { blank: { id: "b2", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
        { text: " es esa" },
      ],
      "My favorite book is this one and my favorite movie is that one",
      "Mi libro favorito es este y mi película favorita es esa",
      ["favorito", "libro favorito", "película"],
    ),
    speaking("es-m13-2-speak-prefiero", "prefiero esta película", "I prefer this movie", ["preferir", "película"]),
  ],
};

// ─── es-m13-3 — ¿Puedo?: poder & permission ─────────────────────────────────

const M13_3: LessonContent = {
  id: "es-m13-3",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Puedo? — poder & permission",
  description: "O swells to ue: puedo, puedes — ask permission politely.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m13-3-info-oue",
      "The o→ue boot",
      "Same boot, different vowel: in poder (to be able to) the o swells to ue — puedo, puedes, puede... but podemos. Dormir (to sleep) matches: duermo, duermes, dormimos. ¿Puedo...? asks permission ('may I...?') and ¿puedes...? makes a friendly request ('can you...?').",
      "grammar",
    ),
    phrase("es-m13-3-p-puedopasar", "may I come in?", "¿puedo pasar?"),
    phrase("es-m13-3-p-dormir", "to sleep", "dormir", undefined, { emoji: "😴" }),
    sentenceMcq({
      id: "es-m13-3-q-pasar",
      prompt: "You're at a friend's door. Ask permission to come in:",
      correctText: "¿puedo pasar?",
      distractorsText: ["¿puedes pasar?", "¿puedo pasas?", "¿pasar puedo yo?"],
      exercisedAtomSurfaces: ["¿puedo pasar?", "puedo"],
    }),
    sentenceMcq({
      id: "es-m13-3-q-dormir",
      prompt: "'I can't sleep.' — pick the Spanish:",
      correctText: "no puedo dormir",
      distractorsText: ["no puedo duermo", "no puedes dormir", "no podo dormir"],
      exercisedAtomSurfaces: ["puedo", "dormir"],
    }),
    cloze(
      "es-m13-3-cloze-puedes",
      "¿",
      "cerrar la puerta?",
      "puedes",
      ["puedes", "puedo", "pueden", "podemos"],
      "can you close the door?",
      "¿puedes cerrar la puerta?",
      "A friendly request aimed at the other person — second person singular.",
    ),
    sentenceMcq({
      id: "es-m13-3-q-empezar",
      prompt: "'May I start tomorrow?' — pick the Spanish:",
      correctText: "¿puedo empezar mañana?",
      distractorsText: [
        "¿puedes empezar mañana?",
        "¿puedo empiezo mañana?",
        "¿podemos empezar mañana?",
      ],
      exercisedAtomSurfaces: ["puedo", "empezar"],
    }),
    build(
      "es-m13-3-build-duermes",
      "Build: 'You can sleep at my house.'",
      "puedes dormir en mi casa",
      ["puedes", "dormir", "en", "mi", "casa", "poder"],
      ["puedes", "dormir", "en", "mi", "casa"],
      ["puedes", "dormir"],
    ),
    speaking("es-m13-3-speak-pasar", "¿puedo pasar?", "may I come in?", ["¿puedo pasar?"]),
  ],
};

// ─── es-m13-4 — Vuelvo tarde: more o→ue ─────────────────────────────────────

const M13_4: LessonContent = {
  id: "es-m13-4",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Vuelvo tarde — volver & almorzar",
  description: "Coming back, having lunch — early or late.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m13-4-info-volver",
      "Two more o→ue boots",
      "Volver (to return) gives vuelvo, vuelves, vuelve — volvemos. Almorzar (to have lunch) gives almuerzo, almuerzas — almorzamos. Pair them with temprano (early) and tarde (late); as a noun, la tarde is the afternoon you already greet with buenas tardes.",
      "grammar",
    ),
    vocab("es-m13-4-p-volver", "to return", "volver"),
    vocab("es-m13-4-p-temprano", "early", "temprano"),
    sentenceMcq({
      id: "es-m13-4-q-vuelvo",
      prompt: "'I return home early.' — pick the Spanish:",
      correctText: "vuelvo a casa temprano",
      distractorsText: [
        "volvo a casa temprano",
        "vuelves a casa temprano",
        "vuelvo a casa temprana",
      ],
      exercisedAtomSurfaces: ["volver"],
    }),
    sentenceMcq({
      id: "es-m13-4-q-almorzamos",
      prompt: "'We have lunch early.' — pick the Spanish:",
      correctText: "almorzamos temprano",
      distractorsText: ["almuerzamos temprano", "almorzamos temprana", "almuerzo temprano"],
      exercisedAtomSurfaces: ["almorzar", "temprano"],
    }),
    phrase("es-m13-4-p-tarde", "the afternoon", "la tarde", undefined, { atomId: "es:tarde" }),
    sentenceMcq({
      id: "es-m13-4-q-almuerzo",
      prompt: "'I have lunch at one in the afternoon.' — pick the Spanish:",
      correctText: "almuerzo a la una de la tarde",
      distractorsText: [
        "almorzo a la una de la tarde",
        "almuerzas a la una de la tarde",
        "almuerzo a las una de la tarde",
      ],
      exercisedAtomSurfaces: ["almorzar"],
    }),
    build(
      "es-m13-4-build-tarde",
      "Build: 'Tonight I'm going to sleep late.'",
      "esta noche voy a dormir tarde",
      ["esta", "noche", "voy", "a", "dormir", "tarde", "temprano"],
      ["esta", "noche", "voy", "a", "dormir", "tarde"],
      ["dormir", "tarde"],
    ),
    sentenceMcq({
      id: "es-m13-4-q-volvemos",
      prompt: "'We return late.' — pick the Spanish:",
      correctText: "volvemos tarde",
      distractorsText: ["vuelvemos tarde", "volvemos tardes", "vuelven tarde"],
      exercisedAtomSurfaces: ["volver", "tarde"],
    }),
    // temprano has no emoji (abstract time word) — text-front MCQ instead.
    vocabTextMcq("es-m13-4-tmcq-temprano", "temprano", ["tarde", "después", "ahora"]),
  ],
};

// ─── es-m13-5 — Pido y sirvo: e→i + jugar ───────────────────────────────────

const M13_5: LessonContent = {
  id: "es-m13-5",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Pido y sirvo — e→i, jugar, fútbol",
  description: "Order food, serve it, and play the beautiful game.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m13-5-info-ei",
      "The e→i squeeze — and jugar",
      "In pedir (to ask for / order) and servir (to serve) the e squeezes down to i: pido, pides — pedimos; sirvo, sirve, sirven — servimos. One verb boots with u: jugar (to play) gives juego, juegas — jugamos.",
      "grammar",
    ),
    phrase(
      "es-m13-5-p-futbol",
      "soccer",
      "el fútbol",
      "Across Latin America fútbol is the shared heartbeat — a neighborhood partido can stop a whole street on Sunday afternoon.",
      { atomId: "es:fútbol", emoji: "⚽" },
    ),
    vocab("es-m13-5-p-pedir", "to ask for / order", "pedir"),
    sentenceMcq({
      id: "es-m13-5-q-juego",
      prompt: "'I play soccer with my friends.' — pick the Spanish:",
      correctText: "juego fútbol con mis amigos",
      distractorsText: [
        "jugo fútbol con mis amigos",
        "juegas fútbol con mis amigos",
        "juego fútbol con mi amigos",
      ],
      exercisedAtomSurfaces: ["jugar", "fútbol"],
    }),
    sentenceMcq({
      id: "es-m13-5-q-pido",
      prompt: "'I always order the soup.' — pick the Spanish:",
      correctText: "siempre pido la sopa",
      distractorsText: ["siempre pido el sopa", "siempre pides la sopa", "siempre pido la sopas"],
      exercisedAtomSurfaces: ["pedir"],
    }),
    phrase("es-m13-5-p-partido", "the game / match", "el partido", undefined, { atomId: "es:partido" }),
    build(
      "es-m13-5-build-cafe",
      "Build: 'I'm going to order a coffee.'",
      "voy a pedir un café",
      ["voy", "a", "pedir", "un", "café", "servir"],
      ["voy", "a", "pedir", "un", "café"],
      ["pedir"],
    ),
    sentenceMcq({
      id: "es-m13-5-q-partido",
      prompt: "'The game starts at seven.' — pick the Spanish:",
      correctText: "el partido empieza a las siete",
      distractorsText: [
        "el partido empeza a las siete",
        "la partido empieza a las siete",
        "el partido empiezan a las siete",
      ],
      exercisedAtomSurfaces: ["partido", "empezar"],
    }),
    sentenceMcq({
      id: "es-m13-5-q-sirven",
      prompt: "'They serve breakfast at eight.' — pick the Spanish:",
      correctText: "sirven el desayuno a las ocho",
      distractorsText: [
        "sirve el desayuno a las ocho",
        "sirven el desayuno a los ocho",
        "servin el desayuno a las ocho",
      ],
      exercisedAtomSurfaces: ["servir"],
    }),
    // pedir has no emoji (abstract verb) — text-front MCQ instead.
    vocabTextMcq("es-m13-5-tmcq-pedir", "pedir", ["servir", "pensar", "jugar"]),
    // Review grid over the module's boot-verb infinitives (L2–L5).
    matchPairs("es-m13-5-review", [
      "preferir",
      "empezar",
      "cerrar",
      "dormir",
      "volver",
      "almorzar",
      "pedir",
      "jugar",
    ]),
  ],
};

// ─── es-m13-6 — Listening focus ─────────────────────────────────────────────

const M13_6: LessonContent = {
  id: "es-m13-6",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — boots by ear",
  description: "Hear the stem change land in full sentences.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "es-m13-6-lc-dormir",
      audioText: "no puedo dormir",
      correctMeaningEn: "I can't sleep.",
      distractorsEn: ["I don't want to sleep.", "You can't sleep.", "I can't start."],
      exercisedAtomSurfaces: ["puedo", "dormir"],
    }),
    listeningBuildSentence({
      id: "es-m13-6-lb-empieza",
      target: "la película empieza a las ocho",
      tiles: ["la", "película", "empieza", "a", "las", "ocho", "siete"],
      correctOrder: ["la", "película", "empieza", "a", "las", "ocho"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["película", "empezar"],
    }),
    listeningCompSentence({
      id: "es-m13-6-lc-cerrar",
      audioText: "¿puedes cerrar la ventana?",
      correctMeaningEn: "Can you close the window?",
      distractorsEn: [
        "Can you open the window?",
        "May I close the window?",
        "Can you close the door?",
      ],
      exercisedAtomSurfaces: ["puedes", "cerrar"],
    }),
    listeningBuildSentence({
      id: "es-m13-6-lb-jugar",
      target: "voy a jugar fútbol esta noche",
      tiles: ["voy", "a", "jugar", "fútbol", "esta", "noche", "juego"],
      correctOrder: ["voy", "a", "jugar", "fútbol", "esta", "noche"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["jugar", "fútbol"],
    }),
    listeningCompSentence({
      id: "es-m13-6-lc-deporte",
      audioText: "mi deporte favorito es el fútbol",
      correctMeaningEn: "My favorite sport is soccer.",
      distractorsEn: [
        "My favorite movie is about soccer.",
        "My favorite game is tomorrow.",
        "I play soccer with my friends.",
      ],
      exercisedAtomSurfaces: ["deporte", "favorito", "fútbol"],
    }),
    listeningBuildSentence({
      id: "es-m13-6-lb-vuelvo",
      target: "vuelvo a casa temprano",
      tiles: ["vuelvo", "a", "casa", "temprano", "tarde"],
      correctOrder: ["vuelvo", "a", "casa", "temprano"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["volver", "temprano"],
    }),
    listeningCompSentence({
      id: "es-m13-6-lc-pido",
      audioText: "siempre pido la sopa",
      correctMeaningEn: "I always order the soup.",
      distractorsEn: [
        "I always serve the soup.",
        "I never order the soup.",
        "I always order the salad.",
      ],
      exercisedAtomSurfaces: ["pedir"],
    }),
    listeningBuildSentence({
      id: "es-m13-6-lb-almorzar",
      target: "queremos almorzar aquí",
      tiles: ["queremos", "almorzar", "aquí", "almuerzo"],
      correctOrder: ["queremos", "almorzar", "aquí"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["almorzar"],
    }),
  ],
};

// ─── es-m13-7 — Integration dialogue ────────────────────────────────────────

const M13_7: LessonContent = {
  id: "es-m13-7",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Un plan para hoy — making plans",
  description: "Put the boots together: invite, decline, prefer, promise to return.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m13-7-info-dialogo",
      "A knock at the door",
      "—¿Puedo pasar?\n—¡Sí! ¿Quieres almorzar con nosotros?\n—No puedo. Juego un partido de fútbol a la una.\n—¿A qué hora vuelves?\n—Vuelvo a las tres.\n—Bien. ¡Hasta luego!\nEvery boot verb lands in its spoken form — read the dialogue out loud.",
      "default",
    ),
    sentenceMcq({
      id: "es-m13-7-q-invitar",
      prompt: "Invite your friend: 'Do you want to have lunch with us?'",
      correctText: "¿quieres almorzar con nosotros?",
      distractorsText: [
        "¿quieres almorzamos con nosotros?",
        "¿quiero almorzar con nosotros?",
        "¿quieres almuerza con nosotros?",
      ],
      exercisedAtomSurfaces: ["almorzar"],
    }),
    sentenceMcq({
      id: "es-m13-7-q-declinar",
      prompt: "Decline: 'I can't. I play a game at one.'",
      correctText: "no puedo, juego un partido a la una",
      distractorsText: [
        "no puedo, jugo un partido a la una",
        "no puedes, juego un partido a la una",
        "no puedo, juegas un partido a la una",
      ],
      exercisedAtomSurfaces: ["puedo", "jugar", "partido"],
    }),
    build(
      "es-m13-7-build-prefiero",
      "Build: 'I prefer to go to the movies.'",
      "prefiero ir al cine",
      ["prefiero", "ir", "al", "cine", "preferir"],
      ["prefiero", "ir", "al", "cine"],
      ["preferir"],
    ),
    translateStep({
      id: "es-m13-7-tr-dormir",
      promptEn: "I can't sleep.",
      acceptedAnswers: [
        "no puedo dormir",
        "No puedo dormir",
        "no puedo dormir.",
        "No puedo dormir.",
      ],
      audioText: "no puedo dormir",
      exercisedAtomSurfaces: ["puedo", "dormir"],
    }),
    cloze(
      "es-m13-7-cloze-pienso",
      "yo",
      "que es una buena idea",
      "pienso",
      ["pienso", "penso", "piensas", "pensamos"],
      "I think it's a good idea",
      "yo pienso que es una buena idea",
      "First person — and the stem e swells inside the boot.",
    ),
    speaking("es-m13-7-speak-pasar", "¿puedo pasar?", "may I come in?", ["¿puedo pasar?"]),
    translateStep({
      id: "es-m13-7-tr-vuelvo",
      promptEn: "I return home early.",
      acceptedAnswers: [
        "vuelvo a casa temprano",
        "Vuelvo a casa temprano",
        "vuelvo a casa temprano.",
        "Vuelvo a casa temprano.",
      ],
      audioText: "vuelvo a casa temprano",
      exercisedAtomSurfaces: ["volver", "temprano"],
    }),
    dialogueListen({
      id: "es-m13-7-dl-plan",
      lines: [
        { speaker: "Diego", text: "¿Quieres almorzar con nosotros?" },
        { speaker: "Rosa", text: "No puedo. Juego un partido de fútbol a la una." },
        { speaker: "Diego", text: "¿A qué hora vuelves?" },
        { speaker: "Rosa", text: "Vuelvo a las tres." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Why can't Rosa have lunch with them?",
          correctText: "She plays a soccer game at one",
          distractors: ["She works at one", "She returns home at one", "She prefers to eat at home"],
          explanation: "Rosa says: Juego un partido de fútbol a la una.",
        },
        {
          id: "q2",
          prompt: "When does Rosa return?",
          correctText: "At three",
          distractors: ["At one", "Tonight", "Tomorrow"],
          explanation: "Rosa answers: Vuelvo a las tres.",
        },
      ],
      exercisedAtomSurfaces: ["almorzar", "puedo", "jugar", "partido", "fútbol", "volver"],
    }),
    speaking("es-m13-7-speak-prefiero", "prefiero ir al cine", "I prefer to go to the movies", ["preferir"]),
  ],
};

// ─── es-m13-8 — Mastery test ────────────────────────────────────────────────

const M13_8: LessonContent = {
  id: "es-m13-8",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M13 Mastery Test",
  description: "e→ie, o→ue, e→i, jugar — and the nosotros escape hatch.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m13-8-q-queremos",
      prompt: "'I want' is quiero. 'We want' is:",
      correctText: "queremos",
      distractorsText: ["quieremos", "quieren", "quiere"],
    }),
    sentenceMcq({
      id: "es-m13-8-q-prefieres",
      prompt: "'Do you prefer this movie or that one?' — pick the Spanish:",
      correctText: "¿prefieres esta película o esa?",
      distractorsText: [
        "¿preferes esta película o esa?",
        "¿prefiero esta película o esa?",
        "¿prefieres este película o esa?",
      ],
      exercisedAtomSurfaces: ["preferir", "película", "esta", "esa"],
    }),
    cloze(
      "es-m13-8-cloze-puedo",
      "no",
      "dormir",
      "puedo",
      ["puedo", "puedes", "podemos", "pueden"],
      "I can't sleep",
      "no puedo dormir",
    ),
    listeningCompSentence({
      id: "es-m13-8-lc-partido",
      audioText: "el partido empieza temprano",
      correctMeaningEn: "The game starts early.",
      distractorsEn: [
        "The game starts late.",
        "The movie starts early.",
        "The game ends early.",
      ],
      exercisedAtomSurfaces: ["partido", "empezar", "temprano"],
    }),
    translateStep({
      id: "es-m13-8-tr-pasar",
      promptEn: "May I come in?",
      acceptedAnswers: [
        "¿puedo pasar?",
        "¿Puedo pasar?",
        "puedo pasar",
        "Puedo pasar",
        "puedo pasar?",
        "Puedo pasar?",
      ],
      audioText: "¿puedo pasar?",
      exercisedAtomSurfaces: ["¿puedo pasar?"],
    }),
    sentenceMcq({
      id: "es-m13-8-q-pide",
      prompt: "'She always orders the salad.' — pick the Spanish:",
      correctText: "ella siempre pide la ensalada",
      distractorsText: [
        "ella siempre pido la ensalada",
        "ella siempre pides la ensalada",
        "ellas siempre pide la ensalada",
      ],
      exercisedAtomSurfaces: ["pedir"],
    }),
    listeningBuildSentence({
      id: "es-m13-8-lb-tarde",
      target: "vuelvo a casa tarde",
      tiles: ["vuelvo", "a", "casa", "tarde", "temprano"],
      correctOrder: ["vuelvo", "a", "casa", "tarde"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["volver", "tarde"],
    }),
    sentenceMcq({
      id: "es-m13-8-q-deporte",
      prompt: "'What's your favorite sport?' — pick the Spanish:",
      correctText: "¿cuál es tu deporte favorito?",
      distractorsText: [
        "¿cuál es tu deporte favorita?",
        "¿cuál es tu favorito deporte?",
        "¿cuál es tus deporte favorito?",
      ],
      exercisedAtomSurfaces: ["deporte", "favorito"],
    }),
    speaking("es-m13-8-speak-juego", "juego fútbol con mis amigos", "I play soccer with my friends", ["jugar", "fútbol"]),
  ],
};

export const ES_M13_LESSONS: LessonContent[] = [
  M13_1,
  M13_2,
  M13_3,
  M13_4,
  M13_5,
  M13_6,
  M13_7,
  M13_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M13_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m13",
      moduleId: "m13",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m13",
          prompt: "'I can' — which is correct?",
          correctText: "puedo",
          distractorsText: ["podo", "puede", "podemos"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m13-1",
      moduleId: "m13",
      build: () =>
        sentenceMcq({
          id: "pt-es-m13-1",
          prompt: "'I prefer this movie.' — which is correct?",
          correctText: "prefiero esta película",
          distractorsText: [
            "prefero esta película",
            "prefieres esta película",
            "preferimos esta película",
          ],
        }),
    },
    {
      id: "pt-es-m13-2",
      moduleId: "m13",
      build: () =>
        cloze(
          "pt-es-m13-2",
          "no",
          "dormir",
          "puedo",
          ["puedo", "puedes", "podemos", "pueden"],
          "I can't sleep",
          "no puedo dormir",
        ),
    },
    {
      id: "pt-es-m13-3",
      moduleId: "m13",
      build: () =>
        sentenceMcq({
          id: "pt-es-m13-3",
          prompt: "'We return' — nosotros keeps the plain stem. Which is correct?",
          correctText: "volvemos",
          distractorsText: ["vuelvemos", "vuelven", "vuelve"],
        }),
    },
    {
      id: "pt-es-m13-4",
      moduleId: "m13",
      build: () =>
        sentenceMcq({
          id: "pt-es-m13-4",
          prompt: "'She orders the soup.' — which is correct?",
          correctText: "ella pide la sopa",
          distractorsText: ["ella pede la sopa", "ella pides la sopa", "ella pido la sopa"],
        }),
    },
  ],
};
