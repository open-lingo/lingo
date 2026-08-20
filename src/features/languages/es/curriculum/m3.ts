/**
 * Spanish Module 3 — Género y artículos (gender, articles, plurals, hay).
 *
 * The learner can introduce themselves; M3 hands them the nouns of daily
 * life and the machinery that goes around every one of them: grammatical
 * gender (-o/-a plus the famous exceptions el día and la mano), definite
 * el/la/los/las, indefinite un/una, plural formation (-s/-es), and hay
 * for what exists in a room or a bag.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m3-1  Gender + el/la — la casa, el libro
 *   es-m3-2  The -a crowd — mesa, silla, puerta, ventana
 *   es-m3-3  Un, una — desk objects
 *   es-m3-4  Los, las — plurals (-s / -es)
 *   es-m3-5  Hay — existence, en, aquí + the exceptions
 *   es-m3-6  Listening focus — articles by ear
 *   es-m3-7  Integration — a look around the house + speaking
 *   es-m3-8  M3 Mastery Test
 *
 * 2026-07-16 JA-standard reauthor: every topic lesson now runs 18-22 steps
 * across >=6 step types, carries >=2 production steps (typed translate +
 * speaking/build), lands one selfExplain at N-1 in each grammar lesson,
 * and closes L2-L7 with a compounding review tail drawing m1-m2 vocabulary
 * (`pickReviewSurfaces`/`reviewMatchPairs`, `beforeModule: "m3"`). Per the
 * spine, phrase cards teach nouns WITH their article (la casa) while atom
 * surfaces stay bare (casa) so match grids remain single-word.
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
  matchPairs,
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
import "./m2";

const COURSE_ID = "mock-1";

/** English gloss for a registered atom surface — powers the review-tail
 *  steps, which don't know at authoring time which prior-module surfaces
 *  `pickReviewSurfaces` will draw. */
function gloss(surface: string): string {
  return findEsAtomBySurface(surface)?.gloss ?? surface;
}

// ─── M3 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M3_ATOMS: EsAtom[] = [
  // Articles (definite + indefinite)
  atom({ surface: "el", meaningEn: "the (m)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "la", meaningEn: "the (f)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "los", meaningEn: "the (m pl)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "las", meaningEn: "the (f pl)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "un", meaningEn: "a (m)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "una", meaningEn: "a (f)", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  // Around the house
  atom({ surface: "casa", meaningEn: "house", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🏠" }),
  atom({ surface: "libro", meaningEn: "book", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📖" }),
  atom({ surface: "mesa", meaningEn: "table", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f" }),
  atom({ surface: "silla", meaningEn: "chair", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🪑", hint: "ll sounds like y: SEE-ya" }),
  atom({ surface: "puerta", meaningEn: "door", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🚪" }),
  atom({ surface: "ventana", meaningEn: "window", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🪟" }),
  // Desk & bag
  atom({ surface: "teléfono", meaningEn: "phone", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "☎️", hint: "stress the accented é: te-LE-fo-no" }),
  atom({ surface: "celular", meaningEn: "cell phone", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📱" }),
  atom({ surface: "computadora", meaningEn: "computer", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f" }),
  atom({ surface: "lápiz", meaningEn: "pencil", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "✏️", hint: "z sounds like s in Latin America: LA-pees" }),
  atom({ surface: "pluma", meaningEn: "pen", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🖊️" }),
  atom({ surface: "papel", meaningEn: "paper", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📄" }),
  atom({ surface: "mochila", meaningEn: "backpack", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🎒" }),
  atom({ surface: "llave", meaningEn: "key", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "🔑", hint: "ll sounds like y: YA-ve" }),
  atom({ surface: "dinero", meaningEn: "money", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "💰" }),
  atom({ surface: "agua", meaningEn: "water", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "💧", hint: "feminine — but the singular pairs with el: el agua" }),
  // The exceptions + odds and ends
  atom({ surface: "día", meaningEn: "day", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "m", emoji: "📅", hint: "the accented í gets its own beat: DEE-a" }),
  atom({ surface: "mano", meaningEn: "hand", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f", emoji: "✋" }),
  atom({ surface: "cosa", meaningEn: "thing", partOfSpeech: "noun", fromModule: "m3", kind: "vocab", gender: "f" }),
  atom({ surface: "hay", meaningEn: "there is / there are", partOfSpeech: "verb", fromModule: "m3", kind: "vocab", hint: "silent h — sounds like English 'eye'" }),
  atom({ surface: "en", meaningEn: "in / on / at", partOfSpeech: "particle", fromModule: "m3", kind: "particle" }),
  atom({ surface: "aquí", meaningEn: "here", partOfSpeech: "adverb", fromModule: "m3", kind: "vocab", hint: "qu is a plain k: a-KEE" }),
];

// Shared distractor pool for object-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// 1f3e0, 1f4d6, 1fa91, 1f6aa, 1fa9f, 260e, 1f4f1, 270f, 1f58a, 1f4c4,
// 1f392, 1f511, 1f4b0, 1f4a7, 1f4c5, 270b, checked at authoring time.
// (💻 is NOT in the subset, so computadora ships without emoji; mesa and
// cosa have no faithful glyph.)
const CASA = { surface: "casa", emoji: "🏠" };
const LIBRO = { surface: "libro", emoji: "📖" };
const SILLA = { surface: "silla", emoji: "🪑" };
const PUERTA = { surface: "puerta", emoji: "🚪" };
const VENTANA = { surface: "ventana", emoji: "🪟" };
const TELEFONO = { surface: "teléfono", emoji: "☎️" };
const CELULAR = { surface: "celular", emoji: "📱" };
const LAPIZ = { surface: "lápiz", emoji: "✏️" };
const PLUMA = { surface: "pluma", emoji: "🖊️" };
const PAPEL = { surface: "papel", emoji: "📄" };
const MOCHILA = { surface: "mochila", emoji: "🎒" };
const LLAVE = { surface: "llave", emoji: "🔑" };
const DINERO = { surface: "dinero", emoji: "💰" };
const AGUA = { surface: "agua", emoji: "💧" };
const DIA = { surface: "día", emoji: "📅" };
const MANO = { surface: "mano", emoji: "✋" };

// ─── es-m3-1 — Gender + el/la ───────────────────────────────────────────────

const M3_1: LessonContent = {
  id: "es-m3-1",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "El libro, la casa — gender",
  description: "Every Spanish noun picks a side. Meet el and la.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m3-1-info-genero",
      "Every noun has a gender",
      "Spanish nouns are masculine or feminine — the word itself, not the object. Words ending in -o are usually masculine, -a usually feminine, and 'the' matches: el libro (the book), la casa (the house). From here on, learn every noun together with its article — it carries the gender for you.",
      "grammar",
    ),
    phrase("es-m3-1-p-lacasa", "the house", "la casa", undefined, { atomId: "es:casa", emoji: "🏠" }),
    vocabMcq(
      "es-m3-1-mcq-casa",
      { surface: "casa", meaningEn: "house", emoji: "🏠" },
      [LIBRO, PUERTA, LLAVE],
    ),
    cloze(
      "es-m3-1-cz-la",
      "",
      "casa",
      "la",
      ["la", "el", "los", "un"],
      "the house",
      "la casa",
      undefined,
      ["casa"],
    ),
    build(
      "es-m3-1-b-ellibro",
      "Build: 'the book'",
      "el libro",
      ["el", "libro", "la", "los"],
      ["el", "libro"],
      ["el", "libro"],
    ),
    vocabMcq(
      "es-m3-1-mcq-libro",
      { surface: "libro", meaningEn: "book", emoji: "📖" },
      [CASA, PUERTA, LLAVE],
    ),
    sentenceMcq({
      id: "es-m3-1-q-ellibro",
      prompt: "¿Qué significa 'el libro'?",
      correctText: "the book",
      distractorsText: ["the house", "the door", "the key"],
      exercisedAtomSurfaces: ["el", "libro"],
    }),
    speaking("es-m3-1-speak-ellibro", "el libro", "the book", ["el", "libro"]),
    listeningCompSentence({
      id: "es-m3-1-lc-lacasa",
      audioText: "la casa",
      correctMeaningEn: "the house",
      distractorsEn: ["the book", "the door", "the table"],
      exercisedAtomSurfaces: ["la", "casa"],
    }),
    cloze(
      "es-m3-1-cz-el",
      "",
      "libro",
      "el",
      ["el", "la", "los", "una"],
      "the book",
      "el libro",
      undefined,
      ["libro"],
    ),
    build(
      "es-m3-1-b-casaylibro",
      "Build: 'the house and the book'",
      "la casa y el libro",
      ["la", "casa", "y", "el", "libro", "los"],
      ["la", "casa", "y", "el", "libro"],
      ["casa", "libro"],
    ),
    agreementCloze(
      "es-m3-1-agr-elibrolacasa",
      [
        { blank: { id: "b1", correctAnswer: "el", options: ["el", "la", "los", "las"] } },
        { text: " libro y " },
        { blank: { id: "b2", correctAnswer: "la", options: ["el", "la", "los", "las"] } },
        { text: " casa" },
      ],
      "the book and the house",
      "el libro y la casa",
      ["libro", "casa"],
    ),
    vocabTextMcq("es-m3-1-tmcq-libro", "libro", ["casa", "mesa", "puerta"]),
    translateStep({
      id: "es-m3-1-tr-casalibro",
      promptEn: "The house and the book",
      acceptedAnswers: [
        "la casa y el libro",
        "La casa y el libro",
        "la casa y el libro.",
        "La casa y el libro.",
      ],
      audioText: "la casa y el libro",
      exercisedAtomSurfaces: ["la", "casa", "y", "el", "libro"],
    }),
    listeningBuildSentence({
      id: "es-m3-1-lb-ellibro",
      target: "el libro",
      tiles: ["el", "libro", "la", "casa"],
      correctOrder: ["el", "libro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["el", "libro"],
    }),
    sentenceMcq({
      id: "es-m3-1-q-lacasa",
      prompt: "¿Qué significa 'la casa'?",
      correctText: "the house",
      distractorsText: ["the book", "the key", "the door"],
      exercisedAtomSurfaces: ["la", "casa"],
    }),
    selfExplain({
      id: "es-m3-1-self-genero",
      anchorLabel: "You wrote: la casa (not el casa)",
      anchorAudioText: "la casa",
      question: "Why does casa take la instead of el?",
      rule: { text: "casa ends in -a, so it's feminine — la has to agree with it." },
      surface: { text: "la just sounds better in front of casa, so it's used out of habit." },
      distractor: { text: "la is used because casa refers to a small, everyday object." },
      ruleExplanation:
        "Gender belongs to the word itself: most -a nouns are feminine (la) and most -o nouns are masculine (el). A handful of exceptions — like el día — keep an -a ending yet stay masculine, so every noun's article has to be learned by heart.",
    }),
    infoStep(
      "es-m3-1-info-win",
      "You can name what's around you",
      "You can now say 'the house' and 'the book' — and you know WHY each takes the article it does. Learn every new noun from here forward together with el or la.",
      "win",
    ),
  ],
};

// ─── es-m3-2 — The -a crowd ─────────────────────────────────────────────────

const M3_2_REV = pickReviewSurfaces("es-m3-2-rev-seed", "m3", 6);

const M3_2: LessonContent = {
  id: "es-m3-2",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "La mesa, la silla — the -a crowd",
  description: "Four corners of a room, all feminine.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m3-2-info-a",
      "Four rooms-worth of -a",
      "Like la casa, today's words all end in -a and all take la: la mesa (table), la silla (chair), la puerta (door), la ventana (window). Say the article as part of the word — that habit will carry you through the exceptions later.",
      "grammar",
    ),
    phrase("es-m3-2-p-mesa", "the table", "la mesa", undefined, { atomId: "es:mesa" }),
    // Text-front recognition rung — mesa has no faithful Noto glyph, so
    // it skipped the image-MCQ rung.
    vocabTextMcq("es-m3-2-tmcq-mesa", "mesa", ["silla", "puerta", "ventana"]),
    build(
      "es-m3-2-b-lamesa",
      "Build: 'the table'",
      "la mesa",
      ["la", "mesa", "el", "los"],
      ["la", "mesa"],
      ["la", "mesa"],
    ),
    phrase("es-m3-2-p-silla", "the chair", "la silla", undefined, { atomId: "es:silla", emoji: "🪑" }),
    vocabMcq(
      "es-m3-2-mcq-silla",
      { surface: "silla", meaningEn: "chair", emoji: "🪑" },
      [PUERTA, VENTANA, LLAVE],
    ),
    sentenceMcq({
      id: "es-m3-2-q-silla",
      prompt: "¿Qué significa 'la silla'?",
      correctText: "the chair",
      distractorsText: ["the table", "the door", "the window"],
      exercisedAtomSurfaces: ["la", "silla"],
    }),
    speaking("es-m3-2-speak-silla", "la silla", "the chair", ["la", "silla"]),
    phrase("es-m3-2-p-puerta", "the door", "la puerta", undefined, { atomId: "es:puerta", emoji: "🚪" }),
    vocabMcq(
      "es-m3-2-mcq-puerta",
      { surface: "puerta", meaningEn: "door", emoji: "🚪" },
      [VENTANA, SILLA, CASA],
    ),
    listeningCompSentence({
      id: "es-m3-2-lc-lapuerta",
      audioText: "la puerta",
      correctMeaningEn: "the door",
      distractorsEn: ["the table", "the window", "the chair"],
      exercisedAtomSurfaces: ["la", "puerta"],
    }),
    phrase("es-m3-2-p-ventana", "the window", "la ventana", undefined, { atomId: "es:ventana", emoji: "🪟" }),
    vocabMcq(
      "es-m3-2-mcq-ventana",
      { surface: "ventana", meaningEn: "window", emoji: "🪟" },
      [PUERTA, MOCHILA, LIBRO],
    ),
    cloze(
      "es-m3-2-cz-laventana",
      "",
      "ventana",
      "la",
      ["la", "el", "los", "una"],
      "the window",
      "la ventana",
      undefined,
      ["ventana"],
    ),
    build(
      "es-m3-2-b-puertayventana",
      "Build: 'the door and the window'",
      "la puerta y la ventana",
      ["la", "puerta", "y", "la", "ventana", "el"],
      ["la", "puerta", "y", "la", "ventana"],
      ["puerta", "ventana"],
    ),
    translateStep({
      id: "es-m3-2-tr-mesaysilla",
      promptEn: "The table and the chair",
      acceptedAnswers: [
        "la mesa y la silla",
        "La mesa y la silla",
        "la mesa y la silla.",
        "La mesa y la silla.",
      ],
      audioText: "la mesa y la silla",
      exercisedAtomSurfaces: ["la", "mesa", "y", "silla"],
    }),
    // Review rung: the whole room so far — atoms stay bare (single-word
    // grid rule); the article habit lives in the phrase cards.
    matchPairs("es-m3-2", ["casa", "libro", "mesa", "silla", "puerta", "ventana"]),
    speaking("es-m3-2-rev-speak-1", M3_2_REV[4], gloss(M3_2_REV[4]), [M3_2_REV[4]]),
    reviewMatchPairs("es-m3-2-rev", "es-m3-2-rev-seed", "m3", 6),
    listeningCompSentence({
      id: "es-m3-2-rev-lc-1",
      audioText: M3_2_REV[0],
      correctMeaningEn: gloss(M3_2_REV[0]),
      distractorsEn: [gloss(M3_2_REV[1]), gloss(M3_2_REV[2]), gloss(M3_2_REV[3])],
      exercisedAtomSurfaces: [M3_2_REV[0]],
    }),
    infoStep(
      "es-m3-2-info-win",
      "The room is yours",
      "La mesa, la silla, la puerta, la ventana — you can name every corner of a room, all with the same la.",
      "win",
    ),
  ],
};

// ─── es-m3-3 — Un, una ──────────────────────────────────────────────────────

const M3_3_REV = pickReviewSurfaces("es-m3-3-rev-seed", "m3", 6);

const M3_3: LessonContent = {
  id: "es-m3-3",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Un lápiz, una pluma — a/an",
  description: "The indefinite pair, with everything on your desk.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m3-3-info-ununa",
      "Un, una — a/an",
      "'A/an' splits the same way as 'the': un for masculine, una for feminine. un teléfono, un lápiz — una computadora, una pluma. Same gender, different job: el points at THE one, un means any one.",
      "grammar",
    ),
    phrase("es-m3-3-p-telefono", "a phone", "un teléfono", undefined, { atomId: "es:teléfono", emoji: "☎️" }),
    vocabMcq(
      "es-m3-3-mcq-telefono",
      { surface: "teléfono", meaningEn: "phone", emoji: "☎️" },
      [CELULAR, LAPIZ, PLUMA],
    ),
    build(
      "es-m3-3-b-untelefono",
      "Build: 'a phone'",
      "un teléfono",
      ["un", "teléfono", "una", "el"],
      ["un", "teléfono"],
      ["un", "teléfono"],
    ),
    phrase("es-m3-3-p-computadora", "a computer", "una computadora", undefined, { atomId: "es:computadora" }),
    // Text-front recognition rung — computadora ships without emoji (💻
    // not in the Noto subset), so it skipped the image-MCQ rung.
    vocabTextMcq("es-m3-3-tmcq-computadora", "computadora", [
      "teléfono",
      "celular",
      "pluma",
    ]),
    speaking("es-m3-3-speak-computadora", "una computadora", "a computer", ["una", "computadora"]),
    sentenceMcq({
      id: "es-m3-3-q-computadora",
      prompt: "¿Qué significa 'una computadora'?",
      correctText: "a computer",
      distractorsText: ["a phone", "a cell phone", "a pen"],
      exercisedAtomSurfaces: ["una", "computadora"],
    }),
    phrase("es-m3-3-p-lapiz", "a pencil", "un lápiz", undefined, { atomId: "es:lápiz", emoji: "✏️" }),
    vocabMcq(
      "es-m3-3-mcq-lapiz",
      { surface: "lápiz", meaningEn: "pencil", emoji: "✏️" },
      [PLUMA, PAPEL, CELULAR],
    ),
    // pluma's intro (2026-08-19) — it used to debut inside cz-una, which the
    // provenance gate rightly flags (a cloze can't be a word's first exposure).
    phrase("es-m3-3-p-pluma", "a pen", "una pluma", undefined, { atomId: "es:pluma", emoji: "🖊️" }),
    speaking("es-m3-3-speak-lapiz", "un lápiz", "a pencil", ["un", "lápiz"]),
    cloze(
      "es-m3-3-cz-una",
      "",
      "pluma",
      "una",
      ["una", "un", "la", "el"],
      "a pen",
      "una pluma",
      undefined,
      ["pluma"],
    ),
    listeningCompSentence({
      id: "es-m3-3-lc-unlapiz",
      audioText: "un lápiz",
      correctMeaningEn: "a pencil",
      distractorsEn: ["a pen", "a phone", "a key"],
      exercisedAtomSurfaces: ["un", "lápiz"],
    }),
    build(
      "es-m3-3-b-uncelular",
      "Build: 'a cell phone'",
      "un celular",
      ["un", "celular", "una", "el"],
      ["un", "celular"],
      ["un", "celular"],
    ),
    cloze(
      "es-m3-3-cz-un",
      "",
      "celular",
      "un",
      ["un", "una", "el", "los"],
      "a cell phone",
      "un celular",
      undefined,
      ["celular"],
    ),
    // Both indefinite articles in one graded set — the m/f pair side by side.
    agreementCloze(
      "es-m3-3-agr-ununa",
      [
        { blank: { id: "b1", correctAnswer: "un", options: ["un", "una", "el", "la"] } },
        { text: " lápiz y " },
        { blank: { id: "b2", correctAnswer: "una", options: ["un", "una", "el", "la"] } },
        { text: " pluma" },
      ],
      "a pencil and a pen",
      "un lápiz y una pluma",
      ["lápiz", "pluma"],
    ),
    // 2026-08-19: was a translate — converted to a build to bring the
    // module's translate share under 15% of production (inv 43).
    build(
      "es-m3-3-b-telefonocomputadora",
      "Build: 'a phone and a computer'",
      "un teléfono y una computadora",
      ["un", "teléfono", "y", "una", "computadora", "la"],
      ["un", "teléfono", "y", "una", "computadora"],
      ["un", "teléfono", "y", "una", "computadora"],
    ),
    // papel moved out of this grid (2026-08-19): the grid was its first
    // exposure, and match_pairs can't debut a word. It debuts in L4 now.
    matchPairs("es-m3-3", ["teléfono", "celular", "computadora", "lápiz", "pluma", "libro"]),
    selfExplain({
      id: "es-m3-3-self-ununa",
      anchorLabel: "You wrote: un lápiz y una pluma",
      anchorAudioText: "un lápiz y una pluma",
      question: "Why does lápiz take un but pluma takes una?",
      rule: { text: "un/una agree with the noun's gender, exactly like el/la — lápiz is masculine, pluma is feminine." },
      surface: { text: "un goes with short words, una with longer words." },
      distractor: { text: "un means 'one,' so it only appears with objects you can count on a desk." },
      ruleExplanation:
        "un and una are just the indefinite twins of el and la — same gender agreement, different job: 'a/an' instead of 'the.'",
    }),
    reviewMatchPairs("es-m3-3-rev", "es-m3-3-rev-seed", "m3", 6),
    listeningCompSentence({
      id: "es-m3-3-rev-lc-1",
      audioText: M3_3_REV[0],
      correctMeaningEn: gloss(M3_3_REV[0]),
      distractorsEn: [gloss(M3_3_REV[1]), gloss(M3_3_REV[2]), gloss(M3_3_REV[3])],
      exercisedAtomSurfaces: [M3_3_REV[0]],
    }),
    infoStep(
      "es-m3-3-info-win",
      "Your desk is fully stocked",
      "un teléfono, una computadora, un lápiz, una pluma — you can ask for anything on a desk and know which article it wants.",
      "win",
    ),
  ],
};

// ─── es-m3-4 — Los, las (plurals) ───────────────────────────────────────────

const M3_4_REV = pickReviewSurfaces("es-m3-4-rev-seed", "m3", 6);

const M3_4: LessonContent = {
  id: "es-m3-4",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Los libros, las llaves — plurals",
  description: "More than one: plural articles and the -s / -es rule.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m3-4-info-plural",
      "Los, las — and how nouns pluralize",
      "Plural 'the': los for masculine, las for feminine. The noun grows too — add -s after a vowel (libro → libros, llave → llaves) and -es after a consonant (papel → papeles). Article and noun always move together: el libro → los libros.",
      "grammar",
    ),
    phrase("es-m3-4-p-mochila", "the backpack", "la mochila", undefined, { atomId: "es:mochila", emoji: "🎒" }),
    vocabMcq(
      "es-m3-4-mcq-mochila",
      { surface: "mochila", meaningEn: "backpack", emoji: "🎒" },
      [LLAVE, LIBRO, PAPEL],
    ),
    build(
      "es-m3-4-b-lamochila",
      "Build: 'the backpack'",
      "la mochila",
      ["la", "mochila", "el", "los"],
      ["la", "mochila"],
      ["la", "mochila"],
    ),
    // papel's intro (2026-08-19) — L4 is where its -es plural is drilled, so
    // it debuts here on the image rung before q-papel/cz-los produce it.
    vocabMcq(
      "es-m3-4-mcq-papel",
      { surface: "papel", meaningEn: "paper", emoji: "📄" },
      [MOCHILA, LIBRO, LAPIZ],
    ),
    phrase("es-m3-4-p-llave", "the key", "la llave", undefined, { atomId: "es:llave", emoji: "🔑" }),
    vocabMcq(
      "es-m3-4-mcq-llave",
      { surface: "llave", meaningEn: "key", emoji: "🔑" },
      [MOCHILA, PLUMA, PUERTA],
    ),
    cloze(
      "es-m3-4-cz-las",
      "",
      "llaves",
      "las",
      ["las", "los", "la", "el"],
      "the keys",
      "las llaves",
      undefined,
      ["llave"],
    ),
    speaking("es-m3-4-speak-lallave", "la llave", "the key", ["la", "llave"]),
    sentenceMcq({
      id: "es-m3-4-q-papel",
      prompt: "Tengo un papel. Mi hermano tiene cuatro. ¿Cómo digo 'the papers' (his)?",
      correctText: "los papeles",
      distractorsText: ["el papeles", "los papel", "las papeles"],
      explanation: "-es after a consonant, and los agrees with the masculine plural.",
      exercisedAtomSurfaces: ["los", "papel"],
    }),
    cloze(
      "es-m3-4-cz-los",
      "",
      "papeles",
      "los",
      ["los", "las", "el", "la"],
      "the papers",
      "los papeles",
      undefined,
      ["papel"],
    ),
    build(
      "es-m3-4-b-loslibros",
      "Build: 'the books'",
      "los libros",
      ["los", "libros", "las", "el"],
      ["los", "libros"],
      ["libro"],
    ),
    listeningCompSentence({
      id: "es-m3-4-lc-lascosas",
      audioText: "las cosas",
      correctMeaningEn: "the things",
      distractorsEn: ["the thing", "the keys", "a thing"],
      exercisedAtomSurfaces: ["las", "cosa"],
    }),
    // Article and noun move together — both endings graded as one set.
    agreementCloze(
      "es-m3-4-agr-sillas",
      [
        { blank: { id: "b1", correctAnswer: "las", options: ["el", "la", "los", "las"] } },
        { text: " sill" },
        { blank: { id: "b2", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
      ],
      "the chairs",
      "las sillas",
      ["silla"],
    ),
    speaking("es-m3-4-speak-papeles", "los papeles", "the papers", ["papel"]),
    agreementCloze(
      "es-m3-4-agr-libros",
      [
        { blank: { id: "b1", correctAnswer: "los", options: ["el", "la", "los", "las"] } },
        { text: " libr" },
        { blank: { id: "b2", correctAnswer: "os", options: ["o", "a", "os", "as"] } },
      ],
      "the books",
      "los libros",
      ["libro"],
    ),
    // 2026-08-19: was a translate — converted to a build to bring the
    // module's translate share under 15% of production (inv 43).
    build(
      "es-m3-4-b-mochilasyllaves",
      "Build: 'the backpacks and the keys'",
      "las mochilas y las llaves",
      ["las", "mochilas", "y", "las", "llaves", "los"],
      ["las", "mochilas", "y", "las", "llaves"],
      ["las", "mochila", "y", "llave"],
    ),
    speaking("es-m3-4-speak-lasllaves", "las llaves", "the keys", ["las", "llave"]),
    matchPairs("es-m3-4", ["mochila", "llave", "papel", "cosa", "silla", "libro"]),
    selfExplain({
      id: "es-m3-4-self-plural",
      anchorLabel: "You wrote: los papeles (not los papels)",
      anchorAudioText: "los papeles",
      question: "Why does papel add -es instead of just -s?",
      rule: { text: "Nouns ending in a consonant add -es to pluralize; papel ends in -l, so papel → papeles." },
      surface: { text: "Longer words always take -es, shorter words take -s." },
      distractor: { text: "-es is added whenever the noun is masculine." },
      ruleExplanation:
        "The rule tracks the noun's LAST LETTER, not its gender or length: vowel-ending nouns add -s (libro → libros), consonant-ending nouns add -es (papel → papeles).",
    }),
    reviewMatchPairs("es-m3-4-rev", "es-m3-4-rev-seed", "m3", 6),
    listeningCompSentence({
      id: "es-m3-4-rev-lc-1",
      audioText: M3_4_REV[0],
      correctMeaningEn: gloss(M3_4_REV[0]),
      distractorsEn: [gloss(M3_4_REV[1]), gloss(M3_4_REV[2]), gloss(M3_4_REV[3])],
      exercisedAtomSurfaces: [M3_4_REV[0]],
    }),
    infoStep(
      "es-m3-4-info-win",
      "One becomes many",
      "los libros, las llaves, los papeles — you can pluralize anything you own, article and noun moving together.",
      "win",
    ),
  ],
};

// ─── es-m3-5 — Hay ──────────────────────────────────────────────────────────

const M3_5_REV = pickReviewSurfaces("es-m3-5-rev-seed", "m3", 6);

const M3_5: LessonContent = {
  id: "es-m3-5",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Hay — there is, there are",
  description: "Say what exists — plus the two famous exceptions.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m3-5-info-hay",
      "Hay — existence in one word",
      "hay covers both 'there is' and 'there are': hay un libro en la mesa (there's a book on the table), hay dos sillas (there are two chairs). en means in/on/at. And the h is silent — hay sounds like English 'eye'.",
      "grammar",
    ),
    phrase("es-m3-5-p-dinero", "the money", "el dinero", undefined, { atomId: "es:dinero", emoji: "💰" }),
    vocabMcq(
      "es-m3-5-mcq-dinero",
      { surface: "dinero", meaningEn: "money", emoji: "💰" },
      [LLAVE, PAPEL, TELEFONO],
    ),
    cloze(
      "es-m3-5-cz-hay",
      "",
      "un libro en la mesa",
      "hay",
      ["hay", "es", "en", "y"],
      "there is a book on the table",
      "hay un libro en la mesa",
    ),
    build(
      "es-m3-5-b-haydinero",
      "Build: 'there is money in the backpack'",
      "hay dinero en la mochila",
      ["hay", "dinero", "en", "la", "mochila", "es"],
      ["hay", "dinero", "en", "la", "mochila"],
      ["hay", "dinero", "en", "mochila"],
    ),
    cloze(
      "es-m3-5-cz-en",
      "hay dinero",
      "la mochila",
      "en",
      ["en", "y", "o", "de"],
      "there is money in the backpack",
      "hay dinero en la mochila",
    ),
    speaking("es-m3-5-speak-haydinero", "hay dinero aquí", "there is money here", ["hay", "dinero", "aquí"]),
    infoStep(
      "es-m3-5-info-excepciones",
      "El día, la mano",
      "Two famous rule-breakers: día ends in -a but is masculine — el día (as in buenos días) — and mano ends in -o but is feminine: la mano. One more quirk to file away: agua is feminine, yet the singular pairs with el for smoother sound — el agua.",
      "grammar",
    ),
    vocabMcq(
      "es-m3-5-mcq-dia",
      { surface: "día", meaningEn: "day", emoji: "📅" },
      [MANO, AGUA, DINERO],
    ),
    speaking("es-m3-5-speak-eldia", "el día", "the day", ["el", "día"]),
    sentenceMcq({
      id: "es-m3-5-q-dia",
      prompt: "¿Qué significa 'el día'?",
      correctText: "the day",
      distractorsText: ["the hand", "the water", "the money"],
      explanation: "One of the two famous exceptions — it keeps its -a but stays masculine.",
      exercisedAtomSurfaces: ["el", "día"],
    }),
    vocabMcq(
      "es-m3-5-mcq-mano",
      { surface: "mano", meaningEn: "hand", emoji: "✋" },
      [DIA, AGUA, LLAVE],
    ),
    speaking("es-m3-5-speak-lamano", "la mano", "the hand", ["la", "mano"]),
    sentenceMcq({
      id: "es-m3-5-q-mano",
      prompt: "¿Qué significa 'la mano'?",
      correctText: "the hand",
      distractorsText: ["the day", "the key", "the water"],
      explanation: "The other exception — it keeps its -o but is feminine.",
      exercisedAtomSurfaces: ["la", "mano"],
    }),
    listeningCompSentence({
      id: "es-m3-5-lc-agua",
      audioText: "hay agua aquí",
      correctMeaningEn: "there is water here",
      distractorsEn: ["there is money here", "there is a key here", "there is paper here"],
      exercisedAtomSurfaces: ["hay", "agua", "aquí"],
    }),
    translateStep({
      id: "es-m3-5-tr-hayagua",
      promptEn: "There is water here",
      acceptedAnswers: [
        "hay agua aquí",
        "Hay agua aquí",
        "hay agua aquí.",
        "Hay agua aquí.",
      ],
      audioText: "hay agua aquí",
      exercisedAtomSurfaces: ["hay", "agua", "aquí"],
    }),
    listeningBuildSentence({
      id: "es-m3-5-lb-haylibro",
      target: "hay un libro aquí",
      tiles: ["hay", "un", "libro", "aquí", "dinero"],
      correctOrder: ["hay", "un", "libro", "aquí"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hay", "un", "libro", "aquí"],
    }),
    matchPairs("es-m3-5", ["dinero", "agua", "día", "mano", "cosa", "aquí"]),
    selfExplain({
      id: "es-m3-5-self-hay",
      anchorLabel: "You wrote both: hay un libro / hay dos sillas",
      anchorAudioText: "hay dos sillas",
      question: "Why doesn't hay change between 'there is' (one book) and 'there are' (two chairs)?",
      rule: { text: "hay is invariant — the same word covers singular and plural; only the noun after it changes." },
      surface: { text: "hay changes to hayn for plurals, like verbs conjugate for 'they.'" },
      distractor: { text: "hay only means 'there are'; 'there is' uses es instead." },
      ruleExplanation:
        "Unlike ser or estar, hay never conjugates for number — hay un libro and hay dos sillas use the exact same word.",
    }),
    reviewMatchPairs("es-m3-5-rev", "es-m3-5-rev-seed", "m3", 6),
    listeningCompSentence({
      id: "es-m3-5-rev-lc-1",
      audioText: M3_5_REV[0],
      correctMeaningEn: gloss(M3_5_REV[0]),
      distractorsEn: [gloss(M3_5_REV[1]), gloss(M3_5_REV[2]), gloss(M3_5_REV[3])],
      exercisedAtomSurfaces: [M3_5_REV[0]],
    }),
    infoStep(
      "es-m3-5-info-win",
      "You can say what exists",
      "hay un libro, hay dos sillas, hay agua aquí — one word covers it all. You can now announce anything you find in a room or a bag.",
      "win",
    ),
  ],
};

// ─── es-m3-6 — Listening focus ──────────────────────────────────────────────

const M3_6_REV = pickReviewSurfaces("es-m3-6-rev-seed", "m3", 6);

const M3_6: LessonContent = {
  id: "es-m3-6",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — articles by ear",
  description: "El or la, un or una — let your ear decide.",
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    listeningCompSentence({
      id: "es-m3-6-lc-mesasilla",
      audioText: "la mesa y la silla",
      correctMeaningEn: "the table and the chair",
      distractorsEn: ["the door and the window", "a table and a chair", "the table and the door"],
      exercisedAtomSurfaces: ["la", "mesa", "silla"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-lapiz",
      target: "un lápiz",
      tiles: ["un", "lápiz", "una", "pluma"],
      correctOrder: ["un", "lápiz"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["un", "lápiz"],
    }),
    speaking("es-m3-6-speak-unacomputadora", "una computadora", "a computer", ["una", "computadora"]),
    // 2026-08-19: was a word_image_mcq — papel is known by L6, and the image
    // rung is first-exposure only (inv 44); review recognition goes text-front.
    vocabTextMcq("es-m3-6-tmcq-papel", "papel", ["llave", "mochila", "dinero"]),
    listeningCompSentence({
      id: "es-m3-6-lc-computadora",
      audioText: "una computadora",
      correctMeaningEn: "a computer",
      distractorsEn: ["a cell phone", "a telephone", "a backpack"],
      exercisedAtomSurfaces: ["una", "computadora"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-haylibros",
      target: "hay dos libros en la mesa",
      tiles: ["hay", "dos", "libros", "en", "la", "mesa"],
      correctOrder: ["hay", "dos", "libros", "en", "la", "mesa"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hay", "en", "mesa"],
    }),
    build(
      "es-m3-6-b-uncelular",
      "Build: 'a cell phone'",
      "un celular",
      ["un", "celular", "una", "el"],
      ["un", "celular"],
      ["un", "celular"],
    ),
    listeningCompSentence({
      id: "es-m3-6-lc-celular",
      audioText: "un celular",
      correctMeaningEn: "a cell phone",
      distractorsEn: ["a computer", "a telephone", "a key"],
      exercisedAtomSurfaces: ["un", "celular"],
    }),
    sentenceMcq({
      id: "es-m3-6-q-lasllaves",
      prompt: "¿Qué significa 'las llaves'?",
      correctText: "the keys",
      distractorsText: ["the key", "the backpacks", "a key"],
      exercisedAtomSurfaces: ["las", "llave"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-llaves",
      target: "las llaves y el dinero",
      tiles: ["las", "llaves", "y", "el", "dinero"],
      correctOrder: ["las", "llaves", "y", "el", "dinero"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["las", "el", "dinero"],
    }),
    translateStep({
      id: "es-m3-6-tr-hayllaves",
      promptEn: "There is a pen here",
      acceptedAnswers: [
        "hay una pluma aquí",
        "Hay una pluma aquí",
        "hay una pluma aquí.",
        "Hay una pluma aquí.",
      ],
      audioText: "hay una pluma aquí",
      exercisedAtomSurfaces: ["hay", "una", "pluma", "aquí"],
    }),
    agreementCloze(
      "es-m3-6-agr-lasmesas",
      [
        { blank: { id: "b1", correctAnswer: "las", options: ["el", "la", "los", "las"] } },
        { text: " mes" },
        { blank: { id: "b2", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
      ],
      "the tables",
      "las mesas",
      ["mesa"],
    ),
    listeningCompSentence({
      id: "es-m3-6-lc-pluma",
      audioText: "hay una pluma aquí",
      correctMeaningEn: "there is a pen here",
      distractorsEn: ["there is a pencil here", "there is paper here", "is there a pen?"],
      exercisedAtomSurfaces: ["hay", "pluma", "aquí"],
    }),
    listeningBuildSentence({
      id: "es-m3-6-lb-papel",
      target: "el papel",
      tiles: ["el", "papel", "la", "puerta"],
      correctOrder: ["el", "papel"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["el", "papel"],
    }),
    speaking("es-m3-6-rev-speak-1", M3_6_REV[4], gloss(M3_6_REV[4]), [M3_6_REV[4]]),
    reviewMatchPairs("es-m3-6-rev", "es-m3-6-rev-seed", "m3", 6),
    listeningCompSentence({
      id: "es-m3-6-rev-lc-1",
      audioText: M3_6_REV[0],
      correctMeaningEn: gloss(M3_6_REV[0]),
      distractorsEn: [gloss(M3_6_REV[1]), gloss(M3_6_REV[2]), gloss(M3_6_REV[3])],
      exercisedAtomSurfaces: [M3_6_REV[0]],
    }),
    infoStep(
      "es-m3-6-info-win",
      "Your ear knows the difference",
      "el/la, un/una, singular/plural — you can catch the article by ear now, not just by eye.",
      "win",
    ),
  ],
};

// ─── es-m3-7 — Integration dialogue ─────────────────────────────────────────

const M3_7_REV = pickReviewSurfaces("es-m3-7-rev-seed", "m3", 6);

const M3_7: LessonContent = {
  id: "es-m3-7",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En la casa — a look around",
  description: "Walk a room in Spanish and say what's in it.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m3-7-info-dialogo",
      "What's in the house?",
      "Two friends walk through a house, naming what they see. Listen for hay doing double duty — 'there is' and 'there are' — without ever changing shape.",
      "default",
    ),
    dialogueListen({
      id: "es-m3-7-dlg-casa",
      lines: [
        { speaker: "Ana", text: "Aquí hay una mesa y cuatro sillas.", audioText: "Aquí hay una mesa y cuatro sillas." },
        { speaker: "Luis", text: "¿Hay una computadora?", audioText: "¿Hay una computadora?" },
        { speaker: "Ana", text: "Sí, hay una computadora y un teléfono.", audioText: "Sí, hay una computadora y un teléfono." },
        { speaker: "Luis", text: "¿Y en la mochila?", audioText: "¿Y en la mochila?" },
        { speaker: "Ana", text: "Hay dos libros, un lápiz y las llaves.", audioText: "Hay dos libros, un lápiz y las llaves." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "¿Qué hay en la mochila?",
          correctText: "dos libros, un lápiz y las llaves",
          distractors: [
            "una computadora y un teléfono",
            "una mesa y cuatro sillas",
            "el dinero y una pluma",
          ],
        },
        {
          id: "q2",
          prompt: "¿Cuántas sillas hay?",
          correctText: "cuatro",
          distractors: ["dos", "una", "tres"],
        },
      ],
      exercisedAtomSurfaces: ["hay", "un", "una", "las"],
    }),
    build(
      "es-m3-7-b-sillas",
      "Say: 'There are two chairs here.'",
      "hay dos sillas aquí",
      ["hay", "dos", "sillas", "aquí", "mesa"],
      ["hay", "dos", "sillas", "aquí"],
      ["hay", "aquí"],
    ),
    sentenceMcq({
      id: "es-m3-7-q-unacasa",
      prompt: "¿Qué significa 'una casa'?",
      correctText: "a house",
      distractorsText: ["a book", "the house", "a room"],
      exercisedAtomSurfaces: ["una", "casa"],
    }),
    // 2026-08-19: was a word_image_mcq on already-known llave (inv 44) — the
    // retrieval is an article cloze now, which also re-drills gender.
    cloze(
      "es-m3-7-cz-lallave",
      "",
      "llave",
      "la",
      ["la", "el", "los", "las"],
      "the key",
      "la llave",
      undefined,
      ["llave"],
    ),
    speaking(
      "es-m3-7-speak-celular",
      "hay un celular aquí",
      "there is a cell phone here",
      ["hay", "celular", "aquí"],
    ),
    cloze(
      "es-m3-7-cz-puerta",
      "hay una llave",
      "la puerta",
      "en",
      ["en", "y", "o", "de"],
      "there is a key in the door",
      "hay una llave en la puerta",
    ),
    // 2026-08-19: was a word_image_mcq on already-known mochila (inv 44).
    vocabTextMcq("es-m3-7-tmcq-mochila", "mochila", ["llave", "libro", "pluma"]),
    translateStep({
      id: "es-m3-7-tr-agua",
      promptEn: "There is water on the table",
      acceptedAnswers: [
        "hay agua en la mesa",
        "Hay agua en la mesa",
        "hay agua en la mesa.",
        "Hay agua en la mesa.",
      ],
      audioText: "hay agua en la mesa",
      exercisedAtomSurfaces: ["hay", "agua", "en", "mesa"],
    }),
    listeningCompSentence({
      id: "es-m3-7-lc-libros",
      audioText: "hay dos libros en la mesa",
      correctMeaningEn: "there are two books on the table",
      distractorsEn: ["there is a book on the table", "there are two books on the door", "there are two chairs on the table"],
      exercisedAtomSurfaces: ["hay", "en", "mesa"],
    }),
    speaking(
      "es-m3-7-speak-libros",
      "hay dos libros en la mesa",
      "there are two books on the table",
      ["hay", "en", "mesa"],
    ),
    agreementCloze(
      "es-m3-7-agr-losdias",
      [
        { blank: { id: "b1", correctAnswer: "los", options: ["el", "la", "los", "las"] } },
        { text: " dí" },
        { blank: { id: "b2", correctAnswer: "as", options: ["o", "a", "os", "as"] } },
      ],
      "the days",
      "los días",
      ["día"],
    ),
    build(
      "es-m3-7-b-lasllaves",
      "Say: 'There are keys in the backpack.'",
      "hay llaves en la mochila",
      ["hay", "llaves", "en", "la", "mochila", "el"],
      ["hay", "llaves", "en", "la", "mochila"],
      ["hay", "llave", "en", "mochila"],
    ),
    matchPairs("es-m3-7", ["mesa", "silla", "computadora", "teléfono", "mochila", "libro"]),
    speaking("es-m3-7-rev-speak-1", M3_7_REV[4], gloss(M3_7_REV[4]), [M3_7_REV[4]]),
    reviewMatchPairs("es-m3-7-rev", "es-m3-7-rev-seed", "m3", 6),
    listeningCompSentence({
      id: "es-m3-7-rev-lc-1",
      audioText: M3_7_REV[0],
      correctMeaningEn: gloss(M3_7_REV[0]),
      distractorsEn: [gloss(M3_7_REV[1]), gloss(M3_7_REV[2]), gloss(M3_7_REV[3])],
      exercisedAtomSurfaces: [M3_7_REV[0]],
    }),
    infoStep(
      "es-m3-7-info-win",
      "You can describe a room",
      "You just walked through a house in Spanish — naming furniture, counting chairs, and saying what's in the bag. That's a real conversation.",
      "win",
    ),
  ],
};

// ─── es-m3-8 — Mastery test ─────────────────────────────────────────────────

const M3_8_REV = pickReviewSurfaces("es-m3-8-rev-seed", "m3", 4);

const M3_8: LessonContent = {
  id: "es-m3-8",
  moduleId: "m3",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M3 Mastery Test",
  description: "Gender, el/la/los/las, un/una, plurals, and hay.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    cloze(
      "es-m3-8-cz-el",
      "",
      "teléfono",
      "el",
      ["el", "la", "los", "las"],
      "the phone",
      "el teléfono",
    ),
    sentenceMcq({
      id: "es-m3-8-q-pluma",
      prompt: "'A pen' — pick it.",
      correctText: "una pluma",
      distractorsText: ["un pluma", "una lápiz", "el pluma"],
      exercisedAtomSurfaces: ["una", "pluma"],
    }),
    translateStep({
      id: "es-m3-8-tr-mochila",
      promptEn: "There is a book in the backpack",
      acceptedAnswers: [
        "hay un libro en la mochila",
        "Hay un libro en la mochila",
        "hay un libro en la mochila.",
        "Hay un libro en la mochila.",
      ],
      audioText: "hay un libro en la mochila",
      exercisedAtomSurfaces: ["hay", "un", "libro", "en", "mochila"],
    }),
    // 2026-08-19: was a word_image_mcq on already-known mochila (inv 44).
    vocabTextMcq("es-m3-8-tmcq-mochila", "mochila", ["llave", "silla", "dinero"]),
    cloze(
      "es-m3-8-cz-en",
      "hay dos plumas",
      "la mesa",
      "en",
      ["en", "de", "y", "o"],
      "there are two pens on the table",
      "hay dos plumas en la mesa",
    ),
    build(
      "es-m3-8-b-lacasaylibro",
      "Build: 'the house and the book'",
      "la casa y el libro",
      ["la", "casa", "y", "el", "libro", "los"],
      ["la", "casa", "y", "el", "libro"],
      ["casa", "libro"],
    ),
    sentenceMcq({
      id: "es-m3-8-q-dias",
      prompt: "'The days' — pick it.",
      correctText: "los días",
      distractorsText: ["las días", "los día", "el días"],
      exercisedAtomSurfaces: ["los", "día"],
    }),
    listeningCompSentence({
      id: "es-m3-8-lc-llaves",
      audioText: "las llaves y el celular",
      correctMeaningEn: "the keys and the cell phone",
      distractorsEn: [
        "the key and the computer",
        "the keys and the telephone",
        "a key and a cell phone",
      ],
      exercisedAtomSurfaces: ["las", "celular"],
    }),
    listeningBuildSentence({
      id: "es-m3-8-lb-agua",
      target: "hay agua aquí",
      tiles: ["hay", "agua", "aquí", "dinero"],
      correctOrder: ["hay", "agua", "aquí"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["hay", "agua", "aquí"],
    }),
    sentenceMcq({
      id: "es-m3-8-q-mano",
      prompt: "'The hand' — pick it.",
      correctText: "la mano",
      distractorsText: ["el mano", "las mano", "los manos"],
      exercisedAtomSurfaces: ["la", "mano"],
    }),
    speaking("es-m3-8-speak-lassillas", "las sillas y la mesa", "the chairs and the table", ["las", "silla", "mesa"]),
    // Prior-module review sample (m1-m2: numbers, greetings, pronouns, ser).
    listeningCompSentence({
      id: "es-m3-8-rev-lc-1",
      audioText: M3_8_REV[0],
      correctMeaningEn: gloss(M3_8_REV[0]),
      distractorsEn: [gloss(M3_8_REV[1]), gloss(M3_8_REV[2]), gloss(M3_8_REV[3])],
      exercisedAtomSurfaces: [M3_8_REV[0]],
    }),
    sentenceMcq({
      id: "es-m3-8-rev-q-1",
      prompt: `¿Qué significa '${M3_8_REV[1]}'?`,
      correctText: gloss(M3_8_REV[1]),
      distractorsText: [gloss(M3_8_REV[2]), gloss(M3_8_REV[3]), gloss(M3_8_REV[0])],
      exercisedAtomSurfaces: [M3_8_REV[1]],
    }),
  ],
};

export const ES_M3_LESSONS: LessonContent[] = [
  M3_1,
  M3_2,
  M3_3,
  M3_4,
  M3_5,
  M3_6,
  M3_7,
  M3_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M3_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m3",
      moduleId: "m3",
      build: () =>
        cloze(
          "pt-es-screen-m3",
          "",
          "casa",
          "la",
          ["la", "el", "los", "un"],
          "the house",
          "la casa",
        ),
    },
  ],
  byModule: [
    {
      id: "pt-es-m3-1",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-es-m3-1",
          prompt: "'A computer' — pick it.",
          correctText: "una computadora",
          distractorsText: ["un computadora", "el computadora", "unos computadora"],
        }),
    },
    {
      id: "pt-es-m3-2",
      moduleId: "m3",
      build: () =>
        cloze(
          "pt-es-m3-2",
          "",
          "libros",
          "los",
          ["los", "las", "el", "la"],
          "the books",
          "los libros",
        ),
    },
    {
      id: "pt-es-m3-3",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-es-m3-3",
          prompt: "'There are two chairs' — pick it.",
          correctText: "hay dos sillas",
          distractorsText: ["hay dos silla", "es dos sillas", "hay una silla"],
        }),
    },
    {
      id: "pt-es-m3-4",
      moduleId: "m3",
      build: () =>
        sentenceMcq({
          id: "pt-es-m3-4",
          prompt: "'The day' — pick it.",
          correctText: "el día",
          distractorsText: ["la día", "los día", "las día"],
        }),
    },
  ],
};
