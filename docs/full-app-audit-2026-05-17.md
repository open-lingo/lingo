# Full-app 10-persona audit — 2026-05-17

10 Opus personas walked landing → FTUE → M1 → M2 (g-row + extrapolated z/d/b/p/yōon) → M3 → ongoing pathway, framed as ~70% retention learners. Lens: **gamification + retention + learnability + accessibility**. Each persona ended with a flashcards-offer pitch.

Filter applied per Spencer's spec: serious issues OR ≥5-agent confirms. No fixes shipped — this is the plan.

**How to use this doc**: each item has a status flag — mark `[SHIP]`, `[DEFER]`, or `[SKIP]` per your call. Round 0 fixes ~5 trust bugs in 1-2h; subsequent rounds are scoped for sprint-sized chunks.

---

## Personas walked

| Persona | Profile | Key axis |
|---|---|---|
| Priya (26) | First-time visitor, cold landing | FTUE |
| Devon (24) | M1 day-2 returner | Returning-user |
| Hannah (30) | M2 g-row finisher, walks z/d/b/p/yōon | M2 extrapolation quality |
| Marc (38) | M3-jumper via test-out | Test-out + grammar spine |
| Kai (14) | Mobile-first iPhone 13 | Mobile |
| Maya (31) | Speech-anxious returner | Accessibility (speech) |
| Lin / Dr. Reyes (42) | Polyglot meta-learner | Pedagogy + research |
| Aisha v2 (14) | Dyslexic + slow connection | Accessibility (full) |
| Trevor (27) | Saturday-morning binge user | Session pacing |
| Edith v2 (67) | Hobby retiree every-other-day | Slow-pace + emotional contract |
| Sora (33) | Daily power user, 2 weeks in | Full-app gamification |

---

## ≥5-agent consensus findings (must-act)

### 1. ⛔ Mock progress stats are fake
**Confirms**: Devon, Priya, Trevor, Edith v2, Sora (5)
**Where**: `mockProgress.ts:407-415` — `MOCK_PROGRESS` hardcodes `streakDays: 5, xpEarnedToday: 50, xpTotal: 1250, lessonsCompletedThisWeek: 3`. Returned by `getMockProgressSummary()` → `useLearnProfile.ts:49-50` → `ProfileCard.tsx:42-61`.
**Effect**: Fresh accounts see "5-day streak." Day-2 users see it still at 5. Power users notice it never moves after 2 weeks of daily use. Landing copy promises "no fake gamification" then immediately delivers it.
**Fix**: ~30 lines in `mockProgress.ts`. `lastCompletedAt` + `lastXp` are stored per completion — walk distinct calendar days backward for streak, sum-today for xpEarnedToday, sum-all for xpTotal. `HomePage.tsx:87-88` already has the `EmptyActivityNotice` empty-state pattern for fresh accounts — mirror for Learn.
**Status**: `[ ]`

### 2. ⛔ No flashcards continuity from lesson 1 / SRS discoverability buried
**Confirms**: Priya, Maya, Hannah, Devon, Trevor, Edith v2 (6) + supporting from Sora, Kai
**Where**: `FlashcardsReviewStrip` is desktop-only (`LearnSidebar.tsx:41`); no mobile equivalent. The strip itself is 4 outline chips that look like settings, not a CTA. `LessonComplete` has no flashcards bridge. No seed at lesson 1. ProfileCard `cardsDue` tile shows the count but isn't a tap-to-action.
**Effect**: The SRS engine (SM-2, correctly implemented at `flashcards/engine/srs.ts`) is invisible to 2-week users. Trevor will skip flashcards if they cost him momentum; Sora calls discoverability "buried behind 3 clicks."
**Fix scope**: needs full proposal — see "Flashcards consolidated proposal" below.
**Status**: `[ ]`

### 3. ⛔ No returning-user re-entry surface
**Confirms**: Devon, Maya, Hannah, Priya, Edith v2 (5)
**Where**: `LearnPage.tsx` — no time-away acknowledgment, no "welcome back" copy, no "yesterday you saw X" warm-up. Review chip (`LearnPage.tsx:290-309`) only fires at module boundaries via `moduleReviewSchedule.ts` — within-module returners get nothing. No peak-end milestone celebrations between modules (Hannah's "voicing system complete" buried in info-card body).
**Effect**: Every persona that opens the app after a gap (2 days to 6 weeks) reports the first surface feels cold + judgment-coded. Maya specifically: ProfileCard flame is "judgment, not invitation."
**Fix candidates**: (a) "yesterday's row warm-up" chip when `lastCompletedAt > 24h`; (b) peak-end celebration moments after p-row (voicing complete) + yoon-rare-3 (yōon complete); (c) Edith's "rest mode" toggle swaps streak flame for weekly-lessons.
**Status**: `[ ]`

---

## Serious single-persona findings (high-severity)

### 4. ⚠️ "FSRS-6" landing copy vs SM-2 code
**Persona**: Lin (Dr. Reyes, polyglot)
**Where**: `LandingPage.tsx:36,58` markets "FSRS-6 scheduling." Actual engine is SM-2 from 1985 (`flashcards/engine/srs.ts`). `pickReviewWords` in `_consonantRowHelpers.ts:426` mislabeled "FSRS-style" — actually a deterministic shuffle.
**Effect**: 1-star-review territory if any informed user notices. Lin called it "wrong, not a stretch."
**Two paths**:
- Ship `ts-fsrs` (~12kB npm, shape-compatible with current SM-2 interface, ~1 week)
- Rename copy to "SM-2 spaced repetition" and own it
**Status**: `[ ]` (and which path: `[ ] swap` `[ ] rename`)

### 5. ⚠️ Test-out is a "coming soon" tombstone
**Persona**: Marc + Sora (2)
**Where**: `LearnCourseMap.tsx:181-193` — every non-current module shows prominent "Test out" button → `ConfirmModal` saying "Test-out is coming soon." Marc bailed immediately. Sora calls it a "daily papercut."
**Two paths**:
- Ship a real diagnostic (CLAUDE.md #58 — multi-step lesson container + diagnostic skip-test)
- Hide the button until functional
**Status**: `[ ]` (and which path: `[ ] ship` `[ ] hide`)

### 6. ⚠️ Leaderboard ships 100% mock
**Persona**: Sora
**Where**: `LeaderboardPage.tsx` shows fake Alex/Sam/Jordan/Casey/Riley arrays. Footer literally says "Mock data. Real rankings with backend." Visible in nav.
**Effect**: Power users notice once, never return.
**Two paths**: gate behind "Coming soon" badge, or hide nav entry entirely.
**Status**: `[ ]`

### 7. ⚠️ M3-M7 rebuild plan unshipped
**Persona**: Marc (reconfirms prior 4+10 agent audits)
**Where**: `docs/m1-density-restructure-plan-2026-05-17.md` Phases B-F. Same-answer cloze clusters still live: M3-5 delimiter exploit (`。 vs no-。` solves every cloze without reading), M6-6 (6 consecutive が), M7-5 (6 consecutive を). Average ~6 real-work steps, ≤2 distinct step types per lesson.
**Effect**: Marc bails between M6-M7 when patternization becomes obvious; ~40-50% retention.
**Fix**: execute the doc.
**Status**: `[ ]` (big — could split into per-module substasks)

### 8. ⚠️ Trevor's `LessonComplete` "Continue with..." pitch
**Persona**: Trevor (single but highest-leverage UX change in the audit)
**Where**: `LessonComplete.tsx` — single Continue button → `/learn`. No forward signal, no inline continuity.
**Proposal**: Replace with 3 contextual options:
- **Next lesson →** (default, saves the back-to-pathway click)
- **Drill what you missed** (only if wrong-on-first-attempt happened — routes to flashcards built from this lesson's miss set)
- **I'm done — save my XP** (positive framing; sets a "stopped clean" flag)
**Why it matters**: The third button reframes stopping as winning. Binge-brake disguised as a celebration. **Duolingo doesn't have this — real product differentiation.**
**Status**: `[ ]`

### 9. ⚠️ Accessibility cliff (Aisha v2)
- **Whisper-small 80-150MB first-run is unrecoverable on slow connections** — 5 Mbps DSL = 4+ min wait, no fallback button, no time estimate. Use `whisper-tiny` (~40MB) on `navigator.connection.saveData` or `effectiveType !== "4g"`.
- **Romaji defaults OFF on speaking + test cards** — `optionsHideRomaji` is categorical on test cards; punishes dyslexic learners when cognitive load is highest.
- **No `aria-live` on state changes** — MC pre-submit → submitted is color-only (WCAG 1.4.1); match_pairs wrong-tap is shake-only (WCAG 4.1.3). Screen-reader users get nothing.
- **`index.html` hard-loads 7 Google Font families** (~600-900KB before first interaction). Lazy-inject all except actual default + Noto Sans JP.
- **No skip-link + no `<main>` landmark** in `Layout.tsx:255`.
- **Atkinson Hyperlegible font preset exists** but `DEFAULT_FONT_ID = "system"` — Aisha never sees it unless she opens Settings.
**Status (each sub-item)**: `[ ] whisper-tiny` `[ ] romaji default` `[ ] aria-live` `[ ] font lazy-load` `[ ] skip-link` `[ ] dyslexia mode auto-toggle`

### 10. ⚠️ TTS auto-plays without silent-mode check
**Persona**: Maya
**Where**: `useAutoPlayJaAudio` fires 350ms after speaking-step mount with no preflight. `playJaAudio` in `tts.ts:155+` has no global gate.
**Effect**: Anxious-in-public learner opens app on train at lunch → device blares "じかん" unbidden. Her #1 fix.
**Fix**: Real Settings toggle for silent mode (`?speech=0` exists but dev-only). Gate `useAutoPlayJaAudio` + `playJaAudio` on it.
**Status**: `[ ]`

### 11. ⚠️ Mobile gaps (Kai)
- **DrawingCanvas `touch-action: none` unverified** — if missing, every trace step on iOS scrolls the page mid-stroke. Rage-quit class bug. Needs verification before any other mobile work.
- **`LessonMetaChips` hidden on mobile** via `hidden sm:flex` (`LessonPage.tsx:434`) — gamification carrot invisible on the device most users open the app on.
- **Inline prompt-audio button is 36px** (`MultipleChoiceStepView.tsx:100`) — below Apple's 44px touch-target guideline.
**Status (each)**: `[ ] verify canvas` `[ ] mobile XP chip` `[ ] 44px audit`

### 12. ⚠️ No fatigue / session-pacing signal
**Persona**: Trevor (single but severe — quantified the 90-min self-grind)
**Where**: `replayQueue` (`LessonPage.tsx:101`) only operates intra-lesson. `mockProgress.ts:407-415` has `dailyGoalMinutes: 10 / dailyGoalCompletedMinutes: 4` but they're constants — `markLessonCompleted` never updates the session-minutes counter.
**Effect**: Trevor's 90-min binge is invisible to the app. He's making 30% mistakes by minute 80; app keeps rewarding throughput. Tomorrow he won't remember anything and feels his Saturday was wasted.
**Fix**: (a) wire `dailyGoalCompletedMinutes` to real `estimatedMinutes` sum; (b) soft-cap toast after ~25min/3 row-tests on next LessonComplete: "Great run — a 15-min break here will roughly double what you remember tomorrow."
**Status**: `[ ] live daily goal` `[ ] soft-cap toast`

### 13. ⚠️ Trace step hostile to motor-impaired
**Persona**: Edith v2 (reconfirm of original Edith finding)
**Where**: `drawingComparison.ts:35-37` — `TEMPLATE_COVERAGE_PASS_THRESHOLD = 0.8`, `MAX_OVERFLOW_FRACTION = 0.25` hardcoded. Skip-after-2-fails forces opt-out vs gentle pass.
**Fix**: Settings toggle "Easier writing" pushes thresholds to 0.65 / 0.4. Backstop with existing skip-after-2-fails.
**Status**: `[ ]`

### 14. ⚠️ 3-strike row test mismatched for hobby learners
**Persona**: Edith v2
**Where**: `TestRunner.tsx:19, 116-122, 168-181` — `MAX_TEST_MISTAKES = 3`, "💥 Out of attempts" copy.
**Effect**: Dramatic for low-confidence users. Hobby retiree needs no-strike "answer each item once correctly = ★" model.
**Two paths**: per-user-mode setting OR alternate test mode at age-appropriate gate.
**Status**: `[ ]`

### 15. ⚠️ Lin's pedagogy cheap wins (all reuse existing infra)
- **Self-explanation MCQ** ("Why is が correct here?") — reuses existing `multiple_choice` step type with rule-citing option + 2 surface-heuristic distractors. Dunlosky 2013 moderate-utility, replicated. Zero new engineering.
- **Productive-failure step for は/が** — show 2 minimally-different sentences, learner picks before rule card. Kapur 2016 ~30% improvement on transfer items. Reuses MC.
- **L1-aware grammar variants** — currently monolingual-by-construction. Spanish/Korean learners get worse explanations. Architecturally fixable: `GrammarRuleStep` gets `byL1?: Record<LangCode, GrammarExample[]>`.
**Status (each)**: `[ ] self-explanation` `[ ] productive-failure` `[ ] L1-aware`

### 16. Hannah's M2 back-half test density + yoon-voiced cold-test
**Persona**: Hannah
**Where**: M2 ends with 4 yōon row-tests + capstone + recap = 6 test-mode lessons in 13 nodes. `mock-ja-m2-yoon-voiced.ts:204-213` cold-tests half-the-12-chars via recognition without prior intro.
**Fix**: (a) framing card mid-sub-2 wide sweep ("Same rule as the one you just learned"); (b) collapse yoon-capstone INTO m2-recap OR convert it to "the capstone with celebration around it"; (c) drop translate from sub-3 on d-row + yoon-intro (their pools are M1-padded).
**Status**: `[ ]`

---

## 📇 Flashcards consolidated proposal (cross-persona consensus)

### Format spec
Aligned across Hannah, Edith, Maya, Sora:
- **5 cards / 60-90s** as pre-lesson warm-up
- **8-10 cards / 2-3 min** as post-module
- **20+ behind power-user "deep review" button**
- **Personalized to weak items** (latency + miss-rate based) — generic re-review universally skipped
- **3-button rating** ("Got it / Almost / Show me again") — not Anki's 4-level (Edith specific)
- **Big tap targets** (≥48px — Edith), **audio-on-flip mode** option (Aisha)

### Slot-in points (ranked by leverage)
1. **`LessonComplete` "Drill what you missed"** branch (Trevor's pitch — Item 8 above) — captures high-intent moment; miss set is fresh
2. **Replace `FlashcardsReviewStrip` 4-chip grid with single `🔥 Review N cards · ~Xmin` 3D CTA** (Sora) — current grid reads as settings
3. **Inline "Skip this — practice with cards instead"** on speaking steps (Maya) — accessibility on-ramp for speech-anxious; **flashcards as opt-out, not just retention**
4. **After-module CTA** post-mastery-callout (Hannah + Sora) — natural pause; hook point: `LearnPage.tsx:122-137` `graduateModule` path
5. **Mobile entry** must exist on `LearnTopBar` (Kai + Devon) — currently invisible on phone

### Engine prerequisite
FSRS-6 swap (Item 4 above). The "cards return when you'd start forgetting" pitch isn't true under SM-2. SM-2 schedules by fixed-interval × ease, not retrievability. The pitch only works if the scheduler implements it.

### Status
`[ ] format spec` `[ ] LessonComplete branch` `[ ] strip→CTA reshape` `[ ] speaking opt-out` `[ ] after-module CTA` `[ ] mobile entry` `[ ] FSRS-6 swap`

---

## 📋 Recommended phasing

### Round 0 — Trust bugs (1-2h, ship immediately)
Kills 5 trust-breaking surfaces at once. No new code patterns needed.
- [now] Derive stats from `store.completed` (Item 1)
- [now] Empty-state ProfileCard for fresh accounts (Item 1)
- [hide for now] Hide test-out button OR rename modal copy (Item 5)
- [coming soon] Hide leaderboard nav entry OR add "Coming soon" badge (Item 6)

### Round 1 — Retention foundation (~1 week)
- [now] Trevor's 3-button `LessonComplete` (Item 8)
- [defer] Returning-user "yesterday warm-up" chip (Item 3)
- [defer] Mobile `FlashcardsReviewStrip` placement (Item 2 / Item 11)
- [defer (needs to be worked into currenty flash card system which is currently undecided)] Replace strip 4-chip with single CTA (Item 2)
- [defer] "Rest mode" setting — swap flame for weekly-lessons (Item 3)
- [make it 10% more lenient in general and then defer age based accessibility profile, and setting later] Lenient-trace toggle in settings (Item 13)
- [now] Mobile compact XP chip on lesson header (Item 11)

### Round 2 — Pedagogy depth (~1-2 weeks)
- [defer] FSRS-6 engine swap (Item 4 — closes credibility gap)
- [defer (good idea though)] Self-explanation MCQ step type (Item 15)
- [defer (ha vs ga has no concrete explanation sometimes, our explanations can confuse learners, needs different perspective)] Productive-failure step for は/が (Item 15)
- [defer] M3-M7 rebuild — phases B-F of m1-density-restructure-plan (Item 7 — big)
- [defer] Peak-end celebrations: "voicing complete" after p-3, "yōon complete" after yoon-rare-3 (Item 3 + Item 16)
- [now] Hannah's M2 back-half collapse: yoon-capstone INTO recap (Item 16)

### Round 3 — Accessibility (~1 week)
- [defer] Whisper-tiny on slow connections (Item 9)
- [defer] Romaji default ON for speaking + accessibility panel (Item 9)
- [defer] `aria-live` regions on MC + match-pairs verdicts (Item 9)
- [defer] Skip-link + `<main>` landmark in Layout.tsx (Item 9)
- [now] Lazy-inject fonts beyond Noto Sans JP + system (Item 9)
- [now] TTS silent-mode setting (Item 10)
- [defer] 3-strike alternate mode for hobby pace (Item 14)

### Round 4 — Mobile polish (~3-5 days)
- [defer] Verify DrawingCanvas `touch-action: none` (Item 11)
- [defer] 44px touch-target audit (Item 11)

### Future scope (sprint+ or out of MVP)
- [defer] L1-aware grammar variants (Item 15c) — architecture lift
- [defer] Fatigue/session-pacing soft-cap toast (Item 12) — depends on real daily-goal first
- [defer < dont suggest test out until we finish the rewrite of context up to module 7] Real test-out diagnostic (CLAUDE.md #58) — pairs with Item 5 "ship" path

---

## Meta-summary

**The curriculum is genuinely good.** M1 hand-authored end-to-end, M2 g-row template extrapolated cleanly to z/d/b/p/yōon, real Whisper grading, real module-review SRS schedule, R1-R3 step-type interleave shipped.

**The meta-game doesn't cash the checks the curriculum is writing.** (Sora's phrasing.) Mock stats, dead test-out button, mock leaderboard, buried flashcards CTA, no returning-user surface — every surface that touches the *return* loop is weaker than the lesson surface that touches the *engage* loop.

**Lin's summary cuts deepest**: "The team has the literature. The literature is in the doc. The code doesn't implement it. The gap between `docs/learning-science-foundation-2026-05-17.md` and the running code is the central risk."

**Round 0 + Round 1 close most of the perception side without touching curriculum.** Round 2 closes the pedagogy side. Round 3-4 are accessibility / polish.

---

## What each persona would have walked through

(For your reference — pick personas to re-walk after each round.)

- **Priya (FTUE)**: re-walk after Round 0 to verify ProfileCard empty-state fix lands
- **Devon (day-2 returner)**: re-walk after Round 1 to verify yesterday-warmup chip
- **Hannah (M2 finisher)**: re-walk after Round 2 to verify peak-end celebrations + yoon collapse
- **Marc (M3 jumper)**: re-walk after Round 2 + test-out ship to verify whole flow
- **Kai (mobile)**: re-walk after Round 4 to verify touch + mobile XP
- **Maya (speech-anxious)**: re-walk after Round 3 to verify silent-mode + Romaji-on
- **Lin (polyglot)**: re-walk after Round 2 to verify FSRS-6 + self-explanation
- **Aisha v2 (a11y)**: re-walk after Round 3 for full a11y sweep
- **Trevor (binger)**: re-walk after Round 1 to verify 3-button LessonComplete
- **Edith v2 (retiree)**: re-walk after Round 1 to verify rest mode + lenient trace
- **Sora (power user)**: re-walk after Round 0 + 1 + 2 to verify gamification stack now lives
