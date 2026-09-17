# Preflight numbers — 2026-09-17 (lane A5a)

2026-09-17 project review, lane A5a — `docs/project-review-2026-09-17.md` §1
"Tests/CI" + §2 "Testing/QA", Area 5 of the ranked queue. No CI doc matching
memory `cicd-verify-conclusions-not-pipes` exists in `docs/` (searched for
"cicd"/"ci-cd"/the doctrine text — no hits), so this is a new file per the
brief's fallback.

**Rule followed throughout:** apply a config change only with ≥10% measured
gain on the total; otherwise report the number and skip. No test semantics
changed anywhere in this lane.

**Machine:** this Mac, `hw.ncpu`=18 (`hw.perflevel0.physicalcpu`=6 P-cores,
`hw.perflevel1.physicalcpu`=12 E-cores), Node v22.23.2, npm 10.9.8, Vitest
4.1.6, run inside `.claude/worktrees/feedback-b12`.

**⚠️ Confound, disclosed up front:** this machine ran several other
project-review lanes' agents concurrently during measurement (per
`concurrent-sessions-same-repo` — confirmed via `ps`/`uptime` load average
8.5–17 of 18, and directly: one `vitest run` mid-measurement hit 3 transient
"Failed to resolve import" failures from a file lane A8 was actively writing
in `src/features/lesson/data/`, and an `app`-project `--sequence.shuffle`
run's "order-dependent" failures all landed inside files git showed as
concurrently modified by lane A8, not a reproducible ordering issue — see
§3). Identical configs measured 15–35s apart on this run varied by up to 50%
wall time. Every number below is disclosed with that ceiling in mind; where
the noise floor exceeded the 10% decision threshold, the config was left
unchanged and that is stated explicitly rather than picking a number that
happened to look good once.

## 1. Stage timings (3 runs each, median)

| Stage | Command | Run 1 | Run 2 | Run 3 | Median |
|---|---|---:|---:|---:|---:|
| content:emit | `npm run content:emit` | 3.75s | 3.61s | 4.29s | **3.75s** |
| typecheck | `npx tsc -b --force`* | 15.59s | 14.79s | 14.69s / 14.58s | **14.69s** |
| unit tests | `npx vitest run --reporter=dot` | 82.64s | 83.31s | 86.23s | **83.31s** |
| build | `CI=true npx vite build` | 9.14s | 9.88s | 8.69s | **9.14s** |
| **preflight total (sum)** | | | | | **≈110.9s (1m51s)** |

\* `--force` used to simulate CI's cold cache (no `.tsbuildinfo` on a fresh
checkout); an incremental local `tsc -b` after a warm cache is faster and
not representative of what a real preflight (or CI) pays.

**Headline finding: the informal "~5 minutes" does not hold on this
machine.** Full local preflight is ~1m51s, not 5 minutes. Where the 5-minute
number actually comes from: real CI run timings pulled via `gh run view
<id> --json jobs` (§4) show `unit tests` alone at **435–459s** (7–7.5 min) on
GitHub's `ubuntu-latest` runner — this repo's informal estimate is a CI/
loaded-machine number, not a clean-local-Mac number. The historical
`--maxWorkers=6` cap mentioned in `docs/handoff-2026-09-10-overnight-authoring.md`
was a response to background load (a karaoke app + a concurrent Claude
session), the same class of confound disclosed above, not a property of the
suite itself.

### Per-project vitest breakdown (single clean run each, dot reporter)

| Project | Files | Tests | Wall |
|---|---:|---:|---:|
| `curriculum` (`isolate:false`) | 242 | 13,406 | 23.9s |
| `curriculum-render` | 3 | 1,286 | 6.4s |
| `app` | 457 | 3,861 | 72.0s |

Projects run concurrently (Vitest 4's `projects` schedule together), so the
full-suite wall time (~83s) ≈ the slowest project (`app`), not the sum
(~102s). **`app` is the critical path**, and within `app` it is dominated by
one file (next section) — not by pool/worker contention across the other
456 files.

### Top 15 slowest test files (Vitest JSON reporter, `endTime - startTime`)

| Duration | Project | File |
|---:|---|---|
| 83.1s | app | `src/test/proceduralQa.test.ts` |
| 16.2s | app | `src/features/placement/engine/deriveModuleTestOut.test.ts` |
| 8.3s | app | `src/features/lesson/data/grammarReviewIndex.test.ts` |
| 6.9s | app | `src/features/lesson/data/matchPairsPairCount.test.ts` |
| 6.6s | app | `src/features/lesson/data/lessonAtomAttribution.test.ts` |
| 6.6s | curriculum | `src/features/languages/ja/secondScript/applyKanjiSurfaces.test.ts` |
| 6.6s | app | `src/features/lesson/data/reviewSplit.test.ts` |
| 6.0s | curriculum | `src/features/languages/ja/secondScript/kanjiCoverageAudit.test.ts` |
| 5.7s | app | `src/features/lesson/data/buildSrsReviewLesson.test.ts` |
| 5.7s | curriculum | `src/features/languages/ja/acceptedAnswerCollisions.test.ts` |
| 5.5s | app | `src/features/lesson/data/buildTileFloor.test.ts` |
| 5.1s | app | `src/features/lesson/data/grammarReviewPools.test.ts` |
| 4.8s | app | `src/features/lesson/data/dynamicReviewPrefix.test.ts` |
| 4.6s | app | `src/features/lesson/data/switchoverBeatIntegration.test.ts` |
| 4.4s | app | `src/features/practice/particles/mineParticlePairs.test.ts` |

**`src/test/proceduralQa.test.ts` alone is ~83s — essentially the entire
measured wall-clock of the full suite (83–86s).** It shells out twice via
`execFileSync` to `scripts/qa/procedural/run.mjs` — an enforced-ratchet pass
over all 46 JA modules the file's own header documents at "~19-22s" and a
separate informational pass at "~34s" (≈56s combined by its own accounting;
83s measured here, the gap consistent with the concurrent-load confound
above). This file is owned by the procedural-QA lane
(`src/test/proceduralQa.test.ts`, not under this lane's file list) — **not
edited here** — but it is the single largest lever on preflight wall time by
a wide margin, and no pool/worker/isolate config change can beat a
single-file, ~83s serial critical path. **Flagged to the lead:** splitting
the two `it()` blocks' subprocess calls to run concurrently (`Promise.all`
over `execFileSync` replaced with `execFile`+await, or `test.concurrent`)
would very likely cut this file to ~34s (the longer of the two), which is
worth roughly as much as everything else in this doc combined. Out of scope
for this lane (file ownership).

## 2. Tuning experiments — what was tried, and why nothing was changed

| Change | Before (median/representative) | After | Δ | Meets ≥10%? | Applied? |
|---|---:|---:|---:|---|---|
| `--pool=threads` (vs default `forks`) | 83.31s | 78.4s, then 96.2s on an immediate repeat | −6% / +15% (contradictory) | No — noise exceeds signal | **No** |
| `--maxWorkers=17` (vs default) | 83.31s | 66.2s, then 99.2s on an immediate repeat | −21% / +19% (contradictory) | No — noise exceeds signal | **No** |
| `isolate:false` on the `app` project | — | — | — | Gated on clean order-dependence evidence; not obtained (§3) | **No** |
| `deps.optimizer` | — | — | — | Vitest 4 config reviewed; no realistic win identified for this suite's dep shape (mostly first-party TS, not large pre-bundled vendor chunks in the test path) | **No** |
| `cache` | — | — | — | **N/A** — Vitest 3+ removed the `test.cache` config key; module transform caching is Vite's own automatic dep cache with no manual toggle to tune | **No** |

Every one of the first two rows was re-run once, back to back, with no
config change between runs, and produced a >15-percentage-point swing in
opposite directions. That is strictly larger than the 10% bar this lane is
required to clear before touching `vite.config.ts`, and it is fully
explained by the concurrent-lane load disclosed at the top of this doc (the
`app` project alone went from 72.0s clean to 66–99s under contention in the
same session). **Decision: `vite.config.ts`'s `test` block is unchanged.**
Re-measuring on an idle machine is the correct next step before revisiting
this — the numbers here rule out claiming a win, they do not rule out one
existing.

The existing `isolate:false` on `curriculum` (2026-08-20, documented in
`vite.config.ts`) was NOT touched or re-litigated; it already carries its
own measured justification in the config's own comment (22s → 8.7s,
284 → 103 CPU-seconds) and is out of scope for re-verification here.

## 3. Order-dependence hunt (`app` project)

Per the brief: grep the ledgers/CLAUDE.md for "order-dependent" (found only
the FR glob-order race, already class-fixed via `src/test/frEntryGuard.ts`
and confined to the `curriculum`/`curriculum-render` projects — not `app`),
then empirically run `app` with `--sequence.shuffle` twice.

| Run | Failures |
|---|---|
| `--sequence.shuffle` #1 | 6 files / 16 tests: `StoryLibraryPage.test.tsx`, `FriendsSection.test.tsx` (×2), `SyncManagerTrigger.test.tsx` (×3), `GrammarRuleStepView.test.tsx` (×6), `useAppLifecycleSync.test.tsx` (×3), `switchoverBeatIntegration.test.ts` |
| `--sequence.shuffle` #2 | 2 files: `switchoverBeatIntegration.test.ts`, `StoryLibraryPage.test.tsx` |
| Control: default order, no shuffle | 1 file: `buildTileFloor.test.ts` — failing sub-test named `reviewGridsFromFsrs ordering (A8)` |

**Not clean evidence of order-dependence.** `switchoverBeatIntegration.test.ts`
and `buildTileFloor.test.ts` live under `src/features/lesson/data/`,
`StoryLibraryPage.test.tsx` under `src/features/practice/` — exactly the two
directories `git status` showed lane A8 actively modifying
(`buildTileFloor.ts` was mid-edit) during these runs. The control run (no
shuffle at all) still failed, on a file explicitly named after A8's
in-flight work — proof this is concurrent-edit noise, not test-order
sensitivity. `FriendsSection`/`SyncManagerTrigger`/`GrammarRuleStepView`/
`useAppLifecycleSync` failed only once each and never reproduced on the
second shuffle — consistent with real-timer-based tests (`GrammarRuleStepView`
"read gate" timers, `useAppLifecycleSync`'s "30s tick" debounce) flaking
under the same load spikes, not a deterministic ordering bug.

**Decision: `isolate:false` is NOT applied to the `app` project.** The
brief's condition ("IF the order-dependent tests are identified and
quarantined") is not met — no reproducible, load-independent order-dependent
set was found. Applying `isolate:false` on unclear evidence risks repeating
the documented 2026-08-20 regression (global `isolate:false` broke 53
UI/shared tests from happy-dom + module-state leaks between files). This
should be re-run on an idle machine, with no other lane writing to
`src/features/lesson/data/**` or `src/features/practice/**`, before it can
be answered cleanly.

## 4. CI wall time (real runs, `gh run view --json jobs`)

Per-step timings from the two most recent completed `ci.yml` `test`-job runs
(a third listed run had `conclusion: ""` / a 4s span — evidently cancelled
before starting, excluded):

| Run | Conclusion | checkout | setup-node | npm ci | typecheck | **unit tests** | build | Job total |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| 35205109638 | success | 12s | 3s | 22s | 42s | **435s** | 76s | 593s |
| 35265135227 | failure | 13s | 1s | 28s | 44s | **459s** | 0s (skipped) | 609s (to the failing step) |

**`unit tests` is 73–75% of the job.** That clears the brief's bar for
sharding — implemented in `.github/workflows/ci.yml` (task 4, commit
`4319144b`): `typecheck` and `unit-tests` (2-way `--shard` matrix) run in
their own parallel jobs, `build` needs both, `mobile-e2e` needs `build`.
Verified locally before committing: `npx vitest list --shard=1/2` (8,976
tests) + `--shard=2/2` (9,523) sum to exactly the unsharded total (18,499),
so the split is exhaustive and non-overlapping across all three `projects`.

**Not validated against a real CI run** — this lane does not push (see the
shared review brief). The expected wall-time improvement (~593s → roughly
the slower of {typecheck+setup, the larger unit-test shard+setup} + build's
own job ≈ 350–400s, a ~30-35% cut) is a projection from the local
proportion, not a measured sharded run. Flagged inline in the `ci.yml` job
comment for whoever ships it: confirm on the first real run and adjust the
shard count (or revert) if the projection doesn't hold.

## 5. `test:related` (task 3 — lane use, NOT preflight)

Added `"test:related": "vitest run --changed origin/main"` to `package.json`.
**Preflight stays full** (`npm run preflight` is untouched) — this is a
separate script for a lane's own inner loop.

**Proof it selects the right files for a one-file change:** a trivial,
harmless, single-line edit to `src/shared/domain/progressReconcile.ts`
(appended one blank line, reverted immediately after — `git diff` confirmed
clean before and after) was measured with `npx vitest list --changed`
(uncommitted-diff form — same selection mechanism `--changed <ref>` uses,
just against the working tree instead of a ref):

```
src/features/lesson/useProgressReconcile.test.tsx
src/features/sync/SyncManagerTrigger.test.tsx
src/shared/domain/progressReconcile.property.test.ts
src/shared/domain/progressReconcile.test.ts
```

Exactly the four test files that import `progressReconcile.ts` (directly or
via `useProgressReconcile`/`SyncManagerTrigger`) — nothing from the
unrelated `tileFit`/`srsSync`/curriculum trees. The selection mechanism
works.

**Caveat measured separately:** run for real as `npm run test:related`
against `origin/main` (this branch is 8 commits ahead), it selected 454 of
694 test files (14,870 of 18,527 tests) and took 86.2s wall — barely faster
than the full suite, because (a) those 8 commits touch some broadly-imported
files (course atom registration, mock lesson data) that fan out across most
of the curriculum by design, and (b) `proceduralQa.test.ts` (§1) was in the
selected set, so the same ~83s critical path applies regardless of
selection. `test:related` is a real win for a genuinely narrow, leaf-level
change (as demonstrated above) and not a substitute for `preflight` on a
branch that has already touched widely-shared files — which is exactly why
the brief scopes it to lane use, never to preflight.

## 6. Property tests (task 5)

Added `fast-check@4.10.1` + `@fast-check/vitest@0.5.0` (both exact-pinned,
matching this repo's convention for `odiff-bin`/`rollup-plugin-visualizer`).
Three new files, each with a fast-check property suite AND a hardcoded
regression unit test pinning a real, empirically-captured shrunk
counterexample (method: temporarily break the target arithmetic, run the
property, capture the exact counterexample fast-check reports, revert,
`git diff` confirmed clean before/after — or, for the one file this lane
does not own even temporarily, reproduce the broken logic in a throwaway,
never-committed file instead):

| File | Properties | Counterexample method |
|---|---|---|
| `src/features/lesson/components/tiles/tileFit.property.test.ts` | `quantizeScale` never rounds up / idempotent / quantized / monotone; `resolveTileScale` stays in `[floor, ceiling]` and is monotone non-increasing in label width; `computeFillScale` never spends more than the measured px budget | Real edit+revert on `tileFit.ts` (`Math.floor`→`Math.ceil`) — shrank to `x = 1.0000000000000003e-11` in 24 steps |
| `src/shared/domain/progressReconcile.property.test.ts` | `localOnlyLessonIds` == local − server − queued − pending exactly; never returns a server-known id; idempotent | Real edit+revert on `progressReconcile.ts` (dropped `pending` from `covered`) — shrank to `[["m-8"],[],[],["m-8"]]` in 9 steps |
| `src/features/flashcards/engine/srsSync.property.test.ts` | `mergeStates`' LWW winner depends only on `lastReviewedAt`, not local/server role; a local reset always survives a merge against learned server state | `srsSync.ts` is lane A8's file (never edited, even temporarily) — reproduced the merge rule broken (no reset exception) in a throwaway, uncommitted file; failed after 2 cases, shrank 42 steps to `resetMs=0, learnedMs=1` |

All ten new property tests plus the three regression pins pass against the
real, unmodified implementations (`npx vitest run` on the three files: 10 +
3 + 3 = wait — see the actual per-file counts run in §7). `npx tsc -b`
clean.

## 7. Final verification (`regression-classes` + full suite)

`regression-classes` checklist applied before calling this done:

- **C4 (a green check that cannot fail):** every property test in this lane
  has a paired regression test proving it CAN fail — this is the whole
  point of §6's methodology, not an afterthought.
- **C7 (a ratchet raised instead of lowered):** the full-suite test/skip
  counts below are additive-only versus the pre-lane baseline (baseline
  679 files/18,457 tests passed observed at lane start; this lane adds 3
  files / ~16 new test cases, zero removed, zero pre-existing tests
  touched).

Final commands, this config (no `vite.config.ts` changes — see §2), run
2026-09-17 14:11-14:13:

```
$ npx tsc -b
(clean, no output — 13.4s)

$ npx vitest run --reporter=dot
 Test Files  687 passed | 15 skipped (702)
      Tests  18525 passed | 28 skipped (18553)
   Duration  90.60s (transform 63.17s, setup 83.04s, import 461.81s, tests 443.09s, environment 162.56s)
   wall: 91.28s, 0 FAIL
```

Baseline at lane start (before this lane's commits, also before several
concurrent lanes' commits landed): 679 files passed / 15 skipped (694),
18,457–18,458 passed / 28 skipped, observed to fluctuate by ±1 test run-to-run
even with zero config changes (attributed to the same concurrent-edit noise
disclosed at the top of this doc). The +8 files / +67 tests between baseline
and final is this lane's 3 new property-test files (10 property tests + 3
regression pins = 13 new `it`/`test.prop` blocks, but each `test.prop` runs
its predicate ~100 times as ONE reported test) plus other lanes' commits
landing on the shared branch during this session — not a ratchet in the
`regression-classes` C7 sense (that class is about finding/violation counts
going up, not test counts, which only ever grow when tests are added). Skip
count is unchanged (28 both times) — no test was skipped or disabled by this
lane.
