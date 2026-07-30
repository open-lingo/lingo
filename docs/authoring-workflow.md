# JA authoring workflow (MANDATORY — 2026-07-20)

**Status:** LIVE · **Last-verified:** 2026-07-26

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

## The OLD course is OFF-LIMITS (Spencer 2026-07-20 — "the old tags are ruining us")

**Planning vs. authoring (Spencer 2026-07-26 — the cemented split):** the old
course is legitimate REFERENCE MATERIAL FOR PLANNING — spine sequencing, N5
coverage checks, "what did we used to teach here", gap-hunting. Spencer and
planning/research agents may read it freely. **Authoring agents are NEVER
exposed to it.** An authoring dispatch's inputs are the generated context pack,
the pinned invariants, the module spec, and the neo exemplar files — nothing
else. Old-course material reaches a neo module only after a human or planning
pass has RE-DERIVED it into the spine or the module spec; it never travels
directly into an authoring prompt. This is why old-course review pools
(`AUTHORED_GRAMMAR_POOLS` and friends) must not be wired into neo review
surfaces: they are polite-register old-course content, and every path that
lets them reach a neo learner is the いくら/えん leak in a new costume.

**ARCHIVED 2026-07-26.** The old modules now live in
`src/features/languages/ja/curriculum/_archive/` (see its README), excluded
from tsconfig and the test run. Nothing in `src/` imports them. This is no
longer a discipline anyone has to remember — it is enforced by the build.

While authoring a neo module, treat the old course as if it doesn't exist:
- NEVER open a bare old-course curriculum file (`m5.ts`, `m6.ts` … `m28.ts`)
  to copy content or check "what's taught." Only the `m*-neo*.ts` files and
  the generated context pack describe the new course.
- NEVER trust an atom's `fromModule` tag or `introducedByLessonId` — those are
  OLD-course provenance, stale and wrong for the neo sequence (that's how
  いくら/えん/いらっしゃいませ leaked into m5). A word is "known" ONLY if a
  PRIOR NEO module introduced it via an intro-capable step; the context pack's
  "already knows" list is the single source of truth, and the teach-first
  guard (invariant 33) enforces it.
- When a neo module reuses an old atom, re-stamp its provenance to the neo
  intro (or rely on neo-usage derivation) — never author as if the old tag
  were the truth.

## While authoring (self-check per lesson, NOT at the end)
After drafting EACH lesson, before the next:
- **RE-READ `authoring-invariants-pinned.md` FIRST — every lesson, not once
  per module** (Spencer 2026-07-26, pinned as invariant 47). Reading it at
  the top of the dispatch is NOT enough and never has been: the m7–m10 cycle
  shipped 38 bare-word debuts and 58 translate-heavy lessons from agents that
  had the full block in their prompt. Compliance decays with distance from
  the text (research doc Finding 1, ~8× for soft rules). At minimum re-read
  inv 5, 28–33, 37–42, 43–46 before emitting the next lesson's beats. If
  that feels redundant, it is working — the cost is seconds, the failure mode
  is a module Spencer has to walk twice.
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

## Bulk conformance audit (Spencer 2026-07-26 — the backstop)

Per-lesson re-reading raises compliance; it does not guarantee it. So the
mechanical half of the law is also checked in BULK over compiled output,
across every module at once, independent of whoever authored it:
`npm run authoring-audit` (→ `vitest run src/features/lesson/dev/authoringAudit.emit.test.ts`; there is no `scripts/authoring-audit.mjs` — this line pointed at that nonexistent file until 2026-07-29).

It reports per module and course-wide, and its job is to catch a rule being
ignored *repeatedly* — the pattern a single module's test run can't see:
- translate share of production vs. the 15% ceiling (inv 43)
- step-type histogram vs. the usage floors (inv 45), naming types with
  material available but zero uses
- `word_image_mcq` reuse — any word imaged more than once (inv 44)
- debuts landing on non-intro step types (inv 30/33/37)
- `particle_cloze` outside its introducing module (inv 5)
- single-tile builds and build-tile distractor floors (inv 35)

Two rules for it: the audit is a BACKSTOP, never a substitute for the
per-lesson re-read; and when it flags the same invariant in three or more
modules, the defect is the GUIDE (or the compiler), not the author — fix it
upstream instead of patching modules one at a time. That is the loop that
stops Spencer re-reporting the same finding.

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

## Keeping the law honest (added 2026-07-20 after the doc-audit)
The pinned invariants doc is pasted VERBATIM into every dispatch, so if it
drifts from shipped reality it poisons every agent at once — exactly how
`authoring-invariants-pinned.md` §Register rule 7 kept asserting "M3–M28 is
polite-form" for a full day after m4/m5 shipped plain-form. Guardrails:
- **Reconcile before dispatch.** When a rewrite decision changes a pinned
  rule, edit `authoring-invariants-pinned.md` in the SAME commit as the code
  — the law and the shipped module move together, never a day apart.
- **The doc-staleness sweep is a periodic step, not a one-off.** Re-run it
  each time a wave lands in code (register/script-ladder/kanji changes):
  orientation docs (`CLAUDE.md`, `PROJECT_STATE.md`, the pinned invariants,
  the emoji/kanji specs) drift silently and agents follow them believing
  they comply. The 2026-07-20 sweep is logged in `retrospective-2026-07-17.md`.
- **Candidate guard (queued):** a machine check that no rewritten module
  ships です/ます as a PRODUCTION target (rule 7's enforceable core), to sit
  alongside the moduleBarGuards register cues — build it in the m6 cycle.
