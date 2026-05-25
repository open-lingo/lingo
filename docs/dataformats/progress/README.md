# Progress format

Per-user state for lesson completion, vocabulary learned, XP, and streaks.

**Runtime (2026-05):** Production shape is the hybrid rollup model in `lingo-core/docs/adr/0001-progress-api-hybrid-rollup.md`. The API exposes `GET /api/core/v1/progress/me` as `ProgressSummary` (`user`, `lessons[]`, `concepts[]`, `last30days[]`). The client keeps a **local completion cache** in `mockProgress.ts` (hydrated from server on fetch) and a **sync buffer** for in-flight lesson attempts (`features/lesson/engine/lessonStorage.ts`). Mid-lesson steps sync as draft attempts `draft:{lessonId}` via `POST /lessons/batch`.

**Start over** clears local caches and calls `DELETE /progress/me` (+ SRS `DELETE /all`).

See `progress.example.json` for a legacy-style example; field names may differ from `ProgressSummary`.

---

## UserProgress (top-level)

| Field            | Type                          | Required | Description                              |
|------------------|-------------------------------|----------|------------------------------------------|
| userId           | string                        | yes      | User identifier (auth0 sub or UUID)      |
| courseProgress    | Record<string, CourseProgress> | yes      | Keyed by course ID                       |
| streakDays       | number                        | yes      | Current consecutive-day streak           |
| lastActivityDate | string                        | yes      | ISO date of last activity (YYYY-MM-DD)   |
| totalXp          | number                        | yes      | Lifetime XP across all courses           |

---

## CourseProgress (per course)

| Field              | Type     | Required | Description                                    |
|--------------------|----------|----------|------------------------------------------------|
| completedLessonIds | string[] | yes      | Lesson IDs the user has finished               |
| currentLessonId    | string   | no       | Lesson the user is currently on                |
| learnedVocabIds    | string[] | yes      | Vocab manifest IDs the user has learned        |
| totalXp            | number   | yes      | XP earned in this course                       |

---

## Streak logic

- `streakDays` increments when `lastActivityDate` is exactly one day before today.
- `streakDays` resets to 1 when there is a gap of more than one day.
- `lastActivityDate` updates whenever a lesson is completed or a review session finishes.

---

## Relationship to other formats

- `completedLessonIds` maps to lesson IDs defined in the course format ([courses/](../courses/)).
- `learnedVocabIds` maps to `VocabEntry.id` values from the module vocab manifest.
- Card-level progress (SRS state) is tracked separately in the flashcard SRS format ([flashcards/](../flashcards/)).

---

## XP sources

| Action               | XP    | Notes                                      |
|----------------------|-------|--------------------------------------------|
| Complete a lesson    | varies| Defined by `lesson.xpReward`              |
| Perfect lesson (0 mistakes) | bonus | e.g. +5 XP bonus                   |
| Flashcard review session | varies | Based on cards reviewed and accuracy  |
| Daily streak bonus   | varies| Increasing bonus for longer streaks        |
