# Task: Backend — Progress API

**Service:** `lingo-core` (FastAPI, Python 3.13+)
**Router prefix:** `/api/core/progress/v1`
**Current state:** No progress router exists. Frontend uses mock data in `mockProgress.ts`.

**References:**
- Progress format: `docs/dataformats/progress/README.md` (schema, XP sources, streak logic)
- Lesson-card mapping: `docs/dataformats/flashcards/lesson-card-map.example.json`
- Flashcard data: `docs/FLASHCARD-DATA.md` (lesson completion → card unlock, learned vocab)
- Content format: `docs/dataformats/lessons/README.md` (lesson `introduces_vocab_ids`, `introduces_card_ids`)

---

## Existing backend patterns to follow

Same as content API — see `backend-content-api.md` for the router/schema/DI pattern. The progress API follows the same structure:

```
app/progress/
├── __init__.py
├── router.py      → APIRouter(prefix="/api/core/progress/v1")
└── schemas.py     → Pydantic models
```

Wire into `app/main.py`. All progress endpoints require authentication (`get_current_user` dependency).

---

## Endpoints

### Get progress summary

#### `GET /me`

Returns the authenticated user's full progress state.

**Auth:** Required

**Response:**
```json
{
  "user_id": "auth0|6995498e5b74eb82bdc1c17b",
  "course_progress": {
    "official-ko": {
      "completed_lesson_ids": ["m1-l0", "m1-l1"],
      "current_lesson_id": "m1-l2",
      "learned_vocab_ids": ["annyeong", "gamsahamnida"],
      "total_xp": 45
    }
  },
  "streak_days": 7,
  "last_activity_date": "2026-02-18",
  "total_xp": 45
}
```

### Get course-specific progress

#### `GET /me/courses/{course_id}`

Returns progress for a single course.

**Auth:** Required

**Response:**
```json
{
  "course_id": "official-ko",
  "completed_lesson_ids": ["m1-l0", "m1-l1"],
  "current_lesson_id": "m1-l2",
  "learned_vocab_ids": ["annyeong", "gamsahamnida"],
  "total_xp": 45
}
```

### Complete a lesson

#### `POST /me/courses/{course_id}/lessons/{lesson_id}/complete`

Marks a lesson as completed. The backend:
1. Adds `lesson_id` to `completed_lesson_ids`
2. Adds the lesson's `introduces_vocab_ids` to `learned_vocab_ids`
3. Awards XP from `lesson.xp_reward`
4. Updates `current_lesson_id` to the next available lesson
5. Updates streak (`streak_days`, `last_activity_date`)

**Auth:** Required

**Request body:**
```json
{
  "xp_earned": 10,
  "mistakes": 2,
  "time_seconds": 180
}
```

`xp_earned` is computed client-side (base XP + bonuses) and validated server-side. `mistakes` and `time_seconds` are for analytics.

**Response:**
```json
{
  "course_id": "official-ko",
  "lesson_id": "m1-l1",
  "xp_awarded": 10,
  "bonus_xp": 5,
  "new_streak_days": 8,
  "newly_learned_vocab_ids": ["annyeong", "gamsahamnida"],
  "newly_unlocked_card_ids": ["ko-2", "ko-5"]
}
```

### Record a flashcard review session

#### `POST /me/review`

Records a flashcard review session (SRS updates happen client-side for now; this is for analytics and streak tracking).

**Auth:** Required

**Request body:**
```json
{
  "deck_id": "ko-beginner",
  "cards_reviewed": 10,
  "cards_correct": 8,
  "time_seconds": 120
}
```

**Response:**
```json
{
  "xp_awarded": 5,
  "new_streak_days": 8
}
```

### Reset course progress (dev/testing)

#### `DELETE /me/courses/{course_id}`

Resets all progress for a course. Only available in DEBUG mode.

**Auth:** Required

---

## Pydantic schemas (`app/progress/schemas.py`)

```python
class CourseProgress(BaseModel):
    course_id: str
    completed_lesson_ids: list[str] = []
    current_lesson_id: str | None = None
    learned_vocab_ids: list[str] = []
    total_xp: int = 0

class ProgressResponse(BaseModel):
    user_id: str
    course_progress: dict[str, CourseProgress] = {}
    streak_days: int = 0
    last_activity_date: str | None = None
    total_xp: int = 0

class LessonCompleteRequest(BaseModel):
    xp_earned: int = 0
    mistakes: int = 0
    time_seconds: int = 0

class LessonCompleteResponse(BaseModel):
    course_id: str
    lesson_id: str
    xp_awarded: int
    bonus_xp: int = 0
    new_streak_days: int
    newly_learned_vocab_ids: list[str] = []
    newly_unlocked_card_ids: list[str] = []

class ReviewSessionRequest(BaseModel):
    deck_id: str
    cards_reviewed: int
    cards_correct: int
    time_seconds: int = 0

class ReviewSessionResponse(BaseModel):
    xp_awarded: int
    new_streak_days: int
```

---

## DI / Repository pattern

```python
class ProgressRepository(Protocol):
    async def get_progress(self, user_id: str) -> dict | None: ...
    async def get_course_progress(self, user_id: str, course_id: str) -> dict | None: ...
    async def complete_lesson(
        self, user_id: str, course_id: str, lesson_id: str,
        vocab_ids: list[str], card_ids: list[str], xp: int
    ) -> dict: ...
    async def record_review(self, user_id: str, deck_id: str, cards_reviewed: int, cards_correct: int) -> dict: ...
    async def reset_course(self, user_id: str, course_id: str) -> None: ...
```

**SQLite implementation** (local dev): Store progress as JSON blob per user, same pattern as `SqliteUserRepository`.

**DynamoDB implementation** (prod): Single-table design:
- `PK=USER#{auth0_id}`, `SK=PROGRESS` — overall progress
- `PK=USER#{auth0_id}`, `SK=COURSE#{course_id}` — per-course progress

---

## Streak logic (server-side)

```python
from datetime import date, timedelta

def update_streak(last_activity: date | None, current_streak: int) -> tuple[int, date]:
    today = date.today()
    if last_activity is None:
        return 1, today
    if last_activity == today:
        return current_streak, today  # already active today
    if last_activity == today - timedelta(days=1):
        return current_streak + 1, today  # extend streak
    return 1, today  # streak broken
```

---

## Frontend integration

Add `ProgressApi` to the existing client layer:

```typescript
class ProgressApi extends ApiClient {
  getProgress() { ... }
  getCourseProgress(courseId: string) { ... }
  completeLesson(courseId: string, lessonId: string, data: LessonCompleteRequest) { ... }
  recordReview(data: ReviewSessionRequest) { ... }
}
```

The lesson player calls `api.progress.completeLesson()` at the end of a lesson. The learn page calls `api.progress.getCourseProgress()` to determine which lessons are locked/completed.

---

## Acceptance criteria

- [ ] `GET /api/core/progress/v1/me` returns user's progress state
- [ ] `POST .../lessons/{lesson_id}/complete` marks lesson done and returns unlocked content
- [ ] Streak increments correctly on consecutive days
- [ ] XP accumulates per course and globally
- [ ] `learned_vocab_ids` updated from lesson's `introduces_vocab_ids`
- [ ] Works with dev auth bypass (DEBUG mode, `X-Dev-User` header)
- [ ] Frontend falls back to mock progress if API unavailable
