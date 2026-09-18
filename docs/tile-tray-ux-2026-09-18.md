# Tile tray UX: ghost, reserve, annoyance — 2026-09-18

Positions from the lead, confirmed/refuted against code (`BuildSentenceStepView.tsx`,
`tileFit.ts`, `index.css`), `docs/mobile-sizing-spec.md`, and
`docs/spencer-product-sentiment.md` Topic 8. WebSearch budget was exhausted
session-wide before this lane started; external citations below came from
WebFetch on named URLs (verified) or training knowledge (flagged unverified).

## P1 — Remaining tiles never move

**Verdict: CONFIRMED, already shipped, no gap.**
`bankTiles = seededShuffle(step.tiles, step.id)` is a fixed array rendered
by index (`BuildSentenceStepView.tsx:351-360,974-1010`); a tap only flips a
`state` prop, never reorders/filters the array — comment on the same lines:
"Position-stable tile bar: render every bank tile in its shuffled order,
never reflow." Spent tiles keep box/width/height (`index.css:2232`,
`opacity:0.4`, disabled); huge-bank (≥12) spent tiles additionally fade to
`opacity:0` in place (`[data-collapse="done"]`, `index.css:2244`) —
"the box keeps its width, height, padding and border... no other tile
moves" (comment, `index.css:2238`). `MatchPairsStepView.tsx` uses the same
fixed-grid-plus-opacity pattern. Pinned by
`BuildSentenceStepView.hugeBankCollapse.test.tsx` ("writes no inline
geometry — the collapsed tile keeps its footprint"). Spencer already ruled
this exact thing build 25, 2026-09-17 (`spencer-product-sentiment.md` Topic
8: "no visible re-fit during a build").
Evidence for *why*: Fitts's law (Fitts 1954, well-established, training
knowledge) treats target position as fixed through a pointer's approach —
relocating it mid-task raises effective error rate. Spatial-memory HCI
literature (Scarr, Cockburn, Gutwin & Quinn, "Supporting and Exploiting
Spatial Memory in User Interfaces," ~2013 — cited from training knowledge,
**not re-verified live this session**, WebSearch budget was exhausted and
the direct URL 404'd) reports users fall back to remembered POSITION over
content once a layout repeats, so a re-pack forces a full re-scan instead of
a targeted tap.
**Spec/hours:** none — already shipped and tested. Confirm on-device once
(15 Pro Max, multi-tap sim) as part of P3's confirmation pass, not a new
build.

## P2 — No visible ghost

**Verdict: PARTLY CONFIRMED — the huge-bank path already matches Spencer's
ask; the normal-bank path (98%+ of build steps) does not.**
Huge-bank (≥12 tiles) spent tiles fade fully to invisible after 350ms,
footprint frozen — no dimmed word text lingers (build 25 behavior above).
But `BuildSentenceStepView.hugeBankCollapse.test.tsx:192` pins, by name,
"normal (<12-tile) bank never sets data-collapse, even well past 350ms" —
those tiles sit at `opacity:0.4` with the word still legible, indefinitely,
until the step ends. That IS a lingering dimmed copy of a used word sitting
in place — the shape of thing "ghost" describes — and it's the DEFAULT for
almost every build step (mobile-sizing-spec.md §3: JA huge-bank steps are
1–2% of the corpus). Removing a placed tile already snaps it back to full
opacity in its original slot with no animation ("reappears immediately, no
delay" — same test file), which only works because P1 already guarantees
the slot never moved — so nothing is lost by fading it fully.
Accessibility: `aria-pressed={used}` + `aria-label` ("word, used, position N
of M") + `disabled` already announce state independent of opacity
(`BuildSentenceStepView.tsx:987-999`); `disabled` controls are exempt from
WCAG 1.4.11 Non-text Contrast (verified via WebFetch,
w3.org/WAI/WCAG22/Understanding/non-text-contrast.html: "inactive/disabled
components are exempt"), so opacity-0 is not a compliance regression.
Opacity-0 elements stay in the accessibility tree (not `visibility:hidden`),
so VoiceOver still gets the label. The existing fade already respects
`prefers-reduced-motion` (`index.css:2242`), satisfying WCAG 2.3.3 Animation
from Interactions (verified via WebFetch: non-essential interaction-triggered
motion must be disableable) as long as the extension reuses that block.
**Spec:** drop the `hugeBank`/`data-density="huge"` gate so every build/listen
bank tile gets the pending→fade-to-0 treatment on tap, not just ≥12-tile
banks; keep the box frozen (P1 already guarantees this). Match-pairs
(`opacity:0.6`, permanent) is a separate surface Spencer didn't name ("tile
banks") — flag, don't touch, in this lane.
**Hours:** 3–5h (remove the density gate in `BuildSentenceStepView.tsx` +
generalize 4 CSS selectors in `index.css` + rename/extend
`hugeBankCollapse.test.tsx` to cover normal banks + one multi-tap sim pass
on a normal-bank route, since the doc's own evidence bar rejects a single
settled capture for anything interactive).

## P3 — Answer window: reserve, don't grow

**Verdict: CONFIRMED — already shipped as "THE ONE RESERVATION" (build 25,
2026-09-17), and it is a *tighter* mechanism than the proposed formula.**
`BuildSentenceStepView.tsx:882-925`: the tray renders one invisible
same-glyph ghost tile PER answer tile (`step.correctOrder.map`), sharing a
grid cell with the real placed-tile row (`max(ghost, actual)`), wrapped by
the SAME fit engine (`tileFit.ts`) the real tiles use — so row count is
exact, not an estimate from a separately-measured tiles-per-row constant.
The tray is this height at first paint and never recalculates mid-build,
which is why the prompt never re-centres (no code-level "pin," but nothing
ever changes size above it, so `justify-center` has nothing to react to).
mobile-sizing-spec.md §3's own measurement table shows prompt-top identical
across all 14 sampled taps at 100% AND 125% on 4 routes, `maxH2Jump=0`.
**The two "open" decisions read as stale, not open.** The lead's memory
cites ja-m15-neo-6?step=15 re-fitting 0.82→0.72 at tap 9, and a ~37px prompt
shift. Both numbers match exactly what the code's own comments describe as
the PRE-build-25 defect: "the prompt re-centres 36.8px upward as the column
gains a row" (`BuildSentenceStepView.tsx`, same block), and
mobile-sizing-spec.md's post-fix table reports that SAME route
(`ja-m15-neo-6?step=15`) at fit 0.638 constant across all 14 taps, both
scales, PASS. Nothing in the repo contradicts "already fixed"; recommend
Spencer treat these as closed pending one on-device confirmation shot, not
open engineering.
CLS framing (verified via WebFetch, web.dev/articles/cls): a layout shift
only counts when an *already-painted* element moves start position; a good
score is ≤0.1. The reservation makes this a CLS=0 case by construction —
the standard web mitigation (reserve space via known `width`/`height`, e.g.
an `<img>`) is usually an estimate; here the exact answer is known before
first paint, so an exact reservation is possible and already used.
**What's NOT solved:** for long answers (≥12 tiles) at 125%, the bank can
rest up to 212px behind the sticky CHECK button from tap 0 (not growing
into it — already there at rest) — a scroll-to-reach problem, not a
movement problem. Doc's own words: "the case where 'nothing moves' and
'everything visible' cannot both hold at today's floors." Affects 14/698
(2.0%) JA `listening_build` steps. Lever named but unchosen: a row-capped
tray with an internal scroll.
**Spec/hours:** write the reservation rule into `mobile-sizing-spec.md` as
the formally adopted policy (0.5h, no code change — it's shipped). Closing
the long-answer-behind-CTA gap: 4–8h + a Spencer call on which lever to
pull; out of scope under "tile banks, revisit later."

**CLOSED 2026-09-18, lane LONGANS:** the named lever — a row-capped tray
with an internal scroll — shipped as `useBoundedAnswerTray.ts`. It caps
the tray's rendered box (never its reservation ACCOUNTING — the ghost row
still sizes the reservation exactly as this section describes) to the
tallest whole number of rows that keeps `bankTop + bankH` inside the fixed
stage's own bottom edge, snapped to `--tile-row-h` so the cut line never
slices a tile. `stageFits` — this section's own literal check — is PASS on
`ja-m42-neo-challenge?step=11` at both 100% and 125% (was FAIL at 125%,
212.4px overflow); `ja-m15-neo-6?step=15` (a normal, unaffected route)
stays PASS at both scales, unchanged. `bankVisible` (an informational,
non-gating verdict — see `sim-capture.mjs`) still reports some of the bank
behind the sticky CTA on this same route (146.4px, down from 212.4px) —
that is the sticky CTA overlapping normal-flow content near the fold, a
different mechanism (see P5 item 3) than the stage-level scroll this
section was about, and out of THIS fix's scope.

## P4 — Bar: fits at 100%/125%, no scrollbar, legibility over box

**Verdict: CONFIRMED as existing doctrine, with two named gaps.**
"Legibility first, box second" and floor-before-ceiling is already
Spencer's rule (`spencer-product-sentiment.md`, #87 quote) and `tileFit.ts`'s
FIT/FILL design (font floor is a hard bound; the box conforms to measured
content, never the reverse). Gap 1: "no scrollbar in the shell" is stricter
than what ships — the 2% `listening_build` case above relies on the native
scrollbar as its documented cue (`keep-native-scrollbar`, `LessonShell`).
Gap 2: the accessibility slider runs 85%–140% in 5% steps
(`mobile-sizing-spec.md` §8), not just 100%/125% — 130–140% are reachable
today and are not what this lane's cited simulator evidence covers.
**Spec/hours:** adopt P4 as the acceptance bar going forward (0h, policy
only); either accept the named 2% exception explicitly or fund the
row-capped-tray fix above to close it; extend the sim sweep's scale matrix
to include 140% before claiming the bar met end-to-end (~2h to add the
sample points, reusing existing harness).

**UPDATE 2026-09-18, lane LONGANS — both gaps closed:** Gap 1's
row-capped-tray fix shipped (`useBoundedAnswerTray.ts` — the answer tray
caps to the rows that fit and scrolls internally ONLY when its reservation
would push the stage past the shell; `sim-proof.sh` on
`ja-m42-neo-challenge?step=11` now PASSES `stageFits` at both 100% and
125%, was FAIL at 125% with 212.4px overflow). Gap 2 is closed the other
direction (Spencer decision, same day): rather than extending the sweep to
140% first, the slider itself is capped at 125% until that sweep exists —
"130–140% are reachable today" is no longer true; see
`docs/mobile-sizing-spec.md` §8's own 2026-09-18 note.

## P5 — Annoyance ranking

**Verdict: CONFIRMED, coordinator's order stands**, with two notes.
1. **Target moves under the finger** — worst: interrupts an in-flight
   gesture, breaks Fitts's-law's stable-target assumption outright.
   Currently prevented by design (P1) — not observed as reachable in code.
2. **Mid-build re-fit/shrink** — same mechanism as #1, one tap later; costs
   compound across every remaining tap (spatial-memory re-scan, P1). Fixed
   for the tested routes (P3); the only residual is the ≥12-tile/125% scroll
   case, which is a different mechanism (see P3/P4), not a re-fit.
3. **CTA/tiles jump on reveal or submit** — highest-stakes moment to move
   anything (learner is reading feedback, about to tap Continue).
   **Not investigated this lane** — out of the brief's build-phase scope;
   flag as a follow-up check before calling P4's bar met.
4. **Scrollbar in the fixed shell** — recoverable, but visible proof the
   screen "didn't fit"; real today at the 2% long-answer case (P3/P4), not
   hypothetical. **CLOSED 2026-09-18** for that case specifically: the
   shell no longer needs its own scrollbar there (`stageFits` PASS); the
   answer tray itself carries a small internal one instead, hidden on
   touch by the same rule every other non-stage scroll region gets.
5. **Tile text too small** — chronic, not a surprise; Spencer's own rule
   already ranks this below layout stability ("legibility first, box
   second" governs the floor, not whether the floor may be reached).
6. **Ghost misread as tappable** — low risk today: `disabled` prevents any
   real malfunction regardless of opacity. Worth a style check if P2 ships
   (opacity-0 removes the question entirely; a partial-opacity ghost would
   need to avoid the active/selected-tile border color).
7. **Late wrapping** — lowest severity, cosmetic; largely closed by the
   2026-09-16 tile sweep (memory: "equal rows 17/23→0/40 ragged").

## Bottom line

P1 and P3 are already shipped (build 25) — the lead's two "open decisions"
in memory read as stale, pending one confirmation shot, not new work. P2 is
the one real gap: extend the already-built huge-bank fade-to-invisible
mechanism to every build bank (3–5h) — that satisfies Spencer's literal
"no ghost" ask, which today only holds for the rare ≥12-tile case. P4's bar
has two named, small exceptions (2% long-answer scroll; 130–140% untested)
worth a decision, not a scramble. P5's #3 (reveal/submit jump) is a hole in
this lane's research, not in the app — check it before declaring the build
31+ bar met.

### Sources (fetched this session)
- [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls)
- [WCAG 2.2 — Target Size (Minimum) 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.2 — Animation from Interactions 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- [WCAG 2.2 — Non-text Contrast 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
