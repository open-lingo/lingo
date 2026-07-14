/**
 * Spanish Module 4 — Descripciones (adjective agreement, ser + adj, colors).
 *
 * The learner can name things (m3) and say who someone is (m2). M4's job:
 * describe them — ser + adjective, the -o/-a/-s agreement machine,
 * adjective-after-noun order, the six core colors, muy, and pero.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m4-1  Ser + adjective — grande, pequeño, nuevo, viejo
 *   es-m4-2  Agreement — alto/alta, bonito, feo
 *   es-m4-3  Los colores — the six core colors
 *   es-m4-4  El carro, el perro, el gato — adjective after the noun
 *   es-m4-5  Opinions — bueno, malo, muy, pero
 *   es-m4-6  Listening focus — fácil, difícil (short phrases OK in m2–m4)
 *   es-m4-7  Integration — cognates: interesante, inteligente, simpático
 *   es-m4-8  M4 Mastery Test
 *
 * Feminine/plural forms (alta, roja, pequeños…) are taught as agreement
 * patterns inside steps, never as separate atoms (spine m4 note).
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
import "./m3";

const COURSE_ID = "mock-1";

// ─── M4 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M4_ATOMS: EsAtom[] = [
  // Size / age / quality adjectives
  atom({ surface: "grande", meaningEn: "big", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🐘" }),
  atom({ surface: "pequeño", meaningEn: "small (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🤏" }),
  atom({ surface: "alto", meaningEn: "tall (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "bajo", meaningEn: "short (height) (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "bonito", meaningEn: "pretty (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🌸" }),
  atom({ surface: "feo", meaningEn: "ugly (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "nuevo", meaningEn: "new (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🆕" }),
  atom({ surface: "viejo", meaningEn: "old (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "bueno", meaningEn: "good (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "👍" }),
  atom({ surface: "malo", meaningEn: "bad (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "👎" }),
  // Invariant adjectives (-e / consonant endings)
  atom({ surface: "fácil", meaningEn: "easy", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "difícil", meaningEn: "difficult", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "interesante", meaningEn: "interesting", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab" }),
  atom({ surface: "inteligente", meaningEn: "intelligent", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🧠" }),
  atom({ surface: "simpático", meaningEn: "nice / friendly (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "😊" }),
  atom({ surface: "muy", meaningEn: "very", partOfSpeech: "adverb", fromModule: "m4", kind: "vocab" }),
  // Colors
  atom({ surface: "rojo", meaningEn: "red (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🟥" }),
  atom({ surface: "azul", meaningEn: "blue", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🔵" }),
  atom({ surface: "verde", meaningEn: "green", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🟢" }),
  atom({ surface: "amarillo", meaningEn: "yellow (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "🟡" }),
  atom({ surface: "negro", meaningEn: "black (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "⚫" }),
  atom({ surface: "blanco", meaningEn: "white (m)", partOfSpeech: "adjective", fromModule: "m4", kind: "vocab", emoji: "⚪" }),
  // Nouns
  atom({ surface: "color", meaningEn: "color", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🎨" }),
  atom({ surface: "carro", meaningEn: "car", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🚗" }),
  atom({ surface: "perro", meaningEn: "dog", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🐶" }),
  atom({ surface: "gato", meaningEn: "cat", partOfSpeech: "noun", fromModule: "m4", kind: "vocab", gender: "m", emoji: "🐱" }),
  // Connector
  atom({ surface: "pero", meaningEn: "but", partOfSpeech: "particle", fromModule: "m4", kind: "particle" }),
];

// Shared distractor pool for word-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg):
// 1f7e5 1f535 1f7e2 1f7e1 26ab 26aa 1f697 1f436 1f431 1f418 1f90f 1f3e0,
// checked at authoring time. (🔴 has no file in the subset — rojo uses
// the red square 🟥 instead.)
const ROJO = { surface: "rojo", emoji: "🟥" };
const AZUL = { surface: "azul", emoji: "🔵" };
const VERDE = { surface: "verde", emoji: "🟢" };
const AMARILLO = { surface: "amarillo", emoji: "🟡" };
const NEGRO = { surface: "negro", emoji: "⚫" };
const BLANCO = { surface: "blanco", emoji: "⚪" };
const CARRO = { surface: "carro", emoji: "🚗" };
const PERRO = { surface: "perro", emoji: "🐶" };
const GATO = { surface: "gato", emoji: "🐱" };
// m3 surface reused as an art-bearing distractor (not re-registered here).
const CASA = { surface: "casa", emoji: "🏠" };

// ─── es-m4-1 — Ser + adjective ──────────────────────────────────────────────

const M4_1: LessonContent = {
  id: "es-m4-1",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Ser + adjetivo — grande, pequeño",
  description: "Describe anything with ser plus a describing word.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "es-m4-1-info-ser-adj",
      "Describing with ser",
      "To say what someone or something is like, use a form of ser plus a describing word: la casa es grande (the house is big), el libro es nuevo (the book is new). You already know soy, eres, and es — add an adjective and you can describe anything you own, see, or meet.",
      "grammar",
    ),
    phrase("es-m4-1-p-grande", "big", "grande", undefined, { emoji: "🐘" }),
    phrase("es-m4-1-p-pequeno", "small", "pequeño", undefined, { emoji: "🤏" }),
    sentenceMcq({
      id: "es-m4-1-q-grande",
      prompt: "La casa es ___ (big).",
      correctText: "grande",
      distractorsText: ["pequeño", "nuevo", "viejo"],
      explanation: "The size word for anything on the large side — it never changes for gender.",
      exercisedAtomSurfaces: ["grande"],
    }),
    sentenceMcq({
      id: "es-m4-1-q-pequeno",
      prompt: "El libro es ___ (small).",
      correctText: "pequeño",
      distractorsText: ["grande", "nuevo", "viejo"],
      exercisedAtomSurfaces: ["pequeño"],
    }),
    phrase("es-m4-1-p-nuevo", "new", "nuevo", undefined, { emoji: "🆕" }),
    phrase("es-m4-1-p-viejo", "old", "viejo"),
    sentenceMcq({
      id: "es-m4-1-q-nuevo",
      prompt: "El celular es ___ (new).",
      correctText: "nuevo",
      distractorsText: ["viejo", "grande", "pequeño"],
      exercisedAtomSurfaces: ["nuevo"],
    }),
    sentenceMcq({
      id: "es-m4-1-q-viejo",
      prompt: "El libro es ___ (old).",
      correctText: "viejo",
      distractorsText: ["nuevo", "pequeño", "grande"],
      exercisedAtomSurfaces: ["viejo"],
    }),
  ],
};

// ─── es-m4-2 — Gender agreement ─────────────────────────────────────────────

const M4_2: LessonContent = {
  id: "es-m4-2",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Agreement — alto, alta",
  description: "Adjectives change their ending to match the noun.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m4-2-info-agreement",
      "Adjectives agree",
      "Adjectives ending in -o mirror what they describe: él es alto, but ella es alta — the -o flips to -a with anything feminine. Describing more than one? Add -s: altos, altas. Adjectives ending in -e (grande) or a consonant (azul) keep one form for both genders.",
      "grammar",
    ),
    phrase("es-m4-2-p-alto", "tall", "alto"),
    phrase("es-m4-2-p-bajo", "short (height)", "bajo"),
    sentenceMcq({
      id: "es-m4-2-q-alto",
      prompt: "Él es ___ (tall).",
      correctText: "alto",
      distractorsText: ["alta", "bajo", "baja"],
      explanation: "Masculine subject, so the describing word keeps its -o ending.",
      exercisedAtomSurfaces: ["alto"],
    }),
    sentenceMcq({
      id: "es-m4-2-q-baja",
      prompt: "Ella es ___ (short).",
      correctText: "baja",
      distractorsText: ["bajo", "alto", "alta"],
      explanation: "Feminine subject, so the ending flips to -a.",
      exercisedAtomSurfaces: ["bajo"],
    }),
    phrase("es-m4-2-p-bonito", "pretty", "bonito", undefined, { emoji: "🌸" }),
    phrase("es-m4-2-p-feo", "ugly", "feo"),
    sentenceMcq({
      id: "es-m4-2-q-bonita",
      prompt: "La casa es ___ (pretty).",
      correctText: "bonita",
      distractorsText: ["bonito", "feo", "fea"],
      exercisedAtomSurfaces: ["bonito"],
    }),
    sentenceMcq({
      id: "es-m4-2-q-feo",
      prompt: "Which word means 'ugly'?",
      correctText: "feo",
      distractorsText: ["bonito", "bajo", "malo"],
      exercisedAtomSurfaces: ["feo"],
    }),
  ],
};

// ─── es-m4-3 — The six core colors ──────────────────────────────────────────

const M4_3: LessonContent = {
  id: "es-m4-3",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Los colores",
  description: "Six colors — and where they sit in the sentence.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m4-3-info-colors",
      "Colors follow the noun",
      "Describing words come after the noun in Spanish: el carro rojo — literally 'the car red'. Colors ending in -o agree like any adjective (la puerta roja), while azul and verde keep one form for both genders.",
      "grammar",
    ),
    vocab("es-m4-3-p-rojo", "red", "rojo", undefined, { emoji: "🟥" }),
    vocab("es-m4-3-p-azul", "blue", "azul", undefined, { emoji: "🔵" }),
    vocabMcq("es-m4-3-mcq-rojo", { surface: "rojo", meaningEn: "red", emoji: "🟥" }, [AZUL, VERDE, AMARILLO]),
    vocabMcq("es-m4-3-mcq-azul", { surface: "azul", meaningEn: "blue", emoji: "🔵" }, [ROJO, VERDE, NEGRO]),
    vocabMcq("es-m4-3-mcq-verde", { surface: "verde", meaningEn: "green", emoji: "🟢" }, [AZUL, AMARILLO, BLANCO]),
    vocabMcq("es-m4-3-mcq-amarillo", { surface: "amarillo", meaningEn: "yellow", emoji: "🟡" }, [VERDE, ROJO, AZUL]),
    vocabMcq("es-m4-3-mcq-negro", { surface: "negro", meaningEn: "black", emoji: "⚫" }, [BLANCO, AZUL, ROJO]),
    vocabMcq("es-m4-3-mcq-blanco", { surface: "blanco", meaningEn: "white", emoji: "⚪" }, [NEGRO, AMARILLO, VERDE]),
  ],
};

// ─── es-m4-4 — Things & pets, adjective after the noun ──────────────────────

const M4_4: LessonContent = {
  id: "es-m4-4",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "El carro, el perro, el gato",
  description: "Three describable things — and colors put to work.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    phrase("es-m4-4-p-carro", "the car", "el carro", undefined, { emoji: "🚗" }),
    phrase("es-m4-4-p-perro", "the dog", "el perro", undefined, { emoji: "🐶" }),
    vocabMcq("es-m4-4-mcq-carro", { surface: "carro", meaningEn: "car", emoji: "🚗" }, [PERRO, GATO, CASA]),
    vocabMcq("es-m4-4-mcq-perro", { surface: "perro", meaningEn: "dog", emoji: "🐶" }, [GATO, CARRO, CASA]),
    phrase("es-m4-4-p-gato", "the cat", "el gato", undefined, { emoji: "🐱" }),
    phrase("es-m4-4-p-color", "the color", "el color", undefined, { emoji: "🎨" }),
    vocabMcq("es-m4-4-mcq-gato", { surface: "gato", meaningEn: "cat", emoji: "🐱" }, [PERRO, CARRO, CASA]),
    sentenceMcq({
      id: "es-m4-4-q-color",
      prompt: "Which word means 'color'?",
      correctText: "color",
      distractorsText: ["carro", "cosa", "casa"],
      exercisedAtomSurfaces: ["color"],
    }),
    build(
      "es-m4-4-build-carro-rojo",
      "Build: 'the red car'",
      "el carro rojo",
      ["el", "carro", "rojo", "azul"],
      ["el", "carro", "rojo"],
      ["carro", "rojo"],
    ),
  ],
};

// ─── es-m4-5 — Opinions: bueno, malo, muy, pero ─────────────────────────────

const M4_5: LessonContent = {
  id: "es-m4-5",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Opiniones — muy bueno, pero…",
  description: "Rate things, turn it up with muy, contrast with pero.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m4-5-info-muy-pero",
      "Turning it up, talking it down",
      "Drop muy in front of any describing word to intensify it: muy grande (very big), muy bonita (very pretty). To contrast two ideas, join them with pero: la casa es bonita, pero es pequeña — the house is pretty, but it's small.",
      "grammar",
    ),
    phrase("es-m4-5-p-bueno", "good", "bueno", undefined, { emoji: "👍" }),
    phrase("es-m4-5-p-malo", "bad", "malo", undefined, { emoji: "👎" }),
    sentenceMcq({
      id: "es-m4-5-q-bueno",
      prompt: "El libro es muy ___ (good).",
      correctText: "bueno",
      distractorsText: ["buena", "malo", "mala"],
      exercisedAtomSurfaces: ["bueno"],
    }),
    sentenceMcq({
      id: "es-m4-5-q-malo",
      prompt: "Which word means 'bad'?",
      correctText: "malo",
      distractorsText: ["bueno", "feo", "bajo"],
      exercisedAtomSurfaces: ["malo"],
    }),
    cloze(
      "es-m4-5-cloze-muy",
      "el carro es",
      "grande",
      "muy",
      ["muy", "pero", "y", "o"],
      "the car is very big",
      "el carro es muy grande",
      "The intensifier — it turns the description up a notch.",
    ),
    cloze(
      "es-m4-5-cloze-pero",
      "la casa es bonita,",
      "es pequeña",
      "pero",
      ["pero", "y", "o", "muy"],
      "the house is pretty, but it's small",
      "la casa es bonita, pero es pequeña",
      "Signals a contrast between the two halves of the sentence.",
    ),
    build(
      "es-m4-5-build-muy-alto",
      "Build: 'He is very tall.'",
      "él es muy alto",
      ["él", "es", "muy", "alto", "bajo"],
      ["él", "es", "muy", "alto"],
      ["muy", "alto"],
    ),
    translateStep({
      id: "es-m4-5-tr-carro",
      promptEn: "The car is very big",
      acceptedAnswers: [
        "el carro es muy grande",
        "El carro es muy grande",
        "el carro es muy grande.",
        "El carro es muy grande.",
      ],
      audioText: "el carro es muy grande",
      exercisedAtomSurfaces: ["carro", "muy", "grande"],
    }),
  ],
};

// ─── es-m4-6 — Listening focus ──────────────────────────────────────────────

const M4_6: LessonContent = {
  id: "es-m4-6",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — descripciones",
  description: "Two look-alike adjectives, then pure ear training.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    phrase("es-m4-6-p-facil", "easy", "fácil"),
    phrase("es-m4-6-p-dificil", "difficult", "difícil"),
    sentenceMcq({
      id: "es-m4-6-q-facil",
      prompt: "El libro es ___ (easy).",
      correctText: "fácil",
      distractorsText: ["difícil", "feo", "malo"],
      exercisedAtomSurfaces: ["fácil"],
    }),
    listeningCompSentence({
      id: "es-m4-6-lc-dificil",
      audioText: "el libro es muy difícil",
      correctMeaningEn: "the book is very difficult",
      distractorsEn: ["the book is very easy", "the book is very old", "the house is very big"],
      exercisedAtomSurfaces: ["difícil"],
    }),
    listeningCompSentence({
      id: "es-m4-6-lc-carro-rojo",
      audioText: "el carro rojo",
      correctMeaningEn: "the red car",
      distractorsEn: ["the blue car", "the red house", "the black cat"],
      exercisedAtomSurfaces: ["carro", "rojo"],
    }),
    listeningBuildSentence({
      id: "es-m4-6-lb-casa-grande",
      target: "la casa es muy grande",
      tiles: ["la", "casa", "es", "muy", "grande", "pequeña"],
      correctOrder: ["la", "casa", "es", "muy", "grande"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["casa", "muy", "grande"],
    }),
    listeningCompSentence({
      id: "es-m4-6-lc-perro-blanco",
      audioText: "el perro blanco",
      correctMeaningEn: "the white dog",
      distractorsEn: ["the black dog", "the white cat", "the yellow car"],
      exercisedAtomSurfaces: ["perro", "blanco"],
    }),
    listeningBuildSentence({
      id: "es-m4-6-lb-gato-negro",
      target: "el gato es negro",
      tiles: ["el", "gato", "es", "negro", "blanco"],
      correctOrder: ["el", "gato", "es", "negro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["gato", "negro"],
    }),
    listeningCompSentence({
      id: "es-m4-6-lc-puerta-verde",
      audioText: "la puerta es verde",
      correctMeaningEn: "the door is green",
      distractorsEn: ["the door is blue", "the window is green", "the door is big"],
      exercisedAtomSurfaces: ["verde"],
    }),
  ],
};

// ─── es-m4-7 — Integration: cognates ────────────────────────────────────────

const M4_7: LessonContent = {
  id: "es-m4-7",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Cognados — interesante, inteligente",
  description: "Free vocabulary: describe people, then say it out loud.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m4-7-info-cognates",
      "Cognates — free vocabulary",
      "Spanish and English share thousands of look-alike words. English -ent and -ing endings often surface as -ente and -ante: intelligent, interesting… you can already read them. Just pronounce them the Spanish way — pure vowels, stress on the second-to-last syllable.",
      "grammar",
    ),
    phrase("es-m4-7-p-interesante", "interesting", "interesante"),
    phrase("es-m4-7-p-inteligente", "intelligent", "inteligente", undefined, { emoji: "🧠" }),
    sentenceMcq({
      id: "es-m4-7-q-interesante",
      prompt: "El libro es muy ___ (interesting).",
      correctText: "interesante",
      distractorsText: ["interesantes", "inteligente", "difícil"],
      exercisedAtomSurfaces: ["interesante"],
    }),
    sentenceMcq({
      id: "es-m4-7-q-inteligente",
      prompt: "Ella es muy ___ (intelligent).",
      correctText: "inteligente",
      distractorsText: ["inteligentes", "interesante", "simpático"],
      explanation: "-e adjectives keep one form for both genders — only the plural adds -s.",
      exercisedAtomSurfaces: ["inteligente"],
    }),
    phrase("es-m4-7-p-simpatico", "nice / friendly", "simpático", undefined, { emoji: "😊" }),
    translateStep({
      id: "es-m4-7-tr-interesante",
      promptEn: "The book is very interesting",
      acceptedAnswers: [
        "el libro es muy interesante",
        "El libro es muy interesante",
        "el libro es muy interesante.",
        "El libro es muy interesante.",
      ],
      audioText: "el libro es muy interesante",
      exercisedAtomSurfaces: ["interesante", "muy"],
    }),
    build(
      "es-m4-7-build-simpatica",
      "Build: 'She is very friendly.'",
      "ella es muy simpática",
      ["ella", "es", "muy", "simpática", "simpático"],
      ["ella", "es", "muy", "simpática"],
      ["simpático", "muy"],
    ),
    speaking(
      "es-m4-7-speak-inteligente",
      "él es muy inteligente y simpático",
      "he is very intelligent and friendly",
      ["inteligente", "simpático"],
    ),
  ],
};

// ─── es-m4-8 — Mastery test ─────────────────────────────────────────────────

const M4_8: LessonContent = {
  id: "es-m4-8",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M4 Mastery Test",
  description: "Agreement, colors, adjective order, muy & pero.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m4-8-q-alta",
      prompt: "Ella es ___ (tall).",
      correctText: "alta",
      distractorsText: ["alto", "baja", "bajo"],
      exercisedAtomSurfaces: ["alto"],
    }),
    vocabMcq("es-m4-8-mcq-amarillo", { surface: "amarillo", meaningEn: "yellow", emoji: "🟡" }, [VERDE, AZUL, BLANCO]),
    cloze(
      "es-m4-8-cloze-muy",
      "el perro es",
      "bonito",
      "muy",
      ["muy", "pero", "y", "o"],
      "the dog is very pretty",
      "el perro es muy bonito",
    ),
    build(
      "es-m4-8-build-gato",
      "Build: 'The cat is black.'",
      "el gato es negro",
      ["el", "gato", "es", "negro", "blanco"],
      ["el", "gato", "es", "negro"],
      ["gato", "negro"],
    ),
    listeningCompSentence({
      id: "es-m4-8-lc-vieja",
      audioText: "la casa es muy vieja",
      correctMeaningEn: "the house is very old",
      distractorsEn: ["the house is very new", "the car is very old", "the house is very pretty"],
      exercisedAtomSurfaces: ["viejo"],
    }),
    translateStep({
      id: "es-m4-8-tr-facil",
      promptEn: "The book is easy",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "el libro es fácil",
        "El libro es fácil",
        "el libro es facil",
        "El libro es facil",
      ],
      audioText: "el libro es fácil",
      exercisedAtomSurfaces: ["libro", "fácil"],
    }),
    sentenceMcq({
      id: "es-m4-8-q-pero",
      prompt: "La casa es bonita, ___ es pequeña.",
      correctText: "pero",
      distractorsText: ["muy", "y", "o"],
      exercisedAtomSurfaces: ["pero"],
    }),
    listeningBuildSentence({
      id: "es-m4-8-lb-carro-azul",
      target: "el carro es azul",
      tiles: ["el", "carro", "es", "azul", "verde"],
      correctOrder: ["el", "carro", "es", "azul"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["carro", "azul"],
    }),
    speaking("es-m4-8-speak-simpatico", "él es muy simpático", "he is very friendly", ["simpático"]),
  ],
};

export const ES_M4_LESSONS: LessonContent[] = [
  M4_1,
  M4_2,
  M4_3,
  M4_4,
  M4_5,
  M4_6,
  M4_7,
  M4_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M4_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m4",
      moduleId: "m4",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m4",
          prompt: "Ella es ___ (tall).",
          correctText: "alta",
          distractorsText: ["alto", "altos", "altas"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m4-1",
      moduleId: "m4",
      build: () =>
        sentenceMcq({
          id: "pt-es-m4-1",
          prompt: "'The red car' — which is correct?",
          correctText: "el carro rojo",
          distractorsText: ["el rojo carro", "el carro roja", "la carro rojo"],
        }),
    },
    {
      id: "pt-es-m4-2",
      moduleId: "m4",
      build: () =>
        sentenceMcq({
          id: "pt-es-m4-2",
          prompt: "La casa es ___ (pretty).",
          correctText: "bonita",
          distractorsText: ["bonito", "bonitas", "bonitos"],
        }),
    },
    {
      id: "pt-es-m4-3",
      moduleId: "m4",
      build: () =>
        cloze(
          "pt-es-m4-3",
          "el libro es",
          "interesante",
          "muy",
          ["muy", "pero", "y", "o"],
          "the book is very interesting",
          "el libro es muy interesante",
        ),
    },
    {
      id: "pt-es-m4-4",
      moduleId: "m4",
      build: () =>
        sentenceMcq({
          id: "pt-es-m4-4",
          prompt: "Es viejo, ___ es bueno.",
          correctText: "pero",
          distractorsText: ["muy", "y", "o"],
        }),
    },
  ],
};
