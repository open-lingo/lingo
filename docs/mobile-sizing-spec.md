# Mobile sizing spec — the current spec

**Status:** LIVE. §1/§4/§7–§11 are the 2026-09-15 text; **§2, §3, §5, §6 and
§12 were rewritten 2026-09-16** by the device-simulator tile sweep phase 2A
(measured on the 15 Pro Max and iPad Air simulators; report:
`scratchpad/tile-sweep/PHASE2A.md`, defect table in `tile-sweep/REPORT.md`).
**§3's "nothing moves or resizes while the learner builds" rule and §9's
verdict list were rewritten 2026-09-17** (build 25, the lead's ruling on
#184/#185; measured with `--simulate build` on the 15 Pro Max at 100% and
125%).
This is the single current authority for tile sizing, stage-height, and the
measurement protocol for any phone/tablet sizing claim. It supersedes the
doc/CLAUDE.md statements listed in §8 — those files still exist for history,
are marked in place (see §8), and are not deleted.

**What changed on 2026-09-16, in one paragraph.** The equal-rows invariant
(#137) now has ONE owner: `tileFit.ts` measures each cohort and publishes
`--tile-row-h`; `--tile-box-h` stayed Spencer's dial and became the fallback.
Every box token in the tile system is px or em-of-`--tile-font` — no rem
anywhere, enforced by a ratchet test — which is what fixed the furigana floor
growing over its own word (#87) and the 125%/140% stage overflows (#89). FIT
ratios are per tier, not one global ratio off the build tile, and the prose
tier no longer opts out of FIT (#156). FILL now works in BOTH directions
inside [floor, ceiling], and the portrait-iPad ceiling went 1.25x → 1.5x
(#152's dead space). `--tile-box-w` exists (#119). `docs/qa/tile-sizing.json`
is regenerated and ratcheted against the registry.

Built from a read-only doc-alignment audit
(`docs/handoff-2026-09-11-mobile-qa.md`-adjacent scratchpad, 155 statements /
10 contradictions / 6 supersessions / 9 orphans / 2 ghosts) and a
best-practice research pass, both dated 2026-09-15. Ground truth for every
value below is `src/index.css`, per `tileSizingTokens.ts`'s own stated
authority order (`src/features/lesson/dev/tileSizingTokens.ts:1-9`) — **not**
`docs/qa/tile-sizing.json`, which is self-documented as stale (see §2's last
row and §9).

Founder's rule (`docs/spencer-product-sentiment.md` Topic 1, binding): his
hand-dialled values ARE the values. Nothing below restates a number as a
"recommendation" — every number is either what's shipped in `index.css` or a
standards citation offered as headroom, explicitly marked as such.

---

## 1. Tiers

The tile-token system (fonts/boxes/gaps for build/match/option/MCQ tiles)
has **three** tiers, each one `:root` block in `src/index.css`:

| tier | media query | `src/index.css` | what it is |
|---|---|---|---|
| `base` | none (default `:root`) | `:129-191` | phone, <640px. Source of truth — every other tier scales off it. |
| `sm` | `@media (min-width: 640px)` | `:193-289` | desktop **and** landscape iPad — iPad-in-landscape mirrors desktop by product direction (`docs/ipad-scoping-2026-09-15.md` §2, `tileSizingTokens.ts:27-34`). |
| `tabletPortrait` | `@media (min-width: 640px) and (orientation: portrait) and (pointer: coarse)` | `:291-339` | portrait iPad (mini–13") and Split View panes. "The roomiest iteration of mobile" (Spencer) — scaled off `base`, NOT off `sm`. Must sit AFTER the `sm` block in source order: media queries add no specificity, so 640–1023px portrait matches both blocks and the later one in the cascade wins. Moving this block above `sm` silently reverts a portrait iPad to desktop tokens with no visible error. |

There is a **fourth, separate tier** for layout (not tile tokens):
`landscapeLg` = `(min-width: 1024px) and (orientation: landscape)`
(`src/shared/hooks/breakpoints.ts:36-40`, `src/shared/platform/formFactor.ts:52`).
It gates the sidebar-vs-hamburger nav and a `--tap-bump` tap-target increase
(`src/index.css:372-403`) plus two per-view #147/#148 overrides — it does
**not** redefine the tile-font/box tokens above; those come from the `sm`
block, unchanged. Don't confuse "landscapeLg the nav/tap-bump gate" with "sm
the tile-token tier that landscape iPad also reads" — they're two different
media queries that happen to overlap on a landscape iPad.

---

## 2. Token table per tier — CURRENT VALUES

Every value below is transcribed from `src/index.css`, 2026-09-16. **The
JSON no longer disagrees:** `docs/qa/tile-sizing.json` was regenerated from
`tileSizingTokens.ts` (which mirrors `index.css`) and a ratchet in
`tiles/tileFit.test.ts` now fails the suite if the two drift — see §12.

**The unit rule, stated once (it is the whole of §8 applied):** type is px or
`em` of `--tile-font`; box floors are px; **nothing in the tile system is
`rem`.** `--card-pad`/`--card-max-h` are the two deliberate exemptions (an
overlay card is prose chrome, not a tile box — `--card-max-h` is `85dvh` since
2026-09-16 and §4 item 4 is closed). Since 2026-09-16 every tile `font-size`
is additionally multiplied by `--tile-a11y-scale`, the accessibility slider's
own unitless number (§8) — that is how the slider reaches tile TYPE without
`rem` reaching tile BOXES. A second ratchet greps the tile `:root` blocks
and the whole TILE PRIMITIVE block for `rem` and fails on a hit.

| token | base (`:135-190`) | sm (`:200-243`) | tabletPortrait (`:293-334`) | JSON disagreement |
|---|---|---|---|---|
| `--tile-h` | 20px | 61px | 25px | — |
| `--tile-font` | 18.3px | 20.4px | 21px | — |
| `--tile-font-floor` | 14.6px (0.8×) | 16.3px (0.8×) | 16.8px (0.8×) | — |
| `--tile-font-ceiling` | 22.9px (1.25×) | 25.5px (1.25×) | **36.8px (1.75×)** | — (tablet raised 2026-09-16, §3) |
| `--tile-kana-font` | 1.28em | 1.2em | 1.28em | — |
| `--ruby-font` | 0.62em | 0.55em | 0.62em | — |
| `--ruby-floor-romaji` | **12px** | **12px** | **12px** | — (was 0.75rem; px 2026-09-16, §6) |
| `--ruby-floor-kanji` | **12px** | **10px** | **12px** | — (was 0.75rem/0.625rem, §6) |
| `--tile-px` | 5px | 14px | 6.25px | — |
| `--tile-py` | 3.75px | 7px | 4.75px | — |
| `--tile-gap` | 5.5px | 10px | 7px | — |
| `--tile-tray-gap` | 8px | 10px | 10px | — |
| `--tile-box-h` | **45px** | **51px** | **50.5px** | — (JSON agreed 2026-09-16; it read 32px/0px before) |
| `--tile-box-w` | **44px** | **44px** | **44px** | NEW 2026-09-16 — §5's named gap, finally filled |
| `--tile-row-h` | *written by `tileFit.ts`* | " | " | not a dialable token — see §3 |
| `--listen-bank-gap` | 7px | 12px | 9px | — |
| `--listen-tray-min-h` | 54px | 68px | (not redefined; inherits `sm`) | — |
| `--match-tile-h` | 84px | 76px | 96px | — (was 5.25/4.75/6rem) |
| `--match-gap` | 8px | 8px | 10px | — (was rem) |
| `--match-font-scale` | 0.91 | 1 | 1.05 | — |
| `--match-px` | 16px | 16px | 20px | — (was rem) |
| `--match-py` | 7px | 6px | 9px | — (was rem) |
| `--match-radius` | 16px | 12px | 16px | — (was rem) |
| `--mcq-font` | 20px | (`--option-font` group instead) | 23px | — (was rem) |
| `--mcq-py` | 24px | " | 30px | — (was rem) |
| `--option-px` | 7px | 16px | 9px | — (was rem) |
| `--option-py` | 20px | = `--mcq-py` | 25px | — (was rem) |
| `--option-font` | 22px | = `--mcq-font` | 25px | — (was rem) |
| `--option-font-min` | **18px** | **16px** | **20px** | NEW 2026-09-16 — the prose tier's own FIT floor (§3) |
| `--option-radius` | 12px | 12px | 12px | — (was rem) |
| `--option-gap` | 14px | 16px | 18px | — (was rem) |
| `--card-pad` | 1.25rem | (not redefined) | 1.5625rem | — |
| `--card-max-h` | **85dvh** | (not redefined) | **85dvh** | — (was `vh`; §4 item 4 CLOSED 2026-09-16) |
| `--tile-a11y-scale` | *written by `ThemeContext`* | " | " | not a dialable token — the user's slider, see §8 |
| `--tray-grow` | **0** | **0** | **0** | NEW 2026-09-16 — the dead-space dial, both ends measured (§3) |
| `--tile-big-scale` | **ghost — does not exist in CSS** | — | — | **CLOSED 2026-09-16**: dropped from the JSON, and the registry ratchet now rejects any JSON key that is not a live token |

Every match tier's `clamp()` FONT bounds are px as well (the `cqh` middle term
stays — a six-row review match clips its last row on a 15 Pro Max without it),
as are the literal per-tier option paddings/fonts (`word` 32px/30px,
`word-glyph` 36px/48px, `reveal` 32px/30px, `particle`
`clamp(56px, 8cqh, 72px)`).

`--big-font-scale`/`--big-px-scale`/`--big-py-scale`, `--huge-font-scale`/`--huge-py-scale`,
and `--listen-font-scale`/`--listen-px-scale`/`--listen-py-scale`/`--listen-bank-py-scale`
are unitless ratios over the plain tile (see `index.css:135-190` comments for
their derivations) — carried in the JSON too, and current per its `_note`.

---

## 3. The fit rule (THE TEXT RULE — TestFlight #152/#156/#157b)

Spencer: *"Text wrap is so ugly here, shrinking the font size floor is
preferred and we can fill up to a certain size."*

- Every tile shrinks the label toward its floor **before** it is allowed to
  wrap. Below the floor, and only below the floor, wrapping is permitted.
- **The floor and ceiling are PER TIER** (2026-09-16). `tileFit.ts`'s
  `readFitRatios` reads `--fit-font` / `--fit-font-floor` /
  `--fit-font-ceiling` off the tile when its tier declares them, and falls
  back to `--tile-font` / `--tile-font-floor` / `--tile-font-ceiling`
  otherwise (build, listen and match all fall back — they are unchanged). One
  global ratio derived from the 18.3px build tile was the wrong floor for
  tiers of very different absolute size: it handed the 30px MCQ `word` tier a
  24px floor that a 10-glyph single word cannot reach, so the word wrapped
  instead of shrinking. Declared today: `sentence`/`pick` →
  `--option-font-min`; `word`/`reveal` → 30px/22px (36px/26px at `sm`);
  `data-text` sm/md/lg → 18/14, 20/16, 24/19px. A tier that declares a floor
  but no ceiling keeps the plain tile's growth ratio: the ceiling is a
  stage-fill *policy* Spencer dials once, not a per-tier readability number.
- **No tier opts out of FIT.** The `sentence` prose tier used to
  (`Tile.tsx`, "prose is supposed to wrap") — true of prose, false of what
  lands there: `MultipleChoiceStepView` demotes a WORD grid to `sentence` as
  soon as one option is 9+ characters, so #156's 2×2 grid of single Japanese
  words rendered as left-aligned prose and wrapped mid-word. It fits like
  every other tier now, and a genuinely long sentence still reaches
  `--option-font-min` and still wraps — at word boundaries
  (`overflow-wrap: break-word`, not the primitive's CJK `anywhere`).
- A tile fills toward `--tile-font-ceiling` only against a **measured pixel
  stage height** — never against `cqh`/`vh` alone (see §4 item 3: the
  suspected ~200px on-device `cqh` over-report; a ceiling computed off a
  container-query height would grow tiles into space that doesn't exist on
  the phone). Shipped 2026-09-15 as `tileFit.ts` FIT/FILL: the px budget is
  `--stage-h` if published, else `visualViewport.height` minus the shell's
  bottom safe-area; `scrollHeight` is an overflow detector only.
- **FILL WORKS BOTH WAYS** (2026-09-16). Inside `[floor, ceiling]` it grows a
  half-empty stage AND shrinks an overflowing one. It used to refuse to go
  below 1.0 ("shrinking is FIT's job") — true of a label that is too wide,
  false of a stage that is too tall: 8 of 25 routes measured on the 15 Pro Max
  scrolled at 125%, up to 234px at 140%, while FILL sat at exactly 1.0
  watching it (#89 "there should be no scroll here"). The shrink floor is the
  same `--tile-font-floor` FIT stops at, so no tile is ever smaller than the
  size Spencer dialled as "too small"; and a stage caught overflowing has its
  ceiling capped at the scale that fitted, so the two halves cannot take turns
  and flicker. **That cap now releases ONCE per layout generation**
  (2026-09-16, phase 3), and only on a stage that is (a) not scrolling and
  (b) sitting on more than 24px (`CAP_RELEASE_SLACK_PX`, 4 × `FILL_SAFETY_PX`)
  of measured on-screen slack under its content — the flicker the cap exists
  to stop is a stage oscillating around ZERO slack, so a stage with tens of
  spare pixels is not that stage, it is a stage still paying for an overflow
  that has gone away (a late font, a late image, an unsettled ghost row). One
  release per generation bounds the worst case at a single extra
  grow→overflow→shrink cycle. Measured on the 15 Pro Max,
  `ja-m34-neo-3?step=11` at 125%: word **19px → 21px**, tile 56px → 59px,
  overflow 0 → 0, cohort spread 0 → 0. (Before the release existed, that cell
  rendered SMALLER than the same step at 100%, which renders 23/29px on a
  smaller budget — the accessibility slider making tiles smaller.)
- **FILL only scales TYPE, and that is why #152's dead space is not closed.**
  `--tray-grow` (new 2026-09-16, on the QA page, shipped default **0**) is the
  other end: `flex-grow` on the build/listen drop tray. Measured both ends on
  `ja-m34-neo-3?step=11`, iPad Air, 100%: **0 → dead space 51.9%, word 37px,
  cohort height spread 0px; 1 → dead space 23.6%, word 21px, cohort height
  spread 496px.** So the ≤30% target IS reachable and it costs the entire FILL
  budget (the tile #152/#119 are about drops 43%) plus #137 (the tray's ghost
  pre-sizer stretches to the grown tray). Default 0 until Spencer picks: the
  dead-space number and the tile-size number cannot both win here, and which
  one he wants is not a measurement.
- **The equal-rows invariant (#137) has ONE owner: the pass.** For build and
  listen cohorts `tileFit.ts` measures each tile's NATURAL content height (a
  Range over the contents + padding + border — never the tile's own border
  box, which the floor has already inflated, or the row height would ratchet
  up and never come back down) and publishes ONE
  `--tile-row-h = max(tallest natural, --tile-box-h × min(1, scale))` per
  stage+variant cohort. The CSS reads
  `min-height: var(--tile-row-h, var(--tile-box-h))`, so `--tile-box-h` stays
  Spencer's dial and is what renders with no JS. `min(1, …)` is deliberate:
  growth comes from the naturals, never from the floor term, or the floor and
  the FILL budget negotiate forever. Kana/kanji growth lives inside the band —
  `--tile-kana-font` and `--ruby-font` are `em` of the word, so one row height
  still shows a kana-only word big and a kanji word with its reading
  (#117/#119). That is the visible half of #137 and is kept on purpose.
- **MATCH IS IN THE SHRINK HALF AND OUT OF THE GROW HALF** (2026-09-16,
  phase 3 — `fillGrow` in `tileFit.ts`, `Tile.tsx`). Growing a match label
  inside its `--match-tile-h` card is #157, the founder's own b17 dial, and
  stays forbidden. Excluding the variant from FILL *altogether* was the 2A/2B
  reading and it cost 103px: on `ja-m3-neo-5?step=23` at 125% the English
  gloss wrapped to three lines, the grid's `minmax(min-content, 1fr)` rows
  burst the card ceiling, and nothing could give the row back. Measured on the
  15 Pro Max, before → after: overflow **103 → 0** at 125% and **140 → 0** at
  140%; cohort row spread **30% → 0%** and **63.8% → 0%**; label 20 → 16px and
  21 → 15px; 100% is byte-identical (17px, 82px rows, 0 overflow) because a
  stage that is not scrolling never enters the shrink branch. The alternative
  — giving `match` the absolute, de-scaled WIDTH floor — was measured on the
  same device and reaches 0 overflow on that route too, at 16px/15–16px, but
  leaves **3px** of overflow on `ja-m34-neo-3?step=17` at 140% where
  shrink-only leaves 0. A stage whose tiles are ALL shrink-only takes ceiling
  1, so `rec.fill` cannot climb to 1.25 and then have to walk back down.
- **THE WIDTH FLOOR RIDES THE SLIDER ONLY FOR A TILE FILL CAN RESCUE**
  (2026-09-16, phase 3). §8's two-floor rule — the WIDTH floor rises with the
  accessibility slider, the FILL floor does not — is right for a full FILL
  participant: ask for bigger text, and if the stage then runs out of room the
  fill half takes it back. A tile with no fill half has nothing to take it back
  with, and there are exactly two: `match` (shrink-only, and the shrink half
  only fires when the stage actually SCROLLS, which a roomy stage never does)
  and the `image` tier (out of FILL entirely — an `aspect-square` card's height
  comes from its width, so growing the word can only steal room from the art).
  Both now take the absolute, de-scaled floor — the px Spencer dialled, at
  every slider position. Measured: `ja-m3-neo-5?step=23` on the **iPad at
  125%** went from **25%** row spread (0px overflow — nothing was scrolling, so
  the shrink half never fired) to **0%**; `ja-m34-neo-3?step=17` at 140% went
  3px → **0px**; and `ja-m34-neo-6?step=4` (word-image MCQ) at 125% stopped
  overhanging its box by **7.04px** and reporting `clipped` (font 20 → 18px;
  ES/FR siblings hold at 24px, 0 wrap/clip/overflow/spread). The cost, stated:
  on those two tiers the slider no longer raises how small a label may shrink
  before wrapping.
- Wired via the `Tile` primitive, so it reaches **every view that renders
  `Tile`** — **14 of 34 since 2026-09-16 (phase 3)**: `BuildSentenceStepView`,
  `ListeningBuildStepView`, `MatchPairsStepView`, `MultipleChoiceStepView`,
  `ParticleClozeStepView` (phase 2A's five) plus
  `ListeningComprehensionStepView`, `WordImageMcqStepView`,
  `DialogueSimStepView` (its choice replies in 2B, its BUILD BANK in phase 3),
  `KanjiReadingStepView`, `ConjugationTransformStepView` and
  `SortableBuildTiles` (2B), plus `FillBlankStepView`,
  `AgreementChainStepView` and `GenderSortStepView` (phase 3 — three more
  hand-written build tiers, `px-5 py-2.5 text-2xl` / `px-3 py-1.5 text-lg`
  twice, all now `variant="build"`). The rest still run their own unmeasured
  sizing.
  **Deliberately NOT migrated, with the reason:** `TranslateStepView` renders
  no option tiles at all (typed answer only); `AgreementClozeStepView`'s
  options are `inline-flex` choices INSIDE a prose sentence, so a block-level
  tile would break the line flow (measured: 0 `[data-tile]` on
  `es-m12-4?step=12`, by design); `SpeakingStepView` renders a reference card
  and a mic, no tile bank; `GenderSortStepView`'s in-BUCKET chips stay chips
  (`px-2 py-0.5 text-base`) — making a placed word tile-sized is a product
  change, not a migration. **`fill_blank` is authored in ZERO lessons across
  the four shipped courses** (checked against `src/pub/content/v1`), so that
  migration is covered by the unit suite and the Chromium gate only and has
  never been rendered on a device. **Any tile claim must name which views it
  covers.** Three private fit systems died with those migrations —
  WordImageMcq's `clamp(1rem,17cqw,1.5rem)`, KanjiReading's and
  ConjugationTransform's `clamp(1.125rem,6cqw,1.5rem)` — none of which any
  probe in the sweep could see. Floor/ceiling arithmetic, the per-tier pair,
  the a11y floor rule, the two-way fill, the row cohort and the T3
  clipped-label measurement all have unit coverage in `tiles/tileFit.test.ts`.
- **THE OPTION TIER IS PICKED BY ONE RULE, NOT PER VIEW** (2026-09-16).
  `steps/optionTier.ts` owns it: a grid is a WORD grid when **no option
  contains whitespace** — not when every option is short. The 8-character cap
  it replaces demoted a 2×2 grid of single Japanese words to the left-aligned
  prose tier the moment one option was 9+ characters (`ありがとうございます` is
  10), which is #156's screenshot. A sanity cap remains (16 wide-script
  glyphs / 24 Latin, both well above anything authored) because past it the
  "word" is a mis-authored sentence with its spaces eaten. One tier for the
  whole grid, decided by the longest option — never per option.
- **Three tiers were added for shipped layouts the existing ones mis-fit**,
  each a transcription of the class string it replaced, each measured:
  `row` (a full-width prose row in a stacked list — putting the
  listening-comprehension answers on the MCQ cell's `sentence` tier took its
  22px type and 20px block padding and made the overflow WORSE, 198px → 242px
  at 125%; on `row` it is 82px), `image` (WordImageMcq's `aspect-square`
  word-over-art card, where the `word` tier's 32px block padding would leave a
  130px phone card 66px for a word AND its art) and `reading` (a 2–4 glyph
  kana reading / conjugated form in a 56px row, shared by `kanji_reading` and
  `conjugation_transform`, whose palettes were already identical).
- CJK-specific: tiles must use `white-space: nowrap` (what `tileFit.ts` sets)
  or `word-break: keep-all`, never rely on `overflow-wrap` — CJK breaks
  between any two characters by default, so there is no "unbreakable string"
  for `overflow-wrap` to protect, and a Japanese label wraps mid-word
  (ばんごは / ん) without one of those two declarations.
- **A content-hugging tile's width budget is its NEAREST `[data-tile-tray]`,
  so never nest a tray row inside a tray row** (TestFlight #185, build 24).
  `SortableBuildTiles` renders its own row; wrapping it in a second
  `<TileTray kind="row">` made the inner row a flex item that shrink-wrapped
  to the tile, the budget became the tile's own width, and the placed tile
  stepped down to the 0.8 floor on every pass (measured: 19px beside 29px
  bank tiles on the device, fit-scale 0.798 in Chromium). The sortable
  element IS the layered row. Pinned by `BuildTrayRowNesting.test.tsx`.
- **NOTHING MOVES OR RESIZES WHILE THE LEARNER BUILDS** (Spencer #184/#185 →
  the lead's ruling, build 25, 2026-09-17 — `spencer-product-sentiment.md`
  Topic 8). Between the first tap and the last tap of the answer, at 100% AND
  125%, on every build step including 12+ tile huge banks: fit-scale, row
  height, tile font, prompt top, bank top and CTA top are all constant. **A
  smaller CONSTANT tile is preferable to a larger one that shrinks.**
  Three mechanisms, all of them removed rather than damped:
  1. **ONE RESERVATION, AND IT IS THE VISIBLE ONE.** The sentence tray
     reserves the FULL answer in its visible ghost row on EVERY bank size
     (`BuildSentenceStepView`, #75). b14 cut that to nothing on huge banks
     (#114/#117 — the reservation overflowed the stage) and b24 to one row
     plus a hidden second copy for the fill pass to price (`data-phantom`,
     `phantomReserve`). Both kept the tray growing, and growth is the defect:
     the fill re-negotiates, the centred step column re-centres by half the
     growth, and the bank walks down. The phantom is deleted — a tray that
     starts at its final height needs no reserve, and #114/#117's overflow is
     paid by the fit rule's own shrink half, once, before the first tap.
  2. **A SPENT HUGE-BANK TILE FADES IN PLACE** (`useHugeBankCollapse`,
     `index.css` `[data-collapse]`): opacity + transform only, box unchanged.
     b24 collapsed it out of flow so the bank could hand back the row the
     tray took; nothing takes that row now, and an out-of-flow collapse moves
     every later bank tile, the bank's height and the column with it.
  3. **A TILE JOINING A COHORT IS BORN AT ITS SIZE** (`tileFit.ts`
     `cohortSizes`, `naturalHeightAtScale`). A placed tile used to register
     before it had ever been measured, so its ink read as a scale-1 natural
     and `--tile-row-h` (a MAX over the stage's cohort) inflated for one
     painted frame.
  Measured, 15 Pro Max, `--simulate build`, all 8 verdicts PASS at 100% and
  125% with `maxH2Jump=0` over the full rAF trace:
  `ja-m15-neo-6?step=15` (13-tile answer, 17-tile bank) — 100%: fit 0.92,
  font 22.26px, rowH 60.5, tray 220.2, bank 192.5, prompt 181.3, bank top
  489.5, CTA 724.3, identical on all 14 samples; 125%: fit 0.638 (the fill
  floor), font 19.29px, rowH 53, tray 202.7, bank 170, prompt 189.4, bank top
  502, CTA 702.5, identical on all 14. `ja-m34-neo-7?step=5` (normal bank) —
  100% fit 1.25 / 125% fit 1.05–1.08, constant per run. **The price, stated:**
  the 13-tile step's tiles are ~8% smaller than b24's at 100% (22.26 vs
  24.19px) and ~10% smaller than b24's END state at 125% (19.29 vs 21.47px,
  and 23% smaller than its START of 25.1px); in exchange the blank stage at
  step start drops from ~143px to 42px at 100% (24px of which is the CTA's own
  `pt-6`) and 30px at 125%, because the tray now occupies the room the fit was
  holding back. At 125% the 13-tile step sits exactly ON the fill floor with
  ~6px of true slack — a longer answer at that slider position has no
  headroom left and will scroll.
  Verified only with the multi-tap simulation (§9), never a single settled
  capture.
- **`listening_build` IS IN THIS RULE** (build 25, 2026-09-17 — P1b). Same
  reservation, same evidence bar. Its tray ghost row already held the whole
  answer; the row also carried `clamp`, i.e. `max-height: 92px` +
  `overflow: hidden` below `sm` in `index.css`, commented "two rows on
  phones". **A listen row is 52.5–109px depending on the fit, so 92px was
  never two rows** — it was 1.26–1.56 of them at fit 1.05–1.25, and the tray
  grew by the remainder the moment the placed tiles took their next row. That
  rule is DELETED; the reservation is the answer's own tiles wrapping into the
  rows they need, and `[data-clamp]` now selects nothing (`TileTray` still
  declares the unused prop).
  **Before, measured** (`ja-m34-neo-5?step=12`, 6-tile answer): 100% — tray
  120 → 182px at tap 4, bank top 459.9 → 490.9, fit constant 1.25, 7/8
  (`chromeStable` FAIL); 125% — tray 126 → 175, fit 1.05 → 0.92, font
  33.94 → 29.73px, rowH 75 → 66.5, 5/8. Chromium DOM probe named the
  mechanism exactly: the ghost row's own `scrollHeight` 126px against a
  clamped `clientHeight` of 92px, and the centred column (`stage-center`)
  moved the prompt/tray up by HALF the growth and the bank down by the other
  half (−17 / +17 in Chromium; −31/+31 on the device's 62px growth).
  **After, measured, 15 Pro Max, `--simulate build`, every applicable verdict
  PASS at both scales, every sampled field identical on every tap:**

  | route (answer) | scale | fit | rowH | tray | bank | prompt | bank top | CTA |
  |---|---|---|---|---|---|---|---|---|
  | `ja-m4-neo-3?step=16` (2, character) | 100% | 1.25 | 89.5 | 117.5 | 89.5 | 296.1 | 490.4 | 724.3 |
  | same | 125% | 1.25 | 109 | 143 | 109 | 249.7 | 503.7 | 702.5 |
  | `ja-m34-neo-5?step=12` (6, word) | 100% | 1.25 | 73 | 182 | 153 | 232.1 | 490.9 | 724.3 |
  | same | 125% | 0.90 | 66.5 | 175 | 140 | 233.2 | 504.2 | 702.5 |
  | `ja-m24-neo-9?step=4` (13, word) | 100% | 0.86 | 55.5 | 210.5 | 243 | 172.9 | 460.1 | 724.3 |
  | same | 125% | 0.638 | 52.5 | 207.5 | 231 | 199.9 | 503.4 | 702.5 |
  | `ja-m42-neo-challenge?step=listening_build` (21, the course's longest) | 100% | 0.798 | 52.5 | 322.5 | 290.5 | 171.8 | 571 | 724.3 |
  | same | 125% | 0.638 | 52.5 | 328.5 | 290.5 | 199.9 | 624.4 | 702.5 |

  **The price, stated.** At 100% on the 6-tile step it is ZERO tile size: fit
  1.25, rowH 73 and fonts 25.25–32.32px are the pre-fix numbers unchanged, and
  the only change is 62px of tray reserved at step start — the room the tray
  used to take at tap 4 anyway. At 125% the 6-tile step lands on its pre-fix
  END state from tap 0 instead of walking there (fit 0.90 vs 0.92, rowH 66.5
  both, font 29.09 vs 29.73): −14% against the pre-fix START (33.94px), −2%
  against the pre-fix END. Long answers are paid for by the fit rule's shrink
  half at step start, once: 13 tiles shrinks to 0.86 at 100% and to the 0.638
  fill floor at 125%; 21 tiles sits on the WIDTH floor (0.798, 20.63px) at
  100% and the fill floor at 125%.
  **What the reservation costs a LONG answer, and the number to decide on.**
  The step column's CTA block is sticky at the bottom of the scroller, so the
  usable column above it is `ctaTop − stageTop` = 565px at 100% / 519px at
  125%. `tray + bank` for the 21-tile answer is 613px at 100% and 619px at
  125%, so **137px of the bank (two rows) sits behind the sticky CHECK block
  at rest at 100%, and 212px at 125%** — a 157px / 237px scroll away, with the
  scroller's native bar as the cue (`keep-native-scrollbar`, `LessonShell`).
  The 13-tile answer is clear at 100% (21px of slack) and 32px under at 125%.
  Everything ≤ 6 tiles is clear at both. From the bundled JSON, JA has 698
  `listening_build` steps: 7 with answers ≥ 13 tiles (1.0%) and 14 with ≥ 12
  (2.0%). This is not new debt — pre-fix those same steps hid the bank behind
  CHECK by the END of the build instead of from the start, while moving
  everything on the way (that is #114/#117's own complaint) — but it IS the
  case where "nothing moves" and "everything visible" cannot both hold at
  today's floors. The levers are Spencer's `--tile-font-floor` /
  fill-floor dial (§8) and a row-expressed tray cap with an INTERNAL scroll
  (constant height, reachable content — unlike the deleted `overflow: hidden`
  clamp). Not chosen by this lane.
  **`stageFits` does not catch this** (disclosed, not fixed): it compares the
  bank's bottom against the STAGE box's bottom, and the stage box extends
  behind the sticky CTA — 870px at 100% vs the CTA's 724.3. Only the 21-tile
  route at 125% trips it (bank bottom 914.9 vs stage bottom 863, +51.9, at
  EVERY tap including tap 0 — a stage that does not fit before the first tap,
  not a growth defect). A "bank bottom vs sticky-CTA top" verdict is the
  honest version and is unbuilt.
  **`ListeningBuildStepView` renders no `<h2>`,** so `h2Stable` and
  `noFlicker` (both read `h2Top`) report **N/A** on these routes, not PASS —
  see §9. The live prompt verdict there is `promptStable`: the view marks its
  prompt paragraph `data-lesson-prompt` and `simProbe`'s `PROMPT_SELECTOR`
  matches either shape. Pinned by `BuildTrayRowNesting.test.tsx` (full-answer
  ghost row, no `[data-clamp]` in the markup, no `max-height` clamp rule left
  in `index.css`) and `simProbe.test.ts`.

---

## 4. The height chain rule — ONE chain, not three

1. **Shell level — the only sanctioned `dvh` use.** `FITTED_SHELL_HEIGHT`
   (`src/shared/layout/fittedShell.ts:21-22`) —
   `h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]`. This is the
   shared height primitive for `LessonShell` and (below `md`) `ReviewShell`.
2. **Inside the shell — `cqh`, never raw `vh`/`dvh`.** `LessonShell`'s
   scroller sets `[container-type:size]` (`LessonShell.tsx:~135,141`); every
   size inside reads `cqh` against that container: `--stage-tail: 10cqh` /
   `5cqh` under a short viewport (`index.css:925,996`), the match-grid clamps
   (`index.css:1479-1580`ish, "8+ `clamp()` rules... `cqh` appears in all 8
   match-tier selectors" per `BuildSentenceStepView.tileTokens.test.tsx`).
   `cqh` is confirmed **live and correct as a rule**, not a ghost — the
   brief's suspicion that it might be dead was checked and ruled out.
3. **SUSPECTED ROOT CAUSE (unconfirmed) — do not ship a new `cqh`-derived
   number until it is settled.** Hypothesis from the founder's device
   screenshots: the scroller's visible box measures ~200px shorter on-device
   than in Chromium or Playwright's WebKit, i.e. `cqh` over-reports there.
   2026-09-15 evidence AGAINST: `npm run sim:capture` on the 15 Pro Max
   simulator measured `stageOverReportPx` = 0 at both 100% and 125% font
   scale (step 11 build, step 16 MCQ); the tile-fit lane could not reproduce
   it either. The metric (scroller `clientHeight` − on-screen intersection)
   now ships so the hypothesis can be tested on the founder's phone. This is the shared root cause behind two of the three
   most recent WKWebView-only defects (a match grid clipped with 200px dead
   space below it; an MCQ label wrapping only on-device). Fix belongs in
   `LessonShell.tsx`'s `[container-type:size]` chain / `fittedShell.ts`, not
   in another per-view patch — out of scope for this doc (docs-only), noted
   here so it isn't lost.
4. **`--card-max-h` — CLOSED 2026-09-16 (phase 2B), as `85dvh`.** It was raw
   `vh`, consumed by `LessonOverlayCard.tsx`, and tracked here as drift rather
   than a decision. It is now a decision, and the decision is that cards are
   **exempt from the `cqh` chain and not exempt from the unit rule**. The card
   is `position: fixed; inset: 0` — the viewport IS its containing block, so a
   viewport unit is the right family for it; what was wrong was which one.
   `vh` resolves against iOS's LARGEST viewport (URL bar retracted), so `85vh`
   can be taller than what is on screen — the same unit bug as #158. `dvh` is
   what `FITTED_SHELL_HEIGHT` already uses. NOT `cqh`: the nearest size
   container is the stage scroller, so `cqh` would cap a full-screen modal at
   85% of a 679px stage instead of 85% of a 932px viewport (−215px on a 15 Pro
   Max) and make the cap move whenever the stage's chrome did.
5. **Any other per-view `vh`/`dvh` height that isn't `FITTED_SHELL_HEIGHT`
   itself is a defect class, not a one-off.** `LessonComplete.tsx`'s old
   `min-h-[60vh]` (fixed 2026-09-15, TestFlight #158, replaced with centering
   inside `FITTED_SHELL_HEIGHT`) is the template fix to reapply anywhere else
   a raw `vh`/`dvh` shows up in the lesson tree.

---

## 5. Touch floors

- **24×24 CSS px** — WCAG 2.2 SC 2.5.8 (AA), with the spacing exception, is
  the floor this app uses. **Not** 44pt/44px (Apple HIG / WCAG 2.1 AAA) —
  that's a deliberate, documented choice (`CLAUDE.md`), correct and
  defensible, restated here so it isn't re-litigated per surface.
- Floor in **px, not rem**: `--font-base` drops to 15px on short desktops
  (`index.css:48-52`), so a rem-denominated floor silently measures under
  24px there.
- **`--tile-box-w` — the width floor. SHIPPED 2026-09-16.** (This bullet used
  to read "gap not stated in ANY existing spec".) Height cleared both 44pt and
  24px since b17; width had no floor at all, so on the 15 Pro Max a one-mora
  tile measured **29px** (ES `y`) / **41px** (JA `で`) beside a 285px sibling —
  WCAG-legal and still reads as a mistake (#119, "squat" tiles). Material's
  answer to the same problem is a minimum width on the chip with the label
  centred, which is what this is:
  - `--tile-box-w: 44px` on all three tiers — the Apple HIG target — applied as
    `min-width` to build and listen tiles.
  - the **12+ (`huge`) tier takes `max(24px, calc(var(--tile-box-w) * 0.8))`**
    ≈ 35px: a 27- or 45-tile bank cannot spend 44px on every particle without
    buying a row, and buying a row on a stage that already overflows is the
    worse defect. That is "44px where the row allows", in CSS.
  - the `max(24px, …)` is the guard — no dial of `--tile-box-w` can put a tile
    under the WCAG 2.2 SC 2.5.8 floor.
- `--tile-gap` is 5.5px on phones. That passes the WCAG spacing exception
  (36.5 + 5.5 = 42px between centres > 24px) but is below every published
  touch-target spacing recommendation (Material: "8dp of space or more"); a
  5.5px gap between two draggable tiles is a plausible contributor to
  mis-taps independent of any single tile being individually correct.

---

## 6. Ruby policy

- **Current shipped:** `--ruby-font: 0.62em` on phone/tabletPortrait, `0.55em`
  on `sm` (desktop/landscape iPad).
- **The floors are PX as of 2026-09-16** — `--ruby-floor-romaji` 12px on every
  tier, `--ruby-floor-kanji` 12px / 10px (`sm`) / 12px. They were `0.75rem` and
  `0.625rem`, i.e. they tracked the root font the accessibility slider
  multiplies by 0.85–1.4 **while `--tile-font` beside them did not**. Measured
  on the 15 Pro Max: the kanji word held at 23px through 100/125% and fell to
  22px at 140% (FIT shrinking it), while the reading floor went 12 → 15 →
  16.8px — so the reading:word ratio ran **0.62 → 0.65 → 0.76**, Spencer's #87
  exactly inverted, by a unit rather than by a dial. In px it is 0.62 at every
  slider position. The values are what the rem resolved to at root 16px, so
  100% is byte-identical to what shipped. **`--ruby-font` and
  `--tile-kana-font` stay `em`** — they are supposed to ride the word (#87).
- **Standard:** W3C Simple Ruby §3.1 — ruby text defaults to 50% of the base
  character size.
- **Spencer's #87 rule (binding, restated in `spencer-product-sentiment.md`
  Topic "Tiles and sizing"): "we didn't shrink the furigana small enough
  here and instead shrunk the other hiragana and kanji, needed to be the
  other way around" — never shrink the WORD to hold a box height; shrink the
  reading first.**
- There is headroom between the current 0.62em and the 0.50em standard —
  offered here as a citable number for the next furigana-vs-word tradeoff,
  not as a restated recommendation to change it. Spencer's own floors
  (`--ruby-floor-romaji`/`--ruby-floor-kanji`, both 12px on phone) are the
  binding readability minimum and stay as-is regardless of the ratio.
- **WHERE THE 0.62 STOPS HOLDING, MEASURED (2026-09-16, phase 3).** The ratio
  is 0.62 while `0.62 × word ≥ 12px`, i.e. while the word is **≥ 19.4px**.
  On a DENSE bank the equal-rows rule plus FILL takes the word well below
  that, and then the absolute floor — not the ratio — decides: measured on
  the 15 Pro Max, `ja-m42-neo-challenge?step=15` at 100% renders its kanji
  tiles at a **15px** word, so the reading is `max(0.62 × 15, 12) = 12px` and
  **reading:word = 0.80** — above the 0.67 the b13 fix landed on and close to
  the 0.88 Spencer called "too big" (#87). It is not a unit bug this time
  (both numbers are px) and it is not the reading growing: it is the WORD
  shrinking under the ratio's feet. The lever is the floor itself —
  `--ruby-floor-kanji: 12px → 10px` on the base tier makes the same tile
  **0.67**, and `sm` has shipped at 10px since b13 — and it is Spencer's dial,
  so it is a numbered decision, not a fix (see the phase-3 report §7 and
  `docs/user-feedback/2026-09-15-testflight-b20.md` §6).

---

## 7. Safe-area rule

`*-safe` Tailwind utilities (`max(env(safe-area-inset-*), fallback)`) apply
to every surface that renders without `Layout`'s header chrome — the lesson
player is the one surface that must opt in explicitly (it doesn't inherit
the header's safe-area handling for free). `viewport-fit=cover` is set at
`index.html:63`, required per WebKit's iPhone-X design note.

Chromium reports `env(safe-area-inset-*)` as `0` natively, so
`tests/mobile/_seed.ts` pushes real per-viewport insets over CDP. That
verifies the CSS wiring is correct. **It cannot verify WKWebView's full-bleed
behavior** — the class of bug where the utilities exist and are applied but
the header still sits under the Dynamic Island in practice on the actual
built bundle — that needs a device/simulator check per §10.

---

## 8. The accessibility font-scale rule

All tile type is expressed in **em of `--tile-font`**, one px value dialled
per tier, so the user's accessibility font-size slider (85%–140% at 5% steps,
`SettingsSectionPanel.tsx:339-341`, applied as
`root.style.fontSize = calc(var(--font-base) * scale)`,
`ThemeContext.tsx:233-238`) scales every tile type uniformly instead of
tokens drifting independently.

**Why this matters — the arithmetic behind it (from the best-practice
research pass):** the token registry mixes units — 12 px tokens, 16 rem
tokens, 2 em tokens, 10 unitless ratios, 1 `vh` token
(`tileSizingTokens.ts`). rem tokens track the font slider; **px tokens do
not.** At the slider's 140% end, `--option-font` (1.375rem) scales to 30.8px
and the MCQ `word` tier's literal 1.875rem scales to 42px, while `--tile-font`
stays a flat 18.3px and `--tile-box-h` stays a flat 45px — one lesson can
render a 42px MCQ word above an 18.3px build word in the same 45px box. No
single px value is correct for two different root font sizes; the fix is one
unit basis (em of `--tile-font`) for type, px for box floors, never rem
inside the tile system (rem is what decoupled type from boxes under the
slider in the first place).

### The slider reaches tile type again — 2026-09-16 (phase 2B)

For one afternoon it did not. Phase 2A px-denominated the whole tile system
(the Class C conversion above), which is what stopped a tile's BOX and its WORD
drifting apart under the slider — and, as a side effect, froze 85–140% on every
tile. That is a WCAG 1.4.4 loss for exactly the user who moved the slider.

**The fix is ONE unitless multiplier, not `rem` put back token by token.**
`ThemeContext.tsx` writes `--tile-a11y-scale` onto `:root` beside the
`root.style.fontSize` it already writes; `index.css` defines
`--tile-type-scale: calc(var(--tile-fit-scale) * var(--tile-a11y-scale, 1))`
on `[data-tile]`, and every `font-size`/`line-height` in the TILE PRIMITIVE
block reads THAT. Boxes keep the bare fit scale (the particle tier's `height:`
is the only box that rides a scale at all), so padding, gaps and the 24px tap
floor stay px. The box still follows the word, through the measured #137 row
height (`max(natural heights, --tile-box-h)`) — the naturals grow with the
type.

**Two rules make it safe, and both were measured into existence:**

1. **The floor does NOT ride the slider; the declared size and the ceiling do.**
   A floor is "how small is too small" — an absolute readability number, not a
   target — so `readFitRatios` divides the floor ratio by the slider when the
   slider is above 100%. Measured on `es-m34-10?step=4` at 125%: with a scaled
   floor the four Spanish sentence options could not shrink below 22.5px and
   the step overflowed by **232px**; de-scaled they reach the dialled 18px and
   the overflow is **35px — exactly what it was before the slider reached tiles
   at all**. Below 100% the floor comes down with the slider, or FIT has no
   room and labels wrap instead of shrinking, which is the order backwards.
2. **The result: restoring the slider cost ZERO extra overflow.** Every route
   re-shot at 125% and 140% is within 3px of its phase-2A number.

**What that buys and what it does not.** Where a stage has room the slider now
works — `ja-m3-neo-5?step=12` renders its word at 22 / 27 / 31px at 100 / 125 /
140%, `ja-m34-neo-3?step=12` at 16 → 20px, `ja-m11-neo-4?step=1` at 30 → 38px.
Where a stage is already full, FIT/FILL hold the tile at the same absolute
floor at every slider position, so the slider does nothing there — and on a
step whose non-tile chrome is `rem` (a prompt band, a transcript) the tile can
even end up SMALLER at 125%, because that chrome grows and the tiles pay for
it. `es-m34-10?step=4` is the measured case: 21px at 100%, 18px at 125%, while
its prompt band goes 84px → 140px. Tile type and prose type are on two
different systems by design; on a full stage they compete.

**Standards note, offered as context, not a target:** Apple's own guidance
is to support enlarging text by at least 200%, and WCAG 1.4.4 requires text
resize to 200% without loss of content/functionality. This app's slider tops
out at 140% — worth knowing before claiming full accessibility-text support
in a store listing; not a change being made by this doc.

---

## 9. Measurement protocol — what counts as verified

A sizing claim is **verified only if BOTH** of the following are true. Either
one alone is not a measurement.

**For anything the learner INTERACTS with (build/listen trays, spent-tile
collapse, any fit that could re-run after a tap), a settled capture is not a
measurement either** (Spencer, TestFlight #185, 2026-09-17: "the dynamic
resizes are bad and they need user simulation"). Run
`npm run sim:capture -- --route <route> --viewport 15-pro-max --font-scale
100 --simulate build` (and at 125): it taps through the answer (tap count
resolved from the bundled JSON; `--max-taps` overrides), prints one row per
tap (tray/bank height, fit-scale, tray and bank font ranges, row height,
prompt top, bank top, CTA top),
the verdicts `fitScaleStable`, `trayBankFontEqual`, `rowHStable`, `h2Stable`,
`promptStable` (the prompt's own rect top, 1px — the stage's `<h2>` on a
`build_sentence` route, the `[data-lesson-prompt]` paragraph on a
`listening_build` one, which has no `<h2>`), `chromeStable` (bank
top + CTA top, 1px — build 25: a growing tray pushes the bank without
touching the prompt, so neither number is implied by the other),
`noFlicker`, `stageFits`, a per-tap rAF frame trace (`fontDipped`,
`transformSettledMs`, `fitScaleChanged`) and one settled screenshot per tap
composed into `<capture>.taps.jpg`. A build-step claim needs those verdicts
green at both slider positions. **A verdict whose field no sample carries
prints `N/A`, never PASS** (build 25 / P1b): `<field> not sampled in any tap`.
It cannot fail a run either — an absent field is not a failure, it is a claim
the run is not entitled to make. This applies to `fitScaleStable`,
`rowHStable`, `h2Stable`, `promptStable`, `chromeStable` and `noFlicker`
(whose flicker metrics are `h2Top` deltas). **On a `listening_build` route
`h2Stable` and `noFlicker` are N/A** — that view renders no `<h2>`, and both
had been printing green for an element that was never on screen; the live
verdicts there are `promptStable` (the `[data-lesson-prompt]` paragraph) plus
the per-tap frame table. A field present at tap 0 and gone later is still a
FAIL, not an N/A. (`simctl io screenshot` costs ~386 ms, so
per-frame screenshot bursts are opt-in `--frame-burst` and their timestamps
are real, not nominal.)

1. **`npx playwright test --project=mobile`** is green. This is the
   Chromium (`devices["Desktop Chrome"]`, DPR 1) DOM-geometry regression
   gate at 430×932 (`--touch` viewport) — necessary, and proven
   **insufficient alone**: three 2026-09-15 misses (a wrap-only-on-device
   MCQ label, a clipped match grid, a kanji-reveal defect) all passed both
   Chromium and Playwright's own WebKit build and only failed on-device —
   "Desktop WebKit ≠ WKWebView on iOS here." Use this gate for **layout
   logic** (dead-space budgets, safe-area wiring, structural regressions),
   never as sole proof of a device-rendering claim.
2. **Measured on the 15 Pro Max simulator (or a real device)** via
   `scripts/ux-loop/sim-capture.mjs` + `src/shared/dev/simProbe.ts`, at
   **both** font scale 100% and 125% — not the harness's default state,
   which is every setting at its default (no SRS state, no accessibility
   font scale), which is exactly the configuration Spencer's phone is never
   in. This is the memory rule `ios-simulator-sizing-harness` and the
   Spencer decision in `spencer-product-sentiment.md`: *"Measure on his
   phone, not Chromium. 15 Pro Max simulator, real WebKit, real SRS state."*
   Before capturing: dismiss the cookie banner; `?step` is **0-indexed**.

**AND ONE WAY THE CHROMIUM GATE PASSES VACUOUSLY** (2026-09-16, phase 3): a
git worktree does not inherit the main checkout's untracked files, so a
worktree has **no `.env`**. The public mobile server boots the Auth0 provider
without `VITE_AUTH0_DOMAIN` and `/try`, `/get-started`, `/settings` and
`/ja/vocab` throw during render — and a page that throws exposes no tap
targets and no DOM to nest wrongly, so those routes' assertions pass by
finding nothing. Run the gate as
`VITE_AUTH0_DOMAIN=… VITE_AUTH0_CLIENT_ID=… npx playwright test
--project=mobile` in a worktree; dummy values are enough. Doing so on
2026-09-16 surfaced 6 pre-existing failures (tap-targets on `/settings` and
`/ja/vocab`, a `<div>`-in-`<p>` render error on `/ja/vocab`) that the missing
file had been hiding.

**TWO CELLS THIS PROTOCOL STILL CANNOT REACH** (2026-09-16, phase 3 — both
verified against the harness, neither is a claim about the app):

- **`--orientation landscape` does NOT reach the `sm` tier.** The harness has
  no rotation path (`simctl` has no orientation subcommand and refuses a
  swapped `screenConfig geometry` pair; Simulator.app is not installed) and
  emulates with a `<meta name="viewport">` `width=1180, height=820,
  initial-scale=<fit>`. WebKit takes the WIDTH and ignores the height, so the
  layout viewport comes out **1180 × 1698** — still taller than it is wide, so
  `@media (orientation: portrait)` matches and the tokens resolve to
  **`tabletPortrait`, not `sm`**. Proof from the capture, not from reading the
  code: `ja-m34-neo-3?step=11` renders its word at **37px** = tabletPortrait's
  `--tile-font-ceiling` 36.8px (`sm`'s is 25.5px), and its kana/kanji font
  ratio is 47/37 = **1.27** = tabletPortrait's `--tile-kana-font` 1.28em
  (`sm`'s is 1.2em). So an "emulated landscape" capture is a valid measurement
  of **a 1180px-wide portrait tablet** (a real, previously unmeasured cell —
  Split View, wide portrait) and is NOT a measurement of landscape iPad. The
  `sm` tier remains unmeasured on a device, as it has been since phase 1's G5.
- **`--seed kanji-mastered` cannot render a reading-HIDDEN tile.** The renderer
  hides a stamped reading only when the window is closed **AND** the atom is
  FSRS-mastered (`kanjiFuriganaSrsVisible`, `AnnotatedText.tsx`), and the seed
  writes SRS card state only for `dueAtomIds`, which is `[]` for that profile
  (`vite.config.ts`, the `/__sim` middleware) — it seeds unlocks and lesson
  progress, not mastery. Measured: `ja-m42-neo-challenge?step=15` with the
  seed renders all five of its kanji tiles WITH readings (店みせ, 行いった,
  遊あそぶ, 来くる, 食たべる). The `#117`/`#119` reading-hidden shape is
  therefore still unrendered by the harness after three phases. The nearest
  thing it CAN render is a `kanji_reading` step, whose reading is
  structurally suppressed by the factory (`surface === reading === kanji`).
  Fix, when the harness lane wants it: write mastered-interval SRS records for
  `atomIds` under the `kanji-mastered` profile.

**Why the WebKit-desktop shortcut doesn't work:** Playwright's own docs say
its WebKit build tracks WebKit main, not shipping Safari, and driving the
simulator with `safaridriver` drives **Safari**, not the Capacitor WKWebView
— neither is a substitute for step 2. Appium's XCUITest driver is the only
tool that attaches to the app's own webview, and it needs
`isInspectable = true` plus a WebDriverAgent boot per run; not wired into
this repo's tooling today.

**What tooling exists today:** the harness in step 2 (`safaridriver -p 4444`
+ `sim15/wd.mjs` + `measure.mjs`, then the real Capacitor app shell via
`CAP_DEV_SERVER` + `cap sync` → `xcodebuild -sdk iphonesimulator` → `simctl
install/launch/screenshot`) is assembled fresh in the session scratchpad each
time it's needed — it is not a single committed command and is not in
`package.json`. Recipe today: `docs/handoff-2026-09-11-mobile-qa.md:183-186`.
Committing it as a reusable script is future work, not done by this doc.

**Recommended additions to the probe (not yet built — from the best-practice
pass, recorded here so the next sizing lap doesn't re-derive them):**
`rootFontPx`, `fontScale`, `notoLoaded` (`document.fonts.check('30px "Noto
Sans JP"')` — Noto Sans JP loads with `font-display: optional`, which on a
slow/cold load falls back to Hiragino Sans for the rest of the session,
changing ruby-band height and glyph widths from what any number here was
dialled against), and `emRatio` (a hidden 5-kana probe span's width ÷
`5 × rootFontPx` — exact for CJK, since every kana/kanji glyph is a 1em
advance).

---

## 10. History — the dial-in rounds

Traced via `git log`/`git show` because most of the five nicknamed rounds
are cited by hash or partial diff in feedback docs, never all together in
one place. Two of the five have **no Spencer-facing write-up anywhere** —
this table is that write-up.

| round | commit | date | documented elsewhere? |
|---|---|---|---|
| dial-in #1 (best match) | `3e1b7f07` | 2026-09-14 | Yes — `docs/user-feedback/2026-09-14-testflight-b12.md:33`, RCA §2.1 |
| dial-in #2 (best match, "second mobile dial-in") | `a8624814` | 2026-09-15 | Yes — `docs/user-feedback/2026-09-15-testflight-b20.md:281,283-288` |
| **equal rows** | `5e35c4d8` | 2026-09-15 | No — zero mentions in any b13/b14/b15/b18/b20/RCA doc; only inferable from the build-17 tag commit message. Recorded here for the first time. |
| desktop restatement | bundled in `a8624814` | 2026-09-15 | Partially — b20 covers only the mobile-facing side-effect (`--match-tile-h`), never this half on its own terms. `index.css:198-222`'s comment is the primary record: "the first dial-in had let mobile furigana sizes leak to desktop," restated desktop `sm` block in full. |
| **tablet tiers** | `1185c2c7` | 2026-09-15 | No — `docs/user-feedback/2026-09-15-testflight-b18.md` mentions "b18 iPad Phase B" once in passing and contains zero token values or a mention of this commit. Recorded here for the first time. Shipped the `tabletPortrait` block (§1) and the iPad form-factor plumbing. |

Five supersessions of the tile-sizing subsystem landed in one day
(2026-09-15): old one-row-per-tier CSS → single-dial base/sm
(`index.css:57-127`, b16, TestFlight #137) → dial-in #2 (`a8624814`) →
"equal rows + desktop pass" (`5e35c4d8`/`44000589`) → desktop `sm` restated
in full (`index.css:198-222`) → `tabletPortrait` added (`1185c2c7`,
`index.css:242-330`). None of that sequence was captured anywhere but the
running `docs/handoff-2026-09-11-mobile-qa.md` ledger (history, not a spec)
until this document.

---

## 11. Superseded by this spec

| file:line | what it claimed | superseded by |
|---|---|---|
| `CLAUDE.md:271-273` | `tests/mobile/` is "the only layout authority" | §9 — two-part bar (Chromium gate + simulator numbers); see §12 for the CLAUDE.md fix itself |
| `CLAUDE.md:283` | "Don't size step content with dvh arithmetic" (no shell exception stated) | §4 — shell/step distinction now explicit |
| `docs/mobile-ui-testing-2026-08-09.md:15-17` | "mobile UI correctness is asserted by `tests/mobile/`... The simulator... [is] not for layout" | §9 — the 2026-09-15 misses (#156/#157/#161) prove simulator/device measurement IS required for layout claims Chromium cannot see |
| `docs/mobile-ui-testing-2026-08-09.md:185-220` (§7 "known gaps", B094: CI runs `MOBILE_PUBLIC_ONLY=1`, 2 of 35 routes) | implicitly, by never being caveated in CLAUDE.md, reads as closed/minor | still open as of 2026-09-15; not fixed by this doc, flagged so it isn't lost again |
| `docs/mobile-research-2026-07-20.md` (whole doc; see its own superseded marker) | 44px tap-target floor as current; "no safe-area handling at all"; `dvh` banned without the shell exception | §5 (24px is current), §7 (safe-area shipped, with the caveat), §4 (shell dvh is the sanctioned exception) |
| `docs/qa/tile-sizing.json` (`--tile-box-h`, `--tile-big-scale`, and generally "predates this change... NOT re-verified", per its own `_note`) | current mobile/desktop token values | §2 — ground truth is `src/index.css`; see §12 for the regeneration list |
| `docs/spencer-product-sentiment.md` Topic 1 body | reads as live guidance without a pointer to where the numbers actually live today | this spec now holds the numbers; Topic 1 keeps the *why* (his own words) and is marked accordingly |
| `src/index.css:909,981` (code comments) | cite `CLAUDE.md § "Lesson UI stability rules"` | that section doesn't exist in current `CLAUDE.md` (ghost, audit §5.2) — out of scope for this docs-only pass (`src/**` excluded), flagged here so a future code lane fixes the two comments |

---

## 12. `docs/qa/tile-sizing.json` — REGENERATED AND RATCHETED (2026-09-16)

This section used to be a list of fields somebody had to go and re-save. It is
closed. The file was regenerated from `src/features/lesson/dev/tileSizingTokens.ts`
(which mirrors `src/index.css` token for token) and a test in
`src/features/lesson/components/tiles/tileFit.test.ts` now asserts, for all
three tiers, that every registry token appears in the JSON at exactly
`value + unit` **and** that the JSON carries no key the registry does not —
so "the JSON is stale" is no longer a state this file can reach silently.

What that closed, item by item, against the old list:

- **`--tile-box-h`** — JSON read mobile 32px / desktop 0px against a shipped
  45/51/50.5px. Now correct on all three tiers.
- **`--tile-big-scale`** — a dead token (removed from the CSS at b16.3) that
  the JSON still listed. Dropped, and the new "no key the registry does not
  have" half of the ratchet is what stops the next one.
- **`--listen-font-scale`** — now 1.103825 on `base`, matching `index.css`.
- **Missing `tabletPortrait` section** — present, all 42 tokens.
- **The blanket "every field predates this change" caveat** — gone with the
  regeneration; the `_note` in the file now records that it was generated from
  the registry rather than saved from a QA-page session, which is the one
  thing a reader still needs to know.

Two things this does NOT claim. The file is a mirror of the registry, not of a
Spencer dial-in session: if he dials on `/:lang/qa/tiles` and Saves, his values
land here and the ratchet will then fail until the registry and `index.css` are
updated to match — **that failure is the point** (it is the "he dialled
something and nobody shipped it" case, made loud). And `--card-pad` /
`--card-max-h` are carried but are not tile-box tokens; `--card-max-h` is
`85dvh` since 2026-09-16 and §4 item 4 is closed rather than tracked.
