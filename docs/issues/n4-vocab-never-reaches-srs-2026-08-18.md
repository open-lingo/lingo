# m30 and m31 taught 29 words that could never be reviewed — fixed

**Found** 2026-08-18 by the scene vocabulary gate, as a side effect rather than
as its job. **Fixed the same day**; the gate that prevents recurrence is
`irAtomRegistration.test.ts`.

## The defect

A word reaches a learner through the IR (`newAtoms:` + `lessons[].introduces`).
A word reaches the **flashcard deck** through `courseAtoms.ts` — `courseDeck.ts:4`
is explicit: *"The course deck is derived from `JA_COURSE_ATOMS` — the real
curriculum vocab"*. Nothing checked that the two agreed.

An atom declared only in the IR is visible to the module compiler's tokenizer
and to nothing else. So these words were taught in lessons, graded in lessons,
and could never enter the deck. They were taught once and then structurally
could not come back.

**m31 is titled あげる・くれる・もらう. あげる was registered. くれる and
もらう were not.**

## Correcting two things I got wrong on first reading

Both matter, because they change what the right fix is.

1. **"The IR can't tell a new word from a new form."** False — it can, and it
   does. `newAtoms` entries carry `kind: verb` vs `kind: verb-form` plus
   `derivedFrom:`. The distinction the fix needs was already authored. That is
   why the gate below is precise rather than heuristic.
2. **"Nobody noticed."** Also false. "IR-only atoms" is a deliberate, documented
   pattern going back to m12, and there is a real reason for it: **a
   `courseAtoms` row joins the COURSE-WIDE tokenizer**, so adding one can
   re-tokenize sentences in unrelated modules. This repo has a name for that
   hazard — the m16-ので regression class — and both m22 and m25 dumped every
   compiled tile in the course before and after adding rows to prove the diff
   was empty.

So this was not an oversight with no downside. It was a conservative call whose
cost — the word never becomes reviewable — was not being counted.

## Measured

Sweeping every `mN.ir.yaml` `newAtoms` against every kana/kanji surface in
`courseAtoms`, counting **lemma kinds only** (excluding `verb-form`, `adj-form`,
`tai-form`, and anything carrying `derivedFrom`):

| | lemma `newAtoms` | unregistered |
|---|---|---|
| whole course | 405 | 50 |
| m30 | 18 | 14 |
| m31 | 22 | 17 |

**Do not quote a course-wide percentage over raw `introduces` lists.** That
number is ~31% and it is meaningless: most of the gap is inflections
(たべました, たかくない, まって) which correctly are not atoms, because
registering an inflection regresses two shipped behaviours — the flashcard
importer stops mapping 食べました back to たべる, and the annotator stops
splitting のみました into stem + ました.

## Fixed

**29 rows registered** (m30: 12, m31: 17), every one `blocked: true` because
every one is `imageable: false` in the IR, and none carries an emoji — which is
allowed: `isSrsEligibleAtom` rejects only SINGLE-kana atoms with no emoji, and
all 29 are multi-kana. They get a text flashcard, which is the entire point.

**Two deliberately NOT registered:** m30's かっとく / しとく. The IR tags both
`kind: vocab`, but かっとく is かって + おく contracted — a derived form wearing
a lemma's tag. Registering them would put a contraction in the deck as if it
were a word. **The IR mis-tag is the real bug and is still open.**

### Retokenization proof

The m22/m25 method, run in full: every build tile, target sentence and prompt
audio string in the whole JA course dumped before and after — **6,113 rows.**

| | |
|---|---|
| `TARGET:` / `AUDIO:` lines changed | **0** — no sentence anywhere re-tokenized |
| `TILES:` rows changed | 146, **all in m30/m31**, 0 in any earlier module |
| what changed in them | decoy tiles only; the answer tokens are identical |

The tile changes are `buildTileFloor` drawing decoys from a pool that now has 29
more words in it — confined to the two modules that own those words.

## The adjacent defect this surfaced, still open

Registering the words made them visible to two audits that had never been able
to see them, and both went up:

- `MAX_GRADED_BUT_NEVER_WRITES` 18 → 26
- `MAX_PRODUCTION_ONLY_INTRODUCED_ATOMS` 21 → 26

Both constants were raised with the reasoning written into the test, because the
audited *population* grew — this is newly **visible** debt, not newly **created**
debt, and the learner's experience did not change by one step. Same bookkeeping
as that file's own 104 → 140 entry.

But one part of it is a real content defect and is NOT fixed:

**Four m30 verbs are graded exactly once each, in a `build_sentence` step** —
しらべる, きめる, つづける, おくる. A learner must PRODUCE しらべる from memory
on the only exposure the word ever gets, with no recognition beat first. Same
shape for m31's おめでとう and よろこぶ. `しんせつ` has ten exposures and every
one is production.

That is m30/m31 content work — recognition beats, then a recompile and new TTS —
not registry work, so it is filed rather than smuggled into this fix.

## The gate

`src/features/languages/ja/__tests__/irAtomRegistration.test.ts`.

It asserts the reverse arrow `moduleConformance` never had: **every lemma-kind
`newAtom` must resolve to a `courseAtoms` row.** m30+ has no exemption list at
all. Pre-N4 debt (19 words — the すぎる family, んだ/んです, ならない, よ/ね)
is frozen in a set that may only shrink, and a fourth test fails if an entry in
that set has since been registered, so the ratchet cannot rot in either
direction.

It deliberately does **not** auto-register anything. It fails and names the
word; a human adds the row with the tile diff in hand, because of the tokenizer
hazard above.

Verified non-vacuous: commenting out the くれる row makes it fail with
`m31 くれる (verb) — "to give (in to my side)"`.
