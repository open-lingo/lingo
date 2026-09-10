# ES m29 «Quiero verlo» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m29-L<n>.yaml` files.

**Worktree note:** this brief may be drafted from a git worktree, not the
main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh` all
default to the MAIN checkout path if `LINGO_ROOT` is unset — in a worktree
that silently writes to the wrong tree. Before running ANY script below:
`export LINGO_ROOT=$PWD` (from the repo root of whichever checkout you are
actually in).

**m28 status note:** this brief was researched and written from a
worktree that only READ the tree — m28 ("Voy a nadar mañana")'s exact
committed state was NOT re-verified beyond `git log --oneline -1 a7c73c1b`
(present, matches the commit m28's own brief expected) and `git status`
(clean for every `m28*` path at the time of writing; the only dirty files
in this worktree belong to a concurrent reviewer touching `m22-L10`/
`m23-L10`/`m24-L10` fragments, `es-quality.test.ts`, `moduleBarGuards.ts`,
and unrelated fr/ja files — none of which this brief or its module touch).
Re-grep any m28-sourced surface before relying on it if you are drafting
more than a few hours after this brief was written.

## The decision this module resolves

`m16.ir.yaml`'s own header named this gap and handed it forward by name:
"NOTHING in this module attaches a pronoun to an infinitive («verlo»,
«comprarlo»)... Do not mention them. m17 may." `m17.ir.yaml` restated the
identical ban for ITS OWN pronouns («levantarme», «ducharte») and did not
resolve it either. `m28-header.yaml`'s REJECTED ALTERNATIVE 1 named it a
third time, calling it "the strongest m29 candidate." **m29 is that
module: the SECOND legal position for a pronoun the learner already
owns.** PRIOR direct-object «lo»/«la»/«los»/«las» (m16, "Lo veo") and
PRIOR reflexive «me»/«te»/«se» (m17, "Me levanto") have only ever sat
immediately before a conjugated verb. This module adds ONE new claim:
when that conjugated verb is followed by a bare infinitive (PRIOR
«quiero»/«puedo», m7/m14; PRIOR «voy a», m28), the pronoun may ALSO fuse
onto the end of that infinitive instead — «lo quiero ver» and «quiero
verlo» mean exactly the same thing, and a learner may use either.
**Correction to m28's own framing:** m28-header.yaml describes its
rejected object-pronoun alternative as "a genuinely NEW mechanic with no
PRIOR shape to lean on" — that undersells what's already shipped. Object
pronouns themselves are NOT new (m16/m17, both LIVE since 2026-09-09);
only the second POSITION is new. Full reasoning, the four rejected
alternatives, and the "no third position" rule are in `m29-header.yaml`'s
comment block — read it, it is not decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m29-header.yaml` — the module spine. READ FIRST. **This module registers
  ZERO new atoms** — every surface you print must be a PRIOR atom (m1–m28)
  or a function word; there is no `newAtoms` list to check surfaces
  against, which makes grepping PRIOR-hood BEFORE you print a word more
  important here than in any prior module, not less.
- Exemplars (copy shape, note the differences called out below):
  `m16.ts` directly — no `m16-L*.yaml` fragments remain on disk (same
  hedge m28's own brief used for m9: read the compiled module, not a
  fragment) — for the pre-verbal debut tone and the «lo» function-word
  intro-capable-step pattern you are now extending, not repeating;
  `m17-L7.yaml` (the "me quiero levantar" modal+reflexive lesson — the
  closest PRIOR shape to this module's L4/L7, and the exact lesson whose
  own prose already says "the pointer never sits between the two verbs,"
  language you should reuse almost verbatim for hard rule 4 below);
  `m24-L1.yaml` (a modal-plus-bare-infinitive complement lesson — the
  "conjugated verb, then an untouched infinitive" shape this module fuses
  a pronoun onto); `m28-L1.yaml` through `m28-L10.yaml` (all ten present on
  disk — the «voy a + infinitivo» host construction your L6/L7/L10 recombine
  against; read `m28-L9.yaml` particularly, its own syntactic (not tense)
  contrast-lesson shape is the direct template for this module's own L9);
  `m21-L8.yaml`/`m22-L8.yaml`/…/`m28-L8.yaml` (checkpoint shape);
  `m22-L9.yaml`/`m24-L9.yaml`/`m26-L9.yaml`/`m28-L9.yaml` (contrast-lesson
  shape — m28-L9's is the closer template, a SYNTACTIC contrast, not a
  tense one, exactly this module's own L9 job); `m26-L10.yaml`/
  `m27-L10.yaml`/`m28-L10.yaml` (mastery, narrating a plan — READ THEIR
  HEADER COMMENTS on the SIM NPC LINES issue before you draft L10, even
  though the underlying gate has since closed, see below).
- Your output: `m29-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m29 <tag> docs/es-ir-sources/m29-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`. (Not runnable yet against the header
  alone — it needs `m29-placement.yaml` on disk too, written per pipeline
  step 2 below, before your first fragment can be checked.)
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (there are no new atoms this module — everything is PRIOR)
Every atom of m1–m28 is PRIOR. Grep to check a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..28}.ts | sort -u | grep -i "<word>"`.
**The pronouns this module places, all PRIOR, grep-verified:** «lo»
(m16, a function word — NOT `atom()`-registered, licensed via
`ES_FUNCTION_WORDS`, already debuted; grep `ir/m16.ir.yaml` if you want
the exact reasoning), «la»/«los»/«las» (m3/m4 as articles, m16 as
carriers reused without a noun), «me»/«te» (m13 particle atoms), «se»
(m17 particle atom). **The host verbs, all PRIOR:** «quiero»/«quieres»
(m7), «quiere» (m14), «puedo»/«puedes»/«puede» (m14), the bare
infinitives «querer»/«poder» (m14), and the full «ir a» paradigm
«voy»/«vas»/«va»/«vamos»/«van» + bare «ir» (m9/m18/m28). **The bare
infinitives you may fuse a pronoun onto — this is the exact same list
m28's own brief verified, do not add to it:** bailar, cantar, estudiar,
hablar, trabajar (m10); comer, correr, escribir, leer, vivir (m11);
comprar (m12); cocinar, nadar, viajar (m13); dormir (m14); salir, tener,
ver, hacer (m15); PLUS the m17-registered NON-reflexive bare forms
levantar, duchar, despertar, acostar, lavar, peinar (m17 L7 — printed
inside a sentence as the bare verb; their «-se» dictionary-name atoms
«levantarse»/«ducharse»/«despertarse»/«acostarse»/«lavarse»/«peinarse»
remain NAME-ONLY per m17's own rule and must NEVER appear inside a
sentence here either — fusing the pronoun onto the BARE form, e.g.
«levantarme», is what makes the dictionary-name distinction moot: you are
never printing «levantarse» + a pronoun, you are printing «levantar» +
«me»). **PRIOR time/frame markers:** mañana (m8), hoy, el fin de semana
(m19), este/esta (m12). **PRIOR connectives, both toolkits:** cuando,
mientras, de repente, entonces (m23); porque, por eso (m25). **PRIOR
narrative glue:** pero (m6), también (m11), juntos (m18). Function words
as in m21–m28 briefs. Fixed cast only: Ana, Diego, Sofía, María, Carmen,
Sam, Luis. Never invent a name or place beyond España/México.
**Explicitly NOT PRIOR — do not use even though they'd be tempting:**
«rápido»/«despacio» (per `authoring-rules.md`, an intentional NPC-line
exposure device, never a graded-answer word), «temprano», «otra vez»,
«mucho» — none of these are grep-confirmed `atom()` hits; if you want one,
grep it first and flag the result, don't assume.

### What this module does NOT teach
- **No indirect-object clitics («le»/«les»).** Real Spanish, deliberately
  deferred — introducing them alongside direct-object/reflexive clitics
  risks leísmo confusion this course has never had to navigate; reserve
  for a future module that can give «le»/«les» the dedicated care m16 gave
  «lo»/«la»/«los»/«las».
- **No double-pronoun stacks** («dármelo», "give it to me"). Exactly ONE
  pronoun fuses onto exactly ONE infinitive in every sentence this module
  builds. A stacked pronoun is a strictly harder claim (also usually
  forces a written accent) and is out of scope.
- **No «irse»** (reflexive "to leave/go away"). Only the bare infinitive
  «ir» is registered (m28); «irse» is a different, unregistered verb. Do
  not reach for it even though a reflexive-fused L10 sentence might make
  it tempting ("quiero irme").
- **No new question word, no subjunctive, no morphological future** — same
  discipline as m25–m28; this module adds no new sentence-opening
  machinery, only a placement option inside sentences shaped exactly like
  ones the course already builds.
- **No progressive («estar + gerundio»).** Unrelated mechanic, its own
  future module (see header's REJECTED ALTERNATIVE 3) — do not let a
  drafting agent reach for "-ando"/"-iendo" here.

## The "no third position" rule — read before drafting ANY lesson
«lo quiero ver» (pre-verbal, PRIOR shape) and «quiero verlo» (fused,
this module's new claim) are BOTH correct and mean exactly the same
thing. What is NOT correct, and never taught, is a pronoun sitting
BETWEEN the two verbs: **«\*quiero lo ver» is wrong** — not untaught-but-
plausible, actually ungrammatical, the same class of error the course
already refuses to manufacture for morphological futures or pronoun-
fused-infinitives-without-a-modal (m16/m17's own bans). Every
discrimination step in this module (agreementCloze / textMcq distractors)
must include this exact mid-position foil, not only a gender/number foil
or a wrong-pronoun foil — the third-position foil is this module's most
important distractor, more load-bearing than any other, because it is the
one wrong answer a learner is likely to construct by analogy from English
word order ("I want it to see" → "*quiero lo ver").

## Step kinds
Same vocabulary as m21–m28 (map, info, speakLit, buildLit,
listenBuildLit, listenCompLit, clozeLit, agreementLit, mcq/textMcq/
imageMcq/audioWimcq, matchLit, sim) — see `m17-L7.yaml`'s modal+reflexive
steps and `m24-L1.yaml`'s modal+infinitive steps for the closest PRIOR
mechanics. **NO imageMcq for the rule's own debut** — there is no new
atom to picture; introduce the second position via `info` (the two-
sentence contrast) then `buildLit` (assemble the fused form from tiles)
then `listenCompLit`, matching the non-concrete-content-word rubric
(§13.1) even though nothing here is a grammar-morphology ATOM either —
it's a placement rule, an even more abstract category, so the same "no
image debut" logic applies a fortiori. `imageMcq` on a PRIOR noun inside
a sentence (e.g. "el libro" as the antecedent for "lo") is fine and
encouraged — it's testing the PRIOR noun, not the rule. Every lesson ends
sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. **No automatic atom-debut gate applies here (0 new atoms) — this
   module's own test file must hand-enforce intro-before-graded for the
   fused form itself.** The shared `moduleConformance`-style "intro
   before review" machinery is keyed on `newAtoms`; a fused string like
   «verlo» is not a new atom, so nothing automatically stops a drafting
   agent from using it as a graded answer before L1's own debut step.
   Write a bespoke pin in `m29.test.ts` (step 7 below) that greps for any
   answer-position fused form and fails if it appears before the debut
   step's own position in the lesson-blob ordering, the same self-
   discipline m16's own header applied to the unregistered function word
   «lo».
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a
   PRIOR noun with its emoji (pull from any earlier module — this module
   owns no nouns of its own).
3. **Glosses: the fused form and the pre-verbal form gloss IDENTICALLY.**
   Never imply the two positions differ in meaning, formality, or
   correctness — both are simultaneously, unconditionally valid; the only
   thing that must agree is gender/number/person with whatever the
   pronoun replaces. The reflexive dictionary-name atoms («levantarse»
   etc., m17) stay NAME-ONLY on a card; inside any sentence here the bare
   verb is «levantar» etc. (m17 L7) plus the fused pronoun — never print
   «levantarse» + a pronoun anywhere.
4. **No third position.** Grep every lesson's JSON blob (prose, `tiles:`,
   `distractors:`, `options:`, sim `npc:` lines included) for a pronoun
   token (lo/la/los/las/me/te/se) appearing between a conjugated
   quiero/quieres/quiere/puedo/puedes/puede/voy/vas/va/vamos/van form and
   its infinitive complement — fail if found anywhere, foil or answer
   (foils in a discrimination step are the ONE place this exact string
   legitimately appears, as the wrong option itself — never as a
   `correct`/answer position).
5. **No indirect-object clitics.** Grep for «le»/«les» in any pronoun-
   object role; fail if found.
6. **No double-pronoun stacks, no accent-needing fused forms.** Exactly
   one pronoun per fused infinitive; none of this module's legal fused
   forms (verlo/verla/verlos/verlas, comprarlo/…, hacerlo/…, tenerlo/…,
   levantarme/te/se, ducharme/te/se, despertarme/te/se, acostarme/te/se,
   lavarme/te/se, peinarme/te/se, and the m10–m13 infinitives similarly
   fused) needs a written accent — if a drafting agent produces one that
   does, that fused form does not belong in this module.
7. **No «irse».** Grep for it; fail if found — only bare «ir» is
   registered (m28).
8. **L9 contrasts pre-verbal vs fused as a SYNTACTIC pair, never a tense
   pair, never a right/wrong pair.** Same restriction shape m28's own L9
   carried for its "voy a + place vs voy a + infinitive" contrast: no
   third structure competes, and every sentence pair must be
   person/gender/number-matched so pronoun POSITION is the only variable
   between the two members of the pair.
9. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
10. Sim distractors wrong by position (offering the third/banned slot) or
    by gender/number/person mismatch on the pronoun, never nonsense
    (m21–m28 rule, unchanged).
11. **No new emoji this module (0 new atoms).** Any emoji this module's
    lessons show belongs to a PRIOR noun already vendored under
    `src/pub/noto-emoji/svg/`; no new vendoring step applies.

## SIM NPC lines — the provenance gate is now LIVE, not an open gap
Unlike m28's brief (written when this was still an OPEN item),
`docs/es-ir-sources/authoring-rules.md`'s dialogue_sim rule is confirmed
LIVE as of this brief (`es-quality.test.ts` → describe("ES quality —
dialogue_sim content resolves to registered atoms"), grep-confirmed
present at the time of writing). Every NPC line — not just graded
replies — must resolve to PRIOR atoms/function words. The nuance specific
to THIS module: a fused form like «verlo» or «levantarme» is not itself a
registered surface (there is no atom named "verlo") — the gate must
decompose it back to its PRIOR bare-infinitive + PRIOR-pronoun parts to
license it. **Verify this decomposition by hand on every sim line before
shipping** — do not assume the live gate's decomposition logic covers a
fused form correctly just because it covers whole-word PRIOR surfaces;
this is the first module to actually exercise that path. If the gate
mis-fires on a legitimate fused form (false rejection) or, worse, passes
an illegal third-position string because it only pattern-matches known
suffixes, flag it explicitly in your report — this is genuinely new
ground for that gate. Also carry forward the still-relevant part of
m28's own instruction: **manually grep every sim `npc:` line**, not just
graded answer positions, the same discipline the live gate itself now
enforces but that a human pass should still double-check.

## Usage-note budget (this module's equivalent of a grammar rule card)
Budget ≤3 lines (per CLAUDE.md's explanation budget) for L1's `info` step,
putting the pre-verbal and fused forms side by side and naming the "never
between the two verbs" rule in the same breath. Suggested shape (adapt,
don't invent a longer one):
> «lo»/«la»/«los»/«las» (m16) and «me»/«te»/«se» (m17) have always gone
> right before the verb. When a second verb is right there with a bare
> infinitive — «quiero», «puedo», «voy a» — that same word can ALSO ride
> along at the end instead: «lo quiero ver» and «quiero verlo» mean
> exactly the same thing. It never sits between the two verbs.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | Rule content owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Quiero verlo | second-position debut on yo, direct object «lo», against «querer»; recap m16 pre-verbal as already-known | quiero (m7), lo (m16), comprar (m12) | «quiero comprarlo mañana» |
| 2 | ¿Puedes comprarla? | tú-form; «la»; fused extended to «poder»; ≥1 recall | puedes (m14), la (m3/m16), comprar (m12) | «¿puedes comprarla mañana?» |
| 3 | Ana puede comprarlos | 3rd person; «los»/«las»; ≥1 recall | puede (m14), los/las (m4/m16), comprar (m12) | «Ana puede comprarlos hoy» |
| 4 | No quiero levantarme | reflexive «me» fused onto a PRIOR m17 bare verb; pairs directly with m17-L7; ≥1 recall | quiero (m7), levantar (m17 L7), me (m13/m17) | «no quiero levantarme» |
| 5 | Diego puede ducharse | reflexive «se», 3rd person; full pronoun set now fused at least once each; ≥1 recall | puede (m14), duchar (m17 L7), se (m17) | «Diego puede ducharse» |
| 6 | Voy a hacerlo | recombination — direct object fused onto PRIOR m28 «voy a»; ≥1 recall | voy a (m28), hacer (m15), lo (m16) | «voy a hacerlo mañana» |
| 7 | Mañana voy a levantarme | recombination — reflexive fused onto PRIOR m28 «voy a»; discrimination against the third-position foil begins in earnest; ≥1 recall | voy a (m28), levantar (m17 L7), me | «mañana voy a levantarme» |
| 8 | Checkpoint | graded only, both pronoun families × both host-verb families × both positions, third-position foils throughout; ≥2 recalls | quiero, puedo, levantar, hacer, pero | «no quiero levantarme, pero puedo hacerlo» |
| 9 | Lo quiero ver, quiero verlo | every legal pair side by side; pre-verbal vs fused SYNTACTIC contrast (hard rule 8), never a tense contrast; ≥1 recall | lo, puede, comprar, también (m11) | «Ana lo puede comprar, y yo puedo comprarlo también» |
| 10 | Mastery | Ana asks the group about the weekend; longest sim, mixes ir a + reflexive-fused and ir a + object-fused; no info; ≥2 recalls, ≥1 PRIOR m23/m25 connective | este fin de semana (m12/m19), voy a (m28), ver (m15), los (m4/m16) | «este fin de semana voy a verlos» |

Every content word above not already flagged PRIOR in this brief is
grep-confirmed against m1–m28 by the method above. Recalls: L3+ may
recall L1/L2; L6+ may recall L1–L5; floor ≥5 recalls total. Put ≥1 recall
in L2, L3, L5, L6, L7, L9 and ≥2 in L8/L10.

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m29-placement.yaml` (same shape as
   `m28-placement.yaml`: a `screener` entry + 3–4 `byModule` entries).
   **Note the difference from every PRIOR module's placement file: there
   is no new atom to anchor a `byModule` entry on** — every entry here
   tests the PLACEMENT RULE itself (a pre-verbal vs fused pair, or a
   third-position distractor), not a new-vocabulary recognition check.
   Model each `byModule` prompt as an English sentence whose Spanish
   translation is ambiguous only in PRONOUN POSITION, with a
   third-position string as one of the `distractors`.
3. `zsh docs/es-ir-sources/assemble-mod.sh m29` → `src/features/languages/es/curriculum/ir/m29.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m29` (no `--check`) → writes
   `src/features/languages/es/curriculum/m29.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m28 m29 "Quiero verlo" "Module 29 · The pointer's second home" "the same short word — lo, la, los, las, me, te, se — that always went before the verb can now ride along at the end of an infinitive: «lo quiero ver» and «quiero verlo» are both correct, and you get to choose." "#64748b" "#334155"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m28.test.ts` → `curriculum/m29.test.ts`; replace `m28`
   → `m29`, `M28` → `M29`; **strip every m28-specific pin (no
   morphological-future ban, no «voy a» place/infinitive ambiguity pin —
   those are m28's own claims, not this module's) and rewrite the
   bespoke-pins block for THIS module**:
   - **NEW "intro before any fused-form answer" pin** — the hand-built
     substitute for the atom-keyed gate that doesn't apply here (hard
     rule 1): locate L1's debut step's position in the lesson-blob
     ordering; fail if any earlier-ordered step (there shouldn't be one,
     since L1 is first, but a future module copying this file will need
     the same check re-derived for its own debut point) or any step
     before L1's own debut sub-step uses a fused form as a `correct`/
     answer position.
   - **NEW "no third position" pin** — grep every lesson's FULL JSON blob
     (prose, `tiles:`, `distractors:`, `options:`, sim `npc:` lines) for a
     pronoun token (lo|la|los|las|me|te|se) appearing between a
     conjugated quiero/quieres/quiere/puedo/puedes/puede/voy/vas/va/
     vamos/van and its infinitive; if found in an answer/`correct`
     position, fail; if found only as a labeled `distractor`/foil, that's
     expected and should PASS (don't accidentally ban the very foil hard
     rule 4 requires).
   - **NEW "fused and pre-verbal gloss identically" pin** — for any
     sentence pair this module explicitly contrasts (L9 especially),
     verify the English gloss string is IDENTICAL between the pre-verbal
     and fused member of the pair.
   - **NEW "no «irse», no indirect-object le/les, no double-pronoun
     stack" pin** — grep for all three; fail if any appears anywhere.
   - **NEW "reflexive dictionary-name atoms are name-only" pin** —
     inherited unchanged from `m17.test.ts`'s own equivalent pin, but
     re-verify it here too since this module is the first to print the
     BARE reflexive-family infinitives (levantar/duchar/despertar/
     acostar/lavar/peinar) inside sentences at real volume: grep for
     «levantarse»/«ducharse»/«despertarse»/«acostarse»/«lavarse»/
     «peinarse» anywhere OUTSIDE a card/name context; fail if found
     inside a sentence.
   - **CARRY "no new emoji" pin** — grep this module's own `m29.ts` for
     any `emoji:` field (there shouldn't be one — 0 new atoms means no
     vocab cards at all); fail if one exists.
   - «cuando» vs «¿cuándo?», «porque»/«por eso» spelling discipline,
     marker/tense agreement per clause — mechanisms unchanged from
     m21–m28, exercised here only via recall (this module owns none of
     those atoms).
8. `npx vitest run src/features/languages/es/curriculum/m29.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m28's step 10, plus specifically: any
    third-position string in an answer/`correct` slot, any «irse»/le/les/
    double-pronoun stack, any bare reflexive dictionary-name atom printed
    inside a sentence, any fused form used before L1's own debut step, any
    gloss mismatch between a contrasted pre-verbal/fused pair.
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m29.test.ts` — final green.

### Vocab card art — NONE required this module (CLAUDE.md's invariant, confirmed no-op)
Zero new atoms means zero new vocab cards. Every emoji shown anywhere in
this module belongs to a PRIOR noun and is already vendored. No
vendoring step applies. Confirm this stays true at ship time — if a
drafting or reviewing agent adds an `emoji:` field to anything in
`m29.ts`, that's a defect (see hard rule 11); revert it.

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m27-brief.md`/`es-m28-brief.md`'s checklist, `m28`→`m29`
throughout: (1) `curriculum/index.ts` import/meta/map, (2)
`courseAtoms.ts` union, (3) `courseAtoms.ts` `getEsCourseAtoms()` spread,
(4) `grammarHelpers.ts` `ES_MODULE_ORDER`, (5) `placementBank.ts`, (6)
`m29.test.ts` (hand-written, step 7 above), (7) every `newAtoms` surface
literally used in `m29.ts` (`registerEsAtomUsagePin`) — **this point is
VACUOUS for m29 specifically**: `newAtoms: []`, so there is nothing for
that pin to check. Do not skip verifying it runs and passes trivially;
do treat a NON-trivial result (the pin finding something to check) as a
sign `m29-header.yaml`'s `newAtoms:` list was edited since this brief was
written — re-read the header before proceeding if that happens. Also
confirm `es-quality.test.ts`'s `ES_M29_CHECKPOINT_INDEX` entry landed
(script adds it, easy to forget verifying) — naming convention confirmed
live for `ES_M28_CHECKPOINT_INDEX` at the time this brief was written
(grep-verified present at `curriculum/es-quality.test.ts` lines 59/104),
so this is a reasonable inference by pattern-match, not a re-derivation
of `register-mod.py`'s literal string — flag if it doesn't match. Before
starting any of this, re-check that m28's own 7 registration points are
actually in place — this brief's "m28 status note" above only confirmed
the commit and a clean `git status`, not that a reviewer pass hasn't
since touched them.

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **The second clitic position (fused-infinitive attachment), not a
  lexicon break, not «tener que», not «estar + gerundio», not
  comparatives.** This is the third time the course's own authoring
  lineage has named this exact gap (m16 → "m17 may", m17 declined too,
  m28's REJECTED ALTERNATIVE 1 named m29 explicitly) — the strongest
  "resolve it now" signal of any open item in this course's history.
  Full reasoning and all four rejected alternatives are in
  `m29-header.yaml`'s "WHY THIS MODULE, NOW" section.
- **Zero new atoms — a thinner count than any PRIOR module (m25/m28 each
  had 2).** Every surface this module needs — both pronoun families, both
  host-verb families, every complement infinitive — is PRIOR. This is a
  placement RULE over existing vocabulary, not a vocabulary module, the
  logical extreme of [[drafting-coverage-not-volume]]. Verified no test
  or script in this pipeline assumes a nonempty `newAtoms`/`ATOMS` array
  before committing to this count.
- **Correcting m28's own brief, not silently deferring to it.** m28's
  REJECTED ALTERNATIVE 1 called object-pronoun placement "a genuinely NEW
  mechanic with no PRIOR shape to lean on" — inaccurate as of m29, since
  m16/m17 already shipped the pronouns themselves. This brief names the
  correction explicitly rather than repeating the stale framing, per the
  instruction to evaluate that claim honestly rather than accept it at
  face value.
- **Grammar-for-grammar back-to-back with m28, not a third break.**
  m26 (grammar) → m27 (break) → m28 (grammar) → m29 (grammar) puts two
  grammar modules in a row for the first time since the interleave
  discipline was named explicitly at m28. Weighed deliberately, not
  silently: m28 taught verb periphrasis (a new way to build a
  tense-like meaning), m29 teaches pronoun syntax (where an already-known
  word may sit) — different grammatical subsystems that compose rather
  than repeat. A three-times-deferred, precisely-scoped, zero-new-
  vocabulary item outweighs rhythm-purity for its own sake; house
  vocabulary (the clean lexical gap m28 already identified) is named
  explicitly as m30, guaranteeing the very next module is the break this
  one declines to be.
- **Slate/steel accent (`#64748b`→`#334155`), deliberately non-thematic.**
  Grep-verified unused across all 28 PRIOR `accent:` pairs. Unlike m28's
  "go" green, this module teaches a placement rule with no single
  concrete referent to color-theme around — a neutral, structurally-cool
  color reads as "mechanism" rather than forcing a domain metaphor onto
  grammar.
- **The sim NPC-line gate is now load-bearing, not an open gap** — treated
  as CLOSED per `authoring-rules.md` and the live `es-quality.test.ts`
  describe block, correcting m28's brief (written while this was still
  open). The nuance specific to this module (decomposing a fused form
  back to its PRIOR parts) is flagged as genuinely untested ground for
  that gate, not assumed to work correctly by default.
- **No indirect-object clitics, no double-pronoun stacks, no «irse».**
  All three are real, tempting, and deliberately out of scope — named
  explicitly with reasons (leísmo risk, accent-rule complexity, an
  unregistered second verb) rather than silently omitted, so a future
  module inherits the reasoning instead of re-deriving it.

## Claims marked UNVERIFIED (could not confirm from code, flag to drafting agents)
- **Whether `es-quality.test.ts`'s `ES_M29_CHECKPOINT_INDEX` naming holds
  without deviation.** Confirmed live for `ES_M28_CHECKPOINT_INDEX`
  (grep-verified at the time this brief was written) but that is still an
  inference by pattern-match across five consecutive modules
  (`ES_M24_CHECKPOINT_INDEX` through `ES_M28_CHECKPOINT_INDEX`), not an
  independent re-derivation of `register-mod.py`'s literal string
  substitution.
- **Whether the LIVE `dialogue_sim` provenance gate correctly decomposes a
  fused-infinitive form (e.g. «verlo») back to its PRIOR bare-infinitive +
  PRIOR-pronoun parts, or whether it only recognizes whole-word PRIOR
  surfaces.** This module is the first to exercise that path at volume;
  the gate's own decomposition logic was not read as part of this
  brief's research (only its existence and its `describe()` name were
  grep-confirmed). Verify by hand on every sim NPC line regardless of
  what the automated gate reports — a false pass here (an illegal
  third-position string slipping through because the gate only
  recognizes known suffixes) would be worse than a false rejection.
- **Whether «temprano», «rápido»/«despacio», «otra vez», or «mucho» are
  PRIOR.** Explicitly checked NOT `atom()`-registered by grep at the time
  of writing, and `authoring-rules.md` names «rápido»/«despacio»
  specifically as an intentional exposure-only NPC device, never a
  graded-answer word — treat all four as NOT PRIOR by default; the lesson
  plan table above was written to need none of them, but a drafting agent
  should re-grep before reaching for any of them anyway.
- **The exact current content of `m28-L*.yaml` fragments and `m28.ts` at
  the moment a drafting agent starts on m29.** This brief was written
  against a snapshot where m28 was reported committed (a7c73c1b) and
  `git status` clean for every `m28*` path, but that check was not
  exhaustive beyond confirming the files exist and the commit matches.
  Re-grep every m28-sourced surface before using it if drafting begins
  much later than this brief was written.
- **Whether zero new atoms causes any downstream script to behave
  unexpectedly beyond what was checked.** Grep-verified no test or
  `compile-ir-es.mjs` code path assumes a nonempty `newAtoms`/`ATOMS`
  array, but this was a targeted grep, not a full read of every script in
  the pipeline — if `assemble-mod.sh`, `register-mod.py`, or
  `gen-es-review-pool.mjs` misbehaves on an empty `newAtoms:` list, that
  is new information this brief could not anticipate; report it
  immediately rather than working around it silently.
