/**
 * m24.ts — «C'est ouvert ?» — food/café round 2, plus ouvert/ouverte,
 * fermé/fermée on the copula the course has run since m3.
 *
 * AUTHORED 2026-09-10 per docs/fr-m24-brief-2026-09-10.md, with every
 * UNVERIFIED brief item checked against the live registries before writing
 * a single lesson step (m22/m23's own briefs both contained false claims
 * caught only by direct verification, so nothing here is trusted unread).
 *
 * SCOPE DECISIONS (recorded per the "never park a question" doctrine):
 *
 *   1. NEW ATOMS — six consonant-onset nouns (jus m, pomme f, baguette f,
 *      tarte f, crêpe f, soupe f) plus two adjective pairs (ouvert/ouverte,
 *      fermé/fermée) = 10 registrations, under the 12 ceiling. «thé» and
 *      «chocolat» are m3 recall, not new atoms — the brief's own framing.
 *
 *   2. «jus de pomme» deliberately routes around the unfixed d'-elision gap
 *      in `getFrRealFormLexicon()` (no "d" clitic derivation exists there):
 *      «pomme» is consonant-onset by spelling, so «de pomme» never needs
 *      d'-elision. This module does not fix the gap — out of scope — it
 *      just never steps on it.
 *
 *   3. HOMOPHONE WIRING — fermé/fermée are a true homophone ([fɛʁme] both
 *      ways); they share the identical homophoneKey "fɛʁme", the WORKING
 *      pattern verified in m11 (aime/aimes, parle/parles) and m23
 *      (heure/heures) — not m12's inert euro/euros shape (only one side of
 *      that pair actually carries a key). ouvert/ouverte are audibly
 *      DISTINCT (the t wakes up in ouverte: "oo-VEHR" vs "oo-VEHRT") — no
 *      homophoneKey on either.
 *
 *   4. SPEECH SAFETY — no `speaking` target anywhere in this module contains
 *      "fermé" or "fermée": the homophone is drilled exclusively through
 *      `build()` tile banks (visual, read-not-heard, both forms offered
 *      together on purpose — grammarHelpers.ts's own header note: "WRITTEN
 *      steps may — should — drill exactly these pairs") and through
 *      `cloze()` contrasted against "ouvert"/"ouverte" (never against each
 *      other, since `cloze()` always sets `audioText` and offering both
 *      homophone spellings in an EAR-answered step would be unanswerable by
 *      sound). ouvert/ouverte, being non-homophonous, are freely spoken.
 *
 *   5. L3's speaking target was revised during design from an earlier draft
 *      ("je voudrais une crêpe, s'il te plaît") to "je voudrais une soupe":
 *      the draft differed from L2's "je voudrais une baguette, s'il te
 *      plaît" by exactly one token (the noun), a textbook short-token
 *      minimal-pair risk under `frSpeechMinimalPairs.test.ts`'s classifier.
 *      The revised target has a different shape/length entirely.
 *
 *   6. REASONING MOMENT — ouvert/ouverte's agreement is never asserted, it's
 *      deduced: L5 opens by naming the exact pattern the learner already
 *      owns from m9 (grand/grande — "the d wakes up") and points out
 *      ouvert/ouverte is the identical trick with a t. No new grammar rule,
 *      just the productive generalization of one already taught.
 *
 *   7. AGREEMENT ANCHORS — «le café» (m, m1) and «l'école» (f, m4) are the
 *      two gendered nouns carrying ouvert/ouverte and fermé/fermée through
 *      the module. Both are already-registered atoms; no new venue noun is
 *      introduced (the brief is explicit that this module is food/café
 *      round 2, not a new-places module).
 *
 *   8. CROSS-MODULE SAFETY — every reference to an m1–m23 atom in this
 *      module routes through the hand-built `crossModuleVocabMcq`/
 *      `crossModuleMatchPairs` bypass functions (copied shape-identical
 *      from m21/m22/m23), never through `vocabMcq`/`matchPairs`/
 *      `withArticle`, because `placementBank.ts` still runs one
 *      unbucketed `import.meta.glob` and the discipline established since
 *      m11 is to never depend on incidental glob-order safety. The ONLY
 *      native `vocabMcq()` calls in this module are the six new nouns'
 *      own first-intro image MCQs, drawing distractors from OTHER m24
 *      atoms only (same-module, registry-safe — `FR_M24_ATOMS` is declared
 *      before any `lessonN()` body runs).
 *
 *   9. TIE-INS — L7 (integration) and L9 (integration) recombine m21's
 *      price frame ("ça coûte" / "X euros") and m23's hour-telling
 *      ("à N heures") with this module's open/closed state, per the
 *      brief's explicit ask ("tying m21 prices and m23 time-telling to
 *      café ordering"). Price/hour RECOMBINATION sentences are always
 *      authored via `build()`/`cloze()`, never `multiple_choice` —
 *      matching m12/m21/m23 precedent and `lintFullSentenceMcqs`
 *      (moduleBarGuards.ts). The few full-sentence MCQs that do appear
 *      (e.g. "il est quelle heure ?") are exact, previously-voiced m23
 *      idioms recalled verbatim — the same pattern m23's own L9/L10 use.
 *
 *   10. Consonant-onset — all six new nouns are naturally consonant-onset
 *       by spelling (jus, pomme, baguette, tarte, crêpe, soupe all start on
 *       a consonant letter); none needs a `consonantOnset` flag.
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   je voudrais un jus de pomme L1 · je voudrais une baguette, s'il te
 *   plaît L2 · je voudrais une soupe L3 · le café est ouvert L5 ·
 *   l'école est ouverte L5.
 *   recalls drawn: il y a un café L2+L8+L9 (m4) · j'aime le fromage L3
 *   (m6) · je voudrais une soupe L4 (this module, L3) · le café est
 *   ouvert L6 (this module, L5) · on va au cinéma à sept heures L7 (m23) ·
 *   elle est très grande L8 (m9) · c'est lundi L10 (m8).
 *   Total: 9 recall-cued speaking instances across 7 distinct recalled
 *   phrases (corrected — an earlier draft of this ledger undercounted by
 *   omitting the L3 «j'aime le fromage» and L4 «je voudrais une soupe»
 *   recalls, the same class of ledger slip m23's own header caught itself
 *   making), comfortably clearing the course-wide >=... floor for
 *   a food-round-2 module of this size (no course-wide numeric floor
 *   applies below m22; this module's own design keeps recall density in
 *   line with m6/m9's own ledgers).
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { atom, type FrAtom } from "../courseAtoms";
import type { PlacementItem } from "@/shared/language/types";
import type { FrModuleDef } from "./index";
import {
  infoStep,
  vocabMcq,
  sentenceMcq,
  build,
  cloze,
  speaking,
  listeningCompSentence,
  slotFor,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

/**
 * Hand-built MCQ, shape-identical to grammarHelpers' vocabTextMcq()/
 * crossModuleVocabMcq() precedent (m15/m21/m22/m23.ts), bypassing the atom
 * registry. Used for every gloss-driven vocab/sentence MCQ that references
 * an m1–m23 atom in this module.
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
 * bypassing the atom registry — same glob-ordering landmine m11/m14/m15/
 * m17-m23 route around. Used for EVERY match_pairs step in this module.
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

export const FR_M24_ATOMS: FrAtom[] = [
  atom({
    surface: "jus",
    meaningEn: "juice",
    partOfSpeech: "noun",
    fromModule: "m24",
    kind: "vocab",
    gender: "m",
    emoji: "🧃",
    hint: "zhoo — blue-m",
  }),
  atom({
    surface: "pomme",
    meaningEn: "apple",
    partOfSpeech: "noun",
    fromModule: "m24",
    kind: "vocab",
    gender: "f",
    emoji: "🍎",
    hint: "pum — pink-f",
  }),
  atom({
    surface: "baguette",
    meaningEn: "baguette (bread)",
    partOfSpeech: "noun",
    fromModule: "m24",
    kind: "vocab",
    gender: "f",
    emoji: "🥖",
    hint: "ba-GET — pink-f",
  }),
  atom({
    surface: "tarte",
    meaningEn: "pie / tart",
    partOfSpeech: "noun",
    fromModule: "m24",
    kind: "vocab",
    gender: "f",
    emoji: "🥧",
    hint: "tart — pink-f",
  }),
  atom({
    surface: "crêpe",
    meaningEn: "crêpe",
    partOfSpeech: "noun",
    fromModule: "m24",
    kind: "vocab",
    gender: "f",
    emoji: "🥞",
    hint: "krehp — pink-f",
  }),
  atom({
    surface: "soupe",
    meaningEn: "soup",
    partOfSpeech: "noun",
    fromModule: "m24",
    kind: "vocab",
    gender: "f",
    emoji: "🍲",
    hint: "soop — pink-f",
  }),
  atom({
    surface: "ouvert",
    meaningEn: "open (m-form)",
    partOfSpeech: "adjective",
    fromModule: "m24",
    kind: "vocab",
    hint: "oo-VEHR — the t sleeps",
  }),
  atom({
    surface: "ouverte",
    meaningEn: "open (f-form)",
    partOfSpeech: "adjective",
    fromModule: "m24",
    kind: "vocab",
    hint: "oo-VEHRT — the -e wakes the t, the grand/grande trick again",
  }),
  atom({
    surface: "fermé",
    meaningEn: "closed (m-form)",
    partOfSpeech: "adjective",
    fromModule: "m24",
    kind: "vocab",
    homophoneKey: "fɛʁme",
    hint: "fehr-MAY",
  }),
  atom({
    surface: "fermée",
    meaningEn: "closed (f-form)",
    partOfSpeech: "adjective",
    fromModule: "m24",
    kind: "vocab",
    homophoneKey: "fɛʁme",
    hint: "fehr-MAY — sounds IDENTICAL to fermé; the -e is silent here",
  }),
];

/** L1 — debut: jus, pomme. Central sentence: "je voudrais un jus de
 *  pomme" — two nouns glued by «de», no article on the second (the
 *  d'-elision gap is sidestepped: «pomme» is consonant-onset). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m24-1-info-jusdepomme",
      "Two nouns, one drink",
      "«jus de pomme» — apple juice (zhoo duh pum). «de» glues two nouns together and the second one drops its article: not «de la pomme», just «de pomme». You'll hear this shape again — it's how French stacks one noun onto another.",
      "grammar",
    ),
    vocabMcq(
      "fr-m24-1-img-jus",
      { surface: "jus", meaningEn: "the juice", emoji: "🧃" },
      [
        { surface: "pomme", emoji: "🍎" },
        { surface: "baguette", emoji: "🥖" },
        { surface: "tarte", emoji: "🥧" },
      ],
    ),
    {
      id: "fr-m24-1-map-jusdepomme",
      type: "word_map",
      tokens: ["je voudrais", "un", "jus", "de", "pomme"],
      pairs: [
        { en: "I would like", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "juice", tokenIndex: 2 },
        { en: "of", tokenIndex: 3 },
        { en: "apple", tokenIndex: 4 },
      ],
      audioText: "je voudrais un jus de pomme",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote: "«jus» is blue-m — «un jus de pomme», not «une».",
    },
    speaking("fr-m24-1-speak-jusdepomme", "je voudrais un jus de pomme", "I would like an apple juice", []),
    vocabMcq(
      "fr-m24-1-img-pomme",
      { surface: "pomme", meaningEn: "the apple", emoji: "🍎" },
      [
        { surface: "jus", emoji: "🧃" },
        { surface: "baguette", emoji: "🥖" },
        { surface: "tarte", emoji: "🥧" },
      ],
    ),
    crossModuleVocabMcq("fr-m24-1-mcq-cafe", "coffee", "le café", ["le thé", "le chocolat", "la pizza"]),
    cloze(
      "fr-m24-1-cloze-pomme",
      "je voudrais un jus de",
      ".",
      "pomme",
      ["pomme", "café"],
      "I would like an apple juice",
      "je voudrais un jus de pomme.",
    ),
    build(
      "fr-m24-1-build-jusdepomme",
      "Build: 'I would like an apple juice'",
      "je voudrais un jus de pomme",
      ["je voudrais", "un jus", "de pomme", "un café"],
      ["je voudrais", "un jus", "de pomme"],
      ["jus", "pomme"],
    ),
    listeningCompSentence({
      id: "fr-m24-1-lc-jusdepomme",
      audioText: "un jus de pomme",
      correctMeaningEn: "An apple juice.",
      distractorsEn: ["A coffee.", "An apple.", "Some apples."],
    }),
    crossModuleVocabMcq("fr-m24-1-mcq-the", "tea", "le thé", ["le chocolat", "le jus de pomme", "la glace"]),
    crossModuleMatchPairs("fr-m24-1", [
      ["jus", "juice"],
      ["pomme", "apple"],
      ["jus de pomme", "apple juice"],
      ["café", "coffee"],
      ["croissant", "croissant"],
      ["thé", "tea"],
    ]),
  ];
}

/** L2 — debut: baguette, tarte. Central sentence recalls m6's friend-
 *  register «s'il te plaît». */
function lesson2(): LessonStep[] {
  return [
    vocabMcq(
      "fr-m24-2-img-baguette",
      { surface: "baguette", meaningEn: "the baguette", emoji: "🥖" },
      [
        { surface: "tarte", emoji: "🥧" },
        { surface: "crêpe", emoji: "🥞" },
        { surface: "soupe", emoji: "🍲" },
      ],
    ),
    {
      id: "fr-m24-2-map-baguette",
      type: "word_map",
      tokens: ["je voudrais", "une", "baguette"],
      pairs: [
        { en: "I would like", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "baguette", tokenIndex: 2 },
      ],
      audioText: "je voudrais une baguette",
      tokenGenders: { 1: "f", 2: "f" },
      revealNote: "«baguette» is pink-f — «une baguette».",
    },
    speaking(
      "fr-m24-2-speak-baguette",
      "je voudrais une baguette, s'il te plaît",
      "I would like a baguette, please (to a friend)",
      [],
    ),
    crossModuleVocabMcq("fr-m24-2-mcq-svp-friend", "please (to a friend)", "s'il te plaît", [
      "s'il vous plaît",
      "encore",
      "je voudrais",
    ]),
    vocabMcq(
      "fr-m24-2-img-tarte",
      { surface: "tarte", meaningEn: "the pie", emoji: "🥧" },
      [
        { surface: "baguette", emoji: "🥖" },
        { surface: "crêpe", emoji: "🥞" },
        { surface: "soupe", emoji: "🍲" },
      ],
    ),
    cloze(
      "fr-m24-2-cloze-tarte",
      "je voudrais une",
      ".",
      "tarte",
      ["tarte", "baguette"],
      "I would like a pie",
      "je voudrais une tarte.",
    ),
    build(
      "fr-m24-2-build-tarte",
      "Build: 'I would like a pie'",
      "je voudrais une tarte",
      ["je voudrais", "une", "tarte", "un"],
      ["je voudrais", "une", "tarte"],
      ["tarte"],
    ),
    crossModuleVocabMcq("fr-m24-2-mcq-croissant", "the croissant", "le croissant", ["la salade", "le gâteau", "le sandwich"]),
    listeningCompSentence({
      id: "fr-m24-2-lc-tarte",
      audioText: "je voudrais une tarte",
      correctMeaningEn: "I would like a pie.",
      distractorsEn: ["I would like a baguette.", "I like pie.", "I would like a crêpe."],
    }),
    {
      id: "fr-m24-2-hear-sandwich",
      type: "word_image_mcq",
      meaningEn: "le sandwich",
      options: [
        { id: "correct", word: "le sandwich", emoji: "🥪" },
        { id: "o1", word: "la baguette", emoji: "🥖" },
        { id: "o2", word: "la tarte", emoji: "🥧" },
      ],
      correctOptionId: "correct",
    },
    speaking("fr-m24-2-speak-ilya-recall", "il y a un café", "there's a café", [], "recall"),
    crossModuleMatchPairs("fr-m24-2", [
      ["baguette", "baguette (bread)"],
      ["tarte", "pie / tart"],
      ["sandwich", "sandwich"],
      ["croissant", "croissant"],
      ["salade", "salad"],
      ["s'il te plaît", "please (to a friend)"],
    ]),
  ];
}

/** L3 — debut: crêpe, soupe. Central speaking target is "je voudrais une
 *  soupe" — deliberately reshaped from an earlier draft ("je voudrais une
 *  crêpe, s'il te plaît") to avoid a one-token collision with L2's target
 *  (decision 5). */
function lesson3(): LessonStep[] {
  return [
    vocabMcq(
      "fr-m24-3-img-crepe",
      { surface: "crêpe", meaningEn: "the crêpe", emoji: "🥞" },
      [
        { surface: "baguette", emoji: "🥖" },
        { surface: "tarte", emoji: "🥧" },
        { surface: "soupe", emoji: "🍲" },
      ],
    ),
    {
      id: "fr-m24-3-map-crepe",
      type: "word_map",
      tokens: ["je voudrais", "une", "crêpe"],
      pairs: [
        { en: "I would like", tokenIndex: 0 },
        { en: "a", tokenIndex: 1 },
        { en: "crêpe", tokenIndex: 2 },
      ],
      audioText: "je voudrais une crêpe",
      tokenGenders: { 1: "f", 2: "f" },
    },
    crossModuleVocabMcq("fr-m24-3-mcq-salade", "the salad", "la salade", ["le gâteau", "le fromage", "le sandwich"]),
    vocabMcq(
      "fr-m24-3-img-soupe",
      { surface: "soupe", meaningEn: "the soup", emoji: "🍲" },
      [
        { surface: "crêpe", emoji: "🥞" },
        { surface: "baguette", emoji: "🥖" },
        { surface: "tarte", emoji: "🥧" },
      ],
    ),
    speaking("fr-m24-3-speak-soupe", "je voudrais une soupe", "I would like a soup", []),
    cloze(
      "fr-m24-3-cloze-crepe",
      "je voudrais une",
      ".",
      "crêpe",
      ["crêpe", "soupe"],
      "I would like a crêpe",
      "je voudrais une crêpe.",
    ),
    build(
      "fr-m24-3-build-soupe",
      "Build: 'I would like a soup'",
      "je voudrais une soupe",
      ["je voudrais", "une", "soupe", "un"],
      ["je voudrais", "une", "soupe"],
      ["soupe"],
    ),
    crossModuleVocabMcq("fr-m24-3-mcq-fromage", "the cheese", "le fromage", ["la tarte", "la crêpe", "le jus"]),
    listeningCompSentence({
      id: "fr-m24-3-lc-crepe",
      audioText: "je voudrais une crêpe",
      correctMeaningEn: "I would like a crêpe.",
      distractorsEn: ["I would like a soup.", "I like crêpes.", "I would like a pie."],
    }),
    speaking("fr-m24-3-speak-fromage-recall", "j'aime le fromage", "I like cheese", [], "recall"),
    crossModuleVocabMcq("fr-m24-3-mcq-septheures", "seven o'clock", "sept heures", ["huit heures", "neuf heures", "six heures"]),
    crossModuleMatchPairs("fr-m24-3", [
      ["crêpe", "crêpe"],
      ["soupe", "soup"],
      ["salade", "salad"],
      ["fromage", "cheese"],
      ["baguette", "baguette (bread)"],
      ["tarte", "pie / tart"],
    ]),
  ];
}

/** L4 — review, no new atoms: all six new food nouns recombine before the
 *  module turns to open/closed. */
function lesson4(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m24-4-mcq-jusdepomme", "apple juice", "jus de pomme", ["baguette", "tarte", "soupe"]),
    build(
      "fr-m24-4-build-baguette",
      "Build: 'I would like a baguette'",
      "je voudrais une baguette",
      ["je voudrais", "une baguette", "une tarte", "un jus de pomme"],
      ["je voudrais", "une baguette"],
      ["baguette"],
    ),
    cloze(
      "fr-m24-4-cloze-crepe",
      "je voudrais une",
      ", s'il te plaît.",
      "crêpe",
      ["crêpe", "soupe"],
      "I would like a crêpe, please",
      "je voudrais une crêpe, s'il te plaît.",
    ),
    crossModuleVocabMcq("fr-m24-4-mcq-soupe", "soup", "une soupe", ["une tarte", "un jus", "une crêpe"]),
    listeningCompSentence({
      id: "fr-m24-4-lc-crepesoupe",
      audioText: "je voudrais une crêpe et une soupe",
      correctMeaningEn: "I would like a crêpe and a soup.",
      distractorsEn: ["I would like a pie and a baguette.", "I like crêpes and soup.", "I would like a soup."],
    }),
    speaking("fr-m24-4-speak-soupe-recall", "je voudrais une soupe", "I would like a soup", [], "recall"),
    crossModuleVocabMcq("fr-m24-4-mcq-tarte", "the pie / tart", "une tarte", ["une baguette", "une crêpe", "un jus"]),
    build(
      "fr-m24-4-build-jusdepommebaguette",
      "Build: 'I would like an apple juice and a baguette'",
      "je voudrais un jus de pomme et une baguette",
      ["je voudrais", "un jus de pomme", "et", "une baguette", "une tarte"],
      ["je voudrais", "un jus de pomme", "et", "une baguette"],
      ["jus", "pomme", "baguette"],
    ),
    cloze(
      "fr-m24-4-cloze-unetarte",
      "je voudrais",
      "tarte.",
      "une",
      ["une", "un"],
      "I would like a pie",
      "je voudrais une tarte.",
    ),
    crossModuleMatchPairs("fr-m24-4", [
      ["jus", "juice"],
      ["pomme", "apple"],
      ["baguette", "baguette (bread)"],
      ["tarte", "pie / tart"],
      ["crêpe", "crêpe"],
      ["soupe", "soup"],
    ]),
  ];
}

/** L5 — debut: ouvert, ouverte. The reasoning moment: this is the
 *  grand/grande trick (m9) again, with a t instead of a d (decision 6). */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m24-5-info-ouvert",
      "The same trick, a new letter",
      "«grand» → «grande» — the d wakes up (m9). «ouvert» works the exact same way: «ouvert» (oo-VEHR, t asleep) → «ouverte» (oo-VEHRT, t awake). Same rule, different sleeping letter.",
      "grammar",
    ),
    {
      id: "fr-m24-5-map-cafeouvert",
      type: "word_map",
      tokens: ["le café", "est", "ouvert"],
      pairs: [
        { en: "the café", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "open", tokenIndex: 2 },
      ],
      audioText: "le café est ouvert",
      tokenGenders: { 0: "m", 2: "m" },
    },
    speaking("fr-m24-5-speak-cafeouvert", "le café est ouvert", "the café is open", []),
    crossModuleVocabMcq("fr-m24-5-mcq-ecole", "the school", "l'école", ["le musée", "la gare", "l'hôtel"]),
    {
      id: "fr-m24-5-map-ecoleouverte",
      type: "word_map",
      tokens: ["l'école", "est", "ouverte"],
      pairs: [
        { en: "the school", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "open", tokenIndex: 2 },
      ],
      audioText: "l'école est ouverte",
      tokenGenders: { 0: "f", 2: "f" },
      revealNote: "«école» is pink-f, so «ouverte» wears the -e.",
    },
    cloze(
      "fr-m24-5-cloze-ouverte",
      "l'école est",
      ".",
      "ouverte",
      ["ouverte", "ouvert"],
      "the school is open",
      "l'école est ouverte.",
    ),
    build(
      "fr-m24-5-build-cafeouvert",
      "Build: 'the café is open'",
      "le café est ouvert",
      ["le café", "est", "ouvert", "ouverte"],
      ["le café", "est", "ouvert"],
      ["ouvert"],
    ),
    listeningCompSentence({
      id: "fr-m24-5-lc-ecoleouverte",
      audioText: "l'école est ouverte",
      correctMeaningEn: "The school is open.",
      distractorsEn: ["The school is closed.", "The café is open.", "The museum is big."],
    }),
    speaking("fr-m24-5-speak-ecoleouverte", "l'école est ouverte", "the school is open", []),
    crossModuleVocabMcq("fr-m24-5-mcq-musee", "the museum", "le musée", ["la gare", "l'hôtel", "le parc"]),
    crossModuleMatchPairs("fr-m24-5", [
      ["ouvert", "open (m-form)"],
      ["ouverte", "open (f-form)"],
      ["café", "coffee / café"],
      ["école", "school"],
      ["musée", "museum"],
      ["grand", "big / tall (m-form)"],
    ]),
  ];
}

/** L6 — debut: fermé, fermée. Zero `speaking` targets in this lesson
 *  contain either word (decision 4): the homophone is drilled by `build()`
 *  tile banks and by `cloze()` contrasted against ouvert/ouverte. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m24-6-map-cafeferme",
      type: "word_map",
      tokens: ["le café", "est", "fermé"],
      pairs: [
        { en: "the café", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "closed", tokenIndex: 2 },
      ],
      audioText: "le café est fermé",
      tokenGenders: { 0: "m", 2: "m" },
    },
    build(
      "fr-m24-6-build-cafeferme",
      "Build: 'the café is closed'",
      "le café est fermé",
      ["le café", "est", "fermé", "fermée"],
      ["le café", "est", "fermé"],
      ["fermé"],
    ),
    crossModuleVocabMcq("fr-m24-6-mcq-pascher", "not expensive", "ce n'est pas cher", ["c'est cher", "ça coûte", "c'est ouvert"]),
    {
      id: "fr-m24-6-map-ecoleferme",
      type: "word_map",
      tokens: ["l'école", "est", "fermée"],
      pairs: [
        { en: "the school", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "closed", tokenIndex: 2 },
      ],
      audioText: "l'école est fermée",
      tokenGenders: { 0: "f", 2: "f" },
    },
    cloze(
      "fr-m24-6-cloze-ferme",
      "le café est",
      ".",
      "fermé",
      ["fermé", "ouvert"],
      "the café is closed",
      "le café est fermé.",
    ),
    build(
      "fr-m24-6-build-ecoleferme",
      "Build: 'the school is closed'",
      "l'école est fermée",
      ["l'école", "est", "fermée", "fermé"],
      ["l'école", "est", "fermée"],
      ["fermée"],
    ),
    listeningCompSentence({
      id: "fr-m24-6-lc-ecoleferme",
      audioText: "l'école est fermée",
      correctMeaningEn: "The school is closed.",
      distractorsEn: ["The school is open.", "The café is closed.", "The museum is small."],
    }),
    crossModuleVocabMcq("fr-m24-6-mcq-coute", "it costs", "ça coûte", ["c'est cher", "il y a", "je voudrais"]),
    speaking("fr-m24-6-speak-cafeouvert-recall", "le café est ouvert", "the café is open", [], "recall"),
    cloze(
      "fr-m24-6-cloze-pasferme",
      "ce n'est pas",
      ".",
      "fermé",
      ["fermé", "ouvert"],
      "it's not closed",
      "ce n'est pas fermé.",
    ),
    crossModuleMatchPairs("fr-m24-6", [
      ["fermé", "closed (m-form)"],
      ["fermée", "closed (f-form)"],
      ["ouvert", "open (m-form)"],
      ["ouverte", "open (f-form)"],
      ["ça coûte", "it costs"],
      ["cher", "expensive"],
    ]),
  ];
}

/** L7 — integration: this module's open/closed meets m21's prices and
 *  m23's hours (decision 9). */
function lesson7(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m24-7-mcq-quelleheure", "at seven o'clock", "à sept heures", [
      "à huit heures",
      "à neuf heures",
      "à dix heures",
    ]),
    build(
      "fr-m24-7-build-ouvertsept",
      "Build: 'it's open at seven o'clock'",
      "c'est ouvert à sept heures",
      ["c'est ouvert", "à sept heures", "c'est fermé", "à huit heures"],
      ["c'est ouvert", "à sept heures"],
      ["ouvert"],
    ),
    cloze(
      "fr-m24-7-cloze-tartecoute",
      "la tarte, ça",
      "trois euros.",
      "coûte",
      ["coûte", "est"],
      "the pie costs three euros",
      "la tarte, ça coûte trois euros.",
    ),
    crossModuleVocabMcq("fr-m24-7-mcq-troiseuros", "three euros", "trois euros", ["deux euros", "quatre euros", "cent euros"]),
    build(
      "fr-m24-7-build-fermedix",
      "Build: 'the café is closed at ten o'clock'",
      "le café est fermé à dix heures",
      ["le café est fermé", "à dix heures", "le café est ouvert", "à neuf heures"],
      ["le café est fermé", "à dix heures"],
      ["fermé"],
    ),
    listeningCompSentence({
      id: "fr-m24-7-lc-baguettecoute",
      audioText: "la baguette, ça coûte deux euros",
      correctMeaningEn: "The baguette costs two euros.",
      distractorsEn: ["The baguette costs three euros.", "The tarte costs two euros.", "The baguette is expensive."],
    }),
    speaking(
      "fr-m24-7-speak-cinemasept-recall",
      "on va au cinéma à sept heures",
      "we're going to the movies at seven o'clock",
      [],
      "recall",
    ),
    crossModuleVocabMcq("fr-m24-7-mcq-onva", "we're going", "on va", ["il y a", "c'est", "je voudrais"]),
    build(
      "fr-m24-7-build-museeferme",
      "Build: 'the museum is closed'",
      "le musée est fermé",
      ["le musée", "est", "fermé", "fermée"],
      ["le musée", "est", "fermé"],
      ["fermé"],
    ),
    crossModuleMatchPairs("fr-m24-7", [
      ["ouvert", "open (m-form)"],
      ["fermé", "closed (m-form)"],
      ["coûte", "costs"],
      ["euros", "euros"],
      ["heures", "hours / o'clock"],
      ["on va", "we're going"],
    ]),
  ];
}

/** L8 — checkpoint: zero new atoms, all graded, reviews the whole module
 *  plus the m21/m23 tie-ins. */
function lesson8(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m24-8-mcq-jusdepomme", "apple juice", "jus de pomme", ["baguette", "tarte", "crêpe"]),
    build(
      "fr-m24-8-build-baguette",
      "Build: 'I would like a baguette'",
      "je voudrais une baguette",
      ["je voudrais", "une baguette", "une tarte", "un jus"],
      ["je voudrais", "une baguette"],
      ["baguette"],
    ),
    cloze(
      "fr-m24-8-cloze-crepe",
      "je voudrais une",
      ".",
      "crêpe",
      ["crêpe", "soupe"],
      "I would like a crêpe",
      "je voudrais une crêpe.",
    ),
    crossModuleVocabMcq("fr-m24-8-mcq-tarte", "the pie / tart", "une tarte", ["un jus", "une crêpe", "une baguette"]),
    speaking("fr-m24-8-speak-ilya-recall", "il y a un café", "there's a café", [], "recall"),
    listeningCompSentence({
      id: "fr-m24-8-lc-soupe",
      audioText: "je voudrais une soupe",
      correctMeaningEn: "I would like a soup.",
      distractorsEn: ["I would like a crêpe.", "I like soup.", "I would like a pie."],
    }),
    build(
      "fr-m24-8-build-cafeouvert",
      "Build: 'the café is open'",
      "le café est ouvert",
      ["le café", "est", "ouvert", "ouverte"],
      ["le café", "est", "ouvert"],
      ["ouvert"],
    ),
    cloze(
      "fr-m24-8-cloze-ecoleouverte",
      "l'école est",
      ".",
      "ouverte",
      ["ouverte", "ouvert"],
      "the school is open",
      "l'école est ouverte.",
    ),
    crossModuleVocabMcq("fr-m24-8-mcq-fermeadj", "closed (m-form)", "fermé", ["ouvert", "grand", "petit"]),
    build(
      "fr-m24-8-build-museeferme",
      "Build: 'the museum is closed'",
      "le musée est fermé",
      ["le musée", "est", "fermé", "fermée"],
      ["le musée", "est", "fermé"],
      ["fermé"],
    ),
    speaking("fr-m24-8-speak-grande-recall", "elle est très grande", "she is very tall", [], "recall"),
    listeningCompSentence({
      id: "fr-m24-8-lc-cafefermedix",
      audioText: "le café est fermé à dix heures",
      correctMeaningEn: "The café is closed at ten o'clock.",
      distractorsEn: [
        "The café is open at ten o'clock.",
        "The school is closed at ten o'clock.",
        "The café is closed at nine o'clock.",
      ],
    }),
    cloze(
      "fr-m24-8-cloze-tartecoute",
      "la tarte, ça",
      "trois euros.",
      "coûte",
      ["coûte", "est"],
      "the pie costs three euros",
      "la tarte, ça coûte trois euros.",
    ),
    crossModuleMatchPairs("fr-m24-8", [
      ["jus", "juice"],
      ["pomme", "apple"],
      ["baguette", "baguette (bread)"],
      ["tarte", "pie / tart"],
      ["crêpe", "crêpe"],
      ["soupe", "soup"],
      ["ouvert", "open (m-form)"],
      ["fermé", "closed (m-form)"],
    ]),
  ];
}

/** L9 — integration, first dialogue_sim: recombines café ordering with
 *  the open/closed state and the m21/m23 tie-ins (decision 9). */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m24-9-map-ouvertsept",
      type: "word_map",
      tokens: ["c'est ouvert", "à sept heures"],
      pairs: [
        { en: "it's open", tokenIndex: 0 },
        { en: "at seven o'clock", tokenIndex: 1 },
      ],
      audioText: "c'est ouvert à sept heures",
    },
    crossModuleVocabMcq("fr-m24-9-mcq-ilya", "there is / there's", "il y a", ["c'est", "on va", "je voudrais"]),
    build(
      "fr-m24-9-build-baguettecoute",
      "Build: 'the baguette costs two euros'",
      "la baguette, ça coûte deux euros",
      ["la baguette, ça coûte", "deux euros", "trois euros", "la crêpe, ça coûte"],
      ["la baguette, ça coûte", "deux euros"],
      ["baguette"],
    ),
    cloze(
      "fr-m24-9-cloze-cafefermedix",
      "le café est",
      "à dix heures.",
      "fermé",
      ["fermé", "ouvert"],
      "the café is closed at ten o'clock",
      "le café est fermé à dix heures.",
    ),
    speaking("fr-m24-9-speak-ilya-recall", "il y a un café", "there's a café", [], "recall"),
    listeningCompSentence({
      id: "fr-m24-9-lc-ecoleouvertesept",
      audioText: "l'école est ouverte à sept heures",
      correctMeaningEn: "The school is open at seven o'clock.",
      distractorsEn: [
        "The school is closed at seven o'clock.",
        "The café is open at seven o'clock.",
        "The school is open at eight o'clock.",
      ],
    }),
    crossModuleVocabMcq("fr-m24-9-mcq-quelleheure", "at ten o'clock", "à dix heures", [
      "à sept heures",
      "à huit heures",
      "à neuf heures",
    ]),
    build(
      "fr-m24-9-build-tartesvp",
      "Build: 'I would like a pie, please (to a friend)'",
      "je voudrais une tarte, s'il te plaît",
      ["je voudrais une tarte", "s'il te plaît", "s'il vous plaît", "je voudrais une soupe"],
      ["je voudrais une tarte", "s'il te plaît"],
      ["tarte"],
    ),
    {
      id: "fr-m24-9-sim-cestouvert",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Au café avec Marie", setting: "The morning counter." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ouvert",
          npc: {
            speaker: "Marie",
            kana: "Le café, c'est ouvert ?",
            audioText: "le café, c'est ouvert ?",
            gloss: "Is the café open?",
          },
          goal: "Say yes, it's open.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, c'est ouvert" },
              { id: "wrong-gender", text: "oui, c'est ouverte" },
              { id: "wrong-word", text: "oui, c'est fermé" },
            ],
            correctOptionId: "correct",
            audioText: "oui, c'est ouvert",
          },
          replyGloss: "Yes, it's open.",
        },
        {
          id: "t2-order",
          npc: {
            speaker: "Marie",
            kana: "Vous désirez ?",
            audioText: "vous désirez ?",
            gloss: "What would you like? (the server's question)",
          },
          goal: "Order a baguette, please (to the server).",
          reply: {
            mode: "build",
            tiles: ["je voudrais", "une baguette", "s'il vous plaît", "s'il te plaît"],
            answer: "je voudrais une baguette s'il vous plaît",
            alsoAccepted: ["je voudrais une baguette"],
            audioText: "je voudrais une baguette s'il vous plaît",
          },
          replyGloss: "I would like a baguette, please.",
        },
        {
          id: "t3-ecole",
          npc: {
            speaker: "Marie",
            kana: "Et l'école, c'est fermé ?",
            audioText: "et l'école, c'est fermé ?",
            gloss: "And the school, is it closed?",
          },
          goal: "Say no, it's open.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, c'est ouvert" },
              { id: "wrong-gender", text: "non, c'est ouverte" },
              { id: "wrong-word", text: "non, c'est fermé" },
            ],
            correctOptionId: "correct",
            audioText: "non, c'est ouvert",
          },
          replyGloss: "No, it's open.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m24-9", [
      ["ouvert", "open (m-form)"],
      ["fermé", "closed (m-form)"],
      ["coûte", "costs"],
      ["heures", "hours / o'clock"],
      ["tarte", "pie / tart"],
      ["jus", "juice"],
    ]),
  ];
}

/** L10 — mastery: all graded, zero info cards, ends on a dialogue_sim
 *  that cashes in the module's own title question — "C'est ouvert ?" —
 *  now answered fluently, with price and time folded in. */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m24-10-smcq-cafeouvert",
      prompt: "'The «café» is open' — pick the French.",
      correctText: "le café est ouvert",
      distractorsText: ["le café est ouverte", "le café est fermé", "c'est le café ouvert"],
    }),
    build(
      "fr-m24-10-build-jusdepomme",
      "Build: 'I would like an apple juice'",
      "je voudrais un jus de pomme",
      ["je voudrais", "un jus", "de pomme", "une tarte"],
      ["je voudrais", "un jus", "de pomme"],
      ["jus", "pomme"],
    ),
    cloze(
      "fr-m24-10-cloze-museeferme",
      "le musée est",
      ".",
      "fermé",
      ["fermé", "fermée"],
      "the museum is closed",
      "le musée est fermé.",
    ),
    crossModuleVocabMcq("fr-m24-10-mcq-baguette", "the baguette", "une baguette", ["une tarte", "une crêpe", "un jus"]),
    speaking("fr-m24-10-speak-lundi-recall", "c'est lundi", "it's Monday", [], "recall"),
    listeningCompSentence({
      id: "fr-m24-10-lc-crepecoute",
      audioText: "la crêpe, ça coûte deux euros",
      correctMeaningEn: "The crêpe costs two euros.",
      distractorsEn: ["The crêpe costs three euros.", "The soup costs two euros.", "The crêpe is expensive."],
    }),
    sentenceMcq({
      id: "fr-m24-10-smcq-pasferme",
      prompt: "'It's not closed' — pick the French.",
      correctText: "ce n'est pas fermé",
      distractorsText: ["ce n'est pas fermée", "c'est fermé", "ce n'est pas ouvert"],
    }),
    build(
      "fr-m24-10-build-ecolefermedix",
      "Build: 'the school is closed at ten o'clock'",
      "l'école est fermée à dix heures",
      ["l'école est fermée", "à dix heures", "l'école est ouverte", "à neuf heures"],
      ["l'école est fermée", "à dix heures"],
      ["fermée"],
    ),
    crossModuleMatchPairs("fr-m24-10", [
      ["ouvert", "open (m-form)"],
      ["ouverte", "open (f-form)"],
      ["fermé", "closed (m-form)"],
      ["fermée", "closed (f-form)"],
      ["jus", "juice"],
      ["pomme", "apple"],
      ["baguette", "baguette (bread)"],
      ["tarte", "pie / tart"],
    ]),
    {
      id: "fr-m24-10-sim-cestouvert-finale",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Au café", setting: "The counter, one more time." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-ouvert",
          npc: {
            speaker: "Marie",
            kana: "C'est ouvert ?",
            audioText: "c'est ouvert ?",
            gloss: "Is it open? (the question this whole module has been building toward.)",
          },
          goal: "Say yes, it's open.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, c'est ouvert" },
              { id: "wrong-gender", text: "oui, c'est ouverte" },
              { id: "wrong-word", text: "non, c'est fermé" },
            ],
            correctOptionId: "correct",
            audioText: "oui, c'est ouvert",
          },
          replyGloss: "Yes, it's open.",
        },
        {
          id: "t2-order",
          npc: {
            speaker: "Marie",
            kana: "Je voudrais une baguette. Et vous ?",
            audioText: "je voudrais une baguette. et vous ?",
            gloss: "I'd like a baguette. And you?",
          },
          goal: "Order the crêpe and the soup.",
          reply: {
            mode: "build",
            tiles: ["je voudrais", "une crêpe", "et", "une soupe", "une baguette"],
            answer: "je voudrais une crêpe et une soupe",
            alsoAccepted: [],
            audioText: "je voudrais une crêpe et une soupe",
          },
          replyGloss: "I would like a crêpe and a soup.",
        },
        {
          id: "t3-couteferme",
          npc: {
            speaker: "Marie",
            kana: "La crêpe et la soupe, ça coûte cinq euros.",
            audioText: "la crêpe et la soupe, ça coûte cinq euros.",
            gloss: "The crêpe and the soup, that costs five euros.",
          },
          goal: "Say the café is closed at ten o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "le café est fermé à dix heures" },
              { id: "wrong-num", text: "le café est fermé à onze heures" },
              { id: "wrong-gender", text: "le café est fermée à dix heures" },
            ],
            correctOptionId: "correct",
            audioText: "le café est fermé à dix heures",
          },
          replyGloss: "The café is closed at ten o'clock.",
        },
      ],
    },
  ];
}

const FR_M24_1: LessonContent = {
  id: "fr-m24-1",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Un jus de pomme",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M24_2: LessonContent = {
  id: "fr-m24-2",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La baguette, la tarte",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M24_3: LessonContent = {
  id: "fr-m24-3",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La crêpe, la soupe",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M24_4: LessonContent = {
  id: "fr-m24-4",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Jus, baguette, tarte, crêpe, soupe",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M24_5: LessonContent = {
  id: "fr-m24-5",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le café est ouvert",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: lesson5(),
};

const FR_M24_6: LessonContent = {
  id: "fr-m24-6",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le café est fermé",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: lesson6(),
};

const FR_M24_7: LessonContent = {
  id: "fr-m24-7",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est ouvert à sept heures",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M24_8: LessonContent = {
  id: "fr-m24-8",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · C'est ouvert ?",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson8(),
};

const FR_M24_9: LessonContent = {
  id: "fr-m24-9",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Au café avec Marie",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: lesson9(),
};

const FR_M24_10: LessonContent = {
  id: "fr-m24-10",
  moduleId: "m24",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Oui, c'est ouvert",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson10(),
};

export const FR_M24_MODULE: FrModuleDef = {
  title: "C'est ouvert ?",
  eyebrow: "Module 24",
  summary:
    "Food, round two — «jus de pomme», «baguette», «tarte», «crêpe», «soupe» stack onto the café counter m6 opened. And the same trick that turned «grand» into «grande» (m9) turns «ouvert» into «ouverte»: the café, the school, open or closed, on the hour (m23), at a price (m21).",
  lessons: [
    FR_M24_1,
    FR_M24_2,
    FR_M24_3,
    FR_M24_4,
    FR_M24_5,
    FR_M24_6,
    FR_M24_7,
    FR_M24_8,
    FR_M24_9,
    FR_M24_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M24_CHECKPOINT_INDEX = 8;

export const FR_M24_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m24-s",
    moduleId: "m24",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m24-s",
        prompt: "'I would like an apple juice' — pick the French.",
        correctText: "je voudrais un jus de pomme",
        distractorsText: ["je voudrais une pomme", "je voudrais un jus", "j'aime le jus de pomme"],
      }),
  },
  {
    id: "pt-fr-m24-1",
    moduleId: "m24",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m24-1",
        prompt: "'The «café» is open' — pick the French.",
        correctText: "le café est ouvert",
        distractorsText: ["le café est ouverte", "le café est fermé", "c'est le café ouvert"],
      }),
  },
  {
    id: "pt-fr-m24-2",
    moduleId: "m24",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m24-2",
        prompt: "'The school is closed' — pick the French.",
        correctText: "l'école est fermée",
        distractorsText: ["l'école est fermé", "l'école est ouverte", "c'est l'école fermée"],
      }),
  },
  {
    id: "pt-fr-m24-3",
    moduleId: "m24",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m24-3",
        prompt: "'I would like a baguette, please' — pick the French.",
        correctText: "je voudrais une baguette, s'il te plaît",
        distractorsText: [
          "je voudrais un baguette, s'il te plaît",
          "je voudrais une baguette",
          "je voudrais une tarte, s'il te plaît",
        ],
      }),
  },
  {
    id: "pt-fr-m24-4",
    moduleId: "m24",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m24-4",
        prompt: "'The pie costs three euros' — pick the French.",
        correctText: "la tarte, ça coûte trois euros",
        distractorsText: [
          "la tarte, ça coûte deux euros",
          "la baguette, ça coûte trois euros",
          "la tarte coûte trois euros",
        ],
      }),
  },
];
