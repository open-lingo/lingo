# Session handoff — 2026-05-25 social/MVP pass

> **Pull first:** `git pull origin main` in both `lingo/` and `lingo-core/`. Many parallel changes landed.

## What shipped

### Frontend (`lingo`)

- **Spanish (`es`) UI locale** — full `es.json` (835 keys, parity with `en.json`) + registered in `i18n.ts` + "Español" option in the settings UI-locale picker.
- **Ad provider DI** — `AdProvider` interface + `FakeAdProvider` + `AdSenseAdProvider` + `AdProviderContext`; `DailyWelcomeAd` mounted in `Layout.tsx` (once-per-day, dismissible). All deferred behind the ad-free MVP scope but the wiring is in.
- **Ad-free time module** — `src/features/adFree/` — lingot-purchasable ad-free windows (30m/2h/24h), grind-detector that denies purchases when lingot-per-active-minute is too high, `AdFreePill` in header, shop section. Code stays; UI deferred per ad-free trial scope.
- **51 new UI primitives** + `useViewport`/`useBreakpoint`/`useMediaQuery`/`useFocusTrap`/`useEscapeKey` — Modal, Sheet, Dialog, Popover, Tooltip, Accordion, Toolbar, Show/ResponsiveSwitch, Portal, Field/Fieldset, Input/Textarea/Select/Checkbox/Radio/Switch/Slider/SearchInput, Spinner, CenteredLoader, EmptyState, Skeleton, Badge/Tag/Pill, Toast, Avatar, List, DescriptionList/KeyValue, SegmentedControl, Pagination, Stepper, FilterBar (mobile-Sheet collapse).
- **Learn page revamp** — YourPathCard hero (active module spotlight + per-module fluency strip), map content scrolls in its own region on desktop with a "back to current lesson" floating button, sidebar capped to viewport-height + scrolls internally. Standalone "course progress" card consolidated into YourPathCard.
- **Quests system (frontend)** — daily/weekly/random/friend types, QuestsPanel modal, QuestsPill in top bar, QuestSpotlightCard in Learn sidebar. Level/XP curve (`src/features/progress/leveling.ts`) surfaces in ProfileCard + QuestsPanel header. _Backend Quests API now exists — frontend `useQuests.ts` hook still talks to localStorage; swap to `QuestsApi` is a follow-up._
- **Social page fully wired end-to-end:**
  - `SocialApi` instantiated in `ApiProvider`. Granular hooks (`useFriends`, `useFriendRequests`, `useActivityFeed`, `useThreads`, `useLeagueSpotlight`, `useWeeklyLeaderboard`, `useMonthlyLeaderboard`, `useFriendsLeaderboard`, `useStreakSnapshot`, `useInviteOffer`) use TanStack Query against real backend when `VITE_SOCIAL_API` is on (default).
  - `useSocialMutations`: send/accept/decline friend request, unfriend, block/unblock, react-to-activity (optimistic + server reconciliation), redeem invite.
  - **Add-Friend silent-422 bug fixed** — frontend now sends `to_username` + `to_user_id` (snake_case) to match Pydantic schema.
  - Public profile route `/u/:username` with friend-state-aware primary action (`self`/`friend`/`pending`/`request_in`/`none`/`blocked`).
  - Every clickable user (activity actor, leaderboard row, friend row, message thread header) navigates to `/u/<username>`.
  - LeaderboardsSection rewritten (~825 → 631 LOC) onto real hooks. `/community/leaderboard` route renders the real backend.
  - Thread types flattened to match backend schema; lazy thread-detail fetch on selection; composer is local-only until POST messages endpoint ships (documented in `followups.md`).
  - "Find friends" empty state navigates to contributors.
  - AccountPrivacySection has "Blocked users" subsection with `listBlocks` + per-row Unblock.
  - 4 new components: `ReactionRow`, `LeagueSpotlightCard`, `FriendsLeaderboardWidget`, `InviteFriendsCard`. `UserPreviewPopover` reused across community surfaces.
  - SocialHeader uses real user (`useAuth().user.nickname/given_name/name`) and real `user.picture` via `resolveUserAvatarUrl`; UserAvatar gained `imageUrl` + onError fallback to initials.
- **Community surfaces** — Contributors page rows wrapped in `UserPreviewPopover` + explicit `AddFriendButton` column. CommunityRightRail top-contributors get the popover. `CommunityItemCard` maintainer-chip popover when `maintainerUsername` is set (waiting for backend addon DTO to expose it).
- **Deck preview from community browse restored** — `ContentBrowserPage` now passes `onPreview`/`onStoryPreview` to `CommunityItemCard` (was a no-op).
- **Practice page bug fixed** — `WeekSparkline` bars + `PracticeHubSection` accent tile were invisible because `bg-accent/80`-style Tailwind alpha-modifiers emit no CSS when the color is a CSS variable hex. Switched to inline opacity / solid tokens.
- **Practice page mocks unified** behind `usePracticeData()` + `useGrammarPracticeData()` hooks (swap-path documented for backend `/api/core/v1/practice/summary`).
- **Mobile pass** — header right-cluster collapses below `md` (Lingot + LangSel + Avatar + Menu only; Sync + AdFreePill move into the mobile menu), body-scroll-locked open menu, backdrop closes on tap-outside, 44px tap-target sweep across AuthMenu, LanguageSelector, ReactionRow, mobile nav, community CTAs.
- **Spencer's M10-M21 lesson content + 3 design docs** integrated.
- **Docs page (in-app `/docs` route) removed** — will live on a separate website.

### Backend (`lingo-core`)

- **`api_error` context manager + `require_repo` helper** — centralized error handling + 503 when a repo failed to connect at startup. Refactored users/admin/community/decks/stories routers onto the pattern.
- **Social API expansion** — reactions (`POST /activity/{id}/reactions/{kind}` toggle, response items include `reactions[]` array of all 4 kinds with `mine` flag), league spotlight (`GET /leaderboards/spotlight?lang=`), streak snapshot (`GET /streak-snapshot`), invites (`GET /invites/offer`, `POST /invites/redeem/{code}`), threads stub (`GET /threads`, `GET /threads/{id}`), friend quest targets (`GET /quest-targets`). Single `social` table split into `social_friends` + `social_friend_requests` + `social_blocks`; added `social_activity`, `social_activity_reactions`, `social_invite_codes`, `social_invite_redemptions`, `social_threads`, `social_messages`.
- **Quests API** — `GET /quests`, `POST /{id}/progress`, `POST /{id}/claim`, `POST /refresh`. New `quests` table; SQLite impl; Dynamo stub. 4 happy-path tests.
- **CORS-via-500 fixed** — activity rows with stale kinds were 500ing → FastAPI's CORS middleware doesn't add headers to unhandled errors → browser saw CORS. Fixed by remapping seed kinds + defensive filter on the canonical enum + `expose_headers=*`.
- **FSRS-6 SRS migration** (Spencer) — new `srs_cards_v2` table with JSON state + computed `due_date` index, Dynamo `state_json` attribute with `dueDate` GSI preserved, legacy SM-2 table dropped on startup. 6 integration tests.
- **Expanded seed** — 20 users (3 core + 17 named extras), 24 friendship rows, 5 friend requests, 1 block, 15 activity items, 21 reactions, 1 invite code with 2 redemptions, 2 threads with 9 messages, 6 quests for Trevor, deck `maintainerAuth0Id` attribution. `python -m scripts.seed --reset` is the dev wipe.

## Design docs added (lingo-core/docs/)

- `leagues-design-2026-05-25.md` — Bronze/Silver/Gold/Diamond/Obsidian, weekly 30-learner cohorts, top-7 promote / bottom-5 demote, reuses `social_leaderboard`.
- `xp-curve-design-2026-05-25.md` — polynomial curve `50*n*(n+9)`, source catalog + daily caps, `app/shared/xp.py:grant_xp` helper.
- `cosmetics-design-2026-05-25.md` — frames + badges + accents with rarity tiers, `cosmetics_catalog` + `user_cosmetics` tables, equip endpoint.

## Design docs added (lingo/docs/)

- `mvp-alignment-review-2026-05-25.md` — plan-vs-reality audit, MVP punch list (ad/finance work explicitly deferred per ad-free trial scope), one-week sprint plan, top risks.
- `social-engagement-research-2026-05-25.md` — what makes social features engaging; recommendations ranked by impact; referral mechanics with two-sided rewards.
- `followups.md` — running log of deferred items (backend contracts, frontend cleanups).

## Open follow-ups (see `followups.md` for full list)

- `POST /social/threads/{thread_id}/messages` — frontend composer is local-only until backend ships
- `POST /social/threads/with/{user_id}` — open-or-fetch a 1:1 thread
- `GET /social/suggestions` — frontend synthesizes from `/quest-targets` today
- `lingo` `useQuests.ts` — swap from localStorage to the new `QuestsApi`
- `useSocial()` bundle hook — move SocialHeader + home/SocialCard onto granular hooks so the bundle can be deleted
- `PeoplePage` / find-friends browser (friend-discovery agent crashed mid-write — only the seed `maintainerAuth0Id` attribution survived)
- `refactor/ui-primitives-consolidation` branch still has the modal-stack migration commit (`a7690d5`) — pull when ready to remove the legacy `ConfirmModal` / `ModalBase` / `ModalBackdrop`
- Site-wide Tailwind alpha-modifier bug — `bg-/text-/border-{accent|warning|success|error}/<N>` silently emits no CSS because `tokens.css` stores hex strings. Fix at the tokens.css + tailwind.config level converts colors to channel triples `5 150 105` + `rgb(var(--color-accent) / <alpha-value>)`. Patched the two visible offenders (WeekSparkline, PracticeHubSection); full sweep is a one-commit follow-up.

## MVP must-ships still open (from review doc)

1. Korean content scope decision (JA-only or 2-3 week KO push)
2. Hide / label any remaining mock-driven UI (home rail still pulls some `MOCK_*` for tiles)
3. Staging environment
4. Prod Auth0 + `DEBUG=false` guard
5. Rate limiting (`slowapi` on sync/decks/users)
6. Sentry on both sides

## How to verify locally

```bash
# Backend
cd lingo-core
python -m scripts.seed --reset   # wipes + reseeds DB (20 users, all the social state)
uvicorn app.main:app --reload --port 8000

# Frontend
cd lingo
npm run dev                       # Vite on :5173, hits backend on :8000
```

Then sign in (or use dev auth bypass) and exercise: add-friend on contributors, react on activity feed, open thread, redeem invite, claim a quest, browse leaderboards.
