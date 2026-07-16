# Placement: self-declared level gate + bounded credit — design (2026-07-15)

## Problem (proven)

The onboarding placement over-completes. `computeFloorTier` = *(highest screening
tier passed) + 1*, and `computeOutcome` marks **every module below the floor** as
`assumed` → complete (2026-07-12 "credited from your level" policy). Diagnostic
confirmed: **one correct top-tier screening answer → floor 8 → all 25 JA modules
marked complete.** The probe window also reaches one tier *above* the floor, so
modules *after* where the learner lands complete too. The course is 27 modules —
screening every tier is long and the credit is unbounded.

Root cause is pre-existing (not the recent test-out/langId work); the new "Retake
placement" button just exposed it.

## Decision (Spencer, 2026-07-15)

Option 3 (keep crediting below your level, but **bound it**) **plus** a
self-declared level gate:
1. Ask the learner their level up front — *beginner / intermediate / experienced*,
   phrased in language-appropriate terms.
2. **Sample** a few questions **within that band** instead of screening all tiers.
3. The declared band **caps** the floor, so no runaway credit; **never complete
   modules above where they land.**
4. Apply to **both JA and KO** (big courses — placement must be short).

## Flow

```
Retake / onboarding placement
  → Step 0 (NEW): "How much <Language> do you already know?"  [self-select]
      • Complete beginner  → start at M1, NO sampling, credit nothing
      • other bands        → go to sampling within that band
  → Step 1: SAMPLE ~2 modules from the band (a few questions each, ≤ ~8 total)
  → Result: floor = highest SAMPLED module actually passed (capped at band top).
      Complete modules ≤ floor (bounded); seed vocab; NEVER complete > floor.
```

## Level bands

Bands map a self-declared level to a contiguous module range to sample. The band
**top** caps the max floor (anti-runaway). Labels are language-specific.

### Japanese (tiers: 0=m3-4, 1=m5-6, 2=m7-9, 3=m10-11, 4=m12-14, 5=m15-18, 6=m19-23, 7=m24-27)
| Self-select label | Band (sample range) | Max credit |
|---|---|---|
| "Complete beginner — new to Japanese" | none (start M1 hiragana) | none |
| "I know kana and some words" | m3–m6 (tiers 0–1) | ≤ m6 |
| "I can make basic sentences" | m7–m14 (tiers 2–4) | ≤ m14 |
| "I'm around JLPT N5 (or higher)" | m15–m27 (tiers 5–7) | ≤ m27 |

### Korean (tiers: 0=m1-2 script, 1=m3-4, 2=m5-6, 3=m7-9, 4=m10-11, 5=m12-14, 6=m15-18, 7=m19-23, 8=m24-27)
| Self-select label | Band (sample range) | Max credit |
|---|---|---|
| "Complete beginner — new to Korean" | none (start M1 Hangul) | none |
| "I can read Hangul and some words" | m3–m6 | ≤ m6 |
| "I can hold a basic conversation" | m7–m14 | ≤ m14 |
| "I'm around TOPIK I / intermediate" | m15–m27 | ≤ m27 |

Unknown languages fall back to a generic 3-band split of their testable modules.

## Sampling

- Within the band, pick ~2 modules (spread across the band) and serve a few
  questions each (reuse existing `getItemsForModule` bank items / derived items),
  total ≤ ~8. Reuses `modulePassed` per module.
- Floor = highest sampled module the learner **passed** (`modulePassed`), or the
  band floor − 1 if they pass nothing (i.e. they over-declared → place at band
  bottom). Cap at the band's top module.

## Completion (bounded)

- `computeOutcome` for placement returns: **verified** = sampled-and-passed
  modules; **assumed** = modules below the floor (bounded by band). **Never**
  above the floor.
- `applyPlacementResult` unchanged (completes verified + assumed with 0 XP, seeds
  vocab, auto-completes script m1/m2). The bound now lives in what
  `computeOutcome` returns.
- Complete beginner: verified = assumed = [] → nothing completed, start at M1.

## Implementation surface

- **New**: level-select step/screen before the engine runs (in `features/placement/`),
  + a `PLACEMENT_LEVEL_BANDS` table per language (mirror `tiers.ts` structure).
- **`adaptiveEngine.ts`**: add a "banded sample" mode — `createBandedState(band)`
  or extend `createInitialState` to accept a band; screening replaced by
  in-band sampling; `computeFloorTier`/`computeOutcome` bounded by band top,
  never credit above floor.
- **`PlacementTestPage.tsx`**: render the level-select first; pass the chosen band
  into the engine. Preserve the recent test-out path + langId(URL) + themed shell.
- Keep the existing screening/probing code path available or remove if fully
  superseded (decide during impl — prefer replacing to avoid dead modes).
- i18n: inline `defaultValue`s only (locale JSON backfilled separately).

## Testing

- Engine: each band caps the floor; "complete beginner" completes nothing;
  passing nothing in a band places at band bottom, not top; **no module above the
  floor is ever returned** (regression for the reported bug).
- The old runaway case is impossible: no path completes all 25 modules from one
  answer.
- Component: level-select renders language-appropriate labels; choosing a band
  starts sampling; complete-beginner skips straight to M1.

## Non-goals

- No change to the module test-out flow (that stays evidence-based, 12 questions).
- Not re-tuning per-question difficulty; reusing existing banks.
