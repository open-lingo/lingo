# 2026-09-15 — TestFlight feedback, build 14 (Spencer)

Pulled 2026-09-15 20:00 MDT via the App Store Connect API. Crash submissions:
**0**. Screenshot submissions: **4** (API rows 113–116 → items **#114–#117**,
all Spencer, iPhone16_2 = his 15 Pro Max, 01:47–01:53Z). Shots at
`2026-09-15-testflight-shots/<item>.jpg`.

Spencer's framing: *"we shrunk too much, again — simulate on the local
simulator device on Mac, it's the actual app, use my 15 pro max but we NEED to
get the sizing right… let me know what you see and why you missed these."*

## Table

| # | shot | Where | Quote | Class | Finding / fix | needsSpencer | status |
|---|---|---|---|---|---|---|---|
| 114 | 114 | Lesson build step, 8 kana-only tiles, "Say to a friend: I went to the sea on Sunday" | "Now the word tiles are a bit too small, we can make them maybe 10% bigger and then the dynamically scaling sentence bar is enough" | layout-fit | Dense tile word 15 → 16.5px (+10%); kana-only tiles additionally 1.2× (19.8px) so they fill the reading band a kanji sibling reserves (his #117 ask). Measured on the iOS 26.5 simulator, iPhone 15 Pro Max, real WebKit — table in the ledger. | N | fixed (this wave) |
| 115 | 115 | Match-pairs review, よじ/あした/さんじ/どようび… all kana | "after testing out of things I should be seeing a lot more kanji, we need an inferred kanji state for words as well" | feature | Kanji surfacing on match/build tiles is gated by `applyKanjiSurfaces`/`N5_KANJI` anchor vocab per module, not by the learner's tested-out state. Design needed: a per-word "kanji known" inference from test-out seeding (module that teaches the kanji ≤ tested-out module) feeding the same surfacing path. Size: M–L. | Y (design) | open |
| 116 | 116 | Review step serving いいえ ("no") | "no is so common it has to be fsrs already, likely no reason I should be getting it on here" | review-pool | Not a sizing item; the review selector served an m1-tier atom that his FSRS state should rank as known. Fold into the #91 low-module-filler follow-up (why in-lesson review picks ignore seeded FSRS state). | N | open (folded into #91) |
| 117 | 117 | Lesson build step, 7 tiles incl. 今 with NO reading, tall tiles | "Now we have regression and furigana doesn't show at all, the non furigana should grow like I said before and ideally the rest of the tiles have their words grow to fill the vertical at least a little bit" | regression | TWO causes, both from the b13 wave: (1) the new `.kanji-ruby .kana-helper` rule out-specified the `[data-visible="false"]` collapse, so a HIDDEN reading kept a 15px empty band (tile 46.7 → 48.7px measured on the simulator) — now scoped to `[data-visible="true"]`; (2) the reading was hidden at all because build tiles hide furigana once `isMastered`, and the #80 test-out seeding writes mastered-length intervals with reps 0 — after his test-outs every kanji tile went silent at once. Now hidden only when mastered AND actually reviewed (`isNew` guard). Kana-only tiles grow 1.2× into the band. | N | fixed (this wave) |

## Why these were missed (Fable, honest accounting)

1. **Wrong engine, wrong viewport, wrong user state.** Every b13 sizing number
   was measured in headless Chromium at 390×844 with the dev-bypass user (zero
   SRS state). Spencer's device is a 15 Pro Max (430×932, WebKit) with hundreds
   of test-out-seeded "mastered" atoms. WebKit's ruby box is 5px taller than
   Chromium's for the same tile (46.7 vs 40.8px), and the mastered path was
   never exercised — so the dead band (#117) could not show up in my harness.
2. **A CSS rule added without checking the cascade it sits in.** The 10px
   floor rule had equal specificity to the hidden-reading collapse and landed
   later in the file; I measured only the visible case.
3. **Shrinking the word to hold tile height.** #69 asked for smaller tiles;
   #87 said the reading, not the word, should shrink. I took the reading down
   AND kept the word small to keep the box from growing — the box size was my
   constraint, not Spencer's. His ask was legibility first.
4. **Test-out seeding and furigana gating were never reconciled.** #80 made
   seeded atoms "mastered" by interval; the tile furigana gate reads exactly
   that. Two features from the same wave, no cross-check.

Fix loop this time: measured on the real simulator WebKit (safaridriver
session on the booted iPhone 15 Pro Max against the dev server), then in the
actual app shell (Capacitor `CAP_DEV_SERVER` harness) — see the ledger.
