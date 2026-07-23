# Mobile scaling + RN-readiness — handoff

**Branch:** `mobile-scaling-cleanup` (pushed; **not** merged to `main` — review first)
**Base:** `main` @ the batchim-lesson commit · **Diff:** 98 files, +1982/−452 · 6 commits
**Companion docs:** [`mobile-research-2026-07-20.md`](./mobile-research-2026-07-20.md) (the full audit + 24-item worklist + RN path).

Do all review/runs from the isolated worktree `lingo-mobile` (or check out the branch normally). Your `main` checkout on `:5173` was never touched.

---

## What shipped (commit by commit)

| commit | what |
|---|---|
| `docs(mobile): research…` | Read-only audit → research doc + prioritized worklist. |
| `feat(mobile): foundation` | **W1** color tokens hex → RGB channel triples (fixes a **live bug**: 533 `bg-x/10`-style alpha-on-token styles across 164 files were compiling to *no CSS* and rendering transparent — now they render, and tokens are RN-numeric). **W2** one breakpoint source feeding both Tailwind + `useViewport`; SSR default corrected. **W11** `viewport-fit=cover` + `*-safe` utilities on header/menu/pill. |
| `feat(mobile): per-surface scaling fixes` | **W10/W14** lesson steps: `dvh`/`vw` math → container units (`cqh`/`cqw`), CTA kept in-fold, ghost-sizing preserved. **W4** `<ResponsiveTable>` primitive (clipping admin tables + CheatSheet now scroll). **W12** Settings horizontal tab nav on mobile. **W15** popover edge-clamp. **W16** shrink/stack fixed-width flex panes. **W8** grid-cols-1 collapses. **W13** conjugation sticky-bar padding. **W18** `100vh`→`dvh`. Flashcard grade grid 4-col→2×4. |
| `test(mobile): render pipeline` | Headless Playwright mobile matrix (5 device viewports) + DOM-geometry assertions (overflow / off-right-edge / tap-target / CTA-in-fold / render-error) + `test:mobile*` scripts + CI job with an always-green public subset. |
| `fix(mobile): review findings` | Fixes from the 5-lens adversarial review — incl. two majors: the ThemeEditorPanel live-preview write-path (W1 miss) and pipeline **false-green** guards (auth-bounce detection, hidden-CTA, single-source routes). |
| `feat(mobile-test): portable-auth + configurable port` | Pipeline runs on its own `MOBILE_PORT` (default 5273), never touching your `:5173`; an E2E-gated Auth0 localStorage cache makes a captured session port-portable (prod build unchanged — Vite DCEs the branch). |

---

## Verification status

- **`tsc --noEmit`**: clean. **`npm run build`**: succeeds. Built CSS confirmed emitting the previously-missing alpha rules (`.bg-accent\/10{…rgb(var(--color-accent) / .1)}`).
- **Unit tests**: pass across all touched areas. ⚠️ The only failures are **pre-existing on `main`** — `srsSync.test.ts` + `grammarSync.test.ts` (flashcards *engine*, untouched by this branch) fail identically in the clean `main` checkout (fake-timers/hook-timeout). They came in with the other session's commit `fa664523`; **worth a look independent of this branch.**
- **Render matrix (authed, real content, on :5273)**: across every run, **zero overflow / render-error failures** on any surface at any of the 5 viewports (360/375/412/430/768). Runs time out on the *tail* purely from WSL screenshot slowness (~3.5s/shot), never on a failure.
- **Visually confirmed at 360px** (authed): Settings mobile tab nav (W12), conjugation trainer (W13), lesson steps, home shell, and the W1 tint fix (get-started language cards now show their tinted backgrounds that were transparent before). Screenshots are in the worktree under `mobile-shots/` (gitignored).

**Backend note:** validation ran without the `:8000` API, so data-driven pages show loading skeletons — layout/overflow is fully exercised, but if you want to eyeball populated states, run with the backend up.

---

## Running the pipeline (no need to stop your dev server)

```bash
# one-time: capture a port-portable login (needs :5173 free for ~1 min, the only Auth0-allowed origin)
npm run auth:capture                # headed; log in once → writes portable .auth/user.json

# then, anytime — runs on MOBILE_PORT (default 5273), its own server, :5173 untouched:
npm run test:mobile                 # the assertion gate (Playwright specs)
npm run test:mobile:shots           # visual sweep → screenshots + overflow PASS/FAIL
MOBILE_PORT=6000 npm run test:mobile # override the port
```

CI (`.github/workflows/ci.yml`) runs the public-route subset as an always-green gate; the authed matrix needs the storageState (refresh with `auth:capture` when it expires — the pipeline now **fails loudly** on a stale token instead of passing vacuously).

**One thing to eyeball:** the conjugation sticky bar (W13) — at 360px the reserved padding looks right, but the locked-state "Unlocks at Module N" pill sits close to the last tile row; confirm it fully clears once a test account has unlocked modules.

---

## Not built — deliberately deferred (documented, your call)

These are in the worklist but are architectural/risky enough that I did **not** land them unreviewed:

- **W3** consolidate the two modal systems into one `<Modal presentation="auto|sheet|center">` (~90 sites; high-leverage, needs care).
- **W5** responsive primitive layer (`Stack`/`Row`/`Grid`/`Text`) so layout lives in JS (testable + RN-swappable).
- **W6/W7** RN-convert the top-5 primitives (Icon/Card/Button/EmptyState/Badge) — the actual NativeWind port.
- **W17** platform-seam interfaces (`Storage`/router/`AudioPlayer`/`SpeechRecognizer`/`StrokeRenderer`).
- **W19** typography sweep (`text-[Npx]`→rem, ban sub-11px), **W20** popover/dropdown→sheet on mobile, **W21** split `LessonPage`/`TransitLearnPage` god files, **W22** one reduced-motion source, **W23/W24** cleanups.

## React Native path (from research §7)

Direction: **NativeWind v4** (only option that keeps the 6.5k className strings + primitive layer on both platforms). **W1 is the prerequisite and is done** — tokens are now RN-numeric. Next: platform-seam interfaces (W17) → NativeWind + `View`/`Text`/`Pressable` shim → port Tier-1 primitives (Badge→Card→Button→Icon). Audio/speech/canvas/stroke stay web-locked behind interfaces. Full sequencing in the research doc.

---

## TL;DR for review
1. Check out `mobile-scaling-cleanup`; skim this doc + `mobile-research-2026-07-20.md`.
2. `npm run auth:capture` once, then `npm run test:mobile:shots` — eyeball `mobile-shots/` with the backend up.
3. The W1 token change touches 41 files (mechanical `var(--color-*)`→`rgb(var(--color-*))` wraps) — that's the biggest-blast-radius diff; it's the live-bug fix.
4. Merge when happy. The deferred W-items above are the natural next branch.
