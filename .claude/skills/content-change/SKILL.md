---
name: content-change
description: The compile-and-gate sequence for any Open Lingo course content change (ja/ko/es/fr) — lesson YAML/IR, glosses, atoms, distractors, tiles, review pools, TTS text. Read BEFORE editing curriculum, and before claiming a content fix is done. Covers edit-the-source-not-the-compiled-output, recompile-all-when-vocab-changes, the per-language gate list, the sibling pattern sweep a named-word fix requires, ratchets-are-lower-only, and which slots may legally hold a wrong form.
---

# Changing course content

Gloss/naturalness complaints have recurred in **every** build era — #10/#13/#15/
#19/#25–#28 → #72/#74/#76 → #97/#98/#102 → #118/#121/#134 — because each lap
fixed the words in the screenshot and the course-wide sweep was deferred. And
content-selection complaints (#90 #91 #116 #129 #135 #138 #139) have **zero** fix
commits across the whole class. The sequence below is what closes them.

Authority order when docs disagree: `docs/authoring-invariants-pinned.md` (JA
law; per-language `es-`/`fr-authoring-invariants-pinned.md`) → `CLAUDE.md` →
`docs/lesson-authoring-guide.md` (§13 is the locked M8+ template) →
`docs/pedagogy-principles-2026-07-05.md`. FR operational law:
`docs/fr-authoring-playbook.md`.

---

## 0. Do not author bulk content inline

**HARD RULE, every course, every session.** Lesson bodies, module YAML, drill
banks, clip lists — anything formulaic over ~100 lines — goes to Sonnet
subagents, one or two lessons each, in parallel. The lead writes the
spine/header/placement/test pins, runs the gates, fixes ≤10-line residuals, and
ships. m17–m19 were drafted inline once and Spencer called it "an expensive
mistake" — ~35 min and a compaction every 2–3 modules. Brief template:
`docs/es-ir-sources/es-m20-brief.md`. Dispatch rules: `lane-briefing`.

## 1. Edit the source, and diff the untouched module first

Content is compiled. **Never hand-edit the compiled output.**

```bash
# BEFORE your edit: recompile the module you are about to touch, untouched
node scripts/compile-ir.mjs m34          # JA:    ir/m34.ir.yaml -> ir/m34.ir.json
node scripts/compile-ir-es.mjs m21       # ES:    ir/m21.ir.yaml -> curriculum/m21.ts
node scripts/compile-ir-fr.mjs m14       # FR:    same shape; requires frame: "none"
git diff                                  # zero lines = safe to proceed
```

A non-zero diff means **someone hand-edited the compiled output** — port those
hunks into the IR before making your change, or your recompile silently reverts
them. `05635129` did exactly this to m4/m5/m7/m9/m10 emoji.

Both ES/FR compilers accept `--check` (validate, emit nothing). KO has **no IR
compiler** — KO curriculum is hand-authored TS.

After compiling your own change, filter the diff to the lines you expected and
**read what is left** — that residue is where drift shows.

## 2. If a module's vocab changed, recompile every module

`priorVocab` / `priorAtoms` are computed by scanning all *earlier* modules. So one
stale artifact skews every downstream window and ratchet.

Committed `m14` and `m20`–`m37` `.ir.json` were stale against their yaml (m17's
vocab pack never propagated). `priorVocab(m33)` was therefore missing 15 m17
words, and m39's review window wrongly counted them as recent:
`reviewWindowFloor` read **34** where the truth was **50** (total 607→623), and
the filler pool fell to its fallback 16 extra times. It looked exactly like a
regression. It was a re-measurement.

**Rule: a vocab change means recompile all modules of that course, then re-read
every ratchet that moved and say which moves are re-measurement.**

Then regenerate the app's content:

```bash
npm run content:emit    # CONTENT_EMIT=1 vitest --project curriculum emitContent.test.ts
                        # also runs automatically as predev / prebuild / prebuild:native / preflight
```

## 3. Gates

```bash
npm run module-gate -- m34        # JA ONLY. Six stages: module tests, TTS deck +
                                  # manifest coverage, tsc --noEmit, visual-QA
                                  # contracts+capture (ON by default), FULL vitest,
                                  # exposure audit (report-only).
                                  # --compact for a PASS/FAIL table; --skip-visual
                                  # to drop stage 4; MODULE_GATE_FAST=1 skips the
                                  # full suite — never before a push.
```

There is **no per-module gate for ES, KO or FR.** For those, run the language's
suite directly:

```bash
npx vitest run --project curriculum src/features/languages/es    # or ko / fr / ja
npx vitest run --project curriculum-render src/features/languages  # mount-heavy
```

Vitest has **three** projects: `curriculum` (`isolate:false`, everything under
`src/features/languages/**` except `*.render.test.tsx`), `curriculum-render`
(the `*.render.test.tsx` files, split out because they broke under the shared
worker on CI's 2-core runner), and `app` (everything else).

**What each language's gates enforce** — read the test's own describe/it names for
the current statement; this is the shape:

- **JA** `src/features/languages/ja/__tests__/` — `moduleConformance`,
  `buildAnswerFloor` (answer-length floor, #139), `buildBankFamily` (no two
  surfaces of one word family in a bank, #90), `sentenceReuseSpacing`
  (#135/#138), `reviewWindowFloor` (six-module window), `verbGlossFidelity` (a
  verb's gloss must be the verb the course taught), `homographTeaching`,
  `homophoneAtomResolution`, `irAtomRegistration`, `fromModuleDrift`,
  `particleCueAnswerability`, `recognitionExposure`, `registerCue{Agreement,
  Grading,Inventory}`, `registerScaffoldIsolation`, `dialogueSpeakerRegistry`,
  `atomExposureAudit`, `unauthoredModuleAllowlist`, plus one
  `curriculum/__tests__/mN-neo.test.ts` per module (m13–m46; m3–m12 sit beside
  the module file — that split is what `module-gate` stage 1 works around),
  `n5CoverageLedger`, `symbolIntroExample`.
- **KO** — `introBeforeGraded` (m3–m27), `koCompoundingReview`,
  `particleCueAnswerability`, `koSiblingSets`, `freqUnlockStability`,
  `moduleConformance`, `koAudioCoverage`, `koHangulAudioCoverage`.
- **ES** — `moduleConformance`, `esPromptComprehensibility`,
  `esSentenceComplexity` (§4g floor), `esBarNegativeControls` (proves the bar
  gates can fire), `grammarHelpersWave2`, `esAudioCoverage`, `emitTtsDeck`.
- **FR** — `frCurriculum`, `frEngine`, `frContentAudits`,
  `frPromptComprehensibility`, `frArticleBakedSurfaces`, `accentPolicy`,
  `frSpeech{Elision,Hundreds,MinimalPairs,NearFuture,NegatedFrames,Negation,
  RecentPast}`, `frAudioCoverage`, `emitTtsDeck`.

Also available: `npm run authoring-audit` (per-module invariant backstop over
compiled output → `docs/reports/authoring-audit.md`), `npm run learner-view`,
`npm run authoring:surfaces`.

**Order-dependent failures** (the FR article race is the known one) need a
single-worker repro before you trust either result: `npx vitest run --maxWorkers=1`.
FR's glob-order race is class-fixed via `src/test/frEntryGuard.ts`.

## 4. Sweep the pattern, not the word

This is the single highest-value step and the one most often skipped.

A named-word fix closes one screenshot and leaves the class. When the sweep
finally ran it found **113 British "have got" forms** across m25, m27–m32 and m38
(169 replacements) and **"an elevator"-class articles in 44 registry entries and
58 IR gloss lines across 15 modules**. Neither was visible from the reported item.

```bash
# grep the pattern across every module of every course, not just the reported one
rg -n "<pattern>" src/features/languages/*/curriculum
```

**Then run the atom-collision check.** あき had to be reverted from "fall" because
it collided with おちる's short gloss "fall". A new gloss can steal another atom's
answer. Also check same-lesson propagation: a gloss change must reach that
lesson's MCQ options, dialogue options and distractors, or the lesson contradicts
itself.

Registering an atom in an early module **re-attributes its token course-wide**
(`atomModuleBySurfaceWord`) and can flip a LATER module's ratchet into violation —
registering `¿cómo se llama usted?` as an m2 atom flipped m15's `cloze-se`. Fix
the rippled module **token-neutrally** (a `matchPairs` grid over already-registered
surfaces exposes no new tokens); never raise the ratchet.

## 5. Ratchets are lower-only

`reviewWindowFloor`, `SHORT_ANSWER_BUDGET`, `unknownTokens`, `MATCH_PAIRS_FLOOR`,
the unauthored-module allowlist — Spencer's rule is **never raise**. If a number
went up:

1. Prove it is a re-measurement, not new debt (usually §2's stale-artifact case).
2. Write the cause into the gate as a comment.
3. Flag it to Spencer explicitly. Do not quietly re-baseline.

## 6. Grade answer positions, not every string

Modules **deliberately print wrong sentences** as MCQ foils. A naturalness or
semantic lint that reads the whole module blob will "fix" the pedagogy out of it.

Answer positions, by step type: `build_sentence` / `listening_build` →
`targetSentence`; `speaking` → `targetPhrase`; `particle_cloze` →
`correctParticle`; `agreement_cloze` → each `seg.blank.correctAnswer`;
`multiple_choice` / `word_image_mcq` → the **correct option only**; `info` →
«guillemet» spans. Exclude step IDs from text grading. Collect all violations
rather than failing fast. Use a whole-lesson blob only for bans that must hold
everywhere.

**Which slots may legally hold a fabricated form is decided by `esSurfaces()`** —
source of truth `es/__tests__/moduleBarGuards.ts`. BILLED (a wrong form fails
`unknownTokens`): `particle_cloze.options`, build/listen tiles, `match_pairs`
sources, the correct MCQ option, info-card «guillemet» spans, `audioText` /
`targetPhrase` / `targetSentence` / `transcript`. NOT BILLED (legal homes for a
ghost form): `multiple_choice` / `textMcq` / `word_image_mcq` distractors,
`dialogue_sim` options and tiles, `agreement_cloze` wrong-blank options.
`word_map`, `dialogue_sim` and `gender_sort` bill nothing. Five m15 authors were
once told the **opposite** of this rule — four re-derived it from source and
designed around it; the fifth would have failed provenance in every cloze.
**Verify against source, don't trust a brief.**

## 7. Floors the engine does not enforce — so authoring must

These gaps are open (RCA §2.4, zero commits). Do not assume the compiler will
catch them:

- **≥5 tiles** in sentence-build steps at higher modules (#139). Note the fix's
  predicate `isSentenceBuildStep` (`contentFloors.ts`) **rejects
  `particle_cloze`** — 549 of 559 particle-cloze beats have exactly 3 options and
  that is the type's normal shape (#168).
- **Session dedupe by content, not id.** `deriveModuleTestOut.ts` dedupes by
  `step.id`, so several distinct ids rendering the same sentence all survive
  (#129, worst in modules like m33 that author near-duplicate minimal pairs).
- **Level filter on filler and review pools.** #166/#167 was 5 filler vocab MCQs
  in 18 steps (28%) — the exact failure `recentVocabWindow.ts:108` exists to
  prevent.
- **Same-family distractor dedupe** (#90: 歌/歌う as two tiles).
- **Atom registration for review-pool entries.** `moduleCompiler.ts`'s `resolve()`
  fallback **silently self-translates** anything in a `reviewPool` that isn't a
  real atom — confirmed for all five character names across five occurrences
  (#128, the "Tanaka fail").
- **An explicit listening-comp beat that reuses a sentence beat's exact target
  collides with the auto review filler** drawn from the same beats. Vary it.

## 8. The cue must not be the answer

#153: register is taught **521 times and tested 8**. All three "who is this line
addressed to?" beats have byte-identical option sets; all five register clozes are
keyed on a ます/です ending, so the prompt hands over the answer. And the 4th
option is silently dropped on phones (`MAX_LISTENING_MCQ_OPTIONS = 3`).

Check: the learner cannot answer from the prompt's own cue, option sets differ
between beats, and the option count survives the phone cap.

Related doctrine: intro before review, always (machine-enforced); every content
word decomposes into atoms already taught (`fromModule` ≤ this module);
structure-true glosses; interleave rather than block-teach; per-step sentence
exposure ≤3; review-particle cloze ≤25% of a lesson; explanations ~3 short lines
quoting the course sentence. Max-acceptance is doctrine in the code
(`simTurnLogic.ts`, `types.ts`) and there are currently **zero `alsoAccepted`
entries in any JA IR file** — that gap is #140 and #154.

## 9. Mechanical gates cannot judge language

A taught-vocabulary residual check proves only "no untaught word". Twelve
local-model-drafted m30 sentences once scored **12/12 clean** and were all
worthless (`Mika たべてみる` — no particle, no object). Adding three structural
floors — at least one particle, a minimum length, and a collapsed-skeleton
comparison that flags N sentences built on one frame — took the same output from
12/12 usable to 0/12.

Both are mechanical. A human still has to confirm the particle is the **right**
particle. And never quote a pass rate you have not read: an ES batch scored 93%
while containing «yo cocino el lápiz». When output is wrong, **narrow the pool**
(per-verb object pools) rather than adding another validator.

## 10. Audio

Audio is not in this repo. `scripts/emit-tts-deck.mjs` (JA) /
`emit-ko-tts-deck.mjs` writes a deck into `../lingo-data/`; generation and
CloudFront live there. `getTtsUrl()` derives `sha256("<lang>:<text>")[:16]` and
checks `src/shared/tts/manifests/<lang>.json`.

⚠️ **The emitter is regex-based over source text.** A new factory shape or
filename it does not match is **skipped silently, and `wrote=0` looks like
success.** After authoring, verify with `npm run module-gate -- mN` (stage 2 is
the manifest-coverage diff) or `npm run verify:tts`.

New audio must ship **with** its manifest (stage mp3s in `tts-publish/`); a
manifest hash with no uploaded object serves the SPA shell and breaks playback.
CloudFront invalidation: the CLI rejects many inline `--paths` args — pass
`--invalidation-batch file://batch.json`.

## 11. Before you claim done

Run the `regression-classes` checks for C6 (compiled drift), C7 (ratchets), C8
(vacuous content gates), C9 (pattern sweep) and C3 (siblings), and paste their
output. Then `release-lap` for the push.
