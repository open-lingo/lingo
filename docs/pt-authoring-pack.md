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
- No `ir/m1.ir.yaml` module-level base file exists yet (module/title/
  expectedLessonCount/checkpoint/placement) — `compile-ir-pt.mjs m1` cannot run
  end to end until one lands; `check.sh` skips that step by name until then.
- L1/L3/L4/L5's real committed fragments each guessed a DIFFERENT top-level shape
  before the fragment-merge compiler landed (L1: `lesson:`+`newAtomSurfaces:`; L3:
  `module:`+`lesson:`; L4: flat `lessonNumber:`+`newAtoms:`; L5: flat `n:`+`newAtoms:`).
  Only L2 and everything `from-spec.mjs` generates match the compiler's real
  `lesson:` + `atoms:` schema — `check.sh` only checks THAT shape.
- No `speak` role: a SPEC's only `speakLit` is the closing win — real hand-authored
  lessons also print a NEW form's first voicing mid-lesson before it becomes a cloze
  answer (retention-rhythm law 3). A sim's `scene` (emoji/title/setting) also isn't
  spec-configurable yet; the generator defaults to a generic 💬 + the lesson title.
- The generated `map` step only pairs tokens that match a registered `words:` surface —
  a bare persona name (e.g. "Sam") goes unmapped unless you also list it as a word.

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
- imageMcq: max 2 per lesson, never adjacent, only on a noun's debut.
- Every lesson closes: `sim` -> `matchLit` (>= 6 pairs) -> `speakLit`-win.
- Step-count band: 10-25.
- Gloss-aspect rule: the English gloss must carry the form's aspect lexically
  (preterite = simple past, never "was going"/"used to"; no progressive; `ir + inf`
  glosses "going to X", never "will X") — one line in `grammar`/`info`, never left implicit.
- Ser/estar minimal pairs get an explicit `antiPattern` (design doc §3).

## SPEC format
```yaml
lesson: 3                      # 1-5 (m1 only, this lane's scope)
id: pt-m1-l3                   # lesson id, matches the spec's filename
title: "Eu tenho uma família"
grammar: "ter present sg.; um/uma agreement"   # one line -> the info step
info: "..."                    # optional, <=3 lines plain English (defaults to grammar)
words:                         # <= 8 new atoms, debut order
  - { pt: família, en: family, pos: noun, gender: f, emoji: "👨‍👩‍👧", cognate: true }
  - { pt: tenho, en: "I have", pos: verb-form, of: ter }
sentences:                     # roles drive step generation; uses = credited atoms
  - { pt: "Eu tenho uma família grande.", en: "I have a big family.", roles: [build, debut], uses: [tenho, família] }
  - { pt: "Você tem um irmão?", en: "Do you have a brother?", roles: ["cloze:tem", listen], uses: [tem, um, irmão] }
agreement: [{ m: "um irmão", f: "uma irmã" }]     # optional -> agreementLit
dialogue: { npc: Bia, turns: [{ npc: "Você tem família aqui?", gloss: "...", goal: "...", options: ["Tenho, sim.", "Sou estudante."], correct: 0 }] }
win: { pt: "Eu tenho uma família e um gato.", en: "I have a family and a cat." }
```
Roles: `build`, `listen`, `cloze:<word>`, `debut` (waives the tile floor). A word
tagged `build` whose `uses` includes a contraction is forced to `cloze:` automatically.

## `words:` entry fields
| field | meaning |
|---|---|
| `pt` | surface form, required |
| `en` | English gloss, required |
| `pos` | noun/verb/verb-form/particle/adjective/adverb/pronoun/proper-noun/interjection;
  `verb-form` folds onto `verb` in the emitted atom (`Atom.partOfSpeech` has no such member) |
| `gender` | `m`/`f`, nouns only |
| `emoji` | enables imageMcq debut; check it's vendored first |
| `cognate` | documentation only — front-loads it as a low-risk debut, no generator effect yet |
| `falseFriend` | documentation only — flags for a future antiPattern step |
| `of` | which verb a conjugated `verb-form` belongs to, documentation only |
| `hint` | pronunciation nudge, carried straight to the atom |

## Vendored emoji
487 glyphs vendored under `src/pub/noto-emoji/svg/`. Full glyph -> filename
lookup: `docs/pt-emoji-index.generated.json` (regenerated by this script). Check before
using an emoji in a spec: `node -e 'import("./scripts/author/pt/lib/emojiIndex.mjs")
.then(({buildEmojiIndex})=>console.log(buildEmojiIndex("src/pub/noto-emoji/svg").has("🎓")))'`
— flags use `src/pub/region-flags/svg/<ISO>.svg` instead (not in this index).

## Taught vocabulary so far (generated from `courseAtoms.m1-l*.ts`)
**m1 L1** (8): olá (hello), eu (I), você (you), sou (I am), é (is / are (you, he, she)), estudante (student), professor (teacher (m)), Brasil (Brazil)
**m1 L2** (8): de (of / from), onde (where), do (of the / from the (before an o-word)), da (of the / from the (before an a-word)), cidade (city), país (country), França (France), Califórnia (California)
**m1 L3** (8): tenho (I have), tem (you have / he/she has), um (a / an (masculine, o-words)), uma (a / an (feminine, a-words)), família (family), irmã (sister), amigo (friend), gato (cat)
**m1 L4** (10): estou (I am (temporary state)), está (is / are (temporary state)), em (in, at), no (in the (masc.) — em + o), na (in the (fem.) — em + a), cansado (tired (masc.)), cansada (tired (fem.)), feliz (happy), aqui (here), hospital (hospital)
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
