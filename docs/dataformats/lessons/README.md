# Lesson content format

Canonical format for lesson content -- the steps, exercises, and teaching screens that make up a single lesson within a course module.

See `lesson.example.json` for a complete example using every step type.

---

## Lesson envelope

| Field              | Type     | Required | Description                                                    |
|--------------------|----------|----------|----------------------------------------------------------------|
| id                 | string   | yes      | Unique lesson ID (e.g. `m1-l1`)                               |
| moduleId           | string   | yes      | Parent module ID                                               |
| courseId            | string   | yes      | Parent course ID                                               |
| languageId         | string   | yes      | Learning language (ko, ja, etc.)                               |
| title              | string   | yes      | Display title                                                  |
| description        | string   | no       | Short description shown before starting                        |
| estimatedMinutes   | number   | no       | Approximate completion time                                    |
| xpReward           | number   | no       | XP awarded on completion                                       |
| introducesVocabIds | string[] | no       | Vocab manifest entry IDs introduced by this lesson             |
| introducesCardIds  | string[] | no       | Flashcard IDs unlocked on completion (links to lesson-card map)|
| steps              | Step[]   | yes      | Ordered array of lesson steps                                  |

---

## Step base (common fields)

Every step, regardless of type, has these fields:

| Field | Type   | Required | Description                        |
|-------|--------|----------|------------------------------------|
| id    | string | yes      | Unique within the lesson           |
| type  | string | yes      | Discriminator (see types below)    |
| hint  | string | no       | Hint shown after a wrong attempt   |

The `type` field determines which additional fields are present. This is a **discriminated union** -- adding a new step type means adding a new shape; existing types never change.

---

## Step types

### 1. `info` -- Information-only screen

Non-scored, non-interactive screen for contextual information such as tips, cultural notes, or grammar explanations. The user taps "Continue" to proceed. Unlike `teach`, this does not introduce specific vocabulary -- it provides broader context.

| Field   | Type   | Required | Description                                                            |
|---------|--------|----------|------------------------------------------------------------------------|
| title   | string | no       | Optional heading                                                       |
| body    | string | yes      | Main text content                                                      |
| imageKey| string | no       | Asset key for an illustration                                          |
| variant | string | no       | Display style: `"tip"`, `"culture"`, `"grammar"`, or `"default"`       |

---

### 2. `teach` -- Present new content

Non-scored instructional screen. Introduces vocabulary, grammar, or cultural notes. The user taps "Continue" to proceed.

| Field              | Type            | Required | Description                          |
|--------------------|-----------------|----------|--------------------------------------|
| content.text       | string          | yes      | Instructional text                   |
| content.vocab      | TeachVocab      | no       | Vocabulary item to highlight         |
| content.note       | string          | no       | Cultural or usage note               |

**TeachVocab**

| Field       | Type           | Required | Description                         |
|-------------|----------------|----------|-------------------------------------|
| term        | string         | yes      | Word or phrase in the target language|
| translation | string         | yes      | Meaning in the instruction language  |
| audioKey    | string         | no       | Asset key for pronunciation audio    |
| imageKey    | string         | no       | Asset key for illustration           |
| breakdown   | CardSegment[]  | no       | Segment-level breakdown              |

**CardSegment** (shared with flashcard format)

| Field      | Type   | Required | Description                      |
|------------|--------|----------|----------------------------------|
| segment    | string | yes      | Text segment                     |
| meaning    | string | no       | Meaning of this segment          |
| particleId | string | no       | Links to a particle definition   |

---

### 3. `multiple_choice` -- Pick the correct answer

| Field           | Type     | Required | Description                                  |
|-----------------|----------|----------|----------------------------------------------|
| prompt          | string   | yes      | Question text                                |
| promptAudioKey  | string   | no       | Audio for the prompt                         |
| promptImageKey  | string   | no       | Image for the prompt                         |
| options         | Option[] | yes      | 2-4 answer options                           |
| correctOptionId | string   | yes      | ID of the correct option                     |
| explanation     | string   | no       | Shown after answering                        |

**Option**

| Field    | Type   | Required | Description          |
|----------|--------|----------|----------------------|
| id       | string | yes      | Unique within step   |
| text     | string | yes      | Answer text          |
| imageKey | string | no       | Optional image       |

---

### 4. `build_sentence` -- Arrange tiles in order

The learner drags or taps word/character tiles to construct the correct sentence.

| Field          | Type     | Required | Description                                                |
|----------------|----------|----------|------------------------------------------------------------|
| prompt         | string   | yes      | Instruction (e.g. "Translate: Hello")                      |
| targetSentence | string   | yes      | The correct assembled sentence                             |
| tiles          | string[] | yes      | Pool of tiles, including distractors                       |
| correctOrder   | string[] | yes      | Correct sequence of tiles (subset of `tiles`)              |
| audioKey       | string   | no       | Audio of the correct sentence                              |
| granularity    | string   | yes      | `"word"` or `"character"` -- determines UI tile rendering  |

---

### 5. `match_pairs` -- Match source to target

The learner matches items from two columns (e.g. Korean words to English meanings).

| Field  | Type        | Required | Description           |
|--------|-------------|----------|-----------------------|
| prompt | string      | yes      | Instruction text      |
| pairs  | MatchPair[] | yes      | Items to match        |

**MatchPair**

| Field  | Type   | Required | Description                       |
|--------|--------|----------|-----------------------------------|
| id     | string | yes      | Unique within step                |
| source | string | yes      | Left-side item (target language)  |
| target | string | yes      | Right-side item (native language) |

---

### 6. `fill_blank` -- Complete the sentence

A sentence with one or more blanks. Can use a word bank (tap to select) or free-form typing.

| Field    | Type      | Required | Description                                         |
|----------|-----------|----------|-----------------------------------------------------|
| sentence | string    | yes      | Text with `{{blank}}` placeholder(s)                |
| blanks   | Blank[]   | yes      | One entry per `{{blank}}` in order                  |
| wordBank | string[]  | no       | If provided, user picks from bank; otherwise types   |

**Blank**

| Field           | Type     | Required | Description                          |
|-----------------|----------|----------|--------------------------------------|
| id              | string   | yes      | Unique within step                   |
| correctAnswer   | string   | yes      | Primary correct answer               |
| acceptedAnswers | string[] | no       | Additional accepted spellings/forms  |

---

### 7. `translate` -- Free-form translation

The learner types a translation of the given sentence.

| Field           | Type     | Required | Description                                                        |
|-----------------|----------|----------|--------------------------------------------------------------------|
| sourceText      | string   | yes      | Sentence to translate                                              |
| sourceLanguage  | string   | yes      | `"target"` (from learning lang) or `"native"` (into learning lang) |
| acceptedAnswers | string[] | yes      | All accepted translations                                          |
| audioKey        | string   | no       | Audio of the source sentence                                       |

---

### 8. `listening_comprehension` -- Listen + comprehension question

Play an audio clip, then answer a multiple-choice question about it.

| Field           | Type     | Required | Description                              |
|-----------------|----------|----------|------------------------------------------|
| audioKey        | string   | yes      | Audio clip (dialogue, sentence, passage) |
| transcript      | string   | no       | Shown after answering or on hint         |
| question        | string   | yes      | Comprehension question                   |
| options         | Option[] | yes      | Multiple-choice answers (same as above)  |
| correctOptionId | string   | yes      | ID of the correct option                 |
| explanation     | string   | no       | Shown after answering                    |

---

### 9. `listening_build` -- Listen + build from tiles

Play an audio clip, then reconstruct what was heard from tiles. Combines listening with the `build_sentence` mechanic.

| Field          | Type     | Required | Description                                               |
|----------------|----------|----------|-----------------------------------------------------------|
| audioKey       | string   | yes      | Audio clip                                                |
| prompt         | string   | yes      | Instruction (e.g. "Build the sentence you heard")         |
| targetSentence | string   | yes      | The correct assembled sentence                            |
| tiles          | string[] | yes      | Pool of tiles, including distractors                      |
| correctOrder   | string[] | yes      | Correct sequence of tiles                                 |
| granularity    | string   | yes      | `"word"` or `"character"`                                 |

---

### 10. `speaking` -- Speak a phrase (stubbed)

The learner is prompted to speak a phrase. Currently stubbed -- always auto-passes.

| Field        | Type   | Required | Description                         |
|--------------|--------|----------|-------------------------------------|
| targetPhrase | string | yes      | Phrase to say in the target language |
| translation  | string | yes      | Meaning in the instruction language  |
| audioKey     | string | no       | Reference audio for the phrase       |
| stubbed      | bool   | yes      | Always `true` for now               |

---

### 11. `video` -- Video clip (K-drama, J-drama, music video, etc.)

A short video clip embedded in the lesson. Used for drama scenes, music video segments, or other authentic media. The learner watches the clip, optionally with interactive elements (captions, vocabulary highlights, comprehension questions).

| Field           | Type     | Required | Description                                              |
|-----------------|----------|----------|----------------------------------------------------------|
| videoKey        | string   | yes      | Asset key for the video file or stream URL               |
| title           | string   | no       | Optional heading for the clip                            |
| transcript      | string   | no       | Full transcript; can be shown alongside or after viewing  |
| captionsKey     | string   | no       | Asset key for VTT/SRT subtitles                          |
| vocabHighlights | string[] | no       | Vocab IDs or terms to highlight in transcript            |
| prompt          | string   | no       | Instruction (e.g. "Watch and listen for the greeting")   |
| comprehension   | object   | no       | Optional comprehension question (same shape as `multiple_choice`) |

**Use cases:** K-drama greeting scenes, J-drama dialogue clips, K-pop/J-pop music video segments with lyrics focus, authentic conversation snippets.

---

## Design principles

- **Single Responsibility**: Each step type handles exactly one exercise paradigm.
- **Open/Closed**: New step types extend the union; existing types are never modified. The lesson runner only needs a new renderer for the new type.
- **Liskov Substitution**: All steps share the `{id, type, hint?}` base. The runner can iterate any step array generically.
- **Interface Segregation**: Each step type carries only the fields it needs.
- **Dependency Inversion**: Steps reference external assets by key (`audioKey`, `imageKey`) rather than embedding data. Lessons reference vocab/cards by ID, not by embedding full objects.

## Extensibility

- New step types (e.g. `drag_drop_image`, `conversation`, `cloze_deletion`) add to the union without touching existing types.
- Each step supports an optional `metadata` object for future fields or A/B testing flags.
- Audio/image keys are abstract -- resolved to S3, local file, or CDN at runtime depending on environment.
