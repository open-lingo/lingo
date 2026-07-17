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
 * 2026-07-16 rewrite to the JA depth standard (docs/es-rewrite-brief-
 * 2026-07-16.md): every topic lesson now runs 18-22 retrieval-heavy steps,
 * forces typed/spoken production of the stem-change (not just recognition),
 * lands a selfExplain on the nosotros escape hatch in every grammar lesson
 * (this module's textbook case — the sole/boot metaphor is preserved), and
 * appends a compounding review tail (L2+) pulling m1-m12 vocabulary
 * (café, té, playa, cine, agua, pescado, desayuno, música...) into fresh
 * preference/ability sentences. L6 (listening) previously shipped zero
 * production — fixed. ES_M13_ATOMS is untouched.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m13-1  The boot — e→ie with pensar, entender (+ nosotros selfExplain)
 *   es-m13-2  Prefiero — preferir, empezar, cerrar, película
 *   es-m13-3  ¿Puedo? — poder, permission, dormir
 *   es-m13-4  Vuelvo tarde — volver, almorzar, temprano & tarde
 *   es-m13-5  Pido y sirvo — e→i, jugar, fútbol
 *   es-m13-6  Listening focus — boots by ear (now with production + review)
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

// Shared image-MCQ distractor pool — the module's own emoji-bearing atoms,
// reused across lessons as spaced review decoys (safe: vocabMcq filters out
// whichever one is the current target).
const IDEA = { surface: "idea", emoji: "💡" };
const DORMIR = { surface: "dormir", emoji: "😴" };
const FUTBOL = { surface: "fútbol", emoji: "⚽" };
const PELICULA = { surface: "película", emoji: "🎬" };

// ─── es-m13-1 — The boot: e→ie ──────────────────────────────────────────────

const M13_1: LessonContent = {
  id: "es-m13-1",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "The boot — e→ie",
  description: "Quiero was never irregular — meet the stem-change pattern.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m13-1-info-boot",
      "Verbs with a twist",
      "You already say quiero — that's querer with its stem e swelling to ie: quiero, quieres, quiere... but queremos. The nosotros form always keeps the plain stem. Pensar (to think) and entender (to understand) follow the same e→ie path: pienso, entiendo — but pensamos, entendemos. Circle the changed forms in a conjugation table and you draw a boot; nosotros sits on the sole, untouched.",
      "grammar",
    ),
    vocab("es-m13-1-p-pensar", "to think", "pensar"),
    vocabMcq("es-m13-1-mcq-idea", { surface: "idea", meaningEn: "idea", emoji: "💡" }, [DORMIR, FUTBOL, PELICULA]),
    sentenceMcq({
      id: "es-m13-1-q-pienso",
      prompt: "'I think it's a good idea.' — pick the Spanish:",
      correctText: "pienso que es una buena idea",
      distractorsText: [
        "penso que es una buena idea",
        "piensas que es una buena idea",
        "pienso que es una bueno idea",
      ],
      exercisedAtomSurfaces: ["pensar", "idea"],
    }),
    build(
      "es-m13-1-build-entender",
      "Build: 'I want to understand the idea.'",
      "quiero entender la idea",
      ["quiero", "entender", "la", "idea", "pensar"],
      ["quiero", "entender", "la", "idea"],
      ["entender", "idea"],
    ),
    cloze(
      "es-m13-1-cloze-piensas",
      "¿Qué ",
      " de la idea?",
      "piensas",
      ["piensas", "pienso", "pensamos", "piensan"],
      "what do you think of the idea?",
      "¿Qué piensas de la idea?",
      "Second person singular — tú swells the stem too.",
      ["pensar", "idea"],
    ),
    sentenceMcq({
      id: "es-m13-1-q-entiendo",
      prompt: "'I understand the idea.' — pick the Spanish:",
      correctText: "entiendo la idea",
      distractorsText: ["entendo la idea", "entiendes la idea", "entiendo el idea"],
      exercisedAtomSurfaces: ["entender", "idea"],
    }),
    build(
      "es-m13-1-build-entendemos",
      "Build: 'We understand the idea.'",
      "entendemos la idea",
      ["entendemos", "la", "idea", "entiende"],
      ["entendemos", "la", "idea"],
      ["entender", "idea"],
    ),
    vocabTextMcq("es-m13-1-tmcq-entender", "entender", ["pensar", "poder", "dormir"]),
    listeningCompSentence({
      id: "es-m13-1-lc-noentiendo",
      audioText: "no entiendo la idea",
      correctMeaningEn: "I don't understand the idea.",
      distractorsEn: [
        "I don't want the idea.",
        "You don't understand the idea.",
        "I don't like the idea.",
      ],
      exercisedAtomSurfaces: ["entender", "idea"],
    }),
    translateStep({
      id: "es-m13-1-tr-piensa",
      promptEn: "She thinks it's a good idea.",
      acceptedAnswers: [
        "ella piensa que es una buena idea",
        "Ella piensa que es una buena idea",
        "ella piensa que es una buena idea.",
        "Ella piensa que es una buena idea.",
      ],
      audioText: "ella piensa que es una buena idea",
      exercisedAtomSurfaces: ["pensar", "idea"],
    }),
    sentenceMcq({
      id: "es-m13-1-q-pensamos",
      prompt: "'We think it's a good idea.' — pick the Spanish:",
      correctText: "pensamos que es una buena idea",
      distractorsText: [
        "piensamos que es una buena idea",
        "pensáis que es una buena idea",
        "piensan que es una buena idea",
      ],
      exercisedAtomSurfaces: ["pensar", "idea"],
    }),
    speaking("es-m13-1-speak-entendemos", "entendemos la idea", "we understand the idea", ["entender", "idea"]),
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
    cloze(
      "es-m13-1-cloze-nosotros",
      "Nosotros no ",
      " la idea.",
      "entendemos",
      ["entendemos", "entiende", "entienden", "entiendo"],
      "we don't understand the idea",
      "Nosotros no entendemos la idea.",
      "nosotros always keeps the plain stem — never boots.",
      ["entender", "idea"],
    ),
    build(
      "es-m13-1-build-entienden",
      "Build: 'They don't understand the idea.'",
      "no entienden la idea",
      ["no", "entienden", "la", "idea", "entiende"],
      ["no", "entienden", "la", "idea"],
      ["entender", "idea"],
    ),
    speaking("es-m13-1-speak-pensamos", "pensamos que es una buena idea", "we think it's a good idea", ["pensar", "idea"]),
    selfExplain({
      id: "es-m13-1-self-nosotros",
      anchorLabel: "You just said: pensamos que es una buena idea",
      anchorAudioText: "pensamos que es una buena idea",
      question: "Why does nosotros stay pensamos instead of piensamos?",
      rule: {
        text: "nosotros never boots — no matter the verb, it always keeps the plain infinitive stem; only yo/tú/él-ella-usted/ellos-ellas swell.",
      },
      surface: { text: "nosotros is plural, so it drops the change." },
      distractor: {
        text: "nosotros keeps the plain stem only for -ar verbs like pensar; -er and -ir boot verbs still change in nosotros.",
      },
      ruleExplanation:
        "Every boot verb — -ar, -er, or -ir — skips the change in nosotros (and vosotros). pensamos, entendemos, volvemos, pedimos: always the plain stem.",
    }),
    infoStep(
      "es-m13-1-info-win",
      "You've named the twist",
      "You've named the twist behind quiero — you can now think, understand, and share ideas with any boot verb, and you already know its blind spot: nosotros always stays plain.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m13-2-info-eie",
      "The e→ie crew",
      "Tres verbos más con el mismo giro: preferir → prefiero (I prefer), empezar → empieza (it begins), cerrar → cierro (I close). Y recuerda la suela del zapato — nosotros se queda plano: preferimos, empezamos, cerramos.",
      "grammar",
    ),
    phrase("es-m13-2-p-pelicula", "the movie", "la película", undefined, { atomId: "es:película", emoji: "🎬" }),
    vocabMcq("es-m13-2-mcq-pelicula", { surface: "película", meaningEn: "movie", emoji: "🎬" }, [IDEA, DORMIR, FUTBOL]),
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
    build(
      "es-m13-2-build-cierro",
      "Build: 'I close the store at nine.'",
      "cierro la tienda a las nueve",
      ["cierro", "la", "tienda", "a", "las", "nueve", "cerrar"],
      ["cierro", "la", "tienda", "a", "las", "nueve"],
      ["cerrar"],
    ),
    cloze(
      "es-m13-2-cloze-empieza",
      "la película ",
      " a las ocho.",
      "empieza",
      ["empieza", "empiezo", "empiezas", "empezamos"],
      "the movie starts at eight",
      "la película empieza a las ocho.",
      "Third person singular — it swells too.",
      ["empezar", "película"],
    ),
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
    build(
      "es-m13-2-build-preferimos",
      "Build: 'We prefer that idea.'",
      "preferimos esa idea",
      ["preferimos", "esa", "idea", "prefiere"],
      ["preferimos", "esa", "idea"],
      ["preferir", "idea"],
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
    translateStep({
      id: "es-m13-2-tr-empieza",
      promptEn: "The movie starts at eight.",
      acceptedAnswers: [
        "la película empieza a las ocho",
        "la pelicula empieza a las ocho",
        "La película empieza a las ocho",
        "la película empieza a las ocho.",
        "La película empieza a las ocho.",
        "la pelicula empieza a las ocho.",
      ],
      audioText: "la película empieza a las ocho",
      exercisedAtomSurfaces: ["empezar", "película"],
    }),
    sentenceMcq({
      id: "es-m13-2-q-preferimos",
      prompt: "'We prefer coffee.' — pick the Spanish:",
      correctText: "preferimos el café",
      distractorsText: ["prefierimos el café", "preferimos el cafés", "prefiero el café"],
      exercisedAtomSurfaces: ["preferir"],
    }),
    speaking("es-m13-2-speak-cerramos", "cerramos a las nueve", "we close at nine", ["cerrar"]),
    cloze(
      "es-m13-2-cloze-cierro",
      "yo ",
      " la puerta.",
      "cierro",
      ["cierro", "cierra", "cerramos", "cierras"],
      "I close the door",
      "yo cierro la puerta.",
      undefined,
      ["cerrar"],
    ),
    build(
      "es-m13-2-build-cierran",
      "Build: 'They close the store at ten.'",
      "cierran la tienda a las diez",
      ["cierran", "la", "tienda", "a", "las", "diez", "cierra"],
      ["cierran", "la", "tienda", "a", "las", "diez"],
      ["cerrar"],
    ),
    selfExplain({
      id: "es-m13-2-self-cerramos",
      anchorLabel: "You just said: cerramos a las nueve",
      anchorAudioText: "cerramos a las nueve",
      question: "Why doesn't nosotros swell to cierran or cierra here?",
      rule: {
        text: "nosotros never triggers the e→ie swell in any boot verb — cerrar stays on its plain stem: cerramos, exactly like the infinitive.",
      },
      surface: { text: "cerramos sounds different because -ar verbs conjugate differently than -er verbs." },
      distractor: {
        text: "cerramos keeps the plain stem only when talking about business hours; other meanings of cerrar do change.",
      },
      ruleExplanation:
        "Every regular boot verb — no matter the ending — keeps nosotros (and vosotros) on the plain infinitive stem. Only yo/tú/él-ella-usted/ellos-ellas swell.",
    }),
    speaking("es-m13-2-speak-cafe", "prefiero el café", "I prefer coffee", ["preferir"]),
    reviewMatchPairs("es-m13-2-review", "es-m13-2-seed", "m13", 6),
    sentenceMcq({
      id: "es-m13-2-q-playa",
      prompt: "'I prefer the beach to the movies.' — pick the Spanish:",
      correctText: "prefiero la playa al cine",
      distractorsText: [
        "prefiero el cine a la playa",
        "prefiero la playa al cines",
        "prefieres la playa al cine",
      ],
      exercisedAtomSurfaces: ["preferir", "película", "playa", "cine"],
    }),
    infoStep(
      "es-m13-2-info-win",
      "Say what you'd rather do",
      "You can now say what you'd rather do, watch, or read — and close the shop while you're at it.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m13-3-info-oue",
      "The o→ue boot",
      "Same boot, different vowel: in poder (to be able to) the o swells to ue — puedo, puedes, puede... but podemos. Dormir (to sleep) matches: duermo, duermes, dormimos. ¿Puedo...? asks permission ('may I...?') and ¿puedes...? makes a friendly request ('can you...?').",
      "grammar",
    ),
    phrase("es-m13-3-p-puedopasar", "may I come in?", "¿puedo pasar?"),
    vocabMcq("es-m13-3-mcq-dormir", { surface: "dormir", meaningEn: "to sleep", emoji: "😴" }, [IDEA, PELICULA, FUTBOL]),
    sentenceMcq({
      id: "es-m13-3-q-pasar",
      prompt: "You're at a friend's door. Ask permission to come in:",
      correctText: "¿puedo pasar?",
      distractorsText: ["¿puedes pasar?", "¿puedo pasas?", "¿pasar puedo yo?"],
      exercisedAtomSurfaces: ["¿puedo pasar?", "puedo"],
    }),
    build(
      "es-m13-3-build-duermes",
      "Build: 'You can sleep at my house.'",
      "puedes dormir en mi casa",
      ["puedes", "dormir", "en", "mi", "casa", "poder"],
      ["puedes", "dormir", "en", "mi", "casa"],
      ["puedes", "dormir"],
    ),
    cloze(
      "es-m13-3-cloze-puedes",
      "¿",
      "cerrar la puerta?",
      "puedes",
      ["puedes", "puedo", "pueden", "podemos"],
      "can you close the door?",
      "¿puedes cerrar la puerta?",
      "A friendly request aimed at the other person — second person singular.",
      ["cerrar"],
    ),
    sentenceMcq({
      id: "es-m13-3-q-dormir",
      prompt: "'I can't sleep.' — pick the Spanish:",
      correctText: "no puedo dormir",
      distractorsText: ["no puedo duermo", "no puedes dormir", "no podo dormir"],
      exercisedAtomSurfaces: ["puedo", "dormir"],
    }),
    build(
      "es-m13-3-build-podemos",
      "Build: 'We can sleep here.'",
      "podemos dormir aquí",
      ["podemos", "dormir", "aquí", "puede"],
      ["podemos", "dormir", "aquí"],
      ["poder", "dormir"],
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
    listeningCompSentence({
      id: "es-m13-3-lc-cerrar",
      audioText: "¿puedes cerrar la ventana?",
      correctMeaningEn: "Can you close the window?",
      distractorsEn: [
        "Can you open the window?",
        "May I close the window?",
        "Can you close the door?",
      ],
      exercisedAtomSurfaces: ["puedes", "cerrar"],
    }),
    translateStep({
      id: "es-m13-3-tr-dormir",
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
    sentenceMcq({
      id: "es-m13-3-q-podemos",
      prompt: "'We can't sleep.' — pick the Spanish:",
      correctText: "no podemos dormir",
      distractorsText: ["no puedemos dormir", "no podemos duermir", "no puede dormir"],
      exercisedAtomSurfaces: ["poder", "dormir"],
    }),
    speaking("es-m13-3-speak-pasar", "¿puedo pasar?", "may I come in?", ["¿puedo pasar?"]),
    cloze(
      "es-m13-3-cloze-momento",
      "¿",
      " pasar un momento?",
      "puedo",
      ["puedo", "puedes", "podemos", "pueden"],
      "may I come in for a moment?",
      "¿puedo pasar un momento?",
      undefined,
      ["puedo", "¿puedo pasar?"],
    ),
    build(
      "es-m13-3-build-nopuedes",
      "Build: 'You can't sleep here.'",
      "no puedes dormir aquí",
      ["no", "puedes", "dormir", "aquí", "puedo"],
      ["no", "puedes", "dormir", "aquí"],
      ["puedes", "dormir"],
    ),
    selfExplain({
      id: "es-m13-3-self-podemos",
      anchorLabel: "You just said: no podemos dormir",
      anchorAudioText: "no podemos dormir",
      question: "Why podemos, not puedemos, for nosotros?",
      rule: {
        text: "nosotros never boots in o→ue verbs either — poder stays podemos, just like dormir stays dormimos.",
      },
      surface: { text: "podemos is irregular only because poder itself is an irregular verb overall." },
      distractor: {
        text: "podemos keeps the plain stem because it's a question-word combination, not a plain statement.",
      },
      ruleExplanation:
        "The nosotros exception holds across every boot family — e→ie, o→ue, e→i, u→ue. podemos, dormimos, pedimos, jugamos: always plain.",
    }),
    speaking("es-m13-3-speak-tarjeta", "puedo pagar con tarjeta", "I can pay with card", ["puedo"]),
    reviewMatchPairs("es-m13-3-review", "es-m13-3-seed", "m13", 6),
    sentenceMcq({
      id: "es-m13-3-q-efectivo",
      prompt: "'Can I pay with cash?' — pick the Spanish:",
      correctText: "¿puedo pagar en efectivo?",
      distractorsText: [
        "¿puedes pagar en efectivo?",
        "¿puedo pagas en efectivo?",
        "¿podemos pagar en efectivo?",
      ],
      exercisedAtomSurfaces: ["puedo"],
    }),
    infoStep(
      "es-m13-3-info-win",
      "Ask, and you shall pass",
      "You can now ask permission, offer to help, and turn down an invitation politely — puedo and puedes are yours.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m13-4-info-volver",
      "Two more o→ue boots",
      "Volver (to return) gives vuelvo, vuelves, vuelve — volvemos. Almorzar (to have lunch) gives almuerzo, almuerzas — almorzamos. Pair them with temprano (early) and tarde (late); as a noun, la tarde is the afternoon you already greet with buenas tardes.",
      "grammar",
    ),
    vocab("es-m13-4-p-volver", "to return", "volver"),
    vocabMcq("es-m13-4-mcq-pelicula", { surface: "película", meaningEn: "movie", emoji: "🎬" }, [DORMIR, FUTBOL, IDEA]),
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
    build(
      "es-m13-4-build-tarde",
      "Build: 'Tonight I'm going to sleep late.'",
      "esta noche voy a dormir tarde",
      ["esta", "noche", "voy", "a", "dormir", "tarde", "temprano"],
      ["esta", "noche", "voy", "a", "dormir", "tarde"],
      ["dormir", "tarde"],
    ),
    cloze(
      "es-m13-4-cloze-almorzamos",
      "Nosotros ",
      " a la una.",
      "almorzamos",
      ["almorzamos", "almuerzo", "almuerzas", "almuerzan"],
      "we have lunch at one",
      "Nosotros almorzamos a la una.",
      "nosotros stays plain — no boot.",
      ["almorzar"],
    ),
    sentenceMcq({
      id: "es-m13-4-q-almorzamos",
      prompt: "'We have lunch early.' — pick the Spanish:",
      correctText: "almorzamos temprano",
      distractorsText: ["almuerzamos temprano", "almorzamos temprana", "almuerzo temprano"],
      exercisedAtomSurfaces: ["almorzar", "temprano"],
    }),
    build(
      "es-m13-4-build-vuelven",
      "Build: 'They return home late.'",
      "vuelven a casa tarde",
      ["vuelven", "a", "casa", "tarde", "volvemos"],
      ["vuelven", "a", "casa", "tarde"],
      ["volver", "tarde"],
    ),
    sentenceMcq({
      id: "es-m13-4-q-almuerzo",
      prompt: "'I have lunch at one in the afternoon.' — pick the Spanish:",
      correctText: "almuerzo a la una de la tarde",
      distractorsText: [
        "almorzo a la una de la tarde",
        "almuerzas a la una de la tarde",
        "almuerzo a las una de la tarde",
      ],
      exercisedAtomSurfaces: ["almorzar", "tarde"],
    }),
    listeningCompSentence({
      id: "es-m13-4-lc-vuelves",
      audioText: "¿a qué hora vuelves?",
      correctMeaningEn: "What time do you return?",
      distractorsEn: [
        "What time do you sleep?",
        "What time do you have lunch?",
        "What time did you return?",
      ],
      exercisedAtomSurfaces: ["volver"],
    }),
    translateStep({
      id: "es-m13-4-tr-almorzamos",
      promptEn: "We have lunch early.",
      acceptedAnswers: [
        "almorzamos temprano",
        "Almorzamos temprano",
        "almorzamos temprano.",
        "Almorzamos temprano.",
      ],
      audioText: "almorzamos temprano",
      exercisedAtomSurfaces: ["almorzar", "temprano"],
    }),
    sentenceMcq({
      id: "es-m13-4-q-volvemos",
      prompt: "'We return late.' — pick the Spanish:",
      correctText: "volvemos tarde",
      distractorsText: ["vuelvemos tarde", "volvemos tardes", "vuelven tarde"],
      exercisedAtomSurfaces: ["volver", "tarde"],
    }),
    speaking("es-m13-4-speak-almorzamos", "almorzamos temprano", "we have lunch early", ["almorzar", "temprano"]),
    vocabTextMcq("es-m13-4-tmcq-temprano", "temprano", ["tarde", "después", "ahora"]),
    build(
      "es-m13-4-build-ellavuelve",
      "Build: 'She returns home early.'",
      "ella vuelve a casa temprano",
      ["ella", "vuelve", "a", "casa", "temprano", "volvemos"],
      ["ella", "vuelve", "a", "casa", "temprano"],
      ["volver", "temprano"],
    ),
    selfExplain({
      id: "es-m13-4-self-almorzamos",
      anchorLabel: "You just said: almorzamos temprano",
      anchorAudioText: "almorzamos temprano",
      question: "Why almorzamos and not almuerzamos?",
      rule: {
        text: "nosotros keeps almorzar's plain stem — almorzamos, never almuerzamos — the same escape hatch every boot verb has.",
      },
      surface: { text: "nosotros is plural, so it drops the change." },
      distractor: { text: "almorzamos is correct because temprano blocks the boot from forming." },
      ruleExplanation:
        "The o→ue swell happens only in yo/tú/él-ella-usted/ellos-ellas. nosotros (and vosotros) always keep the plain infinitive vowel: almorzamos, podemos, volvemos.",
    }),
    speaking("es-m13-4-speak-cine", "vuelvo temprano del cine", "I return early from the movies", ["volver", "temprano"]),
    reviewMatchPairs("es-m13-4-review", "es-m13-4-seed", "m13", 6),
    sentenceMcq({
      id: "es-m13-4-q-playa",
      prompt: "'We return late from the beach.' — pick the Spanish:",
      correctText: "volvemos tarde de la playa",
      distractorsText: [
        "vuelvemos tarde de la playa",
        "volvemos tarde a la playa",
        "volvemos tardes de la playa",
      ],
      exercisedAtomSurfaces: ["volver", "tarde", "playa"],
    }),
    infoStep(
      "es-m13-4-info-win",
      "Home, on your own schedule",
      "You can now say when you're coming and going — and whether lunch happens early or late.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 19,
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
    vocabMcq("es-m13-5-mcq-futbol", { surface: "fútbol", meaningEn: "soccer", emoji: "⚽" }, [IDEA, DORMIR, PELICULA]),
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
    build(
      "es-m13-5-build-cafe",
      "Build: 'I'm going to order a coffee.'",
      "voy a pedir un café",
      ["voy", "a", "pedir", "un", "café", "servir"],
      ["voy", "a", "pedir", "un", "café"],
      ["pedir"],
    ),
    cloze(
      "es-m13-5-cloze-servimos",
      "Nosotros ",
      " el desayuno a las ocho.",
      "servimos",
      ["servimos", "sirve", "sirven", "sirvo"],
      "we serve breakfast at eight",
      "Nosotros servimos el desayuno a las ocho.",
      "nosotros stays plain — no squeeze.",
      ["servir"],
    ),
    sentenceMcq({
      id: "es-m13-5-q-pido",
      prompt: "'I always order the soup.' — pick the Spanish:",
      correctText: "siempre pido la sopa",
      distractorsText: ["siempre pido el sopa", "siempre pides la sopa", "siempre pido la sopas"],
      exercisedAtomSurfaces: ["pedir"],
    }),
    build(
      "es-m13-5-build-sirven",
      "Build: 'They serve breakfast at eight.'",
      "sirven el desayuno a las ocho",
      ["sirven", "el", "desayuno", "a", "las", "ocho", "sirve"],
      ["sirven", "el", "desayuno", "a", "las", "ocho"],
      ["servir"],
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
    listeningCompSentence({
      id: "es-m13-5-lc-sabados",
      audioText: "juego fútbol los sábados",
      correctMeaningEn: "I play soccer on Saturdays.",
      distractorsEn: [
        "I play soccer on Sundays.",
        "I watch soccer on Saturdays.",
        "We play soccer on Saturdays.",
      ],
      exercisedAtomSurfaces: ["jugar", "fútbol"],
    }),
    translateStep({
      id: "es-m13-5-tr-pido",
      promptEn: "I always order the soup.",
      acceptedAnswers: [
        "siempre pido la sopa",
        "Siempre pido la sopa",
        "siempre pido la sopa.",
        "Siempre pido la sopa.",
      ],
      audioText: "siempre pido la sopa",
      exercisedAtomSurfaces: ["pedir"],
    }),
    sentenceMcq({
      id: "es-m13-5-q-jugamos",
      prompt: "'We play soccer on Sundays.' — pick the Spanish:",
      correctText: "jugamos fútbol los domingos",
      distractorsText: [
        "juegamos fútbol los domingos",
        "jugamos fútbol el domingos",
        "juegan fútbol los domingos",
      ],
      exercisedAtomSurfaces: ["jugar", "fútbol"],
    }),
    speaking("es-m13-5-speak-servimos", "servimos el desayuno", "we serve breakfast", ["servir"]),
    vocabTextMcq("es-m13-5-tmcq-pedir", "pedir", ["servir", "pensar", "jugar"]),
    build(
      "es-m13-5-build-partido",
      "Build: 'The game starts early.'",
      "el partido empieza temprano",
      ["el", "partido", "empieza", "temprano", "tarde"],
      ["el", "partido", "empieza", "temprano"],
      ["partido", "empezar", "temprano"],
    ),
    selfExplain({
      id: "es-m13-5-self-servimos",
      anchorLabel: "You just said: servimos el desayuno",
      anchorAudioText: "servimos el desayuno",
      question: "Why servimos, not sirvimos, for nosotros?",
      rule: { text: "e→i verbs skip the squeeze in nosotros too — servir stays servimos, pedir stays pedimos." },
      surface: { text: "nosotros is plural, so it drops the change." },
      distractor: {
        text: "servimos is the exception because servir is a -ir verb, and -ir verbs always keep the plain vowel.",
      },
      ruleExplanation:
        "Whether the boot swells e→ie, o→ue, or squeezes e→i, nosotros (and vosotros) never join in — pedimos, servimos, jugamos: all plain.",
    }),
    speaking("es-m13-5-speak-pescado", "pido pescado", "I order fish", ["pedir"]),
    reviewMatchPairs("es-m13-5-review", "es-m13-5-seed", "m13", 6),
    sentenceMcq({
      id: "es-m13-5-q-agua",
      prompt: "'I order water with dinner.' — pick the Spanish:",
      correctText: "pido agua con la cena",
      distractorsText: [
        "pides agua con la cena",
        "pido aguas con la cena",
        "pedimos agua con la cena",
      ],
      exercisedAtomSurfaces: ["pedir", "agua", "cena"],
    }),
    infoStep(
      "es-m13-5-info-win",
      "Order, serve, play",
      "You can now order what you want, describe who's serving, and say what you play — every boot family is in your hands.",
      "win",
    ),
  ],
};

// ─── es-m13-6 — Listening focus ─────────────────────────────────────────────

const M13_6: LessonContent = {
  id: "es-m13-6",
  moduleId: "m13",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — boots by ear",
  description: "Hear the stem change land in full sentences — then say it back.",
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m13-6-info-listen",
      "Boots by ear",
      "Listen for who's talking: yo/tú/él-ella-usted/ellos-ellas swell the stem, but nosotros always stays flat. Catch the difference by ear before you have to produce it.",
      "default",
    ),
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
    speaking("es-m13-6-speak-jugar", "voy a jugar fútbol esta noche", "I'm going to play soccer tonight", ["jugar", "fútbol"]),
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
    build(
      "es-m13-6-build-preferimos",
      "Build: 'We prefer soccer.'",
      "preferimos el fútbol",
      ["preferimos", "el", "fútbol", "prefiere"],
      ["preferimos", "el", "fútbol"],
      ["preferir", "fútbol"],
    ),
    listeningCompSentence({
      id: "es-m13-6-lc-vuelvo",
      audioText: "vuelvo a casa temprano",
      correctMeaningEn: "I return home early.",
      distractorsEn: [
        "I return home late.",
        "You return home early.",
        "I return home tomorrow.",
      ],
      exercisedAtomSurfaces: ["volver", "temprano"],
    }),
    translateStep({
      id: "es-m13-6-tr-pedimos",
      promptEn: "We always order the soup.",
      acceptedAnswers: [
        "siempre pedimos la sopa",
        "Siempre pedimos la sopa",
        "siempre pedimos la sopa.",
        "Siempre pedimos la sopa.",
      ],
      audioText: "siempre pedimos la sopa",
      exercisedAtomSurfaces: ["pedir"],
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
    listeningCompSentence({
      id: "es-m13-6-lc-partido",
      audioText: "¿a qué hora empieza el partido?",
      correctMeaningEn: "What time does the game start?",
      distractorsEn: [
        "What time does the movie start?",
        "What time do you return?",
        "What time do we have lunch?",
      ],
      exercisedAtomSurfaces: ["partido", "empezar"],
    }),
    speaking("es-m13-6-speak-partido", "el partido empieza a las siete", "the game starts at seven", ["partido", "empezar"]),
    listeningCompSentence({
      id: "es-m13-6-lc-entendemos",
      audioText: "no entendemos la película",
      correctMeaningEn: "We don't understand the movie.",
      distractorsEn: [
        "We don't like the movie.",
        "I don't understand the movie.",
        "We don't understand the game.",
      ],
      exercisedAtomSurfaces: ["entender", "película"],
    }),
    listeningBuildSentence({
      id: "es-m13-6-lb-podemos",
      target: "podemos dormir aquí",
      tiles: ["podemos", "dormir", "aquí", "puede"],
      correctOrder: ["podemos", "dormir", "aquí"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["poder", "dormir"],
    }),
    speaking("es-m13-6-speak-cafe", "quiero café con el desayuno", "I want coffee with breakfast", ["café", "desayuno"]),
    reviewMatchPairs("es-m13-6-review", "es-m13-6-seed", "m13", 6),
    listeningCompSentence({
      id: "es-m13-6-lc-musica",
      audioText: "prefiero la música a la playa",
      correctMeaningEn: "I prefer music to the beach.",
      distractorsEn: [
        "I prefer the beach to music.",
        "I don't like music at the beach.",
        "We prefer music to the beach.",
      ],
      exercisedAtomSurfaces: ["preferir", "música", "playa"],
    }),
    infoStep(
      "es-m13-6-info-win",
      "Your ear knows the boot",
      "Your ear can now catch the boot in real speech — and your mouth can answer back.",
      "win",
    ),
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
  estimatedMinutes: 10,
  xpReward: 20,
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
    build(
      "es-m13-7-build-prefiero",
      "Build: 'I prefer to go to the movies.'",
      "prefiero ir al cine",
      ["prefiero", "ir", "al", "cine", "preferir"],
      ["prefiero", "ir", "al", "cine"],
      ["preferir"],
    ),
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
    cloze(
      "es-m13-7-cloze-pienso",
      "yo ",
      " que es una buena idea",
      "pienso",
      ["pienso", "penso", "piensas", "pensamos"],
      "I think it's a good idea",
      "yo pienso que es una buena idea",
      "First person — and the stem e swells inside the boot.",
      ["pensar", "idea"],
    ),
    speaking("es-m13-7-speak-pasar", "¿puedo pasar?", "may I come in?", ["¿puedo pasar?"]),
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
    sentenceMcq({
      id: "es-m13-7-q-volvemos",
      prompt: "'We return late from the game.' — pick the Spanish:",
      correctText: "volvemos tarde del partido",
      distractorsText: [
        "vuelvemos tarde del partido",
        "volvemos tarde al partido",
        "volvemos tardes del partido",
      ],
      exercisedAtomSurfaces: ["volver", "tarde", "partido"],
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
    build(
      "es-m13-7-build-vuelves",
      "Build: 'What time do you return?'",
      "¿a qué hora vuelves?",
      ["a", "qué", "hora", "vuelves", "vuelvo"],
      ["a", "qué", "hora", "vuelves"],
      ["volver"],
    ),
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
    speaking("es-m13-7-speak-tres", "vuelvo a las tres", "I return at three", ["volver"]),
    sentenceMcq({
      id: "es-m13-7-q-prefieren",
      prompt: "'They prefer to have lunch at the beach.' — pick the Spanish:",
      correctText: "prefieren almorzar en la playa",
      distractorsText: [
        "prefiere almorzar en la playa",
        "prefieren almuerzan en la playa",
        "prefieren almorzar a la playa",
      ],
      exercisedAtomSurfaces: ["preferir", "almorzar", "playa"],
    }),
    cloze(
      "es-m13-7-cloze-puedesvenir",
      "¿",
      " venir mañana?",
      "puedes",
      ["puedes", "puedo", "pueden", "podemos"],
      "can you come tomorrow?",
      "¿puedes venir mañana?",
      undefined,
      ["puedes"],
    ),
    build(
      "es-m13-7-build-jugamos",
      "Build: 'We play a game this afternoon.'",
      "jugamos un partido esta tarde",
      ["jugamos", "un", "partido", "esta", "tarde", "juega"],
      ["jugamos", "un", "partido", "esta", "tarde"],
      ["jugar", "partido", "tarde"],
    ),
    speaking("es-m13-7-speak-pescado", "sirven pescado los viernes", "they serve fish on Fridays", ["servir"]),
    reviewMatchPairs("es-m13-7-review", "es-m13-7-seed", "m13", 6),
    sentenceMcq({
      id: "es-m13-7-q-te",
      prompt: "'I prefer tea to coffee.' — pick the Spanish:",
      correctText: "prefiero el té al café",
      distractorsText: [
        "prefiero el café al té",
        "prefieres el té al café",
        "prefiero el té con café",
      ],
      exercisedAtomSurfaces: ["preferir", "té", "café"],
    }),
    infoStep(
      "es-m13-7-info-win",
      "You made the plan",
      "You can now invite, decline, promise, and follow up — a whole plan for the day, boots and all.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    sentenceMcq({
      id: "es-m13-8-q-queremos",
      prompt: "'I want' is quiero. 'We want' is:",
      correctText: "queremos",
      distractorsText: ["quieremos", "quieren", "quiere"],
    }),
    build(
      "es-m13-8-build-preferimos",
      "Build: 'We prefer this movie.'",
      "preferimos esta película",
      ["preferimos", "esta", "película", "prefiere"],
      ["preferimos", "esta", "película"],
      ["preferir", "película"],
    ),
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
      "no ",
      "dormir",
      "puedo",
      ["puedo", "puedes", "podemos", "pueden"],
      "I can't sleep",
      "no puedo dormir",
      undefined,
      ["dormir"],
    ),
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
    build(
      "es-m13-8-build-pide",
      "Build: 'She always orders the salad.'",
      "ella siempre pide la ensalada",
      ["ella", "siempre", "pide", "la", "ensalada", "pido"],
      ["ella", "siempre", "pide", "la", "ensalada"],
      ["pedir"],
    ),
    sentenceMcq({
      id: "es-m13-8-q-servimos",
      prompt: "'We serve breakfast early.' — pick the Spanish:",
      correctText: "servimos el desayuno temprano",
      distractorsText: [
        "sirvimos el desayuno temprano",
        "servimos el desayuno tarde",
        "sirven el desayuno temprano",
      ],
      exercisedAtomSurfaces: ["servir", "temprano"],
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
    sentenceMcq({
      id: "es-m13-8-q-cafete",
      prompt: "'I prefer coffee to tea.' — pick the Spanish:",
      correctText: "prefiero el café al té",
      distractorsText: [
        "prefiero el té al café",
        "prefiero el café al tés",
        "prefieres el café al té",
      ],
      exercisedAtomSurfaces: ["preferir", "café", "té"],
    }),
    listeningCompSentence({
      id: "es-m13-8-lc-playa",
      audioText: "vamos a la playa o al cine",
      correctMeaningEn: "We're going to the beach or the movies.",
      distractorsEn: [
        "We're going to the beach and the movies.",
        "We're going to the mountains or the movies.",
        "They're going to the beach or the movies.",
      ],
      exercisedAtomSurfaces: ["playa", "cine"],
    }),
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
