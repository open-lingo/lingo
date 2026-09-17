# TestFlight feedback — build 22 (pull 2026-09-16 ~12:50 MDT)

Pull: `node scripts/asc/pull-feedback.mjs $S/tf-b22` → 176 rows, 0 crashes.
Row→item mapping: the manifest's `n` IS the item number (n = 173…176 → #173…#176; the
b13 offset is already baked in). Device iPhone16_2 (15 Pro Max), iOS 26.5.2, build 22,
18:42–18:46 UTC (12:42–12:46 MDT — minutes before the pull). Shots: `$S/tf-b22/173–176.jpg`.

Previous wave: `2026-09-15-testflight-b20.md` (#144–#172; §6 tile decisions still open).

## Items

| # | Tester text | Located | Class / cause | Status |
|---|---|---|---|---|
| 173 | "To omou should be separate no?" | `ja-m34-neo-5` build step 1 (0-indexed) | Tokenizer: greedy longest-match over taught vocab; とお (ten) is an atom, so fused とおもう → とお\|もう. m18 authors "いくと おもう" (space = boundary); m34 fused all 41 learner-facing occurrences. | **FIXED 238d36fa** — m34.ir.yaml respaced + recompiled; gate `fusedToOmouTileSplit.test.ts` (compiles every lesson, fails on adjacent とお,もう; proven to fail once). DOM: しごと\|を\|さがそう\|と\|おもう. 35 respaced clips staged (31 ja + 4 ja-keita). |
| 174 | "As progress bar was advancing here it glitched out the page." | Spencer's Photos screen recording (18:29 MDT, exported via AppleScript): `ja-m34-neo-5` build step, 8 tile taps, on each the prompt + tray + bank cluster drops ~33 CSS px on ALTERNATE frames for ~130 ms, then settles; header + CHECK pinned | `tileFit.ts`: the stage's layout generation was keyed on the tile COUNT, and every tap adds a tray tile → cap + move budget reset → grow/shrink re-negotiation through the ResizeObserver, one pass per frame (alternate-frame flicker). Does NOT reproduce on the simulator (4 runs, 0 px). | **SUSPECTED FIX in build 23** — generation keyed on the label set + `settled` freeze (test fails on old code: 0.798 → 0.9 after a tap). Unverified on device; build 23 ships a "Layout trace" control in the Sync panel to measure it on the phone. |
| 175 | "To omou needs the fixing and isn't future another word?" | same as #173 (step 5) | しょうらい (将来, personal future) is the natural word here and is taught as a new atom in this module; みらい (未来) is the abstract future. | Tile part FIXED with #173; word choice = no change proposed (explain). |
| 176a | "Still not syncing progress… check server calls please see if they push or pull." | Learn map, M5 shows 4/12 | CloudWatch 18:20–19:10 UTC: 17× GET /progress/me, 1× POST /progress/lessons/batch, 2× POST /srs/sync — pushes AND pulls fire. DynamoDB has all 12 ja-m5 LESSON rows with firstPassedAt. The client is not applying server rollups; leading unverified hypothesis = sticky local reset flag (`useProgressMe` skips the merge while it is set). | **DIAGNOSTIC in build 23** — Sync panel shows the reset flag + local vs server counts and has "Pull from server (ignore local reset)". Side find: quest evaluator 404 storm (beta surface) → lingo-async 0058a69a latches it. |
| 176b | "the performance changes on iPad made the thing look jittery" | `TransitLearnPage.tsx` ghost-train tick (b19: setTimeout 33 ms → rAF chain) | timer + vsync phase drift → irregular 33–41 ms frames (research verdict; unverified on device) | **FIXED in build 23** — rAF every vsync, draw gated on a timestamp grid with carried remainder (`ghostPacing.ts`, 5 tests); ring CSS untouched; visibility pause kept. |

| 177 | "Shouldn't be graded false" (pull 2026-09-16 ~21:40) | Flashcards, Recognition card "chopsticks", 2-button grade row | not located — the screenshot shows the card after grading; which button was tapped and what the previous card was is not in the pull | **OPEN — need which grade was tapped / the card before.** |

## Found while fixing (not tester-reported)

- **238 Keita clips never live on prod** (all Tom lines added since July, incl. the 214 from
  2854f209): the manifest points at legacy `sha1("ja-keita:<text>")` paths; the 00:23 regen PUT
  sha256-scheme orphans. The coverage gate read `doc.hashes` only and skipped the override-style
  manifest. Both `manifestCoverage.test.ts` and `tts-live-snapshot.mjs` now walk `overrides`;
  gate failed with 238 uncovered, then 0 after restaging (voice verified by pitch ≈130 Hz).
  Same class as the 2026-09-13 ES 589. **FIXED 238d36fa**, published by the deploy's OIDC step.
- **Real iPad Air landscape hits the short-viewport breakpoint** (`max-height: 820px` →
  `--font-base` 15 px). Emulated landscape never reached 820 tall. **FIXED in build 23**: the
  breakpoint now also requires `(pointer: fine)`, so a touch iPad keeps the 16 px+ base (Spencer's
  stated intent: bigger on landscape iPad).

## Verification

- Preflight 658 files / 18,205 tests green; deploy + ci on 238d36fa (see ledger).
- Prod by content: m34 chunk carries "さがそうと おもう" and no fused form; keita
  `0022bfb6a7e52761` + `7d2ad5ed3c60fe0d` and ja `185fb7041cdaa3f4` serve `audio/mpeg`.
