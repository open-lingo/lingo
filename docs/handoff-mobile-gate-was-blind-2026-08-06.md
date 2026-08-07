# The mobile gate was covering nothing on authed routes

**Date:** 2026-08-06 · **Status:** FIXED (uncommitted)

## What was wrong

`npm run test:mobile` ran green while asserting **nothing** about any lesson surface.

`.auth/user.json` held **0 cookies and no `@@auth0spajs@@` token**. Its localStorage names
`dev|user-1` — the DEV_AUTH_BYPASS identity — so the file had been captured from a
bypassed dev session and never carried an Auth0 token at all. Every authed route therefore
failed `RequireAuth`, left for the marketing origin, and every geometry assertion ran
against a blank page or skipped.

Measured: the new `stage-fit` spec reported **273 skipped, 0 assertions** before the fix,
and **27 passed + 1 real failure** after.

This is the same "green while covering nothing" pathology already noted in
`tests/mobile/routes.mjs` about stale lesson ids. It has now bitten twice.

## The fix

`playwright.config.ts` — the mobile gate's own dev server now runs with
`VITE_DEV_AUTH_BYPASS=true`.

A **layout** gate has no business depending on a hand-captured Auth0 session that expires:
it makes coverage silently decay to zero and puts a re-capture chore on every machine. The
bypass is dev-server-only (`import.meta.env.DEV`), so it cannot reach a build.

## What it immediately caught

**`PlacementProgressBar` — 19px stage overflow at 360×640.** The test-out header label
interpolates a module title of arbitrary length into an unconstrained `<span>`. "Test out ·
Time I and the plain past" wrapped to two lines, took ~19px out of a **fixed-height** shell,
and clipped the Check button. Fixed with `min-w-0 truncate` + `shrink-0` on the counter.
A header inside a fixed shell must have a height that does not depend on its content.

**`navigator.vibrate` console errors.** Chromium refuses `navigator.vibrate` until the frame
has been tapped and logs it as `console.error`; lesson steps fire haptics on mount, so any
automated run trips it. Added to the `render-errors` ignore list — it is a property of
driving the app without a gesture, not a defect. It only surfaced now because the gate had
never actually rendered a lesson before.

## Also closed

- `data-testid="primary-cta"` added to `listening_comprehension`, `speaking`, `translate`.
  These were three of the four step types the `cta-fold` gate was structurally blind on, and
  the attribute is also the opt-in for the sticky action bar — so they had neither the
  behaviour nor the check. `stickyCta.test.ts`'s ratchet list shrank by three.
- ⚠️ **`grammar_rule` was deliberately NOT given the attribute.** It is a read gate; floating
  its CTA to the bottom edge would let a learner continue without scrolling the card and
  would drag `ReadGateBar` along with it. I added it, and `stickyCta.test.ts` caught the
  mistake — that ratchet is doing real work. Don't repeat it.
- `PlacementTestPage` now sets the same `stageProps` the lesson player does, so gate
  failures on that surface name their step type instead of reporting "unknown".

## New gate: `tests/mobile/stage-fit.mobile.spec.ts`

Research §6 assertion 5 ("no unintended vertical scroll on fixed-shell surfaces"), which was
marked N/A because the fixed shell didn't exist yet. Measures
`scrollHeight - clientHeight` of the stage **scroller** (the stage's parent — measuring the
stage itself reports 0 and passes vacuously), plus window-level scroll. Allow-list is
`grammar_rule` only.

This is the check that would have caught the 204px `word_image_mcq` overflow on its own.

## ⚠️ Known limitation

`/ja/learn/test-out/m11` and `/ja/learn/placement-test` render an **adaptive** item chosen at
runtime, so which step type gets measured varies between runs — coverage there is a lottery,
not a guarantee. Observed 3 or 4 passing tests across otherwise identical runs. It no longer
produces failures (5/5 green after the truncate fix), but do not read a green run as "every
test-out item fits". Seeding the adaptive engine from a fixed seed under test would fix it
properly.
