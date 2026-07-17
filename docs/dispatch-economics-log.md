# Dispatch economics log

**Status:** LIVE · **Last-verified:** 2026-07-17

Per-dispatch instrumentation (research doc known-gap: no verified literature
on model-tier economics — measure ourselves). Log every content/QA dispatch:
model tier, output tokens, wall time, and downstream gate outcomes. The
Haiku-vs-Sonnet judge comparison for Gate 10 lands here too.

| Date | Dispatch | Model | Tokens | Time | Gate outcome |
|---|---|---|---|---|---|
| 2026-07-17 | Gate 4 atom coverage (fix+gate) | opus | 201k | 30m | all green, 0 review rejections |
| 2026-07-17 | Gate 2 per-module tests + lints | opus | 186k | 16m | all green; 8 real defects found |
| 2026-07-17 | Gate 9 render smoke test | opus | 121k | 15m | all green, 1 flake reported |
| 2026-07-17 | Doc-references gate + front-matter | opus | 55k | 4m | all green |
| 2026-07-17 | Gate 10 judge, run-clean (19 imgs) | haiku | 37k | 2m | 17/19 correct; 2 FP (一 misread), 0 false passes |
| 2026-07-17 | Gate 10 judge, run-a (19 imgs) | haiku | 37k | 2m | 19/19 correct incl. regression catch |
| 2026-07-17 | Gate 10 judge, run-b corrupted oracle | haiku | 37k | 2m | judged consistently vs corrupted contract (oracle bug, fixed) |
| 2026-07-17 | Gate 10 judge, run-b fixed oracle | haiku | 38k | 2m | 19/19 correct: 11 violations + kanji true-positive |

| 2026-07-17 | conjugation_cloze step type (code) | opus | 162k | 15m | all green 1st run; found+fixed an import cycle |
| 2026-07-17 | m30 stage 1 (pairs 1-4, pinned invariants) | sonnet | 287k | 33m | ALL gates green on 1st review — 0 rejections (m29 pre-protocol needed ~4 QA fix rounds) |

<!-- m30 stage 2 + Gate 10 judge rows appended as dispatches complete -->

## m30 pipeline wall-clock (overlap experiment, 2026-07-17)

Testing whether pipeline overlap (capture/judge stage 1 while stage 2
authors) beats the serial estimate (~1.5–2h from stage-2 dispatch to
walk-ready). If the measured save holds, overlap + per-pair parallel
authoring become the m31+ standard (Spencer 2026-07-17: "note that if
the time save is good when we test").

| Event | Clock |
|---|---|
| Stage 2 authoring dispatched | ~15:31 |
| Stage-1 capture started (overlapped) | 15:36 |
| Stage-1 capture done (151 pngs, 8 lessons, parallel) | 15:38 |
| Stage-1 dual judges dispatched (8× haiku + 8× sonnet) | 15:39 |
| All 16 verdicts in (~2.5 min/judge, parallel) | 15:43 |
| Fix round committed (3 render defects, 1 typo, capture guard) | 15:45 |
<!-- append: capture done, stage-1 judges done, stage 2 landed, review+commit done, stage-2 capture+judge done, fixes done, WALK-READY -->

