# The mobile gate was covering nothing on authed routes

**Date:** 2026-08-06 · **Status:** authed half FIXED and shipped (`af7a16fa`, on `main` 2026-08-07);
**public half now blind as a side effect of the same fix — see the 08-07 section below**

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

## ⚠️ The mobile commit and the N4 commit are atomic as a pair

They were split by authorship (2026-08-07), but the mobile commit does **not** pass its own
test suite in isolation: `stickyCta.test.ts` ships in the mobile commit while
`ConjugationTransformStepView` and `DialogueListenStepView` get their `primary-cta` opt-in
from the N4 commit. Checking out the mobile commit alone fails with

```
expected [ "ConjugationTransformStepView.tsx", "DialogueListenStepView.tsx" ] to deeply equal []
```

Verified in a worktree: 9,111 passed, 1 failed. Only 3 of those two files' 58 changed lines
are CTA-related, so moving them wholesale into the mobile commit would drag N4 logic across
and be a worse trade.

**Consequence: `git revert` of the N4 commit alone will fail this test.** The fix is to also
drop those two filenames from `NOT_STICKY`, or re-add the attribute. It fails loudly, so it
is discoverable — but it will not be obvious why.

## ⚠️ The same fix blinded the PUBLIC subset (found 2026-08-07)

`VITE_DEV_AUTH_BYPASS=true` made the authed routes render. It also makes the gate's browser a
**signed-in user on every route**, including the ones whose whole point is being logged out.
Measured on `6dc18d6c`, two dev servers side by side, 360×640:

| Route | bypass OFF (what CI measured through 08-06) | bypass ON (what the gate measures now) |
|---|---|---|
| `/landing` | lands `/`, 1 element off the right edge | lands **`/home`**, 0 |
| `/about` | lands `/`, 1 element off the right edge | lands **`/home`**, 0 |
| `/login` | lands `/authorize` (Auth0) | lands **`/home`**, 0 |
| `/get-started` | real page | real page |
| `/try` | real page | real page |

**3 of the 5 public routes now measure `/home`, three times, under three names.** The public
subset is the `mobile render gate (public subset)` CI step — the one that runs without
`.auth/user.json` — so it is the half that has no other safety net.

This is why our first green run followed two red ones on Trevor's commits: it did not fix the
overflow, it stopped rendering the page that had it.

**In CI the trade is pure loss.** `.github/workflows/ci.yml` sets `MOBILE_PUBLIC_ONLY: "1"` on
the `mobile-e2e` job, so CI runs the public subset and **nothing else** — the authed routes this
bypass was added to rescue never execute there. The authed win is local-only
(`npm run test:mobile`); the public loss is the part that gates every push. Net effect on `main`:
CI's mobile gate is 2 real routes and 3 copies of `/home`.

### `/landing` and `/about` are not routes in this app

Separate, older bug that the above hid. Neither path matches anything in `App.tsx`, and the
element the gate flagged (`pointer-events-none absolute left-1/2 h-[32rem] w-[52rem]
-translate-x-1/2`) exists nowhere in `src/`. They are **marketing-site paths** on
`openlingoapp.com`. The dev server's SPA fallback serves `index.html`, React Router matches
nothing, and the app lands wherever auth state sends it — `/` anonymous, `/home` bypassed. The
gate has never once rendered a landing page. Same class as the stale-lesson-id trap this file
already warns about, in the same `routes.mjs`.

The 832px element is real content on the anon root, but `document.scrollWidth` stayed **360** —
an ancestor clips it, so there is no horizontal scroll for a user. Element-level finding, not a
visible break. Don't hand it to a UI pass as a landing-page bug.

### The fix, when someone takes it

Public and authed routes need **different auth states**, which one `webServer` cannot provide.
Either run the public subset against a second, non-bypassed dev server, or drop the bypass for
public routes and accept `/login` → `/authorize`. Either way, first delete `/landing` and
`/about` from `PUBLIC_ROUTES` (`tests/mobile/routes.mjs`) or point them at `/` — asserting
against a fallback render under a route name that doesn't exist is worse than no assertion,
because it reads as coverage.

## ⚠️ Known limitation

`/ja/learn/test-out/m11` and `/ja/learn/placement-test` render an **adaptive** item chosen at
runtime, so which step type gets measured varies between runs — coverage there is a lottery,
not a guarantee. Observed 3 or 4 passing tests across otherwise identical runs. It no longer
produces failures (5/5 green after the truncate fix), but do not read a green run as "every
test-out item fits". Seeding the adaptive engine from a fixed seed under test would fix it
properly.
