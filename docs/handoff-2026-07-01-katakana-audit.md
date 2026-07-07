# Handoff — 2026-07-01 (katakana rollout + M1-M7 audit fixes)

**Session outcome:** all five workstreams from the 2026-07-01 session landed and verified.
**Verification state at handoff:** `tsc -p tsconfig.app.json --noEmit` clean; `npx vitest run` → **185 files / 1391 tests, 0 failures** (run independently after the last agent finished). Katakana lessons eyeballed live in Playwright (trace stroke-order, mnemonics, word MCQ romaji ruby).
**Nothing is committed** — Spencer commits on his own cadence. Note the working tree ALSO carries older uncommitted work (a large docs→archive hygiene sweep, README/roadmap edits from prior sessions); today's slice is itemized below so it can be reviewed/staged coherently.

---

## What shipped today

### 1. Katakana base-gojūon rollout (spec: `katakana-rollout-romaji-fade-spec-2026-06-30.md`, §9 = authoritative status)
- One row per module M3→M12. ア row = repurposed `ja-m3-1-1/1-2` (in `m3-v2.ts`, keeps コーヒー/タクシー hook + です beats); カ→ワ = `ja-m4-kata`…`ja-m12-kata` (**new** `curriculum/katakanaRows.ts`), each module's **first** pathway node.
- `_consonantRowHelpers.ts` script-parameterized (`RowContext.scriptId`, `KATAKANA_CONFUSABLES` — シ/ツ, ソ/ン co-presented once both known).
- `kanaReviewTails.ts` extended: `ja-mN-kata` lessons get a 3-step prior-katakana recognition tail (**new** `kanaReviewTails.test.ts`).
- Romaji fade (landed 2026-06-30, same tree): flat per-script cutoffs hira@M10 / kata@M17, single global toggle, "Show romaji for today" hatch.
- TTS: single katakana glyphs resolve via hiragana-twin fallback in `shared/tts/index.ts`; 5 word clips + 15 sentence clips generated; **~740 additional clips backfilled** after fixing emitter gaps (see Process notes).
- Loanword slice: ~23 atoms re-attributed in `courseAtoms.ts` (`introducedByLessonId` → row lessons; ジュース→m5 … パン/ラーメン/レストラン/コンビニ/ペン→m12; ティーシャツ→future, パーティー→m23); 15 sentences interleaved into `m5/m6/m7/m8/m11/m12.ts` grammar sub-lessons. All conformance/intro-order/density tests green.

### 2. M1-M7 audit fixes (all four)
- **Grammar SRS gap:** `grammarReviewIndex.ts` now synthesizes review steps for non-particle grammar — M7 dict↔ます conjugation + M5 人-counters enter Track B review. Tests extended.
- **D2 shipped (vocab-only):** per-atom gate `shouldWriteContentReviewAtom` (**new** `lesson/data/reviewTailSrs.ts` + tests) — content sub-lessons write Track A for PRIOR-module atoms only; grammar stays review-lesson-gated. Docs reconciled: CLAUDE.md (SRS = four surfaces), `srs-scheduling-model-2026-06-15.md` D2 bullet, `lesson-authoring-guide.md` §13.6.
- **Stories wired:** `ja-m3-9`, `ja-m{4-7}-story` inserted before each module's review pair (M8+ pattern); M7 story drift repaired (なに intro at point-of-use, in `m7.ts`).
- **Dead code:** `buildModuleReview.ts`, `buildModuleReview.test.ts`, `jaReviewPools.ts` deleted; stale comments fixed in `mockLessons.ts`/`mockCourse.ts`.

## Today's changed-file inventory (for staging)
- **New:** `curriculum/katakanaRows.ts`, `lesson/data/kanaReviewTails.test.ts`, `lesson/data/reviewTailSrs.ts` + `.test.ts`, `docs/handoff-2026-07-01-katakana-audit.md` (this file). New mp3s under `src/pub/tts/ja/` + manifest.
- **Deleted:** `lesson/data/buildModuleReview.ts` + `.test.ts`, `lesson/data/jaReviewPools.ts`.
- **Modified (src):** `curriculum/{m3-v2,m5,m6,m7,m8,m11,m12}.ts`, `_consonantRowHelpers.ts`, `courseAtoms.ts`, `lesson/data/{mockLessons,kanaReviewTails,grammarReviewIndex,sub-lesson-density.test,grammar-rule.test,lessonPage-srs-wiring.test}.ts`, `grammarReviewIndex.test.ts`, `lesson/LessonPage.tsx`, `lesson/types.ts` (+ `MatchPairsStepView.tsx`, `previewLessons.ts` — the onboarding match-pairs romaji fix), `shared/domain/mockCourse.ts` + `.test.ts`, `shared/tts/index.ts` + `.test.ts`, `shared/settings/*` + `AnnotatedText.tsx` + `AlphabetLessonPage.tsx` + `SettingsSectionPanel.tsx` (romaji fade), `shared/japanese/kanaTable.ts`.
- **Modified (tooling/docs):** `scripts/emit-tts-deck.mjs`, `scripts/shot.mjs`, `CLAUDE.md`, `docs/{PROJECT_STATE,srs-scheduling-model-2026-06-15,lesson-authoring-guide,katakana-rollout-romaji-fade-spec-2026-06-30}.md`.

## Open items / next session
1. **Grammar flashcard deck for the practice page** (task #6, Spencer 2026-07-01) — the grammar-review complement to vocab-only D2: a deck of grammar points reviewable on the practice page, with a spot for attaching some to lessons. Design TBD with Spencer. Relates to `grammarSrs.ts` (Track B).
2. **`.auth/user.json` is expired** — authed Playwright screenshots/e2e need Spencer to re-run `npm run test:e2e:auth` (headed login). Workaround used today: `VITE_DEV_AUTH_BYPASS=true npm run dev`. `shot.mjs` now also seeds `ftueArcSeen: true` so the first-session survey modal doesn't cover screenshots.
3. **Optional katakana follow-ups (not scheduled):** M13 full-katakana capstone/mixed-review lesson (spec §4.1 "optional"); backlog word registrations skipped for lack of exercising content (カフェ, アニメ/ゲーム/メニュー, ピアノ/バナナ/パスタ, ダンス/パソコン, ジャケット/サッカー/カード — each needs an exercising sentence in its module first); `M3_M7_REVIEW_POOL` fromModule tags in `grammarHelpers.ts` deliberately NOT re-tagged (would reshuffle every seeded review draw; D2 reads courseAtoms, so no correctness issue).
4. **Scheduling-model Phase 2 remainder:** D3 review-lesson gating (hard-vs-soft = Spencer's call), D1 store unification, D7 FTUE.
5. **Trevor coordination:** all shared-infra edits today were additive (`_consonantRowHelpers` defaults to hiragana; `kanaReviewTails` only adds a katakana branch; `getTtsUrl` fallback is ja-only + single-char). KO content untouched.

## Process notes (what bit us, now documented)
- **TTS emitter is regex-based and fails silent** — new factory shapes/files it doesn't match are skipped, and `wrote=0 cached_skipped=N` reads as success. Fixed gaps today: `katakanaRows.ts` missing from the file glob; `(?:ctx,…)` didn't match per-row ctx names; keyed `target:` (listeningBuildSentence) and positional `build()` targets were NEVER captured → hundreds of already-shipped listening steps had no audio (now backfilled). **Rule (added to CLAUDE.md):** after authoring, verify new phrases exist in `manifest.json`, don't trust generator exit status.
- **`introducedByLessonId` suppresses the fallback unlock** (`lessonAtomIndex.ts`): pinning an atom to a new lesson can orphan its unlock if another lesson relied on the fallback (ばんごはん near-miss). Added to CLAUDE.md.
- **Tests encode design decisions** — `grammar-rule.test.ts` asserted the 2026-05-18 "no glyph drills in M3-1" de-scope and correctly failed when the katakana rollout reversed it; updated to encode the new invariant. When a spec reverses an old decision, grep tests for the old invariant's assertions.
- **`atom-coverage.test.ts` strips ー when tokenizing** — 「ジュースは」 would mint a junk "スは" atom; katakana-final words need detached-particle spacing in sentences (M5 price sentence has the in-code comment).
