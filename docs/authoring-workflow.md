# JA authoring workflow (MANDATORY — 2026-07-20)

**Status:** LIVE · **Last-verified:** 2026-07-20

Spencer 2026-07-20: agents ship contradictions "every single time" because
they start without the full picture and self-check only after. This is the
process that fixes it. Every module-authoring dispatch MUST follow it.

## Before authoring (context, not blind)
1. Generate the module's context pack:
   `node scripts/authoring-context.mjs m<N> > docs/context/m<N>-context.md`
   Read it fully. It lists — from the live registry — every word/verb the
   learner already knows, the grammar taught so far, this module's new
   allocation, under-reinforced words to prefer as carriers, at-level
   example sentences (style + review-avoid), principled distractor sets,
   character canon, register, and the hard rules.
2. Read `docs/authoring-invariants-pinned.md` (all invariants) and the
   module's spec (`docs/m<N>-neo-authoring-spec-*.md`).
3. Read the exemplar file (m4-neo-a.ts / m5-neo-a.ts) for factory usage.

## While authoring (self-check per lesson, NOT at the end)
After drafting EACH lesson, before the next:
- Tokenize every Japanese surface: is each word in the context pack's
  "already knows" list or this module's allocation? If not — STOP, fix.
- Does any sentence contradict character canon or an earlier lesson's
  stated facts? Verbs take no だ; deixis matches the English target.
- Run the guard suite on the lessons drafted SO FAR (throwaway test →
  `registerModuleBarGuards({...requireCapstone, requireImageFirst})`),
  fix failures immediately, then continue. Contradictions surface AS they
  happen — the whole point.

## After authoring
`npm run module-gate -- m<N>-neo` (scoped tests → TTS coverage → tsc →
FULL-suite CI parity → exposure audit). Then wire (mockLessons/mockCourse/
barrel/module test/render-gate), regenerate TTS, and run the visual
capture + ONE continuity judge (give the judge the context pack too).

## Why SEQUENTIAL (Spencer 2026-07-20)
Author modules strictly in course order (m4 → m5 → m6 …), never fan
several modules out in parallel. The context pack is built from the REAL
prior state, so each module inherits an exact, complete picture of what
the learner knows and needs next — the understanding gets *stronger* as
the course grows, which is the whole point. The pack gets longer with it;
that is an accepted, cheap cost (read-once context). Intra-module the two
half-agents share ONE pack and de-conflict against each other's file;
that is the only parallelism, and only because both halves see the same
prior state.

**Scaling watch-item:** past ~m12 the "already knows" list will run long.
When a vocab category exceeds ~40 items, group it by semantic domain (or
show counts + only the NEW and under-reinforced words in full) so the pack
stays digestible. The generator should grow a grouping threshold before
then — not yet needed (m6 pack = 248 lines).

## Why this works
Every past defect class is now either a machine guard (fails the
throwaway test the agent runs per-lesson) or a line in the context pack
the agent reads before starting. The post-hoc walk shrinks to spot-checks.
