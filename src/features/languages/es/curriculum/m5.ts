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
 * 2026-07-16 JA-standard reauthor: every topic lesson expanded to
 * 18-22 retrieval-heavy steps, production added to the four lessons that
 * had none (L1, L4, L5, L6 — typed translate + speaking/build), a
 * compounding review tail (reviewMatchPairs + a hand-picked prior-module
 * production item) appended from L2 on, one selfExplain landed per
 * grammar lesson (L1 mi-invariance, L2 tener endings, L3 su-ambiguity,
 * L4 tu/tú accent, L5 tener-for-age, L7 de-for-possession), the m5-2
 * 4-run of selection steps broken up, and every remaining
 * answer-leaking "El X es ___ (gloss)" prompt replaced with a Spanish
 * context sentence or a translation-style MCQ.
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
  phrase,
  reviewMatchPairs,
  selfExplain,
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

// ─── M5 atoms (exactly the spine allocation — UNCHANGED) ───────────────────

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
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m5-1-info-mi",
      "Mi — my",
      "mi means 'my' and never changes for gender: mi padre, mi madre. With more than one of something it adds -s: mis hermanos (my brothers). No 'el' or 'la' needed — the possessive replaces the article.",
      "grammar",
    ),
    phrase("es-m5-1-p-familia", "the family", "la familia", undefined, { emoji: "👪" }),
    vocabMcq("es-m5-1-mcq-familia", { surface: "familia", meaningEn: "family", emoji: "👪" }, [MADRE, PADRE, NINO]),
    speaking(
      "es-m5-1-speak-familia",
      "mi familia es grande",
      "my family is big",
      ["mi", "familia", "grande"],
    ),
    phrase("es-m5-1-p-madre", "the mother", "la madre", undefined, { emoji: "👩" }),
    vocabMcq("es-m5-1-mcq-madre", { surface: "madre", meaningEn: "mother", emoji: "👩" }, [PADRE, ABUELA, FAMILIA]),
    cloze(
      "es-m5-1-cloze-mi-madre",
      "es",
      "madre",
      "mi",
      ["mi", "tu", "su", "la"],
      "she's my mother",
      "es mi madre",
      "The owner is 'I', so the possessive is mi.",
      ["madre"],
    ),
    phrase("es-m5-1-p-padre", "the father", "el padre", undefined, { emoji: "👨" }),
    vocabMcq("es-m5-1-mcq-padre", { surface: "padre", meaningEn: "father", emoji: "👨" }, [MADRE, ABUELO, NINO]),
    sentenceMcq({
      id: "es-m5-1-q-mi-familia",
      prompt: "Alguien pregunta por tu familia. Tú dices: '___ familia es grande.'",
      correctText: "mi",
      distractorsText: ["tu", "su", "la"],
      exercisedAtomSurfaces: ["mi", "familia"],
    }),
    build(
      "es-m5-1-build-padre",
      "Build: 'My father is tall.'",
      "mi padre es alto",
      ["mi", "padre", "es", "alto", "bajo"],
      ["mi", "padre", "es", "alto"],
      ["padre", "alto"],
    ),
    listeningCompSentence({
      id: "es-m5-1-lc-familia",
      audioText: "mi familia es grande",
      correctMeaningEn: "my family is big",
      distractorsEn: ["my family is small", "my house is big", "your family is big"],
      exercisedAtomSurfaces: ["mi", "familia"],
    }),
    translateStep({
      id: "es-m5-1-tr-madre",
      promptEn: "My mother is tall",
      acceptedAnswers: [
        "mi madre es alta",
        "Mi madre es alta",
        "mi madre es alta.",
        "Mi madre es alta.",
      ],
      audioText: "mi madre es alta",
      exercisedAtomSurfaces: ["madre", "mi", "alto"],
    }),
    sentenceMcq({
      id: "es-m5-1-q-padre-adj",
      prompt: "Mi padre no es bajo. Es muy ___.",
      correctText: "alto",
      distractorsText: ["baja", "bajos", "alta"],
      exercisedAtomSurfaces: ["padre", "alto"],
    }),
    speaking(
      "es-m5-1-speak-papa-simpatico",
      "mi padre es muy simpático",
      "my father is very nice",
      ["padre", "simpático"],
    ),
    listeningBuildSentence({
      id: "es-m5-1-lb-madre-mexico",
      target: "mi madre es de México",
      tiles: ["mi", "madre", "es", "de", "México", "España"],
      correctOrder: ["mi", "madre", "es", "de", "México"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["madre", "mi"],
    }),
    selfExplain({
      id: "es-m5-1-self-explain",
      anchorLabel: "You wrote: mi familia es grande",
      anchorAudioText: "mi familia es grande",
      question: "Why does mi not change to match familia's gender?",
      rule: { text: "mi never changes for gender — it only adds -s for plural: mi hermano, mi hermana, mis hermanos." },
      surface: { text: "mi matches the noun's gender the way adjectives do." },
      distractor: { text: "mi is short for 'la mi', so the article is already built in." },
      ruleExplanation:
        "Unlike -o/-a adjectives, mi/tu don't agree in gender — only in number. Su works the same way.",
    }),
    infoStep(
      "es-m5-1-info-win",
      "Family, unlocked",
      "You can now introduce your closest family members and say they're yours.",
      "win",
    ),
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
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m5-2-info-tener",
      "Tener — to have",
      "tener is the dictionary form of 'to have'. In the singular: tengo (I have), tienes (you have), tiene (he or she has). yo tengo un hermano — I have a brother. As with ser, the ending does the work, so yo and tú are optional.",
      "grammar",
    ),
    phrase("es-m5-2-p-hermano", "the brother", "el hermano"),
    // Text-front recognition rung — hermano carries no emoji (the fitting
    // glyphs would collide with madre/padre/niño/niña), so it skipped the
    // image-MCQ rung.
    vocabTextMcq("es-m5-2-tmcq-hermano", "hermano", ["hermana", "padre", "madre"]),
    speaking(
      "es-m5-2-speak-hermano",
      "tengo un hermano",
      "I have a brother",
      ["tengo", "hermano"],
    ),
    phrase("es-m5-2-p-hermana", "the sister", "la hermana"),
    sentenceMcq({
      id: "es-m5-2-q-hermana",
      prompt: "Ella no tiene hermanos, solo una ___.",
      correctText: "hermana",
      distractorsText: ["hermano", "madre", "hija"],
      exercisedAtomSurfaces: ["hermana"],
    }),
    listeningCompSentence({
      id: "es-m5-2-lc-hermanas",
      audioText: "tengo dos hermanas",
      correctMeaningEn: "I have two sisters",
      distractorsEn: ["I have two brothers", "you have two sisters", "I have three sisters"],
      exercisedAtomSurfaces: ["tengo", "hermana"],
    }),
    build(
      "es-m5-2-build-tienes",
      "Build: 'You have a brother.'",
      "tienes un hermano",
      ["tienes", "un", "hermano", "tengo", "hermana"],
      ["tienes", "un", "hermano"],
      ["tienes", "hermano"],
    ),
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
    sentenceMcq({
      id: "es-m5-2-q-tienes",
      prompt: "Le pregunto a mi amigo: '¿___ un hermano?'",
      correctText: "tienes",
      distractorsText: ["tengo", "tiene", "tener"],
      exercisedAtomSurfaces: ["tienes", "hermano"],
    }),
    speaking(
      "es-m5-2-speak-tiene-perro",
      "mi hermano tiene un perro",
      "my brother has a dog",
      ["hermano", "tiene", "perro"],
    ),
    listeningCompSentence({
      id: "es-m5-2-lc-hermano-hermana",
      audioText: "tiene un hermano y una hermana",
      correctMeaningEn: "he has one brother and one sister",
      distractorsEn: ["he has two brothers", "she has two sisters", "I have one brother and one sister"],
      exercisedAtomSurfaces: ["tiene", "hermano", "hermana"],
    }),
    selfExplain({
      id: "es-m5-2-self-explain",
      anchorLabel: "You wrote: mi hermano tiene un perro",
      anchorAudioText: "mi hermano tiene un perro",
      question: "Why tiene and not tienes here?",
      rule: { text: "tiene is the he/she form — hermano ('he') needs it, not tú ('you')." },
      surface: { text: "tiene is used whenever the sentence is about a person." },
      distractor: { text: "tiene is the plural form of tener." },
      ruleExplanation:
        "tengo = I have, tienes = you have, tiene = he/she has — the ending marks who's doing the having, so the subject pronoun is optional.",
    }),
    speaking(
      "es-m5-2-speak-final",
      "yo tengo una hermana simpática",
      "I have a nice sister",
      ["tengo", "hermana", "simpático"],
    ),
    reviewMatchPairs("es-m5-2-rev", "es-m5-2-rev-seed", "m5", 6),
    cloze(
      "es-m5-2-rev-cloze-de",
      "el perro",
      "mi hermano",
      "de",
      ["de", "en", "y", "o"],
      "my brother's dog",
      "el perro de mi hermano",
      "Ownership runs through de — the dog 'of' the owner.",
      ["hermano"],
    ),
    infoStep(
      "es-m5-2-info-win",
      "You have people now",
      "You can now say who's in your family and that you have them.",
      "win",
    ),
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
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m5-3-info-su",
      "Su — one word, three owners",
      "su covers 'his', 'her', and formal 'your': su hijo can be his son, her son, or your son — context tells you whose. Like mi and tu, it adds -s with plurals: sus hijos. And the third person of tener is tiene: ella tiene una hija.",
      "grammar",
    ),
    phrase("es-m5-3-p-hijo", "the son", "el hijo"),
    // Text-front recognition rung — hijo carries no emoji.
    vocabTextMcq("es-m5-3-tmcq-hijo", "hijo", ["hija", "padre", "hermano"]),
    speaking(
      "es-m5-3-speak-hijo",
      "ella tiene un hijo",
      "she has a son",
      ["tiene", "hijo"],
    ),
    phrase("es-m5-3-p-hija", "the daughter", "la hija"),
    vocabTextMcq("es-m5-3-tmcq-hija", "hija", ["hijo", "madre", "hermana"]),
    cloze(
      "es-m5-3-cloze-su",
      "ella es",
      "hija",
      "su",
      ["su", "mi", "tu", "la"],
      "she is his daughter",
      "ella es su hija",
      "Third-person owner — his, her, or formal your.",
      ["hija"],
    ),
    build(
      "es-m5-3-build-hijos",
      "Build: 'She has two sons.'",
      "ella tiene dos hijos",
      ["ella", "tiene", "dos", "hijos", "hijas", "tengo"],
      ["ella", "tiene", "dos", "hijos"],
      ["tiene", "hijo"],
    ),
    sentenceMcq({
      id: "es-m5-3-q-tiene",
      prompt: "Mi amiga no tiene hijos, pero mi hermano sí ___ uno.",
      correctText: "tiene",
      distractorsText: ["tienes", "tengo", "tener"],
      exercisedAtomSurfaces: ["tiene"],
    }),
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
    sentenceMcq({
      id: "es-m5-3-q-hijo",
      prompt: "'His son' — which is correct?",
      correctText: "su hijo",
      distractorsText: ["su hija", "mi hijo", "tu hijo"],
      exercisedAtomSurfaces: ["su", "hijo"],
    }),
    listeningCompSentence({
      id: "es-m5-3-lc-hija",
      audioText: "su hija es muy inteligente",
      correctMeaningEn: "his daughter is very intelligent",
      distractorsEn: ["his son is very intelligent", "my daughter is very intelligent", "his daughter is very tall"],
      exercisedAtomSurfaces: ["su", "hija"],
    }),
    speaking(
      "es-m5-3-speak-su-casa",
      "su casa es muy bonita",
      "his house is very pretty",
      ["su"],
    ),
    selfExplain({
      id: "es-m5-3-self-explain",
      anchorLabel: "You wrote: su casa es muy bonita",
      anchorAudioText: "su casa es muy bonita",
      question: "Who could 'su' refer to here?",
      rule: { text: "su can mean his, her, or formal your — Spanish leaves it to context to clarify whose house it is." },
      surface: { text: "su always means 'his' unless the sentence names a woman." },
      distractor: { text: "su only works for third-person plural — 'their'." },
      ruleExplanation:
        "mi/tu are unambiguous (my/your-informal), but su covers three owners — él, ella, and usted. Add de + name (la casa de Ana) when you need to be specific.",
    }),
    translateStep({
      id: "es-m5-3-tr-hija-inteligente",
      promptEn: "His daughter is very intelligent",
      acceptedAnswers: [
        "su hija es muy inteligente",
        "Su hija es muy inteligente",
        "su hija es muy inteligente.",
        "Su hija es muy inteligente.",
      ],
      audioText: "su hija es muy inteligente",
      exercisedAtomSurfaces: ["su", "hija", "inteligente"],
    }),
    reviewMatchPairs("es-m5-3-rev", "es-m5-3-rev-seed", "m5", 6),
    sentenceMcq({
      id: "es-m5-3-rev-q-libros",
      prompt: "'I have three books.' — which is correct?",
      correctText: "tengo tres libros",
      distractorsText: ["tengo tres libro", "tienes tres libros", "tengo tres libras"],
      exercisedAtomSurfaces: ["tengo", "libro"],
    }),
    infoStep(
      "es-m5-3-info-win",
      "Whose is it?",
      "You can now say who belongs to someone else — mom, dad, or you.",
      "win",
    ),
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
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m5-4-info-tu",
      "Tu vs tú",
      "One accent, two words: tú (with the accent) means 'you'; tu (without it) means 'your'. tú eres alto — you are tall; tu mamá — your mom. At home, Spanish speakers usually say mamá and papá rather than madre and padre.",
      "grammar",
    ),
    phrase("es-m5-4-p-mama", "the mom", "la mamá"),
    vocabTextMcq("es-m5-4-tmcq-mama", "mamá", ["papá", "madre", "abuela"]),
    speaking(
      "es-m5-4-speak-mama",
      "tu mamá es muy simpática",
      "your mom is very nice",
      ["tu", "mamá", "simpático"],
    ),
    phrase("es-m5-4-p-papa", "the dad", "el papá"),
    vocabTextMcq("es-m5-4-tmcq-papa", "papá", ["mamá", "padre", "abuelo"]),
    build(
      "es-m5-4-build-papa",
      "Build: 'My dad is tall.'",
      "mi papá es alto",
      ["mi", "papá", "es", "alto", "baja"],
      ["mi", "papá", "es", "alto"],
      ["papá", "alto"],
    ),
    sentenceMcq({
      id: "es-m5-4-q-tu",
      prompt: "Le pregunto a mi amigo: '¿Cómo está ___ papá?'",
      correctText: "tu",
      distractorsText: ["tú", "mi", "su"],
      exercisedAtomSurfaces: ["tu", "papá"],
    }),
    phrase("es-m5-4-p-abuelo", "the grandfather", "el abuelo", undefined, { emoji: "👴" }),
    vocabMcq("es-m5-4-mcq-abuelo", { surface: "abuelo", meaningEn: "grandfather", emoji: "👴" }, [ABUELA, PADRE, NINO]),
    sentenceMcq({
      id: "es-m5-4-q-abuelo",
      prompt: "Es el papá de mi papá. Es mi ___.",
      correctText: "abuelo",
      distractorsText: ["abuela", "padre", "hermano"],
      exercisedAtomSurfaces: ["abuelo"],
    }),
    phrase("es-m5-4-p-abuela", "the grandmother", "la abuela", undefined, { emoji: "👵" }),
    vocabMcq("es-m5-4-mcq-abuela", { surface: "abuela", meaningEn: "grandmother", emoji: "👵" }, [ABUELO, MADRE, NINA]),
    listeningCompSentence({
      id: "es-m5-4-lc-abuela",
      audioText: "mi abuela es de España",
      correctMeaningEn: "my grandmother is from Spain",
      distractorsEn: ["my grandmother is from Mexico", "my grandfather is from Spain", "my grandmother is very tall"],
      exercisedAtomSurfaces: ["abuela"],
    }),
    speaking(
      "es-m5-4-speak-abuelo-alto",
      "mi abuelo es muy alto",
      "my grandfather is very tall",
      ["abuelo", "alto"],
    ),
    translateStep({
      id: "es-m5-4-tr-abuela",
      promptEn: "My grandmother is very nice",
      acceptedAnswers: [
        "mi abuela es muy simpática",
        "Mi abuela es muy simpática",
        "mi abuela es muy simpatica",
        "Mi abuela es muy simpatica",
      ],
      audioText: "mi abuela es muy simpática",
      exercisedAtomSurfaces: ["abuela", "simpático"],
    }),
    selfExplain({
      id: "es-m5-4-self-explain",
      anchorLabel: "You wrote: tu mamá es muy simpática",
      anchorAudioText: "tu mamá es muy simpática",
      question: "Why no accent mark on tu here?",
      rule: { text: "tu (no accent) is the possessive 'your'; tú (with an accent) is the subject pronoun 'you'. Naming an owner drops the accent." },
      surface: { text: "tu never gets an accent because it's a short word." },
      distractor: { text: "tu drops the accent because it comes before a feminine noun." },
      ruleExplanation:
        "The accent is the only difference: tú = you (pronoun), tu = your (possessive). If you're naming an owner, drop the accent.",
    }),
    reviewMatchPairs("es-m5-4-rev", "es-m5-4-rev-seed", "m5", 6),
    sentenceMcq({
      id: "es-m5-4-rev-q-carro",
      prompt: "'The blue car is very big.' — which is correct?",
      correctText: "el carro azul es muy grande",
      distractorsText: ["el carro azul es muy grandes", "la carro azul es muy grande", "el carro azules es muy grande"],
      exercisedAtomSurfaces: ["carro", "azul", "muy", "grande"],
    }),
    infoStep(
      "es-m5-4-info-win",
      "The whole family",
      "You can now talk about your whole family, from mom to grandpa.",
      "win",
    ),
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
  estimatedMinutes: 7,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m5-5-info-age",
      "Age works with tener",
      "Spanish doesn't say you ARE ten years old — you HAVE ten years: tengo diez años. One year old is un año (mind the ñ — AH-nyo). Ask someone's age with ¿cuántos años tienes?, literally 'how many years do you have?'.",
      "grammar",
    ),
    phrase("es-m5-5-p-cuantos", "how old are you?", "¿cuántos años tienes?"),
    listeningCompSentence({
      id: "es-m5-5-lc-cuantos",
      audioText: "¿cuántos años tienes?",
      correctMeaningEn: "How old are you?",
      distractorsEn: ["What's your name?", "Where are you from?", "How many brothers do you have?"],
      exercisedAtomSurfaces: ["¿cuántos años tienes?"],
    }),
    speaking(
      "es-m5-5-speak-cuantos",
      "¿cuántos años tienes?",
      "How old are you?",
      ["¿cuántos años tienes?"],
    ),
    phrase("es-m5-5-p-nino", "the boy", "el niño", undefined, { emoji: "👦" }),
    vocabMcq("es-m5-5-mcq-nino", { surface: "niño", meaningEn: "boy", emoji: "👦" }, [NINA, ABUELO, MADRE]),
    sentenceMcq({
      id: "es-m5-5-q-nino",
      prompt: "Mi hermano tiene diez años. Todavía es un ___.",
      correctText: "niño",
      distractorsText: ["niña", "hermano", "abuelo"],
      exercisedAtomSurfaces: ["niño"],
    }),
    phrase("es-m5-5-p-nina", "the girl", "la niña", undefined, { emoji: "👧" }),
    vocabMcq("es-m5-5-mcq-nina", { surface: "niña", meaningEn: "girl", emoji: "👧" }, [NINO, ABUELA, PADRE]),
    listeningCompSentence({
      id: "es-m5-5-lc-nina",
      audioText: "la niña tiene siete años",
      correctMeaningEn: "the girl is seven years old",
      distractorsEn: ["the boy is seven years old", "the girl is eight years old", "the girl has a brother"],
      exercisedAtomSurfaces: ["niña", "años"],
    }),
    build(
      "es-m5-5-build-diez",
      "Build: 'I'm ten years old.'",
      "tengo diez años",
      ["tengo", "diez", "años", "ocho", "nueve"],
      ["tengo", "diez", "años"],
      ["tengo", "años"],
    ),
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
    sentenceMcq({
      id: "es-m5-5-q-anos-verbo",
      prompt: "Mi hermana ___ ocho años.",
      correctText: "tiene",
      distractorsText: ["es", "tienes", "tengo"],
      exercisedAtomSurfaces: ["tiene", "años"],
    }),
    translateStep({
      id: "es-m5-5-tr-anos",
      promptEn: "I am nine years old",
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
    selfExplain({
      id: "es-m5-5-self-explain",
      anchorLabel: "You wrote: tengo nueve años",
      anchorAudioText: "tengo nueve años",
      question: "Why tengo (have) instead of soy (am) for age?",
      rule: { text: "Spanish expresses age as something you HAVE, not something you ARE — tengo nueve años literally means 'I have nine years.'" },
      surface: { text: "tengo is used because años is a noun, and soy only works with adjectives." },
      distractor: { text: "tengo is used for temporary ages, soy for permanent ones." },
      ruleExplanation:
        "Age, like hunger or heat, is a 'have' expression in Spanish: tener + number + años. English says 'I am 9'; Spanish says 'I have 9 years.'",
    }),
    speaking(
      "es-m5-5-speak-nino-cinco",
      "mi niño tiene cinco años",
      "my boy is five years old",
      ["niño", "tiene", "años"],
    ),
    reviewMatchPairs("es-m5-5-rev", "es-m5-5-rev-seed", "m5", 6),
    sentenceMcq({
      id: "es-m5-5-rev-q-inteligente",
      prompt: "'She is very intelligent.' — which is correct?",
      correctText: "ella es muy inteligente",
      distractorsText: ["ella es muy inteligentes", "ella eres muy inteligente", "ella es muy interesante"],
      exercisedAtomSurfaces: ["inteligente", "muy"],
    }),
    infoStep(
      "es-m5-5-info-win",
      "Ages, unlocked",
      "You can now ask and tell anyone's age — no more, no less.",
      "win",
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
  estimatedMinutes: 7,
  xpReward: 16,
  steps: [
    vocab("es-m5-6-p-quien", "who", "quién"),
    sentenceMcq({
      id: "es-m5-6-q-quien",
      prompt: "'Who is she?' — pick the Spanish question.",
      correctText: "¿quién es ella?",
      distractorsText: ["¿cómo te llamas?", "¿de dónde eres?", "¿cuántos años tienes?"],
      exercisedAtomSurfaces: ["quién"],
    }),
    listeningCompSentence({
      id: "es-m5-6-lc-quien",
      audioText: "¿quién es el niño?",
      correctMeaningEn: "Who is the boy?",
      distractorsEn: ["Who is the girl?", "How old is the boy?", "Where is the boy?"],
      exercisedAtomSurfaces: ["quién", "niño"],
    }),
    listeningBuildSentence({
      id: "es-m5-6-lb-carro",
      target: "mi papá tiene un carro nuevo",
      tiles: ["mi", "papá", "tiene", "un", "carro", "nuevo", "viejo"],
      correctOrder: ["mi", "papá", "tiene", "un", "carro", "nuevo"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mi", "papá", "tiene", "carro"],
    }),
    speaking(
      "es-m5-6-speak-quien-papa",
      "¿quién es tu papá?",
      "Who is your dad?",
      ["quién", "tu", "papá"],
    ),
    listeningCompSentence({
      id: "es-m5-6-lc-familia",
      audioText: "tengo una familia grande",
      correctMeaningEn: "I have a big family",
      distractorsEn: ["I have a small family", "you have a big family", "I have a big house"],
      exercisedAtomSurfaces: ["tengo", "familia"],
    }),
    listeningBuildSentence({
      id: "es-m5-6-lb-hermano",
      target: "tu hermano es muy simpático",
      tiles: ["tu", "hermano", "es", "muy", "simpático", "bajo"],
      correctOrder: ["tu", "hermano", "es", "muy", "simpático"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["tu", "hermano", "simpático"],
    }),
    translateStep({
      id: "es-m5-6-tr-hijo",
      promptEn: "My son is eight years old",
      acceptedAnswers: [
        "mi hijo tiene ocho años",
        "Mi hijo tiene ocho años",
        "mi hijo tiene ocho anos",
        "Mi hijo tiene ocho anos",
      ],
      audioText: "mi hijo tiene ocho años",
      exercisedAtomSurfaces: ["hijo", "tiene", "años"],
    }),
    listeningCompSentence({
      id: "es-m5-6-lc-abuelo",
      audioText: "¿quién es el abuelo?",
      correctMeaningEn: "Who is the grandfather?",
      distractorsEn: ["Who is the grandmother?", "How old is the grandfather?", "Where is the grandfather?"],
      exercisedAtomSurfaces: ["quién", "abuelo"],
    }),
    listeningBuildSentence({
      id: "es-m5-6-lb-gato",
      target: "la niña tiene un gato negro",
      tiles: ["la", "niña", "tiene", "un", "gato", "negro", "blanco"],
      correctOrder: ["la", "niña", "tiene", "un", "gato", "negro"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["niña", "tiene", "gato"],
    }),
    build(
      "es-m5-6-build-abuela",
      "Build: 'Who is your grandmother?'",
      "¿quién es tu abuela?",
      ["quién", "es", "tu", "abuela", "abuelo"],
      ["quién", "es", "tu", "abuela"],
      ["quién", "abuela"],
    ),
    listeningCompSentence({
      id: "es-m5-6-lc-mexico",
      audioText: "su familia es de México",
      correctMeaningEn: "his family is from Mexico",
      distractorsEn: ["my family is from Mexico", "his family is from Spain", "his family is big"],
      exercisedAtomSurfaces: ["su", "familia"],
    }),
    sentenceMcq({
      id: "es-m5-6-q-nina",
      prompt: "No es niño, es ___.",
      correctText: "niña",
      distractorsText: ["niño", "hija", "abuela"],
      exercisedAtomSurfaces: ["niña"],
    }),
    speaking(
      "es-m5-6-speak-nino-perro",
      "el niño tiene un perro negro",
      "the boy has a black dog",
      ["niño", "tiene"],
    ),
    listeningCompSentence({
      id: "es-m5-6-lc-nino-simpatico",
      audioText: "el niño es alto y simpático",
      correctMeaningEn: "the boy is tall and nice",
      distractorsEn: ["the girl is tall and nice", "the boy is short and nice", "the boy is tall and old"],
      exercisedAtomSurfaces: ["niño"],
    }),
    reviewMatchPairs("es-m5-6-rev", "es-m5-6-rev-seed", "m5", 6),
    listeningCompSentence({
      id: "es-m5-6-rev-lc-gato",
      audioText: "el gato negro es muy bonito",
      correctMeaningEn: "the black cat is very pretty",
      distractorsEn: ["the black dog is very pretty", "the white cat is very pretty", "the black cat is very big"],
      exercisedAtomSurfaces: ["gato", "negro", "bonito"],
    }),
    infoStep(
      "es-m5-6-info-win",
      "You're listening in",
      "You can now follow a conversation about someone's family, just by listening.",
      "win",
    ),
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
  estimatedMinutes: 7,
  xpReward: 17,
  steps: [
    infoStep(
      "es-m5-7-info-familia",
      "La familia",
      "Across Latin America, family is the center of gravity — Sunday lunch at the grandparents' house routinely gathers three generations, and 'familia' stretches to cousins, in-laws, and lifelong friends. Ask about someone's family early; it's warm, not nosy.",
      "culture",
    ),
    phrase("es-m5-7-p-esposo", "the husband", "el esposo", undefined, { emoji: "🤵" }),
    vocabMcq("es-m5-7-mcq-esposo", { surface: "esposo", meaningEn: "husband", emoji: "🤵" }, [ESPOSA, ABUELO, PADRE]),
    speaking(
      "es-m5-7-speak-esposo",
      "mi esposo es muy simpático",
      "my husband is very nice",
      ["esposo", "simpático"],
    ),
    infoStep(
      "es-m5-7-info-de",
      "De — whose is it?",
      "To say something belongs to someone, link them with de: la casa de mi abuela — my grandmother's house, literally 'the house of my grandmother.' Spanish has no apostrophe-s; de plus the owner does that job every time.",
      "grammar",
    ),
    phrase("es-m5-7-p-esposa", "the wife", "la esposa", undefined, { emoji: "👰" }),
    vocabMcq("es-m5-7-mcq-esposa", { surface: "esposa", meaningEn: "wife", emoji: "👰" }, [ESPOSO, ABUELA, MADRE]),
    sentenceMcq({
      id: "es-m5-7-q-esposa",
      prompt: "Luis está casado. Su ___ se llama Ana.",
      correctText: "esposa",
      distractorsText: ["esposo", "hermana", "hija"],
      exercisedAtomSurfaces: ["esposa", "su"],
    }),
    build(
      "es-m5-7-build-esposo",
      "Build: 'Ana's husband is tall.'",
      "el esposo de Ana es alto",
      ["el", "esposo", "de", "Ana", "es", "alto", "bajo"],
      ["el", "esposo", "de", "Ana", "es", "alto"],
      ["esposo", "de", "alto"],
    ),
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
    // Text-front recognition rung — también has no emoji, so it skipped
    // the image-MCQ rung.
    vocabTextMcq("es-m5-7-tmcq-tambien", "también", ["muy", "pero", "y"]),
    speaking(
      "es-m5-7-speak-tambien",
      "tengo un hermano y también una hermana",
      "I have a brother and also a sister",
      ["tengo", "también", "hermano", "hermana"],
    ),
    sentenceMcq({
      id: "es-m5-7-q-tambien",
      prompt: "Mi mamá es doctora. Mi papá ___ es doctor.",
      correctText: "también",
      distractorsText: ["muy", "pero", "y"],
      exercisedAtomSurfaces: ["también"],
    }),
    selfExplain({
      id: "es-m5-7-self-explain",
      anchorLabel: "You wrote: la casa de mi abuela",
      anchorAudioText: "la casa de mi abuela",
      question: "Why de instead of an apostrophe-s?",
      rule: { text: "Spanish has no apostrophe-s — de + owner always shows possession: la casa de mi abuela = 'my grandmother's house.'" },
      surface: { text: "de is only used when the owner's name is unknown." },
      distractor: { text: "de is optional here — su abuela casa would also work." },
      ruleExplanation:
        "English 's becomes de + owner in Spanish, and the word order flips: [thing] de [owner] — el carro de Ana, never Ana's carro.",
    }),
    translateStep({
      id: "es-m5-7-tr-llave",
      promptEn: "My friend's key is red",
      acceptedAnswers: [
        "la llave de mi amigo es roja",
        "La llave de mi amigo es roja",
        "la llave de mi amigo es roja.",
        "La llave de mi amigo es roja.",
      ],
      audioText: "la llave de mi amigo es roja",
      exercisedAtomSurfaces: ["llave", "amigo", "rojo", "de"],
    }),
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
    reviewMatchPairs("es-m5-7-rev", "es-m5-7-rev-seed", "m5", 6),
    infoStep(
      "es-m5-7-info-win",
      "It's all yours to say",
      "You can now say whose it is, and add 'me too' to any conversation.",
      "win",
    ),
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
  estimatedMinutes: 7,
  xpReward: 18,
  steps: [
    sentenceMcq({
      id: "es-m5-8-q-tengo",
      prompt: "'I have two brothers.' — which is correct?",
      correctText: "tengo dos hermanos",
      distractorsText: ["tienes dos hermanos", "tengo dos hermanas", "tiene dos hermanos"],
      exercisedAtomSurfaces: ["tengo", "hermano"],
    }),
    vocabMcq("es-m5-8-mcq-abuela", { surface: "abuela", meaningEn: "grandmother", emoji: "👵" }, [ABUELO, ESPOSO, MADRE]),
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
    cloze(
      "es-m5-8-cloze-mi",
      "ella es",
      "hermana",
      "mi",
      ["mi", "tu", "su", "la"],
      "she is my sister",
      "ella es mi hermana",
    ),
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
    sentenceMcq({
      id: "es-m5-8-q-tambien",
      prompt: "Mi papá es doctor. Mi mamá ___ es doctora.",
      correctText: "también",
      distractorsText: ["muy", "pero", "y"],
      exercisedAtomSurfaces: ["también"],
    }),
    listeningCompSentence({
      id: "es-m5-8-lc-cuantos",
      audioText: "¿cuántos años tienes?",
      correctMeaningEn: "How old are you?",
      distractorsEn: ["How many sisters do you have?", "Who is your dad?", "What's your name?"],
      exercisedAtomSurfaces: ["¿cuántos años tienes?"],
    }),
    listeningBuildSentence({
      id: "es-m5-8-lb-madre",
      target: "mi madre tiene un carro rojo",
      tiles: ["mi", "madre", "tiene", "un", "carro", "rojo", "negro"],
      correctOrder: ["mi", "madre", "tiene", "un", "carro", "rojo"],
      promptEn: "Tap what you hear",
      exercisedAtomSurfaces: ["mi", "madre", "tiene"],
    }),
    vocabTextMcq("es-m5-8-tmcq-nina", "niña", ["niño", "hija", "abuela"]),
    vocabMcq("es-m5-8-mcq-esposo", { surface: "esposo", meaningEn: "husband", emoji: "🤵" }, [ESPOSA, ABUELO, PADRE]),
    speaking("es-m5-8-speak-quien", "¿quién es tu papá?", "Who is your dad?", ["quién", "tu", "papá"]),
    sentenceMcq({
      id: "es-m5-8-rev-q-carro",
      prompt: "'The red car is very big.' — which is correct?",
      correctText: "el carro rojo es muy grande",
      distractorsText: ["el carro roja es muy grande", "el carro rojo es muy grandes", "la carro rojo es muy grande"],
      exercisedAtomSurfaces: ["carro", "rojo", "muy", "grande"],
    }),
    cloze(
      "es-m5-8-rev-cloze-es",
      "ella",
      "alta",
      "es",
      ["es", "eres", "soy", "son"],
      "she is tall",
      "ella es alta",
    ),
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
