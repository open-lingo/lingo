# Mobile Testing Setup — Friends & Family

**Date:** 2026-08-06
**Goal:** get real people using Open Lingo on their phones this month, without
app stores (deferred — see
[mobile-offline-oss-scoping-2026-08-06.md](./mobile-offline-oss-scoping-2026-08-06.md) § T8).

---

## What already works (verified 2026-08-06)

**You can start testing today with zero code changes.**

| Check | Result |
|---|---|
| `https://app.openlingoapp.com` | HTTP 200, live |
| `/login`, `/get-started`, `/try` | all reachable |
| Signup | works — `useAuth().signup()` → `screen_hint: "signup"` |
| Deploy | S3 + CloudFront, auto on push to `main` |
| `viewport-fit=cover` | present in `index.html` |
| Safe-area utilities | `pt-safe` / `bottom-safe-N` family in `tailwind.config.js` |
| Mobile render gate | `tests/mobile/` — 5 phone + 2 desktop viewports. Public subset rebuilt 08-07 after it was found asserting on the live marketing site and Auth0; see `handoff-mobile-gate-was-blind-2026-08-06.md` |

**Send testers to `https://app.openlingoapp.com/get-started`.** It's a
responsive SPA over HTTPS with a working signup. That is a legitimate Tier-0
test channel.

---

## ✅ Tier 1 — SHIPPED 2026-08-06

Everything below in this section is **done** (kept for the rationale). What landed:
`src/pub/manifest.webmanifest`, four icons from `scripts/generate-icons.mjs`,
`<link rel="manifest">` + `apple-touch-icon` + dual `theme-color` + Apple meta in
`index.html`, and the `start_url` blocker fixed via standalone detection in
`routes/MarketingRedirect.tsx`.

Verified: manifest served as `application/manifest+json` (not the SPA fallback), all icons
resolve 200, and an anonymous user in standalone display lands on in-app `/login` while a
normal browser tab still leaves for the marketing origin.

⚠️ The icons are **placeholders**. `mark.png` is 88×96, so the 512px output is a ~6×
upscale — readable but soft. Replace `src/pub/mark.png` with a ≥1024px master (or an SVG)
and re-run the generator before this goes anywhere public.

⚠️ `apple-mobile-web-app-status-bar-style` is `default`, not `black-translucent`. Translucent
is the intended pairing with `viewport-fit=cover` and the `pt-safe` utilities, but it puts
content under the status bar and the insets are not hardware-verified. Upgrade after testing.

---

## Tier 1 — make it installable (~half a day, highest value)

This is the "feels like a real app" upgrade and it does **not** require a
service worker. Installability needs only a manifest plus Apple meta tags.

### What's missing

| Asset | State |
|---|---|
| `manifest.webmanifest` | **absent** — `/manifest.webmanifest` returns HTTP 200 but `content-type: text/html`; that's the SPA fallback, not a manifest (a nonsense path 200s identically) |
| PWA icons (192, 512, maskable) | **absent** — repo has only `src/pub/icon.ico` and `mark.png` (5 KB) |
| `<link rel="manifest">` | absent from `index.html` |
| `apple-touch-icon`, `theme-color`, `apple-mobile-web-app-*` | absent |
| Service worker | absent (Tier 2) |

**CSP is already compatible.** Production sends `worker-src 'self' blob:`,
which permits a same-origin service worker, and `manifest-src` falls back to
`default-src 'self'`. No CSP change needed for Tier 1 or Tier 2.

### ⚠️ Blocker: `start_url` and the marketing redirect

Anonymous users at `/` are sent **cross-origin** to the marketing site via
`window.location.replace()` (`routes/RootRoute.tsx`, `routes/RequireAuth.tsx` →
`MarketingRedirect`). In an installed PWA a cross-origin navigation **breaks out
of the standalone app context** — iOS kicks the user into Safari, Android shows
an in-app browser bar. A tester who installs the app, gets logged out, and taps
the icon is ejected from the app entirely.

**Fix before shipping the manifest.** Either:
- set `start_url: "/login"` (or `/home`), **and**
- make the anon redirect render an in-app login screen when
  `display-mode: standalone`, rather than leaving the origin.

Do not ship a manifest with `start_url: "/"` as-is.

### Work items

1. Generate icons from `mark.png` — 192×192, 512×512, plus a maskable variant
   with safe-zone padding. Put them in `public/`.
2. Add `public/manifest.webmanifest`: `name`, `short_name`, `start_url` (see
   above), `display: "standalone"`, `background_color`, `theme_color`, `icons`.
3. `index.html`: `<link rel="manifest">`, `<link rel="apple-touch-icon">`,
   `<meta name="theme-color">` (light + dark via `media`),
   `<meta name="apple-mobile-web-app-capable" content="yes">`,
   `<meta name="apple-mobile-web-app-status-bar-style">`.
4. Fix the standalone-mode redirect (above).
5. Verify: install on a real iPhone and a real Android, confirm no browser
   chrome and no Safari ejection on cold launch while logged out.

---

## Tier 2 — offline (~1–2 weeks, defer past F&F)

Service worker precaching the app shell, plus **per-module audio packs**
(~6 MB/module, opt-in on module entry). Never a full-corpus prefetch — that's
244 MB and 40× the per-user bandwidth budget. Details in the scoping doc § T3/T4.

The SRS already syncs offline-first (delta merge, LWW), so the sync half is
done. What's missing is boot-offline and an outbox queue for lesson/XP/quest
writes.

---

## Tier 3 — app stores (deferred)

$99/yr Apple + $25 one-time Google, TestFlight / Play Internal Testing.
**This is the trademark tripwire** — file OPEN LINGO Class 9 ($350) before any
store submission. Not this month.

### ⚠️ The Capacitor wrapper is no longer hypothetical (2026-08-06)

It is scaffolded, wired, and in the repo — **but only as a route onto Spencer's
own phone via free provisioning**, not as a step toward submission. Setup,
free-tier limits, the two app-specific bugs it surfaced, and the measured proof
that the web build is unchanged: **[ios-wrapper-setup-2026-08-06.md](./ios-wrapper-setup-2026-08-06.md)**.

Free provisioning is **your device only, 7-day profile expiry, no TestFlight**,
so it does NOT replace Tier 0/1 for friends and family.

**Status 2026-08-07: it runs on hardware.** Lesson 1 plays through on an iPhone 15 Pro Max
(iOS 26.5.2). Both former blockers are cleared — the iOS platform component is installed,
and TTS under `capacitor://` is fixed in code by routing that one fetch through the native
HTTP stack, which removes the `lingo-infra` CORS policy from the critical path entirely.

⚠️ Audio is fixed but **not confirmed by ear** — "the lesson works" does not prove a clip
decoded. See § 5 gap 1 of the wrapper doc before assuming it does.

---

## Practical gaps for friends & family

These will bite before any layout bug does.

1. **Auth0 is on a dev tenant** — `dev-txjdn01ew3dmaecy.us.auth0.com`. Fine
   technically (free tier covers 7,500 MAU, and dev-tier rate limits are far
   above F&F volume), but non-technical testers see a `dev-…auth0.com` URL on
   the login screen, which reads as sketchy. Consider a custom domain on Auth0
   before wider testing, or warn testers up front.
2. **No in-app feedback mechanism.** `docs/user-feedback/` holds exactly one
   file (2026-05-18) and the loop is entirely manual. Testers on phones will not
   file GitHub issues. Cheapest fix: a mailto or a Google Form link in Settings.
3. **iOS install is non-obvious** — Share → Add to Home Screen. Testers need to
   be told; nobody discovers this. Write a 3-line install note.
4. **No crash/error reporting.** If a tester hits a white screen you'll hear
   "it broke" with no stack. The mobile gate catches `pageerror` in CI but
   nothing reports from real devices.
5. **Ad blockers break dev, not prod** — but if any tester runs a content
   blocker, `src/features/ads/` module URLs can be blocked. Worth knowing when
   triaging "white screen" reports.

---

## Recommended order

| # | Action | Effort |
|---|---|---|
| 1 | Send testers to `/get-started` — start collecting feedback **now** | 0 |
| 2 | Write the install note + a feedback link (mailto or Form) | ~1 h |
| 3 | Fix the standalone-mode marketing redirect | ~2 h |
| 4 | Icons + manifest + Apple meta tags | ~3 h |
| 5 | Verify install on real iOS + Android hardware | ~1 h |
| 6 | *(later)* service worker + per-module audio packs | 1–2 wk |

Steps 1–2 are today. Steps 3–5 are the half-day that makes it feel like an app.

---

## Effort estimates are rough

The hour figures above are judgment, not measurements. The one that could blow
out is #3 — the standalone redirect touches auth routing, which is load-bearing.
