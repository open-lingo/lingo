# Disambiguating kana homophones — what exists, what it costs, what's possible

**Status:** investigation, no code changes. Needs a ruling from Spencer.
**Asked:** 2026-08-15, during the m31 walk — "we need some way to differentiate
between homophones, can you look into possibilities".
**Trigger:** 花 stays kana in every sentence at every module even though the
glyph unlocks at m18, because はな resolves to two atoms.

---

## What's already here

More than I expected. The problem is named, ruled on, and test-guarded —
what's missing is a mechanism for the losing sense, and the guard says so in
as many words:

> "To teach a losing sense the course needs a disambiguation mechanism first
> (a kanji surface, or a compound). Until then, pick a different word."
> — `__tests__/homographTeaching.test.ts`

- **`JA_PRIMARY_ATOM_BY_KANA`** (`courseAtoms.ts:1460`) — 16 entries ruling
  which atom a bare kana means. Written after a real bug: a はな sentence
  displayed "flower" while crediting SRS to 鼻 "nose", because two maps
  disagreed (first-wins vs last-wins).
- **`homophoneAtomResolution.test.ts`** — fails if a new collision appears
  without a ruling, or if the two maps diverge again.
- **`homographTeaching.test.ts`** — you cannot TEACH the losing sense. A word
  image MCQ for 「あめ = candy」 would render fine, mark the learner correct,
  and credit 雨 "rain". So the loser is banned from teaching outright.
- **`resolveEligibleKanjiAtomId`** (`grammarHelpers.ts:190`) — gate 1 is
  `kanaAtomCount() !== 1 → refuse`. It does NOT consult the ruling table.

Its docstring is stale in one detail: it says "17 kana are ambiguous". The
live count is **16**.

## Measured scope

**16 colliding kana / 932 atoms.** Two distinct harms, and they need
separating because they have different fixes.

### Harm 1 — display: the winner never shows its kanji

Only **three** words are blocked from kanji *solely* by the homograph gate.
Every other collision has a winner that isn't kanji-eligible anyway, so
lifting the gate would change nothing for them:

| kana | winner | unlock | shipped sentences |
|---|---|---|---|
| はな | 花 flower | m18 | 13 |
| あめ | 雨 rain | m18 | 10 |
| はやい | 早い early | m26 | 2 |

### Harm 2 — teaching: the losing sense is unreachable

The tokenizer has no way to emit the loser, so it can never be identified,
never accrues SRS credit, and cannot be taught at all. Currently locked out
and **already tagged to a real module** (i.e. someone meant to teach them):

鼻 nose (m1) · 風邪 a cold (m2) · 歯 tooth (m20) · 橋 bridge (m17) ·
撮る to photograph (m16) · 速い quick (m8) · 貼る to stick (m14) ·
熱い hot-to-touch (m8)

This is the bigger curriculum constraint. m22 is a body/illness module that
cannot teach "tooth" or "a cold" — its own source comment says so.

---

## Options

### A. Let the ruling table drive display (fixes harm 1)

`resolveEligibleKanjiAtomId` accepts `JA_PRIMARY_ATOM_BY_KANA[kana]` instead
of refusing on count > 1. The ruling table already exists to answer exactly
this question.

The obvious objection is that a sentence meaning the loser would render the
wrong kanji — 「はしを わたる」 (cross the bridge) painted 箸. So I measured
it rather than argued it. Every shipped sentence containing an ambiguous
kana as a word, against its ruled sense:

| kana | shipped sentences | mean the WINNER | mean the loser |
|---|---|---|---|
| はな | 13 | 13 | **0** |
| あめ | 10 | 10 | **0** |
| あつい | 10 | 10 | **0** |
| はやい | 2 | 2 | **0** |
| はし | 0 | — | — |
| とる | 0 | — | — |

**35 sentences, zero wrong.** The corpus is already entirely
ruling-consistent, which is what `homographTeaching.test.ts` was always going
to force. Residual risk is future authoring, and it's closable with a lint in
the same family: fail if a sentence's English gloss names the loser's meaning.

**Cost:** a few lines plus that lint. **Benefit:** 花 and 雨 render as kanji
from m18 — the two Spencer will notice.

### B. Kanji-first surface for the losing sense (fixes harm 2) — RECOMMENDED

Register the loser with its kanji AS the surface string: `鼻`, not `はな`.
Distinct string, no collision, nothing else changes. This is the mechanism
`homographTeaching.test.ts` names first, and `kanji_reading` already proves
the shape — it authors `surface === reading === kanji` directly and the
surface pass leaves it alone.

Requires m8+ (kanji recognition floor) and furigana until mastered, which is
already how the rollout works. It is also what Japanese itself does: these
words are only ambiguous *in kana*, and the writing system is the
disambiguator.

**Cost:** per-word authoring, plus deciding each loser's home module.
**Benefit:** unlocks 歯 / 風邪 / 鼻 / 橋 / 撮る for teaching, and they arrive
already carrying the distinction rather than needing it explained.

### C. Compound-only teaching

Teach the loser only where the kana can't be ambiguous — 風邪を ひく,
はなみず. No infrastructure at all. Limited, and it doesn't fix display.
Useful as a stopgap for one or two words, not a mechanism.

### D. Author-declared sense at the call site

Let an IR beat name the atom by id (`はな:hana-nose`); the compiler strips the
tag for display, audio and grading and threads the atomId into the
annotation. This is literally what the ruling docstring already prescribes —
"a module that needs the other sense must reference it by id, not by kana" —
it just has no IR syntax today.

**Cost:** IR syntax + compiler plumbing + a per-token hint path through
`buildSentenceAnnotation`. Per-occurrence authoring burden.
**Benefit:** exact, and the only option that handles a sentence that genuinely
means the loser. Right as the escape hatch, wrong as the default.

### E. Sense-tagged atom keys — NOT recommended

Re-key the registry so kana isn't the identity. Touches the tokenizer, audio,
TTS hashing (`sha256("ja:<text>")`) and every stored SRS key. The cost is the
whole course; the benefit is available more cheaply from B.

---

## Recommendation

**B for teaching, A for display, D later as the escape hatch.** They're
independent and can land in any order.

The immediate thing, and the smallest: **花 needs an authored `kind: kanji`
beat.** That works today with no new mechanism — it's the route 先生 took
(two beats in m28) — and it answers the original complaint directly. Which
module it lands in is a curriculum call; m31 currently ships four kanji beats
(友達 / 切符 / 家族 / お金) and a fifth would change its shape.
