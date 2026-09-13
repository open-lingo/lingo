# Local-model sentence drafting for ES/FR/KO — a proposal (2026-09-13)

**Status:** PROPOSAL ONLY — no code changed by this document.

The mechanism (`scripts/draft/`) is real and proven: JA's slot-filling
harness hit 12/12 grammatical, free, and ES built its own version —
`frames-es.mjs`, `morph-es.mjs` (cross-checked against the app's own
`conjugationTables.ts`), `frames-es-m18.mjs`, `frames-es-m19.mjs`,
`frames-es-a2.mjs` — and `compile-ir-es.mjs` already wires a named frame in
through `ir.frame`/`ir.frameFile` (lines 88–228). But `m8.ir.yaml`,
`m18.ir.yaml`, `m19.ir.yaml` all ship `frame: none` — the frames were built
and never plugged in. Every m17–m38 module was drafted the frameless way:
Sonnet subagents write literal Spanish sentences straight into the IR
YAML, at ~750k of the ~1.3M-token m20 cost
(`docs/handoff-2026-09-09-es-m20-done-ko-next.md` lines 51–64).

## Which IR beat kinds are formulaic enough

Formulaic = a fixed lexical frame (subject + regular verb + bounded
object/adverb pool) where grammar is guaranteed by code, not sampled.

- **ES** — regular-paradigm modules: -ar/-er/-ir present, preterite,
  imperfect conjugation drills; any module whose payload is "N verbs × M
  persons × an object pool" (the m8/m11/m17-class shape). **Not**
  formulaic: `dialogue_sim` NPC banter (needs personality/register
  judgment), `info` card claims (must be exactly, not plausibly, true),
  irregular-verb showcase sentences, and frameless lexicon-break modules
  like m34/m36 (five bespoke image-MCQ nouns — no sentence to draft at
  all; these get zero benefit from this proposal).
- **FR** — same shape once built: -er/-ir/-re regular present is the
  first candidate (mirrors m11's "la machine à verbes" checkpoint).
  Currently **zero infrastructure** — `fr-ir/assemble.mjs`'s own header:
  "French has no frames, no drafted pools and no morphology module yet."
- **KO** — conjugation-drill sentences, once buildable. KO already has
  `conjugationEngine.ts`/`conjugationTables.ts` (ahead of FR there), but
  has **no IR pipeline at all** — `compile-ir-ko.mjs` doesn't exist
  (`docs/ko-authoring-infra-gap-2026-08-26.md` punch-list item 6, "L,
  blocks scale"). Slot-filling needs the IR pipeline first; it is not
  itself a shortcut to building one.

## What a frame needs per module

Per `scripts/draft/README.md`'s own contract: `slots` (the JSON schema),
`rules` (prompt lines a combination must satisfy), `build(pick)` →
`{lang, en}` via the language's morph module (never string concatenation
for an inflecting language), `check(pick)` (residual complaints, never
grammar), and `vocabSurfaces()` so `assertFrameVocabIsTaught()` runs
before a token is spent. FR/KO additionally need a `morph-<lang>.mjs`
(conjugation as code, not sampled) and its own `verify-morph.mjs`
cross-check against the app's live conjugation tables — skipping this was
costly for ES: "two sources of truth that silently disagree is worse than
one that is wrong" (first run found 15 mismatches, all a parser bug, not
the data — checked before believed).

## Command sequence a coordinator would run (ES, ready today)

```bash
# 1. inventory the module's taught vocabulary
node scripts/draft/inventory-es.mjs mN

# 2. draft a slot-filled pool locally — free, ~35s, coverage mode
node scripts/draft/draft.mjs es-a2:mN --duty 0.8 --cover --merge

# 3. verify grammar + taught-vocab-only BEFORE any token is spent on it
node scripts/draft/frames-es.mjs         # assertFrameVocabIsTaught
node scripts/draft/tmr.mjs drafts/es-mN.json mN   # Token Miss Rate

# 4. hand the pool (not the final IR) to the Sonnet drafting agent as
#    INPUT material — the agent selects/adapts into the brief's actual
#    lesson shapes and writes the IR fragment, then runs check-frag.sh
#    exactly as today. The agent's job shrinks from "invent grammatical
#    Spanish" to "pick good pairings and place them" — the first is what
#    the pool now does for free.
```

For FR/KO this sequence is blocked until the module-level prerequisites
above exist; the sequence itself would look identical once they do.

## Estimated token saving per module

Grounded in m20: ~750k of ~1.3M tokens is drafting across 5 agents
(117k–208k each). The pool doesn't eliminate that stage, it changes its
job — from composing grammatical Spanish to selecting from an
already-grammatical, already-taught-vocab-only pool and placing it into
lesson shapes. No A/B has measured the fraction yet (the ES m8 pilot was
partial). A defensible estimate: **15–30% of the ~750k drafting cost**
(≈115k–225k tokens/module) for modules that are majority formula-shaped
(the m8/m11 class), scaling to **~0%** for frameless lexicon-break modules
like m34–m38, most of the recent ES wave. A narrower lever than items 1–3
(those apply to every module; this only to the paradigm-shaped minority).

## Two biggest risks

1. **Pool-curation overhead can eat the saving.** Free-form drafting at
   ES m17 produced "84 unique sentences covering 13 of the 78 cells
   needed" — 65 fell through to frame-fill, meaning the model contributed
   almost nothing despite a healthy-looking pool. `--cover` mode fixes
   yield, but a coordinator who hands a low-yield pool to a drafting agent
   has spent tokens explaining a pool the agent then ignores — net
   negative. Mandate `--cover`, never free-form, and report the frame-fill
   rate so a bad pool is visible, not silently absorbed.
2. **FR/KO have real, non-trivial prerequisite work, not a config flag.**
   FR needs `morph-fr.mjs` + `frames-fr.mjs` + a `verify-morph-fr.mjs`
   cross-check (ES's build found a genuine bug class this way —
   -car/-gar/-zar stem changes, `ver`'s reverse-accent rule — FR has its
   own such set, e.g. -er/-ir/-re irregularities, a rushed build would
   miss). KO needs the IR pipeline itself first (punch-list item 6,
   "blocks scale," independently estimated **L**). Building either without
   a committed multi-module amortization plan risks spending more
   engineering tokens than the drafting savings recover — a
   build-once-amortize-many lever, not a per-module win — and should be
   sequenced after each language's own higher-priority blockers (KO:
   pinned invariants + guide, quality gates, factory parity — punch-list
   items 1–3 — land first regardless).
