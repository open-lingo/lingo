# ES m21 «Fuimos, fueron» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m21-L<n>.yaml` files.

## The decision this module resolves (read before you draft anything)

The backlog line `docs/handoff-2026-09-09-es-m20-done-ko-next.md:76` left
"m21+ unplanned (A2 continues: plural preterite, or imperfect)" open. That
choice is now RESOLVED: **m21 is the plural preterite** — nosotros and
ustedes/ellos, past tense, for every verb the learner already conjugates in
yo/tú/él (m19 regular, m20 irregular). Imperfect is m22+, after this module
closes the paradigm.

Why, briefly (full reasoning is in `m21-header.yaml`'s comment block — read
it, it is not decorative):
1. **The course already said so.** `docs/es-ir-sources/m19-header.yaml`
   reserved this exact module: *"«hablamos» is deliberately ambiguous
   between present and preterite and m18 just spent it as a present. m20
   may open the plural past."* m20 ended up being the irregular singular
   instead — this module is the one m19 was pointing at.
2. **m20 fenced it off, not out.** `m20.test.ts` has a bespoke pin titled
   *"singular persons only: no plural preterite, no vosotros"* — a
   deliberate placeholder for a module that had to come, not a verdict that
   it shouldn't.
3. **The paradigm is half-built.** Every verb the learner has met has a
   past tense for three of five persons. nosotros/ustedes/ellos have been
   present-tense-only since m18 («Nosotros hablamos»). CLAUDE.md's contract
   — "every new word or structure is introduced before it's tested" — cuts
   against opening a SECOND past tense (imperfect) while the first one is
   still missing two persons. Finish the shape in progress before starting
   a new one.
4. **Data readiness does not decide it either way**, so it cannot be the
   tie-breaker: `conjugationTables.ts` already carries
   `preterite.nosotros` / `preterite.ustedes` for every verb this module
   needs AND `imperfect.*` for the ten A1 verbs (pin E12,
   `es-authoring-invariants-pinned.md` §1, "does not need new data to
   begin"). Both tenses are equally buildable today. The tie-break is
   pedagogical sequencing, and #3 settles it.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo`)
- `m21-header.yaml` — the module spine + the 21 new atoms. READ FIRST,
  including the comment block — it explains the «hablamos»/«vivimos» reuse
  trap, which is the one genuinely new mechanic this module has that m20
  didn't. Every surface you print must be either a `newAtoms` surface, a
  PRIOR atom (see below), or a function word.
- Exemplars (copy their shape exactly): `m20-L1.yaml` (opening teaching
  lesson, WENT-only restriction pattern), `m20-L2.yaml` (dual-reading
  re-spend pattern — your L2 is this lesson's direct analogue),
  `m19-L6.yaml` (mixing lesson), `m20-L7.yaml` (questions/negation),
  `m20-L8.yaml` (checkpoint), `m20-L9.yaml` (consolidation, now-vs-then
  contrast), `m20-L10.yaml` (mastery).
- Your output: `m21-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (the file is a list item under `lessons:` — it starts with the
  `  # ── L<n> ·` comment and `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m21 <tag> docs/es-ir-sources/m21-L<n>.yaml [more files]`
  from the repo root, where `<tag>` is the single digit given in your task
  (each agent has its own so parallel runs do not collide). It sandwiches your
  fragment between stub lessons and compiles it with the real assembler. Fix
  every error it prints and re-run until `FRAGMENT OK`.
- Sim-goal scan: there is no reliable automated scanner for this — instead
  count by hand: every sim `goal:` line ≤ 8 words (a dash counts as a word).

## PRIOR vocabulary (what you may use besides the new atoms)

Every atom of m1–m20 is PRIOR. To check a word, grep the compiled modules:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..20}.ts | sort -u | grep -i "<word>"`.
**Do not trust a word because an earlier brief listed it — grep it yourself.**
(The m20 brief's own PRIOR list included words — «mi madre», «mis amigos»,
«el profesor», «la familia» — that turned out not to be registered atoms
anywhere in m1–m20. Below is grep-verified for m21, this session, using
exactly that command.)

Regular plurals and -o/-a feminines of PRIOR atoms are fine («buena» from
«bueno», confirmed used this way already in m20-L2).

**Present-tense forms of table verbs — verified PRIOR nosotros/ustedes forms
exist ONLY for these seven:** hablamos, hablan, comemos, comen, vivimos,
viven, estamos, están, somos, son, vamos, van, tenemos, tienen (all m18).
**NOT PRIOR at any tense/person, in any reading — BANNED in every slot,**
because they were never registered: hacemos, hacen, queremos, quieren,
podemos, pueden, trabajamos, trabajan, estudiamos, estudian, compramos,
compran, escribimos (present reading), escriben, salimos, salen, cocinamos,
cocinan, vemos, ven, venimos, vienen. (This matters more than in m19/m20:
several of these look exactly like the -ar/-ir nosotros preterite forms
this module deliberately does NOT teach — see «what this module does NOT
teach» below.)

**All 26 m19 singular preterites** (hablé/hablaste/habló, compré/compraste/
compró, trabajé/trabajaste/trabajó, estudié/estudiaste/estudió, comí/
comiste/comió, viví/viviste/vivió, salí/saliste/salió, escribí/escribiste/
escribió, cociné/cocinaste/cocinó) and **all 21 m20 singular irregular
preterites** (fui/fuiste/fue, hice/hiciste/hizo, tuve/tuviste/tuvo, estuve/
estuviste/estuvo, vi/viste/vio, vine/vino, viniste) are PRIOR — re-spend
them freely, especially L9/L10 (now-plural vs already-known-singular).

**PRIOR time markers:** ayer, anoche, la semana pasada, el mes pasado, el
fin de semana, hoy, mañana, todos los días.
**PRIOR places/nouns** (grep-verified against m1–m20): el museo, el viaje,
el parque, el cine, la tienda, la playa, el mercado, la escuela, el
trabajo, la fiesta, la película, el regalo, el carro, casa, el restaurante,
la pizza, el pollo, la camisa, la falda, el mensaje, la tarea, el dinero,
la estudiante, el amigo, hermano/hermana, madre, abuela, familia.
**PRIOR place names:** México, España.
**PRIOR adjectives/adverbs:** mucho, muy, bueno (and «buena»), temprano,
aquí, juntos.
Function words (el la los las un una lo al del yo tú usted él ella ellos
ellas nosotros ustedes me te se le les nos mi mis su sus de a en con por
para sin y o pero que si no sí ni como más muy también solo qué quién dónde
cuándo es son está están soy eres hay ser estar este esta esto ese esa eso
aquí allí) are always allowed.
Fixed cast, the ONLY names allowed: Ana, Diego, Sofía, María, Carmen, Sam,
Luis. Never invent a name or a place name beyond España / México.

### What this module does NOT teach (do not manufacture the surface)
Only the 21 `newAtoms` in the header carry a genuinely new surface, PLUS
«hablamos» and «vivimos» (PRIOR, m18) which are relicensed here for a new
PAST reading — nothing else. In particular:
- **compramos, trabajamos, estudiamos, escribimos, cocinamos, salimos —
  the nosotros preterite of these verbs — are NOT taught this module** even
  though they are formed the exact same way as «hablamos»/«vivimos» (-ar
  and -ir nosotros = same shape present or past). The ustedes/ellos forms
  of the first four (compraron, trabajaron, estudiaron, escribieron) ARE
  taught (they are unambiguous new atoms); their nosotros partners are not.
  If you need a nosotros regular-verb past sentence, use only «hablamos» or
  «vivimos».
- No new imageable noun, no new emoji, no imageMcq debut this module
  (precedent: m19 shipped zero too — pure verb-focus module).

## Step kinds (the IR assembler's vocabulary — see exemplars for exact fields)
map (word_map: `tokens`, `pairs` {en, tokenIndex}, `audioText`, `revealNote`;
unbilled preview, ONLY as the first step of a teaching lesson) · info (`title`,
`body`; ≤1 per teaching lesson, 0 in L8/L10; «guillemets» around Spanish) ·
speakLit (`es`, `en`, `atoms`; add `cue: recall` with `atoms: []` when the
sentence is an EARLIER lesson's printed speakLit) · buildLit (`es`, `en`,
`atoms`, `tiles` = extra wrong tiles; optional `also:` ≤3 alternates) ·
listenBuildLit (same as buildLit, audio prompt) · listenCompLit (`es`, `en`,
`atoms`, `distractorsEn` exactly 3 distinct) · clozeLit (`es`, `en`, `blank`
= one word of es, `options` incl. the answer, `atoms`, `why`) · agreementLit
(two blanks, see m20-L1 `l1-agr-*`) · mcq / textMcq / imageMcq / audioWimcq
(see exemplars; imageMcq `target` needs `emoji` — NOT used this module, see
above; correct MCQ option ≤3 plain tokens, NEVER a full sentence or a ¿…?
question — this applies to L8 too) · matchLit (≥6 pairs, in the closing
zone) · sim (dialogue_sim: `goal` ≤8 words, turns with `npc` {speaker, es,
audioText, gloss} and a learner reply that is either `tiles` (must cover
the answer + `also`) or 3 `options` {id right/wrong1/wrong2, text}; an
option must never mirror the NPC line; EVERY lesson ends with a sim
followed by matchLit then a closing `-sp-win` speakLit, exactly like the
exemplars).

## Hard rules the gates enforce (each cost a round-trip on m20 — do not repeat them)
1. Each new atom's FIRST printed appearance in the module must be on an
   intro-capable step: info, speakLit, buildLit, listenCompLit, imageMcq
   (word_map does not count; a cloze OPTION or a tile counts as a printed
   appearance — so never put a not-yet-debuted form in options/tiles). This
   applies to «hablamos»/«vivimos»'s new PAST reading too, even though the
   surface itself is PRIOR — its first past-tense appearance must be on an
   intro-capable step in L2, with an info card explaining the ambiguity.
2. Every atom assigned to your lesson must literally appear AND earn at
   least one ANSWER position (build answer, cloze blank, MCQ correct, listen
   answer, sim right option, match pair). Each new verb form in your lesson:
   ≥3 answer positions across the lesson.
3. No two adjacent steps of the same kind. No sentence more than 3× in a
   lesson. Cloze steps ≤25% of the lesson (≤⅓ in L8/L10). ≥1 audioWimcq per
   teaching lesson targeting a PRIOR noun with its emoji (grep the compiled
   module for `emoji:` to find the noun's emoji; do NOT reuse an emoji for a
   different word).
4. Glosses: preterite = English simple past ("we went", "they had"). Never
   "was going", "used to", "have gone". No progressive anywhere. «they ___,
   you all ___» is the gloss shape for every ustedes/ellos form (mirrors
   m18's «son»: "they are, you all are"). No English sentence inside a
   build `en` with an internal `. ` `! ` `? `.
5. Marker/tense agreement per clause: a past marker (ayer, anoche, la
   semana pasada, el mes pasado, el fin de semana) never sits with a
   present form; hoy/mañana/todos los días never with a preterite. «hoy …
   pero ayer …» is fine because clauses are split on «pero», «y», commas.
6. **«fuimos» must be drilled BOTH as went (a place with «a»/«al» follows)
   and as was (an adjective/noun follows) from L2 onward** — never gloss it
   as only one, exactly like m20's «fue». **«hablamos» and «vivimos» must
   be drilled with an explicit past reading in L2** (info card names the
   ambiguity; at least one answer position each where only the past
   reading is correct, disambiguated by a marker).
7. No accents on any irregular preterite form, singular or plural (fuimos,
   fueron, hicimos, hicieron, tuvimos, tuvieron, estuvimos, estuvieron,
   vimos, vieron, vinimos, vinieron). Nothing from vosotros, ever.
8. **«todos» takes 3rd-person-plural agreement — «todos fueron», never
   «todos fuimos».** Pair it with ustedes/ellos forms only.
9. IDs: `l<n>-<kind-abbrev>-<slug>` unique in the module; the closing steps
   are `l<n>-sim-<slug>`, `l<n>-match`, `l<n>-sp-win`.
10. Recall license: a `cue: recall` speakLit may only repeat a sentence that
    an EARLIER lesson of THIS module printed as a speakLit. The guaranteed
    earlier sentences are the `-sp-win` lines listed below — use only those
    for recalls.
11. Sim: the learner's `tiles` reply must be buildable exactly from the
    tiles; options must all be plausible, and the wrong ones must be wrong
    by person/tense, not by nonsense.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atoms it OWNS (must debut + answer here) | Suggested PRIOR context words | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Fuimos juntos | fuimos (as WENT only) | ayer, juntos, el museo | «ayer fuimos juntos al museo» |
| 2 | Fuimos, hablamos | fuimos as WAS (ser, re-spend both ways); **debut of hablamos/vivimos past reading** (no new atoms — PRIOR reuse) | la fiesta, muy, bueno/buena, mucho | «la fiesta fue muy buena y hablamos mucho» |
| 3 | ¿Qué hicimos? | hicimos, hicieron | anoche, la tarea, juntos | «anoche hicimos la tarea juntos» |
| 4 | Tuvimos, estuvimos | tuvimos, tuvieron, estuvimos, estuvieron | mucho, el trabajo, la semana pasada | «tuvimos mucho trabajo la semana pasada» |
| 5 | Vimos, vinimos | vimos, vieron, vinimos, vinieron | temprano, el parque, Sofía | «vimos a Sofía y vinimos temprano» |
| 6 | Todos fueron | fueron, comimos, comieron, vivieron, hablaron, **todos (debut)** | el mes pasado, México, la fiesta | «el mes pasado todos fueron a México» |
| 7 | ¿Fueron? No fuimos | estudiaron, compraron, trabajaron, escribieron; questions and negation across nosotros/ustedes | la tienda, el mercado, anoche | «no fuimos a la fiesta anoche» |
| 8 | Checkpoint | graded only, all 21 atoms + hablamos/vivimos both-ways | el fin de semana | «¿qué hicieron el fin de semana?» |
| 9 | Consolidation | every plural form + all m19/m20 singulars side by side; contrast now/then AND singular/plural | el cine, el museo | «hoy vamos al cine, pero ayer fuimos al museo» |
| 10 | Mastery | Ana asks the whole group «¿qué hicieron el fin de semana?»; no info; longest sim | el fin de semana | «fuimos, hicimos, tuvimos y vimos el fin de semana» |

Recalls: L3+ may recall L1/L2 wins; L5+ may recall L1–L4; L8 and L10 need ≥2
recalls each (module floor: ≥6 recalls, so put ≥1 recall in L3, L4, L5, L6,
L7, L9 and ≥2 in L8/L10).

## What to report back
A 5-line summary: the file(s) written, `FRAGMENT OK` confirmed (paste the
last checker line), step count per lesson, count of cloze steps, and any rule
you could not satisfy and why. Nothing else.

---

## Coordinator checklist (after every m21-L*.yaml passes FRAGMENT OK)

1. `zsh docs/es-ir-sources/assemble-mod.sh m21` — header + m21-L*.yaml
   (sorted) + placement → `src/features/languages/es/curriculum/ir/m21.ir.yaml`.
   (Write `docs/es-ir-sources/m21-placement.yaml` first — same shape as
   `m20-placement.yaml`: a `screener` entry and 3–4 `byModule` entries, all
   PRIOR/new-atom words only, grep-verify same as lesson content.)
2. `node scripts/compile-ir-es.mjs m21` (no `--check` — this is the real
   compile) → writes `src/features/languages/es/curriculum/m21.ts`. READ
   THE GENERATED FILE before doing anything else — this is a gate, not a
   formality.
3. `python3 docs/es-ir-sources/register-mod.py m20 m21 "Fuimos, fueron" "Module 21 · El pretérito plural" "the same past you already own, said about more than one person — «hablamos» finally gets its other meaning, and «todos» brings the whole group into the sentence." "#38bdf8" "#0c4a6e"`
   — registers m21 at 6 of the 7 points (see below).
4. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts` from
   the curriculum now that m21 exists.
5. Copy `src/features/languages/es/curriculum/m20.test.ts` →
   `src/features/languages/es/curriculum/m21.test.ts`; replace every `m20`
   → `m21`, `M20` → `M21` reference; rewrite the bespoke-pins block
   (`describe("ES m21 — bespoke pins", ...)`) for THIS module's rules:
   - PIN E12 check against `ES_VERB_ENTRIES` (unchanged mechanism, m21 forms)
   - **"nosotros/ustedes plural only: no vosotros, no untaught present
     forms"** (the inverse of m20's singular-only pin — list the banned
     present forms from "What this module does NOT teach" above)
   - every irregular plural form debuts intro-capable, ≥3 answer positions
   - **"«fuimos» is cashed BOTH ways"** (replaces m20's «fue» pin)
   - **NEW: "«hablamos»/«vivimos» carry an explicit past reading, debuted
     in L2, disambiguated by a marker in every answer-position use"** — this
     pin does not exist in m20.test.ts; write it fresh, it is the one
     genuinely new gate this module needs.
   - **NEW: "«todos» only pairs with ustedes/ellos forms, never nosotros"**
   - marker/tense agreement per clause (unchanged mechanism)
   - m19/m20 singulars re-spent (unchanged mechanism, adjust which lessons)
   - hacer/tener ruling extended to the plural-present ban (see header)
   - no cloze blank inside a question (unchanged)
   - no imperfect, no progressive (unchanged)
6. `npx vitest run src/features/languages/es/curriculum/m21.test.ts` — fix
   until green.
7. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass (bulk of new
   clips).
8. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
   brief) to catch what gates cannot see — non-PRIOR words in NPC lines, a
   false info-card claim, a coordination error like «y hicimos» that should
   be «e hicimos» before a word starting with hi-/i-. This is cheap and m20
   caught 4 real defects this way. ALWAYS run it.
9. Apply reviewer fixes (≤10-line ones inline; anything bigger back to the
   drafting agent by SendMessage).
10. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass (clips from
    reviewer fixes).
11. `npx vitest run src/features/languages/es/curriculum/m21.test.ts` — final
    green check.

### The 7 registration points — verify all of them, not just what step 3 touched
`register-mod.py` covers 5 of the 7 listed in `docs/es-lesson-authoring-guide.md`
§10; confirm all 7 by hand before calling m21 done:
1. `curriculum/index.ts` — import, `ES_MODULE_META` entry, `LESSONS_BY_MODULE` ✓ (script)
2. `courseAtoms.ts` — `EsAtomSource` union ✓ (script)
3. `courseAtoms.ts` — **the `getEsCourseAtoms()` spread** ✓ (script) — the
   one m17 shipped missing; check it landed, do not assume.
4. `grammarHelpers.ts` — `ES_MODULE_ORDER` ✓ (script)
5. `placementBank.ts` — import + map entry ✓ (script)
6. `curriculum/m21.test.ts` — hand-written, step 5 above
7. every atom in `m21-header.yaml`'s `newAtoms` literally appears in an
   `m21.ts` step — `m21.test.ts`'s atom-usage pin (`registerEsAtomUsagePin`)
   checks this; do not ship until it is green (it caught «pagué» registered
   with no using step in an earlier module).

Also confirm `es-quality.test.ts`'s `ES_M21_CHECKPOINT_INDEX` import/map
entry landed — `register-mod.py` adds it, but it is not one of the guide's
named 7 points and is easy to forget verifying separately.
