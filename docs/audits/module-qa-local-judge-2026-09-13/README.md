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

## Per-course totals

_Filled in as each course finishes — see `ko.md`/`ja.md`/`es.md`/`fr.md`._

| Course | Modules | Lessons | Steps | P1 | P2 | P3 | Judge wall time | judge_error |
|---|---|---|---|---|---|---|---|---|
| KO (m16–m27) | 12 | 96 | TBD | TBD | TBD | TBD | TBD | TBD |
| JA (m39–m46) | 8 | 96 | TBD | TBD | TBD | TBD | TBD | TBD |
| ES (m21–m38) | 18 | 180 | TBD | TBD | TBD | TBD | TBD | TBD |
| FR (m3–m26) | 24 | 240 | TBD | TBD | TBD | TBD | TBD | TBD |

## Reading order for a fixer

1. `triage.md` — which P1s are plausible vs. suspected judge hallucination
   vs. duplicates.
2. Each course doc's "Classes" section — P1/P2 findings grouped by likely
   shared cause, so one fix can close several findings.
3. The findings table itself, P1 first.
