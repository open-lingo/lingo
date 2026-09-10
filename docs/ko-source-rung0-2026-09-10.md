# KO-source Rung 0 — lesson-chrome localization (2026-09-10)

**Status:** DONE. Implements Rung 0 from
`docs/ko-source-learner-scope-2026-09-10.md`: Korean chrome on the lesson
surface, English lesson content untouched, romaji unchanged. Worked entirely
in worktree `ja-wave1`, alongside concurrently-running FR m16 / ES m26 / JA
m41 authoring agents — none of their files were touched.

## What was localized

The scope doc's own count of "84 `t()` calls under `src/features/lesson/`,
only 5 resolve" was for the OLD state, before the `lesson` namespace existed
at all in the flat i18next resource files. This pass:

1. Added a `lesson` top-level key to `src/shared/i18n/locales/en.json` and
   `ko.json` (i18next here uses a single flat `translation` namespace — no
   `i18n.ts` config change was needed, just populating the resource files).
2. Replaced raw English chrome literals with `t("lesson.<key>", "fallback")`
   in the lesson-surface (not lesson-content, not builder-output) components:
   - `src/features/lesson/components/Feedback.tsx` — verdict text
     (soClose/correct/notQuite), "Correct answer:" label, "View explanation".
   - `src/features/lesson/components/TestRunner.tsx` — passed/skipped/failed
     screens (heading + body, with `{{correct}}`/`{{total}}` interpolation),
     attempts-left aria-label, Skip button, Continue buttons, and the
     `SkipConfirm` sub-component (title/body/keepGoing/skip).
   - `src/features/lesson/components/steps/GrammarRuleStepView.tsx` —
     `ReadAloudButton` aria-label/title, "Got it"/"Reading…" CTA labels,
     "Grammar refresher"/"Grammar" eyebrows, "Don't do this" caption,
     `ExampleTile`'s "Play example" aria-label.
   - `src/features/lesson/components/steps/PhraseCardStepView.tsx` —
     "Replay audio" aria-label, "Play again", shared "Got it".
   - `src/features/lesson/components/ExplainButton.tsx` — "Explain this
     question" aria-label + title.
   - `src/features/lesson/components/AccentBar.tsx` — "Accented characters"
     toolbar aria-label, per-chip "Insert {{ch}}" aria-label.
   - `src/features/lesson/components/steps/FillBlankStepView.tsx` — "Check"
     button (reused the pre-existing `lesson.check` key rather than
     duplicating it).
   - `src/features/lesson/components/steps/SpeakingStepView.tsx` (the
     largest surface, 1236 lines) — `SilentSwapButton`, the placeholder
     screen, `ReferenceCard` (including a module-scope
     `CUE_LANGUAGE_KEYS` record of i18n key paths, since module scope can't
     call `t()` directly — the consuming component resolves it), the
     recognized-speech view (romaji toggle, mic button/aria-label, "Heard"
     label, the full 19-branch helper-text state machine, retry/skip/
     continue actions), `SilentModeNotice`, and `TranscriptCard`.
3. Backfilled two **pre-existing genuine locale gaps** the new parity test
   caught (not introduced by this pass, but never wired into either locale
   file): `alphabet.celebrate.{nice,great,gotIt,wellDone,perfect}` (used by
   `CelebrationToast.tsx`) and `alphabet.tapToHear` (used by
   `SymbolToSoundStepView.tsx`).
4. Backfilled the 10 previously-missing `practice.conjugation.free*` keys in
   `ko.json` (the scope doc's "49 missing" figure was stale/over-counted —
   the actual gap, confirmed by a full flatten-and-diff, was these 10 keys,
   all under one feature).

**Deliberately NOT touched (in scope, decision recorded per "infer, record,
proceed"):**
- `SpeechDebugPanel` inside `SpeakingStepView.tsx` — a `?speech-debug=1`
  developer overlay, not learner-facing chrome. Its raw strings ("Speech
  debug", "target:", "norm:", "tiers:", "verdict:") are left in English.
- Lesson *content* (sentences, glosses, explanations) and *builder* output
  (`moduleCompiler.ts`, `buildSrsReviewLesson.ts`) — explicitly out of Rung 0
  scope; see "Remaining for later passes" below.
- The four English-shape grading couplings (`jaAcceptedForms.ts:127`,
  `matchPairsFloor.ts:86,402,476`, `jaSurfaceForms.ts:91`, `moduleCompiler.ts`
  cue regexes) — Rung 1 work, no grading logic was touched this pass.

## Key counts

| | before | after |
|---|---|---|
| `en.json` total flat keys | ~2,559 (approx., pre-session baseline) | **2,732** |
| `ko.json` total flat keys | ~2,549 (10 short of en, all `practice.conjugation.free*`) | **2,732** |
| `en.json` / `ko.json` parity gap | 10 keys (ko missing) | **0 — perfect parity, both directions** |
| `lesson.*` keys | 80 (pre-existing, mostly unused before this pass) | **155** (both locales) |
| `alphabet.*` keys | 44 | **50** (both locales — the 6 backfilled gaps) |

Verified via a full flatten of both JSON files: `len(flat_en) == len(flat_ko)
== 2732`, `set(flat_en) - set(flat_ko) == set()` and vice versa.

## Test: locale-parity guard

New file: `src/features/lesson/localeParity.test.ts`. Walks every non-test
`.ts`/`.tsx` file under `src/features/lesson/` (excluding `dev/` — see
below), collects every `t("some.key", …)` call-site key plus every bare
`"lesson.…"` / `"alphabet.…"` string literal (to catch indirect lookups like
`SpeakingStepView.tsx`'s `CUE_LANGUAGE_KEYS` record, whose values are handed
to `t()` through a variable, not inline), and asserts each collected key
exists in both `en.json` and `ko.json`.

**Vacuous-proof check, as required:** the test was run before any locale
fixes were applied and produced **18 real failures** (9 unique keys × 2
locales): the 6 genuine `alphabet.*` gaps above, plus 3 apparent gaps
(`lesson.languageId`, `lesson.something`, `lesson.steps`) that turned out to
be false positives from the scanner's own regex matching quoted example text
inside **comments** (`` // for `lesson.languageId` `` in
`matchPairsFloor.ts:259`, `` /* Strip `build_sentence` from `lesson.steps`
… */ `` in `mockLessons.ts:679`) and inside a **QA-contract description
string** (`"...unresolved i18n keys (e.g. 'lesson.something')."` in
`dev/visualQaContracts.ts:80` — a nested-quote false match, not a real key
lookup). This proved the test can fail, satisfying the doctrine.

Two precision fixes, no coverage lost:
- The scanner now strips `//` and `/* */` comments before matching (verified
  safe for this directory: no file has a `//` inside a string literal, e.g.
  an embedded URL, that stripping could wrongly eat).
- `src/features/lesson/dev/` is excluded from the walk — confirmed via grep
  that **zero** files under `dev/` call `t()` at all (it's QA/dev tooling:
  visual-QA contract generation, dev-only proto pages), so excluding it
  removes only the one false-positive match, not any real key usage.

Final state: `npx vitest run --project app src/features/lesson/localeParity.test.ts`
→ **355 passed (355)**.

## Gates

- `npx vitest run --project app src/features/lesson src/shared 2>&1 | grep -E "Tests |FAIL|×"`
  → **8 failed | 1740 passed | 17 skipped (1765)**. All 8 failures are
  pre-existing, unrelated to this pass: `mockCourse.test.ts`,
  `audioCoverage.test.ts`, `glossFidelity.test.ts`,
  `moduleCompiler.diagnostics.test.ts` (m40/m41 IR),
  `particleClozePlacement.test.ts`, `priorAtomVisibility.test.ts`,
  `reviewFillerVariety.test.ts` — all reference `ja-m41-neo-7/9/10`, tracing
  to the concurrently-running background "Author JA m41 module" agent, not
  to any file this pass touched.
- `npx tsc --noEmit` → clean for every file this pass touched
  (`grep -E "src/features/lesson/|src/shared/i18n"` over the tsc output
  returns nothing). The only remaining tsc errors are pre-existing, in
  concurrent agents' in-flight files (`_debug-m41.test.ts`,
  `conjugation-grid/gridSession.test.ts` for the FR/ES conjugation trainer
  work) — outside `src/features/lesson/` and `src/shared/i18n/` entirely.
- 6 targeted component test files for every file touched
  (`Feedback.test.tsx`, `TestRunner.test.tsx`, `GrammarRuleStepView.test.tsx`,
  `SpeakingStepView.placeholder.test.tsx`,
  `SpeakingStepView.silentBuild.test.tsx`, plus the smoke coverage inside the
  broader `src/features/lesson` run for `PhraseCardStepView`/
  `FillBlankStepView`/`AccentBar`/`ExplainButton`) — all pass.
- Visual verification via `node scripts/shot.mjs`: **skipped**. Ports
  5173/5273 were free (dev server started cleanly), but this worktree has no
  `.auth/user.json` — an authed lesson-route screenshot needs the one-time
  headed `npm run test:e2e:auth` login flow, which is not a "cheap" check.
  Substituted with the passing component-test suite (which renders the real
  `t()`-wired JSX via React Testing Library) and the locale-parity test as
  the correctness signal instead.

## Remaining for the next pass (Rung 1 territory)

Two builder files were explicitly scoped OUT (per the "don't touch
`moduleCompiler.ts`" instruction and because builder-emitted strings aren't
what Rung 0 targets). Rough counts via a capital-letter-leading
double-quoted-string heuristic (`"[A-Z][a-zA-Z ,.'!?-]{3,60}"`, a **lower
bound** — it misses lowercase-starting and template-literal strings, so
expect the real count to be somewhat higher on a full audit):

- `src/features/lesson/data/moduleCompiler.ts` (2,374 lines) — **≥14** raw
  English literals surfaced by the heuristic (e.g. "Both", "Neither", "Not
  quite", "Pick the word for…", "What does this mean?", "Who is this said
  to?"). This is well under the scope doc's earlier ~209-literal estimate
  for "builders" collectively — that figure likely also counted content-shape
  strings, not just chrome, and needs re-verification once this file is
  in scope (it's currently owned by the concurrent JA m41 lane).
- `src/features/lesson/data/buildSrsReviewLesson.ts` (704 lines) — **≥6** raw
  English literals ("Nothing to review yet", "Review complete", "Production
  review", "Recognition review", "Complete more lessons to unlock review
  content.", "Words start showing their kanji").

Both need a real Rung-1-scoped pass (full manual audit, not the regex
heuristic above) once the module-compiler lane is quiet, per the scope doc's
own ordering: "rung 0 → extractor + 4 grading de-couplings (one PR, after
the JA authoring lane is quiet because `moduleCompiler.ts` is shared) → MT
wave."

Also out of scope for Rung 0, unchanged this pass: the four English-shape
grading couplings named in the scope doc, and all lesson *content* (course
sentences, glosses, grammar-rule prose) — Rung 0 is chrome-only.

## Sibling-parity note

- **Other courses (ES/FR/KO target courses):** inherit automatically. The
  `lesson.*` chrome keys are shared across every course — they're read by
  component code, not gated by target language — so Feedback/TestRunner/
  GrammarRuleStepView/etc. render in Korean UI chrome for ES, FR, and KO
  target-language lessons exactly the same as for JA. Nothing course-specific
  was touched.
- **Mobile build:** inherits automatically — same React component tree,
  same `t()` calls, no mobile-specific fork of any file touched this pass.
- **`SpeechDebugPanel`:** N/A by design (dev-only overlay, explicitly scoped
  out above) — no parity concern since it's never learner-facing on any
  surface.
- **Builder-emitted chrome (`moduleCompiler.ts`, `buildSrsReviewLesson.ts`):**
  needs porting — tracked above as the next pass, applies to every course
  that runs through those builders (currently JA IR modules + the review-
  lesson builder used by all courses' SRS review sessions).

## Files touched

- `src/shared/i18n/locales/en.json`, `src/shared/i18n/locales/ko.json`
- `src/features/lesson/components/Feedback.tsx`
- `src/features/lesson/components/TestRunner.tsx`
- `src/features/lesson/components/steps/GrammarRuleStepView.tsx`
- `src/features/lesson/components/steps/PhraseCardStepView.tsx`
- `src/features/lesson/components/ExplainButton.tsx`
- `src/features/lesson/components/AccentBar.tsx`
- `src/features/lesson/components/steps/FillBlankStepView.tsx`
- `src/features/lesson/components/steps/SpeakingStepView.tsx`
- `src/features/lesson/localeParity.test.ts` (new)

No `curriculum/m*.ts`, `courseAtoms.ts`, IR files, `tts-publish/`, or
`src/features/lesson/data/moduleCompiler.ts` were touched — confirmed via
`git diff` scoped to this pass's files only; unrelated concurrent-agent
changes to those paths (JA m41, ES m26, FR m16, FR conjugation trainer) are
present in the working tree but are not part of this change.
