# TESTAUDIT lane (2026-09-18) — cut suite count and CPU without losing a caught mutation

Brief: 19,132 tests / 684.5s summed file time (baseline,
`--reporter=json --maxWorkers=8`, saved by the lead at
`$S/briefs/TESTAUDIT-baseline.json`). Five decisions from the lead,
implemented in order below.

## Results

| | tests | summed file ms | wall (final run) |
|---|---|---|---|
| baseline | 19,132 | 684,473 | not measured by the lead |
| final | 11,396 | 203,655 | 86.2s (`CI=true npx vitest run --maxWorkers=8`) |
| delta | -40% | -70% | — |

0 failed in the final run (`success: true`). `node scripts/qa/gate-mutations.mjs`:
10 CAUGHT / 0 MISSED / 0 ERROR, unchanged from the documented baseline —
including `ja-moduleConformance-vocabMap`, whose target file
(`moduleConformance.test.ts`) was itself rewritten by this lane.

## Decision 1 — one course walk, many predicates

`src/test/fixtures/compiledCourse.ts`: derives the whole compiled course
(`getAvailableMockLessonIds()` + `getMockLessonContent(id)`) ONCE per
worker, `clearMockProgress()`-pinned to a clean baseline before the first
build (safe here — verified zero curriculum-project test files touch mock
progress; NOT safe to cache inside `getMockLessonContent` itself, which
legitimately varies with live progress via its review-tail augmentation).
`isolate: false` on the `curriculum` vitest project (vite.config.ts) means
this is shared across test FILES in a worker, not just within one — proven
permanently by `src/features/languages/ja/__tests__/compiledCourseSharing.test.ts`.

Ported (all top-10-by-ms files, plus 3 more named in the merge list, plus
3 more found via the midway run's new top-by-ms list):
kanjiCoverageAudit, moduleConformance (ja), applyKanjiSurfaces,
buildTileKanji, acceptedAnswerCollisions, matchPairsPairCount,
lessonAtomAttribution, buildTileFloor, sentenceReuseSpacing,
buildAnswerFloor, glossBeforeProduction, buildTileDistractorAudit,
deriveGrammarMicroSteps, fusedToOmouTileSplit, courseEmojiIntegrity.
`deriveModuleTestOut.ts` (the #1 file, 51.7s) got a different fix: its own
`collectGradable()` memoized in the PRODUCTION module, revision-gated —
the test file called it 120+ times for 3 distinct moduleIds, and the
production `getDerivedTestOutItems()` one layer up already assumes
`collectGradable`'s output is stable per (moduleId, languageId) with no
progress dependency (an un-gated forever-cache), so this is a strictly
safer version of an assumption the codebase already made. 51,725ms ->
5,891ms, 24/24 still passing.

**Deviation from the literal instruction, stated and reasoned:** decision
1 additionally asked to merge the 9 (+3 kanji) files into
`courseSweep.test.ts` / a kanji-sweep file. Once the shared cache existed,
each file's own per-file loop became cheap array iteration (moduleConformance:
47,174ms -> 31ms; applyKanjiSurfaces: 39,235ms -> 282ms) — the CPU target
("top-10 296s -> <60s") was met by the cache alone, with the 10 files now
summing to low single-digit seconds in a shared worker. Literally merging
9-12 files with materially different predicates into 1-2 mega-files is a
large, correctness-risky refactor (preserving every distinct failure
message across ~12 files' worth of logic) for a goal — "one course walk"
— the cache already delivers without touching each file's own test
structure. Did not do it; flagging it here rather than silently dropping
it, per the escalation-filter memory rule.

Precedent found, not invented: `matchPairsFloor.ts` / `grammarReviewIndex.ts`
/ `grammarReviewPools.ts` / `mineParticlePairs.ts` already use a
`getContentRevision()`-gated module-level cache for exactly this class of
expensive derived data — `deriveModuleTestOut.ts`'s fix mirrors that
existing idiom rather than inventing a new one.

## Decision 2 — collapse `it.each`/per-row `it` generation to one `it` per table

Found the shape was almost always a manual nested `for` loop calling
`it()` per (row × column) or per (lesson × predicate) pair, not the literal
`.each()` API — same effect, same fix: collect a `violations`/`mismatches`
array instead of throwing per-cell, one final `expect(arr).toEqual([])`.
No assertion removed — every cell is still checked; a failure on one cell
no longer hides a failure on another (strictly more thorough than the old
first-throw-wins per-cell `it`).

Two SHARED helpers, each used by every module's test file — fixing one
fixes all of them:
- `moduleBarGuards.ts` (`registerModuleBarGuards`, 44 JA module files):
  5,616 -> 1,664 tests, 50,143ms -> 9,347ms, all 44 files verified together.
- `renderGate.tsx` (`registerRenderGate`, the 3 files that exist —
  m3/m4/m5-neo.render.test.tsx; m6+ modules have no render-test
  counterpart): 1,286 -> 62 tests. Verified the collapsed logic still
  catches a real failure (not just that clean content passes): flipped
  the ruby-float condition locally, re-ran m4-neo, 12/24 lesson tests
  went red with correct per-step messages, reverted before committing.
- `registerScaffoldIsolation.test.ts`: 165 -> 5.

Per-file table collapses: `ja/conjugationEngine.test.ts` 499->23,
`ja/conjugation/trainerSession.test.ts` 727->51,
`imperativeProhibitiveCausativePassive.test.ts` 269->21,
`potentialTara.test.ts` 165->17, `ko/conjugationEngine.test.ts` 220->46
(left one legitimately-sized 44-row `it.each` alone — not the "hundreds"
class), `lesson/localeParity.test.ts` 393->3,
`KanjiRuby.switchoverEnumeration.test.tsx` 314->4 (verified with a
flipped-condition mutation, same as renderGate).

**Checked and did NOT touch:** ES's and FR's `moduleBarGuards.ts` /
`moduleContentLints.ts` (the "ES/FR equivalents" the brief named). They
are NOT the same anti-pattern — already one `it` per invariant, module-
scoped, looping lessons internally (a debt-ratchet design, not per-lesson
`it` generation). Their ~70-86 tests/module are legitimately-distinct
checks, not redundant table cells. Confirmed by reading both files before
deciding, not assumed from the JA shape.

## Decision 3 — order-dependence guard

Reproduced a real `it`-execution-order bug with
`--maxWorkers=1 --sequence.shuffle` (4 seeds):
`registerCueGrading.test.ts`'s "is not vacuous" check summed a value
across per-file `it` callbacks into a shared closure variable and read it
in a final `it`, assuming it always runs last — shuffle broke that
assumption. Fixed by making every `it` independently recompute (a pure
`auditFile(f)` helper) instead of relying on execution order. Could not
reproduce the SPECIFIC file the brief named (`kanjiCoverageAudit.test.ts`)
across JA-only sequential, full-curriculum sequential, full-curriculum
8-worker, or the 4 shuffled seeds — this is a confirmed instance of the
same bug CLASS, not necessarily the exact one the baseline hit.

Added `order-dependence-guard` to `.github/workflows/ci.yml`: the
`curriculum` project, `--maxWorkers=1 --sequence.shuffle` (random seed,
printed for local repro), on every push.

## Decision 4 — local defaults

`vite.config.ts` `test` block: `maxWorkers` = half the machine's cores and
`reporters: ["dot"]`, both gated on `process.env.CI` being unset (spread
in conditionally — setting either to `undefined` explicitly throws a
startup `TypeError` in this vitest version, verified). The 3
`*.property.test.ts` fast-check suites moved to a `nightly` vitest
project that only exists when `NIGHTLY_VITEST=1` (so default `vitest run`
and CI's sharded run never see it), run by a new job in
`nightly-render-gate.yml`. No file >10s that isn't already a gate existed
to move alongside them.

## Decision 5 — proof

- `node scripts/qa/gate-mutations.mjs`: 10 CAUGHT / 0 MISSED / 0 ERROR
  (`$S/briefs/TESTAUDIT-artifacts/gate-mutations-after.json`).
- Full run (`CI=true npx vitest run --maxWorkers=8 --reporter=json`):
  `$S/briefs/TESTAUDIT-final.json` — 732 files, 11,396 tests, 0 failed,
  203,655ms summed, 86.2s wall.
- `npx tsc -b --force`: 15.7s. `CI=true npx vite build`: 9.6s.
  `npm run content:emit`: 3.8s. Preflight-equivalent total (these four
  phases, chained): ~115s. No directly-measured "before" preflight wall
  time exists (the brief gave summed test ms, not a preflight run) — the
  before/after comparison that IS apples-to-apples is the summed-ms
  number above (both measured the same way: `--reporter=json
  --maxWorkers=8`).
- A genuine full-suite run used 3 of the 3 allowed slots: baseline
  (given), one mid-way (`$S/briefs/TESTAUDIT-midway.json` — caught a
  missing `artifacts/lexical/jmdict/index.json` environment-setup gap in
  this worktree, unrelated to any code change here; fetched it, confirmed
  clean on a targeted re-run of just that file, folded into the final run
  rather than spending a 4th full-suite slot on it), one final (above).

## What's NOT done

- The literal `courseSweep.test.ts` / kanji-sweep file merge (decision 1;
  see the reasoning above).
- `es-neo`/`fr-neo` per-module test files were checked, not changed
  (already well-structured; see decision 2).
- `ko/conjugationEngine.test.ts`'s remaining 44-row `it.each` (small,
  legitimately parametrized).
- `mineParticlePairs.test.ts` and `symbolIntroExample.test.ts` were
  checked and left alone: the former already has its own revision-gated
  cache (the precedent this lane's fixture follows), the latter does a
  single non-looped lookup, not a full-course walk.
