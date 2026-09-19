# PT authoring pack (spec-first) — generated, do not hand-edit

Regenerate: `node scripts/author/pt/pack.mjs`. Source: docs/pt-course-design-2026-09-18.md
§3/§4, the 5 `PTAUTH-L*` lane reports, `scripts/draft/pt-ir/assemble.mjs`.
This is the ONE doc a spec-first PT lane reads before writing a spec.

## The loop
1. Read this pack (you're doing it).
2. Write `specs/pt-m1-l<n>.yaml` (~60 lines, format below).
3. `node scripts/author/pt/from-spec.mjs specs/pt-m1-l<n>.yaml`
4. `bash scripts/author/pt/check.sh <n>`
5. Commit the two generated files + the spec.

## Known gaps (not this lane's job to fix — named so nobody re-discovers them)
- `ir/m1.ir.yaml` exists (lane PTINT/PTR1-L6); `check.sh` runs `compile-ir-pt.mjs m1 --check`
  for real. Its unconditional "last lesson must end on a sim" complaint is downgraded to INFO
  by `check.sh` itself (not the compiler) when the lesson checked is NOT the module's final
  one (arg 2, default 6) — a per-lesson check on a non-final lesson can't satisfy a module law.
- A sim's `scene` (emoji/title/setting) isn't spec-configurable yet; defaults to 💬 + the title.
- The generated `map` step only pairs tokens matching a registered `words:` surface — a bare
  persona name (e.g. "Sam") goes unmapped unless also listed as a word.

## Checklist (exact numbers the generator + check.sh enforce)
- New atoms per lesson: <= 8.
- Intro-capable step kinds (a new atom's FIRST PRINTED appearance): info, phrase,
  speakLit, buildLit, listenCompLit, imageMcq — never a distractor, never a sim
  first, and `map` does NOT count (its opening sentence is transparent for this rule).
- Every atom: >= 3 answer positions across the lesson (build answer, cloze
  blank, MCQ correct, listen answer, sim right option, match pair).
- No two adjacent same-kind steps. No 4+ (max 3 in a row) selection-only
  run (imageMcq/textMcq/mcq/clozeLit are selection-only; buildLit/speakLit/
  listenCompLit/sim/map/matchLit/agreementLit are not).
- Any one sentence used <= 3x across its roles.
- buildLit tiles: >= 5 unless the sentence is the grammar point's `debut`.
- Contractions (do, da, dos, das, no, na, nos, nas, …) are CLOZE-ONLY —
  never a build/listen-build tile, even on a sentence tagged `build` (the generator
  forces these to `cloze:` automatically; `assemble.mjs`'s `checkNoContractionTiles`
  throws at compile time if one ever slips through).
- imageMcq: max 2 per lesson, never adjacent, only on a noun's debut. Every `pos: noun` word
  needs `emoji` (vendored) or `imageable: false` + `imageableReason` — generator refuses else.
- Every lesson closes: `sim` -> `matchLit` (>= 6 pairs) -> `speakLit`-win.
  `dialogue:` (>= 1 turn) is REQUIRED on every spec — the generator refuses to emit without
  it, and `check.sh` independently FAILS a non-checkpoint lesson with no `sim` step on disk.
- Step-count band: 10-25.
- Gloss-aspect rule: the English gloss must carry the form's aspect lexically
  (preterite = simple past, never "was going"/"used to"; no progressive; `ir + inf`
  glosses "going to X", never "will X") — one line in `grammar`/`info`, never left implicit.
- Ser/estar minimal pairs get an explicit `antiPattern` (design doc §3).
- `allow:` closed set: {e, ou, mas, não, sim, com, a, o} — anything else must be a real atom.
  `uses:` credits atoms (words:/recall:); `allow:` is prose-only pass-through, never in `uses:`.
- Cloze blanks: write the canonical (lowercase) surface in `cloze:<word>` — normalized to the
  sentence's actual printed token (case + punctuation) automatically.
- listenCompLit->clozeLit couplets on the same sentence: check.sh flags > 2 (INFO, PTGRADE2 #1).

## PTGRADE2 improvements NOT folded in (content-side judgment, not mechanical — listed so
nobody re-discovers them): non-empty sentence-specific `why` on a non-contrastSet cloze;
distractor legality (no prompt-visible/cross-POS filler); `map` under-glossing assertion
(bare-function-word-unmapped is intentional, see gaps above); a place-name article table +
lint; "every §4-named contrast gets a graded step" cross-check against the design doc.

## SPEC format
```yaml
lesson: 3                      # positive integer
id: pt-m1-l3                   # lesson id, matches the spec's filename
title: "Eu tenho uma família"
grammar: "ter present sg.; um/uma agreement"   # authoring-only metadata — NEVER learner copy
infoTitle: "Ter: tenho / tem"  # REQUIRED, learner-facing info-card title, != grammar
info: "..."                    # REQUIRED, learner-facing info-card body, != grammar
antiPattern: { ok: "Sam está cansado.", wrong: "Sam é cansado." }   # optional, structured
allow: [e, não, mas]           # optional, declared function words (taught-vocab residual check)
words:                         # <= 8 new atoms, debut order (0 allowed only when checkpoint: true)
  - { pt: família, en: family, pos: noun, gender: f, emoji: "👨‍👩‍👧", cognate: true }
  - { pt: tenho, en: "I have", pos: verb-form, of: ter }
recall: [sou, é]               # optional, already-taught surfaces usable in "uses" — NO cap, no new atom
contrastSet: [[tenho, tem]]    # optional, list of surface-groups; a cloze on a member's options
                                # MUST be exactly that group (never a random same-POS noun);
                                # checkpoint auto-tops-up coverage from a spare recall sentence
contrast: [{ a: sou, b: é, note: "1st vs 2nd/3rd person" }]  # optional, minimal-pair -> textMcq
pattern: { frame: "Eu ___ de ___", slots: [{ pt: "Eu gosto de música.", en: "I like music.", distractorsEn: ["I have music.", "I am music."] }] }
conjugation: { verb: falar, forms: [{ pt: "Eu falo português.", en: "I speak Portuguese.", blank: falo }, { pt: "Você fala português.", en: "You speak Portuguese.", blank: fala }] }
sentences:                     # roles drive step generation; uses = credited atoms
  - { pt: "Eu tenho uma família grande.", en: "I have a big family.", roles: [build, debut], uses: [tenho, família] }
  - { pt: "Você tem um irmão?", en: "Do you have a brother?", roles: ["cloze:tem", listen], uses: [tem, um, irmão] }
agreement:                     # optional -> ONE agreementLit, >= 2 real blanks, no proper-noun answer
  sentence: "Eu tenho um amigo e uma irmã."
  en: "I have a friend and a sister."
  blanks: [{ answer: um, options: [um, uma] }, { answer: uma, options: [um, uma] }]
dialogue: { npc: Bia, turns: [{ npc: "Você tem família aqui?", gloss: "...", goal: "...", options: ["Tenho, sim.", "Sou estudante."], correct: 0 }] }  # REQUIRED, >= 1 turn
win: { pt: "Eu tenho uma família e um gato.", en: "I have a family and a cat." }
```
Roles: `build`, `listen`, `speak` (mid-lesson speakLit, not just the closing win), `cloze:<word>`,
`debut` (waives the tile floor). A word tagged `build` whose `uses` includes a contraction is
forced to `cloze:` automatically — if that sentence's own atoms have no OTHER intro-capable
appearance, the scheduler auto-inserts a `phrase` debut immediately before it (never the info card).
`checkpoint: true` — a zero-new-atom recall lesson: `words` may be empty (padded from `recall`),
no `imageMcq` debut allowed, and the lesson ends `matchLit -> speakLit -> sim` (module law: the
LAST lesson always ends on the sim) instead of the usual `sim -> matchLit -> speakLit`.
`ir.checkpoint` (the compiler's OWN module-header field, separate from this per-lesson flag) is the
INTERIOR mastery-review lesson index (`1 < checkpoint < lessons.length`, strictly) — a checkpoint
that is also the module's FINAL lesson satisfies the ends-on-sim law instead and cannot legally be
`ir.checkpoint`'s value; leave `ir.checkpoint` at an interior review lesson, or omit it, when the
module's own zero-new-atom lesson is its last (m1's own situation — see PTINT/PTR1-L6's reports).
A slash pair in a design-doc row (e.g. "no/na", "cansado/cansada") is TWO atoms and counts twice
toward the 8-word `words` cap — it is not one atom with two surfaces.

## `words:` entry fields
| field | meaning |
|---|---|
| `pt` | surface form, required |
| `en` | English gloss, required |
| `pos` | noun/verb/verb-form/particle/adjective/adverb/pronoun/proper-noun/interjection/article;
  `verb-form` folds onto `verb`, `article` folds onto `determiner` in the emitted atom
  (`Atom.partOfSpeech` has no `verb-form`/`article` member) |
| `gender` | `m`/`f` for a real masc/fem pair; `epicene` for a noun whose surface is IDENTICAL
  across genders (e.g. `estudante`) — carried straight through, not guessed |
| `emoji` | REQUIRED for `pos: noun` (unless `imageable: false`); must be vendored |
| `imageable` | `false` opts a noun OUT of imageMcq — requires `imageableReason` |
| `cognate` | documentation only — front-loads it as a low-risk debut, no generator effect yet |
| `falseFriend` | documentation only — flags for a future antiPattern step |
| `of` | which verb a conjugated `verb-form` belongs to, documentation only |
| `hint` | pronunciation nudge, carried straight to the atom |

## Lesson briefs (docs/pt-course-design-2026-09-18.md §4, m1 L1-L6)
| L | Title | Grammar point | Atoms (exact set, this pack's real specs) | Win |
|---|---|---|---|---|
| 1 | Eu sou Sam | ser present sg. (sou/é); greetings | olá, eu, você, sou, é, estudante, professor, Brasil | «Eu sou Sam, sou estudante.» |
| 2 | De onde você é? | ser + de (origin); do/da contractions | de, onde, do, da, cidade, país, França, Califórnia | «Eu sou do Brasil, e você?» |
| 3 | Eu tenho uma família | ter present sg.; um/uma agreement | tenho, um, gato, uma, irmã, amigo, família, tem | «Eu tenho um amigo e uma irmã.» |
| 4 | Eu estou cansado | estar present sg.; ser-vs-estar; em+o (no) | estou, está, em, no, cansado, feliz, aqui, hospital | «Eu estou cansado, mas estou feliz.» |
| 5 | O que você gosta de fazer? | gostar de + infinitivo; -ar/-er/-ir preview | gosto, gosta, falar, comer, assistir, filme, música, pizza | «Sam gosta de comer pizza e assistir filme.» |
| 6 | Eu sou, estou, tenho e gosto | CHECKPOINT — recall only, 0 new atoms | (recall: sou, é, estou, está, tenho, tem, gosto, gosta) | «Eu estou feliz porque sou estudante, tenho amigos e gosto do Brasil.» |

## Vendored emoji
487 glyphs vendored under `src/pub/noto-emoji/svg/`. Full glyph -> filename
lookup: `docs/pt-emoji-index.generated.json` (regenerated by this script). Check before
using an emoji in a spec: `node -e 'import("./scripts/author/pt/lib/emojiIndex.mjs")
.then(({buildEmojiIndex})=>console.log(buildEmojiIndex("src/pub/noto-emoji/svg").has("🎓")))'`
— flags use `src/pub/region-flags/svg/<ISO>.svg` instead (not in this index).

## Taught vocabulary so far (generated from `courseAtoms.m1-l*.ts`)
**m1 L1** (8): olá (hello), eu (I), você (you), sou (I am), é (is / are), estudante (student), professor (teacher (m)), Brasil (Brazil)
**m1 L2** (8): de (of / from), onde (where), do (from the (masc.) — de + o), da (from the (fem.) — de + a), cidade (city), país (country), França (France), Califórnia (California)
**m1 L3** (8): tenho (I have), um (a / an (masculine)), gato (cat), uma (a / an (feminine)), irmã (sister), amigo (friend), família (family), tem (you have / he/she has)
**m1 L4** (8): estou (I am (temporary state)), está (is / are (temporary state)), em (in, at), no (in the (masc.) — em + o), cansado (tired), feliz (happy), aqui (here), hospital (hospital)
**m1 L5** (8): gosto (I like), gosta (you like / he or she likes), falar (to speak, to talk), comer (to eat), assistir (to watch), filme (movie, film), música (music), pizza (pizza)

## Persona / cast
Learner: **Sam** (cross-course convention). NPCs: **Bia, Pedro, Rafael** (candidates,
not locked — verify naturalness before authoring). Places: Brasil, São Paulo. Variant:
pt-BR only (§3) — você-default, gerund `estar + gerúndio`, proclisis.

## Commands
```
node scripts/author/pt/from-spec.mjs specs/pt-m1-l<n>.yaml   # generate
bash scripts/author/pt/check.sh <n>                          # gate
node scripts/author/pt/pack.mjs                               # regenerate this pack
```
