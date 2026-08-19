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

- ~120 never-touched rows. They cost nothing at runtime; they cost authoring
  time, because an author reading `courseAtoms` sees a vocabulary the course
  does not have. **しんぶん** is the live example worth naming: `fromModule:
  "m8"`, `introducedByLessonId: "ja-m4-1-1"` (retired), zero m8 lesson steps
  contain it — and **m30 uses it in a lesson**. Same defect as the 15 above,
  one module later.
- No guard exists for "row exists, nothing teaches it". The exposure audit's
  `untouched` count is the closest thing and it is a ratchet, not a gate.
