/**
 * Spanish Module 5 — Familia y posesión (family, possessives, tener sg).
 *
 * The learner can describe things (m4). M5's job: the people closest to
 * them — family vocabulary, possessives mi/tu/su, possession with de
 * (el carro de Ana), tener singular (tengo/tienes/tiene), and age with
 * tener X años.
 *
 * Lesson arc (spine rhythm — L1 teach-intro · L2–L5 topics · L6 listening ·
 * L7 integration dialogue · L8 mastery test):
 *
 *   es-m5-1  Mi familia — familia, madre, padre, mi
 *   es-m5-2  Tener — tengo, tienes; hermano, hermana
 *   es-m5-3  Su — his/her; tiene; hijo, hija
 *   es-m5-4  Tu familia — tu vs tú; mamá, papá, abuelo, abuela
 *   es-m5-5  ¿Cuántos años tienes? — age; niño, niña
 *   es-m5-6  Listening focus — quién (sentence-level only from m5 up)
 *   es-m5-7  Integration — esposo, esposa, también; possession with de
 *   es-m5-8  M5 Mastery Test
 *
 * From m5 the listening ratchet is sentence-level only: every
 * listening_build has ≥3 tiles in its correct order and every
 * listening_comprehension transcript is a full sentence.
 * Accent leniency note: acceptedAnswers strip ALL diacritics in the
 * lenient variants (á→a, é→e, ñ→n) — keyboard leniency per the spine,
 * the displayed Spanish always carries correct orthography.
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
  matchPairs,
  phrase,
  sentenceMcq,
  speaking,
  translateStep,
  vocab,
  vocabMcq,
  vocabTextMcq,
} from "../grammarHelpers";
// Register earlier-module atoms before this file's factory calls resolve surfaces.
import "./m4";

const COURSE_ID = "mock-1";

// ─── M5 atoms (exactly the spine allocation) ────────────────────────────────

export const ES_M5_ATOMS: EsAtom[] = [
  // Family
  atom({ surface: "familia", meaningEn: "family", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f", emoji: "👪" }),
  atom({ surface: "madre", meaningEn: "mother", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f", emoji: "👩" }),
  atom({ surface: "padre", meaningEn: "father", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m", emoji: "👨" }),
  atom({ surface: "mamá", meaningEn: "mom", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f" }),
  atom({ surface: "papá", meaningEn: "dad", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m" }),
  atom({ surface: "hermano", meaningEn: "brother", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m" }),
  atom({ surface: "hermana", meaningEn: "sister", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f" }),
  atom({ surface: "hijo", meaningEn: "son", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m" }),
  atom({ surface: "hija", meaningEn: "daughter", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f" }),
  atom({ surface: "abuelo", meaningEn: "grandfather", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m", emoji: "👴" }),
  atom({ surface: "abuela", meaningEn: "grandmother", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f", emoji: "👵" }),
  atom({ surface: "esposo", meaningEn: "husband", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m", emoji: "🤵" }),
  atom({ surface: "esposa", meaningEn: "wife", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f", emoji: "👰" }),
  atom({ surface: "niño", meaningEn: "boy / child", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m", emoji: "👦" }),
  atom({ surface: "niña", meaningEn: "girl", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "f", emoji: "👧" }),
  // Tener (singular)
  atom({ surface: "tener", meaningEn: "to have", partOfSpeech: "verb", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "tengo", meaningEn: "I have", partOfSpeech: "verb", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "tienes", meaningEn: "you have", partOfSpeech: "verb", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "tiene", meaningEn: "he/she has", partOfSpeech: "verb", fromModule: "m5", kind: "vocab" }),
  // Possessives
  atom({ surface: "mi", meaningEn: "my", partOfSpeech: "particle", fromModule: "m5", kind: "particle" }),
  atom({ surface: "tu", meaningEn: "your (informal)", partOfSpeech: "particle", fromModule: "m5", kind: "particle" }),
  atom({ surface: "su", meaningEn: "his / her / your (formal)", partOfSpeech: "particle", fromModule: "m5", kind: "particle" }),
  // Age
  atom({ surface: "año", meaningEn: "year", partOfSpeech: "noun", fromModule: "m5", kind: "vocab", gender: "m" }),
  atom({ surface: "años", meaningEn: "years", partOfSpeech: "noun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "¿cuántos años tienes?", meaningEn: "how old are you?", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase" }),
  // Question word & adverb
  atom({ surface: "quién", meaningEn: "who", partOfSpeech: "pronoun", fromModule: "m5", kind: "vocab" }),
  atom({ surface: "también", meaningEn: "also", partOfSpeech: "adverb", fromModule: "m5", kind: "vocab" }),
];

// Shared distractor pool for word-image MCQs. Every emoji here has
// verified Noto art in the bundled subset (src/pub/noto-emoji/svg):
// 1f46a 1f469 1f468 1f474 1f475 1f935 1f470 1f466 1f467, checked at
// authoring time. mamá/papá, hijo/hija and hermano/hermana carry no
// emoji — the fitting glyphs would collide with madre/padre/niño/niña.
const FAMILIA = { surface: "familia", emoji: "👪" };
const MADRE = { surface: "madre", emoji: "👩" };
const PADRE = { surface: "padre", emoji: "👨" };
const ABUELO = { surface: "abuelo", emoji: "👴" };
const ABUELA = { surface: "abuela", emoji: "👵" };
const ESPOSO = { surface: "esposo", emoji: "🤵" };
const ESPOSA = { surface: "esposa", emoji: "👰" };
const NINO = { surface: "niño", emoji: "👦" };
const NINA = { surface: "niña", emoji: "👧" };

// ─── es-m5-1 — Mi familia ───────────────────────────────────────────────────

const M5_1: LessonContent = {
  id: "es-m5-1",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Mi familia — madre, padre",
  description: "Say 'my' — and meet the first three family words.",
  estimatedMinutes: 5,
  xpReward: 11,
  steps: [
    infoStep(
      "es-m5-1-info-mi",
      "Mi — my",
      "mi means 'my' and never changes for gender: mi padre, mi madre. With more than one of something it adds -s: mis hermanos (my brothers). No 'el' or 'la' needed — the possessive replaces the article.",
      "grammar",
    ),
    phrase("es-m5-1-p-familia", "the family", "la familia", undefined, { emoji: "👪" }),
    phrase("es-m5-1-p-madre", "the mother", "la madre", undefined, { emoji: "👩" }),
    vocabMcq("es-m5-1-mcq-familia", { surface: "familia", meaningEn: "family", emoji: "👪" }, [MADRE, PADRE, NINO]),
    vocabMcq("es-m5-1-mcq-madre", { surface: "madre", meaningEn: "mother", emoji: "👩" }, [PADRE, ABUELA, FAMILIA]),
    phrase("es-m5-1-p-padre", "the father", "el padre", undefined, { emoji: "👨" }),
    sentenceMcq({
      id: "es-m5-1-q-mi",
      prompt: "'My family' — which is correct?",
      correctText: "mi familia",
      distractorsText: ["la familia", "una familia", "tu familia"],
      exercisedAtomSurfaces: ["mi", "familia"],
    }),
    vocabMcq("es-m5-1-mcq-padre", { surface: "padre", meaningEn: "father", emoji: "👨" }, [MADRE, ABUELO, NINO]),
    listeningCompSentence({
      id: "es-m5-1-lc-familia",
      audioText: "mi familia es grande",
      correctMeaningEn: "my family is big",
      distractorsEn: ["my family is small", "my house is big", "your family is big"],
      exercisedAtomSurfaces: ["mi", "familia"],
    }),
  ],
};

// ─── es-m5-2 — Tener: tengo, tienes ─────────────────────────────────────────

const M5_2: LessonContent = {
  id: "es-m5-2",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Tener — tengo, tienes",
  description: "The verb 'to have' — plus brothers and sisters.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m5-2-info-tener",
      "Tener — to have",
      "tener is the dictionary form of 'to have'. In the singular: tengo (I have), tienes (you have), tiene (he or she has). yo tengo un hermano — I have a brother. As with ser, the ending does the work, so yo and tú are optional.",
      "grammar",
    ),
    phrase("es-m5-2-p-hermano", "the brother", "el hermano"),
    phrase("es-m5-2-p-hermana", "the sister", "la hermana"),
    // Text-front recognition rung — hermano carries no emoji (the fitting
    // glyphs would collide with madre/padre/niño/niña), so it skipped the
    // image-MCQ rung.
    vocabTextMcq("es-m5-2-tmcq-hermano", "hermano", ["hermana", "padre", "madre"]),
    sentenceMcq({
      id: "es-m5-2-q-tengo",
      prompt: "'I have a brother.' — which is correct?",
      correctText: "tengo un hermano",
      distractorsText: ["tienes un hermano", "tengo una hermana", "tienes una hermana"],
      exercisedAtomSurfaces: ["tengo", "hermano"],
    }),
    sentenceMcq({
      id: "es-m5-2-q-tienes",
      prompt: "'You have a sister.' — which is correct?",
      correctText: "tienes una hermana",
      distractorsText: ["tengo una hermana", "tienes un hermano", "tengo un hermano"],
      exercisedAtomSurfaces: ["tienes", "hermana"],
    }),
    cloze(
      "es-m5-2-cloze-tengo",
      "yo",
      "dos hermanos",
      "tengo",
      ["tengo", "tienes", "tiene", "tener"],
      "I have two brothers",
      "yo tengo dos hermanos",
      "First-person singular — the 'I' form.",
    ),
    build(
      "es-m5-2-build-tienes",
      "Build: 'You have a brother.'",
      "tienes un hermano",
      ["tienes", "un", "hermano", "tengo", "hermana"],
      ["tienes", "un", "hermano"],
      ["tienes", "hermano"],
    ),
    translateStep({
      id: "es-m5-2-tr-hermana",
      promptEn: "I have a sister",
      acceptedAnswers: [
        "tengo una hermana",
        "Tengo una hermana",
        "yo tengo una hermana",
        "Yo tengo una hermana",
      ],
      audioText: "tengo una hermana",
      exercisedAtomSurfaces: ["tengo", "hermana"],
    }),
    listeningCompSentence({
      id: "es-m5-2-lc-hermanas",
      audioText: "tengo dos hermanas",
      correctMeaningEn: "I have two sisters",
      distractorsEn: ["I have two brothers", "you have two sisters", "I have three sisters"],
      exercisedAtomSurfaces: ["tengo", "hermana"],
    }),
  ],
};

// ─── es-m5-3 — Su: his/her; tiene ───────────────────────────────────────────

const M5_3: LessonContent = {
  id: "es-m5-3",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Su — his, her; tiene",
  description: "One little word for three owners — plus sons and daughters.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m5-3-info-su",
      "Su — one word, three owners",
      "su covers 'his', 'her', and formal 'your': su hijo can be his son, her son, or your son — context tells you whose. Like mi and tu, it adds -s with plurals: sus hijos. And the third person of tener is tiene: ella tiene una hija.",
      "grammar",
    ),
    phrase("es-m5-3-p-hijo", "the son", "el hijo"),
    phrase("es-m5-3-p-hija", "the daughter", "la hija"),
    sentenceMcq({
      id: "es-m5-3-q-tiene",
      prompt: "'She has a daughter.' — which is correct?",
      correctText: "ella tiene una hija",
      distractorsText: ["ella tengo una hija", "ella tienes una hija", "ella tener una hija"],
      exercisedAtomSurfaces: ["tiene", "hija"],
    }),
    cloze(
      "es-m5-3-cloze-su",
      "ella es",
      "hija",
      "su",
      ["su", "mi", "tu", "la"],
      "she is his daughter",
      "ella es su hija",
      "Third-person owner — his, her, or formal your.",
    ),
    sentenceMcq({
      id: "es-m5-3-q-hijo",
      prompt: "'His son' — which is correct?",
      correctText: "su hijo",
      distractorsText: ["su hija", "mi hijo", "tu hijo"],
      exercisedAtomSurfaces: ["su", "hijo"],
    }),
    build(
      "es-m5-3-build-hijos",
      "Build: 'She has two sons.'",
      "ella tiene dos hijos",
      ["ella", "tiene", "dos", "hijos", "hijas", "tengo"],
      ["ella", "tiene", "dos", "hijos"],
      ["tiene"],
    ),
    translateStep({
      id: "es-m5-3-tr-hija",
      promptEn: "He has a daughter",
      // Accent-less variants accepted per the spine's grading-leniency rule.
      acceptedAnswers: [
        "él tiene una hija",
        "Él tiene una hija",
        "el tiene una hija",
        "El tiene una hija",
        "tiene una hija",
        "Tiene una hija",
      ],
      audioText: "él tiene una hija",
      exercisedAtomSurfaces: ["tiene", "hija"],
    }),
    listeningCompSentence({
      id: "es-m5-3-lc-hija",
      audioText: "su hija es muy inteligente",
      correctMeaningEn: "his daughter is very intelligent",
      distractorsEn: ["his son is very intelligent", "my daughter is very intelligent", "his daughter is very tall"],
      exercisedAtomSurfaces: ["su", "hija"],
    }),
  ],
};

// ─── es-m5-4 — Tu familia: mamá, papá, abuelos ──────────────────────────────

const M5_4: LessonContent = {
  id: "es-m5-4",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Tu familia — mamá, papá, abuelos",
  description: "Your everyday family words — and one crucial accent.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m5-4-info-tu",
      "Tu vs tú",
      "One accent, two words: tú (with the accent) means 'you'; tu (without it) means 'your'. tú eres alto — you are tall; tu mamá — your mom. At home, Spanish speakers usually say mamá and papá rather than madre and padre.",
      "grammar",
    ),
    phrase("es-m5-4-p-mama", "the mom", "la mamá"),
    phrase("es-m5-4-p-papa", "the dad", "el papá"),
    sentenceMcq({
      id: "es-m5-4-q-tu",
      prompt: "'Your mom' — which is correct?",
      correctText: "tu mamá",
      distractorsText: ["tú mamá", "mi mamá", "su mamá"],
      explanation: "The possessive drops the accent mark — the accented twin means 'you'.",
      exercisedAtomSurfaces: ["tu", "mamá"],
    }),
    sentenceMcq({
      id: "es-m5-4-q-papa",
      prompt: "'My dad is tall.' — which is correct?",
      correctText: "mi papá es alto",
      distractorsText: ["mi papá es alta", "mi mamá es alto", "tu papá es alta"],
      exercisedAtomSurfaces: ["papá", "mi", "alto"],
    }),
    phrase("es-m5-4-p-abuelo", "the grandfather", "el abuelo", undefined, { emoji: "👴" }),
    phrase("es-m5-4-p-abuela", "the grandmother", "la abuela", undefined, { emoji: "👵" }),
    vocabMcq("es-m5-4-mcq-abuelo", { surface: "abuelo", meaningEn: "grandfather", emoji: "👴" }, [ABUELA, PADRE, NINO]),
    vocabMcq("es-m5-4-mcq-abuela", { surface: "abuela", meaningEn: "grandmother", emoji: "👵" }, [ABUELO, MADRE, NINA]),
    // Review rung: three generations of family words in one grid.
    matchPairs("es-m5-4", [
      "madre",
      "padre",
      "hermano",
      "hermana",
      "hijo",
      "hija",
      "abuelo",
      "abuela",
    ]),
  ],
};

// ─── es-m5-5 — Age: ¿cuántos años tienes? ───────────────────────────────────

const M5_5: LessonContent = {
  id: "es-m5-5",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "¿Cuántos años tienes?",
  description: "In Spanish you don't turn an age — you have it.",
  estimatedMinutes: 6,
  xpReward: 13,
  steps: [
    infoStep(
      "es-m5-5-info-age",
      "Age works with tener",
      "Spanish doesn't say you ARE ten years old — you HAVE ten years: tengo diez años. One year old is un año (mind the ñ — AH-nyo). Ask someone's age with ¿cuántos años tienes?, literally 'how many years do you have?'.",
      "grammar",
    ),
    phrase("es-m5-5-p-cuantos", "how old are you?", "¿cuántos años tienes?"),
    phrase("es-m5-5-p-nino", "the boy", "el niño", undefined, { emoji: "👦" }),
    listeningCompSentence({
      id: "es-m5-5-lc-cuantos",
      audioText: "¿cuántos años tienes?",
      correctMeaningEn: "How old are you?",
      distractorsEn: ["What's your name?", "Where are you from?", "How many brothers do you have?"],
      exercisedAtomSurfaces: ["¿cuántos años tienes?"],
    }),
    sentenceMcq({
      id: "es-m5-5-q-anos",
      prompt: "'I am eight years old.' — which is correct?",
      correctText: "tengo ocho años",
      distractorsText: ["soy ocho años", "tengo ocho año", "soy ocho año"],
      explanation: "Age takes the 'have' verb plus the plural of the year word.",
      exercisedAtomSurfaces: ["años", "tengo"],
    }),
    phrase("es-m5-5-p-nina", "the girl", "la niña", undefined, { emoji: "👧" }),
    vocabMcq("es-m5-5-mcq-nino", { surface: "niño", meaningEn: "boy", emoji: "👦" }, [NINA, ABUELO, MADRE]),
    vocabMcq("es-m5-5-mcq-nina", { surface: "niña", meaningEn: "girl", emoji: "👧" }, [NINO, ABUELA, PADRE]),
    cloze(
      "es-m5-5-cloze-anos",
      "tengo diez",
      ", ¿y tú?",
      "años",
      ["años", "año", "niños", "días"],
      "I'm ten years old — and you?",
      "tengo diez años, ¿y tú?",
      "Ten of them, so the plural form.",
    ),
  ],
};

// ─── es-m5-6 — Listening focus: ¿quién es? ──────────────────────────────────

const M5_6: LessonContent = {
  id: "es-m5-6",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Escucha — ¿quién es?",
  description: "Who's who — full-sentence ear training.",
  estimatedMinutes: 6,
  xpReward: 14,
  steps: [
    vocab("es-m5-6-p-quien", "who", "quién"),
    listeningCompSentence({
      id: "es-m5-6-lc-familia",
      audioText: "tengo una familia grande",
      correctMeaningEn: "I have a big family",
      distractorsEn: ["I have a small family", "you have a big family", "I have a big house"],
      exercisedAtomSurfaces: ["tengo", "familia"],
    }),
    sentenceMcq({
      id: "es-m5-6-q-quien",
      prompt: "'Who is she?' — pick the Spanish question.",
      correctText: "¿quién es ella?",
      distractorsText: ["¿cómo te llamas?", "¿de dónde eres?", "¿cuántos años tienes?"],
      exercisedAtomSurfaces: ["quién"],
    }),
    listeningBuildSentence({
      id: "es-m5-6-lb-carro",
      target: "mi papá tiene un carro nuevo",
      tiles: ["mi", "papá", "tiene", "un", "carro", "nuevo", "viejo"],
      correctOrder: ["mi", "papá", "tiene", "un", "carro", "nuevo"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mi", "papá", "tiene", "carro"],
    }),
    listeningCompSentence({
      id: "es-m5-6-lc-quien",
      audioText: "¿quién es el niño?",
      correctMeaningEn: "Who is the boy?",
      distractorsEn: ["Who is the girl?", "How old is the boy?", "Where is the boy?"],
      exercisedAtomSurfaces: ["quién", "niño"],
    }),
    listeningBuildSentence({
      id: "es-m5-6-lb-hermano",
      target: "tu hermano es muy simpático",
      tiles: ["tu", "hermano", "es", "muy", "simpático", "bajo"],
      correctOrder: ["tu", "hermano", "es", "muy", "simpático"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["tu", "hermano", "simpático"],
    }),
    listeningCompSentence({
      id: "es-m5-6-lc-hijo",
      audioText: "mi hijo tiene ocho años",
      correctMeaningEn: "my son is eight years old",
      distractorsEn: ["my daughter is eight years old", "my son is ten years old", "my son has eight brothers"],
      exercisedAtomSurfaces: ["hijo", "años"],
    }),
    listeningBuildSentence({
      id: "es-m5-6-lb-gato",
      target: "la niña tiene un gato negro",
      tiles: ["la", "niña", "tiene", "un", "gato", "negro", "blanco"],
      correctOrder: ["la", "niña", "tiene", "un", "gato", "negro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["niña", "tiene", "gato"],
    }),
    listeningCompSentence({
      id: "es-m5-6-lc-mexico",
      audioText: "su familia es de México",
      correctMeaningEn: "his family is from Mexico",
      distractorsEn: ["my family is from Mexico", "his family is from Spain", "his family is big"],
      exercisedAtomSurfaces: ["su", "familia"],
    }),
  ],
};

// ─── es-m5-7 — Integration: esposo, esposa, también; de ─────────────────────

const M5_7: LessonContent = {
  id: "es-m5-7",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "La familia de Ana",
  description: "Whose is it? Possession with de — and two more people.",
  estimatedMinutes: 6,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m5-7-info-familia",
      "La familia",
      "Across Latin America, family is the center of gravity — Sunday lunch at the grandparents' house routinely gathers three generations, and 'familia' stretches to cousins, in-laws, and lifelong friends. Ask about someone's family early; it's warm, not nosy.",
      "culture",
    ),
    phrase("es-m5-7-p-esposo", "the husband", "el esposo", undefined, { emoji: "🤵" }),
    phrase("es-m5-7-p-esposa", "the wife", "la esposa", undefined, { emoji: "👰" }),
    vocabMcq("es-m5-7-mcq-esposo", { surface: "esposo", meaningEn: "husband", emoji: "🤵" }, [ESPOSA, ABUELO, PADRE]),
    cloze(
      "es-m5-7-cloze-de",
      "es la casa",
      "mi abuela",
      "de",
      ["de", "en", "y", "o"],
      "it's my grandmother's house",
      "es la casa de mi abuela",
      "Ownership runs through this little link — the house 'of' the owner.",
    ),
    vocab("es-m5-7-p-tambien", "also", "también"),
    build(
      "es-m5-7-build-esposo",
      "Build: 'Ana's husband is tall.'",
      "el esposo de Ana es alto",
      ["el", "esposo", "de", "Ana", "es", "alto", "bajo"],
      ["el", "esposo", "de", "Ana", "es", "alto"],
      ["esposo", "de", "alto"],
    ),
    sentenceMcq({
      id: "es-m5-7-q-tambien",
      prompt: "'My mom is also a doctor.' — which is correct?",
      correctText: "mi mamá también es doctora",
      distractorsText: ["mi mamá muy es doctora", "mi mamá pero es doctora", "mi mamá y es doctora"],
      exercisedAtomSurfaces: ["también", "mamá"],
    }),
    speaking(
      "es-m5-7-speak-tambien",
      "tengo un hermano y también una hermana",
      "I have a brother and also a sister",
      ["tengo", "también", "hermano", "hermana"],
    ),
    // Text-front recognition rung — también has no emoji, so it skipped
    // the image-MCQ rung.
    vocabTextMcq("es-m5-7-tmcq-tambien", "también", ["muy", "pero", "y"]),
    // Integration finale: everything from m2–m5 by ear — quién, family,
    // tener + age, and an m4 adjective agreeing with its subject.
    dialogueListen({
      id: "es-m5-7-dlg-hermana",
      lines: [
        { speaker: "Ana", text: "¿Quién es ella, Luis?" },
        { speaker: "Luis", text: "Es mi hermana. Tiene diez años." },
        { speaker: "Ana", text: "¡Tu hermana es muy alta!" },
      ],
      questions: [
        {
          id: "q1",
          prompt: "Who is the girl?",
          correctText: "Luis's sister",
          distractors: ["Luis's daughter", "Ana's sister", "Luis's grandmother"],
        },
        {
          id: "q2",
          prompt: "How old is she?",
          correctText: "ten years old",
          distractors: ["eight years old", "nine years old", "two years old"],
        },
      ],
      exercisedAtomSurfaces: ["quién", "hermana", "tiene", "años"],
    }),
  ],
};

// ─── es-m5-8 — Mastery test ─────────────────────────────────────────────────

const M5_8: LessonContent = {
  id: "es-m5-8",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "es",
  title: "M5 Mastery Test",
  description: "Family, mi/tu/su, tener, possession with de, and age.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    sentenceMcq({
      id: "es-m5-8-q-tengo",
      prompt: "'I have two brothers.' — which is correct?",
      correctText: "tengo dos hermanos",
      distractorsText: ["tienes dos hermanos", "tengo dos hermanas", "tiene dos hermanos"],
      exercisedAtomSurfaces: ["tengo", "hermano"],
    }),
    vocabMcq("es-m5-8-mcq-abuela", { surface: "abuela", meaningEn: "grandmother", emoji: "👵" }, [ABUELO, ESPOSO, MADRE]),
    cloze(
      "es-m5-8-cloze-mi",
      "ella es",
      "hermana",
      "mi",
      ["mi", "tu", "su", "la"],
      "she is my sister",
      "ella es mi hermana",
    ),
    listeningCompSentence({
      id: "es-m5-8-lc-cuantos",
      audioText: "¿cuántos años tienes?",
      correctMeaningEn: "How old are you?",
      distractorsEn: ["How many sisters do you have?", "Who is your dad?", "What's your name?"],
      exercisedAtomSurfaces: ["¿cuántos años tienes?"],
    }),
    translateStep({
      id: "es-m5-8-tr-anos",
      promptEn: "I am nine years old",
      // Accent-less variants accepted per the spine's grading-leniency rule
      // (full diacritic strip, ñ→n included — keyboard leniency).
      acceptedAnswers: [
        "tengo nueve años",
        "Tengo nueve años",
        "tengo nueve anos",
        "Tengo nueve anos",
        "yo tengo nueve años",
        "Yo tengo nueve años",
      ],
      audioText: "tengo nueve años",
      exercisedAtomSurfaces: ["tengo", "años"],
    }),
    build(
      "es-m5-8-build-casa",
      "Build: 'My dad's house is big.'",
      "la casa de mi papá es grande",
      ["la", "casa", "de", "mi", "papá", "es", "grande"],
      ["la", "casa", "de", "mi", "papá", "es", "grande"],
      ["de", "mi", "papá"],
    ),
    sentenceMcq({
      id: "es-m5-8-q-su",
      prompt: "'Her son is very tall.' — which is correct?",
      correctText: "su hijo es muy alto",
      distractorsText: ["su hija es muy alta", "mi hijo es muy alto", "tu hijo es muy bajo"],
      exercisedAtomSurfaces: ["su", "hijo"],
    }),
    listeningBuildSentence({
      id: "es-m5-8-lb-madre",
      target: "mi madre tiene un carro rojo",
      tiles: ["mi", "madre", "tiene", "un", "carro", "rojo", "negro"],
      correctOrder: ["mi", "madre", "tiene", "un", "carro", "rojo"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mi", "madre", "tiene"],
    }),
    speaking("es-m5-8-speak-quien", "¿quién es tu papá?", "Who is your dad?", ["quién", "tu", "papá"]),
  ],
};

export const ES_M5_LESSONS: LessonContent[] = [
  M5_1,
  M5_2,
  M5_3,
  M5_4,
  M5_5,
  M5_6,
  M5_7,
  M5_8,
];

// ─── Placement (1 screener + 4 stage-2 items, spine §Placement bank) ────────

export const ES_M5_PLACEMENT: {
  screener: PlacementItem[];
  byModule: PlacementItem[];
} = {
  screener: [
    {
      id: "pt-es-screen-m5",
      moduleId: "m5",
      build: () =>
        sentenceMcq({
          id: "pt-es-screen-m5",
          prompt: "'I am ten years old.' — which is correct?",
          correctText: "tengo diez años",
          distractorsText: ["soy diez años", "tengo diez año", "es diez años"],
        }),
    },
  ],
  byModule: [
    {
      id: "pt-es-m5-1",
      moduleId: "m5",
      build: () =>
        cloze(
          "pt-es-m5-1",
          "yo",
          "dos hermanos",
          "tengo",
          ["tengo", "tienes", "tiene", "tener"],
          "I have two brothers",
          "yo tengo dos hermanos",
        ),
    },
    {
      id: "pt-es-m5-2",
      moduleId: "m5",
      build: () =>
        sentenceMcq({
          id: "pt-es-m5-2",
          prompt: "'Ana's car' — which is correct?",
          correctText: "el carro de Ana",
          distractorsText: ["el carro es Ana", "Ana el carro", "el carro y Ana"],
        }),
    },
    {
      id: "pt-es-m5-3",
      moduleId: "m5",
      build: () =>
        sentenceMcq({
          id: "pt-es-m5-3",
          prompt: "'She has a son.' — which is correct?",
          correctText: "ella tiene un hijo",
          distractorsText: ["ella tengo un hijo", "ella tienes un hijo", "ella tener un hijo"],
        }),
    },
    {
      id: "pt-es-m5-4",
      moduleId: "m5",
      build: () =>
        cloze(
          "pt-es-m5-4",
          "ella es",
          "hija",
          "su",
          ["su", "mi", "tu", "la"],
          "she is his daughter",
          "ella es su hija",
        ),
    },
  ],
};
