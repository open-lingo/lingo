/**
 * m12.ts — «C'est combien ?» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m12-brief-2026-09-10.md: the number
 * machine opens past ten. The course already knows zéro–dix (m1); this
 * module builds the regular compositional tens (vingt/trente/quarante/
 * cinquante/soixante) plus the round ceiling «cent», and puts them to work
 * pricing things: «ça coûte», «c'est cher», «ce n'est pas cher».
 *
 * SCOPE DECISIONS (all deliberate, brief §7):
 *   - REGULAR TENS ONLY (20–69) + «cent» exactly at 100. Teens (11–19) and
 *     the irregular 70–99 band are explicitly deferred to a later module
 *     (playbook §6 deferred registry) — this module's job is the clean
 *     "one engine, six gears" compositional pattern (X0, X0-et-un, X0-deux
 *     … X0-neuf), not the historical irregularities.
 *   - «et» gets NO new atom: it is already `FR_FUNCTION_WORDS` chrome
 *     (moduleBarGuards.ts) and «combien»/«quel(le)(s)» likewise — verified
 *     against the live set before touching anything, brief's own flagged
 *     row confirmed correct.
 *   - «centime» is CUT (brief §7.5) — this module's price scenes only ever
 *     land on whole-euro amounts; a currency subunit with no lesson use
 *     would ship unexercised.
 *   - SPOKEN CEILING = 20 (brief §6/§7.3): `ROMANCE_NUMBER_WORDS`
 *     (`src/shared/speech/loose-match.ts`) only covers 0–20, so a
 *     Whisper-graded `speaking` step targeting 21+ risks an ITN inversion
 *     with no word to map back to. Every `speaking` step in this module
 *     keeps its number content at "vingt" or below (or no number at all);
 *     21–100 appear ONLY in written steps (word_map, cloze, build,
 *     sentenceMcq, listening_comprehension, dialogue_sim choice text).
 *     m12.test.ts pins this as a hard bespoke assertion.
 *   - Tens/«cent» are `partOfSpeech:"other"` (m1's digit convention), NOT
 *     nouns — no gender, no vocabMcq/word_image_mcq (both hard-require an
 *     emoji-bearing option); they debut via `word_map`/`cloze`/build
 *     context, same treatment m11 gave «français»/«anglais». No emoji
 *     fits "twenty" the way a keycap fits a single digit.
 *   - «euro» IS a noun (masc., «un euro» / «deux euros» — the -s lands on
 *     the noun, never the number) and gets 💶; vendored this session
 *     (`src/pub/noto-emoji/svg/emoji_u1f4b6.svg`, absent before today).
 *     «c'est cher» keeps 💸 (already vendored). No emoji for «ça coûte» /
 *     «ce n'est pas cher» — frozen verb phrases, not imageable nouns.
 *   - «ce n'est pas cher», NOT «c'est pas cher» — full `ne…pas` register
 *     (brief §7.4); the ne-drop register is explicitly deferred to m13
 *     (playbook §6/F10), so this module never authors a dropped «ne».
 *   - No new `liaisonListen` item (brief §5): «vingt euros» links its
 *     normally-silent -t (/vɛ̃t øʁo/), but liaison items stay the small
 *     enumerated set pinned from m10 — the TTS clip simply IS the correct
 *     liaison; nothing here grades the phenomenon explicitly.
 *   - Hyphenated compounds (vingt-deux … soixante-neuf) are authored as
 *     ONE indivisible tile in every build bank — `BuildSentenceStepView`'s
 *     word-granularity join uses `.join(" ")`, never a hyphen, so a split
 *     tile pair would render "vingt deux" with a stray space. «vingt et
 *     un»-style compounds (the X1 forms) DO split into three
 *     space-joined tiles («vingt» / «et» / «un») since spacing is correct
 *     there. Same convention m11 used for «j'habite» / «à Paris».
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   vingt L1 · c'est combien ? L6 · ça coûte vingt euros L6 · c'est cher
 *   L7 · ce n'est pas cher L7.
 *   recalls drawn: vingt L2 (internal) · mon frère est très grand L2 (m9) ·
 *   il parle français L3 (m11) · c'est lundi L4 (m8) · je vais au cinéma
 *   L5 (m5) · vingt L8 (internal) · c'est cher L8 (internal) · c'est
 *   combien ? L9 (internal) · je voudrais un croissant L9 (m6) · vingt L10
 *   (internal) · ce n'est pas cher L10 (internal). Total 11 recalls, 5
 *   cross-module (m9/m11/m8/m5/m6) — comfortably over the ≥8 floor and the
 *   2–3 cross-module band.
 *
 * Cast: a market-stall vendor (L6) haggling in whole euros; a boutique
 * scene (L9) mixing «je voudrais» with a price and a cher/pas-cher
 * reaction; a video-call recap (L10, reusing the m11 video-call frame)
 * that closes on an ordinary cher/pas-cher agreement beat — NOT a «je
 * sais pas» tease (that draft line used an untaught verb, «savoir», and
 * the untaught intensifier «si», and would have shipped the ne-drop
 * register a full module early; pin F10 reserves ne-drop for m13).
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
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

export const FR_M12_ATOMS: FrAtom[] = [
  atom({ surface: "vingt", meaningEn: "twenty", partOfSpeech: "other", fromModule: "m12", kind: "vocab", hint: "van — the final t is silent alone but LINKS in «vingt euros»" }),
  atom({ surface: "trente", meaningEn: "thirty", partOfSpeech: "other", fromModule: "m12", kind: "vocab", hint: "trahnt" }),
  atom({ surface: "quarante", meaningEn: "forty", partOfSpeech: "other", fromModule: "m12", kind: "vocab", hint: "ka-RAHNT" }),
  atom({ surface: "cinquante", meaningEn: "fifty", partOfSpeech: "other", fromModule: "m12", kind: "vocab", hint: "san-KAHNT — not to be confused with «cinq»" }),
  atom({ surface: "soixante", meaningEn: "sixty", partOfSpeech: "other", fromModule: "m12", kind: "vocab", hint: "swa-SAHNT — the ceiling of the regular tens" }),
  atom({ surface: "cent", meaningEn: "one hundred", partOfSpeech: "other", fromModule: "m12", kind: "vocab", hint: "sahn — the round ceiling, invariant at exactly 100" }),
  atom({ surface: "euro", meaningEn: "euro (currency)", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", emoji: "💶", hint: "OO-ro — un euro, deux euros: the NOUN takes -s, never the number" }),
  atom({ surface: "euros", meaningEn: "euros (currency, plural)", partOfSpeech: "noun", fromModule: "m12", kind: "vocab", gender: "m", homophoneKey: "øʁo", hint: "same sound as «euro» — the plural -s is silent" }),
  atom({ surface: "ça coûte", meaningEn: "it costs", partOfSpeech: "verb", fromModule: "m12", kind: "phrase", hint: "sa koot — frozen, like «c'est»; never conjugated by subject here" }),
  atom({ surface: "c'est cher", meaningEn: "it's expensive", partOfSpeech: "adjective", fromModule: "m12", kind: "phrase", emoji: "💸", hint: "say shair" }),
  atom({ surface: "ce n'est pas cher", meaningEn: "it's not expensive / it's cheap", partOfSpeech: "adjective", fromModule: "m12", kind: "phrase", hint: "suh nay pa shair — full «ne…pas», same shape as m2's «je ne comprends pas»" }),
];

/** L1 — «Vingt»: the next round number after dix, plus the composition
 *  rule (et-un / hyphen) written-only for anything past twenty itself. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m12-1-info-vingt",
      "Après dix, vingt",
      "You already count to ten. «Vingt» is the next round number — twenty. To build the numbers between tens, French adds «et un» for X1 (vingt et un = 21) and a hyphen for X2–X9 (vingt-deux = 22). Every later ten — trente, quarante… — follows this exact same pattern.",
    ),
    {
      id: "fr-m12-1-map-countup",
      type: "word_map",
      tokens: ["huit", "neuf", "dix", "vingt"],
      pairs: [
        { en: "eight", tokenIndex: 0 },
        { en: "nine", tokenIndex: 1 },
        { en: "ten", tokenIndex: 2 },
        { en: "twenty", tokenIndex: 3 },
      ],
      audioText: "huit, neuf, dix, vingt",
      revealNote: "«vingt» — the next round number after «dix».",
    },
    speaking("fr-m12-1-speak-vingt", "vingt", "twenty", ["vingt"]),
    cloze(
      "fr-m12-1-cloze-vingtetun",
      "",
      "",
      "vingt et un",
      ["vingt et un", "vingt-deux", "vingt-quatre"],
      "twenty-one",
      "vingt et un",
      "X1 numbers use «et un» — vingt ET un, not vingt-un.",
    ),
    build(
      "fr-m12-1-build-vingtetun",
      "Build: 'twenty-one'",
      "vingt et un",
      ["vingt", "et", "un", "dix", "neuf"],
      ["vingt", "et", "un"],
    ),
    sentenceMcq({
      id: "fr-m12-1-smcq-vingttrois",
      prompt: "'Twenty-three' — pick the French.",
      correctText: "vingt-trois",
      distractorsText: ["vingt-deux", "vingt et un", "vingt-cinq"],
    }),
    build(
      "fr-m12-1-build-vingtdeux",
      "Build: 'twenty-two'",
      "vingt-deux",
      ["vingt-deux", "vingt et un", "dix"],
      ["vingt-deux"],
    ),
    listeningCompSentence({
      id: "fr-m12-1-lc-vingtquatre",
      audioText: "vingt-quatre",
      correctMeaningEn: "twenty-four",
      distractorsEn: ["twenty-five", "twenty", "twenty-two"],
    }),
    build(
      "fr-m12-1-build-vingtcinq",
      "Build: 'twenty-five'",
      "vingt-cinq",
      ["vingt-cinq", "vingt-quatre", "vingt-trois"],
      ["vingt-cinq"],
    ),
    {
      id: "fr-m12-1-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "vingt", target: "twenty" },
        { id: "p2", source: "vingt et un", target: "twenty-one" },
        { id: "p3", source: "vingt-deux", target: "twenty-two" },
        { id: "p4", source: "huit", target: "eight" },
        { id: "p5", source: "neuf", target: "nine" },
        { id: "p6", source: "dix", target: "ten" },
      ],
    },
  ];
}

/** L2 — «Trente, quarante»: two more tens, interleaved with an m9 recall
 *  break so the module doesn't block-teach numbers three lessons straight. */
function lesson2(): LessonStep[] {
  return [
    {
      id: "fr-m12-2-map-trente",
      type: "word_map",
      tokens: ["vingt", "trente", "quarante"],
      pairs: [
        { en: "twenty", tokenIndex: 0 },
        { en: "thirty", tokenIndex: 1 },
        { en: "forty", tokenIndex: 2 },
      ],
      audioText: "vingt, trente, quarante",
      revealNote: "Same engine, two new gears — «trente» and «quarante».",
    },
    build(
      "fr-m12-2-build-trenteetun",
      "Build: 'thirty-one'",
      "trente et un",
      ["trente", "et", "un", "vingt", "quarante"],
      ["trente", "et", "un"],
    ),
    speaking(
      "fr-m12-2-speak-vingt-recall",
      "vingt",
      "twenty",
      [],
      "recall",
    ),
    build(
      "fr-m12-2-build-quarantecinq",
      "Build: 'forty-five'",
      "quarante-cinq",
      ["quarante-cinq", "trente-cinq", "vingt-cinq"],
      ["quarante-cinq"],
    ),
    cloze(
      "fr-m12-2-cloze-quarante",
      "",
      "",
      "quarante",
      ["quarante", "trente", "vingt"],
      "forty",
      "quarante",
    ),
    // Interleave break — an m9 recall so numbers don't block-teach solo.
    speaking(
      "fr-m12-2-speak-fam-recall",
      "mon frère est très grand",
      "my brother is very tall",
      [],
      "recall",
    ),
    build(
      "fr-m12-2-build-quaranteneuf",
      "Build: 'forty-nine'",
      "quarante-neuf",
      ["quarante-neuf", "trente-neuf", "quarante et un"],
      ["quarante-neuf"],
    ),
    sentenceMcq({
      id: "fr-m12-2-smcq-trentesept",
      prompt: "'Thirty-seven' — pick the French.",
      correctText: "trente-sept",
      distractorsText: ["trente-huit", "quarante-sept", "vingt-sept"],
    }),
    listeningCompSentence({
      id: "fr-m12-2-lc-trentedeux",
      audioText: "trente-deux",
      correctMeaningEn: "thirty-two",
      distractorsEn: ["thirty-three", "forty-two", "thirty"],
    }),
    {
      id: "fr-m12-2-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "trente", target: "thirty" },
        { id: "p2", source: "quarante", target: "forty" },
        { id: "p3", source: "trente et un", target: "thirty-one" },
        { id: "p4", source: "quarante-cinq", target: "forty-five" },
        { id: "p5", source: "vingt", target: "twenty" },
        { id: "p6", source: "frère", target: "brother" },
      ],
    },
  ];
}

/** L3 — «Cinquante, soixante»: the last two regular tens, plus a discrimination
 *  sweep across all five tens taught so far. m8 days is the interleave break. */
function lesson3(): LessonStep[] {
  return [
    {
      id: "fr-m12-3-map-soixante",
      type: "word_map",
      tokens: ["cinquante", "soixante"],
      pairs: [
        { en: "fifty", tokenIndex: 0 },
        { en: "sixty", tokenIndex: 1 },
      ],
      audioText: "cinquante, soixante",
      revealNote: "«soixante» is the ceiling of the regular pattern — the next ten (70) breaks the rule, a story for later.",
    },
    speaking(
      "fr-m12-3-speak-ilparlefr-recall",
      "il parle français",
      "he speaks French",
      [],
      "recall",
    ),
    cloze(
      "fr-m12-3-cloze-cinquante",
      "",
      "",
      "cinquante",
      ["cinquante", "cinq", "soixante"],
      "fifty",
      "cinquante",
      "«cinquante» is NOT «cinq» — don't let the shared start fool you.",
    ),
    build(
      "fr-m12-3-build-soixantedeux",
      "Build: 'sixty-two'",
      "soixante-deux",
      ["soixante-deux", "soixante et un", "cinquante-deux"],
      ["soixante-deux"],
    ),
    // Interleave break — m8 days recall.
    sentenceMcq({
      id: "fr-m12-3-smcq-jours-recall",
      prompt: "'It's Monday' — pick the French (m8 recall).",
      correctText: "c'est lundi",
      distractorsText: ["c'est mardi", "c'est vendredi", "c'est jeudi"],
    }),
    cloze(
      "fr-m12-3-cloze-discrim2",
      "",
      "",
      "soixante et un",
      ["soixante et un", "cinquante et un", "soixante-deux"],
      "sixty-one",
      "soixante et un",
    ),
    sentenceMcq({
      id: "fr-m12-3-smcq-discrim",
      prompt: "'Fifty-six' — pick the French.",
      correctText: "cinquante-six",
      distractorsText: ["soixante-six", "quarante-six", "cinquante-cinq"],
    }),
    build(
      "fr-m12-3-build-cinquantesept",
      "Build: 'fifty-seven'",
      "cinquante-sept",
      ["cinquante-sept", "soixante-sept", "cinquante et un"],
      ["cinquante-sept"],
    ),
    listeningCompSentence({
      id: "fr-m12-3-lc-soixantetrois",
      audioText: "soixante-trois",
      correctMeaningEn: "sixty-three",
      distractorsEn: ["sixty-two", "fifty-three", "sixty"],
    }),
    {
      id: "fr-m12-3-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "cinquante", target: "fifty" },
        { id: "p2", source: "soixante", target: "sixty" },
        { id: "p3", source: "soixante-deux", target: "sixty-two" },
        { id: "p4", source: "trente", target: "thirty" },
        { id: "p5", source: "quarante", target: "forty" },
        { id: "p6", source: "lundi", target: "Monday" },
      ],
    },
  ];
}

/** L4 — «Cent»: the round ceiling vs. the compositional 20s–60s. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m12-4-info-cent",
      "Le plafond rond",
      "«Cent» — one hundred — is a round ceiling, not built from smaller pieces the way vingt-deux or cinquante-sept are. It doesn't change form here: «cent» stays «cent».",
    ),
    {
      id: "fr-m12-4-map-cent",
      type: "word_map",
      tokens: ["soixante", "cent"],
      pairs: [
        { en: "sixty", tokenIndex: 0 },
        { en: "one hundred", tokenIndex: 1 },
      ],
      audioText: "soixante, cent",
      revealNote: "«cent» — the round ceiling above all the compositional tens.",
    },
    speaking(
      "fr-m12-4-speak-cestlundi-recall",
      "c'est lundi",
      "it's Monday",
      [],
      "recall",
    ),
    cloze(
      "fr-m12-4-cloze-cent",
      "",
      "",
      "cent",
      ["cent", "cinquante", "soixante"],
      "one hundred",
      "cent",
    ),
    build(
      "fr-m12-4-build-cent",
      "Build: 'one hundred'",
      "cent",
      ["cent", "soixante", "quarante"],
      ["cent"],
    ),
    sentenceMcq({
      id: "fr-m12-4-smcq-discrim",
      prompt: "Which is the ROUND ceiling, not a compositional number?",
      correctText: "cent",
      distractorsText: ["trente", "quarante-neuf", "soixante-neuf"],
    }),
    cloze(
      "fr-m12-4-cloze-review",
      "",
      "",
      "quarante-huit",
      ["quarante-huit", "cinquante-huit", "trente-huit"],
      "forty-eight",
      "quarante-huit",
    ),
    build(
      "fr-m12-4-build-soixanteneuf",
      "Build: 'sixty-nine'",
      "soixante-neuf",
      ["soixante-neuf", "soixante-huit", "cinquante-neuf"],
      ["soixante-neuf"],
    ),
    listeningCompSentence({
      id: "fr-m12-4-lc-cent",
      audioText: "cent",
      correctMeaningEn: "one hundred",
      distractorsEn: ["sixty", "ninety", "ten"],
    }),
    {
      id: "fr-m12-4-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "cent", target: "one hundred" },
        { id: "p2", source: "soixante-neuf", target: "sixty-nine" },
        { id: "p3", source: "quarante-huit", target: "forty-eight" },
        { id: "p4", source: "cinquante", target: "fifty" },
        { id: "p5", source: "vingt", target: "twenty" },
        { id: "p6", source: "trente", target: "thirty" },
      ],
    },
  ];
}

/** L5 — consolidation: no new numbers, m11/m5 recalls fold in for the
 *  compounding bar; a full discrimination sweep across all six atoms. */
function lesson5(): LessonStep[] {
  return [
    speaking(
      "fr-m12-5-speak-cinema-recall",
      "je vais au cinéma",
      "I'm going to the movies",
      [],
      "recall",
    ),
    cloze(
      "fr-m12-5-cloze-sweep1",
      "",
      "",
      "soixante",
      ["soixante", "cinquante", "quarante"],
      "sixty",
      "soixante",
    ),
    sentenceMcq({
      id: "fr-m12-5-smcq-sweep2",
      prompt: "'Thirty-four' — pick the French.",
      correctText: "trente-quatre",
      distractorsText: ["quarante-quatre", "trente-cinq", "vingt-quatre"],
    }),
    build(
      "fr-m12-5-build-cinquantetrois",
      "Build: 'fifty-three'",
      "cinquante-trois",
      ["cinquante-trois", "soixante-trois", "cinquante et un"],
      ["cinquante-trois"],
    ),
    // m11 recall — the compounding bar this module is expected to keep.
    sentenceMcq({
      id: "fr-m12-5-smcq-m11-recall",
      prompt: "'She lives in Paris' — pick the French (m11 recall).",
      correctText: "elle habite à Paris",
      distractorsText: ["elle habite à Montréal", "il habite à Paris", "elle habites à Paris"],
    }),
    cloze(
      "fr-m12-5-cloze-sweep3",
      "",
      "",
      "cent",
      ["quarante", "cent", "soixante"],
      "one hundred",
      "cent",
      "«cent» is the round ceiling — not a compositional tens number like «quarante» or «soixante».",
    ),
    vocabTextMcq(
      "fr-m12-5-vmcq-vingt",
      "vingt",
      ["trente", "quarante", "cinquante"],
      "'Twenty' — pick the French number.",
    ),
    build(
      "fr-m12-5-build-soixantehuit",
      "Build: 'sixty-eight'",
      "soixante-huit",
      ["soixante-huit", "quarante-huit", "cinquante-huit"],
      ["soixante-huit"],
    ),
    listeningCompSentence({
      id: "fr-m12-5-lc-quarantedeux",
      audioText: "quarante-deux",
      correctMeaningEn: "forty-two",
      distractorsEn: ["forty-three", "thirty-two", "forty"],
    }),
    {
      id: "fr-m12-5-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "vingt", target: "twenty" },
        { id: "p2", source: "trente", target: "thirty" },
        { id: "p3", source: "quarante", target: "forty" },
        { id: "p4", source: "cinquante", target: "fifty" },
        { id: "p5", source: "soixante", target: "sixty" },
        { id: "p6", source: "cent", target: "one hundred" },
      ],
    },
  ];
}

/** L6 — «C'est combien ?»: euro + ça coûte debut; market-stall dialogue_sim. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m12-6-info-combien",
      "C'est combien ?",
      "«Combien» — how much — asks the price. The answer uses «ça coûte» (it costs) plus a number plus «euros». «Un euro», but «deux euros» — the -s lands on the NOUN, never on the number itself.",
    ),
    {
      id: "fr-m12-6-map-euro",
      type: "word_map",
      tokens: ["ça", "coûte", "vingt", "euros"],
      pairs: [
        { en: "it", tokenIndex: 0 },
        { en: "costs", tokenIndex: 1 },
        { en: "twenty", tokenIndex: 2 },
        { en: "euros", tokenIndex: 3 },
      ],
      audioText: "ça coûte vingt euros",
      revealNote: "«ça coûte» + number + «euros» — the whole price frame in one shape.",
    },
    speaking(
      "fr-m12-6-speak-cestcombien",
      "c'est combien ?",
      "how much is it?",
      [],
    ),
    cloze(
      "fr-m12-6-cloze-euros",
      "ça coûte cinquante",
      "",
      "euros",
      ["euros", "euro", "cent"],
      "it costs fifty euros",
      "ça coûte cinquante euros",
      "Plural price — «euros», not the bare «euro» — because it's more than one.",
    ),
    speaking(
      "fr-m12-6-speak-cacoute",
      "ça coûte vingt euros",
      "it costs twenty euros",
      ["ça coûte", "euros"],
    ),
    build(
      "fr-m12-6-build-price",
      "Build: 'it costs forty euros'",
      "ça coûte quarante euros",
      ["ça coûte", "quarante euros", "cinquante euros", "trente euros"],
      ["ça coûte", "quarante euros"],
    ),
    cloze(
      "fr-m12-6-cloze-euro-sg",
      "ça coûte un",
      "",
      "euro",
      ["euro", "euros", "cent"],
      "it costs one euro",
      "ça coûte un euro",
      "Singular price — «un euro», no -s — the -s only shows up from two on.",
    ),
    {
      id: "fr-m12-6-sim-marche",
      type: "dialogue_sim",
      scene: { emoji: "🛒", title: "Market stall" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-combien",
          npc: {
            speaker: "Nadia",
            kana: "Bonjour ! Vous désirez ?",
            audioText: "bonjour ! vous désirez ?",
            gloss: "Hello! What would you like?",
          },
          goal: "Ask how much it costs.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "c'est combien ?" },
              { id: "wrong-when", text: "c'est quand ?" },
              { id: "wrong-who", text: "c'est qui ?" },
            ],
            correctOptionId: "correct",
            audioText: "c'est combien ?",
          },
          replyGloss: "How much is it?",
        },
        {
          id: "t2-price",
          npc: {
            speaker: "Nadia",
            kana: "Ça coûte vingt euros.",
            audioText: "ça coûte vingt euros",
            gloss: "It costs twenty euros.",
          },
          goal: "Say okay, twenty euros.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, vingt euros" },
              { id: "wrong-price", text: "d'accord, trente euros" },
              { id: "wrong-form", text: "d'accord, vingt euro" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, vingt euros",
          },
          replyGloss: "Okay, twenty euros.",
        },
      ],
    },
    build(
      "fr-m12-6-build-price-soixante",
      "Build: 'it costs sixty euros'",
      "ça coûte soixante euros",
      ["ça coûte", "soixante euros", "cinquante euros", "vingt euros"],
      ["ça coûte", "soixante euros"],
    ),
    {
      id: "fr-m12-6-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "ça coûte", target: "it costs" },
        { id: "p2", source: "euro", target: "euro (currency)" },
        { id: "p3", source: "c'est combien ?", target: "how much is it?" },
        { id: "p4", source: "vingt", target: "twenty" },
        { id: "p5", source: "quarante", target: "forty" },
        { id: "p6", source: "cent", target: "one hundred" },
      ],
    },
  ];
}

/** L7 — «C'est cher»: cher / pas-cher reactions to prices, full ne…pas. */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m12-7-info-cher",
      "Cher, pas cher",
      "«C'est cher» — it's expensive. To say the opposite, French uses the full negation frame: «ce n'est pas cher» — it's not expensive / it's cheap. Same «ne…pas» shape you already know from «je ne comprends pas».",
    ),
    {
      id: "fr-m12-7-map-cher",
      type: "word_map",
      tokens: ["soixante", "euros", "c'est", "cher"],
      pairs: [
        { en: "sixty", tokenIndex: 0 },
        { en: "euros", tokenIndex: 1 },
        { en: "it's", tokenIndex: 2 },
        { en: "expensive", tokenIndex: 3 },
      ],
      audioText: "soixante euros, c'est cher",
      revealNote: "«c'est cher» — a reaction to a price, not a price itself.",
    },
    speaking("fr-m12-7-speak-cher", "c'est cher", "it's expensive", ["c'est cher"]),
    cloze(
      "fr-m12-7-cloze-pascher",
      "dix euros, ce",
      "pas cher",
      "n'est",
      ["n'est", "est", "es"],
      "ten euros, it's not expensive",
      "dix euros, ce n'est pas cher",
      "Full register: «ce n'est pas cher» — never the dropped «c'est pas cher» here.",
    ),
    speaking(
      "fr-m12-7-speak-pascher",
      "ce n'est pas cher",
      "it's not expensive / it's cheap",
      ["ce n'est pas cher"],
    ),
    build(
      "fr-m12-7-build-cher",
      "Build: 'sixty euros, it's expensive'",
      "soixante euros, c'est cher",
      ["soixante euros", "c'est cher", "ce n'est pas cher", "quarante euros"],
      ["soixante euros", "c'est cher"],
    ),
    listeningCompSentence({
      id: "fr-m12-7-lc-reaction",
      audioText: "cent euros, c'est cher",
      correctMeaningEn: "A hundred euros, that's expensive.",
      distractorsEn: [
        "A hundred euros, that's cheap.",
        "Twenty euros, that's expensive.",
        "A hundred euros, that's how much?",
      ],
    }),
    build(
      "fr-m12-7-build-discrim",
      "Build: 'ten euros, it's cheap'",
      "dix euros, ce n'est pas cher",
      ["dix euros", "ce n'est pas cher", "c'est cher", "vingt euros"],
      ["dix euros", "ce n'est pas cher"],
    ),
    vocabTextMcq(
      "fr-m12-7-vmcq-cher",
      "c'est cher",
      ["ce n'est pas cher", "ça coûte", "euro"],
      "'It's expensive' — pick the French.",
    ),
    {
      id: "fr-m12-7-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "c'est cher", target: "it's expensive" },
        { id: "p2", source: "ce n'est pas cher", target: "it's not expensive / cheap" },
        { id: "p3", source: "ça coûte", target: "it costs" },
        { id: "p4", source: "euro", target: "euro (currency)" },
        { id: "p5", source: "cent", target: "one hundred" },
        { id: "p6", source: "soixante", target: "sixty" },
      ],
    },
  ];
}

/** L8 — CHECKPOINT: zero-new, all-graded. Closes on the transfer test:
 *  build the tile-composed French for an unseen price (47 €). */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m12-8-lc-1",
      audioText: "ça coûte trente euros",
      correctMeaningEn: "It costs thirty euros.",
      distractorsEn: ["It costs forty euros.", "It costs thirty euros, it's expensive.", "How much is it?"],
    }),
    cloze(
      "fr-m12-8-cloze-1",
      "ça coûte",
      "euros",
      "cinquante",
      ["cinquante", "quarante", "trente"],
      "it costs fifty euros",
      "ça coûte cinquante euros",
    ),
    speaking(
      "fr-m12-8-speak-vingt-recall",
      "vingt",
      "twenty",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m12-8-smcq-1",
      prompt: "'It's not expensive' — pick the French.",
      correctText: "ce n'est pas cher",
      distractorsText: ["c'est pas cher", "c'est cher", "ce n'est pas combien"],
    }),
    build(
      "fr-m12-8-build-1",
      "Build: 'sixty-two euros'",
      "soixante-deux euros",
      ["soixante-deux euros", "soixante et un euros", "cinquante-deux euros"],
      ["soixante-deux euros"],
    ),
    listeningCompSentence({
      id: "fr-m12-8-lc-2",
      audioText: "cent euros, c'est cher",
      correctMeaningEn: "A hundred euros, that's expensive.",
      distractorsEn: ["A hundred euros, that's cheap.", "Sixty euros, that's expensive.", "How much is it?"],
    }),
    cloze(
      "fr-m12-8-cloze-2",
      "",
      "",
      "quarante-trois",
      ["quarante-trois", "trente-trois", "quarante et un"],
      "forty-three",
      "quarante-trois",
    ),
    speaking(
      "fr-m12-8-speak-cher-recall",
      "c'est cher",
      "it's expensive",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m12-8-smcq-2",
      prompt: "'It costs seventy euros' — wait, which of these is NOT a valid regular number this module taught?",
      correctText: "soixante-neuf euros",
      distractorsText: ["cinquante-neuf euros", "quarante-neuf euros", "trente-neuf euros"],
    }),
    build(
      "fr-m12-8-build-2",
      "Build: 'thirty-one euros, it's cheap'",
      "trente et un euros, ce n'est pas cher",
      ["trente et un euros", "ce n'est pas cher", "c'est cher", "quarante et un euros"],
      ["trente et un euros", "ce n'est pas cher"],
    ),
    listeningCompSentence({
      id: "fr-m12-8-lc-3",
      audioText: "c'est combien ? ça coûte soixante-quatre euros",
      correctMeaningEn: "How much is it? It costs sixty-four euros.",
      distractorsEn: [
        "How much is it? It costs forty-four euros.",
        "It's expensive. It costs sixty-four euros.",
        "How much is it? It's not expensive.",
      ],
    }),
    // Transfer test — an unseen combination, tile-built from a bank
    // holding all five regular tens + units. 47 € was never printed
    // anywhere above; this proves generation, not recall.
    build(
      "fr-m12-8-build-transfer",
      "47 € — build the price in French",
      "quarante-sept euros",
      ["quarante-sept euros", "trente-sept euros", "cinquante-sept euros", "quarante-huit euros"],
      ["quarante-sept euros"],
    ),
    {
      id: "fr-m12-8-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "vingt", target: "twenty" },
        { id: "p2", source: "cinquante", target: "fifty" },
        { id: "p3", source: "cent", target: "one hundred" },
        { id: "p4", source: "ça coûte", target: "it costs" },
        { id: "p5", source: "c'est cher", target: "it's expensive" },
        { id: "p6", source: "ce n'est pas cher", target: "it's not expensive / cheap" },
      ],
    },
  ];
}

/** L9 — integration: no new atoms, no info cards, a big boutique
 *  dialogue_sim tail mixing «je voudrais» + price + cher/pas-cher. */
function lesson9(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m12-9-lc-1",
      audioText: "ça coûte soixante euros, c'est cher",
      correctMeaningEn: "It costs sixty euros, that's expensive.",
      distractorsEn: [
        "It costs sixty euros, that's cheap.",
        "It costs sixteen euros, that's expensive.",
        "How much is it?",
      ],
    }),
    speaking(
      "fr-m12-9-speak-croissant-recall",
      "je voudrais un croissant",
      "I would like a croissant",
      [],
      "recall",
    ),
    cloze(
      "fr-m12-9-cloze-1",
      "",
      "",
      "cinquante-quatre",
      ["cinquante-quatre", "soixante-quatre", "cinquante-cinq"],
      "fifty-four",
      "cinquante-quatre",
    ),
    build(
      "fr-m12-9-build-1",
      "Build: 'it costs a hundred euros'",
      "ça coûte cent euros",
      ["ça coûte", "cent euros", "soixante euros", "quarante euros"],
      ["ça coûte", "cent euros"],
    ),
    speaking(
      "fr-m12-9-speak-combien-recall",
      "c'est combien ?",
      "how much is it?",
      [],
      "recall",
    ),
    build(
      "fr-m12-9-build-discrim",
      "Build: 'thirty-eight euros, it's cheap'",
      "trente-huit euros, ce n'est pas cher",
      ["trente-huit euros", "ce n'est pas cher", "c'est cher", "quarante-huit euros"],
      ["trente-huit euros", "ce n'est pas cher"],
    ),
    {
      id: "fr-m12-9-sim-boutique",
      type: "dialogue_sim",
      scene: { emoji: "👗", title: "The boutique" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-voudrais",
          npc: {
            speaker: "Théo",
            kana: "Bonjour ! Vous désirez ?",
            audioText: "bonjour ! vous désirez ?",
            gloss: "Hello! What would you like?",
          },
          goal: "Say you would like a sandwich.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je voudrais un sandwich" },
              { id: "wrong-item", text: "je voudrais un gâteau" },
              { id: "wrong-form", text: "je voudrais cher" },
            ],
            correctOptionId: "correct",
            audioText: "je voudrais un sandwich",
          },
          replyGloss: "I would like a sandwich.",
        },
        {
          id: "t2-price",
          npc: {
            speaker: "Théo",
            kana: "Ça coûte quarante-cinq euros.",
            audioText: "ça coûte quarante-cinq euros",
            gloss: "It costs forty-five euros.",
          },
          goal: "React — that's expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "c'est cher !" },
              { id: "wrong-cheap", text: "ce n'est pas cher !" },
              { id: "wrong-q", text: "c'est combien ?" },
            ],
            correctOptionId: "correct",
            audioText: "c'est cher !",
          },
          replyGloss: "It's expensive!",
        },
        {
          id: "t3-alt",
          npc: {
            speaker: "Théo",
            kana: "D'accord — et ce sandwich, vingt euros ?",
            audioText: "d'accord — et ce sandwich, vingt euros ?",
            gloss: "Okay — and this sandwich, twenty euros?",
          },
          goal: "Say okay, that's not expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, ce n'est pas cher" },
              { id: "wrong-cher", text: "d'accord, c'est cher" },
              { id: "wrong-form", text: "d'accord, ce n'est pas cent" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, ce n'est pas cher",
          },
          replyGloss: "Okay, that's not expensive.",
        },
      ],
    },
    vocabTextMcq(
      "fr-m12-9-vmcq-cent",
      "cent",
      ["vingt", "trente", "soixante"],
      "'One hundred' — pick the French number.",
    ),
    build(
      "fr-m12-9-build-2",
      "Build: 'it costs fifty-five euros'",
      "ça coûte cinquante-cinq euros",
      ["ça coûte", "cinquante-cinq euros", "soixante-cinq euros", "quarante-cinq euros"],
      ["ça coûte", "cinquante-cinq euros"],
    ),
    {
      id: "fr-m12-9-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "je voudrais", target: "I would like" },
        { id: "p2", source: "ça coûte", target: "it costs" },
        { id: "p3", source: "c'est cher", target: "it's expensive" },
        { id: "p4", source: "ce n'est pas cher", target: "it's not expensive / cheap" },
        { id: "p5", source: "cent", target: "one hundred" },
        { id: "p6", source: "vingt", target: "twenty" },
      ],
    },
  ];
}

/** L10 — mastery: all-graded, every m12 atom present, ends on a
 *  video-call dialogue_sim closing on an ordinary cher/pas-cher beat. */
function lesson10(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m12-10-lc-full",
      audioText: "c'est combien ? ça coûte soixante-cinq euros, c'est cher",
      correctMeaningEn: "How much is it? It costs sixty-five euros, that's expensive.",
      distractorsEn: [
        "How much is it? It costs fifty-five euros, that's expensive.",
        "How much is it? It costs sixty-five euros, that's cheap.",
        "It's expensive. It costs sixty-five euros.",
      ],
    }),
    speaking(
      "fr-m12-10-speak-vingt-recall",
      "vingt",
      "twenty",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m12-10-smcq-recap",
      prompt: "'Sixty-nine' — pick the French.",
      correctText: "soixante-neuf",
      distractorsText: ["soixante-huit", "cinquante-neuf", "vingt-neuf"],
    }),
    cloze(
      "fr-m12-10-cloze-recap",
      "",
      "",
      "quarante-quatre",
      ["quarante-quatre", "cinquante-quatre", "quarante et un"],
      "forty-four",
      "quarante-quatre",
    ),
    build(
      "fr-m12-10-build-recap",
      "Build: 'a hundred euros, it's not expensive'",
      "cent euros, ce n'est pas cher",
      ["cent euros", "ce n'est pas cher", "c'est cher", "soixante euros"],
      ["cent euros", "ce n'est pas cher"],
    ),
    speaking(
      "fr-m12-10-speak-pascher-recall",
      "ce n'est pas cher",
      "it's not expensive / it's cheap",
      [],
      "recall",
    ),
    {
      id: "fr-m12-10-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "vingt", target: "twenty" },
        { id: "p2", source: "trente", target: "thirty" },
        { id: "p3", source: "cinquante", target: "fifty" },
        { id: "p4", source: "cent", target: "one hundred" },
        { id: "p5", source: "ça coûte", target: "it costs" },
        { id: "p6", source: "c'est cher", target: "it's expensive" },
      ],
    },
    {
      id: "fr-m12-10-sim-recap",
      type: "dialogue_sim",
      scene: { emoji: "📞", title: "Video-call recap" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-price",
          npc: {
            speaker: "Léa",
            kana: "Le gâteau — ça coûte trente euros !",
            audioText: "le gâteau — ça coûte trente euros !",
            gloss: "The cake — it costs thirty euros!",
          },
          goal: "Say okay, that's not expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, ce n'est pas cher" },
              { id: "wrong-cher", text: "d'accord, c'est cher" },
              { id: "wrong-form", text: "d'accord, ce n'est pas cent" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, ce n'est pas cher",
          },
          replyGloss: "Okay, that's not expensive.",
        },
        {
          id: "t2-cent",
          npc: {
            speaker: "Léa",
            kana: "Et le sandwich coûte cent euros…",
            audioText: "et le sandwich coûte cent euros",
            gloss: "And the sandwich costs a hundred euros…",
          },
          goal: "React — that's expensive!",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "cent euros, c'est cher !" },
              { id: "wrong-cheap", text: "cent euros, ce n'est pas cher !" },
              { id: "wrong-q", text: "cent euros, c'est combien ?" },
            ],
            correctOptionId: "correct",
            audioText: "cent euros, c'est cher !",
          },
          replyGloss: "A hundred euros, that's expensive!",
        },
        {
          id: "t3-tease",
          npc: {
            speaker: "Léa",
            kana: "Oui — c'est très cher !",
            audioText: "oui — c'est très cher !",
            gloss: "Yes — it's very expensive!",
          },
          goal: "Agree — it's very expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, c'est très cher" },
              { id: "wrong-cheap", text: "non, ce n'est pas cher" },
              { id: "wrong-mix", text: "oui, ce n'est pas cher" },
            ],
            correctOptionId: "correct",
            audioText: "oui, c'est très cher",
          },
          replyGloss: "Yes, it's very expensive.",
        },
      ],
    },
  ];
}

const FR_M12_1: LessonContent = {
  id: "fr-m12-1",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Vingt",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M12_2: LessonContent = {
  id: "fr-m12-2",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Trente, quarante",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M12_3: LessonContent = {
  id: "fr-m12-3",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Cinquante, soixante",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M12_4: LessonContent = {
  id: "fr-m12-4",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Cent",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M12_5: LessonContent = {
  id: "fr-m12-5",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Révision des nombres",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M12_6: LessonContent = {
  id: "fr-m12-6",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est combien ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M12_7: LessonContent = {
  id: "fr-m12-7",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est cher",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M12_8: LessonContent = {
  id: "fr-m12-8",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · La machine à prix",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M12_9: LessonContent = {
  id: "fr-m12-9",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La boutique",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M12_10: LessonContent = {
  id: "fr-m12-10",
  moduleId: "m12",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le prix parfait",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M12_MODULE: FrModuleDef = {
  title: "C'est combien ?",
  eyebrow: "Module 12",
  summary:
    "The number machine opens past ten: vingt through cent, and a full shopping toolkit — ça coûte, c'est cher, ce n'est pas cher.",
  lessons: [
    FR_M12_1,
    FR_M12_2,
    FR_M12_3,
    FR_M12_4,
    FR_M12_5,
    FR_M12_6,
    FR_M12_7,
    FR_M12_8,
    FR_M12_9,
    FR_M12_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M12_CHECKPOINT_INDEX = 8;

export const FR_M12_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m12-s",
    moduleId: "m12",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m12-s",
        prompt: "'It costs twenty euros' — pick the French.",
        correctText: "ça coûte vingt euros",
        distractorsText: ["ça coûte vingt euro", "ça coûte trente euros", "c'est cher, vingt euros"],
      }),
  },
  {
    id: "pt-fr-m12-1",
    moduleId: "m12",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m12-1",
        prompt: "'Forty-seven' — pick the French.",
        correctText: "quarante-sept",
        distractorsText: ["quarante-six", "cinquante-sept", "trente-sept"],
      }),
  },
  {
    id: "pt-fr-m12-2",
    moduleId: "m12",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m12-2",
        prompt: "'It's expensive' — pick the French.",
        correctText: "c'est cher",
        distractorsText: ["ce n'est pas cher", "c'est combien", "ça coûte cher"],
      }),
  },
  {
    id: "pt-fr-m12-3",
    moduleId: "m12",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m12-3",
        prompt: "'It's not expensive' — pick the French.",
        correctText: "ce n'est pas cher",
        distractorsText: ["c'est pas cher", "c'est cher", "ce n'est pas combien"],
      }),
  },
  {
    id: "pt-fr-m12-4",
    moduleId: "m12",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m12-4",
        prompt: "Which is the round ceiling, one hundred?",
        correctText: "cent",
        distractorsText: ["soixante", "cinquante", "quarante"],
      }),
  },
];
