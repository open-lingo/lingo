# Data formats

Reference formats for all app data. Each domain has its own subfolder with a schema README and example JSON files.

---

## Contents

| Domain | Description | Folder |
|--------|-------------|--------|
| **Lessons** | Lesson content format -- step types for teaching, exercises, listening, and speaking | [lessons/](./lessons/) |
| **Courses** | Course structure, modules, and vocab manifests | [courses/](./courses/) |
| **Flashcards** | Deck format, card types, lesson-card mapping, SRS state | [flashcards/](./flashcards/) |
| **Progress** | Per-user lesson completion, XP, streaks, and learned vocabulary | [progress/](./progress/) |

---

## Quick links

- Lesson step types and schema: [lessons/README.md](./lessons/README.md)
- Full example lesson (Korean Greetings, all 9 step types): [lessons/lesson.example.json](./lessons/lesson.example.json)
- Course with modules and vocab manifest: [courses/course.example.json](./courses/course.example.json)
- Flashcard deck (course-linked): [flashcards/course-deck.example.json](./flashcards/course-deck.example.json)
- Flashcard deck (community): [flashcards/community-deck.example.json](./flashcards/community-deck.example.json)
- User progress snapshot: [progress/progress.example.json](./progress/progress.example.json)

---

## Design principles

All formats follow a discriminated-union approach where applicable (e.g. lesson step `type`, flashcard card `type`). New variants extend the union without modifying existing shapes. External assets (audio, images) are referenced by key, not embedded.

See also:
- [CONTENT-DESIGN.md](../CONTENT-DESIGN.md) -- course vs community content, versioning, language handling
- [FLASHCARD-DATA.md](../FLASHCARD-DATA.md) -- vocab manifest and lesson completion flow
