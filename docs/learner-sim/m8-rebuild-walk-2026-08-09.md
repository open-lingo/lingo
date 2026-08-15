# m8 re-walk after the IR rebuild — 2026-08-09

**Why:** commit e02069a5 (2026-08-07) rebuilt m8's IR (~700-line diff: conjugation-transform
teaching, accepted-forms expansion); the learner view was regenerated 2026-08-09. This walk
hunts continuity regressions and re-checks the known m8 findings.

**Protocol:** zero-knowledge simulated learner per docs/RUN-PLAN-n4.md. Inputs were
docs/learner-sim/*.md ONLY (HOW-TO-READ.md first); no IR, no curriculum source, no answer key.
Walked docs/learner-sim/m8.md top to bottom, every step answered in order.

**Knowledge state entering m8:** STATE.md m1–m7 entries + script section only. All hiragana;
katakana ア row (m7l1) + カ row (m7l9) only — サ/タ rows are taught inside this module.
Small っ, long vowels, katakana dakuten/ー never taught. Grammar: だ/は/も (m3), こ-そ-あ-ど +
の (m4), dict-form + を (m5), ない irregulars only + ある/いる + に(exists)/で(action) (m6),
ます/ません + です-on-nouns + か + register-by-audience (m7).

**Instrument check:** m8.md carries no `[as written:]` lines — per HOW-TO-READ kanji starts
~m9, and m9.md in this same regeneration has 5 such lines, so the furigana annotation layer
survived the emitter run; the absence is real course behaviour, not a stripped layer. Register
cues ("Say politely / to a friend / to a teacher"), AUDIO lines, dialogue Japanese, the
trainer stop, and all 14 `conjugation_transform` steps with options are present in the view.

---

## Per-lesson notes (only where wrong or notably changed)

**L2 (ja-m8-neo-1) — IMPROVED.** The て card now teaches FUNCTION as well as form: "On its
own it is what you say to a friend: たべて = 'eat'", with real sentence examples
(しゃしんを みて — Look at the photo). The old "form-not-function" CONFUSING finding is gone.
Both transform steps (たべる, みる) are fully covered by the card. Residue: s8 "Eat the food"
has two defensible answers (Finding 2), s10 "I drink milk" is a coin flip on an untaught word
(Finding 4), s11 hears ミカが たつ (B002), s14 "Eat today" needs untaught きょう with a stray
は tile (known m6 items).

**L3/L4/L6/L7 (neo-2, neo-10, neo-11, neo-3) — NOTABLY IMPROVED.** Each て-row lesson now has
its OWN distinct, correct rule card with a matching NOT-line: う・つ・る→って (l3),
む・ぶ・ぬ→んで with a しぬ aside (l4), く→いて/ぐ→いで/す→して with the かう-vs-かす contrast
(l6), and a real rebels card for いって/して/きて (l7) that explains WHY いく is an exception.
The old NIT (three identical cards, rebels title over a のむ NOT-line) is fixed. Every one of
the 14 `conjugation_transform` steps sits directly under a card that teaches exactly the
transformation it asks — the historical "transform card with no ruleset" defect does not
appear in m8 at all. Also improved: たつ (l2 s7), いそぐ (l4 s5) and かす (l4 s9) get
word_image_mcq introductions one lesson BEFORE their て-forms are drilled.

**L5 (ja-m8-neo-review-1) — REGRESSION.** The review is titled "Review — the て table" but
sits at position 5, and it requires いって — s3 builds いけに いって, s9 rebuilds うみに いって
from audio — two lessons before いって is taught (l7, and even the く row it flouts is l6).
At this point my table says う・つ・る→って and む・ぶ・ぬ→んで, nothing about く or いく.
The rebuild inserted neo-10/neo-11 into the row sequence and left review-1 upstream of the
rebels lesson. (Finding 1.)

**Stop 8 (trainer-te) — correct placement.** The gate comes after the full table (l7); the
sampled drills (みる, たべる, する, のむ) are all covered by cards.

**L10 (ja-m8-neo-5) — FIXES with one lean.** The new food card introduces しょくじ (with
しょくじを する), たべもの, and states ちゃ is tea — retiring two old BLOCKERs (しょくじ never
introduced; ちゃ un-grounded) before any step requires them. It ALSO now teaches ないで
("swap the て-form for the ない-form and add で") — the old untaught-ないで BLOCKER is fixed at
the construction level — but the clause leans on "the ない-form", which no card in the course
has ever taught how to build (standing defect #3). s16's listening of たべないで is parrotable;
the debt comes due in l18 (Finding 5).

**L11 (ja-m8-neo-6) — FIXES.** The shop card teaches こめ vs ごはん explicitly ("the bag on
the shelf, not the cooked bowl") BEFORE any こめ-requiring step, and the banks are
de-conflicted (every "buy rice" bank now carries exactly one rice word) — the old
ごはん/こめ contradiction BLOCKER is gone. The card also says outright "Getting to the shop is
still に, not で: みせに いく" — the first time the course has ever licensed destination-に —
though it lands after ~12 destination-に uses in l5/l7/l9 and stops short of a general rule.
Residue: s17 `[speaking] today` is cold tile-free production of never-introduced きょう
(Finding 6).

**L13 (ja-m8-neo-review-2).** s3 "The food is there" offers both そこ and あそこ for English
"there" — a coin flip with one keyed answer (Finding 3).

**L14 (ja-m8-neo-7) — the B003 hole, unchanged.** No rule card at all; おしえる is introduced
properly (s2 word_image_mcq before first use), but the lesson's real content — the person told
takes に — is stated nowhere, and s16 ("Please tell Tanaka about Mika's shop") demands both に
and を assigned correctly in one sentence. s14's dialogue still answers あそこですよ with an
unexplained よ (old NIT preserved).

**L15 (ja-m8-neo-8) — confirmed.** The register card (bare て for friends, てください for
teachers) survived; register cues are used consistently across the whole module, and s14's
"Why does Ken say のんで and not のんでください?" is a genuinely good self-explanation beat.
s16 "buy tea for Tanaka" is the beneficiary-に variant of B003.

**L18 (challenge) — one old BLOCKER fixed, one debt collected.** s5 is the rewritten "There's
no tea, please tell me": the "so" is gone and the bank carries an 「ありません。」 tile — two
taught sentences juxtaposed, fully answerable; the old ないです BLOCKER is fixed. But s3 needs
いかない and s11 needs のまないで — う-verb ない-forms no card anywhere has taught to build;
answerable only by stem-squinting (Finding 5). s12 `[translate] Tell Mika about the food` is
still B003's worst instance: tile-free production of recipient-に.

---

## Findings (new or materially changed)

1. **CONFUSING — m8 l5 (ja-m8-neo-review-1) s3, s9: review requires いって before it is
   taught.** "Go to the pond" (build) and うみに いって (listening) demand the て-form of いく
   two lessons before the rebels card (l7, ja-m8-neo-3); the く row it violates is also
   untaught (l6). Mechanically answerable — いって is the bank's only verb tile — but the
   lesson reviews material from the learner's future. Rebuild sequencing regression: the
   inserted row lessons (neo-10/neo-11) pushed the rebels lesson behind the review.

2. **CONFUSING — m8 l2 (ja-m8-neo-1) s8: "Eat the food" has two defensible answers.** The bank
   holds both ごはん ("rice, a meal") and りょうり ("cuisine"); neither is glossed "food", and
   the actual food word (たべもの) is not taught until l10. l5 s6 then keys the SAME English
   prompt to りょうり (only candidate there), confirming both are live renderings. One keyed
   order, no way to reason to it.

3. **CONFUSING — m8 l13 (ja-m8-neo-review-2) s3: "The food is there" — そこ and あそこ both in
   the bank.** English "there" maps defensibly to either taught demonstrative (m6 taught the
   three-way split); build steps key exactly one. Coin flip.

4. **CONFUSING — m8 l2 (ja-m8-neo-1) s10: "I drink milk" is a 50/50 between two never-taught
   nouns.** ぎゅうにゅう vs ぷりん — neither has ever been introduced (ぎゅうにゅう's
   never-introduced status is already on file from m3/m4; this rebuild placement makes it a
   pure guess). Required again at l4 s8 (elimination vs known words works there); first gloss
   only arrives in l4 s18's match_pairs; l10 s7 then MCQs it as if taught.

5. **CONFUSING — m8 l10 card / l18 s3, s11: the new ないで teaching leans on the never-carded
   ない-form.** The l10 card says "swap the て-form for the ない-form and add で" — but only
   しない/こない were ever carded (m6); no rule anywhere builds a る- or う-verb ない-form. l18
   then requires いかない (s3) and のまないで (s11) in builds. Both are reachable only by
   recognizing the stem in the bank tile. The old "ないで untaught" BLOCKER is fixed in form;
   this is the residue of standing defect #3 now made load-bearing inside m8.

6. **NIT — m8 l11 (ja-m8-neo-6) s17: `[speaking] today` — cold tile-free production of
   きょう**, which has never been introduced by any teaching step in m1–m8 (known since the m6
   walk, where it was recognition-by-elimination; the rebuild escalates it to production).
   Same lesson-family: l2 s14 / l6 s16 also require it in builds with a stray は tile and no
   time-word-は rule (m6's known timeは finding).

7. **NIT — m8 l9 s16, l14 s9, l18 s1: たなかさん vs たなか is undecidable.** Banks carry both
   たなか and さん (amid digit distractors ご/じゅう/さん/よん — numbers are m9); dialogues model
   たなかさん and l18 s6's audio confirms さん was required in s1's build, but no rule ever
   says when the honorific attaches. Standing "さん required, never explained" — new coin-flip
   instances.

Re-confirmed in one line each (no new writeup):
- **Destination-に used against my only に card** — l5 s3/s9, l7 s9–s16, l9 s10, l11 s10, l16
  s7/s12 (known m7–m19 BLOCKER; see status table for the l11 improvement).
- **さんぽ (l7 s8) and なまえ (l14 s10) in listening audio, never taught** — parrotable
  (さんぽ flagged since m3).
- **Untaught-script tiles:** ネクタイ (l9 s4 — ナ row is m9), コート (l14 s7 — ー never
  taught), ミカ throughout (マ row is m10); small っ is now load-bearing in every って form.
- **と "with" required, never carded** — l16 s11 (ともだちと あそんで), cloze stem l5 s11
  (known since m7).
- **あそこですよ** — l14 s14, unexplained よ (old NIT, preserved verbatim).

## Known-findings status

| Known finding | Status after rebuild |
|---|---|
| **B003** — recipient-に never stated; に and を both in bank | **STILL PRESENT, unchanged.** No card gained the "thing takes を, person takes に" clause. Instances: l6 s6, l14 s3/s16, l15 s16, l16 s5; l14 s5/s9 survivable only because に is the lone particle; l18 s12 is still the tile-free translate. l14 (the おしえて lesson) still has no rule card at all. |
| **B002** — が as ordinary subject required from m7, unexplained until m16 | **STILL PRESENT, unchanged.** l2 s11 (ミカが たつ, listening), l4 s10 (build "Mika hurries" with に/を distractors), l14 s3 (せんせいが おしえる with both が and に banked). |
| て-form table carded (STATE.md m8 entry) | **SURVIVED INTACT — IMPROVED.** Every row in STATE's summary is carded, now across five distinct per-row cards (l2/l3/l4/l6/l7) each with its own NOT-line; the rebuild ADDs す→して (drilled via かす) and a しぬ aside; trainer gate correctly placed after the full table. |
| Old BLOCKER — ないで appears with no teaching | **FIXED at construction level** (l10 card + example) — residual CONFUSING: it invokes the never-carded ない-form (Finding 5). |
| Old BLOCKER — ごはん/こめ contradiction in adjacent steps | **FIXED.** l11 card teaches こめ vs ごはん before any こめ step; every "buy rice" bank now carries exactly one rice word. |
| Old BLOCKER — しょくじ required, never introduced | **FIXED.** l10 card introduces しょくじ + しょくじを する before first use (l10 s6). |
| Old BLOCKER — "There's no tea, so…" implied untaught ないです | **FIXED.** l18 s5 reworded to two sentences; bank carries 「ありません。」. |
| Old CONFUSING — て card taught form, not function | **FIXED.** l2 card states bare て = casual request, with sentence-glossed examples. |
| Old CONFUSING — ちゃ vs おちゃ never addressed | **MOSTLY FIXED.** l10 card asserts ちゃ is tea before any ちゃ production; おちゃ still floats as an unexplained distractor (l5 s6, l13 s9, l15 s11) — now a NIT. |
| Old NIT — l2/l3/l4 identical て cards, rebels title mismatch | **FIXED.** Five distinct, correct cards. |
| Old NIT — dialogue あそこですよ, unexplained よ | **STILL PRESENT** (l14 s14). |
| Standing — destination-に never taught until m19 (TRIAGE m7–m19 BLOCKER) | **IMPROVED but STILL PRESENT.** l11's card explicitly licenses みせに いく ("getting there is still に, not で") — first such statement in the course — but it lands after ~12 destination-に uses in l5/l7/l9 and is an aside, not the general rule. |
| Standing — ない-form never carded (defect #3) | **STILL PRESENT, now load-bearing in m8** (l10 card, l18 s3/s11). |
| Standing — katakana dakuten/ー/small っ never taught (defect #4) | **STILL PRESENT.** Small っ becomes load-bearing here (every って); ー in コート; ナ/マ-row glyphs (ネクタイ, ミカ) precede their rows. |
| Standing — untaught words in banks/audio (ぎゅうにゅう, きょう, さんぽ, なまえ) | **STILL PRESENT**, with new m8 instances (l2 s10 coin flip; l11 s17 tile-free speaking). |
| Historical — transform cards with no ruleset (52/59) | **ABSENT FROM m8.** All 14 conjugation_transform steps are covered by the card directly above them. |

## Resolutions (2026-08-09, same session)

Fixed in `ir/m8.ir.yaml`, recompiled (`compile-ir.mjs m8`), module gate green on
all mechanical stages (scoped vitest / TTS 6863/6863 / tsc / full-suite parity);
visual capture stage blocked on an expired Auth0 session (`npm run
test:e2e:auth` needed) and still owed.

- **Finding 1 FIXED** — review-1's two いって beats (いけに いって build,
  うみに いって listening) deleted; the review now tests only rows taught by l4
  (る/って/んで all still covered). うみに いって remains taught+drilled in the
  rebels lesson.
- **Finding 2 FIXED** — both "Eat the food" prompts (l2, review-1) now read
  "Eat the cuisine", matching りょうり's taught gloss and excluding ごはん.
- **Finding 3 FIXED** — review-2's そこ beat now reads "The food is there, by
  you", m6's own card phrasing ("The book's there, by you").
- **Finding 4 FIXED (m8-locally)** — l2's build swapped to みずを のむ。 "I
  drink water" (clip already in the TTS corpus; verified by hash). ぎゅうにゅう
  now debuts in l4 where it is glossed; its missing course-wide intro stays
  with the vocab-exposure cluster (B065/B068).
- **Finding 6 FIXED** — きょう removed from all four m8 reviewPools (and さんぽ
  from the rebels pool, same class): the filler generator samples speaking/MCQ
  from the declared pool, so untaught words can no longer be cold-produced.
  Sentence-level きょう uses remain (standing course-wide item).
- **Finding 5 → B090** (decision-needed: where the ない-form lesson goes).
- **Finding 7 + B002/B003 → B089** (the particle-contrast rule-card pass).
- **ぷりん/pad-pool mechanism → B088** (engine: pad pool trusts stale
  fromModule; same root as the m16 walk's finding 1).
