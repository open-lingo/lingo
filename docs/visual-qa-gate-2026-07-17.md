# Visual-QA gate (Gate 10) — capture → contract → judge (2026-07-17)

**Status:** LIVE · **Last-verified:** 2026-07-17

Screenshot-level QA of rendered lesson steps, judged against
machine-generated expected-state contracts — so visual/content defects are
caught (and fixed) BEFORE a human drives the lesson. Complements Gate 9
(component render test): Gate 9 asserts DOM semantics; this gate sees what a
person sees (fonts, ruby layout, real browser rendering).

## Pipeline

1. **Contracts** — `VISUAL_QA_LESSONS="ja-m8-6-1,ja-m29-4-1" npm run visual-qa:contracts`
   `src/features/lesson/dev/visualQaContracts.ts` derives one contract per
   step from the step data + script-ladder constants (`romajiAutoFlip.ts`,
   `kanjiRollout.ts`): exact text that must appear (post-kanji-substitution
   surfaces), text that must not, per-module romaji/furigana rules, step-type
   layout expectations. Written to `artifacts/visual-qa/<lessonId>/contracts.json`.
   (NOT under `test-results/` — Playwright clears that dir on every run.)

2. **Capture** — same env, `npm run visual-qa:capture`
   `tests/e2e/visual-qa-capture.authed.spec.ts` deep-links every step via the
   `?step=N` QA dial, waits for settle, and screenshots ONLY the step card
   (`[data-visual-qa="step-stage"]` in LessonPage — no header/progress chrome,
   ~4× fewer image tokens). Emits `capture-manifest.json` + one PNG per step.

3. **Judge** — vision-model pass per `scripts/visual-qa/judge-prompt.md`.
   One cheap-model (Haiku-tier) agent per lesson reads contracts + manifest +
   PNGs and returns strict-JSON verdicts (`ok` / `violation` / `unverifiable`
   / `escalate`). Violations/escalations go to a stronger model WITH the step
   source for root-cause + fix; re-capture + re-judge closes the loop. Only
   genuine judgment calls (art, pedagogy) reach a human.

## When to run

- **Every new/changed module before human QA** — the gate: content agents'
  work is captured + judged + fixed before Spencer drives it.
- After renderer/annotation changes (`AnnotatedText`, `applyKanjiSurfaces`,
  step views): re-run on one lesson per affected module band.

## Validation (2026-07-17)

Pipeline was validated by resurrecting two shipped regressions and judging
blind (runs renamed neutrally, judges not told what to expect):

- **run-clean** — current HEAD, ja-m8-6-1 (19 steps): expected all-ok.
- **run-a** — commit f67479f reverse-applied (kana filler segments float
  their own kana as furigana on speaking steps): expected violations on the
  3 speaking steps.
- **run-b** — `parseModuleIndex` regressed to require the `ja-` prefix
  (romaji renders over hiragana at m8+): expected violations on every step
  showing kana with romaji helpers.

**Results** (Haiku judges, blind, 19 steps/run):

- **run-clean**: 17 ok + 2 false positives — both judges misread the kanji
  一 (a single horizontal bar) as a divider line and reported "shows いち
  instead of 一" where the screenshot in fact shows 一 with いち furigana.
  Escalation review refuted both. → Judge prompts now carry a 一-glyph
  calibration note; false positives cost an escalation, never a bad fix.
- **run-a**: 19/19 correct — flagged exactly `speak-tooi` citing the exact
  kana-above-kana universal rule; the spaceless speaking steps (genuinely
  unaffected by the filler bug) correctly passed.
- **run-b, first pass — CRITICAL METHOD FINDING**: the judge passed the
  romaji leak on every step, because the contracts had been regenerated
  while the bug was live and the generator derived moduleIndex through the
  SAME `parseModuleIndex` the regression broke → the contract itself said
  "romaji expected". The oracle self-corrupted into agreeing with the bug.
  Fixed: `independentModuleIndex()` — the generator now derives module
  position with its own parse (oracle independence).
- **run-b, corrected oracle**: 11/19 violations — every romaji-bearing step
  flagged with the module rule, PLUS a true positive not targeted by the
  validation: the same broken parse suppressed kanji (一/七/六 rendered as
  kana) on the review match step, and the mustShow contract caught it.

Net: with an independent oracle, both resurrected regressions are caught
with zero missed steps; the only judge errors were conservative false
positives (escalation-absorbable), never false passes.

## Cost profile

Per new-module sweep (~8 lessons × ~20 steps): contracts + capture are
token-free (vitest + Playwright). Judging ≈ 160 step images on a Haiku-tier
model, escalations only on flags. Crop + 1280px viewport keep per-image cost
low. Judge a lesson per agent — batching amortizes the protocol context.

## Known limitations / next steps

- Screenshots are pre-interaction only: post-answer states (feedback
  banners, replay flows) are not yet captured. Extend the capture spec with
  an interaction script per step type if post-commit bugs recur.
- Judges see one step at a time; cross-step defects (e.g. same distractor
  set repeated across a lesson) belong to the content lints (Gate 2), not
  this gate.
- Baselines/pixel-diff pre-filter not yet wired: every captured step is
  currently judged. If sweeps get big, add a pixelmatch skip against the
  previous accepted run and judge only changed steps.
