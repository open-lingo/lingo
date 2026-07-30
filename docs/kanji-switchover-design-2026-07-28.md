# The kana→kanji switchover — measurement, research, design (B061)

> ⚠️ **2026-07-29 (B069, blocker):** the built beat is DORMANT. Its only call
> site is `buildSrsReviewLesson`, and nothing on the live map routes there —
> the 73 live `ja-mN-neo-review-*` lessons are static IR lessons; only the
> `ja-mN-review-1/2` id shape reaches the dynamic builder, and no live lesson
> carries it. Verified independently and by probe. Wiring options in B069.

2026-07-28. Supersedes nothing; the three 2026-07-16 kanji docs
(furigana-plan / implementation-spec / timing-research, all marked STALE in
INDEX) designed **when** kanji appears and **how long furigana stays**. None of
them designed the *event* — a word the learner has known by ear for months
suddenly acquiring a written form. That event is B061.

The case, stated precisely: **the learner has known ともだち for sixteen modules
by sound and meaning. Only the written form 友達 is new.** This is not
kanji-from-scratch and it is not a new word. Every design decision below falls
out of that framing.

---

## 1. What the course actually does today (measured, not assumed)

Probe over the compiled course (`getMockCourse("ja")` + `getMockLessonContent`)
crossed with `KANJI_ELIGIBLE_ATOMS`:

| | |
| --- | --- |
| Kanji-eligible atoms | 154 |
| Born with kanji (taught at/after unlock — no switchover) | 42 |
| **Switchover events** (taught in kana, kanji arrives later) | **112** |
| Gap between "word taught" and "kanji appears" | min 1, **median 11**, max 26 modules |
| `kanji_reading` steps in the entire course | 35, across 28 distinct surfaces |
| — switchovers **ever** graded, at any point | 22 |
| — switchovers graded **in the unlock window** | **0** |
| — switchovers **never graded at all** | **90** |

`kanji_reading` exists in only five modules (m18:8, m23:8, m28:9, m29:5, plus
m30(n4):5). Its sprinkle-not-saturate design deliberately tests words whose
kanji unlocked long ago — so the measurement confirms the design is working as
intended, and that the intent leaves the switchover completely unattended.

The worst cases are the earliest words, which are also the most frequent:

```
つき   → 月     taught m1,  kanji m10  (gap 9)
いえ   → 家     taught m1,  kanji m14  (gap 13)
はな   → 花     taught m1,  kanji m18  (gap 17)
ねこ   → 猫     taught m1,  kanji m19  (gap 18)
とけい → 時計   taught m1,  kanji m20  (gap 19)
あさ   → 朝     taught m1,  kanji m21  (gap 20)
うた   → 歌     taught m1,  kanji m24  (gap 23)
そら   → 空     taught m1,  kanji m27  (gap 26)
```

Switchovers also arrive in clumps, which constrains the design: **m22 has 18 in
one module**, m8 and m14 have 12 each, m24 has 9, m21 has 8.

### 1a. The structural bug underneath

`SRSModality = "recognition" | "production"` (`flashcards/data/types.ts:96`).
There is **no orthography modality**. `isMastered()` returns true when both
those intervals clear the threshold — i.e. it measures how well the learner
knows the **word**, by sound and by meaning.

Furigana removal is gated on exactly that (`applyKanjiSurfaces.ts:205` →
`furiganaVisibleAt`, window = unlock+2, extended past the window only by
`isMastered`).

So for ともだち: taught m3, long since mastered by ear, 友達 first renders at
m19, furigana holds through the unlock+2 floor, and **at m21 it vanishes** — on
a written form the learner has seen for two modules and has never once been
graded on. The gate removes the scaffold on the basis of evidence that is
irrelevant to whether the scaffold is still needed. Filed separately as B064;
the beat in §3 has nothing to grade *into* until it is fixed.

---

## 2. What the research says

Three parallel surveys (kanji SRS tools / mainstream apps + learner reports /
academic literature). Full agent reports are summarized here with their own
confidence caveats preserved.

**Tools — nobody has a switchover beat.** WaniKani gates vocab behind kanji
(radical→kanji→vocab, a hard dependency) — the opposite direction from ours.
jpdb subordinates kanji to vocab, picking "the kanji you're taught…based on the
vocabulary you want to learn," which is structurally closest to us. Renshuu's
one lever: marking a kanji known auto-removes furigana everywhere it appears.
Anki Kaishi 1.5k and Core2k/6k are recognition-only, furigana on the front or
revealed on the back. **Across every tool verified, furigana presence is the
graded lever, and the transition is folded into an ordinary lesson event — none
stage a discrete "this known spoken word now has a script" moment.**
(Bunpro and Marumori unverified — fetch failures, not absence of the feature.)

**Apps and learners — the pain is unpredictability, not difficulty.** Duolingo
does what we do: silent unlock by unit, no announcement, no test — and it is
*inconsistent*, which is the documented complaint ("watashi seem to still be
written in kanji, but other words that used to be now just aren't"). Rosetta
sidesteps it with a persistent user-chosen script mode. LingoDeer makes it
learner-driven: replay each lesson twice, kanji off then on. Genki makes it
rule-governed and *states the rule* — furigana appears "only for kanji that have
not yet been learned." WaniKani forum learners describe the positive arc as
gradual accumulation, not a single reveal moment. **No product uses fanfare;
the ones learners are happy with are predictable or optional.** (Reddit was not
directly fetchable — those claims came via search snippets, so treat part 2 as
directional.)

**Literature — thin, and honest about it.** Dual-route models (Patterson,
Suzuki & Wydell 1996; Wydell & Kondo) show kanji reading leans on whole-word
lexical access rather than kana's phonological route, so **form-binding is a
distinct lexical event, not something that falls out of already knowing the
word**. The self-teaching hypothesis — exposure alone suffices — is well
established for Chinese hanzi via phonetic radicals (Ho 2014; Li et al.
2018/2020; Xu & Ke 2025 meta-analysis) but **has never been extended to
Japanese**, and kanji's on/kun multiplicity and weak phonetic regularity are
reasons to expect it transfers poorly. The testing effect is robust generally
(Roediger & Karpicke 2006; Dunlosky 2013) but has no kanji-orthography-specific
study — this is the thinnest link. Recognition-before-production is supported
only indirectly, via general receptive/productive vocabulary gradients, which
does lend support to our recognition-only stance. **Furigana crutch-vs-scaffold
is genuinely unresolved** — no clean study either way; it is a practitioner
debate, not a settled finding, and neither side should be cited as established.

**Net:** active retrieval at the switchover is more defensible than exposure
alone — but as a reasoned extrapolation across scripts, not a Japanese-specific
empirical result. Labeled as such here deliberately.

---

## 3. The design

Three pieces. They are separable, but piece B is nearly pointless without A.

### A. Give orthography its own memory (fixes B064)

Add a third SRS modality (`reading`) — or an orthography sub-state on the card —
graded only by kanji-facing steps. Then gate furigana on **that**, not on
`isMastered()`. This is WaniKani's reading/meaning split and Renshuu's
known-kanji toggle, and it is what makes the scaffold come off for the right
reason. Requires a card-state migration.

### B. The beat itself, at the unlock module

Two steps, adjacent, in the lesson where the word's kanji first renders:

1. **Reveal** — an ungraded card: the kana the learner already knows → the kanji
   form, plus the component gloss where it is honest and useful
   (明日 = 明 bright + 日 day; 友達 = 友 friend + 達). Reuses `phrase_card`/`info`
   shape. No fanfare — matches every product surveyed.
2. **One graded recognition item** on the word just revealed — `kanji_reading`
   already exists and is exactly right (kanji→kana MCQ, 4 kana options,
   furigana suppressed).

Teach → immediate retrieval. The immediate item is *easy by construction* (the
answer was just shown) and that is fine: it is the encoding event, and it seeds
the `reading` modality so FSRS brings the form back days later. The spaced
return is where the real learning happens — which only exists if piece A lands.

**Variant worth considering — pretest before reveal.** Show the kanji cold,
ask which word it is, *then* reveal. Errorful-generation/pretesting effects are
robust in general learning research (though unverified for kanji). It only
works where the learner can actually infer — i.e. **compounds whose components
are already taught** (今日, 明日, 電車, 食べ物, 買い物). For atomic unseen glyphs
(猫, 空, 朝) a cold pretest is pure guessing and should be a straight reveal.
So: pretest for compounds, reveal for atoms — decided per word, mechanically,
from whether every component glyph unlocked in an earlier module.

**Volume control.** 112 events × 2 steps ≈ 224 steps ≈ **under an hour** of the
~23h headroom under Spencer's 60h N5 ceiling (B063: course currently 37.4h). But
the clumping is the problem — m22 would gain 36 steps. Cap the beat at ~4 per
lesson and spill the overflow forward; "unlock module" becomes "unlock module or
the next lesson with room."

### C. State the rule to the learner (cheap, optional)

Genki's approach and the one learners react well to. One line on the reveal card
— *"furigana stays until you've got this one down"* — converts a silent system
change into a predictable one. This is the single cheapest item here and, per
the learner-experience research, addresses the actual reported pain.

---

## 4. Feasibility — Spencer's objection, answered

> "we have trouble adding things like these and then it would be hard to
> dynamically add in a lesson step once they have the fsrs down right?"

Two separable worries. The first turns out to be cheap; the second is real and
points at a lighter design than the one proposed above.

### 4a. Injecting the step is a solved problem here

`getMockLessonContent` (mockLessons.ts:726) is **already a derivation stack**:

```
withKanaReviewTail( augmentWithReviewTail( deriveGrammarMicroSteps(base) ) )
  → shape → padMatchPairsFloor → padBuildTileFloor → applyKanjiSurfaces
```

The beat is **one more pass in that stack**, not 112 authored edits.
`applyKanjiSurfaces` already computes the exact fact required — it holds each
atom's `unlockModule` and the lesson's module — so a sibling
`deriveKanjiSwitchoverBeat` derives "atoms whose kanji unlocks at THIS module
and that were taught earlier," picks pretest-vs-reveal from whether every
component glyph unlocked in an earlier module, and injects the steps. Pure
function of the lesson, unit-testable, zero new authoring surface. This is the
cheapest piece of the whole design.

**And the beat needs no per-learner FSRS state at all.** It fires on the
lesson's module, which is a property of the content, not of the learner's
memory. The FSRS question only arises *after* the beat, for the spaced return
and the furigana gate — by which point the card exists because the beat created
it.

*Edge case:* a learner reaching m19 with ともだち still shaky gets the
switchover beat on a wobbly word. Fire it anyway. Deferring per-learner
reintroduces exactly the dynamic complexity worth avoiding, and the module is
teaching that word's content regardless.

### 4b. The SRS half — don't add a modality, add a card

A third `reading` modality would touch `SRSCardState`, `srsMigration`,
`isMastered` and every caller, plus the backend sync shape. That is the heavy
path and the instinct against it is correct.

The lighter path the code already invites:

- SRS state is stored as **`Record<string, SRSCardState>`** — an open,
  string-keyed map (`srsSync.ts:145`). New card IDs simply appear; there is no
  fixed enum and **no migration of existing learner state**.
- The course deck is **derived from atoms**, not hand-listed:
  `buildEnrichedCourseDeck` maps atoms → cards with `id`, `type`, and
  `unlocked: unlockedIds.has(atom.id)` (courseDeck.ts:92). Cards already carry
  a `type` field (`"word"`).

So: **give the written form its own card.** `友達` as a `type: "kanji"` card
beside the `tomodachi` word card, `unlocked` gated on the kanji's unlock module,
recognition sub-state = kanji→reading, production unused (we never produce
kanji). Furigana then gates on `isMastered(store["<kanji card>"])` —
orthographic evidence — and **B064 is fixed without touching the card schema.**

This is also what the two closest tools do: jpdb and WaniKani both treat the
kanji as its own item, subordinate to the vocabulary.

**Remaining real cost**, not hidden: the new cards surface in the Card Manager
and the review queue, and enrolling all 112 is a meaningful bump to the pool.
Mitigation is to enroll a kanji card only once its beat has fired, so the queue
grows with the learner rather than all at once.

---

## 4c. CHOSEN SHAPE — gate on the word's own SRS, latch the result

Spencer, 2026-07-28: *"maybe we just gate on the word srs itself and once it is
over like 14 days then we do 1. if they get the next fsrs answer right, then
enable the kanji to be shown and played as a lesson step seeded in review? or 2.
they get it wrong and dont see the kanji… put the correct in review tail steps…
can just be 1 of the 4."*

This supersedes both options in §3/§4b. It needs **no new card and no new
modality** — it reuses the word's existing SRS as the readiness signal. The
switchover stops being a property of the module and becomes a property of the
learner, which also dissolves the clumping problem (m22's 18 events spread
across each learner's own timeline).

**Why it fits the code almost exactly:**

1. **The renderer already holds both forms.** `JapaneseAnnotation` carries
   `surface` (kanji, post-substitution) *and* `reading` (kana). So withholding
   the kanji is a **render-time** decision — `applyKanjiSurfaces` stays
   deterministic and module-gated, and the existing test suite keeps passing.
2. **The render-time SRS read already exists.** `kanjiFuriganaSrsVisible`
   (AnnotatedText.tsx:52) is a pure store read via `getCardState(atomId)`,
   reactive on `useSRSStoreRevision()`. A sibling `kanjiSurfaceSrsVisible` is
   the same shape — choose `surface` or fall back to `reading`.
3. **The review tail is already per-learner and dynamic.**
   `augmentWithReviewTail` (mockLessons.ts:593) reads
   `getMockCompletedLessonIds()`, calls `buildReviewTailSteps`, and inserts
   **before the trailing wrap-up info step for recency**. Seeding the beat there
   is exactly the precedent.
4. Threshold: `MASTERED_INTERVAL_DAYS = 21` already exists; 14 is deliberately
   *lower*, so the kanji arrives while the word is strong but still has review
   traffic to carry it. Name it separately — `KANJI_REVEAL_INTERVAL_DAYS = 14`.

**The gate is a conjunction, not just the interval.** The module floor must
stay: `learnerModule >= unlockModule` AND `interval >= 14` AND the triggering
answer was correct. Otherwise 友達 could render at m3 on a mature ともだち
before its component glyphs are taught.

### The flaw: without a latch, the kanji flickers

If the gate is a pure predicate on the *current* interval, a lapse drops the
word under 14 days and 友達 reverts to ともだち. That is precisely the failure
the learner research identified as the single most-reported complaint —
Duolingo's *"words that used to be [kanji] now just aren't."* Reverting is worse
than never switching.

So **latch it**: once the switch fires for a word, it stays. One persisted set
of atom ids plus the date each fired. No FSRS math, no card-schema change, no
scheduler involvement — strictly smaller than §4b's extra card.

### The latch date also fixes B064, for free

Store *when* the switch fired and drive furigana from that, not from the module
window. Without this there is a bad edge: a learner who latches at m25 on a word
that unlocked at m19 is past the unlock+2 window *and* mastered, so the kanji
would appear **bare on first sight, with no furigana at all**. Latch-date-driven
furigana (stay for N days / N exposures after the switch) removes that edge and
is the correct reading of "gate the crutch on mastery, not module counts."

### Branch 2 — exposure before the switch

Where the answer was wrong, the kanji stays hidden but its form still appears in
a review-tail step as one of four options. **Constraint:** in a step about
ともだち, 友達 must be the *correct* option, never a distractor — otherwise the
learner is trained that the kanji form is wrong. Distractors must be other
words' kanji.

---

## 5. What this does not do

- **No kanji production, anywhere.** Unchanged, and supported (weakly but
  consistently) by the receptive-before-productive literature.
- **No radical/mnemonic ladder.** That is WaniKani's product; building it here
  is XL and duplicates a tool learners already use alongside.
- **No change to `kanji_reading`'s existing sprinkle role.** The beat *adds*
  instances at unlock; the long-after-unlock sprinkles stay as they are.

---

## 6. DECIDED 2026-07-29 — variant C, restructured to two steps

Spencer, after driving `/ja/qa/kanji-switchover`:

> "for kanji, I think we go with C, and then make it one step, kind of animated
> look into css js fun stuff there, and then we ask them a sentence example right
> after. It would come out to being 2 steps, get some good ideas there, test a
> few animations, see what can work based on how reviews seed"

So the beat is **two steps**:

| # | Step | Graded | What it is |
| --- | --- | --- | --- |
| 1 | **Animated reveal** | no | ともだち → 友達 as one animated step. Continue is held until the animation finishes. |
| 2 | **Sentence question** | yes | The word in a sentence the learner can already read, furigana OFF on the switched word, four English options that differ only at that word. |

### 6a. This overrules §7a of the distributed spec, deliberately

The research pass recommended the opposite order — graded attempt first, reveal
as its feedback (Kornell 2009 / Richland 2009 pretesting evidence). Spencer's
call is reveal-first. Recorded rather than silently reconciled, along with the
risk it inherits: §6c of that spec found **both** simulated learners tapped
straight past an ungraded reveal ("ungraded = not going to be tested on this").

The mitigation being tried instead of reordering is **the reveal gates its own
Continue** — the button does not enable until the animation completes. That
costs no extra step and no grading, and it makes the reveal unskippable in the
only sense that matters (time on screen). Whether it also makes it *attended to*
is not something the current evidence answers.

### 6b. The animations — `/ja/qa/kanji-reveal`

Six candidates, live, over three word shapes (友達 two glyphs one honest gloss /
明日 two glyphs both taught / 猫 single glyph nothing to infer). The rule they
are judged by: **does the motion itself carry information, or would the still
end-frame teach the same thing?** Candidate 5 (ink wipe) is in the list as the
control that answers that question.

- **7 · erase → assemble → kana returns as furigana** (Spencer's sequence,
  ~2.7s) — his choreography, composed from 5 + 3 + a reversed 5: ともだち is
  ERASED off the baseline, 友 and 達 slide in and take the vacated spot, then
  ともだち WIPES BACK IN one slot higher at furigana size. The only candidate
  where the kana's departure from the baseline and its return as ruby are
  separate events, so the motion states the whole rule instead of asserting it in
  one shrink.
- **6 · ruby demote → stroke draw** (~4.7s) — the kana visibly
  becomes the furigana, then the kanji is written stroke by stroke.
- **2 · kana demotes to furigana** (~1.6s) — the only candidate where the motion
  *is* the lesson. Ends on the real `AnnotatedText`, so the last frame is the
  production renderer rather than a mock of it.
- **1 · the kanji writes itself** (~4.4s) — real stroke order. Risk: stroke order
  is production knowledge and kanji production is out of scope.
- **4 · in-place swap inside a sentence** (~2.1s) — the "brace yourself" job;
  teaches nothing about the form. Zero authoring cost.
- **3 · components slide together** (~1.5s) — needs per-word component senses,
  honest for only some words (達 renders "—" rather than inventing a gloss).
- **5 · ink wipe** (~1.5s) — the control. Cheapest, carries nothing.

### 6c. Built along the way

`src/shared/glyphs/data/kanji.json` — all **147** N5_KANJI glyphs (n5 +
exposure tiers) of KanjiVG stroke data, 120 KB, lazy-loaded chunk, registered as
the `kanji` script in `glyphs/registry.ts`. `scripts/build-kanjivg-data.mjs`
now reads the glyph list out of `n5Kanji.ts` rather than hardcoding it, and
throws if that regex ever stops matching. `KanjiStrokeDraw` renders it as SVG
with `pathLength="1"` + `stroke-dashoffset`, which needs no `getTotalLength()`
measurement — the canvas path in `strokeRender.ts` stays where it is, because
tracing needs per-frame pixel access and a reveal does not.

Coverage is test-enforced (`glyphs/data.test.ts`): add a glyph to the catalog
without re-running the builder and it goes red, because the runtime failure mode
is silent — `KanjiStrokeDraw` falls back to plain text, so a missing glyph looks
like a static reveal rather than an error.

### 6d. Where the beat can live — the seeding answer

Two hosts, answering to different constraints. Neither is "longer review tails":
that host **does not exist where kanji does** (§6a of the distributed spec — 0
of 294 m8+ lessons carry a tail, because `augmentWithReviewTail` gates on
`ALL_ROWS`, which is kana rows only).

- **The 44 derived review lessons** (`ja-mN-review-1/2`, `buildSrsReviewLesson`,
  2 per module m8–m29). Already per-learner, already reads FSRS state, picks
  `MAX_ATOMS = 18` due/new atoms per lesson — two beat steps is about one atom's
  worth of slot. The only host that can react to "the learner actually knows
  this word now", i.e. the only one compatible with the §4c interval trigger.
- **The 294 ordinary m8+ lessons**, statically authored. 112 × 2 = **224 slots
  against 294 lessons = 0.76 per lesson**, which fits where the old three-beat
  plan's 1.14 did not. But a static host cannot see SRS state, so the trigger
  degrades to "module reached".

**Hard constraint on the dynamic route:** `buildSrsReviewLesson` is *pure* — it
must never write state at build time (that bug once seeded every unlocked atom
due-today on any course-deck build). The latch that marks a word switched has to
be written on lesson *completion*, in `LessonPage`, next to the existing grade
writes.

### 6e. Still open after this decision

None of these are resolved by picking an animation:

1. **The 14-day trigger reads as unfair** (§6d.1) — a word known since m3 can
   oscillate at 12–13 days forever while a shakier word rides a lucky gap past
   14 and switches first.
2. **The latch is invisible and irreversible** off one correct answer (§6d.2).
3. **B064** — furigana comes off at unlock+2 gated on `isMastered()`, which
   measures the *spoken* word. There is still no orthography modality, so the
   beat has nothing to grade into.

### 6f. Step 2 opens with the in-place swap (2026-07-29, Spencer)

> "and then for the sentence example then it does the in place swap? that would
> be super cool animation."

So candidate 4 is not a competing reveal — it is **step 2's intro**. The kana
sentence the learner can already read, a sweep over the one word about to change,
the swap, then hand off to the real graded `multiple_choice`. Toggleable on the
gallery page.

**Architecture:** the animation is an INTRO that hands off, not a new step. The
graded step stays a stock `multiple_choice`, so grading, XP and SRS writes are
untouched and shipping this needs no new step type for step 2 — only step 1 needs
`kanji_reveal`. The handoff frame has to match `MultipleChoiceStepView`'s prompt
exactly (`text-xl font-semibold`, left-aligned in a flex row); a first pass
rendered the intro centred at 3xl and the sentence visibly jumped size and side
at the cut.

**The trade, stated because it is real:** opening with the swap shows the kana
sentence first, so the learner can read the answer before the kanji appears. That
turns step 2 from a cold reading test into a "can you still parse it now that it
looks like this?" check. Both are defensible; the swap decides which, and it is
not neutral. The toggle exists so the difference can be felt rather than argued.

### 6g. Two animation bugs worth remembering

Both found by frame capture, neither visible in code review:

1. **Wipes must be linear, never the ease-out `EASE`.** `cubic-bezier(0.22, 1,
   0.36, 1)` is 67% complete at 20% of its duration and 92% at 40%, so an
   "erase" blinked the text out and left the stage empty for the rest of the
   phase. A wipe has to read as one steady hand. Pinned by a source test.
2. **Positioned children need `white-space: nowrap`.** Overlapping the erase with
   the incoming components meant absolutely positioning both, and `absolute`
   inside a shrink-to-fit column resolves against a ~0-width parent — ともだち
   wrapped one character per line.

Beat 2 is also deliberately shorter than the erase it triggers, so the components
are already sliding in while the last of the kana is still being wiped. Butted
end to end there was a dead frame between "kana gone" and "kanji arrived".

### 6h. Why the reveal was jumpy — the furigana spreads the kanji 37px

Spencer, 2026-07-29: *"once it repaints the top kana for furigana, the kanji space
out from eachother as the red furigana paints over ... make it a consistent state
transition? no big jumps?"*

**Measured root cause, and it is a fact about production rendering, not about the
animation:** ともだち is four kana at `.kana-helper`'s 0.65em; 友達 is two kanji.
The annotation is therefore WIDER than the base, and ruby layout stretches the
base to match it — **113.2px → 150.3px, i.e. 37.1px of forced spread** at 60px
type. That spread is permanent. It is simply how the word looks from the moment
it has furigana.

The first build showed the kanji at their natural 113px spacing and then swapped
in `AnnotatedText` at the settle, so the ruby yanked them 37px apart at the exact
instant the red appeared. Two motions, one frame.

**Fix: establish the final geometry before anything moves.** The real ruby is
mounted at the start of the slide and never swapped again. While it is
transparent, decoy glyphs slide in and land on positions *read out of that ruby*
(`useBaseGlyphBoxes`, a Range measurement per base character), then the ruby is
hard-cut to visible in a single frame. The furigana then paints via a clip on the
`<rt>` alone, one phase later, over a base that cannot move.

Positions are measured rather than computed so they stay correct for any word,
any font, and any future change to `.kana-helper`'s size.

Verified by instrumenting the running page rather than by eye — the base glyph
run's left edge, right edge and baseline are a **single constant** for the whole
sequence, and the ruby's centre offset is 0 at every sampled frame.

Three further defects that only showed up under measurement:

1. **`letter-spacing` was inert.** The first attempt at the converge animated
   `letter-spacing` on the ruby; ruby width is entirely annotation-driven, so it
   moved the base 3px out of an intended 20px. Replaced by the decoy slide.
2. **Cross-fading the hand-off flashed.** Fading the ruby up from 0 while the
   decoys were removed left a 240ms window with neither visible. A hard cut is
   correct precisely because the decoys end pixel-exact.
3. **Vertical centring amplified the font load.** On the first run only, the JA
   font resolves mid-reveal and the `<rt>` metrics settle (ruby height 71→87);
   centred, that moved the base 12px. The word row is now BOTTOM-anchored, so the
   rt grows upward into reserved space — 4px on a cold run, 0 on every warm one.

### 6i. Step 2 is a kanji CLOZE, not an English MCQ (2026-07-29, Spencer)

> "maybe we want to make it a particle cloze sentence build step instead of the
> sentence mcq and they can pick the right kanji? becomes more effective after
> they have a few kanji"

and, after seeing the pool measurement:

> "we can just use the cloze and then use kanji they dont even know, they are
> still getting good distractors if we can get two symbol words"

**Shape:** an English cue, the sentence with the switched word blanked, and four
kanji tiles. Hosted on **`fill_blank`** — the step type CLAUDE.md lists as unused
with a standing "adopt or retire" decision. This adopts it. `particle_cloze` was
the alternative and is worse: its `prompt: {before, after}` are plain strings, so
the rest of the sentence cannot carry annotations.

**Three things are load-bearing:**

1. **The English cue is required, not decoration.** "___ といきます" is satisfied
   by friend, family, teacher AND student — the Japanese frame constrains nothing.
   Without the cue the step has no answer.
2. **`wordBankHideHelper`** (new, additive on `FillBlankStep`). Bank tiles render
   through `AnnotatedText` in bare mode, which floats each word's kana above it.
   Left on, the bank reads ともだち / かぞく / せんせい / がくせい and no kanji is
   read at all. Same class of defect as `optionsHideRomaji` on `multiple_choice`.
3. **The switched word's kanji is ONLY ever the correct tile.** This constraint
   survives the relaxation below — it guards a different failure (offering 友達 as
   wrong would teach that a known word's written form is incorrect).

**Distractors: shape-matched real words, taught or not.** Measured pool — every
`kind: "vocab"` course atom with a kanji surface: **555 words, of which 166 are
two-glyph pure-kanji (96 containing an untaught glyph) and 138 are one-glyph (61
untaught)**. Real words with correct readings and glosses; invented glyph pairs
would be non-words and a sharp learner spots those without reading them.

This relaxation removed a scheduling problem, which is why Spencer's earlier
"more effective after they have a few kanji" no longer gates anything. Under the
already-taught-only rule the pool was words whose kanji unlocked in an EARLIER
module: **0 at m8**, 13 at m9, 34 at m14, 104 at m22. m8's only candidates were
its own 13 glyphs, all numbers (一 二 三 … 十), so an m8 cloze would have been a
number-discrimination drill wearing a switchover costume. Drawing from the whole
registry makes the step viable from the first switchover.

**What it actually tests — stated so it is not over-credited.** Unknown-kanji
distractors make the step EASIER, not harder: the learner wins by recognising the
one word they know, not by discriminating between candidates they can all read.
That is still exactly the switchover skill ("do you recognise this word's written
form"), but it is recognition against noise rather than a reading test.

**Hard mode, and why it is not always available.** `shareGlyph` prefers
distractors that share a glyph with the answer, which removes the
spot-one-known-glyph shortcut and forces the whole word to be read. It is a
property of the word whether this is possible at all: 明日 has many (日 is
productive — the bank becomes 一日 / 三日 / 十日 / 明日), 友達 has none because no
other two-glyph pool word uses 友 or 達, and a single-glyph answer like 猫 can
never have one. `hasShareGlyphOption()` is what callers consult, so the option is
never offered and then silently downgraded.

**Also excluded:** any tile sharing the answer's reading, and any tile whose gloss
matches the answer's — against an English cue a synonym would be defensibly
correct. Exact normalised gloss match only; near-synonyms ("house"/"home") would
need a real semantic check and are NOT caught.

**Rough edges before this can ship** (fine for the gallery, not for learners):
- The English cue can only live in `hint`, which renders small, muted, and
  disappears after submit. It wants the prompt position.
- `FillBlankStep.sentenceAnnotation` is declared on the type and **ignored by the
  view** — the non-blank part of the sentence goes through the bare annotator with
  no furigana control. Fine for kana frames like といきます, not for a sentence
  carrying other kanji.
- The blank renders as a wide bare `<input>` underline, visually loose against the
  sentence.
- The swap intro (§6f) and the cloze do not combine: the swap ends on the sentence
  WITH 友達 in it, and the cloze then blanks that same word and asks for it. The
  gallery defaults the swap off in cloze mode.

---

## 7. SHIPPED 2026-07-29 — the beat is wired into dynamic reviews

> "can we gracefully implement it in as one of the possible review steps?
> checking for an available one to promote to kanji as a first step when creating
> dynamic reviews? I think that resolves the kanji intro issue entirely"

It does resolve it, but only because of the render gate in §7c — without that the
beat would be a card ABOUT a switch the learner already saw.

### 7a. The pieces

| Piece | Where |
| --- | --- |
| Policy constants | `secondScript/kanjiRollout.ts` — `SWITCHOVER_BEAT_ENABLED`, `KANJI_REVEAL_INTERVAL_DAYS`, `MAX_SWITCHOVER_BEATS_PER_REVIEW`, `SWITCHOVER_GRACE_MODULES` |
| Latch store | `secondScript/kanjiSwitchoverLatch.ts` — `open-lingo-kanji-switch:v1`, id + date, no un-latch API |
| Candidate selector | `secondScript/switchoverCandidate.ts` — `pickSwitchoverCandidates` |
| Step 1 type + view | `kanji_reveal` + `KanjiRevealStepView` + `steps/kanjiReveal/KanjiRevealAnimation.tsx` |
| Step 2 builder | `lesson/data/kanjiClozeStep.ts` (on `fill_blank`) |
| Review wiring | `buildSrsReviewLesson.ts` → `buildSwitchoverBeat`, prepended |
| Latch write | `lesson/data/latchSwitchover.ts`, called from `LessonPage` on completion |
| Render gate | `kanjiSurfaceLatchVisible` in `AnnotatedText.tsx` |

The gallery at `/ja/qa/kanji-reveal` now IMPORTS the shipped animation instead of
keeping a copy, so the sequence that was signed off and the one learners get
cannot drift.

### 7b. The trigger, and where the write happens

Conjunction: `learnerModule >= unlockModule` AND the word is a real switchover
(taught in kana first) AND `interval >= 14` days AND not already latched. Up to
two per review, earliest-unlock first, best-known as tiebreak.

`buildSrsReviewLesson` stays **PURE** — it emits steps and writes nothing. The
latch is written on lesson COMPLETION in `LessonPage`, gated on the CLOZE being
correct. A wrong answer leaves the word unlatched, so it stays kana and the beat
is offered again later: a re-introduction rather than a silent switch on a form
the learner just failed to recognise.

### 7c. The render gate is what makes this an introduction

`kanjiSurfaceLatchVisible` is a sibling of `kanjiFuriganaSrsVisible` — same shape,
a pure store read on a pass-stamped segment. Where that one decides whether the
reading floats, this decides whether the kanji shows at all. Un-introduced
switchover words render as their kana, exactly as before the substitution pass
touched them.

`applyKanjiSurfaces` is UNCHANGED and still module-gated: withholding is a
render-time decision, so the data always carries both forms and every existing
test of the pass still passes. That was the design §4c already called for.

**Blast radius, measured:** turning the gate on broke 7 tests. Six were surfaces
rendering outside a lesson (vocab page, MCQ options, furigana suite) and were
fixed by the fail-open, not by editing them — which is itself evidence the
fail-open is right. The seventh was the step previewer needing a fixture for the
new type.

### 7d. The capacity problem, again — and the number that fixes it

The gate creates a new failure mode: a word the beat never reaches stays kana
FOREVER, which is worse than the silent switch.

Measured 2026-07-29 on the live course: **69 review lessons, 3 per module from
m7**, so **66 at m8+**. Against **124 switchover words**:

- 1 beat per review → 66 slots. **58 words never introduced.** Broken.
- 2 beats per review → 132 slots ≥ 124. Drains, and ~6/module against ~5.6
  newly-eligible/module keeps pace rather than falling behind.

Hence `MAX_SWITCHOVER_BEATS_PER_REVIEW = 2`, pinned by a test that fails if either
number moves.

**And `SWITCHOVER_GRACE_MODULES = 3` as the safety valve**: past unlock+3 the
kanji renders whether or not the beat ever fired. A learner who skips reviews, a
straggler at the tail of the backlog, or a future regression in the selector can
no longer make a kanji permanently invisible. An unknown module (vocab browser,
dictionary, reviewer) also fails open, so a word never looks different depending
on where it is read.

### 7e. Still open

1. **A failed-open word can arrive bare.** The grace window (3) is wider than
   `FURIGANA_WINDOW` (2), so a word that fails open is past its furigana window
   and shows with no reading unless FSRS-unmastered. This is B064's territory —
   latch-date-driven furigana is the fix, and the latch now stores the date for
   exactly that. Pinned by a test so it cannot silently change shape.
2. **The unfair trigger** (§6e.1) is unchanged: oscillating intervals mean a word
   known since m3 can hover at 12–13 days while a shakier word rides past 14.
3. **The latch is device-local.** Not on the SRS sync payload in v1, so a second
   device re-offers the beat for an already-introduced word. A repeated
   introduction, not a lost one — but it wants syncing.
4. **The beat is invisible as a mechanism.** Nothing tells the learner why this
   word, or that a permanent change just happened off one correct answer. The
   steady learner in the simulation called that "the scariest line in here".

---

## 8. TRIGGER REVISED 2026-07-29 — module, not FSRS interval

Spencer asked whether 14 days was the right bar, floated 7 days, and asked me to
verify "7 days is like 4 appearances" and "each word has good exposure throughout
the course". Both checks came back against the interval idea.

### 8a. Measured: 7 days and 14 days are the SAME trigger

FSRS interval growth reviewing strictly on schedule from a fresh card (the first
probe got this wrong by reviewing 8× at the same instant — FSRS growth is a
function of *elapsed* time, so it reported a flat 3d and said nothing):

| answers | rep1 | rep2 | rep3 | rep4 |
| --- | --- | --- | --- | --- |
| all Good | 0d | **5d** | **28d** | 102d |
| all Easy | 9d | 77d | 420d | 2099d |
| all Hard | 0d | 0d | 0d | 0d |

- **7d and 14d are both crossed at rep 3.** FSRS steps 5d → 28d and skips the
  entire range between them, so tuning the threshold changes nothing.
- **all-Hard never grows.** A struggling learner would never be shown a kanji at
  all — the exact opposite of what a reading ladder should do.

So the interval gate is retired (`RETIRED_KANJI_REVEAL_INTERVAL_DAYS` keeps the
numbers next to the reason). **The module is the trigger**, which is also what the
research pass supports: learner complaints track *unpredictability*, not
difficulty.

### 8b. Measured: exposure before unlock is NOT good — and that is a separate bug

Of the 124 switchover words, counted over the compiled course (427 lessons
materialized, 5455 of 7580 steps carry `exercisedAtoms`, so the instrument is
sound):

- **50 have ZERO authored graded exposures before their kanji unlock module.**
- **28 of those are graded NOWHERE IN THE ENTIRE COURSE.** 二 (two) is never
  graded once, anywhere.

The first number is a scheduling observation and is survivable — 一 is graded at
m9/m16/m20, just not between m5 and m8, and its kanji is a single stroke. The
second is a straight content defect that has nothing to do with kanji: 28 taught
words are never reviewed. Filed separately.

This is why the module trigger is safe *enough*: it does not depend on exposure
that may not exist. And it moves the readiness question to where it can actually
be answered — the graded cloze.

### 8c. Miss → one retry → latch anyway

> "it should unlock immediately UNLESS they get the kanji question wrong, then it
> will stay kana and then show them the card one more time in reviews"

Implemented as `MAX_SWITCHOVER_MISSES = 1`. A miss records against the word,
leaves it in kana, and sorts it to the FRONT of the queue so the retry is prompt
rather than six modules later. On the second completed beat it latches regardless
— otherwise one word a learner keeps missing holds a beat slot forever and stays
kana for the rest of the course.

### 8d. Furigana now rides the LATCH DATE (B064, closed for this path)

The module trigger fixes the common case by itself: the beat fires AT the unlock
module, so `furiganaVisibleAt(unlock, unlock)` is true and the module window holds.

The hole is the **backlog**. m22 alone makes 22 words eligible at once and takes
~4 modules to drain at 6 slots/module, so a word unlocked at m22 can be introduced
at m26 — already past unlock+2. If it is also FSRS-mastered (likely for a word
known since m1) it appeared **bare, seconds after its own reveal**.

`kanjiFuriganaSrsVisible` now returns true while `withinFuriganaLatchWindow(atom,
today, FURIGANA_DAYS_AFTER_LATCH = 21)`. The scaffold follows the introduction
instead of the course calendar, which is exactly what the stored latch date was
for.

`SWITCHOVER_GRACE_MODULES` also went **3 → 5**, sized from that same drain: a
grace of 3 would have failed the m22 cluster open *before* their beats ran,
defeating the feature precisely where it is under most load.

### 8e. Device sync — the module trigger helps but does not close it

Asked: "module cutoff resolves that right?" Partly.

- **Fixed:** both devices now agree on *eligibility*, since it no longer depends
  on device-local FSRS intervals. The fail-open is also module-based, so visual
  divergence is bounded at unlock+5 rather than open-ended.
- **Not fixed:** the latch is still device-local, so device B re-offers a beat for
  a word already introduced on device A. A repeated introduction, not a lost one.

Still wants to ride the SRS sync payload before real users see it.

### 8f. The one-time explainer

A single `info` step ahead of the learner's very first switchover — "Words start
showing their kanji" — then never again. Keyed on the latch store being empty
rather than a separate seen-flag, because a learner with nothing latched has by
definition never had a switchover. Spencer's read that the animation itself is
clear enough is taken: this card names the *mechanic* once, not the word.
