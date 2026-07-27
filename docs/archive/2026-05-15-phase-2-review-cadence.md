> **Status: ARCHIVED — SUPERSEDED by srs-scheduling-model-2026-06-15.md.** Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Phase 2 — vocab graduation + per-lesson review tail + module recap

Status: spec ready, agent-executable. User-approved scope.

User directives (this session):
- Flashcards FSRS port = NOT mine (other maintainer). Don't touch
  `src/features/flashcards/engine/`.
- ONE shared "Course deck" links Learn → Flashcards. Anchor words
  graduate when their **module** completes (not per-lesson — too
  granular). Use "unlocked flags" + minimal state. Build scaffolding
  only; the other maintainer wires the receiver.
- No sentence-level SRS. Sentence practice stays as the existing
  `BuildSentenceStep` inside lessons.
- Reset existing flashcard SM-2 state is fine if the other maintainer
  decides to.
- Per-lesson review tail: 3-4 retrieval items at the END of every
  normal sub-lesson, drawing from prior content struggle-biased.
- Module-end recap: 100% review of items from that module, struggle-
  biased.

Cross-references:
- `2026-05-15-alphabet-streamline.md` — sub-lesson + struggle store
  + carry-over within row
- `2026-05-15-spaced-review-cadence.md` — pedagogy: Karpicke, Cepeda,
  Nation, Cowan, Hwang/Yan interleaving

---

## TL;DR

1. New module `src/features/japanese/vocabGraduation/`. On module
   complete, snapshot anchor words to localStorage. Read API +
   no-op notify stub for the flashcards maintainer to consume.
2. New `buildReviewTailSteps` helper. Every sub-lesson (NOT row-test,
   NOT recap) gets 3-4 quick retrieval items appended just before
   the wrap-up info step. Items are sourced from kana introduced in
   PRIOR sub-lessons (any row — cross-row interleaving). Struggle-
   biased via the existing `struggleStore`.
3. New lesson kind `recap` (final node of each module). Renders ~15
   review items, 100% from that module's content, struggle-biased.
   Skippable like the row test. UI variant on the pathway node:
   amber-gradient badge instead of dashed-border test badge.
4. Module pill xx% includes recap + tail items in the
   `lessonsDone / totalLessons` math (no behavior change to the
   existing formula).

---

## A. Vocab graduation scaffolding

### Types
```ts
// src/features/japanese/vocabGraduation/types.ts
export type GraduatedItem = {
  kana: string;
  romaji: string;
  meaning: string;
  sourceModuleId: string;   // "ja-m1"
  sourceModuleTitle: string; // "Module 1 · Hiragana"
  unlockedAt: string;       // ISO timestamp
};

export type VocabGraduationStore = Record<string /* courseId */, GraduatedItem[]>;
```

### Storage
- Key: `lingo_graduated_vocab_v1`
- Per-course array of `GraduatedItem`s, deduped by `kana`
- Append-only: once an item is graduated, it stays (the other
  maintainer's receiver can choose to remove/archive)

### API
```ts
// src/features/japanese/vocabGraduation/index.ts
export function getGraduatedVocab(courseId: string): GraduatedItem[];
export function graduateModule(courseId: string, module: Module): GraduatedItem[];
// Iterates every lesson.anchorWords in the module + the module title metadata,
// produces deduped GraduatedItem[], merges into store, dispatches the notify event.
// Returns the items it added (new ones only).

export function clearGraduatedVocab(courseId?: string): void;
// Dev tool — wired into the existing dev panel.

/** Stub for the flashcards maintainer to override. No-op for now. */
export function notifyFlashcardsOfGraduation(items: GraduatedItem[]): void {
  // Intentional no-op. Receiver to be wired by another maintainer.
  // Dispatches a CustomEvent('lingo:vocab-graduated', { detail: items })
  // so the flashcards side can subscribe whenever they're ready.
  window.dispatchEvent(new CustomEvent('lingo:vocab-graduated', { detail: items }));
}
```

### Trigger
In `LearnPage.tsx` (or `mockProgress.ts`'s `markLessonCompleted`):
- After every lesson completion, recompute module status
- If a module transitions from "current/locked" → "completed",
  call `graduateModule(courseId, module)` once
- Persist a "module-graduated" flag in localStorage to avoid double-
  graduation on reload

### Dev panel addition
Existing dev panel gets a new button: **"Clear graduated vocab"** —
wipes the graduation store for the current course.

---

## B. Per-lesson review tail

### Data shape
```ts
// src/features/lesson/data/lessonBuilder.ts
function buildReviewTailSteps(opts: {
  currentLessonId: string;
  priorLessons: Lesson[];    // every lesson with status === "done"
  struggleStore: KanaStruggleStore;
  count: 3 | 4;              // 3 default; 4 if struggleStore.size > 6
}): LessonStep[];
```

### Source pool
- Pull from `priorLessons`'s `anchorWords` + introduced kana
- **Exclude items from the current row** (already covered by the
  in-row carry-over match step)
- Bias selection toward top-struggle entries (top 60%); fill remainder
  randomly to avoid always asking the same items

### Step mix
3-4 items, random mix:
- ~50% multiple-choice (audio → kana, or romaji → kana)
- ~30% match-pairs (4-pair micro-match drawing from review pool)
- ~20% build-sentence (only if anchor word qualifies)

Each item uses the existing step renderers — no new visuals.

### Gating
- Skip the review tail entirely if `priorLessons.length === 0`
  (first lesson, nothing to review)
- Skip if the sub-lesson is itself a row-test or recap (those ARE
  the review)
- Skip if the cross-row pool is empty (e.g., still inside the
  first row of the first module)

### Lesson assembly order
```
intro info
[per-kana cycles: intro + teach]
[sentence-example slides if any]
[carry-over match — same-row prior sub-lessons, struggle-biased]
[anchor teach steps + final match + final build]
[NEW: review tail — 3-4 cross-row items, struggle-biased]
wrap-up info
```

The review tail sits right before the wrap-up so the user's last
interaction is a retrieval (Karpicke recency effect).

---

## C. Module recap lesson

### Types
- `Lesson.kind = "recap"` (new variant added to `course.ts`)
- Recap lessons have `lessonId: "${moduleId}-recap"` and live as the
  FINAL node of each module
- Generated automatically by `generatedHiraganaLessons.ts`

### Content shape
```ts
function buildRecapLesson(module: Module): LessonContent {
  return {
    steps: [
      buildInfoStep("Module recap", "Review of everything you learned."),
      ...buildRecapTestItems(module, { count: 15, threshold: 0.7 }),
      buildInfoStep("Nice work!", "Module complete."),
    ],
    // ...
  };
}
```

The recap items reuse the `RowTestStep` runner from #66 — same queue
+ requeue-on-miss + 70% pass threshold mechanics, just sourced from
the whole module instead of one row.

### Pathway node treatment
- Recap node renders distinct from row-test nodes:
  - Amber-gradient border (`#f59e0b → #d97706`) instead of dashed
  - Crown / trophy badge in the corner instead of "T"
  - Slightly larger than cluster nodes (matches main-snake node size,
    72px)

### Skip + retry
- Skippable like row tests
- Doesn't gate the next module — module is already "complete" when
  recap node appears
- Retake counts toward `reviewCount` (existing field), surfaces as a
  small `x{N}` badge on the recap node

---

## D. Module pill `xx%` math update

Already at xx% from #66 alphabet streamline. No change needed; the new
review-tail items live INSIDE existing sub-lesson steps, and recap
lessons count as one lesson each toward `lessonsDone / totalLessons`.

---

## Files touched

### NEW
- `src/features/japanese/vocabGraduation/index.ts`
- `src/features/japanese/vocabGraduation/types.ts`
- `src/features/japanese/vocabGraduation/storage.ts`
- `src/features/japanese/vocabGraduation/vocabGraduation.test.ts`
- `src/features/lesson/data/buildReviewTailSteps.ts`
- `src/features/lesson/data/buildRecapLesson.ts`

### MODIFIED
- `src/shared/domain/course.ts` — adds `Lesson.kind = "recap"`
- `src/shared/domain/mockCourse.ts` — emits one recap lesson per
  module as the last lesson; existing module-ordering logic stays
- `src/features/lesson/data/generatedHiraganaLessons.ts` — emits
  recap lessons
- `src/features/lesson/data/lessonBuilder.ts` — adds review-tail
  emission to `buildRowSubLessons`; adds `buildRecapLesson` entry
- `src/features/lesson/data/hiraganaCurriculum.ts` — no content
  changes; just type updates for review pool API
- `src/features/learn/LearnPage.tsx` — module-complete detection +
  `graduateModule` call; dev panel "Clear graduated vocab" button
- `src/features/learn/components/PathwayNode.tsx` — accepts
  `isRecap?: boolean` for the amber-gradient variant
- `src/features/learn/components/pathway.css` — recap node styles
- `src/features/learn/components/ModulePathway.tsx` — passes
  `isRecap` to the recap node

---

## Edge cases

### First sub-lesson of the first row of the first module
- No prior content. Review tail skipped entirely. Lesson proceeds
  without the tail.

### Mid-row sub-lessons (e.g., `ka-2`)
- Within-row carry-over match still fires (#66 mechanic).
- Cross-row review tail pulls from prior rows. If the user is on
  `ka-2` and Vowels is the only completed row, the tail draws from
  Vowels only.

### Recap lesson when module has 0 anchor words
- Coming-soon stub modules (M4 Numbers, M5 Greetings, M6 Sentences):
  no recap node — they have no lessons to recap.

### Module already completed before this code ships
- One-time migration: on first load post-deploy, for any module that
  has all lessons in `completedIds`, call `graduateModule` once. Flag
  in localStorage prevents repeat.

---

## Verification

- `npm run build` clean
- `npm run test:run` — existing 125 tests + ~10 new tests in
  vocabGraduation.test.ts
- Playwright smoke at `/ja/learn?dev=1`:
  - Confirm review tail appears in lessons after sub-lesson 1 of
    row 2+ (e.g., sa-1 or any post-vowels lesson)
  - Confirm recap node renders at the END of Module 1 with the
    amber gradient + trophy badge
  - Confirm module pill rounds correctly with the new recap lesson
    counted in total
  - Confirm Module 1's lesson count is 42 + 1 recap = 43

---

## Out of scope

- Flashcards engine port (FSRS) — other maintainer
- Wiring `notifyFlashcardsOfGraduation` to a real receiver
- Sentence-level SRS
- Grammar-pattern unlock gates
- Korean / Chinese parallel curriculum changes — follow-up PR
- Personalized review-pool size based on user performance (future)

---

## Risks

- `graduateModule` runs once per module-complete. Make sure double-
  trigger across page reloads is idempotent (flag check).
- The review tail adds 3-4 steps to every lesson (~10% length
  increase). If user data shows this hurts completion rates, expose
  a "tail off" toggle in settings (out of scope for first ship; flag
  it in the code as a known config seam).
- `lingo:vocab-graduated` CustomEvent dispatch firing before the
  flashcards receiver is wired is harmless (no listeners). When the
  receiver lands, it just starts catching events. No coordination
  needed.
