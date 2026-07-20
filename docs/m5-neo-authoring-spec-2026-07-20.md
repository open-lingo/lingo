# m5-neo authoring spec (2026-07-20) — spine s05: VERBS I

Dictionary form as THE verb. This is the rewrite's thesis module: a bare
dictionary-form verb is a COMPLETE casual sentence (たべる。 "I'll eat" /
たべる？ "you eating?" / うん、たべる。), which composes directly with
m3's contour questions and うん/そう. を + SOV enter here. Plain register
throughout; です only as Tanaka recognition previews. 12 lessons.

**Read before writing (same law as m4):**
1. `docs/authoring-invariants-pinned.md` — ALL 27 invariants. NEW since
   m4: **26 (capstone)** — every teaching lesson has exactly ONE harder
   integration step, id suffix `-capstone`, type build/translate/
   listening_build, placed within the last 8 steps but before the closing
   match grid, combining this lesson's new concept with ≥2 concepts from
   EARLIER modules (の possession, これ/それ/あれ, だれ/なに, は/も…).
   **27 (frequency share)** — review tails must pull the under-reinforced
   CEJC-frequent items listed below.
2. `src/features/languages/ja/curriculum/m4-neo-a.ts` — the exemplar
   (factories, local helpers, review pools incl. noKatakana filter,
   comments, end-of-file asserts).
3. `src/features/languages/ja/__tests__/moduleBarGuards.ts` — your bar;
   m5 runs with `requireCapstone: true`.
4. `docs/concept-type-authoring-guide-2026-07-19.md` §VERB MORPHOLOGY.

**Canon:** Tom=student/American/Mika's friend; Mika=student/Japanese;
Tanaka=the teacher; Ken=student/Japanese. Speaker labels Tom/Mika/Ken/
Tanaka (Latin). Male speakers get Keita TTS automatically.

**Pedagogy rulings for THIS module (report-tracked):**
- Verb CLASSES (る/う/する/くる, いる/える exceptions): flagged briefly
  on each verb's rule card (one line, e.g. "たべる is a る-verb — that
  matters when we start bending verbs soon"), but NO classification
  drills yet — class knowledge becomes functional at negation (module 6);
  drilling taxonomy before it does anything would be metalanguage.
- いう/おもう are RECOGNITION-FIRST via chunks (そう おもう "I think
  so", そう いう？) — no と quotation grammar yet. Chunk template
  (type 5), like m3's survival sounds. No production drills targeting
  them beyond the chunks.
- する/やる/わかる atoms are rubric-blocked (no image MCQs) — intro via
  LC + build + rule card per invariant 4. Do NOT re-tag existing atoms'
  fromModule; ADD missing atoms only (see allocation).
- Casual bare-verb answers are graded correct everywhere a fuller SOV
  answer exists (translate acceptedAnswers include the bare verb, the
  を-ful form, and spacing variants — mirror m3's だ-drop discipline).

**Frequency directives (invariant 27, from exposure-audit):** work these
under-reinforced high-frequency items into review tails and carriers:
ごはん (×3 only — use as THE food carrier), うん/そう (keep recurring in
dialogue replies), だいじょうぶ/ありがとう chunk callbacks in stories.
Do NOT lean on がくせい/せんせい/ともだち carriers (over-exposed in
m3/m4) — prefer object/food nouns.

**Vocab allocation** (check courseAtoms first; several exist under old
module tags — use them as-is; ADD only what's missing, tagged
introducedByLessonId "ja-m5-neo-N"): verbs たべる のむ いく くる する
やる みる かう きく わかる いう おもう; particle を (add `p-wo` if
absent, kana を); nouns もの たべもの のみもの かいもの (compositional
family) + いくら (exists, m5); free carriers = all m1–m4 words.

**Lesson map (ja-m5-neo-1 … ja-m5-neo-11, ja-m5-neo-review):**
1. **Your first verbs — たべる & みる.** Bare dict-form as a complete
   sentence; contour questions (たべる？) and うん、たべる replies.
   Exposure-first (inferable from context + m3 pattern). Rule card:
   "the dictionary form IS the verb — say it and you've spoken."
2. **を — marking what you act on.** Rule card FIRST (new structural
   particle): ごはんを たべる, しゃしんを みる. SOV builds; anti-pattern
   candidate: を after the verb (たべるを ごはん — genuine order error).
3. **のむ & かう.** みずを のむ, ほんを かう, これを かう？ (m4
   pointer + を combo starts naturally here).
4. **いく & くる — off and coming.** Bare motion verbs as complete
   casual sentences (いく。 "I'm off" / くる？ "coming?"); くる flagged
   irregular on its card. NO destinations (に is later).
5. **する & やる — do.** する irregular-flagged; なにを する？ (m4 なに
   + を). やる as the casual する (CEJC #36).
6. **Story: at the shop.** これ、いくら？; これを かう。; chunk
   callbacks (ありがとうございます from the shopkeeper — Tanaka-style
   です register from staff is fine as flagged recognition).
7. **きく & わかる.** おんがく untaught — keep きく on known objects or
   bare (きく？ "you listening?"); わかる？ うん、わかる。/ わかる。
8. **いう & おもう — recognition chunks.** そう おもう / そう いう？
   via LC + dialogue exposure; NO analyzed quotation grammar.
9. **もの — the thing-morpheme.** たべもの = たべ+もの, のみもの,
   かいもの; compositional card; たべものを かう capstone territory.
10. **Food & object wave + verb drills.** ごはん as primary carrier
    (under-exposed); recombinations across all taught verbs.
11. **Story: dinner plans.** ごはんを たべる？ なにを のむ？ scene with
    Tom/Mika/Ken; Tanaka です preview line(s).
12. **Review** (all-new sentences; carriers from m1–m3 nouns recombined
    with m5 verbs; ≥60% sentence-context; closes on match grid; NO
    capstone required here).

**Capstone examples (each teaching lesson needs ONE, combining ≥2
earlier-module concepts):** L2: たなかの くるまを みる ("watch Tanaka's
car" — の + を + verb); L3: だれの ほんを かう？-answer build; L5: あれを
やる？; L9: ミカの たべものを たべる？… Use judgment; keep them buildable
from taught material and mark ids `…-capstone`.

**File layout:** lessons 1–6 → `curriculum/m5-neo-a.ts` (exports
M5_NEO_1..6 + M5_NEO_A_LESSONS; owns any courseAtoms additions);
lessons 7–12 → `curriculum/m5-neo-b.ts` (M5_NEO_7..11, M5_NEO_REVIEW +
M5_NEO_B_LESSONS; no courseAtoms edits; duplicate small local helpers).
Do not touch mockLessons/mockCourse/manifest/m3/m4 files. Review lesson
sentences must avoid verbatim reuse of ANY m5 lesson's audioText — keep
review carriers on m1–m3 nouns you haven't used in your own lessons.

**Mechanical bar reminder:** 18–24 steps; no adjacent same-type; ≤2
selection taps in a row; ≥5 types; sentence surface ≤3×/lesson; every
new word debuts on an intro-capable step before any option set; house
review tail + match-grid close; prompts minimal, register-cued.
