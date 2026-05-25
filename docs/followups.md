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
