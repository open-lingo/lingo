# HANDOFF — ES pre-authoring pass + build alternates, 2026-09-06

**Purpose:** resume point for the next Spanish authoring session. Read this,
then `docs/handoff-2026-09-02-es-m11-m15.md` (the m11–m15 wave records and
the five-agent recipe), then the backlog items named below.

## State at hand-off

- **ES m1–m15 and FR m1–m10 live**; everything from this session is committed
  and deployed in one commit (see git log for "build alternates").
- Spencer's decisions this session:
  1. *"authoring as many easy listed alternatives as we can, maybe max of 3"*
     — hand-listed build alternates, cap 3, grow from tester reports; no
     Spanish variant generator.
  2. *"lets work on spanish further authoring and then end A1 wherever you
     need to and continue to the next"* — the A1 boundary is MINE to place;
     the pinned invariants' "sixteen modules, m1–m16" is not binding.
  3. Ship to prod now, then pause.

## What shipped (all verified: preflight 512 files / 12,408 tests, tsc clean)

| thing | where |
|---|---|
| 3-lane build grading (exact → JA variants → `alsoAccepted`) | `src/features/lesson/components/steps/buildAcceptance.ts` (+ unit tests) |
| optional `alsoAccepted?: string[]` on `build_sentence`; ES/FR `build()` 7th arg; IR key `also:` | `types.ts`, `es/grammarHelpers.ts`, `fr/grammarHelpers.ts`, `scripts/draft/es-ir/assemble.mjs` |
| whole-tile cover lint (multi-word tiles, punctuation-fused edge tiles) | `lintAlsoAccepted` / `coverWithTiles`; ES + FR `moduleContentLints` |
| 47 ES alternates on 44 builds; 10 FR alternates on 10 builds | IR `also:` lines m3–m15; `build()` args in es m1/m2 and fr m1–m10 |
| course-wide "every atom earns an ANSWER position" pin (ES via `registerEsAtomUsagePin`, FR via content lints) | found + fixed: «cero», «señor», «zéro», «café», «monsieur», «madame», «maison» (new printed speaking steps; clips existed) |
| emoji-refit decisions ported from compiled TS into the IR | m4/m5/m7/m9/m10 IR headers, m7/m9 audioWimcq «hasta luego» 🚶 |
| door-emoji collision (m1 sim scene 🚪 → 🚶); `sentenceMcq` 2-distractor crash → clear error | m1.ts, es/grammarHelpers.ts |
| tester doc corrected (word order "mostly strict"; extra tile = distractor floor) | `docs/es-tester-handoff-2026-09-02.md` |
| authoring rules for alternates | `docs/es-lesson-authoring-guide.md` §14, `docs/fr-authoring-playbook.md` |

Cross-language regression proof: acceptance snapshot of every build step
(ja 3,676 / ko 134 / es 332 / fr 110) before vs after — 0 non-additive
changes, exactly 44 ES steps gained alternates. Harness was temporary; rebuild
from `acceptedBuildSurfaces` if the lanes change.

## Findings worth re-reading before touching ES again

- **Compiled TS drifts from IR** (B113): recompile the untouched module and
  read the diff BEFORE editing its IR. Memory: `es-compiled-ts-drift`.
- **Runtime build banks ≠ source banks**: `padBuildTileFloor` adds one
  prior-vocab tile per build (deliberate, seeded). Author-time checks read
  the SOURCE bank.
- **`hacer.introducedAtModule = 16`** (B112): from m16 every hacer form is
  "prior". The m16 brief must say what to do with hacer.
- Test-outs are healthy: 12 items, pass at 10/12, ~half production. Mikey's
  comfortable passes are not a leaky test.

## NEXT (in order)

1. **B111 — the conjugation walk.** Recommend Spencer walks m14 (~20 min,
   `/es/qa/m14`, `?step=K` 0-indexed) before m16 is briefed; ledger every
   failure. If he prefers to author first, proceed and schedule the walk.
2. **Decide the A1 boundary** (Spencer delegated it). Proposal: A1 ends at
   **m18** — m16 «Lo veo» direct-object pronouns, m17 «Me levanto»
   reflexives / daily routine (re-spends m14 stem changes), m18 a non-verb
   breather + A1 capstone (shopping/ordering/directions consolidation, zero
   new grammar). A2 opens at m19 with the preterite (the pinned ramp's last
   rung: stem changes → irregular presents → object pronouns → past pair).
   Retire the "sixteen modules" sentence in `es-authoring-invariants-pinned.md`
   when the decision is written.
3. **m16 wave**: same five-agent recipe as m11–m15 (header + placement block
   + carrier allowlist + scratchpad prefixes per author; assembler is zsh;
   re-check lesson mtimes vs assembled IR). Brief must include: the hacer
   ruling (B112), the billed/unbilled slot table (memory
   `es-which-slots-are-billed`), inv 24 as a hard rule, pin E2, `also:` with
   the §14 rules, and "verify every claim in this brief against source".
4. **B109 KO alternates** and **B110 audioWimcq target validation** when a
   slot opens; B114 is a note for the mobile session.

## Commands

```
npx vitest run src/features/languages/es      # ES gate
node scripts/compile-ir-es.mjs mNN            # IR → TS (recompile untouched first, diff must be empty)
npm run preflight                             # before ANY push
node scripts/backlog.mjs --id B111            # the open decision
```
