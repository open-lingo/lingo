# m30 and m31 teach 29 words that can never be reviewed

**Found** 2026-08-18, by the scene vocabulary gate — as a side effect, not as its
job. **Severity: blocks N4 authoring**, because authoring m32–m34 the same way
triples it before anyone notices.

## The defect

A word reaches a learner through the IR (`lessons[].introduces`). A word reaches
the **flashcard deck** through `courseAtoms.ts`. Nothing checks that these two
lists agree, and for the two N4 modules they badly do not.

`courseDeck.ts:4` — *"The course deck is derived from `JA_COURSE_ATOMS` — the
real curriculum vocab"*. So a word absent from that registry gets no card, no
FSRS state, and is never reviewed. It is taught once and then structurally
cannot come back.

## Measured

Sweeping every `mN.ir.yaml` against every kana/kanji surface in `courseAtoms`:

| | introduced in IR | absent from `courseAtoms` |
|---|---|---|
| whole course | 582 | 182 (31.3%) |
| m30 | 34 | 30 |
| m31 | 36 | 31 |

**The 31.3% headline overstates it and should not be quoted.** Most of the
course-wide gap is *inflections* — たべました, たかくない, たべたい, まって —
which are correctly not atoms, because they are forms of a word that is one.
Excluding those, the real unregistered vocabulary is:

**m30 — 12 words:** とりあえず · さいしょ · しらべる · きめる · つづける ·
けっか · よやく · じゅんび · せつめい · おくる · こたえ · れんしゅう

**m31 — 17 words:** くれる · もらう · くださる · いただく · プレゼント ·
はなたば · おれい · ケーキ · おみやげ · こんど · おいわい · きねん · カード ·
おめでとう · うれしい · しんせつ · よろこぶ

**29 words.** Including **くれる and もらう — the two verbs m31 exists to
teach.** The module is titled "Give & receive I: あげる・くれる・もらう";
あげる is registered, the other two are not, so two thirds of the module's
headline content is unreviewable.

## Why no existing gate caught it

`moduleConformance` enforces the arrow in one direction — every ATOM must be
introduced before it is exercised. Nothing enforces the other — every word
INTRODUCED must be an atom. A word that exists only in the IR is invisible to
it, because it is invisible to `courseAtoms`, which is what conformance reads.

The N5 modules do not show the problem at this scale because their atoms were
restamped into `courseAtoms` (see `docs/fromModule-restamp-report-2026-08-09.md`).
The restamp was a one-off pass, not a gate, so the two N4 modules authored after
it drifted straight back apart.

## Blast radius

- **29 words** with no flashcard today.
- **Every future N4 module** unless the loop changes. At the spine's 30–38 atoms
  per module (`spine-n4.md` D2) × 20 remaining modules, this is on track to be
  **~600 unreviewable words** by the end of the tier.
- Not a data-loss bug: the IR is intact and the words are taught correctly in
  lessons. Everything needed to fix it is already authored.

## Fix

Two parts, and the second is the one that matters:

1. **Backfill** the 29 into `courseAtoms.ts` with `fromModule: m30`/`m31`, each
   with an emoji per the vocab-card art rule, vendoring any SVG not already in
   `src/pub/noto-emoji/svg/`.
2. **Gate it**, so the next module cannot drift: assert that every
   `lessons[].introduces` entry either resolves to a `courseAtoms` surface or is
   a recognised inflection of one. Inflections are the whole difficulty —
   the check needs a conjugation-aware resolver or an explicit
   `introducesInflection:` field in the IR to separate "new word" from "new form
   of a known word". **The IR currently does not distinguish these**, which is
   the root cause rather than an implementation detail.

Do (2) before authoring m32, or the backfill list grows by ~30 per module.
