# Flashcard data format & vocab manifest

Notes for building the flashcard data format and course vocab flow.

**Example data:** See `docs/dataformats/flashcards/` for canonical deck format, lesson-card mapping, and SRS state examples. Course and vocab manifest format is in `docs/dataformats/courses/`. Lesson content format (steps and exercises) is in `docs/dataformats/lessons/`.

---

## Vocab selection strategy

When building course vocab manifests and flashcard decks, draw from:

1. **Frequency lists (Core 2k)** — Use the top ~2000 most frequent words for each language (e.g. Korean Core 2k, Japanese Core 2k). Take a mix: some high-frequency items from the list, plus...
2. **Normal / everyday words** — Include common words learners actually need day-to-day that may not rank in the strict top frequency (e.g. domain-specific but useful: "receipt", "pharmacy", "appointment").
3. **Conversation / survival phrase frequency** — Prioritize phrases that appear often in real conversations and survival situations: greetings, requests, directions, emergencies, shopping, food ordering, basic questions ("Where is...?", "How much?", "Can you help me?"), politeness markers, fillers.

**Blend:** Pull from frequency lists for foundation, supplement with survival phrases and practical everyday words. This keeps learners covered for both textbook-style progression and real-world use.

---

## Course vocab manifest

### Concept

- Each **module** has a **vocab manifest** listing all words introduced in that module.
- The manifest is the source of truth for what vocab exists at the module level.
- Lessons introduce subsets of that vocab; when a lesson is completed, the user's data is updated with the learned words.

### Structure (proposed)

```
Course
└── Module
    ├── vocabManifest: VocabEntry[]   // all words in this module
    └── lessons
        └── Lesson
            ├── introducesCardIds: string[]   // cards unlocked when lesson done
            └── introducesVocabIds?: string[] // subset of manifest; for tracking
```

- **Vocab manifest** (per module): `VocabEntry[]` — id, word, meaning, reading, etc.
- **Lesson completion** → user progress records which `introducesVocabIds` (or `introducesCardIds`) are now "learned."
- **Course deck** (vocab + sentence): built from manifests. Cards have `unlocked` based on lesson completion (already implemented via `lessonCardMap`).

### Vocab manifest shape (draft)

```ts
type VocabEntry = {
  id: string;
  word: string;        // e.g. "안녕하세요"
  meaning: string;     // e.g. "Hello"
  reading?: string;    // romanization / furigana if needed
  // ... other fields as needed
};

type ModuleVocabManifest = {
  moduleId: string;
  entries: VocabEntry[];
};
```

- Modules own their manifest; the course deck aggregates across modules.
- When a lesson is completed, the user's learned-words data for that lesson is updated (e.g. `userLessonProgress.learnedVocabIds`).

---

## User data on lesson completion

When a lesson is completed:

1. **Lesson progress**: `completedLessonIds` (or equivalent) includes the lesson.
2. **Card unlock**: cards in `introducesCardIds` become unlocked for the course deck (already implemented).
3. **Learned words**: user record gets the `introducesVocabIds` (or vocab from the lesson) added to their learned set for that course/module.

This powers:
- Course vocab deck (only show cards for learned words)
- Sentence deck (similar unlock flow)
- Any future "words learned" or progress UI

---

## Deck types

- **Course vocab deck**: words from module manifests; unlocked per lesson completion.
- **Course sentence deck**: sentences; same unlock model.
- **Community decks**: language-specific; typically all cards available (or per-addon rules).
- Same card/deck format; `unlocked` and `courseId` distinguish behavior (already in `types.ts`).

---

## Implementation order (suggested)

1. Define `VocabEntry` and `ModuleVocabManifest` in `shared/domain/`.
2. Add vocab manifest to mock course modules (or a separate manifest file per module).
3. Add `introducesVocabIds` to lessons; link to manifest entries.
4. On lesson completion (when we have the flow): update user progress with learned vocab.
5. Ensure course deck filtering uses both `introducesCardIds` and manifest alignment so vocab cards stay in sync.
