/**
 * m22.ts — «À qui ?» — possession-de consolidation and expansion.
 *
 * AUTHORED 2026-09-10 per docs/fr-m22-brief-2026-09-10.md, with the binding
 * course-wide speech-safety constraints referenced by that brief (name-swap
 * and negation-drop are both explicit minimal-pair risk classes) and the
 * m21-precedent bypass pattern for cross-module vocab (see below).
 *
 * SCOPE DECISIONS (recorded per the "never park a question" doctrine —
 * every UNVERIFIED brief item was checked against the live registries
 * before writing a single lesson step):
 *
 *   1. BRIEF CLAIM FOUND FALSE — possession-«de» is NOT a fresh debut.
 *      The brief's own thesis ("«De» already means «from» — now it means
 *      «whose»") frames this module as introducing possession-de for the
 *      first time. Verified false by direct grep: m3.ts (L2 and L7)
 *      ALREADY teaches "le livre de Léa" (word_map, cloze, build) and
 *      "c'est le chien de Hugo" / "c'est le chat de Léa" / "c'est le livre
 *      de Hugo" (word_map with the explicit revealNote "that's how French
 *      owns things, with the same «de» as «je suis de Paris»", plus a
 *      listening_comprehension glossing "c'est le chat de Léa" as "It's
 *      Léa's cat."). This is graded, taught content, not a passing mention.
 *      DECISION: m22 is authored as a genuine CONSOLIDATION/expansion
 *      module (which the brief's own §1a already leans toward), not a
 *      grammar debut. L1's card RECALLS the m2→m3 connection the learner
 *      already made, rather than presenting it as new. m3's own cast
 *      (Léa, and the vowel-onset Hugo) is not re-quoted verbatim as new
 *      content; m22 instead scales the SAME structure to the full
 *      consonant-onset roster, a new noun, adjectives riding along, and
 *      (genuinely new) negated-possession synthesis.
 *
 *   2. BRIEF CLAIM FOUND FALSE — frSpeechMinimalPairs.test.ts already
 *      carries m21. The brief (§0/§7/§9) instructs adding BOTH m21 and
 *      m22 to that gate's MODULES array at landing, asserting m21 is
 *      still missing. Verified false by direct read: m21 is already
 *      present (`{ id: "m21", lessons: FR_M21_MODULE.lessons }`, with a
 *      header note dated 2026-09-10 confirming it "was added at its
 *      review landing"). DECISION: only `m22` is added to that gate here.
 *
 *   3. UNVERIFIED ITEM RESOLVED — the brief flags L6's «de qui ?» ("whose?")
 *      bridge beat as needing verification that `qui` has a taught
 *      precedent. Verified: `qui` is FR_FUNCTION_WORDS chrome (relative
 *      pronoun forms only — "que qui quoi dont où"), and the ONLY place
 *      «c'est qui ?» appears anywhere in m1–m21 is as an UNUSED wrong
 *      dialogue_sim foil (m12, m17, m21 all use "c'est qui ?" as a
 *      rejected option, never the correct/graded reply, never introduced
 *      via an info card). Per the brief's own branching instruction ("if
 *      not [registered as taught content], drop the beat"): DROPPED.
 *      L6 is redesigned as a titled-in-English cast-discrimination
 *      consolidation lesson ("Whose is it? — mixed review") that reviews
 *      the SAME possession structure across the full cast without
 *      introducing any question-word frame. No new "qui" usage of any
 *      kind is authored anywhere in this module.
 *
 *   4. NEW ATOM — exactly one: «sac» (bag), consonant-onset, no elision
 *      risk. This is the brief's own load-bearing central example
 *      ("le sac de Marie" is the brief's title), genuinely absent from
 *      the registry (verified: no "sac"/"valise"/"clé"/"téléphone" atom
 *      exists m1–m21). Its emoji (🎒, U+1F392) is already vendored at
 *      src/pub/noto-emoji/svg/emoji_u1f392.svg — no new vendoring work.
 *      Ceiling was 2; this module uses 1.
 *
 *   5. CAST — the 9 confirmed consonant-onset FR_PROPER_NAMES entries:
 *      Marie, Thomas, Léa, Camille, Lucas, Chloé, Paul, Louis, Sam. The
 *      vowel-onset trio (Hugo, Emma, Inès) is NEVER used anywhere in this
 *      module (not narrowly "never after de" — excluded entirely, to keep
 *      the pin trivially satisfiable and avoid the d'-elision gap
 *      (`getFrRealFormLexicon()`'s clitic list omits "d") by construction.
 *
 *   6. SPEECH-SAFETY POLICY (stricter than the brief's own suggestion,
 *      chosen to make the course-wide census unconditionally safe): this
 *      module has EXACTLY ONE graded, non-recall `speaking` target in its
 *      entire run — "c'est le sac de Marie" (L1), the first-ever printed
 *      voicing of a full possession-de sentence combining the new noun.
 *      Every OTHER `speaking` step in m22 is `cue: "recall"`, reusing
 *      either that exact phrase or a verified pre-existing cross-module
 *      phrase (bonjour m1, je vais au cinéma m5, c'est lundi m8, il parle
 *      français m11, j'ai un chat / j'ai un frère m7, il y a un café m4,
 *      où est le musée ? m4, ça coûte deux cents euros m21 — all
 *      confirmed via grep as real, non-recall PRINTED speaking() calls in
 *      their originating module). No two possessor names, and no
 *      affirmative/negated pair, EVER both appear as `speaking` targets
 *      anywhere in this module — the swap and the negation contrast are
 *      drilled exclusively via build/cloze/multiple_choice, never
 *      speaking, closing off the two risk classes
 *      docs/fr-m22-brief-2026-09-10.md's §6 flags as HIGH RISK by
 *      construction rather than by post-hoc census fixing.
 *
 *   7. CROSS-MODULE VOCAB BYPASS — this module reaches back into m1, m3,
 *      m4, m5, m7, m8, m9, m11, m12, m13, m21 for recall material and
 *      review nouns. `matchPairs()`/`vocabTextMcq()`/`vocabMcq()` throw if
 *      a surface isn't resolvable in the live atom registry, and are
 *      unsafe here for the same `import.meta.glob` lexicographic-ordering
 *      reason m11/m14/m15/m17–m21 all route around (m2–m9 sort AFTER
 *      m10–m21, so their atoms are not guaranteed loaded when m22's own
 *      top-level lesson-building code runs). Every match_pairs step below
 *      uses the hand-built `crossModuleMatchPairs`; every cross-module MCQ
 *      uses the hand-built `crossModuleVocabMcq` — both verbatim-pattern
 *      copies of m21.ts's own helpers. `build`/`cloze`/`speaking`/
 *      `sentenceMcq`/`listeningCompSentence` are safe to use directly:
 *      their `exercisedAtomSurfaces` param resolves via `resolveAtomIds`,
 *      which silently omits unresolvable surfaces rather than throwing.
 *
 *   8. NEGATED POSSESSION IS GENUINELY NEW — unlike the base possession-de
 *      structure (already taught, decision 1), "ce n'est pas X" generalized
 *      beyond the single fixed phrase "ce n'est pas cher" (m12/m17/m21's
 *      only prior use) is verified NEW: grep across m1–m21 finds "ce n'est
 *      pas" paired with any complement other than "cher" nowhere. L5
 *      teaches this generalization — "ce n'est pas le sac de Marie, c'est
 *      le sac de Paul" — as the module's one real grammar beat. Every
 *      token in that sentence is independently taught or chrome (ce/n'est/
 *      pas/c'est are FR_FUNCTION_WORDS; le/sac/de/Marie/Paul are taught or
 *      proper-name-exempt), so it is provenance-safe by composition, but
 *      the GENERALIZATION itself (negation applying to any noun phrase,
 *      not just «cher») is the taught content, per a short one-line card.
 *
 *   9. INTERLEAVE — L2 (m7 pets/family), L3 (m8 days recall), L4 (m9
 *      adjectives + m11 recall), L5 (m4 places recall), L6 (m5 recall),
 *      L7 (heaviest: m1/m4/m8/m12/m21 recall mixed with counted
 *      possessions like "les cent euros de Paul") all carry a genuinely
 *      unrelated recall step per the interleave-don't-block-teach law.
 *
 *   10. L8's checkpoint transfer test uses "le livre de Sam" — verified,
 *       by construction while drafting, never co-presented as a pairing
 *       anywhere in L1–L7 (Sam appears with sac/chat/chien elsewhere;
 *       Sam+livre is new at the checkpoint).
 *
 * VOICING LEDGER (cued-recall-precedes-printed-voicing, R3/§13.9):
 *   - L1 "c'est le sac de Marie" — NEW, printed, graded (the module's ONLY
 *     non-recall speaking target).
 *   - L2 recalls m7's "j'ai un chat".
 *   - L3 recalls m8's "c'est lundi".
 *   - L4 recalls m11's "il parle français".
 *   - L5 recalls m4's "où est le musée ?".
 *   - L6 recalls m5's "je vais au cinéma".
 *   - L7 recalls m22 L1's own "c'est le sac de Marie".
 *   - L8 (checkpoint) recalls m22 L1's "c'est le sac de Marie" AND m1's
 *     "bonjour".
 *   - L9 recalls m4's "il y a un café".
 *   - L10 (mastery) recalls m21's "ça coûte deux cents euros".
 *   Total: 9 recalls, exceeding the course-wide >=8 floor.
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
  slotFor,
} from "../grammarHelpers";

const COURSE_ID = "mock-1";

/**
 * Hand-built MCQ, shape-identical to grammarHelpers' vocabTextMcq()/
 * crossModuleVocabMcq() precedent (m15.ts, m21.ts), bypassing the atom
 * registry. Used for every cross-module or sentence-level MCQ in this
 * module (decision 7).
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
 * bypassing the atom registry — same m2-m9 import.meta.glob ordering
 * landmine m11/m14/m15/m17-m21 route around. Used for EVERY match_pairs
 * step in this module.
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

export const FR_M22_ATOMS: FrAtom[] = [
  atom({
    surface: "sac",
    meaningEn: "bag",
    partOfSpeech: "noun",
    fromModule: "m22",
    kind: "vocab",
    gender: "m",
    emoji: "🎒",
    hint: "sak — unlike «chat», the c IS pronounced here",
  }),
];

/** L1 — bridge/recall: the m2->m3 "de" connection the learner already
 *  made, now scaled with a new noun and the first debut of the module's
 *  primary "de"-possessed noun sentence, «c'est le sac de Marie». This is
 *  the module's ONLY graded, non-recall `speaking` target (decision 6). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m22-1-info-bridge",
      "You already know this «de»",
      "«Je suis de Paris» (m2) — I'm FROM Paris. «Le livre de Léa» (m3) — Léa's book: the SAME «de», now owning instead of coming-from. New word riding along: «sac», bag. «C'est le sac de Marie.» — It's Marie's bag.",
    ),
    {
      id: "fr-m22-1-map-sacdemarie",
      type: "word_map",
      tokens: ["c'est", "le", "sac", "de", "Marie"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "bag", tokenIndex: 2 },
        { en: "-'s (belongs to)", tokenIndex: 3 },
        { en: "Marie", tokenIndex: 4 },
      ],
      audioText: "c'est le sac de Marie",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote: "Same «de» as «le livre de Léa» (m3) — now it's Marie's turn.",
    },
    crossModuleVocabMcq("fr-m22-1-mcq-sac", "bag", "le sac", [
      "le livre",
      "le chat",
      "le chien",
    ]),
    cloze(
      "fr-m22-1-cloze-de",
      "C'est le sac",
      "Marie.",
      "de",
      ["de", "au"],
      "it's Marie's bag",
      "c'est le sac de Marie",
      "«de» links the bag to its owner, same as «je suis de Paris».",
    ),
    build(
      "fr-m22-1-build-sacdethomas",
      "Build: 'it's Thomas's bag'",
      "c'est le sac de Thomas",
      ["c'est", "le sac de Thomas", "le sac de Marie", "le livre de Thomas"],
      ["c'est", "le sac de Thomas"],
      ["sac"],
    ),
    speaking(
      "fr-m22-1-speak-sacdemarie",
      "c'est le sac de Marie",
      "it's Marie's bag",
      ["sac"],
    ),
    listeningCompSentence({
      id: "fr-m22-1-lc-sacdelea",
      audioText: "c'est le sac de Léa",
      correctMeaningEn: "It's Léa's bag.",
      distractorsEn: ["It's Léa's book.", "It's a bag.", "Léa is here."],
    }),
    build(
      "fr-m22-1-build-livredecamille",
      "Build: 'it's Camille's book'",
      "c'est le livre de Camille",
      ["c'est", "le livre de Camille", "le sac de Camille", "le livre de Marie"],
      ["c'est", "le livre de Camille"],
    ),
    listeningCompSentence({
      id: "fr-m22-1-lc-whosebag",
      audioText: "c'est le sac de Marie",
      correctMeaningEn: "It's Marie's bag.",
      distractorsEn: ["It's Marie's book.", "It's Thomas's bag.", "It's a bag."],
    }),
    crossModuleMatchPairs("fr-m22-1", [
      ["sac", "bag"],
      ["livre", "book"],
      ["chat", "cat"],
      ["chien", "dog"],
      ["de", "of / -'s"],
      ["c'est", "it's"],
    ]),
  ];
}

/** L2 — extend to family/pets (m7): «le chat de Thomas», «le chien de
 *  Léa». Interleave break recalls m7's own "j'ai un chat" — unrelated to
 *  the "de"-possession structure. */
function lesson2(): LessonStep[] {
  return [
    {
      id: "fr-m22-2-map-chatdethomas",
      type: "word_map",
      tokens: ["c'est", "le", "chat", "de", "Thomas"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "cat", tokenIndex: 2 },
        { en: "-'s (belongs to)", tokenIndex: 3 },
        { en: "Thomas", tokenIndex: 4 },
      ],
      audioText: "c'est le chat de Thomas",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote: "Pets and people both work — the «de» never changes.",
    },
    build(
      "fr-m22-2-build-chiendelea",
      "Build: 'it's Léa's dog'",
      "c'est le chien de Léa",
      ["c'est", "le chien de Léa", "le chat de Léa", "le chien de Thomas"],
      ["c'est", "le chien de Léa"],
    ),
    cloze(
      "fr-m22-2-cloze-de",
      "C'est le chat",
      "Thomas.",
      "de",
      ["de", "au"],
      "it's Thomas's cat",
      "c'est le chat de Thomas",
    ),
    build(
      "fr-m22-2-build-frerechloe",
      "Build: 'it's Chloé's brother'",
      "c'est le frère de Chloé",
      ["c'est", "le frère de Chloé", "la sœur de Chloé", "le frère de Lucas"],
      ["c'est", "le frère de Chloé"],
    ),
    listeningCompSentence({
      id: "fr-m22-2-lc-chiendecamille",
      audioText: "c'est le chien de Camille",
      correctMeaningEn: "It's Camille's dog.",
      distractorsEn: ["It's Camille's cat.", "It's a dog.", "Camille has a dog."],
    }),
    speaking(
      "fr-m22-2-speak-jaiunchat-recall",
      "j'ai un chat",
      "I have a cat",
      [],
      "recall",
    ),
    build(
      "fr-m22-2-build-soeurdelucas",
      "Build: 'it's Lucas's sister'",
      "c'est la sœur de Lucas",
      ["c'est", "la sœur de Lucas", "le frère de Lucas", "la sœur de Thomas"],
      ["c'est", "la sœur de Lucas"],
    ),
    listeningCompSentence({
      id: "fr-m22-2-lc-chatthomas",
      audioText: "c'est le chat de Thomas",
      correctMeaningEn: "It's Thomas's cat.",
      distractorsEn: ["It's Thomas's dog.", "It's Léa's cat.", "It's my cat."],
    }),
    cloze(
      "fr-m22-2-cloze-cent-recall",
      "Ça coûte",
      "euros.",
      "cent",
      ["cent", "mille"],
      "it costs one hundred euros",
      "ça coûte cent euros",
      "quick number review, m12 — unrelated to «de».",
    ),
    crossModuleMatchPairs("fr-m22-2", [
      ["chat", "cat"],
      ["chien", "dog"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["sac", "bag"],
      ["livre", "book"],
    ]),
  ];
}

/** L3 — consolidation, NO new atoms: pure discrimination across the
 *  already-seen nouns and a wider cast slice. Interleave break recalls
 *  m8's "c'est lundi". */
function lesson3(): LessonStep[] {
  return [
    cloze(
      "fr-m22-3-cloze-sacdepaul",
      "C'est le sac",
      "Paul.",
      "de",
      ["de", "au"],
      "it's Paul's bag",
      "c'est le sac de Paul",
    ),
    build(
      "fr-m22-3-build-sacdelouis",
      "Build: 'it's Louis's bag'",
      "c'est le sac de Louis",
      ["c'est", "le sac de Louis", "le sac de Paul", "le livre de Louis"],
      ["c'est", "le sac de Louis"],
    ),
    listeningCompSentence({
      id: "fr-m22-3-lc-chatsam",
      audioText: "c'est le chat de Sam",
      correctMeaningEn: "It's Sam's cat.",
      distractorsEn: ["It's Sam's dog.", "It's Louis's cat.", "It's Paul's cat."],
    }),
    build(
      "fr-m22-3-build-soeurdecamille",
      "Build: 'it's Camille's sister'",
      "c'est la sœur de Camille",
      ["c'est", "la sœur de Camille", "le frère de Camille", "la sœur de Sam"],
      ["c'est", "la sœur de Camille"],
    ),
    cloze(
      "fr-m22-3-cloze-maisondechloe",
      "C'est la maison",
      "Chloé.",
      "de",
      ["de", "au"],
      "it's Chloé's house",
      "c'est la maison de Chloé",
    ),
    listeningCompSentence({
      id: "fr-m22-3-lc-livrepaul",
      audioText: "c'est le livre de Paul",
      correctMeaningEn: "It's Paul's book.",
      distractorsEn: ["It's Paul's bag.", "It's Louis's book.", "It's Chloé's book."],
    }),
    speaking(
      "fr-m22-3-speak-lundi-recall",
      "c'est lundi",
      "it's Monday",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m22-3-lc-chiendelouis",
      audioText: "c'est le chien de Louis",
      correctMeaningEn: "It's Louis's dog.",
      distractorsEn: ["It's Louis's cat.", "It's a dog.", "It's Paul's dog."],
    }),
    build(
      "fr-m22-3-build-chiendelouis",
      "Build: 'it's Louis's dog, not the cat'",
      "c'est le chien de Louis, pas le chat",
      [
        "c'est le chien de Louis",
        "pas le chat",
        "c'est le chat de Louis",
        "pas le chien",
      ],
      ["c'est le chien de Louis", "pas le chat"],
    ),
    crossModuleMatchPairs("fr-m22-3", [
      ["sac", "bag"],
      ["livre", "book"],
      ["maison", "house"],
      ["chat", "cat"],
      ["chien", "dog"],
      ["sœur", "sister"],
    ]),
  ];
}

/** L4 — adjectives ride along (m9): «le grand chat de Thomas», «la petite
 *  maison de Chloé». Full cast rotation continues. Interleave break
 *  recalls m11's "il parle français". */
function lesson4(): LessonStep[] {
  return [
    {
      id: "fr-m22-4-map-grandsacdelucas",
      type: "word_map",
      tokens: ["c'est", "le", "grand", "sac", "de", "Lucas"],
      pairs: [
        { en: "it's", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "big", tokenIndex: 2 },
        { en: "bag", tokenIndex: 3 },
        { en: "-'s (belongs to)", tokenIndex: 4 },
        { en: "Lucas", tokenIndex: 5 },
      ],
      audioText: "c'est le grand sac de Lucas",
      tokenGenders: { 1: "m", 3: "m" },
      revealNote: "«grand» slots in front of the noun — «de» still does the owning.",
    },
    cloze(
      "fr-m22-4-cloze-de",
      "C'est le grand chat",
      "Thomas.",
      "de",
      ["de", "au"],
      "it's Thomas's big cat",
      "c'est le grand chat de Thomas",
    ),
    build(
      "fr-m22-4-build-petitemaisondechloe",
      "Build: 'it's Chloé's little house'",
      "c'est la petite maison de Chloé",
      [
        "c'est",
        "la petite maison de Chloé",
        "la grande maison de Chloé",
        "la petite maison de Sam",
      ],
      ["c'est", "la petite maison de Chloé"],
    ),
    cloze(
      "fr-m22-4-cloze-grandchatthomas",
      "C'est le",
      "chat de Thomas.",
      "grand",
      ["grand", "grande"],
      "it's Thomas's big cat",
      "c'est le grand chat de Thomas",
      "«chat» is masculine, so «grand» stays as-is.",
    ),
    listeningCompSentence({
      id: "fr-m22-4-lc-petitchiensam",
      audioText: "c'est le petit chien de Sam",
      correctMeaningEn: "It's Sam's little dog.",
      distractorsEn: ["It's Sam's big dog.", "It's Sam's little cat.", "It's a little dog."],
    }),
    speaking(
      "fr-m22-4-speak-ilparle-recall",
      "il parle français",
      "he speaks French",
      [],
      "recall",
    ),
    build(
      "fr-m22-4-build-grandsacdepaul",
      "Build: 'it's Paul's big bag'",
      "c'est le grand sac de Paul",
      ["c'est", "le grand sac de Paul", "le petit sac de Paul", "le grand sac de Marie"],
      ["c'est", "le grand sac de Paul"],
    ),
    listeningCompSentence({
      id: "fr-m22-4-lc-grandemaisonlouis",
      audioText: "c'est la grande maison de Louis",
      correctMeaningEn: "It's Louis's big house.",
      distractorsEn: ["It's Louis's little house.", "It's Camille's big house.", "It's Louis's big bag."],
    }),
    cloze(
      "fr-m22-4-cloze-petitesoeurcamille",
      "C'est la petite sœur",
      "Camille.",
      "de",
      ["de", "au"],
      "it's Camille's little sister",
      "c'est la petite sœur de Camille",
    ),
    crossModuleMatchPairs("fr-m22-4", [
      ["grand", "big (m)"],
      ["grande", "big (f)"],
      ["petit", "small (m)"],
      ["petite", "small (f)"],
      ["sac", "bag"],
      ["maison", "house"],
    ]),
  ];
}

/** L5 — negated-possession SYNTHESIS, the module's one genuinely new
 *  grammar beat (decision 8): "ce n'est pas X" generalizes beyond the
 *  single fixed "ce n'est pas cher" (m12/m17/m21's only prior use).
 *  One-liner card, not a full bridge card. Interleave recalls m4's
 *  "où est le musée ?". */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m22-5-info-negation",
      "Say NOT mine",
      "Flip «c'est» to «ce n'est pas» — same shape as «ce n'est pas cher». «Ce n'est pas le sac de Marie, c'est le sac de Paul.»",
    ),
    {
      id: "fr-m22-5-map-cenestpas",
      type: "word_map",
      tokens: ["ce n'est pas", "le", "sac", "de", "Marie"],
      pairs: [
        { en: "it's not", tokenIndex: 0 },
        { en: "the", tokenIndex: 1 },
        { en: "bag", tokenIndex: 2 },
        { en: "-'s (belongs to)", tokenIndex: 3 },
        { en: "Marie", tokenIndex: 4 },
      ],
      audioText: "ce n'est pas le sac de Marie",
      tokenGenders: { 1: "m", 2: "m" },
      revealNote: "Same «ne...pas» you already know from «ce n'est pas cher».",
    },
    cloze(
      "fr-m22-5-cloze-cenestpas",
      "",
      "le sac de Marie, c'est le sac de Paul.",
      "ce n'est pas",
      ["ce n'est pas", "c'est", "je n'ai pas de"],
      "it's not Marie's bag, it's Paul's bag",
      "ce n'est pas le sac de Marie, c'est le sac de Paul",
      "«ce n'est pas» denies, then «c'est» gives the real owner.",
    ),
    build(
      "fr-m22-5-build-correction",
      "Build: 'it's not Thomas's dog, it's Sam's dog'",
      "ce n'est pas le chien de Thomas, c'est le chien de Sam",
      [
        "ce n'est pas le chien de Thomas",
        "c'est le chien de Sam",
        "c'est le chien de Thomas",
        "ce n'est pas le chien de Sam",
      ],
      ["ce n'est pas le chien de Thomas", "c'est le chien de Sam"],
    ),
    cloze(
      "fr-m22-5-cloze-negationlivrelea",
      "",
      "le livre de Léa.",
      "ce n'est pas",
      ["ce n'est pas", "c'est"],
      "it's not Léa's book",
      "ce n'est pas le livre de Léa",
    ),
    listeningCompSentence({
      id: "fr-m22-5-lc-negation",
      audioText: "ce n'est pas la maison de Chloé",
      correctMeaningEn: "It's not Chloé's house.",
      distractorsEn: ["It's Chloé's house.", "It's not Chloé's cat.", "It's a house."],
    }),
    speaking(
      "fr-m22-5-speak-museerecall",
      "où est le musée ?",
      "where is the museum?",
      [],
      "recall",
    ),
    build(
      "fr-m22-5-build-correction2",
      "Build: 'it's not Camille's cat, it's Paul's cat'",
      "ce n'est pas le chat de Camille, c'est le chat de Paul",
      [
        "ce n'est pas le chat de Camille",
        "c'est le chat de Paul",
        "c'est le chat de Camille",
        "ce n'est pas le chat de Paul",
      ],
      ["ce n'est pas le chat de Camille", "c'est le chat de Paul"],
    ),
    listeningCompSentence({
      id: "fr-m22-5-lc-negation2",
      audioText: "ce n'est pas le sac de Lucas",
      correctMeaningEn: "It's not Lucas's bag.",
      distractorsEn: ["It's Lucas's bag.", "It's not Louis's bag.", "It's not Lucas's book."],
    }),
    crossModuleMatchPairs("fr-m22-5", [
      ["ce n'est pas", "it's not"],
      ["c'est", "it's"],
      ["sac", "bag"],
      ["chien", "dog"],
      ["chat", "cat"],
      ["maison", "house"],
    ]),
  ];
}

/** L6 — REDESIGNED per decision 3 (the brief's «de qui ?» debut is
 *  dropped; «c'est qui ?» is never registered as taught content anywhere
 *  in m1-m21). Cast-wide discrimination consolidation instead, titled in
 *  plain English ("Whose is it? — mixed review") to avoid implying "qui"
 *  is taught. Interleave recalls m5's "je vais au cinéma". */
function lesson6(): LessonStep[] {
  return [
    listeningCompSentence({
      id: "fr-m22-6-lc-chatmarie",
      audioText: "c'est le chat de Marie",
      correctMeaningEn: "It's Marie's cat.",
      distractorsEn: ["It's Marie's dog.", "It's Thomas's cat.", "It's my cat."],
    }),
    build(
      "fr-m22-6-build-livredethomas",
      "Build: 'it's Thomas's book'",
      "c'est le livre de Thomas",
      ["c'est", "le livre de Thomas", "le sac de Thomas", "le livre de Marie"],
      ["c'est", "le livre de Thomas"],
    ),
    cloze(
      "fr-m22-6-cloze-de",
      "C'est le frère",
      "Léa.",
      "de",
      ["de", "au"],
      "it's Léa's brother",
      "c'est le frère de Léa",
    ),
    build(
      "fr-m22-6-build-chiendecamille",
      "Build: 'it's Camille's dog'",
      "c'est le chien de Camille",
      ["c'est", "le chien de Camille", "le chat de Camille", "le chien de Lucas"],
      ["c'est", "le chien de Camille"],
    ),
    listeningCompSentence({
      id: "fr-m22-6-lc-sacdepaul",
      audioText: "c'est le sac de Paul",
      correctMeaningEn: "It's Paul's bag.",
      distractorsEn: ["It's Paul's book.", "It's a bag.", "It's Louis's bag."],
    }),
    speaking(
      "fr-m22-6-speak-cinema-recall",
      "je vais au cinéma",
      "I'm going to the movies",
      [],
      "recall",
    ),
    build(
      "fr-m22-6-build-grandmaisonlouis",
      "Build: 'it's Louis's big house'",
      "c'est la grande maison de Louis",
      [
        "c'est",
        "la grande maison de Louis",
        "la petite maison de Louis",
        "la grande maison de Sam",
      ],
      ["c'est", "la grande maison de Louis"],
    ),
    listeningCompSentence({
      id: "fr-m22-6-lc-negationchatsam",
      audioText: "ce n'est pas le chat de Sam",
      correctMeaningEn: "It's not Sam's cat.",
      distractorsEn: ["It's Sam's cat.", "It's not Sam's dog.", "It's not Chloé's cat."],
    }),
    cloze(
      "fr-m22-6-cloze-soeurchloe",
      "C'est la sœur",
      "Chloé.",
      "de",
      ["de", "au"],
      "it's Chloé's sister",
      "c'est la sœur de Chloé",
    ),
    crossModuleMatchPairs("fr-m22-6", [
      ["frère", "brother"],
      ["sœur", "sister"],
      ["sac", "bag"],
      ["livre", "book"],
      ["grand", "big (m)"],
      ["grande", "big (f)"],
    ]),
  ];
}

/** L7 — heaviest recall consolidation: numbers as counted possessions
 *  (m12/m17/m21), places (m4), days (m8). NO new atoms. */
function lesson7(): LessonStep[] {
  return [
    build(
      "fr-m22-7-build-centeurosdepaul",
      "Build: 'they're Paul's hundred euros'",
      "ce sont les cent euros de Paul",
      [
        "ce sont",
        "les cent euros de Paul",
        "les cents euros de Paul",
        "les cent euros de Louis",
      ],
      ["ce sont", "les cent euros de Paul"],
    ),
    cloze(
      "fr-m22-7-cloze-de",
      "C'est le sac",
      "Camille, pas le livre.",
      "de",
      ["de", "au"],
      "it's Camille's bag, not the book",
      "c'est le sac de Camille, pas le livre",
    ),
    build(
      "fr-m22-7-build-deuxcentseurosdethomas",
      "Build: 'they're Thomas's two hundred euros'",
      "ce sont les deux cents euros de Thomas",
      [
        "ce sont",
        "les deux cents euros de Thomas",
        "les deux cents euros de Lucas",
        "les cent euros de Thomas",
      ],
      ["ce sont", "les deux cents euros de Thomas"],
    ),
    listeningCompSentence({
      id: "fr-m22-7-lc-museedelavillle",
      audioText: "où est le musée de la ville ?",
      correctMeaningEn: "Where is the town's museum?",
      distractorsEn: ["Where is the town?", "Where is the museum?", "Where is Marie's museum?"],
    }),
    speaking(
      "fr-m22-7-speak-sacdemarie-recall",
      "c'est le sac de Marie",
      "it's Marie's bag",
      ["sac"],
      "recall",
    ),
    build(
      "fr-m22-7-build-chiendelucaslundi",
      "Build: 'Lucas's dog is here on Monday'",
      "le chien de Lucas est ici lundi",
      [
        "le chien de Lucas",
        "est ici lundi",
        "est ici mardi",
        "le chien de Sam",
      ],
      ["le chien de Lucas", "est ici lundi"],
    ),
    listeningCompSentence({
      id: "fr-m22-7-lc-livredechloe",
      audioText: "c'est le livre de Chloé",
      correctMeaningEn: "It's Chloé's book.",
      distractorsEn: ["It's Chloé's bag.", "It's Louis's book.", "It's Camille's book."],
    }),
    cloze(
      "fr-m22-7-cloze-mille-recall",
      "Ça coûte",
      "euros.",
      "mille",
      ["mille", "cent"],
      "it costs one thousand euros",
      "ça coûte mille euros",
      "quick m21 recall — unrelated to «de».",
    ),
    build(
      "fr-m22-7-build-maisondesam",
      "Build: 'it's not Sam's house, it's Marie's house'",
      "ce n'est pas la maison de Sam, c'est la maison de Marie",
      [
        "ce n'est pas la maison de Sam",
        "c'est la maison de Marie",
        "c'est la maison de Sam",
        "ce n'est pas la maison de Marie",
      ],
      ["ce n'est pas la maison de Sam", "c'est la maison de Marie"],
    ),
    crossModuleMatchPairs("fr-m22-7", [
      ["sac", "bag"],
      ["livre", "book"],
      ["maison", "house"],
      ["cent", "hundred"],
      ["mille", "thousand"],
      ["musée", "museum"],
    ]),
  ];
}

/** L8 — checkpoint. Zero new atoms, all graded. Transfer test: "le livre
 *  de Sam", a Name+noun pairing never co-presented earlier (decision 10). */
function checkpointLesson(): LessonStep[] {
  return [
    build(
      "fr-m22-8-build-transfer",
      "Build: 'it's Sam's book'",
      "c'est le livre de Sam",
      ["c'est", "le livre de Sam", "le sac de Sam", "le livre de Paul"],
      ["c'est", "le livre de Sam"],
    ),
    cloze(
      "fr-m22-8-cloze-de",
      "C'est le grand chien",
      "Louis.",
      "de",
      ["de", "au"],
      "it's Louis's big dog",
      "c'est le grand chien de Louis",
    ),
    listeningCompSentence({
      id: "fr-m22-8-lc-petitesoeurcamille",
      audioText: "c'est la petite sœur de Camille",
      correctMeaningEn: "It's Camille's little sister.",
      distractorsEn: ["It's Camille's big sister.", "It's Chloé's little sister.", "It's Camille's little brother."],
    }),
    speaking(
      "fr-m22-8-speak-sacdemarie-recall",
      "c'est le sac de Marie",
      "it's Marie's bag",
      ["sac"],
      "recall",
    ),
    build(
      "fr-m22-8-build-negation",
      "Build: 'it's not Louis's cat, it's Lucas's cat'",
      "ce n'est pas le chat de Louis, c'est le chat de Lucas",
      [
        "ce n'est pas le chat de Louis",
        "c'est le chat de Lucas",
        "c'est le chat de Louis",
        "ce n'est pas le chat de Lucas",
      ],
      ["ce n'est pas le chat de Louis", "c'est le chat de Lucas"],
    ),
    listeningCompSentence({
      id: "fr-m22-8-lc-maisondepaul",
      audioText: "c'est la grande maison de Paul",
      correctMeaningEn: "It's Paul's big house.",
      distractorsEn: ["It's Paul's little house.", "It's Marie's big house.", "It's a big house."],
    }),
    cloze(
      "fr-m22-8-cloze-centeuros",
      "Ce sont les cent euros",
      "Thomas.",
      "de",
      ["de", "au"],
      "they're Thomas's hundred euros",
      "ce sont les cent euros de Thomas",
    ),
    speaking(
      "fr-m22-8-speak-bonjour-recall",
      "bonjour",
      "hello",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m22-8-lc-negationchienchloe",
      audioText: "ce n'est pas le chien de Chloé",
      correctMeaningEn: "It's not Chloé's dog.",
      distractorsEn: ["It's Chloé's dog.", "It's not Chloé's cat.", "It's not Sam's dog."],
    }),
    build(
      "fr-m22-8-build-negation2",
      "Build: 'it's not Louis's bag, it's Thomas's bag'",
      "ce n'est pas le sac de Louis, c'est le sac de Thomas",
      [
        "ce n'est pas le sac de Louis",
        "c'est le sac de Thomas",
        "c'est le sac de Louis",
        "ce n'est pas le sac de Thomas",
      ],
      ["ce n'est pas le sac de Louis", "c'est le sac de Thomas"],
    ),
    cloze(
      "fr-m22-8-cloze-chiendelea",
      "C'est le chien",
      "Léa.",
      "de",
      ["de", "au"],
      "it's Léa's dog",
      "c'est le chien de Léa",
    ),
    crossModuleMatchPairs("fr-m22-8", [
      ["sac", "bag"],
      ["livre", "book"],
      ["chien", "dog"],
      ["chat", "cat"],
      ["sœur", "sister"],
      ["ce n'est pas", "it's not"],
    ]),
  ];
}

/** L9 — integration: lost-and-found reunion at Nadia's market stall (m12,
 *  m21's own NPC). >=10 steps, no info cards, one big dialogue_sim tail.
 *  2-3 cross-module recalls reaching m1 objects, m4 places, m7 family. */
function lesson9(): LessonStep[] {
  return [
    build(
      "fr-m22-9-build-sacdelouis",
      "Build: 'it's Louis's bag'",
      "c'est le sac de Louis",
      ["c'est", "le sac de Louis", "le livre de Louis", "le sac de Sam"],
      ["c'est", "le sac de Louis"],
    ),
    listeningCompSentence({
      id: "fr-m22-9-lc-livredemarie",
      audioText: "c'est le livre de Marie",
      correctMeaningEn: "It's Marie's book.",
      distractorsEn: ["It's Marie's bag.", "It's Léa's book.", "It's Thomas's book."],
    }),
    cloze(
      "fr-m22-9-cloze-de",
      "C'est le chat",
      "Camille, pas le chien.",
      "de",
      ["de", "au"],
      "it's Camille's cat, not the dog",
      "c'est le chat de Camille, pas le chien",
    ),
    speaking(
      "fr-m22-9-speak-cafe-recall",
      "il y a un café",
      "there's a café",
      [],
      "recall",
    ),
    build(
      "fr-m22-9-build-negation",
      "Build: 'it's not Paul's bag, it's Chloé's bag'",
      "ce n'est pas le sac de Paul, c'est le sac de Chloé",
      [
        "ce n'est pas le sac de Paul",
        "c'est le sac de Chloé",
        "c'est le sac de Paul",
        "ce n'est pas le sac de Chloé",
      ],
      ["ce n'est pas le sac de Paul", "c'est le sac de Chloé"],
    ),
    listeningCompSentence({
      id: "fr-m22-9-lc-frerelucas",
      audioText: "c'est le frère de Lucas",
      correctMeaningEn: "It's Lucas's brother.",
      distractorsEn: ["It's Lucas's sister.", "It's a brother.", "It's Sam's brother."],
    }),
    build(
      "fr-m22-9-build-grandsacthomas",
      "Build: 'it's Thomas's big bag'",
      "c'est le grand sac de Thomas",
      [
        "c'est",
        "le grand sac de Thomas",
        "le petit sac de Thomas",
        "le grand sac de Louis",
      ],
      ["c'est", "le grand sac de Thomas"],
    ),
    cloze(
      "fr-m22-9-cloze-maisondesam",
      "C'est la maison",
      "Sam.",
      "de",
      ["de", "au"],
      "it's Sam's house",
      "c'est la maison de Sam",
    ),
    crossModuleMatchPairs("fr-m22-9", [
      ["sac", "bag"],
      ["livre", "book"],
      ["chat", "cat"],
      ["chien", "dog"],
      ["frère", "brother"],
      ["c'est", "it's"],
    ]),
    {
      id: "fr-m22-9-sim-objetsperdus",
      type: "dialogue_sim",
      scene: { emoji: "🎒", title: "Lost and found" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-sac",
          npc: {
            speaker: "Nadia",
            kana: "Il y a un sac ici.",
            audioText: "il y a un sac ici.",
            gloss: "There's a bag here.",
          },
          goal: "Say it's Marie's bag.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "c'est le sac de Marie" },
              { id: "wrong-owner", text: "c'est le sac de Thomas" },
              { id: "wrong-item", text: "c'est le livre de Marie" },
            ],
            correctOptionId: "correct",
            audioText: "c'est le sac de Marie",
          },
          replyGloss: "It's Marie's bag.",
        },
        {
          id: "t2-livre",
          npc: {
            speaker: "Nadia",
            kana: "Et ce livre — c'est le livre de Marie ?",
            audioText: "et ce livre — c'est le livre de Marie ?",
            gloss: "And this book — is it Marie's book?",
          },
          goal: "Say no — it's Paul's book, not Marie's.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, ce n'est pas le livre de Marie, c'est le livre de Paul" },
              { id: "wrong-agree", text: "oui, c'est le livre de Marie" },
              { id: "wrong-item", text: "non, ce n'est pas le sac de Marie" },
            ],
            correctOptionId: "correct",
            audioText: "non, ce n'est pas le livre de Marie, c'est le livre de Paul",
          },
          replyGloss: "No, it's not Marie's book, it's Paul's book.",
        },
        {
          id: "t3-chien",
          npc: {
            speaker: "Nadia",
            kana: "Et ce chien, là-bas ?",
            audioText: "et ce chien, là-bas ?",
            gloss: "And this dog, over there?",
          },
          goal: "Say it's Camille's dog.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "c'est le chien de Camille" },
              { id: "wrong-owner", text: "c'est le chien de Sam" },
              { id: "wrong-item", text: "c'est le chat de Camille" },
            ],
            correctOptionId: "correct",
            audioText: "c'est le chien de Camille",
          },
          replyGloss: "It's Camille's dog.",
        },
      ],
    },
  ];
}

/** L10 — MASTERY: recap variety, ends on its own dialogue_sim (Théo's
 *  boutique, m12/m21's own NPC — reunion closes, every possession
 *  claimed). All graded, zero new atoms, zero info. */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m22-10-smcq-recap",
      prompt: "'It's Marie's bag' — pick the French.",
      correctText: "c'est le sac de Marie",
      distractorsText: [
        "c'est le sac de Thomas",
        "c'est le livre de Marie",
        "je suis de Marie",
      ],
    }),
    cloze(
      "fr-m22-10-cloze-de",
      "Ce n'est pas le chat",
      "Louis, c'est le chat de Lucas.",
      "de",
      ["de", "au"],
      "it's not Louis's cat, it's Lucas's cat",
      "ce n'est pas le chat de Louis, c'est le chat de Lucas",
    ),
    build(
      "fr-m22-10-build-maisondechloe",
      "Build: 'it's Chloé's little house'",
      "c'est la petite maison de Chloé",
      [
        "c'est",
        "la petite maison de Chloé",
        "la grande maison de Chloé",
        "la petite maison de Camille",
      ],
      ["c'est", "la petite maison de Chloé"],
    ),
    speaking(
      "fr-m22-10-speak-deuxcents-recall",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m22-10-lc-livredesam",
      audioText: "c'est le livre de Sam",
      correctMeaningEn: "It's Sam's book.",
      distractorsEn: ["It's Sam's bag.", "It's a book.", "It's Marie's book."],
    }),
    crossModuleMatchPairs("fr-m22-10", [
      ["sac", "bag"],
      ["livre", "book"],
      ["maison", "house"],
      ["chat", "cat"],
      ["chien", "dog"],
      ["ce n'est pas", "it's not"],
    ]),
    {
      id: "fr-m22-10-sim-boutique",
      type: "dialogue_sim",
      scene: { emoji: "🎒", title: "Everyone's things" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-sacpaul",
          npc: {
            speaker: "Théo",
            kana: "Voici le grand sac. C'est le sac de Paul ?",
            audioText: "voici le grand sac. c'est le sac de Paul ?",
            gloss: "Here's the big bag. Is it Paul's bag?",
          },
          goal: "Say yes, it's Paul's bag.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "oui, c'est le sac de Paul" },
              { id: "wrong-no", text: "non, ce n'est pas le sac de Paul" },
              { id: "wrong-item", text: "oui, c'est le livre de Paul" },
            ],
            correctOptionId: "correct",
            audioText: "oui, c'est le sac de Paul",
          },
          replyGloss: "Yes, it's Paul's bag.",
        },
        {
          id: "t2-livrelea",
          npc: {
            speaker: "Théo",
            kana: "Et ce livre, c'est le livre de Thomas ?",
            audioText: "et ce livre, c'est le livre de Thomas ?",
            gloss: "And this book, is it Thomas's book?",
          },
          goal: "Say no — it's Léa's book, not Thomas's.",
          reply: {
            mode: "choice",
            options: [
              {
                id: "correct",
                text: "non, ce n'est pas le livre de Thomas, c'est le livre de Léa",
              },
              { id: "wrong-agree", text: "oui, c'est le livre de Thomas" },
              { id: "wrong-item", text: "non, ce n'est pas le sac de Thomas" },
            ],
            correctOptionId: "correct",
            audioText: "non, ce n'est pas le livre de Thomas, c'est le livre de Léa",
          },
          replyGloss: "No, it's not Thomas's book, it's Léa's book.",
        },
        {
          id: "t3-close",
          npc: {
            speaker: "Théo",
            kana: "Très bien — merci ! Et voici un sac.",
            audioText: "très bien — merci ! et voici un sac.",
            gloss: "Very good — thanks! And here's a bag.",
          },
          goal: "Say okay, that's my bag.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, c'est mon sac" },
              { id: "wrong-neg", text: "d'accord, ce n'est pas mon sac" },
              { id: "wrong-form", text: "d'accord, c'est le sac" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, c'est mon sac",
          },
          replyGloss: "Okay, that's my bag.",
        },
      ],
    },
  ];
}

const FR_M22_1: LessonContent = {
  id: "fr-m22-1",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le sac de Marie",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M22_2: LessonContent = {
  id: "fr-m22-2",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The cat, the dog, the family",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M22_3: LessonContent = {
  id: "fr-m22-3",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Whose is it? Consolidation",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M22_4: LessonContent = {
  id: "fr-m22-4",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The big bag, the little house",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M22_5: LessonContent = {
  id: "fr-m22-5",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Not mine",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M22_6: LessonContent = {
  id: "fr-m22-6",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Whose is it? Mixed review",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M22_7: LessonContent = {
  id: "fr-m22-7",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Everything, everyone",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M22_8: LessonContent = {
  id: "fr-m22-8",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Le livre de Sam",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M22_9: LessonContent = {
  id: "fr-m22-9",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Lost and found",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M22_10: LessonContent = {
  id: "fr-m22-10",
  moduleId: "m22",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Everyone's things",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M22_MODULE: FrModuleDef = {
  title: "C'est à moi !",
  eyebrow: "Module 22",
  summary:
    "You already met this «de» — «le livre de Léa» (m3) — now it gets a full workout: a new noun («sac», bag), the whole cast, adjectives riding along, and the negated twist «ce n'est pas le sac de Marie, c'est le sac de Paul». Whose is it? Now you can always say.",
  lessons: [
    FR_M22_1,
    FR_M22_2,
    FR_M22_3,
    FR_M22_4,
    FR_M22_5,
    FR_M22_6,
    FR_M22_7,
    FR_M22_8,
    FR_M22_9,
    FR_M22_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M22_CHECKPOINT_INDEX = 8;

export const FR_M22_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m22-s",
    moduleId: "m22",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m22-s",
        prompt: "'It's Marie's bag' — pick the French.",
        correctText: "c'est le sac de Marie",
        distractorsText: [
          "c'est le sac de Thomas",
          "c'est le livre de Marie",
          "je suis de Marie",
        ],
      }),
  },
  {
    id: "pt-fr-m22-1",
    moduleId: "m22",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m22-1",
        prompt: "'It's Léa's dog' — pick the French.",
        correctText: "c'est le chien de Léa",
        distractorsText: [
          "c'est le chat de Léa",
          "c'est le chien de Thomas",
          "c'est mon chien",
        ],
      }),
  },
  {
    id: "pt-fr-m22-2",
    moduleId: "m22",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m22-2",
        prompt: "'It's Chloé's big house' — pick the French.",
        correctText: "c'est la grande maison de Chloé",
        distractorsText: [
          "c'est la petite maison de Chloé",
          "c'est la grande maison de Camille",
          "c'est le grand sac de Chloé",
        ],
      }),
  },
  {
    id: "pt-fr-m22-3",
    moduleId: "m22",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m22-3",
        prompt: "'It's not Louis's cat, it's Lucas's cat' — pick the French.",
        correctText: "ce n'est pas le chat de Louis, c'est le chat de Lucas",
        distractorsText: [
          "c'est le chat de Louis, ce n'est pas le chat de Lucas",
          "ce n'est pas le chien de Louis, c'est le chien de Lucas",
          "ce n'est pas le chat de Lucas, c'est le chat de Louis",
        ],
      }),
  },
  {
    id: "pt-fr-m22-4",
    moduleId: "m22",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m22-4",
        prompt: "'They're Paul's hundred euros' — pick the French.",
        correctText: "ce sont les cent euros de Paul",
        distractorsText: [
          "ce sont les cents euros de Paul",
          "ce sont les cent euros de Louis",
          "c'est le sac de Paul",
        ],
      }),
  },
];
