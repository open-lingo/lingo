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
- `src/features/quests/useQuests.ts` — talks to localStorage only. Backend
  `GET /quests` / `POST /{id}/progress` / `claim` / `refresh` shipped this
  session; swap is mechanical (wrap in `useQuery` + add a `QuestsApi` client).
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
