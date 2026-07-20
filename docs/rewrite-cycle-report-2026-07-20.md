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
