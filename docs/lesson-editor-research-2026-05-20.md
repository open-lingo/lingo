# Lesson Editor — Research Synthesis (2026-05-20)

Synthesizes a 5-lane parallel research swarm across the lesson data model, vocab/word structure, flashcards + SRS engine, current admin surfaces, and the authoring/persistence pipeline. The goal: a 100% picture of what an in-app lesson editor must expose, where to mount it, and what is missing.

This is research output. Architecture decisions are flagged but not made.

---

## 0. TL;DR

- **Lessons are 100% static TypeScript** compiled into the JS bundle (~70 `mock-*.ts` files, ~13,564 LOC). There is no `LessonsApi`, no backend `lessons` table, no fetch path. The only dynamic content is **decks** (community flashcards).
- **The SRS engine is SM-2, not FSRS-6.** Memory and a couple of doc strings are wrong. Card state is `{easeFactor, interval, dueDate, repetitions, lastReviewDate, lastSyncedAt, buriedUntil}`. There is no stability/difficulty.
- **There are two parallel "lesson" shapes** (pathway stub `Lesson` + full `LessonContent`) and **two parallel "vocab" shapes** (`Flashcard` deck-persisted vs `CourseAtom` curriculum-attributed, 749 atoms, JA only). An editor must reconcile both.
- **22 step types** in `LessonStep` discriminated union (`src/features/lesson/types.ts:472`). Each has its own renderer in `src/features/lesson/components/steps/`. Some step types contain nested step payloads (`row_test.items[].payload`).
- **A natural mount point already exists:** `/admin/content/decks` and `/admin/content/stories` are live; a `/admin/content/lessons` sibling fits the existing `AdminLayout`. The list/filter pattern from `ContentBrowserPage` (FacetSidebar + DataTable) is directly reusable.
- **The editor's hardest architectural question** is the save path. Four options exist (preview-only, dev-server middleware writing TS, build the Content API, misuse the Decks API). Each has tradeoffs — see §7.

---

## 1. Hierarchy at a glance

```
LanguageConfig (id "ja"/"ko" + alphabet + practiceTypes)        src/shared/domain/languageConfig.ts
└── Course (id="mock-1", languageId, title, modules[], sideQuests[])    src/shared/domain/course.ts:66
    ├── CourseModule (id, title, eyebrow, summary, accent, lessons[], comingSoon?)    course.ts:37
    │   └── Lesson  (pathway stub: id, title, status?, kind?, alphabetId?, introducesCardIds?)    course.ts:14
    │       └── LessonContent  (full payload: id, moduleId, courseId, languageId, title, description?,
    │                            estimatedMinutes?, xpReward?, introducesVocabIds?, introducesCardIds?,
    │                            kind?, steps[])                                            types.ts:496
    │           └── LessonStep[]   (22-variant discriminated union)                         types.ts:472
    └── SideQuest (id, title, emoji, meta, unlockAfter?, progress, isDaily?)               course.ts:53
```

**Critical:** the pathway stub `Lesson` and the full `LessonContent` live in different files and have different fields. Joined at runtime by id via `getMockLessonContent(lessonId)` (`mockLessons.ts:420`). The stub carries `status`, `kind: "lesson"|"alphabet"|"recap"|"module_review"`, and `alphabetId`; the content carries `steps`. An editor must keep both in sync.

### Languages and content state

| Lang | Config | Curriculum | Vocab atoms | Audio | State |
|------|--------|-----------|-------------|-------|-------|
| `ja` | full (hiragana+katakana+kanji) | M1 vowels + 9 rows × 3 + M2 dakuten/yōon + M3–M7 grammar spine + sidequest | **749** in `JA_COURSE_ATOMS` (196 taught, 553 future, 10 particles) | full TTS in `src/pub/tts/ja/*` + manifest | shipping |
| `ko` | full (hangul) | M1 vowels + intro only (post-2026-05-19 rebuild) | none (only `RowWord[]` in `koreanCurriculum.ts` + 3 small JSON decks) | none in manifest | alphabet-only |
| `zh`, `es`, `de`, `fr`, `en` | stub | — | — | — | placeholder |

`AVAILABLE_LEARNING_LANGUAGE_IDS = ["ko", "ja"]` (`languageConfig.ts:1019`).

---

## 2. Step taxonomy (22 kinds)

`StepType` union at `src/features/lesson/types.ts:4`. Every step has `{id, type, hint?}`; per-kind fields below.

| Kind | Variant (`types.ts`) | Renderer | Key fields |
|------|---------------------|----------|------------|
| `info` | `InfoStep` :34 | `InfoStepView.tsx` | `title?`, `body`, `imageKey?`, `variant?: "tip"\|"culture"\|"grammar"\|"default"\|"win"` |
| `teach` | `TeachStep` :51 | `TeachStepView.tsx` | `content: {text, vocab?: TeachVocab, note?}`; `TeachVocab` has `breakdown: CardSegment[]`, `annotation: JapaneseAnnotation[]` |
| `multiple_choice` | :66 | `MultipleChoiceStepView.tsx` | `prompt`, `promptAudioKey?/Text?`, `promptImageKey?`, `options[]`, `correctOptionId`, `explanation?`, `audioOnlyPrompt?`, `optionsHideRomaji?`, `optionsRevealRomajiOnSelect?`, annotations on prompt and options |
| `build_sentence` | :106 | `BuildSentenceStepView.tsx` | `prompt`, `targetSentence`, `tiles[]`, `correctOrder[]`, `granularity: "word"\|"character"`, annotation |
| `match_pairs` | :124 | `MatchPairsStepView.tsx` | `prompt`, `pairs[] {id, source, target, sourceAnnotation?}`, `playAudioOnSelect?` |
| `fill_blank` | :141 | `FillBlankStepView.tsx` | `sentence` (with `{{blank}}` markers), `blanks[] {id, correctAnswer, acceptedAnswers?}`, `wordBank?` |
| `translate` | :149 | `TranslateStepView.tsx` | `sourceText`, `sourceLanguage: "target"\|"native"`, `acceptedAnswers[]` |
| `listening_comprehension` | :158 | `ListeningComprehensionStepView.tsx` | `audioKey`, `transcript?`, `romaji?`, `question`, `options[]`, `correctOptionId`, annotation |
| `listening_build` | :172 | `ListeningBuildStepView.tsx` | `audioKey`, `prompt`, `targetSentence`, `tiles[]`, `correctOrder[]`, `granularity` |
| `speaking` | :183 | `SpeakingStepView.tsx` | `targetPhrase`, `translation`, `audioKey?`, `stubbed: boolean` |
| `symbol_intro` | :222 | `SymbolIntroStepView.tsx` | `payload: SymbolStepPayload {symbol, romanization, ipa, hint, note?, example?, audioKey?, scriptId?, hasStrokeOrder?}` |
| `symbol_trace` | :227 | `SymbolTraceStepView.tsx` | payload + `showGuide`, `minCorrectAttempts`, `initialCorrectCount?` |
| `symbol_recognition` | :241 | `SymbolRecognitionStepView.tsx` | payload + `options[] {id, symbol}`, `correctOptionId` |
| `symbol_production` | :249 | `SymbolProductionStepView.tsx` | payload + `minCorrectAttempts` |
| `symbol_to_sound` | :256 | `SymbolToSoundStepView.tsx` | payload + `options[] {id, text, symbol?}`, `correctOptionId` |
| `word_image_mcq` | :277 | `WordImageMcqStepView.tsx` | `meaningEn`, `options[] {id, word, emoji}`, `correctOptionId` (emoji rendered via Noto/lingo-art SVG) |
| `phrase_card` | :322 | `PhraseCardStepView.tsx` | `kana`, `romaji`, `meaningEn`, `cultureNote?` |
| `grammar_rule` | :346 | `GrammarRuleStepView.tsx` | `title`, `rule`, `examples: GrammarExample[]`, `antiPattern?`, `cultureNote?` |
| `particle_cloze` | :366 | `ParticleClozeStepView.tsx` | `prompt: {before, after}`, `correctParticle`, `options[]`, `meaningEn`, `audioText?` |
| `self_explanation_mcq` | :399 | `SelfExplanationMcqStepView.tsx` | `anchor`, `question`, `options[] {id, text, reasonType: "rule"\|"surface"\|"distractor"}`, `correctOptionId` |
| `dialogue_listen` | :449 | `DialogueListenStepView.tsx` | `lines[] {speaker, kana, audioText?}`, `questions[] {prompt, options[], correctOptionId}`, `transcriptRevealAfter?` |
| `row_test` | :462 | `RowTestStepView.tsx` | `rowId`, `items[] {kind: "mc"\|"match"\|"build", payload: <full nested step>}`, `passThreshold` (0.70), `maxRetries` (3) |

**Note:** `docs/dataformats/lessons/README.md` documents a `video` step type — **no such variant exists in TS**. Don't expose.

### What text-bearing step fields accept

Many text-bearing fields carry an optional `*Annotation: JapaneseAnnotation[]` (`shared/japanese/types.ts:10`) for ruby/furigana display — `{surface, reading, romaji?, role?}`. An editor needs a per-text-segment ruby authoring widget across **12+ step kinds**.

---

## 3. Vocab / word / deck model

### Two parallel models

**`CourseAtom`** (`src/features/flashcards/data/ja-course-atoms.ts:24`) — **the curriculum-attribution source of truth** for JA:

```ts
{
  id: string,                  // stable-forever; NEVER rename once shipped
  kana: string, kanji?: string, romaji: string,
  meaningEn: string, emoji?: string,
  fromModule: "m1"|...|"m7"|"sidequest-survival"|"future",
  introducedByLessonId?: string,
  kind: "vocab"|"particle"|"phrase",
  blocked?: boolean,           // excluded from word_image_mcq only
  note?: string                // overloaded: pedagogy / provenance / data-quality
}
```

**`Flashcard`** (`src/features/flashcards/data/types.ts:7`) — the SRS-persisted deck card:

```ts
{
  id, front, back, note?, image?,
  type: "word"|"sentence"|"other",
  reasoning?, definition?, context?, unlocked?,
  // word: parts?: CardSegment[]
  // sentence: words?: CardSegment[]
}
// CardSegment = { segment, meaning?, particleId? }
```

Adapter `courseAtomToFlashcard()` (`ja-course-atoms.ts:818`) is one-way and lossy (drops `fromModule`, `introducedByLessonId`, `kind`, `kanji`, `romaji`, `emoji`, `blocked`). An editor will want `CourseAtom` as the canonical edit model and regenerate the `Flashcard` on save.

**Korean has no `JA_COURSE_ATOMS` equivalent.** KO vocab is fragmented across `koreanCurriculum.ts` `RowWord[]` + 3 JSON decks + `addon-particles.json`. A real editor needs `KO_COURSE_ATOMS` (or a generalized `LanguageAtom`).

### Deck shape (`FlashcardDeck`, types.ts:40)

```ts
{ id, languageId, name, cards: Flashcard[], courseId?, image?, defaultEase?, locale? }
```

`description` exists in deck JSON files but is **silently dropped by the TS interface** — a bug an editor needs to fix.

### Linkage diagram

```
Lesson (mock-ja-mN.ts)             CourseAtom              Flashcard / Deck
─────────────────────────          ────────────────        ─────────────────
LessonStep.id, introducesCardIds   id (= card.id)           card.id
                       ─────►  fromModule + id              │
                                                   buildJaCourseDeck()
                                                            ▼
                       lessonCardMap.ts:LESSON_TO_CARDS ──► unlocked set
                       (sparse: 3 ja lessons + 1 ko mapped)
```

- `lessonCardMap.ts` is **sparse** — only `m1-l0/1/2` for ja, m1-l0 + Hangul stubs for ko. Most "completed" lessons unlock nothing today.
- Slated for replacement by event-bus `vocabGraduation` events (per CLAUDE.md "Vocab SRS unification"). `CourseAtom.introducedByLessonId` already encodes the same data declaratively for 749 atoms — the future source of truth.

### Auto-generated vs hand-authored

| Field | Authored or derived |
|-------|---------------------|
| `CourseAtom.romaji` | **stored but derivable** from kana table; drift risk. Regenerate on save and diff. |
| `Flashcard.front` (course deck) | derived: `kanji ? "${kanji} (${kana})" : kana` |
| `Flashcard.unlocked` | derived at runtime from `lessonCardMap` + completed lessons |
| TTS audio URL | derived from `src/pub/tts/manifest.json[lang:text]` — manifest itself emitted by `lingo-core/scripts/tts/generate.py` |
| Emoji SVG URL | derived from emoji char via `notoEmojiUrl()` / `lingoArtUrl()` |
| Hiragana row sub-lessons | **module-eval-time** generated by `buildRowSubLessons(row)`; hand-authored `mock-ja-m1-{row}.ts` files override via map-spread order |
| Korean consonant-row lessons | runtime-generated by `buildAllKoreanRowLessons()`; no hand-authored overrides yet |

**Quirks the editor must respect:** `を: "o"` (not "wo"), `ぢ: "ji"`, `づ: "zu"`, `ヲ: "o"`. Use the existing kana→romaji table; don't re-derive naively.

---

## 4. Flashcards + SM-2 SRS

### Card state (NOT FSRS-6)

`SRSCardState` (`src/features/flashcards/data/types.ts:55`):
```ts
{
  easeFactor: number,         // SM-2 EF, min 1.3, default 2.5
  interval: number,           // days
  dueDate: string,            // YYYY-MM-DD
  repetitions: number,        // consecutive successful recalls
  lastReviewDate: string,
  lastSyncedAt?: string,
  buriedUntil?: string
}
```

Rating → quality (`engine/srs.ts:26`):
| Rating | Quality | Effect |
|--------|---------|--------|
| `again` | 0 | reps=0, interval=0, EF unchanged, due today |
| `hard` | 2 | **treated as failure** (q<3): resets reps to 0 |
| `good` | 4 | EF nudge, interval grows (1→6→I·EF) |
| `easy` | 5 | larger EF gain |

⚠️ `hard` is a failure rating. Most SM-2 variants split hard/good; Lingo's doesn't.

`MASTERED_INTERVAL_DAYS = 21`. `isLearning = reps>0 && interval<21`. `isMastered = interval>=21`.

### Persistence

| Where | Keys |
|-------|------|
| `localStorage` | `open-lingo-srs` (card state map), `open-lingo-srs-last-sync`, `openlingo-review-mode`, etc. |
| TanStack Query | per-deck content (staleTime 60s, gc 5m) |
| Backend | `GET/POST /api/core/v1/srs/state \| due \| sync` — dirty-card payload merge; 404/501 silently no-op |

**Sync model**: dirty = `lastReviewDate > lastSyncedAt`. Server wins on `lastReviewDate >`, except local reset (interval=0 && reps=0) is never overwritten by server "learned" state.

### What's authorable vs runtime

| Field | Authorable? |
|-------|-------------|
| `id`, `front`, `back`, `note`, `reasoning`, `definition`, `context`, `image`, `type`, `parts/words` | yes |
| `defaultEase` (deck) | yes (1.3–3.0) |
| `easeFactor`, `interval`, `dueDate`, `repetitions`, `lastReviewDate`, `buriedUntil` | runtime; expose only **"reset SRS state"** action |
| `unlocked` | derived; setting it during edit is meaningless |

### Card variants and lesson variants are different dimensions

- Card type (data shape): `word | sentence | other`
- Review face (display): `word-first | image-first | back-first` (localStorage pref)
- **Lesson step type** (exercise variant: image-MCQ, tracing, listening, build, etc.) is a **lesson-page concern**, NOT a card field. Cards feed steps; steps live in lessons.

Recognition/production split is planned in CLAUDE.md Phase 1 (`SRSCardState → {recognition, production}`) but **not implemented**. One card = one SRS state today.

---

## 5. Current admin / editor surfaces

### Route map (relevant rows)

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/admin` | AdminLayout | authed | redirects to `/admin/users` |
| `/admin/users`, `/admin/users/:id` | AdminUsersLayout, AdminUserDetailPage (845 LOC) | authed | |
| `/admin/content` | AdminContentLayout | authed | redirects to `/admin/content/decks` |
| `/admin/content/decks` | AdminDecksPage | authed | publish/unpublish/delete |
| `/admin/content/stories` | AdminStoriesPage | authed | |
| `/:lang/community/decks/:deckId` | **DeckEditor (1190 LOC)** | authed | uses `StudioHeader`, dnd-kit drag-sort |
| `/:lang/community/explore` | ContentBrowserPage (860 LOC) | authed | the canonical browse + facet page |
| `/:lang/community/contribute/admin` | AdminTab | authed | moderator queue |

### Reusable pieces (already in repo)

- **`StudioHeader.tsx`** (`src/features/studio/`) — generic editor toolbar: back link, name field, status pill (`draft|published|submitted|review|changes_requested|rejected`), save/submit buttons, unsaved-changes indicator. **Currently used only by DeckEditor.** Perfect for a `LessonEditor`.
- **`UnsavedChangesModal.tsx`** — `react-router` blocker pattern, generic.
- **`FacetSidebar`** (`src/shared/components/ui/`, 235 LOC) — multi/single-select facets, collapsible, per-section search when >8 options, count badges, clear-all.
- **`DataTable<T>`** + **`FilterBar`** (`src/shared/components/data/`) — sortable headers, selectable rows, empty-state, responsive cols.
- **`CommunityContentTable`** — opinionated DataTable wrapper with kind tints, cover thumbnails, language flag, "Edit" branch for owned content.
- **`CommunityDecksLayout`** — two-column shell (content + right rail).
- **`RichMarkdownEditor`** wrapper around `@uiw/react-md-editor` (used in forum only today; card-markdown task open).
- **`@dnd-kit/core` + `@dnd-kit/sortable`** — already used in DeckEditor for card reordering; transposes directly to lesson-step reordering.
- **TanStack Query 5** with project-wide pattern (mutation hooks, query invalidation).

### Auth / role model

- `useAuth` (Auth0 hook) + `usersApi.getMe().role` (`"user" | "trusted_creator" | "moderator" | "admin" | "super_admin"`).
- Helpers in `src/shared/auth/roles.ts`: `canAccessSiteAdmin(role)`, `canModerateCommunityContent(role)`.
- ⚠️ **`useIsAdmin.ts` is a placeholder** — returns `isAuthenticated` only. Real check is `getMe().role` + `canAccessSiteAdmin`. Don't use `useIsAdmin` from new code.
- ⚠️ **`/admin/*` routes do NOT check role.** Gating is purely UI affordance in `AuthMenu`. Backend presumably enforces; client gates are cosmetic. The lesson editor should add a real `<RequireRole role="admin">` wrapper.

### Form patterns

- **No form library.** Every editor is hand-rolled `useState` + derived `canSubmit`. DeckEditor sprawled to 1190 LOC of inline state. **Spencer's call:** introduce react-hook-form + zod *before* the lesson editor lands, or accept another sprawl.
- Unsaved-changes via `react-router-dom`'s `useBlocker` + `UnsavedChangesModal`.

---

## 6. Authoring pipeline (the architecture question)

### Static vs dynamic verdict

**Lessons are 100% static.** Decks/SRS/progress are dynamic via the FastAPI backend in `lingo-core`.

End-to-end trace of `ja-m1-ka-1`:
1. Author edits `src/features/lesson/data/mock-ja-m1-ka.ts`, exports `MOCK_LESSON_JA_M1_KA_1`.
2. `mockLessons.ts:183` registers `"ja-m1-ka-1": MOCK_LESSON_JA_M1_KA_1` in the `LESSONS` map.
3. `vite build` bundles all `mock-*.ts` into JS chunks. No JSON, no fetch.
4. `LessonPage` calls **synchronous** `getMockLessonContent(lessonId)` → looks up `LESSONS[id]` → runs `augmentWithReviewTail` (splices cross-row review steps) → renders.
5. Per-step events buffer to localStorage. Lesson-end attempts buffer to localStorage.
6. `lessonSync.performLessonSync` flushes attempts via `POST /api/core/v1/progress/lessons/batch`. 404/501 silently swallowed.

Content never crosses the network. Only telemetry does.

### API surface (what exists)

| Client | Prefix | Purpose |
|--------|--------|---------|
| `UsersApi` | `/users` | me, settings, profile |
| `SrsApi` | `/srs` | state, due, sync |
| `DecksApi` | `/decks` | listMy, create, get, batch, update, status, addCards (+ admin) |
| `StoriesApi` | `/stories` | story CRUD |
| `AdminApi` | `/admin` | user/deck/story/SRS admin |
| `ProgressApi` | `/progress` | batchAttempts, me, touch, listAttempts |

**No `LessonsApi`, no `ContentApi`, no `/content/v1/*` router.** `docs/tasks/backend-content-api.md` is a draft proposal, never built.

### What lingo-core does (and doesn't do)

- Provides decks/users/srs/stories/community/admin via FastAPI + SQLite (local) / DynamoDB (prod).
- **Does NOT have a lessons table** or any lesson API.
- `lingo-core/scripts/tts/*.py` (Edge-TTS / Kokoro) generates MP3s into lingo's `src/pub/tts/ja/` — the only artifact crossing repos at build time.
- `lingo-core/test_decks/*.json` is fixture data for the **deck** ingestion path, including the auto-emitted `ja-hiragana-curriculum.json` that's a TTS-seed list, not a learner deck.

### What the editor would save to

Given lessons are static TS exports, "Save Lesson" has no obvious endpoint. Four concrete paths:

| Path | What "Save" does | Effort | Tradeoff |
|------|------------------|--------|----------|
| **A. Preview + export TS** | Build `LessonContent` in memory, render with existing `StepRenderer`, button to copy TS source for paste | smallest | Spencer commits manually. Editor still hugely useful for live iteration. |
| **B. Dev-server Vite middleware writes TS** | A POST handler in `vite.config.ts` (precedent: existing `devLogMiddleware`) writes a generated `mock-*.ts` to disk during `npm run dev`. Spencer reviews diff and commits. | small | Only works in dev. Editor effectively a "PR composer". |
| **C. Build the Content API** | Implement `backend-content-api.md` spec in lingo-core: `lessons` table, CRUD endpoints, `ContentApi` client. Lesson player prefers dynamic over static. | large | Real CMS. Conflicts with CLAUDE.md's "lessons stay statically authored" commitment unless framed as override layer. |
| **D. Hijack DecksApi** | Treat a lesson as a deck. | medium | Wrong primitive — `DeckCard` has `front/back` not the 22-variant `LessonStep`. Don't. |

The deck editor at `src/features/community/contribute/DeckEditor.tsx:426` is the **closest in-repo precedent** for any of A/B/C.

### Open dependencies for any dynamic option (C)

- Lesson model in lingo-core DB (none today).
- Author/ownership field on lessons (decks have it; lessons don't — currently treated as global curriculum).
- Versioning strategy (`docs/tasks/schema-versioning-migration.md` is a planning doc).
- Override ordering: dynamic-first, static fallback in `getMockLessonContent`.
- `introduces_*_ids` plumbing kept in sync with the in-progress `vocabGraduation` refactor.
- Image/audio asset upload (today: offline-built and committed).

---

## 7. Gotchas an editor must handle

Distilled from across the lanes — the editor designer needs to know these up front.

1. **Two "lesson" shapes** (`Lesson` stub + `LessonContent`). Keep both in sync; the stub carries `status`, `kind: "alphabet"|"recap"|"module_review"`, `alphabetId`; the content carries `steps`.
2. **Generated vs hand-authored lessons.** ~67 JA sub-lessons auto-built from `RowDef` via `buildRowSubLessons()`; hand-authored files override via map-spread. Editor must surface "generated, override?" state per lesson.
3. **Review-tail augmentation at read time.** `getMockLessonContent` appends extra steps based on `getMockCompletedLessonIds()`. What's in the file ≠ what the runtime renders. Editor preview must mirror this.
4. **Row-test auto-build.** `RowTestStep.items[].payload` is itself a full MC/Match/Build step — nested step editing.
5. **Density config is URL-param-resolved at runtime** (`?density=…`). Editor's live preview needs a density picker.
6. **`audioKey` vs `audioText`.** Some steps reference static asset keys (alphabet audio); others reference TTS phrases (`promptAudioText`/`audioText`) that hit the runtime manifest. Editor must distinguish.
7. **`videos` step type in docs README but not in TS.** Don't expose.
8. **`JapaneseAnnotation[]` ruby authoring** across 12+ step kinds. Need a per-text-segment widget.
9. **Korean m2/m3 modules** declared in pathway but `getMockLessonContent` returns `null`. Editor needs an "empty placeholder" state.
10. **`courseId: "mock-1"` is a placeholder** — required field, functionally a constant.
11. **`hard` is a failure rating** in SM-2 (q=2, resets reps). Don't expose a "reset to hard" action.
12. **Card IDs are SRS-store keys** in `localStorage` — renaming orphans state. Editor must hard-block ID rename or migrate the key.
13. **`Flashcard.image` is slated for deprecation** in favor of inline markdown — see `docs/tasks/card-markdown-editor.md`.
14. **`description` field in deck JSON is silently dropped** by the TS interface. Editor should fix this.
15. **`WORD_IMAGE_MCQ_BLOCKLIST` throws at import** if a blocked kana hits an image-MCQ step. Editor must enforce in real-time.
16. **`assertNoSameAnswerCluster`, `assertAnswerRotation`, `assertNoConsecutiveSame`** fire at module-eval. A live editor can't piggyback; needs runtime-callable validators.
17. **`mock-1` is the only courseId**, but docs use `official-ko`. Editor should validate against the live constant.
18. **`romaji` is pre-stored on `CourseAtom`** despite being derivable — drift risk. Regenerate and diff on save.
19. **No `LessonsApi`, no lesson backend.** Save path is the first design decision (§6).
20. **CLAUDE.md commits to static-authored lessons.** Adaptive logic lives on the flashcards surface via `vocabGraduation`. A dynamic editor must be framed as an override layer, not a replacement.

---

## 8. Recommended scope for V1

Not a plan — a starting position for a brainstorming conversation.

### Mount point
`/admin/content/lessons` — sibling to existing `/admin/content/decks` and `/stories`. Free `AdminLayout` chrome, breadcrumbs, and natural gating. Add a real `<RequireRole role="admin">` wrapper at the same time (today's `/admin/*` route guards only check `isAuthenticated`).

### List view
Pattern-match `ContentBrowserPage`:
- `FacetSidebar` facets: **Language** (ja/ko), **Module** (m1–m7, sidequest), **Kind** (lesson, alphabet, recap, module_review), **Source** (hand-authored vs generated), **Has hand-authored mock file** (yes/no).
- `DataTable` columns: id, title, language, module, kind, step count, last modified (git-derived), status.
- Top search input + sort.
- Row "Edit" action → editor route.

### Editor
Mirror `DeckEditor`'s shape:
- `StudioHeader` (already generic — pass status pill + save/submit).
- `UnsavedChangesModal`.
- Left panel: step list with dnd-kit reorder.
- Right panel: step inspector per step kind. One `StepCardInspector` component per variant (22 of them).
- Top metadata strip: title, description, estimatedMinutes, xpReward, kind, introducesVocabIds, introducesCardIds.
- Live preview pane that calls into the actual `StepRenderer` chain.

### Save path — Spencer's call (see §6)
- **A. Preview-only** for V1; ship value fast, defer save backend.
- **B. Dev-server middleware** for a write-to-disk PR-composer that works on his machine only.
- **C. Backend Content API** for a real CMS, ~weeks of work, conflicts with the CLAUDE.md commitment unless framed as override.

Strongly recommend **A first**, with **B as a follow-up** once the editor proves valuable. **C is a separate strategic decision** about whether Lingo wants a dynamic-CMS posture at all.

### Cross-cutting work to do alongside

- **Adopt react-hook-form + zod** before the editor sprawls. The lesson model is 22 step variants × dozens of fields; hand-rolled state will be 2000+ LOC if it follows DeckEditor's pattern.
- **Real role-gated `<RequireRole>` route component**; retire the placeholder `useIsAdmin`.
- **Move build-time assertions into runtime-callable validators** (`assertNoSameAnswerCluster` etc.) so the editor can show inline warnings.
- **Fix the `description` field drop** in `FlashcardDeck` (one-line change).
- **Decide vocab atom canonical model** — `CourseAtom` for JA, but KO has no equivalent yet. The editor surfaces this gap.

---

## 9. Open questions for Spencer

These need answers before designing the editor in detail:

1. **Save target?** A/B/C from §6. Determines everything downstream.
2. **Lessons in scope?** Edit existing only, or also create new? Create new implies module insertion → course manifest mutation → potential static-file generation.
3. **Generated lessons editable?** Hiragana row sub-lessons are built from `RowDef`. Editor exposes the row definition or the generated output?
4. **Korean parity?** KO has no `CourseAtom` table. Build `KO_COURSE_ATOMS` (or generalize to `LanguageAtom`) before V1, or scope V1 to JA only?
5. **Vocab atom editor in scope?** Editing `CourseAtom` (kanji, emoji, fromModule, introducedByLessonId) is at least as valuable as editing lessons — they drive `lessonCardMap`, future `vocabGraduation`, and N5 emoji map.
6. **Audio handling?** TTS is generated offline in `lingo-core`. Editor can preview existing `audioText` against the live manifest, but creating new audio requires running the Python pipeline. Out-of-scope, or in-app trigger?
7. **Admin-only or trusted-creator?** Affects role gate and where the route lives.
8. **Form library?** RHF+zod recommended; alternative is sprawl.

---

## 10. Reading list

If you're picking this up:

- `src/features/lesson/types.ts` — the discriminated union truth (~516 lines)
- `src/features/lesson/data/mockLessons.ts` — the LESSONS map + read-time augmentation
- `src/features/lesson/data/hiraganaCurriculum.ts` — RowDef/SubLessonDef + ALL_ROWS + CONFUSABLES
- `src/features/lesson/data/lessonBuilder.ts` — `buildRowSubLessons` + row-test builder
- `src/features/flashcards/data/ja-course-atoms.ts` — 749 atoms + adapter
- `src/features/flashcards/data/types.ts` — Flashcard, FlashcardDeck, SRSCardState, SRSRating
- `src/features/flashcards/engine/srs.ts` — SM-2 implementation
- `src/features/community/contribute/DeckEditor.tsx` — closest CRUD precedent (1190 LOC)
- `src/features/studio/{StudioHeader,UnsavedChangesModal}.tsx` — reusable editor chrome
- `src/shared/components/ui/FacetSidebar.tsx` + `src/shared/components/data/{DataTable,FilterBar}.tsx` — list/filter primitives
- `src/shared/auth/roles.ts` — role helpers
- `docs/tasks/backend-content-api.md` — drafted-but-not-built Content API spec
- `docs/lesson-authoring-guide.md` — current human authoring workflow
- `docs/curriculum-design-v2.md` + `docs/m3-m7-rebuild-spec-2026-05-18.md` — current curriculum contracts
- `lingo-core/app/v1/router.py` — confirms backend routes (no `content`)
