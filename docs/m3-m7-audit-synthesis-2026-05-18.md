# M3-M7 Rebuild Audit — Synthesis (2026-05-18)

10 differentiated Opus agents audited the rebuilt M3-M7 curriculum:

| # | Agent | Lens |
|---|---|---|
| 1 | Maya | Persona — 16yo teen, anime-curious, low patience |
| 2 | Devon | Persona — 32yo adult returning after 7-day gap |
| 3 | Edith | Persona — 64yo retiree, deliberate, power-feature user |
| 4 | Trevor | Persona — 28yo engineer, time-optimizer |
| 5 | Cialdini | Influence principles |
| 6 | Fogg | Behavior Model (B = MAT) |
| 7 | Habit-loop | Duhigg / Clear / Wood cue-routine-reward |
| 8 | CLT | Sweller cognitive load |
| 9 | Retrieval | Roediger-Karpicke testing-effect gradient |
| 10 | Flow + competitive | Csikszentmihalyi + Bjork + emulation scan |

User constraint held constant: kana ~70% well, romaji-heavy, low feature-pickiness, low neediness.

---

## 1. Headline

**The substrate is sound — the reward layer and a handful of placement/distractor calls are the gaps.** The density rebuild (14-20 steps per sub-lesson, R3 interleave, ≥0.25 review ratio, `assertNoSameAnswerCluster`) is recognized across all 10 audits as a real pedagogical advance over both the prior M3-M7 and over Duolingo's per-lesson density. Almost every actionable fix is either (a) wiring an existing UI primitive to a step view that currently misses it, or (b) a content micro-edit (distractor rewrite, info-card compression). Very little needs new step types or architecture.

---

## 2. Convergent themes (3+ agents agree — HIGH confidence)

### 2.1 Reward asymmetry — `CelebrationToast` is silent on the 6 hardest step views
**Surfaced by:** Habit-loop (primary), Trevor, Fogg, Edith.

The toast fires on `multiple_choice`, `particle_cloze`, `self_explanation_mcq`, `symbol_*`. **Silent on `translate`, `build_sentence`, `listening_build`, `match_pairs`, `speaking`, `listening_comprehension`** — exactly the generation-tier steps the rebuild added as load-bearing. The reward surface currently inversely correlates with routine difficulty.

**Severity:** HIGH | **Effort:** LOW (per-view wrapper) | **Files:** the 6 view files.

### 2.2 Romaji crutch unmitigated at 70% kana
**Surfaced by:** Trevor, Maya, Devon, CLT.

Three angles:
- Adult learners coast on English/romaji and never parse the kana (Trevor).
- Teens leave romaji on because no in-content nudge exists (Maya).
- Returning users with degraded kana stay on romaji and the gap never closes (Devon).
- CLT framing: parallel notation streams (English + romaji + kana + audio + emoji) blow the 4±1 working memory ceiling on cards like M5-1 numbers (Kalyuga/Chandler/Sweller 1999 redundancy effect).

**Fixes (compose all three):**
- **In-content opt-in** "romaji-off for next 2 / +XP" prompt on M5+ cloze drills (Trevor's variable-reward suggestion).
- **Adaptive romaji fading** — extend the existing `useKanaHelperVisible` infrastructure (which already powers `AnnotatedJa` ruby) to `PhraseCardStepView`, `WordImageMcqStepView`, and `SelfExplanationMcqStepView` anchor. By kana mastery threshold.
- **Settings: smarter default** — currently romaji ON for everyone; should bias OFF once kana mastery crosses a threshold.

**Severity:** HIGH | **Effort:** MED.

### 2.3 Info-card overweight (opens + closes both)
**Surfaced by:** Trevor, Maya, Fogg.

- **Open cards are exposition, not propulsion** — 80-200 word teacher monologues (M3-1 katakana intro, M5-1 numbers culture, M6-4 が intro) before any action. Per Fogg, "a prompt must tell us what to do *next*."
- **Close cards are predictable** — ~35 fixed "🏆 You can now…" cards across M3-M7. Peak-end says the lesson should end with a retrieval *win*, not a paragraph.
- **Row-test pass uses same `LessonComplete` UI as a vocab-lesson pass** — the in-module summit needs its own variant (Habit-loop).

**Fix bundle:**
- Compress openers to ≤1 sentence + action CTA. Move long culture notes into the closing `win` card OR into a `grammarRule.cultureNote` field.
- Wire `CelebrationToast` to fire on `infoStep(variant: "win")` mount (the primitive exists, the mount-time hook doesn't).
- New `LessonComplete` row-test variant with distinct gold treatment.
- One-line "next sub-lesson tee" at the end of each `info-end` ("Next: の possession — 4 minutes") for anchor-habit chaining.

**Severity:** HIGH | **Effort:** LOW-MED.

### 2.4 Same-answer rotation gap — adjacency-only, not set-level
**Surfaced by:** Devon (primary, explicit), Cialdini (indirect).

The spec §6 anti-pattern said "answer-set must rotate ≥3 distinct options across cloze items." `assertNoSameAnswerCluster(maxAdjacent=2)` only blocks **adjacent** dupes. Result: M3-4 (5×は), M6-2 (4×に), M7-3 (all を) ship with R3 interleave breaks between clozes but **semantic monotony intact** — Devon's pattern-matching brain wins via "in this lesson always pick X."

**Fix:**
- Add `assertAnswerRotation(steps, particleClozeMinDistinct=3)` helper → throw at module-import if a sub-lesson's cloze block has < 3 distinct correct particles.
- Retrofit M3-4, M6-2, M7-3 to rotate answer particles (may require adding 1-2 cross-particle clozes per affected sub-lesson).
- Run the new assertion across all M3-M7 to catch other lessons.

**Severity:** HIGH | **Effort:** LOW.

### 2.5 Review pool curation bias toward easy atoms
**Surfaced by:** Devon (explicit), Cialdini (indirect).

`M3_M7_REVIEW_POOL` contains 20 M1 atoms but only **4 M2 atoms, all from the g-row** (the easiest dakuten). The rows learners actually forget — z, d, p, yōon — are **structurally excluded** from M3-M7 review tails. Returning users like Devon never get the cards they forgot most.

Also: §10.4 promised FSRS-weighted draws ("FSRS-weighted" was the differentiator vs Duolingo); current `pickReviewAtoms(seed, pool, n)` is deterministic-by-id, not learner-state-weighted.

**Fix:**
- Broaden `M3_M7_REVIEW_POOL` to include z/d/p/yōon atoms with emoji-bearing shape.
- Plumb `sessionLog` `incorrect` count into `pickReviewAtoms` as a weight (interim before FSRS-6 swap).
- Once FSRS-6 swap lands (Q12 resolution), full FSRS-weighted draws.

**Severity:** HIGH | **Effort:** MED.

### 2.6 `selfExplain` distractors are dismiss-on-sight
**Surfaced by:** Retrieval (primary), Maya, CLT (indirectly).

Specific weak distractors flagged:
- `ja-m6-4-self-ga`: "は and が mean exactly the same thing" — 0.5s dismissal.
- `ja-m4-2-self-no-1`: "の always comes between two katakana words" — surface-pattern hint telegraphs answer.
- `ja-m5-3-self-futari`: "ください always follows a drink word" — too obviously wrong.

Per Little & Bjork 2015 + Adesope 2017, the MCQ testing-effect gain (g=0.70) **requires** plausible-but-wrong distractors. Dismiss-on-sight distractors degrade `selfExplain` to recognition.

**Fix:** rewrite the 8 `selfExplain` distractor sets across M4-M7 to "rule-citing-but-wrong" not "obvious-nonsense." Target form for the wrong-rule lure: a near-rule the learner could plausibly endorse.

**Severity:** HIGH | **Effort:** LOW (content edit).

### 2.7 `selfExplain` placement timing
**Surfaced by:** CLT (primary), Maya.

Currently fires immediately after the first commit on a particle — i.e., at the most fragile schema moment. Per Kalyuga 2007 expertise-reversal + Bjork desirable-difficulties, the metacognitive reflection should land **after 2-3 retrievals' worth of consolidation**, not first.

**Fix:** move `selfExplain` to position N-1 (second-to-last) of the drill cluster in M4-2, M5-2, M5-3, M6-2, M6-3, M6-4, M7-2, M7-3, M7-5, M7-6.

**Severity:** HIGH | **Effort:** MED (re-order steps in ~10 sub-lessons).

### 2.8 Compounding review legibility (substrate works, UI doesn't show it)
**Surfaced by:** Flow+competitive (WaniKani lens), Habit-loop, Trevor.

The `M3_M7_REVIEW_POOL` system pulls atoms from prior modules into every sub-lesson tail — but the learner has no visible signal "this is a review of something you learned 5 lessons ago." The compounding effect (the #1 §10.10 differentiator vs Duolingo) is **content-true but learner-invisible.**

**Fix:**
- Add a small "↻ from M2" or "you've seen this before" micro-badge on review-tail steps (the `fromModule` field is already on `ReviewAtom`).
- Sub-lesson `win` card names the specific prior-module atom that returned ("You re-met めがね from g-row — still in your head").

**Severity:** MED | **Effort:** LOW.

---

## 3. Single-agent HIGH-impact finds (no convergence yet, but high-value)

### 3.1 M6-4 expertise-reversal contradiction
**Surfaced by:** CLT.

`RULE_GA_EXISTENCE` says "memorize ___が あります as a unit, don't worry about は/が contrast yet." Then 4 steps later `ja-m6-4-self-ga` asks "Why is が correct here, not は?" — the exact contrast the rule said to defer. Learner gets contradictory framing in one sub-lesson.

**Fix:** move the は/が `selfExplain` to M6-5 or later. Replace M6-4's `selfExplain` with one on the あります/います animacy split — the rule the learner just committed.

**Severity:** HIGH | **Effort:** LOW.

### 3.2 M7-2 verb-class cliff
**Surfaced by:** Flow+competitive.

`RULE_DICT_MASU` → 6-pair `match_pairs` requires **type-classification (-る vs -u) + form-transformation simultaneously**. Bjork desirable-difficulties only works when schema scaffolding exists; here, both axes are brand-new.

**Fix:** insert one transitional `sentenceMcq` ("Which is a -る verb?") between `RULE_DICT_MASU` and the 6-pair match. Same step count, much smoother difficulty curve.

**Severity:** HIGH | **Effort:** LOW.

### 3.3 M7-6 under-delivers on "compound sentences" title
**Surfaced by:** Flow+competitive.

Lesson title promises compound sentences (multiple particles per sentence), but cloze stems only blank ONE particle at a time. Bjork: multi-blank generation > single-blank.

**Fix:** wake up the unused `fill_blank` step type (spec §4 said to but agents didn't); extend to multi-blank cloze. Use sparingly in M7-6 and any future M8+ recap.

**Severity:** MED-HIGH | **Effort:** MED.

### 3.4 `TranslateStep` ships TYPED INPUT, not MCQ (happy accident)
**Surfaced by:** Retrieval.

Q3 resolution said Path A (MCQ-only); implementation actually ships **typed free-text input** (Path B). This is the **single highest testing-effect lever in the codebase** (Roediger & Karpicke 2006b: production retrieval = 1.5× durability of recognition on 7-day delayed test).

**Fix:**
- Update Q3 resolution in `curriculum-roadmap-n5-2026-05-18.md` to reflect ground truth.
- Add a code comment on `translateStep()` factory + `TranslateStepView` warning future maintainers NOT to "fix" by adding word-bank.
- Optional `optionsKana?: string[]` opt-in word-bank fallback for high-friction cases; default stays typed.

**Severity:** HIGH (preservation) | **Effort:** TRIVIAL.

### 3.5 Negative-testing-effect risk (Roediger & Marsh 2005)
**Surfaced by:** Retrieval.

3 specific places where plausible-wrong distractors could install false knowledge:
- `ja-m6-4-mcq-ari-vs-i`: distractor "犬は います" is grammatical in context, framed as wrong.
- `ja-m5-5-cloze-6`: `です` is the answer in a particle-cloze slot — learner may encode "です is a particle."
- `ja-m7-5-cloze-2`: distractor implies "you can't `を` + `うち`," but `うちを でます` is real Japanese.

**Fix:** tighten explanations to acknowledge the carve-out cases.

**Severity:** MED | **Effort:** LOW.

### 3.6 Edith's `CelebrationToast` dignity mismatch
**Surfaced by:** Edith.

"Nice! / Great! / Perfect!" + 🎉 fires on every correct step. For older adult learners (and identity-conscious adults broadly), this reads as juvenile. Edith's persona in CLAUDE.md flagged the analogous "Rest mode" pattern (#R1-defer-D).

**Fix:** add a "Quiet mode" / "Senior mode" settings toggle that suppresses celebration animations + party-popper icon; keep checkmark + audio feedback. Per-user accessibility profile per #R1-defer-E generalizes.

**Severity:** MED | **Effort:** LOW.

### 3.7 "Spencer" hardcoded name in M3-7 dialogue
**Surfaced by:** Edith.

Dev name leaks into learner content. `ja-m3-7-l2` line uses literal "Spencer" instead of a placeholder.

**Fix:** replace with `{learnerName}` or a generic placeholder ("Hello, [your name]") that auto-fills from user profile.

**Severity:** LOW | **Effort:** TRIVIAL.

### 3.8 M5-6 generic counters `ふたつ` / `みっつ` used without prior teaching
**Surfaced by:** Devon.

M5-3 teaches only the `人` counter (ひとり/ふたり); generic counters (`ひとつ`/`ふたつ`/`みっつ`) appear in M5-6 and M5-7 dialogue as "the correct answer" with no formal introduction.

**Fix:** add a brief `grammarRule` mini-card or `selfExplain` introducing generic counters in M5-5 before they appear in M5-6/M5-7.

**Severity:** MED | **Effort:** LOW.

### 3.9 M3-1 retrieval-gradient flat-bottom
**Surfaced by:** Retrieval.

Zero tier-1 (free recall) steps in M3-1; one stubbed `speaking`. All other modules hit healthy tier distribution. The katakana intro is the only sub-lesson without a typed `translateStep`.

**Fix:** add one `translateStep("コーヒー")` or similar before the review tail.

**Severity:** LOW | **Effort:** LOW.

### 3.10 Spacing-within-sub-lesson spec violation (defensible)
**Surfaced by:** Retrieval.

Spec §2 requires ≥4 intervening steps between first encounter → first retrieval. The encode-then-retrieve sandwich the helpers were built for **systematically** violates this with 0-1 step lag. Defensible per Karpicke & Roediger 2007 expanding-retrieval IF a second retrieval at ≥6-step lag exists.

**Fix:** amend spec §2 to "first retrieval may be zero-lag IF a second retrieval at ≥6-step lag exists in same sub-lesson." Add `assertSecondPassRetrieval(steps)` helper.

**Severity:** LOW (spec amend, not content fix) | **Effort:** LOW.

---

## 4. Strategic / future-scope (deferred to future sessions)

### 4.1 Goal-selection unlock at M5 (per roadmap §10.1)
Multiple agents (Cialdini, Devon, Maya) hit this — the goal-selection mechanism would resolve identity-relevance for teens (Maya gets anime sidequests), travelers (Devon gets transactional payoff earlier), test-takers, etc. Already in framework; needs build.

### 4.2 Teen-identity sidequest variants
**Maya** flagged: 0 anime/manga/school surfaces across 50 sub-lessons. Possible fix: reskin 2-3 dialogues (M3-7 guesthouse → school, M4-7 friend's apartment → manga shelf) with teen-coded carriers. Same grammar, same vocab.

### 4.3 WaniKani-style visible compounding badges
Discussed in §2.8. Forms the visible-payoff layer for the cumulative-review system.

### 4.4 LingoDeer-style "?" rule-card peek inside cloze
Mid-cloze affordance to peek at the relevant `RULE_*` card without consuming the attempt. Flow-channel preservation for romaji-on learner stuck on は vs が.

### 4.5 Worked-example step type
CLT flagged the M7-6 compound-particle cliff. A `worked_example` step (or extension of `grammar_rule` with role-color-coded sentence) would smooth the curve per Sweller & Cooper 1985.

### 4.6 Pimsleur-style anticipation audio drill
New `translate` variant: `mode: "anticipate"` — show EN, play silence, then play correct JA. Pimsleur's #1 retention claim. Low engineering on existing TTS infra.

### 4.7 Identity-anchored Unity Cialdini copy
Sharpen `win` card copy: "You're now someone who can [verb]" not just "[verb] unlocked." Cleanest Cialdini lever that fits the "no streak guilt" brand.

### 4.8 Yesterday-warm-up chip (#R1-defer-A)
Already queued. Devon's audit and Fogg's audit both flagged urgency — promoting could unlock 25% retention boost for returning learners (Cepeda 2008 30-second probe restores ~25% recall accuracy on a 7-day gap).

### 4.9 `+XP` float animation + variable-rare verdicts + haptic
Habit-loop's "Make it satisfying" fixes. Trivial copy/animation work; compounds with §2.1 reward-asymmetry fix.

### 4.10 Document the typed-translate "happy accident" so future agents don't break it
Add comment to `_jaGrammarHelpers.ts:translateStep()` and `TranslateStepView.tsx` explaining the deliberate choice.

---

## 5. Recommended sequencing

If we run a "wave 4" follow-up rebuild dispatch:

### Wave 4A — content-only fixes (parallel agents)
One agent fixes a coherent slice across modules:
- **Agent A**: `selfExplain` distractor rewrites (§2.6) + selfExplain placement moves (§2.7) — ~10 sub-lessons touched.
- **Agent B**: `assertAnswerRotation` helper + retrofit M3-4/M6-2/M7-3 + M6-4 selfExplain move (§3.1) + M5-6 counter teaching (§3.8) + M3-1 translate add (§3.9).
- **Agent C**: M7-2 verb-class scaffolding (§3.2) + M7-6 multi-blank cloze via `fill_blank` (§3.3) + negative-testing explanations (§3.5).
- **Agent D**: review pool broadening + session-log weighting (§2.5) — until FSRS-6 swap lands.

### Wave 4B — UI primitive wiring (sequential or one agent)
- Wire `CelebrationToast` to 6 missing step views (§2.1).
- Wire `CelebrationToast` to `infoStep(variant: "win")` mount (§2.3 part).
- Distinct `LessonComplete` row-test variant (§2.3 part).
- Adaptive romaji fading extension (§2.2 part).
- Compounding-badge micro-flag (§2.8).
- "Spencer" placeholder fix (§3.7).
- Document `TranslateStep` typed-input (§3.4).

### Wave 4C — settings + framework (smaller scope, can defer)
- Quiet/Senior mode toggle (§3.6).
- In-content romaji-off opt-in challenge (§2.2 part).
- Anchor-habit "next lesson" tee in info-end (§2.3 part).
- Q3 resolution update in roadmap (§3.4 part).

### Future-scope (separate sessions)
§4.1–§4.10. Goal-selection unlock + sidequest authoring + UI features.

---

## 6. What Lingo's M3-M7 rebuild already outperforms competitors on

Honest, multi-agent-confirmed:

1. **Cumulative review density** — `pickReviewAtoms` + `M3_M7_REVIEW_POOL` + per-sub-lesson ≥0.25 ratio beats Duolingo's 2-lesson lookback and WaniKani's SRS-only model.
2. **Wrong-answer rule-naming** — `cloze.explanation`, `selfExplain.ruleExplanation`, `sentenceMcq.explanation` all cite the rule, not just verdict. Duolingo is bare verdict; Lingo wins.
3. **Build-time answer-rotation guarantor** — `assertNoSameAnswerCluster` enforces at import. No competitor publishes a content-time invariant for this.
4. **`selfExplain` shipped + used** — Dunlosky 2013 moderate-utility move Duolingo lacks entirely; even at current distractor quality, the *presence* of "why" questions adds a tier.
5. **Density bar enforced** — 14-20 steps + R3 interleave + ≥5 distinct types per sub-lesson is a measurable density advantage.
6. **Modality pairing** — TTS auto-played with visual kana on PhraseCard / Cloze / SelfExplain honors Mousavi/Low/Sweller 1995 (auditory+visual > dual-visual). Coursera fails this; Lingo is structurally CLT-aligned.

---

## 7. Living doc

Append future-round findings here. Condense to `docs/lesson-authoring-guide.md` (per Q8) after wave-4 lands.
