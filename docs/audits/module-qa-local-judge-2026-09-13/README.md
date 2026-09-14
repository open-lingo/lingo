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

## v2 judge (2026-09-14)

**Why v2:** priority shifted to mobile + QA with authoring halted; before spending more wall-time on the v1 setup over ES/FR, a separate benchmark (`scratchpad/judge-bench/`) compared decoding/context variants against a Sonnet-adjudicated KO ground truth (`labels.json`, 29 curated findings + 6 planted defects) and an independently triaged JA set (`ja-labels.json`, 8 TRUE / 111 FALSE of 119 raw v1 findings). Two causes drove the redesign:
1. The v1 rubric's exhaustive step-type → field map (naming `correctParticle` etc. literally) seeded the dominant false-positive class in both courses: the judge infers a narrow content constraint from a field's *name*, not the schema. 6/29 curated KO findings and 65/69 JA "invented-rule" findings were this exact mechanism (`particle_cloze.correctParticle` reused for a non-particle cloze).
2. `think:false` + a forced JSON `format` schema gives the model no private scratchpad, so step-by-step reasoning leaks into the `findings` array itself (self-negating "...actually this is correct" entries) — the root cause of v1's 43/96 KO CoT-leakage filter and much of JA's noise.

**Model / settings:** `gemma4-31b-256k` and `qwen3.8-27b-256k` (both `-256k` tags, 262,144 ctx baked in) compared head-to-head; **`qwen3.8-27b-256k`, `think:true`** was used for the sweep below. `temperature:0.2`, `num_predict:6000`, no forced `format` schema (fenced ```json block, retried once on parse failure), 10-minute per-call timeout. Rubric: `rubric_v2_common.txt` (~1,265 tokens) + `rubric_v2_<lang>.txt` — the literal field map is GONE, replaced by "field names are generic slot names, judge the content" plus an explicit "known false-positive classes are not findings" list (particle_cloze reuse for non-particle clozes, tile splits at taught particles, romanization-as-taught, inflected-form ≠ typo, `kanji_reading` reading==surface = furigana suppression by design). Context per lesson now also includes taught vocabulary through the current module (current module's words first, ~3,000-token cap; `courseAtoms.ts` for ko/ja, `atoms.generated.json` for es/fr) and the module's lesson titles. Harness: `scratchpad/judge-v2/` (`judge_v2_lib.mjs`, `sweep_v2.mjs`, `validate_ko.mjs`/`validate_ja.mjs`, `score_v2.mjs`, `cli_agentic_v2.mjs`).

**Validation** (KO: 8 real bench lessons + 2 planted-defect copies scored against `judge-bench/labels.json`; JA: the 8 lessons containing the 8 TRUE-labelled v1 findings + the 7 lessons densest in FALSE-labelled v1 findings, scored against `judge-bench/ja-labels.json`):

| Variant | KO precision (labelled) | KO recall | KO planted (of 6) | JA TRUE recall (of 8) | JA judge_error | s/lesson KO / JA |
|---|---|---|---|---|---|---|
| gemma4-31b-256k | 0.50 (1/2) | 7/8 = 0.88 | 6/6 | 0/8 | 4/15 (27%) | 84.7 / 244.1 |
| qwen3.8-27b-256k think:true | 0.50 (1/2) | 7/8 = 0.88 | 6/6 | 0/8 | 0/15 (0%) | 78.6 / 148.7 |

CLI-agentic variant (`claude-local gemma`, tools enabled, 3 KO lessons): the first trial produced no output files because the sessions were started from the scratchpad directory — Claude Code denies reads outside its working directory in non-interactive mode, and the model correctly stopped to ask for permission. Re-run from the repo root with `--add-dir <scratchpad>`: 3/3 verdict files written (475–552 s each), 0 findings on ko-m16-3 and ko-m20-8 (both correct per labels) and on ko-m25-7 (its real defect had already been fixed on main before the run, so recall is untested). Usable as a slow, low-noise second opinion; not a sweep tool.

Gemma's 4/15 JA `judge_error` (`empty_content`) was root-caused: retrying the 4 failed lessons at `num_predict:10000` (vs. the build spec's 6000) fixed 3/4 — the JA vocabulary-context block plus a long lesson pushed generation past the 6000-token cap before the JSON fence closed. The 4th still failed (600s timeout even at 10000). qwen3.8-27b-256k had 0/15 JA errors at `num_predict:6000` throughout.

**Bar and decision:** the stated bar (KO precision ≥0.70 AND planted ≥5/6 AND JA TRUE recall ≥5/8, for at least one variant) was **NOT met** by either variant on the strict numbers — JA TRUE recall is a hard 0/8 for both (the 8 labelled JA defects are subtle single-field errors: a wrong kanji gloss, a fused-katakana romaji typo, a mis-split build tile — outside what a 27–31B local model reliably catches), and KO labelled-precision (0.50) rests on an n=2 sample, because most v2 findings land on step positions the 29-item KO ground truth never adjudicated (a rubric-divergence artifact of v2 no longer reproducing v1's specific false positives, not necessarily lower quality — manual read confirms the 2 real-lesson KO findings include one independently-rediscovered Sonnet-confirmed TRUE, `ko-m25-7-info`'s redundant -(으)러 purposive, and all 6 planted defects were caught with only 1 reproduced legacy false positive). Given clean planted-defect recall (6/6, both variants) and low-noise, well-reasoned output on manual read of the ES/FR sweep (see `es.md`/`fr.md` — e.g. a 7-instance systematic ES bug class mislabeling 1st-person preterite verb forms as "you" in cloze explanations, a French elision-rule reversal for "onze"), the sweep was run anyway, treating v2 explicitly as a **gross-defect lead generator, not a certifier** — every finding needs human/Sonnet verification, and a lesson with zero findings is NOT proof the lesson is clean (JA validation showed 0/8 recall on subtle defects). `qwen3.8-27b-256k` was chosen for the sweep over gemma for its clean JA error rate (0/15 vs 4/15).

**Bar waiver:** the coordinator (the main Claude session) waived the JA-recall bar after reading the validation numbers: v2 catches gross defects (planted 6/6) with very low noise, so a sweep over 420 unwalked ES/FR lessons on idle local compute is worth running as a leads pass. Findings are leads, not certification; a clean lesson is not evidence of correctness. Post-hoc corroboration: Sonnet triage of the ES output found 32 TRUE / 2 FALSE of 34 (es-triage.md).

**What changed vs v1:** no forced JSON `format` schema (kills CoT-leakage-into-findings at the root, not just by reminder); field-name-literalism false positives explicitly named and banned instead of relying on a literal field map; taught-vocabulary context added per lesson; `qwen3.8-27b-256k`/`gemma4-31b-256k` (27–31B) instead of `qwen3.5-judge-256k` (122B) — far cheaper/faster per lesson (~80–150s vs. v1's 122B run) at a real recall cost on subtle single-field defects that the smaller models miss.

**Real-world signal since the sweep landed:** `es-triage.md` (a follow-up verification pass over every ES P1/P2) found **32 TRUE / 2 FALSE of 34** (94%) — far above the small labelled-KO-set estimate above — and at least 3 of the P1s (the "1st-person preterite mislabeled as 'you'" class) were already fixed in the actual curriculum source (`es/curriculum/{m18,m20,m21}.ts`, commit `53f6a22a`). Read that as the real precision on gross, self-contained explanation-text errors — the labelled-KO/JA sets above are a harder, adversarially-selected benchmark (curated to include known v1 failure modes and subtle single-field defects), not a like-for-like comparison.

## Status (2026-09-13, end of session)

**KO and JA are DONE** — every lesson in the target module range has a
result line (verdict or `judge_error`); `ko.md` and `ja.md` are final for
this rubric/model. **Status 2026-09-14:** ES and FR were swept with the v2 judge (see the v2 section); the note below describes the v1 pause that preceded it:
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

**Update 2026-09-14:** ES (m21–m38, 180/180 lessons) and FR (m3–m26, 240/240 lessons) are now DONE, judged by the **v2** harness/model (`qwen3.8-27b-256k`, think:true — see "v2 judge" section above), not the v1 122B setup used for KO/JA. `es.md` and `fr.md` are v2 output; `ko.md`/`ja.md` remain untouched v1 output. Do not directly compare v1 KO/JA P1 counts to v2 ES/FR P1 counts as if from the same instrument — read each doc's own reader caveat.

## Per-course totals

| Course | Modules | Lessons | Steps | P1 | P2 | P3 | Noise filtered | Judge wall time | judge_error |
|---|---|---|---|---|---|---|---|---|---|
| KO (m16–m27) | 12 | 96 | 737 | 40 | 1 | 0 | 43 | 12.6 min | 20 |
| JA (m39–m46) | 8 | 96 | 1,728 | 103 | 16 | 4 | 58 | 24.4 min | 10 |
| ES (m21–m38) v2 | 18 | 180 | 2,775 | 30 | 4 | 22 | N/A (v2 has no forced-schema CoT-leakage class) | 327.2 min | 1 |
| FR (m3–m26) v2 | 24 | 240 | 2,753 | 19 | 6 | 16 | N/A (v2 has no forced-schema CoT-leakage class) | 268.1 min | 0 |

KO judge_error rate (20/96 = 21%) is high, concentrated in
`phrase_card`-heavy lessons per the calibration note above (verbose
CoT-style responses occasionally exceed `num_predict` mid-JSON). JA
judge_error rate is 10/96 = 10%. Both wall-time figures are for successful
calls only (retries/errors add more wall-clock that isn't reflected in that
column — the actual KO course wall time was 84.2 min, JA was 73.9 min,
including the judge_error retries).

**ES and FR rows are v2 output** (`qwen3.8-27b-256k`, different model,
rubric, and decoding settings than the v1 122B rows above — see "v2 judge"
section) — do not read across the table as if all four courses came from
one instrument. ES/FR wall-time is for successful calls only; actual course
wall time including the 1 ES retry was 367.4 min (ES) and 269.3 min (FR).

## Reading order for a fixer

1. `triage.md` — which P1s are plausible vs. suspected judge hallucination
   vs. duplicates.
2. Each course doc's "Classes" section — P1/P2 findings grouped by likely
   shared cause, so one fix can close several findings.
3. The findings table itself, P1 first.
