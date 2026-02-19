# Course format

Canonical format for course structure, modules, and the vocab manifest. Formalizes the `Course > Module > Lesson` hierarchy.

See `course.example.json` for a complete example.

---

## Course

| Field      | Type     | Required | Description                                     |
|------------|----------|----------|-------------------------------------------------|
| id         | string   | yes      | Unique course ID (e.g. `official-ko`)           |
| languageId | string   | yes      | Learning language (ko, ja, etc.)                |
| title      | string   | yes      | Display title                                   |
| version    | string   | no       | Content version (e.g. `"1.0"`)                  |
| modules    | Module[] | yes      | Ordered array of modules                        |

---

## Module

| Field         | Type          | Required | Description                                         |
|---------------|---------------|----------|-----------------------------------------------------|
| id            | string        | yes      | Unique module ID (e.g. `m1`)                        |
| title         | string        | yes      | Display title                                       |
| description   | string        | no       | Short description                                   |
| vocabManifest | VocabEntry[]  | no       | All vocabulary introduced across this module        |
| lessons       | string[]      | yes      | Ordered lesson IDs; content loaded separately       |

Lessons are referenced by ID, not embedded. The lesson runner loads lesson content from a separate file or API endpoint using the ID. This keeps course definitions lightweight and allows independent updates to individual lessons.

---

## VocabEntry (module vocab manifest)

The vocab manifest is the source of truth for what vocabulary a module covers. Individual lessons reference subsets of it via `introducesVocabIds`.

| Field   | Type   | Required | Description                                  |
|---------|--------|----------|----------------------------------------------|
| id      | string | yes      | Unique vocab ID (referenced by lessons)      |
| word    | string | yes      | Word or phrase in the target language         |
| meaning | string | yes      | Translation / meaning                        |
| reading | string | no       | Romanization, furigana, or phonetic guide    |

---

## Versioning

Course content is versioned and can have multiple instruction-language variants (see `CONTENT-DESIGN.md`). The manifest determines which version to serve per instruction language:

```json
{
  "courseId": "official-ko",
  "versions": {
    "1.1": { "instructionLangs": ["en", "ko"] },
    "1.0": { "instructionLangs": ["ja"] }
  }
}
```

---

## Relationship to other formats

- **Lessons** ([lessons/](../lessons/)): Each lesson ID in `modules[].lessons` maps to a full lesson content file.
- **Flashcards** ([flashcards/](../flashcards/)): Course-linked flashcard decks reference `courseId`. Cards unlock based on lesson completion via the lesson-card map.
- **Progress** ([progress/](../progress/)): User progress tracks `completedLessonIds` and `learnedVocabIds` per course.
