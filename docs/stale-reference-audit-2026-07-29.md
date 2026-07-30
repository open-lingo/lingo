# Stale course-reference audit — 2026-07-29 (second pass)

**Status:** LIVE · **Last-verified:** 2026-07-29

Second sweep of the day, after the B068/B070 wave. Scope: every course surface
and process doc, with DURABLE detectors so this regression class stops
recurring. Every count below names its instrument; every "clean"/"absent"
claim was positive-controlled (the instrument was shown to flag a planted or
known-real case before its zero was believed). The m11 vocab-pack agent was
working in-tree during this audit; its in-flight edits are NOT reported as
staleness, and every ratchet pin here was measured twice (identical both
times) across its churn.

## 0. Executive summary

| Regression class | Live count (instrument) | Gate before today | Gate now |
|---|---|---|---|
| 1. Dangling `introducedByLessonId` | 232 (`lessonAtomAttribution.test.ts`, lowered 234→232 by the m11 packs) | ratcheted | unchanged (deliberately not double-pinned) |
| 2. `fromModule` ≠ live first-taught module | **240 atoms — 196 early-tag (gate-dishonesty), 44 late-tag (unlock-blocker)** (`fromModuleDrift.test.ts`, new) | NONE | **ratcheted both directions** (200/50 pins, headroom for the pack wave; tighten to 196/44 after it settles) |
| 3. False doc orientation | 6 found, 6 fixed (see §3) | `docReferences.test.ts` (script ladder only) | + `docClaimGuards.test.ts` (match-pairs floor, XP mirrors, invariant count) |
| 4. Stale code comments stating dead mechanisms | 9 found, 4 fixed, 5 reported (§4) | NONE (unavoidable) | report-only tier of the dead-id scanner |
| 5. Dead lesson-id-shaped references | **696 tokens** outside archives (42 in historical-record files); **26 in quoted strings in non-test src** (`staleLessonIdReferences.test.ts`, new) | NONE | **ratcheted at 26 (data tier); report tier for docs/comments** |
| 6. Constant drift prose↔code | 5 drifts found, 5 fixed (§6); XP / retention / harvest-window / review-schedule verified in-sync | partial | extended (see class 3 row) |

**Top-10 worst live-claim items found this pass** (all verified, file:line):

1. **CLAUDE.md katakana paragraph was fully false** — claimed one row per
   module M3–M12 as `ja-m3-1-1`/`ja-mN-kata` "first pathway node" via the
   archived `m3-v2.ts`. Live truth (map-verified): TWO rows per module
   m7–m11, ids `ja-m7-neo-kata-a` … `ja-m11-neo-kata-wa`, spliced into neo
   modules. **FIXED** in CLAUDE.md. The retired `ja-m4-kata`…`ja-m12-kata`
   lessons are still REGISTERED but on no map tile (86 scanner hits,
   bucket `registered-off-map`).
2. **docs/INDEX.md landmine bullet asserted "m28 does not exist (m27→m29)"**
   — m28-neo shipped in the IR wave (commit f26edc9d;
   `mockCourse.ts:985` carries the m28 tile). Same bullet claimed `m6.ts`
   coexists at the curriculum root (it is archived). **FIXED.**
3. **docs/INDEX.md IR row claimed "only m6 uses it"** — `curriculum/ir/`
   holds m6–m29 (48 files). **FIXED.**
4. **`particleClozePlacement.test.ts` grandfather list is 100% dead** — all
   82 `LATE_PARTICLE_CLOZE_EXEMPTIONS` entries reference archived old-course
   lessons (164/164 tokens dead by the scanner; 82 × 2 tokens arithmetic
   confirms full coverage). The ratchet still runs on live lessons, so it is
   dead WEIGHT not a dead GATE — but its `PARTICLE_INTRO_MODULE` table is
   old-course provenance (the test's own よ/ね comment documents the same
   staleness class) and needs a neo re-derivation pass. PROPOSED cleanup
   (test file — not modified per audit ground rules).
5. **`QaTestDrivePage.tsx` deep-links 22 dead lessons** (70 dead tokens;
   e.g. `/learn/lessons/ja-m8-6-1` at line 178, `ja-m9-7-1` at 185,
   `ja-m10-2-1` at 192): the script-ladder QA walk points a human tester at
   lessons that no longer resolve. Counted in the new ratchet pin; re-link
   PROPOSED (needs equivalent-live-lesson curation, not a mechanical swap).
6. **lesson-authoring-guide.md §6 claimed "the shipped spine is M1–M27 (N5)
   + M28 capstone + M29 (first N4 module)"** (line 427) — the live spine is
   m1–m29 neo + m30 (first N4). **FIXED.**
7. **lesson-authoring-guide.md §4 claimed the derived spot-the-mistake step
   is live** ("auto-injects a 'One of these is wrong' step") — retired
   2026-07-20 (invariant 32; `deriveGrammarMicroSteps.ts:49`). **FIXED.**
8. **Match-pairs floor stated as 4 in two guide places** (§1 contract,
   §4 table) vs `MATCH_PAIRS_FLOOR = 6` (`matchPairsFloor.ts:59`) —
   invariant 36 said the guide was fixed 2026-07-26; it wasn't. **FIXED +
   machine-gated** (`docClaimGuards.test.ts`).
9. **`JA_COURSE_ATOMS_BY_KANA` "last-wins" claims survived today's fix in 5
   more places** — the map is FIRST-wins + `JA_PRIMARY_ATOM_BY_KANA` ruling
   table (`courseAtoms.ts:1425-1438`). FIXED in `grammarHelpers.ts:116`,
   `m21-neo.ts:25`, `m22-neo.ts:27`; REPORTED (not fixed — contended file)
   in `courseAtoms.ts:1185` and `:1243` (both argue from "LAST-WINS").
10. **`LessonStepPreviewPage.tsx:489` kanji_reveal preview referenced atom
    `ja-m3-2-v-tomodachi`** — the real atom is `ja-m3-3-v-tomodachi`
    (`courseAtoms.ts:197`). One-character typo in the 07-29 switchover
    fixture, found by the new scanner. **FIXED.**

## 1. Surface inventory (what can go stale, and what gates it)

Built from docs/INDEX.md → CLAUDE.md → authoring-invariants-pinned.md →
lesson-authoring-guide.md → authoring-workflow.md → pedagogy-principles.

| Surface | Stale-reference risk | Machine gate today |
|---|---|---|
| `ja/courseAtoms.ts` (678 atoms) | `fromModule` (old-course), `introducedByLessonId` (dangling), header/inline comments | `lessonAtomAttribution.test.ts` (dangling, 232), `moduleConformance`, homophone ruling test; **NEW: `fromModuleDrift.test.ts`** |
| Curriculum TS + IR (`curriculum/m*.ts`, `ir/*.ir.yaml`) | file-level header claims; IR `priorGrammarPoints` | per-module tests + `moduleBarGuards` + compiler diagnostics (strong) |
| Course map (`shared/domain/mockCourse.ts`) | `unlockAfter` sentinels, tile prose | `mockCourse.test.ts` (no-comingSoon-in-N5), curriculum-coverage; **NEW: dead-id ratchet** (found 2 dead `ja-m2-complete` unlockAfter sentinels — dormant, the tiles are comingSoon) |
| Lesson registry (`mockLessons.ts` LESSONS) | retired lessons staying registered | none for "off-map but registered" — **NEW: scanner buckets these (86: the ja-mN-kata rows)** |
| Grammar pools (`grammarReviewPools.ts` + `grammarReviewIndex.ts`) | `GATE_EXEMPTIONS` keys, harvest filters, `fromModule`-based gate | comprehensibility gate (ratcheted both directions). Exemption keys all resolve today (scanner-verified). ⚠️ latent: the `-neo-` harvest filter excludes `ja-m30-*`; m30 ships no particle_cloze today so impact is zero — flagged in a code comment I added |
| Reading passages (`practice/data/ja-reading-passages.ts`) | untaught-vocab leakage (B070), module tags | **NONE** (B070 residual documented in vocab-exposure-audit §5.2) |
| Placement bank (`placement/questionBank.ts`) | module→skill mapping is old-course-aligned; untaught vocab (B070) | structural tests only (`questionBank.test.ts`) — no neo-alignment gate |
| Conjugation tables (`ja/conjugationTables.ts`) | module unlock levels | trainer tests; not re-audited this pass ("could not verify" — see §8) |
| Dev/QA pages (`lesson/dev/*`, `QaTestDrivePage`, qaCatalog) | dead deep links, stale fixtures | qaCatalog tests exist; **QaTestDrivePage had 22 dead links (found), fixture typo (fixed)** |
| TTS emitter + manifest (`scripts/emit-tts-deck.mjs`) | silent skip of unmatched factory shapes/files (documented landmine) | coverage step in `module-gate.mjs`; emitter reads `curriculum/` non-recursively (archived files naturally excluded — verified by reading the readdir logic) |
| i18n locales (`shared/i18n/locales/*.json`) | module-number/romaji claims in copy | none needed — grep for module/romaji claims over the 2460-key en.json returned zero (file verified non-empty) |
| Learner-sim dumps (`docs/learner-sim/`) | none — historical record by design | n/a (scanner buckets as historical) |
| Process docs (CLAUDE.md, INDEX.md, pinned invariants, guide, workflow, pedagogy) | ALL classes | `docReferences.test.ts` (script ladder + retention + status headers); **NEW: `docClaimGuards.test.ts`** |
| Backlog (`docs/backlog/items.yaml`) | evidence fields are historical record — excluded by design | n/a |

Id/tag grammar (for future scanners): live lesson ids are `ja-m1-<row>-N` /
`ja-m1-l1*` / m2 rows carrying `ja-m1-*` ids; `ja-m3-neo-1`…`ja-m29-neo-*`
(incl. `-neo-review-1..3`, `-neo-challenge`, `-neo-kata-<row>` m7–m11);
`ja-m30-N-1/2`, `ja-m30-story` (NO -neo infix — anything keying "new course"
on `-neo-` silently excludes m30); quest ids (`ja-travel-sprint`, …). Step
ids are FREE-FORM (`ja-m3-neo-rev-cloze-mo` lives in `ja-m3-neo-review`) —
never infer a lesson from a step-id prefix. 89 course-ATOM ids are
lesson-id-shaped generator relics (`ja-m5-1-v-1` = いち) and are stable
forever — never "fix" those. Retired shapes: `ja-mN-K-K` old sub-lessons,
`ja-mN-kata`, `ja-m3-1-1/1-2`, `ja-mN-review-1/2` (only resolves via the
dormant dynamic builder, B069), `ja-mN-story` (old-course; m30-story is live).

## 2. Detector A — dead lesson-id references (NEW, checked in)

`src/__tests__/staleLessonIdReferences.test.ts` — extracts every
`ja-m<digits>[-…]` token from src/ + docs/ + scripts/ (excluding `_archive`,
`docs/archive`, `src/pub`), resolves against registry ∪ map ∪ step-id set ∪
atom-id set ∪ the dynamic `ja-mN-review-1/2` family, and buckets.

- **Positive controls (asserted in the test):** `ja-m4-1-1` and
  `ja-m1-l6-ha` classify dead; `ja-m3-neo-1` (map), `ja-m6-neo-9-cloze-7`
  (exemption-key step suffix), `ja-m11-neo` (family prefix) classify live;
  `ja-m4-review-1` classifies dynamic-dormant, not dead; the extractor finds
  a planted dead id in text.
- **Measured 2026-07-29 (twice, identical):** 696 dead tokens outside
  archives (42 in historical-record files); 86 registered-off-map (all
  `ja-mN-kata`); 38 dynamic-dormant.
- **Ratchet (CI):** dead ids in QUOTED strings in non-test src, excluding
  `courseAtoms.ts` (already ratcheted by B068) — **pin 26**, composition:
  QaTestDrivePage 22, katakanaRows `lessonId: "ja-m3-1-1"` 1,
  reviewTailSrs doc-comment 1, mockCourse `unlockAfter: "ja-m2-complete"` 2.
- **Report mode:** `STALE_REPORT=1 npx vitest run staleLessonIdReferences`
  → `/tmp/ja-stale-lesson-ids.txt` (full bucketed list with file:line).

Notable non-ratcheted findings from the dump:

- `moduleContentLints.ts:429-443` — `ANTIPATTERN_MINIMAL_PAIR_GRANDFATHERED`
  (15 entries) and `GATE8_PROGRESSIVE_GLOSS_ALLOWLIST` (`ja-m27-6-1-lc-1`,
  line 753) are 100% dead-id exemption lists — dead weight, purge proposed.
- `flashcards/import/match.test.ts`, `kanjiReading.test.ts`,
  `reviewTailSrs.test.ts`, `lessonPage-srs-wiring.test.ts`, etc. — dead-id
  hits there are synthetic FIXTURES (legitimate; why test files are excluded
  from the ratchet tier).
- Docs bucket: most dead-id hits sit in docs INDEX already flags stale
  (PROJECT_STATE, kanji-furigana-plan, katakana-rollout spec,
  ALPHABET_COURSE_INTEGRATION_PLAN, workshop-agenda). Live docs with dead
  ids that remain unfixed: lesson-authoring-guide §11/§13/§14 examples
  (old-course pattern sections — see §7 proposal), `RUN-PLAN-n4.md:268`
  (`ja-m30-neo` — m30 has no -neo infix).

## 3. Detector B — fromModule truth table (NEW, checked in)

`src/features/languages/ja/__tests__/fromModuleDrift.test.ts` — walks the
live map in learner order (same instrument family as
`atomExposureAudit.test.ts`), records each atom's first module with a step
whose `exercisedAtoms` names it, diffs against `fromModule`.

- **Positive controls:** population guard (>400 exercised atoms; actual 515)
  and the hand-verified ちち row (tag m8, first exercised m17,
  `ja-m17-neo-1`) must appear.
- **Measured (twice, identical): 240 mismatched atoms of 515 exercised —
  196 early-tag, 44 late-tag.**
  - EARLY-TAG (fromModule earlier than the live course teaches it): the
    comprehensibility gate and D2 believe the learner knows the word before
    any live lesson teaches it — B070's mechanism, systematized. Worst
    offenders (|drift| top of table): おかね m5→m27, へや m6→m27,
    ビール/テレビ m11→m30, ひろい/みじかい/おそい/ながい m8→m27,
    ひるごはん m11→m30, ペン m12→m30, ラーメン m12→m30, あに m3→m17.
  - LATE-TAG (exercised before its claimed home): D2 never writes in the
    real home module; fallback unlock late/never — B068-residual mechanism.
    Worst: かう m25→m5, きく m24→m5, たべもの/のみもの m21→m5.
- **Ratchets:** early ≤ 200, late ≤ 50 (headroom over 196/44 because the
  m11 pack wave legitimately moves these numbers mid-flight; tighten to the
  measured values once the wave lands). Full table:
  `STALE_REPORT=1 npx vitest run fromModuleDrift` →
  `/tmp/ja-frommodule-drift.txt` (240 rows, sorted by |drift|).
- Per prior ruling, `courseAtoms.ts` was NOT mass-edited — the pack wave
  re-homes per pack; this table is its worklist and the ratchet its floor.

Top-30 (from the sorted dump; direction / word / tag vs live / first lesson):

```
early ちち        m8 →m17  ja-m17-neo-1     early おかね  m5 →m27  ja-m27-neo-2
early へや        m6 →m27  ja-m27-neo-3     late  かう    m25→m5   ja-m5-neo-3
early ビール      m11→m30  ja-m30-5-2       early テレビ  m11→m30  ja-m30-5-2
early ひろい      m8 →m27  ja-m27-neo-9     early ひるごはん m11→m30 ja-m30-story
early みじかい    m8 →m27  ja-m27-neo-9     late  きく    m24→m5   ja-m5-neo-7
early おそい      m8 →m27  ja-m27-neo-9     early ながい  m8 →m27  ja-m27-neo-9
early ペン        m12→m30  ja-m30-4-1       early ラーメン m12→m30 ja-m30-5-2
early あつい      m8 →m25  ja-m25-neo-2     early まいにち m11→m28 ja-m28-neo-2
early えいご      m9 →m26  ja-m26-neo-9     early くうこう m7 →m23 ja-m23-neo-5
early しごと      m12→m28  ja-m28-neo-1     late  たべもの m21→m5  ja-m5-neo-9
late  のみもの    m21→m5   ja-m5-neo-9      early じょうず m9 →m24 ja-m24-neo-7
early へた        m9 →m24  ja-m24-neo-9     early あに    m3 →m17  ja-m17-neo-2
early ちかい      m6 →m20  ja-m20-neo-2     early とおい  m6 →m20  ja-m20-neo-2
early どうして    m13→m27  ja-m27-neo-1     early さいふ  m14→m28  ja-m28-neo-10
early としょかん  m6 →m19  ja-m19-neo-1     early がっこう m6 →m19 ja-m19-neo-1
```

## 4. Detector C — constant drift (extended gate, checked in)

Every numeric claim in the process docs was located and diffed against its
exported constant:

| Claim | Doc | Code | Verdict |
|---|---|---|---|
| hiragana romaji off M7 / katakana M17 / tiles M5 | guide §4e, pedagogy, CLAUDE.md | `romajiAutoFlip.ts` 7/17/5 | in sync (already gated by `docReferences.test.ts`) |
| kanji recognition M8, furigana unlock+2 | same | `kanjiRollout.ts` 8/2 | in sync (gated) |
| target retention 0.90 | CLAUDE.md | `srs.ts` TARGET_RETENTION 0.9 | in sync (gated) |
| match-pairs floor | guide §1 "4", §4 "≥4" | `matchPairsFloor.ts` **6** | **DRIFT — fixed + NEW gate** |
| XP base/perfect/test/level 10/5/10/500 | CLAUDE.md | `xpRules.ts:9-13` | in sync — **NEW gate** |
| pinned invariant count | guide addendum "25" | 47 numbered invariants | **DRIFT — fixed + NEW gate** (count derived from the pinned file itself) |
| harvest window "point.module+2" | CLAUDE.md | `grammarReviewIndex.ts:52` = 2 | in sync (ungated — constant not exported; proposed) |
| module review stages +1/+3/+7/+14/+30/+90, graduate 5 | invariant 25 | `moduleReviewSchedule.ts:22-31` | in sync (ungated) |
| guide §2 "hard guards" test files | sub-lesson-density / atom-coverage / mcq-position | all three live ONLY in `curriculum/_archive/tests/` (excluded from the run) | **DRIFT — guide fixed to name the live bar** |
| `npm run authoring-audit` "→ scripts/authoring-audit.mjs" | authoring-workflow.md | script does not exist; npm maps to `authoringAudit.emit.test.ts` | **DRIFT — fixed** |

New gate: `src/__tests__/docClaimGuards.test.ts` (same matcher design as the
existing `docReferences.test.ts`, new file so the original stays untouched).

## 5. Detector D — retired shapes and terminology (grep + classification)

- `SM-2`: hits only in retention research + docs/README's note about the
  REMOVED doc — all historical-ok. (Instrument control: the grep does find
  those hits.)
- `KANJI_START_MODULE`: only the historical note in `kanjiRollout.ts` and
  the INDEX-flagged-stale kanji spec. OK.
- `M1–M27 / M28 capstone`: live-claim instance in guide §6 **fixed**;
  `curriculum-design-v2.md:10` banner still asserts "the shipped curriculum
  is M1–M27" inside its superseded marker (historical doc — reported only);
  the KO claims ("KO ships full authored M1–M27") are TRUE for KO.
- `comingSoon placeholders` as a current claim: `grammarReviewIndex.ts`
  rationale comment **fixed** (and the latent m30 `-neo-` filter gap
  documented there); `moduleConformance.test.ts:42` and
  `deriveModuleTestOut.test.ts:15` comments still carry the dead premise —
  reported (test files not modified per ground rules).
- `last-wins` kana-map claims: see top-10 item 9.
- `ja-mN-review-1/2` described as THE review-lesson shape: CLAUDE.md §SRS
  **fixed**; `reviewTailSrs.ts:15` and `LessonPage.tsx:593` comments still
  say it — reported (both files' regex/logic are correct; prose only).
- Deleted script names referenced by docs: one found
  (`scripts/authoring-audit.mjs`) — fixed. All other `scripts/*.mjs|py`
  doc references resolve to existing files (checked mechanically).
- Locales: zero module-number/romaji claims in en/es/ko locale files
  (en.json verified non-empty, 2460 keys).

## 6. Fixes landed this pass (code + docs)

- `CLAUDE.md` — katakana paragraph rewritten to live truth; §SRS review-id
  shape corrected.
- `docs/INDEX.md` — m28/m6 landmine bullet and "only m6 uses IR" row fixed.
- `docs/lesson-authoring-guide.md` — invariant count, module-shape bullet,
  match-pairs 4→6 (×2), §6 spine claim, §2 archived-guards warning, §4
  spot-step row, §14.3 register line, header context-doc pointers.
- `docs/authoring-workflow.md` — authoring-audit pointer.
- `src/features/lesson/dev/LessonStepPreviewPage.tsx` — atom-id typo.
- `src/features/languages/ja/grammarHelpers.ts`, `m21-neo.ts`, `m22-neo.ts`
  — last-wins comments corrected to first-wins+ruling-table.
- `src/features/lesson/data/grammarReviewIndex.ts` — dead rationale comment
  replaced; m30 harvest-filter gap documented in place.
- NEW tests (all green; full suite run once: 376 files passed, 3 skipped,
  8598 tests passed / 14 skipped, exit 0 — no failures to triage, the only
  noise is a happy-dom teardown AbortError after the run):
  `src/__tests__/staleLessonIdReferences.test.ts`,
  `src/__tests__/docClaimGuards.test.ts`,
  `src/features/languages/ja/__tests__/fromModuleDrift.test.ts`.

## 7. Graduate-to-CI: implemented vs proposed

**Implemented (in CI as of this commit):**
1. Dead-id data-tier ratchet (pin 26) + report mode — class 1/5 killer for
   NEW references; the report mode is the periodic-sweep tool
   authoring-workflow.md already mandates.
2. fromModule drift ratchets (196→pin 200 early / 44→pin 50 late) — class 2;
   the pack wave lowers per pack, exactly like the B068 pins.
3. Doc-claim guards (match-pairs floor, XP mirrors, invariant count) —
   class 3/6.

**Proposed (not implemented — reasons given):**
- Purge `LATE_PARTICLE_CLOZE_EXEMPTIONS` (82 dead entries) + re-derive
  `PARTICLE_INTRO_MODULE` from the neo spine; tighten to same-module per
  invariant 5. (Existing test file — audit ground rules forbade modifying it;
  also a behavior change needing a content pass on current late clozes.)
- Purge `ANTIPATTERN_MINIMAL_PAIR_GRANDFATHERED` + the dead Gate-8 allowlist
  entry in `moduleContentLints.ts` (same reason).
- Re-link or retire the old-course sections of `QaTestDrivePage.tsx`
  (needs curation: each dead link must be replaced by a live lesson that
  demonstrates the same ladder state).
- Unregister the off-map `ja-mN-kata` lessons (or a conformance test that
  every registered ja lesson is map-reachable or explicitly allowlisted as
  QA-only) — today 86 tokens' worth of retired lessons remain servable by
  deep link, register-polite old-course content included.
- Export `HARVEST_WINDOW_MODULES` and add it to the claim guards.
- INDEX-status-aware doc scanning: teach the dead-id scanner to read each
  doc's `**Status:**` header and auto-bucket STALE/HISTORICAL docs, so the
  live-claim list stops needing a hand-maintained path list.
- Split the authoring guide into shared core + per-language annexes (its own
  footer asks for this; most residual dead ids live in its old-course
  §13/§14 pattern sections).
- courseAtoms.ts comment refresh (2 remaining "LAST-WINS" argument blocks at
  ~1185/1243) — deferred because the file is contended by the m11 pack agent.

## 8. Could not verify / out of scope this pass

- `conjugationTables.ts` module-unlock levels vs the neo spine — not
  re-derived (no instrument built; the trainer tests check internal
  consistency, not spine alignment).
- Whether the placement bank's per-module skill mapping matches the NEO
  module themes beyond spot checks (m3 は/か rows do match) — needs a
  systematic bank↔spine diff.
- `spinePlan.ts` ↔ map consistency (SpinePlannerPage drives the map; assumed
  gated by its page test, not independently verified).
- visual-qa contracts/capture references — not scanned for staleness beyond
  the dead-id regex (no `ja-m*` dead hits appeared in `visualQaContracts.ts`,
  which is a scanner pass, not a proof its CONTRACT content is current).

## 9. Proposed backlog records (items.yaml deliberately not edited — contended)

```yaml
- id: B071
  title: fromModule drift — 240 atoms (196 gate-dishonesty / 44 unlock-blocker)
  severity: high
  evidence: fromModuleDrift.test.ts, /tmp/ja-frommodule-drift.txt 2026-07-29
  fix: pack wave re-homes per pack; ratchet pins 200/50 tighten as packs land
- id: B072
  title: QaTestDrivePage deep-links 22 dead old-course lessons
  severity: medium
  evidence: staleLessonIdReferences STALE_REPORT dump 2026-07-29
- id: B073
  title: retired ja-mN-kata lessons still registered (deep-linkable, off-map)
  severity: medium
  evidence: scanner registered-off-map bucket (86 tokens); mockLessons.ts KATA_* imports
- id: B074
  title: particleClozePlacement grandfather list 100% dead + old-course intro-module table
  severity: medium
  evidence: 164/164 dead tokens in LATE_PARTICLE_CLOZE_EXEMPTIONS; inv 5 wants same-module tightening
- id: B075
  title: grammarReviewIndex -neo- filter excludes ja-m30-* from harvest (latent)
  severity: low
  evidence: grammarReviewIndex.ts harvest filter; m30 ships 0 particle_cloze today
- id: B076
  title: mockCourse side-quest unlockAfter "ja-m2-complete" can never fire
  severity: low
  evidence: mockCourse.ts:190,199; id resolves to nothing (tiles are comingSoon anyway)
```
