# Kanji timing — evidence brief (2026-07-16)

**Question from owner:** *"M8 plus was what we wanted for kanji? any study
show earlier or later as better? do some checks into that"*

**Scope:** a few hours of literature/curricula reading, not a systematic
review. Where I cite a named study I read at least an abstract/summary of
it; where I couldn't get past a paywall/403 I say so. Community sources
(YouTube, blogs) are flagged as such and weighted lower than peer-reviewed
work. This brief evaluates the plan in
`docs/kanji-furigana-plan-2026-07-16.md`, which already found that
`N5_KANJI` (`src/features/languages/ja/secondScript/n5Kanji.ts`) was seeded
with `introducedAtModule: 8` as its floor and recommends piloting the
substitution layer at m14.

## Bottom line up front

**m8+ is defensible but not optimal, and the plan is conflating two
different decisions that the evidence says should be split.** For
**recognition** (kanji shown with furigana, no recall/writing demanded),
evidence and convergent curricular practice both point *earlier* than m8 —
specifically, as soon as core kana literacy is solid (roughly m3, mirroring
where Genki — the most widely used first-year textbook — introduces kanji,
right after its kana-only lessons 1-2). For **production** (writing,
unaided recall, testing without furigana), m8+ is reasonable and arguably
should be even later for some items, because production benefits from
learners already having a vocabulary/grammar foothold for the kanji to
attach to. Treating "kanji" as one on/off switch at a single module number
is the actual mismatch with the evidence, not the specific number 8.

## 1. What the research says

### 1a. Direct timing studies: an honest gap

I could not find a controlled study that directly compares "introduce
kanji to adult L2 beginners at week X" vs "week Y" and measures downstream
outcomes. This is a real gap in the literature, not just a gap in my
search — the closest things are (a) curricular convergence (§2, which is
evidence of professional consensus, not causal proof) and (b) mechanism-
level studies about *how* kanji get learned once introduced, which support
inference about timing even without a direct RCT. **Confidence: high that
this gap exists** (i.e., don't expect the doc to cite a study that says
"module 8 is proven best" — none exists for anyone's curriculum).

### 1b. Furigana as scaffold — helps, but fade matters

- Furigana functions as a **paired-associate phonological gloss**:
  repeated exposure to a kanji+reading pair through furigana supports
  reading and kanji recognition growth over time (general finding
  reflected across the furigana-research search results, including
  "Harnessing furigana to improve Japanese learners' ability to read
  kanji" — I could not get past a 403 to read the full paper, so treat
  this as a title-level lead, not a verified finding). **Confidence:
  medium.**
- Broader L2 glossing research (not furigana-specific, but the same
  mechanism — an L1/phonetic annotation next to an L2 form) shows a
  **facilitative effect on incidental vocabulary learning**, and critically,
  **graduated/dynamic glosses (implicit → explicit hints) outperform static
  always-on-or-always-off glosses** for retention (glossing meta-analyses
  surfaced in search, e.g. a 2026 Frontiers in Language Sciences
  meta-analysis on L2 gloss effects). This is the single most actionable
  finding for **furigana fade policy**: don't treat furigana as a flat
  per-module toggle: make it dynamic per-word based on demonstrated mastery
  (the plan's `kanjiMasteryState` concept already points this direction —
  the evidence supports building it as *graduated*, not binary).
  **Confidence: medium-high** (extrapolating from general L2 glossing
  literature to furigana specifically, which is a reasonable but not
  proven transfer).
- The **"furigana crutch" critique is real and documented**: furigana can
  let a learner process text by sound without ever consolidating the kanji
  form, which is why native Japanese pedagogy already practices gradual
  furigana removal as texts get harder (grade-school readers reduce
  furigana density year over year). But the more recent framing (and the
  native-reader counterexample — manga is furigana-heavy for young readers
  and does not prevent adult literacy) treats furigana as a **temporary
  bridge that should fade, not a feature to avoid**. **Confidence: high**
  that the crutch risk is real; **medium** that fade (vs. avoidance)
  is the correct mitigation — this is the consensus view but I did not
  find a study directly quantifying long-run crutch harm in adult L2
  learners specifically.

### 1c. Script load vs. phonological grounding (L1-alphabetic learners)

- **Chikamatsu (1996, *Studies in Second Language Acquisition* 18:403-432),
  "The Effects of L1 Orthography on L2 Word Recognition":** L1-English
  learners of Japanese rely more heavily on **phonological** information
  when recognizing words; L1-Chinese learners rely more on **visual/
  orthographic** information. **Confidence: high** (well-established,
  frequently cited study, summary consistent across multiple sources).
  **Implication for us:** our learner base is presumptively alphabetic-L1.
  They do not get the "free" visual-pattern head start Chinese-background
  learners get from kanji-shaped literacy. Furigana (a phonological aid)
  is therefore *aligned* with how our specific learners actually process
  words, not a workaround fighting their natural strategy.
- **Mori (1998, *Modern Language Journal*), "Effects of First Language and
  Phonological Accessibility on Kanji Recognition":** for learners from
  phonographic (kana/alphabet) L1 backgrounds, kanji whose reading is
  **phonologically accessible** to the learner are easier to remember than
  ones that aren't. **Confidence: medium-high.** **Implication:**
  furigana-scaffolded kanji recognition isn't just "easier," it's using the
  exact mechanism (phonological access) that this population of learners
  already leans on to encode new characters — another point in favor of
  recognition-with-furigana starting early rather than waiting.
- **Mori & Nagy (1999, *Reading Research Quarterly*), "Integration of
  information from context and word elements in interpreting novel kanji
  compounds":** morphological analysis (using known kanji parts + sentence
  context) is an effective, independently-used strategy for inferring
  unfamiliar kanji compounds. **Confidence: medium-high.**
  **Implication:** kanji learned **embedded in vocabulary/sentences**
  (our substitution-layer approach, which attaches kanji to existing
  `anchorVocab` atom ids) is better-aligned with how learners actually
  process new kanji than kanji drilled as isolated characters
  divorced from words — this is a point *against* Heisig/RTK-style
  isolated-character-first approaches (see §2) and *for* the plan's
  existing choke-point design.

### 1d. The "re-mapping cost" argument (kana-first, kanji-later)

This is the owner's most concrete hypothesis and the literature doesn't
address it head-on, but two adjacent bodies of evidence bear on it:

- The **romaji-vs-kana-first debate** (community consensus, not
  peer-reviewed, but broad and consistent across sources) argues that
  teaching an intermediate representation you'll discard later (romaji)
  costs real relearning time and can fossilize errors, because "you'll
  have to relearn everything later." The same logic applies structurally
  to kana-then-kanji: a word memorized purely in kana (e.g. `一` taught
  as vocabulary at m5, per `N5_KANJI`'s `anchorVocab: ["ja-m5-1-v-1", ...]`)
  and only re-presented in kanji form three modules later, at m8, asks the
  learner to **re-encode a word they already know** rather than attach the
  kanji form at first acquisition. **Confidence: low-medium** — this is
  an analogy from a different (and itself non-peer-reviewed) debate, not
  a direct finding, but it's structurally the same claim and the
  underlying mechanism (dual representations of the same lexical item
  competing for encoding) is a standard concern in word-recognition
  research generally.
- Cutting the other way: **Ausubel's meaningful-learning / advance-organizer
  principle** (new information sticks better when it attaches to an
  existing cognitive structure) argues kanji should come *after* the
  learner already holds the word, its meaning, its sound, and its role in
  a sentence — i.e., a *small* gap between kana-vocab and kanji-form is
  fine or even good, so long as it isn't so large that the word has to be
  "relearned from scratch." A JSL-community articulation of this exact
  argument (chess-master analogy — experts remember meaningful
  board patterns, not random piece placements — attributed loosely to
  Chase & Simon's classic chess-expertise research) appears in
  `research/cure-dolly/ostwBJ7aHAA--...` in this repo. **This is a YouTube
  educator, not academic literature — treat as informed community opinion,
  confidence: low as a standalone source**, but it independently converges
  with Mori & Nagy's context-embedding finding above, which raises my
  confidence in the *underlying principle* (context/embedding beats
  isolation) to medium-high even though this particular source is weak.

**Net read on 1d:** the re-mapping-cost concern is legitimate but the fix
is *shrinking the gap*, not eliminating kana-first sequencing altogether.
Concretely: don't teach a word in kana at m5 and not show its kanji form
until m8 if the kanji is simple and high-frequency (numbers are the
clearest case — `一二三` are 1-3 strokes, phonologically transparent,
already anchored to m5 vocab in the catalog). Save the gap for kanji that
are genuinely harder or lower-frequency.

## 2. What curricula actually do

| Curriculum / product | Kanji timing | Coupling to vocab/grammar | Notes |
|---|---|---|---|
| **Genki I** (most-used US univ. textbook) | Kana-only lessons 1-2; kanji starts **lesson 3** (~week 3-4 of a semester) | Integrated — R&W section pairs each lesson's kanji with that lesson's vocab | Closest real-world analog to "right after kana literacy, early" |
| **Minna no Nihongo** | Main conversation text is kana-only; kanji is a **separate companion workbook**, learner/program-paced | Decoupled track, run in parallel | Architecturally close to our substitution-layer + catalog design |
| **Tobira** (intermediate) | Assumes **~300-400 kanji already known** on entry | N/A — kanji acquisition expected largely done by end of beginner year | Signal that mainstream sequencing front-loads kanji across the whole A1-A2 year, not just from m8 onward — by the point our course would hit an equivalent "intermediate," a lot of kanji should already be behind the learner, not just starting |
| **Quartet** (intermediate, Genki's sequel) | Same assumption as Tobira | Same | Same signal |
| **WaniKani** | Fully decoupled SRS; many users start **day 1**, in parallel with any grammar study | Radical → kanji → vocab, **no grammar at all** | Early + isolated. Useful contrast, not a model to copy — it explicitly punts on grammar/reading-in-context |
| **Heisig / RTK ("Remembering the Kanji")** | Earliest and most decoupled — meaning+writing for ~2000 characters **before or independent of** any vocab/grammar | None — deliberately isolated from words/context | Widely criticized (search results, multiple reviewer sources) for producing writers who still can't read, and for sometimes-invented glosses. **Cautionary tale**, not convergent practice — this is what "too early + too isolated" looks like in the wild |
| **Duolingo Japanese** | Kanji introduced **"later in Section 1,"** after hiragana/katakana are solid; spread gradually across the whole course | Word-context-first — a kanji arrives embedded in a whole known word (e.g. 日本), not drilled as an isolated glyph | **Strongest direct analog** to Open Lingo: also an app-based, self-paced, mass-market course. Confirms "early but not immediate, and always embedded in vocabulary" as the practice among our closest peers |
| **IUC Stanford (10-Month Program, advanced/intensive)** | Kanji taught continuously via a self-paced "Kanji in Context" track from day one of that (advanced) program | Contextual — kanji taught with idioms/example sentences, not isolated | Not a beginner program, but reinforces "context > isolation" as a pattern that holds across levels |

**Convergent-practice read:** mainstream, well-regarded curricula do
**not** wait until "module 8 of 27" (~30% into the course) to start kanji
*recognition* — they start within the first month, immediately after kana
literacy is established (Genki: lesson 3 of 23; Duolingo: later in Section
1 of a much longer course, but still early relative to total course
length). Where practice does resemble a longer wait, it's for **production
depth** (Minna no Nihongo's separate, learner-paced kanji workbook; our
own N5_KANJI's m8 floor) — not for first recognition exposure.

## 3. Where practice contradicts research (and where it doesn't)

- **Heisig/RTK vs. Mori & Nagy:** RTK's isolated-character-first approach
  is common in the self-study community but directly conflicts with the
  context-embedding finding (§1c) and draws the most consistent criticism
  in reviews ("doesn't allow you to read Japanese"). This is a case of
  *popular practice contradicting the evidence* — we should not emulate it.
  Our plan's choke-point design (attach kanji to `anchorVocab` atom ids)
  already avoids this trap; worth stating explicitly as a design
  validation.
- **WaniKani's grammar-free decoupling** also cuts against the
  context-embedding evidence, but WaniKani is honest about being a
  supplement, not a course — less of a contradiction and more of a scope
  choice we don't share (we're a full course, not a kanji drill site).
- **Genki/Duolingo's early-but-embedded timing is *not* contradicted by
  anything found** — it's the one point where curricular practice and the
  mechanism-level research (Mori 1998, Chikamatsu 1996, Mori & Nagy 1999)
  line up cleanly. This is the strongest basis for the recommendation
  below.

## 4. Recommendation mapped to our module structure

| Modules | Recognition (kanji shown, furigana on, no recall test) | Production (recall/writing, tested without furigana) |
|---|---|---|
| **m1-2 (kana acquisition)** | **None.** Evidence and the existing plan agree — this phase's whole point is kana literacy; introducing kanji here undercuts it. | None. |
| **m3-7 (grammar spine)** | **New recommendation: start here**, furigana **always on**, for high-frequency/simple items only (numbers, day/time basics — anything already in `N5_KANJI` with `introducedAtModule` originally set to 8 but `anchorVocab` pointing at m5-m7 atoms). This mirrors Genki's lesson-3 timing and closes the re-mapping gap (§1d) for the cheapest, highest-value characters. | None — production still waits. |
| **m8-22 (themed vocab+grammar, existing catalog range)** | Continues/broadens per current catalog. | **Start here, as currently planned.** This is where the "learner already has a foothold" condition (Ausubel; Mori & Nagy) is best satisfied, and it matches Tobira/Quartet's expectation that kanji accrues steadily across the whole beginner year. |
| **m23-27** | Needs catalog extension (already flagged in the 07-16 plan, §5 of that doc) before any kanji shows up here. | Same — extend catalog first. |

**Furigana fade policy:** make it **per-word and mastery-linked**, not a
per-module flat switch. Concretely: furigana starts always-on for a kanji
the moment it's introduced (recognition), and fades only once
`kanjiMasteryState` shows repeated correct recognition — mirroring how the
graduated/dynamic-gloss research (§1b) outperforms static gloss-or-no-gloss
designs, and how the existing romaji-fade mechanic already works for kana.
Never fully remove furigana for irregular/low-frequency readings (matches
real Japanese-text convention, per the Cure Dolly "usually-kana" discussion
of dictionary UK-marking — some words just keep glosses even for native
adult readers).

**Pilot module reconsideration:** the existing plan recommends piloting
the substitution layer at **m14** (counters) for practical reasons (dense
existing glosses, complex vocab to stress-test the mechanism). That's a
reasonable engineering pilot, but if the goal is also to validate the
*timing* hypothesis in this brief, consider piloting the recognition-only,
furigana-always-on path at **m5** first (numbers: `一二三`, 1-3 strokes,
phonologically simple, already anchored in the catalog to m5 vocab) as a
cheap, low-risk test of "kanji at first vocabulary exposure" before
committing to m14's more complex counters. The two pilots test different
things (m5 = timing/recognition hypothesis, m14 = mechanism/production
robustness) and aren't mutually exclusive.

## 5. What we'd change in the current plan

1. **Split "kanji" into two policies, not one module threshold.**
   The current plan (and `N5_KANJI.introducedAtModule`) treats kanji
   activation as a single on/off gate per module. Evidence supports two
   gates: an earlier **recognition** gate (furigana-always-on, tied to
   first vocabulary exposure, starting as early as m3-5 for simple
   high-frequency characters) and the existing **production** gate at m8+
   (recall/writing, tested without furigana).
2. **Allow m3-7 limited kanji recognition** for the small set of
   very-high-frequency, low-stroke-count characters whose vocabulary is
   already taught there (numbers foremost) — contradicts the current
   plan's blanket "m1-7: no kanji," but only for m3 onward and only in
   recognition mode; m1-2 stays untouched.
3. **Build furigana fade as graduated/per-word (`kanjiMasteryState`-driven),
   not a flat module-wide toggle** — the plan already proposes
   `kanjiMasteryState` as a parallel store; this brief's addition is that
   it should drive *dynamic* fade thresholds (aligned with the
   dynamic-glossing research, §1b), and should have a floor that never
   fully removes furigana for irregular readings.
4. **Reconsider (don't necessarily replace) the m14 pilot** — pair it with
   or precede it by a smaller m5-numbers pilot to test the timing
   hypothesis cheaply before the bigger counters rollout.
5. **No change to m23-27 catalog-extension gap** — that finding stands
   independent of timing philosophy; extend `N5_KANJI` past m22 before
   any kanji appears there, per the existing plan.

## 6. Confidence summary

| Claim | Confidence |
|---|---|
| No direct RCT exists on adult-L2 kanji-introduction timing | High |
| Furigana functions as an effective phonological scaffold | Medium |
| Graduated/dynamic glosses beat static always/never glosses | Medium-high (extrapolated from general L2 glossing research to furigana) |
| Furigana "crutch" risk is real; fade (not avoidance) is the right mitigation | High risk is real / Medium that fade is the proven fix |
| Alphabetic-L1 learners lean on phonological over visual word recognition (Chikamatsu 1996) | High |
| Phonologically-accessible kanji are easier to remember for our learner profile (Mori 1998) | Medium-high |
| Context/vocab-embedded kanji learning beats isolated-character learning (Mori & Nagy 1999; Heisig/RTK criticism) | Medium-high |
| Kana-then-kanji re-mapping cost is a real concern for high-frequency items | Low-medium |
| Genki/Duolingo-style "early but embedded, right after kana literacy" is the convergent professional practice | High (as a description of practice) / Medium (as proof it's optimal) |
| m8+ is a reasonable floor for *production* | Medium-high |
| m8+ is too late for *recognition* of simple, high-frequency kanji | Medium |

## Sources consulted

- Chikamatsu, N. (1996). "The Effects of L1 Orthography on L2 Word
  Recognition." *Studies in Second Language Acquisition*, 18, 403-432.
- Mori, Y. (1998). "Effects of First Language and Phonological
  Accessibility on Kanji Recognition." *Modern Language Journal*.
- Mori, Y. & Nagy, W. (1999). "Integration of information from context and
  word elements in interpreting novel kanji compounds." *Reading Research
  Quarterly*.
- Kondo-Brown, K. (2006) and related affective-variables work (NFLRC
  *Reading in a Foreign Language*) on motivation and kanji/reading outcomes.
- General L2 glossing/incidental-vocabulary meta-analyses (Frontiers in
  Language Sciences, 2026; Cambridge SSLA glossing literature) — applied
  by analogy to furigana, not furigana-specific studies.
- "Harnessing furigana to improve Japanese learners' ability to read
  kanji" (ResearchGate listing; full text not accessible, 403).
- Genki I (Japan Times) — lesson structure, kanji starting lesson 3.
- Minna no Nihongo (3A Corporation) — main text vs. companion kanji
  workbook structure.
- Tobira / Quartet (Kurosio/Japan Times) — assumed prior kanji count.
- WaniKani — public description of radical→kanji→vocab SRS design.
- Heisig, J. *Remembering the Kanji* — multiple independent reviews
  (Migaku, Risu Press, NihongoPeraPera, Language Log) for critique
  consensus.
- Duolingo engineering/curriculum blog — "How we invented a new way to
  teach Japanese"; JLPT Samurai and Kana Conbini explainer posts on kanji
  rollout timing.
- IUC (Stanford) 10-Month Program public page — SKIP kanji-in-context
  description.
- `research/cure-dolly/GRcH2MWSBco--...` and
  `research/cure-dolly/ostwBJ7aHAA--...` (this repo) — JSL YouTube
  educator commentary, used only as a community-opinion cross-check
  against Mori & Nagy, not as a primary source.
- `docs/kanji-furigana-plan-2026-07-16.md` (this repo) — baseline plan
  this brief evaluates against.
