# FR speech grading — hundreds/thousands, cent→mille (2026-09-10)

Verification for `docs/fr-m21-brief-2026-09-10.md`'s §6/§9 probe table.
Test: `frSpeechHundreds.test.ts` (real `scoreAlternativesGeneric`).
`src/shared/speech` = 106/106 green; FR speech suites = 373/373 green
(338 baseline + 35 new).

## Matcher change (small, generic — es benefits too)
`loose-match.ts`: added `ROMANCE_ROUND_HUNDREDS_WORDS` (exact round values
100/200/.../900, 1000/.../9000 → fr/es word forms) + `foldRoundHundreds()`,
run before the existing 1-2 digit chunker. Same no-op-when-absent contract
as the 0-20 table; lookbehind/lookahead regex matches only an exact round
run, never a substring of a longer/different one. **Composite numbers
(101, 250, ...) NOT covered** — real number-to-words composition with
per-language agreement (fr cent/cents vs irregular es
quinientos/setecientos/novecientos) is language-specific, out of scope for
a table. `loose-match.test.ts`'s Romance-ITN block unchanged; no es speech
suites exist yet to regress.

## Findings
1. **Round bare multiples now speech-safe**: cent/deux cents/.../neuf
   cents/mille/deux mille all pass a digit-ITN transcript ("100"-"2000")
   after the fix (verified perfect/1.0), including in the m12 price frame.
   Target-aware confirmed: wrong number fails; no-number target no-ops.
2. **Composite numbers stay written-only — worse than "unrecognized."**
   cent un/deux cent un/deux cent cinquante vs their digits still fail
   outright. Worse: "j'ai cent un euros" vs a WRONG digit hearing ("j'ai
   205/999 euros") ALSO scores close/pass (0.571 both) — padding, not the
   number, drives the score. Never promote composite sentences to
   `speaking`, regardless of future matcher work.
3. **cent/cents bare homophone**: identical sound ([sɑ̃]), passes both
   directions — correctly un-fixable, not a bug.
4. **Liaison leniency confirmed**: "deux cents euros" vs no-liaison "deux
   cent euros" not penalized (0.929) — same doctrine as de-elision.
5. **cent vs sans/sang**: bare word correctly rejected (0.25); embedded in
   a sentence ("j'ai cent euros" vs "j'ai sans euros") false-positives
   (0.75) — same bag-of-characters class as vient/bien, not fixed.
6. **m17 retro-check**: 70-99 digit-ITN (80/70/90) still fails (0, out of
   range). m17.ts ships zero `speaking` steps (grepped) — real latent gap,
   not a live production risk today.

## Constraints for the m21 dispatch (paste verbatim)
1. L1-L4 (bare round multiples) MAY use `speaking` — fold verified safe,
   incl. inside the m12 price frame.
2. L5-L7 (composites) MUST stay written-only. No `alsoAccepted` digit
   forms either — a wrong digit passes as easily as a right one.
3. Never gate a `speaking` pass/fail on cent-vs-cents or cent/sans/sang.
4. Liaison is free — don't penalize either production of "deux cents euros."
5. m17 has a latent (not live) 70-99 gap; flag for whoever next speaks those.
