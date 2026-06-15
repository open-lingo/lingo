# M1 — Server-backup the unlock map

Persist the client atom unlock ladder (`lingo:unlocked-atoms`) server-side,
user-scoped, so clearing localStorage or switching device no longer loses which
course atoms are unlocked (previously only SRS state + progress rollups synced).

This spans two repos:
- **lingo-core** (branch `unlock-map-persistence`, PR ready) — the storage + endpoints.
- **lingo** FE (branch `feat/unlock-map-server-backup`, this worktree) — push + hydrate union.

## Storage choice: settings blob, NOT a new SK

Stored at `settings.learning.unlockedAtoms` (a `string[]` of canonical `lang:id`),
inside the existing per-user settings blob.

Why settings over a new progress/user SK:
- The set is per-user, sparse (a few hundred short ids at full N5), and **never read
  on the hot lesson path** — the lesson reads the local set; the server is touched
  only on hydrate.
- `get_settings` / `update_settings` already exist and **mirror on both backends**
  (SQLite `user_settings` table + Dynamo `SK=SETTINGS` item), both with deep-merge.
  A new SK would mean a new protocol method + two repo impls + a stub-vs-real cutover
  for zero benefit.
- Conceptually it's learning-state config — same bucket as `learningLanguageId` and
  `onboardingCompleted`, which already live under `settings.learning`.

The settings deep-merge **replaces** lists (only dicts merge), which is exactly what
we want: the server endpoint computes the full unioned list itself and stores it, so
the merge can't accidentally interleave a stale partial list.

## Union / hydrate flow

Reconcile is a **union in both directions** and never drops ids:

1. **On each local unlock** (`unlockAtomIds` in `unlockLessonAtoms.ts`): after the
   local write, a `lingo:atoms-unlocked` window CustomEvent fires with **only the
   newly-added ids** (same decoupling pattern as `lingo:vocab-graduated`, keeps the
   sync utility React-free). `useUnlockMapSync` listens and fire-and-forget POSTs them.
   `addUnlocks` swallows errors — a lost push is reconciled by the next push / hydrate.

2. **On session start** (once, after auth, in `useUnlockMapSync`, mounted in the root
   `Layout`): GET the server set, UNION it into local storage via
   `mergeServerUnlockedAtomIds` (restores after a storage clear / device switch), then
   PUSH any **local-only** ids up to the server (covers sets built offline or before
   this feature shipped). If the server isn't wired (`getUnlocks` → null on 404/501) or
   the call fails, the local set is left untouched and the next session retries.

No extra read is added to the hot lesson path — push is fire-and-forget, the union read
happens only on hydrate.

## Endpoints / contract (lingo-core)

```
GET  /api/core/v1/progress/me/unlocks  → { unlockedAtoms: string[] }
POST /api/core/v1/progress/me/unlocks  body { atomIds: string[] } → { unlockedAtoms: string[] }
```

- `GET` reads `settings.learning.unlockedAtoms` (empty list when unset / malformed).
- `POST` UNIONs `atomIds` into the stored set and returns the full set. Idempotent —
  re-pushing the same ids is a no-op write-wise. `atomIds` is capped at 2000.
- Both use `get_acting_user`, so admin impersonation writes to the target user.

FE client: `ProgressApi.getUnlocks()` (returns `string[] | null`; null = pre-wire/transient)
and `ProgressApi.addUnlocks(ids)` (fire-and-forget, swallows errors) in
`src/shared/api/progress.ts`.

## Files touched

FE (`lingo`):
- `src/shared/api/progress.ts` — `UnlockMapResponse` type + `getUnlocks` / `addUnlocks`.
- `src/features/lesson/data/unlockLessonAtoms.ts` — dispatch `lingo:atoms-unlocked` on
  new unlocks; add `mergeServerUnlockedAtomIds` (silent hydrate union); export
  `ATOMS_UNLOCKED_EVENT` + `AtomsUnlockedDetail`.
- `src/shared/hooks/useUnlockMapSync.ts` (new) — push listener + hydrate union.
- `src/shared/hooks/index.ts`, `src/routes/Layout.tsx` — export + mount the hook.

Core (`lingo-core`):
- `app/progress/schemas.py` — `UnlockMapResponse`, `UnlockMapAddRequest`.
- `app/progress/router.py` — the two endpoints + `_read_unlocked_atoms` helper.

## Test coverage

FE (`npm run test:run`: 1283 passed):
- `src/features/lesson/data/unlockLessonAtoms.test.ts` — event dispatches only new ids;
  no dispatch when nothing new; bare-id canonicalization; `mergeServerUnlockedAtomIds`
  restore-into-empty, union-never-drops, and no-push-event.
- `src/shared/hooks/useUnlockMapSync.test.tsx` — restore from server into empty store;
  union + push local-only up; local untouched when server returns null; push on
  `lingo:atoms-unlocked` event.

Core (`python -m pytest -q`: 266 passed, ruff clean):
- `tests/test_progress_unlocks.py` — SQLite routes (empty default, add+read-back,
  union-never-drops, idempotent re-push, deep-merge doesn't clobber sibling `learning`
  keys, empty push no-op) + DynamoDB round-trip via moto (persist+read, union extends).

## Verification

- FE: `npx tsc --noEmit` clean, `npm run build` clean, `npm run test:run` 1283 passed.
- Core: `python -m pytest -q` 266 passed, `ruff check` clean.

## Acceptance

Clear localStorage / switch device → on next authed session, `useUnlockMapSync` GETs the
server set and unions it back into local storage, so the unlock ladder restores with no
lost progression. Reconcile is a union — never drops unlocks.
