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
  agreementCloze,
  build,
  cloze,
  dialogueListen,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  phrase,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  translateStep,
  vocabMcq,
  vocabTextMcq,
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
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m12-1-info-demos",
      "This one, right here",
      "To point at something near you, Spanish uses este with masculine nouns and esta with feminine ones: este libro (this book), esta casa (this house). Like articles, the pointer word must match the noun's gender — the noun decides, the pointer follows.",
      "grammar",
    ),
    build(
      "es-m12-1-build-lacamisa",
      "Build: 'the shirt'",
      "la camisa",
      ["la", "el", "camisa", "los"],
      ["la", "camisa"],
      ["camisa"],
    ),
    vocabMcq(
      "es-m12-1-mcq-camisa",
      { surface: "camisa", meaningEn: "shirt", emoji: "👔" },
      [SOMBRERO, VESTIDO, PANTALONES],
    ),
    sentenceMcq({
      id: "es-m12-1-q-estacamisa",
      prompt: "Pick 'this shirt':",
      correctText: "esta camisa",
      distractorsText: ["este camisa", "estos camisa", "esa camisas"],
      explanation: "A feminine noun takes the feminine pointer word.",
      exercisedAtomSurfaces: ["esta", "camisa"],
    }),
    speaking("es-m12-1-speak-camisa", "esta camisa es bonita", "this shirt is pretty", ["esta", "camisa"]),
    phrase("es-m12-1-p-ropa", "the clothing", "la ropa", undefined, { atomId: "es:ropa" }),
    vocabTextMcq("es-m12-1-tmcq-ropa", "ropa", ["camisa", "vestido", "zapatos"]),
    cloze(
      "es-m12-1-cloze-esta-ropa",
      "",
      "ropa es nueva",
      "esta",
      ["este", "esta", "ese", "esa"],
      "this clothing is new",
      "esta ropa es nueva",
      "A feminine noun close at hand needs the feminine near-pointer.",
      ["ropa", "nuevo"],
    ),
    build(
      "es-m12-1-build-estecarro",
      "Build: 'this car'",
      "este carro",
      ["este", "esta", "carro", "esos"],
      ["este", "carro"],
      ["este"],
    ),
    sentenceMcq({
      id: "es-m12-1-q-estacasa",
      prompt: "Pick 'this house':",
      correctText: "esta casa",
      distractorsText: ["este casa", "esa casas", "estos casa"],
      exercisedAtomSurfaces: ["esta"],
    }),
    translateStep({
      id: "es-m12-1-tr-ropa",
      promptEn: "This clothing is new.",
      acceptedAnswers: [
        "esta ropa es nueva",
        "Esta ropa es nueva",
        "esta ropa es nueva.",
        "Esta ropa es nueva.",
      ],
      audioText: "esta ropa es nueva",
      exercisedAtomSurfaces: ["esta", "ropa"],
    }),
    listeningCompSentence({
      id: "es-m12-1-lc-libro",
      audioText: "este libro es viejo",
      correctMeaningEn: "This book is old.",
      distractorsEn: [
        "This book is new.",
        "That book is old.",
        "This house is old.",
      ],
      exercisedAtomSurfaces: ["este"],
    }),
    sentenceMcq({
      id: "es-m12-1-q-esteperro",
      prompt: "Pick 'this dog':",
      correctText: "este perro",
      distractorsText: ["esta perro", "esos perro", "esa perros"],
      exercisedAtomSurfaces: ["este"],
    }),
    build(
      "es-m12-1-build-esteperrobonito",
      "Build: 'this dog is pretty.'",
      "este perro es bonito",
      ["este", "perro", "es", "bonito", "esta"],
      ["este", "perro", "es", "bonito"],
      ["este"],
    ),
    selfExplain({
      id: "es-m12-1-self-explain",
      anchorLabel: "You wrote: este perro es bonito",
      anchorAudioText: "este perro es bonito",
      question: "Why este and not esta before perro?",
      rule: { text: "este/esta agree with the noun's gender — perro is masculine, so it takes este." },
      surface: { text: "este is used for animals, esta is used for objects." },
      distractor: { text: "este agrees with the adjective that follows, not the noun." },
      ruleExplanation:
        "este/esta always match the gender of the noun they point at, no matter what adjective comes after.",
    }),
    speaking("es-m12-1-speak-casa", "esta casa es vieja", "this house is old", ["esta"]),
    reviewMatchPairs("es-m12-1-review", "es-m12-1-review-seed", "m12", 6),
    listeningCompSentence({
      id: "es-m12-1-rev-lc-gato",
      audioText: "el gato es pequeño",
      correctMeaningEn: "The cat is small.",
      distractorsEn: [
        "The dog is small.",
        "The cat is big.",
        "The cat is old.",
      ],
    }),
    infoStep(
      "es-m12-1-info-win",
      "You can point at anything",
      "You can now point at anything on the rack — este or esta, depending on what you're holding — and know you're saying it right.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m12-2-info-plural",
      "Estos and estas — plural pointers",
      "Pointing at more than one thing? este/esta become estos/estas: estos zapatos (these shoes), estas camisas (these shirts). And the wearing verb llevar is a friendly regular -ar verb: llevo (I wear), llevas (you wear). It also means 'to carry' — one verb, both jobs.",
      "grammar",
    ),
    vocabMcq(
      "es-m12-2-mcq-camiseta",
      { surface: "camiseta", meaningEn: "t-shirt", emoji: "👕" },
      [CAMISA, PANTALONES, VESTIDO],
    ),
    build(
      "es-m12-2-build-llevo",
      "Build: 'I wear this blue t-shirt.'",
      "llevo esta camiseta azul",
      ["llevo", "esta", "camiseta", "azul", "este"],
      ["llevo", "esta", "camiseta", "azul"],
      ["esta", "camiseta"],
    ),
    vocabMcq(
      "es-m12-2-mcq-pantalones",
      { surface: "pantalones", meaningEn: "pants", emoji: "👖" },
      [CAMISETA, ZAPATOS, CHAQUETA],
    ),
    sentenceMcq({
      id: "es-m12-2-q-estospantalones",
      prompt: "Pick 'these pants':",
      correctText: "estos pantalones",
      distractorsText: ["esta pantalones", "estas pantalones", "este pantalones"],
      exercisedAtomSurfaces: ["pantalones"],
    }),
    speaking("es-m12-2-speak-pantalones", "llevas estos pantalones", "you're wearing these pants", ["llevar", "pantalones"]),
    vocabMcq(
      "es-m12-2-mcq-zapatos",
      { surface: "zapatos", meaningEn: "shoes", emoji: "👞" },
      [PANTALONES, SOMBRERO, CAMISA],
    ),
    cloze(
      "es-m12-2-cloze-estos-zapatos",
      "",
      "zapatos son nuevos",
      "estos",
      ["este", "esta", "estos", "estas"],
      "these shoes are new",
      "estos zapatos son nuevos",
      "Plural noun, close at hand — estos, not este.",
      ["zapatos", "nuevo"],
    ),
    build(
      "es-m12-2-build-llevarzapatos",
      "Build: 'I'm going to wear these shoes.'",
      "voy a llevar estos zapatos",
      ["voy", "a", "llevar", "estos", "zapatos", "esos"],
      ["voy", "a", "llevar", "estos", "zapatos"],
      ["llevar", "zapatos"],
    ),
    sentenceMcq({
      id: "es-m12-2-q-camisaroja",
      prompt: "'She's wearing a red shirt.' — pick the Spanish:",
      correctText: "ella lleva una camisa roja",
      distractorsText: [
        "ella lleva una camisa rojo",
        "ella llevas una camisa roja",
        "ella lleva un camisa roja",
      ],
      exercisedAtomSurfaces: ["llevar", "camisa"],
    }),
    translateStep({
      id: "es-m12-2-tr-camiseta",
      promptEn: "I'm wearing this blue t-shirt.",
      acceptedAnswers: [
        "llevo esta camiseta azul",
        "Llevo esta camiseta azul",
        "llevo esta camiseta azul.",
        "Llevo esta camiseta azul.",
      ],
      audioText: "llevo esta camiseta azul",
      exercisedAtomSurfaces: ["llevar", "camiseta"],
    }),
    listeningCompSentence({
      id: "es-m12-2-lc-zapatosverdes",
      audioText: "él lleva unos zapatos verdes",
      correctMeaningEn: "He's wearing some green shoes.",
      distractorsEn: [
        "He's wearing some green pants.",
        "She's wearing some green shoes.",
        "He's wearing some blue shoes.",
      ],
      exercisedAtomSurfaces: ["llevar", "zapatos"],
    }),
    sentenceMcq({
      id: "es-m12-2-q-estascamisetas",
      prompt: "Pick 'these t-shirts':",
      correctText: "estas camisetas",
      distractorsText: ["estos camisetas", "este camisetas", "esa camisetas"],
      exercisedAtomSurfaces: ["camiseta"],
    }),
    build(
      "es-m12-2-build-ellosllevan",
      "Build: 'They're wearing black pants.'",
      "ellos llevan pantalones negros",
      ["ellos", "llevan", "pantalones", "negros", "negro"],
      ["ellos", "llevan", "pantalones", "negros"],
      ["llevar", "pantalones"],
    ),
    sentenceMcq({
      id: "es-m12-2-q-estascamisetasnuevas",
      prompt: "Pick 'these t-shirts are new':",
      correctText: "estas camisetas son nuevas",
      distractorsText: [
        "estos camisetas son nuevas",
        "estas camisetas son nuevos",
        "esta camisetas son nuevas",
      ],
      exercisedAtomSurfaces: ["camiseta"],
    }),
    selfExplain({
      id: "es-m12-2-self-explain",
      anchorLabel: "You wrote: estas camisetas son nuevas",
      anchorAudioText: "estas camisetas son nuevas",
      question: "Why estas and not estos for camisetas?",
      rule: { text: "estos/estas follow the same gender-and-number agreement as este/esta — camiseta is feminine, so its plural pointer is estas." },
      surface: { text: "estas is used when there are more than three items." },
      distractor: { text: "estas agrees with the color of the clothing, not the noun." },
      ruleExplanation:
        "estos/estas just add plural to este/esta's gender rule: match the noun's gender AND number.",
    }),
    speaking("es-m12-2-speak-zapatosnegros", "llevo unos zapatos negros", "I'm wearing some black shoes", ["llevar", "zapatos"]),
    reviewMatchPairs("es-m12-2-review", "es-m12-2-review-seed", "m12", 6),
    sentenceMcq({
      id: "es-m12-2-rev-q-carro",
      prompt: "Pick 'the car is big':",
      correctText: "el carro es grande",
      distractorsText: ["el carro es pequeño", "la carro es grande", "el carro son grande"],
    }),
    infoStep(
      "es-m12-2-info-win",
      "You can describe what's on the rack",
      "You can now name the clothes on the rack and say exactly what you're wearing — singular or plural.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m12-3-info-ese",
      "Near and far",
      "Este/esta point at what's close to you; ese/esa point at what's over there, near the other person: este vestido (this dress, in my hands) vs ese vestido (that dress, on the rack). Same gender rule, same plural pattern: esos, esas.",
      "grammar",
    ),
    vocabMcq(
      "es-m12-3-mcq-vestido",
      { surface: "vestido", meaningEn: "dress", emoji: "👗" },
      [CHAQUETA, CAMISETA, SOMBRERO],
    ),
    sentenceMcq({
      id: "es-m12-3-q-esevestido",
      prompt: "Pick 'that dress':",
      correctText: "ese vestido",
      distractorsText: ["esa vestido", "esos vestido", "esta vestido"],
      exercisedAtomSurfaces: ["ese", "vestido"],
    }),
    phrase("es-m12-3-p-falda", "the skirt", "la falda", undefined, { atomId: "es:falda" }),
    vocabTextMcq("es-m12-3-tmcq-falda", "falda", ["vestido", "camisa", "zapatos"]),
    cloze(
      "es-m12-3-cloze-esa-falda",
      "",
      "falda es bonita",
      "esa",
      ["este", "esta", "ese", "esa"],
      "that skirt is pretty",
      "esa falda es bonita",
      "Feminine noun, over there — far pointer, feminine form.",
      ["falda"],
    ),
    build(
      "es-m12-3-build-esevestido",
      "Build: 'that dress'",
      "ese vestido",
      ["ese", "esa", "vestido", "esos"],
      ["ese", "vestido"],
      ["ese"],
    ),
    vocabMcq(
      "es-m12-3-mcq-chaqueta",
      { surface: "chaqueta", meaningEn: "jacket", emoji: "🧥" },
      [SOMBRERO, VESTIDO, CAMISA],
    ),
    sentenceMcq({
      id: "es-m12-3-q-esachaqueta",
      prompt: "Pick 'that jacket':",
      correctText: "esa chaqueta",
      distractorsText: ["ese chaqueta", "esas chaqueta", "esta chaqueta"],
      exercisedAtomSurfaces: ["esa", "chaqueta"],
    }),
    speaking("es-m12-3-speak-chaqueta", "esa chaqueta es bonita", "that jacket is pretty", ["esa", "chaqueta"]),
    vocabMcq(
      "es-m12-3-mcq-sombrero",
      { surface: "sombrero", meaningEn: "hat", emoji: "🎩" },
      [CHAQUETA, VESTIDO, CAMISETA],
    ),
    cloze(
      "es-m12-3-cloze-ese-sombrero",
      "",
      "sombrero es grande",
      "ese",
      ["ese", "esa", "esta", "esas"],
      "that hat is big",
      "ese sombrero es grande",
      "Masculine noun, over there by the other person — far pointer, masculine form.",
      ["sombrero", "grande"],
    ),
    translateStep({
      id: "es-m12-3-tr-sombrero",
      promptEn: "That hat is big.",
      acceptedAnswers: [
        "ese sombrero es grande",
        "Ese sombrero es grande",
        "ese sombrero es grande.",
        "Ese sombrero es grande.",
      ],
      audioText: "ese sombrero es grande",
      exercisedAtomSurfaces: ["ese", "sombrero"],
    }),
    sentenceMcq({
      id: "es-m12-3-q-esafaldavieja",
      prompt: "Pick 'that skirt is old':",
      correctText: "esa falda es vieja",
      distractorsText: ["ese falda es vieja", "esa falda es viejo", "esas falda es vieja"],
      exercisedAtomSurfaces: ["esa", "falda"],
    }),
    build(
      "es-m12-3-build-estascamisetas",
      "Build: 'these t-shirts are new.'",
      "estas camisetas son nuevas",
      ["estas", "camisetas", "son", "nuevas", "estos"],
      ["estas", "camisetas", "son", "nuevas"],
      ["camiseta"],
    ),
    selfExplain({
      id: "es-m12-3-self-explain",
      anchorLabel: "You wrote: ese sombrero es grande",
      anchorAudioText: "ese sombrero es grande",
      question: "Why ese and not este for that hat over there?",
      rule: { text: "ese points at something away from you, near the listener or across the room — this hat is on the rack, not in your hands." },
      surface: { text: "ese is just a more formal version of este." },
      distractor: { text: "ese is for expensive items and este is for cheap ones." },
      ruleExplanation:
        "este/esta point at what's near you; ese/esa point at what's near the listener or across the room. The gender-agreement rule is the same for both pairs.",
    }),
    speaking("es-m12-3-speak-faldavieja", "esa falda es vieja pero bonita", "that skirt is old but pretty", ["esa", "falda"]),
    reviewMatchPairs("es-m12-3-review", "es-m12-3-review-seed", "m12", 6),
    listeningCompSentence({
      id: "es-m12-3-rev-lc-gatoperro",
      audioText: "el gato es más pequeño que el perro",
      correctMeaningEn: "The cat is smaller than the dog.",
      distractorsEn: [
        "The dog is smaller than the cat.",
        "The cat is bigger than the dog.",
        "The cat is smaller than the car.",
      ],
    }),
    infoStep(
      "es-m12-3-info-win",
      "You can point across the whole store",
      "You can now point at anything across the room and say whether it's near you or over there — camisas, vestidos, sombreros, all of it.",
      "win",
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
  estimatedMinutes: 8,
  xpReward: 18,
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
    vocabMcq(
      "es-m12-4-mcq-dolar",
      { surface: "dólar", meaningEn: "dollar", emoji: "💲" },
      [{ surface: "efectivo", emoji: "💰" }, CAMISA, VESTIDO],
    ),
    translateStep({
      id: "es-m12-4-tr-cuanto",
      promptEn: "How much does it cost?",
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
    sentenceMcq({
      id: "es-m12-4-q-pesos",
      prompt: "'It costs twenty pesos.' — pick the Spanish:",
      correctText: "cuesta veinte pesos",
      distractorsText: ["cuestan veinte pesos", "cuesta veinte peso", "veinte cuesta pesos"],
      exercisedAtomSurfaces: ["cuesta", "peso"],
    }),
    listeningCompSentence({
      id: "es-m12-4-lc-boleto",
      audioText: "el boleto cuesta cien dólares",
      correctMeaningEn: "The ticket costs one hundred dollars.",
      distractorsEn: [
        "The ticket costs two hundred dollars.",
        "The ticket costs one hundred pesos.",
        "The dress costs one hundred dollars.",
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
    cloze(
      "es-m12-4-cloze-doscientos",
      "la falda cuesta",
      "pesos",
      "doscientos",
      ["doscientos", "cien", "mil", "veinte"],
      "the skirt costs two hundred pesos",
      "la falda cuesta doscientos pesos",
      undefined,
      ["falda"],
    ),
    sentenceMcq({
      id: "es-m12-4-q-camisadoscientos",
      prompt: "Pick 'this shirt costs two hundred pesos':",
      correctText: "esta camisa cuesta doscientos pesos",
      distractorsText: [
        "esta camisa cuestan doscientos pesos",
        "esta camisa cuesta doscientas pesos",
        "esa camisa cuesta doscientos pesos",
      ],
      exercisedAtomSurfaces: ["esta", "camisa", "cuesta", "doscientos"],
    }),
    build(
      "es-m12-4-build-chaquetadolares",
      "Build: 'That jacket costs two hundred dollars.'",
      "esa chaqueta cuesta doscientos dólares",
      ["esa", "chaqueta", "cuesta", "doscientos", "dólares", "ese"],
      ["esa", "chaqueta", "cuesta", "doscientos", "dólares"],
      ["esa", "chaqueta", "cuesta", "doscientos", "dólar"],
    ),
    vocabMcq(
      "es-m12-4-mcq-precio",
      { surface: "precio", meaningEn: "price", emoji: "🏷️" },
      [{ surface: "dólar", emoji: "💲" }, { surface: "efectivo", emoji: "💰" }, CAMISA],
    ),
    sentenceMcq({
      id: "es-m12-4-q-preciobueno",
      prompt: "Pick 'the price is very good':",
      correctText: "el precio es muy bueno",
      distractorsText: ["el precio es muy malo", "la precio es muy buena", "el precio son muy bueno"],
      exercisedAtomSurfaces: ["precio"],
    }),
    speaking("es-m12-4-speak-cienzapatos", "esos zapatos cuestan cien dólares", "those shoes cost a hundred dollars", ["cuesta", "zapatos", "dólar"]),
    selfExplain({
      id: "es-m12-4-self-explain",
      anchorLabel: "You wrote: esta camisa cuesta doscientos pesos",
      anchorAudioText: "esta camisa cuesta doscientos pesos",
      question: "Why cuesta and not cuestan here?",
      rule: { text: "cuesta agrees with a singular subject (esta camisa); cuestan is for a plural subject like estos zapatos." },
      surface: { text: "cuesta is for expensive things and cuestan is for cheap things." },
      distractor: { text: "cuesta is the formal form and cuestan is the informal one." },
      ruleExplanation:
        "cuesta/cuestan is costar's present tense (o→ue): a singular subject takes cuesta, a plural subject takes cuestan.",
    }),
    listeningCompSentence({
      id: "es-m12-4-rev-lc-casa",
      audioText: "la casa es muy grande",
      correctMeaningEn: "The house is very big.",
      distractorsEn: [
        "The house is very small.",
        "The car is very big.",
        "The house is very old.",
      ],
    }),
    reviewMatchPairs("es-m12-4-review", "es-m12-4-review-seed", "m12", 6),
    infoStep(
      "es-m12-4-info-win",
      "You can ask any price",
      "You can now ask any price and understand the answer — pesos, dollars, hundreds, and thousands.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 18,
  steps: [
    infoStep(
      "es-m12-5-info-comparar",
      "More than, less than",
      "Compare two things with más ... que (more ... than) and menos ... que (less ... than): la chaqueta es más cara que la camiseta. Caro and barato are ordinary adjectives, so they agree with the noun: vestido caro, falda cara, zapatos caros.",
      "grammar",
    ),
    vocabTextMcq("es-m12-5-tmcq-caro", "caro", ["barato", "bueno", "malo"]),
    listeningCompSentence({
      id: "es-m12-5-lc-caro",
      audioText: "este sombrero es muy caro",
      correctMeaningEn: "This hat is very expensive.",
      distractorsEn: [
        "This hat is very cheap.",
        "That hat is very expensive.",
        "This jacket is very expensive.",
      ],
      exercisedAtomSurfaces: ["caro"],
    }),
    build(
      "es-m12-5-build-barato",
      "Build: 'this dress is cheap.'",
      "este vestido es barato",
      ["este", "vestido", "es", "barato", "caro"],
      ["este", "vestido", "es", "barato"],
      ["barato", "vestido"],
    ),
    vocabTextMcq("es-m12-5-tmcq-barato", "barato", ["caro", "nuevo", "viejo"]),
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
    agreementCloze(
      "es-m12-5-ac-caro",
      [
        { blank: { id: "b1", correctAnswer: "Esta", options: ["Este", "Esta", "Ese", "Esa"] } },
        { text: " falda es muy barat" },
        { blank: { id: "b2", correctAnswer: "a", options: ["o", "a", "os", "as"] } },
        { text: " y " },
        { blank: { id: "b3", correctAnswer: "ese", options: ["este", "esta", "ese", "esa"] } },
        { text: " sombrero es muy caro" },
      ],
      "This skirt is very cheap and that hat is very expensive",
      "Esta falda es muy barata y ese sombrero es muy caro",
      ["esta", "falda", "barato", "ese", "sombrero", "caro"],
    ),
    speaking("es-m12-5-speak-buscar", "voy a buscar un precio más barato", "I'm going to look for a cheaper price", ["buscar", "precio", "más", "barato"]),
    sentenceMcq({
      id: "es-m12-5-q-buscar",
      prompt: "'I'm looking for a cheap shirt.' — pick the Spanish:",
      correctText: "busco una camisa barata",
      distractorsText: [
        "busco una camisa cara",
        "busca una camisa barata",
        "busco un camisa barata",
      ],
      exercisedAtomSurfaces: ["buscar", "camisa", "barato"],
    }),
    listeningCompSentence({
      id: "es-m12-5-lc-carrocasa",
      audioText: "el carro es más caro que la casa",
      correctMeaningEn: "The car is more expensive than the house.",
      distractorsEn: [
        "The house is more expensive than the car.",
        "The car is cheaper than the house.",
        "The car is bigger than the house.",
      ],
      exercisedAtomSurfaces: ["más", "que"],
    }),
    build(
      "es-m12-5-build-zapatosmenos",
      "Build: 'These shoes cost less than those.'",
      "estos zapatos cuestan menos que esos",
      ["estos", "zapatos", "cuestan", "menos", "que", "esos", "más"],
      ["estos", "zapatos", "cuestan", "menos", "que", "esos"],
      ["zapatos", "cuesta", "menos", "que"],
    ),
    translateStep({
      id: "es-m12-5-tr-falda",
      promptEn: "That skirt is more expensive than this one.",
      acceptedAnswers: [
        "esa falda es más cara que esta",
        "Esa falda es más cara que esta",
        "esa falda es más cara que esta.",
        "Esa falda es más cara que esta.",
      ],
      audioText: "esa falda es más cara que esta",
      exercisedAtomSurfaces: ["esa", "falda", "más", "que"],
    }),
    selfExplain({
      id: "es-m12-5-self-explain",
      anchorLabel: "You wrote: Esta falda es muy barata y ese sombrero es muy caro",
      anchorAudioText: "Esta falda es muy barata y ese sombrero es muy caro",
      question: "Why barata for falda but caro for sombrero?",
      rule: { text: "caro/barato are regular adjectives — they agree with the noun's gender. falda is feminine → barata; sombrero is masculine → caro." },
      surface: { text: "barata is used after esta and caro is used after ese." },
      distractor: { text: "barata is the plural form of barato." },
      ruleExplanation:
        "Like all -o/-a adjectives, caro/barato change ending to match the noun's gender, no matter which demonstrative comes before them.",
    }),
    listeningCompSentence({
      id: "es-m12-5-rev-lc-perrogato",
      audioText: "este perro es más grande que ese gato",
      correctMeaningEn: "This dog is bigger than that cat.",
      distractorsEn: [
        "This cat is bigger than that dog.",
        "This dog is smaller than that cat.",
        "This dog is bigger than that dog.",
      ],
    }),
    speaking("es-m12-5-speak-chaquetacamiseta", "esta chaqueta cuesta menos que esa camiseta", "this jacket costs less than that t-shirt", ["chaqueta", "cuesta", "menos", "que", "camiseta"]),
    reviewMatchPairs("es-m12-5-review", "es-m12-5-review-seed", "m12", 6),
    sentenceMcq({
      id: "es-m12-5-rev-q-libro",
      prompt: "Pick 'the book is more expensive than the shirt':",
      correctText: "el libro es más caro que la camisa",
      distractorsText: [
        "el libro es más caro que el camisa",
        "el libro es menos caro que la camisa",
        "la libro es más caro que la camisa",
      ],
    }),
    infoStep(
      "es-m12-5-info-win",
      "You can compare and haggle",
      "You can now compare prices and haggle like a local — caro, barato, más, menos, que.",
      "win",
    ),
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
  xpReward: 16,
  steps: [
    infoStep(
      "es-m12-6-info-listen",
      "Train your ear",
      "Everything here is audio-first: prices, pointers, and comparisons, spoken at natural speed. Listen for the whole sentence before you answer.",
      "default",
    ),
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
    sentenceMcq({
      id: "es-m12-6-q-vestido",
      prompt: "Pick 'the dress costs a thousand pesos':",
      correctText: "el vestido cuesta mil pesos",
      distractorsText: [
        "el vestido cuesta doscientos pesos",
        "la vestido cuesta mil pesos",
        "el vestido cuestan mil pesos",
      ],
      exercisedAtomSurfaces: ["vestido", "cuesta", "mil", "peso"],
    }),
    listeningCompSentence({
      id: "es-m12-6-lc-pantalones",
      audioText: "esos pantalones cuestan más que estos",
      correctMeaningEn: "Those pants cost more than these.",
      distractorsEn: [
        "Those pants cost less than these.",
        "These pants cost more than those.",
        "Those shoes cost more than these.",
      ],
      exercisedAtomSurfaces: ["pantalones", "más", "que"],
    }),
    build(
      "es-m12-6-build-camisaazul",
      "Build: 'I'm looking for a blue shirt.'",
      "busco una camisa azul",
      ["busco", "una", "camisa", "azul", "busca"],
      ["busco", "una", "camisa", "azul"],
      ["buscar", "camisa"],
    ),
    translateStep({
      id: "es-m12-6-tr-menos",
      promptEn: "This t-shirt costs less than that one.",
      acceptedAnswers: [
        "esta camiseta cuesta menos que esa",
        "Esta camiseta cuesta menos que esa",
        "esta camiseta cuesta menos que esa.",
        "Esta camiseta cuesta menos que esa.",
      ],
      audioText: "esta camiseta cuesta menos que esa",
      exercisedAtomSurfaces: ["camiseta", "menos", "que"],
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
    sentenceMcq({
      id: "es-m12-6-q-negra",
      prompt: "Pick 'I'm wearing a black jacket':",
      correctText: "llevo una chaqueta negra",
      distractorsText: [
        "llevo una chaqueta negro",
        "llevas una chaqueta negra",
        "llevo un chaqueta negra",
      ],
      exercisedAtomSurfaces: ["llevar", "chaqueta"],
    }),
    speaking("es-m12-6-speak-negra", "llevo una chaqueta negra", "I'm wearing a black jacket", ["llevar", "chaqueta"]),
    listeningCompSentence({
      id: "es-m12-6-lc-faldabonita",
      audioText: "esa falda es muy bonita",
      correctMeaningEn: "That skirt is very pretty.",
      distractorsEn: [
        "This skirt is very pretty.",
        "That skirt is very expensive.",
        "That dress is very pretty.",
      ],
      exercisedAtomSurfaces: ["esa", "falda"],
    }),
    listeningBuildSentence({
      id: "es-m12-6-lb-precioalto",
      target: "el precio es muy alto",
      tiles: ["el", "precio", "es", "muy", "alto", "bajo"],
      correctOrder: ["el", "precio", "es", "muy", "alto"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["precio"],
    }),
    build(
      "es-m12-6-build-carrocasa",
      "Build: 'The car costs less than the house.'",
      "el carro cuesta menos que la casa",
      ["el", "carro", "cuesta", "menos", "que", "la", "casa", "más"],
      ["el", "carro", "cuesta", "menos", "que", "la", "casa"],
      ["cuesta", "menos", "que"],
    ),
    reviewMatchPairs("es-m12-6-review", "es-m12-6-review-seed", "m12", 6),
    listeningCompSentence({
      id: "es-m12-6-rev-lc-perrogato",
      audioText: "el perro es más grande que el gato",
      correctMeaningEn: "The dog is bigger than the cat.",
      distractorsEn: [
        "The cat is bigger than the dog.",
        "The dog is smaller than the cat.",
        "The dog is older than the cat.",
      ],
    }),
    infoStep(
      "es-m12-6-info-win",
      "Your ear won't miss a beat",
      "Your ear can now catch a price, a pointer, and a comparison in one sentence, without missing a beat.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "es-m12-7-info-dialogo",
      "At the clothing store",
      "—Buenas tardes. Busco una camisa.\n—¿Le gusta esta camisa azul?\n—Sí, mucho. ¿Cuánto cuesta?\n—Doscientos pesos.\n—¡Qué barato! Quiero pagar con tarjeta.\nEvery line is made of words you know — read it out loud before moving on.",
      "default",
    ),
    phrase("es-m12-7-p-tarjeta", "the card", "la tarjeta", undefined, { atomId: "es:tarjeta" }),
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
    cloze(
      "es-m12-7-cloze-tarjeta",
      "voy a pagar con",
      "",
      "tarjeta",
      ["tarjeta", "efectivo", "dólares", "pesos"],
      "I'm going to pay with card",
      "voy a pagar con tarjeta",
      undefined,
      ["pagar"],
    ),
    build(
      "es-m12-7-build-efectivo",
      "Build: 'I'm going to pay in cash.'",
      "voy a pagar en efectivo",
      ["voy", "a", "pagar", "en", "efectivo", "con"],
      ["voy", "a", "pagar", "en", "efectivo"],
      ["pagar", "efectivo"],
    ),
    vocabMcq(
      "es-m12-7-mcq-efectivo",
      { surface: "efectivo", meaningEn: "cash", emoji: "💰" },
      [{ surface: "dólar", emoji: "💲" }, { surface: "precio", emoji: "🏷️" }, CAMISETA],
    ),
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
    build(
      "es-m12-7-build-cuesta",
      "Build the clerk's reply: 'This shirt costs two hundred pesos.'",
      "esta camisa cuesta doscientos pesos",
      ["esta", "camisa", "cuesta", "doscientos", "pesos", "tarjeta"],
      ["esta", "camisa", "cuesta", "doscientos", "pesos"],
      ["esta", "camisa", "cuesta", "doscientos", "peso"],
    ),
    dialogueListen({
      id: "es-m12-7-dl-tienda",
      lines: [
        { speaker: "Vendedora", text: "Buenas tardes. ¿Le gusta esta chaqueta?" },
        { speaker: "Sara", text: "Sí, pero ¿cuánto cuesta?" },
        { speaker: "Vendedora", text: "Cuesta doscientos pesos." },
        { speaker: "Sara", text: "¡Qué barato! Voy a pagar con tarjeta." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "How much does the jacket cost?",
          correctText: "Two hundred pesos",
          distractors: ["One hundred pesos", "Two hundred dollars", "One thousand pesos"],
          explanation: "The clerk answers: Cuesta doscientos pesos.",
        },
        {
          id: "q2",
          prompt: "How does Sara pay?",
          correctText: "With a card",
          distractors: ["In cash", "With dollars", "She doesn't buy it"],
          explanation: "Sara says: Voy a pagar con tarjeta.",
        },
      ],
      exercisedAtomSurfaces: ["le gusta", "esta", "chaqueta", "cuesta", "doscientos", "peso", "pagar", "tarjeta"],
    }),
    speaking("es-m12-7-speak-pagar", "quiero pagar con tarjeta", "I want to pay with card", ["pagar", "tarjeta"]),
    listeningCompSentence({
      id: "es-m12-7-lc-vendedora",
      audioText: "sara va a pagar con tarjeta",
      correctMeaningEn: "Sara is going to pay with a card.",
      distractorsEn: [
        "Sara is going to pay in cash.",
        "Sara doesn't want to pay.",
        "Sara already paid with a card.",
      ],
      exercisedAtomSurfaces: ["pagar", "tarjeta"],
    }),
    sentenceMcq({
      id: "es-m12-7-q-sombrerocaro",
      prompt: "Pick 'that hat is very expensive':",
      correctText: "ese sombrero es muy caro",
      distractorsText: [
        "este sombrero es muy caro",
        "ese sombrero es muy cara",
        "ese sombrero es muy barato",
      ],
      exercisedAtomSurfaces: ["ese", "sombrero", "caro"],
    }),
    build(
      "es-m12-7-build-camisanueva",
      "Build: 'I'm wearing this new shirt.'",
      "llevo esta camisa nueva",
      ["llevo", "esta", "camisa", "nueva", "este"],
      ["llevo", "esta", "camisa", "nueva"],
      ["llevar", "camisa"],
    ),
    speaking("es-m12-7-speak-cuanto", "¿cuánto cuesta este vestido?", "How much does this dress cost?", ["cuesta", "este", "vestido"]),
    reviewMatchPairs("es-m12-7-review", "es-m12-7-review-seed", "m12", 6),
    listeningCompSentence({
      id: "es-m12-7-rev-lc-camisabonita",
      audioText: "la camisa es muy bonita",
      correctMeaningEn: "The shirt is very pretty.",
      distractorsEn: [
        "The shirt is very expensive.",
        "The dress is very pretty.",
        "The shirt isn't pretty.",
      ],
    }),
    infoStep(
      "es-m12-7-info-win",
      "A whole shopping trip",
      "You can browse, ask, bargain, and pay — a whole shopping trip in Spanish, start to finish.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 22,
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
    build(
      "es-m12-8-build-chaquetadoscientos",
      "Build: 'That jacket costs two hundred pesos.'",
      "esa chaqueta cuesta doscientos pesos",
      ["esa", "chaqueta", "cuesta", "doscientos", "pesos", "ese"],
      ["esa", "chaqueta", "cuesta", "doscientos", "pesos"],
      ["esa", "chaqueta", "cuesta", "doscientos", "peso"],
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
    vocabMcq(
      "es-m12-8-rev-mcq-carro",
      { surface: "carro", meaningEn: "car", emoji: "🚗" },
      [{ surface: "perro", emoji: "🐶" }, { surface: "gato", emoji: "🐱" }, { surface: "casa", emoji: "🏠" }],
    ),
    sentenceMcq({
      id: "es-m12-8-rev-q-perro",
      prompt: "Pick 'the dog is big':",
      correctText: "el perro es grande",
      distractorsText: ["el perro es pequeño", "la perro es grande", "el perro son grande"],
    }),
    speaking("es-m12-8-speak-ropa", "esta ropa es muy barata", "this clothing is very cheap", ["esta", "ropa"]),
    listeningCompSentence({
      id: "es-m12-8-rev-lc-libro",
      audioText: "el libro es muy interesante",
      correctMeaningEn: "The book is very interesting.",
      distractorsEn: [
        "The book is very boring.",
        "The house is very interesting.",
        "The book isn't interesting.",
      ],
    }),
    build(
      "es-m12-8-build-zapatosmenos",
      "Build: 'These shoes cost less than those.'",
      "estos zapatos cuestan menos que esos",
      ["estos", "zapatos", "cuestan", "menos", "que", "esos", "más"],
      ["estos", "zapatos", "cuestan", "menos", "que", "esos"],
      ["zapatos", "cuesta", "menos", "que"],
    ),
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
