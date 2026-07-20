# Rewrite cycle report (living doc, started 2026-07-20)

Per-cycle log for the autonomous author↔audit run. Each cycle: author a
module → mechanical gates → visual/continuity audit → fix → retro
(token efficiency, audit efficiency, pedagogy drift, reinforcement
balance, complexity). Rules created mid-run land in
authoring-invariants-pinned.md and are summarized here for Spencer.

## Rules created this run (Spencer sign-off status)

| # | Rule | Status |
|---|------|--------|
| 25 | ≥12 lessons/module from m4 | Spencer-directed ✓ |
| 26 | Capstone integration step before every teaching lesson's review tail (m5+) | Spencer confirmed 2026-07-20: 1 per lesson ✓ |
| 27 | Frequency-weighted reinforcement via exposure-audit.mjs each cycle | Spencer-directed ✓ |
| — | Romaji stays kana-faithful (は = "ha"); pronunciation taught on the rule card | Spencer ruling ✓ |

## Cycle 1 — m4 (possession & pointing) — DONE
- 12 lessons / 244 steps; 2 parallel authoring agents; both passed the
  mechanical bar pre-return; ZERO content-class defects (the m3-walk
  classes are machine-blocked now).
- Visual audit (12 judges) found 4 platform classes → all fixed + gated:
  romaji segmenter phantom words, factory question default, template
  quoting, capture-harness consent.
- **Efficiency retro:** 12 vision judges ≈ 700k tokens; ~90% of their
  work was text verification → replaced next cycle by the DOM-render
  gate (in build) + ONE continuity judge. Authoring agents ~200k each —
  acceptable; spec template reused going forward.
- **Exposure audit v1:** no under-exposed top-150 words; over-exposure
  all home-module density (expected). Real signal starts cycle 2
  (cross-module reinforcement). Bug found+fixed: name substrings
  polluted counts (たなか→なか).

## Cycle 2 — m5 (VERBS I) — DONE (pending Spencer walk)
- 12 lessons / 231 steps; dict-form-as-complete-sentence thesis lesson
  design; capstone step per teaching lesson (invariant 26); recognition
  chunks for いう/おもう; verb classes flagged on cards but NOT drilled
  (taxonomy has no function until negation — pedagogy ruling, report §).
- Infra shipped first: module-gate (one command: scoped vitest → TTS
  coverage → tsc → optional capture → FULL-suite CI parity → exposure
  audit) + DOM-render gate (registerRenderGate; 814 tests m3+m4, m5
  registered) — replaces ~90% of the vision-judge fleet.
- **Audit efficiency:** vision fleet 12 → 1 continuity judge (~700k →
  ~60k tokens/module); per-step text truth now mechanical.
- **Token efficiency:** authoring unchanged (2×~200k — appropriate);
  biggest waste eliminated = judge fleet + rework loops.
- **Pedagogy drift caught by old gates (working as designed):** the M5+
  sentence-first listening ratchet flagged 14 word-level review items
  m5 inherited from the m3/m4 tail pattern → all converted to short
  verb sentences (better reinforcement anyway). Classifier amended: a
  lone dict-form verb IS a complete sentence (the rewrite thesis) —
  RULE for Spencer review.
- **Reinforcement:** review-tail LCs now pair pool nouns WITH m5 verbs
  (そらを みる。ぼうしを かう？) — double duty: old-noun retrieval +
  new-verb spacing. Adopted as the house tail pattern going forward
  (RULE candidate for invariant 19 amendment).
- **Process failure + fix:** six red CI runs — pushes validated with
  scoped tests only; cross-cutting tests (map expectations, atom pool
  reseeding, listening ratchet) live outside module files. module-gate
  now has a mandatory FULL-suite CI-parity stage (skippable only via
  MODULE_GATE_FAST=1 for inner loops).
- **Gate archaeology:** atom-coverage failure root-caused to seeded
  review-tail draws SHIFTING when the atom pool grows — any atom whose
  only exposures were auto-draws can starve. Fixed the two starved m17
  atoms with authored retrievals; the structural fix (draw stability or
  authored-only coverage) queued for the old-course teardown.
- **Continuity-judge round (m5):** 4 findings, 3 fixed same-cycle: two
  forward-references I introduced in the ratchet conversion (L1 tail
  used を one lesson early, L2 used かう — sequence-checked all 14 now),
  and the ももも triple-kana ruby gluing ("momomo") → を form. The 4th
  (cloze tile at crop edge) verified as shared-template cosmetics, not
  a bug. Judge false-positives (hiragana loanwords pre-katakana, を="o",
  そう=m3 vocab, match-grid dots) → calibrated into the protocol.
- **Judge-efficiency miss:** the "single" continuity judge fanned out 11
  sub-agents on its own (~700k tokens — no savings vs the fleet). Next
  cycle's judge prompt forbids sub-agent spawning; expected real cost
  ~150k/module.
- **Open invariant-19 tension:** tails now hand-write short review
  sentences (the mined-sentence pool predates the rewrite). Position:
  the rewrite's authored corpus IS the mine; formalize when the
  sentence-miner is repointed.

## Consultation outcomes (2026-07-20)
- Capstone cadence: **1 per teaching lesson** (confirmed).
- Pacing: **pause after m5 for Spencer's walk** of m4+m5 before cycles
  continue to m6→m29 — verbs are the riskiest pedagogy; catch drift
  before it compounds. This run therefore completes at: m5 green +
  audited + this report current.

## Still open (cosmetic/deferred)
- Renderer nit: listening-build prompts bold the gloss while MCQs quote
  it — unify renderer-side sometime.
- Atom-registry re-tagging: seed verbs still carry old-course fromModule
  tags (m7/m11/m15) — harmless now (provenance uses the full registry),
  cleanup when the old course is deleted.

## Cycle 2b — Spencer walk of m5 (findings folded back mid-run)

Spencer walked m4/m5 and flagged 5 issues → 5 new/tightened rules, all
pinned + guarded, m3/m4/m5 being fixed by 4 parallel agents:

| # | Finding (screenshot) | Rule |
|---|---|---|
| 28 | Full-sentence "Pick: 'That's Mika's bag.'" MCQ in a lesson | sentence_mcq with a multi-word answer is TEST-OUT ONLY; lessons use build/translate/speaking. Single-chunk MCQs stay. |
| 29 | "Movie night is filling up. Tell Tom: Mika will watch too." | Production prompts are plain "Build/Translate: <English>" — no theatrics, no fake "they ask in English" scenarios. Register cue only if it changes the answer. Guard bans internal sentence periods. |
| 30 | m5-1 opens on a みる？ dialogue before みる is taught | Imageable vocab debuts on word_image_mcq (image IS the intro, guide §13.2); establish the word (+ verb concept) BEFORE dialogue; teaching lessons never open on a dialogue. |
| 31 | Lesson never explains verbs take no だ | When a construction drops a required element (verb ≠ noun+だ), teach the contrast on the rule card; over-application (たべるだ) is the antiPattern. |

## Step-type coverage audit (Spencer: "make sure we use every relevant type")

11 of 24 union types used across m3-m5; the rest are correctly out of
scope for this grammar band:
- USED (count): listening_comprehension 143, build_sentence 82,
  speaking 76, word_image_mcq 64, listening_build 63, dialogue_listen
  44, multiple_choice(sentence/vocab MCQ) 42, translate 33, match_pairs
  33, particle_cloze 30, grammar_rule 21.
- CORRECTLY UNUSED: info, phrase_card, self_explanation_mcq (all banned);
  symbol_intro/production/recognition/to_sound/trace, row_test (kana
  trainer, M1-M2 only).
- NOT-YET-RELEVANT (forward flags, will become MANDATORY to consider at
  their unlock): conjugation_cloze → m6 (first verb inflection),
  kanji_reading → m8 (kanji floor), agreement_cloze → first adjectives,
  fill_blank → marginal (particle_cloze + build cover it; revisit if a
  non-particle blank drill is wanted).
Verdict: variety is maximal for m3-m5; no relevant type left on the
table. Added to the module-gate coverage report so each future module
band is checked against its expected type set.

## Methodology audit (adversarial sonnet, 2026-07-20) — findings + actions

An adversarial agent audited whether the context-pack + guards + workflow
catch each defect class BEFORE a human walk. Result: density/variety/
capstone are the strongest part; several real gaps found.

IMPLEMENTED this turn (safe, non-disruptive):
- **Gap 1 [HIGH] — provenance tokenizer was dict-form-only** → false-
  positives on たべない the moment m6 (negatives) runs; an agent would
  loosen the check. FIXED: union getRealFormLexicon() (conjugation-aware,
  already in moduleContentLints) into the tokenizer. Blocks the m6 trap.
- **Gap 3 [HIGH] — visual/continuity gate silently skippable** (workflow
  said mandatory; module-gate SKIPped unless two flags set). FIXED:
  default-ON, auto-derives lesson ids from curriculum files, explicit
  --skip-visual escape. A SKIP is now chosen, never accidental.
- **Gap 6 — exposure audit report-only** → added CRITICAL detection
  (CEJC top-50 taught-but-<2×) with non-zero exit so invariant 27 has
  visible teeth. (Currently 0 — clean.)

QUEUED for post-agent consolidation (touch the verb-debut guard / need
full-verify control — task #11):
- **Gap 2 [HIGH] — dialogue can still be a VERB's first exposure**:
  INTRO_TYPES treats dialogue_listen as valid debut for any word. Fix:
  split by POS — verbs debut on image_mcq/build/grammar_rule/LC/cloze,
  NOT dialogue. (requireImageFirst already blocks lesson-OPEN dialogues;
  this closes mid-lesson verb debuts.)
- **Gap 4 [MED] — grammar-construction forward-reference unchecked**:
  add GRAMMAR_PATTERN_MODULE {regex, introducedModule} (ない/て/た/
  connectives); lint no surface in module N uses a pattern from >N.
- **Dialogue-referent-integrity lint** (Add. 3): fail when an option
  names a role-noun that also = a named character's predicate but the
  lines never attach the role to a name (the exact m3 ともだち defect).
- **Gap 5 — canon only covers 4 chars × 4 predicates** as an assertion
  regex; relational/negated/world facts invisible. Extend COURSE_CANON
  shape when a story module adds durable facts.
- Sentence-repeat cap ignores dialogue_listen.lines[]; theatrics guard
  misses comma-linked scenarios + speaking prompts. Low-effort tightening.

Verdict: the machine layer now catches ~80% of the shipped defect
classes before a human sees them; the residue is semantic naturalness
and cross-module world-consistency (inherently judgment — that's what the
one continuity judge per module is for).
