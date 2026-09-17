# Golden-learner replay — 2026-09-17 (lane A2d)

Project review 2026-09-17 §3 "Golden-learner replay" proposal
(`docs/project-review-2026-09-17-decisions-and-proposals.md`): "Record one
real tester's tap sequence through a lesson, then replay exactly those taps
in the simulator on every build and compare the frame trace and the stage
pixels against the last approved run." Why: four tile-sizing/shrapnel
incidents in one week (#174, #184, #185, and the shrapnel class) each got
fixed, then had nothing stopping the SAME class of bug from shipping again
on the next build. This turns one of Spencer's walks into a regression test
that repeats itself.

## What exists after this lane

1. **Recording** — a `tile_tap` session-log event (`src/shared/telemetry/
   sessionLog.ts`) fires from `BuildSentenceStepView`/`ListeningBuildStepView`'s
   `addTile`/`removeTile` on every real tap: lesson id, step index, step
   type, the tile's own label text, `bank`|`answer` source, tray position,
   ms since the step mounted, font-scale %, viewport width. Capped at 60
   taps per (lesson, step) so one pathological huge-bank step can't crowd
   out the rest of the 500-event session buffer.
2. **Export** — a "Copy tap replay" button next to the existing "Copy JSON"
   (Layout trace) export in the Sync/diagnostics panel
   (`src/features/sync/LayoutTracePanel.tsx`) copies the most-recently-tapped
   step's taps as `{ route, viewport, fontScale, taps: [{tMs, label,
   source, position}] }`.
3. **Replay** — `npm run sim:capture -- --replay <file.json> [--speed 0|1]`
   drives the SAME route/viewport/font-scale, waits for the step, taps each
   recorded label in order (not coordinates — see Limits), runs the same 8
   geometry verdicts `--simulate build` runs, and pixel-compares the
   settled stage crop against a baseline PNG that lives next to the replay
   file.
4. **Golden set** — `tests/visual/golden/<name>.replay.json` +
   `tests/visual/golden/<name>.png`, three recorded via the simulator
   (`--record-golden`, see below):
   - `normal-build-100` — `build_sentence`, 6-tile answer / 10-tile bank,
     `ja-m34-neo-7?step=5`, 100%.
   - `huge-bank-125` — `listening_build`, 21-tile answer (the longest in
     the course, ledgered), `ja-m42-neo-challenge?step=listening_build`,
     125%.
   - `listening-build-100` — `listening_build`, 6-tile,
     `ja-m34-neo-5?step=12`, 100%.
5. **Runner** — `npm run sim:replay` runs every golden and prints one table.

## How Spencer records one on his phone

1. Walk the lesson normally on the device build.
2. On the step you want to pin down, open the Sync panel (the same one
   that has "Layout trace").
3. Tap **Copy tap replay** — it copies the JSON to the clipboard. (If it's
   greyed out / not showing, you haven't tapped any tiles on this step yet
   this session.)
4. Paste it into a file named `tests/visual/golden/<short-name>.replay.json`
   (any name — `#185-repro`, `m34-challenge`, etc.) and hand it to whoever's
   driving the Mac, or paste it straight into a message.
5. Whoever has the Mac runs the two commands under "Approving a new
   baseline" below to turn it into a real golden entry (a `.replay.json` +
   a `.png` baseline both need to exist).

The pasted JSON is plain text and safe to read — it only ever contains
lesson content (tile labels), never anything typed or personal.

## How to record a golden via the simulator (not by hand)

The three seeded goldens were recorded this way, not hand-written:

```
LOCK=.../scratchpad/sim.lock   # hold the sim lock (see lane-common brief)
npm run sim:capture -- \
  --route "/ja/learn/lessons/ja-m34-neo-7?step=5" --viewport 15-pro-max --font-scale 100 \
  --simulate build --record-golden normal-build-100
```

This taps the bank in order (the same synthetic loop `--simulate build`
always runs), and because every tap is a REAL DOM `.click()`, the SAME
`addTile`/`removeTile` React handlers a finger tap would hit fire too —
`logTileTap` records each one and (only because the dev-capture harness
sets `lingo:sim-probe=1`, never a real device) posts it to
`/__sim/report`, which the Node side reconstructs into
`tests/visual/golden/<name>.replay.json` + a cropped `<name>.png`
baseline. No hand-typed JSON anywhere in this path.

## Approving a new baseline

A golden's baseline (`<name>.png`) should change only after a REAL,
ledgered, Spencer-approved visual change lands — never to make a red run
quietly green. To update one:

```
npm run sim:capture -- --replay tests/visual/golden/<name>.replay.json --update-baseline
```

This overwrites `<name>.png` with the current settled crop. `<name>.replay.json`
itself (the tap sequence) does not need to change unless the STEP the
golden points at was re-authored — if the route no longer exists or the
answer changed shape, re-record the golden from scratch (see above) instead
of hand-editing the taps.

## Reading the table

```
npm run sim:replay
```

prints, per golden: `name | taps | verdicts | pixelDiff | PASS/FAIL`.

- **taps** — how many of the recorded taps actually replayed (should equal
  the file's own tap count; fewer means a HARD FAIL partway through — see
  below).
- **verdicts** — `NP/MF/KN` = N verdicts PASSED, M FAILED, K were N/A
  (nothing to sample on that route — e.g. `promptStable` on a route with no
  prompt). This column is INFORMATIONAL, not what decides PASS/FAIL in the
  last column — see "Why pixelDiff decides PASS/FAIL, not the verdict
  count" below.
- **pixelDiff** — % of pixels in the settled stage crop that differ from
  the golden's own baseline PNG (odiff, antialiasing-tolerant), against a
  0.1% threshold.
- **PASS/FAIL** — PASS means the tap sequence replayed AND the pixels match
  the baseline. A non-zero exit code from `npm run sim:replay` means at
  least one golden failed either way.

### Why pixelDiff decides PASS/FAIL, not the verdict count

A golden can legitimately carry a KNOWN, already-decided defect. `huge-bank-125`
FAILS `stageFits` every time it runs — 21-tile answers at 125% leave ~212px
of bank behind the sticky CTA at rest, a real, ledgered, 1%-of-steps
decision to leave alone (`docs/handoff-2026-09-17-project-review.md`, P1b).
Replaying it and getting the EXACT SAME `stageFits: FAIL` with 0.0000%
pixel diff is not a regression — it is proof nothing changed. If instead a
verdict FLIPS (PASS on record, FAIL on replay) while pixelDiff stays 0%,
that is a real contradiction worth a by-hand look (the runner does not
currently flag this automatically — seeding this comparison is future
work, not built).

### A HARD FAIL

If a recorded tap's label is not found anywhere in the current bank/tray,
the run stops immediately and prints:

```
FAIL: replay tap 2/6 — label "いえ" not found on screen
FAIL:   visible labels: ["家いえ","出でよう","思おもう","と","池いけ","うち","を","川かわ"]
```

No verdicts, no pixel compare — there is nothing honest left to judge once
the sequence itself couldn't be reproduced. This usually means: the lesson
was re-authored (the tile no longer exists / its text changed), or a real
sizing/rendering regression made the tile invisible or its text different
than what was recorded.

## Verdicts, in plain words

(Full definitions live in `sim-capture.mjs`'s `computeBuildVerdicts` doc
comment; this is the short version for reading the table.)

| verdict | plain meaning |
|---|---|
| `fitScaleStable` | the tile-shrink factor never changes after the first tap (tiles don't shrink mid-build) |
| `trayBankFontEqual` | a placed tile's font size matches its bank sibling's (no #185-class "tray tile looks smaller") |
| `rowHStable` | the bank's row height never changes mid-build |
| `h2Stable` | the prompt heading never jumps up/down |
| `promptStable` | same idea, read a different way — the prompt rect never moves |
| `chromeStable` | the fixed header/CTA chrome around the tray never moves |
| `noFlicker` | no back-and-forth jitter in the prompt position across the whole sequence |
| `stageFits` | the tray+bank content fits above the sticky CTA at rest (see the huge-bank exception above) |
| `bankVisible` | how much of the bank sits behind the sticky CTA — informational unless `--enforce-bank-visible` |

## Limits

- **Label-based replay cannot reproduce a drag path.** It taps by label,
  not by finger trajectory — anything that depends on HOW a tile moved
  (drag-and-drop gestures, mid-drag geometry) is out of scope. Every build
  step today is tap-to-place, so this is not a gap yet, but it would be if
  a drag-based step type shipped.
- **Timing is approximate.** `tMs` is "ms since the step view MOUNTED", not
  a hardware timestamp — close enough to preserve real pauses (`--speed 1`)
  but not frame-exact.
- **A kanji tile's recorded label is the semantic value, not always the
  literal rendered text.** `sessionLog.ts` records the tile's underlying
  string (the reading, e.g. "いえ"); a kanji tile with visible furigana
  renders as `<ruby>家<rt>いえ</rt></ruby>`, whose `textContent` is
  "家いえ" (base + reading concatenated). The matcher tries an EXACT match
  first, then falls back to a CONTAINS match — this covers every case seen
  so far, but a route where two different tiles' concatenated text both
  contain the same recorded label could in principle match the wrong one.
  Found and fixed live while seeding the golden set (see the commit
  history on `src/shared/dev/simProbe.ts`'s `runTapReplay`).
- **A route's FIRST visit in a fresh dev-server session can hard-fail on a
  cold Vite compile.** Found live seeding the golden set: the very first
  capture against a brand-new worktree returned "This lesson could not be
  loaded" (content JSON hadn't been emitted yet — `npm run content:emit`,
  usually run via `predev`, never fires when `sim-capture.mjs` spawns Vite
  directly), and separately the FIRST replay of a never-before-visited
  route in an otherwise-warm dev server hard-failed with an empty bank (Vite
  still on-demand-compiling that route's module graph) before succeeding
  cleanly on an immediate re-run. Neither is this harness lying about a
  real defect — re-run once before trusting a lone FAIL against a
  freshly-created golden or a freshly-started dev server.
- **Not wired into CI.** Needs the iOS Simulator and a real device profile
  — this is a manual pre-build step (`docs/mobile-sizing-spec.md` §9a), not
  a GitHub Actions gate.
- **Verdict-flip detection is not built.** See "Why pixelDiff decides
  PASS/FAIL" above — the runner does not diff a golden's verdicts against
  what they were when the golden was recorded, only the pixels.

## Prove it can fail

Per the doctrine (`docs/prove-the-verifier-can-fail.md` equivalent rule —
"quantify risk before shipping", "every verdict must be shown to fail once
on purpose"): a deliberate one-line break to `--tile-font` in
`src/index.css`'s TILE PRIMITIVE block (18.3px → 24px, reverted
immediately after) was run through `npm run sim:replay` twice — once
broken, once reverted. `--tile-font` turned out to be a base `:root`
token every tier's font floor/ceiling is a RATIO of, so it FAILED all
three goldens, not just one (a stronger proof than planned, not a weaker
one — the harness caught the regression everywhere it actually showed
up, at very different magnitudes):

```
$ npm run sim:replay        # with --tile-font: 24px (broken)
...
name                      taps    verdicts   pixelDiff  result
huge-bank-125               21    8P/1F/0N     0.1200%  FAIL
listening-build-100          6    9P/0F/0N    12.5800%  FAIL
normal-build-100              6    9P/0F/0N     5.5900%  FAIL

FAIL — see the row(s) above marked FAIL:
  huge-bank-125: pixel baseline diff
  listening-build-100: pixel baseline diff
  normal-build-100: pixel baseline diff
exit code: 1
```

```
$ npm run sim:replay        # with --tile-font: 18.3px (reverted)
...
name                      taps    verdicts   pixelDiff  result
huge-bank-125               21    8P/1F/0N     0.0000%  PASS
listening-build-100          6    9P/0F/0N     0.0000%  PASS
normal-build-100              6    9P/0F/0N     0.0000%  PASS

PASS — all goldens replayed clean.
exit code: 0
```

Note `huge-bank-125` carries `8P/1F/0N` in BOTH runs (the pre-existing
ledgered `stageFits` defect — see "Why pixelDiff decides PASS/FAIL"
above) and its pixelDiff is what actually moves (0.0000% → 0.1200%,
just over the 0.1% threshold) — the same known defect, still correctly
distinguished from a new regression. This is the same class of change a
real regression would make (a token shift on `git blame`'s most recently
touched sizing file), not a synthetic no-op.
