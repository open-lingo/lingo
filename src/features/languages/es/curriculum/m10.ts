/**
 * Spanish Module 10 — Comida y gustos (gustar, food, ordering).
 *
 * The learner arrives with both regular present paradigms (M8–M9) and a
 * food-free vocabulary. M10's job: the flipped mechanics of gustar
 * (me/te/le gusta + singular, gustan + plural, gusta + infinitive),
 * querer for plain requests, the polite quisiera for ordering, and a
 * pantry of food and drink to like, want, and order.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m10-1  Me gusta — the flipped verb (café, té)
 *   es-m10-2  ¿Te gusta? — drinks (jugo, leche, cerveza)
 *   es-m10-3  Le gusta — bread, cheese, chicken
 *   es-m10-4  ¿Gusta o gustan? — fruit & eggs
 *   es-m10-5  ¡Tengo hambre! — quiero (carne, pescado)
 *   es-m10-6  Listening focus — soup, salad, rice & the three meals
 *   es-m10-7  Integration — ordering at a restaurant + speaking
 *   es-m10-8  M10 Mastery Test
 *
 * All listening here is sentence-level (M5+ ratchet). Nouns are taught
 * WITH their article on the card (el pan, la leche) while atom surfaces
 * stay bare (pan, leche) per the spine's gender rule.
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
import "./m9";

const COURSE_ID = "mock-1";

// ─── M10 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M10_ATOMS: EsAtom[] = [
  // Gustar & wanting
  atom({ surface: "gustar", meaningEn: "to be pleasing (to like)", partOfSpeech: "verb", fromModule: "m10", kind: "vocab" }),
  atom({ surface: "me gusta", meaningEn: "I like", partOfSpeech: "phrase", fromModule: "m10", kind: "phrase" }),
  atom({ surface: "te gusta", meaningEn: "you like", partOfSpeech: "phrase", fromModule: "m10", kind: "phrase" }),
  atom({ surface: "le gusta", meaningEn: "he/she likes", partOfSpeech: "phrase", fromModule: "m10", kind: "phrase" }),
  atom({ surface: "querer", meaningEn: "to want", partOfSpeech: "verb", fromModule: "m10", kind: "vocab" }),
  atom({ surface: "quiero", meaningEn: "I want", partOfSpeech: "verb", fromModule: "m10", kind: "vocab" }),
  atom({ surface: "quisiera", meaningEn: "I would like", partOfSpeech: "verb", fromModule: "m10", kind: "vocab" }),
  // Drinks
  atom({ surface: "café", meaningEn: "coffee", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "☕" }),
  atom({ surface: "té", meaningEn: "tea", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🍵" }),
  atom({ surface: "jugo", meaningEn: "juice", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🧃" }),
  atom({ surface: "leche", meaningEn: "milk", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🥛" }),
  atom({ surface: "cerveza", meaningEn: "beer", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🍺" }),
  // Food
  atom({ surface: "pan", meaningEn: "bread", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🍞" }),
  atom({ surface: "queso", meaningEn: "cheese", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m" }),
  atom({ surface: "pollo", meaningEn: "chicken", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🍗" }),
  atom({ surface: "carne", meaningEn: "meat", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🥩" }),
  atom({ surface: "pescado", meaningEn: "fish (food)", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🐟" }),
  atom({ surface: "arroz", meaningEn: "rice", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🍚" }),
  atom({ surface: "huevo", meaningEn: "egg", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🥚" }),
  atom({ surface: "sopa", meaningEn: "soup", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🍜" }),
  atom({ surface: "ensalada", meaningEn: "salad", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🥬" }),
  atom({ surface: "fruta", meaningEn: "fruit", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🍇" }),
  atom({ surface: "manzana", meaningEn: "apple", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🍎" }),
  atom({ surface: "naranja", meaningEn: "orange", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f" }),
  // Meals & the table
  atom({ surface: "desayuno", meaningEn: "breakfast", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🍳" }),
  atom({ surface: "almuerzo", meaningEn: "lunch", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "m", emoji: "🍱" }),
  atom({ surface: "cena", meaningEn: "dinner", partOfSpeech: "noun", fromModule: "m10", kind: "vocab", gender: "f", emoji: "🍽️" }),
  atom({ surface: "la cuenta", meaningEn: "the check", partOfSpeech: "phrase", fromModule: "m10", kind: "phrase" }),
  atom({ surface: "rico", meaningEn: "delicious (m)", partOfSpeech: "adjective", fromModule: "m10", kind: "vocab", emoji: "😋" }),
  atom({ surface: "tengo hambre", meaningEn: "I'm hungry", partOfSpeech: "phrase", fromModule: "m10", kind: "phrase" }),
  atom({ surface: "tengo sed", meaningEn: "I'm thirsty", partOfSpeech: "phrase", fromModule: "m10", kind: "phrase" }),
];

// Shared distractor pool for food-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg) —
// checked at authoring time. queso and naranja have no viable glyph in
// the subset, so they never enter an image MCQ.
const CAFE = { surface: "café", emoji: "☕" };
const TE = { surface: "té", emoji: "🍵" };
const JUGO = { surface: "jugo", emoji: "🧃" };
const LECHE = { surface: "leche", emoji: "🥛" };
const CERVEZA = { surface: "cerveza", emoji: "🍺" };
const PAN = { surface: "pan", emoji: "🍞" };
const HUEVO = { surface: "huevo", emoji: "🥚" };
const SOPA = { surface: "sopa", emoji: "🍜" };
const FRUTA = { surface: "fruta", emoji: "🍇" };
const MANZANA = { surface: "manzana", emoji: "🍎" };
const DESAYUNO = { surface: "desayuno", emoji: "🍳" };
const ALMUERZO = { surface: "almuerzo", emoji: "🍱" };
const CENA = { surface: "cena", emoji: "🍽️" };

// ─── es-m10-1 — Me gusta, the flipped verb ──────────────────────────────────

const M10_1: LessonContent = {
  id: "es-m10-1",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Me gusta — the flipped verb",
  description: "Spanish says 'coffee pleases me'. Learn the flip with café and té.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m10-1-info-gustar",
      "The flipped verb: gustar",
      "To say you like something, Spanish flips the sentence. Me gusta el café is literally 'coffee is pleasing to me' — the liked thing is the subject, so gustar agrees with IT, not with you. For now the recipe is: me gusta + el/la + one thing. To dislike, put no in front: No me gusta el café.",
      "grammar",
    ),
    phrase("es-m10-1-p-megusta", "I like", "me gusta"),
    vocab("es-m10-1-p-cafe", "coffee", "el café", undefined, { atomId: "es:café", emoji: "☕" }),
    sentenceMcq({
      id: "es-m10-1-q-megusta",
      prompt: "How do you say 'I like coffee'?",
      correctText: "Me gusta el café.",
      distractorsText: ["Me gustan el café.", "Yo gusto el café.", "Quiero el café."],
      explanation: "One thing liked, so the verb stays singular — and the liker shows up as a little pronoun in front.",
      exercisedAtomSurfaces: ["me gusta"],
    }),
    listeningCompSentence({
      id: "es-m10-1-lc-cafe",
      audioText: "Me gusta el café",
      correctMeaningEn: "I like coffee",
      distractorsEn: ["I want coffee", "I like tea", "I don't like coffee"],
      exercisedAtomSurfaces: ["café", "me gusta"],
    }),
    vocab("es-m10-1-p-te", "tea", "el té", undefined, { atomId: "es:té", emoji: "🍵" }),
    cloze(
      "es-m10-1-cloze-no",
      "no me",
      "el té",
      "gusta",
      ["gusta", "gustan", "gusto", "gustas"],
      "I don't like tea",
      "no me gusta el té",
      "Tea is one thing, so the verb keeps its singular form after the no.",
    ),
    sentenceMcq({
      id: "es-m10-1-q-te",
      prompt: "How do you say 'I like tea'?",
      correctText: "Me gusta el té.",
      distractorsText: ["Me gusta el café.", "Te gusta el té.", "No me gusta el té."],
      exercisedAtomSurfaces: ["té", "me gusta"],
    }),
    speaking("es-m10-1-speak-megusta", "Me gusta el té.", "I like tea.", ["me gusta", "té"]),
  ],
};

// ─── es-m10-2 — ¿Te gusta? and drinks ───────────────────────────────────────

const M10_2: LessonContent = {
  id: "es-m10-2",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Te gusta? — drinks",
  description: "Ask what people like — over jugo, leche, and cerveza.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m10-2-info-tegusta",
      "Asking with te gusta",
      "Flip me to te and let your voice rise: ¿Te gusta el café? — do you like coffee? Answer with Sí, me gusta or, politely doubled, No, no me gusta. The first no answers, the second one negates.",
      "grammar",
    ),
    phrase("es-m10-2-p-tegusta", "you like", "te gusta"),
    vocab("es-m10-2-p-jugo", "juice", "el jugo", undefined, { atomId: "es:jugo", emoji: "🧃" }),
    sentenceMcq({
      id: "es-m10-2-q-tegusta",
      prompt: "Ask your friend: 'Do you like coffee?'",
      correctText: "¿Te gusta el café?",
      distractorsText: ["¿Me gusta el café?", "¿Le gusta el café?", "¿Te gustan el café?"],
      exercisedAtomSurfaces: ["te gusta", "café"],
    }),
    listeningCompSentence({
      id: "es-m10-2-lc-jugo",
      audioText: "¿Te gusta el jugo?",
      correctMeaningEn: "Do you like juice?",
      distractorsEn: ["Do you want juice?", "Do you like milk?", "Is there juice?"],
      exercisedAtomSurfaces: ["jugo", "te gusta"],
    }),
    vocab("es-m10-2-p-leche", "milk", "la leche", undefined, { atomId: "es:leche", emoji: "🥛" }),
    vocab("es-m10-2-p-cerveza", "beer", "la cerveza", undefined, { atomId: "es:cerveza", emoji: "🍺" }),
    vocabMcq(
      "es-m10-2-mcq-leche",
      { surface: "leche", meaningEn: "milk", emoji: "🥛" },
      [JUGO, CAFE, CERVEZA],
    ),
    vocabMcq(
      "es-m10-2-mcq-cerveza",
      { surface: "cerveza", meaningEn: "beer", emoji: "🍺" },
      [LECHE, TE, JUGO],
    ),
  ],
};

// ─── es-m10-3 — Le gusta ────────────────────────────────────────────────────

const M10_3: LessonContent = {
  id: "es-m10-3",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Le gusta — pan, queso, pollo",
  description: "Say what he or she likes, and stock up on food basics.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m10-3-info-legusta",
      "le gusta — likes at a distance",
      "For él, ella, or usted, the pronoun is le: le gusta el pan. Since le could be anyone, Spanish often names the person up front with a: A Ana le gusta el pan — 'to Ana, bread is pleasing'.",
      "grammar",
    ),
    phrase("es-m10-3-p-legusta", "he/she likes", "le gusta"),
    vocab("es-m10-3-p-pan", "bread", "el pan", undefined, { atomId: "es:pan", emoji: "🍞" }),
    sentenceMcq({
      id: "es-m10-3-q-legusta",
      prompt: "'She likes coffee' — pick it.",
      correctText: "A ella le gusta el café.",
      distractorsText: ["A ella te gusta el café.", "Ella gusta el café.", "A ella le gustan el café."],
      exercisedAtomSurfaces: ["le gusta", "café"],
    }),
    build(
      "es-m10-3-build-pan",
      "Build: 'She likes bread.'",
      "A ella le gusta el pan",
      ["A", "ella", "le", "gusta", "el", "pan"],
      ["A", "ella", "le", "gusta", "el", "pan"],
      ["le gusta", "pan"],
    ),
    vocab("es-m10-3-p-queso", "cheese", "el queso", undefined, { atomId: "es:queso" }),
    vocab("es-m10-3-p-pollo", "chicken", "el pollo", undefined, { atomId: "es:pollo", emoji: "🍗" }),
    sentenceMcq({
      id: "es-m10-3-q-queso",
      prompt: "'I like cheese' — pick it.",
      correctText: "Me gusta el queso.",
      distractorsText: ["Me gusta el pollo.", "Te gusta el queso.", "Le gusta la leche."],
      exercisedAtomSurfaces: ["queso", "me gusta"],
    }),
    listeningCompSentence({
      id: "es-m10-3-lc-pollo",
      audioText: "A él le gusta el pollo",
      correctMeaningEn: "He likes chicken",
      distractorsEn: ["She likes chicken", "He likes cheese", "He wants bread"],
      exercisedAtomSurfaces: ["pollo", "le gusta"],
    }),
  ],
};

// ─── es-m10-4 — Gusta vs gustan ─────────────────────────────────────────────

const M10_4: LessonContent = {
  id: "es-m10-4",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Gusta o gustan? — fruit & eggs",
  description: "One thing or many? Match gustar to what's liked.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m10-4-info-gustan",
      "gusta vs gustan",
      "Because the liked thing is the subject, gustar counts IT: one thing → gusta (me gusta la manzana), more than one → gustan (me gustan las manzanas). Liking an activity counts as one thing, so an infinitive takes gusta: me gusta comer.",
      "grammar",
    ),
    vocab("es-m10-4-p-manzana", "apple", "la manzana", undefined, { atomId: "es:manzana", emoji: "🍎" }),
    vocab("es-m10-4-p-naranja", "orange", "la naranja", undefined, { atomId: "es:naranja" }),
    vocabMcq(
      "es-m10-4-mcq-manzana",
      { surface: "manzana", meaningEn: "apple", emoji: "🍎" },
      [FRUTA, PAN, HUEVO],
    ),
    sentenceMcq({
      id: "es-m10-4-q-naranjas",
      prompt: "'I like oranges' — pick it.",
      correctText: "Me gustan las naranjas.",
      distractorsText: ["Me gusta las naranjas.", "Me gustan la naranja.", "Me gusto las naranjas."],
      explanation: "More than one thing is liked, so the verb takes its plural form.",
      exercisedAtomSurfaces: ["naranja"],
    }),
    vocab("es-m10-4-p-huevo", "egg", "el huevo", undefined, { atomId: "es:huevo", emoji: "🥚" }),
    cloze(
      "es-m10-4-cloze-gustan",
      "me",
      "los huevos",
      "gustan",
      ["gustan", "gusta", "gusto", "gustas"],
      "I like eggs",
      "me gustan los huevos",
      "The liked things are plural, so the verb counts them.",
    ),
    vocabMcq(
      "es-m10-4-mcq-huevo",
      { surface: "huevo", meaningEn: "egg", emoji: "🥚" },
      [MANZANA, PAN, FRUTA],
    ),
    sentenceMcq({
      id: "es-m10-4-q-fruta",
      prompt: "'I like fruit' — pick it.",
      correctText: "Me gusta la fruta.",
      distractorsText: ["Me gustan la fruta.", "Me gusta las frutas.", "Te gustan la fruta."],
      exercisedAtomSurfaces: ["fruta"],
    }),
  ],
};

// ─── es-m10-5 — Quiero: hungry and thirsty ──────────────────────────────────

const M10_5: LessonContent = {
  id: "es-m10-5",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¡Tengo hambre! — quiero",
  description: "Hunger, thirst, and asking for what you want.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m10-5-info-quiero",
      "quiero — from liking to wanting",
      "querer means 'to want', and its yo form is quiero: Quiero pan (I want bread), Quiero comer (I want to eat) — a noun or an infinitive both work. When appetite is the reason, Spanish 'has' it: tengo hambre (I'm hungry), tengo sed (I'm thirsty) — built on tener from M5.",
      "grammar",
    ),
    phrase("es-m10-5-p-hambre", "I'm hungry", "tengo hambre"),
    phrase("es-m10-5-p-sed", "I'm thirsty", "tengo sed"),
    sentenceMcq({
      id: "es-m10-5-q-hambre",
      prompt: "Your stomach is growling. What do you say?",
      correctText: "Tengo hambre.",
      distractorsText: ["Tengo sed.", "Tengo ocho años.", "Está rico."],
      exercisedAtomSurfaces: ["tengo hambre"],
    }),
    sentenceMcq({
      id: "es-m10-5-q-sed",
      prompt: "You need a glass of water. What do you say?",
      correctText: "Tengo sed.",
      distractorsText: ["Tengo hambre.", "Me gusta el agua.", "Quiero pan."],
      exercisedAtomSurfaces: ["tengo sed"],
    }),
    vocab("es-m10-5-p-carne", "meat", "la carne", undefined, { atomId: "es:carne", emoji: "🥩" }),
    vocab("es-m10-5-p-pescado", "fish (food)", "el pescado", undefined, { atomId: "es:pescado", emoji: "🐟" }),
    build(
      "es-m10-5-build-carne",
      "Build: 'I want to eat meat.'",
      "Quiero comer carne",
      ["Quiero", "comer", "carne", "pescado"],
      ["Quiero", "comer", "carne"],
      ["quiero", "carne"],
    ),
    translateStep({
      id: "es-m10-5-tr-pescado",
      promptEn: "I want fish",
      acceptedAnswers: ["quiero pescado", "Quiero pescado", "Quiero pescado.", "quiero el pescado", "Quiero el pescado", "Quiero el pescado."],
      audioText: "quiero pescado",
      exercisedAtomSurfaces: ["quiero", "pescado"],
    }),
  ],
};

// ─── es-m10-6 — Listening focus: meals of the day ───────────────────────────

const M10_6: LessonContent = {
  id: "es-m10-6",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — meals of the day",
  description: "Soup, salad, rice — and the three meals, by ear.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    vocab("es-m10-6-p-sopa", "soup", "la sopa", undefined, { atomId: "es:sopa", emoji: "🍜" }),
    vocab("es-m10-6-p-ensalada", "salad", "la ensalada", undefined, { atomId: "es:ensalada", emoji: "🥬" }),
    listeningCompSentence({
      id: "es-m10-6-lc-sopa",
      audioText: "Me gusta la sopa",
      correctMeaningEn: "I like soup",
      distractorsEn: ["I like salad", "I want soup", "I don't like soup"],
      exercisedAtomSurfaces: ["sopa", "me gusta"],
    }),
    listeningBuildSentence({
      id: "es-m10-6-lb-ensalada",
      target: "Quiero una ensalada",
      tiles: ["Quiero", "una", "ensalada", "sopa"],
      correctOrder: ["Quiero", "una", "ensalada"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["quiero", "ensalada"],
    }),
    vocab("es-m10-6-p-arroz", "rice", "el arroz", undefined, { atomId: "es:arroz", emoji: "🍚" }),
    infoStep(
      "es-m10-6-info-comidas",
      "The three meals",
      "el desayuno — breakfast · el almuerzo — lunch · la cena — dinner. Three meals, three nouns you'll hear whenever food comes up.",
    ),
    listeningCompSentence({
      id: "es-m10-6-lc-arroz",
      audioText: "Me gusta el arroz con pollo",
      correctMeaningEn: "I like rice with chicken",
      distractorsEn: ["I like chicken soup", "I want rice with chicken", "I like bread with cheese"],
      exercisedAtomSurfaces: ["arroz", "pollo"],
    }),
    vocabMcq(
      "es-m10-6-mcq-desayuno",
      { surface: "desayuno", meaningEn: "breakfast", emoji: "🍳" },
      [ALMUERZO, CENA, CAFE],
    ),
    vocabMcq(
      "es-m10-6-mcq-cena",
      { surface: "cena", meaningEn: "dinner", emoji: "🍽️" },
      [DESAYUNO, ALMUERZO, SOPA],
    ),
  ],
};

// ─── es-m10-7 — Integration: at the restaurant ──────────────────────────────

const M10_7: LessonContent = {
  id: "es-m10-7",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En el restaurante — ordering",
  description: "Order politely, praise the food, and get the check.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m10-7-info-dialogo",
      "At the table",
      "—¡Buenas tardes!\n—Buenas tardes. Quisiera pollo con arroz, por favor.\n—¿Y para beber? (and to drink?)\n—Un jugo, por favor. … ¡Está muy rico!\n—Gracias.\n—La cuenta, por favor.\nQuisiera is the gentle 'I would like' — softer than quiero. Para mí means 'for me' when a table orders together.",
      "default",
    ),
    phrase("es-m10-7-p-quisiera", "I would like", "quisiera"),
    phrase(
      "es-m10-7-p-lacuenta",
      "the check",
      "la cuenta",
      "Servers in Latin America won't rush you — the long after-meal chat (la sobremesa) is the point. Ask for the check when you're ready.",
    ),
    sentenceMcq({
      id: "es-m10-7-q-quisiera",
      prompt: "Order politely: 'I would like chicken, please.'",
      correctText: "Quisiera pollo, por favor.",
      distractorsText: ["Me gusta el pollo, por favor.", "Le gusta pollo, por favor.", "Tengo pollo, por favor."],
      exercisedAtomSurfaces: ["quisiera", "pollo"],
    }),
    sentenceMcq({
      id: "es-m10-7-q-lacuenta",
      prompt: "The meal is over. Ask for the check.",
      correctText: "La cuenta, por favor.",
      distractorsText: ["El desayuno, por favor.", "La mesa, por favor.", "Tengo sed, por favor."],
      exercisedAtomSurfaces: ["la cuenta"],
    }),
    vocab("es-m10-7-p-rico", "delicious", "rico", undefined, { emoji: "😋" }),
    build(
      "es-m10-7-build-lacuenta",
      "Build: 'I would like the check.'",
      "Quisiera la cuenta",
      ["Quisiera", "la", "cuenta", "el", "pan"],
      ["Quisiera", "la", "cuenta"],
      ["quisiera", "la cuenta"],
    ),
    sentenceMcq({
      id: "es-m10-7-q-rico",
      prompt: "The chicken is delicious. Say so!",
      correctText: "¡El pollo está muy rico!",
      distractorsText: ["¡El pollo está muy malo!", "¿Te gusta el pollo?", "¡Tengo hambre!"],
      exercisedAtomSurfaces: ["rico", "pollo"],
    }),
    speaking(
      "es-m10-7-speak-quisiera",
      "Quisiera un café, por favor.",
      "I would like a coffee, please.",
      ["quisiera", "café"],
    ),
  ],
};

// ─── es-m10-8 — Mastery test ────────────────────────────────────────────────

const M10_8: LessonContent = {
  id: "es-m10-8",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M10 Mastery Test",
  description: "Gustar in all its forms, food and drink, quiero & quisiera.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m10-8-q-gustar",
      prompt: "Which infinitive means 'to be pleasing (to like)'?",
      correctText: "gustar",
      distractorsText: ["querer", "comer", "tener"],
      exercisedAtomSurfaces: ["gustar"],
    }),
    cloze(
      "es-m10-8-cloze-gustan",
      "me",
      "las manzanas",
      "gustan",
      ["gustan", "gusta", "gusto", "gustas"],
      "I like apples",
      "me gustan las manzanas",
    ),
    vocabMcq(
      "es-m10-8-mcq-almuerzo",
      { surface: "almuerzo", meaningEn: "lunch", emoji: "🍱" },
      [DESAYUNO, CENA, SOPA],
    ),
    listeningCompSentence({
      id: "es-m10-8-lc-leche",
      audioText: "¿Te gusta la leche?",
      correctMeaningEn: "Do you like milk?",
      distractorsEn: ["Do you like juice?", "Do you want milk?", "Does she like milk?"],
      exercisedAtomSurfaces: ["te gusta", "leche"],
    }),
    translateStep({
      id: "es-m10-8-tr-cafe",
      promptEn: "I like coffee",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: ["me gusta el café", "Me gusta el café", "Me gusta el café.", "me gusta el cafe", "Me gusta el cafe", "Me gusta el cafe."],
      audioText: "me gusta el café",
      exercisedAtomSurfaces: ["me gusta", "café"],
    }),
    sentenceMcq({
      id: "es-m10-8-q-querer",
      prompt: "Which infinitive means 'to want'?",
      correctText: "querer",
      distractorsText: ["gustar", "beber", "vivir"],
      exercisedAtomSurfaces: ["querer"],
    }),
    listeningBuildSentence({
      id: "es-m10-8-lb-quisiera",
      target: "Quisiera pan y queso",
      tiles: ["Quisiera", "pan", "y", "queso", "sopa"],
      correctOrder: ["Quisiera", "pan", "y", "queso"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["quisiera", "pan", "queso"],
    }),
    sentenceMcq({
      id: "es-m10-8-q-pescado",
      prompt: "'He likes fish' — pick it.",
      correctText: "A él le gusta el pescado.",
      distractorsText: ["A él le gustan el pescado.", "A él me gusta el pescado.", "Él gusta el pescado."],
      exercisedAtomSurfaces: ["le gusta", "pescado"],
    }),
    speaking(
      "es-m10-8-speak-hambre",
      "Tengo hambre y quiero sopa.",
      "I'm hungry and I want soup.",
      ["tengo hambre", "quiero", "sopa"],
    ),
  ],
};

export const ES_M10_LESSONS: LessonContent[] = [
  M10_1,
  M10_2,
  M10_3,
  M10_4,
  M10_5,
  M10_6,
  M10_7,
  M10_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M10_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m10",
      moduleId: "m10",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m10",
          prompt: "'I like coffee' — pick it.",
          correctText: "Me gusta el café.",
          distractorsText: ["Me gustan el café.", "Yo gusto el café.", "Me gusta la café."],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m10-1",
      moduleId: "m10",
      build: () =>
        sentenceMcq({
          id: "pt-es-m10-1",
          prompt: "'I like apples' — pick it.",
          correctText: "Me gustan las manzanas.",
          distractorsText: ["Me gusta las manzanas.", "Me gustan la manzana.", "Me gusto las manzanas."],
        }),
    },
    {
      id: "pt-es-m10-2",
      moduleId: "m10",
      build: () =>
        cloze(
          "pt-es-m10-2",
          "a ella",
          "gusta el pollo",
          "le",
          ["le", "me", "te", "se"],
          "she likes chicken",
          "a ella le gusta el pollo",
        ),
    },
    {
      id: "pt-es-m10-3",
      moduleId: "m10",
      build: () =>
        sentenceMcq({
          id: "pt-es-m10-3",
          prompt: "Order politely: 'I would like a coffee.'",
          correctText: "Quisiera un café, por favor.",
          distractorsText: ["Me gusta un café, por favor.", "Tengo un café, por favor.", "Le gusta un café, por favor."],
        }),
    },
    {
      id: "pt-es-m10-4",
      moduleId: "m10",
      build: () =>
        sentenceMcq({
          id: "pt-es-m10-4",
          prompt: "Your stomach is growling. What do you say?",
          correctText: "Tengo hambre.",
          distractorsText: ["Tengo sed.", "Está rico.", "Quiero la cuenta."],
        }),
    },
  ],
};
