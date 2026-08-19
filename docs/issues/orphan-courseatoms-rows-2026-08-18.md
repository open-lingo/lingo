# Orphan `courseAtoms` rows: words the course registers but never teaches

**Filed** 2026-08-18, out of the m32 authoring wave · **Status** partially repaired

## What an orphan row is

`lessonAtomIndex.ts` unlocks an atom by exactly two paths:

1. a static `introducedByLessonId` — honoured only if that lesson still EXISTS
   (B068; a dangling pointer is dead and falls through to path 2);
2. the m8+ module fallback — the atom's module's lessons, filtered to atoms
   whose **surface form appears in one of that module's lesson steps**.

So a row is reachable only if some lesson actually prints its surface. A row
that no lesson prints is **unreachable by any path**: it is never unlocked,
never seeded, never in the deck. Not a leak — dead weight.

A second, worse variant: `fromModule: "future"` on a word a real module
teaches. `future` sorts after every module, so the atom is unreachable even
though the learner meets it in a lesson.

## Measured

| Finding | Count | Status |
|---|---|---|
| `fromModule: "future"` on atoms a real module teaches | 15 | **repaired** (m32 wave) |
| Dangling `introducedByLessonId` pointers | 199 | not a defect — B068 already falls back |
| Rows never touched by any live lesson | ~120 of 961 | open |
| m17 direction words used by curated stories but taught nowhere | 7 | **repaired** — adopted by m32 |

The 15 repaired: きょうだい, はたち (m17) · ちかてつ (m19) · どっち (m20) ·
ひこうき, つく (m23) · ふる (m25) · どうぶつ, おもい, ことば (m26) · かみ,
つくえ (m27) · うるさい (m28) · ふたつ, うる (m9).

## What the repair cost, and why that is the interesting part

Retagging is one field per row and changes no tokenizer entry, but it makes
the atom **visible to the guards for the first time**, and three of them bit:

- **invariant 30** (imageable module-new atoms debut on `word_image_mcq`):
  five atoms could not satisfy it. Every one already had a written reason in
  its module's own IR notes — 🔞 is an age-restriction sign, 👫 reads as two
  friends, ✈️ is りょこう's, 🌧️ is あめ's, 🪑 is いす's. The rows now carry
  `blocked: true`, which is where that decision belonged all along.
- **the story comprehensibility gate**: five curated stories were built on the
  m17 direction kit (みち / みぎ / ひだり / まっすぐ / まがる / わたる / とまる).
  m17's IR introduces none of them and no m17 lesson step contains their
  surfaces — the stories had been showing untaught vocabulary since they
  shipped. The two direction stories moved to m32; the other three swapped one
  word each.
- **the exposure ratchet**: +3, all m32's own new atoms, the shape the audit's
  own header already describes (D2 blocks the same-module write, D4 seeds them
  due next day).

## Still open

- ~120 never-touched rows. **CORRECTION 2026-08-19: they do NOT cost nothing at
  runtime.** This section originally said they were authoring-time debt only.
  `lesson/data/matchPairsFloor.ts` backfills any short `match_pairs` grid from
  `getAtomsUpToModule(moduleId)` filtered by SRS-eligibility and module tag —
  **with no unlock or reachability check** — so an orphan row can be dealt into
  a grid as a word the learner has never been taught. The es path in that file
  carries a `moduleOrder` cutoff for exactly this reason; its own comment says
  the ja path ignores it.

  Measured 2026-08-19 by diffing every JA lesson before/after the floor pass:
  the pass adds **101 pairs course-wide**, of which **8 cells show a word no
  lesson teaches** — ぎんこう (m6 L1/L3/L4/L6/L7, 6 cells), おなじ (m27 L9),
  しんぶん (m32 L6). The remaining 93 are single kana/katakana glyphs in
  kana-row grids, which are deliberately not SRS atoms — not a defect.

  The pool behind it: **904 atoms pass the backfill filter, 276 appear in no
  authored lesson**; 160 of those are `future`/`m49`/`thr-n4`-tagged and
  unreachable by construction, leaving **116 drawable orphans** across m6–m29
  (worst: m19 ×14, m17 ×11, m21 ×11, m16 ×8). Only 3 surface in a default
  render because only 101 grids run short — a learner's dynamic review prefix
  builds different grids, so 116 is the ceiling, not 3.

  **しんぶん** is the live example worth naming: `fromModule: "m8"`,
  `introducedByLessonId: "ja-m4-1-1"` (retired), zero m8 lesson steps contain
  it. It was ALSO in m32 L1's authored review pool (removed in `90b613b5`) —
  but the cell visual QA caught is in m32 **L6** and is floor-injected, so the
  IR edit did not remove it and recompiling will not. Same defect as the 15
  above, one module later.
- No guard exists for "row exists, nothing teaches it". The exposure audit's
  `untouched` count is the closest thing and it is a ratchet, not a gate.

## Third surface, found and closed the same day (2026-08-19)

The match-grid backfill is not the only place an orphan row reaches real work.
`scripts/authoring-context.mjs` — the per-module briefing every authoring
dispatch starts from — decided a word was already known with
`priorCorpus.includes(kana)`, a substring test over raw YAML including prose
notes. So しんぶん was recommended to m33 as a reinforcement carrier on the
strength of its ONE appearance in the entire course: an m30 authoring note
listing it among the words CUT for being untaught.

That is the same defect wearing a third costume, and it has been paid for
twice already — m23 and m30 both stripped pack-recommended words by hand, m30
at scale ("all 'known' according to the pack and untaught according to every
earlier module's IR").

Fixed in `4d42c360`: the pack now reads the predecessor module's COMPILED
`priorVocab` (+ `newAtoms` + `priorAtoms`), which `compile-ir.mjs` already
derives honestly — quoted-declaration matching, reviewPool assertions,
earlier-module `introduces`. The text scan stays only as the bootstrap path
for a module with no compiled predecessor. m33's known list lost 94 words, all
of them the untaught population.

So the open question in R16 now covers two surfaces, not three: the match-grid
backfill, and the atom table an author reads directly.
