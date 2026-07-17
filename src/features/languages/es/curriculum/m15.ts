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
 * 2026-07-16 rewrite (JA-standard pass): m15-2 gained typed/spoken/built
 * production (previously recognition-only — the module's #1 gap).
 * SelfExplains added on the reflexive-pronoun-matches-subject contrast
 * (L1), person/stem-change agreement (L2), body-part article (L3),
 * por-phrase chunking (L4), and infinitive-after-preposition (L5).
 * Every L2-L7 lesson now closes on a compounding review tail
 * (reviewMatchPairs + a hand-verified prior-module review item, unique
 * seed per lesson, beforeModule="m15") pulling m1/m5/m6/m13 vocabulary.
 * Reflexive morphology itself — the healthiest part of the old file — is
 * preserved verbatim in substance, only re-sequenced for density/variety.
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
  vocab,
  vocabMcq,
  vocabTextMcq,
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
const LAVARSE = { surface: "lavarse", emoji: "🧼" };
const SALIR = { surface: "salir", emoji: "🚪" };

// ─── es-m15-1 — Reflexives ──────────────────────────────────────────────────

const M15_1: LessonContent = {
  id: "es-m15-1",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Reflexives — me levanto",
  description: "Verbs that point back at you: levantarse and la rutina.",
  estimatedMinutes: 7,
  xpReward: 14,
  steps: [
    infoStep(
      "es-m15-1-info-reflexive",
      "Verbs that point back at you",
      "levantarse means 'to get up' — literally 'to raise oneself'. The -se tail is a pronoun that changes with the person: yo me levanto, tú te levantas, él/ella se levanta, nosotros nos levantamos. Drop the -se, conjugate the verb, put the pronoun in front. Your whole morning works this way — that is your rutina.",
      "grammar",
    ),
    phrase("es-m15-1-p-rutina", "the routine", "la rutina", undefined, { atomId: "es:rutina" }),
    build(
      "es-m15-1-build-melevanto",
      "Build: 'I get up early.'",
      "me levanto temprano",
      ["me", "levanto", "temprano", "se"],
      ["me", "levanto", "temprano"],
      ["me levanto"],
    ),
    // rutina retrieval is spaced from its teach card (i+2), not massed at i+1.
    vocabTextMcq("es-m15-1-tmcq-rutina", "rutina", ["trabajo", "escuela", "fiesta"]),
    phrase("es-m15-1-p-levantarse", "to get up", "levantarse"),
    sentenceMcq({
      id: "es-m15-1-q-levantarse",
      prompt: "'to get up' — which verb is it?",
      correctText: "levantarse",
      distractorsText: ["acostarse", "ducharse", "desayunar"],
      exercisedAtomSurfaces: ["levantarse"],
    }),
    speaking("es-m15-1-speak-melevanto", "Me levanto temprano todos los días.", "I get up early every day.", ["me levanto", "levantarse"]),
    phrase("es-m15-1-p-selevanta", "he / she gets up", "se levanta"),
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
    listeningCompSentence({
      id: "es-m15-1-lc-selevanta",
      audioText: "Mi hermana se levanta tarde los sábados.",
      correctMeaningEn: "My sister gets up late on Saturdays.",
      distractorsEn: [
        "My sister gets up early on Saturdays.",
        "My brother gets up late on Saturdays.",
        "My sister goes to bed late on Saturdays.",
      ],
      exercisedAtomSurfaces: ["se levanta"],
    }),
    build(
      "es-m15-1-build-ellaselevanta",
      "Build: 'She gets up late.'",
      "ella se levanta tarde",
      ["ella", "se", "levanta", "tarde", "temprano"],
      ["ella", "se", "levanta", "tarde"],
      ["se levanta"],
    ),
    sentenceMcq({
      id: "es-m15-1-q-rutina2",
      prompt: "'my routine' — pick the Spanish.",
      correctText: "mi rutina",
      distractorsText: ["tu rutina", "mi ropa", "mi trabajo"],
      exercisedAtomSurfaces: ["rutina"],
    }),
    speaking("es-m15-1-speak-rutina", "Tengo una rutina buena.", "I have a good routine.", ["rutina"]),
    translateStep({
      id: "es-m15-1-tr-selevanta",
      promptEn: "My mom gets up early.",
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
      id: "es-m15-1-q-mihijo",
      prompt: "'I get my son up early.' (you're raising someone else, not yourself) — pick the Spanish.",
      correctText: "Levanto a mi hijo temprano.",
      distractorsText: [
        "Me levanto a mi hijo temprano.",
        "Se levanta a mi hijo temprano.",
        "Mi hijo se levanta temprano.",
      ],
      explanation: "No -se here — you're raising someone else, not yourself.",
    }),
    selfExplain({
      id: "es-m15-1-self-reflexive",
      anchorLabel: "You wrote: Levanto a mi hijo temprano. (no 'me')",
      anchorAudioText: "Levanto a mi hijo temprano.",
      question: "Why does 'me levanto' use 'me' but 'levanto a mi hijo' doesn't?",
      rule: {
        text: "The reflexive pronoun (me/te/se) only appears when the subject and the object are the same person — me levanto = I get myself up. When you raise someone else, there's no reflexive pronoun.",
      },
      surface: { text: "'me' is required every time you use the verb levantar." },
      distractor: { text: "'me' only appears in the morning; 'se' is used at night." },
      ruleExplanation:
        "Reflexive pronouns mark 'the action bounces back to the subject.' Drop the pronoun and levantar just means 'to raise/lift' something or someone else.",
    }),
    infoStep(
      "es-m15-1-info-win",
      "You've got the reflexive engine",
      "You can now say who does what to themselves, every single morning — and you know exactly why 'me' belongs there.",
      "win",
    ),
  ],
};

// ─── es-m15-2 — Getting ready ───────────────────────────────────────────────

const M15_2: LessonContent = {
  id: "es-m15-2",
  moduleId: "m15",
  courseId: COURSE_ID,
  languageId: "es",
  title: "Getting ready — me, te, se",
  description: "Wake up, shower, bathe, get dressed — and produce it yourself.",
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m15-2-info-pronouns",
      "me, te, se",
      "Every reflexive verb swaps its -se for the person doing it: me ducho (I shower), te duchas (you shower), se ducha (he/she showers). Watch the stem changers you met in m13: despertarse → me despierto (e→ie), and vestirse → me visto (e→i).",
      "grammar",
    ),
    vocabMcq("es-m15-2-mcq-despertarse", { surface: "despertarse", meaningEn: "to wake up", emoji: "⏰" }, [DUCHARSE, BANARSE, VESTIRSE]),
    build(
      "es-m15-2-build-despierto",
      "Build: 'I wake up at six.'",
      "me despierto a las seis",
      ["me", "despierto", "a", "las", "seis", "siete"],
      ["me", "despierto", "a", "las", "seis"],
      ["despertarse"],
    ),
    vocabMcq("es-m15-2-mcq-ducharse", { surface: "ducharse", meaningEn: "to shower", emoji: "🚿" }, [BANARSE, DESPERTARSE, VESTIRSE]),
    speaking("es-m15-2-speak-teduchas", "Te duchas rápido.", "You shower quickly.", ["ducharse"]),
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
    vocabMcq("es-m15-2-mcq-vestirse", { surface: "vestirse", meaningEn: "to get dressed", emoji: "👕" }, [BANARSE, DESPERTARSE, DUCHARSE]),
    build(
      "es-m15-2-build-sevisteescuela",
      "Build: 'He gets dressed for school.'",
      "él se viste para la escuela",
      ["él", "se", "viste", "para", "la", "escuela", "casa"],
      ["él", "se", "viste", "para", "la", "escuela"],
      ["vestirse"],
    ),
    sentenceMcq({
      id: "es-m15-2-q-vestirse",
      prompt: "'I get dressed.' — pick the correct form.",
      correctText: "me visto",
      distractorsText: ["me vesto", "te visto", "me vista"],
      explanation: "An e→i stem changer, like pedir — the e of the stem flips.",
      exercisedAtomSurfaces: ["vestirse"],
    }),
    listeningCompSentence({
      id: "es-m15-2-lc-despertarse",
      audioText: "Mi hermano se despierta a las siete.",
      correctMeaningEn: "My brother wakes up at seven.",
      distractorsEn: [
        "My brother goes to bed at seven.",
        "My sister wakes up at seven.",
        "My brother wakes up at eight.",
      ],
      exercisedAtomSurfaces: ["despertarse"],
    }),
    build(
      "es-m15-2-build-nosbanamos",
      "Build: 'We bathe late.'",
      "nos bañamos tarde",
      ["nos", "bañamos", "tarde", "temprano"],
      ["nos", "bañamos", "tarde"],
      ["bañarse"],
    ),
    selfExplain({
      id: "es-m15-2-self-pronouns",
      anchorLabel: "You wrote: Nos bañamos tarde.",
      anchorAudioText: "Nos bañamos tarde.",
      question: "Why 'nos' here instead of 'me' or 'se'?",
      rule: {
        text: "The reflexive pronoun always matches the subject doing the action — nosotros → nos, just like yo → me and él/ella → se.",
      },
      surface: { text: "'nos' is used whenever the sentence is about family." },
      distractor: { text: "'nos' replaces 'se' when the verb starts with a vowel." },
      ruleExplanation:
        "Reflexive pronouns track PERSON, not sound or topic: yo→me, tú→te, él/ella/usted→se, nosotros→nos.",
    }),
    translateStep({
      id: "es-m15-2-tr-mevisto",
      promptEn: "I get dressed quickly.",
      acceptedAnswers: ["Me visto rápido.", "me visto rápido", "Me visto rapido", "me visto rapido"],
      audioText: "Me visto rápido.",
      exercisedAtomSurfaces: ["vestirse"],
    }),
    speaking("es-m15-2-speak-medespierto", "Me despierto temprano los lunes.", "I wake up early on Mondays.", ["despertarse"]),
    reviewMatchPairs("es-m15-2-rev", "es-m15-2-rev-seed", "m15", 6),
    cloze(
      "es-m15-2-rev-cloze",
      "",
      " hermano se despierta temprano.",
      "mi",
      ["mi", "tu", "su", "el"],
      "My brother wakes up early.",
      "Mi hermano se despierta temprano.",
      "mi = my — matches the subject of the sentence, not the verb.",
      ["despertarse"],
    ),
    build(
      "es-m15-2-rev-build",
      "Build: 'I sleep well and I wake up early.'",
      "duermo bien y me despierto temprano",
      ["duermo", "bien", "y", "me", "despierto", "temprano", "tarde"],
      ["duermo", "bien", "y", "me", "despierto", "temprano"],
      ["despertarse"],
    ),
    infoStep(
      "es-m15-2-info-win",
      "You produce the reflexive, not just recognize it",
      "You can now say who wakes up, showers, bathes, and dresses — in your own words, not just pick the right one.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m15-3-info-article",
      "Wash the face, not my face",
      "With reflexive verbs, body parts take el/la/los — the pronoun already says whose: Me lavo la cara (I wash my face), Me cepillo los dientes (I brush my teeth). Compare: Lavo el carro — no -se, because the car is not you. lavarse = wash yourself; lavar = wash something else.",
      "grammar",
    ),
    vocabMcq("es-m15-3-mcq-lavarse", { surface: "lavarse", meaningEn: "to wash (oneself)", emoji: "🧼" }, [DUCHARSE, BANARSE, CEPILLARSE]),
    build(
      "es-m15-3-build-lavocara",
      "Build: 'I wash my face.'",
      "me lavo la cara",
      ["me", "lavo", "la", "cara", "el"],
      ["me", "lavo", "la", "cara"],
      ["lavarse", "cara"],
    ),
    vocabMcq("es-m15-3-mcq-diente", { surface: "diente", meaningEn: "tooth", emoji: "🦷" }, [CEPILLARSE, DUCHARSE, BANARSE]),
    sentenceMcq({
      id: "es-m15-3-q-lavarse",
      prompt: "'I wash my face.' — pick the Spanish.",
      correctText: "Me lavo la cara.",
      distractorsText: ["Lavo mi cara.", "Me lavo el carro.", "Se lava la cara."],
      exercisedAtomSurfaces: ["lavarse", "cara"],
    }),
    build(
      "es-m15-3-build-cepillodientes",
      "Build: 'I brush my teeth every day.'",
      "me cepillo los dientes todos los días",
      ["me", "cepillo", "los", "dientes", "todos", "los", "días", "el"],
      ["me", "cepillo", "los", "dientes", "todos", "los", "días"],
      ["cepillarse", "diente"],
    ),
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
    vocabMcq("es-m15-3-mcq-cepillarse", { surface: "cepillarse", meaningEn: "to brush (hair / teeth)", emoji: "🪥" }, [LAVARSE, DUCHARSE, BANARSE]),
    phrase("es-m15-3-p-pelo", "the hair", "el pelo", undefined, { atomId: "es:pelo" }),
    sentenceMcq({
      id: "es-m15-3-q-cepillarse",
      prompt: "'She brushes her hair.' — pick the Spanish.",
      correctText: "Se cepilla el pelo.",
      distractorsText: ["Me cepillo el pelo.", "Se lava los dientes.", "Se cepilla la cara."],
      exercisedAtomSurfaces: ["cepillarse", "pelo"],
    }),
    translateStep({
      id: "es-m15-3-tr-pelo",
      promptEn: "I wash my hair.",
      acceptedAnswers: ["Me lavo el pelo.", "me lavo el pelo", "Me lavo el pelo"],
      audioText: "Me lavo el pelo.",
      exercisedAtomSurfaces: ["lavarse", "pelo"],
    }),
    listeningCompSentence({
      id: "es-m15-3-lc-cara",
      audioText: "Mi hija se lava la cara todas las noches.",
      correctMeaningEn: "My daughter washes her face every night.",
      distractorsEn: [
        "My daughter washes her hair every night.",
        "My son washes his face every night.",
        "My daughter washes her face every morning.",
      ],
      exercisedAtomSurfaces: ["lavarse", "cara"],
    }),
    agreementCloze(
      "es-m15-3-agree-dientes",
      [
        { text: "Yo " },
        { blank: { id: "b1", correctAnswer: "me", options: ["me", "te", "se", "nos"] } },
        { text: " cepillo " },
        { blank: { id: "b2", correctAnswer: "los", options: ["los", "las", "el", "la"] } },
        { text: " dientes por la mañana." },
      ],
      "I brush my teeth in the morning.",
      "Yo me cepillo los dientes por la mañana.",
      ["cepillarse", "diente", "por la mañana"],
    ),
    build(
      "es-m15-3-build-pelodiario",
      "Build: 'She brushes her hair every day.'",
      "ella se cepilla el pelo todos los días",
      ["ella", "se", "cepilla", "el", "pelo", "todos", "los", "días", "luego"],
      ["ella", "se", "cepilla", "el", "pelo", "todos", "los", "días"],
      ["cepillarse", "pelo"],
    ),
    selfExplain({
      id: "es-m15-3-self-article",
      anchorLabel: "You wrote: Me cepillo los dientes.",
      anchorAudioText: "Me cepillo los dientes.",
      question: "Why 'los dientes' and not 'mis dientes'?",
      rule: {
        text: "With reflexive body-care verbs, the pronoun (me/te/se) already tells you whose body part it is — so Spanish uses the article (el/la/los/las), not a possessive.",
      },
      surface: { text: "los dientes just sounds more natural in Spanish." },
      distractor: { text: "los dientes is used because teeth always come in a pair, so no possessive is needed." },
      ruleExplanation:
        "The reflexive pronoun (me) makes the owner obvious, so the possessive would be redundant — el/la/los/las take over that job.",
    }),
    speaking("es-m15-3-speak-cara", "Me lavo la cara todos los días.", "I wash my face every day.", ["lavarse", "cara"]),
    reviewMatchPairs("es-m15-3-rev", "es-m15-3-rev-seed", "m15", 6),
    sentenceMcq({
      id: "es-m15-3-rev-q-hermana",
      prompt: "'My sister has brown hair.' — pick the Spanish.",
      correctText: "Mi hermana tiene el pelo castaño.",
      distractorsText: [
        "Mi hermano tiene el pelo castaño.",
        "Mi hermana tiene los ojos castaños.",
        "Mi hermana tiene el pelo rubio.",
      ],
      exercisedAtomSurfaces: ["hermana", "pelo"],
    }),
    infoStep(
      "es-m15-3-info-win",
      "You groom in Spanish now",
      "You can wash and brush every part of your morning — and you know why the article, not 'mi', carries the meaning.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m15-4-info-sequence",
      "Sequencing your day",
      "primero = first, luego = then. Time-of-day frames take por: por la mañana (in the morning), por la tarde (in the afternoon), por la noche (at night). Primero me ducho, luego me visto — first I shower, then I get dressed.",
      "grammar",
    ),
    vocabMcq("es-m15-4-mcq-primero", { surface: "primero", meaningEn: "first", emoji: "🥇" }, [DESPERTARSE, DUCHARSE, SALIR]),
    build(
      "es-m15-4-build-primero",
      "Build: 'First I wash my face.'",
      "primero me lavo la cara",
      ["primero", "me", "lavo", "la", "cara", "luego"],
      ["primero", "me", "lavo", "la", "cara"],
      ["primero", "lavarse", "cara"],
    ),
    phrase("es-m15-4-p-luego", "then", "luego"),
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
    vocabTextMcq("es-m15-4-tmcq-luego", "luego", ["primero", "temprano", "tarde"]),
    phrase("es-m15-4-p-porlamanana", "in the morning", "por la mañana"),
    // Produce "por la mañana" here (i+1) AND recognize it at the MCQ (i+2) so
    // the teach card gets spaced, not massed, follow-up.
    build(
      "es-m15-4-build-manana",
      "Build: 'I get up in the morning.'",
      "me levanto por la mañana",
      ["me", "levanto", "por", "la", "mañana", "tarde"],
      ["me", "levanto", "por", "la", "mañana"],
      ["levantarse", "por la mañana"],
    ),
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
    phrase("es-m15-4-p-porlanoche", "at night", "por la noche"),
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
    translateStep({
      id: "es-m15-4-tr-luego",
      promptEn: "First I get up, then I shower.",
      acceptedAnswers: [
        "Primero me levanto, luego me ducho.",
        "primero me levanto, luego me ducho",
        "Primero me levanto luego me ducho.",
        "primero me levanto luego me ducho",
      ],
      audioText: "Primero me levanto, luego me ducho.",
      exercisedAtomSurfaces: ["primero", "luego", "levantarse", "ducharse"],
    }),
    speaking("es-m15-4-speak-porlanoche", "Me cepillo los dientes por la noche.", "I brush my teeth at night.", ["cepillarse", "diente", "por la noche"]),
    sentenceMcq({
      id: "es-m15-4-q-mananareview",
      prompt: "'I get up in the morning.' — pick the Spanish.",
      correctText: "Me levanto por la mañana.",
      distractorsText: [
        "Me levanto por la noche.",
        "Me acuesto por la mañana.",
        "Me ducho por la tarde.",
      ],
      exercisedAtomSurfaces: ["por la mañana", "levantarse"],
    }),
    selfExplain({
      id: "es-m15-4-self-por",
      anchorLabel: "You wrote: Me levanto por la mañana.",
      anchorAudioText: "Me levanto por la mañana.",
      question: "Why 'por la mañana' and not just 'la mañana'?",
      rule: {
        text: "Spanish marks a time-of-day block with por + la + mañana/tarde/noche — a fixed phrase for 'during the morning/afternoon/night.'",
      },
      surface: { text: "'por' always means 'for' in every context." },
      distractor: { text: "'por' is used because mañana can also mean 'tomorrow', so por avoids confusion." },
      ruleExplanation:
        "por la mañana/tarde/noche is a fixed time-block phrase — memorize it as a chunk, not word-by-word.",
    }),
    build(
      "es-m15-4-build-luegoreview",
      "Build: 'First I shower, then I get dressed.'",
      "primero me ducho luego me visto",
      ["primero", "me", "ducho", "luego", "me", "visto", "después"],
      ["primero", "me", "ducho", "luego", "me", "visto"],
      ["primero", "luego", "ducharse", "vestirse"],
    ),
    reviewMatchPairs("es-m15-4-rev", "es-m15-4-rev-seed", "m15", 6),
    sentenceMcq({
      id: "es-m15-4-rev-q-lunes",
      prompt: "'I go to school on Mondays.' — pick the Spanish.",
      correctText: "Voy a la escuela los lunes.",
      distractorsText: [
        "Voy a la escuela los martes.",
        "Voy a la casa los lunes.",
        "Vengo de la escuela los lunes.",
      ],
      exercisedAtomSurfaces: ["lunes"],
    }),
    speaking("es-m15-4-rev-speak", "Prefiero dormir temprano.", "I prefer to sleep early.", ["preferir", "dormir"]),
    infoStep(
      "es-m15-4-info-win",
      "You can narrate order",
      "You can now put your whole morning in order — first, then, morning to night — without losing the thread.",
      "win",
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
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    infoStep(
      "es-m15-5-info-antesdespues",
      "antes de, después de",
      "antes de = before, después de = after — and the verb that follows stays in the infinitive: antes de salir (before leaving), después de desayunar (after having breakfast). One more surprise: salir is irregular in yo — salgo (I leave).",
      "grammar",
    ),
    vocab("es-m15-5-v-desayunar", "to have breakfast", "desayunar"),
    sentenceMcq({
      id: "es-m15-5-q-desayunar",
      prompt: "'I have breakfast at home.' — pick the Spanish.",
      correctText: "Desayuno en casa.",
      distractorsText: ["Desayunar en casa.", "Almuerzo en casa.", "Como en la escuela."],
      exercisedAtomSurfaces: ["desayunar"],
    }),
    build(
      "es-m15-5-build-desayunosiete",
      "Build: 'I have breakfast at seven.'",
      "desayuno a las siete",
      ["desayuno", "a", "las", "siete", "ocho"],
      ["desayuno", "a", "las", "siete"],
      ["desayunar"],
    ),
    vocabMcq("es-m15-5-mcq-salir", { surface: "salir", meaningEn: "to leave / go out", emoji: "🚪" }, [DESPERTARSE, DUCHARSE, BANARSE]),
    sentenceMcq({
      id: "es-m15-5-q-salgo",
      prompt: "'I leave early.' — salir is irregular in yo. Pick it.",
      correctText: "Salgo temprano.",
      distractorsText: ["Salo temprano.", "Sales temprano.", "Salir temprano."],
      exercisedAtomSurfaces: ["salir", "salgo"],
    }),
    // Each teach card below gets a same-atom retrieval at i+1 AND a spaced one
    // at i+2 (test-enhancement, not massed practice).
    vocab("es-m15-5-v-acostarse", "to go to bed", "acostarse"),
    sentenceMcq({
      id: "es-m15-5-q-acostarse",
      prompt: "'I go to bed late.' — pick the Spanish.",
      correctText: "Me acuesto tarde.",
      distractorsText: ["Me acosto tarde.", "Me acuesta tarde.", "Te acuestas tarde."],
      explanation: "An o→ue stem changer, like dormir — the o of the stem flips.",
      exercisedAtomSurfaces: ["acostarse"],
    }),
    translateStep({
      id: "es-m15-5-tr-acuesto",
      promptEn: "I go to bed early.",
      acceptedAnswers: ["Me acuesto temprano.", "me acuesto temprano", "Me acuesto temprano"],
      audioText: "Me acuesto temprano.",
      exercisedAtomSurfaces: ["acostarse"],
    }),
    phrase("es-m15-5-p-antesde", "before", "antes de"),
    sentenceMcq({
      id: "es-m15-5-q-antesde",
      prompt: "'Before leaving, I have breakfast.' — pick the Spanish.",
      correctText: "Antes de salir, desayuno.",
      distractorsText: [
        "Después de salir, desayuno.",
        "Antes de desayunar, salgo.",
        "Salgo antes de desayunar.",
      ],
      exercisedAtomSurfaces: ["antes de", "salir", "desayunar"],
    }),
    speaking("es-m15-5-speak-antesdedormir", "Me cepillo los dientes antes de dormir.", "I brush my teeth before sleeping.", ["cepillarse", "diente", "antes de"]),
    vocab("es-m15-5-v-despuesde", "after", "después de"),
    build(
      "es-m15-5-build-despuesde",
      "Build: 'After having breakfast, I leave.'",
      "después de desayunar salgo",
      ["después", "de", "desayunar", "salgo", "antes"],
      ["después", "de", "desayunar", "salgo"],
      ["después de", "desayunar", "salgo"],
    ),
    translateStep({
      id: "es-m15-5-tr-despuesde",
      promptEn: "After breakfast, I brush my teeth.",
      acceptedAnswers: [
        "Después de desayunar, me cepillo los dientes.",
        "despues de desayunar, me cepillo los dientes",
        "Después de desayunar me cepillo los dientes",
        "despues de desayunar me cepillo los dientes",
      ],
      audioText: "Después de desayunar, me cepillo los dientes.",
      exercisedAtomSurfaces: ["después de", "cepillarse"],
    }),
    selfExplain({
      id: "es-m15-5-self-infinitive",
      anchorLabel: "You wrote: Antes de salir, desayuno.",
      anchorAudioText: "Antes de salir, desayuno.",
      question: "Why 'salir' (infinitive) and not 'salgo' after 'antes de'?",
      rule: {
        text: "antes de and después de are always followed by the infinitive (the plain -r verb form), never a conjugated form — antes de salir, not antes de salgo.",
      },
      surface: { text: "salgo is used with yo; salir is used with everyone else." },
      distractor: { text: "salir follows antes de because the action already happened." },
      ruleExplanation:
        "Prepositions like antes de / después de take the infinitive in Spanish, unlike English which uses '-ing' (before leaving = antes de salir).",
    }),
    sentenceMcq({
      id: "es-m15-5-q-despuesdespaced",
      prompt: "'After having breakfast, I get dressed.' — pick the Spanish.",
      correctText: "Después de desayunar, me visto.",
      distractorsText: [
        "Antes de desayunar, me visto.",
        "Después de desayunar, me ducho.",
        "Salgo antes de desayunar.",
      ],
      exercisedAtomSurfaces: ["después de", "desayunar", "vestirse"],
    }),
    reviewMatchPairs("es-m15-5-rev", "es-m15-5-rev-seed", "m15", 6),
    build(
      "es-m15-5-rev-build",
      "Build: 'I can sleep after playing.'",
      "puedo dormir después de jugar",
      ["puedo", "dormir", "después", "de", "jugar", "antes"],
      ["puedo", "dormir", "después", "de", "jugar"],
      ["poder", "dormir", "después de", "jugar"],
    ),
    infoStep(
      "es-m15-5-info-win",
      "You order your day with before and after",
      "You can now say what happens before and after anything — and why the verb after those words never conjugates.",
      "win",
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
  estimatedMinutes: 8,
  xpReward: 15,
  steps: [
    phrase("es-m15-6-p-porlatarde", "in the afternoon", "por la tarde"),
    sentenceMcq({
      id: "es-m15-6-q-porlatarde",
      prompt: "'I study in the afternoon.' — pick the Spanish.",
      correctText: "Estudio por la tarde.",
      distractorsText: ["Estudio por la mañana.", "Trabajo por la noche.", "Descanso por la tarde."],
      exercisedAtomSurfaces: ["por la tarde"],
    }),
    build(
      "es-m15-6-build-porlatarde",
      "Build: 'She works in the afternoon.'",
      "ella trabaja por la tarde",
      ["ella", "trabaja", "por", "la", "tarde", "noche"],
      ["ella", "trabaja", "por", "la", "tarde"],
      ["por la tarde"],
    ),
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
    speaking("es-m15-6-speak-selevanta", "Mi papá se levanta y se ducha.", "My dad gets up and showers.", ["se levanta", "ducharse"]),
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
    translateStep({
      id: "es-m15-6-tr-portarde",
      promptEn: "I have breakfast in the afternoon.",
      acceptedAnswers: ["Desayuno por la tarde.", "desayuno por la tarde", "Desayuno por la tarde"],
      audioText: "Desayuno por la tarde.",
      exercisedAtomSurfaces: ["desayunar", "por la tarde"],
    }),
    listeningCompSentence({
      id: "es-m15-6-lc-antesde",
      audioText: "Antes de salir, me visto.",
      correctMeaningEn: "Before leaving, I get dressed.",
      distractorsEn: [
        "After leaving, I get dressed.",
        "Before leaving, I have breakfast.",
        "Before sleeping, I get dressed.",
      ],
      exercisedAtomSurfaces: ["antes de", "salir", "vestirse"],
    }),
    vocabMcq("es-m15-6-mcq-review", { surface: "ducharse", meaningEn: "to shower", emoji: "🚿" }, [BANARSE, VESTIRSE, DESPERTARSE]),
    build(
      "es-m15-6-build-review",
      "Build: 'First I shower, then I have breakfast, and then I leave.'",
      "primero me ducho luego desayuno y salgo",
      ["primero", "me", "ducho", "luego", "desayuno", "y", "salgo", "después"],
      ["primero", "me", "ducho", "luego", "desayuno", "y", "salgo"],
      ["primero", "luego", "ducharse", "desayunar", "salgo"],
    ),
    reviewMatchPairs("es-m15-6-rev", "es-m15-6-rev-seed", "m15", 6),
    listeningCompSentence({
      id: "es-m15-6-rev-lc",
      audioText: "Mi hermano juega fútbol por la tarde.",
      correctMeaningEn: "My brother plays soccer in the afternoon.",
      distractorsEn: [
        "My brother plays soccer in the morning.",
        "My sister plays soccer in the afternoon.",
        "My brother watches soccer in the afternoon.",
      ],
      exercisedAtomSurfaces: ["hermano", "jugar", "fútbol", "por la tarde"],
    }),
    speaking("es-m15-6-rev-speak", "Prefiero desayunar temprano.", "I prefer to have breakfast early.", ["preferir", "desayunar"]),
    infoStep(
      "es-m15-6-info-win",
      "You can follow a spoken day",
      "You can now follow a whole spoken day in Spanish, start to finish, without missing a beat.",
      "win",
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
  estimatedMinutes: 8,
  xpReward: 16,
  steps: [
    infoStep(
      "es-m15-7-info-midia",
      "Un día en mi vida",
      "Por la mañana me despierto temprano. Primero me ducho, luego me visto y desayuno. Salgo de mi casa a las ocho. Por la tarde estudio y trabajo. Por la noche me cepillo los dientes y me acuesto.\nRead it out loud — every line is yours now.",
      "default",
    ),
    vocabMcq("es-m15-7-mcq-recap", { surface: "primero", meaningEn: "first", emoji: "🥇" }, [DESPERTARSE, DUCHARSE, SALIR]),
    dialogueListen({
      id: "es-m15-7-dl-rutina",
      lines: [
        { speaker: "Diego", text: "Rosa, ¿a qué hora te levantas?" },
        { speaker: "Rosa", text: "Me levanto a las seis. Primero me ducho y luego desayuno." },
        { speaker: "Diego", text: "¿Y por la noche?" },
        { speaker: "Rosa", text: "Me cepillo los dientes y me acuesto a las diez." },
      ],
      questions: [
        {
          id: "q1",
          prompt: "What does Rosa do first after getting up?",
          correctText: "She showers.",
          distractors: [
            "She has breakfast.",
            "She brushes her teeth.",
            "She gets dressed.",
          ],
        },
        {
          id: "q2",
          prompt: "When does Rosa go to bed?",
          correctText: "At ten.",
          distractors: ["At six.", "At eight.", "At nine."],
        },
      ],
      exercisedAtomSurfaces: [
        "me levanto",
        "ducharse",
        "primero",
        "luego",
        "desayunar",
        "cepillarse",
        "acostarse",
        "por la noche",
      ],
    }),
    build(
      "es-m15-7-build-rutina",
      "Build: 'First I shower and then I have breakfast.'",
      "primero me ducho y luego desayuno",
      ["primero", "me", "ducho", "y", "luego", "desayuno", "después"],
      ["primero", "me", "ducho", "y", "luego", "desayuno"],
      ["primero", "luego", "ducharse", "desayunar"],
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
    listeningCompSentence({
      id: "es-m15-7-lc-papasale",
      audioText: "Mi papá desayuna y luego sale.",
      correctMeaningEn: "My dad has breakfast and then leaves.",
      distractorsEn: [
        "My dad leaves and then has breakfast.",
        "My mom has breakfast and then leaves.",
        "My dad has breakfast and then showers.",
      ],
      exercisedAtomSurfaces: ["desayunar", "luego", "salir"],
    }),
    translateStep({
      id: "es-m15-7-tr-selevanta",
      promptEn: "My mom gets up early.",
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
    speaking("es-m15-7-speak-melevanto", "Me levanto temprano todos los días.", "I get up early every day.", ["me levanto"]),
    vocabTextMcq("es-m15-7-tmcq-rutina", "rutina", ["trabajo", "escuela", "fiesta"]),
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
    sentenceMcq({
      id: "es-m15-7-q-antesdespues",
      prompt: "'Before leaving, I brush my teeth.' — pick the Spanish.",
      correctText: "Antes de salir, me cepillo los dientes.",
      distractorsText: [
        "Después de salir, me cepillo los dientes.",
        "Antes de cepillarme, salgo.",
        "Me cepillo los dientes y salgo.",
      ],
      exercisedAtomSurfaces: ["antes de", "salir", "cepillarse", "diente"],
    }),
    build(
      "es-m15-7-build-review",
      "Build: 'First I get up, then I shower, and then I have breakfast.'",
      "primero me levanto luego me ducho y desayuno",
      ["primero", "me", "levanto", "luego", "me", "ducho", "y", "desayuno", "después"],
      ["primero", "me", "levanto", "luego", "me", "ducho", "y", "desayuno"],
      ["primero", "luego", "me levanto", "ducharse", "desayunar"],
    ),
    reviewMatchPairs("es-m15-7-rev", "es-m15-7-rev-seed", "m15", 6),
    listeningCompSentence({
      id: "es-m15-7-rev-lc",
      audioText: "Mi abuela tiene ochenta años.",
      correctMeaningEn: "My grandmother is eighty years old.",
      distractorsEn: [
        "My grandmother is eighteen years old.",
        "My grandfather is eighty years old.",
        "My grandmother is seventy years old.",
      ],
      exercisedAtomSurfaces: ["abuela", "tener", "años"],
    }),
    speaking("es-m15-7-rev-speak", "Mi hermano juega fútbol después de la escuela.", "My brother plays soccer after school.", ["hermano", "jugar", "fútbol", "después de"]),
    infoStep(
      "es-m15-7-info-win",
      "You can narrate your whole day",
      "You can now tell the story of your entire day, out loud, start to finish — reflexives, sequencing, and all.",
      "win",
    ),
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
  estimatedMinutes: 8,
  xpReward: 17,
  steps: [
    sentenceMcq({
      id: "es-m15-8-q-melevanto",
      prompt: "'I get up' — pick the Spanish.",
      correctText: "me levanto",
      distractorsText: ["se levanta", "me acuesto", "me ducho"],
      exercisedAtomSurfaces: ["me levanto"],
    }),
    build(
      "es-m15-8-build-recap",
      "Build: 'I get up and get dressed.'",
      "me levanto y me visto",
      ["me", "levanto", "y", "me", "visto", "acuesto"],
      ["me", "levanto", "y", "me", "visto"],
      ["me levanto", "vestirse"],
    ),
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
    translateStep({
      id: "es-m15-8-tr-acuesto",
      promptEn: "I go to bed late.",
      acceptedAnswers: ["Me acuesto tarde.", "me acuesto tarde", "Me acuesto tarde"],
      audioText: "Me acuesto tarde.",
      exercisedAtomSurfaces: ["acostarse"],
    }),
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
    sentenceMcq({
      id: "es-m15-8-rev-q-abuela",
      prompt: "'My grandmother has a car.' — pick the Spanish.",
      correctText: "Mi abuela tiene un carro.",
      distractorsText: [
        "Mi abuelo tiene un carro.",
        "Mi abuela tiene una casa.",
        "Mi abuela tiene un perro.",
      ],
      exercisedAtomSurfaces: ["abuela", "tener"],
    }),
    build(
      "es-m15-8-rev-build",
      "Build: 'I prefer to sleep early.'",
      "prefiero dormir temprano",
      ["prefiero", "dormir", "temprano", "tarde"],
      ["prefiero", "dormir", "temprano"],
      ["preferir", "dormir", "temprano"],
    ),
    reviewMatchPairs("es-m15-8-rev", "es-m15-8-rev-seed", "m15", 6),
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
