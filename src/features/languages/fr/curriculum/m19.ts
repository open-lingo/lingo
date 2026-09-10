/**
 * m19.ts — «Aller + infinitif» — the near-future construction.
 *
 * AUTHORED 2026-09-10 per docs/fr-m19-brief-2026-09-10.md: the learner
 * already owns «je vais»/«tu vas»/«on va» as motion phrases (m5) — this
 * module teaches the SAME chunks a second job: aller + infinitive as the
 * near future ("I'm going to..."). No new verb conjugation, just a new
 * syntactic role for words already in the learner's mouth, plus the two
 * missing third-person forms («il va»/«elle va») to complete the cast.
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - New atoms: exactly two — «il va» and «elle va», both phrase atoms.
 *     Verified in code: «je vais»/«tu vas»/«on va» are ALREADY registered
 *     phrase atoms (m5.ts, fromModule "m5"); «il»/«elle» are already
 *     registered pronoun atoms (m2.ts). Per the carrier-atoms doctrine
 *     (an earlier module's multi-word atom owns its component words,
 *     register anyway, don't drop) the NEW thing here is the phrase-level
 *     third-person chunk, not new tokens — «va» itself is already a taught
 *     token via m5's own «on va» tokenization. No atom needed for
 *     je vais/tu vas/on va themselves; their grammatical innovation this
 *     module is a NEW SYNTACTIC ROLE (future marker) for an OLD surface,
 *     which doesn't require a new registry entry — same principle m18 used
 *     for «plus» not needing a fresh atom for an old surface's new job.
 *   - «week-end» is BANNED course-wide (confirmed via m8.ts's own header
 *     comment and m8.test.ts's machine check) — every weekend-plan
 *     sentence in this module names «samedi»/«dimanche» explicitly
 *     instead, never the literal word.
 *   - No `homophoneKey`/`hAspire`/`consonantOnset` flags needed on «il
 *     va»/«elle va» — «va»/«vais»/«vas» are conjugated verb forms, not
 *     eliding clitics (verified: no such flag exists on m5's own je
 *     vais/tu vas/on va atoms, and none of my planned sentences ever
 *     places «va» immediately before a vowel-onset word inside a single
 *     BUILD TILE, so assertNoElisionBreach never fires on it).
 *
 * BRIEF-CLAIM CORRECTIONS (task instruction: verify each claim in code,
 * adapt if false):
 *   1. Brief suggested «il va faire...» as an example construction —
 *      verified via grep: "faire" is registered NOWHERE in m1-m18. FIX:
 *      every near-future sentence in this module fronts one of the four
 *      infinitives already taught and grep-confirmed registered — parler
 *      (m11), habiter (m11), manger (m14), visiter (m15).
 *   2. Brief suggested pairing the near future against «après» ("after")
 *      for time-contrast framing — verified via grep: "après" is
 *      registered NOWHERE. FIX: the hier/demain (m14/m5) pair alone
 *      carries the past-vs-future contrast in L6; no new time word needed.
 *   3. Brief suggested "ensemble" (together) as sim color — verified via
 *      grep: registered NOWHERE. FIX: sims use «avec toi» (chrome + m5's
 *      own established pattern) instead.
 *   4. Brief's own uncertainty flag on «qu'est-ce que» for sim questions
 *      resolved false — verified via grep: registered NOWHERE. FIX: both
 *      sims use plain yes/no near-future questions («tu vas... ?», «on
 *      va... ?»), matching m17/m18's own sim-question shape.
 *
 * SPEECH-NEAR-FUTURE CONSTRAINTS (docs/fr-speech-near-future-2026-09-10.md,
 * applied throughout):
 *   1. je vais/tu vas/on va + infinitive speaking targets grade safely —
 *      the near-future frame is phonetically identical to the m5 motion
 *      use already voiced; no new pronunciation risk. Used freely.
 *   2. il va/elle va + infinitive speaking targets are likewise safe —
 *      «va» is a plain consonant-onset syllable, no liaison/elision edge
 *      case with any of the four taught infinitives.
 *   3. NEVER let a `speaking` step be the learner's FIRST exposure to a
 *      given subject+infinitive PAIRING — every new pairing debuts
 *      written first (word_map/cloze/build/sentenceMcq) in the SAME
 *      lesson or earlier; `speaking` steps in a teaching lesson either
 *      extend an already-debuted pairing or are marked `cue:"recall"`
 *      against an established non-frame sentence. Enforced by this
 *      module's own bespoke test pin (m19.test.ts).
 *   4. the negated near-future frame («je ne vais pas manger», L7) is
 *      always the WHOLE already-known «ne ... pas» frame wrapped around
 *      an already-debuted pairing — never a first-exposure pairing inside
 *      a negation.
 *   5. the checkpoint (L8) MAY test a novel RECOMBINATION of two
 *      individually-taught elements never paired before (e.g. elle +
 *      parler) via a graded, non-recall `speaking` step — this is
 *      distinct from constraint 3 (which governs TEACHING lessons only):
 *      a checkpoint's job is exactly to test transfer of the general rule
 *      to an unseen combination of known parts, not to introduce a new
 *      word or a new pairing debut.
 *
 * "Real use, not a bare list" (task instruction): every near-future
 * sentence is a plan — for tomorrow (demain), for Saturday, for Sunday —
 * built from real content words (parler français, habiter à Paris/
 * Montréal, manger une pizza/un croissant/un gâteau/du fromage, visiter
 * le musée/le parc/la gare), never a bare conjugation drill. L6
 * contrasts it directly against the already-known passé composé (hier,
 * j'ai mangé... / demain, je vais manger...) so the learner locks the
 * tense distinction by use, not by rule-recital. L9/L10 close on
 * plans-for-the-weekend dialogue_sims (samedi/dimanche named explicitly,
 * never "week-end"), manually vocabulary-audited turn-by-turn since
 * `frSurfaces()` (moduleBarGuards.ts) has no `dialogue_sim` case and is
 * blind to sim content — and now additionally machine-gated by
 * frSimProvenance.test.ts once this module is added to its MODULES array.
 *
 * Cast: introduces Hugo (already an FR_PROPER_NAMES entry) for L9's sim;
 * reuses Camille (already an FR_PROPER_NAMES entry) for L10's capstone.
 *
 * VOICING LEDGER — every `cue:"recall"` step and its non-recall source:
 *   - L1 "je vais au cinéma" recalls m5's own first voicing
 *     (fr-m5-1-speak-aucinema) — reach-back beyond m11-m18.
 *   - L2 "il parle français" recalls m11's own established voicing
 *     (mirrors m17/m18's own reuse of this exact phrase).
 *   - L3 "c'est lundi" recalls m8's own first voicing
 *     (fr-m8-1-speak-lundi).
 *   - L4 "un grand chat" recalls m9's own first voicing
 *     (fr-m9-1-speak-grandchat).
 *   - L5 "ça coûte vingt euros" recalls m12's own established voicing
 *     (fr-m12-6-speak-cacoute).
 *   - L6 "on va au cinéma demain ?" recalls m5's own established voicing
 *     (fr-m5-4-speak-onvademain) — the second reach-back beyond m11-m18.
 *   - L7 "bonjour" recalls m1's own first voicing (fr-m1v2-1-speak-
 *     bonjour) — the third reach-back beyond m11-m18, mirroring m18.ts's
 *     own precedent of reaching that far back.
 *   - L9 "je ne sais jamais" recalls m18's own established voicing
 *     (fr-m18-2-speak-saisjamais) — a legal reach-forward into m18, which
 *     precedes m19 in course order.
 *   - L10 "je vais au cinéma" recalls L1's own bridge quote a second time,
 *     for closure symmetry (mirrors m18.ts L10's own reuse of L1's
 *     bonjour recall).
 *   Total: 9 recalls, 5 reaching further back than m11-m18 (au cinéma x2,
 *   c'est lundi, un grand chat, ça coûte vingt euros, on va au cinéma
 *   demain, bonjour) — wider than m17/m18's own 2-3 reach-back pattern
 *   because m19 deliberately interleaves numbers/days/adjectives review
 *   (per the brief's own interleave instruction) rather than reaching
 *   only into the immediately-preceding negation modules.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

/**
 * Hand-built match_pairs, shape-identical to grammarHelpers' matchPairs(),
 * but bypassing the atom registry — same m2-m9 import.meta.glob ordering
 * landmine m17/m18.ts route around, plus it sidesteps the >=6-surfaces /
 * registered-surface requirement entirely (several pairs below name a
 * grammatical ROLE — "va", "vas" — that is a legal TOKEN via an existing
 * phrase atom's tokenization but is not itself a standalone registered
 * atom surface). Used for EVERY match_pairs step in this module.
 */
function crossModuleMatchPairs(
  idPrefix: string,
  entries: Array<[surface: string, gloss: string]>,
): LessonStep {
  if (entries.length < 6) {
    throw new Error(
      `fr crossModuleMatchPairs(${idPrefix}): needs >= 6 surfaces (got ${entries.length})`,
    );
  }
  return {
    id: `${idPrefix}-match`,
    type: "match_pairs",
    prompt: "Match each French word to its meaning",
    playAudioOnSelect: true,
    pairs: entries.map(([source, target], i) => ({ id: `p-${i}`, source, target })),
    exercisedAtoms: [],
    modality: "recognition",
  } as LessonStep;
}

export const FR_M19_ATOMS: FrAtom[] = [
  atom({
    surface: "il va",
    meaningEn: "he's going / he's going to",
    partOfSpeech: "phrase",
    fromModule: "m19",
    kind: "phrase",
    hint: "eel VAH — same «aller» engine as «je vais/tu vas/on va», third person",
  }),
  atom({
    surface: "elle va",
    meaningEn: "she's going / she's going to",
    partOfSpeech: "phrase",
    fromModule: "m19",
    kind: "phrase",
    hint: "ell VAH — same engine, feminine subject",
  }),
];

/** L1 — «Je vais parler»: the motion sense (m5's own «je vais au cinéma»)
 *  bridges into the future sense. Debuts je+parler and tu+parler,
 *  written first, before either is ever spoken. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m19-1-info-bridge",
      "Je vais... + un verbe",
      "You know «je vais au cinéma» (I'm going to the cinema). Front a verb instead of a place — «je vais parler» — and it means I'm going to speak. Same «je vais», new job.",
    ),
    {
      id: "fr-m19-1-map-frame",
      type: "word_map",
      tokens: ["je vais", "parler"],
      pairs: [
        { en: "I'm going to", tokenIndex: 0 },
        { en: "speak", tokenIndex: 1 },
      ],
      audioText: "je vais parler",
      revealNote: "«Je vais» + a plain infinitive = I'm going to... — no new verb form.",
    },
    cloze(
      "fr-m19-1-cloze-demain",
      "Demain, tu vas",
      ".",
      "parler",
      ["parler", "parlé"],
      "tomorrow, you're going to speak",
      "demain, tu vas parler",
    ),
    build(
      "fr-m19-1-build-francais",
      "Build: 'I'm going to speak French tomorrow'",
      "je vais parler français demain",
      ["je vais", "parler", "français", "demain", "parlé"],
      ["je vais", "parler", "français", "demain"],
    ),
    sentenceMcq({
      id: "fr-m19-1-smcq-jevaisparler",
      prompt: "'I'm going to speak' — pick the French.",
      correctText: "je vais parler",
      distractorsText: ["je parle", "j'ai parlé", "je vais parlé"],
    }),
    listeningCompSentence({
      id: "fr-m19-1-lc-tuvasparler",
      audioText: "tu vas parler français demain",
      correctMeaningEn: "You're going to speak French tomorrow",
      distractorsEn: [
        "You speak French every day",
        "You spoke French yesterday",
        "You're going to speak French today",
      ],
    }),
    speaking("fr-m19-1-speak-cinema-recall", "je vais au cinéma", "I'm going to the cinema", [], "recall"),
    build(
      "fr-m19-1-build-tuvasparler",
      "Build: 'tomorrow, you're going to speak French'",
      "demain, tu vas parler français",
      ["demain", "tu vas", "parler", "français", "parle"],
      ["demain", "tu vas", "parler", "français"],
    ),
    listeningCompSentence({
      id: "fr-m19-1-lc-cinema-recap",
      audioText: "tu vas au cinéma demain",
      correctMeaningEn: "Tomorrow, you're going to the cinema",
      distractorsEn: [
        "Tomorrow, you're going to speak",
        "Yesterday, you went to the cinema",
        "You go to the cinema every day",
      ],
    }),
    crossModuleMatchPairs("fr-m19-1", [
      ["je vais", "I'm going to"],
      ["tu vas", "you're going to"],
      ["parler", "to speak"],
      ["français", "French"],
      ["demain", "tomorrow"],
      ["cinéma", "cinema"],
    ]),
  ];
}

/** L2 — «Il va, elle va» debut (new phrase atoms, written first) across
 *  the habiter cast. Interleave: a reach-back recall to m11's «il parle
 *  français» keeps the review cast varied. */
function lesson2(): LessonStep[] {
  return [
    {
      id: "fr-m19-2-map-ilelle",
      type: "word_map",
      tokens: ["il va", "elle va"],
      pairs: [
        { en: "he's going to", tokenIndex: 0 },
        { en: "she's going to", tokenIndex: 1 },
      ],
      audioText: "il va, elle va",
      revealNote: "Same «aller» engine, third person: «il va» / «elle va» + a plain infinitive.",
    },
    cloze(
      "fr-m19-2-cloze-ilhabite",
      "Demain, il va",
      "à Paris.",
      "habiter",
      ["habiter", "visiter"],
      "tomorrow, he's going to live in Paris",
      "demain, il va habiter à Paris",
    ),
    build(
      "fr-m19-2-build-ellehabite",
      "Build: 'she's going to live in Montreal'",
      "elle va habiter à Montréal",
      ["elle va", "habiter", "à Montréal", "habite"],
      ["elle va", "habiter", "à Montréal"],
    ),
    sentenceMcq({
      id: "fr-m19-2-smcq-ilvahabiter",
      prompt: "'He's going to live' — pick the French.",
      correctText: "il va habiter",
      distractorsText: ["il habite", "il va visiter", "on va habiter"],
    }),
    listeningCompSentence({
      id: "fr-m19-2-lc-ellevahabiter",
      audioText: "elle va habiter à Montréal",
      correctMeaningEn: "She's going to live in Montreal",
      distractorsEn: [
        "She lives in Montreal",
        "She's going to live in Paris",
        "She lived in Montreal",
      ],
    }),
    speaking("fr-m19-2-speak-parle-recall", "il parle français", "he speaks French", [], "recall"),
    cloze(
      "fr-m19-2-cloze-elleaussi",
      "Elle va",
      "à Paris aussi.",
      "habiter",
      ["habiter", "manger"],
      "she's going to live in Paris too",
      "elle va habiter à Paris aussi",
    ),
    listeningCompSentence({
      id: "fr-m19-2-lc-ilhabitemontreal-recap",
      audioText: "il va habiter à Montréal",
      correctMeaningEn: "He's going to live in Montreal",
      distractorsEn: [
        "He lives in Montreal",
        "He's going to live in Paris",
        "He lived in Montreal",
      ],
    }),
    sentenceMcq({
      id: "fr-m19-2-smcq-ellehabite-recap",
      prompt: "'She lives' (right now) — pick the French.",
      correctText: "elle habite",
      distractorsText: ["elle va habiter", "on va habiter", "elle a visité"],
    }),
    crossModuleMatchPairs("fr-m19-2", [
      ["il va", "he's going to"],
      ["elle va", "she's going to"],
      ["habiter", "to live"],
      ["parle", "speaks (il/elle/on)"],
      ["français", "French"],
      ["à Paris", "in Paris"],
    ]),
  ];
}

/** L3 — interleave break (days of week, m8): «on va manger» debut, plus
 *  samedi/dimanche named explicitly (never "week-end"). */
function lesson3(): LessonStep[] {
  return [
    {
      id: "fr-m19-3-map-onva",
      type: "word_map",
      tokens: ["samedi", "on va", "manger"],
      pairs: [
        { en: "Saturday", tokenIndex: 0 },
        { en: "we're going to", tokenIndex: 1 },
        { en: "eat", tokenIndex: 2 },
      ],
      audioText: "samedi, on va manger",
      revealNote: "«On va» + infinitive works the same way — «on va manger» = we're going to eat.",
    },
    cloze(
      "fr-m19-3-cloze-samedi",
      "Samedi, on va",
      ".",
      "manger",
      ["manger", "visiter"],
      "Saturday, we're going to eat",
      "samedi, on va manger",
    ),
    build(
      "fr-m19-3-build-dimanche",
      "Build: 'Sunday, we're going to eat a pizza'",
      "dimanche, on va manger une pizza",
      ["dimanche", "on va", "manger", "une pizza", "mangé"],
      ["dimanche", "on va", "manger", "une pizza"],
    ),
    sentenceMcq({
      id: "fr-m19-3-smcq-onvamanger",
      prompt: "'We're going to eat' — pick the French.",
      correctText: "on va manger",
      distractorsText: ["on a mangé", "on va mangé", "on va visiter"],
    }),
    listeningCompSentence({
      id: "fr-m19-3-lc-samedipizza",
      audioText: "samedi, on va manger une pizza",
      correctMeaningEn: "Saturday, we're going to eat a pizza",
      distractorsEn: [
        "Sunday, we're going to eat a pizza",
        "Saturday, we ate a pizza",
        "Saturday, we're going to eat a croissant",
      ],
    }),
    speaking("fr-m19-3-speak-lundi-recall", "c'est lundi", "it's Monday", [], "recall"),
    cloze(
      "fr-m19-3-cloze-croissant",
      "Dimanche, on va",
      "un croissant.",
      "manger",
      ["manger", "visiter"],
      "Sunday, we're going to eat a croissant",
      "dimanche, on va manger un croissant",
    ),
    listeningCompSentence({
      id: "fr-m19-3-lc-onmangecroissant-recap",
      audioText: "on va manger un croissant",
      correctMeaningEn: "We're going to eat a croissant",
      distractorsEn: [
        "We ate a croissant",
        "We're going to eat a pizza",
        "We eat a croissant every day",
      ],
    }),
    speaking("fr-m19-3-speak-cinema-recall2", "je vais au cinéma", "I'm going to the cinema", [], "recall"),
    crossModuleMatchPairs("fr-m19-3", [
      ["samedi", "Saturday"],
      ["dimanche", "Sunday"],
      ["on va", "we're going to"],
      ["manger", "to eat"],
      ["une pizza", "a pizza"],
      ["un croissant", "a croissant"],
    ]),
  ];
}

/** L4 — il/elle across manger/visiter; both pairings debut written first. */
function lesson4(): LessonStep[] {
  return [
    {
      id: "fr-m19-4-map-ilelle2",
      type: "word_map",
      tokens: ["il va", "manger"],
      pairs: [
        { en: "he's going to", tokenIndex: 0 },
        { en: "eat", tokenIndex: 1 },
      ],
      audioText: "il va manger",
      revealNote: "«Il va manger» = he's going to eat — the same third-person chunk from L2, new infinitive.",
    },
    cloze(
      "fr-m19-4-cloze-ilmange",
      "Il va",
      "une pizza.",
      "manger",
      ["manger", "mangé"],
      "he's going to eat a pizza",
      "il va manger une pizza",
    ),
    build(
      "fr-m19-4-build-ellevisite",
      "Build: 'she's going to visit the museum'",
      "elle va visiter le musée",
      ["elle va", "visiter", "le musée", "visité"],
      ["elle va", "visiter", "le musée"],
    ),
    sentenceMcq({
      id: "fr-m19-4-smcq-ellevavisiter",
      prompt: "'She's going to visit' — pick the French.",
      correctText: "elle va visiter",
      distractorsText: [
        "elle visite le musée",
        "elle a visité le musée",
        "elle va visité le musée",
      ],
    }),
    listeningCompSentence({
      id: "fr-m19-4-lc-ilmangecroissant",
      audioText: "il va manger un croissant",
      correctMeaningEn: "He's going to eat a croissant",
      distractorsEn: [
        "He's eating a croissant",
        "He ate a croissant",
        "He's going to eat a pizza",
      ],
    }),
    speaking("fr-m19-4-speak-grandchat-recall", "un grand chat", "a big cat", [], "recall"),
    cloze(
      "fr-m19-4-cloze-ellevisitegare",
      "Elle va",
      "la gare.",
      "visiter",
      ["visiter", "manger"],
      "she's going to visit the station",
      "elle va visiter la gare",
    ),
    listeningCompSentence({
      id: "fr-m19-4-lc-ilmangegateau-recap",
      audioText: "il va manger un gâteau",
      correctMeaningEn: "He's going to eat a cake",
      distractorsEn: [
        "He ate a cake",
        "He's going to eat a pizza",
        "He's going to eat a croissant",
      ],
    }),
    speaking("fr-m19-4-speak-bonjour-recall2", "bonjour", "hello", [], "recall"),
    crossModuleMatchPairs("fr-m19-4", [
      ["il va", "he's going to"],
      ["elle va", "she's going to"],
      ["manger", "to eat"],
      ["visiter", "to visit"],
      ["le musée", "the museum"],
      ["la gare", "the station"],
    ]),
  ];
}

/** L5 — interleave break (price/numbers, m12): tu/on + visiter debut. */
function lesson5(): LessonStep[] {
  return [
    {
      id: "fr-m19-5-map-tuon",
      type: "word_map",
      tokens: ["tu vas", "visiter"],
      pairs: [
        { en: "you're going to", tokenIndex: 0 },
        { en: "visit", tokenIndex: 1 },
      ],
      audioText: "tu vas visiter",
      revealNote: "«Tu vas visiter» = you're going to visit — the same «je vais/tu vas» engine, new infinitive.",
    },
    cloze(
      "fr-m19-5-cloze-tuvasparc",
      "Demain, tu vas",
      "le parc.",
      "visiter",
      ["visiter", "habiter"],
      "tomorrow, you're going to visit the park",
      "demain, tu vas visiter le parc",
    ),
    build(
      "fr-m19-5-build-onvavisite",
      "Build: 'we're going to visit the museum'",
      "on va visiter le musée",
      ["on va", "visiter", "le musée", "visité"],
      ["on va", "visiter", "le musée"],
    ),
    sentenceMcq({
      id: "fr-m19-5-smcq-tuvasvisiter",
      prompt: "'You're going to visit' — pick the French.",
      correctText: "tu vas visiter",
      distractorsText: [
        "tu visites le parc",
        "tu as visité le parc",
        "tu vas visité le parc",
      ],
    }),
    listeningCompSentence({
      id: "fr-m19-5-lc-onvavisitemusee",
      audioText: "on va visiter le musée",
      correctMeaningEn: "We're going to visit the museum",
      distractorsEn: [
        "We're visiting the museum",
        "We visited the museum",
        "We're going to visit the park",
      ],
    }),
    speaking("fr-m19-5-speak-cacoute-recall", "ça coûte vingt euros", "it costs twenty euros", [], "recall"),
    cloze(
      "fr-m19-5-cloze-vingteuros",
      "Le musée, ça coûte",
      "euros.",
      "vingt",
      ["vingt", "douze"],
      "the museum costs twenty euros",
      "le musée, ça coûte vingt euros",
    ),
    listeningCompSentence({
      id: "fr-m19-5-lc-tuvasgare-recap",
      audioText: "tu vas visiter la gare",
      correctMeaningEn: "You're going to visit the station",
      distractorsEn: [
        "You visited the station",
        "You're going to visit the park",
        "You're going to visit the museum",
      ],
    }),
    speaking("fr-m19-5-speak-lundi-recall2", "c'est lundi", "it's Monday", [], "recall"),
    crossModuleMatchPairs("fr-m19-5", [
      ["tu vas", "you're going to"],
      ["on va", "we're going to"],
      ["visiter", "to visit"],
      ["ça coûte", "it costs"],
      ["vingt", "twenty"],
      ["euros", "euros"],
    ]),
  ];
}

/** L6 — passé composé vs future contrast: hier + j'ai/tu as mangé (m7/m14)
 *  against demain + je vais/tu vas manger. Extends already-debuted je+
 *  manger/tu+manger pairings only, no new pairing this lesson. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m19-6-info-contrast",
      "Hier vs demain",
      "«Hier, j'ai mangé...» looks BACK (I ate — passé composé). «Demain, je vais manger...» looks FORWARD (I'm going to eat). Same verb, opposite direction — the time word tells you which.",
    ),
    cloze(
      "fr-m19-6-cloze-hier",
      "Hier, j'ai",
      "une pizza.",
      "mangé",
      ["mangé", "parlé"],
      "yesterday, I ate a pizza",
      "hier, j'ai mangé une pizza",
    ),
    build(
      "fr-m19-6-build-demain",
      "Build: 'tomorrow, I'm going to eat a pizza'",
      "demain, je vais manger une pizza",
      ["demain", "je vais", "manger", "une pizza", "mangé"],
      ["demain", "je vais", "manger", "une pizza"],
    ),
    sentenceMcq({
      id: "fr-m19-6-smcq-demainjevais",
      prompt: "'I'm going to eat' — pick the French.",
      correctText: "je vais manger",
      distractorsText: ["hier, j'ai mangé", "demain, j'ai mangé", "hier, je vais manger"],
    }),
    listeningCompSentence({
      id: "fr-m19-6-lc-tuasmange",
      audioText: "hier, tu as mangé un croissant",
      correctMeaningEn: "Yesterday, you ate a croissant",
      distractorsEn: [
        "Tomorrow, you're going to eat a croissant",
        "Yesterday, you ate a pizza",
        "You're eating a croissant",
      ],
    }),
    speaking("fr-m19-6-speak-onvacinema-recall", "on va au cinéma demain ?", "are we going to the cinema tomorrow?", [], "recall"),
    build(
      "fr-m19-6-build-tuvasmanger",
      "Build: 'tomorrow, you're going to eat a croissant'",
      "demain, tu vas manger un croissant",
      ["demain", "tu vas", "manger", "un croissant", "mangé"],
      ["demain", "tu vas", "manger", "un croissant"],
    ),
    cloze(
      "fr-m19-6-cloze-ongateau-recap",
      "Demain, on va",
      "un gâteau.",
      "manger",
      ["manger", "mangé"],
      "tomorrow, we're going to eat cake",
      "demain, on va manger un gâteau",
    ),
    speaking("fr-m19-6-speak-grandchat-recall2", "un grand chat", "a big cat", [], "recall"),
    crossModuleMatchPairs("fr-m19-6", [
      ["hier", "yesterday"],
      ["demain", "tomorrow"],
      ["j'ai mangé", "I ate"],
      ["je vais manger", "I'm going to eat"],
      ["tu as mangé", "you ate"],
      ["tu vas manger", "you're going to eat"],
    ]),
  ];
}

/** L7 — interleave break (adjectives/negation, m9): the already-known
 *  «ne ... pas» frame wraps around already-debuted pairings only —
 *  no first-exposure pairing lives inside a negation. */
function lesson7(): LessonStep[] {
  return [
    {
      id: "fr-m19-7-map-negation",
      type: "word_map",
      tokens: ["je ne vais pas", "manger"],
      pairs: [
        { en: "I'm not going to", tokenIndex: 0 },
        { en: "eat", tokenIndex: 1 },
      ],
      audioText: "je ne vais pas manger",
      revealNote: "The same «ne ... pas» frame wraps the future too: «je ne vais pas manger» = I'm not going to eat.",
    },
    cloze(
      "fr-m19-7-cloze-ilnevapas",
      "Demain, il ne va",
      "manger de gâteau.",
      "pas",
      ["pas", "jamais"],
      "tomorrow, he's not going to eat cake",
      "demain, il ne va pas manger de gâteau",
    ),
    build(
      "fr-m19-7-build-ellenevapas",
      "Build: 'she's not going to visit the park'",
      "elle ne va pas visiter le parc",
      ["elle ne va pas", "visiter", "le parc", "visité"],
      ["elle ne va pas", "visiter", "le parc"],
    ),
    sentenceMcq({
      id: "fr-m19-7-smcq-jenevaispas",
      prompt: "'Not going to...' — pick the correct negator.",
      correctText: "pas",
      distractorsText: ["jamais", "rien", "plus"],
    }),
    listeningCompSentence({
      id: "fr-m19-7-lc-tunevaspasvisiter",
      audioText: "tu ne vas pas visiter le musée",
      correctMeaningEn: "You're not going to visit the museum",
      distractorsEn: [
        "You're not visiting the museum",
        "You didn't visit the museum",
        "You're not going to visit the park",
      ],
    }),
    speaking("fr-m19-7-speak-bonjour-recall", "bonjour", "hello", [], "recall"),
    cloze(
      "fr-m19-7-cloze-onnevapas",
      "Samedi, on ne va",
      "manger de pizza.",
      "pas",
      ["pas", "jamais"],
      "Saturday, we're not going to eat pizza",
      "samedi, on ne va pas manger de pizza",
    ),
    build(
      "fr-m19-7-build-ellenevapasmusee-recap",
      "Build: 'she's not going to visit the museum'",
      "elle ne va pas visiter le musée",
      ["elle ne va pas", "visiter", "le musée", "visité"],
      ["elle ne va pas", "visiter", "le musée"],
    ),
    speaking("fr-m19-7-speak-cacoute-recall2", "ça coûte vingt euros", "it costs twenty euros", [], "recall"),
    crossModuleMatchPairs("fr-m19-7", [
      ["je ne vais pas", "I'm not going to"],
      ["il ne va pas", "he's not going to"],
      ["elle ne va pas", "she's not going to"],
      ["manger", "to eat"],
      ["visiter", "to visit"],
      ["le parc", "the park"],
    ]),
  ];
}

/** L8 — checkpoint: zero-new, every step graded. Includes the deliberate
 *  TRANSFER TEST «elle va parler» — elle+parler is never paired before
 *  this lesson (elle only ever paired with habiter/visiter/manger
 *  earlier), so this is a graded, non-recall speaking of a fresh
 *  RECOMBINATION of two individually-taught elements — legal at a
 *  checkpoint per constraint 5, distinct from a teaching-lesson debut. */
function checkpointLesson(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m19-8-smcq-jevaisparler",
      prompt: "'I'm going to speak' — pick the French.",
      correctText: "je vais parler",
      distractorsText: ["je parle", "j'ai parlé", "je vais parlé"],
    }),
    cloze(
      "fr-m19-8-cloze-ilhabite",
      "Demain, il va",
      "à Paris.",
      "habiter",
      ["habiter", "visiter"],
      "tomorrow, he's going to live in Paris",
      "demain, il va habiter à Paris",
    ),
    speaking("fr-m19-8-speak-ilvamanger", "il va manger une pizza", "he's going to eat a pizza", ["il va"]),
    build(
      "fr-m19-8-build-ellevisite",
      "Build: 'she's going to visit the museum'",
      "elle va visiter le musée",
      ["elle va", "visiter", "le musée", "visité"],
      ["elle va", "visiter", "le musée"],
    ),
    speaking("fr-m19-8-speak-elleparle", "elle va parler", "she's going to speak", ["il va", "elle va"]),
    listeningCompSentence({
      id: "fr-m19-8-lc-onvamanger",
      audioText: "on va manger une pizza samedi",
      correctMeaningEn: "We're going to eat a pizza Saturday",
      distractorsEn: [
        "We're going to eat a pizza Sunday",
        "We ate a pizza Saturday",
        "We're going to eat a croissant Saturday",
      ],
    }),
    sentenceMcq({
      id: "fr-m19-8-smcq-onnevapasvisiter",
      prompt: "'Not going to...' — pick the correct negator.",
      correctText: "pas",
      distractorsText: ["jamais", "rien", "plus"],
    }),
    cloze(
      "fr-m19-8-cloze-jaimange",
      "Hier, j'ai",
      "un croissant.",
      "mangé",
      ["mangé", "manger"],
      "yesterday, I ate a croissant",
      "hier, j'ai mangé un croissant",
    ),
    build(
      "fr-m19-8-build-tuvasvisiter",
      "Build: 'tomorrow, you're going to visit the station'",
      "demain, tu vas visiter la gare",
      ["demain", "tu vas", "visiter", "la gare", "visité"],
      ["demain", "tu vas", "visiter", "la gare"],
    ),
    speaking(
      "fr-m19-8-speak-jenevaispasmanger",
      "je ne vais pas manger de gâteau",
      "I'm not going to eat cake",
      ["je ne vais pas"],
    ),
    cloze(
      "fr-m19-8-cloze-tuvasvisiter",
      "Tu vas",
      "le musée demain ?",
      "visiter",
      ["visiter", "manger"],
      "are you going to visit the museum tomorrow?",
      "tu vas visiter le musée demain ?",
    ),
    crossModuleMatchPairs("fr-m19-8", [
      ["je vais", "I'm going to"],
      ["tu vas", "you're going to"],
      ["il va", "he's going to"],
      ["elle va", "she's going to"],
      ["on va", "we're going to"],
      ["je ne vais pas", "I'm not going to"],
    ]),
  ];
}

/** L9 — integration: «Le musée samedi» dialogue_sim, manually vocabulary-
 *  audited (dialogue_sim is invisible to the automated vocab-provenance
 *  gate — frSurfaces() has no case for it — and now also machine-gated by
 *  frSimProvenance.test.ts once this module lands in its MODULES array). */
function lesson9(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m19-9-smcq-tuvasvisiter",
      prompt: "'You're going to visit' — pick the French.",
      correctText: "tu vas visiter",
      distractorsText: [
        "tu visites le musée ?",
        "tu as visité le musée ?",
        "tu vas visité le musée ?",
      ],
    }),
    cloze(
      "fr-m19-9-cloze-vingteuros",
      "Le musée, ça coûte",
      "euros.",
      "vingt",
      ["vingt", "seize"],
      "the museum costs twenty euros",
      "le musée, ça coûte vingt euros",
    ),
    build(
      "fr-m19-9-build-jevaismangeravectoi",
      "Build: 'I'm going to eat a pizza with you'",
      "je vais manger une pizza avec toi",
      ["je vais", "manger", "une pizza", "avec toi", "mangé"],
      ["je vais", "manger", "une pizza", "avec toi"],
    ),
    listeningCompSentence({
      id: "fr-m19-9-lc-dimanchepizza",
      audioText: "dimanche, on va manger une pizza",
      correctMeaningEn: "Sunday, we're going to eat a pizza",
      distractorsEn: [
        "Saturday, we're going to eat a pizza",
        "Sunday, we ate a pizza",
        "Sunday, we're going to eat a croissant",
      ],
    }),
    speaking("fr-m19-9-speak-saisjamais-recall", "je ne sais jamais", "I never know", [], "recall"),
    cloze(
      "fr-m19-9-cloze-ilhabiteparis",
      "Il va",
      "à Paris demain.",
      "habiter",
      ["habiter", "manger"],
      "he's going to live in Paris tomorrow",
      "il va habiter à Paris demain",
    ),
    build(
      "fr-m19-9-build-ellenevapasgateau",
      "Build: 'she's not going to eat cake'",
      "elle ne va pas manger de gâteau",
      ["elle ne va pas", "manger", "de gâteau", "mangé"],
      ["elle ne va pas", "manger", "de gâteau"],
    ),
    listeningCompSentence({
      id: "fr-m19-9-lc-samediellehabite-recap",
      audioText: "samedi, elle va habiter à Paris",
      correctMeaningEn: "Saturday, she's going to live in Paris",
      distractorsEn: [
        "Saturday, she lives in Paris",
        "Sunday, she's going to live in Paris",
        "Saturday, she's going to live in Montreal",
      ],
    }),
    crossModuleMatchPairs("fr-m19-9", [
      ["samedi", "Saturday"],
      ["dimanche", "Sunday"],
      ["visiter", "to visit"],
      ["manger", "to eat"],
      ["le musée", "the museum"],
      ["avec toi", "with you"],
    ]),
    {
      id: "fr-m19-9-sim-musee",
      type: "dialogue_sim",
      scene: { emoji: "🏛️", title: "Le musée samedi" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-visite",
          npc: {
            speaker: "Hugo",
            kana: "Samedi, tu vas visiter le musée ?",
            audioText: "samedi, tu vas visiter le musée ?",
            gloss: "Saturday, are you going to visit the museum?",
          },
          goal: "Say yes, you're going to visit the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, je vais visiter le musée" },
              { id: "wrong-past", text: "oui, j'ai visité le musée" },
              { id: "wrong-no", text: "non, je ne vais pas visiter" },
            ],
            correctOptionId: "correct",
            audioText: "oui, je vais visiter le musée",
          },
          replyGloss: "Yes, I'm going to visit the museum.",
        },
        {
          id: "t2-manger",
          npc: {
            speaker: "Hugo",
            kana: "Et dimanche, on va manger une pizza ?",
            audioText: "et dimanche, on va manger une pizza ?",
            gloss: "And Sunday, are we going to eat a pizza?",
          },
          goal: "Say yes, you're going to eat with him.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, je vais manger avec toi" },
              { id: "wrong-no", text: "non, je ne vais pas manger" },
              { id: "wrong-past", text: "oui, j'ai mangé avec toi" },
            ],
            correctOptionId: "correct",
            audioText: "oui, je vais manger avec toi",
          },
          replyGloss: "Yes, I'm going to eat with you.",
        },
      ],
    },
  ];
}

/** L10 — mastery: recap variety, ends on its own dialogue_sim (a second
 *  scene, different cast — Camille — different vocabulary mix). */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m19-10-smcq-jevaisparler-recap",
      prompt: "'I'm going to speak' — pick the French.",
      correctText: "je vais parler",
      distractorsText: ["je parle", "j'ai parlé", "je vais parlé"],
    }),
    cloze(
      "fr-m19-10-cloze-ellevisite",
      "Demain, elle va",
      "le parc.",
      "visiter",
      ["visiter", "manger"],
      "tomorrow, she's going to visit the park",
      "demain, elle va visiter le parc",
    ),
    build(
      "fr-m19-10-build-onnevapasfromage",
      "Build: 'we're not going to eat cheese'",
      "on ne va pas manger de fromage",
      ["on ne va pas", "manger", "de fromage", "mangé"],
      ["on ne va pas", "manger", "de fromage"],
    ),
    listeningCompSentence({
      id: "fr-m19-10-lc-ilhabitemontreal",
      audioText: "samedi, il va habiter à Montréal",
      correctMeaningEn: "Saturday, he's going to live in Montreal",
      distractorsEn: [
        "Sunday, he's going to live in Montreal",
        "Saturday, he lives in Montreal",
        "Saturday, he's going to live in Paris",
      ],
    }),
    speaking("fr-m19-10-speak-cinema-recall", "je vais au cinéma", "I'm going to the cinema", [], "recall"),
    cloze(
      "fr-m19-10-cloze-ellemange",
      "Elle va",
      "un croissant.",
      "manger",
      ["manger", "visiter"],
      "she's going to eat a croissant",
      "elle va manger un croissant",
    ),
    build(
      "fr-m19-10-build-tuvasparler",
      "Build: 'tomorrow, you're going to speak French'",
      "demain, tu vas parler français",
      ["demain", "tu vas", "parler", "français", "parlé"],
      ["demain", "tu vas", "parler", "français"],
    ),
    crossModuleMatchPairs("fr-m19-10", [
      ["je vais", "I'm going to"],
      ["tu vas", "you're going to"],
      ["il va", "he's going to"],
      ["elle va", "she's going to"],
      ["on va", "we're going to"],
      ["demain", "tomorrow"],
    ]),
    {
      id: "fr-m19-10-sim-projets",
      type: "dialogue_sim",
      scene: { emoji: "🗓️", title: "Les projets de Camille" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-gare",
          npc: {
            speaker: "Camille",
            kana: "Dimanche, tu vas visiter la gare avec moi ?",
            audioText: "dimanche, tu vas visiter la gare avec moi ?",
            gloss: "Sunday, are you going to visit the station with me?",
          },
          goal: "Say yes, okay.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, d'accord" },
              { id: "wrong-past", text: "oui, j'ai visité la gare" },
              { id: "wrong-no", text: "non, je ne vais pas" },
            ],
            correctOptionId: "correct",
            audioText: "oui, d'accord",
          },
          replyGloss: "Yes, okay.",
        },
        {
          id: "t2-gateau",
          npc: {
            speaker: "Camille",
            kana: "Et samedi, on va manger un gâteau ?",
            audioText: "et samedi, on va manger un gâteau ?",
            gloss: "And Saturday, are we going to eat a cake?",
          },
          goal: "Say yes, we're going to eat a cake.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, on va manger un gâteau" },
              { id: "wrong-no", text: "non, on ne va pas manger" },
              { id: "wrong-past", text: "oui, on a mangé un gâteau" },
            ],
            correctOptionId: "correct",
            audioText: "oui, on va manger un gâteau",
          },
          replyGloss: "Yes, we're going to eat a cake.",
        },
      ],
    },
  ];
}

const FR_M19_1: LessonContent = {
  id: "fr-m19-1",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je vais parler",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M19_2: LessonContent = {
  id: "fr-m19-2",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il va, elle va",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M19_3: LessonContent = {
  id: "fr-m19-3",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Samedi, on va manger",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M19_4: LessonContent = {
  id: "fr-m19-4",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il va manger, elle va visiter",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M19_5: LessonContent = {
  id: "fr-m19-5",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Tu vas visiter",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M19_6: LessonContent = {
  id: "fr-m19-6",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Hier vs demain",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M19_7: LessonContent = {
  id: "fr-m19-7",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je ne vais pas...",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M19_8: LessonContent = {
  id: "fr-m19-8",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Aller + infinitif",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M19_9: LessonContent = {
  id: "fr-m19-9",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le musée samedi",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M19_10: LessonContent = {
  id: "fr-m19-10",
  moduleId: "m19",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Les projets de Camille",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M19_MODULE: FrModuleDef = {
  title: "Aller + infinitif",
  eyebrow: "Module 19",
  summary:
    "«Je vais» already means «I'm going» — now it means «I'm going to...» too. Front any infinitive you already know — parler, habiter, manger, visiter — and you're talking about the future. No new verb form, just a chunk you've had since day one doing a second job.",
  lessons: [
    FR_M19_1,
    FR_M19_2,
    FR_M19_3,
    FR_M19_4,
    FR_M19_5,
    FR_M19_6,
    FR_M19_7,
    FR_M19_8,
    FR_M19_9,
    FR_M19_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M19_CHECKPOINT_INDEX = 8;

export const FR_M19_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m19-s",
    moduleId: "m19",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m19-s",
        prompt: "'I'm going to speak' — pick the French.",
        correctText: "je vais parler",
        distractorsText: ["je parle", "j'ai parlé", "je vais parlé"],
      }),
  },
  {
    id: "pt-fr-m19-1",
    moduleId: "m19",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m19-1",
        prompt: "'He's going to live in Paris' — pick the French.",
        correctText: "il va habiter à Paris",
        distractorsText: ["il habite à Paris", "il a visité Paris", "il va visité à Paris"],
      }),
  },
  {
    id: "pt-fr-m19-2",
    moduleId: "m19",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m19-2",
        prompt: "'She's going to visit the museum' — pick the French.",
        correctText: "elle va visiter le musée",
        distractorsText: [
          "elle visite le musée",
          "elle a visité le musée",
          "elle va visité le musée",
        ],
      }),
  },
  {
    id: "pt-fr-m19-3",
    moduleId: "m19",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m19-3",
        prompt: "'We're going to eat a pizza' — pick the French.",
        correctText: "on va manger une pizza",
        distractorsText: ["on mange une pizza", "on a mangé une pizza", "on va mangé une pizza"],
      }),
  },
  {
    id: "pt-fr-m19-4",
    moduleId: "m19",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m19-4",
        prompt: "'I'm not going to eat cake' — pick the French.",
        correctText: "je ne vais pas manger de gâteau",
        distractorsText: [
          "je ne mange pas de gâteau",
          "je n'ai pas mangé de gâteau",
          "je ne vais pas mangé de gâteau",
        ],
      }),
  },
];
