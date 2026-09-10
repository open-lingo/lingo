# ES m24 «Estaba, hacía, quería» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m24-L<n>.yaml` files.

**Worktree note:** this brief may be drafted from a git worktree, not the
main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh` all
default to the MAIN checkout path if `LINGO_ROOT` is unset — in a worktree
that silently writes to the wrong tree. Before running ANY script below:
`export LINGO_ROOT=$PWD` (from the repo root of whichever checkout you are
actually in).

## The decision this module resolves

m22 opened the imperfect with exactly five verbs (hablar, tener, ser, ir,
ver) and named the reason in its own header: teaching all five persons of
a brand-new mechanic (the yo=él collision) was already one full new idea,
and `conjugationTables.ts` already carries the complete imperfect paradigm
for all eighteen A1–A2 verbs the course has ever taught (pin E12) — the
other thirteen were always ready to go, just deliberately deferred. m23
then named those thirteen explicitly as its own hard "no new verb
morphology" ban list: estaba, hacía, vivía, trabajaba, quería, podía,
comía, salía, cocinaba, escribía, compraba, estudiaba, venía — none
registered anywhere through m23 (grep-verified). **m24 teaches the SECOND
WAVE of the imperfect — estar, hacer, querer, poder, venir — with ZERO new
grammar: the same -aba/-ía pattern the learner already owns from m22,
applied to five more everyday verbs, all of which are irregular in the
present and/or preterite tenses the learner already knows and perfectly
regular here.** That "irregular everywhere else, regular here" surprise —
m22 showed it once with tener — is this module's whole point, generalized.
Full reasoning, the "which five and why not the other eight" decision, the
rejected «porque» alternative, and the ser/estar-imperfect gloss discipline
are in `m24-header.yaml`'s comment block — read it, it is not decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m24-header.yaml` — the module spine + the 20 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word.
- Exemplars (copy their shape exactly): `m22-L1.yaml` (opening teaching
  lesson — note m24's L1 does NOT re-explain the yo=él collision, unlike
  m22's; state THIS module's idea instead, see the grammar-card section
  below), `m22-L5.yaml`/`m22-L6.yaml` (a single-family teaching lesson, all
  four persons at once — your L1–L5 shape, since m24 does not stage persons
  and does not need m22's L1/L2 or L3/L4 splits), `m23-L2.yaml`/`m23-L3.yaml`
  (a zero-new-atom recombination lesson reusing m23's connectives — your
  L6's shape), `m21-L7.yaml`/`m22-L7.yaml` (questions/negation — L7),
  `m21-L8.yaml`/`m22-L8.yaml`/`m23-L8.yaml` (checkpoint), `m22-L9.yaml`
  (present-vs-imperfect consolidation — your L9's shape, same technique),
  `m21-L10.yaml`/`m22-L10.yaml`/`m23-L10.yaml` (mastery).
- Your output: `m24-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m24 <tag> docs/es-ir-sources/m24-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`.
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (besides the 20 new atoms)
Every atom of m1–m23 is PRIOR. Grep to check a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..23}.ts | sort -u | grep -i "<word>"`.
**Imperfect through m23 was restricted to hablar/tener/ser/ir/ver (m22) —
this module adds estar/hacer/querer/poder/venir. No other verb gets an
imperfect form here**: no «vivía», «trabajaba», «comía», «salía»,
«cocinaba», «escribía», «compraba», «estudiaba» — those remain unregistered
and out of scope (a possible third wave, not this module's job).
**Preterite is open — all of m19 (26 regular singulars), m20 (21 irregular
singulars), m21 (21 plurals) are fair game, any person, any lesson** —
including «estuve/estuviste/estuvo» (estar, m20) and «vine/viniste/vino»
(venir, m20) and their m21 plurals — but never «quise»/«pude» (querer/poder
preterite are NOT registered anywhere; do not use them).
**PRIOR connectives (m23, all four legal from L1 here):** cuando, mientras,
de repente, entonces — see "reuse m23's connectives" below; this module
does not debut any of them but should keep them alive.
**PRIOR time/frame markers:** de niño/a/s (m22, imperfect clause only),
siempre, todos los días, ya, todavía (m16), ayer, anoche, la semana pasada,
el mes pasado, el fin de semana, hoy, mañana (m21/m22's marker/tense
agreement rule still applies per clause — see m23-header's restatement of
it, unchanged here).
**PRIOR places/nouns with emoji:** la escuela 🏫, el parque 🌳, la playa 🏖️,
el museo 🏛️, el cine 🎬, la fiesta 🎉, el mercado 🛒, la tienda 🏪, casa 🏠,
el trabajo 💼. **PRIOR non-emoji noun confirmed for this module: la tarea**
(m15, grep-verified) — homework, useful with «hacía». **Other useful
PRIOR** (grep-confirmed): la película, el amigo, hermano/hermana, madre,
abuela, familia, México, España, mucho, muy, bueno/buena, temprano, aquí,
juntos, todos (m21, 3rd-plural agreement only, both tenses). **PRIOR
present-tense forms of these five verbs, for the L9 present-vs-imperfect
contrast:** está (m4), estamos/están (m18), estuve/estuviste/estuvo (m20);
hago/haces/hace (m15); quiero/quieres (m7), quiere (m14); puedo/puedes/
puede (m14); vengo/viene (m15), vine/vino (m20). **NOT PRIOR — do not use:**
estoy, queremos/quieren, podemos/pueden, hacemos/hacen, venimos/vienen
(grep-confirmed zero hits m1–m23 — these present-tense cells were never
registered; do not manufacture them to fill out a paradigm). Function words
as in m21/m22/m23 briefs. Fixed cast only: Ana, Diego, Sofía, María,
Carmen, Sam, Luis. Never invent a name or place beyond España/México.

### What this module does NOT teach
- **No sixth verb.** Only estar, hacer, querer, poder, venir get an
  imperfect here. vivir/trabajar/comer/salir/cocinar/escribir/comprar/
  estudiar stay unregistered in this tense — a possible third wave, out of
  this module's scope.
- **No new preterite form**, new or PRIOR-but-unregistered (quise, pude —
  neither exists anywhere in the course; do not introduce them here either).
- No progressive («estaba hablando», «estaba haciendo» etc.) — pin E7,
  still banned. Note the trap: «estaba» is this module's own new atom AND
  the exact auxiliary the banned construction would use — never build it,
  including with estar's own new imperfect form.
- **No re-teach of the yo=él collision.** It is PRIOR (m22's hablar L1
  card taught it once, generally). This module's atoms still carry both
  readings and still must not stand subjectless in an answer position, but
  no lesson here should re-explain the mechanism from scratch.
- No new causal connective («porque») — rejected for this module, see
  header's "Rejected alternative" section; stays open for a later module.
- No new imageable noun, no new emoji, no imageMcq debut (precedent: m19,
  m21, m22, m23 all shipped zero — pure-grammar/paradigm modules).
- No «hace + time» ("ago") idiom — not taught anywhere in the course;
  «hacía» here means only "was doing/making," never "ago."

## Step kinds
Same vocabulary as m21/m22/m23 (map, info, speakLit, buildLit,
listenBuildLit, listenCompLit, clozeLit, agreementLit, mcq/textMcq/
imageMcq/audioWimcq, matchLit, sim) — see `m22-L5.yaml` / `m21-L8.yaml` for
exact fields, copy the shape, don't re-derive it. imageMcq unused (no new
emoji). Every lesson ends sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. Each of the 5 new verb families' first appearance must be intro-capable
   (info, speakLit, buildLit, listenCompLit) in the lesson listed below;
   ≥3 answer positions there, and reuse it (≥1 answer position) in ≥2 later
   lessons — same discipline as m22, now applied per-family across ten
   lessons.
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a PRIOR
   noun with its emoji.
3. Glosses: imperfect = "was ___-ing" / "used to ___" / "could/wanted to"
   as appropriate per verb (see atom hints in the header — poder/querer
   read most naturally as "could"/"wanted," not a literal progressive).
   Never gloss a preterite form (estuve, vine, hizo…) with an imperfect
   English shape or vice versa. No internal `. ` `! ` `? ` inside a build
   `en`.
4. **«estaba» vs «era» — never blur the two "was"-es.** «estaba» = located
   or in a state; «era» (PRIOR, m22) = identity/description. Never gloss
   both as interchangeable "was" in the same card; never build a sentence
   where either reading would be equally valid (that ambiguity is m23's
   fue-vs-era territory, a different collision, not this module's).
5. **The «quería, pero no podía» payoff.** Once poder debuts (L4), use the
   "wanted to but couldn't" pairing within ~2 steps of the card (13.9's
   cash-the-card rule) and recall it again in L8.
6. Marker/tense agreement per clause (see PRIOR vocabulary above); «de
   niño/a/s» always frames the imperfect side of a mixed sentence. «todos»
   — 3rd-person-plural only, either tense, never a nosotros form.
7. If a lesson recombines a new imperfect verb with a PRIOR preterite event
   (L6 especially), it must use one of the four PRIOR m23 connectives
   (cuando/mientras/de repente/entonces) correctly per m23's own per-
   connective rules (cuando → preterite clause; mientras → simultaneity;
   de repente → interruption; entonces → sequence) — do not invent a fifth
   connective or drop the connective and just juxtapose clauses.
8. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
9. Sim distractors wrong by tense, person, or verb-family, never nonsense
   (m21/22/23 rule, unchanged) — a wrong option swapping «estaba» for
   «era», or «quería» for «podía», when only one fits the NPC's context is
   this module's version of that pattern.

## Homograph / ambiguity risks (name these explicitly to drafting agents)
- **estaba (location/state) vs era (identity/description), both PRIOR-
  adjacent "was"-es** — see hard rule 4. Distinct from m23's fue-vs-era
  collision (which is about PRETERITE fue vs IMPERFECT era, a different
  axis); do not conflate the two teaching points.
- **quería/podía are NOT literal-translatable.** «quería» is never glossed
  as "I loved" (querer's other sense is out of scope here — desire only,
  matching m7/m10's PRIOR quiero gloss); «podía» is "could/was able to,"
  never "I was powerful" or similar overreach.
- **quise/pude do not exist in this course.** If a drafting agent reaches
  for querer/poder PRETERITE (a completed, one-time "decided to" / "managed
  to" reading), stop — that form is not registered anywhere and is out of
  scope; use the imperfect (ongoing desire/ability) or a different PRIOR
  verb instead.
- **hacía is not "ago."** See "What this module does NOT teach."
- **estaba/estuve — same verb, different tense, both legal, different
  jobs.** «estuve» (PRIOR, m20) is a completed stay/state ("I was there for
  a bounded time"); «estaba» (new) is the ongoing backdrop. This is exactly
  the fue-vs-era shape from m23, now available for estar too — a natural
  L6/L9 sentence, not a new rule to state.
- vino/venía — vino (PRIOR, m20, preterite, a single arrival) vs venía
  (new, imperfect, ongoing/habitual coming or "was coming"); keep them in
  separate clauses per the marker/tense discipline, same mechanism as
  fue/fui/hablé-style pairs in m20–m23.

## Grammar rule card budget
≤3 lines, must quote a course sentence (per CLAUDE.md's explanation
budget). L1's card states the module's ONE idea generally (this module's
idea, not a re-explanation of m22's yo=él collision — that stays PRIOR).
Suggested shape (adapt, don't invent a longer one):
> The imperfect keeps being the easy tense. «tenía» was regular even
> though «tengo»/«tuve» are not (m22) — «estaba», «hacía», «quería»,
> «podía», «venía» are the same trick, five more times.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atom owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Estaba en casa | estaba, estabas, estábamos, estaban; general rule card here | de niño, mucho, casa 🏠 | «de niño, estaba mucho en casa» |
| 2 | Hacía la tarea | hacía, hacías, hacíamos, hacían | de niño, la tarea, casa 🏠 | «de niño, hacía la tarea en casa» |
| 3 | Quería ir | quería, querías, queríamos, querían | de niño, ir, el cine 🎬 | «de niño, quería ir al cine» |
| 4 | Quería, pero no podía | podía, podías, podíamos, podían; the payoff pairing, ≥1 recall (quería) | la fiesta 🎉, no | «quería ir a la fiesta, pero no podía» |
| 5 | Venía a la escuela | venía, venías, veníamos, venían | de niño, la escuela 🏫, temprano | «de niño, venía a la escuela temprano» |
| 6 | Mientras hacía la tarea | none — recombination with PRIOR preterite via m23 connectives; ≥1 recall | mientras, de repente, vino, Diego | «mientras yo hacía la tarea, de repente vino Diego» |
| 7 | ¿Dónde estabas? | none — questions/negation across all five families; ≥1 recall | dónde, cuando, vino, Sofía | «¿dónde estabas cuando vino Sofía?» |
| 8 | Checkpoint | graded only, all 5 families + «quería, pero no podía» recall; ≥2 recalls | tenía (PRIOR, m22), mucho, trabajo 💼 | «quería ir a la fiesta, pero tenía mucho trabajo y no podía» |
| 9 | Consolidation | every family side by side; contrast PRESENT vs IMPERFECT only (never preterite, m22's L9 technique); ≥1 recall | hago (PRIOR present, m15), la tarea, de niño | «hoy hago la tarea, pero de niño hacía mucho trabajo» |
| 10 | Mastery | Ana asks the group to narrate a memory; longest sim; no info; ≥2 recalls, ≥1 PRIOR m23 connective | de niños (PRIOR plural), aquí, juntos, vino, Diego | «de niños, veníamos aquí juntos cuando, de repente, vino Diego, y entonces queríamos ir a la fiesta» |

Every content word above not already flagged PRIOR in this brief is
grep-confirmed against m1–m23 by the method above. Recalls: L3+ may recall
L1/L2; L5+ may recall L1–L4; floor ≥6 recalls total (5 new-atom families
across ten lessons, same shape as m22 — recall carries real weight from L6
on). Put ≥1 recall in L4, L6, L7, L9 and ≥2 in L8/L10, per the table.

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m24-placement.yaml` (same shape as
   `m23-placement.yaml`: a `screener` entry + 3–4 `byModule` entries, all
   PRIOR/new-atom words, grep-verified, spanning the five new verb
   families).
3. `zsh docs/es-ir-sources/assemble-mod.sh m24` → `src/features/languages/es/curriculum/ir/m24.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m24` (no `--check`) → writes
   `src/features/languages/es/curriculum/m24.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m23 m24 "Estaba, hacía, quería" "Module 24 · Regular en el imperfecto" "the imperfect's trick generalizes — estar, hacer, querer, poder, and venir are irregular everywhere else you've met them, but here they're perfectly regular, just like «tenía» already showed you." "#d946ef" "#86198f"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m23.test.ts` → `curriculum/m24.test.ts`; replace `m23`
   → `m24`, `M23` → `M24`; rewrite the bespoke-pins block for THIS module:
   - PIN E12 (unchanged mechanism) — verify each of the 20 new cells
     against `conjugationTables.ts`'s estar/hacer/querer/poder/venir rows
     exactly (accent placement per the header's per-family rule).
   - **CARRY m23's "no unregistered verb form" pin, updated denominator**
     — scan every lesson's JSON blob for any of the 8 still-banned
     imperfect forms (vivía/trabajaba/comía/salía/cocinaba/escribía/
     compraba/estudiaba) and for «quise»/«pude» (querer/poder preterite,
     never registered) and any preterite person/verb combo not in
     m19–m21's registered set.
   - **NEW "estaba/era gloss discipline" pin** — every answer position
     using «estaba» sits in a location/state context (never swappable with
     «era»'s identity/description reading) and vice versa; no sentence
     where both readings would be equally valid.
   - **NEW "no quise/pude" pin** — grep every lesson's JSON blob for
     "quise" and "pude"; fail if either appears anywhere.
   - **CARRY "no progressive" pin (E7)** — extend the scan pattern to catch
     «estaba» + a `-ndo` form specifically (this module's own auxiliary).
   - «todos» agreement (both tenses), marker/tense agreement per clause,
     «cuando» vs «¿cuándo?» never confused, no cloze blank inside a
     question — mechanisms unchanged from m21/m22/m23.
8. `npx vitest run src/features/languages/es/curriculum/m24.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m23's step 10, plus specifically: any sentence
    where «estaba» and «era» could both read as correct without more
    context, any accidental «quise»/«pude», and any «y»/«e» coordination
    error before i-/hi- words.
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m24.test.ts` — final green.

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m23-brief.md`'s checklist, `m23`→`m24` throughout: (1)
`curriculum/index.ts` import/meta/map, (2) `courseAtoms.ts` union, (3)
`courseAtoms.ts` `getEsCourseAtoms()` spread, (4) `grammarHelpers.ts`
`ES_MODULE_ORDER`, (5) `placementBank.ts`, (6) `m24.test.ts` (hand-written,
step 7 above), (7) every `newAtoms` surface literally used in `m24.ts`
(`registerEsAtomUsagePin`). Also confirm `es-quality.test.ts`'s
`ES_M24_CHECKPOINT_INDEX` entry landed (script adds it, easy to forget
verifying).

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **Five verbs, not all thirteen m23 banned.** Atom-budget precedent (m22:
  20 verb atoms + 1) and the "showcase the surprise" logic both point at a
  small, high-contrast set rather than exhausting the ban list in one
  module — see header's "WHICH FIVE" section for the full reasoning and
  the explicit list of the eight verbs left for a possible third wave.
- **«porque» rejected for this module, not forever.** It solves a
  different problem (causal subordination) than the one this module
  targets (imperfect verb-range scarcity), and stacking it here repeats
  m22's own "two new ideas at once" failure mode. Full reasoning in the
  header's "Rejected alternative" section.
- **No re-teach of the yo=él collision.** It is PRIOR (m22). Restating it
  here would cost a card slot this module's own idea needs, and CLAUDE.md's
  "introduced before it's tested" contract runs one direction — PRIOR
  material doesn't need re-introduction just because five more verbs use
  the same mechanism.
- **L6 is the dedicated recombination lesson**, mirroring m23's own L5–L7
  shape (zero new atoms, PRIOR connectives + PRIOR preterite + this
  module's new imperfect) rather than folding recombination into the
  checkpoint — spaced practice before L8, not filler
  ([[interleave-dont-block-teach]]).
- **L9 contrasts PRESENT vs IMPERFECT only, never preterite** — same
  restriction m22's own L9 carried, for the same reason: mixing all three
  tenses in one consolidation lesson is a third module's job (there isn't
  one planned), and m23 already owns the preterite-vs-imperfect contrast
  space.
- **Fresh accent colour: `#d946ef` → `#86198f` (fuchsia).** Checked every
  `accent:` pair in `curriculum/index.ts` (grep-verified none of m1–m23
  use this hue) plus the three named in the task — m21 sky (`#38bdf8`→
  `#0c4a6e`), m22 indigo (`#818cf8`→`#3730a3`), m23 red (`#ef4444`→
  `#991b1b`) — fuchsia is unused anywhere in the course and reads as
  distinct from all three at a glance.
