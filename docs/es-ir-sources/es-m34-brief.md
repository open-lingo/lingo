# ES m34 dispatch brief — errands around town (lexicon break)

**Status (2026-09-10):** m33 landed (10 lessons, atom «tengo que», 121
clips, ES suite 2421/1). m32 landed before it (clothing round two). m34 —
this module — has NOT been started. This brief and `m34-header.yaml` are
the FIRST artifacts for it; nothing downstream exists yet (no `m34*.yaml`
fragments, no `ir/m34.ir.yaml`, no `curriculum/m34.ts`, no `m34.test.ts`).

[[concurrent-sessions-same-repo]] applies: another Claude session may be
editing this same repo tree right now. At time of writing, a reviewer is
active on m33's fragment files — **read them if useful, never modify
them.** FR/JA/KO lanes may be running in parallel on other courses — not
your concern, don't touch their files. Before you run ANY pipeline command
that writes to a shared file (`courseAtoms.ts`, `grammarHelpers.ts`,
`curriculum/index.ts`, `placementBank.ts`, `es-quality.test.ts`,
`esReviewPool.ts`), re-`grep`/re-read the section you're about to touch —
if it's changed since this brief was written, adapt around the change,
don't fight it.

## Files — read in this order

1. **This file.**
2. **`m34-header.yaml`** (same directory) — READ THIS FIRST once you start
   drafting. It is denser than this brief and carries the full WHY/
   REJECTED/SCOPE/recombination reasoning as inline YAML comments. This
   brief restates the operational parts (pipeline commands, hard rules,
   lesson plan) but the header is the source of truth for *why* this
   module looks the way it does.
3. `docs/es-ir-sources/es-m33-brief.md` + `m33-header.yaml` — most recent
   precedent, corrected several errors from m32's own brief (see "Hard
   rules" below for what carries forward).
4. `docs/es-ir-sources/es-m32-brief.md` + `m32-header.yaml` — closest
   STRUCTURAL precedent for m34 (both are lexicon-break modules with
   image-MCQ-as-introduction for every new noun, no new grammar).
5. `docs/es-ir-sources/authoring-rules.md` — two hard rules: dialogue_sim
   NPC-line provenance, "agreement is not a new atom."
6. `docs/lesson-authoring-guide.md` §13 — card-type rubric (13.1),
   image-MCQ-as-introduction (13.2, THE pattern this module uses for all
   five nouns), just-in-time grammar teach (13.3, not needed here since
   there is no new grammar).
7. `docs/pedagogy-principles-2026-07-05.md`,
   `docs/course-design-learnings-2026-08-21.md` — background doctrine,
   skim for anything touching lexicon-break modules or interleaving.
8. `CLAUDE.md` — "What we're building" (top) and "The lenses we teach
   from" (~line 131-180).
9. Shipped fragments/compiled files actually read for this brief:
   `curriculum/m9.ts` (full atom list — the places-in-town PRIOR set this
   module is a sequel to), `curriculum/m30.ts` (body nouns, the m31
   pain-frame recombination target), `curriculum/m32.ts` (first ~60
   lines — structural precedent, `vocabMcq` import/usage pattern),
   `curriculum/m33.ts` (first ~80 lines plus spot checks — GENERATED file
   header format, `mis`/`amigos` as build-tile-only distractors never
   credited).

## The decision this module resolves

Course rhythm since the last checkpoint: m30 body (break) → m31 «me
duele/duelen» (grammar, one beat, riding m30's own nouns) → m32 clothing
round two (break) → m33 «tengo que + inf» (grammar, one beat). The break
due after m33 is on schedule. m34 is that break: **zero new grammar, 4-6
new imageable nouns**, taught by image-MCQ intro (§13.2) and recombined
against every frame m28-m33 already registered.

Six candidate domains were weighed against the actual atom registry (not
assumed from the task's own framing) — house/rooms, kitchen/tableware,
transport, places in town, school/office, nature/outdoors. Full
reasoning, grep evidence, and rejection rationale for all six is in
`m34-header.yaml`'s WHY/REJECTED sections. Short version: **errands and
essential services around town** — `banco` (bank), `farmacia` (pharmacy),
`hospital` (hospital), `correo` (post office), `supermercado`
(supermarket) — won on:

- **Full virginity**, grep-verified zero hits across m1-m33 for all five
  surfaces AND all five target emoji.
- **Highest recombination value of any candidate**, reaching FOUR
  independent PRIOR/adjacent frames: `voy`/`vas`/`a`/`al` (m9, bare
  motion), `necesito` + `ir` (m16+m28, need-to-go), `tengo que` + `ir`
  (m33+m28, obligation-to-go — the freshest grammar this course has,
  since m34 is the module immediately after m33), and `duele`/`duelen` +
  m30's body nouns (m31, an independent and thematically natural
  "me duele la mano → tengo que ir al hospital" pain-frame tie). No other
  candidate domain reaches more than two of these.
- A genuine (not forced) tie to `comprarlo`/`comprarla`/`comprarlos`
  (m29) through `supermercado` as a shopping DESTINATION for an
  already-PRIOR object noun bought there — e.g. "necesito leche, voy al
  supermercado a comprarla." **None of this module's five nouns can
  themselves fill the fused-clitic object slot** — you cannot "comprarlo"
  a bank. Do not force this; see hard rules below.

`m32-header.yaml`'s own claim that "places in town" is "fully PRIOR since
m9" was checked against a grep that only covered
`cine`/`mercado`/`playa`/`tienda`/`trabajo`/`autobús`/`escuela`/`parque`
— it never checked `banco`/`farmacia`/`hospital`/`correo`/`supermercado`.
Those five are the genuinely virgin subset, and they happen to be exactly
the errands/services frame the original task's own example sentence
pointed at ("tengo que ir al banco / voy a la farmacia / me duele... →
hospital").

## PRIOR vocabulary — re-runnable greps

```
export LINGO_ROOT=$PWD  # from the worktree root
grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..33}.ts | sort -u > /tmp/es_prior_surfaces.txt
grep -iE '^surface: "(banco|farmacia|hospital|correo|supermercado)"$' /tmp/es_prior_surfaces.txt
# → zero hits, confirms all five are virgin
grep -o 'emoji: "[^"]*"' src/features/languages/es/curriculum/m{1..33}.ts | sort -u | grep -E '🏦|💊|🏥|📮|🏬'
# → zero hits, confirms all five target emoji are unused
```

Places-in-town PRIOR set (m9, full atom list): `voy`, `vas`, `a`, `al`,
`adónde`, `parque` 🌳, `tienda` 🏪, `escuela` 🏫, `cine` 🎬, `playa` 🏖️,
`mercado` 🛒, `trabajo` 💼, `autobús` 🚌, `ahora`.

Body-part PRIOR set (m30, full atom list, for the L9 pain-frame lesson):
`mano` f ✋, `pie` m 🦶, `brazo` m 💪, `pierna` f 🦵, `ojo` m 👁️, `boca` f
👄, `nariz` f 👃 (irregular plural `narices`). Note: **no `cabeza`
(head)** is registered — do not assume it in a pain-frame sentence.

Other frames used: `necesito`/`necesitas`/`necesita` (m16), `ir` bare
infinitive (m28), `tengo que` + full bare-`tener` paradigm (m33),
`comprarlo`/`comprarla`/`comprarlos` (m29), `duele`/`duelen` (m31),
`leche` (m11, the worked "necesito leche → voy al supermercado a
comprarla" example — verify `leche`'s exact registered surface/gender
before using it; re-grep, don't assume).

## What this module does NOT teach

- No new verb morphology, no new tense, no new pronoun. `ir` stays bare
  infinitive after `necesito`/`tengo que` (already legal per m28); `voy`/
  `vas` stay conjugated-after-subject only (already legal per m9).
- No `tomar` (to take/catch — would be needed for a transport domain;
  that's exactly why transport was rejected, see header).
- No `oficina` (office) — redundant against `trabajo`'s (m9) existing
  "workplace" territory at this course's level; see header's
  within-domain rejection.
- No `biblioteca` (library) — clean noun, but its only natural emoji 📚
  collides with `estudiar`'s (m10) already-registered atom emoji; see
  header.
- No fused clitic directly on any of this module's five nouns (see
  "comprarlo fit" note above and hard rules below).

## Step kinds

All five nouns: **image-MCQ-as-introduction** (§13.2) for their debut
step, exactly the m32 pattern (`vocabMcq()` from `grammarHelpers.ts`,
signature `vocabMcq(idPrefix, target: {surface, meaningEn, emoji?},
distractorPool: {surface, emoji?}[], ...)`). No new grammar step is
needed anywhere in this module — every recombination sentence uses
`build()` (`grammarHelpers.ts`, `build(id, prompt, target, tiles[],
correctOrder[], atomsCredit[])`) or `cloze`/`listeningCompSentence`/
`speaking` factories exactly as m32/m33 use them.

## Hard rules the gates enforce (carried forward + corrected this round)

1. **`atoms:` credit is zero-tolerance exact-surface** (per
   `irAtomResolution.test.ts`). A sentence using «al banco» credits
   `["banco"]` (plus `a`+`al` if those are separately credited elsewhere
   per m9 convention — check m9's own usage before assuming). A PLURAL
   sentence («los hospitales») still credits the registered SINGULAR
   surface `["hospital"]`, never `["hospitales"]`. Gender/plural folding
   in `esRegularPlurals()`/`getEsGenderCanon()` applies ONLY to the
   bar-guard scope check (`looksSpanish`/`lintFullSentenceMcqs`), never to
   `atoms:` credit arrays. This is the same trap m33's brief flagged for
   "tienes que"-style bigrams — here the analogous trap is crediting a
   plural or gendered SURFACE FORM instead of the registered singular.
2. **"Agreement is not a new atom"** (`authoring-rules.md`) — all five
   nouns are regular; their plurals fold via `esRegularPlurals()`
   (`moduleBarGuards.ts` ~166-174) without separate registration, traced
   line-by-line this round (see header): `banco`/`correo`/`supermercado`/
   `farmacia` are vowel-final → `+s`; `hospital` is consonant-final
   (neither `z` nor `ón`) → `+es` (`hospitales`). This resolves m32's own
   UNVERIFIED item #5 — the fold is now confirmed correct for these five
   nouns specifically, not just assumed from the general rule. Scope
   check only, per rule 1 above.
3. **Build tiles are billed exposure** ([[es-which-slots-are-billed]]) —
   `esSurfaces()` bills cloze options and build tiles, NOT MCQ
   distractors. Any surface placed as a build-tile distractor (e.g. a
   PRIOR word used to pad a tile bank) counts as exposure and must
   itself be a legally registered surface at that point in the course.
4. **«lo»/«la»/«los»/«las» get no standalone registration** when used
   only as fused clitics inside `comprarlo`/`comprarla`/`comprarlos` (m29
   convention, unchanged).
5. **Full-sentence MCQ ban** (invariant 28, `lintFullSentenceMcqs` in
   `moduleBarGuards.ts`) — correct MCQ answers must be ≤3 tokens. The
   FINAL lesson of the module (mastery, L10) is exempt — derived via
   `lessons[lessons.length - 1]?.id` inside the lint, not a hardcoded
   lesson number (`moduleBarGuards.ts` ~622). Do not lean on this
   exemption outside L10.
6. **Cross-module RECALL LAW** (`es-course-integrity.test.ts`) — any
   step with `cue: "recall"` and a `targetPhrase` must have that exact
   phrase voiced verbatim in an EARLIER module. Every recombination
   sentence in this module (voy al banco, necesito ir a la farmacia,
   tengo que ir al hospital, me duele X → tengo que ir al hospital, etc.)
   is fine to use as fresh content but must not be tagged `cue: "recall"`
   pointing at nothing — only tag recall for phrasing that genuinely
   repeats something m1-m33 already voiced.
7. **`esSimNpcProvenance.test.ts` — ZERO legacy allowance for m34.**
   `KNOWN_LEGACY` is shrink-only and scoped to m1-m10, m20, m22-m28; m29+
   (including this module) get no reaction-word leniency. Confirmed
   unregistered-and-unusable for m34: `algo` (legacy-allowed ONLY at m7,
   `KNOWN_LEGACY.m7`), `pasa` (not legacy-allowed anywhere, zero
   registered hits course-wide — "¿qué pasa?" is not free filler here).
   Every NPC line's words must resolve to: this module's own 5 atoms,
   any PRIOR atom, a taught verb conjugation, `ES_FUNCTION_WORDS`, or
   `ES_PROPER_NAMES`.
8. **`ES_PROPER_NAMES`** (`moduleBarGuards.ts` line ~90): ana, diego,
   carlos, maría/maria, sofía/sofia, luis, elena, pedro, juan, rosa,
   miguel, carmen, lupita, jorge, marta — plus learner persona Sam (every
   sim reply speaks as Sam). **Correction to the task's own framing
   claim:** "Carlos" IS an allowed name — `carlos` is in
   `ES_PROPER_NAMES` (verified by direct grep,
   `moduleBarGuards.ts:91`), and `esTokens()` lowercases before matching
   (`moduleBarGuards.ts:63-65`), so case is not an issue. If an earlier
   m33-era note said otherwise, it was wrong; don't propagate it.
   Recently-used cast (grep against m28-m33's own `speaker:` fields): Ana
   (m30), Diego (m28), Sofía (m28), Carmen (m31), Luis (m31). Carlos is
   allowed but unused so far — free to use.
9. **`es-quality.test.ts`** — separate `dialogue_sim` reply-word
   provenance gate from #7 above (NPC lines vs. Sam's own reply lines are
   checked by different gates; don't conflate them). Also owns
   `ES_M{N}_CHECKPOINT_INDEX` — add `ES_M34_CHECKPOINT_INDEX` pointing at
   the L8 checkpoint lesson.
10. **`assemble-mod.sh` is zsh-only** (uses `${(on)FILES}` glob syntax).
    Run it with `zsh assemble-mod.sh`, not `bash`/`sh`.
11. **Every new imageable noun needs its emoji SVG vendored** into
    `src/pub/noto-emoji/svg/emoji_u{codepoint}.svg`. **This module needs
    ZERO vendoring** — all five target files already exist on disk
    (verified, see "Vocab card art" below). Re-verify at ship time
    regardless (a concurrent lane could touch that directory).
12. **ILLEGAL_PRESENT_FORMS tile scan** — any build-tile bank containing
    a verb form must not include an illegal/unconjugated-wrong form as a
    non-distractor trap; standard scan, same as m32/m33 (see UNVERIFIED
    below — no bespoke extension needed this module, all verb forms used
    are already-registered PRIOR conjugations, not new ones).
13. **`moduleBarGuards.ts` is not directly runnable via vitest.** It has
    no top-level `describe`/`it` — only an exported
    `registerEsModuleBarGuards()` function, called from each `mN.test.ts`
    (see `m34.test.ts` template below). Run the guards via `npx vitest
    run src/features/languages/es/curriculum/m34.test.ts`, never by
    pointing vitest at `moduleBarGuards.ts` itself. This resolves the
    UNVERIFIED question both m32-brief and m33-brief left open.

## SIM NPC lines — safe word list for m34

Safe: this module's own 5 nouns, `voy`/`vas`/`a`/`al`/`adónde` (m9),
`necesito`/`necesitas`/`necesita` (m16), `ir` (m28), `tengo`/`tienes`/
`tiene` + `que` (m33), `duele`/`duelen` (m31) + m30 body nouns,
`comprarlo`/`comprarla`/`comprarlos` (m29), any `ES_FUNCTION_WORDS`
member, any `ES_PROPER_NAMES` member. Unsafe/confirmed-unregistered:
`algo`, `pasa`, and anything else not on the above list or in a PRIOR
module — re-grep `/tmp/es_prior_surfaces.txt` before using any word not
explicitly listed here.

## Usage-note budget

Per CLAUDE.md's "explanations budget ~3 short lines" — each new noun's
`infoStep`/usage note stays ≤3 short lines. `hospital`'s masculine gender
despite the consonant ending is worth one line (same pattern as «el
hotel», not a new rule to teach). The others need no special note beyond
gender + article.

## 10-lesson plan

| Lesson | Content |
|---|---|
| L1 | Debut `banco` + `farmacia` via image-MCQ; recombine with `voy a`/`al` (m9). |
| L2 | Debut `hospital`; recombine with `necesito ir a` (m16+m28). |
| L3 | Debut `correo`; recombine with `voy a` + `al`/`a la` gender discrimination across L1-L3 nouns. |
| L4 | Debut `supermercado`; recombine with `comprarlo`-family via a PRIOR shopping object (e.g. `leche`, m11) as destination-object pairing. |
| L5 | Mixed recombination: all 5 nouns × `voy a`/`necesito ir a`, discrimination-heavy. |
| L6 | `tengo que` + `ir` + all 5 nouns (m33 recombination); include the "never conjugate the second verb" foil (*"tengo que voy..."*) as a distractor, never a correct answer. |
| L7 | Dialogue_sim: an errands-around-town conversation using 3-4 of the nouns; NPC-line provenance per hard rule #7. |
| L8 | **Checkpoint** — cumulative mixed review, all 5 new atoms + PRIOR m9/m16/m28/m33 frames. |
| L9 | Dedicated pain-frame lesson: `duele`/`duelen` (m31) + m30 body nouns → `tengo que ir al hospital`/`a la farmacia`, mirroring m32's own L9 shape. |
| L10 | Mastery — full-sentence MCQ exemption lesson (invariant 28), heaviest recombination density. |

## What to report back

1. Files written (this brief + header).
2. Theme chosen + one-line why (errands/essential services; highest
   recombination value of six candidates weighed).
3. Atom count + genders (5 atoms: banco m, farmacia f, hospital m,
   correo m, supermercado m).
4. Emoji vendoring status (zero needed — list the 5 codepoint filenames
   and confirm all already present).
5. Rejected alternatives (biblioteca, oficina — within-domain; kitchen/
   tableware, transport, house/rooms, school/office, nature/outdoors —
   cross-domain) with one-line reasons each.
6. Any UNVERIFIED claims remaining (see below — should be fewer than
   m32/m33's own lists, since two of their standing UNVERIFIED items are
   resolved this round).

## Exact pipeline commands

```
cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1
export LINGO_ROOT=$PWD

# 1. Author lesson fragments m34-L1.yaml .. m34-L10.yaml and
#    m34-placement.yaml in docs/es-ir-sources/, following m34-header.yaml's
#    newAtoms: block and this brief's lesson plan.

# 2. (Optional, recommended) sanity-check a fragment in isolation before
#    assembling the full module:
zsh docs/es-ir-sources/check-frag.sh m34 <tag 1-9> docs/es-ir-sources/m34-L1.yaml
#    (sandwiches the fragment between stub L1/L10 from an earlier module
#    for an isolated compile --check; see check-frag.sh's own header for
#    exact usage — confirm current stub-module choice before running.)

# 3. Assemble the full module (MUST be zsh, not bash/sh):
zsh docs/es-ir-sources/assemble-mod.sh m34
#    writes src/features/languages/es/curriculum/ir/m34.ir.yaml

# 4. Compile IR → TS (module-name argument, NOT a file path):
node scripts/compile-ir-es.mjs m34
#    writes src/features/languages/es/curriculum/m34.ts

# 5. Register the module (7 positional args — prev, new, title, eyebrow,
#    summary, colorFrom, colorTo):
python3 docs/es-ir-sources/register-mod.py m33 m34 \
  "Necesito ir al banco" \
  "<eyebrow — confirm house style from m32/m33's own index.ts card>" \
  "<one-line summary of the module>" \
  "#d97757" "#92400e"
#    Touches 5 files / 11 edit points:
#      curriculum/index.ts       — 3 edits (card block, import, lesson-map)
#      grammarHelpers.ts         — 1 edit (ES_MODULE_ORDER)
#      courseAtoms.ts            — 3 edits (import, EsAtomSource union, spread)
#      curriculum/es-quality.test.ts — 2 edits (incl. ES_M34_CHECKPOINT_INDEX)
#      placementBank.ts          — 2 edits
#    Verify all 11 edits landed correctly before moving on — read each
#    touched file's diff, don't assume the script's string-match/replace
#    succeeded silently.

# 6. Regenerate the review pool (do NOT skip — m32's own rows were found
#    missing after m33 shipped; this step must run for m34's own atoms):
node scripts/gen-es-review-pool.mjs
#    Confirm it appended rows for banco/farmacia/hospital/correo/supermercado
#    by grepping esReviewPool.ts afterward.

# 7. Hand-write curriculum/m34.test.ts, calling registerEsModuleBarGuards()
#    (see m33.test.ts or m32.test.ts for the exact template) plus any
#    bespoke pins for this module's own sentences.

# 8. Run the guard suite (moduleBarGuards.ts is NOT directly runnable —
#    always go through the mN.test.ts file):
npx vitest run src/features/languages/es/curriculum/m34.test.ts

# 9. Run the broader ES gate suites:
npx vitest run src/features/languages/es/curriculum/irAtomResolution.test.ts
npx vitest run src/features/languages/es/curriculum/es-course-integrity.test.ts
npx vitest run src/features/languages/es/curriculum/esSimNpcProvenance.test.ts
npx vitest run src/features/languages/es/curriculum/es-quality.test.ts

# 10. Audio (once content is gate-clean):
#     follow docs/es-ir-sources/tts-chain.sh per m32/m33 precedent —
#     confirm exact invocation from that script's own header before running.

# 11. Full ES suite pass, confirm count matches expectation before
#     reporting back (m33 landed at ES suite 2421/1 — m34 will add to that).
npx vitest run src/features/languages/es
```

## Vocab card art

**Zero vendoring required.** All five target emoji SVGs are already
present on disk:

```
ls src/pub/noto-emoji/svg/ | grep -iE "^emoji_u(1f3e6|1f48a|1f3e5|1f4ee|1f3ec)"
# emoji_u1f3e6.svg   🏦 banco
# emoji_u1f48a.svg   💊 farmacia
# emoji_u1f3e5.svg   🏥 hospital
# emoji_u1f4ee.svg   📮 correo
# emoji_u1f3ec.svg   🏬 supermercado
```

Re-verify this at ship time — a concurrent lane could in principle touch
`src/pub/noto-emoji/svg/`.

## Decisions inferred (recorded, never parked)

- **Theme:** errands/essential services around town (banco, farmacia,
  hospital, correo, supermercado) — chosen over kitchen/tableware,
  transport, house/rooms, school/office, nature/outdoors on
  recombination-value grounds (reaches m9, m16, m28, m29, m31, AND m33 —
  no other candidate reaches more than two).
- **Atom count:** 5 (within the task's ≤6 ceiling). A sixth candidate
  (`biblioteca`) was found and explicitly rejected (emoji collision with
  m10's `estudiar`/📚), not silently dropped to hit a round number.
  `oficina` was also found and rejected (redundant against `trabajo`).
- **Title:** "Necesito ir al banco" — uses the `necesito` + `ir` frame
  (m16+m28) rather than `voy al banco`, deliberately signaling this
  module's obligation/need framing rather than repeating m9's own bare
  motion title style.
- **Accent:** `#d97757` → `#92400e` (terracotta/clay), verified against
  all 33 existing `accent:` pairs for zero collision, chosen to read as
  "brick municipal buildings" without over-committing to any single
  institution.
- **`hospital`'s gender:** masculine despite the consonant ending
  (pattern-matches «el hotel»; not a new rule, one usage-note line).
- **`supermercado`'s emoji:** 🏬 (department-store glyph) instead of the
  naive-choice 🛒, specifically to avoid colliding with `mercado`'s (m9)
  already-registered 🛒.
- **`comprarlo`-family recombination:** reaches this module ONLY through
  `supermercado` as a shopping destination for an already-PRIOR object
  noun (e.g. `leche`), never as a fused clitic on any of this module's
  own five nouns. Recorded explicitly so a drafting agent doesn't try to
  force "comprarlo" onto `banco`/`farmacia`/`hospital`/`correo`.
- **L9 pain-frame lesson:** placed at L9 (not earlier), deliberately
  mirroring m32's own L9 shape, to give the module's two health-adjacent
  nouns (`farmacia`, `hospital`) a dedicated non-checkpoint recombination
  slot after the L8 checkpoint has already exercised the base frames.

## Claims marked UNVERIFIED

1. **Eyebrow/summary exact string + escaping for `register-mod.py`'s
   argv** — the exact house-style phrasing for this module's eyebrow and
   summary strings wasn't finalized in this brief (left as a placeholder
   in the pipeline commands above); confirm current house style by
   reading 2-3 recent cards in `curriculum/index.ts` directly before
   drafting the literal strings, and confirm shell-quoting behavior for
   any accented characters (á in `farmacia`'s own hint text, not the
   argv strings themselves, so likely moot — but check `título`-style
   fields if the summary references any noun with an accent).
2. **`leche`'s exact registered surface/gender** — used as the worked
   example for the `comprarlo`+`supermercado` recombination sentence in
   both this brief and the header; re-grep `/tmp/es_prior_surfaces.txt`
   or `m11.ts` directly to confirm the exact surface string and gender
   before drafting L4, rather than trusting this brief's paraphrase.
3. **`check-frag.sh`'s current stub-module choice** — the script
   sandwiches a fragment between stub L1/L10 content from an earlier
   module for isolated compile-checking; this brief did not re-verify
   which module it currently stubs from (m32-brief's own read only
   covered the first ~15 lines). Read the full script before running it
   in step 2 of the pipeline.
4. **Whether a bespoke `ILLEGAL_PRESENT_FORMS`-style scan is needed for
   this module's own verb recombination** — current assessment (see hard
   rule #12) is NO, since every verb form used (`voy`/`vas`, `necesito`,
   `tengo que`, `ir`, `duele`/`duelen`) is an already-registered PRIOR
   conjugation, not a new one this module introduces. Flagged as
   UNVERIFIED rather than certain because the standard scan's exact
   scope/config wasn't re-read line-by-line for this brief — confirm
   against the scan's own source before assuming no bespoke extension is
   needed.
