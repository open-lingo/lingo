# CLAUDE.md — `lingo` (Open Lingo web app)

Vite + React 19 + TypeScript + Tailwind language-learning SPA. Talks to `lingo-core` (FastAPI) over HTTPS with Auth0 RS256 JWT.

## Critical orientation

- **Most recent session handoff:** `docs/handoff-2026-05-25-social-mvp-pass.md` — what shipped 2026-05-25 in the social/MVP pass (Spanish locale, ad provider DI, ad-free time, 51 UI primitives + responsive hooks, learn page revamp, quests system end-to-end, social page fully wired to backend, community profile previews, public profile route, mobile pass, deck preview restore, practice mock unification, backend api_error refactor, quests + reactions + invites + threads + spotlight endpoints, FSRS-6 SRS migration). **Read this first when picking up a thread.** Earlier handoff `docs/handoff-2026-05-25.md` covers the sub-lesson restructure + SRS review lessons that shipped earlier the same day.
- **Source of truth for project state:** `docs/PROJECT_STATE.md`. Read this first when starting a feature — the rest of `docs/` is a mix of current planning, stale task specs, and design docs.
- **Architecture audit + conformance gaps:** `docs/ARCHITECTURE_REVIEW.md` — read before any structural change.
- **Real-user feedback log:** `docs/user-feedback/` — verbatim tester observations + Spencer's product notes per session. Higher product-signal than the synthesized agent audits; read before any UX-touching change.
- **Lesson authoring patterns + per-step rubric:** `docs/lesson-authoring-guide.md` — the condensed standards for any JA sub-lesson edit. §13 is the 2026-05-21 retrospective (card-type → lexical category rubric, image-MCQ-as-intro, just-in-time grammar teach, forced-build-replacing-copula-cloze, close-on-confidence, grading=review-only, atom-registry discipline, particle-tile separation gotcha). Read before any M3-M7 lesson content change.
- **Curriculum vs research:** `docs/curriculum-audit-vs-research-2026-05-21.md` — the rubric the audits grade against (research-backed sequencing + N5 spine + open gaps).
- **Backend repo:** `../lingo-core/` — same monorepo-style layout, separate git.

## Stack

- React 19, React Router v7, TS 5.6 (strict), Vite 6, Tailwind 3 (themes via `class` strategy)
- TanStack Query 5 for server state (`staleTime: 1m`, `gcTime: 5m` global defaults — set explicit per-domain)
- Auth0 (`@auth0/auth0-react`) — token injected by `ApiProvider` once, attached to every request
- i18next (en, ko; ja stub)
- Vitest (unit, happy-dom) + Playwright (e2e w/ auth state persistence)
- Path alias: `@/ → src/`

No ESLint, no Prettier configured (gap — see ARCHITECTURE_REVIEW.md).

## Source layout

```
src/
├── main.tsx                # provider bootstrap
├── App.tsx                 # createBrowserRouter + lazy routes
├── routes/                 # root shell + auth wrappers + language context
├── features/<domain>/      # vertical slices — keep components local until 2nd domain consumes
│   └── lesson/LessonPage.tsx   # ⚠️  GOD FILE (~23KB, 8 step renderers) — split before lesson-flow changes
└── shared/                 # cross-feature infrastructure
    ├── api/                # ApiClient base + UsersApi, SrsApi, DecksApi, etc. — singletons
    ├── auth/               # Auth0 config, useAuth hook
    ├── components/         # DataTable, FilterBar, RouteErrorBoundary, icons
    ├── contexts/           # Settings, Theme, Language, Modal, Toast, FeatureFlags
    ├── i18n/               # i18next config + locale files
    ├── theme/              # ThemePresets (Light/Dark/Sepia/AMOLED) + tokens
    └── ...                 # devlog, telemetry, audio, speech, japanese, storage, utils
```

## Conventions

- **API calls:** extend `ApiClient` in `shared/api/*.ts`. Singleton per domain. Never instantiate per-component.
- **Server state:** TanStack Query only. **Set explicit `staleTime`** on every `useQuery` — don't rely on the 1m default.
- **Mutations:** prefer dedicated hooks (`useCreateDeck`, `useDeleteCard`) that wrap `useMutation` + `invalidateQueries`. Don't inline `new API()` + manual loading state.
- **Icons:** import from `lucide-react`. Curated set in `src/shared/glyphs/iconRegistry.ts`.
- **i18n:** all UI strings via `t("namespace.key")`. Locales: `src/shared/i18n/{en,ko}.json`.
- **Routes:** lazy-loaded in `App.tsx`. Use `lazyRetry` from `shared/utils/` to recover from chunk-load failures.
- **Themes:** Tailwind `class` strategy + token system in `shared/theme/`. CSS variables for runtime-switchable values.

## Component placement

- `shared/components/*` — composed widgets used across 2+ features
- `features/<domain>/components/*` — domain-locked (don't promote until a 2nd domain consumes)
- Files growing past ~400 LOC are a smell — extract subcomponents under `features/<domain>/`

## Missing shared primitives (build before features multiply variants)

These exist in the dashboard reference org but **not here yet**:
- `<Modal>` (header + close + dividers + backdrop control)
- `<CenteredLoader>` (full-area Spinner, size/py props)
- `<EmptyState>` (title + description + optional action)

When you need any of these, build the shared primitive first.

## SRS engine

`features/flashcards/engine/` — FSRS-6 (Free Spaced Repetition Scheduler v6) via `ts-fsrs` v5.4.0. Ratings: Again / Hard / Good / Easy. **Hard is a success**, not a failure (slower stability growth than Good). Target retention 0.95 (tighter than FSRS default 0.9). Local-first (localStorage) with manual or end-of-session sync to `lingo-core` via `SrsApi`. Dirty-card detection + delta merge — don't bypass.

**Modality split (2026-05-23):** each card carries two FSRS sub-states (`recognition` + `production`). `reviewCard(state, modality, rating)` and `gradeFromLesson(state, modality, outcome)` update one sub-state at a time; `isDue(state)` is true if either is due. Migration: legacy flat FSRS-6 entries from localStorage are upgraded to modal on read (both sub-states get the same starting state); pre-FSRS-6 SM-2 entries are dropped.

**Backend schema (migrated 2026-05-25):** `lingo-core/app/srs/schemas.py` now matches the frontend FSRS-6 modal shape (recognition + production sub-states). SQLite stores full state as JSON with a computed `due_date` column for index queries. Legacy SM-2 table is dropped on startup. DynamoDB stores state as `state_json` attribute with top-level `dueDate` for the GSI.

## Vocab SRS unification — phases 1-4 shipped 2026-05-23

Goal: unify lesson reviews + flashcard practice onto one SRS state per atom, so a card "knows" you got it wrong in a lesson and vice versa.

**Hard architectural commitment:** adaptive per-atom step selection happens on the **flashcards surface**, NOT inside lessons. Lessons stay statically authored. Moving review-tail construction into lesson render time would require unwinding ~8,600 LOC across `mock-ja-m{3-v2,4,5,6,7}.ts` — avoid this trap. Per the 2026-05-19 feasibility audit.

**Spencer's invariant: only review cards count toward FSRS-6.** Teach steps (`phrase_card`, `info`, `grammar_rule`, `symbol_intro`, `teach`) NEVER advance card state. The `shouldWriteSrs(step)` gate in `_stepPredicates.ts` enforces this — even if a teach step accidentally carries `exercisedAtoms`, the gate blocks the FSRS write.

**Shipped phases:**

1. ✅ **Modality dimension** (2026-05-23) — `SRSCardState` is `{recognition: SubState, production: SubState, lastSyncedAt?, buriedUntil?}`. Migration helper `migrateFlatToModal` upgrades legacy flat entries on read; pre-FSRS-6 SM-2 entries still drop.
2. ✅ **Step factory atom tagging** (2026-05-23) — all graded factories in `_jaGrammarHelpers.ts` populate `exercisedAtoms` + `modality`. Atom-keyed factories (`vocabMcq`, `audioImageMcq`, `audioMeaningMcq`, `translationMcq`, `reviewMatchPairs`, `cloze`) auto-resolve from target kana / `correctParticle`. Sentence-level factories (`build`, `speaking`, `listeningCompSentence`, `listeningBuildSentence`, `sentenceMcq`, `translateStep`, `dialogueListen`) accept optional `exercisedAtomKanas?: string[]` arg. Existing call sites that don't pass it just stay un-tagged (safe default) — content pass to backfill is follow-up.
3. ✅ **`gradeFromLesson(state, modality, outcome)`** (2026-05-23) — additive engine helper. Maps `{correct: false} → Again`, `{correct: true, retried: false} → Good`, `{correct: true, retried: true} → Hard`. Easy stays manual-only on flashcards surface.
4. ✅ **`LessonPage.handleStepComplete` SRS wiring** (2026-05-23) — gated on `shouldWriteSrs(step)`. For each `step.exercisedAtoms`, looks up current state via `getCardState`, applies `gradeFromLesson` per resolved modality, writes back via `setCardState`. Production receives both modalities when step declares `modality: "both"`.

**Flashcards surface** — `FlashcardTester.handleRate` advances BOTH modalities on each grade (current behavior preserved; per-modality flashcard sessions are a follow-up). The `IntervalHint` preview shows `min(recognition.interval, production.interval)` — honest "you'll see this when either is due" estimate.

**Foundation still in place:**
- Course deck — `src/features/flashcards/data/ja-course-atoms.ts` (749 atoms: 196 taught + 553 "future" N5 + 10 particles; 506 kanji-bearing). `isSrsEligibleAtom` filter, `buildJaCourseDeck({unlockedIds})` builder. Note: kana collisions (e.g. `に` = number two AND particle に) require explicit `opts.atomId` on the vocab card to disambiguate.
- `vocabGraduation/index.ts` dispatches `lingo:vocab-graduated` events on lesson completion — receiver not wired yet.

**Remaining phases (not yet shipped):**

5. **Wire the `vocabGraduation` receiver** — listen for `lingo:vocab-graduated`, update unlock map on per-user state. Replaces the hand-maintained `LESSON_TO_CARDS` in `lessonCardMap.ts`. Compute `Flashcard.unlocked` from the unlock map; old map gets deprecated.
6. **Render-time review-pool picker on the flashcards surface** — flashcards practice surface reads card SRS state + unlock map and picks the next due atom (struggle-weighted + interval-based). Card-agnostic factories (`audioImageMcq`, `audioMeaningMcq`, `translationMcq`) exist but `reviewQueue.ts` doesn't yet use the picker; this phase wires it.
7. **Kanji unlock map + reveal step** — add `kanjiUnlocked: Record<atomId, true>` to user state (sparse, ~300 bytes per learner at full N5). Build a `kanjiIntroStep` step type that lesson authors place at the kanji-re-teach moment. The step's completion writes the unlock. `showKanji(card, srsState, user)` is computed: `policy === "always" || (policy === "auto" && user.kanjiUnlocked[card.id])`. Default policy `"auto"`. The "auto-graduate at interval > 7d" heuristic is **dropped** — unlocks are curriculum-driven, not memory-driven.

**Story comprehension factory (2026-05-23):** `storyComprehension({...})` in `_jaGrammarHelpers.ts` composes `[dialogueListen(narrative), build_sentence]` — the L7 closer alternative to `dialogueListen` for narrative-style M8+ content. `DialogueListenStep.format: "narrative"` suppresses speaker chips; line cap relaxed from 4 to 8. See `docs/lesson-authoring-guide.md` §13.13 for the locked canonical M8+ template.

**Placement test (2026-05-25):** 2-stage adaptive placement test in `src/features/placement/`. Stage 1: 8 screening items (one per difficulty tier across M3-M27). Stage 2: 3 items per module in a window around the estimated floor. 100% threshold (3/3) per module. Passing seeds SRS atoms as `state: "learning"`, `dueDate: today` (one review required). Same engine powers per-module "test out" via `/ja/learn/test-out/:moduleId`. Question bank: 75 items (3 per module) using `cloze()` and `sentenceMcq()` factories. Onboarding prompt shows on Learn page for new JA users with no completed lessons. Old `buildPlacementTest.ts` (M1-M3 only) is superseded.

**TTS coverage (2026-05-25):** Full M3-M27 TTS coverage shipped. `scripts/emit-tts-deck.mjs` regex fixed from `m[1-9]` to `m\d+` (was missing M10-M27). Period-variant dedup strips trailing `。` (saves ~394 files). Runtime `getTtsUrl()` falls back to ±`。` variant. 2504 unique texts covered, 0 gaps.

**Follow-up cleanups (lower priority):**

- Migrate `M3_M7_REVIEW_POOL` in `_jaGrammarHelpers.ts` to be derived from `JA_COURSE_ATOMS` (filter by `fromModule`). Single source of truth.
- Canonicalize atom-name inconsistencies between lessons and N5 map: `すし` vs N5's `寿司`; `さけ` (lessons) vs `おさけ` (N5, with 酒). ~1 hour content pass.
- Build-time assertions at bottom of each mock-ja-m*.ts (`assertNoSameAnswerCluster` etc.) should be moved to a test-only helper before any render-time factory invocation lands; currently they only fire at import time, which is safe today but breaks if review-tail moves to mount time.
- The render-time pool selection in `pickReviewAtoms` (struggle-aware version that already reads `topStruggleKana("ja", 12)`) won't actually fire until call sites move from module-eval to render-time — the limit flagged in the previous audit. Either accept "evaluated once per JS bundle load" or do the (large) call-site refactor. The flashcards surface adaptive picker (phase 6) sidesteps this entirely for the SRS-driven path.

## Vocab card art (read before authoring new vocab)

Every authored vocab word has an image (Noto Emoji Apache-2.0 + a small MIT-licensed custom-SVG top-up). The system has three doc surfaces:

- **[docs/emoji-art-process-2026-05-18.md](./docs/emoji-art-process-2026-05-18.md)** — the 11-step methodology (resolver audit → style baseline → 4-persona Opus audit → custom-SVG fill → block-list → curriculum integration → reference compile). Re-run whenever a new language ships or a new module adds ≥10 vocab words.
- **[docs/emoji-blocked-words-2026-05-18.md](./docs/emoji-blocked-words-2026-05-18.md)** — rubric + end-to-end authoring workflow. Read this when adding a single new vocab word.
- **[docs/n5-vocab-emoji-reference-2026-05-18.md](./docs/n5-vocab-emoji-reference-2026-05-18.md)** — pre-assigned emoji for all 662 JLPT N5 words. Pull canonical emoji from this table; don't re-decide per-lesson.

Runtime: `notoEmojiUrl(emoji)` + `lingoArtUrl(kana)` in `src/shared/assets/notoEmoji.ts`. Block-list: `WORD_IMAGE_MCQ_BLOCKLIST` + `withoutMcqBlocked()` in `src/features/lesson/data/_jaGrammarHelpers.ts` — throws at import if a blocked kana hits visual MCQ.

## Testing

```bash
npm run test           # vitest watch
npm run test:run       # vitest CI
npm run test:e2e       # playwright
npm run test:e2e:auth  # auth state setup (headed)
```

Coverage is thin (28 files). Add a happy-path test for any new feature.

## Dev loop

```bash
npm run dev            # vite, strict port 5173
```

API base URL via `VITE_API_BASE_URL` (default `http://localhost:8000` matching `lingo-core` local dev).

## Visual debugging (Claude needs eyes)

When iterating on layout/styling, Claude can drive Playwright to screenshot any route and read the PNG inline — no manual screenshot pasting needed.

```bash
node scripts/shot.mjs <path> [width] [height] [--full] [--lang=<id>] [--no-lang]
# → writes /tmp/shot.png
```

See `.claude/skills/screenshot/SKILL.md` for full options and gotchas. The `screenshot` skill triggers on "look at", "see", "view", "screenshot" requests.

**One-time auth setup** (needed for any route behind `RequireAuth`):

```bash
npm run test:e2e:auth      # headed browser pops up via WSLg — log in once
                           # writes .auth/user.json (gitignored)
```

The shot script auto-loads that state and auto-injects a `learningLanguageId` into localStorage so the first-time language-picker modal doesn't block authed routes. Pass `--no-lang` if you want to see the picker.

**Known footgun**: the auth.setup test must navigate to `/login` (not `/`) — going to `/` matches `waitForURL` immediately and short-circuits the wait, writing an empty `user.json` in ~2s. If `wc -c .auth/user.json` is <1KB, auth never happened.

## Don't

- **Don't add MUI.** Tailwind-first. If you need a primitive, build it under `shared/components/ui/`.
- **Don't import from `@mui/*`** — not installed.
- **Don't add legacy redirects or backwards-compat shims** when moving routes/files.
- **Don't add AI attribution to commits.**
- **Don't trust `docs/tasks/*.md` as current state** — many predate the codebase. `PROJECT_STATE.md` wins.
