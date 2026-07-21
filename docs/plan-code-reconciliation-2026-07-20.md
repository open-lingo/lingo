# Plan ↔ Code reconciliation

**Status:** LIVE · **Last-verified:** 2026-07-20

A single consolidated pass over the `lingo/docs/` corpus (152 md files + `tasks/`,
`archive/`, `superpowers/specs/`, dated planning docs) checked against the **actual
code** in `/home/trevor/projects/open-lingo/lingo/src`. Every status below was verified
by grep/read of source, not taken from the doc's word.

## Meta-findings (read first)

1. **The code has moved past most plan docs via a large refactor + a big-bang rewrite.**
   - The per-language slice is now `src/features/languages/{ja,ko,es}/curriculum/*.ts`
     with `grammarHelpers.ts`, `courseAtoms.ts`, etc. The docs (`PROJECT_STATE.md`,
     the sibling `docs/CLAUDE.md`, most `tasks/*`) still cite the **old** paths
     `features/lesson/data/mock-ja-m*.ts` and `_jaGrammarHelpers.ts`.
   - The **JA course was replaced on the live map by the "draft-3 spine" big-bang**
     (commit `cbac264e feat: learn page IS the rewrite — old course off the map, spine
     on it`). This is the single largest plan↔code gap — see §2.1.
2. **Several deferrals the task asked about have been *achieved by a different mechanism*,
   not by the code path the plan describes** (vocab-graduation, kanji reveal). The plan
   text is stale; the outcome shipped.
3. **The 2026-07-17 retrospective is itself now a mixed shipped/open plan** — its top-tier
   gates (extend conformance, JA per-module tests, atom-coverage to m8+, doc-references-code
   test) shipped *after* it was written; the content-lint gates + guide split did not. See §2.7.
4. **`lingo/CLAUDE.md` is the current orientation doc; `open-lingo/docs/CLAUDE.md` is a
   stale duplicate** in a different (umbrella `/home/trevor`) git repo. They have diverged.

---

## 1. DEFERRED (intentional — leave as-is)

| # | Item | Evidence | Why deferred |
|---|------|----------|--------------|
| 1.1 | **Phase 6 struggle-weighted render-time review-pool picker** | `pickReviewAtomsWeighted` (`languages/ja/grammarHelpers.ts:829`) has **zero call sites**; `reviewQueue.ts` sorts due cards by FSRS difficulty (`cardMaxDifficulty`, lines 126/186) + earliest-due. | `lingo/CLAUDE.md:52` lists it as a backlog phase. FSRS difficulty ordering is an acceptable proxy; the struggle-weighted variant is a nice-to-have. (Also appears in §3 as genuinely not-built.) |
| 1.2 | **Ads UI + ad-free-time UI** | `features/ads/` (`AdSlot`, providers, DI) + ad-free SKUs built; UI hidden. | Deliberate ad-free MVP trial (`TODO.md:157`, `PROJECT_STATE.md`). Post-MVP. |
| 1.3 | **Social + community surfaces** | Fully wired; gated dark behind `social.enabled` / `community.enabled` (default false, `public/feature-flags.json`). | Spencer+Trevor MVP decision — code intact, flip to restore. |
| 1.4 | **Lesson-attach grammar review tails** (`withGrammarReviewTail`) | Not shipped. | `grammar-deck-v1-spec-2026-07-02.md` marks it a deliberate fast-follow. |
| 1.5 | **13 te-compound/aux conjugation points** uncovered by the Conjugation Trainer | In `POOL_GAP_EXEMPTIONS`; trainer covers 9 of 22. | Explicit v2 (`lingo/CLAUDE.md:48`). |
| 1.6 | **SRS scheduling-model phase 2: D3 review-lesson gating, D1 store unification, D7 FTUE** | Not shipped. | `srs-scheduling-model-2026-06-15.md` (ACTIVE) marks them open by design. Note D1 = Spencer's "one deck-backed SRS store" direction (`followups.md` §"SRS storage unification"). |
| 1.7 | **Anki import in production** | Full pipeline `flashcards/import/` + `settings/ImportStudyHistorySection.tsx`, but **dev-gated** (`import.meta.env.DEV`). | Awaiting Spencer go/no-go + media/S3 pipeline (`flashcards-anki-scoping-2026-06-13.md`). |
| 1.8 | **Per-word kanji mastery fade** | `kanjiRollout.ts` ships module-window furigana (unlock+2); per-word memory-driven fade not built. | Explicitly v2 in `kanjiRollout.ts` header. |
| 1.9 | **Billing / Stripe / live AdSense fills / live funding %** | Framework only. | Post-MVP (`ECONOMICS.md`, `PROJECT_STATE.md`). |
| 1.10 | **Speech-recognition production use** | POC flagged off. | `superpowers/specs/2026-05-15-speech-recognition-research.md` — parked. |

---

## 2. DIVERGED (code ≠ plan — needs a decision)

### 2.1 ⭐ JA course big-bang: the shipped learner-facing course regressed to ~7 lessons past kana
**Code is "right" as a direction, but the docs describe a course that is no longer on the map, and learners hit placeholders.**

- `src/shared/domain/mockCourse.ts:217-322`: the draft-3 spine (`SPINE_UNITS` in
  `features/lesson/dev/spinePlan.ts`, `SPINE_VERSION="draft-3 (2026-07-19)"`) **replaced the
  old m3–m28 map**. Only **m3 = `ja-m3-neo-*` (7 lessons)** is authored; **m4–m29 are
  `comingSoon` placeholder modules with zero lessons** (`SPINE_COMING_SOON`, `mockCourse.ts:233-271`).
- The old authored m3–m28 content (thousands of LOC, `curriculum/m4.ts … m27.ts`) is **off the
  map — deep-link only** via `/ja/qa` (`mockCourse.ts:326-333`).
- Plan docs still describe a full M1–M27 course: `PROJECT_STATE.md` route table + module tables,
  `curriculum-design-v2.md`, `n5-content-spec-2026-05-25.md`, `lesson-authoring-guide.md §6`
  ("shipped spine is M1–M27"). CLAUDE.md §"Vocab SRS unification" and the sibling `docs/CLAUDE.md`
  reference `mock-ja-m{3-v2,4,5,6,7}.ts` as live.
- **Decision needed:** either (a) commit to finishing the reauthor of m4–m29 to the neo template
  (L — the m3-neo pilot is 1 of ~26 stations), or (b) put the old course back on the map behind a
  flag until the spine content lands. Today a JA learner past m3 sees "content not yet authored."
  Whichever, `PROJECT_STATE.md` + `CLAUDE.md` route/course tables must state the course is
  mid-rewrite.

### 2.2 Source layout moved; most docs cite dead paths
- `features/lesson/data/mock-ja-m*.ts` → `features/languages/ja/curriculum/*.ts`;
  `_jaGrammarHelpers.ts` → `languages/ja/grammarHelpers.ts` (1,925 LOC); `_stepPredicates.ts`,
  `courseDeck.ts`, `unlockLessonAtoms.ts` etc. still under `features/lesson/data/` or moved to
  `shared/`.
- `lingo/CLAUDE.md` is mostly updated; the **sibling `open-lingo/docs/CLAUDE.md` (older copy,
  2026-07-16) is stale** — still lists "Missing shared primitives (Modal/CenteredLoader/EmptyState)"
  (all three now exist at `src/shared/components/ui/`), the sepia theme, and old phase framing.
- **Decision:** delete the sibling `docs/CLAUDE.md` (or make it a pointer); refresh path references
  in `PROJECT_STATE.md` and `tasks/*`.

### 2.3 Target retention 0.95 → 0.90 (doc lags code, and the gate doesn't cover it)
- `features/flashcards/engine/srs.ts:46` — `TARGET_RETENTION = 0.9` (commit `0a856cf9` +
  `de63e0bd docs(srs): fix stale retention comments 0.95 → 0.90`).
- `lingo/CLAUDE.md:45` still says **"Target retention 0.95"**; the sibling `docs/CLAUDE.md` too.
- The `docReferences.test.ts` doc-truth gate checks script-ladder constants but **not** retention,
  so this drift is unguarded. **Fix the doc + add a `TARGET_RETENTION` matcher.** (Cheap, high value.)

### 2.4 Phase 5 (vocab-graduation): goal met via a *different* mechanism; the planned path is dead code
- **Achieved:** `Flashcard.unlocked` is computed from an atom-id unlock store
  (`features/lesson/data/unlockLessonAtoms.ts` → `getUnlockedAtomIds()` →
  `buildEnrichedJaCourseDeck`, `flashcards/data/courseDeck.ts:57-65`), **with per-user server
  backup** (`POST /progress/me/unlocks` via `useUnlockMapSync`, wired in `routes/Layout.tsx:59`) —
  this *exceeds* the plan. `LESSON_TO_CARDS`/`lessonCardMap.ts` is **deleted** (tombstone at
  `flashcards/data/loadDeck.ts:6-16`).
- **Dead-end:** the literal `lingo:vocab-graduated` pipeline the plan describes is **dispatched but
  has no consumer** — `notifyFlashcardsOfGraduation` (`shared/vocabGraduation/index.ts:153`) fires
  from `LearnPage.tsx:177`, but the only `addEventListener("lingo:vocab-graduated")` is in a test.
  The module's own comment concedes "the receiver isn't wired yet."
- **Decision:** delete the `shared/vocabGraduation/` subsystem (dead) **or** wire it; either way mark
  `srs-deck-unification-plan-2026-06-13.md` phase-5 text as done-differently.

### 2.5 Phase 7 (kanji reveal): shipped, but not via `kanjiUnlocked`/`kanjiIntroStep`/`showKanji`
- Zero hits for those symbols. Kanji shipped as a **render-time surface post-pass**
  (`languages/ja/secondScript/applyKanjiSurfaces.ts`, gated `unlockModule ≤ learnerModule`) +
  **furigana window** (`kanjiRollout.ts:53 FURIGANA_WINDOW=2`, `KANJI_RECOGNITION_MODULE=8`) +
  SRS-driven furigana visibility (`shared/readingAnnotation/AnnotatedText.tsx`). Live from m8.
- `kanji-implementation-spec-2026-07-16.md` (has STALE-ish banner) and `n5-content-spec-2026-05-25.md`
  (STALE banner) still describe nonexistent `kanji_intro`/`kanji_recognition` step types +
  SRS-state furigana fade. `lingo/CLAUDE.md:52` already notes the supersession. **Decision:** finish
  bannering those two SoT docs (mostly done).

### 2.6 es-course-spine step contract contradicts the shipped es quality gate
- `es-course-spine-2026-07-13.md` prescribes "6–9 steps, no grammar_rule/selfExplain, phrase-card
  intros"; the es remediation shipped **18–22 steps enforced by
  `languages/es/curriculum/es-quality.test.ts`**. Following the spine doc fails es CI.
  **Decision:** banner `es-course-spine` as superseded by the es rewrite (`es-rewrite-brief-2026-07-16.md`).

### 2.7 The 2026-07-17 retrospective is partly shipped — update its status before anyone re-does it
Verified against code (all landed *after* the retrospective):
- **Gate 1 SHIPPED** — `languages/ja/__tests__/moduleConformance.test.ts:44` now derives
  `CONTENT_MODULE_IDS` from `jaModule.curriculum` (no hardcoded 3–27). *(Residual `n <= 27` at line
  153 is one narrow "planned grammar point" sub-check — minor.)*
- **Gate 2 SHIPPED** — JA per-module test files now exist: **28** (`ja/curriculum/m*.test.ts`),
  vs ES 16 / KO 27. The retro's central claim ("JA has 0") is reversed.
- **Gate 4 SHIPPED** — `features/lesson/data/atom-coverage.test.ts:419` is the "full-spine
  m3–m29 re-exposure" gate.
- **doc-references-code test SHIPPED** — `src/__tests__/docReferences.test.ts` machine-checks
  script-ladder constants across CLAUDE.md + the guide + pedagogy-principles + 2 more, and enforces
  Status front-matter on a 10-doc list.
- **Vite `build`/`manualChunks` block SHIPPED** — `vite.config.ts:343-354` (retro §6 perf ask, partial).
- **Still open:** Gate 3 (branded `ModuleId` — `shared/language/types.ts:41` is still
  `type ModuleId = string`; the 8 duplicate `/^m(\d+)$/` parsers not consolidated), Gates 5/6/7/9/10
  (content-quality + render-smoke lints), the guide split, full Status sweep. See §3.
- **Decision:** stamp `retrospective-2026-07-17.md` with which gates are done (it currently reads as
  100% "not implemented yet").

---

## 3. NOT BUILT (planned, still open)

**Legend:** effort S/M/L · value H/M/L.

### Regression-prevention gates (retrospective §4 remainder)
| Item | Effort | Value | Note |
|------|:--:|:--:|------|
| **Gate 3** — one canonical `moduleId` parser + branded `ModuleId` type + delete 8 duplicate regexes + round-trip table test | M | **H** | Kills Class-A silent-falsy bugs (the `parseModuleIndex` prefix defect). |
| **Gate 5** — MCQ distractor-quality lint (`assertMcqOptionsDiscriminate`) | M | H | Would retroactively vet spine reauthoring. |
| **Gate 6** — grammar antiPattern minimal-pair lint | S | M | `deriveGrammarMicroSteps.spotStep` assumes but never checks it. |
| **Gate 7** — JA sentence-complexity ratchet (ES already has it) | M | M | Codifies guide §4g. |
| **Gate 9** — render-integration smoke on the exemplar module (0 romaji / kanji surfaces) | M-L | H | The only gate reproducing the manual-QA vantage; zero coverage today. |
| **Gate 10** — register-consistency lint | M | L | Hardest; partial by nature. |
| **Gate 8** — `phrase_card` construction guard | S | M | Likely shipped (`shared/lessonAuthoring/curriculumAssertions.test.ts` references it) — **verify**, then close. |

### Doc hygiene (retrospective §5 remainder)
| Item | Effort | Value |
|------|:--:|:--:|
| **Guide split** — `lesson-authoring-guide.md` (809 LOC, single file) → core + `annex-ja/es/ko` | M | H |
| **Finish Status front-matter sweep** — only ~19 top-level docs carry it; ~30 dated docs don't | S-M | M |
| **Monthly archive sweep** of SHIPPED/SNAPSHOT docs (README mandates it; not happening) | S | M |

### Vocab-SRS follow-up cleanups (CLAUDE.md §"Follow-up cleanups")
| Item | Effort | Value | Status |
|------|:--:|:--:|------|
| `M3_M7_REVIEW_POOL` derive from `JA_COURSE_ATOMS` | S | M | **Open** — still a hand-authored literal (`grammarHelpers.ts:644`). |
| Canonicalize `さけ`/`おさけ` | S | L | **Partial** — `すし`/`寿司` merged; `さけ` (m7) + `おさけ` (m21) still split (`courseAtoms.ts:238,251`). |
| Move build-time assertions to a test-only helper | S | M | **Open** — still import-time (`curriculum/m19.ts:327` etc.); safe today only because factories haven't moved to mount time. |
| Wire (or delete) the `vocabGraduation` receiver | S | M | See §2.4. |

### Frontend infra / code-health
| Item | Effort | Value | Evidence |
|------|:--:|:--:|------|
| **Add ESLint + Prettier** (still absent) | S | M | No config files; `lingo/CLAUDE.md:17` "No ESLint/Prettier configured." |
| **Split `LessonPage.tsx`** (1,051 LOC "GOD FILE") | M | M | grew from ~23KB. |
| **Split `languages/ja/grammarHelpers.ts`** (1,925 LOC) | M | M | retro §6. |
| **Theme-token channel-triple sweep** — `tokens.css` stores hex (`--color-accent:#9c2c2c`); `bg-accent/<N>` alpha classes silently emit no CSS | S-M | M | `followups.md` §"Theme tokens"; still hex + `tailwind.config.js:22` `var(--color-accent)`. |
| **Legacy modal trinity migration** — `ConfirmModal`/`ModalBase`/`ModalBackdrop` still ship alongside `Modal`/`Dialog` (~20 call sites); unmerged commit `a7690d5` on `refactor/ui-primitives-consolidation` | S-M | L | `followups.md` §"UI primitive migration". |
| Code-health nits: `stripBuildSentenceSteps` dead+latent id-bug (`mockLessons.ts`); `glossLooksLikeVerb` `startsWith("to ")` fragile; `fill_blank` shadowed path; ~6 zero-caller dead exports in grammarHelpers | S each | L | retro §6. |

### Backlog features (task docs still LIVE / not started)
- **Backend:** content API (`tasks/backend-content-api.md`), user-settings API
  (`tasks/backend-user-api.md`), auth 401-refresh (`tasks/auth-session-strategy.md`), leaderboard API,
  live funding % sync. All L, value varies.
- **Conversation / LLM support — pure paper, no code.** `local-conversation-llm-recon-2026-07-05.md`
  + `convo-typing-scoping-ab-2026-07-11.md` have **no feature dir, route, or API client** (only
  `finance.ts:73 openai:` cost field). L, strategic-but-uncertain.
- **N4 arc** (`n4-scoping-2026-07-16.md`, `n4-pilot-spine-2026-07-16.md`) — m29/m30 curriculum files
  exist but the tier is entangled with the unfinished spine (§2.1). L.
- **Frontend polish:** `ja.json` UI locale (not started), card-markdown editor, community external-content,
  SRS-viewer-redesign (partial), story real content (layout only). S–M each.

---

## 4. STALE DOCS (archive/remove)

Prefer **move to `docs/archive/`** over delete (audit trail). Full per-doc classification below.

### Archive now — SHIPPED (work done; archival value only)
`tasks/alphabet-learner`, `tasks/homepage-ux` (has closed banner), `tasks/particle-practice`,
`tasks/practice-hub` (closed banner); `superpowers/specs/2026-05-14-japanese-lesson-flow-design`,
`2026-05-15-alphabet-streamline`, `2026-05-15-curriculum-restructure`,
`2026-05-15-japanese-lesson-flow-handoff`, `2026-05-15-learn-page-pathway-react-port`,
`2026-05-15-sentence-practice-step`, `2026-05-18-home-restructure-design`;
`m2-row-template-2026-05-17`, `m3-m7-rebuild-spec-2026-05-18`, `wave-4-m3-m7-reauthor-2026-05-18`,
`wave-4b-dispatch-briefs`, `practice-features-spec-2026-05-25`, `handoff-2026-07-01-katakana-audit`,
`conjugation-trainer-recon-2026-07-02` (v1-shipped banner), `qa-live-findings-2026-07-12`,
`srs-deck-unification-plan-2026-06-13` (keep as card-model reference, but banner SHIPPED).

### Archive now — SUPERSEDED (name the successor)
- `tasks/anki-import` → `anki-import-spec-2026-07-07.md`
- `tasks/japanese-content`, `tasks/lesson-reauthor-sentence-variety` → curriculum + m3-m7 reauthor waves
- `superpowers/specs/2026-05-14-japanese-followups` → full curriculum
- `superpowers/specs/2026-05-15-phase-2-review-cadence`, `2026-05-15-spaced-review-cadence` →
  `srs-scheduling-model-2026-06-15.md`
- `superpowers/specs/2026-05-18-home-restructure-notes` → `2026-05-18-home-restructure-design`
- `flashcards-anki-scoping-2026-06-13` (Anki portion) → `anki-import-spec-2026-07-07`
- `es-course-gaps-2026-07-13` (has banner) → `es-ja-parity-2026-07-15`
- `es-course-spine-2026-07-13` → `es-rewrite-brief-2026-07-16` (add banner — see §2.6)
- `retention-architecture-design-2026-06-13` (has banner) → `srs-scheduling-model-2026-06-15`

### Banner as STALE-SNAPSHOT (keep for history, mark clearly)
`card-agnostic-reviews-2026-05-21`, `m3-m7-audit-synthesis-2026-05-18`,
`learning-science-foundation-2026-05-17` (self-FROZEN), `n5-content-spec-2026-05-25` (has STALE banner
but kanji sections actively wrong — §2.5), `ARCHITECTURE_REVIEW_2026-06-14`,
`info-step-audit-2026-07-16` (reads as a live inventory of steps that are now 0).

### Delete (true duplicate, outside lingo)
`/home/trevor/projects/open-lingo/docs/CLAUDE.md` — stale duplicate of `lingo/CLAUDE.md` in the
umbrella repo (§2.2). *(Not in `lingo/docs/`, so out of scope for this repo's sweep — flag to Trevor.)*

### Refresh, don't archive (claimed SoT, self-declared STALE)
`PROJECT_STATE.md` — carries its own "STALE — did not absorb the 2026-07-16 script-ladder wave" banner
and predates the spine big-bang. Needs a rewrite, not archival.

### Still LIVE (leave)
`tasks/README` (lower-confidence status table), `tasks/backend-progress-api` (living tracker),
`tasks/{backend-content-api, backend-user-api, auth-session-strategy, card-markdown-editor,
community-resources, community-themes, grammar-page, components-practice, kanji-practice,
korean-content, srs-viewer-redesign, story-content, vocab-page, local-cache-server-state-research,
performance-budgeting, schema-versioning-migration}`; `superpowers/specs/{2026-05-18-social-page-design,
2026-05-19-practice-progress-registry-design, 2026-05-24-quests-tracking-design,
2026-07-15-placement-level-gate-design, 2026-07-15-testout-improvements-design}`;
`pedagogy-principles-2026-07-05` (LIVE/binding), `srs-scheduling-model-2026-06-15` (ACTIVE),
`dispatch-economics-log`, `visual-qa-gate-2026-07-17`, `workshop-agenda-2026-07-12`,
`ja-ko-parity-audit-2026-07-15`, `es-ja-parity-2026-07-15`, `es-content-quality-audit-2026-07-16`,
`es-rewrite-brief-2026-07-16`, `kanji-timing-research-2026-07-16`, `n4-scoping-2026-07-16`,
`n4-pilot-spine-2026-07-16`, `ai-workflow-optimization-research-2026-07-17`,
`spine-draft2-adversarial-audit-2026-07-19`, `srs-memory-retention-research-2026-07-19`
(now partly SHIPPED — leech/sibling-burying + 0.90 retention landed in `srs.ts`),
`vocab-frequency-audit-2026-07-19`, `concept-type-authoring-guide-2026-07-19` (skeleton),
`local-conversation-llm-recon-2026-07-05`, `jouzu-juls-cure-dolly-recon-2026-07-02`,
`lesson-editor-research-2026-05-20`, `finance-transparency-endpoint-spec-2026-05-25`,
`placement-questions-proposal-2026-07-08`, `placement-testout-derived-2026-07-08`,
`social-engagement-research-2026-05-25`, `curriculum-audit-vs-research-2026-05-21`,
`ftue-design-2026-06-14` (DRAFT).

---

## 5. Ranked "reconcile next" (top 10)

1. **Resolve the JA spine big-bang (§2.1).** Decide: finish reauthoring m4–m29 to the neo template,
   or restore the old course to the map behind a flag until spine content lands. Today learners past
   m3 hit "content not yet authored." Then fix `PROJECT_STATE.md` + `CLAUDE.md` course/route tables.
   *(L / highest — this is the actual product state.)*
2. **Refresh `PROJECT_STATE.md`** (self-declared STALE) **and delete the stale sibling
   `open-lingo/docs/CLAUDE.md`** (§2.2). *(S-M / high — it's the doc agents read first.)*
3. **Fix retention 0.95→0.90 in `lingo/CLAUDE.md:45` + add a `TARGET_RETENTION` matcher to
   `docReferences.test.ts`** (§2.3). *(S / high — cheap, and makes the drift self-guarding.)*
4. **Stamp `retrospective-2026-07-17.md` with what shipped** — Gates 1/2/4 + doc-references-code test
   are done (§2.7); mark them so nobody re-implements. *(S / high.)*
5. **Guide split** (core + annex-ja/es/ko) **+ finish the Status front-matter sweep + archive the
   SHIPPED/SUPERSEDED docs in §4.** *(M / high — this is the context-rot fix the retro identified.)*
6. **Gate 3: canonical `moduleId` parser + branded `ModuleId` type + kill the 8 duplicate regexes +
   round-trip test** (§3). *(M / high — the highest-blast-radius silent-bug class.)*
7. **Decide the `vocabGraduation` dead-end** — wire the receiver or delete `shared/vocabGraduation/`;
   update the srs-deck-unification plan's phase-5 (§2.4). *(S / medium.)*
8. **Theme-token channel-triple sweep** — `tokens.css` hex → `R G B` triple + `rgb(var(...) /
   <alpha-value>)`; resurrects every silently-dead `*-token/<N>` alpha class (§3). *(S-M / medium.)*
9. **Batch the cheap content cleanups:** derive `M3_M7_REVIEW_POOL` from atoms, canonicalize
   `さけ/おさけ`, move build-assertions to a test helper, drop the dead exports / `stripBuildSentenceSteps`
   / fragile `glossLooksLikeVerb` (§3). *(S each / medium.)*
10. **Add ESLint + Prettier, then split `LessonPage.tsx` (1,051) and `grammarHelpers.ts` (1,925)** —
    plus land the remaining content-quality gates (5/6/7/9) which would retroactively vet the spine
    reauthor. *(M / medium.)*

---

*Method: 3 parallel read-only code-verification agents (SRS unification phases, spine + new-feature
docs, doc-staleness classification) + direct grep/read of `src/` and the anchor docs
(`PROJECT_STATE.md`, `TODO.md`, `followups.md`, `retrospective-2026-07-17.md`, `lingo/CLAUDE.md`).
Every "shipped/not-built" verdict was checked against source, not the doc's word.*
