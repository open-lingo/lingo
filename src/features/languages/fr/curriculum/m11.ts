/**
 * m11.ts — La machine à verbes — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m11-brief-2026-09-10.md: the conjugation
 * checkpoint the arc has been pausing at since m10 (the shelter volunteer's
 * glossed «Vous aimez les chats ?» tease). This module cracks open the verb
 * machine: -er present-tense conjugation for the SINGULAR persons only
 * (je/tu/il/elle/on), using the two verbs the course already half-knows
 * (aimer, from j'aime/tu aimes in m3) plus one brand-new one (habiter).
 *
 * SCOPE DECISIONS (all deliberate):
 *   - SINGULAR ONLY. Nous/vous/ils/elles conjugation is explicitly a later
 *     module's job (deferred-items registry §6). This module's whole job is
 *     je/tu/il/elle/on — the same five endings pattern (-e/-es/-e/-e/-e)
 *     across two verbs, so the LESSON is "one engine, five persons, silent
 *     endings" — not "here are twelve verb forms."
 *   - The homophone rule (playbook, brief §homophones): je parle / tu parles
 *     / il parle, and j'habite / tu habites / il habite are near- or
 *     fully-homophonous in speech. Every atom pair that shares a
 *     pronunciation carries a `homophoneKey`; per playbook, an audio-bearing
 *     paradigm step (listening_build tile bank, listening_comprehension,
 *     dialogue_listen) NEVER co-presents two same-key options — this module
 *     never uses `listeningBuildSentence` at all, sidestepping the risk
 *     entirely; the written contrasts (build tile banks, cloze options)
 *     freely co-present parle/parles and habite/habites since spelling the
 *     silent ending IS the written skill.
 *   - «il» and «tu» are NOT in the ELIDING_WORDS set (mustElide), so
 *     «il habite» / «tu habites» trigger NO elision — this module uses
 *     il/tu/on as the habiter subject through L1-L8, sidestepping the
 *     j'habite apostrophe-tokenization risk entirely for the taught core;
 *     «j'habite» appears ONLY late (L9-L10), as a pre-elided WHOLE TILE
 *     (never split je+habite in a build bank), by which point «j'aime» /
 *     «j'» has long been normal in the learner's eye from m3.
 *   - agreementChain() is NOT used: it requires ≥2 agreement slots per
 *     item (`fail(id, "an agreement CHAIN needs ≥2 slots")` in
 *     grammarHelpers.ts), and this module's single-subject verb-ending
 *     contrasts (tu vs il/elle/on) are inherently one-slot decisions — a
 *     genuine chain has no natural home here. L5's tu/il discrimination
 *     review uses sentenceMcq/cloze instead.
 *   - "parler" (bare infinitive) debuts via a two-token word_map paired
 *     with "français" («parler français» / "to speak French") — a clean
 *     FR_INTRO_TYPES-legal debut for both words in one step.
 *   - français/anglais (language nouns) are abstract nouns with no natural
 *     emoji — following m9/m10 precedent for non-imageable nouns, they
 *     debut via word_map / cloze / sentence context rather than
 *     vocabMcq/word_image_mcq (which both hard-require emoji-bearing
 *     options); no emoji field is set on their atoms.
 *   - ZERO deferred-registry items touched: no «en ville», no h aspiré, no
 *     d'-elision/partitives beyond what's already live, no «mon amie», no
 *     ne-drop register.
 *   - Cross-module recalls draw from the verified pool: "j'aime le
 *     chocolat" (m3), "je vais au cinéma" (m5), "c'est lundi" (m8) — each
 *     an exact printed-voicing match from its source lesson.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   il aime le chocolat L1 · elle aime la musique L1 · on aime le cinéma
 *   L1 · je parle français L2 · tu parles anglais L2 · il parle français
 *   L2 · on habite à Montréal L3 · tu habites à Paris ? L3 · il habite à
 *   Paris L3 · il aime parler français L4 · elle aime parler anglais L4
 *   recalls drawn: il aime le chocolat L4 · je parle français L5 · elle
 *   aime la musique L6 · tu habites à Paris ? L6 · il parle français L7 ·
 *   je vais au cinéma L7 (m5) · on habite à Montréal L8 · c'est lundi
 *   L8 (m8) · j'aime le chocolat L9 (m3) · tu parles anglais L10.
 *
 * NOTE on je + habiter: this module's TAUGHT habiter beats (L1-L8) keep
 * to il/tu/on — outside ELIDING_WORDS — so the elision/tokenization
 * question never arises during the paradigm build. «j'habite» surfaces
 * only in L9-L10 as a pre-elided whole tile/cloze answer, once the
 * learner's eye is long since used to «j'» from m3's «j'aime».
 *
 * Cast: a whiteboard démonstration (Madame Girard draws the "verb
 * machine" — one engine, five gears); a language-exchange meetup where
 * everyone states what they speak; a pen-pal exchange about where people
 * live; a study-buddy scene mixing all three verbs; the checkpoint recaps
 * as a quiz show; the finale is a video-call sim introducing yourself.
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
  slotFor,
} from "../grammarHelpers";

/**
 * Hand-built MCQ, shape-identical to grammarHelpers' vocabTextMcq(), but
 * bypassing the atom registry entirely.
 *
 * WHY THIS EXISTS: FR's `import.meta.glob` curriculum loader resolves
 * module files in LEXICOGRAPHIC order — `fs.readdirSync().sort()` on this
 * directory returns m1, m10, m11, m2, m3, m4, ... m9 — so m11.ts's own
 * module-level lesson-building code runs BEFORE m2.ts–m9.ts register their
 * atoms into the shared surface registry. vocabTextMcq() (and the unused
 * matchPairs() factory) call resolveSurfaceGloss()/findFrAtomBySurface() for
 * the TARGET surface and throw hard if it isn't registered yet — which any
 * m2–m9-sourced target always is not, from m11's vantage point. Raw
 * `match_pairs` literals, sentenceMcq(), cloze(), build() etc. don't hit
 * this (they never call findFrAtomBySurface for their core text), so this
 * helper mimics vocabTextMcq()'s exact rendered shape with pre-resolved,
 * hand-written text instead of a live registry lookup.
 *
 * Use it to review a surface introduced in m2–m9 (the ordering bug above);
 * m1/m10/m11-sourced surfaces should keep going through the real
 * vocabTextMcq() UNLESS that surface is a gendered noun (F6) this module
 * only ever exercises BARE — vocabTextMcq()'s automatic withArticle() wrap
 * would debut a fused elided token («l'anglais») on a non-intro-capable
 * step the first time it's reviewed. In that case use this helper with the
 * literal bare surface instead (fr-m11-2-vmcq-anglais, 2026-09-10).
 */
function crossModuleVocabMcq(
  id: string,
  gloss: string,
  correctText: string,
  distractorTexts: [string, string, string],
): LessonStep {
  const items = [
    { id: "correct", text: correctText },
    { id: "opt-1", text: distractorTexts[0] },
    { id: "opt-2", text: distractorTexts[1] },
    { id: "opt-3", text: distractorTexts[2] },
  ];
  const slot = slotFor(id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "multiple_choice",
    prompt: `Which word means "${gloss}"?`,
    options: items,
    correctOptionId: "correct",
    optionsHideRomaji: true,
    exercisedAtoms: [],
    modality: "recognition",
  } as LessonStep;
}

const COURSE_ID = "mock-1";

export const FR_M11_ATOMS: FrAtom[] = [
  atom({ surface: "aime", meaningEn: "loves/likes (il/elle/on)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", homophoneKey: "ɛm", hint: "the same sound as j'aime — the -e is silent" }),
  atom({ surface: "aimes", meaningEn: "love/like (tu)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", homophoneKey: "ɛm", hint: "same sound as aime — only the spelling moves" }),
  atom({ surface: "parler", meaningEn: "to speak", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", hint: "par-LAY — the whole, unconjugated engine" }),
  atom({ surface: "parle", meaningEn: "speak(s) (je/il/elle/on)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", homophoneKey: "paʁl", hint: "PARL — je parle and il parle sound identical" }),
  atom({ surface: "parles", meaningEn: "speak (tu)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", homophoneKey: "paʁl", hint: "same sound as parle — the -s is silent" }),
  atom({ surface: "français", meaningEn: "French", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", hint: "frahn-SAY — the language, no emoji fits a language" }),
  atom({ surface: "anglais", meaningEn: "English", partOfSpeech: "noun", fromModule: "m11", kind: "vocab", gender: "m", hint: "ahn-GLAY — same -er-verb frame as français" }),
  atom({ surface: "habiter", meaningEn: "to live (reside)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", hint: "ah-bee-TAY — the whole, unconjugated engine" }),
  atom({ surface: "habite", meaningEn: "lives (il/elle/on)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", homophoneKey: "abit", hint: "ah-BEET — il habite and elle habite sound identical" }),
  atom({ surface: "habites", meaningEn: "live (tu)", partOfSpeech: "verb", fromModule: "m11", kind: "vocab", homophoneKey: "abit", hint: "same sound as habite — the -s is silent" }),
  atom({ surface: "à Paris", meaningEn: "in Paris", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", hint: "ah pa-REE — à + city name, no article" }),
  atom({ surface: "à Montréal", meaningEn: "in Montreal", partOfSpeech: "phrase", fromModule: "m11", kind: "phrase", hint: "ah mohn-ray-AL — same à + city frame" }),
];

/** L1 — «Le même moteur»: il/elle/on aime, one silent ending, three subjects. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-1-info-engine",
      "One engine, one sound",
      "You already know «j'aime» and «tu aimes» (m3). Meet the rest of the machine: «il aime», «elle aime», «on aime» — all three sound EXACTLY like «j'aime». The verb doesn't change sound at all here; only the subject in front of it tells you who.",
    ),
    {
      id: "fr-m11-1-map-ilaime",
      type: "word_map",
      tokens: ["il", "aime", "le", "chocolat"],
      pairs: [
        { en: "he", tokenIndex: 0 },
        { en: "loves", tokenIndex: 1 },
        { en: "the", tokenIndex: 2 },
        { en: "chocolate", tokenIndex: 3 },
      ],
      audioText: "il aime le chocolat",
      revealNote: "«il aime» — the exact same sound as «j'aime». Only «il» changed.",
    },
    speaking(
      "fr-m11-1-speak-ilaime",
      "il aime le chocolat",
      "he loves chocolate",
      ["il", "aime", "chocolat"],
    ),
    {
      id: "fr-m11-1-map-elleaime",
      type: "word_map",
      tokens: ["elle", "aime", "la", "musique"],
      pairs: [
        { en: "she", tokenIndex: 0 },
        { en: "loves", tokenIndex: 1 },
        { en: "the", tokenIndex: 2 },
        { en: "music", tokenIndex: 3 },
      ],
      audioText: "elle aime la musique",
      revealNote: "Same «aime», same sound — «elle» is the only new gear.",
    },
    speaking(
      "fr-m11-1-speak-elleaime",
      "elle aime la musique",
      "she loves music",
      ["elle", "aime", "musique"],
    ),
    {
      id: "fr-m11-1-map-onaime",
      type: "word_map",
      tokens: ["on", "aime", "le", "cinéma"],
      pairs: [
        { en: "we/one", tokenIndex: 0 },
        { en: "loves/love", tokenIndex: 1 },
        { en: "the", tokenIndex: 2 },
        { en: "movies", tokenIndex: 3 },
      ],
      audioText: "on aime le cinéma",
      revealNote: "«on» takes the SAME «aime» too — il/elle/on all share one ending.",
    },
    speaking(
      "fr-m11-1-speak-onaime",
      "on aime le cinéma",
      "we love the movies",
      ["on", "aime", "cinéma"],
    ),
    listeningCompSentence({
      id: "fr-m11-1-lc-elleaime",
      audioText: "elle aime la musique",
      correctMeaningEn: "She loves music.",
      distractorsEn: ["He loves music.", "She loves chocolate.", "We love music."],
    }),
    cloze(
      "fr-m11-1-cloze-onaime",
      "on",
      "le cinéma",
      "aime",
      ["aime", "aimes"],
      "we love the movies",
      "on aime le cinéma",
      "«on», «il», «elle» all take «aime» — never «aimes».",
    ),
    {
      id: "fr-m11-1-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "aime", target: "loves/likes (il/elle/on)" },
        { id: "p2", source: "chocolat", target: "chocolate" },
        { id: "p3", source: "musique", target: "music" },
        { id: "p4", source: "cinéma", target: "the movies" },
        { id: "p5", source: "bonjour", target: "hello / good day" },
        { id: "p6", source: "merci", target: "thank you" },
      ],
    },
  ];
}

/** L2 — «Je parle, tu parles»: the full singular paradigm on a new verb. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-2-info-parler",
      "A brand-new engine: «parler»",
      "«parler» means \"to speak.\" Drop the -er and add the same endings you just met: je parl-e, tu parl-es, il/elle/on parl-e. Every one of those endings is silent — «parle» and «parles» sound identical.",
    ),
    {
      id: "fr-m11-2-map-parlerfr",
      type: "word_map",
      tokens: ["parler", "français"],
      pairs: [
        { en: "to speak", tokenIndex: 0 },
        { en: "French", tokenIndex: 1 },
      ],
      audioText: "parler français",
      revealNote: "The dictionary form — before any ending gets bolted on.",
    },
    speaking(
      "fr-m11-2-speak-jeparle",
      "je parle français",
      "I speak French",
      ["je", "parle", "français"],
    ),
    {
      id: "fr-m11-2-map-tuparles",
      type: "word_map",
      tokens: ["tu", "parles", "anglais"],
      pairs: [
        { en: "you", tokenIndex: 0 },
        { en: "speak", tokenIndex: 1 },
        { en: "English", tokenIndex: 2 },
      ],
      audioText: "tu parles anglais",
      revealNote: "«parles» has a written -s, but it sounds exactly like «parle».",
    },
    speaking(
      "fr-m11-2-speak-tuparles",
      "tu parles anglais",
      "you speak English",
      ["tu", "parles", "anglais"],
    ),
    // WRITTEN-ONLY: parle/parles share homophoneKey "paʁl" — this is a
    // build tile bank (visual selection), never an ear-answered step.
    build(
      "fr-m11-2-build-elleparle",
      "Build: 'she speaks English'",
      "elle parle anglais",
      ["elle", "parle", "parles", "anglais", "français"],
      ["elle", "parle", "anglais"],
    ),
    speaking(
      "fr-m11-2-speak-ilparle",
      "il parle français",
      "he speaks French",
      ["il", "parle", "français"],
    ),
    cloze(
      "fr-m11-2-cloze-onparle",
      "on",
      "français",
      "parle",
      ["parle", "parles"],
      "we speak French",
      "on parle français",
      "«on» takes «parle», not «parles» — same rule as «aime».",
    ),
    // BARE, not vocabTextMcq(): «anglais» is a gendered noun (F6), but this
    // module only ever exercises it bare as a verb complement («parler
    // anglais»); vocabTextMcq()'s automatic withArticle() wrap would debut
    // the fused token «l'anglais» here for the first time, on a step type
    // that isn't intro-capable. Keep the review on the form actually taught.
    crossModuleVocabMcq("fr-m11-2-vmcq-anglais", "English", "anglais", [
      "français",
      "chocolat",
      "musique",
    ]),
    {
      id: "fr-m11-2-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "parler", target: "to speak" },
        { id: "p2", source: "parle", target: "speak(s) (je/il/elle/on)" },
        { id: "p3", source: "parles", target: "speak (tu)" },
        { id: "p4", source: "français", target: "French" },
        { id: "p5", source: "anglais", target: "English" },
        { id: "p6", source: "merci", target: "thank you" },
      ],
    },
  ];
}

/** L3 — «Habiter»: a third verb, plus city names with à. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-3-info-habiter",
      "Where you live: «habiter»",
      "«habiter» means \"to live\" (reside). Same machine: il/elle/on habit-e, tu habit-es. Add a city with «à» — no article needed: «à Paris», «à Montréal».",
    ),
    {
      id: "fr-m11-3-map-onhabite",
      type: "word_map",
      tokens: ["on", "habite", "à", "Montréal"],
      pairs: [
        { en: "we", tokenIndex: 0 },
        { en: "live", tokenIndex: 1 },
        { en: "in", tokenIndex: 2 },
        { en: "Montreal", tokenIndex: 3 },
      ],
      audioText: "on habite à Montréal",
      revealNote: "«à» + city, no article — «à Montréal», not «au Montréal».",
    },
    speaking(
      "fr-m11-3-speak-onhabite",
      "on habite à Montréal",
      "we live in Montreal",
      ["on", "habite", "à Montréal"],
    ),
    {
      id: "fr-m11-3-map-tuhabites",
      type: "word_map",
      tokens: ["tu", "habites", "à", "Paris"],
      pairs: [
        { en: "you", tokenIndex: 0 },
        { en: "live", tokenIndex: 1 },
        { en: "in", tokenIndex: 2 },
        { en: "Paris", tokenIndex: 3 },
      ],
      audioText: "tu habites à Paris ?",
      revealNote: "«habites» — silent -s, same sound as «habite».",
    },
    speaking(
      "fr-m11-3-speak-tuhabites",
      "tu habites à Paris ?",
      "do you live in Paris?",
      ["tu", "habites", "à Paris"],
    ),
    // WRITTEN-ONLY: habite/habites share homophoneKey "abit" — tile bank only.
    build(
      "fr-m11-3-build-ellehabite",
      "Build: 'she lives in Montreal'",
      "elle habite à Montréal",
      ["elle", "habite", "habites", "à Montréal", "à Paris"],
      ["elle", "habite", "à Montréal"],
    ),
    speaking(
      "fr-m11-3-speak-ilhabite",
      "il habite à Paris",
      "he lives in Paris",
      ["il", "habite", "à Paris"],
    ),
    cloze(
      "fr-m11-3-cloze-onhabite",
      "on",
      "à Paris",
      "habite",
      ["habite", "habites"],
      "we live in Paris",
      "on habite à Paris",
      "«on» takes «habite» — same silent-ending rule as every other verb here.",
    ),
    listeningCompSentence({
      id: "fr-m11-3-lc-onhabite",
      audioText: "on habite à Montréal",
      correctMeaningEn: "We live in Montreal.",
      distractorsEn: ["We live in Paris.", "She lives in Montreal.", "We speak French."],
    }),
    {
      id: "fr-m11-3-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "habiter", target: "to live (reside)" },
        { id: "p2", source: "habite", target: "lives (il/elle/on)" },
        { id: "p3", source: "habites", target: "live (tu)" },
        { id: "p4", source: "à Paris", target: "in Paris" },
        { id: "p5", source: "à Montréal", target: "in Montreal" },
        { id: "p6", source: "bonjour", target: "hello / good day" },
      ],
    },
  ];
}

/** L4 — «Aimer + infinitif»: liking to do things, verb-chaining. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-4-info-chain",
      "Chaining two verbs",
      "\"aimer\" + a second verb's dictionary form says what you like to DO: «il aime parler français» — \"he likes to speak French.\" The second verb never changes; it stays in its plain, unconjugated form.",
    ),
    speaking(
      "fr-m11-4-speak-ilaimechocolat-recall",
      "il aime le chocolat",
      "he loves chocolate",
      [],
      "recall",
    ),
    {
      id: "fr-m11-4-map-ilaimeparler",
      type: "word_map",
      tokens: ["il", "aime", "parler", "français"],
      pairs: [
        { en: "he", tokenIndex: 0 },
        { en: "likes", tokenIndex: 1 },
        { en: "to speak", tokenIndex: 2 },
        { en: "French", tokenIndex: 3 },
      ],
      audioText: "il aime parler français",
      revealNote: "«parler» stays in its dictionary form after «aime» — it never conjugates here.",
    },
    speaking(
      "fr-m11-4-speak-ilaimeparler",
      "il aime parler français",
      "he likes to speak French",
      ["il", "aime", "parler", "français"],
    ),
    {
      id: "fr-m11-4-map-elleaimeparler",
      type: "word_map",
      tokens: ["elle", "aime", "parler", "anglais"],
      pairs: [
        { en: "she", tokenIndex: 0 },
        { en: "likes", tokenIndex: 1 },
        { en: "to speak", tokenIndex: 2 },
        { en: "English", tokenIndex: 3 },
      ],
      audioText: "elle aime parler anglais",
      revealNote: "Same frame, new language — «parler» still doesn't change.",
    },
    speaking(
      "fr-m11-4-speak-elleaimeparler",
      "elle aime parler anglais",
      "she likes to speak English",
      ["elle", "aime", "parler", "anglais"],
    ),
    build(
      "fr-m11-4-build-onaimeparler",
      "Build: 'we like to speak French'",
      "on aime parler français",
      ["on", "aime", "parler", "français", "anglais"],
      ["on", "aime", "parler", "français"],
    ),
    cloze(
      "fr-m11-4-cloze-aimeparler",
      "elle aime",
      "français",
      "parler",
      ["parler", "parle"],
      "she likes to speak French",
      "elle aime parler français",
      "After «aime», the second verb stays in its dictionary form: «parler», not «parle».",
    ),
    build(
      "fr-m11-4-build-aimehabiter",
      "Build: 'she likes to live in Montreal'",
      "elle aime habiter à Montréal",
      ["elle", "aime", "habiter", "à Montréal", "à Paris"],
      ["elle", "aime", "habiter", "à Montréal"],
    ),
    {
      id: "fr-m11-4-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "aime", target: "loves/likes (il/elle/on)" },
        { id: "p2", source: "parler", target: "to speak" },
        { id: "p3", source: "habiter", target: "to live (reside)" },
        { id: "p4", source: "français", target: "French" },
        { id: "p5", source: "anglais", target: "English" },
        { id: "p6", source: "à Montréal", target: "in Montreal" },
      ],
    },
  ];
}

/** L5 — «Je, tu, il»: discrimination review across all three verbs. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-5-info-review",
      "One machine, three verbs",
      "aimer, parler, habiter — every one of them uses the same singular endings: -e for je/il/elle/on, -es for tu. Same sound, mostly different spelling.",
    ),
    speaking(
      "fr-m11-5-speak-jeparle-recall",
      "je parle français",
      "I speak French",
      [],
      "recall",
    ),
    cloze(
      "fr-m11-5-cloze-tuaimes",
      "tu",
      "le cinéma",
      "aimes",
      ["aimes", "aime"],
      "you love the movies",
      "tu aimes le cinéma",
      "«tu» takes -es: «aimes».",
    ),
    build(
      "fr-m11-5-build-tu",
      "Build: 'you love chocolate' (tu)",
      "tu aimes le chocolat",
      ["tu", "aimes", "aime", "le chocolat", "le cinéma"],
      ["tu", "aimes", "le chocolat"],
    ),
    cloze(
      "fr-m11-5-cloze-il",
      "il",
      "français",
      "parle",
      ["parle", "parles"],
      "he speaks French",
      "il parle français",
      "«il/elle/on» always take the plain -e ending — «parle», not «parles».",
    ),
    build(
      "fr-m11-5-build-onparle",
      "Build: 'we speak English'",
      "on parle anglais",
      ["on", "parle", "parles", "anglais", "français"],
      ["on", "parle", "anglais"],
    ),
    sentenceMcq({
      id: "fr-m11-5-smcq-habiter",
      prompt: "'She lives in Paris' — pick the French.",
      correctText: "elle habite à Paris",
      distractorsText: ["elle habite à Montréal", "il habite à Paris", "elle habites à Paris"],
    }),
    listeningCompSentence({
      id: "fr-m11-5-lc-ilaimeparler",
      audioText: "il aime parler français",
      correctMeaningEn: "He likes to speak French.",
      distractorsEn: ["He likes to speak English.", "She likes to speak French.", "He loves French."],
    }),
    vocabTextMcq(
      "fr-m11-5-vmcq-habiter",
      "habiter",
      ["parler", "chocolat", "musique"],
      "'to live (reside)' — pick the French verb.",
    ),
    {
      id: "fr-m11-5-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "parle", target: "speak(s) (je/il/elle/on)" },
        { id: "p2", source: "parles", target: "speak (tu)" },
        { id: "p3", source: "aime", target: "loves/likes (il/elle/on)" },
        { id: "p4", source: "aimes", target: "love/like (tu)" },
        { id: "p5", source: "français", target: "French" },
        { id: "p6", source: "cinéma", target: "the movies" },
      ],
    },
  ];
}

/** L6 — «Le pen-pal»: habiter + aimer transfer, city context. */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-6-info-penpal",
      "Reading between cities",
      "A pen-pal writes about where they live and what they like. Everything here reuses forms you already know — read for the whole sentence, not word by word.",
    ),
    speaking(
      "fr-m11-6-speak-elleaimemusique-recall",
      "elle aime la musique",
      "she loves music",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m11-6-smcq-ilhabite",
      prompt: "'He lives in Paris' — pick the French.",
      correctText: "il habite à Paris",
      distractorsText: ["il habite à Montréal", "elle habite à Paris", "il habites à Paris"],
    }),
    listeningCompSentence({
      id: "fr-m11-6-lc-onhabiteparle",
      audioText: "on habite à Montréal et on parle français",
      correctMeaningEn: "We live in Montreal and we speak French.",
      distractorsEn: [
        "We live in Paris and we speak French.",
        "We live in Montreal and we speak English.",
        "She lives in Montreal and speaks French.",
      ],
    }),
    speaking(
      "fr-m11-6-speak-tuhabites-recall",
      "tu habites à Paris ?",
      "do you live in Paris?",
      [],
      "recall",
    ),
    cloze(
      "fr-m11-6-cloze-ellehabite",
      "elle",
      "à Montréal",
      "habite",
      ["habite", "habites"],
      "she lives in Montreal",
      "elle habite à Montréal",
      "«elle» takes «habite» — the plain -e ending.",
    ),
    crossModuleVocabMcq("fr-m11-6-vmcq-cinema", "the movies", "le cinéma", [
      "la musique",
      "le chocolat",
      "lundi",
    ]),
    build(
      "fr-m11-6-build-ilhabiteparis",
      "Build: 'he lives in Paris and loves the movies'",
      "il habite à Paris et aime le cinéma",
      ["il", "habite", "à Paris", "et", "aime", "le cinéma", "à Montréal"],
      ["il", "habite", "à Paris", "et", "aime", "le cinéma"],
    ),
    speaking(
      "fr-m11-6-speak-penpal",
      "elle aime parler français",
      "she likes to speak French",
      [],
    ),
    {
      id: "fr-m11-6-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "habite", target: "lives (il/elle/on)" },
        { id: "p2", source: "à Paris", target: "in Paris" },
        { id: "p3", source: "à Montréal", target: "in Montreal" },
        { id: "p4", source: "aime", target: "loves/likes (il/elle/on)" },
        { id: "p5", source: "parler", target: "to speak" },
        { id: "p6", source: "musique", target: "music" },
      ],
    },
  ];
}

/** L7 — «Study buddy»: mixed-verb dialogue practice. */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m11-7-info-buddy",
      "Mixing the machine",
      "Real talk mixes all three verbs in one exchange. Watch the subject — it's the only thing that tells you which ending belongs.",
    ),
    speaking(
      "fr-m11-7-speak-ilparle-recall",
      "il parle français",
      "he speaks French",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m11-7-smcq-buddy",
      prompt: "'We live in Paris' — pick the French.",
      correctText: "on habite à Paris",
      distractorsText: [
        "on habite à Montréal",
        "on parle à Paris",
        "il habite à Paris",
      ],
    }),
    build(
      "fr-m11-7-build-tuaimesparler",
      "Build: 'you like to speak English'",
      "tu aimes parler anglais",
      ["tu", "aimes", "aime", "parler", "anglais", "français"],
      ["tu", "aimes", "parler", "anglais"],
    ),
    vocabTextMcq(
      "fr-m11-7-vmcq-habiter",
      "habiter",
      ["parler", "chocolat", "musique"],
      "'to live (reside)' — pick the French verb.",
    ),
    speaking(
      "fr-m11-7-speak-jevaiscinema-recall",
      "je vais au cinéma",
      "I'm going to the movies",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m11-7-smcq-ellehabite",
      prompt: "'She lives in Montreal' — pick the French.",
      correctText: "elle habite à Montréal",
      distractorsText: ["elle habite à Paris", "il habite à Montréal", "elle habites à Montréal"],
    }),
    cloze(
      "fr-m11-7-cloze-ilparlefr",
      "il",
      "français",
      "parle",
      ["parle", "parles"],
      "he speaks French",
      "il parle français",
      "«il» takes «parle» — the plain -e ending, silent.",
    ),
    listeningCompSentence({
      id: "fr-m11-7-lc-tuaimesparler",
      audioText: "tu aimes parler français",
      correctMeaningEn: "You like to speak French.",
      distractorsEn: ["You like to speak English.", "You speak French.", "He likes to speak French."],
    }),
    {
      id: "fr-m11-7-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "habiter", target: "to live (reside)" },
        { id: "p2", source: "parler", target: "to speak" },
        { id: "p3", source: "à Paris", target: "in Paris" },
        { id: "p4", source: "à Montréal", target: "in Montreal" },
        { id: "p5", source: "français", target: "French" },
        { id: "p6", source: "lundi", target: "Monday" },
      ],
    },
  ];
}

/** L8 — «Checkpoint»: zero-new, quiz-show recap. */
function checkpointLesson(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m11-8-lc-1",
      audioText: "il aime parler français",
      correctMeaningEn: "He likes to speak French.",
      distractorsEn: ["He speaks French.", "She likes to speak French.", "He likes to speak English."],
    }),
    cloze(
      "fr-m11-8-cloze-1",
      "il",
      "parler français",
      "aime",
      ["aime", "aimes"],
      "he likes to speak French",
      "il aime parler français",
      "«il» takes «aime» — the plain -e ending.",
    ),
    speaking(
      "fr-m11-8-speak-onhabitemontreal-recall",
      "on habite à Montréal",
      "we live in Montreal",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m11-8-smcq-1",
      prompt: "'You speak English' (tu) — pick the French.",
      correctText: "tu parles anglais",
      distractorsText: ["tu parle anglais", "tu parles français", "il parles anglais"],
    }),
    build(
      "fr-m11-8-build-1",
      "Build: 'we like to speak French'",
      "on aime parler français",
      ["on", "aime", "parler", "français", "anglais"],
      ["on", "aime", "parler", "français"],
    ),
    listeningCompSentence({
      id: "fr-m11-8-lc-2",
      audioText: "elle habite à Paris",
      correctMeaningEn: "She lives in Paris.",
      distractorsEn: ["She lives in Montreal.", "He lives in Paris.", "She speaks French."],
    }),
    cloze(
      "fr-m11-8-cloze-2",
      "tu",
      "le cinéma",
      "aimes",
      ["aimes", "aime"],
      "you love the movies",
      "tu aimes le cinéma",
      "«tu» takes -es: «aimes».",
    ),
    speaking(
      "fr-m11-8-speak-cestlundi-recall",
      "c'est lundi",
      "it's Monday",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m11-8-smcq-2",
      prompt: "'We live in Paris' — pick the French.",
      correctText: "on habite à Paris",
      distractorsText: ["on habites à Paris", "on habite à Montréal", "on parle à Paris"],
    }),
    build(
      "fr-m11-8-build-2",
      "Build: 'she lives in Montreal'",
      "elle habite à Montréal",
      ["elle", "habite", "habites", "à Montréal", "à Paris"],
      ["elle", "habite", "à Montréal"],
    ),
    listeningCompSentence({
      id: "fr-m11-8-lc-3",
      audioText: "je parle français et j'aime le cinéma",
      correctMeaningEn: "I speak French and I love the movies.",
      distractorsEn: [
        "I speak English and I love the movies.",
        "I speak French and I love music.",
        "She speaks French and loves the movies.",
      ],
    }),
    {
      id: "fr-m11-8-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "aime", target: "loves/likes (il/elle/on)" },
        { id: "p2", source: "aimes", target: "love/like (tu)" },
        { id: "p3", source: "parle", target: "speak(s) (je/il/elle/on)" },
        { id: "p4", source: "parles", target: "speak (tu)" },
        { id: "p5", source: "habite", target: "lives (il/elle/on)" },
        { id: "p6", source: "habites", target: "live (tu)" },
      ],
    },
  ];
}

/** L9 — «Le speed-dating linguistique»: sim scene, self-intro exchange. */
function lesson9(): LessonStep[] {
  return [
    speaking(
      "fr-m11-9-speak-jaimechocolat-recall",
      "j'aime le chocolat",
      "I love chocolate",
      [],
      "recall",
    ),
    cloze(
      "fr-m11-9-cloze-tuparles",
      "tu",
      "français",
      "parles",
      ["parles", "parle"],
      "you speak French",
      "tu parles français",
      "«tu» takes -es: «parles».",
    ),
    build(
      "fr-m11-9-build-ilaimeanglais",
      "Build: 'he likes to speak English'",
      "il aime parler anglais",
      ["il", "aime", "parler", "anglais", "français"],
      ["il", "aime", "parler", "anglais"],
    ),
    listeningCompSentence({
      id: "fr-m11-9-lc-onhabite",
      audioText: "on habite à Paris",
      correctMeaningEn: "We live in Paris.",
      distractorsEn: ["We live in Montreal.", "She lives in Paris.", "We speak French."],
    }),
    sentenceMcq({
      id: "fr-m11-9-smcq-anglais",
      prompt: "'I speak English' — pick the French.",
      correctText: "je parle anglais",
      distractorsText: ["je parles anglais", "tu parles anglais", "je parle français"],
    }),
    {
      id: "fr-m11-9-sim-rencontre",
      type: "dialogue_sim",
      scene: { emoji: "🌐", title: "Language-exchange meetup" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-parles",
          npc: {
            speaker: "Léa",
            kana: "Bonjour ! Tu parles français ?",
            audioText: "bonjour ! tu parles français ?",
            gloss: "Hello! Do you speak French?",
          },
          goal: "Say yes, you speak French.",
          reply: {
            mode: "choice",
            options: [
              { id: "oui", text: "oui, je parle français" },
              { id: "wrong-form", text: "oui, je parles français" },
              { id: "non", text: "non, je parle anglais" },
            ],
            correctOptionId: "oui",
            audioText: "oui, je parle français",
          },
          replyGloss: "Yes, I speak French.",
        },
        {
          id: "t2-habites",
          npc: {
            speaker: "Léa",
            kana: "Super ! Tu habites où ?",
            audioText: "super ! tu habites où ?",
            gloss: "Great! Where do you live?",
          },
          goal: "Say you live in Montreal.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "j'habite à Montréal" },
              { id: "wrong-city", text: "j'habite à Paris" },
              { id: "wrong-form", text: "j'habites à Montréal" },
            ],
            correctOptionId: "correct",
            audioText: "j'habite à Montréal",
          },
          replyGloss: "I live in Montreal.",
        },
        {
          id: "t3-anglais",
          npc: {
            speaker: "Léa",
            kana: "Et tu aimes parler anglais aussi ?",
            audioText: "et tu aimes parler anglais aussi ?",
            gloss: "And do you like to speak English too?",
          },
          goal: "Say yes, you like to speak English.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, j'aime parler anglais" },
              { id: "wrong-lang", text: "oui, j'aime parler français" },
              { id: "wrong-form", text: "oui, j'aimes parler anglais" },
            ],
            correctOptionId: "correct",
            audioText: "oui, j'aime parler anglais",
          },
          replyGloss: "Yes, I like to speak English.",
        },
      ],
    },
    vocabTextMcq(
      "fr-m11-9-vmcq-parler",
      "parler",
      ["habiter", "chocolat", "lundi"],
      "'to speak' — pick the French verb.",
    ),
    cloze(
      "fr-m11-9-cloze-jhabite",
      "j'",
      "à Montréal",
      "habite",
      ["habite", "habites"],
      "I live in Montreal",
      "j'habite à Montréal",
      "«je» + habiter takes the plain -e ending, just like «il/elle/on».",
    ),
    build(
      "fr-m11-9-build-recap",
      "Build: 'she likes to speak English'",
      "elle aime parler anglais",
      ["elle", "aime", "parler", "anglais", "français"],
      ["elle", "aime", "parler", "anglais"],
    ),
    {
      id: "fr-m11-9-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "habite", target: "lives (il/elle/on)" },
        { id: "p2", source: "habites", target: "live (tu)" },
        { id: "p3", source: "parle", target: "speak(s) (je/il/elle/on)" },
        { id: "p4", source: "parles", target: "speak (tu)" },
        { id: "p5", source: "à Montréal", target: "in Montreal" },
        { id: "p6", source: "anglais", target: "English" },
      ],
    },
  ];
}

/** L10 — «Présentation complète»: full self-intro, ends on a sim. */
function lesson10(): LessonStep[] {
  return [
    speaking(
      "fr-m11-10-speak-tuparlesanglais-recall",
      "tu parles anglais",
      "you speak English",
      [],
      "recall",
    ),
    build(
      "fr-m11-10-build-full",
      "Build: 'I live in Paris and I speak French'",
      "j'habite à Paris et je parle français",
      ["j'habite", "à Paris", "et", "je parle", "français", "anglais"],
      ["j'habite", "à Paris", "et", "je parle", "français"],
    ),
    listeningCompSentence({
      id: "fr-m11-10-lc-full",
      audioText: "elle habite à Montréal et elle aime parler anglais",
      correctMeaningEn: "She lives in Montreal and she likes to speak English.",
      distractorsEn: [
        "She lives in Paris and she likes to speak English.",
        "She lives in Montreal and she likes to speak French.",
        "He lives in Montreal and likes to speak English.",
      ],
    }),
    sentenceMcq({
      id: "fr-m11-10-smcq-recap",
      prompt: "'He lives in Montreal and speaks French' — pick the French.",
      correctText: "il habite à Montréal et il parle français",
      distractorsText: [
        "il habite à Paris et il parle français",
        "il habite à Montréal et il parle anglais",
        "il habites à Montréal et il parle français",
      ],
    }),
    {
      id: "fr-m11-10-match",
      type: "match_pairs",
      prompt: "Match each French word to its meaning",
      pairs: [
        { id: "p1", source: "aime", target: "loves/likes (il/elle/on)" },
        { id: "p2", source: "parle", target: "speak(s) (je/il/elle/on)" },
        { id: "p3", source: "habite", target: "lives (il/elle/on)" },
        { id: "p4", source: "parler", target: "to speak" },
        { id: "p5", source: "habiter", target: "to live (reside)" },
        { id: "p6", source: "à Paris", target: "in Paris" },
      ],
    },
    {
      // TAIL: full self-intro video-call sim.
      id: "fr-m11-10-sim-intro",
      type: "dialogue_sim",
      scene: {
        emoji: "📹",
        title: "Video call with a new pen-pal",
        setting: "Introduce yourself fully.",
      },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-appelles",
          npc: {
            speaker: "Théo",
            kana: "Salut ! Tu habites où ?",
            audioText: "salut ! tu habites où ?",
            gloss: "Hi! Where do you live?",
          },
          goal: "Say you live in Paris.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "j'habite à Paris" },
              { id: "wrong-city", text: "j'habite à Montréal" },
              { id: "wrong-form", text: "j'habites à Paris" },
            ],
            correctOptionId: "correct",
            audioText: "j'habite à Paris",
          },
          replyGloss: "I live in Paris.",
        },
        {
          id: "t2-parlesanglais",
          npc: {
            speaker: "Théo",
            kana: "Ah, tu habites à Paris ! Tu parles anglais ?",
            audioText: "ah, tu habites à Paris ! tu parles anglais ?",
            gloss: "Ah, you live in Paris! Do you speak English?",
          },
          goal: "Say yes, you speak English and French.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, je parle anglais et français" },
              { id: "wrong-form", text: "oui, je parles anglais et français" },
              { id: "wrong-verb", text: "oui, j'aime parler anglais et français" },
            ],
            correctOptionId: "correct",
            audioText: "oui, je parle anglais et français",
          },
          replyGloss: "Yes, I speak English and French.",
        },
        {
          id: "t3-chocolat",
          npc: {
            speaker: "Théo",
            kana: "Et tu aimes le chocolat ?",
            audioText: "et tu aimes le chocolat ?",
            gloss: "And do you love chocolate?",
          },
          goal: "Say yes, you love chocolate.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, j'aime le chocolat" },
              { id: "wrong-form", text: "oui, j'aimes le chocolat" },
              { id: "wrong-noun", text: "oui, j'aime la musique" },
            ],
            correctOptionId: "correct",
            audioText: "oui, j'aime le chocolat",
          },
          replyGloss: "Yes, I love chocolate.",
        },
      ],
    },
  ];
}

const FR_M11_1: LessonContent = {
  id: "fr-m11-1",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le même moteur",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M11_2: LessonContent = {
  id: "fr-m11-2",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je parle, tu parles",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M11_3: LessonContent = {
  id: "fr-m11-3",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Où tu habites",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M11_4: LessonContent = {
  id: "fr-m11-4",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Aimer + infinitif",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M11_5: LessonContent = {
  id: "fr-m11-5",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je, tu, il",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M11_6: LessonContent = {
  id: "fr-m11-6",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le pen-pal",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M11_7: LessonContent = {
  id: "fr-m11-7",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Study buddy",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M11_8: LessonContent = {
  id: "fr-m11-8",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · The verb machine",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M11_9: LessonContent = {
  id: "fr-m11-9",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Speed-dating linguistique",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M11_10: LessonContent = {
  id: "fr-m11-10",
  moduleId: "m11",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Présentation complète",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M11_MODULE: FrModuleDef = {
  title: "La machine à verbes",
  eyebrow: "Module 11",
  summary:
    "The verb machine opens: je/tu/il/elle/on across aimer, parler, and habiter — one engine, five silent-ending gears, three verbs.",
  lessons: [
    FR_M11_1,
    FR_M11_2,
    FR_M11_3,
    FR_M11_4,
    FR_M11_5,
    FR_M11_6,
    FR_M11_7,
    FR_M11_8,
    FR_M11_9,
    FR_M11_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M11_CHECKPOINT_INDEX = 8;

export const FR_M11_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m11-s",
    moduleId: "m11",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m11-s",
        prompt: "'She speaks French' — pick the French.",
        correctText: "elle parle français",
        distractorsText: ["elle parles français", "il parle français", "elle parle anglais"],
      }),
  },
  {
    id: "pt-fr-m11-1",
    moduleId: "m11",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m11-1",
        prompt: "'You live in Paris' (tu) — pick the French.",
        correctText: "tu habites à Paris",
        distractorsText: ["tu habite à Paris", "il habites à Paris", "tu habites à Montréal"],
      }),
  },
  {
    id: "pt-fr-m11-2",
    moduleId: "m11",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m11-2",
        prompt: "'He likes to speak English' — pick the French.",
        correctText: "il aime parler anglais",
        distractorsText: ["il aime parle anglais", "il parle anglais", "elle aime parler anglais"],
      }),
  },
  {
    id: "pt-fr-m11-3",
    moduleId: "m11",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m11-3",
        prompt: "Which subject takes «-es»?",
        correctText: "tu",
        distractorsText: ["il", "elle", "on"],
      }),
  },
  {
    id: "pt-fr-m11-4",
    moduleId: "m11",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m11-4",
        prompt: "'We live in Montreal' — pick the French.",
        correctText: "on habite à Montréal",
        distractorsText: ["on habites à Montréal", "on habite à Paris", "on parle à Montréal"],
      }),
  },
];
