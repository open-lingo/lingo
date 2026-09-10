# ES m25 «Porque, por eso» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m25-L<n>.yaml` files.

**Worktree note:** this brief may be drafted from a git worktree, not the
main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh` all
default to the MAIN checkout path if `LINGO_ROOT` is unset — in a worktree
that silently writes to the wrong tree. Before running ANY script below:
`export LINGO_ROOT=$PWD` (from the repo root of whichever checkout you are
actually in).

**m24 status note:** m24 ("Estaba, hacía, quería") is drafted, assembled,
compiled (`m24.ts` exists) and registered in `courseAtoms.ts`/`index.ts`/
`grammarHelpers.ts`, but it has NOT been reviewed/gated/shipped yet — an
ES m24 author may still be editing its fragments or the registry files
concurrently with your m25 work. Treat every m24 atom below as **expected
from m24**, not yet final. If m24 changes underneath you (a surface, a
gloss, an accent), re-grep before trusting this brief's m24 references.

## The decision this module resolves

`es-m23-brief.md`'s "Decisions inferred" flagged «porque» as "a natural
narrative fit and unregistered... left for a future module." `m24-
header.yaml`'s "Rejected alternative" section rejected «porque» for m24
specifically and closed with: "«porque» remains open for m25 or later."
**m25 cashes that deferral: two new connectives, «porque» (because — states
a reason) and «por eso» (that's why / so — states a result), let the
learner causally link any two clauses they can already build, in either
direction, with ZERO new verb morphology and ZERO new tense.** This is the
first module since m23 whose new idea is not a verb-range expansion — it
lets every PRIOR sentence the course can already build (any tense, m1–m24)
become a reason or a result. Full reasoning, the rejected alternatives (a
third imperfect-verb wave; a consolidation module), the decision to exclude
«¿por qué?», and the «como» homograph trap are in `m25-header.yaml`'s
comment block — read it, it is not decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m25-header.yaml` — the module spine + the 2 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word.
- Exemplars (copy their shape exactly): `m23-L1.yaml` (opening teaching
  lesson for a small connective set, general-rule-card shape — your L1's
  shape, since m25 like m23 does not stage persons or families, just one
  connective at a time); `m23-L2.yaml`/`m23-L3.yaml`/`m24-L6.yaml` (zero-
  new-atom recombination lessons reusing PRIOR connectives + PRIOR verb
  forms — your L6's shape); `m21-L7.yaml`/`m22-L7.yaml`/`m24-L7.yaml`
  (questions/negation — L7, though see the note below: this module has no
  question form, so L7 is negation-only, not questions); `m21-L8.yaml`/
  `m22-L8.yaml`/`m23-L8.yaml`/`m24-L8.yaml` (checkpoint); `m22-L9.yaml`/
  `m24-L9.yaml` (a side-by-side contrast consolidation — your L9's shape,
  contrasting «porque» vs «por eso» directionality instead of tense);
  `m21-L10.yaml`/`m22-L10.yaml`/`m23-L10.yaml`/`m24-L10.yaml` (mastery).
- Your output: `m25-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m25 <tag> docs/es-ir-sources/m25-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`.
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (besides the 2 new atoms)
Every atom of m1–m24 is PRIOR — **including m24's, with the concurrent-edit
caveat above: re-grep any m24 surface before relying on it.** Grep to check
a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..24}.ts | sort -u | grep -i "<word>"`.
**All PRIOR verb tenses are fair game, any person, any lesson, in either
clause of a porque/por-eso pair:** present (m1–m18), preterite regular/
irregular/plural (m19–m21), imperfect — hablar/tener/ser/ir/ver (m22),
estar/hacer/querer/poder/venir (m24, expected). **PRIOR connectives (m23,
all four legal from L1 here, and worth keeping alive per
[[interleave-dont-block-teach]]):** cuando, mientras, de repente, entonces.
**Grep-confirmed PRIOR content words used in this brief's example
sentences:** fui/fue/fuiste (ir/ser preterite, m20), vino (venir preterite,
m20), salí/salió (m19), tengo (m5), tarde/temprano (m14), no (m1), y/pero
(function words). **PRIOR time/frame markers** (m21/m22's marker/tense
agreement rule applies to THEM, unchanged — see "no tense restriction on
porque/por eso" below for how this module's own atoms differ): de niño/a/s
(m22), siempre, todos los días, ya, todavía (m16), ayer, anoche, la semana
pasada, el mes pasado, el fin de semana, hoy, mañana. **PRIOR places/nouns
with emoji:** la fiesta 🎉, el cine 🎬, la playa 🏖️, la escuela 🏫, el
trabajo 💼, casa 🏠, el parque 🌳, el museo 🏛️, el mercado 🛒, la tienda 🏪.
**PRIOR non-emoji nouns:** la tarea (m15), el amigo (PRIOR per m24 header,
grep it yourself before using). **PRIOR adverbs used in the lesson-plan
table:** aquí, juntos (both used together already in m24's own L10 —
grep-confirm before reuse). Fixed cast only: Ana, Diego, Sofía, María,
Carmen, Sam, Luis. Never invent a name or place beyond España/México.

### What this module does NOT teach
- **No «¿por qué?»** (the interrogative "why," two words, accented «qué»).
  Neither «qué» nor «por» has ever been registered as a free-standing
  word (grep-verified, zero hits m1–m24) — building the question form
  would mean minting two new function-word atoms plus an interrogative-
  punctuation pattern, a second new idea. Stays open for a future module.
- **No «por que»** (the relative, rare, two words no accent) and **no «el
  porqué»** (the noun "the reason," one word, accented, takes an article).
  Neither exists in this course. See the header's spelling-discipline
  section — the substrings "por qué", "por que", "porqué" must never
  appear in a lesson's JSON blob outside a comment.
- **No «como»/«ya que» as causal connectives.** «como» is PRIOR since m11
  as the yo-form of comer ("como pan" — I eat bread); reusing it as "as/
  since" would build a real homograph. «ya que» is unregistered and not
  manufactured here. Only «porque»/«por eso» are legal causal markers.
- **No new verb morphology, no new tense, no progressive.** Zero new verb
  atoms. Pin E7 (no «estaba/hacía» + `-ndo`) still applies, unchanged.
- **No new imageable noun, no new emoji, no imageMcq debut** (precedent:
  m19, m21, m22, m23, m24 all shipped zero — pure-grammar/connective
  modules).
- **«eso» is never exercised alone.** It has never been registered as a
  free-standing word; its only legal appearance is inside the fixed
  phrase «por eso».
- **A third imperfect-verb wave (vivir/trabajar/comer/salir/cocinar/
  escribir/comprar/estudiar) is NOT this module's job** — fully data-ready
  (grep-verified, still zero hits through m24) but deliberately deferred;
  see header's "Rejected alternative 1."

## Step kinds
Same vocabulary as m21/m22/m23/m24 (map, info, speakLit, buildLit,
listenBuildLit, listenCompLit, clozeLit, agreementLit, mcq/textMcq/
imageMcq/audioWimcq, matchLit, sim) — see `m23-L1.yaml` / `m21-L8.yaml` for
exact fields, copy the shape, don't re-derive it. imageMcq unused (no new
emoji). Every lesson ends sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. Each of the 2 new atoms' first appearance must be intro-capable (info,
   speakLit, buildLit, listenCompLit) in the lesson listed below; ≥3
   answer positions there, and reuse it (≥1 answer position) in ≥2 later
   lessons. With only two atoms across ten lessons, both must stay visibly
   alive well past their debut lesson — do not let either go quiet for
   more than 2 consecutive lessons after L5.
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a PRIOR
   noun with its emoji.
3. Glosses: «porque» = "because" (states a reason, the clause AFTER it is
   the reason). «por eso» = "that's why"/"so" (states a result, the
   clause AFTER it is the consequence). Never gloss either as a literal
   word-for-word translation of the other's direction — they are mirror
   images, not synonyms. No internal `. ` `! ` `? ` inside a build `en`.
4. **Spelling discipline (header, restated as a hard gate).** «porque» is
   always ONE word, no accent. Any lesson JSON containing "por qué", "por
   que", or "porqué" (outside a comment) fails. No exceptions.
5. **No tense restriction on «porque»/«por eso».** Unlike m21/m22/m23's
   time markers, these two atoms carry no tense of their own — a preterite
   clause may freely give the reason for a present one, an imperfect one
   the reason for a preterite one, etc. Each INDIVIDUAL clause must still
   be internally tense-consistent (existing per-clause rule, unchanged);
   do not apply the marker/tense-agreement rule to «porque»/«por eso»
   themselves.
6. **The cause/result mirror.** At least one lesson (suggested: L9) must
   present the SAME two facts once with «porque» (effect-then-cause) and
   once with «por eso» (cause-then-effect) so the mirror is visible, not
   just separately drilled.
7. If a lesson recombines «porque»/«por eso» with a PRIOR m23 connective
   (cuando/mientras/de repente/entonces — L6 especially), each connective
   must still obey its own m23 rule (cuando → preterite clause; mientras →
   simultaneity; de repente → interruption; entonces → sequence) — do not
   let the new causal connectives loosen the older temporal ones' rules.
8. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
9. Sim distractors wrong by direction (porque swapped for por eso when
   only one fits the clause order) or by using an untaught causal word
   («como», «ya que»), never nonsense (m21–m24 rule, unchanged).

## Homograph / ambiguity risks (name these explicitly to drafting agents)
- **«porque» (this module) vs «¿por qué?»/«por que»/«el porqué» (all
  three untaught).** The single biggest risk in this module. See spelling
  discipline above — gate-enforced, but drafting agents should self-check
  every instance by eye too.
- **«como» already means "I eat" (PRIOR, m11).** Never use it as a causal
  "as/since" connective — see header's homograph-trap section. A drafting
  agent reaching for a synonym to avoid repeating «porque» should reuse
  «porque» instead, not reach for «como».
- **«porque» vs «por eso» are NOT interchangeable.** «porque X» means X is
  the reason; «por eso X» means X is the result. Swapping one for the
  other in the same sentence position inverts the logic — sim distractors
  should exploit exactly this (rule 9), but a correct answer position must
  never accidentally read as logically backwards.
- **«eso» has no other legal use in this module.** If a drafting agent
  reaches for "that" as a general demonstrative, it is not registered
  standalone — do not build a sentence needing it outside «por eso».

## Grammar rule card budget
≤3 lines, must quote a course sentence (per CLAUDE.md's explanation
budget). L1's card states «porque»; L4's (or wherever «por eso» debuts)
states the mirror. Suggested shape (adapt, don't invent a longer one):
> «porque» gives a reason: «no fui a la fiesta porque tenía mucho
> trabajo.» «por eso» gives a result, same two facts, flipped: «tenía
> mucho trabajo, por eso no fui a la fiesta.»

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

Every content word below is either flagged PRIOR above (grep-confirmed) or
is one of the 2 new atoms. Re-verify any m24-sourced word before relying on
it (concurrent-edit caveat). Recalls: L3+ may recall L1/L2; L6+ may recall
L1–L5; floor ≥5 recalls total (only 2 new-atom families, so the floor is
lighter than m22/m24's 5-family modules — but each atom needs ≥2 reuses
past its own debut lesson per hard rule 1). Put ≥1 recall in L3, L5, L6,
L7, L9 and ≥2 in L8/L10.

| L | Title | New atom owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Porque tenía trabajo | porque; general rule card here | fui (m20), la fiesta 🎉, tenía (m22), mucho, trabajo 💼 | «no fui a la fiesta porque tenía mucho trabajo» |
| 2 | Porque quería ir al cine | porque, recall/reuse #1 | hacía (m24), la tarea, quería (m24), ir, el cine 🎬 | «hacía la tarea porque quería ir al cine» |
| 3 | Porque no podía ir | porque, recall/reuse #2 (satisfies ≥2-later-lessons rule) | estaba (m24), casa 🏠, podía (m24), la playa 🏖️ | «estaba en casa porque no podía ir a la playa» |
| 4 | Por eso no fui | por eso; the mirror rule card here, direct flip of L1 | tenía (m22), mucho, trabajo 💼, fui (m20), la fiesta 🎉 | «tenía mucho trabajo, por eso no fui a la fiesta» |
| 5 | Por eso venía temprano | por eso, recall/reuse #1; ≥1 recall (porque, L1 or L2) | quería (m24), la escuela 🏫, venía (m24), temprano | «quería ir a la escuela, por eso venía temprano» |
| 6 | Mientras hacía la tarea, por eso... | none — recombination with PRIOR m23 connectives + PRIOR preterite; ≥1 recall each atom | mientras, hacía (m24), vino (m20), Diego, el cine 🎬 | «mientras hacía la tarea, vino Diego, por eso no fui al cine» |
| 7 | No salí porque no quería | none — negation across both atoms (no question form this module); ≥1 recall | no (m1), salí (m19), quería (m24) | «no salí porque no quería» |
| 8 | Checkpoint | graded only, both atoms + m24's «quería, pero no podía» recall; ≥2 recalls | quería (m24), la fiesta 🎉, tenía (m22), trabajo 💼, fui (m20) | «quería ir a la fiesta, pero tenía mucho trabajo — por eso no fui» |
| 9 | Porque y por eso, la misma historia | every atom side by side; the cause/result mirror (hard rule 6); ≥1 recall | hacía (m24), la tarea, quería (m24), el cine 🎬, fui (m20), la fiesta 🎉 | «hacía la tarea porque quería ir al cine; por eso no fui a la fiesta» |
| 10 | Mastery | Ana asks the group to explain a memory's reasons; longest sim; no info; ≥2 recalls, ≥1 PRIOR m23 connective | de niño (m22), venía (m24), aquí, quería (m24), el amigo, por eso, siempre, estábamos (m24), juntos | «de niño, venía aquí porque quería ver a mi amigo, y por eso estábamos siempre juntos» |

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m25-placement.yaml` (same shape as
   `m24-placement.yaml`: a `screener` entry + 3–4 `byModule` entries, all
   PRIOR/new-atom words, grep-verified, spanning both new atoms).
3. `zsh docs/es-ir-sources/assemble-mod.sh m25` → `src/features/languages/es/curriculum/ir/m25.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m25` (no `--check`) → writes
   `src/features/languages/es/curriculum/m25.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m24 m25 "Porque, por eso" "Module 25 · Porque, por eso" "two clauses you can already build, causally linked — «porque» gives the reason, «por eso» gives the result, same two facts either direction." "#3b82f6" "#1d4ed8"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m24.test.ts` → `curriculum/m25.test.ts`; replace `m24`
   → `m25`, `M24` → `M25`; rewrite the bespoke-pins block for THIS module:
   - **NEW "porque spelling discipline" pin** — grep every lesson's JSON
     blob for "por qué", "por que", "porqué"; fail if any appears outside
     a comment.
   - **NEW "no como/ya que as causal" pin** — verify every «como» answer
     position exercises the eating sense (context includes food/eating,
     not a reason clause) and that «ya que» never appears at all.
   - **NEW "eso never alone" pin** — grep for a bare "eso" token; fail if
     it appears outside the fixed phrase "por eso".
   - **CARRY "no unregistered verb form" pin, unchanged denominator from
     m24** — still scan for the 8 still-banned imperfect forms and
     «quise»/«pude» (unchanged from m24, this module adds no verb
     surfaces).
   - **CARRY "no progressive" pin (E7)** — unchanged mechanism.
   - «cuando» vs «¿cuándo?» never confused, no cloze blank inside a
     question, marker/tense agreement per clause for m21/m22's time
     markers (NOT for porque/por eso — see hard rule 5) — mechanisms
     unchanged from m21–m24.
8. `npx vitest run src/features/languages/es/curriculum/m25.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m24's step 10, plus specifically: any accidental
    "por qué"/"por que"/"porqué" spelling, any «como» used causally instead
    of "I eat," and any sentence where porque/por eso's direction reads
    ambiguously.
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m25.test.ts` — final green.

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m24-brief.md`'s checklist, `m24`→`m25` throughout: (1)
`curriculum/index.ts` import/meta/map, (2) `courseAtoms.ts` union, (3)
`courseAtoms.ts` `getEsCourseAtoms()` spread, (4) `grammarHelpers.ts`
`ES_MODULE_ORDER`, (5) `placementBank.ts`, (6) `m25.test.ts` (hand-written,
step 7 above), (7) every `newAtoms` surface literally used in `m25.ts`
(`registerEsAtomUsagePin`). Also confirm `es-quality.test.ts`'s
`ES_M25_CHECKPOINT_INDEX` entry landed (script adds it, easy to forget
verifying). **Before starting any of this, re-check that m24's own 7
registration points are actually in place** — m24 was reported registered
at the time this brief was written (`courseAtoms.ts`, `index.ts`,
`grammarHelpers.ts` all showed m24 entries), but m24 had not been reviewed
yet and may still be in flux from a concurrent author.

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **«porque»/«por eso», not a third imperfect-verb wave.** Named twice by
  name (m23's deferral, m24's explicit "remains open for m25 or later")
  and closes a sharper gap (no causal link exists anywhere in the course
  through m24) than a further verb-range module would. Full reasoning in
  the header's "WHY THIS MODULE, NOW" and "Rejected alternative 1"
  sections.
- **Two atoms, not one.** «porque» alone would teach only the reason
  direction; «por eso» costs one more atom and buys the mirror-sentence
  technique (hard rule 6) for free, reusing the exact minimal-pair
  approach m24 already validated with «iba»/«venía».
- **«¿por qué?» excluded.** It is a second new idea (interrogatives) and
  requires minting two never-before-standalone atoms («qué», «por»), not
  a natural extension of «porque». Full reasoning in the header's "WHICH
  TWO ATOMS, AND WHY NOT ¿POR QUÉ?" section. Stays open for a future
  module, the same status «porque» itself held after m23.
- **«como»/«ya que» excluded as causal synonyms.** «como» is a live PRIOR
  homograph (comer's yo-form, m11); reusing it causally would be exactly
  the ungated-fragment failure [[vocab-gate-blind-to-fragments]] warns
  about. «ya que» is simply out of this module's two-atom budget.
- **L6 is the dedicated recombination lesson, L9 the dedicated mirror
  lesson** — same placement logic as m23's L5–L7 and m24's L6/L9: spaced
  practice before the checkpoint, not filler
  ([[interleave-dont-block-teach]]).
- **L7 is negation-only, not questions/negation.** This module has no
  taught question form (see «¿por qué?» exclusion above), so the L7 slot
  that m21–m24 used for questions+negation narrows to negation here — a
  deliberate, named departure from the four-module pattern, not an
  oversight.
- **Fresh accent colour: `#3b82f6` → `#1d4ed8` (blue).** Checked every
  `accent:` pair in `curriculum/index.ts` (grep-verified none of m1–m24
  use this hue) plus the four most recent named in the task/prior headers
  — m21 sky (`#38bdf8`→`#0c4a6e`), m22 indigo (`#818cf8`→`#3730a3`), m23
  red (`#ef4444`→`#991b1b`), m24 fuchsia (`#d946ef`→`#86198f`) — blue is
  unused anywhere in the course and reads as distinct from all four.

## Claims marked UNVERIFIED (could not confirm from code, flag to drafting agents)
- Whether the archived pre-re-author `m9.ts`'s porque/por-qué pairing
  shape (question-answer, taught together) would suit this course's
  current pacing if a future module ever adds «¿por qué?» — not re-derived
  here, noted only as a historical data point, not a design input.
- The exact current content of `m24-L*.yaml` fragments and `m24.ts` at the
  moment a drafting agent starts on m25 — this brief was written against a
  snapshot; m24 was reported as compiled and registered but NOT yet
  reviewed, and a concurrent author may still be changing it. Re-grep
  every m24-sourced surface before using it.
- "el amigo" and "aquí"/"juntos" together (L10's context) are taken from
  m24-header.yaml's own PRIOR-vocabulary list and m24-L10's own win
  sentence respectively, not independently re-derived word-by-word here
  beyond the spot-checks in this brief — grep-confirm before drafting.
