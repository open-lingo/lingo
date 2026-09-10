# ES m32 dispatch brief — "Necesito una chaqueta nueva"

Worktree: `/Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1`
(`cd` there first, and again in every command — the shell cwd resets;
`export LINGO_ROOT=$PWD`.)

Status note (2026-09-10): m31 ("Me duele la mano") is ALREADY FULLY
LANDED — confirmed via `grep -n "M31" src/features/languages/es/courseAtoms.ts`
(import line 62, type-union entry line 66, spread line 224) and
`grep -n "ES_M31_CHECKPOINT_INDEX" src/features/languages/es/curriculum/es-quality.test.ts`
(import line 62, map line 110). A reviewer may be editing m31 FRAGMENT
files concurrently in this worktree — read them for reference (already
done, see below), never modify them. m32 has not been started; this
brief and `m32-header.yaml` are the only m32 artifacts that exist so far.

**Read `m32-header.yaml` FIRST — it is denser than this brief and carries
the full WHY/REJECTED/SCOPE reasoning as inline comments. This brief
gives the lesson plan and pipeline mechanics; the header gives the
decision record.**

## The decision this module resolves

Course state at m31: m27 gave a weather-lexicon break, m28 taught «ir a +
infinitivo», m29 taught clitic-on-infinitive (the `comprarlo`-family fused
atoms), m30 gave a body-part-lexicon break, m31 taught «me duele/duelen»
as one grammar beat riding m30's own nouns. Interleave-don't-block-teach
(CLAUDE.md, course-design-learnings law) calls for a break next, and
course rhythm has now had two grammar-adjacent beats (m29, m31) split by
exactly one break (m30) — a second break is due, not overdue.

m32 is that break: **clothing, round two** — `pantalón`, `chaqueta`,
`calcetines`, `guantes`, `bufanda`. Zero new grammar, zero new verb
morphology, five new imageable nouns. It reuses FOUR independent PRIOR
frames rather than inventing anything: `tengo`/`necesito` (possession/
need, m5/m16), `voy a comprarlo`/`comprarla`/`comprarlos` (m28+m29, all
three fused-clitic forms fit this module's own gender/number split with
zero gap — no `verla`-class trap), `cuánto cuesta` (m12's own shopping
frame), and `duele`/`duelen` + m30's body nouns (m31) via a dedicated L9
pain-frame lesson (`calcetines`↔`pies`, `guantes`↔`manos`).

## Files (read in this order)

1. `docs/es-ir-sources/m32-header.yaml` — the decision record (just
   written, read it now for the full reasoning).
2. `docs/es-ir-sources/es-m31-brief.md` + `m31-header.yaml` — the
   immediately-prior module; this brief mirrors its structure exactly.
3. `docs/es-ir-sources/es-m30-brief.md` + `m30-header.yaml` — two
   modules prior; documents the "verla trap" and the plural-only-noun
   convention (`dientes`, m17) this module's `calcetines`/`guantes`
   follow.
4. `docs/es-ir-sources/authoring-rules.md` — two hard rules (NPC
   provenance, "agreement is not a new atom").
5. `docs/lesson-authoring-guide.md` §13 — card-type rubric, the
   image-MCQ-as-introduction pattern (§13.2) this module's five nouns
   should use for their formal teach.
6. `docs/pedagogy-principles-2026-07-05.md`, `docs/course-design-learnings-2026-08-21.md`
   — general principles, the interleave law, the "shape from content"
   law.
7. CLAUDE.md — boundaries, lenses.
8. `src/features/languages/es/curriculum/m31.ts` (and m29, m30) header
   comments — shipped precedent for header/comment style and fused-clitic
   usage.
9. `src/features/languages/es/curriculum/esSimNpcProvenance.test.ts` —
   the new course-wide NPC-line gate (see "Hard rules" below).
10. `src/features/languages/es/__tests__/moduleBarGuards.ts` —
    `looksSpanish()`, the full-sentence MCQ ban's detector, now folds
    plural/gender inflection.

## PRIOR vocabulary — verify before drafting, don't trust this list blind

Re-run this grep yourself before writing lesson fragments (registry may
have shifted): `grep -o 'surface: "[^"]*"' src/features/languages/es/curriculum/m{1..31}.ts | sort -u`

**PRIOR and reusable:**
- Clothing (m12): `camisa`, `falda`, `zapato`, `sombrero` — DO NOT
  re-teach; may appear in review/recombination only, never as this
  module's formal debut.
- Possession/need: `tengo`/`tienes`/`tiene` (m5), `necesito`/`necesitas`/
  `necesita` (m16).
- Color/size/descriptive: `rojo`, `azul`, `verde`, `negro`, `blanco` (m6);
  `grande`, `pequeño`, `nuevo`, `viejo`, `bonito` (m6).
- Shopping: `cuánto`, `cuesta`, `cuestan` (m12).
- Motion/intention: `voy a` + infinitivo (m28).
- Fused clitics (m29): `comprarlo`, `comprarla`, `comprarlos`, `verlo`,
  `verlos`, `levantarme`, `hacerlo` — this module uses all three
  `comprar`-family forms, invents no fourth.
- Pain frame (m31): `duele`, `duelen`, riding m30's body nouns `mano`,
  `pie`, `brazo`, `pierna`, `ojo`, `boca`, `nariz`.
- Plural-only-noun precedent (m17): `dientes` — registered as its own
  plural surface, no singular card. This module's `calcetines`/`guantes`
  follow the identical pattern.

**NOT PRIOR (verified zero grep hits, do not assume otherwise without
re-checking):** `pantalón`, `chaqueta`, `calcetines`, `guantes`,
`bufanda`, `vestido` (deliberately excluded, see header), `ponerse`,
`llevar`, `unos`/`unas`, `color`, `cuál`.

## What this module does NOT teach

- **No new wear-verb.** `ponerse`/`llevar` are both absent from the
  registry; this module routes every sentence through `tengo`,
  `necesito`, or `voy a comprarlo/la/los` instead. Do not reach for
  "me pongo" or "llevo" — they are untracked words and will fail the
  atom-provenance gate. `ponerse` is real future content (a reflexive-
  verb module), not this one's job.
- **No `vestido`.** Its only clean emoji, 👗, is already `falda`'s (m12).
  Reaching for it collides silently with a PRIOR atom's image — the
  identical trap m27 (☀️/🌞) and m30 both warned against. Excluded.
- **No `unos`/`unas`.** Only `un`/`una` are PRIOR. `calcetines` and
  `guantes` take the definite article (`los calcetines`) or go bare
  (`tengo calcetines negros`), never a manufactured indefinite plural.
- **No `color`/`cuál`.** Colors stay adjectives (`la chaqueta azul`);
  no "what color" or "which one" question frame this module.

## Step kinds — image-MCQ-as-introduction (guide §13.2)

Every one of the five new nouns is a concrete, unambiguous-emoji noun —
textbook fit for §13.2's pattern: `vocabMcq` (image MCQ) as the formal
teach/debut step, immediately followed by production practice
(sentence_build or cloze) in the same lesson. Do not introduce a noun
via a bare flashcard or a translate step first; the image MCQ IS the
introduction. `dialogue_sim` carries the recombination lessons (L7
shopping, L9 pain-frame); `vocabTextMcq` targets must be the registered
singular/plural surface exactly as registered (`pantalón`, not
`pantalones`, unless a lesson explicitly drills the regular plural).

## Hard rules the gates enforce

1. `atoms:` credit arrays silently drop any entry not exactly matching a
   registered surface — typo in a credit array is a silent miss, not an
   error. Double-check every credit array against `courseAtoms.ts`.
2. Build tiles are billed exposure (`es-which-slots-are-billed` law) —
   `esSurfaces` bills cloze options and build tiles, NOT MCQ distractors.
   A wrong-form distractor in an MCQ is free; the same string as a build
   tile is billed and must be a real, legal form.
3. «lo» has no standalone registration — do not use bare «lo» as a
   credited atom; only the fused forms (`comprarlo`, `verlo`, etc.) are
   registered.
4. **Full-sentence MCQ ban (invariant 28):** MCQ correct answers ≤3
   tokens. `looksSpanish()` now folds plural/gender inflection via
   `getEsPluralCanon()`/`getEsGenderCanon()`, so an inflected multi-word
   answer (e.g. "los guantes negros") that previously might have scored
   as not-fully-Spanish will now correctly score as Spanish and trip the
   ban if it's a full sentence. Keep MCQ answers short by construction —
   don't rely on the old gap.
5. `vocabTextMcq` targets must be the registered singular (or, for
   `calcetines`/`guantes`, the registered plural — there is no singular
   card for those two; target the plural surface directly).
6. **Agreement is not a new atom.** A registered singular/masculine
   atom's REGULAR plural/feminine inflection counts as known without
   separate registration. `pantalón`→`pantalones`, `chaqueta`→
   `chaquetas`, `bufanda`→`bufandas` all pluralize freely under this
   rule. `calcetines`/`guantes` are registered AS plural directly (no
   singular exists to inflect from) — same convention as `dientes` (m17).
   Irregular inflections are NOT covered by the canon fold and are not
   relevant here (none of this module's nouns are irregular).
7. `ILLEGAL_PRESENT_FORMS` tile scan — any build-tile bank containing an
   illegal present-tense form of a taught verb fails. Not directly
   triggered by this module (no new verb), but any recombination sentence
   using `tener`/`necesitar`/`comprar` conjugations must stay within
   already-taught forms.
8. **RECALL LAW** (discovered during m31 authoring, now a standing hard
   rule): a `cue: recall` step's targetPhrase must match a phrase voiced
   VERBATIM earlier in course order — not merely composed of registered
   atoms. If this module uses a recall step reprising, e.g., a m31 pain
   sentence with new clothing substituted, that is a NEW phrase, not a
   recall — use a different cue, or recall an exact phrase this module
   itself already voiced earlier in its own lesson order.
9. **`esSimNpcProvenance.test.ts` (new since m31, course-wide, live for
   m32 with ZERO legacy allowance).** `KNOWN_LEGACY` covers only m1-m10,
   m20, m22-m28 — m29, m30, m31, and this module get NO reaction-word
   leniency. Every NPC line's word must resolve to a registered atom (any
   module ≤m32), a taught verb conjugation, `ES_FUNCTION_WORDS`,
   `ES_PROPER_NAMES`, or a PRIOR multi-word phrase atom's component word.
   Words like «genial», «perfecto», «mira» are NOT free here — if an NPC
   line wants a reaction word, it must be one this module (or a PRIOR
   module) actually registered, or must be dropped/reworded.
10. `es-quality.test.ts`'s own dialogue_sim checks (multi-word atom
    inflection integrity + reply-word provenance) still apply independent
    of #9 — both gates must pass, not just one.
11. Zero emoji collisions — verify every new emoji against
    `grep -o 'emoji: "[^"]*"' curriculum/m{1..31}.ts | sort -u` before
    shipping; re-run at ship time even though verified now (concurrent
    lanes may touch the registry).
12. Accent color — `curriculum/index.ts`'s `accent: { from, to }` pair
    must be a zero-collision pair against all 31+ existing entries.

## SIM NPC lines

Keep NPC dialogue in L7 (shopping) and L9 (pain-frame) restricted to:
`qué`, `necesitas`, `necesita`, `cuánto`, `cuesta`, `cuestan`, `duele`,
`duelen`, this module's five nouns, m30's body nouns, PRIOR function
words (`el`/`la`/`los`/`las`, `tu`/`su`, `y`, `pero`), and proper names
from `ES_PROPER_NAMES`. Grep every `npc:` string by hand against the
registry before shipping — do not trust the reply-only gate to catch a
provenance miss; `esSimNpcProvenance.test.ts` checks NPC lines
independently and will fail the whole module on one bad word.

## Usage-note budget

Follow m30/m31's own restraint: one usage note per genuinely novel
pattern only. Candidates here: (1) `pantalón` is grammatically singular
in Spanish despite English "pants" always being plural — flag once, at
first introduction, not every recurrence. (2) `calcetines`/`guantes`
have no singular card — flag once, referencing the `dientes` (m17)
precedent so a learner who's seen that pattern isn't surprised. Do not
add a note for every color/size adjective recombination — those are
already-taught patterns needing no new explanation.

## Lesson plan (10 lessons, checkpoint at L8)

| L | Focus | New atoms taught | -sp-win (recombination sentence) |
|---|-------|-------------------|-----------------------------------|
| 1 | `pantalón` debut (imageMcq → sentence_build) | pantalón | "Tengo un pantalón azul." |
| 2 | `chaqueta` debut | chaqueta | "Necesito una chaqueta nueva." |
| 3 | `calcetines` debut (plural-only note) | calcetines | "Tengo calcetines negros." |
| 4 | `guantes` debut (plural-only note; needs vendored SVG) | guantes | "¿Tienes guantes grandes?" |
| 5 | `bufanda` debut | bufanda | "Mi bufanda es bonita." |
| 6 | Color + size recombination across all 5 (review, no new atoms) | — | "La chaqueta verde es pequeña." |
| 7 | Shopping dialogue_sim — `voy a comprarlo/la/los` + `cuánto cuesta` | — | "Voy a comprarla — ¿cuánto cuesta la chaqueta?" |
| 8 | **Checkpoint** — mixed review, all 5 atoms + PRIOR clothing (m12) | — | (review, no new sentence) |
| 9 | Pain-frame dialogue_sim — `duele`/`duelen` + body/clothing pairs | — | "Me duelen los pies — necesito calcetines nuevos." |
| 10 | Cumulative recombination — clothing + colors + shopping + pain, mixed step kinds | — | "Necesito comprar guantes — me duelen las manos." |

## What to report back

1. Which files were written/modified (list paths).
2. Final atom count and list (surface + gender + emoji).
3. Any emoji vendored during drafting (should be none — vendoring is
   flagged for a later step, see below) or discovered missing.
4. Any gate failures hit during `assemble-mod.sh`/`compile-ir-es.mjs`
   and how resolved.
5. Any deviation from this lesson plan and why.

## Exact pipeline commands

Run from `$LINGO_ROOT` (`cd` there first — cwd resets between commands).

1. `cd /Users/lichfield/Documents/projects/lingle/lingo/.claude/worktrees/ja-wave1 && export LINGO_ROOT=$PWD`
2. Draft `docs/es-ir-sources/m32-L1.yaml` through `m32-L10.yaml` and
   `m32-placement.yaml` per the lesson plan above (a Sonnet subagent's
   job per the HARD RULE — no inline bulk authoring by Fable).
3. Per-lesson validate as drafted:
   `zsh docs/es-ir-sources/check-frag.sh m32 <tag 1-9> docs/es-ir-sources/m32-L<N>.yaml`
4. Assemble: `zsh docs/es-ir-sources/assemble-mod.sh m32`
   (produces `docs/es-ir-sources/m32.ir.yaml` from the header + lesson
   fragments; `lessons:` in `m32-header.yaml` is filled by this step,
   do not hand-edit it).
5. Compile: `node scripts/compile-ir-es.mjs docs/es-ir-sources/m32.ir.yaml`
   (produces `src/features/languages/es/curriculum/m32.ts`).
6. Vendor the one missing emoji SVG before L4 ships (see "Vocab card
   art" below).
7. Register (all 6 points in one call):
   `python3 docs/es-ir-sources/register-mod.py m32 "Necesito una chaqueta nueva" 10 8 "#4f46e5" "#312e81" none`
   (module id, title, expectedLessonCount, checkpoint, accent-from,
   accent-to, frame — mirror the exact arg order `register-mod.py`
   expects; re-check the script's own arg list before running, it is the
   canonical source, not this brief).
8. Verify registration landed at all 6 points:
   `grep -n "m32\|M32" src/features/languages/es/curriculum/index.ts src/features/languages/es/grammarHelpers.ts src/features/languages/es/courseAtoms.ts src/features/languages/es/curriculum/es-quality.test.ts src/features/languages/es/placementBank.ts`
9. Run the course-wide ES quality suite:
   `npx vitest run src/features/languages/es/curriculum/es-quality.test.ts`
10. Run the NPC provenance gate specifically (new, unforgiving for m32):
    `npx vitest run src/features/languages/es/curriculum/esSimNpcProvenance.test.ts`
11. Run `moduleBarGuards` / full-sentence-MCQ-ban tests:
    `npx vitest run src/features/languages/es/__tests__/moduleBarGuards.ts`
    (or the suite that imports it, if it's not itself a runnable test
    file — check for a `.test.ts` wrapper before assuming this path is
    directly runnable).
12. Run the placement bank test if one exists for m32's slot:
    `npx vitest run src/features/languages/es/placementBank.test.ts`
    (path UNVERIFIED — confirm the actual filename before running).
13. Full ES test sweep before declaring done:
    `npx vitest run src/features/languages/es`
14. Do NOT commit — dispatching agent or a later step owns the commit.

## Vocab card art

Four of five target emoji are already vendored:
`emoji_u1f456.svg` (👖 pantalón), `emoji_u1f9e5.svg` (🧥 chaqueta),
`emoji_u1f9e6.svg` (🧦 calcetines), `emoji_u1f9e3.svg` (🧣 bufanda) all
confirmed present in `src/pub/noto-emoji/svg/`.

**`emoji_u1f9e4.svg` (🧤 guantes) is ABSENT — confirmed via two separate
grep checks.** A drafting/vendoring agent must add this SVG (Noto Emoji
source, codepoint 1F9E4) to `src/pub/noto-emoji/svg/` before L4's
`vocabMcq` debut ships; the image will break silently otherwise. This
breaks m30/m31's two-module zero-vendoring streak — named here, not
hidden.

## The 6 registration points (register-mod.py checklist)

1. `curriculum/index.ts` — import statement.
2. `curriculum/index.ts` — lesson map entry.
3. `curriculum/index.ts` — meta card (title, accent, expectedLessonCount).
4. `grammarHelpers.ts` — `ES_MODULE_ORDER` array, append `"m32"` after
   `"m31"`.
5. `courseAtoms.ts` — import `ES_M32_ATOMS`, add `"m32"` to the
   `EsAtomSource` type union, spread `...ES_M32_ATOMS,`.
6. `es-quality.test.ts` — import `ES_M32_CHECKPOINT_INDEX`, add
   `m32: ES_M32_CHECKPOINT_INDEX,` to the map.

(m31's own brief counted a 7th point for `placementBank.ts`; confirm at
run time whether `register-mod.py` still edits it in this version of the
script — treat the script itself, not either brief, as canonical.)

## Decisions inferred (recorded, not parked)

- **Theme: clothing, round two.** Chosen over household (only 3 clean
  atoms remaining, per m30's own unchanged finding), places-in-town
  (NOT fresh — fully PRIOR since m9, a finding this brief made
  independently, not inherited from any prior brief), food (weakest
  recombination — no clean fused-clitic partner, no pain-frame tie),
  family (half its vocabulary already PRIOR at m5; weakest
  recombination of all six candidates), and animals (virgin but only
  one PRIOR hook, `tengo`, already m30's own richest use of that frame).
  Full reasoning with grep commands in `m32-header.yaml`.
- **No new wear-verb.** `ponerse`/`llevar` both absent from registry;
  routing through `tengo`/`necesito`/`voy a comprarlo` keeps this module
  at zero new grammar, mirroring m30's own rejection of `limpiar` for an
  identical reason.
- **`vestido` excluded** — its clean emoji (👗) collides with `falda`'s
  (m12); a live instance of the trap m27/m30 both warned a future
  clothing author against.
- **Five atoms, not six or seven** — matches m30's own 7-atom body
  module and m31's 2-atom grammar module; five imageable nouns is
  enough content for a 10-lesson break without stretching recombination
  thin.
- **Accent `#4f46e5`→`#312e81`** ("denim indigo") — verified zero
  collision against all 31 prior `accent` pairs; distinct from the four
  most recent modules' own colors (m28 green, m29 slate, m30 teal, m31
  rose).
- **`calcetines`/`guantes` registered plural-only**, no singular card —
  follows m17's `dientes` precedent exactly; singular forms are
  pedagogically pointless (nobody buys/wears one sock or one glove).
- **L9 pain-frame pairing is deliberate, not incidental** —
  `calcetines`↔`pies`, `guantes`↔`manos` is a direct item-covers-body-
  part recombination unavailable to any other rejected candidate domain;
  this is the strongest single piece of evidence for choosing clothing
  over food/family/animals.

## Claims marked UNVERIFIED

1. **`register-mod.py`'s exact current arg order and whether it still
   edits a 7th file (`placementBank.ts`).** m30's and m31's own briefs
   disagreed on this point at various times; this brief's pipeline
   command #7 above uses the 7-arg form matched against the version of
   `register-mod.py` read during this research pass (module, title,
   expectedLessonCount, checkpoint, accent-from, accent-to, frame) — but
   re-read the script itself immediately before running it, don't trust
   this brief or any prior brief as the arg-order source of truth.
2. **Whether `moduleBarGuards.ts` is directly runnable via vitest or is
   only imported by another `.test.ts` file.** Read as a `.ts` file
   (not `.test.ts`) during research — pipeline command #11 above may
   need a different target path. Confirm before running.
3. **The exact filename of any placement-bank test** (pipeline command
   #12) — not directly confirmed during research; `placementBank.ts`
   itself was read/grepped for registration purposes but its own test
   file (if one exists) was not located by name.
4. **Whether `ES_FUNCTION_WORDS` and `ES_PROPER_NAMES` (referenced in
   `esSimNpcProvenance.test.ts`'s provenance logic) already cover every
   function word this module's own NPC lines will need** (e.g. `su`,
   `tu` as possessives in a shopping context) — the sets themselves were
   not fully enumerated during this research pass; a drafting agent
   should grep both before finalizing L7/L9 NPC dialogue, not assume
   coverage.
5. **Whether the regular-plural canon fold (`getEsPluralCanon()`)
   correctly derives `pantalones`/`chaquetas`/`bufandas` from this
   module's singular registrations without any special-casing** — the
   fold's REGULAR-inflection logic was read and confirmed to apply to
   regular -s/-es pluralization in general, but was not traced against
   these three specific new surfaces line-by-line; a drafting agent
   using a plural build-tile for these three nouns should verify the
   canon actually contains the expected entry before relying on it,
   rather than assuming from the general rule.
