# The kana→kanji switchover — measurement, research, design (B061)

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
