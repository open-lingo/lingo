# Learning Science Foundation — Lingo's "Learn" as a Teacher

Written 2026-05-17. The audit lens for M2 (dakuten + yōon) hand-design and
the load-bearing reference for the forthcoming `docs/lesson-authoring-guide.md`.
Audience: app builders and lesson authors (not researchers). Every research
claim ends with an operational consequence — what to do or stop doing in a
lesson file.

Companion to `docs/curriculum-design-v2.md` (the *what to teach* spine) and
`docs/m1-density-restructure-plan-2026-05-17.md` (the *how dense* structural
contract). This doc is the *why it works* layer underneath both.

---

## 0. Framing — what Spencer asked for, and the gap it has to close

Spencer's framing: **teach → understand → remember**, with foundations first
and retention emerging along the way. SRS and immersion are downstream
multipliers, not the foundation.

That framing is correct in spirit and load-bearing in priority order: most
language apps invert it — they ship memorization without ever teaching, and
hope retention plus exposure produce understanding. They don't. Cognitive
science is clear: retention without comprehension produces inert knowledge
that doesn't transfer (Barnett & Ceci 2002), and the canonical failure mode
of Duolingo-class apps is exactly this inversion.

But "teach → understand → remember" is not yet operational. It collapses
three distinct learning phases into "understand," and it leaves retention
sitting outside the loop instead of woven through it. The cognitive-science
literature converges on a finer-grained cycle that we'll use as Lingo's
operational model:

**Encounter → Encode → Elaborate → Retrieve → Apply → Transfer**

- **Encounter** — first exposure with prior knowledge activated.
- **Encode** — getting the new form into working memory cleanly, without
  cognitive overload.
- **Elaborate** — connecting it to existing schemas; the learner *generates*,
  doesn't just receive.
- **Retrieve** — pulling it back out cold (the testing effect).
- **Apply** — using it in a near-novel context.
- **Transfer** — using it in a *far*-novel context (cumulative composition,
  free production, real conversation).

Retention is **not a separate phase**. It is the emergent property of doing
the cycle properly with spacing, interleaving, and varied retrieval
conditions. A lesson that spaces retrieval poorly forfeits retention no
matter how well it taught the concept. Spencer's framing maps cleanly: his
"teach" = Encounter + Encode; his "understand" = Elaborate + (early) Apply;
his "remember" = Retrieve + Apply + Transfer with spacing/interleaving in the
mortar.

So when authoring a lesson, **do not think "have I taught it / have I tested
it / will SRS remember it"**. Think "has this lesson moved the learner through
all six phases at least once for each new atom, with the harder retrieval
modes weighted toward the back of the lesson?"

---

## 1. The Learning Cycle, properly framed

### Bloom's revised taxonomy (Anderson & Krathwohl 2001)

Six levels of cognitive engagement, in increasing depth: **Remember,
Understand, Apply, Analyze, Evaluate, Create**. Most language-app drills sit
at Remember (recognize the kana) or low Understand (match kana to romaji).
Particle drills attempt Apply but, when patternized as M3-M7 currently are
(see m1-density doc), collapse back to Remember by exploiting surface cues.

**So when authoring a lesson**: tag each drill block step with the Bloom
level it actually targets, not the level you hope it targets. A
`particle_cloze` where one particle is correct 6 times in a row is a
Remember step disguised as Apply. Fix the disguise (rotate answers, mix
particles) or accept that the step does nothing.

### Cognitive Load Theory (Sweller et al. 2019)

Three load types compete for the same working-memory bandwidth:

- **Intrinsic load** — inherent difficulty of the material (yōon きょ has
  two-glyph composition; intrinsic load is real).
- **Extraneous load** — cognitive cost imposed by *how* the material is
  presented (chrome, distractor noise, layout shifts, romaji-on-kana when
  the question *is* the reading).
- **Germane load** — effort spent on schema construction (good load — this
  is the work we want).

The **worked-example effect**: novices learn more from studying worked
examples than from solving problems unaided. The **expertise reversal
effect**: once schemas are built, the same worked examples *hurt* — the
expert needs to retrieve, not re-read.

**So when authoring a lesson**: strip extraneous load mercilessly (this is
why `optionsHideRomaji` exists). Use worked examples *before* the first
production step in any new grammar concept — show two solved cases before
asking the learner to do their own. Then fade the scaffold within the same
lesson; the post-rule cloze should be unscaffolded.

### Schema theory (Bartlett 1932; Rumelhart 1980)

Learning is the construction and assimilation of schemas — structured mental
representations that let the learner predict, parse, and slot new
information. New material that connects to an existing schema sticks; new
material that floats sinks.

**So when authoring a lesson**: every new concept must be introduced
*against* a known schema. "が is like the spotlight" works because English
speakers already have a spotlight metaphor; "が is the nominative case
marker" doesn't, because the schema doesn't exist.

### Generation effect (Slamecka & Graf 1978)

Learners who **produce** the answer (even with effort and errors) retain
materially better than learners who **read** the answer. Replicated across
dozens of contexts.

**So when authoring a lesson**: every lesson must include at least one
*generation* step — `build_sentence`, `listening_build`, `speaking`,
`symbol_production`, or (when adopted) `translate`. A lesson composed
entirely of `phrase_card` + `multiple_choice` selection-from-options has
*zero generation* and will not stick.

### Desirable difficulties (Bjork & Bjork 2011)

Conditions that slow acquisition but *improve* long-term retention and
transfer: spacing, interleaving, generation, varying conditions, testing
instead of re-studying. Conditions that speed acquisition but *hurt*
retention: massing, blocking, re-reading, recognition-only formats.

**Caveat**: difficulty is only desirable when the learner can still succeed
most of the time. Pure desirable-difficulty piled on a beginner is just
failure. The expertise reversal applies.

**So when authoring a lesson**: introduce a concept with massed, blocked,
scaffolded practice (necessary for encoding), then transition to spaced,
interleaved, unscaffolded practice within the same lesson. M1 ka does this
already: tracing is massed at the start, recognition is interleaved in the
middle, `symbol_to_sound` (production-shaped recall) is at the end.

### Retrieval practice (Roediger & Karpicke 2006)

The "testing effect" — retrieving information from memory strengthens that
memory more than studying the same information for the same duration.
Replicated as one of the most robust findings in education psychology.
**Free recall > cued recall > recognition** as a retention multiplier; all
three beat re-reading.

**So when authoring a lesson**: at least one retrieval step per new atom,
and prefer production over recognition wherever the modality allows. A
4-option MCQ where 3 distractors are obviously wrong does almost nothing
for retention — the learner recognized rather than retrieved.

### Interleaved practice (Rohrer & Taylor 2007; Birnbaum et al. 2013)

Mixing related-but-distinct problem types within a single session improves
*discrimination* and transfer relative to blocked practice. Cost: in-session
performance feels worse. Benefit: post-session retention and transfer are
substantially better.

**Important boundary**: interleaving helps for material the learner needs
to *discriminate* (は vs が, に vs で). It *hurts* during the initial
encoding of a single concept — you need some blocked practice first or the
encoding never happens.

**So when authoring a lesson**: block briefly during introduction (the
exposure block), then interleave aggressively in the drill block. The
"6 consecutive が-cloze" pattern in current M6-6 is pure blocking with no
interleaving — pedagogically the worst of both worlds because the
intrinsic-discrimination signal is what makes particles hard in the first
place.

### Spaced practice (Cepeda et al. 2006 meta-analysis; Pashler et al. 2007)

Distributing study across multiple sessions beats massing the same total
time in one sit. Optimal spacing is **ratio-based**: gap ≈ 5–25% of the
target retention interval. For one-week retention, ~1 day. For one-month
retention, ~1 week.

**So when authoring a lesson**: in-lesson spacing matters too — separate
the first encounter of a concept from its first retrieval by at least 4–6
intervening steps. M1 vowels lesson does this: あ is introduced at step 2,
first appears in `symbol_to_sound` (production-shaped retrieval) at step
~21. That's the desirable-difficulty gap.

### Dual coding (Paivio 1971; Mayer 2009)

Information encoded in **both** verbal and visual channels is retained
better than information encoded in one channel alone, because the two
encodings are stored separately and provide independent retrieval routes.
Mayer's multimedia learning principles (contiguity, modality, redundancy,
coherence) operationalize this.

**Caveat**: extra audio/visual that doesn't carry meaning is *extraneous
load* and hurts. Background music, decorative images — bad. Anchor emoji
that *is* the meaning (🐚 = shell) — good.

**So when authoring a lesson**: every new vocab item gets audio + image (or
emoji) + script. `word_image_mcq` is the dual-coding workhorse — keep using
it. Don't add decorative chrome that doesn't aid retrieval.

### Worked examples + fading (Renkl & Atkinson 2003)

The optimal trajectory for novices: complete worked example → partially
completed example → unscaffolded problem. The fading must happen *within*
the learning sequence, not across sessions.

**So when authoring a lesson**: when introducing a new grammar concept,
the `grammar_rule` card *is* the worked example. Within the same lesson,
the first cloze should have a near-trivial answer (high scaffold via
context), the middle clozes should require active recall, the final
production step should be unscaffolded.

### Conceptual change (Posner et al. 1982; Chi 2008)

When learners hold an incorrect prior model (English speakers' "particles
are like prepositions"), simply teaching the correct model on top doesn't
work — the old model persists and the new information slots into the wrong
schema. Conceptual change requires:

1. **Dissatisfaction** with the prior model (show it fails).
2. **Intelligibility** of the new model.
3. **Plausibility** of the new model.
4. **Fruitfulness** — the new model solves problems the old one couldn't.

**So when authoring a lesson**: for grammar concepts where L1 transfer
causes systematic error (は vs が, transitive/intransitive pairs, には/では
double-particles), include a *confrontation* step that shows the L1-model
prediction failing. A sentence pair with identical English translations but
different particle choices, where the particle choice *flips meaning*,
forces dissatisfaction. This is the missing step type in Lingo's current
toolkit (see §6).

### Transfer of learning (Barnett & Ceci 2002)

Transfer is taxonomized along several dimensions (knowledge type, context,
modality, time). **Most claims of "far transfer" in education are
inflated** — actually-replicated transfer is mostly near and within-domain.
The mechanism: transfer requires explicit prompting at acquisition ("notice
that this rule applies to other verbs too") plus practice in varied
contexts.

**So when authoring a lesson**: near transfer (apply the rule to a new word
in the same sentence frame) is achievable and worth pursuing. Far transfer
(apply Japanese particles to learning Korean particles) happens or doesn't
on its own. Don't oversell. Within Lingo: every grammar lesson should
include at least one cloze/build using vocab the learner hasn't seen in
that pattern before — that's near transfer.

### Direct instruction vs minimal guidance (Kirschner, Sweller, Clark 2006)

The canonical critique of pure-discovery learning: novices lack the schemas
needed to discover the underlying principle on their own; minimally guided
instruction overloads working memory and produces worse outcomes than
direct instruction with worked examples. The position is contested by some
constructivists but the evidence base for direct instruction in novice
acquisition is overwhelming.

**So when authoring a lesson**: do not make the learner infer the rule from
exposure alone. Duolingo's "silent pattern match" approach to particles is
exactly the minimally-guided failure mode Kirschner et al. critiqued. Use
explicit `grammar_rule` cards before drills, every time.

### Comprehensible input (Krashen 1985)

The claim: language is acquired through exposure to input slightly above
the learner's current level (i+1), and explicit instruction does not
produce acquisition, only "learning" (the conscious-knowledge sibling that
doesn't transfer to fluency).

**Position**: Krashen's input hypothesis as stated is **not well supported
by the contemporary evidence**. SLA research (Norris & Ortega 2000
meta-analysis; DeKeyser 2007) shows explicit instruction outperforms pure
exposure for adult learners on most measures. **But** the *operational
prescription* — provide lots of mostly-comprehensible material in the
target language — is still good practice for fluency and intuition
building, just not a complete theory.

**So when authoring a lesson**: comprehensible input is a *supplement*, not
the foundation. Lingo's existing approach (explicit teaching + drills + a
small amount of in-context exposure via dialogue) is correct. Resist the
pull to drop instruction in favor of "more exposure."

### Skill acquisition stages (Anderson 1982; ACT* model)

Three stages:
1. **Cognitive** — declarative, slow, error-prone, requires conscious attention.
2. **Associative** — proceduralized, faster, fewer errors, less attention.
3. **Autonomous** — fast, automatic, attention-free.

Transition between stages requires *practice* — specifically, retrieval
practice with feedback. The number of repetitions needed scales with the
complexity of the rule.

**So when authoring a lesson**: a learner who has just had a grammar rule
explained is in the cognitive stage and needs heavy scaffolding (worked
example, scaffolded cloze). By the end of the lesson they should reach
early associative for that rule. Reaching autonomous takes weeks of spaced
retrieval — that's where FSRS earns its keep.

### Mastery learning (Bloom 1968; Guskey 2007)

The principle: don't advance the learner until they demonstrate mastery
(typically 80–90%) of the current unit, and provide alternative
instruction + re-testing for those who don't pass. Produces ~1 standard
deviation improvement over traditional instruction.

**So when authoring a lesson**: this is exactly what the row-test +
review-tail (#84) implements. Keep it. Extend it to grammar concepts —
the M3+ baked review lessons (per m1-density doc §5) are the grammar
analog of row tests.

---

## 2. What "Teaching" actually requires

Five operational practices, ordered by where they appear in a lesson.

### 2.1 Activating prior knowledge before introducing new material

Ausubel (1968): "The most important single factor influencing learning is
what the learner already knows." Mayer's *pre-training principle* (2009):
when learners know the names of key components before a multimedia lesson,
they learn better.

The neural mechanism: schemas in long-term memory are activated and brought
into working memory, freeing working-memory bandwidth for the new material
(reducing intrinsic load on the new content because the prior schema is
"prepaid"). Without activation, the new material competes with the act of
retrieving the prior schema, and both suffer.

**Lingo today**: `info` cards at lesson open *attempt* this ("Two new kana
that add 'k-' to a vowel you already know" — ka-1 step 1). Good when it
names the prior schema explicitly; bad when it just says "next lesson:
particles." The opening info card should *name the bridge*, not just
announce the topic.

**So when authoring a lesson**:
- Open every lesson with a 1-sentence reminder of the prior schema the new
  material attaches to. ("You know how は marks the topic — が is what you
  use when the *new information* IS the subject.")
- For M2 dakuten lessons: the opening info should remind the learner that
  か is shaped like が minus two dots — anchor in motor memory they already
  have.
- For grammar lessons: name the L1 schema being repurposed AND name what
  will break. ("In English you use prepositions for time and place. In
  Japanese you use particles, but に and で split the work differently than
  English does.")

### 2.2 Worked examples in the cognitive stage

Sweller's worked-example effect: novices learn more from studying a
complete solution than from struggling with the problem. The mechanism is
straight cognitive load — the worked example absorbs the rule-application
labor, freeing working memory to encode the rule itself.

The fading sequence: complete worked example → partial-completion example
(some steps blank) → fully unscaffolded problem. Renkl & Atkinson (2003)
show that backward-faded examples (final step blanked first, then second-
to-last, etc.) outperform forward-faded.

**Lingo today**: `grammar_rule` step gives the rule + 2 examples + 1
anti-pattern. That's a worked example. Then it jumps straight to
unscaffolded `particle_cloze`. **The faded middle step is missing.**

**So when authoring a lesson**:
- After `grammar_rule`, the *first* drill step should be the easiest
  possible cloze (clear context, distractors that are obviously category-
  wrong). This is the partial-completion stage.
- Then 1-2 medium cloze with at least one near-miss distractor (forces the
  rule, not the surface heuristic).
- Then an unscaffolded production step (`build_sentence`, `speaking`).
- For M2 dakuten: contrast card (か → が) is the worked example;
  unscaffolded `symbol_recognition` is the unscaffolded problem; in
  between, a `symbol_to_sound` where the romaji label "ga" is one of two
  near-options ("ka" / "ga") is the partial fade.

### 2.3 Concept first, label second (or vice versa)

Mayer's multimedia principles converge on: when the *concept* is concrete
(an object, a scene), show the concept then label it; when the *label* is
arbitrary (a phoneme, a particle), present concept and label together
(temporal contiguity).

For language: vocabulary is concept-first (image → kana label), grammar is
typically rule-first-then-example (the rule names the concept the example
demonstrates).

**Lingo today**: `word_image_mcq` is correctly concept-first (English
meaning is the prompt; kana option-tap reveals the label). `symbol_intro`
is correctly label-first-with-immediate-example.

**So when authoring a lesson**: respect the direction. Don't introduce a
new kana by showing the romaji and asking the learner to guess the kana —
that's testing before teaching. Don't introduce vocab with the kana first
and the meaning hidden — that strips dual-coding.

### 2.4 Multiple representations (dual coding done right)

Paivio (1971) + Mayer (2009): material encoded across modalities (visual,
auditory, kinesthetic) has multiple retrieval routes. The retrieval routes
are *independent* — a learner who can't retrieve via the auditory route
may still retrieve via the visual.

Practical implication: every new atom should be encoded across ≥2 channels
before the lesson ends, and retrieved via ≥2 channels in the drill block.

**Lingo today**: M1 hits 3 channels per kana (visual via intro/recognition,
auditory via TTS preview, kinesthetic via trace). Each retrieved separately.
This is gold-standard. **M3-M7 vocab introduction only hits visual + audio,
no kinesthetic.** That's an authoring miss — `listening_build` is the
kinesthetic-tile equivalent for words and it costs nothing to add.

**So when authoring a lesson**:
- Every new vocab item should appear in ≥2 retrieval modalities before the
  lesson ends.
- Every new grammar concept should appear in ≥2 drill formats (cloze AND
  build, not just 6 cloze).
- For M2 dakuten: each new kana needs visual recognition + auditory
  recognition + at least one use in a `listening_build` or
  `build_sentence`. Skipping the build is what makes M2 thin even though
  the contrast card is good.

### 2.5 Anchoring with high-frequency exemplars

The *anchor word* pattern Lingo uses is grounded in two converging
literatures:

- **Concreteness effect** (Paivio 1971): concrete, imageable words are
  remembered better than abstract.
- **Episodic-to-semantic transfer** (Tulving 1972; modern: McClelland 2013
  CLS): a vivid first encounter with a concrete exemplar becomes the
  retrieval anchor for the abstract rule.

The kana row needs an anchor word for the same reason the alphabet needs
"A is for Apple" — the word becomes the proxy when the bare symbol fails to
retrieve.

**So when authoring a lesson**:
- One anchor word per row, used in MCQ + build + listening_comp + speaking
  + row-test pool. (M1 ka does this; M2 g uses only かぎ once — see m1-
  density §6.)
- Anchor words must be: high-frequency in target language, imageable
  (emoji exists), composed entirely of *already-introduced* characters,
  and culturally neutral or culturally-grounded-in-target.
- For M2: each dakuten row needs an anchor that uses ONLY the new voiced
  kana plus prior M1 kana. かぎ works for g-row; we need similarly clean
  anchors for z/d/b/p rows.

---

## 3. What "Understanding" actually requires

The hardest section to operationalize. Understanding is what separates "can
recognize the kana" from "can read." Five practices, ranked by current gap
in Lingo.

### 3.1 Generative processing (Dunlosky et al. 2013)

Dunlosky's massive review of study techniques rated **practice testing**
and **distributed practice** as the only "high utility" techniques across
domains. The next tier — self-explanation, interleaved practice,
elaborative interrogation — was rated "moderate utility." Highlighting,
re-reading, and summarization were rated "low utility."

The generative subset:
- **Self-explanation** — learner explains in their own words why the
  example works.
- **Elaborative interrogation** — learner answers "why is this true?"
  prompts.
- **Paraphrasing** — learner restates the rule in their own words.

These are absent from Lingo's current toolkit. There is no step type that
prompts "why does が work here and not は?" with a free-text or
multi-select answer.

**So when authoring a lesson**: until a `self_explanation` step type
exists (see §6), simulate it via a *targeted* `multiple_choice` that asks
*why* the answer is what it is, not just what the answer is. After a
particle cloze, ask "Why が, not は?" with 3 options: "because the speaker
is new to the conversation" / "because this is new information being
introduced" (correct) / "because は is only for questions". This is a
generative-processing proxy that fits in the existing schema.

### 3.2 Productive failure (Kapur 2008, 2016)

Counterintuitive finding: letting learners attempt a problem **before**
being taught the solution, *even when they fail*, produces better
understanding than teaching first then practicing. The mechanism: failed
attempts activate prior knowledge, surface gaps, and create the schema
slots the subsequent instruction fills.

**Important boundary**: productive failure works for concepts where the
learner has some relevant prior knowledge to bring to bear. For pure
arbitrary mappings (kana shapes, vocabulary), there is no productive in the
failure — it's just failure.

**So when authoring a lesson**: for grammar concepts that map to L1
intuition (transitive/intransitive verbs, は vs が), consider starting the
lesson with a 1-step "guess this" before the rule card. The learner reads
two near-identical sentences, picks which means what, finds out they were
wrong, then gets the rule that explains why. For kana, dakuten, and
vocabulary, do NOT use productive failure — there's no productive
generation possible from "guess the new kana."

### 3.3 Schema construction

Spencer's "understanding" maps cleanest here. Understanding is the *schema*
— the structured mental representation that lets the learner predict and
parse. Schema construction requires:
- **Multiple examples** that span the rule's range.
- **Comparison** between examples to extract the invariant.
- **Anti-examples** that mark the rule's boundary.

**Lingo today**: `grammar_rule` step provides examples and an anti-pattern
(good). But the *comparison* step is absent — there's no step where the
learner sees example + anti-example side-by-side and has to identify what
the rule extracts.

**So when authoring a lesson**: in every grammar lesson, include one
*compare-and-pick* step where two near-identical sentences differ only in
the rule-relevant element, and the learner picks which is right *and why*.
This is the schema-construction step. Cost: adapt `multiple_choice` with a
2-pane sentence prompt.

### 3.4 Conceptual change (Chi 2008; Posner et al. 1982)

When the new model contradicts an L1 model, simple instruction doesn't
displace the old model — both coexist and the old model wins under time
pressure. Conceptual change requires the 4-step sequence above
(dissatisfaction → intelligibility → plausibility → fruitfulness).

For English speakers learning Japanese, the canonical conceptual-change
problems are:
- **Particles are not prepositions.** They mark grammatical role, not
  spatial relation.
- **は is not "is".** It's a topic marker; the topic isn't always the
  subject.
- **Transitive/intransitive verb pairs.** English collapses them; Japanese
  marks them lexically.
- **Counters.** English has "a sheet of paper" / "a head of cattle" but
  Japanese has dozens; the schema is denser.
- **Pitch accent.** English speakers don't notice it; it's contrastive in
  Japanese.

**Lingo today**: zero conceptual-change steps. The `grammar_rule`
anti-pattern is the closest thing, but it's still teach-by-telling, not
teach-by-confrontation.

**So when authoring a lesson**: for L1-contrastive grammar (M4 は/が,
M5 transitive/intransitive, M6 に/で), include a *confrontation* step that
shows two minimally-different Japanese sentences with different English
translations driven by the rule element. Force the learner to attempt
translation/picking, get it wrong (productive failure), then get the rule
that resolves the contradiction. This is the load-bearing move for the は/が
lesson — without it the learner will sit in "は = is, が = also is" forever.

### 3.5 Near vs far transfer (Barnett & Ceci 2002)

Near transfer (same concept, new instance) is achievable and worth
designing for. Far transfer (concept moves to a new domain) mostly happens
on its own or doesn't. **Don't oversell transfer.** Most claims of
transfer in education research don't replicate.

**So when authoring a lesson**: ensure every drill block includes ≥1 step
that uses the rule on vocab the learner hasn't seen in that pattern before
(near transfer). Don't expect or claim "you've learned が, so you'll
understand topic-prominence in Korean too" — that's far transfer and you
haven't earned it.

---

## 4. What "Remembering" requires

Retention is the emergent property of doing the cycle right with the right
scheduling. Five mechanics, all empirically robust.

### 4.1 Retrieval practice — and the kind matters

Roediger & Karpicke (2006): testing > studying for retention. **But the
*type* of retrieval matters.**

- **Free recall** (produce from nothing): highest retention multiplier,
  highest difficulty.
- **Cued recall** (produce from a cue — fill-in-blank, listening_build):
  middle.
- **Recognition** (pick from options): lowest retention multiplier; can
  generate false confidence because in-session performance is high.
- **Re-reading**: trivially low. Studied repeatedly because students do it;
  not because it works.

**So when authoring a lesson**: every lesson must include at least one
cued-recall or free-recall step. `listening_build`, `build_sentence`, and
`speaking` are the cued/free recall workhorses. `multiple_choice` is
recognition — it has its place (early drill, distractor-based
discrimination) but it cannot carry retention alone. Lessons composed of
6 MCQ + 0 production are *recognition-only* and will not produce
durable memory.

### 4.2 Spacing — ratio-based, not fixed

Cepeda et al. (2006) meta-analysis: optimal gap between repetitions is
**5-25% of the desired retention interval**. For one-month retention,
~1-week gaps. For one-year retention, ~1-month gaps. **Fixed-interval
schedules underperform expanding intervals.** FSRS-6 implements this
optimally; we already use it.

**In-lesson spacing matters too**: within a single lesson, gap between
first encounter of a concept and first retrieval should be ≥4-6 intervening
steps (mini-spacing). M1 ka-1 does this: か introduced at step 2, first
production-shaped retrieval (`symbol_to_sound`) at step 12.

**So when authoring a lesson**: do not test a concept immediately after
introducing it within the same lesson. Insert ≥4 other steps between
introduction and first hard retrieval. The retrieval should feel slightly
hard — that's the desirable difficulty paying retention dividends.

### 4.3 Interleaving — when it helps and when it hurts

Birnbaum et al. (2013): interleaving boosts discrimination between related
categories (bird species, math problem types, Japanese particles). It
*hurts* during initial encoding of a single concept.

Rule: **block while encoding, interleave once encoded.** The M1 template
implements this exactly — block at the intro/trace level for each kana
(massed in one mini-segment), interleave across kana in the drill block
(recognition + mcq + build mixed).

**So when authoring a lesson**: introduce concepts one at a time with
blocked practice (3-4 consecutive steps on that single concept), then
interleave them in the drill block (no two adjacent steps targeting the
same atom). The "6 consecutive が" pattern in M6-6 is the inverse — pure
interleaving of nothing, since there's only one answer. Bad.

### 4.4 Sleep and consolidation (Diekelmann & Born 2010)

Memory consolidation happens during sleep — particularly slow-wave sleep
for declarative memory and REM for procedural. Sleeping shortly after
learning beats staying awake for the same duration. This is why FSRS-style
overnight gaps work: the first review is *after* a consolidation window.

**Pacing implication**: lessons clustered in a single sit produce less
durable memory than the same lessons spread across days. We don't control
when the learner studies, but we can *recommend* and we can *gate* —
showing a "come back tomorrow for review" prompt is more pedagogically
sound than a "do another lesson" prompt at session end.

**So when authoring a lesson** (and the surrounding session UX): respect
the consolidation window. The lesson-end screen should suggest a session
break when the learner has done ≥3 lessons. Pushing for "one more" is
short-term-retention-positive and long-term-retention-negative.

### 4.5 Desirable difficulties, integrated

The five practices above are the operational form of "desirable
difficulties": generation, spacing, interleaving, varying conditions
(visual / auditory / kinesthetic retrieval routes), and testing instead of
re-studying. A lesson that hits all five for each atom will produce
retention; a lesson that hits none will produce momentary recognition that
fades within the week.

**So when authoring a lesson**: hold each new atom against the
desirable-difficulty checklist before shipping. If the atom is only
recognized (not produced), only practiced in one modality, only seen in
adjacent steps, only retrieved immediately after introduction — fix any
two of those four and retention will materially improve.

---

## 5. Mapping to Lingo's step types

Read against `src/features/lesson/types.ts:4-24` (StepType union, 20
types). The columns: which phase of the Encounter→Encode→Elaborate→
Retrieve→Apply→Transfer cycle, what cognitive function, what the research
says it does well, current Lingo usage notes, and recommended frequency
per lesson role.

| Step type | Phase(s) | Cognitive function | Research backing | Current Lingo usage | Recommended frequency |
|---|---|---|---|---|---|
| `info` | (chrome) | Frame, name prior schema, payoff | Ausubel pre-training, Mayer signaling | Bookends in M1; over-used as filler in M3-M7 (avg 2/lesson where 1 would suffice) | 1-2/lesson, open + close only |
| `teach` | Encounter | First exposure with explanation | Worked-example, dual coding | Underused in JA; legacy carry-over | Per new atom in non-symbol contexts |
| `multiple_choice` | Retrieve (recognition) | Discrimination from options | Retrieval practice (weakest tier) | Heavy in M1, replaced by `particle_cloze`/`word_image_mcq` in M3+ | 1-2/drill block, NOT as sole retrieval |
| `build_sentence` | Elaborate, Apply | Cued recall, syntactic production | Generation effect | Used in dedicated build lessons only; missing from drill blocks | ≥1 per content lesson |
| `match_pairs` | Retrieve (cued recall) | Bidirectional association | Retrieval practice, cumulative | Almost unused in JA M3-M7 (zero in census) | 1 per drill block for cumulative vocab |
| `fill_blank` | Apply | Cued recall in context | Generation effect, cloze procedure (Taylor 1953) | Almost unused; superseded by `particle_cloze` | 1 per lesson when grammar concept ≠ particle |
| `translate` | Apply, Transfer (near) | Free production from L1 prompt | Generation effect (strongest), L1→L2 production | **UNUSED in any JA M1-M7 lesson** | 1 per drill block once IME grading is robust |
| `listening_comprehension` | Retrieve, Apply | Audio → meaning recall | Dual coding, retrieval | Used in M1 ka; missing in M3-M7 census | 1-2 per content lesson |
| `listening_build` | Encode, Retrieve | Audio decoding + tile production | Dual coding + generation | Heavy in M1; rare in M3-M7 | 1 per vocab lesson |
| `speaking` | Apply, Transfer | Free production (motor) | Generation effect (motor), STT feedback | 1 per row in M1; 1 per dialogue in M3-M7 | ≥1 per content lesson |
| `symbol_intro` | Encounter | First exposure to symbol | Encoding | M1 only (kana introduction) | Per new symbol, once |
| `symbol_trace` | Encode (motor) | Kinesthetic encoding | Embodied cognition, motor memory | M1 only; correctly skipped in M2 (derived kana) | Per new symbol in M1; never in M2+ |
| `symbol_recognition` | Retrieve (audio→visual) | Cued recall | Retrieval, dual coding | M1 + M2 | Per new symbol in intro + 1 cumulative |
| `symbol_production` | Apply (motor production) | Free recall via drawing | Generation, motor | Defined but **unused in current JA lessons** | Wake up for M1 row-test tail |
| `symbol_to_sound` | Retrieve (visual→audio) | Production-shaped recall (hard direction) | Generation, expertise-end placement | M1 ka + vowels; **missing from M2** | Per new symbol, at end of sub-lesson; add to M2 (m1-density §6) |
| `word_image_mcq` | Encounter, Retrieve | Concept-first vocab via dual coding | Concreteness effect, dual coding | M1 + M2; sporadic in M3-M7 | 1 per new vocab atom |
| `phrase_card` | Encounter | Exposure (no retrieval) | Comprehensible input (supplement) | Over-relied in M3-M7 (avg 5+/lesson; bulk of "real work") | ≤2/lesson; never the bulk of a lesson |
| `grammar_rule` | Encounter, Encode | Direct instruction + worked example | Worked-example effect, direct instruction | M3+ only; correctly always followed by drill | 1 per grammar lesson |
| `particle_cloze` | Apply | Discrimination in context | Cloze procedure, schema construction | Heavy + patternized in M3-M7 (see m1-density §2) | 2-3 per drill block, never consecutive same-answer |
| `row_test` | Retrieve, Apply (mastery) | Mastery gate via review-tail | Mastery learning (Bloom 1968) | M1 + M2 | 1 per row/module |

### Coverage gaps at a glance

- `translate`, `symbol_production`, `match_pairs`, `fill_blank` are
  defined but materially underused.
- `phrase_card` is over-used as a substitute for genuine retrieval steps.
- No step type currently serves: **self-explanation, productive failure,
  conceptual change confrontation, free comprehensible-input reading,
  metacognitive confidence rating** (see §6).

---

## 6. Gaps in Lingo's current toolkit

Ranked by impact-on-M2-and-M3-design.

### 6.1 No conceptual-change confrontation step (HIGH IMPACT for M4+)

**Research**: Posner et al. 1982; Chi 2008. L1-contradicting concepts
require confrontation, not just instruction.

**What it would look like**: a 2-pane step. Two minimally-different
Japanese sentences are shown. Learner picks which means X and which means
Y. After commit, the rule is revealed explaining the differentiator. If
the learner got it wrong, the explanation explicitly names the L1
expectation that misled them.

**Effort**: medium — new step type, but visually it's a `multiple_choice`
with 2 options each presented as a sentence card.

**Blocking?**: M4 (は/が) cannot work without this. M2 doesn't need it
(dakuten is not L1-contrastive). Build before M4 ships.

### 6.2 No self-explanation / elaborative-interrogation step (HIGH IMPACT for M3+)

**Research**: Dunlosky et al. 2013 (moderate utility, robust across
domains).

**What it would look like**: after a `particle_cloze` answer commits, a
follow-up `self_explanation_mcq` asks *why* that answer was right. Three
options: surface heuristic (wrong), rule-citing (correct), unrelated
distractor (wrong). The step type is structurally a `multiple_choice` but
semantically labeled differently for authoring + telemetry.

**Effort**: small — reuse `multiple_choice` rendering; add a step type that
tags it as a follow-up.

**Blocking?**: not blocking M2; high-leverage from M3 onward. Build before
M3 rebuild lands.

### 6.3 No free-recall production / IME-typed translation (MEDIUM IMPACT)

**Research**: Slamecka & Graf 1978 (generation effect — production
strongest). Roediger & Karpicke 2006 (free recall > cued).

**What it would look like**: `translate` step (already defined in
types.ts:133-140 but **unused**) wired with an IME-aware input that grades
against `acceptedAnswers`. For Japanese this is hard because the learner
might type Romaji-IME → kana, kana directly, or kanji where furigana was
expected.

**Effort**: large for full IME grading; small if we accept Romaji input
and grade against a transliterated answer set.

**Blocking?**: not blocking M2. Worth a small-scope MVP (Romaji-graded)
before M3 rebuild for the drill-block variety it unlocks.

### 6.4 No comprehensible-input reading step (LOW IMPACT now, MEDIUM later)

**Research**: Krashen 1985 (contested but operationally useful), Mayer
multimedia.

**What it would look like**: a chunk of native-level text (~3-5 sentences)
where ≥85% of vocab is known, with hover-to-reveal glosses. No quiz at the
end — the goal is exposure, not assessment. Optional comprehension
question after.

**Effort**: medium — new step type, plus a content authoring burden
(hand-pick the texts).

**Blocking?**: not blocking M2 or M3. Defer to M5+ when learner vocab is
big enough to sustain 85% known.

### 6.5 No metacognitive confidence prompt (LOW IMPACT)

**Research**: Hacker et al. 2008 on metacognition; Bjork's work on
judgment-of-learning calibration.

**What it would look like**: occasional "How confident were you?" 1-3
slider after a hard step. Feeds into the SRS scheduler as a difficulty
signal; teaches the learner to calibrate their own knowledge state.

**Effort**: small.

**Blocking?**: not blocking. Nice-to-have; defer to post-M2 polish.

### 6.6 Worked-example-with-fading sequence (HIGH IMPACT, no new step type needed)

**Research**: Renkl & Atkinson 2003; Sweller worked-example effect.

**What it would look like**: not a new step type — an *authoring pattern*.
Within each grammar lesson, the cloze sequence must go: easiest cloze
(near-trivial), medium cloze, unscaffolded production. The `grammar_rule`
is step 1; the partially-faded cloze is step 2; the unscaffolded cloze is
step 3+.

**Effort**: zero engineering; pure authoring discipline. Belongs in the
authoring guide.

**Blocking?**: not blocking M2 (no grammar in M2). Critical for M3-M7
rebuild.

---

## 7. Audit Checklist — hold against every hand-designed lesson

22 yes/no questions. Each gives the research backing in a parenthetical.
If a lesson fails ≥3 of these, do not ship — restructure first.

### Encounter / Encode

1. **Does the lesson open with a 1-sentence reminder of the prior schema
   the new material attaches to?** (Ausubel 1968 — activate prior
   knowledge before encoding.)
2. **For every new concept, is there a worked example before the first
   unscaffolded production step?** (Sweller; Renkl & Atkinson 2003.)
3. **Is intrinsic load isolated — at most 1 new grammar concept and ≤5
   new vocab items per lesson?** (Cognitive Load Theory.)
4. **Is extraneous load minimized — no romaji-on-kana when the question
   tests the reading, no decorative chrome, no off-topic illustrations?**
   (Mayer coherence + redundancy principles.)
5. **Is every new atom encoded in ≥2 modalities (visual + audio at
   minimum; kinesthetic via trace/build where applicable)?**
   (Paivio 1971; Mayer 2009 dual coding.)

### Elaborate / Understand

6. **Does the lesson contain at least one generation step (build, type,
   produce, speak) before it ends?** (Slamecka & Graf 1978 generation
   effect.)
7. **For grammar concepts that contradict an L1 intuition, is there a
   confrontation step (two near-identical sentences whose meaning flips
   on the rule element)?** (Posner et al. 1982; Chi 2008 conceptual
   change.)
8. **Is there at least one "why does this answer work" prompt or
   comparison step where the learner has to verbalize the rule, not
   just apply it?** (Dunlosky et al. 2013 self-explanation, moderate
   utility.)

### Retrieve / Remember

9. **Does the lesson include at least one cued or free recall step
   (build_sentence, listening_build, speaking, translate) and not rely
   solely on recognition (MCQ)?** (Roediger & Karpicke 2006 — free recall
   > cued recall > recognition for retention.)
10. **Is the gap between first encounter of a concept and its first
    retrieval ≥4 intervening steps within the lesson?** (Cepeda et al.
    2006 spacing — in-lesson form.)
11. **Are the drill steps interleaved (no two adjacent steps testing the
    same atom) once the encoding block is done?** (Birnbaum et al. 2013
    interleaving; mind the encoding-vs-discrimination tradeoff.)
12. **Is the hardest direction (production / free recall) at the END of
    the lesson, not the START?** (Skill acquisition stages — cognitive
    → associative → autonomous; expertise reversal at the wrong end.)

### Apply / Transfer

13. **Does the lesson include at least one near-transfer prompt — apply
    the rule to vocab or context the learner hasn't seen in that pattern
    before?** (Barnett & Ceci 2002 — near transfer is the achievable
    kind.)
14. **For a drill block, are there ≥4 distinct step types?**
    (Interleaving + variety of retrieval routes.)
15. **For particle/grammar drills, do consecutive correct answers never
    exceed 2 of the same?** (Anti-patternization — see m1-density §4.
    Pattern-match exploits collapse Apply back to Remember.)
16. **For particle drills, does the answer set rotate through ≥3 distinct
    answers across the lesson, even when one is the focus?**
    (Discrimination cannot happen if there's nothing to discriminate
    against.)

### Mastery / Metacognition

17. **Is there a row-test or baked-review step that gates progression?**
    (Bloom 1968 mastery learning; review-tail per #84.)
18. **Are wrong answers re-queued (review-tail) rather than failed
    binary?** (Mastery learning + retrieval-with-feedback.)
19. **Does feedback name the rule, not just mark right/wrong?**
    (Hattie & Timperley 2007 — formative feedback's effect size depends
    on the cognitive content of the feedback.)
20. **Does the lesson surface confidence or self-assessment at any
    point?** (Metacognition — Bjork on judgment-of-learning calibration.
    Not blocking; nice-to-have.)

### Pacing / Session

21. **Does the lesson end with a card that names the bridge to the next
    session (forward-looking scaffold, not just "good job")?**
    (Ausubel pre-training in the *next* session begins here.)
22. **For session pacing: after 3 lessons in a sit, does the UI suggest
    a break rather than push another lesson?** (Diekelmann & Born 2010
    sleep + consolidation — multi-day spacing dominates same-day
    cramming.)

---

## 8. How Spencer's framing maps to this doc

| Spencer's word | Operational decomposition in this doc | Section |
|---|---|---|
| Teach | Encounter + Encode (activate prior knowledge, worked examples, dual coding, anchor exemplars) | §2 |
| Understand | Elaborate (generation, self-explanation, schema construction, conceptual change) | §3 |
| Remember | Retrieve + Apply + Transfer, with spacing/interleaving as the mortar | §4 |
| "Stand on its own" | The Encounter→Transfer cycle must be *complete within Lingo's lessons* without relying on FSRS flashcards or external immersion for the foundations. SRS multiplies what the lessons built; it cannot build what the lessons skipped. | §0, §4 |
| "Foundational learning needs to be good and valid for their future" | Anti-patternization rules + conceptual-change steps + production steps — these prevent the inert-knowledge failure mode where the learner can pass the lesson but not read a sentence. | §3.4, §6.1, m1-density §4 |

---

## 9. Sources (primary, by section)

**Cycle & Taxonomies**
- Anderson, L. W., & Krathwohl, D. R. (2001). *A Taxonomy for Learning,
  Teaching, and Assessing.*
- Anderson, J. R. (1982). Acquisition of cognitive skill. *Psychological
  Review*, 89(4).
- Bloom, B. S. (1968). Learning for mastery. *Evaluation Comment*, 1(2).
- Guskey, T. R. (2007). Closing achievement gaps: Revisiting Benjamin
  Bloom's "Learning for Mastery."

**Cognitive Load & Schema**
- Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive
  architecture and instructional design: 20 year update. *Educational
  Psychology Review*, 31.
- Bartlett, F. C. (1932). *Remembering.*
- Rumelhart, D. E. (1980). Schemata: The building blocks of cognition.

**Direct Instruction & Worked Examples**
- Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). Why minimal
  guidance during instruction does not work. *Educational Psychologist*,
  41(2).
- Renkl, A., & Atkinson, R. K. (2003). Structuring the transition from
  example study to problem solving. *Educational Psychologist*, 38(1).

**Generation & Retrieval**
- Slamecka, N. J., & Graf, P. (1978). The generation effect: Delineation
  of a phenomenon. *JEP:LMC*, 4(6).
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning.
  *Psychological Science*, 17(3).
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham,
  D. T. (2013). Improving students' learning with effective learning
  techniques. *Psychological Science in the Public Interest*, 14(1).

**Spacing & Interleaving**
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).
  Distributed practice in verbal recall tasks: A review and quantitative
  synthesis. *Psychological Bulletin*, 132(3).
- Pashler, H., Rohrer, D., Cepeda, N. J., & Carpenter, S. K. (2007).
  Enhancing learning and retarding forgetting. *Psychonomic Bulletin &
  Review*, 14(2).
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems
  improves learning. *Instructional Science*, 35.
- Birnbaum, M. S., Kornell, N., Bjork, E. L., & Bjork, R. A. (2013). Why
  interleaving enhances inductive learning. *Memory & Cognition*, 41(3).

**Desirable Difficulties & Sleep**
- Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but
  in a good way. In *Psychology and the Real World*.
- Diekelmann, S., & Born, J. (2010). The memory function of sleep.
  *Nature Reviews Neuroscience*, 11(2).

**Dual Coding & Multimedia**
- Paivio, A. (1971). *Imagery and Verbal Processes.*
- Mayer, R. E. (2009). *Multimedia Learning* (2nd ed.).
- Tulving, E. (1972). Episodic and semantic memory.

**Productive Failure & Conceptual Change**
- Kapur, M. (2008). Productive failure. *Cognition and Instruction*, 26(3).
- Kapur, M. (2016). Examining productive failure, productive success,
  unproductive failure, and unproductive success in learning.
  *Educational Psychologist*, 51(2).
- Posner, G. J., Strike, K. A., Hewson, P. W., & Gertzog, W. A. (1982).
  Accommodation of a scientific conception. *Science Education*, 66(2).
- Chi, M. T. H. (2008). Three types of conceptual change. In
  *International Handbook of Research on Conceptual Change.*

**Transfer**
- Barnett, S. M., & Ceci, S. J. (2002). When and where do we apply what we
  learn? A taxonomy for far transfer. *Psychological Bulletin*, 128(4).

**SLA-specific**
- Krashen, S. D. (1985). *The Input Hypothesis.* (Position: operationally
  useful, theoretically not well supported in current SLA literature.)
- Norris, J. M., & Ortega, L. (2000). Effectiveness of L2 instruction: A
  research synthesis and quantitative meta-analysis. *Language Learning*,
  50(3). (Counterweight to Krashen — explicit instruction outperforms
  pure exposure.)
- DeKeyser, R. (2007). *Practice in a Second Language: Perspectives from
  Applied Linguistics and Cognitive Psychology.*

**Feedback & Metacognition**
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of
  Educational Research*, 77(1).
- Hacker, D. J., Dunlosky, J., & Graesser, A. C. (Eds.) (2008). *Handbook
  of Metacognition in Education.*

---

*Doc last verified against `src/features/lesson/types.ts` 2026-05-17.
When step types are added or removed, update §5 + §6. When the M3-M7
rebuild lands per `m1-density-restructure-plan-2026-05-17.md`, revisit
§5 "current Lingo usage" notes — most will change.*
