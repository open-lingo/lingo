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
| 26 | Capstone integration step before every teaching lesson's review tail (m5+) | Spencer-directed ("one hard lesson step occasionally… combining more past concepts") — implemented as 1/lesson; **confirm cadence** |
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

## Cycle 2 — m5 (VERBS I) — IN PROGRESS
- Infra first: module-gate + DOM-render gate (builder agent), then spec
  with capstone steps + frequency-fed review tails, then authoring.

## Open questions for Spencer (non-blocking; answer whenever)
1. Capstone cadence: 1 per teaching lesson (current) or 1 per ~2-3
   lessons?
2. Module pacing: cycles continue m5→m29 sequentially with a report per
   module; interrupt anytime to walk a module before the next starts.
3. Renderer nit: listening-build prompts bold the gloss while MCQs quote
   it — unify renderer-side? (cosmetic, deferred)
