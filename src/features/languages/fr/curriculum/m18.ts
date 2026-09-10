/**
 * m18.ts — «Jamais, rien, plus» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m18-brief-2026-09-10.md: the second
 * negation pass. The learner already owns the base frame from m2/m13/m14
 * («ne ... pas» — never registered as atoms itself, a frame the course
 * teaches through use, not through a vocab card for «ne» or «pas»). This
 * module swaps the second half of that frame for three new words — jamais
 * (never), rien (nothing), plus (no longer / no more) — teaching the
 * SAME machine with a new plug-in, not a new grammar engine.
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - New atoms: exactly two — «jamais» and «rien». «Plus» gets NO new
 *     atom: verified in code (moduleBarGuards.ts FR_FUNCTION_WORDS,
 *     read in full) that «plus» is ALREADY pre-authorized chrome
 *     alongside «ne»/«pas»/«jamais»/«rien» themselves, and separately
 *     already tokenizes into the real-form lexicon via m13's registered
 *     phrase atom «moi non plus» (fromModule m13, kind "phrase") — its
 *     full surface is split word-by-word into the taught-token set, so
 *     "plus" is already a legal token with zero new registration. This
 *     extends the exact same "ne...pas is a frame, not two atoms"
 *     precedent the course already sets for «ne»/«pas» (verified: neither
 *     has ever been registered as an atom in m1-m17) to «jamais»/«rien»/
 *     «plus» — negation particles are FRAME vocabulary, taught through
 *     use, not vocab-carded like nouns.
 *   - «plus» still needs teaching, because the surface is not NEW to the
 *     learner — «moi non plus» ("me neither") already put it in their ear
 *     with a completely different grammatical job (an idiom, not a
 *     productive frame). This is a COMPREHENSION-COLLISION problem, not a
 *     phonetic one: the learner must relearn what an already-familiar
 *     sound does. L7 is a dedicated bridge lesson that names the
 *     collision explicitly (quotes both the old idiom and the new frame
 *     side by side) rather than assuming the new sense transfers for
 *     free.
 *   - No `homophoneKey`/`hAspire`/`consonantOnset` flags needed on jamais
 *     or rien — both are plain vowel-final/consonant-shape words with no
 *     elision or liaison exception (verified against m17's own precedent
 *     of only flagging the lexical exceptions that need it — onze/huit).
 *
 * BRIEF-CLAIM CORRECTIONS (task instruction: verify each claim in code,
 * adapt if false — four of the brief's own suggested example sentences
 * turned out mechanically false on inspection of the atom registry):
 *   1. Brief's L2 sentence «il n'est jamais content» — the brief itself
 *      flagged this uncertain. Verified via m15.ts:34 header: the
 *      optional «content»/«contente» atom was explicitly CUT from m15's
 *      own brief ("coverage..."). Confirmed nowhere in m1-m17. FIX: L2's
 *      cast-consolidation avoids adjective-predicate sentences entirely
 *      and instead extends jamais across the il/elle/on avoir+savoir
 *      cast (aimer/habiter/avoir all have il/elle/on forms registered in
 *      m11/m14, unlike savoir's "sait" which is nowhere — savoir stays
 *      je/tu only throughout this module).
 *   2. Brief's L4 sentence «je ne mange rien» — verified via grep: bare
 *      "mange"/"manges" (present-tense manger) is registered NOWHERE;
 *      only "manger" (infinitive) and "mangé" (past participle, both
 *      m14) exist. FIX: L3/L4 use the negated-avoir + participle frame
 *      instead («je n'ai rien mangé» / «je n'ai rien»), which is both
 *      mechanically legal (via m13's "je n'ai pas de" phrase atom
 *      tokenizing "n'ai" into the real-form lexicon, and m14's own
 *      directly-registered "n'a" atom) and a more natural passé-composé
 *      negation than the brief's present-tense suggestion.
 *   3. Brief's L5 sentence «elle ne comprend rien» — verified via grep:
 *      bare "comprend" (il/elle, no final s) is registered NOWHERE; only
 *      "comprends" (je/tu, same spelling) exists via m2's "je ne
 *      comprends pas" phrase atom. FIX: L5 uses je/tu subjects only —
 *      «je ne comprends rien» / «tu ne comprends rien» — both freshly
 *      composed NEW sentences (not recalls of "je ne comprends pas",
 *      which has no prior non-recall voicing anywhere and so could never
 *      legally be a `speaking(...,"recall")` target regardless).
 *   4. Brief's L7 primary suggestion «je ne fume plus» — verified via
 *      grep: "fume"/"fumer" registered NOWHERE. FIX: L7 uses «il n'habite
 *      plus à Paris» (one of the brief's own alternates) — "habite" is
 *      vowel-onset (m11.ts:158, no `hAspire`/`consonantOnset` flag set,
 *      confirmed by direct read of the atom() call; elidesBefore()
 *      derives «n'habite» automatically via getFrRealFormLexicon()'s
 *      clitic loop) — plus «il n'y a plus de gâteau» / «je n'ai plus de
 *      chocolat», covering the brief's own "nothing left" real-use
 *      framing directly.
 *
 * SPEECH-NEGATION CONSTRAINTS (coordinator update, committed 807d3205,
 * docs/fr-speech-negation-2026-09-10.md — applied throughout):
 *   1. ne-dropped hearings of jamais/rien grade safely, same as «pas» —
 *      full-sentence `speaking` targets containing jamais/rien are used
 *      freely (L1-L6, L9, L10).
 *   2. NEVER an isolated bare-word speaking target for «jamais» alone
 *      (the written substring "mais" risks a false-positive loose-match
 *      on the unrelated word «mais»/"but") — every jamais speaking target
 *      in this module is a full sentence; bare "jamais" only ever appears
 *      written (word_map/cloze/build/sentenceMcq).
 *   3. jamais-vs-rien (and rien-vs-bien) discrimination is tested via
 *      build/cloze/sentenceMcq ONLY, never via a `speaking` step — see
 *      L5's contrast block and every sentenceMcq pitting the two against
 *      each other or against «bien».
 *   4. no «encore» recall is ever paired against a «ne...plus» target as
 *      spoken alternates — trivially satisfied: «plus» negation is never
 *      spoken anywhere in this module (constraint 5), so no such pairing
 *      can occur.
 *   5. L7's negative «plus» content is WRITTEN-ONLY — no `speaking` step
 *      and no `listening_comprehension` step ever targets a «ne...plus»
 *      sentence anywhere in the module (not just L7), pending an
 *      edge-tts clip confirming the silent-s negator pronunciation
 *      differs correctly from the pronounced-s "more" sense. `cloze`'s
 *      reference audioText (an optional tap-to-hear icon, never graded
 *      by ear) and `match_pairs`' playAudioOnSelect are kept — consistent
 *      with m17.ts's own "written-only band" precedent (the 70-99
 *      numbers still carry reference audio on cloze/match_pairs, only
 *      `speaking` targets were banned). Every TEACHING lesson still needs
 *      ≥1 spoken step (fr-quality.test.ts's production law) — L7 supplies
 *      it with a safe internal recall of already-established rien content
 *      («je n'ai rien»), never touching plus.
 *
 * "Real use, not a bare list" (task instruction): jamais/rien ride the
 * negated-avoir + participle frame («je n'ai jamais/rien mangé...») and
 * the être-side passé composé (allé/venu, masculine-speaking only per
 * m16's own silent-gender discipline — feminine allée/venue stay
 * written-only, same rule m16 set for itself). L9's integration lesson
 * closes on a café-refusal dialogue_sim («rien pour moi, merci» / «non,
 * je n'aime pas ça») and L10's mastery sim closes on a "nothing left /
 * I've never..." exchange — both built entirely from taught vocabulary,
 * manually audited turn-by-turn since `frSurfaces()` (moduleBarGuards.ts)
 * has no `dialogue_sim` case and is blind to sim content.
 *
 * Cast: reuses m17's Théo (market/café) for L9's sim; introduces Léa
 * (already an FR_PROPER_NAMES entry) for L10's capstone sim.
 *
 * VOICING LEDGER — every `cue:"recall"` step and its non-recall source:
 *   - L2 "il n'a jamais mangé de croissant" recalls L1's own debut
 *     (fr-m18-1-speak-croissant, non-recall).
 *   - L2 "il parle français" recalls m11's own established voicing
 *     (mirrors m17.ts's own reuse of this exact phrase).
 *   - L4 "je voudrais un croissant" recalls m6's own first voicing —
 *     reach-back beyond m11-m17, same phrase m17.ts itself reached for.
 *   - L4 "je n'ai rien" recalls L3's own debut (fr-m18-3-speak-rien).
 *   - L6 "je n'ai jamais mangé de croissant" recalls L1's debut again.
 *   - L6 "bonjour" recalls m1's own first voicing (fr-m1v2-1-speak-
 *     bonjour) — the second reach-back-beyond-m11-m17 recall.
 *   - L7 "je n'ai rien" recalls L3's debut — deliberately NOT plus
 *     content, satisfying the production law without breaking the
 *     written-only constraint.
 *   - L9 "je ne sais jamais" recalls L2's own debut (fr-m18-2-speak-
 *     saisjamais).
 *   Total: 8 recalls, 2 reaching further back than m11-m17 (bonjour=m1,
 *   je voudrais un croissant=m6), matching m17.ts's own "2-3 reach-back"
 *   pattern.
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
 * but bypassing the atom registry — same m2-m9 ordering landmine as
 * `crossModuleVocabMcq` above, plus it sidesteps the ≥6-surfaces /
 * registered-surface requirement entirely (several pairs below name a
 * grammatical ROLE — "sais", "comprends" — that is a legal TOKEN via an
 * existing phrase atom's tokenization but is not itself a standalone
 * registered atom surface). Used for EVERY match_pairs step in this
 * module, mirroring m17.ts's own uniform use of this helper even for
 * pairs entirely sourced from m18's own atoms.
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

export const FR_M18_ATOMS: FrAtom[] = [
  atom({
    surface: "jamais",
    meaningEn: "never (with ne)",
    partOfSpeech: "adverb",
    fromModule: "m18",
    kind: "vocab",
    emoji: "🚫",
    hint: "zha-MEH — pairs with «ne» exactly like «pas»: «ne ... jamais» = never. It contains «mais» (but) as a written substring — say the whole word, don't clip it.",
  }),
  atom({
    surface: "rien",
    meaningEn: "nothing (with ne)",
    partOfSpeech: "pronoun",
    fromModule: "m18",
    kind: "vocab",
    emoji: "🕳️",
    hint: "ryan — pairs with «ne» exactly like «pas»: «ne ... rien» = nothing. Sounds close to «bien» (well) — lean on the sentence around it, not the sound alone.",
  }),
];

/** L1 — «Je n'ai jamais…»: jamais debuts on the negated-avoir + participle
 *  frame (n'ai/n'a — both directly legal via m13/m14's registered phrase
 *  atoms), je then il. Same «ne ... X» frame the learner already runs on
 *  «pas», one new word in the slot. */
function lesson1(): LessonStep[] {
  return [
    {
      id: "fr-m18-1-map-frame",
      type: "word_map",
      tokens: ["pas", "jamais"],
      pairs: [
        { en: "not", tokenIndex: 0 },
        { en: "never", tokenIndex: 1 },
      ],
      audioText: "pas, jamais",
      revealNote: "Same frame, new word: «ne ... pas» becomes «ne ... jamais» — not becomes never.",
    },
    speaking(
      "fr-m18-1-speak-croissant",
      "je n'ai jamais mangé de croissant",
      "I have never eaten a croissant",
      ["jamais"],
    ),
    cloze(
      "fr-m18-1-cloze-pizza",
      "Je n'ai",
      "mangé de pizza.",
      "jamais",
      ["jamais", "pas", "encore"],
      "I have never eaten pizza",
      "je n'ai jamais mangé de pizza",
    ),
    build(
      "fr-m18-1-build-gateau",
      "Build: 'you have never eaten cake'",
      "tu n'as jamais mangé de gâteau",
      ["tu n'as", "jamais", "mangé de gâteau", "pas"],
      ["tu n'as", "jamais", "mangé de gâteau"],
    ),
    sentenceMcq({
      id: "fr-m18-1-smcq-jamais",
      prompt: "'Never' (pairs with ne) — pick the French.",
      correctText: "jamais",
      distractorsText: ["pas", "encore", "plus"],
    }),
    listeningCompSentence({
      id: "fr-m18-1-lc-fromage",
      audioText: "je n'ai jamais mangé de fromage",
      correctMeaningEn: "I have never eaten cheese",
      distractorsEn: [
        "I have never eaten chocolate",
        "I have eaten cheese",
        "I have never eaten pizza",
      ],
    }),
    speaking(
      "fr-m18-1-speak-il-croissant",
      "il n'a jamais mangé de croissant",
      "he has never eaten a croissant",
      ["jamais"],
    ),
    cloze(
      "fr-m18-1-cloze-il-gateau",
      "Il n'a",
      "mangé de gâteau.",
      "jamais",
      ["jamais", "pas", "plus"],
      "he has never eaten cake",
      "il n'a jamais mangé de gâteau",
    ),
    build(
      "fr-m18-1-build-fromage",
      "Build: 'I have never eaten cheese'",
      "je n'ai jamais mangé de fromage",
      ["je n'ai", "jamais", "mangé de fromage", "pas"],
      ["je n'ai", "jamais", "mangé de fromage"],
    ),
    crossModuleMatchPairs("fr-m18-1", [
      ["jamais", "never (with ne)"],
      ["mangé", "eaten (past participle)"],
      ["croissant", "croissant"],
      ["gâteau", "cake"],
      ["fromage", "cheese"],
      ["pizza", "pizza"],
    ]),
  ];
}

/** L2 — cast consolidation: jamais across il/elle + savoir (je/tu only —
 *  "sait" is registered nowhere, verified). Interleave: a reach-back
 *  recall to m11's «il parle français» so numbers/verbs don't vanish. */
function lesson2(): LessonStep[] {
  return [
    speaking("fr-m18-2-speak-saisjamais", "je ne sais jamais", "I never know", ["jamais"]),
    cloze(
      "fr-m18-2-cloze-tusais",
      "Tu ne sais",
      "!",
      "jamais",
      ["jamais", "pas", "plus"],
      "you never know!",
      "tu ne sais jamais",
    ),
    build(
      "fr-m18-2-build-il-pizza",
      "Build: 'he has never eaten pizza'",
      "il n'a jamais mangé de pizza",
      ["il n'a", "jamais", "mangé de pizza", "pas"],
      ["il n'a", "jamais", "mangé de pizza"],
    ),
    sentenceMcq({
      id: "fr-m18-2-smcq-jamais",
      prompt: "'Never' — pick the French.",
      correctText: "jamais",
      distractorsText: ["pas", "plus", "très"],
    }),
    listeningCompSentence({
      id: "fr-m18-2-lc-gateau",
      audioText: "il n'a jamais mangé de gâteau",
      correctMeaningEn: "He has never eaten cake",
      distractorsEn: [
        "He has never eaten cheese",
        "He has eaten cake",
        "He has never eaten pizza",
      ],
    }),
    speaking(
      "fr-m18-2-speak-croissant-recall",
      "il n'a jamais mangé de croissant",
      "he has never eaten a croissant",
      [],
      "recall",
    ),
    build(
      "fr-m18-2-build-elle-fromage",
      "Build: 'she has never eaten cheese'",
      "elle n'a jamais mangé de fromage",
      ["elle n'a", "jamais", "mangé de fromage", "pas"],
      ["elle n'a", "jamais", "mangé de fromage"],
    ),
    speaking(
      "fr-m18-2-speak-parle-recall",
      "il parle français",
      "he speaks French",
      [],
      "recall",
    ),
    cloze(
      "fr-m18-2-cloze-elle-croissant",
      "Elle n'a",
      "mangé de croissant.",
      "jamais",
      ["jamais", "pas", "plus"],
      "she has never eaten a croissant",
      "elle n'a jamais mangé de croissant",
    ),
    crossModuleMatchPairs("fr-m18-2", [
      ["jamais", "never (with ne)"],
      ["sais", "know (je/tu)"],
      ["parle", "speaks (il/elle/on)"],
      ["français", "French"],
      ["pizza", "pizza"],
      ["fromage", "cheese"],
    ]),
  ];
}

/** L3 — «Rien» debuts on the same negated-avoir frame: rien names a
 *  THING (nothing), not a time — the contrast is built by parallel
 *  construction with L1/L2 rather than stated yet (L5 states it). */
function lesson3(): LessonStep[] {
  return [
    {
      id: "fr-m18-3-map-frame",
      type: "word_map",
      tokens: ["jamais", "rien"],
      pairs: [
        { en: "never", tokenIndex: 0 },
        { en: "nothing", tokenIndex: 1 },
      ],
      audioText: "jamais, rien",
      revealNote: "«Jamais» points at WHEN (never); «rien» points at WHAT (nothing) — same «ne ... X» frame, different word.",
    },
    speaking("fr-m18-3-speak-rien", "je n'ai rien", "I have nothing", ["rien"]),
    cloze(
      "fr-m18-3-cloze-mange",
      "Je n'ai",
      "mangé.",
      "rien",
      ["rien", "jamais", "pas"],
      "I haven't eaten anything",
      "je n'ai rien mangé",
    ),
    build(
      "fr-m18-3-build-turien",
      "Build: 'you have nothing'",
      "tu n'as rien",
      ["tu n'as", "rien", "jamais", "pas"],
      ["tu n'as", "rien"],
    ),
    sentenceMcq({
      id: "fr-m18-3-smcq-rien",
      prompt: "'Nothing' (with ne) — pick the French.",
      correctText: "rien",
      distractorsText: ["jamais", "pas", "bien"],
    }),
    listeningCompSentence({
      id: "fr-m18-3-lc-ilrien",
      audioText: "il n'a rien mangé",
      correctMeaningEn: "He hasn't eaten anything",
      distractorsEn: [
        "He has never eaten anything",
        "He ate everything",
        "He hasn't eaten cheese",
      ],
    }),
    speaking(
      "fr-m18-3-speak-aujourdhui",
      "aujourd'hui, je n'ai rien mangé",
      "today I haven't eaten anything",
      ["rien"],
    ),
    cloze(
      "fr-m18-3-cloze-ilrien",
      "Il n'a",
      ".",
      "rien",
      ["rien", "jamais", "pas"],
      "he has nothing",
      "il n'a rien",
    ),
    build(
      "fr-m18-3-build-ellerien",
      "Build: 'she hasn't eaten anything'",
      "elle n'a rien mangé",
      ["elle n'a", "rien", "mangé", "jamais"],
      ["elle n'a", "rien", "mangé"],
    ),
    crossModuleMatchPairs("fr-m18-3", [
      ["rien", "nothing (with ne)"],
      ["aujourd'hui", "today"],
      ["mangé", "eaten"],
      ["jamais", "never (with ne)"],
      ["croissant", "croissant"],
      ["chocolat", "chocolate"],
    ]),
  ];
}

/** L4 — rien across the savoir cast + il/elle; interleave a reach-back
 *  recall to m6's «je voudrais un croissant» so the module doesn't
 *  block-teach negation four lessons straight. */
function lesson4(): LessonStep[] {
  return [
    speaking("fr-m18-4-speak-saisrien", "je ne sais rien", "I know nothing", ["rien"]),
    cloze(
      "fr-m18-4-cloze-tusaisrien",
      "Tu ne sais",
      ".",
      "rien",
      ["rien", "jamais", "pas"],
      "you know nothing",
      "tu ne sais rien",
    ),
    build(
      "fr-m18-4-build-ilrienmange",
      "Build: 'he hasn't eaten anything'",
      "il n'a rien mangé",
      ["il n'a", "rien", "mangé", "jamais"],
      ["il n'a", "rien", "mangé"],
    ),
    sentenceMcq({
      id: "fr-m18-4-smcq-rien",
      prompt: "'Nothing' — pick the French.",
      correctText: "rien",
      distractorsText: ["jamais", "pas", "très"],
    }),
    speaking(
      "fr-m18-4-speak-croissant-recall",
      "je voudrais un croissant",
      "I would like a croissant",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m18-4-lc-saisrien",
      audioText: "je ne sais rien",
      correctMeaningEn: "I know nothing",
      distractorsEn: ["I never know", "I don't understand", "I know everything"],
    }),
    build(
      "fr-m18-4-build-turien",
      "Build: 'you have nothing'",
      "tu n'as rien",
      ["tu n'as", "rien", "jamais", "pas"],
      ["tu n'as", "rien"],
    ),
    speaking("fr-m18-4-speak-rien-recall", "je n'ai rien", "I have nothing", [], "recall"),
    cloze(
      "fr-m18-4-cloze-ellerienmange",
      "Elle n'a",
      "mangé.",
      "rien",
      ["rien", "jamais", "pas"],
      "she hasn't eaten anything",
      "elle n'a rien mangé",
    ),
    crossModuleMatchPairs("fr-m18-4", [
      ["rien", "nothing (with ne)"],
      ["sais", "know (je/tu)"],
      ["croissant", "croissant"],
      ["mangé", "eaten"],
      ["jamais", "never (with ne)"],
      ["chocolat", "chocolate"],
    ]),
  ];
}

/** L5 — jamais vs rien, stated explicitly: WHEN vs WHAT. Discrimination
 *  is tested via build/cloze/sentenceMcq only (speech-negation constraint
 *  3 — never a `speaking` step). Also fixes brief-claim #3: «je ne
 *  comprends rien» / «tu ne comprends rien» (bare il/elle "comprend" is
 *  unregistered; je/tu "comprends" is legal via m2's phrase atom). */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m18-5-info-contrast",
      "Jamais vs rien",
      "«Jamais» answers WHEN — «je n'ai jamais mangé de croissant» (never). «Rien» answers WHAT — «il n'a rien mangé» (nothing). Same frame, different question.",
    ),
    cloze(
      "fr-m18-5-cloze-when",
      "Je n'ai",
      "mangé de croissant.",
      "jamais",
      ["jamais", "rien", "pas"],
      "I have never eaten a croissant",
      "je n'ai jamais mangé de croissant",
    ),
    build(
      "fr-m18-5-build-comprendsrien",
      "Build: 'I understand nothing'",
      "je ne comprends rien",
      ["je ne comprends", "rien", "jamais", "pas"],
      ["je ne comprends", "rien"],
    ),
    cloze(
      "fr-m18-5-cloze-what",
      "Il n'a",
      "mangé.",
      "rien",
      ["rien", "jamais", "pas"],
      "he hasn't eaten anything",
      "il n'a rien mangé",
    ),
    speaking(
      "fr-m18-5-speak-comprendsrien",
      "je ne comprends rien",
      "I understand nothing",
      ["rien"],
    ),
    build(
      "fr-m18-5-build-jamaischocolat",
      "Build: 'she has never eaten chocolate'",
      "elle n'a jamais mangé de chocolat",
      ["elle n'a", "jamais", "mangé de chocolat", "rien"],
      ["elle n'a", "jamais", "mangé de chocolat"],
    ),
    speaking(
      "fr-m18-5-speak-tucomprendsrien",
      "tu ne comprends rien",
      "you understand nothing",
      ["rien"],
    ),
    sentenceMcq({
      id: "fr-m18-5-smcq-rien-vs-bien",
      prompt: "'Nothing' — pick the French.",
      correctText: "rien",
      distractorsText: ["jamais", "pas", "bien"],
    }),
    listeningCompSentence({
      id: "fr-m18-5-lc-tucomprendsrien",
      audioText: "tu ne comprends rien",
      correctMeaningEn: "You understand nothing",
      distractorsEn: ["You never understand", "You understand everything", "You know nothing"],
    }),
    sentenceMcq({
      id: "fr-m18-5-smcq-jamais-vs-rien",
      prompt: "'Never' — pick the French.",
      correctText: "jamais",
      distractorsText: ["rien", "pas", "encore"],
    }),
    crossModuleMatchPairs("fr-m18-5", [
      ["jamais", "never (with ne)"],
      ["rien", "nothing (with ne)"],
      ["comprends", "understand (je/tu)"],
      ["chocolat", "chocolate"],
      ["croissant", "croissant"],
      ["mangé", "eaten"],
    ]),
  ];
}

/** L6 — interleave break: jamais rides the être-side passé composé
 *  (allé/venu — masculine speaking only, feminine allée/venue stay
 *  written-only, per m16's own silent-gender discipline). Reach-back
 *  recall to m1's «bonjour». */
function lesson6(): LessonStep[] {
  return [
    speaking(
      "fr-m18-6-speak-alleparis",
      "il n'est jamais allé à Paris",
      "he has never gone to Paris",
      ["jamais"],
    ),
    cloze(
      "fr-m18-6-cloze-allemontreal",
      "Il n'est",
      "allé à Montréal.",
      "jamais",
      ["jamais", "pas", "plus"],
      "he has never gone to Montreal",
      "il n'est jamais allé à Montréal",
    ),
    build(
      "fr-m18-6-build-alleeparis",
      "Build: 'she has never gone to Paris' (written — the feminine allée)",
      "elle n'est jamais allée à Paris",
      ["elle n'est", "jamais", "allée à Paris", "pas"],
      ["elle n'est", "jamais", "allée à Paris"],
    ),
    sentenceMcq({
      id: "fr-m18-6-smcq-jamais",
      prompt: "'Never' — pick the French.",
      correctText: "jamais",
      distractorsText: ["pas", "plus", "encore"],
    }),
    listeningCompSentence({
      id: "fr-m18-6-lc-allemontreal",
      audioText: "il n'est jamais allé à Montréal",
      correctMeaningEn: "He has never gone to Montreal",
      distractorsEn: [
        "He has never gone to Paris",
        "He went to Montreal",
        "He has never eaten in Montreal",
      ],
    }),
    speaking(
      "fr-m18-6-speak-croissant-recall",
      "je n'ai jamais mangé de croissant",
      "I have never eaten a croissant",
      [],
      "recall",
    ),
    build(
      "fr-m18-6-build-venuparis",
      "Build: 'he has never come to Paris'",
      "il n'est jamais venu à Paris",
      ["il n'est", "jamais", "venu à Paris", "pas"],
      ["il n'est", "jamais", "venu à Paris"],
    ),
    speaking("fr-m18-6-speak-bonjour-recall", "bonjour", "hello", [], "recall"),
    cloze(
      "fr-m18-6-cloze-venuemontreal",
      "Elle n'est",
      "venue à Montréal.",
      "jamais",
      ["jamais", "pas", "plus"],
      "she has never come to Montreal",
      "elle n'est jamais venue à Montréal",
    ),
    build(
      "fr-m18-6-build-saisjamais-recap",
      "Build: 'I never know'",
      "je ne sais jamais",
      ["je ne sais", "jamais", "pas", "rien"],
      ["je ne sais", "jamais"],
    ),
    crossModuleMatchPairs("fr-m18-6", [
      ["jamais", "never (with ne)"],
      ["allé", "gone (masculine, past participle)"],
      ["venu", "come (masculine, past participle)"],
      ["Paris", "Paris"],
      ["Montréal", "Montreal"],
      ["est", "is (il/elle/on)"],
    ]),
  ];
}

/** L7 — «Plus» bridge (written-only per the speech-negation constraint):
 *  the learner already knows «plus» from «moi non plus» — this lesson
 *  names that collision directly, then teaches the NEW «ne ... plus» =
 *  no longer / no more. No `speaking` or `listening_comprehension` step
 *  ever targets a ne...plus sentence anywhere in this module; the one
 *  required spoken step recalls already-safe rien content instead. */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m18-7-info-bridge",
      "Il n'habite plus",
      "You already know «plus» from «moi non plus» (me neither). Now it has a second job: with «ne», «ne ... plus» means no longer / no more — «il n'habite plus à Paris» = he no longer lives in Paris.",
    ),
    cloze(
      "fr-m18-7-cloze-habite",
      "Il n'habite",
      "à Paris.",
      "plus",
      ["plus", "jamais"],
      "he no longer lives in Paris",
      "il n'habite plus à Paris",
    ),
    build(
      "fr-m18-7-build-gateau",
      "Build: 'there's no more cake'",
      "il n'y a plus de gâteau",
      ["il n'y a", "plus", "de gâteau", "jamais"],
      ["il n'y a", "plus", "de gâteau"],
    ),
    cloze(
      "fr-m18-7-cloze-chocolat",
      "Je n'ai",
      "de chocolat.",
      "plus",
      ["plus", "rien"],
      "I have no more chocolate",
      "je n'ai plus de chocolat",
    ),
    sentenceMcq({
      id: "fr-m18-7-smcq-plus",
      prompt: "'No longer / no more' (with ne) — pick the French.",
      correctText: "plus",
      distractorsText: ["jamais", "rien", "pas"],
    }),
    speaking("fr-m18-7-speak-rien-recall", "je n'ai rien", "I have nothing", [], "recall"),
    build(
      "fr-m18-7-build-cafe",
      "Build: 'she no longer likes coffee'",
      "elle n'aime plus le café",
      ["elle n'aime", "plus", "le café", "jamais"],
      ["elle n'aime", "plus", "le café"],
    ),
    cloze(
      "fr-m18-7-cloze-croissant",
      "Il n'y a",
      "de croissant.",
      "plus",
      ["plus", "jamais"],
      "there's no more croissant",
      "il n'y a plus de croissant",
    ),
    sentenceMcq({
      id: "fr-m18-7-smcq-moinonplus",
      prompt: "'Me neither' — pick the French.",
      correctText: "moi non plus",
      distractorsText: ["il n'y a plus", "je n'ai plus", "non merci"],
    }),
    build(
      "fr-m18-7-build-cafe2",
      "Build: 'I have no more coffee'",
      "je n'ai plus de café",
      ["je n'ai", "plus", "de café", "rien"],
      ["je n'ai", "plus", "de café"],
    ),
    cloze(
      "fr-m18-7-cloze-chocolat2",
      "Elle n'aime",
      "le chocolat.",
      "plus",
      ["plus", "rien"],
      "she no longer likes chocolate",
      "elle n'aime plus le chocolat",
    ),
    crossModuleMatchPairs("fr-m18-7", [
      ["moi non plus", "me neither"],
      ["plus", "no longer / no more (with ne)"],
      ["habite", "lives (il/elle/on)"],
      ["à Paris", "in Paris"],
      ["café", "coffee"],
      ["gâteau", "cake"],
    ]),
  ];
}

/** L8 — checkpoint: zero-new, every step graded. Reviews jamais/rien
 *  across the cast; plus stays written-only (cloze/build only, no
 *  speaking/listening target). */
function checkpointLesson(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m18-8-smcq-jamais",
      prompt: "'Never' — pick the French.",
      correctText: "jamais",
      distractorsText: ["rien", "pas", "encore"],
    }),
    cloze(
      "fr-m18-8-cloze-jamaiscroissant",
      "Je n'ai",
      "mangé de croissant.",
      "jamais",
      ["jamais", "rien", "pas"],
      "I have never eaten a croissant",
      "je n'ai jamais mangé de croissant",
    ),
    build(
      "fr-m18-8-build-turien",
      "Build: 'you have nothing'",
      "tu n'as rien",
      ["tu n'as", "rien", "jamais", "pas"],
      ["tu n'as", "rien"],
    ),
    speaking(
      "fr-m18-8-speak-ilfromage",
      "il n'a jamais mangé de fromage",
      "he has never eaten cheese",
      ["jamais"],
    ),
    listeningCompSentence({
      id: "fr-m18-8-lc-ellerien",
      audioText: "elle n'a rien mangé",
      correctMeaningEn: "She hasn't eaten anything",
      distractorsEn: [
        "She has never eaten anything",
        "She ate everything",
        "She hasn't eaten cheese",
      ],
    }),
    sentenceMcq({
      id: "fr-m18-8-smcq-rien",
      prompt: "'Nothing' — pick the French.",
      correctText: "rien",
      distractorsText: ["jamais", "pas", "bien"],
    }),
    cloze(
      "fr-m18-8-cloze-alleparis",
      "Il n'est",
      "allé à Paris.",
      "jamais",
      ["jamais", "pas", "plus"],
      "he has never gone to Paris",
      "il n'est jamais allé à Paris",
    ),
    build(
      "fr-m18-8-build-comprendsrien",
      "Build: 'I understand nothing'",
      "je ne comprends rien",
      ["je ne comprends", "rien", "jamais", "pas"],
      ["je ne comprends", "rien"],
    ),
    speaking("fr-m18-8-speak-tusaisrien", "tu ne sais rien", "you know nothing", ["rien"]),
    cloze(
      "fr-m18-8-cloze-habiteplus",
      "Il n'habite",
      "à Paris.",
      "plus",
      ["plus", "jamais"],
      "he no longer lives in Paris",
      "il n'habite plus à Paris",
    ),
    listeningCompSentence({
      id: "fr-m18-8-lc-saisjamais",
      audioText: "je ne sais jamais",
      correctMeaningEn: "I never know",
      distractorsEn: ["I know nothing", "I understand nothing", "I never understand"],
    }),
    build(
      "fr-m18-8-build-plusgateau",
      "Build: 'there's no more cake'",
      "il n'y a plus de gâteau",
      ["il n'y a", "plus", "de gâteau", "jamais"],
      ["il n'y a", "plus", "de gâteau"],
    ),
    sentenceMcq({
      id: "fr-m18-8-smcq-plus",
      prompt: "'No longer / no more' — pick the French.",
      correctText: "plus",
      distractorsText: ["jamais", "rien", "pas"],
    }),
    crossModuleMatchPairs("fr-m18-8", [
      ["jamais", "never (with ne)"],
      ["rien", "nothing (with ne)"],
      ["plus", "no longer / no more (with ne)"],
      ["comprends", "understand (je/tu)"],
      ["allé", "gone (masculine)"],
      ["café", "coffee"],
    ]),
  ];
}

/** L9 — integration: café-refusal dialogue_sim, manually vocabulary-
 *  audited (dialogue_sim is invisible to the automated vocab-provenance
 *  gate — frSurfaces() has no case for it). ≥10 steps. */
function lesson9(): LessonStep[] {
  return [
    speaking("fr-m18-9-speak-saisjamais-recall", "je ne sais jamais", "I never know", [], "recall"),
    build(
      "fr-m18-9-build-chocolat",
      "Build: 'she has never eaten chocolate'",
      "elle n'a jamais mangé de chocolat",
      ["elle n'a", "jamais", "mangé de chocolat", "rien"],
      ["elle n'a", "jamais", "mangé de chocolat"],
    ),
    cloze(
      "fr-m18-9-cloze-plus-cafe",
      "Je n'ai",
      "de café.",
      "plus",
      ["plus", "rien"],
      "I have no more coffee",
      "je n'ai plus de café",
    ),
    sentenceMcq({
      id: "fr-m18-9-smcq-rien",
      prompt: "'Nothing' — pick the French.",
      correctText: "rien",
      distractorsText: ["jamais", "pas", "bien"],
    }),
    listeningCompSentence({
      id: "fr-m18-9-lc-comprendsrien",
      audioText: "tu ne comprends rien",
      correctMeaningEn: "You understand nothing",
      distractorsEn: ["You never understand", "You know nothing", "You understand everything"],
    }),
    speaking(
      "fr-m18-9-speak-pizza",
      "je n'ai jamais mangé de pizza",
      "I have never eaten pizza",
      ["jamais"],
    ),
    build(
      "fr-m18-9-build-venumontreal",
      "Build: 'he has never come to Montreal'",
      "il n'est jamais venu à Montréal",
      ["il n'est", "jamais", "venu à Montréal", "pas"],
      ["il n'est", "jamais", "venu à Montréal"],
    ),
    cloze(
      "fr-m18-9-cloze-plus-chocolat",
      "Elle n'aime",
      "le chocolat.",
      "plus",
      ["plus", "jamais"],
      "she no longer likes chocolate",
      "elle n'aime plus le chocolat",
    ),
    sentenceMcq({
      id: "fr-m18-9-smcq-jamais",
      prompt: "'Never' — pick the French.",
      correctText: "jamais",
      distractorsText: ["rien", "pas", "plus"],
    }),
    crossModuleMatchPairs("fr-m18-9", [
      ["jamais", "never (with ne)"],
      ["rien", "nothing (with ne)"],
      ["plus", "no longer / no more (with ne)"],
      ["venu", "come (masculine)"],
      ["chocolat", "chocolate"],
      ["pizza", "pizza"],
    ]),
    {
      id: "fr-m18-9-sim-cafe",
      type: "dialogue_sim",
      scene: { emoji: "☕", title: "Un café refusé" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-offre",
          npc: {
            speaker: "Théo",
            kana: "Un café ou un chocolat ?",
            audioText: "un café ou un chocolat ?",
            gloss: "Coffee or chocolate?",
          },
          goal: "Say nothing for you, thanks.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "rien pour moi, merci" },
              { id: "wrong-accept", text: "un café, merci" },
              { id: "wrong-mix", text: "jamais de café" },
            ],
            correctOptionId: "correct",
            audioText: "rien pour moi, merci",
          },
          replyGloss: "Nothing for me, thanks.",
        },
        {
          id: "t2-jamais",
          npc: {
            speaker: "Théo",
            kana: "Jamais de café ?",
            audioText: "jamais de café ?",
            gloss: "Never coffee?",
          },
          goal: "Say no, you don't like that.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je n'aime pas ça" },
              { id: "wrong-diff", text: "non, je n'ai rien" },
              { id: "wrong-yes", text: "oui, j'aime ça" },
            ],
            correctOptionId: "correct",
            audioText: "non, je n'aime pas ça",
          },
          replyGloss: "No, I don't like that.",
        },
      ],
    },
  ];
}

/** L10 — mastery: recap variety, ends on its own dialogue_sim (a second
 *  scene, different cast — Léa — different vocabulary mix). */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m18-10-smcq-jamais-recap",
      prompt: "'Never' — pick the French.",
      correctText: "jamais",
      distractorsText: ["rien", "pas", "plus"],
    }),
    cloze(
      "fr-m18-10-cloze-jamaiscroissant",
      "Il n'a",
      "mangé de croissant.",
      "jamais",
      ["jamais", "rien", "pas"],
      "he has never eaten a croissant",
      "il n'a jamais mangé de croissant",
    ),
    build(
      "fr-m18-10-build-comprendsrien",
      "Build: 'I understand nothing'",
      "je ne comprends rien",
      ["je ne comprends", "rien", "jamais", "pas"],
      ["je ne comprends", "rien"],
    ),
    listeningCompSentence({
      id: "fr-m18-10-lc-venueparis",
      audioText: "elle n'est jamais venue à Paris",
      correctMeaningEn: "She has never come to Paris",
      distractorsEn: [
        "She has never gone to Paris",
        "She came to Paris",
        "She has never come to Montreal",
      ],
    }),
    sentenceMcq({
      id: "fr-m18-10-smcq-rien-recap",
      prompt: "'Nothing' — pick the French.",
      correctText: "rien",
      distractorsText: ["jamais", "pas", "bien"],
    }),
    speaking(
      "fr-m18-10-speak-croissant-recall",
      "je n'ai jamais mangé de croissant",
      "I have never eaten a croissant",
      [],
      "recall",
    ),
    cloze(
      "fr-m18-10-cloze-plus-chocolat",
      "Je n'ai",
      "de chocolat.",
      "plus",
      ["plus", "rien"],
      "I have no more chocolate",
      "je n'ai plus de chocolat",
    ),
    build(
      "fr-m18-10-build-gateau",
      "Build: 'you have never eaten cake'",
      "tu n'as jamais mangé de gâteau",
      ["tu n'as", "jamais", "mangé de gâteau", "rien"],
      ["tu n'as", "jamais", "mangé de gâteau"],
    ),
    speaking("fr-m18-10-speak-bonjour-recall", "bonjour", "hello", [], "recall"),
    sentenceMcq({
      id: "fr-m18-10-smcq-plus-recap",
      prompt: "'No longer / no more' — pick the French.",
      correctText: "plus",
      distractorsText: ["jamais", "rien", "pas"],
    }),
    crossModuleMatchPairs("fr-m18-10", [
      ["jamais", "never (with ne)"],
      ["rien", "nothing (with ne)"],
      ["plus", "no longer / no more (with ne)"],
      ["comprends", "understand (je/tu)"],
      ["allé", "gone (masculine)"],
      ["venu", "come (masculine)"],
    ]),
    {
      id: "fr-m18-10-sim-chocolat",
      type: "dialogue_sim",
      scene: { emoji: "🍫", title: "Léa demande" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-aimes",
          npc: {
            speaker: "Léa",
            kana: "Bonjour ! Tu aimes le chocolat ?",
            audioText: "bonjour ! tu aimes le chocolat ?",
            gloss: "Hello! Do you like chocolate?",
          },
          goal: "Say you've never eaten chocolate.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, je n'ai jamais mangé de chocolat" },
              { id: "wrong-yes", text: "oui, j'aime le chocolat" },
              { id: "wrong-rien", text: "non, je n'ai rien mangé" },
            ],
            correctOptionId: "correct",
            audioText: "non, je n'ai jamais mangé de chocolat",
          },
          replyGloss: "No, I've never eaten chocolate.",
        },
        {
          id: "t2-cafe",
          npc: {
            speaker: "Léa",
            kana: "Et le café ? Jamais ?",
            audioText: "et le café ? jamais ?",
            gloss: "And coffee? Never?",
          },
          goal: "Say no, never.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "non, jamais" },
              { id: "wrong-rien", text: "non, rien" },
              { id: "wrong-aime", text: "j'aime le café" },
            ],
            correctOptionId: "correct",
            audioText: "non, jamais",
          },
          replyGloss: "No, never.",
        },
      ],
    },
  ];
}

const FR_M18_1: LessonContent = {
  id: "fr-m18-1",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je n'ai jamais…",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M18_2: LessonContent = {
  id: "fr-m18-2",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il n'a jamais…",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M18_3: LessonContent = {
  id: "fr-m18-3",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je n'ai rien",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M18_4: LessonContent = {
  id: "fr-m18-4",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Je ne sais rien",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M18_5: LessonContent = {
  id: "fr-m18-5",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Jamais vs rien",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M18_6: LessonContent = {
  id: "fr-m18-6",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Jamais allé, jamais venu",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M18_7: LessonContent = {
  id: "fr-m18-7",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Il n'habite plus",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M18_8: LessonContent = {
  id: "fr-m18-8",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · Jamais, rien, plus",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M18_9: LessonContent = {
  id: "fr-m18-9",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Un café refusé",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M18_10: LessonContent = {
  id: "fr-m18-10",
  moduleId: "m18",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Léa demande",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M18_MODULE: FrModuleDef = {
  title: "Jamais, rien, plus",
  eyebrow: "Module 18",
  summary:
    "The same «ne ... X» frame the learner already runs on «pas», with three new words in the slot — jamais (never), rien (nothing), and plus (no longer / no more, taught as a bridge past the already-known «moi non plus»).",
  lessons: [
    FR_M18_1,
    FR_M18_2,
    FR_M18_3,
    FR_M18_4,
    FR_M18_5,
    FR_M18_6,
    FR_M18_7,
    FR_M18_8,
    FR_M18_9,
    FR_M18_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M18_CHECKPOINT_INDEX = 8;

export const FR_M18_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m18-s",
    moduleId: "m18",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m18-s",
        prompt: "'Never' (pairs with ne) — pick the French.",
        correctText: "jamais",
        distractorsText: ["pas", "rien", "encore"],
      }),
  },
  {
    id: "pt-fr-m18-1",
    moduleId: "m18",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m18-1",
        prompt: "'Nothing' (pairs with ne) — pick the French.",
        correctText: "rien",
        distractorsText: ["jamais", "pas", "bien"],
      }),
  },
  {
    id: "pt-fr-m18-2",
    moduleId: "m18",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m18-2",
        prompt: "'No longer / no more' (pairs with ne) — pick the French.",
        correctText: "plus",
        distractorsText: ["jamais", "rien", "pas"],
      }),
  },
  {
    id: "pt-fr-m18-3",
    moduleId: "m18",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m18-3",
        prompt: "'Me neither' — pick the French.",
        correctText: "moi non plus",
        distractorsText: ["il n'y a plus", "je n'ai plus", "non merci"],
      }),
  },
  {
    id: "pt-fr-m18-4",
    moduleId: "m18",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m18-4",
        prompt: "'Eleven' review — pick the French.",
        correctText: "onze",
        distractorsText: ["douze", "seize", "dix"],
      }),
  },
];
