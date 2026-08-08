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

### The worse, older bug underneath it: the gate was measuring the public internet

Chasing the above turned up something the bypass had merely re-flavoured. Printing the FULL
landed URL rather than the pathname (the mistake that hid it — `openlingoapp.com/` and
`localhost/` share the pathname `/`) gives, with the bypass off:

```
/landing  ->  https://openlingoapp.com/
/about    ->  https://openlingoapp.com/
/login    ->  https://dev-txjdn01ew3dmaecy.us.auth0.com/authorize?client_id=…
/get-started -> http://localhost:5199/get-started
/try         -> http://localhost:5199/try
```

**Three of the five CI routes were asserting layout on live third-party origins over the
public internet.** None of them is a route in this app: the marketing pages moved to the
`lingo-landing` repo and are served from the apex while this app lives at `app.<domain>`
(`shared/config/marketing.ts`), so the SPA fallback serves `index.html`, the router matches
nothing, and `MarketingRedirect` leaves the origin. `/login` hands off to Auth0 on mount.

So the `w-[52rem]` element that turned this repo's CI red on 08-06 is **on the marketing
site**. No change here could ever have fixed it, and the gate's colour depended on a third
party being up and unchanged. (It is also not a visible break there: `document.scrollWidth`
stayed at the viewport width, so an ancestor clips it. Don't hand it to a UI pass.)

Same class as the stale-lesson-id trap this file already warns about, in the same
`routes.mjs`, and the third instance of "green while covering nothing" in two days.

### FIXED 2026-08-07

- **`PUBLIC_ROUTES` is now `/get-started` and `/try`** — the only two pages this app renders
  for a signed-out visitor. `/landing`, `/about` and `/login` removed.
- **A second dev server** on `MOBILE_PUBLIC_PORT` (5274) runs the same tree WITHOUT the
  bypass; `gotoSeeded` sends anonymous routes there and authed routes to the bypassed one.
  Two servers because `DEV_AUTH_BYPASS` is folded from `import.meta.env` at module load, so
  one server cannot serve both session states. A runtime override in `shared/auth/bypass.ts`
  was the alternative and was rejected: that module is the fence keeping the bypass out of
  web builds, and a test-only door in it is the kind of thing that later ships.
- **Three guards in `_seed.ts`**, so this class of failure asserts itself rather than relying
  on the route list being right:
  1. *off-origin* — any navigation that ends on another origin fails, naming it. This is the
     one that matters: it is true regardless of what `routes.mjs` claims.
  2. *auth-bounce* — an authed route landing on `/login` (stale storageState). Pre-existing.
  3. *signed-in-bounce* — a public route landing on `/home`, i.e. the bypass leaking back
     onto the anonymous server. The mirror of guard 2, and the direct check for the
     08-06 regression.

### CI still runs `MOBILE_PUBLIC_ONLY=1` — deliberately, for now

The obvious next move is to drop that flag so CI exercises the authed matrix too: the bypass
removed the `.auth/user.json` dependency that forced the public-only subset in the first
place. It is **not** done here because the authed routes now render and **fail immediately**.
Partial run, 2026-08-07, off-right-edge counts by route:

| Route | viewports failing |
|---|---|
| `/ja/shop` | 6 |
| `/settings` | 4 |
| `/ko/learn` | 3 |
| `/ja/learn/course` | 3 |

These are real overflows on real pages, uncovered until now because CI never ran them and
the local authed matrix was vacuous until 08-06. Flipping the flag today would red-wall every
push. Fix the routes first, then drop the flag — that ordering is the whole point of the
gate, and turning it on before the fixes would just get it turned back off.

⚠️ That run was cut short and taken against a tree with another session's uncommitted
lesson-UI edits in it, so treat the numbers as a floor and a worklist, not an inventory.
`/ja/shop`, `/settings` and `/ko/learn` are untouched by that work; the lesson routes are the
ones to re-measure.

### ⚠️ Still open: the `chromium-public` e2e project has the same disease

Not fixed here because it is a different project with a different question attached, and it
does not run in CI (`ci.yml` runs `test:mobile` only). But
`tests/e2e/landing.public.spec.ts` navigates to `/` and asserts a hero reading
"Stop forgetting" — copy that lives on the **marketing site**, not in this repo. Same for
the `@visual landing` snapshots in `visual-snapshots.public.spec.ts`.

Those specs are therefore testing `lingo-landing` through this repo's test runner. Someone
should decide whether they belong here at all; if they stay, they need the same off-origin
guard, and if they go, `lingo-landing` should get them.

## ⚠️ Known limitation

`/ja/learn/test-out/m11` and `/ja/learn/placement-test` render an **adaptive** item chosen at
runtime, so which step type gets measured varies between runs — coverage there is a lottery,
not a guarantee. Observed 3 or 4 passing tests across otherwise identical runs. It no longer
produces failures (5/5 green after the truncate fix), but do not read a green run as "every
test-out item fits". Seeding the adaptive engine from a fixed seed under test would fix it
properly.
