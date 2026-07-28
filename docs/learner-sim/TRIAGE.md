# Learner simulation — what it found, what was fixed, what is open

Three Opus agents walked m1–m29 in order as one continuous zero-knowledge
learner (2026-07-27), reading only `docs/learner-sim/*` — no source, no IR, no
tests. 185 findings: 53 BLOCKER, 67 CONFUSING, 63 NIT, 2 withdrawn.

This file is the triage. `FINDINGS.md` is the raw log, in walk order.

---

## The two findings that were worth the whole exercise

**A rule card that was written, compiled, and unreachable.** m6 authors three
separate ない cards — る-verbs, う-verbs, irregulars — and they resolved through
a `Map(id → point)`, so the last one silently won. Lessons 1 and 2 both showed
the する/くる card. The two rules the module is *named for* were stated nowhere
in the course, and no test could see it: the module compiled, each lesson had a
card, and each card was about roughly the right topic. Only someone trying to
derive みない from みる notices.

Nine more lessons had the same symptom from a different cause — pointing at a
card written for an earlier lesson, their own rule never authored at all.
"Names carry register too — さん, さま, くん, ちゃん" opened with the audience
card, which never mentions an honorific.

**A verb served as loose syllables.** 「かいません」 tokenized to かい ("shell") +
ま + せん ("thousand"). The buildability gate that exists to catch exactly this
ignored single-character debris, and two of the three fragments were real
words, so nine build steps shipped asking the learner to assemble a verb out of
syllables it had never taught them to assemble.

---

## Fixed

| what | scope |
| --- | --- |
| Shattered verb tiles | 9 build steps (m9, m10); gate now strict, `だ`/`な` registered, `ません` made a bound morpheme |
| Wrong / missing rule cards | 10 lessons across m6–m14; `variant` selector + ambiguity diagnostic + "two lessons may not open with the same card" |
| Small っ never taught | new card, last kana lesson — used from m3, 87 times by m8 |
| Held vowels never taught | new card, last kana lesson — とけい, せんせい, りょうり, ぎゅうにゅう |
| Month readings in romaji only | m16's から…まで card, now kana |
| Vocabulary produced before it is explained | 43 words, guarded course-wide (`glossBeforeProduction.test.ts`) |

## Withdrawn — both this repo's own reporting bugs, not the course's

**Kanji.** The simulation's single most serious finding was that no kanji
appears in any sentence in m1–m29, and that m18/m23/m28 lie about a furigana
window. They do not. `applyKanjiSurfaces` rewrites the display layer and never
touches `targetPhrase`/`transcript`/tiles, by design, so a kanji can never
desync TTS or grading — 1,852 annotated segments carry kanji from m9 on. The
learner-view emitter stripped annotations wholesale, so all three walks were
blind to the entire layer.

**Register cues.** Reported as prompts leaking internal data ("👵 an elderly
neighbour 3"). `audienceLabel` is screen-reader alt text and `politenessHint`
is a 1–3 meter; the emitter was rendering both as prose.

Both had the same root cause: redactions written to hide *answers* were hiding
*teaching*. Worth remembering next time a simulated reader reports an absence —
check the instrument before believing it.

## Open, ranked

1. **`ないで` is required and never taught** (m8 l7, l15) — a negative request
   tagged as plain `nai-form`.
2. **`と` "with" is required from m7 and has no card until m18** — whose card
   asserts "you have had it since module 8".
3. **Katakana ordering** — アメリカ (m4) and コート/ドア (m6, as match_pairs
   *answers*, ×5) are required before the katakana rows begin at m7. The
   schedule itself was a deliberate ruling; what is missing is any card telling
   the learner that names and loanwords use a second script they will learn
   later.
4. **`に` for destination is required from m7 and taught in m19**, while m6's
   card says に marks where something EXISTS and で marks action — so every
   〜に いく contradicts the last rule the learner was given.
5. **m11's に-time card overstates its rule** — "words that are not clock
   readings take NO に at all" — and m13 then requires なつやすみに. The content
   is correct Japanese; the card is too absolute.
6. **Six m10 transcripts glue the yes/no word to the next word** —
   「うんいえに いく」, 「ううんたべない」, 「いいえけっこうです」 — so TTS reads a
   run-on.
7. **い-adjectives arrive in m9 with no card until m12**, including 「これは
   やすいです」 after m7's card said です finishes NOUNS.
8. **The audience cue vanishes for twelve modules.** Register is named in the
   English prompt in 83–93 of ~90 builds in m7/m11/m12/m29 and in **0** of ~93
   in m13, m14, m15, m17 and m23. All are `register: plain` and grading is
   max-acceptance, so nobody is marked wrong — but the course stops saying
   which register it wants for ~460 consecutive production steps.
9. **m3's survival-phrase lesson teaches by cold guess** — every phrase's first
   exposure is a graded listening question (すみません, ごめんなさい, だいじょうぶ,
   ありがとうございます, はじめまして).
10. **`した` is required in m29 builds and introduced as a word nowhere** —
    m6 declares うえ and なか as atoms but not した.

Plus the NIT tail in `FINDINGS.md`: duplicate MCQ options, kana intro example
words that don't contain the kana they introduce (き→かい, し→あさ, ち→うた),
a ミカ↔ミカ self-pair, and a m7 review item whose Japanese says うみ while its
English says "the party".

## Method note

The pattern that held all night: **the reader finds the class, the machine
finds the instances, and neither alone gets them all.** The learner found one
verb shattered into syllables; the gate found nine. It found one lesson with
the wrong card; the diagnostic found ten. It named ~20 untaught words in the
modules it walked carefully; the scan found 43, thirteen of them in m15–m28
where no simulated learner had yet reached.

The converse holds too, and is the reason to keep doing this: no test in 8,300
would ever have reported that a module's headline rule is missing, because
every test the course has asks whether the content is well-formed, not whether
it teaches.
