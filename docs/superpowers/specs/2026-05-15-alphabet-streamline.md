# Alphabet Streamline — sub-lessons + row tests + struggle-weighted review

Status: spec ready, agent-executable after user sign-off.

User directives (this session):
- Each row breaks into smaller sub-lessons with more practice depth.
- 5-kana row → 3 sub-lessons + 1 test (2+2+1). 3-kana row → 2 + 1.
  6-kana yōon → 3 + 1 test. 8-kana row → 4 + 1 test.
- Module pill shows `XX%` instead of "N of M".
- Test threshold: 70% to pass. Encouraged but skippable.
- Failed items move to the back half of the same test attempt and
  re-cycle until passed or user exits. Test re-run does NOT count
  toward progress credit — it's just continued queue.
- Each subsequent sub-lesson carries forward struggle-weighted review
  items from prior sub-lessons in the same row.
- Visually cluster the 4 (or 3) row beats as one phase in the snake.
- Pre-FSRS "struggle score" tracked in localStorage; replaced by
  FSRS stability when Phase 2a lands.

Cross-language: applies to KO/JA/ZH alphabets and any future ones.
This spec uses JA hiragana as the worked example; same structure
generalizes via the existing `RowDef` catalog pattern.

---

## TL;DR

1. Curriculum data: every RowDef in `hiraganaCurriculum.ts` (and
   parallel Korean/Chinese alphabet catalogs) gets a `subLessons:
   SubLessonDef[]` array. Sub-lessons are emitted as separate
   `Lesson` objects through a new `buildRowSubLessons` helper.
2. Each row emits N sub-lesson lessons + 1 row-test lesson.
3. `lessonBuilder.ts` adds a `buildRowTestStep` step type (reuses
   `MultipleChoiceStep`, `MatchPairsStep`, `BuildSentenceStep` with a
   `testQueue` shape that supports requeue-on-miss).
4. New `KanaStruggleStore` (localStorage) tracks per-kana failure
   signals; carry-over picker reads it.
5. `ModulePathway` learns to render **row clusters** — a thin inline
   divider above each group of 3–5 nodes, smaller node diameter
   within clusters, wider vertical gap between clusters.
6. Module status pill becomes `XX%` (math: `lessonsDone / totalLessons`).

---

## Data model

### `SubLessonDef`

```ts
export type SubLessonDef = {
  /** Stable id suffix appended to the row id: `${row.id}-${suffix}`. */
  suffix: string;             // "1" | "2" | "3" | "test"
  /** Display label under the node. */
  label: string;              // "Intro 1", "Intro 2", "Review", "Row test"
  /** Kana introduced in THIS sub-lesson (empty for review/test). */
  introduces: KanaIntro[];
  /** Anchor words exposed in this sub-lesson (subset of row.anchorWords). */
  anchorWords: AnchorWord[];
  /** Build / match pairs come from this sub-lesson's anchors. */
  build?: BuildAnswer;
  /** Sentence-example slides scoped to this sub-lesson if present. */
  sentenceExamples?: SentenceExample[];
  /** When true, this sub-lesson is the row-test; emits TestStep flow. */
  isTest?: boolean;
};

export type RowDef = {
  // ... existing fields stay (id, title, intro, introduces, anchorWords,
  //     audioPick, build, sentenceExamples)
  /** NEW: if present, lessonBuilder emits one Lesson per sub-lesson
   *  instead of the legacy single-lesson per row. */
  subLessons?: SubLessonDef[];
};
```

Existing `RowDef.introduces` / `anchorWords` / `build` / `audioPick`
stay so legacy curriculum data still compiles. When `subLessons` is
present, those top-level fields become defaults that sub-lessons can
inherit OR override.

### Split rule (canonical)

| Row size | Distribution | Total nodes |
|---|---|---|
| 3 kana | 2 + 1 (kana split + test) | 3 |
| 5 kana | 2 + 2 + 1 (kana split + test) | 4 |
| 6 kana (yōon) | 2 + 2 + 2 + test | 4 |
| 8 kana (da-ba) | 2 + 2 + 2 + 2 + test | 5 |
| 12 kana (yo-n-h-m-r capstone) | 1 wide intro lesson (covers rare yōon as recognition-only) + 1 test | 2 |

Each sub-lesson:
- Introduces ~2 new kana (or 1 for the final position of an odd-size split)
- Drills those 2 kana hard via teach + recognition + match
- Sub-lesson 2+ pulls **struggle-weighted carry-over** from earlier
  sub-lessons in the same row (1–2 carry-over items per match step)
- Row-final sub-lesson includes the row's anchor word(s) build step

Each row test:
- Pulls ~12–15 items mixed across the full row
- Ratio 60% recognition MCQ / 30% match / 10% build (struggle-biased)
- Requeue-on-miss: every wrong item is appended to the back of the
  test queue; user keeps going until they hit 70% correct or exit
- Pass at 70% surfaces a "Row passed" badge on the cluster
- Skipping is fine; cluster shows partial dots based on sub-lessons
  done

### Generated lesson IDs

`{row.id}-{subLesson.suffix}` — e.g. `ka-1`, `ka-2`, `ka-3`, `ka-test`.
Legacy IDs (`ka` etc.) deprecated; the module pathway uses the new
ids. Anything outside Learn page referencing legacy IDs would need a
migration (in-app progress data, lesson router params, etc.).

**Progress migration:** existing `lingo_progress_v1` users with `ka`
completed get auto-credited for `ka-1` / `ka-2` / `ka-3` / `ka-test`
on first load post-deploy (one-time migration in
`mockProgress.ts`).

---

## Struggle telemetry

### Store

`src/features/japanese/kanaMastery/struggleStore.ts`

```ts
type KanaStruggleEntry = {
  kana: string;
  /** Higher = harder. Capped at 100. */
  score: number;
  /** ISO timestamp of last update. */
  updatedAt: string;
};

type KanaStruggleStore = Record<string, KanaStruggleEntry>;

// Signals that bump the score:
//   incorrect answer: +12
//   correct answer:   −6 (clamped at 0)
//   answer time > 5s: +4 (per slow answer)
//   hint used:        +6
//   bypassed via "show me": +10 (treats reveal as failure)
```

LocalStorage key: `lingo_kana_struggle_v1`. Per-language scoping via
nested keys: `{lang}.{kana}`.

### Hook

`useKanaStruggle(lang: LanguageId)` returns
`{ scores, record(signal, kana), top(n): kana[] }`.

Subscribes to `SRSStoreRevisionContext` (Trevor's `86b91d1`) — same
pattern, same event bus. We call `notifySRSStoreChanged()` after
each mutation so any UI consuming kana-due-counts re-renders.

### Carry-over picker

`pickStruggleCarryOver(rowId, completedSubLessons, topN)`:
- Reads struggle store filtered to kana introduced in earlier
  sub-lessons of the current row
- Sorts by score descending
- Returns top-N (usually 1–2 items per match step)

When Phase 2a (FSRS-6) lands: replace `score` with FSRS stability
inverse. Hook contract stays the same.

---

## Lesson builder changes

`src/features/lesson/data/lessonBuilder.ts`:

1. `buildRowLesson(row)` (existing) becomes `buildLegacyRowLesson` —
   used only by rows without `subLessons`. Kept for back-compat
   during rollout.
2. NEW `buildRowSubLessons(row): LessonContent[]` — returns one
   `LessonContent` per sub-lesson + 1 for the row-test.
3. NEW `buildRowTestSteps(row): LessonStep[]` — emits a sequence of
   ~12–15 MC + match + build steps drawing from the full row's
   anchor words and introduced kana, struggle-biased via the
   struggle store at build time. (Build time bias = read at lesson
   start; static for that attempt; missed items go to the queue at
   runtime via the test runner — see below.)

`buildRowSubLessons` builds each sub-lesson cycle:
- Intro info step
- Per-kana cycle (intro → teach) for sub-lesson's `introduces`
- Carry-over match step (top-N struggle items from earlier
  sub-lessons in the same row) — skipped for sub-lesson 1 (no
  earlier items yet)
- Row anchors teach (anchors that became valid by this sub-lesson)
- Sentence-example slides (if present)
- Final match (anchors + current sub-lesson kana)
- Final build (if sub-lesson has `build`)
- Wrap-up info

### Row-test runner

New `TestRunner` shape lives in `src/features/lesson/components/`:

- Renders one item at a time from a runtime queue
- On miss, item is appended to back of queue (max 3 retries per
  item to prevent infinite loop)
- Pass threshold check happens when the front-of-queue is empty
  AND total correct >= 70% of total seen
- "Skip test" button surfaces a confirm modal
- Score shown progressively (`8/12 correct`)

The TestStep type:

```ts
export type RowTestStep = StepBase & {
  type: "row_test";
  rowId: string;
  items: RowTestItem[];     // initial queue
  passThreshold: number;    // 0.70
  maxRetries: number;       // 3 per item
};

export type RowTestItem =
  | { kind: "mc"; payload: MultipleChoiceData }
  | { kind: "match"; payload: MatchPairsData }
  | { kind: "build"; payload: BuildSentenceData };
```

Each item kind reuses the existing step renderers via a thin
adapter inside `RowTestStepView`.

---

## Visual changes (ModulePathway)

### Row cluster rendering

`ModulePathway.tsx` learns to **group** consecutive nodes that share
a row prefix (parsed from lesson id `{rowId}-{suffix}`). Render
order:

1. Row divider — a thin inline rule + row name + N filled dots
2. N cluster nodes (3–5 of them) at tighter snake offsets:
   - Within-cluster offset cycle: `[0, +1, 0, -1, 0]` (~±40px)
   - Reduced node diameter: 60px (vs 72px standard)
   - Reduced vertical gap: 14px between nodes
3. After last node of cluster: 32px gap, then next divider

CSS additions to `pathway.css`:
- `.lingo-row-divider` — flex row with `flex: 1` rules on either
  side; centered label + dots
- `.lingo-row-dot` — 8px circle, `bg-border` when empty,
  `bg-accent` when filled
- `.lingo-node[data-cluster="true"]` — 60px disc + reduced gap

The path-painter SVG curve continues unchanged — it just paints a
tighter S inside clusters and a longer-span connector across
dividers.

### Module pill rendering

`LearnPage.tsx`:

```ts
if (mod.comingSoon) pillText = "🔒 Coming soon";
else if (totalLessons === 0) pillText = undefined;
else {
  const pct = Math.round((lessonsDone / totalLessons) * 100);
  if (pct === 100) pillText = "✓ Complete · 100%";
  else if (pct === 0 && status === "locked") pillText = `🔒 After Module ${i - 1}`;
  else pillText = `${pct}%`;
}
```

### Test node styling

The `*-test` node renders distinct from intro nodes:
- Border-style: dashed (vs solid)
- Subtle icon overlay (📝 or "T") in a corner badge
- On pass (≥70%): green ring outline (like a crown)
- On fail / un-attempted: same as locked-available

---

## Coverage audit ("every possible teaching item")

After the data restructure, run a verification script that asserts:
- Every kana in `hiraganaCurriculum.HIRAGANA_ROWS` appears in at
  least one `subLesson.introduces`
- Every anchor word in any row appears in at least one
  `subLesson.anchorWords` for that row
- Every sub-lesson has a non-empty `introduces` or sets a flag
  marking it as review-only
- The row-test items cover every kana in the row

Script: `scripts/audit-curriculum-coverage.mjs`. Run as part of
`npm run build` indirectly via a vitest unit test
(`src/features/lesson/data/curriculum-coverage.test.ts`).

---

## Files touched

### NEW

- `src/features/japanese/kanaMastery/struggleStore.ts`
- `src/features/japanese/kanaMastery/useKanaStruggle.ts`
- `src/features/lesson/components/steps/RowTestStepView.tsx`
- `src/features/lesson/components/TestRunner.tsx`
- `src/features/lesson/data/buildRowTestSteps.ts`
- `src/features/lesson/data/curriculum-coverage.test.ts`
- `scripts/audit-curriculum-coverage.mjs` (optional CLI)

### MODIFIED

- `src/features/lesson/data/hiraganaCurriculum.ts` — adds
  `SubLessonDef` type + populates `subLessons` on every RowDef
- `src/features/lesson/data/lessonBuilder.ts` — adds
  `buildRowSubLessons`; existing `buildRowLesson` kept as fallback
- `src/features/lesson/data/generatedHiraganaLessons.ts` — emits
  multiple lessons per row when `subLessons` present
- `src/shared/domain/mockCourse.ts` — module 1 / module 2 lesson
  ordering updated (now ~50–60 lessons total in m1)
- `src/features/lesson/types.ts` — adds `RowTestStep` type
- `src/features/learn/LearnPage.tsx` — module pill → `XX%`
- `src/features/learn/components/ModulePathway.tsx` — row-cluster
  rendering
- `src/features/learn/components/PathwayNode.tsx` — accepts
  `cluster?: boolean` to render smaller variant; accepts
  `isTest?: boolean` for the test-node styling
- `src/features/learn/components/pathway.css` — row-divider styles +
  cluster node variant
- `src/shared/domain/mockProgress.ts` — one-time migration from
  legacy `ka` → `ka-1 ka-2 ka-3 ka-test`

### TOUCHED — Korean / Chinese alphabet catalogs (if they exist)

If `koreanCurriculum.ts` / `chineseCurriculum.ts` exist in
`src/features/lesson/data/`, mirror the change. Otherwise mark this
as a follow-up.

---

## Verification

- `npm run build` clean
- `npm run test:run` — 17 existing + 1 new curriculum-coverage test
- Playwright smoke at `/ja/learn?dev=1`: count Module 1 nodes =
  expected total (~50–60), row dividers rendered, test nodes have
  the dashed/badge treatment, module pill reads as percent
- Manual: click through `vowels-1` → finish → verify next available
  node is `vowels-2` with carry-over from `vowels-1` in its match
  step

---

## Rollout order

1. Add `SubLessonDef` type + extend `RowDef` (no behavior change)
2. Build `struggleStore` + `useKanaStruggle` (independent)
3. Build `buildRowSubLessons` + `buildRowTestSteps`
4. Populate `subLessons` on every existing RowDef
5. Wire `generatedHiraganaLessons` to emit sub-lessons + test
6. `mockProgress` migration
7. `ModulePathway` cluster rendering + `PathwayNode` cluster variant
8. Module pill → `XX%`
9. `RowTestStepView` + `TestRunner`
10. Coverage test
11. Build + test + Playwright smoke

---

## Out of scope

- Same change for Korean / Chinese until those alphabets get the
  same depth-of-curation pass
- Replacing struggle score with FSRS (Phase 2a; same hook contract)
- The "Test node passed" green ring badge feeding into FSRS
  stability bootstrap (Phase 2a wiring)
- Adaptive lesson length (each sub-lesson is currently static
  step count; future work could adapt based on user pace)

---

## Risks

- 50–60 lessons in Module 1 means a long pathway scroll. Mitigation:
  row clusters compress visual density; collapsed completed rows
  could be a follow-up if scroll becomes a problem.
- Existing progress migration must be idempotent across multiple
  page loads.
- Test runner's requeue logic needs careful state management —
  don't let infinite loops trap the user. Max 3 retries per item
  enforces an upper bound.
- Coverage test catches regressions; without it, anchor word
  attrition is silent.
