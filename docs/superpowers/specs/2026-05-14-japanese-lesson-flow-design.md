# Japanese lesson flow — vertical slice (a-row)

**Date:** 2026-05-14
**Status:** Design, awaiting implementation
**Brainstorm thread:** session-local; key decisions encoded in §2
**Scope:** Phase 1 / vertical slice — a-row only, end-to-end

## 1. Goals & non-goals

### Goals

Build the first vertical slice of the new Japanese curriculum: one course
lesson that introduces the a-row hiragana (`あ い う え お`) alongside
meaningful anchor words, with a learner-first annotation system that shows
romaji helpers above kana the learner hasn't yet mastered. Prove every
layer of the design — renderer, mastery state, data model, session content,
and integration with the existing lesson player and flashcard surfaces —
on this one slice before generalizing to the rest of the curriculum.

### Non-goals (Phase 1)

- Other kana rows (ka-row → wa-row, dakuten, handakuten, yōon). Phase 2.
- An auto-generator that builds lessons from a row-spine catalog. Phase 2.
- `<AnnotatedJa>` integration in stories (deck stories + story embeds).
  Phase 2.
- Kanji ramp — kana-over-kanji rendering and per-kanji mastery state.
  Phase 3 (separate spec).
- Touching the standalone alphabet learner
  (`/practice/alphabet/hiragana/learn`). It stays as a free-practice
  surface; the curriculum lesson player gets the new flow.
- Replacing the existing `srsStorage` / `srsSync` infrastructure for cards.
  Kana mastery state is a *parallel* store reusing the same delta-sync
  pattern, not a refactor of the existing system.

## 2. Locked pedagogical decisions

These come from the brainstorm Q&A on 2026-05-14. Each is a hard constraint
on the implementation.

1. **Japanese only.** No script-agnostic generalization. Hangul / other
   scripts keep their current flow.
2. **Kanji is delayed.** First phase of the curriculum is pure kana
   (annotation: romaji-over-kana). The kanji ramp (annotation:
   kana-over-kanji = real furigana) is the same primitive applied later,
   designed for but not built in Phase 1.
3. **Row-spine curriculum, anchor words allowed regardless of kana
   coverage.** Lessons step through canonical kana rows. Anchor words —
   real Japanese vocab with meaning — appear from day 1 even when they
   contain kana not yet introduced. The renderer carries the lifting via
   romaji helpers above unfamiliar kana.
4. **Auto-fade per kana, conservative threshold.** No user-facing toggle.
   The helper above a kana hides only when the kana has crossed a
   *generous* mastery bar — 20 exposures **and** SRS interval ≥ 7 days
   (AND-gate, not OR). A kana the learner aced five times yesterday still
   shows its helper.
5. **Annotation primitive applies everywhere JA text appears.** One
   `<AnnotatedJa>` component, used in every lesson step that renders
   Japanese, every flashcard preview, every vocab card. Stories deferred to
   Phase 2 but treated as an obvious next consumer.
6. **Lessons are the canonical curriculum surface.** Each lesson contains
   the full mix of kana-teaching steps + word drills inline. The standalone
   alphabet learner stays as an unchanged free-practice path.

## 3. Architecture

### 3.1 `<AnnotatedJa>` renderer

`src/shared/japanese/AnnotatedJa.tsx` — the single source of truth for
rendering Japanese text.

```ts
// Bare string — renderer tokenizes + auto-resolves romaji from a global lookup
type AnnotatedJaBareProps = {
  text: string;                     // "みず", "私は学生です", etc.
  // When provided, scopes mastery lookups to a specific user (test harness).
  // Otherwise reads the current authenticated user from context.
  userId?: string;
};

// Annotated form — author supplies per-segment readings
type AnnotatedJaSegmentsProps = {
  segments: AnnotatedJaSegment[];
  userId?: string;
};

type AnnotatedJaSegment = {
  /** Surface text — what the learner sees on the baseline. May be kana or
   *  kanji. For pure-kana segments this is the same as `reading`. */
  surface: string;
  /** Kana reading of the segment. For kanji words, this is what would be
   *  in furigana. For kana segments, equal to `surface`. */
  reading: string;
  /** Romaji for the segment (for the romaji-over-kana helper). Optional —
   *  if omitted, the renderer derives it from `reading` via the kana table. */
  romaji?: string;
  /** Optional grammatical role (e.g. "particle"). Reserved for future styling. */
  role?: "word" | "particle" | "punctuation";
};

type Props = AnnotatedJaBareProps | AnnotatedJaSegmentsProps;
```

**Behavior**

- Output is an inline HTML `<ruby>` element. Each character of the surface
  string is wrapped in `<rb>`; the corresponding helper text goes in `<rt>`.
- Helper visibility is per-character. For each surface character, the
  renderer calls `useKanaHelperVisible(char)` and includes or omits the
  `<rt>` content based on the result. A kana that appears twice in the
  same word (e.g. ここ) gets the same treatment on both occurrences, by
  design — the visibility key is the character, not the position.
- For kana characters, the helper is the romaji (`mizu` over `みず`).
- For kanji characters (Phase 3), the helper is the kana reading from
  `AnnotatedJaSegment.reading` (`みず` over `水`). The same `<ruby>`
  element handles both — only the mapping function changes.
- The `<rt>` content fades in/out with a 200ms CSS transition so a kana
  crossing the threshold mid-session doesn't pop.
- The renderer registers each rendered character with the mastery tracker
  via `useTrackExposure(char)` so that "rendered in the wild" counts as an
  exposure (not just being drilled).

**Bare-string tokenization**

For any kana-only string, the renderer:

1. Splits the string into characters (Unicode code points; yōon combos
   like りゃ are handled by checking the next char for ゃ/ゅ/ょ and merging).
2. For each token, looks up romaji from `KANA_ROMAJI` — a flat
   `Record<string, string>` that combines hiragana and katakana
   romanizations exported from `languageConfig.JA_HIRAGANA` and
   `JA_KATAKANA`.
3. If the token is not a kana character (kanji, punctuation, latin, space),
   it's rendered as a plain `<span>` with no `<rt>` — no annotation.

**Why HTML `<ruby>`**

Native ruby gives correct cross-browser typography for vertical alignment
of the helper above the base text, plus accessibility (screen readers
treat `<rt>` content correctly), without needing per-character CSS grid.
Reference: `lingo/docs/TTS_PLANNING.md` and existing browser ruby support
on every target we care about.

### 3.2 Per-user kana mastery state

`src/features/japanese/kanaMastery/` — a parallel store to flashcard SRS.

```ts
type KanaMasteryState = {
  kana: string;          // "み" — primary key
  exposures: number;     // every render via AnnotatedJa + every drill
  correctCount: number;  // recognition / production drills only
  incorrectCount: number;
  streak: number;
  lastSeen: string;      // ISO 8601 datetime
  easeFactor: number;    // SM-2-ish, clamped [1.3, 2.5]
  interval: number;      // days until next "due"
  dueDate: string;       // YYYY-MM-DD
};

type KanaMasteryStore = Record<string /* kana */, KanaMasteryState>;
```

**Storage**

- Client: localStorage under `kanaMastery:v1:<userId>`. Mirrors the existing
  `srsStorage` pattern in `src/features/flashcards/engine/srsStorage.ts`.
- Backend: new endpoint family `/api/core/v1/kana/*` mirroring the SRS one
  (`/state`, `/sync`, `/all`) — see §7.2 for the API contract.

**Sync**

Reuses the existing delta-sync pattern from `srsSync.ts`. A `KanaMasterySync`
module produces a `SyncPayload` of dirty states; a `performSync()` call
mirrors flashcard sync behavior. Triggers: session end, app backgrounded,
threshold of N dirty updates.

**Derived signals**

```ts
function helperHidden(state: KanaMasteryState | undefined): boolean {
  if (!state) return false;
  return state.exposures >= 20 && state.interval >= 7;
}
```

The AND-gate is the "generous" knob from §2.4. Both conditions must hold —
high exposure count alone isn't enough, and a high SRS interval alone isn't
enough.

`useKanaHelperVisible(char)` is a React hook that reads the mastery store
via context, calls `helperHidden`, and inverts. The hook subscribes to
state changes so a kana flipping in the middle of a session updates the
displayed annotation without a remount.

**Exposure tracking**

```ts
function useTrackExposure(char: string): void {
  // Increments exposures + updates lastSeen for this kana once per mount.
  // Debounced via a Set keyed on (sessionId, char) so a kana rendered
  // 10 times in one screen counts as one exposure, not 10.
}
```

The session debounce prevents pathological cases (a sentence with three
`は`s shouldn't add 3 exposures to は from a single read).

### 3.3 Data model extensions

Three small additions; everything else is unchanged.

**A. New `JapaneseAnnotation` type** (used by `<AnnotatedJa>` segments):

```ts
// src/shared/japanese/types.ts
export type JapaneseAnnotation = {
  surface: string;       // "水" (kanji) or "みず" (kana)
  reading: string;       // "みず" (the kana form for furigana / helper resolution)
  romaji?: string;       // "mizu" — optional override for the auto-lookup
  role?: "word" | "particle" | "punctuation";
};
```

**B. Optional `annotation` field on existing `CardSegment`:**

```ts
// src/features/flashcards/data/types.ts (existing file, additive change)
export type CardSegment = {
  segment: string;
  meaning?: string;
  particleId?: string;
  /** When set, this segment renders via AnnotatedJa with these readings.
   *  When omitted, the segment renders as bare kana (auto-romaji from the
   *  global lookup). Kanji-containing segments MUST set this. */
  annotation?: JapaneseAnnotation[];
};
```

Backwards-compatible: every existing card today has `annotation: undefined`
and the renderer falls back to bare-string mode.

**C. Optional `annotation` on lesson step payload fields that render JA text:**

Affected types in `src/features/lesson/types.ts`:

```ts
TeachVocab.annotation?: JapaneseAnnotation[];   // overrides plain `term`
MultipleChoiceStep.promptAnnotation?: JapaneseAnnotation[];
BuildSentenceStep.targetAnnotation?: JapaneseAnnotation[];
TranslateStep.sourceAnnotation?: JapaneseAnnotation[];
ListeningComprehensionStep.transcriptAnnotation?: JapaneseAnnotation[];
ListeningBuildStep.targetAnnotation?: JapaneseAnnotation[];
SpeakingStep.targetAnnotation?: JapaneseAnnotation[];
```

Every step view that renders a JA string switches from rendering the bare
text to rendering `<AnnotatedJa text={fallback} segments={annotation} />`.
If `annotation` is provided, the renderer uses it; otherwise it falls back
to bare-string mode on `text`. No step view loses functionality if
`annotation` is omitted.

## 4. Curriculum content: a-row Lesson 1

One concrete lesson, hand-authored, added to the Japanese course as the
first non-intro lesson. The current `mockCourse.ts` shows lessons
`m1-l1` "Greetings" and `m1-l2` "Numbers 1–10" as Korean placeholders; we
add a new lesson `ja-m1-l1` for the Japanese course only.

**Title:** *Vowels: あ い う え お*

**Introduces:** あ, い, う, え, お (a-row hiragana)

**Anchor words used:**

| Word | Kana | Romaji | Meaning | Notes |
|---|---|---|---|---|
| ai | あい | ai | love | pure a-row |
| ie | いえ | ie | house | pure a-row |
| ue | うえ | ue | above | pure a-row |
| aoi | あおい | aoi | blue | pure a-row |
| mizu | みず | mizu | water | helper on み, ず (introduces concept of helpers for *not-yet-introduced* kana) |

**Step sequence** (using existing step types where possible):

| # | Step type | Content |
|---|---|---|
| 1 | `info` | "In this lesson you'll learn the five vowels of Japanese — あ い う え お — and a few words built from them. You'll also meet a couple of words with kana we haven't taught yet; we'll show romaji helpers above the unfamiliar ones." |
| 2 | `symbol_intro` | あ — IPA, hint "like 'a' in 'father'", example あい |
| 3 | `symbol_recognition` | Hear あ; pick from あ / い / う |
| 4 | `symbol_intro` | い |
| 5 | `symbol_recognition` | Hear い; pick from い / え / う |
| 6 | `symbol_intro` | う |
| 7 | `symbol_recognition` | Hear う; pick from う / お / い |
| 8 | `teach` | `vocab: { term: "あい", translation: "love", audioKey: <hash>, annotation: [{surface:"あい", reading:"あい"}] }` |
| 9 | `multiple_choice` | "What does あい mean?" → love / house / above / blue |
| 10 | `symbol_intro` | え |
| 11 | `symbol_recognition` | Hear え; pick from え / お / あ |
| 12 | `symbol_intro` | お |
| 13 | `symbol_recognition` | Hear お; pick from お / あ / え |
| 14 | `teach` | `vocab: { term: "いえ", translation: "house", ... }` |
| 15 | `teach` | `vocab: { term: "うえ", translation: "above", ... }` |
| 16 | `match_pairs` | Match あい/いえ/うえ/あおい ↔ love/house/above/blue |
| 17 | `teach` | `vocab: { term: "みず", translation: "water", ..., annotation: [{surface:"みず", reading:"みず"}] }` — み and ず are *not* introduced yet so the renderer shows romaji helpers on both |
| 18 | `multiple_choice` | "Which kana is at the start of みず?" → み / な / ぬ — recognition only (the helper above み remains since the learner hasn't crossed the mastery threshold yet) |
| 19 | `translate` | "Type 'blue' in Japanese" → accepted: あおい |
| 20 | `info` | "Nice work. You learned 5 hiragana and 5 words. The romaji helpers above み and ず in 'mizu' will stay until you've drilled those kana later. Tap continue to finish." |

**TTS:** every Japanese string in steps 8–19 needs an audio file. Reuse the
existing `lingo-core/scripts/tts/generate.py` Edge-TTS pipeline; the
inputs become "every `term` and `targetSentence` and `transcript` in the
new lesson plus the existing deck card fronts." This is exactly the
existing flow — no new TTS work for this slice.

**File:** `src/features/lesson/data/mock-ja-m1-l1.ts`, hand-authored, in
the same format as `mock-m1-l1.ts`.

## 5. Session generator (Phase 1)

Phase 1 deliberately punts the auto-generator. The one lesson is
hand-authored as a static `LessonContent`. The generator question is real
but blocked by needing a row-spine catalog and a way to express "lesson
templates" — which is Phase 2 work.

**Phase 2 generator sketch** (not built now, documented here so the data
model doesn't paint us into a corner):

- A `kanaCurriculum.ts` declares the row order: `["a", "ka", "sa", ...]`
  with each entry naming the kana set.
- An `anchorWordLibrary.ts` lists candidate anchor words with their
  annotation segments and the kana they require.
- A `generateLessonForRow(rowId, userMastery)` function picks the row's
  kana to introduce + selects anchor words that use a *manageable* number
  of helper-bearing kana (heuristic: prefer words where most kana are
  already mastered or in the current row).
- Steps are templated from the kana set + anchor word set using the same
  step types as Phase 1.

The Phase 1 hand-authored lesson is the reference template for what the
Phase 2 generator should emit.

## 6. Integration plan

### 6.1 Lesson step views

For each step view file in `src/features/lesson/components/steps/` that
currently renders a Japanese string as plain text, replace the bare render
with `<AnnotatedJa text={...} segments={annotation} />`. Where the step
type doesn't yet have an `annotation` field, the bare-string path handles
it correctly with auto-romaji lookup.

Affected files:

- `TeachStepView.tsx` — renders `vocab.term`
- `MultipleChoiceStepView.tsx` — renders `prompt`
- `BuildSentenceStepView.tsx` — renders `targetSentence` and tile labels
- `MatchPairsStepView.tsx` — renders each pair's `source`
- `FillBlankStepView.tsx` — renders the sentence template
- `TranslateStepView.tsx` — renders `sourceText` when the source is the
  target language
- `ListeningComprehensionStepView.tsx` — renders `transcript`
- `ListeningBuildStepView.tsx` — renders `targetSentence` and tiles
- `SpeakingStepView.tsx` — renders `targetPhrase`

The `symbol_*` step views are already character-by-character and have the
kana mastery context already; they just need to call `useTrackExposure`
on the focused symbol when the step mounts (or, equivalently, render the
focused symbol via `<AnnotatedJa text={char} />` which handles tracking
automatically).

### 6.2 Flashcard previews

`src/features/flashcards/` — the deck list, deck preview, and tester all
render `card.front`. Wrap each in `<AnnotatedJa text={card.front} />` in
bare-string mode. For Japanese cards whose `front` is pure kana this works
correctly out of the box (auto-romaji lookup over the unknown kana). For
fronts containing kanji, the kanji characters render as plain `<span>`s
with no annotation — acceptable for Phase 1 since the slice's mastery
state is kana-only anyway. Adding segments-mode annotation to flashcard
fronts (via a new optional `Flashcard.frontAnnotation: JapaneseAnnotation[]`)
is Phase 2 work and listed under §8.

### 6.3 Backend API contract (kana mastery sync)

New router under `app/japanese/kana/router.py`, mounted at
`/api/core/v1/japanese/kana/*`. Endpoints mirror the existing SRS shape:

| Method | Path | Description |
|---|---|---|
| GET | `/state` | Full kana mastery map for the authenticated user |
| POST | `/sync` | Delta sync (same payload shape as `/api/core/v1/srs/sync`) — last-write-wins by `lastSeen` |
| DELETE | `/all` | Wipe all kana mastery (dev / reset utility) |

Storage: SQLite (`japanese_kana_mastery` table, schema mirrors `srs_cards`
with `kana` replacing `card_id`); DynamoDB single-table item type
`PK=USER#<uuid>` + `SK=KANA#<char>`.

### 6.4 Settings touchpoints

No new user-visible toggles in Phase 1. The existing
`showAlphabetRomanization` and `showAlphabetFurigana` booleans in
`UserSettings.learning` are not consumed by `<AnnotatedJa>` — the auto-fade
behavior makes them redundant for the lesson surface. They keep their
meaning for the standalone alphabet learner.

A "force show all helpers" accessibility toggle is a Phase 2 nice-to-have,
documented under §8.

## 7. Backwards compatibility / migration

- Every existing flashcard, deck, and lesson works unchanged. The new
  optional fields (`annotation` on `CardSegment`, `*Annotation` on lesson
  step payloads) default to `undefined`; the renderer falls back to
  bare-string mode.
- Existing `mock-m1-l1.ts` and `mock-m1-l2.ts` (both Korean) are not
  touched in Phase 1. They render the same as today.
- The new `mock-ja-m1-l1.ts` is *added*, not replacing anything.
- Settings keys are not migrated. `showAlphabetRomanization` and
  `showAlphabetFurigana` stay as-is; they're orthogonal to
  `<AnnotatedJa>`.
- The standalone alphabet learner at
  `/practice/alphabet/hiragana/learn` is not modified.

## 8. Deferred work

### Phase 2 (own spec, follows this one)

- Hand-authored lessons for the rest of the rows (ka-, sa-, ta-, na-, ha-,
  ma-, ya-, ra-, wa-row, dakuten, handakuten, yōon).
- The auto-generator described in §5.
- Story embed integration: `<StoryWord>` and friends use `<AnnotatedJa>`.
- Flashcard **segments-mode** annotation: optional
  `Flashcard.frontAnnotation: JapaneseAnnotation[]` (and matching
  `backAnnotation`) for cards whose `front` contains kanji. Phase 1 falls
  back to bare-string mode for these.
- "Force show all helpers" accessibility setting for users who want to
  override the auto-fade.

### Phase 3 (own spec)

- Kanji ramp. The `JapaneseAnnotation.surface` field is already the place
  the kanji form lives; the `reading` field is already where furigana
  lives. Phase 3 adds a `kanjiMasteryState` parallel to the kana one and
  flips `<AnnotatedJa>` to use the kana-over-kanji branch for any segment
  whose `surface ≠ reading`.

### Out of scope indefinitely

- Replacing the standalone alphabet learner. It's a different mental model
  (drill-focused, no curriculum context) and serves a real use case.
- Bundling a custom Japanese font. We rely on system fonts (Hiragino, Yu
  Gothic, Noto Sans JP) via the CSS stack in `tts-tester.html` and the
  brainstorm page.
- Romaji-as-input. The `translate` step's `acceptedAnswers` stay as
  Japanese-string-only; we don't accept "ie" as a valid answer for "house"
  in Phase 1.

## 9. Risks / open questions

- **Yōon tokenization.** Kana like りゃ / りゅ / りょ are two code points but
  one "syllable" with a single romaji ("rya" / "ryu" / "ryo"). The
  renderer's tokenizer needs a small lookahead. Spec'd here so the
  implementer doesn't miss it; not a blocker.
- **Mature-threshold tuning.** 20 exposures + 7-day interval is a starting
  point. We may discover learners cross it too fast or too slow once we
  ship the slice. The threshold lives in one place (`helperHidden` in
  §3.2) so tuning is a one-line change.
- **Exposure-tracking debounce semantics.** The "once per session" debounce
  could under-count for learners doing very long sessions. Acceptable for
  Phase 1; revisit if mastery progress feels too slow.
- **Lookalike anchor words.** Choosing みず as the demonstrator of "kana
  not yet introduced" assumes the learner will encounter み and ず before
  finishing the lesson. If they're motivated and finish the lesson in 5
  minutes, the helpers above み/ず will still be on the next time they
  see みず — by design, given the conservative threshold. Verify this
  feels right in user testing.
- **Backend rollout.** The new `/api/core/v1/japanese/kana/*` endpoints
  require a Lambda redeploy. Until then, kana mastery is client-only
  (works fine for the slice; no cross-device sync).

## 10. Implementation order

A suggested order for the writing-plans step to break into discrete tasks:

1. **Foundations**: `src/shared/japanese/types.ts` with `JapaneseAnnotation`;
   `src/shared/japanese/kanaTable.ts` exporting `KANA_ROMAJI` derived from
   `languageConfig.JA_HIRAGANA.characterRomanization` (and katakana). Pure
   data, no behavior.
2. **Mastery store** (client-only): `kanaMastery/` module mirroring
   `srsStorage`. localStorage backed. Hooks: `useKanaMastery`,
   `useTrackExposure`, `useKanaHelperVisible`.
3. **`<AnnotatedJa>` component**: bare-string mode first, segments mode
   second. Includes yōon tokenization. Unit-tested for both modes plus
   helper visibility flips.
4. **Step view integration**: thread `annotation` through `lesson/types.ts`,
   update each step view to use `<AnnotatedJa>`. One PR per step view
   keeps reviews small; or one PR for all if changes are uniform.
5. **Flashcard preview integration**: same pattern, smaller surface.
6. **New lesson content**: hand-author `mock-ja-m1-l1.ts` per §4; register
   it in `mockLessons.ts`; register the lesson in the Japanese course in
   `mockCourse.ts`.
7. **TTS regeneration**: run `lingo-core/scripts/tts/generate.py` to
   produce mp3s for the new lesson's vocab. No code changes needed.
8. **Backend mastery sync API**: new `app/japanese/kana/` router + SQLite +
   DynamoDB schemas + Mangum redeploy. Can land in parallel with frontend
   work; client falls back to local-only until the API exists.
9. **End-to-end manual test**: start a fresh user, complete
   `ja-m1-l1`, verify helpers appear above み/ず in step 17, verify
   exposures increment, verify (in DevTools) that the mastery store
   updates. Confirm bare-string mode renders Korean lessons unchanged.
