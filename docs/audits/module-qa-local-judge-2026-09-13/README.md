# Module QA — local-judge sweep, 2026-09-13

> **Reader caveat (Fable spot check, 2026-09-13 17:45):** of the first six KO P1 rows, four are judge errors — `joahaeyo` (좋아해요), `sireohaeyo` (싫어해요) and `go naseo` (고 나서) are correct Revised Romanisation, and 짜다 does mean "salty" (the judge only knows its "weave" sense). The 122B's Korean judgment is not reliable (same finding as the 2026-08 drafting tests); treat KO P1s as leads to verify, not defects. judge_error=20/96 (21 %). JA/ES/FR results below are from the same judge — spot-check each course before acting on it.


## Purpose

Content QA over every unwalked lesson module (KO m16–m27, JA m39–m46, ES
m21–m38, FR m3–m26 — 62 modules, 612 lessons) using a LOCAL judge model, not
a human or Claude read. This orchestrator (Sonnet) built the harness, wrote
the rubric, and triages the verdicts; the judge model made every content
call.

## Judge

- Ollama `qwen3.5-judge-256k` (Qwen3.5-122B-A10B MoE, Q4_K_M, 262,144-token
  context, ~87GB resident, ~55 tok/s decode), already loaded and verified
  before the sweep started.
- One call per lesson: `POST /api/chat`, `stream:false`, top-level
  `think:false`, `keep_alive:"2h"`, `options:{num_predict:4000,
  temperature:0.2, num_ctx:262144}`, `format:<JSON schema>` (forces
  structured output matching `{lessonId, findings[], cleanSteps,
  confidence}`).
- Ollama serves one request at a time; the harness runs strictly
  sequentially from a single long-running Node process
  (`scripts` below), appending one line per lesson to
  `results/<lang>.jsonl` and logging progress to `run.log`.
- On JSON parse failure or empty content, the harness retries once, then
  records `{lessonId, judge_error: true, error: "..."}`  and moves on.
- Per-call timeout: 15 minutes (AbortController); a hang would show as a
  `fetch_error` judge_error.

## Harness files (scratch, not in repo)

`/private/tmp/claude-501/.../scratchpad/qa-judge/`:
- `judge_lib.mjs` — Ollama call wrapper, JSON schema, retry/timeout logic.
- `rubric_common.txt` — shared doctrine: grade-answer-positions-only rule,
  a step-type → billed-answer-vs-distractor field map covering all 34
  `StepType`s (derived from `src/features/lesson/types.ts`), P1/P2/P3
  defect definitions, output-format rules (no filler/no-defect entries, no
  field-renaming complaints — see calibration below).
- `rubric_ko.txt` / `rubric_ja.txt` / `rubric_es.txt` / `rubric_fr.txt` —
  per-language addenda extracted from the repo's own authoring docs (see
  "Rubric sourcing" below), each keeping the combined system prompt under
  ~2,500 tokens.
- `sweep.mjs` — drives all four courses in sequence (KO→JA→ES→FR, smallest
  first), resumable (skips lessons already present in a course's `.jsonl`).
- `results/<lang>.jsonl`, `run.log`.

## Rubric sourcing

Read (not invented): `docs/lesson-authoring-guide.md`,
`docs/authoring-invariants-pinned.md`,
`docs/concept-type-authoring-guide-2026-07-19.md` (JA-scoped — both pinned
docs are titled "(ja)" despite generic filenames, so their hard invariants
— zero `info`/`phrase_card` in JA, `particle_cloze` introduction-only,
`selfExplain` banned — were routed to the JA rubric ONLY, not KO/ES/FR),
`docs/es-authoring-invariants-pinned.md`,
`docs/es-lesson-authoring-guide.md`, `docs/fr-authoring-invariants-pinned.md`,
`docs/fr-authoring-playbook.md`, `docs/fr-lesson-authoring-guide.md`. Three
parallel Sonnet subagents extracted condensed, checkable rule lists from
these (verified against source for the highest-stakes claims, e.g. grepped
`docs/authoring-invariants-pinned.md` to confirm inv 4/inv 5 are JA-only
before encoding them).

## Calibration (prove the verifier can fail)

One KO lesson (`ko-m16-3`) and one ES lesson (`es-m21-1`) were copied to
scratch (never written to the repo) and each given 3 planted defects: a
wrong translation in a billed answer, an answer unbuildable from its tile
bank, and a swapped meaning in an info body. The judge ran on both planted
copies and both untouched originals, 4 iterations of the rubric:

| Iter | Rubric change | Planted caught (n/6) | False positives (2 clean lessons) |
|---|---|---|---|
| 1 | baseline | 4/6 (missed both unbuildable-tile plants) | 2 (KO: judge flagged the generic `kana`/`romaji` field *names* — a JA-schema artifact reused for all languages — as script-type errors) |
| 2 | added explicit tile-multiset buildability check + "field names are generic, never flag them" rule | 4/6 (still missed both unbuildable-tile plants) | 8 (regression: the new "explicit check" wording caused the model to narrate a step-by-step walkthrough into the `findings` array itself — with `think:false` there is no hidden channel, so verbose self-talk leaked into JSON as pseudo-findings tagged P1 with `suggestion:"None"`) |
| 3 | softened the buildability instruction to a silent check; added a hard "never add a finding for a clean step, never narrate" output rule | 5/6 (now caught 1/2 unbuildable-tile plants); found 1 genuine pre-existing ambiguity in the ES clean control (a missing comma in a `dialogue_sim` answer, `"no fuimos sin Diego"`, that is genuinely mis-parseable — verified against source, not a hallucination) | still had 1 long (100s) CoT-leakage response on the KO clean control ending in a field-rename suggestion |
| 4 (final, used for sweep) | added a hard zero-exception rule against any finding proposing a field rename | 5/6 (KO missed the unbuildable-tile plant this run — non-deterministic at temp 0.2; ES caught it with 1 duplicate/junk entry) | 0 clean hallucinated findings; 1 defensible minor finding on the ES control (imprecise wording in a real explanation, quote verified); 1 `judge_error` on the KO control (verbose response exceeded the token budget mid-JSON — the retry/judge_error path handled it correctly) |

**Verdict:** clears the stated bar (≥4/6 caught, ≤3 false positives) from
iteration 1 onward on raw numbers; iterated to 4 anyway because iteration 1
and 2 both had a systematic, repeat-prone false-positive class (schema
field-naming) that would have generated noise across every KO/ES/FR lesson
using `phrase_card`. **Known residual risk carried into the sweep:** the
judge's catch rate on "answer not buildable from tiles" is inconsistent
(~50%, likely a MoE-routing/temperature artifact) — findings docs should
not be read as exhaustive for that specific defect class. Also, KO lessons
heavy in `phrase_card` steps occasionally trigger long (60–170s), verbose
responses that sometimes exceed `num_predict` mid-JSON — the harness's
retry-once-then-`judge_error` path handles this; expect the KO
`judge_error` rate to run higher than other courses.

## Two systematic false-positive classes discovered during aggregation (post-calibration)

Calibration (4 iterations, above) used two short hand-picked lessons and did
not surface these; they only showed up at the scale of the real sweep, so
they are handled by a post-hoc filter in the aggregator
(`gen_course_doc.py`) rather than a 5th rubric iteration mid-sweep (editing
`rubric_common.txt` would not retroactively fix already-emitted verdicts,
and the running sweep process has that file cached in memory since launch —
editing it does not even affect calls still in flight). Both classes are
excluded from the P1/P2/P3 counts and findings tables below, with counts
reported per course:

1. **Self-negating CoT-leakage** (the dominant class, ~35-60% of raw
   findings in KO/JA). With `think:false` there is no hidden reasoning
   channel, so on a step it ultimately judges clean, the model sometimes
   narrates its own verification into the `problem` field ("Wait, let me
   re-check... `X` is actually correct... no defect here") and leaves
   `suggestion` empty/"None"/"N/A" — but the JSON-schema-constrained decoder
   still forces a well-formed `findings` entry tagged P1/P2 around that
   narration. Filter: a finding is dropped if `suggestion` is empty/filler,
   or if either field ends in a self-negation phrase ("no defect", "no
   error", "is actually correct", etc.).
2. **Fabricated "id: correct is not unique" rule** (found in JA, ~6% of raw
   findings there). The judge repeatedly flagged the MCQ option
   `{"id":"correct"}` as an invalid/non-unique identifier and demanded
   renaming it. This is not a real rule — verified against
   `grammarHelpers.ts` (the compiler factory literally maps the answer to
   `{id:"correct"}`) and against raw module JSON sampled across all four
   languages: `"correct"` is the codebase-wide standard id for the correct
   option, universal, not a defect. Filter: drop any finding matching
   "not a standard unique identifier" / "id from 'correct' to" / similar.

Both filters are conservative (pattern-matched on the model's own
concluding language, not on content judgment) and are applied identically
across all four courses. Residual contamination that slips past both
filters (e.g. a long narrated finding that happens to end with a real,
specific, actionable suggestion) is left in the tables; `triage.md` catches
further stragglers among the P1s specifically by checking whether the
judge's own quote/claim is internally consistent.

## Status (2026-09-13, end of session)

**KO and JA are DONE** — every lesson in the target module range has a
result line (verdict or `judge_error`); `ko.md` and `ja.md` are final for
this rubric/model. **ES and FR are PAUSED, not started/barely started**:
Spencer wants the judge setup re-benchmarked first (a separate agent is
comparing thinking on/off, JSON-schema vs. free-text output, added
vocabulary context, `qwen3.8:27b`, `gemma4:31b`, and a Claude-Code-CLI
agentic harness against Sonnet-labelled ground truth on the KO findings)
before spending more judge wall-time on the same setup. `sweep.mjs` was
killed mid-run: ES got exactly 3/180 lessons judged (`es-m21-1..3`) before
the stop — those 3 result lines exist in
`scratchpad/qa-judge/results/es.jsonl` but are **discarded, not
aggregated into any doc**; treat ES as 0/180 done. FR never started
(0/240). Resuming later: `sweep.mjs` already skips lessons already present
in a course's `.jsonl`, so ES can restart from scratch (after discarding
the 3 stray lines) and FR from `m3`.

## Per-course totals

| Course | Modules | Lessons | Steps | P1 | P2 | P3 | Noise filtered | Judge wall time | judge_error |
|---|---|---|---|---|---|---|---|---|---|
| KO (m16–m27) | 12 | 96 | 737 | 40 | 1 | 0 | 43 | 12.6 min | 20 |
| JA (m39–m46) | 8 | 96 | 1,728 | 103 | 16 | 4 | 58 | 24.4 min | 10 |
| ES (m21–m38) | 18 | 180 | — | — | — | — | — | — | **paused, 3/180 judged, discarded** |
| FR (m3–m26) | 24 | 240 | — | — | — | — | — | — | **not started** |

KO judge_error rate (20/96 = 21%) is high, concentrated in
`phrase_card`-heavy lessons per the calibration note above (verbose
CoT-style responses occasionally exceed `num_predict` mid-JSON). JA
judge_error rate is 10/96 = 10%. Both wall-time figures are for successful
calls only (retries/errors add more wall-clock that isn't reflected in that
column — the actual KO course wall time was 84.2 min, JA was 73.9 min,
including the judge_error retries).

## Reading order for a fixer

1. `triage.md` — which P1s are plausible vs. suspected judge hallucination
   vs. duplicates.
2. Each course doc's "Classes" section — P1/P2 findings grouped by likely
   shared cause, so one fix can close several findings.
3. The findings table itself, P1 first.
