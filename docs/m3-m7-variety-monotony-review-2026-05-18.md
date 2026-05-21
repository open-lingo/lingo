# M3–M7 Variety & Monotony Review
**Date:** 2026-05-18
**Audit lens:** step-type sequence, no-3-in-a-row rule, match-pairs placement, monotony feel, pacing/escalation, show-don't-tell, language-agnostic-ness
**Method:** 5 parallel Opus agents (one per module), per-sub-lesson scoring on the same rubric
**Sources:** mock-ja-m{3-v2,4,5,6,7}.ts read end-to-end

---

## TL;DR

**The structural variety bar is met everywhere.** Every content sub-lesson hits ≥8 distinct step types and back-loads match_pairs. Wave-4 enforcement (assertAnswerRotation, padMatchPairsToTarget, Murmur3 slot rotation) is doing its job — no hard step-type runs in M3/M4/M5/M6.

**Two real monotony surfaces exist:**

1. **M7 has the only honest violations of the "max 2 adjacent same type" rule** — M7-8 ships 5 phrase_cards in a row (RED), M7-3 runs 3 clozes in a row (YELLOW). No guard exists for phrase_card/vocab adjacency, only for particle_cloze answer clustering.
2. **Cloze-fill is the dominant retrieval mode for grammar** across M3-M7. Even with interleave breaks, a learner experiences "fill in the particle" 25-30 times across the modules. Type rotation hides repetition of *cognitive task*.

**Show-don't-tell is mostly good** but 6 specific cards lean prose-heavy:
- M3-1 `info-system` (katakana lore), M3-3 `info-adj` (adjective preview)
- M4-2 `RULE_NO` (3-sentence rule + culture note)
- M5-3 (the Native-vs-Sino split is told *three times* — info-open, vocab cultureNote, selfExplain)
- M6-4 `RULE_GA_EXISTENCE` (5 sentences with meta-disclaimer — heaviest tell in M6)
- M6-5 `self-ha-vs-ga` (4+ sentences of information-status theory)
- M7-2 `RULE_DICT_MASU` (4 sentences carrying the verb-class teach)

**Pacing is generally good.** Two cliff candidates: M5-2 (RULE_KUDASAI cold-opens with no prior exposure), M7-7 (build_sentence at step 1 with no warm-up).

---

## Per-module verdicts

| Module | GREEN | YELLOW | RED | Headline |
|--------|-------|--------|-----|----------|
| **M3** | 5 (m3-1, m3-2, m3-5, m3-7, m3-8 row test) | 3 (m3-3 verbose tell, m3-4 cloze marathon, m3-6 review tail, m3-8 4-particle-MC run) | 0 | Cloze marathon in m3-4 (6/11 steps); review tails skew vocabMcq + LC |
| **M4** | 4 (m4-1, m4-4, m4-5, m4-6, m4-7) | 2 (m4-2 lax answer rotation, m4-3 structural cloze monotony, m4-8 row test の-bias) | 0 | Answer-rotation floor too lax in m4-2 (5/6 clozes resolve to の); row test 3/4 mc = の |
| **M5** | 4 (m5-1, m5-7, m5-8) | 4 (m5-2, m5-3, m5-4, m5-5, m5-6) | 0 | **5 violations of "no two adjacent same type" all phrase_card pairs**; selfExplain missing in m5-4; m5-3 tells the same rule 3× |
| **M6** | 6 (m6-1, m6-2, m6-3, m6-6, m6-8, m6-9) | 3 (m6-4, m6-5, m6-7) | 0 | selfExplain ruleExplanation prose escalates each lesson (3 → 3 → 3 → 4+ sentences); m6-7 cold-start cliff |
| **M7** | 4 (m7-1, m7-6, m7-9 row test) | 4 (m7-2, m7-3, m7-4, m7-5, m7-7) | **1 (m7-8: 5-phrase run)** | Only RED in the system; phrase_card/vocab adjacency unguarded; sentenceMcq template-clones in m7-4 |

---

## Cross-module patterns (ranked by impact)

### 1. Cloze-as-default-retrieval for grammar
Across M3-M7, particle_cloze is the workhorse: 6 in m3-4, 7 in m3-5, 6 in m4-2, 7 in m4-5, 6 in m5-7-equivalent, 6 in m6-5, 6 in m6-6, 6 in m7-3, 7 in m7-5. **Even with type-interleave breaks, the cognition is "look at sentence with hole, tap correct particle" — same task in different costumes.** Add 1-2 fill-by-typing or sentence-transformation steps per particle-heavy sub-lesson to break the modality.

### 2. Phrase_card / vocab adjacency is unguarded
`assertNoSameAnswerCluster` catches MCQ-answer dupes; nothing catches consecutive intro cards. M5-2/3/4/5 violate the "max 2 adjacent" rule 5 times (all phrase_card pairs). M7-1 has 6 vocab cards in 13 steps. M7-8 has 5 phrase_cards in a row. **A `assertNoConsecutiveSame(steps, 3, ["phrase_card","vocab"])` would catch all 7 at build time.**

### 3. Prose-tell escalation in selfExplain.ruleExplanation
M6 specifically: ruleExplanation grows from 3 sentences (m6-2) → 3 (m6-3) → 3 (m6-4) → 4+ (m6-5 with information-status theory). Same N-1 placement is correct; the prose is the leak. Convert m6-5 to contrast-pair demo + 1-sentence caption.

### 4. Review tails over-rely on vocabMcq + listeningComp alternation
Most pronounced in M3-1, M3-6, M6-1. The "kana/vocab → meaning" axis dominates the tail; production almost never appears as a review item. One reviewed-atom speaking or translate per tail would shake this up.

### 5. SentenceMcq template-cloning
M7-4 runs "Which sentence means 'I [verb] X.'?" four times — answer pattern-matchable as "find the one with を + correct verb." Variety of step-type without variety of cognition. Replace 2 with vocabMcq or a particle_cloze with food-word answer set.

---

## Top 10 fixes (cross-module, ranked by effort/impact)

| # | Fix | Module | Effort | Why it matters |
|---|-----|--------|--------|----------------|
| 1 | **Break M7-8's 5-phrase run.** Interleave each warm-up phrase_card with 1 listeningComp/speaking. | M7 | LOW | Only RED verdict in the system; highest-visibility violation |
| 2 | **Add `assertNoConsecutiveSame(steps, 3, ["phrase_card","vocab"])` to `_jaGrammarHelpers.ts`.** | helpers | LOW | Catches m7-8 + m7-1 + all 5 M5 pair violations at build time. One-time guard, infinite payoff |
| 3 | **Tighten `assertAnswerRotation` in M4-2 from 2 → 3** and rewrite one cloze to use は. Same in M4-8 row test (3/4 mc resolve to の). | M4 | LOW | Kills the "always pick の" exploit currently exploitable |
| 4 | **Strip Native-vs-Sino prose duplication in M5-3** — keep only selfExplain as rule-bearer; replace info-open with a match_pairs grouping ひとり/ふたり/さんにん/よにん. | M5 | MED | Demotes 3 tell-surfaces to 1 show-surface |
| 5 | **Re-cast M6-5 `self-ha-vs-ga` ruleExplanation as a contrast-pair demo.** Show こうえんが あります / こうえんは どこですか with audio + 1-sentence caption. | M6 | MED | Heaviest tell in M6; pure show-don't-tell win |
| 6 | **Trim M6-4 `RULE_GA_EXISTENCE.rule` from 5 sentences to 2 + antiPattern.** | M6 | LOW | Heaviest single rule card in the system |
| 7 | **Invert M7-2 verb-class teach order.** Match (dict→ます pairs) FIRST, let learner induce -る/-u split, THEN show RULE_DICT_MASU as labeling. | M7 | MED | Attacks the verb-class cliff with structure, not more prose |
| 8 | **Drop 1 cloze from M3-4** (6 → 5), replace with build_sentence or translate (production direction). | M3 | LOW | Breaks the は-drill marathon's perceived monotony |
| 9 | **Add selfExplain to M5-4** anchored on the price-question shape (これは いくら ですか). | M5 | LOW | Restores reflection parity — m5-4 is the only content sub-lesson missing one |
| 10 | **Vary M7-4 sentenceMcq template** — replace 2 of 4 identical-frame items with vocabMcq + a particle_cloze with food-word answers. | M7 | LOW | Stops template pattern-matching |

---

## What's actually fine (don't fix)

- **Match-pairs placement.** Every content sub-lesson back-loads match_pairs to step N-1 or N-2 (and several add a second mid-lesson match where it caps a vocab cluster). Pattern is consistently strong; no fixes needed.
- **dialogue_listen rollout.** M3-7, M4-7, M5-7, M6-8, M7-8 all anchor on it at appropriate positions with appropriate warm-ups around. The new step type integrated cleanly.
- **selfExplain N-1 placement.** Correct in every lesson that has one (M5-4 is the only miss, listed as fix #9).
- **grammar_rule cards with comparison tables** (M4-4 RULE_KOSOADO, M5 number cards). Justified verbosity — 4-way distinctions and counter inventories genuinely need the table.
- **M3 katakana lesson (m3-1).** GREEN despite carrying the highest pedagogical risk in the module.
- **M6's particle-rotation cliff was successfully smoothed.** No cliff in m6-2 (に) or m6-3 (で) despite this being where Wave 4 added scaffolding.

---

## Recommended judgment criteria for you

Read the **Top 10 fixes** table. The first 3 are mechanical and safe (build-time guard + rotation tighten + run break) — could ship in one pass. Fixes 4-7 are content rewrites and benefit from your taste on the show-vs-tell line. Fixes 8-10 are polish.

If you only do one thing: **fix #2** (the adjacency guard). It's a 30-line helper that retroactively catches 7 violations and prevents the next round of authoring from re-introducing the same problem.

If you do two: **fix #1** then **fix #2** (or just fix #2 — it'll fail the test, and you'll fix #1 to make it pass).
