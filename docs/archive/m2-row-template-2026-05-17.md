> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# M2 row template — g-row worked example (2026-05-17)

Authored 2026-05-17 from Spencer's spec. This becomes the template for
every M2 row (5 dakuten + 1 handakuten + 4 yōon).

## Per-row structure

Every M2 row has exactly **3 lessons** on the pathway:

1. `ja-m1-<row>-1` — Sub-lesson 1 (chars 1-3)
2. `ja-m1-<row>-2` — Sub-lesson 2 (chars 4-5 + consolidation)
3. `ja-m1-<row>-test` — Mastery test (existing row_test pattern)

(Lesson IDs keep the `ja-m1-` prefix per project history; `moduleId`
field is `"m2"` so the pathway groups them correctly.)

## First-of-type intro card

The very first lesson of each new system gets ONE extra `info` step at
the top explaining the system + what's coming. Applies to:

- `ja-m1-g-1` (first dakuten — explains 5 voiced rows coming)
- `ja-m1-p-1` (first handakuten — explains the circle-mark for p sounds)
- `ja-m1-yoon-intro-1` (first yōon — explains the small-kana combining)

Other row lessons (z, d, b, yoon-sh-ch, etc.) skip this card and start
directly with the standard sub-lesson 1 flow.

---

## g-row sub-lesson 1 (`ja-m1-g-1`)

**Title**: "Voiced k → g — Intro 1"
**Estimated**: ~5 min, 13 steps (+1 first-of-type info = 14 steps for g specifically)

```
[OPTIONAL — g/p/yoon-intro only]
  info:open  "Dakuten — voicing the kana"
             body: Two strokes (゛) on a k/s/t/h kana voices it.
                   か→が, さ→ざ, た→だ, は→ば. You'll meet the 5 g-sounds
                   first, then z, d, b, p (with a circle instead).

[3-char block — for each of が, ぎ, ぐ]
1.  symbol_intro     (が — "voiced か (ka → ga)")
2.  word_image_mcq   ("Which is 'glasses'?" → めがね 👓)
3.  speaking         ("Say 'megane'" → めがね)

4.  symbol_intro     (ぎ — "voiced き (ki → gi)")
5.  word_image_mcq   ("Which is 'key'?" → かぎ 🔑)
6.  speaking         ("Say 'kagi'" → かぎ)

7.  symbol_intro     (ぐ — "voiced く (ku → gu)")
8.  word_image_mcq   ("Which is 'furniture'?" → かぐ 🪑)
9.  speaking         ("Say 'kagu'" → かぐ)

[consolidation tail]
10. symbol_recognition  ("Which is 'gi'?" — audio plays ぎ;
                         options: が, ぎ, ぐ, か as foils)
11. symbol_to_sound     (randomized: shows が, options ga/gi/gu/ka)
12. symbol_to_sound     (randomized: shows ぐ, options ga/gi/gu/ge)
13. symbol_to_sound     (randomized: shows ぎ, options gi/ga/gu/ko)
```

**Step type rotation**: symbol_intro × 3, word_image_mcq × 3, speaking × 3,
symbol_recognition × 1, symbol_to_sound × 3, info × 1 (or 2 if first-of-type).
**6 distinct step types** — matches M1 density.

**Anti-patternization**: symbol_to_sound options pull from BOTH g-row
(current and earlier-introduced) AND k-row (the parent), so the learner
can't pattern-match by elimination ("only g options means tap the new
one"). Adapt this rule for z (s+z), d (t+d), b (h+b), p (h+p).

---

## g-row sub-lesson 2 (`ja-m1-g-2`)

**Title**: "Voiced k → g — Practice"
**Estimated**: ~6 min, 16 steps

```
[INTRO BLOCK — chars 4-5, no speaking yet (deferred to consolidation)]
1.  symbol_intro     (げ — "voiced け (ke → ge)")
2.  word_image_mcq   ("Which is 'well/energy'?" → げんき 💪)

3.  symbol_intro     (ご — "voiced こ (ko → go)")
4.  word_image_mcq   ("Which is 'rice/meal'?" → ごはん 🍚)

[CONSOLIDATION BLOCK]
5.  word_image_mcq   (redo: "Which is 'glasses'?" → めがね 👓
                      — different option set than sub-1)
6.  word_image_mcq   (redo: "Which is 'key'?" → かぎ 🔑)
7.  word_image_mcq   (redo: "Which is 'furniture'?" → かぐ 🪑)

8.  translate        ("Type the word for 'glasses'" → めがね
                      acceptedAnswers: ["めがね"])
9.  translate        ("Type the word for 'key'" → かぎ
                      acceptedAnswers: ["かぎ"])

10. match_pairs      (kana ↔ romaji, all 5 g-row chars)
                     pairs: が-ga, ぎ-gi, ぐ-gu, げ-ge, ご-go
                     playAudioOnSelect: true  (kana side plays TTS on tap)
                     — columns shuffle independently per step.id

11. listening_build  (target: かぐ, granularity: character,
                      tiles: [か, ぐ, き, が] — small kana N/A here)

12. speaking         ("Say 'genki'" → げんき)   ← first speaking for げ
13. speaking         ("Say 'gohan'" → ごはん)   ← first speaking for ご

14. listening_comprehension   (audio: めがね, "What did you hear?"
                               options: glasses / key / furniture / rice)
15. listening_comprehension   (audio: ごはん, "What did you hear?"
                               options: rice / glasses / energy / furniture)
16. listening_comprehension   (audio: げんき, "What did you hear?"
                               options: well/energy / key / rice / glasses)
```

**Step type rotation**: symbol_intro × 2, word_image_mcq × 5, translate × 2,
match_pairs × 1, listening_build × 1, speaking × 2, listening_comprehension × 3.
**7 distinct step types** — exceeds M1 density.

**Why no speaking in chars 4-5 intro block**: deferred to step 12-13
in the consolidation block so the "2 speaking for the other two words"
slot is filled by the brand-new chars (extra reinforcement on the
freshest material). Sub-1 chars 1-3 already got their speaking in sub-1.

**translate step**: first JA use of `translate` per the research doc's
recommendation. Acceptance set is tight (`["めがね"]`) because the
answer space is constrained to a single learned word. IME input
expected — Whisper isn't relevant here.

---

## g-row mastery test (`ja-m1-g-test`)

Existing pattern — reuse `buildRowTestLesson`. Items drawn from all 5
g-row chars + their 5 anchor words. ~6 items, 70% pass, ★ unlocks on
first-pass.

No structural change needed; existing row_test machinery handles this.

---

## Adaptation to other rows

### Dakuten rows (z, d, b)
Same shape. Anchor words to propose (subject to Spencer's edit):
- **z** (ざじずぜぞ): ざる (basket), じかん (time), すずめ (sparrow — uses ず),
  かぜ (wind), ぞう (elephant 🐘)
- **d** (だぢづでど): からだ (body), ちぢむ (shrink — has ぢ, rare), みかづき
  (crescent moon — has づ, rare), でんわ (telephone 📞), どあ (door 🚪)
  — note ぢ/づ are rarely used; consider trimming row to 3 chars
- **b** (ばびぶべぼ): かばん (bag 🎒), えび (shrimp 🦐), ぶた (pig 🐖), べる
  (bell 🔔), ぼうし (hat 🎩)

### Handakuten (p) — `ja-m1-p-1`
First-of-type intro card: "The little circle (゜) on h-kana flips it
to a p-sound. はひふへほ → ぱぴぷぺぽ."
Anchor words: ぱん (bread 🍞), えんぴつ (pencil ✏️), てんぷら (tempura 🍤),
ぺん (pen 🖊️), たんぽぽ (dandelion).

### Yōon rows — `ja-m1-yoon-*-1`
First-of-type intro card on yoon-intro: "Small や/ゆ/ょ next to an
i-row kana (き, し, ち, etc.) blends them: き + や = きゃ. One mora,
two glyphs."

Yōon rows are tricky because they introduce MORE than 5 combos per
row (sh-ch row alone has 6: しゃ しゅ しょ ちゃ ちゅ ちょ). Three options:

- **A)** Keep the 3 chars sub-1 + 2 chars sub-2 cap; drop the extras
  (least content, simplest structure).
- **B)** Expand the per-row template to 6 chars across 2 sub-lessons
  (3 + 3); add a 4th step (extra symbol_to_sound or listening_comp).
- **C)** Split yōon rows differently from dakuten: e.g. yoon-sh-ch
  becomes TWO sub-lessons of 3 chars each (sh in sub-1, ch in sub-2)
  with the consolidation block at the end of sub-2 only.

Recommend **B** for sh-ch + voiced (6 chars each), **A** for intro
(3 chars: きゃ きゅ きょ) and rare (variable).

---

## Open questions

1. **Anti-pattern foils in `symbol_to_sound`** — pull from parent row
   (k for g, s for z, etc.) as written above? Or stay within g-row only
   (cleaner, less cognitive load)?
2. **`translate` step IME input** — sub-lesson 2 uses translate twice
   for the first time in JA. Is the current `TranslateStepView` ready
   to accept kana input, or does Whisper / IME need a follow-up
   feature flag before this lands?
3. **Yōon row scope** — A / B / C from above?
4. **First-of-type intro card length** — 1 sentence + 1 example (terse)
   or 3-4 sentences (more thorough)? Sub-3-line is the M3 grammar_rule
   pattern; longer is the M1 vowels framing pattern. Pick one.
5. **Mastery test threshold** — keep 70% existing, or tighten to 80%
   since M2 sub-lessons are now thicker (more practice → higher bar)?

---

## Implementation phasing

1. **Phase 1 (now)** — Spencer signs off on g-row spec above.
2. **Phase 2** — Author g-row (3 lesson files), wire moduleId="m2",
   verify TTS deck covers all anchor words + sentences. Smoke
   `npx tsc --noEmit` + `npx vitest run`. Bring up dev server and
   walk through the row.
3. **Phase 3** — Author z, d, b, p following same template (anchor
   words above, subject to edit). 4 row files.
4. **Phase 4** — Author yōon rows (4 row files) per scope decision.
5. **Phase 5** — Regenerate TTS deck, run Nanami + Keita pipeline,
   verify all new audio present.
6. **Phase 6** — Update mockCourse.ts to drop the old `m1-` intro+test
   lessons (10 lessons) and wire in the new 33 lessons (11 rows × 3).
7. **Phase 7** — `lessonDensity.test.ts` lint covering the M2 template:
   each sub-lesson has ≥5 distinct step types, mastery test ≥6 items.
