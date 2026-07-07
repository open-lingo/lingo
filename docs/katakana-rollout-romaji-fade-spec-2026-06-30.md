# Katakana rollout + romaji fade — spec (2026-06-30)

**Status:** DRAFT / spec-first (Spencer approving decisions across 2026-06-30). Build after sign-off.
**Owner:** Spencer (JA). **Scope:** Japanese course only — see "Relationship to Trevor's alphabet plan" below.
**Supersedes for this feature:** the per-word/per-glyph "taught-glyph resolver" idea explored earlier (dropped in favor of flat module cutoffs).

---

## 1. Goal

Two linked features:

1. **Teach katakana gradually** across the modules after M2 — **one base-gojūon row per module (M3→~M12)** — reusing the existing katakana glyph trainer, with each row's loanwords **used in sentences** alongside the grammar/numbers the learner is picking up (not isolated glyph drills).
2. **Fade romaji on two flat module cutoffs** — **hiragana off at M10, katakana off at M17** — with a single global "show romaji" toggle and an easy "turn it back on for the day" escape hatch that keeps nudging (gently, non-nagging) toward reading unassisted.

## 2. Locked decisions

| # | Decision |
|---|---|
| D1 | **Romaji off = two flat module cutoffs**, no per-word/per-glyph tracking. Hiragana → **M10**, katakana → **M17**. |
| D2 | **Katakana = base gojūon only, one row per module M3→~M12.** No dakuten/handakuten/yōon *lessons* — decoded by principle (taught in hiragana M1/M2). |
| D3 | **Author katakana row lessons in the spirit of the M1 hiragana rows** (`m1-ka.ts` style, via a katakana-parameterized `_consonantRowHelpers.ts` — same symbolIntro/trace/recognition/symbolToSound/wordImageMcq/listeningBuild/speaking rhythm + anchor loanwords), **NOT** the bare `AlphabetLessonPage` trainer. Renders as normal `LessonPage` rows → **no shared-infra / `course.ts` / Trevor dependency**. Build inline. |
| D4 | **Romaji setting = one global user toggle**, NOT split per script. The 10-vs-17 difference is internal behavior. |
| D5 | **Escape hatch:** Settings "turn romaji on for the day" (auto-resets next day). Nudge to reduce reliance must be **one-time / non-recurring** — respect the no-babying / no-guilt house rule. |
| D6 | **Loanwords are interleaved into grammar sentences** as they become readable — the anti-cram retention mechanism, alongside loanwords entering SRS. |

## 3. Current state (from investigation — verify file:lines at build)

**Katakana content that already exists:**
- Full `JA_KATAKANA` syllabary config (base + dakuten + handakuten + yōon, per-glyph romaji, stroke flags) — `src/shared/domain/languageConfig.ts:368`; registered `languageConfig.ts:909` (`alphabets: [JA_HIRAGANA, JA_KATAKANA]`).
- Stroke-order data (86 glyphs) — `src/shared/glyphs/data/katakana.json`, registry `src/shared/glyphs/registry.ts:29`.
- `symbol_*` step views already branch on `"katakana"` (Intro/Trace/Recognition/Production) — script-agnostic, works today.
- Alphabet session builders — `src/features/practice/alphabet/alphabetSession.ts` (`SKIP_SECTIONS` already drops `katakana-yoon-ry`).
- ~71 katakana loanword atoms in `courseAtoms.ts` (e.g. `コーヒー`/`タクシー` m3, `カメラ`/`ペン` m4, `コンビニ`/`トイレ`/`バス` m6, `ジュース`/`パン`/`ラーメン` m7), plus 37 tagged `"future"`.

**What's missing / broken:**
- **No in-course entry point for katakana.** `getMockCourse` builds the alphabet lesson from the singular `config.alphabet` (= hiragana), not `config.alphabets` — `mockCourse.ts:25-35`. The spine "teaches" katakana as exactly 2 loanwords in M3 (`ja-m3-1-1/1-2`) then assumes literacy.
- **Katakana loanwords appear before any teaching** — `ティーシャツ`/`パーティー` are `fromModule:"m2"`. (Full "used-before-readable" list = mapping agent output, §4.2.)
- **Romaji auto-off is a single global `ROMAJI_AUTO_OFF_MODULE=15`** (`src/shared/settings/romajiAutoFlip.ts`), fired from `LessonPage.tsx:407`. Build-tile-only fade at M10. Passing the katakana full-test currently kills romaji **globally including hiragana** — script-blind (`AlphabetLessonPage.tsx:414`); D1/D4 replace this cleanly.
- The per-glyph `symbolMastery` fade is inert anyway (`recordCorrect` has zero callers) — irrelevant under flat cutoffs; leave it bypassed.

## 4. Katakana rollout

### 4.1 Row schedule (one base row per module)

| Module | Row taught (glyphs) | Notes |
|---|---|---|
| M3 | ア イ ウ エ オ + long mark ー | repurpose the existing `ja-m3-1-1/1-2` from "2 loanwords" → "ア-row"; keep コーヒー/タクシー as the *why-katakana* hook |
| M4 | カ キ ク ケ コ | |
| M5 | サ シ ス セ ソ | |
| M6 | タ チ ツ テ ト + small ッ | |
| M7 | ナ ニ ヌ ネ ノ | |
| M8 | ハ ヒ フ ヘ ホ | |
| M9 | マ ミ ム メ モ | |
| M10 | ヤ ユ ヨ | hiragana romaji goes off this module |
| M11 | ラ リ ル レ ロ | |
| M12 | ワ ヲ ン | base complete |
| M13 (optional) | full-katakana capstone / mixed review | |

Base katakana complete by ~M12; **M12→M17 is the reinforcement window** before katakana romaji flat-off at M17. Dakuten/handakuten/yōon are never taught as lessons — a learner decodes ガ/パ/キャ by combining a known base glyph with the diacritic principle they already learned in hiragana M1/M2.

### 4.2 Per-module loanword interleaving (from mapping, 71 atoms)

**Readability is back-loaded** (a word is readable only once its *latest* base glyph is taught; dakuten/handakuten/yōon inherit from their base row): only **ジュース** is readable before M6; **M4 (カ) and M10 (ヤ) unlock no word** → those rows are glyph-only; **M8 unlocks 17**, **M11 unlocks ~23** (ラ-row is the biggest gate). Since romaji shows on all katakana until M17, "readable module" gates only (a) no-romaji recognition drills and (b) a word's `fromModule` SRS attribution — **not** whether a romaji-assisted sentence may use it.

| Module | Row | Newly-readable loanwords (anchor candidates) | Interleaving sentences (module grammar) |
|---|---|---|---|
| M3 | ア イ ウ エ オ + ー | *(none)* | Rework the existing `ja-m3-1-1/1-2`: drop front-loaded コーヒー/タクシー/ビール/ホテル/アメリカ as *taught* words; teach ア-row, keep ≤1 romaji-assisted hook. |
| M4 | カ キ ク ケ コ | *(none)* | Glyph-only row; reinforce ー + カ-row recognition. |
| M5 | サ シ ス セ ソ | **ジュース** | 「ジュース ください」；「ジュース は ひゃくえん です」(numbers/prices) |
| M6 | タ チ ツ テ ト + ッ | **タクシー, テスト, コート, シャツ, スカート, セーター, ギター, ドア** | 「タクシー で いきます」(で means)；「ドア が あります」(が existence) |
| M7 | ナ ニ ヌ ネ ノ | **ニュース, ネクタイ, ノート** | 「ニュース を みます」(を+みます); food/drink only ジュース readable → 「ジュース を のみます」 |
| M8 | ハ ヒ フ ヘ ホ (+b/p) | **コーヒー, バス, ナイフ, ポスト, スポーツ, カップ, コップ, テープ, ページ, アパート, デパート, ペット, ベッド…** (17) | 「コーヒー は おいしい です」(い-adj)；「バス は やすい です」 |
| M9 | マ ミ ム メ モ | **マッチ** (+ register アニメ/ゲーム/メニュー) | 「アニメ が すき です よ」(な-adj+よ)；「ゲーム は ゆうめい です ね」 |
| M10 | ヤ ユ ヨ | *(none)* | Glyph-only row; recycle M8/M9 words in past tense: 「コーヒー を のみました」 |
| M11 | ラ リ ル レ ロ | **アメリカ, ビール, ホテル, カメラ, トイレ, カレー, テレビ, ラジオ, クラス, プール, ゼロ…** (~23) | 「まだ ビール を のみません」(ません)；「ホテル に トイレ が あります」 |
| M12 | ワ ヲ ン | **ペン, パン, ラーメン, レストラン, コンビニ, シャワー, スプーン…** | katakana complete → 「レストラン で ラーメン を たべます」；「カレンダー を みます」(time theme) |

**Reconciliation of used-before-readable words:** keep existing romaji-assisted sentences as-is (that is already how the curriculum reads). Only *move* a word's `fromModule` later when its gap is wide AND the target module will contain it after authoring — safe today: バス→m8, テレビ→m11, コーヒー→m8, ビール→m11 (targets already contain the word). ⚠️ **`m12.ts` currently contains zero katakana**, so any word re-attributed to M12 (ペン, パン, ラーメン, レストラン, コンビニ) needs a sentence authored there or `moduleConformance.test.ts:99-114` fails. Default for anything not being gated: **accept-romaji, don't move.**

**Extension-dependent (never base-readable — ティ/フォ/フィ/フェ):** ティーシャツ, パーティー, フィルム, フォーク, and unregistered カフェ (used in `m7.ts`). Treat all as **accept-romaji** (never in no-romaji drills). Fix the two mis-early attributions: ティーシャツ/パーティー are `fromModule:"m2"` today — move off m2. For the "shirt"/"fork" slots prefer base-readable シャツ (M6) / ナイフ (M8)·スプーン (M12).

**Registration backlog (optional, as interleaved):** カフェ, ジャケット, サッカー, カード (M6); アニメ, ゲーム, メニュー (M9); ピアノ, バナナ, パスタ (M8); ダンス, パソコン (M12) appear in curriculum without atoms — register as SRS atoms when interleaved. (Names/onomatopoeia in katakana need no atoms.)

Interleaving principle (D6): as each row lands, the loanwords it unlocks are woven into **that module's** grammar/number practice and enter SRS so they resurface — words are *used*, not flashed once.

### 4.3 Forced-use / retention mechanisms (all already in the engine)
1. SRS-eligible loanwords seed due-next-day on unlock → reappear in the reviewer.
2. Extend `kanaReviewTails.ts` (regex currently `^ja-m1-…`, hiragana-only) to append prior-row katakana recognition tails to each new katakana lesson.
3. Sentence-builds/stories in later modules surface earlier loanwords (compounding-review ≥3×).
4. MCQ/build tiles use taught katakana words as answers + distractors.

## 5. Romaji fade

### 5.1 Mechanism — two flat cutoffs
Generalize the single `ROMAJI_AUTO_OFF_MODULE` into two script-keyed thresholds: **hiragana = 10, katakana = 17**. At the render choke-point (`src/shared/readingAnnotation/AnnotatedText.tsx:274`, `SymbolToken`/`KanaSegment`), a ruby is hidden when `currentModule >= threshold[scriptOf(glyph)]`. The katakana Unicode block is already detected via `isKana`/`KANA_ROMAJI`, so no new per-token metadata is needed. **No per-word "taught" tracking** — dropped.

Untaught extension glyphs are not a readability risk here because romaji is present on *all* katakana until M17 regardless; after M17 the learner has had the base set since ~M12 plus 5 modules of assisted practice.

### 5.2 Setting + escape hatch (D4, D5)
- Keep **one** user-facing "Show romaji" toggle (do **not** split per script) — `SettingsSectionPanel.tsx:573`.
- Add **"Show romaji for today"**: re-enables romaji, auto-resets at the next day boundary. The daily-reset default is what persuades — not copy.
- **One-time** dismissible note the first time romaji auto-turns-off ("You've got the kana now — romaji's off. Need it back? Settings → Romaji, resets tomorrow."). **No** recurring "you used romaji again" messaging. (House rule: no babying, no guilt.)
- Remove the script-blind global kill on katakana full-test pass (`AlphabetLessonPage.tsx:414`) — replaced by the module thresholds.

## 6. Implementation touchpoints (effort)

**Katakana lessons**
- [M] `mockCourse.ts` — inject one katakana row-lesson per module M3–M12 (wire `config.alphabets`/a katakana section per module, not just `config.alphabet`); repurpose the two `ja-m3-1-*` entries.
- [S] `course.ts` — optional `sectionId?` on `Lesson`; [S] `LearnPage`/`AlphabetLessonPage` — accept a course-lesson id so katakana rows credit course progress. *(Shared infra — keep additive; see §8.)*
- [M] `courseAtoms.ts` — re-attribute the ~71 loanwords to their rollout module (per mapping agent), matched by actual in-content usage (moduleConformance).
- [S] `alphabetSession.ts` `SKIP_SECTIONS` — drop katakana dakuten/handakuten/yōon from the course rollout.

**Romaji**
- [S] `romajiAutoFlip.ts` — two script-keyed thresholds (hira 10 / kata 17); remove the alphabet-mastered global kill.
- [S] `AnnotatedText.tsx:274` — gate each ruby on `currentModule >= threshold[script]`.
- [S] `SettingsSectionPanel.tsx` — "Show romaji for today" (daily-reset) control; keep single global toggle.
- [S] one-time auto-off explainer.

**Unlock/SRS**
- [S] `kanaReviewTails.ts` — extend regex + prior-glyph pool to katakana rows.

## 7. Tests / invariants to update
- `moduleConformance.test.ts` (re-attributed loanwords must appear in their module's content).
- `romajiAutoFlip.test.ts` (two thresholds; drop the global-kill assertion).
- `sub-lesson-density.test.ts` (12–25 steps; katakana lessons rendered via `AlphabetLessonPage` may be exempt like row-test stubs — verify).
- `symbolToSoundIntegrity.test.ts` (katakana audio-MCQ needs TTS + labels).
- New test for the extended `kanaReviewTails` regex.
- New test: romaji hidden for hiragana at M10 / katakana at M17; "for today" re-enable resets.

## 8. Relationship to Trevor's alphabet plan
`docs/ALPHABET_COURSE_INTEGRATION_PLAN.md` (Trevor) proposes making alphabet sections first-class course lessons — overlapping infra (`course.ts sectionId`, an `alphabetLessonsForLanguage()` helper, `AlphabetLessonPage` course-crediting). **Per Spencer (2026-06-30) this JA work does NOT gate on Trevor** — his plan is Korean-focused; JA katakana is similar-but-distinct. Proceed independently; keep any edits to genuinely shared infra **additive / non-breaking** so KO isn't disrupted.

## 9. Build order
1. ✅ **Spec** (this doc).
2. ✅ **Romaji two-cutoff fade** — DONE 2026-06-30, verified. Per-script auto-off guards (hiragana M10 / katakana M17) flipped in `LessonPage`; single master `showRomaji` toggle; `romajiOnForDay` "show romaji for today" escape hatch in Settings (auto-resets); render gate rewritten in `AnnotatedText` **dropping the inert `masteryVisible`** (romaji had in fact never turned off on the per-kana path); removed the script-blind alphabet-mastered global kill in `AlphabetLessonPage`. `romajiAutoFlip.test.ts` 16/16, `settingsPersistence` 7/7, `tsc -p tsconfig.app.json` clean. Files: `settings/{types,romajiAutoFlip}.ts`, `japanese/kanaTable.ts` (`isKatakana`), `readingAnnotation/AnnotatedText.tsx`, `lesson/LessonPage.tsx`, `practice/alphabet/AlphabetLessonPage.tsx`, `settings/SettingsSectionPanel.tsx`.
   - ✅ `kanaReviewTails` katakana extension — DONE 2026-07-01 (`ja-mN-kata` regex + `priorKatakanaPool` from `KATAKANA_ROW_SCHEDULE`; `kanaReviewTails.test.ts` 5/5).
3. ✅ **Katakana lessons** (M1-spirit, D3) — DONE 2026-07-01. `_consonantRowHelpers` script-parameterized (`RowContext.scriptId`, `KATAKANA_CONFUSABLES` incl. シ/ツ + ソ/ン, optional scriptId on `symbolIntro`/`traceTwice`); rows authored: ア = repurposed `ja-m3-1-1/1-2` (m3-v2.ts), カ→ワ = `ja-m4-kata`…`ja-m12-kata` (`katakanaRows.ts`), each module's FIRST pathway node; registered in `mockCourse`/`mockLessons`; enrolled in `sub-lesson-density` (all in [12,25]) + `mockCourse.test` lead-node assertions. Glyph audio via katakana→hiragana single-char twin fallback in `getTtsUrl` (clips are sound-identical); word TTS emitted+generated (emit-tts-deck now scans `katakanaRows.ts` + per-row ctx args). Verified in Playwright screenshots (trace step shows katakana stroke data; word MCQ shows per-script romaji ruby).
   - ✅ Loanword re-attribution + interleaving per §4.2 — DONE 2026-07-01. 23 atom lines re-attributed to rollout modules (`introducedByLessonId` → `ja-mN-kata`; ティーシャツ→future, パーティー→m23 per the extension-glyph rule; タクシー stays the m3 hook); 15 loanword sentences interleaved into M5–M12 grammar sub-lessons (M12 conformance-critical atoms all exercised: レストラン/ラーメン/コンビニ/パン + ペン via the row lesson); unlock-suppression landmine fixed (bangohan pinned). Backlog registrations all skipped with reasons (extension glyphs / no exercising content). TTS: emit-tts-deck gained keyed `target:` + positional `build()` capture — that also backfilled ~740 clips for previously-silent shipped listening steps. Verified independently: tsc clean, full suite 185 files / 1391 tests green.
4. Tests per §7 — done for the shipped slices (`romajiAutoFlip` 16, `kanaReviewTails` 5, density, mockCourse, symbolToSoundIntegrity, TTS twin-fallback tests; full suite 185 files/1391 green at row-lesson landing).
