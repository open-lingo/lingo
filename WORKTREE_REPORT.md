# M2 — Guard localStorage quota

Branch: `feat/srs-quota-guard`. Scope: stay on localStorage (IndexedDB migration explicitly out of scope). Surface a user-visible warning when near/at the storage ceiling instead of silently dropping writes.

## Threshold chosen

**90% of the origin's reported storage quota** (`NEAR_QUOTA_RATIO = 0.9`), read via `navigator.storage.estimate()` where available. Rationale:

- 90% leaves enough headroom to flush a pending sync before writes actually start failing.
- High enough that a healthy store never trips it (no nuisance warnings).
- A hard `QuotaExceededError` **always** warns regardless of the estimate — some browsers under-report quota and private-mode quotas are tiny, so the estimate alone can't be trusted as the only signal.

Throttling (in `storageQuota.ts`):
- Estimate probe runs at most once per 30s (`ESTIMATE_THROTTLE_MS`), fire-and-forget on the success path of a write.
- Warning events emit at most once per 60s (`WARN_THROTTLE_MS`) to avoid toast spam during a burst of writes.

## Where the warning surfaces

Reuses the existing toast surface (no new banner system):

- `safeLocalStorageWrite()` (new, `src/shared/utils/storageQuota.ts`) dispatches a throttled `lingo:storage-quota` `window` CustomEvent — same plain-module → React bridge pattern as `notifySRSStoreChanged`. It also always `console.warn`s a durable breadcrumb (the toast is throttled; the log is not).
- `StorageQuotaWatcher` (new, `src/shared/components/StorageQuotaWatcher.tsx`) listens for that event and calls `showToast(..., "warning")`. Mounted once in `routes/Layout.tsx` next to `ToastContainer` (inside `ToastProvider`). Renders nothing.
- Added `"warning"` to `ToastVariant` (`ToastContext.tsx`) — `ToastContainer` already had the warning style, the type just didn't allow it.
- i18n keys `storage.quotaNear` / `storage.quotaExceeded` added to en, ko, es.

## Swallow-points fixed

These previously caught `QuotaExceededError` and silently dropped the write; all now route through `safeLocalStorageWrite`:

- `src/features/flashcards/engine/srsStorage.ts`
  - `setSRSStore()` — the main SRS store write (the big one).
  - the canonicalization rewrite inside `getSRSStore()`.
- `src/features/lesson/engine/lessonStorage.ts`
  - `setStepEvents()` — lesson step-event buffer.
  - `setPendingAttempts()` — pending lesson-attempt buffer.

Non-quota errors are now re-thrown (they're real bugs, not capacity signals) rather than being swallowed by a bare `catch {}`.

The small sync-timestamp setters (`setLastSrsSyncAt`, etc.) were left as plain `setItem` — they write a single short ISO string and aren't a capacity concern; routing them through the guard would only add noise.

## Tests

- `src/shared/utils/storageQuota.test.ts` — normal write emits no warning; simulated `QuotaExceededError` warns + returns false (no silent drop); non-quota error re-throws; a near-quota `estimate()` (>90%) warns with `reason: "near"`; a comfortable estimate does not warn.
- `src/features/flashcards/engine/srsStorage.test.ts` — added a case proving `setSRSStore` warns (event fired) instead of silently swallowing on `QuotaExceededError`.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (pre-existing chunk-size warning only).
- `npx vitest run` — 1273 passed / 168 files.
