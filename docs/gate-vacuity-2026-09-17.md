# Gate vacuity sweep — 2026-09-17 (lane A5c)

Project review 2026-09-17, §1 "Gates" / §3 "Sweep for checks that cannot
fail" (`docs/project-review-2026-09-17-decisions-and-proposals.md`). Memory
rule: **"prove the verifier can fail"** — green and vacuous look identical.

Lane P1b found `h2Stable`/`noFlicker` (`scripts/ux-loop/sim-capture.mjs`)
had passed for weeks on listening routes because their sample was empty —
class C4 in `.claude/skills/regression-classes/SKILL.md`: *"a green check
that cannot fail."* This lane's brief was to sweep every content gate and
harness verdict for the same class: prove each one sampled something, or
make it say N/A.

**The rule going forward: a new check ships with a planted-failure test.**
Every fix below was verified by making the check's input empty, watching it
fail with a clear message, then restoring the input — not asserted from
reading the code.

---

## 1. Harness verdicts (`scripts/ux-loop/sim-capture.mjs`)

`computeBuildVerdicts` / `evaluateReport`. A5b (earlier the same day) and
P1b had already wrapped most verdicts in the `na()` helper — this lane's
job was to confirm every one of the named verdicts was covered and close
what wasn't.

| Verdict | Vacuous on empty (before today)? | Status |
|---|---|---|
| `h2Stable` | YES — fixed by A5b (`layoutTrace.ts` selector widened) | already fixed |
| `noFlicker` | YES — fixed by A5b | already fixed |
| `fitScaleStable` | no — `na()`-wrapped | already guarded |
| `rowHStable` | no — `na()`-wrapped | already guarded |
| `promptStable` | no — `na()`-wrapped | already guarded |
| `chromeStable` | no — `na()`-wrapped | already guarded |
| `bankVisible` | no — `na()`-wrapped (P1b open item 2) | already guarded |
| **`trayBankFontEqual`** | **YES** — `computeBuildVerdicts([])` returned `{ ok: true, badTaps: [] }`, no `na` flag | **FIXED this lane** |
| **`stageFits`** | **YES** — same shape | **FIXED this lane** |
| `pixelDiff` (`compareToBaseline`) | no — `"no-baseline"` reason correctly fails, not passes | already guarded |

**Fix:** wrapped `trayBankFontEqual`/`stageFits` in the existing `na()`
helper, tracking an `evaluated`/`stageFitsEvaluated` counter per loop so
`na` is set only when zero samples ever carried the compared fields.
`formatBuildVerdictFailure` already filters on `ok === false` only, so
`na` verdicts were already excluded from the exit-code summary — N/A never
counted as PASS, it just wasn't being SET when it should have been.

**Planted-failure proof:** reverted the `na()` wrap, ran the full
`sim-capture.test.mjs` suite — exactly 2 tests failed (the two new N/A
cases for `trayBankFontEqual`/`stageFits`), everything else stayed green.
Restored; 161/161 green.

Commit: `04445ef4`.

---

## 2. Content gates — inventory table

`file` | `iterates over` | `count today` | `passes on empty (before fix)?` | `fix`

| File | Iterates over | Count today | Vacuous before? | Fix |
|---|---|---|---|---|
| `moduleCompiler.diagnostics.test.ts` | `readdirSync(IR_DIR)` .ir.json files | 41 | **no** — `irFiles.length).toBeGreaterThan(0)` already present | none needed |
| `ja/irDiagnostics.test.ts` | same IR dir (curriculum-project mirror) | 41 | **no** — same floor already present | none needed |
| `es/moduleConformance.test.ts` | `esModule.courseAtoms`, `authoredModuleIds`, `conjugation.tables`, `getEsCourseAtoms()` (gender loop) | 500+ atoms / 10+ tables | Most loops already floored (`courseAtoms.length > 20`, `tables.length >= 10`, `authoredModuleIds.length > 0`); **the "gendered atoms" loop had no floor** — 0 gendered atoms would execute 0 assertions | Added `genderedCount` floor (115 real occurrences today) |
| `ja/moduleConformance.test.ts` | `CONTENT_MODULE_IDS`, `vocabMap`, `grammarPoints`, ja lessons ×3, non-kana curriculum ids, SRS-eligible `JA_COURSE_ATOMS` | 6 of 9 tests had **zero** floor on their derived collection | **YES**, 6 of 9 tests | Added one `toBeGreaterThan(0)` floor per test (8 assertions total) |
| `ko/moduleConformance.test.ts` | — (all hardcoded/literal assertions) | n/a | no — not a collector-iteration shape | none needed |
| `shared/language/moduleConformance.test.ts` | `describe.each(getAllLanguageIds())` | 4 languages | Only *incidentally* protected (a hardcoded "includes ja" check) | Added an explicit `getAllLanguageIds().length > 0` floor |
| `kanaWordIntroOrder.test.ts` | `kanaModuleLessonIds()` (m1/m2), lesson steps, character-granularity builds | m1+m2 lessons | **YES** — both tests had zero floor | Added `kanaLessonIds.length`, `stepsChecked`, `characterBuildsChecked` floors |
| `sceneVocabGate.test.ts` | IR `.ir.yaml` scenes | scenes found | **no** — already has "finds the scenes actually authored" floor + a NEGATIVE CONTROL + "no scene is empty of Japanese" | none needed — this file is the model for the rest of the sweep |
| `practice/content/gate.test.ts` | — (explicit literal test cases) | n/a | no | none needed |
| `grammarReviewPools.test.ts` | `SHIPPED` (×3 tests), `AUTHORED_GRAMMAR_POOLS` steps, harvested pool steps, `grammarPointsJson` | 469 lines, many points | **YES**, 4 of ~12 tests (2 only *incidentally* protected by their own stale-exemption check, which the file's comments say is meant to shrink to `[]`) | Added a shared `SHIPPED.length > 0` test + `checked`/`checked` counters in both comprehensibility-gate tests + a `grammarPointsJson.length` floor |
| `particleClozePlacement.test.ts` | ja lessons, true-particle clozes | course-wide | **YES** | Added `trueParticleClozesFound` floor |
| `particleTileSeparation.test.ts` | ja lessons, build/listening_build tiles | course-wide | **YES** | Added `tilesChecked` floor |
| `destinationParticle.test.ts` | IR translate steps, motion-verb answers | 50+ steps (floored) / motion answers (not floored) | steps-floor already present; **motion-answer sub-filter was not** | Added `motionAnswersChecked` floor |
| `ja/particleCueAnswerability.test.ts` | `scanParticleCues()` findings | >100 | **no** — already has `scanned > 100` floor | none needed |
| `ko/particleCueAnswerability.test.ts` | 25 KO modules, particle_cloze steps | >30 | **no** — already has `scanned > 30` floor | none needed |
| `manifestCoverage.test.ts` | `for (const lang of manifestLangs())` — dynamically REGISTERS one `it()` per language | 5 languages | **YES** — an empty `manifestLangs()` would register zero per-language tests and the file would still read green off its synthetic test alone | Added `manifestLangs().length > 0` floor |
| `fr-quality.test.ts` | `FR_ALL_LESSONS`, `MODULE_ORDER`, `TEACHING`, `CHECKPOINTS`, `MASTERY` | 26 modules | **YES**, all 6 tests in the file simultaneously (including a `0 === 0` equality) | Added one shared floor test covering all 5 derived collections |
| `frDistractorProvenance.test.ts` | `MODULES` (m2-m26), `SCANNED_TYPES` choice sets | 25 modules | **YES** — the file's only content test | Added `choiceSetsChecked` + `ATOM_MODULE_NUM_BY_TOKEN.size` floors |
| `es/atoms.generated.test.ts` | deepEqual vs. live build | 521 atoms | Narrow: vacuous only if BOTH sides emptied together | Added `generated.length > 0` |
| `fr/atoms.generated.test.ts` | deepEqual vs. live build | 230 atoms | same narrow risk | Added `generated.length > 0` |
| `es/structure.test.ts` | deepEqual vs. live build | 38 modules | same narrow risk | Added `structure.length > 0` |
| `fr/structure.test.ts` | deepEqual vs. live build | 26 modules | same narrow risk | Added `structure.length > 0` |
| `src/test/esCompiledStaleness.test.ts` | `esModuleIds()` (IR dir), `.map(compileOne)` | 30+ modules | **no** — `modules.length >= 30` floor gates the SAME `modules` const the second test reuses | none needed |
| `src/test/ttsCoverageParity.test.ts` | `it.each(SAMPLES)` | 20 (hardcoded literal) | n/a — literal, cannot silently empty | Silenced with `// vacuity:` (genuine false positive for the new lint) |
| `src/test/proceduralQa.test.ts` (lane A7c, **read-only** for this lane) | per-question tallies against a committed baseline | — | **no** — already converted to a ratchet with its own proven planted-failure test (2026-09-17 ledger) | none needed (out of scope) |

**Ratchet files found in scope** (`particleClozePlacement.test.ts`'s
`LATE_PARTICLE_CLOZE_EXEMPTIONS`, `grammarReviewPools.test.ts`'s
`GATE_EXEMPTIONS`/`POOL_GAP_EXEMPTIONS`/`RESTAMP_TRANSITION_EXEMPT`): none
of the fixes above touch a pinned ratchet count — every new assertion is an
ADDITIONAL `toBeGreaterThan(0)` floor on the collection being iterated, not
a change to an exemption list's size or a `toBe(<n>)` pin. No ratchet was
raised or weakened by this lane.

---

## 3. What was already correct — don't re-fix these

Several files in the audited set were already hardened, and are the model
the rest of the sweep followed:

- `sceneVocabGate.test.ts` — floor + negative control + "no scene is empty
  of Japanese" (a scene with only English fields would otherwise pass the
  vocabulary test vacuously).
- `ja/particleCueAnswerability.test.ts` / `ko/particleCueAnswerability.test.ts`
  — both have a `scanned > N` floor before the finding-based assertions.
- `moduleCompiler.diagnostics.test.ts` / `ja/irDiagnostics.test.ts` — both
  have "finds at least one IR module" before the per-file loop.
- `src/test/esCompiledStaleness.test.ts` — the module-count floor and the
  compile-and-diff test share the same `modules` const at describe scope,
  so an empty derivation fails the FIRST test and marks the suite red.
- `es/moduleConformance.test.ts` / `ko/moduleConformance.test.ts` — most
  loops already floored; only the ES gender loop had a gap (fixed).

---

## 4. The lint — `scripts/qa/vacuity-lint.mjs`

`npm run test:gates-nonempty`. Greps the 24 audited gate files (hand-
maintained list in the script) for `describe.each(` / `it.each(` /
`for (const … of …)` and fails, printing `file:line`, any construct with no
`toBeGreaterThan(`/`toBeGreaterThanOrEqual(` floor anywhere in the file.
Silenceable with a `// vacuity: <reason>` comment on or directly above the
flagged line — for a genuine false positive only (a hardcoded literal, a
fixed-shape destructure); read the reason before adding one, it's a claim.

**Honest about its limits** (documented in the script's own header): it is
a whole-file presence check, not scope-aware — it cannot tell whether a
floor elsewhere in the file actually guards the flagged loop. It will also
flag literals it can't distinguish from real collectors. The human sweep in
this doc is the ground truth; the lint's job is to keep a FIXED file from
regressing and to catch a wholly unguarded NEW gate file, not to replace
the sweep.

Runs in CI as its own `gates-nonempty` job (`.github/workflows/ci.yml`,
after `unit-tests`), not inside `npm run preflight` (which was already
~5 min under load and out of scope for this lane to touch). Measured
~30ms locally.

Unit tests: `scripts/qa/vacuity-lint.test.mjs`, 8 `node:test` cases
(38ms total) — flags a bare for-of/describe.each, respects a floor,
respects a `// vacuity:` suppression (including a multi-line comment block
above the flagged line, and confirms suppression does NOT reach across a
non-comment line), reports a moved/renamed file as `missing` rather than a
false failure, and one case that runs the lint against the REAL
`GATE_FILES` list and asserts it is clean right now.

---

## 5. The rule

**A new check ships with a planted-failure test.** Before calling a gate
or verdict done:

1. Feed it a known-empty or known-bad input and confirm it goes red (not
   green, not silently skipped).
2. Assert the collection you're about to check is non-empty BEFORE
   asserting on its contents — `expect(items.length).toBeGreaterThan(0)`,
   or a pinned count when the number is itself a ratchet.
3. If the check can legitimately have nothing to verify on some inputs
   (an `it.skip`, a `skipIf`), make it say so explicitly (N/A / a `console.warn`
   naming why) rather than reporting PASS.
4. Run `npm run test:gates-nonempty` — it will not catch everything (see
   §4's limits), but a NEW unguarded loop in one of the 24 audited files
   will fail it immediately.

Cross-reference: `.claude/skills/regression-classes/SKILL.md` class C4;
memory note "prove the verifier can fail"
(`prove-the-verifier-can-fail.md`).
