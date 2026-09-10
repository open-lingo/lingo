/**
 * m21.ts — «De cent à mille» — hundreds and thousands.
 *
 * AUTHORED 2026-09-10 per docs/fr-m21-brief-2026-09-10.md, with the
 * binding speech-safety constraints of docs/fr-speech-hundreds-2026-09-10.md
 * (the probe that ran AFTER the brief and overrides it where they
 * conflict). The learner already owns «cent» (m12, invariant round
 * ceiling at exactly 100) and every regular ten 20-60 plus «quatre-vingts»
 * (m17, the same conditionally-s-taking shape this module now teaches
 * for «cent»). This module extends the number system past 100: the
 * multiplied hundreds (deux cents ... neuf cents), «mille» (invariable,
 * never takes -s at any magnitude), and composite hundreds (cent un,
 * deux cent cinquante, ...), all in the m12 price frame («ça coûte X
 * euros») rather than as a bare counting list.
 *
 * SCOPE DECISIONS (brief §7-equivalent, executed not re-litigated):
 *   - New atoms: exactly two — «cents» (the conditionally-appearing
 *     plural of «cent») and «mille» (one thousand, invariable). Verified
 *     in code: `getFrRealFormLexicon()` builds its known-vocabulary set
 *     purely from `frTokens(atom.surface)` per registered atom, with NO
 *     plural/conjugation-joining logic — so "cents" is not automatically
 *     covered by the existing «cent» atom (m12) and needs its own entry,
 *     exactly mirroring m17's own «quatre-vingts» atom (registered for
 *     the identical mechanical reason: a trailing -s that shows only
 *     when nothing follows). «mille» is a wholly new round-ceiling word,
 *     also needs its own atom. No atom for "milles" (the wrong plural)
 *     — it never appears as a correct answer, only ever as a foil.
 *   - No atom for any composite ("cent un", "deux cent cinquante",
 *     "quatre-vingt-dix", ...) — every composite tokenizes into already-
 *     taught pieces (cent/mille m12/m21, the digits m1/m12/m17, the tens
 *     m12, quatre-vingts m17) via `frTokens`'s hyphen-splitting, so no
 *     new atom is needed for any of them — mirrors m12's own precedent
 *     of never registering "vingt-deux" etc. as atoms.
 *   - «combien» / «c'est combien ?» is reused as LITERAL TEXT only
 *     inside the two dialogue_sims (L9/L10), exactly following m12's own
 *     precedent (m12.ts's Nadia and Théo scenes use "c'est combien ?" as
 *     plain dialogue text with no atom registered for it either) —
 *     dialogue_sim reply text is outside the comprehensibility-gate's
 *     scan (`frSurfaces()` has no dialogue_sim case), so this is safe by
 *     the same precedent this course already ships.
 *   - Cast: reuses Nadia (L9 integration sim, m12's market-stall NPC)
 *     and Théo (L10 mastery sim, m12's boutique NPC), scaled from
 *     tens/units prices to hundreds/thousands prices — both already-
 *     established FR_PROPER_NAMES-adjacent names from m12 (neither
 *     "nadia" nor "théo" needs FR_PROPER_NAMES coverage since `speaker`
 *     fields are never scanned by any gate).
 *
 * SPEECH-SAFETY CONSTRAINTS (docs/fr-speech-hundreds-2026-09-10.md,
 * applied throughout, UNCONDITIONALLY — unlike m20's L6-liftable
 * first-exposure convention, this is a real speech-grading false-
 * positive risk, not a pacing convention, so it is never lifted, not
 * even at the checkpoint):
 *   1. Bare ROUND multiples (cent, deux cents ... neuf cents, mille,
 *      deux mille, ...) MAY use `speaking` — verified safe (perfect
 *      match against a digit-ITN transcript), including inside the m12
 *      price frame. REVIEWER UPDATE (post-commit 63682abd): the original
 *      draft graded THREE distinct round-value targets via `speaking`
 *      in this module — L1 "deux cents", L2 "huit cents", L3 "deux
 *      mille" — but a throwaway probe against the real
 *      `scoreAlternativesGeneric` matcher showed these three phrases are
 *      mutually confusable SIBLINGS: saying any one scores 0.556-0.857
 *      (above the 0.55 "close" pass floor) against either of the
 *      others' graded speaking check. This violates
 *      docs/fr-speech-minimal-pairs-2026-09-10.md's binding constraint
 *      ("a `speaking` step must never be the sole graded checkpoint for
 *      ... a swapped numeral ... that the same module also teaches as a
 *      sibling target") — undetected pre-ship only because that doc's
 *      own census explicitly excludes m21 as "in flight." Fix: L1's
 *      "deux cents" is now the module's ONLY graded, non-recall
 *      `speaking` target for a round multiple; L2's and L3's graded
 *      exposures were converted to `build_sentence`
 *      (fr-m21-2-build-huitcents, fr-m21-3-build-deuxmille), each
 *      immediately followed by an inserted recall `speaking` step
 *      re-targeting the now-sole-safe "deux cents" phrase, to preserve
 *      each lesson's ≥1-spoken floor without reintroducing a confusable
 *      sibling.
 *   2. COMPOSITE numbers (cent un, deux cent cinquante, quatre-vingt-
 *      dix, ...) NEVER appear in a `speaking` step — recall or graded,
 *      teaching lesson or checkpoint. Finding 2 of the probe: a WRONG
 *      digit hearing scores as well as the right one for composites
 *      (0.571 both directions) — this is worse than unrecognized, so no
 *      exception exists anywhere, including the checkpoint's transfer
 *      test (constraint diverges deliberately from m20's own checkpoint
 *      precedent, where a novel recombination WAS promoted to a graded
 *      speaking step — that promotion is unsafe here, so the checkpoint's
 *      transfer test of a fresh composite recombination is a graded
 *      `build` step instead, never `speaking`). Composites are exercised
 *      freely via cloze/build/sentenceMcq/listening_comprehension/
 *      dialogue_sim reply-choice — none of those are speech-graded.
 *   3. No `alsoAccepted` digit form is ever offered for a composite
 *      build step (a wrong digit would pass as easily as a right one).
 *   4. Never gate a `speaking` step's pass/fail on cent-vs-cents or
 *      cent/sans/sang — no speaking step in this module targets a bare
 *      "cent"/"cents" against a "sans"/"sang" foil.
 *   5. Liaison is free — "deux cents euros" is never penalized either
 *      way; no course content claims one production is wrong.
 *   6. m17's 70-99 gap (soixante-dix ... quatre-vingt-dix-neuf have no
 *      live speaking precedent, digit-ITN fails 70-99) is NOT extended
 *      here: «quatre-vingts» (m17, exactly 80, IS speech-safe per the
 *      round-multiples fix) never appears in a NEW `speaking` step in
 *      this module — L7's «quatre-vingts»/«quatre-vingt-dix» review is
 *      entirely written (info/cloze/build), continuing to flag the 70-99
 *      range as unspoken for whoever authors it next.
 *
 * "Real use, not a bare list" (task instruction): every hundred/thousand
 * appears inside the m12 price frame («ça coûte X euros») or inside the
 * two dialogue_sims' market/boutique negotiation — never a bare counting
 * list. The "reasoning moment" is L5: the learner DEDUCES the -s-drop
 * rule from a contrasting pair («deux cents» vs «deux cent un») rather
 * than being told a rule outright; L7 recognizes the exact same shape
 * already known from m17's «quatre-vingts»/«quatre-vingt-dix» and ties
 * the two rules together explicitly.
 *
 * Interleaving: L1-L3 debut (cents, then more round multiples, then
 * mille) each separated by a different micro-focus (price frame, review,
 * new ceiling) rather than block-teaching all round multiples before any
 * composite; L4 consolidates and is the last lesson to introduce a new
 * graded speaking target; L5-L7 debut and drill composites, interleaved
 * with round-multiple recall speaking and one m17 tie-in (L7); L8
 * checkpoint tests a fresh composite recombination via `build`, never
 * `speaking`; L9/L10 close on scaled-up reuses of m12's own Nadia/Théo
 * dialogue_sims.
 *
 * VOICING LEDGER — every `cue:"recall"` step and its source (REVISED by
 * the reviewer alongside the constraint-1 fix above; L2/L3 no longer
 * voice "huit cents"/"deux mille" non-recall, so every recall that used
 * to point at them was repointed to an empirically-verified-safe,
 * diverse phrase already voiced elsewhere in the live course, m1-m20 —
 * same cross-module-recall precedent m20.ts itself already uses):
 *   - L2 recalls "ça coûte deux cents euros" (L1's own voicing) —
 *     inserted immediately after the new fr-m21-2-build-huitcents step,
 *     to keep L2's ≥1-spoken floor after huit cents left `speaking`.
 *   - L3 recalls "ça coûte deux cents euros" (L1's own voicing) —
 *     inserted immediately after the new fr-m21-3-build-deuxmille step,
 *     same reason.
 *   - L4 recalls "ça coûte deux cents euros" (L1's own voicing) and
 *     "il parle français" (m20's own voicing, cross-module recall) —
 *     the last lesson before composites take over.
 *   - L5 recalls "ça coûte deux cents euros" (L1's own voicing) — added
 *     so this composites-only reasoning lesson still clears the density
 *     gate's per-lesson ≥1-`speaking` floor without touching constraint 2
 *     (composites themselves are still never spoken).
 *   - L6 recalls "un grand chat" (m20's own voicing, cross-module
 *     recall).
 *   - L7 recalls "je vais au cinéma" (m20's own voicing, cross-module
 *     recall).
 *   - L8 (checkpoint) recalls "ça coûte deux cents euros" and "bonjour"
 *     (m20's own voicing, cross-module recall); the checkpoint's actual
 *     novel-recombination transfer test is the `build` step targeting
 *     "ça coûte deux mille cinq cents euros" (2500 — combines the
 *     invariable «mille» with a terminal «cents» in one sentence for the
 *     first time), never spoken.
 *   - L9 recalls "c'est lundi" (m20's own voicing, cross-module recall).
 *   - L10 recalls "c'est combien ?" (m12's own voicing, cross-module recall)
 *     — "ça coûte deux cents euros" was moved out because L10's recap MCQ
 *     carries the silent-s foils «deux cent euros»/«deux cents euro», which
 *     the speech matcher cannot tell apart (minimal-pair gate, 2026-09-10).
 *   Total: 11 recalls, exceeding the course-wide ≥8 floor; each
 *   in-module recall's targetPhrase is an exact string match against
 *   L1's own surviving "deux cents" speaking call; each cross-module
 *   recall's targetPhrase is an exact string match against its m20
 *   source (verified against the course-wide voiced-first walk both
 *   modules share).
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
 * bypassing the atom registry — same m2-m9 import.meta.glob ordering
 * landmine m17-m20.ts route around (see those files' own comments).
 * Used for EVERY match_pairs step in this module.
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

export const FR_M21_ATOMS: FrAtom[] = [
  atom({
    surface: "cents",
    meaningEn: "hundred(s) — plural of «cent»",
    partOfSpeech: "other",
    fromModule: "m21",
    kind: "vocab",
    hint: "sahn — same sound as «cent», the -s is silent; it shows in writing ONLY when a multiplier (deux, trois...) precedes it AND nothing follows — deux cents, but deux cent un",
  }),
  atom({
    surface: "mille",
    meaningEn: "one thousand",
    partOfSpeech: "other",
    fromModule: "m21",
    kind: "vocab",
    hint: "meel — the next round ceiling after «cent»; UNLIKE «cent», it never takes -s, at any size: mille, deux mille, trois mille...",
  }),
];

/** L1 — bridge: m12's invariant «cent» debuts its multiplied plural
 *  «cents» inside the price frame. Round multiple, so its `speaking`
 *  step here is graded and non-recall (constraint 1). */
function lesson1(): LessonStep[] {
  return [
    infoStep(
      "fr-m21-1-info-cents",
      "After one hundred, two hundred",
      "«Cent» — one hundred — doesn't change form alone: «cent» stays «cent» (m12). But put a number in front of it and, from two up, it takes an -s: «deux cents», «trois cents»... more than one hundred, plural like any counted word. The -s is silent — you'll only ever see it, not hear it.",
    ),
    {
      id: "fr-m21-1-map-deuxcents",
      type: "word_map",
      tokens: ["deux", "cents"],
      pairs: [
        { en: "two", tokenIndex: 0 },
        { en: "hundreds", tokenIndex: 1 },
      ],
      audioText: "deux cents",
      revealNote: "«deux cents» — the multiplier «deux» plus «cent», now plural.",
    },
    cloze(
      "fr-m21-1-cloze-deuxcents",
      "Ça coûte deux",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs two hundred euros",
      "ça coûte deux cents euros",
      "«deux» + «cent» → the -s lands on «cent», not on «deux».",
    ),
    build(
      "fr-m21-1-build-troiscents",
      "Build: 'it costs three hundred euros'",
      "ça coûte trois cents euros",
      ["ça coûte", "trois cents euros", "trois cent euros", "deux cents euros"],
      ["ça coûte", "trois cents euros"],
      ["cents"],
    ),
    cloze(
      "fr-m21-1-cloze-quatrecents",
      "Ça coûte quatre",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs four hundred euros",
      "ça coûte quatre cents euros",
    ),
    speaking(
      "fr-m21-1-speak-deuxcents",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      ["cents"],
    ),
    build(
      "fr-m21-1-build-sixcents",
      "Build: 'it costs six hundred euros'",
      "ça coûte six cents euros",
      ["ça coûte", "six cents euros", "six cent euros", "six cent mille euros"],
      ["ça coûte", "six cents euros"],
    ),
    {
      id: "fr-m21-1-map-cinqcents",
      type: "word_map",
      tokens: ["cinq", "cents"],
      pairs: [
        { en: "five", tokenIndex: 0 },
        { en: "hundreds", tokenIndex: 1 },
      ],
      audioText: "cinq cents",
      revealNote: "«cinq cents» — five hundred, same -s pattern.",
    },
    listeningCompSentence({
      id: "fr-m21-1-lc-cinqcents",
      audioText: "ça coûte cinq cents euros",
      correctMeaningEn: "It costs five hundred euros",
      distractorsEn: [
        "It costs five euros",
        "It costs fifty euros",
        "It costs five hundred fifty euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-1", [
      ["cent", "one hundred"],
      ["cents", "hundreds (plural)"],
      ["deux", "two"],
      ["trois", "three"],
      ["cinq", "five"],
      ["euros", "euros"],
    ]),
  ];
}

/** L2 — more round multiples (six through nine hundred), review. */
function lesson2(): LessonStep[] {
  return [
    {
      id: "fr-m21-2-map-septcents",
      type: "word_map",
      tokens: ["sept", "cents"],
      pairs: [
        { en: "seven", tokenIndex: 0 },
        { en: "hundreds", tokenIndex: 1 },
      ],
      audioText: "sept cents",
      revealNote: "«sept cents» — seven hundred.",
    },
    cloze(
      "fr-m21-2-cloze-sixcents",
      "Ça coûte six",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs six hundred euros",
      "ça coûte six cents euros",
    ),
    build(
      "fr-m21-2-build-neufcents",
      "Build: 'it costs nine hundred euros'",
      "ça coûte neuf cents euros",
      ["ça coûte", "neuf cents euros", "neuf cent euros", "huit cents euros"],
      ["ça coûte", "neuf cents euros"],
    ),
    cloze(
      "fr-m21-2-cloze-cinqcents",
      "Ça coûte cinq",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs five hundred euros",
      "ça coûte cinq cents euros",
    ),
    build(
      "fr-m21-2-build-huitcents",
      "Build: 'it costs eight hundred euros'",
      "ça coûte huit cents euros",
      ["ça coûte", "huit cents euros", "huit cent euros", "huit mille euros"],
      ["ça coûte", "huit cents euros"],
    ),
    speaking(
      "fr-m21-2-speak-deuxcents-recall",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      [],
      "recall",
    ),
    build(
      "fr-m21-2-build-quatrecents",
      "Build: 'it costs four hundred euros'",
      "ça coûte quatre cents euros",
      ["ça coûte", "quatre cents euros", "quatre cent euros", "quatre cent mille euros"],
      ["ça coûte", "quatre cents euros"],
    ),
    listeningCompSentence({
      id: "fr-m21-2-lc-deuxcents-review",
      audioText: "ça coûte deux cents euros",
      correctMeaningEn: "It costs two hundred euros",
      distractorsEn: [
        "It costs two euros",
        "It costs twenty euros",
        "It costs two hundred twenty euros",
      ],
    }),
    cloze(
      "fr-m21-2-cloze-septcents",
      "Ça coûte sept",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs seven hundred euros",
      "ça coûte sept cents euros",
      "nothing follows «cents» here, so the -s stays.",
    ),
    listeningCompSentence({
      id: "fr-m21-2-lc-quatrecents",
      audioText: "ça coûte quatre cents euros",
      correctMeaningEn: "It costs four hundred euros",
      distractorsEn: [
        "It costs fourteen euros",
        "It costs forty euros",
        "It costs four hundred forty euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-2", [
      ["six", "six"],
      ["sept", "seven"],
      ["huit", "eight"],
      ["neuf", "nine"],
      ["cents", "hundreds (plural)"],
      ["euros", "euros"],
    ]),
  ];
}

/** L3 — «mille»: the next round ceiling, invariable at every size. */
function lesson3(): LessonStep[] {
  return [
    infoStep(
      "fr-m21-3-info-mille",
      "The next round number",
      "«Mille» — one thousand — is the next ceiling after «cent», same shape: a round number, not built from smaller pieces. But unlike «cent», «mille» NEVER takes an -s, at any size: mille, deux mille, trois mille... always «mille».",
    ),
    {
      id: "fr-m21-3-map-deuxmille",
      type: "word_map",
      tokens: ["deux", "mille"],
      pairs: [
        { en: "two", tokenIndex: 0 },
        { en: "thousand", tokenIndex: 1 },
      ],
      audioText: "deux mille",
      revealNote: "«deux mille» — «mille» never changes form, no matter the multiplier.",
    },
    cloze(
      "fr-m21-3-cloze-troismille",
      "Ça coûte trois",
      "euros.",
      "mille",
      ["mille", "cents"],
      "it costs three thousand euros",
      "ça coûte trois mille euros",
      "«mille» never takes -s — not even here, unlike «cent» → «cents».",
    ),
    build(
      "fr-m21-3-build-troismille",
      "Build: 'it costs three thousand euros'",
      "ça coûte trois mille euros",
      ["ça coûte", "trois mille euros", "trois cents euros", "deux mille euros"],
      ["ça coûte", "trois mille euros"],
      ["mille"],
    ),
    cloze(
      "fr-m21-3-cloze-quatremille",
      "Ça coûte quatre",
      "euros.",
      "mille",
      ["mille", "cents"],
      "it costs four thousand euros",
      "ça coûte quatre mille euros",
    ),
    build(
      "fr-m21-3-build-deuxmille",
      "Build: 'it costs two thousand euros'",
      "ça coûte deux mille euros",
      ["ça coûte", "deux mille euros", "deux mille euro", "deux cents euros"],
      ["ça coûte", "deux mille euros"],
      ["mille"],
    ),
    speaking(
      "fr-m21-3-speak-deuxcents-recall",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      [],
      "recall",
    ),
    build(
      "fr-m21-3-build-sixmille",
      "Build: 'it costs six thousand euros'",
      "ça coûte six mille euros",
      ["ça coûte", "six mille euros", "six mille euro", "six cent euros"],
      ["ça coûte", "six mille euros"],
    ),
    {
      id: "fr-m21-3-map-cinqmille",
      type: "word_map",
      tokens: ["cinq", "mille"],
      pairs: [
        { en: "five", tokenIndex: 0 },
        { en: "thousand", tokenIndex: 1 },
      ],
      audioText: "cinq mille",
      revealNote: "«cinq mille» — five thousand, «mille» stays «mille».",
    },
    listeningCompSentence({
      id: "fr-m21-3-lc-cinqmille",
      audioText: "ça coûte cinq mille euros",
      correctMeaningEn: "It costs five thousand euros",
      distractorsEn: [
        "It costs five hundred euros",
        "It costs fifty thousand euros",
        "It costs five thousand five hundred euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-3", [
      ["mille", "one thousand"],
      ["deux", "two"],
      ["trois", "three"],
      ["cinq", "five"],
      ["cents", "hundreds (plural, review)"],
      ["euros", "euros"],
    ]),
  ];
}

/** L4 — consolidation: cent/cents/mille contrast, last lesson to carry a
 *  NEW graded speaking target (both recalls here reuse L1/L3's own
 *  voicings — from here on, every speaking step in the module is a
 *  recall of an already-established round multiple). */
function lesson4(): LessonStep[] {
  return [
    cloze(
      "fr-m21-4-cloze-troiscents",
      "Ça coûte trois",
      "euros.",
      "cents",
      ["cents", "cent", "mille"],
      "it costs three hundred euros",
      "ça coûte trois cents euros",
    ),
    build(
      "fr-m21-4-build-septcents",
      "Build: 'it costs seven hundred euros'",
      "ça coûte sept cents euros",
      ["ça coûte", "sept cents euros", "sept cent euros", "sept mille euros"],
      ["ça coûte", "sept cents euros"],
    ),
    {
      id: "fr-m21-4-map-centmille",
      type: "word_map",
      tokens: ["cent", "mille"],
      pairs: [
        { en: "hundred", tokenIndex: 0 },
        { en: "thousand", tokenIndex: 1 },
      ],
      audioText: "cent, mille",
      revealNote: "«cent» and «mille» — the two round ceilings of this module.",
    },
    speaking(
      "fr-m21-4-speak-deuxcents-recall",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      [],
      "recall",
    ),
    cloze(
      "fr-m21-4-cloze-mille",
      "Ça coûte",
      "euros.",
      "mille",
      ["mille", "cents"],
      "it costs one thousand euros",
      "ça coûte mille euros",
      "«mille» — the next ceiling past «cent(s)».",
    ),
    build(
      "fr-m21-4-build-cinqcents",
      "Build: 'it costs five hundred euros'",
      "ça coûte cinq cents euros",
      ["ça coûte", "cinq cents euros", "cinq cent euros", "cinq mille euros"],
      ["ça coûte", "cinq cents euros"],
    ),
    speaking(
      "fr-m21-4-speak-parle-recall",
      "il parle français",
      "he speaks French",
      [],
      "recall",
    ),
    cloze(
      "fr-m21-4-cloze-huitcents",
      "Ça coûte huit",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs eight hundred euros",
      "ça coûte huit cents euros",
    ),
    listeningCompSentence({
      id: "fr-m21-4-lc-neufcents",
      audioText: "ça coûte neuf cents euros",
      correctMeaningEn: "It costs nine hundred euros",
      distractorsEn: [
        "It costs nine euros",
        "It costs ninety euros",
        "It costs nine thousand euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-4", [
      ["cent", "one hundred"],
      ["cents", "hundreds (plural)"],
      ["mille", "one thousand"],
      ["euros", "euros"],
      ["deux", "two"],
      ["trois", "three"],
    ]),
  ];
}

/** L5 — REASONING MOMENT: composites debut. The learner deduces the
 *  -s-drop rule from a contrasting pair rather than being told outright.
 *  Written-only throughout (constraint 2) — zero `speaking` steps. */
function lesson5(): LessonStep[] {
  return [
    infoStep(
      "fr-m21-5-info-drop",
      "When the -s disappears",
      "Compare: «deux cents» (200 — nothing follows «cents») and «deux cent un» (201 — a number joins it). The instant another number follows, «cent» drops its -s: cent un, deux cent un, trois cent un... The -s only survives when «cent(s)» is the very last word.",
    ),
    {
      id: "fr-m21-5-map-centun",
      type: "word_map",
      tokens: ["cent", "un"],
      pairs: [
        { en: "hundred", tokenIndex: 0 },
        { en: "one", tokenIndex: 1 },
      ],
      audioText: "cent un",
      revealNote: "«cent un» — no «et» here, unlike «vingt et un».",
    },
    cloze(
      "fr-m21-5-cloze-deuxcentun",
      "Ça coûte deux",
      "un euros.",
      "cent",
      ["cent", "cents"],
      "it costs two hundred one euros",
      "ça coûte deux cent un euros",
      "«deux cent un» — a number follows «cent», so the -s disappears, unlike bare «deux cents».",
    ),
    build(
      "fr-m21-5-build-centcinquante",
      "Build: 'it costs one hundred fifty euros'",
      "ça coûte cent cinquante euros",
      ["ça coûte", "cent cinquante euros", "cent cinquante", "cents cinquante euros"],
      ["ça coûte", "cent cinquante euros"],
    ),
    speaking(
      "fr-m21-5-speak-deuxcents-recall",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      [],
      "recall",
    ),
    cloze(
      "fr-m21-5-cloze-troiscentun",
      "Ça coûte trois",
      "un euros.",
      "cent",
      ["cent", "cents"],
      "it costs three hundred one euros",
      "ça coûte trois cent un euros",
      "another number follows, so «cent» drops the -s again.",
    ),
    build(
      "fr-m21-5-build-quatrecentun",
      "Build: 'it costs four hundred one euros'",
      "ça coûte quatre cent un euros",
      ["ça coûte", "quatre cent un euros", "quatre cents un euros", "quatre cent euros"],
      ["ça coûte", "quatre cent un euros"],
    ),
    listeningCompSentence({
      id: "fr-m21-5-lc-centun",
      audioText: "ça coûte cent un euros",
      correctMeaningEn: "It costs one hundred one euros",
      distractorsEn: [
        "It costs one hundred euros",
        "It costs one hundred ten euros",
        "It costs one euro",
      ],
    }),
    cloze(
      "fr-m21-5-cloze-cinqcentun",
      "Ça coûte cinq",
      "un euros.",
      "cent",
      ["cent", "cents"],
      "it costs five hundred one euros",
      "ça coûte cinq cent un euros",
    ),
    crossModuleMatchPairs("fr-m21-5", [
      ["cent un", "one hundred one"],
      ["cent cinquante", "one hundred fifty"],
      ["cent", "hundred"],
      ["cents", "hundreds (plural)"],
      ["mille", "thousand"],
      ["euros", "euros"],
    ]),
  ];
}

/** L6 — bigger composites; one recall speaking step (round multiple
 *  only, constraint 2 forbids any composite in `speaking`). */
function lesson6(): LessonStep[] {
  return [
    {
      id: "fr-m21-6-map-centcinquante",
      type: "word_map",
      tokens: ["cent", "cinquante"],
      pairs: [
        { en: "hundred", tokenIndex: 0 },
        { en: "fifty", tokenIndex: 1 },
      ],
      audioText: "cent cinquante",
      revealNote: "«cent cinquante» — one hundred fifty, no «et».",
    },
    cloze(
      "fr-m21-6-cloze-deuxcentcinquante",
      "Ça coûte deux",
      "cinquante euros.",
      "cent",
      ["cent", "cents"],
      "it costs two hundred fifty euros",
      "ça coûte deux cent cinquante euros",
      "«cent» stays bare (no -s) because «cinquante» follows it.",
    ),
    build(
      "fr-m21-6-build-quatrecentvingt",
      "Build: 'it costs four hundred twenty euros'",
      "ça coûte quatre cent vingt euros",
      ["ça coûte", "quatre cent vingt euros", "quatre cents vingt euros", "quatre cent euros"],
      ["ça coûte", "quatre cent vingt euros"],
    ),
    cloze(
      "fr-m21-6-cloze-troiscentonze",
      "Ça coûte trois",
      "onze euros.",
      "cent",
      ["cent", "cents"],
      "it costs three hundred eleven euros",
      "ça coûte trois cent onze euros",
    ),
    speaking(
      "fr-m21-6-speak-grandchat-recall",
      "un grand chat",
      "a big cat",
      [],
      "recall",
    ),
    build(
      "fr-m21-6-build-sixcentdix",
      "Build: 'it costs six hundred ten euros'",
      "ça coûte six cent dix euros",
      ["ça coûte", "six cent dix euros", "six cents dix euros", "six cents euros"],
      ["ça coûte", "six cent dix euros"],
    ),
    listeningCompSentence({
      id: "fr-m21-6-lc-cinqcenttrente",
      audioText: "ça coûte cinq cent trente euros",
      correctMeaningEn: "It costs five hundred thirty euros",
      distractorsEn: [
        "It costs five hundred euros",
        "It costs thirty euros",
        "It costs five hundred thirteen euros",
      ],
    }),
    build(
      "fr-m21-6-build-septcentquarante",
      "Build: 'it costs seven hundred forty euros'",
      "ça coûte sept cent quarante euros",
      ["ça coûte", "sept cent quarante euros", "sept cents quarante euros", "sept cent euros"],
      ["ça coûte", "sept cent quarante euros"],
    ),
    listeningCompSentence({
      id: "fr-m21-6-lc-neufcentquarante",
      audioText: "ça coûte neuf cent quarante euros",
      correctMeaningEn: "It costs nine hundred forty euros",
      distractorsEn: [
        "It costs nine hundred euros",
        "It costs nine hundred fourteen euros",
        "It costs ninety-four euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-6", [
      ["cinquante", "fifty"],
      ["vingt", "twenty"],
      ["dix", "ten"],
      ["quarante", "forty"],
      ["cent", "hundred"],
      ["cents", "hundreds (plural, review)"],
    ]),
  ];
}

/** L7 — thematic tie-in: m17's «quatre-vingts» (80, keeps -s alone,
 *  drops it the instant a unit joins) is the SAME rule as «cent»/
 *  «cents». Written-only for composites; «quatre-vingts» itself (a
 *  round multiple) is never put in a NEW `speaking` step here — m17's
 *  70-99 gap stays unspoken (constraint 6). */
function lesson7(): LessonStep[] {
  return [
    infoStep(
      "fr-m21-7-info-samerule",
      "The same -s rule, again",
      "You've already met this shape: «quatre-vingts» (80) keeps its -s only when nothing follows; «quatre-vingt-un» (81) drops it the instant a unit joins. «Cent» works exactly the same way: «deux cents» (200) but «deux cent un» (201). Same rule, different number.",
    ),
    {
      id: "fr-m21-7-map-centmille",
      type: "word_map",
      tokens: ["cent", "mille"],
      pairs: [
        { en: "hundred", tokenIndex: 0 },
        { en: "thousand", tokenIndex: 1 },
      ],
      audioText: "cent, mille",
      revealNote: "the two ceilings this module builds on top of.",
    },
    cloze(
      "fr-m21-7-cloze-quatrevingts",
      "Ça coûte",
      "euros.",
      "quatre-vingts",
      ["quatre-vingts", "soixante"],
      "it costs eighty euros",
      "ça coûte quatre-vingts euros",
      "«quatre-vingts» keeps its -s here — nothing follows it.",
    ),
    build(
      "fr-m21-7-build-quatrevingtdix",
      "Build: 'it costs ninety euros'",
      "ça coûte quatre-vingt-dix euros",
      ["ça coûte", "quatre-vingt-dix euros", "quatre-vingts-dix euros", "quatre-vingts euros"],
      ["ça coûte", "quatre-vingt-dix euros"],
    ),
    cloze(
      "fr-m21-7-cloze-deuxcents-review",
      "Ça coûte deux",
      "euros.",
      "cents",
      ["cents", "cent"],
      "it costs two hundred euros",
      "ça coûte deux cents euros",
      "review — nothing follows «cents» here, so the -s stays.",
    ),
    build(
      "fr-m21-7-build-troiscents-review",
      "Build: 'it costs three hundred euros'",
      "ça coûte trois cents euros",
      ["ça coûte", "trois cents euros", "trois cent euros", "trois mille euros"],
      ["ça coûte", "trois cents euros"],
    ),
    {
      id: "fr-m21-7-map-cinqcents",
      type: "word_map",
      tokens: ["cinq", "cents"],
      pairs: [
        { en: "five", tokenIndex: 0 },
        { en: "hundreds", tokenIndex: 1 },
      ],
      audioText: "cinq cents",
      revealNote: "«cinq cents» — review, same -s pattern.",
    },
    speaking(
      "fr-m21-7-speak-cinema-recall",
      "je vais au cinéma",
      "I'm going to the cinema",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m21-7-lc-mille",
      audioText: "ça coûte mille euros",
      correctMeaningEn: "It costs one thousand euros",
      distractorsEn: [
        "It costs one hundred euros",
        "It costs one hundred thousand euros",
        "It costs ten thousand euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-7", [
      ["quatre-vingts", "eighty"],
      ["cent", "hundred"],
      ["cents", "hundreds (plural)"],
      ["mille", "thousand"],
      ["dix", "ten"],
      ["vingt", "twenty"],
    ]),
  ];
}

/** L8 — CHECKPOINT: zero new atoms, all graded. Transfer test of a
 *  novel composite recombination is a `build` step (never `speaking` —
 *  constraint 2 is unconditional, diverging deliberately from m20's own
 *  checkpoint precedent where a novel recombination WAS spoken). */
function checkpointLesson(): LessonStep[] {
  return [
    build(
      "fr-m21-8-build-transfer",
      "Build: 'it costs five hundred thirty euros'",
      "ça coûte cinq cent trente euros",
      ["ça coûte", "cinq cent trente euros", "cinq cents trente euros", "cinq cents euros"],
      ["ça coûte", "cinq cent trente euros"],
    ),
    cloze(
      "fr-m21-8-cloze-septcents",
      "Ça coûte sept",
      "euros.",
      "cents",
      ["cents", "cent", "mille"],
      "it costs seven hundred euros",
      "ça coûte sept cents euros",
    ),
    build(
      "fr-m21-8-build-septcentcinquante",
      "Build: 'it costs seven hundred fifty euros'",
      "ça coûte sept cent cinquante euros",
      ["ça coûte", "sept cent cinquante euros", "sept cents cinquante euros", "sept cent euros"],
      ["ça coûte", "sept cent cinquante euros"],
    ),
    speaking(
      "fr-m21-8-speak-deuxcents-recall",
      "ça coûte deux cents euros",
      "it costs two hundred euros",
      [],
      "recall",
    ),
    cloze(
      "fr-m21-8-cloze-sixcentun",
      "Ça coûte six",
      "un euros.",
      "cent",
      ["cent", "cents"],
      "it costs six hundred one euros",
      "ça coûte six cent un euros",
    ),
    listeningCompSentence({
      id: "fr-m21-8-lc-neufcentcinquante",
      audioText: "ça coûte neuf cent cinquante euros",
      correctMeaningEn: "It costs nine hundred fifty euros",
      distractorsEn: [
        "It costs nine hundred euros",
        "It costs ninety-five euros",
        "It costs nine hundred fifteen euros",
      ],
    }),
    cloze(
      "fr-m21-8-cloze-quatrecentonze",
      "Ça coûte quatre",
      "onze euros.",
      "cent",
      ["cent", "cents"],
      "it costs four hundred eleven euros",
      "ça coûte quatre cent onze euros",
    ),
    build(
      "fr-m21-8-build-millecinqcents",
      "Build: 'it costs two thousand five hundred euros'",
      "ça coûte deux mille cinq cents euros",
      [
        "ça coûte",
        "deux mille cinq cents euros",
        "deux mille cinq cent euros",
        "deux mille euros",
      ],
      ["ça coûte", "deux mille cinq cents euros"],
      ["mille", "cents"],
    ),
    speaking(
      "fr-m21-8-speak-bonjour-recall",
      "bonjour",
      "hello",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m21-8-lc-troiscentvingt",
      audioText: "ça coûte trois cent vingt euros",
      correctMeaningEn: "It costs three hundred twenty euros",
      distractorsEn: [
        "It costs three hundred euros",
        "It costs thirty euros",
        "It costs three hundred twelve euros",
      ],
    }),
    cloze(
      "fr-m21-8-cloze-troismille",
      "Ça coûte trois",
      "euros.",
      "mille",
      ["mille", "cents", "cent"],
      "it costs three thousand euros",
      "ça coûte trois mille euros",
    ),
    crossModuleMatchPairs("fr-m21-8", [
      ["cent", "hundred"],
      ["cents", "hundreds (plural)"],
      ["mille", "thousand"],
      ["cinquante", "fifty"],
      ["trente", "thirty"],
      ["un", "one"],
    ]),
  ];
}

/** L9 — integration: Nadia's market stall (m12) scaled up to
 *  hundreds/thousands. Written-only for composites throughout — the
 *  dialogue_sim's own composite content is choice-graded, never
 *  speech-graded, so it's safe (same precedent as m12's own Théo scene
 *  using "quarante-cinq euros"). One recall speaking step. */
function lesson9(): LessonStep[] {
  return [
    {
      id: "fr-m21-9-map-quatrecent",
      type: "word_map",
      tokens: ["quatre", "cent", "quinze"],
      pairs: [
        { en: "four", tokenIndex: 0 },
        { en: "hundred", tokenIndex: 1 },
        { en: "fifteen", tokenIndex: 2 },
      ],
      audioText: "quatre cent quinze",
      revealNote: "«quatre cent quinze» — «quinze» follows, so «cent» stays bare, no -s.",
    },
    build(
      "fr-m21-9-build-cinqcents",
      "Build: 'it costs five hundred euros'",
      "ça coûte cinq cents euros",
      ["ça coûte", "cinq cents euros", "cinq cent euros", "cinq mille euros"],
      ["ça coûte", "cinq cents euros"],
    ),
    cloze(
      "fr-m21-9-cloze-troiscentcinquante",
      "Ça coûte trois",
      "cinquante euros.",
      "cent",
      ["cent", "cents"],
      "it costs three hundred fifty euros",
      "ça coûte trois cent cinquante euros",
    ),
    build(
      "fr-m21-9-build-sixcentvingt",
      "Build: 'it costs six hundred twenty euros'",
      "ça coûte six cent vingt euros",
      ["ça coûte", "six cent vingt euros", "six cents vingt euros", "six cent euros"],
      ["ça coûte", "six cent vingt euros"],
    ),
    speaking(
      "fr-m21-9-speak-lundi-recall",
      "c'est lundi",
      "it's Monday",
      [],
      "recall",
    ),
    cloze(
      "fr-m21-9-cloze-septcentonze",
      "Ça coûte sept",
      "onze euros.",
      "cent",
      ["cent", "cents"],
      "it costs seven hundred eleven euros",
      "ça coûte sept cent onze euros",
    ),
    build(
      "fr-m21-9-build-quatrecentquinze",
      "Build: 'it costs four hundred fifteen euros'",
      "ça coûte quatre cent quinze euros",
      ["ça coûte", "quatre cent quinze euros", "quatre cents quinze euros", "quatre cents euros"],
      ["ça coûte", "quatre cent quinze euros"],
    ),
    listeningCompSentence({
      id: "fr-m21-9-lc-septcents",
      audioText: "ça coûte sept cents euros",
      correctMeaningEn: "It costs seven hundred euros",
      distractorsEn: [
        "It costs seventeen euros",
        "It costs seventy euros",
        "It costs seven thousand euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-9", [
      ["c'est combien", "how much is it"],
      ["ça coûte", "it costs"],
      ["cent", "hundred"],
      ["cents", "hundreds (plural)"],
      ["cher", "expensive"],
      ["d'accord", "okay / deal"],
    ]),
    {
      id: "fr-m21-9-sim-marche",
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
            kana: "Ça coûte trois cents euros.",
            audioText: "ça coûte trois cents euros",
            gloss: "It costs three hundred euros.",
          },
          goal: "Say okay, three hundred euros.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, trois cents euros" },
              { id: "wrong-price", text: "d'accord, deux cents euros" },
              { id: "wrong-form", text: "d'accord, trois milles euros" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, trois cents euros",
          },
          replyGloss: "Okay, three hundred euros.",
        },
        {
          id: "t3-expensive",
          npc: {
            speaker: "Nadia",
            kana: "Et ça, cinq cent vingt euros ?",
            audioText: "et ça, cinq cent vingt euros ?",
            gloss: "And that, five hundred twenty euros?",
          },
          goal: "Say okay, that's expensive.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "d'accord, c'est cher" },
              { id: "wrong-cheap", text: "d'accord, ce n'est pas cher" },
              { id: "wrong-form", text: "d'accord, c'est cent" },
            ],
            correctOptionId: "correct",
            audioText: "d'accord, c'est cher",
          },
          replyGloss: "Okay, that's expensive.",
        },
      ],
    },
  ];
}

/** L10 — MASTERY: recap variety, ends on its own dialogue_sim (Théo's
 *  boutique, m12, scaled up). All graded, zero new atoms, zero info. */
function lesson10(): LessonStep[] {
  return [
    sentenceMcq({
      id: "fr-m21-10-smcq-recap",
      prompt: "'It costs two hundred euros' — pick the French.",
      correctText: "ça coûte deux cents euros",
      distractorsText: [
        "ça coûte deux cent euros",
        "ça coûte deux cent un euros",
        "ça coûte deux cents euro",
      ],
    }),
    cloze(
      "fr-m21-10-cloze-neufcentquinze",
      "Ça coûte neuf",
      "quinze euros.",
      "cent",
      ["cent", "cents"],
      "it costs nine hundred fifteen euros",
      "ça coûte neuf cent quinze euros",
    ),
    build(
      "fr-m21-10-build-septcentquatrevingts",
      "Build: 'it costs seven hundred eighty euros'",
      "ça coûte sept cent quatre-vingts euros",
      [
        "ça coûte",
        "sept cent quatre-vingts euros",
        "sept cents quatre-vingts euros",
        "sept cent quatre-vingt euros",
      ],
      ["ça coûte", "sept cent quatre-vingts euros"],
    ),
    speaking(
      "fr-m21-10-speak-cestcombien-recall",
      "c'est combien ?",
      "how much is it?",
      [],
      "recall",
    ),
    listeningCompSentence({
      id: "fr-m21-10-lc-cinqcentsoixante",
      audioText: "ça coûte cinq cent soixante euros",
      correctMeaningEn: "It costs five hundred sixty euros",
      distractorsEn: [
        "It costs five hundred euros",
        "It costs sixty euros",
        "It costs five hundred six euros",
      ],
    }),
    crossModuleMatchPairs("fr-m21-10", [
      ["cent", "hundred"],
      ["cents", "hundreds (plural)"],
      ["mille", "thousand"],
      ["euros", "euros"],
      ["vingt", "twenty"],
      ["quatre-vingts", "eighty"],
    ]),
    {
      id: "fr-m21-10-sim-boutique",
      type: "dialogue_sim",
      scene: { emoji: "👗", title: "The boutique" },
      exercisedAtomIds: [],
      turns: [
        {
          id: "t1-gateau",
          npc: {
            speaker: "Théo",
            kana: "Bonjour ! Vous désirez ?",
            audioText: "bonjour ! vous désirez ?",
            gloss: "Hello! What would you like?",
          },
          goal: "Say you would like a cake.",
          reply: {
            mode: "choice",
            options: [
              { id: "correct", text: "je voudrais un gâteau" },
              { id: "wrong-item", text: "je voudrais un sandwich" },
              { id: "wrong-form", text: "je voudrais cher" },
            ],
            correctOptionId: "correct",
            audioText: "je voudrais un gâteau",
          },
          replyGloss: "I would like a cake.",
        },
        {
          id: "t2-price",
          npc: {
            speaker: "Théo",
            kana: "Ça coûte deux cents euros.",
            audioText: "ça coûte deux cents euros",
            gloss: "It costs two hundred euros.",
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
            kana: "D'accord — et ce gâteau, cent euros ?",
            audioText: "d'accord — et ce gâteau, cent euros ?",
            gloss: "Okay — and this cake, one hundred euros?",
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
  ];
}

const FR_M21_1: LessonContent = {
  id: "fr-m21-1",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Two hundred, three hundred",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson1(),
};

const FR_M21_2: LessonContent = {
  id: "fr-m21-2",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Six hundred, nine hundred",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson2(),
};

const FR_M21_3: LessonContent = {
  id: "fr-m21-3",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "One thousand",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson3(),
};

const FR_M21_4: LessonContent = {
  id: "fr-m21-4",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Hundreds and thousands recap",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson4(),
};

const FR_M21_5: LessonContent = {
  id: "fr-m21-5",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Where does the -s go?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson5(),
};

const FR_M21_6: LessonContent = {
  id: "fr-m21-6",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "Two hundred fifty",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson6(),
};

const FR_M21_7: LessonContent = {
  id: "fr-m21-7",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The same rule, again",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson7(),
};

const FR_M21_8: LessonContent = {
  id: "fr-m21-8",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "✓ Checkpoint · De cent à mille",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: checkpointLesson(),
};

const FR_M21_9: LessonContent = {
  id: "fr-m21-9",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "How much for all of it?",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson9(),
};

const FR_M21_10: LessonContent = {
  id: "fr-m21-10",
  moduleId: "m21",
  courseId: COURSE_ID,
  languageId: "fr",
  title: "The boutique, again",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: lesson10(),
};

export const FR_M21_MODULE: FrModuleDef = {
  title: "De cent à mille",
  eyebrow: "Module 21",
  summary:
    "«Cent» already means one hundred — now multiply it (deux cents, trois cents...), meet its bigger cousin «mille» (one thousand, never pluralized), and learn exactly when «cent» drops its -s. Prices from a hundred to a few thousand euros, the same market and boutique you already know.",
  lessons: [
    FR_M21_1,
    FR_M21_2,
    FR_M21_3,
    FR_M21_4,
    FR_M21_5,
    FR_M21_6,
    FR_M21_7,
    FR_M21_8,
    FR_M21_9,
    FR_M21_10,
  ],
};

/** 1-based position of the zero-new checkpoint lesson. */
export const FR_M21_CHECKPOINT_INDEX = 8;

export const FR_M21_PLACEMENT: PlacementItem[] = [
  // FIRST item = the module's Stage-1 screener item (placementBank contract).
  {
    id: "pt-fr-m21-s",
    moduleId: "m21",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m21-s",
        prompt: "'It costs two hundred euros' — pick the French.",
        correctText: "ça coûte deux cents euros",
        distractorsText: [
          "ça coûte deux cent euros",
          "ça coûte deux cent un euros",
          "ça coûte deux mille euros",
        ],
      }),
  },
  {
    id: "pt-fr-m21-1",
    moduleId: "m21",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m21-1",
        prompt: "'It costs one thousand euros' — pick the French.",
        correctText: "ça coûte mille euros",
        distractorsText: [
          "ça coûte mille euro",
          "ça coûte cent euros",
          "ça coûte cents euros",
        ],
      }),
  },
  {
    id: "pt-fr-m21-2",
    moduleId: "m21",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m21-2",
        prompt: "'It costs two hundred one euros' — pick the French.",
        correctText: "ça coûte deux cent un euros",
        distractorsText: [
          "ça coûte deux cents un euros",
          "ça coûte deux cent euros",
          "ça coûte deux cents euros",
        ],
      }),
  },
  {
    id: "pt-fr-m21-3",
    moduleId: "m21",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m21-3",
        prompt: "'It costs nine hundred euros' — pick the French.",
        correctText: "ça coûte neuf cents euros",
        distractorsText: [
          "ça coûte neuf cent euros",
          "ça coûte neuf mille euros",
          "ça coûte neuf cents euro",
        ],
      }),
  },
  {
    id: "pt-fr-m21-4",
    moduleId: "m21",
    build: () =>
      sentenceMcq({
        id: "pt-fr-m21-4",
        prompt: "'It costs two thousand five hundred euros' — pick the French.",
        correctText: "ça coûte deux mille cinq cents euros",
        distractorsText: [
          "ça coûte deux mille euros",
          "ça coûte deux mille cinq cent euros",
          "ça coûte deux cinq cents euros",
        ],
      }),
  },
];
