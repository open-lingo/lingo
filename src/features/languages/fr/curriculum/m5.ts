/**
 * m5.ts — On y va — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-01, the first module written UNDER the frContentAudits
 * gate. No m5 spine existed; this module designs it (coordinator
 * dispatch): m4's L10 promised "doing things in it" — this is FR's first
 * MOVEMENT beat: aller + the à-contractions.
 *
 * SCOPE DECISIONS (all deliberate, all flagged):
 *   - CHUNKED, NOT CONJUGATED. Three person-chunks of aller — «je vais»,
 *     «tu vas», «on va» — taught exactly like «je m'appelle»/«tu
 *     t'appelles» were in m2: whole surfaces, no paradigm, no infinitive,
 *     no conjugation tables. The ES precedent supports this: ES shipped
 *     "Vamos — say where you're going" as its own chunked module ahead
 *     of "The verb machine" conjugation opener, and the ES checkpoint
 *     law for conjugation modules kicks in only there. FR's verb-machine
 *     module (with fr/conjugationTables.ts, the grid config, and the
 *     nous/vous/ils rows) remains FUTURE work — flagged for Spencer.
 *   - «on va», not «nous allons»: on is what French speakers actually
 *     say, it reuses the va sound the learner owns from «ça va», and it
 *     doubles as the invitation form («On va au cinéma ?»).
 *   - Contractions per pin F4: «au» (à+le) is ONE atom, one tile —
 *     French never writes «à le». «à la» stays visible (its own atom);
 *     «à l'» is NOT a new form at all — it is «à» + the elided article
 *     m4 taught, so it is taught as a combination, and its clozes offer
 *     the classic wrong forms («au école», «à la école», «au hôtel») as
 *     distractors — pin F2's unelided-error pedagogy.
 *   - «à la ville» is BANNED from the inventory: French says «en ville»,
 *     which is untaught — ville stays out of the movement frame entirely
 *     (inventory rule, machine-pinned in m5.test.ts).
 *   - Time words: «demain» + «ce soir» (soir is an m1 atom; ce is
 *     chrome) — enough to make PLANS, which is the module's promise.
 *   - «d'accord» debuts as the plan-sealing word — and one more spin of
 *     the elision wheel (de + accord).
 *   - THE ARC PAYOFF: m2 L9's «On va au cinéma demain ?» — the line
 *     that forced the escape phrase — comes back VERBATIM (same clip)
 *     in L4, and this time the learner owns every word. Authored as the
 *     module's emotional center.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   je vais au cinéma L1 · je vais à la plage L1 · tu vas où ? L2 ·
 *   tu vas au cinéma ? L2 · je vais à l'école L3 · je vais à l'hôtel L3 ·
 *   on va au cinéma demain ? L4 · d'accord L4 ·
 *   on va au restaurant ce soir ? L5 · je vais au cinéma ce soir L5 ·
 *   je vais à la gare demain L6 · on va au cinéma ce soir ? L7
 *   recalls drawn: où est le musée ? L1 (m4) · je vais au cinéma L2+L8+L10 ·
 *   je vais à la plage L3 · tu vas où ? L3+L8 · je vais à l'hôtel L4 ·
 *   on va au cinéma demain ? L4+L9 · d'accord L5 ·
 *   on va au restaurant ce soir ? L6+L8 · je vais à l'école L6 ·
 *   tu vas au cinéma ? L7 · je vais à la gare demain L7+L10 ·
 *   on va au cinéma ce soir ? L9.
 *
 * Cast: Léa proposes the m2 line (L4); Chloé plans the weekend; Hugo
 * books dinner; Emma asks after your day; Louis arrives at the gare
 * (planted L9, paid off in the L10 finale).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabTextMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  listeningBuildSentence,
  genderSort,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";


export const FR_M5_ATOMS: FrAtom[] = [
  atom({ surface: "je vais", meaningEn: "I'm going", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase", hint: "zhuh VAY" }),
  atom({ surface: "tu vas", meaningEn: "you're going", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase", hint: "tu VAH — the same va as «ça va»" }),
  atom({ surface: "on va", meaningEn: "we're going", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase", hint: "ohn VAH — real-life French for 'we'; with a rise it invites" }),
  atom({ surface: "au", meaningEn: "to the (with le-words)", partOfSpeech: "particle", fromModule: "m5", kind: "particle", hint: "oh — à + le fused into one word; French never writes «à le»" }),
  atom({ surface: "à la", meaningEn: "to the (with la-words)", partOfSpeech: "particle", fromModule: "m5", kind: "particle", hint: "ah lah — pink-f words keep both pieces" }),
  atom({ surface: "d'accord", meaningEn: "okay / deal", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase", hint: "da-KOR — de + accord, squeezed, of course" }),
  atom({ surface: "tu vas où ?", meaningEn: "where are you going?", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase", hint: "tu vah OO — the street version, question at the end" }),
  atom({ surface: "demain", meaningEn: "tomorrow", partOfSpeech: "adverb", fromModule: "m5", kind: "vocab", hint: "duh-MAN — nasal ending" }),
  atom({ surface: "ce soir", meaningEn: "tonight", partOfSpeech: "phrase", fromModule: "m5", kind: "phrase", hint: "suh SWAR — 'this evening', the soir from bonsoir" }),
];

/** L1 — «je vais» + the swallow: à + le = «au»; pink-f keeps «à la». */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m5-1-info-jevais",
      "Going places",
      "«je vais» — I'm going (zhuh VAY). Then French swallows a word: à + le fuse into «au» (oh): «Je vais au cinéma» — I'm going to the movies. Pink-f words keep both pieces — «à la gare» — but «le» never survives after à.",
      "grammar",
    ),
    {
      id: "fr-m5-1-map-aucinema",
      type: "word_map",
      tokens: ["je vais", "au", "cinéma"],
      pairs: [
        { en: "I'm going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "movies", tokenIndex: 2 },
      ],
      audioText: "je vais au cinéma",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "«au» IS 'to the' — à + le, fused for good. One tile, one sound, blue-m only.",
    },
    speaking("fr-m5-1-speak-aucinema", "je vais au cinéma", "I'm going to the movies", []),
    cloze(
      "fr-m5-1-cloze-au",
      "je vais",
      "parc",
      "au",
      ["au", "à la"],
      "I'm going to the park",
      "je vais au parc",
      "«parc» is blue-m — à + le fuses: «au parc».",
    ),
    {
      // TAIL: m4 places by ear.
      id: "fr-m5-1-hear-leparc",
      type: "word_image_mcq",
      meaningEn: "le parc",
      options: [
        { id: "correct", word: "le parc", emoji: "🌳" },
        { id: "o1", word: "le musée", emoji: "🏛️" },
        { id: "o2", word: "la plage", emoji: "🏖️" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: m4 questions lane, from memory.
    speaking(
      "fr-m5-1-speak-ouestlemusee-recall",
      "où est le musée ?",
      "where is the museum?",
      [],
      "recall",
    ),
    {
      id: "fr-m5-1-map-alagare",
      type: "word_map",
      tokens: ["je vais", "à la", "gare"],
      pairs: [
        { en: "I'm going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "station", tokenIndex: 2 },
      ],
      audioText: "je vais à la gare",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote:
        "Pink-f words keep both pieces: «à la gare». Only «le» gets eaten.",
    },
    listeningCompSentence({
      id: "fr-m5-1-lc-alagare",
      audioText: "je vais à la gare",
      correctMeaningEn: "I'm going to the station.",
      distractorsEn: ["I'm going to the movies.", "Where is the station?", "There's a station."],
    }),
    cloze(
      "fr-m5-1-cloze-ala",
      "je vais",
      "plage",
      "à la",
      ["à la", "au"],
      "I'm going to the beach",
      "je vais à la plage",
      "«plage» — pink-f, so both pieces stay: «à la plage».",
    ),
    build(
      "fr-m5-1-build-aucafe",
      "Build: 'I'm going to the café'",
      "je vais au café",
      ["je vais", "au", "café", "à la"],
      ["je vais", "au", "café"],
    ),
    {
      id: "fr-m5-1-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jevais", source: "je vais", target: "I'm going" },
        { id: "p-au", source: "au", target: "to the (le-words)" },
        { id: "p-ala", source: "à la", target: "to the (la-words)" },
        { id: "p-cinema", source: "cinéma", target: "the movies" },
        { id: "p-gare", source: "gare", target: "train station" },
        { id: "p-dix", source: "dix", target: "ten" },
      ],
    },
    // WIN: printed first voicing of the pink-f shape.
    speaking("fr-m5-1-speak-alaplage", "je vais à la plage", "I'm going to the beach", []),
  ];
}

/** L2 — «Tu vas où ?» — ask where anyone's headed, answer with what
 *  you own. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m5-2-info-tuvas",
      "Ask where they're headed",
      "«tu vas» — you're going (tu VAH — the same va that's been in «ça va» all along). The question, street-style: «Tu vas où ?» — where are you going? Any «je vais…» you own is an answer.",
      "grammar",
    ),
    {
      id: "fr-m5-2-map-tuvasou",
      type: "word_map",
      tokens: ["tu vas", "où"],
      pairs: [
        { en: "you're going", tokenIndex: 0 },
        { en: "where", tokenIndex: 1 },
      ],
      audioText: "tu vas où ?",
      revealNote:
        "Question word LAST, voice up — the same casual shape as «tu es d'où ?».",
    },
    speaking("fr-m5-2-speak-tuvasou", "tu vas où ?", "where are you going?", []),
    {
      id: "fr-m5-2-sim-lea",
      type: "dialogue_sim",
      scene: {
        emoji: "🏖️",
        title: "Léa, towel under her arm",
        setting: "You're headed the same way she is.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ou",
          npc: {
            speaker: "Léa",
            kana: "Tu vas où ?",
            audioText: "tu vas où ?",
            gloss: "Where are you going?",
          },
          goal: "The beach — tell her.",
          reply: {
            mode: "build",
            tiles: ["je vais", "à la", "plage", "au"],
            answer: "je vais à la plage",
            audioText: "je vais à la plage",
          },
          replyGloss: "I'm going to the beach.",
          explanation:
            "Her «tu vas», your «je vais» — the m2 flip, now with destinations.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m5-2-lc-tuvasaucinema",
      audioText: "tu vas au cinéma ?",
      correctMeaningEn: "Are you going to the movies?",
      distractorsEn: ["I'm going to the movies.", "Do you like the movies?", "Where is the cinema?"],
    }),
    // TAIL: L1's headline, from memory.
    speaking(
      "fr-m5-2-speak-aucinema-recall",
      "je vais au cinéma",
      "I'm going to the movies",
      [],
      "recall",
    ),
    cloze(
      "fr-m5-2-cloze-au",
      "tu vas",
      "musée ?",
      "au",
      ["au", "à la"],
      "are you going to the museum?",
      "tu vas au musée ?",
      "«musée» lies about its ending — blue-m, so the swallow: «au musée».",
    ),
    {
      // TAIL: m3 by ear.
      id: "fr-m5-2-hear-laglace",
      type: "word_image_mcq",
      meaningEn: "la glace",
      options: [
        { id: "correct", word: "la glace", emoji: "🍨" },
        { id: "o1", word: "la pizza", emoji: "🍕" },
        { id: "o2", word: "le chocolat", emoji: "🍫" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m5-2-build-tuvasalagare",
      "Build: 'are you going to the station?'",
      "tu vas à la gare ?",
      ["tu vas", "à la", "gare ?", "au"],
      ["tu vas", "à la", "gare ?"],
    ),
    listeningCompSentence({
      // TAIL: m4 existence lane, away from its source.
      id: "fr-m5-2-lc-pasdeplage",
      audioText: "il n'y a pas de plage",
      correctMeaningEn: "There's no beach.",
      distractorsEn: ["There is a beach.", "Where is the beach?", "I love the beach."],
    }),
    {
      id: "fr-m5-2-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-tuvas", source: "tu vas", target: "you're going" },
        { id: "p-tuvasou", source: "tu vas où ?", target: "where are you going?" },
        { id: "p-musee", source: "musée", target: "museum" },
        { id: "p-labas", source: "là-bas", target: "over there" },
        { id: "p-salut", source: "salut", target: "hi / bye (casual)" },
        { id: "p-trois", source: "trois", target: "three" },
      ],
    },
    // WIN: ask your friend — printed first voicing.
    speaking("fr-m5-2-speak-tuvasaucinema", "tu vas au cinéma ?", "are you going to the movies?", []),
  ];
}

/** L3 — «à l'» rides the squeeze: no new form, just à + the elided
 *  article m4 taught. Zero new atoms. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m5-3-info-al",
      "The squeeze goes traveling",
      "Vowel-start places pull the m4 trick after «à» too: «je vais à l'école», «à l'hôtel». No new word — «à» stays, the article squeezes, exactly like «l'école» on its own. Three shapes, one system: au cinéma, à la gare, à l'école.",
      "grammar",
    ),
    {
      id: "fr-m5-3-map-alecole",
      type: "word_map",
      tokens: ["je vais", "à", "l'école"],
      pairs: [
        { en: "I'm going", tokenIndex: 0 },
        { en: "to", tokenIndex: 1 },
        { en: "the school", tokenIndex: 2 },
      ],
      audioText: "je vais à l'école",
      tokenGenders: { 2: "f" },
      revealNote:
        "«à» survives untouched — it's the article that squeezes. Say it smooth: ah-lay-KOHL.",
    },
    speaking("fr-m5-3-speak-alecole", "je vais à l'école", "I'm going to school", []),
    cloze(
      "fr-m5-3-cloze-alecole",
      "je vais",
      "",
      "à l'école",
      ["à l'école", "à la école"],
      "I'm going to school",
      "je vais à l'école",
      "«à la» would need a consonant — école squeezes: «à l'école».",
    ),
    {
      // m4 squeeze words by ear.
      id: "fr-m5-3-hear-lhotel",
      type: "word_image_mcq",
      meaningEn: "l'hôtel",
      options: [
        { id: "correct", word: "l'hôtel", emoji: "🏨" },
        { id: "o1", word: "l'école", emoji: "🏫" },
        { id: "o2", word: "le restaurant", emoji: "🍽️" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L1 lane, from memory.
    speaking(
      "fr-m5-3-speak-alaplage-recall",
      "je vais à la plage",
      "I'm going to the beach",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m5-3-lc-alhotel",
      audioText: "je vais à l'hôtel",
      correctMeaningEn: "I'm going to the hotel.",
      distractorsEn: ["I'm going to school.", "Where is the hotel?", "There's a hotel here."],
    }),
    cloze(
      "fr-m5-3-cloze-alhotel",
      "je vais",
      "",
      "à l'hôtel",
      ["à l'hôtel", "au hôtel"],
      "I'm going to the hotel",
      "je vais à l'hôtel",
      "The silent h can't prop up «au» — hôtel squeezes too: «à l'hôtel».",
    ),
    build(
      "fr-m5-3-build-tuvasalecole",
      "Build: 'are you going to school?'",
      "tu vas à l'école ?",
      ["tu vas", "à", "l'école ?", "au"],
      ["tu vas", "à", "l'école ?"],
    ),
    listeningCompSentence({
      // TAIL: m3 tastes lane by ear.
      id: "fr-m5-3-lc-jaimelecinema",
      audioText: "j'aime le cinéma",
      correctMeaningEn: "I like the movies.",
      distractorsEn: ["I'm going to the movies.", "I don't like the movies.", "Do you like the movies?"],
    }),
    speaking("fr-m5-3-speak-alhotel", "je vais à l'hôtel", "I'm going to the hotel", []),
    {
      id: "fr-m5-3-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-ecole", source: "école", target: "school" },
        { id: "p-hotel", source: "hôtel", target: "hotel" },
        { id: "p-au", source: "au", target: "to the (le-words)" },
        { id: "p-ala", source: "à la", target: "to the (la-words)" },
        { id: "p-dou", source: "d'où", target: "from where" },
        { id: "p-bonnenuit", source: "bonne nuit", target: "good night" },
      ],
    },
    // WIN: the question loops back, from memory (voiced L2).
    speaking("fr-m5-3-speak-tuvasou-recall", "tu vas où ?", "where are you going?", [], "recall"),
  ];
}

/** L4 — «On va … ?» + «d'accord» — and the m2 line comes home. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m5-4-info-onva",
      "The plan-maker",
      "«on va» — we're going (ohn VAH; real spoken French says on, not nous) — and with a rising voice it INVITES: «On va au cinéma ?» — shall we go to the movies? Seal it with «d'accord» — deal (da-KOR, de + accord squeezed). And «demain» — tomorrow (duh-MAN).",
      "grammar",
    ),
    {
      id: "fr-m5-4-map-onvademain",
      type: "word_map",
      tokens: ["on va", "au", "cinéma", "demain"],
      pairs: [
        { en: "we're going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "movies", tokenIndex: 2 },
        { en: "tomorrow", tokenIndex: 3 },
      ],
      audioText: "on va au cinéma demain ?",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "Module 2, the café: Léa asked EXACTLY this, and you reached for «je ne comprends pas». Read it again. You own every word now.",
    },
    speaking(
      "fr-m5-4-speak-onvademain",
      "on va au cinéma demain ?",
      "shall we go to the movies tomorrow?",
      [],
    ),
    {
      // The arc payoff — the m2 line, verbatim, same clip.
      id: "fr-m5-4-sim-lea",
      type: "dialogue_sim",
      scene: {
        emoji: "☕",
        title: "Léa asks again",
        setting: "Same café as module 2. She remembers too.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-again",
          npc: {
            speaker: "Léa",
            kana: "On va au cinéma demain ?",
            audioText: "on va au cinéma demain ?",
            gloss: "Shall we go to the movies tomorrow?",
          },
          goal: "This time — say yes.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "comprends", text: "je ne comprends pas" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
          explanation:
            "«d'accord» — deal. Two modules ago this sentence was noise and you needed the escape phrase. Now it's a movie date.",
        },
      ],
    },
    speaking("fr-m5-4-speak-daccord", "d'accord", "okay — deal", []),
    listeningCompSentence({
      id: "fr-m5-4-lc-onvaalaplage",
      audioText: "on va à la plage demain ?",
      correctMeaningEn: "Shall we go to the beach tomorrow?",
      distractorsEn: [
        "Are you going to the beach?",
        "We're going to the movies tomorrow.",
        "Shall we go to the station tomorrow?",
      ],
    }),
    cloze(
      "fr-m5-4-cloze-au",
      "on va",
      "restaurant ?",
      "au",
      ["au", "à la"],
      "shall we go to the restaurant?",
      "on va au restaurant ?",
      "«restaurant» — blue-m, so the swallow: «au restaurant».",
    ),
    {
      // TAIL: m4 by ear.
      id: "fr-m5-4-hear-lerestaurant",
      type: "word_image_mcq",
      meaningEn: "le restaurant",
      options: [
        { id: "correct", word: "le restaurant", emoji: "🍽️" },
        { id: "o1", word: "le café", emoji: "☕" },
        { id: "o2", word: "l'hôtel", emoji: "🏨" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: the squeeze shape, from memory (voiced L3).
    speaking(
      "fr-m5-4-speak-alhotel-recall",
      "je vais à l'hôtel",
      "I'm going to the hotel",
      [],
      "recall",
    ),
    build(
      "fr-m5-4-build-onvaalaplage",
      "Build: 'shall we go to the beach?'",
      "on va à la plage ?",
      ["on va", "à la", "plage ?", "au"],
      ["on va", "à la", "plage ?"],
    ),
    vocabTextMcq("fr-m5-4-mc-demain", "demain", ["là-bas", "ici", "moi aussi"]),
    {
      id: "fr-m5-4-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-cinema", source: "cinéma", target: "the movies" },
        { id: "p-comprends", source: "je ne comprends pas", target: "I don't understand" },
        { id: "p-huit", source: "huit", target: "eight" },
      ],
    },
    // WIN: the payoff line, from memory.
    speaking(
      "fr-m5-4-speak-onvademain-recall",
      "on va au cinéma demain ?",
      "shall we go to the movies tomorrow?",
      [],
      "recall",
    ),
  ];
}

/** L5 — «ce soir»: tonight beats tomorrow. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m5-5-info-cesoir",
      "Tonight",
      "«ce soir» — tonight — literally 'this evening': the «soir» you've had since «bonsoir». «On va au restaurant ce soir ?» Tomorrow's plans are good; tonight's are better.",
      "grammar",
    ),
    {
      id: "fr-m5-5-map-cesoir",
      type: "word_map",
      tokens: ["on va", "au", "restaurant", "ce soir"],
      pairs: [
        { en: "we're going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "restaurant", tokenIndex: 2 },
        { en: "tonight", tokenIndex: 3 },
      ],
      audioText: "on va au restaurant ce soir ?",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote:
        "Plans stack like tiles: go-word, place, time. Swap any piece, keep the machine.",
    },
    speaking(
      "fr-m5-5-speak-cesoir",
      "on va au restaurant ce soir ?",
      "shall we go to the restaurant tonight?",
      [],
    ),
    {
      id: "fr-m5-5-sim-hugo",
      type: "dialogue_sim",
      scene: { emoji: "🍽️", title: "Hugo's big idea" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-resto",
          npc: {
            speaker: "Hugo",
            kana: "On va au restaurant ce soir ?",
            audioText: "on va au restaurant ce soir ?",
            gloss: "Shall we go to the restaurant tonight?",
          },
          goal: "Deal — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
          explanation:
            "«moi aussi» answers a statement — an INVITATION wants «d'accord».",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m5-5-lc-cesoir",
      audioText: "je vais au restaurant ce soir",
      correctMeaningEn: "I'm going to the restaurant tonight.",
      distractorsEn: [
        "Shall we go to the restaurant tonight?",
        "I'm going to the restaurant tomorrow.",
        "There's a restaurant here.",
      ],
    }),
    // TAIL: the deal-word, from memory (voiced L4).
    speaking("fr-m5-5-speak-daccord-recall", "d'accord", "okay — deal", [], "recall"),
    cloze(
      "fr-m5-5-cloze-ala",
      "on va",
      "gare demain ?",
      "à la",
      ["à la", "au"],
      "shall we go to the station tomorrow?",
      "on va à la gare demain ?",
      "«gare» — pink-f: «à la», even inside a plan.",
    ),
    {
      // TAIL: m3 by ear.
      id: "fr-m5-5-hear-lapizza",
      type: "word_image_mcq",
      meaningEn: "la pizza",
      options: [
        { id: "correct", word: "la pizza", emoji: "🍕" },
        { id: "o1", word: "la glace", emoji: "🍨" },
        { id: "o2", word: "le thé", emoji: "🍵" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m5-5-build-cesoir",
      "Build: 'I'm going to the movies tonight'",
      "je vais au cinéma ce soir",
      ["je vais", "au", "cinéma", "ce soir", "à la"],
      ["je vais", "au", "cinéma", "ce soir"],
      undefined,
      ["ce soir je vais au cinéma"],
    ),
    listeningCompSentence({
      // TAIL: m2 lane — the où-family stays discriminated.
      id: "fr-m5-5-lc-dou",
      audioText: "tu es d'où ?",
      correctMeaningEn: "Where are you FROM?",
      distractorsEn: ["Where are you going?", "What's your name?", "How's it going?"],
    }),
    {
      id: "fr-m5-5-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-soir", source: "soir", target: "evening" },
        { id: "p-bonsoir", source: "bonsoir", target: "good evening" },
        { id: "p-six", source: "six", target: "six" },
      ],
    },
    // WIN: tonight's plan, out loud — printed first voicing.
    speaking(
      "fr-m5-5-speak-cinemacesoir",
      "je vais au cinéma ce soir",
      "I'm going to the movies tonight",
      [],
    ),
  ];
}

/** L6 — Zero new: the invitation exchange, all three à-shapes live. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m5-6-sim-chloe",
      type: "dialogue_sim",
      scene: {
        emoji: "🏛️",
        title: "Chloé, curious as ever",
        setting: "You've got your walking shoes on.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ou",
          npc: {
            speaker: "Chloé",
            kana: "Tu vas où ?",
            audioText: "tu vas où ?",
            gloss: "Where are you going?",
          },
          goal: "The museum — tell her.",
          reply: {
            mode: "build",
            tiles: ["je vais", "au", "musée", "à la"],
            answer: "je vais au musée",
            audioText: "je vais au musée",
          },
          replyGloss: "I'm going to the museum.",
        },
        {
          id: "t2-ensemble",
          npc: {
            speaker: "Chloé",
            kana: "On va au musée ?",
            audioText: "on va au musée ?",
            gloss: "Shall WE go, then?",
          },
          goal: "Deal.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "pardon", text: "pardon" },
              { id: "labas", text: "là-bas" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
          explanation:
            "Her «on va» turned your trip into a plan — that's the invitation machine running both ways.",
        },
      ],
    },
    listeningCompSentence({
      id: "fr-m5-6-lc-tuvasalaplage",
      audioText: "tu vas à la plage ?",
      correctMeaningEn: "Are you going to the beach?",
      distractorsEn: ["Shall we go to the beach?", "Do you like the beach?", "Where is the beach?"],
    }),
    // TAIL: tonight's plan, from memory (voiced L5).
    speaking(
      "fr-m5-6-speak-cesoir-recall",
      "on va au restaurant ce soir ?",
      "shall we go to the restaurant tonight?",
      [],
      "recall",
    ),
    cloze(
      "fr-m5-6-cloze-alhotel",
      "tu vas",
      "?",
      "à l'hôtel",
      ["à l'hôtel", "à la hôtel"],
      "are you going to the hotel?",
      "tu vas à l'hôtel ?",
      "hôtel squeezes past both articles: «à l'hôtel».",
    ),
    {
      id: "fr-m5-6-map-garedemain",
      type: "word_map",
      tokens: ["je vais", "à la", "gare", "demain"],
      pairs: [
        { en: "I'm going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "station", tokenIndex: 2 },
        { en: "tomorrow", tokenIndex: 3 },
      ],
      audioText: "je vais à la gare demain",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote:
        "A plan with a timestamp — the same four-tile machine, pink-f edition.",
    },
    {
      // m4 places by ear.
      id: "fr-m5-6-hear-laplage",
      type: "word_image_mcq",
      meaningEn: "la plage",
      options: [
        { id: "correct", word: "la plage", emoji: "🏖️" },
        { id: "o1", word: "la gare", emoji: "🚉" },
        { id: "o2", word: "la ville", emoji: "🏙️" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "fr-m5-6-speak-garedemain",
      "je vais à la gare demain",
      "I'm going to the station tomorrow",
      [],
    ),
    listeningCompSentence({
      id: "fr-m5-6-lc-onvaauparc",
      audioText: "on va au parc ?",
      correctMeaningEn: "Shall we go to the park?",
      distractorsEn: ["Are you going to the park?", "There's a park.", "Where is the park?"],
    }),
    build(
      "fr-m5-6-build-aucafe",
      "Build: 'are you going to the café?'",
      "tu vas au café ?",
      ["tu vas", "au", "café ?", "à la"],
      ["tu vas", "au", "café ?"],
    ),
    vocabTextMcq("fr-m5-6-mc-cesoir", "ce soir", ["demain", "là-bas", "ici"]),
    {
      id: "fr-m5-6-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-au", source: "au", target: "to the (le-words)" },
        { id: "p-ala", source: "à la", target: "to the (la-words)" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-tuvasou", source: "tu vas où ?", target: "where are you going?" },
        { id: "p-pardon", source: "pardon", target: "excuse me / sorry" },
        { id: "p-sept", source: "sept", target: "seven" },
      ],
    },
    // WIN: the school run, from memory (voiced L3).
    speaking(
      "fr-m5-6-speak-alecole-recall",
      "je vais à l'école",
      "I'm going to school",
      [],
      "recall",
    ),
  ];
}

/** L7 — Zero new: sort every destination onto its à-shape, then run
 *  the whole plan machine. */
function lesson7(): LessonStep[] {
  return [
    genderSort({
      id: "fr-m5-7-sort",
      prompt: "Where to? Sort each place onto its à-shape.",
      buckets: [
        { id: "m", label: "au (blue-m)" },
        { id: "f", label: "à la (pink-f)" },
      ],
      items: [
        { id: "g-cinema", surface: "cinéma", bucketId: "m", meaningEn: "the movies" },
        { id: "g-gare", surface: "gare", bucketId: "f", meaningEn: "train station" },
        { id: "g-parc", surface: "parc", bucketId: "m", meaningEn: "park" },
        { id: "g-plage", surface: "plage", bucketId: "f", meaningEn: "beach" },
        { id: "g-cafe", surface: "café", bucketId: "m", meaningEn: "coffee / café" },
        { id: "g-restaurant", surface: "restaurant", bucketId: "m", meaningEn: "restaurant" },
      ],
      endingRule:
        "«au» for the blue-m side, «à la» for pink-f — and the vowel-starters dodge both: à l'école, à l'hôtel.",
    }),
    // TAIL: L2's win, from memory.
    speaking(
      "fr-m5-7-speak-tuvasaucinema-recall",
      "tu vas au cinéma ?",
      "are you going to the movies?",
      [],
      "recall",
    ),
    cloze(
      "fr-m5-7-cloze-au",
      "je vais",
      "musée demain",
      "au",
      ["au", "à la"],
      "I'm going to the museum tomorrow",
      "je vais au musée demain",
      "Blue-m keeps the swallow even with a timestamp: «au musée demain».",
    ),
    listeningCompSentence({
      // «d'accord» gets its solo ear beat.
      id: "fr-m5-7-lc-daccord",
      audioText: "d'accord",
      correctMeaningEn: "Okay — deal.",
      distractorsEn: ["Me too.", "Over there.", "And you?"],
    }),
    build(
      "fr-m5-7-build-cinemacesoir",
      "Build: 'shall we go to the movies tonight?'",
      "on va au cinéma ce soir ?",
      ["on va", "au", "cinéma", "ce soir ?", "à la"],
      ["on va", "au", "cinéma", "ce soir ?"],
    ),
    {
      id: "fr-m5-7-hear-lagare",
      type: "word_image_mcq",
      meaningEn: "la gare",
      options: [
        { id: "correct", word: "la gare", emoji: "🚉" },
        { id: "o1", word: "la ville", emoji: "🏙️" },
        { id: "o2", word: "le parc", emoji: "🌳" },
      ],
      correctOptionId: "correct",
    },
    // TAIL: L6's timestamped plan, from memory.
    speaking(
      "fr-m5-7-speak-garedemain-recall",
      "je vais à la gare demain",
      "I'm going to the station tomorrow",
      [],
      "recall",
    ),
    cloze(
      "fr-m5-7-cloze-alecole",
      "on va",
      "?",
      "à l'école",
      ["à l'école", "à la école"],
      "shall we go to the school?",
      "on va à l'école ?",
      "The squeeze holds inside invitations too: «à l'école».",
    ),
    {
      id: "fr-m5-7-sim-emma",
      type: "dialogue_sim",
      scene: { emoji: "🌳", title: "Emma, out walking" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ou",
          npc: {
            speaker: "Emma",
            kana: "Tu vas où ?",
            audioText: "tu vas où ?",
            gloss: "Where are you going?",
          },
          goal: "The park — tell her.",
          reply: {
            mode: "build",
            tiles: ["je vais", "au", "parc", "à la"],
            answer: "je vais au parc",
            audioText: "je vais au parc",
          },
          replyGloss: "I'm going to the park.",
          explanation:
            "Three shapes, zero hesitation — the à-machine is yours now.",
        },
      ],
    },
    listeningCompSentence({
      // TAIL: m1 lane by ear.
      id: "fr-m5-7-lc-abientot",
      audioText: "à bientôt",
      correctMeaningEn: "See you soon.",
      distractorsEn: ["Good night.", "Over there.", "Tomorrow."],
    }),
    {
      id: "fr-m5-7-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-gare", source: "gare", target: "train station" },
        { id: "p-cestquoi", source: "c'est quoi ?", target: "what is that?" },
        { id: "p-abientot", source: "à bientôt", target: "see you soon" },
        { id: "p-neuf", source: "neuf", target: "nine" },
      ],
    },
    // WIN: tonight's invitation — printed first voicing.
    speaking(
      "fr-m5-7-speak-cinemacesoir",
      "on va au cinéma ce soir ?",
      "shall we go to the movies tonight?",
      [],
    ),
  ];
}

/** L8 — CHECKPOINT (zero new, graded only): all three à-shapes on
 *  alternating answers, invitations discriminated, plans produced. */
function checkpointLesson(): LessonStep[] {
  return [
    {
      id: "fr-m5-8-hear-lecinema",
      type: "word_image_mcq",
      meaningEn: "le cinéma",
      options: [
        { id: "correct", word: "le cinéma", emoji: "🎬" },
        { id: "o1", word: "le musée", emoji: "🏛️" },
        { id: "o2", word: "la gare", emoji: "🚉" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m5-8-cloze-au",
      "je vais",
      "cinéma",
      "au",
      ["au", "à la"],
      "I'm going to the movies",
      "je vais au cinéma",
      "«cinéma» — blue-m: the swallow.",
    ),
    speaking("fr-m5-8-speak-tuvasou-recall", "tu vas où ?", "where are you going?", [], "recall"),
    listeningCompSentence({
      id: "fr-m5-8-lc-onvaalaplage",
      audioText: "on va à la plage ?",
      correctMeaningEn: "Shall we go to the beach?",
      distractorsEn: ["Are you going to the beach?", "There's a beach.", "I love the beach."],
    }),
    vocabTextMcq("fr-m5-8-mc-daccord", "d'accord", ["moi aussi", "et toi ?", "non"]),
    build(
      "fr-m5-8-build-alecole",
      "Build: 'I'm going to school'",
      "je vais à l'école",
      ["je vais", "à", "l'école", "au", "à la"],
      ["je vais", "à", "l'école"],
    ),
    {
      id: "fr-m5-8-hear-lecole",
      type: "word_image_mcq",
      meaningEn: "l'école",
      options: [
        { id: "correct", word: "l'école", emoji: "🏫" },
        { id: "o1", word: "l'hôtel", emoji: "🏨" },
        { id: "o2", word: "le musée", emoji: "🏛️" },
      ],
      correctOptionId: "correct",
    },
    cloze(
      "fr-m5-8-cloze-ala",
      "tu vas",
      "plage ?",
      "à la",
      ["à la", "au"],
      "are you going to the beach?",
      "tu vas à la plage ?",
      "«plage» — pink-f: both pieces stay.",
    ),
    speaking(
      "fr-m5-8-speak-aucinema-recall",
      "je vais au cinéma",
      "I'm going to the movies",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m5-8-lc-alhotel",
      audioText: "tu vas à l'hôtel ?",
      correctMeaningEn: "Are you going to the hotel?",
      distractorsEn: ["Shall we go to the hotel?", "Where is the hotel?", "There's a hotel here."],
    }),
    build(
      "fr-m5-8-build-cesoir",
      "Build: 'shall we go to the restaurant tonight?'",
      "on va au restaurant ce soir ?",
      ["on va", "au", "restaurant", "ce soir ?", "à la"],
      ["on va", "au", "restaurant", "ce soir ?"],
    ),
    cloze(
      "fr-m5-8-cloze-demain",
      "on va au cinéma",
      "?",
      "demain",
      ["demain", "ce soir"],
      "shall we go to the movies TOMORROW?",
      "on va au cinéma demain ?",
      "«demain» stamps it for tomorrow — «ce soir» would move it to tonight.",
    ),
    {
      id: "fr-m5-8-hear-laplage",
      type: "word_image_mcq",
      meaningEn: "la plage",
      options: [
        { id: "correct", word: "la plage", emoji: "🏖️" },
        { id: "o1", word: "la glace", emoji: "🍨" },
        { id: "o2", word: "la gare", emoji: "🚉" },
      ],
      correctOptionId: "correct",
    },
    listeningCompSentence({
      // The où-family discrimination by EAR: vas-où vs es-d'où.
      id: "fr-m5-8-lc-tuvasou",
      audioText: "tu vas où ?",
      correctMeaningEn: "Where are you GOING?",
      distractorsEn: ["Where are you FROM?", "What is that?", "And you?"],
    }),
    speaking(
      "fr-m5-8-speak-cesoir-recall",
      "on va au restaurant ce soir ?",
      "shall we go to the restaurant tonight?",
      [],
      "recall",
    ),
    {
      id: "fr-m5-8-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jevais", source: "je vais", target: "I'm going" },
        { id: "p-tuvas", source: "tu vas", target: "you're going" },
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-au", source: "au", target: "to the (le-words)" },
        { id: "p-ala", source: "à la", target: "to the (la-words)" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
      ],
    },
  ];
}

/** L9 — The plan: the gang books the whole weekend, then the tail. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m5-9-sim-plan",
      type: "dialogue_sim",
      scene: {
        emoji: "🎬",
        title: "The plan",
        setting: "Chloé, Hugo and Emma, all talking at once.",
      },
      exercisedAtomIds: [],
      explanation:
        "A destination, two invitations and a timetable — a whole weekend, planned in French.",
      turns: [
        {
          id: "t1-ou",
          npc: {
            speaker: "Chloé",
            kana: "Tu vas où ?",
            audioText: "tu vas où ?",
            gloss: "Where are you going?",
          },
          goal: "The cinema — tell her.",
          reply: {
            mode: "build",
            tiles: ["je vais", "au", "cinéma", "à la"],
            answer: "je vais au cinéma",
            audioText: "je vais au cinéma",
          },
          replyGloss: "I'm going to the movies.",
        },
        {
          id: "t2-cesoir",
          npc: {
            speaker: "Chloé",
            kana: "On va au cinéma ce soir ?",
            audioText: "on va au cinéma ce soir ?",
            gloss: "Shall we go tonight — together?",
          },
          goal: "Deal!",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "comprends", text: "je ne comprends pas" },
              { id: "dou", text: "tu es d'où ?" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
        {
          id: "t3-gare",
          npc: {
            speaker: "Emma",
            kana: "Tu vas à la gare demain ?",
            audioText: "tu vas à la gare demain ?",
            gloss: "Are you going to the station tomorrow?",
          },
          goal: "You are — Louis arrives.",
          reply: {
            mode: "choice",
            options: [
              { id: "ouijevais", text: "oui je vais à la gare" },
              { id: "ouituvas", text: "oui tu vas à la gare" },
              { id: "pasde", text: "il n'y a pas de gare" },
            ],
            correctOptionId: "ouijevais",
            audioText: "oui je vais à la gare",
          },
          replyGloss: "Yes, I'm going to the station.",
          explanation:
            "Her «tu vas», your «je vais» — the flip never retires.",
        },
        {
          id: "t4-bye",
          npc: {
            speaker: "Hugo",
            kana: "À bientôt !",
            audioText: "à bientôt",
            gloss: "See you soon!",
          },
          goal: "Send them off.",
          reply: {
            mode: "choice",
            options: [
              { id: "abientot", text: "à bientôt" },
              { id: "aurevoir", text: "au revoir" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "abientot",
            alsoCorrectOptionIds: ["aurevoir"],
            audioText: "à bientôt",
          },
          replyGloss: "See you soon!",
        },
      ],
    },
    build(
      "fr-m5-9-build-plagedemain",
      "Build: 'shall we go to the beach tomorrow?'",
      "on va à la plage demain ?",
      ["on va", "à la", "plage", "demain ?", "au"],
      ["on va", "à la", "plage", "demain ?"],
    ),
    listeningCompSentence({
      id: "fr-m5-9-lc-aumusee",
      audioText: "je vais au musée",
      correctMeaningEn: "I'm going to the museum.",
      distractorsEn: ["Shall we go to the museum?", "Where is the museum?", "I like the museum."],
    }),
    // The L7 win, from memory.
    speaking(
      "fr-m5-9-speak-cinemacesoir-recall",
      "on va au cinéma ce soir ?",
      "shall we go to the movies tonight?",
      [],
      "recall",
    ),
    cloze(
      "fr-m5-9-cloze-alecole",
      "je vais",
      "demain",
      "à l'école",
      ["à l'école", "au école"],
      "I'm going to school tomorrow",
      "je vais à l'école demain",
      "The squeeze survives the timestamp: «à l'école demain».",
    ),
    {
      id: "fr-m5-9-hear-lemusee",
      type: "word_image_mcq",
      meaningEn: "le musée",
      options: [
        { id: "correct", word: "le musée", emoji: "🏛️" },
        { id: "o1", word: "le cinéma", emoji: "🎬" },
        { id: "o2", word: "l'hôtel", emoji: "🏨" },
      ],
      correctOptionId: "correct",
    },
    listeningBuildSentence({
      id: "fr-m5-9-lbuild-garedemain",
      target: "je vais à la gare demain",
      tiles: ["je vais", "à la", "gare", "demain", "au"],
      correctOrder: ["je vais", "à la", "gare", "demain"],
      promptEn: "Build what you hear",
    }),
    vocabTextMcq("fr-m5-9-mc-onva", "on va", ["je vais", "tu vas", "il y a"]),
    {
      id: "fr-m5-9-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-jevais", source: "je vais", target: "I'm going" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-cesoir", source: "ce soir", target: "tonight" },
        { id: "p-plage", source: "plage", target: "beach" },
        { id: "p-cava", source: "ça va", target: "how's it going?" },
        { id: "p-cinq", source: "cinq", target: "five" },
      ],
    },
    // WIN: the arc line, one last time — from memory.
    speaking(
      "fr-m5-9-speak-onvademain-recall",
      "on va au cinéma demain ?",
      "shall we go to the movies tomorrow?",
      [],
      "recall",
    ),
  ];
}

/** L10 — Mastery. Graded only; every item; ends at the gare — Louis
 *  arrives, and the plans are yours. */
function lesson10(): LessonStep[] {
  return [
    {
      id: "fr-m5-10-hear-lecinema",
      type: "word_image_mcq",
      meaningEn: "le cinéma",
      options: [
        { id: "correct", word: "le cinéma", emoji: "🎬" },
        { id: "o1", word: "le restaurant", emoji: "🍽️" },
        { id: "o2", word: "la plage", emoji: "🏖️" },
      ],
      correctOptionId: "correct",
    },
    build(
      "fr-m5-10-build-garedemain",
      "Build: 'I'm going to the station tomorrow'",
      "je vais à la gare demain",
      ["je vais", "à la", "gare", "demain", "au"],
      ["je vais", "à la", "gare", "demain"],
      undefined,
      ["demain je vais à la gare"],
    ),
    cloze(
      "fr-m5-10-cloze-au",
      "on va",
      "musée ?",
      "au",
      ["au", "à la"],
      "shall we go to the museum?",
      "on va au musée ?",
      "«musée» — blue-m, whatever its ending claims: «au musée».",
    ),
    listeningCompSentence({
      id: "fr-m5-10-lc-cesoir",
      audioText: "on va au cinéma ce soir ?",
      correctMeaningEn: "Shall we go to the movies tonight?",
      distractorsEn: [
        "Shall we go to the movies tomorrow?",
        "Are you going to the movies?",
        "I like the movies.",
      ],
    }),
    speaking(
      "fr-m5-10-speak-aucinema-recall",
      "je vais au cinéma",
      "I'm going to the movies",
      [],
      "recall",
    ),
    vocabTextMcq("fr-m5-10-mc-cesoir", "ce soir", ["demain", "ici", "là-bas"]),
    cloze(
      "fr-m5-10-cloze-ala",
      "je vais",
      "plage",
      "à la",
      ["à la", "au"],
      "I'm going to the beach",
      "je vais à la plage",
      "Pink-f: both pieces, always.",
    ),
    listeningCompSentence({
      id: "fr-m5-10-lc-tuvasou",
      audioText: "tu vas où ?",
      correctMeaningEn: "Where are you going?",
      distractorsEn: ["Where are you from?", "How's it going?", "Shall we go?"],
    }),
    build(
      "fr-m5-10-build-onvalecole",
      "Build: 'shall we go to the school?'",
      "on va à l'école ?",
      ["on va", "à", "l'école ?", "au"],
      ["on va", "à", "l'école ?"],
    ),
    {
      id: "fr-m5-10-hear-lagare",
      type: "word_image_mcq",
      meaningEn: "la gare",
      options: [
        { id: "correct", word: "la gare", emoji: "🚉" },
        { id: "o1", word: "l'école", emoji: "🏫" },
        { id: "o2", word: "la plage", emoji: "🏖️" },
      ],
      correctOptionId: "correct",
    },
    speaking(
      "fr-m5-10-speak-garedemain-recall",
      "je vais à la gare demain",
      "I'm going to the station tomorrow",
      [],
      "recall",
    ),
    cloze(
      "fr-m5-10-cloze-cesoir",
      "on va au cinéma",
      "?",
      "ce soir",
      ["ce soir", "demain"],
      "shall we go to the movies TONIGHT?",
      "on va au cinéma ce soir ?",
      "«ce soir» — tonight. The checkpoint stamped tomorrow; this one can't wait.",
    ),
    {
      id: "fr-m5-10-match",
      type: "match_pairs",
      prompt: "Match them.",
      pairs: [
        { id: "p-tuvasou", source: "tu vas où ?", target: "where are you going?" },
        { id: "p-onva", source: "on va", target: "we're going" },
        { id: "p-ala", source: "à la", target: "to the (la-words)" },
        { id: "p-demain", source: "demain", target: "tomorrow" },
        { id: "p-daccord", source: "d'accord", target: "okay / deal" },
        { id: "p-gare", source: "gare", target: "train station" },
      ],
    },
    {
      // THE MODULE ENDS AT THE GARE — the L9 plan, kept.
      id: "fr-m5-10-sim-louis",
      type: "dialogue_sim",
      scene: {
        emoji: "🚉",
        title: "La gare, 9h — Louis arrives",
        setting: "You said you'd be here. You are.",
      },
      exercisedAtomIds: [],
      explanation:
        "That's the module: you go places, you invite, you agree — French plans, made and kept. Module 6: what you do when you get there.",
      turns: [
        {
          id: "t1-checkin",
          npc: {
            speaker: "Louis",
            kana: "Salut ! Ça va ?",
            audioText: "ça va",
            gloss: "Hi! How's it going?",
          },
          goal: "Answer — bounce it back.",
          reply: {
            mode: "build",
            tiles: ["ça va", "bien", "et toi ?", "non merci"],
            answer: "ça va bien et toi ?",
            alsoAccepted: ["ça va bien", "ça va et toi ?", "ça va"],
            audioText: "ça va bien et toi ?",
          },
          replyGloss: "Fine — and you?",
        },
        {
          id: "t2-cafe",
          npc: {
            speaker: "Louis",
            kana: "On va au café ?",
            audioText: "on va au café ?",
            gloss: "Shall we get a coffee?",
          },
          goal: "Deal.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "moiaussi", text: "moi aussi" },
              { id: "pardon", text: "pardon" },
            ],
            correctOptionId: "daccord",
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
        },
        {
          id: "t3-ville",
          npc: {
            speaker: "Louis",
            kana: "Tu aimes la ville ?",
            audioText: "tu aimes la ville ?",
            gloss: "Do you like the town?",
          },
          goal: "You do — say so.",
          reply: {
            mode: "choice",
            options: [
              { id: "jaime", text: "oui j'aime la ville" },
              { id: "tuaimes", text: "oui tu aimes la ville" },
              { id: "tuvasou", text: "tu vas où ?" },
            ],
            correctOptionId: "jaime",
            audioText: "oui j'aime la ville",
          },
          replyGloss: "Yes, I love the town.",
        },
        {
          id: "t4-plage",
          npc: {
            speaker: "Léa",
            kana: "On va à la plage demain ?",
            audioText: "on va à la plage demain ?",
            gloss: "Shall we go to the beach tomorrow?",
          },
          goal: "Seal it — or be honest.",
          reply: {
            mode: "choice",
            options: [
              { id: "daccord", text: "d'accord !" },
              { id: "pasde", text: "il n'y a pas de plage" },
              { id: "dou", text: "tu es d'où ?" },
            ],
            correctOptionId: "daccord",
            alsoCorrectOptionIds: ["pasde"],
            audioText: "d'accord",
          },
          replyGloss: "Deal!",
          explanation:
            "«d'accord» seals it — though module 4's truth stands: this town has no beach. Someone honest may say so. Road trip, then.",
        },
      ],
    },
  ];
}

const FR_M5_1: LessonContent = {
  id: "fr-m5-1",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Going places — «au»",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M5_2: LessonContent = {
  id: "fr-m5-2",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Ask where they're headed",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M5_3: LessonContent = {
  id: "fr-m5-3",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The squeeze goes traveling",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M5_4: LessonContent = {
  id: "fr-m5-4",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "«On va… ?» — the plan-maker",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M5_5: LessonContent = {
  id: "fr-m5-5",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Tonight beats tomorrow",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M5_6: LessonContent = {
  id: "fr-m5-6",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The invitation machine",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M5_7: LessonContent = {
  id: "fr-m5-7",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Every road, sorted",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M5_8: LessonContent = {
  id: "fr-m5-8",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Warm up for the plan",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M5_9: LessonContent = {
  id: "fr-m5-9",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The plan",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M5_10: LessonContent = {
  id: "fr-m5-10",
  moduleId: "m5",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Prove it — keep the plan",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M5_MODULE: FrModuleDef = {
  title: "On y va — going places",
  eyebrow: "Module 5",
  summary:
    "Say where you're going («je vais au cinéma»), ask where they're headed, and make plans that stick: «On va… ?» — «d'accord !»",
  lessons: [
    FR_M5_1,
    FR_M5_2,
    FR_M5_3,
    FR_M5_4,
    FR_M5_5,
    FR_M5_6,
    FR_M5_7,
    FR_M5_8,
    FR_M5_9,
    FR_M5_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M5_CHECKPOINT_INDEX = 8;

export const FR_M5_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m5-s",
    moduleId: "m5",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m5-s",
        prompt: "Complete: «Je vais ___ cinéma.»",
        correctText: "au",
        distractorsText: ["à la", "le", "de"],
      }),
  },
  {
    id: "pt-fr-m5-1",
    moduleId: "m5",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m5-1",
        prompt: "'Shall we go to the beach?' — pick the French.",
        correctText: "on va à la plage ?",
        distractorsText: ["on va au plage ?", "tu vas à la plage", "il y a une plage ?"],
      }),
  },
  {
    id: "pt-fr-m5-2",
    moduleId: "m5",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m5-2",
        prompt: "Pick the phrase that seals a plan.",
        correctText: "d'accord",
        distractorsText: ["moi aussi", "et toi ?", "là-bas"],
      }),
  },
  {
    id: "pt-fr-m5-3",
    moduleId: "m5",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m5-3",
        prompt: "'I'm going to the school' — pick the French.",
        correctText: "je vais à l'école",
        distractorsText: ["je vais au école", "je vais à la école", "je vais le école"],
      }),
  },
  {
    id: "pt-fr-m5-4",
    moduleId: "m5",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m5-4",
        prompt: "'Where are you going?' — pick the French.",
        correctText: "tu vas où ?",
        distractorsText: ["tu es d'où ?", "c'est quoi ?", "tu vas ici ?"],
      }),
  },
];
