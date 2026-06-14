# Placement for all courses — worktree report

Branch: `feat/placement-all-courses`. Goal: make the existing adaptive
placement + per-module test-out work for **every** course (not just JA),
offered at onboarding, with correct per-course auto-leveling.

This **extends** the existing engine in `src/features/placement/`. The 2-stage
adaptive engine, `PlacementTestPage`, the `cloze`/`sentenceMcq` factories, the
SRS seeding on pass, and the `LearnCourseMap` test-out buttons were all already
there. The work was generalizing the JA-hardcoded seams and authoring the KO
question bank.

## What existed vs what changed

### Already working (untouched mechanics)
- `engine/adaptiveEngine.ts` — Stage 1 screening → Stage 2 per-module probe,
  100%-per-module threshold, consecutive-wrong cutoff.
- `PlacementTestPage.tsx` — drives the engine, renders steps, applies result.
- `engine/applyPlacement.ts` — completes lessons + seeds SRS atoms (`learning`,
  due today) on pass.
- `LearnCourseMap.tsx` — test-out buttons per module.
- `FirstSessionArc.tsx` — onboarding arc with an optional-placement step.
- `questionBank.ts` — JA M3–M27 (75 items) + 6 starter KO M3 items.

### Changed / added (the actual work)

**1. Language-aware skill tiers — `tiers.ts`**
`SKILL_TIERS` (JA-only module groupings) became `getSkillTiers(languageId)`
with `JA_SKILL_TIERS` (8 tiers, M3–M27) and a new `KO_SKILL_TIERS` (9 tiers,
M1–M27, derived from the authored KO curriculum sequencing). Added
`getAllTestableModules(langId)`, `getTierForModule(modId, langId)`,
`hasSkillTiers(langId)`. JA back-compat aliases (`SKILL_TIERS`,
`ALL_TESTABLE_MODULES`) retained so existing call sites/tests don't break.

**2. Engine threads `languageId` — `engine/adaptiveEngine.ts`**
`AdaptiveState` now carries `languageId`. `createInitialState(langId)`,
`createTestOutState(modId, langId)`, and every internal tier lookup
(`selectNextItem`, `recordAnswer`, `buildProbeWindow`, `computePassedModules`)
route through the language-aware tier functions. A KO screening now serves KO
tier reps (m1, m3, m5, …), never the JA spine.

**3. The mislevel bug — `PlacementTestPage.tsx`**
`applyPlacementResult(state.passedModules)` was dropping the language and
defaulting to `"ja"`, so a KO learner who placed would have **JA** lessons
unlocked and JA atoms seeded. Now passes `langId` to `applyPlacementResult`,
`createInitialState`/`createTestOutState`, and `syncTestOutToServer`. Effect
deps fixed accordingly.

**4. Generalized leveling — `engine/applyPlacement.ts`**
Replaced the hardcoded JA `REVIEW_LESSON_RE` + `JA_KANA_MODULES` with a small
per-language `LANGUAGE_PLACEMENT_CONFIG` (`reviewLessonRe`, `scriptModules`).
KO has no `-review-` lessons (regex `null`) and script modules m1/m2.
Script-module auto-complete now only fires when a **non-script** module passed.
Unknown languages get safe defaults (no crash).

**5. Generalized server sync — `engine/syncTestOutToServer.ts`**
`buildTestOutAttempts` / `syncTestOutToServer` were hardcoded to
`getMockCourse("ja")` (wrong lesson ids for KO). Both now take an optional
`languageId` and the page passes it.

**6. Test-out entry on every course — `LearnCourseMap.tsx`**
The buttons already rendered for all languages; the change is gating them on
`moduleHasBank(modId)` = `getItemsForModule(modId, course.languageId).length > 0`,
so a learner only sees "Test out" where the engine actually has questions —
no dead buttons that bounce to the "no questions yet" screen. Also fixed the
non-current-module button to use `display.contentNumber` instead of the raw
loop index for the label.

**7. Language-aware onboarding — `FirstSessionArc.tsx`**
Copy was hardcoded "Japanese" in two steps and fully un-i18n'd. Now uses
`useLanguage().name` ("Korean", "Japanese", …) via i18n interpolation, and all
strings go through `t()`. The optional-placement route was already built from
`langPath`, and the pass path now levels against the active course (fix #3).
The gate (`shouldShowFirstSessionArc`) was already language-agnostic, so the
arc is offered to any new learner regardless of course.

**8. i18n — `en.json` + `ko.json`**
Added a new `ftue.*` block (en + ko). De-Japanesed `placement.promptBody` and
`placement.noBankDesc` (en) / `noBankBodyAfter` (ko).

## KO question-bank coverage

Authored **3 items per module for KO M1–M27 (81 items)** in `questionBank.ts`,
derived directly from the authored KO curriculum
(`features/languages/ko/curriculum/m*.ts`) so prompts/answers match what each
module teaches. Items dispatch to the **KO** `cloze`/`sentenceMcq` factories via
language routing in `instantiateItem` (correct atom resolution, Hangul, no
romaji). Distractors are grammatical-error or wrong-choice foils, never random.

- **M1–M2**: Hangul-reading checks (no grammar exists there yet).
- **M3–M27**: the grammar spine — copula 이에요/예요, 의, demonstratives,
  counters, 있어요/없어요, 에/에서, 해요 present, ㅡ-drop, 하고/와/과/도, past
  tense, 안/못, time/시/분/반, 부터/까지, 고/아서, 고 있어요, permissions,
  거예요, family, body, 아프다, 보다/제일, 수 있다, 줄 알다, 거나, 려고 하다,
  거든요, 아/어야 되다, etc.

The 6 legacy `pt-ko-m3-*` ids collapse into the canonical 3-per-module shape;
`pt-ko-m3-1/2/3` ids are preserved for saved-state stability.

### NATIVE-REVIEW list
No items are flagged `// NATIVE-REVIEW:` — every KO item was lifted from a
prompt/answer pair already present in the shipped KO curriculum (which is the
content a native-aware author wrote), so naturalness is inherited rather than
fabricated. Two areas a native reviewer may want to spot-check (they're
correct standard Korean but have natural-register nuance):
- M9 formal 와/과 ("사과와 우유") vs the casual 하고 most learners default to.
- M22 comparative ordering ("커피가 차보다 비싸요") — standard, but spoken
  Korean sometimes fronts the 보다 phrase.

If a reviewer disagrees with any single distractor, only that item's
`distractorsKana` array needs editing — no structural change.

## How a future course plugs in

Adding (e.g.) ES placement needs **no engine/UI code changes**:
1. Register `ES_SKILL_TIERS` in `tiers.ts` `TIERS_BY_LANGUAGE`.
2. Add ES items to `PLACEMENT_QUESTION_BANK` with `languageId: "es"` (and an
   `es` branch in `instantiateItem` if ES uses its own grammar factories).
3. Optionally add an entry to `LANGUAGE_PLACEMENT_CONFIG` in
   `applyPlacement.ts` only if the course has review-lessons-to-skip or
   script modules; otherwise the safe default applies.

The test-out buttons, onboarding offer, auto-leveling, and SRS seeding then
work automatically for that course.

## Note on the parallel `module.placementBank` scaffolding

There is a second, registry-based placement contract (`PlacementBank` type +
`KO_PLACEMENT_BANK` in `features/languages/ko/placementBank.ts`, conformance-
tested) that is **not** wired into the live `PlacementTestPage`/engine — the
page consumes the flat `questionBank.ts`. Per the "extend, don't rebuild"
brief I left that scaffolding untouched and extended the live path. Unifying
the two is a separate refactor.

## Verification
- `npx tsc --noEmit` — clean.
- `npm run build` — clean (only the pre-existing chunk-size warning).
- `npm run test:run` — 1215 passed (159 files). New/updated tests:
  - `questionBank.test.ts` — JA 75 + KO 81, per-language module coverage,
    no duplicate options, language-aware module validity (was failing before
    on KO m1/m2 — now fixed).
  - `adaptiveEngine.test.ts` — KO leveling block (uses KO tiers, full-pass
    reaches m27, test-out probes only the target module).
  - `applyPlacement.test.ts` (new) — KO levels `ko-*` lessons not `ja-*`
    (the mislevel regression guard), script-module auto-complete, unknown-lang
    no-op.
  - `syncTestOutToServer.test.ts` — KO builds `ko-*` lesson attempts.
  - `FirstSessionArc.test.ts` — gate is language-agnostic for KO.
- Screenshots (port 5196, `--lang=ko`): onboarding arc reads "What brings you
  to Korean?" and "New to Korean? …"; KO test-out `/ko/learn/test-out/m7`
  renders header "Test out · Verbs & the 해요 present", 0/3, and the authored
  KO item "Make 먹다 polite ('I eat'):" with Hangul options.
