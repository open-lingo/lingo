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
-k system/com.apple.CoreSimulator.CoreSimulatorService`), ensures the dev
server on `:5399` is running WITH `VITE_NATIVE=true` — reusing one that's
already native, or restarting one that isn't (`/__sim/env` reports it; a
reused non-native server used to leave every screenshot covered by a native
`Open in "Open Lingo"?` alert, 2026-09-16 harness fix, "G1" below), builds +
installs the `CAP_DEV_SERVER` app shell only when the INSTALLED BINARY's own
build stamp is stale (`sim-stamp.json` inside the `.app`, read back per-device
via `simctl get_app_container` — "G3" below; the host's
`ios/App/App/capacitor.config.json` is no longer trusted, since it's one
shared file for every device on the machine), then launches the app at
`--route` with the accessibility font-size slider pre-set to `--font-scale`
percent (plus any `--seed`/`--tap`/`--viewport WxH` state — see below), waits
for `src/shared/dev/simProbe.ts`'s scheduled ticks to POST to
`/__sim/report`, and writes:

- `artifacts/ux-loop/sim-capture/capture-<device>[-<orientation>]-<scale>-<route-slug>.json`
  — the full probe report + screenshot path (the device + orientation are in
  the slug so an iPad capture can never silently overwrite a phone one of
  the same route + scale — "G2" below)
- `artifacts/ux-loop/sim-capture/capture-<device>[-<orientation>]-<scale>-<route-slug>.png`
  — the real app-shell screenshot

**Flags:**
- `--route` (default is the b20 #156 surface, `ja-m34-neo-3?step=16`)
- `--font-scale` (`100`/`125`/`140`, default `100`)
- `--viewport` (`15-pro-max` default, `ipad-air`, **or a literal `<W>x<H>`**
  — e.g. `--viewport 1180x820` — see "Landscape / `emulated-landscape`" below)
- `--device` (physical simulator to boot when `--viewport` is a literal
  `WxH`; default `15-pro-max`)
- `--orientation` (`portrait` default, `landscape` — tries a real rotation
  first, falls back to viewport emulation; see below)
- `--allow-fallback-font` (downgrades a missing Noto Sans JP from a failure
  to a warning)
- `--strict-prose` (fail on a `sentence`-tier MCQ wrap too — see "Prose vs.
  tile wraps" below; off by default)
- `--over-report-budget` (px, default `40`)
- `--wait` (seconds, default `13` — the probe's last scheduled tick fires at
  12000ms; auto-bumped to 15s when `--tap`/`--answer-first-option` is set)
- `--tap <selector>` / `--answer-first-option` — click an element (a CSS
  selector, or the first `[data-tile][data-variant="option"]`) after the
  step mounts; the report's `tapResult.pre`/`.post` give the CTA's and every
  option's `{top, left}` before and after, so a capture can answer "did the
  CTA/options move on submit"
- `--seed <profile>` — `fresh` (default, zero learner state), `m10-complete`
  (lesson progress + atom unlocks through module 10, plus a dozen SRS cards
  due TODAY so `/ja/practice/flashcards/review` renders a card), `kanji-mastered`
  (progress/unlocks through module 12 + the dev "bypass all locks" flag, so
  any lesson is reachable regardless of completion — see the caveat below)
- `--keep-dev-server` — opt out of the G1 auto-restart (still checks and
  warns, just doesn't kill a reused non-native server)
- `--validation-max-attempts` (default `3`) — how many times to retry the
  launch when the captured report doesn't match what was requested (lane
  isolation, see below) before failing non-zero
- `--expect-font-scale` — **internal proof/debug hook, not for normal use.**
  Validates against a DIFFERENT font scale than `--font-scale` actually set,
  so a real capture deliberately fails validation (e.g. `--font-scale 100
  --expect-font-scale 125`) — see "Proving the validator can fail" below

**How the font scale / seed / tap / emulation are set without touching
`vite.config.ts` per flag:** the values are appended to the route as
`&simFontScale=N&simSeed=…&simTap=…&simEmuW=…&simEmuH=…` before it's written
to `/tmp/lingo-sim-target`; the existing `/__sim` middleware does
`location.replace(target)` verbatim, so the query string reaches the page
unchanged, and `simProbe.ts` reads it on boot (before React mounts). Font
scale is written into the SAME `open-lingo-settings` localStorage key
`ThemeContext`/`SettingsContext` read (`accessibility.fontSize`) — no
separate apply-then-reload step to drift from the real setting. `--seed`'s
lesson-id/atom-id lookups are the one exception: they're computed
SERVER-SIDE, inside the `/__sim` middleware itself, via Vite's
`server.ssrLoadModule("/src/shared/domain/mockCourse.ts")` /
`.../lessonAtomIndex.ts` — the SAME data `DevPanel.tsx`'s "Complete up to
module" button uses — so the seed can never drift from a re-numbered course
without also breaking the dev panel.

**Landscape / `emulated-landscape` (updated 2026-09-16 — real rotation
works now):** `--orientation landscape` does a REAL device rotation before
launching the app — `scripts/ux-loop/sim-rotate/` (a standalone
`Rotator.xcodeproj` with an empty host app + a `RotatorUITests` XCUITest
that sets `XCUIDevice.shared.orientation`, which rotates the simulated
DEVICE/SpringBoard, not just that test's own host app — the same trick
`fastlane snapshot` uses) driven by `rotateDevice()` in `sim-capture.mjs`
via `xcodebuild test`/`test-without-building -parallel-testing-enabled NO`.
Two landmines, both confirmed live: (1) without
`-parallel-testing-enabled NO`, `xcodebuild test` clones the destination
simulator into a separate device set and rotates the throwaway clone,
leaving the harness's real simulator untouched; (2)
`TEST_RUNNER_ROTATE_TO=…` MUST be a real process environment variable on
the `xcodebuild` invocation, not a trailing `KEY=value` xcodebuild
argument — the latter is silently treated as a build-setting override and
never reaches the running test. For the record, since an earlier version of
this doc claimed the opposite: `xcrun simctl spawn <udid> defaults read
com.apple.springboard` DOES run inside the GUEST (it prints the simulated
iPad's own SpringBoard prefs), not the host Mac's — the OLD `simctl io
<device> screenConfig geometry <w>x<h>` attempt failed for an unrelated
reason (it picks a different device's screen MODE, it does not rotate the
current one; `idb`/`fbsimctl` are not installed either). Unless
`--allow-emulated-landscape` is passed, a failed real rotation now FAILS
the run rather than silently downgrading. The old `--viewport <W>x<H>`
LAYOUT-only fallback is still reachable (directly, or via
`--allow-emulated-landscape`) — it sets a `<meta name="viewport">` `content`
that makes the LAYOUT viewport `W`×`H` CSS px (`viewportEmulationMeta` in
`simProbe.ts`), so `cqw`/media-query-driven layout responds as if the
device were that size. **This is a layout-only trick, not a real rotation**:
because a 90°-rotated aspect ratio can't map 1:1 onto a physical screen of
the opposite aspect ratio at a single zoom level, only the WIDTH axis lands
exactly on the requested value — the effective height ends up TALLER than
requested (measured: requesting 1180×820 on the iPad Air's 820×1180 portrait
screen produced a 1180×1698 layout viewport, not 1180×820). The screenshot
(`simctl io … screenshot`) is still a physical PORTRAIT photo with the
content scaled/letterboxed to fit — captures are named `…-emulated-landscape-…`
(G2 slug) and the report carries `emulatedViewport: {w, h}` so this is never
mistaken for a real rotated render.

**`kanji-mastered` caveat (found 2026-09-16, not fixed — out of scope of
this harness):** furigana visibility (`applyKanjiSurfaces.ts`'s
`furiganaVisibleAt`) is keyed on the VIEWED LESSON's own module number
(`lessonModuleNumber()`), not the learner's actual seeded progress — so
which specific `--route`/step shows a kanji bare depends on that word's own
`introducedAtModule` (`n5Kanji.ts`) vs. the route's module, not on how far
`--seed kanji-mastered` advances progress. A capture at
`ja-m42-neo-challenge?step=11` (module 42, decades past the N5 kanji
schedule's own m8–22 unlock range) still showed furigana on 行く/見る
(unlock m15/m14) in testing — worth a follow-up in the content lane, not
chased further here.

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
more than one rect regardless of internal wrapping (**fixed 2026-09-16, G9
below** — `lineCount`/`wrapped`/`clipped` are now measured off the label's
TEXT, not its box, plus a new `overhangPx` field). Each tile also carries
`size` (`data-size`, e.g. `"word"`/`"particle"`/`"sentence"` — G4's prose-
vs-tile distinction). Plus (2026-09-16): `nativeMode` (G1 — `IS_NATIVE`),
`emulatedViewport` (`{w, h}` when `--viewport WxH`/`--orientation landscape`
requested emulation, else `null` — G5), `tapResult` (`{tapSelector,
answerFirstOption, tapped, pre, post}`, each of `pre`/`post` a `{cta,
options[]}` of `{text, top, left, w, h}` — G5's `--tap`/`--answer-first-option`),
and (2026-09-16, lane isolation, G8 below) `runNonce` (the `?simRun=<uuid>`
the CLI wrote onto the target route, echoed back so the CLI can tell its own
report from a concurrent lane's) and `innerWidth` (`window.innerWidth` —
alongside `dpr`, lets the validator catch a report that's actually the OTHER
device even on a non-emulated capture, where `emulatedViewport` is null).

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
  stage-over-report arithmetic, `viewportEmulationMeta`'s scale math for
  G5's `emulated-landscape` fallback, and `extractRunNonce` for G8's lane
  isolation). `npx vitest run src/shared/dev/simProbe.test.ts`.
- `scripts/ux-loop/sim-capture.test.mjs` — dry-run coverage of the CLI's
  pure logic against fake report JSON / args, no simulator required:
  `evaluateReport` (exit-code/verdict, including the G1 `nativeMode` check
  and the G4 prose-vs-tile wrap split), `captureSlug` (G2 device/orientation
  uniqueness), `isStampFresh` (G3's freshness comparison), `parseEmulatedSize`
  / `parseArgs` (G5/G6 flag parsing); and, for G8 (lane isolation, below):
  `routePathname`/`buildTargetRoute` (the nonce'd target-route string, and
  the pathname-only route comparison — see below),
  `validateCapture` (every mismatch class — route, runNonce, fontScale,
  rootFontPx, nativeMode, device/viewport — including the deliberate
  `--expect-font-scale` failure shape), `runWithValidationRetry` (the
  mismatch → retry → fail control flow, pinned with fake attempt/validate
  functions and no real clock), and `isLockStale`/`acquireAdvisoryLock`
  (acquire → release, same-device serialization, different-device
  non-blocking, and stale-pid reclaim, against real tmp-dir lockfiles).
  Outside the vitest project's `src/**` include globs by design (it needs no
  DOM); run with `node --test scripts/ux-loop/sim-capture.test.mjs`.

### Known gaps

Fixed 2026-09-16 (a 76-capture tile sweep exposed six harness defects, filed
as G1–G6 in the sweep's `REPORT.md`; all six are closed here, plus one more
found while fixing them):

- **G1 (native alert covering screenshots)** — `ensureDevServer()` now
  checks `/__sim/env` and restarts a reused server that wasn't started with
  `VITE_NATIVE=true`; the probe reports `nativeMode` and `evaluateReport`
  fails loudly if it's ever false. **Caveat found while verifying this
  live:** the native `Open in "Open Lingo"?` alert can still appear even
  with `nativeMode: true` confirmed by the probe (reproduced on
  `/ja/practice/flashcards/review` and `ja-m3-neo-5?step=12`) — so
  `VITE_NATIVE` missing was A cause, not the only one. The remaining alert
  looks unrelated to the dev-auth-bypass path (`DEV_AUTH_BYPASS` doesn't
  depend on `VITE_NATIVE`) and more likely traces to `native.ts`'s
  `nativeCallbackUrl()` / an SFSafariViewController handoff attempt — not
  chased further; it's app auth code, out of scope of the files this lane
  owns. Live tests confirm the FIX itself (detect + restart + honest
  `nativeMode` reporting) works; the alert is a separate, still-open issue.
- **G2 (iPad captures overwriting phone captures)** — `captureSlug()` now
  takes `{viewportKey, orientation}` and includes both in the filename.
- **G3 (stale non-dev shell passing the freshness check)** — freshness is
  now read from a `sim-stamp.json` written into the built `.app` and read
  back per-device via `simctl get_app_container`, not the host's shared
  `capacitor.config.json`.
- **G4 (`evaluateReport` failing on prose wraps)** — tiles now carry
  `data-size`; a `sentence`-tier wrap is a warning, not a failure, unless
  `--strict-prose`.
- **G5 (no rotation, no tap channel)** — real rotation was tried live and
  confirmed unavailable (see "Landscape / `emulated-landscape`" above);
  `--viewport WxH` / `--orientation landscape` emulate it via a meta-viewport
  trick, clearly labeled. `--tap` / `--answer-first-option` click a real DOM
  element (no touch-injection channel existed anywhere in this repo to
  reuse — checked; the speech harness's "injected" plugin is a unit-test
  mock, not a UI tap channel) and record before/after CTA + option geometry.
- **G6 (`/ja/review` rendering no stage)** — `--seed <profile>` seeds real
  lesson-progress + atom-unlock + due-SRS-card localStorage state, computed
  server-side from the real course data (see above). The exact route
  `/ja/review` doesn't exist (checked `src/App.tsx`'s route tree); the real
  review surfaces are `/:lang/practice/flashcards/review` and
  `/:lang/practice/grammar/review` — `m10-complete` renders a real card on
  the former. `kanji-mastered`'s furigana-hiding caveat is documented above.
- **G7 (found while fixing the above, not in the original six) — stale
  navigation state across captures.** `simctl terminate` + `simctl launch`
  does NOT reliably force a fresh `/__sim` boot: iOS/UIKit state restoration
  can resurrect the WKWebView's LAST navigation instead of re-reading
  `/tmp/lingo-sim-target`, and it was INTERMITTENT (some launches picked up
  the new route, some silently kept the old one — reproduced live
  2026-09-16, traced to `Library/Saved Application State/<bundleId
  >.savedState` in the app's data container). `sim-capture.mjs` now deletes
  that directory (`clearSavedAppState()`) before every launch. This means
  **captures made by this harness before 2026-09-16 cannot be trusted to
  show the route their filename claims** — if a report's own `href` field
  doesn't match the requested `--route`, that capture was stale; the fix
  makes this failure mode impossible going forward, but doesn't retroactively
  validate old captures (including some of this sweep's own — see the RUN IT
  results in the handoff for which ones were affected).
- The native-app-shell path (what `sim:capture` drives) measures real
  WKWebView geometry through the same fetch-report channel `simProbe.ts`
  already used for screenshots — it does not need a separate safaridriver
  WebDriver session. A safaridriver-driven **mobile Safari** run (see
  `.claude/skills/mobile-ui-verify/SKILL.md` §2) remains a useful second
  surface for a claim that must hold outside the app shell too, but isn't
  wired into this command.
- **G8 (found 2026-09-16, PHASE2A.md §6.7) — two `sim:capture` runs
  corrupting each other through the shared `/tmp/lingo-sim-target` + `/__sim`
  seed.** The tile-sweep phase 2A lane ran captures on `OL-15ProMax` while
  this lane's own testing hit the same file concurrently: 8 of that lane's 40
  captures were silently another lane's route at another lane's font scale,
  and nothing in the harness noticed. Two defenses, both against the SAME
  shared file (the `/__sim` middleware in `vite.config.ts` still serves one
  target file — owned by another lane, not touched here):
  - **Validation + retry (the correctness guarantee).** Every launch attempt
    writes a fresh `?simRun=<uuid>` nonce onto the target route (echoed back
    by `simProbe.ts` as `report.runNonce`). After the wait, `validateCapture`
    checks `report.href` (route), `runNonce`, `fontScale`, `rootFontPx`
    (== 16 × scale, ±0.5px), `nativeMode` (must be `true`), and the
    device/viewport (`dpr` + `innerWidth`, or `emulatedViewport` for a
    `--viewport WxH` capture) against what THIS invocation actually
    requested. A mismatch retries the whole launch (up to
    `--validation-max-attempts`, default 3, with 2s/4s backoff); exhausting
    every attempt fails non-zero, naming every mismatch, and leaves the
    canonical `capture-….json`/`.png` UNWRITTEN (only a validated capture
    ever gets the canonical filename — each attempt's own screenshot is kept
    at `capture-….attempt<N>.png` for debugging a run that never validated).
  - **Advisory locks (shrinks how often a race happens at all).** A
    PER-DEVICE lock (`/tmp/lingo-sim-<udid>.lock`, holding `{pid,
    startedAt}`) is held for the WHOLE capture (write → launch → wait →
    screenshot → report read), so two runs aimed at the SAME simulator
    serialise instead of interleaving. A separate, short-lived GLOBAL lock
    (`/tmp/lingo-sim-__launch__.lock`) is held only across the actual
    write-target-file → terminate → launch → ~3s settle window — the moment
    that touches the shared file — so two DIFFERENT devices still spend most
    of a capture (the ~13s wait for probe ticks + screenshot) running in
    parallel; only that few-second window is serialized globally. Either
    lock reclaims a lockfile whose pid is dead, or which is >5 minutes old,
    rather than hanging on a crashed run's leftover file.
  - **Two devices running in parallel:** `OL-15ProMax` (`942D8E54-…`, the
    default `15-pro-max` viewport — see the `VIEWPORTS` doc comment for why
    it replaced the stock "iPhone 15 Pro Max" device, which carries stale
    SpringBoard state that pops an `Open in "Open Lingo"?` alert over every
    shot) and a second physical simulator (e.g. boot the stock "iPhone 15 Pro
    Max" via `--device`, noting its stale-alert caveat, or `ipad-air`) CAN be
    driven by two concurrent `npm run sim:capture` invocations — the global
    launch lock only serializes their few-second write/launch windows, not
    the whole run. Two invocations aimed at the SAME device instead fully
    serialise via the per-device lock (correct, just not concurrent — that's
    the intended behavior, not a bug).
  - **What this does NOT do:** it does not make the `/__sim` middleware
    itself per-device/per-nonce-aware (that's `vite.config.ts`, owned by
    another lane). Two devices racing exactly within the launch-lock's ~3s
    settle window is still architecturally possible under load; validation +
    retry is the actual correctness backstop for that case, not the locks.
  - **Proving the validator can fail** (2026-09-16 live run, `OL-15ProMax`):
    ```
    npm run sim:capture -- --route "/ja/learn/lessons/ja-m34-neo-3?step=16" \
      --font-scale 100 --expect-font-scale 125 --validation-max-attempts 1
    ```
    requests a real 100% capture but validates it against 125% — a real,
    honest failure (not a planted fake report):
    ```
    VALIDATION MISMATCH (attempt 1/1): fontScale: expected 1.25, got 1; rootFontPx: expected ~20 (16 × 1.25), got 16
    FAIL: capture never validated after 1 attempt(s):
    FAIL:   fontScale: expected 1.25, got 1
    FAIL:   rootFontPx: expected ~20 (16 × 1.25), got 16
    ```
  - **Concurrent two-device proof (2026-09-16 live run) — and it caught a
    REAL race, unprompted.** Two `npm run sim:capture` invocations launched
    within the same second, one per device:
    ```
    npm run sim:capture -- --route "/ja/learn/lessons/ja-m34-neo-3?step=16" --font-scale 100 --viewport 15-pro-max
    npm run sim:capture -- --route "/ja/learn/lessons/ja-m3-neo-5?step=12"  --font-scale 100 --viewport ipad-air
    ```
    The 15 Pro Max run validated clean on attempt 1. The iPad Air run's
    attempt 1 genuinely raced it through the shared `/tmp/lingo-sim-target` —
    caught and named precisely, then retried and passed on attempt 2:
    ```
    [attempt 1/3] launched at /ja/learn/lessons/ja-m3-neo-5?step=12&simFontScale=100&simRun=44161f23-…
    VALIDATION MISMATCH (attempt 1/3): route: expected "/ja/learn/lessons/ja-m3-neo-5", got "/ja/learn/lessons/ja-m34-neo-3"; runNonce: expected "44161f23-…", got "3aa3797c-…" — this report belongs to a different (concurrent or stale) run; device: expected dpr 2 (ipad-air), got dpr 3; viewport width: expected ~820px (ipad-air), got 430px
    retrying in 2000ms…
    [attempt 2/3] launched at /ja/learn/lessons/ja-m3-neo-5?step=12&simFontScale=100&simRun=584bdbc8-…
    PASS
    ```
    Both final captures validated (`capture-15-pro-max-100-…-step-16.json`,
    `capturedAt` `08:58:18.015Z`; `capture-ipad-air-100-…-step-12.json`,
    `capturedAt` `08:58:30.615Z` — ~12.6s apart, i.e. running their ~13s
    probe waits mostly in parallel, not serialized end-to-end) both report
    `validation.ok: true`. This is exactly the PHASE2A.md §6.7 corruption
    shape — the iPad Air's probe genuinely read the 15 Pro Max's route/scale
    off the shared file — reproduced live and closed by validation + retry
    without a human noticing or re-running anything by hand.
- **G9 (found 2026-09-16, `<S>/tile-sweep/PHASE2B.md` §4, labelled "G8"
  there — renumbered here to not collide with this doc's own G8 above) — the
  probe couldn't see a wrap in any FLEX tile tier.** `measureTile` derived
  `lineCount`/`clipped` from `label.getClientRects()`. In every FLEX tile
  tier — every option tier (`word`/`particle`/`image`/`reading`/…) plus
  build/listen banks, i.e. everything except the `sentence`/`row` prose
  tiers — the label (`span[lang]` / `[data-build-tile-kana]` /
  `[data-build-tile-kanji]`) is a flex ITEM, so it's blockified:
  `getClientRects()` returns exactly ONE border-box rect no matter how many
  lines render, and `clipped` was equally dead (a block's `scrollWidth`
  equals its `clientWidth` once it wraps). Confirmed live before the fix:
  `ja-m3-neo-5?step=12` at 125% reported `lineCount: 1` for all four tiles
  while ありがとうございます visibly wrapped to two lines on screen — every
  wrap count phase 1/2A/2B reported for a flex tier was measuring nothing.
  - **Fix, in `simProbe.ts`:** `collectBaseTextRects(label)` walks the
    label's text nodes with a `TreeWalker`, skipping any node whose ancestor
    (up to the label) is `<rt>` — furigana, in BOTH the kanji `KanjiRuby`
    reading and the plain-kana romaji helper ruby
    (`AnnotatedText.tsx` uses `<ruby><rt>` for both) — and creates one
    `Range` per surviving text node. A Range's `getClientRects()` reports
    real per-line boxes regardless of the label's own `display`.
    `countDistinctLines` now clusters those rects' `top`s by GAP (tolerance
    2px, ignoring any zero-height rect) rather than by rounding to the same
    integer, so a pair of tops straddling a rounding boundary can't
    misreport as two lines. When a label has no qualifying text at all (an
    image-only option), `fallbackLineCount` estimates
    `round(labelHeight / computedLineHeight)` (approximating `line-height:
    normal` as 1.2× font-size when `getComputedStyle` can't resolve it to a
    px value) instead of returning a bare 0. `clipped` is now `(label
    scrollWidth > clientWidth + 1) OR (any base-text rect's right edge >
    the TILE's own content-box right edge + 1)` — the second check is the
    real fix for a flex tier, where the first was dead; excluding `<rt>`
    from the base-text rects means a ruby/furigana annotation that overhangs
    shows up ONLY via the first check, so a new `overhangPx` field on each
    tile (also columned into `formatSummaryTable` and folded into
    `evaluateReport`'s "N tile(s) clipped" reason) tells a reader whether a
    clip is a real base-text overflow (`overhangPx > 0`) or a
    scrollWidth-only clip, commonly a ruby overhang (`overhangPx === 0`).
    `lineCount`/`wrapped`/`clipped` keep their exact names/meaning for every
    existing consumer (`evaluateReport`, `formatSummaryTable`); `overhangPx`
    is additive.
  - **Proof it can fail both ways, live on `OL-15ProMax`** (per-tile columns
    are `lines wrap clip ovh`):
    - `ja-m3-neo-5?step=12` @125% — before the fix (PHASE2B.md §4): all four
      tiles reported `lineCount: 1, wrapped: false`. After:
      ```
      text                 variant   fontPx boxW boxH lines wrap  clip   ovh
      だいじょうぶ               option        27  188  170     1 false false     0
      ありがとうございます           option        27  188  170     2  true false     0
      うん                   option        27  188  170     1 false false     0
      ありがとう                option        27  188  170     1 false false     0
      ```
      ありがとうございます now reports `lineCount: 2` (screenshot
      `artifacts/ux-loop/sim-capture/capture-15-pro-max-125-ja-learn-lessons-ja-m3-neo-5-step-12.png`
      shows it on two lines, だいじょうぶ/うん/ありがとう on one); run
      exits non-zero (`FAIL: 1 tile(s) wrapped: "ありがとうございます"`).
    - `ja-m34-neo-3?step=16` @100% (this doc's default route, no wraps at
      100%) — all four option tiles report `lineCount: 1`; run `PASS`.
    - `ja-m5-neo-7?step=5` @100% — an actual BUILD-tile bank (`data-variant`
      `"build"`, `[data-build-tile-kana]` labels, not option MCQ): all nine
      kana-tile pieces (うた/を/きく/は/…) report `lineCount: 1`; run `PASS` —
      confirms the fix also engages correctly on the
      `[data-build-tile-kana]`/`[data-build-tile-kanji]` label path, not
      only `span[lang]` MCQ options.
