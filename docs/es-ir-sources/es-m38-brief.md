# ES m38 dispatch brief — "Hay que limpiar la casa" (rooms of a house, lexicon break)

## Status

m37 («hay que trabajar», grammar module) is fully landed: `curriculum/m37.ts` exists
and compiles, `ES_MODULE_ORDER` (`grammarHelpers.ts`) ends `..., "m36", "m37"`,
`es-quality.test.ts` imports and maps `ES_M37_CHECKPOINT_INDEX`, and
`esSimNpcProvenance.test.ts`'s `KNOWN_LEGACY` allowlist correctly carries no
m37 entry (the gate is fully live for it, no legacy leniency). m38 is the next
module, immediately following m37 in `ES_MODULE_ORDER`.

One correction to record: `es-m37-brief.md`'s own "decisions inferred" section
claimed Lupita would stay in reserve after m37. That did not ship — direct grep
of `curriculum/m37.ts` (`grep -io 'speaker: "lupita"'`) shows m37 used BOTH
Marta and Lupita as `speaker:` values. This brief does not inherit that stale
claim; see "PRIOR vocabulary" below for the corrected proper-name accounting.

## Files read, in order

1. `docs/es-ir-sources/m38-header.yaml` — this module's own header, written
   alongside this brief. Read it FIRST — this brief expands on its logistics,
   not its reasoning. The header carries the full WHY-THIS-MODULE-NOW
   argument, all REJECTED sections, the LIMPIAR bare-infinitive-only section,
   the JARDÍN plural landmine, the credit trap, and the DALIA correction —
   none of that is repeated in full here.
2. `docs/es-ir-sources/es-m37-brief.md` + `m37-header.yaml` — structural
   template for both files; `m37-header.yaml`'s HAY QUE sections are the
   direct precedent for this module's own «hay que»/«tengo que» + «limpiar»
   pairings.
3. `docs/es-ir-sources/es-m36-brief.md` + `m36-header.yaml` — the most recent
   LEXICON BREAK; this brief mirrors its section skeleton exactly, and its
   header's own REJECTED-house/rooms reasoning is the thing this module's own
   header explicitly reverses (see m38-header.yaml's WHY THIS MODULE, NOW §2-3).
4. `docs/es-ir-sources/authoring-rules.md` — dialogue_sim NPC provenance rule;
   "agreement is not a new atom" / "de niño" precedent, directly informing the
   jardín-singular-only decision.
5. `docs/lesson-authoring-guide.md` §13 — image-MCQ-as-introduction (13.1-13.2,
   governs limpiar's own L6 debut and every noun's own L1-L5 debut),
   just-in-time grammar (13.3, N/A here — zero new grammar), close-on-confidence
   (13.5), grading=review-only (13.6), atom registry discipline (13.8).
6. `docs/pedagogy-principles-2026-07-05.md`, `docs/course-design-learnings-2026-08-21.md`
   — background cross-course doctrine (interleaving, recombination-over-volume).
7. `CLAUDE.md` lenses.
8. Shipped `curriculum/m34.ts`, `m36.ts`, `m37.ts` and their fragments
   (`m37-L*.yaml`) — confirmed lesson-fragment shape and header-to-fragment
   split (header ends in bare `lessons:`, fragments are separate files).
9. `courseAtoms.ts`, `grammarHelpers.ts`, `es-quality.test.ts`,
   `docs/es-ir-sources/register-mod.py`, `scripts/gen-es-review-pool.mjs` —
   conventions verified directly, cited inline below.

## The decision this module resolves

Theme: **the rooms/areas of a house** — dormitorio, sala, comedor, jardín,
garaje — plus one new verb, **limpiar** (bare infinitive only), to fill m33's
«tengo que» and m37's «hay que» with a fresh, high-value object. Full
reasoning (rhythm, prior-rejection reversal, kitchen/food-round-2 and
family-round-2 re-weighing) is in `m38-header.yaml`'s own "WHY THIS MODULE,
NOW" and "REJECTED" sections — not duplicated here. Short version: this is
the exact candidate `m36-header.yaml` itself left open ("a natural home for a
… 'describe your house' break"), and the objection that blocked it then (weak
recombination, only three hooks) is now answered by m37's own «hay que», which
gives a room a genuinely natural obligation frame it didn't have before.

## PRIOR vocabulary — re-runnable greps

House-object nouns already registered (m3/m4/m17), reconfirmed this round —
**do not re-teach, may recombine freely**:
```
grep -oE 'surface: "(casa|puerta|silla|ventana|mesa|cama|baño|cocina|cuarto|ducha)"' \
  src/features/languages/es/curriculum/m*.ts | sort -u
```
All ten return hits (m3/m4/m17). This module's own five nouns — confirmed
zero-hit virgin:
```
grep -iE '"(dormitorio|sala|comedor|jardín|jardin|garaje)"' \
  src/features/languages/es/curriculum/m*.ts
```
returns nothing. `limpiar` — confirmed zero-hit virgin (no conjugated form
either):
```
grep -iE '\blimpi[oaáé]' src/features/languages/es/curriculum/m*.ts
```
returns nothing.

Structures this module recombines, all PRIOR and fully taught — no new
grammar introduced:
- «hay que + infinitivo» (m37), «tengo que + infinitivo» (m33)
- «está + cerca/lejos/al lado de» (m35), «hay» existential (m3/m37 dual-status)
- «voy a» / «voy al» (m9), possession «tengo» (m1x)

Proper names — full-course speaker accounting (see m38-header.yaml's own
DALIA section for the m37-brief correction): every `ES_PROPER_NAMES` human
name has appeared as a `speaker:` at least once except `dalia`, confirmed by
`grep -Lio 'speaker: "dalia"' src/features/languages/es/curriculum/m*.ts`
(no file matches). Dalia debuts as this module's own NPC.

## What this module does NOT teach

- No new grammar of any kind — no new tense, no new conjugation paradigm, no
  new connector. «hay que»/«tengo que» + infinitivo is 100% prior (m33/m37).
- No conjugated form of `limpiar` — infinitive only (see header's dedicated
  section; `m38.test.ts` must scan and fail on any standalone
  `limpio|limpias|limpia|limpiamos|limpian|limpié|limpiaba`).
- No plural of `jardín` anywhere in this module's content (gate gap — see
  header's landmine section).
- No kitchen/food-round-2 or family-round-2 vocabulary (both re-weighed and
  rejected again this round — reasons in header, re-verified not inherited).
- No re-teaching of any m3/m4/m17 house-object noun.

## Step kinds

Standard mix per `lesson-authoring-guide.md` §13: image-MCQ debut for every
new noun and for `limpiar` (honest emoji, §13.1-13.2), build/tile steps for
«hay que/tengo que + limpiar + [room]» sentences, cloze for «está al lado
de»/«lejos de» recombination sentences, dialogue_sim at L7 (Dalia debut) and
L10 (mastery sim chaining m35/m37 structures), checkpoint review-only steps
at L8. No typed-translate, no silent_letter (beginner-tier ban, per
step-type doctrine). Max-acceptance tile banks per prior modules' own
precedent.

## Hard rules the gates enforce (carried forward + module-specific)

Carried forward, unchanged, still live:
1. `irAtomResolution.test.ts` — zero-tolerance exact-surface atom credit.
   This module's five nouns are single-word, no fusion risk; watch the
   «hay que»/«tengo que» PHRASE ATOM splitting trap (see next item).
2. Cross-module RECALL LAW (`es-course-integrity.test.ts`) — this module's
   dialogue_sim and mastery sim must recall m35/m37 structures, not just
   this module's own nouns.
3. `cue: recall` is an independent YAML flag — set explicitly on recall
   steps, never inferred from content.
4. `esSimNpcProvenance.test.ts` — NPC lines (Dalia, L7/L10) must resolve
   every word to: this module's own 6 atoms, any PRIOR atom, a taught verb
   conjugation, `ES_FUNCTION_WORDS`, or `ES_PROPER_NAMES`. `KNOWN_LEGACY`
   tail is still `m28` — zero legacy leniency for m38. Never a conjugated
   `limpiar` form in any NPC line.
5. Inventory rule 28 — full-sentence MCQ ban still applies.
6. `assemble-mod.sh` must run under zsh, not bash.
7. Build tiles bill exposure — `esSurfaces()` bills cloze options and
   tiles, not MCQ distractors (per `es-which-slots-are-billed` doctrine).
8. `esTokens()` drops length-1 tokens (`.filter((t) => t.length > 1)`) —
   irrelevant here (no 1-letter surfaces in this module) but checked.
9. Emoji uniqueness across modules, restricted to `atom({...emoji:...})`
   occurrences only (scene-decoration/MCQ-option-icon emoji are a separate,
   non-colliding field — established m36-brief 🚇 precedent). All 6 of
   this module's emoji cleared — see "Vocab card art" below.
10. Info cards can't quote bare suffixes.
11. No comma before «y»/«o».
12. `atoms:`/`exercisedAtomSurfaces` credit trap — «hay que»/«tengo que»
    are ALREADY-REGISTERED phrase atoms (m37/m33); a sentence like "hay que
    limpiar el comedor" must credit `["hay que", "limpiar", "comedor"]`,
    never split into `["hay", "que", ...]`. See header's own section.
13. "Agreement is not a new atom" — this module's five nouns inflect
    regularly for number per `esRegularPlurals()`/`getEsPluralCanon()`,
    EXCEPT jardín (next item).

New this module:
14. **JARDÍN PLURAL LANDMINE** — `esRegularPlurals("jardín")` computes
    `"jardínes"` (wrong Spanish; no `/ín$/` accent-drop branch exists,
    unlike the `/ón$/` branch that already handles `estación`→`estaciones`).
    Verified by direct execution against the live function body. This
    module's own content keeps `jardín` singular-only throughout — never
    forces the wrong-Spanish gate output, never ships a form the scope-check
    can't recognize. Flagged as real future gate work (add `/ín$/` branch),
    not fixed inline (out of scope for a lexicon break).
15. **LIMPIAR bare-infinitive-only** — registered exactly like m28's `ir`
    precedent (`curriculum/m28.ts:29`): one dictionary-form atom, zero
    conjugated forms registered or taught. `m38.test.ts` needs its own
    `ILLEGAL_PRESENT_FORMS`-style scan (precedent: m24/m25) for
    `limpio|limpias|limpia|limpiamos|limpian|limpié|limpiaba`.

## SIM NPC lines — safe word list

Dalia (L7, L10) may use: this module's own 6 atoms (dormitorio, sala,
comedor, jardín [singular only], garaje, limpiar [infinitive only]); any
PRIOR atom (casa, puerta, cocina, baño, cuarto, está, hay, hay que, tengo
que, cerca, lejos, al lado de, voy a, etc. — full list is whatever
`courseAtoms.ts` has accumulated through m37); taught conjugations of
already-taught verbs; `ES_FUNCTION_WORDS`; `ES_PROPER_NAMES`. Excluded:
any conjugated `limpiar` form, plural `jardín`, any m38-and-later atom
(none exist yet), any word outside the above.

## Usage-note budget

Standard per-lesson budget matching m36/m37 (short, register-mod.py-style
one-liners on new-atom debut cards only; no budget overrun risk — five
regular nouns + one bare-infinitive verb is a light module by prior
lexicon-break standards).

## 10-lesson plan

| L | Focus | New atoms | Recombines |
|---|---|---|---|
| L1 | dormitorio debut (image-MCQ) | dormitorio | — |
| L2 | sala debut + «está al lado de» | sala | m35 |
| L3 | comedor debut + «hay que» intro pairing | comedor | m37 |
| L4 | jardín debut (singular-only) + «está lejos de» | jardín | m35 |
| L5 | garaje debut + «voy al» | garaje | m9 |
| L6 | limpiar debut (image-MCQ, bare infinitive) | limpiar | m33, m37 |
| L7 | dialogue_sim — Dalia, house-cleaning chores | — | all 6 + m33/m35/m37 |
| L8 | checkpoint (review-only grading) | — | all 6 |
| L9 | chaining drills — «hay que»/«tengo que» + room + «está»/«al lado de» | — | m33, m35, m37 |
| L10 | mastery sim — full chaining, Dalia + recall of m35/m37 | — | all prior + this module |

## What to report back

After assembly/compile/register/pool-regen: lesson count (expect 10),
checkpoint index wiring (`ES_M38_CHECKPOINT_INDEX`), atom count (6),
any gate failures (especially the jardín-plural and limpiar-conjugation
scans), and confirmation the m37-brief's stale Lupita claim doesn't recur
(Dalia used, not a name already spent).

## Exact pipeline commands

Run from `$LINGO_ROOT` (re-export in every new shell: `export LINGO_ROOT=$PWD`).
Not run as part of this brief-writing task — recorded for the authoring
agent that picks this up next.

1. Author `docs/es-ir-sources/m38-L1.yaml` through `m38-L10.yaml` fragments
   (+ `m38-placement.yaml` if the pattern requires one — check m37's own set).
2. `bash docs/es-ir-sources/check-frag.sh` per-fragment as authored (stub
   module is m15; only run if prior briefs did so at authoring time, not a
   research-task action).
3. `zsh docs/es-ir-sources/assemble-mod.sh m38`
4. `node scripts/compile-ir-es.mjs m38`
5. `python3 docs/es-ir-sources/register-mod.py m37 m38 "Hay que limpiar la casa" "<eyebrow>" "<summary>" "#16a34a" "#166534"`
6. `node scripts/gen-es-review-pool.mjs`
7. `npx vitest run src/features/languages/es/curriculum/m38.test.ts --project curriculum`
8. Full ES curriculum gate: `npx vitest run --project curriculum` (or the
   project's standard invocation) before considering the module done.
9. Confirm `ES_MODULE_ORDER` now ends `..., "m37", "m38"`.
10. Confirm `esSimNpcProvenance.test.ts`'s `KNOWN_LEGACY` tail is untouched
    (still `m28` — m38 needs zero legacy allowance, full provenance).
11. Confirm `es-quality.test.ts` picks up `ES_M38_CHECKPOINT_INDEX`.

Suggested `register-mod.py` args (drafted, not final — authoring agent may
refine eyebrow/summary wording): title `"Hay que limpiar la casa"`, eyebrow
something like `"Around the house"`, summary something like `"Name every
room and say what needs cleaning."`, accent `#16a34a` → `#166534`.

## Vocab card art

Zero vendoring needed — all 6 target emoji already present in
`src/pub/noto-emoji/svg/`, confirmed via `ls`:
- `emoji_u1f4a4.svg` (💤 dormitorio)
- `emoji_u1f4fa.svg` (📺 sala)
- `emoji_u1f37d.svg` (🍽️ comedor)
- `emoji_u1f33b.svg` (🌻 jardín)
- `emoji_u1f6e0.svg` (🛠️ garaje)
- `emoji_u1f9f9.svg` (🧹 limpiar)

Both 🍽️ and 🛠️ appear elsewhere in the codebase as non-atom decorations
(m7/m11/m15/m28/m37 `scene:` emoji for 🍽️; m10 MCQ-option decoration for
🛠️) — confirmed via atom-registry-restricted grep
(`grep -n 'emoji: "🍽️"' … | grep 'atom('`, etc.) that neither has an
existing ATOM binding, clearing both for this module's own atom use per
the m36-brief 🚇 precedent methodology.

## Decisions inferred (recorded, never parked)

- **House/rooms chosen over kitchen/food-round-2 and family-round-2** —
  reversal of `m36-header.yaml`'s own prior rejection, justified by m37's
  new «hay que» hook; full reasoning in `m38-header.yaml`. Recorded, not
  asked.
- **Limpiar added as the module's 6th atom, bare-infinitive-only** — chosen
  because it cashes in both m33 and m37 obligation constructions at once,
  the single highest-recombination-value word available; scope deliberately
  limited to the infinitive to preserve "zero new grammar" lexicon-break
  status. Precedent: m28's bare `ir`.
- **Jardín kept singular-only** — gate gap discovered this round
  (`esRegularPlurals` has no `/ín$/` accent-drop branch); rather than force
  wrong Spanish or an unrecognized correct form (the "de niño" mistake
  `authoring-rules.md` warns against), content avoids the plural entirely.
  Flagged as future gate work, not fixed inline.
- **Dalia selected as this module's NPC**, correcting `es-m37-brief.md`'s
  stale claim that Lupita remained in reserve (m37 actually used both Marta
  and Lupita). Dalia is confirmed the last never-used name in
  `ES_PROPER_NAMES`; a future module needing a fresh NPC will need to
  extend the allowlist itself.
- **Accent `#16a34a` → `#166534`** chosen after exhaustive collision check
  against every hex in `curriculum/index.ts`; reads as "healthy
  houseplant/garden," distinct from every existing green-family pair.
- **Town/places round 3 not seriously re-litigated** — already fully
  exhausted by `m36-header.yaml`; reconfirmed zero-candidate, not treated
  as a live alternative.

## Claims marked UNVERIFIED

- The exact fragment-file convention for a lexicon break with no placement
  quiz content (whether m38 needs its own `m38-placement.yaml` the way
  grammar modules do) — UNVERIFIED; not confirmed against m34/m36's own
  fragment directory listing in this research pass. Authoring agent should
  check `ls docs/es-ir-sources/m36-L*.yaml docs/es-ir-sources/m36-placement.yaml*`
  before assuming either way.
- Suggested eyebrow/summary strings in the pipeline-commands section are
  drafted, not verified against any style guide beyond pattern-matching
  m37's own register-mod.py invocation — treat as a starting draft only.
- Whether `m38.test.ts` needs to be hand-authored or is generated by
  tooling alongside `assemble-mod.sh`/`compile-ir-es.mjs` — UNVERIFIED;
  this brief assumes hand-authoring (matching m24/m25's own
  `ILLEGAL_PRESENT_FORMS` precedent) but the actual generation mechanism
  for `mN.test.ts` files was not traced end-to-end in this research pass.
