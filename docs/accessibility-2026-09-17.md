# Accessibility — 2026-09-17 (project review, lane A2)

Scope per the review brief: tile interaction semantics (dnd-kit
`accessibility` wiring, `aria-label`, keyboard, a tap-add/remove live
region), an axe-core smoke gate, a Dynamic Type audit at the font slider's
140% ceiling, reduced-motion confirmation, and this doc. Facts taken as
given: broad ARIA use (390 files), a shared focus-trap hook, reduced motion
honoured at OS and app level (partially — see §4), an app-owned font slider
85–140% with `-webkit-text-size-adjust` locked, no VoiceOver verification
path, no axe, no ESLint at all; word tiles are `@dnd-kit/sortable` with
tap-to-place as the primary interaction and no `announcements`/
`screenReaderInstructions` wired; WAI-ARIA APG has no drag-reorder pattern.

Spencer's rule: change nothing that is barely beneficial, measure, small
things reach every user. Everything below is marked with what was actually
verified, not assumed.

---

## 1. What is now verified (landed this lane)

**Files:** `src/features/lesson/components/steps/SortableBuildTiles.tsx`,
`src/features/lesson/components/steps/SortableBuildTiles.a11y.test.tsx`,
`src/shared/i18n/locales/en.json`, `src/shared/i18n/locales/ko.json`.

- **dnd-kit `accessibility` wiring.** `DndContext` now carries
  `accessibility={{ announcements, screenReaderInstructions }}`.
  `screenReaderInstructions.draggable` explains the WHOLE interaction —
  tap to add/remove, Space+arrows to reorder — because this component's
  `DndContext` is the only hook this lane owns into dnd-kit's a11y surface;
  it cannot fire on the bank tiles themselves (they live in
  `BuildSentenceStepView.tsx`/`ListeningBuildStepView.tsx`, outside any
  `DndContext` — see §2 open item). `announcements` overrides dnd-kit's
  default drag-lifecycle strings with the same wording.
- **`aria-label` on every tray tile.** `"{{word}}, {{state}}, position
  {{position}} of {{total}}"` — e.g. `"ねこ, placed, position 1 of 2"` — on
  both the `ids.length < 2` branch (no `DndContext`) and the
  `useSortable`-wrapped branch. Verified: every tray tile is already a real
  `<button>` (`Tile.tsx`'s default `as`), so Tab reaches it with no extra
  wiring — confirmed via `tabIndex === 0` in the test, not assumed.
- **A `role="status"`/`aria-live="polite"` live region for tap add/remove.**
  Neither a bank tap (add) nor a tray tap (remove) is a dnd-kit drag event,
  so dnd-kit's own announcer never sees either. The region watches this
  component's own `ids`/`tiles` props (which change on EITHER tap,
  regardless of which file's `onClick` caused it) rather than needing a
  hook into the bank's handler. One disclosed edge case: the owning views
  only mount `SortableBuildTiles` once `placed.length > 0` (an empty tray
  renders a static hint instead), so the diff baseline starts at `[]` on
  every mount — correct for the common one-tap-at-a-time case, but a
  learner who resumes a step with 2+ tiles already placed gets one
  (slightly imprecise) "word added" announcement instead of silence. Not
  fixed — the alternative (silence on the very first, most common tap) is
  worse, and this needs either a session-persisted baseline or the parent
  view's cooperation to do better; noted for the lead.
- **Reduced motion, both toggles.** `prefersReducedMotion()` checked ONLY
  `window.matchMedia("(prefers-reduced-motion: reduce)")` before this lane
  — the in-app `[data-reduced-motion]` toggle (`SettingsContext` §
  accessibility) was silently ignored for `useSortable`'s `transition` and
  `DragOverlay`'s `dropAnimation`, both Web-Animations-API driven so
  `index.css`'s `[data-reduced-motion="true"] * { transition-duration:
  0.01ms !important }` rule (CSS-transitions only) can't reach them. Fixed
  to check `document.documentElement.dataset.reducedMotion === "true"`
  first, mirroring `Confetti.tsx`/`LessonIntro.tsx`'s existing convention
  exactly (same two-line check, not a new pattern). **Verification note:**
  a tap-only placement never produces dnd-kit's Web-Animations transition
  at all (`wasDragging` gates it — confirmed empirically, not from docs),
  so a DOM-level `.style.transition` assertion after a `fireEvent.click`
  would be vacuous in EITHER direction. The test instead exercises the
  exported `prefersReducedMotion()` predicate directly against both
  toggles — the actual logic this lane changed — and the fixed function is
  proven to matter by inspection: `useSortable({ id, transition:
  prefersReducedMotion() ? null : undefined })` and `dropAnimation={
  prefersReducedMotion() ? null : undefined}` are the two call sites, both
  already present, both now readable from the toggle.
- **Regression-classes check (before claiming done):** deliberately broke
  the `aria-label` wiring (removed the prop) and reran the suite — the
  "labels every tile once the sortable (DndContext) branch mounts" test
  failed with the exact diff expected (`expected null to be '...'`),
  confirming the test is load-bearing rather than vacuously green (C4).
  Restored, reran, 9/9 green.

**Not done, disclosed:** the task asked to confirm keyboard "Enter/Space
places it." What's actually true, read from the code: `useLessonKeyboard`
(`src/features/lesson/hooks/useLessonKeyboard.ts`) installs a
document-level `keydown` listener that calls `e.preventDefault()` on every
`Enter` regardless of focus target, before dispatching to `onEnter`
(check/continue) — this pre-empts a focused tile's native Enter-activates-
click behaviour, which is deliberate (the code comment in
`SortableBuildTiles.tsx` already documents it: "activation is SPACE ONLY").
So in practice **only Space places/removes a tile**; Enter is reserved
app-wide for check/continue. This is existing, intentional behaviour, not
something this lane changed — recorded here because the brief's phrasing
("Enter/Space places it") doesn't match what the app actually does, and the
gap should be closed by fixing the brief, not the code.

### Patch note for the lead (files this lane does not own)

`ListeningBuildStepView.tsx` and `BuildSentenceStepView.tsx` both render
BANK tiles with no `aria-label` (accessible name currently comes from the
button's visible children — the kana string, or for a kanji-fied tile a
`<ruby>` whose accessible name concatenates the base glyph and its `<rt>`
reading, which reads redundantly) and `aria-pressed={used}` but no position/
state text. The exact patch, mirroring what this lane did for tray tiles:

```tsx
aria-label={t(
  "lesson.build.a11y.bankTileLabel",
  "{{word}}, {{state}}, position {{position}} of {{total}}",
  { word: tile, state: used ? t("lesson.build.a11y.stateSpent", "used") : t("lesson.build.a11y.stateAvailable", "available"), position: i + 1, total: bankTiles.length },
)}
```

Reuses the `lesson.build.a11y.tileLabel`-shaped strings this lane already
added to `en.json`/`ko.json` (add `bankTileLabel`/`stateSpent`/
`stateAvailable` alongside them, same file, same shape). `ListeningBuildStepView.tsx` was mid-edit by another lane (P1b) during this
work — read, not touched, per the brief.

---

## 2. axe-core smoke gate

**Files:** `tests/e2e/axe.a11y.spec.ts`, `playwright.config.ts` (new `a11y`
project), `package.json`/`package-lock.json` (`@axe-core/playwright@4.13.0`
exact-pinned, `npm run test:a11y`).

**Why not `npm run test:mobile`:** that gate's `mobile` Playwright project
only matches `tests/mobile/*.mobile.spec.ts` (`playwright.config.ts`) — a
different directory AND suffix than `tests/e2e/*.public.spec.ts`. No amount
of tagging a `tests/e2e/` file makes `test:mobile` include it; this was
checked against the actual config, not assumed. A dedicated `a11y`
Playwright project was added instead (`testDir: "./tests/e2e"`, its own
`testMatch`), reusing the EXISTING dev-auth-bypass server
(`MOBILE_URL`/`MOBILE_PORT`, already started for the `mobile` project) so no
fourth `webServer` entry was needed. Run: `npm run test:a11y`.

**Auth/first-run state, found by probing the real app (not guessed):**
lesson-step routes render only under `VITE_DEV_AUTH_BYPASS=true`
(`RequireAuth` otherwise redirects); a fresh session then needs three
things seeded via `page.addInitScript` before it reflects steady-state
content, or axe scores first-run chrome instead of the named surface:
- `open-lingo-cookie-consent` localStorage (same key
  `visual-qa-capture.authed.spec.ts` already seeds, for the GDPR banner).
- `open-lingo-settings` → `{ learning: { ftueArcSeen: true } }` (skips the
  "What brings you to Japanese?" first-session arc, `FirstSessionArc.tsx`).
- `lingo_placement_dismissed_v2_ja` = `"1"` (skips the optional placement-
  test prompt over the learn map, `usePlacementDismissed.ts`).

**Routes used** (the MCQ/match_pairs routes were found by probing steps of
the SAME already-verified lesson id, `ja-m34-neo-7` — the brief's own
example route — rather than guessing a second lesson id; `ja-m3-1`, used
elsewhere in this suite for an authed test, returned an empty page under
this dev-bypass session):
- Learn map — `/ja/learn`
- `build_sentence` — `/ja/learn/lessons/ja-m34-neo-7?step=5` (brief's route)
- `multiple_choice` — `/ja/learn/lessons/ja-m34-neo-7?step=2` ("Pick the
  word for \"park\"")
- Settings — `/settings` (client-side `<Navigate to="/home" replace/>` that
  opens a `role="dialog"` modal — `SettingsOpenRoute.tsx` — not a page of
  its own)

**Result, run locally 2026-09-17 (`npm run test:a11y`): 4 failed, 0 passed
— all four failures are real axe violations, not harness bugs** (a first
pass had one: `build_sentence`'s tile locator matched an `aria-hidden`
ghost pre-sizer tile that's never visible by design — fixed to exclude
`[data-state="ghost"]`, re-verified).

| rule id | impact | routes (count) | example element | status |
|---|---|---|---|---|
| `nested-interactive` | **serious** | learn map (1) | `<svg role="img" aria-label="Course transit map">` (`TransitLearnPage.tsx:1508`) wraps multiple real `<g role="button" tabindex="0">` stations/quests and an `<a href>` — `role="img"` tells assistive tech the subtree is flat/non-interactive, so a screen-reader user may not be able to reach the map's stations at all | **FIXED lane A2b 2026-09-17** (470a8e2d) — `role="img"` → `role="group"`, same `aria-label`; decorative layers already carried `aria-hidden`. Pinned: `TransitLearnPage.test.tsx` |
| `heading-order` | moderate | learn map (1) | `<h3 class="...text-text-muted">` (heading level skips) — `LearnToolsRow.tsx`/`FlashcardsReviewStrip.tsx`/quest cards share this class, exact source not pinned further | **FIXED lane A2b 2026-09-17** (df7949c8) — one sr-only `<h2>` added to both `LearnSidebar` branches (not a re-level of the shared h3 components, which also render on Home/LearnPage with their own valid chains). Pinned: `LearnSidebar.a11y.test.tsx` |
| `landmark-unique` | moderate | learn map (1) | two `<aside>` landmarks (`role="complementary"`), neither labelled — `.tmc-rail > aside` and the fixed desktop rail | **FIXED lane A2b 2026-09-17** (df7949c8) — distinct `aria-label`s: `nav.sidebarLandmarkLabel` on `SidebarNav`'s aside, `learn.sidebarLabel` on `LearnSidebar`'s. Pinned: `LearnSidebar.a11y.test.tsx` |
| `page-has-heading-one` | moderate | build_sentence (1), MCQ (1) | `<html>` — no `<h1>` anywhere on a lesson-step page | **FIXED lane A2b 2026-09-17** (e98b9b66) — one shared sr-only `<h1>` in `LessonShell.tsx`, covering every surface built on it (lesson player, placement/test-out, grammar review, flashcard review) for free. Pinned: `LessonShell.test.tsx` |
| `region` | moderate | **all 4 routes** | `<a href="#main-content" class="sr-only ...">Skip to content</a>` not contained by a landmark | **FIXED lane A2b 2026-09-17** (9aa85375) — moved the skip link above `<SidebarNav/>` in `Layout.tsx` so it is document-order-first again; axe-core's own `region` rule exempts a skip link only when it precedes every other real page link (`_isSkipLink` in the installed axe-core bundle), and `SidebarNav`'s nav links previously won that race on every authed route |

All five: root-caused by reading the installed `axe-core` bundle's own rule
logic (`node_modules/axe-core/axe.js` — `findRegionlessElms`, `_isSkipLink`,
`nestedInteractiveMatches`), not guessed from the rule name. `npm run
test:a11y` is GREEN on all four routes as of 97bdc590 (2026-09-17) — see
§2a below. `BuildSentenceStepView`'s bank-tile `aria-label` gap (§1 "Not
done, disclosed", above) is also fixed as of this lap: see §2a.

### 2a. Lane A2b — fixes landed 2026-09-17

In addition to the five axe findings above, this lap also:
- Applied A2's §1 bank-tile `aria-label` patch to `BuildSentenceStepView.tsx`
  (fd7be84c) AND to `ListeningBuildStepView.tsx` (same commit) — P1b had
  since committed that file clean (`git log -1` → 25869e43, `git status`
  clean), so the brief's conditional applied.
- Wired `npm run test:a11y` into CI (97bdc590): `.github/workflows/ci.yml`'s
  `mobile-e2e` job now runs it right after `npm run test:mobile`, same job
  env, same dev-auth-bypass server — a regression on any of the five rules
  above now fails CI instead of shipping. The "wait until findings are
  fixed" condition A2 set is satisfied; `continue-on-error` was not needed
  since all four routes are clean.
- `npm run test:a11y` result (2026-09-17, re-run after all six fix commits):
  **4 passed, 0 failed** — `/ja/learn`, `build_sentence`
  (`ja-m34-neo-7?step=5`), `multiple_choice` (`ja-m34-neo-7?step=2`),
  `/settings` all report `violations: []`.

---

## 3. Dynamic Type audit — font slider ceiling (140%)

Real WebKit, 15 Pro Max simulator, `npm run sim:capture -- --font-scale
140`, per `mobile-ui-verify`. `--font-scale` accepts `140` directly (the
tool's own header comment documents the flag; checked, not assumed — the
slider's stated max in the brief and the flag's accepted value agree).

| route | clipped | wrapped | overflow px | notes |
|---|---|---|---|---|
| `build_sentence` (`ja-m34-neo-7?step=5`) | no | no | 1 (negligible; `stageOverReportPx` budget) | 15 tiles, all single-line, `PASS` |
| `multiple_choice` (`ja-m34-neo-7?step=2`, "Pick the word for \"park\"") | no | no | 1 | 4 options, single-line, `PASS` |
| `match_pairs` (`ja-m34-neo-7?step=17`) | no | no | 1 | 12 tiles (6 JA + 6 EN), single-line, `PASS` |
| learn map (`/ja/learn`) | not fully verified at 140% (unchanged) | — | — | sim-capture's tile probe finds nothing (no `[data-tile]` on this route — expected, not a defect). A2's 140% capture was obscured by a stray native permission dialog (`regression-classes` C11), still unrepeated. **Lane A2b 2026-09-17:** a fresh 100% capture (`capture-15-pro-max-100-ja-learn.png`) rendered clean, no dialog, no wrap/clip on the visible vertical (phone-shape) map — no code change was needed here (this route's `nested-interactive`/`landmark-unique`/`heading-order` fixes below are attribute-only and invisible in a screenshot); 140% still needs a re-shot by whoever owns the next sizing pass. |
| settings modal (`/settings`) | **FIXED lane A2b 2026-09-17** (ae972519) | now fades instead of clipping | n/a (attribute/CSS-gutter fix, not a sizing dial) | The "Accessibility" tab label was already reachable by touch-scroll (`overflow-x-auto`) — the actual bug was the trailing `w-6` (24px) edge-fade mask painting over real label glyphs because the container's own inline padding (`px-3` = 12px) was half the fade's width. Bumped to `px-6`/`scroll-px-6` (matches the fade at every font scale) and the fade now hides once there's nothing left to scroll to. Verified on-device: `capture-15-pro-max-100-settings.attempt3.png` (100%) and `capture-15-pro-max-140-settings.attempt3.png` (140%, `sim:capture`'s route-validation can't hold `/settings` — it's a client-redirect-to-modal, same harness quirk A2 hit; attempt screenshots used the same way A2's were). At 140% "Accessibility" now trails into a visible gradient fade rather than a hard edge-flush cut. `SettingsNav.tabStrip.test.tsx` pins the padding and the fade-hides-at-end behavior. |

Both real findings above are fixed as of this lap (lane A2b) — see the
commits cited in each row. The learn-map row's 140% gap is unchanged;
someone still needs to re-shoot it without the permission-dialog artifact.

---

## 4. Reduced motion

See §1 for the fix (`prefersReducedMotion()` now checks the in-app toggle
first) and its test coverage. Summary: **partial → fixed to full**, for the
one surface this lane owns. `index.css` already has both a universal
`[data-reduced-motion="true"] * { transition-duration: 0.01ms !important }`
rule and an OS-only `@media (prefers-reduced-motion: reduce)` block (the
`!important` universal rule already dominates the OS-only one where they'd
conflict) — neither reaches `SortableBuildTiles`'s Web-Animations-API-driven
`transition`/`dropAnimation`, which is exactly why the component carries its
own predicate rather than relying on CSS. No CSS file was touched (P1b owns
`src/index.css` right now); the fix is entirely the one predicate function.

---

## 5. VoiceOver manual smoke script (for Spencer, 5 steps)

No automated VoiceOver verification path exists (confirmed — this was on
the "facts established" list going in, and nothing found this lane changes
it: VoiceOver requires a physical or simulator run with the screen reader
actually speaking, which no CI/test harness here drives). This is a manual
script, ~3 minutes, on the 15 Pro Max simulator or a physical iPhone.

1. **Turn on VoiceOver** (Settings → Accessibility → VoiceOver, or triple-
   click the side button if configured) and open the app to a
   `build_sentence` step (e.g. any m34 lesson). **Expect:** swiping right
   lands on the prompt text first, then the word bank tiles in order, each
   announced as its word (e.g. "アメリカ, button") — not silence, not just
   "button."
2. **Double-tap a bank tile** to place it. **Expect:** VoiceOver announces
   something changed — via this lane's new live region, you should hear
   "___ added to the sentence, position 1 of N" shortly after the tap (it
   may lag slightly behind the tap sound; that's the live region's normal
   announce delay, not a bug).
3. **Swipe to the newly-placed tray tile.** **Expect:** the tile's name
   includes its word AND "placed, position 1 of N" — not just the bare
   word. The FIRST TIME you land on any placed tile in a session, VoiceOver
   should also read a longer instruction about double-tap-to-remove and
   Space-to-reorder (dnd-kit's `screenReaderInstructions`, read once via
   `aria-describedby`) — if you don't hear it, that's a real regression,
   not a false negative (this lane confirmed the underlying DOM wiring
   with a non-VoiceOver test; this step is what turns that DOM wiring into
   an actual verified experience).
4. **Double-tap the same tray tile again** to remove it. **Expect:**
   VoiceOver announces "___ removed from the sentence. N word(s) placed."
5. **Open Settings** (`/settings` or the in-app menu) and swipe through the
   General/Appearance/Accessibility tab row. **Expect (known defect, §3):**
   at the largest text size the "Accessibility" tab may be visually
   clipped, but VoiceOver reading order/names should still be correct even
   though the visible label is cut off — note whether that holds or whether
   VoiceOver ALSO garbles/truncates the name, since that would be a
   different, worse bug than the visual one already filed.

If any of steps 1–4 fail outright (tile is silent, or announces only
"button" with no word), that's a regression in code this lane touched —
flag it back to this lane specifically, not the general backlog.

---

## 6. Apple Accessibility Nutrition Label — honest answer today

Apple's per-app Accessibility Nutrition Label (App Store Connect) is a
self-declared per-feature Yes/Partially/No, backed by evidence Apple can
request. Answering honestly from what's ACTUALLY verified above, not from
what's plausible:

| feature | answer | evidence |
|---|---|---|
| **VoiceOver** | **No** (still cannot claim Yes or Partially) | **Updated lane A2b 2026-09-17:** the SERIOUS `nested-interactive` defect (map stations behind `role="img"`, likely unreachable by VoiceOver navigation) is FIXED (470a8e2d) — one of the two conditions this row named is now met. The other is not: zero automated VoiceOver runs exist anywhere in this repo, and §5's manual script is still unverified — nobody has run it as of this writing. Verdict stays **No** until §5 is actually run once with VoiceOver speaking; a fixed defect is not the same as a confirmed experience. |
| **Larger Text** | **Partially** | The app has its own 85–140% font slider (not a Dynamic Type passthrough — `-webkit-text-size-adjust` is locked, so this is a deliberate in-app scale, not OS Dynamic Type integration) and most surfaces held up clean at the 140% ceiling in this lane's measured sample (3 of 5 routes: build_sentence, MCQ, match_pairs — real WebKit, real device, `PASS`). **Updated lane A2b 2026-09-17:** the settings tab-bar defect is FIXED (ae972519, verified at both 100% and 140% on-device) — one of the two conditions this row named is now met. The other is not: the learn map's 140% ceiling behaviour is still unverified (still obscured by the same simulator permission-dialog artifact; a fresh 100% capture this lap was clean, but that is not the ceiling). "Partially," not "Yes," until the map route is actually seen at 140%. |
| **Reduced Motion** | **Yes**, for the surface this lane touched; **unverified elsewhere** | `SortableBuildTiles` now honours both `prefers-reduced-motion` and the in-app toggle (§1/§4, tested). This lane did not audit every OTHER animated surface in the app (toasts, confetti, page transitions, etc.) — `Confetti.tsx`/`LessonIntro.tsx` already follow the same dual-check pattern by inspection, but that's not the same as this lane having verified them. Say "Yes" for the tile-build surface specifically if Apple's form allows per-feature granularity; otherwise "Partially" for the whole app is the honest global answer. |
| **Sufficient Contrast** | **No basis to answer** | Nothing in this lane's scope measured contrast ratios anywhere. Not audited; do not guess a Yes. |

**Bottom line:** the honest label today is **VoiceOver: No, Larger Text:
Partially, Reduced Motion: Partially (Yes for build tiles), Sufficient
Contrast: not evaluated.** **Updated lane A2b 2026-09-17:** the map's
`nested-interactive` defect is fixed and `npm run test:a11y` is green and
wired into CI (§2/§2a) — the single highest-leverage next step toward
`VoiceOver: Yes` is now just actually running §5's manual script once with
VoiceOver speaking. Toward `Larger Text: Yes`, the remaining gap is a
140%-scale capture of the learn map without the simulator's permission-
dialog artifact in the way. Everything else in this doc is either already
fixed or already disclosed as unfixed-and-why.
