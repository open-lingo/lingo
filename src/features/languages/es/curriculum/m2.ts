/**
 * Spanish Module 2 — Presentaciones (introductions, ser, tú/usted).
 *
 * The learner can greet and count; M2 makes them a person with a name.
 * Grammar spine: subject pronouns yo/tú/usted/él/ella, ser singular
 * (soy/eres/es), me llamo / ¿cómo te llamas? (with ¿cómo se llama usted?
 * shown for formal address), nationality adjectives m/f, and the tú vs
 * usted register split (culture note: Spain's vosotros; this course uses
 * ustedes).
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m2-1  Me llamo — names + amigo/amiga
 *   es-m2-2  Yo soy — ser I (soy, eres), estudiante
 *   es-m2-3  Él es, ella es — third person + maestro/maestra
 *   es-m2-4  Tú y usted — formal register, señor/señora, doctor/doctora
 *   es-m2-5  ¿De dónde eres? — origin + nationality
 *   es-m2-6  Listening focus — short phrases (m2–m4 carve-out)
 *   es-m2-7  Integration — a first conversation + speaking
 *   es-m2-8  M2 Mastery Test
 *
 * M2 listening stays at short-phrase level (allowed m2–m4 per the spine;
 * sentence-only listening ratchets in from m5).
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
  matchPairs,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";

// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m1";

const COURSE_ID = "mock-1";

// ─── M2 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M2_ATOMS: EsAtom[] = [
  // Subject pronouns
  atom({ surface: "yo", meaningEn: "I", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "tú", meaningEn: "you (informal)", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "the accent distinguishes tú (you) from tu (your)" }),
  atom({ surface: "usted", meaningEn: "you (formal)", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "él", meaningEn: "he", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "the accent distinguishes él (he) from el (the)" }),
  atom({ surface: "ella", meaningEn: "she", partOfSpeech: "pronoun", fromModule: "m2", kind: "vocab", hint: "ll sounds like y: EH-ya" }),
  // Ser, singular
  atom({ surface: "ser", meaningEn: "to be (identity)", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "soy", meaningEn: "I am", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "eres", meaningEn: "you are", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "es", meaningEn: "he/she/it is", partOfSpeech: "verb", fromModule: "m2", kind: "vocab" }),
  // Name phrases
  atom({ surface: "me llamo", meaningEn: "my name is", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "ll sounds like y: meh YA-mo" }),
  atom({ surface: "¿cómo te llamas?", meaningEn: "what's your name?", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase", hint: "ll sounds like y: YA-mas" }),
  // Function word
  atom({ surface: "de", meaningEn: "of / from", partOfSpeech: "particle", fromModule: "m2", kind: "particle" }),
  // People
  atom({ surface: "señor", meaningEn: "Mr. / sir", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "👨", hint: "ñ sounds like ny: seh-NYOR" }),
  atom({ surface: "señora", meaningEn: "Mrs. / ma'am", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f", emoji: "👩", hint: "ñ sounds like ny: seh-NYO-ra" }),
  atom({ surface: "amigo", meaningEn: "friend (m)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m" }),
  atom({ surface: "amiga", meaningEn: "friend (f)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f" }),
  // Places
  atom({ surface: "México", meaningEn: "Mexico", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", hint: "this x sounds like an English h: ME-hee-ko" }),
  atom({ surface: "España", meaningEn: "Spain", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", hint: "ñ sounds like ny: es-PA-nya" }),
  atom({ surface: "Estados Unidos", meaningEn: "United States", partOfSpeech: "noun", fromModule: "m2", kind: "vocab" }),
  // Nationalities
  atom({ surface: "mexicano", meaningEn: "Mexican (m)", partOfSpeech: "adjective", fromModule: "m2", kind: "vocab", hint: "x like an English h: me-hee-KA-no" }),
  atom({ surface: "mexicana", meaningEn: "Mexican (f)", partOfSpeech: "adjective", fromModule: "m2", kind: "vocab" }),
  atom({ surface: "español", meaningEn: "Spanish / Spaniard (m)", partOfSpeech: "adjective", fromModule: "m2", kind: "vocab", hint: "ñ sounds like ny: es-pa-NYOL" }),
  atom({ surface: "estadounidense", meaningEn: "American", partOfSpeech: "adjective", fromModule: "m2", kind: "vocab" }),
  // Occupations
  atom({ surface: "maestro", meaningEn: "teacher (m)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "👨‍🏫" }),
  atom({ surface: "maestra", meaningEn: "teacher (f)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f", emoji: "👩‍🏫" }),
  atom({ surface: "estudiante", meaningEn: "student", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", emoji: "🎓" }),
  atom({ surface: "doctor", meaningEn: "doctor (m)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "m", emoji: "👨‍⚕️" }),
  atom({ surface: "doctora", meaningEn: "doctor (f)", partOfSpeech: "noun", fromModule: "m2", kind: "vocab", gender: "f" }),
  // Origin question
  atom({ surface: "¿de dónde eres?", meaningEn: "where are you from?", partOfSpeech: "phrase", fromModule: "m2", kind: "phrase" }),
];

// Shared distractor pool for people-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// 1f468, 1f469, 1f468_200d_1f3eb, 1f469_200d_1f3eb, 1f393,
// 1f468_200d_2695, checked at authoring time. (👩‍⚕️ is NOT in the
// subset, so doctora ships without emoji.)
const SENOR = { surface: "señor", emoji: "👨" };
const SENORA = { surface: "señora", emoji: "👩" };
const MAESTRO = { surface: "maestro", emoji: "👨‍🏫" };
const MAESTRA = { surface: "maestra", emoji: "👩‍🏫" };
const ESTUDIANTE = { surface: "estudiante", emoji: "🎓" };
const DOCTOR = { surface: "doctor", emoji: "👨‍⚕️" };

// ─── es-m2-1 — Me llamo ─────────────────────────────────────────────────────

const M2_1: LessonContent = {
  id: "es-m2-1",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Me llamo — say your name",
  description: "Give your name, ask for theirs, and greet a friend.",
  estimatedMinutes: 5,
  xpReward: 12,
  steps: [
    infoStep(
      "es-m2-1-info-mellamo",
      "Me llamo — my name is",
      "To give your name, say me llamo + your name: me llamo Ana. Literally it means 'I call myself' — no word for 'is' needed. The double ll sounds like English y: meh YA-mo. To ask for a name, use ¿cómo te llamas? — and remember the upside-down ¿ that opens every Spanish question.",
      "grammar",
    ),
    phrase("es-m2-1-p-mellamo", "my name is", "me llamo"),
    phrase("es-m2-1-p-comotellamas", "what's your name?", "¿cómo te llamas?"),
    sentenceMcq({
      id: "es-m2-1-q-mellamo",
      prompt: "How do you say 'my name is Ana'?",
      correctText: "me llamo Ana",
      distractorsText: ["¿cómo te llamas?", "mucho gusto", "hasta luego"],
      exercisedAtomSurfaces: ["me llamo"],
    }),
    sentenceMcq({
      id: "es-m2-1-q-comotellamas",
      prompt: "You want to ask someone's name. What do you say?",
      correctText: "¿cómo te llamas?",
      distractorsText: ["me llamo Ana", "buenos días", "por favor"],
      exercisedAtomSurfaces: ["¿cómo te llamas?"],
    }),
    phrase("es-m2-1-p-amigo", "friend (m)", "amigo"),
    phrase("es-m2-1-p-amiga", "friend (f)", "amiga"),
    // Text-front recognition rung — amigo has no emoji, so the image MCQ
    // rung skipped it; the -o/-a contrast is the real discriminator here.
    vocabTextMcq("es-m2-1-tmcq-amigo", "amigo", ["amiga", "hola", "gracias"]),
    build(
      "es-m2-1-b-amigo",
      "Greet a (male) friend: 'Hello, friend!'",
      "hola amigo",
      ["hola", "amigo", "amiga", "gracias"],
      ["hola", "amigo"],
      ["amigo"],
    ),
    listeningCompSentence({
      id: "es-m2-1-lc-amiga",
      audioText: "adiós, amiga",
      correctMeaningEn: "goodbye, friend (f)",
      distractorsEn: ["hello, friend (m)", "nice to meet you", "good afternoon"],
      exercisedAtomSurfaces: ["amiga"],
    }),
  ],
};

// ─── es-m2-2 — Yo soy ───────────────────────────────────────────────────────

const M2_2: LessonContent = {
  id: "es-m2-2",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Yo soy — I am",
  description: "The verb ser: soy and eres, plus your first job title.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m2-2-info-ser",
      "Ser — to be (who you are)",
      "Ser is the verb for saying who or what someone is. Each person gets its own form, so the pronoun is optional: yo soy (I am), tú eres (you are), él/ella es (he/she is). yo = I, tú = you (one friend). Use ser for names, jobs, and where you're from.",
      "grammar",
    ),
    phrase("es-m2-2-p-soy", "I am", "soy"),
    cloze(
      "es-m2-2-cz-eres",
      "tú",
      "Carlos",
      "eres",
      ["eres", "soy", "es", "ser"],
      "you are Carlos",
      "tú eres Carlos",
    ),
    build(
      "es-m2-2-b-yosoy",
      "Say: 'I am Ana.'",
      "yo soy Ana",
      ["yo", "soy", "Ana", "eres"],
      ["yo", "soy", "Ana"],
      ["yo", "soy"],
    ),
    sentenceMcq({
      id: "es-m2-2-q-ser",
      prompt: "Soy and eres are forms of one verb. Which is its dictionary form, 'to be'?",
      correctText: "ser",
      distractorsText: ["soy", "eres", "yo"],
      explanation: "Dictionary forms end in -r; the other two are already matched to a person.",
      exercisedAtomSurfaces: ["ser"],
    }),
    phrase("es-m2-2-p-estudiante", "student", "estudiante", undefined, { emoji: "🎓" }),
    sentenceMcq({
      id: "es-m2-2-q-estudiante",
      prompt: "'I am a student' — pick it.",
      correctText: "soy estudiante",
      distractorsText: ["eres estudiante", "yo eres estudiante", "me llamo estudiante"],
      explanation: "No word for 'a' before jobs in Spanish — the first-person verb form is enough.",
      exercisedAtomSurfaces: ["soy", "estudiante"],
    }),
    translateStep({
      id: "es-m2-2-tr-eres",
      promptEn: "You are a student",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "tú eres estudiante",
        "Tú eres estudiante",
        "tu eres estudiante",
        "Tu eres estudiante",
        "eres estudiante",
        "Eres estudiante",
      ],
      audioText: "tú eres estudiante",
      exercisedAtomSurfaces: ["tú", "eres", "estudiante"],
    }),
    speaking("es-m2-2-speak-soy", "yo soy estudiante", "I am a student", ["yo", "soy", "estudiante"]),
  ],
};

// ─── es-m2-3 — Él es, ella es ───────────────────────────────────────────────

const M2_3: LessonContent = {
  id: "es-m2-3",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Él es, ella es — he and she",
  description: "Talk about other people — and meet the teachers.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m2-3-info-elella",
      "Él y ella",
      "él = he (the accent mark is part of the word), ella = she (EH-ya). Both take es: él es maestro, ella es maestra. Two things to notice — job words have no 'a' in front of them, and they match the person: -o for a man, -a for a woman.",
      "grammar",
    ),
    phrase("es-m2-3-p-maestro", "teacher (m)", "maestro", undefined, { emoji: "👨‍🏫" }),
    phrase("es-m2-3-p-maestra", "teacher (f)", "maestra", undefined, { emoji: "👩‍🏫" }),
    vocabMcq(
      "es-m2-3-mcq-maestro",
      { surface: "maestro", meaningEn: "teacher (m)", emoji: "👨‍🏫" },
      [MAESTRA, ESTUDIANTE, DOCTOR],
    ),
    sentenceMcq({
      id: "es-m2-3-q-ella",
      prompt: "'She is a teacher' — pick it.",
      correctText: "ella es maestra",
      distractorsText: ["él es maestro", "ella es maestro", "ella soy maestra"],
      exercisedAtomSurfaces: ["ella", "es", "maestra"],
    }),
    sentenceMcq({
      id: "es-m2-3-q-el",
      prompt: "'He is a teacher' — pick it.",
      correctText: "él es maestro",
      distractorsText: ["ella es maestra", "él es maestra", "él eres maestro"],
      exercisedAtomSurfaces: ["él", "es", "maestro"],
    }),
    cloze(
      "es-m2-3-cz-es",
      "ella",
      "estudiante",
      "es",
      ["es", "soy", "eres", "ser"],
      "she is a student",
      "ella es estudiante",
    ),
    translateStep({
      id: "es-m2-3-tr-el",
      promptEn: "He is a student",
      acceptedAnswers: [
        "él es estudiante",
        "Él es estudiante",
        "el es estudiante",
        "El es estudiante",
      ],
      audioText: "él es estudiante",
      exercisedAtomSurfaces: ["él", "es", "estudiante"],
    }),
    speaking("es-m2-3-speak-ella", "ella es maestra", "she is a teacher", ["ella", "es", "maestra"]),
  ],
};

// ─── es-m2-4 — Tú y usted ───────────────────────────────────────────────────

const M2_4: LessonContent = {
  id: "es-m2-4",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Tú y usted — two ways to say you",
  description: "The register split, plus señor, señora, and the doctors.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m2-4-info-usted",
      "Tú vs usted",
      "Friends, family, kids: tú (tú eres). Strangers, elders, anyone you'd call sir or ma'am: usted — and it borrows the él/ella verb form: usted es. The name question flips the same way: ¿cómo te llamas? for a friend, ¿cómo se llama usted? for formal address.",
      "grammar",
    ),
    phrase("es-m2-4-p-senor", "Mr. / sir", "señor", undefined, { emoji: "👨" }),
    sentenceMcq({
      id: "es-m2-4-q-usted",
      prompt: "You're speaking to an elderly stranger. 'You are…' = ?",
      correctText: "usted es",
      distractorsText: ["tú eres", "yo soy", "ella es"],
      explanation: "Formal address borrows the third-person verb form.",
      exercisedAtomSurfaces: ["usted", "es"],
    }),
    vocabMcq(
      "es-m2-4-mcq-senor",
      { surface: "señor", meaningEn: "Mr. / sir", emoji: "👨" },
      [SENORA, MAESTRO, ESTUDIANTE],
    ),
    phrase("es-m2-4-p-senora", "Mrs. / ma'am", "señora", undefined, { emoji: "👩" }),
    phrase("es-m2-4-p-doctor", "doctor (m)", "doctor", undefined, { emoji: "👨‍⚕️" }),
    vocabMcq(
      "es-m2-4-mcq-senora",
      { surface: "señora", meaningEn: "Mrs. / ma'am", emoji: "👩" },
      [SENOR, MAESTRA, DOCTOR],
    ),
    vocabMcq(
      "es-m2-4-mcq-doctor",
      { surface: "doctor", meaningEn: "doctor (m)", emoji: "👨‍⚕️" },
      [MAESTRO, SENOR, ESTUDIANTE],
    ),
    cloze(
      "es-m2-4-cz-doctora",
      "ella es",
      "",
      "doctora",
      ["doctora", "doctor", "señora", "maestra"],
      "she is a doctor",
      "ella es doctora",
    ),
    // Review rung: every person word met so far, in one grid.
    matchPairs("es-m2-4", [
      "señor",
      "señora",
      "maestro",
      "maestra",
      "estudiante",
      "doctor",
      "doctora",
    ]),
    // Text-front recognition rung — doctora ships without emoji (no Noto
    // art for 👩‍⚕️ in the subset), so it skipped the image-MCQ rung.
    vocabTextMcq("es-m2-4-tmcq-doctora", "doctora", ["doctor", "señora", "maestra"]),
  ],
};

// ─── es-m2-5 — ¿De dónde eres? ──────────────────────────────────────────────

const M2_5: LessonContent = {
  id: "es-m2-5",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿De dónde eres? — origins",
  description: "Say where you're from and what that makes you.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m2-5-info-origen",
      "Saying where you're from",
      "soy de + place: soy de México (I'm from Mexico). Ask back with ¿de dónde eres? For nationality, drop de and use an adjective that agrees with the speaker: mexicano for a man, mexicana for a woman. Some, like estadounidense, keep one form for everyone.",
      "grammar",
    ),
    phrase("es-m2-5-p-dedonde", "where are you from?", "¿de dónde eres?"),
    build(
      "es-m2-5-b-mexico",
      "Say: 'I am from Mexico.'",
      "soy de México",
      ["soy", "de", "México", "España"],
      ["soy", "de", "México"],
      ["soy", "de", "México"],
    ),
    sentenceMcq({
      id: "es-m2-5-q-dedonde",
      prompt: "You want to ask where someone's from. What do you say?",
      correctText: "¿de dónde eres?",
      distractorsText: ["¿cómo te llamas?", "mucho gusto", "buenas tardes"],
      exercisedAtomSurfaces: ["¿de dónde eres?"],
    }),
    translateStep({
      id: "es-m2-5-tr-espana",
      promptEn: "I am from Spain",
      acceptedAnswers: [
        "soy de España",
        "Soy de España",
        "soy de Espana",
        "Soy de Espana",
        "yo soy de España",
        "yo soy de Espana",
      ],
      audioText: "soy de España",
      exercisedAtomSurfaces: ["España", "de", "soy"],
    }),
    sentenceMcq({
      id: "es-m2-5-q-mexicano",
      prompt: "Carlos is from Mexico. He is…",
      correctText: "mexicano",
      distractorsText: ["mexicana", "español", "estadounidense"],
      explanation: "Nationality words agree: a man takes the -o ending.",
      exercisedAtomSurfaces: ["mexicano"],
    }),
    sentenceMcq({
      id: "es-m2-5-q-mexicana",
      prompt: "Ana is from Mexico. She is…",
      correctText: "mexicana",
      distractorsText: ["mexicano", "española", "estadounidense"],
      explanation: "For a woman the ending flips to -a.",
      exercisedAtomSurfaces: ["mexicana"],
    }),
    translateStep({
      id: "es-m2-5-tr-eeuu",
      promptEn: "I am from the United States",
      acceptedAnswers: [
        "soy de Estados Unidos",
        "Soy de Estados Unidos",
        "yo soy de Estados Unidos",
        "soy de estados unidos",
      ],
      audioText: "soy de Estados Unidos",
      exercisedAtomSurfaces: ["Estados Unidos", "de", "soy"],
    }),
    sentenceMcq({
      id: "es-m2-5-q-espanol",
      prompt: "Diego is from Spain. He is…",
      correctText: "español",
      distractorsText: ["española", "mexicano", "estadounidense"],
      exercisedAtomSurfaces: ["español"],
    }),
  ],
};

// ─── es-m2-6 — Listening focus ──────────────────────────────────────────────

const M2_6: LessonContent = {
  id: "es-m2-6",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — who is who",
  description: "Names, origins, and jobs — by ear only.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "es-m2-6-lc-mellamo",
      audioText: "me llamo Sofía",
      correctMeaningEn: "my name is Sofía",
      distractorsEn: ["what's your name?", "where are you from?", "nice to meet you"],
      exercisedAtomSurfaces: ["me llamo"],
    }),
    listeningCompSentence({
      id: "es-m2-6-lc-mexico",
      audioText: "soy de México",
      correctMeaningEn: "I am from Mexico",
      distractorsEn: ["I am from Spain", "I am from the United States", "I am Mexican"],
      exercisedAtomSurfaces: ["soy", "de", "México"],
    }),
    listeningBuildSentence({
      id: "es-m2-6-lb-estudiante",
      target: "yo soy estudiante",
      tiles: ["yo", "soy", "estudiante", "maestro"],
      correctOrder: ["yo", "soy", "estudiante"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["yo", "soy", "estudiante"],
    }),
    listeningCompSentence({
      id: "es-m2-6-lc-dedonde",
      audioText: "¿de dónde eres?",
      correctMeaningEn: "where are you from?",
      distractorsEn: ["what's your name?", "who is she?", "where is he from?"],
      exercisedAtomSurfaces: ["¿de dónde eres?"],
    }),
    listeningBuildSentence({
      id: "es-m2-6-lb-doctora",
      target: "ella es doctora",
      tiles: ["ella", "es", "doctora", "él"],
      correctOrder: ["ella", "es", "doctora"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["ella", "es", "doctora"],
    }),
    listeningCompSentence({
      id: "es-m2-6-lc-estadounidense",
      audioText: "soy estadounidense",
      correctMeaningEn: "I am American",
      distractorsEn: ["I am Mexican", "I am Spanish", "I am a student"],
      exercisedAtomSurfaces: ["estadounidense"],
    }),
    listeningBuildSentence({
      id: "es-m2-6-lb-usted",
      target: "usted es maestro",
      tiles: ["usted", "es", "maestro", "tú"],
      correctOrder: ["usted", "es", "maestro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["usted", "es", "maestro"],
    }),
    listeningCompSentence({
      id: "es-m2-6-lc-espana",
      audioText: "él es de España",
      correctMeaningEn: "he is from Spain",
      distractorsEn: ["she is from Spain", "he is from Mexico", "he is a student"],
      exercisedAtomSurfaces: ["él", "de", "España"],
    }),
  ],
};

// ─── es-m2-7 — Integration dialogue ─────────────────────────────────────────

const M2_7: LessonContent = {
  id: "es-m2-7",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Mucho gusto — a first meeting",
  description: "Put the whole module together and introduce yourself.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m2-7-info-dialogo",
      "Two students meet",
      "—¡Hola! Me llamo Marta. ¿Cómo te llamas?\n—¡Hola! Me llamo Diego. Mucho gusto.\n—Mucho gusto, Diego. ¿De dónde eres?\n—Soy de México. Soy estudiante. ¿Y tú?\n—Yo soy de España. Soy maestra.\nEvery line is made of words you already know — read it out loud.",
      "default",
    ),
    sentenceMcq({
      id: "es-m2-7-q-reply",
      prompt: "Marta asks: '¡Hola! ¿Cómo te llamas?' — pick the natural reply.",
      correctText: "me llamo Diego",
      distractorsText: ["¿de dónde eres?", "soy de México", "adiós"],
      exercisedAtomSurfaces: ["me llamo"],
    }),
    build(
      "es-m2-7-b-el",
      "Say: 'He is from Mexico.'",
      "él es de México",
      ["él", "es", "de", "México", "ella"],
      ["él", "es", "de", "México"],
      ["él", "es", "de", "México"],
    ),
    translateStep({
      id: "es-m2-7-tr-ella",
      promptEn: "She is from the United States",
      acceptedAnswers: [
        "ella es de Estados Unidos",
        "Ella es de Estados Unidos",
        "ella es de estados unidos",
      ],
      audioText: "ella es de Estados Unidos",
      exercisedAtomSurfaces: ["ella", "de", "Estados Unidos"],
    }),
    sentenceMcq({
      id: "es-m2-7-q-formal",
      prompt: "You meet an elderly gentleman. How do you ask HIS name?",
      correctText: "¿cómo se llama usted?",
      distractorsText: ["¿cómo te llamas?", "¿de dónde eres?", "me llamo señor"],
      explanation: "Formal address switches to the third-person shape of the question.",
      exercisedAtomSurfaces: ["usted"],
    }),
    speaking(
      "es-m2-7-speak-intro",
      "me llamo Ana y soy de México",
      "my name is Ana and I am from Mexico",
      ["me llamo", "soy", "de", "México"],
    ),
    listeningCompSentence({
      id: "es-m2-7-lc-senora",
      audioText: "mucho gusto, señora",
      correctMeaningEn: "nice to meet you, ma'am",
      distractorsEn: ["nice to meet you, sir", "good morning, ma'am", "goodbye, ma'am"],
      exercisedAtomSurfaces: ["señora"],
    }),
    speaking("es-m2-7-speak-dedonde", "¿de dónde eres?", "where are you from?", ["¿de dónde eres?"]),
    infoStep(
      "es-m2-7-info-vosotros",
      "Vosotros, in Spain",
      "In Spain, friends address a group as vosotros — you'll hear it in movies and music from there. Latin America (and this course) uses ustedes for every group instead; it arrives in a later module. For now the split is simple: tú for one friend, usted for one stranger.",
      "culture",
    ),
  ],
};

// ─── es-m2-8 — Mastery test ─────────────────────────────────────────────────

const M2_8: LessonContent = {
  id: "es-m2-8",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M2 Mastery Test",
  description: "Ser, names, tú vs usted, origins, and nationalities.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m2-8-q-como",
      prompt: "'What's your name?' — pick the question.",
      correctText: "¿cómo te llamas?",
      distractorsText: ["¿de dónde eres?", "me llamo", "mucho gusto"],
      exercisedAtomSurfaces: ["¿cómo te llamas?"],
    }),
    cloze(
      "es-m2-8-cz-soy",
      "yo",
      "de México",
      "soy",
      ["soy", "eres", "es", "ser"],
      "I am from Mexico",
      "yo soy de México",
    ),
    sentenceMcq({
      id: "es-m2-8-q-ella",
      prompt: "'She is a teacher' — pick it.",
      correctText: "ella es maestra",
      distractorsText: ["él es maestro", "ella es maestro", "ella eres maestra"],
      exercisedAtomSurfaces: ["ella", "es", "maestra"],
    }),
    translateStep({
      id: "es-m2-8-tr-estudiante",
      promptEn: "I am a student",
      acceptedAnswers: [
        "soy estudiante",
        "Soy estudiante",
        "yo soy estudiante",
        "Yo soy estudiante",
      ],
      audioText: "soy estudiante",
      exercisedAtomSurfaces: ["soy", "estudiante"],
    }),
    listeningCompSentence({
      id: "es-m2-8-lc-espana",
      audioText: "soy de España",
      correctMeaningEn: "I am from Spain",
      distractorsEn: ["I am from Mexico", "I am from the United States", "I am a student"],
      exercisedAtomSurfaces: ["de", "España"],
    }),
    sentenceMcq({
      id: "es-m2-8-q-usted",
      prompt: "You're speaking formally to señor García. 'You are…' = ?",
      correctText: "usted es",
      distractorsText: ["tú eres", "yo soy", "ella es"],
      exercisedAtomSurfaces: ["usted", "es"],
    }),
    vocabMcq(
      "es-m2-8-mcq-maestra",
      { surface: "maestra", meaningEn: "teacher (f)", emoji: "👩‍🏫" },
      [MAESTRO, SENORA, ESTUDIANTE],
    ),
    build(
      "es-m2-8-b-mexicano",
      "Say: 'He is Mexican.'",
      "él es mexicano",
      ["él", "es", "mexicano", "mexicana"],
      ["él", "es", "mexicano"],
      ["él", "es", "mexicano"],
    ),
    speaking("es-m2-8-speak-mellamo", "hola, me llamo Carlos", "hello, my name is Carlos", ["me llamo"]),
  ],
};

export const ES_M2_LESSONS: LessonContent[] = [
  M2_1,
  M2_2,
  M2_3,
  M2_4,
  M2_5,
  M2_6,
  M2_7,
  M2_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M2_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m2",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m2",
          prompt: "Complete: 'Yo ___ estudiante.'",
          correctText: "soy",
          distractorsText: ["eres", "es", "ser"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m2-1",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-es-m2-1",
          prompt: "'What's your name?' — pick the question.",
          correctText: "¿cómo te llamas?",
          distractorsText: ["¿de dónde eres?", "me llamo", "mucho gusto"],
        }),
    },
    {
      id: "pt-es-m2-2",
      moduleId: "m2",
      build: () =>
        cloze(
          "pt-es-m2-2",
          "yo",
          "de México",
          "soy",
          ["soy", "eres", "es", "ser"],
          "I am from Mexico",
          "yo soy de México",
        ),
    },
    {
      id: "pt-es-m2-3",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-es-m2-3",
          prompt: "You're speaking to an elderly stranger. Which 'you' fits?",
          correctText: "usted",
          distractorsText: ["tú", "yo", "ella"],
        }),
    },
    {
      id: "pt-es-m2-4",
      moduleId: "m2",
      build: () =>
        sentenceMcq({
          id: "pt-es-m2-4",
          prompt: "'She is Mexican' — pick the correct form.",
          correctText: "ella es mexicana",
          distractorsText: ["ella es mexicano", "él es mexicana", "ella eres mexicana"],
        }),
    },
  ],
};
