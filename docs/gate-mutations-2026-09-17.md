# Gate mutations — proving the verifiers can fail (2026-09-17, lane A5e)

Project review 2026-09-17, §1 "Gates" / §3 "Sweep for checks that cannot
fail" (`docs/project-review-2026-09-17-decisions-and-proposals.md`).
Earlier the same day, three "green" gates turned out to be unable to fail:
the axe a11y gate (its lesson-route tests never rendered a lesson on CI),
the procedural-QA ratchet (sidecar missing → 0 applicable steps → pass),
and the sim:capture `h2Stable`/`noFlicker` verdicts (no `<h2>` on listening
routes → vacuous PASS). All three are fixed as of today (see
`docs/procedural-qa-2026-09-17.md`, `docs/accessibility-2026-09-17.md`,
`docs/gate-vacuity-2026-09-17.md`).

`scripts/qa/vacuity-lint.mjs` (lane A5c, same day) closes one half of the
gap: it checks that a gate test FILE has a non-empty-collection floor
somewhere in it. It is explicit about what it cannot do (its own header
comment): *"whether a floor assertion elsewhere in the file actually GUARDS
the specific loop flagged... a file with one honest floor and nine vacuous
loops reads as clean."* It is a lint over test SOURCE. It has never run a
gate against a planted defect and watched it turn red.

This lane builds that other half: `scripts/qa/gate-mutations.mjs` +
`scripts/qa/gate-mutations.json`. For each entry, the runner plants the
cheapest real mutation that should make a specific gate fail — an edit to
actual content/IR/component source, an env var, or a renamed artifact,
**never** an edit to the test file itself (that would prove nothing about
whether the gate reads real input) — runs the gate's own test command,
records CAUGHT / MISSED / ERROR, and restores the tree exactly, every time,
including on Ctrl-C.

## 1. Inventory

99 gate files/scripts, enumerated with a script
(`/private/tmp/.../scratchpad/lanes/A5e-scratch/inventory.mjs`, not
committed — see "how this list was built" below), not typed by hand. Three
sources, unioned and deduplicated:

  1. every `*.test.ts`/`*.test.mjs`/`*.spec.ts` file under `src/`,
     `scripts/`, `tests/` whose text matches `ratchet`, `baseline`, or
     `must not regress` (case-insensitive) — 70 files, after excluding
     `_archive/` (43 retired per-module lesson tests: dead weight, not live
     gates).
  2. `scripts/qa/vacuity-lint.mjs`'s own hand-maintained `GATE_FILES` list
     (24 files) — mostly did NOT overlap with (1): these files gate real
     invariants (module conformance, particle placement, distractor
     provenance) without ever using the literal words "ratchet" or
     "baseline" in their prose. 19 of the 24 were new to the union.
  3. the Playwright a11y gate (`tests/e2e/axe.a11y.spec.ts`) and the 8
     `tests/mobile/*.mobile.spec.ts` files (explicitly named in the brief
     as "the Playwright gates"), plus `scripts/ux-loop/sim-capture.mjs`
     itself (the sim:capture verdict source, separate from its own
     `sim-capture.test.mjs` fixture tests, which (1) already caught).

**How this list was built, so the next lane can regenerate or extend it**:
grep for the three ratchet-ish keywords across the three directories,
union with vacuity-lint's `GATE_FILES` and the Playwright set, dedupe,
sort. The per-row "claims to catch" column is the first sentence of each
file's own header `/** ... */` comment (or its first substantial `//`
line) — not written by hand, and not always a clean one-line defect
statement; read the file for the real claim before trusting the column.
The "input" column is a path/keyword heuristic (IR YAML/JSON vs. generated
atoms JSON vs. TTS manifest vs. Playwright DOM), also not hand-verified for
every row.

`src/test/proceduralQa.test.ts` (row 89) is listed for completeness but is
**out of scope for mutation in this lane** — it is lane A7c's file (a
committed per-question ratchet baseline with its own already-proven
planted-failure test per `docs/procedural-qa-2026-09-17.md`'s ledger: "set
Q7's baseline to 0, watched it go red naming the exact finding, restored").
`scripts/code-index/file-watch.test.mjs` (row 1) is a grep false-positive
from the keyword sweep — it gates a dev tool (the code-index watcher), not
course content; included for transparency about how the list was built,
not because it needs a content mutation.

## 2. Inventory table (99 rows, script-generated)

| # | file | claims to catch (from its own header) | input | status |
|---|---|---|---|---|
| 1 | `scripts/code-index/file-watch.test.mjs` | Tests for the god-file / orphan watch — the pure core. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 2 | `scripts/qa/vacuity-lint.mjs` | Pure-ish core: reads each `files[i]` (relative to `root`) and returns | test SOURCE (lint over other gates) | RUN — see §3 run table |
| 3 | `scripts/ux-loop/sim-capture.mjs` | @param {any} report a single parsed SIMPROBE JSON line (see simProbe.ts) | screenshots/DOM traces (simulator) | RUN — see §3 run table |
| 4 | `scripts/ux-loop/sim-capture.test.mjs` | A `listening_build` sample: no `<h2>`, so no `h2Top`; the prompt is read | screenshots/DOM traces (simulator) | NOT RUN (proposed only, see below) |
| 5 | `src/__tests__/staleLessonIdReferences.test.ts` | DEAD LESSON-ID REFERENCE SCAN (stale-reference audit, 2026-07-29). | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 6 | `src/features/languages/__tests__/courseEmojiIntegrity.test.ts` | COURSE-WIDE EMOJI INTEGRITY GATE (2026-09-02, Wave C emoji re-fit, task 7). | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 7 | `src/features/languages/es/__tests__/esAudioCoverage.test.ts` | ES render-side audio-coverage gate — the es twin of | content JSON / compiled IR / registry | RUN — see §3 run table |
| 8 | `src/features/languages/es/__tests__/esPromptComprehensibility.test.ts` | ES prompt-comprehensibility instrument + ratchet. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 9 | `src/features/languages/es/__tests__/grammarHelpersWave2.test.ts` | Wave-2 ES factory contract tests: agreementCloze / cloze surface | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 10 | `src/features/languages/es/__tests__/moduleConformance.test.ts` | ES-specific conformance checks. The generic conformance test at | content JSON / compiled IR / registry | RUN — see §3 run table |
| 11 | `src/features/languages/es/curriculum/atoms.generated.test.ts` | Vacuity sweep 2026-09-17 (lane A5c): a deepEqual against a live build | generated atoms JSON | NOT RUN (proposed only, see below) |
| 12 | `src/features/languages/es/curriculum/es-quality.test.ts` | ES course-wide QUALITY guardrails — the §13-doctrine contract. | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 13 | `src/features/languages/es/curriculum/esSimNpcProvenance.test.ts` | ES course-wide gate — dialogue_sim NPC-LINE word provenance. | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 14 | `src/features/languages/es/curriculum/structure.test.ts` | `structure.generated.json` is what `mockCourse.ts` ships for the ES | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 15 | `src/features/languages/fr/__tests__/frAudioCoverage.test.ts` | FR render-side audio-coverage gate — the fr twin of | content JSON / compiled IR / registry | RUN — see §3 run table |
| 16 | `src/features/languages/fr/__tests__/frContentAudits.test.ts` | FR content audits — the mechanical half of the authoring ledger | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 17 | `src/features/languages/fr/__tests__/frEngine.test.ts` | FR engine contract. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 18 | `src/features/languages/fr/__tests__/frPromptComprehensibility.test.ts` | FR prompt-comprehensibility gate — the fr twin of | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 19 | `src/features/languages/fr/__tests__/frSpeechElision.test.ts` | FR speech grading of elided/contracted forms — verification + regression | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 20 | `src/features/languages/fr/__tests__/frSpeechHundreds.test.ts` | FR speech grading of hundreds/thousands («cent», «deux cents», «cent un», | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 21 | `src/features/languages/fr/__tests__/frSpeechMinimalPairs.test.ts` | FR speech minimal-pair census gate (2026-09-10) — the COURSE-WIDE | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 22 | `src/features/languages/fr/__tests__/frSpeechNearFuture.test.ts` | FR speech grading of the near-future frame («aller + infinitif») — | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 23 | `src/features/languages/fr/__tests__/frSpeechNegatedFrames.test.ts` | FR speech grading of `pas`-negated frames graded at a `speaking` | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 24 | `src/features/languages/fr/__tests__/frSpeechNegation.test.ts` | FR speech grading of the negation-frame fillers («jamais», «rien», «plus») | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 25 | `src/features/languages/fr/__tests__/frSpeechRecentPast.test.ts` | FR speech grading of the recent-past frame («venir de + infinitif») — | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 26 | `src/features/languages/fr/curriculum/atoms.generated.test.ts` | Vacuity sweep 2026-09-17 (lane A5c): a deepEqual against a live build | generated atoms JSON | NOT RUN (proposed only, see below) |
| 27 | `src/features/languages/fr/curriculum/fr-quality.test.ts` | FR course-wide QUALITY guardrails — the §13-doctrine contract. | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 28 | `src/features/languages/fr/curriculum/frDistractorProvenance.test.ts` | FR MCQ/cloze DISTRACTOR vocab-provenance gate — closes the gap the m19 | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 29 | `src/features/languages/fr/curriculum/frTitleProvenance.test.ts` | FR TITLE vocab-provenance gate — closes the gap the m20 reviewer (commit | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 30 | `src/features/languages/fr/curriculum/structure.test.ts` | `structure.generated.json` is what `mockCourse.ts` ships for the FR | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 31 | `src/features/languages/ja/__tests__/atomExposureAudit.test.ts` | AUTHORED-EXPOSURE AUDIT (B065). | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 32 | `src/features/languages/ja/__tests__/buildAnswerFloor.test.ts` | RULE 1 GATE — the answer-length floor (TestFlight #139, Spencer 2026-09-15). | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 33 | `src/features/languages/ja/__tests__/fromModuleDrift.test.ts` | FROMMODULE DRIFT GUARD (R1 landing, 2026-08-20 — successor to the | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 34 | `src/features/languages/ja/__tests__/irAtomRegistration.test.ts` | THE REVERSE ARROW. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 35 | `src/features/languages/ja/__tests__/irDiagnostics.test.ts` | Curriculum-project mirror of | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 36 | `src/features/languages/ja/__tests__/moduleConformance.test.ts` | JA-specific conformance checks — modeled on | content JSON / compiled IR / registry | RUN — see §3 run table |
| 37 | `src/features/languages/ja/__tests__/particleCueAnswerability.test.ts` | Spencer, walking ja m29 (2026-09-01): "it keeps asking for desune but nothing | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 38 | `src/features/languages/ja/__tests__/recognitionExposure.test.ts` | PRODUCTION-ONLY EXPOSURE DETECTOR (recognition-scaffolding gap, 3rd | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 39 | `src/features/languages/ja/__tests__/registerCueAgreement.test.ts` | REGISTER-CUE AGREEMENT GATE. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 40 | `src/features/languages/ja/__tests__/reviewWindowFloor.test.ts` | RULE 3 GATE, content half — the six-module review window | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 41 | `src/features/languages/ja/__tests__/sentenceReuseSpacing.test.ts` | RULE 2 GATE — sentence-reuse spacing (TestFlight #138 #135, Spencer 2026-09-15). | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 42 | `src/features/languages/ja/__tests__/unauthoredModuleAllowlist.test.ts` | Unauthored-module sentinel ratchet (freq-gap plan §4.1a). | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 43 | `src/features/languages/ja/acceptedAnswerCollisions.test.ts` | THE BACKSTOP FOR ACCEPTED-ANSWER WIDENING. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 44 | `src/features/languages/ja/conjugation/transformRulesets.test.ts` | THE RATCHET FOR THE TRANSFORM CARD'S TEACHING HALF. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 45 | `src/features/languages/ja/curriculum/__tests__/m26-neo.test.ts` | m26-neo module guards. Same 2026-07-26 module shape as m12-m25 | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 46 | `src/features/languages/ja/curriculum/__tests__/m27-neo.test.ts` | m27-neo module guards. Same 2026-07-26 module shape as m12-m26 | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 47 | `src/features/languages/ja/curriculum/__tests__/m28-neo.test.ts` | m28-neo module guards. Same 2026-07-26 module shape as m12-m27 | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 48 | `src/features/languages/ja/curriculum/__tests__/m33-neo.test.ts` | m33-neo module guards — spine unit n4-04, "Transitivity I: 自動詞/他動詞 — | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 49 | `src/features/languages/ja/curriculum/__tests__/m35-neo.test.ts` | m35-neo module guards — spine unit n4-06, "Give & receive II: | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 50 | `src/features/languages/ja/curriculum/__tests__/m36-neo.test.ts` | m36-neo module guards — spine unit n4-07, "Looks like: 〜そう(appearance), | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 51 | `src/features/languages/ja/curriculum/__tests__/m37-neo.test.ts` | m37-neo module guards — spine unit n4-08, "Conditionals II: ば + なら". | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 52 | `src/features/languages/ja/curriculum/__tests__/m38-neo.test.ts` | m38-neo module guards — spine unit n4-09, "て + helper II: 〜てしまう/ちゃう + | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 53 | `src/features/languages/ja/curriculum/__tests__/m39-neo.test.ts` | m39-neo module guards — spine unit n4-10, "Concession & reasons: 〜のに vs | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 54 | `src/features/languages/ja/curriculum/__tests__/m40-neo.test.ts` | m40-neo module guards — spine unit n4-11, "Passive I: direct passive | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 55 | `src/features/languages/ja/curriculum/__tests__/m41-neo.test.ts` | m41-neo module guards — spine unit n4-12, "Transitivity II: 〜てある + | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 56 | `src/features/languages/ja/curriculum/__tests__/m42-neo.test.ts` | m42-neo module guards — spine unit n4-13, "Hearsay: 〜そうだ, 〜って, | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 57 | `src/features/languages/ja/curriculum/__tests__/m43-neo.test.ts` | m43-neo module guards — spine unit n4-14, "Certainty ladder: 〜かもしれない | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 58 | `src/features/languages/ja/curriculum/__tests__/m44-neo.test.ts` | m44-neo module guards — spine unit n4-15, "Evidential-family | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 59 | `src/features/languages/ja/curriculum/__tests__/m45-neo.test.ts` | m45-neo module guards — spine unit n4-16, "Causative させる: make/let | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 60 | `src/features/languages/ja/curriculum/__tests__/m46-neo.test.ts` | m46-neo module guards — spine unit n4-17, "Timing & aspect: 〜間に／ | curriculum module source (.ts) or its generated JSON | NOT RUN (proposed only, see below) |
| 61 | `src/features/languages/ko/__tests__/freqUnlockStability.test.ts` | KO frequency-registry unlock-stability ratchet. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 62 | `src/features/languages/ko/__tests__/koAudioCoverage.test.ts` | KO render-side audio-coverage gate — the ko twin of | content JSON / compiled IR / registry | RUN — see §3 run table |
| 63 | `src/features/languages/ko/__tests__/koCompoundingReview.test.ts` | KO compounding-review gate — machine form of the audit's §2 #5 fix | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 64 | `src/features/languages/ko/__tests__/koHangulAudioCoverage.test.ts` | Hangul-tier (m1/m2) audio-coverage gate — the glyph-drill companion to | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 65 | `src/features/languages/ko/__tests__/moduleConformance.test.ts` | KO-specific conformance checks. The generic conformance test at | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 66 | `src/features/languages/ko/__tests__/particleCueAnswerability.test.ts` | KO port of the JA "uncued particle prompt" gate | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 67 | `src/features/lesson/components/reactiveTipGate.test.ts` | (no header comment) | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 68 | `src/features/lesson/components/steps/stickyCta.test.ts` | THE STICKY ACTION BAR, AS A ROLL CALL. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 69 | `src/features/lesson/components/tiles/tileFit.test.ts` | THE TILE TEXT RULE — the arithmetic, the wiring, and the CSS ratchet. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 70 | `src/features/lesson/data/boundEnderProduction.test.ts` | A bound ender is never a standalone production target. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 71 | `src/features/lesson/data/destinationParticle.test.ts` | に and へ are both correct for a destination, so both must be accepted. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 72 | `src/features/lesson/data/fillerPoolWidth.test.ts` | Filler's noun/swap-slot pool must be MODULE-WIDE, not lesson-scoped. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 73 | `src/features/lesson/data/grammarReviewPools.test.ts` | Fabricate a card whose (recognition.reps + production.reps) === repsSum. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 74 | `src/features/lesson/data/kanaWordIntroOrder.test.ts` | Kana-module word-intro ordering (Spencer 2026-06-13): a learner must | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 75 | `src/features/lesson/data/lessonAtomAttribution.test.ts` | A lesson introduces the atoms it actually USES — not the ones whose kana | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 76 | `src/features/lesson/data/listeningGranularity.test.ts` | Listening sentence-first ratchet (workshop B, Spencer 2026-07-12): | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 77 | `src/features/lesson/data/mockLessons.telemetryGate.test.ts` | A8b (2026-09-17, docs/learning-loop-2026-09-17.md §2) — regression pin. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 78 | `src/features/lesson/data/moduleCompiler.diagnostics.test.ts` | The author ⇄ compiler loop's hard floor: every committed IR must be | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 79 | `src/features/lesson/data/particleClozePlacement.test.ts` | Particle-cloze placement policy (workshop D, Spencer 2026-07-12): | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 80 | `src/features/lesson/data/particleTileSeparation.test.ts` | Particle-tile separation (Spencer QA 2026-07-12): in build-type steps, | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 81 | `src/features/lesson/data/reviewFillerVariety.test.ts` | Review filler must not ask the same question twice in one lesson. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 82 | `src/features/lesson/data/sceneVocabGate.test.ts` | THE SCENE VOCABULARY GATE. | content JSON / compiled IR / registry | RUN — see §3 run table |
| 83 | `src/features/practice/content/gate.test.ts` | 花見 (hanami) is not a course atom at any module. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 84 | `src/shared/language/__tests__/moduleConformance.test.ts` | Module conformance test — runs against every registered language module | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 85 | `src/shared/platform/nativeHttp.test.ts` | base64 for the three bytes 0x01 0x02 0x03 — stands in for clip bytes. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 86 | `src/shared/styles/mobileTypeFloor.test.ts` | THE MOBILE TYPE FLOOR, AS A RATCHET. | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 87 | `src/shared/tts/manifestCoverage.test.ts` | Commit-time gate: every hash in a TTS manifest must resolve to real audio — | TTS manifest JSON + tts-publish/ | RUN — see §3 run table |
| 88 | `src/test/esCompiledStaleness.test.ts` | ES compiled-vs-source staleness gate (2026-09-17 project review, storage | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 89 | `src/test/proceduralQa.test.ts` | Procedural QA RATCHET gate (2026-09-17 project review — lane A7 drafted | content JSON / compiled IR / registry | NOT RUN (proposed only, see below) |
| 90 | `src/test/ttsCoverageParity.test.ts` | Pins `scripts/qa/procedural/lib/ttsCoverage.mjs`'s `hasTtsClip` against | TTS manifest JSON + tts-publish/ | NOT RUN (proposed only, see below) |
| 91 | `tests/e2e/axe.a11y.spec.ts` | axe-core smoke gate (2026-09-17 project review, lane A2 — | DOM (Playwright + axe-core) | RUN — see §3 run table |
| 92 | `tests/mobile/cta-fold.mobile.spec.ts` | Mobile gate — primary CTA in the initial viewport (research §6 assertion 4). | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 93 | `tests/mobile/overflow.mobile.spec.ts` | Mobile gate — horizontal overflow (research §6 assertions 1 & 2). | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 94 | `tests/mobile/render-errors.mobile.spec.ts` | Mobile gate — no console/page errors during render (research §6 assertion 7). | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 95 | `tests/mobile/review-chrome.mobile.spec.ts` | Mobile gate — the review session's chrome is viewport-dependent. | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 96 | `tests/mobile/safe-area.mobile.spec.ts` | Mobile gate — nothing anchored may sit inside a safe-area band. | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 97 | `tests/mobile/stage-fit.mobile.spec.ts` | Mobile gate — VERTICAL fit inside the lesson stage (research §6 assertion 5: | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 98 | `tests/mobile/tap-targets.mobile.spec.ts` | Mobile gate — WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA. | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |
| 99 | `tests/mobile/touch-select.mobile.spec.ts` | Mobile gate — touch devices must not text-select the app. | DOM/viewport (Playwright, live dev server) | NOT RUN (proposed only, see below) |


## 3. Run table — 10 gates actually mutated (`node scripts/qa/gate-mutations.mjs`)

Chosen for diversity of input type (IR YAML, generated atom JSON, TTS
manifest JSON, test SOURCE, a code file's own regression fixture, DOM via
axe-core) and confidence of a correct, minimal mutation, not exhaustiveness
— 89 of the 99 inventoried gates are NOT RUN this lane (see §5). Every row
below is the runner's actual output, not a transcription.

| gate | mutation | result | seconds |
|---|---|---|---|
| `sceneVocabGate` | edit `ja/curriculum/ir/m15.ir.yaml` — inject an untaught word (ぴかちゅう) into a scene diagram's Japanese | CAUGHT | 2.1 |
| `es-moduleConformance-gender` | edit `es/curriculum/atoms.generated.json` — set español's gender to `"x"` | CAUGHT | 2.1 |
| `ja-moduleConformance-vocabMap` | edit `n5-module-vocab-map.json` — add an id with no matching courseAtom | CAUGHT | 17.6 |
| `esAudioCoverage` | rename `shared/tts/manifests/es.json` away | CAUGHT | 5.2 |
| `frAudioCoverage` | rename `shared/tts/manifests/fr.json` away | CAUGHT | 4.2 |
| `koAudioCoverage` | rename `shared/tts/manifests/ko.json` away | CAUGHT | 1.0 |
| `manifestCoverage` | rename `tts-publish/live/ja.txt` away | CAUGHT | 0.7 |
| `vacuity-lint-self` | edit `moduleCompiler.diagnostics.test.ts` — remove its one floor | CAUGHT | 0.1 |
| `sim-capture-trayBankFontEqual` | edit `sim-capture.mjs` — revert today's `na()` wrap | CAUGHT | 0.2 |
| `axe-a11y-settings-modal` | edit `ModalBase.tsx` — remove the close button's `aria-label` | CAUGHT | 18.1 |

**10 run: 10 CAUGHT, 0 MISSED, 0 ERROR.** `git status --porcelain` was empty
after every individual run and after the full batch.

Full detail (including two mutations that turned out to be dead ends,
below) and the `git worktree`/branch/SHA are in §6/§7.

### Two mutations that did NOT work on the first try — kept as findings, not silently redone

**es-moduleConformance-gender, take 1 (discarded):** the first attempt
edited `es/curriculum/m10.ts`'s `gender: "m"` directly — the module SOURCE
a human would naturally reach for. The gate stayed green. Cause:
`getEsCourseAtoms()` does not import curriculum modules at runtime at all
— it reads the COMMITTED, GENERATED `atoms.generated.json` (2026-09-13
"content-as-data": importing 38 modules for their atoms pulled ~3 MB of
factory calls into the bundle). Editing `m10.ts` without re-running
`content:emit` is a no-op for this gate, same drift class as
`es-compiled-ts-drift` (memory note) and exactly the kind of false MISSED
this whole tool exists to prevent producing by accident. Fixed by mutating
`atoms.generated.json` directly (the file this note documents as the RIGHT
one). **Proposal, not fixed here**: `esCompiledStaleness.test.ts` already
guards `atoms.generated.json` against drifting from a fresh
`content:emit` — but nothing stops an agent from "fixing" a MISSED gate by
editing the un-consumed `.ts` source and believing it worked. Worth a
comment at the top of `atoms.generated.json`'s generator pointing here.

**axe-a11y-settings-modal, take 1 (discarded, and itself a finding):** the
first attempt removed the `aria-label="Close"` from
`src/shared/components/ui/Modal.tsx`'s close button — same-named component,
wrong file. The settings modal actually renders through
`ModalBase.tsx` (via `ModalContext` → `openSettings`), not
`ui/Modal.tsx`. Confirmed by dumping the live DOM
(`role="dialog" aria-label="Settings"` only matches `ModalBase.tsx`'s
markup) rather than trusting the grep match. **A genuine near-miss finding
in its own right, separate from the file mix-up**: probing the `multiple_choice`
step (`ja-m34-neo-7?step=2`, the exact route `axe.a11y.spec.ts` tests) found
that its icon-only "Play audio" replay button
(`MultipleChoiceStepView.tsx:216`, `aria-label={t("lesson.play", ...)}`) is
conditionally rendered on `ttsAvailable`, and in the a11y test environment
it is **not** rendered — the button never reaches the DOM axe scans. The
gate genuinely cannot fail on that specific control's accessible name
today, on that route, in that environment — the same *shape* of vacuity
(a sample that's silently empty) as `h2Stable`/`noFlicker`, just one
control on an otherwise-real gate rather than the whole gate. **Proposed,
not fixed**: either seed `ttsAvailable` in the a11y bypass session so the
replay button renders, or add a targeted assertion on that button when it
does. One-line-ish but touches TTS-availability wiring in a test env I did
not want to change under a "gate mutations" lane without Spencer's steer.

## 4. MISSED — none in the official run

Zero of the 10 officially-run mutations came back MISSED. Read this as:
today's earlier fixes (A5b's `na()` wraps, A5c's floor additions, A2's
real-route axe rewrite) hold up under an actual planted defect, not just
under the vacuity-lint's file-presence check. The one real gap found (the
MCQ-step Play-audio button never rendering under the a11y bypass session,
above) was found by hand during recon for the axe entry, not by a MISSED
mutation-runner result — it's a partial blind spot on an otherwise-working
gate, not a fully vacuous one.

## 5. NOT RUN — 89 of 99 inventoried gates, and why

Time-boxed, not skipped for cause. Breakdown:

  - **8 `tests/mobile/*.mobile.spec.ts` files**: brief explicitly allows
    skipping Playwright mobile gates when the simulator/dev-server cost is
    high; each spins the shared `:5273`/`:5274` dev servers this lane did
    not want to hold under the sim lock for a mutation sweep on top of
    every other lane already using them today. Proposed follow-up: same
    rename/edit-content pattern as the audio-coverage entries (e.g. delete
    a `safe-area` inset class from one component, confirm `safe-area.mobile.spec.ts`
    catches it) — none of the 8 need a real device, only the existing
    `npm run test:mobile` webServer, so a future lane doing ONLY this
    should budget ~1-2 min/spec × 8.
  - **`src/features/lesson/data/kanaWordIntroOrder.test.ts`,
    `grammarReviewPools.test.ts`, `particleClozePlacement.test.ts`,
    `particleTileSeparation.test.ts`, `destinationParticle.test.ts`,
    `src/features/practice/content/gate.test.ts`**: each needs a
    hand-picked, semantically-correct content edit inside a real m*-neo IR
    file or pool (e.g. destinationParticle needs an actual motion-verb
    translate step's `acceptedAnswers` trimmed to one particle) rather than
    a generic rename/env — cheap to RUN once found, expensive to find
    correctly without risking a wrong (non-representative) mutation.
    Proposed, not run.
  - **The remaining ~75 content/curriculum gates** (m26–m46 neo module
    guards, FR speech-grading families, ES/FR quality + distractor +
    title-provenance gates, JA exposure/attribution/register gates, KO
    conformance/compounding gates, the shared `moduleConformance`
    `describe.each`, `atoms.generated`/`structure` deepEqual pairs, the
    tile/sticky-CTA/mobile-type-floor UI ratchets): each needs the same
    per-file recon this lane did for the 10 above (read the file, find a
    REAL field the assertion reads, confirm it isn't shadowed by a
    generated-JSON layer the way `es-moduleConformance-gender` was) — this
    lane time-boxed to a representative, diverse sample rather than
    grinding through all ~75 at uneven confidence. The inventory table (§2)
    is the punch list; "how to add an entry" (§6) is the recipe.

None of these were skipped because they looked hard to mutate in principle
— every one of them reads a real, editable, restorable input. They were
time-boxed out of one lane's budget.

## 6. How to add an entry — "a new gate ships with its mutation"

  1. Read the gate file. Find the SPECIFIC real input its assertion reads —
     not the `.ts` source a human would guess, if there's a generated JSON
     or compiled layer between source and the gate (check for
     `*.generated.*`, `content:emit`, or a `*CompiledStaleness*` sibling
     test first — see the es-moduleConformance-gender near-miss above).
  2. Pick the CHEAPEST mutation that should flip it: an `edit` (exact
     substring, unique in the file) to a real field, an `env` var the code
     branches on, or a `rename` of a file the gate expects to exist.
     Prefer `rename` when "the whole category of input disappears" is a
     realistic defect (a manifest, a snapshot) — it needs no content
     knowledge and is trivially reversible.
  3. Add an entry to `scripts/qa/gate-mutations.json`: `gate` (unique
     name), `owner` (the file path), `testCmd` (scoped — `npx vitest run
     <file>`, not a full suite run), `mutation`, `expect: "fail"`, `note`
     (why this mutation, and why it's the cheapest one that should work).
  4. Run `node scripts/qa/gate-mutations.mjs --only <gate>` and confirm
     CAUGHT. If MISSED: the gate has the exact vacuity class this whole
     project review is about — read `docs/gate-vacuity-2026-09-17.md`'s
     fix pattern (a `toBeGreaterThan(0)` floor on the thing iterated, or an
     `na()`-style guard) before touching the gate.
  5. Confirm `git status --porcelain` is empty after the run.
  6. The weekly `gate-mutations` CI workflow picks the new entry up
     automatically — no workflow edit needed unless the new gate's
     `testCmd` needs a dependency the workflow doesn't already install
     (playwright browsers, a lexical sidecar venv — see the workflow's
     `.github/workflows/gate-mutations.yml` comments for what's already
     there).

## 7. Branch, worktree, commits

Worktree: `/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/lanes/A5e`
Branch: `lane/A5e`, off `feedback-2026-09-14` at `9758d0e2` (the tip at
worktree-creation time).
JA lexical sidecar installed per the branch-per-lane rule (`uv venv` +
`fetch-jmdict.mjs`, both succeeded — not needed by any entry in this
lane's `gate-mutations.json` today, but required by the shared preflight).

Files owned/added: `scripts/qa/gate-mutations.mjs`,
`scripts/qa/gate-mutations.json`, `scripts/qa/gate-mutations.test.mjs`,
`.github/workflows/gate-mutations.yml`, this doc, the ledger line in
`docs/handoff-2026-09-17-project-review.md`. No lesson content, IR, or
baseline file was left modified — every mutation in §3 was applied and
restored inside a single `node scripts/qa/gate-mutations.mjs` (or manual
recon-then-restore, immediately git-status-verified) run.
