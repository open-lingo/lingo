# ES m27 «Hace sol, hace frío» — drafting brief for lesson agents

You are drafting ONE or TWO lessons of a ten-lesson Spanish module as IR YAML
fragments. Everything is mechanical and gate-checked; read this whole file,
then the exemplars, then draft, then run the checker until it says
`FRAGMENT OK`, then report. Do NOT edit anything outside your own
`m27-L<n>.yaml` files.

**Worktree note:** this brief may be drafted from a git worktree, not the
main checkout. `register-mod.py`, `check-frag.sh`, and `tts-chain.sh` all
default to the MAIN checkout path if `LINGO_ROOT` is unset — in a worktree
that silently writes to the wrong tree. Before running ANY script below:
`export LINGO_ROOT=$PWD` (from the repo root of whichever checkout you are
actually in).

**m26 status note:** this brief was researched and written from a
worktree that only READ the tree — m26 ("Vivía, comía, estudiaba")'s exact
committed/registered state was NOT re-verified beyond grepping its own
`m26.ts`, `m26-header.yaml`, and its 10 `m26-L*.yaml` fragments on disk
(all present). Re-grep any m26-sourced surface before relying on it if you
are drafting more than a few hours after this brief was written, and
confirm m26's own 7 registration points (see the m25/m26 briefs'
checklists) are actually in place before starting m27's.

## The decision this module resolves

Seven consecutive modules — m19, m21, m22, m23, m24, m25, m26 — shipped
**zero** new imageable nouns and zero new emoji (each module's own header
says so explicitly, citing the same precedent). Every narrative sentence
since m19 recombines the same ~10 PRIOR places-with-emoji (la fiesta, el
cine, la playa, la escuela, el trabajo, casa, el parque, el museo, el
mercado, la tienda) under new grammar. **m27 closes that gap: seven new
weather words — el sol, la lluvia, el viento, la nieve, nublado, el
calor, el frío — with ZERO new verb morphology.** Every sentence frame
this module needs is already registered: «hace»/«hacía» (m15/m24, reused
in the weather idiom «hace calor/frío»), «está»/«estaba» (m4/m24, reused
for a weather STATE, «está nublado»), «hay» (m3, «hay viento/nieve»),
«me gusta»/«te gusta» (m7/m13, «me gusta el sol»). This is also this
module's interleave break: an eighth/ninth/tenth-verb "wave 4"
(cocinar/escribir/comprar) directly off m26 would be the imperfect
mechanic four of the last five modules; a vocabulary module is a genuine
break in KIND, not just a different verb set. Full reasoning, the four
rejected alternatives, and the emoji-collision fix (🌞 not ☀️ for «el
sol» — see below) are in `m27-header.yaml`'s comment block — read it, it
is not decorative.

## Files (all under `docs/es-ir-sources/`, repo root `/Users/lichfield/Documents/projects/lingle/lingo` — or `$LINGO_ROOT` if you exported it)
- `m27-header.yaml` — the module spine + the 7 new atoms. READ FIRST. Every
  surface you print must be either a `newAtoms` surface, a PRIOR atom, or a
  function word.
- Exemplars (copy their shape exactly, but note this module's own
  DIFFERENCE below): `m20-L1.yaml`/`m20-L5.yaml` (the two most recent
  lessons using `imageMcq` debuts — copy the `imageMcq` step's exact
  fields from these, not from a grammar module); `m24-L1.yaml` (general
  opening-lesson shape, teaching-card placement — adapt for a lexical, not
  grammatical, general note, see "Usage-note budget" below);
  `m26-L6.yaml` (recombination lesson pairing new material against PRIOR
  imperfect — your L6's shape, but pairing weather nouns against PRIOR
  «hacía»/«estaba» instead of a new verb); `m25-L7.yaml` (negation without
  a question form — your L7's shape, same reason: this module has no
  taught question form either, see "What this module does NOT teach");
  `m21-L8.yaml`/`m22-L8.yaml`/`m23-L8.yaml`/`m24-L8.yaml`/`m25-L8.yaml`/
  `m26-L8.yaml` (checkpoint); `m22-L9.yaml`/`m24-L9.yaml`/`m26-L9.yaml`
  (a present-vs-past consolidation lesson — your L9's shape, contrasting
  «hace/hay/está» vs «hacía/había-style/estaba» for weather instead of a
  verb paradigm — see hard rule 6 for the exact restriction); `m26-L10.yaml`
  (mastery, narrating a memory — your L10's shape).
- Your output: `m27-L<n>.yaml`, one file per lesson, same indentation as the
  exemplars (starts with `  # ── L<n> ·` then `  - n: <n>`).
- Checker: `zsh docs/es-ir-sources/check-frag.sh m27 <tag> docs/es-ir-sources/m27-L<n>.yaml [more files]`
  — `<tag>` is your single digit (parallel agents don't collide). Fix every
  error and re-run until `FRAGMENT OK`.
- Sim-goal scan: no automated scanner — count by hand, every sim `goal:` ≤8
  words (a dash counts as a word).

## PRIOR vocabulary (besides the 7 new atoms)
Every atom of m1–m26 is PRIOR. Grep to check a word — do not trust a list:
`grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..26}.ts | sort -u | grep -i "<word>"`.
**The exact sentence-frame words this module leans on, all PRIOR, grep-
verified:** «hace» (m15, "he/she does/makes" — reused idiomatically for
weather: «hace calor», «hace frío»), «hacía»/«hacías»/«hacíamos»/«hacían»
(m24, imperfect — «hacía mucho frío de niño»), «está» (m4, "is
[somewhere]" — reused for a weather STATE: «está nublado», a semantic
EXTENSION beyond its registered location gloss, name this to drafting
agents, not a formal collision), «estamos»/«están» (m18), «estaba»/
«estabas»/«estábamos»/«estaban» (m24, imperfect — «estaba nublado»),
«hay» (m3, "there is/are" — «hay viento», «hay nieve», «hay sol»), «me
gusta»/«te gusta» (m7/m13, plus «gusta»/«gustan» — «me gusta el sol», «no
me gusta la lluvia»), «mucho» (m13 — «hacía mucho frío»), «un poco» (m10
— «un poco de sol»), «muy» (m6). **PRIOR connectives, BOTH toolkits, all
six legal from L1 here** (this module's own weather nouns are a natural
fit for both — see L6): cuando, mientras, de repente, entonces (m23) AND
porque, por eso (m25, causal). **PRIOR narrative verbs for the mastery
lesson (L10):** vivía/salía family (m26), fui/fuimos/vino family (m19–
m21), quería/podía (m24). **PRIOR time/frame markers, unchanged agreement
rule:** de niño/a/s (m22, imperfect clause only), siempre, todos los
días, ya, todavía (m16), ayer, anoche, la semana pasada, el mes pasado,
el fin de semana, hoy, mañana. **PRIOR places/nouns with emoji, still the
main narrative color besides this module's own new nouns:** la escuela
🏫, el parque 🌳, la playa 🏖️, el museo 🏛️, el cine 🎬, la fiesta 🎉, el
mercado 🛒, la tienda 🏪, casa 🏠, el trabajo 💼, restaurante (m18, no
emoji). **NOT PRIOR (zero hits, do not manufacture — see header's
decision section for why each is excluded):** «llueve», «nieva»,
«lloviendo», «nevando», «soleado», «el tiempo» (the weather-sense noun —
collides with an untaught "time" sense, not worth opening), any bare
«qué» outside the fixed `¿qué es?` (m3), «invierno»/«verano»/«primavera»/
«otoño» (seasons — fully data-ready, deliberately deferred, see header).
Function words as in m21–m26 briefs. Fixed cast only: Ana, Diego, Sofía,
María, Carmen, Sam, Luis. Never invent a name or place beyond España/
México.

## The «el sol» emoji trap — read before drafting L1
Do NOT use ☀️ for «el sol». It is already registered (m1/m2/m3/m4/m5/m7/
m10) as the DISTRACTOR emoji for «buenas tardes» in existing greeting-time
imageMcqs — reusing it for «el sol»'s own imageMcq would put the identical
glyph on two different correct answers across two modules, a real
ambiguity risk. «el sol» uses 🌞 (verified clean, distinct from PRIOR 🌅
«buenos días» and 🌙 «buenas noches»). The header's newAtoms block already
has this right — just don't "correct" it back to ☀️ because it looks like
the more obvious sun emoji.

### What this module does NOT teach
- **No impersonal weather verbs.** «llueve»/«nieva» (and their -ndo forms)
  are real Spanish but are NOT registered and NOT manufactured here — «la
  lluvia»/«la nieve» are taught as NOUNS instead, paired with PRIOR «hay».
  Pin E7 (no progressive) would ban the -ndo forms outright regardless.
- **No «¿qué tiempo hace?»** — needs a free-standing «qué», never
  registered (only the fixed `¿qué es?`, m3). Same exclusion logic as
  m25's «¿por qué?». This module has no question-word question form; L7
  is negation-only (see m25-L7's precedent).
- **No «soleado» (sunny, adjective).** Every candidate emoji for "sunny"
  (⛅, 🌤️) visually collides with «nublado»'s ☁️ in a 4-option imageMcq
  grid — the authoring guide's image-MCQ ceiling rule ("bad image is
  worse than no image," §13.2) argues against it. Use «hay sol» instead
  (PRIOR «hay» + this module's own «sol»).
- **No seasons** (invierno, verano, primavera, otoño). Fully data-ready,
  deliberately deferred to keep this module's debut room from thinning
  (see header's "WHICH SEVEN WORDS" section) — a natural future companion
  module, not this one's job.
- **No new verb morphology, no new tense, no progressive.** Zero new verb
  atoms. Pin E7 unchanged.
- **«el tiempo» is never exercised.** Real Spanish "the weather" is «el
  tiempo» — but «tiempo» has never been registered for "time" either, so
  teaching it here would be introducing a genuine, currently-latent
  homograph into the course for zero payoff (this module doesn't need a
  "what's the weather" question, see above). Stick to «hace»/«hay»/«está»
  + the seven new nouns/predicate.
- **«está nublado» is impersonal — never gendered/pluralized.** «nublado»
  never becomes «nublada»/«nublados» in this module; there is no subject
  noun for it to agree with. If a drafting agent reaches for gender
  agreement on «nublado», stop — it's wrong here.

## Step kinds
Same vocabulary as m21–m26 (map, info, speakLit, buildLit,
listenBuildLit, listenCompLit, clozeLit, agreementLit, mcq/textMcq/
imageMcq/audioWimcq, matchLit, sim) — see `m20-L1.yaml` for the exact
`imageMcq` fields, copy the shape, don't re-derive it. **imageMcq IS used
this module** — first new-emoji debut since m20 — lead each of the 7 new
atoms' first appearance with `imageMcq` before any other step touches it
(authoring guide §13.2: "the image IS the introduction"). Every lesson
ends sim → matchLit → `-sp-win` speakLit.

## Hard rules the gates enforce
1. Each of the 7 new atoms' first appearance must be `imageMcq` (the
   image-is-the-introduction pattern, §13.2) EXCEPT «nublado» (no clean
   solo image for a predicate adjective — intro via `info` + `buildLit`/
   `listenCompLit` instead, same as a non-concrete atom in the §13.1
   rubric); ≥3 answer positions at debut, reuse (≥1 answer position) in
   ≥2 later lessons. With 7 atoms across ten lessons, no atom may go quiet
   for more than 2 consecutive lessons after L5.
2. No two adjacent steps of the same kind. No sentence >3× in a lesson.
   Cloze ≤25% (≤⅓ in L8/L10). ≥1 audioWimcq per teaching lesson on a
   PRIOR noun with its emoji (this module's OWN new nouns satisfy this
   too, once past their own debut lesson).
3. Glosses: «el calor»/«el frío» must be glossed as the NOUN ("the heat"/
   "the cold"), never as a standalone adjective ("hot"/"cold" describing
   a person or object) — this module's «calor»/«frío» only ever appear in
   the «hace ___» weather idiom slot. «nublado» glosses as "cloudy," never
   "clouded" or any sense implying a physical object was covered. No
   internal `. ` `! ` `? ` inside a build `en`.
4. **No invented weather-verb forms.** Grep every lesson's JSON blob
   (including `tiles:`/`distractors:`/`options:` arrays — the automated
   `ILLEGAL_PRESENT_FORMS`-style scan only reads prose, per the class bug
   m24's and m26's Sonnet reviewers found, [[vocab-gate-blind-to-fragments]])
   for «llueve», «nieva», «lloviendo», «nevando», «soleado» — none may
   appear anywhere, foil or answer.
5. **No bare «qué».** Grep for a standalone "qué" token outside the fixed
   `¿qué es?` phrase; fail if found. Same discipline as m25's «por qué»/
   «por que»/«porqué» spelling-gate pin, adapted to this module's own
   exclusion.
6. **L9 contrasts PRESENT weather (hace/hay/está) vs PAST weather
   (hacía/estaba), same idiom, never preterite** — same restriction shape
   m22/m24/m26's own L9 carried for verb paradigms, adapted: there is no
   preterite weather form in this course to contrast against (hizo/
   estuvo exist as general PRIOR preterite but are not this module's
   idiom), so the contrast is purely present-idiom vs imperfect-idiom.
7. If a lesson pairs a weather noun with a PRIOR m23 connective (cuando/
   mientras/de repente/entonces) or m25's causal pair (porque/por eso —
   L6 especially), each connective must still obey its own rule (cuando
   → preterite clause; mientras → simultaneity; de repente → interruption;
   entonces → sequence; porque/por eso → no tense restriction on the
   connective itself, but each clause internally tense-consistent).
8. IDs: `l<n>-<kind-abbrev>-<slug>`; closing steps `l<n>-sim-<slug>`,
   `l<n>-match`, `l<n>-sp-win`. Recall license: only an EARLIER lesson's
   own `-sp-win` line, `cue: recall`, `atoms: []`.
9. Sim distractors wrong by weather-word swap (offering «frío» where
   «calor» fits the NPC's context, or vice versa) or by the wrong
   present/imperfect idiom for the stated time frame, never nonsense
   (m21–m26 rule, unchanged).
10. **imageMcq distractor pools must not include ☀️.** Since «el sol»
    uses 🌞 and ☀️ remains PRIOR («buenas tardes»), never place ☀️ in a
    weather-module distractor pool — it would silently imply a second
    "sun" option and confuse the intended contrast.

## Homograph / ambiguity risks (name these explicitly to drafting agents)
- **«está» (this module's weather-state use) vs its PRIOR location sense
  (m4).** Not a collision (no wrong-answer risk — «está nublado» is
  unambiguous in context), but a SEMANTIC EXTENSION drafting agents
  should name honestly in any usage note: the registered gloss is "is
  (somewhere)," this module reuses the same word for "is (in a weather
  state)." Do not claim in a card that this "is the same meaning."
- **«el calor»/«el frío» (nouns, this module) are never adjectives
  describing a person or object.** Spanish also uses «frío»/«fría» as an
  adjective ("cold water," "cold person") — NOT taught here, NOT this
  module's job. Keep both strictly inside the «hace ___»/«hacía ___»
  weather-idiom slot.
- **«el tiempo» is a live real-world homograph (weather/time) that this
  course simply never opens.** Not registered in either sense — do not
  reach for it as a synonym for "the weather" even though it's the most
  natural Spanish word for it; this module works entirely without it.
- **☀️ is PRIOR for «buenas tardes», not for anything sun-related.** See
  "The «el sol» emoji trap" section above — the single most likely
  drafting mistake in this module.
- **«nublado» never takes gender/number agreement in this module's use.**
  It is impersonal (no subject noun), unlike a normal predicate adjective
  such as «cansado/a» would be.

## Usage-note budget (this module's equivalent of a grammar rule card)
This module teaches vocabulary + idiom reuse, not new grammar — there is
no new conjugation or connective to state a rule for. Still budget ≤3
lines (per CLAUDE.md's explanation budget) for L1's `info` step,
explaining the «hace»/«hay»/«está» + weather-word PATTERN itself (a
genuinely new COLLOCATION, even though every word in it is independently
PRIOR or newly taught). Suggested shape (adapt, don't invent a longer
one):
> Spanish describes weather with words you already know: «hace» (m15) +
> heat/cold, «hay» (m3) + wind/snow, «está» (m4) + cloudy. «hace mucho
> calor» — it's very hot.

## Lesson plan and the guaranteed `-sp-win` sentence of each lesson

| L | Title | New atom(s) owned | Suggested PRIOR context | -sp-win (verbatim) |
|---|---|---|---|---|
| 1 | Hay sol | el sol; usage-note card here | hay (m3), me gusta (m7) | «hoy hay sol, y me gusta el sol» |
| 2 | No me gusta la lluvia | la lluvia; ≥1 recall (sol) | hay (m3), no (m1), me gusta/no me gusta | «hay lluvia hoy, y no me gusta la lluvia» |
| 3 | Hay viento y nieve | el viento, la nieve; ≥1 recall | hay (m3), mucho (m13) | «hay mucho viento, y también hay nieve» |
| 4 | Hace calor | el calor; the «hace ___» idiom debuts | hace (m15), mucho (m13) | «hace mucho calor hoy» |
| 5 | Hace frío | el frío; the calor/frío minimal pair; ≥1 recall | hace (m15), un poco (m10) | «no hace calor, hace un poco de frío» |
| 6 | Está nublado, por eso... | nublado; recombination — PRIOR «hacía»/«estaba» (m24) + PRIOR porque/por eso (m25) + m23 connectives; ≥2 recalls | hacía (m24), estaba (m24), porque, por eso | «estaba nublado, por eso no fuimos a la playa» |
| 7 | No hace calor, hace frío | none — negation across all 7 atoms (no question form this module); ≥1 recall | no (m1), pero (function word) | «no hace calor, hace frío, y no me gusta» |
| 8 | Checkpoint | graded only, all 7 atoms + L6's recombination recall; ≥2 recalls | hacía (m24), estaba (m24), porque, por eso | «de niño, siempre hacía mucho frío, por eso no salía mucho» |
| 9 | Hoy hace sol, pero de niño hacía frío | every atom side by side; present-idiom vs imperfect-idiom contrast (hard rule 6); ≥1 recall | de niño (m22), hoy, hacía (m24), estaba (m24) | «hoy hace sol y no hace frío, pero de niño siempre hacía mucho frío» |
| 10 | Mastery | Ana asks the group to compare today's weather to a childhood memory; longest sim; no info; ≥2 recalls, ≥1 PRIOR m23 connective, ≥1 PRIOR m25 connective | de niño (m22), vivía (m26), salía (m26), juntos, siempre | «de niño, vivíamos donde siempre hacía frío y nevaba — no, hacía mucho frío, y por eso salíamos poco» — CAUTION: «nevaba» is banned (see hard rule 4); the safer default is to drop that clause entirely and keep the win line to «de niño, vivíamos donde siempre hacía mucho frío, por eso salíamos poco» — verify «donde» is PRIOR before using it (UNVERIFIED, see below) |

Every content word above not already flagged PRIOR in this brief is
grep-confirmed against m1–m26 by the method above. **L10's suggested win
line as first drafted uses «nevaba» — struck through and replaced inline
above because hard rule 4 bans it; the safer replacement is named
explicitly. Do not draft the «nevaba» version.** Recalls: L3+ may recall
L1/L2; L6+ may recall L1–L5; floor ≥5 recalls total (7 atoms across ten
lessons, lighter grammar load than a 5-verb-family wave, closer to m25's
2-atom floor scaled up). Put ≥1 recall in L2, L3, L5, L6, L7, L9 and ≥2 in
L8/L10.

## What to report back
5 lines: file(s) written, `FRAGMENT OK` (paste the last checker line), step
count per lesson, cloze count, any rule you couldn't satisfy and why.

---

## Exact pipeline commands (run from the repo root; `export LINGO_ROOT=$PWD` first)

1. `export LINGO_ROOT=$PWD` — do this before anything else in a worktree.
2. Write `docs/es-ir-sources/m27-placement.yaml` (same shape as
   `m26-placement.yaml`: a `screener` entry + 3–4 `byModule` entries, all
   PRIOR/new-atom words, grep-verified, spanning multiple new nouns).
3. `zsh docs/es-ir-sources/assemble-mod.sh m27` → `src/features/languages/es/curriculum/ir/m27.ir.yaml`.
4. `node scripts/compile-ir-es.mjs m27` (no `--check`) → writes
   `src/features/languages/es/curriculum/m27.ts`. READ THE GENERATED FILE.
5. `python3 docs/es-ir-sources/register-mod.py m26 m27 "Hace sol, hace frío" "Module 27 · Hace sol, hace frío" "seven new weather words — sun, rain, wind, snow, cloudy, heat, cold — slotting into sentence patterns you already own: «hace», «hay», «está», now describing the sky instead of a place." "#eab308" "#a16207"`
6. `node scripts/gen-es-review-pool.mjs` — regenerate `esReviewPool.ts`.
7. Copy `curriculum/m26.test.ts` → `curriculum/m27.test.ts`; replace `m26`
   → `m27`, `M26` → `M27`; rewrite the bespoke-pins block for THIS module
   (this module has NO verb-paradigm pin, E12 does not apply — no new
   verb cells):
   - **NEW "no invented weather-verb forms" pin** — grep every lesson's
     JSON blob (including `tiles:`/`distractors:`/`options:`/`goal:`
     arrays, not just prose) for "llueve", "nieva", "lloviendo",
     "nevando", "soleado"; fail if any appears anywhere.
   - **NEW "no bare qué" pin** — grep for a standalone "qué" token outside
     the fixed `¿qué es?` substring; fail if found.
   - **NEW "el tiempo never appears" pin** — grep for "el tiempo"/"la
     tiempo" (either gender, in case a drafting agent mis-genders it);
     fail if found — this module never needs the word.
   - **NEW "calor/frío stay in the hace-idiom slot" pin** — verify every
     answer-position use of «calor»/«frío» appears adjacent to «hace» or
     «hacía» (not as a free adjective describing a different noun); fail
     any answer position where it doesn't.
   - **NEW "nublado stays impersonal" pin** — grep for "nublada",
     "nublados", "nubladas"; fail if any appears (the atom is invariable
     in this module's sole use).
   - **CARRY "no ☀️ in this module's imageMcq pools" pin** — grep this
     module's own `m27.ts` for the ☀️ glyph in any `imageMcq`/
     `audioWimcq` target or distractor entry tied to a NEW atom of this
     module; fail if found (☀️ stays exclusively PRIOR, «buenas tardes»).
   - «cuando» vs «¿cuándo?» never confused, «porque»/«por eso» spelling
     discipline (this module doesn't touch those atoms but may exercise
     them via recall), no cloze blank inside a question, marker/tense
     agreement per clause — mechanisms unchanged from m21–m26.
8. `npx vitest run src/features/languages/es/curriculum/m27.test.ts` — fix
   until green.
9. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — first pass.
10. Spawn a Sonnet linguistic reviewer (read the assembled IR, not the
    brief) — same brief as m26's step 10, plus specifically: any
    accidental «llueve»/«nieva»/«soleado»/bare «qué»/«el tiempo», any
    ☀️ used for a new atom's imageMcq, any «calor»/«frío» drifting into a
    non-idiom adjective slot, any gendered/pluralized «nublado».
11. Apply fixes (≤10 lines inline; bigger ones back to the drafting agent).
12. `zsh docs/es-ir-sources/tts-chain.sh <tag>` — second pass.
13. `npx vitest run src/features/languages/es/curriculum/m27.test.ts` — final green.

### Vocab card art — emoji vendoring required before shipping (CLAUDE.md)
Per CLAUDE.md's "Vocab card art" invariant, every authored word needs an
image, and any NEWLY authored emoji must be VENDORED as an SVG into
`src/pub/noto-emoji/svg/` before this module ships (a 2026-06 wave shipped
224 unvendored emoji → broken images; do not repeat it). Verify each of
the following against the existing vendored set before assuming it's
already there — do not assume a common emoji is automatically present:
- 🌞 (el sol) — NEW, not previously used anywhere in this course (☀️ IS
  already vendored/used for «buenas tardes» but is a DIFFERENT glyph —
  confirm 🌞 specifically, do not assume the sun family is covered).
- 🌧️ (la lluvia) — NEW.
- 💨 (el viento) — NEW.
- ❄️ (la nieve) — NEW.
- ☁️ (nublado) — NEW.
- 🥵 (el calor) — NEW.
- 🥶 (el frío) — NEW.
All 7 are grep-verified absent from `curriculum/m{1..26}.ts`'s emoji list
(see header's "NO NEW EMOJI COLLISION" section) — treat all 7 as
needing vendoring, not just the ones that "look unusual." Check
`src/pub/noto-emoji/svg/` directly for each codepoint before shipping;
if any are missing, vendor them (see `docs/n5-vocab-emoji-reference-2026-05-18.md`
for the JA-side process this ES module should mirror) before the module
is considered ready to gate.

### The 7 registration points — verify by hand (register-mod.py covers 5)
Same 7 as `es-m26-brief.md`'s checklist, `m26`→`m27` throughout: (1)
`curriculum/index.ts` import/meta/map, (2) `courseAtoms.ts` union, (3)
`courseAtoms.ts` `getEsCourseAtoms()` spread, (4) `grammarHelpers.ts`
`ES_MODULE_ORDER`, (5) `placementBank.ts`, (6) `m27.test.ts` (hand-written,
step 7 above), (7) every `newAtoms` surface literally used in `m27.ts`
(`registerEsAtomUsagePin`). Also confirm `es-quality.test.ts`'s
`ES_M27_CHECKPOINT_INDEX` entry landed (script adds it, easy to forget
verifying) — **naming convention inferred by direct analogy to
`ES_M24_CHECKPOINT_INDEX`/`ES_M25_CHECKPOINT_INDEX`/`ES_M26_CHECKPOINT_INDEX`,
not independently re-derived from `register-mod.py`'s literal string,
UNVERIFIED, flag if it doesn't match.** Before starting any of this,
re-check that m26's own 7 registration points are actually in place —
this brief's "m26 status note" above only confirmed the files exist on
disk, not that a reviewer pass hasn't since touched them.

## Decisions inferred (no open questions were parked — reasoning recorded here)
- **A new-lexicon module (weather), not a 4th imperfect wave, not a
  consolidation module, not the «ir»-registration fix.** All four
  candidates were live going into this brief. The vocabulary gap (seven
  consecutive zero-new-noun modules) is the sharpest, unnamed-until-now
  gap in the course and directly serves CLAUDE.md's "reason through"
  aim; it also functions as this module's own interleave break, which a
  4th imperfect wave would not provide (it would be the SAME mechanic
  four of the last five modules) and which a manufactured consolidation
  module would provide but with no new content (m25-header's own
  rejection of that idea still holds). The «ir» fix is real but is not
  module-shaped — no ten-lesson content, no checkpoint, a one-line
  registry edit. Full reasoning in the header's "WHY THIS MODULE, NOW"
  and three "REJECTED ALTERNATIVE" sections.
- **Seven words, not more.** Seasons (4 more nouns) were considered and
  cut to protect debut-room-per-atom, the same [[drafting-coverage-not-volume]]
  discipline m26 applied to its own leftover eight verbs. Left as a named
  future companion module.
- **Nouns, not impersonal verbs, for rain/snow.** «llueve»/«nieva» are
  more idiomatic but are new verb atoms; this module's entire framing
  (zero new grammar) argues for the noun treatment («hay lluvia»/«hay
  nieve») instead. Full reasoning in the header's "WHICH SEVEN WORDS"
  section, point 3.
- **«soleado» cut for an image-disambiguation reason, not a grammar
  one.** Every candidate "sunny" emoji visually overlaps «nublado»'s ☁️
  in a 4-option grid — the authoring guide's own image-MCQ ceiling rule.
  «hay sol» covers the same meaning without a new atom.
- **🌞 not ☀️ for «el sol».** ☀️ is already load-bearing as the PRIOR
  distractor emoji for «buenas tardes»; reusing it would create a
  same-glyph-two-correct-answers ambiguity across modules. Full reasoning
  in the header's "NO NEW EMOJI COLLISION" section.
- **Fresh accent colour: `#eab308` → `#a16207` (warm yellow).** Checked
  every `accent:` pair in `curriculum/index.ts` (grep-verified none of
  m1–m26 use this hue) plus the six most recently named — m21 sky
  (`#38bdf8`→`#0c4a6e`), m22 indigo (`#818cf8`→`#3730a3`), m23 red
  (`#ef4444`→`#991b1b`), m24 fuchsia (`#d946ef`→`#86198f`), m25 blue
  (`#3b82f6`→`#1d4ed8`), m26 cyan (`#22d3ee`→`#0891b2`) — warm yellow
  reads as distinct from all six and is thematically apt for a sun/
  weather module (amber, `#f59e0b`, was avoided as already used twice).

## Claims marked UNVERIFIED (could not confirm from code, flag to drafting agents)
- **«donde» (unaccented "where," as opposed to PRIOR «dónde», m4, the
  accented interrogative) is NOT grep-verified as its own atom** — the
  L10 table's first-drafted win line used it and was struck for this
  reason (also for using the banned «nevaba»); the replacement win line
  in the lesson-plan table avoids it entirely. Do not use «donde» in any
  lesson without grep-confirming it first — treat it as NOT PRIOR by
  default.
- **The exact current content of `m26-L*.yaml` fragments and `m26.ts` at
  the moment a drafting agent starts on m27** — this brief was written
  against a snapshot where m26 was reported drafted with all 10 lesson
  fragments present on disk, but its registration/review status past
  "files exist" was not independently re-verified here (unlike m25/m26's
  own briefs, which had an explicit concurrent-author status note to
  work from). Re-grep every m26-sourced surface before using it.
- **Whether `es-quality.test.ts`'s `ES_M27_CHECKPOINT_INDEX` naming holds
  without deviation** — inferred by direct analogy to m24/m25/m26's
  identical pattern, not independently re-derived from `register-mod.py`'s
  exact string-substitution rules beyond the `edit()` calls shown in that
  script (confirmed generically, not this literal constant's spelling).
- **Whether 🌞/🌧️/💨/❄️/☁️/🥵/🥶 render acceptably at the course's smallest
  emoji-card size once vendored** — not visually verified here (this
  brief is text-only research); a drafting or reviewing agent should spot
  -check rendered size, not just SVG presence, before shipping.
