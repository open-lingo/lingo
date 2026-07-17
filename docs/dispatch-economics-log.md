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

<!-- m30 rows appended as dispatches complete -->
