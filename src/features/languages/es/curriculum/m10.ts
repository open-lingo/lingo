/**
 * Spanish Module 10 — Comida y gustos (gustar, food, ordering).
 *
 * The learner arrives with both regular present paradigms (M8–M9) and a
 * food-free vocabulary. M10's job: the flipped mechanics of gustar
 * (me/te/le gusta + singular, gustan + plural, gusta + infinitive), querer
 * for plain requests, the polite quisiera for ordering, and a pantry of
 * food and drink to like, want, and order.
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
 * 2026-07-16 JA-parity rewrite: every topic lesson now lands ≥2 production
 * steps (≥1 typed translate), a review tail from L2 on (reviewMatchPairs +
 * prior-module retrieval), and selfExplain beats on the mechanics learners
 * actually mis-model (gusta/gustan agreement, le vs a + name, quiero's
 * stem change, quisiera as softener). "Para mí" — taught but never used in
 * the old file — now gets five separate exposures in L7. The gustar
 * TEACHING substance (flipped verb, agrees with the thing) is preserved
 * verbatim from the prior version; only density/variety/production changed.
 *
 * All listening here is sentence-level (M5+ ratchet). Nouns are taught
 * WITH their article on the card (el pan, la leche) while atom surfaces
 * stay bare (pan, leche) per the spine's gender rule.
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
const POLLO = { surface: "pollo", emoji: "🍗" };
const CARNE = { surface: "carne", emoji: "🥩" };
const PESCADO = { surface: "pescado", emoji: "🐟" };
const ARROZ = { surface: "arroz", emoji: "🍚" };
const ENSALADA = { surface: "ensalada", emoji: "🥬" };

// Deterministic accepted-answer variants for a single reviewed Spanish word
// (bare, capitalized, each with a trailing period) — the safe universal
// shape for a "translate this old word" review-production step, since it
// never depends on the reviewed word's part of speech.
function reviewWordAnswers(surface: string): string[] {
  const cap = surface.charAt(0).toUpperCase() + surface.slice(1);
  return [surface, cap, `${surface}.`, `${cap}.`];
}
function glossOf(surface: string): string {
  return findEsAtomBySurface(surface)?.gloss ?? surface;
}

// ─── es-m10-1 — Me gusta, the flipped verb ──────────────────────────────────

const M10_1: LessonContent = {
  id: "es-m10-1",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Me gusta — the flipped verb",
  description: "Spanish says 'coffee pleases me'. Learn the flip with café and té.",
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m10-1-info-gustar",
      "The flipped verb: gustar",
      "To say you like something, Spanish flips the sentence. Me gusta el café is literally 'coffee is pleasing to me' — the liked thing is the subject, so gustar agrees with IT, not with you. For now the recipe is: me gusta + el/la + one thing. To dislike, put no in front: No me gusta el café.",
      "grammar",
    ),
    phrase("es-m10-1-p-megusta", "I like", "me gusta"),
    vocabMcq("es-m10-1-mcq-cafe", { surface: "café", meaningEn: "coffee", emoji: "☕" }, [TE, JUGO, CERVEZA]),
    sentenceMcq({
      id: "es-m10-1-q-megusta",
      prompt: "How do you say 'I like coffee'?",
      correctText: "Me gusta el café.",
      distractorsText: ["Me gustan el café.", "Yo gusto el café.", "Quiero el café."],
      explanation: "One thing liked, so gustar stays singular — and the liker shows up as a little pronoun in front.",
      exercisedAtomSurfaces: ["me gusta", "café"],
    }),
    speaking("es-m10-1-speak-cafe", "Me gusta el café.", "I like coffee.", ["me gusta", "café"]),
    listeningCompSentence({
      id: "es-m10-1-lc-cafe",
      audioText: "Me gusta el café",
      correctMeaningEn: "I like coffee",
      distractorsEn: ["I want coffee", "I like tea", "I don't like coffee"],
      exercisedAtomSurfaces: ["café", "me gusta"],
    }),
    vocabMcq("es-m10-1-mcq-te", { surface: "té", meaningEn: "tea", emoji: "🍵" }, [CAFE, JUGO, LECHE]),
    build(
      "es-m10-1-build-note",
      "Build: 'I don't like tea.'",
      "No me gusta el té",
      ["No", "me", "gusta", "el", "té", "gustan"],
      ["No", "me", "gusta", "el", "té"],
      ["me gusta", "té"],
    ),
    cloze(
      "es-m10-1-cloze-no",
      "no me",
      "el té",
      "gusta",
      ["gusta", "gustan", "gusto", "gustas"],
      "I don't like tea",
      "no me gusta el té",
      "Tea is one thing, so the verb keeps its singular form after the no.",
      ["té"],
    ),
    sentenceMcq({
      id: "es-m10-1-q-te",
      prompt: "How do you say 'I like tea'?",
      correctText: "Me gusta el té.",
      distractorsText: ["Me gusta el café.", "Te gusta el té.", "No me gusta el té."],
      exercisedAtomSurfaces: ["té", "me gusta"],
    }),
    translateStep({
      id: "es-m10-1-tr-te",
      promptEn: "I like tea",
      acceptedAnswers: ["me gusta el té", "Me gusta el té", "Me gusta el té.", "me gusta el te", "Me gusta el te", "Me gusta el te."],
      audioText: "me gusta el té",
      exercisedAtomSurfaces: ["me gusta", "té"],
    }),
    sentenceMcq({
      id: "es-m10-1-q-gustar-inf",
      prompt: "Which infinitive means 'to be pleasing (to like)'?",
      correctText: "gustar",
      distractorsText: ["querer", "comer", "tener"],
      exercisedAtomSurfaces: ["gustar"],
    }),
    listeningCompSentence({
      id: "es-m10-1-lc-no-cafe",
      audioText: "No me gusta el café",
      correctMeaningEn: "I don't like coffee",
      distractorsEn: ["I like coffee", "I don't like tea", "I want coffee"],
      exercisedAtomSurfaces: ["café", "me gusta"],
    }),
    speaking("es-m10-1-speak-no-te", "No me gusta el té.", "I don't like tea.", ["me gusta", "té"]),
    build(
      "es-m10-1-build-contrast",
      "Build: 'I like tea, not coffee.'",
      "Me gusta el té, no el café",
      ["Me", "gusta", "el", "té", "no", "el", "café", "gustan"],
      ["Me", "gusta", "el", "té", "no", "el", "café"],
      ["me gusta", "té", "café"],
    ),
    sentenceMcq({
      id: "es-m10-1-q-comp",
      prompt: "¿Qué significa 'No me gusta el café, pero me gusta el té'?",
      correctText: "I don't like coffee, but I like tea.",
      distractorsText: ["I like coffee, but not tea.", "I don't like tea or coffee.", "I want coffee and tea."],
      exercisedAtomSurfaces: ["café", "té", "me gusta"],
    }),
    selfExplain({
      id: "es-m10-1-self-explain",
      anchorLabel: "You wrote: Me gusta el té, no el café.",
      anchorAudioText: "Me gusta el té, no el café",
      question: "Why does the sentence start with me, not yo?",
      rule: {
        text: "Spanish flips the sentence — the liked thing (café/té) is the grammatical subject, so 'I' shows up as me, the pronoun the verb acts ON, not the subject yo.",
      },
      surface: { text: "me is just a more casual way of saying yo." },
      distractor: { text: "gustar works like a normal verb, so gusto means 'I like'." },
      ruleExplanation:
        "gustar agrees with the thing liked, not with the person — the person is always the indirect object (me/te/le…), never the subject.",
    }),
    infoStep(
      "es-m10-1-info-win",
      "You can say what you like",
      "Café or té — you can now say what you like and don't like, and ask no one's permission to have an opinion about it.",
      "win",
    ),
  ],
};

// ─── es-m10-2 — ¿Te gusta? and drinks ───────────────────────────────────────

const M10_2_REV = "es-m10-2-rev";
const M10_2_REVIEW = pickReviewSurfaces(M10_2_REV, "m10", 6);

const M10_2: LessonContent = {
  id: "es-m10-2",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Te gusta? — drinks",
  description: "Ask what people like — over jugo, leche, and cerveza.",
  estimatedMinutes: 9,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m10-2-info-tegusta",
      "Asking with te gusta",
      "Flip me to te and let your voice rise: ¿Te gusta el café? — do you like coffee? Answer with Sí, me gusta or, politely doubled, No, no me gusta. The first no answers, the second one negates.",
      "grammar",
    ),
    vocabMcq("es-m10-2-mcq-jugo", { surface: "jugo", meaningEn: "juice", emoji: "🧃" }, [CAFE, TE, CERVEZA]),
    sentenceMcq({
      id: "es-m10-2-q-tegusta",
      prompt: "Ask your friend: 'Do you like coffee?'",
      correctText: "¿Te gusta el café?",
      distractorsText: ["¿Me gusta el café?", "¿Le gusta el café?", "¿Te gustan el café?"],
      exercisedAtomSurfaces: ["te gusta", "café"],
    }),
    build(
      "es-m10-2-build-jugo",
      "Build: 'Do you like juice?'",
      "¿Te gusta el jugo?",
      ["¿Te", "gusta", "el", "jugo?", "gustan"],
      ["¿Te", "gusta", "el", "jugo?"],
      ["te gusta", "jugo"],
    ),
    listeningCompSentence({
      id: "es-m10-2-lc-jugo",
      audioText: "¿Te gusta el jugo?",
      correctMeaningEn: "Do you like juice?",
      distractorsEn: ["Do you want juice?", "Do you like milk?", "Is there juice?"],
      exercisedAtomSurfaces: ["jugo", "te gusta"],
    }),
    vocabMcq("es-m10-2-mcq-leche", { surface: "leche", meaningEn: "milk", emoji: "🥛" }, [JUGO, CAFE, CERVEZA]),
    speaking("es-m10-2-speak-leche", "¿Te gusta la leche?", "Do you like milk?", ["te gusta", "leche"]),
    vocabMcq("es-m10-2-mcq-cerveza", { surface: "cerveza", meaningEn: "beer", emoji: "🍺" }, [LECHE, TE, JUGO]),
    sentenceMcq({
      id: "es-m10-2-q-cerveza",
      prompt: "Ask: 'Do you like beer?'",
      correctText: "¿Te gusta la cerveza?",
      distractorsText: ["¿Te gustan la cerveza?", "¿Me gusta la cerveza?", "¿Le gusta la cerveza?"],
      exercisedAtomSurfaces: ["te gusta", "cerveza"],
    }),
    translateStep({
      id: "es-m10-2-tr-leche",
      promptEn: "Do you like milk?",
      acceptedAnswers: ["¿te gusta la leche?", "¿Te gusta la leche?", "te gusta la leche?", "Te gusta la leche?"],
      audioText: "¿te gusta la leche?",
      exercisedAtomSurfaces: ["te gusta", "leche"],
    }),
    cloze(
      "es-m10-2-cloze-si",
      "—¿Te gusta el café? —Sí, ",
      " gusta.",
      "me",
      ["me", "te", "le", "se"],
      "Yes, I like it.",
      "Sí, me gusta.",
      "Answering about yourself, so flip back to me.",
      ["café"],
    ),
    sentenceMcq({
      id: "es-m10-2-q-no-cerveza",
      prompt: "Answer: 'No, I don't like beer.'",
      correctText: "No, no me gusta la cerveza.",
      distractorsText: ["No, no te gusta la cerveza.", "Sí, me gusta la cerveza.", "No, no me gustan la cerveza."],
      exercisedAtomSurfaces: ["me gusta", "cerveza"],
    }),
    speaking("es-m10-2-speak-no-cerveza", "No, no me gusta la cerveza.", "No, I don't like beer.", ["me gusta", "cerveza"]),
    listeningCompSentence({
      id: "es-m10-2-lc-te",
      audioText: "¿Te gusta el té?",
      correctMeaningEn: "Do you like tea?",
      distractorsEn: ["Do you like coffee?", "Does he like tea?", "Do you want tea?"],
      exercisedAtomSurfaces: ["té", "te gusta"],
    }),
    selfExplain({
      id: "es-m10-2-self-explain",
      anchorLabel: "You answered: 'No, no me gusta la cerveza.'",
      anchorAudioText: "No, no me gusta la cerveza",
      question: "Why does no appear twice?",
      rule: {
        text: "The first no answers the question ('No'); the second no negates the verb ('I don't like it') — Spanish needs both.",
      },
      surface: { text: "Repeating no just makes the answer more emphatic, like saying it twice for effect." },
      distractor: { text: "The second no agrees with cerveza because it's feminine." },
      ruleExplanation:
        "Spanish double negation: one no answers, the second negates the verb — dropping either changes or breaks the meaning.",
    }),
    build(
      "es-m10-2-build-si-jugo",
      "Build: 'Yes, I like juice.'",
      "Sí, me gusta el jugo",
      ["Sí,", "me", "gusta", "el", "jugo", "gustan"],
      ["Sí,", "me", "gusta", "el", "jugo"],
      ["me gusta", "jugo"],
    ),
    reviewMatchPairs(M10_2_REV, M10_2_REV, "m10", 6),
    translateStep({
      id: `${M10_2_REV}-tr`,
      promptEn: glossOf(M10_2_REVIEW[0]),
      acceptedAnswers: reviewWordAnswers(M10_2_REVIEW[0]),
      audioText: M10_2_REVIEW[0],
      exercisedAtomSurfaces: [M10_2_REVIEW[0]],
    }),
    vocabTextMcq(`${M10_2_REV}-tmcq`, M10_2_REVIEW[1], [M10_2_REVIEW[2], M10_2_REVIEW[3], M10_2_REVIEW[4]]),
    infoStep(
      "es-m10-2-info-win",
      "You can ask what others like",
      "Coffee, tea, juice, milk, beer — you can now ask anyone what they like, and answer honestly either way.",
      "win",
    ),
  ],
};

// ─── es-m10-3 — Le gusta ────────────────────────────────────────────────────

const M10_3_REV = "es-m10-3-rev";
const M10_3_REVIEW = pickReviewSurfaces(M10_3_REV, "m10", 6);

const M10_3: LessonContent = {
  id: "es-m10-3",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Le gusta — pan, queso, pollo",
  description: "Say what he or she likes, and stock up on food basics.",
  estimatedMinutes: 9,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m10-3-info-legusta",
      "le gusta — likes at a distance",
      "For él, ella, or usted, the pronoun is le: le gusta el pan. Since le could be anyone, Spanish often names the person up front with a: A Ana le gusta el pan — 'to Ana, bread is pleasing'.",
      "grammar",
    ),
    phrase("es-m10-3-p-legusta", "he/she likes", "le gusta"),
    vocabMcq("es-m10-3-mcq-pan", { surface: "pan", meaningEn: "bread", emoji: "🍞" }, [HUEVO, SOPA, FRUTA]),
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
      ["A", "ella", "le", "gusta", "el", "pan", "gustan"],
      ["A", "ella", "le", "gusta", "el", "pan"],
      ["le gusta", "pan"],
    ),
    vocabMcq("es-m10-3-mcq-pollo", { surface: "pollo", meaningEn: "chicken", emoji: "🍗" }, [PAN, CARNE, PESCADO]),
    sentenceMcq({
      id: "es-m10-3-q-pollo",
      prompt: "'He likes chicken' — pick it.",
      correctText: "A él le gusta el pollo.",
      distractorsText: ["A él le gustan el pollo.", "A él me gusta el pollo.", "Él gusta el pollo."],
      exercisedAtomSurfaces: ["le gusta", "pollo"],
    }),
    speaking("es-m10-3-speak-pollo", "A él le gusta el pollo.", "He likes chicken.", ["le gusta", "pollo"]),
    listeningCompSentence({
      id: "es-m10-3-lc-pollo",
      audioText: "A él le gusta el pollo",
      correctMeaningEn: "He likes chicken",
      distractorsEn: ["She likes chicken", "He likes cheese", "He wants bread"],
      exercisedAtomSurfaces: ["pollo", "le gusta"],
    }),
    vocabTextMcq("es-m10-3-tmcq-queso", "queso", ["pan", "pollo", "leche"]),
    translateStep({
      id: "es-m10-3-tr-queso",
      promptEn: "I like cheese",
      acceptedAnswers: ["me gusta el queso", "Me gusta el queso", "Me gusta el queso."],
      audioText: "me gusta el queso",
      exercisedAtomSurfaces: ["me gusta", "queso"],
    }),
    sentenceMcq({
      id: "es-m10-3-q-queso",
      prompt: "'I like cheese' — pick it.",
      correctText: "Me gusta el queso.",
      distractorsText: ["Me gusta el pollo.", "Te gusta el queso.", "Le gusta la leche."],
      exercisedAtomSurfaces: ["queso", "me gusta"],
    }),
    cloze(
      "es-m10-3-cloze-aana",
      "A Ana le ",
      " el pan",
      "gusta",
      ["gusta", "gustan", "gusto", "gustas"],
      "Ana likes bread",
      "A Ana le gusta el pan",
      "Ana is the named 'liker'; the thing liked (bread) is one item, so gusta stays singular.",
      ["le gusta", "pan"],
    ),
    build(
      "es-m10-3-build-aana",
      "Build: 'Ana likes chicken.'",
      "A Ana le gusta el pollo",
      ["A", "Ana", "le", "gusta", "el", "pollo", "gustan"],
      ["A", "Ana", "le", "gusta", "el", "pollo"],
      ["le gusta", "pollo"],
    ),
    selfExplain({
      id: "es-m10-3-self-explain",
      anchorLabel: "You wrote: A Ana le gusta el pan.",
      anchorAudioText: "A Ana le gusta el pan",
      question: "Why does the sentence add A Ana if le already means 'to her'?",
      rule: {
        text: "le is ambiguous — it can mean to him, to her, or to you (formal) — so Spanish often names the person with a + name to clarify who le refers to.",
      },
      surface: { text: "A Ana makes the sentence more formal and polite." },
      distractor: { text: "A Ana replaces le entirely once you name the person." },
      ruleExplanation:
        "A + name/pronoun CLARIFIES le, it doesn't replace it — both A Ana and le gusta stay in the sentence together.",
    }),
    speaking("es-m10-3-speak-aana", "A Ana le gusta el pollo.", "Ana likes chicken.", ["le gusta", "pollo"]),
    reviewMatchPairs(M10_3_REV, M10_3_REV, "m10", 6),
    translateStep({
      id: `${M10_3_REV}-tr`,
      promptEn: glossOf(M10_3_REVIEW[0]),
      acceptedAnswers: reviewWordAnswers(M10_3_REVIEW[0]),
      audioText: M10_3_REVIEW[0],
      exercisedAtomSurfaces: [M10_3_REVIEW[0]],
    }),
    vocabTextMcq(`${M10_3_REV}-tmcq`, M10_3_REVIEW[1], [M10_3_REVIEW[2], M10_3_REVIEW[3], M10_3_REVIEW[4]]),
    infoStep(
      "es-m10-3-info-win",
      "You can talk about what others like",
      "You can now say what she likes, what he likes, and clear up exactly who you mean with a + name.",
      "win",
    ),
  ],
};

// ─── es-m10-4 — Gusta vs gustan ─────────────────────────────────────────────

const M10_4_REV = "es-m10-4-rev";
const M10_4_REVIEW = pickReviewSurfaces(M10_4_REV, "m10", 6);

const M10_4: LessonContent = {
  id: "es-m10-4",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Gusta o gustan? — fruit & eggs",
  description: "One thing or many? Match gustar to what's liked — then produce it yourself.",
  estimatedMinutes: 10,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m10-4-info-gustan",
      "gusta vs gustan",
      "Because the liked thing is the subject, gustar counts IT: one thing → gusta (me gusta la manzana), more than one → gustan (me gustan las manzanas). Liking an activity counts as one thing, so an infinitive takes gusta: me gusta comer.",
      "grammar",
    ),
    vocabMcq("es-m10-4-mcq-manzana", { surface: "manzana", meaningEn: "apple", emoji: "🍎" }, [FRUTA, PAN, HUEVO]),
    build(
      "es-m10-4-build-manzanas",
      "Build: 'I like apples.'",
      "Me gustan las manzanas",
      ["Me", "gustan", "las", "manzanas", "gusta"],
      ["Me", "gustan", "las", "manzanas"],
      ["manzana"],
    ),
    sentenceMcq({
      id: "es-m10-4-q-naranjas",
      prompt: "'I like oranges' — pick it.",
      correctText: "Me gustan las naranjas.",
      distractorsText: ["Me gusta las naranjas.", "Me gustan la naranja.", "Me gusto las naranjas."],
      explanation: "More than one thing is liked, so the verb takes its plural form.",
      exercisedAtomSurfaces: ["naranja"],
    }),
    listeningCompSentence({
      id: "es-m10-4-lc-naranjas",
      audioText: "Me gustan las naranjas",
      correctMeaningEn: "I like oranges",
      distractorsEn: ["I like the orange", "I want oranges", "I don't like oranges"],
      exercisedAtomSurfaces: ["naranja"],
    }),
    translateStep({
      id: "es-m10-4-tr-manzanas",
      promptEn: "I like apples",
      acceptedAnswers: ["me gustan las manzanas", "Me gustan las manzanas", "Me gustan las manzanas."],
      audioText: "me gustan las manzanas",
      exercisedAtomSurfaces: ["manzana"],
    }),
    vocabMcq("es-m10-4-mcq-huevo", { surface: "huevo", meaningEn: "egg", emoji: "🥚" }, [MANZANA, PAN, FRUTA]),
    vocabTextMcq("es-m10-4-tmcq-naranja", "naranja", ["manzana", "fruta", "huevo"]),
    build(
      "es-m10-4-build-huevos",
      "Build: 'I like eggs.'",
      "Me gustan los huevos",
      ["Me", "gustan", "los", "huevos", "gusta"],
      ["Me", "gustan", "los", "huevos"],
      ["huevo"],
    ),
    cloze(
      "es-m10-4-cloze-gustan",
      "me",
      "los huevos",
      "gustan",
      ["gustan", "gusta", "gusto", "gustas"],
      "I like eggs",
      "me gustan los huevos",
      "The liked things are plural, so the verb counts them.",
      ["huevo"],
    ),
    sentenceMcq({
      id: "es-m10-4-q-fruta",
      prompt: "'I like fruit' — pick it.",
      correctText: "Me gusta la fruta.",
      distractorsText: ["Me gustan la fruta.", "Me gusta las frutas.", "Te gustan la fruta."],
      exercisedAtomSurfaces: ["fruta"],
    }),
    speaking("es-m10-4-speak-fruta", "Me gusta la fruta.", "I like fruit.", ["fruta"]),
    agreementCloze(
      "es-m10-4-ac-naranjas",
      [
        { text: "Me " },
        { blank: { id: "b1", correctAnswer: "gustan", options: ["gusta", "gustan", "gusto", "gustas"] } },
        { text: " " },
        { blank: { id: "b2", correctAnswer: "las", options: ["el", "la", "los", "las"] } },
        { text: " naranjas" },
      ],
      "I like oranges",
      "Me gustan las naranjas",
      ["naranja"],
    ),
    sentenceMcq({
      id: "es-m10-4-q-comp",
      prompt: "¿Qué significa 'A mis padres les gustan las manzanas'?",
      correctText: "My parents like apples.",
      distractorsText: ["My parents like the apple.", "I like my parents' apples.", "My parents want apples."],
      exercisedAtomSurfaces: ["le gusta", "manzana"],
    }),
    speaking("es-m10-4-speak-huevos-neg", "No me gustan los huevos.", "I don't like eggs.", ["huevo"]),
    listeningCompSentence({
      id: "es-m10-4-lc-huevos",
      audioText: "No me gustan los huevos",
      correctMeaningEn: "I don't like eggs",
      distractorsEn: ["I like eggs", "I don't like fruit", "I don't want eggs"],
      exercisedAtomSurfaces: ["huevo"],
    }),
    selfExplain({
      id: "es-m10-4-self-explain",
      anchorLabel: "You wrote: Me gustan las manzanas / Me gusta la fruta.",
      anchorAudioText: "Me gustan las manzanas",
      question: "Why gustan with manzanas but gusta with fruta?",
      rule: {
        text: "gustar agrees with the THING liked, not with you: one thing → gusta, more than one → gustan. Manzanas is plural, fruta is singular.",
      },
      surface: { text: "gustan is just the 'more polite' plural form, used whenever you're being formal." },
      distractor: { text: "gustar works like a normal verb — gusto means 'I like', so it should agree with the person, not the thing." },
      ruleExplanation:
        "The liked thing is gustar's grammatical subject. It — not the person — decides gusta vs gustan. The person is always the indirect object (me/te/le…), never gusto.",
    }),
    build(
      "es-m10-4-build-close",
      "Build: 'My parents like apples.'",
      "A mis padres les gustan las manzanas",
      ["A", "mis", "padres", "les", "gustan", "las", "manzanas", "gusta"],
      ["A", "mis", "padres", "les", "gustan", "las", "manzanas"],
      ["manzana"],
    ),
    reviewMatchPairs(M10_4_REV, M10_4_REV, "m10", 6),
    translateStep({
      id: `${M10_4_REV}-tr`,
      promptEn: glossOf(M10_4_REVIEW[0]),
      acceptedAnswers: reviewWordAnswers(M10_4_REVIEW[0]),
      audioText: M10_4_REVIEW[0],
      exercisedAtomSurfaces: [M10_4_REVIEW[0]],
    }),
    vocabTextMcq(`${M10_4_REV}-tmcq`, M10_4_REVIEW[1], [M10_4_REVIEW[2], M10_4_REVIEW[3], M10_4_REVIEW[4]]),
    infoStep(
      "es-m10-4-info-win",
      "You can count what you like",
      "One apple or a whole bowl of them — you can now match gustar to exactly what's liked, every time.",
      "win",
    ),
  ],
};

// ─── es-m10-5 — Quiero: hungry and thirsty ──────────────────────────────────

const M10_5_REV = "es-m10-5-rev";
const M10_5_REVIEW = pickReviewSurfaces(M10_5_REV, "m10", 6);

const M10_5: LessonContent = {
  id: "es-m10-5",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¡Tengo hambre! — quiero",
  description: "Hunger, thirst, and asking for what you want.",
  estimatedMinutes: 9,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m10-5-info-quiero",
      "quiero — from liking to wanting",
      "querer means 'to want', and its yo form is quiero: Quiero pan (I want bread), Quiero comer (I want to eat) — a noun or an infinitive both work. When appetite is the reason, Spanish 'has' it: tengo hambre (I'm hungry), tengo sed (I'm thirsty) — built on tener from M5.",
      "grammar",
    ),
    sentenceMcq({
      id: "es-m10-5-q-hambre",
      prompt: "Your stomach is growling. What do you say?",
      correctText: "Tengo hambre.",
      distractorsText: ["Tengo sed.", "Tengo ocho años.", "Está rico."],
      exercisedAtomSurfaces: ["tengo hambre"],
    }),
    build(
      "es-m10-5-build-hambre",
      "Build: 'Since I'm hungry, I want bread.'",
      "Como tengo hambre, quiero pan",
      ["Como", "tengo", "hambre,", "quiero", "pan", "sed"],
      ["Como", "tengo", "hambre,", "quiero", "pan"],
      ["tengo hambre", "quiero", "pan"],
    ),
    sentenceMcq({
      id: "es-m10-5-q-sed",
      prompt: "You need a glass of water. What do you say?",
      correctText: "Tengo sed.",
      distractorsText: ["Tengo hambre.", "Me gusta el agua.", "Quiero pan."],
      exercisedAtomSurfaces: ["tengo sed"],
    }),
    vocabMcq("es-m10-5-mcq-carne", { surface: "carne", meaningEn: "meat", emoji: "🥩" }, [POLLO, PESCADO, HUEVO]),
    speaking("es-m10-5-speak-sed", "Quiero agua porque tengo sed.", "I want water because I'm thirsty.", ["tengo sed"]),
    vocabMcq("es-m10-5-mcq-pescado", { surface: "pescado", meaningEn: "fish (food)", emoji: "🐟" }, [CARNE, POLLO, ARROZ]),
    sentenceMcq({
      id: "es-m10-5-q-querer-inf",
      prompt: "Which infinitive means 'to want'?",
      correctText: "querer",
      distractorsText: ["gustar", "beber", "vivir"],
      exercisedAtomSurfaces: ["querer"],
    }),
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
    vocabMcq("es-m10-5-mcq-arroz", { surface: "arroz", meaningEn: "rice", emoji: "🍚" }, [SOPA, PAN, HUEVO]),
    sentenceMcq({
      id: "es-m10-5-q-quiero-carne",
      prompt: "'I want meat, not fish' — pick it.",
      correctText: "Quiero carne, no pescado.",
      distractorsText: ["Quiero pescado, no carne.", "Me gusta la carne, no el pescado.", "Tengo carne, no pescado."],
      exercisedAtomSurfaces: ["quiero", "carne", "pescado"],
    }),
    speaking("es-m10-5-speak-arroz", "Quiero arroz con pollo.", "I want rice with chicken.", ["quiero", "arroz", "pollo"]),
    listeningCompSentence({
      id: "es-m10-5-lc-quiero",
      audioText: "Quiero comer pollo con arroz",
      correctMeaningEn: "I want to eat chicken with rice",
      distractorsEn: ["I like chicken with rice", "I want to eat fish with rice", "I'm hungry for chicken"],
      exercisedAtomSurfaces: ["quiero", "pollo", "arroz"],
    }),
    selfExplain({
      id: "es-m10-5-self-explain",
      anchorLabel: "You wrote: Quiero pescado.",
      anchorAudioText: "Quiero pescado",
      question: "Why is it quiero, not quero?",
      rule: {
        text: "querer is a stem-changing verb: e→ie in the forms where the stress falls on the stem (quiero, quieres, quiere…), but not in nosotros/vosotros (queremos).",
      },
      surface: { text: "quiero just adds an extra i for pronunciation — no real rule behind it." },
      distractor: { text: "querer is irregular only in the yo form, like most -er verbs." },
      ruleExplanation:
        "e→ie stem-changing verbs shift in every form except nosotros/vosotros — querer, poder, and pensar all follow this same pattern.",
    }),
    build(
      "es-m10-5-build-close",
      "Build: 'I'm hungry and I want meat.'",
      "Tengo hambre y quiero carne",
      ["Tengo", "hambre", "y", "quiero", "carne", "sed"],
      ["Tengo", "hambre", "y", "quiero", "carne"],
      ["tengo hambre", "quiero", "carne"],
    ),
    reviewMatchPairs(M10_5_REV, M10_5_REV, "m10", 6),
    translateStep({
      id: `${M10_5_REV}-tr`,
      promptEn: glossOf(M10_5_REVIEW[0]),
      acceptedAnswers: reviewWordAnswers(M10_5_REVIEW[0]),
      audioText: M10_5_REVIEW[0],
      exercisedAtomSurfaces: [M10_5_REVIEW[0]],
    }),
    vocabTextMcq(`${M10_5_REV}-tmcq`, M10_5_REVIEW[1], [M10_5_REVIEW[2], M10_5_REVIEW[3], M10_5_REVIEW[4]]),
    infoStep(
      "es-m10-5-info-win",
      "You can say what you need",
      "Hungry, thirsty, or just craving meat over fish — you can now say what you want and why.",
      "win",
    ),
  ],
};

// ─── es-m10-6 — Listening focus: meals of the day ───────────────────────────

const M10_6_REV = "es-m10-6-rev";
const M10_6_REVIEW = pickReviewSurfaces(M10_6_REV, "m10", 6);

const M10_6: LessonContent = {
  id: "es-m10-6",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — meals of the day",
  description: "Soup, salad, rice — and the three meals, by ear.",
  estimatedMinutes: 9,
  xpReward: 17,
  steps: [
    vocabMcq("es-m10-6-mcq-sopa", { surface: "sopa", meaningEn: "soup", emoji: "🍜" }, [ENSALADA, PAN, HUEVO]),
    listeningCompSentence({
      id: "es-m10-6-lc-sopa",
      audioText: "Me gusta la sopa",
      correctMeaningEn: "I like soup",
      distractorsEn: ["I like salad", "I want soup", "I don't like soup"],
      exercisedAtomSurfaces: ["sopa", "me gusta"],
    }),
    speaking("es-m10-6-speak-sopa", "Quiero sopa.", "I want soup.", ["quiero", "sopa"]),
    vocabMcq("es-m10-6-mcq-ensalada", { surface: "ensalada", meaningEn: "salad", emoji: "🥬" }, [SOPA, FRUTA, PAN]),
    listeningBuildSentence({
      id: "es-m10-6-lb-ensalada",
      target: "Quiero una ensalada",
      tiles: ["Quiero", "una", "ensalada", "sopa"],
      correctOrder: ["Quiero", "una", "ensalada"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["quiero", "ensalada"],
    }),
    translateStep({
      id: "es-m10-6-tr-ensalada",
      promptEn: "I want a salad",
      acceptedAnswers: ["quiero una ensalada", "Quiero una ensalada", "Quiero una ensalada."],
      audioText: "quiero una ensalada",
      exercisedAtomSurfaces: ["quiero", "ensalada"],
    }),
    listeningCompSentence({
      id: "es-m10-6-lc-arroz",
      audioText: "Me gusta el arroz con pollo",
      correctMeaningEn: "I like rice with chicken",
      distractorsEn: ["I like chicken soup", "I want rice with chicken", "I like bread with cheese"],
      exercisedAtomSurfaces: ["arroz", "pollo"],
    }),
    infoStep(
      "es-m10-6-info-comidas",
      "The three meals",
      "el desayuno — breakfast · el almuerzo — lunch · la cena — dinner. Three meals, three nouns you'll hear whenever food comes up.",
    ),
    vocabMcq("es-m10-6-mcq-desayuno", { surface: "desayuno", meaningEn: "breakfast", emoji: "🍳" }, [ALMUERZO, CENA, CAFE]),
    sentenceMcq({
      id: "es-m10-6-q-desayuno",
      prompt: "'I want breakfast' — pick it.",
      correctText: "Quiero el desayuno.",
      distractorsText: ["Quiero el almuerzo.", "Me gusta el desayuno.", "Tengo el desayuno."],
      exercisedAtomSurfaces: ["desayuno", "quiero"],
    }),
    build(
      "es-m10-6-build-almuerzo",
      "Build: 'I want lunch.'",
      "Quiero el almuerzo",
      ["Quiero", "el", "almuerzo", "la", "cena"],
      ["Quiero", "el", "almuerzo"],
      ["quiero", "almuerzo"],
    ),
    vocabMcq("es-m10-6-mcq-cena", { surface: "cena", meaningEn: "dinner", emoji: "🍽️" }, [DESAYUNO, ALMUERZO, SOPA]),
    sentenceMcq({
      id: "es-m10-6-q-cena",
      prompt: "'I like dinner' — pick it.",
      correctText: "Me gusta la cena.",
      distractorsText: ["Me gusta el desayuno.", "Me gustan las cenas.", "Quiero la cena."],
      exercisedAtomSurfaces: ["cena", "me gusta"],
    }),
    speaking("es-m10-6-speak-almuerzo", "Me gusta el almuerzo.", "I like lunch.", ["almuerzo", "me gusta"]),
    listeningCompSentence({
      id: "es-m10-6-lc-desayuno",
      audioText: "¿Te gusta el desayuno?",
      correctMeaningEn: "Do you like breakfast?",
      distractorsEn: ["Do you want breakfast?", "Do you like lunch?", "Does she like breakfast?"],
      exercisedAtomSurfaces: ["desayuno", "te gusta"],
    }),
    sentenceMcq({
      id: "es-m10-6-q-comp",
      prompt: "¿Qué significa 'Quiero el desayuno, no el almuerzo'?",
      correctText: "I want breakfast, not lunch.",
      distractorsText: ["I want lunch, not breakfast.", "I like breakfast and lunch.", "I'm hungry for lunch."],
      exercisedAtomSurfaces: ["desayuno", "almuerzo", "quiero"],
    }),
    reviewMatchPairs(M10_6_REV, M10_6_REV, "m10", 6),
    translateStep({
      id: `${M10_6_REV}-tr`,
      promptEn: glossOf(M10_6_REVIEW[0]),
      acceptedAnswers: reviewWordAnswers(M10_6_REVIEW[0]),
      audioText: M10_6_REVIEW[0],
      exercisedAtomSurfaces: [M10_6_REVIEW[0]],
    }),
    vocabTextMcq(`${M10_6_REV}-tmcq`, M10_6_REVIEW[1], [M10_6_REVIEW[2], M10_6_REVIEW[3], M10_6_REVIEW[4]]),
    infoStep(
      "es-m10-6-info-win",
      "You can follow a meal by ear",
      "Soup, salad, rice, and the three meals of the day — you can now catch food talk without seeing it written down.",
      "win",
    ),
  ],
};

// ─── es-m10-7 — Integration: at the restaurant ──────────────────────────────

const M10_7_REV = "es-m10-7-rev";
const M10_7_REVIEW = pickReviewSurfaces(M10_7_REV, "m10", 6);

const M10_7: LessonContent = {
  id: "es-m10-7",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En el restaurante — ordering",
  description: "Order politely, split the order with para mí, and get the check.",
  estimatedMinutes: 10,
  xpReward: 19,
  steps: [
    infoStep(
      "es-m10-7-info-dialogo",
      "At the table",
      "—¡Buenas tardes!\n—Buenas tardes. Quisiera pollo con arroz, por favor.\n—¿Y para beber?\n—Para mí, un jugo, por favor. … ¡Está muy rico!\n—Gracias.\n—La cuenta, por favor.\nQuisiera is the gentle 'I would like' — softer than quiero. Para mí ('for me') is how each person at the table stakes their own order.",
      "default",
    ),
    phrase("es-m10-7-p-quisiera", "I would like", "quisiera"),
    sentenceMcq({
      id: "es-m10-7-q-quisiera",
      prompt: "Order politely: 'I would like chicken, please.'",
      correctText: "Quisiera pollo, por favor.",
      distractorsText: ["Me gusta el pollo, por favor.", "Le gusta pollo, por favor.", "Tengo pollo, por favor."],
      exercisedAtomSurfaces: ["quisiera", "pollo"],
    }),
    build(
      "es-m10-7-build-lacuenta",
      "Build: 'I would like the check.'",
      "Quisiera la cuenta",
      ["Quisiera", "la", "cuenta", "el", "pan"],
      ["Quisiera", "la", "cuenta"],
      ["quisiera", "la cuenta"],
    ),
    listeningCompSentence({
      id: "es-m10-7-lc-lacuenta",
      audioText: "La cuenta, por favor",
      correctMeaningEn: "The check, please",
      distractorsEn: ["The breakfast, please", "The table, please", "I'm thirsty, please"],
      exercisedAtomSurfaces: ["la cuenta"],
    }),
    sentenceMcq({
      id: "es-m10-7-q-lacuenta",
      prompt: "The meal is over. Ask for the check.",
      correctText: "La cuenta, por favor.",
      distractorsText: ["El desayuno, por favor.", "La mesa, por favor.", "Tengo sed, por favor."],
      exercisedAtomSurfaces: ["la cuenta"],
    }),
    speaking("es-m10-7-speak-lacuenta", "La cuenta, por favor.", "The check, please.", ["la cuenta"]),
    build(
      "es-m10-7-build-rico",
      "Build: 'The chicken is delicious!'",
      "¡El pollo está muy rico!",
      ["¡El", "pollo", "está", "muy", "rico!", "malo!"],
      ["¡El", "pollo", "está", "muy", "rico!"],
      ["rico", "pollo"],
    ),
    sentenceMcq({
      id: "es-m10-7-q-rico",
      prompt: "Your friend orders soup and loves it. What does she say?",
      correctText: "¡La sopa está muy rica!",
      distractorsText: ["¡La sopa está muy mala!", "¿Te gusta la sopa?", "¡Tengo sed!"],
      exercisedAtomSurfaces: ["sopa"],
    }),
    build(
      "es-m10-7-build-paramipollo",
      "Build: 'For me, chicken.'",
      "Para mí, pollo",
      ["Para", "mí,", "pollo", "ti"],
      ["Para", "mí,", "pollo"],
      ["pollo"],
    ),
    sentenceMcq({
      id: "es-m10-7-q-paramipescado",
      prompt: "Split the order: point to yourself and say 'For me, the fish.'",
      correctText: "Para mí, el pescado.",
      distractorsText: ["Para ti, el pescado.", "Por favor, el pescado.", "Para mí, la sopa."],
      exercisedAtomSurfaces: ["pescado"],
    }),
    listeningCompSentence({
      id: "es-m10-7-lc-paramisopa",
      audioText: "Para mí, la sopa, por favor",
      correctMeaningEn: "For me, the soup, please",
      distractorsEn: ["For you, the soup, please", "I want soup, please", "For me, the salad, please"],
      exercisedAtomSurfaces: ["sopa"],
    }),
    speaking("es-m10-7-speak-paramijugo", "Para mí, el jugo.", "For me, the juice.", ["jugo"]),
    dialogueListen({
      id: "es-m10-7-dl-restaurante",
      lines: [
        { speaker: "Mesero", text: "Buenas tardes. ¿Qué quisiera comer?" },
        { speaker: "Ana", text: "Quisiera pollo con arroz, por favor." },
        { speaker: "Mesero", text: "¿Y para beber?" },
        { speaker: "Ana", text: "Para mí, un jugo, por favor." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Ana order to eat?",
          correctText: "Chicken with rice",
          distractors: ["Fish with rice", "Soup and bread", "Chicken with eggs"],
          explanation: "Ana orders: Quisiera pollo con arroz, por favor.",
        },
        {
          id: "q2",
          prompt: "What does Ana order to drink?",
          correctText: "A juice",
          distractors: ["A coffee", "A beer", "Milk"],
          explanation: "Her drink order is: Para mí, un jugo, por favor.",
        },
      ],
      exercisedAtomSurfaces: ["quisiera", "pollo", "arroz", "jugo"],
    }),
    cloze(
      "es-m10-7-cloze-parami",
      "—¿Y para beber? —",
      " un jugo, por favor.",
      "Para mí,",
      ["Para mí,", "Para ti,", "Por favor,", "Para él,"],
      "For me, a juice, please.",
      "Para mí, un jugo, por favor.",
      "The speaker is choosing their own drink.",
      ["jugo"],
    ),
    sentenceMcq({
      id: "es-m10-7-q-quisieracafe",
      prompt: "Order politely: 'I would like a coffee.'",
      correctText: "Quisiera un café, por favor.",
      distractorsText: ["Me gusta un café, por favor.", "Tengo un café, por favor.", "Le gusta un café, por favor."],
      exercisedAtomSurfaces: ["quisiera", "café"],
    }),
    build(
      "es-m10-7-build-quisieracafe",
      "Build: 'I would like a coffee, please.'",
      "Quisiera un café, por favor",
      ["Quisiera", "un", "café,", "por", "favor", "quiero"],
      ["Quisiera", "un", "café,", "por", "favor"],
      ["quisiera", "café"],
    ),
    selfExplain({
      id: "es-m10-7-self-explain",
      anchorLabel: "You ordered: Quisiera pollo, por favor.",
      anchorAudioText: "Quisiera pollo, por favor",
      question: "Why quisiera instead of quiero when ordering?",
      rule: {
        text: "quisiera softens the request — it's a polite, more indirect way to ask, like English 'I would like' versus the blunter 'I want'.",
      },
      surface: { text: "quisiera is just the formal usted form of quiero." },
      distractor: { text: "quisiera is the past tense of querer, so it means 'I wanted'." },
      ruleExplanation:
        "quisiera is a politeness form, not a tense change — it softens quiero into a request, useful with anyone, tú or usted.",
    }),
    translateStep({
      id: "es-m10-7-tr-quisiera",
      promptEn: "I would like the check, please",
      acceptedAnswers: ["quisiera la cuenta, por favor", "Quisiera la cuenta, por favor.", "Quisiera la cuenta, por favor", "quisiera la cuenta por favor"],
      audioText: "quisiera la cuenta, por favor",
      exercisedAtomSurfaces: ["quisiera", "la cuenta"],
    }),
    reviewMatchPairs(M10_7_REV, M10_7_REV, "m10", 6),
    vocabTextMcq(`${M10_7_REV}-tmcq`, M10_7_REVIEW[1], [M10_7_REVIEW[2], M10_7_REVIEW[3], M10_7_REVIEW[4]]),
    infoStep(
      "es-m10-7-info-win",
      "You can order for yourself, politely",
      "Quisiera, para mí, la cuenta — you can now sit down at any table in the language and walk out fed and paid up.",
      "win",
    ),
  ],
};

// ─── es-m10-8 — Mastery test ────────────────────────────────────────────────

const M10_8_REV = "es-m10-8-rev";
const M10_8_REVIEW = pickReviewSurfaces(M10_8_REV, "m10", 6);

const M10_8: LessonContent = {
  id: "es-m10-8",
  moduleId: "m10",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M10 Mastery Test",
  description: "Gustar in all its forms, food and drink, quiero & quisiera.",
  estimatedMinutes: 8,
  xpReward: 20,
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
      undefined,
      ["manzana"],
    ),
    build(
      "es-m10-8-build-huevos",
      "Build: 'I like eggs.'",
      "Me gustan los huevos",
      ["Me", "gustan", "los", "huevos", "gusta"],
      ["Me", "gustan", "los", "huevos"],
      ["huevo"],
    ),
    vocabMcq("es-m10-8-mcq-almuerzo", { surface: "almuerzo", meaningEn: "lunch", emoji: "🍱" }, [DESAYUNO, CENA, SOPA]),
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
    build(
      "es-m10-8-build-parami",
      "Build: 'For me, the check.'",
      "Para mí, la cuenta",
      ["Para", "mí,", "la", "cuenta", "ti"],
      ["Para", "mí,", "la", "cuenta"],
      ["la cuenta"],
    ),
    reviewMatchPairs(M10_8_REV, M10_8_REV, "m10", 6),
    vocabTextMcq(`${M10_8_REV}-tmcq`, M10_8_REVIEW[0], [M10_8_REVIEW[1], M10_8_REVIEW[2], M10_8_REVIEW[3]]),
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
