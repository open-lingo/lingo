# App Store launch readiness + unauthenticated exposure audit (2026-08-20)

Spencer has the Apple Developer license (team `Y462YZGXCZ`, already set in the
Xcode project). This doc answers: what's left to publish, what unauthenticated
users can do to us, and the dollar ceiling on abuse — with the cheap caps that
shrink it.

> **STATUS UPDATE 2026-08-26.** The app is rebranded **Linguiversal**
> (bundle `com.linguiversal.app`, name confirmed as owned by Trevor;
> `capacitor.config.ts` / `NATIVE_APP_ID` / pbxproj all updated, Auth0
> callback derives from the app id so no auth-code change was needed).
> Done since this doc was written: §2.5 privacy manifest
> (`ios/App/App/PrivacyInfo.xcprivacy`, wired into the Resources phase),
> §2.6 `ITSAppUsesNonExemptEncryption=false`, §2.11 third-party KR
> CloudFront URL stripped from `alphabetAudio.ts` + the CSP allowlist,
> §2.4 privacy policy already live at `openlingoapp.com/privacy`.
> `SURFACE_MODE=beta` code is pushed/deployed (lingo-core `5c5241e`) but
> the **env var is not yet set on the Lambda** — that plus the §3
> mitigations are written up as concrete asks in
> **`lingo-infra/docs/appstore-beta-infra-asks-2026-08-26.md`** (Trevor).
> Still open: Auth0 Native app + real-auth `.env.native` flip (the shipped
> build is still the auth-bypass demo), Option B cold-start (persist the
> `/boot` snapshot in `bootCache.ts`, un-gate home paint), a frontend walk
> against a beta-mode backend (quests/social/community/decks routers
> un-mount — verify graceful degradation or widen `_BETA_GROUPS`),
> Sign-in-with-Apple check on the Auth0 tenant, the App Store Connect
> record, store assets, and the display-name decision (Info.plist and the
> marketing site still say "Open Lingo").

## 1. Where the iOS app already stands

Done and verified in the repo:

- Capacitor iOS project (`ios/App`), bundle id `com.openlingo.app`, automatic
  signing, team ID set. Free-provisioning device testing has worked since 08-06.
- `npm run build:native` produces the prod-pointed bundle (`VITE_NATIVE`,
  `.env.native` → `app.openlingoapp.com` assets).
- Auth0 login opens in `SFSafariViewController` (App Review requires this for
  third-party credential forms — already handled, see `useAuth.ts`).
- In-app account deletion exists end-to-end (`DELETE /users/me`,
  `AccountPrivacySection`) — App Store Guideline 5.1.1(v) satisfied.
- Mic + speech-recognition usage strings in Info.plist (on-device, "not
  uploaded" wording is accurate).

## 2. What's left before TestFlight / App Store (in order)

1. **App Store Connect record** — register the `com.openlingo.app` App ID in
   the developer portal (Xcode automatic signing can do it), create the app in
   App Store Connect ("Open Lingo", primary language en).
2. **Archive + upload** — Xcode: `npm run build:native && npx cap sync ios`,
   then Product → Archive → Distribute. First upload unlocks TestFlight.
3. **TestFlight internal testers** — available *immediately* after upload
   processes (up to 100 App Store Connect users, no review). This is the
   fastest "beta testers going" path. External groups / public link need Beta
   App Review (~1 day) and a privacy policy URL.
4. **Privacy policy URL** — required for TestFlight external + App Store.
   Data collected via Auth0 (email, identifiers) must be declared in the App
   Privacy questionnaire.
5. **Privacy manifest (`PrivacyInfo.xcprivacy`)** — required since 2024.
   Capacitor 8 plugins ship their own; the app target needs one if it touches
   required-reason APIs (Capacitor Preferences → UserDefaults does). Add a
   minimal manifest declaring UserDefaults reason `CA92.1`.
6. **`ITSAppUsesNonExemptEncryption = false`** in Info.plist (standard HTTPS
   only) — skips the export-compliance question on every build.
7. **Sign in with Apple check** — Guideline 4.8: if the Auth0 tenant offers
   ANY third-party login (Google etc.), Apple login must be offered too.
   Check the Auth0 dashboard connections; if Google is on, either turn it off
   for v1 or wire Apple through Auth0 before submission.
8. **Auth0 tenant hygiene** — prod currently runs on the dev tenant
   (`dev-txjdn01ew3dmaecy`). Fine for internal TestFlight; before external
   beta, add the native callback/logout URLs
   (`com.openlingo.app://...`) to the Auth0 app config, and consider a real
   prod tenant (branding, MAU headroom).
9. **Store assets** — 1024 marketing icon exists
   (`AppIcon-512@2x.png`); need screenshots (6.9" + 6.5" classes),
   description, keywords, support URL.
10. **Content scope note for review**: FR is non-selectable, ES mid-re-author
    — fine for beta; describe JA as the shipped course.
11. **Loose end**: `src/shared/audio/alphabetAudio.ts` hardcodes a
    *third-party* CloudFront host (`d27hu3tsvatwlt.cloudfront.net`, kr
    alphabet audio) and vite.config.ts allowlists it. KR isn't shipped, but
    the URL ships in the bundle — licensing/review liability for zero value.
    Strip before submission.

## 3. Unauthenticated exposure — what an attacker can actually do

Auth design is sound: Auth0 JWT on effectively every route (`lingo-core` and
`lingo-ops` share the model), DEBUG bypass hard-refuses to arm inside Lambda,
JWKS refresh is rate-limited, `DELETE /users/me` is JWT-pinned against
impersonation. The exposure is **cost/availability, not data**:

- **Both Lambda Function URLs are public (`authorization_type = "NONE"`) and
  raw** — no CloudFront, no WAF, no rate limiting anywhere in the request
  path, and **no reserved concurrency**. Every request, even a garbage 401,
  bills Lambda time.
- **`GET /community/threads` (+ categories/tags/addons/markdown reads) are
  intentionally public** and the Dynamo layer serves them with **paginated
  full-table scans plus a per-thread N+1** (tag ids + content links per
  thread, `limit` up to 100). This is the amplification endpoint: request
  cost grows with table size, and an attacker doesn't need an account.
- **Warmer** keeps one instance hot (~$0.01/mo) — irrelevant to abuse.

### The numbers (512 MB, x86, us-east-1)

| Scenario | Ceiling today | With reserved concurrency = 20 |
|---|---|---|
| Junk-401 flood, 1k req/s sustained | ~$25–30/day Lambda + ~$7/day CloudWatch log ingest | throttled at 20 concurrent → low single digits/day |
| Worst case: attacker holds max concurrency at the 30 s timeout | 1,000 concurrent × 0.5 GB × 86,400 s ≈ 43M GB-s ≈ **$720/day** + starves every other Lambda in the account (async pipeline included) | **~$14/day**, rest of account unaffected |
| Scan-amplified /community reads | small today (tables tiny); grows linearly with content × attack rate | capped by same concurrency lid |
| TTS/audio egress via `app.openlingoapp.com` | ~$85 per TB CloudFront egress; clips ~30 KB → attacker needs ~35M downloads per $85 | WAF rate rule (see below) |
| Dynamo (all PAY_PER_REQUEST) | reads $0.125/M RCU-ish — noise next to Lambda | — |
| Auth0 | no cost exposure; a token-endpoint flood can 429 logins (availability, not dollars) | — |

The account-wide default concurrency pool (1,000) shared with the async/TTS
pipeline is the "break our pipeline" vector: an unauthenticated flood on the
core URL can starve SQS-driven lingo-async of concurrency. Reserved
concurrency on the public functions fixes both cost and starvation.

### Update 2026-08-20 (pen-test + landed fix)

A local-model red team probed a local lingo-core (see
`lingo-core/docs/security-pentest-2026-08-20.md`). Landed in lingo-core
(TDD, 351 tests green): a **`SURFACE_MODE=beta`** allowlist that un-mounts
every router except the core loop (boot/users/srs/progress), plus a
constant-time internal-token compare. Measured effect: the unauthenticated
surface drops from **9 public endpoints (incl. all 6 Dynamo-scan community
reads) to 1** (`/health`). Deploy the beta with `SURFACE_MODE=beta`.
Still open: the beta-user allowlist, app rate limit, and the infra items below.

### Mitigations, cheapest first (for Trevor's review)

1. **`reserved_concurrent_executions = 20`** on `lingo-core` (and ~5 on
   `lingo-ops`) — one line each in tf. Converts a $720/day ceiling into
   ~$14/day and firewalls the async pipeline's concurrency. Sizing: current
   real traffic is one warm instance; 20 is >10× headroom.
2. **AWS Budgets alert** ($10 and $25/mo thresholds → email Spencer +
   Trevor) + CloudWatch alarms on `ConcurrentExecutions` and 4xx rate.
   Budgets are free; this is the "Trevor finds out in hours, not on the
   bill" control.
3. **Verify the `app.openlingoapp.com` distro** (NOT in terraform — known
   drift) has the shared WAF attached and add a rate-based rule
   (e.g. 2,000 req/5min/IP). The openlingoapp.com site distro already has
   the shared WAF.
4. **Decide on public community reads**: either require auth (if the app
   only shows community post-login anyway) or replace the scan-backed list
   paths with query patterns before content volume grows. Not urgent at
   today's table sizes; becomes real with beta users generating content.
5. Later/structural: front the API with CloudFront + WAF instead of raw
   Function URLs (gets real per-IP rate limiting; bigger change, not needed
   for beta).

## 4. Standing queue (carried forward, unchanged)

1. Push the ~12 unpushed lingo commits — when Spencer asks; verify the
   concurrent session's recognitionExposure ratchet red is resolved first.
2. Haiku→local visual-judge switchover — shadow run on next module wave.
3. dynamicReviewPrefix generalization — after first real ES review lesson.
4. ES/FR male dialogue voice clips → then `dialogueVoices` per module.
5. Human checkpoints: FR Denise audition, FR m1 walk, ES walk after first
   re-authored verb module.
