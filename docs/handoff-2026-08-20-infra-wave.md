# Handoff — audit + infra wave (2026-08-20, fable session)

**Status:** LANDED (7 commits on main, unpushed) + a queue. Companion to the
concurrent restamp session's R1 landing commits, which interleave with these.

## Landed, all verified before commit

- `926335cd` **FR m1 stack + step-engine closure** — HEAD builds in a fresh
  checkout again. The approved four paths were NOT enough: the FR tree needs
  the new-step-type wave (6 step views + tests, `LessonStep` union,
  StepRenderer/catalog registrations, `mcqDistractorLint`). Proven in a clean
  worktree: HEAD + exactly these 91 files → tsc clean, 10,027 tests green.
- `59087417` **test/authoring perf** (measured, before/after in the message):
  vitest two-project split (`curriculum` = src/features/languages with
  `isolate:false`, `app` = rest, isolated — global no-isolate breaks 53 UI
  tests, don't); module-gate incremental tsc (`.tsbuildinfo-gate`, 12s→1.7s);
  module-gate stage-1 filter now covers BOTH test layouts (m3–m12 beside
  modules, m13+ in `__tests__/` — a 0.3s stage-1 FAIL means dead filter, not
  broken content); context packs group past 40 items/category (m30 pack
  703→317 lines, zero words dropped).
- `15adf45f` **F5 accentPolicy** — protected-form INVENTORY, not a
  lenient/strict switch: five FR pairs on `frModule.accentPolicy`,
  `gradeTypedAnswer` refuses to fold across them both directions, ordinary
  accents stay lenient-with-nudge, threaded via total `accentPolicyFor()` in
  TranslateStepView. TDD, 15 new tests. Typed minimal-pair steps now
  authorable (F5 pin updated same commit). Also landed the stranded 08-18
  U+2019 apostrophe fold.
- `7653d8b1` full-read catch-rate logging rule (authoring-workflow.md).
- `87fc366e` **classify.mjs fix + qwen3.5-122B back-tests** (see below).

## qwen3.5:122b-a10b-q4_K_M — installed, back-tested, division of labour

Full numbers in `scripts/draft/README.md` §2026-08-20. Short form:
classification 25/13 errors vs the 4B's 58/25; visual screening recall 8/8
(corrupted-oracle, 16 real captures) with 4/8 cheap FPs; gloss repair 11/12
with zero false corrections. **4B still drafts; 122B is the local
judge/classifier; frontier audits the 122B.** New trap on the pile: an enum
in the `format` schema is not a category list in the prompt — schema
constrains structure, the prompt must carry meaning.

## Queue (in order)

1. **Shadow run** of the local visual judge: next module wave, run
   `scripts/draft/judge-visual.mjs` (harness) over the same captures haiku
   screens, compare verdicts, THEN decide the switchover. Case-builder
   pattern: `scripts/draft/judge-cases-2026-08-20.json`.
2. ~~Dialogue speaker roster generalization~~ — **SEAM DONE 2026-08-20**:
   `dialogueVoices` capability on LanguageModule (ja declares roster +
   `ja-keita`), `langForSpeaker(speaker, languageId)` resolves via registry,
   both dialogue views thread the context language. A ja male name no longer
   routes for es/fr (the leak, pinned by a test). Component tests mock the
   registry (the real graph is heavyweight); the REAL roster stays pinned by
   `dialogueSpeakerRegistry.test.ts`. Still open, deliberately: ES/FR
   male-voice CLIPS (needs TTS pipeline voices + re-authored dialogue
   content) — a content-wave item, after which es/fr declare the capability.
3. **dynamicReviewPrefix `!== "ja"`** — investigate what Track A/B state
   exists per-language before generalizing; may block on ES re-author
   conventions. Do not guess; read `dynamicReviewPrefix.ts:117` context first.
4. Haiku→local switchover decision after (1); m17–m19 dialogue voice clips
   after ES re-author reaches them.

## Decisions in force (Spencer 2026-08-20)

- FR commit stack: approved, landed, **no push yet**.
- 2b leaks: **generalize the learner-facing core** (placement ✅ was already
  done 08-19; typed grading ✅ this wave; dialogue voices + review prefix
  queued) — grammar SRS and translate variants stay ja-only for now.
