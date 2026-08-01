# Open Lingo — project state

**Status:** LIVE · **Last-verified:** 2026-07-31

Verified against source in `lingo/`. **Purpose:** accurate state snapshot for humans and agents. Module-map source of truth is code (`src/shared/domain/mockCourse.ts`); the daily-maintained research map is [`INDEX.md`](./INDEX.md). Doc-precedence when docs disagree: `authoring-invariants-pinned.md` → repo-root `CLAUDE.md` → `retrospective-2026-07-17.md` → `lesson-authoring-guide.md` §13.

---

## Executive summary

Open Lingo is a language-learning SPA (**lingo**, Vite + React 19 + TS + Tailwind) talking to **lingo-core** (FastAPI) over Auth0 RS256 JWT. Core loop: **learn → lessons → flashcards (SRS) → practice → settings**.

**Three languages are live and learner-facing**, each with a transit-map learn home, placement/test-out, and a full skill-practice surface:

- **Japanese (ja)** — N5 spine **fully authored, m1–m29, zero coming-soon modules on the map**. N4 tier begins at **m30** (off-map, deep-link only). This is the flagship course.
- **Korean (ko)** — **m1–m27 authored and live** (Hangul foundation → N5→N4 grammar spine).
- **Spanish (es)** — full **A1 course, m1–m16 authored and live**.

**Social + community ship dark for the MVP** (`social.enabled` / `community.enabled` both false — code intact, flip `public/feature-flags.json` to restore; account registration at `/u/<name>?register=1` is exempt). Legal pages, landing/auth split, ads framework, and the funding-meter API exist; **live revenue is post-launch**.

---

## Languages & courses

| Lang | Modules live | Highest tier | Authoring source | Notes |
|------|--------------|--------------|------------------|-------|
| **ja** | m1–m29 (N5), all `available` | N5 capstone m29; N4 = m30 (off-map) | m1–m2 kana engine (generated); m3/m4/m5 hand-authored TS (`*-neo-*`); **m6–m29 IR-compiled** (`src/features/languages/ja/curriculum/ir/m{6..29}.ir.yaml`); m30 hand-authored TS | Spine = `draft-4 (2026-07-26)`. Old `m6.ts…m28.ts` archived to `curriculum/_archive/`. Resolve modules via the course map, never filename. |
| **ko** | m1–m27, all `available` | N5→N4 | m1–m2 Hangul (concept + jamo rows), m3 first phrases, m4–m27 grammar spine (`ko/curriculum/mN.ts`) | Reading aid = computed Revised Romanization (`romanizeKorean`); conjugation via jamo engine; 1,526 TTS clips. |
| **es** | m1–m16, all `available` | A1 | `es/curriculum/m1.ts…m16.ts` (`buildSpanishCourse()` skips empty-lesson modules) | A1 spine (ser/estar → -ar/-er/-ir present → gustar → stem-changers → reflexives). Conjugation grid (person×tense). No alphabet/romanizer (ADR-011 omissions). |

The **language-module registry** (`src/shared/language/registry.ts`) holds `{ ja, ko, es }`: `getAllLanguageIds()`, `getLanguageModule(id)` / `tryGetLanguageModule(id)`, `getCourseAtoms(id)`, plus a lazy global atom index (`findAtom`, `findAtomBySurface`). A `LanguageModule` (`LanguageModule.ts`) carries required slots (`curriculum` lazy getter, `courseAtoms`, `grammarHelpers`, `courseId`, `ttsManifest`, `vocabArt`, `placementBank`) and optional capabilities the engine skips when `undefined` (`alphabetConfig`, `secondScript`, `readingAnnotation`, `romanizer`, `conjugation`, `particles`, `reading`, `speaking`, `importMatch`, …). **Cross-language consumers must go through the registry** — direct imports of `JA_COURSE_ATOMS` etc. from outside `features/languages/<id>/` are review-caught anti-patterns.

**Side quests** (all languages) are `comingSoon: true` — tiles show but are inert; side-lesson content was deleted 2026-07-16 pending remake.

---

## Learn & lesson system

- **Learn home = transit map** for ja/ko/es (`TRANSIT_LANGS`), via the `learn.transitMapHome` flag + `LearnHomeRoute`/`LearnHomeSwitch` dispatcher. `features/learn/TransitLearnPage.tsx` renders the course as a metro network (modules = stations, side-quests = spurs, progress = line fill). Classic `LearnPage` saved at `learn/classic`; `transit-preview` is design-review mode.
- **Course definition:** `src/shared/domain/mockCourse.ts` (per-language `getMockCourse(lang)`); spine plan in `features/lesson/dev/spinePlan.ts` (`SPINE_VERSION = "draft-4 (2026-07-26)"`). `mockCourse.modules` serves triple duty — transit-map order, pedagogical order, and SRS reachability (structural risk noted in retrospective §6).
- **IR content pipeline (ja m6–m29):** authored as YAML IR (`curriculum/ir/mN.ir.yaml`), compiled to curriculum via `scripts/compile-ir.mjs` / the module compiler (committed `.ir.json` alongside).
- **Script ladder (ja, live in code — many old docs are stale on this):** hiragana romaji auto-off at **M7**, katakana romaji at **M17**, build-tile romaji fade at **M5** (`shared/settings/romanizationAutoFlip.ts`). **Kanji recognition is LIVE from M8** (`KANJI_RECOGNITION_MODULE=8`, `FURIGANA_WINDOW=2`, `applyKanjiSurfaces.ts`). Kana→kanji **switchover beat** is live on review lessons (animated reveal + graded question; stroke data in `shared/glyphs/data/kanji.json`).
- **Info-step purge:** `info` / `phrase_card` are banned teach steps for ja (info steps now 0). A `docReferences.test.ts` machine-checks these constants + doc front-matter.
- **Dynamic review prefix (ja, shipped 2026-07-30):** `withDynamicReviewPrefix` prepends the switchover beat + due atoms + due grammar + new-card seats onto every `ja-mN-neo-review-*` at content-load time.
- **Placement + test-out:** 2-stage adaptive placement (`src/features/placement/`), 100% per-module threshold, seeds SRS atoms as review-due; same engine powers per-module "test out" at `learn/test-out/:moduleId`. Each language ships its own `placementBank`.
- ⚠️ **`LessonPage.tsx` is a god file** (8 step renderers) — split before lesson-flow changes.

---

## Practice

`PracticePage` renders **6 pillars** (`practice/pillars.ts`, `PillarId = vocabulary | grammar | reading | listening | speaking | writing`), each an activity list filtered by `activityVisible()` (language allowlist + feature flag + community gate).

- **vocabulary** → flashcards hub; also vocab browser (`/vocab`), dictionary, deck/card managers, community deck browse (gated). Tile shows SRS due count.
- **grammar** → grammar-drills, conjugation (ja/ko engine trainer; es grid), particles (ja/ko/es), counters (ja).
- **reading** → `ReadingPracticePage`: **Stories | Fill-in-the-blank** segmented tabs. Stories = list → `StoryPreviewModal` (difficulty meter + "words you'll see") → `StoryReader` (`<TappableText>`, show/hide English, optional romanization) → quiz. Fill-in-the-blank = `ClozeBeat` pooled from authored sentences at level. **Curated content only.**
- **listening** → `ListeningPracticePage` (sourced from **authored** story sentences + conversation lines); plus conversation, stories-listen, echo.
- **speaking** → `SpeakingPracticePage` (echo/response w/ speech recognition).
- **writing** → pillar titled **"Writing & Alphabet"**: typed practice (`WritingPracticePage`), alphabet-write (ja/ko), kanji + components (ja). `practice/alphabet` hub = "Open script" + "Guided lesson".

**Comprehension = curated authored content, not the generator.** Random generation produced nonsense ("I can't drink a leg"), so Reading/Listening use authored, module-gated, comprehensibility-gated Stories + Conversations (`practice/content/{ja,ko}.ts`, `content/gate.ts`; ja = 28 stories + 5 conversations, ko = 26 stories + 29 conversations, es = none). Two-layer gate: module (`module <= reachedModule`) + comprehensibility (`isComprehensible`, enforced by `content.test.ts` — **if authored content fails, fix the content, not the gate**). Story density ramps sparse-early → 1–2/module late.

**Conversation** (`practice/conversation/`): `ConversationPracticePage` lists module-unlocked dialogues; each has **Listen** (comprehension — multi-voice TTS, context questions, transcript w/ lookup) and **Roleplay** (interactive — tiles→type→speak, only when `learnerRole` set). SRS credit via `conversationSrs.ts`.

**Generator engine** (`practice/engine/`, `generatePracticeItems(lang, {surface, count, seed})`): deterministically fills sentence templates (`sentenceTemplates/{ja,ko,es}.ts`) whose `grammarGate` the learner satisfies, slotting known atoms by POS, SRS-weighted toward due/struggling. Powers **Speaking/Writing** (Listening/Reading use authored content).

---

## Vocab & dictionary

- **Dictionary service** (`src/shared/dictionary/`): per-language index built lazily from the registry — course atoms ∪ frequency atoms, deduped (`source: course | frequency | both`). `lookupWord(lang, surface)` (exact → folded surface → folded reading), `searchDictionary(lang, query)` (tiered exact>prefix>substring), `getDictionaryEntries(lang, opts)`. `foldText` = NFD + diacritic-strip + lowercase.
- **`<TappableText>`** (`features/dictionary/TappableText.tsx`): renders target text with each recognized word tappable → `useDictionaryModal().openWord`. Script-aware tokenization (greedy longest-match for ja/ko, word-split for es). Reused across reading/listening/conversation.
- **Two vocab UIs:** reference **`DictionaryPage`** (`/:lang/dictionary`, search + facets + browse + `?word=` deep-link) and personal **`VocabPage`** (`/:lang/vocab`, SRS-progress rows, tiers new/learning/reviewing/mastered).
- **Frequency vocab** (`features/languages/frequencyResolver.ts`, ja/ko only): optional frequency-ranked "future" words. Toggle `settings.flashcards.frequencyVocab` — **default OFF**. When on, words unlock as the learner reaches the mapped grammar module (`frequencyRankToModule`, 20 words/module from m3) and flow through the throttled SRS intake. Data bundled TS (`ko/frequencyAtoms.ts` ~2998 atoms; `ja/frequencyAtoms.ts` from `fromModule:"future"`).

---

## SRS engine

`src/features/flashcards/engine/` — **FSRS-6 modal** (wraps `ts-fsrs` ^5.4.0, `srs.ts`).

- Each card carries independent **`recognition` + `production`** sub-states; every mutator takes a `modality`; `isDue` true if either sub-state is due (and not buried).
- **`TARGET_RETENTION = 0.90`** (`srs.ts` — this is the current value; the project-instructions `docs/CLAUDE.md` SRS section still says 0.95, which is **stale/wrong vs code**). `PRODUCTION_STAGGER_DAYS = 3`; leech threshold 8 lapses → bury 4 days.
- Ratings Again / Hard / Good / Easy — **Hard is a success** (slower stability growth than Good). `reviewCard(state, modality, rating)`, `gradeFromLesson(state, modality, {correct, retried?})` (`!correct→again`, `correct+retried→hard`, `correct→good`; Easy = reviewer-only).
- **Write gate `shouldWriteSrs(step)`** (`lesson/data/_stepPredicates.ts`): writes only if step ∉ teach kinds (`phrase_card`, `info`, `grammar_rule`, `symbol_intro`, `kanji_reveal`) **and** has non-empty `exercisedAtoms`. **Six write surfaces** (canonical): seed-on-unlock, review lessons, flashcard reviewer, D2 content-sub-lesson prior-module grading, grammar review session, Conjugation Trainer drills.
- **Two tracks:** Track A vocab (`open-lingo-srs:v2`) + Track B grammar (`open-lingo-srs-grammar:v1`). Grammar never renders as flip cards.
- **Local-first + sync:** `srsStorage.ts` (legacy flat FSRS-6 → modal migration on read; SM-2 dropped; bare ids canonicalized to `<lang>:<bare>`). Sync via `srsSync.ts` + `SrsApi` (`/api/core/v1/srs`) — dirty-detection, delta LWW merge (server wins on newer `lastReviewedAt`, local deliberate reset protected by `manualResetAt`).
- **Recent (shipped 2026-07-30):** session runs on **modality slots** (`sessionSlots.ts` — fixes both-due cards dropping the production half), and sync is **chunked + serialized** (`SRS_SYNC_CHUNK_SIZE=1000`, all pushes through `enqueueSyncOp` so boot-push and reviewer-mount push queue instead of aborting each other).

---

## Settings, romanization & theme

- **Romanization is per-language:** `settings.learning.showRomanization` is `Record<languageId, boolean>` (default `{}`), read via **`isRomanizationOn(learning, languageId)`** (absent key = ON). One language-agnostic toggle surface, per-language storage → JA-on + KO-off is possible. Governs JA romaji AND KO Revised Romanization. JA per-script fade internals keep the `romaji` name (`romanizationAutoFlip.ts`). Legacy `romaji*` / scalar keys migrated on hydrate in `SettingsContext` (`migrateReadingAidKeys`).
- **Persistence:** `updateSetting(path, value)` → `PATCH /api/core/v1/users/me/settings` (backend deep-merges; stores `learning` opaquely). Namespaces: `learning`, `flashcards`, `appearance`, `accessibility`, `audio`, `notifications`, `shop`, `social`.
- **Theme presets** (`shared/theme/presets.ts`, Tailwind `class` strategy + CSS-var tokens): `light` = "Academia" (sepia paper, marginalia-red accent, Fraunces display), `dark` = warm charcoal + red, `amoled`. Sepia retired (folded into Light).

---

## Routes (abbreviated)

```
/                         → RootRoute (home or landing)
/landing /home /login /logout /privacy /terms /about /try /settings /get-started
/u/:username              → RequireSocialProfile (owner-only while social dark; ?register=1 bypass)
/admin/*                  → AdminInnerShell (dashboard, users, moderation, ops, events, infra, lms, content/*)
/:lang/*                  → RequireAuth → LangLayout
  learn                   → transit map (LearnHomeRoute); classic, course, lessons/:id, placement-test, test-out/:moduleId
  practice                → PracticePage; flashcards(+review/cards/decks), grammar(+review/particles/conjugation),
                            reading, listening, speaking, writing, conversation, stories, alphabet, kanji, counters, pillar/:pillarId
  vocab, dictionary, shop, speech-tune
  social, social/friends  → RequireSocial (bounce home while dark)
  community/*             → RequireCommunity (bounce home while dark)
  qa/*, spine-plan, lesson-preview, transit-preview, …  → dev/deep-link only
```

Full tree + gates: `src/App.tsx` (`RequireAuth` in `src/routes/`; `RequireSocial`/`RequireCommunity`/`RequireSocialProfile` inline).

---

## Feature flags

Source: `public/feature-flags.json` (runtime override) + `src/shared/config/featureFlags.ts` (`DEFAULT_FEATURE_FLAGS`, kept in sync); context fetches with `cache:"no-store"` and falls back to defaults. Predicates: `isSocialEnabled`, `isCommunityEnabled`, `isLeaderboardEnabled`, `isTransitLearnHome`.

| Flag | Value | Effect |
|------|-------|--------|
| `learn.transitMapHome` | **true** | Transit-map learn home for ja/ko/es |
| `social.enabled` | **false** | DARK — social routes bounce home |
| `community.enabled` | **false** | DARK — master switch for whole community surface (leaderboard needs this too → off) |
| `practice.stories` | **false** | Gates the standalone Stories activity tile / `/practice/stories` (the reading-tab stories are separate and live) |
| `practice.externalContent` | **false** | Gates `/practice/external-content` |
| `community.explore.flashcardDecks` | true | (moot while community master off) |

**Dark for MVP:** social, community (∴ leaderboard), standalone stories tile, external content. **Live:** learn (transit), practice pillars, flashcards, shop, settings, admin, owner-only public profile.

---

## Backend (lingo-core) & launch status

- **Live in code:** decks, users/subscriptions/settings, **SRS** (`/api/core/v1/srs`), **progress** (`/progress/*`, lesson batch + `/progress/me`), community routers (dark via FE flags), **finance transparency** router + `FundingMeter`, security-headers middleware. **Quests** (`lingo-core/app/quests/`) advance via the **async event pipeline** — lesson batch publishes `lesson_completed`/`xp_awarded`, consumed by **lingo-async**, which calls back `POST /quests/_internal/{id}/progress` (NOT synchronous — don't add inline quest writes to the progress handler).
- **Not wired:** live AdSense fills (needs Google approval + env), live funding % from AdSense/Stripe, rate limiting, Stripe/AdSense management APIs. **MVP: no billing.**

**Build health (2026-07-31):** `tsc --noEmit` clean. Guard scripts in `scripts/`: `mvp-smoke.mjs`, `es-smoke.mjs`, `module-gate.mjs` (`npm run module-gate -- mN`), `compile-ir.mjs`, `qa-*` crawlers, `visual-qa/` (Gate 10). CI runs tsc + vitest + build; Playwright e2e + Gate 10 are local/manual. Known pre-existing test noise: `questionBank.test.ts` count, `AdminModerationPage` TS errors, and two fake-timer env flakes (`GrammarRuleStepView`, `ListeningBuildRomajiPeek`).

---

## Recent history

- **2026-07-30/31 — practice/dictionary/romanization wave.** Practice pillars generate from learned vocab (`practice-tailored`); Reading/Listening comprehension moved to **curated authored content** with `<TappableText>` inline dictionary lookup (`curated-content` + `vocab-viewer` + `freq-vocab`); Reading = Stories | Fill-in-the-blank tabs + story preview modal + density ramp; conversation listener + roleplay; **romanization made per-language** (`romaji-rename` + `romanization-per-language`). SRS: modality-slot sessions + chunked serialized sync.
- **2026-07-26/27 — JA spine fully authored.** draft-4 spine; m1–m29 all live (zero coming-soon); m6–m29 IR-compiled; old `m6.ts…m28.ts` archived; N4 tier moved to m30 (off-map).
- **2026-07-16 — transit map + MVP dark.** Transit map promoted to the ja learn home; social/community hidden (not deleted) behind flags; script-ladder wave (kanji live M8, romaji-off M7).
- **Earlier (2026-05 → 2026-07-13):** placement/test-out, SRS scheduling model + course-deck reviewer, katakana rollout, grammar review deck + Conjugation Trainer, Anki knowledge import, Duolingo survey, Spanish A1 course, es engine parity. Full changelog lives in git history + `docs/archive/handoff-*.md`.

---

## Where to go next

- **Research map (start here):** [`INDEX.md`](./INDEX.md) — daily-maintained, one line per doc, flags stale entries.
- **JA authoring law:** `authoring-invariants-pinned.md` → `lesson-authoring-guide.md` (§13 = locked template) → `authoring-workflow.md`.
- **Code invariants / SRS write surfaces / commands:** repo-root `CLAUDE.md`.
- **Latest structural retrospective:** `retrospective-2026-07-17.md`.
- **Backlog:** `node scripts/backlog.mjs` (`backlog/items.yaml`).
