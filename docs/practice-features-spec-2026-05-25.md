# Practice Features — Implementation Spec (2026-05-25)

Six practice features for the N5 content spine. Each is a standalone route under `/practice/` that an implementing agent can build independently. Ordered by priority (highest first).

**Existing infrastructure to reuse:**
- Practice hub: `src/features/practice/PracticePage.tsx` — grid of NavCards, already wired
- Practice layout: `src/features/practice/PracticeLayout.tsx` — shared shell with breadcrumbs
- Practice nav: `src/features/practice/practiceNavItems.ts` — tab/dropdown nav items by language
- Practice routes: registered in `App.tsx` under `/:lang/practice/*`
- Pre-made courses strip on PracticePage already lists "JLPT N5 Kanji" → `/practice/kanji`
- Step view components: all in `src/features/lesson/components/steps/` — reusable outside lessons
- SRS engine: `src/features/flashcards/engine/` — FSRS-6 with modality split
- TTS: `src/shared/japanese/tts.ts` — `playJaAudio()`, `useAutoPlayJaAudio()`
- Speech: `src/shared/speech/` — Whisper grading, `useSpeechRecognition()`
- Course atoms: `src/features/flashcards/data/ja-course-atoms.ts` — 749 atoms with metadata
- Keyboard nav: `src/features/lesson/hooks/useLessonKeyboard.ts` — Enter/number key handling

---

## 1. Conjugation Practice (Priority: CRITICAL — blocks M8+)

### What it is
Interactive drill where the learner conjugates verbs and adjectives across forms. The single highest-leverage practice feature for N5 — verb conjugation is where most learners struggle.

### Route
`/:lang/practice/conjugation`

### Data source

Create a new data file: `src/features/practice/data/ja-conjugation-tables.ts`

```typescript
export type VerbGroup = "ichidan" | "godan" | "irregular";
export type ConjugationForm =
  | "masu"           // たべます
  | "masu-neg"       // たべません
  | "masu-past"      // たべました
  | "masu-past-neg"  // たべませんでした
  | "nai"            // たべない
  | "ta"             // たべた
  | "te"             // たべて
  | "tai"            // たべたい
  | "dictionary";    // たべる (identity, for reference)

export type VerbEntry = {
  id: string;              // atom ID from ja-course-atoms.ts
  dictionary: string;      // たべる
  meaning: string;         // "to eat"
  group: VerbGroup;
  forms: Record<ConjugationForm, string>;
  introducedAtModule: string; // "m7", "m10", etc.
};

export type AdjEntry = {
  id: string;
  dictionary: string;      // たかい / きれい
  meaning: string;
  type: "i-adj" | "na-adj";
  forms: Record<string, string>; // present, negative, past, past-negative
  introducedAtModule: string;
};
```

Populate with all verbs from M7+ and all adjectives from M8+. Include irregular readings (いく → いって, する → して, くる → きて). This is the authoritative conjugation table — lesson content and SRS pull from it.

### UI flow

```
┌─────────────────────────────────────┐
│  Conjugation Practice               │
│                                     │
│  Mode: [Verbs ▾]  Forms: [All ▾]   │
│  Level: [Up to M10 ▾]              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    たべる                    │    │
│  │    to eat                   │    │
│  │                             │    │
│  │    → ます form              │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ │
│  │たべます│ │たべる │ │たべて │ │のむ│ │
│  └──────┘ └──────┘ └──────┘ └────┘ │
│                                     │
│  Score: 7/10  Streak: 3             │
│                                     │
│  [End Practice]                     │
└─────────────────────────────────────┘
```

**Modes:**
1. **MCQ (default):** Show dictionary form + target form name → pick from 4 options (correct + 3 distractors from same verb group). Reuse MCQ button styling from `MultipleChoiceStepView`.
2. **Type (advanced):** Show dictionary form + target form name → text input. Normalize romaji → kana via existing `convertToHiragana()`. Accept kana or romaji input.

**Filters:**
- **Category:** Verbs / i-Adjectives / na-Adjectives / All
- **Forms:** checkboxes for which forms to drill (ます, ない, て, た, etc.)
- **Level:** "Up to M__" — only include verbs/adj introduced by that module
- **Focus mode:** "Weakest" — prioritize forms the learner gets wrong most (stored in localStorage)

**Distractor generation:**
- Same verb, wrong form (たべて when asking for ます)
- Same form, wrong verb (のみます when asking for たべます)
- Common error patterns (godan verbs getting ichidan conjugation)

**Session tracking:**
- localStorage key: `lingo:conjugation-practice`
- Track: `{ verbId, form, attempts, correct, lastPracticed }`
- Show accuracy % per form at session end
- Optional: feed results into SRS card state for the verb's atom

**Keyboard nav:** Number keys 1-4 select options, Enter submits. Reuse `useLessonKeyboard`.

### Components to create
- `src/features/practice/ConjugationPracticePage.tsx` — main page
- `src/features/practice/components/ConjugationCard.tsx` — the drill card
- `src/features/practice/data/ja-conjugation-tables.ts` — verb/adj data

### Route registration
Add to `App.tsx` practice children:
```tsx
{ path: "conjugation", element: <ConjugationPracticePage /> },
```

Add to `practiceNavItems.ts` for Japanese:
```typescript
{ to: `${prefix}/practice/conjugation`, label: "Conjugation", sampleCharacter: "変" }
```

### Tests
- Unit test: verify conjugation table correctness for ALL verbs (every form of every verb matches expected output)
- Unit test: irregular verbs (いく→いって not いいて, する→して, くる→きて)
- Unit test: godan sound changes (う/つ/る → って, む/ぶ/ぬ → んで, く → いて, ぐ → いで, す → して)
- Unit test: distractor generation never produces the correct answer as a distractor
- Unit test: level filter correctly limits to introduced-by-module

---

## 2. Kanji Recognition Practice (Priority: HIGH — blocks M8 kanji track)

### What it is
Flashcard-style kanji recognition drill. Show a kanji → pick the reading or meaning. Extends the existing stub at `/practice/kanji`.

### Route
`/:lang/practice/kanji` (already exists as `KanjiPracticePage.tsx` — currently a stub)

### Data source

Create: `src/features/practice/data/ja-n5-kanji.ts`

```typescript
export type KanjiEntry = {
  character: string;       // 食
  onyomi: string[];        // ["ショク"]
  kunyomi: string[];       // ["た.べる", "く.う"]
  meaning: string[];       // ["eat", "food"]
  strokeCount: number;
  grade: number;           // school grade (1-6 for N5)
  /** Module where this kanji is first introduced */
  introducedAtModule: string;
  /** Vocab atoms that use this kanji (IDs from ja-course-atoms.ts) */
  anchorVocab: string[];   // ["taberu", "shokudou"]
  /** Category for filtering */
  category: "number" | "time" | "person" | "nature" | "verb" | "adjective" | "direction" | "other";
};
```

Populate with all ~100 N5 kanji. Each kanji links to vocab atoms the learner already knows.

### UI flow

```
┌─────────────────────────────────────┐
│  N5 Kanji Practice                  │
│                                     │
│  Set: [Numbers ▾]  Mode: [Mean ▾]  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │         食                   │    │
│  │                             │    │
│  │   What does this mean?      │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────┐  ┌────────┐            │
│  │  eat   │  │ drink  │            │
│  └────────┘  └────────┘            │
│  ┌────────┐  ┌────────┐            │
│  │  read  │  │  see   │            │
│  └────────┘  └────────┘            │
│                                     │
│  Progress: 12/18 kanji in set       │
│  [End Practice]                     │
└─────────────────────────────────────┘
```

**Modes:**
1. **Meaning → Kanji:** "Which kanji means 'eat'?" → pick from 4 kanji
2. **Kanji → Meaning:** Show kanji → pick English meaning from 4 options
3. **Kanji → Reading:** Show kanji → pick the correct reading (onyomi or kunyomi in context)
4. **Vocab context:** Show a sentence with furigana hidden on one kanji → pick the reading

**Sets (filter by `category` or `introducedAtModule`):**
- Numbers (一二三四五六七八九十百千万)
- Time (日月年時分半)
- People (人男女子父母兄姉)
- Nature (山川海雨花木水火)
- Verbs (見聞言行来食飲読書)
- Directions (上下中前後左右北南東西)
- All unlocked

**Distractor generation:**
- Same category kanji (number kanji as distractors for number kanji)
- Visually similar kanji where possible
- Never use kanji from a module the learner hasn't reached

**SRS integration (optional):**
- Track kanji recognition state in localStorage: `lingo:kanji-practice`
- Shape: `{ kanjiId, recognition: { correct, total, lastSeen }, production: { correct, total, lastSeen } }`
- Use to prioritize weak kanji in future sessions

**Post-answer reveal:**
- Show the kanji, all readings (on/kun), meaning, stroke count
- Show 2-3 anchor vocab words the learner already knows that use this kanji
- "Tap to hear" TTS on each anchor word

### Components to create
- Replace `src/features/practice/KanjiPracticePage.tsx` (currently stub)
- `src/features/practice/components/KanjiCard.tsx` — the drill card with reveal
- `src/features/practice/data/ja-n5-kanji.ts` — kanji data

### Tests
- Unit test: all 100 N5 kanji present with correct readings
- Unit test: every kanji has at least 1 anchor vocab that exists in ja-course-atoms.ts
- Unit test: distractor generation never picks kanji from a later module than the target
- Unit test: every kanji has a valid category assignment

---

## 3. Reading Practice (Priority: HIGH — blocks M10+)

### What it is
Short passages (3-8 sentences) using known vocab + grammar. Comprehension MCQs below. This requires a new step type `reading_passage` that can also be used inside lessons.

### Route
`/:lang/practice/reading`

### New step type

Add to `src/features/lesson/types.ts`:

```typescript
export type ReadingPassageQuestion = {
  id: string;
  prompt: string;           // "What did Tanaka eat for lunch?"
  options: Option[];
  correctOptionId: string;
  explanation?: string;
};

export type ReadingPassageStep = StepBase & {
  type: "reading_passage";
  /** The passage text in Japanese. Rendered with AnnotatedJa (furigana). */
  passage: string;
  /** Optional English title/context hint above the passage */
  contextHint?: string;     // "Tanaka's diary entry"
  questions: ReadingPassageQuestion[];
  /** Furigana behavior. "hover" = show on hover/tap, "always" = always show, "never" = no furigana */
  furiganaMode?: "hover" | "always" | "never";
};
```

Add `"reading_passage"` to the `StepType` union. Create `ReadingPassageStepView.tsx` in the step views directory.

### Step view component

`src/features/lesson/components/steps/ReadingPassageStepView.tsx`

The view renders:
1. Context hint (if present) — small muted text above passage
2. Passage — rendered with `AnnotatedJa`, full-width, with line breaks preserved. Font size slightly larger than normal (text-lg). Background surface card.
3. Questions — one at a time (same pattern as `DialogueListenStepView`). MCQ options below. Check → feedback → next question → Continue.

Furigana behavior:
- `"hover"`: furigana hidden by default, shows on hover/tap per kanji. Uses existing `AnnotatedJa` with a CSS class that hides ruby text until `:hover` / `:focus`.
- `"always"`: standard `AnnotatedJa` rendering
- `"never"`: render without ruby at all

Keyboard nav: number keys for MCQ options, Enter for check/continue. Reuse `useLessonKeyboard`.

### Practice page

`src/features/practice/ReadingPracticePage.tsx`

Curated passages organized by module level. Each passage is a `ReadingPassageStep` rendered using `ReadingPassageStepView`.

```
┌─────────────────────────────────────┐
│  Reading Practice                   │
│                                     │
│  Level: [Up to M12 ▾]              │
│  Furigana: [Hover ▾]               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Tanaka's diary             │    │
│  │                             │    │
│  │  きのう ともだちと えいがを  │    │
│  │  みました。えいがは とても   │    │
│  │  おもしろかったです。その    │    │
│  │  あと、レストランで ばんごは │    │
│  │  んを たべました。           │    │
│  └─────────────────────────────┘    │
│                                     │
│  Q1: What did they do yesterday?    │
│  ┌──────────────────┐               │
│  │ Watched a movie  │               │
│  └──────────────────┘               │
│  ┌──────────────────┐               │
│  │ Went shopping    │               │
│  └──────────────────┘               │
│  ...                                │
└─────────────────────────────────────┘
```

**Passage bank:** Create `src/features/practice/data/ja-reading-passages.ts` with 3-5 passages per module level (M10-M30). Each passage uses only vocab + grammar from that module and below. Tag passages with topic (daily life, travel, school, work, etc.) for variety.

### Components to create
- `src/features/lesson/components/steps/ReadingPassageStepView.tsx` — new step view
- `src/features/practice/ReadingPracticePage.tsx` — practice surface
- `src/features/practice/data/ja-reading-passages.ts` — passage bank
- Update `StepRenderer.tsx` to handle `"reading_passage"` case
- Update `src/features/lesson/types.ts` with new step type

### Route registration
```tsx
{ path: "reading", element: <ReadingPracticePage /> },
```

### Tests
- Unit test: every passage uses only vocab atoms from its declared module level and below
- Unit test: every passage has 2-3 questions with valid correct option IDs
- Unit test: ReadingPassageStepView renders passage + questions + handles submit flow
- E2E: a reading passage loads without console errors

---

## 4. Speaking Practice (Priority: MEDIUM — enhances M8+)

### What it is
Pimsleur-style speaking drills outside of lessons. Listen to a prompt, speak the response. Whisper-graded. Extends the infrastructure built for Travel Sprint sidequests.

### Route
`/:lang/practice/speaking`

### UI flow

```
┌─────────────────────────────────────┐
│  Speaking Practice                  │
│                                     │
│  Mode: [Echo ▾]  Level: [M7+ ▾]   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔊 Listen, then repeat:    │    │
│  │                             │    │
│  │     みず を ください         │    │
│  │     "Water, please"         │    │
│  │                             │    │
│  │  ┌─────┐                    │    │
│  │  │ 🎤  │  Tap to speak     │    │
│  │  └─────┘                    │    │
│  │                             │    │
│  │  Heard: みずをください       │    │
│  │  ✓ Perfect!                 │    │
│  └─────────────────────────────┘    │
│                                     │
│  Progress: 5/12                     │
│  [End Practice]                     │
└─────────────────────────────────────┘
```

**Modes:**
1. **Echo:** Hear a phrase → repeat it. Simplest. Good for pronunciation.
2. **Response:** Hear a question in Japanese → speak the answer. E.g., hear "これは いくらですか" → say "ひゃくえんです". Requires authored prompt-response pairs.
3. **Scenario:** Travel/daily life situations. Hear a scene description, speak the appropriate phrase. Reuse Travel Sprint lesson infrastructure.

**Implementation approach:**
- Reuse `SpeakingStepView` rendering (mic button, Whisper grading, transcript card, try-again flow)
- Create a wrapper component that feeds `SpeakingStep` objects to the existing view
- Pull phrases from course atoms + lesson dialogue lines
- Filter by module level

**Phrase bank:** `src/features/practice/data/ja-speaking-prompts.ts`
```typescript
export type SpeakingPrompt = {
  id: string;
  targetPhrase: string;     // kana
  translation: string;      // English
  mode: "echo" | "response";
  /** For response mode: the question audio to play */
  promptAudio?: string;
  /** Module level requirement */
  minModule: string;
};
```

### Components to create
- `src/features/practice/SpeakingPracticePage.tsx` — practice surface
- `src/features/practice/data/ja-speaking-prompts.ts` — prompt bank
- Wrapper component that renders `SpeakingStepView` outside of lesson context

### Route registration
```tsx
{ path: "speaking", element: <SpeakingPracticePage /> },
```

### Tests
- Unit test: every prompt has a valid targetPhrase that exists in the TTS manifest (or is constructible)
- Unit test: module level filter works correctly
- E2E: speaking practice page loads, mic button renders

---

## 5. Counter Practice (Priority: MEDIUM — blocks M12+)

### What it is
Drill for Japanese counter words, which have notoriously irregular readings. Show a quantity + category → pick the correct counter reading.

### Route
`/:lang/practice/counters`

### Data source

Create: `src/features/practice/data/ja-counters.ts`

```typescript
export type CounterDef = {
  id: string;              // "nin", "hon", "mai", etc.
  kanji: string;           // 人, 本, 枚
  meaning: string;         // "people", "cylindrical objects", "flat objects"
  readings: Array<{
    number: number;        // 1-10 (some counters go higher)
    reading: string;       // さんにん, さんぼん, さんまい
    irregular: boolean;    // true if it differs from the regular pattern
  }>;
  introducedAtModule: string;
  examples: string[];      // ["3 bottles of beer", "2 pencils"]
};
```

Counters to include: 人 (M5), 時 (M12), 分 (M12), 個 (M14), 枚 (M14), 本 (M14), 匹 (M14), 杯 (M22), 台 (M18), 回 (M26), 歳/才 (M20).

### UI flow

```
┌─────────────────────────────────────┐
│  Counter Practice                   │
│                                     │
│  Counter: [本 (cylindrical) ▾]      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   🍶🍶🍶                    │    │
│  │   3 bottles                 │    │
│  │                             │    │
│  │   How do you count this?    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ さんぼん  │  │ さんほん  │        │
│  └──────────┘  └──────────┘        │
│  ┌──────────┐  ┌──────────┐        │
│  │ さんぽん  │  │ さんこ   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  Score: 8/10                        │
└─────────────────────────────────────┘
```

**Distractor generation:** The whole point is irregular readings. Distractors should be common mistakes:
- Regular reading when irregular is correct (さんほん vs さんぼん)
- Wrong counter entirely (さんこ for bottles)
- Wrong number reading (しにん vs よにん)

**TTS on answer:** play the correct reading after answer so the learner hears it.

### Components to create
- `src/features/practice/CounterPracticePage.tsx`
- `src/features/practice/data/ja-counters.ts`

### Route registration
```tsx
{ path: "counters", element: <CounterPracticePage /> },
```

### Tests
- Unit test: every counter has readings for numbers 1-10
- Unit test: irregular readings are flagged correctly
- Unit test: distractors include the most common error patterns for each counter

---

## 6. Mock Test / N5 Simulation (Priority: LOW — build with M30)

### What it is
Timed JLPT N5 practice test matching the real test format: Vocabulary (20 min), Grammar + Reading (40 min), Listening (30 min). Score breakdown by section.

### Route
`/:lang/practice/mock-test`

### Format (mirrors actual JLPT N5)

**Section 1 — Vocabulary (20 min, ~21 questions):**
- Kanji reading: show kanji word → pick the correct hiragana reading
- Orthography: show kana word → pick the correct kanji
- Contextual: sentence with a bold word → pick the best meaning
- Paraphrasing: sentence → pick the closest-meaning sentence

**Section 2 — Grammar + Reading (40 min, ~22 questions):**
- Grammar fill-in: sentence with blank → pick correct grammar form
- Sentence composition: 4 sentence fragments → arrange into correct order
- Short passage + questions (2-3 passages, 2 questions each)
- Information retrieval: flyer/schedule/sign + question

**Section 3 — Listening (30 min, ~24 questions):**
- Task-based: listen to dialogue + question → pick answer from 4 pictures/options
- Key-point: listen to dialogue → pick what the speaker will do
- Verbal expressions: listen to situation + question → pick the best response
- Quick response: hear a short statement → pick the natural reply

### Implementation notes
- Timer UI component: countdown per section, auto-advance on timeout
- Score calculation: raw score per section + estimated pass/fail
- History: store past test results in localStorage for progress tracking
- Question bank: draw from the full atom pool + authored passages/dialogues
- Randomize question order per attempt

This is the largest practice feature. Defer to Phase 6 (M28-M30 content authoring). The other 5 features should ship first.

### Components to create
- `src/features/practice/MockTestPage.tsx` — test runner
- `src/features/practice/components/MockTestTimer.tsx`
- `src/features/practice/components/MockTestResults.tsx`
- `src/features/practice/data/ja-mock-test-bank.ts` — question bank

---

## Implementation order

| Phase | Feature | Blocks | Estimated effort |
|-------|---------|--------|-----------------|
| 1 | Conjugation Practice | M8 (adj conjugation) | 2-3 days |
| 1 | Kanji Recognition | M8 (kanji track) | 1-2 days |
| 2 | Reading Practice + step type | M10 (past tense reading) | 2-3 days |
| 2 | Speaking Practice | Enhances all modules | 1-2 days |
| 3 | Counter Practice | M12 (time counters) | 1 day |
| 4 | Mock Test | M30 (capstone) | 3-5 days |

**Total: ~10-16 dev-days across all 6 features.**

Phase 1 (Conjugation + Kanji) is the critical path — these must exist before M8 content can ship. Phase 2 (Reading + Speaking) should land before M10. Counter practice can slip to M12 timeline. Mock test is M30.
