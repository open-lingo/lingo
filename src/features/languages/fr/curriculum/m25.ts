/**
 * m25.ts — «C'est qui ?» — debut of the question word «qui»: the wh-in-situ
 * shape the course already owns («tu vas où ?» m5, «il est quelle heure ?»
 * m23) gets its third slot, "who".
 *
 * AUTHORED 2026-09-10 per docs/fr-m25-brief-2026-09-10.md, with every brief
 * claim checked against the live registries before writing a lesson step.
 * No brief claim was found false.
 *
 * SCOPE DECISIONS (recorded per the "never park a question" doctrine):
 *
 *   1. ATOMS — exactly two `kind: "phrase"` atoms, both `partOfSpeech:
 *      "phrase"`, no gender, NO EMOJI (a phrase doesn't get vendored art;
 *      only nouns do): «c'est qui ?» (fully graded — recognition, build,
 *      cloze, speaking) and «qui est-ce ?» (recognition-only — the
 *      fronted/written-register twin, NEVER a speaking, build, or
 *      production-cloze target). Because neither atom carries an emoji,
 *      `vocabMcq`/`word_image_mcq` are structurally unusable anywhere in
 *      this module for either atom's own debut or review; both debuts
 *      route through `word_map` (matching m24's "jus de pomme" precedent
 *      for a no-emoji multi-word phrase), and all cross-module vocabulary
 *      review routes through the hand-built `crossModuleVocabMcq`/
 *      `crossModuleMatchPairs` bypass functions (copied shape-identical
 *      from m21–m24), never through `vocabMcq`/`matchPairs`/`withArticle`.
 *
 *   2. THE REASONING MOMENT — L1 never asserts «c'est qui ?»; it deduces
 *      it. The learner already owns two wh-in-situ questions where the
 *      question word sits at the END, not the front: «tu vas où ?» (m5)
 *      and «il est quelle heure ?» (m23). «c'est qui ?» is the same slot,
 *      a third wh-word. No new grammar rule — the productive
 *      generalization of a pattern already taught twice.
 *
 *   3. THE SECOND ATOM'S ROLE — «qui est-ce ?» exists so the learner can
 *      RECOGNIZE the fronted/formal register (signs, written French, the
 *      classic "qui est-ce" greeting-card idiom) without ever being asked
 *      to produce it — production stays on the in-situ form the whole
 *      course has drilled. It debuts in L5 via info + word_map, and it
 *      earns its one required "answer position" (moduleContentLints.ts)
 *      as the correct CHOICE-mode option text of a `dialogue_sim` turn in
 *      both L5 and L8 — `m25.test.ts` bans it only from build-mode
 *      `.answer`/`speaking`/`build_sentence`/`particle_cloze` production
 *      targets, never from choice-mode option text, so this is fully
 *      compatible with every pin.
 *
 *   4. SPEECH SAFETY — no `speaking` step anywhere targets bare "qui"
 *      (always embedded in «c'est qui ?» or a longer recombination); «qui»
 *      is never paired with «oui» in any lesson's speaking or foil set (in
 *      fact «oui»/«non» are not used anywhere in this module at all — the
 *      safest way to guarantee zero accidental qui/oui minimal-pair risk
 *      under `frSpeechMinimalPairs.test.ts`). Every `cue: "recall"`
 *      speaking target reuses a phrase voiced verbatim earlier in course
 *      order, either an m1–m24 printed target (verified by direct grep:
 *      «il y a un café» m4, «tu vas où ?» m5, «c'est mon frère» / «c'est
 *      ma sœur» / «c'est mon père» m7) or a phrase this module itself
 *      voiced non-recall earlier in its own lesson order (L1's «c'est qui
 *      ?», L4's «c'est le frère de Léa»).
 *
 *   5. THE "d" CLITIC GAP — `getFrRealFormLexicon()` still has no "d"
 *      clitic derivation. This module never constructs «de» + vowel-onset
 *      word: every «de + Name» possession uses a consonant-onset name
 *      (Léa, Marie, Thomas, Sam — the m22-verified-safe list), same
 *      discipline m22/m24 already follow. The gap itself is out of scope.
 *
 *   6. FAMILY WORDS ARE m7, NOT m8 — verified directly against
 *      `m7.ts`: «frère», «sœur», «père», «famille», «mon», «ma» are all
 *      `fromModule: "m7"` atoms, with «c'est mon frère» / «c'est ma sœur»
 *      / «c'est mon père» already printed non-recall speaking targets
 *      there. The brief's framing ("family words are from m7") is
 *      confirmed, not assumed.
 *
 *   7. RECOMBINE MAP — cast names (Marie/Thomas/Léa/Sam, all proper-name
 *      exempt) + de-possession (m22's «de + Name» pattern, L4/L8/L10) +
 *      family (m7, interleaved L3/L4/L7/L8/L10) + time (m23's «heure(s)»,
 *      L9) + café (m1/m4, L1/L6/L8/L9/L10) — every lesson but the debuts
 *      folds «c'est qui ?» into at least one of these, so no lesson is
 *      pure recall padding even with only two atoms in the module.
 *
 *   8. SENTENCE-OVERUSE DISCIPLINE — `lintSentenceOveruse`
 *      (moduleBarGuards.ts) counts a normalized surface only on
 *      `build_sentence.targetSentence` / `speaking.targetPhrase` /
 *      `listening_comprehension.transcript` / `word_map.audioText` (never
 *      `particle_cloze`, never `multiple_choice`, never `match_pairs`),
 *      max 3x per lesson. L1 debuts «c'est qui ?» on exactly three such
 *      fields (word_map, speaking, build_sentence) and deliberately routes
 *      its listening-comprehension review to a DIFFERENT recalled phrase
 *      («il y a un café») rather than a fourth «c'est qui ?» hit — an
 *      earlier draft used «c'est qui ?» there too and would have tripped
 *      this exact lint at 4x.
 *
 *   9. CROSS-MODULE SAFETY — every reference to an m1–m24 atom routes
 *      through the hand-built bypass functions (decision 1); the only
 *      native, registry-backed calls in this module are the two atoms'
 *      own `word_map` debuts, which need no registry lookup at all.
 *
 *  10. TITLE TEMPLATE — L8's title "✓ Checkpoint · C'est qui ?" reuses
 *      m24's exact, verified-safe "✓ Checkpoint · C'est ouvert ?" clause
 *      pattern (`frTitleProvenance.test.ts` splits on "·"; the checkmark
 *      clause never French-votes, the French clause scans clean since all
 *      its tokens are taught).
 *
 *  11. NO NEW HOMOPHONES — neither atom carries a `homophoneKey`; this
 *      module introduces zero new homophone pairs (`HOMOPHONE_PAIRS = []`
 *      per m25.test.ts is a structural given, not a design choice).
 *
 * VOICING LEDGER (printed speak → licenses later cue:"recall"):
 *   c'est qui ? L1 · c'est le frère de Léa L4 · au café, c'est qui ? L6.
 *   recalls drawn: c'est qui ? L2+L5 (this module, L1) · c'est ma sœur
 *   L3+L8 (m7) · il y a un café L6 (m4) · c'est mon père L7 (m7) · c'est
 *   le frère de Léa L9 (this module, L4) · c'est mon frère L10 (m7).
 *   Total: 8 recall-cued speaking instances, comfortably clearing the
 *   m25.test.ts floor (m25Recalls >= 4).
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
 * crossModuleVocabMcq() precedent (m15/m21–m24.ts), bypassing the atom
 * registry. Used for every gloss-driven vocab/sentence MCQ that references
 * an m1–m24 atom (or this module's own two atoms) in this module.
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
 * m17–m24 route around. Used for EVERY match_pairs step in this module.
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

export const FR_M25_ATOMS: FrAtom[] = [
  atom({
    surface: "c'est qui ?",
    meaningEn: "who is it? / who's that?",
    partOfSpeech: "phrase",
    fromModule: "m25",
    kind: "phrase",
    hint: "say KEE — the same end-of-sentence question slot as «tu vas où ?» and «il est quelle heure ?»",
  }),
  atom({
    surface: "qui est-ce ?",
    meaningEn: "who is it? (formal / written)",
    partOfSpeech: "phrase",
    fromModule: "m25",
    kind: "phrase",
    hint: "kee ES-suh — the fronted, written-register twin; recognize it, never asked to say it",
  }),
];

/** L1 — debut: «c'est qui ?», deduced from the wh-in-situ shape the course
 *  already owns («tu vas où ?» m5, «il est quelle heure ?» m23). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m25-1-info-cestqui",
      "A third question at the end",
      "«Tu vas où ?» (m5) — the question word «où» sits at the END. «Il est quelle heure ?» (m23) — same slot, «quelle heure» at the end. Now a third: «C'est qui ?» — who is it? Same shape, new word: «qui», who.",
      "grammar",
    ),
    {
      id: "fr-m25-1-map-cestqui",
      type: "word_map",
      tokens: ["c'est", "qui"],
      pairs: [
        { en: "it's / that's", tokenIndex: 0 },
        { en: "who", tokenIndex: 1 },
      ],
      audioText: "c'est qui ?",
      revealNote: "Same end-of-sentence question slot as «tu vas où ?» — just swap the wh-word.",
    },
    crossModuleVocabMcq("fr-m25-1-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le café"]),
    speaking("fr-m25-1-speak-cestqui", "c'est qui ?", "who is it?", ["c'est qui ?"]),
    cloze(
      "fr-m25-1-cloze-cestqui",
      "c'est",
      "?",
      "qui",
      ["qui", "où"],
      "who is it?",
      "c'est qui ?",
      undefined,
      ["c'est qui ?"],
    ),
    build(
      "fr-m25-1-build-cestqui",
      "Build: 'Who is it?'",
      "c'est qui ?",
      ["c'est", "qui ?", "où ?", "tu vas"],
      ["c'est", "qui ?"],
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-1-mcq-ilyauncafe", "there is a cafe", "il y a un café", [
      "tu vas où ?",
      "c'est qui ?",
      "qui est-ce ?",
    ]),
    listeningCompSentence({
      id: "fr-m25-1-lc-ilyauncafe",
      audioText: "il y a un café",
      correctMeaningEn: "There's a café.",
      distractorsEn: ["Who is it?", "Where are you going?", "What time is it?"],
    }),
    crossModuleVocabMcq("fr-m25-1-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    crossModuleMatchPairs("fr-m25-1", [
      ["c'est qui ?", "who is it?"],
      ["tu vas où ?", "where are you going?"],
      ["il y a un café", "there's a café"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["famille", "family"],
    ]),
  ];
}

/** L2 — the cast: «c'est qui ?» answered with names. */
function lesson2(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-2-mcq-cestqui", "who is it?", "c'est qui ?", [
      "tu vas où ?",
      "il y a un café",
      "qui est-ce ?",
    ]),
    build(
      "fr-m25-2-build-cestmarie",
      "Build: 'It's Marie'",
      "c'est Marie",
      ["c'est", "Marie", "Thomas", "qui ?"],
      ["c'est", "Marie"],
      [],
    ),
    crossModuleVocabMcq("fr-m25-2-mcq-soeur", "sister", "la sœur", ["le frère", "la famille", "le café"]),
    speaking("fr-m25-2-speak-cestqui-recall", "c'est qui ?", "who is it?", ["c'est qui ?"], "recall"),
    listeningCompSentence({
      id: "fr-m25-2-lc-cestthomas",
      audioText: "c'est Thomas",
      correctMeaningEn: "It's Thomas.",
      distractorsEn: ["It's Marie.", "Who is it?", "There's a café."],
    }),
    crossModuleVocabMcq("fr-m25-2-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le café"]),
    build(
      "fr-m25-2-build-cestthomas",
      "Build: 'It's Thomas'",
      "c'est Thomas",
      ["c'est", "Thomas", "Marie", "qui ?"],
      ["c'est", "Thomas"],
      [],
    ),
    crossModuleVocabMcq("fr-m25-2-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    cloze(
      "fr-m25-2-cloze-cestqui",
      "c'est",
      "?",
      "qui",
      ["qui", "où"],
      "who is it?",
      "c'est qui ?",
      undefined,
      ["c'est qui ?"],
    ),
    crossModuleMatchPairs("fr-m25-2", [
      ["c'est qui ?", "who is it?"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["famille", "family"],
      ["tu vas où ?", "where are you going?"],
      ["il y a un café", "there's a café"],
    ]),
  ];
}

/** L3 — family recombine: «c'est qui ? c'est ma sœur.» Recalls m7's
 *  printed «c'est ma sœur». */
function lesson3(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-3-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le café"]),
    build(
      "fr-m25-3-build-cestmasoeur",
      "Build: 'It's my sister'",
      "c'est ma sœur",
      ["c'est", "ma sœur", "mon frère", "qui ?"],
      ["c'est", "ma sœur"],
      ["ma", "sœur"],
    ),
    crossModuleVocabMcq("fr-m25-3-mcq-cestqui", "who is it?", "c'est qui ?", [
      "tu vas où ?",
      "il y a un café",
      "qui est-ce ?",
    ]),
    speaking("fr-m25-3-speak-cestmasoeur-recall", "c'est ma sœur", "that's my sister", ["ma", "sœur"], "recall"),
    cloze(
      "fr-m25-3-cloze-cestqui",
      "c'est",
      "?",
      "qui",
      ["qui", "où"],
      "who is it?",
      "c'est qui ?",
      undefined,
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-3-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    build(
      "fr-m25-3-build-cestmonfrere",
      "Build: 'It's my brother'",
      "c'est mon frère",
      ["c'est", "mon frère", "ma sœur", "qui ?"],
      ["c'est", "mon frère"],
      ["mon", "frère"],
    ),
    crossModuleVocabMcq("fr-m25-3-mcq-cafe", "there is a cafe", "il y a un café", [
      "c'est qui ?",
      "tu vas où ?",
      "qui est-ce ?",
    ]),
    listeningCompSentence({
      id: "fr-m25-3-lc-cestmasoeur",
      audioText: "c'est ma sœur",
      correctMeaningEn: "That's my sister.",
      distractorsEn: ["That's my brother.", "Who is it?", "There's a café."],
    }),
    crossModuleMatchPairs("fr-m25-3", [
      ["c'est qui ?", "who is it?"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["famille", "family"],
      ["mon", "my (m)"],
      ["ma", "my (f)"],
    ]),
  ];
}

/** L4 — de-possession (m22) + family (m7): «c'est le frère de Léa.» New
 *  printed speaking target, licensing later recall. */
function lesson4(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-4-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le café"]),
    build(
      "fr-m25-4-build-lefreredelea",
      "Build: \"It's Léa's brother\"",
      "c'est le frère de Léa",
      ["c'est", "le frère", "de Léa", "de Marie"],
      ["c'est", "le frère", "de Léa"],
      ["frère"],
    ),
    crossModuleVocabMcq("fr-m25-4-mcq-cestqui", "who is it?", "c'est qui ?", [
      "tu vas où ?",
      "il y a un café",
      "qui est-ce ?",
    ]),
    speaking("fr-m25-4-speak-lefreredelea", "c'est le frère de Léa", "that's Léa's brother", ["frère"]),
    build(
      "fr-m25-4-build-lasoeurdelea",
      "Build: \"It's Léa's sister\"",
      "c'est la sœur de Léa",
      ["c'est", "la sœur", "de Léa", "de Thomas"],
      ["c'est", "la sœur", "de Léa"],
      ["sœur"],
    ),
    crossModuleVocabMcq("fr-m25-4-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    build(
      "fr-m25-4-build-lasoeurdethomas",
      "Build: \"It's Thomas's sister\"",
      "c'est la sœur de Thomas",
      ["c'est", "la sœur", "de Thomas", "de Léa"],
      ["c'est", "la sœur", "de Thomas"],
      ["sœur"],
    ),
    crossModuleVocabMcq("fr-m25-4-mcq-pere", "father", "le père", ["le frère", "la sœur", "la famille"]),
    listeningCompSentence({
      id: "fr-m25-4-lc-lefreredelea",
      audioText: "c'est le frère de Léa",
      correctMeaningEn: "That's Léa's brother.",
      distractorsEn: ["That's Léa's sister.", "Who is it?", "There's a café."],
    }),
    crossModuleMatchPairs("fr-m25-4", [
      ["c'est qui ?", "who is it?"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["famille", "family"],
      ["mon", "my (m)"],
      ["ma", "my (f)"],
    ]),
  ];
}

/** L5 — debut: «qui est-ce ?», the fronted/formal twin. Recognition only —
 *  its one required answer position is the correct CHOICE-mode option of a
 *  dialogue_sim turn. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m25-5-info-quiestce",
      "The formal twin",
      "«C'est qui ?» is what you SAY. «Qui est-ce ?» is the same question, fronted and formal — the one you'll READ (signs, written French, the classic greeting-card line). Recognize it; you'll never be asked to say it.",
      "grammar",
    ),
    {
      id: "fr-m25-5-map-quiestce",
      type: "word_map",
      tokens: ["qui", "est-ce"],
      pairs: [
        { en: "who", tokenIndex: 0 },
        { en: "is it", tokenIndex: 1 },
      ],
      audioText: "qui est-ce ?",
      revealNote: "Same meaning as «c'est qui ?», fronted — recognize it, don't produce it.",
    },
    crossModuleVocabMcq("fr-m25-5-mcq-pere", "father", "le père", ["le frère", "la sœur", "la famille"]),
    build(
      "fr-m25-5-build-lasoeurdemarie",
      "Build: \"It's Marie's sister\"",
      "c'est la sœur de Marie",
      ["c'est", "la sœur", "de Marie", "de Léa"],
      ["c'est", "la sœur", "de Marie"],
      ["sœur"],
    ),
    crossModuleVocabMcq("fr-m25-5-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    speaking("fr-m25-5-speak-cestqui-recall", "c'est qui ?", "who is it?", ["c'est qui ?"], "recall"),
    build(
      "fr-m25-5-build-lefreredemarie",
      "Build: \"It's Marie's brother\"",
      "c'est le frère de Marie",
      ["c'est", "le frère", "de Marie", "de Léa"],
      ["c'est", "le frère", "de Marie"],
      ["frère"],
    ),
    crossModuleVocabMcq("fr-m25-5-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le café"]),
    listeningCompSentence({
      id: "fr-m25-5-lc-quiestce",
      audioText: "qui est-ce ?",
      correctMeaningEn: "Who is it? (formal)",
      distractorsEn: ["Who is it?", "Where are you going?", "There's a café."],
    }),
    {
      id: "fr-m25-5-sim-toctoc",
      type: "dialogue_sim",
      scene: { emoji: "🚪", title: "C'est qui ?", setting: "Someone's at the door." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-toctoc",
          npc: {
            speaker: "Camille",
            kana: "Bonjour !",
            audioText: "bonjour !",
            gloss: "Hello!",
          },
          goal: "Ask who it is, formally.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "qui est-ce ?" },
              { id: "wrong-cafe", text: "il y a un café" },
              { id: "wrong-ou", text: "tu vas où ?" },
            ],
            correctOptionId: "correct",
            audioText: "qui est-ce ?",
          },
          replyGloss: "Who is it?",
        },
        {
          id: "t2-cestmarie",
          npc: {
            speaker: "Camille",
            kana: "C'est Marie !",
            audioText: "c'est Marie !",
            gloss: "It's Marie!",
          },
          goal: "Say who it is: Marie.",
          reply: {
            mode: "build",
            tiles: ["c'est", "Marie", "Thomas", "qui ?"],
            answer: "c'est Marie",
            audioText: "c'est Marie",
          },
          replyGloss: "It's Marie.",
        },
      ],
    },
    crossModuleVocabMcq("fr-m25-5-mcq-cestqui2", "who is it?", "c'est qui ?", [
      "qui est-ce ?",
      "tu vas où ?",
      "il y a un café",
    ]),
    crossModuleMatchPairs("fr-m25-5", [
      ["c'est qui ?", "who is it?"],
      ["qui est-ce ?", "who is it? (formal)"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["famille", "family"],
      ["tu vas où ?", "where are you going?"],
    ]),
  ];
}

/** L6 — café recombine: «au café, c'est qui ?» New printed speaking
 *  target; recalls m4's «il y a un café». */
function lesson6(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-6-mcq-cafe", "there is a cafe", "il y a un café", [
      "c'est qui ?",
      "tu vas où ?",
      "qui est-ce ?",
    ]),
    build(
      "fr-m25-6-build-aucafecestqui",
      "Build: 'At the café, who is it?'",
      "au café, c'est qui ?",
      ["au café,", "c'est qui ?", "tu vas où ?", "il y a un café"],
      ["au café,", "c'est qui ?"],
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-6-mcq-soeur", "sister", "la sœur", ["le frère", "la famille", "le café"]),
    speaking("fr-m25-6-speak-aucafecestqui", "au café, c'est qui ?", "at the café, who is it?", ["c'est qui ?"]),
    cloze(
      "fr-m25-6-cloze-aucafe",
      "au café, c'est",
      "?",
      "qui",
      ["qui", "où"],
      "at the café, who is it?",
      "au café, c'est qui ?",
      undefined,
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-6-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    build(
      "fr-m25-6-build-ilyauncafe",
      "Build: 'there's a café'",
      "il y a un café",
      ["il y a", "un café", "une famille", "c'est qui"],
      ["il y a", "un café"],
      [],
    ),
    crossModuleVocabMcq("fr-m25-6-mcq-heure", "hour / o'clock", "l'heure", ["le frère", "la sœur", "la famille"]),
    speaking("fr-m25-6-speak-ilyauncafe-recall", "il y a un café", "there's a café", [], "recall"),
    crossModuleMatchPairs("fr-m25-6", [
      ["c'est qui ?", "who is it?"],
      ["il y a un café", "there's a café"],
      ["tu vas où ?", "where are you going?"],
      ["famille", "family"],
      ["frère", "brother"],
      ["sœur", "sister"],
    ]),
  ];
}

/** L7 — family recombine: «la famille, c'est qui ?» Recalls m7's «c'est
 *  mon père». */
function lesson7(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-7-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le café"]),
    build(
      "fr-m25-7-build-lafamillecestqui",
      "Build: 'The family, who is it?'",
      "la famille, c'est qui ?",
      ["la famille,", "c'est qui ?", "le frère,", "tu vas où ?"],
      ["la famille,", "c'est qui ?"],
      ["famille", "c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-7-mcq-pere", "father", "le père", ["le frère", "la sœur", "la famille"]),
    speaking("fr-m25-7-speak-cestmonpere-recall", "c'est mon père", "that's my father", ["mon", "père"], "recall"),
    cloze(
      "fr-m25-7-cloze-lafamille",
      "la famille, c'est",
      "?",
      "qui",
      ["qui", "où"],
      "the family, who is it?",
      "la famille, c'est qui ?",
      undefined,
      ["c'est qui ?", "famille"],
    ),
    crossModuleVocabMcq("fr-m25-7-mcq-cestqui", "who is it?", "c'est qui ?", [
      "tu vas où ?",
      "il y a un café",
      "qui est-ce ?",
    ]),
    build(
      "fr-m25-7-build-cestmonpere",
      "Build: 'It's my father'",
      "c'est mon père",
      ["c'est", "mon père", "ma sœur", "qui ?"],
      ["c'est", "mon père"],
      ["mon", "père"],
    ),
    crossModuleVocabMcq("fr-m25-7-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le père"]),
    listeningCompSentence({
      id: "fr-m25-7-lc-lafamillecestqui",
      audioText: "la famille, c'est qui ?",
      correctMeaningEn: "The family, who is it?",
      distractorsEn: ["Who is it?", "Where are you going?", "There's a café."],
    }),
    crossModuleMatchPairs("fr-m25-7", [
      ["c'est qui ?", "who is it?"],
      ["famille", "family"],
      ["père", "father"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["mon", "my (m)"],
    ]),
  ];
}

/** L8 — checkpoint: zero new atoms, all graded, 12–22 steps. Recombines
 *  every thread (cast, de-possession, family, café, both atoms) and cashes
 *  in «qui est-ce ?»'s second required answer position. */
function lesson8(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-8-mcq-cestqui", "who is it?", "c'est qui ?", [
      "tu vas où ?",
      "il y a un café",
      "qui est-ce ?",
    ]),
    build(
      "fr-m25-8-build-lasoeurdelea",
      "Build: \"It's Léa's sister\"",
      "c'est la sœur de Léa",
      ["c'est", "la sœur", "de Léa", "de Marie"],
      ["c'est", "la sœur", "de Léa"],
      ["sœur"],
    ),
    crossModuleVocabMcq("fr-m25-8-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le père"]),
    speaking("fr-m25-8-speak-cestmasoeur-recall", "c'est ma sœur", "that's my sister", ["ma", "sœur"], "recall"),
    build(
      "fr-m25-8-build-lefreredethomas",
      "Build: \"It's Thomas's brother\"",
      "c'est le frère de Thomas",
      ["c'est", "le frère", "de Thomas", "de Léa"],
      ["c'est", "le frère", "de Thomas"],
      ["frère"],
    ),
    crossModuleVocabMcq("fr-m25-8-mcq-pere", "father", "le père", ["le frère", "la sœur", "la famille"]),
    build(
      "fr-m25-8-build-aucafecestqui",
      "Build: 'At the café, who is it?'",
      "au café, c'est qui ?",
      ["au café,", "c'est qui ?", "la famille,", "il y a un café"],
      ["au café,", "c'est qui ?"],
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-8-mcq-heure", "hour / o'clock", "l'heure", ["le frère", "la sœur", "la famille"]),
    listeningCompSentence({
      id: "fr-m25-8-lc-quiestce",
      audioText: "qui est-ce ?",
      correctMeaningEn: "Who is it? (formal)",
      distractorsEn: ["Who is it?", "Where are you going?", "There's a café."],
    }),
    {
      id: "fr-m25-8-sim-checkpoint",
      type: "dialogue_sim",
      scene: { emoji: "🚪", title: "C'est qui, encore ?", setting: "The door again." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-toctoc",
          npc: {
            speaker: "Camille",
            kana: "Bonjour !",
            audioText: "bonjour !",
            gloss: "Hello!",
          },
          goal: "Ask who it is, formally.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "qui est-ce ?" },
              { id: "wrong-cafe", text: "il y a un café" },
              { id: "wrong-ou", text: "tu vas où ?" },
            ],
            correctOptionId: "correct",
            audioText: "qui est-ce ?",
          },
          replyGloss: "Who is it?",
        },
        {
          id: "t2-cestmarie",
          npc: {
            speaker: "Camille",
            kana: "C'est Marie !",
            audioText: "c'est Marie !",
            gloss: "It's Marie!",
          },
          goal: "Say who it is: Marie.",
          reply: {
            mode: "build",
            tiles: ["c'est", "Marie", "Thomas", "qui ?"],
            answer: "c'est Marie",
            audioText: "c'est Marie",
          },
          replyGloss: "It's Marie.",
        },
      ],
    },
    crossModuleVocabMcq("fr-m25-8-mcq-soeur", "sister", "la sœur", ["le frère", "la famille", "le père"]),
    build(
      "fr-m25-8-build-cestmonpere",
      "Build: 'It's my father'",
      "c'est mon père",
      ["c'est", "mon père", "ma sœur", "qui ?"],
      ["c'est", "mon père"],
      ["mon", "père"],
    ),
    crossModuleVocabMcq("fr-m25-8-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le père"]),
    crossModuleMatchPairs("fr-m25-8", [
      ["c'est qui ?", "who is it?"],
      ["qui est-ce ?", "who is it? (formal)"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["père", "father"],
      ["famille", "family"],
    ]),
  ];
}

/** L9 — integration: café + time (m23) + cast, all folded into a
 *  dialogue_sim. Recalls L4's «c'est le frère de Léa». */
function lesson9(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-9-mcq-heures", "hours / o'clock", "les heures", ["le frère", "la sœur", "la famille"]),
    build(
      "fr-m25-9-build-aucafeaveclea",
      "Build: 'At the café with Léa'",
      "au café avec Léa",
      ["au café", "avec Léa", "avec Marie", "c'est qui ?"],
      ["au café", "avec Léa"],
      [],
    ),
    crossModuleVocabMcq("fr-m25-9-mcq-cestqui", "who is it?", "c'est qui ?", [
      "qui est-ce ?",
      "tu vas où ?",
      "il y a un café",
    ]),
    speaking(
      "fr-m25-9-speak-lefreredelea-recall",
      "c'est le frère de Léa",
      "that's Léa's brother",
      ["frère"],
      "recall",
    ),
    cloze(
      "fr-m25-9-cloze-aucafe",
      "au café, c'est",
      "?",
      "qui",
      ["qui", "où"],
      "at the café, who is it?",
      "au café, c'est qui ?",
      undefined,
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-9-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le père"]),
    build(
      "fr-m25-9-build-ilestdeuxheures",
      "Build: 'It's two o'clock'",
      "il est deux heures",
      ["il est", "deux heures", "trois heures", "c'est qui"],
      ["il est", "deux heures"],
      [],
    ),
    crossModuleVocabMcq("fr-m25-9-mcq-soeur", "sister", "la sœur", ["le frère", "la famille", "le père"]),
    listeningCompSentence({
      id: "fr-m25-9-lc-aucafeaveclea",
      audioText: "au café avec Léa",
      correctMeaningEn: "At the café with Léa.",
      distractorsEn: ["At the café with Marie.", "Who is it?", "There's a café."],
    }),
    {
      id: "fr-m25-9-sim-aucafe",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Au café avec Léa", setting: "Two o'clock, the usual table." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-quiestce",
          npc: {
            speaker: "Léa",
            kana: "Il est deux heures. Qui est-ce ?",
            audioText: "il est deux heures. qui est-ce ?",
            gloss: "It's two o'clock. Who is it? (formal)",
          },
          goal: "Say it's Thomas.",
          reply: {
            mode: "build",
            tiles: ["c'est", "Thomas", "Marie", "qui ?"],
            answer: "c'est Thomas",
            audioText: "c'est Thomas",
          },
          replyGloss: "It's Thomas.",
        },
        {
          id: "t2-lafamille",
          npc: {
            speaker: "Léa",
            kana: "Et la famille, c'est qui ?",
            audioText: "et la famille, c'est qui ?",
            gloss: "And the family, who is it?",
          },
          goal: "Say it's my sister and my brother.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "c'est ma sœur et mon frère" },
              { id: "wrong-1", text: "c'est qui ?" },
              { id: "wrong-2", text: "il y a un café" },
            ],
            correctOptionId: "correct",
            audioText: "c'est ma sœur et mon frère",
          },
          replyGloss: "It's my sister and my brother.",
        },
      ],
    },
    crossModuleVocabMcq("fr-m25-9-mcq-frere", "brother", "le frère", ["la sœur", "la famille", "le père"]),
    crossModuleMatchPairs("fr-m25-9", [
      ["c'est qui ?", "who is it?"],
      ["qui est-ce ?", "who is it? (formal)"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["famille", "family"],
      ["heures", "hours / o'clock"],
    ]),
  ];
}

/** L10 — mastery: all graded, zero info cards, ends on a dialogue_sim that
 *  cashes in the module's own title question — «C'est qui, ça ?» — with
 *  the whole cast, family, café, and de-possession threads folded in. */
function lesson10(): LessonStep[] {
  return [
    crossModuleVocabMcq("fr-m25-10-mcq-quiestce", "who is it? (formal)", "qui est-ce ?", [
      "c'est qui ?",
      "tu vas où ?",
      "il y a un café",
    ]),
    build(
      "fr-m25-10-build-lafamillecestqui",
      "Build: 'The family, who is it?'",
      "la famille, c'est qui ?",
      ["la famille,", "c'est qui ?", "le frère,", "tu vas où ?"],
      ["la famille,", "c'est qui ?"],
      ["famille", "c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-10-mcq-pere", "father", "le père", ["le frère", "la sœur", "la famille"]),
    speaking("fr-m25-10-speak-cestmonfrere-recall", "c'est mon frère", "that's my brother", ["mon", "frère"], "recall"),
    build(
      "fr-m25-10-build-lasoeurdesam",
      "Build: \"It's Sam's sister\"",
      "c'est la sœur de Sam",
      ["c'est", "la sœur", "de Sam", "de Thomas"],
      ["c'est", "la sœur", "de Sam"],
      ["sœur"],
    ),
    crossModuleVocabMcq("fr-m25-10-mcq-famille", "family", "la famille", ["le frère", "la sœur", "le père"]),
    build(
      "fr-m25-10-build-aucafecestqui",
      "Build: 'At the café, who is it?'",
      "au café, c'est qui ?",
      ["au café,", "c'est qui ?", "la famille,", "il y a un café"],
      ["au café,", "c'est qui ?"],
      ["c'est qui ?"],
    ),
    crossModuleVocabMcq("fr-m25-10-mcq-cestqui", "who is it?", "c'est qui ?", [
      "qui est-ce ?",
      "tu vas où ?",
      "il y a un café",
    ]),
    crossModuleMatchPairs("fr-m25-10", [
      ["c'est qui ?", "who is it?"],
      ["qui est-ce ?", "who is it? (formal)"],
      ["frère", "brother"],
      ["sœur", "sister"],
      ["père", "father"],
      ["famille", "family"],
    ]),
    crossModuleVocabMcq("fr-m25-10-mcq-heure", "hour / o'clock", "l'heure", ["le frère", "la sœur", "la famille"]),
    {
      id: "fr-m25-10-sim-cestqui",
      type: "dialogue_sim",
      scene: { emoji: "🖼️", title: "C'est qui, ça ?", setting: "A photo on the table." },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-cettephoto",
          npc: {
            speaker: "Sam",
            kana: "C'est qui, ça ?",
            audioText: "c'est qui, ça ?",
            gloss: "Who's that?",
          },
          goal: "Say it's your sister.",
          reply: {
            mode: "build",
            tiles: ["c'est", "ma sœur", "mon frère", "qui ?"],
            answer: "c'est ma sœur",
            audioText: "c'est ma sœur",
          },
          replyGloss: "That's my sister.",
        },
        {
          id: "t2-etlui",
          npc: {
            speaker: "Sam",
            kana: "Et lui, qui est-ce ?",
            audioText: "et lui, qui est-ce ?",
            gloss: "And him, who is he? (formal)",
          },
          goal: "Say it's your brother.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "c'est mon frère" },
              { id: "wrong-1", text: "c'est ma sœur" },
              { id: "wrong-2", text: "il y a un café" },
            ],
            correctOptionId: "correct",
            audioText: "c'est mon frère",
          },
          replyGloss: "That's my brother.",
        },
      ],
    },
  ];
}

const FR_M25_1: LessonContent = {
  id: "fr-m25-1",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est qui ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M25_2: LessonContent = {
  id: "fr-m25-2",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est Marie, c'est Thomas",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M25_3: LessonContent = {
  id: "fr-m25-3",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est qui ? C'est ma sœur",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M25_4: LessonContent = {
  id: "fr-m25-4",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est le frère de Léa",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M25_5: LessonContent = {
  id: "fr-m25-5",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Qui est-ce ?",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: lesson5(),
};

const FR_M25_6: LessonContent = {
  id: "fr-m25-6",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Au café, c'est qui ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M25_7: LessonContent = {
  id: "fr-m25-7",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "La famille, c'est qui ?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M25_8: LessonContent = {
  id: "fr-m25-8",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · C'est qui ?",
  estimatedMinutes: 11,
  xpReward: 30,
  steps: lesson8(),
};

const FR_M25_9: LessonContent = {
  id: "fr-m25-9",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Au café avec Léa",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson9(),
};

const FR_M25_10: LessonContent = {
  id: "fr-m25-10",
  moduleId: "m25",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "C'est qui, ça ?",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: lesson10(),
};

export const FR_M25_MODULE: FrModuleDef = {
  title: "C'est qui ?",
  eyebrow: "Module 25",
  summary:
    "A third wh-in-situ question joins «tu vas où ?» (m5) and «il est quelle heure ?» (m23): «c'est qui ?», who is it. The whole recurring cast — Marie, Thomas, Léa, Sam — answers it, folded through de-possession (m22), family (m7), café (m1/m4), and time (m23). «Qui est-ce ?», the fronted written twin, joins as a recognition-only second atom.",
  lessons: [
    FR_M25_1,
    FR_M25_2,
    FR_M25_3,
    FR_M25_4,
    FR_M25_5,
    FR_M25_6,
    FR_M25_7,
    FR_M25_8,
    FR_M25_9,
    FR_M25_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M25_CHECKPOINT_INDEX = 8;

export const FR_M25_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m25-s",
    moduleId: "m25",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m25-s",
        prompt: "'Who is it?' — pick the French.",
        correctText: "c'est qui ?",
        distractorsText: ["qui est-ce ?", "tu vas où ?", "il y a un café"],
      }),
  },
  {
    id: "pt-fr-m25-1",
    moduleId: "m25",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m25-1",
        prompt: "'Who is it? (formal)' — pick the French.",
        correctText: "qui est-ce ?",
        distractorsText: ["c'est qui ?", "tu vas où ?", "il y a un café"],
      }),
  },
  {
    id: "pt-fr-m25-2",
    moduleId: "m25",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m25-2",
        prompt: "'That's my sister' — pick the French.",
        correctText: "c'est ma sœur",
        distractorsText: ["c'est mon frère", "c'est ma famille", "c'est qui ?"],
      }),
  },
  {
    id: "pt-fr-m25-3",
    moduleId: "m25",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m25-3",
        prompt: "\"That's Léa's brother\" — pick the French.",
        correctText: "c'est le frère de Léa",
        distractorsText: ["c'est la sœur de Léa", "c'est le frère de Marie", "c'est qui ?"],
      }),
  },
  {
    id: "pt-fr-m25-4",
    moduleId: "m25",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m25-4",
        prompt: "'At the café, who is it?' — pick the French.",
        correctText: "au café, c'est qui ?",
        distractorsText: ["au café, qui est-ce ?", "il y a un café", "tu vas où ?"],
      }),
  },
];
