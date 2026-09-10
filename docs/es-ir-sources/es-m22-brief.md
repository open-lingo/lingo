# ES m22 «Hablaba, era, iba» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m22-L<n>.yaml` files.

## The decision this module resolves (read before you draft anything)

`docs/es-ir-sources/es-m21-brief.md` named this module directly: once m21
closed the plural preterite, "imperfect (with a preterite-vs-imperfect
contrast module after it) is the natural m22+." That is now RESOLVED and
narrowed: **m22 teaches the imperfect on its own terms — habitual past,
description, and age/time — with NO preterite anywhere in it.** The
preterite-vs-imperfect contrast is m23's job, not this module's. Full
reasoning is in `m22-header.yaml`'s comment block — read it, it is not
decorative. In short:
1. **CLAUDE.md's contract** — "every new word or structure is introduced
   before it's tested" — means a contrast lesson (m23) needs a clean,
   confident imperfect to contrast WITH. This module builds that; m23
   spends it. Smuggling a preterite-vs-imperfect sentence in here pre-empts
   m23's entire reason to exist.
2. **The imperfect's one real novelty is dense enough alone.** Unlike m21
   (one reused surface, «hablamos», carrying a second reading), THIS module's
   novelty — yo and él/ella/usted sharing one surface — touches every single
   new atom. Stacking a second unrelated new skill (aspect choice) on top of
   that in the same module is the "hollow card" failure mode CLAUDE.md warns
   against: too much at once, nothing lands clean.
3. **Data readiness does not decide it either way**, so it isn't the
   tie-breaker: `conjugationTables.ts` already carries a full imperfect
   paradigm for all eighteen verbs the course has ever taught (pin E12) —
   nothing new to add to the table. The tie-break is pedagogical sequencing,
   and #1/#2 settle it.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo`)
- `m22-header.yaml` — the module spine + the 21 new atoms. READ FIRST,
  including the comment block — it explains the yo=él collision (this
  module's «hablamos»/«vivimos»-equivalent trap, except general to every
  atom instead of two surfaces), the accent pattern (the OPPOSITE of m20/
  m21's "no accent ever"), and the hard "no preterite anywhere" ban. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom (see
  below), or a function word.
- Exemplars (copy their shape exactly): `m21-L1.yaml` (opening teaching
  lesson — note its shape does NOT carry the "restrict to one reading first"
  pattern you need here, since yo=él can't be deferred; use it for STEP
  SHAPE only), `m21-L4.yaml` (a lesson that debuts 4 atoms of one irregular
  verb pair in one file — your L5/L6/L7 analogue), `m21-L6.yaml` («todos»
  debut, mixing), `m21-L7.yaml` (questions/negation), `m21-L8.yaml`
  (checkpoint), `m21-L9.yaml` (consolidation, now-vs-then contrast — but
  m21's contrast is present-vs-PRETERITE; yours is present-vs-IMPERFECT,
  see "what this module does NOT teach"), `m21-L10.yaml` (mastery).
- Your output: `m22-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (the file is a list item under `lessons:` — it starts with the
  `  # ── L<n> ·` comment and `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m22 <tag> docs/es-ir-sources/m22-L<n>.yaml [more files]`
  from the repo root, where `<tag>` is the single digit given in your task
  (each agent has its own so parallel runs do not collide). It sandwiches your
  fragment between stub lessons and compiles it with the real assembler. Fix
  every error it prints and re-run until `FRAGMENT OK`.
- Sim-goal scan: there is no reliable automated scanner for this — instead
  count by hand: every sim `goal:` line ≤ 8 words (a dash counts as a word).

## PRIOR vocabulary (what you may use besides the new atoms)

Every atom of m1–m21 is PRIOR. To check a word, grep the compiled modules:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..21}.ts | sort -u | grep -i "<word>"`.
**Do not trust a word because an earlier brief listed it — grep it yourself.**
Below is grep-verified for m22, this session, using exactly that command
(including a pass confirming none of this module's 21 new surfaces already
exist anywhere in m1–m21 — they don't; zero collisions).

Regular plurals and -o/-a feminines of PRIOR atoms are fine («de niña» from
«de niño», same convention as «buena» from «bueno» in m20/m21).

**All m18 present-tense forms** (yo/tú/él AND nosotros/ustedes-ellos) of
hablar, comer, vivir, ser, estar, ir, tener are PRIOR: hablo/hablas/habla/
hablamos/hablan, tengo/tienes/tiene/tenemos/tienen, soy/eres/es/somos/son,
voy/vas/va/vamos/van, veo/ves/ve/vemos/ven, and the rest of the m1–m18
present paradigm for the ten A1 table verbs.
**BANNED present forms carried forward from m21, unchanged** (never
registered as atoms at any tense/person): hacemos, hacen, queremos,
quieren, podemos, pueden, trabajamos, trabajan, estudiamos, estudian,
compramos, compran, escribimos, escriben, salimos, salen, cocinamos,
cocinan.

**All 26 m19 singular preterites, all 21 m20 singular irregular preterites,
and all 21 m21 plural preterites are PRIOR — but see "NO PRETERITE THIS
MODULE" below: PRIOR does not mean usable here.** m21's own 21 new atoms
(fuimos, fueron, hicimos, hicieron, tuvimos, tuvieron, estuvimos,
estuvieron, vimos, vieron, vinimos, vinieron, hablaron, comimos, comieron,
vivieron, estudiaron, compraron, trabajaron, escribieron, todos) are now
PRIOR vocabulary in the registry sense, and «todos» IS usable this module
(see below) — the verb forms in that list are not, because every one of
them is a preterite.

**PRIOR time/frequency markers:** ayer, anoche, la semana pasada, el mes
pasado, el fin de semana, hoy, mañana, todos los días, siempre. Only the
last two (todos los días, siempre) are safe with the imperfect without
special handling — they state frequency, not a deictic point in time, so
they carry no tense of their own. ayer/anoche/la semana pasada/el mes
pasado/el fin de semana are preterite-shaped time points; do not pair them
with an imperfect verb (that combination is itself a piece of the m23
contrast, not this module's job). hoy/mañana pair with PRESENT only, as
always — usable in L9's present-vs-imperfect contrast, on the present side.
**PRIOR places/nouns with emoji** (grep-verified, reused for audioWimcq):
la escuela 🏫, el parque 🌳, la playa 🏖️, el museo 🏛️, el cine 🎬, la
fiesta 🎉, el mercado 🛒, la tienda 🏪, casa 🏠, el trabajo 💼.
**Other PRIOR places/nouns:** el viaje, la película, el regalo, el carro,
el restaurante, la pizza, el pollo, la camisa, la falda, el mensaje, la
tarea, el dinero, la estudiante, el amigo, hermano/hermana, madre, abuela,
familia.
**PRIOR place names:** México, España.
**PRIOR adjectives/adverbs:** mucho, muy, bueno/buena, temprano, aquí,
juntos.
Function words (el la los las un una lo al del yo tú usted él ella ellos
ellas nosotros ustedes me te se le les nos mi mis su sus de a en con por
para sin y o pero que si no sí ni como más muy también solo qué quién dónde
cuándo es son está están soy eres hay ser estar este esta esto ese esa eso
aquí allí) are always allowed.
Fixed cast, the ONLY names allowed: Ana, Diego, Sofía, María, Carmen, Sam,
Luis. Never invent a name or a place name beyond España / México.

### What this module does NOT teach (do not manufacture the surface)
Only the 21 `newAtoms` in the header carry a genuinely new surface. In
particular:
- **No preterite form appears anywhere in m22 — new or PRIOR, singular or
  plural.** This is a hard ban, not a style note (see the header's "NO
  PRETERITE THIS MODULE" section). The sanctioned contrast this module
  teaches is PRESENT vs IMPERFECT (L9), never preterite vs imperfect —
  that pairing is m23's entire reason to exist.
- **No other verb's imperfect** — trabajar, estudiar, comprar, escribir,
  salir, cocinar, comer, vivir, querer, poder, venir, hacer all have real
  imperfect data in `conjugationTables.ts` (pin E12 covers all eighteen
  table verbs), but only hablar/tener/ser/ir/ver are registered as atoms
  this module. Do not manufacture trabajaba, estudiaba, compraba,
  escribía, salía, cocinaba, comía, vivía, quería, podía, venía, hacía, or
  any person of those families.
- **No progressive.** The English gloss legitimately reads progressive
  ("was speaking") — that is correct for imperfect (pin E7) — but the
  Spanish surface is always the simple form. Never build `estaba hablando`
  or any estar+-ndo periphrasis.
- No new imageable noun, no new emoji, no imageMcq debut this module
  (precedent: m19 and m21 both shipped zero — pure verb-focus modules).

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
(two blanks, see m21-L1 `l1-agr-*`) · mcq / textMcq / imageMcq / audioWimcq
(see exemplars; imageMcq `target` needs `emoji` — NOT used this module, see
above; correct MCQ option ≤3 plain tokens, NEVER a full sentence or a ¿…?
question — this applies to L8 too) · matchLit (≥6 pairs, in the closing
zone) · sim (dialogue_sim: `goal` ≤8 words, turns with `npc` {speaker, es,
audioText, gloss} and a learner reply that is either `tiles` (must cover
the answer + `also`) or 3 `options` {id right/wrong1/wrong2, text}; an
option must never mirror the NPC line; EVERY lesson ends with a sim
followed by matchLit then a closing `-sp-win` speakLit, exactly like the
exemplars).

## Hard rules the gates enforce (each cost a round-trip on earlier modules — do not repeat them)
1. Each new atom's FIRST printed appearance in the module must be on an
   intro-capable step: info, speakLit, buildLit, listenCompLit, imageMcq
   (word_map does not count; a cloze OPTION or a tile counts as a printed
   appearance — so never put a not-yet-debuted form in options/tiles).
2. Every atom assigned to your lesson must literally appear AND earn at
   least one ANSWER position (build answer, cloze blank, MCQ correct, listen
   answer, sim right option, match pair). Each new verb form in your lesson:
   ≥3 answer positions across the lesson.
3. No two adjacent steps of the same kind. No sentence more than 3× in a
   lesson. Cloze steps ≤25% of the lesson (≤⅓ in L8/L10). ≥1 audioWimcq per
   teaching lesson targeting a PRIOR noun with its emoji (see the PRIOR list
   above for the ready-made set; do NOT reuse an emoji for a different word).
4. **Glosses: imperfect is NEVER simple past.** Use "used to ___" / "was/
   were ___-ing" / "would ___" (pin E7). "I spoke" is a preterite gloss and
   is banned here. For the yo/él-collapsed "first slot" atoms, the gloss
   shape is «I ___, he/she/you (usted) ___» (see the header's atom list —
   copy that shape, don't invent your own). For ustedes/ellos forms, the
   shape is «they ___, you all ___» (mirrors m18's «son»/m21's «fueron»).
   No English sentence inside a build `en` with an internal `. ` `! ` `? `.
5. Marker/tense agreement: siempre and todos los días pair with the
   imperfect freely (frequency words, no tense of their own). ayer/anoche/
   la semana pasada/el mes pasado/el fin de semana NEVER sit in the same
   clause as an imperfect verb (those are preterite-shaped time points, and
   pairing them with imperfect is a piece of m23's job, not this module's).
   hoy/mañana pair with present tense only, as always — used in L9's
   sanctioned present-vs-imperfect contrast, on the present side of the
   clause split («pero», «y», commas split clauses, same as m19–m21).
6. **THE YO=ÉL COLLISION — drill every "first slot" atom with an explicit
   subject in every answer position.** hablaba/tenía/era/iba/veía are each
   BOTH "I ___" and "he/she/you(usted) ___" — the verb ending never tells
   you which. Never let one of these five atoms stand subjectless in a
   build/cloze/sim answer as if the form disambiguated itself; a pronoun
   (yo, él, ella, usted), a name (Ana, Diego…), or unambiguous surrounding
   context must sit in the same clause every time one is produced. hablar's
   L1 must carry the info card that states this fact generally (see the
   header) — later families' cards may be shorter and point back to it.
7. **Accents are the OPPOSITE pattern from m20/m21's preterite (read the
   header's dedicated section).** -ar (hablar): accent ONLY on nosotros
   (hablábamos); the other three carry none. ser (era) and ir (iba): same
   shape — accent ONLY on nosotros (éramos, íbamos). -er/-ir (tener, ver):
   accent on EVERY form (tenía/tenías/teníamos/tenían, veía/veías/
   veíamos/veían). Getting this backwards (importing "no accent ever" from
   the last two modules) is the single most likely mistake here — check
   every surface against `m22-header.yaml`'s atom list before you print it.
8. **«todos» (PRIOR, m21) takes 3rd-person-plural agreement only** —
   «todos eran/iban/hablaban/tenían/veían», never «todos éramos/íbamos/
   hablábamos/teníamos/veíamos». Same rule as m21, unchanged.
9. IDs: `l<n>-<kind-abbrev>-<slug>` unique in the module; the closing steps
   are `l<n>-sim-<slug>`, `l<n>-match`, `l<n>-sp-win`.
10. Recall license: a `cue: recall` speakLit may only repeat a sentence that
    an EARLIER lesson of THIS module printed as a speakLit. The guaranteed
    earlier sentences are the `-sp-win` lines listed below — use only those
    for recalls.
11. Sim: the learner's `tiles` reply must be buildable exactly from the
    tiles; options must all be plausible, and the wrong ones must be wrong
    by person (a mismatched subject) or by verb family, not by nonsense.
    Since every "first slot" atom is doubly-readable, a wrong option that
    swaps the SUBJECT while keeping the same verb form is a legitimate,
    on-topic distractor here (e.g. correct "yo iba" vs wrong "él iba" when
    the NPC line makes only one subject correct) — use this pattern, it is
    the module's own version of m20/m21's person-swap distractors.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atoms it OWNS (must debut + answer here) | Suggested PRIOR context words | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Hablaba de niño | hablaba (yo/él, both readings from the start — cannot be deferred); **debut of «de niño»** | siempre, español, todos los días | «de niño, hablaba español todos los días» |
| 2 | Hablábamos, hablaban | hablabas, hablábamos, hablaban | la escuela 🏫, juntos | «de niños, hablábamos mucho en la escuela» |
| 3 | Era, eras | era (yo/él, both readings — description/identity), eras | Diego, Sofía, bueno/buena | «de niño, Diego era muy bueno» |
| 4 | Éramos, eran, todos eran | éramos, eran; **re-spend «todos» (PRIOR) with eran only, never éramos** | familia, el amigo (PRIOR, m15) | «éramos una familia, y todos eran buenos amigos» |
| 5 | Iba a la escuela | iba, ibas, íbamos, iban | la escuela 🏫, el parque 🌳, temprano | «de niño, iba a la escuela temprano» |
| 6 | Veíamos películas | veía, veías, veíamos, veían | el cine 🎬, la playa 🏖️ | «veíamos películas en el cine» |
| 7 | ¿Cuántos años tenías? | tenía, tenías, teníamos, tenían; questions/negation across all five families; **info card: tener is regular here** | mucho, la casa 🏠 | «¿cuántos años tenías?» |
| 8 | Checkpoint | graded only, all 21 atoms | — | «de niño, iba a la playa y era muy bueno» |
| 9 | Consolidation | every family side by side; **contrast PRESENT vs IMPERFECT only** (never preterite) | voy (PRIOR present, m11), el trabajo 💼 | «hoy voy al trabajo, pero de niño iba a la escuela» |
| 10 | Mastery | Ana asks the whole group «¿cómo eran de niños?»; no info; longest sim | de niños (plural — see below), siempre | «de niños, íbamos a la escuela juntos, y siempre hablábamos mucho» |

Every content word in this table (español, bueno/buena, familia, el amigo,
la escuela, el parque, temprano, el cine, la playa, mucho, la casa, voy, el
trabajo, juntos) is grep-confirmed PRIOR by the method above — this is not
a suggestions list to re-verify, it is the verified set. **alto/alta and
feliz/felices/feliz are NOT PRIOR** (grep-checked, zero hits in m1–m21) —
do not use them; «bueno/buena/buenos/buenas» is the course's own
established stand-in for a positive description (already the convention m20
used for «fue muy bueno»/«fue muy buena»). If you need a PRIOR word this
table doesn't list, grep it yourself before using it — do not extend this
list by guessing.

**«de niños» (plural) is licensed the same way «buena»/«amigos» are** — a
regular plural of the registered atom «de niño», meaning "as children" for
more than one person (L10's frame: the whole group, growing up together).
It is not a second atom and does not need separate registration.

Recalls: L3+ may recall L1/L2 wins; L5+ may recall L1–L4; L8 and L10 need ≥2
recalls each (module floor: ≥6 recalls, so put ≥1 recall in L3, L4, L5, L6,
L7, L9 and ≥2 in L8/L10).

## What to report back
A 5-line summary: the file(s) written, `FRAGMENT OK` confirmed (paste the
last checker line), step count per lesson, count of cloze steps, and any rule
you could not satisfy and why. Nothing else.

---

## Coordinator checklist (after every m22-L*.yaml passes FRAGMENT OK)

1. `zsh docs/es-ir-sources/assemble-mod.sh m22` — header + m22-L*.yaml
   (sorted) + placement → `src/features/languages/es/curriculum/ir/m22.ir.yaml`.
   (Write `docs/es-ir-sources/m22-placement.yaml` first — same shape as
   `m21-placement.yaml`: a `screener` entry and 3–4 `byModule` entries, all
   PRIOR/new-atom words only, grep-verify same as lesson content, and NO
   preterite forms — the placement bank is lesson content too.)
2. `node scripts/compile-ir-es.mjs m22` (no `--check` — this is the real
   compile) → writes `src/features/languages/es/curriculum/m22.ts`. READ
   THE GENERATED FILE before doing anything else — this is a gate, not a
   formality.
3. `python3 docs/es-ir-sources/register-mod.py m21 m22 "Hablaba, era, iba" "Module 22 · El imperfecto" "a past tense for things that kept happening or were just true — and for the first time, «I» and «he, she, you» say it with the exact same word." "#818cf8" "#3730a3"`
   — registers m22 at 6 of the 7 points (see below).
4. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts` from
   the curriculum now that m22 exists.
5. Copy `src/features/languages/es/curriculum/m21.test.ts` →
   `src/features/languages/es/curriculum/m22.test.ts`; replace every `m21`
   → `m22`, `M21` → `M22` reference; rewrite the bespoke-pins block
   (`describe("ES m22 — bespoke pins", ...)`) for THIS module's rules:
   - PIN E12 check against `ES_VERB_ENTRIES` (unchanged mechanism, m22
     imperfect forms; unlike m21's pin, this one asserts accents ARE
     present on the forms that need them — see rule 7 above — not that
     none are, so don't just invert m21's `accented` assertion, rewrite it
     per-family against the exact accent pattern in the header)
   - **NEW: "the yo=él collision — every 'first slot' atom (hablaba, tenía,
     era, iba, veía) is produced with an explicit subject in every answer
     position"** — this pin does not exist in m21.test.ts; write it fresh,
     scanning for a pronoun/name/unambiguous-context token co-occurring in
     the same clause, same technique as m21's «hablamos»/«vivimos» pin but
     applied to five atoms instead of two, and checking PERSON ambiguity
     rather than TENSE ambiguity
   - **NEW: "no preterite form anywhere in m22"** — replaces m21's "no
     vosotros, no untaught present forms" pin's *shape* but bans a
     different list: every m19/m20/m21 preterite atom (regular and
     irregular, singular and plural) must be absent from every lesson's
     JSON blob, not just from answer positions
   - **NEW: "no progressive (estaba + -ndo) anywhere"** — pin E7's
     restated ban, specific to this module's gloss-shape trap
   - every irregular/regular imperfect form debuts intro-capable, ≥3 answer
     positions (unchanged mechanism)
   - **"«todos» only pairs with the four ustedes/ellos imperfect forms
     (eran/iban/hablaban/tenían/veían), never a nosotros imperfect form"**
     (same mechanism as m21's pin, new form list)
   - marker/tense agreement: siempre/todos los días with imperfect is fine;
     ayer/anoche/la semana pasada/el mes pasado/el fin de semana never with
     imperfect; hoy/mañana never with imperfect (present only)
   - m18 present-tense forms re-spent correctly in L9's present-vs-
     imperfect contrast (new pin — m21 had no equivalent, since its
     contrast was present-vs-preterite using different PRIOR forms)
   - tener's imperfect info card (L7) present and doesn't claim tener is
     regular anywhere else (unchanged claim, new pin)
   - no cloze blank inside a question (unchanged)
6. `npx vitest run src/features/languages/es/curriculum/m22.test.ts` — fix
   until green.
7. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass (bulk of new
   clips).
8. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
   brief) to catch what gates cannot see — non-PRIOR words in NPC lines, a
   false info-card claim, an accidental preterite slipping into a sim
   distractor, a subjectless "first slot" atom the gates missed because it
   sat in a context-implying step type the pin doesn't parse, a
   coordination error like «y iba» that should be «e iba» before a word
   starting with i-/hi-. This is cheap and m20/m21 each caught real
   defects this way. ALWAYS run it.
9. Apply reviewer fixes (≤10-line ones inline; anything bigger back to the
   drafting agent by SendMessage).
10. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass (clips from
    reviewer fixes).
11. `npx vitest run src/features/languages/es/curriculum/m22.test.ts` — final
    green check.

### The 7 registration points — verify all of them, not just what step 3 touched
`register-mod.py` covers 5 of the 7 listed in `docs/es-lesson-authoring-guide.md`
§10; confirm all 7 by hand before calling m22 done:
1. `curriculum/index.ts` — import, `ES_MODULE_META` entry, `LESSONS_BY_MODULE` ✓ (script)
2. `courseAtoms.ts` — `EsAtomSource` union ✓ (script)
3. `courseAtoms.ts` — **the `getEsCourseAtoms()` spread** ✓ (script) — the
   one m17 shipped missing; check it landed, do not assume.
4. `grammarHelpers.ts` — `ES_MODULE_ORDER` ✓ (script)
5. `placementBank.ts` — import + map entry ✓ (script)
6. `curriculum/m22.test.ts` — hand-written, step 5 above
7. every atom in `m22-header.yaml`'s `newAtoms` literally appears in an
   `m22.ts` step — `m22.test.ts`'s atom-usage pin (`registerEsAtomUsagePin`)
   checks this; do not ship until it is green.

Also confirm `es-quality.test.ts`'s `ES_M22_CHECKPOINT_INDEX` import/map
entry landed — `register-mod.py` adds it, but it is not one of the guide's
named 7 points and is easy to forget verifying separately.
