# Task: Backend — Content API

**Service:** `lingo-core` (FastAPI, Python 3.13+)
**Router prefix:** `/api/core/content/v1`
**Current state:** No content router exists. Frontend uses mock data in `mockCourse.ts` and `features/lesson/data/mockLessons.ts`.

**References:**
- Lesson content format: `docs/dataformats/lessons/README.md` (9 step types, full schema)
- Course format: `docs/dataformats/courses/README.md` (modules, vocab manifest)
- Flashcard data: `docs/dataformats/flashcards/README.md` (lesson-card mapping)
- Content design: `docs/CONTENT-DESIGN.md` (versioning, language-agnostic courses)
- Frontend types: `src/features/lesson/types.ts` (TypeScript discriminated union for all step types)
- Frontend mock lesson: `src/features/lesson/data/mock-m1-l1.ts` (Korean Greetings, all 9 step types)

---

## Existing backend patterns to follow

The backend already has two routers wired into `app/main.py`:

- `app/users/router.py` → `/api/core/users/v1`
- `app/community/router.py` → `/api/core/community/v1`

Each router uses:
- **Auth dependency**: `get_current_user` / `get_current_user_optional` from `app/auth/dependencies.py`
- **Repository DI**: Protocol-based repos injected via FastAPI `Depends()` (see `app/db/protocols.py`, `app/db/dependencies.py`)
- **Pydantic schemas**: Request/response models in a sibling `schemas.py`
- **Config**: `app/config.py` for environment-driven settings

The content API should follow the same structure:
```
app/content/
├── __init__.py
├── router.py      → APIRouter(prefix="/api/core/content/v1")
└── schemas.py     → Pydantic models
```

Wire into `app/main.py` alongside the existing routers.

---

## Endpoints

### Courses

#### `GET /courses/{language_id}`

Returns the course structure for a language (modules + lesson refs, no lesson content).

**Auth:** Optional (public courses are readable without auth)

**Response:**
```json
{
  "id": "official-ko",
  "language_id": "ko",
  "title": "Korean for Beginners",
  "version": "1.0",
  "modules": [
    {
      "id": "m1",
      "title": "Basics",
      "description": "Essential greetings, numbers, and colors",
      "lesson_count": 4,
      "lessons": [
        { "id": "m1-l0", "title": "Introduction to Hangul" },
        { "id": "m1-l1", "title": "Greetings" },
        { "id": "m1-l2", "title": "Numbers 1–10" },
        { "id": "m1-l3", "title": "Colors" }
      ]
    }
  ]
}
```

Notes:
- Lessons are lightweight refs (id + title only). The full lesson content is fetched separately.
- For MVP, return a single hardcoded course per language. Later, support multiple courses and versioned manifests.

#### `GET /courses/{language_id}/modules/{module_id}/vocab`

Returns the vocab manifest for a module.

**Auth:** Optional

**Response:**
```json
{
  "module_id": "m1",
  "entries": [
    { "id": "annyeong", "word": "안녕하세요", "meaning": "Hello", "reading": "annyeonghaseyo" },
    { "id": "gamsahamnida", "word": "감사합니다", "meaning": "Thank you", "reading": "gamsahamnida" }
  ]
}
```

### Lessons

#### `GET /courses/{language_id}/lessons/{lesson_id}`

Returns full lesson content (envelope + all steps). This is the primary endpoint the lesson player calls.

**Auth:** Optional (content is public; progress tracking needs auth)

**Response:** Matches the lesson content format from `docs/dataformats/lessons/README.md`:
```json
{
  "id": "m1-l1",
  "module_id": "m1",
  "course_id": "official-ko",
  "language_id": "ko",
  "title": "Greetings",
  "description": "Learn basic Korean greetings and introductions",
  "estimated_minutes": 5,
  "xp_reward": 10,
  "introduces_vocab_ids": ["annyeong", "gamsahamnida"],
  "introduces_card_ids": ["ko-2", "ko-5"],
  "steps": [
    {
      "id": "step-1",
      "type": "teach",
      "content": {
        "text": "In Korean, the most common greeting is 안녕하세요...",
        "vocab": {
          "term": "안녕하세요",
          "translation": "Hello / Good day",
          "audio_key": "audio/ko/annyeonghaseyo.mp3",
          "breakdown": [
            { "segment": "안녕", "meaning": "peace, wellness" },
            { "segment": "하", "meaning": "do (stem)" },
            { "segment": "세요", "meaning": "polite ending" }
          ]
        }
      }
    },
    {
      "id": "step-2",
      "type": "multiple_choice",
      "prompt": "What does 안녕하세요 mean?",
      "options": [
        { "id": "a", "text": "Thank you" },
        { "id": "b", "text": "Hello / Good day" }
      ],
      "correct_option_id": "b",
      "explanation": "안녕하세요 is the standard polite greeting."
    }
  ]
}
```

**Step types in the response** (discriminated by `type` field):
- `info` — information-only screen (tips, culture notes, grammar context)
- `teach` — vocabulary/grammar presentation
- `multiple_choice` — pick correct answer from options
- `build_sentence` — arrange word/character tiles in order
- `match_pairs` — match source items to targets
- `fill_blank` — complete sentence with missing word(s)
- `translate` — free-form translation input
- `listening_comprehension` — audio + comprehension question
- `listening_build` — audio + build sentence from tiles
- `speaking` — speak a phrase (stubbed, auto-pass)

Full field specs for each type: `docs/dataformats/lessons/README.md`

---

## Content storage (MVP approach)

For the initial implementation, serve content from **static JSON files** bundled with the backend:

```
app/content/
├── data/
│   ├── ko/
│   │   ├── course.json          (course structure)
│   │   ├── m1-l0.json           (lesson content)
│   │   ├── m1-l1.json
│   │   └── m1-vocab.json        (module vocab manifest)
│   └── ja/
│       ├── course.json
│       └── ...
```

The router reads and returns these files. No database needed for content initially. Later, content can move to S3, a CMS, or a database.

---

## Pydantic schemas (`app/content/schemas.py`)

Key models to define:

```python
class CardSegment(BaseModel):
    segment: str
    meaning: str | None = None
    particle_id: str | None = None

class TeachVocab(BaseModel):
    term: str
    translation: str
    audio_key: str | None = None
    image_key: str | None = None
    breakdown: list[CardSegment] | None = None

class TeachContent(BaseModel):
    text: str
    vocab: TeachVocab | None = None
    note: str | None = None

class Option(BaseModel):
    id: str
    text: str
    image_key: str | None = None

class MatchPair(BaseModel):
    id: str
    source: str
    target: str

class Blank(BaseModel):
    id: str
    correct_answer: str
    accepted_answers: list[str] | None = None

# Use a discriminated union for steps:
class StepBase(BaseModel):
    id: str
    type: str
    hint: str | None = None

class InfoStep(StepBase):
    type: Literal["info"]
    title: str | None = None
    body: str
    image_key: str | None = None
    variant: Literal["tip", "culture", "grammar", "default"] | None = None

class TeachStep(StepBase):
    type: Literal["teach"]
    content: TeachContent

class MultipleChoiceStep(StepBase):
    type: Literal["multiple_choice"]
    prompt: str
    prompt_audio_key: str | None = None
    prompt_image_key: str | None = None
    options: list[Option]
    correct_option_id: str
    explanation: str | None = None

class BuildSentenceStep(StepBase):
    type: Literal["build_sentence"]
    prompt: str
    target_sentence: str
    tiles: list[str]
    correct_order: list[str]
    audio_key: str | None = None
    granularity: Literal["word", "character"]

class MatchPairsStep(StepBase):
    type: Literal["match_pairs"]
    prompt: str
    pairs: list[MatchPair]

class FillBlankStep(StepBase):
    type: Literal["fill_blank"]
    sentence: str
    blanks: list[Blank]
    word_bank: list[str] | None = None

class TranslateStep(StepBase):
    type: Literal["translate"]
    source_text: str
    source_language: Literal["target", "native"]
    accepted_answers: list[str]
    audio_key: str | None = None

class ListeningComprehensionStep(StepBase):
    type: Literal["listening_comprehension"]
    audio_key: str
    transcript: str | None = None
    question: str
    options: list[Option]
    correct_option_id: str
    explanation: str | None = None

class ListeningBuildStep(StepBase):
    type: Literal["listening_build"]
    audio_key: str
    prompt: str
    target_sentence: str
    tiles: list[str]
    correct_order: list[str]
    granularity: Literal["word", "character"]

class SpeakingStep(StepBase):
    type: Literal["speaking"]
    target_phrase: str
    translation: str
    audio_key: str | None = None
    stubbed: bool = True

LessonStep = Annotated[
    InfoStep | TeachStep | MultipleChoiceStep | BuildSentenceStep | MatchPairsStep |
    FillBlankStep | TranslateStep | ListeningComprehensionStep |
    ListeningBuildStep | SpeakingStep,
    Field(discriminator="type")
]

class LessonResponse(BaseModel):
    id: str
    module_id: str
    course_id: str
    language_id: str
    title: str
    description: str | None = None
    estimated_minutes: int | None = None
    xp_reward: int | None = None
    introduces_vocab_ids: list[str] | None = None
    introduces_card_ids: list[str] | None = None
    steps: list[LessonStep]

class LessonRef(BaseModel):
    id: str
    title: str

class ModuleResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    lesson_count: int
    lessons: list[LessonRef]

class CourseResponse(BaseModel):
    id: str
    language_id: str
    title: str
    version: str | None = None
    modules: list[ModuleResponse]

class VocabEntry(BaseModel):
    id: str
    word: str
    meaning: str
    reading: str | None = None

class VocabManifestResponse(BaseModel):
    module_id: str
    entries: list[VocabEntry]
```

---

## DI / Repository pattern

For MVP with static JSON, no repository protocol is needed — the router can read files directly. When content moves to a database or CMS, add:

```python
class ContentRepository(Protocol):
    async def get_course(self, language_id: str) -> dict | None: ...
    async def get_lesson(self, language_id: str, lesson_id: str) -> dict | None: ...
    async def get_vocab_manifest(self, language_id: str, module_id: str) -> dict | None: ...
```

And wire it the same way as `UserRepository` in `app/db/dependencies.py`.

---

## Frontend integration

The frontend API client layer already exists (`src/api/client.ts`, `src/api/provider.tsx`). Add a `ContentApi` class:

```typescript
class ContentApi extends ApiClient {
  getCourse(languageId: string) { ... }
  getLesson(languageId: string, lessonId: string) { ... }
  getVocabManifest(languageId: string, moduleId: string) { ... }
}
```

Wire into `ApiProvider` alongside `UsersApi`. The lesson player (`src/features/lesson/`) calls `api.content.getLesson(lang, id)` and falls back to `getMockLessonContent()` if the API is unavailable.

---

## Acceptance criteria

- [ ] `GET /api/core/content/v1/courses/{language_id}` returns course structure for ko and ja
- [ ] `GET /api/core/content/v1/courses/{language_id}/lessons/{lesson_id}` returns full lesson content with typed steps
- [ ] `GET /api/core/content/v1/courses/{language_id}/modules/{module_id}/vocab` returns vocab manifest
- [ ] Response shapes match `docs/dataformats/` specs
- [ ] Works with dev auth bypass (DEBUG mode)
- [ ] Frontend falls back to mock data if API unavailable
