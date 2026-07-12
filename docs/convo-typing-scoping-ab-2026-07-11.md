# AI Conversation + Typing lesson types — consolidated scope & A/B plan

**Date:** 2026-07-11 · **Status:** scoping pass (no build committed)
**Sources:** `local-conversation-llm-recon-2026-07-05.md` (the deep spec), `research/duolingo-vs-lingo-gap-analysis.md` §3/§3b, `superpowers/specs/2026-05-14-japanese-followups.md` §4, `conjugation-trainer-recon-2026-07-02.md` §input-methods, plus today's competitor exercise-type survey (multi-language scoping pass).

---

## 1. AI conversation partner — where the plan stands

The 2026-07-05 recon is effectively a v0 build spec already. Locked: LFM2.5-1.2B-JP (Q4) on llama.cpp Vulkan on the beast; post-hoc **validate-and-repair** gate (fugashi+UniDic lemma check against `getUnlockedAtomIds()` + conjugation-engine surface forms + kanji→kana downgrade, ≤2 retries then canned fallback); VOICEVOX Nemo TTS; `POST /api/core/v1/converse`; 3 scenario templates; 2-day build plan with go/no-go metrics (first-pass gate rate >70%, fallback <10%, p95 audio <3s).

**New signal from today's competitor survey:** AI roleplay is now table stakes (Duolingo Max Roleplay/Video Call, Busuu Conversations, Memrise MemBot) — but **none of them constrain the partner to the learner's known vocabulary.** Our comprehensibility-gated partner ("literally cannot speak above your level") stays the differentiator, and it's the same authoring law (the gate) the whole course already runs on. Also relevant: the multi-language scoping pass found every candidate language needs its own analyzer for the gate (jieba for zh, CAMeL for ar, pymorphy for ru…) — so keep the converse validator behind a per-language interface from day 1, even though v0 is JA-only.

**Recommendations on the recon's open questions** (Spencer decides; these are defaults to unblock):

| # | Question | Recommendation |
|---|---|---|
| 2 | LFM license (<$10M rev cap) vs MIT Sarashina | Ship v0 on LFM (cap is irrelevant pre-revenue); note renegotiation trigger in ECONOMICS.md |
| 4 | Whitelist tier | Default **unlocked**; "mastered-only" as a user toggle (pure-review mode) — also an A/B arm (§3) |
| 5 | Scenario authoring | Frontier-model-drafted, hand-edited, gate-validated — same pipeline as lesson authoring |
| 6 | Where it lives | `/practice/conversation` tile, gated module ≥5 (vocab too thin below); module-capstone integration is an A/B arm, not the default |
| 7 | Hosting | Beast-only for alpha; revisit only if go/no-go metrics pass |

**Remaining to close before build:** none blocking — the v0 plan is executable as written. Suggested addition to the eval: log which atoms the *learner* produces per session (unique-atom production breadth becomes the feature's north-star metric and feeds FSRS production evidence later).

## 2. Typing — where the plan stands

Typing already half-exists: `translate` ships as a plain `<input>` assuming an OS IME. The prospective work is a **three-rung production ladder**, all documented, none built:

1. **WanaKana romaji→kana compose** on `TranslateStepView` (`wanakana.bind`, `useIme` flag, ~12 kB MIT dep). Implementation-ready per the 2026-05-14 mini-spec. Days, not weeks.
2. **On-screen keyboard primitive** (`shared/components/`, layout JSON + compose engine): JA 3×3 flick grid (teaches gojūon as a side effect) + romaji-compose mode; KO 2-set 두벌식 later (jamo→block composition teaches hangul construction — dovetails with the Korean scaling report's sound-change trainer). Feature-flagged input mode on existing typing steps first, own step type only if needed.
3. **"Mastery mode"** lesson toggle: swaps build_sentence → typed production on production steps. This is the "hard mode" Duolingo labels but doesn't really ship for JA (their web has no JA typing at all — still true in the 07-07 survey).

**Grading scope for v0:** final-string correctness only (existing `normalizeTypedAnswer` + kana equivalence). Composition-error feedback (wrong flick, wrong jamo order) is v2; it needs keystroke logging that the A/B tests below want anyway.

**FSRS note:** typed production should grade the `production` modality with more evidence-weight than tap-token — decide the multiplier when wiring, and keep it consistent with the conjugation trainer's cheat-sheet-peek = half-credit precedent.

## 3. A/B test designs

Pre-launch reality: "A/B" = feature-flag cohorts (`public/feature-flags.json` + a cohort field in user settings) playtested by Spencer/alpha users now, with metrics defined so the same flags become real experiments at launch. All metrics are computable from existing stores (FSRS state, lesson sync events, session telemetry) — no new analytics infra except an experiment-assignment field.

**T1 — Typed production dose (the big one).**
Hypothesis: replacing a fraction of tap-token production steps with typed (WanaKana) steps improves production-modality retention at acceptable friction.
Arms: 0% typed (control) / 30% / 60% on M5+ production steps.
Metrics: production FSRS lapse rate on drilled atoms at 7d/30d; median time-per-step; mid-lesson X-out rate; "show answer" usage.
Kill signal: X-out rate +50% over control without retention gain.

**T2 — Flick grid vs romaji-compose.**
Within typed steps, which input mode?
Metrics: input time, correction count (backspaces), opt-out toggles, and the transfer effect — kana accuracy in symbol drills for flick users (flick should reinforce gojūon geometry).

**T3 — Convo whitelist tier (unlocked vs i+1).**
Arm A: partner limited to unlocked atoms. Arm B: partner may introduce ≤2 new glossed words per session (i+1).
Metrics: turns/session, session return rate within 7d, and whether i+1 words survive — pickup rate into SRS and 7d retention. This tests the core pedagogy bet (strict comprehensibility vs slight stretch).

**T4 — Convo placement (tile vs capstone).**
Arm A: `/practice/conversation` tile. Arm B: scenario offered as an optional capstone after finishing a matching module (food scenario after the food module).
Metrics: uptake %, completion %, next-module test-out score delta.

**T5 — Voiced vs text-only partner.**
VOICEVOX replies on/off. Metrics: session length, perceived difficulty (1-tap post-session rating), listening-comprehension step accuracy trend over the following week; also validates whether the p95 <3s audio latency target actually holds under conversation pacing.

**T6 — Mastery-mode discovery.**
Settings toggle (control) vs end-of-lesson prompt ("Replay in hard mode?") vs lesson-list badge.
Metric: adoption and week-2 persistence of typed-mode usage. (Duolingo's "Legendary" replay pattern from the competitor survey suggests the prompt arm wins; verify.)

**Sequencing recommendation:** T1/T2 need only rung 1-2 of the typing ladder — cheapest to start. T3/T5 ride the convo v0 eval harness that the recon already specifies. T4/T6 are launch-era tests.
