# ES m23 «Cuando, mientras, de repente» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m23-L<n>.yaml` files.

**Worktree note (new):** this brief may be drafted from a git worktree, not
the main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh`
all default to the MAIN checkout path if `LINGO_ROOT` is unset — in a
worktree that silently writes to the wrong tree. Before running ANY script
below: `export LINGO_ROOT=$PWD` (from the repo root of whichever checkout
you are actually in).

## The decision this module resolves

`docs/es-ir-sources/m22-header.yaml` named this module directly: "the
preterite-vs-imperfect contrast is m23's job, not this module's." That is
now RESOLVED: **m23 teaches preterite and imperfect in the SAME sentence —
which clause is the ongoing scene (imperfect) and which is the one bounded
thing that happened inside it (preterite) — using four new connectives
(«cuando», «mientras», «de repente», «entonces») and ZERO new verb
morphology.** Full reasoning, the four atoms' individual jobs, and the
central «fue vs era / fue vs iba» collision this module teaches are in
`m23-header.yaml`'s comment block — read it, it is not decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m23-header.yaml` — the module spine + the 4 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word.
- Exemplars (copy their shape exactly): `m22-L1.yaml`/`m21-L1.yaml` (opening
  teaching lesson, step shape, info-card shape for a general rule), `m21-
  L9.yaml`/`m22-L9.yaml` (consolidation — your L9's analogue), `m20-L2.yaml`
  (a "dual-reading, no new atoms" lesson — your L5–L7's shape: recombination
  with zero new atoms, same technique m21-L2 used for hablamos/vivimos's
  past reading), `m21-L7.yaml`/`m22-L7.yaml` (questions/negation — L7),
  `m21-L8.yaml`/`m22-L8.yaml` (checkpoint), `m21-L10.yaml`/`m22-L10.yaml`
  (mastery).
- Your output: `m23-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m23 <tag> docs/es-ir-sources/m23-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`.
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (besides the 4 new atoms)
Every atom of m1–m22 is PRIOR. Grep to check a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..22}.ts | sort -u | grep -i "<word>"`.
**Imperfect is restricted to hablar/tener/ser/ir/ver (m22) — all persons:**
hablaba/hablabas/hablábamos/hablaban, tenía/tenías/teníamos/tenían, era/
eras/éramos/eran, iba/ibas/íbamos/iban, veía/veías/veíamos/veían.
**Preterite is open — all of m19 (26 regular singulars), m20 (21 irregular
singulars), m21 (21 plurals) are fair game, any person, any lesson.**
**PRIOR time/frame markers:** de niño/a/s (m22, imperfect clause only),
siempre, todos los días, ya, todavía (m16 — legal here, not this module's
content), ayer, anoche, la semana pasada, el mes pasado, el fin de semana,
hoy, mañana (these six still mark ONE clause each per m21/m22's rule — a
preterite-shaped marker never sits in the same clause as an imperfect verb,
and hoy/mañana never sit with a preterite verb — but in a MIXED sentence
they may now appear in their OWN clause alongside the other tense's clause:
"mientras hablábamos, ayer vino Diego" is fine — «ayer» sits with «vino»,
not with «hablábamos»).
**PRIOR places/nouns with emoji:** la escuela 🏫, el parque 🌳, la playa 🏖️,
el museo 🏛️, el cine 🎬, la fiesta 🎉, el mercado 🛒, la tienda 🏪, casa 🏠,
el trabajo 💼. **Other useful PRIOR** (grep to confirm/extend): la película,
el amigo, hermano/hermana, madre, abuela, familia, México, España, mucho,
muy, bueno/buena, temprano, aquí, juntos, todos (m21, 3rd-plural agreement
only, both tenses — see header). Function words as in m21/m22 briefs. Fixed
cast only: Ana, Diego, Sofía, María, Carmen, Sam, Luis. Never invent a name
or place beyond España/México.

### What this module does NOT teach
- **No new verb form, in either tense.** No «estaba/hacía/vivía/quería/
  podía/comía/salía/cocinaba/escribía/compraba/estudiaba/venía» (imperfect
  restricted to the 5 header verbs — see above); no unregistered preterite
  person/verb combination either.
- No progressive («estaba hablando» etc.) — pin E7, still banned.
- No new imageable noun, no new emoji, no imageMcq debut (precedent: m19,
  m21, m22 all shipped zero — pure-grammar modules).
- No causal subordination («porque») — not registered, out of this
  module's scope (a different grammar point; see Decisions inferred).

## Step kinds
Same vocabulary as m21/m22 (map, info, speakLit, buildLit, listenBuildLit,
listenCompLit, clozeLit, agreementLit, mcq/textMcq/imageMcq/audioWimcq,
matchLit, sim) — see `m22-L1.yaml` / `m21-L8.yaml` for exact fields, copy
the shape, don't re-derive it. imageMcq unused (no new emoji). Every
lesson ends sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. Each of the 4 new atoms' first appearance must be intro-capable (info,
   speakLit, buildLit, listenCompLit) in the lesson listed below; ≥3 answer
   positions there, and reuse it (≥1 answer position) in ≥2 later lessons —
   four atoms across ten lessons means spaced reuse carries more of this
   module's weight than debut does.
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a PRIOR
   noun with its emoji.
3. **Glosses are per-clause, not per-sentence.** A mixed sentence glosses
   its preterite clause as simple past and its imperfect clause as "used
   to ___" / "was/were ___-ing" — never flatten both clauses to one English
   tense. No internal `. ` `! ` `? ` inside a build `en`.
4. **The signature check, L6 onward: every `sim` step (not just the
   -sp-win line) must contain at least one imperfect verb form AND at
   least one preterite verb form**, across NPC lines or the learner's
   answer — this is the module's own version of m22's yo=él drilling
   requirement, and it is this module's bespoke test pin (see below).
5. **fue vs era, fue vs iba — never ask "was"/"went" without enough
   context to determine which.** A cloze/MCQ/build prompting an English
   "was" needs either an imperfect-forcing frame (an ongoing scene, no
   endpoint) or a preterite-forcing one (a single bounded event/verdict);
   same for "went". L6 is built entirely around this; use it elsewhere too.
6. Marker/tense agreement per clause (see PRIOR vocabulary above); «de
   niño/a/s» always frames the imperfect side of a mixed sentence. «todos»
   — 3rd-person-plural only, either tense, never a nosotros form.
7. «cuando» (new, no accent) vs «¿cuándo?» (PRIOR, m8, accented question)
   — never confuse the two; this module's «cuando» never appears in a
   question.
8. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
9. Sim distractors wrong by tense or person, never nonsense (m21/m22 rule
   11, unchanged) — a wrong option swapping fue for era/iba when only one
   fits the NPC's context is this module's version of that pattern.

## Homograph / ambiguity risks (name these explicitly to drafting agents)
- **era (imperfect, "I/he/she/you was") is NOT a noun for "era/age."** No
  such noun is registered; never write «la era» as a false-cognate item.
- **fue vs era (both "was"), fue vs iba (both "went")** — the module's
  central collision, see hard rule 5; the teaching point, not a bug — lean
  into it, especially in L6.
- **vi (yo, unambiguous) / vio (él, unambiguous) / veía (yo OR él,
  ambiguous — m22's yo=él collision)** — three related surfaces, three
  disambiguation needs. Never let «veía» stand subjectless.
- **hablamos (PRIOR m21, present-OR-preterite, needs a marker) is now a
  sibling of hablábamos (PRIOR m22, unambiguously imperfect)** — where the
  ambiguity would blur the contrast, prefer «hablé/habló/hablaron» or
  «hablábamos» over «hablamos».
- **tenía vs tuvo** — «tenía diez años» = "I was ten"; do not manufacture
  «tuvo diez años» ("turned ten") — a different idiom, out of scope.
- vino/vio/vi — visually adjacent, unrelated verbs; fine as an intentional
  wrong-by-verb-family sim distractor, never an accidental substitution.

## Grammar rule card budget
≤3 lines, must quote a course sentence (per CLAUDE.md's explanation budget).
L1's card states the module's ONE idea generally (later lessons don't
repeat it, same convention as m22's yo=él card). Suggested shape (adapt,
don't invent a longer one):
> Two pasts, two jobs. The ongoing one is imperfect — the scene. The one
> thing that happened in it is preterite — the event. «Cuando era niño, fui
> a México» — era sets the scene, fui is what happened.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atom owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Cuando era niño | cuando; general rule card here | era, fui, México | «cuando era niño, fui a México» |
| 2 | Mientras hablábamos | mientras | hablábamos, vino, Diego | «mientras hablábamos, vino Diego» |
| 3 | De repente | de repente | veíamos, la película 🎬, vino, Sofía | «veíamos una película, y de repente vino Sofía» |
| 4 | Entonces fuimos | entonces | de repente (recall), vino, fuimos, el parque 🌳 | «de repente vino Diego, entonces fuimos al parque» |
| 5 | Todos, cuando y mientras | none — plural/«todos» recombination across both tenses | fueron, la playa 🏖️, iba, el parque 🌳 | «cuando todos fueron a la playa, yo iba al parque» |
| 6 | Fue o era | none — THE minimal-pairs lesson (fue/era, fue/iba); ≥1 recall | la fiesta 🎉, buena, era, fue | «cuando era niño, la fiesta fue muy buena» |
| 7 | ¿Qué veías cuando…? | none — questions/negation across both tenses; ≥1 recall | veías, eras, no vi, hablaba, Sofía | «no vi a Diego, mientras hablaba con Sofía» |
| 8 | Checkpoint | graded only, all 4 atoms + fue/era/iba pairs; ≥2 recalls | — | «mientras todos hablaban, de repente vino Diego, y entonces fuimos al parque» |
| 9 | Consolidation | every connective + both tenses side by side; ≥1 recall | iba, la escuela 🏫, vi, Sam, hablé, Sofía | «cuando iba a la escuela, vi a Sam, y hablé con Sofía» |
| 10 | Mastery | Ana asks the group to narrate a memory; longest sim; no info; ≥2 recalls | de niños (PRIOR plural), íbamos, juntos, vino, fuimos | «de niños, íbamos a la escuela juntos cuando, de repente, vino Sofía, y entonces fuimos todos al parque» |

Every content word above not already flagged PRIOR in this brief is
grep-confirmed against m1–m22 by the method above. Recalls: L3+ may recall
L1/L2; L5+ may recall L1–L4; floor ≥6 recalls total (module has fewer new
atoms than m19–m22, so recall carries more of the spaced-practice load —
put ≥1 in L3–L7 and L9, ≥2 in L8/L10, per the table).

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m23-placement.yaml` (same shape as
   `m22-placement.yaml`: a `screener` entry + 3–4 `byModule` entries, all
   PRIOR/new-atom words, grep-verified, mixing both tenses).
3. `zsh docs/es-ir-sources/assemble-mod.sh m23` → `src/features/languages/es/curriculum/ir/m23.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m23` (no `--check`) → writes
   `src/features/languages/es/curriculum/m23.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m22 m23 "Cuando, mientras, de repente" "Module 23 · Pretérito vs. imperfecto" "two pasts finally share a sentence — «cuando», «mientras», «de repente», and «entonces» say which clause is the ongoing scene and which is the one moment that happened inside it." "#ef4444" "#991b1b"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m22.test.ts` → `curriculum/m23.test.ts`; replace `m22`
   → `m23`, `M22` → `M23`; rewrite the bespoke-pins block for THIS module:
   - PIN E12 (unchanged mechanism) — no new cells, m23 adds no verb forms.
   - **NEW "no unregistered verb form, either tense"** — scan every lesson's
     JSON blob for the banned imperfect list (estaba/hacía/…) and any
     preterite person/verb combo not in m19–m21's registered set.
   - **NEW "fue/era, fue/iba minimal-pair check"** — every L6+ answer
     position using «fue» sits beside enough context (a marker, an
     adjacent imperfect clause, an unambiguous bounded-event object) to be
     gradable as the ONE correct reading.
   - **NEW "every sim from L6 on contains ≥1 imperfect and ≥1 preterite
     form"** — this module's signature pin; scan `npc.es` + tiles/options
     across all turns.
   - «todos» agreement (both tenses), marker/tense agreement per clause,
     «cuando» vs «¿cuándo?» never confused, no progressive, no cloze blank
     inside a question — mechanisms unchanged from m21/m22.
8. `npx vitest run src/features/languages/es/curriculum/m23.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m21/m22 step 8, plus specifically: any sentence
    where "was"/"went" is ungradable without the English gloss (i.e. the
    Spanish alone doesn't disambiguate fue-vs-era/iba the way the lesson
    claims), and any «y»/«e» coordination error before i-/hi- words.
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m23.test.ts` — final green.

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m22-brief.md`'s checklist, `m22`→`m23` throughout: (1)
`curriculum/index.ts` import/meta/map, (2) `courseAtoms.ts` union, (3)
`courseAtoms.ts` `getEsCourseAtoms()` spread, (4) `grammarHelpers.ts`
`ES_MODULE_ORDER`, (5) `placementBank.ts`, (6) `m23.test.ts` (hand-written,
step 7 above), (7) every `newAtoms` surface literally used in `m23.ts`
(`registerEsAtomUsagePin`). Also confirm `es-quality.test.ts`'s
`ES_M23_CHECKPOINT_INDEX` entry landed (script adds it, easy to forget
verifying).

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **Only 4 new atoms, not the ~18–21 ceiling other modules used.** The
  project goal is lessons a learner can reason through, not a fixed atom
  quota ([[drafting-coverage-not-volume]]: "pin the cell per request
  instead of adding rounds"). This module's job — combining two tenses the
  learner already owns — needs connectives, not new vocabulary; padding it
  with narrative nouns/verbs just to reach a number is the "hollow card"
  failure mode CLAUDE.md and m22's header both warn against, or would
  require new verb paradigms, which is banned outright. The parent task's
  candidate list (de repente, mientras, todavía, entonces, ya) resolves to
  exactly cuando (the theme's own title word) + the 3 named, minus the 2
  already-PRIOR (todavía, ya — both m16, grep-confirmed). Four is honest.
- **L5–L7 carry zero new atoms.** By L4 all four connectives are debuted
  (one per lesson, matching every prior module's cadence); L5–L7 are pure
  recombination — plural/«todos» agreement (L5), the fue/era/iba
  minimal-pair collision (L6), questions/negation (L7) — spaced practice
  before the checkpoint, not filler ([[interleave-dont-block-teach]]).
- **«porque» (because) is out of scope**, though it's a natural narrative
  fit and unregistered. Causal subordination is a different grammar point
  from aspect; adding it here stacks a second new idea on the contrast
  this module exists to teach — the thing m22's header ruled out for
  itself. Left for a future module.
- **L6 ("Fue o era") is a dedicated zero-new-atom lesson**, not folded into
  L1 or the checkpoint — m22 gave its hardest mechanic (yo=él) a full
  lesson rather than a footnote; the fue/era/iba collision is this
  module's equivalent and undersells it to cover in one info card.
- **Fresh accent colour: `#ef4444` → `#991b1b` (red).** Checked every
  `accent:` pair in `curriculum/index.ts` plus m19 (amber), m20 (purple),
  m21 (sky), m22 (indigo, per its brief's register-mod.py call) — red is
  unused anywhere in the course and fits a module about the moment that
  punctures an ongoing scene.
