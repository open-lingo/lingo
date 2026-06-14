# Korean (KO) → Japanese (JA) Feature Parity

Branch: `ui/ko-feature-parity`. Scope: bring KO to parity with JA across config,
curriculum, lessons, placement, flashcards/SRS, romanization, TTS, and settings.
**Out of scope (other agent):** Hangul stroke-order / alphabet-writing surface
(`src/shared/glyphs/`).

## Headline verdict

KO's **architecture** is already at parity with JA — the ADR-001 language-module
system (`shared/language/registry.ts` + `features/languages/ko/module.ts`) gives
KO first-class registration with the same capability slots JA uses. KO is in
`AVAILABLE_LEARNING_LANGUAGE_IDS`, shows up un-gated in the language picker, and
placement, flashcards/SRS, classifiers, conjugation, particles, and the alphabet
config are all wired through the same abstractions as JA.

The real parity gap is **content depth**, plus a handful of code gaps where a
language-data path existed for JA but was dark/broken for KO. The code gaps are
now **FIXED**. The content gap (KO has 3 modules of authored lessons vs JA's 28)
is real and reported honestly below — that is authoring work, not wiring.

## JA-vs-KO gap table

| Feature | JA state | KO state (before) | Result |
| --- | --- | --- | --- |
| Language registry / module contract | `jaModule` full | `koModule` full (id, atoms, grammarHelpers, placement, classifiers, conjugation, particles, alphabetConfig) | **PARITY (pre-existing)** |
| `AVAILABLE_LEARNING_LANGUAGE_IDS` / picker | available | available (not "SOON") | **PARITY (pre-existing)** |
| Curriculum — modules | M1–M28 | M1 (full) + M2 (full) + M3 (pathway only) | **CONTENT-NEEDED (M4+); M3 FIXED** |
| **M3 lesson content** | n/a | **8 pathway nodes (`ko-m3-1..8`) resolved to `null` — dead pathway clicks** | **FIXED** (authored 8 lessons) |
| M3 vocab atoms (greetings/copula/numbers) | n/a | absent (only particles + survival phrases) | **FIXED** (+20 atoms) |
| Placement test | question-bank driven | KO M3 items present + `langId` plumbed through `getItemsForModule` | **PARITY (pre-existing)** |
| Flashcards / SRS deck | atom registry | KO atoms SRS-eligible, modal SRS shared engine | **PARITY (pre-existing)** |
| `/try` free preview lesson | JA preview (4 steps) | **`getPreviewLesson("ko")` → null → "coming soon"** | **FIXED** (authored KO preview) |
| Vocab card art (Noto subset) | partial subset, some JA gaps | KO M2 `wordImageMcq` for 야구/우유 → **broken-image** (SVG not in local subset) | **FIXED via graceful fallback** + reported |
| Romanization (RR) display | inline `romaji` field on steps | inline `romanization` field on steps; `module.romanizer` slot unused for both langs | **PARITY** (romanizer slot is dead for JA too — not a gap) |
| `readingAnnotation` (furigana-style) | present (kana ruby) | omitted — Hangul is phonetic (ADR-011) | **N/A by design** |
| TTS manifest | full JA manifest | empty; runtime falls back to browser speech-synthesis | **CONTENT-NEEDED** (recorded TTS); functions today |
| Settings JA-specific toggles | kanji/components practice types | KO practice types correctly scoped (general/particles/alphabet) | **PARITY (pre-existing)** |

## What I implemented (code, all FIXED)

1. **KO Module 3 — "First phrases" (8 lessons).** New
   `src/features/languages/ko/curriculum/m3.ts` authors the M3 spine the
   placement bank was already written against: greetings → formal-vs-polite →
   `이에요/예요` copula → `저는 X 이에요` self-intro → asking names
   (`이름이 뭐예요?`) → Sino-Korean numbers 1–10 → mini-dialogue → mastery test.
   Uses the existing KO `grammarHelpers` (phrase/cloze/sentenceMcq/build/
   translate/listening/speaking/vocabMcq) and respects the SRS rubric (teach
   steps carry no SRS weight; only graded factories tag `exercisedAtoms`).
   Wired into `mockLessons.ts` so the 8 previously-dead pathway nodes resolve.

2. **KO M3 vocab atoms (+20).** Added `M3_VOCAB` to
   `features/languages/ko/courseAtoms.ts` (greetings, 저/이름/학생/선생님/친구/뭐,
   the copula, and Sino numbers 일–십), deduped first-write-wins against M1
   surfaces. KO atom registry: 105 → 125.

3. **KO `/try` preview lesson.** Added `koreanPreview` to
   `features/preview/data/previewLessons.ts` (word-image MCQ → listening-build
   → speaking → greeting MCQ). KO previously showed "coming soon" despite being
   an available language. Updated the registry test accordingly.

4. **Graceful vocab-art fallback (all languages).**
   `WordImageMcqStepView.tsx` now falls back to the native-font emoji glyph via
   an `<img onError>` handler. `notoEmojiUrl` returns a URL even when the SVG
   isn't in the bundled subset (404 at fetch → broken-image icon before). This
   fixes KO M2's 야구/우유 tiles and any future partial-art content across every
   language — without fabricating assets.

5. **Tests.** New `curriculum/m3.test.ts` guards that *every* M3 pathway node
   resolves to content (the exact regression that was broken) + lesson/step-id
   uniqueness. Extended `previewLessons.test.ts` to cover the KO preview.

## What remains (CONTENT-NEEDED — not wiring)

- **KO Modules 4–28.** JA has 28 modules; KO has M1–M3. Each new module is
  authoring work (lessons + atoms + placement items). The *mechanism* is fully
  in place — a new `ko-m4*` curriculum file + `mockCourse.ts` module entry +
  `mockLessons.ts` registration is all the plumbing needed; the rest is content.
  M3 here is the worked template.
- **KO TTS audio.** `koTtsManifest` is empty; lessons play via browser
  speech-synthesis (functional, lower quality than JA's recorded manifest).
  Generating a KO manifest mirrors the JA `emit-tts-deck` pipeline — asset work.
- **Vocab card art for KO words without local Noto SVGs.** The bundled subset
  (`src/pub/noto-emoji/svg`, 155 files) lacks art for several KO words
  (🥩 meat, 🐄 cow, 🥛 milk, ⚾ baseball, 🧑‍🎓 student, 🧑‍🏫 teacher, …). The new
  fallback keeps these legible; full parity needs those SVGs added to the subset
  (re-run the emoji-art pipeline). My new M3 content deliberately uses only
  verified-present art for image MCQs.
- **Korean-speaker content review.** Register consistency (해요 vs 합니다 mixing)
  and naturalness of M3 phrasing should be confirmed by a native speaker before
  shipping. Flagged inline as `CONTENT-TODO` in `m3.ts` / `courseAtoms.ts`.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (pre-existing chunk-size warning only).
- `npx vitest run` — **113 files / 1024 tests pass.**
- Playwright screenshot of `/try?lang=ko` confirms Hangul renders (Noto Sans KR),
  KO step renderers work, and all four vocab tiles show art after the fix.

## Screenshots

- `/try?lang=ko` word-image MCQ rendering correctly (나무/바다/친구/비, all art
  present) — captured during the session at `/tmp/shot.png`.

## Notable findings (no change required)

- `module.romanizer` is a dead capability slot for **both** JA and KO — no
  consumer reads it. Romanization in lessons comes from inline step fields
  (`romaji`/`romanization`). Not a KO gap.
- `features/languages/ko/placementBank.ts` is a well-built but **parallel**
  (currently dark) implementation — placement actually runs through
  `placement/questionBank.ts`, which already carries KO M3 items keyed by
  `languageId: "ko"`. Left as-is; consolidating the two placement sources is a
  cross-language refactor better done for JA+KO together.
