# Transform cards — in-lesson conjugation teaching (spec, 2026-07-23)

**Status:** DRAFT for Spencer's review. Design approved in-session from the
interactive mock (scratchpad `transform-card-mock`, v2); this spec folds in
the two research reports (pedagogy evidence + competitor/curriculum scan).
Full reports: session transcripts 2026-07-23; citations inline below.

## What it is

A new lesson step type, `conjugation_transform`: base word → produce the
target form. The card has one skeleton (prompt, rule table, streak flame)
and **morphs through three stages** driven by the conjugation-FSRS store
(the trainer's store — one mastery brain for lessons, review lessons, and
the practice hub):

| Stage | Answer | Crutch | Graduates when |
|---|---|---|---|
| 1 · LEARN | MCQ (anti-pattern distractors) | rule table pinned open | 2 consecutive correct in-lesson (table collapses) |
| 2 · KNOW | MCQ | 💡 peek (opens table, half credit, FSRS "hard") | FSRS ≥ good **after a consolidation interval** (never same-session) |
| 3 · OWN | typed (kana or romaji) | 💡 peek still available, same cost | stays; FSRS lapse demotes back to 2 |

**The rule table** (the signature): one row per class, each with its pinned
canonical example — たべ~~る~~→たべ＋ない, の~~む~~→のま＋ない,
する→しない・くる→こない — all rows always shown, the current word's row
highlighted. One table per conjugation TYPE (ruleset), not per class. The
same structure serves た/て-forms and adjectives later (い-adj: あつ~~い~~→
あつ＋くない; な-adj: げんき＋じゃない; いい is its own irregular class).

## Research-driven adjustments (deltas vs. the mock)

1. **Mastery cell = (form × verb-class), recognition and production tracked
   separately.** MCQ successes must NOT count as production mastery (skill
   specificity: DeKeyser & Sokalski; Kang/McDermott/Roediger 2007; Nakata
   2016). Stage-3 graduation requires the *recognition* cell to be
   consolidated; stage-3 *retention* is its own production cell seeded at a
   discount from recognition strength. Renshuu's admin independently
   identified form-level SRS as the failure mode ("jumps mastery without
   covering the endings") — the cell grid is the fix, and no surveyed
   product does staged MCQ→typed over such a grid. Unclaimed position.
2. **Soften the typing ban: stakes wait, the act doesn't.** After the last
   stage-1/2 card of a new form, offer an UNGRADED "try typing it" bonus
   card — no streak effect, no FSRS write, anti-pattern feedback on miss
   (errorful learning w/ feedback: Metcalfe 2017; Hopman & MacDonald 2018).
   Graded typing still waits for consolidation (independently supported:
   Tamminen et al. 2012 — affix generalization to new stems emerges after
   consolidation, not same-day).
3. **Streak = recovery-framed, format-blind, shielded early.**
   - Shield: misses don't reset the flame while the cell has <5 SRS reps
     (Spencer's ruling; direction supported by Silverman & Barasch JCR —
     broken-streak salience demotivates; Duolingo streak-freeze churn data).
   - Never foreground a broken streak: on reset show "best ×N" recovery
     framing, not the zero.
   - Flame credit is stage-blind so learners can't farm stage-1 cards.
4. **Early FSRS intervals for morphology stay short.** Cap early interval
   growth for transform cells below vocab defaults (~1–4 days) until the
   production cell is reliable (Suzuki 2017 Language Learning: 3.3-day lag
   beat 7-day; Suzuki & DeKeyser 2017).
5. **Prompt clarity invariant.** The #1 complaint across Don's drill, jconj,
   and MaruMori: under-specified prompts. Every card states the full target
   ("plain · negative" + gloss "won't eat") — never bare "make negative".
6. **Verb-class identification is its own card type** (`class_id`), taught
   and drilled BEFORE conjugating a verb, and re-drilled with trap verbs
   (かえる・はいる・いる/いる minimal pairs; ~38% of -iru verbs are godan).
   MaruMori is the only product doing this; every drill tool's forum says
   it's the missing skill.
7. **Later (not v1):** arbitrary form→form transforms (Don's insight:
   source-form recognition is half the skill) with trick questions where
   source = target; politeness as an orthogonal register toggle on the cell
   grid (ます = register transform on the stem, matching dict-form-first).

## Curriculum fit

Form order (validated against Genki/MnN/JLPT split + our dict-form-first
spine): class-ID → ます-stem → **ない (m6, this module)** → た+て taught as
one contraction pattern → plain/polite × tense × polarity grid → N4 block
(potential → volitional → たら → ば → passive → causative → imperative).
Front-load reps on ない and volitional (hardest per the PMC processing
study); teach hard forms via the canonical-example chunks (study finding
supports the pinned-example table). Adjectives are first-class cells:
い-adj, な-adj (accept じゃない AND ではない), いい irregular. ある→ない
ships with the ない ruleset (already true in m6). 行く→行って flagged when
て/た arrives; 死ぬ→しんで noted.

## Implementation map

- **Step type** `conjugation_transform` in lesson types + StepRenderer +
  view component (port the mock's card; reuse trainer's provider for
  surface rendering + cheat-sheet data; useLessonKeyboard).
- **Rulesets** live with the conjugation provider (one per form; rows =
  classes with canonical examples); the view renders them — never authored
  per-lesson.
- **FSRS**: extend the grammar/conjugation SRS keys to (form × class) cells
  with `recognition` and `production` strengths; `sessionRating` rollup per
  cell; interval cap for young cells; demotion hook.
- **Compiler**: after a rule beat whose grammar point declares
  `conjugation: {form, classes}`, auto-emit the transform ramp (2–3 cards,
  classes from the lesson's newAtoms via `derivedFrom`/`verbClass`) +
  ungraded type-tease; pin invariant: **no graded typed production within 4
  steps of a new rule** (new authoring invariant + moduleBarGuards check).
- **Contracts/Gate 10**: transform steps get contracts (mustShow: base,
  target-form options/input, rule-table rows when stage 1).
- **Streak**: per-card flame in lesson state; shield gate `cellReps < 5`.
- **TTS**: conjugated forms already in deck via atoms; transform card plays
  the base verb on mount, answer form on success.

## Out of scope (v1)

Form→form transforms, trick questions, register toggle, adjective rulesets
(engine must not preclude them — POS axis in the cell key from day one),
lightning mode, trainer-page redesign to match the new card (follow-up).

---

## Ramp coverage — every form the engine can drill, and where (2026-07-28)

Spencer, after finding ます undrilled at m7: "are any other modules missing
it?" This is the answer, and the shape of the bug is worth naming. A module
gets a ramp only if a `grammarPoint` declares a `conjugation:` block AND its
derived atoms carry `verbClass` — miss either and the module compiles
cleanly with no drill at all. Three modules had missed one or both.

Every form the engine supports is now drilled:

| form | drilled in |
| --- | --- |
| `nai` | m6 ×3 (ru / u / irregular) |
| `masu` | **m7 L1 (ru+u), L2 (ru+u+irregular)** — added 07-28 |
| `masu-neg` | **m7 L3** — added 07-28 |
| `te` | **m8 ×3 (ru / u / u+irregular)** — added 07-28; m14 re-drills う-verbs |
| `ta`, `masu-past` | m11 |
| `negative` / `past` / `past-negative` (i-adj) | m12 (plain adjectives), m13 (たい cells) |
| `tai` | **m13 L1** — added 07-28 |
| `masu-past-neg`, `nai-past` | m16 |

**The failure mode to watch for.** In all three cases the module drilled the
*consequences* of its rule and not the rule itself. m7 drilled ません but not
ます. m13 drilled たくない / たかった / たくなかった but not たい. The card that
MAKES the form is the one that needs the ramp most, and its absence is
invisible: the module compiles, the lesson has a rule card, and the derived
cells all drill. Only trying to produce the form catches it.

**Not drillable — would need new engine forms.** These are taught in the
course and have no ramp because `ChainForm` cannot express them, not because
anyone forgot: ている (m14), 〜たり〜たりする (m21), potential る/れる and
できる (m24), すぎる and くなる/になる (m27), なきゃ/なければ/なくちゃ (m28).
Also the copula negatives じゃない/じゃありません (m12, m29), which are not
adjective inflection at all.

**m24 (potential) is the one worth building.** It is a real class-keyed
paradigm — る→られる, う→える, する→できる, くる→こられる — and it is the
entire subject of its module, so it has the same shape as the three gaps
just closed. The others are auxiliaries and chains, where a transform card
would be the wrong instrument.
