# Learning loop — FSRS reads outside the flashcard surface (A8, 2026-09-17)

Project review lane A8. Research correction from the learning-science lane:
FSRS-6 already schedules the flashcard surface (`ts-fsrs`,
`src/features/flashcards/engine/srs.ts`, `reviewQueue.ts`), but the claim that
"the in-lesson review grids and practice padding never read the FSRS store"
turned out to be **only partly true** — see §1. This doc is the task-1 table,
the instrumentation this lane shipped, the flag semantics, and the A/B design
for deciding whether to turn the flag on. Everything here is OFF by default;
the next TestFlight build's behavior is unchanged unless someone flips
`experimental.reviewGridsFromFsrs` in `src/pub/feature-flags.json`.

Read first: `docs/srs-scheduling-model-2026-06-15.md` (the SRS model, D1-D8,
the seven write surfaces), CLAUDE.md's SRS invariants section, and
`docs/project-review-2026-09-17.md` §1/§2.

---

## 1. The read/write boundary — corrected, with evidence

Every row below reflects **code actually read on 2026-09-17**, not the
pre-review assumption. "Reads FSRS?" means the file calls `getSRSStore()` /
`isDue()` / a stored `SRSCardState` — a genuine read, not just a comment
claiming one. "Violates an invariant to add a read?" is always **no** in this
table, for the same structural reason: every candidate pool listed here is
already comprehensibility-gated (intro-before-review enforced) **before**
selection/ranking runs, so a read added at the ranking step can only reorder
already-legal candidates — see §3's permutation contract for how this lane
keeps that true by construction rather than by convention.

| # | Surface | File:line | Selection heuristic (one sentence) | Reads FSRS today? | Gap? |
|---|---|---|---|---|---|
| 1a | Review-tail steps in content lessons — **kana** | `kanaReviewTails.ts` (`priorKanaPool`/`priorKatakanaPool`), `buildReviewTailSteps.ts:187` (`rankByStruggle`) | Seeded shuffle over every kana/katakana taught in strictly-earlier rows; a separate non-FSRS "struggle store" (`symbolMastery`) biases ranking toward recently-missed glyphs. | **No.** | **None — by design.** Kana glyphs are explicitly not SRS-eligible (CLAUDE.md: "kana has no SRS," ages out ~M3). Adding an FSRS read here would be adding a read for state that doesn't exist. |
| 1b | Review-tail steps in content lessons — **vocab** | `mockLessons.ts:709-718` (`augmentWithReviewTail`) | N/A — per `docs/srs-scheduling-model-2026-06-15.md` D2's "ralph" revision, this function is **kana-only** (bails unless the lesson's `rowId` is a real hiragana row). No vocab prior-atom review tail exists yet. | N/A | **Real, but not actionable by ranking.** The generator itself doesn't exist. Building one is content-generation work (SRS doc's open D2 item), out of this lane's scope (`FILES YOU OWN` is additive/selection code, not new content generators, and CLAUDE.md bars inline bulk authoring). |
| 2 | Module-end review lessons — **vocab review portion** | `dynamicReviewPrefix.ts` (whole file) + `buildSrsReviewLesson.ts:198-330` (`scanReviewCandidates`, `selectReviewHalves`) | Half FSRS-due (`isDue`, `getDueModalities`), half recent (RULE 3), inserted as a dynamic prefix on `ja-mN-neo-review-*` at content-load time. | **Yes — shipped.** B069 phase 1, RULE 3 landed 2026-09-15 (same day as the research pass this corrects). | **None.** This is exactly what the research lane recommended; it's already live. |
| 3 | Module-end review lessons — **grammar point rotation** | `grammarReviewPools.ts:290` (`pickPoolStep`), mirrored in `useGrammarReviewSession.ts:131` (`pickFiltered`) | `pool[(recognition.reps + production.reps) % pool.length]` — reads ONE point's own `SRSCardState` to rotate through its authored example-step pool. WHICH points are due is decided upstream by `buildGrammarReviewQueue` (`grammarSrs.ts`, a write surface — out of scope). | **Yes, but only rep-count rotation, not due-ness ranking**, and only within one already-selected point. | **Minor.** Nothing to rank — this function picks a step VARIANT for a point already chosen due. Not a candidate-atom selection in the sense this task means. |
| 4 | Practice padding — **match-pairs floor fill** (meaning/romaji) | `matchPairsFloor.ts:247` (`weaknessScore`) + `:445-518` (`buildMeaningFill`, JA) + its ES twin `buildEsMeaningFill` | Window-or-due first (RULE 3), then `weaknessScore` = `overdueDays×10 + 100/stability + difficulty` (weakest first), then corpus-rarity tiebreak, over a seeded shuffle. | **Yes — shipped.** RULE 3, 2026-09-15. | **None.** Already the exact "most overdue, then lowest stability"-style ranking this task asked for, for this one pool. |
| 5 | Practice padding — **build-tile distractor fill** | `buildTileFloor.ts:183` (`pickFillTiles`) | Sibling/particle-contrast-first (Spencer's explicit pedagogy ruling, 2026-07-24), then a seeded shuffle over the prior-taught pool, family-collision-guarded. | **No, until this lane.** | **Real gap — this lane's wiring target (§3).** Distractors are foils, not review targets, so FSRS-ranking them is about incidental exposure (seeing a due word again, even as a wrong answer), not retrieval credit — pedagogically weaker than #4's case, which is why it only re-ranks the NON-sibling-preferred tier and never overrides the sibling-first rule. |
| 6 | Module compiler — **authored review-pool → match_pairs assembly** (the module-end lesson's own review grid, distinct from #4's floor-pad fill on a SHORT grid) | `moduleCompiler.ts` ~1730-1790 (`recentMatchable`, `rankedFallback`) | Six-module recency window (RULE 3) first, then registry order as the tiebreak (`emojiPool.filter(usableHere)` sorted `recentOnly` window-first). | **No.** | **Real gap — NOT wired by this lane.** See §2's "why not moduleCompiler.ts." |
| 7 | Module compiler — **filler MCQ/speaking pool** | `moduleCompiler.ts` ~1859-1900 (`modulePool`/`fullPool`, `reviewFiller`) | Six-module recency window (RULE 3) preferred, whole-course fallback; picked by `pickAtom`'s `source[(i+k) % source.length]` index rotation. | **No.** | **Real, biggest gap by volume — NOT wired by this lane.** Same reason as #6. |
| 8 | Practice engine — **free-practice reinforcement content** | `src/features/practice/engine/learnedContent.ts` (`weightOf`, ~L60-125) | `weightOf` = base 1, `+3` if due (`isDue`), scaled by tier/difficulty, mastered-and-not-due atoms weighted down. | **Yes — shipped**, predates this lane. | **None.** |
| 9 | Placement / test-out padding | `src/features/placement/engine/*.ts` (`deriveModuleTestOut.ts`, `applyPlacement.ts`) | No FSRS-aware padding pass found. `applyPlacement.ts` is itself write surface #7 (test-out seed) — out of scope to touch. | No (and the write surface is off-limits). | **Not applicable as "padding."** Test-out determines PLACEMENT (which modules to skip), it doesn't pad review content from a candidate pool the way #4-#7 do. No actionable gap in this lane's sense. |
| 10 | MCQ distractor pools (image-debut foils, filler MCQ options) | `moduleCompiler.ts` (`imageFoilPool` and friends) | Seeded/registry order, comprehensibility-gated (`usableHere`). | No. | Same category as #5 (foils, not review targets) — lower priority than #6/#7, not touched. |

**Net correction:** two of the four locations named in this task's framing
(module-end review lessons' vocab portion, and one whole pad-pass —
match-pairs floor fill) already do exactly what was asked for, shipped the
same day as the research pass. The real, unaddressed gap is entirely inside
`moduleCompiler.ts` (#6, #7) — see §2 for why this lane didn't touch it.

---

## 2. Why `moduleCompiler.ts` (#6, #7) is not wired, even behind the flag

`compileModule(ir: ModuleIR): LessonContent[]` (`moduleCompiler.ts:924`) is
called **eagerly, at module-import time**, in every `mN-neo.ts` curriculum
file:

```ts
const COMPILED: LessonContent[] = compileModule(m32Ir as unknown as ModuleIR);
```

This runs during module linking/parsing, before `main.tsx` mounts
`FeatureFlagsProvider`, before any `fetch("/feature-flags.json")` could
possibly have resolved, and — critically — **once**, not per learner session:
the result is a plain array baked into that JS chunk. There is no
synchronous, live, per-request hook here to read a flag or the FSRS store
against; the earliest a flag COULD be read is after the chunk has already
finished evaluating. Wiring the flag in here would be dead code, not a
gated feature — worse, it would read as "wired" in the diff while being
structurally unreachable, which is a bigger foot-gun than not wiring it at
all.

`getMockLessonContent()` (`mockLessons.ts:232`), by contrast, runs **live**,
once per lesson VIEW (`LessonPage`'s `useMemo(() => getMockLessonContent(id),
[id])`), reading `getSRSStore()` fresh each call — this is where
`withDynamicReviewPrefix` (#2) and `padMatchPairsFloor`'s weakness ranking
(#4) already run, and where this lane's own wiring (§3) runs. That is the
only stage in the whole pipeline with a genuine "per-serve" hook.

**If #6/#7 are ever worth doing:** the fix is architectural, not a flag —
either move the recency/weakness ranking into a **post-pass over the
already-compiled, already-registered lesson** (the same shape `getMockLessonContent`'s
pads already use, i.e. add an eighth post-pass there that reorders an
existing `match_pairs`/filler step's candidate list in place), or make
`compileModule` lazy (compute once per session on first real access, keyed
by a live flag read) — both are real refactors, not additive work, and
neither shipped in this lane. Quantified: `compileModule` has 45+ call
sites (one per `mN-neo.ts`) plus 12 direct test call sites; a signature
change is mechanically easy but the EAGER-EXECUTION problem is not solved by
adding a parameter.

---

## 3. What this lane actually shipped

### 3a. Always-on instrumentation (no flag)

`src/features/lesson/data/reviewGridTelemetry.ts` — `recordReviewStepsServed(lesson)`,
called from `getMockLessonContent()` right before it returns, for both the
content-lesson and dedicated-review-lesson branches. No-ops outside the
browser (`typeof window === "undefined"` — SSR / `content:emit` / Node test
runs), which is also what keeps it from touching `content:emit`'s output:
the function returns nothing and never mutates the `lesson` it's given.

For every step where `_stepPredicates.shouldWriteSrs(step)` is true (the
**exact** predicate the real grading pipeline uses to decide "does completing
this step write an FSRS card" — so "served" here means "graded review
material," not every step in the lesson), it logs one
`review_grid_served` event via `src/shared/telemetry/sessionLog.ts`:

```ts
type ReviewGridServedPayload = {
  lessonId: string;
  stepIndex: number;
  servedAtomIds: number;   // atoms THIS step exercises
  dueAtomIds: number;      // size of the whole FSRS due-set at record time
  overlap: number;         // of servedAtomIds, how many were also due
  notDueServed: number;    // servedAtomIds - overlap
  dueNotServed: number;    // dueAtomIds - overlap (for this step's row)
};
```

Counts only — no atom ids, no text. `dueAtomIds` is a **fixed per-lesson-load
denominator** (the whole store's due-set size at the moment the lesson was
compiled), repeated on every row from that load — it is NOT a per-step
candidate-pool size, because compiled steps don't carry the pool they were
drawn from. This is the limitation behind Spencer's own framing ("of N due
atoms, the grids served M"): M is a SUM across rows (`totalOverlap`), which
double-counts an atom if two different steps in the same lesson both happen
to exercise it. Treat the dev-panel numbers as a rough signal, not an exact
unique-atom count — sessionLog's 500-event cap also means a long QA walk
across many lessons will eventually evict early rows.

### Reading the summary

`src/shared/telemetry/sessionLog.ts` exports `summarizeReviewGridEvents()`
(cached/stable reference for `useSyncExternalStore`, invalidated on every new
event) and a dev-only panel, `src/features/sync/ReviewGridTelemetryPanel.tsx`,
mounted in the Sync panel (`SyncManagerTrigger.tsx`, alongside the existing
`#174`/`#176a` diagnostics). It shows, live, while walking lessons:

- **N graded steps across M lessons** — `stepsServed` / `lessonsSeen`.
- **"X of Y served atom-slots were due (Z%)"** — `totalOverlap` /
  `totalAtomSlotsServed` / `overlapRate`. This is the headline number: **of
  what the review grids actually served, what fraction was FSRS-due at the
  time.** Low and flat across a long walk = the heuristic pools are drawing
  mostly non-due material; that's the signal that would justify turning the
  flag on.
- **"Due atoms as of last step: N"** — `latestDueAtomCount`, a snapshot, not
  a running total.

The panel renders nothing (`stepsServed === 0`) until at least one graded
step has been served in the current tab session. Clearing the session log
(`clearSessionLog()`) resets it.

### 3b. `reviewGridsFromFsrs` — FSRS-fed selection, pure + tested, OFF by default

Feature flag: `src/shared/config/featureFlags.ts` →
`FeatureFlags.experimental.reviewGridsFromFsrs` (default `false` in both
`DEFAULT_FEATURE_FLAGS` and `src/pub/feature-flags.json`). Because the flag
mechanism is an async `fetch("/feature-flags.json")`
(`fetchFeatureFlags()`), and `getMockLessonContent` must stay synchronous,
`featureFlags.ts` now also exports a **synchronous cache**,
`getCachedFeatureFlags()` — updated as a side effect every time
`fetchFeatureFlags()` resolves (success OR failure; a failed fetch resolves
to the code defaults, same fail-safe direction as the flag file). A caller
that runs before the first fetch resolves (the very first lesson compiled on
a cold boot) reads the defaults — `false` — same as the flag file's own
fail-closed direction. This is a real, documented race, not a bug: an
experimental flag defaulting off racing to "still off for a few hundred ms"
is harmless.

**The ranking primitive** — `src/features/flashcards/engine/dueRanking.ts`
(read-only; no write-surface calls) — `sortIdsByDueness(ids, store, todayMs)`:
stateful ids before stateless, due before not-due, most-overdue-first, then
lowest-stability-first, ties stable. Mirrors `matchPairsFloor.ts`'s shipped
`weaknessScore` formula's two axes, kept separate rather than pre-blended so
"most overdue, then lowest stability" (this task's literal wording) is
exactly what the sort does.

**The selector contract** —
`src/features/lesson/data/reviewGridFsrsSelection.ts` →
`selectReviewCandidatesByFsrs(candidates, opts)`:

- **Pure permutation.** Never adds or drops an id — only reorders
  `candidates`. Every real caller in this codebase already builds its
  candidate pool by filtering through a comprehensibility gate FIRST
  (`moduleCompiler.ts`'s `fullPool = declaredPool.filter(usableHere)`,
  `matchPairsFloor.ts`'s `taughtBefore`-filtered `prior`, this lane's own
  `buildTileFloor.ts` pool) — so a function that can only permute an
  already-gated list cannot surface a never-introduced atom, structurally,
  not by convention. `reviewGridFsrsSelection.test.ts`'s gate test proves
  this directly: an atom marked maximally overdue in the fake store, but
  absent from `candidates`, never appears in the output.
- **Coverage fallback.** Below `minCoverage` (default 50%) of candidates
  carrying stored FSRS state, returns the untouched heuristic order — a new
  user / SSR / fresh install with a near-empty store gets the exact
  pre-flag behavior, not ranking noise.
- **Disabled → identity.** `{enabled: false}` (or omitted) returns
  `[...candidates]`, unchanged order.

**Wired into:** `buildTileFloor.ts`'s `pickFillTiles` — the ONE real, live
(non-eager) selection pass this lane found that was both (a) genuinely
uninstrumented (§1 row 5) and (b) reachable at serve time (§2). Re-ranks
**only** the non-sibling-preferred tier of distractor candidates; the
sibling-first tier (Spencer's 2026-07-24 pedagogy ruling — "work the right
muscle") is never touched by this flag. Threaded via
`GetLessonContentOptions.reviewGridsFromFsrs` (defaults to
`getCachedFeatureFlags().experimental.reviewGridsFromFsrs`) →
`padFloors()` → `padBuildTileFloor(lesson, fsrsOrdering)` →
`pickFillTiles(..., fsrsOrdering)`.

**Byte-identical-when-off, by construction:** every new parameter on this
path is optional and defaults to a value that reproduces the old call
shape exactly (`fsrsOrdering?.enabled` guards the one line that changes
behavior; the disabled branch is the literal pre-existing expression). This
was also verified empirically — see the verification section of the lane's
report (content:emit diff empty).

**Tests:**
`src/features/flashcards/engine/dueRanking.test.ts` (ranking primitive),
`src/features/lesson/data/reviewGridFsrsSelection.test.ts` (the contract:
overdue-first with a fake store, empty-store identity, coverage fallback,
the never-introduced-atom gate test), `src/features/lesson/data/buildTileFloor.test.ts`'s
new `reviewGridsFromFsrs ordering (A8)` block (wiring: omitted ≡ `{enabled:false}`,
empty store ≡ disabled, and a real m5 course atom gets promoted into the
picks when marked severely overdue).

### 3c. `firstExposureBlockedWarmup` — DESIGN ONLY, not wired

Flag exists (`experimental.firstExposureBlockedWarmup`, default `false`) so
the name and semantics are reserved and documented, but there is **no clean
hook** to implement it against without touching a listed SRS write surface:
the natural home for "hold a grammar point's first 3 reps same-type before
interleaving resumes" (Hwang 2025's blocked-floor condition) is the grammar
review SESSION's queue/step ordering — `useGrammarReviewSession.ts` /
`buildGrammarReviewQueue` (`grammarSrs.ts`) — and CLAUDE.md names "the
grammar review session" as SRS write surface #5 explicitly, out of this
lane's `DO NOT TOUCH`. Restructuring the flashcard reviewer's queue assembly
to interleave-with-a-blocked-floor is a real design change to that surface,
not an additive read, so per this lane's brief ("otherwise write the design
in the doc and skip — do not restructure lesson assembly for it") it is
documented here and not implemented:

**Design (not built):** `buildGrammarReviewQueue` would need an
`exposureCount` per point (currently it has `state.recognition.reps +
production.reps`, which already IS the exposure count — the "first 3 reps"
gate is `reps < 3`). The session's queue assembly (`useGrammarReviewSession.ts:150-165`)
currently interleaves ACROSS due points; the blocked-warm-up would need to
group up to 3 consecutive queue slots by point when `reps < 3` for that
point, before falling back to the existing interleaved order. This is a
session-ordering change (what the write surface presents next), which is
why it needs the surface owner's sign-off, not an additive flag.

---

## 4. The A/B design (if `reviewGridsFromFsrs` is ever turned on)

**Question:** does ranking build-tile distractor candidates by FSRS due-ness
measurably improve 1-week-later recall, or is the existing recency-window
heuristic (RULE 3, already shipped for 2 of 4 pools — §1) already capturing
most of the benefit?

- **Metric:** 1-week-later accuracy on atoms that were served AS DISTRACTORS
  (not answer tiles) in a build-tile step, measured via the next scheduled
  FSRS review of that atom (`reviewCard`'s grade) that lands ≥6 and ≤8 days
  after the serve. This isolates "did incidental exposure as a foil help,"
  which is the only thing this flag can plausibly move — it never touches
  answer tiles or grading.
- **Arms:** flag off (control, current heuristic) vs. flag on
  (`reviewGridsFromFsrs: true`), same-user split via a stable hash of
  `userId` (or device id pre-login) so a learner stays in one arm for the
  study's duration.
- **Minimum users:** the overlap-rate the dev panel reports (§3a) is the
  cheap pre-check — if a QA walk across a normal lesson sequence shows
  `overlapRate` already high without the flag (i.e. the heuristic pools
  already draw mostly-due material), the A/B is not worth running. If it's
  low, a standard power calculation for a ~5pp accuracy-delta detection at
  80% power, 0.05 alpha, on a roughly-binary correct/incorrect outcome
  needs on the order of 800-1,200 distractor-exposure events PER ARM
  (rule-of-thumb for a 5pp delta on a ~70% baseline) — at JA's ~20-37 new
  atoms/module (§"numbers," `docs/srs-scheduling-model-2026-06-15.md` §3)
  and every build-tile step contributing 2-3 distractor slots, that's on
  the order of a few hundred active learners over 1-2 weeks, not thousands.
  This is an estimate to size the ask, not a committed number — recompute
  once the pre-check's overlap-rate is known.
- **Duration:** minimum 8 days (1 week + slack for the review to actually
  land) from a cohort's first exposure under the flag; a decision-quality
  read wants 2-3 weeks so the distribution of "who was due when" evens out
  across both arms.
- **Decision rule:** ship (flip the flag's default) only if the flagged arm
  shows a statistically significant accuracy improvement on the metric
  above AND the dev-panel `overlapRate` pre-check showed real headroom
  (heuristic pools were NOT already mostly-due). If the pre-check shows the
  heuristic already at high overlap, **Spencer's rule applies: it is fine to
  conclude this isn't worth turning on**, and the honest place to stop is
  after §3a's instrumentation, not after building an A/B nobody needs.

### Numbers we have today (denominators for "M of N due")

- **JA:** 46 modules live (`docs/project-review-2026-09-17.md` §1); ~20-37
  new atoms per module, 518 atoms total across ~26 modules as of the SRS
  model doc's count (`docs/srs-scheduling-model-2026-06-15.md` §3) — the JA
  course has grown since (46 modules now vs. ~26 when that count was taken),
  so treat 518 as a floor, not current; re-count via
  `JA_COURSE_ATOMS.length` before citing a current total.
- **Review slots per lesson:** lesson density targets **18-24 steps**
  (`moduleCompiler.ts` density pass), with a fixed head (rule card(s) +
  transform ramp + capstone + 1) and the rest filled/interleaved; the filler
  while-loop tops up to 18 (capped at 60 attempts) and trims back if it
  overshoots 24. A module-end review lesson's dynamic prefix caps at **10**
  steps (`DYNAMIC_REVIEW_PREFIX_CAP`, `dynamicReviewPrefix.ts`). A
  match-pairs review grid floor is **6 pairs** (5 on phone-height stages —
  `MATCH_PAIRS_FLOOR`, `matchPairsFloor.ts:63`). A build-tile step's
  distractor floor is **2-3** depending on answer length
  (`minDistractorsFor`, `buildTileFloor.ts:93`).

---

## Changelog

- 2026-09-17 (A8): created. Task-1 table with the shipped-already correction
  (rows 2 and 4); always-on instrumentation (`reviewGridTelemetry.ts`,
  `sessionLog.ts`'s `review_grid_served` event + summary + dev panel);
  `reviewGridsFromFsrs` flag, pure ranking (`dueRanking.ts`,
  `reviewGridFsrsSelection.ts`), wired into `buildTileFloor.ts` only (§2 for
  why not `moduleCompiler.ts`); `firstExposureBlockedWarmup` flag reserved,
  design-only (§3c); doctrine paragraph added to CLAUDE.md's
  "Deduction-first" bullet.
