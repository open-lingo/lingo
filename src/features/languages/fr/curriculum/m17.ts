/**
 * m17.ts — «De onze à cent» — the §13-doctrine hand-authored module.
 *
 * AUTHORED 2026-09-10 per docs/fr-m17-brief-2026-09-10.md: the number
 * machine's SECOND numbers pass. The learner already owns 0–20 (m1's
 * digits, m12's vingt) and the regular tens 20–100 (m12). This module
 * fills the one gap m12 deliberately left open — the teens 11–16 (17–19
 * already compose for free from m1's dix+sept/huit/neuf) — then extends
 * the tens machine past soixante into the two irregular zones French keeps
 * for 70–99: the 70s ride the teens («soixante-dix» = 60+10), and the 80s/
 * 90s are a base-20 fossil («quatre-vingts» = 4×20). The whole teaching
 * claim: French numbers aren't one system past 60, they're the same small
 * parts (m1's digits + m12's tens + this module's teens) recombined by two
 * different, learnable rules.
 *
 * SCOPE DECISIONS (brief §7, executed not re-litigated):
 *   - New atoms: exactly the 6 teens the brief names — onze, douze, treize,
 *     quatorze, quinze, seize — plus ONE atom beyond the brief's literal
 *     count, «quatre-vingts» (see the MECHANICAL NOTE below). Nothing else:
 *     dix-sept/dix-huit/dix-neuf compose from m1's dix+sept/huit/neuf;
 *     soixante-dix/soixante-douze.../quatre-vingt-un/quatre-vingt-dix/
 *     quatre-vingt-onze... all compose from m1+m12+this module's own six.
 *     No cent-and-beyond, no ordinals, no ans/âge, no numéro/téléphone, no
 *     date compounds, no new noun — all per brief §3/§8, all still true on
 *     inspection of moduleBarGuards.ts's token-provenance mechanism.
 *   - `onze` carries `consonantOnset: true` — mandatory (brief §3), and the
 *     exact same flag m1.ts:52 sets on `huit` (verified in code). It blocks
 *     both elision («le onze», never «l'onze») and liaison the same way
 *     `isConsonantOnset()`/`elidesBefore()` already handle huit. L1 teaches
 *     the rule explicitly by contrast with huit rather than leaving it
 *     implicit, and quotes the correct non-elided form «le onze» directly
 *     — this is the one place the module deliberately writes «le onze» (an
 *     eliding word directly followed by onze) so the exception is taught,
 *     not just avoided; m17.test.ts pins that «l'onze» (the WRONG, elided
 *     form) never appears anywhere in the module.
 *   - MECHANICAL NOTE on «quatre-vingts» (the one atom beyond the brief's
 *     6): the brief lists quatre-vingts as "compose for free, zero new
 *     atoms" — true pedagogically (80 is still "four twenties", no new
 *     concept), but NOT true mechanically. `frTokens()`
 *     (moduleBarGuards.ts) does not treat hyphens as token-internal, so
 *     "quatre-vingts" tokenizes to ["quatre", "vingts"] — and "vingts"
 *     (WITH the silent plural -s, which appears ONLY in this one exact
 *     compound and disappears the instant a unit follows: quatre-vingts
 *     but quatre-vingt-un) is not a substring of any registered atom's
 *     surface, so `getFrRealFormLexicon()` never derives it and the vocab-
 *     provenance gate ("no untracked words") fails on any card that
 *     spells 80 correctly. Registering «quatre-vingts» as its own atom
 *     (partOfSpeech "other", same taxonomy as every other number in this
 *     course) is the only compliant fix that doesn't either (a) misspell
 *     80 to dodge the gate or (b) leave the central L6 contrast card
 *     unable to quote the form it's teaching. Documented here per the
 *     task's "verify each claim in code and adapt if false" instruction —
 *     this is the one brief claim ("zero new atoms" for quatre-vingts)
 *     that turned out false at the mechanical level, corrected with the
 *     smallest fix that preserves the brief's pedagogical intent.
 *   - The «et» irregularity — present at 71 (soixante et onze, same shape
 *     as m12's 21/31/41/51/61) but ABSENT at 81/91 (quatre-vingt-un,
 *     quatre-vingt-onze) — is the module's central teaching trap. Per
 *     brief §8, BOTH L4 (where 71 first appears) and L6 (where 81 first
 *     appears) carry an explicit contrastive info card quoting both forms
 *     side by side, not just one card assuming the contrast transfers.
 *   - No new `homophoneKey` pairs — verified: none of onze/douze/treize/
 *     quatorze/quinze/seize/quatre-vingts share a sound with any existing
 *     atom or with each other, so there is no minimal-pair risk to guard.
 *   - No new `liaisonListen` item — consistent with m12's precedent (no
 *     liaison_listen bank in the numbers modules), and the brief agrees
 *     (§5, no new item recommended).
 *   - "Real use, not a bare list": teens (11–16, 19) ride m12's already-
 *     live price frame («ça coûte onze euros», directly resolvable — m12
 *     sorts before m17 lexicographically so its atoms are live by the time
 *     m17's module code runs, no cross-module helper needed). 70–99 extend
 *     the SAME price frame in L9's integration sim, reusing m12's
 *     market-stall vendor rather than inventing a new noun-bearing context
 *     (ans/âge/numéro framing is explicitly deferred — brief §7/§8).
 *   - This module's own new deferrals (brief §7): hundreds/thousands,
 *     ordinals, age framing (ans/âge), phone numbers, date compounds — all
 *     recorded, none touched here.
 *
 * SPEECH-GRADING VERIFICATION (task instruction: verify, don't trust):
 *   - `ROMANCE_NUMBER_WORDS` (src/shared/speech/loose-match.ts:333-355)
 *     covers indices 0-20 inclusive, confirmed by direct read: 11 once/
 *     onze, 12 doce/douze, 13 trece/treize, 14 catorce/quatorze, 15
 *     quince/quinze, 16 dieciséis/seize, 17 diecisiete/dix-sept, 18
 *     dieciocho/dix-huit, 19 diecinueve/dix-neuf, 20 veinte/vingt. So ALL
 *     of 11-19 (this module's new + compose-for-free teens) are spoken-
 *     safe, same ceiling m12 already teaches to (vingt=20). TRUE as
 *     briefed.
 *   - 70-99 have no entry past index 20 — confirmed no compound number
 *     word above "vingt" appears in the array. TRUE as briefed: every
 *     70-99 form stays written-only (word_map/cloze/build/sentenceMcq/
 *     listening_comprehension/dialogue_sim choice text), never a
 *     `speaking` target. Mirrors m12.test.ts's own NUMBER_ABOVE_TWENTY
 *     pin; m17.test.ts's bespoke NUMBER_70_TO_99 pin is the direct analog.
 *   - «et» at 71 but not 81/91 — confirmed against standard French number
 *     orthography (soixante et onze vs. quatre-vingt-un/quatre-vingt-onze)
 *     and against the brief's own citation of the pattern; no correction
 *     needed. TRUE as briefed.
 *   - m13.test.ts's banned-lexical regex (line ~311) lists onze, douze,
 *     …, quatre-vingt-dix, en ville as forbidden in ANSWER positions —
 *     confirmed by direct read that the check iterates `for (const l of
 *     LESSONS)` where LESSONS is m13's own local module constant, not a
 *     course-wide scan. It does not constrain m17. TRUE as briefed.
 *
 * VOICING LEDGER (§13.9 law 3 — cued recall never precedes a printed
 * voicing; ≥8 recalls, 2-3 reaching further back than m11-m16). Every
 * recall target below is an EXACT string match against a non-recall
 * `speaking()` target somewhere earlier in m1-m16 (cross-module) or
 * earlier within this module's own lesson order (internal) — verified by
 * direct grep against the source `speaking(` calls, not inferred:
 *   onze L1 (internal, non-recall speak-onze) · douze L1 (internal,
 *   non-recall speak-douze) · treize L2 (internal) · quatorze L2
 *   (internal) · quinze L3 (internal) · seize L3 (internal, non-recall
 *   speak-seize) · il parle français L3 (m11 fr-m11-2-speak-ilparle,
 *   non-recall) · il est déjà allé au parc L4 (m16 fr-m16-8-speak-1,
 *   non-recall — NOT the 1st-person "je suis allé", which m16 never
 *   voiced as a bare speaking target) · c'est combien ? L4 (m12
 *   fr-m12-6-speak-cestcombien, non-recall) · merci beaucoup L5 (m1
 *   fr-m1v2-r-speak-mercibeaucoup, non-recall, further-back) · douze L7
 *   (internal recall) · je voudrais un croissant L7 (m6
 *   fr-m6-1-speak-croissant, non-recall, further-back) · grand L9 (m9,
 *   cross-module MCQ, not a speaking recall) · bonjour L9 (m1
 *   fr-m1v2-1-speak-bonjour, non-recall, further-back) · ça coûte vingt
 *   euros L9 (m12 fr-m12-6-speak-cacoute, non-recall — the bare "ça
 *   coûte" alone was never voiced) · seize L10 (internal recall) · vingt
 *   L10 (m12 fr-m12-1-speak-vingt, non-recall). 10 `cue: "recall"`
 *   speaking steps total — comfortably over the ≥8 floor, with 3
 *   reaching back past m11-m16 (merci beaucoup m1, je voudrais un
 *   croissant m6, bonjour m1) into the 2-3 band the brief asks for.
 *
 * Cast: a corner épicerie vendor (L1/price frame) selling small items in
 * the 11-19 euro range; the L6/L7 vendor scene sets up the 80s/90s; L9's
 * integration sim reuses m12's market-stall vendor (Nadia) now haggling
 * in the 70-99 range — the SAME character, extended range, not a new
 * scene; L10 closes on a generic soft-tease dialogue_sim (no new plot
 * commitment, per brief §8).
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
 * Hand-built MCQ, shape-identical to grammarHelpers' vocabTextMcq(), but
 * bypassing the atom registry entirely.
 *
 * WHY THIS EXISTS: FR's `import.meta.glob` curriculum loader resolves
 * module files in LEXICOGRAPHIC order — m17.ts's own module-level lesson-
 * building code runs BEFORE m2.ts–m9.ts register their atoms into the
 * shared surface registry ("m2".."m9" sort AFTER "m17" as strings; m1 and
 * m10-m16 sort BEFORE "m17" and are safe to reference directly). Same
 * landmine + same fix m11.ts/m14.ts/m15.ts/m16.ts document in full — used
 * here only for the handful of m2-m9-sourced review items this module
 * touches (m6's croissant, m9's grand).
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

/**
 * Hand-built match_pairs, shape-identical to grammarHelpers' matchPairs(),
 * but bypassing the atom registry — same m2-m9 ordering landmine as
 * `crossModuleVocabMcq` above. Takes explicit [surface, gloss] pairs
 * instead of live-resolving surfaces.
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

export const FR_M17_ATOMS: FrAtom[] = [
  atom({ surface: "onze", meaningEn: "eleven", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "1️⃣1️⃣", hint: "ohnz — starts like a consonant, same class as «huit»: say «le onze», never «l'onze»", consonantOnset: true }),
  atom({ surface: "douze", meaningEn: "twelve", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "1️⃣2️⃣", hint: "dooz" }),
  atom({ surface: "treize", meaningEn: "thirteen", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "1️⃣3️⃣", hint: "trehz" }),
  atom({ surface: "quatorze", meaningEn: "fourteen", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "1️⃣4️⃣", hint: "ka-TORZ" }),
  atom({ surface: "quinze", meaningEn: "fifteen", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "1️⃣5️⃣", hint: "kanz" }),
  atom({ surface: "seize", meaningEn: "sixteen", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "1️⃣6️⃣", hint: "sehz — not to be confused with «seize» the English verb, pure coincidence of spelling" }),
  atom({ surface: "quatre-vingts", meaningEn: "eighty (exactly)", partOfSpeech: "other", fromModule: "m17", kind: "vocab", emoji: "8️⃣0️⃣", hint: "kat-ruh-VAN — «quatre» × «vingt», four twenties; the trailing -s shows ONLY when nothing follows (quatre-vingts alone) and disappears the instant a unit joins (quatre-vingt-un)" }),
];

/** L1 — «Onze, douze»: the first two teens, riding m12's live price frame
 *  (ça coûte/euros resolve directly — m12 sorts before m17). Onze's
 *  consonant-onset exception is taught head-on by contrast with huit. */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m17-1-info-onze",
      "Après dix, onze",
      "«Onze» — eleven — starts like a consonant, not a vowel. Always «le onze», never \"l'onze\" — the same exception as «huit» (le huit, not \"l'huit\"). «Douze» — twelve — is regular.",
    ),
    {
      id: "fr-m17-1-map-countup",
      type: "word_map",
      tokens: ["dix", "onze", "douze"],
      pairs: [
        { en: "ten", tokenIndex: 0 },
        { en: "eleven", tokenIndex: 1 },
        { en: "twelve", tokenIndex: 2 },
      ],
      audioText: "dix, onze, douze",
      revealNote: "«onze» — the next number after «dix», and the first teen.",
    },
    speaking("fr-m17-1-speak-onze", "onze", "eleven", ["onze"]),
    cloze(
      "fr-m17-1-cloze-onze",
      "",
      "",
      "onze",
      ["onze", "douze", "dix"],
      "eleven",
      "onze",
    ),
    build(
      "fr-m17-1-build-onze",
      "Build: 'it costs eleven euros'",
      "ça coûte onze euros",
      ["ça coûte", "onze euros", "dix euros", "douze euros"],
      ["ça coûte", "onze euros"],
    ),
    speaking("fr-m17-1-speak-douze", "douze", "twelve", ["douze"]),
    sentenceMcq({
      id: "fr-m17-1-smcq-douze",
      prompt: "'Twelve' — pick the French.",
      correctText: "douze",
      distractorsText: ["onze", "dix", "treize"],
    }),
    build(
      "fr-m17-1-build-douze",
      "Build: 'it costs twelve euros'",
      "ça coûte douze euros",
      ["ça coûte", "douze euros", "onze euros", "vingt euros"],
      ["ça coûte", "douze euros"],
    ),
    listeningCompSentence({
      id: "fr-m17-1-lc-onze",
      audioText: "ça coûte onze euros",
      correctMeaningEn: "it costs eleven euros",
      distractorsEn: ["it costs twelve euros", "it costs ten euros", "it costs twenty euros"],
    }),
    crossModuleMatchPairs("fr-m17-1", [["onze", "eleven"], ["douze", "twelve"], ["dix", "ten"], ["vingt", "twenty"], ["ça coûte", "it costs"], ["euros", "euros (currency, plural)"]]),
  ];
}

/** L2 — «Treize, quatorze»: two more teens, same engine. */
function lesson2(): LessonStep[] {
  return [
    {
      id: "fr-m17-2-map-treize",
      type: "word_map",
      tokens: ["douze", "treize", "quatorze"],
      pairs: [
        { en: "twelve", tokenIndex: 0 },
        { en: "thirteen", tokenIndex: 1 },
        { en: "fourteen", tokenIndex: 2 },
      ],
      audioText: "douze, treize, quatorze",
      revealNote: "Same engine, two more teens — «treize» and «quatorze».",
    },
    speaking("fr-m17-2-speak-treize", "treize", "thirteen", ["treize"]),
    cloze(
      "fr-m17-2-cloze-treize",
      "",
      "",
      "treize",
      ["treize", "quatorze", "douze"],
      "thirteen",
      "treize",
    ),
    build(
      "fr-m17-2-build-treize",
      "Build: 'it costs thirteen euros'",
      "ça coûte treize euros",
      ["ça coûte", "treize euros", "douze euros", "quatorze euros"],
      ["ça coûte", "treize euros"],
    ),
    speaking("fr-m17-2-speak-quatorze", "quatorze", "fourteen", ["quatorze"]),
    sentenceMcq({
      id: "fr-m17-2-smcq-quatorze",
      prompt: "'Fourteen' — pick the French.",
      correctText: "quatorze",
      distractorsText: ["treize", "quinze", "douze"],
    }),
    listeningCompSentence({
      id: "fr-m17-2-lc-quatorze",
      audioText: "ça coûte quatorze euros",
      correctMeaningEn: "it costs fourteen euros",
      distractorsEn: ["it costs thirteen euros", "it costs fifteen euros", "it costs four euros"],
    }),
    build(
      "fr-m17-2-build-douze-recap",
      "Build: 'it costs twelve euros'",
      "ça coûte douze euros",
      ["ça coûte", "douze euros", "onze euros", "quatorze euros"],
      ["ça coûte", "douze euros"],
    ),
    cloze(
      "fr-m17-2-cloze-onze-recap",
      "",
      "",
      "onze",
      ["onze", "douze", "treize"],
      "eleven",
      "onze",
    ),
    crossModuleMatchPairs("fr-m17-2", [["treize", "thirteen"], ["quatorze", "fourteen"], ["onze", "eleven"], ["douze", "twelve"], ["ça coûte", "it costs"], ["euros", "euros (currency, plural)"]]),
  ];
}

/** L3 — «Quinze, seize» + interleave break: the last two teens, then a
 *  non-number recall (m16, m11-sourced) so numbers don't block-teach
 *  three lessons straight. */
function lesson3(): LessonStep[] {
  return [
    {
      id: "fr-m17-3-map-quinze",
      type: "word_map",
      tokens: ["quatorze", "quinze", "seize"],
      pairs: [
        { en: "fourteen", tokenIndex: 0 },
        { en: "fifteen", tokenIndex: 1 },
        { en: "sixteen", tokenIndex: 2 },
      ],
      audioText: "quatorze, quinze, seize",
      revealNote: "The last two teens — «quinze» and «seize». After this, dix-sept/dix-huit/dix-neuf just glue dix to sept/huit/neuf.",
    },
    speaking("fr-m17-3-speak-quinze", "quinze", "fifteen", ["quinze"]),
    cloze(
      "fr-m17-3-cloze-quinze",
      "",
      "",
      "quinze",
      ["quinze", "seize", "quatorze"],
      "fifteen",
      "quinze",
    ),
    speaking("fr-m17-3-speak-seize", "seize", "sixteen", ["seize"]),
    build(
      "fr-m17-3-build-seize",
      "Build: 'it costs sixteen euros'",
      "ça coûte seize euros",
      ["ça coûte", "seize euros", "quinze euros", "douze euros"],
      ["ça coûte", "seize euros"],
    ),
    // Interleave break — a non-number recall so numbers don't dominate L1-3.
    speaking(
      "fr-m17-3-speak-parle-recall",
      "il parle français",
      "he speaks French",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m17-3-smcq-dixsept",
      prompt: "'Seventeen' — pick the French.",
      correctText: "dix-sept",
      distractorsText: ["dix-huit", "seize", "dix-neuf"],
    }),
    build(
      "fr-m17-3-build-dixhuit",
      "Build: 'it costs eighteen euros'",
      "ça coûte dix-huit euros",
      ["ça coûte", "dix-huit euros", "dix-sept euros", "dix-neuf euros"],
      ["ça coûte", "dix-huit euros"],
    ),
    listeningCompSentence({
      id: "fr-m17-3-lc-dixneuf",
      audioText: "ça coûte dix-neuf euros",
      correctMeaningEn: "it costs nineteen euros",
      distractorsEn: ["it costs eighteen euros", "it costs nine euros", "it costs seventeen euros"],
    }),
    crossModuleMatchPairs("fr-m17-3", [["quinze", "fifteen"], ["seize", "sixteen"], ["dix-sept", "seventeen"], ["dix-huit", "eighteen"], ["dix-neuf", "nineteen"], ["quatorze", "fourteen"]]),
  ];
}

/** L4 — «Soixante-dix»: the 70s ride the teens (60+dix, 60+onze…). First
 *  «et»-contrast card: 71 has «et» (mirrors m12's 21/31/41…), same as the
 *  regular tens. Written-only from here on — no speaking targets above
 *  the teens ceiling. */
function lesson4(): LessonStep[] {
  return [
    infoStep(
      "fr-m17-4-info-soixantedix",
      "Soixante-dix : 60 + 10",
      "Past soixante (60), French keeps counting by riding the teens: «soixante-dix» (70) is 60 + 10, a French name for the same idea. «Soixante et onze» (71) keeps the «et» rule from «vingt et un» — same shape, one more ten.",
    ),
    {
      id: "fr-m17-4-map-soixantedix",
      type: "word_map",
      tokens: ["soixante", "soixante-dix", "soixante et onze"],
      pairs: [
        { en: "sixty", tokenIndex: 0 },
        { en: "seventy", tokenIndex: 1 },
        { en: "seventy-one", tokenIndex: 2 },
      ],
      audioText: "soixante, soixante-dix, soixante et onze",
      revealNote: "«soixante-dix» = soixante + dix. «soixante et onze» keeps the «et» rule from vingt et un.",
    },
    // Recall — m16's «aller» in être-passé-composé form, first voiced there
    // (m16 fr-m16-8-speak-1, non-recall) — exact phrase, not the 1st-person
    // variant, which m16 never voiced as a bare speaking target.
    speaking(
      "fr-m17-4-speak-alle-recall",
      "il est déjà allé au parc",
      "he already went to the park",
      [],
      "recall",
    ),
    cloze(
      "fr-m17-4-cloze-soixantedix",
      "",
      "",
      "soixante-dix",
      ["soixante-dix", "soixante-douze", "soixante et onze"],
      "seventy",
      "soixante-dix",
    ),
    build(
      "fr-m17-4-build-soixantedix",
      "Build: 'it costs seventy euros'",
      "ça coûte soixante-dix euros",
      ["ça coûte", "soixante-dix euros", "soixante euros", "soixante et onze euros"],
      ["ça coûte", "soixante-dix euros"],
    ),
    sentenceMcq({
      id: "fr-m17-4-smcq-soixanteetonze",
      prompt: "'Seventy-one' — pick the French.",
      correctText: "soixante et onze",
      distractorsText: ["soixante-onze", "soixante-dix", "soixante-douze"],
    }),
    // Recall — m12's price question, directly resolvable (m12 < m17).
    speaking(
      "fr-m17-4-speak-combien-recall",
      "c'est combien ?",
      "how much is it?",
      [],
      "recall",
    ),
    build(
      "fr-m17-4-build-soixanteetonze",
      "Build: 'it costs seventy-one euros'",
      "ça coûte soixante et onze euros",
      ["ça coûte", "soixante et onze euros", "soixante-dix euros", "soixante-douze euros"],
      ["ça coûte", "soixante et onze euros"],
    ),
    listeningCompSentence({
      id: "fr-m17-4-lc-soixanteetonze",
      audioText: "ça coûte soixante et onze euros",
      correctMeaningEn: "it costs seventy-one euros",
      distractorsEn: ["it costs seventy euros", "it costs sixty-one euros", "it costs seventy-two euros"],
    }),
    crossModuleMatchPairs("fr-m17-4", [["soixante-dix", "seventy"], ["soixante et onze", "seventy-one"], ["soixante", "sixty"], ["onze", "eleven"], ["ça coûte", "it costs"], ["euros", "euros (currency, plural)"]]),
  ];
}

/** L5 — the rest of the 70s (72-79) + interleave break reaching further
 *  back than m11-m16 (m1's «merci beaucoup»). */
function lesson5(): LessonStep[] {
  return [
    {
      id: "fr-m17-5-map-72to76",
      type: "word_map",
      tokens: ["soixante-douze", "soixante-treize", "soixante-quatorze", "soixante-quinze", "soixante-seize"],
      pairs: [
        { en: "seventy-two", tokenIndex: 0 },
        { en: "seventy-three", tokenIndex: 1 },
        { en: "seventy-four", tokenIndex: 2 },
        { en: "seventy-five", tokenIndex: 3 },
        { en: "seventy-six", tokenIndex: 4 },
      ],
      audioText: "soixante-douze, soixante-treize, soixante-quatorze, soixante-quinze, soixante-seize",
      revealNote: "72-76 hyphenate straight onto the teens — no «et», that only happens at X1.",
    },
    cloze(
      "fr-m17-5-cloze-soixantequinze",
      "",
      "",
      "soixante-quinze",
      ["soixante-quinze", "soixante-seize", "soixante-treize"],
      "seventy-five",
      "soixante-quinze",
    ),
    // Interleave break, further back than m11-m16.
    speaking(
      "fr-m17-5-speak-merci-recall",
      "merci beaucoup",
      "thank you very much",
      [],
      "recall",
    ),
    build(
      "fr-m17-5-build-soixanteseize",
      "Build: 'it costs seventy-six euros'",
      "ça coûte soixante-seize euros",
      ["ça coûte", "soixante-seize euros", "soixante-six euros", "soixante-quinze euros"],
      ["ça coûte", "soixante-seize euros"],
    ),
    sentenceMcq({
      id: "fr-m17-5-smcq-soixantedixsept",
      prompt: "'Seventy-seven' — pick the French.",
      correctText: "soixante-dix-sept",
      distractorsText: ["soixante-dix-huit", "soixante-dix-neuf", "soixante-sept"],
    }),
    cloze(
      "fr-m17-5-cloze-soixantedouze",
      "",
      "",
      "soixante-douze",
      ["soixante-douze", "soixante-treize", "soixante-quatorze"],
      "seventy-two",
      "soixante-douze",
    ),
    build(
      "fr-m17-5-build-soixantedixneuf",
      "Build: 'it costs seventy-nine euros'",
      "ça coûte soixante-dix-neuf euros",
      ["ça coûte", "soixante-dix-neuf euros", "soixante-dix-sept euros", "soixante-dix-huit euros"],
      ["ça coûte", "soixante-dix-neuf euros"],
    ),
    sentenceMcq({
      id: "fr-m17-5-smcq-soixantetreize",
      prompt: "'Seventy-three' — pick the French.",
      correctText: "soixante-treize",
      distractorsText: ["soixante-douze", "soixante-quatorze", "soixante-seize"],
    }),
    listeningCompSentence({
      id: "fr-m17-5-lc-soixantedixhuit",
      audioText: "ça coûte soixante-dix-huit euros",
      correctMeaningEn: "it costs seventy-eight euros",
      distractorsEn: ["it costs seventy-seven euros", "it costs seventy-nine euros", "it costs sixty-eight euros"],
    }),
    crossModuleMatchPairs("fr-m17-5", [["soixante-douze", "seventy-two"], ["soixante-quinze", "seventy-five"], ["soixante-seize", "seventy-six"], ["soixante-dix-sept", "seventy-seven"], ["soixante-dix-neuf", "seventy-nine"], ["soixante-dix", "seventy"]]),
  ];
}

/** L6 — «Quatre-vingts»: the base-20 fossil begins. Second «et»-contrast
 *  card, load-bearing: quatre-vingt-un has NO «et», unlike soixante et
 *  onze. Debuts the module's 7th atom (the mechanical quatre-vingts fix,
 *  see header). */
function lesson6(): LessonStep[] {
  return [
    infoStep(
      "fr-m17-6-info-quatrevingts",
      "Quatre-vingts : 4 × 20",
      "«Quatre-vingts» (80) is 4 × 20 — «quatre» × «vingt» — with an -s that only shows when nothing follows. «Quatre-vingt-un» (81) drops the «et»: unlike «soixante et onze», there's no «et» anywhere in the 80s.",
    ),
    {
      id: "fr-m17-6-map-quatrevingts",
      type: "word_map",
      tokens: ["soixante-dix", "quatre-vingts", "quatre-vingt-un"],
      pairs: [
        { en: "seventy", tokenIndex: 0 },
        { en: "eighty", tokenIndex: 1 },
        { en: "eighty-one", tokenIndex: 2 },
      ],
      audioText: "soixante-dix, quatre-vingts, quatre-vingt-un",
      revealNote: "«quatre-vingts» — four twenties. The -s vanishes the instant a unit follows: quatre-vingt-un.",
    },
    cloze(
      "fr-m17-6-cloze-quatrevingts",
      "",
      "",
      "quatre-vingts",
      ["quatre-vingts", "quatre-vingt-un", "soixante-dix"],
      "eighty",
      "quatre-vingts",
    ),
    build(
      "fr-m17-6-build-quatrevingts",
      "Build: 'it costs eighty euros'",
      "ça coûte quatre-vingts euros",
      ["ça coûte", "quatre-vingts euros", "soixante-dix euros", "quatre-vingt-un euros"],
      ["ça coûte", "quatre-vingts euros"],
    ),
    sentenceMcq({
      id: "fr-m17-6-smcq-quatrevingtun-noet",
      prompt: "'Eighty-one' — pick the French.",
      correctText: "quatre-vingt-un",
      distractorsText: ["quatre-vingt-et-un", "quatre-vingts et un", "quatre-vingt"],
    }),
    // Interleave break, further back than m11-m16 — m1's own first voicing
    // (fr-m1v2-2-speak-svp, non-recall). 80-99 stay written-only, so the
    // module's only L6 speaking step is a non-number recall, not a new
    // number target.
    speaking(
      "fr-m17-6-speak-svp-recall",
      "s'il vous plaît",
      "please",
      [],
      "recall",
    ),
    build(
      "fr-m17-6-build-quatrevingtdeux",
      "Build: 'it costs eighty-two euros'",
      "ça coûte quatre-vingt-deux euros",
      ["ça coûte", "quatre-vingt-deux euros", "quatre-vingts euros", "quatre-vingt-un euros"],
      ["ça coûte", "quatre-vingt-deux euros"],
    ),
    cloze(
      "fr-m17-6-cloze-quatrevingttrois",
      "",
      "",
      "quatre-vingt-trois",
      ["quatre-vingt-trois", "quatre-vingt-deux", "quatre-vingt-quatre"],
      "eighty-three",
      "quatre-vingt-trois",
    ),
    listeningCompSentence({
      id: "fr-m17-6-lc-quatrevingtneuf",
      audioText: "ça coûte quatre-vingt-neuf euros",
      correctMeaningEn: "it costs eighty-nine euros",
      distractorsEn: ["it costs eighty euros", "it costs eighty-eight euros", "it costs seventy-nine euros"],
    }),
    crossModuleMatchPairs("fr-m17-6", [["quatre-vingts", "eighty (exactly)"], ["quatre-vingt-un", "eighty-one"], ["quatre-vingt-deux", "eighty-two"], ["soixante-dix", "seventy"], ["soixante et onze", "seventy-one"], ["ça coûte", "it costs"]]),
  ];
}

/** L7 — «Quatre-vingt-dix» (90) + 91-99 + interleave break reaching
 *  further back (m6's «je voudrais un croissant»). */
function lesson7(): LessonStep[] {
  return [
    {
      id: "fr-m17-7-map-quatrevingtdix",
      type: "word_map",
      tokens: ["quatre-vingts", "quatre-vingt-dix", "quatre-vingt-onze"],
      pairs: [
        { en: "eighty", tokenIndex: 0 },
        { en: "ninety", tokenIndex: 1 },
        { en: "ninety-one", tokenIndex: 2 },
      ],
      audioText: "quatre-vingts, quatre-vingt-dix, quatre-vingt-onze",
      revealNote: "«quatre-vingt-dix» = 4×20 + 10 = 90. Still no «et» at 91 — quatre-vingt-onze, same rule as 81.",
    },
    cloze(
      "fr-m17-7-cloze-quatrevingtdix",
      "",
      "",
      "quatre-vingt-dix",
      ["quatre-vingt-dix", "quatre-vingt-onze", "quatre-vingts"],
      "ninety",
      "quatre-vingt-dix",
    ),
    // Recall — internal, douze first voiced L1.
    speaking(
      "fr-m17-7-speak-douze-recall",
      "douze",
      "twelve",
      [],
      "recall",
    ),
    build(
      "fr-m17-7-build-quatrevingtonze",
      "Build: 'it costs ninety-one euros'",
      "ça coûte quatre-vingt-onze euros",
      ["ça coûte", "quatre-vingt-onze euros", "quatre-vingt-dix euros", "quatre-vingt-douze euros"],
      ["ça coûte", "quatre-vingt-onze euros"],
    ),
    // Interleave break, further back than m11-m16 — m6's own first voicing
    // (fr-m6-1-speak-croissant, non-recall), a speaking recall rather than
    // a full-sentence MCQ (moduleBarGuards bans pick-the-sentence MCQs).
    speaking(
      "fr-m17-7-speak-croissant-recall",
      "je voudrais un croissant",
      "I would like a croissant",
      [],
      "recall",
    ),
    sentenceMcq({
      id: "fr-m17-7-smcq-quatrevingtquinze",
      prompt: "'Ninety-five' — pick the French.",
      correctText: "quatre-vingt-quinze",
      distractorsText: ["quatre-vingt-cinq", "quatre-vingt-quatorze", "quatre-vingt-seize"],
    }),
    build(
      "fr-m17-7-build-quatrevingtdixneuf",
      "Build: 'it costs ninety-nine euros'",
      "ça coûte quatre-vingt-dix-neuf euros",
      ["ça coûte", "quatre-vingt-dix-neuf euros", "quatre-vingt-dix-huit euros", "quatre-vingt-dix-sept euros"],
      ["ça coûte", "quatre-vingt-dix-neuf euros"],
    ),
    cloze(
      "fr-m17-7-cloze-quatrevingtdouze",
      "",
      "",
      "quatre-vingt-douze",
      ["quatre-vingt-douze", "quatre-vingt-treize", "quatre-vingt-onze"],
      "ninety-two",
      "quatre-vingt-douze",
    ),
    listeningCompSentence({
      id: "fr-m17-7-lc-quatrevingtdixhuit",
      audioText: "ça coûte quatre-vingt-dix-huit euros",
      correctMeaningEn: "it costs ninety-eight euros",
      distractorsEn: ["it costs ninety-seven euros", "it costs ninety-nine euros", "it costs eighty-eight euros"],
    }),
    crossModuleMatchPairs("fr-m17-7", [["quatre-vingt-dix", "ninety"], ["quatre-vingt-onze", "ninety-one"], ["quatre-vingt-quinze", "ninety-five"], ["quatre-vingt-dix-neuf", "ninety-nine"], ["quatre-vingts", "eighty (exactly)"], ["cent", "one hundred"]]),
  ];
}

/** L8 — checkpoint: zero-new, every step graded. */
function checkpointLesson(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m17-8-smcq-onze",
      prompt: "'Eleven' — pick the French.",
      correctText: "onze",
      distractorsText: ["douze", "dix", "seize"],
    }),
    cloze(
      "fr-m17-8-cloze-quatorze",
      "",
      "",
      "quatorze",
      ["quatorze", "quinze", "treize"],
      "fourteen",
      "quatorze",
    ),
    build(
      "fr-m17-8-build-seize",
      "Build: 'it costs sixteen euros'",
      "ça coûte seize euros",
      ["ça coûte", "seize euros", "quinze euros", "onze euros"],
      ["ça coûte", "seize euros"],
    ),
    speaking("fr-m17-8-speak-quinze", "quinze", "fifteen", []),
    listeningCompSentence({
      id: "fr-m17-8-lc-dixsept",
      audioText: "ça coûte dix-sept euros",
      correctMeaningEn: "it costs seventeen euros",
      distractorsEn: ["it costs eleven euros", "it costs seven euros", "it costs eighteen euros"],
    }),
    sentenceMcq({
      id: "fr-m17-8-smcq-soixanteetonze",
      prompt: "'Seventy-one' — pick the French.",
      correctText: "soixante et onze",
      distractorsText: ["soixante-onze", "soixante-dix", "quatre-vingt-onze"],
    }),
    cloze(
      "fr-m17-8-cloze-soixantequinze",
      "",
      "",
      "soixante-quinze",
      ["soixante-quinze", "soixante-seize", "soixante-treize"],
      "seventy-five",
      "soixante-quinze",
    ),
    build(
      "fr-m17-8-build-quatrevingts",
      "Build: 'it costs eighty euros'",
      "ça coûte quatre-vingts euros",
      ["ça coûte", "quatre-vingts euros", "quatre-vingt-un euros", "soixante-dix euros"],
      ["ça coûte", "quatre-vingts euros"],
    ),
    sentenceMcq({
      id: "fr-m17-8-smcq-quatrevingtun",
      prompt: "'Eighty-one' — pick the French.",
      correctText: "quatre-vingt-un",
      distractorsText: ["quatre-vingt-et-un", "quatre-vingts", "quatre-vingt-onze"],
    }),
    cloze(
      "fr-m17-8-cloze-quatrevingtdix",
      "",
      "",
      "quatre-vingt-dix",
      ["quatre-vingt-dix", "quatre-vingt-onze", "quatre-vingts"],
      "ninety",
      "quatre-vingt-dix",
    ),
    build(
      "fr-m17-8-build-quatrevingtonze",
      "Build: 'it costs ninety-one euros'",
      "ça coûte quatre-vingt-onze euros",
      ["ça coûte", "quatre-vingt-onze euros", "quatre-vingt-dix euros", "quatre-vingt-douze euros"],
      ["ça coûte", "quatre-vingt-onze euros"],
    ),
    crossModuleMatchPairs("fr-m17-8", [["onze", "eleven"], ["quatorze", "fourteen"], ["seize", "sixteen"], ["soixante et onze", "seventy-one"], ["quatre-vingts", "eighty (exactly)"], ["quatre-vingt-onze", "ninety-one"]]),
  ];
}

/** L9 — integration: ≥10 steps, no info card, closing tail on m12's own
 *  market-stall vendor (Nadia) now haggling in the 70-99 range. 2-3
 *  cross-module recalls reach further back than m11-m16. */
function lesson9(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m17-9-smcq-treize",
      prompt: "'Thirteen' — pick the French.",
      correctText: "treize",
      distractorsText: ["quatorze", "douze", "seize"],
    }),
    build(
      "fr-m17-9-build-soixantedix",
      "Build: 'it costs seventy euros'",
      "ça coûte soixante-dix euros",
      ["ça coûte", "soixante-dix euros", "soixante euros", "quatre-vingts euros"],
      ["ça coûte", "soixante-dix euros"],
    ),
    // Recall — further back, m9.
    crossModuleVocabMcq(
      "fr-m17-9-cross-grand",
      "big / tall",
      "grand",
      ["petit", "bon", "c'est cher"],
    ),
    cloze(
      "fr-m17-9-cloze-quatrevingtcinq",
      "",
      "",
      "quatre-vingt-cinq",
      ["quatre-vingt-cinq", "quatre-vingt-quinze", "soixante-cinq"],
      "eighty-five",
      "quatre-vingt-cinq",
    ),
    build(
      "fr-m17-9-build-quatrevingtdixneuf",
      "Build: 'it costs ninety-nine euros, that's expensive'",
      "ça coûte quatre-vingt-dix-neuf euros, c'est cher",
      ["ça coûte quatre-vingt-dix-neuf euros", "c'est cher", "ce n'est pas cher", "soixante-dix euros"],
      ["ça coûte quatre-vingt-dix-neuf euros", "c'est cher"],
    ),
    // Recall — further back, m1.
    speaking(
      "fr-m17-9-speak-bonjour-recall",
      "bonjour",
      "hello / good day",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m17-9-lc-integration",
      audioText: "c'est combien ? ça coûte quatre-vingt-quinze euros, c'est cher",
      correctMeaningEn: "How much is it? It costs ninety-five euros, that's expensive.",
      distractorsEn: [
        "How much is it? It costs eighty-five euros, that's expensive.",
        "How much is it? It costs ninety-five euros, that's cheap.",
        "It's expensive. It costs ninety-five euros.",
      ],
    }),
    // Recall — m12's own exact speaking target (fr-m12-6-speak-cacoute,
    // non-recall) — "ça coûte" bare was never voiced on its own, only in
    // this full price-frame phrase.
    speaking(
      "fr-m17-9-speak-cacoute-recall",
      "ça coûte vingt euros",
      "it costs twenty euros",
      [],
      "recall",
    ),
    crossModuleMatchPairs("fr-m17-9", [["soixante-dix", "seventy"], ["quatre-vingts", "eighty (exactly)"], ["quatre-vingt-dix", "ninety"], ["quatre-vingt-quinze", "ninety-five"], ["c'est cher", "it's expensive"], ["ce n'est pas cher", "it's not expensive / it's cheap"]]),
    {
      id: "fr-m17-9-sim-marche",
      type: "dialogue_sim",
      scene: { emoji: "🛒", title: "Market stall, again" },
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
            kana: "Ça coûte quatre-vingts euros.",
            audioText: "ça coûte quatre-vingts euros",
            gloss: "It costs eighty euros.",
          },
          goal: "React — that's expensive!",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "quatre-vingts euros, c'est cher !" },
              { id: "wrong-cheap", text: "quatre-vingts euros, ce n'est pas cher !" },
              { id: "wrong-q", text: "quatre-vingts euros, c'est combien ?" },
            ],
            correctOptionId: "correct",
            audioText: "quatre-vingts euros, c'est cher !",
          },
          replyGloss: "Eighty euros, that's expensive!",
        },
        {
          id: "t3-haggle",
          npc: {
            speaker: "Nadia",
            kana: "D'accord, d'accord — soixante et onze euros.",
            audioText: "d'accord, d'accord — soixante et onze euros",
            gloss: "Okay, okay — seventy-one euros.",
          },
          goal: "Say okay, that's not expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, ce n'est pas cher" },
              { id: "wrong-cher", text: "d'accord, c'est cher" },
              { id: "wrong-form", text: "d'accord, ce n'est pas onze" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, ce n'est pas cher",
          },
          replyGloss: "Okay, that's not expensive.",
        },
      ],
    },
  ];
}

/** L10 — mastery: every atom present, all graded, ends on a generic
 *  soft-tease dialogue_sim. */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m17-10-smcq-onze-recap",
      prompt: "'Eleven' — pick the French.",
      correctText: "onze",
      distractorsText: ["douze", "seize", "dix"],
    }),
    cloze(
      "fr-m17-10-cloze-douze",
      "",
      "",
      "douze",
      ["douze", "treize", "onze"],
      "twelve",
      "douze",
    ),
    build(
      "fr-m17-10-build-treize",
      "Build: 'it costs thirteen euros'",
      "ça coûte treize euros",
      ["ça coûte", "treize euros", "quatorze euros", "quinze euros"],
      ["ça coûte", "treize euros"],
    ),
    listeningCompSentence({
      id: "fr-m17-10-lc-quatorze",
      audioText: "ça coûte quatorze euros",
      correctMeaningEn: "it costs fourteen euros",
      distractorsEn: ["it costs thirteen euros", "it costs fifteen euros", "it costs forty euros"],
    }),
    sentenceMcq({
      id: "fr-m17-10-smcq-quinze",
      prompt: "'Fifteen' — pick the French.",
      correctText: "quinze",
      distractorsText: ["quatorze", "seize", "cinq"],
    }),
    // Recall — internal, seize first voiced L3.
    speaking(
      "fr-m17-10-speak-seize-recall",
      "seize",
      "sixteen",
      [],
      "recall",
    ),
    build(
      "fr-m17-10-build-soixanteetonze",
      "Build: 'it costs seventy-one euros'",
      "ça coûte soixante et onze euros",
      ["ça coûte", "soixante et onze euros", "soixante-dix euros", "soixante-douze euros"],
      ["ça coûte", "soixante et onze euros"],
    ),
    cloze(
      "fr-m17-10-cloze-quatrevingts",
      "",
      "",
      "quatre-vingts",
      ["quatre-vingts", "quatre-vingt-un", "soixante-dix"],
      "eighty",
      "quatre-vingts",
    ),
    sentenceMcq({
      id: "fr-m17-10-smcq-quatrevingtdix",
      prompt: "'Ninety' — pick the French.",
      correctText: "quatre-vingt-dix",
      distractorsText: ["quatre-vingts", "quatre-vingt-onze", "soixante-dix"],
    }),
    // Recall — internal, vingt sourced from m12, directly resolvable.
    speaking(
      "fr-m17-10-speak-vingt-recall",
      "vingt",
      "twenty",
      [],
      "recall",
    ),
    crossModuleMatchPairs("fr-m17-10", [["onze", "eleven"], ["douze", "twelve"], ["treize", "thirteen"], ["quatorze", "fourteen"], ["quinze", "fifteen"], ["seize", "sixteen"], ["quatre-vingts", "eighty (exactly)"]]),
    {
      id: "fr-m17-10-sim-epicerie",
      type: "dialogue_sim",
      scene: { emoji: "🧺", title: "The épicerie, one more time" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-combien",
          npc: {
            speaker: "Théo",
            kana: "Bonjour ! Voilà le fromage et le gâteau. C'est combien pour les deux ?",
            audioText: "bonjour ! voilà le fromage et le gâteau. c'est combien pour les deux ?",
            gloss: "Hello! Here's the cheese and the cake. How much for both?",
          },
          goal: "React — okay, sixteen euros.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, seize euros" },
              { id: "wrong-price", text: "d'accord, soixante euros" },
              { id: "wrong-form", text: "d'accord, seize euro" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, seize euros",
          },
          replyGloss: "Okay, sixteen euros.",
        },
        {
          id: "t2-tease",
          npc: {
            speaker: "Théo",
            kana: "Et demain, encore ?",
            audioText: "et demain, encore ?",
            gloss: "And tomorrow, again?",
          },
          goal: "Say okay, see you soon.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, à bientôt" },
              { id: "wrong-bye", text: "d'accord, au revoir" },
              { id: "wrong-mix", text: "à bientôt, ce n'est pas cher" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, à bientôt",
          },
          replyGloss: "Okay, see you soon.",
        },
      ],
    },
  ];
}

const FR_M17_1: LessonContent = {
  id: "fr-m17-1",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Onze, douze",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M17_2: LessonContent = {
  id: "fr-m17-2",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Treize, quatorze",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M17_3: LessonContent = {
  id: "fr-m17-3",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Quinze, seize",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M17_4: LessonContent = {
  id: "fr-m17-4",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Soixante-dix",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M17_5: LessonContent = {
  id: "fr-m17-5",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Soixante-douze à soixante-dix-neuf",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M17_6: LessonContent = {
  id: "fr-m17-6",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Quatre-vingts",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M17_7: LessonContent = {
  id: "fr-m17-7",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Quatre-vingt-dix",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M17_8: LessonContent = {
  id: "fr-m17-8",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · De onze à cent",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M17_9: LessonContent = {
  id: "fr-m17-9",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Le marché, encore",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M17_10: LessonContent = {
  id: "fr-m17-10",
  moduleId: "m17",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "L'épicerie",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M17_MODULE: FrModuleDef = {
  title: "De onze à cent",
  eyebrow: "Module 17",
  summary:
    "The teens French skipped — onze through seize — then the two irregular zones past soixante: the 70s ride the teens, the 80s and 90s are four-twenties.",
  lessons: [
    FR_M17_1,
    FR_M17_2,
    FR_M17_3,
    FR_M17_4,
    FR_M17_5,
    FR_M17_6,
    FR_M17_7,
    FR_M17_8,
    FR_M17_9,
    FR_M17_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M17_CHECKPOINT_INDEX = 8;

export const FR_M17_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m17-s",
    moduleId: "m17",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m17-s",
        prompt: "'Eleven' — pick the French.",
        correctText: "onze",
        distractorsText: ["douze", "dix", "seize"],
      }),
  },
  {
    id: "pt-fr-m17-1",
    moduleId: "m17",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m17-1",
        prompt: "'Fourteen' — pick the French.",
        correctText: "quatorze",
        distractorsText: ["quatre", "quinze", "treize"],
      }),
  },
  {
    id: "pt-fr-m17-2",
    moduleId: "m17",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m17-2",
        prompt: "'Seventy-one' — pick the French.",
        correctText: "soixante et onze",
        distractorsText: ["soixante-onze", "soixante-dix", "quatre-vingt-onze"],
      }),
  },
  {
    id: "pt-fr-m17-3",
    moduleId: "m17",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m17-3",
        prompt: "'Eighty' — pick the French.",
        correctText: "quatre-vingts",
        distractorsText: ["quatre-vingt-un", "soixante-dix", "quatre-vingt-dix"],
      }),
  },
  {
    id: "pt-fr-m17-4",
    moduleId: "m17",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m17-4",
        prompt: "'Ninety-one' — pick the French.",
        correctText: "quatre-vingt-onze",
        distractorsText: ["quatre-vingt-et-onze", "quatre-vingt-dix", "quatre-vingts"],
      }),
  },
];
