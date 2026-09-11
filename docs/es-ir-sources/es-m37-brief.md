# ES m37 dispatch brief — «hay que» impersonal obligation (grammar beat)

## Status (verified 2026-09-10, hand-confirmed against the live tree, not
just m36-brief's own prose claims)

m36 is FULLY LANDED — authored, assembled, compiled, registered, gated,
reviewed, and shipped. Confirmed directly, not inherited:
- `git log --oneline -5` shows `4c2ce941 es: m36 «Voy en tren» —
  transport lexicon break, 10 lessons, 5 atoms, 102 clips`, followed by
  `bb28b005 ledger: ES m36 landed` and `f5970a45 ledger: ES m36 review
  clean` — a human/reviewer pass has already closed the loop on m36.
- All 5 registration points hand-verified present (not merely grepped for
  the string "m36" — each import AND each spread/array-entry checked):
  `grammarHelpers.ts:743` (`ES_MODULE_ORDER` tail includes `"m36"`),
  `courseAtoms.ts:67,234` (`ES_M36_ATOMS` imported + spread),
  `placementBank.ts:51,92` (`ES_M36_PLACEMENT` imported + arrayed),
  `curriculum/es-quality.test.ts:67,120` (`ES_M36_CHECKPOINT_INDEX`
  imported + mapped), `curriculum/index.ts` (accent pair
  `#475569`→`#1e293b` present, confirmed by direct grep-with-context).
- The review-pool regen step was **NOT skipped** — `grep -n 'm36'
  src/features/languages/es/esReviewPool.ts` (note: the file lives at
  `src/features/languages/es/esReviewPool.ts`, NOT under `curriculum/` —
  an earlier grep of mine against the wrong path returned a false zero-hit
  I want on record so no future agent repeats it) returns five rows, lines
  533-537, one per new m36 atom (estación/tren/metro/taxi/bicicleta), each
  in the expected `{surface, gloss, kind, fromModule, partOfSpeech}` shape.
- `curriculum/m36.test.ts` exists on disk and calls
  `registerEsModuleBarGuards()` per the established template.
- `git status --short` at research time shows only: this brief's own two
  not-yet-committed output files, plus unrelated dirty files from OTHER
  concurrent lanes (`ja/courseAtoms.ts`, `fr/curriculum/m25.test.ts`,
  `ja/curriculum/ir/m46.*`, `i18n/content/ja/m17.*.json`,
  `scripts/i18n/mt-translate-catalog.mjs`) — all JA/FR-lane work, none of
  it Spanish, none of it touched by this brief, per the
  concurrent-sessions doctrine (read, never touch another lane's files).

m37 does not exist anywhere yet — no `m37-*.yaml` fragment, no
`curriculum/m37.ts`, no registration edits. This brief and its companion
header (`docs/es-ir-sources/m37-header.yaml`) are the first two files for
this module. Nothing beyond those two files was written or run by this
brief — no pipeline script was executed, nothing was staged or committed.

## Files — read in this order

1. `docs/es-ir-sources/m37-header.yaml` — this module's own header
   (companion to this brief). Its `newAtoms:` block and inline `#`-comment
   sections (WHY THIS MODULE NOW, nine REJECTED sections, the TENGO QUE vs
   HAY QUE discrimination section, the HAY/HAY QUE dual-status section, the
   agreement section, the credit-trap section, the ES_FUNCTION_WORDS
   section, the SIM-provenance section, the accent section) are the
   authoritative record of every decision this module makes. Read it
   FIRST — this brief expands on its logistics, not its reasoning.
2. `docs/es-ir-sources/es-m36-brief.md` + `m36-header.yaml` — the
   immediately-prior module, a lexicon break; this brief mirrors its
   section structure exactly (this document's own skeleton was extracted
   directly from `es-m36-brief.md`'s own `## ` headings).
3. `docs/es-ir-sources/es-m35-brief.md` + `m35-header.yaml` — the
   immediately-prior GRAMMAR beat (m33 is two beats back; m35 is one beat
   back), the closer structural cousin: a non-imageable grammar atom
   (`está` + `cerca`/`lejos`/`al lado de`) taught by info-step + production
   practice, zero new verb morphology. m37 is even simpler (one atom, zero
   person fan-out) but should mirror m35's step-kind choices for a
   non-imageable grammar atom, not m36's image-MCQ-heavy lexicon pattern.
4. `docs/es-ir-sources/authoring-rules.md` — the compositional-vs-phrase-
   atom rule this module's own registration decision rests on (the same
   rule m33 used for its own `tengo que`).
5. `src/features/languages/es/curriculum/m33.ts` — read directly, not just
   grepped, lines ~200-260 (the `tengo que`/`tienes que`/`tiene que`
   registration + credit pattern). This module's «hay que» is the direct
   structural cousin, minus the person fan-out.
6. `src/features/languages/es/curriculum/m35.ts` — the non-imageable
   grammar-atom step-kind pattern (info-step intro, no vocab MCQ).
7. `docs/lesson-authoring-guide.md` §13 (lines 566-725) — card-type
   rubric, just-in-time grammar teach cadence, forced sentence_build
   pattern, atom registry discipline.
8. `docs/pedagogy-principles-2026-07-05.md`, `docs/course-design-
   learnings-2026-08-21.md`, CLAUDE.md lenses — binding framing; nothing
   here conflicts with what the header already commits to.

## The decision this module resolves

Every learner who has internalized m33's «tengo que + infinitivo»
(personal obligation: "I/you/he-she specifically have to") needs a way to
express a GENERAL rule that applies to no one in particular — "one has to
show a passport here," "you have to pay before 6pm," "it's necessary to
buy a ticket." Spanish marks this with the impersonal «hay que +
infinitivo» — invariant, no subject, built from two pieces the learner
already owns (`hay`, m3; `que`, the linker whose shape m33 already taught)
but combining to a genuinely new, non-compositional meaning. This module
teaches exactly that one new phrase atom and drills the
personal-vs-impersonal discrimination against it. See the header's own
"WHY THIS MODULE, NOW" section for the full reasoning against all nine
candidates named in the dispatch task, and the "TENGO QUE vs HAY QUE
DISCRIMINATION" section for the specific transfer error this module exists
to guard against.

## PRIOR vocabulary — re-runnable greps

```
# hay — existential, fully prior (m3), invariant, never conjugates
grep -o 'surface: "hay"' src/features/languages/es/curriculum/m*.ts
# → hits in m3 only; confirms zero re-registration risk

# que — free linker, never independently credited, already established
# by m33's own "tengo que"
grep -n 'fromModule: "que"\|surface: "que"' src/features/languages/es/curriculum/m*.ts
# → no standalone "que" atom anywhere; it rides inside "tengo que" (m33)
# and, as of this module, "hay que" — consistent, no new precedent needed

# tengo/tienes/tiene + que — the direct minimal-pair predecessor
grep -n 'surface: "tengo que"\|surface: "tienes"\|surface: "tiene"' src/features/languages/es/curriculum/m*.ts
# → "tengo que" registered m33 as its own phrase atom; "tienes"/"tiene"
# registered m5 as single-word atoms — confirms the exact precedent this
# module's own "hay que" registration follows

# poder/querer family — DISQUALIFIED candidates, fully taught already
grep -iE '^puedo$|^puedes$|^puede$|^poder$|^quiero$|^quieres$|^quiere$|^querer$' /tmp/es_prior_m36.txt
# → all eight hit, m14/m7/m14 respectively; confirms both candidates
# named in the dispatch task are already fully taught, no gap to fill

# tardar/llegar family — set-aside candidates, genuinely virgin
grep -iE '^tarda$|^tardan$|^hora$|^horas$|^minuto$|^minutos$|^llega$|^llegan$|^llego$' /tmp/es_prior_m36.txt
# → zero hits for all; confirms these remain real, well-scoped future
# content this module deliberately does not claim (needs new verb
# paradigms, not just a grammar structure)

# supporting infinitives this module's own sentences will lean on — all
# confirmed prior, zero new vocabulary needed beyond the one phrase atom
grep -n 'surface: "trabajar"\|surface: "estudiar"\|surface: "comprar"\|surface: "ir"\|surface: "comer"\|surface: "esperar"' src/features/languages/es/curriculum/m*.ts
# → trabajar/estudiar (m10), comprar (m12), ir bare infinitive (m28) all
# present and safe to recombine

# ES_FUNCTION_WORDS already carries both halves — scope-check only, does
# NOT imply the combination is taught
grep -n '"hay"\|"que"' src/features/languages/es/__tests__/moduleBarGuards.ts
# → both present in the closed-class Set (line ~82); unaffected by this
# module — the new registration lives in courseAtoms.ts, not here

# cast check — full course, not just recent modules
grep -rn 'speaker: "' src/features/languages/es/curriculum/m*.ts | grep -io 'marta\|lupita'
# → zero hits for both; confirms Marta (this module's NPC pick) and
# Lupita (the remaining reserve name) are both genuinely unused m1-m36
```

(`/tmp/es_prior_m36.txt` above is the cached, de-duplicated
`surface: "..."` list across `m{1..36}.ts` built during this brief's own
research — a future agent should rebuild it fresh with:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..36}.ts | sed 's/.*surface: "//;s/"$//' | sort -u`
rather than trust a stale cached copy.)

## What this module does NOT teach

- **No imperative/command forms.** Rejected a third time (m33-header,
  m35-header, now this header) — see the header's own REJECTED section.
- **No impersonal/passive «se»** («se puede», «se vende», «se dice»).
  «se» stays exactly what m17 taught it as (reflexive) — this module does
  not touch or extend that atom's function.
- **No duration/time vocabulary** («tarda», «hora», «minutos», «llega»).
  Real future content, deliberately deferred — see the header's REJECTED
  sections for both duration and train-times candidates.
- **No extension of «ir a + infinitivo»'s person paradigm.** Already fully
  exercised (nosotros in m28 itself, ellos in m33) — nothing left to add.
- **No new supporting nouns or verbs of any kind.** This is a
  zero-new-vocabulary grammar beat — every example sentence recombines
  m3, m5, m9/m18/m28, m10, m12, m16, m33, m34, m35, m36 content against
  the one new phrase atom.
- **No third grammatical function stacked onto «hay» beyond the two it
  already/now carries** (existential main verb, m3; modal-auxiliary half
  of «hay que», this module) — do not introduce, say, «hay que» in a
  question-formation context or any other new syntactic environment this
  module hasn't explicitly scoped.

## Step kinds

Mirrors m35's own non-imageable-grammar-atom pattern, not m36's
image-MCQ-heavy lexicon pattern — «hay que» has no picture (§13.1: a bad
image is worse than no image; an abstract modal phrase gets no vocab
card). Expected shape, one new sentence per grammar point, ≤3 sentence
exposures per step (per CLAUDE.md's lenses):
- **L1**: `infoStep` intro (the minimal-pair deduction: «tengo que
  trabajar» the learner already knows, next to «hay que trabajar» —
  reason out what changed) → forced `sentence_build` production on the
  new phrase → `dialogue_sim` first real use.
- **L2-L6**: interleaved `dialogue_sim`, `sentence_build`,
  discrimination `cloze` (2 taught-atom options: «tengo que» vs «hay
  que», never more) recombining against m34 errand places / m35
  location phrases / m36 transport nouns, each lesson breaking up the
  «hay que» repetition with unrelated review per the interleave doctrine.
- **L7**: `dialogue_sim` starring Marta (fresh NPC, verified zero-usage
  m1-m36) as the primary new-content lesson.
- **L8**: checkpoint (per `checkpoint: 8` in the header).
- **L9**: dedicated cross-recombination lesson (m35/m36 precedent) —
  «hay que» sentences spanning the full m31-m36 lexicon set.
- **L10**: mastery lesson, exempt from the full-sentence-recognition-MCQ
  ban per `moduleBarGuards.ts`'s own `lessons[lessons.length-1]?.id`
  carve-out.

No `typed_translate`, no `silent_letter` (beginner tier, per CLAUDE.md).
`dialogue_sim` remains the favorite step type per the step-type doctrine.

## Hard rules the gates enforce (carried forward + this module's own new one)

All rules carried forward unchanged from m35/m36 (re-verify against the
live gate files at drafting time, don't trust this list as a substitute
for reading the actual test files):

1. `irAtomResolution.test.ts` — zero-tolerance exact-surface credit. This
   module's own two-faced trap (see header's CREDIT TRAP section): a
   sentence with «hay que» credits `["hay que", ...]`, never `["hay",
   "que", ...]` and never a fused `["hay que <verb>"]`; a sentence with
   bare existential «hay» (no «que») credits `["hay", ...]` using the
   ORIGINAL m3 atom, never the new phrase atom.
2. Cross-module RECALL LAW (`es-course-integrity.test.ts`) — any `cue:
   "recall"` step's `targetPhrase` must be voiced verbatim in an earlier
   module.
3. `esSimNpcProvenance.test.ts` — `KNOWN_LEGACY` is SHRINK-ONLY, tail
   confirmed still `m28` through m36 (re-verified this round, no m29-m36
   entries) — this module gets zero legacy leniency. Every NPC word must
   resolve to this module's own atom, a prior atom, a taught conjugation,
   `ES_FUNCTION_WORDS`, or `ES_PROPER_NAMES`.
4. Inv 28 — full-sentence MCQ ban outside L10; correct answers ≤3 tokens
   («el» counts). `esTokens()` drops only length-1 tokens, so «a»/«y»/«o»
   are never cloze options or distractors — not directly relevant to this
   module's own 2-word phrase atom, but the discrimination clozes (tengo
   que / hay que) must still respect the ≤3-token correct-answer cap.
5. Inv 29 — no mid-string sentence-ending punctuation in `listenBuildLit`
   prompts.
6. Same-type-adjacency ban.
7. Build-sim reply tiles are single space-tokens — «hay que» as a build
   tile is ONE tile (the registered surface is the two-word string, tiled
   as a single unit, matching how m33's own «tengo que» tiles).
8. Discrimination clozes on a prior-module word need exactly 2 taught-atom
   options — this module's own central discrimination («tengo que» vs
   «hay que») must never offer a third option.
9. Spanish lists take no comma before «y»/«o».
10. Info cards must not cite untaught words and must not quote a bare
    suffix.
11. `assemble-mod.sh` must run under zsh, not bash/sh.
12. Build tiles are billed exposure (`esSurfaces()` bills cloze options
    and build tiles, not MCQ distractors — decides where a wrong form may
    legally live; not directly load-bearing for this module's single
    invariant phrase, but relevant if any foil sentence tiles «tengo» vs
    «hay» as separate wrong-form tiles).
13. `ILLEGAL_PRESENT_FORMS` tile scan.
14. `esReviewPool.ts` must be regenerated via `gen-es-review-pool.mjs` —
    confirmed this round that the file lives at
    `src/features/languages/es/esReviewPool.ts` (NOT under `curriculum/`
    — a path an earlier pass of this brief's own research got wrong; the
    m36 rows ARE present there, correcting a discrepancy this brief
    almost mis-reported).
15. **This module's own new rule**: any sentence pairing «tengo que» and
    «hay que» in the same discrimination step must differ ONLY in that
    swap (identical subject where a subject is grammatically present,
    identical remaining sentence) — a minimal pair, not two unrelated
    sentences that happen to use different obligation markers. This
    mirrors m35's own minimal-pair discipline for `cerca`/`lejos`/`al
    lado de` foils and is the direct mechanical expression of this
    module's own central deduction (see header, WHY THIS MODULE NOW §4).

## SIM NPC lines — safe word list for m37

Legal in any m37 NPC line: this module's own atom (`hay que`), any atom
from m1-m36, any taught verb conjugation, `ES_FUNCTION_WORDS`, and
`ES_PROPER_NAMES`. New NPC for this module: **Marta** (verified zero-usage
across the full shipped course m1-m36 — the stronger of the two remaining
reserve names; `lupita` stays in reserve for a future module). Marta's
own lines should lean on the m34 errand-place / m36 transport-noun
recombination set, since «hay que + infinitivo» sentences about civic/
errand obligations ("hay que pagar en el banco," "hay que comprar el
boleto en la estación") are this module's most natural register.

## Usage-note budget

Per CLAUDE.md's lenses: ~3 short lines, must quote the course sentence it
explains, depth behind a "see the rule" expander. This module's own L1
usage note should do exactly one job: name the subjectless-ness of «hay
que» explicitly ("no «yo», no «tú» — it never changes") since that is the
single highest-risk transfer error (see header's discrimination section).
Do not use the usage note to re-explain «tengo que» — the learner already
owns that; only name what's DIFFERENT.

## 10-lesson plan

| L | Content | New | Step mix |
|---|---|---|---|
| L1 | Minimal-pair deduction: «tengo que trabajar» → «hay que trabajar» | `hay que` (intro) | infoStep, sentence_build, dialogue_sim |
| L2 | «hay que» + m34 errand places (banco, farmacia, etc.) | — | dialogue_sim, cloze, sentence_build |
| L3 | Interleaved review break (m31/m32 recall) + light «hay que» recombination | — | recall cloze, dialogue_sim |
| L4 | «hay que» + m35 location phrases («hay que ir, está cerca») | — | sentence_build, dialogue_sim |
| L5 | Discrimination drill: «tengo/tienes/tiene que» vs «hay que» minimal pairs | — | 2-option cloze ×3, dialogue_sim |
| L6 | «hay que» + m36 transport nouns («hay que tomar el metro») | — | sentence_build, cloze, dialogue_sim |
| L7 | Marta dialogue_sim — civic/errand obligations, primary new-content lesson | — | dialogue_sim (extended) |
| L8 | Checkpoint | — | mixed review, gate-graded |
| L9 | Cross-recombination — «hay que» sentences spanning m31-m36 lexicon | — | sentence_build, dialogue_sim, cloze |
| L10 | Mastery (L10 full-sentence-recognition-MCQ exemption applies) | — | mixed mastery mix |

## What to report back

After drafting: lesson count (10 expected), atom count (1 expected),
whether any discrimination step accidentally offered a 3rd option,
whether the credit-trap's two faces were both respected (grep the
assembled IR for `"hay"` and `"que"` appearing SEPARATELY inside any
`atoms:` array — fail if found outside a bare-existential-«hay» sentence),
confirmation Marta's lines resolve entirely to the safe word list, final
ES suite pass count (re-read fresh, don't quote a stale number from this
brief), and confirmation the review pool picked up the new `hay que` row.

## Exact pipeline commands

```
export LINGO_ROOT=$PWD   # re-run in every new shell — cwd resets

# 1. Author lesson fragments m37-L1.yaml .. m37-L10.yaml and
#    m37-placement.yaml in docs/es-ir-sources/, following m37-header.yaml's
#    newAtoms: block and this brief's lesson plan.

# 2. (Optional, recommended) sanity-check a fragment in isolation before
#    assembling the full module — stub module unchanged at m15 (confirmed
#    this round):
bash docs/es-ir-sources/check-frag.sh m37-L1.yaml
#    (needs m37-placement.yaml on disk first, per step 1)

# 3. Assemble the full module (MUST be zsh, not bash/sh):
zsh docs/es-ir-sources/assemble-mod.sh m37
#    writes src/features/languages/es/curriculum/ir/m37.ir.yaml

# 4. Compile IR → TS (module-name argument, NOT a file path):
node scripts/compile-ir-es.mjs m37
#    writes src/features/languages/es/curriculum/m37.ts

# 5. Register the module (7 positional args — prev, new, title, eyebrow,
#    summary, colorFrom, colorTo — signature re-verified against
#    register-mod.py's actual source this round:
#    `prev, new, title, eyebrow, summary, cfrom, cto = sys.argv[1:8]`):
python3 docs/es-ir-sources/register-mod.py m36 m37 "Hay que trabajar" \
  "<eyebrow — finalize at drafting time>" \
  "<summary — finalize at drafting time>" \
  "#1e40af" "#172554"
#    Touches 5 files / 11 edit points:
#      curriculum/index.ts       — 3 edits (card block, import, lesson-map)
#      grammarHelpers.ts         — 1 edit (ES_MODULE_ORDER)
#      courseAtoms.ts            — 3 edits (import, EsAtomSource union, spread)
#      curriculum/es-quality.test.ts — 2 edits (incl. ES_M37_CHECKPOINT_INDEX)
#      placementBank.ts          — 2 edits
#    Verify all 11 edits landed correctly before moving on — read each
#    touched file's diff, don't assume the script's string-match/replace
#    succeeded silently. Verify accented characters and guillemets intact.

# 6. Regenerate the review pool (confirmed this round that m36's own rows
#    ARE present at src/features/languages/es/esReviewPool.ts — do NOT
#    skip this step for m37 either):
node scripts/gen-es-review-pool.mjs
#    Confirm it appended one row for "hay que" by grepping
#    esReviewPool.ts afterward — expect the same {surface, gloss, kind,
#    fromModule, partOfSpeech} shape as m36's own five rows.

# 7. Hand-write curriculum/m37.test.ts, calling registerEsModuleBarGuards()
#    (see m35.test.ts/m36.test.ts for the exact template) plus bespoke
#    pins for: the hay-que credit-trap (grep the assembled IR for any
#    ["hay","que",...] split-credit or ["hay que <verb>"] over-fused
#    string inside an atoms: array — fail if found), the tengo-que/hay-que
#    minimal-pair discrimination check, and a dialogue_sim NPC-provenance
#    check for Marta's lines.

# 8. Run the guard suite (moduleBarGuards.ts is NOT directly runnable —
#    always go through the mN.test.ts file):
npx vitest run src/features/languages/es/curriculum/m37.test.ts --project curriculum

# 9. Run the broader ES gate suites:
npx vitest run src/features/languages/es --project curriculum

# 10. Audio (once content is gate-clean):
#     follow docs/es-ir-sources/tts-chain.sh per m35/m36 precedent —
#     confirm exact invocation from that script's own header before running.

# 11. Full ES suite pass, confirm count matches expectation before
#     reporting back — re-read the actual count at ship time, don't quote
#     a stale one from this brief.
```

## Vocab card art

No new emoji needed — «hay que» is a non-imageable grammar phrase (per
§13.1, a bad image is worse than no image), matching m33's own «tengo
que» and m35's own `cerca`/`lejos`/`al lado de`, none of which carry a
vocab-card emoji. **Zero emoji to vendor this module.**

## Decisions inferred (recorded, never parked)

- **Structure**: «hay que + infinitivo», over all nine dispatch-task
  candidates, per the header's own WHY THIS MODULE NOW section (full
  4-point reasoning there — not repeated here).
- **Atom count**: 1 (`hay que`, phrase, invariant). Fewer than every
  prior grammar beat this course has shipped (m31: 1 verb + irregular
  duele/duelen; m33: 1 phrase + 2-way person fan-out; m35: 3 atoms) — the
  tightest possible grammar beat, deliberately, because «hay» never
  conjugates.
- **Registration shape**: phrase atom, not two separately-credited
  function words — direct precedent match to m33's own «tengo que»,
  per the compositional-vs-idiomatic test in `authoring-rules.md`.
- **Title**: "Hay que trabajar" — a deliberate one-word swap on m33's own
  title "Tengo que trabajar," making the personal-vs-impersonal contrast
  visible before a single lesson step loads. No alternative title was
  seriously weighed once this echo was identified — it directly serves
  the module's own central deduction.
- **NPC**: Marta — verified zero-usage across the full course m1-m36 (the
  stronger freshness claim of the two candidates weighed; Lupita, also
  zero-usage, held in reserve for a future module rather than spent here).
- **Accent**: `#1e40af` → `#172554` (deep official-notice indigo/navy).
  Verified non-colliding with all 35 existing accent pairs and visually
  distinct from the existing blue/indigo cluster and from all four most
  recent modules (m33-m36). Chosen over the alternative candidate
  (`#ca8a04`→`#713f12`, mustard/civic-amber) because the deeper
  navy reads more like "an official rule printed in ink" (a posted
  notice, generally-applicable law) — a closer metaphor match for
  IMPERSONAL obligation than the warmer amber, which read more like a
  caution/warning color, a connotation this module's content (routine
  civic obligations, not warnings) doesn't want.
- **Checkpoint position**: L8, matching every prior module's own
  convention (`checkpoint: 8` in the header).
- **L9 cross-recombination lesson**: included, matching m35/m36
  precedent, rather than compressing to 9 lessons — the recombination
  value against 8-9 prior modules (see header) is high enough to earn the
  dedicated lesson.
- **What m34-m36 briefs deferred, checked against this module's own
  scope**: m34-header deferred transport (reversed by m36, not relevant
  here); m35-header deferred poder/querer-family extensions and
  imperative tú (both re-confirmed still deferred by this header, for the
  same reasons); m36-brief did not explicitly defer anything this module
  claims. No open deferral from m34-m36 overlaps with this module's scope.

## Claims marked UNVERIFIED

1. UNVERIFIED — the exact eyebrow/summary text for `register-mod.py`'s
   invocation (step 5 above) was left as a placeholder
   (`<eyebrow — finalize at drafting time>`) rather than fully drafted
   prose, since house convention (confirmed in m35-brief/m36-brief) is
   for the drafting agent to finalize exact marketing copy alongside the
   lesson fragments, not for the dispatch brief to pre-commit it.
2. UNVERIFIED — final ES suite pass count. This brief does not run the
   suite (read-only research mandate); the count must be re-read fresh at
   drafting/ship time, not assumed from any number in this document.
3. UNVERIFIED — whether `docs/es-ir-sources/tts-chain.sh`'s exact
   invocation syntax has changed since m35/m36; this brief did not read
   that script directly (out of scope for a brief-writing pass focused on
   the IR/registration pipeline) and instructs the drafting agent to
   confirm it from the script's own header before running.
4. UNVERIFIED — whether "hay que" as a single build/cloze tile renders
   correctly as one two-word tile in the actual UI (matching how m33's
   own "tengo que" tile is assumed to render) — inferred from the m33
   precedent but not independently re-verified against rendered UI output
   this round (out of scope for a read-only research pass with no dev
   server started).
5. UNVERIFIED — the exact wording of «hay que»'s `meaningEn` gloss in the
   header ("one has to, it's necessary to") is this brief's own best
   rendering, not lifted verbatim from any existing dictionary/gloss
   source in the repo; a drafting agent should sanity-check it reads
   naturally across all ten lessons' worth of sentences before treating it
   as final.
