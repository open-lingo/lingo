# CLAUDE.md — `lingo` (Open Lingo web app)

Vite + React 19 + TypeScript + Tailwind language-learning SPA. Talks to `lingo-core` (FastAPI, `../lingo-core/`, separate git) over HTTPS with Auth0 RS256 JWT.

## Orientation

- **Source of truth for project state:** `docs/PROJECT_STATE.md`. The rest of `docs/` mixes current planning, stale task specs, and design docs — when they conflict, PROJECT_STATE wins. Session handoffs live at `docs/handoff-*.md`.
- **Architecture audit:** `docs/ARCHITECTURE_REVIEW.md` — read before structural changes.
- **Real-user feedback log:** `docs/user-feedback/` — verbatim tester observations + Spencer's product notes. Higher product-signal than synthesized audits; read before UX-touching changes.
- **Lesson authoring patterns + per-step rubric:** `docs/lesson-authoring-guide.md`. §13 is the retrospective with the locked M8+ template, image-MCQ-as-intro, grading=review-only, and the particle-tile separation gotcha. Read before any JA lesson content change.
- **Curriculum vs research:** `docs/curriculum-audit-vs-research-2026-05-21.md` — the rubric audits grade against.

## Stack

React 19, React Router v7, TS 5.6 (strict), Vite 6, Tailwind 3 (`class` theme strategy), TanStack Query 5, Auth0 (`@auth0/auth0-react`), i18next, Vitest (happy-dom) + Playwright. Path alias: `@/ → src/`. No ESLint/Prettier configured.

## Source layout

```
src/
├── App.tsx                     # createBrowserRouter + lazy routes
├── routes/                     # root shell + auth wrappers + language context
├── features/<domain>/          # vertical slices — keep components local until a 2nd domain consumes
│   ├── lesson/                 # step views, LessonPage (⚠️ god file — split before lesson-flow changes)
│   │   └── data/               # builders, mockLessons registry, conformance tests
│   └── languages/ja/           # JA curriculum: curriculum/m*.ts, grammarHelpers.ts, courseAtoms.ts
└── shared/                     # api/ auth/ components/ contexts/ i18n/ theme/ language/ …
```

Course map: `src/shared/domain/mockCourse.ts`. Language registry: `src/shared/language/` (`ja:`-prefixed atom ids, ADR-005).

## Conventions

- **API calls:** extend `ApiClient` in `shared/api/*.ts`, singleton per domain.
- **Server state:** TanStack Query only; set explicit `staleTime` per query.
- **Mutations:** dedicated hooks (`useCreateDeck` …) wrapping `useMutation` + `invalidateQueries`.
- **Icons:** `lucide-react` via `src/shared/glyphs/iconRegistry.ts`. **i18n:** `t("ns.key", "fallback")`; locales in `src/shared/i18n/locales/`. **Routes:** lazy via `lazyRetry`.
- Shared primitives live in `shared/components/ui/` (Modal, CenteredLoader, EmptyState, Button, …) — extend these, don't fork variants.
- Files past ~400 LOC are a smell — extract under `features/<domain>/`.

## SRS engine (invariants)

`features/flashcards/engine/` — FSRS-6 via `ts-fsrs`. **Hard is a success** (slower stability growth than Good). Target retention 0.95. Local-first (localStorage), delta-merge sync to `lingo-core` via `SrsApi` — don't bypass dirty-card detection. Each card carries two sub-states (`recognition` + `production`); `reviewCard`/`gradeFromLesson` update one modality at a time; `isDue` is true if either is due. Backend schema mirrors this shape (`lingo-core/app/srs/schemas.py`).

**Spencer's invariants — do not relax:**
- **SRS writes — three surfaces (current, post-2026-06-15):** (1) **seed-on-unlock** (D4) — completing a CONTENT lesson schedules its newly-unlocked atoms into FSRS **due next-day**, never same-day (`lesson/data/seedSchedule.ts` `seedUnlockedAtomsDueNextDay`, called from `LessonPage` after `unlockLessonAtoms`, content lessons only); (2) **review lessons** (`ja-mN-review-1/2`) grade per step, gated by `shouldWriteSrs(step)` (`lesson/data/_stepPredicates.ts`) + the lesson-id check in `LessonPage.handleStepComplete`; (3) the **flashcard reviewer** (`FlashcardTester` → `reviewCard` → `setCardState`). ⚠️ `buildSrsReviewLesson` is now **PURE** — it never writes state at build time (that side-effect seeded *every* unlocked atom due-today on any course-deck build, via the sentence-miner). ⚠️ **"kana M1/M2 has no SRS" = the kana _glyphs_ only** (single-kana-no-emoji → alphabet trainer, excluded by `isSrsEligibleAtom`); M1/M2 vocab _words_ (あい/いえ/あおい …) **ARE** SRS-eligible. The flashcard reviewer now **plays the course deck** — all unlocked words, **no intake cap by default** (D5; `flashcards.maxNewCardsPerDay` to limit, `flashcards.hideCourseDeck` to opt out). Ladder: **unlocked → seeded due-next-day → due**. Two tracks: **Track A** vocab (`open-lingo-srs:v2`) + **Track B** grammar (`open-lingo-srs-grammar:v1`, `engine/grammarSrs.ts`); review lessons advance both via `exercisedAtoms` + `exercisedGrammar`. **Model + roadmap: `docs/srs-scheduling-model-2026-06-15.md` (D1–D8 — D2 sub-lesson review tails + D3 review-lesson gating NOT yet shipped).** Supersedes the intake decisions in `docs/retention-architecture-design-2026-06-13.md`.
- Every atom must be introduced before any SRS review exercises it — enforced by `languages/ja/__tests__/moduleConformance.test.ts`.
- Adaptive per-atom step selection happens on the **flashcards surface**, NOT inside lessons. Lessons stay statically authored — moving review-tail construction into lesson render time would unwind the entire authored curriculum. (2026-05-19 feasibility audit.)

Backlog phases: vocab-graduation receiver (`lingo:vocab-graduated` event → unlock map), render-time review-pool picker on the flashcards surface, kanji unlock map + reveal step (curriculum-driven unlocks, not memory-driven). Kanji content itself is deferred (Spencer 2026-06-12).

## Gamification (cross-repo invariants)

- **XP is server-authoritative; the client mirrors the defaults.** The server's live source is `XpEconomyConfig` (`lingo-core/app/platform_settings/schemas.py`, applied in `app/progress/router.py`) — admin-tunable; `app/progress/xp.py` holds only legacy defaults now. `src/features/progress/xpRules.ts` mirrors those defaults for the pre-sync estimate (base 10, perfect +5, test/recap +10 via lesson-id suffix, 500/level linear). Keep it in sync with the `XpEconomyConfig` defaults or the lesson-complete estimate diverges from what the server awards. `lesson.xpReward` is cosmetic.
- **Quests**: backend at `lingo-core/app/quests/`; per-user state in the user-settings blob (like `shop`); progress advances via an **async event pipeline** — the lesson batch handler publishes `lesson_completed` / `xp_awarded`, consumed by the **lingo-async** service, which calls back `POST /quests/_internal/{id}/progress`. Not synchronous in the request, so don't add inline quest writes to the progress handler.
- Lesson juice (combo/sfx) call sites: `features/lesson/juice.ts` via `LessonPage.handleStepComplete`; row tests run their own per-item juice in `TestRunner`.

## JA curriculum authoring

**Id landmine:** m2's row lessons carry `ja-m1-*` ids (g/z/d/b/p/yoon — historical); never infer module membership from the id prefix — use the course map. Content lives in `src/features/languages/ja/curriculum/m*.ts`; helpers in `languages/ja/grammarHelpers.ts`; atom registry in `languages/ja/courseAtoms.ts`. All kana rows (m1/m2) are hand-authored files (`m1-*.ts`, `m2-*.ts`) that override the generated builder.

Machine-enforced rules (tests fail if violated):
- `moduleConformance.test.ts` — atoms ↔ vocab map ↔ grammar JSON consistency; intro-before-review.
- `lesson/data/kanaWordIntroOrder.test.ts` — a learner is never asked to **spell** a word (`listening_build`) before an active introduction (correct-option image MCQ, audio-meaning primer, teach, or context build). Distractor exposure doesn't count.
- Import-time assertions in curriculum files (`assertNoSameAnswerCluster`, blocklist checks).

Render-level guarantees (don't re-implement in data): tile banks are seeded-shuffled per step id in both build views; kana intro sub-lessons get a 2-step prior-row review tail appended centrally (`lesson/data/kanaReviewTails.ts`).

Per-step sentence exposure ≤3; new sentence per grammar point (don't recycle one sentence through 4 step types); review-particle cloze ≤25% of a lesson.

**Vocab card art:** every authored word needs an image. Canonical emoji per word: `docs/n5-vocab-emoji-reference-2026-05-18.md`; authoring workflow + blocklist rubric: `docs/emoji-blocked-words-2026-05-18.md`. Runtime: `notoEmojiUrl` / `lingoArtUrl` in `src/shared/assets/notoEmoji.ts`; blocklist `WORD_IMAGE_MCQ_BLOCKLIST` in `languages/ja/grammarHelpers.ts`. **When you author a new emoji, vendor its SVG into `src/pub/noto-emoji/svg/`** (the 2026-06 wave authored 224 without vendoring — broken images). `EmojiArt` falls back to the raw glyph if a file is missing, but vendor anyway.

**Placement test** (`src/features/placement/`): 2-stage adaptive, 3/3 per-module threshold, seeds SRS atoms as `learning`/due-today; same engine powers per-module test-out.

**TTS:** `scripts/emit-tts-deck.mjs` scans `languages/ja/curriculum/` → deck JSON in `lingo-core/test_decks/` → `cd ../lingo-core && .venv-tts/bin/python -m scripts.tts.generate --provider edge` → mp3s + `src/pub/tts/manifest.json`. Runtime lookup `getTtsUrl()` falls back across ±`。` variants. Run the emit + generate pair after authoring new sentences.

## Lesson UI stability rules (2026-06-13)

- Option buttons and the Check/Continue CTA must NOT move when an answer is submitted. Each step view keeps banner + CTA in one bottom-anchored block; celebration toasts render above the CTA, never overlaid on options. Verify layout work with before/after `getBoundingClientRect` measurements, not eyeballs.
- The lesson shell is FIXED-height (`h-[calc(100dvh-6.5rem)]`); the step container is the only scroll area — the window never scrolls during a lesson. Long reading content (grammar cards) scrolls inside it.
- **Don't size step content with dvh arithmetic** — the chrome around it is fixed-px, so dvh budgets overflow short windows (match-step postmortem). Inside the fixed shell, size from the container instead: `flex-1` + `grid-template-rows: repeat(n, minmax(min-content, 1fr))`, minimal static padding/gaps so the min-content floor stays low. The MCQ grids still carry legacy dvh clamps; migrate them to container sizing when touched.
- Build-step trays are pre-sized by an invisible ghost of the full answer. Match steps permanently reserve the Continue slot (`min-h-14`) so finishing never reflows.
- **Verify the step type you changed, at ≤700px height too.** `?step=N` on any lesson URL jumps straight to step index N (plus `?trace-gate=0` to bypass the trace skip gate, `?tray=slots|pill` to force a word-build tray variant) — no excuse for a step type being unreachable by the layout driver. Measure `scrollHeight - clientHeight` of the step container, not vibes.

## Testing & dev loop

```bash
npm run dev            # vite, strict port 5173 (API base: VITE_API_BASE_URL, default :8000)
npm run test:run       # vitest CI
npm run test:e2e:auth  # one-time headed auth → .auth/user.json (must navigate to /login, not /)
node scripts/shot.mjs <path> [w] [h] [--full] [--lang=ja]   # screenshot → /tmp/shot.png
```

**White screen + ERR_BLOCKED_BY_CLIENT in dev = ad blocker** killing `/src/features/ads/` module URLs (statically imported in main.tsx) — allowlist localhost. Add a happy-path test for any new feature. The `screenshot` skill / `shot.mjs` auto-loads auth state and injects `learningLanguageId`.

## Don't

- **Don't add MUI** (not installed). Tailwind-first; new primitives go in `shared/components/ui/`.
- **Don't add legacy redirects or backwards-compat shims** when moving routes/files.
- **Don't add AI attribution to commits.**
- **Don't trust `docs/tasks/*.md` as current state** — `PROJECT_STATE.md` wins.
