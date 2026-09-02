# Handoff — native Auth0 fixed; FTUE test plan before submission (2026-09-01)

Supersedes the auth sections of `handoff-2026-08-26-appstore-wave.md`. That
doc's items 1–2 (Auth0 Native app, Option B cold-start) are DONE.

## State

Real Auth0 auth works end-to-end on the iOS 26.5 simulator (`OL-15ProMax`,
`942D8E54-C85D-425B-A7FC-E8BCB33EC323`). Verified: login → authenticated home
with real server data (18 gems, 1-day streak, Lv 1, Korean lesson 6 of 30,
quests + recent progress populated).

It was **four stacked bugs**, each hiding the next:

| # | Bug | Fix | Verified |
|---|-----|-----|----------|
| 1 | New Auth0 app not authorized for the `openlingodev` audience (no Client Grant) | 2 `client-grants` (`subject_type` `client` + `user`) | yes |
| 2 | `capacitor://localhost` absent from Auth0 client CORS allowlist | `allowed_origins` + `web_origins` on the client | yes |
| 3 | Same origin absent from lingo-core `CORS_ORIGINS` | live Lambda env var, 4 → 5 origins | yes |
| 4 | No refresh token ever issued | `allow_offline_access: true` on the API **AND** `rotation_type: rotating` on the client | yes |

Bug 4 needed **two** changes. Auth0 refuses refresh tokens to browser-originated
code exchanges unless rotation is enabled — the tenant log states it verbatim:
*"no 'refresh_token' was issued because the authorization code exchange
originated from a browser"*. So `allow_offline_access` alone was not enough.
Rotation requires `expiration_type: "expiring"`; set to 30d absolute / 15d idle.
This also makes `src/main.tsx:113`'s claim ("Auth0 rotates refresh tokens on
use") true — it previously described config that did not exist.
Verified: a refresh token is now present in the webview's localStorage.

Bug 2 is the one that presented as "the redirect doesn't work". The code
exchange had actually **succeeded** every time (`seacft` in Auth0's log); Auth0
just withheld `Access-Control-Allow-Origin`, so WebKit discarded the response.
See the `capacitor-origin-cors` memory — the failure mode makes server logs look
healthy while the app fails.

Bug 4 mattered because native sets `useRefreshTokensFallback: false`
(`src/main.tsx`) — WKWebView ITP blocks the silent-auth iframe, so refresh tokens
are the *only* session-persistence mechanism. With `allow_offline_access: false`
every user would have been logged out `token_lifetime` = 86400s after signing in.

### Also fixed: the "Authorize App" consent screen

Auth0 shows a confirmation for **non-verifiable callback URIs** (custom URL
schemes) as anti-impersonation protection. `skip_consent_for_verifiable_first_party_clients`
does NOT suppress it. The field is `skip_non_verifiable_callback_uri_confirmation_prompt`
on the client — set `true`. **Not yet verified on a fresh login.**

## Config changed outside the repo (for rollback / reproduction)

Auth0 tenant `dev-txjdn01ew3dmaecy`, client `bIKQzPiAKK6RVApeWjiV6tbseSX9Qqjc`
("Open Lingo Native"):
- `allowed_origins` / `web_origins` = `["capacitor://localhost"]`
- `skip_non_verifiable_callback_uri_confirmation_prompt` = `true`
- 2 client-grants for audience `openlingodev`

Resource server `openlingodev` (`699bbf06aa700abac96623df`):
- `allow_offline_access` = `true`

AWS `lingo-core` Lambda (us-west-1, profile `lingo`):
- `CORS_ORIGINS` += `capacitor://localhost`

Terraform will NOT revert the Lambda change — both definitions carry
`ignore_changes = [environment[0].variables]`. **But the tf initial values are
drifted**: `lingo_core_function.tf:173` and `main.tf:1206` both omit
`https://app.openlingoapp.com`. Inert today; wrong on a fresh create.

## Uncommitted work in this repo

`src/shared/hooks/progressSnapshotCache.ts` (new),
`useProgressMe.optimisticHydrate.test.tsx` (new, 3 tests),
`useProgressMe.ts` (modified) — the Option B cold-start fix, TDD'd, passing, and
confirmed present in the installed simulator bundle.

⚠️ The tree has ~55 dirty files from concurrent sessions (KO/JA curriculum, freq
wave). **Stage explicit paths only.** `.env.native` is gitignored.

## Next: FTUE test

**Why a dedicated pass:** Spencer's account is not a first-time user (18 gems,
lesson 6 of 30). None of the new-user path has been exercised — registration,
onboarding, language pick, first lesson, first XP/streak write, SRS seeding.

Split by what actually needs a device:

### A. Native-only (simulator)
1. **Fresh login on the wiped install** → verifies consent-skip (bug 2's cosmetic
   sibling) and refresh-token issuance (bug 4). Confirm a refresh token exists by
   checking for the `refresh_token` key in the webview's localStorage — presence
   only, never print the value.
2. **Brand-new account signup** (e.g. `spencer+ftue1@…`) — does lingo-core
   auto-register an unseen Auth0 sub? `users` is in `_BETA_GROUPS` so it should.
3. **Onboarding → language pick → first lesson.** Fresh install means no stale
   `learn-view=list` key, so the vertical map should be the default on touch.
4. **TTS audio in a lesson** — the known landmine (`VITE_ASSET_BASE_URL` must be
   the `app.` host; playback is fetch+decodeAudioData through `nativeHttp.ts`).
5. **Cold start #2** — kill + relaunch: session restores with no browser, and
   home paints from the Option B snapshot rather than a skeleton.
6. **Airplane mode** — local-first SRS still runs a lesson.
7. **Sign out → sign back in.**
8. **Beta-surface sweep** — walk every tab under `SURFACE_MODE=beta` and note
   anything that errors. (Quests renders fine, so the open "widen `_BETA_GROUPS`
   to include quests" question from the 08-26 handoff looks moot — confirm.)

### B. Content/flow (headless, fully automatable)
Use the existing Playwright + `scripts/shot.mjs` / `scripts/ux-loop` recipes at
mobile viewport for lesson-step layout and flow. Does not need the simulator.

### Blocker on automating A
`osascript` cannot click — it lacks Accessibility permission, so I can drive
launches, screenshots and logs but cannot tap. **Granting Accessibility to
Visual Studio Code** (System Settings → Privacy & Security → Accessibility)
would let me drive the entire simulator walk unattended.

## Then: submission

Unchanged from the 08-26 handoff — ASC app record → archive → internal
TestFlight → store assets → display-name decision. Still needs the ASC
**Issuer ID** from Spencer (the `.p8` key is already at
`~/.appstoreconnect/private_keys/AuthKey_SM7MX6WN53.p8`, `chmod 600`; its
contents have never been read into a model context and must not be).

## Open decisions (not mine to make)

1. **Refresh-token rotation.** Native client is `rotation_type: non-rotating`,
   `infinite_token_lifetime: true`, but `src/main.tsx:113` justifies the
   localStorage-token XSS tradeoff by claiming "Auth0 rotates refresh tokens on
   use". Config contradicts the comment. Recommend enabling rotation.
2. **Universal Links vs custom scheme.** Disabling the impersonation prompt
   unblocks TestFlight, but the real fix is an HTTPS callback (AASA on
   app.openlingoapp.com + Associated Domains entitlement), which closes the
   scheme-squatting hole the prompt warns about. *Unconfirmed* that it removes
   the prompt — Auth0's own thread says untested.
3. **Sign in with Apple** (Guideline 4.8) — Google login is enabled tenant-wide.
