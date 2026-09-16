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

---

## Sim capture (2026-09-15)

Three phone-sizing bugs (b20 #156/#157/#161) were invisible in headless
Chromium *and* Playwright WebKit and only showed on the real WKWebView — see
`.claude/skills/mobile-ui-verify/SKILL.md` §1. This closes the tooling gap
that skill's §7 flags ("the safaridriver measurement harness is not
committed… landing it in `scripts/` is the highest-leverage fix"). It also
reports the two variables that explain most of the misses: the accessibility
root-font multiplier (`ThemeContext.tsx`, the font-size slider is 85–140%)
and which CJK font actually painted (`index.html` loads Noto Sans JP with
`display=optional`, so a slow/cold load can render the OS's Hiragino
fallback for the whole session — a ~5.8% different ruby box).

### The one command

```bash
npm run sim:capture -- --route "/ja/learn/lessons/ja-m34-neo-3?step=16" --font-scale 125
```

It boots the 15 Pro Max simulator if needed (kickstarting a stale
CoreSimulator service once on the known failure — `sudo launchctl kickstart
-k system/com.apple.CoreSimulator.CoreSimulatorService`), reuses an
already-running dev server on `:5399` or starts one
(`VITE_DEV_AUTH_BYPASS=true VITE_NATIVE=true`, per `capacitor.config.ts`'s
own comment on why `VITE_NATIVE` matters), builds + installs the
`CAP_DEV_SERVER` app shell only when it's missing or not wired to that exact
dev server (`ios/App/App/capacitor.config.json`'s `server.url`), then
launches the app at `--route` with the accessibility font-size slider
pre-set to `--font-scale` percent, waits for `src/shared/dev/simProbe.ts`'s
scheduled ticks to POST to `/__sim/report`, and writes:

- `artifacts/ux-loop/sim-capture/capture-<route-slug>-<scale>.json` — the
  full probe report + screenshot path
- `artifacts/ux-loop/sim-capture/capture-<route-slug>-<scale>.png` — the
  real app-shell screenshot

Flags: `--route` (default is the b20 #156 surface,
`ja-m34-neo-3?step=16`), `--font-scale` (`100`/`125`, default `100`),
`--viewport` (`15-pro-max` default, `ipad-air`), `--allow-fallback-font`
(downgrades a missing Noto Sans JP from a failure to a warning),
`--over-report-budget` (px, default `40`), `--wait` (seconds, default `13`
— the probe's last scheduled tick fires at 12000ms).

**How the font scale is set without touching `vite.config.ts`:** the
`--font-scale` value is appended to the route as `&simFontScale=N` before
it's written to `/tmp/lingo-sim-target`; the existing `/__sim` middleware
already does `location.replace(target)` verbatim, so the query string
reaches the page unchanged. `simProbe.ts` reads it on boot (before React
mounts) and writes it into the SAME `open-lingo-settings` localStorage key
`ThemeContext`/`SettingsContext` read (`accessibility.fontSize`), so the
normal hydration path applies it — no separate apply-then-reload step to
drift from the real setting.

### What the probe reports (per capture)

`rootFontPx` (computed on `<html>`), `fontScale` (the localStorage setting
value, 0.85–1.4), `notoLoaded` (`document.fonts.check('16px "Noto Sans
JP"')`), `sampleTileFontFamily` (the resolved font-family on a sample
tile — proves whether Noto Sans JP or a fallback actually painted),
`emRatio` (a tile's font size ÷ root font size), `textSizeAdjust`
(computed `-webkit-text-size-adjust`), `dpr`, `pointerCoarse`
(`matchMedia("(pointer: coarse)")`), `vv`/`innerHeight`/`stage.h` +
`stageOverReportPx` (the gap between the reported viewport and the
measured lesson-stage box — this is the ~200px over-report #157/#161
trace to), and `tiles[]` — every `[data-tile]` in the current step (covers
build/option/MCQ tiles alike) as `{text, variant, fontPx, boxW, boxH,
lineCount, wrapped, clipped}`, measured off the tile's `AnnotatedText`
label span (`getClientRects()`, distinct rounded `top` values = line
count) rather than the tile's own block-level box, which never reports
more than one rect regardless of internal wrapping.

**`stageOverReportPx` (2026-09-15, redefined same day):** NOT the fixed
header/CTA chrome above/below the stage box — that's expected and reported
separately, informationally, as `chromeAbovePx`/`chromeBelowPx` (no budget).
It's the step **scroller** claiming more usable height than is actually on
screen: `scroller.clientHeight` minus how much of the scroller's own
bounding rect actually intersects the real `visualViewport` rect, minus
whatever a `position:fixed` CTA sitting over the scroller's bottom occludes.
This is the number a `cqh`/fill rule must not spend past — the first
definition (reported viewport minus the whole stage box) just measured the
same fixed chrome every run and failed on it for free.

### What a failing run looks like

Exit code is non-zero when the captured report shows a real defect:

```
route=/ja/learn/lessons/ja-m34-neo-3?step=16  fontScale=125%  viewport=15-pro-max
  rootFontPx=20  fontScale(setting)=1.25  notoLoaded=true  emRatio=1.65  dpr=3  pointerCoarse=true  textSizeAdjust=100%
  vv=932  innerHeight=932  stageH=679  stageOverReportPx=253
  sampleTileFontFamily="Noto Sans JP", Inter, ui-sans-serif, system-ui, sans-serif
  tiles (4):
    text                 variant   fontPx boxW boxH lines wrap clip
    ばんごはん                option        33  186  168     1 false false
    ...
FAIL: stage over-report 253px exceeds budget 40px
```

(That is a real capture from 2026-09-15, not a hypothetical — see the
sim-capture handoff note for the paired 100%/125% tables. #156's own wrap
did not reproduce on this pass — a `tileFit`/shrink-to-fit mechanism landed
concurrently and appears to be holding the font down instead of wrapping —
but the stage-vs-viewport over-report is real and unrelated to that fix.)

A tile row with `wrap true` or `clip true` fails the same way, one FAIL
line per tile. A missing Noto Sans JP (`notoLoaded=false`) fails unless
`--allow-fallback-font` is passed, in which case it prints as a `WARN`
line instead and the run can still pass.

### Tests

- `src/shared/dev/simProbe.test.ts` — the probe's pure parts (line-count
  from fake `getClientRects()` output, wrap/clip derivation, the
  stage-over-report arithmetic). `npx vitest run src/shared/dev/simProbe.test.ts`.
- `scripts/ux-loop/sim-capture.test.mjs` — dry-run coverage of the CLI's
  exit-code/verdict logic (`evaluateReport`) against fake report JSON, no
  simulator required. Outside the vitest project's `src/**` include globs
  by design (it needs no DOM); run with `node --test
  scripts/ux-loop/sim-capture.test.mjs`.

### Known gaps

- The native-app-shell path (what `sim:capture` drives) measures real
  WKWebView geometry through the same fetch-report channel `simProbe.ts`
  already used for screenshots — it does not need a separate safaridriver
  WebDriver session. A safaridriver-driven **mobile Safari** run (see
  `.claude/skills/mobile-ui-verify/SKILL.md` §2) remains a useful second
  surface for a claim that must hold outside the app shell too, but isn't
  wired into this command.
- `ensureDevServer()` never restarts an already-running dev server (another
  session may own it — see `docs/mobile-testing-setup` concurrency notes) —
  if that server was started without `VITE_NATIVE=true`, native-only
  branches (auth, TTS host, the speech plugin) silently take the web path.
  It does not affect the sizing numbers above, which don't depend on
  `IS_NATIVE`, but don't cite a capture made this way for anything that
  does.
- `buildAndInstallShell()`'s staleness check only compares the generated
  `capacitor.config.json`'s `server.url` and whether the bundle ID is
  installed — it does not fingerprint the JS bundle itself, so a content
  change with no `cap sync` in between can serve stale JS. Re-run `npx cap
  sync ios` by hand if a capture looks like it's showing old content.
