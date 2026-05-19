# Social Page — Design Spec (2026-05-18)

## Goal

Stand up a dedicated `/:lang/social` surface that consolidates three social affordances that currently either don't exist or sit awkwardly in `community/` and `home/`:

1. **Friends** — list, search, requests, suggestions.
2. **Messages** — 1-1 direct messaging.
3. **Leaderboards** — Weekly Sprint (league), Monthly (top XP + top lessons), Friends-only.

This pass ships a frontend-only mockup at `/:lang/social-preview` (dev gate, same pattern as `home-preview`) so Spencer can validate the layout, density, and cosmetic-slot system before backend work begins.

## Non-goals

- Backend wiring. Every surface is fed by mock data in `src/features/social/mock/mockSocial.ts`.
- Top-nav restructure. The mockup is reachable by direct URL — proper nav placement is a separate pass.
- Group chat, voice/audio messages, read receipts, real-time presence, study-buddy pair matching, share-my-result cards. Deferred.
- Block/report flows beyond a "more" menu affordance. UI only.
- Real cosmetic system (rarity tiers, pricing, unlock conditions). The mockup demonstrates the **slot** so the system can drop in later.

## Industry baseline

Patterns drawn from Duolingo, Discord, Steam, Snapchat, Memrise, BeReal:

- Tabbed top-level surface (Discord-style sidebar reduced to top tabs for mobile parity).
- Single-column thread list + active conversation pane (Snapchat / Telegram).
- League card with promotion / demotion zones (Duolingo Diamond League).
- Per-row quick action set: message · profile · more (Steam friends panel).
- Lightweight activity feed with one-tap kudos (Memrise mems / Duolingo "encourage").
- Click-to-open profile preview (Steam, Discord).

## Approved scope additions

From the brainstorm question:

- ✅ **Activity feed peek** — horizontal strip on Friends tab.
- ✅ **High-five / kudos reaction** — `KudosButton` reusable across surfaces.
- ✅ **Profile hover/click preview** — `ProfilePreviewPopover` triggered from any avatar in social surfaces.
- ❌ **Share-my-result card** — deferred.

## Cosmetic slot system

The single most important architectural choice: every avatar and username in the social page renders through cosmetic-aware primitives so the future cosmetics system can drop in without per-call-site refactors.

- `UserAvatar` accepts a `frame` prop: `{ kind: "none" | "solid" | "gradient" | "animated", … }`. The default is `{ kind: "none" }`.
- `UsernameDisplay` accepts a `cosmetic` prop: `{ color?, gradient?, badge?, weight? }`. Default renders plain `text-primary` semibold.
- The mockup demonstrates 4 cosmetic combinations across the friends list so the spectrum is visible (none, bronze, gold w/ verified check, animated rainbow w/ crown).

Real cosmetics will hang off the user record; the React primitives don't need to change.

## Layout

### Unified social page + standalone messenger (current direction, revised twice on 2026-05-18)

Spencer's second revision split messenger out to its own route — embedding a chat pane on the social page was too dense, and a dedicated full-height messenger reads more like a real product. Leaderboards collapse back into a single card with a tab switcher.

**`/:lang/social-preview` — three primary blocks:**

1. **Header bar** (`SocialHeader`, Card with gradient surface) — avatar + name with cosmetic, you-stats chip row (league + rank, streak, weekly XP), and three CTAs: **Messages** (`Link → /:lang/messenger` with unread-count badge), **Add friend**, **Invite**.
2. **Activity strip** — full-width horizontal scroll.
3. **Friends row** — `lg:grid-cols-3 items-start`: search + friends list `col-span-2`; requests-panel + suggestions-panel stacked `col-span-1`.
4. **Leaderboards card** (`UnifiedLeaderboardCard`) — single Card with a header (kicker + title + period info), a tab strip (Weekly · Monthly · Friends), and edge-to-edge body content. The Weekly body keeps its gradient league header + zone legend. Monthly is a 2-up grid of Top XP / Top Lessons. Friends-only is a single board with the anti-stagnation footer copy.

Below `lg`, every grid stacks single-column.

**`/:lang/messenger` and `/:lang/messenger/:friendId` — standalone messenger:**

- Full-height conversation app. Page header has a back link to the social page.
- `MessagesSection` accepts `initialFriendId` to deep-link directly to a friend's thread (matched on `ChatThread.user.id`).
- Friend rows in the social page wire their message icon to `/:lang/messenger/<user.id>`.
- Container height is `h-[calc(100vh-200px)] min-h-[480px]` for the page, vs the embedded variant's fixed `h-[560px]` (still available via the `heightClassName` prop).

### Harmony pass

- All top-level surfaces are `Card` components → consistent `rounded-xl`, border, shadow.
- `Card padding="lg"` standard for content panels; `padding="none"` for cards with their own internal headers (activity strip, leaderboard card, messenger).
- Header CTAs share the same shape (bg-accent primary; border-border + bg-surface secondary).
- Friend-row message button is now a `Link` (not a button), so middle-click / cmd-click open in a new tab like any nav element.
- Kicker pattern (`uppercase tracking-wider text-text-muted text-xs font-semibold` → bold title) is consistent across SocialHeader, leaderboard card, panel headers.

### Production routing (future)

- `/:lang/social` replaces `/:lang/community/leaderboard`'s "coming soon" splash.
- `/:lang/messenger` already shipped at the right shape — preview path will move from `social-preview` to `social` once approved.
- Section files factored into named composable exports so future surfaces can recompose without re-extracting from a wrapper.

## Per-section spec

### Friends section

- **Search + Add row** — text input (live filter on the mock list), `Add friend` primary CTA, `Share invite` secondary.
- **Activity feed strip** — horizontal scroll of recent friend events; each card has avatar, username, event kind icon, body, kudos count + button, reply CTA.
- **Friend requests panel** — only rendered when `requests.length > 0`. Accept / decline buttons, grid layout.
- **Friends list** — two-column on `lg+`, single column on mobile. Row contents: avatar (cosmetic-aware, click → popover) · username (cosmetic-aware) · language flag · last-active label · streak chip · message button · more button. Live-filtered by search.
- **Suggestions panel** — dashed-border tiles showing 2 suggested users with reason text.

### Messages section

- **Two-pane layout** — `280px` thread list on the left, conversation pane on the right. Mobile: list and thread swap via `mobilePane` state.
- **Thread list row** — avatar (with status dot + frame) · username · timestamp · last message preview · unread badge.
- **Conversation header** — small avatar · username · presence label · more button.
- **Message bubbles** — own messages right-aligned `bg-accent text-on-accent`, others left-aligned `bg-surface text-text-primary`. Day separators rendered above the first message.
- **Reactions** — chip below the bubble showing emoji + count (mock-only, single emoji per message in v1).
- **Composer** — emoji button · textarea (Enter to send, Shift+Enter newline) · send button. Empty thread shows "Say hi" empty state with a "👋" KudosButton.

### Leaderboards section

- **Segmented control** — Weekly Sprint · Monthly · Friends.

**Weekly Sprint (league card):**
- Header: league emblem · league name · tier index/total · reset timer.
- Zone legend: top-N promote, bottom-N demote.
- Row contents: rank badge (gold/silver/bronze gradients for 1-3, plain circle for 4+) · avatar (popover trigger) · username + cosmetic + flag · lessons-this-period · streak · delta indicator (▲/▼/—) · XP · zone tag.
- Current user row highlighted with `bg-accent-muted` + "You" pill.

**Monthly:**
- Two-up grid on `lg+`. Left: top-XP this month. Right: top-lessons-completed this month.
- Same row shape as Weekly minus the league-zone tag.

**Friends-only:**
- Single card, weekly XP scoped to user's friends + self.
- Footer copy nudges the user toward Weekly Sprint for bigger competition (anti-stagnation).

## File layout

```
src/features/social/
├── components/
│   ├── KudosButton.tsx          one-tap reaction (👋 / 🔥)
│   ├── ProfilePreviewPopover.tsx click-open mini profile
│   ├── UserAvatar.tsx           cosmetic-ready avatar (frame slot)
│   └── UsernameDisplay.tsx      cosmetic-ready name (color/gradient/badge slots)
├── mock/
│   └── mockSocial.ts            all fake data; greppable `MOCK:` comments
├── preview/
│   └── SocialPreviewPage.tsx    /:lang/social-preview entry, stacks all three
└── sections/
    ├── ActivityFeedStrip.tsx
    ├── FriendsSection.tsx
    ├── MessagesSection.tsx
    └── LeaderboardsSection.tsx
```

Icon registry gained: `search`, `send`, `smile`, `sparkles`, `trophy`, `crown`, `heart`, `hand`, `messageCircle`, `users`, `userPlus`, `moreHorizontal`.

## Wiring map (deferred follow-up)

| Surface | Mock symbol | Real source |
|---|---|---|
| Friends list | `MOCK_FRIENDS` | `users.getFriends()` |
| Friend requests | `MOCK_FRIEND_REQUESTS` | `users.getIncomingRequests()` |
| Friend suggestions | `MOCK_FRIEND_SUGGESTIONS` | `users.getSuggestions()` (mutual-friends + same-module heuristic) |
| Activity feed | `MOCK_ACTIVITY` | Activity stream subscription (consider Liveblocks / SSE) |
| Threads | `MOCK_THREADS` | `messages.listThreads()` + `messages.listMessages(threadId)` |
| Send message | local state push | `messages.send(threadId, body)` |
| Weekly leaderboard | `MOCK_WEEKLY_LB` + `MOCK_LEAGUE` | `leaderboards.weekly({ leagueId })` |
| Monthly | `MOCK_MONTHLY_LB` | `leaderboards.monthly({ metric })` |
| Friends-only LB | `MOCK_FRIENDS_LB` | `leaderboards.friends({ period: "weekly" })` |
| Kudos | local toggle | `activity.giveKudos(activityId)` |

## Risks

- **League naming** (Sapphire / Cobalt) is placeholder. Real league taxonomy needs design pass; Duolingo's 10-tier system is heavy and may not suit Lingo.
- **Profile preview popover** uses local state + transparent backdrop. Fine for mockup, but real impl should use a portal-based Popover so it doesn't get clipped by `overflow-hidden` ancestors.
- **Composer textarea** auto-grows in mockup via `rows={1}` + `max-h-24` only. Real composer needs auto-resize util.
- **Cosmetics-on-text** uses `background-clip: text` which silently degrades in older browsers. Acceptable today (>96% support) but document the fallback path before cosmetics ship.

## Acceptance

The mockup at `/:lang/social-preview` should:

1. Render without runtime errors on JA, KO, ES.
2. Show all three sections with cosmetic variations clearly visible.
3. Search filter in Friends section narrows the list interactively.
4. Composer send appends a message bubble in the active thread.
5. Leaderboard segmented control swaps content without page nav.
6. Profile popover opens on any avatar click and closes on outside click.
7. Typecheck + build green.
