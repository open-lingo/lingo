# ES m33 dispatch brief — "Tengo que trabajar" (the fourth modal, the missing linker)

Worktree: `/Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1`
(`cd` there first, and again in every command — the shell cwd resets;
`export LINGO_ROOT=$PWD`.)

**Status note (2026-09-10):** m32 ("Necesito una chaqueta nueva") is
ALREADY FULLY LANDED — confirmed via `git log --oneline` showing
`868a965d` "es: m32 «Necesito una chaqueta nueva» (clothing round 2; 5
atoms; 118 clips)" followed by `f30e9728` "ledger: ES m32 landed" and
`957984d2` "ledger: ES m32 reviewer + m33 brief dispatched" (current tip
at time of writing). `ES_MODULE_ORDER` in `grammarHelpers.ts` ends
`..., "m31", "m32"`; `courseAtoms.ts` imports `ES_M32_ATOMS` and spreads
it; `es-quality.test.ts` imports and maps `ES_M32_CHECKPOINT_INDEX`;
`placementBank.ts` imports and arrays `ES_M32_PLACEMENT`. All
registration points confirmed by hand, not just trusted from the commit
message. No `m33-*` file exists anywhere in `docs/es-ir-sources/` yet —
this brief and `m33-header.yaml` are the only m33 artifacts. A reviewer
may be editing m32 FRAGMENT files (`docs/es-ir-sources/m32-L*.yaml`)
concurrently in this worktree — read only, never modify (confirmed
present on disk, not archived). `git status` shows unrelated unstaged
edits to FR/JA lanes (`scripts/i18n/*`, `src/features/languages/fr/*`,
`src/features/languages/ja/*`) from a concurrent session — none of it
touches ES paths. Per [[concurrent-sessions-same-repo]], this brief only
reads — it does not stage or touch any file outside the two it was asked
to produce.

**Read `m33-header.yaml` FIRST — it is denser than this brief and carries
the full WHY/REJECTED/SCOPE reasoning as inline comments. This brief
gives the lesson plan and pipeline mechanics; the header gives the
decision record.**

## The decision this module resolves

Course state at m32: m27 gave a weather-lexicon break, m28 taught «voy a
+ infinitivo», m29 taught clitic-on-infinitive, m30 gave a body-part
break, m31 taught «me duele/duelen» (one grammar beat riding m30's own
nouns), m32 gave a second clothing break. Interleave-don't-block-teach
calls for a grammar beat next — one break (m32) since the last grammar
beat (m31), the identical single-break cadence m31's own header used to
justify its placement after m30.

m33 is that beat: **«tengo que» + infinitivo — obligation, the fourth
member of this course's modal-verb constellation.** «quiero»/«puedo»
(m14, bare infinitive), «voy a» (m28, «a» + infinitive), and now «tengo
que» (m33, «que» + infinitive) — three different linking strategies for
the identical "modal + infinitive complement" slot, the richest modal-
contrast set this course has ever built in one module. The verb
morphology is entirely free: `tengo`/`tienes`/`tiene` (m5),
`tenemos`/`tienen` (m18), and the bare infinitive `tener` (m15) are ALL
already fully registered with zero paradigm gap (unlike m28's own «va»
gap-fill) — and «que» is already a free function word
(`ES_FUNCTION_WORDS`, `moduleBarGuards.ts` line 83). This module teaches
exactly one new idea — the linking word makes the difference between
"want to," "can," "going to," and "must" — carried by exactly ONE new
atom, the idiom anchor «tengo que» itself. Full reasoning, every rejected
alternative (six candidates weighed, two disqualified outright as
already-shipped content, not merely weaker), and every gate-relevant
detail are in `docs/es-ir-sources/m33-header.yaml` — read it, it is not
decorative.

## Files

Read these before drafting, in this order:

- `docs/es-ir-sources/m33-header.yaml` — the module spine, the one-atom
  idiom-anchor reasoning (mirrors m7's «tengo hambre»/«tengo sed»
  convention), and the complete rejected-alternatives documentation
  (six candidates, two disqualified as already-taught, four rejected on
  atom-budget/recombination/scope grounds with reasons recorded, none
  silently dropped).
- `docs/es-ir-sources/es-m32-brief.md` and `m32-header.yaml` — the
  immediately-PRIOR module (a lexicon break, structurally different from
  this one, but its pipeline-command corrections and hard-rule carry-
  forwards apply unchanged).
- `docs/es-ir-sources/es-m31-brief.md` and `m31-header.yaml` — the
  closest STRUCTURAL precedent: a thin (2-atom) grammar module riding an
  entirely PRIOR word-order frame, checkpoint at L8, dedicated contrast
  lesson at L9. This brief's own shape mirrors m31's throughout — read it
  for the exact `info`-step-then-`build`/`cloze` pattern (no imageMcq
  debut; this module's atom is equally non-imageable) and the "central
  discrimination" writing style to match.
- `src/features/languages/es/curriculum/m14.ts` (read the compiled file
  directly) — the module this one's central contrast is built against.
  Read `ES_M14_ATOMS` (lines 28-35: poder/puedo/puedes/puede, querer/
  quiere) and lesson 2 in full (`puedo cocinar`, `no puedo cocinar hoy`,
  the "the second verb just sits there, untouched" framing) — this
  module's own L1 usage note should echo that exact framing, now
  contrasting the presence of «que» instead of the stem-change.
- `src/features/languages/es/curriculum/m28.ts` — the «voy a» module.
  Read `ES_M28_ATOMS` (only 2 atoms — `ir`, `va` — because `voy`/`vas`
  were already prior; the precedent for "fill only the genuine gap,
  don't re-register what's already taught" that THIS module carries one
  step further: zero gap exists for `tener`, so zero conjugation atoms
  are needed at all, only the idiom anchor).
- `src/features/languages/es/curriculum/m7.ts` (`ES_M7_ATOMS` lines
  42-44) — the idiom-phrase-atom convention (`kind: "phrase"`,
  `partOfSpeech: "phrase"`) this module's one new atom follows exactly.
  **Read this even though m7 is otherwise unrelated in content** — it is
  the load-bearing precedent for why «tengo que» gets its own atom
  despite every component word being independently prior.
- `docs/es-ir-sources/authoring-rules.md` — short (7 lines), read in
  full: the dialogue_sim NPC provenance rule and "Agreement is not a new
  atom" (not directly triggered by this module's own content, since
  neither «tener» nor «que» inflects for gender/number, but the drafting
  agent should still know the rule exists before reaching for it out of
  habit).
- `docs/lesson-authoring-guide.md` §13.1-13.3 — the card-type rubric and
  the just-in-time grammar teach pattern (§13.3: rule card right before
  the construct is needed, one contextual exposure, then real retrieval,
  then a discrimination beat after). **This module debuts NO imageable
  noun** — «tengo que» is a modal-idiom atom with no honest single-
  referent emoji (same category as m13's `gusta`, m28's `va`, m31's
  `duele`/`duelen`) — so §13.2's image-MCQ-as-introduction pattern does
  NOT apply; introduce via `infoStep` (2-3 lines, echoing m14's own
  "the second verb just sits there" framing) then `build`/`cloze`
  production practice.
- `src/features/languages/es/courseAtoms.ts` (imports/registration
  section) and `src/features/languages/es/grammarHelpers.ts`
  (`ES_MODULE_ORDER`) — confirm m32 is the current tail before adding
  m33's entries via `register-mod.py`.
- `src/features/languages/es/curriculum/irAtomResolution.test.ts` — read
  in full (short file). This is the zero-tolerance `atoms:` credit gate;
  its own file comment documents the exact failure class this module is
  at highest risk of (a step crediting an unregistered multi-word surface
  and silently losing SRS credit). See "Hard rules" below for the
  specific trap this module invites.
- `src/features/languages/es/curriculum/es-course-integrity.test.ts` —
  the cross-module RECALL LAW gate (`cue: "recall"` requires the exact
  `targetPhrase` to have been voiced verbatim earlier in course order,
  checked course-wide, not per-module).

## PRIOR vocabulary — verify before drafting, don't trust this list blind

Re-run this grep yourself before writing lesson fragments (registry may
have shifted): `grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..32}.ts | sort -u`

**PRIOR and the complete `tener` paradigm this module rides, zero gap:**
- `tengo`/`tienes`/`tiene` (m5), `tenemos`/`tienen` (m18), bare
  infinitive `tener` (m15, taught explicitly as "the dictionary shape
  behind «tengo»," `curriculum/m15.ts:1153`). Every person this module
  could possibly need already exists.
- `que` — already a free function word (`ES_FUNCTION_WORDS`,
  `moduleBarGuards.ts` line 83: "...pero que si no sí ni como..."), not
  a registered vocab atom and not one this module adds. Confirm this
  grep yourself before drafting: `grep -n "ES_FUNCTION_WORDS" -A16
  src/features/languages/es/__tests__/moduleBarGuards.ts`.

**PRIOR and reusable as the module's three-way contrast set:**
- `quiero`/`quieres`/`quiere` (m7/m14) and `puedo`/`puedes`/`puede`
  (m14) — bare-infinitive modals, this module's primary discrimination
  target (no linker at all).
- `voy a`/`va a` (m9/m18/m28) — «a»-linked near-future, this module's
  secondary discrimination target.

**PRIOR infinitive complements — do not invent a new one:**
`trabajar`/`trabajo`/`trabaja` (m9/m10), `estudiar`/`estudio`/`estudia`/
`estudias` (m10), `comprar` (m12) and the m29 fused-clitic family
(`comprarlo`/`comprarla`/`comprarlos`/`verlo`/`verlos`/`hacerlo`/
`levantarme`), `nadar`, `cocinar`, `bailar`, `cantar`, `hablar`, `comer`,
`leer`, `escuchar` — all independently PRIOR (m9-m15), more than enough
variety for ten lessons without a single new infinitive verb.

**PRIOR connectives and time words for recombination:**
`hoy`/`mañana` (m8), `porque` (m25), `pero`/`también` (m6/m11), `y` (m1),
`juntos` (m18), `amigo` (m15, regular plural `amigos` freely usable per
"Agreement is not a new atom").

**PRIOR clothing/shopping/pain hooks for L10 mastery:**
m32's five clothing nouns + `comprarlo`-family (m29) + `cuánto cuesta`
(m12); m31's `duele`/`duelen` + m30's body nouns, for a `porque` (m25)
justification chain (e.g. "me duele la mano, pero tengo que trabajar").

**NOT PRIOR (verified zero grep hits, do not assume otherwise without
re-checking):** the literal strings `tener que`/`tengo que`/`tienes
que`/`tiene que` (as a combined string, zero hits anywhere in m1-m32 —
confirmed via `grep -rn "tener que\|tengo que\|tienes que\|tiene que"
src/features/languages/es/curriculum/m{1..32}.ts`), `pones`/`pone`
(poner's tú/3rd forms — relevant only if a future module reaches for
`ponerse`, not this one), `llevar` in any form, any imperative/command
form of any verb.

## What this module does NOT teach

- **No second «tener que» registration for tú/3rd/nosotros/ellos.** Only
  the yo-form idiom «tengo que» is registered (see "The one new atom"
  below and the dedicated header section) — «tienes que», «tiene que»,
  «tenemos que», «tienen que» are all fully gradeable through the
  already-registered bare `tener` conjugation plus the free word `que`,
  and must be CREDITED that way in `atoms:` arrays (see Hard Rules #1).
- **No new infinitive verb.** Every infinitive complement this module
  uses is PRIOR (see list above). Do not introduce `viajar`, `dormir`,
  or any verb not already taught — there is no shortage of PRIOR options
  and adding one would be a second new idea competing with the first.
- **No `ponerse`/`llevar`.** Real, well-scoped future content, weighed
  honestly and rejected on atom-budget and recombination-breadth
  grounds specifically for THIS module — see `m33-header.yaml`'s
  dedicated rejection section. Not this module's job.
- **No ser-vs-estar contrast, no imperative, no comparative.** All
  evaluated and rejected — see `m33-header.yaml` REJECTED sections for
  reasons (scope too large for a "≤3 atom, one deduction" beat; no
  natural tie to m28-m32's own recent content).
- **No agreement/inflection content.** Neither `tener`'s conjugated forms
  nor `que` inflect for gender or number — this module has no occasion
  to invoke "Agreement is not a new atom" for its OWN content (it may
  still appear incidentally in a recombination sentence's clothing or
  body noun, per those modules' own rules).

## Step kinds

No imageMcq debut — «tengo que» is a modal-idiom atom, not an imageable
noun (same non-imageable category as m13's `gusta`, m28's `va`, m31's
`duele`/`duelen`; see guide §13.1's rubric row for function-phrase/
abstract-verb atoms). Introduce via `infoStep` (2-3 lines, per the usage-
note budget below, echoing m14's own "the second verb just sits there,
untouched" framing but now for the presence/absence of «que» rather than
a stem change) immediately followed by `build`/`cloze` production
practice on the SAME sentence (guide §13.3's just-in-time cadence: rule
card right before the construct is needed, one contextual exposure, then
real retrieval, then a discrimination beat after). `dialogue_sim` carries
the recombination lessons (L7 plan-vs-obligation conflict, L10 mastery);
`sentenceMcq`/`agreementCloze` distractor pools must include the "dropped
«que»" foil as the central discrimination (see below) — never a
correct-answer position for the foil, per invariant 28's full-sentence
MCQ ban if the foil is itself a complete sentence.

## The central discrimination — read before drafting any lesson

The linking word is the entire lesson. «quiero trabajar» / «puedo
trabajar» (bare infinitive) vs «voy a trabajar» («a» + infinitive) vs
«tengo que trabajar» («que» + infinitive) share the identical infinitive
complement and differ ONLY in the linker. The transfer error to guard
against: a learner who has internalized «quiero»/«puedo»'s bare-
infinitive pattern reaching for *"tengo trabajar" — dropping «que»
entirely, the single most natural mistake this module exists to prevent
(the same structural role m29's third-position foil and m31's "never
conjugate to the person" foil played for their own modules). Every
discrimination step contrasting «tengo que» against «quiero»/«puedo»
must include a foil that drops «que» — never offered as a correct
answer, only as a wrong option in `textMcq`/`sentenceMcq` distractor
pools or as the "spot the error" target of an `agreementCloze`. A
secondary, lower-priority foil: borrowing m28's own linker onto the
wrong verb (*"tengo a trabajar") — worth one distractor slot, not the
module's central rule; do not let it crowd out the primary "dropped
que" foil.

## Hard rules the gates enforce

1. **`atoms:` credit — the specific trap this module invites, read
   before drafting a single step.** `irAtomResolution.test.ts` is
   zero-tolerance: an `atoms:` entry that is not an EXACTLY registered
   surface is a SILENT miss, no throw, no lint (its own file comment
   documents the m6/m12 feminine-agreement incident this exact failure
   class already caused once). This module registers ONLY «tengo que»
   (yo-form). A step whose sentence is "tienes que trabajar" must credit
   `atoms: ["tienes"]` (the PRIOR bare conjugation), never `atoms:
   ["tienes que"]` — that string is not a registered surface and the
   credit would silently vanish. Same for `tiene que` → credit `["tiene"]`;
   `tenemos que` → credit `["tenemos"]`; `tienen que` → credit
   `["tienen"]`. Only a literal "tengo que" sentence may credit
   `["tengo que"]`.
2. Build tiles are billed exposure — `esSurfaces` bills cloze options and
   build tiles, not MCQ distractors (per [[es-which-slots-are-billed]]).
   A "dropped que" distractor string in an MCQ is free; the same string
   as a build tile is billed and must never be offered as a legally
   assemblable answer (the build tile POOL may contain "que" as a
   distractor tile the learner must correctly EXCLUDE, but the tile bank
   itself is fine — only the graded correct assembly must never omit it
   when the target sentence needs it).
3. «lo» has no standalone registration — irrelevant to this module's own
   content (no direct-object clitic in a `tengo que` sentence unless
   recombining m29's fused-clitic family, in which case use the fused
   surfaces `comprarlo`/`comprarla`/`comprarlos`/`verlo`/`verlos`/
   `hacerlo`, never bare «lo»).
4. **Full-sentence MCQ ban (invariant 28):** MCQ correct answers ≤3
   tokens. `looksSpanish()` folds plural/gender inflection via
   `getEsPluralCanon()`/`getEsGenderCanon()` — a multi-word correct
   answer that reads as full Spanish will trip the ban. Keep MCQ answers
   short by construction; this module's own "tengo que" + infinitive
   pairs are naturally short (2-3 tokens) but a recombination sentence
   pulling in m32's clothing nouns could drift long — budget for it.
5. `vocabTextMcq`/`sentenceMcq` targets must be the exactly registered
   surface. This module's only registered surface for direct MCQ-target
   purposes is «tengo que» itself (yo-form); do not target a "tienes
   que"-style bigram as if it were registered (see Hard Rule #1).
6. **ILLEGAL_PRESENT_FORMS-class discipline.** No vosotros form (this
   course never teaches vosotros; ustedes/ellos covers 2nd/3rd plural)
   and no invented conjugation of `tener` beyond the five already-taught
   forms (tengo/tienes/tiene/tenemos/tienen) may appear in any build-tile
   bank or graded answer. `m24.test.ts`/`m25.test.ts` carry a bespoke
   `ILLEGAL_PRESENT_FORMS` scan as local precedent for this class of
   check — this module's own bespoke test file should include an
   equivalent scan restricted to `tener` forms if any recombination
   sentence risks drifting outside the five taught persons.
7. **RECALL LAW** (`es-course-integrity.test.ts`, cross-module): a `cue:
   "recall"` step's `targetPhrase` must match a phrase voiced VERBATIM
   earlier in course order — not merely composed of registered atoms.
   Reprising an m31 pain sentence or an m32 clothing sentence with
   "tengo que" substituted in is a NEW phrase, not a recall; recall only
   an exact phrase this module itself already voiced earlier in its own
   lesson order (matching m32's own hard rule #8 verbatim).
8. **`esSimNpcProvenance.test.ts` — LIVE, ZERO legacy allowance for
   m33.** `KNOWN_LEGACY` covers only m1-m10, m20, m22-m28 — m29 through
   this module get NO reaction-word leniency. Every NPC line's word must
   resolve to a registered atom (this module's one, or any PRIOR module
   ≤m33), a taught verb conjugation, `ES_FUNCTION_WORDS`,
   `ES_PROPER_NAMES`, or a PRIOR multi-word phrase atom's component word.
   Grep every `npc:` string by hand before shipping — do not trust the
   reply-only gate (`es-quality.test.ts`) to catch an NPC-line miss;
   `esSimNpcProvenance.test.ts` checks NPC lines independently.
9. `es-quality.test.ts`'s own dialogue_sim checks (multi-word atom
   inflection integrity + reply-word provenance) still apply independent
   of #8 — both gates must pass.
10. `assemble-mod.sh` must run under zsh (`zsh docs/es-ir-sources/
    assemble-mod.sh m33`, not `bash`/`sh`) — it uses zsh glob-qualifier
    syntax (`${(on)FILES}`) that fails under other shells.
11. Zero emoji collisions to check — this module has no new emoji (see
    "Vocab card art" below) — but re-run `grep -o 'emoji: "[^"]*"'
    curriculum/m{1..32}.ts | sort -u` anyway if a drafting agent's IR
    accidentally adds one; that would itself be a defect (this module's
    one atom is phrase-kind, no `emoji:` field, matching m13/m28/m31's
    own non-imageable grammar atoms).
12. Accent color — `curriculum/index.ts`'s `accent: { from, to }` pair
    must be a zero-collision pair against all 32 existing entries.
    `m33-header.yaml` proposes `#78716c`→`#1c1917` (warm graphite/stone),
    verified zero-collision against all 32 at header-writing time —
    re-verify at ship time regardless (concurrent lanes may touch the
    registry).

## SIM NPC lines

Keep NPC dialogue in L7 (plan-vs-obligation conflict) and L10 (mastery)
restricted to PRIOR invitation/plan vocabulary the learner can decline
with an obligation: `quieres`/`quiere` (m7/m14), `vamos a`/`vas a` (m18/
m28), `puedes` (m14), `qué`, PRIOR function words (`pero`, `y`, `porque`
m25), this module's own «tengo que» (yo-form only — an NPC line asking a
tú/3rd-person obligation question must be built from the PRIOR bare
`tener` forms + `que`, never from this module's own registered yo-form
surface), and proper names from `ES_PROPER_NAMES`. A natural scenario:
NPC invites the learner ("¿quieres nadar mañana?" / "vamos a la playa"),
learner declines with an obligation ("no puedo, tengo que trabajar").
Grep every `npc:` string by hand against the registry before shipping —
do not trust the reply-only gate to catch a provenance miss;
`esSimNpcProvenance.test.ts` checks NPC lines independently and will
fail the whole module on one bad word.

## Usage-note budget

Per CLAUDE.md's lenses (explanations budget ~3 short lines): one usage
note per genuinely novel pattern only. Candidates here: (1) L1's «tengo
que» debut — the linker is the whole lesson, echo m14's "the second
verb just sits there, untouched" framing but pivot it to "and this time
something new sits IN FRONT of it too: «que»." (2) L9's dedicated
contrast (see lesson plan) may warrant one line naming all three linker
strategies side by side as a single table-like utterance, not three
separate notes. Do not add a usage note for every person-form
recombination (tienes que/tiene que/tenemos que/tienen que) — those are
mechanical substitutions of already-taught conjugations into an
already-explained pattern, needing no new explanation per lesson.

## Lesson plan (10 lessons, checkpoint at L8, contrast at L9)

| L | Focus | New atoms taught | -sp-win (recombination sentence) |
|---|-------|-------------------|-----------------------------------|
| 1 | «tengo que» debut, yo-form, vs «quiero» (dropped-«que» foil intro) | tengo que | "Tengo que trabajar." |
| 2 | tú-form recombination (`tienes` + `que`) | — | "¿Tienes que estudiar hoy?" |
| 3 | 3rd-singular recombination (`tiene` + `que`, named subject) | — | "Ana tiene que trabajar mañana." |
| 4 | nosotros recombination (`tenemos` + `que`) | — | "Tenemos que estudiar juntos." |
| 5 | ellos/ustedes recombination (`tienen` + `que`) | — | "Mis amigos tienen que trabajar." |
| 6 | Discrimination — «quiero»/«puedo» (bare) vs «voy a» («a») vs «tengo que» («que»), mixed persons, no new atoms | — | "Quiero nadar, pero tengo que trabajar." |
| 7 | Dialogue_sim — NPC invites, learner declines with obligation | — | "No puedo, tengo que trabajar." |
| 8 | **Checkpoint** — mixed review, all 5 persons, dropped-«que» foils throughout; ≥2 recalls | — | (review, no new sentence) |
| 9 | **Dedicated contrast** — «puedo» (ability) vs «tengo que» (obligation), same infinitive host, minimal-pair sentences; ≥1 recall | — | "Puedo trabajar, pero no tengo que trabajar hoy." |
| 10 | Mastery — cumulative recombination: m32 clothing/shopping + m29 fused clitics + m31 pain + m25 «porque», dialogue_sim, no `info`; ≥2 recalls | — | "Me duele la mano, pero tengo que comprarlo — necesito una chaqueta nueva." |

Recalls: L2+ may recall L1; L6+ may recall L1-L5; floor ≥5 recalls total,
matching m29's/m31's own convention. Put ≥1 recall in L2, L3, L4, L5, L6,
L7, L9 and ≥2 in L8/L10.

## What to report back

1. Which files were written/modified (list paths).
2. Final atom count and list (surface + kind + hint) — should be exactly
   1 («tengo que»). Any deviation must be justified against
   `m33-header.yaml`'s own reasoning, not silently drifted into.
3. Confirmation that no step credits `atoms: ["tienes que"]` (or any
   "X que" bigram other than "tengo que" itself) — grep the assembled IR
   for the literal string before shipping.
4. Confirmation that no sentence drops «que» as a correct answer (the
   central discrimination foil must appear only as a wrong option).
5. Confirmation that no `dialogue_sim` NPC line uses an unregistered
   surface (grep output, not just a claim).
6. Any gate failures hit during `assemble-mod.sh`/`compile-ir-es.mjs`
   and how resolved.
7. Any deviation from this lesson plan and why.
8. Any new UNVERIFIED claims discovered during drafting, appended to the
   list below rather than silently resolved.

---

## Exact pipeline commands

Run these in order from the worktree root, with `LINGO_ROOT` exported.
**`register-mod.py`'s actual signature, resolved definitively this brief
— m32's own brief guessed wrong, corrected here by reading the script
itself:** `register-mod.py` takes exactly 7 positional args — `<prev>
<new> "<title>" "<eyebrow>" "<summary>" "<accent-from>" "<accent-to>"` —
matching m31's brief usage, NOT m32's brief's invented 8-arg form
(`m32 "title" 10 8 "#from" "#to" "none"`, which does not match the
script and was never actually run that way — m32's own landed commit
confirms `curriculum/index.ts`'s m32 card carries an `eyebrow:` field
that only the 7-arg form produces). The script touches **5 files, 11
edit points** (confirmed by direct read of `register-mod.py` and by
grepping the LANDED m32 registration): `curriculum/index.ts` (import,
lesson-map entry, meta card = 3 edits), `grammarHelpers.ts`
(`ES_MODULE_ORDER`, 1 edit), `courseAtoms.ts` (import, type union,
spread = 3 edits), `curriculum/es-quality.test.ts` (import, map = 2
edits), and **`placementBank.ts`** (import, array entry = 2 edits) —
m32's own brief listed only "6 points" and OMITTED `placementBank.ts`
from that checklist despite flagging it as unverified; this is now
resolved: `placementBank.ts` IS touched, confirmed via `grep -n "M32"
src/features/languages/es/placementBank.ts` returning both the import
and the array-entry lines on the landed m32.

1. `cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1 && export LINGO_ROOT=$PWD`
2. Write `docs/es-ir-sources/m33-placement.yaml` (same shape as
   `m32-placement.yaml`: a `screener` entry + 3-4 `byModule` entries).
   Anchor at least one `byModule` prompt on the dropped-«que» foil itself
   (an English sentence whose Spanish translation is ambiguous only in
   whether «que» is present), not only on person-conjugation.
3. Draft each `docs/es-ir-sources/m33-L{1..10}.yaml` lesson fragment per
   the lesson plan above (a Sonnet subagent's job per the HARD RULE — no
   inline bulk authoring by Fable).
4. Per-lesson validate as drafted:
   `zsh docs/es-ir-sources/check-frag.sh m33 <tag 1-9> docs/es-ir-sources/m33-L<N>.yaml`
   (needs `m33-placement.yaml` on disk first, per step 2).
5. Assemble: `zsh docs/es-ir-sources/assemble-mod.sh m33`
   (produces `src/features/languages/es/curriculum/ir/m33.ir.yaml` from
   the header + lesson fragments + placement; `lessons:` in
   `m33-header.yaml` is filled by this step, do not hand-edit it).
6. Compile: `node scripts/compile-ir-es.mjs m33`
   (produces `src/features/languages/es/curriculum/m33.ts` — READ THE
   GENERATED FILE).
7. No emoji to vendor this module (see "Vocab card art" below) — skip
   the render/eyeball step.
8. Register (all 7 args in one call, confirmed signature above):
   `python3 docs/es-ir-sources/register-mod.py m32 m33 "Tengo que trabajar" "Module 33 · Obligation, at last" "«tengo que» plus a bare infinitive — the fourth linker in this course's modal family (quiero/puedo, voy a, and now tengo que), riding a «tener» paradigm and a «que» you already know completely." "#78716c" "#1c1917"`
9. Verify registration landed at all 5 files / 11 points:
   `grep -n "m33\|M33" src/features/languages/es/curriculum/index.ts src/features/languages/es/grammarHelpers.ts src/features/languages/es/courseAtoms.ts src/features/languages/es/curriculum/es-quality.test.ts src/features/languages/es/placementBank.ts`
10. `node scripts/gen-es-review-pool.mjs` to regenerate the review pool
    including m33's new atom.
11. Hand-write `src/features/languages/es/curriculum/m33.test.ts` with
    bespoke pins for at least: the dropped-«que» foil check (grep for a
    bare "tengo/tienes/tiene/tenemos/tienen [infinitive]" sequence with
    no intervening «que» in any GRADED correct-answer position — allowed
    freely as m14-recombination content, must never appear as this
    module's own correct answer for an obligation-target sentence), the
    `atoms:` bigram-credit trap (grep the assembled IR for any "X que"
    string other than "tengo que" itself inside an `atoms:` array — fail
    if found, per Hard Rule #1), the L9 puedo-vs-tengo-que contrast pin
    (verify the same infinitive appears in both frames), and one
    dialogue_sim NPC-provenance check.
12. `bash docs/es-ir-sources/tts-chain.sh m33` to generate audio for any
    new sim/listening content.
13. Run the course-wide ES quality suite:
    `npx vitest run src/features/languages/es/curriculum/es-quality.test.ts`
14. Run the NPC provenance gate specifically:
    `npx vitest run src/features/languages/es/curriculum/esSimNpcProvenance.test.ts`
15. Run the recall-law / course-integrity gate:
    `npx vitest run src/features/languages/es/curriculum/es-course-integrity.test.ts`
16. Run the atom-resolution gate:
    `npx vitest run src/features/languages/es/curriculum/irAtomResolution.test.ts`
17. Run `moduleBarGuards` / full-sentence-MCQ-ban tests (confirm the
    exact runnable target — `moduleBarGuards.ts` may be import-only, not
    a `.test.ts` file itself; check for a wrapper before assuming this
    path runs directly, same caution m32's brief flagged and never fully
    resolved).
18. Full ES test sweep before declaring done:
    `npx vitest run src/features/languages/es`
19. Do NOT commit — dispatching agent or a later step owns the commit.

## Vocab card art — NONE required this module (verified, not assumed)

«tengo que» is a phrase/idiom-kind atom with no honest single-referent
emoji, the same category as m13's `gusta`, m28's `va`, and m31's
`duele`/`duelen` — none carry an `emoji:` field. This module invents no
imageable noun of its own. No `src/pub/noto-emoji/svg/` work applies.
Re-verify at ship time regardless (a concurrent lane could in principle
touch the emoji registry, and the drafting agent's own IR must not
accidentally introduce an `emoji:` field on the one new atom — that
would itself be a defect, not a stylistic choice, since a modal-idiom
atom has no honest image).

## The 5 registration points / 11 edits (register-mod.py checklist)

1. `curriculum/index.ts` — import statement, lesson-map entry, meta card
   (title/eyebrow/summary/accent exactly as passed) — 3 edits, 1 file.
2. `grammarHelpers.ts` — `ES_MODULE_ORDER` array, append `"m33"` after
   `"m32"` — 1 edit.
3. `courseAtoms.ts` — import `ES_M33_ATOMS`, add `"m33"` to the
   `EsAtomSource` type union, spread `...ES_M33_ATOMS,` — 3 edits, 1
   file.
4. `curriculum/es-quality.test.ts` — import `ES_M33_CHECKPOINT_INDEX`,
   add `m33: ES_M33_CHECKPOINT_INDEX,` to the map — 2 edits, 1 file.
5. `placementBank.ts` — import `ES_M33_PLACEMENT`, add `["m33",
   ES_M33_PLACEMENT],` to the array — 2 edits, 1 file. **Confirmed
   touched by the script this time (see pipeline-commands preamble
   above) — do not skip verifying this file the way m32's own checklist
   did.**

(Treat `register-mod.py` itself, not this brief or any prior brief, as
canonical if a future version of the script's signature or file list
changes — re-read it immediately before running, per the discipline
every prior brief has required.)

## Decisions inferred (recorded, not parked)

- **Theme: obligation, «tengo que» + infinitivo.** Chosen over «poder +
  infinitivo» (DISQUALIFIED — already fully taught at m14, would be
  recombination mislabeled as new content), «me gusta(n)» extended to
  infinitives/clothing (DISQUALIFIED — already fully taught at m13,
  same reason), `ponerse`/`llevar` (real future content, explicitly
  weighed and rejected THIS time on atom-budget — 3-4 new atoms for
  honest coverage vs this module's 1 — and recombination-breadth
  grounds — ties only to m32, vs «tengo que»'s four-way tie to
  m14/m28/m29/m32), `hace frío/calor` + clothing (pure recombination,
  zero new grammar), `estar` vs `ser` for states (real future content,
  too large a lift for a "≤3 atom, one deduction" beat — 4-6+ atoms and
  a genuinely hard usage distinction), imperative tú (no learner-need
  justification found; NPC-authoring convenience alone doesn't earn a
  module slot), and demonstratives with clothing (DISQUALIFIED — already
  fully PRIOR since m12). Full reasoning with grep commands in
  `m33-header.yaml`.
- **Exactly ONE new atom, «tengo que» (yo-form idiom anchor).** Mirrors
  m7's own «tengo hambre»/«tengo sed» idiom-phrase convention exactly —
  registered despite every component word being independently prior,
  because the meaning is not transparent from the parts. Every other
  person's form is graded through the already-registered bare `tener`
  conjugation, never a second "X que" surface — a deliberate, explicit
  decision (see the dedicated header section and Hard Rule #1), not an
  oversight or a thing left for the drafting agent to improvise.
- **register-mod.py's arg signature, resolved definitively.** Read the
  script directly (`docs/es-ir-sources/register-mod.py`, 7 positional
  args: prev, new, title, eyebrow, summary, accent-from, accent-to) and
  cross-checked against the LANDED m32 registration in `curriculum/
  index.ts` (which carries an `eyebrow:` field only the 7-arg form
  produces) — this corrects m32's own brief, which guessed an
  incompatible 8-arg form that was evidently never actually run that
  way. Not left as UNVERIFIED this time.
- **placementBank.ts IS the 5th registration point, confirmed by direct
  grep of the landed m32 state** — corrects m32's own "6 points"
  checklist, which omitted it while separately flagging it UNVERIFIED.
  Resolved, not re-punted.
- **Checkpoint at L8, dedicated contrast at L9.** Matches m29's, m30's,
  and m31's own identical placement — the established convention, no
  reason to deviate.
- **Accent: warm graphite/stone `#78716c`→`#1c1917`.** Checked against
  every `accent:` pair in `curriculum/index.ts` (zero collision, all 32
  pairs read) and against the four most recent modules specifically (m29
  cool slate, m30 teal, m31 rose, m32 denim indigo) — this is the
  course's first genuinely neutral, unsaturated accent, distinct from
  all of them; reads as "weight/duty" without forcing a heavy metaphor.
- **No vocab card art, no vendoring.** «tengo que» carries no honest
  image, matching the non-imageable-grammar-atom convention already
  established by m13/m28/m31's own atoms.

## Claims marked UNVERIFIED

1. **Whether `moduleBarGuards.ts` is directly runnable via vitest or is
   only imported by another `.test.ts` file.** Read as a `.ts` file (not
   `.test.ts`) during research, same open question m32's own brief
   carried forward unresolved — pipeline command #17 above may need a
   different target path. Confirm before running.
2. **Whether a bespoke `ILLEGAL_PRESENT_FORMS`-style scan restricted to
   `tener` forms is actually necessary for this module**, or whether the
   course-wide atom-resolution/quality gates already catch any invented
   `tener` conjugation as an unregistered surface without a dedicated
   scan. `m24.test.ts`/`m25.test.ts` carry this pattern for their own
   (unrelated) content; whether it generalizes cleanly to a `tener`-only
   scan for this module was reasoned by analogy, not independently
   traced through the gate machinery. A drafting agent should decide
   based on whether the course-wide gates alone prove sufficient during
   assembly, and note the decision in the final report.
3. **Whether `getEsPluralCanon()`/`getEsGenderCanon()` have any
   interaction with a `kind: "phrase"` atom like «tengo que»** — these
   folds were read and confirmed to target single-word noun/adjective
   inflection; whether a two-word phrase atom is exempted cleanly or
   could produce an unexpected partial match was not traced line-by-line
   against this specific atom's shape. Unlikely to matter (the atom
   inflects for nothing — no gender, no number) but not independently
   proven against the actual fold code.
4. **The exact wording `register-mod.py` expects for `<eyebrow>` and
   `<summary>`** (quoting/escaping of the em-dash and guillemets used in
   this brief's own proposed strings) — the script's `edit()` function
   does a literal Python string replace, so unusual punctuation should
   pass through unchanged, but this was not tested against a live run
   during research. A drafting agent should verify the exact strings
   landed correctly in `curriculum/index.ts` after running step 8, not
   just trust the script's own "registered m33" printout.
