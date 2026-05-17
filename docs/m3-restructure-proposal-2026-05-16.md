# M3 Restructure Proposal — 2026-05-16

Written for Spencer to review when he's back. Distills the M3 4-persona
audit + Spencer's pedagogy critique + targeted research, into concrete
proposals. Open questions at the end.

## TL;DR

- **Spencer's critique is research-validated.** M3 v1 introduces 7 grammar
  concepts in 10 lessons. The audit said "survival pass" — adults
  complete it. But adult L2 retention research (cognitive load,
  desirable difficulties, spaced retrieval) all point to the same
  conclusion: single-pass exposure ≠ retention. Bunpro built an entire
  product on the opposite principle.
- **Recommended:** split M3 v1 into **M3 + M4 + M5**, each ≤2 new
  grammar concepts, each ~1.5h target, with a Review lesson at the end
  of every module. The old M4 (counters/time/money) becomes M6, the
  old M5 (currently empty) becomes M7+.
- **Three small audit fixes already shipped today** (M3-9 typo, M3-3
  condescending copy, ruby concern verified false). Sub-tier work and
  speaking step gap rolled into the rebuild.

## What the audit actually said

The audit's headline was kind: "M3 saves the cliff for 3 of 4 personas."
But its own data flagged the density issue Spencer raised:

> "Cumulative cognitive load: ≈55 new vocab + 6 grammar concepts + 4
> katakana shapes recognized passively in <60 min total. That's at the
> ceiling per Cowan 2001 (4±1 chunks per session, ~3 sessions). Session
> 1 [M3-1..5] is harder than session 2 — consider moving M3-6 earlier."

> "Grammar density spike M3-3 → M3-5 → M3-7. Three grammar-heavy
> lessons in five lessons, with only M3-4 (vocab-only) as a breather.
> Mika fades, Priya tolerates, Jamie thrives, Frank loves."

> "Consider splitting M3-7 into two lessons (に first, で second)."

The audit was evaluating **survival** (can they finish?). Spencer was
evaluating **retention** (will they remember?). Both lenses matter;
retention is the load-bearing one for a product that asks 15 min/day for
6 months.

## Spencer's direction (verbatim)

> "m3 seems WAY too crowded, we are supposed to introduce concepts and
> itterate on them, not add 10 grammar points at once. do you think
> someone would be able to remember all that? the contect seems good
> but unless we itterate on it a bit more in the future (which we
> probably wont) then how will they remember? flash cards only do so
> much for grammar."

> "I am not against making m3 into m3, m4, m5 to separate those cleanly
> (modules can be completed one per hour and a half maybe) with good
> reinforcement on previously learned things ALONG with review baked in
> (separate review lessons or something)."

## Research validation

### Cognitive load (no fixed number, but converging signal)
- [Cognitive load theory in L2](https://www.tandfonline.com/doi/full/10.1080/23752696.2018.1513812) — grammar structures requiring multi-step processing exceed capacity until learners have acquired the procedure. Sequencing should respect this.
- [Not All Grammar Structures Are Created Equal — The Language Gym](https://gianfrancoconti.com/2025/04/08/not-all-grammar-structures-are-created-equal-cognitive-challenges-and-classroom-implications-in-l2-learning/) — "curriculum designers should build a program that gradually ramps up the complexity of grammar content, sequencing lessons in a way that respects the natural cognitive challenges learners face and offering regular and spaced practice."
- No paper names "N concepts per session." The closest signal is Cowan's 4±1 working memory chunks — for *new* L2 concepts where each chunk requires deeper encoding, the practical ceiling is well below 4.

**Translation for Lingo:** ≤2 new grammar concepts per module is conservative but defensible. Spencer's rule is in the safe zone.

### Interleaved vs blocked practice (nuance)
- [The effects of interleaving and blocking practice on L2 contextualized grammar learning](https://www.jbe-platform.com/content/journals/10.1075/jsls.00047.buh) — interleaving wins for *long-term retention*, but blocking wins for *initial fluency*. **Block-then-interleave** is the safe pattern for novices.
- [Undesirable Difficulty of Interleaved Practice in low-achievers](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659) — pure interleaving from day 1 can hurt novices. They need the blocked-practice scaffolding first.

**Translation for Lingo:** introduce grammar concept (block-practice in its own lesson) → then interleave with prior concepts in next 2-3 lessons. Don't expect a learner to handle interleaved drills on day 1 of a new concept.

### Bunpro (direct competitor, canonical grammar-SRS model)
- [Tofugu's Bunpro review](https://www.tofugu.com/reviews/bunpro/) — 800+ grammar points N5→N1, cloze deletion review format (which we already have as `particle_cloze`), "ghost reviews" with adjusted SRS for struggle points.
- [Bunpro support docs](https://bunpro.jp/support/using-bunpro) — explicit teaching path with linked external explanations (Tae Kim, Imabi, dictionaries), then SRS schedule on cloze cards. No isolated flashcards for grammar — always sentence-context.

**Translation for Lingo:** the right shape exists. We need (a) sentence-context SRS for grammar concepts (not just vocab), (b) iteration lessons that cycle prior concepts before adding new ones.

### Spaced retrieval (already in our DNA via FSRS for vocab)
- Karpicke & Roediger (already cited in `docs/curriculum-design-v2.md`): 50% retention edge for active recall over rereading.
- The principle applies to grammar but requires sentence-context drills, not vocab cards.

## Proposed restructure

### Module shape (the new rule)

Each module = **≤2 new grammar concepts** + **iteration over prior** + **module review at the end**. Target: 8-10 lessons + 1 review = 9-11 lessons × ~7 min = **~60-75 min per module**. Spencer's 1.5h target is on the upper edge — comfortable.

### The split: M3 v1 (10 lessons) → M3 + M4 + M5

| Module | New grammar | Iteration / drill | Vocab focus |
|---|---|---|---|
| **M3 — First sentences** | です + か · は vs が | Introduce both, interleave by L4, build dialogue by L7 | 10 Core 2k + 5 katakana loanwords (system intro) |
| **M4 — Things and people** | の (possession) · これ/それ/あれ/どれ | Reuse は/が in every drill; first interleaved particle cloze | 10 Core 2k everyday-object vocab + 2 katakana |
| **M5 — Numbers, places, motion** | Numbers 1-10 + counters (人/個) · に vs で | Reuse の + demonstratives in usage; numbers as breather between two grammar concepts | 10 Core 2k place/transport vocab + 2 katakana |

Old M4 (counters/time/money) → **M6**. M5 (currently empty) → **M7**.

### Module lesson template (10 lessons + 1 review)

```
L1  Grammar Concept A — rule card + 4 cloze drills (BLOCKED practice on A)
L2  Vocab + A in context — 10 new words used in A-sentences
L3  Iteration A + prior — particle cloze with old + new particles mixed (INTERLEAVED)
L4  Grammar Concept B — rule card + 4 cloze drills (BLOCKED practice on B)
L5  Vocab + B in context — 10 new words used in B-sentences
L6  Iteration A+B+prior — interleaved cloze + sentence build
L7  Dialogue — short exchange using A+B+prior, phrase_card pattern + speaking step
L8  Sentence build — 5 cumulative sentences (production)
L9  Light recap — culture callout + audio comprehension review
L10 Row test (mastery ★) — review-tail mechanics
L11 (NEW) Module Review — explicit cycling drill on A+B+prior modules
```

### New `module_review` lesson concept

Separate from the row test. Targets *retention*, not *passing*. 
- Pull 3-4 items from each prior module's grammar (cloze drills + sentence builds)
- No mastery gate (review-only, no ★)
- Unlock when row test is passed
- Persistent — repeatable for review credit (reduced XP per replay, like the existing review-mode pattern)
- Schedule via FSRS-like: surface as a "due review" on the Home page when the user hasn't replayed in N days

### Per-item proposals (audit findings)

| Item | Proposal | Effort |
|---|---|---|
| Density spike M3-3/5/7 | Split into M3/M4/M5 per above | M (~10-12h) |
| No speaking step in M3 | Add 1 speaking step per module, in dialogue lesson (L7) | S (rolled in) |
| Missing antiPatterns (RULE_KA, RULE_NO, RULE_KOSOADO) | Add. Codify in `GrammarRuleStep` type: `antiPattern` non-optional | S (rolled in) |
| RULE_KOSOADO no あれ example | Add 3rd example | XS (rolled in) |
| In-app link M3-1 → /practice/alphabet/katakana | Add `<Link>` in the explainer card | XS (rolled in) |
| Module review lessons | New step type? Or compose existing? Decision in §"Open questions" | M (~3-4h) |
| Grammar SRS scheduling | Out of scope for rebuild. Open question. | (defer) |

### What stays from M3 v1

- Katakana SYSTEM intro pattern (audit's strongest pass)
- All Grammar Rule Card content (just split across modules; tighten antiPatterns)
- All Particle Cloze drills (move into the right module + add interleaving)
- M3-9 café dialogue (move to wherever it best fits — likely M5 since it uses location + counters)
- All authored vocab (re-cluster by module theme)

### What changes from M3 v1

- ≤2 new grammar concepts per module
- Add iteration lessons (L3, L6 template) that cycle prior + new
- Add module review (L11) targeting long-term retention
- Add speaking step to dialogue lesson (audit gap)
- Tighten antiPatterns (audit gap)

## Open questions for Spencer

1. **Module count to cover N5.** N5 has ~60-80 grammar points. At ≤2 per module that's 30-40 modules. Do you want 30+ modules for Japanese (≈45 hours of content)? Or keep the existing "M1, M2, M3, M4, M5" structure with M3+ each holding 2 grammar points + recap, even if that means a longer journey?

2. **Module review lesson — separate or merged?**
   - **A. Separate lesson type (`module_review`)** that's distinct from row-test. Unlocks AFTER row test. Repeatable. Pulls from FSRS-like schedule on the Home page when due. Most rigorous.
   - **B. Extended row test** — row test pulls items from current module + 1 previous (cumulative). Simpler, no new lesson type.
   - **C. Both**: row test stays current-module only, plus an explicit Review lesson at the end of each module. The Review lesson rolls up the last 2 modules.
   - My recommendation: **C** (clean separation: row test = "did you pass this module?", review = "do you still remember it?").

3. **Soft-gate behavior on review.** If the user hasn't done their reviews, do they:
   - **A. Get blocked from new modules** (Bunpro-style gate). High-pressure but maximizes retention.
   - **B. Get nudged via toast/Home-card** ("Module 3 review is due — 4 cloze drills, ~3 min"). Less pressure, more autonomy.
   - **C. See a "decay" indicator on the module's mastery ★** when reviews are overdue. Visible but non-blocking.
   - My recommendation: **B** for now, **C** later (the decay visual is more work but Mika-class persona will respond to it).

4. **Grammar in flashcard system?** Currently `lingo_progress_v1` tracks lessons; FSRS handles vocab cards via the separate flashcards system. Do you want grammar concepts to also enter FSRS? That'd mean every Grammar Rule Card becomes an FSRS card with cloze drills as the test. Bunpro's pattern. Big lift but high retention payoff.
   - My recommendation: **defer** until friend test-1 returns feedback. Module reviews (option 2-C above) is a lighter intermediate step that captures most of the retention benefit without the full SRS lift.

5. **Friend test timing.** Do you want to dispatch the M3 restructure NOW (so friends see the better version) or AFTER friend test-1 returns (so you have real data on whether the density actually hurts)?
   - My recommendation: **after**, because (a) you'll get retention data from real users vs. agent-simulated personas, (b) the restructure is ~10-12h agent work that's better invested with real signal, (c) M3 v1 still teaches valid content — the loss is retention not correctness.

6. **What gets cut from M3 v1 → M3 (the new tight one)?** M3-1 (katakana intro) clearly stays. M3-2/3 (です/か, は/が) clearly stay. But M3-6 (numbers + counters) — does it belong in the new M3 as a breather between the two grammar concepts, OR does it move to M5 with location/motion?
   - My recommendation: **move to M5** with に/で. Numbers + locations are thematically grouped (asking "how much," "where," counting things in transactions).

7. **Speaking step content per module.** Audit said zero speaking in M3. Should each new module's dialogue lesson include:
   - **A. One speaking target per dialogue line** (3-4 short utterances). High practice, more risk of Whisper grading variance.
   - **B. One representative speaking target** (the whole dialogue's key utterance, e.g. "コーヒー にこ ください"). Lower risk, less practice.
   - My recommendation: **B** until friend test reveals Whisper's accuracy on full sentences. Sentence-level Whisper is less battle-tested than word-level.

8. **Pause-modality (#97) priority bump?** Friend testing might surface mic issues. Should pause-modality move from "future scope" to "before friend test-1"?
   - My recommendation: **wait** — friends all have mics + good internet per your earlier note. Add only if a real tester asks.

## Spencer's answers + refined plan (added 2026-05-16, post-doc)

### Decisions

1. **N5 in ~45h** — accepted. Augmented by ~20h flashcards + ~40h immersion content (separate paths).
2. **Module review = Option A**: separate `module_review` lesson type, FSRS-like scheduling, **3 review lessons per cycle at ~4 min each + mastery**, interspersed BETWEEN modules.
3. **Soft gate = Option B**: nudge via review-count chip on Learn home + Practice page. No blocking.
4. **Grammar in FSRS**: defer to Trevor — likely lives in the Practice "grammar tool" with FSRS-like sentence lessons (not flashcards).
5. **Friend test timing**: build first, friends test after restructure lands.
6. **Module map refinement** (the substantive one): **は and が should NOT be introduced together.** Introduce は alone first (topic marker, dominant beginner pattern); introduce が later with location/existence context. The full は vs が *contrast* is N4-class — defer the explicit rule card. Also: use です in *very* early sentence examples (これは あおいです — "this is blue") to make even M3-L2 feel productive.
7. **Speaking**: wait for friend feedback; **NOTE durably to revisit** + build the dialogue lesson so adding more speaking steps later is trivial.
8. **#97 pause-modality**: wait.

### Refined module sequence (post-restructure)

| Module | Theme | New grammar | Vocab + tricks |
|---|---|---|---|
| **M3 — First sentences** | "I'm Spencer. This is blue." | です + か, は (as topic marker, no が contrast yet) | Use early adjective sentences as exposure (これは あおいです, それは あかいです). Adjective conjugation deferred — learner just sees the pattern. |
| **REVIEW** | 3 short reviews + mastery (~12-15 min total) | — | FSRS-due, surfaces on Learn/Practice when ready |
| **M4 — Things and people** | "Whose? Which one?" | の (possession), これ/それ/あれ/どれ | Reuses は + です + か everywhere. Vocab: ペン/かばん/くるま/かさ etc. |
| **REVIEW** | — | — | cycles M3 + M4 |
| **M5 — Numbers** | "How many? Two coffees, please." | Numbers 1-10 + ONE counter (人 for people) — other counters interleaved later in course | Reuses M3+M4 patterns. Café/transaction scenes. |
| **REVIEW** | — | — | cycles M3 + M4 + M5 |
| **M6 — Where things are** | "There's a park. The cat is in the house." | に, で + が (introduced via existence: 公園が あります / ねこが います) | Location vocab: 公園 park, 学校 school, 家 house, 駅 station, トイレ toilet. が finally lands in its most natural context (new/existence info). |
| **REVIEW** | — | — | cycles M4 + M5 + M6 |
| **M7 — Verbs in motion** | "I go to the park. I eat sushi." | Verbs (dictionary form + ます stem) + に for direction + を | Reuses everything. First production sentences with verbs. |

### Key pedagogical moves (locked in)
- **は alone first, が later with location/existence.** This is the smart play — beginners don't need the contrast immediately, and が in existence sentences (___ が あります) is its own use that doesn't immediately confuse.
- **Adjectives exposed early** (これは あおいです) without formal conjugation lesson. The learner pattern-matches "X is [adjective]" with です as the verb. Formal い/な distinction lands in M8+.
- **ONE counter (人) in M5; rest interleaved.** 個 / 本 / 枚 / 杯 / 匹 sprinkle across M6-M10 in dialogue context. Avoids the 25-counter Genki dump.
- **Review modules between every pair of modules.** New `module_review` lesson type. 3 lessons + mastery, ~4 min each = ~15 min total. Reuses existing primitives (cloze + sentence-build + dialogue snippet). Marked FSRS-due via timestamp on the user's last completion.

### Module count + N5 coverage
- M3-M7 covers the early-grammar spine. Add M8-M10 for adjectives + te-form + past/negative. Add M11-M14 for desire + conditional + potential + passive. M15+ for keigo + counters batch. Total ~15-20 modules to cover N5, each with review.
- Each module: ~75-90 min (10 lessons × 6-8 min + review module × 15 min)
- Total N5: 15-20 modules × ~90 min = **22-30 hours of structured content**, augmented by flashcards + immersion to hit Spencer's 45h target.

### TODO note (durably persisted)
- **Add per-line speaking steps to dialogue lessons** once Whisper sentence-level accuracy is validated against friend testers. Architectural prep: dialogue lesson factory exposes a `speakingTargets: 'representative' | 'per-line'` option, default `'representative'`. Switching to `'per-line'` later is a one-arg change.

## Implementation plan (post-answers)

### Phase 1 — Data model (S, ~2h)

- Extend `LessonContent` with `kind?: "module_review"` (optional, since the existing `kind?: "alphabet" | "recap"` already exists). Reuse `LessonStep[]` — no new step type needed.
- Add `src/features/lesson/data/moduleReviewSchedule.ts`:
  - `getReviewSchedule(moduleId): { stage: 0..5; dueAt: ms-epoch | null; lastCompletedAt: ms-epoch | null }`
  - Intervals: stage 0 = +1d after module completion, then +3d, +7d, +14d, +30d, +90d, graduated.
  - Storage key: `lingo_module_reviews_v1`. Shape: `Record<moduleId, { stage, lastCompletedAt }>`.
- Helper `getDueReviews(): { moduleId, stage }[]` for surfacing the review-count chip.

### Phase 2 — Module review lesson template (M, ~2-3h)

- New lesson factory: `buildModuleReview(modules: CourseModule[], stage: number): LessonContent`
- Each review = 3 lessons (per Spencer: "3 review lessons at ~4 min each")
- Composition: ~6 particle clozes + 4 sentence builds + 2 dialogue snippets per lesson, drawn from the prior 1-3 modules' content (more coverage as you progress through the stages).
- All using existing primitives: `multiple_choice`, `particle_cloze`, `build_sentence`, `phrase_card`, `info` (intro+outro). No new step types.
- No mastery ★ on reviews — pure completion tracking. Mastery stays on the source modules.

### Phase 3 — UI surfacing (S, ~1-2h)

- Learn home: small chip "🔄 N reviews due" near the existing stats strip. Clicking → opens the highest-priority review.
- Practice page: existing card pattern, new "Module reviews" entry with count badge.
- Review-due indicator on each Module card in the pathway (subtle, non-blocking).

### Phase 4 — Rebuild M3 v1 → M3 + M4 + M5 + M6 (L, ~10-12h)

- Author 4 modules using the existing helpers + `phrase_card` + `grammar_rule` + `particle_cloze` step types we already have.
- Module shape per "Module lesson template" earlier in this doc.
- Reuse existing M3 v1 content where it fits:
  - Katakana SYSTEM intro stays as M3-1
  - です/か Grammar Rule cards move to M3-2 (with は intro the same module per refined plan)
  - は as topic marker (NEW for M3) — just topic, no contrast
  - の + これ/それ/あれ/どれ → M4
  - Numbers + 人 counter → M5
  - に/で/が + location vocab + existence pattern → M6 (が finally introduced HERE)
- Each module's row test stays (mastery ★) — review module is separate.

### Phase 5 — Wire review unlock + soft nudge (S, ~1-2h)

- After a module's row test passes → schedule its first review at +1d
- Surface in the review-count chip + Home banner when due
- On completion of a review → bump stage, schedule next
- Practice page entry sorted by overdue-first

### Phase 6 — Tests + verification (S, ~1h)

- Update `mockCourse.test.ts` for new lesson counts (M3 ~10, M4 ~10, M5 ~9, M6 ~12, reviews not counted in module lessons)
- New `moduleReviewSchedule.test.ts` for the interval logic
- Smoke: `npm run test:run` 286+/286+

### Total: ~17-22h agent work

Big enough to dispatch as a single coherent agent task. Alternatively split: Phase 1+2 (data model + review template) as Agent 1, Phase 4 (M3-M6 author) as Agent 2 once 1 lands, Phase 3+5 (UI) as Agent 3. Parallel after Phase 2.

## Files / tasks affected by the restructure

- DELETE/REWRITE: `src/features/lesson/data/mock-ja-m3-{1..10}.ts` (currently 10 files, will become ~30-33 split across 3 modules)
- UPDATE: `src/shared/domain/mockCourse.ts` (M3/M4/M5 module entries, shift M4/M5 placeholders to M6/M7)
- UPDATE: `src/features/lesson/data/mockLessons.ts` (re-register)
- UPDATE: `mockCourse.test.ts` (new lesson counts)
- POSSIBLY NEW: `src/features/lesson/components/steps/ModuleReviewStepView.tsx` if Q2 resolves to option A or C
- UPDATE: `docs/curriculum-design-v2.md` (extend the M3 plan to M3/M4/M5/M6/M7)

## Sources

- [Cognitive Load Theory in L2 — Taylor & Francis](https://www.tandfonline.com/doi/full/10.1080/23752696.2018.1513812)
- [Not All Grammar Structures Are Created Equal — The Language Gym](https://gianfrancoconti.com/2025/04/08/not-all-grammar-structures-are-created-equal-cognitive-challenges-and-classroom-implications-in-l2-learning/)
- [Cognitive Factors in L2 Grammar Learning — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9333089/)
- [Interleaving vs blocking in L2 grammar — John Benjamins](https://www.jbe-platform.com/content/journals/10.1075/jsls.00047.buh)
- [Undesirable Difficulty of Interleaved Practice — Wiley](https://onlinelibrary.wiley.com/doi/10.1111/lang.12659)
- [Bjork & Bjork — Educational myths chapter](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2020/01/BjorkBjorkEducatinMythChapterPublishedFormSept2019.pdf)
- [Bunpro — Tofugu review](https://www.tofugu.com/reviews/bunpro/)
- [Bunpro support docs](https://bunpro.jp/support/using-bunpro)
- [Lingo `docs/curriculum-design-v2.md`](./curriculum-design-v2.md) — internal north star
