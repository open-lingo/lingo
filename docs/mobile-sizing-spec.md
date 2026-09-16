# Mobile sizing spec — the current spec

**Status:** LIVE, 2026-09-15. This is the single current authority for tile
sizing, stage-height, and the measurement protocol for any phone/tablet
sizing claim. It supersedes the doc/CLAUDE.md statements listed in §8 —
those files still exist for history, are marked in place (see §8), and are
not deleted.

Built from a read-only doc-alignment audit
(`docs/handoff-2026-09-11-mobile-qa.md`-adjacent scratchpad, 155 statements /
10 contradictions / 6 supersessions / 9 orphans / 2 ghosts) and a
best-practice research pass, both dated 2026-09-15. Ground truth for every
value below is `src/index.css`, per `tileSizingTokens.ts`'s own stated
authority order (`src/features/lesson/dev/tileSizingTokens.ts:1-9`) — **not**
`docs/qa/tile-sizing.json`, which is self-documented as stale (see §2's last
row and §9).

Founder's rule (`docs/spencer-product-sentiment.md` Topic 1, binding): his
hand-dialled values ARE the values. Nothing below restates a number as a
"recommendation" — every number is either what's shipped in `index.css` or a
standards citation offered as headroom, explicitly marked as such.

---

## 1. Tiers

The tile-token system (fonts/boxes/gaps for build/match/option/MCQ tiles)
has **three** tiers, each one `:root` block in `src/index.css`:

| tier | media query | `src/index.css` | what it is |
|---|---|---|---|
| `base` | none (default `:root`) | `:129-191` | phone, <640px. Source of truth — every other tier scales off it. |
| `sm` | `@media (min-width: 640px)` | `:193-289` | desktop **and** landscape iPad — iPad-in-landscape mirrors desktop by product direction (`docs/ipad-scoping-2026-09-15.md` §2, `tileSizingTokens.ts:27-34`). |
| `tabletPortrait` | `@media (min-width: 640px) and (orientation: portrait) and (pointer: coarse)` | `:291-339` | portrait iPad (mini–13") and Split View panes. "The roomiest iteration of mobile" (Spencer) — scaled off `base`, NOT off `sm`. Must sit AFTER the `sm` block in source order: media queries add no specificity, so 640–1023px portrait matches both blocks and the later one in the cascade wins. Moving this block above `sm` silently reverts a portrait iPad to desktop tokens with no visible error. |

There is a **fourth, separate tier** for layout (not tile tokens):
`landscapeLg` = `(min-width: 1024px) and (orientation: landscape)`
(`src/shared/hooks/breakpoints.ts:36-40`, `src/shared/platform/formFactor.ts:52`).
It gates the sidebar-vs-hamburger nav and a `--tap-bump` tap-target increase
(`src/index.css:372-403`) plus two per-view #147/#148 overrides — it does
**not** redefine the tile-font/box tokens above; those come from the `sm`
block, unchanged. Don't confuse "landscapeLg the nav/tap-bump gate" with "sm
the tile-token tier that landscape iPad also reads" — they're two different
media queries that happen to overlap on a landscape iPad.

---

## 2. Token table per tier — CURRENT VALUES

Every value below is transcribed from `src/index.css` at the cited lines,
2026-09-15. Where `docs/qa/tile-sizing.json` disagrees, the JSON value is
shown struck through with the field name — the JSON is not ground truth; see
§9 for the exact fields that need a fresh Save.

| token | base (`:135-190`) | sm (`:200-243`) | tabletPortrait (`:293-334`) | JSON disagreement |
|---|---|---|---|---|
| `--tile-h` | 20px | 61px | 25px | — |
| `--tile-font` | 18.3px | 20.4px | 21px | — |
| `--tile-font-floor` | 14.6px (0.8×) | 16.3px (0.8×) | 16.8px (0.8×) | — |
| `--tile-font-ceiling` | 22.9px (1.25×) | 25.5px (1.25×) | 26.3px (1.25×) | — |
| `--tile-kana-font` | 1.28em | 1.2em | 1.28em | — |
| `--ruby-font` | 0.62em | 0.55em | 0.62em | — |
| `--ruby-floor-romaji` | 0.75rem | 0.75rem | 0.75rem | — |
| `--ruby-floor-kanji` | 0.75rem | 0.625rem | 0.75rem | — |
| `--tile-px` | 5px | 14px | 6.25px | — |
| `--tile-py` | 3.75px | 7px | 4.75px | — |
| `--tile-gap` | 5.5px | 10px | 7px | — |
| `--tile-tray-gap` | 8px | 10px | 10px | — |
| `--tile-box-h` | **45px** | **51px** | **50.5px** | JSON: mobile `32px` (`tile-sizing.json:8`), desktop `0px` (`:54`) — both stale (contradiction #5 in the audit) |
| `--listen-bank-gap` | 7px | 12px | 9px | — |
| `--listen-tray-min-h` | 54px | 68px | (not redefined; inherits `sm`) | — |
| `--match-tile-h` | 5.25rem | 4.75rem | 6rem | — |
| `--match-gap` | 0.5rem | 0.5rem | 0.625rem | — |
| `--match-font-scale` | 0.91 | 1 | 1.05 | — |
| `--match-px` | 1rem | 1rem | 1.25rem | — |
| `--match-py` | 0.4375rem | 0.375rem | 0.5625rem | — |
| `--match-radius` | 1rem | 0.75rem | 1rem | — |
| `--mcq-font` | 1.25rem | (`--option-font` group instead) | 1.4375rem | — |
| `--mcq-py` | 1.5rem | " | 1.875rem | — |
| `--option-px` (`:1287-1292`, `:1298-1301`, `:1316-1321`) | 0.4375rem | 1rem | 0.5625rem | — |
| `--option-py` | 1.25rem | = `--mcq-py` | 1.5625rem | — |
| `--option-font` | 1.375rem | = `--mcq-font` | 1.5625rem | — |
| `--option-radius` | 0.75rem | 0.75rem | 0.75rem | — |
| `--option-gap` | 0.875rem | 1rem | 1.125rem | — |
| `--card-pad` | 1.25rem | (not redefined) | 1.5625rem | — |
| `--card-max-h` | 85vh (`:1293`) | (not redefined) | 85vh (`:1322`) | still `vh`, see §4 |
| `--tile-big-scale` | **ghost — does not exist in CSS** | — | — | JSON still lists it (`:21,65,108,154`, mobile 0.5 / desktop 1) — dead since b16.3, replaced by `--big-font/px/py-scale` (`index.css:105`, comment) |

`--big-font-scale`/`--big-px-scale`/`--big-py-scale`, `--huge-font-scale`/`--huge-py-scale`,
and `--listen-font-scale`/`--listen-px-scale`/`--listen-py-scale`/`--listen-bank-py-scale`
are unitless ratios over the plain tile (see `index.css:135-190` comments for
their derivations) — carried in the JSON too, and current per its `_note`.

---

## 3. The fit rule (THE TEXT RULE — TestFlight #152/#156/#157b)

Spencer: *"Text wrap is so ugly here, shrinking the font size floor is
preferred and we can fill up to a certain size."*

- Every tile shrinks the label toward `--tile-font-floor` **before** it is
  allowed to wrap. Below the floor, and only below the floor, wrapping is
  permitted.
- A tile fills toward `--tile-font-ceiling` only against a **measured pixel
  stage height** — never against `cqh`/`vh` alone (see §4 item 3: the
  suspected ~200px on-device `cqh` over-report; a ceiling computed off a
  container-query height would grow tiles into space that doesn't exist on
  the phone). Shipped 2026-09-15 as `tileFit.ts` FIT/FILL: the px budget is
  `--stage-h` if published, else `visualViewport.height` minus the shell's
  bottom safe-area; `scrollHeight` is an overflow detector only.
- Today this is wired for the base build tile only (`tileFit.ts`, the
  `hugsContent`/measure-and-scale pattern — `white-space: nowrap` + a `Range`
  bounding-box measurement, not canvas `measureText` or a CSS-only `cqi`
  clamp, because ruby and Latin glosses need real layout measurement). It is
  **not yet wired into match/option/mcq tiles** — generalizing it is
  proposed, not built, and has zero test coverage of the floor/ceiling
  values or the 0.8×/1.25× derivation (orphan, audit §4.6).
- CJK-specific: tiles must use `white-space: nowrap` (what `tileFit.ts` sets)
  or `word-break: keep-all`, never rely on `overflow-wrap` — CJK breaks
  between any two characters by default, so there is no "unbreakable string"
  for `overflow-wrap` to protect, and a Japanese label wraps mid-word
  (ばんごは / ん) without one of those two declarations.

---

## 4. The height chain rule — ONE chain, not three

1. **Shell level — the only sanctioned `dvh` use.** `FITTED_SHELL_HEIGHT`
   (`src/shared/layout/fittedShell.ts:21-22`) —
   `h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]`. This is the
   shared height primitive for `LessonShell` and (below `md`) `ReviewShell`.
2. **Inside the shell — `cqh`, never raw `vh`/`dvh`.** `LessonShell`'s
   scroller sets `[container-type:size]` (`LessonShell.tsx:~135,141`); every
   size inside reads `cqh` against that container: `--stage-tail: 10cqh` /
   `5cqh` under a short viewport (`index.css:925,996`), the match-grid clamps
   (`index.css:1479-1580`ish, "8+ `clamp()` rules... `cqh` appears in all 8
   match-tier selectors" per `BuildSentenceStepView.tileTokens.test.tsx`).
   `cqh` is confirmed **live and correct as a rule**, not a ghost — the
   brief's suspicion that it might be dead was checked and ruled out.
3. **SUSPECTED ROOT CAUSE (unconfirmed) — do not ship a new `cqh`-derived
   number until it is settled.** Hypothesis from the founder's device
   screenshots: the scroller's visible box measures ~200px shorter on-device
   than in Chromium or Playwright's WebKit, i.e. `cqh` over-reports there.
   2026-09-15 evidence AGAINST: `npm run sim:capture` on the 15 Pro Max
   simulator measured `stageOverReportPx` = 0 at both 100% and 125% font
   scale (step 11 build, step 16 MCQ); the tile-fit lane could not reproduce
   it either. The metric (scroller `clientHeight` − on-screen intersection)
   now ships so the hypothesis can be tested on the founder's phone. This is the shared root cause behind two of the three
   most recent WKWebView-only defects (a match grid clipped with 200px dead
   space below it; an MCQ label wrapping only on-device). Fix belongs in
   `LessonShell.tsx`'s `[container-type:size]` chain / `fittedShell.ts`, not
   in another per-view patch — out of scope for this doc (docs-only), noted
   here so it isn't lost.
4. **`--card-max-h: 85vh`** (`index.css:1293,1322`) is a known exception
   still in raw `vh`, consumed by `LessonOverlayCard.tsx`. Migrate it to the
   `cqh` chain or state explicitly why cards are exempt — currently neither
   has happened; it's live drift, not a decision.
5. **Any other per-view `vh`/`dvh` height that isn't `FITTED_SHELL_HEIGHT`
   itself is a defect class, not a one-off.** `LessonComplete.tsx`'s old
   `min-h-[60vh]` (fixed 2026-09-15, TestFlight #158, replaced with centering
   inside `FITTED_SHELL_HEIGHT`) is the template fix to reapply anywhere else
   a raw `vh`/`dvh` shows up in the lesson tree.

---

## 5. Touch floors

- **24×24 CSS px** — WCAG 2.2 SC 2.5.8 (AA), with the spacing exception, is
  the floor this app uses. **Not** 44pt/44px (Apple HIG / WCAG 2.1 AAA) —
  that's a deliberate, documented choice (`CLAUDE.md`), correct and
  defensible, restated here so it isn't re-litigated per surface.
- Floor in **px, not rem**: `--font-base` drops to 15px on short desktops
  (`index.css:48-52`), so a rem-denominated floor silently measures under
  24px there.
- **Gap not stated in ANY existing spec: `--tile-box-w`.** Height clears both
  44pt and 24px today (`--tile-box-h` 45/51/50.5px), but width does not have
  an equivalent floor — a single-kanji tile measures ~36.5px wide against
  ~105.7px for a 4-kana tile on the same row, which is WCAG-legal (36.5 >
  24) but reads as a mistake next to a wider tile (#119, "squat" tiles).
  Material's answer to the same problem is a **minimum width** on the chip
  with the label centred — that's the missing token to add, not a font
  change.
- `--tile-gap` is 5.5px on phones. That passes the WCAG spacing exception
  (36.5 + 5.5 = 42px between centres > 24px) but is below every published
  touch-target spacing recommendation (Material: "8dp of space or more"); a
  5.5px gap between two draggable tiles is a plausible contributor to
  mis-taps independent of any single tile being individually correct.

---

## 6. Ruby policy

- **Current shipped:** `--ruby-font: 0.62em` on phone/tabletPortrait, `0.55em`
  on `sm` (desktop/landscape iPad) — `index.css:149,205,298`.
- **Standard:** W3C Simple Ruby §3.1 — ruby text defaults to 50% of the base
  character size.
- **Spencer's #87 rule (binding, restated in `spencer-product-sentiment.md`
  Topic "Tiles and sizing"): "we didn't shrink the furigana small enough
  here and instead shrunk the other hiragana and kanji, needed to be the
  other way around" — never shrink the WORD to hold a box height; shrink the
  reading first.**
- There is headroom between the current 0.62em and the 0.50em standard —
  offered here as a citable number for the next furigana-vs-word tradeoff,
  not as a restated recommendation to change it. Spencer's own floors
  (`--ruby-floor-romaji`/`--ruby-floor-kanji`, both 0.75rem on phone) are the
  binding readability minimum and stay as-is regardless of the ratio.

---

## 7. Safe-area rule

`*-safe` Tailwind utilities (`max(env(safe-area-inset-*), fallback)`) apply
to every surface that renders without `Layout`'s header chrome — the lesson
player is the one surface that must opt in explicitly (it doesn't inherit
the header's safe-area handling for free). `viewport-fit=cover` is set at
`index.html:63`, required per WebKit's iPhone-X design note.

Chromium reports `env(safe-area-inset-*)` as `0` natively, so
`tests/mobile/_seed.ts` pushes real per-viewport insets over CDP. That
verifies the CSS wiring is correct. **It cannot verify WKWebView's full-bleed
behavior** — the class of bug where the utilities exist and are applied but
the header still sits under the Dynamic Island in practice on the actual
built bundle — that needs a device/simulator check per §10.

---

## 8. The accessibility font-scale rule

All tile type is expressed in **em of `--tile-font`**, one px value dialled
per tier, so the user's accessibility font-size slider (85%–140% at 5% steps,
`SettingsSectionPanel.tsx:339-341`, applied as
`root.style.fontSize = calc(var(--font-base) * scale)`,
`ThemeContext.tsx:233-238`) scales every tile type uniformly instead of
tokens drifting independently.

**Why this matters — the arithmetic behind it (from the best-practice
research pass):** the token registry mixes units — 12 px tokens, 16 rem
tokens, 2 em tokens, 10 unitless ratios, 1 `vh` token
(`tileSizingTokens.ts`). rem tokens track the font slider; **px tokens do
not.** At the slider's 140% end, `--option-font` (1.375rem) scales to 30.8px
and the MCQ `word` tier's literal 1.875rem scales to 42px, while `--tile-font`
stays a flat 18.3px and `--tile-box-h` stays a flat 45px — one lesson can
render a 42px MCQ word above an 18.3px build word in the same 45px box. No
single px value is correct for two different root font sizes; the fix is one
unit basis (em of `--tile-font`) for type, px for box floors, never rem
inside the tile system (rem is what decoupled type from boxes under the
slider in the first place).

**Standards note, offered as context, not a target:** Apple's own guidance
is to support enlarging text by at least 200%, and WCAG 1.4.4 requires text
resize to 200% without loss of content/functionality. This app's slider tops
out at 140% — worth knowing before claiming full accessibility-text support
in a store listing; not a change being made by this doc.

---

## 9. Measurement protocol — what counts as verified

A sizing claim is **verified only if BOTH** of the following are true. Either
one alone is not a measurement.

1. **`npx playwright test --project=mobile`** is green. This is the
   Chromium (`devices["Desktop Chrome"]`, DPR 1) DOM-geometry regression
   gate at 430×932 (`--touch` viewport) — necessary, and proven
   **insufficient alone**: three 2026-09-15 misses (a wrap-only-on-device
   MCQ label, a clipped match grid, a kanji-reveal defect) all passed both
   Chromium and Playwright's own WebKit build and only failed on-device —
   "Desktop WebKit ≠ WKWebView on iOS here." Use this gate for **layout
   logic** (dead-space budgets, safe-area wiring, structural regressions),
   never as sole proof of a device-rendering claim.
2. **Measured on the 15 Pro Max simulator (or a real device)** via
   `scripts/ux-loop/sim-capture.mjs` + `src/shared/dev/simProbe.ts`, at
   **both** font scale 100% and 125% — not the harness's default state,
   which is every setting at its default (no SRS state, no accessibility
   font scale), which is exactly the configuration Spencer's phone is never
   in. This is the memory rule `ios-simulator-sizing-harness` and the
   Spencer decision in `spencer-product-sentiment.md`: *"Measure on his
   phone, not Chromium. 15 Pro Max simulator, real WebKit, real SRS state."*
   Before capturing: dismiss the cookie banner; `?step` is **0-indexed**.

**Why the WebKit-desktop shortcut doesn't work:** Playwright's own docs say
its WebKit build tracks WebKit main, not shipping Safari, and driving the
simulator with `safaridriver` drives **Safari**, not the Capacitor WKWebView
— neither is a substitute for step 2. Appium's XCUITest driver is the only
tool that attaches to the app's own webview, and it needs
`isInspectable = true` plus a WebDriverAgent boot per run; not wired into
this repo's tooling today.

**What tooling exists today:** the harness in step 2 (`safaridriver -p 4444`
+ `sim15/wd.mjs` + `measure.mjs`, then the real Capacitor app shell via
`CAP_DEV_SERVER` + `cap sync` → `xcodebuild -sdk iphonesimulator` → `simctl
install/launch/screenshot`) is assembled fresh in the session scratchpad each
time it's needed — it is not a single committed command and is not in
`package.json`. Recipe today: `docs/handoff-2026-09-11-mobile-qa.md:183-186`.
Committing it as a reusable script is future work, not done by this doc.

**Recommended additions to the probe (not yet built — from the best-practice
pass, recorded here so the next sizing lap doesn't re-derive them):**
`rootFontPx`, `fontScale`, `notoLoaded` (`document.fonts.check('30px "Noto
Sans JP"')` — Noto Sans JP loads with `font-display: optional`, which on a
slow/cold load falls back to Hiragino Sans for the rest of the session,
changing ruby-band height and glyph widths from what any number here was
dialled against), and `emRatio` (a hidden 5-kana probe span's width ÷
`5 × rootFontPx` — exact for CJK, since every kana/kanji glyph is a 1em
advance).

---

## 10. History — the dial-in rounds

Traced via `git log`/`git show` because most of the five nicknamed rounds
are cited by hash or partial diff in feedback docs, never all together in
one place. Two of the five have **no Spencer-facing write-up anywhere** —
this table is that write-up.

| round | commit | date | documented elsewhere? |
|---|---|---|---|
| dial-in #1 (best match) | `3e1b7f07` | 2026-09-14 | Yes — `docs/user-feedback/2026-09-14-testflight-b12.md:33`, RCA §2.1 |
| dial-in #2 (best match, "second mobile dial-in") | `a8624814` | 2026-09-15 | Yes — `docs/user-feedback/2026-09-15-testflight-b20.md:281,283-288` |
| **equal rows** | `5e35c4d8` | 2026-09-15 | No — zero mentions in any b13/b14/b15/b18/b20/RCA doc; only inferable from the build-17 tag commit message. Recorded here for the first time. |
| desktop restatement | bundled in `a8624814` | 2026-09-15 | Partially — b20 covers only the mobile-facing side-effect (`--match-tile-h`), never this half on its own terms. `index.css:198-222`'s comment is the primary record: "the first dial-in had let mobile furigana sizes leak to desktop," restated desktop `sm` block in full. |
| **tablet tiers** | `1185c2c7` | 2026-09-15 | No — `docs/user-feedback/2026-09-15-testflight-b18.md` mentions "b18 iPad Phase B" once in passing and contains zero token values or a mention of this commit. Recorded here for the first time. Shipped the `tabletPortrait` block (§1) and the iPad form-factor plumbing. |

Five supersessions of the tile-sizing subsystem landed in one day
(2026-09-15): old one-row-per-tier CSS → single-dial base/sm
(`index.css:57-127`, b16, TestFlight #137) → dial-in #2 (`a8624814`) →
"equal rows + desktop pass" (`5e35c4d8`/`44000589`) → desktop `sm` restated
in full (`index.css:198-222`) → `tabletPortrait` added (`1185c2c7`,
`index.css:242-330`). None of that sequence was captured anywhere but the
running `docs/handoff-2026-09-11-mobile-qa.md` ledger (history, not a spec)
until this document.

---

## 11. Superseded by this spec

| file:line | what it claimed | superseded by |
|---|---|---|
| `CLAUDE.md:271-273` | `tests/mobile/` is "the only layout authority" | §9 — two-part bar (Chromium gate + simulator numbers); see §12 for the CLAUDE.md fix itself |
| `CLAUDE.md:283` | "Don't size step content with dvh arithmetic" (no shell exception stated) | §4 — shell/step distinction now explicit |
| `docs/mobile-ui-testing-2026-08-09.md:15-17` | "mobile UI correctness is asserted by `tests/mobile/`... The simulator... [is] not for layout" | §9 — the 2026-09-15 misses (#156/#157/#161) prove simulator/device measurement IS required for layout claims Chromium cannot see |
| `docs/mobile-ui-testing-2026-08-09.md:185-220` (§7 "known gaps", B094: CI runs `MOBILE_PUBLIC_ONLY=1`, 2 of 35 routes) | implicitly, by never being caveated in CLAUDE.md, reads as closed/minor | still open as of 2026-09-15; not fixed by this doc, flagged so it isn't lost again |
| `docs/mobile-research-2026-07-20.md` (whole doc; see its own superseded marker) | 44px tap-target floor as current; "no safe-area handling at all"; `dvh` banned without the shell exception | §5 (24px is current), §7 (safe-area shipped, with the caveat), §4 (shell dvh is the sanctioned exception) |
| `docs/qa/tile-sizing.json` (`--tile-box-h`, `--tile-big-scale`, and generally "predates this change... NOT re-verified", per its own `_note`) | current mobile/desktop token values | §2 — ground truth is `src/index.css`; see §12 for the regeneration list |
| `docs/spencer-product-sentiment.md` Topic 1 body | reads as live guidance without a pointer to where the numbers actually live today | this spec now holds the numbers; Topic 1 keeps the *why* (his own words) and is marked accordingly |
| `src/index.css:909,981` (code comments) | cite `CLAUDE.md § "Lesson UI stability rules"` | that section doesn't exist in current `CLAUDE.md` (ghost, audit §5.2) — out of scope for this docs-only pass (`src/**` excluded), flagged here so a future code lane fixes the two comments |

---

## 12. `docs/qa/tile-sizing.json` — fields that must be regenerated

The JSON must be re-saved from `/:lang/qa/tiles` against the current
`index.css` (all three tiers — the file has no `tabletPortrait` section at
all today). At minimum, these fields are confirmed stale by direct
comparison against §2's table:

- **`--tile-box-h`** — JSON: mobile 32px, desktop 0px. Shipped: base 45px,
  sm 51px, tabletPortrait 50.5px (not present in JSON).
- **`--tile-big-scale`** — present in JSON (mobile 0.5, desktop 1,
  `tile-sizing.json:21,65,108,154`); the token is **dead** in CSS (removed
  b16.3, replaced by `--big-font/px/py-scale`). Drop the key entirely.
- **`--listen-font-scale`** — JSON mobile value (1.030303) diverges from the
  file's own admitted drift note; re-verify against `index.css:187-190`
  (1.103825 on `base`).
- **Missing `tabletPortrait` section** — the JSON only has `mobile`/`desktop`
  top-level keys; needs a third section for the tier added 2026-09-15.
- **General:** the file's own `_note` (bottom of the JSON) states plainly
  that most fields "predate this change and [were] NOT re-verified against
  index.css's current shipped values" — treat every field as unverified
  until the next Save, not only the ones flagged above.

This file (`docs/qa/tile-sizing.json`) is explicitly out of scope for this
docs-only pass and was not edited — a separate tile-fit lane is already
editing it and the tokens live.
