/**
 * Spanish Module 9 — Rutinas II (-er/-ir present + question words).
 *
 * M8 gave the learner the -ar engine; M9 completes the regular present
 * with the -er and -ir paradigms (como/comes/come/comemos/comen;
 * vivo/vives/vive/vivimos/viven) and hands over the full interrogative
 * set — qué, cuándo, cómo, cuánto, cuál, por qué — plus porque for the
 * answers. dónde (m7) and quién (m5) are recycled, not re-registered.
 *
 * 2026-07-16 rewrite to the JA density/variety/production standard
 * (see docs/es-rewrite-brief-2026-07-16.md): lessons de-leak every
 * question-word prompt (Spanish-context or production instead of
 * English "ask WHY" cues), break the old 5-in-a-row sentenceMcq run in
 * L5, drive -er/-ir forms productively (build/translate, not just
 * recognition), add a selfExplain at N-1 in each grammar lesson
 * (including the -er vs -ir -emos/-imos contrast), and append a
 * compounding review tail (prior m1-m8 vocabulary) from L2 on.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m9-1  -er verbs — comer, beber (+ con)
 *   es-m9-2  Leer y aprender — the -er family grows
 *   es-m9-3  -ir verbs — vivir, escribir, abrir, recibir
 *   es-m9-4  Questions I — qué, cuándo, cómo
 *   es-m9-5  Questions II — cuánto, cuál, ¿por qué? porque
 *   es-m9-6  Listening focus — questions & answers by ear
 *   es-m9-7  Integration — a first interview + speaking
 *   es-m9-8  M9 Mastery Test
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
  phrase,
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
import "./m8";

const COURSE_ID = "mock-1";

// ─── M9 atoms (exactly the spine allocation) ────────────────────────────────
// Emoji verified against the bundled Noto subset (src/pub/noto-emoji/svg,
// FE0F never in filenames): 1f37d, 1f964, 1f4d6, 1f393, 1f9e0, 1f3c3,
// 1f4b0, 1f3e0, 270d, 1f6aa, 2709, 1f4f0, 1f3e2.

export const ES_M9_ATOMS: EsAtom[] = [
  // Regular -er verbs
  atom({ surface: "comer", meaningEn: "to eat", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🍽️" }),
  atom({ surface: "beber", meaningEn: "to drink", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🥤" }),
  atom({ surface: "leer", meaningEn: "to read", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "📖" }),
  atom({ surface: "aprender", meaningEn: "to learn", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🎓" }),
  atom({ surface: "comprender", meaningEn: "to understand", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🧠" }),
  atom({ surface: "correr", meaningEn: "to run", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🏃" }),
  atom({ surface: "vender", meaningEn: "to sell", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "💰" }),
  // Regular -ir verbs
  atom({ surface: "vivir", meaningEn: "to live", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🏠" }),
  atom({ surface: "escribir", meaningEn: "to write", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "✍️" }),
  atom({ surface: "abrir", meaningEn: "to open", partOfSpeech: "verb", fromModule: "m9", kind: "vocab", emoji: "🚪" }),
  atom({ surface: "recibir", meaningEn: "to receive", partOfSpeech: "verb", fromModule: "m9", kind: "vocab" }),
  // Question words (dónde is m7, quién is m5 — reused, never re-registered)
  atom({ surface: "qué", meaningEn: "what", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cuándo", meaningEn: "when", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cómo", meaningEn: "how", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cuánto", meaningEn: "how much", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "cuál", meaningEn: "which", partOfSpeech: "other", fromModule: "m9", kind: "vocab" }),
  atom({ surface: "por qué", meaningEn: "why", partOfSpeech: "phrase", fromModule: "m9", kind: "phrase" }),
  atom({ surface: "porque", meaningEn: "because", partOfSpeech: "particle", fromModule: "m9", kind: "particle" }),
  // Everyday nouns
  atom({ surface: "comida", meaningEn: "food", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "f" }),
  atom({ surface: "carta", meaningEn: "letter", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "f", emoji: "✉️" }),
  atom({ surface: "periódico", meaningEn: "newspaper", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "m", emoji: "📰" }),
  atom({ surface: "apartamento", meaningEn: "apartment", partOfSpeech: "noun", fromModule: "m9", kind: "vocab", gender: "m", emoji: "🏢" }),
  // Function words
  atom({ surface: "con", meaningEn: "with", partOfSpeech: "particle", fromModule: "m9", kind: "particle" }),
  atom({ surface: "sin", meaningEn: "without", partOfSpeech: "particle", fromModule: "m9", kind: "particle" }),
];

// Emoji-bearing M9 atoms — the distractor pool for this module's vocabMcq
// (image MCQ) steps.
const M9_VOCAB_POOL: { surface: string; emoji?: string }[] = ES_M9_ATOMS.filter(
  (a) => Boolean(a.emoji),
).map((a) => ({ surface: a.surface, emoji: a.emoji }));

/**
 * Compounding review tail (L2+): 6-pair match grid + a production
 * (speaking) + a recognition (vocabTextMcq) + a listening comp item, all
 * drawn from the SAME seed so the four steps recycle the same small set
 * of prior-module (m1-m8) words — deterministic, generic-safe (works for
 * whatever the picker returns; no assumption about gender/POS needed
 * since every step here operates on a single word, never a constructed
 * sentence).
 */
function reviewTail(lessonId: string) {
  const seed = `${lessonId}-rev-seed`;
  const [s0, s1, s2, s3] = pickReviewSurfaces(seed, "m9", 4);
  const glossOf = (s: string) => findEsAtomBySurface(s)!.gloss;
  return [
    speaking(`${lessonId}-rev-speak`, s0, glossOf(s0), [s0]),
    vocabTextMcq(`${lessonId}-rev-vt`, s1, [s0, s2, s3]),
    listeningCompSentence({
      id: `${lessonId}-rev-lc`,
      audioText: s2,
      correctMeaningEn: glossOf(s2),
      distractorsEn: [glossOf(s0), glossOf(s1), glossOf(s3)],
    }),
    reviewMatchPairs(`${lessonId}-rev`, seed, "m9", 6),
  ];
}

// ─── es-m9-1 — The -er pattern ──────────────────────────────────────────────
// L1 is exempt from the compounding review tail (budget spent on
// production + variety instead — nothing unusual to review yet within m9).

const M9_1: LessonContent = {
  id: "es-m9-1",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "-er verbs — comer, beber",
  description: "The -er endings and your first meals.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m9-1-info-er",
      "The -er pattern",
      "Regular -er verbs mirror the -ar recipe with e: yo como, tú comes, él/ella/usted come, nosotros comemos, ustedes/ellos/ellas comen. (Spain adds vosotros coméis — table-only here, never drilled.) Same five slots, new vowel.",
      "grammar",
    ),
    vocabMcq("es-m9-1-vm-comer", { surface: "comer", meaningEn: "to eat", emoji: "🍽️" }, M9_VOCAB_POOL),
    build(
      "es-m9-1-build-como",
      "Build: 'I eat bread with my family.'",
      "como pan con mi familia",
      ["como", "pan", "con", "mi", "familia", "come"],
      ["como", "pan", "con", "mi", "familia"],
      ["comer", "con"],
    ),
    sentenceMcq({
      id: "es-m9-1-q-bebes",
      prompt: "Tú ___ agua fría todos los días. — pick the form that fits.",
      correctText: "bebes",
      distractorsText: ["bebo", "bebe", "bebemos"],
      explanation: "The tú form of an -er verb ends in -es.",
      exercisedAtomSurfaces: ["beber"],
    }),
    vocabMcq("es-m9-1-vm-beber", { surface: "beber", meaningEn: "to drink", emoji: "🥤" }, M9_VOCAB_POOL),
    speaking("es-m9-1-speak-bebo", "Bebo agua fría.", "I drink cold water.", ["beber"]),
    // Nouns are taught with their article from m3 on; the atom surface
    // stays the bare noun, so the card pins its atom id explicitly.
    phrase("es-m9-1-p-comida", "food", "la comida", undefined, { atomId: "es:comida" }),
    sentenceMcq({
      id: "es-m9-1-q-comemos",
      prompt: "Nosotros ___ la comida de mi abuela los domingos. — pick the form that fits.",
      correctText: "comemos",
      distractorsText: ["como", "comes", "comen"],
      exercisedAtomSurfaces: ["comer", "comida"],
    }),
    cloze(
      "es-m9-1-cloze-con",
      "como",
      "mi familia",
      "con",
      ["con", "sin", "y", "en"],
      "I eat with my family",
      "Como con mi familia.",
      "Names who joins the activity.",
    ),
    build(
      "es-m9-1-build-comemos",
      "Build: 'We eat food together.'",
      "comemos comida juntos",
      ["comemos", "comida", "juntos", "come"],
      ["comemos", "comida", "juntos"],
      ["comer", "comida"],
    ),
    // Text-front recognition — comida carries no emoji.
    vocabTextMcq("es-m9-1-vt-comida", "comida", ["agua", "casa", "mesa"]),
    translateStep({
      id: "es-m9-1-tr-comida",
      promptEn: "The food is good.",
      acceptedAnswers: ["La comida es buena", "la comida es buena", "La comida es buena.", "la comida es buena."],
      audioText: "La comida es buena.",
      exercisedAtomSurfaces: ["comida"],
    }),
    sentenceMcq({
      id: "es-m9-1-q-con-cafe",
      prompt: "Mi papá bebe café ___ leche. — pick the word that fits.",
      correctText: "con",
      distractorsText: ["sin", "y", "de"],
      exercisedAtomSurfaces: ["con", "beber"],
    }),
    listeningCompSentence({
      id: "es-m9-1-lc-comemos",
      audioText: "Comemos con mi familia los domingos.",
      correctMeaningEn: "We eat with my family on Sundays.",
      distractorsEn: [
        "We drink with my family on Sundays.",
        "We eat with my friends on Sundays.",
        "We eat with my family on Mondays.",
      ],
      exercisedAtomSurfaces: ["comer", "con"],
    }),
    speaking("es-m9-1-speak-como-con", "Como con mi familia.", "I eat with my family.", ["comer", "con"]),
    sentenceMcq({
      id: "es-m9-1-q-come-ella",
      prompt: "Ella no ___ carne; solo pescado. — pick the form that fits.",
      correctText: "come",
      distractorsText: ["comes", "comen", "comemos"],
      exercisedAtomSurfaces: ["comer"],
    }),
    selfExplain({
      id: "es-m9-1-self-explain",
      anchorLabel: "You picked comemos for: Nosotros ___ la comida.",
      anchorAudioText: "Comemos la comida.",
      question: "Why does comer's nosotros form end in -emos, not -amos?",
      rule: {
        text: "-er verbs replace -ar's vowel a with e throughout the paradigm, so nosotros takes -emos (comemos) instead of -amos.",
      },
      surface: { text: "-emos is the ending for 'we' in every verb, no matter its family." },
      distractor: { text: "-emos appears because comer already has an e in its stem, so nosotros just repeats it." },
      ruleExplanation:
        "-er verbs mirror -ar with the vowel swapped to e: -o, -es, -e, -emos, -en.",
    }),
    build(
      "es-m9-1-build-abuela",
      "Build: 'My grandmother eats vegetables.'",
      "mi abuela come verduras",
      ["mi", "abuela", "come", "verduras", "comen"],
      ["mi", "abuela", "come", "verduras"],
      ["comer"],
    ),
    infoStep(
      "es-m9-1-info-win",
      "Meals, unlocked",
      "You can now talk about your daily meals in the present — comer and beber are yours.",
      "win",
    ),
  ],
};

// ─── es-m9-2 — The -er family grows ─────────────────────────────────────────

const M9_2: LessonContent = {
  id: "es-m9-2",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Leer y aprender",
  description: "Read, learn, understand, run — the -er family grows.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    vocabMcq("es-m9-2-vm-leer", { surface: "leer", meaningEn: "to read", emoji: "📖" }, M9_VOCAB_POOL),
    build(
      "es-m9-2-build-leo",
      "Build: 'I read a new book every week.'",
      "leo un libro nuevo cada semana",
      ["leo", "un", "libro", "nuevo", "cada", "semana", "lee"],
      ["leo", "un", "libro", "nuevo", "cada", "semana"],
      ["leer"],
    ),
    sentenceMcq({
      id: "es-m9-2-q-periodico",
      prompt: "Mi papá lee ___ todos los días. — pick the phrase that fits.",
      correctText: "el periódico",
      distractorsText: ["la mochila", "el lápiz", "la llave"],
      exercisedAtomSurfaces: ["periódico", "leer"],
    }),
    phrase("es-m9-2-p-periodico", "newspaper", "el periódico", undefined, {
      emoji: "📰",
      atomId: "es:periódico",
    }),
    sentenceMcq({
      id: "es-m9-2-q-periodico2",
      prompt: "Ese ___ tiene las noticias de hoy. — pick the word that fits.",
      correctText: "periódico",
      distractorsText: ["carta", "libro", "apartamento"],
      exercisedAtomSurfaces: ["periódico"],
    }),
    speaking("es-m9-2-speak-periodico", "Leo el periódico por la mañana.", "I read the newspaper in the morning.", [
      "leer",
      "periódico",
    ]),
    vocabTextMcq("es-m9-2-vt-leer", "leer", ["aprender", "correr", "comprender"]),
    phrase("es-m9-2-p-aprender", "to learn", "aprender", undefined, { emoji: "🎓" }),
    sentenceMcq({
      id: "es-m9-2-q-aprenden",
      prompt: "En la escuela, los niños ___ a leer. — pick the form that fits.",
      correctText: "aprenden",
      distractorsText: ["comen", "viven", "escriben"],
      exercisedAtomSurfaces: ["aprender"],
    }),
    cloze(
      "es-m9-2-cloze-aprendemos",
      "Nosotros",
      "mucho vocabulario nuevo cada semana.",
      "aprendemos",
      ["aprendemos", "aprenden", "aprende", "aprendo"],
      "We learn a lot of new vocabulary every week",
      "Aprendemos mucho vocabulario nuevo cada semana.",
      undefined,
      ["aprender"],
    ),
    build(
      "es-m9-2-build-comprendo",
      "Build: 'I don't understand the newspaper.'",
      "no comprendo el periódico",
      ["no", "comprendo", "el", "periódico", "comprende"],
      ["no", "comprendo", "el", "periódico"],
      ["comprender", "periódico"],
    ),
    vocabMcq("es-m9-2-vm-comprender", { surface: "comprender", meaningEn: "to understand", emoji: "🧠" }, M9_VOCAB_POOL),
    sentenceMcq({
      id: "es-m9-2-q-comprendes",
      prompt: "Tú ___ inglés muy bien; yo no. — pick the form that fits.",
      correctText: "comprendes",
      distractorsText: ["comprendo", "comprende", "comprendemos"],
      exercisedAtomSurfaces: ["comprender"],
    }),
    build(
      "es-m9-2-build-correr",
      "Build: 'I need to run every day.'",
      "necesito correr todos los días",
      ["necesito", "correr", "todos", "los", "días", "corro"],
      ["necesito", "correr", "todos", "los", "días"],
      ["correr"],
    ),
    listeningCompSentence({
      id: "es-m9-2-lc-lee",
      audioText: "Mi hermana lee el periódico todos los días.",
      correctMeaningEn: "My sister reads the newspaper every day.",
      distractorsEn: [
        "My sister writes the newspaper every day.",
        "My sister reads a letter every day.",
        "My sister reads the newspaper sometimes.",
      ],
      exercisedAtomSurfaces: ["leer", "periódico"],
    }),
    translateStep({
      id: "es-m9-2-tr-aprendemos",
      promptEn: "We learn a lot in this class.",
      acceptedAnswers: [
        "Aprendemos mucho en esta clase",
        "aprendemos mucho en esta clase",
        "Aprendemos mucho en esta clase.",
        "aprendemos mucho en esta clase.",
      ],
      audioText: "Aprendemos mucho en esta clase.",
      exercisedAtomSurfaces: ["aprender"],
    }),
    ...reviewTail("es-m9-2"),
    infoStep(
      "es-m9-2-info-win",
      "Verbs everywhere",
      "You can now read, learn, understand, and run about your day — all in the present.",
      "win",
    ),
  ],
};

// ─── es-m9-3 — The -ir pattern ──────────────────────────────────────────────

const M9_3: LessonContent = {
  id: "es-m9-3",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "-ir verbs — vivir, escribir",
  description: "-ir verbs: live, write, open, receive.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m9-3-info-ir",
      "The -ir pattern",
      "-ir verbs borrow every -er ending except one: nosotros takes -imos. vivo, vives, vive, vivimos, viven — and abrir and recibir follow right along: abro, abres… recibo, recibes… (Spain: vosotros vivís, table-only.)",
      "grammar",
    ),
    vocabMcq("es-m9-3-vm-vivir", { surface: "vivir", meaningEn: "to live", emoji: "🏠" }, M9_VOCAB_POOL),
    build(
      "es-m9-3-build-vivo",
      "Build: 'I live in a big city.'",
      "vivo en una ciudad grande",
      ["vivo", "en", "una", "ciudad", "grande", "vive"],
      ["vivo", "en", "una", "ciudad", "grande"],
      ["vivir"],
    ),
    sentenceMcq({
      id: "es-m9-3-q-vive",
      prompt: "Mi hermana ___ en un apartamento pequeño. — pick the form that fits.",
      correctText: "vive",
      distractorsText: ["vivo", "vives", "vivimos"],
      exercisedAtomSurfaces: ["vivir"],
    }),
    phrase("es-m9-3-p-apartamento", "apartment", "el apartamento", undefined, {
      emoji: "🏢",
      atomId: "es:apartamento",
    }),
    sentenceMcq({
      id: "es-m9-3-q-apartamento",
      prompt: "Buscamos ___ cerca del centro. — pick the phrase that fits.",
      correctText: "un apartamento",
      distractorsText: ["una casa", "un banco", "una tienda"],
      exercisedAtomSurfaces: ["apartamento"],
    }),
    speaking("es-m9-3-speak-vivimos", "Vivimos en un apartamento pequeño.", "We live in a small apartment.", [
      "vivir",
      "apartamento",
    ]),
    phrase("es-m9-3-p-carta", "letter", "la carta", undefined, { emoji: "✉️", atomId: "es:carta" }),
    vocabMcq("es-m9-3-vm-escribir", { surface: "escribir", meaningEn: "to write", emoji: "✍️" }, M9_VOCAB_POOL),
    sentenceMcq({
      id: "es-m9-3-q-carta",
      prompt: "Recibo ___ de mi abuela cada mes. — pick the phrase that fits.",
      correctText: "una carta",
      distractorsText: ["un periódico", "un mensaje", "una llamada"],
      exercisedAtomSurfaces: ["carta", "recibir"],
    }),
    build(
      "es-m9-3-build-abre",
      "Build: 'He opens the door when it's hot.'",
      "abre la puerta cuando hace calor",
      ["abre", "la", "puerta", "cuando", "hace", "calor", "abro"],
      ["abre", "la", "puerta", "cuando", "hace", "calor"],
      ["abrir"],
    ),
    sentenceMcq({
      id: "es-m9-3-q-abre2",
      prompt: "Ella ___ la puerta cuando hace calor. — pick the form that fits.",
      correctText: "abre",
      distractorsText: ["abro", "abres", "abren"],
      exercisedAtomSurfaces: ["abrir"],
    }),
    translateStep({
      id: "es-m9-3-tr-carta",
      promptEn: "I write a letter to my grandmother.",
      acceptedAnswers: [
        "Escribo una carta a mi abuela",
        "escribo una carta a mi abuela",
        "Escribo una carta a mi abuela.",
        "escribo una carta a mi abuela.",
      ],
      audioText: "Escribo una carta a mi abuela.",
      exercisedAtomSurfaces: ["escribir", "carta"],
    }),
    // Text-front recognition — recibir carries no emoji.
    vocabTextMcq("es-m9-3-vt-recibir", "recibir", ["escribir", "abrir", "leer"]),
    build(
      "es-m9-3-build-recibimos",
      "Build: 'We receive letters at home.'",
      "recibimos cartas en casa",
      ["recibimos", "cartas", "en", "casa", "recibe"],
      ["recibimos", "cartas", "en", "casa"],
      ["recibir", "carta"],
    ),
    sentenceMcq({
      id: "es-m9-3-q-recibimos",
      prompt: "Nosotros ___ las cartas en casa; el cartero las trae. — pick the form that fits.",
      correctText: "recibimos",
      distractorsText: ["recibo", "recibes", "reciben"],
      explanation: "The -imos ending is the one place -ir verbs break from -er.",
      exercisedAtomSurfaces: ["recibir", "carta"],
    }),
    selfExplain({
      id: "es-m9-3-self-explain",
      anchorLabel: "You wrote: recibimos las cartas (not recibemos).",
      question: "Why is it recibimos, not recibemos?",
      rule: {
        text: "-ir verbs share every -er ending except nosotros, which takes -imos instead of -emos.",
      },
      surface: { text: "-imos is just recibir's own special nosotros ending, unrelated to -er verbs." },
      distractor: {
        text: "-imos appears because the verb starts with re-, and re- verbs always take -imos.",
      },
      ruleExplanation:
        "-er and -ir verbs are identical in every slot except nosotros: -emos for -er (comemos), -imos for -ir (vivimos, recibimos).",
    }),
    ...reviewTail("es-m9-3"),
    infoStep(
      "es-m9-3-info-win",
      "Live, write, open, receive",
      "You can now describe where you live and what you write, open, and receive — the -ir engine is running.",
      "win",
    ),
  ],
};

// ─── es-m9-4 — Questions I ──────────────────────────────────────────────────

const M9_4: LessonContent = {
  id: "es-m9-4",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Questions — qué, cuándo, cómo",
  description: "Ask what, when, and how — plus the upside-down ¿.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m9-4-info-preguntas",
      "Asking questions",
      "For a yes/no question, keep the words and raise your voice at the end — writing wraps it in ¿…?. For open questions, lead with a question word: qué (what), cuándo (when), cómo (how) — plus dónde and quién, which you already know. Question words always wear their accent, and the verb comes right after: ¿Qué comes? ¿Cuándo trabaja tu hermano?",
      "grammar",
    ),
    sentenceMcq({
      id: "es-m9-4-q-que",
      prompt: "Tu amigo cocina algo misterioso. Preguntas: '¿___ preparas?'",
      correctText: "Qué",
      distractorsText: ["Cuándo", "Cómo", "Quién"],
      exercisedAtomSurfaces: ["qué"],
    }),
    build(
      "es-m9-4-build-cuando",
      "Build the question: 'When does your brother work?'",
      "cuándo trabaja tu hermano",
      ["cuándo", "trabaja", "tu", "hermano", "dónde"],
      ["cuándo", "trabaja", "tu", "hermano"],
      ["cuándo"],
    ),
    sentenceMcq({
      id: "es-m9-4-q-como",
      prompt: "Saludas a un amigo por primera vez hoy. Preguntas: '¿___ estás?'",
      correctText: "Cómo",
      distractorsText: ["Qué", "Cuándo", "Quién"],
      exercisedAtomSurfaces: ["cómo"],
    }),
    listeningCompSentence({
      id: "es-m9-4-lc-desayuno",
      audioText: "¿Qué comes en el desayuno?",
      correctMeaningEn: "What do you eat for breakfast?",
      distractorsEn: [
        "When do you eat breakfast?",
        "How do you eat breakfast?",
        "What do you eat for dinner?",
      ],
      exercisedAtomSurfaces: ["qué", "comer"],
    }),
    speaking("es-m9-4-speak-cuando", "¿Cuándo trabajas?", "When do you work?", ["cuándo"]),
    sentenceMcq({
      id: "es-m9-4-q-comprehension",
      prompt: "¿Qué significa '¿Cómo llegas al trabajo?'?",
      correctText: "How do you get to work?",
      distractorsText: ["When do you get to work?", "What do you take to work?", "Where do you work?"],
      exercisedAtomSurfaces: ["cómo"],
    }),
    translateStep({
      id: "es-m9-4-tr-mama",
      promptEn: "How is your mother?",
      acceptedAnswers: ["¿Cómo está tu mamá?", "¿cómo está tu mamá?", "Cómo está tu mamá", "cómo está tu mamá"],
      audioText: "¿Cómo está tu mamá?",
      exercisedAtomSurfaces: ["cómo"],
    }),
    sentenceMcq({
      id: "es-m9-4-q-cuando2",
      prompt:
        "La fiesta empieza a las ocho, pero no sabes la hora exacta en que llega Marta. Preguntas: '¿___ llega Marta?'",
      correctText: "Cuándo",
      distractorsText: ["Qué", "Cómo", "Quién"],
      exercisedAtomSurfaces: ["cuándo"],
    }),
    cloze(
      "es-m9-4-cloze-como-llamas",
      "¿",
      " te llamas?",
      "Cómo",
      ["Cómo", "Qué", "Cuándo"],
      "What's your name?",
      "¿Cómo te llamas?",
      undefined,
      ["cómo"],
    ),
    build(
      "es-m9-4-build-que-escribes",
      "Build the question: 'What do you write every day?'",
      "qué escribes todos los días",
      ["qué", "escribes", "todos", "los", "días", "dónde"],
      ["qué", "escribes", "todos", "los", "días"],
      ["qué", "escribir"],
    ),
    listeningCompSentence({
      id: "es-m9-4-lc-escuela",
      audioText: "¿Cómo llegas a la escuela?",
      correctMeaningEn: "How do you get to school?",
      distractorsEn: ["When do you get to school?", "What do you take to school?", "Where is your school?"],
      exercisedAtomSurfaces: ["cómo"],
    }),
    speaking("es-m9-4-speak-que-comes", "¿Qué comes?", "What do you eat?", ["qué", "comer"]),
    sentenceMcq({
      id: "es-m9-4-q-como2",
      prompt:
        "Tu vecino siempre llega a tiempo al trabajo, pero nunca sabes su método. Preguntas: '¿___ llegas tan rápido?'",
      correctText: "Cómo",
      distractorsText: ["Qué", "Cuándo", "Quién"],
      exercisedAtomSurfaces: ["cómo"],
    }),
    selfExplain({
      id: "es-m9-4-self-explain",
      anchorLabel: "You wrote: ¿Cuándo llega Marta?",
      anchorAudioText: "¿Cuándo llega Marta?",
      question: "Why does the verb (llega) come right after cuándo, not before it?",
      rule: {
        text: "Spanish question words open the sentence and the verb follows immediately — the question word and the verb don't separate.",
      },
      surface: { text: "Cuándo always needs '¿' in front, so the verb just happens to come next." },
      distractor: { text: "The verb follows cuándo because -ar verbs always precede time words." },
      ruleExplanation:
        "Spanish question words sit at the front of the question with the verb right behind them: ¿Cuándo + verb…? Any named subject comes after the verb, not between.",
    }),
    build(
      "es-m9-4-build-como-escribes",
      "Build the question: 'How do you write your name?'",
      "cómo escribes tu nombre",
      ["cómo", "escribes", "tu", "nombre", "dónde"],
      ["cómo", "escribes", "tu", "nombre"],
      ["cómo", "escribir"],
    ),
    ...reviewTail("es-m9-4"),
    infoStep(
      "es-m9-4-info-win",
      "Questions, unlocked",
      "You can now open a question with qué, cuándo, or cómo and know the verb follows right behind.",
      "win",
    ),
  ],
};

// ─── es-m9-5 — Questions II ─────────────────────────────────────────────────

const M9_5: LessonContent = {
  id: "es-m9-5",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Por qué? — porque",
  description: "Why and because — plus how much and which.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m9-5-info-porque",
      "Why? Because.",
      "por qué — two words, with accent — asks why. porque — one word, no accent — gives the reason: ¿Por qué estudias? Porque necesito trabajar. This lesson also adds cuánto (how much) and cuál (which one) to finish your question-word set.",
      "grammar",
    ),
    vocabMcq("es-m9-5-vm-vender", { surface: "vender", meaningEn: "to sell", emoji: "💰" }, M9_VOCAB_POOL),
    build(
      "es-m9-5-build-vende",
      "Build: 'My brother sells computers.'",
      "mi hermano vende computadoras",
      ["mi", "hermano", "vende", "computadoras", "venden"],
      ["mi", "hermano", "vende", "computadoras"],
      ["vender"],
    ),
    sentenceMcq({
      id: "es-m9-5-q-cuanto",
      prompt: "En el mercado, quieres saber el precio de las manzanas. Preguntas: '¿___ cuestan?'",
      correctText: "Cuánto",
      distractorsText: ["Cuál", "Cuándo", "Cómo"],
      exercisedAtomSurfaces: ["cuánto"],
    }),
    cloze(
      "es-m9-5-cloze-porque",
      "No trabajo hoy",
      "estoy enfermo.",
      "porque",
      ["porque", "por qué", "sin", "con"],
      "I'm not working today because I'm sick",
      "No trabajo hoy porque estoy enfermo.",
    ),
    build(
      "es-m9-5-build-por-que",
      "Build the question: 'Why do you sell your car?'",
      "por qué vendes tu carro",
      ["por", "qué", "vendes", "tu", "carro", "porque"],
      ["por", "qué", "vendes", "tu", "carro"],
      ["por qué", "vender"],
    ),
    sentenceMcq({
      id: "es-m9-5-q-reply",
      prompt: "'¿Por qué vendes tu carro?' — pick the reply that gives a reason.",
      correctText: "Porque necesito dinero.",
      distractorsText: ["Por qué necesito dinero.", "Cuánto necesito dinero.", "Cuándo necesito dinero."],
      explanation: "porque (one word) states the reason; the others swap in a question word instead.",
      exercisedAtomSurfaces: ["porque", "vender"],
    }),
    translateStep({
      id: "es-m9-5-tr-porque",
      promptEn: "I study Spanish because I live in Mexico.",
      acceptedAnswers: [
        "Estudio español porque vivo en México",
        "estudio español porque vivo en México",
        "Estudio espanol porque vivo en Mexico",
        "estudio espanol porque vivo en Mexico",
      ],
      audioText: "Estudio español porque vivo en México.",
      exercisedAtomSurfaces: ["porque", "vivir"],
    }),
    sentenceMcq({
      id: "es-m9-5-q-cual",
      prompt: "Dos libros están en la mesa. Tu hermano quiere saber el tuyo: '¿___ es tu libro?'",
      correctText: "Cuál",
      distractorsText: ["Cuánto", "Cuándo", "Qué"],
      exercisedAtomSurfaces: ["cuál"],
    }),
    // For-sale listing — each m4 adjective agrees with its own noun.
    agreementCloze(
      "es-m9-5-agr-vende",
      [
        { text: "Ellos venden una casa viej" },
        { blank: { id: "b1", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
        { text: " y un carro nuev" },
        { blank: { id: "b2", correctAnswer: "o", options: ["o", "a", "os", "as"] } },
        { text: "." },
      ],
      "they sell an old house and a new car",
      "Ellos venden una casa vieja y un carro nuevo.",
      ["vender", "casa", "carro", "viejo", "nuevo"],
    ),
    build(
      "es-m9-5-build-sin",
      "Build: 'An apartment without windows.'",
      "un apartamento sin ventanas",
      ["un", "apartamento", "sin", "ventanas", "con"],
      ["un", "apartamento", "sin", "ventanas"],
      ["apartamento", "sin"],
    ),
    sentenceMcq({
      id: "es-m9-5-q-comprehension",
      prompt: "¿Qué significa '¿Cuál es tu color favorito?'?",
      correctText: "What is your favorite color?",
      distractorsText: [
        "How much is your favorite color?",
        "When is your favorite color?",
        "How is your favorite color?",
      ],
      exercisedAtomSurfaces: ["cuál"],
    }),
    speaking(
      "es-m9-5-speak-vendo",
      "Vendo mi apartamento porque necesito dinero.",
      "I'm selling my apartment because I need money.",
      ["vender", "apartamento", "porque"],
    ),
    listeningCompSentence({
      id: "es-m9-5-lc-vende",
      audioText: "Él vende su carro porque necesita dinero.",
      correctMeaningEn: "He's selling his car because he needs money.",
      distractorsEn: [
        "He's buying his car because he needs money.",
        "He's selling his car because he needs a computer.",
        "He's selling his house because he needs money.",
      ],
      exercisedAtomSurfaces: ["vender", "porque"],
    }),
    selfExplain({
      id: "es-m9-5-self-explain",
      anchorLabel: "You said: Vendo mi apartamento porque necesito dinero.",
      anchorAudioText: "Vendo mi apartamento porque necesito dinero.",
      question: "Why is it porque here, one word with no accent?",
      rule: {
        text: "porque (one word, no accent) introduces a reason or statement; por qué (two words, with accent) is reserved for the question 'why?'.",
      },
      surface: { text: "porque and por qué mean the same thing, so either spelling works." },
      distractor: { text: "porque is used with vender, and por qué is used with every other verb." },
      ruleExplanation:
        "Statement = porque (reason). Question = ¿por qué? (asking why). Same sound, different job, different spelling.",
    }),
    build(
      "es-m9-5-build-por-que-estudias",
      "Build the question: 'Why are you studying Spanish?'",
      "por qué estudias español",
      ["por", "qué", "estudias", "español", "porque"],
      ["por", "qué", "estudias", "español"],
      ["por qué"],
    ),
    ...reviewTail("es-m9-5"),
    infoStep(
      "es-m9-5-info-win",
      "The full question-word set",
      "qué, dónde, cuándo, quién, cómo, cuánto, cuál, por qué — your interrogative set is complete, and porque answers it.",
      "win",
    ),
  ],
};

// ─── es-m9-6 — Listening focus ──────────────────────────────────────────────

const M9_6: LessonContent = {
  id: "es-m9-6",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — questions by ear",
  description: "Questions and answers, by ear only.",
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    listeningCompSentence({
      id: "es-m9-6-lc-comen",
      audioText: "¿Dónde comen ustedes?",
      correctMeaningEn: "Where do you all eat?",
      distractorsEn: ["When do you all eat?", "What do you all eat?", "Where do you all live?"],
      exercisedAtomSurfaces: ["comer", "dónde"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-abrir",
      target: "necesito abrir la ventana",
      tiles: ["necesito", "abrir", "la", "ventana", "abro"],
      correctOrder: ["necesito", "abrir", "la", "ventana"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["abrir"],
    }),
    sentenceMcq({
      id: "es-m9-6-q-comprehension",
      prompt: "Escuchas a alguien decir: 'Vivo cerca del parque.' ¿Qué pregunta responde esta frase?",
      correctText: "¿Dónde vives?",
      distractorsText: ["¿Cuándo vives?", "¿Qué vives?", "¿Cómo vives?"],
      exercisedAtomSurfaces: ["vivir"],
    }),
    listeningCompSentence({
      id: "es-m9-6-lc-lee",
      audioText: "Mi hermana lee el periódico todos los días.",
      correctMeaningEn: "My sister reads the newspaper every day.",
      distractorsEn: [
        "My sister writes the newspaper every day.",
        "My sister reads a letter every day.",
        "My sister reads the newspaper sometimes.",
      ],
      exercisedAtomSurfaces: ["leer", "periódico"],
    }),
    speaking("es-m9-6-speak-leo", "Leo el periódico en el parque.", "I read the newspaper in the park.", [
      "leer",
      "periódico",
    ]),
    listeningCompSentence({
      id: "es-m9-6-lc-vende",
      audioText: "Él vende su carro porque necesita dinero.",
      correctMeaningEn: "He's selling his car because he needs money.",
      distractorsEn: [
        "He's buying his car because he needs money.",
        "He's selling his car because he needs a computer.",
        "He's selling his house because he needs money.",
      ],
      exercisedAtomSurfaces: ["vender", "porque"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-vive",
      target: "ella vive en un apartamento",
      tiles: ["ella", "vive", "en", "un", "apartamento", "vivo"],
      correctOrder: ["ella", "vive", "en", "un", "apartamento"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["vivir", "apartamento"],
    }),
    listeningCompSentence({
      id: "es-m9-6-lc-corres",
      audioText: "¿Por qué corres al banco?",
      correctMeaningEn: "Why are you running to the bank?",
      distractorsEn: [
        "When are you running to the bank?",
        "Why are you walking to the bank?",
        "Why are you running to the park?",
      ],
      exercisedAtomSurfaces: ["correr", "por qué"],
    }),
    sentenceMcq({
      id: "es-m9-6-q-porque",
      prompt: "Tu amigo dice: 'Vendo mi carro porque necesito dinero.' ¿Por qué vende el carro?",
      correctText: "Porque necesita dinero.",
      distractorsText: ["Porque le gusta caminar.", "Porque compra una casa.", "Porque no funciona."],
      exercisedAtomSurfaces: ["porque", "vender"],
    }),
    listeningBuildSentence({
      id: "es-m9-6-lb-comprendes",
      target: "tú comprendes la carta",
      tiles: ["tú", "comprendes", "la", "carta", "comprendo"],
      correctOrder: ["tú", "comprendes", "la", "carta"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["comprender", "carta"],
    }),
    translateStep({
      id: "es-m9-6-tr-escribe",
      promptEn: "My mother writes a letter to her friend.",
      acceptedAnswers: [
        "Mi madre escribe una carta a su amiga",
        "mi madre escribe una carta a su amiga",
        "Mi madre escribe una carta a su amiga.",
        "mi madre escribe una carta a su amiga.",
      ],
      audioText: "Mi madre escribe una carta a su amiga.",
      exercisedAtomSurfaces: ["escribir", "carta"],
    }),
    listeningCompSentence({
      id: "es-m9-6-lc-recibimos",
      audioText: "Recibimos cartas todos los días.",
      correctMeaningEn: "We receive letters every day.",
      distractorsEn: ["We write letters every day.", "We receive newspapers every day.", "We receive letters sometimes."],
      exercisedAtomSurfaces: ["recibir", "carta"],
    }),
    speaking("es-m9-6-speak-cuanto", "¿Cuánto cuesta este periódico?", "How much does this newspaper cost?", [
      "cuánto",
      "periódico",
    ]),
    listeningBuildSentence({
      id: "es-m9-6-lb-beben",
      target: "ellos beben agua con la comida",
      tiles: ["ellos", "beben", "agua", "con", "la", "comida", "bebo"],
      correctOrder: ["ellos", "beben", "agua", "con", "la", "comida"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["beber", "comida", "con"],
    }),
    ...reviewTail("es-m9-6"),
    infoStep(
      "es-m9-6-info-win",
      "Trained ear",
      "You can now catch questions, reasons, and everyday -er/-ir sentences by ear alone.",
      "win",
    ),
  ],
};

// ─── es-m9-7 — Integration ──────────────────────────────────────────────────

const M9_7: LessonContent = {
  id: "es-m9-7",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Dónde vives? — a first interview",
  description: "A first interview: ask, answer, and say it out loud.",
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m9-7-info-entrevista",
      "A first interview",
      "—¿Dónde vives?\n—Vivo en un apartamento en la ciudad.\n—¿Qué comes todos los días?\n—Como con mi familia en casa.\n—¿Por qué estudias español?\n—Porque trabajo en México.\nEvery line runs on your question words and the new -er/-ir endings.",
      "default",
    ),
    sentenceMcq({
      id: "es-m9-7-q-reply1",
      prompt: "'¿Dónde vives?' — pick the natural answer.",
      correctText: "Vivo en la ciudad.",
      distractorsText: ["Como en la ciudad.", "Vivo los lunes.", "Escribo en la ciudad."],
      exercisedAtomSurfaces: ["vivir", "dónde"],
    }),
    build(
      "es-m9-7-build-como",
      "Build: 'I eat with my family.'",
      "como con mi familia",
      ["como", "con", "mi", "familia", "comes"],
      ["como", "con", "mi", "familia"],
      ["comer", "con"],
    ),
    sentenceMcq({
      id: "es-m9-7-q-reply2",
      prompt: "'¿Por qué estudias español?' — pick the answer that gives a reason.",
      correctText: "Porque trabajo en México.",
      distractorsText: ["Con mi familia.", "Los martes.", "En el banco."],
      exercisedAtomSurfaces: ["porque", "por qué"],
    }),
    // The interview continues — new questions, by ear this time.
    dialogueListen({
      id: "es-m9-7-dlg-entrevista",
      lines: [
        { speaker: "María", text: "¿Qué comes todos los días, Diego?" },
        { speaker: "Diego", text: "Como con mi familia en casa." },
        { speaker: "María", text: "¿Y qué bebes?" },
        { speaker: "Diego", text: "Bebo agua con la comida." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Where does Diego eat every day?",
          correctText: "At home with his family",
          distractors: ["At a restaurant with friends", "At school", "At his grandmother's house"],
        },
        {
          id: "q2",
          prompt: "What does Diego drink with his food?",
          correctText: "Water",
          distractors: ["Coffee", "Milk", "Juice"],
        },
      ],
      exercisedAtomSurfaces: ["comer", "beber", "comida", "con", "qué"],
    }),
    translateStep({
      id: "es-m9-7-tr-lees",
      promptEn: "What do you read?",
      acceptedAnswers: ["¿Qué lees?", "¿qué lees?", "Qué lees", "qué lees"],
      audioText: "¿Qué lees?",
      exercisedAtomSurfaces: ["qué", "leer"],
    }),
    speaking("es-m9-7-speak-donde", "¿Dónde vives?", "Where do you live?", ["dónde", "vivir"]),
    sentenceMcq({
      id: "es-m9-7-q-cuando",
      prompt: "'¿Cuándo descansas?' — pick the natural answer.",
      correctText: "Los domingos.",
      distractorsText: ["En el banco.", "Con mi hermano.", "Porque trabajo."],
      exercisedAtomSurfaces: ["cuándo"],
    }),
    speaking("es-m9-7-speak-vivo", "Vivo en un apartamento pequeño.", "I live in a small apartment.", [
      "vivir",
      "apartamento",
    ]),
    sentenceMcq({
      id: "es-m9-7-q-por-que-cartas",
      prompt:
        "Tu amiga te cuenta: 'Escribo cartas todos los domingos.' Quieres saber la razón: '¿___ escribes cartas los domingos?'",
      correctText: "Por qué",
      distractorsText: ["Porque", "Cuánto", "Cuándo"],
      exercisedAtomSurfaces: ["por qué", "escribir", "carta"],
    }),
    build(
      "es-m9-7-build-cual",
      "Build: 'Which apartment is your favorite?'",
      "cuál es tu apartamento favorito",
      ["cuál", "es", "tu", "apartamento", "favorito", "dónde"],
      ["cuál", "es", "tu", "apartamento", "favorito"],
      ["cuál", "apartamento"],
    ),
    listeningCompSentence({
      id: "es-m9-7-lc-comprenden",
      audioText: "Ellos comprenden todo el libro.",
      correctMeaningEn: "They understand the whole book.",
      distractorsEn: [
        "They understand nothing in the book.",
        "They write the whole book.",
        "They read the whole book.",
      ],
      exercisedAtomSurfaces: ["comprender"],
    }),
    speaking("es-m9-7-speak-comprendo", "Comprendo casi todo ahora.", "I understand almost everything now.", [
      "comprender",
    ]),
    sentenceMcq({
      id: "es-m9-7-q-cuanto-carta",
      prompt: "'¿Cuánto cuesta la carta?' — pick the natural answer.",
      correctText: "Cuesta un dólar.",
      distractorsText: ["Vive en la ciudad.", "Escribe cada semana.", "Come con su familia."],
      exercisedAtomSurfaces: ["cuánto", "carta"],
    }),
    ...reviewTail("es-m9-7"),
    infoStep(
      "es-m9-7-info-win",
      "You can hold an interview",
      "You can now ask, answer, and follow a whole conversation about daily life — in Spanish, out loud.",
      "win",
    ),
  ],
};

// ─── es-m9-8 — Mastery test ─────────────────────────────────────────────────

const M9_8_REVIEW_SEED = "es-m9-8-mastery-rev";
const M9_8_REVIEW = pickReviewSurfaces(M9_8_REVIEW_SEED, "m9", 3);

const M9_8: LessonContent = {
  id: "es-m9-8",
  moduleId: "m9",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M9 Mastery Test",
  description: "-er/-ir paradigms and the full question-word set.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m9-8-q-comemos",
      prompt: "Nosotros ___ a las dos. — pick the form that fits.",
      correctText: "comemos",
      distractorsText: ["como", "comes", "comen"],
      exercisedAtomSurfaces: ["comer"],
    }),
    build(
      "es-m9-8-build-vivimos",
      "Build: 'We live in the city.'",
      "vivimos en la ciudad",
      ["vivimos", "en", "la", "ciudad", "vive"],
      ["vivimos", "en", "la", "ciudad"],
      ["vivir"],
    ),
    cloze(
      "es-m9-8-cloze-porque",
      "No como en casa",
      "trabajo mucho.",
      "porque",
      ["porque", "por qué", "sin", "con"],
      "I don't eat at home because I work a lot",
      "No como en casa porque trabajo mucho.",
    ),
    speaking("es-m9-8-speak-cuanto", "¿Cuánto es?", "How much is it?", ["cuánto"]),
    sentenceMcq({
      id: "es-m9-8-q-cuando",
      prompt: "Tu amigo llega cada día a una hora diferente. Quieres saber la hora de hoy: '¿___ llegas hoy?'",
      correctText: "Cuándo",
      distractorsText: ["Cómo", "Cuánto", "Quién"],
      exercisedAtomSurfaces: ["cuándo"],
    }),
    listeningCompSentence({
      id: "es-m9-8-lc-escribe",
      audioText: "Mi madre escribe una carta a su amiga.",
      correctMeaningEn: "My mother writes a letter to her friend.",
      distractorsEn: [
        "My mother reads a letter to her friend.",
        "My mother writes a letter to her sister.",
        "My mother receives a letter from her friend.",
      ],
      exercisedAtomSurfaces: ["escribir", "carta"],
    }),
    translateStep({
      id: "es-m9-8-tr-vende",
      promptEn: "Why are you selling your house?",
      acceptedAnswers: ["¿Por qué vendes tu casa?", "¿por qué vendes tu casa?", "Por qué vendes tu casa", "por qué vendes tu casa"],
      audioText: "¿Por qué vendes tu casa?",
      exercisedAtomSurfaces: ["por qué", "vender"],
    }),
    vocabTextMcq("es-m9-8-vt-recibir", "recibir", ["abrir", "aprender", "comprender"]),
    listeningBuildSentence({
      id: "es-m9-8-lb-beben",
      target: "ellos beben agua con la comida",
      tiles: ["ellos", "beben", "agua", "con", "la", "comida", "bebo"],
      correctOrder: ["ellos", "beben", "agua", "con", "la", "comida"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["beber", "comida", "con"],
    }),
    sentenceMcq({
      id: "es-m9-8-q-cual",
      prompt: "Dos camisas están en la tienda: una cara y otra barata. Le preguntas al vendedor: '¿___ recomienda usted?'",
      correctText: "Cuál",
      distractorsText: ["Cuánto", "Cuándo", "Qué"],
      exercisedAtomSurfaces: ["cuál"],
    }),
    reviewMatchPairs("es-m9-8-mastery", M9_8_REVIEW_SEED, "m9", 6),
    speaking("es-m9-8-speak-rev", M9_8_REVIEW[0], findEsAtomBySurface(M9_8_REVIEW[0])!.gloss, [M9_8_REVIEW[0]]),
    vocabTextMcq("es-m9-8-vt-rev", M9_8_REVIEW[1], [M9_8_REVIEW[0], M9_8_REVIEW[2], "vivir"]),
  ],
};

export const ES_M9_LESSONS: LessonContent[] = [
  M9_1,
  M9_2,
  M9_3,
  M9_4,
  M9_5,
  M9_6,
  M9_7,
  M9_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M9_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m9",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m9",
          prompt: "Nosotros ___ en un apartamento pequeño. — pick the form that fits.",
          correctText: "vivimos",
          distractorsText: ["vivo", "viven", "vives"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m9-1",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-m9-1",
          prompt: "Yo ___ agua con la comida. — pick the form that fits.",
          correctText: "bebo",
          distractorsText: ["bebes", "bebe", "bebemos"],
        }),
    },
    {
      id: "pt-es-m9-2",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-m9-2",
          prompt: "'Y tú, ¿___ trabajas?' — 'Los lunes.'",
          correctText: "cuándo",
          distractorsText: ["qué", "cómo", "cuál"],
        }),
    },
    {
      id: "pt-es-m9-3",
      moduleId: "m9",
      build: () =>
        cloze(
          "pt-es-m9-3",
          "no trabajo hoy",
          "estoy enfermo",
          "porque",
          ["porque", "por qué", "sin", "con"],
          "I'm not working today because I'm sick",
          "No trabajo hoy porque estoy enfermo.",
        ),
    },
    {
      id: "pt-es-m9-4",
      moduleId: "m9",
      build: () =>
        sentenceMcq({
          id: "pt-es-m9-4",
          prompt: "Ella ___ una carta a su amiga. — pick the form that fits.",
          correctText: "escribe",
          distractorsText: ["escribo", "escribes", "escriben"],
        }),
    },
  ],
};
