# ES m26 «Vivía, comía, estudiaba» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m26-L<n>.yaml` files.

**Worktree note:** this brief may be drafted from a git worktree, not the
main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh` all
default to the MAIN checkout path if `LINGO_ROOT` is unset — in a worktree
that silently writes to the wrong tree. Before running ANY script below:
`export LINGO_ROOT=$PWD` (from the repo root of whichever checkout you are
actually in).

**m25 status note:** m25 ("Porque, por eso") is fully committed, compiled,
and registered — verified directly: `courseAtoms.ts`, `curriculum/index.ts`,
`grammarHelpers.ts`, `placementBank.ts`, and `es-quality.test.ts` all carry
m25 entries, and `curriculum/m25.test.ts` exists on disk. Per
`docs/handoff-2026-09-10-overnight-authoring.md`'s 09:07 entry, an m25
REVIEWER pass may still have been finishing concurrently with this brief
being written (small foil/gloss/audio fixes only, not a structural change).
Re-grep any m25-sourced surface (porque, por eso, the m25 lesson context
words) before relying on it if you are drafting more than a few hours after
this brief was written.

## The decision this module resolves

`m24-header.yaml`'s "WHICH FIVE" section named eight verbs — vivir,
trabajar, comer, salir, cocinar, escribir, comprar, estudiar — as "a
candidate for a THIRD wave, not manufactured here." `m25-header.yaml`'s
"REJECTED ALTERNATIVE 1" confirmed the same eight are still fully
data-ready and rejected doing them in m25 specifically (not forever) on a
"three imperfect modules in a row" fatigue argument — but m25 itself was
NOT an imperfect module (porque/por eso), so the sequence is m22 (wave 1) →
m23 (contrast) → m24 (wave 2) → m25 (a genuine break) → **m26 cashes the
third wave now: vivir, comer, estudiar, trabajar, salir — the five of the
eight remaining verbs with the highest personal-narrative backbone value
(where you lived, what you ate, what you studied, what you did for work,
where you used to go out), leaving cocinar/escribir/comprar (more
situational/transactional) for a possible fourth wave.** ZERO new grammar:
the same -aba/-ía pattern from m22/m24, applied to five more everyday
verbs. Unlike waves 1 and 2, these five are NOT irregular elsewhere in the
course — the "surprise" framing doesn't apply; this module's payoff is
completeness plus a richer same-verb contrast (see below) that no earlier
wave could offer. Full reasoning, the "which five of the eight and why not
the other three" decision, and the two homograph traps (PRIOR «vivimos»'s
existing tense-ambiguity vs. new «vivíamos»; the «ir»-infinitive
not-a-live-atom trap, verified safe for this module's own five
infinitives) are in `m26-header.yaml`'s comment block — read it, it is not
decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m26-header.yaml` — the module spine + the 20 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word.
- Exemplars (copy their shape exactly): `m24-L1.yaml` (opening teaching
  lesson — note m26's L1 does NOT re-explain the yo=él collision, same as
  m24; state THIS module's idea instead — "the trick generalizes, third
  time now, this time to five verbs that were already regular everywhere
  else"), `m24-L5.yaml` (a single-family teaching lesson, all four persons
  at once — your L1–L5 shape), `m24-L6.yaml` (a zero-new-atom
  recombination lesson — your L6's shape, but see the important
  DIFFERENCE below: m26's L6 pairs each new imperfect verb against its OWN
  PRIOR preterite, not a different verb's), `m21-L7.yaml`/`m22-L7.yaml`/
  `m24-L7.yaml` (questions/negation — L7), `m21-L8.yaml`/`m22-L8.yaml`/
  `m23-L8.yaml`/`m24-L8.yaml` (checkpoint), `m22-L9.yaml`/`m24-L9.yaml`
  (present-vs-imperfect consolidation — your L9's shape, same technique,
  same restriction: PRESENT vs IMPERFECT only, never preterite),
  `m21-L10.yaml`/`m22-L10.yaml`/`m23-L10.yaml`/`m24-L10.yaml` (mastery).
- Your output: `m26-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m26 <tag> docs/es-ir-sources/m26-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`.
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (besides the 20 new atoms)
Every atom of m1–m25 is PRIOR. Grep to check a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..25}.ts | sort -u | grep -i "<word>"`.
**Imperfect through m25 was restricted to hablar/tener/ser/ir/ver (m22) and
estar/hacer/querer/poder/venir (m24) — this module adds vivir/comer/
estudiar/trabajar/salir. No other verb gets an imperfect form here**: no
«cocinaba», «escribía», «compraba» — those remain unregistered and out of
scope (a possible fourth wave, not this module's job).
**Preterite is open — all of m19 (26 regular singulars), m20 (21 irregular
singulars), m21 (21 plurals) are fair game, any person, any lesson** —
including this module's own five verbs' PRIOR preterite: comí/comiste/
comió/comimos/comieron (m19/m21), viví/vivió/vivimos/vivieron (m19/m21 —
NOT viviste, zero hits), trabajé/trabajaste/trabajó/trabajaron (m19/m21 —
NOT trabajamos-preterite, zero hits), salí/saliste/salió (m19 — NOT
salimos/salieron, zero hits), estudié/estudió/estudiaron (m19/m21 — NOT
estudiaste/estudiamos-preterite, zero hits) — but never «quise»/«pude»
(querer/poder preterite are NOT registered anywhere; do not use them).
**PRIOR connectives, BOTH toolkits, all six legal from L1 here:** cuando,
mientras, de repente, entonces (m23, temporal) AND porque, por eso (m25,
causal, now fully shipped) — this module debuts neither but should keep
both alive, this being the first wave that can pair EITHER against fresh
verb material.
**PRIOR time/frame markers:** de niño/a/s (m22, imperfect clause only),
siempre, todos los días, ya, todavía (m16), ayer, anoche, la semana
pasada, el mes pasado, el fin de semana, hoy, mañana (marker/tense
agreement rule per clause, unchanged). **NOT PRIOR: «el año pasado»,
«antes»** (zero hits — do not use as a stand-in for "before/in the past";
stick to the registered markers above).
**PRIOR places/nouns with emoji:** la escuela 🏫, el parque 🌳, la playa
🏖️, el museo 🏛️, el cine 🎬, la fiesta 🎉, el mercado 🛒, la tienda 🏪,
casa 🏠, el trabajo 💼, restaurante (no emoji, m18, grep-verified). **This
module's own five infinitives are ALL PRIOR atoms, may be credited in
`atoms:` when printed** (unlike «ir» — see header's homograph-trap
section): vivir (m11, no emoji), comer (m11, no emoji), estudiar (m10, 📚),
trabajar (m10, 👷), salir (m15, no emoji). Reusing trabajar's/estudiar's
own PRIOR emoji is PRIOR reuse, not a new debut. **Other useful PRIOR**
(grep-confirmed): la tarea (m15), el amigo, madre, padre, abuela, abuelo,
hermano/hermana, familia, México, España, mucho, muy, bueno/buena,
temprano, aquí, juntos, todos (3rd-plural agreement only, both tenses),
también, dónde (m4, standalone word, not a fixed phrase), «¿cuándo?» (m8,
FIXED PHRASE with its own punctuation — «cuándo» is never a bare
standalone atom, only this fixed form; do not decompose it). **PRIOR
present-tense forms of these five verbs:** vivo/vives/vive/vivimos/viven
(all PRIOR — vivir's present is complete), como/comes/come/comemos/comen
(all PRIOR — comer's present is complete), estudio/estudias/estudia
(PRIOR), trabajo/trabajas/trabaja (PRIOR), salgo/sale (PRIOR). **NOT
PRIOR present — do not manufacture:** trabajamos, trabajan, sales,
salimos, salen, estudiamos, estudian (zero hits m1–m25 — these cells were
never registered for these three verbs). Function words as in
m21/m22/m23/m24/m25 briefs. Fixed cast only: Ana, Diego, Sofía, María,
Carmen, Sam, Luis. Never invent a name or place beyond España/México.

## The «ir»-infinitive trap, and why it does NOT apply to this module's own five verbs
`docs/handoff-2026-09-10-overnight-authoring.md` (08:06 entry) records that
the bare infinitive «ir» is printed as text throughout m11–m24 but was
NEVER registered via `atom()` — crediting it in an `atoms:` field would
silently drop SRS credit for a non-existent atom (`m24-L3.yaml`'s own
fragments print "ir" in "quería ir al cine" but never put "ir" in that
step's `atoms:` array — grep-verified). **This module's own five
infinitives (vivir, comer, estudiar, trabajar, salir) ARE live registered
atoms** (grep-verified, `atom()` calls exist in their own curriculum
files, m10/m11/m15) and MAY be credited in `atoms:` when printed — do not
blanket-apply the «ir» exception to every infinitive. Still: before
crediting ANY infinitive (from this module or a recall), grep it —
`grep -n 'surface: "<infinitive>"' src/features/languages/es/curriculum/m*.ts`
— do not assume.

### What this module does NOT teach
- **No sixth/seventh/eighth verb.** Only vivir, comer, estudiar, trabajar,
  salir get an imperfect here. cocinar, escribir, comprar stay
  unregistered in this tense — a possible fourth wave, out of this
  module's scope.
- **No new preterite form.** All five verbs' preterite singular is
  PRIOR (m19/m21) and reusable, but no NEW preterite cell is registered
  here, and the specific unregistered plural/tú cells named in the PRIOR
  vocabulary section above (viviste, trabajamos-preterite,
  salimos/salieron, estudiaste, estudiamos-preterite) must not be
  manufactured.
- No progressive («vivía viviendo», «comía comiendo» etc.) — pin E7,
  still banned. Same irony trap as m24: this module's own new atoms are
  themselves the auxiliary of the construction they must never form.
- **No re-teach of the yo=él collision.** PRIOR (m22). This module's L1
  card states THIS module's idea (completeness, third wave) and may
  reference the collision in one clause, not a card.
- No new connective, causal or temporal — both toolkits (m23, m25) are
  PRIOR and reused, not debuted.
- No new imageable noun, no new emoji, no imageMcq debut (precedent: m19,
  m21, m22, m23, m24, m25 all shipped zero — pure-grammar/paradigm
  modules). Two of this module's five verbs happen to already carry a
  PRIOR emoji (trabajar 👷, estudiar 📚) from their ORIGINAL m10 teaching
  — reusing it is not a new debut.
- No «hace + time» ("ago") idiom — not taught anywhere in the course,
  unrelated to this module's verbs regardless.
- **Never stack two conjugated/infinitive forms of the SAME verb in one
  clause** (e.g. «salía salir» is ungrammatical nonsense) — where an
  infinitive slot is needed after a modal (quería/podía), it is fine for
  it to be a DIFFERENT verb's infinitive, or salir's own infinitive after
  a DIFFERENT verb's conjugated form («quería salir» is fine; «salía
  salir» is not).

## Step kinds
Same vocabulary as m21/m22/m23/m24/m25 (map, info, speakLit, buildLit,
listenBuildLit, listenCompLit, clozeLit, agreementLit, mcq/textMcq/
imageMcq/audioWimcq, matchLit, sim) — see `m24-L5.yaml` / `m21-L8.yaml` for
exact fields, copy the shape, don't re-derive it. imageMcq unused (no new
emoji). Every lesson ends sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. Each of the 5 new verb families' first appearance must be intro-capable
   (info, speakLit, buildLit, listenCompLit) in the lesson listed below;
   ≥3 answer positions there, and reuse it (≥1 answer position) in ≥2 later
   lessons — same discipline as m22/m24, now applied per-family across ten
   lessons.
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a PRIOR
   noun with its emoji.
3. Glosses: imperfect = "was ___-ing" / "used to ___" as appropriate per
   verb (see atom hints in the header). Never gloss a preterite form
   (comí, viví, trabajé, salí, estudié…) with an imperfect English shape or
   vice versa. No internal `. ` `! ` `? ` inside a build `en`.
4. **ILLEGAL_PRESENT_FORMS pins must scan TILES, not just prose.**
   `docs/handoff-2026-09-10-overnight-authoring.md`'s 08:17 entry names the
   class finding directly: the m24 Sonnet reviewer found 14 unregistered
   present-tense forms sitting in `tiles:`/`distractors:` arrays that
   the automated `ILLEGAL_PRESENT_FORMS` regex scan (which only reads
   prose/`es:`/`audioText:` strings) never caught — the gate itself was
   NOT fixed (recorded as a follow-on, not raised that night). Treat this
   as still-live for m26: any drafting agent building a `buildLit` `tiles:`
   array, a `cloze` `options:` array, or a `sim` `distractors`/wrong option
   MUST hand-check every tile against the NOT-PRIOR list above
   (trabajamos, trabajan, sales, salimos, salen, estudiamos, estudian, plus
   quise/pude, plus the unregistered preterite cells) — the automated pin
   will not catch a foil form even though it will catch the same form in a
   sentence.
5. **«ir» is not a live atom (see the dedicated section above); this
   module's own five infinitives ARE.** Grep before crediting any
   infinitive in `atoms:`.
6. **The same-verb imperfect/preterite contrast is L6's job, not L9's.**
   m22's and m24's own L9 restriction stands unchanged: L9 contrasts
   PRESENT vs IMPERFECT only, never preterite — m23 already owns
   preterite-vs-imperfect as a teaching point, and this module's L6 (see
   below) is where that contrast gets reused with fresh verbs.
7. Marker/tense agreement per clause (see PRIOR vocabulary above); «de
   niño/a/s» always frames the imperfect side of a mixed sentence. «todos»
   — 3rd-person-plural only, either tense, never a nosotros form.
8. If a lesson recombines a new imperfect verb with a PRIOR preterite
   event using an m23 connective (cuando/mientras/de repente/entonces —
   L6 especially), it must obey that connective's own m23 rule (cuando →
   preterite clause; mientras → simultaneity; de repente → interruption;
   entonces → sequence) — do not invent a fifth connective. If it uses
   «porque»/«por eso» (m25), remember hard rule 5 from `es-m25-brief.md`:
   no tense restriction on the causal pair itself, but each individual
   clause must stay internally tense-consistent.
9. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
10. Sim distractors wrong by tense, person, or verb-family, never nonsense
    (m21–m25 rule, unchanged) — a wrong option swapping a habitual
    imperfect for the one-time preterite of the SAME verb, when only one
    fits the NPC's context, is this module's version of that pattern.

## Homograph / ambiguity risks (name these explicitly to drafting agents)
- **«vivimos» (PRIOR, m18 present / m21 preterite) is ALREADY
  tense-ambiguous by itself** — the exact same surface means "we live" and
  "we lived," disambiguated only by a marker, a real gate-enforced pin
  (`m21.test.ts`, ~lines 174–208), unchanged and untouched by this module.
  «vivíamos» (this module, new) is a THIRD, unambiguous reading on the
  same lemma — it never needs a marker to be understood, but do not gloss
  it as if it "resolves" the vivimos ambiguity in a card; they are simply
  three different words that happen to share a root.
- **comía/vivía/estudiaba/trabajaba/salía all carry the yo=él collision**
  — PRIOR mechanism (m22), not re-taught, but every "first slot" atom
  still must not stand subjectless in an answer position.
- **This module's own signature pair: HABITUAL imperfect vs. ONE-TIME
  preterite, same verb, same lesson.** comía/comí, vivía/viví,
  trabajaba/trabajé, salía/salí, estudiaba/estudié — each pair is legal,
  each pair needs a contrasting marker (siempre/todos los días on the
  imperfect side; ayer/anoche/la semana pasada on the preterite side) and
  a «pero» to bridge them. Never swap the markers (an imperfect clause
  with «ayer» or a preterite clause with «siempre» is a marker/tense
  violation, same rule as every prior module).
- **«salía» vs. the bare infinitive «salir».** Not a grammatical
  ambiguity, but a construction-error trap: never stack «salía» and
  «salir» (or any two forms of the same verb) in one clause. See "What
  this module does NOT teach."
- **quise/pude do not exist in this course.** Same ban as m24, unchanged
  — if a drafting agent reaches for querer/poder PRETERITE, stop; it is
  not registered anywhere.
- **«¿cuándo?» is a fixed phrase (m8), not a decomposable «cuándo».**
  Relevant if L7 uses a "when" question — use the whole fixed phrase, do
  not attempt a bare «cuándo».

## Grammar rule card budget
≤3 lines, must quote a course sentence (per CLAUDE.md's explanation
budget). L1's card states the module's idea generally — completeness, not
a new surprise, third wave. Suggested shape (adapt, don't invent a longer
one):
> The imperfect keeps being the easy tense — third wave now. «tenía»
> (m22), «estaba» (m24) were regular despite irregular present/preterite
> forms; «vivía», «comía», «estudiaba», «trabajaba», «salía» are the same
> trick, five more times: «de niño, vivía en México».

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atom owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Vivía en México | vivía, vivías, vivíamos, vivían; general rule card here | de niño, México, aquí | «de niño, vivía en México» |
| 2 | Comía en casa | comía, comías, comíamos, comían | de niño, casa 🏠, mucho | «de niño, comía mucho en casa» |
| 3 | Estudiaba en la escuela | estudiaba, estudiabas, estudiábamos, estudiaban | de niño, la escuela 🏫, mucho | «de niño, estudiaba mucho en la escuela» |
| 4 | Mi padre trabajaba mucho | trabajaba, trabajabas, trabajábamos, trabajaban | padre (PRIOR), todos los días, el trabajo 💼 | «mi padre trabajaba todos los días» |
| 5 | Salía al parque con Diego | salía, salías, salíamos, salían; ≥1 recall | de niño, el parque 🌳, Diego | «de niño, salía mucho al parque con Diego» |
| 6 | Siempre comía en casa, pero ayer comí en el restaurante | none — the module's signature same-verb contrast (habitual imperfect vs. one-time preterite, all five verbs), «pero», PRIOR m23/m25 connectives welcome; ≥1 recall | siempre, todos los días, ayer, anoche, restaurante (PRIOR, m18), vivió/trabajó/salió/estudió (PRIOR m19/m21) | «siempre comía en casa, pero ayer comí en el restaurante» |
| 7 | ¿Dónde vivías de niño? | none — questions/negation across all five families; ≥1 recall | dónde (m4), no (m1) | «de niño, no trabajaba, pero estudiaba mucho» |
| 8 | Checkpoint | graded only, all 5 families + L6's same-verb contrast recall; ≥2 recalls | siempre, ayer, pero | «vivía en México y estudiaba mucho, pero un día salí y no volví» — if «volví»/«un día» are not PRIOR, replace with a checkpoint sentence built ONLY from this module's own table rows (safer default: reuse L6's win verbatim as one of the ≥2 recalls instead of inventing new checkpoint prose) |
| 9 | Consolidation | every family side by side; contrast PRESENT vs IMPERFECT only (never preterite, m22/m24's L9 technique, unchanged restriction); ≥1 recall | vivo/como/estudio/trabajo/salgo (PRIOR present), de niño | «hoy vivo en España, pero de niño vivía en México» |
| 10 | Mastery | Ana asks the group to narrate a memory; longest sim; no info; ≥2 recalls, ≥1 PRIOR m23 connective, ≥1 PRIOR m25 connective (porque/por eso) | de niños (PRIOR plural), aquí, juntos, vino (PRIOR, m20) | «de niños, vivíamos aquí juntos; comíamos en casa todos los días, y estudiábamos mucho porque queríamos ir a la escuela» |

Every content word above not already flagged PRIOR in this brief is
grep-confirmed against m1–m25 by the method above. **L8's suggested win
line is flagged UNVERIFIED above — «un día» and «volví» were NOT
grep-checked and should NOT be assumed PRIOR; the safer default (reusing
an EARLIER lesson's own win line as a recall) is named explicitly and is
the recommended fallback.** Recalls: L3+ may recall L1/L2; L5+ may recall
L1–L4; floor ≥6 recalls total (5 new-atom families across ten lessons,
same shape as m22/m24 — recall carries real weight from L6 on). Put ≥1
recall in L5, L6, L7, L9 and ≥2 in L8/L10, per the table.

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m26-placement.yaml` (same shape as
   `m25-placement.yaml`: a `screener` entry + 3–4 `byModule` entries, all
   PRIOR/new-atom words, grep-verified, spanning the five new verb
   families).
3. `zsh docs/es-ir-sources/assemble-mod.sh m26` → `src/features/languages/es/curriculum/ir/m26.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m26` (no `--check`) → writes
   `src/features/languages/es/curriculum/m26.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m25 m26 "Vivía, comía, estudiaba" "Module 26 · Vivía, comía, estudiaba" "the imperfect's trick, a third time — vivir, comer, estudiar, trabajar, and salir slot into the same -aba/-ía pattern «tenía» and «estaba» already taught you, and now, for the first time, every one of them has a matching preterite to contrast against." "#22d3ee" "#0891b2"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m25.test.ts` → `curriculum/m26.test.ts`; replace `m25`
   → `m26`, `M25` → `M26`; rewrite the bespoke-pins block for THIS module:
   - PIN E12 (unchanged mechanism) — verify each of the 20 new cells
     against `conjugationTables.ts`'s vivir/comer/estudiar/trabajar/salir
     rows exactly (accent placement per the header's per-family rule:
     estudiar/trabajar accent nosotros only, vivir/comer/salir accent
     every form).
   - **CARRY the "no unregistered verb form" pin, updated denominator** —
     scan every lesson's JSON blob (INCLUDING `tiles:`/`distractors:`/
     `options:` arrays, per hard rule 4 above — the automated scan alone
     is insufficient, m24's own reviewer had to hand-check foils) for any
     of the 3 still-banned imperfect forms (cocinaba/escribía/compraba)
     and for «quise»/«pude», and for the specific NOT-PRIOR present forms
     (trabajamos, trabajan, sales, salimos, salen, estudiamos, estudian)
     and NOT-PRIOR preterite forms (viviste, trabajamos-preterite,
     salimos/salieron-preterite, estudiaste, estudiamos-preterite).
   - **NEW "same-verb contrast marker discipline" pin** — every L6-style
     habitual/imperfect ↔ one-time/preterite pair of the SAME verb must
     carry a habitual marker (siempre/todos los días/de niño) on the
     imperfect clause and a bounded-past marker (ayer/anoche/la semana
     pasada/el mes pasado) on the preterite clause; fail any sentence
     where the markers are swapped or absent.
   - **NEW "no same-verb double-conjugation" pin** — grep every lesson's
     JSON blob for two forms of the same one of this module's five
     lemmas appearing in the SAME clause (e.g. «salía» and «salir», or
     «vivía» and «vivió», stacked without an intervening conjunction that
     makes it two clauses) — fail if found.
   - **CARRY «ir»-not-a-live-atom awareness** — verify no `atoms:` array
     anywhere in `m26.ts` credits "ir"; separately verify every `atoms:`
     credit of vivir/comer/estudiar/trabajar/salir (the infinitive forms,
     when printed) corresponds to a real `atom()` registration.
   - **CARRY "no progressive" pin (E7)** — extend the scan pattern to
     catch each of this module's five new atoms + a `-ndo` form.
   - «todos» agreement (both tenses), marker/tense agreement per clause,
     «cuando» vs «¿cuándo?» never confused, «porque»/«por eso» spelling
     discipline (still "por qué"/"por que"/"porqué" never appear — this
     module doesn't touch those atoms but may exercise them via recall),
     no cloze blank inside a question — mechanisms unchanged from
     m21–m25.
8. `npx vitest run src/features/languages/es/curriculum/m26.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m25's step 10, plus specifically: hand-check
    every `tiles:`/`distractors:`/`options:` array against the NOT-PRIOR
    present/preterite lists above (the automated pin does not scan these
    — this is the exact class of bug m24's reviewer found 14 instances of),
    any accidental «quise»/«pude», any same-verb double-conjugation, and
    any «vivimos»/«vivíamos» gloss that blurs the three-way distinction.
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m26.test.ts` — final green.

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m25-brief.md`'s checklist, `m25`→`m26` throughout: (1)
`curriculum/index.ts` import/meta/map, (2) `courseAtoms.ts` union, (3)
`courseAtoms.ts` `getEsCourseAtoms()` spread, (4) `grammarHelpers.ts`
`ES_MODULE_ORDER`, (5) `placementBank.ts`, (6) `m26.test.ts` (hand-written,
step 7 above), (7) every `newAtoms` surface literally used in `m26.ts`
(`registerEsAtomUsagePin`). Also confirm `es-quality.test.ts`'s
`ES_M26_CHECKPOINT_INDEX` entry landed (script adds it, easy to forget
verifying). **Before starting any of this, re-check that m25's own 7
registration points are actually in place** — m25 was reported fully
registered and committed at the time this brief was written, but its
reviewer pass may still have been landing small fixes concurrently (see
the status note at the top of this file).

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **Five verbs (vivir, comer, estudiar, trabajar, salir), not all eight
  remaining.** Same atom-budget precedent m24 used to cap its own scope
  (20 verb atoms is the established imperfect-wave size); cramming eight
  families into ten lessons would either blow the budget by 60% or double
  up debuts per lesson, thinning each family's required ≥3-answer-position
  debut room — exactly the "hollow card" risk
  ([[drafting-coverage-not-volume]]) the doctrine warns against. Full
  reasoning in the header's "WHICH FIVE OF THE EIGHT" section.
- **Which five, specifically: the "life-stages backstory" cluster over the
  "situational/transactional" cluster.** Unlike m22/m24's contrast-driven
  selection (these five are NOT irregular elsewhere — m24's own header
  already conceded that), the differentiator is narrative utility for a
  "tell me about your childhood/your life" scene, this whole three-wave
  arc's throughline. cocinar/escribir/comprar remain fully data-ready and
  are named explicitly as a possible fourth wave, not manufactured here —
  the same discipline m24 applied to its own leftover eight.
- **m26 taking the third wave right after m25 (not "three imperfect
  modules in a row") is doctrinally sound.** m25's own rejection of this
  same verb set was conditioned on the sequence being m22→m24→m25 all
  being the same mechanic; m25 broke that streak (porque/por eso is a
  different idea), so [[interleave-dont-block-teach]] is satisfied at the
  module level by m25's own existence as the break. Full reasoning in the
  header's "WHY THIS MODULE, NOW" section.
- **L6 is the dedicated recombination lesson, and its content is a NEW
  variant on the m23/m24 pattern** — pairing each new verb against its
  OWN PRIOR preterite (not a different verb's, as m24's L6 mostly did)
  because, for the first time, every one of this wave's five verbs
  already has a usable PRIOR preterite counterpart. Spaced practice before
  L8, not filler, same placement logic as m23's L5–L7 and m24's L6/L9.
- **L9 contrasts PRESENT vs IMPERFECT only, never preterite** — same
  restriction m22's and m24's own L9 carried, for the same reason: m23
  already owns preterite-vs-imperfect contrast, and this module's own
  version of that contrast belongs in L6 (recombination), not L9
  (consolidation).
- **Fresh accent colour: `#22d3ee` → `#0891b2` (cyan).** Checked every
  `accent:` pair in `curriculum/index.ts` (grep-verified none of m1–m25
  use this hue) plus the five most recently named — m21 sky (`#38bdf8`→
  `#0c4a6e`), m22 indigo (`#818cf8`→`#3730a3`), m23 red (`#ef4444`→
  `#991b1b`), m24 fuchsia (`#d946ef`→`#86198f`), m25 blue (`#3b82f6`→
  `#1d4ed8`) — cyan is unused anywhere in the course and reads as distinct
  from all five at a glance.

## Claims marked UNVERIFIED (could not confirm from code, flag to drafting agents)
- **L8's suggested checkpoint win line** («vivía en México y estudiaba
  mucho, pero un día salí y no volví») uses «un día» and «volví», NEITHER
  of which was grep-checked against m1–m25 — do not assume either is
  PRIOR. The lesson-plan table names the safer fallback explicitly: reuse
  an earlier lesson's own win line (e.g. L6's) as one of L8's ≥2 required
  recalls instead of inventing new checkpoint prose, until a drafting
  agent grep-verifies «un día»/«volví» or picks different PRIOR words.
- **The exact current content of `m25-L*.yaml` fragments and `m25.ts` at
  the moment a drafting agent starts on m26** — this brief was written
  against a snapshot where m25 was reported fully committed and
  registered, but its Sonnet reviewer pass may still have been landing
  small fixes concurrently (per the overnight ledger's 09:07 entry).
  Re-grep every m25-sourced surface before using it.
- **Whether «padre»/«madre»/«abuela»/«abuelo» have all been exercised as
  the SUBJECT of a full sentence before**, versus only appearing inside a
  possessive/vocabulary-list context in their origin module — confirmed
  only that the bare atoms are registered (grep hit = 1 each), not
  re-derived from reading their origin lessons in full. L4's suggested
  «mi padre trabajaba todos los días» should be spot-checked against
  `padre`'s origin module before being treated as a safe subject position.
- **Whether `es-quality.test.ts`'s `ES_M26_CHECKPOINT_INDEX` naming
  convention holds without deviation** — inferred by direct analogy to
  m24/m25's identical naming (`ES_M24_CHECKPOINT_INDEX`,
  `ES_M25_CHECKPOINT_INDEX`), not independently re-derived from reading
  `register-mod.py`'s exact string-substitution rules beyond the `edit()`
  calls shown in that script (which do confirm the `{prev}`/`{new}`
  substitution mechanism generically, just not this specific constant's
  literal spelling in the target file).
