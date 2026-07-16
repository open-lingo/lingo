# Open Lingo — project state

**Last updated:** 2026-07-16  
**Purpose:** Accurate snapshot for humans and agents. For launch tasks see [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md).

---

## Executive summary

Open Lingo is a language-learning SPA (**lingo**, Vite + React) with **lingo-core** (FastAPI). Core loop: **learn → lessons → flashcards (SRS) → settings**. The ja learn homepage is the **transit map** (`learn.transitMapHome` flag; classic page saved at `learn/classic`). **Social + community ship dark for the MVP** (`social.enabled` / `community.enabled`, both false — code intact, flip `public/feature-flags.json` to restore; account registration on `/u/<name>?register=1` is exempt). Legal, landing/auth split, ads framework, and funding meter API exist; **live revenue** is post-launch.

### Recent (2026-07-16 — transit map IS the ja learn page + MVP social/community dark)

- **Transit map promoted to the ja learn homepage.** `features/learn/TransitLearnPage.tsx` (graduated out of `dev/`) renders at `/:lang/learn` for ja via the `LearnHomeRoute` dispatcher while `learn.transitMapHome` is on — flip it in `public/feature-flags.json` to revert instantly, no rebuild. The classic `LearnPage` is saved at **`/:lang/learn/classic`** (LearnDevPanel unlock/clear tools still live there); `/:lang/transit-preview` stays as design-review mode (`preview` prop → demo progress + demo/real toggle; live mode is real-progress only, no toggle). Live mode ports the PlacementPrompt FTUE fallback and fires `page_view` with `variant: "transit-map"`. Both width caps (Layout `wideCanvas`, LearnLayout 2xl) exempt the live map; `lazyRetry`'s constraint widened to `ComponentType<any>` (React.lazy parity) so lazy pages can take typed props.
- **MVP decision (Spencer + Trevor): social + community hidden, NOT deleted**, behind new flags `social.enabled` / `community.enabled` (default **false**; `isLeaderboardEnabled` now also requires community). Gated everywhere: nav ×4 (sidebar rail, top bar, mobile drawer, command palette), routes (`RequireSocial`/`RequireCommunity` bounce to home — social, friends, messenger, the whole community tree, `u/:username`), and ~18 cross-page entry points (home cards + activity rows + trending strip + friends-leaderboard card, practice browse-decks chip, flashcards/deck-manager/card-manager browse links, studio header, auth menu, settings profile link, learn-courses community section, admin edit links). **Registration is exempt:** `/u/<name>?register=1` (account provisioning for fresh accounts, HomePage 404-redirect) bypasses the social gate via `RequireSocialProfile`.
- **New guard script `scripts/mvp-smoke.mjs`** (15 checks): transit live at ja/learn (no demo toggle), classic saved, preview intact, es stays classic, nav hidden, 5 gated routes bounce, register survives, zero page errors. `transit-measure.mjs` gained `TM_PATH=/ja/learn` for measuring the live homepage and now walks the FTUE arc (server settings replay over local seeds; bare `text=Skip` matches the hidden skip-to-content link — button-scoped selectors).
- Verified: tsc clean · **3,029 tests passed / 1 skipped** · mvp-smoke 15/15 · transit-measure **52/52 on BOTH** `/ja/transit-preview` and live `/ja/learn` · es-smoke 7/7 · prod build clean.
- Spencer's every-button QA pass now targets the LIVE learn page (all interactive elements listed in the TransitLearnPage header TODO); es editorial drive still pending.

### Recent (2026-07-15 — es feature wave + ja↔es parity + transit-map concept)

- **⚠ Spencer flags (2026-07-15 evening):** (1) es lesson authoring quality is **really bad** — full editorial/QA drive required before es is learner-facing (engine is fine; the authored content is draft). (2) The transit-preview page needs a **full interaction QA pass — verify every button/link works** (stations, quest stops, sprint legs, depot, board rows, stamp strip, prev/next, toggles) before promoting beyond a dev preview.

- **Every gap the es course authored around is now shipped** (6 engine agents + 4 content agents): NEW `agreement_cloze` step type (multi-blank gender/number sets, graded together); **ConjugationGrid** person×tense trainer at `practice/conjugation` for es (`ConjugationHubRoute` dispatches by language — the es tile previously landed on the ja kana trainer, i.e. wrong data); accent **accept-but-flag** grading ("Correct — watch the accents: años") + AccentBar (á é í ó ú ü ñ ¿ ¡); es `matchPairs`/`dialogueListen`/`vocabTextMcq`/`capstoneMatchPairs` factories + language-keyed match pad pool (es grids no longer risk Japanese fills); cloze `exercisedAtomSurfaces`. Content wave: **15 match grids, 12 dialogues (m5+), ~20 agreement drills, ~24 text-front MCQs** across m2–m16; TTS topped up **+61 clips → 1,255 es keys, 100% deck coverage** (emitter now walks dialogue lines + match pair sources).
- **ja-gate burn-down (es AND ko benefit)**: `normalizedAtoms` adapter behind `lessonAtomIndex` un-gated the whole dead column — vocab browser, in-lesson SRS review, enriched course decks + due summaries, subscription queue, module-vocab preview, course-map samples + `COURSE_MILESTONES.es`, command-palette vocab. Derived module test-outs parametrized (es derives full 12-item sets; authored bank fallback; `TESTOUT_DERIVED_FLOOR=8`). Audit + remaining deltas: `docs/es-ja-parity-2026-07-15.md` (top leftovers: es/ko review-lesson routing, ko TTS still zero clips, two-voice dialogues, ProgressPage ja-deck call).
- **Transit-map learn concept (dev preview)** at `/:lang/transit-preview` (`features/learn/dev/TransitMapConceptPage.tsx`): the course as a Tokyo-Metro network — modules as stations (spacing scales with lesson count), real sideQuests as branch spurs, progress as line fill, dashed locked track, animated line-draw + train mascot ride (reduced-motion safe), click-through district view per module (lessons as local stops, all real links), mobile = transit-app line diagram. Measured clean at 390/1080p/4K × light/dark (`scripts/transit-measure.mjs`, 34/34). Animation research catalog in the session log; standalone HTML mockup preceded it (artifact).
- Verified: full suite **3,029 passed / 1 skipped**, tsc clean, prod build clean, `es-smoke.mjs` 7/7 (3 new checks: grid trainer, agreement deep-link, dialogue deep-link).

### Recent (2026-07-13 — Spanish A1 course mass-authored)

- **Third language shipped: Spanish (es), full CEFR A1 arc** — 16 modules × 8 lessons (128 lessons, ~1,100 steps), 434 atoms (gendered nouns), placement bank (16 screeners + 64 items), 10-verb × 18-form conjugation tables, 8 reading passages, 24 speaking prompts, ~1,200 es-MX TTS clips (Dalia voice). LatAm-neutral (ustedes; vosotros culture-noted). Authored by 8 parallel agents against `docs/es-course-spine-2026-07-13.md` (pre-allocated vocab per module = zero merge conflicts); ko house style (base Atom, infoStep grammar, no grammar_rule yet).
- **Multilang plumbing:** shared TTS resolver default now follows the active course language (`setDefaultTtsLang`, stamped by LanguageContext); es voices in lingo-core pipeline; runtime-walking TTS deck emitter for Latin-script languages (`es/__tests__/emitTtsDeck.test.ts`, env-gated). NOTE: the browser-speechSynthesis fallback the ko module comment mentions does **not exist** — ko remains silent; es ships real clips.
- **Known gaps** (authored around, ranked): ConjugationGrid person×tense trainer (data already shipped), AgreementCloze, accent-aware grading (interim: diacritic-stripped acceptedAnswers incl. ñ→n), es match_pairs factory (pad pool is ja-keyed), dialogue_listen factory, cloze `exercisedAtomSurfaces`. See `docs/es-course-gaps-2026-07-13.md`.

### Recent (2026-07-12 evening — QA page ralph audit + post-push review round)

- **QA page rework (audit-driven, all E2E-verified):** dev pages paint their own themed background (LangLayout gives no shell — dark themes were unreadable); lesson links deep-link `?step=<type>[.<n>]` (jump lands on the first step of that type — devGates); fixture links hash-scroll + highlight on the lazy previewer; 2 missing fixtures added (self_explanation_mcq, dialogue_listen) + coverage test; fixtures lazy-mount (no more page-load TTS cacophony) with fresh ids per Reset; ONE named play tab; section progress counts + jump-to-first-unmarked; per-language note storage (v1→v2 migration) + sendBeacon flush on tab close + orphan-note export section; notes middleware hardened (1MB cap, atomic write, 400 on bad JSON); sidequests no longer hijack the "early" pick; symbol_production correctly labeled (ships via kana learn flow); new rows: mechanics/failure-state recipes, kana learn, journey, travel-sprint, /try, /settings.
- **Post-push review fixes (3 agents over 13a7f22..4aeada9):** Quick Fix modal keyboard leak (Enter advanced the lesson behind the modal); placement gloss apostrophe truncation (9 items); typed trailing 。 failed correct translate answers; placedIndex counts assumed modules; m22 このまちのなかで semantics; m13 かおを split; ~294 TTS clips (courseAtoms now a TTS source — review-tail draws can't go silent). Remaining design items recorded in `workshop-agenda-2026-07-12.md` §POST-PUSH (grammar span boundaries, assumed-module server sync, listening heuristic gap ~98 items).

### Recent (2026-07-11→12 — QA test-drive, live-fix round, grammar micro-teaching, listening wave)

- **QA test-drive tooling:** dev page `/ja/qa` links every step type to real lessons + all surfaces, with per-row verdict/critique capture that streams LIVE to `/tmp/lingo-qa-notes.json` via a vite middleware (`/__lingo-qa-notes`, devLog pattern) — an agent watched and fixed while Spencer tested. Coverage scan exposed 3 engine-only step types; `teach` retired (superseded by phrase_card — /try preview converted), `fill_blank`/`symbol_production` kept for the multi-language roadmap.
- **Live-fix round (all E2E-verified):** placement/test-out exit X; practice-hub locks → honest "Recommended from Module N" (routes were never enforced); romaji auto-off now POSITION-triggered (fires on placement application, not just lesson completion); failed attempts show honest 0 XP mirroring the server (skip-outs + sub-70%); match grid height capped; match-pairs classifier made structural (ヲ→"wo" grids no longer misclassify + pad vocab into sound grids); pick-time source/target dedupe kills 花/鼻 coin-flip tiles; particle tiles split from words (のが/シャワーを/はを) + `particleTileSeparation.test.ts` guard; translate accepts rule-safe variants (topic drop, pronoun swap, です drop, punctuation) AND live romaji→kana typing (wanakana, uncontrolled textarea + submit-time DOM grading); particle clozes show the English gloss pre-answer everywhere; grammar-review zero-state no longer lies when the daily intake cap empties the queue; consent banner publishes --cookie-consent-height so fixed shells reserve space; kanji empty state guides; Survival Phrasebook pulled from the map (tile only, Spencer).
- **Placement round 2 (Spencer critique):** near-duplicate sentence MCQs auto-render as cloze-with-chips (shared-frame detection in `instantiateItem`); assumed modules are now MARKED COMPLETE ("credited from your level" — vocab still seeds SRS; no more "go do them now"); missed-skill labels resolve module ids to titles; chips sort.
- **Grammar micro-teaching (workshop A, research-backed):** lessons render the COMPACT rule card (rule + example 1 + 🌸 tap-to-expand culture chip); `deriveGrammarMicroSteps` post-pass tags drills with a reactive ✗/✓ "Quick fix" card (fires on the learner's actual error, once per point per session, flashes the rule line) and injects a derived spot-the-mistake MCQ (guaranteed single labeled exposure, never voiced, slot-rotated) — all ~93 anti-patterned points inherit, zero re-authoring. Evidence base + phase-2 (knowledge pages, mastery fade, deck resurfacing) in `docs/workshop-agenda-2026-07-12.md`.
- **Listening sentence-first wave (workshop B):** 381 word-level listening items converted to sentence-level by 5 parallel agents (M5-M27, zero skips); ratchet guard `listeningGranularity.test.ts` now a flat ban (kata rows exempt — script acquisition); 299 new TTS clips generated (manifest 4,590 keys). Particle-cloze placement policy (workshop D): intro+2 boundary, 82 late usages grandfathered shrink-only (`particleClozePlacement.test.ts`).
- **Docs:** `qa-live-findings-2026-07-12.md` (every verdict + disposition), `workshop-agenda-2026-07-12.md` (A-E all closed; polish backlog), `convo-typing-scoping-ab-2026-07-11.md` (AI-convo v0 + typing ladder + 6 A/B designs), authoring guide §4b/§4b2/§4c. Multi-language scoping research (11-agent pass) in local-only `docs/research/multi-language-scoping-2026-07-11.md`.
- Suite: **2,794 tests green**, tsc clean, throughout.

### Recent (2026-07-07, part 2 — main push, pre-handoff E2E, Spencer migration, sync-race fix)

- **Week's wave PUSHED to main** (6 commits total `4ea4d39..fa66452`): course/katakana+TTS, practice/grammar-deck+trainers, Anki import, docs+chore, E2E fix round, sync serialization. Tree clean.
- **Pre-handoff E2E user test** (single Sonnet subagent, dev-bypass, all surfaces + M1/M5/M10-kata/M15 full-lesson content audits; findings archived at `research/qa/e2e-findings-2026-07-07.txt`, local-only): 0 P0, zero console errors, mobile 390×844 clean. Fix round shipped same day: katakana yōon romaji (map had only リャ/リュ/リョ — ジュース rendered "ji"; full parity + extended digraphs + tokenizer small-vowel merging), reachable review summary ("New cards per session" cap control in reviewer settings, null = reset sentinel), quote-emphasis contraction bug ("'I'm…'" → "Im"), segments-path word-romaji grouping (SpeakingStepView showed さん as "sa"+"n"), learn-map opens CURRENT module over stale accordion state, modal titles wrap not truncate. E2E also surfaced: Counters Trainer already shipped (`/ja/practice/counters`).
- **Spencer's real Anki migration EXECUTED + server-verified**: 1,077 known items → 394 atoms seeded (376 recognition-review on server, ~199 vocab due); 18 cards kept fresher real reviews via server-side LWW; 0 new unlocks (all matched atoms already unlocked). 568 beyond-course words preserved (`research/anki/`, local-only) = N4-core demand signal for the M18+ arc.
- **Sync-race bug found + fixed** (`fa66452`): ApiClient `tag:"srs:sync"` dedup ABORTS the previous in-flight POST — boot push (SRSPendingSync) and reviewer mount push (useSRSyncSession) raced and killed each other (large payloads always; small ones intermittently — sync has likely been silently flaky). Both tracks now serialize through `enqueueSyncOp` (srsSync.ts). Note: a client-aborted POST can still complete server-side. Open follow-up: import preview "already tracked" count read 0 despite hydrated reps>0 cards — harmless (idempotent re-seed + LWW) but audit before more migrations.
- **Direction agreed (pending green-light):** Spencer will test out of the shipped A1 course; next big build = **M18+ A2→B1 arc** scoping/spec session (inputs: 568-word ledger, Duolingo S4 curated units, 22+13 gated grammar points, pedagogy-principles doc, conformance-guard range extension).

### Recent (2026-07-07 — Duolingo deep survey + Anki knowledge import)

- **Duolingo deep survey** (internal notes: `docs/research/duolingo-deep-survey-2026-07-07.md` — `docs/research/` + `research/` are gitignored, local-only): full JA course mapped via logged-in browsing + the client's own course-tree fetch — 1,030 units/8 sections, curated content ends at S4 (A2.1, 60 units); S5–S8 = 900 AI-formula mini-units with no new explicit grammar and no stories (the strategic opening: hand-authored A2→B1 depth). Feature delta since 6-30: they shipped web kana **tracing** (`challenge-characterTrace`), per-section **grammar-concept** pages, and a web Practice Hub (Words/listening Super-gated; mistakes replay free). Still absent on their web: AI features, JA typing input, romaji fade, free spaced review. Spencer's position: Section 5 via jump tests. Future-sight note saved: **Duolingo-position remediation map** (position → never-taught/taught-poorly → targeted module routing).
- **Anki → Lingo knowledge import shipped** (spec `docs/anki-import-spec-2026-07-07.md`; audit `docs/research/spencer-migration-audit-2026-07-07.md`, local-only): ships the scheduling-state import deferred by `flashcards-anki-scoping-2026-06-13.md`. Offline extractor `scripts/anki-export-known.py` (stdlib-only; iKnow/JouzuJuls/Migaku/Youtube-mined adapters; collection.anki2 + .apkg zips) → frozen known-items JSON v1 → in-app importer `src/features/flashcards/import/` (parse/match/seed/preview) + `importMatch` language-registry capability (JA match keys reuse the conjugation engine for inflected surface forms: 食べました→たべる) + dev-gated Settings card (preview → unlock toggle → report + unmatched download). Evidence-not-authority invariants: no-clobber (reps>0 skipped), never marks lessons complete, never moves course position; recognition seeded as review-state (stability=interval, overdue→due today), production enters as metered new; unlocks use the real server-push path. **Spencer's real collection dry-run**: 1,077 known items extracted → 394 atoms matched+seeded, 365 newly unlocked, 568 beyond-course preserved (N4-core content-demand signal for M18+). 203 files / 2,746 tests green, tsc clean, end-to-end screenshot-verified.

### Recent (2026-07-06 — grammar deck caught-up affordances + dev-sim unlock fix + question-quality/parity round)

- **Grammar deck playtest unblocked** (spec addendum in `docs/grammar-deck-v1-spec-2026-07-02.md` §v1.1): dev panel's "Mark complete (local)" now also unlocks the lessons' atoms locally (`devUnlockAtomsForLessons`, no server-push event) — completions alone never fed the atom-derived surfaces, so simulated profiles saw an empty grammar queue AND an empty course deck; new "Make all grammar due" dev button (`devForceAllGrammarDue`). Caught-up empty state now shows next-due timing (`nextGrammarDue`) + **Practice anyway** (`?practice=1`): widened not-due queue, zero Track B writes (learn-ahead parity), practice-only summary.
- **Question-quality + player-parity round** (same day, after Spencer's playtest; spec §v1.2; 463-step audit): pre-answer English gloss in the deck (`StepRenderer surface="grammarReview"` — semantic clozes were guessing games), honest instruction labels (`PARTICLE_OPTIONS` check → "Complete the sentence" on ~95 non-particle steps), number/counter/family points evicted from Track B (`NON_REVIEWABLE_CATEGORIES`, 13 points → Counters-Trainer material), harvest attribution window (`HARVEST_WINDOW_MODULES=2`; pools 463→355, kara-origin 22→3, imasu re-authored, 110 stale GATE_EXEMPTIONS ratcheted out), twin-stem dedup, full lesson-player chrome parity (X-out, LessonProgressBar+count, juice, focus, kbd hints, replay count, no breadcrumbs, no-wrap option tiles), compact rule-refresher variant in deck, "N more new points waiting"+Keep-going summary. **Romaji word-grouping app-wide for M3+** (`romajiLexicon.ts` + `WordToken` — "gakusei" as one ruby, cost-based segmentation, kana-phase/particles stay per-kana). TTS emitted for 5 new sentences (manifest-verified). 198 files / 2704 tests green, tsc clean, screenshot-verified.

### Recent (2026-07-02→05 — Conjugation Trainer v1 complete + flashcards/UI wave)

- **Conjugation Trainer v1→v1.4.1 SHIPPED** (`/practice/conjugation`, spec `docs/conjugation-trainer-v1-spec-2026-07-02.md`) — ink-tile hub of 6 formation types (te/ta/nai/masu-neg/v-tai/i-adj) covering 9 of the 22 pool-less conjugation points; Track B `production` graded once per completed drill. Combine mode: COMBO_MAP stacked chains (ません/なかった/たくなかった, i-adj past pair) are combo-exclusive; pair-impossible tiles grey out; hub "Combined forms" switch (default ON) replaced the silent proficiency gate. Shared `DrillQuestionCard`: glyph-chip form equation + build-stack application-order cue, word-class popover chips (godan/ichidan/irregular/い-adj), kanji + furigana exposure at M10+ (`writtenForms.ts` prefix-substitution), in-drill cheat-sheet peek = half credit (caps session at FSRS hard — still a success), measured-centered header. Rule-based `conjugationEngine.ts` distractors defeat stem/ending elimination.
- **Flashcards fixes** — modality-inversion fix (reviewer was crediting the wrong FSRS sub-state), one-step undo, 2-button history-aware grading defaults.
- **Lesson-shell UI overhaul** (2026-07-02 review round) — focused chrome, anchored CTA across all 21 step views, wrong-tile feedback defect fixed, numberless progress bar; before/afters at `docs/ui-review-2026-07-02/index.html`.
- **Overlay perf: backdrop-blur removed app-wide** — a full-viewport `backdrop-filter` re-evaluates on every scrolled/animated frame beneath it regardless of compositing (measured: modal-body scroll p95 33.4ms with blur, flat 16.7ms without; layer promotion changed nothing). Plain `bg-overlay` dim now on Modal/Sheet/ModalBase/ModalBackdrop/CommandPalette.
- Verified: tsc clean, **2670 tests green**; spacing and perf claims measured (getBoundingClientRect / rAF-delta), not eyeballed.

### Recent (2026-07-02 — SRS hardening + grammar review deck v1)

- **SRS sync bugs fixed** — (1) unlock-seeded cards no longer masquerade as deliberate resets in cross-device merge (explicit `manualResetAt` marker; seeded-local now LOSES to server-learned state); (2) placement re-runs no longer clobber existing card state (`getCardState` guard); (3) `performSync` marks only server-echoed ids synced (was whole-batch). `srsSync.test.ts` created (was zero coverage) + FSRS config/interval snapshot pin so a `ts-fsrs` weight change fails CI.
- **Track B grammar sync parity SHIPPED** — grammar cards ride the existing `/srs/sync` endpoint as `grammar:<pointId>` keys (`engine/grammarSync.ts`; server confirmed key-agnostic, zero server changes); read validation + quota-safe writes + "Start Over" grammar-store clear. Grammar progress now survives device switches.
- **Grammar review deck v1 SHIPPED** (`docs/grammar-deck-v1-spec-2026-07-02.md`) — step-based (NEVER flip cards) review session at `/practice/grammar/review`: one FSRS item per grammar point, per-point step pools (`lesson/data/grammarReviewPools.ts` — 37 points × 3 authored steps + harvested clozes), reps-rotated examples, reached-module session filter, lesson-parity grading (again→hard replay). Practice grammar hub has a live due-badge row. **Comprehensibility gate** machine-enforces "would they know this word yet?" on all authored steps; 90 new TTS clips manifest-verified.
- **Queue is pool-aware** — `buildGrammarReviewQueue` takes an optional `hasPool` predicate (session + hub badge pass `getGrammarPool(id).length > 0`), so the 22 pool-less conjugation points consume no due counts or new-card slots (final-review P1 fix; engine stays decoupled from lesson/data).
- **Deliberate residue / fast-follows:** 22 conjugation-formation points remain pool-less (the comprehensibility gate can't decompose conjugated stems — future conjugation-aware gate or Conjugation Trainer unblocks them); lesson-attach grammar tails (`withGrammarReviewTail`) deferred by design.
- Verified: tsc clean, **189 test files / 1459 tests green**; session + hub screenshotted at 800px and 680px heights; final whole-feature review = SHIP (P1 fixed).

### Recent (2026-07-01 — katakana rollout + M1-M7 audit fixes)

- **Katakana base-gojūon rollout SHIPPED** — one row per module M3→M12 (ア row = repurposed `ja-m3-1-1/1-2`; カ→ワ = `ja-m4-kata`…`ja-m12-kata` in `katakanaRows.ts`, each module's FIRST pathway node), authored M1-style via the script-parameterized `_consonantRowHelpers`. `kanaReviewTails` extended to katakana; glyph audio via katakana→hiragana twin fallback in `getTtsUrl`. ~23 loanword atoms re-attributed to rollout modules + 15 loanword sentences interleaved into M5-M12 grammar practice. Spec + status: `docs/katakana-rollout-romaji-fade-spec-2026-06-30.md` §9.
- **Romaji fade = two flat per-script cutoffs** — hiragana off at M10, katakana at M17 (`shared/settings/romajiAutoFlip.ts`), single global toggle + "Show romaji for today" escape hatch (auto-resets). Removed the script-blind alphabet-mastered kill AND the inert per-glyph mastery term — the cutoffs are the first romaji-off mechanism that actually fires.
- **D2 SHIPPED (vocab-only)** — content sub-lesson steps write Track A FSRS for prior-module atoms via the per-atom gate in `lesson/data/reviewTailSrs.ts`; no same-day grades for just-introduced words. Grammar stays review-lesson-gated pending a dedicated grammar flashcard deck (open task).
- **Grammar review gap fixed** — `grammarReviewIndex` now synthesizes review steps for non-particle grammar: M7 dict↔ます conjugation + M5 人-counters enter Track B review in `ja-mN-review` lessons.
- **M3-M7 story lessons wired** — the 5 orphaned story capstones (`ja-m3-9`, `ja-m{4-7}-story`) now sit before each module's review pair (M8+ pattern). One drift repaired (M7 story's なに introduced at point-of-use).
- **Dead code removed** — `buildModuleReview.ts` + its green-but-meaningless test + orphaned `jaReviewPools.ts`.
- **TTS emitter gaps fixed** — `emit-tts-deck.mjs` now scans `katakanaRows.ts` and captures keyed `target:` + positional `build()` sentences; ~740 clips backfilled for previously-silent shipped listening steps.
- Verified: tsc clean, **185 test files / 1391 tests green**; katakana lessons eyeballed in Playwright.

### Recent (2026-06-15 — SRS scheduling model + course-deck reviewer)

- **Reviewer plays the course deck** — the flashcard reviewer (`useSubscriptionQueue`) now injects the auto-subscribed client course deck (unlocked words), not just backend subscription decks. A course-only learner finally has a working reviewer. `flashcards.hideCourseDeck` opts super-users out.
- **D4 — seed-on-unlock + bug fix** — `buildSrsReviewLesson` made **pure** (it was seeding every unlocked atom due-today at build time → flooded the reviewer). Content-lesson completion now schedules atoms **due next-day** (`seedUnlockedAtomsDueNextDay`), never same-day.
- **D5 — reviewer shows every unlocked word** (no intake cap by default; `flashcards.maxNewCardsPerDay` to limit).
- **SRS scheduling model spec** — `docs/srs-scheduling-model-2026-06-15.md` (D1–D8), ralph-hardened; **supersedes** the intake decisions in `retention-architecture-design-2026-06-13.md`.
- **Remaining (Phase 2):** D3 review-lesson gating (needs hard-vs-soft call), D1 store unification, D7 FTUE. (D2 shipped 2026-07-01, vocab-only — see above.) Full detail: **`docs/archive/handoff-2026-06-15.md`**.
- 599 tests pass; verified live in Playwright.

### Recent (2026-05-25 final session)

- **Adaptive placement test** shipped — 2-stage, 75-item question bank, 100% threshold, SRS seeding, onboarding prompt for new JA users
- **Module test-out** enabled — same placement engine, single-module mode via `/ja/learn/test-out/:moduleId`
- **SRS write gate Sev-1 fixed** — M8-M27 review lessons now correctly write FSRS state (regex was `[3-7]`, now `\d+`)
- **Accessibility pass** — step focus management, skip-to-content link, PlacementPrompt dialog a11y, WCAG AA contrast fixes (dark accent, sepia/light textMuted)
- **Dark: token migration** — ~465 hard-coded `dark:` Tailwind classes → CSS variable tokens across 58 files
- **Mock → real data** — flashcard sparkline + retention stats wired to actual SRS store
- **Module revisiting** — completed modules show their pathway (no longer locked out)
- **897/897 tests pass**

---

## Launch-ready (verified in code)

### Auth & routing

- [x] Auth0 (`VITE_AUTH0_*`), `RequireAuth` on `/:lang/*`
- [x] `/` → logged-in `/home`, else `/landing`
- [x] Public: `/privacy`, `/terms`, `/about`, `/login`
- [x] Leaderboard route gated by `isLeaderboardEnabled(flags)` (default off)

### Legal & privacy

- [x] Privacy, Terms, About pages; `CookieConsent`; advertising consent before AdSense
- [x] Account deletion in Settings; `DELETE /api/core/v1/users/me`
- [x] `AccountPrivacySection` — cookie controls

### Learn & practice

- [x] Learn page, lesson flow (multiple step types)
- [x] **Practice hub** — `/:lang/practice` index → `PracticePage` (not only flashcards)
- [x] Flashcards: hub, review (`FlashcardTester`), card/deck managers
- [x] Study options (settings + deck manager); review URL filters / scope shortcuts
- [x] SRS: FSRS-6 (recognition/production modality split), localStorage, sync to API (`srsSync`, `SrsApi`)
- [x] **Lesson progress sync:** per-step buffer, draft attempts (`draft:{lessonId}`), batch `POST /progress/lessons/batch`, SyncManager “Lessons” row (`useLessonSyncSource`, `LessonProgressHydrate`)
- [x] **Start over:** bottom of Learn course map; wipes local + `DELETE /progress/me` + `DELETE /srs/all` when signed in
- [x] **Dev progress inspector:** `</>` JSON overlay (server `GET /progress/me` + local cache) when dev unlock is on
- [x] Particles, alphabet (+ hub + lesson), kanji/components/videos pages (depth varies)

### Community & API

- [x] `ContentBrowserPage` — decks API, subscribe
- [x] `FlashcardsPage` — subscribed + course decks
- [x] `list_owned_manifests` on backend (efficient author listing)
- [x] Contribute / forum / admin / studio routes exist — **disable via flags** for launch

### Ads & funding (code only)

- [x] `features/ads/` — `AdSlot`, `CollapsibleAdBanner`, consent gating
- [x] Global banner: logged-in app routes, not marketing URLs
- [x] `GET /api/core/v1/finance/transparency` + `FundingMeter` (manual/estimated %)
- [ ] Live AdSense fills — needs Google approval + env
- [ ] Live % from AdSense/Stripe — needs sync jobs

### Backend (lingo-core)

- [x] Decks, users/subscriptions, SRS, **progress** (`/api/core/v1/progress/*`), community routers
- [x] Dev logging: root INFO; `lingo.*` DEBUG when `DEBUG=true`; `aiosqlite` at WARNING
- [x] Finance transparency router; security headers middleware
- [ ] Rate limiting — not in app yet
- [ ] Stripe / AdSense Management API — not wired

---

## Not launch-critical (stubs / backlog)

| Area | State | Notes |
|------|--------|--------|
| **VocabPage** | Stub | `tasks/vocab-page.md` |
| **Grammar** | Redirect / practice grammar partial | `tasks/grammar-page.md` |
| **StoryDetailPage** | Layout; placeholder content | `tasks/story-content.md` |
| **Leaderboard** | UI + mock data | Flag off |
| **Forum / contribute** | Implemented but immature | Flags off |
| **Content volume** | ~5 cards / language stubs | `korean-content`, `japanese-content` tasks |
| **Funding %** | API + env override | Not live Google/Stripe data |
| **User settings API** | Partial / local-first | `tasks/backend-user-api.md` |
| **Progress API** | Partial | Lesson batch + `/progress/me`; home uses `useProgressMe` / `useUserStats` |
| **Home (returning)** | Restructured | `RestructuredHome` grid; see [handoff-2026-05-24-home-sync-ux.md](./archive/handoff-2026-05-24-home-sync-ux.md) |
| **Sync UI** | Shipped | Cloud trigger + popover; lessons + SRS sources in `SyncManager` |
| **Placement test** | Shipped | 2-stage adaptive, 75 items, onboarding prompt; `src/features/placement/` |
| **Module test-out** | Shipped | Same engine, single-module; `/ja/learn/test-out/:moduleId` |
| **Social (UI)** | Mock unified | `useSocial()` + `mockSocial.ts`; `/:lang/social` preview page |
| **Quests API** | Shipped 2026-06-13 (`lingo-core/app/quests/` — state in user-settings blob, progress advances via an **async event pipeline**: the lesson batch handler publishes `lesson_completed`/`xp_awarded`, consumed by the **lingo-async** service, which calls back `POST /quests/_internal/{id}/progress`. NOT synchronous — don't add inline quest writes to the progress handler.) | [quests-tracking-design](./superpowers/specs/2026-05-24-quests-tracking-design.md) |
| **Auth 401 refresh** | Planned | `tasks/auth-session-strategy.md` |
| **ja.json UI** | Not started | `LOCALIZATION.md` |
| **`.env.example` in lingo/** | Present (added 2026-06-23) | documents required env vars |

---

## Routes (abbreviated)

```
/                         → RootRoute (home or landing)
/landing, /home, /login, /logout
/privacy, /terms, /about
/:lang/*                  → RequireAuth
  learn, learn/lessons/:id
  practice                → PracticePage (index)
  practice/flashcards, …/review, …/cards, …/decks
  practice/stories, particles, alphabet, kanji, …
  vocab, grammar, speech-tune
  community/explore, external-content, contribute/*, discuss/*, leaderboard
  studio/decks/*
/admin/*                  → admin (operators)
```

Full tree: `src/App.tsx`.

---

## Feature flags (launch defaults)

See `public/feature-flags.json` — explore + deck browse **on**; leaderboard, discuss, contribute, stories, videos **off**.

---

## Task docs vs reality

| Task | Doc status | Reality (2026-05) |
|------|------------|---------------------|
| practice-hub | stub | **Routed** — `PracticePage` is practice index |
| homepage-ux | open in old index | **Done** — landing hero CTAs aligned; returning home restructured |
| srs-engine | — | **Done** |
| community-deck-preview | — | **Done** |
| community-content-wiring | — | **Done** for explore + flashcards |
| funding meter | “plug real %” | **Wired to API**; live revenue is phase 2 |
| legal / ads framework | — | **Done in code**; approval/env later |

---

## Planned epics (not built)

See [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md): admin v2, moderation/staging decks, blocking, progress API (content + rewards), CI/CD, home polish, product name, caching evaluation. **MVP: no billing.**

## Recommended reading order

1. [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) — 2-week plan
2. [MVP_PAGES_PLAN.md](./MVP_PAGES_PLAN.md) — page-by-page UI scope for launch
3. [ECONOMICS.md](./ECONOMICS.md) — pricing tiers, cost math, sustainability targets
4. [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) — ideas & epics (incl. lingots, cosmetics, voting, search, infra)
5. [MVP_PRODUCTION_READINESS.md](./MVP_PRODUCTION_READINESS.md) — checklists
6. [TODO.md](./TODO.md) — checklist items
7. [ALPHABET_COURSE_INTEGRATION_PLAN.md](./ALPHABET_COURSE_INTEGRATION_PLAN.md) — wiring alphabet practice into the course track + concept rollups
8. [tasks/README.md](./tasks/README.md) — individual specs  
