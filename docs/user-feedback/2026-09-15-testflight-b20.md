# 2026-09-15 — TestFlight feedback, builds 17/19/20 (Spencer) — research doc

Pulled 2026-09-15 late via the App Store Connect API. Crashes: **0**.
Screenshot items: **18** (API rows 152–169; 20:58Z–21:43Z). Shots at
`/private/tmp/…/scratchpad/tf-b20/<n>.jpg` (session scratchpad, not committed).

Purpose: a working sheet for Fable + Spencer to walk the list. Every item has
the located step (file:line), an answer or root cause, and a decision flag.
Same shape as `2026-09-15-testflight-b15.md`; recurrence analysis lives in
`2026-09-15-recurring-complaints-rca.md`.

**Where he was, in order.** #152–#158 are **one lesson**, walked end to end:
`ja-m34-neo-3` ("「いこう？」 — the plainest invitation there is",
`m34.ir.yaml:285`), 18 compiled steps, finished 15/17 at 3:08. Step map
verified by walking `?step=0…17` against the dev server:

| step | what | item |
|---|---|---|
| 0–1 | rule card (volitional, invitation) | |
| 2, 4, 6, 8 | filler vocab MCQ ("Pick the word for …") | |
| 3, 5, 7 | build beats (こうえん / としょかん / コーヒー) | |
| 9 | particle-cloze, register (いきませんか) | (#153's sibling) |
| 10 | listening build (ぷりん) | |
| **11** | build — "If you're free tomorrow…" (`m34.ir.yaml:303`) | **#152** |
| **12** | listening-comp — "Who is this line addressed to?" (`:304`) | **#153** |
| **13** | dialogue sim "Saturday plans", turn 3 (`:320`) | **#154** |
| **14** | speaking practice テレビ | **#155** |
| 15 | challenge build (`:323`) | |
| **16** | filler vocab MCQ "evening meal, dinner" | **#156** |
| **17** | match pairs (review), 6 pairs | **#157** |
| — | lesson complete | **#158** |

#159/#160/#162 are the **kanji switchover beat** (`kanjiRollout.ts:69`) —
a `kanji_reveal` step plus a `fill_blank` kanji cloze, promoted to the front
of a dynamic review lesson (`dynamicReviewPrefix.ts`). #166/#167 and #168 are
`m34-neo-review-1` (`m34.ir.yaml:327`).

Local links assume the dev server (`VITE_DEV_AUTH_BYPASS=true npx vite --port
5399`); `?step=N` is 0-indexed. Prod = same path on
`https://app.openlingoapp.com`.

**Measured, not guessed.** Every sizing number below was taken on the running
dev server at 430×932 with touch emulation, in both Chromium and WebKit
(Playwright), reading computed boxes out of the DOM — not read off the
screenshot. Where the device disagrees with the emulator, that is said
explicitly, because that disagreement is itself the finding.

---

## 0. Already in flight — do not touch in this wave

| # | Quote (short) | Lane |
|---|---|---|
| 151 | "Its still playing audio into the next step…" | audio-bleed lane (`crossStepAudioBleedGuard`) |
| 161 | "Inventory page overflow above status bar :(" | inventory safe-area lane |
| 163 | "Renshuusuru is a regression, check previous reports" | content lane (JA gloss/verb) |
| 164 | "Bad distractions and 'an elevator' should just be elevator" | content lane (gloss + distractors) |
| 165 | "We take too much space here, maybe audio play button sits on the left…" | listening-header lane |
| 169 | "It doesn't look like it's sending my progress over… do they fight eachother?" | progress-reconciliation lane |
| 155 | "Speaking step broke… slow to initialize… then it says error" | **speech lane, live now** — `SpeechRecognizerPlugin.swift` (uncommitted: `prepare()` warm-up, cached recognizer, `contextualStrings`) + new `src/shared/speech/acceptedForms.ts`, citing #155 and #171 |

Note for the #161 lane: **#157 below is the same defect class** (the lesson
stage's visible box is ~200 px shorter on device than in any emulator), so the
two lanes should compare notes before either ships a fix.

---

## 1. Table

| # | Quote | Class | Finding (one line) | Size | Spencer? |
|---|---|---|---|---|---|
| 152 | "still mad with the UI sizing we need more targeting troubleshooting" | sizing (systemic) | Measured: content fills 303 px of a 932 px window; **320 px (34%) is dead space** and every tile sits pinned at the 45 px `--tile-box-h` floor. Nothing about the phone tier changed in b18–b20, so b17's complaint is still live at b20. | M (one token rule) | N — position stated |
| 153 | "these questions… way too easy, the sentence can be ignored… make the options 'polite, informal, either'… cloze is bad for politeness… maybe we brainstorm" | content design | There are exactly **3** "Who is this line addressed to?" beats in all of JA, all in m34, **all three with byte-identical option sets**; and **5** register clozes, all keyed on a ます/です ending. He is right on both counts; the 4th option is also silently dropped on phones (`MAX_LISTENING_MCQ_OPTIONS = 3`). | L (new step type) | **Y — brainstorm** |
| 154 | "Is this not acceptable? Also where is the kanji here" | grading + kanji | (a) No. He placed 2 of 3 tiles (いえ+で, no みよう) — incomplete regardless of いえ/うち, and there is no synonym lane anywhere in the repo. (b) Kanji is absent because `dialogue_sim` has **no `*Annotation` field at all**, so the kanji surfacer structurally cannot reach it. | S (content) + M (kanji) | Y: accept いえ as a synonym? |
| 155 | "Speaking step broke… slow to initialize and then I got the answer right and then it says error" | speech (device) | **In flight** (see §0). Two findings the live lane should fold in: the on-screen copy proves the utterance **reached the scorer and was graded a miss** (mismatch and hard-error use different strings), and the untouched residual risk is the **silent on-device→server retry** at `SpeechRecognizerPlugin.swift:470-478`, which restarts the clock without telling JS. No speech code changed in b16–b20 — this is not a regression. | in flight | N — hand over the device plan |
| 156 | "Text wrap is so ugly here, shrinking the font size floor is preferred and we can fill up to a certain size" | sizing (systemic) | **There is no text-fitting code anywhere in `src/`** — every tile font is a fixed token. Also: the wrap does **not** reproduce in Chromium or WebKit at 430×932 (measured 1 line, 192×176.8 px, 30 px font), so it is a WKWebView metric difference and needs the sim. | M (token rule) | N — token proposal below |
| 157 | "Some regression in tile sizing here" | sizing (regression) | Real regression, with a commit: `a8624814` (**build 17**) raised `--match-tile-h` 4.75rem→5.25rem (+8 px × 6 rows = **+48 px**) and dropped `--match-font-scale` 1→0.91. Grid is capped at **6 pairs** (`moduleCompiler.ts:1738`) and needs 568 px; the device stage gives ~478 px. | S (cap) / M (clamp) | N — position stated |
| 158 | "Positioned too high vertically" | sizing | `LessonComplete.tsx:144` is `min-h-[60vh] … justify-center`: the block centres inside 60% of the window (559 px) and the bottom 35% is empty. Raw `vh` here also violates the stage's own cqh rule (`index.css:894`). | S, one line | N |
| 159 | "This step still failing in mobile, needs actual device sim please" | animation bug (WebKit) | Confirmed bug, not a mid-frame artifact: the gloss only renders once the sequence is **finished** (`KanjiRevealAnimation.tsx:277`), yet both shots show the word cut ~50% through — and the cut clips the **base glyphs too**, not just the reading. Completes correctly in Chromium and Playwright WebKit (verified `inset(0px 0% 0px 0px)`). Same class as the TestFlight #12 note already in the file. | M | N — fix + sim test |
| 160 | "This fill is good, maybe we force a sentence build first though and then this step? And we play around with the UI on it" | design | The switchover beat is fixed at reveal → cloze (`kanjiRollout.ts:69`, `kanjiClozeStep.ts:60`). Inserting a build between them is a real content-shape change, not a tweak. Layout: ~380 px dead below the tiles. | M–L | **Y — design** |
| 162 | "It looks like this is a 'wipe away' thing. Maybe we make it like a scratch off lol, would be super satisfying" | idea | It is a wipe — 5 beats, 2 720 ms total, `krv-wipe`/`krv-erase` clip-paths (`revealKeyframes.tsx`). A scratch-off would also **delete #159's bug class**, because a user-driven mask needs no animation to land. | M–L | **Y — idea** |
| 166/167 | "These feel like a lot of the same repeat questions too" → "Nevermind ignore previous comment these are review" | closed | Closed by him. Worth recording anyway: the lesson he walked had **5 filler vocab MCQs in 18 steps (28%)**, drawn by the recent-window filler pool — the exact failure `recentVocabWindow.ts:108` was written to prevent. | none | N |
| 168 | "the less than 5 tile sentences fix should address this right?" | scope question | **No.** That screen is `particle_cloze` (`m34.ir.yaml:335`), whose 3 items are MCQ options, not sentence tiles. The lane's predicate `isSentenceBuildStep` (`contentFloors.ts:68`) rejects it on its first line. 549 of 559 particle-cloze beats have exactly 3 options — that is the type's normal shape. | none | N — answered |

---

## 2. How to walk it with Spencer

**Answered, no change needed** (2): #167 (he closed it), #168 (scope answered).

**Mechanical, no decision, ship as one lap** (4): #157, #158, #159, and the
#154 content half (one `alsoAccepted` line) if he says yes to the synonym.

**One structural fix that closes four items** (#152, #156, #157, #160 layout):
the fill-the-stage + fit-the-text token rule in §4.

**Needs one call each** (5): #153 register brainstorm · #154 synonym policy ·
#160 build-before-cloze · #162 scratch-off · #155 device test slot.

**Device-only, cannot be closed from here** (2): #155 (in flight — needs a
Debug-build run to confirm), #159 (needs a sim check after the fix).

---

## 3. Per-item detail

### #152 — "still mad with the UI sizing"

- **Quote:** "Yeah I'm still mad with the UI sizing we need more targeting troubleshooting" (build 17)
- **On screen:** `build_sentence`, prompt "Build: If you're free tomorrow, want to hang out at the park?", empty tray with "Tap tiles to build the sentence", 9 bank tiles in 2 rows (こうえん 朝 に 駅 明日 で だったら あそぼう？ ひま — 明日 carrying あした furigana), CHECK far below with a large empty band between.
- **Located step:** `src/features/languages/ja/curriculum/ir/m34.ir.yaml:303`, lesson `ja-m34-neo-3`, compiled step **11**. Local `http://localhost:5399/ja/learn/lessons/ja-m34-neo-3?step=11` · Prod same path.
- **Class:** sizing (systemic, not this view).
- **Answer / finding — measured at 430×932, touch, current HEAD (b20):**

  | band | y range | px |
  |---|---|---|
  | header chips end | — | 63 |
  | **dead space** | 63 → 219.4 | **156.4** |
  | prompt (2 lines) | 219.4 → 275.4 | 56 |
  | tray (2 ghost rows) | 302.4 → 400.4 | 98 |
  | bank (2 rows) | 427.4 → 522.9 | 95.5 |
  | **dead space** | 522.9 → 686.3 | **163.4** |
  | CHECK | 686.3 → 736.3 | 50 |

  **319.8 px of a 932 px window — 34.3% — is empty**, while every tile renders at exactly 45 px, which is `--tile-box-h`'s *floor* (`tileSizingTokens.ts:79`, `base: 45`). The tiles are at their minimum in the middle of a third of a screen of unused room. Tile font is 18.3 px (`--tile-font` base); a 4-kana tile is 105.7 px wide, a 1-kana tile 35.4 px.

  **Nothing that ships on a phone changed between b17 and b20.** `git diff 44000589..HEAD -- src/index.css` adds only (a) a `@media (min-width:640px) and (orientation:portrait) and (pointer:coarse)` tablet-portrait block, and (b) `--tap-bump`, which is `0px` outside landscape-tablet (verified: computed `--tap-bump: 0px` at 430×932). So his build-17 complaint is **still exactly true on build 20** — no one has told him that, and he should be told.

  Secondary, same screen: the three kanji tiles render 36.5 px / 36.5 px / 48.7 px wide (朝 駅 明日) against 105.7 px for a 4-kana tile, each with a 2-line box (glyph + furigana). That is the #119 "kanji tile looks squat" class again, unfixed.
- **Fix (proposed, stated as a position):** one token rule, not a per-view hack — see §4. Tiles get a floor **and a ceiling** and grow into the stage's free space via `cqh`, the same clamp pattern the match and particle tiers already use (`index.css:1612`, `:1620`). Registry entries `--tile-box-h-max` (and the existing `--tile-box-h` as the floor) land in `tileSizingTokens.ts` so he can dial both on `/ja/qa/tiles`.
- **Decision needed:** none. Position: this is the single highest-yield sizing change left, because the same rule closes #156, #157 and #160's layout complaint.

---

### #153 — register questions are too easy

- **Quote:** "I think for these questions they are good but way too easy, and the sentence can be ignored. We should limit these, make the options 'polite, informal, either' and then replace most of them with something else that tests register, cloze is bad for politeness since the ending is always masu or desu based and easy to figure out. Maybe we brainstorm here"
- **On screen:** `listening_comprehension`. Eyebrow "LISTEN AND ANSWER", play button, sentence いっしょに図書館にいこう？, question "Who is this line addressed to?", three options — "A friend, not a teacher" (picked), "Either — register doesn't show here", "A shop clerk you don't know".
- **Located step:** `m34.ir.yaml:304`, lesson `ja-m34-neo-3`, compiled step **12**. Local `…/ja-m34-neo-3?step=12`.
- **Class:** content design (step-type doctrine).
- **Answer / finding:**
  1. **He is right that the sentence can be ignored — the option text gives it away.** "A friend, not a teacher" names the answer; the other two are transparently wrong. The audio is decorative.
  2. **There are only three of these in the entire JA course**, and all three are *the same question*: `grep -c 'Who is this line addressed to?'` over all 41 `ir/*.ir.yaml` → **3** (`m34.ir.yaml:304`, `:342`, `:573`), and all three carry a byte-identical distractor array (`["A teacher, not a friend", "Either — register doesn't show here", "A shop clerk you don't know"]`). So "we should limit these" is already true numerically — the problem is that the three are clones, which is why the second and third read as filler.
  3. **A fourth authored option is silently dropped on his phone.** `ListeningComprehensionStepView.tsx:29` `MAX_LISTENING_MCQ_OPTIONS = 3`, trimmed by `selectDisplayedOptions()` (`:49-69`) whenever `compact` is true, keeping the correct answer and a seeded pick of distractors. He authored 4 and saw 3 — which is *why* "A teacher, not a friend" was missing and the grid looked thin. (Same defect noted at b15 #141, "only 3 of 4 authored options rendered"; now root-caused.)
  4. **On cloze and politeness he is also right.** There are **5** register-testing particle-clozes (stems containing せんせいに), and each offers a ます/です-ending option beside a plain one (e.g. `m34.ir.yaml:299` いきませんか / いこう？ / いきます; `:337` のみましょう / のもう / のみます). The ending *is* the answer. Meanwhile the course teaches register 521 times through "Say politely:" production prompts — which b19 just turned into structured metadata (`registerCue.ts`), a badge, not a test.
- **Fix (raw material for the brainstorm, not a recommendation):**
  - **His scheme, literally:** a fixed 3-option register probe — *polite / informal / either* — where the options are constant across every instance, so the only signal is the audio. That inverts today's failure: the option text stops carrying the answer. Cheap to build on `listening_comprehension` (fixed option set, authored answer only) and it makes "either" a real, common answer instead of an obvious foil.
  - **The step type that actually tests register production:** give the learner one sentence and *two* audiences (a friend / your section head) and make them build or pick the right form for each — register becomes a transform, not a recognition.
  - **Kill the cloze-with-ます tell:** if the three options differ only by ending, the distractor generator is doing the teaching. Either force options that share an ending and differ elsewhere, or drop register clozes entirely in favour of the probe above.
- **Decision needed: YES — brainstorm.** The three specific questions to put to him: (1) fixed *polite/informal/either* options on every register probe, or keep authored per-beat options? (2) retire the 5 register clozes, or keep them as low-stakes review? (3) does the probe replace the 3 existing "addressed to" beats, or sit beside them?

---

### #154 — "Is this not acceptable? Also where is the kanji here"

- **Quote:** "Is this not acceptable? Also where is the kanji here"
- **On screen:** `dialogue_sim`, scene "Saturday plans / Ken wants to do something this weekend", TURN 3 OF 3. Submitted bubble reads いえ で → うちでみよう。 "Let's watch at my place." Feedback: "Not quite — Correct answer: うちでみよう。" with the で/に explanation. Goal line "Suggest your place." Tiles: いえ and で selected; みよう, に, うち unselected. All kana.
- **Located step:** `m34.ir.yaml:320` — `reply: { mode: build, tiles: ["うち","で","みよう","に","いえ"], answer: "うちで みよう。" }`; explanation at `:322`. Lesson `ja-m34-neo-3`, compiled step **13**. No `alsoAccepted` on this turn — and **zero** `alsoAccepted:` occurrences exist in any JA `ir/*.yaml`.
- **Class:** grading question + kanji-surfacing gap.
- **Answer / finding — grading path:**
  1. `DialogueSimStepView.tsx:227` → `isBuildReplyAccepted(placed→tiles, turn.reply, moduleIndex)`.
  2. `dialogueSim/simTurnLogic.ts:43-52` — false if nothing placed; else normalise `placed.join(" ")` and test membership in `acceptedBuildSurfaces`.
  3. `simTurnLogic.ts:25-35` — the set is seeded from `[reply.answer, ...(reply.alsoAccepted ?? [])]`, expanded by `expandAcceptedAnswers` (`translateVariants.ts:147`), then `normalizeTypedAnswer`.
  4. `expandAcceptedAnswers` does register widening, particle-phrase scrambling and a few spelling rules. **It never substitutes one lexical item for another.** Membership is exact after normalisation; there is no partial credit.

  **So: no, it should not have been accepted, and it is not close.** He placed **2 of the 3 required tokens** — いえ + で, with みよう left in the bank — and a 2-token string can never match a 3-token accepted surface. Even うち + で alone would have failed identically. The いえ/うち question is therefore *separate* from the rejection he actually hit.

  On the synonym itself: うち and いえ are deliberately distinct atoms — `courseAtoms.ts:342` (うち, the possessive "my place") vs `courseAtoms.ts:196` (いえ, kanji 家, the building). There is no synonym lane in the repo at all (`grep -rn "synonym" src` → 0 hits). But the file that grades this step opens with the opposite doctrine (`simTurnLogic.ts:1-13`: "MAX-ACCEPTANCE is the point of this file… marking a real one wrong is the worst thing a simulation can do", and `types.ts:1670-1680` quoting him on 2026-07-24). Under his own stated rule, いえでみよう is a real way to say it.

  **The genuine content defect here** is the explanation (`m34.ir.yaml:322`): it explains で vs に and says nothing about いえ vs うち, even though いえ is seeded in the bank precisely to test that split. A learner who picks いえ is told nothing about the half of the mistake he actually made.

  **Secondary UI gap:** Check enables the moment one tile is placed (`DialogueSimStepView.tsx:223-224, 585-590`) — nothing warns that unused tiles remain against a 3-token target.
- **Answer / finding — kanji:** `applyKanjiSurfaces` (`secondScript/applyKanjiSurfaces.ts:305`, called from `mockLessons.ts:240,252`) rewrites a value **only** when its key satisfies `isAnnotationKey` (`:260-261`, `endsWith("Annotation")`). `DialogueSimTurn` / `DialogueSimNpcLine` / `DialogueSimReply` (`types.ts:1655-1700`) carry only plain strings — `kana`, `audioText`, `gloss`, `tiles`, `answer` — and **no `*Annotation` field at all**, so the surfacer cannot reach this step type at any module. There is no `readingPolicy` concept in the repo (`grep -rn "readingPolicy" src` → 0 hits). For these specific words: 見 (`n5Kanji.ts:444`) and 家 (`n5Kanji.ts:1258`) both unlock at module 14, well before m34 — so 見よう and 家 *would* show if the plumbing existed; うち has no `kanji` field by design (`courseAtoms.ts:342`) and stays kana regardless.

  Verdict, one sentence: **no kanji on a dialogue sim is an unaddressed plumbing gap, not a ruling** — unlike `particle_cloze`, where the kana-only choice is written down (`types.ts:1035-1041`, b15 #133).
- **Fix:**
  - If he accepts いえ: one content line at `m34.ir.yaml:320` — `alsoAccepted: ["いえで みよう。"]`. The mechanism exists (`types.ts:1689`) and is simply unauthored anywhere in JA.
  - Regardless: extend the explanation at `:322` with the いえ/うち sense split (S, content).
  - Kanji: add `*Annotation` fields to the three dialogue-sim types and thread them through `DialogueSimStepView` (M, code) — affects every sim in the course.
- **Decision needed:** Y — "accept いえ for うち in casual speech?" My position: **yes, accept it**, because `simTurnLogic.ts`'s own doctrine says so and the で/に teaching point survives either noun; and fix the explanation either way.

---

### #155 — speaking step slow, then wrong  *(IN FLIGHT — handover notes)*

> A speech lane is already working this in the shared worktree: uncommitted
> changes to `ios/App/App/SpeechRecognizerPlugin.swift` add a `prepare()`
> warm-up, a locale-keyed recognizer cache and `contextualStrings`, and a new
> `src/shared/speech/acceptedForms.ts` grades on partial results — its own doc
> comment cites **#155 "slow to initialize"** and #171. The three items below
> are what that lane should fold in; do not open a second lane.

- **Quote:** "Speaking step broke or something recently, it is slow to initialize and then I got the answer right and then t says error"
- **On screen:** "SPEAKING PRACTICE", card with play button, テレビ, gloss "TV". Mic button dimmed, labelled "Tap to speak". Body copy: "Still not quite — keep trying, or continue if you'd like to move on." Buttons "KEEP TRYING" and "CONTINUE WITHOUT PASSING".
- **Located step:** compiled step **14** of `ja-m34-neo-3` (filler speaking beat drawn from the module pool; テレビ is in `m34-neo-2`'s reviewPool). View: `SpeakingStepView.tsx`.
- **Class:** speech / native (device-only).
- **Answer / finding:**
  1. **The screen tells us which path ran.** `SpeakingStepView.tsx`'s helper-text chain (≈`:793-882`) checks `recog.error` **before** the verdict branches, and every error state has its own copy ("Speech recognition hit an error…", "Microphone access blocked…", "We didn't hear anything…"). "Still not quite" (`:871-876`) is reachable **only** when `recog.error` is falsy and the scorer graded a miss on attempt ≥ 2. So the utterance reached the matcher and was rejected — this is not an engine error, whatever the word "error" in his note meant. The dimmed mic is the ordinary `disabled:opacity-40` state (`:999`) once `canSkipAfterTry` is true; it looks alarming only because the accent token is a brick red (`tokens.css:24`).
  2. **The matcher is not the obvious suspect.** テレビ is 3 morae → the most lenient band, `perfect 0.30 / close 0.15` (`moraTiers.ts:31`). Normalisation already folds katakana→hiragana, full-width, romaji→kana and kanji→kana before comparing (`loose-match.ts:416-458`, plus kuroshiro `convertToHiragana` in the grading effect). A clean "terebi" should pass easily.
  3. **What does fit both halves of the complaint: the silent on-device→server retry.** `SpeechRecognizerPlugin.swift:404` starts the task with `onDevice: r.supportsOnDeviceRecognition`. The file's own comment (`:414-429`) says that flag means "iOS knows a model for this locale", not "it is downloaded" — and when the on-device task dies before any transcription, `:470-478` **cancels and restarts over the server path without notifying JS at all**, resetting `startedAt` (`:475-477`) but not rewinding the captured audio. From the UI there is no event, no error, just a long quiet gap → "slow to initialize"; and the re-armed task can miss the front of the utterance → a truncated transcript. `substringScore`'s 60 %-coverage floor (`loose-match.ts:770`) is not met by a 1–2 character fragment of a 3-character target, so a genuinely correct "テレビ" lands in try-again.
  4. **Nothing broke recently.** `SpeechRecognizerPlugin.swift` and `useNativeSpeechRecognition.ts` have exactly one commit, `9d782f42` (2026-09-01) — two weeks before build 17. `SpeakingStepView.tsx`'s last touch is `d8d3cf8d` (b19) and is purely the register-cue badge. `b12e4102`'s step-audio guard does **not** touch this view (verified `git show --stat`: cloze-family views only). This is a pre-existing intermittent failure surfacing now because we are finally walking this step on a real phone.
  5. **A second, independent defect worth fixing while we are here:** `useNativeSpeechRecognition.ts:334-361` collapses *every* native error string to `"unknown"` (asserted by its own test at `:157-186`), so even when Swift knows exactly what failed, the UI cannot say.
- **Fix / device test plan** (he asked for "actual device sim", so this is the concrete version):
  - **What Spencer does:** (1) run a **Debug** build on his phone — `CAPLog.print` diagnostics are silent in Release/TestFlight; (2) open any JA speaking step and say テレビ once, 5 times in a row; (3) note wall-clock delay from tap to the "Listening…" copy each time.
  - **What we log / read:** the console lines already in the plugin — `SpeechRecognizerPlugin.swift:436` (`onDeviceSupported=… requiresOnDevice=…`) and `:465` (`recognitionTask error: … | domain#code`). **Two `task locale=…` lines for one tap, the second with `requiresOnDevice=false`, is the proof** of the silent retry; the gap between them is the "slow to initialize".
  - **What we add** (small, ships with the lane): forward the real error string instead of `"unknown"` (`useNativeSpeechRecognition.ts:334-361`, widen `SpeechErrorCode` at `useSpeechRecognition.ts:49-56`); emit `{ elapsedMsSinceStart, onDevice }` on the first partial so JS can see engine selection; add `elapsedMs` + `bestScore` to `SpeechLogEntry` (`speechLog.ts:28-47`) so the next report carries the score margin, not just pass/fail.
  - **Not a substitute:** the env-gated simulator harness reproduces the old plugin-registration bugs only; on-device model state differs on a simulator (the memory note records the flag answering differently minutes apart).
- **What the live lane has NOT covered (fold these in):** (i) the silent
  on-device→server retry at `SpeechRecognizerPlugin.swift:470-478` is untouched
  — a warm recognizer and contextual hints make the *first* attempt faster but
  do not stop the fallback from eating the front of an utterance; (ii)
  `useNativeSpeechRecognition.ts:334-361` still collapses every native error to
  `"unknown"`; (iii) the device run above is still the only way to confirm the
  retry actually fires on his phone.
- **Decision needed:** N for the fix; he only needs to pick a slot for the Debug-build run.

---

### #171 — pre-load the accepted readings  *(IMPLEMENTED — speech lane, uncommitted)*

- **Quote:** "I think we need to pre-load the accepted readings onto the lesson so the exact moment they say the word fully it is marked as correct."
- **On screen:** テレビ / "TV", "Perfect!", YOU SAID てれび. He got the pass — the complaint is that it arrived late.
- **Class:** speech / shared (JS) + native.
- **What shipped in this lane:**
  1. `src/shared/speech/acceptedForms.ts` (new) — `buildAcceptedForms()` computes the full accepted set at step MOUNT from data the step already carries: the target surface, the kana reading(s) off `targetAnnotation`, the kana fold of a katakana target, and any `SpeakingStep.alsoAccepted` (new optional field). Normalisation folds punctuation, spacing, katakana→hiragana, romaji, inverse-text-normalised numbers, and 長音 (`ー` expands to the held vowel; おう/おお and えい/ええ are generated as extra spellings of the target, never collapsed on the transcript side — collapsing would merge おばさん with おばあさん).
  2. **Told to the recogniser.** The set goes to `SFSpeechAudioBufferRecognitionRequest.contextualStrings` on every request the attempt builds, including the server-path retry, plus `taskHint = .dictation`.
  3. **Graded on every PARTIAL.** `matchAcceptedAlternatives()` runs against each interim hypothesis and its whole N-best list; an exact normalised hit (or ≤ the edit budget, which is 0 for a target of ≤3 morae) marks correct, stops the recogniser and shows the success state immediately. This is what makes it work for Japanese: the kanji surface is itself an accepted form, so no kuroshiro round-trip is in the fast path.
  4. **The verdict is monotonic.** Once an attempt has passed, later results, revisions and errors are logged and ignored — both in the state machine and in the helper-text chain, which now answers `perfect`/`close` before any error branch. That is #155's "I got the answer right and then it says error": closing the mic on a match makes the recogniser report the cancellation we asked for.
  5. **Warm-up.** New native `prepare()` — locale-keyed `SFSpeechRecognizer` cache + authorization settled — runs on mount while the learner reads the card. The audio session deliberately stays a tap-time cost (activating `.playAndRecord` at mount would route the model clip through the recording path). `start()` no longer restores and deactivates the playback session immediately before reconfiguring it: two `AVAudioSession` round-trips per tap, removed.
  6. **Instrumentation** behind `?speech-debug=1`: tap→listening, tap→first partial, the native phase breakdown (permissions / recognizer / teardown / audioSession / engine / task / total), and whether the hypothesis came from the on-device model or the silent server fallback.

#### Device test plan — #171 (6 lines, for Spencer)

1. Install the **Debug** build on the phone (`CAPLog.print` is silent in Release/TestFlight), open a JA speaking step, and append `?speech-debug=1` to the lesson URL once so the dial sticks for the session.
2. Say **テレビ** normally, then stop talking; watch the moment "Perfect!" appears — it should land while you are still finishing the word, not after a pause.
3. Say it **four more times in a row**, and once deliberately wrong (ラジオ): the wrong one must still say "Still not quite", and no attempt may show an error message after showing "Perfect!".
4. Read the debug strip under the mic: `accepted (N keys, ±0): テレビ · てれび` confirms the readings were preloaded, and `startup: tap→listening Xms · tap→1st partial Yms` is the #155 number.
5. In the same strip, `onDevice 1` means the on-device model answered; `onDevice 0` means it died and we fell back to the server — that fallback is the "slow to initialize" suspect, and the console line `[speech-timing] on-device task died after …ms` says how long it cost.
6. Repeat once on a **kanji** step (m19's 夏休み or 店がしまる) to confirm the annotated reading is accepted, and once with AirPods in to confirm the audio route still sounds like the app and not a phone call.

- **Decision needed:** N. Needs the Debug-build run above; the same slot covers #155.

---

### #156 — "text wrap is so ugly here"

- **Quote:** "Text wrap is so ugly here, shrinking the font size floor is preferred and we can fill up to a certain size"
- **On screen:** filler vocab MCQ, prompt `Pick the word for "evening meal, dinner"`, 2×2 grid — ばんごはん (picked, wrapping as ばんごは / ん), れんしゅう (wrapping as れんしゅ / う), こうえん, だいがく. CHECK below.
- **Located step:** compiled step **16** of `ja-m34-neo-3`. Not authored — filler drawn from the recent-window pool (`grammarHelpers.ts:1378` builds the `Pick the word for "…"` prompt). Rendered by `BuildSentenceStepView.tsx:618-664` (`isSingleAnswerPicker`, `correctOrder.length === 1` at `:297`) as `Tile variant="option"`.
- **Class:** sizing (systemic).
- **Answer / finding:**
  1. **Measured, and it does not reproduce off-device.** At 430×932 touch, Chromium **and** Playwright WebKit both give: tile 192 × 176.8 px, font-size **30 px**, `lines: 1` for ばんごはん — no wrap. 5 kana × 30 px = 150 px of ink in a 192 px box with 7 px side padding. The device wrapped at 4 glyphs, so WKWebView is resolving either a wider advance or a narrower content box. This is precisely the trap in the `ios-simulator-sizing-harness` note — **Chromium missed the b14 regression the same way**. Re-measure on the 15/16 Pro Max simulator before tuning any number.
  2. **But the number is not the fix he asked for, and the fix he asked for does not exist.** `grep -rln "useFitText|fitText|autoFit|shrinkToFit" src/` → **zero hits**. Every tile font in the app is a fixed token: this grid is `[data-tile][data-variant="option"][data-size="word"]` → `font-size: 1.875rem` hard-coded (`index.css:1564`); the `pick` tier is `var(--option-font)` (`:1603`, base 1.375rem). Nothing anywhere measures text against its box. So *any* string one glyph longer than the token allows will wrap, on some device, forever.
- **Fix — the token proposal (this is §4, restated for this item):** add a *fit* pair per tier — `--option-font-min` / `--option-font-max` — and drive the actual size from the tile's own inline size, with `white-space: nowrap` so the clamp is the only escape valve. For CJK this is exact, because every glyph is 1 em:

  ```css
  [data-tile] { container-type: inline-size; }
  [data-tile][data-variant="option"] {
    /* free width ÷ glyph count, never above the design size, never below the floor */
    font-size: clamp(
      var(--option-font-min),
      min(var(--option-font), calc((100cqi - 2 * var(--option-px)) / var(--tile-chars, 1))),
      var(--option-font)
    );
    white-space: nowrap;
  }
  ```

  `--tile-chars` is set once, inline, by the `Tile` primitive (`tiles/Tile.tsx`) from the child's glyph count — one place, every step type, no per-view hack. Latin-gloss tiles (match targets, sentence options) use the same rule with a 0.55 em width factor. Register `--option-font-min` in `tileSizingTokens.ts` so `/ja/qa/tiles` gets a slider for the floor and he can dial "how small is too small" himself, which is the actual question.
- **Decision needed:** none — but he will want to dial the floor on the QA page once it exists.

---

### #157 — match grid "regression in tile sizing"

- **Quote:** "Some regression in tile sizing here, same as previous suggestion applies a bit if we can"
- **On screen:** "Match each Japanese word to its meaning (review)", 6 rows × 2 columns; the 6th row (おばあさん / "convenience …") is **cut off mid-tile**, with the rest of the screen below it empty black. No CHECK (match auto-advances).
- **Located step:** compiled step **17** of `ja-m34-neo-3`; `MatchPairsStepView.tsx`. Pair count is capped at **6** — `moduleCompiler.ts:1738` `.slice(0, 6)`.
- **Class:** sizing — a real regression **and** a device-only stage-height defect.
- **Answer / finding:**
  1. **The regression is real and has a commit.** `a8624814` ("bake Spencer's second mobile dial-in"), shipped in **build 17** — the build he was on:

     | token | before (`cfd672b7`) | after (`a8624814` → HEAD) |
     |---|---|---|
     | `--match-tile-h` | 4.75rem (76 px) | **5.25rem (84 px)** |
     | `--match-font-scale` | 1 | **0.91** |

     Six rows therefore grew **+48 px** while the text shrank 9 %. Bigger boxes, smaller words — exactly what "regression in tile sizing" describes. Unchanged at HEAD, so it is still live on b20.
  2. **The clipping is a stage-height defect the emulator cannot see.** At 430×932, Chromium and WebKit both fit: rows 76.7 px, grid 168 → 668 px, `scrollHeight == clientHeight` (no overflow). At 430×839 (modelling the safe-area insets) the grid *shrinks itself* to 62.8 px rows via its `cqh` clamps (`index.css:1473-1529`) and still fits. But measuring his screenshot: rows are **88 CSS px**, the grid starts at **254 px** and is cut at **≈732 px**, with **200 px of dead black below** — i.e. on device the lesson stage's usable box ends ~200 px above the window bottom, the `cqh` container over-reports, the tiles never shrink, and 568 px of grid is given 478 px. Six pairs do not fit; five would.

     **This is the same defect as #161** (inventory overflowing above the status bar). The two lanes should share a root-cause fix on the stage height chain (`LessonShell.tsx:141`, `[container-type:size]` on the scroller) rather than patch two symptoms.
- **Fix:** three options, in ascending order of blast radius:
  - **(a) S, today:** `moduleCompiler.ts:1738` `.slice(0, 6)` → 5 on coarse-pointer phones. Removes the overflow outright, costs one review pair.
  - **(b) M:** make `--match-tile-h` a clamp on the stage's free height so six rows always fit (`clamp(3.25rem, 11cqh, 5.25rem)`), which is the same fill-the-stage rule as §4 and also answers "same as previous suggestion applies".
  - **(c) L, shared with #161:** fix the stage height chain so `cqh` is the *visible* box on device. Needed eventually; not this wave.
  My position: ship (a) now, (b) with the §4 lane, leave (c) to the #161 lane.
- **Decision needed:** none.

---

### #158 — lesson complete "positioned too high"

- **Quote:** "Positioned too high vertically"
- **On screen:** lesson-complete card — check circle, "Lesson Complete!", the lesson title, 88 % / 15 of 17, "2 day streak · Level 1 · 395/500", NEXT LESSON, "Drill these words (2)", Return — the whole block in the upper two-thirds, with a tall empty band beneath Return.
- **Located step:** `src/features/lesson/components/LessonComplete.tsx:144`.
- **Class:** sizing.
- **Answer / finding:** the container is

  ```
  mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 py-12 text-center
  ```

  `justify-center` centres the content inside a box whose height floor is **60 % of the window** — 559 px of 932 — not inside the stage. The block is ~560 px tall, so it fills that box and the remaining ~35 % of the screen below stays empty. That is the complaint, exactly.

  Second, smaller point: `60vh` is a raw viewport unit inside the lesson stage, which `index.css:894` and CLAUDE.md's "Lesson UI stability rules" explicitly forbid in favour of `cqh` ("`vh` over-reserves on short windows and pushes content into overflow"). This is the one surface still using it.
- **Fix:** one line — `min-h-[60vh]` → `min-h-full flex-1` (the stage column already supplies the height), keeping `justify-center`. The block then centres in the real free space on every window. S; also removes the last raw `vh` in the lesson tree. Pairs naturally with b15 #136, where he already asked for a smaller check and three buttons.
- **Decision needed:** none.

---

### #159 — "this step still failing in mobile, needs actual device sim please"

- **Quote:** "This step still failing in mobile, needs actual device sim please" (build 19)
- **On screen:** "You already know this word / Here is how it's written." A red **み** where a reading should be, and beneath it a glyph cut clean in half — the left half of 水 — then the gloss "water", then CONTINUE. Cropped and upscaled to confirm: the cut is a hard vertical edge, and the right half of the glyph is simply absent.
- **Located step:** `kanji_reveal` (`KanjiRevealStepView.tsx`), animation in `steps/kanjiReveal/KanjiRevealAnimation.tsx`, injected by the switchover beat (`kanjiRollout.ts:69`) into a dynamic review lesson's prefix (`dynamicReviewPrefix.ts`). Word: みず/水.
- **Class:** animation bug — WebKit repaint.
- **Answer / finding:**
  1. **It is not a mid-animation frame.** The gloss renders only when `settled` — `{settled && <Gloss …/>}` at `KanjiRevealAnimation.tsx:277`, where `settled = phase >= 4`. Phases are `[560, 380, 900, 620, 260]` ms (`:141`), and the reading wipe (`krv-wipe`, 560 ms, `animation-fill-mode: both`) starts at 1 840 ms and ends at 2 400 ms — before phase 4 at 2 460 ms. **The gloss being on screen proves the wipe had already finished.** It had finished and the word was still half-painted.
  2. **The clip is eating the base glyphs, not just the reading.** The CSS only ever targets the annotation ink — `.krv-choreo[data-paint="painting"] .kana-helper-ink { animation: krv-wipe … }` (`:302`), on the `<span class="kana-helper-ink">` inside the `<rt>` (`KanjiRuby.tsx:83`). The base is documented as static ("the paint is a clip on the `<rt>` ALONE… the base glyphs are completely static", `:288-290`). Yet #159 shows half of 水 missing and #162 shows 明 without 日 — **both at ~50 %, both cutting reading and base on the same vertical line.** So in iOS WebKit the clip-path on the ruby annotation is clipping the whole ruby box, and the animation's end frame is never repainted.
  3. **It does not reproduce anywhere we can automate.** Probed `/ja/qa/kanji-reveal` at 430×932 in Playwright **WebKit**, 6 s after load: `data-paint="painting"`, computed `clip-path: inset(0px 0% 0px 0px)` — fully revealed, correct. Chromium likewise. Desktop WebKit ≠ WKWebView on iOS here.
  4. **The file already knows this hazard.** `:212-220`: "WebKit is not reliable about repainting a `visibility: hidden → visible` flip inside a clipped stage while sibling animations run — the switchover beat on a 15 Pro Max painted a lone fragment of the kana and no kanji at all (**TestFlight #12**)." That fix swapped `visibility` for `opacity`. #159 is the same hazard one layer down: the surviving `clip-path` animation inside the ruby.
- **Fix:** stop animating `clip-path` on ruby internals — the ruby box is the thing WebKit mis-clips. Two options, both structural:
  - **(a)** wipe an **overlay**, not the ink: an absolutely-positioned rect over the annotation band, animated with `transform: translateX()` (a compositor property, no clip on ruby geometry), removed at the end. The ruby itself is never touched, so there is no end frame to repaint.
  - **(b)** wipe a **decoy copy** of the reading positioned over the `<rt>`, then hard-cut to the real ruby — exactly the trick phase 2 already uses for the base glyphs (`:236-262`), and the file already argues that a hard cut at identical geometry is invisible.
  Prefer (a): fewer moving parts, and it survives any future ruby change.
- **Device verification (he asked for it):** after the fix, run the switchover beat on the **15/16 Pro Max simulator** via the safaridriver + `CAP_DEV_SERVER` harness (memory `ios-simulator-sizing-harness`), capture at t = 3 s and t = 6 s, and assert the rendered word equals the full kanji + full reading. Add that as a pinned sim check, because no Chromium/WebKit run will ever catch this class.
- **Decision needed:** none — unless he takes #162's scratch-off, which replaces this code entirely.

---

### #160 — "this fill is good, maybe we force a sentence build first"

- **Quote:** "This fill is good, maybe we force a sentence build first though and then this step? And we play around with the UI on it"
- **On screen:** "Fill in the blank", English hint "I'll just drink water (a simple statement, no complaint)", the sentence 水 だけ のむ with 水 slotted into the underlined blank, four kanji option tiles 半 / 水 (spent) / 庭 / 卵, then a long empty band and CHECK.
- **Located step:** `fill_blank` (`FillBlankStepView.tsx:79` is the literal "Fill in the blank" heading), generated by `kanjiClozeStep.ts:60` as the **graded half of the switchover beat** — it always follows the `kanji_reveal` in #159 (`kanjiRollout.ts:69`).
- **Class:** design (step-shape) + layout.
- **Answer / finding:** the beat is a fixed pair today: reveal → cloze, promoted to the front of a dynamic review lesson. His suggestion is to make it reveal → **build** → cloze, i.e. produce the sentence first and *then* choose the written form. That is a content-shape change to the switchover beat, not a tweak: it changes the beat's step budget (2 → 3), its position in the review prefix, and what "getting the kanji question wrong" means for the latch rule (`kanjiRollout.ts`, "it should unlock immediately UNLESS they get the kanji question wrong"). Worth doing — the retrieval before the recognition is the stronger order — but it needs his call because it re-times the whole switchover ladder.

  On the UI half: the layout is a stack of `gap-6` blocks with no fill rule (`FillBlankStepView.tsx:70-140`), so the tiles end ~300 px down a 932 px screen and CHECK sits at ~686 — roughly **380 px of dead space**, same disease as #152. The §4 rule covers it.
- **Fix:** (1) his call on the 3-step beat; (2) the §4 fill rule for the layout; (3) minor — the spent 水 tile stays in the bank greyed rather than moving into the blank, which is why the answer reads twice on one screen.
- **Decision needed: YES — design.** Question to him: make the switchover beat **reveal → build → cloze** (3 steps, longer review prefix), or keep 2 steps and put the build *after* the cloze as the payoff?

---

### #162 — "make it like a scratch off lol"

- **Quote:** "It looks like this is a 'wipe away' thing. Maybe we make it like a scratch off lol, would be super satisfying"
- **On screen:** same step as #159, word 明日/あした, gloss "tomorrow" — showing あし over 明, i.e. the identical ~50 % cut.
- **Located step:** `KanjiRevealAnimation.tsx` (`RevealChoreo`), keyframes in `kanjiReveal/revealKeyframes.tsx`.
- **Class:** idea (and, incidentally, the same bug as #159).
- **Answer / finding:** he read it correctly — it *is* a wipe. The sequence is his own, chosen 2026-07-29 from the bake-off at `/ja/qa/kanji-reveal` and quoted in the file header (`:8-11`): "ink wipe for 5 where it unwipes the tomodachi kana, then 3 the components slide together, then unwipe tomodachi on top in the furigana." Five beats totalling **2 720 ms**, using `krv-erase` and `krv-wipe` clip-paths with linear timing (`revealKeyframes.tsx:27-31`). Continue is held until it finishes (`KanjiRevealStepView.tsx:38-42`), deliberately, so the reveal cannot be skipped.

  **A scratch-off would be strictly better on three counts:** (1) it makes the learner *do* something on an ungraded card, which is the documented weakness of this step ("ungraded reads as 'not going to be tested on this'", `KanjiRevealStepView.tsx:15-19`); (2) it replaces the held Continue with a natural completion signal; (3) it **deletes #159's bug class** — a pointer-driven mask needs no animation end frame, so there is nothing for WebKit to fail to repaint.

  Cost: a canvas or CSS-mask scratch surface over the word, pointer/touch handling, a coverage threshold to auto-complete, and a reduced-motion / no-pointer fallback that just shows the finished word. Call it M–L, and it makes the #159 fix moot rather than additive.
- **Fix:** prototype it on the existing bake-off page (`/ja/qa/kanji-reveal` already hosts candidates side by side — that is what it is for) and let him pick, exactly as he picked the current one.
- **Decision needed: YES — idea.** Question: prototype the scratch-off on the QA page now (and hold the #159 wipe fix), or ship the #159 fix first and treat scratch-off as a later polish?

---

### #166/#167 — "a lot of the same repeat questions" → "nevermind, these are review"

- **Quotes:** "These feel like a lot of the same repeat questions too" → "Nevermind ignore previous comment these are review" (both build 20)
- **On screen:** two filler vocab MCQs a minute apart — `Pick the word for "park"` (としょかん / らいしゅう / こうえん / おかね) and `Pick the word for "an elevator"` (れんしゅう / エレベーター / しゅくだい / ばんごはん). The second also carries a "Resumed from step 14 of 28" toast wedged between the grid and CHECK.
- **Located step:** filler MCQs in `m34-neo-review-1` (`m34.ir.yaml:327`), 28 steps. Prompt built at `grammarHelpers.ts:1378`; pool narrowed by `recentVocabWindow.ts`.
- **Class:** closed by the founder — recorded for the pattern only.
- **Answer / finding:** he closed it himself, correctly. Worth keeping on the record: the *teaching* lesson he walked earlier (`ja-m34-neo-3`) also carried **5 filler vocab MCQs in 18 steps — 28 % of the lesson**, at steps 2, 4, 6, 8 and 16, none of them authored. `recentVocabWindow.ts:108` exists precisely because a thin filler pool "is how `m10-neo-1` once shipped the same 'Pick the word for person' MCQ five times in one lesson". The window is doing its job (no word repeated here), but the *density* of one filler step type is high enough that a review lesson reads as repetitive even when the items differ. If he raises it again, the lever is filler-type variety per lesson, not the pool.

  Cosmetic, one line: the resume toast is bottom-anchored (`ToastContainer.tsx`, `bottomOffsetClass` set by the lesson) and lands between the option grid and CHECK. It is transient and does not block a tap; not worth a lane.
- **Fix:** none this wave.
- **Decision needed:** none.

---

### #168 — "does the <5-tile fix cover this?"

- **Quote:** "Not sure if this addresses as well but the less than 5 tile sentences fix should address this right?"
- **On screen:** "COMPLETE THE SENTENCE" — bordered card with "Let's go to the library", 図書館に [いこう] 。 with the answer slotted in green and an audio button, three option tiles いく / いった / いこう below, then the volitional explanation and CONTINUE.
- **Located step:** `m34.ir.yaml:335` — `{ kind: particle-cloze, stem: "としょかんに ", tail: "。", answer: "いこう", options: ["いこう","いく","いった"], … }`, in lesson **`m34-neo-review-1`** (`:327`). Compiled to `type: "particle_cloze"` (`grammarHelpers.ts:446`, dispatched at `moduleCompiler.ts:1588-1603`), rendered by `ParticleClozeStepView.tsx` (header string at `:187`, mapped at `StepRenderer.tsx:249-251`).
- **Class:** scope question.
- **Answer / finding: no — it is out of scope, and shipping that lane will not change this screen.** The extend-answers lane filters on `isSentenceBuildStep` (`contentFloors.ts:68-71`):

  ```ts
  if (step.type !== "build_sentence" && step.type !== "listening_build") return false;
  …
  return (s.correctOrder?.length ?? 0) >= 2;
  ```

  `particle_cloze` fails on the first line, before any tile counting. `ANSWER_TILE_FLOOR = 5` (`contentFloors.ts:35`) counts `correctOrder.length` — sentence-construction tokens. The three things on this screen are `step.options`, a fixed authored MCQ array; there is no tile bank and no sentence to assemble. The original ask behind the lane (b15 #139) was about a `listening_build` bank with only three tiles, which is a different mechanism.

  For completeness: **549 of 559** particle-cloze beats in the JA course have exactly 3 options (3 have 2, 1 has 4) — 3 is the type's normal shape, not an artefact. And unlike `listening_comprehension`, this view does **not** trim on mobile (`ParticleClozeStepView.tsx:253` maps `step.options` straight through; no `selectDisplayedOptions`), so what he saw is exactly what was authored.
- **Fix:** none. If he wants cloze option counts raised, that is a separate content sweep across 559 beats and needs its own decision.
- **Decision needed:** none — answered.

---

## 4. Cross-item themes

**A. One rule would close four items: fill the stage, fit the text.**
#152 (34 % of the build screen empty, tiles at their floor), #156 (no fit
mechanism exists anywhere), #157b ("same as previous suggestion applies"),
#160 (~380 px dead below the tiles). Today every tile size is a fixed token
with a floor and no ceiling, and no component ever measures text against its
box. The proposal, as tokens rather than per-view hacks:

- **Fill:** every tile tier gets a ceiling beside its floor, and its height is
  `clamp(<floor>, <n>cqh, <ceiling>)` off the stage's free space — the pattern
  `particle` and `pick-fluid` tiers already use (`index.css:1612`, `:1620`).
  New registry entries in `tileSizingTokens.ts` (`--tile-box-h-max`,
  `--option-py-max`) so `/ja/qa/tiles` gets sliders for both ends.
- **Fit:** `--<tier>-font-min` per tier plus a glyph-count-driven size
  (`calc((100cqi - 2*pad) / var(--tile-chars))`) clamped between that floor and
  the design size, with `white-space: nowrap`. `--tile-chars` is set inline in
  one place — `tiles/Tile.tsx`.

That is literally what he asked for in #156 ("shrinking the font size floor is
preferred and we can fill up to a certain size"), expressed once.

**B. The emulator is lying to us about phone layout — three times in this pull.**
#156 (wrap does not reproduce in Chromium *or* WebKit), #157 (grid fits in
both, clipped on device), #161 (in flight). The device stage's usable box is
~200 px shorter than any emulated one, so `cqh`-driven sizes never shrink when
they should. Until that chain is fixed, **no phone sizing claim should be made
from a Playwright run alone** — the `ios-simulator-sizing-harness` note said
this after b14 and it has now cost us a second wave.

**C. WebKit repaint hazards in the lesson stage are a recurring class, not a
one-off.** TestFlight #12 (`visibility` flip), now #159 (`clip-path` on ruby).
Both were "the element is in the right state, WebKit just did not paint it".
Rule going forward: in the lesson stage, animate only `transform` and
`opacity`, and never animate a property that alters ruby geometry.

**D. Register is taught 521 times and tested 8.** 521 "Say politely:"
production prompts (now badges, `registerCue.ts`) against 3 identical
listening probes and 5 clozes whose ます-ending is the answer. #153 is the
right complaint about the right gap.

**E. Max-acceptance is doctrine in the code and absent from the content.**
`simTurnLogic.ts:1-13` and `types.ts:1670-1680` both say a real answer must
never be marked wrong; there are **zero** `alsoAccepted:` entries in any JA IR
file, and no synonym lane anywhere. #154 is the first time that gap has been
visible to him; it will not be the last.

---

## 5. Decisions for Spencer

1. **#153 — register brainstorm.** (a) Fixed *polite / informal / either*
   options on every register probe, or authored options per beat? (b) Retire
   the 5 ます-tell clozes, or keep them as low-stakes review? (c) Does the new
   probe replace the 3 existing "addressed to" beats or sit beside them?
2. **#154 — synonym policy.** Accept いえ for うち on this sim turn? My
   position: yes, per `simTurnLogic.ts`'s own max-acceptance doctrine. Broader
   question behind it: do we start authoring `alsoAccepted` on JA sims at all
   (currently zero in the whole course)?
3. **#160 — switchover beat shape.** reveal → **build** → cloze (3 steps, a
   longer review prefix), or keep 2 and put the build after the cloze?
4. **#162 — scratch-off.** Prototype it on `/ja/qa/kanji-reveal` now and hold
   the #159 wipe fix, or ship the #159 fix first and treat scratch-off as later
   polish?
5. **#155 — device slot.** The speech lane is already shipping the warm-up and
   the vocabulary hints, but one Debug-build run on his phone (5 speaking
   attempts, console open) is the only way to confirm or kill the silent
   on-device→server retry underneath them. When?
6. **#152/#156 — tile fill/fit floors.** Once the §4 rule lands, he dials
   `--tile-box-h-max` and `--option-font-min` on `/ja/qa/tiles`. Does he want
   the sliders before the rule ships, or the rule at my defaults first?

7. **#157a — match-pairs on phones.** The compiler now trims to 5 pairs on
   phone-height stages, but `matchPairsFloor.ts` (MATCH_PAIRS_FLOOR = 6,
   the anti-brute-force floor) pads it back to 6 at runtime, so nothing
   changes on the device yet. Options: (a) let the floor be 5 on phones
   (slightly weaker brute-force guard), or (b) a view-level visible-pairs
   cap that keeps 6 pairs but shows 5 at a time. My position: (a) — the
   grid has to fit before it can be guessed at.

Everything else in this pull has a stated position and needs no call:
#157b (fit rule), #158 (one-line fix),
#159 (overlay wipe + a pinned sim check), #166/#167 (closed), #168 (answered).

---

## 6. Tile sweep 2026-09-16 — status of the sizing items, and seven numbers for Spencer

A three-phase device sweep ran on the iOS simulator (OL-15ProMax + iPad Air
11" M4, the real Capacitor WKWebView shell, `npm run sim:capture`) against
build 21 (`2854f209`). Phase 1 measured, phase 2A rebuilt the tile primitive,
phase 2B took six step views onto it, phase 3 closed the one regression 2B
introduced, finished the migration and re-swept. Reports:
`scratchpad/tile-sweep/{REPORT,PHASE2A,PHASE2B,PHASE3}.md`. **The probe was
fixed during phase 3** — it could not see a wrap inside a flex tile before
that, so every wrap number in phases 1 and 2A was blind and is re-stated as
measured or dropped.

### 6.1 Where the items stand

| item | status | the number |
|---|---|---|
| **#137** "the height of every tile should be the same, furigana should not change that" | **CLOSED on every build/listen bank** | 0px cohort spread on **40 of 40** build/listen cohorts re-measured, phone and iPad, 100/125/140. On the 58 cells that pair with a build-21 capture: **17 of 23** were ragged, worst **54.2%**. One owner now: `tileFit.ts` measures each cohort and publishes `--tile-row-h`; `--tile-box-h` stayed the dial. **Not closed for two non-bank shapes**, both stated: a listening-comprehension prose list (rows size to their text — 94% at 100%) and the match grid at 1180px width (70.4%). |
| **#152** "still mad with the UI sizing" | **OPEN — priced, not picked** | iPad dead space 65.1% (b21) → **51.9%** after the portrait ceiling went 1.25× → 1.75×. `--tray-grow: 1` reaches **23.6%** and costs the word 37px → 21px and #137 by 496px. Both ends are on `/:lang/qa/tiles`. Decisions 1 and 7. |
| **#156** "text wrap is so ugly here" | **Mechanism CLOSED, one dialled number open** | The 8-character cap that demoted a 2×2 grid of single Japanese words to the left-aligned prose tier is gone (`steps/optionTier.ts`: a grid is a WORD grid when no option contains whitespace). That grid is now centred, one uniform size, 22 → 27 → 31px at 100/125/140 with 0 overflow. `ありがとうございます` still takes a balanced two-line break at the 22px floor — decision 2. |
| **#157** match "regression in tile sizing" | **CLOSED** | It never reproduced on b21, and phase 2B then introduced a real one: 0 → **103px** of overflow at 125% with rows ragged **30%**. Phase 3: **0px overflow and 0% row spread on every match cell measured, both devices, 100 / 125 / 140%** (140% was 140px / 63.8%; the iPad at 125% was 25% ragged). Two halves: `match` joined FILL's SHRINK half while staying out of the grow half — growing a match label inside your `--match-tile-h` card is the thing you reported and it stays forbidden — and the width floor stopped riding the accessibility slider for tiles FILL cannot rescue, which also stopped the word-image card clipping its label at 125%. 100% is byte-identical to b21. Decision 3. |
| **#158** lesson complete "positioned too high" | **Fixed in source, still not device-verified** | `LessonComplete.tsx` `min-h-[60vh]` → `FITTED_SHELL_HEIGHT`. No route reaches that screen without finishing a lesson and the harness has no way to answer a whole lesson, so it has never been rendered on the simulator. |
| **#161** / the ~200px stage over-report | **Does not reproduce on the simulator** | `stageOverReportPx` = **0** on every staged capture across all three phases, both devices, 100/125/140 (one capture reads 1px at 140%). If it is real it is a device-only difference; nothing in the sim can see it. |
| **#165** "we take too much space here" (listening header) | **Half closed** | The answer grid under it overflowed the stage by **198px** at 125% on b21; it is **23px** now. The header block itself is **unchanged**: 135px (19% of the stage) at 100%, **203px (30%)** at 125%. It is `rem` prose chrome, not a tile — nothing in this sweep touched it, and it is the biggest single block on that screen. |
| **#168** particle-cloze scope | **Answered, and its own defect closed** | The answer is unchanged (out of the <5-tile lane). That screen's own sizing defect — three 70px options and **79px** of overflow at 125% — is **0px** now, on both particle routes. Carried observation, not a regression: at 125% the particle row renders 37px against 71px at 100% (the tier's `clamp(56px, 8cqh, 72px)` times the FILL shrink), which is the accessibility slider buying a shorter row rather than a scroll. |

### 6.2 What changed underneath, in one paragraph each

**The tile primitive now covers 14 of 34 step views** (5 before the sweep).
Six migrated in phase 2B, three more in phase 3 (`FillBlankStepView`,
`AgreementChainStepView`, `GenderSortStepView`) plus the dialogue-sim BUILD
bank, which was blocked until its `data-tile={kana}` QA hook — squatting on
the primitive's own marker attribute — was renamed `data-tile-kana`. Six
hand-written build tiers and three private fit systems died with those
migrations. The twenty views still off it each have a stated reason now:
`translate` and `speaking` render no tiles at all, `agreement_cloze`'s options
are inline choices inside a prose sentence (measured: 0 tiles, by design), and
`fill_blank` is authored in **zero** lessons across the four shipped courses.

**No `rem` anywhere in the tile system, and the accessibility slider reaches
tile TYPE again.** That pair is what fixed the 125/140% overflows and #87's
furigana inversion (reading:word ran 0.62 → 0.65 → 0.76 with the slider; it is
0.62 at every position now). Boxes stay px; one unitless `--tile-a11y-scale`
multiplies type.

**FILL works in both directions and no longer under-spends.** It may shrink an
overflowing stage as well as grow an empty one, and its anti-flicker cap now
releases once per layout generation on a stage that is not scrolling and has
more than 24px of measured slack — before that, a stage caught by a transient
overflow paid for it forever: `ja-m34-neo-3?step=11` at 125% rendered a
**19px** word with 85px of slack where the same step at 100% renders 23px, i.e.
the accessibility slider was making tiles smaller. It renders 21px now.

### 6.3 Two things the harness still cannot show you

- **Landscape iPad (the `sm` tier) has never been rendered on a device.** There
  is no rotation path (`simctl` has no orientation command, Simulator.app is
  not installed), and the `--orientation landscape` fallback is a width-only
  `<meta viewport>` trick: the layout viewport comes out 1180 × 1698, which is
  still portrait, so the tokens resolve to `tabletPortrait`. Proof from the
  capture rather than the code: the word renders at 37px = tabletPortrait's
  ceiling (`sm`'s is 25.5px). Those four captures are a good measurement of a
  1180px-wide portrait tablet (Split View) and are not landscape.
- **The mastered-kanji / reading-hidden tile (#117/#119) has never been
  rendered either.** The renderer hides a reading only when the kanji is past
  its grace window AND the atom is FSRS-mastered; the `kanji-mastered` seed
  profile writes unlocks and lesson progress but no mastery, so every kanji
  tile on an m42 step still shows its reading (店みせ, 行いった, 遊あそぶ,
  来くる, 食たべる). One seed change fixes it.

### 6.4 Numbered decisions

Seven numbers. Every one is measured on the 15 Pro Max or iPad Air simulator
(real WebKit, the Capacitor app shell), and every one is a taste call that a
measurement cannot make. The shipped value is stated first each time.

1. **`--tray-grow`: 0 (shipped) or 1.** The iPad dead-space dial, on
   `/:lang/qa/tiles`. Measured on `ja-m34-neo-3?step=11`, iPad Air, 100%:
   **0 → dead space 51.9%, word 37px, cohort height spread 0px.**
   **1 → dead space 23.6%, word 21px, cohort height spread 496px.**
   So #152's ≤30% target IS reachable, and it costs the whole FILL budget —
   the tile that #152/#119 are about drops 43% — plus #137, because the tray's
   ghost pre-sizer stretches to the grown tray. Shipped 0.

2. **The `word` option tier's FIT floor: 22px (shipped) or ~17px.** At 22px
   `ありがとうございます` wraps to a balanced, centred two-line break on
   `ja-m3-neo-5?step=12`. To hold it on one line the floor has to fall to
   ≈17px — and because the cohort takes the MINIMUM width ratio (one uniform
   size per grid, #137 and the 2026-05-17 "tiles looked broken" rule),
   `うん` in that same grid renders at 17px too, in a 178px-tall tile.
   Shipped 22px.

3. **How `match` is allowed to recover — and what the accessibility slider is
   allowed to do to a tile that cannot recover.** Shipped BOTH halves, because
   they close different cells: (a) `match` joins FILL's SHRINK half (never the
   grow half), which fixes every cell that actually scrolls; (b) the WIDTH
   floor stops riding the slider for any tile FILL cannot rescue — `match` and
   the word-image `image` tier — which fixes the cells that have room and
   therefore never scroll. Measured: `ja-m3-neo-5?step=23` overflow 103 →
   **0** at 125% and 140 → **0** at 140%, rows 30% → **0%** and 63.8% →
   **0%**; the same grid on the **iPad at 125%** went 25% row spread → **0%**,
   which (a) alone could not touch; `ja-m34-neo-3?step=17` at 140% is **0px**
   where (b) alone left 3px; and the word-image card at 125% stopped
   overhanging its box by 7.04px. Phone at 100% is byte-identical to build 21.
   **What (b) costs:** on those two tiers the slider no longer raises how small
   a label may shrink before wrapping, so a match label renders at the px
   Spencer dialled at every slider position instead of 17 → 20px. Growing a
   match label stays forbidden either way — that is #157.

4. **Three option TONES, or one.** `accent` (an MCQ correct answer is a solid
   accent fill), `success` (particle-cloze and — since 2B — the dialogue-sim
   replies use a success tint), `card` (word-image-MCQ uses a 10% accent wash,
   because the art is the subject). All three mean "the right answer". They
   are organic drift, carried verbatim through the migrations so each one was
   a transcription rather than a redesign. Collapsing them to one is a visual
   decision. The three dialogue-sim deltas 2B disclosed ride on this: an
   accepted reply's TEXT colour, a wrong reply's wash /10 → /15, the
   pre-submit tint `accent-muted` → accent/10.

5. **`--option-prose-py` on landscape tablet now trims DialogueSim's stacked
   replies too, not just the listening-comprehension list.** #148 dialled that
   padding for one view; the `row` tier is shared by both, so the trim follows
   the tier. The MCQ grid cell is untouched. Confirm that is wanted, or the
   `row` tier needs a second variant.

6. **The equal-rows cost, and the ruby-floor lever: `--ruby-floor-kanji` 12px
   (shipped) or 10px on the base tier.** #137 is verbatim and won — 0px spread
   on every build/listen cohort measured — but a cohort renders at its TALLEST
   tile's natural height, a ruby tile is taller than a kana tile, and FILL
   pays for it by shrinking the word: measured 21 → 16px (m16 listen), 21 →
   15px (m42 build), 25 → 19px (iPad m16). Below a 19.4px word the ruby is no
   longer 0.62 × word, it is the absolute 12px floor: `ja-m42-neo-challenge
   ?step=11` at 100% now renders a 17px word under a 12px reading —
   **ruby:word 0.71**, against the 0.62 target and the 0.67 the b13 fix landed
   on. Dropping the base kanji floor to **10px** (which is what `sm` has
   shipped since b13) restores 0.62–0.67 on those tiles and gives ~4px back
   per ruby row — ~16px on a four-row bank, which FILL then spends on the word.
   It is a readability floor Spencer set, so it is his number, not a fix.

7. **The portrait-iPad FILL ceiling: 1.75× (shipped) or 2.00×.** Swept on
   `ja-m34-neo-3?step=11`, iPad Air, 100%, four points: 1.25× (b21) → word
   26px, dead 65.1%; 1.50× → 32px, 57.0%; **1.75× → 37px, 51.9%**; 2.00× →
   42px, 46.3%. Zero wrapped, zero clipped and zero overflow at all four — no
   tile can exceed its own box at any ceiling, because the width fit caps
   every cohort. The curve is still falling at 2×, so this is not where FILL
   runs out; it is where a tile stops looking like a tile (42px is double this
   tier's own dialled 21px). One token if he wants it by eye.
