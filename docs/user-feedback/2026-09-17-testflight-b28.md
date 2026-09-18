# TestFlight feedback — build 28 (2026-09-17)

Verbatim from ASC (`scripts/asc/pull-feedback.mjs`), screenshots in `testflight-feedback/NNN.jpg` (untracked). Triage follows the QA-walk protocol: fix inline, ledger each, audit after. Lead root-cause notes are in §2; lanes append their findings per row.

## 1. Items

| # | Time (UTC) | Verbatim | Class (lead) | Status |
|---|---|---|---|---|
| 186 | 23:17 | This step still fails, insane issue we have never fixed this is importsnt, need to stop fuxking it up some how | kanji_reveal shows い over 家 (reading truncated) — render/segmentation | open |
| 187 | 23:17 | This one worked though, strange  | same step type, worked — control case | open |
| 188 | 23:19 | I think this failed similarity check but it was basically there  | speaking: kanji transcript rejected vs kana target | fixed (structural, unverified on device) — see §2 B28B |
| 189 | 23:20 | Why not accepting? | speaking: same | fixed (same commit) — see §2 B28B |
| 190 | 23:20 | But it accepted this one, I don’t know if the previous one got my kanji wrong but I should have said it correctly  | speaking: same (accepted once → timing) | fixed (same commit) — see §2 B28B |
| 191 | 23:22 | Nice here, the shrink lets this fit, but we still want to eliminate scroll bar  | cloze: post-answer scroll (explanation box) | open |
| 192 | 23:23 | Just the word endings are preferred on things like this, look how long they are, they all use sotsugyou anyways | cloze options share a stem — factor the common prefix | fixed — see §2 B28B |
| 193 | 23:23 | Forces scroll too | cloze: post-answer scroll | open |
| 194 | 23:26 | Holy shit same renshusuru failure here, you need INCREDIBLY good research here, this is a miserable failure how do we fuck it up every time  | れんしゅうする tile in kana while sibling verbs show kanji — dual-atom class (#104/#110/#163) | fixed (renshuusuru+soujisuru; unverified on device/sim) — see §2 B28B |
| 195 | 23:27 | This doesn’t scroll, it shouldn’t, but you have 4 options seeded here. Another sloppy regression, why are we failing every time  | listening MCQ renders 4 options, 4th clipped (cap 3 gated on compact) | open |
| 186 | 23:17 | This step still fails, insane issue we have never fixed this is importsnt, need to stop fuxking it up some how | kanji_reveal shows い over 家 (reading truncated) — render/segmentation | fixed (mitigated), see §2 B28A |
| 187 | 23:17 | This one worked though, strange  | same step type, worked — control case | closed — explained, see §2 B28A |
| 188 | 23:19 | I think this failed similarity check but it was basically there  | speaking: kanji transcript rejected vs kana target | fixed (structural, unverified on device) — see §2 B28B |
| 189 | 23:20 | Why not accepting? | speaking: same | fixed (same commit) — see §2 B28B |
| 190 | 23:20 | But it accepted this one, I don’t know if the previous one got my kanji wrong but I should have said it correctly  | speaking: same (accepted once → timing) | fixed (same commit) — see §2 B28B |
| 191 | 23:22 | Nice here, the shrink lets this fit, but we still want to eliminate scroll bar  | cloze: post-answer scroll (explanation box) | fixed, see §2 B28A |
| 192 | 23:23 | Just the word endings are preferred on things like this, look how long they are, they all use sotsugyou anyways | cloze options share a stem — factor the common prefix | fixed — see §2 B28B |
| 193 | 23:23 | Forces scroll too | cloze: post-answer scroll | fixed, see §2 B28A |
| 194 | 23:26 | Holy shit same renshusuru failure here, you need INCREDIBLY good research here, this is a miserable failure how do we fuck it up every time  | れんしゅうする tile in kana while sibling verbs show kanji — dual-atom class (#104/#110/#163) | fixed (renshuusuru+soujisuru; unverified on device/sim) — see §2 B28B |
| 195 | 23:27 | This doesn’t scroll, it shouldn’t, but you have 4 options seeded here. Another sloppy regression, why are we failing every time  | listening MCQ renders 4 options, 4th clipped (cap 3 gated on compact) | fixed (100%), residual at 125% — see §2 B28A |

## 2. Lead root-cause notes

(see lane sections below)

### B28A — #186/#187 (kanji_reveal truncated reading), #195 (dialogue_listen 4-option overflow), #191/#193 (cloze post-answer scroll), ResizeObserver loop (build_sentence)

**#186/#187 — kanji_reveal reading truncation.** Root cause is NOT the ruby/
reading aligner: `alignFurigana("家","いえ")` and every one of the 154
switchover-eligible words (enumerated in a new test) reconstruct their FULL
reading correctly — confirmed by rendering `KanjiRuby` for all 154 and
asserting the `.kana-helper-ink` text equals the aligned `rt` every time.
The class this belongs to is the documented WebKit stale-paint family
(#12/#159/#162, `KanjiRevealAnimation.tsx`'s own comments): the wipe
animation's clip-path resting frame is asserted from a *plain* CSS rule once
`data-paint="done"`, but the existing repaint nudge only runs on an actual
interruption event (`visibilitychange`/`pageshow`) — on a loaded device a
frame can drop during the 560ms wipe→static handoff with NO interruption at
all, and nothing then forces WebKit to repaint the stale layer. Fixed by
running the same nudge UNCONDITIONALLY (two rAFs after settle) in addition to
the event-gated one. Could NOT force-reproduce the stale paint on the idle
15 Pro Max simulator in 4 attempts (3× 十/じゅう, 1× 家/いえ — added いえ to
the `/ja/qa/kanji-reveal` bake-off page as a permanent repro fixture,
`revealWords.ts`), consistent with the bug's documented intermittency
(device-load-dependent). #187 (見る) was never actually a different class —
it's the SAME code path with a shorter reading (1 kana), so a dropped frame
is far less likely to be visible; it isn't immune, just lower-probability.
**Scope: 154 switchover-eligible words, 131 of them (85%) single/short-kanji
with a longer kana reading — the exact shape of #186.**

**#195 — dialogue_listen 4-option overflow.** Root cause is NOT
`useFormFactor`/`forceVerticalLearnMap` misdetection — that predicate is
correct (verified: pure width+orientation media query, no font-scale or
pointer:fine dependency). The real bug: `DialogueListenStepView`'s embedded
question renderer (`currentQ.options.map(...)`) never imported
`MAX_LISTENING_MCQ_OPTIONS`/`selectDisplayedOptions` at all — a near-duplicate
of `ListeningComprehensionStepView`'s exact surface (the code's own comment
already called it "the same complaint one view over") that the #153 cap was
never ported to (class C3). Fixed by reusing `selectDisplayedOptions` from
`ListeningComprehensionStepView` (not re-deriving the cap). Verified on the
15 Pro Max simulator: `/ja/learn/lessons/ja-m34-neo-review-2?step=13`
(Mika's dialogue) renders exactly 3 options, 0 clip, `stageOverReportPx: 0`
at BOTH 100% and 125%; desktop (`compact:false`) still renders all 4.
**Residual, NOT fixed by this lane:** at 125% font scale this specific
question (3-line transcript + 2-line-wrapped heading + 3 options) STILL
visually overlaps the CHECK button — screenshot + numbers in the lane report.
This is a pre-existing, already-documented, deliberately-deferred defect
(`src/index.css` "SHORT-VIEWPORT STEP DENSITY" comment, 2026-08-09/08-20:
"`dialogue_listen` overflow at every value… a real defect, but not this
rule's to fix"). My fix improves 4→3 options (matching Spencer's own "3 is
fine on mobile" ruling) but does not eliminate the underlying structural
overflow for content-heavy dialogue questions — a measurement-based
content/option trim (not a flat cap) is the correct follow-up, flagged for
Spencer/next lane, not attempted here (out of scope, high blast radius).

**#191/#193 — cloze post-answer scroll.** `ParticleClozeStepView`,
`AgreementClozeStepView`, and `ConjugationClozeStepView` each rendered
`step.explanation` as one unclamped `<p>` whenever `submitted` (win or
miss) — completely bypassing `Feedback.tsx`'s own (win-only, full
show/hide) collapse mechanism, because these three views render the
explanation as a separate always-visible block instead of passing it into
`<Feedback explanation=.../>`. New shared `ExplanationBox` component
(`src/features/lesson/components/ExplanationBox.tsx`) clamps to
`line-clamp-3`, measures that collapsed height once via `clientHeight`,
and reuses that exact pixel value as the `max-height` for the expanded
(`overflow-y-auto`) state — so the box's rendered footprint (and the CTA
below it) is IDENTICAL in both states; "More" only opens an internal
scroll, never grows the box. `AspectChoiceClozeStepView` was checked and is
N/A — it never had a separate unclamped explanation block (only the
already-collapsed `ExplainButton` tooltip).

**ResizeObserver loop (build_sentence, `?step=16`, font scale 1.15).**
Root-caused to `tileFit.ts`'s single shared `ResizeObserver`, which
`observe()`s both every tile AND its scroller and whose callback
(`() => scheduleTileFitPass()`) can write `--tile-fit-scale` /
`--tile-row-h` — both LAYOUT-affecting (`index.css` line ~2078:
`height: calc(... * var(--tile-fit-scale))`; line ~1680:
`min-height: var(--tile-row-h, ...)`), not transform-only — back onto
those SAME observed elements. The pass already caps itself at
`MAX_PASSES_PER_FRAME = 8` (tileFit.ts:101) specifically as "the hard stop
on any observer feedback loop" per its own comment, and converges (this is
not an infinite loop or a real crash). But converging can still take
several corrective rounds within one animation frame, and the browser's
OWN ResizeObserver delivery algorithm has a SEPARATE, UA-internal depth
limit on how many notification rounds it will process before a frame boundary
— when this app's own convergence needs more rounds than the browser's
limit in one frame (more likely on a loaded physical device than an idle
simulator), the UA fires "ResizeObserver loop completed with undelivered
notifications" per spec. This is very likely a benign, already-designed-for
side effect of the existing anti-flicker cap, not a new bug — but I could
NOT confirm it live: 3 separate Chromium/Playwright repro attempts at
115% font scale (page load, slow taps, 150ms rapid taps, with both
`page.on("console")`/`page.on("pageerror")` and a capturing-phase
`window.addEventListener("error")`) produced zero ResizeObserver messages,
consistent with this codebase's established pattern that Chromium/WebKit
timing diverges from a real device's (`mobile-ui-verify` skill §1) and the
one true reproduction so far is Spencer's own device. Per the item's
constraint ("do NOT change sizing behaviour"), no code change was made —
this is the "explain in one paragraph" branch. Worth noting for whoever
picks this up: the app's error reporter (`errorReporter.ts`) hooks bare
`window.addEventListener("error", ...)` with no filter for this specific,
well-known benign browser diagnostic string, which is why it reached the
Sync panel as a reportable error at all — not something this lane's file
ownership covers, flagged for the owning lane.

### B28B — #188/#189/#190 (speaking kanji transcript), #192 (cloze shared stem), #194 (れんしゅうする kanji gap)

Branch `lane/B28B` off `feedback-2026-09-14`, 3 commits: `dc2147fe`, `df25b614`, `ba379c56`. JA lexical sidecar (JMdict) installed and used for #192.

**#188/#189/#190 — speaking step rejects a kanji transcript vs a kana target.** Two real structural bugs in `src/features/languages/ja/readingAnnotation/kuroshiro.ts` and `src/features/lesson/components/steps/SpeakingStepView.tsx`, both fixed:
1. `convertToHiragana` latched a module-scoped `initFailed` flag on the FIRST kuromoji dict-init rejection and never retried — one transient failure (cold-start race, first-run asset extraction) permanently disabled kanji→kana grading for the rest of the app session. Fixed: never memoize a rejected init; each failure clears the memo so the next call retries. Also added `warmKanjiReading()`, wired into the step's existing mount/intro warm-up (same pattern as the recognizer's `prepare()`), so the ~12MB dict load races grading less often.
2. `acceptedReadings()` only ever read `segment.surface`, which is DISPLAY-gated by the learner's kanji-unlock module — a sentence with an eligible-but-not-yet-unlocked word could never accept a natural (fully kanji) transcript on the fast synchronous path. Added `naturalKanjiSurface()` (unlock-agnostic, same safe atomIds the display pass already trusts) as a third accepted-forms candidate.

Scope (measured, 642 JA mock lessons): 692 speaking steps total; 242 carry a kanji-eligible atom in their target; 110 already render kanji directly (unaffected by fix 2); ~132 are the class fix 2 newly protects, plus any future eligible-but-locked sentence a review/practice pool builds (#188's own shape — I could not locate this exact sentence's authoring source; it does not appear in any live IR `speaking()` call or `kind: speaking` IR beat, so it is very likely dynamically composed by a review/grammar-practice pool at runtime from m30's listening-comp text). **Not verified on device or sim** — no speech-sim harness with injected transcripts exists in this codebase today (the memory describing one — `VITE_SPEECH_SIM`/`injectTranscript` — does not match current code; only `speechLog` exists). Verified instead via: a real (unmocked) kuroshiro+kuromoji conversion of the exact screenshot transcript (confirms the reading-conversion math is correct), full unit/component test coverage of both fixes, and the full JA gate suite green. **Open ask for whoever walks b29: reproduce #188's speaking step by lesson id/step to confirm live, and build/attach an actual speech-sim harness if Spencer wants one going forward — it doesn't exist yet.**

**#192 — cloze options share a stem.** Compile-time rule in new `scripts/lib/clozeStemFold.mjs`, wired into `scripts/compile-ir.mjs`: folds a shared NOUN+する prefix out of `particle-cloze` options into the sentence stem, gated on JMdict (headword existence) AND a textual する-conjugation check on every remainder (two independent false-positive classes found and rejected in dry runs — see the file's header comment and 14-case test). Course-wide sweep (m6-m46, the full JA IR range): only m34's そつぎょう cloze qualifies, at 3 occurrences (build lesson + 2 review-lesson copies) — `m34.ir.json` is the only content diff. Siblings: ES's `clozeLit` type has an analogous shape but its only shared-prefix cases are verb-conjugation-stem sharing (como/comes), exactly what this rule is designed to reject — N/A. FR has no live IR yaml in this repo. KO has no IR compiler. Gates: full JA curriculum vitest, `content:emit`, `qa:procedural --module m34 --enforced-only` (no failures), tsc clean.

**#194 — れんしゅうする renders in kana.** Root cause: `src/features/languages/ja/secondScript/n5Kanji.ts`'s `N5_KANJI` catalog stopped growing at m27 and was never extended into the N4 tier (m28-46), so 練/習 (練習する) and 掃/除 (掃除する) had no catalog entry — `KANJI_ELIGIBLE_ATOMS` (built by requiring every component kanji to be catalogued) never contained れんしゅうする or そうじする, on ANY surface (`applyKanjiSurfaces`'s sentence pass and `buildTileKanji.ts`'s build/listening-tile pass both gate through the same `resolveEligibleKanjiAtomId`). Fixed by adding the 4 missing characters + wiring `renshuusuru`/`soujisuru` into `anchorVocab`. **Class scope, exact**: 4 `conjugation.class:"irregular"` noun+する compound atoms exist in courseAtoms.ts (excluding bare する/来る, which already worked); of those, exactly 2 are live content today (soujisuru m45, renshuusuru m34) and both are now fixed — the other 2 (benkyousuru, sanposuru) are confirmed-by-test excluded by their OWN `fromModule: "future"` gate (unscheduled backlog, not a registry gap; scheduling them is a content decision outside this fix). 遊ぶ's missing furigana is **not a bug** — tile furigana visibility is a live per-atom FSRS-mastery read (`BuildTileSurface.tsx`'s `useBuildTileKanji`), independent of the catalog this fix touches; 遊ぶ (m4, one of the earliest verbs) reads as mastered for whichever account took the screenshot while 行く/明日 don't. Confirmed by reading the mechanism, not by checking that account's live SRS state. Tests: new sibling-parity block in `buildTileKanji.test.ts` naming all 4 atoms + a live-course sweep over every compiled build/listening_build step. **Not captured on the sim** — `sim:capture --simulate build` for the exact m34 listening_build step (`まいにち れんしゅうすることにする`, `m34.ir.yaml:412`/`478`) was not run before the usage-limit stop; the fix is proven at the unit/mock-lesson level (8066/8066 JA gate tests green, including the new live-course sweep) but not yet screenshotted on-device. **Open ask for whoever walks b29**: run the sim capture on `ja-m34-neo-6` / `ja-m34-neo-review-1` (wherever the `mode: listening` れんしゅうすることにする beat lands) at 100% and 125% to close this out with device evidence.

**Not started (ran out of budget):** the sim-capture proof for #194, and a live-device/sim repro for #188. Both are unit/mechanism-level proven, not device-verified.

**Regression-classes checklist:** C6 (compiled drift) — recompiled all of m6-m46 for #192, reverted 21 unrelated files whose ONLY diff was a pre-existing stale `lexiconKanas` entry (`たべすぎた`, unrelated to this lane, predates this session — flagged here, not fixed, to avoid unrelated blast radius) so only `m34.ir.json` shipped. C7 (ratchets) — none raised; N5_KANJI is additive-only. C3 (siblings) — done for both #192 (ES/FR/KO) and #194 (all 4 class members named and tested). C9 (pattern sweep) — done for #192 (whole-course grep-equivalent via the compiler itself) and #194 (whole-class enumeration from courseAtoms.ts). C15 (wrong file) — confirmed #194's mechanism via 3 independent call sites (`applyKanjiSurfaces.ts`, `buildTileKanji.ts`, and ruled OUT `CardFront.tsx`/flashcards as a different, unrelated code path per b13 #104's history).
