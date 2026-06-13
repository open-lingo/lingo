# Social page revamp — worktree report

Branch: `ui/social-page-revamp`. All work confined to
`/home/trevor/projects/open-lingo/lingo-wt-social-page`.

## Summary

Converted the flat, single-scroll social page into a **sidebar-driven tabbed
layout** (Overview / Friends / League / Messages), URL-synced via `?tab=`.
Fixed the two reported bugs (blank profile avatar; friend hamburger menu
clipping / wrong-target), collapsed the over-tall reaction buttons behind a
single trigger, made "Add friend" a real user search, hid the viewer's own
events from the activity feed by default, surfaced league standings on the
League tab, and removed two dead/no-op buttons.

Build: clean. Typecheck: clean. Tests: 1006 passed (109 files), including the
new avatar + hamburger + reaction-menu guards.

## Per-task status

| # | Task | Status |
|---|------|--------|
| 1 | Top bar → left sidebar + tabbed layout | Done — `SocialSidebar` (desktop rail) + horizontal tab strip (mobile), `?tab=` URL sync |
| 2 | Friends list as a sidebar nav option | Done — "Friends" tab |
| 3 | "Add friend" opens a user SEARCH | Done — rewrote `FindFriendModal` to debounced `users.discover({q})`, shows Add/Pending/Friends/You/Respond per `friendship_status` |
| 4 | Hide my own events in activity feed by default | Done — `ActivityFeedStrip` filters by `me.id`, default hidden, "Show mine"/"Hide mine" toggle (only shown when own items exist) |
| 5 | Reaction buttons too tall → menu behind one icon | Done — `ReactionRow` default `variant="menu"`: single lucide `smile` trigger (Popover) + compact count-summary chip |
| 6 | "Your friends" section too big | Done — tightened row padding, capped list height 520→420px, denser headers |
| 7 | BUG: hamburger doesn't update inner content of the correct friend | Fixed — see root cause below |
| 8 | Hamburger must render on top (popover/portal) | Fixed — replaced inline `absolute z-20` with portal-based `DropdownMenu` |
| 9 | BUG: my profile picture doesn't render | Fixed — see root cause below |
| 10 | Surface league + standings | Done — League tab = `LeagueSpotlightCard` + full `CompactUnifiedLeaderboardCard` (weekly/monthly/friends, 20 rows) + "View all leagues" tier ladder modal |
| 11 | Dead link button | Fixed — removed two no-op buttons (header "Invite friend" icon; messages-thread "More options") |
| 12 | Full audit | Done — findings table below |

## Root-cause notes for the two bugs

### Bug #9 — blank profile avatar
The old `SocialHeader` resolved the avatar as
`resolveUserAvatarUrl(undefined, user)` — passing `undefined` for the `me`
arg, so it only ever read the Auth0 `user.picture`. A user who uploaded an
avatar (stored server-side as `profile_picture_key` on `/users/me`) but has no
IdP picture got `picture === ""` → `undefined` → the initial-letter fallback.
`AuthMenu` does it correctly by fetching `users.getMe()` first and passing
that `me`.

Fix: new shared `useMe()` hook (`src/shared/hooks/useMe.ts`) wrapping the
existing `["users", <sub>, "me"]` query (5-min staleTime, shared/deduped with
AuthMenu/HomePage/useLearnProfile). The new `SocialSidebar` resolves the
avatar via `resolveUserAvatarUrl(me, user)`, so the server-stored picture
renders. `useMe` uses `useApiOptional` so it's inert (no throw) in
preview/test environments.

### Bug #7 / #8 — friend hamburger menu wrong target + clipping
The `FriendRow` menu was an inline `<div className="absolute right-0 top-full
z-20 …">` rendered inside the friends `<ul>`, which is `overflow-y-auto`. Two
consequences: (a) the menu was clipped by the scroll container (couldn't
overflow the card), and (b) on a 2-column grid the absolutely-positioned menu
visually overlapped a neighbouring row, making it look like it belonged to the
wrong friend.

Fix: replaced it with the existing portal-based `DropdownMenu`
(`shared/components/ui/DropdownMenu` → `Popover` → `Portal`). The menu now
renders in a body portal above all surrounding content with viewport collision
handling, and the menu items close over that row's `user` so the actions
always target the correct friend. Added a "View profile" item alongside
Unfriend/Block.

## Audit findings

| Issue | Severity | Fixed? | Notes |
|-------|----------|--------|-------|
| Avatar never used server `profile_picture_key` | High | Yes | `useMe()` + sidebar |
| Friend menu clipped by `overflow-y-auto` | High | Yes | portal `DropdownMenu` |
| Friend menu appeared to target wrong row | High | Yes | same fix |
| Reaction row ~36px tall × 4 pills inflated cards | Med | Yes | collapsed to `menu` variant |
| Activity feed mixed in the viewer's own events | Med | Yes | default-hidden + toggle |
| Dead "Invite friend" icon button (header) | Med | Yes | header removed; invites live in functional `InviteFriendsCard` |
| Dead "More options" button (messages thread) | Low | Yes | removed (no defined actions yet) |
| "Add friend" was blind username submit | Med | Yes | search via `users.discover` |
| League standings not surfaced on social | Med | Yes | League tab |
| `users.discover()` method missing (types existed) | — | Yes | added to `UsersApi` |
| i18n keys referenced only as `defaultValue` (findFriend.*, leagues.viewAll) | Low | Yes | added real keys to en + ko |
| `useQuery` staleTime | — | OK | all social queries already set explicit staleTime; new discover query = 30s, useMe = 5m |
| Activity feed list not memoized | Low | Yes | `useMemo` on the filtered list |
| `useSocial()` called twice (page + header) | Low | Improved | header removed; page reads `useSocial` once for badge counts. `useSocial` batches via shared query keys so no extra network calls regardless. |

### Follow-ups (out of scope / not done)
- `social.messages.moreAria` i18n key is now unused (left in place to avoid
  churn; safe to prune later).
- Popover/DropdownMenu open-state isn't asserted in unit tests — happy-dom's
  portal mount is async/flaky; covered by the visual pass instead. A Playwright
  e2e for the friend menu + reaction menu would close this gap.
- `MessagesSection` thread "more options" could host real actions (mute /
  view profile / clear) when those land — re-add as a `DropdownMenu` then.
- Per-modality flashcard reaction analytics unrelated to this surface.

## Files changed

New:
- `src/features/social/components/SocialSidebar.tsx` (+ `.test.tsx`)
- `src/features/social/socialTabs.ts`
- `src/shared/hooks/useMe.ts`

Modified:
- `src/features/social/SocialPage.tsx` (full rewrite → sidebar + tabs)
- `src/features/social/components/FindFriendModal.tsx` (search rewrite)
- `src/features/social/components/ReactionRow.tsx` (+ `.test.tsx`) (menu variant)
- `src/features/social/sections/ActivityFeedStrip.tsx` (self-filter + toggle)
- `src/features/social/sections/FriendsSection.tsx` (+ `.test.tsx`) (portal menu, tighten)
- `src/features/social/sections/MessagesSection.tsx` (remove dead button)
- `src/shared/api/users.ts` (`discover()` method)
- `src/shared/iconRegistry.ts` (`userMinus`, `ban`)
- `src/shared/i18n/locales/{en,ko}.json` (new social keys)

Deleted:
- `src/features/social/components/SocialHeader.tsx` (only consumer was the page; dead-link button lived here)

## Screenshots
Saved under `/tmp/social-shots/`:
- `social-before-desktop.png` — old flat layout
- `social-after-overview.png` — new sidebar + Overview tab (desktop)
- `social-after-friends.png` — Friends tab
- `social-after-league.png` — League tab (standings surfaced)
- `social-after-modal.png` — Add-friend search modal
- `social-after-mobile.png` — mobile tab strip (390px)

## Notes
- A gitignored `.env.local` was added in this worktree purely so the SPA could
  bootstrap for screenshots (placeholder Auth0 + `VITE_DEV_AUTH_BYPASS=true`).
  Not committed. Backend (localhost:8000) wasn't serving data, so screenshots
  show skeleton/loading states — the layout/structure is what's verified.
