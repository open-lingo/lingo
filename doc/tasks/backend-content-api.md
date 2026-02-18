# Task: Backend — Content API

**Area:** `src/api/`, `src/features/course/`
**Current state:** Mock course in `mockCourse.ts`

## Goal

Replace mock course structure with a content API (or CMS) that serves modules, lessons, and exercises.

## Requirements

- `GET /api/courses/:languageId` — returns course structure (modules + lessons)
- `GET /api/courses/:languageId/lessons/:lessonId` — returns lesson content (exercises, vocab, etc.)
- Content can live in JSON files (git-backed CMS) or a database
- Keep `course.ts` types or adapt them

## Content model

```
Course {
  languageId: string
  modules: Module[]
}

Module {
  id: string
  title: string
  lessons: Lesson[]
}

Lesson {
  id: string
  title: string
  type: "intro" | "vocab" | "grammar" | "practice" | "story"
  exercises: Exercise[]
}
```

## Files to touch

- `src/features/course/mockCourse.ts` — replace with API client
- `src/features/course/CourseMapPage.tsx` — fetch from API
- `src/data/` — move content JSON to backend or keep as static assets
- New: backend endpoint or static JSON serving

## Acceptance criteria

- [ ] Course map loads from API or static JSON
- [ ] Lesson content is fetchable by ID
- [ ] Works for ko and ja
- [ ] Falls back to mock if API unavailable
