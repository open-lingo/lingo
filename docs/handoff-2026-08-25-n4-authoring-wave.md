# Handoff — N4 authoring wave (m34–m38), session of 2026-08-24/25

**Written pre-compaction at Spencer's request. This is the resume-point.**
Spencer's standing instruction this run: *"deploy to prod … then author the
next 5 modules (m34–m38), be efficient, use sonnet agents wherever possible,
use local models where we can, good use of dialogue_sim where natural, ping
me here when done."* Ping = message in this session when all five land.

## DONE and verified

1. **Prod deploy is GREEN** (run 32808870703, commit `0dc57e64`). Live: the
   てみる build-tile kanji fix, 1,108-clip TTS backlog, bundle-rename
   completion. Main was silently red for a week (81-commit push, CI only ran
   head) — fixed via two commits: `7392fec2` (render gates moved to their own
   isolated `curriculum-render` vitest project; vi.mock/isolate:false worker
   ordering was the cause) and `0dc57e64` (native.test.ts linguiversal
   callback expectation).
2. **dialogue_sim is JA-IR-authorable** (was ES/FR-only): `dialogueSim`
   factory in `grammarHelpers.ts` (buildability = tile SEGMENTATION check,
   goal-leak check, choice rotation w/ "correct" id), `kind: sim` IRBeat +
   emitter in `moduleCompiler.ts` (+ unknown-beat-kind now THROWS instead of
   silently dropping), TTS routing in `emit-tts-deck.mjs` (npc by speaker →
   keita/nanami; model reply → nanami), visualQaContracts case, learner-view
   emitter case, `dialogueSim.factory.test.ts` (4 tests).
   **Design ruling embedded in stepTaxonomy.ts: dialogue_sim is deliberately
   NOT intro-capable** — the wiring agent added it to INTRO_TYPES to silence
   debut failures; I reverted and fixed the CONTENT instead (see §m34 fixes).
3. **Volitional ChainForm** end-to-end (engine, labels, formationDistractors
   wrong-class mangles, tests — 486 green). Free Drill exposes it globally
   (pre-existing behavior for every form).
4. **m34 (Volitional) is COMPLETE through the wiring stage.** 12 lessons
   (1,2,3,r1,5,6,7,r2,9,10,r3,challenge), 37 newAtoms, diagnostics zero,
   m34-neo.test.ts 122/122, full suite green except audioCoverage (TTS wave
   in flight, below). Registered: courseAtoms (8 new rows + re-stamps
   sagasu/kekkon **and また/らいねん/らいしゅう** — I flipped the wiring
   agent's debt-bump into actually TEACHING those three; fromModuleDrift
   MAX_INVENTORY tightened 44→41), mockLessons, mockCourse tile, learnTier +
   mockCourse LESSON_COUNTs, COMPLEXITY_FLOORS.m33=0.54. All three m34
   antiPatterns rewritten as true minimal pairs (grandfather entries
   REMOVED — the "never add" list stays clean). Both sims live: L3 Ken
   (Saturday plans) + L10 Tanaka (がんばります/しましょう register).
   Visual-QA captures for all 12 lessons exist (gate stage 4 PASSED —
   captured BEFORE manifest per the tts-publish/README trap).

## IN FLIGHT (background tasks at compaction time)

- **m35 expansion agent** (sonnet) — completing `ir/m35.ir.yaml` from my
  skeleton (favor ladder pairwise→N-way-only-in-r3, てあげる trap + L10
  ましょうか fix, だけ/しか, sims: Ken moving-day + Tanaka book-carry).
  Two PLACEHOLDERs it must resolve (te-kureru example #3 つくる; L5 sim turn
  2 ギター). Its brief encodes m34's landing lessons: no じゃあ-class
  untaught discourse words; no な-adj+です compounds in sim options
  (real-form lexicon single-tokens them → debut guard); sims never a first
  exposure; minimal-pair antiPatterns. On completion → wiring stage (clone
  the m34 wiring brief; add favor-ladder pairwise ratchet + しか-replaces-
  が/を ratchet + 2-sim ratchet).
- **TTS keita run** `--lang ja-keita` (task buk4alwmh, backgrounded, slow):
  keita is its OWN pipeline lang. The `--lang ja` run already wrote 277
  nanami clips, 0 failed. **Note: `ls out/tts/ja` printed nothing before the
  timeout — VERIFY where generate writes (out/tts layout) before staging.**
- **Local 122B judge on m34's learner view** printed EMPTY output (stream
  parse or model issue) — rerun/debug `scratchpad/local-qa.mjs
  docs/learner-sim/m34.md`. The learner-view emitter now INCLUDES n4 tier
  (stale exclusion removed) and renders dialogue_sim; `docs/learner-sim/m34.md`
  (631 lines) exists.

## NEXT STEPS, in order

1. When keita generation finishes: `cd ../lingo-data &&
   .venv/bin/python -m pipeline.tts.emit_manifest` (already run once —
   rerun after keita), copy `out/tts/manifest/ja.json` AND `ja-keita.json` →
   `src/shared/tts/manifests/` byte-identical, stage ONLY new mp3s →
   `tts-publish/ja/` (additive, never --delete; find generate's real out dir
   first). Then `npx vitest run audioCoverage --project app` green, then
   `MODULE_GATE_FAST=1 npm run module-gate -- m34` → stages all green
   (tsc stage will still be red from the OTHER SESSION's in-progress ES
   m6/m7 EsAtomSource work — not ours, do not fix, do not block on it).
2. Re-run local judge on m34; triage any real findings inline.
3. m35: expansion agent report → my review pass (check sims, antiPatterns
   vs examples[0] ≥0.50 overlap, ladder pairwise) → write `m35-neo.ts`
   wrapper (copy m34's, ids: 1,2,3,r1,5,6,7,r2,9,10,r3,challenge) → wiring
   agent → gate → TTS wave (`--lang ja` + `--lang ja-keita`) → learner view
   + local judge.
4. m36 (そう/がる/やすい/にくい/ながら — attachment-site module), m37
   (ば + なら conditionals; the m28 ば-unfreeze reveal), m38 (てしまう/ちゃう
   + ていく/てくる; つれる vocab DEFERRED HERE from m35 — spine prefers it,
   its natural frame is つれていく). Same per-module flow:
   `node scripts/authoring-context.mjs mN > docs/context/mN-context.md`
   (only AFTER m(N-1) IR is final), I write skeleton (grammar prose + sims +
   anchors + newAtoms), sonnet expansion agent (reuse the m35 brief text,
   updating module facts), sonnet wiring agent (reuse m34 wiring brief),
   gate, TTS, learner view. m36 sim candidates: complimenting/reacting
   (おいしそう！) at a meal scene; m37: advice-giving (なら); m38:
   confessing a mistake (てしまった) — Spencer wants "good use where
   natural," 2 per module worked for m34/m35.
5. When m38 lands: full-course sweep (all gates, exposure audit), COMMIT
   (explicit paths ONLY — the tree carries the ES session's uncommitted
   m3/m6/m7 work incl. their step-view/App.tsx edits; NEVER git add -A),
   push (deploy auto-runs; its gate needs the ES tsc breakage resolved or
   absent — coordinate), then **ping Spencer in-session**.

## Gotchas rediscovered this run (beyond the memory files)

- `?step=N` is 0-indexed; shot.mjs honors SHOT_OUT (committed).
- Guard tokenizer: cloze OPTIONS are scrubbed from exposure scans (wiring
  agent's change, kept) — a word only in cloze options has NO exposure.
- Rule-card examples ARE intro-capable exposure; listening_build/translate
  are NOT.
- `irAtomRegistration.test.ts` globs ALL ir/*.yaml — an unwired skeleton
  breaks everyone's full suite; park drafts as `.ir.yaml.draft`.
- compile-ir.mjs reads every LOWER-numbered ir/*.yaml for priorVocab; the
  context pack must be regenerated after the prior module finalizes.
- m34 gate artifacts: `artifacts/visual-qa/ja-m34-*/`. Sim contract:
  scene.title + first goal + speaker (+ kana unless listenFirst).
- Local models: qwen3.5:122b judge-tier via streaming API only (headers
  timeout on cold load otherwise); shisa-70b for JA-native drafting;
  scripts/draft/frames.mjs still m31-only (not extended this run).

## State of the tree (uncommitted, OURS vs THEIRS)

OURS (commit when the wave lands): vite.config already committed; NEW/EDITED
uncommitted → curriculum/ir/m34.* + m35.*, m34-neo.ts, m34-neo.test.ts,
courseAtoms.ts, conjugationEngine.ts, conjugationTables.ts (NO — untouched),
formationDistractors.ts, conjugationEngine.test.ts, moduleCompiler.ts,
grammarHelpers.ts, stepTaxonomy.ts, moduleBarGuards.ts, moduleContentLints.ts,
fromModuleDrift.test.ts, mockLessons.ts, mockCourse.ts(+test), learnTier.test.ts,
visualQaContracts.ts, learnerView.emit.test.ts, emit-tts-deck.mjs,
dialogueSim.factory.test.ts, qaCatalog.ts, contentSafety.test.ts,
transformRulesets.ts, dialogueSpeakers untouched, docs/context/m34+m35,
docs/learner-sim/* regenerated, this file.
THEIRS (never stage): all es/* changes, App.tsx, DialogueSimStepView.tsx,
MultipleChoiceStepView.tsx, WordImageMcqStepView.tsx, courseMapData.ts,
tiers.ts, CLAUDE.md, docs/lesson-authoring-guide.md, docs/INDEX.md,
tts-publish/es/*, scripts/compile-ir-es.mjs, scripts/draft/es-ir/*.
When unsure: `git diff <file>` and check whether the hunk is JA-wave work.

## Environment still running

- Vite dev server :5173 with VITE_DEV_AUTH_BYPASS=true (task bdr33fvki);
  lingo-core :8000 (task bvswrcw5l) — kill when wave done.
- Ollama :11434 (system service, leave).

## Progress update (later on 2026-08-25)

- **m34 is FULLY DONE**: content + wiring + TTS (277 nanami clips staged) +
  captures. Fast gate: everything green except deck-level TTS count, which
  now only counts m35's pending clips. tsc clean again (ES session fixed
  their union).
- **Keita TTS migrated to the standard scheme** (the emit_manifest docstring's
  own retire-the-SHA1-block plan): regenerated all 798 clips via
  `generate.py --lang ja-keita`, staged under NEW dir `tts-publish/ja-keita/`
  (deploy syncs it to `tts/v1/ja-keita/`), shipped pipeline-emitted
  `ja-keita.json`. 21 manifest entries reference retired lines with no files
  — harmless (no live lesson requests them). Old SHA-1 flat-ja clips become
  bucket orphans per the documented plan.
- **m35**: expansion COMPLETE (agent report: pairwise ladder verified,
  placeholders resolved — Ken asks for his テレビ carried; てくれた example
  now あねが ばんごはんを かってくれた). My review fix: L10 sim trap tile
  てつだってあげます → てつだってあげる (ます-forms of transfer verbs are
  deliberately unregistered). Wrapper `m35-neo.ts` written. **Wiring agent
  IN FLIGHT** (brief includes 5 bespoke ratchets: ladder-pairwise, しか+neg
  and no がしか/をしか, 2-sim shape, てあげる-upward only in trap beats,
  つれる-absent). After wiring: m35 TTS wave (both langs) → capture-first
  gate → learner view + judge.
- **m36 skeleton AUTHORED and PARKED** as `ir/m36.ir.yaml.draft` (unpark
  after m35 wiring lands). Full grammar prose (そう adjective/verb variants,
  がる/たがる, やすい/にくい, ながら), 40+ attachment-surface atom ledger,
  both sims (Mika dinner reaction; Ken sky-reading with m34-volitional
  pivot — L10 sim turn 1 has a PLACEHOLDER: くらい untaught, agent must
  rewrite per inline note).
- **122B judge**: script validated on qwen3:4b; m34 rerun in flight
  (streaming). If empty again, fall back to shisa-70b or qwen3.8:27b.
- Remaining: m36 expansion→wiring→TTS, m37 (ば+なら) skeleton→…, m38
  (てしまう/ちゃう + ていく/てくる, incl. deferred つれる) skeleton→…,
  final full sweep, commit (OURS-only paths), push, ping Spencer.

## Progress update 2 (2026-08-25, later)

- **m36 DONE end-to-end**: expansion (agent) + my 5 IR fixes (masu-ramp
  removal killed the untracked ふります; GATE5 distractor swap;
  challenge-novelty surface swap; two adjacency rounds — tail beats
  converted to listening-comp to preserve debuts; どうぞ→たべてみて in the
  L3 sim) + wiring (agent; all 4 imageable flags flipped to blocked —
  no vendored SVGs / きけん⚠️ collides with あぶない) + contentSafety
  exemption ("sounds like you're" false positive) + TTS wave (268+27
  staged) + 27b judge: CLEAN all 12 lessons.
- **m37**: expansion DONE (agent caught いったら-already-m32 ledger bug and
  the からい-across-、 latent tokenizer bug; pairwise + interleave clean
  first try). Wrapper written. **Wiring agent IN FLIGHT** — its brief
  includes authoring the `ba` transformRulesets entry (m34-volitional
  precedent) and a だけ-style A/B check before registering なら (ならう
  family risk; longest-match should protect, verify).
- **m38 draft COMPLETE in scratchpad** (`m38.ir.yaml.draft`): full prose,
  ledger, lesson skeletons, both sims authored (Mika umbrella confession
  with the こわしちゃった/こわれちゃった transitivity beat; Ken party sim
  with the くる/いく viewpoint flip inside one exchange). Promote AFTER m37
  wiring lands (irAtomRegistration globs all ir/*.yaml).
- Judge model settled: qwen3.8:27b (122B returns empty on long prompts).
- audioCoverage currently CRASHES (not fails) while m37's yaml has
  null-beats review lessons mid-expansion — resolved once expansion filled
  them; re-verify post-wiring.
- After m38's cycle: final full sweep incl. `npm run authoring-audit`,
  update docs/dispatch-economics-log.md rows if the file exists, COMMIT
  (ours-only paths — list in §tree above plus: all ir/m3[4-8]*,
  m3[4-8]-neo.ts + tests, transformRulesets.ts, contentSafety.test.ts,
  learnerView.emit.test.ts, manifests ja+ja-keita, tts-publish/ja +
  ja-keita dirs, docs/context/m3[4-8]*, docs/learner-sim regenerated,
  scratchpad drafts NOT committed), push, watch deploy, PING SPENCER.

═══════════════════════════════════════════════════════════════════════════
## CONSOLIDATED STATE (2026-08-25, pre-compaction #2 — supersedes above)
═══════════════════════════════════════════════════════════════════════════

### Module scoreboard
| Module | IR | Wiring | Gate+capture | TTS | Judge | Status |
|---|---|---|---|---|---|---|
| m34 Volitional | ✅ | ✅ | ✅ | ✅ 277+27 | ✅ clean (1 nit fixed) | **DONE** |
| m35 Give&receive II | ✅ | ✅ | ✅ | ✅ 222+26 | ✅ 1 defect fixed | **DONE** |
| m36 Looks-like | ✅ | ✅ | ✅ | ✅ 268+27 | ✅ clean | **DONE** |
| m37 Conditionals II | ✅ | ✅ | ✅ | ✅ staged (see log bays6osit) | ✅ 1 contradiction fixed (ば〜ほど → recognition-only) | **DONE** |
| m38 て+helper II | ✅ 124/124 | ✅ | ✅ (captures done; TTS stage red as expected) | ⏳ next | ⏳ next | last two steps |

### Remaining steps, exactly, in order
1. m38 gate finishes (byvmbof0v) → expect PASS except TTS stage (78 clips).
2. m38 TTS wave: the same chained command used for m35/36/37 (generate
   --lang ja, --lang ja-keita, emit_manifest, the set-diff staging python —
   copy it from the m37 block in this session or the handoff's §NEXT STEPS
   item 1 pattern), then `npx vitest run audioCoverage --project app` green.
3. m38 judge: `npm run learner-view` then
   `node <scratchpad>/local-qa.mjs docs/learner-sim/m38.md qwen3.8:27b`;
   fix any genuine finding in the IR (pattern: every module had 0-1).
4. FINAL SWEEP: full `npm run test:run` (expect 100% green now),
   `npm run authoring-audit`, `MODULE_GATE_FAST=1 npm run module-gate -- m38
   --skip-visual` for the summary table.
5. COMMIT (see file list below) → push → deploy auto-runs → verify green →
   **PING SPENCER** (his explicit ask: "ping me here").
   ⚠️ See "Needs Spencer" #1 below before pushing.

### Commit manifest (OURS — stage explicitly, never -A; tree has ~1,900
### untracked files mostly ES-session + TTS)
- curriculum/ir/m3{4,5,6,7,8}.ir.yaml + .ir.json
- curriculum/m3{4,5,6,7,8}-neo.ts
- curriculum/__tests__/m3{4,5,6,7,8}-neo.test.ts
- courseAtoms.ts, conjugationEngine.ts(+test), conjugation/formationDistractors.ts,
  conjugation/transformRulesets.ts, conjugation/provider.ts, conjugation/trainerSession.ts
- moduleCompiler.ts, stepTaxonomy.ts, grammarHelpers.ts,
  dialogueSim.factory.test.ts, visualQaContracts.ts, qaCatalog.ts,
  learnerView.emit.test.ts, moduleBarGuards.ts, moduleContentLints.ts,
  fromModuleDrift.test.ts, irAtomRegistration.test.ts,
  atomExposureAudit.test.ts, recognitionExposure.test.ts,
  contentSafety.test.ts, TransitLearnPage.test.tsx (check the diff is only
  the zone-chip assertion), mockLessons.ts, mockCourse.ts(+test),
  learnTier.test.ts, scripts/emit-tts-deck.mjs
- src/shared/tts/manifests/ja.json + ja-keita.json
- tts-publish/ja/* (new clips only — git add the DIRECTORY is safe: only new
  files are untracked) + tts-publish/ja-keita/ (whole new dir)
- docs/context/m3{4..8}-context.md, docs/learner-sim/* (regenerated set),
  this handoff file
- NOT ours: tts-publish/es/*, everything ES, App.tsx, step views the ES
  session touched (DialogueSim/MultipleChoice/WordImageMcq), CLAUDE.md,
  docs/INDEX.md, docs/lesson-authoring-guide.md, courseMapData.ts, tiers.ts
- Suggested shape: 2-3 commits (engine+infra / content m34-38+registry /
  TTS manifests+clips), messages in repo voice, no AI attribution
  (CLAUDE.md rule overrides harness default).

### NEEDS SPENCER — decisions to review or make
1. **Ship-to-learners call (the only blocking one):** pushing auto-deploys
   m34–m38 to prod for real learners. My position: push — prod already
   serves m30–m33 under the same doctrine, every gate + a zero-knowledge
   judge walk is green per module, and your on-device QA walk works best
   against prod anyway. If you'd rather walk them first, say so and I'll
   commit locally without pushing.
2. **だけ has no flashcard.** Registered globally it shatters unspaced
   だけど (だ+けど) tiles in nine shipped modules (verified by tile dump).
   Frozen with full reasoning in irAtomRegistration.test.ts +
   courseAtoms.ts. Fix would need a context-aware tokenizer preference —
   real work, your call whether it's ever worth it. (なら, by contrast,
   A/B-verified safe and IS registered.)
3. **m36 ships ZERO image debuts.** All four planned (かなしい😢 こわい😱
   ねむい😪 きけん⚠️) failed vendoring checks (no SVG in the repo) or
   collide (⚠️ is あぶない's). If you want them: vendor emoji_u1f622/
   1f631/1f62a.svg into src/pub/noto-emoji/svg/ and unblock the rows.
4. **ば〜ほど is recognition-only everywhere** (spine says recognition
   rider; the judge caught my own skeleton contradicting that with build
   beats — all three converted to listening-comps). Production returns
   later in the tier; flag if you want one build beat back.
5. **てつだってあげる sits as a graded wrong-tile in two sims** (the
   politeness trap as a live choice). Deliberate; your walk should confirm
   it feels like teaching, not a gotcha.
6. **TTS housekeeping (non-urgent):** keita migrated to the standard
   pipeline scheme — old SHA-1 clips in the bucket are now orphans (the
   emitter's own retire-plan); 21 manifest entries reference retired lines
   with no files (harmless, no live lesson requests them). A bucket sweep
   someday.
7. **Free Drill now offers volitional and ば forms for every verb at any
   module** — pre-existing behavior for all ChainForms, not new code, but
   the form list grew. Gate it per-module someday if it bothers you.
8. **Standing exemptions I created (all documented in place, all
   reviewable):** m38-neo.test.ts debutExempt list (11 mechanical-MCQ-only
   tokens, m37-precedent); contentSafety REVIEWED_EXEMPTIONS +1 ("sounds
   like you're" false positive); m37 example reorders to satisfy the
   minimal-pair lint (pedagogy preserved).

### Environment at compaction
- Background: m38 gate (byvmbof0v) — if lost, rerun `npm run module-gate -- m38`.
- Dev server :5173 (VITE_DEV_AUTH_BYPASS=true) + lingo-core :8000 still up;
  kill after the wave (`lsof -ti tcp:5173 | xargs kill`, same for :8000).
- Ollama up; judge = qwen3.8:27b (122B empty-output bug on long prompts).
- git: last commit 0dc57e64 (all green, deployed); everything since is
  uncommitted working tree.
