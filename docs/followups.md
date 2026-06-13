# Follow-ups

One-line follow-ups discovered while finishing the social/community surfaces.
Each entry: `file:line — note`.

## Backend contracts the frontend is waiting on

- `lingo-core` POST `/social/threads/{thread_id}/messages` — frontend composer
  (`src/features/social/sections/MessagesSection.tsx:128`) appends locally only;
  drafts evaporate on reload until backend ships the send endpoint.
- `lingo-core` POST `/social/threads/with/{user_id}` — opens-or-fetches the
  thread between two users; today the frontend "Message" affordance on a
  friend row deep-links to `/messenger/{friend_id}` and lets the messenger
  fall back to the most recent thread when no match exists.
- `lingo-core` GET `/social/suggestions[?lang=…]` — until it ships,
  `useFriendSuggestions` (`src/features/social/hooks/useSocial.ts:308`)
  synthesizes suggestions from `/quest-targets` minus current friends/requests.

## Frontend cleanups deferred (low priority)

- `src/features/social/hooks/useSocial.ts:143` — the `useSocial()` bundle hook
  stays mock-backed for `SocialHeader` and `home/SocialCard`. Move both
  consumers onto the granular hooks so the bundle can be deleted.
- `src/features/community/ContentBrowserPage.tsx:530` — TODO comment about a
  flagged-off route; resolve when the route lands or remove the flag entirely.
- `src/features/community/CommunityRightRail.tsx:13` — `MOCK_TOP_CONTRIBUTORS`
  / `MOCK_TRENDING_TAGS` inline mocks; replace once the community contributors
  + tags endpoints exist.
- `src/features/home/restructured/{AccountOverviewCard,QuestsCard,RecentPracticeTile,CommunityStrip}.tsx`
  — read from `mockHomeData.ts`; wire to real progress endpoints when the
  home restructure picks up backend work.
- ~~`useQuests.ts` localStorage swap~~ — DONE 2026-06-13: hook is
  server-authoritative against the real `app/quests/` backend (the
  2026-05-25 "backend shipped" claim was false — that agent died
  uncommitted). Remaining: client-side application of `adFreeMinutes`
  claim rewards; friend-quest generation.
- `src/features/profile/PublicProfilePage.tsx` — relies on
  `friendship_status` from `social.getPublicProfile`. If a user has never
  triggered the social cache yet, all profiles show "Add friend". Acceptable
  for MVP but worth an eager prefetch in `AuthMenu` on app start.
- `src/features/social/components/ProfilePreviewPopover.tsx` (the older one)
  routes to `/u/<user.name>` (display name), not username — names with spaces
  404. One-line fix to use `username` instead.
- `src/features/community/PeoplePage.tsx` — never landed (friend-discovery
  agent crashed mid-write). Only its seed `maintainerAuth0Id` deck
  attribution survived. Pick up the find-friends browser scope when ready.

## Theme tokens

- `src/shared/styles/tokens.css` stores color values as hex strings
  (`--color-accent: #059669`). Tailwind v3's alpha-modifier syntax
  (`bg-accent/80`) requires the source to be a channel triple
  (`5 150 105`) + `rgb(var(--color-accent) / <alpha-value>)` in
  `tailwind.config.js`. Today every `bg-/text-/border-{accent|warning|
  success|error}/<N>` class silently emits no CSS. Patched two visible
  offenders (`WeekSparkline`, `PracticeHubSection`); the proper sweep is
  one commit affecting tokens.css + presets.ts + web-adapter.ts +
  tailwind.config.js. Resurrects every `*-token/<N>` class app-wide.

## UI primitive migration

- `refactor/ui-primitives-consolidation` branch (worktree pruned, branch
  preserved) has the modal-stack migration commit `a7690d5` that wasn't
  merged. Legacy `ConfirmModal` / `ModalBase` / `ModalBackdrop` still
  ship alongside the new `Modal` / `Dialog`. 13 call sites use the legacy
  trinity. Pull the commit when ready to one-shot the migration.

## Lesson UI polish ledger (M1–7 walkthrough, 2026-06-13)

### DONE this session (uncommitted, pending Spencer review)
- Empty SRS review (`ja-mN-review-1/2` with nothing due) no longer awards XP / marks the node complete — `isEmptyReviewLesson` guard in `LessonPage.tsx` + `emptyReviewGuard.test.ts`. Redirects to Learn, hides the XP chip.
- SymbolIntro single-glyph dead-space: content centered in space above the CTA (`flex-1 + justify-center`).
- CTA harmony: SymbolTrace / SymbolProduction / DialogueListen now anchor the Check button at the standard y≈749 (added a `flex-1` spacer) instead of floating ~130px high. DialogueListen banner no longer nudges the CTA on commit.

### OPEN — deferred, don't forget
- **Match-pairs shouldn't use full sentences** as match items — looks tacky. Prefer single words / short phrases. (Spencer flagged.)
- **SymbolIntro residual top dead-space**: centering leaves an equal gap above the glyph; Spencer suspects it may be a light-mode perception thing. Revisit.
- **Correct-answer celebration is brief (1100ms `CELEBRATE_MS`)** — fast clickers barely register it. Optional: bump duration or make it more felt. (Affirmation exists in every graded view; not missing.)
- **CTA anchor unverified on Translate / FillBlank** — measured Trace/Production/Dialogue + 6 anchored views; these two share the top-stacked root pattern but weren't reached. Check they hit y≈749.
- **Trace CHECK is clickable on an empty canvas** → scores 0% / burns an attempt. Could disable until `hasStrokes`.
- Cosmetic: generic globe icon reused on every `infoStep` open card; double romaji (per-kana ruby + transliteration line) on grammar/example cards; particle を shows ruby "o" but line "wo" (harmless convention mismatch).
- Row-test "3 dots" = mistake indicator (`MAX_TEST_MISTAKES`), not progress — could be clearer to a first-timer.
