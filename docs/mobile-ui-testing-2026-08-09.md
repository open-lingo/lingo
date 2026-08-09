# Mobile UI testing — the method

**Date:** 2026-08-09 · **Status:** CURRENT · **Supersedes:**
`mobile-research-2026-07-20.md` § 6 assertion 3 — the "tap targets ≥44px,
start warn" rule (§ 3 below). Assertions 1, 2, 4, 6 and 7 from that spec stand
as written. `mobile-testing-setup-2026-08-06.md` is untouched by this and
remains authoritative on PWA / manifest / distribution.

**Open work from this pass:** B091–B101 in `docs/backlog/items.yaml` —
`node scripts/backlog.mjs --tag system/mobile-gate` for the tooling half,
`--tag class/stage-overflow` for the layout half. Every number quoted below is
carried into those records, so the backlog is queryable without this doc.

**The one rule:** mobile UI correctness is asserted by `tests/mobile/`, in
headless Chromium, with real safe-area insets injected. The simulator and a
real phone are for things a DOM cannot tell you — not for layout.

---

## 1. Why not just drive the simulator?

Because it cannot be driven, and because it cannot measure. Both verified
2026-08-09 rather than assumed:

| Tool | Can tap? | Can read DOM/CSS? | Verdict |
|---|---|---|---|
| `xcrun simctl` | **No** | No | No input verb exists |
| XCUITest (Swift) | Yes | **No** | WKWebView is opaque — accessibility tree only |
| Appium + XCUITest | Yes | Yes | Works, but costs a WebDriverAgent build/boot per run |
| Playwright + Chromium | Yes | Yes | What we use |

`xcrun simctl help` has no `tap`, `touch`, or `input` subcommand — it does
`install`, `launch`, `openurl`, `push`, `screenshot`, `recordVideo`,
`ui appearance`, `ui content_size`, `status_bar override`, and nothing that
synthesises a touch. The `simctl io booted input tap x y` snippet that
circulates on blogs is not in the real CLI.

XCUITest can tap, but a `WKWebView` exposes only an accessibility tree to it.
No `getComputedStyle`, no `getBoundingClientRect`, no `scrollHeight`. Every
number this gate asserts on is unreachable from there.

Appium's XCUITest driver *does* give real JS execution in webview context (and
in Appium 2.x no longer needs `ios-webkit-debug-proxy`), so it is the honest
fallback if we ever need native gestures — pinch, multi-touch, native
transitions. It is not worth its setup cost for layout.

**So the split is: Playwright measures, the device verifies environment.** That
split is exactly how the Dynamic Island bug shipped — correct code, headless
said fine, phone said broken. Section 2 is how that hole got closed.

---

## 2. Safe-area insets — the hole, and the fix

Chromium resolves **every `env(safe-area-inset-*)` to 0**. The `*-safe`
utilities in `tailwind.config.js` are `max(env(safe-area-inset-*), <fallback>)`,
so they all collapsed to their fallbacks, and a header sitting under the
Dynamic Island measured as correctly positioned **at every viewport in the
matrix**. That was not missing coverage; no route list or viewport could have
found it. It took a person looking at a phone (2026-08-08).

`tests/mobile/_seed.ts` now calls CDP `Emulation.setSafeAreaInsetsOverride`
before each navigation, with per-viewport insets from `routes.mjs`:

```
android-small      0 / 0        (deliberate no-inset control)
iphone-se          top 20
pixel-7            top 24, bottom 24
iphone-14-promax   top 59, bottom 34   <- the device under test
tablet-portrait    top 24, bottom 20
desktop            0 / 0
```

Three deliberate choices:

- **Strict, not optional.** The CDP method is marked *experimental*. If a
  Chromium bump removes it, `gotoSeeded` throws and CI goes red. Swallowing
  that error would return the gate to its blind state while every safe-area
  assertion kept passing — the worst outcome available.
- **Round-tripped.** Setting the override on the browser is not the same as CSS
  resolving to it, so `gotoSeeded` reads `env()` back through a probe element
  and fails if it disagrees.
- **Required field.** `insets` is non-optional on the `Viewport` type. An
  omitted inset silently means zero, which is the exact blind spot.

Verified on Playwright 1.60 / Chromium 148. Negative control on `/ja/learn` at
430×932 — **0** intrusions as shipped, **4** with `pt-safe`/`pb-safe` forced to
zero (brand link at `top=10px`, account menu `4px`, menu toggle `0px`): the
reported bug, reproduced headlessly.

---

## 3. Tap targets — 24px, not 44px

The old spec compared everything to a flat 44px and emitted a **non-failing
warning**, which is why nobody read it. 44×44 is Apple's HIG *recommendation*
and WCAG **Level AAA** (SC 2.5.5). The AA criterion is SC 2.5.8: 24×24 CSS px
**with a spacing exception**:

> Undersized targets are positioned so that if a 24 CSS pixel diameter circle
> is centered on the bounding box of each, the circles do not intersect another
> target or the circle for another undersized target.

That exception is the whole point — it is why a dense row of 36px icons
conforms and a cramped pair of 20px ones does not. Measured across 19 routes at
430×932: **114 elements under 44×44, zero failures against 2.5.8.**

The spec now implements 2.5.8, hard-fails, and has **no allow-list**. The old
one blanket-exempted `role="link"`, which excused every link-shaped button;
genuine prose links are covered by the Inline exception on the actual rule.
Screen-reader-only nodes are excluded — a 1×1 clipped skip link is not a
pointer target, and counting one produced the only "failure" in the sweep.

Run strict, it found two real defects, both the same shape (a small control
abutting a large tappable card, so a near-miss opens the card): `"See all"` at
39×17 and `"+N more side quests"` at 91×16.

⚠️ **State pixel floors in `px`, not `rem`.** SC 2.5.8 is specified in CSS
pixels. `py-1` was tried first and measured **23px** at `laptop-720`, where
`--font-base` drops to 15px and every rem shrinks with it — a rem-sized fix
that stops working at the viewport that needs it.

---

## 4. Type floor

`src/index.css` § "MOBILE TYPE FLOOR" clamps hand-tuned sub-12px text up on
touch surfaces. Two properties matter and both are guarded by
`src/shared/styles/mobileTypeFloor.test.ts`:

- **In `rem`,** so the accessibility font-size control reaches it. It was `px`,
  and px ignores the root scaling ThemeContext applies — at 1.5× the median
  text went 13px → 18px while the minimum stayed at exactly 12px.
- **Scoped to `(max-width: 1023.98px), (pointer: coarse)`.** The iPad ships
  (`TARGETED_DEVICE_FAMILY = "1,2"`) and a width bound alone cannot describe a
  tablet — an iPad Pro in landscape is 1366px. The width arm is also what keeps
  headless Chromium inside the query, since it reports `pointer: fine` unless a
  context sets `hasTouch`.

Fine-pointer desktop above 1024px is deliberately **not** floored: 644 elements
change, which is a design decision about the dense table/signage language, not
an accessibility fix.

There is no external authority to appeal to here. WCAG sets **no** minimum font
size — it regulates scaling (1.4.4 resize to 200%, 1.4.10 reflow) and contrast.
12px comes from the platform type scales, which bottom out at 11pt (iOS Dynamic
Type Caption 2) and 11sp (Material 3 Label Small), both reserved for metadata,
with body text defaulting to 17pt/16sp.

---

## 5. Running it

```bash
npx playwright test --project=mobile                    # everything
npx playwright test --project=mobile --grep "iphone-14-promax"
MOBILE_EXTENDED=1 npx playwright test --project=mobile  # + landscape
```

The project starts its own dev servers on 5273 (auth-bypassed) and 5274
(anonymous). **A previous run left running on those ports makes the next run
fail in ways that look like app bugs** — a stale server produced 23 spurious
"no interactive elements found" failures on 2026-08-09 before it was noticed.
`lsof -ti :5273 -ti :5274 | xargs kill` first if a run aborted.

---

## 6. What still needs a real device

The gate is Chromium. It cannot tell you about WebKit-vs-Blink rendering
differences, real font rasterisation, iOS Dynamic Type, touch/scroll feel, or
anything in the signing and install path. Playwright's own `webkit` build is
**not** iOS WKWebView and has no safe-area support either (the feature request
was closed unfixed).

Device recipe: `docs/handoff-device-vs-simulator-2026-08-08.md`.

---

## 7. Known gaps

Each one is a backlog record — that is the tracked copy, this is the reasoning.
`node scripts/backlog.mjs --id B094` for any of them.

- **`MOBILE_PUBLIC_ONLY=1` in `ci.yml`** means CI runs only `/get-started` and
  `/try` — 2 routes of 35, against 921 assertions locally. The authed matrix —
  every real surface — has never run in CI. That is the largest remaining hole
  in "this is our only thing for mobile," and it is newly cheap to close now
  that the full matrix is green. **B094.**
- **Landscape notch insets are not modelled.** `EXTENDED_VIEWPORTS` carries
  honest zeros for side insets rather than a guessed 59px on the wrong edge.
  **B095.**
- **Interaction coverage lives outside the gate.** The 22-step-type playthrough
  from the 2026-08-08 QA pass was scratch tooling; the gate asserts layout, not
  that a lesson can be completed. **B101.**
- **Deterministic per-step-type stage-fit coverage is owed.** The matrix has
  three lesson routes (`ja-m4-neo-1?step=1/6/8`), which is why step-type fit
  problems were invisible here; `/ja/learn/test-out/m11` was sampling them by
  accident and is now skipped for stage fit because its draw is random.
  **B093.** The residuals a deterministic sweep would surface, measured at
  375x667 after the short-viewport density block (§ 8):

  | step type | overflow | before § 8 | tracked as |
  |---|---|---|---|
  | conjugation_transform | 110px — structural, needs a container-sized rebuild | 112px | **B091** |
  | kanji_reading | 32px | 181px | B092 |
  | listening_build | 27px | 183px | B092 |
  | match_pairs | 19px | 55px | B092 |
  | dialogue_listen | 17px | 43px | B092 |
  | speaking | 6px | 48px | B092 |

  Everything else is 0. All twenty are 0 at 412x915 and 430x932. The "before"
  column is why `conjugation_transform` is filed separately: it is the one step
  type the density block did not move, which is what structural means here.

Outside the gate but found by the same pass and filed with it: haptics are a
silent no-op in WKWebView (**B096**), `/ja/qa`'s test-drive ids have rotted
(**B097**), the iOS status bar is unstyled and unverified (**B100**), and two
things that are Spencer's call rather than work — the short-phone dead zone
(**B098**) and the personal signing team in `project.pbxproj` (**B099**).

---

## 8. Device support target

**Optimise for devices under ~6 years old** (Spencer 2026-08-09). Older ones
getting "squished or small text or weird but functional views" is acceptable.

Encoded, not just written down: `routes.mjs` marks `android-small` (360x640, a
~2015 Android) `legacy: true`, and the stage-fit spec skips legacy viewports
with a visible reason. Functional checks — horizontal overflow, off-right-edge,
render errors, tap targets — still run there, because "functional" is still
required. Only comfort is waived.

`iphone-se` (375x667) is **not** legacy: the SE is still sold and is held to the
full standard. That is the viewport the fit residuals above are measured at.

Fit is otherwise a solved problem on the devices that matter — every step type
measures overflow=0 at 412x915 and 430x932.
