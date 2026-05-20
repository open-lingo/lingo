# Alphabet → Course Integration Plan

**Status:** Planning · **Owner:** Trevor · **Created:** 2026-05-19
**Supersedes (partially):** `docs/ALPHABET_COURSE_PLANNING.md` (kept as the mastery-model spec; this doc layers course-integration on top)
**Related:** `lingo-core/docs/adr/0001-progress-api-hybrid-rollup.md`, `docs/curriculum-design-v2.md`, `docs/m1-density-restructure-plan-2026-05-17.md`

Goal: make alphabet acquisition a **first-class part of the course track** so finishing a kana row / Hangul section advances the same progress bars as any other lesson — while the standalone `/practice/alphabet` page stays as an on-demand review surface that doesn't double-credit course progress.

---

## 1. Current state audit

### Where alphabet code lives

| Surface | Path | Route |
|---|---|---|
| Standalone hub | `src/features/practice/PracticeAlphabetHubPage.tsx` | `/:lang/practice/alphabet` |
| Per-script practice landing | `src/features/practice/AlphabetPracticePage.tsx` | `/:lang/practice/alphabet/:alphabetId` |
| Drill / learner page | `src/features/practice/alphabet/AlphabetLessonPage.tsx` | `/:lang/practice/alphabet/:alphabetId/learn` (accepts `?mode=learn|test&section=<sectionId>`) |
| Per-letter localStorage | `src/features/practice/alphabet/alphabetProgress.ts` | n/a |
| Session resume state | `src/features/practice/alphabet/alphabetSessionStorage.ts` | n/a |
| Session step builders | `src/features/practice/alphabet/alphabetSession.ts` | n/a |
| Alphabet config (sections, characters, letterDetails) | `src/shared/domain/languageConfig.ts` § `AlphabetDef` | n/a |
| Course wiring | `src/shared/domain/mockCourse.ts` (`ALPHABET_LESSON_ID = "m1-l0-alphabet"`) | consumed by `src/features/learn/LearnPage.tsx` |

### What progress is tracked today

1. **`alphabetProgress.ts` (localStorage, per `languageId+alphabetId`):**
   - Per-letter `{ introduced, traceCount, recognitionPassed, productionPassed, symbolToSoundPassed? }`
   - `sectionTests: Record<sectionId, boolean>` — true once user passes section test-out at ≥ 80%
   - `fullTestPassed: boolean` — true once user passes whole-alphabet test
2. **LearnPage course-completion bridge:** `LearnPage.tsx:124-134` reads `alphabetProgress.fullTestPassed` and injects `ALPHABET_LESSON_ID` into `completedLessonIds`. This **only** flips the `m1-l0-alphabet` lesson — which only exists in the non-Japanese fallback course in `mockCourse.ts:329`. **Japanese never had that entry**, so for JA there is currently no course-level acknowledgement of alphabet progress at all.
3. **Synthetic attempt logging (just wired):** `AlphabetLessonPage` calls `recordAttempt({ lessonId: "alphabet:<alphabetId>:<mode>[:<section>]", ... })` on session finish and `recordStepEvent(...)` per step. These flow through `features/lesson/engine/lessonSync.ts` into the same Sync Manager batch that real lesson attempts use.

### How the alphabet currently relates to the course

- **Non-JA fallback course** (`mockCourse.ts:320-353`) puts `ALPHABET_LESSON_ID` in M1 as `kind: "alphabet"`. `LearnPage.goToLesson` then routes to `/practice/alphabet/<alphabetId>/learn`. That redirect-style is the only existing course→alphabet hook.
- **JA course** (`mockCourse.ts:48-318`) skips that entry entirely: M1 starts with `ja-m1-l1-1 Vowels — Intro 1`. The kana ARE the course content (one regular lesson per kana row/sub-row) but they use the regular `LessonPage` step types (`multiple_choice`, `teach`, `match`) — not the alphabet-specific intro/trace/recog/prod loop in `AlphabetLessonPage`. So JA learners technically don't have an "alphabet learner" path inside the course at all; they have row-shaped lessons that happen to cover the kana.
- **KO** uses the non-JA fallback, which means Korean learners hit `m1-l0-alphabet` → routes to the alphabet learner for Hangul. That's one (1) clickable course node covering the whole script.

### What "I just wired" actually does (and why it's a half-measure)

The synthetic `lessonId: "alphabet:<id>:<mode>[:<section>]"` makes alphabet sessions visible to the progress sync pipeline — XP/streak get a chance to fire, sync manager sees the attempt, the backend will store it. But:

- The id is **not** in `course.modules[*].lessons[]`, so `completedSet.has(id)` is false → no module progress bar movement, no module-mastery toast.
- It's not in `mockLessons.ts`, so the backend's prerequisite check (ADR §"Rate limiting + sanity rules") may reject it as unknown — needs verification.
- The progress UI (Learn page, module accordion, "x of N") doesn't render anything for alphabet work.
- Two writers (`alphabetProgress.ts` localStorage + `recordAttempt` → server) now track the same event with no reconciliation.

It's enough to stop dropping the data on the floor; it's not enough to call alphabet a part of the course.

---

## 2. Target UX

### Course view (Learn page)

- M1 of every language whose `LanguageConfig` carries an `alphabet` or `alphabets` shows **one lesson per alphabet section** in the natural reading order. Lesson titles match the section names: "Hangul · plain consonants", "Hangul · vowels — basic", "Hiragana · vowels", "Hiragana · ka-row", …
- Multi-script languages (JA: Hiragana + Katakana; future ZH: pinyin + radicals + hanzi) get a section-block per script. If `LanguageConfig.alphabets[]` has length ≥ 2, each script becomes its own M1 sub-cluster; users finish Hiragana before Katakana unlocks (existing module-prerequisite mechanic in `moduleProgress.ts` already supports this via per-lesson `prerequisites`).
- Each alphabet lesson contributes to module % the same way any other lesson does. Module-mastery toast fires when all alphabet sections are done.
- XP + streak fire on completion identical to a normal lesson.

### Renderer

- **Keep `AlphabetLessonPage` as the renderer** when a course alphabet lesson is opened. Reuse: the trace/recognize/production loop already exists, has stroke-order data, has per-letter localStorage, and matches what the user expects when they re-enter via "review."
- `LearnPage.goToLesson` resolves `kind: "alphabet"` lessons to `/:lang/practice/alphabet/:alphabetId/learn?courseLessonId=<id>&section=<sectionId>` (existing route, new query param). Section pre-filters; `courseLessonId` is the marker for "course mode."
- Chrome stays as-is: progress bar, exit-X, LessonComplete. Optionally surface a small breadcrumb (`Module 1 · Hiragana · ka-row · 3/5`) — match the LessonPage breadcrumb style.

### Free-form `/practice/alphabet/:id[/learn]`

- Stays. No `courseLessonId` query param means **free-form mode**.
- Free-form mode:
  - Calls `recordStepEvent` per step with `conceptIds: ["alphabet:<langId>:<character>"]` so per-letter concept rollups still accrue
  - **Does not** call `recordAttempt` — no XP, no streak tick, no course-percent movement
  - Continues to update `alphabetProgress.ts` (the per-letter localStorage trace counters)
- The alphabet hub gets a small "Review" badge — explicit that this is review, not graded course work. The "Guided lesson" button stays as a free-form learner; users wanting credit go through Learn.

---

## 3. Schema additions / changes

### Lesson IDs

Canonical: `<langId>-m1-alphabet-<scriptId>-<sectionId>`. Examples:

```
ja-m1-alphabet-hiragana-a-row
ja-m1-alphabet-hiragana-ka-row
ja-m1-alphabet-hiragana-dakuten
ja-m1-alphabet-katakana-a-row          (when katakana joins M1 / a future module)
ko-m1-alphabet-hangul-consonants-plain
ko-m1-alphabet-hangul-vowels-basic
```

Notes:

- The script segment (`hiragana`, `hangul`) lets a single language host multiple scripts cleanly. Single-script languages still get the script segment for consistency — it's the `alphabet.id` from `LanguageConfig`.
- The synthetic ids from the just-wired half-measure (`alphabet:<id>:<mode>:<section>`) are **not** course lesson ids. Drop them once the canonical ids land — but keep `recordStepEvent` events flowing under the canonical id when running in course mode.

### `Lesson` extensions (in `src/shared/domain/course.ts`)

Add optional `sectionId?: string` to the `Lesson` type so `kind: "alphabet"` rows can also carry the section to preload. Today only `alphabetId` is on `Lesson`; add the sibling field.

```ts
kind?: "lesson" | "alphabet" | "recap" | "module_review";
alphabetId?: string;   // existing
sectionId?: string;    // new — preselects the section in AlphabetLessonPage
```

### Module structure in `mockCourse.ts`

Add a helper:

```ts
function alphabetLessonsForLanguage(langId: string): Lesson[] {
  const scripts = getLanguageConfig(langId)?.alphabets
    ?? (getLanguageConfig(langId)?.alphabet ? [getLanguageConfig(langId)!.alphabet!] : []);
  return scripts.flatMap((alpha) => {
    const sections = alpha.sections ?? [{ id: "all", name: alpha.name, characters: alpha.characters ?? [] }];
    return sections.map((s) => ({
      id: `${langId}-m1-alphabet-${alpha.id}-${s.id}`,
      title: `${alpha.name} · ${s.name}`,
      status: "available" as const,
      kind: "alphabet" as const,
      alphabetId: alpha.id,
      sectionId: s.id,
    }));
  });
}
```

Then for **JA**: M1 becomes `[...alphabetLessonsForLanguage("ja").filter(scriptIs("hiragana")), m1RecapId]` — replacing the current ja-m1-l1-* vowels stubs and `rowToLessons(HIRAGANA_ROWS[i])` chain. Katakana sections move to M3 (`Katakana — the second alphabet`) as alphabet-kind lessons or stay in M1 with prerequisites; pick during phase-1 implementation.

For **KO / default**: M1 = `[...alphabetLessonsForLanguage(langId), ...originalBasicsLessons]`.

### Concept taxonomy (server-side rollups; ADR-0001 §"Concept tagging")

| Concept id pattern | Granularity | Used by |
|---|---|---|
| `alphabet:<langId>:<character>` | Per-letter (e.g. `alphabet:ja:あ`) | Heatmap "times reviewed per letter"; SRS confusion clusters later |
| `alphabet:<langId>:<scriptId>:<sectionId>` | Per-section (e.g. `alphabet:ja:hiragana:ka-row`) | Section mastery summaries on Learn page |
| `alphabet:<langId>:<scriptId>` | Whole-script (e.g. `alphabet:ja:hiragana`) | "Hiragana 87% mastered" stats |

Every `recordStepEvent` from the alphabet learner should emit all three concept ids it touches (existing `recordStepEvent.conceptIds` is an array). Server's lazy rollup recompute (ADR-0001 §6) turns each into a `ConceptRollup` row keyed by `SK = CONCEPT#alphabet:ja:あ` etc. — **no new endpoint, no schema change in lingo-core** required to get per-letter review counts. The `encounters` field on those rows IS the "times reviewed per letter" counter.

---

## 4. Routing decisions

- **Keep one renderer:** `AlphabetLessonPage`. Adding a parallel LessonPage variant would duplicate the trace/recognition step UX.
- **Course lessons route through `/:lang/practice/alphabet/<alphabetId>/learn`** with query params:
  - `courseLessonId=<id>` — present iff this session counts toward a course lesson
  - `section=<sectionId>` — preselects the section (already exists)
  - `mode=learn|test` — already exists; course-completion uses test mode for the credited attempt (see §5)
- **AlphabetLessonPage behavior split:**

| Surface | Trigger | `recordAttempt` | `recordStepEvent` | `alphabetProgress.ts` |
|---|---|---|---|---|
| Course lesson (Learn → click) | `courseLessonId` present | YES, `lessonId = courseLessonId` | YES, conceptIds include letter+section+script | YES (legacy localStorage; needed for trace gating + resume) |
| Free-form practice | no `courseLessonId` | NO | YES, conceptIds = letter+section+script | YES |

The free-form path keeps the trace-count and per-letter localStorage on so that "you've already passed this letter's trace twice" still works.

### Alternative considered & rejected

Rendering alphabet lessons via the standard `LessonPage` with alphabet-shaped steps (synthesizing `multiple_choice` + a new `trace` step type). Rejected because:

1. The trace UX has too many alphabet-specific concerns (stroke-order data, retry-with-template, review-round-on-fail) that don't generalize.
2. `AlphabetLessonPage` already handles session resume keyed by `(langId, alphabetId, sectionId, mode)` — porting that into LessonPage adds risk without benefit.
3. The "lesson chrome" gap is small: progress bar + back button + LessonComplete are already there. A breadcrumb is a 1-hour add.

---

## 5. Migration plan

A one-shot client-side migration runs on first load after this ships, behind a `lingo:alphabet-course-migration:v1` localStorage flag.

For each `(langId, alphabetId)` with an `AlphabetProgress` row whose `sectionTests[sectionId] === true`:

1. Compute the canonical course lesson id: `<langId>-m1-alphabet-<alphabetId>-<sectionId>`.
2. If `mockCourse.getMockCourse(langId)` lists that lesson, call the existing `markMockLessonCompleted(courseLessonId)` (the same write LessonPage uses on completion). This writes to the local "completed lessons" set that LearnPage reads.
3. Optionally enqueue a synthetic `recordAttempt` so the server picks it up on next sync (`durationSec: 5`, `passed: true`, `score: 1`, no `stepResults` — server treats it as a backfill). Lowest priority; skip if it complicates idempotency.
4. Same for `fullTestPassed` — credit every section that exists for that alphabet.
5. Set the flag.

Migration risk: if the user has multiple language-progress rows but only ever finished the JA fallback course's `ALPHABET_LESSON_ID` (which is non-JA only), we shouldn't credit anything. The flag is per-user-localStorage, not per-language; the migration is idempotent so it's safe to run once.

---

## 6. Concept rollup integration

Today: `recordStepEvent` already takes `conceptIds`. The alphabet learner only passes `[\`alphabet:<alphabetId>\`]` (one tag, ambiguous between scripts and lessons).

Target:

```ts
recordStepEvent({
  lessonId,           // canonical course id when in course mode, else synthetic
  stepId,
  stepIdx,
  correct,
  conceptIds: [
    `alphabet:${langId}:${character}`,                      // per-letter
    `alphabet:${langId}:${alphabetId}:${sectionId}`,        // per-section
    `alphabet:${langId}:${alphabetId}`,                     // per-script
  ],
});
```

That's the entire backend touchpoint. Server's lazy rollup (ADR-0001 §6) computes `encounters / correctCount` per concept id on next read. No schema migration, no new endpoint.

Free-form `/practice/alphabet` events emit the same concept ids — same letter-count accrues whether the user is in course or practice mode. The "no course progress" distinction is purely about `recordAttempt` (which feeds XP / streak / module %).

### Phase-3 UI hook (later)

`GET /api/core/v1/progress/me` already returns `concepts[]`. The frontend will need a helper:

```ts
function getLetterReviewCount(rollups: ConceptRollup[], langId: string, char: string): number {
  return rollups.find(r => r.conceptId === `alphabet:${langId}:${char}`)?.encounters ?? 0;
}
```

A future per-letter heatmap on `/practice/alphabet/:id` reads that map and paints each letter.

---

## 7. UI surfaces

- **Learn page module accordion:** alphabet lessons render as standard rows. `kind: "alphabet"` already gets routed through `goToLesson` (LearnPage.tsx:246). No visual change required — they'll just sit inline.
- **Section completion summary:** in M1's accordion header, surface "Hiragana 3/5" once `alphabets` exist. Cheap: count `completedSet.has(id)` for `lesson.kind === "alphabet" && lesson.alphabetId === <script>` and divide by the total alphabet-kind lesson count for that script.
- **`/practice/alphabet` hub:** add a "Review only — doesn't credit course progress" caption under the "Guided lesson" button so users don't think they're cheating their course by drilling here.
- **Phase 3:** per-letter heatmap on `/practice/alphabet/:alphabetId` reading `ConceptRollup.encounters`.

---

## 8. Phased ship order

### Phase 1 — Course-list inclusion + dual-mode AlphabetLessonPage (single PR)

Scope (smallest unblock):

1. Extend `Lesson` type with optional `sectionId`.
2. Add `alphabetLessonsForLanguage()` helper to `mockCourse.ts` and inject it into M1 for KO (lowest-blast-radius language — currently has the single-lesson `m1-l0-alphabet` redirect; replace with proper per-section list).
3. `LearnPage.goToLesson` already routes `kind: "alphabet"` correctly; add `courseLessonId` + `section` to the navigation URL.
4. `AlphabetLessonPage` reads `courseLessonId` from `useSearchParams`. When present:
   - Use it (not the synthetic id) as the `lessonId` passed to `recordAttempt`
   - Still call `recordStepEvent` with the upgraded `conceptIds`
5. When absent (free-form), skip `recordAttempt` entirely. `recordStepEvent` still fires with the upgraded `conceptIds`.
6. Migration script (§5).
7. Keep the JA-specific kana lessons (`ja-m1-l1-1` etc) untouched in Phase 1. JA migration is a follow-up because it churns curriculum that's already shipped.

Acceptance:

- Open `/ko/learn` → M1 shows multiple Hangul section rows.
- Click "Hangul · plain consonants" → opens AlphabetLessonPage preselected to that section.
- Finish → `completedSet` includes `ko-m1-alphabet-hangul-consonants-plain`, M1 % moves, XP / streak fire once.
- Open `/ko/practice/alphabet/hangul/learn` directly → no `recordAttempt` fires, but `recordStepEvent` still pushes concept events into the sync buffer.

### Phase 2 — JA migration + concept-rollup server consumption

- Replace JA's `ja-m1-l1-1` / `rowToLessons(HIRAGANA_ROWS[i])` with alphabet-kind lessons. Provide a one-shot migration that marks the new ids complete when the old ids are complete (`completedSet`).
- Verify backend `progress.batchAttempts` accepts the canonical ids (whitelist or pattern-allow `<lang>-m1-alphabet-*`).
- Concept rollup recompute pass — confirm server is producing `CONCEPT#alphabet:ja:あ` rows. No code change expected if §6 is honored.

### Phase 3 — Per-letter heatmap

UI on `/practice/alphabet/:alphabetId` showing encounter counts per letter.

---

## 9. Open questions for the team

1. **Section-per-lesson vs. one-big-lesson per script.** Plan assumes section-per-lesson (better course % movement, finer-grained mastery). Confirm.
2. **XP per alphabet lesson.** Recommend parity with regular lessons (current `LessonComplete` uses `xpReward: 10` for the synthetic virtual lesson — likely fine). Worth an explicit constant in `mockCourse.ts`?
3. **Multi-script languages — module shape.** For JA, do Katakana sections live in M1 alongside Hiragana (locked until hiragana complete) or in M3 (its current home)? Plan tentatively keeps Hiragana in M1 and leaves Katakana in M3, but a `module.lessons[]` ordering can vary.
4. **Migration of `alphabetProgress.ts` localStorage.** Plan does the simple thing (read once, mark completions, leave the file in place for trace-count gating). Worth deprecating that store entirely once concept rollups are reliable?
5. **Free-form mode: should `recordStepEvent` events count toward the user's daily activity (DAY rollup in ADR-0001 §"Decision" item 2)?** If yes, free-form practice could keep streaks alive without crediting lessons — same as flashcard SRS does today. If no, free-form is purely passive. Recommend yes — matches SRS behavior.

---

## 10. Out of scope (for this plan)

- The fuller SM-2-style alphabet mastery model in `docs/ALPHABET_COURSE_PLANNING.md` §3-7. That spec is orthogonal — when it lands it slots into the same concept rollup pipeline described here.
- New step types (`symbol_intro`, `symbol_trace`, `symbol_recognition`, `symbol_to_sound` as canonical LessonPage step types). Plan stays on `AlphabetLessonPage`.
- Cross-language alphabet sharing (Latin extensions, IPA chart). Future.
