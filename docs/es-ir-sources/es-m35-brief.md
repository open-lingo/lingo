# ES m35 dispatch brief — "El banco está cerca" (location description, the m4 revival)

**Status (2026-09-10):** m34 ("Necesito ir al banco") is ALREADY FULLY
LANDED — confirmed via `git log --oneline` showing `03ce8fda` "es: m34
«Necesito ir al banco» (errands lexicon break, 10 lessons, 5 atoms, 116
clips)" followed by `4ebd0cd9` "ledger: ES m34 + KO m14" (current tip at
time of writing). `ES_MODULE_ORDER` in `grammarHelpers.ts` ends `...,
"m33", "m34"`; `courseAtoms.ts` imports `ES_M34_ATOMS` and spreads it;
`es-quality.test.ts` imports and maps `ES_M34_CHECKPOINT_INDEX`;
`placementBank.ts` imports/arrays `ES_M34_PLACEMENT`; `esReviewPool.ts`
carries all 5 of m34's own rows (`banco`/`farmacia`/`hospital`/`correo`/
`supermercado`, confirmed by direct grep — the review-pool regen step was
NOT skipped this round). All registration points confirmed by hand, not
trusted from the commit message. No `m35-*` file exists anywhere in
`docs/es-ir-sources/` yet — this brief and `m35-header.yaml` are the only
m35 artifacts. [[concurrent-sessions-same-repo]] applies: `git status`
shows unstaged edits to `scripts/i18n/mt-translate-catalog.mjs`,
`src/features/languages/ja/conjugation/transformRulesets.ts`, and
`src/features/languages/ja/courseAtoms.ts`, plus untracked FR/JA files
(`src/features/languages/fr/curriculum/m24.ts`, three new
`noto-emoji/svg/` files, three `tts-*-m34.txt` files) — all from a
concurrent session, none touching ES paths, not this lane's concern.
Per the dispatching task's own instruction, a reviewer may be editing
m34's own fragment files (`docs/es-ir-sources/m34-L*.yaml`) concurrently
— **read only, never modify** (this brief did not touch them). This
brief itself only reads and writes the two files it was asked to
produce; it does not stage, run pipeline scripts beyond research greps,
or commit anything.

## Files — read in this order

1. **This file.**
2. **`m35-header.yaml`** (same directory) — READ THIS FIRST once you
   start drafting. It carries the full WHY/REJECTED/SCOPE reasoning as
   inline YAML comments, denser than this brief. In particular: the
   **m4 three-way revival** section (why «está» gets fresh content for
   the first time since m4 itself), the **motion-vs-location
   discrimination** section (the central transfer error), the **scope
   note on why `estoy`/`estás` are deliberately NOT this module's job**,
   and the **`atoms:` credit trap** section (this module's own version of
   the "X que"-bigram failure class, now shaped "al lado de[l]").
3. `docs/es-ir-sources/es-m34-brief.md` + `m34-header.yaml` — immediately-
   PRIOR module; corrected several errors from m32's own brief (register-
   mod.py's true signature, `placementBank.ts` as the 5th registration
   point) — those corrections carry forward unchanged, verified again in
   this brief (see "Exact pipeline commands" below).
4. `docs/es-ir-sources/es-m33-brief.md` + `m33-header.yaml` — closest
   STRUCTURAL precedent for the REJECTED-alternatives writing style and
   for "fill only the genuine gap" discipline (m28's own «va»); this
   module goes one step further — zero gap, not a partial one.
5. `docs/es-ir-sources/authoring-rules.md` — dialogue_sim NPC-line
   provenance rule; "agreement is not a new atom" (load-bearing this
   round — see `lado`'s regular plural fold in the header).
6. `docs/lesson-authoring-guide.md` §13.1-13.3 — card-type rubric (13.1;
   this module's 3 atoms are all non-imageable — 2 invariant adverbs, 1
   noun with an ambiguous rather than honest image — so §13.2's
   image-MCQ-as-introduction does NOT apply, matching m28/m31/m33's own
   non-imageable grammar atoms); just-in-time grammar teach (13.3 — rule
   card right before the construct is needed, one contextual exposure,
   real retrieval, then a discrimination beat).
7. `docs/pedagogy-principles-2026-07-05.md`,
   `docs/course-design-learnings-2026-08-21.md` — background doctrine
   (JA-authored but the "how" generalizes: deduction-first, just-in-time
   grammar, module shape derived from the module not assumed by gates).
8. `CLAUDE.md` — "What we're building" (top) and "The lenses we teach
   from" (~line 131-160): deduction-first, no hollow cards, interleave-
   don't-block-teach, explanations budget ~3 short lines.
9. Shipped fragments/compiled files actually read for this brief:
   `curriculum/m3.ts` (lines 29-47, 411-460 — «hay»'s own debut and its
   own module description), `curriculum/m4.ts` (lines 1-160 — «está»'s
   own debut, the module's own "«hay» says exists, «está» says where"
   framing this module revives, `dónde`/`allí` context), `curriculum/
   m9.ts` (the places-in-town PRIOR set: `voy`/`vas`/`a`/`al`/`adónde`),
   `curriculum/m34.ts` (first ~40 lines plus the 5-noun atom block — the
   PRIOR lexicon this module recombines against), `curriculum/m34.test.ts`
   (full read — corrected an UNVERIFIED item from `es-m34-brief.md`:
   `leche` is registered at **m7**, not m11 as the m34 brief's own
   paraphrase claimed; noted here in case a future module needs `leche`
   again), `esSimNpcProvenance.test.ts` (`KNOWN_LEGACY` tail, confirmed
   still `m28`), `moduleBarGuards.ts` (`ES_FUNCTION_WORDS`,
   `esRegularPlurals`, `esTokens`, the mastery-exemption derivation).

## The decision this module resolves

Course rhythm since the last grammar beat: m30 body (break) → m31 «me
duele/duelen» (grammar) → m32 clothing round two (break) → m33 «tengo
que + inf» (grammar) → m34 errands/places (break). The grammar beat due
after m34 is on schedule. m35 is that beat: **location description —
«está» + cerca/lejos/lado — zero new grammar in the conjugation sense
(the verb is fully PRIOR since m4/m18), exactly THREE new atoms, taught
by deduction from the contrast the course already set up at m4 itself
and never finished paying off.**

Eight candidates were weighed against the actual atom registry (not
assumed from the task's own framing) — poder+inf, querer+inf, hay+place,
para+inf (purpose), estar+location, ponerse/llevar, imperative tú,
demonstratives. Full reasoning, grep evidence, and rejection rationale
for all eight is in `m35-header.yaml`'s WHY/REJECTED sections. Short
version: **`poder`/`querer`/demonstratives are DISQUALIFIED outright**
(all fully taught already — m14, m7/m14, m12 respectively; zero
paradigm gap, nothing new to teach). **`hay` is not this module's own
new idea either** (fully PRIOR since m3) but is kept as the THIRD leg of
this module's own three-way recombination, not discarded. **`para`+inf
purpose and `ponerse`/`llevar` are real future content**, explicitly
weighed and set aside this round on scope/recombination grounds (see
header). **Imperative tú has no learner-need justification** (same
finding m33-header already reached, unchanged one module later).

**`estar` + location won** on:

- **Zero new verb morphology — a genuine zero-conjugation-gap module.**
  `está` (m4), `estamos`/`están` (m18) are ALL already fully taught, and
  cover every person this module's own sentences need (place-nouns are
  always 3rd person, singular or plural). `estoy`/`estás` remain a real,
  unfilled paradigm gap — deliberately NOT this module's job (see the
  header's dedicated scope note; every sentence here is a claim ABOUT a
  place, never about the learner's own location).
- **The richest recombination story of any candidate weighed, by a wide
  margin — NINE prior modules reached, not merely tied.** `hay` (m3),
  `está`/`dónde`/`allí` (m4), `es`/`son` (m2/m18, for the full three-way
  naming/existence/location contrast m4 itself first drew), `aquí` (m3),
  `voy`/`vas`/`a`/`al`/`adónde` (m9), `necesito` (m16), `estamos`/`están`
  (m18), `ir` (m28), `tengo que` (m33), and — the freshest lexicon this
  course has — m34's own five places. No other candidate reaches more
  than a handful of these; see the header's WHY section for the
  side-by-side count against m34-header's own four-hook claim (the
  previous record).
- **A live hook back into m4 itself, unique to this candidate.** `m4.ts`
  line 49's own module description already states the exact contrast
  this module revives: "«hay» says something exists — «está» says
  exactly where it is... m2's «es» still NAMES things... Three jobs,
  three words." That framing was taught once, on house objects, at the
  very start of the course, and never given adult content since. This
  module is the payoff.

## PRIOR vocabulary — re-runnable greps

```
export LINGO_ROOT=$PWD  # from the worktree root
grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..34}.ts | sort -u > /tmp/es_prior_surfaces.txt
grep -iE '^"(cerca|lejos|lado)"$' /tmp/es_prior_surfaces.txt
# → zero hits, confirms all three new atoms are virgin
grep -iE '^"(puedo|puedes|puede|poder|quiero|quieres|quiere|querer|hay|está|estamos|están|este|esta|estos|estas|ese|esa|esos|esas)"$' /tmp/es_prior_surfaces.txt
# → all present, confirms every rejected/reused candidate's true status
grep -iw '"estoy"\|"estás"' /tmp/es_prior_surfaces.txt
# → zero hits, confirms the estoy/estás gap this module deliberately does not fill
```

**Fully PRIOR and this module's own verb, zero gap:** `está` (m4, "is
[somewhere]"), `estamos`/`están` (m18). `hay` (m3, "there is/are"),
`es`/`son` (m2/m18, "is/are [named as]") — the full three-way contrast,
reused not re-taught.

**Fully PRIOR and this module's own richest recombination lexicon (m34,
the five errands places):** `banco` m 🏦, `farmacia` f 💊, `hospital` m
🏥, `correo` m 📮, `supermercado` m 🏬.

**Other PRIOR frames used:** `voy`/`vas`/`a`/`al`/`adónde`/`dónde` (m4/
m9), `aquí`/`allí` (m3/m4), `necesito`/`necesitas`/`necesita` (m16), `ir`
bare infinitive (m28), `tengo`/`tienes`/`tiene` + `que` (m33),
`duele`/`duelen` (m31) + m30's body nouns (for a pain-to-pharmacy chain
at L10, optional recombination, not load-bearing).

**Confirmed NOT PRIOR (verified zero grep hits, do not assume
otherwise):** `cerca`, `lejos`, `lado` (this module's own three atoms),
`estoy`, `estás` (the deliberately-unfilled paradigm gap), `tomar`,
`ponerse`, `llevar`, any imperative/command form of any verb, the
literal purpose-clause use of `para` (the word itself is a free function
word, `ES_FUNCTION_WORDS`, but has never been taught or credited as
purpose-linker content — see header).

## What this module does NOT teach

- **No `estoy`/`estás`.** Every sentence is a claim about a PLACE
  (3rd person, singular or plural), never about the learner's own
  location. Real future content for a different module — see header's
  dedicated scope note. Do not let a drafting agent reach for «estoy»
  out of habit in a dialogue_sim NPC line or build-tile bank.
- **No `para` + infinitivo (purpose).** `para` remains usable only as
  the already-free function word it's always been (e.g. incidental
  benefactive color, "un regalo para Ana"-style, if it comes up) — never
  as a taught purpose-clause construct, never credited via `atoms:`.
  Real future content, explicitly deferred (see header's REJECTED
  section — and note the correction there: m34's own brief/header do
  NOT literally defer «para»/«cerca»/«lejos» anywhere in their text,
  despite a claim to that effect; this brief's own deferral of `para`
  is reasoned independently, from this round's own grep evidence).
- **No idiom-phrase atom for «al lado de».** Built compositionally from
  already-free `al`/`del` + the one registered noun `lado` — see header's
  dedicated "agreement is not a new atom" section for why this is a
  noun-registration, not a phrase-atom, decision.
- **No new conjugation of `estar`, `hay`, `ser`, `ir`, `necesitar`, or
  `tener`** beyond what m2/m3/m4/m9/m16/m18/m28/m33 already registered.
- **No `ponerse`/`llevar`, no imperative tú, no new demonstrative.** All
  evaluated and rejected — see header REJECTED sections for reasons.

## Step kinds

No imageMcq debut — `cerca`/`lejos` are invariant relational adverbs
with no honest single-referent image, and `lado` (side) has an image
that would read as arbitrary rather than disambiguating (§13.1's
"bad image is worse than no image" ceiling rule) — the same
non-imageable category as m13's `gusta`, m28's `va`, m31's
`duele`/`duelen`, m33's `tengo que`. Introduce each new atom via
`infoStep` (2-3 lines, per the usage-note budget below) immediately
followed by `build`/`cloze` production practice on the SAME sentence
(guide §13.3's just-in-time cadence). `dialogue_sim` carries the
recombination lessons (L7 asking-for-directions, L10 mastery);
`sentenceMcq`/`textMcq` distractor pools must include the motion-vs-
location foil (see header) as the central discrimination — never a
correct-answer position for the foil.

## Hard rules the gates enforce (carried forward + this module's own new one)

1. **`atoms:` credit — this module's own version of the bigram trap,
   read before drafting a single step.** `irAtomResolution.test.ts` is
   zero-tolerance exact-surface. A sentence "el banco está al lado del
   correo" credits `atoms: ["está", "lado", "banco", "correo"]` (plus
   whatever else the sentence's own words resolve to) — **never**
   `atoms: ["al lado de"]` or `["al lado del"]`; those strings are not
   registered surfaces (this module deliberately registered only `lado`,
   not the phrase — see header) and the credit would silently vanish,
   exactly the "X que"-bigram failure class m33/m34 already flagged, now
   recurring in a new shape.
2. **"Agreement is not a new atom"** (`authoring-rules.md`) — `lado`
   is regular masculine, vowel-final → `+s` (`esRegularPlurals()`,
   `moduleBarGuards.ts:168-174`, traced directly this round): plural
   `lados`. `cerca`/`lejos` are invariant, nothing to fold. Scope-check
   only, per the same rule every prior module has carried.
3. **`ES_FUNCTION_WORDS` already contains `está`/`están`/`estar`/`hay`/
   `aquí`/`allí`/`es`/`son`/`soy`/`eres`/`ser`/`para`/`por`/`con`/`sin`/
   `sobre`/`entre`/`desde`/`hasta`** (`moduleBarGuards.ts:72-88`) — a
   SCOPE-CHECK allowlist, not a taught-content registry. Do not confuse
   "legal in an NPC line for scope purposes" with "creditable via
   `atoms:`" — only the exactly-registered vocab-atom surfaces may be
   credited. See header for the full explanation of why this distinction
   matters this round specifically.
4. **Build tiles are billed exposure** ([[es-which-slots-are-billed]]) —
   `esSurfaces()` bills cloze options and build tiles, not MCQ
   distractors. Any PRIOR surface placed as a build-tile distractor must
   itself be a legally registered surface at that point in the course.
5. **`esTokens()` drops length-1 tokens** (`moduleBarGuards.ts:63-65`) —
   so «a»/«y»/«o» can never be a `particle_cloze` option; this module's
   own function words at risk of this trap are «a» (as in «cerca de» vs
   the m9 motion «a») — use the multi-letter surrounding words for any
   cloze slot, not a bare single-letter particle.
6. **Full-sentence MCQ ban** (invariant 28, `lintFullSentenceMcqs` in
   `moduleBarGuards.ts`) — correct MCQ answers ≤3 tokens.
   `looksSpanish()` folds inflections via `getEsPluralCanon()`/
   `getEsGenderCanon()`. The FINAL lesson (mastery, L10) is exempt —
   derived via `lessons[lessons.length - 1]?.id` inside the lint
   (`moduleBarGuards.ts:625`, re-confirmed this round, not a hardcoded
   lesson number). Do not lean on this exemption outside L10.
7. **Cross-module RECALL LAW** (`es-course-integrity.test.ts`) — any
   step with `cue: "recall"` and a `targetPhrase` must have that exact
   phrase voiced verbatim in an EARLIER module. A sentence pairing m34's
   places with «está cerca» for the first time is fresh content, not a
   recall, however familiar its individual pieces are.
8. **`esSimNpcProvenance.test.ts` — ZERO legacy allowance for m35.**
   `KNOWN_LEGACY` tail confirmed still `m28` (direct read, no m29+
   entries) — m29 through this module get no reaction-word leniency.
   Every NPC line's words must resolve to: this module's own 3 atoms,
   any PRIOR atom, a taught verb conjugation, `ES_FUNCTION_WORDS`, or
   `ES_PROPER_NAMES`.
9. **`ES_PROPER_NAMES`** (`moduleBarGuards.ts:90-93`): ana, diego,
   carlos, maría/maria, sofía/sofia, luis, elena, pedro, juan, rosa,
   miguel, carmen, lupita, jorge, marta — plus learner persona Sam.
   Recently-used cast (grep against m28-m34's own `speaker:` fields): Ana
   (m30), Diego (m28), Sofía (m28), Carmen (m31), Luis (m31) — Carlos
   remains allowed and STILL unused through m34; free to use for this
   module's own directions-asking dialogue_sim.
10. **`es-quality.test.ts`** — separate `dialogue_sim` reply-word
    provenance gate from #8 above (NPC lines vs. Sam's own reply lines
    are checked by different gates). Also owns
    `ES_M{N}_CHECKPOINT_INDEX` — add `ES_M35_CHECKPOINT_INDEX` pointing
    at the L8 checkpoint lesson.
11. **`assemble-mod.sh` is zsh-only** (uses `${(on)FILES}` glob syntax).
    Run it with `zsh assemble-mod.sh`, not `bash`/`sh`.
12. **Zero emoji to vendor this module** — `cerca`, `lejos`, `lado` are
    all non-imageable per the step-kinds section above; none carry an
    `emoji:` field, matching m28/m31/m33's own non-imageable grammar
    atoms. Re-verify at ship time regardless (a concurrent lane could in
    principle touch `src/pub/noto-emoji/svg/`).
13. **`moduleBarGuards.ts` is not directly runnable via vitest** — it has
    no top-level `describe`/`it`, only an exported
    `registerEsModuleBarGuards()` function called from each `mN.test.ts`.
    Run guards via `npx vitest run src/features/languages/es/curriculum/
    m35.test.ts`, never by pointing vitest at `moduleBarGuards.ts`
    itself (resolved definitively across m33/m34's own briefs; not
    UNVERIFIED this round).
14. **`register-mod.py`'s true signature, re-verified this round by
    direct read (unchanged since m33's own correction of m32's brief):**
    7 positional args — `<prev> <new> "<title>" "<eyebrow>" "<summary>"
    "<accent-from>" "<accent-to>"`. **Note the script's own top-of-file
    comment says "Registers ES m<new> at the 6 code points after
    m<prev>" — that comment is WRONG (stale), trust the code, not the
    comment: the script body does 11 edits across 5 files** (`curriculum/
    index.ts` ×3, `grammarHelpers.ts` ×1, `courseAtoms.ts` ×3,
    `curriculum/es-quality.test.ts` ×2, `placementBank.ts` ×2), matching
    m34's own landed registration exactly. Confirmed by direct read of
    `docs/es-ir-sources/register-mod.py` for this brief — not inherited
    from a prior brief's claim.
15. **`check-frag.sh`'s current stub-module choice is `m15`** (resolved
    this round — read the script directly: `open(f"{S}/{M}-header.yaml")`
    and the isolation block are sandwiched from
    `src/features/languages/es/curriculum/ir/m15.ir.yaml`'s own L1/L10
    blocks). This resolves the UNVERIFIED item m34's own brief left open
    (#3 in its own list).

## SIM NPC lines — safe word list for m35

Safe: this module's own 3 atoms (`cerca`, `lejos`, `lado`), `hay` (m3),
`está`/`estamos`/`están`/`dónde`/`allí` (m4/m18), `aquí` (m3),
`voy`/`vas`/`a`/`al`/`adónde` (m9), `necesito`/`necesitas`/`necesita`
(m16), `ir` (m28), `tengo`/`tienes`/`tiene` + `que` (m33), m34's five
places (`banco`, `farmacia`, `hospital`, `correo`, `supermercado`), any
`ES_FUNCTION_WORDS` member (including `para`/`por`/`con`/`de`/`del`/`al`
— free for scope purposes, see hard rule #3 on why this does not license
crediting them), any `ES_PROPER_NAMES` member. Unsafe/confirmed-
unregistered: `estoy`, `estás`, `tomar`, `ponerse`, `llevar`, and
anything else not on the above list or in a PRIOR module — re-grep
`/tmp/es_prior_surfaces.txt` before using any word not explicitly listed
here.

## Usage-note budget

Per CLAUDE.md's "explanations budget ~3 short lines" — each new atom's
`infoStep`/usage note stays ≤3 short lines. Candidates: (1) L1's `cerca`
debut — echo m4's own "«está» says exactly where it is" framing, now
paying it off with real content: "you already know «está» says WHERE —
today it says HOW CLOSE." (2) L2's `lejos` needs no separate framing
beyond "the opposite of «cerca»" — a mechanical antonym pairing. (3)
L4's `lado` — one line on «al lado de[l]» being built from pieces the
learner already has (`al`/`del` are free, `lado` is the only new piece).
(4) L9's dedicated three-way contrast (see lesson plan) may warrant one
line naming all three verbs side by side (hay/está/es — exists/where/
named), a direct callback to m4's own framing, not a new explanation.

## 10-lesson plan

| Lesson | Content |
|---|---|
| L1 | Debut `cerca`; riding m4's `está` (zero new morphology) against m34's `banco`/`farmacia`. Head off the motion-vs-location foil (`voy al banco` ≠ `el banco está cerca`) from the first lesson. |
| L2 | Debut `lejos`; direct antonym drill against `cerca`, recombine with `hospital`/`correo`/`supermercado`. |
| L3 | Recombine `cerca`/`lejos` with `hay` (m3) — "¿hay una farmacia cerca?" — reviving the m4 existence-vs-location contrast. |
| L4 | Debut `lado`; "el banco está al lado de la farmacia" / "al lado del correo" — gender-article discrimination (`de la`/`del`) across all 5 m34 places. |
| L5 | Mixed recombination: all 5 places × cerca/lejos/al lado de, discrimination-heavy. |
| L6 | Motion vs. location vs. existence three-way discrimination: `voy a` (m9) / `está` (m4) / `hay` (m3), mixed, no new atoms; the module's central foil gets its own dedicated beat here. |
| L7 | Dialogue_sim: asking for directions ("¿dónde está el correo?" / "está cerca, al lado del supermercado"), using `dónde` (m4); NPC-line provenance per hard rule #8. Carlos debuts as NPC (unused cast, see hard rule #9). |
| L8 | **Checkpoint** — cumulative mixed review, all 3 new atoms + PRIOR m3/m4/m9/m16/m28/m33/m34 frames. |
| L9 | **Dedicated three-way contrast** — `hay` (exists) / `está` (where) / `es` (named/described, m2/m18), same subject noun across all three, minimal-pair sentences — the direct payoff of m4's own "three jobs, three words" framing. |
| L10 | Mastery — cumulative recombination: m34 places + m33 `tengo que` + m28 `ir` + m31 `duele`/`duelen` pain-to-pharmacy chain ("me duele la mano, pero el hospital está lejos — voy a la farmacia, está cerca"), dialogue_sim, full-sentence MCQ exemption lesson. |

## What to report back

1. Files written (this brief + header).
2. Theme chosen + one-line why (location description via already-fully-
   taught `está`; highest recombination value of eight candidates
   weighed, nine prior-module hooks, unique live tie back to m4 itself).
3. Atom count + genders (3 atoms: cerca adv., lejos adv., lado m).
4. Emoji vendoring status (zero needed — all three atoms non-imageable,
   matching m28/m31/m33's own grammar-atom convention).
5. Rejected alternatives (poder+inf, querer+inf, demonstratives —
   disqualified, already fully taught; hay+place — reused as
   recombination, not this module's own new idea; para+inf purpose,
   ponerse/llevar, imperative tú — real future content, explicitly set
   aside with reasons) with one-line reasons each.
6. Any UNVERIFIED claims remaining (see below).

## Exact pipeline commands

```
cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1
export LINGO_ROOT=$PWD

# 1. Author lesson fragments m35-L1.yaml .. m35-L10.yaml and
#    m35-placement.yaml in docs/es-ir-sources/, following m35-header.yaml's
#    newAtoms: block and this brief's lesson plan.

# 2. (Optional, recommended) sanity-check a fragment in isolation before
#    assembling the full module — stubs from m15 (confirmed this round,
#    resolves m34-brief's own UNVERIFIED #3):
zsh docs/es-ir-sources/check-frag.sh m35 <tag 1-9> docs/es-ir-sources/m35-L1.yaml
#    (needs m35-placement.yaml on disk first, per step 1)

# 3. Assemble the full module (MUST be zsh, not bash/sh):
zsh docs/es-ir-sources/assemble-mod.sh m35
#    writes src/features/languages/es/curriculum/ir/m35.ir.yaml

# 4. Compile IR → TS (module-name argument, NOT a file path):
node scripts/compile-ir-es.mjs m35
#    writes src/features/languages/es/curriculum/m35.ts

# 5. Register the module (7 positional args — prev, new, title, eyebrow,
#    summary, colorFrom, colorTo — re-verified against register-mod.py's
#    actual source this round, not inherited from a prior brief's claim;
#    ignore the script's own stale top-of-file comment claiming "6 code
#    points" — it is 11 edits across 5 files):
python3 docs/es-ir-sources/register-mod.py m34 m35 \
  "El banco está cerca" \
  "Module 35 · Where things are" \
  "Two new adverbs and one new noun — cerca, lejos, lado — turn m4's already-fully-taught «está» into real errands Spanish, recombined against «hay» (m3), «voy a»/«necesito ir a»/«tengo que ir a» (m9+m16+m28+m33), and m34's five places." \
  "#0e7490" "#164e63"
#    Touches 5 files / 11 edit points:
#      curriculum/index.ts       — 3 edits (card block, import, lesson-map)
#      grammarHelpers.ts         — 1 edit (ES_MODULE_ORDER)
#      courseAtoms.ts            — 3 edits (import, EsAtomSource union, spread)
#      curriculum/es-quality.test.ts — 2 edits (incl. ES_M35_CHECKPOINT_INDEX)
#      placementBank.ts          — 2 edits
#    Verify all 11 edits landed correctly before moving on — read each
#    touched file's diff, don't assume the script's string-match/replace
#    succeeded silently. Verify the exact eyebrow/summary strings landed
#    with their accented characters and guillemets intact.

# 6. Regenerate the review pool (m34's own rows were confirmed present
#    this round — do NOT skip this step for m35):
node scripts/gen-es-review-pool.mjs
#    Confirm it appended rows for cerca/lejos/lado by grepping
#    esReviewPool.ts afterward — expect the same {surface, gloss, kind,
#    fromModule, partOfSpeech} shape as m34's own rows.

# 7. Hand-write curriculum/m35.test.ts, calling registerEsModuleBarGuards()
#    (see m34.test.ts for the exact template, including its own
#    "BRIEF CORRECTION" comment convention for documenting any drift
#    found during drafting) plus bespoke pins for: the motion-vs-location
#    foil check, the «al lado de[l]» bigram-credit trap (grep the
#    assembled IR for any "al lado de" string inside an atoms: array —
#    fail if found), and a dialogue_sim NPC-provenance check.

# 8. Run the guard suite (moduleBarGuards.ts is NOT directly runnable —
#    always go through the mN.test.ts file):
npx vitest run src/features/languages/es/curriculum/m35.test.ts

# 9. Run the broader ES gate suites:
npx vitest run src/features/languages/es/curriculum/irAtomResolution.test.ts
npx vitest run src/features/languages/es/curriculum/es-course-integrity.test.ts
npx vitest run src/features/languages/es/curriculum/esSimNpcProvenance.test.ts
npx vitest run src/features/languages/es/curriculum/es-quality.test.ts

# 10. Audio (once content is gate-clean):
#     follow docs/es-ir-sources/tts-chain.sh per m33/m34 precedent —
#     confirm exact invocation from that script's own header before running.

# 11. Full ES suite pass, confirm count matches expectation before
#     reporting back (m34 landed with ES suite green — m35 will add to
#     that; re-read the actual count at ship time, don't quote a stale
#     one from this brief).
npx vitest run src/features/languages/es
```

## Vocab card art

**Zero vendoring required.** All three of this module's atoms are
non-imageable per §13.1's rubric (2 invariant adverbs with no honest
single-referent image; 1 noun, `lado`, whose image would be ambiguous
rather than disambiguating — "a photo of a side" reads as arbitrary).
None carry an `emoji:` field, matching m28's `va`, m31's
`duele`/`duelen`, and m33's `tengo que`. No `src/pub/noto-emoji/svg/`
work applies. Re-verify at ship time regardless (a concurrent lane
could in principle touch that directory — confirmed already active this
round, three new SVGs from an unrelated JA/KO lane sitting untracked in
`git status`, not this module's concern).

## Decisions inferred (recorded, never parked)

- **Theme:** location description — `está` (fully PRIOR since m4/m18) +
  three new atoms (`cerca`, `lejos`, `lado`) — chosen over poder+inf,
  querer+inf, and demonstratives (all DISQUALIFIED, already fully
  taught), hay+place (reused as recombination, not a standalone new
  idea), para+inf purpose and ponerse/llevar (real future content, set
  aside on scope grounds), and imperative tú (no learner-need
  justification) on recombination-value grounds — nine prior-module
  hooks, more than any candidate considered and more than the previous
  record (m34-header's own four-hook claim for its own module).
- **Atom count:** 3 (at the task's own ≤3 ceiling, not silently
  undershot). A tighter 2-atom module (`cerca`/`lejos` only, mirroring
  m31's own thin 2-atom shape) was considered and rejected in favor of
  adding `lado` — the "near/far/beside" trio serves the practical
  direction-giving use case (the actual project goal: survival Spanish
  for errands) more completely than an antonym pair alone, and costs
  nothing in verb morphology either way.
- **No idiom-phrase atom for «al lado de».** Registered the plain noun
  `lado` instead and built the phrase compositionally from already-free
  `al`/`del` — the meaning is transparent from the parts (unlike m7's
  «tengo hambre» or m33's «tengo que», where it is not), matching the
  compositional judgment call m34-header already made for its own five
  plain nouns.
- **`estoy`/`estás` deliberately NOT filled this module.** Every
  sentence is a 3rd-person claim about a place; the yo/tú paradigm gap
  is real but belongs to a different, future self-location module. Not
  an oversight — recorded explicitly so a drafting agent doesn't reach
  for it out of habit.
- **Title:** "El banco está cerca" — a full Spanish sentence in the
  established house style (m30-m34's own titles), using the module's
  simplest new atom (`cerca`) paired with the freshest possible subject
  (m34's `banco`, the module immediately before this one).
- **Accent:** `#0e7490` → `#164e63` (deep cartographer teal-navy),
  verified against all 34 existing `accent:` pairs for zero collision on
  either hex value, chosen to read as "a map at dusk" without forcing a
  single-place metaphor, and deliberately deeper/darker than the
  course's existing sky/cyan/teal cluster rather than a near-miss of it.
- **Cast:** Carlos debuts as this module's L7 dialogue_sim NPC — in the
  allowed set (`ES_PROPER_NAMES`) since the course began but grep-
  confirmed unused through m34; a deliberate fresh face, not an
  oversight.
- **Correction to the dispatching task's own framing:** neither
  `es-m34-brief.md` nor `m34-header.yaml` contains the literal string
  "para" or "cerca"/"lejos" as a deferred item anywhere — checked by
  direct grep of both files, zero hits for either term outside unrelated
  contexts (e.g. "paradigm," "comprarla"). The underlying fact the task's
  framing was reaching for does hold, independently re-derived in this
  brief from fresh grep evidence (see header's REJECTED «para» section)
  — recorded here so the correction itself isn't lost, matching the
  pattern m34's own brief used to correct m32's wrong claims about
  `mis`/`amigos`/Carlos.

## Claims marked UNVERIFIED

1. **Eyebrow/summary exact string + escaping for `register-mod.py`'s
   argv** — this brief proposes specific strings (see pipeline commands
   above) but did not test them against a live run of the script;
   confirm the exact strings landed correctly in `curriculum/index.ts`
   after running step 5, including the accented character in `está` and
   the guillemets, not just trust the script's own printed confirmation.
2. **Whether a bespoke `ILLEGAL_PRESENT_FORMS`-style scan is needed for
   this module.** Current assessment: NO — this module introduces zero
   new verb conjugations (its one verb, `estar`, contributes only
   already-registered forms `está`/`estamos`/`están`), so there is no
   new conjugation surface for such a scan to guard. Flagged UNVERIFIED
   rather than certain because the standard scan's exact scope/config
   was not re-read line-by-line against this specific module's own
   content — confirm against the scan's own source before assuming no
   bespoke extension is needed, matching the caution every prior
   module's brief has carried on this exact point.
3. **Whether `lado`'s single, transparent meaning ("side") risks reading
   as ambiguous in an `infoStep` without a supporting example sentence
   immediately alongside it** — reasoned as fine (the L4 debut pairs it
   directly with "al lado de la farmacia" per the lesson plan) but not
   independently tested against a learner's actual first read; a
   drafting agent should keep the L4 usage note and its first example
   sentence in the same visual unit, not separated across steps.
4. **Whether `tts-chain.sh`'s exact invocation has drifted since m33/m34
   last ran it** — not re-read line-by-line for this brief (out of
   scope for a research-only, no-pipeline-execution brief); confirm its
   current header before running step 10.
