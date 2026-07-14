/**
 * Spanish Module 12 — De compras (demonstratives, prices, clothes).
 *
 * The learner can already say where they're going (m11) and what they want
 * (m10). M12's job: point at things (este/esta, ese/esa), name the clothes
 * on the rack, ask what they cost (¿cuánto cuesta? — the o→ue preview),
 * handle big price numbers (doscientos, mil), compare (más/menos ... que),
 * and pay (pagar con tarjeta / en efectivo).
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m12-1  Point at it — este & esta (camisa, ropa)
 *   es-m12-2  Clothes I — camiseta, pantalones, zapatos, llevar
 *   es-m12-3  That one — ese & esa (vestido, falda, chaqueta, sombrero)
 *   es-m12-4  ¿Cuánto cuesta? — prices & big numbers
 *   es-m12-5  Caro o barato — comparing with más/menos ... que
 *   es-m12-6  Listening focus — in the store
 *   es-m12-7  Integration — paying (pagar, tarjeta, efectivo) + speaking
 *   es-m12-8  M12 Mastery Test
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
import "./m11";

const COURSE_ID = "mock-1";

// ─── M12 atoms (exactly the spine allocation) ───────────────────────────────

export const ES_M12_ATOMS: EsAtom[] = [
  // Demonstratives (plural estos/estas/esos/esas taught as patterns, not atoms)
  atom({ surface: "este", meaningEn: "this (m)", partOfSpeech: "particle", fromModule: "m12", kind: "particle" }),
  atom({ surface: "esta", meaningEn: "this (f)", partOfSpeech: "particle", fromModule: "m12", kind: "particle" }),
  atom({ surface: "ese", meaningEn: "that (m)", partOfSpeech: "particle", fromModule: "m12", kind: "particle" }),
  atom({ surface: "esa", meaningEn: "that (f)", partOfSpeech: "particle", fromModule: "m12", kind: "particle" }),
  // Prices & money
  atom({ surface: "cuesta", meaningEn: "it costs", partOfSpeech: "verb", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "peso", meaningEn: "peso", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m" }),
  atom({ surface: "dólar", meaningEn: "dollar", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "💲" }),
  atom({ surface: "precio", meaningEn: "price", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "🏷️" }),
  atom({ surface: "caro", meaningEn: "expensive (m)", partOfSpeech: "adjective", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "barato", meaningEn: "cheap (m)", partOfSpeech: "adjective", fromModule: "m12", kind: "vocab" }),
  // Clothes (emoji verified against src/pub/noto-emoji/svg at authoring time)
  atom({ surface: "ropa", meaningEn: "clothing", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "f" }),
  atom({ surface: "camisa", meaningEn: "shirt", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "f", emoji: "👔" }),
  atom({ surface: "camiseta", meaningEn: "t-shirt", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "f", emoji: "👕" }),
  atom({ surface: "pantalones", meaningEn: "pants", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "👖" }),
  atom({ surface: "zapatos", meaningEn: "shoes", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "👞" }),
  atom({ surface: "vestido", meaningEn: "dress", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "👗" }),
  atom({ surface: "falda", meaningEn: "skirt", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "f" }),
  atom({ surface: "chaqueta", meaningEn: "jacket", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "f", emoji: "🧥" }),
  atom({ surface: "sombrero", meaningEn: "hat", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "🎩" }),
  // Shopping verbs
  atom({ surface: "llevar", meaningEn: "to wear / carry", partOfSpeech: "verb", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "buscar", meaningEn: "to look for", partOfSpeech: "verb", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "pagar", meaningEn: "to pay", partOfSpeech: "verb", fromModule: "m12", kind: "vocab" }),
  // Paying
  atom({ surface: "tarjeta", meaningEn: "card", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "f" }),
  atom({ surface: "efectivo", meaningEn: "cash", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "💰" }),
  // Comparisons
  atom({ surface: "más", meaningEn: "more", partOfSpeech: "adverb", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "menos", meaningEn: "less", partOfSpeech: "adverb", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "que", meaningEn: "than / that", partOfSpeech: "particle", fromModule: "m12", kind: "particle" }),
  // Big numbers
  atom({ surface: "doscientos", meaningEn: "two hundred", partOfSpeech: "noun", fromModule: "m12", kind: "vocab" }),
  atom({ surface: "mil", meaningEn: "one thousand", partOfSpeech: "noun", fromModule: "m12", kind: "vocab" }),
  // Phrase
  atom({ surface: "¿cuánto cuesta?", meaningEn: "how much does it cost?", partOfSpeech: "phrase", fromModule: "m12", kind: "phrase" }),
];

// Shared distractor pool for clothing-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg),
// checked at authoring time.
const CAMISA = { surface: "camisa", emoji: "👔" };
const CAMISETA = { surface: "camiseta", emoji: "👕" };
const PANTALONES = { surface: "pantalones", emoji: "👖" };
const ZAPATOS = { surface: "zapatos", emoji: "👞" };
const VESTIDO = { surface: "vestido", emoji: "👗" };
const CHAQUETA = { surface: "chaqueta", emoji: "🧥" };
const SOMBRERO = { surface: "sombrero", emoji: "🎩" };

// ─── es-m12-1 — Point at it: este & esta ────────────────────────────────────

const M12_1: LessonContent = {
  id: "es-m12-1",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Point at it — este & esta",
  description: "This shirt, this clothing — demonstratives agree in gender.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "es-m12-1-info-demos",
      "This one, right here",
      "To point at something near you, Spanish uses este with masculine nouns and esta with feminine ones: este libro (this book), esta casa (this house). Like articles, the pointer word must match the noun's gender — the noun decides, the pointer follows.",
      "grammar",
    ),
    phrase("es-m12-1-p-camisa", "the shirt", "la camisa", undefined, { atomId: "es:camisa", emoji: "👔" }),
    phrase("es-m12-1-p-ropa", "the clothing", "la ropa", undefined, { atomId: "es:ropa" }),
    sentenceMcq({
      id: "es-m12-1-q-estacamisa",
      prompt: "Pick 'this shirt':",
      correctText: "esta camisa",
      distractorsText: ["este camisa", "estos camisa", "esa camisas"],
      explanation: "A feminine noun takes the feminine pointer word.",
      exercisedAtomSurfaces: ["esta", "camisa"],
    }),
    sentenceMcq({
      id: "es-m12-1-q-estaropa",
      prompt: "Pick 'this clothing':",
      correctText: "esta ropa",
      distractorsText: ["este ropa", "estos ropa", "estas ropa"],
      exercisedAtomSurfaces: ["esta", "ropa"],
    }),
    cloze(
      "es-m12-1-cloze-este",
      "",
      "libro es nuevo",
      "este",
      ["este", "esta", "ese", "esa"],
      "this book is new",
      "este libro es nuevo",
      "A masculine noun close at hand needs the masculine near-pointer.",
    ),
    sentenceMcq({
      id: "es-m12-1-q-estecarro",
      prompt: "Pick 'this car' (carro is masculine):",
      correctText: "este carro",
      distractorsText: ["esta carro", "esa carro", "estas carro"],
      exercisedAtomSurfaces: ["este"],
    }),
    speaking("es-m12-1-speak-camisa", "esta camisa es bonita", "this shirt is pretty", ["esta", "camisa"]),
  ],
};

// ─── es-m12-2 — Clothes I ───────────────────────────────────────────────────

const M12_2: LessonContent = {
  id: "es-m12-2",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Clothes I — camiseta, pantalones, llevar",
  description: "T-shirts, pants, shoes — and llevar, the wearing verb.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m12-2-info-plural",
      "Estos and estas — plural pointers",
      "Pointing at more than one thing? este/esta become estos/estas: estos zapatos (these shoes), estas camisas (these shirts). And the wearing verb llevar is a friendly regular -ar verb: llevo (I wear), llevas (you wear). It also means 'to carry' — one verb, both jobs.",
      "grammar",
    ),
    phrase("es-m12-2-p-camiseta", "the t-shirt", "la camiseta", undefined, { atomId: "es:camiseta", emoji: "👕" }),
    phrase("es-m12-2-p-pantalones", "the pants", "los pantalones", undefined, { atomId: "es:pantalones", emoji: "👖" }),
    vocabMcq(
      "es-m12-2-mcq-camiseta",
      { surface: "camiseta", meaningEn: "t-shirt", emoji: "👕" },
      [CAMISA, PANTALONES, VESTIDO],
    ),
    vocabMcq(
      "es-m12-2-mcq-pantalones",
      { surface: "pantalones", meaningEn: "pants", emoji: "👖" },
      [CAMISETA, ZAPATOS, CHAQUETA],
    ),
    phrase("es-m12-2-p-zapatos", "the shoes", "los zapatos", undefined, { atomId: "es:zapatos", emoji: "👞" }),
    build(
      "es-m12-2-build-llevo",
      "Build: 'I wear this t-shirt.'",
      "llevo esta camiseta",
      ["llevo", "esta", "camiseta", "este"],
      ["llevo", "esta", "camiseta"],
      ["esta", "camiseta"],
    ),
    vocabMcq(
      "es-m12-2-mcq-zapatos",
      { surface: "zapatos", meaningEn: "shoes", emoji: "👞" },
      [PANTALONES, SOMBRERO, CAMISA],
    ),
    sentenceMcq({
      id: "es-m12-2-q-llevar",
      prompt: "'I'm going to wear these shoes.' — pick the Spanish:",
      correctText: "voy a llevar estos zapatos",
      distractorsText: [
        "voy a llevar estas zapatos",
        "vas a llevar estos zapatos",
        "voy a llevo estos zapatos",
      ],
      exercisedAtomSurfaces: ["llevar", "zapatos"],
    }),
  ],
};

// ─── es-m12-3 — That one: ese & esa ─────────────────────────────────────────

const M12_3: LessonContent = {
  id: "es-m12-3",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "That one — ese & esa",
  description: "Point across the store: ese, esa — plus dresses, skirts, hats.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m12-3-info-ese",
      "Near and far",
      "Este/esta point at what's close to you; ese/esa point at what's over there, near the other person: este vestido (this dress, in my hands) vs ese vestido (that dress, on the rack). Same gender rule, same plural pattern: esos, esas.",
      "grammar",
    ),
    phrase("es-m12-3-p-vestido", "the dress", "el vestido", undefined, { atomId: "es:vestido", emoji: "👗" }),
    phrase("es-m12-3-p-falda", "the skirt", "la falda", undefined, { atomId: "es:falda" }),
    sentenceMcq({
      id: "es-m12-3-q-esevestido",
      prompt: "Pick 'that dress':",
      correctText: "ese vestido",
      distractorsText: ["esa vestido", "esos vestido", "esta vestido"],
      exercisedAtomSurfaces: ["ese", "vestido"],
    }),
    sentenceMcq({
      id: "es-m12-3-q-esafalda",
      prompt: "Pick 'that skirt':",
      correctText: "esa falda",
      distractorsText: ["ese falda", "esas falda", "este falda"],
      exercisedAtomSurfaces: ["esa", "falda"],
    }),
    phrase("es-m12-3-p-chaqueta", "the jacket", "la chaqueta", undefined, { atomId: "es:chaqueta", emoji: "🧥" }),
    vocabMcq(
      "es-m12-3-mcq-sombrero",
      { surface: "sombrero", meaningEn: "hat", emoji: "🎩" },
      [CHAQUETA, VESTIDO, CAMISETA],
    ),
    vocabMcq(
      "es-m12-3-mcq-chaqueta",
      { surface: "chaqueta", meaningEn: "jacket", emoji: "🧥" },
      [SOMBRERO, VESTIDO, CAMISA],
    ),
    cloze(
      "es-m12-3-cloze-ese",
      "",
      "sombrero es grande",
      "ese",
      ["ese", "esa", "esta", "esas"],
      "that hat is big",
      "ese sombrero es grande",
      "Masculine noun, over there by the other person — far pointer, masculine form.",
    ),
  ],
};

// ─── es-m12-4 — ¿Cuánto cuesta? ─────────────────────────────────────────────

const M12_4: LessonContent = {
  id: "es-m12-4",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Cuánto cuesta? — prices & big numbers",
  description: "Ask the price, hear the answer — pesos, dollars, hundreds, thousands.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m12-4-info-cuesta",
      "Asking the price",
      "¿Cuánto cuesta? asks what one thing costs; for plurals it becomes ¿cuánto cuestan? (cuesta comes from costar, whose o swells to ue — a pattern you'll master in the next module). Big price numbers stack simply: cien (100), doscientos (200), mil (1,000) — mil pesos, doscientos dólares.",
      "grammar",
    ),
    phrase(
      "es-m12-4-p-cuantocuesta",
      "how much does it cost?",
      "¿cuánto cuesta?",
      "In Mexican mercados a friendly ¿cuánto cuesta? often opens a little back-and-forth — polite haggling is part of the fun at market stalls, though never in regular stores.",
    ),
    phrase("es-m12-4-p-peso", "the peso", "el peso", undefined, { atomId: "es:peso" }),
    sentenceMcq({
      id: "es-m12-4-q-preguntar",
      prompt: "You want to know what the shirt costs. Ask:",
      correctText: "¿cuánto cuesta esta camisa?",
      distractorsText: [
        "¿cuánto cuestan esta camisa?",
        "¿cuánto esta camisa?",
        "¿dónde cuesta esta camisa?",
      ],
      exercisedAtomSurfaces: ["¿cuánto cuesta?", "cuesta", "camisa"],
    }),
    sentenceMcq({
      id: "es-m12-4-q-pesos",
      prompt: "'It costs twenty pesos.' — pick the Spanish:",
      correctText: "cuesta veinte pesos",
      distractorsText: ["cuestan veinte pesos", "cuesta veinte peso", "veinte cuesta pesos"],
      exercisedAtomSurfaces: ["cuesta", "peso"],
    }),
    vocab("es-m12-4-p-mil", "one thousand", "mil"),
    sentenceMcq({
      id: "es-m12-4-q-dolar",
      prompt: "'The ticket costs one hundred dollars.' — pick the Spanish:",
      correctText: "el boleto cuesta cien dólares",
      distractorsText: [
        "el boleto cuestan cien dólares",
        "el boleto cuesta cien dólar",
        "los boleto cuesta cien dólares",
      ],
      exercisedAtomSurfaces: ["cuesta", "dólar"],
    }),
    build(
      "es-m12-4-build-mil",
      "Build: 'The dress costs a thousand pesos.'",
      "el vestido cuesta mil pesos",
      ["el", "vestido", "cuesta", "mil", "pesos", "dólares"],
      ["el", "vestido", "cuesta", "mil", "pesos"],
      ["vestido", "cuesta", "mil", "peso"],
    ),
    sentenceMcq({
      id: "es-m12-4-q-doscientos",
      prompt: "Which is 'two hundred'?",
      correctText: "doscientos",
      distractorsText: ["docientos", "dosciento", "dos cien"],
      exercisedAtomSurfaces: ["doscientos"],
    }),
  ],
};

// ─── es-m12-5 — Caro o barato ───────────────────────────────────────────────

const M12_5: LessonContent = {
  id: "es-m12-5",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Caro o barato — comparing",
  description: "Expensive, cheap, and how to say 'more ... than'.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m12-5-info-comparar",
      "More than, less than",
      "Compare two things with más ... que (more ... than) and menos ... que (less ... than): la chaqueta es más cara que la camiseta. Caro and barato are ordinary adjectives, so they agree with the noun: vestido caro, falda cara, zapatos caros.",
      "grammar",
    ),
    vocab("es-m12-5-p-caro", "expensive", "caro"),
    vocab("es-m12-5-p-barato", "cheap", "barato"),
    sentenceMcq({
      id: "es-m12-5-q-caro",
      prompt: "'This hat is very expensive.' — pick the Spanish:",
      correctText: "este sombrero es muy caro",
      distractorsText: [
        "este sombrero es muy cara",
        "esta sombrero es muy caro",
        "este sombrero muy es caro",
      ],
      exercisedAtomSurfaces: ["caro", "este", "sombrero"],
    }),
    sentenceMcq({
      id: "es-m12-5-q-barato",
      prompt: "'This dress is cheap.' — pick the Spanish:",
      correctText: "este vestido es barato",
      distractorsText: [
        "este vestido es barata",
        "esta vestido es barato",
        "estos vestido es barato",
      ],
      exercisedAtomSurfaces: ["barato", "vestido", "este"],
    }),
    cloze(
      "es-m12-5-cloze-que",
      "esta camisa es más cara",
      "esa",
      "que",
      ["que", "y", "o", "de"],
      "this shirt is more expensive than that one",
      "esta camisa es más cara que esa",
      "Comparisons link the two things with the same little word every time.",
    ),
    build(
      "es-m12-5-build-mas",
      "Build: 'The dress is more expensive than the skirt.'",
      "el vestido es más caro que la falda",
      ["el", "vestido", "es", "más", "caro", "que", "la", "falda", "menos"],
      ["el", "vestido", "es", "más", "caro", "que", "la", "falda"],
      ["más", "que", "caro", "vestido", "falda"],
    ),
    sentenceMcq({
      id: "es-m12-5-q-menos",
      prompt: "'This t-shirt costs less than that one.' — pick the Spanish:",
      correctText: "esta camiseta cuesta menos que esa",
      distractorsText: [
        "esta camiseta cuesta menos de esa",
        "esta camiseta cuesta más que esa",
        "esta camiseta menos cuesta que esa",
      ],
      exercisedAtomSurfaces: ["menos", "que", "camiseta"],
    }),
    sentenceMcq({
      id: "es-m12-5-q-buscar",
      prompt: "'I'm going to look for a cheaper price.' — pick the Spanish:",
      correctText: "voy a buscar un precio más barato",
      distractorsText: [
        "voy a buscar un precio más caro",
        "voy a pagar un precio más barato",
        "voy a buscar una precio más barato",
      ],
      exercisedAtomSurfaces: ["buscar", "precio", "más", "barato"],
    }),
  ],
};

// ─── es-m12-6 — Listening focus ─────────────────────────────────────────────

const M12_6: LessonContent = {
  id: "es-m12-6",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — en la tienda",
  description: "Train your ear on prices and pointers, full sentences only.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    listeningCompSentence({
      id: "es-m12-6-lc-cuanto",
      audioText: "¿cuánto cuesta ese sombrero?",
      correctMeaningEn: "How much does that hat cost?",
      distractorsEn: [
        "How much do those shoes cost?",
        "Where is that hat?",
        "How much does this shirt cost?",
      ],
      exercisedAtomSurfaces: ["cuesta", "ese", "sombrero"],
    }),
    listeningBuildSentence({
      id: "es-m12-6-lb-falda",
      target: "esta falda cuesta doscientos pesos",
      tiles: ["esta", "falda", "cuesta", "doscientos", "pesos", "mil"],
      correctOrder: ["esta", "falda", "cuesta", "doscientos", "pesos"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["esta", "falda", "cuesta", "doscientos", "peso"],
    }),
    listeningCompSentence({
      id: "es-m12-6-lc-chaqueta",
      audioText: "esa chaqueta es muy cara",
      correctMeaningEn: "That jacket is very expensive.",
      distractorsEn: [
        "That jacket is very cheap.",
        "This jacket is very pretty.",
        "That shirt is very expensive.",
      ],
      exercisedAtomSurfaces: ["esa", "chaqueta"],
    }),
    listeningBuildSentence({
      id: "es-m12-6-lb-zapatos",
      target: "busco unos zapatos baratos",
      tiles: ["busco", "unos", "zapatos", "baratos", "caros"],
      correctOrder: ["busco", "unos", "zapatos", "baratos"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["buscar", "zapatos", "barato"],
    }),
    listeningCompSentence({
      id: "es-m12-6-lc-vestido",
      audioText: "el vestido cuesta mil pesos",
      correctMeaningEn: "The dress costs a thousand pesos.",
      distractorsEn: [
        "The dress costs two hundred pesos.",
        "The skirt costs a thousand pesos.",
        "The dress costs a thousand dollars.",
      ],
      exercisedAtomSurfaces: ["vestido", "cuesta", "mil", "peso"],
    }),
    listeningBuildSentence({
      id: "es-m12-6-lb-pantalones",
      target: "esos pantalones cuestan más que estos",
      tiles: ["esos", "pantalones", "cuestan", "más", "que", "estos", "menos"],
      correctOrder: ["esos", "pantalones", "cuestan", "más", "que", "estos"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["pantalones", "más", "que"],
    }),
    listeningCompSentence({
      id: "es-m12-6-lc-camisa",
      audioText: "busco una camisa azul",
      correctMeaningEn: "I'm looking for a blue shirt.",
      distractorsEn: [
        "I'm looking for a blue t-shirt.",
        "I'm wearing a blue shirt.",
        "I'm looking for a red shirt.",
      ],
      exercisedAtomSurfaces: ["buscar", "camisa"],
    }),
    listeningCompSentence({
      id: "es-m12-6-lc-menos",
      audioText: "esta camiseta cuesta menos que esa",
      correctMeaningEn: "This t-shirt costs less than that one.",
      distractorsEn: [
        "This t-shirt costs more than that one.",
        "That t-shirt costs less than this one.",
        "This shirt costs less than that one.",
      ],
      exercisedAtomSurfaces: ["camiseta", "menos", "que"],
    }),
  ],
};

// ─── es-m12-7 — Integration dialogue ────────────────────────────────────────

const M12_7: LessonContent = {
  id: "es-m12-7",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "En la tienda — a shopping trip",
  description: "Put the module together: browse, ask, and pay.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m12-7-info-dialogo",
      "At the clothing store",
      "—Buenas tardes. Busco una camisa.\n—¿Le gusta esta camisa azul?\n—Sí, mucho. ¿Cuánto cuesta?\n—Doscientos pesos.\n—¡Qué barato! Quiero pagar con tarjeta.\nEvery line is made of words you know — read it out loud before moving on.",
      "default",
    ),
    phrase("es-m12-7-p-tarjeta", "the card", "la tarjeta", undefined, { atomId: "es:tarjeta" }),
    phrase("es-m12-7-p-efectivo", "in cash", "en efectivo", undefined, { atomId: "es:efectivo", emoji: "💰" }),
    sentenceMcq({
      id: "es-m12-7-q-tarjeta",
      prompt: "Tell the clerk: 'I want to pay with card.'",
      correctText: "quiero pagar con tarjeta",
      distractorsText: [
        "quiero pagar sin tarjeta",
        "quiero paga con tarjeta",
        "quieres pagar con tarjeta",
      ],
      exercisedAtomSurfaces: ["pagar", "tarjeta"],
    }),
    sentenceMcq({
      id: "es-m12-7-q-efectivo",
      prompt: "'I'm going to pay in cash.' — pick the Spanish:",
      correctText: "voy a pagar en efectivo",
      distractorsText: [
        "voy a pagar el efectivo",
        "vas a pagar en efectivo",
        "voy a pago en efectivo",
      ],
      exercisedAtomSurfaces: ["pagar", "efectivo"],
    }),
    build(
      "es-m12-7-build-cuesta",
      "Build the clerk's reply: 'This shirt costs two hundred pesos.'",
      "esta camisa cuesta doscientos pesos",
      ["esta", "camisa", "cuesta", "doscientos", "pesos", "tarjeta"],
      ["esta", "camisa", "cuesta", "doscientos", "pesos"],
      ["esta", "camisa", "cuesta", "doscientos", "peso"],
    ),
    translateStep({
      id: "es-m12-7-tr-cuanto",
      promptEn: "How much does it cost?",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "¿cuánto cuesta?",
        "¿Cuánto cuesta?",
        "cuánto cuesta",
        "Cuánto cuesta",
        "¿cuanto cuesta?",
        "¿Cuanto cuesta?",
        "cuanto cuesta",
        "Cuanto cuesta",
      ],
      audioText: "¿cuánto cuesta?",
      exercisedAtomSurfaces: ["¿cuánto cuesta?"],
    }),
    speaking("es-m12-7-speak-pagar", "quiero pagar con tarjeta", "I want to pay with card", ["pagar", "tarjeta"]),
    speaking("es-m12-7-speak-cuanto", "¿cuánto cuesta este vestido?", "How much does this dress cost?", ["cuesta", "este", "vestido"]),
  ],
};

// ─── es-m12-8 — Mastery test ────────────────────────────────────────────────

const M12_8: LessonContent = {
  id: "es-m12-8",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M12 Mastery Test",
  description: "Demonstratives, clothes, prices, comparisons, paying.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m12-8-q-esta",
      prompt: "Pick 'this shirt':",
      correctText: "esta camisa",
      distractorsText: ["este camisa", "esa camisas", "estos camisa"],
      exercisedAtomSurfaces: ["esta", "camisa"],
    }),
    vocabMcq(
      "es-m12-8-mcq-vestido",
      { surface: "vestido", meaningEn: "dress", emoji: "👗" },
      [CAMISETA, CHAQUETA, PANTALONES],
    ),
    cloze(
      "es-m12-8-cloze-que",
      "estos zapatos cuestan menos",
      "esos",
      "que",
      ["que", "y", "o", "pero"],
      "these shoes cost less than those",
      "estos zapatos cuestan menos que esos",
    ),
    listeningCompSentence({
      id: "es-m12-8-lc-falda",
      audioText: "¿cuánto cuesta esa falda?",
      correctMeaningEn: "How much does that skirt cost?",
      distractorsEn: [
        "How much does this skirt cost?",
        "How much does that dress cost?",
        "Where is that skirt?",
      ],
      exercisedAtomSurfaces: ["cuesta", "esa", "falda"],
    }),
    translateStep({
      id: "es-m12-8-tr-caro",
      promptEn: "That hat is very expensive.",
      acceptedAnswers: [
        "ese sombrero es muy caro",
        "Ese sombrero es muy caro",
        "ese sombrero es muy caro.",
        "Ese sombrero es muy caro.",
      ],
      audioText: "ese sombrero es muy caro",
      exercisedAtomSurfaces: ["ese", "sombrero", "caro"],
    }),
    sentenceMcq({
      id: "es-m12-8-q-mil",
      prompt: "'It costs a thousand dollars.' — pick the Spanish:",
      correctText: "cuesta mil dólares",
      distractorsText: ["cuestan mil dólares", "cuesta mil dólar", "cuesta dólares mil"],
      exercisedAtomSurfaces: ["cuesta", "mil", "dólar"],
    }),
    listeningBuildSentence({
      id: "es-m12-8-lb-efectivo",
      target: "quiero pagar en efectivo",
      tiles: ["quiero", "pagar", "en", "efectivo", "tarjeta", "con"],
      correctOrder: ["quiero", "pagar", "en", "efectivo"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["pagar", "efectivo"],
    }),
    speaking("es-m12-8-speak-ropa", "esta ropa es muy barata", "this clothing is very cheap", ["esta", "ropa"]),
  ],
};

export const ES_M12_LESSONS: LessonContent[] = [
  M12_1,
  M12_2,
  M12_3,
  M12_4,
  M12_5,
  M12_6,
  M12_7,
  M12_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M12_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m12",
      moduleId: "m12",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m12",
          prompt: "'How much does it cost?' — which is correct?",
          correctText: "¿cuánto cuesta?",
          distractorsText: ["¿cuánto cuestas?", "¿cómo cuesta?", "¿cuánto costa?"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m12-1",
      moduleId: "m12",
      build: () =>
        sentenceMcq({
          id: "pt-es-m12-1",
          prompt: "'This shirt' — which is correct?",
          correctText: "esta camisa",
          distractorsText: ["este camisa", "esa camisas", "estos camisa"],
        }),
    },
    {
      id: "pt-es-m12-2",
      moduleId: "m12",
      build: () =>
        cloze(
          "pt-es-m12-2",
          "esta falda es más cara",
          "esa",
          "que",
          ["que", "y", "o", "de"],
          "this skirt is more expensive than that one",
          "esta falda es más cara que esa",
        ),
    },
    {
      id: "pt-es-m12-3",
      moduleId: "m12",
      build: () =>
        sentenceMcq({
          id: "pt-es-m12-3",
          prompt: "'That hat' — which is correct?",
          correctText: "ese sombrero",
          distractorsText: ["esa sombrero", "esos sombrero", "esta sombrero"],
        }),
    },
    {
      id: "pt-es-m12-4",
      moduleId: "m12",
      build: () =>
        sentenceMcq({
          id: "pt-es-m12-4",
          prompt: "'It costs a thousand pesos.' — which is correct?",
          correctText: "cuesta mil pesos",
          distractorsText: ["cuestan mil pesos", "cuesta mil peso", "costa mil pesos"],
        }),
    },
  ],
};
