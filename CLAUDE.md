# CLAUDE.md — Open Lingo (`lingo` web app)

**Status:** LIVE · **Last-verified:** 2026-08-21

This is your orientation doc. It says what we're building, the lenses we teach
from, where everything lives (so you can find it fast), the boundaries to respect,
and the invariants that will bite you if you don't know them. When you need depth,
it points you at the authoritative doc rather than repeating it — read those before
touching the subsystem they cover.

---

## What we're building

Open Lingo is a language-learning SPA (Vite 6 + React 19 + TypeScript strict +
Tailwind 3) that talks to `lingo-core` (FastAPI, separate repo at `../lingo-core/`)
over HTTPS with Auth0 RS256 JWT. It teaches through authored, tightly-sequenced
lessons plus an FSRS-6 spaced-repetition system, not drills-for-drills'-sake.

**The aim:** lessons a learner can actually *reason through* — every new word or
structure is introduced before it's tested, glosses tell the truth about structure,
and review is scheduled so things stick. Quality of the teaching sequence is the
product; volume is not.

**Course state (2026-08-21):**
- **Japanese N5 — FULLY AUTHORED and live.** `mockCourse.ts` carries m1–m30 (m30
  opens the N4 tier). The live map is the draft-4 spine: m1/m2 kana rows +
  m3–m29 authored `ja-m*-neo-*` lessons compiled from YAML IR. The old course is
  ARCHIVED under `features/languages/ja/curriculum/_archive/` (planning reference
  only — imported by nothing; authoring agents never see it).
- **Spanish — m1–m10 LIVE (2026-08-25), the complete §13-doctrine beginner
  tier** (frameless IR pipeline, learner-sim-hardened, silent-build Later
  affordance on speaking steps). `/es/qa/m3`…`/es/qa/m10` walk the promoted
  content through the real render pipeline. m11+ is GATED on Spencer's
  personal walk (first-conjugation-module checkpoint law). The July/August
  IR waves are ARCHIVED under `curriculum/_archive/` (spine/word-list
  reference only).
- **French — RESTARTED under the doctrine (guide §13, 2026-08-21).** Serves
  the hand-authored m1/m2; FR is selectable (Denise voice passed). m3+
  re-authoring follows the ES pattern ([[FR course state]]).
- **Japanese N4 — m30–m38 authored and live** (dialogue_sim from m34;
  volitional/ba conjugation support).

---

## Orient yourself — resources & where they live

**Read these maps FIRST; don't grep blind.**

| You need… | Go to |
|---|---|
| Which docs exist, which are authoritative vs stale, question→location | **`docs/INDEX.md`** — categorized, status-tagged, maintained daily by the session-start index job. |
| Where a symbol / feature lives in code | **`docs/CODE_MAP.md`** — generated repo map, files ranked by dependency centrality. Regenerates from source (`scripts/code-index/`), so it can't drift. Don't hand-maintain a file tree here. |
| Fresh code-health signal (drift, dead code, god-files) | **`artifacts/code-index/REPORT.md`** + `LEDGER.md`, from `node scripts/code-index/index-job.mjs`. |
| Semantic "where's the code about X" search | `node scripts/code-index/embed/embed-cli.mjs query "…"` — a candidate generator; confirm hits with `rg`/read (see [[code-index-tooling]]). |

**Authoritative docs (current sources of truth, in order):**
- `docs/authoring-invariants-pinned.md` — the pinned JA law.
- This file.
- `docs/lesson-authoring-guide.md` — lesson patterns + per-step rubric (§13 = the
  locked M8+ template). Read before any JA lesson-content change.
- `docs/pedagogy-principles-2026-07-05.md` — linguistic framing rules (binding for
  what explanation content may claim).
- `docs/course-design-learnings-2026-08-21.md` — cross-course build/gate/ship
  laws distilled from the ES/FR restart.
- `docs/retrospective-2026-07-17.md`; session handoffs at `docs/handoff-*.md`.
- `docs/ARCHITECTURE_REVIEW_2026-06-14.md` — read before structural changes.
- `docs/user-feedback/` — verbatim tester notes; read before UX-touching changes.

⚠️ `docs/PROJECT_STATE.md` is a point-in-time snapshot and is currently **STALE**
(predates the script-ladder wave + the dict-form-first JA rewrite) — trust it only
for the launch/MVP feature-flag picture, refresh before trusting it elsewhere.
Don't trust `docs/tasks/*.md` as current state.

**The local-model loops (all uncommitted tooling, generator/judge doctrine):**
- `scripts/code-index/` — repo map + drift/orphan maintenance jobs + hybrid embed
  index ([[code-index-tooling]]).
- `scripts/doc-hygiene/` — deterministic doc-rot cleanup ([[doc-hygiene-loop]]).
- `scripts/ux-loop/` — mobile+desktop UX review; `step-pass/` covers every lesson
  step type ([[mobile-ux-loop]]). Measurement-first; vision is opt-in.

---

## Boundaries

**Always**
- Read the relevant authoritative doc before touching a subsystem it covers.
- Verify layout changes with `getBoundingClientRect` at ≤700px height, not eyeballs.
- Stage explicit paths; another session may be editing the tree ([[concurrent-sessions-same-repo]]).
- **Sibling-parity check:** after changing content, a step type, or shared behavior,
  name its siblings (other courses, test-out/review contexts, the mobile build) and
  state each as inherited / needs porting / N-A. A fix isn't done until siblings are
  accounted for — the FR re-author silently discarding the ES standards is the
  canonical failure (transcript mining 2026-08-21, F1).
- **Fix the class, not the instance:** a defect Spencer flags on a QA walk is an
  instance of a class — search for the same pattern elsewhere before reporting done,
  and state the found scope (mining F2).

**Ask first**
- Commits and pushes (only when asked; branch off `main` first if you do).

**Before ANY push to main** (a push = a prod deploy):
- `npm run preflight` — tsc + full suite + `CI=true` prod build. The CI=true
  matters: vite-plugin-pwa only hard-fails over-cap precache assets under CI;
  a plain local build silently drops them (that split shipped nothing on
  2026-08-25 while looking green locally).
- After pushing, confirm the deploy RUN CONCLUSION (`gh run watch <id>
  --exit-status`; check `$?` directly or `${PIPESTATUS[0]}` — piping through
  `tail` swallows the exit code and has caused a false "deploy succeeded"
  report). A red `ci`/`deploy` on main opens a 🚨 issue via `red-main.yml`;
  while one is open, fix forward or revert — don't stack unrelated pushes.
- Anything hard to reverse or outward-facing (deploys, external sends).
- Relaxing a Spencer invariant (below) or an SRS write-surface rule.

**Never**
- `git add -A` / sweeping commits — the tree often has many concurrent dirty files.
- Touch `~/.claude/**` or `.env*`.
- Add MUI, ESLint/Prettier configs, legacy redirects/back-compat shims, or AI
  attribution to commits.
- Reference the `_archive/` course from any live code path.

---

## The lenses we teach from

These are *how* we teach — apply them to any content work; depth lives in
`docs/lesson-authoring-guide.md` and `docs/pedagogy-principles-2026-07-05.md`.

- **Deduction-first, no hollow cards.** A step should let the learner reason to the
  answer from what they know. `dialogue_sim` is the favorite step type; avoid empty
  recognition cards. No typed-translate or `silent_letter` at beginner tier; tile
  banks use max-acceptance. ([[step-type-doctrine]])
- **Intro before review — always.** No atom is ever exercised by SRS before it's
  been actively introduced (correct-option image MCQ, audio-meaning primer, teach,
  or context build). Machine-enforced (`moduleConformance.test.ts`,
  `kanaWordIntroOrder.test.ts`).
- **Comprehensibility-gating.** Every content word must decompose into atoms already
  taught by this point (`fromModule` ≤ the lesson/point's module). This is the
  machine form of "would they know this word yet?"
- **Structure-true glosses; helpers, not conjugation.** Explanations must not lie
  about structure (the が/は model, helper particles). Binding: the pedagogy doc.
- **Interleave, don't block-teach.** Split a repetitive family across lessons with
  unrelated breaks between; review after. All courses. ([[interleave-dont-block-teach]])
- **Image-MCQ-as-intro; grading = review-only.** (Authoring guide §13.)
- Per-step sentence exposure ≤3; a new sentence per grammar point (don't recycle one
  sentence through 4 step types); review-particle cloze ≤25% of a lesson.
- **Explanations: short, anchored, optional.** Learner-facing explanation text has a
  hard budget (~3 short lines; depth goes behind a "see the rule" expander) and must
  quote the course sentence it explains. Screen generated sentences for accidentally
  suggestive or double-meaning readings. (Authoring guide §2/§10.)

---

## Stack & conventions

React 19, React Router v7, TS 5.6 (strict), Vite 6, Tailwind 3 (`class` theme),
TanStack Query 5, Auth0, i18next, Vitest (happy-dom) + Playwright. Path alias
`@/ → src/`. No ESLint/Prettier.

- **Vertical slices** under `src/features/<domain>/`; keep components local until a
  2nd domain consumes. Shared code in `src/shared/`. Course map:
  `src/shared/domain/mockCourse.ts`. (For anything more specific, use `CODE_MAP.md`
  rather than a tree here.)
- **API:** extend `ApiClient` in `shared/api/*.ts`, singleton per domain.
- **Server state:** TanStack Query only, explicit `staleTime` per query. **Mutations:**
  dedicated hooks wrapping `useMutation` + `invalidateQueries`.
- **Icons:** `lucide-react` via `src/shared/iconRegistry.ts`. **i18n:**
  `t("ns.key", "fallback")`. **Routes:** lazy via `lazyRetry`.
- Shared primitives in `shared/components/ui/` — extend, don't fork. Files past
  ~400 LOC are a smell (see the god-file list in the code-index REPORT).
- **⚠️ `LessonPage` is a god file** — split before lesson-flow changes.

---

## Invariants that will bite you

Non-obvious, hard-won, and NOT inferable from code. Depth is in the linked docs.

### SRS engine — `features/flashcards/engine/` (FSRS-6 via `ts-fsrs`)

Full model: `docs/srs-scheduling-model-2026-06-15.md`; grammar deck spec
`docs/grammar-deck-v1-spec-2026-07-02.md`. Backend mirrors the shape at
`lingo-core/app/srs/schemas.py`.

- **Hard is a SUCCESS** (slower stability growth than Good). Target retention 0.90.
- **Local-first (localStorage), delta-merge sync.** ALL sync POSTs go through
  `enqueueSyncOp` (`srsSync.ts`) — the ApiClient `tag:"srs:sync"` dedup ABORTS the
  previous in-flight request, so concurrent syncs silently killed each other. Never
  call `srs.sync` directly from a new surface; queue it. Server-side LWW on
  `lastReviewedAt` is the real clobber-guard.
- **Two tracks:** Track A vocab (`open-lingo-srs:v2`) + Track B grammar
  (`open-lingo-srs-grammar:v1`, `grammarSrs.ts`). Grammar hydration partitions by
  `grammar:*` prefix — never let those keys leak into the vocab store. Grammar
  NEVER renders as flip cards (vocab-only).
- **Each card has two sub-states** (`recognition` + `production`); one modality
  updated at a time; `isDue` is true if either is due.
- **Six SRS write surfaces** (don't add a seventh without checking the gates):
  seed-on-unlock (due *next-day*, never same-day), review lessons, the flashcard
  reviewer, D2 content-review atoms (prior-module only), the grammar review session,
  and the Conjugation Trainer. The deck's `?practice=1` and "Practice anyway" flows
  write NOTHING. `buildSrsReviewLesson` is PURE (no build-time writes).
- **Ladder:** unlocked → seeded due-next-day → due. The flashcard reviewer plays the
  whole course deck, no intake cap by default.
- **Kana subtlety:** "kana M1/M2 has no SRS" = the *glyphs* only; M1/M2 vocab words
  (あい/いえ/…) ARE SRS-eligible.
- Adaptive per-atom step selection happens on the **flashcards surface**, NOT inside
  lessons — lessons stay statically authored.

### JA curriculum authoring

- **Id landmine:** m2's row lessons carry `ja-m1-*` ids (historical). NEVER infer
  module membership from the id prefix — use the course map. (`parseModuleIndex`
  must accept a bare `moduleId`.)
- Content: `features/languages/ja/curriculum/m*.ts`; helpers `grammarHelpers.ts`;
  atom registry `courseAtoms.ts`. Kana rows (m1/m2) are hand-authored files.
- **Katakana:** two rows per module m7–m11 (`NEO_KATAKANA_ROW_LESSONS` in
  `katakanaRows.ts`, from `_consonantRowHelpers.ts`), spliced into each neo module.
  The old one-row-per-module `ja-mN-kata` lessons are RETIRED (registered but on no
  tile).
- **Romaji auto-off is per-script** — read the exported constants in
  `src/shared/settings/romanizationAutoFlip.ts` (don't trust prose): hiragana M7,
  katakana M17, build-tile fade M5. Romaji ruby groups per WORD for M3+
  (`romajiLexicon.ts`); M1–M2 + particles stay per-kana (がっこう must read "gakkou").
- **Kanji recognition is LIVE from M8** (`KANJI_RECOGNITION_MODULE=8`, furigana
  window unlock+2), as render-time surface substitution
  (`ja/secondScript/applyKanjiSurfaces.ts`) — NOT the deferred `KANJI_START_MODULE=99`
  the old specs describe. `kanji_reading` step shipped 2026-07-16.
- **Atom `introducedByLessonId` landmine:** a static entry SUPPRESSES the
  module-fallback unlock path (`lessonAtomIndex.ts`). Before re-pointing an atom,
  check no other lesson relied on the fallback (re-attribution nearly orphaned
  ばんごはん).
- **Vocab card art:** every authored word needs an image; when you author a new
  emoji, VENDOR its SVG into `src/pub/noto-emoji/svg/` (a 2026-06 wave shipped 224
  without vendoring → broken images). Refs: `docs/n5-vocab-emoji-reference-2026-05-18.md`.
- Machine-enforced (tests fail if violated): `moduleConformance.test.ts`,
  `kanaWordIntroOrder.test.ts`, import-time assertions in curriculum files.

### Gamification (cross-repo)

- **XP is server-authoritative;** the client mirrors defaults for the pre-sync
  estimate (`xpRules.ts`). Keep it in sync with `XpEconomyConfig` defaults
  (`lingo-core/app/platform_settings/schemas.py`) or the estimate diverges.
  Numbers (mirror of `xpRules.ts`, guarded by `docClaimGuards`): lesson
  base 10, perfect +5, test/recap +10; levels are 500/level linear.
- **Quests** advance via an async event pipeline (lingo-async), NOT inline in the
  progress handler — don't add synchronous quest writes.

### Mobile UI

**Method doc:** `docs/mobile-ui-testing-2026-08-09.md`; `tests/mobile/` is the only
layout authority. `npx playwright test --project=mobile` (kill stale servers on
:5273/:5274 first). Three non-obvious rules:
- **Every viewport carries `insets`** — pushed over CDP because Chromium reports
  `env(safe-area-inset-*)` as 0, which hid a real Dynamic Island overlap.
- **Tap targets are WCAG 2.2 SC 2.5.8 — 24×24 CSS px** (with spacing exception),
  NOT 44pt. Floor them in **px, not rem** (`--font-base` drops to 15px on short
  desktops, so a rem floor measures 23px).
- The lesson shell is FIXED-height; the step container is the only scroll area.
  Option buttons + the CTA must NOT move on submit. Known step overflows at 375×667:
  match_pairs 222px, dialogue_listen 100px, speaking 79px, grammar_rule 368px
  (scrolls by design). `?step=N` jumps to a step; `?trace-gate=0` bypasses the trace
  gate. Don't size step content with dvh arithmetic (chrome is fixed-px).

### TTS

Audio is **not in this repo**. Pipeline: `scripts/emit-tts-deck.mjs` → deck JSON in
`lingo-data` → `python -m pipeline.tts.generate` (in `../lingo-data/`) → CloudFront.
The app ships no path table — `getTtsUrl()` derives `sha256("<lang>:<text>")[:16]`
and checks existence against `src/shared/tts/manifests/<lang>.json`.
- **⚠️ The emitter is regex-based over source text — a new factory shape or filename
  it doesn't match is SKIPPED SILENTLY, and "wrote=0" looks like success.** After
  authoring, verify with `npm run module-gate -- mN`.
- New audio must ship WITH its manifest (stage mp3s in `tts-publish/`); a manifest
  hash without an uploaded object serves the SPA shell and breaks playback.

### Delivery / service worker

- Web prod builds ship a service worker (vite-plugin-pwa `generateSW`) — precaches
  the open→lesson path, runtime-caches hashed assets + `/tts/v1/*`. Consequence: a
  deploy reaches SW-installed clients **one navigation late**; `sw.js` (generated,
  not in git) + `manifest.webmanifest` must stay `no-cache` in the deploy S3 sync.
- **Boot batching:** the boot wave is answered from one `GET /boot`
  (`shared/api/bootCache.ts`). A new boot-time fetch must be added to `BootResponse`
  + `SECTION_BY_REQUEST` or it fans out again.
- **Stale-bundle trap:** an uncommitted re-author can leave built phone/web bundles
  serving old content — fingerprint the bundle before diagnosing ([[built-surface-drift]]).

---

## Testing & dev loop

```bash
npm run dev            # vite, strict port 5173 (API base VITE_API_BASE_URL, default :8000)
npm run test:run       # vitest CI — two projects: `curriculum` (isolate:false) + `app` (isolated).
                       #   --project curriculum scopes a run; add --max-workers=6 when Ollama runs.
npm run test:e2e:auth  # one-time headed auth → .auth/user.json (navigate to /login, not /)
node scripts/shot.mjs <path> [w] [h] [--full] [--lang=ja]   # screenshot → /tmp/shot.png
npx playwright test --project=mobile                          # mobile layout gate
node scripts/code-index/index-job.mjs                        # refresh CODE_MAP + code-health report
```

- Add a happy-path test for any new feature.
- **White screen + ERR_BLOCKED_BY_CLIENT in dev = ad blocker** killing
  `src/features/ads/` module URLs — allowlist localhost.
- **Eager `m*.ts` glob collectors swallow `mN.test.ts`** — always add the negative
  pattern ([[glob-collectors-match-test-files]]).
