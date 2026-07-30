# Decision brief — open product calls (2026-07-29)

**For:** Spencer · **Status:** AWAITING RULINGS — everything here is blocked on
a product call, not on engineering. Context: the vocab-pack wave
(`vocab-pack-wave-plan-2026-07-29.md`) is executing; B068 option 2 shipped
(287→226 with ratchets).

## 1. B069 — wiring the dormant dynamic review builder (blocker)

Nothing on the live map routes to `buildSrsReviewLesson`, so the reserved-seat
intake fix AND the kanji-switchover beat (B061) ship no learner-visible
behaviour. Three options from the backlog, with a recommendation:

| option | what it does | cost |
|---|---|---|
| (1) route `ja-mN-neo-review-*` ids to the dynamic builder | replaces authored review content | **discards 73 authored IR review lessons** — the sentence-context review mix Spencer ruled for lives in those assets |
| (2) add dynamic `ja-mN-review-1/2` tiles alongside authored reviews | both surfaces live | +1–2 map tiles per module; lengthens every module; product-visible layout change |
| (3) render-time prepend of the switchover beat + reserved-seat intake onto the STATIC review lessons at `getMockLessonContent` time | authored content stays; dynamic behaviours ride on top | same pattern as `kanaReviewTails`; bounded scope |

**Recommendation: (3)**, plus the conformance test B069 demands (the beat must
have a live call site or CI fails). It ships the switchover beat and the
intake fix without discarding authored work or changing the map. Option (2)
can still be added later if a pure-dynamic review surface proves wanted.
**→ APPROVED (Spencer, 2026-07-30): phase 1 = render-time prepend (capped
segment, empty-state degradation, conformance tests, QA preview) —
IMPLEMENTATION DISPATCHED same day. Phase 2 (IR `dynamic-slot` mid-lesson
interleaving) deliberately deferred until Spencer has played phase 1.**

## 2. B070 — retired katakana rows: keep deep-linkable or drop?

4 of the 96 never-taught words exist ONLY in retired off-map katakana rows
still registered in `LESSONS` (コンビニ ja-m12-kata, カップ ja-m6-kata,
ナイフ/ノート ja-m7/m8-kata). Keep them registered (deep-linkable, harmless,
slightly misleading corpus) or drop them from `LESSONS` (clean, but kills the
deep links)? Note コンビニ is in pack 10's draft (m19) and ノート in pack 5's
(m16) — once those packs land, the rows are pure legacy either way.
**Recommendation: drop after packs 5/10 land.**

The structural half of B070 (re-base the grammar-pool comprehensibility gate
on live teaching instead of legacy `fromModule`) is engineering, not a ruling
— scheduled after the early packs land so the gate's input data stops moving.

## 3. B040 — giving verbs (あげる / もらう / くれる)

CEJC #171 / #98 / #114 — top-tier frequency, absent from the course except an
m30 event. Scoping sketch (NOT a vocab pack — needs a grammar point):
- New atoms: もらう and くれる don't exist in the registry at all; あげる
  exists but is parked at `fromModule: "future"`.
- One grammar point covering the giver/receiver frames (は/が giver, に
  source/recipient, the in-group/out-group axis that decides くれる vs あげる)
  + a teaching lesson + pool steps. The に-recipient gap is also B003's
  complaint — same fix family.
- Natural home: the m20-m24 band (per the frequency deep-dive §7.3, the giving
  trio's only current event is m30 — far too late for words this frequent).
**Needs your go/no-go and a module home before anyone authors it.**

## 4. dialogue_sim prototype — five design rulings (2026-07-29)

The simulation-dialogue step Spencer sketched ("shopfront emoji — worker says:
do you need a bag?") is PROTOTYPED and viewable at **`/ja/qa/dialogue-sim`**
(also `/ja/lesson-preview#step-dialogue_sim`). One step = one scenario;
max-acceptance replies through the standard expander; listen-first with
graceful no-audio degradation; graded but writes no FSRS; pinned in
`UNUSED_STEP_TYPES` so nothing live routes to it. Open rulings before it
productionizes into Travel Sprint (all post-B066):

**Spencer's verdict (2026-07-29): KEEP AND ITERATE.** "awesome conceptually …
ui/ux wise it needs a better design, visual audit and user simulation, and
missing emojis or theming in some small way." → Later item: a dialogue_sim
iteration wave — proper design pass, Gate 10 visual audit, learner-sim run,
emoji/theming fill. Not blocking; the five rulings below still decide the
productionized shape.

1. **Register carve-out** — a shop transaction can't honestly happen in plain
   form. Does Travel Sprint get a "survival register" exemption from inv 7
   (learner produces fixed です/ます phrases, never derivation — what the
   prototype does), or stay recognition-only until ます is taught?
2. **Retry semantics** — verdict-final per turn (current, mirrors
   dialogue_listen) vs Pimsleur-style say-it-again-until-right?
3. **Kanji on reply tiles** — sim tiles bypass `BuildTileSurface`, so the
   FSRS-gated-furigana ruling doesn't apply there yet. Should it?
4. **Scene inventory + cast** — which 4–6 scenarios; clerks role-labelled
   (てんいん) or named recurring characters with canon?
5. **Progress weight** — one tick per scenario, or weight by turn count
   (trace/row_test precedent)?

## 5. MAX_NEW raise (carried from 2026-07-29)

**→ RESOLVED (Spencer, 2026-07-30): "More max is good, increase as needed."
MAX_NEW raised 5→8 with the B069 phase-1 wiring; future raises are at
implementer discretion, measured against session length.**

## 6. Reverse-teaching discipline rules D1–D8 (2026-07-30) — yes/no gates packs 5–16

Research landed (`docs/reverse-teaching-readiness-2026-07-29.md`, key claims
spot-verified). Headline: grading inside the lesson player is already
instruction-language-clean — reverse teaching is a *translation* problem,
provided four English-shape couplings get fixed (worst:
`jaAcceptedForms.ts:127` classifies verbs by `/^to /` on the English gloss)
and new content follows eight zero-cost authoring rules (doc §4, D1–D8):
English only in English fields; register cues from the existing closed
`Say/Ask/…:` set; answer↔option strings exact, never paraphrased; glosses as
standalone dictionary entries (`to …` verbs); English MCQ options differ in
MEANING, not surface; one meaning per ja sentence per lesson; rule prose
names forms by their Japanese surface; never a step whose correct answer is
English. All are measured as zero-cost against packs 1–4 practice.

**Decision:** approve D1–D8 as binding for packs 5–16 (they get pinned into
every pack-agent brief alongside the three measured authoring rules)?
**→ APPROVED (Spencer, 2026-07-30). Binding from pack 5 onward.**
Schema direction — build-time string extraction with per-language sidecar
files (`m13.ko.json`), en fallback, coverage ratchet — needs no decision now;
it's the recommended shape when reverse work actually starts (~3–4 months).
