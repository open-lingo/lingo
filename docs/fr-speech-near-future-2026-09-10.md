# FR speech grading — aller + infinitif near-future (2026-09-10)

Verification for `docs/fr-m19-brief-2026-09-10.md`'s §6 unverified claim.
Test: `src/features/languages/fr/__tests__/frSpeechNearFuture.test.ts` (real
`scoreAlternativesGeneric`; `loose-match.ts` **unchanged** — 310/310 speech
tests green, incl. all elision + negation cases).

## Does the matcher grade the near-future frame correctly?

**Colloquial reduction and the -er/-é/-ez homophone group generalize
cleanly** (same class of leniency already verified for elision/negation):
contracted "j'vais parler" (0.917), s-dropped "tu va manger" (0.909), and
respelled-by-sound "on va visité Paris" / "tu vas mangez" / "je vais
parlez" (0.875–0.917, all perfect or close). No fix needed.

**Infinitive-vs-participle homophony does NOT get rejected, as required.**
"parler"/"parlé" are the same sound — "je vais parlé" for target "je vais
parler" scores 0.833 (close); the bare-word pair alone scores 0.667 (close,
the lowest passing score measured, still over the 0.55 floor).

**Four measured false-positive risks, none fixed** (each needs raising
`PARTIAL_COVERAGE_FLOOR` or edit-distance/phonetic scoring — matcher-wide,
not a targeted fold):
- **vais/vois** ("I'm going"/"I see"): bare words 0.833 (close); embedded
  in a sentence 0.917 (perfect) — embedding makes it worse, not better.
- **va/y a** ("he's going"/"there is"): bare 0.75 (close); embedded 0.929
  (perfect).
- **va/a** (aller/avoir minimal pair, "il va"/"il a", "on va"/"on a"): bare
  0.75 (close); "on a manger" for "on va manger" scores 0.9 (perfect).
- **elle va/il va** (gender swap) is sentence-shape-dependent: the bare
  2-word phrase correctly fails (0.5, try-again) but the SAME swap embedded
  in a sentence ("il va parler" for "elle va parler") scores 0.75 (close, a
  pass) — mirrors the jamais/rien inconsistency `frSpeechNegation.test.ts`
  found.

**One compounded-degradation risk, documented not patched:** stacking three
simultaneous colloquial reductions at once ("j'vé parlé" for "je vais
parler" — contraction + vais-respelling + participle-respelling together)
drops to 0.5 (try-again), even though each reduction passes alone. Inherent
to bag-of-characters scoring losing ground per edit, not a French-specific
bug.

## Constraints for the m19 dispatch (paste verbatim)

1. Colloquial reductions and -er/-é/-ez homophone spellings of the near-future frame grade safely — author freely.
2. "parler" vs "parlé" (and any infinitive/participle pair) must never be treated as a grading error if it shows up in a transcript — this is expected, correct behavior, not a defect to chase.
3. Don't rely on an isolated bare-word `speaking` target to discriminate `je vais`/`je vois`, `il va`/`il y a`, `il va`/`il a`, or `elle va`/`il va` — all score as passes (false positives); use build/cloze/MCQ for any lesson step that needs to TEST these distinctions (e.g. L1's motion-vs-future contrast, L4–L6's cast-gender drills).
4. Do not author a `speaking` target that stacks multiple simultaneous casual reductions on the same sentence (contraction + phonetic respelling + homophone respelling together) — a single such target can drop below the passing floor even though each reduction alone is safe.
5. Recommend, per the brief's own §6 default: L1 and any lesson debuting a new subject+infinitive pairing ships written-only (build/cloze/word_map) until promoted; this trace clears that gate for standard hearings — Spencer's ear/device check is still the final word on real ASR behavior.
