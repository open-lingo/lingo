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
| 、 deleted instead of spaced, fusing words in text and TTS | 175 surfaces, 24 modules; 233 clips regenerated |
| Kana anchors that don't contain their own kana | 7 (き, く, し, ち, り, ぽ, りゃ); guarded |
| `と` "with" required from m7, no card until m18 | stated in m7 |
| `ないで` required in m8, taught nowhere | stated in m8 |
| `に` for destination contradicting m6's "Doing → で. Being → に" | reconciled in m7 |
| m11's に-time card too absolute, contradicted by m13's なつやすみに | rewritten |
| Katakana used from m3, script not taught until m7 | orientation card at the end of the kana ladder |
| い-adjectives used 38× in m9, no card until m12 | stated in m9, with the たかいだ anti-pattern |
| Seven lessons in m8/m10 owning no rule card | each now has one |
| m7 glossing 「うみに いきます」 as "I'm going to the party" | fixed |

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

Everything from the original ranked list is now fixed except the two below,
which are judgement calls rather than defects.

1. **The audience cue is absent for twelve modules.** Register is named in the
   English prompt in 83–93 of ~90 builds in m7/m11/m12/m29 and in **0** of ~93
   in m13, m14, m15, m17 and m23. All five are `register: plain` and grading is
   max-acceptance, so nobody is marked wrong — but the course stops saying
   which register it wants for ~460 consecutive production steps. Separately,
   the audience PICTURE scaffold (`audienceEmoji` + politeness meter) exists in
   only 2 of 29 modules, m10 and m29, 5 steps each. Whether that scaffold is
   the design or an abandoned experiment is Spencer's call.
2. **m3's survival-phrase lesson still teaches partly by cold guess.** すみません
   now has a picture debut and だいじょうぶ's act-out moved beside its own
   listening beat, but ごめんなさい, ありがとうございます and はじめまして still
   have a graded listening question as their first exposure. The lesson is at
   its 24-step band ceiling, so buying room means cutting something.

Also noted and deliberately not "fixed": 【下】's reading した collides with した,
the past tense of する, which the course teaches in m11 — the glyph drill is the
learner's first meeting with the "below" sense, and nothing disambiguates them.
And おぼえる exists in the course only as おぼえなきゃ / おぼえなければ, never in
dictionary form.

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

---

# Second walk — 2026-07-28 (m7, m8, m11, m12, m13, m16)

One Opus agent walked m1–m6 to build state, then the six modules touched by
the conjugation-ramp and trainer-node work, reading only `docs/learner-sim/*`.

## Fixed

| what | scope |
| --- | --- |
| Required drills emitting なかった (m16 grammar) at m12 and m13 | tiles combine — the selection was checked for unlock, not for what it PRODUCES; both nodes retiled, lint now checks emitted forms |
| Drill pool full of words the course never teaches | 37 entries corrected against measured first exposure; 11 (かく, もつ, かかる, みがく, かす, でる, きる, まずい, つめたい, ふべん, かんたん) appear nowhere in the course and are parked above it; guarded by `drillPoolIsTaught.test.ts` |
| 「ちゃが ないです」 at m8 | contradicts m7's です card, and ~ないです isn't licensed until m12 → ありません |

## Open — Spencer's call, none of them introduced by this work

1. **な-adjectives that end in い are never flagged.** きれい and ゆうめい are
   な-adjectives; m12 L1 says "an い-adjective never takes だ" and L7 says
   "never くない — that ending belongs to い-adjectives", so きれいだ and
   きれいじゃない read as the module contradicting itself. No card ever says
   these two are the trap they are. **This is the strongest finding of the
   walk.**
2. **が as an ordinary subject arrives nine modules late.** Required from m7
   L3 (ともだちが きます), m8 L12, m11 L7 — the learner has only been taught
   が for ある/いる, and the は/が card doesn't land until m16 L2.
3. **The recipient に is never stated.** m8 L3 "Ask your friend" wants
   ともだちに きいて with both に and を in the bank; same in m8 L12 and L13
   ("buy tea for Tanaka"). No rule anywhere says the person you ask, tell or
   buy for takes に. Pure coin flip.
4. **Kanji window opens on words the module is currently teaching.** m12 L1
   introduces おおきい/あたらしい/ふるい/ちいさい as new, then writes 大きい bare in
   step 16 of that same lesson; 古い, 新しい, 小さい follow in L4/L8/L12.
5. **m7 L15 needs あそこの ひと** — place-noun + の + noun was never taught
   (の has been owner and origin only).
6. **m7 L2 builds はい、たべます before はい is glossed** — reachable only by
   eliminating おもう and あに.
7. **m16 L9 prints a whole paradigm in romaji** (taberu / tabemasu /
   tabenakatta / tabemasendeshita), as do L11's counters (ichimai, sanmai),
   in a course that has been kana-only since m1. L7's card has a typo:
   「ななかがつ」.
8. **m11 L13 is titled でした and has no rule card** — the only statement of
   でした is a clause inside L8's だった card.
9. **うち and いえ share a bank at m16 L1** with the difference never drawn,
   though うち is MCQ-tested five times. Same shape: m8 L8 introduces ちゃ
   without linking it to the おちゃ from m2.
10. **こめ / ごはん read as one English word.** The m8 card draws the
    distinction properly, but the prompts say "rice" for both, so "Eat rice"
    (ごはん) and "Please buy rice" (こめ) look like the same question with two
    different answers.

## Method note

The walker found the class; the machine found the extent — again. It named
seven untaught drill verbs; the scan found 37 wrong entries and 11 words the
course never shows at all. And the two tests that should have caught the pool
drift were instead pinning it: "m6 yields an empty pool" and "the i-adj type
has adjectives at m8" were both true only because the table was wrong. A test
written from observed behaviour rather than from the rule will do that.
