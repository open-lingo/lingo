# TestFlight feedback — build 30 (2026-09-18)

Pulled via `scripts/asc/pull-feedback.mjs` (manifest + numbered `.jpg` shots in `testflight-feedback/`, untracked). Spencer walked build 30 (JA course, iPhone 15 Pro Max) 2026-09-18 15:43–17:05 UTC and filed 8 screenshot items, rows 193–200. **Row→item mapping: item = pull row + 5** (rows 193–200 → items #198–#205). Row 191 ("Feedback") is the #196 avatar-menu shot, already fixed on b30. Row 192 ("For future ref 89VXLF") is a diagnostics code, item #197, handled by the lead. Triage follows the QA-walk protocol: fix inline, ledger every failure, audit after.

Checked `docs/user-feedback/2026-09-17-testflight-b28.md` §2 for recurrence: none of #198–#205 are the same class as #186 (kanji_reveal truncated reading) or #195 (dialogue_listen 4-option overflow). #199 (translation-reveal reflow) is a sibling of b28's #191/#193 CTA-shift class (post-submit content growing the stage) but a different mechanism — separate fix, noted below.

## 1. Items

| # | Row | Time (UTC) | Verbatim | Class | Status |
|---|---|---|---|---|---|
| 198 | 193 | 15:43 | "This wording is super confusing in the explanation, did we correct these to be good for American English speakers and younger people?" | explanation wording | fixed, `m34.ir.yaml` (rule `you-to-suru`) |
| 199 | 194 | 15:46 | "Buttons resize when the translation pops up, we need a way to place the translation near the build what you hear spot or something so it doesn't take up new space" | layout — CTA shift on submit | fixed, `ListeningBuildStepView.tsx` |
| 200 | 195 | 16:54 | "doesn't this imply the result happened? Is this a bad translation? ... no 'mystery' in their attempt. Maybe I just don't understand and we need to explain it better." | grading question → gloss/explanation defect (Spencer decision, 3 parts) | fixed — gloss rule, rule-card contrast, near-miss feedback |
| 201 | 196 | 16:58 | "the distinction between this and mita needs better explaining, we will work through my understand and then we will work towards resolving it" | same topic as #200 | fixed (same changes) |
| 202 | 197 | 16:59 | "Too isn't ten right? ... Are these fragmented correctly? We shouldn't be separating numbers from their counters, should be illustrated together" | content — orphaned atom | **root cause found; decision item, not silently changed** |
| 203 | 198 | 17:01 | "we need to normalize kanji answers too if they want to use their kanji keyboard" | typed-answer grading | fixed — `typedAnswerKanjiFallback.ts` + 3 call sites |
| 204 | 199 | 17:03 | "Should be juu no?" | same root cause as #202 | **same decision item as #202** |
| 205 | 200 | 17:05 | "This isn't centered correctly and font size and bolding should be done so they can see words better no?" | flashcard typography | **partially fixed** — font-size/weight fixed; ruby centering is a measured, deliberate tradeoff — flagged, not touched |

## 2. Root-cause notes and fixes

### #198 — explanation wording (row 193)

**Located:** `src/features/languages/ja/curriculum/ir/m34.ir.yaml`, grammar point `you-to-suru` (module 34, lesson `m34-neo-9`, the `⟨よ⟩うとする` rule card — "THE RULE · 2 peeks left" screen). This is the sanctioned "see the rule" expander (`docs/lesson-authoring-guide.md` §2's ~3-line budget applies to the always-visible card face, not this peek), so the defect isn't length — it's the wording itself: *"is the attempt itself — will meeting the world, with no promise the world gave way"* is needlessly literary and fails `pedagogy-principles-2026-07-05.md` R6 ("adult register... clean model over exception list"; never obscure a plain contrast in ornamental prose).

**Fix:** rewrote in plain American English, keeping the quoted course sentence:

> 「〜(よ)うとする」names the attempt itself — it doesn't say whether it worked. 「ドアを あけようとしたけど、あかなかった」= 'I was going to open the door, but it wouldn't open': とした is the attempt, and けど、あかなかった tells you what actually happened. Compare module 30: たべてみた — you ate it, to see. たべようとした — you were going to eat it, and didn't. Recognition only for now — production comes later.

The second sentence is also Spencer's decision #2 below (the quoted contrast pair), so this single edit closes #198 and half of #200/#201.

**Sibling check:** `you-to-suru` is a JA-only grammar point (KO/ES/FR have no equivalent frame in this tier); no test-out/review-context divergence — the rule text is read from the same IR field everywhere it's shown (lesson rule peek, grammar review "see the rule").

### #199 — translation reveal grows the stage (row 194)

**Located:** `src/features/lesson/components/steps/ListeningBuildStepView.tsx` (m34's listening_build step, "あかい りょうりを たべようとした" — `m34.ir.yaml:500`). TestFlight #142 ("use the space: show the English when they get it right") added a translation reveal as a **separate paragraph below the tile bank**, shown only after a correct submit. Because it's new content inserted above the bottom-anchored CTA block (which uses `mt-auto` to split free vertical space), a correct submit added height to the scrolling cluster and pushed the whole CTA block down — exactly "buttons resize."

**Fix:** the reveal now **replaces** the `[data-lesson-prompt]` row in place — the same slot the "Build what you hear." cue occupies before the answer — instead of appending a new element. Same row, same line-height; a correct submit changes what the row *says*, never the page's total height. The old separate paragraph is removed.

```tsx
<p data-lesson-prompt="" className="text-lg leading-snug text-text-secondary">
  {submitted && isCorrect && (step.translation ?? step.prompt) ? (
    step.translation ?? step.prompt
  ) : (
    <PromptWithEmphasis text={formatPrompt(step.prompt)} />
  )}
</p>
```

**Verified:** `ListeningBuildTranslationReveal.test.tsx` (5/5 green) — rewrote the "shows after correct submit" case to assert **zero new `<p>` elements** are added and the reveal text lands inside `[data-lesson-prompt]`; rewrote the "falls back to `prompt`" case, which used to assert the fallback text appeared **twice** (prompt row + reveal) — it now appears once, since the reveal IS the prompt row.

**Sibling check:** this reveal mechanism (#142) exists only on `listening_build`; `BuildSentenceStepView` has no equivalent English-reveal feature to check for parity. `ListeningComprehensionStepView` (MCQ, not build) never had this paragraph either — N/A.

### #200 / #201 — ようとした vs てみた (rows 195–196) — Spencer decision, 3 parts implemented

Spencer's ruling, in full: ようとした is **never** glossed as bare "tried to X" (that's てみた's English) — house wording is "was going to X," with "(but didn't)" reserved for the rule card, not every gloss.

**1. Gloss rule, whole-course sweep.** Grepped `you-to-suru` + `とした` across `m34.ir.yaml` (the only module with this grammar point) — **14 occurrences of "tried to"** (Spencer estimated ~16 from his walk; close enough that I'm reporting the exact grep count rather than reconciling the 2-item gap): the grammar point's `rule` + 2 `examples`, the `とした` vocab card's `gloss`/`shortGloss`, and 8 sentence/particle-cloze/listening-comp/challenge English fields. All rewritten to "was going to X." Recompiled (`node scripts/compile-ir.mjs m34`) — diff is exactly these 12 English-string edits, nothing else (`git diff m34.ir.json`, 28 lines). Listening-comp distractors were re-checked against the new phrasing and stay valid foils ("I had the coffee" ≠ "I was going to have the coffee").

**2. Rule-card contrast.** Added, verbatim, inside the same `you-to-suru` rule rewrite (§#198 above): *"たべてみた — you ate it, to see. たべようとした — you were going to eat it, and didn't."*

**3. Near-miss feedback on the typed translate step.** New `src/features/languages/ja/nearMissYouToSuruTemita.ts`: `isYouToSuruTemitaNearMiss(acceptedAnswers, inputKana)` is a table lookup (8 verb pairs, scoped to the verbs m34 actually teaches this way — documented as extendable, not a general conjugator, since a godan verb's て-form isn't derivable from its volitional stem by a fixed rule). When a ようとした-keyed step is answered with the same verb's てみた form, `TranslateStepView` now shows *"てみた means you did it; this sentence needs ようとした — you were going to, and didn't."* **above** the accepted-answers list instead of leaving the learner with only the list. 行ってみた stays wrong on the library step, as specified. Also fires for a kanji-typed てみた answer (goes through the same #203 kanji→kana path first).

**Tests (failing-test-first):** `nearMissYouToSuruTemita.test.ts` (6/6 — fires on kana and kanji てみた input, doesn't fire on an unrelated wrong answer, doesn't fire when the accepted answer isn't ようとした-keyed, doesn't fire for a different verb's てみた); 3 new cases in `TranslateStepView.kanjiFallback.test.tsx` (pure-kana, kanji-typed, and negative case).

**Sibling check:** ようとする is JA-only (no KO/ES/FR equivalent grammar point at this tier); the near-miss check lives in the shared typed-grading path (`TranslateStepView` only — it's the only place a learner free-types a full ようとした sentence; MCQ/listening-comp/particle-cloze steps for this grammar point are selection-based, not typed, so there's no "near miss" to name there).

**Added to `docs/spencer-product-sentiment.md`** (§ Japanese content): *"English glosses must carry the aspect the Japanese form carries"* — quoting #200 ("doesn't this imply the result happened?") — apply: never gloss ようとした as bare "tried to."

### #202 / #204 — とお ("ten") fragmented from its counter (rows 197, 199) — DECISION ITEM

**Located and root-caused**, not silently changed, per the brief's rule that anything touching how a word is taught is Spencer's call.

`とお` (native-counting "ten," distinct from じゅう) is a real, correctly-glossed word — `m32.ir.yaml:258`: `gloss: "ten (native counting)", shortGloss: "ten"`. It is **not** a fragment of とおか (10th day) or any other compound; that's a coincidental false lead in Spencer's question. The actual defect: `とお` is listed in `m32-neo-5`'s `introduces:` array (`m32.ir.yaml:491`, `introduces: [ボタン, おす, きかい, うごく, おと, まわす, うごいて, とお]`) — a lesson entirely about **buttons/machines/switches** ("ボタンを おすと きかいが うごく" — if you press the button, the machine starts) — but **とお never appears in a single sentence, beat, dialogue or challenge anywhere in that lesson.** It's registered as "taught here" with zero supporting example. That's exactly why it surfaces in review/flashcards completely divorced from any numeric context, next to unrelated match-pair words (call/wallet/park/straight/elevator) and alone on a flashcard with no counter — which is precisely Spencer's own house rule: *"we shouldn't be separating numbers from their counters, should be illustrated together."*

The course's `つ`-counter series (m9) — ひとつ, ふたつ, みっつ — is where this belongs conceptually: m9's own rule text already says *"It works for objects... It stops at とお (10) — past that you use the plain numbers"* (`m9.ir.yaml:55`), naming とお as the series' endpoint, but never actually teaching it as vocabulary there. よっつ, いつつ, むっつ, ななつ, やっつ, ここのつ are never taught as vocab anywhere in the course either — only ひとつ/ふたつ/みっつ (m9) and the orphaned とお (m32) exist as registered atoms from this whole series.

**No floor catches this class.** `atomExposureAudit` checks that a word gets enough exposure across later modules; nothing checks that an `introduces:`-declared atom is actually **used** in its own debut lesson. That's a gap worth adding regardless of which option below is picked (flagged, not added by this lane — new floor, out of scope for a feedback-item fix).

**Options:**

1. **Move `とお`'s introduction to m9**, alongside the series it belongs to, with a real example sentence completing ひとつ・ふたつ・みっつ・…・とお (at minimum a recognition-only beat, matching m9's existing "you only need to recognize the stopping point" framing). Removes it from m32-neo-5's `introduces:` (harmless — it was never exercised there). **This is the fix that matches Spencer's own stated rule most directly** — my recommendation.
2. **Give it a real sentence in m32-neo-5** using とお in a counting context (e.g., a "press the button ten times" sentence), keeping it where it currently sits but fixing the "never actually taught" gap locally. Smaller diff, but leaves とお sitting in a lesson about machines rather than with its counting family — doesn't fully answer "should be illustrated together."
3. **Drop `とお` from the course entirely** if the つ-series was only ever meant to go through みっつ (m9's own rule text's "It stops at とお" reads as scene-setting, not a promise to teach it) — simplest, but throws away a real, correctly-glossed N5 word for no content reason.

**My recommendation: option 1.** It is a genuine authoring gap (an atom registered with zero supporting sentence), not a difference of opinion, and m9's rule text already sets up exactly this payoff. Any of the three is a bulk-content change (new/moved example sentence(s), `courseAtoms`/`introduces` edits, recompile + gate) and per the HARD RULE (no inline bulk authoring) would go to a Sonnet lane once you pick one, not be done inline here.

Per the coordinator's instruction, only #200/#201 were decided this pass — #202/#204 are listed here as the decision Spencer has not yet weighed in on.

### #203 — kanji-keyboard typed-answer normalization (row 198)

**Located:** `src/features/lesson/components/steps/TranslateStepView.tsx` (the same library sentence, `としょかんに いこうとしたけど、じかんが なかった。`). `acceptedAnswers` are authored in kana; `gradeTypedAnswer` (`src/shared/speech/loose-match.ts`) already folds accent and hiragana↔katakana script, but not kanji↔kana. A learner typing on a real IME/kanji keyboard reaches for 図書館/行こう, and the literal compare fails even though the answer is right.

**Fix:** new `src/features/languages/ja/readingAnnotation/typedAnswerKanjiFallback.ts` — `gradeTypedAnswerJa()` tries the literal (kana) compare first, and only when that fails **and** the input contains kanji does it convert kanji→kana via the same kuromoji reader the speaking step already uses (`convertToHiragana`, fixed for #188/#189/#190 in B28B) and retry. Pure-kana input (the overwhelming majority of submits) never touches kuromoji. Wired into:

- `TranslateStepView.tsx` — the lesson-step Check button, plus a `warmKanjiReading()` mount effect (mirrors the speaking step's intro warm-up) and a "Checking…" disabled state while the fallback awaits.
- `src/features/practice/WritingPracticePage.tsx` — the standalone writing-practice surface (sibling grading surface, same "typed against a kana target" shape).
- `src/features/practice/conversation/turns.tsx` — the conversation-practice type rung.

In both siblings, KO/ES stayed **fully synchronous** (unchanged timing) — only the JA path that actually needs to await kuromoji goes async, avoiding a behavior change for the other two languages' grading timing.

**Sibling check — swept `rg -l gradeTypedAnswer src`:** the three files above are every free-typed-answer surface that grades JA against `acceptedAnswers`/`target`. `FillBlankStepView.tsx` also has a text input but is m1's kana-row-introduction step type (single-hiragana fills, no kanji possible) — checked, N/A. `ParticleClozeStepView`/`AgreementClozeStepView`/`ConjugationClozeStepView` are selection-based (tap an option), not typed — N/A.

**Tests (failing-test-first):** new `TranslateStepView.kanjiFallback.test.tsx` (6 cases: kanji-typed grades correct, pure-kana never calls the fallback, kanji-typed-but-wrong still fails, plus the 3 near-miss cases from #200/#201). `WritingPracticePage.test.tsx` and JA curriculum suite re-run green (see §3).

### #205 — flashcard centering / font-size / bolding (row 200)

**Located:** `src/features/flashcards/components/ReviewCard.tsx:158` (the word-face `<p>` wrapping `CardFront`/`KanjiRuby`, both Recognition and Production modality flashcards).

**Font size/weight — fixed.** Was `text-3xl font-medium`; Spencer's ask ("font size and bolding... so they can see words better") is bumped to `text-4xl font-bold`, applied to **both** modalities (recognition and production), not just the screenshot's one card — same `<p>` renders both.

**Centering — investigated, deliberately not touched.** The reading "はたら" over 働 (だ suffix "く" outside the annotation) overhangs the kanji's own width because `KanjiRuby`/`.kanji-ruby[data-fit]` (`src/shared/readingAnnotation/KanjiRuby.tsx`, `src/index.css:830`) start-aligns any reading wider than its kanji run **by design** — this is the fix for TestFlight #36, where centering a wide reading over a short kanji run with a kana suffix pried the word apart on WebKit ("忙(いそが)しい" rendering as "忙 しい"). 働く's reading (3 kana) over its 1-kanji run doesn't qualify for the safe centered subset (`kanjiRubyFits`), so it start-aligns and visually overhangs to the right — reading correctly, but not centered. This spans **154 switchover-eligible words course-wide** (per the B28B #186 audit) — flipping it without device measurement risks reintroducing #36. Per `mobile-ui-verify`, a device-rendering claim needs the 15 Pro Max simulator; I did not have time to run `sim:capture` against the flashcard review surface this lap. **Flagged, not fixed** — needs a measured pass (WebKit ruby-overhang geometry, both `data-fit="true"` and `="false"` cases) before any `ruby-align` change.

**Verified:** `ReviewCard.test.tsx` (2/2, new) — asserts `text-4xl font-bold` on both modalities, `text-3xl`/`font-medium` absent.

## 3. Tests run

- `npx tsc -b` — clean throughout.
- `npx vitest run --project curriculum src/features/languages/ja` — **8072 passed, 6 skipped** (96 files).
- Scoped new/changed test files — **23/23 passed**: `TranslateStepView.kanjiFallback.test.tsx`, `ListeningBuildTranslationReveal.test.tsx`, `nearMissYouToSuruTemita.test.ts`, `ReviewCard.test.tsx`, `WritingPracticePage.test.tsx`.
- `npx vitest run src/features/flashcards` — **339 passed, 1 skipped** (40 files) — no regressions from the font-size bump.
- `npm run content:emit` — green.
- `npm run module-gate -- m34 --compact`:
  - **PASS** — m34 module tests, `tsc --noEmit`, exposure audit (informational).
  - **FAIL** — TTS deck emit: `ENOENT .../lingo-data/data/test_decks/ja-keita-dialogue.json`. Environment gap — this worktree has no sibling `lingo-data` checkout (audio isn't in this repo; per `content-change` §10). I changed no JA/audio text, only English glosses — unrelated to this lane's content diff.
  - **FAIL** — visual-QA contracts + capture: `TimeoutError: page.waitForURL` on Auth0 login. Environment gap — Playwright auth setup needs an interactive login this background lane can't drive (per the `screenshot` skill's own note).
  - **FAIL** — FULL vitest (CI parity): `proceduralQa.test.ts` — JA Q3 reports 0 applicable steps (below its committed floor) because this worktree's JA lexical sidecar Python venv (`scripts/lexical/ja/.venv`) has no `sudachipy` installed. Confirmed this is worktree-local, not caused by this lane: symlinked `artifacts/lexical` (fixed the earlier `clozeStemFold` compile drift — see below) and `scripts/lexical/ja/.venv` in from the primary worktree; the venv's own `python -c "import sudachipy"` still fails there too (`ModuleNotFoundError`), so even the "reference" venv is incomplete — pre-existing environment gap, not something this lane's content edit caused or can fix.
  - Re-ran the JA curriculum suite directly (bypassing the two infra-gated stages) — 8072/8072 green, confirming the content diff itself is sound.

**One incidental fix along the way:** my first `node scripts/compile-ir.mjs m34` (before symlinking `artifacts/lexical` from the primary worktree) silently skipped B28B's cloze-stem-fold (`scripts/lib/clozeStemFold.mjs`, #192) because this lane's worktree had no `artifacts/lexical/jmdict/index.json` — recompiling would have UN-folded the そつぎょう cloze and shipped an unrelated regression. Caught via `content-change`'s "diff the untouched module first" rule before it landed; fixed by symlinking the JMdict index in, not by touching the compiler or the cloze content.

## 4. Not done this lap

- The `とお`/じゅう decision (#202/#204) — root-caused, options + recommendation above, awaiting Spencer.
- #205's ruby-centering half — needs a `sim:capture` pass against the flashcard review surface before any `ruby-align`/`data-fit` change.
- A structural floor for "an `introduces:`-declared atom must appear in its own lesson's content" (the class #202/#204 falls into) — named, not built.
