# Opening N4, and giving the transform card its teaching half

> **STATUS UPDATE 2026-08-09:** A1+A2 EXECUTED (standalone, A3 deferred by
> Spencer) — see `docs/handoff-2026-08-09-walk-wave.md` for the adaptations
> (comingSoon placeholder tile, stories gate 30→50, `CourseAtomSource` was the
> union to extend, しりあい re-homed to m49). A3/A4 still owed. Any "NOT YET
> STARTED" claim for Part A below is superseded.

**Status:** Part B1/B2 + the m8 て ladder are **SHIPPED** (see the SHIPPED section at the end).
Part A (retire legacy m30, author m30 = n4-01, placement tier 8) is APPROVED and NOT YET STARTED.
**Date:** 2026-08-06 · **Decisions ratified by Spencer:** retire legacy m30 · author spine m30 only, then review · m8 to 17 lessons (inv 25 exemption) · ぬ taught in the rule table only

Two pieces of work that share a deadline. Part B must land *before* Part A's
authoring dispatch, because N4 is formation-dense and the rule it establishes
has to exist before m30 is written rather than be retrofitted onto it.

---

## Part A — open the N4 tier at m30

### A0. Why m30 is contested

`docs/spine-n4.md` (LIVE, authoring source of truth) assigns **m30 = n4-01,
「て + helper I: 〜てみる / 〜ておく」**.

`src/features/languages/ja/curriculum/m30.ts` already holds **2,415
hand-authored lines** from the July N4 pilot — "Casual register", 16 lessons,
live on the course map, 19 atoms tagged `fromModule: "m30"`, one in-module
story, one library story.

`RUN-PLAN-n4.md` standing decision #0 already resolved this in favour of
retirement, for four reasons: the spine wins over prose by standing rule; the
pilot's shape (pairs + story) violates inv 25; its stated premise — *"m29
taught the plain forms; m30 teaches USING them"* — describes an m29 that no
longer exists; and its content is spent inside N5 (m10 register-in-the-wild,
m24 〜ない？ invitations, m29 register mastery). That decision was an agent's,
never ratified. **Spencer ratified it 2026-08-06.**

### A1. Retire legacy m30

Measured blast radius: 26 files mention `m30`. **8 are comments or history**
(`jaAcceptedForms` + its test, `conjugationTables`, `moduleCompiler`,
`buildSrsReviewLesson`, `GrammarRuleStepView`, `SpeakingStepView`, and
`spinePlan`'s `salvage` prose) and need no edit. The remaining 18 carry real
references.

Delete:

| Target | Detail |
|---|---|
| `curriculum/m30.ts` | 2,415 lines |
| `curriculum/m30.test.ts` | 13 `ja-m30` refs |
| `mockLessons.ts` | 8 registry entries incl. `M30_STORY` |
| `mockCourse.ts` | the m30 tile — 17 refs, 16 lesson rows + 2 story rows |
| `grammarReviewIndex.ts` | 1 ref |

Rewrite: `learnTier.test.ts` asserts *"real ja n4 line is m30 only (old m29
pilot renumbered away by the spine)"* in two places. Both re-point at the new
m30. `TransitLearnPage.tsx:2061` has a `Math.max` guard for the single-station
n4 map — still correct, comment needs updating. Five more test surfaces carry
`m30` references that move with the content and are expected to fail until
updated: `TransitLearnPage.test.tsx`, `mockCourse.test.ts`,
`atomExposureAudit.test.ts`, `moduleContentLints.ts`, `renderSmoke.test.tsx`,
`learnerView.emit.test.ts`.

**Keep `ja-m30-people-at-work`.** It is a reading passage in `stories.ts`
serving the standalone `/practice/stories` library (55 stories, its own route
at `App.tsx:511`). Only the *map row* goes; the passage is untouched. Its id
embeds a now-false module claim, but renaming touches `stories.ts`,
`stories-culture.ts` and progress keys for zero learner-visible gain — leave
it and note it here.

### A2. Re-home the 19 atoms — do not delete them

This is the only non-mechanical step, and the trap. Leaving `fromModule: "m30"`
in place silently converts 19 casual-register words into vocabulary for a
て+helper module. That is precisely the drift `vocab-exposure-audit-2026-07-29`
§1 warns against: `atom.fromModule` drives the review pool, D2, and placement
seeding, and must never be read as "where it's taught" unless it is true.

The atoms: もちろん, ぜったい, けいご, したしい, ていねい, しつれい, タメぐち,
なんで, どうしたの, きになる, べつに, せんぱい, じょうし, どうりょう, やっぱり,
こうはい, しりあい, おさななじみ, なかま.

Homes, mostly already named by the spine:

- **`thr-n4` glue-adverb drip (4)** — やっぱり, もちろん, べつに are named
  verbatim in `spine-n4.md` §4. ぜったい joins them; it is a known
  late-teaching straggler (`vocab-exposure-audit` §7.3).
- **m49 / m50 Keigo I–II (8)** — けいご, ていねい, しつれい, タメぐち, せんぱい,
  こうはい, じょうし, どうりょう. Their honest semantic home.
- **Unowned (7)** — なんで, どうしたの, きになる, しりあい, おさななじみ, なかま,
  したしい. Tag forward to a future module or leave untagged; either way they
  do not unlock until something teaches them, which is the truthful state.

Tagging forward requires extending the `fromModule` union at
`grammarHelpers.ts:645` past `"m30"`. `applyPlacementResult` filters on
`seedModuleSet.has(atom.fromModule)`, so a not-yet-authored module simply never
matches and never seeds — correct behaviour, no guard needed.

**Two ratchets must move DOWN, not up:** `MAX_DANGLING_ATTRIBUTIONS` (227) and
`MAX_GRADED_NEVER_UNLOCKABLE` (223) in `lessonAtomAttribution.test.ts`, since
20 `ja-m30-*` attributions disappear. If either needs raising, the re-homing
is wrong.

### A3. Author m30 = n4-01

Spine unit is written in full (`spine-n4.md` §2). The teaching payload is not
〜てみる — it is **the schema**: て-form + a helper verb whose meaning is
bleached, where the helper carries all conjugation (食べてみる / 食べてみた /
食べてみない) and the main verb never moves. Front-loading it is what lets m35,
m38, m41, m47 and m50 each teach one thing instead of re-deriving "te + verb"
five times.

Zero new morphology, which is the correct way to open a tier: て has been owned
since m8, た since m11.

Vocab: 34 atoms. Must-list よやく・しらべる・きめる・ならう・つづける・おくる.

Loop, unchanged from the N5 run:

```
node scripts/authoring-context.mjs m30 > docs/context/m30-context.md
→ ONE authoring agent (context pack + pinned invariants + spine unit)
→ node scripts/compile-ir.mjs m30
→ npx vitest run            (0 failures — non-negotiable)
→ npm run authoring-audit   (m30 row must be clean)
→ Sonnet QA on REVIEW + CHALLENGE lessons
→ TTS: emit-tts-deck + generate (FOREGROUND, no watcher shells)
→ git commit
```

Brief boilerplate that must survive: the carrier-fatigue list, Rule Zero
(never substring-match Japanese — match a TILE or an ATOM), "if a guard fires
assume YOUR content is wrong", and "the spine wins, and you say so in your
report".

Two tier-opener gates that do not exist yet:

- `COMPLEXITY_FLOORS["m30"]` — `thr-n4` raises production sentences to ≥2
  clauses on average from m30. Measure after authoring; **never lower**
  (`COMPLEXITY_FLOORS` values for un-authored modules were measured on the
  archived old course and every one of m23–m25 had to be raised).
- Kanji drip: ~8 glyphs, ~3 `kanji_reading` steps, always on already-unlocked
  kanji, never on a just-introduced word.

### A4. Fold in: placement tier 8

`JA_SKILL_TIERS` (`placement/tiers.ts`) stops at tier 7 = m24–m27, so the
adaptive placement test cannot credit m28 or m29 — measured, not inferred.
Per-module test-out already works for **all 30 modules** (12 derived items
each; every module clears the floor of 8).

Add `{ tier: 8, modules: ["m28", "m29"], screeningModuleId: "m28" }`. ~5 lines.

### A5. Explicitly out of scope

Both are tracked, neither blocks m30, and both are curriculum calls rather than
mechanical ones. Measured against the live engine by simulating a test-out of
all 30 modules:

- **164 atoms unlock that no lesson ever teaches** — they would surface as
  flashcards for words never seen (B065, deck side).
- **40 atoms the course grades never unlock**, so no review surface reaches
  them; 30 are SRS-eligible (B068 residual). Related: **zero atoms carry
  `fromModule: "m28"`**.

---

## Part B — give the transform card its teaching half

### B0. What is actually broken

The `conjugation_transform` card (spec `conjugation-transform-spec-2026-07-23.md`)
is a three-stage card whose signature is a **rule table**: one row per verb
class, canonical example pinned per row, the current word's row highlighted —
pinned open at stage 1, then behind a half-credit 💡 peek.

Measured 2026-08-06 against the live course:

| | |
|---|---|
| live `conjugation_transform` steps | **59** |
| modules carrying them | **8** — m6, m7, m8, m11, m12, m13, m14, m16 |
| distinct `form` values used | **12** |
| entries in `TRANSFORM_RULESETS` | **1** (`nai`) |
| **steps that render a rule table** | **7 / 59 — 12%** |

Both the table (`ConjugationTransformStepView.tsx:219`) and the peek (`:224`)
are `{ruleset && …}`-gated. When a form has no ruleset the card degrades
silently to a bare "produce this form" prompt: no teaching, no guidance, no
peek. Per-form breakdown:

```
form=te            steps=11  ruleTable=no   m8, m14
form=nai           steps= 7  ruleTable=YES  m6
form=negative      steps= 6  ruleTable=no   m12, m13
form=past          steps= 6  ruleTable=no   m12, m13
form=past-negative steps= 6  ruleTable=no   m12, m13
form=masu          steps= 5  ruleTable=no   m7
form=masu-neg      steps= 3  ruleTable=no   m7
form=ta            steps= 3  ruleTable=no   m11
form=masu-past     steps= 3  ruleTable=no   m11
form=tai           steps= 3  ruleTable=no   m13
form=masu-past-neg steps= 3  ruleTable=no   m16
form=nai-past      steps= 3  ruleTable=no   m16
```

This was a known TODO, stated in the file's own header
(`transformRulesets.ts:15`): *"Adding a form later (te / ta / adjectives) =
adding a ruleset here; the card and compiler never hard-code ない."* It was
never done, **and nothing failed when it wasn't** — which is the real defect.

### B1. Generalize the answer-leak mask (prerequisite)

`getTransformRulesetFor` line 159 reads `if (form !== "nai" || !NAI_ALTERNATES[base]) return rs;`.

The alternate-example swap exists because a pinned table that prints the card's
own answer is a read-the-screen freebie — worst for irregulars, where drilling
する against a visible する→しない was found in the Fable sweep of 2026-07-24.

Adding ten rulesets behind an un-generalized mask re-introduces that exact leak
on ten forms simultaneously. So this lands **first**:

- Rename `NAI_ALTERNATES` → `RULESET_ALTERNATES`, keyed `form → base → row`.
- Drop the `form !== "nai"` short-circuit; look the form up in the outer map.
- Every ruleset added in B2 ships its alternates in the same commit. A ruleset
  whose canonical example can be drilled and has no alternate is incomplete.

### B2. Author the 11 missing rulesets

Pure data in one file. No lesson content changes, no IR recompile, no
re-authoring. Upgrades 52 existing cards from *test* to *teach → guide → do*.
This is the highest value-per-unit-effort item in this document.

Forms owed: `te`, `ta`, `masu`, `masu-neg`, `masu-past`, `masu-past-neg`,
`nai-past`, `past`, `negative`, `past-negative`, `tai`.

Source of truth for every cell is `conjugationTables.ts` (`VERB_ENTRIES`,
`ADJ_ENTRIES`) — derive the canonical examples from the course's own tables,
never hand-write a paradigm.

**One open design question — te-form row granularity.** `RulesetRow.group` is a
`TransformClass` (`ichidan | godan | irregular | i-adj`), and the view
highlights on `row.group === highlight`. That is fine for ない (one rule per
class) but wrong for て, where the godan class splits five ways:

```
う・つ・る → って      む・ぶ・ぬ → んで      く → いて
ぐ → いで              す → して              (いく → いって, exception)
```

Two options:

- **(a) One crowded godan row** — all five patterns as chips in a single row.
  No type change; highlighting stays correct; the row is dense.
- **(b) Add an optional `subgroup` to `RulesetRow`** and match on
  `group + subgroup` when the step supplies one. Five clean godan rows, precise
  highlighting (drilling のむ lights only む→んで). Costs a type field, a view
  change, and a compiler field.

**Recommendation: (b).** The te-form table is the single most-consulted rule in
the course — 11 live cards now, and every N4 て+helper module (m30, m35, m38,
m41, m47, m50) leans on it. Coarse highlighting on the one table that most
needs precision is a false economy. Under (a), a learner drilling のむ sees all
five う-verb rows lit at once, which is the opposite of what the highlight is
for.

### B3. Add the ratchet

Nothing today fails when a live step's `form` has no ruleset. Add a test —
sibling to `acceptedAnswerCollisions.test.ts`, same ratchet discipline:

> Every `form` used by a live `conjugation_transform` step resolves to a
> ruleset, and every ruleset row whose canonical example is drillable has an
> alternate.

Assert a non-zero scanned count. (*A check that matches nothing looks exactly
like a check that passes* — `RUN-PLAN-n4.md` standing hazards; a course-wide
scan on a field that did not exist once reported clean while three defects were
live.)

This test is what makes B4 enforceable rather than aspirational.

### B4. The standing rule, from m30 forward

> **A formation point ships with a rule table and a transform card, or it does
> not ship.**

Added to the authoring brief boilerplate and to `authoring-invariants-pinned.md`.

N4 is formation-dense — passive られる (m40), causative させる (m45), volitional
よう/おう (m34), ば and たら (m32/m37), 命令形 and 禁止形 (m47), てある (m41),
てしまう/ちゃう (m38), causative-passive (m50). Every one of those is a new
paradigm a learner must *form*, not merely recognise. Establishing the rule
before m30 is authored costs one paragraph in a brief; retrofitting it across
21 modules costs another sweep exactly like this one.

### B5. Retrofit the 8 uncovered formation points

Of the 24 `verb-form` + `adjective-form` points in `n5-grammar-points.json`,
**8 sit in modules with zero transform cards**:

| Module | Points |
|---|---|
| m10 | `masu-past`, `na-adj-past` |
| m15 | `te-iru` |
| m20 | `ga-itai` |
| m24 | `tari-tari-suru` |
| m25 | `ni-iku`, `koto-ga-aru` |
| m27 | `ku-ni-naru` |

This is real authoring — IR beats, new cards, recompile, TTS, re-audit — and
unlike B1–B3 it touches shipped modules. **Sequence it after m30 ships**, one
module per dispatch through the normal loop, so the N4 opener is not blocked
behind a retrofit sweep.

Judgement call worth flagging: not all eight are equally card-shaped.
`masu-past` and `na-adj-past` (m10) are clean paradigm transforms and clearly
belong. `koto-ga-aru` and `ni-iku` (m25) are *constructions* built on an
already-owned form rather than new formations — a transform card may be the
wrong instrument there, and the module's existing build/cloze beats may already
do the job. **Confirm per point before authoring; do not treat the list of 8 as
a work order.**

---

## Sequencing

```
B1  generalize the leak mask                  ← blocks B2
B2  11 rulesets (+ alternates)                ← 52 cards start teaching
B3  ratchet test                              ← makes B4 enforceable
B4  standing rule into the brief              ← blocks A3
A1  retire legacy m30  ─┐
A2  re-home 19 atoms   ─┼─ one commit, gated on full suite green
A4  placement tier 8   ─┘
A3  author m30 = n4-01                        ← then Spencer walks it
B5  retrofit the 8 points, one module/dispatch, AFTER m30 ships
```

B1–B4 are code and data only — no content authoring, no TTS, no IR recompile.
They can land and be verified before any authoring agent is dispatched.

## Verification

- Full suite green at every step (`npx vitest run`) — partial success has
  burned this project repeatedly.
- `npm run authoring-audit` — m30 row clean, `findings = —`.
- `npm run module-gate -- m30` — includes TTS coverage; the emitter is
  regex-based and skips unmatched shapes **silently**, so `wrote=0` is not
  evidence of success.
- New ratchet (B3) green, with a non-zero scanned count asserted.
- `MAX_DANGLING_ATTRIBUTIONS` / `MAX_GRADED_NEVER_UNLOCKABLE` decrease.
- Post-B2 spot check: the m7 ます card and the m8 て card both render a table
  and a peek. That is the learner-visible proof, and it is the observation
  that started this thread.

---

# SHIPPED 2026-08-06 — Part B1/B2 + the m8 て ladder

All gates green at time of writing: **tsc clean, 9170 tests passing, 0 failing**,
`authoring-audit` m8 row `findings = —` (270 steps, 10.9% translate, 12 step types).

## Code

- **Leak mask generalized** (B1). `RulesetRow.examples` now names the canonical
  word explicitly; the old predicate matched the drilled base against a single
  chip and so **never fired for any multi-chip word** — m6's たべる and のむ
  cards had been printing their own answer since launch. `RULESET_ALTERNATES`
  is keyed `form → base → row`.
- **Rulesets authored:** `masu`, `masu-neg` (m7), `te` (m8). Remaining ratchet:
  `ta`, `masu-past`, `negative`, `past`, `past-negative`, `tai`, `nai-past`,
  `masu-past-neg` — 8 forms, tracked in `transformRulesets.test.ts`.
- **`subgroup` axis added** (`LessonStep`, `conjugationTransform`,
  `TransformRuleTable`, compiler). て/た branch INSIDE the godan class, so the
  table now highlights one row instead of all five. Derived by the compiler
  from the base's final kana (`transformSubgroup`) — not authored in IR, since
  the ending IS the last character. いく gets its own subgroup.
- `TransformRuleTable` densifies past 4 rows (て ships 8) to hold the ≤700px
  budget, and its React key is now `group:subgroup` (5 godan rows collide on
  `group` alone).

## Content — m8 goes to 17 lessons

Ladder: **1** る→て · **2** う・つ・る→って · **10** む・ぶ・ぬ→んで · **review**
· **11** く→いて, ぐ→いで, す→して · **3** the rebels (いく, する, くる).

- The two new lessons kept FRESH ids (10, 11) inserted mid-order rather than
  renumbering 3–9: `courseAtoms.introducedByLessonId` pins atoms to lesson ids
  and a static entry suppresses the module-fallback unlock (CLAUDE.md landmine).
  **Read the order in `m8-neo.ts`, not the ids.**
- Three NEW base verbs — たつ / いそぐ / かす — chosen because they were
  **taught by no lesson at all** (registered-but-never-taught, the B065 class),
  so claiming them is a net gain, and all three are natural ください requests
  (たって / いそいで / かして). This deliberately avoided raiding m14, which owns
  まつ・およぐ as picture debuts with good reasons.
- ぬ: しぬ appears in the rule prose and the んで row, never as a drill target
  and never in a request frame (Spencer ruling — m8 is the "please do X" module).
- `review-2` moved ahead of the タ katakana row: the longer ladder pushed it out
  of the middle third (inv 25).
- TTS: 20 clips generated (15 sentences + 5 punctuation variants). Manifest diff
  was **+20 / −0**, overrides unchanged; only `ja.json` copied. ⚠️ Clips are
  LOCAL ONLY — `pipeline.tts.upload` needs AWS creds only Trevor has, so these
  will 404 on the CDN until someone uploads.

## Rules learned (encoded, not just noted)

1. **A ramp cannot introduce its own base verb.** The ramp is pinned right
   after the rule card and its atoms count as pre-satisfied, so a module-new
   base's image debut sorts into the middle and the transform card — explicitly
   NOT intro-capable (inv 37) — becomes the word's first exposure. Pinning the
   debut ahead of the ramp was tried and REJECTED: it breaks the ramp-length
   guard (which measures distance from the last `grammar_rule`, not consecutive
   transforms) and stacks adjacent `word_image_mcq` when a lesson has two new
   bases. It is an AUTHORING rule: introduce a base verb one lesson EARLIER than
   the lesson that drills its transformation. Enforced by the debut guard.
2. **Never substring-match Japanese, including in a guard.** The first version
   of the leak check flagged m8's する card because the す row prints はなして,
   which merely contains して. Rewritten to compare the row's actual OUTPUT
   (text after each "→"). Rule Zero applies to test predicates too.
3. **A lesson's transform ramp is capped at 3 per rule beat**, and two rule
   beats in one lesson double-draw the same material (`scope` is lesson-level,
   not beat-level). Splitting す away from the rebels was forced by this.
4. **A drill card teaches one row, so it shows one row.** See below — the
   eight-row table was right as a reference and wrong as a card header.

## Follow-up shipped — `focus` mode on the rule table

Spencer, on first play-test of the ladder: *"we need something to ONLY show the
relevant line when it is teaching here. the bloat on the page is too much to
show it all."* Correct, and measurable. `TransformRuleTable` now takes `focus`;
`conjugation_transform` passes it, the `grammar_rule` card does not.

Measured on `ja-m8-neo-1?step=1` at 900×700, dark, consent banner dismissed
(it publishes `--cookie-consent-height`, which the fixed shell subtracts — leave
it up and every number is pessimistic by its height):

| | table height | step-container overflow |
|---|---|---|
| full grid (shipped that morning) | 388px | **296px** |
| `focus` — the drilled row only | 91px | **0px** |

296px of overflow means the third answer option started below the fold on a
laptop. The focused card fits with room to spare at 390×700 too.

Design, and why each half:

- **The row alone, no header.** The card's own subtitle already ends with
  `· て form`; over a single row the "THE SOUND-CHANGE TABLE" caption was
  naming a table that wasn't there.
- **`all 8 rules` expander**, one disclosure level (the culture-chip pattern).
  The contrast between rows is real teaching — it belongs to the `grammar_rule`
  card and the review lesson, and stays one tap away here. It is not the
  default, because a learner mid-drill is not comparing nine endings.
- **Fallback to the full grid when nothing matches the highlight.** A card that
  lost its `verbClass` must not render an empty box on a LEARN step. Tested.
- **The leak mask still runs.** In focus mode the drilled row is the ONLY row
  on screen, so an unmasked row would be the answer itself. Tested.

The `grammar_rule` card keeps the full grid unconditionally — it is a reading
card in a scrollable shell, and there the whole table IS the content. (It does
not yet highlight the row its lesson is about; small, separate, unclaimed.)

### The mask and focus mode interact badly — name the example

Second play-test, かう card: *"did we accidentally insert ta here? this is
confusing."* The data was correct — かう's row is masked to たつ, so it renders
`た` ＋ struck `つ` → `た` ＋ `って`. But **focus mode removed the context that
made the mask legible.** In the full grid, every row carried a different verb,
so "each row brings its own example" was self-evident. Alone on screen, with a
struck つ that reads like う at 18px, `た … って` parses as *past-tense た in a
て lesson* — the single worst misreading available in this module.

This is the general hazard, worth stating once: **the leak mask deliberately
shows a verb the learner did not ask about, and focus mode removes every cue
that this is happening.** Two fixes, both shipped:

1. **The focused row names its example word** (`たつ`, under the class label).
   Nothing else on the card identifies whose derivation this is.
2. **Bigger chips** (`text-lg sm:text-xl`) so a struck つ stops reading as う.

Layout fallout, measured: the caption pushed 900×700 to 3px of overflow and
390×700 wrapped `って` onto its own line, splitting it from the `た` it attaches
to. Fixed by dropping the 6rem label gutter in focus mode
(`grid-cols-[auto_1fr]`) — 0px overflow and a single line at 390, 900, and 1440.

Rows whose mask falls back to the abstract rule (ぐ, す — one taught verb each)
carry `examples: []` and correctly render no caption.

Rejected: swapping かう's alternate to やる to dodge the た collision. や＋る→
や＋って puts a `る` verb taking `って` alone on screen one lesson after
`る-verbs → て` was taught — trading a cosmetic misread for a real one.

Guard: `TransformRuleTable.test.tsx`, 9 tests — including the named example and
the abstract-fallback caption.

## TODO — image MCQs, now that local art generation exists

Spencer 2026-08-06: a local vectorize-style image model is installed, so art
gaps are fillable. Measured before assuming that is the bottleneck:

| | count |
|---|---|
| atoms taught by a live lesson | 553 |
| ever shown on a `word_image_mcq` | 157 |
| **never shown on one** | **396** |
| — of those, ALREADY have a vendored emoji | **141** (114 content words) |
| — of those, no emoji at all | 255 |
| — — but genuinely imageable (excl. derived forms) | ~25–40 |

**The bottleneck is not art.** The single biggest win is the **141 words that
already have an emoji and simply never get an image step** — zero art required,
pure authoring. Of the 255 with no emoji, most are derived forms that should
never be imaged (たべない, のみません, たべた, みたり, のめる…); the genuinely
imageable remainder is a modest set of concrete nouns, and many of those have an
obvious standard emoji that was simply never tagged (ぶた🐷 うま🐴 ぞう🐘 かめ🐢
えび🦐 さくら🌸 きのこ🍄 きゅうり🥒 ラーメン🍜). Custom art is really only needed
for a handful (にほんじん, アメリカじん, えん, のど, ねつ).

Recommended order: (1) tag the obvious-emoji nouns + vendor their SVGs,
(2) author image steps for the 141 free ones, (3) point the art pipeline at the
genuine remainder. Do NOT start at (3).
