# ES m36 dispatch brief — transportation (lexicon break)

**Status (2026-09-10):** m35 ("El banco está cerca," «está» + cerca/lejos/al
lado de) is ALREADY FULLY LANDED — confirmed via `git log --oneline` showing
`fe3d1481` "es: m35 «¿Dónde está el banco?» — está + cerca/lejos/al lado de,
10 lessons, 3 atoms, 115 clips" (the commit subject's parenthetical title
differs cosmetically from the module's own landed `title:` field, "El banco
está cerca" — confirmed by direct read of `curriculum/index.ts:280` and
`curriculum/m35.ts:3`; not a discrepancy that matters, noted only so a
future brief doesn't quote the wrong one) followed by `37aeb6da` "ledger: ES
m35 landed" and `fa670ac8` "ledger: 4 lanes dispatched after JA m45 / ES
m35" (current tip at time of writing). `ES_MODULE_ORDER` in
`grammarHelpers.ts` ends `..., "m34", "m35"`; `courseAtoms.ts` imports
`ES_M35_ATOMS` and spreads it; `curriculum/es-quality.test.ts` imports and
maps `ES_M35_CHECKPOINT_INDEX` (confirmed = 8, `curriculum/m35.ts:1657`);
`placementBank.ts` imports/arrays `ES_M35_PLACEMENT`; `esReviewPool.ts`
carries all 3 of m35's own rows (`cerca`/`lejos`/`lado`, confirmed by direct
grep — the review-pool regen step was NOT skipped this round). All
registration points confirmed by hand, not trusted from the commit message.
No `m36-*` file exists anywhere in `docs/es-ir-sources/` yet — this brief
and `m36-header.yaml` are the only m36 artifacts.

[[concurrent-sessions-same-repo]] applies: `git status` at time of writing
shows unstaged edits to `scripts/i18n/mt-translate-catalog.mjs`, plus
untracked `src/features/languages/fr/curriculum/m25.test.ts` and two JA
i18n content files (`src/shared/i18n/content/ja/m16.en.json`,
`m16.ko.json`) — all from a concurrent FR/JA lane, none touching ES paths,
not this lane's concern. Per the dispatching task's own instruction, a
reviewer may be editing m35's own fragment files (`docs/es-ir-sources/
m35-L*.yaml`) concurrently — **read only, never modify** (this brief did
not touch them). This brief itself only reads and writes the two files it
was asked to produce; it does not stage, run pipeline scripts beyond
research greps, or commit anything.

## Files — read in this order

1. **This file.**
2. **`m36-header.yaml`** (same directory) — READ THIS FIRST once you start
   drafting. It carries the full WHY/REJECTED/SCOPE reasoning as inline
   YAML comments, denser than this brief. In particular: the **transport
   reversal section** (why this course explicitly rejected transport for
   m34 and why that reasoning no longer holds for m36 — read this before
   assuming transport is an obviously-safe pick, since a prior header
   already said no once), the **«a» vs «en» discrimination** section (the
   central transfer error), the **scope note on why `tomar` is deliberately
   NOT this module's job**, and the **`atoms:` credit trap** section (this
   module's own version of the "X que"/"al lado de" bigram failure class,
   now shaped "voy en X").
3. `docs/es-ir-sources/es-m35-brief.md` + `m35-header.yaml` — immediately-
   PRIOR module; the grammar beat this break follows. Read for the exact
   shape of «está»/«cerca»/«lejos»/«al lado de» this module recombines
   against, and for the "agreement is not a new atom" plural-fold discipline
   this brief also carries forward.
4. `docs/es-ir-sources/es-m34-brief.md` + `m34-header.yaml` — the closest
   STRUCTURAL precedent (both are lexicon-break modules with image-MCQ-as-
   introduction for every new noun, no new grammar) — **and the module
   whose own REJECTED ALTERNATIVE 2 rejected transport the first time.**
   Read that section specifically before drafting; this brief's own
   REJECTED/WHY sections in `m36-header.yaml` explain exactly what changed
   between then and now.
5. `docs/es-ir-sources/authoring-rules.md` — dialogue_sim NPC-line
   provenance rule; "agreement is not a new atom" (scope-check only, load-
   bearing again this round for `estación`'s «ón»-branch plural).
6. `docs/lesson-authoring-guide.md` §13.1-13.3 — card-type rubric (13.1);
   image-MCQ-as-introduction (13.2, THE pattern this module uses for all
   five nouns, exactly the m32/m34 pattern); just-in-time grammar teach
   (13.3 — not strictly needed, since there is no new grammar, but the
   «en»-as-mode-marker sentence shape still deserves one contextual
   `infoStep` per the usage-note budget below, the same "new sentence
   SHAPE, not new grammar" treatment m34 gave its own `necesito ir a`
   recombination).
7. `docs/pedagogy-principles-2026-07-05.md`,
   `docs/course-design-learnings-2026-08-21.md` — background doctrine
   (JA-authored but the "how" generalizes: deduction-first, just-in-time
   grammar, module shape derived from the module not assumed by gates).
8. `CLAUDE.md` — "What we're building" (top) and "The lenses we teach
   from" (~line 131-160): deduction-first, no hollow cards, interleave-
   don't-block-teach, explanations budget ~3 short lines.
9. Shipped fragments/compiled files actually read for this brief:
   `curriculum/m3.ts` (line 34 — «en»'s own debut as a registered particle
   atom, not merely a function word), `curriculum/m4.ts` (lines 1-60 —
   «está»'s own debut, `dónde`/`aquí`/`allí` context), `curriculum/m9.ts`
   (full atom list — the places-in-town PRIOR set, `voy`/`vas`/`a`/`al`/
   `adónde`, title "Vamos"), `curriculum/m16.ts` (line 31 + the «necesito el
   regalo» build step — the bare-object frame `taxi` reuses), `curriculum/
   m34.ts` (first ~40 lines plus the 5-noun atom block — the PRIOR errands
   lexicon this module cross-recombines via «al lado de»), `curriculum/
   m35.ts` (full atom list plus first ~60 lines — «cerca»/«lejos»/«lado»'s
   own debut, the exact sentence shapes this module's own L9 recombines
   against), `esSimNpcProvenance.test.ts` (`KNOWN_LEGACY` tail, confirmed
   still `m28`), `src/features/languages/es/__tests__/moduleBarGuards.ts`
   (`ES_FUNCTION_WORDS`, `ES_PROPER_NAMES`, `esRegularPlurals`, `esTokens`,
   full function bodies, not paraphrased from a prior brief), every
   `speaker:` field across `curriculum/m1.ts`-`m35.ts` (cast-freshness
   check for this module's own dialogue_sim NPC).

## The decision this module resolves

Course rhythm since the last grammar beat: m32 clothing round 2 (break) →
m33 «tengo que + inf» (grammar) → m34 errands lexicon (break) → m35 «está»
+ cerca/lejos/al lado de (grammar). The break due after m35 is on schedule.
m36 is that break: **zero new grammar, exactly FIVE new imageable nouns,
taught by image-MCQ intro (§13.2) and recombined against every frame
m28-m35 already registered — INCLUDING m35 itself, one module old.**

Five candidate domains named by the dispatching task were weighed against
the actual atom registry (not assumed from the task's own framing) —
town/places round 2, transport, house/rooms, kitchen/food round 2, family
round 2. Full reasoning, grep evidence, and rejection rationale for all
five is in `m36-header.yaml`'s WHY/REJECTED sections. Short version:
**town/places round 2 is not a fresh domain in the aggregate**
(`escuela`/`parque`/`restaurante`/`tienda` all PRIOR since m9/m18) — only
`estación` from that list is virgin, folded into the winning domain below
rather than launched on its own. **House/rooms, kitchen/food round 2, and
family round 2 all have genuine 4+-atom virgin subsets** (this round's own
grep floor is more generous than either candidate this course has weighed
before) but each reaches at most three, four, or one prior-module hook
respectively — see header for the count.

**Transportation won** — `estación` (station), `tren` (train), `metro`
(metro/subway), `taxi` (taxi), `bicicleta` (bicycle) — on:

- **A genuine reversal of a decision this course already made once, with
  a stated reason that stopped applying.** `m34-header.yaml`'s own
  REJECTED ALTERNATIVE 2 explicitly rejected transport for m34: no
  `tomar` (a second new verb, competing with "zero new grammar"), and
  without it "voy en tren" read as thinner sentence variety than
  m34's own `voy al banco`. Both objections dissolve now: `en` (m3) is
  ALREADY a registered atom (not a placeholder), so "voy en tren" needs
  no new verb at all — and m35 (one module old at m34's time of writing,
  didn't exist) gave `está`+`cerca`/`lejos`/`al lado de` real content for
  the first time since m4, and a station is exactly the kind of place-noun
  that construction wants. Transport didn't get more attractive by
  chance; m35 built the hook.
- **Highest recombination value of any of the five candidates weighed —
  EIGHT prior modules, matching m35-header's own count for the previous
  record.** `voy`/`vas`/`a`/`al` (m9), `en` (m3, its own registered
  particle atom), `está`/`dónde`/`aquí`/`allí` (m4), `necesito` (m16),
  `ir` bare infinitive (m28), `tengo que` (m33), m34's five places
  (cross-recombination target via «al lado de»), and m35's own
  `cerca`/`lejos`/`lado` (the freshest content this course has). No other
  candidate reaches more than four, and none reaches m35 itself as
  directly — see header for the side-by-side count against each
  alternative.
- **A live hook into m35, unique to this candidate among the five
  weighed.** `estación` is the first noun since m35 shipped to receive the
  full "«está» says WHERE" treatment on genuinely new ground — "la
  estación está cerca," "el metro está al lado del banco" (cross-
  recombining m34's own places too).

## PRIOR vocabulary — re-runnable greps

```
export LINGO_ROOT=$PWD  # from the worktree root
grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..35}.ts | sort -u > /tmp/es_prior_surfaces.txt
grep -iE '^(estación|tren|metro|taxi|bicicleta)$' /tmp/es_prior_surfaces.txt
# → zero hits, confirms all five new atoms are virgin
grep -iE '^(autobús|carro|en|voy|vas|a|al|necesito|tengo|que|ir|está|estamos|están|hay|cerca|lejos|lado)$' /tmp/es_prior_surfaces.txt
# → all present, confirms every reused frame's true status
grep -iw '"tomar"' /tmp/es_prior_surfaces.txt
# → zero hits, confirms the tomar gap this module deliberately does not fill
```

**Fully PRIOR and this module's own reused verbs/particles, zero gap:**
`voy`/`vas`/`a`/`al`/`adónde` (m9, "Vamos"), `en` (m3, registered particle
atom — NOT just a scope-check function word), `está`/`dónde`/`aquí`/`allí`
(m4), `necesito`/`necesitas`/`necesita` (m16), `ir` bare infinitive (m28),
`tengo`/`tienes`/`tiene` + `que` (m33), `cerca`/`lejos`/`lado` (m35, ONE
module old).

**Fully PRIOR and this module's own richest cross-recombination lexicon**
(m34, the five errands places): `banco` m 🏦, `farmacia` f 💊, `hospital` m
🏥, `correo` m 📮, `supermercado` m 🏬.

**Other PRIOR words checked and confirmed already spent** (so NOT this
module's own new idea, even though they're transport-adjacent): `autobús`
(m9, bus, 🚌), `carro` (m6, car, 🚗).

**Confirmed NOT PRIOR (verified zero grep hits, do not assume
otherwise):** `estación`, `tren`, `metro`, `taxi`, `bicicleta` (this
module's own five atoms), `tomar` (the deliberately-unfilled verb gap),
`avión`, `barco`, `aeropuerto` (further transport vocabulary, real future
content, not this module's job), `escuela`/`parque`/`restaurante`/`tienda`
(PRIOR since m9/m18, confirmed here specifically so a drafting agent
doesn't assume they're this module's to claim), `cocina`/`baño`/`casa`/
`cuarto` (PRIOR, the house/rooms candidate's own already-spent core),
`carne`/`leche`/`pan`/`pollo`/`queso` (PRIOR, the food candidate's own
already-spent core), `hermano`/`hermana`/`padre`/`madre`/`abuelo`/`abuela`
(PRIOR, the family candidate's own already-spent core).

## What this module does NOT teach

- **No `tomar`.** Every transport sentence uses `voy`/`vas` + `en` (mode)
  or `voy a`/`al` (destination), never a "take the train" construction.
  Real future content for a different (verb-conjugation) module — see
  header's dedicated scope note. Do not let a drafting agent reach for
  `tomar` out of habit in a dialogue_sim NPC line or build-tile bank.
- **No new article-free-vs-articled rule taught as its own grammar point.**
  «voy en tren» (unmarked mode, no article) vs «voy en el tren» (marked,
  specific — grammatical but NOT this module's job to contrast) — this
  module teaches only the unmarked generic form; do not introduce the
  marked form as a discrimination target, it would be a second new idea.
- **No `avión`/`barco`/`aeropuerto`** (plane, boat, airport) — real, clean,
  virgin transport vocabulary, deliberately left for a future "travel"
  module once `tomar`/`volar`-family verbs exist to do more with them; this
  module's own five nouns are the "everyday getting-around-town" subset,
  not the "travel abroad" subset.
- **No new conjugation of `estar`, `ir`, `necesitar`, `tener`, `hay`, `ser`**
  beyond what m2/m3/m4/m9/m16/m18/m28/m33/m35 already registered.
- **No idiom-phrase atom.** Unlike m35's own «al lado de» decision (a
  compositional call, not a new atom), this module doesn't even reach that
  question — «voy en tren»/«voy a la estación» are built entirely from
  already-free/already-registered pieces plus this module's own five plain
  nouns; there is no candidate multi-word phrase to weigh.

## Step kinds

All five nouns: **image-MCQ-as-introduction** (§13.2) for their debut step,
exactly the m32/m34 pattern (`vocabMcq()` from `grammarHelpers.ts`,
signature `vocabMcq(idPrefix, target: {surface, meaningEn, emoji?},
distractorPool: {surface, emoji?}[], ...)`). No new grammar step is needed
anywhere in this module — the «en»-as-mode-marker sentence shape is new
CONTENT, not new grammar (the atom `en` is fully PRIOR since m3), so it
gets a short contextual `infoStep` immediately before its first `build`/
`cloze` sentence (guide §13.3's just-in-time cadence applied to a sentence
SHAPE rather than a new atom — the same treatment m34 gave its own
`necesito ir a` recombination), not a full debut treatment. `dialogue_sim`
carries the L7 recombination lesson (asking how to get somewhere) and the
L10 mastery lesson; `sentenceMcq`/`textMcq` distractor pools must include
the «a» vs «en» foil (see header) as the central discrimination — built as
a full-phrase choice, never a `particle_cloze` isolating the bare «a»
token (per `esTokens()`'s length-1 drop, hard rule #5 below) — and never
offered as a correct answer in the wrong shape.

## Hard rules the gates enforce (carried forward + this module's own new one)

1. **`atoms:` credit — this module's own version of the bigram trap, read
   before drafting a single step.** `irAtomResolution.test.ts` is
   zero-tolerance exact-surface. A sentence "voy en tren a la estación"
   credits `atoms: ["voy", "en", "tren", "estación"]` (plus whatever else
   the sentence's own words resolve to — check m9's own convention for
   whether bare `a` is separately credited before assuming) — **never**
   `atoms: ["voy en tren"]` or `atoms: ["en tren"]`; those strings are not
   registered surfaces (this module registers no phrase atom) and the
   credit would silently vanish, the exact "X que"/"al lado de" failure
   class m33/m34/m35 already flagged, now recurring as "voy en X."
2. **"Agreement is not a new atom"** (`authoring-rules.md`) — all five
   nouns are regular, plural fold traced directly against
   `esRegularPlurals()` (`__tests__/moduleBarGuards.ts:168-175`, function
   body re-read this round, not inherited from a prior brief's claim):
   `tren` consonant-final (neither `z` nor `ón`) → `+es` → `trenes`
   (same branch as m34's own `hospital`→`hospitales`); `metro`/`taxi`/
   `bicicleta` vowel-final → `+s` → `metros`/`taxis`/`bicicletas`;
   `estación` → the dedicated `/ón$/` branch → `estaciones`. Scope-check
   only, per the same rule every prior module has carried — never applies
   to `atoms:` credit (rule 1 above).
3. **`ES_FUNCTION_WORDS` already contains `en`** (`__tests__/
   moduleBarGuards.ts:72-88`, current text confirmed by direct read this
   round, including a same-day `tus` addition unrelated to this module —
   noted for the record, not this module's own change) — a SCOPE-CHECK
   allowlist, separate from and simultaneous with `en`'s status as a
   REGISTERED ATOM since m3 (`kind: "particle"`, `curriculum/m3.ts:34`).
   Both are true at once, exactly the dual status m35-header already
   documented for `está`. Do not confuse "legal in an NPC line for scope
   purposes" with "creditable via `atoms:`" — `en` happens to be both,
   this module's own five nouns are creditable only because they're
   directly registered here.
4. **Build tiles are billed exposure** ([[es-which-slots-are-billed]]) —
   `esSurfaces()` bills cloze options and build tiles, not MCQ distractors.
   Any PRIOR surface placed as a build-tile distractor (e.g. `banco` reused
   for the L9 cross-recombination) must itself be a legally registered
   surface at that point in the course — trivially true here since m34/m35
   are both fully PRIOR.
5. **`esTokens()` drops length-1 tokens** (`__tests__/moduleBarGuards.ts:
   63-65`) — so the bare single-letter «a» can never be a `particle_cloze`
   option. This module's own central discrimination («a» vs «en») is at
   direct risk of this trap since it's the exact foil being taught — build
   it as a `sentenceMcq`/`textMcq`/`build` choosing between full phrases,
   never as a cloze isolating the bare «a» token.
6. **Full-sentence MCQ ban** (invariant 28, `lintFullSentenceMcqs` in
   `__tests__/moduleBarGuards.ts`) — correct MCQ answers ≤3 tokens. The
   FINAL lesson (mastery, L10) is exempt — derived via
   `lessons[lessons.length - 1]?.id` inside the lint (confirmed again this
   round, not a hardcoded lesson number). Do not lean on this exemption
   outside L10.
7. **Cross-module RECALL LAW** (`es-course-integrity.test.ts`) — any step
   with `cue: "recall"` and a `targetPhrase` must have that exact phrase
   voiced verbatim in an EARLIER module. A sentence pairing this module's
   nouns with m35's «está cerca» for the first time is fresh content, not
   a recall, however familiar its individual pieces are.
8. **`esSimNpcProvenance.test.ts` — ZERO legacy allowance for m36.**
   `KNOWN_LEGACY` tail confirmed still `m28` (direct read of the full
   object, no m29+ entries through m35) — m29 through this module get no
   reaction-word leniency. Every NPC line's words must resolve to: this
   module's own 5 atoms, any PRIOR atom, a taught verb conjugation,
   `ES_FUNCTION_WORDS`, or `ES_PROPER_NAMES`.
9. **`ES_PROPER_NAMES`** (`__tests__/moduleBarGuards.ts:90-93`): ana,
   diego, carlos, maría/maria, sofía/sofia, luis, elena, pedro, juan, rosa,
   miguel, carmen, lupita, jorge, marta — plus learner persona Sam.
   **Full-course cast check (not just recent modules):** `jorge`, `marta`,
   `lupita` are grep-confirmed used in ZERO `speaker:` fields anywhere in
   m1-m35 (every other allowed name appears at least once in m28-m35
   alone). `Jorge` debuts as this module's own L7 dialogue_sim NPC — a
   stronger freshness claim than m35's own Carlos pick.
10. **`es-quality.test.ts`** — separate `dialogue_sim` reply-word
    provenance gate from #8 above (NPC lines vs. Sam's own reply lines are
    checked by different gates). Also owns `ES_M{N}_CHECKPOINT_INDEX` —
    add `ES_M36_CHECKPOINT_INDEX` pointing at the L8 checkpoint lesson.
11. **`assemble-mod.sh` is zsh-only** (uses `${(on)FILES}` glob syntax).
    Run it with `zsh assemble-mod.sh`, not `bash`/`sh`.
12. **Zero emoji to vendor this module.** All five target SVGs already
    present on disk — see "Vocab card art" below. One near-collision
    checked and cleared: 🚇 appears once already, at `curriculum/m1.ts:314`
    — but as a `dialogue_sim` `scene: { emoji: ... }` decoration ("A
    crowded platform"), NOT a registered `atom({...})` emoji. Confirmed by
    direct read of that line and by a separate grep restricted to
    `atom({...emoji: ...})` occurrences only, which returns zero hits for
    🚉/🚆/🚇/🚕/🚲 across m1-m35. Scene-decoration emoji and atom-registry
    emoji are different fields with different collision rules; do not
    conflate them. Re-verify at ship time regardless (a concurrent lane
    could in principle touch `src/pub/noto-emoji/svg/`).
13. **`moduleBarGuards.ts` is not directly runnable via vitest** — it lives
    at `src/features/languages/es/__tests__/moduleBarGuards.ts` (confirmed
    exact path this round, not assumed), has no top-level `describe`/`it`,
    only an exported `registerEsModuleBarGuards()` function called from
    each `mN.test.ts`. Run guards via `npx vitest run
    src/features/languages/es/curriculum/m36.test.ts`, never by pointing
    vitest at `moduleBarGuards.ts` itself.
14. **`register-mod.py`'s true signature, re-verified this round by direct
    read of the actual script (unchanged since m33's own correction of
    m32's brief):** 7 positional args — `<prev> <new> "<title>" "<eyebrow>"
    "<summary>" "<accent-from>" "<accent-to>"`. The script's own top-of-
    file comment says "Registers ES m<new> at the 6 code points after
    m<prev>" — that comment is WRONG (stale), trust the code: the script
    body does 11 edits across 5 files (`curriculum/index.ts` ×3,
    `grammarHelpers.ts` ×1, `courseAtoms.ts` ×3, `curriculum/
    es-quality.test.ts` ×2, `placementBank.ts` ×2), matching m34/m35's own
    landed registration exactly.
15. **`check-frag.sh`'s current stub-module choice is `m15`** (confirmed
    again this round by direct read: `open(f"{S}/{M}-header.yaml")` and the
    isolation block are sandwiched from `src/features/languages/es/
    curriculum/ir/m15.ir.yaml`'s own L1/L10 blocks) — unchanged since
    m35-brief resolved this.

## SIM NPC lines — safe word list for m36

Safe: this module's own 5 atoms (`estación`, `tren`, `metro`, `taxi`,
`bicicleta`), `voy`/`vas`/`a`/`al`/`adónde` (m9), `en` (m3), `está`/
`estamos`/`están`/`dónde`/`aquí`/`allí` (m4), `necesito`/`necesitas`/
`necesita` (m16), `ir` (m28), `tengo`/`tienes`/`tiene` + `que` (m33),
`cerca`/`lejos`/`lado` (m35), m34's five places (`banco`, `farmacia`,
`hospital`, `correo`, `supermercado`, for the L9 cross-recombination), any
`ES_FUNCTION_WORDS` member, any `ES_PROPER_NAMES` member. Unsafe/confirmed-
unregistered: `tomar`, `avión`, `barco`, `aeropuerto`, and anything else not
on the above list or in a PRIOR module — re-grep `/tmp/es_prior_surfaces.txt`
before using any word not explicitly listed here.

## Usage-note budget

Per CLAUDE.md's "explanations budget ~3 short lines" — each new noun's
`infoStep`/usage note stays ≤3 short lines. (1) L1's `estación` debut ties
directly to m35's own framing: "you already know «está» says WHERE — today
it describes a place you need to find." (2) L2's `tren` debut carries the
module's one real new note: "«en» + a transport word, no «el» — «voy en
tren», not «voy al tren» when you mean the MODE." (3) L3's `metro` needs no
separate framing beyond "same pattern as «tren»." (4) L4's `taxi` contrasts
the bare-object `necesito` frame against the `en`-mode frame just taught —
one line: "a taxi is something you NEED, not just something you ride — «en
taxi» works too, but «necesito un taxi» is the more useful sentence." (5)
L5's `bicicleta` needs no new framing, just the `tengo que` + `en`
combination. (6) L9's dedicated cross-recombination lesson (m34 places +
m35 «está») may warrant one line naming the payoff directly: "now every
place you know has a way to get there, and a way to describe where it is."

## 10-lesson plan

| Lesson | Content |
|---|---|
| L1 | Debut `estación`; recombine with `voy a`/`al` (m9) and «¿dónde está la estación?» (m4/m35). |
| L2 | Debut `tren`; debut the `en`-as-mode-marker sentence shape («voy en tren», no article). |
| L3 | Debut `metro`; direct pairing with `tren` — same `en`-mode shape, discrimination between the two vehicles at "la estación." |
| L4 | Debut `taxi`; recombine with `necesito` (m16) as a bare-object frame — contrast against the `en`-mode shape just taught (L2-L3). |
| L5 | Debut `bicicleta`; recombine with `tengo que` + `ir` (m33+m28) + `en` — the module's own "obligation + mode" combination. |
| L6 | Mixed recombination: all 5 nouns × `voy a`/`en`/`necesito`/`tengo que`, discrimination-heavy. The «a» vs «en» foil gets its own dedicated beat here (built as full-phrase `sentenceMcq`, per hard rule #5 — never a bare-«a» cloze). |
| L7 | Dialogue_sim: asking how to get somewhere ("¿cómo vas al banco?" / "voy en metro, la estación está cerca"); NPC-line provenance per hard rule #8. Jorge debuts as NPC (unused cast, see hard rule #9). |
| L8 | **Checkpoint** — cumulative mixed review, all 5 new atoms + PRIOR m3/m4/m9/m16/m28/m33 frames. |
| L9 | **Dedicated cross-recombination lesson** — m34's five places + m35's `está`/`cerca`/`lejos`/`al lado de` + this module's transport nouns together for the first time: "el banco está al lado de la estación," "voy en tren, la farmacia está cerca del metro." |
| L10 | Mastery — cumulative recombination across all five frames (destination, mode, need, obligation, location), dialogue_sim, full-sentence MCQ exemption lesson. |

## What to report back

1. Files written (this brief + header).
2. Theme chosen + one-line why (transportation via already-fully-taught
   `en`/`voy a`/`está`; reverses m34-header's own explicit rejection of
   this exact domain, now justified by m35's fresh location-description
   content; highest recombination value of five candidates weighed, eight
   prior-module hooks).
3. Atom count + genders (5 atoms: estación f, tren m, metro m, taxi m,
   bicicleta f).
4. Emoji vendoring status (zero needed — list the 5 codepoint filenames and
   confirm all already present; note the cleared 🚇 scene-vs-atom
   near-collision).
5. Rejected alternatives (town/places round 2 — mostly already spent, only
   `estación` virgin, folded in rather than launched alone; house/rooms,
   kitchen/food round 2, family round 2 — all real and virgin but weaker
   recombination, one-line reasons each in the header) with the transport-
   reversal story called out explicitly as the headline finding.
6. Any UNVERIFIED claims remaining (see below).

## Exact pipeline commands

```
cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1
export LINGO_ROOT=$PWD

# 1. Author lesson fragments m36-L1.yaml .. m36-L10.yaml and
#    m36-placement.yaml in docs/es-ir-sources/, following m36-header.yaml's
#    newAtoms: block and this brief's lesson plan.

# 2. (Optional, recommended) sanity-check a fragment in isolation before
#    assembling the full module — stubs from m15 (confirmed this round):
zsh docs/es-ir-sources/check-frag.sh m36 <tag 1-9> docs/es-ir-sources/m36-L1.yaml
#    (needs m36-placement.yaml on disk first, per step 1)

# 3. Assemble the full module (MUST be zsh, not bash/sh):
zsh docs/es-ir-sources/assemble-mod.sh m36
#    writes src/features/languages/es/curriculum/ir/m36.ir.yaml

# 4. Compile IR → TS (module-name argument, NOT a file path):
node scripts/compile-ir-es.mjs m36
#    writes src/features/languages/es/curriculum/m36.ts

# 5. Register the module (7 positional args — prev, new, title, eyebrow,
#    summary, colorFrom, colorTo — re-verified against register-mod.py's
#    actual source this round; ignore the script's own stale top-of-file
#    comment claiming "6 code points" — it is 11 edits across 5 files):
python3 docs/es-ir-sources/register-mod.py m35 m36 \
  "Voy en tren" \
  "Module 36 · Getting around" \
  "Five new words for getting somewhere — la estación, el tren, el metro, el taxi, la bicicleta — recombined against «voy a»/«al» (m9), «en» as the transport-mode marker (m3), «necesito» (m16), «tengo que ir a» (m28+m33), and «está» + «cerca»/«lejos»/«al lado de» (m4+m35) — reversing this course's own earlier verdict that transport wasn't worth teaching without «tomar»." \
  "#475569" "#1e293b"
#    Touches 5 files / 11 edit points:
#      curriculum/index.ts       — 3 edits (card block, import, lesson-map)
#      grammarHelpers.ts         — 1 edit (ES_MODULE_ORDER)
#      courseAtoms.ts            — 3 edits (import, EsAtomSource union, spread)
#      curriculum/es-quality.test.ts — 2 edits (incl. ES_M36_CHECKPOINT_INDEX)
#      placementBank.ts          — 2 edits
#    Verify all 11 edits landed correctly before moving on — read each
#    touched file's diff, don't assume the script's string-match/replace
#    succeeded silently. Verify the exact eyebrow/summary strings landed
#    with their accented characters and guillemets intact.

# 6. Regenerate the review pool (m35's own rows were confirmed present
#    this round — do NOT skip this step for m36):
node scripts/gen-es-review-pool.mjs
#    Confirm it appended rows for estación/tren/metro/taxi/bicicleta by
#    grepping esReviewPool.ts afterward — expect the same {surface, gloss,
#    kind, fromModule, partOfSpeech} shape as m35's own rows.

# 7. Hand-write curriculum/m36.test.ts, calling registerEsModuleBarGuards()
#    (see m35.test.ts for the exact template) plus bespoke pins for: the
#    «a» vs «en» foil check, the «voy en X» bigram-credit trap (grep the
#    assembled IR for any "en tren"/"voy en tren" string inside an atoms:
#    array — fail if found), and a dialogue_sim NPC-provenance check.

# 8. Run the guard suite (moduleBarGuards.ts is NOT directly runnable —
#    always go through the mN.test.ts file):
npx vitest run src/features/languages/es/curriculum/m36.test.ts

# 9. Run the broader ES gate suites:
npx vitest run src/features/languages/es/curriculum/irAtomResolution.test.ts
npx vitest run src/features/languages/es/curriculum/es-course-integrity.test.ts
npx vitest run src/features/languages/es/curriculum/esSimNpcProvenance.test.ts
npx vitest run src/features/languages/es/curriculum/es-quality.test.ts

# 10. Audio (once content is gate-clean):
#     follow docs/es-ir-sources/tts-chain.sh per m34/m35 precedent — confirm
#     exact invocation from that script's own header before running.

# 11. Full ES suite pass, confirm count matches expectation before
#     reporting back (m35 landed with ES suite green — m36 will add to
#     that; re-read the actual count at ship time, don't quote a stale one
#     from this brief).
npx vitest run src/features/languages/es
```

## Vocab card art

**Zero vendoring required.** All five target emoji SVGs already exist on
disk:

```
ls src/pub/noto-emoji/svg/ | grep -iE "^emoji_u(1f689|1f686|1f687|1f695|1f6b2)"
# emoji_u1f689.svg   🚉 estación
# emoji_u1f686.svg   🚆 tren
# emoji_u1f687.svg   🚇 metro
# emoji_u1f695.svg   🚕 taxi
# emoji_u1f6b2.svg   🚲 bicicleta
```

One near-collision checked and cleared: 🚇 (metro) already appears once in
`curriculum/m1.ts:314`, but as a `dialogue_sim` `scene: { emoji: "🚇",
title: "A crowded platform" }` field — a scene decoration, not a registered
vocab atom. A grep restricted to `atom({...emoji: ...})` occurrences only
(not the bare `emoji: "..."` field pattern, which also matches scene
fields) returns zero hits for all five target emoji across m1-m35. Re-
verify both facts at ship time regardless (a concurrent lane could touch
`src/pub/noto-emoji/svg/`, and a concurrent ES lane could in principle add
a new atom before this module lands).

## Decisions inferred (recorded, never parked)

- **Theme:** transportation — `estación`/`tren`/`metro`/`taxi`/`bicicleta`
  — chosen over town/places round 2 (mostly already spent, only `estación`
  virgin), house/rooms, kitchen/food round 2, and family round 2 (all real
  and virgin but reach fewer prior-module hooks — three, four, and one
  respectively, versus transport's eight) on recombination-value grounds.
  **The headline finding: this reverses `m34-header.yaml`'s own explicit
  rejection of the identical domain**, justified by content (`en`'s status
  as a registered atom, m35's fresh `está`+location content) that
  literally did not exist when that earlier rejection was written.
- **Atom count:** 5 (matching m34's own count, at the task's own ≤5
  ceiling, not silently undershot). All five genuinely earn their slot —
  no sixth candidate was found and cut for space; `avión`/`barco`/
  `aeropuerto` were considered and set aside on SCOPE grounds (a different,
  "travel abroad" module), not atom-budget grounds.
- **No `tomar` this module, deliberately.** Every sentence uses `voy`/`vas`
  + `en` (mode) or `voy a`/`al` (destination) — both fully PRIOR, zero new
  verb morphology. `tomar` remains real, well-scoped future content for its
  own module. Not an oversight — recorded so a drafting agent doesn't reach
  for it out of habit.
- **`estación` chosen over folding transport into a "town round 2" module,
  or vice versa.** `estación` is structurally a transport-domain noun (the
  place you go to use a `tren`/`metro`), not a generic town-places noun
  like `escuela`/`parque` — grouping it with `tren`/`metro`/`taxi`/
  `bicicleta` gives it a coherent five-noun set with a real internal
  story (a destination noun plus four modes), rather than being one
  orphaned virgin word bolted onto an otherwise-already-spent "places in
  town" domain.
- **Title:** "Voy en tren" — a full Spanish sentence instantiating the
  module's own central new SENTENCE SHAPE (the `en`-mode marker), echoing
  m9's own bare-motion title style ("Vamos") rather than repeating the
  `necesito X` framing m32/m34 both already used for their own breaks.
- **Accent:** `#475569` → `#1e293b` (steel/rail slate), verified against
  all 35 existing `accent:` pairs for zero collision on either hex value,
  chosen to read as "steel rails at dusk" — distinct from m27's own slate
  gray (`#64748b`→`#334155`, cooler/darker than that pair specifically)
  and from the four most recent modules' own accents.
- **Cast:** Jorge debuts as this module's L7 dialogue_sim NPC — checked
  against the FULL course's `speaker:` fields (m1-m35), not just recent
  modules, confirming zero prior use anywhere (a stronger freshness claim
  than m35's own Carlos pick, which was only unused through m34).
- **L9 cross-recombination lesson placed deliberately after the L8
  checkpoint**, mirroring m34's own L9 pain-frame placement — gives the
  module's single richest recombination (m34 places + m35 location +
  m36 transport, three modules at once) a dedicated non-checkpoint slot.

## Claims marked UNVERIFIED

1. **Eyebrow/summary exact string + escaping for `register-mod.py`'s
   argv** — this brief proposes specific strings (see pipeline commands
   above) but did not test them against a live run of the script; confirm
   the exact strings landed correctly in `curriculum/index.ts` after
   running step 5, including every accented character (`está`, `están`) and
   guillemet, not just trust the script's own printed confirmation.
2. **Whether a bespoke `ILLEGAL_PRESENT_FORMS`-style scan is needed for
   this module.** Current assessment: NO — this module introduces zero new
   verb conjugations (its verbs, `ir`/`estar`/`necesitar`/`tener`,
   contribute only already-registered forms), so there is no new
   conjugation surface for such a scan to guard. Flagged UNVERIFIED rather
   than certain because the standard scan's exact scope/config was not
   re-read line-by-line against this specific module's own content —
   confirm against the scan's own source before assuming no bespoke
   extension is needed, matching the caution every prior module's brief
   has carried on this exact point.
3. **Whether the «a» vs «en» discrimination is teachable at this course's
   A2 level without its own dedicated `infoStep`, or whether it needs one
   beyond the ≤3-line usage note this brief scoped for `tren`'s L2 debut**
   — reasoned as sufficient (the contrast is a preposition swap on an
   already-familiar sentence skeleton, not a new grammatical category) but
   not independently tested against a learner's actual first read; a
   drafting agent should keep L2's usage note and its first example
   sentence in the same visual unit, matching the caution m35-brief's own
   UNVERIFIED #3 carried for `lado`.
4. **Whether `tts-chain.sh`'s exact invocation has drifted since m34/m35
   last ran it** — not re-read line-by-line for this brief (out of scope
   for a research-only, no-pipeline-execution brief); confirm its current
   header before running step 10.
5. **Whether m9's own convention credits bare `a` inside `atoms:` arrays
   alongside `al`, or only `al`'s contracted form** — this brief's own
   pipeline-command example (step 7) flags checking m9's usage before
   assuming; not independently re-verified against m9.ts's own `atoms:`
   arrays line-by-line for this brief, since m36's own destination
   sentences ("voy a la estación," uncontracted, feminine noun) don't
   themselves need the `al` contraction — but a drafting agent building a
   masculine-noun destination sentence in this module (there are none among
   this module's own five nouns, but a cross-recombination sentence with
   m34's `banco`/`correo`/`hospital`/`supermercado` at L9 will need it)
   should confirm the exact credited surface before drafting.
