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
| 2026-08-20 | es m4 IR re-author (full bar, zero debt) | sonnet | 378k | 30m | all gates green on 1st review; reviewer caught 4 non-gate defects (2 prose errors incl. reproduced July -ente claim, 2 atom-credit gaps) — same class as ja's walk residue |

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
| Stage 2 landed (25 min authoring, overlapped with judging) | 15:56 |
| Stage 2 reviewed + committed; full recapture (15 lessons, 270 pngs, 0 blanks) | 16:02 |
| Stage-2 dual judges + stage-1 fix-verify dispatched (15 agents) | 16:03 |
| All verdicts in; fix-verify 28/28 fixed; artifact recaptures verified | 16:14 |
| **WALK-READY** (stage-2 dispatch 15:31 → done: 43 min total) | 16:15 |

**m30 judge rows:** 8× haiku stage-1 (~38k tok each), 8× sonnet stage-1 (~47k),
7× haiku stage-2 (~37k), 7× sonnet stage-2 (~45k), 1× haiku fix-verify (67k).
**Tier confusion matrix (m30, 270 steps × 2 tiers):**
- Real defects found: 4 (match-tile kanji strip, grammarRule romaji, keigo
  typo, + stage-1's blank-capture class exposing itself). Sonnet found
  match-kanji + rule-romaji + toggle escalations; haiku found the keigo typo
  + match-kanji; NEITHER tier false-passed a real defect.
- False claims: haiku 3 (2 hallucinated violations on 5-2, 1 hallucinated
  "学校 present" transcription); sonnet 0. Sonnet escalations were all
  legitimate doubts (capture artifacts).
- Verdict: haiku is fine as the screening tier IF every violation routes
  through verification (it does); sonnet is the better single-tier judge.
  Recommended steady-state: haiku screen + sonnet on flags only.
<!-- append: capture done, stage-1 judges done, stage 2 landed, review+commit done, stage-2 capture+judge done, fixes done, WALK-READY -->
| 2026-08-20 | es m5 IR re-author (first verb module, full bar, zero debt) | sonnet | 334k | 24m | all gates green on 1st review; reviewer caught 2 defect classes the gates can't see: a COMPILER tile-casing bug (proper names lowercased — «Ana»→«ana»; fix also restored Diego/México/España tiles in shipped m2) and pattern-memorizable distractor repetition (3 identical niña retrievals). Zero prose errors — better than m4's 4. |
