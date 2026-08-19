# Teaching あげる・くれる・もらう — pairing, lesson budget, and register drip

**Status:** investigation. No code or content changed. Needs rulings from Spencer.
**Asked:** 2026-08-15, mid-walk — "the give and receive words are taught a little
weird… maybe put ageru and kureru in the same lesson? the 15 examples of kureru
are a little non diverse… we also dont mix in enough formal into these."
Plus, on the L3 tile: "going over に here to define the receiver is already
learned context from the lesson itself… もらう there would be a better use."

---

## 1. The course already has the rule. m31 is the one module that doesn't follow it.

There is a standing, course-wide ruling that says exactly what Spencer's
instinct says — and it is quoted in the spine three times:

> **RUN-PLAN standing decision 5: *pairwise contrast on introduction, N-way
> only on review*.**
> — `docs/spine-n4.md:902`

And the reasoning attached to it is a description of the symptom he just felt:

> "Presenting four near-synonymous conditionals together optimizes for the wrong
> thing: it makes the DISTINCTIONS salient at the moment the learner has no
> fluency in any of them, and every retrieval afterwards has to run a four-way
> disambiguation that the learner cannot yet perform. The result is the classic
> N4 symptom — all four are 'recognized', none is produced."
> — `docs/spine-n4.md:905-909`

The ruling is honoured everywhere else:

| Module | Pair introduced together | Why |
|---|---|---|
| m16 | は / が | the course's original contrast lesson (inv 35) |
| m24 | きく / きこえる | same module, gap 0 |
| m17 | のる / おりる | same module, gap 0 |
| m32 (n4-03) | たら **+ と** | "と ships here rather than later because it is たら's true minimal pair" |
| m33 (n4-04) | six 自動詞/他動詞 pairs | a pair is taught AS a pair, never as a 30-row table |
| m39 (n4-10) | のに against ので | "could only be introduced pairwise once ので was old" |

m31 introduces three near-synonymous verbs **strictly sequentially** — あげる
(L1), くれる (L2), もらう (L5) — which is the N-way-on-introduction shape the
ruling exists to prevent.

### Why pairing here does NOT break the one-axis law

The obvious objection is the spine's other rule — "never more than one axis per
module" (`spine-n4.md` §3.4). It does not bite, and the reason is internal to
the spine's own table: m31's axis is

> "DIRECTION — who points at whom (うち/そと)"

**A direction cannot be taught with one direction.** あげる and くれる are not
two axes, they are the two poles of the one axis the module exists to install.
Pairing them isn't adding a dimension; it *is* the dimension. Decision 5
doesn't merely permit the pairing here — it argues for it.

The module's own rule card already teaches them as a pair. It says so
literally: *"they are ONE EVENT SEEN FROM OPPOSITE ENDS."* The prose pairs
them; only the lesson structure separates them.

---

## 2. The monotony is measurable, and it is front-loaded

Distinct surface forms of the payload verbs, per lesson (compiled IR, unique
JA surfaces):

| lesson | teaches | transfer sentences | verb forms present |
|---|---|---|---|
| L1 | あげる | 13 | **あげる ×13** |
| L2 | くれる | 13 | **くれる ×12, あげる ×1** |
| L3 | に-recipient | 13 | **あげる ×13, くれる ×1** |
| L5 | もらう | 14 | もらう ×11, もらい ×4, あげる ×1 |
| L7 | the ban | 13 | くれる ×3, もら ×3, あげない ×3, あげた ×2, くれない ×2, もらい ×1, あげる ×1 |
| L10 | honorific | 12 | あげた ×5, もらった ×3, いただい ×2, くれた ×1, もら ×1, くれる ×1, くださった ×1, あげる ×1 |

The first **three** teaching lessons ship **39 transfer sentences carrying
essentially two verb forms**. The single あげる in L2 and single くれる in L3 are
tokens, not contrasts — one sentence each, never in a forced choice. Real
variety doesn't start until L7 (7 forms) and L10 (8 forms).

That is the monotony, and it is not a content-authoring miss — it is what
one-verb-per-lesson produces by construction.

---

## 3. L3 is redundant, and the numbers are blunt

Spencer: "going over に here to define the receiver is already learned context
from the lesson itself."

Correct, and by a wide margin. Recipient に is in the module's very first
sentence — 「ともだちに プレゼントを あげる。」 — and:

| lesson | transfer sentences carrying a recipient/source に |
|---|---|
| **L1** (あげる) | **10** |
| **L2** (くれる) | **4** |
| **L3** (に-recipient — the lesson that *introduces* it) | **5** |

By the time L3 opens, the learner has produced recipient に **14 times**. L3
then uses it in **five** of its own thirteen sentences — fewer than L1 did. The
lesson dedicated to the particle drills it less than the lesson that had not
yet "taught" it.

L3's remaining eight sentences are a third pass of plain あげる.

**The point id can stay; the lesson does not have to.** The IR argues hard
(m31.ir.yaml:76-81) that recipient-に is a genuinely different function from
`ni-location` and filing it under that id "would put a lie in the learner's SRS
history." That argument is about **SRS filing**, not about lesson budget. Keep
`ni-recipient` as a point, attach its rule card to L1 where the particle
actually debuts, and spend the slot elsewhere. Nothing in the SRS ledger moves.

---

## 4. Restructure options

### A. Merge L1 + L2 into one "the axis" lesson — RECOMMENDED core

One rule card teaching both poles (the くれる card is already written as a
contrast), and **every drill after the first two is a forced choice between
them**. This is the shape decision 5 prescribes and the shape m32 ships.

- Frees **one** lesson slot immediately, **two** with L3 folded in.
- Cost: the m14 layout law (one `kind: rule` beat per lesson) means a single
  card must carry both verbs. The existing kureru card almost does.
- Risk: the module's opening lesson becomes its hardest. Mitigation is
  ordering — plant あげる in the first 3–4 beats alone, then start the choice.

### B. Keep two lessons, make L2 genuinely contrastive — cheaper

L1 introduces あげる alone (one pole has to be planted first). L2 introduces
くれる and **every drill from that point is a choice**, not a repetition. Fixes
the monotony without touching the module's shape or lesson count.

This is the smaller version of A and can be done as a content pass on m31 alone.

### C. A first-class contrast beat — serves the whole course

Today the only forced-choice-between-verbs surface in m31 is the
`particle-cloze` with verb options — **one per lesson**, and the module notes
(m31.ir.yaml:169-181) explain why they had to bend inv 5 to get even that.

A `kind: contrast` beat — one event, two framings, pick the verb — would give
every pair in the course a native step type instead of a workaround. It is the
step type m32's たら/と, m33's transitivity pairs and m39's のに/ので all need
too, so the cost amortises across the tier rather than landing on m31.

### The freed slots

With L1+L2 merged and L3 folded in, m31 gains **two** teaching slots. Spencer's
suggestion for one of them is もらう, and that is the right call: もらう is the
verb that "rearranges the sentence rather than just pointing it" (its own rule
card), it is the one the spine flags as the most-used in speech (CEJC #98,
above both くれる #114 and あげる #171), and it currently gets **one** teaching
lesson to あげる's **three**.

Proposed shape:

| | today | proposed |
|---|---|---|
| L1 | あげる | **あげる + くれる — the axis** |
| L2 | くれる | **もらう — the receiver takes the topic** |
| L3 | に-recipient | **もらう II — に/から source, word variety** |
| L5 | もらう | the ban (×わたしにあげる) |
| L6 | から-origin | past forms |
| L7 | the ban | honorific recognition |
| L9 | past | viewpoint / omission |
| L10 | honorific | *free* |
| L11 | viewpoint | *free* |

---

## 5. Register — the constraint is much softer than it looks

### What is actually measured

Polite surfaces (です/ます/ません/ました/でした/ましょう/でしょう) as a share of
unique JA surfaces, per compiled module:

| m6 | m7 | m8 | m10 | m13 | m22 | m23 | m25 | m29 | m30 | m31 |
|---|---|---|---|---|---|---|---|---|---|---|
| 0% | 85% | 12% | 43% | **1.3%** | 25% | **0%** | 45% | 52% | **1.5%** | **1.7%** |

Course-wide **16.1%** (799 / 4,959) — but that is carried almost entirely by
the four register-focused modules (m7, m10, m25, m29). Outside those it is ~8%,
and there are stretches of 10+ lessons at effectively zero: m13, m23, m30, m31.

**25 of 26 IR modules declare `register: plain`. Only m29 is `mixed`.**

m31's three polite surfaces are all in the challenge lesson:

```
らいげつ りょこうに いきますよ。
はい。おみやげを いただくんです。
ぼくは たなかせんせいに おれいの てがみを あげるんです。
```

### What is actually enforced

This is the part that matters, because the constraint is assumed to be much
harder than it is:

1. **`ModuleIR.register` is metadata.** `moduleCompiler.ts:235` declares it and
   **nothing reads it** — not the compiler, not a test. It records authoring
   intent; it enforces nothing.
2. **`registerScaffoldIsolation.test.ts` fences the SCAFFOLDING, not the
   forms.** It asserts that `audienceEmoji`, `audienceLabel`, `politenessHint`,
   `referenceTable`, `frameBefore`/`frameAfter` can only reach a step through a
   `kind: register` beat. It says nothing about polite verb forms appearing in
   ordinary sentences.
3. **The only hard ban in m31 is m31's own test** —
   `m31-neo.test.ts:602`, *"no POLITE form of the three verbs is registered or
   shipped"*: あげます / くれます / もらいます specifically.

**So sprinkling polite forms into ordinary teaching lessons violates nothing
course-wide.** It is an authoring convention, not a machine invariant. The only
thing in m31's way is one module-local test with a stated rationale.

### Three ways to get the muscle worked, cheapest first

**(a) Polite frame, plain content — available today, breaks nothing.**
Politeness rides on んです (m27) while the transfer clause stays plain:
「ともだちが プレゼントを くれるんです。」 This is exactly what m31's challenge
dialogue already does, and the module notes bless the pattern —
*"politeness is carried ONCE and carried at the end"*. It could ship on second
appearances (L9, L10) instead of only in the challenge.

**(b) Let the honorific pair carry the formality, and let it be produced.**
L10 already teaches くださった / いただいた — these **are** the formal register of
these verbs, and they are the register the learner will actually hear from a
teacher or a shop. They are recognition-only today because the spine defers
production to m50. Promoting them to production in the L10 slot is a real spine
change, but it is the pedagogically honest place to put "formal giving."

**(c) A course-wide register-drip floor — the general fix.**
There is a `thr-n4` "counter-drip" principle in the spine for kanji ("dripped,
never walled") and m31 applies it to glyphs. The same principle is missing for
register. A floor — every module after m10 ships ≥N% polite surfaces — would
stop the 10-lesson dead zones. This is the one that fixes m13/m23/m30/m31 at
once rather than patching m31.

Note the tension worth naming: the course deliberately went **dict-form-first**,
so plain as the *baseline* is a decision, not a drift. The ask isn't to reverse
that — it's that a baseline of 1.7% is not a baseline, it's an absence.

---

## 6. Other pairs with the same shape

Spencer: "there are probably other forms of words we can teach in this same
format." There are, and some are further apart than あげる/くれる:

| pair | modules | gap | |
|---|---|---|---|
| **かす / かりる** | m8 / **m31** | **23** | lend / borrow. かりる ships **in m31** — its partner was taught 23 modules ago and they have never met |
| みる / みえる | m7 / m24 | 17 | look / be visible |
| おしえる / ならう | m14 / m30 | 16 | teach / learn |
| おぼえる / わすれる | m11 / m26 | 15 | remember / forget |
| いく / くる | m7 / m11 | 4 | deictic motion — **the same うち/そと axis m31 installs** |
| きく / きこえる | m24 / m24 | 0 | done right |
| のる / おりる | m17 / m17 | 0 | done right |

Two things fall out of that table:

- **かす/かりる is the immediate one.** It is a transfer pair with a return leg,
  it belongs to the axis m31 is already teaching, and かりる is being introduced
  in this very module with かす nowhere near it. Pairing them inside m31 costs
  no new vocabulary.
- **いく/くる is the deep one.** It is the same うち/そと deixis, taught 20
  modules earlier as plain motion verbs with no mention of the axis. Once m31
  installs うち/そと, いく/くる becomes retroactively explainable — a review-lesson
  callback rather than a new lesson.

---

## 7. Recommendation

1. **B now, A if the module is being reopened anyway.** Making L2 contrastive is
   a content pass on one module; merging L1+L2 changes the module's shape.
2. **Fold L3's card into L1 and spend the slot on もらう.** Keep the
   `ni-recipient` point id so the SRS ledger doesn't move.
3. **Pair かす with かりる inside m31** — same axis, zero new vocabulary.
4. **Register: (a) immediately** — んです frames on second appearances cost
   nothing and break nothing. **(c) as the real fix** — a drip floor, because
   m13/m23/m30 have the same hole and patching m31 alone leaves it.
5. **C (a `kind: contrast` beat) is the durable one** and should be costed
   against the whole N4 tier, not m31 — m32, m33 and m39 all need it.

Rulings needed: whether m31 gets reopened at all right now (it is live and
Spencer is mid-walk), and whether the register drip is a floor in the authoring
guide or a per-module authoring call.
