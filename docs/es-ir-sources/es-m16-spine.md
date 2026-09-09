# ES m16 «Lo veo» — author brief (2026-09-07)

You are one of five authors, each writing TWO lessons of a ten-lesson module.
You write ONE file: `m16-L<a>-L<b>.yaml` in the scratchpad directory
(path given in your dispatch), containing exactly your two lessons as list
items under the module's `lessons:` key (start each with `  - n: <N>`, two
spaces of indent, same shape as m15). The header, the atom list and the
placement block are written already (`m16-header.yaml`, `m16-placement.yaml`)
— READ THE HEADER FIRST, every comment in it is binding.

**Verify every claim in this brief against the source before trusting it.**
In every previous wave the brief was the weakest artifact and the authors
found real errors in it by reading the gates. Report what is WRONG in it.

## Sources you must read (in this order)

1. `m16-header.yaml` (scratchpad) — the module thesis, the «lo» debut rule,
   the la/los/las carrier rule, the hacer ruling, form discipline, transfer cell.
2. `src/features/languages/es/curriculum/ir/m15.ir.yaml` — the exemplar for
   shape, density, step mix, comment style, and how a lesson ends (on a sim).
3. `scripts/draft/es-ir/assemble.mjs` — read its `throw` statements. They are
   the real shape spec (e.g. a clozeLit blank is matched with
   `words(es).indexOf(blank)` with NO punctuation stripping, so never blank
   the first word of a «¿…?» question; a sim build reply is split on
   whitespace against its tiles, so multi-word tiles cannot appear in one).
4. `src/features/languages/es/__tests__/moduleBarGuards.ts` — `esSurfaces()`
   (~line 225) decides which slots are BILLED. Billed: cloze options,
   build/listen tiles, match sources, the correct MCQ option, info-card
   «guillemet» spans, audioText/targetPhrase/targetSentence. NOT billed:
   MCQ distractors, dialogue_sim options/tiles, agreement_cloze wrong options.
   `word_map`, `dialogue_sim`, `gender_sort` bill nothing — a debut on one of
   them is invisible; debut on the step that cashes the word.
5. `docs/es-lesson-authoring-guide.md` §13, §13.9 and §14 (build alternates).
6. `es-atoms-m1-15.txt` (scratchpad) — every registered surface through m15.
   **A word not in that file and not in the header's newAtoms may not be
   printed in any billed slot.** Function words (el/la/los/las/lo/un/una/
   yo/tú/me/te/no/sí/y/pero/también/muy/qué/dónde/es/son/está/hay/aquí/
   allí…) are licensed by ES_FUNCTION_WORDS, but «lo» must still be
   DEBUTED in L1 before use (header).

## Lesson allocation (fixed — do not move atoms between lessons)

| L | title (working) | new atoms | one contrast |
|---|---|---|---|
| 1 | «Lo veo» | none (debut of «lo», a function word) | a masculine-singular thing already named is replaced by «lo», before the verb: «¿el libro? lo veo / lo tengo / lo quiero». Carriers: veo/ve (m15), tengo, quiero, libro, regalo NO (L3). Info card debuts «lo». |
| 2 | «La veo» | none | «la» does the same job for feminine things — the article you know, now without its noun. Two-option trials lo/la. Carriers: camisa, casa, película, falda, llave (sing.). |
| 3 | «Lo necesito» | necesitar, necesito, necesitas, necesita, regalo, mensaje | a new verb, regular -ar, taught as a word; pronoun still before it. |
| 4 | «Los tengo, las tengo» | boleto, mochila | plural: los/las replace plural things — «¿los boletos? los tengo», «¿las llaves? las tengo». |
| 5 | «No lo veo» | buscar, busco, buscas, busca | negation: «no» + pronoun + verb, the pronoun sits BETWEEN. buscar takes no «por». |
| 6 | «Ya lo tengo» | ya, todavía, compro, compras, compra | «ya lo tengo» / «todavía no lo tengo»; comprar's cells. |
| 7 | «Lo quiero comprar» | none | verb + infinitive: pronoun before the CONJUGATED verb («lo quiero comprar», «la puedo ver», «los necesito comprar»). Questions «¿lo tienes?» — «sí, lo tengo». NEVER «comprarlo». |
| 8 | checkpoint | maleta (transfer, cold) | ~20 graded steps, no new words except the transfer: «¿la maleta? la necesito» as a buildLit with tiles [lo, los] as foils. |
| 9 | «¿Lo tienes?» | none | consolidation, dialogue-heavy, mixed gender/number, at least 2 sims. |
| 10 | mastery | none | graded only, ends on a sim; the payoff exchange: shop/trip, every pronoun used. |

Each lesson: 15–22 steps, ≥1 info card with «guillemets» (L1–L7), ≥2 build
steps, ≥1 speakLit, ≥1 listenCompLit, ≥1 audioWimcq where a new noun debuts,
exactly the m15 mix. Each teaching lesson ENDS on a sim (§13.9 law 7).
No two adjacent steps of the same kind; never 4+ selection steps in a row.
Cued recall (`cue: recall`) only for a phrase an EARLIER speakLit already
printed (course-wide law) — check m1–m15 or your own earlier lesson.

## Hard rules (a gate fails on each of these)

1. **inv 24** — a sentence of ≥8 characters may appear in at most 3 steps of
   ONE lesson (clozes excluded). Vary the sentence, not the step.
2. **pin E2** — an atom from an EARLIER module is PRODUCED, never picked:
   a clozeLit answered by a prior-module surface (la/los/las/tengo/veo/…)
   must have EXACTLY TWO options, both taught. Three options fail.
3. **inv 33** — a NEW atom's first appearance must be on an intro-capable
   step (`info` «guillemet», `imageMcq`, `buildLit`, `speakLit`,
   `listenCompLit`, `audioWimcq`); a cloze OPTION or a build TILE is an
   exposure, so a new word may not be a foil before its debut.
4. **inv 10** — a cloze prompt may not contain its own answer or a distractor.
5. **one emoji, one meaning** — check `es-atoms-m1-15.tsv`; do not reuse an
   emoji already bound to another word (📖 libro, 🚶 hasta luego, 👋 adiós…).
6. **pronoun placement ghosts** («veo lo», «el veo», «lo no veo») may appear
   ONLY as MCQ distractors or dialogue_sim options — never in a cloze option,
   build tile or match source (those are billed; «veo lo» is two real words,
   so it would pass provenance and TEACH the error as a tile bank order — a
   build bank tests order by grading, not by offering a wrong tile).
7. **hacer**: hago/haces/hace only. tener: tengo/tienes/tiene only. No
   nosotros/ustedes forms of anything. No fused «verlo»-style forms anywhere,
   not even inside a sim.
8. **`also:`** (guide §14) — list up to 3 vetted alternates on a buildLit
   where a natural reorder exists: «ya lo tengo» ↔ «lo tengo ya»;
   «todavía no lo tengo» ↔ «no lo tengo todavía»; a fronted «hoy»/«ahora».
   Every alternate must be laid out from `es` + `tiles` as whole tiles; the
   compiler throws otherwise. Never list «quiero comprarlo».
9. **No question is ever a cloze** (unwritten course convention, 178/178).
10. Sim replies in build mode: single-word tiles only; include one pronoun
    foil of the wrong gender in the tile bank when the reply has a pronoun.

## Format contract (from m15; the assembler's throws are the truth)

`info {id,title,body}` · `imageMcq {id,target:{surface,meaningEn?,emoji},distractors:[{surface,emoji}]}` ·
`audioWimcq {id,target:{surface,emoji},distractors:[{surface,emoji}]}` ·
`map {id,tokens[],pairs:[{en,tokenIndex}],audioText,revealNote,tokenGenders?}` ·
`buildLit {id,es,en,atoms[],tiles[] (DISTRACTORS only),also?[]}` ·
`listenBuildLit {id,es,en,atoms[],tiles[]}` · `listenCompLit {id,es,en,atoms[],distractorsEn[3]}` ·
`clozeLit {id,es,en,blank,options[],atoms[],why}` · `matchLit {id,pairs:[{source,target}]}` ·
`speakLit {id,es,en,atoms[],cue?:recall}` · `textMcq {id,prompt?,target,distractors[]}` ·
`mcq {id,prompt,correct,distractors[3],atoms[],why}` · `sim {id,scene,turns[]}` (copy m15's shape exactly).
Step ids are SHORT (`l3-b-lonecesito`); the compiler prefixes `es-m16-<L>-`.

## Self-check before you report

Run the fragment checker: `zsh <scratchpad>/check-m16-fragment.sh <your file>`.
It assembles header + your lessons + placement into a temp IR and runs the
compiler in `--check` mode; fix every throw. Then re-read your two lessons
against rules 1–10 by hand — the compiler does NOT enforce most of them; the
vitest gates do, and I run those after assembly. Report: step counts per
lesson, atoms debuted per lesson, every `also:` you listed, and what in
this brief was wrong or ambiguous.
