# Test-out improvements — design (2026-07-15)

Three learner-facing changes to the module test-out flow (`src/features/placement/`),
from Spencer's direction. Test-outs run the adaptive engine over a single module
(`/ja/learn/test-out/:moduleId`, same for `/ko/...`).

## Goals

1. **Anti-memorization pool.** A test-out must NOT serve the same fixed set every
   attempt. Draw a randomized sample from the module's full gradable pool per
   attempt so a learner can't retry-and-memorize. Do NOT reveal correct answers.
2. **Korean test-outs are too short.** KO currently serves the 3-item-per-module
   `PLACEMENT_QUESTION_BANK` (`languageId:"ko"`) items; JA serves ~12 derived real
   lesson steps. Route KO through the same derivation so KO test-outs are ~12 too.
3. **Test out of module N ⇒ auto-complete every module before N, no credit.**
   Passing N's test-out marks m(<N) complete with 0 XP (no credit), seeds their
   vocab into SRS, and persists across devices.
4. **Result shows which items were wrong** — "just show that the answer was
   incorrect": a per-question ✓/✗ strip, no prompts, no correct answers. Shown on
   pass and fail.

## Non-goals

- No in-test answer suppression / "blind mode" across the ~20 step renderers.
  The varied pool is the anti-memorization mechanism (per Spencer). Step views
  behave as they do in lessons.
- Showing the learner's chosen wrong answer (would need to thread the picked
  answer through every step view). Out of scope.

## Current state (verified)

- `deriveModuleTestOut.ts` — `collectGradable` / `pickCovering` / `getDerivedTestOutItems`.
  `pickCovering` is **deliberately stable (no RNG)** — "same module always yields the
  same test-out." `getDerivedTestOutItems` memoizes per module. All hardcoded to `"ja"`
  (`getMockCourse("ja")`, `^ja-(m\d+)-(\d+)` section regex, `languageId:"ja"` config).
- `PlacementTestPage.tsx` — `itemsLookup` uses derivation only when `isTestOut && langId==="ja"`,
  else `getItemsForModule` (the 3-item bank). On done → `applyPlacementResult` +
  `syncTestOutToServer(progress, state.passedModules, langId)`.
- `adaptiveEngine.ts` — `computeOutcome` test-out branch returns `{verified:[passedModule], assumed:[]}`.
- `applyPlacement.ts` — already completes `passed` + `assumed` modules with `xpEarned:0`,
  seeds their vocab, auto-completes script modules (m1/m2) when a non-script passes.
  So "assumed" already = "complete, no credit, vocab seeded". KO config present.
- `syncTestOutToServer.ts` — builds `isTestOut:true` batch attempts (server gates XP);
  only passed `passedModules` today (assumed = local-only — known device-switch bug).
- KO ships full authored M1–M27 lessons (all imported in `mockLessons.ts`), so KO
  derivation yields real questions.

## Design

### 1 + 2 — varied pool, generalized to KO

`deriveModuleTestOut.ts`:
- Thread `languageId` through `collectGradable`, `sectionOf`, `deriveModuleTestOut`,
  `getDerivedTestOutItems` (default `"ja"`). `getMockCourse(lang)`; section regex
  `^${lang}-(m\d+)-(\d+)`; config `languageId: lang`.
- `pickCovering(items, size, rng?)`: `rng?: () => number`. **No rng ⇒ current stable
  behavior** (middle-of-section pick, deterministic — existing tests unchanged). **With
  rng** ⇒ Round 1 picks a random representative per section; fill rounds pick a random
  unused item (still preferring an unseen format); final order shuffled. Draws from the
  full gradable pool, so each seeded attempt is a different subset.
- `getDerivedTestOutItems(moduleId, languageId?, rng?)`: with `rng`, bypass the module
  cache and return a fresh randomized draw; without, keep the memoized stable set.
- Dev-only `console.warn` when a module's gradable pool `< 2 * TESTOUT_SIZE` (variation
  is weak — flags thin modules, e.g. KO script m1/m2, rather than failing silently).

`PlacementTestPage.tsx`:
- Seed a per-attempt PRNG once at mount (`useRef` seed from `Math.random()`, mulberry32
  in a new `shared/utils/seededRng.ts`), so `itemsLookup` returns a stable-within-attempt
  randomized set. Re-mount (new attempt) ⇒ new seed ⇒ new draw.
- `itemsLookup`: `isTestOut ? getDerivedTestOutItems(mod, langId, rng) : getItemsForModule(mod, langId)`
  — drops the `langId==="ja"` gate, so **KO test-outs derive too**.

### 3 — auto-complete modules before the tested one

`adaptiveEngine.ts` `computeOutcome` test-out branch:
- Tested module = the single probed module. If `modulePassed`, `assumed = getAllTestableModules(lang)`
  sliced to those **ordered before** the tested module (uses the tier flat-list order already
  imported — no domain coupling). If not passed, `{verified:[], assumed:[]}` (unchanged).
- Returns `{verified:[tested], assumed:[…before]}`. `applyPlacementResult` then completes
  the before-modules with `xpEarned:0` and seeds their vocab (existing behavior).

`syncTestOutToServer.ts` + `PlacementTestPage.tsx`:
- Sync `[...appliedResult.passedModules, ...appliedResult.assumedModules]` (all `isTestOut:true`
  ⇒ no XP server-side). Persists the auto-completions across devices and fixes the known
  assumed-local-only bug for this flow.

### 4 — result screen ✓/✗ strip

`PlacementResultScreen.tsx` (test-out branch):
- New prop `itemResults?: boolean[]` (ordered correctness for the tested module,
  `state.probeResults[moduleId]`). Render a compact strip of pips — green ✓ / red ✗ —
  plus "You got N of M correct." No prompts, no answers.
- Show the strip on **pass and fail**. Remove the answer-hinting "What to focus on"
  grammar-point list from the test-out screen (keep the pass/fail headline).
- On pass with auto-completed before-modules, show a small "Also marked complete
  (no XP)" line with the module chips (reuses `ModuleChips`).

## Testing

- `deriveModuleTestOut.test.ts`: no-rng path unchanged (determinism preserved); seeded
  rng ⇒ two different seeds yield different draws from a large pool, both still cover
  sections and honor size; KO derivation returns real steps for a KO module.
- `adaptiveEngine.test.ts`: test-out pass ⇒ `assumed` = all-before-tested; fail ⇒ empty.
- `syncTestOutToServer.test.ts`: assumed modules included as `isTestOut:true` attempts.
- `applyPlacement.test.ts`: before-modules complete with 0 XP + vocab seeded (existing
  assumed coverage likely already asserts most of this).
- Manual: JA + KO test-out via Playwright (`scripts/shot.mjs`) — length, varied retry,
  ✓/✗ strip, before-modules credited.
