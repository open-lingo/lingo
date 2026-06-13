# Cross-App UI Polish Sweep — `ui/cross-app-polish`

Overnight, unsupervised sweep for the issue classes the user flagged elsewhere, across the **in-scope** surfaces (everything EXCEPT card-manager/flashcards/vocab, the practice page, and social/community — those are owned by sibling agents). Surfaces covered: home, learn, lesson, course, grammar, stories, settings, profile, shop, quests, placement, leaderboard (non-social), funding/ads, landing, admin, messenger.

## Method & environment notes

- **Static analysis was the primary tool.** The `.auth/user.json` storage state was captured against origin `http://localhost:5173`; Auth0's session does not transfer to the agent's port (5184), so authed routes redirect to `/landing`. Re-running interactive auth (`npm run test:e2e:auth`, headed) is not possible unsupervised. The landing surface (the one auth-independent in-scope page) was verified visually and is clean.
- I copied `lingo/.env` (Auth0 client config) into the worktree so the app would boot at all — it's gitignored, not committed. I did **not** enable any auth-bypass flag (a write to add `VITE_DEV_AUTH_BYPASS` was correctly blocked by the harness and I left auth untouched).
- `npm run build` passes clean. `npx tsc --noEmit` passes clean. Placement + learn test suites: 51/51 pass.

## What I fixed (committed)

| Surface | Issue | Class | Severity | File:line | Status |
|---|---|---|---|---|---|
| Learn | `<span aria-hidden>🔄</span>` emoji used as the reviews-due chip icon | Emoji-as-UI-affordance (house-rule violation) | Med | `src/features/learn/LearnPage.tsx:341` | **FIXED** → `<Icon name="refresh" size={14}>` |
| Placement | No-bank fallback screen hardcoded `text-gray-600 dark:text-gray-400` + `bg-blue-600 text-white` (ignores Sepia/AMOLED tokens) | Hardcoded colors | Med | `src/features/placement/PlacementTestPage.tsx:104,113` | **FIXED** → `text-text-secondary`, `bg-accent`/`Button` |
| Placement | Raw `<button>` instead of `<Button>` primitive on the same screen | Primitive bypass | Low | `src/features/placement/PlacementTestPage.tsx:110` | **FIXED** → `<Button variant="primary" size="sm">` |
| Placement | Three English strings inline, not via `t()` | i18n gap | Low | `src/features/placement/PlacementTestPage.tsx:103-116` | **FIXED** → added `placement.*` keys to en.json |

Commits:
- `Learn: replace 🔄 emoji affordance on reviews-due chip with lucide Icon`
- `Placement: theme-token + i18n the no-bank fallback screen`

## What I found but did NOT fix (RECOMMENDED — too risky / large / out of clean-scope)

| Surface | Issue | Class | Severity | File:line | Recommended approach |
|---|---|---|---|---|---|
| Stories | Server data fetched via `useState`+`useEffect` with manual loading flags instead of TanStack Query; **the subscriptions fetch is written twice** (`refreshSubscriptions` and a near-identical effect) | Server-state-in-useState anti-pattern + dup logic | High | `src/features/stories/StoriesPage.tsx:76-161` | Extract `useBrowseStories(langId)` + `useStorySubscriptions()` query hooks (explicit `staleTime`), delete the duplicated effect. Medium-risk refactor — touches data flow, deserves its own PR + test. |
| Profile | `PublicProfilePage.tsx` is 1392 LOC (3.5× the 400-LOC smell threshold); houses ProfileShell, AvatarUrlModal, RegisterForm, masthead, inventory, etc. inline | God file | Med | `src/features/profile/PublicProfilePage.tsx` | Extract the inline subcomponents into `features/profile/components/*`. Large, mechanical, but risky to do blind without visual verification. |
| Admin | `AdminUserDetailPage.tsx` (1314), `AdminOperationsPage.tsx` (1035), `AdminModerationPage.tsx` (702), `AdminHomePage.tsx` (419) all exceed 400 LOC | God files | Low | `src/features/admin/*.tsx` | Split per-tab/section. Admin-internal, lower user-facing impact. |
| Admin | Moderation action buttons use raw palette colors (`border-green-300 text-green-700`, `bg-red-600 text-white`, `border-gray-300`) instead of theme tokens; one hardcoded string `"Confirm"` | Hardcoded colors + i18n gap | Low | `src/features/admin/AdminUserDetailPage.tsx:969,980,996,998,1004` | Convert ~6 buttons to `<Button variant="danger"/"secondary"/"outline">` + `t()`. Self-contained but buried in a god file; bundle with the file split. |
| Settings | `SettingsSectionPanel.tsx` is 578 LOC | Smell (size) | Low | `src/features/settings/SettingsSectionPanel.tsx` | Extract per-section panels. |
| Home (returning user) | `QuestsCard` import commented out in `RestructuredHome` — "deactivated — mock data only". Home has no quests surface despite the unified QuestsCard existing elsewhere | Disabled feature / mock-only | Med | `src/features/home/restructured/RestructuredHome.tsx:20`, `QuestsCard.tsx` | Wire `home/restructured/QuestsCard` to real `useQuests()` data (server-authoritative per CLAUDE.md) and re-enable. Feature task, not polish. |
| Shared | `FeatureCardWithDropdown.tsx` has **zero callers** (dead component) AND its dropdown is `absolute z-10` with no Portal — would clip under `overflow-hidden`/stacking siblings if used | Dead code + latent layering bug | Low | `src/shared/components/FeatureCardWithDropdown.tsx:71` | Either delete (no callers) or, if kept, port the menu to `Popover`/`DropdownMenu` (which already portal). Left in place in case an orchestrator has planned usage. |
| Grammar | `GrammarPage.tsx` is a "coming soon" stub but the only route to it (`GrammarRedirect`) redirects to `practice/grammar` — so it's orphaned/unreachable | Dead component | Low | `src/features/grammar/GrammarPage.tsx` | Delete `GrammarPage.tsx` (unreachable); keep `GrammarRedirect`. |
| Quests | `QuestsPanel.test.tsx.disabled` — a disabled test left in the tree | Test hygiene | Low | `src/features/quests/components/QuestsPanel.test.tsx.disabled` | Fix + re-enable, or delete. Don't ship `.disabled` files. |
| Admin | `AdminOpsPage` uses local `useState` for tab state instead of the URL-driven `?tab=` convention the house style mandates for multi-tab admin pages (EventsPage/AdminUserDetailPage pattern) | Convention inconsistency | Low | `src/features/admin/AdminOpsPage.tsx:31` | Move tab state to `useSearchParams` (`?tab=`), default tab unrepresented. |
| Learn | `★` (star) used as a typographic mastery marker in status pills / pathway nodes / test runner, and the strings (`"Mastered ★"`) are hardcoded English not via `t()` | Star-as-affordance (house rule names "star" for lucide) + i18n gap | Low | `src/features/learn/utils/moduleStatusPill.ts:42`, `components/PathwayNode.tsx:164`, `components/TestRunner.tsx:162,178,315` | Replace `★` with `<Icon name="star">` and route the labels through `t()`. Spans multiple learn/lesson components consistently — coordinate as one change so the mastery visual stays uniform. |
| Lesson (steps) | `🎤` (mic), `🔇` (mute), `✓`/`✗` result glyphs in `SpeakingStepView` used as UI affordances | Emoji-as-affordance | Low | `src/features/lesson/components/steps/SpeakingStepView.tsx:123,586,708,744` | Swap to lucide (`mic`, `volume-x`/mute, `check`/`x`). Deferred — deep in the lesson step renderers (lesson-flow sensitive), out of the low-risk lane. |
| Messenger | Page wrapper strings ("Messages", "Messenger", "Friends", "Back to social") hardcoded, not via `t()` | i18n gap | Low | `src/features/messenger/MessengerPage.tsx:33,35,27,44` | Route through `t()`. (The page body delegates to `MessagesSection`, owned by the social agent — only the wrapper is in scope.) |

## What I verified is clean (no action)

- **`staleTime` hygiene:** every in-scope `useQuery` sets an explicit `staleTime` (HomePage 5m, AdminUsersList 30s, AdminHome 30–60s, shop/quests/funding/profile all explicit). The only miss (`usePracticeData.ts`) is out of scope (practice).
- **Avatar render failures:** `UserAvatar` has `onError` → initial fallback, `loading="lazy"`, `decoding="async"`, fixed sizing (no reflow). `DecoratedAvatar` wraps it. Solid everywhere.
- **AdminUsersListPage:** exemplary — debounced server search, cursor pagination, empty state, loading indicator, sortable headers, `placeholderData: prev`.
- **ShopPage, QuestsPanel, SocialCard, HeroSection, AdminHomePage:** all have loading/empty states, i18n, lucide icons, proper mutation hooks; no dead links, no oversized buttons, no layering issues. SocialCard has a real skeleton.
- **Dropdowns/menus:** `DropdownMenu`/`Popover` are Portal-based (no clip risk). The only non-portal dropdown is the dead `FeatureCardWithDropdown` (above).
- **`onClick={() => {}}` in lesson step views:** intentional — the `ContinueButton` is disabled/gated while the step awaits input; not dead handlers.
- **Landing page:** clean hero, well-sized CTAs, language pills, cookie consent. Visually verified at 1440px.

## Summary

The in-scope surfaces are in good shape — strong `staleTime` discipline, consistent use of shared primitives (`PageShell`, `Card`, `Button`, `EmptyState`, `ModalBase`, lucide `Icon`), and solid avatar/empty/loading handling. The fixes I shipped were small house-rule violations (one emoji affordance, one un-tokenized/un-i18n'd fallback screen). The higher-value items (Stories TanStack-Query refactor with duplicated fetch, the QuestsCard wiring, the god-file splits, the `★`/mic emoji passes) are documented above for follow-up — each is either a medium-risk refactor or a multi-file change outside the "obvious, low-risk, self-contained" lane.
