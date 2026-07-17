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
 *
 * 2026-07-16 JA-standard rewrite: every topic lesson expanded to ~18-21
 * retrieval-heavy steps (≥6 step types, no adjacent-same-type, no 3+
 * selection runs), production forced everywhere (≥2 generation steps incl.
 * ≥1 typed translateStep in the back half), a selfExplain landed in the
 * ser (L2), tú/usted (L4), and nationality-agreement (L5) lessons, and a
 * compounding review tail (reviewMatchPairs + hand-picked m1 recall) added
 * from L2 onward. L4 in particular now forces PRODUCTION of usted vs tú
 * forms (build/translate/speaking) — previously zero-production, the
 * module's most important sociolinguistic point.
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

// One prior-module (m1) surface pulled in as a bonus decoy tile — a direct
// pickReviewSurfaces() call per the rewrite brief, used where correctness
// of the decoy's gloss doesn't matter (it's never the right answer).
const M2_BONUS_TILE = pickReviewSurfaces("es-m2-bonus-tile-seed", "m2", 1)[0] ?? "hola";

// ─── es-m2-1 — Me llamo ─────────────────────────────────────────────────────

const M2_1: LessonContent = {
  id: "es-m2-1",
  moduleId: "m2",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Me llamo — say your name",
  description: "Give your name, ask for theirs, and greet a friend.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m2-1-info-mellamo",
      "Me llamo — my name is",
      "To give your name, say me llamo + your name: me llamo Ana. Literally it means 'I call myself' — no word for 'is' needed. The double ll sounds like English y: meh YA-mo. To ask for a name, use ¿cómo te llamas? — and remember the upside-down ¿ that opens every Spanish question.",
      "grammar",
    ),
    phrase("es-m2-1-p-mellamo", "my name is", "me llamo"),
    build(
      "es-m2-1-b-mellamo",
      "Introduce yourself: 'My name is Ana.'",
      "me llamo Ana",
      ["me llamo", "Ana", "tú", "usted"],
      ["me llamo", "Ana"],
      ["me llamo"],
    ),
    listeningCompSentence({
      id: "es-m2-1-lc-mellamo",
      audioText: "me llamo Sofía",
      correctMeaningEn: "my name is Sofía",
      distractorsEn: ["what's your name?", "goodbye", "thank you"],
      exercisedAtomSurfaces: ["me llamo"],
    }),
    phrase("es-m2-1-p-comotellamas", "what's your name?", "¿cómo te llamas?"),
    speaking("es-m2-1-speak-comotellamas", "¿cómo te llamas?", "what's your name?", ["¿cómo te llamas?"]),
    sentenceMcq({
      id: "es-m2-1-q-reply",
      prompt: "Diego te dice: '¡Hola! ¿Cómo te llamas?' ¿Cuál es la respuesta natural?",
      correctText: "me llamo Ana",
      distractorsText: ["gracias", "adiós", "buenas noches"],
      exercisedAtomSurfaces: ["me llamo", "¿cómo te llamas?"],
    }),
    phrase("es-m2-1-p-amigo", "friend (m)", "amigo"),
    // Text-front recognition rung — amigo has no emoji, so the image MCQ
    // rung skips it; the -o/-a contrast is the real discriminator here.
    vocabTextMcq("es-m2-1-tmcq-amigo", "amigo", ["amiga", "hola", "gracias"]),
    listeningCompSentence({
      id: "es-m2-1-lc-amigo",
      audioText: "hola, amigo",
      correctMeaningEn: "hello, friend (m)",
      distractorsEn: ["goodbye, friend (f)", "nice to meet you", "good afternoon"],
      exercisedAtomSurfaces: ["amigo"],
    }),
    build(
      "es-m2-1-b-amigo",
      "Greet a (male) friend: 'Hello, friend!'",
      "hola amigo",
      ["hola", "amigo", "amiga", "gracias"],
      ["hola", "amigo"],
      ["amigo"],
    ),
    phrase("es-m2-1-p-amiga", "friend (f)", "amiga"),
    speaking("es-m2-1-speak-amiga", "adiós, amiga", "goodbye, friend (f)", ["amiga"]),
    vocabTextMcq("es-m2-1-tmcq-amiga", "amiga", ["amigo", "adiós", "por favor"]),
    translateStep({
      id: "es-m2-1-tr-mellamo",
      promptEn: "My name is Diego",
      acceptedAnswers: ["me llamo Diego", "Me llamo Diego"],
      audioText: "me llamo Diego",
      exercisedAtomSurfaces: ["me llamo"],
    }),
    sentenceMcq({
      id: "es-m2-1-q-pregunta",
      prompt: "Tu amiga quiere saber tu nombre. ¿Qué te pregunta?",
      correctText: "¿cómo te llamas?",
      distractorsText: ["mucho gusto", "adiós, amiga", "gracias, amigo"],
      exercisedAtomSurfaces: ["¿cómo te llamas?"],
    }),
    speaking("es-m2-1-speak-intro", "me llamo Ana, ¿y tú?", "my name is Ana, and you?", ["me llamo"]),
    infoStep(
      "es-m2-1-info-win",
      "You can introduce yourself",
      "You can now give your name, ask for someone else's, and greet a friend by name — the first move in every conversation.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m2-2-info-ser",
      "Ser — to be (who you are)",
      "Ser is the verb for saying who or what someone is. Each person gets its own form, so the pronoun is optional: yo soy (I am), tú eres (you are), él/ella es (he/she is). yo = I, tú = you (one friend). Use ser for names, jobs, and where you're from.",
      "grammar",
    ),
    phrase("es-m2-2-p-soy", "I am", "soy"),
    build(
      "es-m2-2-b-yosoy",
      "Say: 'I am Ana.'",
      "yo soy Ana",
      ["yo", "soy", "Ana", "eres"],
      ["yo", "soy", "Ana"],
      ["yo", "soy"],
    ),
    cloze(
      "es-m2-2-cz-eres",
      "tú",
      "Carlos",
      "eres",
      ["eres", "soy", "es", "ser"],
      "you are Carlos",
      "tú eres Carlos",
    ),
    sentenceMcq({
      id: "es-m2-2-q-soy-persona",
      prompt: "Diego pregunta '¿quién eres?' Ana se señala a sí misma. ¿Qué dice ella?",
      correctText: "soy Ana",
      distractorsText: ["eres Ana", "es Ana", "somos Ana"],
      exercisedAtomSurfaces: ["soy"],
    }),
    speaking("es-m2-2-speak-soy", "yo soy estudiante", "I am a student", ["yo", "soy", "estudiante"]),
    vocabMcq(
      "es-m2-2-mcq-estudiante",
      { surface: "estudiante", meaningEn: "student", emoji: "🎓" },
      [MAESTRO, SENOR, DOCTOR],
    ),
    phrase("es-m2-2-p-ser", "to be", "ser"),
    sentenceMcq({
      id: "es-m2-2-q-ser",
      prompt: "Soy, eres y es vienen de un mismo verbo. ¿Cuál es su infinitivo?",
      correctText: "ser",
      distractorsText: ["soy", "eres", "es"],
      explanation: "Los infinitivos terminan en -r; las otras tres ya están conjugadas.",
      exercisedAtomSurfaces: ["ser"],
    }),
    build(
      "es-m2-2-b-tueres",
      "Say: 'You are a student.'",
      "tú eres estudiante",
      ["tú", "eres", "estudiante", "soy", M2_BONUS_TILE],
      ["tú", "eres", "estudiante"],
      ["tú", "eres", "estudiante"],
    ),
    listeningCompSentence({
      id: "es-m2-2-lc-ser",
      audioText: "el verbo es ser",
      correctMeaningEn: "the verb is 'to be'",
      distractorsEn: ["the verb is 'to have'", "the noun is 'friend'", "the question is 'what's your name?'"],
      exercisedAtomSurfaces: ["ser"],
    }),
    translateStep({
      id: "es-m2-2-tr-eres",
      promptEn: "You are a student",
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
    sentenceMcq({
      id: "es-m2-2-q-estudiante",
      prompt: "En clase, el maestro pregunta quién es estudiante. Ana levanta la mano. ¿Qué dice ella?",
      correctText: "yo soy estudiante",
      distractorsText: ["tú eres estudiante", "él es estudiante", "yo eres estudiante"],
      exercisedAtomSurfaces: ["yo", "soy", "estudiante"],
    }),
    build(
      "es-m2-2-b-yosoydiego",
      "Say: 'I am Diego.'",
      "yo soy Diego",
      ["yo", "soy", "Diego", "eres"],
      ["yo", "soy", "Diego"],
      ["yo", "soy"],
    ),
    speaking("es-m2-2-speak-tueres", "tú eres estudiante", "you are a student", ["tú", "eres", "estudiante"]),
    sentenceMcq({
      id: "es-m2-2-q-pregunta-eres",
      prompt: "Le preguntas a un amigo si estudia en la universidad. ¿Qué le dices?",
      correctText: "¿eres estudiante?",
      distractorsText: ["¿es estudiante?", "¿soy estudiante?", "eres estudiante"],
      exercisedAtomSurfaces: ["eres", "estudiante"],
    }),
    selfExplain({
      id: "es-m2-2-self-ser",
      anchorLabel: "You just said: tú eres estudiante",
      anchorAudioText: "tú eres estudiante",
      question: "Why does the verb change from soy to eres here?",
      rule: { text: "Ser changes form to match the subject: yo → soy, tú → eres, él/ella → es — each person gets its own ending." },
      surface: { text: "Eres is just a more formal-sounding version of soy." },
      distractor: { text: "Eres is used because 'estudiante' is masculine, not because of who's speaking." },
      ruleExplanation: "Spanish verbs conjugate by person: yo soy, tú eres, él/ella es — the pronoun and verb must match.",
    }),
    speaking("es-m2-2-speak-review", "hola, yo soy estudiante", "hello, I am a student", ["yo", "soy", "estudiante"]),
    reviewMatchPairs("es-m2-2-rev", "es-m2-2-rev-seed", "m2", 6),
    listeningCompSentence({
      id: "es-m2-2-rev-lc",
      audioText: "gracias, soy estudiante",
      correctMeaningEn: "thank you, I am a student",
      distractorsEn: ["goodbye, I am a student", "thank you, I am a teacher", "please, I am a student"],
      exercisedAtomSurfaces: ["soy", "estudiante"],
    }),
    infoStep(
      "es-m2-2-info-win",
      "You can say who you are",
      "You can now name your identity with ser — soy, eres — and back it up with your first job title.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m2-3-info-elella",
      "Él y ella",
      "él = he (the accent mark is part of the word), ella = she (EH-ya). Both take es: él es maestro, ella es maestra. Two things to notice — job words have no 'a' in front of them, and they match the person: -o for a man, -a for a woman.",
      "grammar",
    ),
    phrase("es-m2-3-p-maestro", "teacher (m)", "maestro", undefined, { emoji: "👨‍🏫" }),
    vocabMcq(
      "es-m2-3-mcq-maestro",
      { surface: "maestro", meaningEn: "teacher (m)", emoji: "👨‍🏫" },
      [MAESTRA, ESTUDIANTE, DOCTOR],
    ),
    build(
      "es-m2-3-b-el",
      "Say: 'He is a teacher.'",
      "él es maestro",
      ["él", "es", "maestro", "maestra"],
      ["él", "es", "maestro"],
      ["él", "es", "maestro"],
    ),
    phrase("es-m2-3-p-maestra", "teacher (f)", "maestra", undefined, { emoji: "👩‍🏫" }),
    vocabMcq(
      "es-m2-3-mcq-maestra",
      { surface: "maestra", meaningEn: "teacher (f)", emoji: "👩‍🏫" },
      [MAESTRO, ESTUDIANTE, DOCTOR],
    ),
    sentenceMcq({
      id: "es-m2-3-q-maestra",
      prompt: "Ella trabaja en la escuela y ayuda a los niños a aprender. ¿Qué es ella?",
      correctText: "maestra",
      distractorsText: ["estudiante", "doctora", "señora"],
      exercisedAtomSurfaces: ["maestra"],
    }),
    build(
      "es-m2-3-b-ella-estudiante",
      "Say: 'She is a student.'",
      "ella es estudiante",
      ["ella", "es", "estudiante", "eres"],
      ["ella", "es", "estudiante"],
      ["ella", "es", "estudiante"],
    ),
    cloze(
      "es-m2-3-cz-doctora",
      "ella es",
      "",
      "doctora",
      ["doctora", "doctor", "señora", "maestra"],
      "she is a doctor",
      "ella es doctora",
    ),
    speaking("es-m2-3-speak-doctor", "él es doctor", "he is a doctor", ["él", "es", "doctor"]),
    vocabMcq(
      "es-m2-3-mcq-doctor",
      { surface: "doctor", meaningEn: "doctor (m)", emoji: "👨‍⚕️" },
      [MAESTRO, SENOR, ESTUDIANTE],
    ),
    sentenceMcq({
      id: "es-m2-3-q-doctor",
      prompt: "Diego se rompió el brazo y fue al hospital. ¿Quién lo ayudó?",
      correctText: "el doctor",
      distractorsText: ["la maestra", "el amigo", "la señora"],
      exercisedAtomSurfaces: ["doctor"],
    }),
    translateStep({
      id: "es-m2-3-tr-doctora",
      promptEn: "She is a doctor",
      acceptedAnswers: ["ella es doctora", "Ella es doctora"],
      audioText: "ella es doctora",
      exercisedAtomSurfaces: ["ella", "es", "doctora"],
    }),
    selfExplain({
      id: "es-m2-3-self-gender",
      anchorLabel: "You just wrote: ella es doctora",
      anchorAudioText: "ella es doctora",
      question: "Why does 'doctor' become 'doctora' here?",
      rule: { text: "Job nouns agree with the person's gender: -o for a man, -a for a woman — el doctor, la doctora." },
      surface: { text: "Doctora is simply the plural form of doctor." },
      distractor: { text: "Doctora is used because the sentence is about a formal profession, not because of gender." },
      ruleExplanation: "Spanish nouns for people carry gender: swap the final -o for -a to match a woman (maestro → maestra, doctor → doctora).",
    }),
    build(
      "es-m2-3-b-el-estudiante",
      "Say: 'He is a student.'",
      "él es estudiante",
      ["él", "es", "estudiante", "ella"],
      ["él", "es", "estudiante"],
      ["él", "es", "estudiante"],
    ),
    sentenceMcq({
      id: "es-m2-3-q-estudiante",
      prompt: "Ana estudia todos los días en la universidad. ¿Qué es ella?",
      correctText: "estudiante",
      distractorsText: ["maestra", "doctora", "señora"],
      exercisedAtomSurfaces: ["estudiante"],
    }),
    speaking("es-m2-3-speak-ella", "ella es maestra", "she is a teacher", ["ella", "es", "maestra"]),
    reviewMatchPairs("es-m2-3-rev", "es-m2-3-rev-seed", "m2", 6),
    listeningCompSentence({
      id: "es-m2-3-rev-lc",
      audioText: "gracias, maestra",
      correctMeaningEn: "thank you, teacher (f)",
      distractorsEn: ["thank you, doctor (f)", "goodbye, teacher (f)", "excuse me, teacher (f)"],
      exercisedAtomSurfaces: ["maestra"],
    }),
    speaking("es-m2-3-rev-speak", "hola, doctora", "hello, doctor (f)", ["doctora"]),
    infoStep(
      "es-m2-3-info-win",
      "You can describe anyone",
      "You can now talk about other people — who they are and what they do — with él es and ella es.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m2-4-info-usted",
      "Tú vs usted",
      "Friends, family, kids: tú (tú eres). Strangers, elders, anyone you'd call sir or ma'am: usted — and it borrows the él/ella verb form: usted es. The name question flips the same way: ¿cómo te llamas? for a friend, ¿cómo se llama usted? for formal address.",
      "grammar",
    ),
    phrase("es-m2-4-p-senor", "Mr. / sir", "señor", undefined, { emoji: "👨" }),
    build(
      "es-m2-4-b-buenosdias",
      "Say: 'Good morning, sir.'",
      "buenos días señor",
      ["buenos días", "señor", "señora", "adiós"],
      ["buenos días", "señor"],
      ["señor"],
    ),
    sentenceMcq({
      id: "es-m2-4-q-senor",
      prompt: "Ves a un hombre mayor que no conoces. ¿Cómo lo llamas con respeto?",
      correctText: "señor",
      distractorsText: ["amigo", "doctor", "maestro"],
      exercisedAtomSurfaces: ["señor"],
    }),
    cloze(
      "es-m2-4-cz-usted",
      "usted",
      "doctor",
      "es",
      ["es", "eres", "soy", "ser"],
      "you (formal) are a doctor",
      "usted es doctor",
      undefined,
      ["usted", "doctor"],
    ),
    build(
      "es-m2-4-b-usted-maestro",
      "Say (to a stranger): 'You are a teacher.'",
      "usted es maestro",
      ["usted", "es", "maestro", "eres"],
      ["usted", "es", "maestro"],
      ["usted", "es", "maestro"],
    ),
    phrase("es-m2-4-p-senora", "Mrs. / ma'am", "señora", undefined, { emoji: "👩" }),
    vocabMcq(
      "es-m2-4-mcq-senora",
      { surface: "señora", meaningEn: "Mrs. / ma'am", emoji: "👩" },
      [SENOR, MAESTRA, DOCTOR],
    ),
    speaking("es-m2-4-speak-senora", "buenas tardes, señora", "good afternoon, ma'am", ["señora"]),
    phrase("es-m2-4-p-doctor", "doctor (m)", "doctor", undefined, { emoji: "👨‍⚕️" }),
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
    build(
      "es-m2-4-b-usted-doctor",
      "Say (to a stranger): 'You are a doctor.'",
      "usted es doctor",
      ["usted", "es", "doctor", "doctora"],
      ["usted", "es", "doctor"],
      ["usted", "es", "doctor"],
    ),
    sentenceMcq({
      id: "es-m2-4-q-formal-pregunta",
      prompt: "Estás en una fiesta formal y conoces a un doctor mayor. ¿Cómo le preguntas su nombre?",
      correctText: "¿cómo se llama usted?",
      distractorsText: ["¿cómo te llamas?", "¿de dónde eres?", "mucho gusto"],
      explanation: "Con desconocidos mayores, se usa la pregunta formal, no la de amigos.",
      exercisedAtomSurfaces: ["usted"],
    }),
    translateStep({
      id: "es-m2-4-tr-formal",
      promptEn: "Ask a stranger (formal): what's your name?",
      acceptedAnswers: [
        "¿cómo se llama usted?",
        "¿Cómo se llama usted?",
        "como se llama usted?",
        "Como se llama usted?",
        "¿cómo se llama usted",
        "cómo se llama usted?",
      ],
      audioText: "¿cómo se llama usted?",
      exercisedAtomSurfaces: ["usted"],
    }),
    build(
      "es-m2-4-b-informal",
      "Say (to a friend): 'What's your name?'",
      "¿cómo te llamas?",
      ["¿cómo te llamas?", "¿cómo se llama usted?", "mucho gusto"],
      ["¿cómo te llamas?"],
      ["¿cómo te llamas?"],
    ),
    selfExplain({
      id: "es-m2-4-self-register",
      anchorLabel: "You just wrote: ¿cómo se llama usted?",
      anchorAudioText: "¿cómo se llama usted?",
      question: "Why does the question use 'se llama' and 'usted' instead of 'te llamas'?",
      rule: { text: "Usted takes the same verb form as él/ella, so the formal question borrows their shape: ¿cómo se llama usted?" },
      surface: { text: "¿Cómo se llama usted? is simply a more polite-sounding phrase, with no grammatical reason." },
      distractor: { text: "Se llama is used because you're asking about more than one person." },
      ruleExplanation: "Usted always pairs with the él/ella verb form — that's why the formal 'what's your name' question shifts to se llama, matching es instead of eres.",
    }),
    speaking("es-m2-4-speak-usted", "usted es maestra", "you (formal) are a teacher", ["usted", "es", "maestra"]),
    reviewMatchPairs("es-m2-4-rev", "es-m2-4-rev-seed", "m2", 6),
    listeningCompSentence({
      id: "es-m2-4-rev-lc",
      audioText: "perdón, señor",
      correctMeaningEn: "excuse me, sir",
      distractorsEn: ["thank you, sir", "goodbye, ma'am", "excuse me, ma'am"],
      exercisedAtomSurfaces: ["señor"],
    }),
    speaking("es-m2-4-rev-speak", "gracias, doctora", "thank you, doctor (f)", ["doctora"]),
    infoStep(
      "es-m2-4-info-win",
      "You can speak to anyone, right",
      "You can now switch registers on the fly — tú for a friend, usted for a stranger — and you can PRODUCE both, not just recognize them.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m2-5-info-origen",
      "Saying where you're from",
      "soy de + place: soy de México (I'm from Mexico). Ask back with ¿de dónde eres? For nationality, drop de and use an adjective that agrees with the speaker: mexicano for a man, mexicana for a woman. Some, like estadounidense, keep one form for everyone.",
      "grammar",
    ),
    phrase("es-m2-5-p-dedonde", "where are you from?", "¿de dónde eres?"),
    build(
      "es-m2-5-b-dedonde",
      "Say: 'Where are you from?'",
      "¿de dónde eres?",
      ["¿de dónde eres?", "¿cómo te llamas?", "mucho gusto"],
      ["¿de dónde eres?"],
      ["¿de dónde eres?"],
    ),
    sentenceMcq({
      id: "es-m2-5-q-dedonde",
      prompt: "Acabas de conocer a alguien y quieres saber su país de origen. ¿Qué le preguntas?",
      correctText: "¿de dónde eres?",
      distractorsText: ["¿cómo te llamas?", "mucho gusto", "buenas tardes"],
      exercisedAtomSurfaces: ["¿de dónde eres?"],
    }),
    build(
      "es-m2-5-b-mexico",
      "Say: 'I am from Mexico.'",
      "soy de México",
      ["soy", "de", "México", "España"],
      ["soy", "de", "México"],
      ["soy", "de", "México"],
    ),
    sentenceMcq({
      id: "es-m2-5-q-mexico",
      prompt: "Diego nació y creció en la Ciudad de México. ¿De dónde es?",
      correctText: "es de México",
      distractorsText: ["es de España", "es de Estados Unidos", "es mexicana"],
      exercisedAtomSurfaces: ["de", "México"],
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
    cloze(
      "es-m2-5-cz-eeuu",
      "soy de",
      "",
      "Estados Unidos",
      ["Estados Unidos", "México", "España"],
      "I am from the United States",
      "soy de Estados Unidos",
    ),
    vocabTextMcq("es-m2-5-tmcq-espana", "España", ["México", "Estados Unidos", "doctor"]),
    build(
      "es-m2-5-b-elespana",
      "Say: 'He is from Spain.'",
      "él es de España",
      ["él", "es", "de", "España", "ella"],
      ["él", "es", "de", "España"],
      ["él", "es", "de", "España"],
    ),
    sentenceMcq({
      id: "es-m2-5-q-mexicano",
      prompt: "Carlos nació en México. Por eso, él es…",
      correctText: "mexicano",
      distractorsText: ["mexicana", "español", "estadounidense"],
      explanation: "Un hombre toma la terminación -o.",
      exercisedAtomSurfaces: ["mexicano"],
    }),
    speaking("es-m2-5-speak-mexicano", "él es mexicano", "he is Mexican", ["él", "es", "mexicano"]),
    sentenceMcq({
      id: "es-m2-5-q-mexicana",
      prompt: "Ana nació en México. Por eso, ella es…",
      correctText: "mexicana",
      distractorsText: ["mexicano", "española", "estadounidense"],
      explanation: "Para una mujer, la terminación cambia a -a.",
      exercisedAtomSurfaces: ["mexicana"],
    }),
    build(
      "es-m2-5-b-mexicana",
      "Say: 'She is Mexican.'",
      "ella es mexicana",
      ["ella", "es", "mexicana", "mexicano"],
      ["ella", "es", "mexicana"],
      ["ella", "es", "mexicana"],
    ),
    sentenceMcq({
      id: "es-m2-5-q-espanol",
      prompt: "Diego nació en España. Por eso, él es…",
      correctText: "español",
      distractorsText: ["española", "mexicano", "estadounidense"],
      exercisedAtomSurfaces: ["español"],
    }),
    translateStep({
      id: "es-m2-5-tr-estadounidense",
      promptEn: "I am American",
      acceptedAnswers: ["soy estadounidense", "Soy estadounidense"],
      audioText: "soy estadounidense",
      exercisedAtomSurfaces: ["estadounidense"],
    }),
    selfExplain({
      id: "es-m2-5-self-agreement",
      anchorLabel: "You just wrote: soy estadounidense",
      anchorAudioText: "soy estadounidense",
      question: "Why doesn't estadounidense change to a different ending for a man?",
      rule: { text: "Nationality adjectives ending in -e (like estadounidense) don't change for gender — only -o/-a adjectives like mexicano/mexicana do." },
      surface: { text: "Estadounidense never changes because it's a proper noun." },
      distractor: { text: "Estadounidense stays the same because the United States is considered gender-neutral culturally." },
      ruleExplanation: "Only adjectives ending in -o (mexicano) swap to -a for a woman. Adjectives already ending in -e (estadounidense) or a consonant stay the same for everyone.",
    }),
    build(
      "es-m2-5-b-ellaestadounidense",
      "Say: 'She is American.'",
      "ella es estadounidense",
      ["ella", "es", "estadounidense", "mexicana"],
      ["ella", "es", "estadounidense"],
      ["ella", "es", "estadounidense"],
    ),
    reviewMatchPairs("es-m2-5-rev", "es-m2-5-rev-seed", "m2", 6),
    listeningCompSentence({
      id: "es-m2-5-rev-lc",
      audioText: "gracias, doctora",
      correctMeaningEn: "thank you, doctor (f)",
      distractorsEn: ["thank you, teacher (f)", "goodbye, doctor (f)", "excuse me, doctor (f)"],
      exercisedAtomSurfaces: ["doctora"],
    }),
    infoStep(
      "es-m2-5-info-win",
      "You can say where you're from",
      "You can now name your origin and your nationality, with the adjective agreeing to match you.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m2-6-info-escucha",
      "Just listening this time",
      "No text hints this round — trust your ear. Every phrase reuses words you already know.",
      "default",
    ),
    listeningCompSentence({
      id: "es-m2-6-lc-mellamo",
      audioText: "me llamo Sofía",
      correctMeaningEn: "my name is Sofía",
      distractorsEn: ["what's your name?", "where are you from?", "nice to meet you"],
      exercisedAtomSurfaces: ["me llamo"],
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
      id: "es-m2-6-lc-mexico",
      audioText: "soy de México",
      correctMeaningEn: "I am from Mexico",
      distractorsEn: ["I am from Spain", "I am from the United States", "I am Mexican"],
      exercisedAtomSurfaces: ["soy", "de", "México"],
    }),
    speaking("es-m2-6-speak-doctora", "ella es doctora", "she is a doctor", ["ella", "es", "doctora"]),
    listeningCompSentence({
      id: "es-m2-6-lc-dedonde",
      audioText: "¿de dónde eres?",
      correctMeaningEn: "where are you from?",
      distractorsEn: ["what's your name?", "who is she?", "where is he from?"],
      exercisedAtomSurfaces: ["¿de dónde eres?"],
    }),
    listeningBuildSentence({
      id: "es-m2-6-lb-usted",
      target: "usted es doctor",
      tiles: ["usted", "es", "doctor", "doctora"],
      correctOrder: ["usted", "es", "doctor"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["usted", "es", "doctor"],
    }),
    listeningCompSentence({
      id: "es-m2-6-lc-estadounidense",
      audioText: "soy estadounidense",
      correctMeaningEn: "I am American",
      distractorsEn: ["I am Mexican", "I am Spanish", "I am a student"],
      exercisedAtomSurfaces: ["estadounidense"],
    }),
    build(
      "es-m2-6-b-espana",
      "Say: 'He is from Spain.'",
      "él es de España",
      ["él", "es", "de", "España", "ella"],
      ["él", "es", "de", "España"],
      ["él", "es", "de", "España"],
    ),
    listeningCompSentence({
      id: "es-m2-6-lc-espana",
      audioText: "él es de España",
      correctMeaningEn: "he is from Spain",
      distractorsEn: ["she is from Spain", "he is from Mexico", "he is a student"],
      exercisedAtomSurfaces: ["él", "de", "España"],
    }),
    translateStep({
      id: "es-m2-6-tr-maestra",
      promptEn: "She is a teacher",
      acceptedAnswers: ["ella es maestra", "Ella es maestra"],
      audioText: "ella es maestra",
      exercisedAtomSurfaces: ["ella", "es", "maestra"],
    }),
    listeningBuildSentence({
      id: "es-m2-6-lb-mexicana",
      target: "ella es mexicana",
      tiles: ["ella", "es", "mexicana", "mexicano"],
      correctOrder: ["ella", "es", "mexicana"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["ella", "es", "mexicana"],
    }),
    listeningCompSentence({
      id: "es-m2-6-lc-senora",
      audioText: "mucho gusto, señora",
      correctMeaningEn: "nice to meet you, ma'am",
      distractorsEn: ["nice to meet you, sir", "good morning, ma'am", "goodbye, ma'am"],
      exercisedAtomSurfaces: ["señora"],
    }),
    vocabTextMcq("es-m2-6-tmcq-mexicana", "mexicana", ["mexicano", "español", "estadounidense"]),
    speaking("es-m2-6-speak-espana", "soy de España", "I am from Spain", ["soy", "de", "España"]),
    reviewMatchPairs("es-m2-6-rev", "es-m2-6-rev-seed", "m2", 6),
    listeningCompSentence({
      id: "es-m2-6-rev-lc",
      audioText: "adiós, amigo",
      correctMeaningEn: "goodbye, friend (m)",
      distractorsEn: ["hello, friend (m)", "nice to meet you", "good afternoon"],
      exercisedAtomSurfaces: ["amigo"],
    }),
    speaking("es-m2-6-rev-speak", "gracias, maestra", "thank you, teacher (f)", ["maestra"]),
    infoStep(
      "es-m2-6-info-win",
      "You can understand it by ear",
      "You picked names, origins, and jobs out of the audio with no text to lean on — that's real listening.",
      "win",
    ),
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
  estimatedMinutes: 9,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m2-7-info-dialogo",
      "Two students meet",
      "Marta and Diego are meeting for the first time at school. Listen closely — every line is made of words you already know.",
      "default",
    ),
    dialogueListen({
      id: "es-m2-7-dialogue",
      lines: [
        { speaker: "Marta", text: "¡Hola! Me llamo Marta. ¿Cómo te llamas?" },
        { speaker: "Diego", text: "Me llamo Diego. Mucho gusto." },
        { speaker: "Marta", text: "Mucho gusto. ¿De dónde eres?" },
        { speaker: "Diego", text: "Soy de México. Soy estudiante." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "¿Cómo se llama el chico?",
          correctText: "Diego",
          distractors: ["Marta", "Carlos", "Ana"],
        },
        {
          id: "q2",
          prompt: "¿De dónde es Diego?",
          correctText: "de México",
          distractors: ["de España", "de Estados Unidos", "de la escuela"],
        },
      ],
      exercisedAtomSurfaces: ["me llamo", "¿cómo te llamas?", "soy", "de", "México", "estudiante"],
    }),
    sentenceMcq({
      id: "es-m2-7-q-reply",
      prompt: "Marta te dice: '¡Hola! ¿Cómo te llamas?' Tú eres Diego. ¿Qué respondes?",
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
    speaking("es-m2-7-speak-eeuu", "ella es de Estados Unidos", "she is from the United States", ["ella", "de", "Estados Unidos"]),
    sentenceMcq({
      id: "es-m2-7-q-formal",
      prompt: "Conoces a un señor mayor en la fiesta. ¿Cómo le preguntas su nombre?",
      correctText: "¿cómo se llama usted?",
      distractorsText: ["¿cómo te llamas?", "¿de dónde eres?", "me llamo señor"],
      exercisedAtomSurfaces: ["usted"],
    }),
    build(
      "es-m2-7-b-informal",
      "Say (to a friend): 'What's your name?'",
      "¿cómo te llamas?",
      ["¿cómo te llamas?", "¿cómo se llama usted?", "mucho gusto"],
      ["¿cómo te llamas?"],
      ["¿cómo te llamas?"],
    ),
    listeningCompSentence({
      id: "es-m2-7-lc-senora",
      audioText: "mucho gusto, señora",
      correctMeaningEn: "nice to meet you, ma'am",
      distractorsEn: ["nice to meet you, sir", "good morning, ma'am", "goodbye, ma'am"],
      exercisedAtomSurfaces: ["señora"],
    }),
    speaking("es-m2-7-speak-dedonde", "¿de dónde eres?", "where are you from?", ["¿de dónde eres?"]),
    vocabTextMcq("es-m2-7-tmcq-doctora", "doctora", ["doctor", "señora", "maestra"]),
    build(
      "es-m2-7-b-ana-doctora",
      "Say: 'Ana is a doctor.'",
      "Ana es doctora",
      ["Ana", "es", "doctora", "doctor"],
      ["Ana", "es", "doctora"],
      ["es", "doctora"],
    ),
    sentenceMcq({
      id: "es-m2-7-q-quien-ensena",
      prompt: "En la conversación, Diego dice que es estudiante y Marta dice que es maestra. ¿Quién enseña en la escuela?",
      correctText: "Marta",
      distractorsText: ["Diego", "el doctor", "la señora"],
    }),
    speaking("es-m2-7-speak-senor", "mucho gusto, señor", "nice to meet you, sir", ["señor"]),
    translateStep({
      id: "es-m2-7-tr-maestra",
      promptEn: "I am a teacher",
      acceptedAnswers: ["soy maestra", "Soy maestra"],
      audioText: "soy maestra",
      exercisedAtomSurfaces: ["soy", "maestra"],
    }),
    infoStep(
      "es-m2-7-info-vosotros",
      "Vosotros, in Spain",
      "In Spain, friends address a group as vosotros — you'll hear it in movies and music from there. Latin America (and this course) uses ustedes for every group instead; it arrives in a later module. For now the split is simple: tú for one friend, usted for one stranger.",
      "culture",
    ),
    reviewMatchPairs("es-m2-7-rev", "es-m2-7-rev-seed", "m2", 6),
    listeningCompSentence({
      id: "es-m2-7-rev-lc",
      audioText: "por favor, doctor",
      correctMeaningEn: "please, doctor",
      distractorsEn: ["thank you, doctor", "excuse me, doctor", "goodbye, doctor"],
      exercisedAtomSurfaces: ["doctor"],
    }),
    speaking("es-m2-7-rev-speak", "hola, maestro", "hello, teacher (m)", ["maestro"]),
    infoStep(
      "es-m2-7-info-win",
      "You can hold a first conversation",
      "Names, origins, jobs, and the right register — you can now meet someone new in Spanish from start to finish.",
      "win",
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
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m2-8-q-como",
      prompt: "Quieres saber el nombre de un nuevo compañero de clase. ¿Qué le preguntas?",
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
    translateStep({
      id: "es-m2-8-tr-estudiante",
      promptEn: "I am a student",
      acceptedAnswers: ["soy estudiante", "Soy estudiante", "yo soy estudiante", "Yo soy estudiante"],
      audioText: "soy estudiante",
      exercisedAtomSurfaces: ["soy", "estudiante"],
    }),
    sentenceMcq({
      id: "es-m2-8-q-maestra",
      prompt: "Ella enseña en la escuela todos los días. ¿Qué es ella?",
      correctText: "maestra",
      distractorsText: ["estudiante", "doctora", "señora"],
      exercisedAtomSurfaces: ["maestra"],
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
    listeningCompSentence({
      id: "es-m2-8-lc-espana",
      audioText: "soy de España",
      correctMeaningEn: "I am from Spain",
      distractorsEn: ["I am from Mexico", "I am from the United States", "I am a student"],
      exercisedAtomSurfaces: ["de", "España"],
    }),
    sentenceMcq({
      id: "es-m2-8-q-usted",
      prompt: "Hablas con el señor García, un desconocido mayor. 'Usted ___ doctor.' ¿Qué falta?",
      correctText: "es",
      distractorsText: ["eres", "soy", "ser"],
      exercisedAtomSurfaces: ["usted", "es"],
    }),
    speaking("es-m2-8-speak-mellamo", "hola, me llamo Carlos", "hello, my name is Carlos", ["me llamo"]),
    listeningCompSentence({
      id: "es-m2-8-lc-rev-gracias",
      audioText: "gracias, doctora",
      correctMeaningEn: "thank you, doctor (f)",
      distractorsEn: ["thank you, teacher (f)", "goodbye, doctor (f)", "excuse me, doctor (f)"],
      exercisedAtomSurfaces: ["doctora"],
    }),
    sentenceMcq({
      id: "es-m2-8-q-rev-gracias",
      prompt: "Alguien te da un regalo. ¿Qué le dices?",
      correctText: "gracias",
      distractorsText: ["adiós", "perdón", "¿cómo te llamas?"],
      exercisedAtomSurfaces: ["gracias"],
    }),
    translateStep({
      id: "es-m2-8-tr-formal",
      promptEn: "Ask a stranger (formal): what's your name?",
      acceptedAnswers: [
        "¿cómo se llama usted?",
        "¿Cómo se llama usted?",
        "como se llama usted?",
        "Como se llama usted?",
      ],
      audioText: "¿cómo se llama usted?",
      exercisedAtomSurfaces: ["usted"],
    }),
    build(
      "es-m2-8-b-rev-adios",
      "Say: 'Goodbye, teacher.'",
      "adiós maestro",
      ["adiós", "maestro", "maestra", "hola"],
      ["adiós", "maestro"],
      ["adiós", "maestro"],
    ),
  ],
};

const ES_M2_LESSONS: LessonContent[] = [
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

const ES_M2_PLACEMENT: {
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

export { ES_M2_LESSONS, ES_M2_PLACEMENT };
