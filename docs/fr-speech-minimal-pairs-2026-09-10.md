# FR speech minimal-pairs census (m2–m20, 2026-09-10)

Course-wide follow-on to the negation/hundreds/near-future/recent-past/elision
probes: walks every graded `speaking` target in the live FR modules (m2–m20;
m21 excluded, in flight) via `frSpeechMinimalPairs.test.ts`, finds every
MINIMAL PAIR with a sibling speaking target (same module) or a wrong-answer
surface (MCQ/word-image-MCQ distractor, cloze option, build distractor tile —
same lesson), and scores each with the real matcher
(`scoreAlternativesGeneric`). Rule: token-diff ≤ 1 after `frTokens`
normalization, classified for reporting only. Gate: `npx vitest run
src/features/languages/fr/__tests__/frSpeechMinimalPairs.test.ts` — 2/2 pass.

## Census — 62 flagged direction-pairs (60 unique step-id pairs)

| class | count | example |
|---|---|---|
| short-token | 27 | "vingt" vs "vingt-cinq"; "le chat" vs "le café" |
| person | 16 | "je parle français" vs "il parle français" |
| numeral | 11 | "onze" vs "douze"; "treize" vs "seize" |
| negation | 7 | "c'est cher" vs "c'est pas cher"; "sais jamais" vs "sais rien" |
| gender-number | 1 | "un livre" vs "le livre" |
| preposition / tense | 0 | none found this pass |

All 60 are pre-existing and now allowlisted in `KNOWN_LEGACY` (shrink-only —
each entry must reproduce or the gate flags it stale). m19/m20 have ZERO
hits: the earlier negated-pair→build conversion (5bb5dd14) already closed
that module pair.

## Worst offenders (score → verdict; higher is worse)

1. **m12 "vingt"** (1.000, perfect) — the bare numeral target scores PERFECT
   against "vingt-deux", "vingt-cinq", "vingt-sept", "vingt-neuf" alike
   (`fr-m12-1-speak-vingt`, `fr-m12-2-speak-vingt-recall`,
   `fr-m12-10-speak-vingt-recall`). Any -vingt teen/twenty read back as
   "vingt" passes; the reverse also passes. Highest-risk single finding.
2. **m2 "je m'appelle" vs "m'appelle"** (1.000) — a build distractor tile
   alone scores perfect against the full speaking target.
3. **m13 "je ne sais pas" vs "je ne sais"** (1.000) — whole negation
   (`pas`) dropped, still perfect; matches the `pas`-frame finding
   `frSpeechNegatedFrames.test.ts` already made for m19/m20.
4. **m11 person swaps** (0.867/0.864) — "je/il/elle parle(nt) français"
   and "il/elle aime parler français" cross-score close-to-perfect; this
   is the conjugation checkpoint module, where person contrast is the
   whole point.
5. **m18 negator/person swaps** (0.833–0.882) — same class
   `frSpeechNegation.test.ts` traced for jamais/rien in isolation; the
   census walk independently rediscovers it.

## Follow-on: candidates for build/cloze/MCQ conversion (by module)

- **m2**: fr-m2v2-2-speak-jemappelle
- **m3**: fr-m3-1-speak-lechat, fr-m3-2-speak-unlivre, fr-m3-4-speak-lechat-recall
- **m6**: fr-m6-1-speak-svp-recall, fr-m6-4-speak-stp, fr-m6-6/10-speak-stp-recall, fr-m6-1-speak-fullorder, fr-m6-4-speak-fullorder-recall, fr-m6-6-speak-the
- **m7**: fr-m7-2-speak-monchat, fr-m7-7-speak-monchien-recall
- **m11**: fr-m11-2-speak-jeparle/ilparle, fr-m11-5/7-speak-*parle-recall, fr-m11-4-speak-ilaimeparler, fr-m11-6-speak-penpal, fr-m11-6-speak-tuhabites-recall
- **m12**: fr-m12-1-speak-vingt, fr-m12-2/10-speak-vingt-recall, fr-m12-8-speak-cher-recall (highest priority: the "vingt" row)
- **m13**: fr-m13-1-speak-jenesaispas
- **m15**: fr-m15-2-speak-jaivisite, fr-m15-8-speak-jaidejavisite
- **m17**: fr-m17-1-speak-onze/douze, fr-m17-7-speak-douze-recall, fr-m17-2-speak-treize, fr-m17-3-speak-seize, fr-m17-10-speak-seize-recall (the numeral row)
- **m18**: fr-m18-2-speak-saisjamais, fr-m18-4-speak-saisrien, fr-m18-8-speak-tusaisrien, fr-m18-9-speak-saisjamais-recall, fr-m18-5-speak-comprendsrien/tucomprendsrien, fr-m18-7-speak-rien-recall

Not patched in `loose-match.ts` — same precedent as every prior speech
probe (`frSpeechNegatedFrames.test.ts` §DECISION): a fix here is content
(retype the step), not the shared matcher.

## Constraint for future FR dispatches

**A `speaking` step must never be the sole graded checkpoint for a minimal
contrast** (gender, number, person/tense, negation, a swapped preposition,
a swapped numeral, or any ≤1-short-token diff) that the same lesson or
module also teaches as a sibling target or a distractor — author it as
`build_sentence`, `particle_cloze`, or `multiple_choice` instead, or pin
the speaking target far enough from its contrast that no sibling/distractor
scores ≥ 0.55 against it. `frSpeechMinimalPairs.test.ts` is the standing
gate for this; a new module cannot add a fresh violation.
