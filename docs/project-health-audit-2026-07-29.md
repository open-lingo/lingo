# Project health audit — 2026-07-29

**Scope:** project-scale health sweep (docs vs reality, regression guards, dormant code, code-size hotspots, cross-repo drift, dependency health). Not a per-lesson content review. Read-only audit — no source/docs edited except this file. Working tree had a large volume of uncommitted, in-flight changes from four concurrent agents at audit time; that churn is expected under this project's fast-walk-loop pattern (per `docs/INDEX.md`) and is **not** itself a finding.

**Method:** five parallel research threads (one per lens below, lens 4+6 combined), each required to cite file:line or command+output for every claim and to positive-control any absence claim. Two threads (doc rot, dormant surfaces) independently converged on the same headline finding from different code paths, which is treated as corroboration below.

---

## Executive summary (ranked by risk)

1. **BLOCKER — CLAUDE.md's central orientation claim is false and would badly mislead a fresh agent.** It states "m8–m29 are `comingSoon` placeholders with zero lessons." In the live map (`src/shared/domain/mockCourse.ts`) every module m3–m29 is fully authored with real lessons (`status: "available"`), and the file's own comment at line 1041 says "N5 ENDS HERE. There are no comingSoon placeholders left in the N5 map." Independently re-derived by two separate research threads. See Lens 1, Finding 1.
2. **BLOCKER (already tracked, re-confirmed) — `buildSrsReviewLesson` is dormant.** No id in the live course map (`ja-mN-neo-review-*`) matches the regex (`ja-mN-review-[12]`) that gates its only call site. Matches backlog B069 exactly; re-derived independently with a positive-controlled call-chain trace. See Lens 3, Finding 1.
3. **MAJOR — kanji/romaji rendering correctness at m8+ has zero live test coverage.** 9 `it.skip` tests (including one guarding a named prior regression, "f67479f") are skipped because their m8+ fixtures were archived; the underlying behavior is real and currently unguarded by CI. See Lens 2, Task 4.
4. **MAJOR (unresolved question, not confirmed drift) — SRS `manualResetAt` field may not exist server-side.** Client's `SRSCardState.manualResetAt` (load-bearing per CLAUDE.md's merge-precedence rule) has no matching field in `lingo-core/app/srs/schemas.py`; whether it's dropped on sync or handled elsewhere was not verified. See Lens 5, Finding 2.
5. **MAJOR — `grammarHelpers.ts` (2054 lines) is both the largest logic file and the single most load-bearing file in the codebase (101 importers)**, yet carries no size/complexity guard and is not on anyone's radar as a hotspot. See Lens 4.
6. **MINOR — CI's Playwright coverage is narrower than INDEX.md implies.** A Playwright job does run in CI, but only an always-green public-routes subset; INDEX.md's "e2e is local/manual" undersells this distinction. See Lens 2, Task 3.
7. **MINOR — dependency lag on TypeScript (5.6→7.0), Vite (6→8), Tailwind (3→4, breaking config format).** Nothing broken today; Tailwind 4 is a real migration to plan for. See Lens 6.
8. **MINOR — no ESLint/Prettier anywhere in the repo (confirmed absence).** tsc + human review are the only automated gates; this is a known, accepted tradeoff (stated in CLAUDE.md) but its cost compounds with finding 5 (no automated complexity/dead-code signal on files like `grammarHelpers.ts`).
9. **NOTE (healthy) — regression-guard discipline is genuinely strong where checked.** 7 one-directional ratchets found and verified current; every sampled `status: fixed` backlog item that could be positively checked (B055, B060) has a named regression test; the TTS silent-audio bug class has unusually thorough, drift-resistant coverage.
10. **NOTE — backlog has no field linking a closed item to its regression test**, so 5 of 7 sampled `status: fixed` items could not be positively confirmed guarded (not confirmed unguarded either — genuinely "could not verify").

---

## Lens 1 — Doc rot

### Finding 1 (BLOCKER): CLAUDE.md's course-status claim is false

**Claim (CLAUDE.md, "Last-verified: 2026-07-17", Orientation section):**
> "m3–m7 are authored (`ja-m*-neo-*`); m8–m29 are `comingSoon` placeholders with zero lessons. A learner past m7 hits 'content not yet authored.'"

**Measured truth:** `src/shared/domain/mockCourse.ts:271-1081` shows every module m3 through m30 populated with real, `status: "available"` lessons — e.g. m8: 16 lessons, m28: 13 lessons (`mockCourse.ts:983-999`, ids `ja-m28-neo-1..11` + three reviews + a challenge), m29: 13 lessons (`mockCourse.ts:1018-1043`, capstone module). `grep -n "comingSoon" src/shared/domain/mockCourse.ts` returns hits only on `sideQuests` entries (lines 172, 183, 192, 201, 210, 1447, 1455, 1464, 1473) — never on a course module. The file's own comment at `mockCourse.ts:1041` states: *"N5 ENDS HERE. There are no comingSoon placeholders left in the N5 map — m29 is the last tile of the spine."* Directly re-verified in this session (see command output above, same result).

**Corroboration:** two independent research threads (doc-rot lens and dormant-surfaces lens) reached this finding from different code paths and cross-confirmed each other without coordination.

**Owner action:** rewrite the CLAUDE.md Orientation bullet to state the spine is fully authored through m29 (m30 is the N4-tier module, deliberately not registered as a transit station per `mockCourse.ts:1057-1059`).

**Severity:** blocker — this is the single most-read doc in the repo and the specific claim a fresh agent would use to decide whether authoring work is needed past m7. As written, it would cause an agent to either duplicate already-finished work or distrust the live map.

### Finding 2 (minor): PROJECT_STATE.md is even more stale, but already quarantined

`docs/PROJECT_STATE.md` (self-dated 2026-07-16) claims *only m3 is authored; m4–m29 are comingSoon* — an even older/wronger snapshot. It self-flags `**Status:** STALE`, and `docs/INDEX.md` explicitly routes readers away from it ("do NOT treat it as authoritative on register, kanji, or the JA rewrite"). Risk is contained to agents who skip INDEX.md's routing table. Severity: minor.

### Finding 3 (note — accurate): kanji/romaji constants match code exactly

CLAUDE.md's prose ("hiragana at M7, katakana at M17, build-tile fade at M5"; "KANJI_RECOGNITION_MODULE=8"; "furigana window unlock+2") checks out exactly against the exported constants:
- `HIRAGANA_ROMAJI_OFF_MODULE = 7`, `KATAKANA_ROMAJI_OFF_MODULE = 17`, `BUILD_TILE_ROMAJI_FADE_MODULE = 5` — `src/shared/settings/romajiAutoFlip.ts:22,23,33`
- `KANJI_RECOGNITION_MODULE = 8`, `FURIGANA_WINDOW = 2` — `src/features/languages/ja/secondScript/kanjiRollout.ts:42,53`

No rot here. Severity: note.

### Finding 4 (note — accurate): `_archive` exclusion holds

`tsconfig.json:28` excludes `src/features/languages/**/curriculum/_archive`; `grep -rln "curriculum/_archive" src/` returns zero hits (positive-controlled against a real import pattern, `courseAtoms`, which returns 3 files with the same grep shape). CLAUDE.md's claim that `_archive` is excluded and imported by nothing holds. Severity: note.

### Finding 5 (note — accurate): INDEX.md's B068 ratchet numbers are current

`docs/INDEX.md`'s cited numbers (234 / 226) match `src/features/lesson/data/lessonAtomAttribution.test.ts:145,174` exactly (`MAX_DANGLING_ATTRIBUTIONS = 234`, `MAX_GRADED_NEVER_UNLOCKABLE = 226`). Severity: note.

---

## Lens 2 — Regression guards

### Ratchet inventory (all verified current, file:line + value)

| Constant | Location | Value | Guards |
|---|---|---|---|
| `MAX_DANGLING_ATTRIBUTIONS` | `lessonAtomAttribution.test.ts:145` | 234 | unresolvable `introducedByLessonId` values |
| `MAX_GRADED_NEVER_UNLOCKABLE` | `lessonAtomAttribution.test.ts:174` | 226 | B068-class atoms graded but never unlocked |
| `MAX_NEVER_GRADED` | `atomExposureAudit.test.ts:36` | 220 | atoms registered but never graded |
| `MAX_NEVER_TOUCHED` | `atomExposureAudit.test.ts:52` | 96 | atoms never appearing anywhere |
| `MAX_GRADED_BUT_NEVER_WRITES` | `atomExposureAudit.test.ts:56` | 37 | atoms graded but no SRS write |
| `MAX_SWITCHOVER_MISSES` | `kanjiRollout.ts:116`, asserted `switchoverBeat.test.ts:235` | 1 | kana↔kanji switchover-beat miss tolerance |
| `MAX_SWITCHOVER_BEATS_PER_REVIEW` | `kanjiRollout.ts:133`, asserted in `switchoverBeat.test.ts:155` + `switchoverBeatIntegration.test.ts:75` | 2 | switchover beats per review session |

All seven are one-directional ratchets (`toBeLessThanOrEqual`/`toBe`, with "only goes DOWN"-style comments).

**Exemption lists** (same regression-guard family): `GATE_EXEMPTIONS` (`grammarReviewPools.test.ts:125`), `POOL_GAP_EXEMPTIONS` (same file:347), `GRAMMAR_PLANNED_EXEMPTIONS` (`moduleConformance.test.ts:59`), `LATE_PARTICLE_CLOZE_EXEMPTIONS` (`particleClozePlacement.test.ts:34`), `PRE_EXISTING_OVERSUPPLY_EXEMPTIONS` (`buildTileFloor.test.ts:84`, currently empty — a ratchet at floor zero).

**Severity: note (healthy).** Owner action: none required; this is a pattern worth citing as a model for other subsystems.

### Fixed-bug classes checked for regression coverage

Sampled all 7 `status: fixed` backlog items (`grep -c "status: fixed" docs/backlog/items.yaml` → 7: B007, B008, B011, B020, B023, B055, B060).

- **B055** (clause-opening topic behind `。` undroppable) — **guarded**: `src/features/languages/ja/jaAcceptedForms.test.ts:173`, reproduces the exact reported case.
- **B060** (35 non-N5 kanji glyphs wrongly in exposure tier) — **guarded**: `applyKanjiSurfaces.test.ts:211,238`.
- **B007/B008/B011/B020/B023** — **could not verify.** The backlog schema (`docs/backlog/README.md`) has no field linking a closed item to its regression test; prose-grepping terse minor fixes is unreliable. This is reported as "could not verify," not as an absence.

**Cross-checked landmines named in CLAUDE.md/INDEX.md (not backlog items):**
- srsSync dedup-abort bug — guarded: `srsSync.test.ts:257`.
- `introducedByLessonId` re-attribution landmine (ばんごはん near-orphan) — guarded: `lessonAtomAttribution.test.ts` ratchets + `courseAtoms.test.ts:58`.
- TTS emitter silent-skip bug class — guarded unusually well: `audioCoverage.test.ts:1-33` opens with a comment enumerating five distinct silent-audio bug classes that shipped before the test existed, and tests from the *rendering* side specifically because the emitter's source-pattern side keeps drifting.

**Finding (minor):** backlog schema has no test-traceability field. Suggested action: add an optional `guard:` field (test file + test name) to closed items going forward.

### CI

`.github/workflows/ci.yml` (read in full): job `test` runs `npm ci` → `npx tsc --noEmit` → `npm run test:run` → `npm run build`. No lint step. Job `mobile-e2e` runs Playwright but only `npm run test:mobile` gated `MOBILE_PUBLIC_ONLY=1` — an always-green public-route subset, because CI has no valid Auth0 `storageState`; the authed matrix is explicitly local-only.

**Finding (minor):** `docs/INDEX.md`'s claim "Playwright e2e and Gate 10 visual QA are local/manual" is directionally right but imprecise — a Playwright job *does* run in CI, just restricted to public routes. Suggested correction: "CI runs tsc+vitest+build, plus a Playwright mobile-render-gate restricted to public routes (auth-gated flows are local-only); Gate 10 visual QA is local/manual." `../lingo-core/.github/workflows/ci.yml` exists but its contents were not read (out of this audit's scope) — could not verify what it runs.

### Skipped tests

`it.skip`/`describe.skip`/`.todo(` — 13 sites, two categories:
- **4 env-gated report printers** (`kanjiCoverageAudit.test.ts:284`, `emitTtsDeck.test.ts:74`, `learnerView.emit.test.ts:243`, `buildTileDistractorAudit.test.ts:109`) — `it.skipIf(!process.env.X)`, intentional diagnostics, not a coverage gap.
- **9 true `it.skip` sites**, all with the identical dated rationale ("DORMANT since the 2026-07-26 ARCHIVE ... module that no longer exists in the course (it ends at m7) ... Re-enable as each module is authored — the behaviour is real, the fixture is gone"):
  - `applyKanjiSurfaces.test.ts:476` — m8/m9/m10 furigana-window behavior
  - `moduleConformance.test.ts:163` — atom-to-module attribution for m3–m7
  - `renderSmoke.test.tsx:238,271,325,342,440` — 5 tests: hiragana/katakana romaji-off, kanji-recognition-module rendering, `kanji_reading` step at m29, and a filler-segment fake-reading regression **explicitly named "f67479f regression"**
  - `visualQaContracts.emit.test.ts:30,48` — m8 lesson contract shape, kanji_reading furigana-forbidden contract

**Finding (major):** every skip is documented (good discipline), but the practical effect is that **kanji-recognition rendering, romaji-auto-off behavior, and a previously-shipped regression (f67479f) currently have zero live CI coverage**, because those skips predate this same audit's Lens-1 finding that m8+ is now fully authored — i.e., **the premise for skipping these ("the fixture is gone, m8+ isn't authored") is itself now stale**, per Finding 1 above. These tests are very plausibly re-enableable today. Owner action: re-check whether these 9 skips can now be un-skipped against the live m8–m29 content; if so this is a quick, high-value fix given the named prior regression they guard.

### Test scale (context only)

`find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l` → 408 test files.

---

## Lens 3 — Dormant surfaces

### Finding 1 (blocker, matches B069, re-confirmed): `buildSrsReviewLesson` is dormant

Single production call site: `src/features/lesson/data/mockLessons.ts:757`, inside `getMockLessonContent`, gated by `/^ja-(m\d+)-review-([12])$/.exec(lessonId)` (line 747). Every review-lesson id actually present in the live map follows the pattern `ja-mN-neo-review-{1,2,3}` (e.g. `ja-m7-neo-review-1` at `mockCourse.ts:372`, `ja-m29-neo-review-1` at `:1032`) — the `-neo-` infix means none match the bare regex. `grep -noE '"ja-m[0-9]+-review-[12]"' src/shared/domain/mockCourse.ts` and the same against `mockLessons.ts` both return empty.

**Positive control:** identical call-chain grep applied to known-live `unlockLessonAtoms` finds 9 real call sites incl. `LessonPage.tsx:398` (invoked on every lesson completion). Methodology confirmed sound before applying it to the dormancy claim.

**Caveat:** `getMockLessonContent` is also reachable via the raw URL param route `lessons/:lessonId` (`App.tsx:480`) — a hand-typed URL could still hit the dead branch. This is manual deep-link reachability only, not anything a learner reaches through navigation.

No new information beyond B069 in the backlog — re-confirmed with fresh, independent evidence. Severity: blocker (already tracked).

### Finding 2 (note — not dormant): comingSoon / side quests

`SideQuestCard` renders live at `LearnTopBar.tsx:7,76`; `QuestsCardBody` at `LearnSidebar.tsx:6,50`, both under routed pages. `comingSoon: true` in `mockCourse.ts` applies only to a handful of Korean side-content tiles (lines 172-210, 1447-1473), rendering inert-but-visible — not a dormant-quest-system issue. (Separately, backlog **B066** documents that ja side quests specifically are inert for a different, already-tracked reason: `comingSoon: true` on every ja quest entry plus empty `SIDEQUEST_TO_LESSON`/`SIDEQUEST_TO_ROUTE` maps in `LearnPage.tsx`/`TransitLearnPage.tsx` — verified independently by that backlog item 2026-07-29, not re-derived here.)

### Finding 3 (minor, matches B070, re-confirmed): retired `-kata` rows registered but orphaned

`katakanaRows.ts` defines legacy rows `ja-m4-kata` … `ja-m12-kata` (lines 94-196), registered as literal `LESSONS` keys (`mockLessons.ts:521-529`). They do not appear anywhere in the live navigable map — grep for those literal ids in `mockCourse.ts` returns nothing; the live map uses different, newer ids (`ja-m7-neo-kata-a`, `ja-m8-neo-kata-sa`, etc., `mockCourse.ts:368-483`). Matches `docs/decision-brief-2026-07-29.md:25-33` (B070) exactly, independently re-derived. Deep-linkable via `lessons/:lessonId` but not reachable through navigation. Severity: minor (already an open, tracked decision).

### Finding 4 (note — clean): `_archive` exclusion confirmed

Same result as Lens 1 Finding 4 — `tsconfig.json` excludes it, zero external importers, positive-controlled against a known-live import (`m6-neo`, 10 hits).

### Finding 5 (note): no other dormant surfaces found

Checked `lessonDraftStore.ts` (3 live importers), `storyDraftStorage.ts` (1 live importer via routed `StoryEditor.tsx`) — both actively used. `/ja/qa/*` dev pages are routed (`App.tsx:525-532`) but are intentionally internal dev tooling, a different category from "dormant," not scored here. No additional exported-but-unimported module found among draft/v2/legacy-named candidates checked.

---

## Lens 4 — Code health hotspots

### Top files by LOC (excluding `_archive/`, which is separately tsconfig-excluded and would otherwise dominate — its files run 2500-3000+ lines each, e.g. `curriculum/_archive/m17.ts` at 3006 lines)

```
3029  src/features/languages/ko/frequencyAtoms.ts
2415  src/features/languages/ja/curriculum/m30.ts
2252  src/features/learn/TransitLearnPage.tsx
2054  src/features/languages/ja/grammarHelpers.ts
1963  src/features/lesson/data/moduleCompiler.ts
1864  src/features/languages/ja/curriculum/m3-neo.ts
1750  src/shared/domain/mockCourse.ts
1644  src/features/languages/ja/secondScript/n5Kanji.ts
1552  src/features/lesson/data/hiraganaCurriculum.ts
1547  src/features/languages/ja/curriculum/m5-neo-a.ts
1543  src/features/languages/ja/courseAtoms.ts
1542  src/features/languages/ja/conjugationTables.ts
1514  src/features/languages/ja/curriculum/m5-neo-b.ts
1499  src/features/languages/ja/curriculum/m4-neo-a.ts
1467  src/features/languages/es/curriculum/m13.ts
```
(`find src -name '*.ts' -o -name '*.tsx' | grep -v -E '\.(test|spec)\.' | grep -v '_archive' | xargs wc -l | sort -rn | head -20`)

### LessonPage — the flagged "god file"

`src/features/lesson/LessonPage.tsx`: **1084 lines** (`wc -l`) — confirms CLAUDE.md's flag, though not top-15 by raw size (the larger files above are mostly content-data volume, not logic complexity).

### Import fan-in (load-bearing measure) for top offenders

| File | Fan-in | Notes |
|---|---|---|
| `grammarHelpers.ts` | **101** files | 2054 LOC. Largest logic file AND most load-bearing file found in the codebase by this measure. |
| `mockCourse.ts` | 90 | 1750 LOC, course-map backbone (consistent with its described role) |
| `courseAtoms.ts` | 89 | 1543 LOC, atom registry backbone |
| `moduleCompiler.ts` | 37 | 1963 LOC |
| `LessonPage.tsx` | 27 | 1084 LOC, lazy-imported at `App.tsx:69` |
| `n5Kanji.ts` | 9 | 1644 LOC |
| `TransitLearnPage.tsx` | 2 | 2252 LOC |

**Finding (major):** `grammarHelpers.ts` combines the largest size among logic (non-data) files with by far the widest fan-in (101 importers) of anything measured — any change ripples the widest through the codebase, yet it carries no size/complexity guard and doesn't appear as a hotspot in any doc or backlog item checked. This is a bigger structural risk than the already-flagged `LessonPage.tsx` (27 importers), and is not currently on anyone's radar per the backlog area sweep (0 tooling/code-health items reference it). Suggested owner action: consider it a split candidate before further additions; at minimum, track it explicitly.

### ESLint/Prettier

Confirmed absent: `grep -n '"eslintConfig"\|"lint"\|prettier' package.json` → no output; `find . -maxdepth 1 -iname '*eslint*' -o -maxdepth 1 -iname '*prettier*'` → no output. Matches CLAUDE.md's stated position exactly. **Cost:** `tsc -b` (type errors only) and human review are the sole automated backstops — no automated catch for unused imports, formatting drift, or accidental complexity growth (e.g., the hotspots above). Severity: minor/note — a known, accepted tradeoff, but its cost compounds with the `grammarHelpers.ts` finding above (no automated signal would have flagged that file's growth).

---

## Lens 5 — Cross-repo drift risk

`../lingo-core` confirmed to exist (`/Users/lichfield/Documents/projects/lingle/lingo-core`, contains `app/`, `docs/`, etc.).

### XP economy

Client (`src/features/progress/xpRules.ts:9-13,20-30`):
```
XP_LESSON_COMPLETE = 10
XP_PERFECT_BONUS = 5     // additive
XP_TEST_BONUS = 10       // additive
XP_PER_LEVEL = 500
expectedXp() = 10 + (test?10:0) + (perfect?5:0)
```
Server (`lingo-core/app/platform_settings/schemas.py:27-64`):
```python
lesson_pass_xp: int = 10
lesson_perfect_xp: int = 15    # TOTAL override for a perfect pass, per docstring — NOT a bonus
lesson_test_bonus_xp: int = 10 # additive
```
Server computation (`lingo-core/app/progress/router.py:409-419`): `xp_earned = lesson_perfect_xp if score>=0.999 else lesson_pass_xp`, `+= lesson_test_bonus_xp` if test lesson.

**All four cases currently agree numerically** (pass 10=10; perfect 15=10+5; test 20=10+10; perfect+test 25=10+5+10) **but the two sides compute it via structurally different models** — server treats `lesson_perfect_xp` as an admin-tunable override total (its own docstring warns admins not to set it below `lesson_pass_xp`, "isn't blocked at the schema level"); client treats it as a fixed additive bonus. If an admin retunes `lesson_perfect_xp` via the live config, the client's pre-sync estimate silently diverges from the server-authoritative award — expected/tolerated per both CLAUDE.md files ("client mirrors defaults, server is authoritative"), but the structural mismatch is a latent trap for the next retune. Severity: minor.

**Level curve:** `XP_PER_LEVEL = 500` matches server `lingo-core/app/progress/xp.py:26`. **Separately (in-repo, not cross-repo) finding:** this constant is redefined locally in 3 more client files instead of imported from `xpRules.ts` — `useHomeVariantData.ts:30`, `RestructuredHome.tsx:37`, `useUserStats.ts:25`. Currently all agree (500) but four independent copies is a duplication risk. Severity: note.

### SRS card shape

Client (`src/features/flashcards/data/types.ts:110-169`) and server (`lingo-core/app/srs/schemas.py:8-41`) `SRSModalityState`/`SRSCardState` field names and types match exactly (both literally named `SRSCardState`/`SRSModalityState`, per CLAUDE.md's "backend schema mirrors this shape" note).

**One asymmetry found:** client's `SRSCardState.manualResetAt?: string` (`types.ts:168`) has **no matching field** in the server Pydantic model (`schemas.py:22-41`, full field list checked, absent). CLAUDE.md states this field is load-bearing: "A deliberate card-manager reset stamps `manualResetAt`; only marked resets beat server state in merge... don't 'simplify' that away." Since the server model doesn't declare this field, a sync payload containing it will most likely have it silently dropped by Pydantic's default behavior (no `extra="forbid"` observed in the shown schema snippet) rather than rejected.

**Could not verify:** whether `manualResetAt` is handled elsewhere in the server (router logic, raw-dict path) — only `schemas.py` was checked, not `app/srs/router.py` or the persistence layer. This is flagged as an open question, not a confirmed bug. Severity: **major if unhandled server-side** (would silently break the documented merge-precedence invariant on any second-device sync), **note if intentionally local-only**. Suggested owner action: grep `lingo-core/app/srs/router.py` and the persistence layer for `manualResetAt` to resolve definitively.

### Quest config (bonus spot-check)

`src/features/quests/types.ts:16-77` vs `lingo-core/app/quests/schemas.py:1-70` (the server file's own docstring: "Mirrors `lingo/src/features/quests/types.ts`") — field names match exactly, server uses Pydantic camelCase aliases to present an identical wire shape. Healthy mirror, no action needed.

---

## Lens 6 — Dependency / build health

`package.json`: **no `engines` field present** (full file checked). Key deps: react `^19.2.4`, react-dom `^19.2.4`, react-router-dom `^7.0.1`, typescript `~5.6.2`, vite `^6.0.1`, tailwindcss `^3.4.15`, `@tanstack/react-query` `^5.62.0`, vitest `^4.1.6`, `@auth0/auth0-react` `^2.15.0`, i18next `^25.8.10`.

`npm outdated` (ran, read-only, actual output):
```
Package                     Current    Wanted   Latest
@auth0/auth0-react           2.15.0    2.22.1   2.22.1
@tanstack/react-query       5.90.21   5.101.4  5.101.4
@testing-library/jest-dom     6.9.1     6.9.1    7.0.0
@types/node                22.19.11   22.20.1   26.1.2
@vitejs/plugin-react          4.7.0     4.7.0    6.0.4
i18next                     25.8.10  25.10.10   26.3.6
lucide-react                0.575.0   0.575.0   1.27.0
react-i18next                16.5.4    16.6.6  17.0.11
tailwindcss                  3.4.19    3.4.19    4.3.3
typescript                    5.6.3     5.6.3    7.0.2
vite                          6.4.2     6.4.3    8.1.5
```
(plus minor patch-level lag on several others in the full output).

**Finding (minor):** notable major-version gaps confirmed from `npm outdated` output (not inferred): TypeScript 2 majors behind (5.6→7.0), Vite 2 majors behind (6→8), Tailwind 1 major behind (3→4 — a breaking config-format migration), `lucide-react` 0.x→1.0, i18next/react-i18next 1 major behind. None flagged as deprecated/EOL by npm itself in this output — "EOL" framing would be inference beyond what was checked; reporting version-lag only. Nothing currently broken. Tailwind 3→4 is the one worth proactively planning given its breaking config migration.

**Vitest full-run cost: could not verify.** Did not run the full suite per instructions. Searched `docs/*.md` for a documented timing (e.g. `dispatch-economics-log.md`, recent `srs-newcard-eval-2026-07-24.md`) — found only a targeted 2-file run's pass/fail count, not a duration, and no full-suite timing anywhere in `docs/`. (Note: a Mac perf-baseline doc referenced in the user's cross-session memory was not found as a repo doc — it appears to live outside this repo's `docs/`.)

---

## Lens 7 — What nobody is tracking

Cross-referenced every finding above against `docs/backlog/items.yaml` (queried via `node scripts/backlog.mjs --stats` / `--area`). Backlog currently has 70 records, only 3 tagged `area: tooling` (all `severity: note`, none about code health/CI/deps). Conservatively, items with no existing backlog coverage found anywhere in this sweep:

1. **`grammarHelpers.ts` as a structural risk (2054 LOC, 101 importers)** — no backlog item, no doc, references it as a hotspot. It is the single highest-fan-in file in the codebase and the largest non-content-data logic file. Nothing currently guards against it growing further or flags it for a split. (Lens 4.)
2. **The 9 dormant `it.skip` tests may now be stale-premised, not just stale-fixtured.** Their shared rationale ("m8+ isn't authored yet") is contradicted by Lens 1's finding that m8–m29 *are* authored. This means a plausibly-quick fix (re-enable and see what breaks) is sitting unactioned, and one of the 9 guards a named prior regression (f67479f). No backlog item references these tests by name. (Lens 2.)
3. **`manualResetAt` cross-repo status is an open, unresolved, load-bearing question** — CLAUDE.md calls it explicitly load-bearing for SRS merge correctness, but no backlog item or doc addresses whether the server schema actually carries it. (Lens 5.)
4. **Backlog itself has no test-traceability field**, so "was this actually fixed with a regression guard" is unverifiable for the majority of closed items by design of the schema, not by oversight in any one item. (Lens 2.)
5. **CLAUDE.md's course-status claim (Finding 1) is the kind of error the project's own `docs/INDEX.md` landmines section exists to prevent, but isn't in it.** INDEX.md's landmines list documents several doc/code mismatches (anki-import, xp-curve-design) but not this one, despite it being larger in blast radius than either.
6. **Four independent hardcoded copies of `XP_PER_LEVEL = 500`** — currently in sync, no test pins them together, so a future edit to one silently disagrees with the other three. Not cross-repo drift, but the identical failure mode, purely in-repo. (Lens 5.)
7. **No `engines` field in package.json** — with Node/npm version implicitly assumed rather than pinned, a contributor or CI runner on a different Node major could hit silent incompatibilities that wouldn't be caught by any check in this repo. Minor but genuinely untracked.

---

## Could not verify (full list)

- Whether backlog items **B007, B008, B011, B020, B023** (5 of 7 `status: fixed` items) have regression-test guards — the backlog schema has no traceability field and prose-grepping terse fixes is unreliable. (Lens 2.)
- **`../lingo-core/.github/workflows/ci.yml`** contents — file confirmed to exist, contents not read (out of this audit's directive scope). (Lens 2.)
- Whether the 9 dormant `it.skip` tests will in fact be re-enabled as modules are authored, or forgotten — no backlog cross-reference exists by test name. (Lens 2.)
- Whether `manualResetAt` is handled anywhere in the SRS system outside `lingo-core/app/srs/schemas.py` (router logic, persistence layer not checked). (Lens 5.)
- **Vitest full-suite run time** — not run per instructions; no documented timing found anywhere in this repo's `docs/`.
- Any EOL/deprecation status of outdated dependencies beyond what `npm outdated` itself reports (i.e., did not separately check each package's own deprecation policy). (Lens 6.)
