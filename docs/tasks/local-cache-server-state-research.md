# Task: Local Cache & Server State — Research & Standardization

**Context:** Open Lingo has many ad‑hoc local cache patterns (localStorage, various keys) and TanStack Query for server data. We need a coherent strategy for both layers and how they interact.

**Status:** Investigation / planning — not implementation yet.

## Current state

### Local cache (ad‑hoc)

| Domain | Storage | Key pattern | Used by |
|--------|---------|-------------|---------|
| Themes | localStorage | `open-lingo-themes`, `open-lingo-starred-themes` | ThemeContext, storage |
| Settings | localStorage | `open-lingo-settings`, per‑user | SettingsContext, storage |
| SRS state | localStorage | `open-lingo-srs`, `*-last-sync`, `*-next-sync` | engine/srsStorage |
| Alphabet progress | localStorage | keyed by lang + alphabet | alphabetProgress |
| Story drafts | localStorage | `open-lingo-story-draft` | storyDraftStorage |
| Profile cache | localStorage | `open-lingo-profile-{userId}` | profileStorage |
| External subscriptions | localStorage | custom keys | useExternalContentSubscriptions |
| Review mode | localStorage | `openlingo-review-mode` | FlashcardTester |

### Server state (TanStack Query)

- `useQuery` / `useMutation` for users, settings, SRS sync, decks, cards
- Query keys like `["users", "me"]`, `["decks", languageId]`, etc.

## Goals

1. **Research** local cache patterns — what should be source of truth vs. derived?
2. **Research** server state — TanStack usage, sync flows, offline handling
3. **Design** a layer for “derived from local cache” — similar to TanStack’s mental model but for local-first data
4. **Propose** conventions: local cache as source of truth, TanStack as updater/sync layer?

## Design questions

- **Local-first vs. server-first?** For SRS, settings, themes — should local be source of truth with sync, or server?
- **Derived data:** Things like “cards due today” depend on SRS state + deck content. Where does that derivation live? A custom layer above local cache?
- **Unified read/write API:** Can we standardize how components read/write local cache (get/set/invalidate) similar to `useQuery`/`useMutation`?
- **Sync boundaries:** When does TanStack invalidate/refetch? When does local cache push to server?

## Deliverables (investigation phase)

- [ ] Audit: list all local cache read/write sites and patterns
- [ ] Audit: list all TanStack Query usage (queries, mutations, invalidation)
- [ ] Document: current data flow (local ↔ server ↔ UI)
- [ ] Propose: architecture (e.g. local = source of truth, TanStack = sync; or hybrid)
- [ ] Propose: conventions for derived-from-local data (hooks? store? sync with TanStack?)
- [ ] Write: `docs/LOCAL_CACHE_SERVER_STATE.md` with findings and recommendations

## Out of scope (for now)

- Implementing a new cache layer
- Migrating existing code
- IndexedDB or other storage backends (stay with localStorage for now)

## Files to explore

- `src/features/settings/storage.ts`
- `src/features/settings/profileStorage.ts`
- `src/shared/theme/storage.ts`
- `src/features/flashcards/engine/srsStorage.ts`
- `src/features/practice/alphabet/alphabetProgress.ts`
- `src/features/community/contribute/storyDraftStorage.ts`
- `src/features/community/useExternalContentSubscriptions.ts`
- `src/features/flashcards/useSubscriptionQueue.ts`, `useCardManagerData.ts`, etc.
- `src/shared/api/` — TanStack usage in API layer
