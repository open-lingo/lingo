# Task: Auth & Session Strategy

**Context doc:** `docs/agents/basecontext/AUTH_STRATEGY.md`
**Current state:** Auth0 SPA SDK with `getAccessTokenSilently`; API client does not handle 401 refresh explicitly. No device sessions or session revocation flow.

## Goals

1. **Token refresh handling** — Centralized 401 handling, auto-refresh, retry with limit
2. **Device-based sessions** (optional) — deviceId, session list, per-device invalidation
3. **Logout invalidation** — Same-device: clear local state. Other-device: server invalidates session; client treats 401 as "session revoked" and forces logout

## Requirements

### 1. Token refresh (priority)
- API client: on 401, attempt refresh (Auth0 `getAccessTokenSilently`), retry original request once
- On refresh failure: clear auth, redirect to login
- Config: `retryOn401` (default true), max 1 retry after refresh

### 2. Session revoked handling
- When API returns 401 and refresh fails (or specific "session revoked" response), trigger global logout
- Expose `onSessionRevoked` callback from ApiProvider; call Auth0 logout + clear sync queue

### 3. Device sessions (future)
- Generate and persist `deviceId` (UUID)
- Send `deviceId` in auth headers if backend supports
- Backend: session list API, per-device logout

## Acceptance criteria

- [ ] API client retries once on 401 after token refresh
- [ ] On refresh failure, redirect to login and clear auth state
- [ ] `onSessionRevoked` path: 401 → force logout, clear sync queue
- [ ] Docs updated; no manual refresh in individual API calls

## Files

- `src/shared/api/client.ts` — Add 401 handling, retry logic
- `src/shared/api/provider.tsx` — Optional `onSessionRevoked` callback
- `src/shared/auth/useAuth.ts` — Ensure logout clears local state
- `docs/agents/basecontext/AUTH_STRATEGY.md` — Update checklist as implemented
