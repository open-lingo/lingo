# Auth branding + auth0-react bump — 2026-09-17 (lane A10)

Branch `lane/A10` off `feedback-2026-09-14` (worktree
`scratchpad/lanes/A10`). Commits: `474a15a4` (Auth0-side branding + level-1
branding APPLIED live), `609b7b3f` (branded `AuthHandoff`), `55d9d31a`
(auth0-react 2.15.0 → 2.26.0).

Spencer, 2026-09-17: "the page looks ugly, can we reskin it ourselves?"
Decision (unchanged): stay on Auth0 Universal Login — no embedded form, no
password grant. What we control (the app's own handoff screens) is branded
now; the Auth0-hosted page is prepared and, for its level-1 fields, already
applied — the page template still needs a custom domain, which is Spencer's
step and in progress in parallel with this lane.

## 1. Before / after

**Before.** Two unbranded plain-text loaders:
- `LoginPage.tsx`: `<CenteredLoader message="Redirecting to login..." />`
  (a spinner + grey caption, both the `isLoading` and the fallthrough state
  used the identical string).
- `RootRoute.tsx` (where a web visitor lands back after Auth0's redirect,
  and where a cold app load resolves its session): a bare
  `<p className="text-text-muted">{t("common.loading")}</p>`, no spinner,
  no brand mark, page background whatever the OS theme happened to
  resolve to.
- The Auth0-hosted page itself: tenant `friendly_name`/`picture_url` were
  both `null` and `branding` was `{}` — the login page showed the raw
  tenant id (`dev-txjdn01ew3dmaecy`) as the app name, default Auth0 blue,
  no logo.

**After — app side.** One component, `src/features/auth/AuthHandoff.tsx`,
rendered by both loaders: the wordmark from `scripts/generate-icons.mjs`
(heavy "O" + vertical "LINGO", Instrument Sans) redrawn as live text, on the
fixed dark brand background (`--color-auth-handoff-*`,
`src/shared/styles/tokens.css` — same `#171310` as the `dark` preset and
the app icon), one line of copy per direction, and — after 8 s — "Taking
too long? Try again". Captured on the 15 Pro Max simulator via a dev-only
route (`/qa/auth-handoff?direction=opening|signing-in`; the real flow can't
render this on demand — see §4):

| route | scale | verdict | screenshot |
|---|---|---|---|
| `/qa/auth-handoff?direction=opening` | 100% | PASS | `artifacts/ux-loop/sim-capture/capture-15-pro-max-100-qa-auth-handoff-direction-opening.png` |
| `/qa/auth-handoff?direction=opening` | 140% | PASS | `artifacts/ux-loop/sim-capture/capture-15-pro-max-140-qa-auth-handoff-direction-opening.png` |
| `/qa/auth-handoff?direction=signing-in` | 100% | PASS | `artifacts/ux-loop/sim-capture/capture-15-pro-max-100-qa-auth-handoff-direction-signing-in.png` |
| `/qa/auth-handoff?direction=signing-in` | 140% | PASS | `artifacts/ux-loop/sim-capture/capture-15-pro-max-140-qa-auth-handoff-direction-signing-in.png` |

(paths are inside the lane worktree, `scratchpad/lanes/A10/`; "PASS" is
`sim:capture`'s own verdict — no wrap/clip, Noto Sans JP fallback warning
only, which is expected since this route never renders Japanese text). No
regression: no wrap, no clip, retry button legible and tappable at both
scales, text stays inside `max-w-xs`.

**After — Auth0 side.** Applied LIVE on 2026-09-17 via the `auth0` CLI
(tenant `dev-txjdn01ew3dmaecy.us.auth0.com`, session re-authorized by
Spencer mid-lane):

```json
// current /api/v2/branding (verified via `auth0 api get branding`)
{
  "colors": { "page_background": "#171310", "primary": "#c14b3f" },
  "favicon_url": "https://app.openlingoapp.com/icon.ico",
  "font": { "url": "https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSQi_gf1.ttf" },
  "logo_url": "https://app.openlingoapp.com/icon-192.png"
}
```
Tenant `friendly_name` = "Open Lingo", `picture_url` = the same icon-192
URL. **Not yet applied: the page template** (`scripts/auth0/page-template.html`)
— PUT `/api/v2/branding/templates/universal-login` returns 402 without a
verified custom domain, and the dashboard editor is unavailable too. So the
Auth0-hosted page today has our colors/logo/font but not our layout/footer
— it changes further only once the custom domain is verified and
`node scripts/auth0/apply-branding.mjs --template` (or the dashboard) runs
again.

One thing found along the way, not obvious from Auth0's docs: PATCHing
`tenants/settings.picture_url` also overwrote `branding.logo_url` on this
tenant (a backward-compat sync between the two, undocumented as far as we
found). `scripts/auth0/universal-login-branding.json` and
`scripts/auth0/tenant-settings.json` now deliberately point at the same
asset (`icon-192.png`) so the two scripts can't silently disagree depending
on which ran last.

## 2. Rollback

Pre-change snapshots (`auth0 api get branding` / `tenants/settings` /
`custom-domains`, all BEFORE today's PATCHes): `scripts/auth0/rollback/
{branding,tenant-settings,custom-domains}-2026-09-17.json`. `branding` and
`tenant-settings` were both `{}`-shaped or null-valued; to roll back, PATCH
those exact bodies back (the management API doesn't support "unset a
field" other than sending `null`/omitting — see the JSON files' actual
shape) or ask Spencer to clear the fields by hand in the dashboard.

## 3. `@auth0/auth0-react` changelog review, 2.16 → 2.26

Full changelog: `gh api repos/auth0/auth0-react/contents/CHANGELOG.md`.
Everything that could plausibly touch this app:

- **v2.20.0 — IPSIE `session_expiry` ceiling** (auth0-spa-js `^2.22.0`,
  PR #1126). Enforcement is entirely server-driven: it only does anything
  if the tenant's Post-Login Action sets a `session_expiry` custom claim on
  the ID token, in which case `getAccessTokenSilently()` starts resolving
  to `undefined` once that timestamp passes. **Unknown** whether
  `dev-txjdn01ew3dmaecy` runs such an Action — nothing in this repo can see
  the tenant's Actions, and `auth0 api get actions/actions` wasn't queried
  in this lane. If it ever does, `shared/api/provider.tsx`'s existing
  `if (!token) throw` guard already covers it (see below) — no new call
  site needed.
- **v2.23.0 — open-redirect fix on `returnTo`** (PR #1185). Fixes
  `withAuthenticationRequired`'s `defaultReturnTo`, which used to capture
  `window.location.pathname` verbatim (`//evil.com` reads as
  protocol-relative). **Not applicable** — confirmed, not guessed: this app
  doesn't use that HOC (`src/routes/RequireAuth.tsx` is hand-rolled), and
  the only `returnTo` we set (`useAuth.ts`'s `canonicalOrigin`) is built
  from `window.location.origin` or the fixed native callback URL, never
  from a URL parameter or `pathname`.
- **v2.25.0 — BREAKING: `getAccessTokenSilently()` returns
  `Promise<string | undefined>`** (was always a string). This is the "one
  code change it needs" the project-review doc called already-in: the
  guard is `shared/api/provider.tsx`'s `if (!token) throw new Error(...)`,
  added ahead of this bump precisely for this reason.
- **v2.24.0 — `useAuth0Suspense`.** New hook, **not adopted** per the brief.
- **v2.16.0 — Native-to-Web SSO**, **v2.18.0 — passkey support**,
  **v2.19–2.22 — MyAccount API / online access tokens / `revokeRefreshToken`
  / CTE delegation.** All additive; none of these are called anywhere in
  this app.
- **Refresh-token handling**: no changes found in this range to rotation,
  `useRefreshTokensFallback`, or `cacheLocation` semantics — the
  four-stacked-bugs config from `docs/handoff-2026-09-01-native-auth-ftue.md`
  (client-grant, CORS origins ×2, `allow_offline_access` + rotating refresh
  tokens) is untouched by this bump.

**Provider options**: byte-for-byte unchanged in `main.tsx` — the bump
needed zero prop changes.

## 4. Verification

- `npx tsc -b`: clean.
- `npx vitest run src/features/auth src/shared/auth src/shared/api`:
  40/40 passed.
- `npm run preflight`: **689 test files passed / 15 skipped (704)**,
  **18,549 tests passed / 28 skipped (18,577)**, `vite build` succeeded
  (full log: `scratchpad/review/preflight-A10.log`, session-scratchpad
  only, not part of this repo).
- Simulator captures: table in §1.
- **Sign-in sheet, bypass OFF, real credentials** (task 3's harder ask —
  `sim:capture` itself cannot do this: it hard-codes
  `VITE_DEV_AUTH_BYPASS=true` when it spawns its own dev server
  — `scripts/ux-loop/sim-capture.mjs:1543` — with no flag to opt out;
  confirmed by reading the script, not assumed). Worked around by running a
  throwaway `vite --mode native` dev server on the harness's own port
  (5410) with `VITE_NATIVE_AUTH_BYPASS=false` and the real
  `dev-txjdn01ew3dmaecy` tenant config from `.env.native` (copied in from
  the source worktree for this one run, never read/printed, deleted after),
  then `xcrun simctl launch` + `xcrun simctl io screenshot` for a
  full-device capture (the SFSafariViewController sheet is a native view
  controller, invisible to the WKWebView-scoped probe `sim:capture`
  normally uses).

  Screenshot: `scratchpad/review/A10-signin-sheet-attempt2.png` (session
  scratchpad). It shows the sheet open at
  `dev-txjdn01ew3dmaecy.us.auth0.com`. The exact URL, from
  `xcrun simctl spawn <udid> log stream` (a SafariViewService/coreduet log
  line recorded the page's `webpageURL`):

  ```
  https://dev-txjdn01ew3dmaecy.us.auth0.com/u/login?state=hKFo2SB5Vmp5TTh4dmhsZzl4bU5PckhrbU4zQ1FKM0N0WHlBNqFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFRBdzliU2JYVy04SEtKYVdfZjZxdmJLbGlvRFU4aHpio2NpZNkgYklLUXpQaUFLSzZSVkFwZVdqaVY2dGJzZVNYOVFxamM
  ```

  The OS-level log didn't capture the preceding `/authorize` hop itself
  (WebKit's own network logging isn't that verbose at this log level), but
  the `state` token's embedded `cid` decodes to our real client id
  (`bIKQzPiAKK6RVApeWjiV6tbseSX9Qqjc`) — independently confirmed by curling
  the dev server's own served (transformed) module for
  `src/shared/auth/config.ts`, which echoes the live
  `import.meta.env.VITE_AUTH0_CLIENT_ID`/`VITE_AUTH0_DOMAIN` values (public
  OAuth client identifiers, not secrets). `redirect_uri` is deterministic
  from code (`nativeCallbackUrl`, `src/shared/platform/native.ts:58-60`):
  `com.linguiversal.app://dev-txjdn01ew3dmaecy.us.auth0.com/capacitor/com.linguiversal.app/callback`.

  **Did not attempt to sign in.** The app-side session was left however the
  simulator had it before this lane (a bypassed session, since the shared
  harness always forces `VITE_DEV_AUTH_BYPASS=true`); no real credential
  was entered.

## 5. Spencer's three steps

1. **Add the custom domain.** Auth0 Dashboard → Branding → Custom Domains
   → Add Domain → `login.openlingoapp.com` (free plan includes one; a card
   on file is required). Auth0 returns a CNAME target — the lead
   (Spencer, doing this in parallel with this lane) adds that as a Route 53
   record for `login.openlingoapp.com`, then waits for Auth0 to mark the
   domain Verified.
2. **Apply the page template + point the app at the new domain.**
   `node scripts/auth0/apply-branding.mjs --template` (prefers a live
   `auth0` CLI session, falls back to `AUTH0_MGMT_TOKEN`+`AUTH0_DOMAIN`, or
   prints the dashboard steps — see the script's own header). Then set
   `VITE_AUTH0_DOMAIN=login.openlingoapp.com` in `.env.production` and the
   Amplify build env, AND add the same value to the Auth0 application's
   Allowed Callback/Logout/Web Origins (they currently list the
   `*.us.auth0.com` domain, which stops matching once the app requests the
   new one).
3. **One real login.** On his phone, next build — confirms the
   SFSafariViewController round trip still completes end-to-end on the
   bumped `auth0-react` (2.26.0) with the branding applied, and that a
   backgrounded app still has a session the next day (the IPSIE ceiling
   question from §3, if the tenant ever turns that on).

## 6. Files

- `src/features/auth/AuthHandoff.tsx` (new), `AuthHandoffQaPage.tsx` (new,
  dev-only), `LoginPage.tsx`, `src/routes/RootRoute.tsx`,
  `src/shared/auth/useAuth.ts` (`logout` gained an optional
  `{ openUrl: false }`), `src/shared/styles/tokens.css`,
  `tailwind.config.js`, `src/App.tsx` (route registration),
  `src/shared/i18n/locales/{en,es,ko}.json` (`auth.handoff.*`).
- `scripts/auth0/{universal-login-branding.json,page-template.html,
  tenant-settings.json,apply-branding.mjs,rollback/*}`.
- `package.json` / `package-lock.json` (`@auth0/auth0-react` 2.26.0).
- This doc.
