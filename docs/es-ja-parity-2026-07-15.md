# ja ↔ es feature parity audit (2026-07-15)

Comparison audit after the es feature wave (this session): every gap from
`docs/es-course-gaps-2026-07-13.md` §"New trainers/steps" is now shipped, plus
the parity burn-down the gate-catalog recon surfaced. Matrix reflects the
post-fix state. Recon provenance: 3 Explore agents (step-type engine map,
practice/grading map, gate catalog) + 6 engine agents + 4 content agents.

## Parity matrix (post-fix)

| Feature | ja | ko | es |
|---|---|---|---|
| Course content (A1 arc) | ✅ m1–m17+ | ✅ | ✅ 16 modules, now incl. match/dialogue/agreement steps |
| Vocab browser (`buildVocabRows`) | ✅ | ✅ NEW | ✅ NEW (gender folded into meaning) |
| `lessonAtomIndex` (atom↔lesson) | ✅ | ✅ NEW | ✅ NEW |
| In-lesson SRS review (`buildSrsReviewLesson`) | ✅ | ✅ NEW (buildable*) | ✅ NEW (buildable*) |
| Enriched course deck + due summaries | ✅ | ✅ NEW | ✅ NEW |
| Subscription queue | ✅ | ✅ NEW | ✅ NEW |
| Module vocab preview + course-map samples/milestones | ✅ | ✅ | ✅ NEW (`COURSE_MILESTONES.es`) |
| Command-palette vocab search | ✅ | ✅ NEW | ✅ NEW |
| Derived 12-item module test-outs | ✅ | (derives if it clears the floor) | ✅ NEW (all 16 modules derive 12/12; authored bank stays fallback) |
| Placement flow | ✅ | ✅ | ✅ |
| Conjugation practice | ✅ kana trainer | N-A (no tile) | ✅ NEW **ConjugationGrid** person×tense (was: routed to the ja kana page = wrong data) |
| Reading / speaking practice | ✅ | ✅ | ✅ |
| match_pairs in lessons | ✅ | 1 | ✅ NEW 15 grids (m2–m16) + language-keyed pad pool |
| dialogue_listen in lessons | ✅ | — | ✅ NEW 12 dialogues (m5–m16), view un-hardcoded from "ja" |
| agreement_cloze (NEW step type) | pinned-unused | — | ✅ ~20 multi-blank drills (m3+) |
| Accent-aware grading | N-A | N-A | ✅ NEW accept-but-flag ("watch the accents: años") + AccentBar (á é í ó ú ü ñ ¿ ¡) |
| Text-front recognition MCQ | N-A | — | ✅ NEW `vocabTextMcq` (~24 steps for emoji-less atoms) |
| TTS clips | 4,884 | **0 — still silent** | 1,255 (100% deck coverage; +61 this session) |
| Grammar micro-teaching / grammar SRS | ✅ | by-design skip | by-design skip (phase 2: needs es-grammar-points.json) |
| Alphabet/script trainer | ✅ kana | ✅ Hangul | N-A (Latin) |
| Stories / sidequests | sideQuests | — | none authored (transit-map concept gives them a home) |
| XP / streaks / QA page | ✅ | ✅ | ✅ |

\* Review lessons assemble for es/ko, but `mockLessons` only routes
`ja-mN-review-*` lesson ids into `buildSrsReviewLesson` — es/ko have no review
lesson ids in their pathways yet. First follow-up below.

## What shipped this session (engine)

- **`agreement_cloze`** step type end-to-end (types → view → renderer → QA
  catalog → admin editor → fixtures). Multi-blank chip-groups graded as a set;
  ja-scoped QA pin documented, es coverage guarded in `qaCatalog.test.ts`.
- **ConjugationGrid** (`practice/conjugation-grid/`): tense tabs × 6-person
  grid, MCQ drills with adjacent-cell distractors, seeded via `seededShuffle`,
  Mix round, advisory locks. Routed by `ConjugationHubRoute` (es → grid,
  ja → existing kana hub). First consumer of `getConjugationVerbEntries`.
- **Accent accept-but-flag**: `accentFold` + `gradeTypedAnswer` in
  loose-match (kana voicing marks excluded — です/てす stay distinct);
  `Feedback` gained a "flagged" amber success tone; `AccentBar` inserts
  accented chars at the caret (es typing only).
- **Language-keyed match pad pool**: es grids pad from es atoms (seeded,
  FSRS-weakness-first, module cutoff); ja byte-identical; other languages get
  authored grids untouched (previously: Japanese fills).
- **dialogue_listen for es** + view lang un-hardcoded (plays via
  `defaultTtsLang`); two-voice still VoiceColor detune — real Jorge clips are
  the remaining upgrade (needs per-card voice in the deck/generator).
- **es `cloze(exercisedAtomSurfaces?)`** — clozes can now credit carrier-
  sentence atoms (the 5-of-8-agents wish).
- **Derived test-outs parametrized** (3 ja-hardcoded sites) with
  `TESTOUT_DERIVED_FLOOR = 8` and authored-bank fallback.
- **`normalizedAtoms` adapter** behind `lessonAtomIndex` — the one place
  ja kana/meaningEn vs ko/es surface/gloss shapes are reconciled; unlocked the
  whole SRS/vocab column above for es AND ko.
- **`capstoneMatchPairs`** (registry-free, inline glosses) — m16's
  cross-course grid resolved surfaces from the live registry at import time
  and threw for any test entry that caught referenced modules mid-import-cycle;
  all es module test files also import `./index` first (canonical order).

## Known remaining deltas (ranked)

1. **es/ko review-lesson routing** — `mockLessons` recognizes only
   `ja-mN-review-*`; also `REVIEW_LESSON_RE` in `moduleProgress` is ja-shaped.
   Data path works; needs pathway ids + routing (S/M).
2. **ko TTS is still zero clips** (comment fixed; es pipeline is the
   precedent — generate a ko corpus with a ko edge voice) (M, mechanical).
3. **Two-voice dialogues** — per-card `voice` in deck + generator, emitter
   tags speaker-B lines with Jorge (S/M).
4. **ProgressPage / PracticeStatsPanel** still call `buildEnrichedJaCourseDeck`
   directly — switch to `buildEnrichedCourseDeck(lang)` (S).
5. **es grammar micro-teaching** — authoring task (`es-grammar-points.json`),
   engine is language-agnostic (L, phase 2 by design).
6. Cosmetic/latent: `notoEmoji` ja-only kana map, `srsStorage` bare-id `ja:`
   default, `mockCourse` three hand-branches (derive-from-content migration
   would delete most of the 97KB file), `seedSchedule` uses ja eligibility on
   non-ja views (skips some 1-char ko nouns from next-day seeding).

## Verification

Full suite **3,029 passed / 1 skipped** (241 files) · `tsc --noEmit` clean ·
production build clean · `scripts/es-smoke.mjs` **7/7** (ladder, QA links,
lesson render, listening deep-link, **conjugation grid serves es**,
**agreement_cloze deep-link**, **dialogue_listen deep-link**) · TTS deck
1,255/1,255 manifest coverage (`wrote=61 cached_skipped=1194 failed=0`).
