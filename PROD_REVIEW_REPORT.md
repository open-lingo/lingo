# Prod-Readiness Review — `ui-polish` integration (lessons + flashcards MVP)

Branch reviewed: `ui/prod-review` (based on integrated `ui-polish`).
Reviewer: autonomous overnight pass. Dev server on :5185, `VITE_DEV_AUTH_BYPASS=true`, no backend.

## Verdict — MVP go/no-go for lessons + flashcards

**GO.** No blockers found for the lessons + flashcards MVP. The four merged
revamps are stable: lessons run end-to-end, the flashcard review engine
advances correctly on all four ratings (no dead "Again" button), the
extra-context overlay produces zero layout shift, and there are zero non-CORS
console errors across every key learner route.

Baseline health on arrival: `tsc --noEmit` clean, `npm run build` clean,
`npm run test:run` 1018/1018 green. After fixes: TSC clean, build clean,
1019/1019 green (+1 new test).

All backend-dependent surfaces correctly degrade to empty states /
skeletons when the API is unreachable — verified that "stuck loading"
states resolve (React Query retries then falls back to `[]`).

---

## Persona A — FSRS learner who does lessons (PRIMARY)

| Step | Evidence | Result |
|------|----------|--------|
| Learn page (JA) | `/tmp/pa-01-learn.png` | Course pathway, quests rail, SRS panel, placement CTA all render. |
| Start lesson `ja-m1-l1-1` | `/tmp/pa-02-lesson1.png` | Intro step, 0/16 progress, +12 XP, Continue. |
| Step through step types | trace → recognition MCQ (`symbol_recognition`), `symbol_to_sound`, `match_pairs`, `word_image_mcq`, `listening_build` | All render; trace has a working "Skip this letter" path; recognition MCQ uses Check + colored feedback. 0 console errors. |
| Complete a full lesson (`ja-sidequest-survival-phrases`, 18 steps) | `/tmp/pa-lesson-complete.png` | Reached Lesson Complete screen; `BACK TO LEARN` + `I'm done — save my XP`. |
| Flashcard review session (mocked KO deck) | `/tmp/rev-front.png`, `/tmp/rev-flip.png` | Recognition chip, blue top-rail, Tap-to-reveal, counts widget. |
| Rate Again / Hard / Good / Easy | driver log: Reviewed 0→1→2→3→4→5 | **All four ratings advance.** Again re-queues (in-session re-show). No dead button. |
| Extra-context overlay | card box x:416/w:448 identical before+after flip | **Zero layout shift** — overlay is `absolute left-full`, card never moves. |
| "All caught up → Start a free review" | `/tmp/free-empty.png`, `/tmp/free-started.png` | Button starts a session and sets `?free=1`. (Edge bug found + fixed — see findings.) |
| Card Manager | `/tmp/cm-after-wait.png` | Resolves from "Loading…" to a clean EmptyState when no decks; full faceted UI present in code (sidebar, search, pagination, status facets, modality-date modal). |
| Mobile 390px (lesson + review) | `/tmp/mobile-lesson.png`, `/tmp/mobile-rev.png` | Header → hamburger, card fills width, 4 rating buttons fit (keycaps hidden < lg). |

The first-time flashcard onboarding modal ("Welcome to flashcard review")
is well-built and explains recognition/production + the 4 grade buttons.

## Persona B — community contributor

| Surface | Evidence | Result |
|---------|----------|--------|
| Social page | `/tmp/pb-ja-social.png` | Sidebar tabs (Overview/Friends/League/Messages), avatar via `useMe` fix renders, Add-friend button, **skeleton loaders** on loading panels, friendly empty states. |
| Community explore | `/tmp/pb-ja-community-explore.png` | Refine sidebar, facet chips, Cards/List toggle, Newest sort, empty state, quick actions, trending-tags empty state. |
| Friend hamburger / popover | code review of `DropdownMenu` → `Popover` | Portal-based (`z-50`) with viewport-edge flip — correct layering over sticky bars. No z-index leak. |

Backend-empty so live friend rows / league standings weren't exercised, but
layout, routing, and popover correctness verified.

---

## Findings

| # | Issue | Severity | Location | Status |
|---|-------|----------|----------|--------|
| 1 | "Start a free review" CTA shown even when there are no reviewed-but-not-yet-due cards to surface → clicking it rebuilds an empty queue and silently re-shows the same screen (reads as a dead button). | High | `flashcards/FlashcardTester.tsx` completion screen; `engine/reviewQueue.ts` | **FIXED** — added `notYetDueCount` to the queue; CTA gated on `> 0`. New unit test in `freeReview.test.ts`. |
| 2 | Lesson-complete screen shows "Accuracy 100%" + "Score 0/0" for exposure-only lessons (phrase cards / info, `totalGraded === 0`) — reads as a bug. | Medium | `lesson/components/LessonComplete.tsx:90-104` | **FIXED** — collapse to single XP stat when nothing was graded; graded lessons unchanged. |
| 3 | Card Manager shows bare "Loading…" text (no skeleton) during the React Query retry window before falling back to the empty state. | Low | `flashcards/CardManagerPage.tsx:184-190` | **RECOMMENDED** — swap the text for a `DataTable` skeleton (n placeholder rows) to match the polish elsewhere (Social uses skeletons). Low risk but touches table layout; left for a focused pass. |
| 4 | Two oversized JS chunks: `index` 1.69 MB (gzip 479 KB) and `mockLessons` 1.86 MB (gzip 392 KB). | Low | build output | **RECOMMENDED** — pre-existing, not introduced by this branch. `mockLessons` is already lazy (route-split); consider `manualChunks` to split per-language curriculum so JA learners don't ship KO content. Not an MVP blocker. |
| 5 | Lesson `estimatedMinutes` chip ("5 min") is dropped at 390px. | Low | lesson header | **RECOMMENDED** — acceptable; noted for completeness. |

## What was checked and is clean (no action)

- **`useQuery` staleTime convention**: every real `useQuery` sets an explicit `staleTime` (e.g. `useDeckSubscriptions` 5 min on both subs + batch-deck queries). The one apparent miss (`usePracticeData`) is a typed-mock hook with no query. No violations.
- **Dead links / no-op handlers**: no `href="#"` anywhere. The `onClick={() => {}}` hits in lesson step views are all `invisible`/`aria-hidden` layout-spacer ContinueButtons (reserve height during the celebrate phase), not dead UI. Community TODOs are documented route-gating, not dead buttons.
- **Rating engine**: `reviewCard(..., "again")` resets to relearning + increments lapses (tested); `shouldRepeatInSession("again")` true. All four buttons wired through `handleRate` → `setCardState` + advance.
- **Popover/z-index**: friend menu + profile preview use the portal `DropdownMenu`/`Popover` with edge-flip; safe over sticky bars.
- **Console health**: 0 non-CORS errors on `/ja/learn`, `/ja/practice`, `/ja/practice/flashcards`, `/ja/social`, `/ja/community/explore`, `/ja/shop`, `/ja/practice/flashcards/cards`, `/ja/practice/grammar`.
- **Lesson state isolation**: `KeyedLessonPage` keys on `lessonId` so state doesn't leak across Next-lesson navigations (verified in `App.tsx`).

## Test / build state after fixes

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (exit 0).
- `npm run test:run` — 1019/1019 passing (112 files). The happy-dom `AbortError` lines in stderr are teardown noise, not failures.

## Commits on `ui/prod-review`

- `260b5ca` Flashcards: hide no-op "Start a free review" CTA when nothing to surface
- `76e3a65` Lesson complete: drop Accuracy/Score stats for exposure-only lessons
