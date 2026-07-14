/**
 * Spanish Module 15 — Mi rutina (reflexives, daily narrative).
 *
 * The reflexive system is the last big present-tense machine of A1: the
 * -se verbs (levantarse, ducharse, vestirse…) with their me/te/se/nos
 * pronouns, the body-part-with-article pattern (me lavo la cara, not mi
 * cara), the reflexive vs non-reflexive contrast (lavarse vs lavar), and
 * the sequencing kit (primero, luego, antes de, después de, por la
 * mañana/tarde/noche) that lets the learner narrate a whole day.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m15-1  Reflexives — la rutina, levantarse, me levanto, se levanta
 *   es-m15-2  Getting ready — despertarse, ducharse, bañarse, vestirse
 *   es-m15-3  Grooming — lavarse, cepillarse, los dientes, el pelo, la cara
 *   es-m15-4  Sequencing — primero, luego, por la mañana / noche
 *   es-m15-5  Antes y después — desayunar, salir/salgo, acostarse
 *   es-m15-6  Listening focus — por la tarde, después de, a full day
 *   es-m15-7  Integration — Mi día narrative + speaking
 *   es-m15-8  M15 Mastery Test
 *
 * Stem changers carry over from m13: despertarse e→ie (me despierto),
 * vestirse e→i (me visto), acostarse o→ue (me acuesto). Sentence-level
 * listening only (M5+ ratchet).
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
import "./m14";

const COURSE_ID = "mock-1";

// ─── M15 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M15_ATOMS: EsAtom[] = [
  // Reflexive verbs
  atom({ surface: "levantarse", meaningEn: "to get up", partOfSpeech: "verb", fromModule: "m15", kind: "vocab" }),
  atom({ surface: "despertarse", meaningEn: "to wake up", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "⏰" }),
  atom({ surface: "ducharse", meaningEn: "to shower", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "🚿" }),
  atom({ surface: "bañarse", meaningEn: "to bathe", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "🛁" }),
  atom({ surface: "vestirse", meaningEn: "to get dressed", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "👕" }),
  atom({ surface: "acostarse", meaningEn: "to go to bed", partOfSpeech: "verb", fromModule: "m15", kind: "vocab" }),
  atom({ surface: "lavarse", meaningEn: "to wash (oneself)", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "🧼" }),
  atom({ surface: "cepillarse", meaningEn: "to brush (hair/teeth)", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "🪥" }),
  // Conjugated anchors
  atom({ surface: "me levanto", meaningEn: "I get up", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  atom({ surface: "se levanta", meaningEn: "he/she gets up", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  // Body parts
  atom({ surface: "diente", meaningEn: "tooth", partOfSpeech: "noun", fromModule: "m15", kind: "vocab", gender: "m", emoji: "🦷" }),
  atom({ surface: "pelo", meaningEn: "hair", partOfSpeech: "noun", fromModule: "m15", kind: "vocab", gender: "m" }),
  atom({ surface: "cara", meaningEn: "face", partOfSpeech: "noun", fromModule: "m15", kind: "vocab", gender: "f" }),
  // Sequencing
  atom({ surface: "primero", meaningEn: "first", partOfSpeech: "adverb", fromModule: "m15", kind: "vocab", emoji: "🥇" }),
  atom({ surface: "luego", meaningEn: "then", partOfSpeech: "adverb", fromModule: "m15", kind: "vocab" }),
  atom({ surface: "por la mañana", meaningEn: "in the morning", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  atom({ surface: "por la tarde", meaningEn: "in the afternoon", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  atom({ surface: "por la noche", meaningEn: "at night", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  atom({ surface: "antes de", meaningEn: "before", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  atom({ surface: "después de", meaningEn: "after", partOfSpeech: "phrase", fromModule: "m15", kind: "phrase" }),
  // The day itself
  atom({ surface: "rutina", meaningEn: "routine", partOfSpeech: "noun", fromModule: "m15", kind: "vocab", gender: "f" }),
  atom({ surface: "desayunar", meaningEn: "to have breakfast", partOfSpeech: "verb", fromModule: "m15", kind: "vocab" }),
  atom({ surface: "salir", meaningEn: "to leave / go out", partOfSpeech: "verb", fromModule: "m15", kind: "vocab", emoji: "🚪" }),
  atom({ surface: "salgo", meaningEn: "I leave", partOfSpeech: "verb", fromModule: "m15", kind: "vocab" }),
];

// Shared distractor entries for word-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg):
// 23f0 1f6bf 1f6c1 1f455 1f9fc 1faa5 1f9b7 1f947 1f6aa — checked at
// authoring time.
const DESPERTARSE = { surface: "despertarse", emoji: "⏰" };
const DUCHARSE = { surface: "ducharse", emoji: "🚿" };
const BANARSE = { surface: "bañarse", emoji: "🛁" };
const VESTIRSE = { surface: "vestirse", emoji: "👕" };
const CEPILLARSE = { surface: "cepillarse", emoji: "🪥" };

// ─── es-m15-1 — Reflexives ──────────────────────────────────────────────────

const M15_1: LessonContent = {
  id: "es-m15-1",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Reflexives — me levanto",
  description: "Verbs that point back at you: levantarse and la rutina.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m15-1-info-reflexive",
      "Verbs that point back at you",
      "levantarse means 'to get up' — literally 'to raise oneself'. The -se tail is a pronoun that changes with the person: yo me levanto, tú te levantas, él/ella se levanta, nosotros nos levantamos. Drop the -se, conjugate the verb, put the pronoun in front. Your whole morning works this way — that is your rutina.",
      "grammar",
    ),
    phrase("es-m15-1-p-rutina", "the routine", "la rutina", undefined, { atomId: "es:rutina" }),
    vocab("es-m15-1-v-levantarse", "to get up", "levantarse"),
    sentenceMcq({
      id: "es-m15-1-q-rutina",
      prompt: "'my routine' — pick the Spanish.",
      correctText: "mi rutina",
      distractorsText: ["tu rutina", "mi ropa", "mi trabajo"],
      exercisedAtomSurfaces: ["rutina"],
    }),
    sentenceMcq({
      id: "es-m15-1-q-levantarse",
      prompt: "'to get up' — which verb is it?",
      correctText: "levantarse",
      distractorsText: ["acostarse", "ducharse", "desayunar"],
      exercisedAtomSurfaces: ["levantarse"],
    }),
    phrase("es-m15-1-p-melevanto", "I get up", "me levanto"),
    phrase("es-m15-1-p-selevanta", "he / she gets up", "se levanta"),
    build(
      "es-m15-1-build-melevanto",
      "Build: 'I get up early.'",
      "me levanto temprano",
      ["me", "levanto", "temprano", "se"],
      ["me", "levanto", "temprano"],
      ["me levanto"],
    ),
    sentenceMcq({
      id: "es-m15-1-q-selevanta",
      prompt: "'My dad gets up early.' — pick the Spanish.",
      correctText: "Mi papá se levanta temprano.",
      distractorsText: [
        "Mi papá me levanta temprano.",
        "Mi papá se levanta tarde.",
        "Yo me levanto temprano.",
      ],
      exercisedAtomSurfaces: ["se levanta"],
    }),
  ],
};

// ─── es-m15-2 — Getting ready ───────────────────────────────────────────────

const M15_2: LessonContent = {
  id: "es-m15-2",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Getting ready — me, te, se",
  description: "Wake up, shower, bathe, get dressed.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m15-2-info-pronouns",
      "me, te, se",
      "Every reflexive verb swaps its -se for the person doing it: me ducho (I shower), te duchas (you shower), se ducha (he/she showers). Watch the stem changers you met in m13: despertarse → me despierto (e→ie), and vestirse → me visto (e→i).",
      "grammar",
    ),
    phrase("es-m15-2-p-despertarse", "to wake up", "despertarse", undefined, { emoji: "⏰" }),
    phrase("es-m15-2-p-ducharse", "to shower", "ducharse", undefined, { emoji: "🚿" }),
    vocabMcq("es-m15-2-mcq-despertarse", { surface: "despertarse", meaningEn: "to wake up", emoji: "⏰" }, [DUCHARSE, BANARSE, VESTIRSE]),
    vocabMcq("es-m15-2-mcq-ducharse", { surface: "ducharse", meaningEn: "to shower", emoji: "🚿" }, [BANARSE, DESPERTARSE, VESTIRSE]),
    phrase("es-m15-2-p-banarse", "to bathe", "bañarse", undefined, { emoji: "🛁" }),
    phrase("es-m15-2-p-vestirse", "to get dressed", "vestirse", undefined, { emoji: "👕" }),
    sentenceMcq({
      id: "es-m15-2-q-banarse",
      prompt: "'The girl takes a bath every day.' — pick the Spanish.",
      correctText: "La niña se baña todos los días.",
      distractorsText: [
        "La niña se ducha todos los días.",
        "La niña me baña todos los días.",
        "La niña se levanta todos los días.",
      ],
      exercisedAtomSurfaces: ["bañarse"],
    }),
    sentenceMcq({
      id: "es-m15-2-q-vestirse",
      prompt: "'I get dressed.' — pick the correct form.",
      correctText: "me visto",
      distractorsText: ["me vesto", "te visto", "me vista"],
      explanation: "An e→i stem changer, like pedir — the e of the stem flips.",
      exercisedAtomSurfaces: ["vestirse"],
    }),
  ],
};

// ─── es-m15-3 — Grooming ────────────────────────────────────────────────────

const M15_3: LessonContent = {
  id: "es-m15-3",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "La cara, el pelo, los dientes",
  description: "Wash and brush with el/la — the pronoun says whose.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m15-3-info-article",
      "Wash the face, not my face",
      "With reflexive verbs, body parts take el/la/los — the pronoun already says whose: Me lavo la cara (I wash my face), Me cepillo los dientes (I brush my teeth). Compare: Lavo el carro — no -se, because the car is not you. lavarse = wash yourself; lavar = wash something else.",
      "grammar",
    ),
    phrase("es-m15-3-p-lavarse", "to wash (oneself)", "lavarse", undefined, { emoji: "🧼" }),
    phrase("es-m15-3-p-dientes", "the teeth", "los dientes", undefined, { atomId: "es:diente", emoji: "🦷" }),
    sentenceMcq({
      id: "es-m15-3-q-lavarse",
      prompt: "'I wash my face.' — pick the Spanish.",
      correctText: "Me lavo la cara.",
      distractorsText: ["Lavo mi cara.", "Me lavo el carro.", "Se lava la cara."],
      exercisedAtomSurfaces: ["lavarse", "cara"],
    }),
    sentenceMcq({
      id: "es-m15-3-q-dientes",
      prompt: "'I brush my teeth.' — pick the Spanish.",
      correctText: "Me cepillo los dientes.",
      distractorsText: [
        "Me cepillo el pelo.",
        "Me lavo las manos.",
        "Se cepilla los dientes.",
      ],
      exercisedAtomSurfaces: ["diente", "cepillarse"],
    }),
    phrase("es-m15-3-p-cepillarse", "to brush (hair / teeth)", "cepillarse", undefined, { emoji: "🪥" }),
    phrase("es-m15-3-p-pelo", "the hair", "el pelo", undefined, { atomId: "es:pelo" }),
    sentenceMcq({
      id: "es-m15-3-q-cepillarse",
      prompt: "'She brushes her hair.' — pick the Spanish.",
      correctText: "Se cepilla el pelo.",
      distractorsText: ["Me cepillo el pelo.", "Se lava los dientes.", "Se cepilla la cara."],
      exercisedAtomSurfaces: ["cepillarse"],
    }),
    translateStep({
      id: "es-m15-3-tr-pelo",
      promptEn: "I wash my hair.",
      acceptedAnswers: ["Me lavo el pelo.", "me lavo el pelo", "Me lavo el pelo"],
      audioText: "Me lavo el pelo.",
      exercisedAtomSurfaces: ["lavarse", "pelo"],
    }),
  ],
};

// ─── es-m15-4 — Sequencing ──────────────────────────────────────────────────

const M15_4: LessonContent = {
  id: "es-m15-4",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Primero, luego",
  description: "Sequence your day: first, then, morning to night.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m15-4-info-sequence",
      "Sequencing your day",
      "primero = first, luego = then. Time-of-day frames take por: por la mañana (in the morning), por la tarde (in the afternoon), por la noche (at night). Primero me ducho, luego me visto — first I shower, then I get dressed.",
      "grammar",
    ),
    phrase("es-m15-4-p-porlamanana", "in the morning", "por la mañana"),
    phrase("es-m15-4-p-porlanoche", "at night", "por la noche"),
    sentenceMcq({
      id: "es-m15-4-q-porlamanana",
      prompt: "'I shower in the morning.' — pick the Spanish.",
      correctText: "Me ducho por la mañana.",
      distractorsText: [
        "Me ducho por la noche.",
        "Me acuesto por la mañana.",
        "Me visto por la tarde.",
      ],
      exercisedAtomSurfaces: ["ducharse", "por la mañana"],
    }),
    sentenceMcq({
      id: "es-m15-4-q-porlanoche",
      prompt: "'The boy takes a bath at night.' — pick the Spanish.",
      correctText: "El niño se baña por la noche.",
      distractorsText: [
        "El niño se baña por la mañana.",
        "El niño se ducha por la tarde.",
        "El niño se despierta por la noche.",
      ],
      exercisedAtomSurfaces: ["bañarse", "por la noche"],
    }),
    vocab("es-m15-4-v-primero", "first", "primero", undefined, { emoji: "🥇" }),
    vocab("es-m15-4-v-luego", "then", "luego"),
    build(
      "es-m15-4-build-primero",
      "Build: 'First I wash my face.'",
      "primero me lavo la cara",
      ["primero", "me", "lavo", "la", "cara", "luego"],
      ["primero", "me", "lavo", "la", "cara"],
      ["primero", "lavarse", "cara"],
    ),
    cloze(
      "es-m15-4-cloze-luego",
      "Primero me ducho y",
      "me visto.",
      "luego",
      ["luego", "primero", "nunca", "siempre"],
      "First I shower and then I get dressed.",
      "Primero me ducho y luego me visto.",
      "Chains the second action after the first.",
    ),
  ],
};

// ─── es-m15-5 — Antes y después ─────────────────────────────────────────────

const M15_5: LessonContent = {
  id: "es-m15-5",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Antes de, después de",
  description: "Before and after — plus salgo, the yo-irregular.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m15-5-info-antesdespues",
      "antes de, después de",
      "antes de = before, después de = after — and the verb that follows stays in the infinitive: antes de salir (before leaving), después de desayunar (after having breakfast). One more surprise: salir is irregular in yo — salgo (I leave).",
      "grammar",
    ),
    vocab("es-m15-5-v-desayunar", "to have breakfast", "desayunar"),
    vocab("es-m15-5-v-salir", "to leave / go out", "salir", undefined, { emoji: "🚪" }),
    sentenceMcq({
      id: "es-m15-5-q-desayunar",
      prompt: "'I have breakfast at home.' — pick the Spanish.",
      correctText: "Desayuno en casa.",
      distractorsText: ["Desayunar en casa.", "Almuerzo en casa.", "Como en la escuela."],
      exercisedAtomSurfaces: ["desayunar"],
    }),
    sentenceMcq({
      id: "es-m15-5-q-salgo",
      prompt: "'I leave early.' — salir is irregular in yo. Pick it.",
      correctText: "Salgo temprano.",
      distractorsText: ["Salo temprano.", "Sales temprano.", "Salir temprano."],
      exercisedAtomSurfaces: ["salir", "salgo"],
    }),
    vocab("es-m15-5-v-acostarse", "to go to bed", "acostarse"),
    phrase("es-m15-5-p-antesde", "before", "antes de"),
    sentenceMcq({
      id: "es-m15-5-q-acostarse",
      prompt: "'I go to bed late.' — pick the Spanish.",
      correctText: "Me acuesto tarde.",
      distractorsText: ["Me acosto tarde.", "Me acuesta tarde.", "Te acuestas tarde."],
      explanation: "An o→ue stem changer, like dormir — the o of the stem flips.",
      exercisedAtomSurfaces: ["acostarse"],
    }),
    build(
      "es-m15-5-build-antesde",
      "Build: 'I have breakfast before leaving.'",
      "desayuno antes de salir",
      ["desayuno", "antes", "de", "salir", "después"],
      ["desayuno", "antes", "de", "salir"],
      ["antes de", "desayunar", "salir"],
    ),
  ],
};

// ─── es-m15-6 — Listening focus ─────────────────────────────────────────────

const M15_6: LessonContent = {
  id: "es-m15-6",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — un día completo",
  description: "Sentence-level listening: a whole day in order.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    phrase("es-m15-6-p-porlatarde", "in the afternoon", "por la tarde"),
    phrase("es-m15-6-p-despuesde", "after", "después de"),
    listeningCompSentence({
      id: "es-m15-6-lc-porlatarde",
      audioText: "Estudio por la tarde.",
      correctMeaningEn: "I study in the afternoon.",
      distractorsEn: ["I study in the morning.", "I work at night.", "I rest in the afternoon."],
      exercisedAtomSurfaces: ["por la tarde"],
    }),
    listeningCompSentence({
      id: "es-m15-6-lc-despuesde",
      audioText: "Me cepillo los dientes después de desayunar.",
      correctMeaningEn: "I brush my teeth after having breakfast.",
      distractorsEn: [
        "I brush my teeth before having breakfast.",
        "I wash my face after having lunch.",
        "I brush my hair after having breakfast.",
      ],
      exercisedAtomSurfaces: ["después de", "cepillarse"],
    }),
    listeningBuildSentence({
      id: "es-m15-6-lb-melevanto",
      target: "me levanto por la mañana",
      tiles: ["me", "levanto", "por", "la", "mañana", "noche"],
      correctOrder: ["me", "levanto", "por", "la", "mañana"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["me levanto", "por la mañana"],
    }),
    listeningCompSentence({
      id: "es-m15-6-lc-selevanta",
      audioText: "Mi mamá se levanta temprano y desayuna.",
      correctMeaningEn: "My mom gets up early and has breakfast.",
      distractorsEn: [
        "My mom goes to bed early.",
        "My mom gets up late and has breakfast.",
        "My dad gets up early and has breakfast.",
      ],
      exercisedAtomSurfaces: ["se levanta", "desayunar"],
    }),
    listeningBuildSentence({
      id: "es-m15-6-lb-seacuesta",
      target: "mi papá se acuesta tarde",
      tiles: ["mi", "papá", "se", "acuesta", "tarde", "temprano"],
      correctOrder: ["mi", "papá", "se", "acuesta", "tarde"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["acostarse"],
    }),
    listeningCompSentence({
      id: "es-m15-6-lc-ducha",
      audioText: "Primero me ducho y luego me visto.",
      correctMeaningEn: "First I shower and then I get dressed.",
      distractorsEn: [
        "First I get dressed and then I shower.",
        "First I bathe and then I go to bed.",
        "First I wake up and then I have breakfast.",
      ],
      exercisedAtomSurfaces: ["ducharse", "primero", "luego"],
    }),
    cloze(
      "es-m15-6-cloze-se",
      "Mi hermana",
      "cepilla el pelo.",
      "se",
      ["se", "me", "te", "nos"],
      "My sister brushes her hair.",
      "Mi hermana se cepilla el pelo.",
      "Third person — the pronoun must match her, not you.",
    ),
  ],
};

// ─── es-m15-7 — Integration ─────────────────────────────────────────────────

const M15_7: LessonContent = {
  id: "es-m15-7",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Mi día — integración",
  description: "Narrate your routine start to finish, out loud.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m15-7-info-midia",
      "Un día en mi vida",
      "Por la mañana me despierto temprano. Primero me ducho, luego me visto y desayuno. Salgo de mi casa a las ocho. Por la tarde estudio y trabajo. Por la noche me cepillo los dientes y me acuesto.\nRead it out loud — every line is yours now.",
      "default",
    ),
    sentenceMcq({
      id: "es-m15-7-q-story",
      prompt: "In the story, what happens first in the morning?",
      correctText: "Me despierto temprano.",
      distractorsText: [
        "Me acuesto temprano.",
        "Desayuno en la escuela.",
        "Salgo por la noche.",
      ],
      exercisedAtomSurfaces: ["despertarse"],
    }),
    build(
      "es-m15-7-build-rutina",
      "Build: 'First I shower and then I have breakfast.'",
      "primero me ducho y luego desayuno",
      ["primero", "me", "ducho", "y", "luego", "desayuno"],
      ["primero", "me", "ducho", "y", "luego", "desayuno"],
      ["primero", "luego", "ducharse", "desayunar"],
    ),
    translateStep({
      id: "es-m15-7-tr-selevanta",
      promptEn: "My mom gets up early.",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "Mi mamá se levanta temprano.",
        "Mi mama se levanta temprano.",
        "mi mamá se levanta temprano",
        "mi mama se levanta temprano",
      ],
      audioText: "Mi mamá se levanta temprano.",
      exercisedAtomSurfaces: ["se levanta"],
    }),
    sentenceMcq({
      id: "es-m15-7-q-salgo",
      prompt: "'I leave my house in the morning.' — pick the Spanish.",
      correctText: "Salgo de mi casa por la mañana.",
      distractorsText: [
        "Salir de mi casa por la mañana.",
        "Salgo de mi casa por la noche.",
        "Me acuesto por la mañana.",
      ],
      exercisedAtomSurfaces: ["salgo", "por la mañana"],
    }),
    speaking(
      "es-m15-7-speak-melevanto",
      "Me levanto temprano todos los días.",
      "I get up early every day.",
      ["me levanto"],
    ),
    translateStep({
      id: "es-m15-7-tr-dientes",
      promptEn: "I brush my teeth at night.",
      acceptedAnswers: [
        "Me cepillo los dientes por la noche.",
        "me cepillo los dientes por la noche",
        "Me cepillo los dientes por la noche",
      ],
      audioText: "Me cepillo los dientes por la noche.",
      exercisedAtomSurfaces: ["cepillarse", "diente", "por la noche"],
    }),
    speaking("es-m15-7-speak-acostarse", "Luego me acuesto.", "Then I go to bed.", ["luego", "acostarse"]),
  ],
};

// ─── es-m15-8 — Mastery test ────────────────────────────────────────────────

const M15_8: LessonContent = {
  id: "es-m15-8",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M15 Mastery Test",
  description: "Reflexives, grooming, sequencing — the whole module.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m15-8-q-melevanto",
      prompt: "'I get up' — pick the Spanish.",
      correctText: "me levanto",
      distractorsText: ["se levanta", "me acuesto", "me ducho"],
      exercisedAtomSurfaces: ["me levanto"],
    }),
    vocabMcq("es-m15-8-mcq-ducharse", { surface: "ducharse", meaningEn: "to shower", emoji: "🚿" }, [BANARSE, CEPILLARSE, VESTIRSE]),
    cloze(
      "es-m15-8-cloze-me",
      "Yo",
      "despierto temprano.",
      "me",
      ["me", "te", "se", "nos"],
      "I wake up early.",
      "Yo me despierto temprano.",
    ),
    sentenceMcq({
      id: "es-m15-8-q-vestirse",
      prompt: "'I get dressed' — pick the correct form.",
      correctText: "me visto",
      distractorsText: ["me vesto", "se viste", "te vistes"],
      exercisedAtomSurfaces: ["vestirse"],
    }),
    listeningCompSentence({
      id: "es-m15-8-lc-mastery",
      audioText: "Primero me lavo la cara y luego me cepillo el pelo.",
      correctMeaningEn: "First I wash my face and then I brush my hair.",
      distractorsEn: [
        "First I brush my hair and then I wash my face.",
        "First I wash my hair and then I brush my teeth.",
        "First I shower and then I get dressed.",
      ],
      exercisedAtomSurfaces: ["lavarse", "cepillarse", "cara", "pelo"],
    }),
    translateStep({
      id: "es-m15-8-tr-acuesto",
      promptEn: "I go to bed late.",
      acceptedAnswers: ["Me acuesto tarde.", "me acuesto tarde", "Me acuesto tarde"],
      audioText: "Me acuesto tarde.",
      exercisedAtomSurfaces: ["acostarse"],
    }),
    listeningBuildSentence({
      id: "es-m15-8-lb-desayuno",
      target: "desayuno antes de salir",
      tiles: ["desayuno", "antes", "de", "salir", "después", "luego"],
      correctOrder: ["desayuno", "antes", "de", "salir"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["desayunar", "antes de", "salir"],
    }),
    sentenceMcq({
      id: "es-m15-8-q-salgo",
      prompt: "'I leave early in the morning.' — pick the Spanish.",
      correctText: "Salgo temprano por la mañana.",
      distractorsText: [
        "Salir temprano por la mañana.",
        "Salgo tarde por la noche.",
        "Me levanto temprano por la tarde.",
      ],
      exercisedAtomSurfaces: ["salgo", "por la mañana"],
    }),
    speaking(
      "es-m15-8-speak-rutina",
      "Me ducho por la mañana y me acuesto por la noche.",
      "I shower in the morning and go to bed at night.",
      ["ducharse", "por la noche"],
    ),
  ],
};

export const ES_M15_LESSONS: LessonContent[] = [
  M15_1,
  M15_2,
  M15_3,
  M15_4,
  M15_5,
  M15_6,
  M15_7,
  M15_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M15_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m15",
      moduleId: "m15",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m15",
          prompt: "'I get up early.' — which is correct?",
          correctText: "Me levanto temprano.",
          distractorsText: [
            "Me levanta temprano.",
            "Yo levanto temprano.",
            "Te levantas temprano.",
          ],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m15-1",
      moduleId: "m15",
      build: () =>
        cloze(
          "pt-es-m15-1",
          "Yo",
          "ducho por la mañana.",
          "me",
          ["me", "te", "se", "nos"],
          "I shower in the morning.",
          "Yo me ducho por la mañana.",
        ),
    },
    {
      id: "pt-es-m15-2",
      moduleId: "m15",
      build: () =>
        sentenceMcq({
          id: "pt-es-m15-2",
          prompt: "'She brushes her teeth.' — pick the Spanish.",
          correctText: "Se cepilla los dientes.",
          distractorsText: [
            "Me cepillo los dientes.",
            "Se cepilla sus dientes.",
            "Te cepillas los dientes.",
          ],
        }),
    },
    {
      id: "pt-es-m15-3",
      moduleId: "m15",
      build: () =>
        sentenceMcq({
          id: "pt-es-m15-3",
          prompt: "'I go to bed late.' — pick the Spanish.",
          correctText: "Me acuesto tarde.",
          distractorsText: ["Me acosto tarde.", "Me acuesta tarde.", "Me levanto tarde."],
        }),
    },
    {
      id: "pt-es-m15-4",
      moduleId: "m15",
      build: () =>
        sentenceMcq({
          id: "pt-es-m15-4",
          prompt: "'First I have breakfast, then I leave.' — pick the Spanish.",
          correctText: "Primero desayuno y luego salgo.",
          distractorsText: [
            "Primero salgo y luego desayuno.",
            "Luego desayuno y primero salgo.",
            "Primero desayunar y luego salir.",
          ],
        }),
    },
  ],
};
