# Wave 4D — iteration brief (template, 2026-05-18)

Triggered after Wave 4C persona walks + verification report. Each iteration agent gets a focused gap to close.

---

## Standard iteration pattern

1. **Read the Wave 4C report** identifying which assertions failed / which persona walks broke.
2. **Read the spec contract:** `docs/m3-m7-rebuild-spec-2026-05-18.md` §13 + `docs/wave-4-m3-m7-reauthor-2026-05-18.md` §2.
3. **Make the targeted fix** — small surgical change per gap.
4. **Re-run the same vitest files that flagged the gap** to confirm closure.
5. **Re-run the persona Playwright walk** that broke to confirm green.
6. **Report:** what changed, gates now passing.

---

## Common iteration tasks (likely)

### D-1 — Density top-up
If `sub-lesson-density.test.ts` shows any sub-lesson still below 18 (the soft floor): add 2-4 review-tail items from `M3_M7_REVIEW_POOL`. No structural change — pure padding with prior-content compounding.

### D-2 — Atom-coverage gap
If `atom-coverage.test.ts` still has atoms at n=1 or n=2: identify which sub-lessons could naturally surface them as cloze carriers / vocabMcq distractors / match-pair entries. Add the references without introducing new atoms.

### D-3 — Answer-rotation gap
If `assertAnswerRotation` still throws for any sub-lesson at `minDistinct=2`: rebalance the cloze block by swapping one cloze's correct particle to a different one (rewrite the carrier sentence to match).

### D-4 — Console error in persona walk
If a Playwright persona surfaces a console error: trace to the step view that emitted it. Likely an audio/TTS asset miss or a step-prop mismatch. Fix at the data layer (don't change view).

### D-5 — Persona walk stuck mid-lesson
If a persona walker can't advance past a particular step: the step's primary CTA button isn't matching the walker's heuristics. Add a `data-testid` to the step view, OR rewrite the walker's button-matching logic. Prefer the testid — semantic over heuristic.

### D-6 — dialogue_listen missing on a closer
If a Wave 4B agent missed migrating its dialogue closer to `dialogueListen()`: replace the legacy `dialogueLesson()` call site. The factory shape is documented in `_jaGrammarHelpers.ts:dialogueListen` + spec §3.

### D-7 — selfExplain placement still wrong
If audit-flagged selfExplain steps still fire after first commit: move the step to position N-1 of its drill cluster. Pure step-array reorder.

### D-8 — selfExplain distractor still dismiss-on-sight
If audit found a distractor like `"X always Y"` (obvious nonsense): rewrite to a true-but-incomplete-rule shape. Reference the rewrite examples in spec §13.4.

---

## Acceptance gates (after Wave 4D)

All must be green:

- [ ] `npx tsc --noEmit` — 0 errors.
- [ ] `npx vitest run` — all green (no failures, no skips beyond the existing legitimate ones).
- [ ] `npx vitest run src/features/lesson/data/sub-lesson-density.test.ts` — every M3-M7 teaching sub-lesson in [18, 24] band (target [20, 22] hit by ≥80% of sub-lessons).
- [ ] `npx vitest run src/features/lesson/data/atom-coverage.test.ts` — every introduced atom ≥3 occurrences; cross-module compounding violations < 5 (down from 45 baseline).
- [ ] `npx vitest run src/features/lesson/data/mcq-position-distribution.test.ts` — every step type's correct slot < 55% concentration.
- [ ] `npx vitest run src/features/lesson/data/ja-m3-m7-coverage.test.ts` — every lesson resolves, every module has grammar_rule + dialogue (phrase_card-with-speaker OR dialogue_listen) + row_test.
- [ ] `npx playwright test tests/e2e/wave-4-m3-m7-load-smoke.authed.spec.ts` — all M3-M7 lessons load without console errors; dialogue closers reach a dialogue_listen step.
- [ ] `npx playwright test tests/e2e/persona-maya-m3-m4.authed.spec.ts` — Maya completes all 16 lessons (M3 + M4).
- [ ] `npx playwright test tests/e2e/persona-devon-m5.authed.spec.ts` — Devon completes M5.
- [ ] `npx playwright test tests/e2e/persona-trevor-m6-m7.authed.spec.ts` — Trevor completes M6 + M7.

When all green: M3-M7 is confirmed working for "half-module-a-day" pacing (each persona test simulates a single sub-lesson sitting at persona-appropriate pace; full module = 8 sittings ≈ 4 days). Atom coverage ≥3 means each atom re-surfaces enough to support ~80% retention per the testing-effect + spacing-effect literature (Roediger & Karpicke 2006 + Cepeda 2008).
