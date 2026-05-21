# 2026-05-18 — Tester M1+M2 walkthrough + Spencer's notes

First real-user session captured after the M3-M7 rebuild landed. Tester completed M1 in one day, M2 in the following day. Spencer also walked through the same content with his own observations.

**Spencer's framing**: tester observations should be treated as **near-gospel** for UX calls; his own observations carry a "grain of salt" caveat because he knows the vocab and has full curriculum context.

---

## 1. Tester observations (HIGH confidence — real user, no knowledge bias)

### What's working

| # | Observation | Implication |
|---|---|---|
| T1 | **Emojis fire well** — visual + audio cue on tap lands cleanly | Keep the emoji-tap audio pattern; consider extending |
| T2 | **Tap-emoji sound cue is welcomed** — "more sound cues" requested | High-leverage tiny add — audit places where a sound cue *would* fit but doesn't |
| T3 | **Romaji hint on-click for hiragana** — "very helpful, use more until mastery" | Per-glyph tap-to-romaji is a working scaffold; extend to other surfaces (cloze pills? options?) until kana mastery passes a threshold |
| T4 | **Pacing** — M1 done in one day, M2 the next; tester believes they'd retain well | Confirms the M1/M2 density bar is right. M3-M7 rebuild now matches this. |
| T5 | **5-flashcard next-day review prompt** — "not miserable, nothing more" | Keep the soft 5-card review; add escape hatches both ways (see T9) |

### What needs work

| # | Severity | Observation | Recommended action |
|---|---|---|---|
| T6 | **HIGH** | **「10」(juu) pronunciation does NOT register** — Whisper / TTS issue surfaced on both tester and Spencer | Verify TTS clip for `じゅう` is sharp; check Whisper STT acceptance threshold; flag if there's a manifest collision (e.g., `じゅう` resolving to a different audio asset). Likely a single-asset fix. |
| T7 | **HIGH** | **Aim-assist on tracing wanted** — explicit accessibility ask, framed as "alternative for tremors" — "draw it" mode that records cursor movement and snaps to strokes if start is near | New trace step variant: `mode: "assisted"` — if the user begins a stroke within N% of the target start point, render the canonical stroke at their cursor pace. Per-user accessibility profile (#R1-defer-E in CLAUDE.md) is the wrapper. |
| T8 | **MED-HIGH** | **More kana + word recap inside M2 sub-lessons** — at the end of sub-lessons 1 and 2 of each M2 lesson, add 3-4 more recall items | Extends CLAUDE.md `#R2-defer-F` (M1-only review tail) to M2 sub-lessons 1+2. Spec §3 / §10.4 compounding rule already supports this — agents need to apply it to M2 the way M3-M7 rebuild did. |
| T9 | **MED** | **5-card review needs escape hatches** — option to skip away OR go further before/after the 5 | "Skip review" + "Keep going" buttons on the next-day prompt. Pairs with the existing `LessonComplete` 3-button pattern (shipped 2026-05-17). |
| T10 | **MED** | **Subtle teaching of katakana wanted** — "likely needs a better way" — possible separate module around M10ish; use romaji as fallback if they don't want to get ahead | Currently M3-1 dumps 5 katakana loanwords + culture in one card (also flagged in audit synthesis §3.1 / §3.5). Proposed direction: spread katakana through M3-M10 as background exposure with romaji ruby; dedicated katakana module at ~M10 for those who want to push. |
| T11 | **MED** | **Sprinkle sentence patterns earlier** — introduce `わたしは X です` or just `X です` for early sentence examples, **don't explain `です` yet**, add `わたし` as soon as the kana is learned | Currently M3-2 introduces `です` formally. Tester wants the *pattern* earlier (in M1/M2 sub-lesson tails) before the rule is taught. Replaces some of the kana-only review tail from T8 with sentence-shape review. Mirrors how the existing `desu/ka` sprinkle on M1 ka-3 already works — extend pattern. |
| T12 | **MED-LOW** | **Word stepping for early audio** — break out mora with dramatized spacing (like English sounding-out), for early learners + accessibility | New audio variant or per-step toggle: instead of `こんにちは` played as one clip, play `こ … ん … に … ち … は` with audible inter-mora gaps. Off by default; on via accessibility profile or a per-step "slow it down" affordance. |

---

## 2. Spencer's own notes (MED confidence — knowledge bias caveat)

Spencer's words verbatim, paraphrased for brevity where the grain-of-salt was explicit:

| # | Severity | Observation | Notes |
|---|---|---|---|
| S1 | **MED (Spencer-tagged uncertain)** | **Too much review of words in a row for M2 sub-lessons** | Tension with tester T8 (who wants *more* recap at sub-lesson ends). Resolution likely: T8's 3-4 *cumulative* recap items at end-of-sub-lesson ≠ runs of word-only review steps mid-body. M2 should keep the spread; *add* end-of-sub-lesson recap. |
| S2 | **LOW (defer per Spencer)** | **"Word test only" feels boring** | Spencer flagged: "might be due to me knowing the words already." Don't act yet — re-evaluate when a 2nd real-user session lands. |
| S3 | — | **Less focused on teaching the kana themselves (in M2) — that's fine** | Confirms the M2 design intent. No action. |
| S4 | — | **Might be resolved with more module review elsewhere** | Future-cohort signal — track. |

---

## 3. Synthesis — actionable queue

Ranked by leverage × confidence:

### Do soon
1. **T6** Fix `じゅう` pronunciation registration — likely single TTS asset + a Whisper acceptance-threshold review.
2. **T11** Add sentence-pattern sprinkle (`X です` / `わたしは X です`) into M1/M2 sub-lesson tails once relevant kana is learned — replaces some of S1's "too much word review" with shape variety AND addresses T11.
3. **T8** Extend `#R2-defer-F` review tail to M2 sub-lessons 1+2 (3-4 cumulative items each). Author the additions interleaved with sentence-pattern sprinkle (T11) so the tail mixes recall + production shapes.
4. **T9** "Skip / Keep going" buttons on the 5-card next-day review prompt.

### Soon-ish
5. **T7** Tracing aim-assist variant — "draw it" mode for tremors. Per-user accessibility profile (#R1-defer-E) is the wrapper.
6. **T10** Katakana spread plan — exposure across M3-M10 with romaji ruby + dedicated module ~M10. Touches katakana strategy in `curriculum-roadmap-n5-2026-05-18.md` — add a §10.11 framework note when authored.
7. **T2** "More sound cues" — audit non-emoji surfaces that should chirp on tap (option commits, correct verdicts, sub-lesson completes).
8. **T3** Romaji on-tap extension — beyond per-glyph; reveal romaji under cloze pill options on long-press, etc.

### Defer
9. **T12** Mora-stepped word audio — accessibility/early-learner toggle. Defer until a learner explicitly needs it.
10. **S2** "Word test only feels boring" — re-evaluate after 2nd real-user session.

---

## 4. Cross-links

- **Audit synthesis §3.7** (M3-M7) already flagged the "Spencer" hardcoded name leak in M3-7 dialogue — orthogonal to this tester session, but same theme of "small polish items surface in real-user sessions."
- **CLAUDE.md `#R2-defer-F`** existing M1 prior-row review-tail item — T8 effectively asks to extend the same pattern to M2 sub-lessons 1+2.
- **CLAUDE.md `#R1-defer-E`** per-user accessibility profile — T7 (aim-assist) needs this as the wrapper.
- **Roadmap §10.7 sidequests** — T10 katakana spread + dedicated module is a candidate for the sidequest framework when authored.

---

## 5. Open questions for next session

- Which TTS clip is currently serving `じゅう`? Is the issue the clip itself (voice quality), the Whisper threshold, or a manifest hash collision?
- Tracing aim-assist: should it ship as a separate `mode: "assisted"` variant, or as a per-user accessibility-profile toggle that affects all trace steps?
- Sentence-pattern sprinkle (T11): which exact M1/M2 sub-lessons take the addition? Probably ka-3 (already has it), sa-3, ta-3 — but verify ki-row through wa-row before propagating.

---

## 6. Follow-on notes from the same session (Spencer direct, after the initial dump)

| # | Severity | Note | Status |
|---|---|---|---|
| S5 | **MED** | **Play button on trace lesson step needs to play the audio and have an audio icon.** The trace step had two visually identical "Play" buttons (audio + stroke-replay) both using the ▶ triangle icon — confusing which one is which. | **Shipped 2026-05-18** — added `volume` icon (Lucide `Volume2`) to registry; audio button now uses speaker icon, stroke-replay keeps triangle. Audio playback itself already worked via `playLocalAudio(getAlphabetAudioUrl(...))`. |
| S6 | **HIGH** | **MCQ correct-answer position randomization audit** — across every MCQ-shape generator in the codebase, verify the correct option's slot is randomized (not hardcoded). Run a quick simulation if needed to confirm position distribution is roughly uniform. | **In progress 2026-05-18** — initial pass found `selfExplain` is hardcoded slot-0 (every grammar-drill sub-lesson in M4-M7 affected); `vocabMcq` / `sentenceMcq` / `listeningCompSentence` use `slotFor` deterministic hash (good); `cloze` is caller-controlled (callers need verification); inline MCQs across mock-ja-m{3-v2,4,5,6,7}.ts need scan. Fix + simulation pending. |
| S7 | **HIGH** | **Match-pairs grids should never have empty slots.** Screenshot from M2 sub-lesson 1 shows a 4-slot grid with only 2 pairs filled (かぎ↔key, じゅう↔ten); other 2 slots empty. Spencer: backfill from prior-module review pool — empty space is wasted review opportunity. | **Queued** — `_consonantRowHelpers.ts` match-pairs factory needs underfill detection + backfill from `M1_REVIEW_POOL` / prior-row anchors. Likely small change. |
| S8 | **HIGH** | **`desu` and `か` need to be introduced separately** — current M2 (or M1 ka-3 sprinkle) intro card teaches both at once, tester finds it confusing. Plus the copy framing "`desu` inherently means 'it is'" is wrong — `desu` is the polite copula / sentence ender, not "it is" semantically. | **Queued** — check both M1 ka-row sprinkle + M3-2 `RULE_DESU_KA`. Split into two cards: desu first (polite copula, attaches to noun/adjective, marks formality), か later (turns statement into question without tone-rise). Rewrite "it is" copy to "polite ending." |
| S9 | **MED** | **Ka-row end card falsely claims "red introduced"** + quotes katakana out of context. Red (あか) is not taught in the ka-row lesson. | **Queued** — find offending `info-end` card on the M1 ka-row sub-lesson and strike the false claim. |
| S10 | **HIGH** | **Speech: 2-fail behaviour change.** Old rule auto-passed after attempt 2 ("reward the try"). New rule: after 2 fails, surface BOTH "Continue (skip)" AND "Keep trying" — learner picks. | **Shipped 2026-05-18.** SpeakingStepView attempts uncapped; passed → Continue; 2+ fails → Continue (skip, no pass) + Keep trying; speechLog gains `verdict: "continued"` for explicit opt-outs. |
| S11 | **HIGH** | **Diagnostic gating for failed mic / Whisper init.** Spencer's friend's mic wasn't working; we couldn't tell why. Need to (a) surface what went wrong with actionable copy, (b) capture enough state to triage post-hoc when a tester reports it. | **Shipped 2026-05-18.** Per-error helper copy now says what to fix (no-mic: "tap browser mic icon → allow", audio-capture: "check it's not in use", no-speech: "speak louder / check mute", not-supported: "try Chrome/Edge/Safari"). New 30s Whisper-load watchdog surfaces "still loading — slow connection? skip?" instead of staring forever. Persistent-error states (no-mic / audio-capture / unsupported / slow-load) surface "Skip this step" immediately — no need to burn 2 fake attempts. New "Retry mic permission" button on no-mic re-invokes `getUserMedia` without leaving the lesson. `speechLog` extended with `errorCode` + `userAgent` (UA captured only on error attempts) so triaging "the mic didn't work" lands a real diagnostic in the dev-panel session log. |
| S12 | **HIGH** | **`asa` (sa-row) speaking step wouldn't let tester use the mic** even after clearing cookies. Reported as "asa wasn't letting my friend use it." | **Shipped 2026-05-18.** Two real bugs: (1) `mock-ja-m1-sa.ts` had a LOCAL `speaking` helper that shadowed the import with `stubbed: true`, silently routing every sa-row speaking (asa, sushi, sora, sushi-desu) into the "Speech recognition is not yet available / I said it!" placeholder. Deleted the shadow; sa.ts now uses `speaking` from `_consonantRowHelpers` (stubbed: false). (2) `_jaGrammarHelpers.ts:speaking` was also `stubbed: true` — same placeholder for every M3-M7 dialogue speaking step. Flipped to `stubbed: false`. Other stubbed sites left intentionally (`mock-m1-l1/l2` legacy stubs + lessonBuilder's per-kana single-mora drills, which Whisper grades poorly). |
