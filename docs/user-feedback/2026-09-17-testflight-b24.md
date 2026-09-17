# TestFlight feedback — build 24 (pull 2026-09-17 ~01:30 MDT)

Pull: `node scripts/asc/pull-feedback.mjs $S/tf-b24` → row #185, 0 crashes. Device iPhone16_2
(15 Pro Max), build 24, on a normal (non-huge) `ja` build step. Spencer also synced 14
screenshots to iCloud Photos (IMG_2977–2989, IMG_2992; contact sheets in
`$S/photos-b24/sheet_a.jpg`, `sheet_b.jpg`) showing the same tray/bank size mismatch on every
normal build step in builds 23 and 24. Previous wave: `2026-09-17-testflight-b23.md` (#182–#184).

## Items

| # | Tester text | Located | Class / cause | Status |
|---|---|---|---|---|
| 185 | "Why does it size it weird like this? Pre shrinking? Cool animation and fit solution but not necessary here" | every normal-bank build step (reproduced on `ja-m34-neo-7?step=5`, one tap: placed tile 19 px beside 29 px bank tiles) | STRUCTURAL: `BuildSentenceStepView` wrapped `SortableBuildTiles` (which renders its own row) in a second `<TileTray kind="row" layer>`. The inner row is a flex item that shrink-wraps to the tile, and tileFit measures a content-hugging tile's width budget against its nearest tray — so the budget was the tile's own width and the fit-scale stepped down to the 0.8 floor on every pass. Present since e66c118c (2026-09-15); visible since build 21/22 when tileFit began measuring against the group. Not the pop animation. | **FIXED for build 25** — the sortable element IS the layered row (both `BuildSentenceStepView` and `ListeningBuildStepView`); regression test `BuildTrayRowNesting.test.tsx` (3 cases, all failed on the old markup). Chromium after: placed tiles 22.9 px = bank, fit-scale 1.25 over 3 taps. Simulator numbers in the ledger once captured. |

## Process (Spencer, this wave)

- "you need a better way to QA your stuff when designing, the dynamic resizes are bad and they
  need user simulation" → `sim:capture --simulate build` lane: multi-tap user simulation with
  per-tap tables and verdicts (`trayBankFontEqual`, geometry deltas).
- "we need frame capture too so we can analyze animations" → same lane: rAF geometry trace and a
  ~50 ms screenshot contact sheet around every simulated tap, with `fontDipped` /
  `transformSettledMs` / `fitScaleChanged` columns.
- Lesson recorded in memory `headless-ui-qa-recipe`: dump DOM geometry (nearest tray, its width,
  the tile's fit-scale) in Chromium BEFORE theorising — the root cause took 6 minutes once
  measured, after an hour of hypotheses about density, slots, and the pop keyframes.

## Found by the simulation (not tester-reported)

| Item | Measured | Status |
|---|---|---|
| #184 residual: huge banks still re-fit mid-build | `ja-m15-neo-6?step=15` (13-tile answer, bank padded to 17), 15 Pro Max 100%: fit-scale 1.25 → 1.13 (tap 10) → 1.05 (tap 11), row height 80 → 68.5, inside the real answer. The b24 one-row reservation + spent-tile collapse do not line up with tray growth. | **FIXED at 100% for build 25** — hidden full-answer reserve row; FILL sizes the stage against the tray's final height. Fit-scale 1.00 on every tap, tiles never change size; trade: tiles start 20% smaller than before and ~143 px of blank stage at step start. |
| Same step at 125% | 0.82 (taps 0–8) → 0.72 (tap 9); before: 0.83 → 0.81 → 0.71 from tap 7. | OPEN — at 125% the stage overflows with an empty tray, the shrink branch pins the cap before the reserve can act. Loosening the grow-floor ratchet is a decision (three device measurements behind it). |
| Prompt shifts up when the tray takes a row (huge banks) | 36.8 px at taps 7–13 (before: 44 px, taps 2–13, with a reversal). Tiles hold size; the step column re-centres vertically. | OPEN — decision: pin the column to the top on huge banks, or reserve VISIBLE tray height (the #114/#117 trade). |
| Over-placement and collapsed tiles | Simulation tapped distractors past the answer and counted collapsed spent tiles as clipped. | Harness fixed: taps default to the answer length, collapsed tiles reported separately. |
