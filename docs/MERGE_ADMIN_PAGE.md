# Merge Guide: admin-page branch

Instructions for merging the `admin-page` branch into `main` (or your target branch). Includes context on behavioral changes and how to handle API commits that were made directly to master/main.

---

## Quick Summary

- **Branch**: `admin-page` (in `lingo/` submodule)
- **Target**: `main`
- **Commits ahead**: 2 (`43681ce`, `0cbd793`)
- **Scope**: Admin features, Card Manager enhancements, Sync Manager, flashcard reviewer UX, stories, external content, deck editor companion deck preview

---

## Repository Structure

```
open-lingo/                    # Parent repo (or monorepo root)
├── lingo/                     # Frontend (React) - SUBMODULE
│   ├── admin-page  ← merge this into main
│   └── main
├── lingo-core/                # API backend (Python)
│   └── main                   # API changes may have been committed here
└── lingo-infra/               # Terraform/infrastructure
```

**Important**: API changes were committed directly to the API repo's main/master. The frontend expects those API endpoints and response shapes. Ensure the API backend is deployed or merged before/during the frontend merge.

---

## Merge Steps

### 1. Handle API (lingo-core) First

**Context**: API changes were committed directly to master (or main) in the API repo. lingo-core typically uses `main`. If you committed to `master`, you need to get those changes into whatever branch is deployed (usually `main`).

```powershell
cd lingo-core   # or wherever the API backend lives
git branch -a   # check: do you have master? main?

# Scenario A: You committed to master, deployment uses main
# Merge master → main so deployment picks up your API changes
git checkout main
git pull origin main
git merge master
# Resolve conflicts if any, then:
git push origin main

# Scenario B: You committed to main directly
# Nothing to merge - just ensure main is deployed

# Scenario C: API is in a different repo (e.g. parent repo's master)
# Merge that repo's master into its main/deploy branch similarly
```

**API endpoints the frontend expects** (from admin-page branch):

- `/api/core/v1/admin/*` – Admin API (list users, get user, subscriptions, deck management, etc.)
- `/api/core/v1/decks/my-vocab?language_id=...` – Get/create My Vocab deck
- `/api/core/v1/decks/:id/cards` – Add cards to deck
- `/api/core/v1/stories/*` – Stories CRUD, browse
- `/api/core/v1/srs/sync` – SRS sync (existing)
- `/api/core/v1/users/*` – Users (extended)

### 2. Merge admin-page into main (lingo frontend)

```powershell
cd lingo
git fetch origin
git checkout main
git pull origin main

# Optional: stash or commit local changes first
# git stash push -m "WIP before admin-page merge"

git merge admin-page

# Resolve any conflicts (see Conflict Guidance below)
# Then:
git add .
git commit -m "Merge admin-page: admin UI, sync manager, card manager, flashcard UX"
git push origin main
```

### 3. Update Parent Repo (if using submodules)

```powershell
cd ..   # back to open-lingo root
git add lingo
git commit -m "Update lingo: merge admin-page into main"
git push
```

---

## Execution Checklist (current state)

Use this when you run the merge.

### lingo-core (API)

- [ ] **Branch check**: Only `main` exists (no `master`). → Scenario B: ensure `main` is deployed with admin/stories/decks endpoints.
- [ ] **Local changes**: You have uncommitted changes (`app/db/sqlite/subscription.py`, `scripts/seed.py`, deleted `:memory:`). Stash or commit before any merge, or merge will still proceed but working tree will be dirty.
- [ ] **Deploy**: Confirm backend supports the [API Dependency Checklist](#api-dependency-checklist) below.

### lingo (frontend)

- [ ] **Get admin-page**: `git fetch origin` — if you see auth errors (e.g. "could not read Username for 'https://github.com'"), fix Git credentials or use SSH, then fetch again. Without a local or remote `admin-page`, the merge cannot run.
- [ ] **Verify branch**: `git branch -a` should show `remotes/origin/admin-page` (or local `admin-page`) after a successful fetch.
- [ ] **Local changes**: You have uncommitted changes (e.g. `App.tsx`, `LearnPage.tsx`, lesson steps, `en.json`, etc.). Stash or commit before merging to avoid losing work or conflating merge with WIP.
- [ ] **Merge**: `git checkout main`, `git pull origin main`, `git merge admin-page`. Resolve conflicts per [Conflict Guidance](#conflict-guidance) below.
- [ ] **Build**: `npm run build` in `lingo/`.
- [ ] **Smoke-test**: Admin, Card Manager, Flashcard reviewer, Sync Manager, Stories, Deck editor.

### Parent repo (if applicable)

- [ ] Update submodule reference: `git add lingo`, commit, push.

---

## What Changed (File Summary)

### New Files

| File | Purpose |
|------|---------|
| `src/shared/api/admin.ts` | Admin API client (users, decks, moderation) |
| `src/features/sync/SyncManagerTrigger.tsx` | Sync Manager entry point |
| `src/shared/components/sync/SyncManager.tsx` | Extensible sync popover UI |
| `src/shared/components/sync/types.ts` | SyncSource type for Sync Manager |
| `src/features/flashcards/useSRSSyncSource.ts` | SRS sync source for Sync Manager |
| `src/features/flashcards/useSRSSyncStatus.ts` | SRS status hook (dirty count, last/next sync) |
| `src/features/stories/StoryPreviewModal.tsx` | Story preview modal |
| `src/features/community/useExternalContentSubscriptions.ts` | External content subscriptions hook |
| `src/features/community/ExternalContentPracticePage.tsx` | External content practice page |
| `docs/TTS_PLANNING.md` | TTS planning doc |

### Deleted Files

| File | Reason |
|------|--------|
| `src/features/stories/storiesData.ts` | Replaced by API-backed stories |

### Modified Files (Key Areas)

- **Admin**: `AdminUserDetailPage.tsx` (major), `AdminDecksPage.tsx`
- **Stories**: `StoriesPage.tsx`, `StoryDetailPage.tsx` – API-backed, add-to-vocab, etc.
- **Flashcards**: `CardManagerPage.tsx` (Edit My Vocab, multi-select, batch actions), `FlashcardTester.tsx` (sidebar, counts at bottom, back-first mode, segment breakdown), `CardPreview.tsx`, `reviewModes.ts`
- **Sync**: `Layout.tsx` – uses SyncManagerTrigger instead of SRSSyncStatusIcon; `useSRSyncSession.ts`, `srsStorage.ts`, `engine/index.ts` – next sync tracking
- **Deck Editor**: Companion deck story preview when editing companion deck
- **Data components**: `DataTable.tsx` – selectable rows, checkboxes; `FilterBar.tsx`
- **API client**: `client.ts` – ApiError `code`, `expiresAt`, `isUserBanned`, `isCommunityBanned`; `decks.ts`, `stories.ts`, `users.ts` – new methods
- **Content browser**: `ContentBrowserPage.tsx`, `ExternalContentPage.tsx`
- **i18n**: `en.json`, `ko.json` – new keys for all features

---

## Behavioral Changes (Intentional)

1. **Sync Manager**: Simple cloud icon → Pop-down Sync Manager with time-until-sync, manual sync, extensible for other sync types; icon when authenticated; hover delay so popover stays open.
2. **Card Manager**: Per-row actions → Multi-select, batch Bury/Unbury/Reset, "Edit My Vocab", per-card Edit for vocab decks.
3. **Flashcard Reviewer**: Counts at top → Counts in floating widget at bottom; mode + highlight in sidebar (desktop) or above counts (mobile); back-first mode; segment breakdown when flipped.
4. **Deck Editor (Companion Decks)**: Blue bar "Companion deck for: [Story Name]" with link to story editor.
5. **Admin**: Richer user detail, subscriptions, deck management, SRS state, moderation actions (if API supports).
6. **Stories**: Mock/static → API-backed; story preview modal; add-to-vocab from story reader.
7. **API Error Handling**: ApiError gains `code`, `expiresAt`; `isUserBanned`, `isCommunityBanned` for 403 handling.

---

## Conflict Guidance

### Likely Conflict Areas

1. **Layout.tsx** – Header/nav (SyncManagerTrigger). Keep the admin-page version; it replaces SRSSyncStatusIcon.
2. **CardManagerPage.tsx** – Large changes. Prefer admin-page version; Edit My Vocab, multi-select, batch actions.
3. **FlashcardTester.tsx** – Layout and logic. Prefer admin-page version.
4. **i18n (en.json, ko.json)** – Merge both: keep existing keys, add new ones from admin-page.
5. **API modules** – If main has different API structure, merge manually and preserve new methods from admin-page.

### Merge Strategy

```powershell
git merge admin-page
# Fix conflicts in conflicted files
git add .
git status   # ensure all resolved
git commit -m "Merge admin-page: admin UI, sync manager, card manager, flashcard UX"
```

---

## API Dependency Checklist

Before merging, confirm the backend supports:

- [ ] `GET /api/core/v1/admin/users` (paginated)
- [ ] `GET /api/core/v1/admin/users/:userId`
- [ ] `GET /api/core/v1/admin/users/:userId/subscriptions`
- [ ] `GET /api/core/v1/decks/my-vocab?language_id=...`
- [ ] `POST /api/core/v1/decks/:id/cards` (add cards)
- [ ] `GET /api/core/v1/stories/browse`
- [ ] `GET /api/core/v1/stories` (my stories)
- [ ] 403 ban responses with `detail.code` and `detail.expires_at` (optional but used)

---

## Post-Merge

1. Run `npm run build` in `lingo/` to verify.
2. Smoke-test: Admin, Card Manager, Flashcard reviewer, Sync Manager, Stories, Deck editor.
3. Deploy API first if not already; then deploy frontend.
