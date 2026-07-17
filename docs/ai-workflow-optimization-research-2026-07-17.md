# AI Workflow Optimization Research — 2026-07-17

**Provenance:** Deep-research pass run by a secondary Claude session (Spencer + Claude Fable 5) while the main session built the visual-QA gate. Method: 5 parallel search angles → 27 sources fetched → 85 falsifiable claims extracted → 18 top claims each verified by a 3-vote adversarial panel → 15 confirmed, 3 refuted. Findings below cite primary sources so the main agent can re-check any claim before acting on it.

**Audience:** the main lingle agent session. Purpose: cement these into authoring/QA workflow where they hold, flag where they don't, and test against a QA pass.

---

## Local ground truth (measured this session)

- `lingo/CLAUDE.md`: 18KB / 104 lines, references 11 docs (all references valid, no dead links).
- `lingo/docs/lesson-authoring-guide.md`: 59KB, ~8,600 words, 56 sections — the de-facto contract for every authoring dispatch.
- Doc corpus: **158 markdown files, ~256k words** across lingo + lingo-core.
- Authoring pattern in use: Sonnet subagents dispatched against brief/contract docs; Gate pipeline (Gates 2/4/9/10) QAs output; Gate 10 = screenshot + contracts.json → Haiku judge.

---

## Finding 1 — "Governance decay": compaction silently erases constraints (HIGH confidence, 3-0 votes ×2)

- **ConstraintRot benchmark** (1,323 episodes, 7 models): constraint violation rates go from **0% with full context to 30–59% after context compaction**. Soft policy rules decay **~8× faster** than hard safety rules. "Constraint pinning" — re-injecting the rules so they survive compaction — restores 0% violations.
  - Source: https://arxiv.org/pdf/2606.22528
  - Corroborating (omission constraints decay, commission constraints persist): https://arxiv.org/abs/2604.20911
- **Lingle mapping:** our recurring regression pattern (romaji leaks, register violations, furigana-over-hiragana, distractor-quality rules being forgotten) is consistent with this failure mode. Style/omission rules ("don't show romaji", "don't tag plain-form") are exactly the soft-rule class that decays fastest.
- **Adoptable change:** every authoring/fix dispatch prompt carries a short **pinned invariant block** (the non-negotiables: pedagogy invariants, romaji/register rules, distractor rules, es-draft flags) verbatim — never rely on CLAUDE.md having been read earlier in a long session, or on rules surviving /compact.

## Finding 2 — LLM judges reward persuasiveness, not correctness; solve-first fixes most of it (HIGH confidence)

- Reference-free judges structurally decouple from true quality: on GSM8K, judge pass rate rose 0.72→0.94 while true accuracy stayed flat at 0.20. A 3-judge-family ensemble (Qwen/Llama/Gemma) still accepted **55% of manufactured errors**. Mitigation: **forcing the judge to commit its own answer before scoring dropped false-positive rate from 0.719 to 0.012**.
  - Source: https://arxiv.org/pdf/2607.05904 ("More Convincing, Not More Correct", 2026)
- Rubrics alone do not prevent judge-gaming; non-reasoning judges are the most exploitable. Reasoning judges grounded in gold references avoid the failure (Meta AI, Mar 2026, §4.2).
  - Source: https://arxiv.org/html/2603.12246v1
- Judges degrade to near coin-flip under distribution shift (attack/model/data shift; ICML 2026, 6,642 human-verified labels). A judge calibrated on one authoring model's output style silently degrades when the authoring model or content category changes.
  - Sources: https://arxiv.org/html/2603.06594 · https://arxiv.org/abs/2606.13685
- **Lingle mapping — Gate 10 specifically:**
  1. Judge must be **reference-grounded**: give it the brief/contract AND the source-of-truth curriculum data, not just the screenshot.
  2. **Solve-then-compare**: the judge first derives what the step *should* display, then diffs against the screenshot — not free-form rating.
  3. The **Haiku judge on an autonomous-fix gate is the risky configuration** (non-reasoning-tier judge + iterate-until-pass loop = the exact gamed setup). Keep Haiku for cheap triage if desired, but calibrate against a human-labeled sample (Spencer's past QA verdicts are ready-made labels) and escalate uncertain/failed cases to a reasoning-tier judge.
  4. **Recalibrate** the judge whenever the authoring model tier or content category (JA→es, N5→N4, kanji steps) changes.
  - Caveat (from adversarial verification): these results come from RL-training and adversarial-safety settings; transfer to one-shot rubric gating is analogical but the mechanisms (plausibility scoring, distribution shift) plausibly carry.

## Finding 3 — Tiered context beats long context; length folklore is refuted (MEDIUM-HIGH)

- **Refuted in verification (0-3 votes): all specific numeric CLAUDE.md folklore** ("80–120 lines", "~150–200 instruction slots"). No verified quantitative length-vs-adherence threshold exists. Do not cite or chase these numbers.
- What IS corroborated: effective attention degrades well before the context window fills, with weak attention to mid-context content (Chroma "Context Rot" study, 18 models, July 2025; secondary: https://hidekazu-konishi.com/entry/ai_agent_memory_design_guide.html).
- Emerging "harness engineering" pattern: three-tier context — (a) small stable identity/contract layer, (b) persistent external memory injected via retrieval per task, (c) session working memory — maximizing signal-to-noise ("cognitive density") of what the agent actually reasons over. Validated-writeback / typed external state for agent memory is peer-reviewed (ClawVM, EuroMLSys '26, ACM DOI, repo `mpi-dsg/clawvm`).
  - Sources: https://arxiv.org/pdf/2604.11548 (SemaClaw — company-affiliated, personal-agent domain; generalization to coding agents is ours) · https://arxiv.org/pdf/2604.10352 · https://dl.acm.org/doi/10.1145/3805621.3807648
- **Lingle mapping:** don't "shorten CLAUDE.md to a target number." Instead:
  1. Split `lesson-authoring-guide.md` (8,600 words, 56 sections) into a **small pinned invariant core** (goes in every dispatch, per Finding 1) + **per-step-type / per-course modules** injected selectively per dispatch.
  2. Treat the 158-doc / 256k-word corpus as retrieval material, not context material — briefs should link, dispatches should inject only the relevant module.
  3. Put load-bearing rules at the **start or end** of injected context, never mid-document.

## Finding 4 — Eval synthesis for content CI: watch, don't adopt (MEDIUM)

- TaskEval (Dec 2025) synthesizes task-specific evaluator programs (+ human-feedback UI) for FM tasks lacking metrics — the shape of "curriculum evals in CI" without hand-authoring rubrics per lesson type. Early-stage: self-reported 93%/90% accuracy on only two tasks, no independent validation.
  - Source: https://arxiv.org/pdf/2512.04442
- **Lingle mapping:** keep gates hand-built for now; revisit in a quarter.

## Known gap — multi-agent dispatch economics (NO claims survived verification)

Nothing on model-tier selection for authoring vs. review, token-cost-aware orchestration, or "small model + strong rubric beats big model" survived the adversarial panels — the literature is thin or didn't hold up. The closest verified signal cuts the other way: rubrics don't rescue weak **judges** (Finding 2). Current practice (Sonnet authors + strong briefs) has no verified evidence against it; the Haiku-**judge** choice does.

**Recommendation:** measure this empirically on our own gates — log per-dispatch token cost + human-QA pass rate per model tier; our data will beat the literature here.

---

## Ranked adoption list

1. **Constraint pinning in every dispatch** — cheapest change; directly targets the observed regression pattern. (Finding 1)
2. **Harden Gate 10**: reference-grounded, solve-then-compare, human-label calibration set from Spencer's past QA verdicts, escalation path from Haiku to a reasoning judge; recalibrate on model/content shifts. (Finding 2)
3. **Tier the doc stack**: pinned invariant core extracted from the authoring guide + selective per-dispatch modules; corpus becomes retrieval material. (Finding 3)
4. **Instrument dispatch economics** (token cost × QA pass rate per tier) — fill the literature gap with our own data.
5. **Eval synthesis**: revisit later. (Finding 4)

## Suggested QA test for these changes

- Re-run the known regression set (m8-6-1 furigana case, romaji leak, plain-form distractors, TTS-skip flow) through the hardened Gate 10 with and without reference grounding + solve-then-compare, and compare judge verdicts against Spencer's recorded verdicts. Success = the hardened judge catches what Spencer caught, before Spencer sees it.

## Caveats

Most sources are Mar–Jul 2026 preprints; several findings rest on single primary papers (SemaClaw, TaskEval, the self-play reward-hacking paper) without independent replication. Judge-reliability results are from RL/adversarial-safety domains — transfer to content gating is analogical. The context-rot attention claim traces to a vendor study (Chroma) plus secondary sources. Field is moving fast; revisit within months.
