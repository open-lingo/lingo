# ES m30 drafting brief — «Tengo los ojos azules» (the body)

This brief tells lesson-drafting agents what m30 teaches, what it must
never teach, and exactly how to check their own work before handing it
back. Every claim below was checked against the actual code and content
in this repo — grep the cited commands yourself if you doubt a number.

**Worktree note:** work inside the worktree this brief was written in.
`cd` there and `export LINGO_ROOT=$PWD` before running anything. Do not
touch any other worktree or the main tree — a reviewer may be editing
other lanes concurrently.

**m29 status note:** m29 is fully landed and clean. `git log --oneline
-3` on this worktree shows `1c17bdc5` "ledger: ES m29 review clean" and
`524d36ba` "ledger: ES agreement fix + m29 landed" at HEAD; all 10
`m29-L*.yaml` fragments are present on disk; `ES_M29_CHECKPOINT_INDEX` is
imported and mapped in `es-quality.test.ts`; `ES_MODULE_ORDER` in
`grammarHelpers.ts` ends `..., "m27", "m28", "m29"`. m30 is not yet
registered anywhere — that is expected, `register-mod.py` is what adds
it (step 5 below). Proceed with normal confidence; no special caution
needed beyond the usual "verify before you trust a prior brief's claim"
discipline this doc itself had to apply to m27/m28's own house-vocabulary
framing (see "Decisions inferred" below).

## The decision this module resolves

m28 and m29 both taught grammar (near-future «ir a + inf», then clitic-
on-infinitive placement). Per this course's interleave rhythm
([[interleave-dont-block-teach]] — CLAUDE.md's lenses, and
`docs/course-design-learnings-2026-08-21.md`), two grammar modules back
to back means the next module should be a lexicon break: zero new verb
morphology, pure vocabulary recombined against PRIOR grammar.

m29-header.yaml's own "WHY THIS MODULE, NOW" section named "house
vocabulary" as the strong m30 candidate, inherited from m28's own
REJECTED ALTERNATIVE 2 ("house vocabulary is the one clean lexical gap
left"). **That claim was checked against the actual atom registry for
this brief and does not hold.** `grep -n 'atom({' -A2
src/features/languages/es/curriculum/m{3,4}.ts` shows `casa`, `cuarto`,
`cocina`, `baño`, `cama`, `mesa`, `silla`, `puerta`, `ventana`, `llave`,
`libro`, `lápiz`, `papel`, `celular` are ALL already PRIOR — registered
at m3/m4, the very first content modules. Neither m27 nor m28's header
re-checked this directly against the registry; both cite m27's own
"WHICH SEVEN WORDS" section, which only asserted clothing/food/body were
partially spent and implied house was clean by omission, without a fresh
grep. The genuinely remaining unregistered house nouns — sofá, armario,
garaje, inodoro — mostly collide with emoji ALREADY spent on m3/m4's
house atoms (🛋️=cuarto, 🚪=puerta, 🚗=carro, 🚽=baño — the inodoro case is
UNRESOLVABLE, Unicode has no second toilet glyph). Only three clean new
house atoms exist: espejo 🪞, jabón 🧼, lámpara 💡 — too thin for a
credible ten-lesson module built entirely around a mislabeled "gap."

This module instead teaches **the body**: la mano, el pie, el brazo, la
pierna, el ojo, la boca, la nariz — seven new imageable nouns, grep-
verified fully virgin (zero hits anywhere in m1–m29) and grep-verified
zero emoji collision, with a stronger three-way recombination story than
house vocabulary would have had (see "Decisions inferred" for the full
comparison against clothing and city/directions, the other two
alternatives this brief evaluated and rejected).

## Files

Read these before drafting, in this order:

- `docs/es-ir-sources/m30-header.yaml` — the module spine, the full
  atom list with per-atom inline reasoning, and the complete rejected-
  alternatives/trap documentation. Read this FIRST — it is denser than
  this brief and several sections here summarize it.
- `docs/es-ir-sources/m29-header.yaml` and `docs/es-ir-sources/
  es-m29-brief.md` — the immediately-PRIOR module. Read for: the exact
  7 fused-clitic surfaces m29 registered (you will reuse one, «verlo»,
  and must NEVER invent «verla» — see the trap section below), and the
  live dialogue_sim NPC provenance gate m29's brief first documented.
- `docs/es-ir-sources/m27-header.yaml` and `docs/es-ir-sources/
  es-m27-brief.md` — the last pure lexicon-break module (weather). Read
  for shape: this module is structurally closer to m27 than to m28/m29
  (new nouns, zero new grammar, imageMcq-driven debuts) — mirror m27's
  lesson shape more than m28/m29's.
- `docs/es-ir-sources/authoring-rules.md` — read in full, but
  specifically: the "Hard rule: dialogue_sim NPC lines" section (the
  provenance gate) and the "Agreement is not a new atom" paragraph
  (why plural manos/pies/brazos/piernas/ojos/bocas need no separate
  registration — but «nariz»→«narices» is a z→c irregular, see below).
- `docs/lesson-authoring-guide.md` §13.1–13.2 — the card-type rubric and
  the image-MCQ-as-introduction pattern, including the "bad image is
  worse than no image" ceiling rule. All 7 new atoms here have clean,
  already-vendored SVGs (see "Vocab card art" below) — no ceiling-rule
  fallback should be needed, but check each rendered card yourself.
- `src/features/languages/es/courseAtoms.ts` (imports/registration
  section) and `src/features/languages/es/grammarHelpers.ts`
  (`ES_MODULE_ORDER`) — confirm m29 is the current tail before you add
  m30's own entries via `register-mod.py`.

## PRIOR vocabulary

Grep template for any word you want to check before using it:

```
grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..29}.ts | sort -u | grep -i "<word>"
```

**PRIOR and safe to recombine freely:**
- `tengo` / `tienes` / `tiene` (m5) and `tenemos` / `tienen` (m18) — full
  person coverage of "to have," this module's main sentence frame.
- `rojo`, `azul`, `verde`, `negro`, `blanco` (m6, colors) and `grande`,
  `pequeño` (m6, size) — descriptive adjectives, agree normally.
- `ver` (m15, infinitive), and m29's own fused atom `verlo` — reuse
  verbatim on this module's masculine nouns (el ojo, el brazo, el pie).
  `lo` / `la` (m3/m16, pre-verbal object pronouns) — safe pre-verbal
  placement on ANY noun regardless of gender.
- m17 L7's bare reflexive-routine infinitives — specifically `lavar` — a
  bare form distinct from its «-se» dictionary card per m17's own rule.
  Reuse on a body-part object: «me lavo las manos».
- `dientes` (m17, plural-only) — the one PRIOR body-adjacent noun; not
  reused as an answer in this module (it's a different anatomical
  register, teeth vs. limbs/face) but safe if a drafting agent wants a
  single cameo distractor.

**NOT PRIOR — do not assume, do not use as if registered:**
- `mano`, `pie`, `brazo`, `pierna`, `ojo`, `boca`, `nariz` — this
  module's own 7 new atoms (grep-verified zero hits in m1–m29).
- `limpiar` (to clean) — NOT PRIOR anywhere (grep-verified zero hits).
  Do not use "voy a limpiarla" or similar — it requires a new verb this
  module was deliberately scoped to avoid.
- `doler` (impersonal "hurts") — NOT PRIOR. Rejected for this module,
  see m30-header.yaml's REJECTED ALTERNATIVE 4. Do not use.
- `oreja` (ear) — NOT PRIOR, and deliberately NOT added to this module:
  its only clean emoji, 👂, is already «escuchar»'s (m10). Leave for a
  future module if that collision is ever worth resolving differently.
- `verla` — the fused string is NOT one of m29's 7 registered fused
  atoms. See the trap section immediately below.

## The «verla» trap — read before drafting any lesson using feminine nouns

m29 registered exactly 7 fused-clitic surfaces: `verlo`, `comprarlo`,
`comprarla`, `comprarlos`, `levantarme`, `hacerlo`, `verlos`. **`verla`
is not one of them.** `ver` and `la` are each independently PRIOR, but
the FUSED STRING «verla» was never registered as its own atom, and per
m29-header.yaml's own correction, `esTokens()` (regex `[a-záéíóúñü]+`)
treats a fused string as one unbroken token — it does not decompose back
into «ver» + «la». Using «verla» anywhere in a graded position (cloze
answer, tile bank, sim reply) is an unconditional untracked-word failure.

Practical rule for this module: **masculine nouns (el ojo, el brazo, el
pie) may use the fused «verlo»** — reused verbatim from m29, zero new
registration. **Feminine nouns (la mano, la pierna, la boca, la nariz)
must use pre-verbal placement only** — «la veo», «la puedo ver» — never
a fused feminine form. Do not invent «verla» to make a tidy masculine/
feminine parallel; that atom does not exist in the registry and adding
it would spend one of this module's own atom slots on a pronoun form
instead of a body-part noun. Pre-verbal placement is always legal and
needs no registration regardless of gender — use it by default for
feminine nouns and don't treat it as a workaround; it's simply correct
Spanish.

## What this module does NOT teach

- No new verb morphology of any kind. `tengo`/`tienes`/`tiene`/
  `tenemos`/`tienen` are all PRIOR; do not introduce a new tense, mood,
  or person form.
- No `doler` (impersonal "hurts/aches") — a real A2 topic, deliberately
  deferred; it needs `gustar`-style word order and deserves its own
  dedicated module, not a clause inside a break module.
- No `limpiar` or any other new verb to support a "house-cleaning"
  recombination — that idea was evaluated and rejected for this module
  specifically because it requires new grammar-adjacent vocabulary; see
  "Decisions inferred" below.
- No fused «verla» — see the trap section above.
- No plural «narices» — see the irregular-plural note below.
- No new house, clothing, or city/directions vocabulary — all three were
  evaluated as alternatives to body and are documented as rejected (with
  reasons) in m30-header.yaml and summarized in "Decisions inferred."

## Step kinds

Mirror m27's lexicon-break shape, not m28/m29's grammar shape: every new
atom should get an `imageMcq` debut per §13.2's image-MCQ-as-introduction
pattern (all 7 emoji are clean, unambiguous, single-referent glyphs —
no "bad image is worse than no image" ceiling-rule concern expected, but
eyeball each rendered card). Follow debuts with `buildLit`/`cloze`
practice, `listenCompLit` for aural recognition, and at least one
`dialogue_sim` lesson recombining «tengo» + colors + body nouns for
physical description. Reserve the «verlo»/pre-verbal-«la» contrast for
a dedicated late lesson (planned as L9 below, mirroring m29's own L9
shape as a syntactic-contrast lesson).

## Hard rules the gates enforce

1. `atoms:` credit arrays silently drop unregistered entries — every
   atom you credit a step with must be a registered surface (this
   module's 7, or any grep-confirmed PRIOR surface). A misspelled or
   invented credit is not an error, it's a silent no-op — verify by
   grep, not by eye.
2. Build tiles are billed exposure: a new atom (mano, pie, brazo,
   pierna, ojo, boca, nariz) may not appear as a build tile before its
   own debut lesson introduces it.
3. `lo` has no standalone atom registration — only `la`/`los`/`las`/
   `me`/`te`/`se` do. Any bare-«lo» cloze must be restructured (inherited
   rule from m29, still live; this module's own masculine nouns should
   prefer «verlo» — a whole registered fused atom — over a bare «lo»
   cloze wherever a pronoun is the graded target).
4. No fused «verla» — see the trap section above. This is the single
   most important rule specific to this module.
5. No double clitic stacks.
6. Full-sentence MCQ ban (invariant 28) — no step may present a complete
   correct sentence as one of several MCQ options where the "distractor"
   options are also complete grammatical sentences; distractors must be
   ungrammatical or semantically wrong, not just "a different sentence."
7. Plural agreement of a registered singular noun (manos, pies, brazos,
   piernas, ojos, bocas — all regular -s plurals) is sanctioned and
   needs no separate atom registration, per authoring-rules.md's
   "Agreement is not a new atom" paragraph and the course-wide
   `getEsPluralCanon` precedent (`zapato`→`zapatos`, m12→m13).
8. «nariz» is an EXCEPTION to rule 7 — its plural, «narices», is an
   irregular z→c inflection, not a plain -s plural. Whether the course's
   regular-inflection engine accepts it was not verified for this brief
   (flagged UNVERIFIED below). Keep «nariz» singular-only in this
   module's own sentences until a drafting agent grep-confirms the
   plural is handled correctly.
9. `mano` is grammatically feminine despite ending in -o (irregular
   gender, same exception class as PRIOR `foto`, m4) — every article/
   adjective agreement must use feminine forms («la mano», «las manos
   grandes»), never masculine.
10. The dialogue_sim NPC-line provenance gate is LIVE (confirmed via
    m29): every NPC line, not just graded replies, must resolve to
    atoms registered by m30 or any PRIOR module. `esSurfaces()` has no
    `dialogue_sim` case, so this is invisible to normal scans — grep
    every `npc:` line by hand before shipping.
11. No new emoji collision: this module's 7 emoji (✋🦶💪🦵👁️👄👃) are
    grep-verified zero-collision against every `emoji:` field in
    m1–m29. Do not substitute a different glyph for any of them without
    re-running that check.

## SIM NPC lines

Per rule 10 above: every `dialogue_sim` NPC line in this module must use
only PRIOR-or-m30 vocabulary. A natural sim scenario for this module is
a doctor/description exchange ("¿qué tienes?" / description using body
nouns + colors + size) — keep NPC prompts to PRIOR question frames
already used in m5/m18 ("¿qué tienes?", "¿cómo es?") so the NPC side
never needs anything new. Grep every line by hand; do not trust visual
inspection alone.

## Usage-note budget

Per CLAUDE.md's lenses (explanations budget ~3 short lines): each new
atom's usage note should be terse. Suggested template for the irregular-
gender atom (mano):

```
la mano — looks masculine (-o ending) but is feminine.
Same pattern as «la foto» (m4).
tengo dos manos.
```

Keep every other atom's note to 1-2 lines; they're all regular.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | Rule/atom content owned | Suggested PRIOR context | `-sp-win` (verbatim) |
|---|-------|--------------------------|--------------------------|------------------------|
| 1 | La mano | mano (imageMcq debut) | tengo (m5) | "tengo una mano" |
| 2 | El pie | pie (imageMcq debut) | tengo, dos (m1/m5) | "tengo dos pies" |
| 3 | El brazo | brazo (imageMcq debut) | grande (m6) | "tengo un brazo grande" |
| 4 | La pierna | pierna (imageMcq debut) | pequeño (m6) | "tengo una pierna pequeña" |
| 5 | El ojo | ojo (imageMcq debut) | azul (m6) | "tengo los ojos azules" |
| 6 | La boca | boca (imageMcq debut) | grande/pequeño (m6) | "tiene una boca grande" |
| 7 | La nariz | nariz (imageMcq debut, singular only) | tiene (m5) | "tiene una nariz pequeña" |
| 8 | Me lavo las manos | m17 L7 bare reflexive `lavar` + body-part object | lavar (m17) | "me lavo las manos" |
| 9 | ¿Lo ves? | «verlo» (m29 fused atom) on masculine nouns vs. pre-verbal «la» on feminine nouns — the syntactic-contrast lesson | verlo (m29), la (m3/m16) | "sí, puedo verlo" |
| 10 | Tengo los ojos azules | full recombination review: tener + colors + size + all 7 body nouns | tengo/tiene, colors, size | "tengo los ojos azules y el pelo negro" |

(L10's "pelo" (hair) is PRIOR-checkable — if grep does not confirm it as
a registered surface, drop that clause and close with a body-only
sentence instead; do not introduce «pelo» as an 8th new atom without
updating the header's atom count and re-running every check in this
brief.)

## What to report back

1. Final lesson count and any deviation from the 10-lesson plan above,
   with reasoning.
2. Confirmation that all 7 new atoms were registered exactly as
   specified in `m30-header.yaml` (surface, gender, emoji, hint) with no
   drift.
3. Confirmation that no `dialogue_sim` NPC line uses an unregistered
   surface (grep output, not just a claim).
4. Confirmation that no fused «verla» appears anywhere in any fragment,
   and that «nariz» never appears pluralized.
5. Any new UNVERIFIED claims discovered during drafting, appended to the
   list below rather than silently resolved.

---

## Exact pipeline commands

Run these in order from the worktree root, with `LINGO_ROOT` exported.

1. `cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1 && export LINGO_ROOT=$PWD`
2. Draft each `docs/es-ir-sources/m30-L{1..10}.yaml` lesson fragment per
   the lesson plan above.
3. `bash docs/es-ir-sources/check-frag.sh docs/es-ir-sources/m30-L{n}.yaml`
   for each fragment as you finish it (per lesson, not against the
   header — the header itself is not run through this gate, matching
   m29's own practice).
4. `bash docs/es-ir-sources/assemble-mod.sh m30` to merge
   `m30-header.yaml` + all `m30-L*.yaml` fragments into `m30.ir.yaml`.
5. `python3 docs/es-ir-sources/register-mod.py m29 m30 "Tengo los ojos azules" "Module 30 · The body" "seven new words for the body — la mano, el pie, el brazo, la pierna, el ojo, la boca, la nariz — recombined against everything you already know: «tengo», colors, size, and even the «verlo» you just learned in module 29." "#14b8a6" "#0d9488"`
6. `node docs/es-ir-sources/compile-ir-es.mjs m30` to generate
   `src/features/languages/es/curriculum/m30.ts` from `m30.ir.yaml`.
7. Verify the 6 registration points register-mod.py should have touched
   (see checklist below) — confirm by hand, don't just trust the
   script's "registered m30 at 6 points" printout.
8. `node docs/es-ir-sources/gen-es-review-pool.mjs` to regenerate the
   review pool including m30's new atoms.
9. Hand-write `src/features/languages/es/curriculum/m30.test.ts` with
   bespoke pins for at least: the mano gender-exception case, the
   nariz-singular-only case, the verlo/pre-verbal-la contrast in L9, and
   one dialogue_sim NPC-provenance check.
10. `bash docs/es-ir-sources/tts-chain.sh m30` to generate audio for any
    new sim/listening content.
11. `npx vitest run src/features/languages/es` and confirm the full ES
    suite is green, not just m30's own new test file.
12. Manually render each new atom's vocab card in the app (dev harness)
    and eyeball all 7 SVGs at actual card size — confirm the ceiling
    rule ("bad image is worse than no image") is satisfied for each.
13. Report back per the "What to report back" section above.

### Vocab card art — already vendored, verify don't assume

Per CLAUDE.md's "Vocab card art" invariant, every authored word needs an
image, and any newly authored emoji must be vendored as an SVG into
`src/pub/noto-emoji/svg/` before the module ships (a 2026-06 wave
shipped 224 unvendored emoji → broken images; do not repeat it).
**Unlike every prior new-vocabulary ES module, this one required no
vendoring work at time of writing** — `ls src/pub/noto-emoji/svg/ | grep
-iE "^emoji_u(270b|1f9b6|1f4aa|1f9b5|1f441|1f444|1f443)"` returned all 7
target files (`emoji_u270b.svg`, `emoji_u1f9b6.svg`, `emoji_u1f4aa.svg`,
`emoji_u1f9b5.svg`, `emoji_u1f441.svg`, `emoji_u1f444.svg`,
`emoji_u1f443.svg`) already present. Still, **re-run this check
yourself right before shipping** — a concurrent lane could in principle
touch this directory between now and your ship date; do not assume this
brief's snapshot is still true.

### The 7 registration points — verify by hand

register-mod.py touches 6 files across roughly 10 edit points; confirm
each by hand after running it:
- [ ] `curriculum/index.ts` — import added, lesson map entry added, meta
      card inserted with title/eyebrow/summary/accent exactly as passed.
- [ ] `grammarHelpers.ts` — `ES_MODULE_ORDER` now ends `..., "m29",
      "m30"`.
- [ ] `courseAtoms.ts` — import of `ES_M30_ATOMS` added, `EsAtomSource`
      type union includes `"m30"`, spread into the atom registration
      list.
- [ ] `curriculum/es-quality.test.ts` — `ES_M30_CHECKPOINT_INDEX`
      imported and mapped (pattern-matched from m29's own entries — the
      exact constant name was not independently re-derived from a spec,
      only inferred by naming convention; flagged UNVERIFIED below).
- [ ] `placementBank.ts` — import and array entry added.
- [ ] Accent colors `#14b8a6`→`#0d9488` appear exactly once each, on
      m30's own card, nowhere else.

## Decisions inferred (no open questions were parked)

- **House vs. body vs. clothing vs. city, decided in favor of body.**
  Evaluated honestly against the task's own suggested default (house).
  House was rejected because the "clean lexical gap" premise inherited
  from m27/m28's headers is stale — grep-verified: core house nouns
  (casa, cuarto, cocina, baño, cama, mesa, silla, puerta, ventana) are
  PRIOR since m3/m4, leaving only 3 clean new atoms (espejo, jabón,
  lámpara), not 7, and the richer-seeming remaining nouns (sofá,
  armario, inodoro) collide with emoji already spent on m3/m4's house
  objects, one collision (inodoro/🚽) being unresolvable outright.
  Clothing (pantalón, chaqueta, calcetines, guantes, bufanda) is real
  and viable (5-6 clean atoms) but was set aside for this module because
  body is fully virgin (zero partial-spend correction needed) with a
  three-way recombination story (tener, m17 reflexives, m29's own
  «verlo») that clothing doesn't match as cleanly. City/directions
  (calle, ciudad, semáforo, derecha/izquierda) is the richest fully-
  virgin domain of the four but was set aside because its most useful
  content (direction-giving) needs new phrase atoms and likely a new
  imperative mood, a heavier grammar footprint than a "zero new
  grammar" break module should carry. Clothing and city/directions are
  both left open as real future modules, not exhausted.
- **The task's own suggested recombination example ("voy a
  limpiarla"/"quiero verla") was not used.** «limpiar» is not PRIOR
  (would require a new verb, undermining the zero-new-grammar framing)
  and «verla» is not a registered fused atom (see the trap section) —
  using it as written would have both introduced new grammar risk and
  triggered an untracked-word failure. The example was treated as an
  illustrative hint, evaluated on its merits, and replaced with a
  cleaner recombination: «verlo» (already registered by m29) on this
  module's own masculine nouns, in a dedicated L9 contrast lesson.
- **Feminine body nouns use pre-verbal pronoun placement only, never a
  fused form.** Decided to avoid manufacturing an unregistered «verla»
  atom; documented as a named trap in both files so no drafting agent
  re-introduces it.
- **«nariz» kept singular-only in this module's own sentences.** Its
  plural «narices» is an irregular z→c inflection whose handling by the
  course's regular-inflection engine was not verified (see UNVERIFIED
  below); singular usage is also the more natural default for physical-
  description sentences (most people are described as having ONE nose).
- **Accent color: teal `#14b8a6`→`#0d9488`.** Checked against every
  `accent:` pair in `curriculum/index.ts` (zero collision) and against
  the four most recent modules' pairs specifically (m26 cyan, m27
  yellow, m28 green, m29 slate) — reads distinctly from all four.
- **Atom count: exactly 7**, matching m27's own seven-word precedent and
  staying well clear of the ≤10 cap given in this task's instructions.
- **Lesson count: 10**, matching m27/m28/m29's own expectedLessonCount,
  with checkpoint placed at lesson 8 (post-debut-lessons, pre-
  recombination-lessons), inferred by pattern-match against m29's
  checkpoint placement (also at 8 of 10) since no other convention was
  found stated explicitly in the authoring docs.
- **No vendoring work required.** Confirmed by direct file listing
  rather than assumed from m27's precedent (which DID require
  vendoring) — this module's situation genuinely differs and is called
  out explicitly rather than silently copying m27's "vendor these SVGs"
  instruction wholesale.

## Claims marked UNVERIFIED

- Whether the course's regular-inflection engine (`getEsPluralCanon` or
  equivalent, referenced in `authoring-rules.md`'s "Agreement is not a
  new atom" paragraph) correctly accepts the irregular z→c plural
  «narices» for «nariz», or whether it only handles regular -s plurals.
  Not independently verified against the engine's source in this brief;
  the module design sidesteps the question by keeping «nariz» singular-
  only, but a drafting agent curious enough to try «narices» should
  grep-confirm before trusting it either way.
- Whether the checkpoint constant this module will need is named
  `ES_M30_CHECKPOINT_INDEX` exactly — inferred by pattern-match against
  `ES_M29_CHECKPOINT_INDEX`'s confirmed-live naming, not independently
  re-derived from `register-mod.py`'s own template logic in this brief.
  `register-mod.py` should generate this correctly on its own; flagged
  only in case a drafting agent hand-edits anything in that area.
- Whether all 7 new emoji SVGs, once rendered at the course's actual
  smallest vocab-card size, are visually distinct enough from each
  other (👁️/👄/👃 are all small facial-feature glyphs at a glance) — the
  files were confirmed present on disk, not confirmed legible at
  production card size. Verify visually per pipeline step 12 before
  shipping.
- Whether «mano» being grammatically feminine despite its -o ending is
  correctly enforced by the course's gender-agreement checks the same
  way «foto» (m4) is — assumed to generalize from the «foto» precedent
  but not independently traced through the agreement-checking code for
  this brief.
- Whether L10's optional «pelo» (hair) clause is safe to use — not
  grep-confirmed as PRIOR or absent in this brief; the lesson-plan table
  explicitly instructs the drafting agent to check before using it and
  provides a fallback sentence if it isn't registered.
