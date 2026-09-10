# ES m31 drafting brief — «Me duele la mano» (the sentence that runs backwards, again)

This brief tells lesson-drafting agents what m31 teaches, what it must
never teach, and exactly how to check their own work before handing it
back. Every claim below was checked against the actual code and content
in this repo — grep the cited commands yourself if you doubt a number.

**Worktree note:** work inside the worktree this brief was written in.
`cd` there and `export LINGO_ROOT=$PWD` before running anything. Do not
touch any other worktree or the main tree — a reviewer may be editing
other lanes concurrently.

**m30 status note:** m30 is fully landed and clean. `git log --oneline`
shows `b55832f6` "es: m30 «Tengo los ojos azules» ... ES suite 2191
passed / 1 skipped; tsc clean" followed by `c16284b1` "ledger: ES m30
landed" and `3b24324d` "ledger: ES m30 lanes dispatched" — all present.
`ES_MODULE_ORDER` in `grammarHelpers.ts` ends `..., "m29", "m30"`;
`courseAtoms.ts` imports `ES_M30_ATOMS` and spreads it; `es-quality.
test.ts` imports and maps `ES_M30_CHECKPOINT_INDEX`. All 6 registration
points confirmed by hand, not just trusted from the commit message.
**HEAD has since moved well past m30** (`807a6cad` "ledger: m42 fixer +
FR m21 author dispatched" is current tip at time of writing) — a
concurrent session is actively working FR m21 and JA m42 content, and
`git status` shows unstaged edits to i18n extraction scripts and content
catalogs (`scripts/i18n/*`, `src/shared/i18n/content/ja/*`) unrelated to
this module. None of that touches ES m30/m31 paths. Per
[[concurrent-sessions-same-repo]], this brief only reads — it does not
stage or touch any file outside the two it was asked to produce.

## The decision this module resolves

m30's own header named this module directly and then declined it: its
REJECTED ALTERNATIVE 4 calls «doler» "the natural next step after body-
part nouns exist" and explicitly hands it forward — "reserve «doler» for
a future module that can give it the same dedicated care m7/m13 gave
«gustar» itself." **m31 is that module.** The rejection was scoped to
m30 only (a lexicon-break module shouldn't carry a second new grammar
idea), not to «doler» being unready — and on inspection, the "new
grammar idea" m30's rejection worried about turns out to already be
fully PRIOR: the dative-experiencer word order «doler» needs is the
exact frame `gusta`/`gustan` (m13) already taught to full yo/tú/3rd-
person coverage. m31 teaches TWO new verb-forms, `duele`/`duelen`,
riding that existing frame, with m30's own seven body nouns as the
frame's grammatical subject — the strongest possible "review after"
interleave move available this module. Full reasoning, all rejected
alternatives, and every gate-relevant detail are in
`docs/es-ir-sources/m31-header.yaml` — read it, it is not decorative.

## Files

Read these before drafting, in this order:

- `docs/es-ir-sources/m31-header.yaml` — the module spine, the two-atom
  list with per-atom inline reasoning, and the complete rejected-
  alternatives/trap documentation. Read this FIRST — it is denser than
  this brief and several sections here summarize it.
- `docs/es-ir-sources/m30-header.yaml` and `docs/es-ir-sources/
  es-m30-brief.md` — the immediately-PRIOR module. Read for: the seven
  body nouns you will reuse verbatim as this module's grammatical
  subjects (mano/pie/brazo/pierna/ojo/boca/nariz — every gender/plural
  quirk documented there, especially «mano»'s irregular feminine gender
  and «nariz»'s irregular plural, both still live traps here), and the
  shipped commit's own author-fix record (`git show -s --format=%B
  b55832f6`) — three fixes worth internalizing before you draft: (1)
  `vocabTextMcq` targets must be the registered SINGULAR atom, never a
  plural surface (L8's `mano` retarget); (2) the full-sentence MCQ ban
  (invariant 28) bit FIVE steps in m30 — budget MCQ correct answers to
  ≤3 tokens from the start, don't discover this in review; (3) «narices»
  was removed from learner-facing text entirely — this module inherits
  the same caution, never pluralize «nariz».
- `src/features/languages/es/curriculum/m13.ts` (read the compiled file
  directly — no `m13-L*.yaml` fragments remain on disk, same hedge
  m29's own brief used for `m16.ts`) — the module this one recombines
  against. Read for: `ES_M13_ATOMS` (the `me`/`te`/`le`/`mucho` particle
  atoms and the `gusta`/`gustan` verb pair, none carrying an `emoji:`
  field — your own `duele`/`duelen` atoms follow the identical no-emoji
  shape), and lesson 6 specifically (`"A Diego le gusta"`, the «a +
  [nombre] le VERB» third-person construction you will reuse verbatim
  for this module's own 3rd-person lessons).
- `docs/es-ir-sources/es-m29-brief.md` and `m29-header.yaml` — read for
  house-style precedent on a THIN-atom module (m29 shipped 0 new atoms;
  this module ships 2) and for the "no third position"-style central-
  discrimination-rule treatment your own module's central rule (never
  conjugate `duele`/`duelen` to the person) should match in rigor.
- `docs/es-ir-sources/authoring-rules.md` — read in full, but
  specifically the "Agreement is not a new atom" paragraph (m30's seven
  nouns pluralize into this module's sentences with no new registration)
  and the dialogue_sim NPC provenance rule.
- `docs/lesson-authoring-guide.md` §13.1–13.2 — the card-type rubric.
  **This module debuts NO new imageable noun** — `duele`/`duelen` are
  verb-morphology atoms with no honest single-referent emoji (same
  category as m13's own `gusta`/`gustan`, which also skip imageMcq) —
  so the §13.2 image-MCQ-as-introduction pattern does NOT apply here;
  introduce each new verb-form via `info` (a two/three-line rule card in
  m13's own voice — "the sentence that runs backwards, now with a second
  verb") then `build`/`cloze` practice, the same "no image debut for an
  abstract category" logic m29's own brief applied to its placement
  rule.
- `src/features/languages/es/courseAtoms.ts` (imports/registration
  section) and `src/features/languages/es/grammarHelpers.ts`
  (`ES_MODULE_ORDER`) — confirm m30 is the current tail before you add
  m31's own entries via `register-mod.py`.

## PRIOR vocabulary

Grep template for any word you want to check before using it:

```
grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..30}.ts | sort -u | grep -i "<word>"
```

**PRIOR and safe to recombine freely:**
- `me`, `te`, `le`, `mucho` (all m13, `kind: "particle"` except `mucho`
  which is `kind: "vocab"`, `partOfSpeech: "adjective"`) — the full
  dative-experiencer paradigm this module's grammar rides. **`le` is a
  registered `atom()`, not merely a function word** — unlike `lo` (see
  the hard-rule note below), crediting a step with `atoms: ["le"]` works
  normally.
- `gusta`, `gustan` (m13) — not reused as answers in this module (a
  different verb) but the exact structural template every one of this
  module's sentences is built from; cite them in `info` steps as the
  "you already know this shape" anchor.
- m30's seven body nouns — `mano` (f, irregular gender), `pie` (m),
  `brazo` (m), `pierna` (f), `ojo` (m), `boca` (f), `nariz` (f, singular-
  only — see below) — this module's grammatical SUBJECTS. Their regular
  plurals (`manos`, `pies`, `brazos`, `piernas`, `ojos`, `bocas`) are
  freely usable per "Agreement is not a new atom"; `nariz` stays
  singular-only, same restriction m30 itself carried.
- `y` (m1), `pero` (m6), `también` (m11) — PRIOR connectives, useful for
  L6/L10 coordination ("le duelen la boca y la nariz") and mastery-lesson
  narration.
- `tengo`/`tienes`/`tiene`/`tenemos`/`tienen` (m5/m18) and colors/size
  (m6) — reused ONLY in L9's dedicated contrast lesson (see below), never
  mixed into a `duele`/`duelen` sentence itself.
- Fixed cast only: Ana, Diego, Sofía, María, Carmen, Sam, Luis. Never
  invent a name or place beyond España/México.

**NOT PRIOR — do not assume, do not use as if registered:**
- `poco` (a little) — grep-verified NOT an `atom()` anywhere in m1–m30,
  despite appearing as a distractor STRING inside m30's own
  `vocabTextMcq` distractor pools (`["rojo", "poco", "como"]` etc.) — a
  distractor option is not a provenance claim; do not treat its presence
  there as registration. Use `mucho` for any intensifier this module
  needs; do not reach for `poco`.
- `nos` (m18, "we") and `les` (to them) as a DATIVE-PLURAL pairing with
  a `gustar`-type verb — `les` is grep-verified zero hits anywhere in
  m1–m30; `nos` exists as the subject pronoun (m18) but m13 never built
  "nos gusta". This module mirrors m13's own taught scope exactly:
  yo/tú/3rd-singular-via-`le` only. Do not write "nos duele" or "les
  duele" — both would require registering a new dative particle this
  module is not scoped to add.
- `cabeza`, `garganta`, `estómago`, `espalda`, `hombro` — NOT PRIOR
  anywhere (grep-verified zero hits), and deliberately NOT added to this
  module. See `m31-header.yaml`'s rejected-extension section for why
  m30's own seven nouns already give full coverage.
- `doler` as a bare infinitive, `duele`/`duelen` — this module's own 2
  new atoms (grep-verified zero hits in m1–m30 before this module).
- `lo` — has no standalone atom registration (inherited rule from
  m29/m30, still live) — irrelevant to this module's own content (no
  direct-object clitic appears in a `duele` sentence, the body part is
  the SUBJECT, not an object) but do not let a drafting agent reach for
  it out of habit from m29's own module.

## The central discrimination — read before drafting any lesson

`duele`/`duelen` agree with the BODY PART (the grammatical subject),
never with the person who feels it — the identical rule `gusta`/`gustan`
already enforces course-wide («me gusta el café», never «yo gusto»). The
transfer error to guard against is NOT the English word-order transfer
(English "my hand hurts" already puts the body part in subject position,
so that direction is actually low-risk) — it is the opposite: a learner
reading "I hurt" / "it hurts me" and reaching for "yo duelo" or "me
duelo," treating the EXPERIENCER as the verb's grammatical subject.
Every discrimination step in this module (`agreementCloze` / `textMcq`
distractors) must include a foil that wrongly conjugates the verb to the
PERSON instead of the body part (offering `*duelo`/`*dueles`/`*duelemos`
as a wrong option — never as a correct answer), not only a singular/
plural body-part-agreement foil. This is this module's single most
important distractor, playing the same structural role m29's third-
position foil played for its own module. Note: no `m13.test.ts` pin
explicitly named as a "*gusto" foil was found grep-confirmed while
writing this brief (flagged UNVERIFIED below) — this rule is reasoned
directly from the grammar and from m13's own "sentence that runs
backwards" framing, not copied from a confirmed prior test.

## What this module does NOT teach

- No new nouns — all seven grammatical subjects are m30's, PRIOR. No
  `cabeza`/`garganta`/`estómago`/`espalda`/`hombro`; see rejected-
  extension reasoning above and in the header.
- No `nos`/`les` dative forms — mirrors m13's own taught scope; see
  above.
- No mixing of `tengo` + `duele` inside the same sentence — L9's
  dedicated contrast lesson keeps the two frames strictly separate
  (SAME noun, different verb, different grammatical role for that noun)
  rather than blending them.
- No comparative, obligation (`tener que`), progressive (`estar +
  gerundio`), or imperative content — all four evaluated and rejected
  for this module specifically; see `m31-header.yaml`'s REJECTED
  ALTERNATIVE 1–4 for reasons.
- No `poco` — not PRIOR; see above.

## Step kinds

No imageMcq debut for either new atom (neither is imageable — see
"Files" above for why). Introduce `duele` (L1) and `duelen` (L2) via
`info` (2–3 lines, in m13's own "runs backwards" voice, per the usage-
note budget below) then `buildLit`/`clozeLit` practice on m30's body
nouns, `listenCompLit` for aural recognition, and at least one
`dialogue_sim` lesson per new verb-form recombining `me`/`te`/`le` +
`duele`/`duelen` + a body noun for a physical-complaint exchange (a
natural doctor/checkup scenario, mirroring m30's own "¿qué tienes?"
sim frame but for sensation instead of description — keep NPC prompts
to PRIOR question frames, e.g. "¿qué te duele?", built from PRIOR `qué`/
`te`/`duele`). Reserve the `tengo`-vs-`duele` syntactic/semantic
contrast for a dedicated L9, mirroring m29's own L9 and m30's own L9
shape (a contrast lesson, never a right/wrong pair).

## Hard rules the gates enforce

1. `atoms:` credit arrays silently drop unregistered entries — every
   atom you credit a step with must be a registered surface (this
   module's 2, or any grep-confirmed PRIOR surface, including m30's
   seven body nouns). A misspelled or invented credit is not an error,
   it's a silent no-op — verify by grep, not by eye.
2. Build tiles are billed exposure: `duele`/`duelen` may not appear as a
   build tile before their own debut lesson (L1/L2 respectively)
   introduces them.
3. `lo` has no standalone atom registration — only `la`/`los`/`las`/
   `me`/`te`/`se` do; `le` IS registered (m13, confirmed above) and may
   be credited normally. This distinction matters if a drafting agent
   copies boilerplate from an m29/m30 fragment that mentions `lo`.
4. Never conjugate `duele`/`duelen` to the person (`*duelo`, `*dueles`,
   `*duelemos` are all ungrammatical) — see the central-discrimination
   section above. This is the single most important rule specific to
   this module.
5. No mixing `tengo` and `duele` inside one sentence outside the L9
   contrast lesson, and even there, every contrasted pair must be
   subject/noun-matched so the VERB FRAME is the only variable, per the
   same restriction shape m29's hard rule 8 and m30's own L9 note carry
   ("never a right/wrong pair, never a third structure").
6. Full-sentence MCQ ban (invariant 28) — no step may present a complete
   correct sentence as one of several MCQ options where the distractors
   are also complete grammatical sentences; MCQ correct answers ≤3
   tokens. m30's own shipped commit hit this on FIVE steps — budget for
   it from the first draft, don't discover it in review.
7. `vocabTextMcq` targets must be the registered SINGULAR atom (`mano`,
   not `manos`) even when the surrounding sentence uses a plural form —
   m30's own shipped fix (L8 `mano` retarget, confirmed by reading
   `m30.ts:1254`, `vocabTextMcq("es-m30-8-l8-tm-mano", "mano", ...)`).
   This module's own `vocabTextMcq` calls on `duele`/`duelen` must
   target whichever of the two IS the registered surface for that step
   — do not target a conjugated-to-agree-with-a-different-subject form
   that isn't itself one of the two registered atoms (there are only
   two: `duele`, `duelen` — no other person/number form is registered
   or gradeable).
8. Plural agreement of m30's registered singular nouns (manos, pies,
   brazos, piernas, ojos, bocas) is sanctioned and needs no separate
   atom registration, per authoring-rules.md's "Agreement is not a new
   atom" paragraph.
9. `nariz` stays singular-only — never `narices` — in any learner-facing
   text this module produces, inheriting m30's own live trap (m30's
   shipped commit message: "«narices» removed from learner-facing
   text").
10. `mano` is grammatically feminine despite ending in -o — every
    article/adjective agreement in a sentence carrying `mano` must use
    feminine forms, inherited unchanged from m30.
11. The dialogue_sim NPC-line provenance gate is LIVE: every NPC line,
    not just graded replies, must resolve to atoms registered by m31 or
    any PRIOR module. `esSurfaces()` has no `dialogue_sim` case, so this
    is invisible to normal scans — grep every `npc:` line by hand before
    shipping.
12. No new emoji, no vendoring — `duele`/`duelen` carry no `emoji:`
    field, matching `gusta`/`gustan`'s own shape. If a drafting agent's
    IR adds one, that's a defect, not a stylistic choice.

## SIM NPC lines

Per rule 11 above: every `dialogue_sim` NPC line in this module must use
only PRIOR-or-m31 vocabulary. A natural scenario is a doctor/checkup
exchange: NPC asks "¿qué te duele?" (PRIOR `qué`/`te` + this module's
`duele`), learner answers with a body part. Keep NPC prompts to this
kind of PRIOR-question-plus-this-module's-verb frame so the NPC side
never needs anything new. Grep every line by hand; do not trust visual
inspection alone.

## Usage-note budget

Per CLAUDE.md's lenses (explanations budget ~3 short lines): each new
atom's `info` step should be terse and explicitly anchor to m13's own
framing. Suggested shape for L1's `duele` debut:

```
«me duele» — same word order as «me gusta» (m13): the sentence runs
backwards. The body part is the subject; the person is out front.
me duele la mano.
```

L2's `duelen` debut in one line: "«duele» becomes «duelen» exactly when
«gusta» becomes «gustan» — more than one thing doing the hurting."

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | Rule/atom content owned | Suggested PRIOR context | `-sp-win` (verbatim) |
|---|-------|--------------------------|--------------------------|------------------------|
| 1 | Me duele la mano | `duele` debut, yo-form, singular body part | me (m13), mano (m30) | "me duele la mano" |
| 2 | Me duelen los pies | `duelen` debut, plural-body-part agreement | me, pies (m30) | "me duelen los pies" |
| 3 | ¿Te duele el brazo? | tú-form singular; ≥1 recall | te (m13), brazo (m30) | "¿te duele el brazo?" |
| 4 | ¿Te duelen las piernas? | tú-form plural; ≥1 recall | te, piernas (m30) | "¿te duelen las piernas?" |
| 5 | A Diego le duele el ojo | 3rd-singular `le` + «a + nombre» (m13 L6 frame); ≥1 recall | le, a (m13), ojo (m30) | "a Diego le duele el ojo" |
| 6 | A Sofía le duelen la boca y la nariz | 3rd person, plural body-part coordination with `y`; ≥1 recall | le, y (m1), boca, nariz (m30) | "a Sofía le duelen la boca y la nariz" |
| 7 | Me duele mucho la mano | intensifier recombination (`mucho`, m13); ≥1 recall | mucho (m13), mano | "me duele mucho la mano" |
| 8 | Checkpoint | graded only, all 3 persons × both verb-forms × all 7 nouns, "*duelo"-style foils throughout; ≥2 recalls | me/te/le, duele/duelen | "a Diego le duele el pie, pero a mí no me duele nada" |
| 9 | Tengo los ojos azules, me duelen los ojos | `tengo` (physical description, m30) vs `duele` (sensation) SYNTACTIC/semantic contrast — same noun, different verb, different grammatical role; ≥1 recall | tengo (m5/m30), ojo (m30) | "tengo los ojos azules, pero me duelen" |
| 10 | Mastery | doctor/checkup sim, longest lesson, mixes all 3 persons + `mucho` + PRIOR connectives; no `info`; ≥2 recalls, ≥1 PRIOR m6/m11 connective | pero, también, mucho | "me duele mucho el brazo, pero a Diego le duelen los pies" |

Recalls: L3+ may recall L1/L2; L6+ may recall L1–L5; floor ≥5 recalls
total, matching m29's own convention. Put ≥1 recall in L3, L4, L5, L6,
L7, L9 and ≥2 in L8/L10.

## What to report back

1. Final lesson count and any deviation from the 10-lesson plan above,
   with reasoning.
2. Confirmation that both new atoms (`duele`, `duelen`) were registered
   exactly as specified in `m31-header.yaml` with no drift.
3. Confirmation that no `dialogue_sim` NPC line uses an unregistered
   surface (grep output, not just a claim).
4. Confirmation that no sentence conjugates `duele`/`duelen` to the
   person (`*duelo`/`*dueles`/`*duelemos` never appear as a correct
   answer), and that `nariz` never appears pluralized.
5. Any new UNVERIFIED claims discovered during drafting, appended to the
   list below rather than silently resolved.

---

## Exact pipeline commands

Run these in order from the worktree root, with `LINGO_ROOT` exported.
**Correction to m30's own brief, verified by direct file listing before
writing this one:** the compiler and review-pool scripts live at
`scripts/compile-ir-es.mjs` and `scripts/gen-es-review-pool.mjs` (repo
root `scripts/`, matching m29's brief) — **not**
`docs/es-ir-sources/compile-ir-es.mjs` / `docs/es-ir-sources/
gen-es-review-pool.mjs` as m30's own brief step 6/8 stated; those paths
do not exist. Use the paths below.

1. `cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1 && export LINGO_ROOT=$PWD`
2. Write `docs/es-ir-sources/m31-placement.yaml` (same shape as
   `m30-placement.yaml`: a `screener` entry + 3–4 `byModule` entries).
   Anchor at least one `byModule` prompt on the `duele`/`duelen`
   singular/plural agreement rule itself (an English sentence whose
   Spanish translation is ambiguous only in verb-form choice), not only
   on the body-noun vocabulary.
3. Draft each `docs/es-ir-sources/m31-L{1..10}.yaml` lesson fragment per
   the lesson plan above.
4. `bash docs/es-ir-sources/check-frag.sh m31 <tag> docs/es-ir-sources/m31-L{n}.yaml`
   for each fragment as you finish it (per lesson, not against the
   header — the header itself is not run through this gate, matching
   m29's and m30's own practice; needs `m31-placement.yaml` on disk
   first, per step 2).
5. `bash docs/es-ir-sources/assemble-mod.sh m31` to merge
   `m31-header.yaml` + all `m31-L*.yaml` fragments into `m31.ir.yaml`.
6. `python3 docs/es-ir-sources/register-mod.py m30 m31 "Me duele la mano" "Module 31 · The body, in pain" "two new words, «duele» and «duelen», ride the exact word order «me gusta»/«me gustan» already taught back in module 13 — now the body parts you just learned in module 30 do the hurting instead of the liking." "#fb7185" "#9f1239"`
7. `node scripts/compile-ir-es.mjs m31` to generate
   `src/features/languages/es/curriculum/m31.ts` from `m31.ir.yaml`.
   READ THE GENERATED FILE.
8. Verify the 6 registration points register-mod.py should have touched
   (see checklist below) — confirm by hand, don't just trust the
   script's "registered m31 at 6 points" printout.
9. `node scripts/gen-es-review-pool.mjs` to regenerate the review pool
   including m31's new atoms.
10. Hand-write `src/features/languages/es/curriculum/m31.test.ts` with
    bespoke pins for at least: the "never conjugate to the person" foil
    check (grep for `*duelo`/`*dueles`/`*duelemos` in any answer
    position, fail if found), the nariz-singular-only case (inherited
    from m30), the `tengo`-vs-`duele` L9 contrast pin (verify the same
    noun appears in both frames with the grammatical role correctly
    flipped), and one dialogue_sim NPC-provenance check.
11. `bash docs/es-ir-sources/tts-chain.sh m31` to generate audio for any
    new sim/listening content.
12. `npx vitest run src/features/languages/es` and confirm the full ES
    suite is green, not just m31's own new test file.
13. No new vocab-card art to render — neither new atom is imageable
    (see "Vocab card art" below). Skip the render/eyeball step this
    module.
14. Report back per the "What to report back" section above.

### Vocab card art — NONE required this module (verified, not assumed)

`duele`/`duelen` are verb-morphology atoms, the same category as m13's
own `gusta`/`gustan` — neither carries an `emoji:` field (confirmed by
reading `ES_M13_ATOMS` in `curriculum/m13.ts`), and this module invents
no imageable noun of its own (m30's seven body nouns are already
vendored and unchanged). No `src/pub/noto-emoji/svg/` work applies. This
is the second module in a row with zero vendoring work (after m30) —
still, re-verify at ship time per the same discipline m30's own brief
required.

### The 7 registration points — verify by hand

register-mod.py touches 6 files across roughly 10 edit points; confirm
each by hand after running it:
- [ ] `curriculum/index.ts` — import added, lesson map entry added, meta
      card inserted with title/eyebrow/summary/accent exactly as passed.
- [ ] `grammarHelpers.ts` — `ES_MODULE_ORDER` now ends `..., "m30",
      "m31"`.
- [ ] `courseAtoms.ts` — import of `ES_M31_ATOMS` added, `EsAtomSource`
      type union includes `"m31"`, spread into the atom registration
      list.
- [ ] `curriculum/es-quality.test.ts` — `ES_M31_CHECKPOINT_INDEX`
      imported and mapped (pattern-matched from m30's own entries — the
      exact constant name was not independently re-derived from a spec,
      only inferred by naming convention; flagged UNVERIFIED below).
- [ ] `placementBank.ts` — import and array entry added.
- [ ] Accent colors `#fb7185`→`#9f1239` appear exactly once each, on
      m31's own card, nowhere else.

## Decisions inferred (no open questions were parked)

- **«doler» over tener-que / estar-gerundio / comparatives / commands,
  decided in favor of «doler».** m30's own header already named «doler»
  as the natural next module and rejected it only for m30's own scope,
  not as unready — see "The decision this module resolves" above. Of
  the remaining candidates the task asked to weigh honestly: `tener que`
  is real but is a fourth instance of a shape this course already has
  three times (querer/poder m14, ir a m28) with zero connection to m30's
  vocabulary — weakest recombination story of any candidate. `estar +
  gerundio` needs genuinely new morphology (-ando/-iendo), a bigger lift
  than recombining an existing frame. Comparatives carry an unresolved
  `como`-homograph risk m29's own header already flagged and did not
  clear. Commands need a full new verb-mood paradigm — confirmed "too
  big" on inspection, matching the task's own instinct. «Doler» is the
  only candidate that is (a) genuinely new grammar-adjacent content, (b)
  built on a word order that is already 100% PRIOR (m13), and (c)
  maximally recombines with the module directly before it. All four
  rejected candidates are left open as real future modules with reasons
  recorded, not silently dropped.
- **Correcting m30's own REJECTED ALTERNATIVE 4, not silently deferring
  to it.** m30's header undersold how much of the dative-experiencer
  frame m13 already shipped, the same kind of stale-framing correction
  m29's own header had to make against m28's brief. Named explicitly in
  `m31-header.yaml` rather than repeated uncritically.
- **Only 2 new atoms (`duele`, `duelen`).** m30's own seven body nouns
  supply every grammatical subject this module needs; adding a "health
  vocabulary" set (cabeza, garganta, estómago, espalda, hombro) was
  considered and rejected — not because it's a bad idea, but because
  m30's nouns already give full, natural coverage and this module's own
  framing is closer to m29's "thin placement rule" precedent than m30's
  own "7 new nouns" one. Reserved as a future 3–5 atom recombination
  lesson, the same sizing and courtesy m30 itself extended to house
  vocabulary.
- **Scope: yo/tú/3rd-singular-via-`le` only, no `nos`/`les`.** Mirrors
  m13's own taught scope exactly rather than opening a new dative-
  plural gap this module wasn't asked to close.
- **The central discrimination is "never conjugate to the person," not
  a word-order foil.** Named and reasoned explicitly (see the dedicated
  section above) rather than copying m29's "third position" framing
  wholesale — this module's actual risk is different (subject-agreement
  transfer, not clitic-position transfer) and deserves its own correctly
  -reasoned rule, not a reused label.
- **L9 as the `tengo`-vs-`duele` contrast lesson, checkpoint at L8.**
  Pattern-matched against m29's and m30's own identical placement (both
  contrast-at-9, checkpoint-at-8) — no other convention found stated
  explicitly in the authoring docs, same inference basis both those
  briefs already flagged.
- **Accent: rose `#fb7185`→`#9f1239`.** Checked against every `accent:`
  pair in `curriculum/index.ts` (zero collision, all 30 pairs read) and
  against the four most recent modules specifically (m27 yellow, m28
  green, m29 slate, m30 teal) — reads distinctly from all four and from
  every PRIOR rose/red/pink pair already spent.
- **Corrected the pipeline-command paths inherited from m30's own
  brief.** `compile-ir-es.mjs` and `gen-es-review-pool.mjs` live under
  `scripts/`, not `docs/es-ir-sources/` — verified by direct file
  listing (`find . -iname` for both) before writing this brief's
  pipeline section, rather than copying m30's brief text uncritically.
  This is a real error in m30's own brief, named here so it doesn't
  propagate a third time.

## Claims marked UNVERIFIED

- Whether `m13.test.ts` contains an explicit "*yo gusto"-style foil pin
  that m31's own "never conjugate to the person" rule could cite as
  direct precedent. Grepped for `gusto`/`gustas` in `m13.ts`/`m13.test.
  ts` while writing this brief and found no such foil (only the
  unrelated idiom "mucho gusto," a false match) — the central-
  discrimination rule above is reasoned from the grammar and from m13's
  own "sentence that runs backwards" module title, not copied from a
  confirmed test. A drafting agent should still write the pin fresh
  for m31 rather than assuming an m13 equivalent exists to crib from.
- Whether the checkpoint constant this module will need is named
  `ES_M31_CHECKPOINT_INDEX` exactly — inferred by pattern-match against
  `ES_M30_CHECKPOINT_INDEX`'s confirmed-live naming, not independently
  re-derived from `register-mod.py`'s own template logic (though reading
  that script for this brief did confirm it constructs the name via
  simple `{prev}`/`{new}` string substitution, which is consistent with
  the pattern holding).
- Whether a "head" emoji genuinely has no clean single-referent
  candidate in `src/pub/noto-emoji/svg/` — checked only by reasoning
  about two obvious candidates (🤕 face-with-bandage, 🧠 brain), not by
  an exhaustive listing of every glyph in that directory. If a future
  author wants to add `cabeza` as a recombination-lesson atom, re-check
  properly before assuming the ceiling rule blocks it.
- Whether `getEsPluralCanon` (or equivalent) correctly accepts or
  correctly rejects the irregular z→c plural `narices` — unresolved
  since m30's own brief flagged it (m30's shipped commit removed
  `narices` from learner-facing text rather than resolving the
  question); m31 inherits the same open question and the same
  workaround (never pluralize `nariz`).
