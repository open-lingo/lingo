# Handoff — KO uplevel + JA/KO frequency waves (2026-08-26/2026-09-01)

The re-entry doc for the vocabulary/re-author program. **Read this whole file
first** — it supersedes the three research docs' own status lines (they were
written before the work landed). Companion for the morning's app-store/infra
work: `handoff-2026-08-25-appstore-wave.md`.

## Spencer's standing directive (verbatim intent, 2026-08-26 evening)

Do BOTH programs — (1) the JA frequency-gap wave, (2) the KO re-author with
frequency + fluency-level data — myself, using good capable subagents, **never
more than 2 subagents at a time** (they cannot spawn their own), working
slowly/incrementally. Insert-lessons that teach gap vocab THROUGH the module's
grammar are the approved mechanism; he explicitly wants MORE dialogue steps.
He accepted adding a lesson to most modules. This directive is still ACTIVE —
nothing has closed it out.

## STATUS AS OF THIS HANDOFF: JA wave 0 + F18 pilot DONE. KO data track DONE.
## Whole tree UNCOMMITTED. No commit/push approval given yet — ask before either.

Full verification just run (2026-09-01): `npx vitest run --project curriculum`
→ **7,686 passed, 7 skipped, 0 failed**. `npx tsc --noEmit` → clean.
`npx vitest run --project app` → **2,423 passed, 17 skipped, 1 failed**
(`audioCoverage.test.ts` — F18's 9 new sentences have no TTS clip yet; this is
real, expected, pending work, not a bug — see "What's actually left" below).
`node scripts/exposure-audit.mjs` ratchet test green. `atomExposureAudit.test.ts`
green (registrations didn't blow the ratchet).

## The three research docs (all written 2026-08-26, all uncommitted)

1. **`docs/ja-freq-gap-plan-2026-08-26.md`** (797 lines, Opus-authored) — THE
   JA plan, wave 2 of the existing B067 program in
   `docs/vocab-exposure-audit-2026-07-29.md` (AUTHORITATIVE, 6/13 packs
   shipped before this wave). Real gap ≈110 words. 23 insert lessons m6–m36
   mapped word→module→grammar. Register split (すごい-band now / めちゃ・まじ・
   やばい one m38 lesson / 俺・お前-band m47 recognition-only). Retags
   やっぱり→m25 もちろん→m24 べつに→m29 ぜったい→m25 (NOT yet applied — see
   below). NO new modules; NO course-wide re-authoring. Effort ≈28–33 days
   total, 31 lessons, ~750–800 TTS clips for the whole plan (F18 alone used 9).
   **"Wave 0 + F18" was its own "ship first" recommendation — DONE, see below.**
2. **`docs/ko-freq-level-research-2026-08-26.md`** — KO data/licensing
   research. NIKL sources are KOGL Type 1 (commercial OK, attribution only).
   Its own "blocked, raw files absent" status is STALE — the data track below
   fixed that.
3. **`docs/ko-authoring-infra-gap-2026-08-26.md`** — KO-vs-JA authoring
   infrastructure comparison, COMPLETE (an agent finished this 2026-08-26).
   Headlines: KO should copy the **ES codegen IR pattern** (compile-ir-es.mjs
   → TS through factories, frameless mode), **NOT the JA compiler**; KO has
   **no authoring guide or pinned invariants** (prerequisite #1 for any KO
   authoring wave); module-gate.mjs and all ~25 JA ratchet suites are
   JA-hardcoded; KO grammarHelpers = 12 factories vs JA's 40+ (missing
   dialogueSim/matchPairs/grammarRule/review pickers/conjugation steps);
   **dialogue steps blocked on a second KO voice** (only SunHi exists, no
   ja-keita-style pseudo-lang, no dialogueSpeakers.json); ONE review lesson
   in all of KO; TTS emitter exists (1,526 clips) but no gate enforces
   coverage; also flagged: placement bank m1–m3 only, RR romanization never
   fades, learner-sim walks are ES-hardcoded, authoring-context.mjs JA-only.
   Ends with a 14-item ordered punch-list — guide+invariants, quality gates,
   factory parity, review machinery, and dialogue voices all BLOCK any KO
   authoring wave; NIKL re-ingest was on the list and is now done (below).

## PART 1 — JA wave 0: DONE (uncommitted)

What shipped, all verified against the live tree, not just "should work":

- **7 stale-priorVocab IR recompiles** (m17/m18/m20/m21/m24/m27/m28) via
  `node scripts/compile-ir.mjs <m>`. Verified each diff is
  `priorVocab`/`priorAtoms`-array-growth ONLY (no other key changed) by a
  Python before/after key-diff — not eyeballed.
- **`taughtVocab.ts` `IR_BY_MODULE` extended m32→m38** (was capped at m31,
  silently falling back to the stale `fromModule` path for 7 live modules).
- **Explicit `freqRank` on all 309 `fromModule: "future"` vocab atoms** in
  `ja/courseAtoms.ts`, seeded via a one-off codemod (`freqRank` is a NEW
  optional field on `CourseAtom`). `ja/frequencyAtoms.ts` now reads
  `atom.freqRank` and sorts by it instead of deriving rank from array
  position — re-homing an atom off `"future"` no longer reshuffles every
  later atom's unlock module. `frequencyAtoms.test.ts` (shared file, both JA
  and KO cases) gained 3 new assertions: every future-vocab atom has a rank,
  no non-future atom carries one, and `JA_FREQ_LAST_MODULE` is asserted equal
  to the max live module id (test reads `jaModule.curriculum`, not a literal).
- **`JA_FREQ_LAST_MODULE` 30→38** — was 8 modules stale (course ships to m38,
  constant said 30; overflow piled early, a learner past m30 saw nothing new
  in the frequency deck). This is a deliberate, test-guarded behavior change:
  frequency-deck unlock modules for ~300 backlog words now spread across
  m30–m38 instead of piling at m30. Opt-in deck only; no SRS state touched.
- **NEW `ja/dev/tileDump.test.ts`** — mechanizes the "m22/m25 whole-course
  tile-diff" registration procedure (`docs/RUN-PLAN-n4.md`) as an env-gated
  spec: `TILE_DUMP_OUT=/path npx vitest run --project curriculum
  src/features/languages/ja/dev/tileDump.test.ts` dumps every compiled step
  of every JA lesson (`moduleId/lessonId/index \t JSON`) to that file;
  otherwise it's skipped and costs nothing. Confirmed deterministic
  (byte-identical across two runs) before trusting it. **Use this before/after
  every future atom registration** — diff the two files; any change to
  `correctOrder`/`tiles` outside the expected pool, or ANY change to a
  non-`tiles` key, is a red flag.
- **Registered 5 taught-but-invisible atoms**, each checked with the tile-diff
  procedure above (zero tokenization changes; only distractor-tile pool
  membership shifted, confined to the atom's own module):
  - もし (`m37`, blocked, needs 2 deepen beats for inv-14 coverage — wave 1
    item, not done here)
  - うそ (`m1`, blocked, NO `introducedByLessonId` — deliberately unset; the
    real vocab-unit teaching is F3, which doesn't exist yet; setting a
    dangling id would be a B068 ratchet failure AND would suppress the
    module-fallback unlock path)
  - おれ (`m10`, blocked, recognition-only; production register is m47's call)
  - `p-nagara` (particle, `m36`) — tile diff: 11 steps changed, m36 only,
    tiles-only
  - `p-tte` (particle, `m18`, comment flags the bound-morpheme hazard —
    substring of every whole て-form atom; longest-match still wins, verified
    って never surfaces as a standalone tile) — tile diff: 23 steps changed,
    m18 only, tiles-only
  - **だけ was deliberately NOT registered**, contra the plan's §4.2 — a
    standing `FROZEN_UNREGISTERED` ruling in `irAtomRegistration.test.ts`
    (m35 landing) says a global だけ atom shatters だけど tiles in nine
    modules. The standing ruling overrides the newer plan; documented in the
    registry comment.
  - The 4 retags (やっぱり/もちろん/べつに/ぜったい, all currently on the
    `thr-n4` sentinel) were **deliberately NOT done** — retagging ahead of
    their insert lessons would unlock them with no intro. べつに's retag to
    m29 specifically happens with the F18 lesson that teaches it — F18 taught
    じゃん/っけ/さ/わ instead (see below), so べつに's retag is still open,
    now correctly sequenced to whichever lesson actually teaches it.
- **NEW `ja/__tests__/unauthoredModuleAllowlist.test.ts`** — the 13
  never-unlock atoms (4×`thr-n4` + 9×`m49`) converted from silent debt into a
  named, shrink-only allowlist (mirrors `FROZEN_UNREGISTERED`'s pattern
  applied to the other arrow). `sidequest-survival` exempted as a live
  non-module teaching surface. Two tests: every non-live-non-future
  `fromModule` must be on the allowlist; the allowlist itself must have no
  dead entries (atom moved/gone/module went live).
- **STILL OPEN, not blocking**: plan §7.4's conjugation-table rows (7 new
  `ADJ_ENTRIES`, ~14 new `VERB_ENTRIES`) — needed before pack F4 (m12) and
  F21 (m33) can compile-clean, NOT needed for F18 or wave 0.

## PART 2 — F18 pilot lesson (`ja-m29-neo-14`): DONE (uncommitted)

Two general-purpose subagents (sequential, not concurrent — the ≤2-at-once
rule was honored across the whole session but this lesson itself only ever
needed one slot) authored this; the first stalled twice on an infra
watchdog (600s no-progress) and was resumed both times from its own
transcript — no work was lost either time. **I (main session) then
independently verified the output myself** — ran the full test suites, found
and fixed one real defect the agent's own "suspiciously clean" self-doubt
had correctly flagged but not yet chased down before it stalled the second
time.

**What it proves**: `dialogue_sim` works below m34 (the plan's central
claim — there was never a module/tier gate, the absence pre-m34 was purely
historical). This is the course's 12th sim and the first below m34.

**Where it lives**: `src/features/languages/ja/curriculum/ir/m29.ir.yaml`,
new lesson block `id: m29-neo-14` (id ≠ position, precedented — the plan's
proposed id `ja-m29-neo-10` collided with an existing lesson; `-14` was free).
Wired into `M29_NEO_LESSONS` in `m29-neo.ts` between L11 and review-3. m29 is
now 14 lessons (10 teaching + 3 review + 1 challenge, challenge still last —
inv 25 holds).

**Content**: teaches じゃん (casual じゃない, "…right?"), っけ (recall
question, "…was it?"), さ (soft filler, "…y'know", anchored on あのさ), and
わ (recognition-only, gender/register-marked emphasis) — 4 of CEJC's top-130
enders (#32/#63/#84/#129 per the plan). All four are **IR-only bound
enders** — no `courseAtoms.ts` rows, same treatment as m29's own よ/ね:
- Added to `BOUND` in `src/features/lesson/data/moduleCompiler.ts`
- Added to `BOUND_ENDERS` in `src/features/lesson/data/boundEnderProduction.test.ts`
- Added to `FROZEN_UNREGISTERED` in `src/features/languages/ja/__tests__/irAtomRegistration.test.ts`
- Excluded from the lesson's `reviewPool`
- わ ships as exactly one listening-comp beat, never a production target,
  never a build tile — its entire treatment, per the plan.

**Deviations from the plan's worked example** (the agent's, verified sound
by me): fresh id (collision, above); **2 rule cards, not 3** — moduleBarGuards
caps the pinned grammar_rule run at 2 (m34-neo-1 precedent), so じゃん rides a
second `variant` under the existing `janai-desu` card and っけ+さ share one
new `ka-question`-family card; no plain volitional anywhere (いこう is m34
material — the sim's suggestion beat uses a negative-question invitation,
「うちで のまない？」, instead); all carrier nouns pulled from m29's own
"quiet" allowlist (かぎ/かさ/くつ/etc.) to respect the module's carrier-rotation
discipline, never the 9+13 words m29's IR notes explicitly ban.

**One real bug found + fixed after the agent's report**: beats 2 and 3
originally used the IDENTICAL sentence (「この ぼうしは たかいじゃん。」) as both
a build target's audio and a separate listening-comp's audio —
`reviewFillerVariety.test.ts`'s "never comprehension-checks the same audio
twice in a lesson" gate caught it. Fixed by swapping the listening-comp's
carrier noun to かさ (also on the quiet list) — recompiled, gate now green.
This was MY fix, done directly in this session after the agent's last
message ("suspiciously clean... let me verify directly") turned out to be
right to be suspicious about, then stalled before finding it.

**What's actually left for F18** (the ONLY remaining gap — everything else
is green):
- **TTS**: 9 new sentences have no clip yet (`audioCoverage.test.ts` names
  them exactly — see that file's own header for the regen command chain:
  `emit-tts-deck.mjs` → `lingo-data`'s `pipeline.tts.generate --lang ja
  --provider edge` → `gen_dialogue_voices` → `emit_manifest` → `upload` →
  copy the manifest into `src/shared/tts/manifests/`). I ran
  `emit-tts-deck.mjs` to confirm the phrases are captured (9,164 JA phrases
  total in the deck — that's the WHOLE course's deck, not just F18's 9; it's
  additive/idempotent, not a problem) but did NOT run the actual
  `pipeline.tts.generate` network step — that's a real batch job (network
  calls to edge-tts) that deserves its own explicit go, not something to run
  mid-handoff. **This is the single blocking item before F18 can ship.**
  `kind: register` beat OPTIONS are matched by NOTHING in the emitter (a
  standing plan warning) — verify the register beat's own audio (if any) is
  covered separately; this lesson's register beat carries no separate audio
  beyond its constituent option strings, which ARE covered as ordinary
  sentences elsewhere in the module.

## PART 3 — KO data track: DONE (uncommitted)

One general-purpose subagent, completed cleanly (no stalls). I independently
verified its output on live data before trusting the numbers (per house
rule — green code ≠ correct output).

- Restored `scripts/data/ko-frequency-raw/` (gitignored, as intended): all
  three NIKL sources re-downloaded with NO login needed (`/common/download.do`
  + a Referer header) — 학습용 어휘 목록 2003 (.xls, 5,965 rows), 사용 빈도
  조사 2002 (ZIP, needed a cp437→cp949 filename re-decode, 58,437 rows), and
  **국제통용 한국어 표준 교육과정 2017** (NEW source this pass, 10,635 words,
  levels 1–6 — the fluency-level analogue to French's FLELex, but legally
  clean where FLELex is not). Provenance committed-side at
  `scripts/data/ko-frequency-raw.SOURCES.md` (URLs, dates, KOGL Type 1
  attribution line, format gotchas).
- `scripts/ingest-ko-frequency.mjs` rewritten: **homograph-aware join** on
  the corpus's digit-suffixed keys (이05/이04/이03/이09 etc.) instead of
  summing counts across all senses of a bare surface — verified live: 이
  "this" rank 9, "tooth" rank 2450, "louse" rank 995, "two" rank 1220 (was
  all smeared into ranks 11–12 before). 5,790 exact matches, 1 POS-resolved,
  4 absent (그렇게/이렇게/저렇게/깍두기 — corpus lemmatizes them differently,
  falls back to native rank). Grade A/B/C kept through to output (was
  discarded at ingest before); 국제통용 intlLevel 1–6 joined on surface+POS
  (same-POS homograph senses get levels positionally — frequent sense ↔
  lowest level, a documented heuristic, not exact). New `--graded-vocab` and
  `--dry-run` CLI modes.
- **`docs/data/ko-graded-vocab.json`** emitted — 5,795 entries, the KO
  analogue to `ja-neo-vocab.json`. Grades: A 899 / B 2,053 / C 2,843.
  IntlLevel: 1→636, 2→979, 3→1,119, 4→1,540, 5→297, 6→117, null→1,107 (mostly
  C-tier + pure function words the intl list doesn't carry a vocab row for —
  verified this is a real source gap, not a join bug). Spot-checked 학생/
  선생님/친구 — sane ranks (230/198/148), grade A, level 1, m3, matches
  reality.
- **`docs/ko-gap-audit-2026-08-26.md`** — coverage vs 333 taught surfaces:
  **top-100 32%, top-500 20%, grade-A 27% (34% within top-500), grade-B 1%,
  intlLevel-1 31%, intlLevel-2 4%**. 742 untaught grade-A/level-1 words, top
  60 listed with register/grammar-word flags. Register caveat carried
  forward honestly: these are WRITTEN-corpus ranks; KO still has zero spoken
  signal (blocked on the NIKL Modu application, Spencer-only, see below).
- **Registry regeneration explicitly NOT done** (was out of scope) — dry-run
  diff: **0 id changes** (all 2,998 atom ids stable, homograph suffixes
  included), 2,993/2,998 `frequencyRank` values would change, 562
  `unlockModule` drip-bucket moves. **Before regenerating**: port JA's new
  explicit-`freqRank` stabilizer to KO first (`ko/frequencyAtoms.ts` — same
  problem JA just fixed, not yet ported), or the regen will hit the exact
  silent-reshuffle bug wave 0 just closed for JA.
- One `src/` touch: optional `grade?`/`intlLevel?` fields added to
  `src/features/languages/frequencyTypes.ts` so the future regen type-checks.
  `npx tsc --noEmit` clean; scoped `frequencyAtoms.test.ts` passed at the
  time (and the full suite passes now, including this file, post-wave-0
  edits on top of it).
- **Flagged for review, not yet actioned**: (1) verify "출처: 국립국어원"
  actually renders somewhere in the app's credits screen — a KOGL Type 1
  attribution obligation, unverified; (2) `currentModule` in the graded JSON
  joins on BARE surface, so all senses of a polysemous glyph show the same
  module (fine for ranking, not homograph-true — matters only if something
  consumes `currentModule` per-sense later).

## Execution order — what's actually next

1. ~~JA wave 0~~ **DONE.**
2. ~~F18 pilot~~ **DONE except TTS generation** (the one blocking step —
   run the `pipeline.tts.generate` chain for JA, or ask Spencer if he wants
   to batch it with more packs first to amortize the network step).
3. ~~KO NIKL re-ingest~~ **DONE.**
4. **B067 packs 7–13** (the rest of the JA freq-gap plan, TTS mostly already
   exists per the plan) — natural next JA content step, same insert-lesson
   mechanism F18 just proved out, same tile-diff discipline for any new
   registrations.
5. **Port JA's freqRank stabilizer to KO** (`ko/frequencyAtoms.ts`) before
   regenerating the KO registry from `ko-graded-vocab.json` — prerequisite
   for the next KO step, not yet started.
6. **KO re-author proper** per the 14-item infra punch-list (doc 3) — guide +
   pinned invariants FIRST (KO has neither), then ES-style quality gates,
   then factory parity (dialogueSim/matchPairs/grammarRule/review pickers),
   then a second KO TTS voice (blocks any KO dialogue_sim), then the
   compound-vowel/batchim/interleave authoring arcs. This is the long pole;
   nothing here has started.
7. **Spencer-only items** (unchanged): NIKL Modu spoken-corpus application
   (unblocks KO spoken-register data); commit/push decision for the entire
   tree above (large — ~30 files, spans two independent programs); Auth0
   Native app for the app-store track (unrelated, still pending per that
   handoff); SNS confirmation emails; Trevor's terraform apply (cost
   breaker) + his infra review checklist.

## Standing constraints (unchanged, bite hard)

No AI attribution in commits; commit/push ONLY on ask (asked multiple times
this session, no answer yet — the tree has grown substantially since the
last ask, so ask again fresh rather than assuming stale consent); `npm run
preflight` before any push to main + verify deploy RUN CONCLUSION after;
never `git add -A` (concurrent sessions share this tree — verify nothing
unexpected is staged before any commit, given the tree's size right now);
max 2 subagents at a time, subagents cannot spawn subagents (self:
maintained throughout — F18's two subagent runs were sequential resumes of
the same agent, KO's was a single concurrent agent, wave 0's mechanical work
was done directly); TTS: new audible strings need the lingo-data pipeline —
verify manifest membership BEFORE authoring listening/audio steps around a
sentence (the tileDump/audioCoverage gates now catch this mechanically for
JA if you forget); vocab-gate/ratchet flips are expected when registering
atoms — fix token-neutrally with the tile-diff procedure, now mechanized at
`ja/dev/tileDump.test.ts`.

## Full list of uncommitted files (verify with `git status` — this may have
## grown further if you've kept working)

Modified: `.gitignore`, `docs/INDEX.md`, `scripts/ingest-ko-frequency.mjs`,
`src/features/languages/frequencyAtoms.test.ts`,
`src/features/languages/frequencyTypes.ts`,
`src/features/languages/ja/__tests__/irAtomRegistration.test.ts`,
`src/features/languages/ja/courseAtoms.ts`,
`src/features/languages/ja/curriculum/__tests__/m29-neo.test.ts`,
`src/features/languages/ja/curriculum/ir/{m17,m18,m20,m21,m24,m27,m28,m29}.ir.json`,
`src/features/languages/ja/curriculum/ir/m29.ir.yaml`,
`src/features/languages/ja/curriculum/m29-neo.ts`,
`src/features/languages/ja/curriculum/taughtVocab.ts`,
`src/features/languages/ja/frequencyAtoms.ts`,
`src/features/languages/ko/courseAtoms.ts`,
`src/features/languages/ko/curriculum/{m1-intro,m1-rows,m3}.ts`,
`src/features/languages/ko/grammarHelpers.ts`,
`src/features/lesson/data/boundEnderProduction.test.ts`,
`src/features/lesson/data/moduleCompiler.ts`,
`src/shared/domain/mockCourse.test.ts`, `src/shared/domain/mockCourse.ts`.

New (untracked): `docs/data/ko-graded-vocab.json`,
`docs/handoff-2026-08-26-freq-wave.md` (this file),
`docs/ja-freq-gap-plan-2026-08-26.md`,
`docs/ko-authoring-infra-gap-2026-08-26.md`,
`docs/ko-freq-level-research-2026-08-26.md`,
`docs/ko-gap-audit-2026-08-26.md`,
`scripts/data/ko-frequency-raw.SOURCES.md`, `scripts/prod-bundle-check.mjs`,
`src/features/languages/ja/__tests__/unauthoredModuleAllowlist.test.ts`,
`src/features/languages/ja/dev/tileDump.test.ts`,
`src/features/languages/ko/__tests__/introBeforeGraded.test.ts`.

(`scripts/data/ko-frequency-raw/` itself is gitignored by design — raw NIKL
files live only on this machine; re-download URLs are in
`docs/ko-6k-vocab-sourcing-2026-07-24.md` if it's ever lost again.)

## KO m1–m3 audit context (older, still relevant background)

2026-08-26 Sonnet 3-agent audit of KO m1–m3 vs JA benchmark, Tier-1 fixes
already folded into the "uncommitted files" list above (이 particle/number id
collision fix via `idSuffix`, all-10-numbers intro cards, mastery test
rewrite, 학생/선생님 intros, m1-intro block-geometry fix, ROW_M 미→무, new
`introBeforeGraded.test.ts` gate for m3). **Tier-2 still fully open** (real
authoring, folds into the "KO re-author proper" step above): compound
vowels never taught but used from m3 (이에요/예요 contains ㅔ/ㅖ); batchim at
~1/7 depth (no [k]/[p] groups, no 연음 liaison); NO review-interleave
machinery anywhere in KO; m1 has no cross-row review/capstone/confusables
map; m2 is an un-interleaved 27-lesson row march; m1/m2 single-glyph speaking
stubbed (m3+ sentence speaking IS live via Whisper). KO advantages worth
preserving/porting: concept-first Hangul intro, allophony notes,
`validateRowVocab`, disciplined stories.

## Prod module-error incident — CLOSED (older, unrelated, keeping for record)

`vite:preloadError` self-heal shipped f15d8806, deployed, verified. Spencer's
repeat report was the pre-fix stale-client cohort (old chunk hash vs current)
— hard refresh fixes permanently. `node scripts/prod-bundle-check.mjs` is the
repeatable prod self-consistency test (fingerprint + full chunk sweep); last
run was CONSISTENT.
