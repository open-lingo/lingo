# FR speech grading of elided/contracted forms — 2026-09-10

Verifies the ledger item from the m14 review (commit a758edd4): "speech-grader
elision folding remains UNVERIFIED." Scope: the SPEECH grader only
(`scoreAlternativesGeneric` / `normalizeGeneric` in
`src/shared/speech/loose-match.ts`, invoked by `SpeakingStepView.tsx` for
every non-JA `speaking` step, all three recognizer backends — Web Speech API,
Whisper, native `SFSpeechRecognizer`). The «n'a»-as-atom decision in m14 is a
separate, already-settled AUTHORING question (`courseAtoms.ts` /
`frTokens` 1-char-token drop) and is out of scope here.

## What was checked

Every `speaking` target across `fr/curriculum/m11.ts`–`m15.ts` containing an
apostrophe (25 unique targets, enumerated by grep — read-only, listed in the
new test file's `APOSTROPHE_TARGETS`), run through the REAL grader
(`scoreAlternativesGeneric`) against five realistic ASR transcript variants:

| Variant | Example | Result before fix | Result after fix |
|---|---|---|---|
| Straight apostrophe (authored) | `j'ai mangé un croissant hier` | perfect (1.0) | perfect (1.0) |
| Curly/typographic apostrophe (`’` U+2019 — how Whisper's own text normalizer renders French elision) | `j’ai mangé un croissant hier` | perfect, but NOT exact (0.94–0.96 on m11–m15 targets) | perfect, exact (1.0) |
| Space-split (`je n ai pas`) | `tu n as pas mangé hier soir` | perfect (1.0) | perfect (1.0) |
| Glued, no mark (`jai`, `cest`) | `jai mangé un croissant hier` | perfect (1.0) | perfect (1.0) |
| De-elided (`je ne ai pas`, `je ai`) | `je ne ai pas de livre` | perfect/close (0.94–0.96) | perfect/close (unchanged) |

**132/132 tests pass** in the new file
`src/features/languages/fr/__tests__/frSpeechElision.test.ts` (baseline +
curly + space-split + glued + de-elided × 25 targets, plus 6 explicit
brief-named checks: «je n'ai pas mangé», «tu n'as pas», «j'ai visité la
ville», «l'hôtel», «c'est»).

## Defect found and fixed

`normalizeGeneric` (the non-JA speech normalizer) stripped a straight `'`
as punctuation but did NOT fold curly/typographic apostrophe variants
(`’ ‘ ʼ ＇` etc. — `APOSTROPHE_VARIANTS_RE`) to the same key first, unlike
`normalizeTypedAnswer` (the typed-answer path), which already does this fold
specifically because "iOS and macOS turn a typed `'` into U+2019 by default."
A curly apostrophe from an ASR transcript survived `normalizeGeneric` as a
literal, uncompared character.

**On the actual m11–m15 targets this never flipped a verdict** — every target
is long enough (8+ normalized chars) that char-overlap leniency absorbed the
one stray character and the score stayed ≥0.85 ("perfect"). That's exactly
why the ledger called this UNVERIFIED rather than known-broken: nothing in
CI or a QA walk would have caught it.

**It is a real, provable defect for short targets.** `grade("c'est",
"c’est")` scored **0.889 → "close"**, not "perfect", before the fix (proved
in the deliverable test by literally reverting the fix via `git stash` and
re-running — 28 assertions failed, including this one; restored and
re-verified green). Any future single-word or two-word elided `speaking`
target («c'est», «j'ai» in isolation, etc.) would have silently underscored
a technically-correct spoken answer.

**Fix** (`src/shared/speech/loose-match.ts`, `normalizeGeneric`): fold
`APOSTROPHE_VARIANTS_RE` → `'` before the existing punctuation strip, mirroring
`normalizeTypedAnswer` exactly. The fold only adds an equivalence (curly ⟺
straight ⟺ stripped) — it can never turn an existing pass into a fail, so no
regression risk for content that already graded correctly.

## De-elision — judgment call, NOT patched

A learner (or an ASR mis-hearing) rendering «j'ai» as "je ai", or «je n'ai
pas» as "je ne ai pas", already grades **perfect or close, never try-again**,
via the existing char-overlap tiering — no code change was needed or made.

**Position:** this is correct as-is. `loose-match.ts`'s own header states the
design intent explicitly — "the bar deliberately leans lenient... false
positives during a pronunciation drill are far better than false negatives"
— and `course-design-learnings-2026-08-21` law 3 requires normalizers to be
target-aware, not that every phonetic variant be rejected. A learner who
says the right words without physically eliding them made a pronunciation
error, not a content error; punishing that on a `speaking` step (production,
not dictation) would contradict the module's own stated grading philosophy.
Distinguishing "said the wrong words" from "said the right words without the
liaison" is not something char-overlap can do today, and building that
distinction was out of scope (not asked for, and risks new false negatives
without a measured false-positive problem to justify it).

## Native recognizer path — read-only check

`src/shared/speech/useNativeSpeechRecognition.ts` (the `SFSpeechRecognizer`
bridge for iOS) has **no separate normalizer**. It returns raw
`partialResults` matches unmodified; `SpeakingStepView.tsx` feeds them
through the SAME `scoreAlternativesGeneric` path as Web Speech API and
Whisper transcripts (see `converted` at line ~665–670). The fix above
therefore covers all three recognizer backends uniformly — nothing native-
specific to change, confirmed by reading, not editing (file belongs to the
mobile session per task scope).

## Sibling parity

- **ES** — `del`, `al` and other contractions are single unapostrophized
  words; Spanish doesn't author elision apostrophes in speaking targets. N/A
  for this fix's motivating case, but the fold is harmless/no-op for any ES
  content that does contain a straight or curly `'` (name, loanword). Sibling
  suite run: `npx vitest run --project curriculum src/features/languages/es`
  — 2339 passed / 1 failed (the 1 failure is `esAudioCoverage` ratchet, an
  in-flight ES m26 lane failure per this task's exclusion list, unrelated to
  this change).
- **KO** — Hangul has no apostrophes; the fold is a pure no-op (asserted
  directly in `frSpeechElision.test.ts`'s
  `normalizeGeneric — apostrophe-variant fold is a targeted addition` >
  "is a no-op for text with no apostrophe"). Sibling KO tests included in the
  same `curriculum` run above (2339 total), all green.
- **JA** — uses the separate kana-aware `scoreAlternatives` /
  `normalizeForCompare` path, never `normalizeGeneric`. N/A, untouched.

## Files touched

- `src/shared/speech/loose-match.ts` — `normalizeGeneric`: added the
  apostrophe-variant fold (2 new lines + doc comment).
- `src/features/languages/fr/__tests__/frSpeechElision.test.ts` — new,
  132 tests, all passing.
- This doc.

## Gates run

- New test: `npx vitest run --project curriculum
  src/features/languages/fr/__tests__/frSpeechElision.test.ts` → **132/132
  passed** (and independently verified to produce 28 real failures when the
  fix is reverted — TDD-red proof, not a scratch script).
- `npx vitest run --project app src/shared/speech src/features/lesson` →
  **1273 passed, 17 skipped, 7 failed** — all 7 failures name `m40`/`m41`
  (JA in-flight lane: `audioCoverage`, `glossFidelity`,
  `moduleCompiler.diagnostics` m40/m41, `particleClozePlacement`,
  `priorAtomVisibility`, `reviewFillerVariety`), per the task's stated
  exclusion. Zero failures attributable to this change.
- `npx vitest run --project curriculum src/features/languages/fr` →
  **1178 passed, 1 skipped, 7 failed** — all 7 name `m16` (in-flight FR
  authoring lane) or `frAudioCoverage` (ratchet, also m16-driven), per the
  task's stated exclusion. Zero failures attributable to this change.
- `npx tsc --noEmit` → clean, no output.
- Sibling parity: `npx vitest run --project curriculum
  src/features/languages/es src/features/languages/ko` → 2339 passed, 1
  skipped, 1 failed (`esAudioCoverage`, in-flight ES m26 lane, excusable).

## What's left

Nothing blocking. Two non-blocking observations for a future pass, NOT acted
on here (out of scope / no evidence of present harm):

1. `substringScore` and `charOverlap`'s length-ratio scoring means very short
   targets (≤5 normalized chars) stay sensitive to any single un-folded
   stray character — the apostrophe class is now closed, but the same shape
   of issue could recur for any other punctuation-adjacent Unicode variant
   (e.g. a future curly-quote-in-target scenario). Not a known problem today;
   flagging as the general pattern this fix instance belongs to.
2. The de-elision leniency is currently indistinguishable, at the scorer
   level, from an actually-wrong answer that happens to share enough
   characters. This has not caused a false positive on any authored m11–m15
   target (all de-elided forms tested land at "perfect" or "close" on the
   correct target, and nothing was checked against a WRONG target as a
   false-positive probe — that's a different investigation from what this
   ledger item asked for).
