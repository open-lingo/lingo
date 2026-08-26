# Handoff — App Store wave + cost guardrails (2026-08-26)

One-day sweep from "make the app public again" to: checklist code items
shipped, App ID registered, prod surface hardened, and hard cost caps live.
Companion docs: `app-store-launch-readiness-2026-08-20.md` (checklist, with
the 08-26 status stamp) and
`lingo-infra/docs/appstore-beta-infra-asks-2026-08-26.md` (Trevor's copy,
now mostly a "done" record).

## Done today

- **lingo `10100791`** (deployed, fingerprint-verified): KR third-party
  CloudFront URL stripped from `alphabetAudio.ts` + CSP; `PrivacyInfo.xcprivacy`
  added and wired into the Xcode Resources phase; `ITSAppUsesNonExemptEncryption
  = false`. Rebrand was already complete code-side (`com.linguiversal.app`,
  team `Y462YZGXCZ`); Linguiversal name confirmed owned by Trevor.
- **App ID `com.linguiversal.app` registered** on the developer portal
  (Sign-in-with-Apple + Push Notifications recommended as the only
  capabilities worth ticking; all togglable later).
- **AWS (Spencer now has SSO: profile `lingo`, PowerUser, account
  349654078389; no IAM writes):**
  - Reserved concurrency live: core=20, ops=5 — codified in tf too.
  - `SURFACE_MODE=beta` live on lingo-core. Verified: unauthed surface is
    exactly `/health`; boot/srs 401; community/tags/admin 404. Spencer
    accepted the web-app degradation (quests/social/community UI will error)
    until the frontend walk.
  - Budget `lingo-monthly-guardrail` $25/mo — alerts $10/$25/forecast, plus
    a 200% ($50) SNS backstop.
  - Flood alarms → SNS `lingo-cost-alarms` (us-west-1 + us-east-1):
    core-invocations ≥6k/min×3, core-throttles ≥1k/min×3, app-CDN ≥150k/5min.
    **Email subscriptions were left pending confirmation** (Spencer +
    sortaminty) — confirm the 4 emails or alerts go nowhere.
  - Already in place from Trevor (verified, not re-done): shared WAF on the
    app distro with 2k req/5min/IP rate rule; Dynamo per-table on-demand caps
    (500 RRU / 200 WRU, all 21 lingo_ tables).
- **Cost circuit breaker** (`lingo-infra/cost_breaker.tf` +
  `breaker/handler.py`, pushed, fmt+validate green): SNS-tripped Lambda that
  zeroes core+ops concurrency, disables the app distro, snapshots prior state
  to SSM, pages both humans; `{"action":"restore"}` restores. **NOT ARMED
  until Trevor's `terraform apply`** (needs the IAM role). Rationale: AWS has
  no global billing kill switch; billing data lags ≤24 h, so fast detection
  is usage alarms, slow backstop is the $50 budget notification.
- **Prod "failed to fetch module" errors**: root cause = deploy's
  `s3 sync --delete` purges old hashed chunks; stale tabs fail their next
  lazy import (index.html no-cache + immutable assets are correct; the gap is
  live tabs). Fix in this commit: `vite:preloadError` → guarded one-shot
  reload in `main.tsx`. If it still shows up: retain the previous deploy's
  assets (drop `--delete` + S3 lifecycle) — deliberate non-goal today.

## Next, in order

1. **Spencer — Auth0 Native app** (~5 min, dashboard): type Native; Allowed
   Callback AND Logout URLs BOTH =
   `com.linguiversal.app://dev-txjdn01ew3dmaecy.us.auth0.com/capacitor/com.linguiversal.app/callback`;
   Advanced → Grant Types → Refresh Token ON. Hand over the client id. While
   there: is Google login enabled on the tenant? (yes → Sign in with Apple
   required, Guideline 4.8, or switch Google off for v1).
2. **Claude — Option B cold-start** (required before real-auth build):
   persist last `/boot` snapshot (`bootCache.ts` has zero persistence),
   hydrate optimistically, stop full-page-gating home paint on
   `useProgressMe`. Then flip `.env.native` (client id in, bypass off),
   rebuild native, verify sync + cold start on Trap Phone.
3. **Claude — beta-mode frontend walk**: app against local
   `SURFACE_MODE=beta` lingo-core; decide graceful-degradation vs widening
   `_BETA_GROUPS` (quests is the likely add).
4. **Trevor — `terraform apply`** (arms the breaker; plan will also show the
   concurrency caps as already-matching).
5. **Spencer — App Store Connect record** under the registered App ID →
   archive + upload → internal TestFlight (instant). External needs Beta App
   Review (~1 day; privacy URL already live).
6. Store assets (screenshots via the headless recipe, description, keywords,
   support URL) + the display-name decision ("Open Lingo" vs "Linguiversal"
   — Info.plist and marketing site still say Open Lingo).

## Standing constraints (unchanged)

No AI attribution in commits; commit/push on ask; preflight before any lingo
main push and check the run CONCLUSION after; concurrent sessions may share
the tree — stage explicit paths.
