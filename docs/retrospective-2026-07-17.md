# Lingo retrospective — regressions, context rot, and the gates that prevent them

2026-07-17. Written after the N4 pilot (m29) QA session surfaced ~10 defects in one sitting.
Synthesis of three parallel audits (regression taxonomy, context-rot, code-health). `Status: LIVE`.

> **IMPLEMENTATION TRACKING (updated 2026-07-20).** This started as a read-only plan;
> much of it is now BUILT — do not re-fix shipped items. DONE: JA per-module content
> gates (`moduleBarGuards.ts` / `registerModuleBarGuards`), conformance extended past
> m27, `module-gate.mjs` + DOM-render gate, the pinned-invariants constraint block,
> and the orientation-doc staleness sweep (this 2026-07-20 pass). Live progress and
> remaining work are tracked in `rewrite-cycle-report-2026-07-20.md`. Check that report
> + the pinned invariants before treating any item below as still-open.

> **Partially reconciled 2026-07-20.** Several of these gates shipped *after* this doc was
> written — Gates 1, 2, 4 and the doc-references-code test are done (stamped inline below).
> See `docs/plan-code-reconciliation-2026-07-20.md` §2.7 for the verification. The still-open
> items (Gate 3, Gates 5/6/7/9/10, the guide split) remain as written.

---

## 1. Executive summary

**Headline metric: ~8 of the 10 m29 defects were catchable by an automated gate at author-time
(≈80%).** They reached manual QA only because the gates don't exist — or exist but don't cover
Japanese. This is the whole story: the defects weren't subtle, they were *unguarded*.

**Two root causes, one theme — "a convention that no machine enforces drifts, and the next
author copies the drift":**

1. **Japanese has no per-module content gates.** Spanish ships **17** per-module test files,
   Korean **26**, **Japanese zero** — and JA is where every m29 defect landed. The one JA
   conformance test hardcodes `module 3–27`, so m28 and **m29 (the exemplar every N4 module will
   copy)** are excluded from every invariant it checks.
2. **A major wave landed in code + one doc only.** The 2026-07-16 "script-ladder wave"
   (info-step purge, phrase_card shelved, romaji-off→m7, kanji→m8, N4 tier) updated the code and
   the authoring guide, but **every orientation doc** authors are told to read first
   (`CLAUDE.md`, `PROJECT_STATE.md`, `pedagogy-principles`, the kanji specs, `emoji-blocked-words`)
   still describes the pre-wave world. Agents followed stale guidance and authored banned steps
   while believing they were compliant.

**The single highest-leverage move** is Gate 1 + Gate 2 together (§4): extend conformance past
m27 **and** give JA the per-module test files ES/KO already have. That retroactively vets m29 and
makes every future copy of it conform-or-fail.

---

## 2. The defects, and whether a gate could have caught them

| # | Defect | Fix commit | Catchable at author-time? |
|---|--------|-----------|---------------------------|
| 1 | `parseModuleIndex` prefix mismatch → romaji ladder silently dead | `e503e2a` | **Yes** — round-trip unit + render smoke |
| 2 | `applyKanjiSurfaces` plural-key dead branch → MCQ kanji never rendered | `babc75d` | **Yes** — property test / render smoke |
| 3 | redundant "(plain)" tag on every option | `81ce834` | **Yes** — MCQ lint |
| 4 | same-verb-conjugation distractors (trivially -u-eliminable) | `5910e13` | **Yes** — distractor lint |
| 5 | echo-back + non-word distractors | `25b1f46` | **Yes** — distractor lint |
| 6 | plain/polite register ambiguity (valid answer marked wrong) | `0d57b51` | **Partial** — heuristic only |
| 7 | flat object-を-verb sentences ~30 modules in | `61877eb` | **Yes** — complexity ratchet |
| 8 | bare-word antiPatterns break the derived spot-the-mistake | `ded0850` | **Yes** — minimal-pair lint |
| 9 | `vocab()`/`phrase()` silently emit banned `phrase_card` | (guide) | **Yes** — source lint |
| 10 | grammar-tip modal fires from a skipped speaking step | `2d25ea6` | **Yes** — unit (added) |

Only #6 is genuinely hard to fully automate. **8/10 is the number.**

---

## 3. Regression taxonomy (5 classes)

**Class A — Parser / string-match brittleness (format drift).** One id format parsed by many
ad-hoc matchers; when the input drifts from what one matcher expects, it **silently returns a
falsy default** instead of failing. `parseModuleIndex` required a `ja-`/`ko-` prefix but
`moduleId` is bare `"m29"` → returned `0` everywhere (`romajiAutoFlip.ts:140`, fixed `e503e2a`).
The *same* `/^m(\d+)$/` parse is copy-pasted in **8 files**; `parseModuleIndex` was the one
divergent copy. Sibling: `applyKanjiSurfaces` `endsWith("Annotation")` never matched the plural
`optionAnnotations` → dead branch (fixed `babc75d`). **Highest blast radius — fails silently
course-wide, only surfaces in manual QA.**

**Class B — Convention-not-enforced drift.** A rule lives in prose but nothing checks it. Five of
the ten m29 defects (#3, #4, #5, #7, #8) plus #9 (`vocab()`/`phrase()` emit the banned
`phrase_card`, `grammarHelpers.ts:297,318`).

**Class C — Cross-consumer coupling.** One field/signal serving two masters. `optionAnnotations`
is display-only while option `id`/`word` are the grading/audio keys — and the very invariant
meant to police that seam (`withoutAnnotations` in `applyKanjiSurfaces.test.ts`) *shared the
identical plural blind spot as the bug*. #10: a *skipped* speaking step's `correct=false` flowed
through the same path as a *wrong answer*. Structural: **`mockCourse.modules` is one array
serving three masters** — the transit map, the pedagogical order, and SRS reachability via
`getAtomsUpToModule` (`lessonAtomIndex.ts:183` ← `module.ts:103-105`); a mistake there silently
mis-schedules review (`[]`, no error).

**Class D — Hardcoded-snapshot tests that mask regressions.** `toEqual([...long literal...])`
that break on benign growth (so authors rubber-stamp the update) and can't tell "added a module"
from "introduced a gap." The team is mid-migration away from these (good derived checks now at
`mockCourse.test.ts:158`, `moduleConformance.test.ts:191`), but brittle literals persist:
`presets.test.ts:26`, `adaptiveEngine.test.ts:174`, `kanjiCoverageAudit.test.ts:186`, a hardcoded
`Set(["m27"])` in `useGrammarReviewSession.test.ts`, and the `for n=3;n<=27` range in
`moduleConformance.test.ts:31`.

**Class E — No render-time / cross-content integration gate (the coverage void).** Both latent
infra bugs (#1, #2) were invisible to unit tests because they only manifest when *real content
flows through the real render/transform pipeline deep in the course*. Nothing renders m29 and
asserts "0 romaji" or "MCQ options show kanji." That category — the manual QA session's whole
job — has zero coverage.

---

## 4. The action plan — regression-prevention gates (the core deliverable)

Ranked by (frequency × blast-radius × ease). Each is implementable directly from this section.

### Tier 1 — do first (highest leverage)

**GATE 1 — Extend module-conformance past m27. ⭐ (effort: trivial, 1 line)**
✅ **SHIPPED (2026-07-20 reconciliation)** — `languages/ja/__tests__/moduleConformance.test.ts:44`
now derives `CONTENT_MODULE_IDS` from `jaModule.curriculum` (non-kana); the hardcoded `3–27`
range is gone. (One narrow residual `n <= 27` at line 153 gates a single "planned grammar point"
sub-check — minor.)
`moduleConformance.test.ts:31` hardcodes `for (n=3; n<=27)`, so m28/m29 are excluded from every
attribution invariant. Derive `CONTENT_MODULE_IDS` from `jaModule.curriculum` (non-kana) instead.
The existing "every atom attributed to mN appears in mN's steps" invariant then immediately vets
m29. **Caveat:** turning this on may reveal *existing* m8–m29 violations — surface them, fix as a
follow-up, don't auto-suppress.

**GATE 2 — JA per-module curriculum test files. ⭐ (effort: M; template exists)**
✅ **SHIPPED (2026-07-20 reconciliation)** — JA now has **28** per-module test files
(`ja/curriculum/m*.test.ts`). **The central "JA has 0 per-module tests" claim of this
retrospective (also stated in §1) is REVERSED** — the asymmetry it describes is closed.
ES has 17, KO has 26, JA has 0. Clone `es/curriculum/m5.test.ts` → `ja/curriculum/m29.test.ts`,
then backfill m3–m28. It runs follow-up-spacing, no-explanation-on-passive, explanation-doesn't-
leak-answer, unique-ids, pathway-resolves, mastery-graded-only, and the listening sentence-level
ratchet — **none of which run for any JA module today.** This file is also the home for gates 4–7.

**GATE 3 — One canonical `moduleId` parser + branded type. ⭐ (effort: low-M) — kills Class A**
(a) Make `parseModuleIndex` (now accepts `m29`/`ja-m29`/`ja-m29-1-1`) the *only* parser; delete
the 8 duplicate `/^m(\d+)$/` copies and the `ja-`-hardcoded variants. (b) Add a `ModuleId` branded
type so tsc rejects raw-string parsing. (c) A **round-trip table test**: for every `moduleId`
actually in the curriculum, assert `parseModuleIndex(moduleId) > 0` — one assertion that catches
#1 directly. (d) A source-lint freezing the count of `/\bm\d/`-style regex literals outside the
canonical module, so no 9th copy is added.

**GATE 4 — Extend `atom-coverage` to the full spine. ⭐ (effort: low) — Class B + doc-truth**
✅ **SHIPPED (2026-07-20 reconciliation)** — `features/lesson/data/atom-coverage.test.ts:419` is
the full-spine `m3–m29` re-exposure gate: every SRS-eligible vocab atom introduced in m3–m29 must
appear in ≥3 audited retrieval surfaces (keyed on `JA_COURSE_ATOMS`, walking every JA lesson).
`atom-coverage.test.ts` imports only m3–m7 (0 m8+ imports), yet the guide presents ≥3-occurrence
coverage as enforced everywhere. Every atom in m8–m29 is currently unguaranteed. Extend the import
set to m8–m29. (Same caveat as Gate 1 — may reveal existing gaps.)

### Tier 2 — content-quality lints (live in the Gate-2 per-module files)

**GATE 5 — MCQ distractor-quality lint. (effort: M) — catches #3, #4, #5.**
`assertMcqOptionsDiscriminate(step)` in `curriculumAssertions.ts`: (a) no two options equal after
stripping a *shared* trailing parenthetical (catches the "(plain)" tag); (b) no distractor
string-equals the prompt/correct word (echo-back); (c) distractors resolve to real atoms with
`fromModule ≤ module` (catches non-words like のむます); (d) *heuristic* — not all distractors
share the correct answer's lemma when the taught discriminator is the ending. (a)–(c) high-
confidence, (d) fuzzy.

**GATE 6 — Grammar antiPattern minimal-pair lint. (effort: low) — catches #8.**
`assertAntiPatternIsMinimalPair(step)`: `antiPattern.ja` token-count within ±1 of `examples[0].ja`
and differing in exactly one token. This is the invariant `deriveGrammarMicroSteps.spotStep`
(`:57`) *assumes but never checks* — a textbook Class-C coupling.

**GATE 7 — Sentence-complexity ratchet for JA. (effort: M) — catches #7.**
ES already ratchets listening to sentence-level (`m5.test.ts:93`). Add the JA analog: at module
N ≥ threshold, production targets carry ≥1 modifier/clause, not bare `objectを verb`. Codifies
guide §4g (currently "not yet a machine gate").

**GATE 8 — `phrase_card` construction guard. (effort: S) — catches #9.**
Source-lint asserting no raw `type: "phrase_card"` literal in `curriculum/**` (must go through a
helper), making the "banned constructor" rule mechanical not tribal.

### Tier 3 — the coverage void

**GATE 9 — Render-integration smoke on the exemplar. (effort: M-L) — catches #1 & #2 at the QA
vantage.** A happy-dom test mounting m29's lessons through the real renderers + `applyKanjiSurfaces`
+ romaji gate, asserting (a) zero romaji nodes when romaji-off-by-module applies, (b) MCQ option
surfaces show kanji past unlock. The only gate that reproduces the manual-QA viewpoint; the
category with zero current coverage.

**GATE 10 — Register-consistency lint. (effort: M, partial) — the hardest, #6.** For plain-only
production steps whose prompt carries no register cue while a polite twin exists in the pool, warn.

---

## 5. Context rot — stale docs that actively mislead

Root cause: the 2026-07-16 wave landed in code + the authoring guide only. Ranked by likelihood of
causing a defect.

**Critical (authoring against these produces a conformance failure):**
- `docs/emoji-blocked-words-2026-05-18.md` (lines 25,26,33,40,43,46,53,60) — repeatedly says teach
  ja blocked words "via `phrase_card`" (banned). `CLAUDE.md:72` names this the ja authoring
  workflow, so it's load-bearing.
- `lesson-authoring-guide.md:327` (§7), `:442,444` (§13.1 rubric), `:483` (§13.3) — still prescribe
  `phrase_card`, and unlike §3/§9/§13.5 these carry **no stale-marker**. The guide re-seeds the
  very defect its own §4b2 bans.
- `docs/es-course-spine-2026-07-13.md` — "6–9 steps, no grammar_rule/selfExplain, phrase-card
  intros" — superseded by the es remediation (now 18–22 steps, enforced by `es-quality.test.ts`),
  no supersede banner; following it fails es CI.

**High (wrong numbers propagate):**
- **Romaji cutoff wrong in 5 docs.** Code: `HIRAGANA_ROMAJI_OFF_MODULE = 7`. Guide §4e is correct,
  but `CLAUDE.md:60,88`, `PROJECT_STATE.md:88`, `pedagogy-principles:31` (bundled into *every*
  authoring dispatch), and `katakana-rollout-*:20` all say M10/M17. Single most-replicated stale
  fact.
- **Kanji "deferred/off" in 3 docs** (`kanji-implementation-spec:11,22`, `CLAUDE.md:50`) vs
  actually **live at m8** and shipped in m29.
- `n5-content-spec-2026-05-25.md:92-98` (a named SoT) describes kanji via `kanji_intro`/
  `kanji_recognition` step types that **don't exist**, with SRS-state furigana fade that isn't how
  it shipped (module-window unlock+2).

**Medium (inside the guide):**
- §4f says `kanji_reading` is "pinned in UNUSED_STEP_TYPES — unpin when shipped" — it's **not**
  pinned and **is** shipped (23 uses). Note is already-done and reads as if the step is unusable.
- §6 says "shipped spine is M1–M27" while §4g (same guide) calls m29 the N4 exemplar.

**Also stale, unbannered:** `PROJECT_STATE.md` (the claimed SoT, never absorbed the wave),
`info-step-audit-2026-07-16.md` (reads as a live inventory of 862 info steps that are now 0),
`curriculum-audit-vs-research-2026-05-21.md` (2-month snapshot presented as current). 48 dated docs
in `docs/`, 26 from 2026-07, many superseded within days; `README.md:5` mandates a pruning sweep
that isn't happening.

### Guide split — warranted, do it
The guide is 809 lines and ~1/3 "ja: OMIT" annotations (its own closing note concedes the limit).
Split into:
- **`lesson-authoring-guide-core.md`** (universal): density contract + the four hard guards,
  retrieval-over-reread, compounding review, the five author mistakes, distractor plausibility,
  self-explain placement, atom-registry discipline, SRS-grading-is-review-only, story structure;
  step-type cheat sheet as a table with a per-language "allowed?" column instead of prose bans.
- **`annex-ja.md`**: info-ban + ends-gradeable, phrase_card-zero + how to intro vocab without it,
  the script ladder, `kanji_reading`, sentence-complexity floor, particle-cloze window, listening-
  sentence-first, the m8/N4 map.
- **`annex-es.md`**: the 18–22-step/selfExplain/compounding contract (currently stranded in dated
  docs); info/phrase_card/agreement_cloze legitimate here.
- **`annex-ko.md`**: ko still ships info/phrase_card; conjugation phase-1 status.

### Doc hygiene
1. **`Status:` front-matter on every doc** — `LIVE | SUPERSEDED-BY:<path> | SHIPPED(archival) |
   RESEARCH-SNAPSHOT` + a `Last-verified:` date. A recon doc is born archival; stamp it so
   day-old readers don't treat it as spec.
2. **A `doc-references-code` test (highest-ROI hygiene item).** ✅ **SHIPPED (2026-07-20
   reconciliation)** — `src/__tests__/docReferences.test.ts` machine-checks the script-ladder
   constants (`HIRAGANA_ROMAJI_OFF_MODULE`, `KATAKANA_ROMAJI_OFF_MODULE`,
   `BUILD_TILE_ROMAJI_FADE_MODULE`, `KANJI_RECOGNITION_MODULE`, `FURIGANA_WINDOW`, and now
   `TARGET_RETENTION`) across CLAUDE.md + the guide + pedagogy-principles + 2 more, and enforces
   Status front-matter on a 10-doc list. Grep the guide + CLAUDE.md +
   pedagogy-principles for the ladder constants (`HIRAGANA_ROMAJI_OFF_MODULE`,
   `KANJI_RECOGNITION_MODULE`, `FURIGANA_WINDOW`, density 12/25) and assert they equal the exported
   values. Would have caught the M10/M17 drift the day it happened.
3. **Index dated docs with status; monthly sweep** moving SHIPPED/SNAPSHOT docs to `archive/`.
4. **One SoT for the module map** — name it, banner the other three (`n5-content-spec`,
   `curriculum-design-v2`, `PROJECT_STATE`) as pointers.

---

## 6. Code health & optimization

**Structural risk:**
1. **Module-order double-duty (Class C, high).** `mockCourse.modules` = transit tree = pedagogical
   order = SRS reachability. Add an assertion that curriculum ids ⊇ every `moduleId` produced, or
   derive the orders from a shared explicit list. (`lessonAtomIndex.ts:183`, `module.ts:103`.)
2. **`stripBuildSentenceSteps` dead + latent id-bug.** `BUILD_SENTENCE_SUNSET_MODULES` is empty so
   the path is inert; when re-armed it parses `/^(.+)-review$/` against bare `"m5"` moduleIds → the
   seed no-op class waiting to happen. Fix or delete. (`mockLessons.ts:957-973`.)
3. **Fragile verb heuristic** `glossLooksLikeVerb` = `startsWith("to ")` (`jaSurfaceForms.ts:91`) —
   silently yields zero inflection keys for verbs glossed "can do", "understand", etc.

**Quick wins (S):**
- Six zero-caller dead exports inflating `grammarHelpers.ts` (1,760 LOC): `pickReviewAtomsWeighted`,
  `getKanjiByCategory`, two EXAMPLE_* fixtures, the ja `infoStep`, `dialogueLesson` (tests only).
- `fill_blank` generation path is computed then shadowed (`mockLessons.ts:515-574`) — no shipped
  lesson reaches the renderer; drop the `fillBlank` density dial or the shadowing.
- Convert real-`setTimeout` timing tests to fake timers (`srsSync.test.ts:274`, adFree suites).

**Perf (L):** all three languages' curriculum (~121k LOC) ship in the eager ~5MB index chunk,
because `registry.ts:11-20` + `mockCourse.ts` + `mockLessons.ts` statically import everything and
`App.tsx:23-24` eagerly imports `FlashcardsPage`/`PracticePage` which reach curriculum. Lazy-load
language modules by id, `React.lazy` those two pages, and add `manualChunks` (vite.config.ts has
**no `build` block** so the >500kB warning is unmanaged). A learner studying one language currently
downloads all three.

**Larger refactors (M/L):** split `grammarHelpers.ts`; consider a stricter authored schema +
generation for the 27 hand-maintained ~2,500-line `m*.ts` curriculum files (size correlates with
the parse/format bug surface); gate the whole-curriculum-walk integration tests (each 5–11s) as a
separate slow vitest project.

**Test suite is fundamentally healthy** — 280 files, zero snapshots, mostly behavior/invariant
assertions, heavy deps mocked. The gaps are *missing* gates (§4), not rotten existing ones.

---

## 7. Recommended sequence

1. **Gate 1 + Gate 3 round-trip + Gate 8** (all trivial-to-low, catch the highest-blast-radius
   classes A and the exemplar void) — a day.
2. **Gate 2** (JA per-module test scaffold, starting with m29) + **Gate 4** (atom-coverage to m8+).
   Expect these to surface *existing* m8–m29 violations; triage them as a content-fix follow-up.
3. **Gates 5–7** land inside the Gate-2 files as the content lints.
4. **doc-references-code test** + the `Status:` front-matter sweep + guide split — stops context
   rot recurring.
5. **Gate 9** (render smoke) and the perf/dead-code items as capacity allows.

The through-line: **every defect this session was a missing gate, not a hard problem.** JA content
has been authored on trust while ES/KO got tests; closing that asymmetry is the highest-value work
in the repo right now.

---

*Evidence: three parallel read-only audits, 2026-07-17. Seed context: the m29 pilot QA session
(commits `81ce834`…`25b1f46`). See also `[[lingle-retrospective-planned]]` (memory).*
