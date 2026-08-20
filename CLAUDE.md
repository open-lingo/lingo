# CLAUDE.md — `lingo` (Open Lingo web app)

**Status:** LIVE · **Last-verified:** 2026-07-29

Vite + React 19 + TypeScript + Tailwind language-learning SPA. Talks to `lingo-core` (FastAPI, `../lingo-core/`, separate git) over HTTPS with Auth0 RS256 JWT.

## Orientation

- **The N5 course is FULLY AUTHORED and live** (measured 2026-07-29: `mockCourse.ts` carries
  m1–m30; its own comment at the m29 tile says "There are no comingSoon placeholders left in the
  N5 map"). The live JA learn map is the draft-4 spine (`shared/domain/mockCourse.ts` ←
  `features/lesson/dev/spinePlan.ts`): m1/m2 kana rows + **m3–m29 authored `ja-m*-neo-*` lessons,
  compiled from the YAML IR** (`languages/ja/curriculum/ir/mN.ir.yaml` →
  `node scripts/compile-ir.mjs mN` — the IR is the authoring front door; never hand-edit compiled
  output). m30 opens the N4 tier; the remaining `comingSoon` tiles are late-N4 modules and the
  side quests. **The old course is ARCHIVED**
  (`features/languages/ja/curriculum/_archive/`, 2026-07-26) — excluded from tsconfig and the test
  run, imported by nothing. It is a PLANNING reference only; no function may reference it, and
  authoring agents never see it. See `_archive/README.md` + `docs/authoring-workflow.md`.
  (This bullet previously claimed m8–m29 were empty placeholders — false since the IR wave;
  project-health-audit-2026-07-29.md finding #1.)
- **Research map — read FIRST:** `docs/INDEX.md` — categorized status-tagged map of all docs (which are authoritative vs stale), question→location table, landmines. Maintained daily by the session-start index job. Don't grep docs/ blind.
- **Source of truth for project state:** `docs/PROJECT_STATE.md` is a point-in-time SNAPSHOT and is currently **STALE** (last real refresh 2026-07-16 — it predates the script-ladder wave and the dict-form-first JA rewrite), so do NOT treat it as authoritative on register, kanji, or the JA rewrite. Current sources of truth, in order: `docs/authoring-invariants-pinned.md` (the pinned JA law), this CLAUDE.md, `docs/retrospective-2026-07-17.md`, and `docs/lesson-authoring-guide.md`. PROJECT_STATE is still useful for the launch/MVP feature-flag picture; refresh it before trusting it elsewhere. Session handoffs live at `docs/handoff-*.md`.
- **Architecture audit:** `docs/ARCHITECTURE_REVIEW_2026-06-14.md` — full-system review; read before structural changes. (A frontend-only predecessor was removed 2026-06-30; it had reached wrong conclusions like "SRS is SM-2".)
- **Real-user feedback log:** `docs/user-feedback/` — verbatim tester observations + Spencer's product notes. Higher product-signal than synthesized audits; read before UX-touching changes.
- **Lesson authoring patterns + per-step rubric:** `docs/lesson-authoring-guide.md`. §13 is the retrospective with the locked M8+ template, image-MCQ-as-intro, grading=review-only, and the particle-tile separation gotcha. Read before any JA lesson content change. **Linguistic framing rules:** `docs/pedagogy-principles-2026-07-05.md` (が/は model, helpers-not-conjugation, structure-true glosses) — binding for what explanation content may claim; bundle into authoring-agent dispatches.
- **Curriculum vs research:** `docs/curriculum-audit-vs-research-2026-05-21.md` — the rubric audits grade against.

## Stack

React 19, React Router v7, TS 5.6 (strict), Vite 6, Tailwind 3 (`class` theme strategy), TanStack Query 5, Auth0 (`@auth0/auth0-react`), i18next, Vitest (happy-dom) + Playwright. Path alias: `@/ → src/`. No ESLint/Prettier configured.

## Source layout

```
src/
├── App.tsx                     # createBrowserRouter + lazy routes
├── routes/                     # root shell + auth wrappers + language context
├── features/<domain>/          # vertical slices — keep components local until a 2nd domain consumes
│   ├── lesson/                 # step views, LessonPage (⚠️ god file — split before lesson-flow changes)
│   │   └── data/               # builders, mockLessons registry, conformance tests
│   └── languages/ja/           # JA curriculum: curriculum/m*.ts, grammarHelpers.ts, courseAtoms.ts
└── shared/                     # api/ auth/ components/ contexts/ i18n/ theme/ language/ …
```

Course map: `src/shared/domain/mockCourse.ts`. Language registry: `src/shared/language/` (`ja:`-prefixed atom ids, ADR-005).

## Conventions

- **API calls:** extend `ApiClient` in `shared/api/*.ts`, singleton per domain.
- **Server state:** TanStack Query only; set explicit `staleTime` per query.
- **Mutations:** dedicated hooks (`useCreateDeck` …) wrapping `useMutation` + `invalidateQueries`.
- **Icons:** `lucide-react` via `src/shared/iconRegistry.ts`. **i18n:** `t("ns.key", "fallback")`; locales in `src/shared/i18n/locales/`. **Routes:** lazy via `lazyRetry`.
- Shared primitives live in `shared/components/ui/` (Modal, CenteredLoader, EmptyState, Button, …) — extend these, don't fork variants.
- Files past ~400 LOC are a smell — extract under `features/<domain>/`.

## SRS engine (invariants)

`features/flashcards/engine/` — FSRS-6 via `ts-fsrs`. **Hard is a success** (slower stability growth than Good). Target retention 0.90. Local-first (localStorage), delta-merge sync to `lingo-core` via `SrsApi` — don't bypass dirty-card detection. **All sync POSTs must go through `enqueueSyncOp`** (`srsSync.ts`, 2026-07-07): the ApiClient's `tag:"srs:sync"` dedup ABORTS the previous in-flight request, so concurrent syncs (boot push + reviewer mount push) silently killed each other — never call `srs.sync` directly from a new surface; queue it. A client-aborted POST may still complete server-side; server-side LWW on `lastReviewedAt` is the real clobber-guard. **Both tracks sync** (2026-07-01): Track B grammar rides the same endpoint with `grammar:<pointId>`-namespaced keys (`engine/grammarSync.ts`; hydration partitions by prefix — never let `grammar:*` keys leak into the vocab store). A deliberate card-manager reset stamps `manualResetAt`; only marked resets beat server state in merge (unlock-seeded cards lose to server-learned — don't "simplify" that away). Each card carries two sub-states (`recognition` + `production`); `reviewCard`/`gradeFromLesson` update one modality at a time; `isDue` is true if either is due. Backend schema mirrors this shape (`lingo-core/app/srs/schemas.py`).

**Spencer's invariants — do not relax:**
- **SRS writes — six surfaces (current, post-2026-07-02):** (1) **seed-on-unlock** (D4) — completing a CONTENT lesson schedules its newly-unlocked atoms into FSRS **due next-day**, never same-day (`lesson/data/seedSchedule.ts` `seedUnlockedAtomsDueNextDay`, called from `LessonPage` after `unlockLessonAtoms`, content lessons only); (2) **review lessons** (live shape `ja-mN-neo-review-1..3`; since 2026-07-30 (B069 phase 1) each gets a render-time DYNAMIC PREFIX — switchover beat + due atoms + due grammar + new-card seats, cap 10, due-first — via `lesson/data/dynamicReviewPrefix.ts` in `getMockLessonContent`; the old `ja-mN-review-1/2` shape still routes to the full dynamic builder, deep-link/QA only) grade per step, gated by `shouldWriteSrs(step)` (`lesson/data/_stepPredicates.ts`) + the lesson-id check in `LessonPage.handleStepComplete`; (3) the **flashcard reviewer** (`FlashcardTester` → `reviewCard` → `setCardState`); (4) **D2 (shipped 2026-07-01, vocab-only)** — content sub-lesson steps write Track A for PRIOR-module atoms only, per the `shouldWriteContentReviewAtom` gate in `lesson/data/reviewTailSrs.ts` (atom `fromModule` strictly earlier than the lesson's module AND not introduced by this lesson/cluster — never same-day grades for just-introduced words). (5) the **grammar review session** (`/practice/grammar/review`, `features/practice/grammar/useGrammarReviewSession.ts` → `reviewGrammarPoint`) and (6) the **Conjugation Trainer** (`/practice/conjugation`, `features/practice/conjugation/`) — per-type drill sessions grade Track B `production` ONCE per completed drill (`gradeTrainerSession`) for the 9 conjugation-formation points it covers (te/ta/nai, masu-negatives, v-tai, i-adj forms; spec `docs/conjugation-trainer-v1-spec-2026-07-02.md`). Those 9 stay in `POOL_GAP_EXEMPTIONS` **by design** — the trainer IS their review surface (13 te-compound/aux points remain uncovered, v2). Type unlocks derive from each grammar point's module; drill pools (`conjugationTables.ts`) respect the reached module; the hub's "Free drill" writes NO SRS. Track B writes happen ONLY in the grammar review session, review lessons, and trainer drills; grammar NEVER renders as flip cards (Spencer 2026-07-02, flip cards are vocab-only). The deck's `?practice=1` sessions and the caught-up "Practice anyway" flow write NOTHING (learn-ahead parity). **Number/counter-category points never activate for Track B** (`NON_REVIEWABLE_CATEGORIES` in `grammarSrs.ts` — "which one is number 3" is vocab/Counters-Trainer material, Spencer 2026-07-06; family-register rides out on its `number` categorization). One scheduled item per grammar point; each review picks from a per-point step pool (`lesson/data/grammarReviewPools.ts` authored + `grammarReviewIndex` harvested — harvested clozes attribute only within `[point.module, point.module+2]` (`HARVEST_WINDOW_MODULES`), else polysemous tokens (から/に/が/と/います) vacuum other points' sentences — reps-rotated, session-filtered to the learner's reached modules). Deck rendering: `StepRenderer surface="grammarReview"` shows cloze English pre-answer + compact rule prefaces — don't strip that flag; standalone semantic clozes are guessing games without it (2026-07-06 audit). **Authored pool steps are comprehensibility-gated** (`grammarReviewPools.test.ts`): every content word must decompose into atoms with `fromModule` ≤ the point's module — the machine form of "would they know this word yet?"; harvested debt is frozen in `GATE_EXEMPTIONS` (ratcheted both directions). Grading parity with lessons: main pass wrong→again / clean→good; the one replay pass writes hard on recovery. ⚠️ `buildSrsReviewLesson` is now **PURE** — it never writes state at build time (that side-effect seeded *every* unlocked atom due-today on any course-deck build, via the sentence-miner). ⚠️ **"kana M1/M2 has no SRS" = the kana _glyphs_ only** (single-kana-no-emoji → alphabet trainer, excluded by `isSrsEligibleAtom`); M1/M2 vocab _words_ (あい/いえ/あおい …) **ARE** SRS-eligible. The flashcard reviewer now **plays the course deck** — all unlocked words, **no intake cap by default** (D5; `flashcards.maxNewCardsPerDay` to limit, `flashcards.hideCourseDeck` to opt out). Ladder: **unlocked → seeded due-next-day → due**. Two tracks: **Track A** vocab (`open-lingo-srs:v2`) + **Track B** grammar (`open-lingo-srs-grammar:v1`, `engine/grammarSrs.ts`); review lessons advance both via `exercisedAtoms` + `exercisedGrammar`. **Model + roadmap: `docs/srs-scheduling-model-2026-06-15.md` (D2 shipped 2026-07-01; D3/D1/D7 open). Grammar deck spec: `docs/grammar-deck-v1-spec-2026-07-02.md` (lesson-attach tails = deliberate fast-follow, NOT shipped).** Supersedes the intake decisions in `docs/retention-architecture-design-2026-06-13.md`.
- Every atom must be introduced before any SRS review exercises it — enforced by `languages/ja/__tests__/moduleConformance.test.ts`.
- Adaptive per-atom step selection happens on the **flashcards surface**, NOT inside lessons. Lessons stay statically authored — moving review-tail construction into lesson render time would unwind the entire authored curriculum. (2026-05-19 feasibility audit.)

Backlog phases: vocab-graduation receiver (`lingo:vocab-graduated` event → unlock map), render-time review-pool picker on the flashcards surface, kanji unlock map + reveal step (curriculum-driven unlocks, not memory-driven). Kanji recognition is LIVE from M8 (`KANJI_RECOGNITION_MODULE=8`, furigana window unlock+2), applied as render-time surface substitution by `ja/secondScript/applyKanjiSurfaces.ts` — NOT the deferred/`KANJI_START_MODULE=99` state the older kanji specs describe. The `kanji_reading` step (kanji→kana recall) shipped 2026-07-16; sentence + MCQ-option kanji render homograph-safely. (The "deferred 2026-06-12" note below is superseded.)

## Gamification (cross-repo invariants)

- **XP is server-authoritative; the client mirrors the defaults.** The server's live source is `XpEconomyConfig` (`lingo-core/app/platform_settings/schemas.py`, applied in `app/progress/router.py`) — admin-tunable; `app/progress/xp.py` holds only legacy defaults now. `src/features/progress/xpRules.ts` mirrors those defaults for the pre-sync estimate (base 10, perfect +5, test/recap +10 via lesson-id suffix, 500/level linear). Keep it in sync with the `XpEconomyConfig` defaults or the lesson-complete estimate diverges from what the server awards. `lesson.xpReward` is cosmetic.
- **Quests**: backend at `lingo-core/app/quests/`; per-user state in the user-settings blob (like `shop`); progress advances via an **async event pipeline** — the lesson batch handler publishes `lesson_completed` / `xp_awarded`, consumed by the **lingo-async** service, which calls back `POST /quests/_internal/{id}/progress`. Not synchronous in the request, so don't add inline quest writes to the progress handler.
- Lesson juice (combo/sfx) call sites: `features/lesson/juice.ts` via `LessonPage.handleStepComplete`; row tests run their own per-item juice in `TestRunner`.

## JA curriculum authoring

**Id landmine:** m2's row lessons carry `ja-m1-*` ids (g/z/d/b/p/yoon — historical); never infer module membership from the id prefix — use the course map. Content lives in `src/features/languages/ja/curriculum/m*.ts`; helpers in `languages/ja/grammarHelpers.ts`; atom registry in `languages/ja/courseAtoms.ts`. All kana rows (m1/m2) are hand-authored files (`m1-*.ts`, `m2-*.ts`) that override the generated builder. **Katakana** (re-homed by the IR wave; verified against the live map 2026-07-29): TWO rows per module m7–m11 — `ja-m7-neo-kata-a/ka` … `ja-m11-neo-kata-ra/wa`, built as `NEO_KATAKANA_ROW_LESSONS` in `katakanaRows.ts` (M1-style factories from the script-parameterized `_consonantRowHelpers.ts`) and SPLICED into each neo module's lesson list (see `m7-neo.ts` — they occupy spread teaching slots, not compiled IR beats; prior-row tails appended by `kanaReviewTails.ts`). The old one-row-per-module `ja-m4-kata`…`ja-m12-kata` lessons (and the `ja-m3-1-1/1-2` ア row in the archived `m3-v2.ts`) are RETIRED — the kata ids stay registered in `LESSONS` but are on no map tile, and `KATAKANA_ROW_SCHEDULE.lessonId`/`moduleIndex` are old-course fields (`neoModuleIndex` is the live one). Romaji auto-off is per-script: **hiragana at M7**, katakana at M17, build-tile fade at M5 (`shared/settings/romajiAutoFlip.ts` — read the exported constants, don't trust prose; hiragana moved M10→M7 in the 2026-07-16 script-ladder wave so it retires one module before kanji recognition starts at M8). Gate: `parseModuleIndex` must accept the bare `moduleId` ("m29"), round-trip-tested in `moduleConformance.test.ts`. **Romaji ruby groups per WORD for M3+ learners** (`languages/ja/romajiLexicon.ts`: authored word romaji + cost-based segmentation → `WordToken` in `AnnotatedText`; M1–M2 and particles stay per-kana deliberately — never join per-glyph romaji, がっこう must read "gakkou").

Machine-enforced rules (tests fail if violated):
- `moduleConformance.test.ts` — atoms ↔ vocab map ↔ grammar JSON consistency; intro-before-review.
- **Atom `introducedByLessonId` landmine:** a static entry SUPPRESSES the module-fallback unlock path in `lessonAtomIndex.ts`. Before pointing an atom at a new lesson, check no other lesson relied on the fallback to unlock it (2026-07-01: re-attribution nearly orphaned ばんごはん this way).
- `lesson/data/kanaWordIntroOrder.test.ts` — a learner is never asked to **spell** a word (`listening_build`) before an active introduction (correct-option image MCQ, audio-meaning primer, teach, or context build). Distractor exposure doesn't count.
- Import-time assertions in curriculum files (`assertNoSameAnswerCluster`, blocklist checks).

Render-level guarantees (don't re-implement in data): tile banks are seeded-shuffled per step id in both build views; kana intro sub-lessons get a 2-step prior-row review tail appended centrally (`lesson/data/kanaReviewTails.ts`).

Per-step sentence exposure ≤3; new sentence per grammar point (don't recycle one sentence through 4 step types); review-particle cloze ≤25% of a lesson.

**Vocab card art:** every authored word needs an image. Canonical emoji per word: `docs/n5-vocab-emoji-reference-2026-05-18.md`; authoring workflow + blocklist rubric: `docs/emoji-blocked-words-2026-05-18.md`. Runtime: `notoEmojiUrl` / `lingoArtUrl` in `src/shared/assets/notoEmoji.ts`; blocklist `WORD_IMAGE_MCQ_BLOCKLIST` in `languages/ja/grammarHelpers.ts`. **When you author a new emoji, vendor its SVG into `src/pub/noto-emoji/svg/`** (the 2026-06 wave authored 224 without vendoring — broken images). `EmojiArt` falls back to the raw glyph if a file is missing, but vendor anyway.

**Placement test** (`src/features/placement/`): 2-stage adaptive, 3/3 per-module threshold, seeds SRS atoms as `learning`/due-today; same engine powers per-module test-out.

**TTS:** audio is **not in this repo**. `scripts/emit-tts-deck.mjs` scans `languages/ja/curriculum/` → deck JSON in `lingo-data/data/test_decks/` → `cd ../lingo-data && python -m pipeline.tts.generate --provider edge` → mp3s in `lingo-data/out/tts`, published to CloudFront by `pipeline.tts.emit_manifest` + `pipeline.tts.upload` (`https://openlingoapp.com/tts/v1/<lang>/<hash16>.mp3`). The app ships no path table: `getTtsUrl()` derives the path as sha256(`"<lang>:<text>"`)[:16] and only checks existence against the schema-2 hash sets in `src/shared/tts/manifests/<lang>.json` (see `src/shared/tts/manifest.ts`; ~5% of entries that can't derive are carried as `overrides`). Runtime lookup falls back across ±`。` variants (and single katakana glyphs fall back to their hiragana twin's clip). Run the emit + generate + publish chain after authoring new sentences. ⚠️ **The emitter is regex-based over source text — a new factory shape or file name it doesn't match is skipped SILENTLY, and "wrote=0 cached_skipped=N" looks like success.** After authoring, verify your new phrases actually landed — `npm run module-gate -- mN` does exactly this (stage 2 hashes every deck card against the ja manifest). (2026-07-01: keyed `target:`/positional `build()` gaps had shipped hundreds of silent listening steps; `katakanaRows.ts` wasn't in the file glob.) **Fresh machine / empty `lingo-data/out/tts`?** `generate.py` skips only what exists LOCALLY, so an empty out-dir means re-synthesizing the entire corpus — instead restore it from this repo's history: `git archive <pre-CDN-migration sha, parent of a4f46798> src/pub/tts | tar -x --strip-components=2 -C ../lingo-data/out/` (verified 2026-07-30: dry-run then reports 0 to generate; hash16 filenames carry over unchanged). Upload needs AWS creds only Trevor has; after `emit_manifest`, DIFF the emitted `out/tts/manifest/<lang>.json` against `src/shared/tts/manifests/` before copying — added hashes should be exactly your new sentences, and removals should be zero.

## Lesson UI stability rules (2026-06-13)

- Option buttons and the Check/Continue CTA must NOT move when an answer is submitted. Each step view keeps banner + CTA in one bottom-anchored block; celebration toasts render above the CTA, never overlaid on options. Verify layout work with before/after `getBoundingClientRect` measurements, not eyeballs.
- The lesson shell is FIXED-height (`LessonShell.tsx:45` — `h-[calc(100dvh-1.5rem-var(--cookie-consent-height,0px))]`; this line said `100dvh-6.5rem` until 2026-08-09, which has not been the value for some time); the step container is the only scroll area — the window never scrolls during a lesson. Long reading content (grammar cards) scrolls inside it. The stage reserves a bottom dead zone, `--stage-tail` (`src/index.css`, 10cqh; 5cqh at ≤700px viewport height — B098, Spencer approved the short-screen halving 2026-08-20) — a step view that computes its own height budget must subtract it. Step types that still overflow this scroller on a 375×667 phone — re-measured 2026-08-20 after the halving, reproduce with `node scripts/measure-step-overflow.mjs`: match_pairs 222px, dialogue_listen 100px, speaking 79px, grammar_rule 368px (scrolls by design; the tail doesn't reach its sub-scroller). kanji_reading now fits (0px). grammar_rule scrolls by design. **375×667 is NOT a legacy viewport** — only android-small 360×640 is, so none of these fall under the advisory stage-fit exemption. Also note the instrument: the mobile gate's route matrix carries three lesson routes, all ja-m4-neo-1, covering two step types — it cannot see any of the above. B091 (conjugation_transform, structural) and B092.
- **Don't size step content with dvh arithmetic** — the chrome around it is fixed-px, so dvh budgets overflow short windows (match-step postmortem). Inside the fixed shell, size from the container instead: `flex-1` + `grid-template-rows: repeat(n, minmax(min-content, 1fr))`, minimal static padding/gaps so the min-content floor stays low. The MCQ grids still carry legacy dvh clamps; migrate them to container sizing when touched.
- Build-step trays are pre-sized by an invisible ghost of the full answer. Match steps permanently reserve the Continue slot (`min-h-14`) so finishing never reflows.
- **Verify the step type you changed, at ≤700px height too.** `?step=N` on any lesson URL jumps straight to step index N (plus `?trace-gate=0` to bypass the trace skip gate, `?tray=slots|pill` to force a word-build tray variant) — no excuse for a step type being unreachable by the layout driver. Measure `scrollHeight - clientHeight` of the step container, not vibes.

## Delivery / service worker (2026-08-15)

- **Perf backlog with measurements:** `docs/perf-followups-2026-08-15.md` — read before further load-time work. Top item: the lingo-infra Lambda warmer is written but NOT terraform-applied.
- **Boot API batching:** the boot request wave is answered from one `GET /boot` (`shared/api/bootCache.ts`, backend `lingo-core/app/boot/`). Adding a new boot-time fetch? Add it to `BootResponse` + `SECTION_BY_REQUEST` or it fans out again. Rails: single-use per path, one batch per acting user, query strings never served.
- **New TTS audio must ship WITH its manifest:** stage new mp3s in `tts-publish/` (see its README) — the deploy uploads them to `tts/v1/`. A manifest hash without an uploaded object serves the SPA shell as `text/html` and breaks playback halfway (M31, 2026-08-15).

- **Web prod builds ship a service worker** (vite-plugin-pwa `generateSW`, config in `vite.config.ts`; registered from `main.tsx`, web-only — never on native). It precaches the open→lesson happy path (~7 MB, 38 entries) and runtime-caches other hashed assets + `/tts/v1/*` clips, so returning visits load from disk. Consequences: **a deploy reaches SW-installed clients one navigation late** (the SW revalidates on navigation, `autoUpdate` swaps caches in the background — the old "no-cache index.html = instant" contract now only holds for first-time/SW-less visitors), and **`sw.js` + `manifest.webmanifest` must stay `no-cache` in deploy.yml's S3 sync** — an immutable-cached `sw.js` pins clients to a build forever.
- **TTS manifests are lazy chunks** (`shared/tts/manifest.ts`): all kicked off at module init, filled IN PLACE (stable doc identity keeps module-scope `getTtsManifest` snapshots live), and the lesson route factory awaits `preloadTtsManifests()`. Sync `resolveTtsPath` callers see "no recording" until loaded. Tests stay synchronous because `src/test/setup.ts` awaits the preload before any test file imports — don't remove that await.

## Testing & dev loop

```bash
npm run dev            # vite, strict port 5173 (API base: VITE_API_BASE_URL, default :8000)
npm run test:run       # vitest CI
npm run test:e2e:auth  # one-time headed auth → .auth/user.json (must navigate to /login, not /)
node scripts/shot.mjs <path> [w] [h] [--full] [--lang=ja]   # screenshot → /tmp/shot.png
```

**White screen + ERR_BLOCKED_BY_CLIENT in dev = ad blocker** killing `/src/features/ads/` module URLs (statically imported in main.tsx) — allowlist localhost. Add a happy-path test for any new feature. The `screenshot` skill / `shot.mjs` auto-loads auth state and injects `learningLanguageId`.

**Mobile UI — method is `docs/mobile-ui-testing-2026-08-09.md`, and `tests/mobile/` is the only layout authority.** `npx playwright test --project=mobile` (kill anything left on :5273/:5274 first — a stale gate server produces failures that read like app bugs). Three rules that are not obvious and cost real time when broken:
- **Every viewport carries `insets`.** `_seed.ts` pushes them in over CDP because Chromium reports `env(safe-area-inset-*)` as **0**, which made the `*-safe` utilities collapse to their fallbacks and left the gate structurally unable to see the Dynamic Island overlap that shipped (2026-08-08). The call is strict and round-trip-verified on purpose: a silently-failing override is worse than none.
- **Tap targets are WCAG 2.2 SC 2.5.8 — 24×24 CSS px WITH the spacing exception**, not 44pt. 44 is Apple's recommendation / Level AAA; measuring against it produced 114 "offenders" where the AA criterion finds none.
- **State pixel floors in `px`, not `rem`.** `--font-base` drops to 15px at ≤820px-tall desktop, so a rem-sized 24px floor measures 23px exactly where it matters.

Don't drive the simulator for layout: `xcrun simctl` has no tap verb and XCUITest cannot read a WKWebView's DOM. The device is for WebKit rendering, Dynamic Type, and the install path — see §6 of that doc.

## Don't

- **Don't add MUI** (not installed). Tailwind-first; new primitives go in `shared/components/ui/`.
- **Don't add legacy redirects or backwards-compat shims** when moving routes/files.
- **Don't add AI attribution to commits.**
- **Don't trust `docs/tasks/*.md` as current state** — `PROJECT_STATE.md` wins.
