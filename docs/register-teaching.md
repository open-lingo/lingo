# Teaching the politeness register (ja)

**Status:** LIVE · **Last-verified:** 2026-07-27 · **Scope:** REGISTER LESSONS ONLY

> **If you are not authoring a register lesson, stop reading — none of this
> applies to you.** Spencer 2026-07-27: *"these lesson types and ways of
> teaching should be isolated to register, and ultimately should fade out of
> active teaching as they learn the register of said words."* That isolation is
> the point of this file existing separately from
> [authoring-invariants-pinned.md](authoring-invariants-pinned.md). The pinned
> invariants are the law every lesson obeys; this is a specialist technique for
> one topic. Do not promote anything here into the pinned block, and do not
> reach for these mechanics to decorate an ordinary teaching lesson.

## The rule that replaced the old one

**Never narrate the audience.** The banned pattern is
`"You are talking to <person>, how do you say this?"` — and its milder cousin
`"Say politely: Yes"`. Two things are wrong with it:

1. It puts an English scenario in the same verbal channel as the Japanese, so
   the learner parses prose before they can start.
2. `"Say politely"` is genuinely **ambiguous** — はい and ええ are both polite.
   A register prompt must name the PERSON, never the register.

Instead the addressee is **drawn**, and the prompt names only the act
(`"Say yes."`).

## The one beat that owns all of it

Everything below compiles from a single IR beat, `kind: register`. That is not
a style choice — it is what makes the isolation real. Because one beat kind
owns the audience picture, the politeness meter, the cheat sheet and the
vocative frame, an ordinary teaching lesson **cannot** grow an audience emoji
by accident: no other beat produces one. `registerScaffoldIsolation.test.ts`
enforces this, so it does not depend on anyone remembering.

```yaml
- { kind: register, stage: 1, audience: grandmother, answer: "ええ",
    options: ["うん", "はい", "ええ", "ううん"], en: "Say yes.",
    cheatSheet: { 1: "うん", 2: "はい", 3: "ええ" } }
```

`audience` keys into [`registerAudiences.ts`](../src/features/languages/ja/registerAudiences.ts),
which owns the emoji, the accessible label, the Japanese role name and the
politeness level so the cards and the cheat sheet can never disagree.

## The fade — stage 1 → 3

Mirrors `conjugation_transform`'s LEARN/KNOW/OWN ladder, which is proven in
this app:

| stage | scaffold | what it trains |
|---|---|---|
| **1 LEARN** | cheat sheet pinned above the options + picture + meter | placing a person on the cline |
| **2 KNOW** | picture + meter only | recalling the form for a known person |
| **3 OWN** | nothing — a Japanese vocative frame carries the context | production with no English at all |

**Stage 1 fires ONCE per word, course-wide, and stages never regress** (both
machine-checked). After stage 3 the word is ordinary vocabulary and belongs in
ordinary beats — that is the "fade out of active teaching" requirement, and it
is why the register machinery should get *rarer* as the course goes on, not
more common.

## Rules that are easy to get wrong

- **The 4th option is the opposite POLARITY, never a 4th register.** うん・はい・
  ええ・**ううん**. A wrong-register pick and a wrong-meaning pick are different
  errors and blending them tells you nothing about which one the learner made.
- **Every option must already be taught.** A register beat is contrast-and-
  choose, never a first exposure — the learner must not meet a word as a wrong
  answer (this is what m10 did before).
- **Stage 3 needs a frame, stages 1–2 must not have one.** With no picture AND
  no frame there is no cue at all.
- **The cheat sheet cannot fully mask the answer, and that is accepted.**
  `registerCheatSheet` excludes the exact audience being asked about
  (`TransformRuleTable`'s `maskBase` discipline), but register has three levels
  and three words, so the sheet always contains the answer *form*. Stage 1
  therefore trains the person→level mapping, not the word. Do not pretend
  otherwise when judging whether it is working.
- **Prompts stay plain.** `"Answer."` — not `"Your teacher calls your name.
  Answer."`. The inv-29 theatrics guard catches the second one, correctly: the
  frame already says who is calling.
- **A register cue must be GRADED** (pinned inv 48). If the prompt names the
  audience, the other register is WRONG, not an alternate rendering. Max-
  acceptance grading has exactly this one carve-out. Silently accepting both is
  the documented real-world failure mode: learners get no corrective feedback
  on style and conclude they are fine (Marriott 1995), and the input is
  non-reciprocal — a senior speaks plain *toward* the learner while the learner
  must speak polite *back* — so exposure alone cannot fix it.

## Cast: label the interlocutor by ROLE

`DialogueListenLine.speaker` is a free-text display label and its own doc says
"Stranger" / "You" / "Server" — it was **designed** for roles. Use それ:

- The **learner's own character keeps a name** (トム).
- The **other party is labelled by relationship** (せんせい, ともだち, てんいん,
  おばあさん), so the required register is readable straight off the chip
  instead of requiring the learner to remember who たなか is.

This is what Tobira does and what Genki/MNN/Duolingo all fail to do — Duolingo
has a fully voice-localised Japanese cast and binds none of it to register.

It also prevents a whole error class: the course previously wrote 「たなかさん」
27× and 「たなかせんせい」 0×, and さん to your teacher is itself a register
error. With a role label that is structurally impossible.

## Sequencing

- **Pairwise contrast on introduction; N-way discrimination only on review.**
  Contrast helps for maximally-similar sets (Carvalho & Goldstone), but
  clustering causes cross-association when the mappings are still being built
  (Nation, Tinkham). Ordering resolves it: each word learned in context first,
  *then* contrasted.
- **At most ONE genuinely new register word per lesson.**
- **ちがう is not a third "no", and だめ/けっこう are not politeness levels of
  each other.** ううん/いいえ are register twins; ちがう is a different speech
  act (correcting a proposition), だめ is prohibition, けっこう is declining an
  offer. Titling a lesson "three ways to say no" teaches a false equivalence.
- Keep a **recognition** beat in the mix ("who is this said to?"). Register is
  largely a listening skill and a module that is 100% production never checks
  whether the mapping actually landed.
