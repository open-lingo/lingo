# Recurring complaints — cross-session RCA (2026-05-18 → 2026-09-15)

Spencer, 2026-09-15: *"I feel like so many things are surfacing again."*
This doc answers: which complaint classes recur, which fixes were followed by
the same complaint, and why. Inputs: every `docs/user-feedback/*` ledger,
the handoff/ledger docs from 2026-07-17 onward, `git log --grep TestFlight`,
and the 26 untriaged b15 comments (#118–#143). Three era summaries (Sonnet,
read-tag-count) are in the session scratchpad `fb16-research/rca-era{1,2,3}.md`;
counts below come from their tables.

Items: #1–#62 = builds 5–8 (era 1), #63–#86 = builds 9–12 (era 2),
#87–#143 = builds 13–15 (era 3). 143 TestFlight items in 11 days.

## 1. Recurrence matrix

| Class | era 1 | era 2 | era 3 | total | fix commits | re-reported after a fix? |
|---|---|---|---|---|---|---|
| sizing-tiles (build/match tiles) | 14 | 1 | 5 | **20** | 8 (see §2.1) | **Y ×4** (#55 after fb77a859; #114 after 3e1b7f07; #117 after 7ca257e4; #119/#124/#125/#137 after f76e7f51) |
| sizing-other-surface (home, practice, so-close, complete screen) | 12 | 2 | 4 | 18 | 6 | Y ×1 (#63 fixed twice) |
| authoring-gloss-or-grammar (unnatural EN, wrong/primary verb) | 8 | 3 | 7 | 18 | 5 | **Y as a class every era**; #72 sweep never run |
| furigana (size, spacing, centring, visibility) | 7 | 2 | 4 | 13 | 6 | **Y ×3** (#62 after c1faad87; #73 fixed twice; #117 regression from 7ca257e4) |
| kanji-surfacing (kanji missing / wrong) | 4 | 0 | 7 | 11 | 2 (era 1 only) | **Y**: #12→#59 (build lag); #115→#120/#133/#141 (no fix exists) |
| audio (clip content, bleed, dropout) | 2 | 2 | 5 | 9 | 3 | Y: bleed fixed for lessons, back on test-out (#127) |
| authoring-short-or-weak (short sentences, low-module filler, duplicate sentence/tiles) | 0 | 0 | 7 | 7 | **0** | class never fixed: #90 #91 #116 #135 #138 #139 #129 |
| info-card-fit (rule cards overflow) | 1 (+ES known) | 0 | 4 | 5 | 1 | Y: no scroll/max-height ever added |
| review-pool-fsrs | 0 | 1 | 2 | 3 | 3 | in-lesson pool (#116) never fixed |
| test-out-engine | 0 | 1 | 2 | 3 | 2 | N (new mechanisms each time) |
| progress-state | 0 | 0 | 1 | 1 | 0 | untriaged (#123) |
| flashcards | 1 | 0 | 4 | 5 | 2 | N |
| feature-ask / question / other | 11 | 7 | 8 | 26 | — | — |

Four classes account for 62 of 117 defect items (53%): tile sizing,
furigana, kanji surfacing, and gloss/naturalness. All four recur every era.

## 2. Why each recurring class keeps coming back

### 2.1 Tile sizing: tuned by complaint, never against a spec

Eight commits touched the same three files in nine days, each answering the
latest screenshot:

| commit | date | what it did | next complaint |
|---|---|---|---|
| fb77a859 | 09-06 | fit dense JA/ES steps on phones (#2–#31) | #55 "still vertical crowding" |
| c1faad87 | 09-07 | furigana overhangs, tighter leading (#36 #47 #49 #50 #52) | #62 tiles not centred |
| 1b5735c1 | 09-09 | trim furigana band 3px (#50) | #69 "too much padding" |
| 3e1b7f07 | 09-14 | tiles −15%, padding −12.5% (#69 #75 #71) | #87 "shrunk the wrong thing" |
| 1ff07d06 / 8316fcf6 | 09-14 | band 0.55em; ruby sits higher (#70 #73) | — |
| 7ca257e4 | 09-14 | kanji-reading floor 10px (#87 #88 #95) | #114 "too small", #117 furigana gone |
| f76e7f51 | 09-14 | words +10%, kana tiles ×1.2, huge banks no scroll (#114 #117) | #119 #124 #125 #137 "inconsistent across build types" |

Root causes, in order of weight:

1. **No written tile spec.** There is no single statement of "tile height =
   H, word size = W, reading band = R, same on every build-type surface."
   Each lap set one knob for the surface in the screenshot (dense build
   tiles, then match tiles, then listen-build). #137 asks for exactly that
   spec plus a QA page. That is the fix, not another knob.
2. **Measured on the wrong harness.** Every number before 2026-09-15 came
   from headless Chromium at 390×844 with a zero-state user. His phone is a
   15 Pro Max on WebKit with hundreds of test-out-seeded atoms. WebKit's
   ruby box is 5px taller, safe-area insets are 0 in Chromium, and the
   mastered path never rendered. The simulator harness (safaridriver + app
   shell) only arrived for build 15.
3. **Shared component, per-surface patches.** `AnnotatedText`/`KanjiRuby`
   sit under every step type. Fixes were classed on one surface and shipped
   without re-shooting the others (#124: "didn't apply here").
4. **Box-height as the constraint.** #69 asked for smaller tiles; the fix
   shrank the word to hold the box. #87 and #114 are the direct result.

### 2.2 Furigana and kanji: three gates that were never reconciled

What decides whether a tile shows kanji and whether the reading is visible:

- per-module kanji anchors (`applyKanjiSurfaces` / `N5_KANJI`) — content
- SRS mastered gate on the tile (`isMastered`) — learner state
- test-out seeding (#80, 35a4e1a2) writing mastered-length intervals with
  `reps: 0` — placement

Built in three different lanes, no cross-check. Result: #117 (every reading
vanished after test-outs), and the still-open kanji class (#115 #120 #133
#141: "I tested out, where is my kanji?") because kanji surfacing reads the
module anchors, not the learner's placement. Era-1 kanji items (#12 #59) were
a separate WebKit repaint bug that shipped "hardened" and unverified.

Fix shape: one `readingPolicy(atom, learnerState) → {kanjiShown,
readingShown}` used by every tile surface, with tests for seeded state, and a
kanji-known inference from tested-out modules.

### 2.3 Gloss and naturalness: the sweep was deferred and the class returns every lap

#10 #13 #15 #19 #25–#28 (era 1, Britishisms + register glosses) → #72 #74
#76 (era 2, m30 unnatural EN) → #97 #98 #102 (era 3) → #118 #121 #134 (b15).
Each lap fixed the named words. The course-wide sweep (#72, "unnaturalness
sweep") has been on the to-do list since 2026-09-14 and has not run. Each
new lesson Spencer walks produces the next three.

### 2.4 Content selection ignores level: never fixed at all

#91 (low-module filler in advanced review) → #116 (いいえ in review) → #135
(simple version after the hard one), #139 (never < 5 tiles), #138 (same
question twice), #129 (same sentence twice in a test-out), #90 (歌/歌う
duplicate tiles). Zero commits. The selection code (`deriveModuleTestOut.ts`
sampling `reviewPool`, `moduleCompiler.ts` distractors) has no floor on
sentence length, no dedupe across a session, and no level filter.

### 2.5 Audio: fixes scoped to one surface

- Clip content: TTS keyed on kana, so homophones share one clip and は is
  read "ha"/"wa" by the engine's guess (#9 era 1 → #93 #100 #106 era 3).
  Fixed per word each time; emitting the kanji surface to TTS by default is
  still a to-do.
- Playback: stop-on-navigate was added for lessons; test-out has its own
  stop calls and #126/#127 (dropout, bleed) are the test-out instance.

### 2.6 Info cards: known since the ES tester brief of 2026-09-02

"Info cards run long on a phone" was already on the ES "please don't
re-report" list. #39 fixed padding. The grammar-rule container still has no
max-height or internal scroll (#132), and rule rows are not aligned to the
example endings (#131).

### 2.7 Build-lag phantoms (not regressions)

#59, #60, #65, #85 were re-reports against a build that predated the fix.
Four of the "it came back" items are this. The ledger now records the build
each fix lands in; triage should check the `build` field before reopening.

## 3. Process failures behind the recurrences

1. **Green-but-blind harnesses, three times.** Authed routes asserted nothing
   (0 cookies, 273 skipped); public-only flag left on in CI; safe-area insets
   are 0 in Playwright Chromium. Each was found after a device report.
2. **Chromium ≠ WebKit, bypass user ≠ Spencer.** Fixed for build 15 only.
3. **Fixes shipped unverified against the reported state** (#12 "not
   reproducible in the sim", #92 blocked-flag hypothesis, #77 desktop art
   shot in the wrong theme by a tool with no dark flag).
4. **Status columns not updated after fix commits** (b13 table still says
   "open" for 14 shipped items), so the next triage cannot tell fixed from
   pending without reading git.
5. **Same-wave features never cross-checked** (#80 seeding vs furigana gate).
6. **One-surface fixes on shared components** (#124, #127).

## 4. What actually closes the loop (proposed, not started)

| # | Structural fix | Closes | Size |
|---|---|---|---|
| A | Tile spec + `/ja/qa/tiles` page rendering every build-type surface in one column, shot on the 15 Pro Max simulator before each build (#137's ask) | 2.1 | M |
| B | Single `readingPolicy()` for kanji + furigana on all tile surfaces; kanji-known inferred from tested-out modules; tests for seeded state | 2.2 | M–L |
| C | Run the #72 naturalness sweep with the local judge over m1–m46 glosses; primary-verb check (かける/おくる/たべる class) | 2.3 | M (mostly local compute) |
| D | Selection floors: ≥5 tiles in build steps at m≥N, session dedupe of sentence+type, level filter on review/filler pools, same-family distractor dedupe | 2.4 | M |
| E | TTS keyed on kanji surface by default + regen は-initial class; one stop-audio hook on step-index change for lesson AND test-out | 2.5 | S–M |
| F | Rule-card max-height + scroll, one row per ending aligned to its example | 2.6 | S |
| G | Process: status column updated in the same commit as the fix; triage checks `build`; every sizing change re-shot on all tile surfaces on the simulator | 3 | S |

A, B and D remove the three biggest recurring classes. C and E are the
content-side sweeps that have been deferred for two weeks.
