# ES m20 «Fui, hice, tuve» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m20-L<n>.yaml` files.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo`)
- `m20-header.yaml` — the module spine + the 21 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word (see below).
- Exemplars (copy their shape exactly): `m19-L1.yaml` (opening teaching
  lesson), `m19-L3.yaml`, `m19-L6.yaml` (mixing lesson), `m19-L7.yaml`
  (questions/negation), `m19-L8.yaml` (checkpoint), `m19-L9.yaml`
  (consolidation), `m19-L10.yaml` (mastery).
- Your output: `m20-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (the file is a list item under `lessons:` — it starts with the
  `  # ── L<n> ·` comment and `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m20 <tag> docs/es-ir-sources/m20-L<n>.yaml [more files]`
  from the repo root, where `<tag>` is the single digit given in your task
  (each agent has its own so parallel runs do not collide). It sandwiches your
  fragment between stub lessons and compiles it with the real assembler. Fix
  every error it prints and re-run until `FRAGMENT OK`.
- Sim-goal scan: `python3 docs/es-ir-sources/goal-scan.py` reads the
  assembled module, so instead count by hand: every sim `goal:` line ≤ 8
  words (a dash counts as a word).

## PRIOR vocabulary (what you may use besides the new atoms)
Every atom of m1–m19 is PRIOR. To check a word, grep the compiled modules:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..19}.ts | sort -u | grep -i "<word>"`.
Regular plurals and -o/-a feminines of PRIOR atoms are fine. Present-tense
forms of table verbs (hablar, comer, vivir, ser, estar, ir, tener, querer,
poder, hacer, trabajar, estudiar, comprar, escribir, salir, cocinar, ver,
venir) in yo/tú/él AND nosotros/ustedes/ellos are PRIOR — EXCEPT these are
BANNED anywhere: ves, vemos, ven, vienes, venimos, vienen (untaught); any
vosotros form; any plural preterite (fuimos, fueron, hicimos, hicieron,
tuvimos, tuvieron, estuvimos, estuvieron, vimos, vieron, vinimos, vinieron,
hablamos-as-past, comieron…); any imperfect (iba, era, tenía, hacía…);
hacer/tener present beyond hago/haces/hace/tengo/tienes/tiene/tenemos/tienen.
Useful PRIOR: ayer, anoche, la semana pasada, el fin de semana, hoy, mañana,
todos los días, and all 26 m19 preterites (hablé/hablaste/habló, compré/
compraste/compró, trabajé/trabajaste/trabajó, estudié/estudió, comí/comiste/
comió, viví/vivió, salí/saliste/salió, escribí/escribió, cociné).
PRIOR places/nouns: el parque, el cine, la tienda, la playa, el mercado, la
escuela, el trabajo, la fiesta, la película, el regalo, el carro, casa, el
restaurante, la pizza, el pollo, la camisa, la falda, el mensaje, la familia,
mi madre, mi abuela, mis amigos, el profesor (grep to confirm any other).
Function words (el la los las un una lo al del yo tú usted él ella ellos
ellas nosotros ustedes me te se le les nos mi mis su sus de a en con por
para sin y o pero que si no sí ni como más muy también solo qué quién dónde
cuándo es son está están soy eres hay ser estar este esta esto ese esa eso
aquí allí) are always allowed.
Fixed cast, the ONLY names allowed: Ana, Diego, Sofía, María, Carmen, Sam,
Luis. Never invent a name or a place name beyond España / México.

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
(two blanks, see m19-L2 `l2-agr-*`) · mcq / textMcq / imageMcq / audioWimcq
(see exemplars; imageMcq `target` needs `emoji`; correct MCQ option ≤3 plain
tokens, NEVER a full sentence or a ¿…? question — this applies to L8 too) ·
matchLit (≥6 pairs, in the closing zone) · sim (dialogue_sim: `goal` ≤8
words, turns with `npc` {speaker, es, audioText, gloss} and a learner reply
that is either `tiles` (must cover the answer + `also`) or 3 `options`
{id right/wrong1/wrong2, text}; an option must never mirror the NPC line;
EVERY lesson ends with a sim followed by matchLit then a closing `-sp-win`
speakLit, exactly like the exemplars).

## Hard rules the gates enforce (each cost a round-trip last module)
1. Each new atom's FIRST printed appearance in the module must be on an
   intro-capable step: info, speakLit, buildLit, listenCompLit, imageMcq
   (word_map does not count; a cloze OPTION or a tile counts as a printed
   appearance — so never put a not-yet-debuted form in options/tiles).
   Within your lesson, the card (info) comes before the first spend, and each
   form is spoken (speakLit) before it is a cloze answer.
2. Every atom assigned to your lesson must literally appear AND earn at
   least one ANSWER position (build answer, cloze blank, MCQ correct, listen
   answer, sim right option, match pair). Each new verb form in your lesson:
   ≥3 answer positions across the lesson.
3. No two adjacent steps of the same kind. No sentence more than 3× in a
   lesson. Cloze steps ≤25% of the lesson (≤⅓ in L8/L10). ≥1 audioWimcq per
   teaching lesson targeting a PRIOR noun with its emoji (grep the compiled
   module for `emoji:` to find the noun's emoji; do NOT reuse an emoji for a
   different word). imageMcq only on a word's first exposure (museo L1,
   viaje L5 — nowhere else).
4. Glosses: preterite = English simple past ("I went", "she had"). Never
   "was going", "used to", "have gone". No progressive anywhere. No
   English sentence inside a build `en` with an internal `. ` `! ` `? `.
5. Marker/tense agreement per clause: a past marker (ayer, anoche, la semana
   pasada, el fin de semana, el mes pasado) never sits with a present form;
   hoy/mañana/todos los días never with a preterite. «hoy … pero ayer …» is
   fine because clauses are split on «pero», «y», commas.
6. «fue» must be drilled BOTH as went (a place with «a»/«al» follows) and as
   was (an adjective/noun follows) from L2 onward — never gloss it as only one.
7. No accents on any irregular preterite (fui, vi, vio, hizo …). No plural
   persons. Nothing from vosotros.
8. IDs: `l<n>-<kind-abbrev>-<slug>` unique in the module; the closing steps
   are `l<n>-sim-<slug>`, `l<n>-match`, `l<n>-sp-win`.
9. Recall license: a `cue: recall` speakLit may only repeat a sentence that
   an EARLIER lesson printed as a speakLit. The guaranteed earlier sentences
   are the `-sp-win` lines listed below — use only those for recalls.
10. Sim: the learner's `tiles` reply must be buildable exactly from the
    tiles; options must all be plausible, and the wrong ones must be wrong
    by person/tense, not by nonsense.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson
| L | Title | New atoms it OWNS (must debut + answer here) | -sp-win (verbatim) |
|---|---|---|---|
| 1 | Ayer fui | fui, fuiste, fue (as WENT only), el museo 🏛️ | «ayer fui al museo con Ana» |
| 2 | Fue muy bueno | fue/fui/fuiste as WAS (ser) — re-spend all three both ways | «la película fue muy buena» |
| 3 | ¿Qué hiciste? | hice, hiciste, hizo | «anoche hice la cena» |
| 4 | Tuve, estuve | tuve, tuviste, tuvo, estuve, estuviste, estuvo | «ayer tuve mucho trabajo» |
| 5 | Vi, vine | vi, viste, vio, vine, vino, el viaje 🧳 | «vi a Diego en el parque» |
| 6 | El mes pasado | el mes pasado; mixes m19 regulars with m20 irregulars | «el mes pasado fui a México» |
| 7 | ¿Fuiste? No fui | questions and negation across all forms | «no fui a la fiesta anoche» |
| 8 | Checkpoint | graded only, all atoms, transfer cell «viniste» (one buildLit, gloss "you came — venir", bank foils «vine» «vino») | «¿qué hiciste el fin de semana?» |
| 9 | Consolidation | every irregular + m19 regulars side by side; contrast now/then | «hoy estudio, pero ayer fui al cine» |
| 10 | Mastery | Ana asks «¿qué hiciste el fin de semana?»; no info; longest sim | «fui, hice, tuve y vi el fin de semana» |

Recalls: L3+ may recall L1/L2 wins; L5+ may recall L1–L4; L8 and L10 need ≥2
recalls each (module floor: ≥6 recalls, so put ≥1 recall in L3, L4, L5, L6,
L7, L9 and ≥2 in L8/L10).

## What to report back
A 5-line summary: the file(s) written, `FRAGMENT OK` confirmed (paste the
last checker line), step count per lesson, count of cloze steps, and any rule
you could not satisfy and why. Nothing else.
