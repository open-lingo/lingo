# iPad scoping — 2026-09-15

The binary is already universal: `TARGETED_DEVICE_FAMILY = "1,2"` +
`IPHONEOS_DEPLOYMENT_TARGET = 16.4` (`ios/App/App.xcodeproj/project.pbxproj:339,363`)
and all four iPad orientations in `Info.plist:73-79` are already shipped. Every
TestFlight build — including today's build 17 — already installs on iPad and
runs the same responsive web layout. **There is no "add an iPad target" task.**
The only question is what that layout does today and what has to change.

## Look at this first on your iPad (build 17, before reading further)

1. **Learn home, portrait, then rotate to landscape.** Portrait forces the
   vertical night-metro map with no List option, at full phone width stretched
   tall — check if it feels roomy or just stretched. Landscape should look
   like desktop (sidebar). Does it?
2. **A lesson (build-sentence step), portrait then landscape.** In portrait,
   is the empty margin on either side of the tile column intrusive? In
   landscape, do the tiles look "small on a big screen" — they're currently
   sized for a laptop window, not scaled up.
3. **Split View** (drag another app in from the dock) at roughly a half split.
   Same lesson screen — does anything clip or force a scrollbar inside a step?
4. **Sidebar nav, portrait, on whichever iPad you have.** Mini/Air/11" Pro
   currently show the hamburger in portrait; only the 13"/12.9" family shows
   the full sidebar in portrait (width happens to cross 1024px there). Note
   which one you're on and whether that split feels wrong.

Everything below explains why each of these looks the way it does and what it
costs to change.

## 1. Current experience, surface by surface

Breakpoints in play: Tailwind `sm`=640 (tile tokens, `src/index.css:45-215`),
`md`=768 (flashcards fitted-vs-desktop switch), `lg`=1024 (sidebar nav,
`src/shared/hooks/breakpoints.ts:22-27` — this file is the single source for
both Tailwind's `theme.screens` and the `useViewport`/`useBreakpoint` hooks).
iPad CSS-px sizes (from booted simulators, `iOS 26.5` runtime — `simctl list
devices` succeeded, contrary to the stale-CoreSimulator note in memory):

| Device (simulator) | Portrait | Landscape |
|---|---|---|
| iPad mini (A17 Pro) | 744×1133 | 1133×744 |
| iPad Air 11" (M4) | 820×1180 | 1180×820 |
| iPad Air 13" (M4) / Pro 13" (M5) | 1024×1366 | 1366×1024 |
| iPad Pro 11" (M5) | 834×1194 | 1194×834 |

All portrait widths clear `sm` (640) → desktop tile tokens today. Only the
13"/12.9" family's portrait width (1024) clears `lg` (1024, inclusive) → only
that model shows the sidebar in portrait; mini/Air/11"-Pro show the hamburger.
All landscape widths clear `lg` → sidebar everywhere in landscape.

| Surface | What 768–1366 CSS px renders today | Touch=phone assumption found |
|---|---|---|
| Learn home (map/list) | `hasCoarsePointer()` forces the vertical map and **removes the List toggle entirely**, no width check at all (`src/features/learn/LearnHomeSwitch.tsx:59-63`, using `src/shared/platform/nativeScroll.ts:11-16`) | Yes — the strongest hit. A 1366×1024 iPad Pro landscape gets a single-column vertical scroller with no way to switch to the roomier list, purely because it's touch. |
| Lesson stage / placement / test-out | Shared fixed-height shell, `max-w-2xl` (672px) centered column (`src/shared/layout/fittedShell.ts:26`, used by `LessonShell.tsx` and `PlacementTestPage.tsx:417`). On a 1024–1366pt screen this leaves 35–45% of the width as bare background — reads as a stretched phone app. | Indirect — not a touch check, but the fixed column is what makes "universal binary" look like guideline-4.0 bait (see §3C). |
| Flashcards reviewer | `ReviewShell` switches at `md` (768): below it, phone-shaped fixed shell; at 768+ it's the **existing desktop** `max-w-md` centered card column (`src/features/flashcards/components/ReviewShell.tsx:1-16,44-56`). So every iPad, portrait or landscape, already gets the desktop reviewer today — untested on iPad, but not a touch-forced bug. |
| Practice hub | `PracticeHubShell` centers a `max-h-[62rem]` flex column (`src/features/practice/components/PracticeHubShell.tsx:40-47`), no `lg:`/`md:` branch — scales continuously, no phone-only logic. |
| Settings / onboarding / get-started | `GetStartedPage` is `max-w-4xl` centered (`src/features/auth/GetStartedPage.tsx:39`); onboarding (`FirstSessionArc.tsx`) has no breakpoint logic at all. Low risk, not touch-gated. |
| Scrollbars | `@media (pointer: coarse)` hides the painted scrollbar app-wide, opt-out only on the lesson stage (`src/index.css:329-347`). Applies to iPad identically to phone. iPadOS shows its own transient indicator like iOS, so this is very likely fine — verify, don't fix. |
| Tap targets | 24×24 CSS px floor (doctrine, `CLAUDE.md`) — same on iPad; landscape-iPad "slightly bigger" targets is a new ask, not a bug fix (see §2). |

**Existing (unused) capability worth knowing about:** `useViewport()` already
defines `isTablet` (`md` ≤ width < `lg`, i.e. 768–1023) in
`src/shared/hooks/useViewport.ts:32-40`, but nothing in the codebase reads it
(`grep isTablet` hits only the hook file). It's also **width-only** — a
landscape browser window at 800×500 would read `isTablet`, which is wrong for
what Spencer wants (landscape = desktop). It's the right *place* to extend,
not a ready-made answer.

## 2. Target layout — Spencer's direction (2026-09-15)

Decided, not proposed: **landscape iPad mirrors desktop** (sidebar, desktop
tile tokens, slightly bigger buttons/tap targets); **portrait iPad is the
roomiest iteration of mobile** — mobile layout and mobile tile tokens, scaled
up to use the extra width, no desktop sidebar. This means the breakpoint
question is no longer "where does the 640 line land" — it's "the 640/1024
lines must not fire at all for portrait iPad-width viewports; a new tier has
to sit between them, chosen by orientation, not just width."

**Concrete mechanism, three pieces:**

1. **Tile tokens — a third tier.** `TILE_TOKEN_DEFS` currently carries two
   values per token, `base` and `sm` (`src/features/lesson/dev/tileSizingTokens.ts:46-56`).
   Add a third, `tabletPortrait`, and a matching CSS block in `src/index.css`
   gated on `@media (min-width: 640px) and (max-width: 1023px) and
   (orientation: portrait) and (pointer: coarse)`. **Ordering matters**: this
   block must come *after* the existing `@media (min-width: 640px)` block
   (`src/index.css:186`+) in source order — media queries don't add
   specificity, so whichever `:root` block is later in the cascade wins for
   the 640–1023 overlap. `pointer: coarse` is what keeps a narrow *desktop*
   browser window (fine pointer) on the existing `sm` tier instead of
   misfiring. The QA page (`/:lang/qa/tiles`) gets a third slider column from
   the new registry entries — that's the "dial it in" surface Spencer already
   uses for `base`/`sm`.
2. **Sidebar — orientation-gated, not width-gated.** `SidebarNav.tsx:34`
   (`hidden ... lg:flex`) and `routes/Layout.tsx:173,192` (`lg:pl-60`,
   `lg:hidden`) are Tailwind width classes; `lg` alone can't express "only in
   landscape." Add a custom screen to `tailwind.config.js`/`breakpoints.ts`,
   e.g. `landscapeLg: {'raw': '(min-width: 1024px) and (orientation:
   landscape)'}`, and swap those three class sites to it. This also fixes the
   13"-iPad-portrait sidebar showing today (§1) — it's the same mechanism.
3. **Forced-map decision — width- and orientation-aware, not touch-only.**
   `LearnHomeSwitch.tsx:59-63` needs a second condition alongside
   `hasCoarsePointer()`: force the map only when *also* narrow-or-portrait
   (reuse the same tablet-portrait predicate as #1, expressed as a JS
   `matchMedia` check or an extended `useViewport()`). Landscape iPad keeps
   the List toggle, matching "landscape mirrors desktop." Do **not** touch
   `shouldUseNativeScroll()`/the scrollbar `pointer: coarse` rule — that one
   is correctly touch-only and unrelated; conflating the two was the
   almost-bug here.

**Split View — no bespoke rule needed.** A split pane keeps the *device's*
landscape height but only a fraction of its width. Half/third/two-thirds
panes (≈320–375 / ≈507–678 / ≈694–900 px wide against ≈744–1024 px of device
height) are all taller than wide, so `orientation: portrait` is true for the
pane in virtually every split configuration — the mechanism above already
routes all of them to the portrait/roomy-mobile tier (or, below 640, the
existing plain mobile tier) automatically. Full-screen landscape is the only
path that reaches the new `landscapeLg` desktop-mirror tier. Confirm this
empirically in Phase A once the viewports exist in the gate — the reasoning
above is geometry, not a measurement.

## 3. Work breakdown

### Phase A — measure (must run before any fix lands)

| Item | Files | Hours | Risk | Verify |
|---|---|---|---|---|
| Add iPad + Split View viewports to the mobile gate | `tests/mobile/routes.mjs` (VIEWPORTS/new IPAD block), `tests/mobile/_matrix.ts` (re-export) | 3 | Low — additive. New entries may trip existing comfort assertions tuned for phone-only geometry; mark `legacy: true` where a check is phone-specific until triaged. | `npx playwright test --project=mobile` green |
| Add same viewports to the UX step-pass | `scripts/ux-loop/step-pass/run.mjs:40` (`DEFAULT_VPS`), `measure.mjs` (`ALL_VP`) | 2 | Low, additive | `node scripts/ux-loop/step-pass/run.mjs --viewports ipad-mini-portrait,ipad-pro13-landscape,split-half` produces `report.html` |
| Run both harnesses, read every failure/screenshot | — | 5 | None (read-only) | Triage list: real bug vs. acceptable |
| Native spot-checks (verify-only, no code expected) | — | 3.5 | None | See table below |
| **Subtotal** | | **13.5** | | |

Native spot-checks — why they're verify-only, not fix items: none of the
native code branches on device idiom.
- **Speech/audio** (`ios/App/App/SpeechRecognizerPlugin.swift:279-330`): the
  `.playAndRecord` + `.defaultToSpeaker` route logic only overrides output
  when `session.currentRoute.outputs.contains { $0.portType ==
  .builtInReceiver }`. iPad has no receiver hardware, so that check is simply
  always false there — no iPad-hostile path exists, just confirm speech
  input/output both work (1h).
- **Auth0 login**: `ASWebAuthenticationSession` presents as a sheet on iPad
  vs. full-screen on iPhone (system behavior, not app code) — same
  `com.linguiversal.app` URL scheme both places (1h).
- **TTS**: `src/shared/tts/{index,manifest,prefetch}.ts` has no platform
  branching — plain HTTPS fetch/playback (0.5h).
- **Android tablet sibling note**: `@capacitor-community/speech-recognition`
  is the Android equivalent (`docs/android-port-2026-09-04.md`); no iOS-only
  audio-route logic to port since the iPad fix above is "nothing to fix."

### Phase B — fix the policy bugs found in §1/§2

| Item | Files | Hours | Risk (what breaks on iPhone if done wrong) | Verify |
|---|---|---|---|---|
| Tablet-portrait tile-token tier | `src/index.css` (new `:root` block after the `sm` block), `src/features/lesson/dev/tileSizingTokens.ts` (`tabletPortrait` column + QA page slider wiring) | 5 | Medium — a misordered CSS block silently loses to the existing `sm` block; a wrong `pointer`/`orientation` clause could catch narrow desktop windows | `npx playwright test --project=mobile`, step-pass on iPhone viewports unchanged (pixel diff), QA page renders 3 columns |
| Orientation-gated sidebar (`landscapeLg` custom screen) | `tailwind.config.js`, `src/shared/hooks/breakpoints.ts`, `src/routes/SidebarNav.tsx:34`, `src/routes/Layout.tsx:173,192` | 4 | Medium — touches the one nav breakpoint every desktop user hits; verify a real browser resized across 1000–1300px still shows the sidebar (landscape-equivalent, always true on a monitor) | Manual resize + step-pass `laptop-720`/`desktop-1080p` unchanged |
| Width+orientation-gated forced-map | `src/features/learn/LearnHomeSwitch.tsx:59-63` | 3 | Medium — shares `hasCoarsePointer()` with the scrollbar rule; keep them decoupled or phone scrollbars regress | `LearnHomeSwitch.test.tsx` (add case) + step-pass on iPad viewports shows List toggle in landscape only |
| Coarse-pointer tap-target bump in landscape-desktop tier | `src/index.css` (button/tap-target rules under the new `landscapeLg`+`pointer:coarse` combo) | 2 | Low — additive padding, gated tight enough not to touch mouse/desktop | Visual check on iPad landscape simulator |
| Lesson-stage `max-w-2xl` column width in portrait roomy-mobile tier | `src/shared/layout/fittedShell.ts:26` — read *whether* the new token tier alone makes portrait look roomy before touching this; only widen if it still looks stretched | 2 (measure) + 4 (widen, if needed) | Medium — shared by `LessonShell`, `PlacementTestPage`, and (below `md`) `ReviewShell`; a change here is site-wide | Step-pass full matrix, phone screenshots unchanged |
| Split View empirical confirmation | — (verification only, per §2's reasoning) | 1 | None | step-pass `split-third`/`split-half`/`split-twothirds` entries, confirm they land in the tiers §2 predicts |
| **Subtotal** | | **17–21** | | |

### Phase C — App Store assets

Correction to the brief's stated requirement: as of 2026 App Store Connect
only requires the **13" iPad** screenshot set (2064×2752 or 2048×2732 —
Apple auto-scales down to older iPad sizes); the separate 12.9"/11" sets are
no longer mandatory. ([MobileAction](https://www.mobileaction.co/guide/app-screenshot-sizes-and-guidelines-for-the-app-store/))
App Review tests iPad regardless of whether iPad screenshots are uploaded —
Guideline 2.1 (App Completeness) covers layout that "stretches, overlaps, or
becomes unusable" on a device the binary installs on, universal or not.
([Adalo](https://help.adalo.com/publishing-apps/publishing-to-the-apple-app-store/submit-your-build-to-the-app-store/app-rejected-apple-guideline-2.1-ipad-support))
Stage Manager / external-display support (iPadOS 26, M-series iPads) needs no
Capacitor/WKWebView change — the app window just resizes like any other
viewport change already covered by Phase A/B; it is not a fourth environment,
just more values crossing the same lines.

| Item | Hours | Risk | Verify |
|---|---|---|---|
| Capture 13" screenshot set (learn map, lesson, flashcards, practice hub — portrait + landscape) | 4 | Low, but **must run after Phase B** — capturing now locks in the stretched-column look Phase B is fixing | Screenshots reviewed against §1 findings, none show the empty-margin defect |
| What's-new copy mentioning iPad | 0.5 | None | — |
| **Subtotal** | **4.5** | | |

### Phase D — Android tablet sibling parity

Single shared web bundle (`android/` is Capacitor 8, same React/Tailwind — no
Android-specific layout code exists, per `docs/android-port-2026-09-04.md`),
so every Phase B fix applies to Android tablets for free once
`npx cap sync android` picks up the same `build:native` output.

| Item | Hours | Risk | Verify |
|---|---|---|---|
| Add a tablet AVD (no tablet emulator in the toolchain today — only phone-shaped images per the android-port doc) | 2 | Low, read-only once Phase B ships | Boot AVD, load prod build, eyeball against Phase B's iPad findings |
| **Subtotal** | **2** | | |

**Total: ~37–41 hours** across A–D, B being the only phase with real
iPhone-regression risk.

## 4. Open questions for Spencer

1. **Ship b18 with iPad screenshots before or after Phase B?** Recommend
   *after* — Apple reviews on iPad regardless of the screenshot set, so an
   unfixed stretched-portrait lesson screen risks a 2.1 rejection that stalls
   the iPhone submission bundled with it. Ship iPhone-only marketing for now,
   land Phase B, then flip on iPad assets in a later build.
2. **`lg`/`landscapeLg` sidebar breakpoint change — worth the shared-nav risk
   now, or defer?** Recommend doing it in the same Phase B pass as the tile
   tier and forced-map fix, since all three touch the same
   orientation-predicate work; splitting them into separate waves means
   re-deriving the predicate twice.
3. **Lesson-column widening (`max-w-2xl`) — in scope for this wave?**
   Recommend deferring past the initial roomy-mobile token tier: measure
   first (2h), only spend the extra 4h widening if the token tier alone still
   looks stretched. Don't let a possible redesign block the smaller, certain
   fixes.
4. **Tap-target bump in landscape-desktop tier — a fixed px bump, or should
   it scale with the new orientation-gated CSS mechanism?** Recommend a fixed
   +2–3px padding bump scoped to `pointer: coarse` + `landscapeLg`, kept
   deliberately small since it's a comfort nicety, not a correctness fix like
   the other three.
