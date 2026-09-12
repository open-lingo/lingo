/**
 * m26.ts — «À la maison» — household rooms + kitchen mass-noun staples: a
 * LEXICON module (not a grammar module), interleaved with m20–m25 review.
 *
 * AUTHORED 2026-09-10 per docs/fr-m26-brief-2026-09-10.md, with every brief
 * claim checked against the live registries before writing a lesson step.
 *
 * SCOPE DECISIONS (recorded per the "never park a question" doctrine):
 *
 *   1. EXACTLY 8 NEW ATOMS, all `partOfSpeech: "noun"` with a `gender`
 *      field (unlike m25's phrase-only module, this module's atoms are real
 *      gendered nouns): rooms — chambre (f), salon (m), cuisine (f), jardin
 *      (m) — and kitchen staples — lait (m), eau (f), pain (m), beurre (m).
 *      All 8 emoji files were confirmed already vendored on disk
 *      (`src/pub/noto-emoji/svg/emoji_u{1f6cf,1f6cb,1f373,1f333,1f95b,
 *      1f4a7,1f35e,1f9c8}.svg`) — zero vendoring work this cycle.
 *
 *   2. EAU/AU SPEECH SAFETY — «eau» is a homophone of «au» (the m25/course
 *      false-positive class). It is NEVER a bare speaking/build/cloze/MCQ-
 *      option/match-pairs-source/listening-tile target anywhere in this
 *      module — always spoken embedded, as «j'aime l'eau». `vocabMcq()`
 *      itself structurally protects the WORD-IMAGE-MCQ surface (it always
 *      calls `withArticle()`, so "eau" can never render bare there — it
 *      renders "l'eau"). Every other surface field is hand-checked and kept
 *      to «j'aime l'eau» / «l'eau» throughout. As an additional discipline,
 *      «au» (bare, or as a contraction) is never used ANYWHERE in this
 *      module — the module simply has no need for it (no café-location
 *      sentences), so the au/eau minimal-pair risk cannot arise even
 *      cross-module within m26's own content.
 *
 *   3. NO PARTITIVE — «du»/«de la»/«de l'» is m27's grammar, not m26's.
 *      This module seeds the mass-noun VOCABULARY only, through two frames
 *      already live in the course: «j'aime le/la/l' [noun]» (m3's «j'aime
 *      le chocolat» — generic reference, confirmed the exact precedent by
 *      direct grep) and «il n'y a pas de [noun]» (m4's «il n'y a pas de
 *      café» — negated existence, bare «de», confirmed already a
 *      registered PHRASE ATOM: `atom({ surface: "il n'y a pas de", ...,
 *      fromModule: "m4" })`). The literal string "il y a du "/"il y a de la
 *      "/"il y a de l'" never appears anywhere in this module — machine-
 *      checked in m26.test.ts by scanning the whole lessons array. Room
 *      nouns (countable, singular) DO get affirmative «il y a un/une
 *      [room]» — that's ordinary indefinite-article existence, not
 *      partitive, and was always in scope.
 *
 *   4. THE "PARC"/"JARDIN" EMOJI COLLISION — the brief assigned «jardin»
 *      the emoji 🌳 (U+1F333), but «parc» (m4, live) already owns 🌳.
 *      `courseEmojiIntegrity` ("an emoji means ONE thing") rejects an
 *      emoji bound to two surfaces in image MCQs course-wide, so «jardin»
 *      ships as 🌷 (U+1F337, vendored, unused elsewhere in FR) instead.
 *      Push-gate fix 2026-09-11; the brief's table is superseded here.
 *
 *   5. NO PLURAL ARTICLE SURFACES NEEDED — `withArticle()` (confirmed by
 *      direct source read: no plural branch) is only ever called by
 *      `vocabMcq()` on these 8 atoms in their SINGULAR form; every
 *      hand-written sentence in this module («il y a une chambre», «dans
 *      la cuisine», etc.) is singular by design — the brief's plural
 *      warning is heeded by simply never constructing a plural.
 *
 *   6. NATIVE vs BYPASS MCQ CALLS — because all 8 new atoms carry an
 *      emoji, `vocabMcq()` (image-based) is used natively for any MCQ
 *      whose target AND full distractor pool are drawn ONLY from this
 *      module's own `FR_M26_ATOMS` (registered synchronously, before any
 *      lesson function executes — the exact m24.ts precedent: an atom can
 *      be referenced as a distractor before its own pedagogical debut).
 *      Every other MCQ/match-pairs step — any that references an m1–m25
 *      atom, or that is sentence-level rather than single-noun-level —
 *      routes through the hand-built `crossModuleVocabMcq`/
 *      `crossModuleMatchPairs` bypass functions (copied shape-identical
 *      from m21–m25), never through `matchPairs`/`vocabTextMcq`/
 *      `withArticle` against a prior-module atom. `FR_M26_PLACEMENT` uses
 *      only `sentenceMcq()` with literal strings (no atom lookup at all),
 *      sidestepping `placementBank.ts`'s still-unbucketed glob entirely
 *      (re-confirmed unfixed, 7th+ consecutive brief).
 *
 *   7. RECOMBINE MAP — rooms («il y a un/une [room]», m9's grand/grande
 *      agreement drilled on «une grande chambre» / «un grand jardin»,
 *      confirmed exact precedent «un grand chat» / «une grande maison»)
 *      + staples («j'aime le/la/l' [staple]», «il n'y a pas de [staple]»)
 *      + café (m1/m4, unrelated-break interleave, never co-tiled with
 *      jardin per decision 4) + «maison» (m3, recalled as the container:
 *      «dans la maison, il y a…») + m25's «c'est qui ?» (pure unrelated-
 *      break review row in match-pairs banks, per doctrine's "interleave,
 *      don't block-teach"). L7 combines a room noun and a staple noun in
 *      one sentence via «dans la cuisine, j'aime le pain/lait» — kitchen as
 *      the natural room/staple bridge, never via a banned partitive «il y a
 *      [mass noun]» construction.
 *
 *   8. SENTENCE-OVERUSE DISCIPLINE — `lintSentenceOveruse`
 *      (moduleBarGuards.ts) counts only `build_sentence.targetSentence` /
 *      `speaking.targetPhrase` / `listening_comprehension.transcript` /
 *      `word_map.audioText`, max 3x per lesson. Every lesson below keeps
 *      each such surface at ≤2 hits by design (verified by the gate run).
 *
 *   9. TITLE TEMPLATE — L8's title "✓ Checkpoint · À la maison" reuses
 *      m24/m25's exact, verified-safe "✓ Checkpoint · X" clause pattern.
 *
 *  10. NO NEW HOMOPHONES — none of the 8 new nouns is a gender/agreement
 *      pair of another (8 independent nouns, not adjective pairs); no
 *      `homophoneKey` wiring anywhere in this module (`HOMOPHONE_PAIRS =
 *      []` per m26.test.ts is a structural given, matching m25's own).
 *
 *  11. THE M27 TEASE STAYS OUT OF GRADED CONTENT — the brief wants a soft
 *      forward-tease toward m27's partitive grammar, but L8–L10 (>=
 *      CHECKPOINT_INDEX) carry zero info cards (matching m25's own L8–L10
 *      shape) and the partitive-ban scan covers every lesson-step field
 *      including NPC dialogue text — so the tease lives ONLY in
 *      `FR_M26_MODULE.summary` (course metadata, never rendered as a
 *      graded or even ungraded lesson step), where it cannot trip any gate.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   il y a une chambre L1 · il y a un salon L1 · il y a une cuisine L2 ·
 *   il y a un jardin L2 · j'aime le lait L4 · j'aime l'eau L4 ·
 *   j'aime le pain L5 · j'aime le beurre L5 · dans la cuisine, j'aime le
 *   pain L7.
 *   recalls drawn: il y a une chambre L3 · il y a un salon L3 ·
 *   j'aime le lait L6 · il y a une cuisine L7 · j'aime le pain L9 ·
 *   j'aime l'eau L9 · il y a un jardin L10 · j'aime le beurre L10.
 *   Total: 8 recall-cued speaking instances, comfortably clearing the
 *   m26.test.ts floor (m26Recalls >= 4).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  vocabMcq,
  slotFor,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

/**
 * Hand-built MCQ, shape-identical to grammarHelpers' vocabTextMcq()/
 * crossModuleVocabMcq() precedent (m15/m21–m25.ts), bypassing the atom
 * registry. Used for every gloss-driven vocab/sentence MCQ that references
 * an m1–m25 atom, or is sentence-level, in this module.
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
    prompt: `Which one means "${gloss}"?`,
    options: items,
    correctOptionId: "correct",
    optionsHideRomaji: true,
    exercisedAtoms: [],
    modality: "recognition",
  } as LessonStep;
}

/**
 * Hand-built match_pairs, shape-identical to grammarHelpers' matchPairs(),
 * bypassing the atom registry. Used for EVERY match_pairs step in this
 * module. Never fed a bare "eau" source (match_pairs plays audio on
 * select — see decision 2).
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

export const FR_M26_ATOMS: FrAtom[] = [
  atom({
    surface: "chambre",
    meaningEn: "bedroom",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "f",
    emoji: "🛏️",
    hint: "SHAHM-br — bedroom",
  }),
  atom({
    surface: "salon",
    meaningEn: "living room",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "m",
    emoji: "🛋️",
    hint: "sah-LOHN — nasal ending, living room",
  }),
  atom({
    surface: "cuisine",
    meaningEn: "kitchen",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "f",
    emoji: "🍳",
    hint: "kwee-ZEEN — kitchen",
  }),
  atom({
    surface: "jardin",
    meaningEn: "garden / yard",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "m",
    emoji: "🌷",
    hint: "zhar-DAN — nasal ending, garden",
  }),
  atom({
    surface: "lait",
    meaningEn: "milk",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "m",
    emoji: "🥛",
    hint: "LAY — milk",
  }),
  atom({
    surface: "eau",
    meaningEn: "water",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "f",
    emoji: "💧",
    hint: "OH — water; always heard as «l'eau», never bare",
  }),
  atom({
    surface: "pain",
    meaningEn: "bread",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "m",
    emoji: "🍞",
    hint: "PAN — nasal ending, bread",
  }),
  atom({
    surface: "beurre",
    meaningEn: "butter",
    partOfSpeech: "noun",
    fromModule: "m26",
    kind: "vocab",
    gender: "m",
    emoji: "🧈",
    hint: "BUHR — butter",
  }),
];

const ROOM_POOL: { surface: string; emoji: string }[] = [
  { surface: "chambre", emoji: "🛏️" },
  { surface: "salon", emoji: "🛋️" },
  { surface: "cuisine", emoji: "🍳" },
  { surface: "jardin", emoji: "🌷" },
];

const STAPLE_POOL: { surface: string; emoji: string }[] = [
  { surface: "lait", emoji: "🥛" },
  { surface: "eau", emoji: "💧" },
  { surface: "pain", emoji: "🍞" },
  { surface: "beurre", emoji: "🧈" },
];

/** L1 — debut: «chambre», «salon». Existence with an indefinite article,
 *  the pattern the course already owns («il y a un café», m4). */
function lesson1(): LessonStep[] {
  return [
    vocabMcq("fr-m26-1-vmcq-chambre", { surface: "chambre", meaningEn: "bedroom", emoji: "🛏️" }, ROOM_POOL),
    build(
      "fr-m26-1-build-ilyaunechambre",
      "Build: 'There's a bedroom'",
      "il y a une chambre",
      ["il y a", "une chambre", "un café"],
      ["il y a", "une chambre"],
      ["chambre"],
    ),
    speaking("fr-m26-1-speak-ilyaunechambre", "il y a une chambre", "there's a bedroom", ["chambre"]),
    crossModuleVocabMcq("fr-m26-1-mcq-cafe", "there is a cafe", "il y a un café", [
      "il y a une chambre",
      "c'est qui ?",
      "tu vas où ?",
    ]),
    vocabMcq("fr-m26-1-vmcq-salon", { surface: "salon", meaningEn: "living room", emoji: "🛋️" }, ROOM_POOL),
    speaking("fr-m26-1-speak-ilyaunsalon", "il y a un salon", "there's a living room", ["salon"]),
    cloze(
      "fr-m26-1-cloze-chambre",
      "il y a",
      "chambre",
      "une",
      ["une", "un"],
      "there's a bedroom",
      "il y a une chambre",
      "«chambre» is feminine — une, not un.",
      ["chambre"],
    ),
    listeningCompSentence({
      id: "fr-m26-1-lc-ilyaunsalon",
      audioText: "il y a un salon",
      correctMeaningEn: "There's a living room.",
      distractorsEn: ["There's a bedroom.", "There's a café.", "Who is it?"],
    }),
    crossModuleVocabMcq("fr-m26-1-mcq-maison", "house", "la maison", ["le salon", "la chambre", "le café"]),
    crossModuleMatchPairs("fr-m26-1", [
      ["chambre", "bedroom"],
      ["salon", "living room"],
      ["maison", "house"],
      ["café", "café"],
      ["il y a un café", "there's a café"],
      ["c'est qui ?", "who is it? (review)"],
      ["tu vas où ?", "where are you going? (review)"],
    ]),
  ];
}

/** L2 — debut: «cuisine», «jardin». Four-room tour recombination + m9's
 *  grand/grande agreement drill on the new nouns. */
function lesson2(): LessonStep[] {
  return [
    vocabMcq("fr-m26-2-vmcq-cuisine", { surface: "cuisine", meaningEn: "kitchen", emoji: "🍳" }, ROOM_POOL),
    build(
      "fr-m26-2-build-ilyaunecuisine",
      "Build: 'There's a kitchen'",
      "il y a une cuisine",
      ["il y a", "une cuisine", "une chambre"],
      ["il y a", "une cuisine"],
      ["cuisine"],
    ),
    speaking("fr-m26-2-speak-ilyaunecuisine", "il y a une cuisine", "there's a kitchen", ["cuisine"]),
    crossModuleVocabMcq("fr-m26-2-mcq-chambre", "bedroom", "la chambre", ["le salon", "la cuisine", "le jardin"]),
    vocabMcq("fr-m26-2-vmcq-jardin", { surface: "jardin", meaningEn: "garden / yard", emoji: "🌷" }, ROOM_POOL),
    speaking("fr-m26-2-speak-ilyaunjardin", "il y a un jardin", "there's a garden", ["jardin"]),
    build(
      "fr-m26-2-build-unegrandechambre",
      "Build: 'a big bedroom'",
      "une grande chambre",
      ["une grande", "chambre", "un grand", "jardin"],
      ["une grande", "chambre"],
      ["chambre"],
    ),
    crossModuleVocabMcq("fr-m26-2-mcq-salon", "living room", "le salon", ["la chambre", "la cuisine", "le jardin"]),
    build(
      "fr-m26-2-build-ungrandjardin",
      "Build: 'a big garden'",
      "un grand jardin",
      ["un grand", "jardin", "une grande", "chambre"],
      ["un grand", "jardin"],
      ["jardin"],
    ),
    listeningCompSentence({
      id: "fr-m26-2-lc-ilyaunecuisine",
      audioText: "il y a une cuisine",
      correctMeaningEn: "There's a kitchen.",
      distractorsEn: ["There's a garden.", "There's a bedroom.", "There's a living room."],
    }),
    crossModuleVocabMcq("fr-m26-2-mcq-maison", "house", "la maison", ["le jardin", "la cuisine", "le salon"]),
    crossModuleMatchPairs("fr-m26-2", [
      ["chambre", "bedroom"],
      ["salon", "living room"],
      ["cuisine", "kitchen"],
      ["jardin", "garden / yard"],
      ["maison", "house"],
      ["grand", "big / tall (m)"],
    ]),
  ];
}

/** L3 — rooms consolidation. Zero new atoms; the four-room tour sentence,
 *  and this module's first spoken production sentence via recall. */
function lesson3(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m26-3-mcq-cuisine", "kitchen", "la cuisine", ["le salon", "la chambre", "le jardin"]),
    build(
      "fr-m26-3-build-toursmaison",
      "Build: 'In the house, there's a bedroom, a living room, a kitchen and a garden'",
      "dans la maison, il y a une chambre, un salon, une cuisine et un jardin",
      [
        "dans la maison, il y a",
        "une chambre,",
        "un salon,",
        "une cuisine et un jardin",
      ],
      ["dans la maison, il y a", "une chambre,", "un salon,", "une cuisine et un jardin"],
      ["maison", "chambre", "salon", "cuisine", "jardin"],
    ),
    speaking("fr-m26-3-speak-ilyaunechambre-recall", "il y a une chambre", "there's a bedroom", ["chambre"], "recall"),
    crossModuleVocabMcq("fr-m26-3-mcq-jardin", "garden / yard", "le jardin", ["la chambre", "la cuisine", "le salon"]),
    cloze(
      "fr-m26-3-cloze-jardin",
      "il y a",
      "jardin",
      "un",
      ["un", "une"],
      "there's a garden",
      "il y a un jardin",
      "«jardin» is masculine — un, not une.",
      ["jardin"],
    ),
    speaking("fr-m26-3-speak-ilyaunsalon-recall", "il y a un salon", "there's a living room", ["salon"], "recall"),
    crossModuleVocabMcq("fr-m26-3-mcq-salon", "living room", "le salon", ["la chambre", "la cuisine", "le jardin"]),
    listeningCompSentence({
      id: "fr-m26-3-lc-toursmaison",
      audioText: "dans la maison, il y a une chambre, un salon, une cuisine et un jardin",
      correctMeaningEn: "In the house, there's a bedroom, a living room, a kitchen and a garden.",
      distractorsEn: ["There's a café.", "Who is it?", "Where are you going?"],
    }),
    crossModuleVocabMcq("fr-m26-3-mcq-maison", "house", "la maison", ["le jardin", "la cuisine", "le salon"]),
    crossModuleMatchPairs("fr-m26-3", [
      ["chambre", "bedroom"],
      ["salon", "living room"],
      ["cuisine", "kitchen"],
      ["jardin", "garden / yard"],
      ["maison", "house"],
      ["c'est qui ?", "who is it? (review)"],
    ]),
  ];
}

/** L4 — debut: «lait», «eau». The m3-precedent generic-reference frame:
 *  «j'aime le/l' [staple]». «eau» is always «l'eau», never bare. */
function lesson4(): LessonStep[] {
  return [
    vocabMcq("fr-m26-4-vmcq-lait", { surface: "lait", meaningEn: "milk", emoji: "🥛" }, STAPLE_POOL),
    build(
      "fr-m26-4-build-jaimelelait",
      "Build: 'I like milk'",
      "j'aime le lait",
      ["j'aime", "le lait", "le chocolat", "le café"],
      ["j'aime", "le lait"],
      ["j'aime", "lait"],
    ),
    speaking("fr-m26-4-speak-jaimelelait", "j'aime le lait", "I like milk", ["j'aime", "lait"]),
    crossModuleVocabMcq("fr-m26-4-mcq-chocolat", "chocolate", "le chocolat", ["le lait", "l'eau", "le café"]),
    vocabMcq("fr-m26-4-vmcq-eau", { surface: "eau", meaningEn: "water", emoji: "💧" }, STAPLE_POOL),
    cloze(
      "fr-m26-4-cloze-lelait",
      "j'aime",
      "lait",
      "le",
      ["le", "la"],
      "I like milk",
      "j'aime le lait",
      "«lait» is masculine — le, not la.",
      ["lait"],
    ),
    speaking("fr-m26-4-speak-jaimeleau", "j'aime l'eau", "I like water", ["j'aime", "eau"]),
    crossModuleVocabMcq("fr-m26-4-mcq-jaime", "I like / I love", "j'aime", ["il y a", "c'est", "tu vas"]),
    listeningCompSentence({
      id: "fr-m26-4-lc-jaimeleau",
      audioText: "j'aime l'eau",
      correctMeaningEn: "I like water.",
      distractorsEn: ["I like milk.", "I like chocolate.", "There's a bedroom."],
    }),
    crossModuleVocabMcq("fr-m26-4-mcq-maison", "house", "la maison", ["le lait", "l'eau", "le café"]),
    crossModuleMatchPairs("fr-m26-4", [
      ["lait", "milk"],
      ["l'eau", "water"],
      ["chocolat", "chocolate (review)"],
      ["j'aime", "I like / I love"],
      ["maison", "house"],
      ["café", "café"],
    ]),
  ];
}

/** L5 — debut: «pain», «beurre». Same «j'aime» frame; m6's croissant/
 *  gâteau interleave for an unrelated-break review row. */
function lesson5(): LessonStep[] {
  return [
    vocabMcq("fr-m26-5-vmcq-pain", { surface: "pain", meaningEn: "bread", emoji: "🍞" }, STAPLE_POOL),
    build(
      "fr-m26-5-build-jaimelepain",
      "Build: 'I like bread'",
      "j'aime le pain",
      ["j'aime", "le pain", "le beurre", "le lait"],
      ["j'aime", "le pain"],
      ["j'aime", "pain"],
    ),
    speaking("fr-m26-5-speak-jaimelepain", "j'aime bien le pain", "I really like bread", ["j'aime", "bien", "pain"]),
    crossModuleVocabMcq("fr-m26-5-mcq-croissant", "croissant", "le croissant", ["le pain", "le beurre", "l'eau"]),
    vocabMcq("fr-m26-5-vmcq-beurre", { surface: "beurre", meaningEn: "butter", emoji: "🧈" }, STAPLE_POOL),
    speaking("fr-m26-5-speak-jaimelebeurre", "j'aime le beurre", "I like butter", ["j'aime", "beurre"]),
    build(
      "fr-m26-5-build-jaimelegateau",
      "Build: 'I like cake' (review)",
      "j'aime le gâteau",
      ["j'aime", "le gâteau", "le pain", "le beurre"],
      ["j'aime", "le gâteau"],
      [],
    ),
    crossModuleVocabMcq("fr-m26-5-mcq-lait", "milk", "le lait", ["le pain", "le beurre", "l'eau"]),
    listeningCompSentence({
      id: "fr-m26-5-lc-jaimelepain",
      audioText: "j'aime le pain",
      correctMeaningEn: "I like bread.",
      distractorsEn: ["I like butter.", "I like a croissant.", "There's a garden."],
    }),
    crossModuleVocabMcq("fr-m26-5-mcq-eau", "water", "l'eau", ["le pain", "le beurre", "le lait"]),
    crossModuleMatchPairs("fr-m26-5", [
      ["pain", "bread"],
      ["beurre", "butter"],
      ["croissant", "croissant (review)"],
      ["gâteau", "cake (review)"],
      ["lait", "milk"],
      ["j'aime", "I like / I love"],
    ]),
  ];
}

/** L6 — «il n'y a pas de» + staples recombination (m4's already-registered
 *  phrase atom, bare «de», no partitive). */
function lesson6(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m26-6-mcq-pasde", "there's no …", "il n'y a pas de", ["il y a", "j'aime", "c'est"]),
    build(
      "fr-m26-6-build-pasdelait",
      "Build: 'There's no milk'",
      "il n'y a pas de lait",
      ["il n'y a pas de", "lait", "pain", "beurre"],
      ["il n'y a pas de", "lait"],
      ["lait"],
    ),
    crossModuleVocabMcq("fr-m26-6-mcq-pain", "bread", "le pain", ["le lait", "le beurre", "l'eau"]),
    speaking("fr-m26-6-speak-jaimelelait-recall", "j'aime le lait", "I like milk", ["lait"], "recall"),
    build(
      "fr-m26-6-build-pasdepain",
      "Build: 'There's no bread'",
      "il n'y a pas de pain",
      ["il n'y a pas de", "pain", "lait", "beurre"],
      ["il n'y a pas de", "pain"],
      ["pain"],
    ),
    crossModuleVocabMcq("fr-m26-6-mcq-beurre", "butter", "le beurre", ["le lait", "le pain", "l'eau"]),
    build(
      "fr-m26-6-build-pasdebeurre",
      "Build: 'There's no butter'",
      "il n'y a pas de beurre",
      ["il n'y a pas de", "beurre", "lait", "pain"],
      ["il n'y a pas de", "beurre"],
      ["beurre"],
    ),
    listeningCompSentence({
      id: "fr-m26-6-lc-pasdelait",
      audioText: "il n'y a pas de lait",
      correctMeaningEn: "There's no milk.",
      distractorsEn: ["I like milk.", "There's no bread.", "There's a kitchen."],
    }),
    crossModuleVocabMcq("fr-m26-6-mcq-cafe", "there is a cafe", "il y a un café", ["il n'y a pas de lait", "j'aime le lait", "c'est qui ?"]),
    crossModuleMatchPairs("fr-m26-6", [
      ["lait", "milk"],
      ["pain", "bread"],
      ["beurre", "butter"],
      ["il n'y a pas de", "there's no …"],
      ["j'aime", "I like / I love"],
      ["café", "café (review)"],
    ]),
  ];
}

/** L7 — rooms + staples recombination. First full production sentence
 *  combining a room noun and a staple noun: «dans la cuisine, j'aime le
 *  pain» — the kitchen as the natural bridge, never via partitive. */
function lesson7(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m26-7-mcq-cuisine", "kitchen", "la cuisine", ["le jardin", "la chambre", "le salon"]),
    build(
      "fr-m26-7-build-danslacuisinepain",
      "Build: 'In the kitchen, I like bread'",
      "dans la cuisine, j'aime le pain",
      ["dans la cuisine,", "j'aime le pain", "j'aime le lait", "dans le jardin,"],
      ["dans la cuisine,", "j'aime le pain"],
      ["cuisine", "j'aime", "pain"],
    ),
    speaking("fr-m26-7-speak-ilyaunecuisine-recall", "il y a une cuisine", "there's a kitchen", ["cuisine"], "recall"),
    crossModuleVocabMcq("fr-m26-7-mcq-beurre", "butter", "le beurre", ["le lait", "le pain", "l'eau"]),
    cloze(
      "fr-m26-7-cloze-danslacuisine",
      "dans",
      "cuisine, j'aime le pain",
      "la",
      ["la", "le"],
      "in the kitchen, I like bread",
      "dans la cuisine, j'aime le pain",
      "«cuisine» is feminine — la, not le.",
      ["cuisine", "pain"],
    ),
    crossModuleVocabMcq("fr-m26-7-mcq-salon", "living room", "le salon", ["la cuisine", "la chambre", "le jardin"]),
    build(
      "fr-m26-7-build-danslejardin",
      "Build: 'In the garden, there's no bread'",
      "dans le jardin, il n'y a pas de pain",
      ["dans le jardin,", "il n'y a pas de pain", "il n'y a pas de lait", "dans la cuisine,"],
      ["dans le jardin,", "il n'y a pas de pain"],
      ["jardin", "pain"],
    ),
    listeningCompSentence({
      id: "fr-m26-7-lc-danslacuisinepain",
      audioText: "dans la cuisine, j'aime le pain",
      correctMeaningEn: "In the kitchen, I like bread.",
      distractorsEn: ["In the garden, there's no bread.", "There's a bedroom.", "I like milk."],
    }),
    crossModuleVocabMcq("fr-m26-7-mcq-chambre", "bedroom", "la chambre", ["la cuisine", "le salon", "le jardin"]),
    crossModuleMatchPairs("fr-m26-7", [
      ["cuisine", "kitchen"],
      ["jardin", "garden / yard"],
      ["pain", "bread"],
      ["beurre", "butter"],
      ["salon", "living room"],
      ["chambre", "bedroom"],
    ]),
  ];
}

/** L8 — checkpoint: zero new atoms, all graded, 12–22 steps. Recombines
 *  every thread (rooms, staples, il n'y a pas de, j'aime, maison). */
function lesson8(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m26-8-mcq-chambre", "bedroom", "la chambre", ["le salon", "la cuisine", "le jardin"]),
    build(
      "fr-m26-8-build-ilyaunechambre",
      "Build: 'There's a bedroom'",
      "il y a une chambre",
      ["il y a", "une chambre", "un salon", "une cuisine"],
      ["il y a", "une chambre"],
      ["chambre"],
    ),
    crossModuleVocabMcq("fr-m26-8-mcq-salon", "living room", "le salon", ["la chambre", "la cuisine", "le jardin"]),
    build(
      "fr-m26-8-build-ungrandjardin",
      "Build: 'a big garden'",
      "un grand jardin",
      ["un grand", "jardin", "une grande", "chambre"],
      ["un grand", "jardin"],
      ["jardin"],
    ),
    crossModuleVocabMcq("fr-m26-8-mcq-cuisine", "kitchen", "la cuisine", ["le jardin", "la chambre", "le salon"]),
    build(
      "fr-m26-8-build-jaimelelait",
      "Build: 'I like milk'",
      "j'aime le lait",
      ["j'aime", "le lait", "l'eau", "le pain"],
      ["j'aime", "le lait"],
      ["j'aime", "lait"],
    ),
    crossModuleVocabMcq("fr-m26-8-mcq-jardin", "garden / yard", "le jardin", ["la chambre", "la cuisine", "le salon"]),
    speaking("fr-m26-8-speak-jaimeleau-recall", "j'aime l'eau", "I like water", ["j'aime", "eau"], "recall"),
    build(
      "fr-m26-8-build-pasdebeurre",
      "Build: 'There's no butter'",
      "il n'y a pas de beurre",
      ["il n'y a pas de", "beurre", "lait", "pain"],
      ["il n'y a pas de", "beurre"],
      ["beurre"],
    ),
    crossModuleVocabMcq("fr-m26-8-mcq-pain", "bread", "le pain", ["le lait", "le beurre", "l'eau"]),
    listeningCompSentence({
      id: "fr-m26-8-lc-danslacuisinepain",
      audioText: "dans la cuisine, j'aime le pain",
      correctMeaningEn: "In the kitchen, I like bread.",
      distractorsEn: ["There's a bedroom.", "There's no butter.", "Who is it?"],
    }),
    crossModuleVocabMcq("fr-m26-8-mcq-maison", "house", "la maison", ["le lait", "l'eau", "le café"]),
    crossModuleMatchPairs("fr-m26-8", [
      ["chambre", "bedroom"],
      ["salon", "living room"],
      ["cuisine", "kitchen"],
      ["jardin", "garden / yard"],
      ["lait", "milk"],
      ["pain", "bread"],
    ]),
    crossModuleVocabMcq("fr-m26-8-mcq-beurre", "butter", "le beurre", ["le lait", "le pain", "l'eau"]),
  ];
}

/** L9 — integration: a house tour + kitchen check, folded into a
 *  dialogue_sim. No info cards. Recalls L5's «j'aime le pain» and L4's
 *  «j'aime l'eau». */
function lesson9(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m26-9-mcq-jardin", "garden / yard", "le jardin", ["la chambre", "la cuisine", "le salon"]),
    build(
      "fr-m26-9-build-toursmaison",
      "Build: 'In the house, there's a bedroom, a living room, a kitchen and a garden'",
      "dans la maison, il y a une chambre, un salon, une cuisine et un jardin",
      [
        "dans la maison, il y a",
        "une chambre,",
        "un salon,",
        "une cuisine et un jardin",
      ],
      ["dans la maison, il y a", "une chambre,", "un salon,", "une cuisine et un jardin"],
      ["maison", "chambre", "salon", "cuisine", "jardin"],
    ),
    speaking("fr-m26-9-speak-jaimelepain-recall", "j'aime bien le pain", "I really like bread", ["pain"], "recall"),
    crossModuleVocabMcq("fr-m26-9-mcq-lait", "milk", "le lait", ["le pain", "le beurre", "l'eau"]),
    speaking("fr-m26-9-speak-jaimeleau-recall2", "j'aime l'eau", "I like water", ["eau"], "recall"),
    build(
      "fr-m26-9-build-pasdelait",
      "Build: 'There's no milk'",
      "il n'y a pas de lait",
      ["il n'y a pas de", "lait", "pain", "beurre"],
      ["il n'y a pas de", "lait"],
      ["lait"],
    ),
    crossModuleVocabMcq("fr-m26-9-mcq-beurre", "butter", "le beurre", ["le lait", "le pain", "l'eau"]),
    listeningCompSentence({
      id: "fr-m26-9-lc-pasdebeurre",
      audioText: "il n'y a pas de beurre",
      correctMeaningEn: "There's no butter.",
      distractorsEn: ["I like butter.", "There's a garden.", "Who is it?"],
    }),
    {
      id: "fr-m26-9-sim-visite",
      type: "dialogue_sim",
      scene: { emoji: "🏠", title: "La visite", setting: "A house tour with Léa." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cettepiece",
          npc: {
            speaker: "Léa",
            kana: "Et ça, c'est quoi ?",
            audioText: "et ça, c'est quoi ?",
            gloss: "And this, what's this?",
          },
          goal: "Say there's a kitchen.",
          reply: {
            mode: "build",
            tiles: ["il y a", "une cuisine", "un salon", "une chambre"],
            answer: "il y a une cuisine",
            audioText: "il y a une cuisine",
          },
          replyGloss: "There's a kitchen.",
        },
        {
          id: "t2-lelait",
          npc: {
            speaker: "Léa",
            kana: "Le lait ?",
            audioText: "le lait ?",
            gloss: "Milk?",
          },
          goal: "Say there's no milk.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il n'y a pas de lait" },
              { id: "wrong-1", text: "j'aime le lait" },
              { id: "wrong-2", text: "il y a un jardin" },
            ],
            correctOptionId: "correct",
            audioText: "il n'y a pas de lait",
          },
          replyGloss: "There's no milk.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m26-9", [
      ["chambre", "bedroom"],
      ["salon", "living room"],
      ["cuisine", "kitchen"],
      ["jardin", "garden / yard"],
      ["lait", "milk"],
      ["beurre", "butter"],
    ]),
  ];
}

/** L10 — mastery: all graded, zero info cards, ends on a dialogue_sim that
 *  cashes in the whole module — rooms, staples, il n'y a pas de, j'aime.
 *  The soft m27 tease lives only in FR_M26_MODULE.summary (decision 11). */
function lesson10(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m26-10-mcq-beurre", "butter", "le beurre", ["le lait", "le pain", "l'eau"]),
    build(
      "fr-m26-10-build-unegrandechambre",
      "Build: 'a big bedroom'",
      "une grande chambre",
      ["une grande", "chambre", "un grand", "jardin"],
      ["une grande", "chambre"],
      ["chambre"],
    ),
    speaking("fr-m26-10-speak-ilyaunjardin-recall", "il y a un jardin", "there's a garden", ["jardin"], "recall"),
    crossModuleVocabMcq("fr-m26-10-mcq-pain", "bread", "le pain", ["le lait", "le beurre", "l'eau"]),
    build(
      "fr-m26-10-build-danslacuisinelait",
      "Build: 'In the kitchen, I like milk'",
      "dans la cuisine, j'aime le lait",
      ["dans la cuisine,", "j'aime le lait", "j'aime le pain", "dans le jardin,"],
      ["dans la cuisine,", "j'aime le lait"],
      ["cuisine", "j'aime", "lait"],
    ),
    speaking("fr-m26-10-speak-jaimelebeurre-recall", "j'aime le beurre", "I like butter", ["beurre"], "recall"),
    crossModuleVocabMcq("fr-m26-10-mcq-eau", "water", "l'eau", ["le pain", "le beurre", "le lait"]),
    crossModuleMatchPairs("fr-m26-10", [
      ["chambre", "bedroom"],
      ["salon", "living room"],
      ["cuisine", "kitchen"],
      ["jardin", "garden / yard"],
      ["lait", "milk"],
      ["pain", "bread"],
    ]),
    crossModuleVocabMcq("fr-m26-10-mcq-maison", "house", "la maison", ["le beurre", "le pain", "l'eau"]),
    {
      id: "fr-m26-10-sim-bienvenue",
      type: "dialogue_sim",
      scene: { emoji: "🚪", title: "Chez Sam", setting: "Welcoming Sam in for the first time." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-visite",
          npc: {
            speaker: "Sam",
            kana: "C'est grand ! Il y a quoi ?",
            audioText: "c'est grand ! il y a quoi ?",
            gloss: "It's big! What's there?",
          },
          goal: "Say there's a bedroom, living room and kitchen.",
          reply: {
            mode: "build",
            tiles: ["il y a", "une chambre, un salon et une cuisine", "un jardin et une cuisine", "une chambre"],
            answer: "il y a une chambre, un salon et une cuisine",
            audioText: "il y a une chambre, un salon et une cuisine",
          },
          replyGloss: "There's a bedroom, a living room and a kitchen.",
        },
        {
          id: "t2-lafaim",
          npc: {
            speaker: "Sam",
            kana: "Et le pain ?",
            audioText: "et le pain ?",
            gloss: "And the bread?",
          },
          goal: "Say there's no bread, but you like butter.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il n'y a pas de pain, mais j'aime le beurre" },
              { id: "wrong-1", text: "j'aime le pain" },
              { id: "wrong-2", text: "il y a un jardin" },
            ],
            correctOptionId: "correct",
            audioText: "il n'y a pas de pain, mais j'aime le beurre",
          },
          replyGloss: "There's no bread, but I like butter.",
        },
      ],
    },
  ];
}

const FR_M26_1: LessonContent = {
  id: "fr-m26-1",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Une chambre, un salon",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M26_2: LessonContent = {
  id: "fr-m26-2",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La cuisine, le jardin",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M26_3: LessonContent = {
  id: "fr-m26-3",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Dans la maison",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M26_4: LessonContent = {
  id: "fr-m26-4",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "J'aime le lait, j'aime l'eau",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M26_5: LessonContent = {
  id: "fr-m26-5",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le pain, le beurre",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M26_6: LessonContent = {
  id: "fr-m26-6",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il n'y a pas de lait",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M26_7: LessonContent = {
  id: "fr-m26-7",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Dans la cuisine",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M26_8: LessonContent = {
  id: "fr-m26-8",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · À la maison",
  estimatedMinutes: 11,
  xpReward: 30,
  steps: lesson8(),
};

const FR_M26_9: LessonContent = {
  id: "fr-m26-9",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La visite",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson9(),
};

const FR_M26_10: LessonContent = {
  id: "fr-m26-10",
  moduleId: "m26",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Chez Sam",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson10(),
};

export const FR_M26_MODULE: FrModuleDef = {
  title: "À la maison",
  eyebrow: "Module 26",
  summary:
    "A lexicon module: the rooms of a house — chambre, salon, cuisine, jardin — and the kitchen staples you'll find there — lait, eau, pain, beurre — folded through the existence pattern (m4), the generic «j'aime» frame (m3), and «il n'y a pas de» (m4), interleaved with m20–m25 review. Next up: the little word that makes \"there's bread\" sound native.",
  lessons: [
    FR_M26_1,
    FR_M26_2,
    FR_M26_3,
    FR_M26_4,
    FR_M26_5,
    FR_M26_6,
    FR_M26_7,
    FR_M26_8,
    FR_M26_9,
    FR_M26_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M26_CHECKPOINT_INDEX = 8;

export const FR_M26_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m26-s",
    moduleId: "m26",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m26-s",
        prompt: "'There's a bedroom' — pick the French.",
        correctText: "il y a une chambre",
        distractorsText: ["il y a un salon", "il y a une cuisine", "il y a un jardin"],
      }),
  },
  {
    id: "pt-fr-m26-1",
    moduleId: "m26",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m26-1",
        prompt: "'There's a kitchen' — pick the French.",
        correctText: "il y a une cuisine",
        distractorsText: ["il y a un jardin", "il y a une chambre", "il y a un salon"],
      }),
  },
  {
    id: "pt-fr-m26-2",
    moduleId: "m26",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m26-2",
        prompt: "'I like water' — pick the French.",
        correctText: "j'aime l'eau",
        distractorsText: ["j'aime le lait", "j'aime le pain", "il y a un jardin"],
      }),
  },
  {
    id: "pt-fr-m26-3",
    moduleId: "m26",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m26-3",
        prompt: "'There's no bread' — pick the French.",
        correctText: "il n'y a pas de pain",
        distractorsText: ["j'aime le pain", "il n'y a pas de beurre", "il y a un salon"],
      }),
  },
  {
    id: "pt-fr-m26-4",
    moduleId: "m26",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m26-4",
        prompt: "'In the kitchen, I like bread' — pick the French.",
        correctText: "dans la cuisine, j'aime le pain",
        distractorsText: [
          "dans le jardin, il n'y a pas de pain",
          "dans la cuisine, j'aime le lait",
          "il y a une cuisine",
        ],
      }),
  },
];
