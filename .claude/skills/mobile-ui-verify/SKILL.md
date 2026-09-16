---
name: mobile-ui-verify
description: How to make a defensible claim about phone or tablet layout in Open Lingo. Read BEFORE measuring, changing, or reporting anything about tile sizing, font size, furigana, safe areas, stage fit, overflow, tap targets, or "does it fit on the phone". Covers which engine may produce which kind of claim, the one-command simulator harness, the accessibility font-scale rule, the sizing spec (floors need ceilings), the sibling surfaces every sizing change must be re-shot on, and the screenshot-harness gotchas that have been reported as bugs.
---

# Verifying mobile UI in Open Lingo

Twenty tile-sizing complaints, eighteen other-surface sizing complaints and
thirteen furigana complaints across 143 TestFlight items in 11 days — the
largest recurring cost in the project. Not because the fixes were wrong, but
because they were **measured on the wrong machine** and **dialled as fixed
pixels with no spec**. Analysis:
`docs/user-feedback/2026-09-15-recurring-complaints-rca.md` §2.1.

**The numbers live in one place: `docs/mobile-sizing-spec.md`.** This skill is
about *how to measure and claim*, not what the tokens are — don't restate its
tables here; read it.

---

## 1. Which engine may make which claim

| Engine | What it may prove | What it may NOT prove |
|---|---|---|
| Chromium — `npx playwright test --project=mobile`, or `node scripts/shot.mjs <path> --touch` at 430×932 | Layout **logic**: does the element mount, does the class apply, does the grid reflow, does the branch fire, is the DOM order right | **Any pixel number.** Any "it fits". Anything about safe areas, ruby geometry, font-scale behavior, or the visible stage height |
| Playwright's own WebKit build | Slightly closer. **Not a substitute for the simulator** — it agreed with Chromium on #159 and both were wrong; three 2026-09-15 misses (a wrap-only-on-device MCQ label, a clipped match grid, a kanji-reveal defect) all passed both Chromium and this WebKit build and only failed on-device | Same as Chromium — a device-rendering claim |
| **15 Pro Max / iPad Air simulator (real WebKit)** — `npm run sim:capture` (§2) | **Any claim about device rendering:** pixel numbers, fit, overflow, furigana geometry, font-scale behavior | Real safe-area chrome in landscape — the top-band item (#151) was not sim-verifiable |
| Spencer's device | Everything. It is the only authority | — |

A layout claim is verified only with **both** row 1 (or row 2) **and** row 3 —
neither alone is "measured" (spec §9).

**The evidence this is not paranoia:**
- Chromium reported the ruby box at **40.8px**; WebKit measures **46.7px**. Every
  furigana dial-in before 2026-09-15 was built on the 40.8.
- `env(safe-area-inset-*)` reads **0** in Playwright Chromium. `tests/mobile/_seed.ts`
  pushes insets over CDP precisely because of this — a real Dynamic Island overlap
  hid behind the zero.
- The device's usable lesson stage is **~200px shorter** than any emulated one, so
  `cqh`-driven sizes never shrink when they should. This is #157 and #161.
- b20, one pull: "**the emulator is lying to us about phone layout — three times**"
  (#156 wrap does not reproduce in Chromium *or* WebKit; #157 grid fits in both and
  clips on device; #161). #159 completes correctly in both and is cut in half on
  the device.

⚠️ **The committed mobile gate is Chromium.** Every project in
`playwright.config.ts` — `mobile` included — uses `devices["Desktop Chrome"]`.
There is **no WebKit project configured anywhere in this repo.** So
`npm run test:mobile` passing tells you the layout logic holds; it tells you
nothing about the device. Do not cite it as device verification.

---

## 2. The simulator run — one command

```bash
npm run sim:capture -- --route "<route>" --font-scale 100
npm run sim:capture -- --route "<route>" --font-scale 125
```

Boots the 15 Pro Max simulator if needed (`--viewport ipad-air` for the other
tier), reuses an already-running dev server on `:5399` or starts one, rebuilds
the `CAP_DEV_SERVER` app shell **only when it's missing or stale**, launches
the app at `--route` with the accessibility font-size slider pre-set to
`--font-scale` percent, waits for `src/shared/dev/simProbe.ts`'s probe to
report, prints a summary table, and writes
`artifacts/ux-loop/sim-capture/capture-<route-slug>-<scale>.{json,png}`.

Exits **non-zero** when the report shows a real defect: any tile wrapped or
clipped, the stage-over-report budget exceeded (default 40px), or Noto Sans JP
failed to load (downgrade to a warning with `--allow-fallback-font`).

Full flag list and field-by-field report contract: read the header comment in
`scripts/ux-loop/sim-capture.mjs`, or `docs/mobile-testing-setup-2026-08-06.md`
§ "Sim capture (2026-09-15)" for the worked example.

**`stageOverReportPx`** — the scroller's `clientHeight` minus its visible
rect (**not** viewport minus stage; that metric is being redefined in-flight
as of 2026-09-15 — recheck `simProbe.ts` before citing an exact figure). This
is the number behind the ~200px on-device over-report in §1.

**Run at both 100% and 125% font scale — never only the harness's default
state** (§8 below). A capture at the default settings is not what Spencer's
phone is ever in.

**Fallback only** — if the script itself is broken, the manual
safaridriver + `xcodebuild`/`simctl` recipe (three prereqs: dev server on
`:5399`, a booted 15 Pro Max simulator, `safaridriver -p 4444`) is written up
in `docs/mobile-testing-setup-2026-08-06.md`. Don't hand-roll it inline in a
report — follow that doc and say you fell back to it.

**Three surfaces, three different heights — say which one you measured.**
Safari in the simulator gives a ~430×775 viewport; the app's own WKWebView
(what `sim:capture` drives) gives ~840px; the device gives less than either.
A number without its surface is not a number.

---

## 3. Seed real learner state before you measure

A zero-state bypass user never renders the paths Spencer is looking at.

#117 — "every furigana reading vanished" — happened because `isMastered` reads
intervals alone, while test-out seeding writes mastered-length intervals with
`reps: 0`. His test-outs silenced every kanji tile at once. The Chromium harness
had never rendered the mastered branch, so nine dial-ins had been measured on a
tile shape no real learner sees.

Before measuring a tile: seed (or toggle) the mastered / test-out-seeded state and
measure **both** branches — reading shown and reading hidden. The
`.kanji-ruby .kana-helper` floor rule once out-specified the
`[data-visible=false]` collapse (both at specificity 0,2,0, the floor later in the
file) and left a 15px empty band nobody had looked at.

---

## 4. Changing a size

**The rule, the tokens, and the height chain are `docs/mobile-sizing-spec.md`
— read it before dialling anything; don't re-derive it here.** Four points
that aren't obvious from the spec's tables alone:

- **The fit rule (spec §3):** every tile shrinks the label toward
  `--tile-font-floor` (0.8× the tier's `--tile-font`) **before** it's allowed
  to wrap; only below the floor does it wrap. It then fills toward
  `--tile-font-ceiling` (1.25×) only against a **measured pixel stage
  height** — never `cqh`/`vh` alone (`cqh` over-reports on device by
  ~200px). Implementation: `src/features/lesson/components/tiles/tileFit.ts`
  — one measure-then-write pass per layout, quantized scale steps, FIT and
  FILL as one `--tile-fit-scale` multiplier. **Wired today only for the base
  build tile** — not match/option/MCQ tiles yet; don't assume parity when a
  screenshot shows one of those tiers.
- **Ground truth for a shipped value is `src/index.css`, not
  `docs/qa/tile-sizing.json`.** The JSON is stale (spec §2/§12: wrong
  `--tile-box-h`, a dead `--tile-big-scale` token, no `tabletPortrait`
  section at all). Dial a new token in
  `src/features/lesson/dev/tileSizingTokens.ts` / `/ja/qa/tiles` so Spencer
  can adjust it, but verify what actually shipped against `index.css`.
- **Never animate a property that alters ruby geometry** in the lesson stage —
  animate `transform` and `opacity` only. `visibility` (#12) and `clip-path`
  (#159) both produced WebKit repaint bugs where the element was in the right
  state and WKWebView simply did not paint it.
- Tap targets are **WCAG 2.2 SC 2.5.8 — 24×24 CSS px** (with the spacing
  exception), NOT 44pt, and must be floored **in px, not rem**: `--font-base`
  drops to 15px on short desktops, so a rem floor measures 23px (spec §5 —
  width has no equivalent floor yet, `--tile-box-w` is missing, tracked
  there, not fixed by this skill).
- Don't size step content with `dvh`/`vh` arithmetic outside the shell —
  `dvh` is sanctioned only at `FITTED_SHELL_HEIGHT`; inside it, size in
  `cqh` (spec §4). Raw `vh` inside the shell is a defect class, not a
  one-off — that is #158.
- **Duolingo scope:** take tile font sizing and alignment only — word
  positioning, equal tile height per row, centred word, horizontal breathing
  room. Never its colours or type faces. Keep our compactness and the 12px
  furigana floor. The "grey reading" follow-up is dropped; do not action it.

**Then re-shoot the siblings.** A shared component fixed on one surface is
failure class C3, and it is why #124 says "the fix didn't apply here". The tile
surfaces are:

`build_sentence` · `listening_build` · `match_pairs` · `particle_cloze` options ·
`dialogue_sim` tiles and options · `kanji_reveal` · the review/test-out renders of
all of the above · `LessonComplete` · `grammar_rule` / rule-reveal cards

`ListeningBuildStepView` still uses fixed literals where `BuildSentenceStepView`
has the dynamic `bigTiles`/`hugeBank`/`denseTileClass` system. Check parity before
you add a ninth knob.

---

## 5. Harness gotchas that have been reported as bugs

- **`?step=N` is 0-indexed.** Stated in three separate feedback docs because it
  keeps being misread. `?trace-gate=0` bypasses the trace gate.
- **Use `npm run dev`, never a bare `npx vite`** — `predev` runs
  `npm run content:emit`, so a manually started vite serves stale content JSON.
  `npm run sim:capture` manages its own dev server; this gotcha is for
  `scripts/shot.mjs`/`capture.mjs` use.
- **Auth:** `.auth/user.json` goes stale in days. Use
  `VITE_DEV_AUTH_BYPASS=true npm run dev` plus `--guest` on `scripts/shot.mjs`
  rather than fighting stale Auth0 tokens.
- **"Missing tile" is clipping until proven otherwise.** At 390×844 a 10+ tile
  bank (especially `listening_build`) hides behind the fixed CHECK bar. Re-shoot at
  ~500×1250 before believing a tile is absent.
- **`scripts/shot.mjs` has no dark-theme flag** and does not seed cookie consent.
  #77 was a desktop art item shot in the wrong theme by this tool. If you need
  dark, or a consent-free page, use `scripts/ux-loop/capture.mjs` (it seeds
  `open-lingo-cookie-consent`) or set the theme in localStorage yourself. Both are
  Chromium — §1 still applies.
- `SHOT_OUT=<path>` redirects the output so parallel shots don't clobber
  `/tmp/shot.png`. `--wait=3500` once Vite is warm. `--touch` for the
  coarse-pointer branches. `--click=<selector>` (repeatable) to dismiss a modal.
- **Crop before you read** (`sips -c`). Never read a full-page shot when a crop
  answers the question.
- **Run walkers serially.** Eight parallel Chromiums caused `grammar_rule`
  reading-gate timeouts that looked like defects.
- Vision misreads to distrust: furigana く read as "<", 来る read as 來る. Re-read
  the PNG yourself rather than trusting a summary of it.

---

## 6. What "verified" means in a report

Paste a table, not an adjective:

| engine | surface | viewport | font scale | element | before | after |
|---|---|---|---|---|---|---|
| WebKit (15PM sim, `sim:capture`) | app shell | 430×932 | 100% | `.build-tile-dense` word | 15px | 16.5px |

…plus the command that produced it. Then one line per sibling surface: re-shot /
inherited / N-A. Then, explicitly, what you did **not** verify — "unverified on
device" is a useful report; "fixed" is not.

Before claiming done, run the checks in `regression-classes` (C1, C2, C3, C11).

---

## 7. Known tooling gaps — say so rather than substituting Chromium

- **No WebKit project exists in `playwright.config.ts`**, so nothing on CI can
  catch a WebKit-only regression.
- `/ja/qa/tiles` exists with sliders, but nothing shoots every tile surface in
  one column on the simulator before a build — that is #137's actual ask;
  `sim:capture` covers one route per run, not a full-surface sweep.
- `sim-capture.mjs`'s staleness check compares `capacitor.config.json`'s
  `server.url` and whether the bundle is installed — it does not fingerprint
  the JS bundle itself, so a content change with no `cap sync` in between can
  serve stale JS. Re-run `npx cap sync ios` by hand if a capture looks like
  it's showing old content.
- Appium's XCUITest driver is the only tool that attaches to the app's own
  WKWebView directly (needs `isInspectable = true` + a WebDriverAgent boot);
  not wired into this repo's tooling — `sim:capture`'s fetch-report channel is
  the substitute in use today.

---

## 8. The accessibility font-scale rule

Tile type is expressed in **em of `--tile-font`**, so the accessibility
font-size slider (**85%–140%, 5% steps**) scales every tile type uniformly.
`px`-denominated tokens (box floors, gaps) do **not** track the slider by
design — mixing a `rem` value into the tile system is what decoupled type
from boxes in the first place (spec §8).

**Verify at both 100% and 125%** — not only the harness default. §156's wrap
only reproduced at 125%; Chromium and Playwright WebKit both missed it at
either scale because the missing variable was the root-font multiplier, not
the viewport. `sim:capture --font-scale 100|125` is how you set it (§2); don't
hand-toggle the setting and hope the capture matches.
