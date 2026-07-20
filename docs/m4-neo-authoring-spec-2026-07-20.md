# m4-neo authoring spec (2026-07-20) — spine s04

Module 4 of the dict-form-first rewrite: **Possession & pointing — の,
これ/それ/あれ/どれ, だれ, 何**. Plain-form register (だ) throughout;
です appears ONLY as flagged recognition previews spoken by Tanaka.
12 lessons (11 teaching + 1 review) per invariant 25.

**Read before writing a single step (all in this repo):**
1. `docs/authoring-invariants-pinned.md` — ALL 25 invariants, verbatim law.
2. `src/features/languages/ja/curriculum/m3-neo.ts` — the exemplar file:
   copy its factory usage, local helpers (listeningBuildWord), review-pool
   pattern (pickReviewAtoms + withoutMcqBlocked + noKatakana), comment
   style, assert calls at file end.
3. `src/features/languages/ja/__tests__/moduleBarGuards.ts` — the
   mechanical bar your lessons MUST pass (density 18–24, no adjacent
   same-type, ≤2 selection taps in a row, ≥5 types, close on match grid,
   sentence surface ≤3× per lesson, no production-framed MCQs, vocab
   provenance, persona canon).
4. `docs/concept-type-authoring-guide-2026-07-19.md` — per-concept-type
   templates.

**Canon (never contradict):** Tom=student/American/Mika's friend;
Mika=student/Japanese; Tanaka=the teacher; Ken=student/Japanese. Speaker
labels ROMANIZED: Tom/Mika/Ken/Tanaka. Male speakers (Tom/Ken/Tanaka) get
Keita TTS automatically — just write the dialogue.

**Concept-type rulings that bind here:**
- これ intro: exposure-first is fine (pointing is inferable — だ-class).
- それ/あれ (and later どれ): SUBSTITUTION class — compact rule card
  BEFORE first exposure (invariant 24; meaning not inferable from one
  hearing). Same for の (new structural particle: card first).
- 何/だれ questions ride the m3 casual-contour pattern (これ、何？).
- Review tails draw prior modules (m1+m2+m3 pools). m3 atoms now count
  as prior vocab.

**Vocab allocation (atoms mostly exist — check
`src/features/languages/ja/courseAtoms.ts` fromModule:"m4"; add ONLY the
missing ones with introducedByLessonId "ja-m4-neo-N", following the m3-neo
atom style, e.g. それ if absent):**
これ それ あれ どれ だれ なん(何) の + objects: かばん けいたい くるま
いす かさ てがみ じてんしゃ じしょ にほん アメリカ. Do NOT invent vocab
outside this list (invariant 16); m1–m3 words are free as carriers.

**Lesson map (ids ja-m4-neo-1 … ja-m4-neo-11, ja-m4-neo-review):**
1. **これ — point and name.** これは ほんだ frame over known + wave-1
   objects (かばん, けいたい, くるま). Exposure-first LCs interleaved with
   builds/speaking (m3-neo L1 shape).
2. **それ/あれ — the distance system.** Rule card FIRST (three-way
   contrast, one card, ≤3 short lines + examples). Choice-under-contrast
   drills: situation cue → pick/build これ/それ/あれ sentence. No どれ yet.
3. **これ、何？ — the pointer question.** 何/なん intro (recognition-heavy;
   なん is a blocked atom — no image MCQs, no bare production of 何 alone).
   Q→A pairs: これ、何？ → それは ほんだ。 Dialogue closer with Tom/Mika.
4. **Objects II + drills.** いす, かさ, てがみ + これ/それ/あれ frames.
   Vocab-lesson variation (no new grammar; heavier vocabMcq/image intros,
   builds, listening builds).
5. **の — possession.** Rule card first (Xの Y, one idea). わたしの ほん,
   トムの ねこ, ミカの かばん. Anti-pattern candidate: の-order error
   (ほんの わたし for "my book") — genuine learner error, full-sentence
   minimal pair.
6. **だれ + だれの.** だれ？ / だれの かばん？ → ケンのだ。 (short-answer
   のだ = "it's Ken's" — teach as a chunk on the card, recognition+use).
   Dialogue closer.
7. **Story: whose bag?** Integration dialogue (m3-neo L6 shape, 2–3
   scenes): found bag, だれの かばん？, ケンのだ, handing back, chunk
   review (ありがとう/だいじょうぶ callbacks). 
8. **の — attributive.** にほんの くるま, アメリカの けいたい (origin/
   category). Rule card extends L5's card (same particle, second job —
   spiral, reference the possession meaning).
9. **どれ — which one.** Rule card first (joins the こ/そ/あ family).
   どれ？ + answers これだ/それだ. Choice scenarios.
10. **Objects III + こ/そ/あ/ど consolidation.** じてんしゃ, じしょ +
    mixed drills across all four + の recombinations (だれの じてんしゃ？).
11. **Story: in Tanaka's classroom.** Integration: pointing at things,
    whose-is-whose, Tanaka speaks 1–2 flagged です lines (recognition
    preview, same device as m3-neo L6 scene 3).
12. **Review (ja-m4-neo-review).** ALL-NEW sentences (no earlier audioText
    verbatim — the m3-neo review test pattern), ≥60% sentence-context,
    every concept + chunk callbacks, close on match grid.

**Mechanical requirements per lesson:** 18–24 steps; every lesson ends
with the house review tail (reviewMatchPairs over its seeded pool +
vocabMcq + a listening_build) and closes on the match grid; interleave so
no two same-type steps touch and max 2 selection-taps in a row; ≤3 uses
of any primary sentence; every new word debuts on an intro-capable step
BEFORE appearing in any option set; prompts minimal (no narrative color,
no metalanguage, no production-framed MCQs); register cues where needed
("Say to a friend:"); だ-drop accepted in translate steps (copy m3-neo's
acceptedAnswers pattern).

**File layout:** lessons 1–6 in `curriculum/m4-neo-a.ts` (exports
M4_NEO_1..6 and any shared local helpers), lessons 7–12 in
`curriculum/m4-neo-b.ts` (imports nothing from -a except via the same
grammarHelpers; duplicate the tiny local helpers rather than
cross-importing). Registration, barrel, tests, TTS are handled after both
land — do NOT touch mockLessons/mockCourse/manifest.
