# "I like children, so I'll give him a pencil" — and the rule that now blocks it

**Status:** FIXED (content + enforced lint + pinned invariant 50). TTS regen
done; the 8 new clips are staged in `tts-publish/ja/` for the deploy upload.

Reported by Spencer 2026-08-18, mid-m31 walk, on a `build_sentence` step:

> 「こどもが すきだから えんぴつを あげる。」 — *"I like children, so I'll
> give him a pencil"*
>
> *"we need to look out for weird sentences like this … i like children or
> any other suggestive thing should be avoided and made an authoring rule
> somehow"*

## Why it happened

Not a random bad draft — a predictable one. 〜が すき spans "like" and "am
attracted to" with no morphology separating them, so a HUMAN in the liked
slot is a confession by default. The English gloss then flattens it back to
a bland "I like X", which is exactly why it survived authoring review: the
gloss stops warning you what you wrote. Add a child and a gift and it reads
as grooming.

There was a second defect stacked on it: **"him" refers to nothing.** The
Japanese names no third person. The affection clause and the dangling
pronoun arrived together because the sentence was assembled from grammar
tags (`ageru` + `kara-because` + `suki-kirai-no`) rather than composed as a
thing someone would say.

## Blast radius — 6 sentences, 3 modules

Found by scanning every compiled JA lesson, not just m31:

| where | sentence | now |
|---|---|---|
| m31 L1 | こどもが すきだから えんぴつを あげる | いもうとは えんぴつが すきだから あげる |
| m31 L1 | こどもが すきだから あした いもうとに おおきい プレゼントを あげる | あねは はなが すきだから せんせいに おおきい はなたばを あげる |
| m31 L5 | その とけいは たかいけど ともだちが すきだから ともだちに あげる | その とけいは たかいけど ともだちは それが すきだから あげる |
| m31 L9 | いしゃは しんせつだから すきだ ("so I like him") | せんせいは しんせつだから じゅぎょうが すきだ |
| m15 L1/L3 ×3 | うみで およぐ ひとが すきだ | きっさてんで のむ ちゃが すきだ |
| m15 L1 | ほんを みる ひとが すきだ | ほんを うる みせが すきだ |

Every `exercises:` / `combines:` tag is preserved in each replacement — the
grammar load is identical, only the referent changed.

The m15 pair took a second pass. The obvious fix — swap ひと for こと
(「うみで およぐ ことが すきだ」) — collides with m15's OWN こと lesson,
which already ships that exact sentence as its teaching example. Fixing a
sentence by pre-empting a later grammar point is the m14 trap wearing a
different hat, so the relative clause kept a non-human head instead.

## The rule

**Invariant 50** (`docs/authoring-invariants-pinned.md`, and rule 10 in the
dispatch pack `scripts/authoring-context.mjs`):

> Nobody likes a PERSON. 好き/きらい/だいすき take a thing, a place, a food,
> or a nominalized clause (〜のが/〜ことが すき) — never a human.

Machine-checked by `src/__tests__/contentSafety.test.ts` over every compiled
lesson in every course.

## Why the lint reads the ENGLISH, which is the interesting part

The first draft linted the Japanese and was **wrong**. It fired on m17 L7:

    あの みせは たかいけど あねが すきだから よく いく。
    "That shop is expensive, but my older sister likes it, so we go often."

Structurally identical to 「こどもが すきだから…」 — 「Xが すき」 — and the
opposite meaning: with a topic supplied earlier, X is the LIKER. A
Japanese-side regex fires on both or neither. 「Xが すきな Y」 ("the Y that
X likes", ~20 uses across m15/m16) has the same problem and is fine.

The English gloss is the disambiguated form. It is what a reviewer reacts
to, and it is what Spencer reacted to. So that is what gets checked:
`(like|love) + <determiners>{0,3} + <person word>`.

Pronouns needed one extra turn of the screw. They are person words only
when they end the clause:

- "The doctor is kind, so I like **him**" → fires (a real m31 hit, found by
  this lint after the four already known)
- "She says she likes **them** equally" (m26) → object is two compared items
- "I like **her** cat" → possessive

Bare he/she/they are absent from the list entirely: a subject pronoun can
never land in the liked slot right after the verb.

The test carries its own instrument checks — it asserts the regex still
fires on the four originating sentences and still ignores the four safe
constructions, so nobody can loosen it until the corpus passes.

## Loose ends

- ~~**KO is not covered.**~~ DONE 2026-08-18: the lint now scans every course
  (the rule is about the English gloss, and glosses are English everywhere).
  Widening it surfaced exactly one cross-language hit, `es-m10-4` *"I like my
  parents' apples"* — a FALSE positive: the person modifies the liked thing
  rather than being it. The regex now refuses a person word followed by a
  possessive. KO is clean. The test moved to `src/__tests__/`.
- **Unbound pronouns are NOT gated.** "give him a pencil" with no referent
  is a real defect class, but 166 glosses contain a third-person pronoun and
  nearly all are bound by dialogue context. A gate would need antecedent
  resolution; a regex would be noise. Left as a human-review item.
- The two replacement sentences that reuse あね/いもうと were chosen partly to
  dodge `ははは` — the first draft of the L1 challenge used はは and would
  have made a 22nd instance of the unrecoverable form in
  [tts-topic-wa-mispronounced-2026-08-18.md](tts-topic-wa-mispronounced-2026-08-18.md).
  Count re-verified at 21, unchanged.
