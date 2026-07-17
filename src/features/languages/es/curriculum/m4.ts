/**
 * Spanish Module 4 — Descripciones (adjective agreement, ser + adj, colors).
 *
 * The learner can name things (m3) and say who someone is (m2). M4's job:
 * describe them — ser + adjective, the -o/-a/-s agreement machine,
 * adjective-after-noun order, the six core colors, muy, pero, and cognates.
 *
 * 2026-07-16 rewrite (JA-standard pass): every topic lesson now runs
 * 18-22 retrieval-heavy steps across ≥8 step types, with typed translate +
 * speaking/build production in the back half, one selfExplain at N-1 in
 * every grammar lesson, and a compounding review tail (L2+) pulling
 * m1-m3 vocabulary via reviewMatchPairs. Every prompt was rewritten to
 * force a read of the Spanish (context-forcing sentences or English-gloss
 * comprehension checks) instead of leaking the answer via a parenthetical
 * English gloss next to eliminable distractors.
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
  agreementCloze,
  build,
  cloze,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  dialogueListen,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  vocabTextMcq,
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
const GRANDE = { surface: "grande", emoji: "🐘" };
const PEQUENO = { surface: "pequeño", emoji: "🤏" };
const NUEVO = { surface: "nuevo", emoji: "🆕" };
const BUENO = { surface: "bueno", emoji: "👍" };
const MALO = { surface: "malo", emoji: "👎" };
const INTELIGENTE = { surface: "inteligente", emoji: "🧠" };

// ─── es-m4-1 — Ser + adjective (recognition → production) ──────────────────

const M4_1: LessonContent = {
  id: "es-m4-1",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Ser + adjetivo — grande, pequeño",
  description: "Describe anything with ser plus a describing word.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m4-1-info-ser-adj",
      "Describing with ser",
      "To say what someone or something is like, use a form of ser plus a describing word: la casa es grande (the house is big), el libro es nuevo (the book is new). You already know soy, eres, and es — add an adjective and you can describe anything you own, see, or meet. One heads-up: grande ends in -e, so it never changes for gender.",
      "grammar",
    ),
    vocabMcq("es-m4-1-mcq-grande", { surface: "grande", meaningEn: "big", emoji: "🐘" }, [PEQUENO, NUEVO, CASA]),
    speaking("es-m4-1-speak-casa-grande", "la casa es grande", "the house is big", ["casa", "grande"]),
    vocabMcq("es-m4-1-mcq-pequeno", { surface: "pequeño", meaningEn: "small", emoji: "🤏" }, [GRANDE, NUEVO, CASA]),
    sentenceMcq({
      id: "es-m4-1-q-raton-pequeno",
      prompt: "El ratón cabe en tu mano. ¿Qué significa 'El ratón es pequeño'?",
      correctText: "The mouse is small",
      distractorsText: ["The mouse is big", "The mouse is new", "The mouse is old"],
      exercisedAtomSurfaces: ["pequeño"],
    }),
    build(
      "es-m4-1-build-libro-nuevo",
      "Build: 'The book is new.'",
      "el libro es nuevo",
      ["el", "libro", "es", "nuevo", "viejo"],
      ["el", "libro", "es", "nuevo"],
      ["libro", "nuevo"],
    ),
    vocabMcq("es-m4-1-mcq-nuevo", { surface: "nuevo", meaningEn: "new", emoji: "🆕" }, [GRANDE, PEQUENO, CASA]),
    vocabTextMcq("es-m4-1-tmcq-viejo", "viejo", ["nuevo", "grande", "pequeño"]),
    speaking("es-m4-1-speak-libro-viejo", "el libro es viejo", "the book is old", ["libro", "viejo"]),
    sentenceMcq({
      id: "es-m4-1-q-libro-abuelo",
      prompt: "Este libro es de mi abuelo; tiene cien años. Es ___.",
      correctText: "viejo",
      distractorsText: ["nuevo", "grande", "pequeño"],
      exercisedAtomSurfaces: ["viejo"],
    }),
    translateStep({
      id: "es-m4-1-tr-libro-pequeno",
      promptEn: "The book is small",
      acceptedAnswers: [
        "el libro es pequeño",
        "El libro es pequeño",
        "el libro es pequeño.",
        "El libro es pequeño.",
      ],
      audioText: "el libro es pequeño",
      exercisedAtomSurfaces: ["libro", "pequeño"],
    }),
    listeningCompSentence({
      id: "es-m4-1-lc-casa-grande",
      audioText: "la casa es grande",
      correctMeaningEn: "the house is big",
      distractorsEn: ["the house is small", "the house is new", "the house is old"],
      exercisedAtomSurfaces: ["casa", "grande"],
    }),
    listeningBuildSentence({
      id: "es-m4-1-lb-raton-pequeno",
      target: "el ratón es pequeño",
      tiles: ["el", "ratón", "es", "pequeño", "grande"],
      correctOrder: ["el", "ratón", "es", "pequeño"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["pequeño"],
    }),
    selfExplain({
      id: "es-m4-1-self-explain-grande",
      anchorLabel: "You wrote: la casa es grande",
      anchorAudioText: "la casa es grande",
      question: "Why doesn't grande change to agree with casa (feminine)?",
      rule: { text: "Adjectives ending in -e, like grande, keep one form for both masculine and feminine nouns." },
      surface: { text: "grande is a special exception that just never changes, for no particular reason." },
      distractor: { text: "grande only changes in questions, not in statements." },
      ruleExplanation:
        "Only -o adjectives flip to -a for feminine nouns (bonito→bonita). Adjectives ending in -e or a consonant, like grande or azul, stay the same for both genders.",
    }),
    sentenceMcq({
      id: "es-m4-1-q-carro-nuevo",
      prompt: "Compré este carro ayer. ¿Qué significa 'El carro es nuevo'?",
      correctText: "The car is new",
      distractorsText: ["The car is old", "The car is big", "The car is small"],
      exercisedAtomSurfaces: ["carro", "nuevo"],
    }),
    speaking(
      "es-m4-1-speak-mix",
      "el ratón es pequeño y el elefante es grande",
      "the mouse is small and the elephant is big",
      ["pequeño", "grande"],
    ),
    translateStep({
      id: "es-m4-1-tr-carro-viejo",
      promptEn: "The car is old",
      acceptedAnswers: [
        "el carro es viejo",
        "El carro es viejo",
        "el carro es viejo.",
        "El carro es viejo.",
      ],
      audioText: "el carro es viejo",
      exercisedAtomSurfaces: ["carro", "viejo"],
    }),
    listeningCompSentence({
      id: "es-m4-1-lc-celular-viejo",
      audioText: "el celular es viejo",
      correctMeaningEn: "the cell phone is old",
      distractorsEn: ["the cell phone is new", "the cell phone is big", "the cell phone is small"],
      exercisedAtomSurfaces: ["celular", "viejo"],
    }),
    infoStep(
      "es-m4-1-info-win",
      "You can describe anything",
      "Any noun plus ser plus a describing word — you can now say what's big, small, new, or old, about anything you own or see.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m4-2-info-agreement",
      "Adjectives agree",
      "Adjectives ending in -o mirror what they describe: él es alto, but ella es alta — the -o flips to -a with anything feminine. Describing more than one? Add -s: altos, altas. Adjectives ending in -e (grande) or a consonant (azul) keep one form for both genders.",
      "grammar",
    ),
    vocabTextMcq("es-m4-2-tmcq-alto", "alto", ["alta", "bajo", "baja"]),
    speaking("es-m4-2-speak-alto", "él es alto", "he is tall", ["alto"]),
    sentenceMcq({
      id: "es-m4-2-q-hermana-alta",
      prompt: "Mi hermana mide dos metros. Es muy ___.",
      correctText: "alta",
      distractorsText: ["alto", "altos", "altas"],
      exercisedAtomSurfaces: ["alto"],
    }),
    build(
      "es-m4-2-build-ella-baja",
      "Build: 'She is short.'",
      "ella es baja",
      ["ella", "es", "baja", "bajo", "alta"],
      ["ella", "es", "baja"],
      ["bajo"],
    ),
    vocabMcq("es-m4-2-mcq-bonito", { surface: "bonito", meaningEn: "pretty", emoji: "🌸" }, [GRANDE, NUEVO, MALO]),
    // The full agreement chain in one graded set: article, noun ending,
    // adjective ending — all three must match.
    agreementCloze(
      "es-m4-2-agr-bonita",
      [
        { blank: { id: "b1", correctAnswer: "la", options: ["el", "la", "los", "las"] } },
        { text: " cas" },
        { blank: { id: "b2", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
        { text: " es bonit" },
        { blank: { id: "b3", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
      ],
      "the house is pretty",
      "la casa es bonita",
      ["casa", "bonito"],
    ),
    speaking("es-m4-2-speak-hermana-bonita", "mi hermana es bonita", "my sister is pretty", ["bonito"]),
    vocabTextMcq("es-m4-2-tmcq-feo", "feo", ["bonito", "bajo", "malo"]),
    build(
      "es-m4-2-build-monstruo-feo",
      "Build: 'The monster is ugly.'",
      "el monstruo es feo",
      ["el", "monstruo", "es", "feo", "bonito"],
      ["el", "monstruo", "es", "feo"],
      ["feo"],
    ),
    sentenceMcq({
      id: "es-m4-2-q-no-bonito",
      prompt: "Ese perro no es bonito, es ___.",
      correctText: "feo",
      distractorsText: ["bonito", "alto", "bajo"],
      exercisedAtomSurfaces: ["feo"],
    }),
    agreementCloze(
      "es-m4-2-agr-viejos",
      [
        { blank: { id: "b1", correctAnswer: "los", options: ["el", "la", "los", "las"] } },
        { text: " libr" },
        { blank: { id: "b2", correctAnswer: "os", options: ["o", "a", "os", "as"] } },
        { text: " viej" },
        { blank: { id: "b3", correctAnswer: "os", options: ["o", "a", "os", "as"] } },
      ],
      "the old books",
      "los libros viejos",
      ["libro", "viejo"],
    ),
    speaking("es-m4-2-speak-libros-viejos", "los libros son viejos", "the books are old", ["libro", "viejo"]),
    selfExplain({
      id: "es-m4-2-self-explain-agreement",
      anchorLabel: "You wrote: la casa es bonita",
      anchorAudioText: "la casa es bonita",
      question: "Why does bonito become bonita here?",
      rule: { text: "casa is feminine, so the -o adjective flips to -a to match: bonito → bonita." },
      surface: { text: "bonita is used because it sounds nicer with casa." },
      distractor: { text: "bonito changes to bonita only when the sentence is a question." },
      ruleExplanation:
        "-o adjectives always mirror the noun's gender (bonito/bonita, alto/alta). -e or consonant adjectives like grande and azul never change.",
    }),
    translateStep({
      id: "es-m4-2-tr-hermana-alta",
      promptEn: "She is tall",
      acceptedAnswers: ["ella es alta", "Ella es alta", "ella es alta.", "Ella es alta."],
      audioText: "ella es alta",
      exercisedAtomSurfaces: ["alto"],
    }),
    listeningCompSentence({
      id: "es-m4-2-lc-hermana-alta",
      audioText: "mi hermana es muy alta",
      correctMeaningEn: "my sister is very tall",
      distractorsEn: ["my sister is very short", "my brother is very tall", "my sister is very pretty"],
      exercisedAtomSurfaces: ["alto"],
    }),
    speaking("es-m4-2-speak-amigo-bajo", "mi amigo es bajo", "my friend is short", ["bajo"]),
    reviewMatchPairs("es-m4-2-rev", "es-m4-2-rev-seed", "m4", 6),
    sentenceMcq({
      id: "es-m4-2-rev-q-amigo",
      prompt: "Mi amigo es alto, pero mi amiga es ___.",
      correctText: "alta",
      distractorsText: ["alto", "baja", "bajo"],
      exercisedAtomSurfaces: ["alto", "amigo"],
    }),
    infoStep(
      "es-m4-2-info-win",
      "You can now describe anyone precisely",
      "Alto or alta, bonito or bonita — you match the ending to the person or thing every time.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 21,
  steps: [
    infoStep(
      "es-m4-3-info-colors",
      "Colors follow the noun",
      "Describing words come after the noun in Spanish: el carro rojo — literally 'the car red'. Colors ending in -o agree like any adjective (la puerta roja), while azul and verde keep one form for both genders.",
      "grammar",
    ),
    vocabMcq("es-m4-3-mcq-rojo", { surface: "rojo", meaningEn: "red", emoji: "🟥" }, [AZUL, VERDE, AMARILLO]),
    speaking("es-m4-3-speak-puerta-roja", "la puerta es roja", "the door is red", ["puerta", "rojo"]),
    vocabMcq("es-m4-3-mcq-azul", { surface: "azul", meaningEn: "blue", emoji: "🔵" }, [ROJO, VERDE, NEGRO]),
    build(
      "es-m4-3-build-cielo-azul",
      "Build: 'The sky is blue.'",
      "el cielo es azul",
      ["el", "cielo", "es", "azul", "verde"],
      ["el", "cielo", "es", "azul"],
      ["azul"],
    ),
    vocabMcq("es-m4-3-mcq-verde", { surface: "verde", meaningEn: "green", emoji: "🟢" }, [AZUL, AMARILLO, BLANCO]),
    sentenceMcq({
      id: "es-m4-3-q-hoja-verde",
      prompt: "La hoja del árbol no es azul ni amarilla, es ___.",
      correctText: "verde",
      distractorsText: ["azul", "amarilla", "roja"],
      exercisedAtomSurfaces: ["verde"],
    }),
    speaking("es-m4-3-speak-mesa-amarilla", "la mesa es amarilla", "the table is yellow", ["mesa", "amarillo"]),
    vocabMcq("es-m4-3-mcq-amarillo", { surface: "amarillo", meaningEn: "yellow", emoji: "🟡" }, [VERDE, ROJO, AZUL]),
    build(
      "es-m4-3-build-sol-amarillo",
      "Build: 'The sun is yellow.'",
      "el sol es amarillo",
      ["el", "sol", "es", "amarillo", "rojo"],
      ["el", "sol", "es", "amarillo"],
      ["amarillo"],
    ),
    vocabMcq("es-m4-3-mcq-negro", { surface: "negro", meaningEn: "black", emoji: "⚫" }, [BLANCO, AZUL, ROJO]),
    speaking("es-m4-3-speak-gato-negro", "el gato es negro", "the cat is black", ["gato", "negro"]),
    vocabMcq("es-m4-3-mcq-blanco", { surface: "blanco", meaningEn: "white", emoji: "⚪" }, [NEGRO, AMARILLO, VERDE]),
    sentenceMcq({
      id: "es-m4-3-q-nieve-blanca",
      prompt: "La nieve no es negra, es ___.",
      correctText: "blanca",
      distractorsText: ["negra", "roja", "amarilla"],
      exercisedAtomSurfaces: ["blanco"],
    }),
    build(
      "es-m4-3-build-gato-blanco",
      "Build: 'The white cat.'",
      "el gato blanco",
      ["el", "gato", "blanco", "blanca", "negro"],
      ["el", "gato", "blanco"],
      ["gato", "blanco"],
    ),
    selfExplain({
      id: "es-m4-3-self-explain-invariant",
      anchorLabel: "You wrote: el cielo es azul",
      anchorAudioText: "el cielo es azul",
      question: "Why doesn't azul change for feminine nouns like puerta?",
      rule: { text: "azul ends in a consonant, so — like grande — it keeps one form for both masculine and feminine nouns." },
      surface: { text: "azul doesn't change because colors never change in Spanish." },
      distractor: { text: "azul only changes when describing more than one thing." },
      ruleExplanation:
        "Adjectives ending in -e or a consonant (azul, verde, grande, fácil) are gender-invariant. Only -o/-a adjectives (rojo/roja, negro/negra) flip for gender — and every color still adds -s for plural (azules, verdes).",
    }),
    translateStep({
      id: "es-m4-3-tr-carro-rojo",
      promptEn: "The car is red",
      acceptedAnswers: ["el carro es rojo", "El carro es rojo", "el carro es rojo.", "El carro es rojo."],
      audioText: "el carro es rojo",
      exercisedAtomSurfaces: ["carro", "rojo"],
    }),
    vocabMcq("es-m4-3-mcq-color", { surface: "color", meaningEn: "color", emoji: "🎨" }, [CARRO, PERRO, GATO]),
    speaking("es-m4-3-speak-color-carro", "el color del carro es azul", "the car's color is blue", ["color", "carro", "azul"]),
    reviewMatchPairs("es-m4-3-rev", "es-m4-3-rev-seed", "m4", 6),
    build(
      "es-m4-3-rev-build-silla-roja",
      "Build: 'the red chair'",
      "la silla roja",
      ["la", "silla", "roja", "rojo", "azul"],
      ["la", "silla", "roja"],
      ["silla", "rojo"],
    ),
    infoStep(
      "es-m4-3-info-win",
      "You can paint the world",
      "Rojo, azul, verde, amarillo, negro, blanco — six colors, correctly placed and matched, on anything you describe.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m4-4-info-order",
      "Adjectives after the noun",
      "In Spanish, the describing word comes after the noun: el carro rojo, not 'el rojo carro' — the opposite of English (the red car). Practice the order with three new nouns: el carro, el perro, el gato.",
      "grammar",
    ),
    vocabMcq("es-m4-4-mcq-carro", { surface: "carro", meaningEn: "car", emoji: "🚗" }, [PERRO, GATO, CASA]),
    speaking("es-m4-4-speak-carro-nuevo", "el carro es nuevo", "the car is new", ["carro", "nuevo"]),
    vocabMcq("es-m4-4-mcq-perro", { surface: "perro", meaningEn: "dog", emoji: "🐶" }, [GATO, CARRO, CASA]),
    build(
      "es-m4-4-build-perro-negro",
      "Build: 'the black dog'",
      "el perro negro",
      ["el", "perro", "negro", "blanco", "carro"],
      ["el", "perro", "negro"],
      ["perro", "negro"],
    ),
    vocabMcq("es-m4-4-mcq-gato", { surface: "gato", meaningEn: "cat", emoji: "🐱" }, [PERRO, CARRO, CASA]),
    sentenceMcq({
      id: "es-m4-4-q-orden",
      prompt: "¿Cuál es la forma correcta de decir 'the red car'?",
      correctText: "el carro rojo",
      distractorsText: ["el rojo carro", "el carro roja", "la carro rojo"],
      exercisedAtomSurfaces: ["carro", "rojo"],
    }),
    speaking("es-m4-4-speak-gato-bonito", "mi gato es bonito", "my cat is pretty", ["gato", "bonito"]),
    sentenceMcq({
      id: "es-m4-4-q-color",
      prompt: "Mi carro es azul. ¿De qué color es?",
      correctText: "azul",
      distractorsText: ["rojo", "verde", "amarillo"],
      exercisedAtomSurfaces: ["color", "azul"],
    }),
    build(
      "es-m4-4-build-carro-azul",
      "Build: 'the blue car'",
      "el carro azul",
      ["el", "carro", "azul", "verde", "perro"],
      ["el", "carro", "azul"],
      ["carro", "azul"],
    ),
    // Colors put to work: feminine plural runs through all three slots.
    agreementCloze(
      "es-m4-4-agr-blancas",
      [
        { blank: { id: "b1", correctAnswer: "las", options: ["el", "la", "los", "las"] } },
        { text: " sill" },
        { blank: { id: "b2", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
        { text: " blanc" },
        { blank: { id: "b3", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
      ],
      "the white chairs",
      "las sillas blancas",
      ["silla", "blanco"],
    ),
    speaking(
      "es-m4-4-speak-perro-pequeno-bonito",
      "mi perro es pequeño y bonito",
      "my dog is small and pretty",
      ["perro", "pequeño", "bonito"],
    ),
    selfExplain({
      id: "es-m4-4-self-explain-order",
      anchorLabel: "You wrote: el carro rojo",
      anchorAudioText: "el carro rojo",
      question: "Why does rojo come after carro, not before like in English?",
      rule: { text: "Descriptive adjectives in Spanish normally follow the noun: carro rojo, not rojo carro." },
      surface: { text: "Word order in Spanish is completely free — either order is always correct." },
      distractor: { text: "Adjectives go before the noun only when the noun is masculine." },
      ruleExplanation:
        "Spanish puts most descriptive adjectives after the noun (carro rojo, casa grande) — the opposite of English. A few short special adjectives are the exception, not the rule.",
    }),
    translateStep({
      id: "es-m4-4-tr-gato-negro",
      promptEn: "The cat is black",
      acceptedAnswers: ["el gato es negro", "El gato es negro", "el gato es negro.", "El gato es negro."],
      audioText: "el gato es negro",
      exercisedAtomSurfaces: ["gato", "negro"],
    }),
    listeningCompSentence({
      id: "es-m4-4-lc-perro-grande",
      audioText: "el perro es muy grande",
      correctMeaningEn: "the dog is very big",
      distractorsEn: ["the dog is very small", "the cat is very big", "the dog is very old"],
      exercisedAtomSurfaces: ["perro", "grande"],
    }),
    listeningBuildSentence({
      id: "es-m4-4-lb-gato-blanco",
      target: "el gato blanco es bonito",
      tiles: ["el", "gato", "blanco", "es", "bonito", "negro"],
      correctOrder: ["el", "gato", "blanco", "es", "bonito"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["gato", "blanco", "bonito"],
    }),
    reviewMatchPairs("es-m4-4-rev", "es-m4-4-rev-seed", "m4", 6),
    sentenceMcq({
      id: "es-m4-4-rev-q-maestro",
      prompt: "Mi maestro tiene un carro rojo, pero mi maestra tiene un carro ___.",
      correctText: "azul",
      distractorsText: ["rojo", "roja", "azules"],
      exercisedAtomSurfaces: ["carro", "azul", "maestro"],
    }),
    infoStep(
      "es-m4-4-info-win",
      "You can describe your world",
      "The car, the dog, the cat — any noun, any color, in the right order. You can point at anything around you and describe it correctly.",
      "win",
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
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m4-5-info-muy-pero",
      "Turning it up, talking it down",
      "Drop muy in front of any describing word to intensify it: muy grande (very big), muy bonita (very pretty). To contrast two ideas, join them with pero: la casa es bonita, pero es pequeña — the house is pretty, but it's small.",
      "grammar",
    ),
    vocabMcq("es-m4-5-mcq-bueno", { surface: "bueno", meaningEn: "good", emoji: "👍" }, [MALO, GRANDE, PEQUENO]),
    speaking("es-m4-5-speak-libro-bueno", "el libro es bueno", "the book is good", ["libro", "bueno"]),
    vocabMcq("es-m4-5-mcq-malo", { surface: "malo", meaningEn: "bad", emoji: "👎" }, [BUENO, GRANDE, PEQUENO]),
    sentenceMcq({
      id: "es-m4-5-q-pelicula-mala",
      prompt: "No me gustó la película para nada. Fue muy ___.",
      correctText: "mala",
      distractorsText: ["buena", "bonita", "nueva"],
      exercisedAtomSurfaces: ["malo"],
    }),
    build(
      "es-m4-5-build-alto-muy",
      "Build: 'He is very tall.'",
      "él es muy alto",
      ["él", "es", "muy", "alto", "bajo"],
      ["él", "es", "muy", "alto"],
      ["muy", "alto"],
    ),
    cloze(
      "es-m4-5-cloze-muy",
      "el perro es",
      "bonito",
      "muy",
      ["muy", "pero", "y", "o"],
      "the dog is very pretty",
      "el perro es muy bonito",
      "The intensifier — it turns the description up a notch.",
    ),
    vocabTextMcq("es-m4-5-tmcq-muy", "muy", ["pero", "y", "o"]),
    speaking("es-m4-5-speak-gato-bonito", "el gato es muy bonito", "the cat is very pretty", ["gato", "muy", "bonito"]),
    sentenceMcq({
      id: "es-m4-5-q-pero-context",
      prompt: "La casa es bonita, ___ es pequeña.",
      correctText: "pero",
      distractorsText: ["muy", "y", "o"],
      exercisedAtomSurfaces: ["pero"],
    }),
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
    speaking(
      "es-m4-5-speak-bonita-pero-pequena",
      "la casa es bonita, pero es pequeña",
      "the house is pretty, but it's small",
      ["casa", "bonito", "pero", "pequeño"],
    ),
    selfExplain({
      id: "es-m4-5-self-explain-muy-pero",
      anchorLabel: "You wrote: la casa es bonita, pero es pequeña",
      anchorAudioText: "la casa es bonita, pero es pequeña",
      question: "What job does pero do in this sentence?",
      rule: { text: "pero joins two ideas that contrast — it signals 'but' between them." },
      surface: { text: "pero just means 'and' with extra emphasis." },
      distractor: { text: "pero can only connect two single adjectives, never two full clauses." },
      ruleExplanation:
        "pero links a contrast: something true, followed by an exception or opposite (bonita, pero pequeña). muy, by contrast, only intensifies a single adjective — it can't join clauses.",
    }),
    translateStep({
      id: "es-m4-5-tr-carro-muy-grande",
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
    listeningCompSentence({
      id: "es-m4-5-lc-buena-mala",
      audioText: "la comida no es buena, es mala",
      correctMeaningEn: "the food isn't good, it's bad",
      distractorsEn: ["the food is very good", "the food is very old", "the food isn't new, it's old"],
      exercisedAtomSurfaces: ["bueno", "malo"],
    }),
    speaking("es-m4-5-speak-perro-bueno", "mi perro es muy bueno", "my dog is very good", ["perro", "muy", "bueno"]),
    reviewMatchPairs("es-m4-5-rev", "es-m4-5-rev-seed", "m4", 6),
    sentenceMcq({
      id: "es-m4-5-rev-q-dinero",
      prompt: "Tengo dinero, ___ no tengo tiempo.",
      correctText: "pero",
      distractorsText: ["muy", "y", "o"],
      exercisedAtomSurfaces: ["pero", "dinero"],
    }),
    infoStep(
      "es-m4-5-info-win",
      "You can give real opinions",
      "muy to turn it up, pero to turn it around — now you can say what's good, bad, and everything in between, with contrast.",
      "win",
    ),
  ],
};

// ─── es-m4-6 — Listening focus ──────────────────────────────────────────────

const M4_6: LessonContent = {
  id: "es-m4-6",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — descripciones",
  description: "Two look-alike adjectives, then full-sentence ear training.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m4-6-info-listen",
      "Train your ear",
      "Now a listening challenge: full sentences with adjectives you already know, plus two new ones — fácil and difícil. Focus on the sound, not just the text.",
      "default",
    ),
    vocabTextMcq("es-m4-6-tmcq-facil", "fácil", ["difícil", "feo", "malo"]),
    speaking("es-m4-6-speak-facil", "el examen es fácil", "the exam is easy", ["fácil"]),
    vocabTextMcq("es-m4-6-tmcq-dificil", "difícil", ["fácil", "feo", "malo"]),
    listeningCompSentence({
      id: "es-m4-6-lc-dificil",
      audioText: "el libro es muy difícil",
      correctMeaningEn: "the book is very difficult",
      distractorsEn: ["the book is very easy", "the book is very old", "the house is very big"],
      exercisedAtomSurfaces: ["libro", "difícil"],
    }),
    build(
      "es-m4-6-build-examen-facil",
      "Build: 'The exam is easy.'",
      "el examen es fácil",
      ["el", "examen", "es", "fácil", "difícil"],
      ["el", "examen", "es", "fácil"],
      ["fácil"],
    ),
    sentenceMcq({
      id: "es-m4-6-q-facil-context",
      prompt: "Solo tiene diez preguntas fáciles. El examen es ___.",
      correctText: "fácil",
      distractorsText: ["difícil", "malo", "feo"],
      exercisedAtomSurfaces: ["fácil"],
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
    sentenceMcq({
      id: "es-m4-6-q-dificil-context",
      prompt: "Este examen tiene cien preguntas y solo tengo una hora. Es muy ___.",
      correctText: "difícil",
      distractorsText: ["fácil", "bueno", "bonito"],
      exercisedAtomSurfaces: ["difícil"],
    }),
    speaking(
      "es-m4-6-speak-facil-dificil",
      "el español es fácil, pero el chino es difícil",
      "Spanish is easy, but Chinese is difficult",
      ["fácil", "difícil", "pero"],
    ),
    translateStep({
      id: "es-m4-6-tr-examen-dificil",
      promptEn: "The exam is difficult",
      acceptedAnswers: [
        "el examen es difícil",
        "El examen es difícil",
        "el examen es dificil",
        "El examen es dificil",
      ],
      audioText: "el examen es difícil",
      exercisedAtomSurfaces: ["difícil"],
    }),
    reviewMatchPairs("es-m4-6-rev", "es-m4-6-rev-seed", "m4", 6),
    listeningCompSentence({
      id: "es-m4-6-rev-lc-numeros",
      audioText: "tengo cinco llaves, pero necesito diez",
      correctMeaningEn: "I have five keys, but I need ten",
      distractorsEn: ["I have ten keys, but I need five", "I have five keys, but I need six", "I have five doors, but I need ten"],
      exercisedAtomSurfaces: ["cinco", "diez", "llave", "pero"],
    }),
    infoStep(
      "es-m4-6-info-win",
      "Your ear is trained",
      "Full sentences, real speed, no text to lean on — you understood colors, sizes, and now fácil and difícil too.",
      "win",
    ),
  ],
};

// ─── es-m4-7 — Integration: cognates ────────────────────────────────────────

const M4_7: LessonContent = {
  id: "es-m4-7",
  moduleId: "m4",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Cognados — interesante, inteligente",
  description: "Free vocabulary, plus a dialogue that pulls the whole module together.",
  estimatedMinutes: 9,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m4-7-info-cognates",
      "Cognates — free vocabulary",
      "Spanish and English share thousands of look-alike words. English -ent and -ing endings often surface as -ente in Spanish: intelligent → inteligente, interesting → interesante — you can already read them. Just pronounce them the Spanish way: pure vowels, stress on the second-to-last syllable.",
      "grammar",
    ),
    vocabTextMcq("es-m4-7-tmcq-interesante", "interesante", ["interesantes", "inteligente", "difícil"]),
    speaking("es-m4-7-speak-libro-interesante", "el libro es interesante", "the book is interesting", ["libro", "interesante"]),
    vocabMcq("es-m4-7-mcq-inteligente", { surface: "inteligente", meaningEn: "intelligent", emoji: "🧠" }, [BUENO, MALO, GRANDE]),
    sentenceMcq({
      id: "es-m4-7-q-inteligente-context",
      prompt: "Mi hermana sacó las mejores notas de la clase. Es muy ___.",
      correctText: "inteligente",
      distractorsText: ["inteligentes", "interesante", "simpático"],
      explanation: "-e adjectives keep one form for both genders — only the plural adds -s.",
      exercisedAtomSurfaces: ["inteligente"],
    }),
    build(
      "es-m4-7-build-interesante",
      "Build: 'The class is interesting.'",
      "la clase es interesante",
      ["la", "clase", "es", "interesante", "inteligente"],
      ["la", "clase", "es", "interesante"],
      ["interesante"],
    ),
    vocabMcq("es-m4-7-mcq-simpatico", { surface: "simpático", meaningEn: "nice / friendly", emoji: "😊" }, [BUENO, INTELIGENTE, GRANDE]),
    sentenceMcq({
      id: "es-m4-7-q-simpatico-context",
      prompt: "Todos en la fiesta lo quieren; siempre sonríe y ayuda a todos. Es muy ___.",
      correctText: "simpático",
      distractorsText: ["simpáticos", "interesante", "malo"],
      exercisedAtomSurfaces: ["simpático"],
    }),
    speaking(
      "es-m4-7-speak-inteligente-simpatico",
      "él es muy inteligente y simpático",
      "he is very intelligent and friendly",
      ["inteligente", "simpático"],
    ),
    selfExplain({
      id: "es-m4-7-self-explain-e-plural",
      anchorLabel: "You wrote: es muy inteligente",
      anchorAudioText: "es muy inteligente",
      question: "If you were describing two intelligent people (ellos son ___), what would change?",
      rule: { text: "Only the ending -s is added for plural: inteligente → inteligentes. The word never splits by gender." },
      surface: { text: "It would become inteligento for a group of people." },
      distractor: { text: "It stays exactly 'inteligente' even for plural, since -e adjectives never change at all." },
      ruleExplanation:
        "-e adjectives are gender-invariant but still mark plural: interesante→interesantes, inteligente→inteligentes. Gender never changes; number still does.",
    }),
    translateStep({
      id: "es-m4-7-tr-libro-interesante",
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
    listeningCompSentence({
      id: "es-m4-7-lc-clase-interesante",
      audioText: "la clase de español es muy interesante",
      correctMeaningEn: "the Spanish class is very interesting",
      distractorsEn: ["the Spanish class is very difficult", "the math class is very interesting", "the Spanish class is very boring"],
      exercisedAtomSurfaces: ["interesante"],
    }),
    dialogueListen({
      id: "es-m4-7-dialogue-amigos",
      lines: [
        { speaker: "Ana", text: "¿Cómo es tu nuevo maestro?", audioText: "¿Cómo es tu nuevo maestro?" },
        {
          speaker: "Luis",
          text: "Es muy inteligente y simpático, pero el examen es difícil.",
          audioText: "Es muy inteligente y simpático, pero el examen es difícil.",
        },
        { speaker: "Ana", text: "¿Y la clase?", audioText: "¿Y la clase?" },
        { speaker: "Luis", text: "Es interesante, no es aburrida.", audioText: "Es interesante, no es aburrida." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "¿Cómo es el maestro de Luis?",
          correctText: "Intelligent and friendly",
          distractors: ["Old and boring", "Bad and difficult", "Tall and short"],
          explanation: "inteligente y simpático — the two cognates from this lesson.",
        },
        {
          id: "q2",
          prompt: "¿Cómo es el examen?",
          correctText: "Difficult",
          distractors: ["Easy", "New", "Big"],
        },
      ],
      transcriptRevealAfter: "first-answer",
      exercisedAtomSurfaces: ["inteligente", "simpático", "difícil", "interesante", "maestro"],
    }),
    speaking(
      "es-m4-7-speak-close",
      "mi clase es interesante y mi maestra es simpática",
      "my class is interesting and my teacher is friendly",
      ["interesante", "simpático"],
    ),
    reviewMatchPairs("es-m4-7-rev", "es-m4-7-rev-seed", "m4", 6),
    build(
      "es-m4-7-rev-build-estudiante",
      "Build: 'The student is intelligent.'",
      "el estudiante es inteligente",
      ["el", "estudiante", "es", "inteligente", "simpático"],
      ["el", "estudiante", "es", "inteligente"],
      ["estudiante", "inteligente"],
    ),
    infoStep(
      "es-m4-7-info-win",
      "You can describe people fully",
      "Cognates, opinions, colors, order — you can now describe any person, place, or thing you meet, in real conversation.",
      "win",
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
  xpReward: 15,
  steps: [
    sentenceMcq({
      id: "es-m4-8-q-alta",
      prompt: "Mi hermana mide dos metros. Es muy ___.",
      correctText: "alta",
      distractorsText: ["alto", "altos", "altas"],
      exercisedAtomSurfaces: ["alto"],
    }),
    vocabMcq("es-m4-8-mcq-amarillo", { surface: "amarillo", meaningEn: "yellow", emoji: "🟡" }, [VERDE, AZUL, BLANCO]),
    build(
      "es-m4-8-build-gato",
      "Build: 'The cat is black.'",
      "el gato es negro",
      ["el", "gato", "es", "negro", "blanco"],
      ["el", "gato", "es", "negro"],
      ["gato", "negro"],
    ),
    cloze(
      "es-m4-8-cloze-muy",
      "el perro es",
      "bonito",
      "muy",
      ["muy", "pero", "y", "o"],
      "the dog is very pretty",
      "el perro es muy bonito",
    ),
    listeningCompSentence({
      id: "es-m4-8-lc-vieja",
      audioText: "la casa es muy vieja",
      correctMeaningEn: "the house is very old",
      distractorsEn: ["the house is very new", "the car is very old", "the house is very pretty"],
      exercisedAtomSurfaces: ["casa", "viejo"],
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
    agreementCloze(
      "es-m4-8-agr-altas",
      [
        { blank: { id: "b1", correctAnswer: "las", options: ["el", "la", "los", "las"] } },
        { text: " niñ" },
        { blank: { id: "b2", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
        { text: " alt" },
        { blank: { id: "b3", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
      ],
      "the tall girls",
      "las niñas altas",
      ["alto"],
    ),
    listeningBuildSentence({
      id: "es-m4-8-lb-carro-azul",
      target: "el carro es azul",
      tiles: ["el", "carro", "es", "azul", "verde"],
      correctOrder: ["el", "carro", "es", "azul"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["carro", "azul"],
    }),
    sentenceMcq({
      id: "es-m4-8-q-inteligente",
      prompt: "Mi amiga saca las mejores notas de la clase. Es muy ___.",
      correctText: "inteligente",
      distractorsText: ["inteligentes", "interesante", "simpático"],
      exercisedAtomSurfaces: ["inteligente"],
    }),
    listeningCompSentence({
      id: "es-m4-8-rev-lc-llaves",
      audioText: "tengo tres llaves nuevas",
      correctMeaningEn: "I have three new keys",
      distractorsEn: ["I have three old keys", "I have two new keys", "I have three new doors"],
      exercisedAtomSurfaces: ["tres", "llave", "nuevo"],
    }),
    speaking("es-m4-8-speak-simpatico", "él es muy simpático", "he is very friendly", ["simpático"]),
    sentenceMcq({
      id: "es-m4-8-rev-q-amigo",
      prompt: "Mi amigo es alto, pero mi amiga es ___.",
      correctText: "alta",
      distractorsText: ["alto", "bajo", "baja"],
      exercisedAtomSurfaces: ["alto", "amigo"],
    }),
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
