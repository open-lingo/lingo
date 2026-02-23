# Alphabet Learning Course — Mastery Model & Lesson Flow

**Status:** Planning  
**Scope:** Reuse lesson player logic; add custom alphabet-specific steps. Writing System Orientation (Lesson 1), SRS-influenced mastery, client-side delta sync, confusion weighting, writing-system hooks.

---

## 1. First Lesson: Writing System Orientation

**Not drill-heavy.** "What are you about to learn, and how does it work?" — Reduce fear and cognitive overload.

### Goals

- Explain writing system type
- Compare to user's native language
- Set expectations
- Give immediate small success

### Structure of Lesson 1

#### Section A: Writing System Overview

Content depends on `writing_system_type`:

| Type | Explanation |
|------|-------------|
| **Alphabet** (Spanish, Russian) | Letters = sounds; blend to read; some spelling irregularities later. Native comparison: "Spanish maps more consistently to sounds than English." |
| **Abugida** (Korean, Hindi) | Consonants + vowels combine into blocks; each block = syllable; not thousands of symbols. Show: initial + vowel + optional final. Demo: ㄱ + ㅏ = 가 |
| **Syllabary** (Japanese Kana) | Each character = full syllable; no blending; small grid pattern |
| **Abjad** (Arabic, Hebrew) | Mostly consonants; vowels implied; letters may change shape (Arabic) |

#### Section B: Native Language Comparison Block

Dynamic based on `native_language`:

```json
{
  "native_language": "en",
  "comparison_points": [
    "This language writes right-to-left.",
    "Unlike English, spelling is consistent.",
    "Unlike English, vowels may not always appear in writing."
  ]
}
```

Data source: `writing_system_comparisons[native_language]` — avoid hardcoding.

#### Section C: Micro Win

- Teach 2 symbols
- Immediate success drill
- Show: "You can now read X combinations."
- Reduces intimidation

---

## 2. 3-Step Letter Learning Loop (Per-Symbol Drill)

Designed for phonetic or semi-phonetic alphabets (Greek, Cyrillic, Hangul, etc.). This is the drill structure for each symbol after Lesson 1.

### Step 1 — Introduce Sound + Symbol

**Goal:** Build first association.

**Display:**
- Large symbol centered
- IPA pronunciation
- Native-language hint (short, approximate)
- 1 example syllable or word (optional, very short)

**Audio:**
- Play clean native pronunciation (1–2 times)
- Optional slow version toggle

**User Action:**
- Tap "Play" to hear again
- Tap "Continue" once ready

**Keep it short:** 5–10 seconds max before moving on.

**Example format:**
```
Letter:  β
Sound (IPA): /v/
English hint: like "v" in "van"
Audio: ▶
```

**Native-language hint guidelines:**
- Use closest approximate sound
- Avoid misleading exact equivalence
- Keep hint under 6 words
- Add note like "not exactly English X" only if necessary

**Lesson step type:** `symbol_intro` (extend `teach` or new type)

---

### Step 2 — Write / Trace the Symbol

**Goal:** Reinforce form + sound.

**Display:**
- Faded outline or stroke guide (optional toggle)
- Animation of stroke order (optional replay)

**User Action:**
- Trace (touchscreen) OR draw with mouse
- Say the sound aloud while writing (prompt displayed)
- Minimum 2 correct attempts
- Auto-check rough shape similarity (tolerance-based)

**Feedback:**
- Simple: "Good shape" / "Try again"
- No long explanations

**Progress Rule:** Must complete 2–3 correct writes before moving on.

**Lesson step type:** `symbol_trace`

**New requirements:**
- Stroke order / outline data per symbol
- Canvas component (touch + mouse)
- Shape similarity check (tolerance-based)
- `minCorrectAttempts` config (default 2)

---

### Step 3 — Recall & Discriminate

**Goal:** Force active retrieval.

#### Phase A — Sound → Symbol (Recognition)
- Play audio only
- Show 3–5 symbols (include visually similar distractors)
- User selects correct symbol
- Repeat 2–3 times

#### Phase B — Sound → Symbol (Production)
- Play audio only
- Blank canvas (no guide)
- User writes from memory
- Shape-check for pass

#### Phase C — Symbol → Sound (Optional Reverse)
- Show symbol
- User taps to hear or selects matching sound from options

**Lesson step types:**
- Phase A: `symbol_recognition` (or `multiple_choice` variant)
- Phase B: `symbol_trace` with `guideHidden: true`
- Phase C: `symbol_to_sound` (new)

**New requirements:**
- Distractor selection logic (visually similar symbols)
- Audio playback pipeline
- Optional recording / selection for reverse check

---

### Loop Flow per Symbol

```
[ symbol_intro ] → [ symbol_trace (with guide) ] → [ symbol_recognition ] → [ symbol_trace (no guide) ]
                                                                          → [ symbol_to_sound ] (optional)
```

Session generator interleaves multiple symbols rather than finishing one symbol entirely before the next.

---

### Data Requirements for 3-Step Loop

| Field | Purpose |
|-------|---------|
| `ipa` | IPA pronunciation per symbol |
| `nativeHint` | Short native-language hint per symbol |
| `exampleWord` | Optional example syllable/word |
| `audioKey` | Asset key or URL for pronunciation |
| `strokeData` | SVG paths or stroke order for trace step |
| `minCorrectAttempts` | Config (default 2–3) for trace step |
| Distractor rules | Confusion groups or section-based similar symbols |

---

## 3. Expanded Mastery Model (SRS-Influenced)

**Not** pure Leitner. **Not** full SM-2. Use **lightweight adaptive mastery with decay**.

### Symbol Mastery State (client model)

```ts
type SymbolMasteryState = {
  symbol_id: string;        // uuid
  exposures: number;
  correct: number;
  incorrect: number;
  streak: number;
  last_seen: number;        // unix timestamp
  ease_factor: number;
  interval: number;         // days
  next_due: number;         // unix timestamp
  confusion_errors: Record<string, number>;  // symbol_id -> count
};
```

### Mastery Score Formula

```
accuracy_score   = correct / exposures
recency_weight   = e^(-lambda * days_since_last_seen)
mastery_score    = (accuracy_score * 0.6)
                 + (streak_factor * 0.2)
                 + (interval_factor * 0.2)
```

- `streak_factor`: increases with consecutive correct
- `interval_factor`: grows as review spacing increases
- **Thresholds:** ≥ 0.75 → stable; ≥ 0.90 → mastered

### Review Scheduling Rules

**Correct:**
- `interval = interval * ease_factor`
- `ease_factor += 0.1` (if fast and correct)
- `streak += 1`

**Incorrect:**
- `interval = 1`
- `ease_factor -= 0.2`
- `streak = 0`

Clamp `ease_factor` between 1.3 and 2.5.

---

## 4. Client-Side Aggregation Model (Delta Log)

Like flashcard sync — changes amass on client, sync in batch.

### Pending Updates

```ts
type PendingSymbolUpdate = {
  symbol_id: string;
  delta: {
    correct: number;      // +1, etc.
    incorrect: number;
    streak_change: number;
    ease_delta: number;
    interval_new: number;
  };
  timestamp: number;      // unix
};

// Client stores:
pending_symbol_updates: PendingSymbolUpdate[]
```

### Sync Triggers

- Session end
- App backgrounded
- Manual refresh
- N updates > threshold (e.g. 25)

---

## 5. Backend Merge Strategy

**Do not trust full overwrite.**

For each delta:
1. Fetch current symbol state
2. Apply delta
3. Recalculate mastery server-side
4. Save

**Conflict resolution:**
- If client timestamp older than server: merge numerically, recompute interval
- **Never** blindly overwrite

---

## 6. Adaptive Symbol Selection (Session Generator)

**Priority order:**
1. Due symbols (`next_due <= now`)
2. Low mastery symbols
3. Confusion pairs (A/B confused ≥ 3 times)
4. New symbols (if mastery threshold reached)

**Max new symbols per session:** 2–3

---

## 7. Confusion Weighting Model

If user confuses A with B ≥ 3 times:
- Create temporary "confusion cluster"
- Force side-by-side drill next session
- Increase frequency of both symbols
- Decay confusion weight over time if no longer repeated

---

## 8. Writing System Specific Hooks

| System | Unlock Condition | Unlocks |
|--------|------------------|---------|
| **Abugida** | ≥ 4 consonants mastered, ≥ 3 vowels mastered | Combination drills |
| **Abjad** | 60% consonant mastery | Vowel diacritics stage |
| **Syllabary** | — | Unlock rows sequentially |

---

## 9. Lesson Player Flow (Full Cycle)

1. User presses Play
2. Engine: pull due symbols, add review, add 2 new (if eligible)
3. Inject native comparison hint if first exposure
4. Run drill cycle
5. Log deltas
6. Show mastery summary
7. Batch sync

---

## 10. Data Schema Additions

### languageConfig / AlphabetDef

- `writing_system_type`: `"alphabet"` | `"abugida"` | `"syllabary"` | `"abjad"`
- `writing_system_comparisons`: `Record<nativeLanguageId, string[]>` — comparison points for Section B

### Lesson 1 (Writing System Orientation)

- Custom step type(s) or variant of `info`/`teach`:
  - `writing_system_overview` — Section A content
  - `native_comparison` — Section B (uses `writing_system_comparisons`)
  - `micro_win` — Section C (teach 2 symbols + drill)

- **3-step loop step types (Section 2):**
  - `symbol_intro` — Introduce sound + symbol (IPA, hint, audio)
  - `symbol_trace` — Write/trace with optional stroke guide
  - `symbol_recognition` — Sound → symbol (choose from 3–5 options)
  - `symbol_to_sound` — Symbol → sound (optional reverse check)

### Symbol Model

- Symbol has `id`, `character`, `section_id`, `romanization`, etc.
- **3-step loop fields (per symbol):** `ipa`, `nativeHint`, `exampleWord`, `audioKey`, `strokeData`, `minCorrectAttempts`
- Symbol mastery state stored per user per symbol (client + backend)

---

## 11. Next Steps — What to Harden First

Three options:

1. **Data schema** — Formal JSON schema for alphabet course, Lesson 1 structure, symbol mastery state, delta format
2. **Frontend engine** — Session generator, mastery formulas, lesson player flow, delta accumulation
3. **Backend merge logic** — Delta merge API, conflict resolution, symbol state persistence

**Recommendation:** Start with **data schema** — it underpins both frontend and backend. Define:
- Lesson 1 step types / JSON structure
- `writing_system_type` and `writing_system_comparisons` in alphabet config
- Symbol mastery state shape
- Delta payload shape

Then frontend can build against the schema, and backend can implement the merge contract.

---

## 12. Existing Pieces to Reuse

- **Lesson player:** `LessonPage`, `StepRenderer`, step types (info, teach, multiple_choice, etc.)
- **Alphabet config:** `AlphabetDef`, `AlphabetSection`, `characterRomanization` in `languageConfig.ts`
- **SRS patterns:** `srsStorage`, `srsSync` (delta pattern) in flashcards
- **Sync pattern:** `useSRSyncSession`, `performSync` — similar batch-sync approach
