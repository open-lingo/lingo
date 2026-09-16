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
| 174 | "As progress bar was advancing here it glitched out the page." | step 5 of the same lesson; screenshot shows an empty tray, no artefact | not located | **OPEN — need what "glitched" looked like** (jump / flash / re-render / tiles moving). |
| 175 | "To omou needs the fixing and isn't future another word?" | same as #173 (step 5) | しょうらい (将来, personal future) is the natural word here and is taught as a new atom in this module; みらい (未来) is the abstract future. | Tile part FIXED with #173; word choice = no change proposed (explain). |
| 176a | "Still not syncing progress… check server calls please see if they push or pull." | Learn map, M5 shows 4/12 | server-log-first (CloudWatch /aws/lambda/lingo-core) | **BLOCKED** — AWS SSO token expired; needs `aws sso login --profile lingo`, then pull/push calls for this tester around 18:40 UTC. |
| 176b | "the performance changes on iPad made the thing look jittery" | `TransitLearnPage.tsx` ~1228–1250 (b19 ghost-train pacing: setTimeout 33 ms → rAF) + ring keyframes moved to `transform: scale()` | timer+vsync phase drift → irregular 33–41 ms frames (hypothesis, unverified on device) | **DECISION** — vsync-aligned 30 fps (rAF timestamp gating) vs 60 fps for the ghost only. Now measurable on the real-landscape sim. |

## Found while fixing (not tester-reported)

- **238 Keita clips never live on prod** (all Tom lines added since July, incl. the 214 from
  2854f209): the manifest points at legacy `sha1("ja-keita:<text>")` paths; the 00:23 regen PUT
  sha256-scheme orphans. The coverage gate read `doc.hashes` only and skipped the override-style
  manifest. Both `manifestCoverage.test.ts` and `tts-live-snapshot.mjs` now walk `overrides`;
  gate failed with 238 uncovered, then 0 after restaging (voice verified by pitch ≈130 Hz).
  Same class as the 2026-09-13 ES 589. **FIXED 238d36fa**, published by the deploy's OIDC step.
- **Real iPad Air landscape hits the short-viewport breakpoint** (`max-height: 820px` →
  `--font-base` 15 px). Emulated landscape never reached 820 tall. **DECISION for Spencer.**

## Verification

- Preflight 658 files / 18,205 tests green; deploy + ci on 238d36fa (see ledger).
- Prod by content: m34 chunk carries "さがそうと おもう" and no fused form; keita
  `0022bfb6a7e52761` + `7d2ad5ed3c60fe0d` and ja `185fb7041cdaa3f4` serve `audio/mpeg`.
