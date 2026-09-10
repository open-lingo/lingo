# FR speech grading — negated `pas` frames (2026-09-10)

Verification for the m20 reviewer's (3004d96f) gate gap. Test:
`src/features/languages/fr/__tests__/frSpeechNegatedFrames.test.ts` (real
`scoreAlternativesGeneric`; `loose-match.ts` **unchanged** — 411/411 speech
tests green, baseline 373 + 38 new; `tsc --noEmit` clean).

## Census (full detail + lesson ids: test file header)

14 `pas`-frame targets across m13–m16, plus the two task-named cases:
**fr-m19-8-speak-jenevaispasmanger** "je ne vais pas manger de gâteau"
(near-future) and **fr-m20-8-speak-ilnevientpas** "il ne vient pas de
manger de gâteau" (recent-past). The `jamais`/`rien`/`plus`-frame (m18, 15
targets) is already traced by `frSpeechNegation.test.ts`, not duplicated.
m17 has no negated speaking targets.

## Findings

**(a) Ne-drop** generalizes cleanly to `pas`: "il parle pas" (0.833), "je
vais pas manger de gâteau" (0.92), "il vient pas de manger de gâteau"
(0.929) all pass. No fix needed.

**(b)/(c) New, worse than any prior finding**: dropping the negation
ENTIRELY (plain truth-flipped affirmative, no filler) scores "close"
(PASS) both directions, every pair tested. Negated target vs un-negated
hearing: m20's target vs "il vient de manger de gâteau" scores 0.821;
m19's vs "je vais manger de gâteau" scores 0.8; "il ne parle pas" vs "il
parle" scores 0.583 (thinnest margin measured). Un-negated target vs
negated hearing: the REAL sibling target "il va manger une pizza"
(fr-m19-8-speak-ilvamanger, same lesson as the m19 negated target) vs "il
ne va pas manger une pizza" scores 0.783; "elle vient de manger une pizza"
(fr-m20-6-speak-vientdemanger) vs its negated form scores 0.833. **"pas"
alone is not enough signal**; padding makes it worse, not better (0.821 →
0.902 on an 11-word version of the same sentence).

**(d) Article collapse** under negation (de/un) not penalized either way
(0.867–0.929, perfect) — expected leniency, not a defect.

**(e) Negator swaps** in the m19/m20 frame are new coverage (no `pas`
targets in `frSpeechNegation.test.ts`'s table to swap from) and worse than
that file's jamais/rien swap (0.643, close): pas→jamais/plus in a full
sentence scores PERFECT (0.857–0.931). Bare negator swaps correctly fail.

## Decision: NOT PATCHED

Every existing `loose-match.ts` fix only ADDS an equivalence (fail→pass,
provably safe, never the reverse). A negation guard must SUBTRACT score,
risking a legitimate pass flipping to fail. Doing it safely needs
per-language negator word lists plus real word-boundary tokenization on
PRE-normalized text (`normalizeGeneric` strips ALL whitespace, so a
substring check reintroduces the "mais-inside-jamais" trap — "pas" is
inside "repas"), plus full es/ko/fr regression proof — matcher-wide, not a
small targeted change, the same line the three sibling files already drew.

## Constraints (paste verbatim into future FR dispatches)

1. A negated `speaking` target and its same-verb/subject un-negated
   counterpart are not safely discriminable either direction — never test
   the negated-vs-affirmative contrast via `speaking`; use build/cloze/
   sentence-MCQ instead.
2. Structural, not `pas`-specific — jamais/rien/plus behave the same once
   embedded in a sentence.
3. Padding makes it worse, not safer. Negator-swap embeddings score
   PERFECT — never drill which negator a sentence uses via `speaking`.

## Follow-ons for the coordinator

- `fr-m19-8-speak-jenevaispasmanger` + same-lesson sibling
  `fr-m19-8-speak-ilvamanger` violate constraint 1 today — flag for m19's
  next reviewer.
- `fr-m20-8-speak-ilnevientpas` + `fr-m20-6-speak-vientdemanger` share the
  cross-passing frame — flag for m20's next reviewer.
- No other m13–m16 lesson pairs a `pas` target against an un-negated
  target within the same lesson (checked same-lesson co-occurrence only;
  cross-module recall reuse was out of scope).
