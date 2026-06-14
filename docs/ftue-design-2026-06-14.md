# FTUE Design — evidence-backed first-run for Open Lingo (2026-06-14)

**Status:** DRAFT proposal. Grounded in a deep-research pass (deep-research harness: 6 angles, 24 sources, 105 claims, 25 adversarially verified → 22 confirmed / 3 refuted). No code changed.
**Problem:** a new user picks a language and lands **cold in lesson 1** — no welcome, no goal-setting, no streak-start, no feature discovery (SRS/flashcards/quests found ad hoc), and the placement test exists but is **disabled**. The walkthrough found essentially *no first-run onboarding*.

**Honest caveat on the evidence (read first):** the strongest sources are Duolingo's own A/B-test operator accounts (Lenny's, First Round, Duolingo blog) — credible and on-point, but **self-reported, no sample sizes/CIs, and some figures are 2014–2018 vintage on retired features.** Only *implementation intentions* and the *commitment-device taxonomy* are peer-reviewed. Activation "aha" numbers are **rally cries, not thresholds** — we must derive **our own** metric, not copy Duolingo's. Magnitudes below are illustrative; treat them as direction + "re-validate via our own experiment."

---

## 1. Proven patterns (verified, with evidence)

| # | Pattern | Evidence (verified) | Mechanic |
|---|---|---|---|
| 1 | **Show value before signup** | Duolingo: moving signup later = ~+20% DAU; later wall-tuning +8.2%. Flow: pick lang → set goal → placement lesson → commit to streak → Day 1 → *then* signup. (First Round; 6+ flow captures) | Deliver a real lesson + the goal/streak loop *before* asking for an account. |
| 2 | **Streaks = loss-aversion habit device** | Biggest non-lesson growth driver; 7-day threshold where loss aversion "kicks in"; 7-day-streak users 2.4× more likely to return next day; a **streak-extension *animation* redesign alone = +1.7% D7**. (Duolingo blog/eng, Lenny's) | Start the streak in **session 1**; invest in milestone reward animation. |
| 3 | **Self-set, intentional goals** | User-chosen goal > pre-selected harder goal; opt-out/intentionality button "a huge win"; **CTA "Commit to my goal" beat "Continue" — a "massive win," ~10k incremental DAU.** (Duolingo A/B, Lenny's) | A self-chosen daily-goal step with explicit **commitment copy**. |
| 4 | **Commitment devices (soft) + structured breaks** | Streak Wager +14% D7; Weekend Amulet (streak protection) +2.1% D7 / +4% D14; "option to take a break → do more long-run." Commitment-device taxonomy: hard (economic) vs soft (psychological). (Duolingo; Bryan/Karlan/Nelson 2010, peer-reviewed) | Streak-freeze/protection (**soft** commitment). ⚠ **NOT** punitive deadlines — "binding deadlines beat flexibility" was **refuted** in verification. |
| 5 | **Implementation intentions (if-then plans)** | Gollwitzer & Sheeran 2006 meta (94 tests): **d=.65** goal attainment; d=.61 getting started, d=.77 preventing derailment. (Peer-reviewed; later re-analyses flag some publication-bias inflation) | Prompt a concrete plan: "When I **[finish breakfast]**, I'll do one lesson" — tie to a reminder/time. |
| 6 | **Activation aha / leverage metric** | Facebook "7 friends/10 days" = sole focus; Duolingo sensitivity analysis found **CURR had 5× the DAU impact** of the next metric → focusing on it lifted CURR 21%, contributed to 4.5× DAU growth. Aha = a *rally cry*, validated **causally**, not a precise threshold. (Mode, Lenny's) | Instrument retention; find which **first-session/first-week action** separates D7-retained from churned; rally one metric. **Derive ours — don't borrow CURR.** |
| 7 | **Learn-by-doing / invisible tutorial** | Half-Life 2 teaches mechanics via staged in-context play, no pop-up text (widely documented). Duolingo integrates the streak as *experienced, not explained*. (Game Developer, etc.) | Surface SRS/flashcards/quests **contextually at first relevance**, not front-loaded and not ad-hoc. |
| 8 | **Coach character + badges** *(medium confidence)* | Duolingo growth team *reported*: Duo coach +7.2% D14; badges +116% friends added. (Self-reported, ~2014–18 — evidence-suggestive, not proven) | A guiding coach voice + contextual badge unlocks. Lower priority; validate ourselves. |

**Refuted & excluded (do NOT build on these):** self-imposed binding *deadlines* beating flexibility (0-3); the Half-Life 2 "seesaw counterweight" example (1-2); "32M DAU at 7+ streak" overstatement (0-3).

---

## 2. Recommended FTUE for Open Lingo (prioritized by impact)

Open Lingo *already has* streaks, daily-goal infra, quests, streak-freeze, SRS — they're just **not surfaced in the first run**. So most of this is *wiring existing features into a first-session arc*, not new systems.

### P0 — first-session arc (highest impact, mostly reuse)
Replace the cold-drop with a **value-first arc** (patterns 1·2·3·5):
1. Pick language *(exists)* →
2. **"Why are you learning?"** (motivation chips — autonomy/SDT) →
3. **Set a self-chosen daily goal** with a **"Commit to my goal"** CTA (not "Continue") — pattern 3, the cheapest big lever →
4. **First real lesson** (lesson 1, already strong) →
5. **Streak starts — animated** ("Day 1 🔥") — pattern 2 →
6. Optional **if-then plan + reminder** ("When I ___, I'll practice") — pattern 5.
> Web note (open question): signup-wall placement was measured on Duolingo *mobile*; for our web app, decide where/whether the wall sits — but the principle (real value before the ask) holds.

### P0 — enable the placement test
It's built and **disabled** (`mockCourse.ts`). Duolingo's value-first flow uses a placement lesson; for non-beginners it slashes time-to-value (pattern 1). Likely the highest **effort:impact** quick win — flagged as an open question (why was it disabled?).

### P1 — contextual feature discovery (learn-by-doing, pattern 7)
Surface each feature at its **first moment of relevance**, not ad hoc:
- **First review** prompt right after lesson 1 introduces SRS/flashcards (this is exactly where the **retention work we just shipped** plugs in — the due chip + backlog).
- **First quest** appears when the learner earns their first XP.
- **Streak-freeze** introduced the first time a streak is at risk.

### P1 — streak milestone animations (pattern 2)
Polish the streak-extend + milestone (7/10-day) moments — animation alone moved D7 in the evidence.

### P2 — measure it (pattern 6, foundational)
Instrument first-session/first-week retention and **derive Open Lingo's own leverage metric** (likely: *started a streak* + *did first review in week 1*). Everything above should be A/B-validated against it — the evidence says copy the *method*, not Duolingo's numbers.

### P2 — coach character (pattern 8, evidence-suggestive)
A light guiding voice through the first session. Lower confidence; validate.

---

## 3. Open questions (from the research)
1. **What's our own activation/leverage metric?** Derive from our data, don't borrow CURR/"7 friends."
2. **Why is the placement test disabled, and what's the re-enable cost?** Likely a quick win.
3. **Web-specific signup-wall placement** (delayed-signup gains were mobile-measured).
4. **SRS/quest sequencing** — which feature in session 1 vs deferred to first review / first week, to avoid overwhelming.

## 4. Build order (if we proceed)
P0 first-session arc (goal-setting + commitment CTA + streak-start) → enable placement test → P1 contextual discovery (wire the shipped retention surfaces as the "first review" moment) → streak animations → P2 instrumentation + own-metric → coach. Each step A/B-gated where possible.

---

## 5. P0 implementation spec (for the build)

**Voice constraint:** NOT patronizing. Respect the learner's intelligence — no forced cheerfulness, no baby-talk, no over-celebration. Calm, direct, adult. (Matches the house "average user isn't dumb" rule.)

**Integration points (verified):**
- New-user detection: `completedSet.size === 0` (e.g. `LearnCourseMap.tsx:60`). Add a one-shot `onboardingSeen` flag (settings/localStorage) so it shows once.
- Daily goal: currently a **hardcoded mock** (`mockProgress.ts:262` `dailyGoalMinutes: 10`) — NOT settable. P0 must add a real `settings.learning.dailyGoalMinutes` (persisted in `open-lingo-settings`), default 10, and have `mockProgress` read it.
- Placement test: `PlacementTestPage` + routes `placement-test` / `test-out/:moduleId` already exist and work (`App.tsx:335`). "Disabled" = nothing links to it. Enable = add an entry from onboarding. **Must read as clearly optional.**
- Streak: derived from completions (auto-starts on first lesson) — onboarding just needs to surface/celebrate Day 1 (stretch).

**The arc (new-user, shown once):**
1. **Motivation** — "What brings you here?" (a few chips: travel / culture / work / family / fun). Autonomy framing, one tap, skippable. No lecture.
2. **Self-chosen daily goal** — pick a daily target (e.g. 5 / 10 / 15 / 20 min). CTA reads **"Commit to my goal"** (not "Continue"). Persists to `settings.learning.dailyGoalMinutes`.
3. **Optional placement** — a clearly-OPTIONAL offer: *"New to Japanese? Start from the top. Already know some? Take a quick optional placement to skip ahead."* Two equal-weight paths: **"Start from the beginning"** (primary, no penalty) and **"Take the optional placement"** — the skip must be obviously first-class, never a guilt trip. Links to `placement-test`.
4. → First lesson (existing). Streak Day 1 surfaces after (stretch: animate).

**Completion criteria (ralph):**
- A brand-new user (`completedSet.size === 0`, no `onboardingSeen`) sees the arc once; returning users never do.
- Daily goal is self-chosen, persisted, and reflected in the home Daily-goal card (`AccountOverviewCard`).
- Placement is reachable from onboarding AND visibly optional with a no-penalty "start from the beginning" path of equal/greater prominence.
- Copy is non-patronizing (calm, adult).
- `tsc --noEmit` clean; happy-path test for the new-user gate + goal persistence; full suite green.
