# ES m28 «Voy a nadar mañana» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m28-L<n>.yaml` files.

**Worktree note:** this brief may be drafted from a git worktree, not the
main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh` all
default to the MAIN checkout path if `LINGO_ROOT` is unset — in a worktree
that silently writes to the wrong tree. Before running ANY script below:
`export LINGO_ROOT=$PWD` (from the repo root of whichever checkout you are
actually in).

**m27 status note:** this brief was researched and written from a
worktree that only READ the tree — m27 ("Hace sol, hace frío")'s exact
committed/reviewed state was NOT re-verified beyond grepping its own
`m27.ts`, `m27-header.yaml`, and its 10 `m27-L*.yaml` fragments on disk
(all present, zero `de niños`/`donde`/`nevaba` residue found — consistent
with the overnight ledger's 11:11/11:17 entries recording m27 committed
d2d91a22 then reviewed 0be21768). Re-grep any m27-sourced surface before
relying on it if you are drafting more than a few hours after this brief
was written.

## The decision this module resolves

`docs/handoff-2026-09-10-overnight-authoring.md`'s 08:06 entry first
recorded it, `m26-header.yaml` carried it forward as a live warning, and
`m27-header.yaml`'s own REJECTED ALTERNATIVE 2 named it again and
explicitly declined to file it as a module: **the infinitive «ir» has
never been registered as an atom**, despite being the dictionary form of
PRIOR «voy»/«vas» (m9) and «vamos»/«van» (m18), and despite 15+
unatomized uses as a filler complement after «quería»/«podía» in m24
alone. **m28 closes that gap by giving «ir» a real grammatical job: the
periphrastic near future, «voy a + infinitivo».** PRIOR «voy»/«vas»
(m9, "I'm going / you're going [somewhere]") and «vamos»/«van» (m18,
"we go / they go [somewhere]") take a bare infinitive instead of a place
and become "I'm going to / you're going to [verb]" — the entire complement
slot is PRIOR (18 bare infinitives already registered, m10–m15, see
below), so this module's only new atoms are «ir» itself and «va» (the
3rd-person present — grep-confirmed used ONLY as a foil across m20/m22/
m23, never as an atom or an answer). Full reasoning, the four rejected
alternatives, and the «voy a» ambiguity name are in `m28-header.yaml`'s
comment block — read it, it is not decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m28-header.yaml` — the module spine + the 2 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word.
- Exemplars (copy their shape exactly, but note this module's own
  DIFFERENCE below): `m9-L1.yaml`/`m9.ts` if present, else `m9.ts` directly
  (the ORIGINAL «voy»/«vas» + place debut — copy tone and person-ladder
  shape, not the imageMcq mechanics, this module has none); `m18.ts`
  («vamos»/«van» present-tense debut); `m24-L1.yaml` (a modal-plus-bare-
  infinitive complement lesson — «quería ir al cine» — the closest PRIOR
  shape to this module's own «voy a + infinitivo»: same "conjugated verb,
  then an untouched infinitive" mechanic); `m26-L6.yaml`/`m27-L6.yaml`
  (recombination lesson shape — your L6 pairs this module's «va a
  hacer frío» against PRIOR weather nouns, m27, and PRIOR connectives);
  `m25-L7.yaml` (negation without a new question form — your L7's shape,
  this module also has no NEW question word, only plain yes/no inversion,
  which needs no new atom); `m21-L8.yaml`/`m22-L8.yaml`/`m23-L8.yaml`/
  `m24-L8.yaml`/`m25-L8.yaml`/`m26-L8.yaml`/`m27-L8.yaml` (checkpoint);
  `m22-L9.yaml`/`m24-L9.yaml`/`m26-L9.yaml`/`m27-L9.yaml` (a contrast
  lesson — your L9's shape, but contrasting «voy a + PLACE» (PRIOR
  movement, m9) vs «voy a + INFINITIVE» (this module, near future)
  instead of a tense pair — see hard rule 7 for the exact restriction);
  `m26-L10.yaml`/`m27-L10.yaml` (mastery, narrating a plan — your L10's
  shape, and READ THEIR HEADER COMMENTS: both had to strike an
  unregistered surface from the brief's own suggested win line — see
  "SIM NPC LINES" section below before you draft L10).
- Your output: `m28-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m28 <tag> docs/es-ir-sources/m28-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`.
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (besides the 2 new atoms)
Every atom of m1–m27 is PRIOR. Grep to check a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..27}.ts | sort -u | grep -i "<word>"`.
**The exact sentence-frame words this module leans on, all PRIOR, grep-
verified:** «voy»/«vas» (m9, "I'm going / you're going [somewhere]" — this
module REUSES them for the near future), «vamos»/«van» (m18, same reuse),
«a» (function word, the fixed linking word — NOT the "to [place]"
preposition in this module's own use, see the ambiguity section below).
**The 19 PRIOR bare infinitives that fill the complement slot, grep-
verified against `atom({ surface: "..."` (not just any mention):**
bailar, cantar, estudiar, hablar, trabajar (m10); comer, correr, escribir,
leer, vivir (m11); comprar (m12); cocinar, nadar, viajar (m13); dormir
(m14); salir, tener, ver, hacer (m15). Use ONLY these as the infinitive
after «voy a»/«vas a»/«va a»/«vamos a»/«van a» — do not manufacture a new
one (e.g. no bare «jugar», not registered as an infinitive despite
possible conjugated cousins — grep before trusting your own memory of
what "feels" taught). **PRIOR time/frame markers for future framing:**
mañana (m8), hoy, el fin de semana (m19), este/esta (m12 — «este fin de
semana» is a legal fresh COMBINATION of two independently-PRIOR words,
never used verbatim before in the course; flagged UNVERIFIED-by-novelty
below, not by unregisteredness). **PRIOR connectives, both toolkits, all
six legal from L1:** cuando, mientras, de repente, entonces (m23) AND
porque, por eso (m25). **PRIOR weather nouns for L6's interleave (m27):**
el sol, la lluvia, el viento, la nieve, nublado, el calor, el frío — «va a
hacer frío»/«va a hacer calor»/«va a estar nublado» are all legal PRIOR+
new-module combinations (hacer is PRIOR m15, va is this module's own new
atom). **PRIOR imperfect/preterite «ir» forms, for L9's contrast only,
never mixed into this module's own near-future sentences:** fui/fuiste/
fue/fuimos/fueron (m19–m21, preterite "went"), iba/ibas/íbamos/iban
(m22, imperfect "used to go") — name these explicitly to a drafting agent
as DIFFERENT tenses of the same verb, never substitutable for «va».
**PRIOR narrative connective glue:** pero (m6), también (m11), juntos
(m18). Function words as in m21–m27 briefs. Fixed cast only: Ana, Diego,
Sofía, María, Carmen, Sam, Luis. Never invent a name or place beyond
España/México.

### What this module does NOT teach
- **No morphological (simple) future tense.** «iré», «irás», «irá»,
  «iremos», «irán» (and every other verb's true-future forms — «haré»,
  «tendré», etc.) are real Spanish but are NOT registered and NOT
  manufactured here. This module teaches ONLY the periphrastic near
  future, «ir a + infinitivo» — the "going to" construction, not the
  "will" construction. Pin (see hard rule 4) bans the future-tense forms
  outright.
- **No subjunctive.** «voy a + infinitivo» never triggers a mood change
  on its own complement; don't reach for one.
- **No object pronouns.** «lo»/«la»/«los»/«las»/«me»/«te»/«le» attaching
  to the infinitive («voy a comprarlo») or fronting the conjugated verb
  («lo voy a comprar») are real and natural, but object-pronoun placement
  is a genuinely NEW mechanic (two legal positions) with no PRIOR shape
  to anchor it — deliberately deferred to a future module (see header's
  REJECTED ALTERNATIVE 1). Don't reach for a pronoun object in any
  sentence this module builds.
- **No new question word.** Same discipline as m25/m27: only plain yes/no
  inversion («¿vas a nadar mañana?»), which needs no new atom. No bare
  «qué» (still unregistered, per m25/m27's own exclusion — «¿qué vas a
  hacer?» is banned twice over: bare «qué» AND bare «hacer»-as-a-content-
  question, even though «hacer» itself is PRIOR as a complement infinitive
  in a declarative sentence).
- **«voy a ir» is reserved for L10 only** (not banned, but restricted —
  see header's "THE «voy a ir» CAUTION" section). Never use it in L1–L9.

## The «voy a» ambiguity — read before drafting ANY lesson
«voy a la playa» (PRIOR, m9) is "a" as the destination preposition — a
NOUN/place follows. «voy a nadar» (this module) is "a" as the fixed
periphrastic-future linking word — a bare INFINITIVE follows. Same three
characters, same verb «voy», two different structures decided entirely by
what comes next. This is NOT a lexical homograph (no ambiguity risk for a
native listener — the very next word resolves it instantly) but it IS a
genuine syntactic distinction a beginner course must handle honestly:
**never claim in a card that these "are the same thing."** Every sentence
in L1–L8 and L10 must make the noun-vs-infinitive distinction unambiguous
from the very next word (this is hard rule 6). L9 is the one lesson whose
entire JOB is to put the two structures side by side on purpose.

## Step kinds
Same vocabulary as m21–m27 (map, info, speakLit, buildLit,
listenBuildLit, listenCompLit, clozeLit, agreementLit, mcq/textMcq/
imageMcq/audioWimcq, matchLit, sim) — see `m24-L1.yaml`'s modal+infinitive
complement steps for the closest PRIOR mechanic. **NO imageMcq this
module** — neither new atom is imageable (both are grammar/verb-
morphology words, the same category `hacía`/`estaba` (m24) and `nublado`
(m27) fall into per the authoring guide's §13.1 rubric; no PRIOR
verb-morphology atom in this course — «voy»/«vas»/«vamos»/«van» included —
carries an emoji). Introduce «ir» and «va» via `info`/`buildLit`/
`listenCompLit`, matching the non-concrete-atom rubric, not the image-
debut pattern. Every lesson ends sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. Each of the 2 new atoms' first appearance must be an intro-capable
   non-image step (`info`/`buildLit`/`listenCompLit` — NOT `imageMcq`,
   see above); ≥3 answer positions at debut, reuse (≥1 answer position)
   in ≥2 later lessons. With only 2 new atoms carrying a 5-person PRIOR-
   reuse paradigm across ten lessons, neither may go quiet for more than
   2 consecutive lessons after L5.
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a
   PRIOR noun with its emoji (this module owns no new nouns/emoji — pull
   from PRIOR, e.g. m27's own weather nouns via the L6 interleave, or any
   earlier place noun).
3. Glosses: «ir» glosses as the infinitive "to go" — never as a
   conjugated form. «va» glosses as "he/she/it goes, is going" — never
   confused with «iba» (imperfect, PRIOR m22, "used to go") or «fue»
   (preterite, PRIOR m19–m21, "went"). Name the three-way tense
   distinction explicitly in any usage note that touches more than one of
   them (L9 especially). No internal `. ` `! ` `? ` inside a build `en`.
4. **No invented true-future forms.** Grep every lesson's JSON blob
   (including `tiles:`/`distractors:`/`options:` arrays — the automated
   `ILLEGAL_PRESENT_FORMS`-style scan only reads prose, per the class bug
   m24's and m26's Sonnet reviewers found, [[vocab-gate-blind-to-fragments]])
   for «iré», «irás», «irá», «iremos», «irán», and any other verb's
   morphological-future ending — none may appear anywhere, foil or
   answer.
5. **No object pronoun forms** («lo», «la», «los», «las», «me», «te»,
   «le» in an object-pronoun role — «me»/«te» as reflexive/indirect-object
   function words in an ALREADY-PRIOR fixed phrase like «me gusta» are
   fine, that's not this rule; a NEW object-pronoun attachment to an
   infinitive or a conjugated verb is what's banned) — grep for «lo»/«la»
   immediately preceding a conjugated «voy»/«vas»/«va»/«vamos»/«van» or
   immediately suffixed to any infinitive; fail if found.
6. **«voy a» + place vs «voy a» + infinitive must be structurally
   unambiguous in every sentence.** The token immediately after «a» must
   unambiguously be either a PRIOR place noun (place reading) or a PRIOR
   bare infinitive (near-future reading) — never a word that could be
   misparsed as either.
7. **L9 contrasts «voy a» + PLACE (PRIOR movement, m9) vs «voy a» +
   INFINITIVE (this module's near future), same surface, two structures**
   — same restriction shape m22/m24/m26/m27's own L9 carried for tense
   pairs, adapted: this is a syntactic contrast, not a tense contrast: no
   third structure competes, and every sentence must be individually
   disambiguated by hard rule 6.
8. If a lesson pairs the near future with a PRIOR m23 connective (cuando/
   mientras/de repente/entonces) or m25's causal pair (porque/por eso —
   L6 especially), each connective must still obey its own rule (cuando
   → preterite clause — this rule makes «cuando» a poor fit for THIS
   module's own near-future clauses; prefer mientras/entonces/porque/por
   eso for L6, which don't force a tense collision; de repente also
   collides — an interruption marker doesn't pair naturally with a
   planned-future statement — avoid it here).
9. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
10. Sim distractors wrong by person-swap (offering «va» where «voy» fits
    the learner's own turn, or vice versa) or by movement/near-future
    confusion (offering a place noun where an infinitive fits, or vice
    versa), never nonsense (m21–m27 rule, unchanged).
11. **No new emoji this module.** Both new atoms are grammar words with
    no PRIOR verb-morphology precedent for emoji. If a drafting agent
    reaches for an emoji on «ir» or «va», stop — it's wrong here; no
    vendoring step applies to this module (see "Vocab card art" section
    below, included for completeness/audit trail even though it's a
    no-op).

## SIM NPC lines must stay inside the registered-surface set (read before L10)
`m26-L10.yaml` and `m27-L10.yaml` BOTH had to strike an unregistered
surface from this brief-writing lineage's own suggested win line before
shipping: m26's suggested line used the unregistered plural «de niños»
(the course only ever registered the singular «de niño», m22); m27's
suggested line used the unregistered «donde» and the banned invented
form «nevaba». The overnight ledger's 11:17 entry names this as a
recurring pattern and records an OPEN gate gap: *"«de niños» plural has
now recurred in m26 and m27 mastery sims — add a pin to the ES test
template (UNREGISTERED scan should already catch it; check why it
doesn't for sim NPC lines)."* That gate fix has NOT landed as of this
brief. Consequences for you:
- **Ban «de niños» (plural) explicitly in this module too**, even though
  it has no thematic connection to «voy a + infinitivo» — it is a
  standing contamination risk any mastery-lesson improvisation could
  reach for when narrating "as children"/"when we were kids." Use only
  the registered singular «de niño» if a childhood-memory clause is
  useful for contrast (it shouldn't be needed — this module's narrative
  frame is upcoming plans, not the past).
- **Manually grep every sim `npc:` line** (not just the graded win
  line/answer positions) against the PRIOR+newAtoms registered-surface
  set the same way you grep answer positions. Do NOT rely on the
  automated UNREGISTERED-surface scan alone for sim NPC dialogue — it is
  the exact place the last two modules' bugs both hid.
- If you hit the same class of bug a THIRD time (any sim NPC or win line
  using an unregistered or banned surface), flag it to the coordinator
  explicitly in your report — three recurrences is the signal to actually
  build the gate fix instead of hand-fixing it a third time.

## Usage-note budget (this module's equivalent of a grammar rule card)
Budget ≤3 lines (per CLAUDE.md's explanation budget) for L1's `info` step,
explaining the «voy a + infinitivo» pattern AND naming the ambiguity
against PRIOR «voy a + [place]» in the same breath — don't split these
into two separate notes, the contrast IS the explanation. Suggested shape
(adapt, don't invent a longer one):
> «voy a» (m9) + a place means "I'm going to [place]." «voy a» + an
> infinitive — a verb's plain dictionary form, «ir», «nadar», «trabajar»
> — means "I'm going to [verb]," a plan for later: «voy a nadar mañana».

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atom(s) owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Voy a nadar mañana | ir (infinitive) debut; the «voy a + infinitivo» pattern debuts on yo | voy (m9), mañana (m8), nadar (m13) | «mañana voy a nadar» |
| 2 | ¿Vas a trabajar mañana? | ≥1 recall (ir); tú-form, yes/no question (no new atom, plain inversion) | vas (m9), trabajar (m10), mañana | «no, mañana voy a estudiar» |
| 3 | Ana va a comer con Diego | va — the new atom (previously foil-only); él/ella/usted; ≥1 recall | va (new), comer (m11), con (function word) | «Ana va a comer con Diego mañana» |
| 4 | Vamos a viajar | vamos (PRIOR m18) reused for near future; ≥1 recall | vamos (m18), viajar (m13) | «vamos a viajar el fin de semana» |
| 5 | Van a cocinar juntos | van (PRIOR m18) reused; full 5-person paradigm complete; ≥1 recall | van (m18), cocinar (m13), juntos (m18) | «Sam y Luis van a cocinar juntos» |
| 6 | Va a hacer frío | recombination — this module's «va a + hacer» idiom against PRIOR weather nouns (m27) + PRIOR causal connective; ≥2 recalls | va, hacer (m15), frío/calor/nublado (m27), por eso (m25) | «mañana va a hacer frío, por eso no voy a nadar» |
| 7 | No voy a trabajar mañana | negation across the paradigm (no question form beyond plain inversion, no new atom); ≥1 recall | no (m1), pero (m6) | «no voy a trabajar mañana, voy a cocinar» |
| 8 | Checkpoint | graded only, both atoms + full paradigm + L6's recombination recall; ≥2 recalls | va, hacer, por eso | «mañana va a hacer calor, por eso vamos a nadar juntos» |
| 9 | Voy a la playa, voy a nadar | every atom side by side; «voy a» + PLACE (PRIOR movement, m9) vs «voy a» + INFINITIVE (this module) contrast (hard rule 7); ≥1 recall | voy/vas/va/vamos/van, la playa (m9) | «hoy voy a la playa, y mañana voy a nadar otra vez» — verify «otra vez» is PRIOR before using it (UNVERIFIED, see below); safer default: drop it, «hoy voy a la playa, y mañana voy a nadar» |
| 10 | Mastery | Ana asks the group about the weekend's plans; longest sim; no info; ≥2 recalls, ≥1 PRIOR m23 connective (mientras/entonces, NOT cuando/de repente — see hard rule 8), ≥1 PRIOR m25 connective; «voy a ir» permitted here only | mañana, el fin de semana, juntos, porque/por eso | «este fin de semana vamos a viajar juntos, y yo también voy a ir a la playa» |

Every content word above not already flagged PRIOR in this brief is
grep-confirmed against m1–m27 by the method above. Recalls: L3+ may
recall L1/L2; L6+ may recall L1–L5; floor ≥5 recalls total (2 new atoms
riding a 5-person PRIOR-reuse paradigm across ten lessons — closer to
m25's 2-atom floor scaled up, same as m27's own floor language). Put
≥1 recall in L2, L3, L5, L6, L7, L9 and ≥2 in L8/L10.

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m28-placement.yaml` (same shape as
   `m27-placement.yaml`: a `screener` entry + 3–4 `byModule` entries, all
   PRIOR/new-atom words, grep-verified, spanning both new atoms plus at
   least one PRIOR infinitive from the complement pool).
3. `zsh docs/es-ir-sources/assemble-mod.sh m28` → `src/features/languages/es/curriculum/ir/m28.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m28` (no `--check`) → writes
   `src/features/languages/es/curriculum/m28.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m27 m28 "Voy a nadar mañana" "Module 28 · Voy a nadar mañana" "the near future — «voy a, vas a, va a, vamos a, van a» plus any infinitive you already know, turning the same «voy» that gets you to the beach into the verb that gets you to tomorrow." "#22c55e" "#15803d"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m27.test.ts` → `curriculum/m28.test.ts`; replace `m27`
   → `m28`, `M27` → `M28`; rewrite the bespoke-pins block for THIS module
   (no weather-word pins apply — E7/E12 status unchanged, but this
   module needs its OWN new pins):
   - **NEW "no morphological future" pin** — grep every lesson's JSON
     blob (including `tiles:`/`distractors:`/`options:`/`goal:` arrays,
     not just prose) for "iré", "irás", "irá", "iremos", "irán"; fail if
     any appears anywhere.
   - **NEW "no object pronoun attachment" pin** — grep for «lo»/«la»
     immediately before a conjugated ir-present form, or immediately
     suffixed onto any bare infinitive (e.g. "comprarlo", "verla"); fail
     if found.
   - **NEW "va never conflated with iba/fue" pin** — verify every
     answer-position use of «va» is glossed present-tense ("goes/is
     going") and never appears interchangeably with «iba»/«fue» inside
     the SAME sentence's tense frame (L9's contrast lesson is the one
     place multiple ir-tenses may coexist — verify each clause is
     internally tense-consistent there specifically).
   - **NEW "voy a + place vs voy a + infinitive disambiguation" pin** —
     for every sentence containing "voy a"/"vas a"/"va a"/"vamos a"/"van
     a", verify the immediately following token is either a grep-
     confirmed PRIOR place noun OR one of the 19 grep-confirmed PRIOR
     bare infinitives (see PRIOR list above) — fail on anything else.
   - **NEW "no de niños plural, sim NPC lines included" pin** — grep
     every lesson's FULL JSON blob, including `npc:` sim dialogue lines
     specifically (not just tiles/distractors/options), for "de niños";
     fail if found anywhere. This is the class of bug the 11:17 ledger
     entry flagged as recurring — this module's test file is the first
     one written with the pin covering NPC lines explicitly; if it
     catches something, that is itself worth a line in your report.
   - **CARRY "no new emoji" pin** — grep this module's own `m28.ts` for
     any `emoji:` field tied to a NEW atom of this module (there
     shouldn't be one at all — «ir»/«va» never take an `emoji:` field);
     fail if either does.
   - «cuando» vs «¿cuándo?» never confused, «porque»/«por eso» spelling
     discipline (this module doesn't own those atoms but may exercise
     them via recall), no cloze blank inside a question, marker/tense
     agreement per clause — mechanisms unchanged from m21–m27.
8. `npx vitest run src/features/languages/es/curriculum/m28.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m27's step 10, plus specifically: any
    accidental morphological-future form, any object-pronoun attachment,
    any «voy a» + [ambiguous token] sentence, any «va»/«iba»/«fue»
    conflation, any «de niños» (or any other unregistered surface) in a
    sim `npc:` line specifically, any «voy a ir» outside L10.
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m28.test.ts` — final green.

### Vocab card art — NONE required this module (CLAUDE.md's invariant, confirmed no-op)
Both new atoms («ir», «va») are grammar/verb-morphology words with no
emoji field, matching every PRIOR verb-morphology atom in this course
(voy/vas/vamos/van included). No vendoring step applies. Confirm this
stays true at ship time — if a drafting or reviewing agent adds an emoji
to either atom, that's a defect, not a feature; revert it (see hard rule
11).

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m26-brief.md`/`es-m27-brief.md`'s checklist, `m27`→`m28`
throughout: (1) `curriculum/index.ts` import/meta/map, (2)
`courseAtoms.ts` union, (3) `courseAtoms.ts` `getEsCourseAtoms()` spread,
(4) `grammarHelpers.ts` `ES_MODULE_ORDER`, (5) `placementBank.ts`, (6)
`m28.test.ts` (hand-written, step 7 above), (7) every `newAtoms` surface
literally used in `m28.ts` (`registerEsAtomUsagePin`). Also confirm
`es-quality.test.ts`'s `ES_M28_CHECKPOINT_INDEX` entry landed (script adds
it, easy to forget verifying) — **naming convention now confirmed
identically across FOUR consecutive modules (`ES_M24_CHECKPOINT_INDEX`
through `ES_M27_CHECKPOINT_INDEX`, verified live in
`curriculum/es-quality.test.ts` at the time this brief was written), so
this is a much stronger inference than m27's own brief could make — but
still an inference by pattern-match, not a re-derivation of
`register-mod.py`'s literal string; flag if it doesn't match.** Before
starting any of this, re-check that m27's own 7 registration points are
actually in place — this brief's "m27 status note" above only confirmed
the files exist on disk and are grep-clean of the known m26/m27 defects,
not that a reviewer pass hasn't since touched them.

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **The periphrastic near future, «ir a + infinitivo», not object
  pronouns, not a second lexicon module, not a third consolidation
  module, not a bare one-line «ir» registration.** All four were live
  going into this brief. Closing the three-times-recorded «ir»-infinitive
  follow-on inside real grammar content is the sharpest, most overdue
  item on the table, and it directly serves CLAUDE.md's "reason through"
  aim by giving the course a genuinely new sentence-building capability —
  it also functions as the correct interleave beat after m27's vocab
  break (grammar, not another break-in-kind). Full reasoning in the
  header's "WHY THIS MODULE, NOW" and four "REJECTED ALTERNATIVE"
  sections.
- **Two new atoms, not more.** «ir» (the infinitive) and «va» (the
  missing 3rd-person present, previously foil-only) are the only gaps;
  the entire complement slot (19 bare infinitives, m10–m15) and the rest
  of the ir-present paradigm (voy/vas m9, vamos/van m18) are PRIOR. A
  thin newAtoms count precedented directly by m25's 2-atom causal-
  connective module — [[drafting-coverage-not-volume]] argues for
  leaning on PRIOR reuse over minting new surfaces when the PRIOR set
  already covers the content.
- **No morphological future tense.** «iré»/«irás»/etc. are real and more
  idiomatic for some uses, but are a SEPARATE new-verb-paradigm module's
  worth of content (20 new atoms, full person ladder, likely irregular
  stems for common verbs) — conflating it with the periphrastic near
  future in one module would blow the atom budget the same way m26's
  header ruled against an eight-verb imperfect module. Left as a
  clearly-shaped FUTURE module, not manufactured here.
- **Object pronouns deferred, not because they're not ready, but because
  this module gives them a better anchor.** Full reasoning in the
  header's "REJECTED ALTERNATIVE 1" — m28 itself is the thing that makes
  a future pronoun-placement module's contrast lesson possible («lo voy a
  comprar» vs «voy a comprarlo»).
- **Fresh accent colour: `#22c55e` → `#15803d` ("go" green).** Checked
  every `accent:` pair in `curriculum/index.ts` (grep-verified none of
  m1–m27 use these exact values) against all 27 modules' pairs, including
  three PRIOR greens at different hex values. Thematically apt (green =
  "go") and distinct at a glance from all PRIOR greens.
- **Sim NPC lines get an explicit, named ban + manual-grep instruction**
  for the «de niños»-class bug (see "SIM NPC LINES" section), even though
  it isn't thematically connected to this module's own content — recorded
  as a recurring pattern (m26, m27) with an OPEN gate gap per the
  overnight ledger's 11:17 entry, and the fix (a pin covering sim `npc:`
  lines) has NOT landed. Rather than parking this as someone else's
  problem, this brief bans the specific recurring surface again AND
  instructs manual verification, AND tells the drafting/reviewing agents
  to escalate if it recurs a third time.

## Claims marked UNVERIFIED (could not confirm from code, flag to drafting agents)
- **«este fin de semana» (a fresh combination of two independently-PRIOR
  words, «este» m12 and «el fin de semana» m19) has never appeared
  verbatim in the course.** Each word is individually grep-confirmed
  PRIOR; the combined phrase is not, because no prior module has needed
  it. Treat this as almost certainly fine (every module in this lineage
  freely combines independently-PRIOR words — this is not a new-atom
  question), but a drafting agent should still grep for the literal
  string before relying on it appearing correctly gendered/placed, since
  it's the L10 table's own suggested marker.
- **«otra vez» (again) is NOT grep-verified as PRIOR** — the L9 table's
  first-drafted win line used it and the table itself flags a safer
  default with the word dropped. Do not use «otra vez» in any lesson
  without grep-confirming it first — treat it as NOT PRIOR by default.
- **Whether `es-quality.test.ts`'s `ES_M28_CHECKPOINT_INDEX` naming holds
  without deviation** — now confirmed identically across FOUR consecutive
  modules (m24–m27) at the time this brief was written, the strongest
  version of this inference any brief in this lineage has had, but still
  not an independent re-derivation of `register-mod.py`'s literal
  string-substitution behavior beyond the `edit()` calls shown in that
  script.
- **The exact current content of `m27-L*.yaml` fragments and `m27.ts` at
  the moment a drafting agent starts on m28** — this brief was written
  against a snapshot where m27 was reported committed (d2d91a22) and
  reviewed (0be21768), and this brief's own greps found the fragments
  clean of the known m26/m27 defects, but that re-grep was not exhaustive
  beyond the specific surfaces this brief was checking for. Re-grep every
  m27-sourced surface before using it if drafting begins much later than
  this brief was written.
- **Whether the automated UNREGISTERED-surface scan's blind spot for sim
  `npc:` lines (per the 11:17 ledger entry) has been fixed by the time you
  draft this module** — as of this brief's writing it had NOT been fixed;
  if it has been fixed in the meantime, the manual-grep instruction in
  "SIM NPC LINES" above becomes a belt-and-suspenders redundancy, not a
  load-bearing requirement — harmless either way, but worth noting in
  your report if you find the automated scan now catches it.
