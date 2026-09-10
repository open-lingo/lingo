/**
 * m23.ts — «Il est quelle heure ?» — telling time on the hour.
 *
 * AUTHORED 2026-09-10 per docs/fr-m23-brief-2026-09-10.md, with every
 * UNVERIFIED brief item checked against the live registries before writing
 * a single lesson step (the brief itself documents that earlier briefs,
 * including m22's own, contained false claims caught only by direct
 * verification — so nothing here is trusted unread).
 *
 * SCOPE DECISIONS (recorded per the "never park a question" doctrine):
 *
 *   1. BRIEF CLAIM FOUND FALSE — the "euro/euros" homophoneKey model the
 *      brief cites (§5/§6, alongside a false claim that cent/cents also
 *      carries one — verified false: neither m12's `cent` nor m21's
 *      `cents` atom has a homophoneKey field at all) does not actually
 *      FUNCTION as a homophone pair. Both grammarHelpers.ts consumers
 *      (`failOnHomophoneDistractor`, `assertNoHomophoneTiles`) test
 *      `findFrAtomBySurface(a)?.homophoneKey === findFrAtomBySurface(b)?.homophoneKey`
 *      — but m12's `euro` atom carries NO homophoneKey at all; only
 *      `euros` does ("øʁo"). The comparison is inert for either direction.
 *      The WORKING precedent, verified by reading m11.ts directly, is
 *      `aime`/`aimes` and `parle`/`parles` — BOTH atoms in each pair carry
 *      the IDENTICAL key. DECISION: `heure` and `heures` both carry the
 *      same homophoneKey ("œʁ", heure's actual IPA) — the functioning
 *      pattern, not the inert one the brief pointed at.
 *
 *   2. BRIEF CLAIM FOUND FALSE — the bridge precedent the brief instructs
 *      quoting verbatim ("m10's own «il est très grand»") is misattributed.
 *      Verified by grepping every `speaking()`/dialogue_sim occurrence in
 *      m9.ts and m10.ts: m10 contains "il est très grand" ONLY as a
 *      REJECTED/wrong dialogue_sim option (never the graded correct
 *      answer) and "il est très petit !" only as NPC-heard audio (never
 *      learner-produced). The actual GRADED, correct-option referential
 *      «il est» precedent lives in m9.ts: NPC asks "Ton chien est grand ?",
 *      the correct reply is "oui il est très grand" (replyGloss "Yes —
 *      he's very big."). DECISION: L1's bridge card and this module's own
 *      summary cite m9, not m10.
 *
 *   3. BRIEF CLAIM FOUND FALSE — the brief's assumed precedent "tu
 *      habites où ?" (m11) is NOT a genuine printed `speaking()` target:
 *      grep of m11.ts shows it appears ONLY as NPC-only dialogue_sim
 *      audio (lines 963/1107), never learner-produced. VERIFIED instead:
 *      "tu vas où ?" (m5, line 219) and "tu habites à Paris ?" (m11,
 *      lines 395/400/659) are BOTH genuine PRINTED (non-recall)
 *      `speaking()` targets, each later legally recalled within their
 *      own module. DECISION: L7's cross-module recall uses "tu habites
 *      à Paris ?" in place of the false "tu habites où ?" precedent.
 *      "il y a un café" (m4, line 189) is likewise a genuine printed
 *      target — the module's dummy-«il» precedent citation.
 *
 *   4. NEW ATOMS — exactly 2: `heure` (singular, feminine) and `heures`
 *      (plural). All numbers 1–12 needed for hour-telling are already
 *      fully taught (un–dix, m1; onze/douze, m17) — zero new number
 *      atoms, matching the brief's own accounting exactly. Emoji 🕐
 *      (U+1F550) is already vendored at
 *      src/pub/noto-emoji/svg/emoji_u1f550.svg — no vendoring work.
 *
 *   5. `heure` carries NO `consonantOnset` flag (the brief's own
 *      instruction, independently re-verified correct against
 *      `elidesBefore()`'s own regex in courseAtoms.ts, which already
 *      treats a leading "h" as vowel-onset by default): `heure` is a real
 *      h-muet word — «l'heure» elides normally in actual French, and the
 *      existing m2 tease line "Vous avez l'heure ?" already assumes this.
 *      Flagging it consonant-onset would make `elidesBefore()` wrongly
 *      block elision course-wide for any future module writing «l'heure».
 *
 *   6. UNTAUGHT-STRUCTURE AVOIDANCE — the module never asks the learner to
 *      PRODUCE «vous», «qui», or verb-subject inversion. The ONE exception
 *      is receptive-only: L10's mastery-finale dialogue_sim reuses m2's
 *      own tease line "Quelle heure est-il ?" as NPC-heard audio only
 *      (never a reply option, never a speaking/build/cloze target) — the
 *      same "recognize, never produce" contract m2 itself established
 *      when it first planted that tease as an unresolved incomprehensible
 *      hook. This is the payoff the brief's own thesis gestures at
 *      ("replacing, not reproducing, m2's untaught inversion tease"): the
 *      learner now fully UNDERSTANDS the question — every word in it is
 *      taught or chrome — and answers fluently in the in-situ form they
 *      were actually taught, without the course ever asking them to
 *      produce the inverted form itself.
 *
 *   7. SPEECH-SAFETY DESIGN — per the binding course-wide constraint,
 *      «il est une heure» / «il est deux heures» (and any heure/heures or
 *      numeral-swap pair) is NEVER the sole graded location for its
 *      contrast: every such pair is drilled via build/cloze/MCQ.
 *      Non-recall `speaking` targets are capped at exactly 3 for the
 *      whole module — "il est deux heures" (L1, statement debut),
 *      "il est quelle heure ?" (L2, question debut), "on va au cinéma à
 *      sept heures" (L4, recombination debut) — chosen so no two differ
 *      by ≤2 tokens (verified: every pairwise multiset token-diff among
 *      the three exceeds frSpeechMinimalPairs.test.ts's own 2-token
 *      budget, so its classifier assigns NO contrast class to any pair
 *      regardless of matcher score). Every OTHER `speaking` step is a
 *      cued recall (`cue:"recall"`) reusing one of these three exact
 *      strings verbatim, or an earlier-module phrase already printed
 *      before m23 in course order («il y a un café» m4, «tu vas où ?» m5,
 *      «tu habites à Paris ?» m11) — 10 recalls total, see the ledger
 *      below, comfortably over the course-wide ≥8 floor.
 *
 *   8. INTERLEAVE — L5/L9 (dialogue_sim) recall m6's «s'il te plaît»; L6
 *      recalls m4/m5; L7 recombines m5/m8/m11's places («cinéma»,
 *      «musée», «école», «on va»). L1/L9/L10 all recall m4's «il y a un
 *      café» specifically to keep drilling the il-y-a/il-est
 *      disambiguation — both are "il" + a form of être, one existential,
 *      one impersonal-for-time — which is this module's real confusion
 *      risk, more than the number machine itself.
 *
 *   9. Numbers used across the module cover the full 1–12 range (une/un,
 *      deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze,
 *      douze all appear at least once) via build/cloze/MCQ only — never
 *      two of them sharing a `speaking` target, so no numeral pair is
 *      ever graded by voice alone.
 *
 *  10. L8's checkpoint (12 steps, all graded, zero info cards, zero new
 *      atoms) and L10's mastery (10 steps, all graded, zero info cards,
 *      ends on dialogue_sim) both follow the §13/m22 shape exactly.
 *
 * VOICING LEDGER (cued-recall-precedes-printed-voicing, R3/§13.9):
 *   - L1 "il est deux heures" — NEW, printed, graded. L1 ALSO recalls m4's
 *     "il y a un café" (the bridge card's own dummy-«il» precedent, voiced
 *     again at the lesson's close).
 *   - L2 "il est quelle heure ?" — NEW, printed, graded. L2 ALSO recalls
 *     m5's "tu vas où ?" (the in-situ question-form precedent).
 *   - L3 recalls L1's "il est deux heures".
 *   - L4 "on va au cinéma à sept heures" — NEW, printed, graded.
 *   - L5 recalls L4's "on va au cinéma à sept heures".
 *   - L6 recalls m4's "il y a un café" AND m5's "tu vas où ?".
 *   - L7 recalls m11's "tu habites à Paris ?" AND L2's "il est quelle heure ?".
 *   - L8 (checkpoint) recalls L1's "il est deux heures" AND L2's "il est
 *     quelle heure ?".
 *   - L9 recalls L4's "on va au cinéma à sept heures".
 *   - L10 (mastery) recalls m4's "il y a un café".
 *   Total: 12 recalls (this ledger previously undercounted at 10, omitting
 *   L1's and L2's own bridge/precedent recalls — corrected on review),
 *   comfortably exceeding the course-wide >=8 floor.
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
 * crossModuleVocabMcq() precedent (m15.ts, m21.ts, m22.ts), bypassing the
 * atom registry. Used for gloss-driven vocab/sentence MCQs in this module.
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
 * landmine m11/m14/m15/m17-m22 route around. Used for EVERY match_pairs
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

export const FR_M23_ATOMS: FrAtom[] = [
  atom({
    surface: "heure",
    meaningEn: "hour / o'clock",
    partOfSpeech: "noun",
    fromModule: "m23",
    kind: "vocab",
    gender: "f",
    emoji: "🕐",
    homophoneKey: "œʁ",
    hint: "ur — feminine: UNE heure, not UN heure",
  }),
  atom({
    surface: "heures",
    meaningEn: "hours / o'clock (plural)",
    partOfSpeech: "noun",
    fromModule: "m23",
    kind: "vocab",
    gender: "f",
    homophoneKey: "œʁ",
    hint: "same sound as «heure» — the plural -s is silent",
  }),
];

/** L1 — bridge/debut: the dummy-«il» precedent (m4's «il y a») recombines
 *  with referential «il est» (m9's graded «oui il est très grand») into
 *  the impersonal «il est» for time. The module's ONLY other printed
 *  target besides L2/L4 (decision 7). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m23-1-info-bridge",
      "A new job for «il est»",
      "«Il y a un café» (m4) — there's a café: «il» pointing at nothing. «Oui, il est très grand» (m9) — «il» pointing at the dog. Now: «il est deux heures» — «il» points at nothing again, just the clock. Same two words, a new job. (One hour alone drops the -s: «il est une heure».)",
    ),
    {
      id: "fr-m23-1-map-ilestdeuxheures",
      type: "word_map",
      tokens: ["il", "est", "deux", "heures"],
      pairs: [
        { en: "it", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "two", tokenIndex: 2 },
        { en: "o'clock", tokenIndex: 3 },
      ],
      audioText: "il est deux heures",
      tokenGenders: { 3: "f" },
      revealNote: "«il» has no antecedent here — same empty «il» as «il y a».",
    },
    crossModuleVocabMcq("fr-m23-1-mcq-heures", "hours / o'clock", "heures", [
      "heure",
      "le café",
      "le chien",
    ]),
    cloze(
      "fr-m23-1-cloze-heures",
      "Il est deux",
      ".",
      "heures",
      ["heures", "heure"],
      "it's two o'clock",
      "il est deux heures",
      "past «un», the noun takes -s — «deux heures», like «deux euros».",
    ),
    crossModuleVocabMcq("fr-m23-1-mcq-ilya", "there is / there's", "il y a", [
      "il est",
      "c'est",
      "on va",
    ]),
    build(
      "fr-m23-1-build-troisheures",
      "Build: 'it's three o'clock'",
      "il est trois heures",
      ["il est", "trois heures", "il y a", "deux heures"],
      ["il est", "trois heures"],
      ["heures"],
    ),
    speaking(
      "fr-m23-1-speak-deuxheures",
      "il est deux heures",
      "it's two o'clock",
      ["heures"],
    ),
    listeningCompSentence({
      id: "fr-m23-1-lc-quatreheures",
      audioText: "il est quatre heures",
      correctMeaningEn: "It's four o'clock.",
      distractorsEn: ["It's three o'clock.", "It's a four.", "There's a café."],
    }),
    speaking(
      "fr-m23-1-speak-ilya-recall",
      "il y a un café",
      "there's a café",
      [],
      "recall",
    ),
    crossModuleMatchPairs("fr-m23-1", [
      ["heure", "hour"],
      ["heures", "hours / o'clock"],
      ["il est", "it's"],
      ["il y a", "there is"],
      ["un café", "a coffee"],
      ["deux", "two"],
    ]),
  ];
}

/** L2 — the wh-in-situ question: «il est quelle heure ?» — by analogy to
 *  m5's «tu vas où ?» (verified genuine printed precedent, m5 line 219).
 *  Replaces, never reproduces, m2's untaught «Quelle heure est-il ?»
 *  inversion tease. */
function lesson2(): LessonStep[] {
  return [
    infoStep(
      "fr-m23-2-info-bridge",
      "The question word moves to the end",
      "«Tu vas où ?» (m5) — the question word stays where the answer would go, at the end. Same trick, new question: «il est quelle heure ?».",
    ),
    {
      id: "fr-m23-2-map-quelleheure",
      type: "word_map",
      tokens: ["il", "est", "quelle", "heure", "?"],
      pairs: [
        { en: "it", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "what", tokenIndex: 2 },
        { en: "hour", tokenIndex: 3 },
      ],
      audioText: "il est quelle heure ?",
      tokenGenders: { 3: "f" },
      revealNote: "«heure» stays singular here — French always asks 'what hour', even though the answer might be «dix heures».",
    },
    crossModuleVocabMcq("fr-m23-2-mcq-quelle", "what (fem.)", "quelle", [
      "quel",
      "où",
      "deux",
    ]),
    cloze(
      "fr-m23-2-cloze-quelle",
      "Il est",
      "heure ?",
      "quelle",
      ["quelle", "quel"],
      "what time is it?",
      "il est quelle heure ?",
      "«heure» is feminine, so the question word agrees: «quelle», not «quel».",
    ),
    crossModuleVocabMcq("fr-m23-2-mcq-habites", "live (tu)", "habites", [
      "habite",
      "parle",
      "aime",
    ]),
    build(
      "fr-m23-2-build-quelleheure",
      "Build: 'what time is it?'",
      "il est quelle heure ?",
      ["il est", "quelle heure ?", "on va", "où ?"],
      ["il est", "quelle heure ?"],
      ["heure"],
    ),
    speaking(
      "fr-m23-2-speak-quelleheure",
      "il est quelle heure ?",
      "what time is it?",
      ["heure"],
    ),
    listeningCompSentence({
      id: "fr-m23-2-lc-cinqheures",
      audioText: "il est cinq heures",
      correctMeaningEn: "It's five o'clock.",
      distractorsEn: ["It's two o'clock.", "It's a five.", "You live where?"],
    }),
    speaking(
      "fr-m23-2-speak-tuvasou-recall",
      "tu vas où ?",
      "where are you going?",
      [],
      "recall",
    ),
    crossModuleMatchPairs("fr-m23-2", [
      ["quelle", "what (fem.)"],
      ["heure", "hour"],
      ["où", "where"],
      ["tu vas", "you're going"],
      ["il est", "it's"],
      ["habites", "live (tu)"],
    ]),
  ];
}

/** L3 — «une» vs «un»: the singular exception. Reuses the ALREADY-KNOWN
 *  un/une article-agreement rule (un café / une pomme) rather than
 *  teaching new grammar. Every step grading this contrast is build/cloze/
 *  MCQ — per the binding constraint, this pair is NEVER the sole graded
 *  place via `speaking` (decision 7); this lesson's one `speaking` step
 *  is a plain recall of L1's already-safe "il est deux heures". */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m23-3-info-une",
      "«un» becomes «une» before «heure»",
      "You already know this swap — «un café», but «une pizza». «Heure» is feminine too: «il est une heure», never «un heure».",
    ),
    {
      id: "fr-m23-3-map-uneheure",
      type: "word_map",
      tokens: ["il", "est", "une", "heure"],
      pairs: [
        { en: "it", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "one", tokenIndex: 2 },
        { en: "o'clock", tokenIndex: 3 },
      ],
      audioText: "il est une heure",
      tokenGenders: { 3: "f" },
      revealNote: "One o'clock is the only hour where the number itself changes shape.",
    },
    cloze(
      "fr-m23-3-cloze-une",
      "Il est",
      "heure.",
      "une",
      ["une", "un"],
      "it's one o'clock",
      "il est une heure",
      "«heure» is feminine — «une», not «un», same as «une pizza».",
    ),
    crossModuleVocabMcq("fr-m23-3-mcq-une", "one (fem.)", "une", [
      "un",
      "deux",
      "la",
    ]),
    cloze(
      "fr-m23-3-cloze-deuxheures",
      "Il est deux",
      ".",
      "heures",
      ["heures", "heure"],
      "it's two o'clock",
      "il est deux heures",
      "past one, «heures» always takes the -s.",
    ),
    build(
      "fr-m23-3-build-uneheure",
      "Build: 'it's one o'clock'",
      "il est une heure",
      ["il est", "une heure", "un heure", "deux heures"],
      ["il est", "une heure"],
      ["heure"],
    ),
    crossModuleVocabMcq("fr-m23-3-mcq-trois", "three", "trois", [
      "deux",
      "quatre",
      "treize",
    ]),
    speaking(
      "fr-m23-3-speak-deuxheures-recall",
      "il est deux heures",
      "it's two o'clock",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m23-3-lc-uneheure",
      audioText: "il est une heure",
      correctMeaningEn: "It's one o'clock.",
      distractorsEn: ["It's two o'clock.", "It's three o'clock.", "There's one café."],
    }),
    crossModuleMatchPairs("fr-m23-3", [
      ["une", "one (fem.)"],
      ["un", "one (masc.)"],
      ["heure", "hour"],
      ["deux", "two"],
      ["trois", "three"],
      ["il est", "it's"],
    ]),
  ];
}

/** L4 — recombination: «à» + the hour tells you WHEN, riding on m5's
 *  frozen carrier phrase «on va» and its cast of places (cinéma, musée,
 *  plage, école, restaurant). The module's third and final printed
 *  `speaking` target. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m23-4-info-bridge",
      "«à» + the hour = WHEN",
      "You already know «on va au cinéma» (m5). Add «à» plus an hour, and you've said when: «on va au cinéma à sept heures».",
    ),
    {
      id: "fr-m23-4-map-cinemaseptheures",
      type: "word_map",
      tokens: ["on va", "au", "cinéma", "à", "sept heures"],
      pairs: [
        { en: "we're going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "movies", tokenIndex: 2 },
        { en: "at", tokenIndex: 3 },
        { en: "seven o'clock", tokenIndex: 4 },
      ],
      audioText: "on va au cinéma à sept heures",
      revealNote: "the second «à» is new work for a word you already know — «at» the hour, not «to» the place.",
    },
    crossModuleVocabMcq("fr-m23-4-mcq-plage", "the beach", "la plage", [
      "le musée",
      "l'école",
      "le restaurant",
    ]),
    build(
      "fr-m23-4-build-museeonze",
      "Build: 'we're going to the museum at eleven o'clock'",
      "on va au musée à onze heures",
      ["on va", "au musée", "à onze heures", "au cinéma"],
      ["on va", "au musée", "à onze heures"],
      ["heures"],
    ),
    cloze(
      "fr-m23-4-cloze-au",
      "On va",
      "restaurant à huit heures.",
      "au",
      ["au", "à la"],
      "we're going to the restaurant at eight o'clock",
      "on va au restaurant à huit heures",
      "«restaurant» is masculine — «au», the same rule as «on va au cinéma».",
    ),
    speaking(
      "fr-m23-4-speak-cinemasept",
      "on va au cinéma à sept heures",
      "we're going to the movies at seven o'clock",
      ["heures"],
    ),
    listeningCompSentence({
      id: "fr-m23-4-lc-museeonze",
      audioText: "on va au musée à onze heures",
      correctMeaningEn: "We're going to the museum at eleven o'clock.",
      distractorsEn: [
        "We're going to the movies at eleven o'clock.",
        "We're going to the museum at ten o'clock.",
        "There's a museum.",
      ],
    }),
    crossModuleVocabMcq("fr-m23-4-mcq-huit", "eight", "huit", [
      "sept",
      "neuf",
      "six",
    ]),
    build(
      "fr-m23-4-build-plagedix",
      "Build: 'we're going to the beach at ten o'clock'",
      "on va à la plage à dix heures",
      ["on va", "à la plage", "à dix heures", "au musée"],
      ["on va", "à la plage", "à dix heures"],
      ["heures"],
    ),
    crossModuleMatchPairs("fr-m23-4", [
      ["cinéma", "movies"],
      ["musée", "museum"],
      ["école", "school"],
      ["sept", "seven"],
      ["onze", "eleven"],
      ["on va", "we're going"],
    ]),
  ];
}

/** L5 — first dialogue_sim, plus the rest of the low numbers (cinq-neuf)
 *  and an interleave break (m8's «c'est lundi», m17's «onze»). Sim reply
 *  options carry fresh numeral variety freely — that census is
 *  frSimProvenance's domain, not the speaking minimal-pair gate's. */
function lesson5(): LessonStep[] {
  return [
    {
      id: "fr-m23-5-map-cinqheures",
      type: "word_map",
      tokens: ["il", "est", "cinq", "heures"],
      pairs: [
        { en: "it", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "five", tokenIndex: 2 },
        { en: "o'clock", tokenIndex: 3 },
      ],
      audioText: "il est cinq heures",
      tokenGenders: { 3: "f" },
      revealNote: "same shape, every time: «il est» + number + «heures».",
    },
    crossModuleVocabMcq("fr-m23-5-mcq-lundi", "It's Monday", "c'est lundi", [
      "c'est mardi",
      "c'est le lundi",
      "lundi c'est",
    ]),
    build(
      "fr-m23-5-build-sixheures",
      "Build: 'it's six o'clock'",
      "il est six heures",
      ["il est", "six heures", "sept heures", "il y a"],
      ["il est", "six heures"],
      ["heures"],
    ),
    cloze(
      "fr-m23-5-cloze-sept",
      "Il est",
      "heures.",
      "sept",
      ["sept", "huit"],
      "it's seven o'clock",
      "il est sept heures",
      "«sept» — the number that names m6's own «s'il te plaît» count, seven o'clock.",
    ),
    crossModuleVocabMcq("fr-m23-5-mcq-onze", "eleven", "onze", ["douze", "seize", "dix"]),
    build(
      "fr-m23-5-build-neufheures",
      "Build: 'it's nine o'clock'",
      "il est neuf heures",
      ["il est", "neuf heures", "huit heures", "on va"],
      ["il est", "neuf heures"],
      ["heures"],
    ),
    speaking(
      "fr-m23-5-speak-cinemasept-recall",
      "on va au cinéma à sept heures",
      "we're going to the movies at seven o'clock",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m23-5-lc-huitheures",
      audioText: "il est huit heures",
      correctMeaningEn: "It's eight o'clock.",
      distractorsEn: ["It's nine o'clock.", "It's seven o'clock.", "We're going to the movies."],
    }),
    {
      id: "fr-m23-5-sim-quelleheure",
      type: "dialogue_sim",
      scene: { emoji: "🕐", title: "What time is it?" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-dixheures",
          npc: {
            speaker: "Marie",
            kana: "Il est quelle heure ?",
            audioText: "il est quelle heure ?",
            gloss: "What time is it?",
          },
          goal: "Say it's ten o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il est dix heures" },
              { id: "wrong-num", text: "il est onze heures" },
              { id: "wrong-agree", text: "il est dix" },
            ],
            correctOptionId: "correct",
            audioText: "il est dix heures",
          },
          replyGloss: "It's ten o'clock.",
        },
        {
          id: "t2-cinema",
          npc: {
            speaker: "Marie",
            kana: "On va au cinéma à quelle heure ?",
            audioText: "on va au cinéma à quelle heure ?",
            gloss: "What time are we going to the movies?",
          },
          goal: "Say seven o'clock, at the movies.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "on va au cinéma à sept heures" },
              { id: "wrong-place", text: "on va au musée à sept heures" },
              { id: "wrong-num", text: "on va au cinéma à huit heures" },
            ],
            correctOptionId: "correct",
            audioText: "on va au cinéma à sept heures",
          },
          replyGloss: "We're going to the movies at seven o'clock.",
        },
        {
          id: "t3-uneheure",
          npc: {
            speaker: "Marie",
            kana: "Il est une heure ?",
            audioText: "il est une heure ?",
            gloss: "Is it one o'clock?",
          },
          goal: "Say no, it's two o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il est deux heures" },
              { id: "wrong-agree", text: "oui, il est une heure" },
              { id: "wrong-gender", text: "il est un heure" },
            ],
            correctOptionId: "correct",
            audioText: "non, il est deux heures",
          },
          replyGloss: "No, it's two o'clock.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m23-5", [
      ["cinq", "five"],
      ["six", "six"],
      ["sept", "seven"],
      ["huit", "eight"],
      ["neuf", "nine"],
      ["onze", "eleven"],
    ]),
  ];
}

/** L6 — recall-heavy consolidation: the top of the number range (dix-
 *  douze) plus two unrelated interleave recalls (m4, m5), per the
 *  interleave-don't-block-teach law. */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m23-6-map-quatreheures",
      type: "word_map",
      tokens: ["il", "est", "quatre", "heures"],
      pairs: [
        { en: "it", tokenIndex: 0 },
        { en: "is", tokenIndex: 1 },
        { en: "four", tokenIndex: 2 },
        { en: "o'clock", tokenIndex: 3 },
      ],
      audioText: "il est quatre heures",
      tokenGenders: { 3: "f" },
      revealNote: "review: the same shape as every hour past one.",
    },
    crossModuleVocabMcq("fr-m23-6-mcq-tuvas", "you're going", "tu vas", [
      "on va",
      "tu habites",
      "il est",
    ]),
    speaking(
      "fr-m23-6-speak-ilya-recall",
      "il y a un café",
      "there's a café",
      [],
      "recall",
    ),
    build(
      "fr-m23-6-build-huitheures",
      "Build: 'it's eight o'clock'",
      "il est huit heures",
      ["il est", "huit heures", "neuf heures", "on va"],
      ["il est", "huit heures"],
      ["heures"],
    ),
    cloze(
      "fr-m23-6-cloze-neuf",
      "Il est",
      "heures.",
      "neuf",
      ["neuf", "dix"],
      "it's nine o'clock",
      "il est neuf heures",
    ),
    crossModuleVocabMcq("fr-m23-6-mcq-dix", "ten", "dix", ["dix heures", "deux", "douze"]),
    speaking(
      "fr-m23-6-speak-tuvasou-recall",
      "tu vas où ?",
      "where are you going?",
      [],
      "recall",
    ),
    build(
      "fr-m23-6-build-douzeheures",
      "Build: 'it's twelve o'clock'",
      "il est douze heures",
      ["il est", "douze heures", "onze heures", "il y a"],
      ["il est", "douze heures"],
      ["heures"],
    ),
    listeningCompSentence({
      id: "fr-m23-6-lc-dixheures",
      audioText: "il est dix heures",
      correctMeaningEn: "It's ten o'clock.",
      distractorsEn: ["It's nine o'clock.", "It's eleven o'clock.", "Where are you going?"],
    }),
    crossModuleMatchPairs("fr-m23-6", [
      ["heure", "hour"],
      ["heures", "hours / o'clock"],
      ["neuf", "nine"],
      ["dix", "ten"],
      ["il y a", "there is"],
      ["tu vas où", "where are you going"],
    ]),
  ];
}

/** L7 — integration, the heaviest interleave: places (m5/m8) recombine
 *  with the hour machine, plus two more cross-module recalls
 *  (m11's «tu habites à Paris ?» — verified genuine printed speaking()
 *  target, m11 lines 395/400/659 — and L2's own «il est quelle heure ?»). */
function lesson7(): LessonStep[] {
  return [
    {
      id: "fr-m23-7-map-ecolesixheures",
      type: "word_map",
      tokens: ["on va", "à", "l'école", "à", "six", "heures"],
      pairs: [
        { en: "we're going", tokenIndex: 0 },
        { en: "to", tokenIndex: 1 },
        { en: "school", tokenIndex: 2 },
        { en: "at", tokenIndex: 3 },
        { en: "six", tokenIndex: 4 },
        { en: "o'clock", tokenIndex: 5 },
      ],
      audioText: "on va à l'école à six heures",
      revealNote: "«à l'école» — same elision as always; the second «à» is the hour, not the place.",
    },
    crossModuleVocabMcq("fr-m23-7-mcq-habites", "live (tu)", "habites", [
      "habite",
      "parle",
      "aime",
    ]),
    speaking(
      "fr-m23-7-speak-habites-recall",
      "tu habites à Paris ?",
      "do you live in Paris?",
      [],
      "recall",
    ),
    build(
      "fr-m23-7-build-ecolesix",
      "Build: 'we're going to school at six o'clock'",
      "on va à l'école à six heures",
      ["on va", "à l'école", "à six heures", "au musée"],
      ["on va", "à l'école", "à six heures"],
      ["heures"],
    ),
    cloze(
      "fr-m23-7-cloze-six",
      "On va à l'école à",
      "heures.",
      "six",
      ["six", "sept"],
      "we're going to school at six o'clock",
      "on va à l'école à six heures",
    ),
    speaking(
      "fr-m23-7-speak-quelleheure-recall",
      "il est quelle heure ?",
      "what time is it?",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m23-7-lc-ecolesix",
      audioText: "on va à l'école à six heures",
      correctMeaningEn: "We're going to school at six o'clock.",
      distractorsEn: [
        "We're going to the museum at six o'clock.",
        "We're going to school at seven o'clock.",
        "There's a school.",
      ],
    }),
    crossModuleVocabMcq(
      "fr-m23-7-mcq-museedix",
      "the museum",
      "le musée",
      ["le cinéma", "le restaurant", "l'école"],
    ),
    build(
      "fr-m23-7-build-museedix",
      "Build: 'we're going to the museum at ten o'clock'",
      "on va au musée à dix heures",
      ["on va", "au musée", "à dix heures", "à l'école"],
      ["on va", "au musée", "à dix heures"],
      ["heures"],
    ),
    crossModuleMatchPairs("fr-m23-7", [
      ["école", "school"],
      ["à", "at / to"],
      ["six", "six"],
      ["dix", "ten"],
      ["on va", "we're going"],
      ["où", "where"],
    ]),
  ];
}

/** L8 — checkpoint: zero new content, all graded, pure review across
 *  L1-L7. 12 steps, no info cards. */
function lesson8(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m23-8-mcq-deux", "two", "deux", ["trois", "quatre", "douze"]),
    build(
      "fr-m23-8-build-troisheures",
      "Build: 'it's three o'clock'",
      "il est trois heures",
      ["il est", "trois heures", "il y a", "quatre heures"],
      ["il est", "trois heures"],
      ["heures"],
    ),
    cloze(
      "fr-m23-8-cloze-une",
      "Il est une",
      ".",
      "heure",
      ["heure", "heures"],
      "it's one o'clock",
      "il est une heure",
    ),
    crossModuleVocabMcq("fr-m23-8-mcq-quelleheure", "what (fem.)", "quelle", ["quel", "où", "trois"]),
    speaking(
      "fr-m23-8-speak-deuxheures-recall",
      "il est deux heures",
      "it's two o'clock",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m23-8-lc-cinqheures",
      audioText: "il est cinq heures",
      correctMeaningEn: "It's five o'clock.",
      distractorsEn: ["It's four o'clock.", "It's a five.", "There's a café."],
    }),
    build(
      "fr-m23-8-build-cinemasept",
      "Build: 'we're going to the movies at seven o'clock'",
      "on va au cinéma à sept heures",
      ["on va", "au cinéma", "à sept heures", "au musée"],
      ["on va", "au cinéma", "à sept heures"],
      ["heures"],
    ),
    crossModuleVocabMcq("fr-m23-8-mcq-neuf", "nine", "neuf", ["huit", "sept", "seize"]),
    speaking(
      "fr-m23-8-speak-quelleheure-recall",
      "il est quelle heure ?",
      "what time is it?",
      [],
      "recall",
    ),
    cloze(
      "fr-m23-8-cloze-au",
      "On va",
      "musée à onze heures.",
      "au",
      ["au", "à la"],
      "we're going to the museum at eleven o'clock",
      "on va au musée à onze heures",
    ),
    listeningCompSentence({
      id: "fr-m23-8-lc-ecolesix",
      audioText: "on va à l'école à six heures",
      correctMeaningEn: "We're going to school at six o'clock.",
      distractorsEn: [
        "We're going to the museum at six o'clock.",
        "We're going to school at seven o'clock.",
        "There's a school.",
      ],
    }),
    crossModuleMatchPairs("fr-m23-8", [
      ["heure", "hour"],
      ["heures", "hours / o'clock"],
      ["quelle heure", "what time"],
      ["il est", "it's"],
      ["on va", "we're going"],
      ["à l'école", "to school"],
    ]),
  ];
}

/** L9 — integration, second sim: reuses m6's «s'il te plaît» as an
 *  interleave break, recombines places once more, and recalls L4's
 *  «on va au cinéma à sept heures». */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m23-9-map-museedix",
      type: "word_map",
      tokens: ["on va", "au", "musée", "à", "dix heures"],
      pairs: [
        { en: "we're going", tokenIndex: 0 },
        { en: "to the", tokenIndex: 1 },
        { en: "museum", tokenIndex: 2 },
        { en: "at", tokenIndex: 3 },
        { en: "ten o'clock", tokenIndex: 4 },
      ],
      audioText: "on va au musée à dix heures",
    },
    crossModuleVocabMcq("fr-m23-9-mcq-ilya", "there is / there's", "il y a", ["il est", "c'est", "on va"]),
    build(
      "fr-m23-9-build-uneheure",
      "Build: 'it's one o'clock'",
      "il est une heure",
      ["il est", "une heure", "un heure", "deux heures"],
      ["il est", "une heure"],
      ["heure"],
    ),
    cloze(
      "fr-m23-9-cloze-douze",
      "Il est",
      "heures.",
      "douze",
      ["douze", "onze"],
      "it's twelve o'clock",
      "il est douze heures",
    ),
    build(
      "fr-m23-9-build-douzeheures",
      "Build: 'it's twelve o'clock'",
      "il est douze heures",
      ["il est", "douze heures", "onze heures", "on va"],
      ["il est", "douze heures"],
      ["heures"],
    ),
    speaking(
      "fr-m23-9-speak-cinemasept-recall",
      "on va au cinéma à sept heures",
      "we're going to the movies at seven o'clock",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m23-9-lc-uneheure",
      audioText: "il est une heure",
      correctMeaningEn: "It's one o'clock.",
      distractorsEn: ["It's two o'clock.", "It's Marie's bag.", "It's very big."],
    }),
    crossModuleVocabMcq("fr-m23-9-mcq-onze", "eleven", "onze", ["dix", "douze", "treize"]),
    {
      id: "fr-m23-9-sim-rendezvous",
      type: "dialogue_sim",
      scene: { emoji: "🕐", title: "Meeting up" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-dixheures",
          npc: {
            speaker: "Thomas",
            kana: "Il est quelle heure, s'il te plaît ?",
            audioText: "il est quelle heure, s'il te plaît ?",
            gloss: "What time is it, please?",
          },
          goal: "Say it's ten o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il est dix heures" },
              { id: "wrong-num", text: "il est onze heures" },
              { id: "wrong-agree", text: "il est dix" },
            ],
            correctOptionId: "correct",
            audioText: "il est dix heures",
          },
          replyGloss: "It's ten o'clock.",
        },
        {
          id: "t2-musee",
          npc: {
            speaker: "Thomas",
            kana: "On va au musée à quelle heure ?",
            audioText: "on va au musée à quelle heure ?",
            gloss: "What time are we going to the museum?",
          },
          goal: "Say ten o'clock, at the museum.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "on va au musée à dix heures" },
              { id: "wrong-num", text: "on va au musée à onze heures" },
              { id: "wrong-place", text: "on va au cinéma à dix heures" },
            ],
            correctOptionId: "correct",
            audioText: "on va au musée à dix heures",
          },
          replyGloss: "We're going to the museum at ten o'clock.",
        },
        {
          id: "t3-uneheure",
          npc: {
            speaker: "Thomas",
            kana: "Il est une heure ?",
            audioText: "il est une heure ?",
            gloss: "Is it one o'clock?",
          },
          goal: "Say no, it's twelve o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il est douze heures" },
              { id: "wrong-agree", text: "oui, il est une heure" },
              { id: "wrong-gender", text: "il est un heure" },
            ],
            correctOptionId: "correct",
            audioText: "non, il est douze heures",
          },
          replyGloss: "No, it's twelve o'clock.",
        },
      ],
    },
    crossModuleMatchPairs("fr-m23-9", [
      ["musée", "museum"],
      ["dix", "ten"],
      ["onze", "eleven"],
      ["une", "one (fem.)"],
      ["douze", "twelve"],
      ["il y a", "there is"],
    ]),
  ];
}

/** L10 — mastery: all graded, zero info cards, ends on a dialogue_sim
 *  that cashes in m2's own inversion tease ("Quelle heure est-il ?") as
 *  NPC-heard-only audio — the learner now understands every word in it
 *  and answers fluently in the in-situ form, without ever having to
 *  produce the inversion itself (decision 6). */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m23-10-smcq-quatreheures",
      prompt: "'It's four o'clock' — pick the French.",
      correctText: "il est quatre heures",
      distractorsText: ["il est quatre heure", "il est cinq heures", "c'est quatre heures"],
    }),
    build(
      "fr-m23-10-build-cinqheures",
      "Build: 'it's five o'clock'",
      "il est cinq heures",
      ["il est", "cinq heures", "six heures", "il y a"],
      ["il est", "cinq heures"],
      ["heures"],
    ),
    cloze(
      "fr-m23-10-cloze-six",
      "Il est",
      "heures.",
      "six",
      ["six", "sept"],
      "it's six o'clock",
      "il est six heures",
    ),
    crossModuleVocabMcq("fr-m23-10-mcq-quelleheure", "What time is it?", "il est quelle heure ?", [
      "quelle heure il est ?",
      "il est quel heure ?",
      "tu vas où ?",
    ]),
    speaking(
      "fr-m23-10-speak-ilya-recall",
      "il y a un café",
      "there's a café",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m23-10-lc-ecolesix",
      audioText: "on va à l'école à six heures",
      correctMeaningEn: "We're going to school at six o'clock.",
      distractorsEn: [
        "We're going to the museum at six o'clock.",
        "We're going to school at seven o'clock.",
        "There's a school.",
      ],
    }),
    sentenceMcq({
      id: "fr-m23-10-smcq-uneheure",
      prompt: "'It's one o'clock' — pick the French.",
      correctText: "il est une heure",
      distractorsText: ["il est un heure", "il est deux heures", "c'est une heure"],
    }),
    build(
      "fr-m23-10-build-museeonze",
      "Build: 'we're going to the museum at eleven o'clock'",
      "on va au musée à onze heures",
      ["on va", "au musée", "à onze heures", "au cinéma"],
      ["on va", "au musée", "à onze heures"],
      ["heures"],
    ),
    crossModuleMatchPairs("fr-m23-10", [
      ["heure", "hour"],
      ["heures", "hours / o'clock"],
      ["quelle heure", "what time"],
      ["il est", "it's"],
      ["on va", "we're going"],
      ["il y a", "there is"],
    ]),
    {
      id: "fr-m23-10-sim-fullcircle",
      type: "dialogue_sim",
      scene: { emoji: "🕐", title: "Full circle" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-tease",
          npc: {
            speaker: "Léa",
            kana: "Quelle heure est-il ?",
            audioText: "quelle heure est-il ?",
            gloss: "What time is it? (the question from way back in Module 2 — now you can finally answer it.)",
          },
          goal: "Say it's four o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "il est quatre heures" },
              { id: "wrong-agree", text: "il est quatre heure" },
              { id: "wrong-verb", text: "c'est quatre heures" },
            ],
            correctOptionId: "correct",
            audioText: "il est quatre heures",
          },
          replyGloss: "It's four o'clock.",
        },
        {
          id: "t2-cinema",
          npc: {
            speaker: "Léa",
            kana: "On va au cinéma à quelle heure ?",
            audioText: "on va au cinéma à quelle heure ?",
            gloss: "What time are we going to the movies?",
          },
          goal: "Say seven o'clock, at the movies.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "on va au cinéma à sept heures" },
              { id: "wrong-place", text: "on va au musée à sept heures" },
              { id: "wrong-num", text: "on va au cinéma à huit heures" },
            ],
            correctOptionId: "correct",
            audioText: "on va au cinéma à sept heures",
          },
          replyGloss: "We're going to the movies at seven o'clock.",
        },
        {
          id: "t3-uneheure",
          npc: {
            speaker: "Léa",
            kana: "Il est une heure ?",
            audioText: "il est une heure ?",
            gloss: "Is it one o'clock?",
          },
          goal: "Say no, it's two o'clock.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, il est deux heures" },
              { id: "wrong-agree", text: "oui, il est une heure" },
              { id: "wrong-gender", text: "il est un heure" },
            ],
            correctOptionId: "correct",
            audioText: "non, il est deux heures",
          },
          replyGloss: "No, it's two o'clock.",
        },
      ],
    },
  ];
}

const FR_M23_1: LessonContent = {
  id: "fr-m23-1",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il est deux heures",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M23_2: LessonContent = {
  id: "fr-m23-2",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il est quelle heure ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M23_3: LessonContent = {
  id: "fr-m23-3",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Une heure, pas un heure",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M23_4: LessonContent = {
  id: "fr-m23-4",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "On va au cinéma à sept heures",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M23_5: LessonContent = {
  id: "fr-m23-5",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Cinq, six, sept heures",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: lesson5(),
};

const FR_M23_6: LessonContent = {
  id: "fr-m23-6",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Neuf, dix, onze, douze heures",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M23_7: LessonContent = {
  id: "fr-m23-7",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "On va à l'école",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M23_8: LessonContent = {
  id: "fr-m23-8",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Quelle heure ?",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson8(),
};

const FR_M23_9: LessonContent = {
  id: "fr-m23-9",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Onze, douze heures",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: lesson9(),
};

const FR_M23_10: LessonContent = {
  id: "fr-m23-10",
  moduleId: "m23",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Quatre, cinq, six heures",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson10(),
};

export const FR_M23_MODULE: FrModuleDef = {
  title: "Il est quelle heure ?",
  eyebrow: "Module 23",
  summary:
    "«Il est» has been pointing at people and things since m9 — «oui, il est très grand». Now it points at nothing at all, just the clock: «il est deux heures». Same two words, a new job — and every number you've owned since m1 is suddenly telling time.",
  lessons: [
    FR_M23_1,
    FR_M23_2,
    FR_M23_3,
    FR_M23_4,
    FR_M23_5,
    FR_M23_6,
    FR_M23_7,
    FR_M23_8,
    FR_M23_9,
    FR_M23_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M23_CHECKPOINT_INDEX = 8;

export const FR_M23_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m23-s",
    moduleId: "m23",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m23-s",
        prompt: "'It's two o'clock' — pick the French.",
        correctText: "il est deux heures",
        distractorsText: ["il est trois heures", "c'est deux heures", "il est deux heure"],
      }),
  },
  {
    id: "pt-fr-m23-1",
    moduleId: "m23",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m23-1",
        prompt: "'It's one o'clock' — pick the French.",
        correctText: "il est une heure",
        distractorsText: ["il est un heure", "il est deux heures", "c'est une heure"],
      }),
  },
  {
    id: "pt-fr-m23-2",
    moduleId: "m23",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m23-2",
        prompt: "'What time is it?' — pick the French.",
        correctText: "il est quelle heure ?",
        distractorsText: ["quelle heure il est ?", "il est quel heure ?", "tu vas où ?"],
      }),
  },
  {
    id: "pt-fr-m23-3",
    moduleId: "m23",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m23-3",
        prompt: "'We're going to the movies at seven o'clock' — pick the French.",
        correctText: "on va au cinéma à sept heures",
        distractorsText: [
          "on va au musée à sept heures",
          "on va au cinéma à huit heures",
          "on va au cinéma",
        ],
      }),
  },
  {
    id: "pt-fr-m23-4",
    moduleId: "m23",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m23-4",
        prompt: "'We're going to school at six o'clock' — pick the French.",
        correctText: "on va à l'école à six heures",
        distractorsText: [
          "on va au musée à six heures",
          "on va à l'école à sept heures",
          "on va à l'école",
        ],
      }),
  },
];
