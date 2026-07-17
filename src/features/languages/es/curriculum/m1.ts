/**
 * Spanish Module 1 — Sonidos y saludos (pronunciation & first words).
 *
 * The learner arrives knowing zero Spanish. M1's job: the five pure vowels,
 * the consonant friends & foes they'll trip on (silent h, soft c, stress),
 * the social survival kit (greet, thank, apologize, part), and numbers 0–10.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m1-1  The five vowels — hola, adiós
 *   es-m1-2  Courtesy — gracias, por favor, perdón (+ the silent h)
 *   es-m1-3  Greetings around the clock — buenos días / tardes / noches, sí & no
 *   es-m1-4  Numbers 0–5 (+ soft c vs hard c)
 *   es-m1-5  Numbers 6–10, y (+ the stress rule)
 *   es-m1-6  Listening focus — hasta luego, mucho gusto, o
 *   es-m1-7  Integration — a first conversation + speaking
 *   es-m1-8  M1 Mastery Test
 *
 * M1 is exempt from the sentence-level listening ratchet (word/phrase-level
 * listening OK here only — script/sound acquisition carve-out per the spine)
 * AND exempt from the compounding-review tail (nothing earlier exists yet —
 * per the 2026-07-16 rewrite brief, that budget goes into extra production
 * and step-type variety instead). Every topic lesson breaks the old
 * MCQ-marathon pattern (m1-4/m1-5 used to run 5-6 vocabMcq in a row) and
 * lands at least one typed `translateStep` plus one `speaking`/`build`.
 */
import type { LessonContent } from "@/features/lesson/types";
import type { PlacementItem } from "@/shared/language/types";
import { atom, type EsAtom } from "../courseAtoms";
import {
  build,
  cloze,
  dialogueListen,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  phrase,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

// ─── M1 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M1_ATOMS: EsAtom[] = [
  // Social survival kit
  atom({ surface: "hola", meaningEn: "hello", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙋", hint: "the h is silent: OH-la" }),
  atom({ surface: "adiós", meaningEn: "goodbye", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🚶", hint: "stress the accented ó: ah-DYOS" }),
  atom({ surface: "gracias", meaningEn: "thank you", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "🙏", hint: "ci sounds like 'see': GRA-syas" }),
  atom({ surface: "por favor", meaningEn: "please", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🤲" }),
  atom({ surface: "perdón", meaningEn: "excuse me / sorry", partOfSpeech: "other", fromModule: "m1", kind: "vocab", hint: "stress the accented ó: per-DON" }),
  atom({ surface: "sí", meaningEn: "yes", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "✅", hint: "the accent distinguishes it from 'si' (if)" }),
  atom({ surface: "no", meaningEn: "no", partOfSpeech: "other", fromModule: "m1", kind: "vocab", emoji: "❌" }),
  atom({ surface: "buenos días", meaningEn: "good morning", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌅", hint: "the í carries the stress: DEE-as" }),
  atom({ surface: "buenas tardes", meaningEn: "good afternoon", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌇" }),
  atom({ surface: "buenas noches", meaningEn: "good evening / good night", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🌙", hint: "ch as in English 'church': NO-ches" }),
  atom({ surface: "hasta luego", meaningEn: "see you later", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🚪", hint: "silent h: AS-ta LWE-go" }),
  atom({ surface: "mucho gusto", meaningEn: "nice to meet you", partOfSpeech: "phrase", fromModule: "m1", kind: "phrase", emoji: "🤝" }),
  // Numbers 0–10
  atom({ surface: "cero", meaningEn: "zero", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "0️⃣", hint: "c before e sounds like s: SE-ro" }),
  atom({ surface: "uno", meaningEn: "one", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "1️⃣" }),
  atom({ surface: "dos", meaningEn: "two", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "2️⃣" }),
  atom({ surface: "tres", meaningEn: "three", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "3️⃣", hint: "tap the r lightly: tress" }),
  atom({ surface: "cuatro", meaningEn: "four", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "4️⃣", hint: "c before u is a hard k: KWA-tro" }),
  atom({ surface: "cinco", meaningEn: "five", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "5️⃣", hint: "soft c then hard c: SEEN-ko" }),
  atom({ surface: "seis", meaningEn: "six", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "6️⃣" }),
  atom({ surface: "siete", meaningEn: "seven", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "7️⃣" }),
  atom({ surface: "ocho", meaningEn: "eight", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "8️⃣" }),
  atom({ surface: "nueve", meaningEn: "nine", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "9️⃣" }),
  atom({ surface: "diez", meaningEn: "ten", partOfSpeech: "noun", fromModule: "m1", kind: "vocab", emoji: "🔟", hint: "z sounds like s in Latin America: dyess" }),
  // Connectors
  atom({ surface: "y", meaningEn: "and", partOfSpeech: "particle", fromModule: "m1", kind: "particle", hint: "sounds like 'ee'" }),
  atom({ surface: "o", meaningEn: "or", partOfSpeech: "particle", fromModule: "m1", kind: "particle" }),
];

// Shared distractor pools. Every emoji here has verified Noto art in the
// bundled subset (src/pub/noto-emoji/svg), checked at authoring time.
const CERO = { surface: "cero", emoji: "0️⃣" };
const UNO = { surface: "uno", emoji: "1️⃣" };
const DOS = { surface: "dos", emoji: "2️⃣" };
const TRES = { surface: "tres", emoji: "3️⃣" };
const CUATRO = { surface: "cuatro", emoji: "4️⃣" };
const CINCO = { surface: "cinco", emoji: "5️⃣" };
const SEIS = { surface: "seis", emoji: "6️⃣" };
const SIETE = { surface: "siete", emoji: "7️⃣" };
const OCHO = { surface: "ocho", emoji: "8️⃣" };
const NUEVE = { surface: "nueve", emoji: "9️⃣" };
const DIEZ = { surface: "diez", emoji: "🔟" };

const HOLA = { surface: "hola", emoji: "🙋" };
const ADIOS = { surface: "adiós", emoji: "🚶" };
const GRACIAS = { surface: "gracias", emoji: "🙏" };
const POR_FAVOR = { surface: "por favor", emoji: "🤲" };
const SI = { surface: "sí", emoji: "✅" };
const NO = { surface: "no", emoji: "❌" };
const BUENAS_TARDES = { surface: "buenas tardes", emoji: "🌇" };
const BUENAS_NOCHES = { surface: "buenas noches", emoji: "🌙" };

// ─── es-m1-1 — The five vowels ──────────────────────────────────────────────

const M1_1: LessonContent = {
  id: "es-m1-1",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "The five vowels — hola, adiós",
  description: "Spanish vowels never change. Meet your first two words.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m1-1-info-vowels",
      "Five vowels, five sounds",
      "Spanish has exactly five vowel sounds, and they never change: a ('ah'), e ('eh'), i ('ee'), o ('oh'), u ('oo'). No long/short pairs, no surprises. Hear them in your first words: hola (OH-la) and adiós (ah-DYOS). Once you know the vowels, you can pronounce almost any Spanish word you can read.",
      "grammar",
    ),
    phrase(
      "es-m1-1-p-hola",
      "hello",
      "hola",
      "Spanish wraps exclamations on both sides: ¡Hola! The upside-down ¡ warns you the excitement is coming.",
      { emoji: "🙋" },
    ),
    vocabMcq("es-m1-1-mcq-hola", { surface: "hola", meaningEn: "hello", emoji: "🙋" }, [ADIOS, GRACIAS, SI]),
    speaking("es-m1-1-speak-hola", "hola", "hello", ["hola"]),
    phrase("es-m1-1-p-adios", "goodbye", "adiós", undefined, { emoji: "🚶" }),
    sentenceMcq({
      id: "es-m1-1-q-adios",
      prompt: "You're leaving a shop. Which word do you say on your way out?",
      correctText: "adiós",
      distractorsText: ["hola", "gracias", "sí"],
      explanation: "The parting word — the written accent pulls the stress onto its last syllable.",
      exercisedAtomSurfaces: ["adiós"],
    }),
    build(
      "es-m1-1-build-hola",
      "Build: 'Hello!'",
      "hola",
      ["hola", "adiós", "gracias", "sí"],
      ["hola"],
      ["hola"],
    ),
    listeningCompSentence({
      id: "es-m1-1-lc-adios",
      audioText: "adiós",
      correctMeaningEn: "goodbye",
      distractorsEn: ["hello", "thank you", "yes"],
      exercisedAtomSurfaces: ["adiós"],
    }),
    translateStep({
      id: "es-m1-1-tr-adios",
      promptEn: "Goodbye",
      acceptedAnswers: ["adiós", "Adiós", "adios", "Adios", "¡Adiós!", "adiós."],
      audioText: "adiós",
      exercisedAtomSurfaces: ["adiós"],
    }),
    vocabMcq("es-m1-1-mcq-adios", { surface: "adiós", meaningEn: "goodbye", emoji: "🚶" }, [HOLA, GRACIAS, SI]),
    speaking("es-m1-1-speak-adios", "adiós", "goodbye", ["adiós"]),
    listeningCompSentence({
      id: "es-m1-1-lc-hola",
      audioText: "hola",
      correctMeaningEn: "hello",
      distractorsEn: ["goodbye", "please", "no"],
      exercisedAtomSurfaces: ["hola"],
    }),
    selfExplain({
      id: "es-m1-1-se-stress",
      anchorLabel: "You just typed: adiós (ah-DYOS)",
      anchorAudioText: "adiós",
      question: "Why is the stress on the last syllable, -DYOS, instead of the second-to-last?",
      rule: { text: "The written accent mark on ó always marks the stressed syllable, overriding the normal ending-based rule." },
      surface: { text: "Words that end in s are always stressed on the last syllable." },
      distractor: { text: "Adiós is a loanword, so it keeps its original foreign stress instead of a Spanish rule." },
      ruleExplanation: "A written accent always wins: it marks the stressed syllable no matter what the letter-ending rule would otherwise predict.",
    }),
    infoStep(
      "es-m1-1-info-win",
      "Two words, zero guesswork",
      "You can now greet someone and take your leave — and you'll never mispronounce a Spanish vowel again.",
      "win",
    ),
  ],
};

// ─── es-m1-2 — Courtesy words ───────────────────────────────────────────────

const M1_2: LessonContent = {
  id: "es-m1-2",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Courtesy — gracias, por favor, perdón",
  description: "Thank, ask politely, apologize — and skip every silent h.",
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m1-2-info-h",
      "The silent h",
      "The letter h is always silent in Spanish: hola is OH-la, hasta is AS-ta. Only the pair ch makes a sound (as in English 'church'). If you see a lone h, skip right over it.",
      "grammar",
    ),
    phrase("es-m1-2-p-gracias", "thank you", "gracias", undefined, { emoji: "🙏" }),
    vocabMcq("es-m1-2-mcq-gracias", { surface: "gracias", meaningEn: "thank you", emoji: "🙏" }, [POR_FAVOR, HOLA, ADIOS]),
    speaking("es-m1-2-speak-gracias", "gracias", "thank you", ["gracias"]),
    phrase("es-m1-2-p-porfavor", "please", "por favor", undefined, { emoji: "🤲" }),
    sentenceMcq({
      id: "es-m1-2-q-porfavor",
      prompt: "You're asking a waiter for the check, politely. Which word do you add?",
      correctText: "por favor",
      distractorsText: ["gracias", "perdón", "sí"],
      exercisedAtomSurfaces: ["por favor"],
    }),
    build(
      "es-m1-2-build-porfavor",
      "Build: 'Please.'",
      "por favor",
      ["por", "favor", "gracias", "perdón"],
      ["por", "favor"],
      ["por favor"],
    ),
    listeningCompSentence({
      id: "es-m1-2-lc-porfavor",
      audioText: "por favor",
      correctMeaningEn: "please",
      distractorsEn: ["thank you", "sorry", "hello"],
      exercisedAtomSurfaces: ["por favor"],
    }),
    phrase("es-m1-2-p-perdon", "excuse me / sorry", "perdón"),
    vocabTextMcq(
      "es-m1-2-vtmcq-perdon",
      "perdón",
      ["gracias", "hola", "sí"],
      "You bump into someone on the bus. What do you say?",
    ),
    translateStep({
      id: "es-m1-2-tr-perdon",
      promptEn: "Excuse me / sorry",
      acceptedAnswers: ["perdón", "Perdón", "perdon", "Perdon", "perdón.", "¡Perdón!"],
      audioText: "perdón",
      exercisedAtomSurfaces: ["perdón"],
    }),
    sentenceMcq({
      id: "es-m1-2-q-gracias2",
      prompt: "Someone compliments your Spanish. How do you respond?",
      correctText: "gracias",
      distractorsText: ["perdón", "no", "adiós"],
      explanation: "The thanking word — its ci sounds like 'see' in Latin America.",
      exercisedAtomSurfaces: ["gracias"],
    }),
    speaking("es-m1-2-speak-perdon", "perdón", "excuse me / sorry", ["perdón"]),
    vocabMcq("es-m1-2-mcq-porfavor", { surface: "por favor", meaningEn: "please", emoji: "🤲" }, [GRACIAS, HOLA, SI]),
    infoStep(
      "es-m1-2-info-win",
      "Politeness unlocked",
      "You can now greet, thank, and apologize like a local — and every silent h stays silent.",
      "win",
    ),
  ],
};

// ─── es-m1-3 — Greetings around the clock ───────────────────────────────────

const M1_3: LessonContent = {
  id: "es-m1-3",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Around the clock — buenos días, sí & no",
  description: "The three time-of-day greetings, plus yes and no.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m1-3-info-daygreetings",
      "Greetings around the clock",
      "Buenos días until midday, buenas tardes through the afternoon and early evening, buenas noches after dark — the last one both greets people and says good night. Notice the endings pair up: buenos with días, buenas with tardes and noches.",
      "culture",
    ),
    phrase("es-m1-3-p-buenosdias", "good morning", "buenos días", undefined, { emoji: "🌅" }),
    vocabMcq("es-m1-3-mcq-buenosdias", { surface: "buenos días", meaningEn: "good morning", emoji: "🌅" }, [BUENAS_TARDES, BUENAS_NOCHES, HOLA]),
    speaking("es-m1-3-speak-buenosdias", "buenos días", "good morning", ["buenos días"]),
    phrase("es-m1-3-p-buenastardes", "good afternoon", "buenas tardes", undefined, { emoji: "🌇" }),
    sentenceMcq({
      id: "es-m1-3-q-tarde",
      prompt: "It's 4 in the afternoon. Which greeting fits?",
      correctText: "buenas tardes",
      distractorsText: ["buenos días", "buenas noches", "por favor"],
      explanation: "For the afternoon and early evening.",
      exercisedAtomSurfaces: ["buenas tardes"],
    }),
    build(
      "es-m1-3-build-buenastardes",
      "Build: 'Good afternoon.'",
      "buenas tardes",
      ["buenas", "tardes", "buenos", "noches"],
      ["buenas", "tardes"],
      ["buenas tardes"],
    ),
    listeningCompSentence({
      id: "es-m1-3-lc-buenosdias",
      audioText: "buenos días",
      correctMeaningEn: "good morning",
      distractorsEn: ["good afternoon", "good night", "see you later"],
      exercisedAtomSurfaces: ["buenos días"],
    }),
    phrase("es-m1-3-p-buenasnoches", "good evening / good night", "buenas noches", undefined, { emoji: "🌙" }),
    sentenceMcq({
      id: "es-m1-3-q-noche",
      prompt: "It's 10 at night and you're heading to bed. What do you say?",
      correctText: "buenas noches",
      distractorsText: ["buenos días", "buenas tardes", "mucho gusto"],
      explanation: "After dark — it doubles as 'good night' when leaving or going to bed.",
      exercisedAtomSurfaces: ["buenas noches"],
    }),
    translateStep({
      id: "es-m1-3-tr-buenasnoches",
      promptEn: "Good night",
      acceptedAnswers: ["buenas noches", "Buenas noches", "buenas noches.", "Buenas noches."],
      audioText: "buenas noches",
      exercisedAtomSurfaces: ["buenas noches"],
    }),
    vocabMcq("es-m1-3-mcq-si", { surface: "sí", meaningEn: "yes", emoji: "✅" }, [NO, HOLA, GRACIAS]),
    speaking("es-m1-3-speak-si", "sí", "yes", ["sí"]),
    vocabMcq("es-m1-3-mcq-no", { surface: "no", meaningEn: "no", emoji: "❌" }, [SI, ADIOS, GRACIAS]),
    build(
      "es-m1-3-build-no",
      "Build: 'No.'",
      "no",
      ["no", "sí", "adiós", "hola"],
      ["no"],
      ["no"],
    ),
    sentenceMcq({
      id: "es-m1-3-q-no",
      prompt: "Someone asks you a question and the answer is no. Which word do you say?",
      correctText: "no",
      distractorsText: ["sí", "gracias", "adiós"],
      exercisedAtomSurfaces: ["no"],
    }),
    listeningCompSentence({
      id: "es-m1-3-lc-no",
      audioText: "no",
      correctMeaningEn: "no",
      distractorsEn: ["yes", "please", "goodbye"],
      exercisedAtomSurfaces: ["no"],
    }),
    infoStep(
      "es-m1-3-info-win",
      "Any hour, any answer",
      "You can now greet someone at any hour of the day and answer yes or no with confidence.",
      "win",
    ),
  ],
};

// ─── es-m1-4 — Numbers 0–5 ──────────────────────────────────────────────────

const M1_4: LessonContent = {
  id: "es-m1-4",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Números 0–5",
  description: "Count to five — and meet the two faces of the letter c.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m1-4-info-softc",
      "Soft c, hard c",
      "Before e or i, the letter c goes soft — in Latin America it sounds like s: cero is SE-ro, cinco is SEEN-ko. Before a, o, u it's a hard k: cuatro is KWA-tro. One letter, two sounds, fully predictable from the vowel that follows.",
      "grammar",
    ),
    vocabMcq("es-m1-4-mcq-uno", { surface: "uno", meaningEn: "one", emoji: "1️⃣" }, [DOS, TRES, CERO]),
    speaking("es-m1-4-speak-uno", "uno", "one", ["uno"]),
    vocabMcq("es-m1-4-mcq-dos", { surface: "dos", meaningEn: "two", emoji: "2️⃣" }, [UNO, CUATRO, CINCO]),
    build(
      "es-m1-4-build-unodos",
      "Build the count: uno, dos",
      "uno dos",
      ["uno", "dos", "tres", "cuatro"],
      ["uno", "dos"],
      ["uno", "dos"],
    ),
    vocabMcq("es-m1-4-mcq-tres", { surface: "tres", meaningEn: "three", emoji: "3️⃣" }, [DOS, CUATRO, CINCO]),
    speaking("es-m1-4-speak-tres", "tres", "three", ["tres"]),
    vocabMcq("es-m1-4-mcq-cero", { surface: "cero", meaningEn: "zero", emoji: "0️⃣" }, [UNO, DOS, DIEZ]),
    translateStep({
      id: "es-m1-4-tr-cero",
      promptEn: "Zero",
      acceptedAnswers: ["cero", "Cero", "cero."],
      audioText: "cero",
      exercisedAtomSurfaces: ["cero"],
    }),
    vocabMcq("es-m1-4-mcq-cuatro", { surface: "cuatro", meaningEn: "four", emoji: "4️⃣" }, [CINCO, SEIS, TRES]),
    build(
      "es-m1-4-build-trescuatro",
      "Build the count: tres, cuatro",
      "tres cuatro",
      ["tres", "cuatro", "cinco", "dos"],
      ["tres", "cuatro"],
      ["tres", "cuatro"],
    ),
    vocabMcq("es-m1-4-mcq-cinco", { surface: "cinco", meaningEn: "five", emoji: "5️⃣" }, [CUATRO, SEIS, SIETE]),
    sentenceMcq({
      id: "es-m1-4-q-count",
      prompt: "Cuenta: uno, dos, ___.",
      correctText: "tres",
      distractorsText: ["cuatro", "cinco", "cero"],
      explanation: "Counting up from dos, the next number is tres.",
      exercisedAtomSurfaces: ["tres"],
    }),
    build(
      "es-m1-4-build-missing",
      "Fill in the count: tres, cuatro, ___",
      "cinco",
      ["cinco", "dos", "uno", "cero"],
      ["cinco"],
      ["cinco"],
    ),
    translateStep({
      id: "es-m1-4-tr-digits",
      promptEn: "Say your number: zero, three, five",
      acceptedAnswers: ["cero, tres, cinco", "Cero, tres, cinco", "cero tres cinco", "cero, tres, cinco."],
      audioText: "cero, tres, cinco",
      exercisedAtomSurfaces: ["cero", "tres", "cinco"],
    }),
    listeningCompSentence({
      id: "es-m1-4-lc-cuatro",
      audioText: "cuatro",
      correctMeaningEn: "four",
      distractorsEn: ["five", "two", "zero"],
      exercisedAtomSurfaces: ["cuatro"],
    }),
    speaking("es-m1-4-speak-cinco", "cinco", "five", ["cinco"]),
    infoStep(
      "es-m1-4-info-win",
      "Six numbers deep",
      "You can now count from zero to five — and read the c on any Spanish word correctly.",
      "win",
    ),
  ],
};

// ─── es-m1-5 — Numbers 6–10 and y ───────────────────────────────────────────

const M1_5: LessonContent = {
  id: "es-m1-5",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Números 6–10, y",
  description: "Finish the first ten — and learn where the stress falls.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m1-5-info-stress",
      "Where the stress falls",
      "If a word ends in a vowel, n, or s, stress the second-to-last syllable: SIE-te, O-cho, NUE-ve. A written accent overrides everything — adiós stresses its ó because the mark says so. Two rules, and the accent mark always wins.",
      "grammar",
    ),
    vocabMcq("es-m1-5-mcq-seis", { surface: "seis", meaningEn: "six", emoji: "6️⃣" }, [SIETE, OCHO, NUEVE]),
    speaking("es-m1-5-speak-seis", "seis", "six", ["seis"]),
    vocabMcq("es-m1-5-mcq-siete", { surface: "siete", meaningEn: "seven", emoji: "7️⃣" }, [SEIS, OCHO, DIEZ]),
    build(
      "es-m1-5-build-seissiete",
      "Build the count: seis, siete",
      "seis siete",
      ["seis", "siete", "ocho", "nueve"],
      ["seis", "siete"],
      ["seis", "siete"],
    ),
    vocabMcq("es-m1-5-mcq-ocho", { surface: "ocho", meaningEn: "eight", emoji: "8️⃣" }, [NUEVE, SEIS, CINCO]),
    translateStep({
      id: "es-m1-5-tr-ocho",
      promptEn: "Eight",
      acceptedAnswers: ["ocho", "Ocho", "ocho."],
      audioText: "ocho",
      exercisedAtomSurfaces: ["ocho"],
    }),
    vocabMcq("es-m1-5-mcq-nueve", { surface: "nueve", meaningEn: "nine", emoji: "9️⃣" }, [OCHO, DIEZ, SIETE]),
    build(
      "es-m1-5-build-ochonueve",
      "Build the count: ocho, nueve",
      "ocho nueve",
      ["ocho", "nueve", "diez", "seis"],
      ["ocho", "nueve"],
      ["ocho", "nueve"],
    ),
    vocabMcq("es-m1-5-mcq-diez", { surface: "diez", meaningEn: "ten", emoji: "🔟" }, [NUEVE, CERO, OCHO]),
    sentenceMcq({
      id: "es-m1-5-q-count",
      prompt: "Cuenta: ocho, nueve, ___.",
      correctText: "diez",
      distractorsText: ["siete", "seis", "cinco"],
      explanation: "Counting up from nueve, the next number is diez.",
      exercisedAtomSurfaces: ["diez"],
    }),
    speaking("es-m1-5-speak-diez", "diez", "ten", ["diez"]),
    cloze(
      "es-m1-5-cloze-y",
      "cuatro",
      "cinco",
      "y",
      ["y", "o", "no", "sí"],
      "four and five",
      "cuatro y cinco",
      "Joins two things together, like English 'and'.",
    ),
    build(
      "es-m1-5-build-seisysiete",
      "Build: 'Six and seven.'",
      "seis y siete",
      ["seis", "y", "siete", "o"],
      ["seis", "y", "siete"],
      ["seis", "siete", "y"],
    ),
    translateStep({
      id: "es-m1-5-tr-digits",
      promptEn: "Say: six, seven, eight",
      acceptedAnswers: ["seis, siete, ocho", "Seis, siete, ocho", "seis siete ocho", "seis, siete, ocho."],
      audioText: "seis, siete, ocho",
      exercisedAtomSurfaces: ["seis", "siete", "ocho"],
    }),
    listeningCompSentence({
      id: "es-m1-5-lc-nueve",
      audioText: "nueve",
      correctMeaningEn: "nine",
      distractorsEn: ["eight", "ten", "six"],
      exercisedAtomSurfaces: ["nueve"],
    }),
    sentenceMcq({
      id: "es-m1-5-q-count2",
      prompt: "¿Qué número sigue? cinco, seis, ___",
      correctText: "siete",
      distractorsText: ["ocho", "nueve", "cuatro"],
      exercisedAtomSurfaces: ["siete"],
    }),
    speaking("es-m1-5-speak-seisysiete", "seis y siete", "six and seven", ["seis", "y", "siete"]),
    infoStep(
      "es-m1-5-info-win",
      "Ten numbers, zero guessing",
      "You can now count from zero to ten, join two numbers with y, and stress any Spanish word correctly.",
      "win",
    ),
  ],
};

// ─── es-m1-6 — Listening focus ──────────────────────────────────────────────

const M1_6: LessonContent = {
  id: "es-m1-6",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — train your ear",
  description: "Two parting phrases, o, and pure listening practice.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m1-6-info-intro",
      "Train your ear",
      "Everything from here is meant to be heard first, read second. Play each clip, listen for the vowels you already know, then confirm what you understood.",
      "default",
    ),
    phrase(
      "es-m1-6-p-hastaluego",
      "see you later",
      "hasta luego",
      "Literally 'until later' — the everyday way to part from someone you'll see again.",
      { emoji: "🚪" },
    ),
    listeningCompSentence({
      id: "es-m1-6-lc-hastaluego",
      audioText: "hasta luego",
      correctMeaningEn: "see you later",
      distractorsEn: ["nice to meet you", "good night", "thank you"],
      exercisedAtomSurfaces: ["hasta luego"],
    }),
    speaking("es-m1-6-speak-hastaluego", "hasta luego", "see you later", ["hasta luego"]),
    phrase("es-m1-6-p-muchogusto", "nice to meet you", "mucho gusto", undefined, { emoji: "🤝" }),
    listeningCompSentence({
      id: "es-m1-6-lc-muchogusto",
      audioText: "mucho gusto",
      correctMeaningEn: "nice to meet you",
      distractorsEn: ["see you later", "good afternoon", "please"],
      exercisedAtomSurfaces: ["mucho gusto"],
    }),
    listeningBuildSentence({
      id: "es-m1-6-lb-buenosdias",
      target: "buenos días",
      tiles: ["buenos", "días", "buenas", "noches"],
      correctOrder: ["buenos", "días"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["buenos días"],
    }),
    build(
      "es-m1-6-build-muchogusto",
      "Build: 'Nice to meet you.'",
      "mucho gusto",
      ["mucho", "gusto", "hasta", "luego"],
      ["mucho", "gusto"],
      ["mucho gusto"],
    ),
    listeningCompSentence({
      id: "es-m1-6-lc-adios",
      audioText: "adiós",
      correctMeaningEn: "goodbye",
      distractorsEn: ["hello", "yes", "see you later"],
      exercisedAtomSurfaces: ["adiós"],
    }),
    listeningBuildSentence({
      id: "es-m1-6-lb-buenasnoches",
      target: "buenas noches",
      tiles: ["buenas", "noches", "buenos", "tardes"],
      correctOrder: ["buenas", "noches"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["buenas noches"],
    }),
    listeningCompSentence({
      id: "es-m1-6-lc-cinco",
      audioText: "cinco",
      correctMeaningEn: "five",
      distractorsEn: ["six", "zero", "seven"],
      exercisedAtomSurfaces: ["cinco"],
    }),
    cloze(
      "es-m1-6-cloze-o",
      "¿dos",
      "tres?",
      "o",
      ["o", "y", "sí", "no"],
      "two or three?",
      "¿dos o tres?",
      "Offers a choice between the two, like English 'or'.",
    ),
    build(
      "es-m1-6-build-cuatrooocinco",
      "Build: 'Four or five.'",
      "cuatro o cinco",
      ["cuatro", "o", "cinco", "y"],
      ["cuatro", "o", "cinco"],
      ["cuatro", "cinco", "o"],
    ),
    translateStep({
      id: "es-m1-6-tr-digits",
      promptEn: "Say: six or seven",
      acceptedAnswers: ["seis o siete", "Seis o siete", "seis o siete."],
      audioText: "seis o siete",
      exercisedAtomSurfaces: ["seis", "o", "siete"],
    }),
    listeningCompSentence({
      id: "es-m1-6-lc-hola",
      audioText: "hola",
      correctMeaningEn: "hello",
      distractorsEn: ["goodbye", "please", "no"],
      exercisedAtomSurfaces: ["hola"],
    }),
    speaking("es-m1-6-speak-muchogusto", "mucho gusto", "nice to meet you", ["mucho gusto"]),
    listeningBuildSentence({
      id: "es-m1-6-lb-hastaluego",
      target: "hasta luego",
      tiles: ["hasta", "luego", "mucho", "gusto"],
      correctOrder: ["hasta", "luego"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hasta luego"],
    }),
    infoStep(
      "es-m1-6-info-win",
      "Your ear is warming up",
      "You can now catch a farewell, an introduction, and a choice between numbers — by ear alone.",
      "win",
    ),
  ],
};

// ─── es-m1-7 — Integration dialogue ─────────────────────────────────────────

const M1_7: LessonContent = {
  id: "es-m1-7",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En la calle — a first conversation",
  description: "Put the whole module together and say it out loud.",
  estimatedMinutes: 9,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m1-7-info-dialogo",
      "A meeting on the street",
      "Two people meet, greet, and part — every line is made of words you already know. Listen first, then answer.",
      "default",
    ),
    dialogueListen({
      id: "es-m1-7-dialogue-calle",
      lines: [
        { speaker: "Ana", text: "¡Hola! ¡Buenos días!" },
        { speaker: "Luis", text: "¡Hola! Mucho gusto." },
        { speaker: "Ana", text: "Mucho gusto. ¡Adiós!" },
        { speaker: "Luis", text: "¡Adiós! ¡Hasta luego!" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ana say first?",
          correctText: "Hello! Good morning!",
          distractors: ["Goodbye! See you later!", "Nice to meet you!", "Thank you! Please!"],
        },
        {
          id: "q2",
          prompt: "How does Luis respond when he's introduced?",
          correctText: "Nice to meet you.",
          distractors: ["Good night.", "Excuse me.", "Yes."],
        },
      ],
      exercisedAtomSurfaces: ["hola", "buenos días", "mucho gusto", "adiós", "hasta luego"],
    }),
    sentenceMcq({
      id: "es-m1-7-q-reply",
      prompt: "Someone greets you: '¡Hola! ¡Buenos días!' — pick the natural reply.",
      correctText: "¡Buenos días!",
      distractorsText: ["¡Buenas noches!", "Perdón.", "No."],
      exercisedAtomSurfaces: ["buenos días"],
    }),
    build(
      "es-m1-7-build-hastaluego",
      "Build: 'See you later.'",
      "hasta luego",
      ["hasta", "luego", "mucho", "gusto"],
      ["hasta", "luego"],
      ["hasta luego"],
    ),
    sentenceMcq({
      id: "es-m1-7-q-meet",
      prompt: "You've just been introduced to someone. What do you say?",
      correctText: "mucho gusto",
      distractorsText: ["hasta luego", "buenas noches", "por favor"],
      exercisedAtomSurfaces: ["mucho gusto"],
    }),
    vocabMcq("es-m1-7-mcq-no", { surface: "no", meaningEn: "no", emoji: "❌" }, [SI, ADIOS, GRACIAS]),
    translateStep({
      id: "es-m1-7-tr-gracias",
      promptEn: "Thank you",
      acceptedAnswers: ["gracias", "Gracias", "gracias.", "¡Gracias!"],
      audioText: "gracias",
      exercisedAtomSurfaces: ["gracias"],
    }),
    speaking("es-m1-7-speak-muchogusto", "mucho gusto", "nice to meet you", ["mucho gusto"]),
    translateStep({
      id: "es-m1-7-tr-porfavor",
      promptEn: "Please",
      acceptedAnswers: ["por favor", "Por favor", "por favor.", "Por favor."],
      audioText: "por favor",
      exercisedAtomSurfaces: ["por favor"],
    }),
    speaking("es-m1-7-speak-saludo", "¡Hola! ¡Buenos días!", "Hello! Good morning!", ["hola", "buenos días"]),
    build(
      "es-m1-7-build-seisysiete",
      "Say: 'Six and seven.'",
      "seis y siete",
      ["seis", "y", "siete", "o"],
      ["seis", "y", "siete"],
      ["seis", "siete", "y"],
    ),
    sentenceMcq({
      id: "es-m1-7-q-si",
      prompt: "Someone asks if you're ready and the answer is yes. What do you say?",
      correctText: "sí",
      distractorsText: ["no", "gracias", "adiós"],
      exercisedAtomSurfaces: ["sí"],
    }),
    listeningCompSentence({
      id: "es-m1-7-lc-buenasnoches",
      audioText: "buenas noches",
      correctMeaningEn: "good evening / good night",
      distractorsEn: ["good morning", "good afternoon", "see you later"],
      exercisedAtomSurfaces: ["buenas noches"],
    }),
    translateStep({
      id: "es-m1-7-tr-si",
      promptEn: "Yes",
      acceptedAnswers: ["sí", "Sí", "si", "Si", "sí."],
      audioText: "sí",
      exercisedAtomSurfaces: ["sí"],
    }),
    sentenceMcq({
      id: "es-m1-7-q-parting",
      prompt: "The conversation is over. What do you say as you part?",
      correctText: "adiós",
      distractorsText: ["hola", "gracias", "sí"],
      exercisedAtomSurfaces: ["adiós"],
    }),
    speaking("es-m1-7-speak-gracias", "gracias", "thank you", ["gracias"]),
    infoStep(
      "es-m1-7-info-win",
      "Your first real conversation",
      "You can now open, carry, and close a short conversation in Spanish — start to finish, out loud.",
      "win",
    ),
  ],
};

// ─── es-m1-8 — Mastery test ─────────────────────────────────────────────────

const M1_8: LessonContent = {
  id: "es-m1-8",
  moduleId: "m1",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M1 Mastery Test",
  description: "Greetings, courtesy, numbers 0–10, y & o.",
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m1-8-q-hola",
      prompt: "Which word means 'hello'?",
      correctText: "hola",
      distractorsText: ["adiós", "gracias", "perdón"],
      exercisedAtomSurfaces: ["hola"],
    }),
    vocabMcq("es-m1-8-mcq-nueve", { surface: "nueve", meaningEn: "nine", emoji: "9️⃣" }, [SIETE, OCHO, DIEZ]),
    translateStep({
      id: "es-m1-8-tr-adios",
      promptEn: "Goodbye",
      acceptedAnswers: ["adiós", "Adiós", "adios", "Adios", "¡Adiós!", "adiós."],
      audioText: "adiós",
      exercisedAtomSurfaces: ["adiós"],
    }),
    cloze(
      "es-m1-8-cloze-y",
      "siete",
      "ocho",
      "y",
      ["y", "o", "no", "sí"],
      "seven and eight",
      "siete y ocho",
    ),
    listeningCompSentence({
      id: "es-m1-8-lc-buenasnoches",
      audioText: "buenas noches",
      correctMeaningEn: "good evening / good night",
      distractorsEn: ["good morning", "good afternoon", "see you later"],
      exercisedAtomSurfaces: ["buenas noches"],
    }),
    speaking("es-m1-8-speak-gracias", "gracias", "thank you", ["gracias"]),
    sentenceMcq({
      id: "es-m1-8-q-perdon",
      prompt: "You step on someone's foot. What do you say?",
      correctText: "perdón",
      distractorsText: ["mucho gusto", "gracias", "sí"],
      exercisedAtomSurfaces: ["perdón"],
    }),
    listeningBuildSentence({
      id: "es-m1-8-lb-buenastardes",
      target: "buenas tardes",
      tiles: ["buenas", "tardes", "noches", "días"],
      correctOrder: ["buenas", "tardes"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["buenas tardes"],
    }),
    vocabMcq("es-m1-8-mcq-porfavor", { surface: "por favor", meaningEn: "please", emoji: "🤲" }, [GRACIAS, HOLA, ADIOS]),
    build(
      "es-m1-8-build-seisosiete",
      "Build: 'Six or seven.'",
      "seis o siete",
      ["seis", "o", "siete", "y"],
      ["seis", "o", "siete"],
      ["seis", "siete", "o"],
    ),
    sentenceMcq({
      id: "es-m1-8-q-muchogusto",
      prompt: "You've just been introduced to someone. What do you say?",
      correctText: "mucho gusto",
      distractorsText: ["hasta luego", "buenas noches", "por favor"],
      exercisedAtomSurfaces: ["mucho gusto"],
    }),
    vocabMcq("es-m1-8-mcq-cero", { surface: "cero", meaningEn: "zero", emoji: "0️⃣" }, [UNO, DOS, DIEZ]),
  ],
};

export const ES_M1_LESSONS: LessonContent[] = [
  M1_1,
  M1_2,
  M1_3,
  M1_4,
  M1_5,
  M1_6,
  M1_7,
  M1_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M1_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m1",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m1",
          prompt: "'Thank you' — which is correct?",
          correctText: "gracias",
          distractorsText: ["hola", "adiós", "por favor"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m1-1",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-es-m1-1",
          prompt: "'Hello' — which is correct?",
          correctText: "hola",
          distractorsText: ["adiós", "gracias", "perdón"],
        }),
    },
    {
      id: "pt-es-m1-2",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-es-m1-2",
          prompt: "It's late at night. Which greeting fits?",
          correctText: "buenas noches",
          distractorsText: ["buenos días", "buenas tardes", "hasta luego"],
        }),
    },
    {
      id: "pt-es-m1-3",
      moduleId: "m1",
      build: () =>
        sentenceMcq({
          id: "pt-es-m1-3",
          prompt: "'Seven' — which is correct?",
          correctText: "siete",
          distractorsText: ["seis", "nueve", "cinco"],
        }),
    },
    {
      id: "pt-es-m1-4",
      moduleId: "m1",
      build: () =>
        cloze(
          "pt-es-m1-4",
          "cuatro",
          "cinco",
          "y",
          ["y", "o", "no", "sí"],
          "four and five",
          "cuatro y cinco",
        ),
    },
  ],
};
