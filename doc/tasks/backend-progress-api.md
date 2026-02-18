# Task: Backend — Progress API

**Area:** `src/api/`, `src/features/progress/`
**Current state:** Mock data in `mockProgress.ts`

## Goal

Replace mock progress with a real API for streak, lessons completed, cards due, daily goals.

## Requirements

- `GET /api/users/me/progress` — returns `{ streak, lessonsThisWeek, cardsDueToday, completedLessonIds }`
- `POST /api/users/me/progress/lesson/:lessonId/complete` — mark lesson done
- `POST /api/users/me/progress/review` — record a flashcard review session
- Keyed by Auth0 sub

## Data model

```
UserProgress {
  userId: string (Auth0 sub)
  streak: number
  lastActiveDate: string (ISO)
  completedLessonIds: string[]
  cardsDueToday: number
  lessonsThisWeek: number
  dailyGoal: number
  reviewHistory: ReviewEntry[]
}
```

## Files to touch

- `src/features/progress/mockProgress.ts` — replace with API client
- `src/features/progress/ProgressSummary.tsx` — fetch from API
- `src/features/home/HomePage.tsx` — uses progress data
- New: backend endpoint

## Acceptance criteria

- [ ] Progress summary loads from API
- [ ] Completing a lesson updates backend
- [ ] Streak tracks consecutive days
- [ ] Cards due integrates with SRS engine (or returns mock count until SRS exists)
- [ ] Falls back gracefully if API unavailable
