# Authentication & Session Architecture

Planning doc for token refresh, device-based sessions, multi-device sync, and logout invalidation. Current state: Auth0 + `getAccessTokenSilently`; no explicit refresh or device-session model yet.

---

## 1. Token Refresh Handling

### Target Model

- **Short-lived access token** (e.g. 15–60 min)
- **Long-lived refresh token**
- On API `401`, client refreshes automatically and retries the original request

### Principles

- **Centralized** – Token refresh lives in the API client, not in individual calls
- **Retry limit** – Cap retries (e.g. 1–2) to avoid loops
- **Never manual** – Callers do not refresh tokens themselves

### Current State

- Auth0 SPA SDK manages tokens; `getAccessTokenSilently()` handles refresh internally
- Backend returns 401 on invalid/expired tokens
- API client (`src/shared/api/client.ts`) retries on 5xx but does not handle 401 refresh

### Implementation Notes

1. Add 401 handling in `ApiClient`: detect 401, call refresh (or Auth0’s silent refresh), retry once
2. On refresh failure, clear auth state and redirect to login
3. Add config: `maxRetries` (already exists for 5xx), `retryOn401` flag

---

## 2. Device-Based Sessions

### Target Model

Instead of one token per user:

- **One session per device**
- Each device has: `deviceId`, `refreshToken`, `sessionId`
- Enables:
  - “Logged in on iPhone”
  - Invalidate one device
  - Detect suspicious sessions

### Current State

- Auth0 manages sessions; we do not track device/session IDs
- Backend may or may not support device sessions

### Implementation Notes

1. Generate and persist `deviceId` (e.g. UUID in localStorage)
2. Send `deviceId` in auth/session APIs if backend supports it
3. Backend: store sessions keyed by `user_id + device_id`; return session list for “Active sessions”
4. Use session IDs for per-device logout / invalidation

---

## 3. Multi-Device Sync

### Principles

- **Server is source of truth**
- **Never trust local state alone** – Treat it as a cache

### Flow

1. Local state updates immediately (optimistic UI)
2. Sync pushes delta to server
3. Server resolves conflicts (e.g. `lastModifiedTimestamp`)
4. Server returns canonical state
5. Client reconciles and updates local cache

### Current State

- SRS sync: `useSRSSyncSource` + `SyncManager`; batched uploads
- Settings: `users.updateSettings()`; some use of localStorage before API
- No formal conflict resolution; last-write-wins or overwrite

### Implementation Notes

1. Add `lastModifiedTimestamp` (or equivalent) for conflict-prone resources
2. Server returns 409 on conflict; client can merge or prompt user
3. Use sync queue with retry; clear queue on logout

---

## 4. Logout Invalidation

### On Logout (same device)

- Delete local tokens (Auth0 handles this)
- Clear sync queue
- Clear or keep local lesson/content cache (optional; could keep for offline)
- Redirect to login/home

### On Logout (other device)

- Server invalidates that session
- Affected device’s next API call gets 401
- Client must: detect 401, treat as “session revoked”, force logout (clear auth, redirect)

### Implementation Notes

1. API client: on 401 after refresh failure (or specific “session revoked” response), trigger global logout
2. Expose `onSessionRevoked` callback from API provider; call Auth0 logout + clear local state
3. Document: “If you log out elsewhere, this device will log out on next request”

---

## Checklist for Implementation

| Area | Status | Notes |
|------|--------|-------|
| 401 + auto refresh | Planned | Add to ApiClient; Auth0 may already handle via `getAccessTokenSilently` |
| Retry limit on 401 | Planned | Cap at 1 retry after refresh |
| Device ID | Planned | Generate and persist; send if backend supports |
| Session list API | Planned | Backend: list sessions for user |
| Per-device logout | Planned | Backend: invalidate session by ID |
| Conflict resolution | Partial | Add timestamps; define merge strategy |
| Session revoked handling | Planned | 401 → force logout, clear state |

---

## References

- `src/shared/api/client.ts` – API client
- `src/shared/api/provider.tsx` – ApiProvider, getAccessToken
- `src/shared/auth/useAuth.ts` – Auth hook (Auth0)
- `src/features/flashcards/useSRSSyncSource.ts` – Sync source example
