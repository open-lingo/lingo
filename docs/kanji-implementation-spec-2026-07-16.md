# Kanji + furigana — implementation spec (2026-07-16)

**Status:** STALE · **Last-verified:** 2026-07-17

> ⚠️ Superseded by what shipped: kanji recognition is LIVE from m8 with a rolling
> furigana window (unlock+2) — see `src/features/languages/ja/secondScript/kanjiRollout.ts`,
> which is the source of truth. This spec's `KANJI_START_MODULE = 99` OFF-sentinel /
> "nothing wired yet" framing did not ship.

Implementation-ready follow-through on `docs/kanji-furigana-plan-2026-07-16.md`.
The plan established *why* (the whole JA course is kana-only by omission; the
`<ruby>` furigana branch in `AnnotatedText` is reachable-but-dead because every
annotation producer sets `reading === surface`). This spec is *how* — the exact
choke point, the invariants the "make sure it works right" checks must enforce,
the verification harness, and phasing. It also carries the dry-run coverage
table (§6) computed by `secondScript/kanjiCoverageAudit.test.ts`.

**Nothing here is wired yet.** The only code that landed alongside this doc is
that behavior-neutral audit test.

## 0. One config constant, not a hardcode

The pilot start module is being researched in parallel. Everything below keys
off a single constant so the rollout is a one-line change, never a content edit:

```ts
// src/features/languages/ja/secondScript/kanjiRollout.ts (new)
export const KANJI_START_MODULE = 99; // sentinel = OFF until the pilot module is chosen
```

`99` (above the m27 ceiling) means the substitution pass is a structural no-op
until someone sets it. The content-gate test (§4c) asserts nothing kanji-ifies
below this number.

---

## 1. Surface inventory — what renders JA, and how

Every JA string reaches the screen through one of two `AnnotatedText` paths
(`src/shared/readingAnnotation/AnnotatedText.tsx`):

- **Segments mode** — `<AnnotatedJa segments={JapaneseAnnotation[]}>`. The only
  path that can render furigana: `SegmentRender` emits
  `<ruby>{surface}<rt>{reading}</rt></ruby>` when `surface !== reading` and the
  surface has kanji (lines 226-236). **Kanji-ready by construction.**
- **Bare mode** — `<AnnotatedJa text="…">`. Tokenizes via the JA reading
  annotator (`romajiLexicon.annotateJapaneseText`). Verified: a kanji character
  has no kana reading in the lexicon, so `perKanaFragment` returns
  `{ text }` with **no `reading`**, and `BareRender` renders it as a plain
  `<span>{text}</span>` — **kanji prints with no furigana, silently.** Bare mode
  therefore *cannot* produce ruby from a kanji string; there is nowhere for the
  reading to come from. Any bare surface is "keep-kana or needs-wiring", never
  "kanji-ready".

The other half of the invariant is **audio**: TTS resolves `"<lang>:<text>"`
from the flat manifest (`shared/tts/index.ts` `getTtsUrl`). Whether a surface is
safe to kanji-ify depends on whether its audio key is a *separate field* from
its display string.

| Surface / step type | Display path | Audio key (separate?) | Grading key | v1 verdict |
|---|---|---|---|---|
| **translate** source (target→native) | `segments={sourceAnnotation}` | no audio | answer = English | **kanji-ready** — post-pass fills single-atom sources |
| **translate** answer (native→target) | source is English; learner types | n/a | `acceptedAnswers` (kana), wanakana IME → kana | **keep-kana** — answer stays kana; kanji only ever on English side |
| **build_sentence** tiles | `text={tile}` **bare** | `targetSentence` + per-tile `playJaAudio(tile)` | `JSON(placed)===JSON(correctOrder)` — tile **text** | **keep-kana v1** — bare (no furigana) *and* both grading and tile-audio key on tile text; a kanji tile breaks both |
| **listening_build** tiles | `text={tile}` **bare** | `targetSentence` | tile text vs `correctOrder` | **keep-kana v1** (same as build) |
| **match_pairs** source tile | `segments={pair.sourceAnnotation}` (else bare `pair.source`) | `playJaAudio(pair.source)` — separate | pair id, **not text** (`a.pairId===b.pairId`) | **kanji-ready** — needs `sourceAnnotation` populated; audio + grading both immune |
| **multiple_choice** prompt | `segments={promptAnnotation}` | `promptAudioText` — separate | option id | **kanji-ready** |
| **multiple_choice** options | `segments={optionAnnotation}` | (no per-option audio) | option id | **kanji-ready** for single-atom options |
| **speaking** target | `segments={targetAnnotation}` | `targetPhrase` — separate | ASR vs `targetPhrase` (kana), char-overlap | **kanji-ready** — cleanest separation in the codebase |
| **grammar_rule** examples | `text={example.ja}` **bare** | `getTtsUrl(example.ja)` — **SAME string** | none | **needs-wiring** — display *and* audio share `example.ja`; kanji there breaks TTS. Needs a separate `example.reading`/audio field **and** segments render |
| **dialogue_listen** transcript | `text={line.kana}` **bare** | `line.audioText ?? line.kana` | none | **needs-wiring** — add per-line annotation; keep `audioText` kana. Bare today = no furigana |
| **particle_cloze** before/after | `text={prompt.before/after}` **bare** | `audioText` — separate | option = particle | **keep-kana v1** — halves are sentence fragments; bare; single-atom rare |
| **word_image_mcq** word | `text={word}` **bare** | `playJaAudio(word)` — same string | option id | **needs-wiring** — single word, good candidate, but bare + audio-shares-string today |
| **phrase_card** (vocab teach) | raw `{step.kana}` (no `AnnotatedText` at all) | `step.kana` — same string | none | **needs-wiring** — add `step.kanji`; keep `step.kana` for audio. Note inconsistency below |
| **flashcards / SRS reviews** | `courseAtomToFlashcard` front = `` `${kanji} (${kana})` `` | atom-keyed | atom id | **already kanji** — no change; atom ids already unchanged |
| **placement items** (`buildPlacementTest`) | same step views | inherits | inherits | inherits step-view verdicts; gate below `KANJI_START_MODULE` |
| **listening_comprehension** | transcript is audio-only (hidden) | `getTtsUrl(transcript)` | MCQ option id | **keep-kana** (nothing displayed); if revealed later, needs-wiring |

**Two consistency notes surfaced by the walk:**
1. SRS flashcards *already* show `漢字 (かな)` (via `courseAtomToFlashcard`), but the
   in-lesson `phrase_card` that teaches the same atom shows raw kana. Kanji-ifying
   phrase cards would align them (and is low-risk — single atom, `step.kana`
   already the audio key).
2. The richest kanji-ready surfaces (speaking, MCQ, translate-source, match-pairs)
   are exactly the ones that already keep audio in a *separate* field. That is not
   a coincidence — it is why the post-pass mechanism (§2) can guarantee the audio
   invariant structurally.

---

## 2. Substitution mechanism

### Data flow (the mapping the whole feature rests on)

```
N5_KANJI[i].anchorVocab: string[]   // course-atom IDs, e.g. ["ja-m6-1-eki"]
        │  (introducedAtModule gates WHEN a character is "known")
        ▼
JA_COURSE_ATOMS_BY_ID.get(atomId) → CourseAtom
        │  CourseAtom.kanji  // word-level kanji surface, e.g. 駅, 銀行, 食べる
        ▼
JapaneseAnnotation { surface: <kana>, reading: <kana>, atomId }  // built today
        │  substitution: surface ← CourseAtom.kanji   (reading stays kana)
        ▼
AnnotatedText SegmentRender → <ruby>駅<rt>えき</rt></ruby>
```

The kanji *word surface* comes from **`CourseAtom.kanji`** (already populated for
most atoms — its doc comment even says *"Render-time gated by future unlock
map"*). `N5_KANJI` is **not** the surface source — its `character` field is a
single glyph. `N5_KANJI` is the **unlock schedule**: `introducedAtModule` says at
which module each *component* kanji becomes readable, and `anchorVocab` is the
curated allowlist of which atoms are cleared to show kanji.

### Placement — two candidates evaluated

**(i) Annotation-time hook in `buildSingletonAnnotation`** (the plan's default).
`grammarHelpers.ts:79` builds every singleton annotation and already calls
`resolveAtom(reading)` to attach `atomId`. Add: if the atom is kanji-eligible,
override `surface`.
- ✅ Central to annotation construction.
- ❌ **No module context.** `buildSingletonAnnotation` is a low-level per-token
  helper shared by `build()/speaking()/cloze()/…` (~6,000 call sites). It does
  not know which module the lesson belongs to, and the eligibility gate is
  `introducedAtModule <= lessonModule`. Threading a module number through every
  call site is the "one real plumbing gap" the plan itself flags.
- ❌ Runs at module *import*, statically — fine for a static per-lesson gate, but
  it cannot see the assembled lesson, so it also cannot be audited per-lesson or
  toggled by `KANJI_START_MODULE` without touching authoring code.

**(ii) Content post-pass in `getMockLessonContent`** (the
`padBuildTileFloor` / `padMatchPairsFloor` precedent, `mockLessons.ts:1035`).
A new `applyKanjiSurfaces(lesson)` runs on the *shaped* lesson, which already
carries `moduleId`, exactly where the pad passes run.

**Recommendation: (ii), the post-pass, keyed on `atomId`.** Reasons:
1. **It has `moduleId`.** The eligibility gate `introducedAtModule <= moduleId`
   is computable with zero new plumbing — the pad passes already receive the
   shaped lesson for the same reason.
2. **The audio invariant becomes structural, not disciplinary.** The pass edits
   *only* `*Annotation` fields (`targetAnnotation`, `sourceAnnotation`,
   `promptAnnotation`, `pairs[].sourceAnnotation`, option annotations). It never
   visits `audioKey`, `audioText`, `targetPhrase`, `pair.source`, `step.kana`,
   `example.ja` — so a kanji display can never desync the audio key, because the
   pass physically cannot touch it.
3. **One choke point, one test.** Everything renders through
   `getMockLessonContent` — static lessons, SRS review tails, and the placement
   test all flow through it — so a single pass covers every path, and a single
   property test (§4a) gates the whole feature.
4. **Trivially gate-able.** `if (moduleNum(lesson.moduleId) < KANJI_START_MODULE)
   return lesson;` is the entire content gate.
5. **Key on `atomId`, not on re-looking-up kana.** The annotation already carries
   the *authored* `atomId`. Re-deriving from kana via `JA_COURSE_ATOMS_BY_KANA`
   is unsafe: homograph kana collapse in that map (に → the number-two atom *or*
   the particle `p-ni`, whichever was inserted last), so a kana-keyed pass would
   render the particle に as 二. Keying on the annotation's own `atomId` avoids
   this entirely.

### Scope: single-atom surfaces only in v1 (segmentation, honestly)

`resolveAtom` attaches an `atomId` **only when the whole annotation string
equals one atom's kana.** A sentence target like `build("…","わたしは すしを
たべます",…)` becomes a *single* annotation whose `surface` is the whole sentence
and whose `atomId` is `undefined` (no atom has that kana). Therefore the
atom-keyed post-pass touches **single-atom surfaces only** — vocab words, single-
word MCQ options, single-word match-pairs sources, single-word translate sources.
This is correct and honest:

- **v1 substitutes single-atom surfaces.** ~107 atoms are eligible (§6); the
  dry-run "exact" column (8,440) is the true firing set.
- **Sentences need tokenization and are out of scope for v1.** A sentence would
  have to be segmented (the `annotateJapaneseText` DP segmenter exists but emits
  *kana* word fragments, not kanji, and would then need per-token atom resolution
  + per-token okurigana handling). That is a v2 workstream, not a v1 line item.
  Sentences stay kana in v1 — which is why build/listening tiles (always sentence
  fragments) stay kana anyway.

### Inflected forms

6 anchorVocab atoms are polite `-ます` forms with **no stored kanji**
(`tabemasu, nomimasu, mimasu, yomimasu, kakimasu, ikimasu`) — their dictionary
siblings (`ja-m7-1-v-taberu` → 食べる) carry the kanji. The existing
`writtenForms.writtenSegments(dictKana, dictKanji, inflectedKana)` already
derives 食べます from (たべる, 食べる, たべます) and is unit-tested
(`jaSurfaceForms.test.ts`, `writtenForms.test.ts`). **v1: substitute only exact
dictionary-form single-atom surfaces** (skip the 6). **v1.1: route inflected
surfaces through `writtenSegments`** to pick them up.

---

## 3. Invariants the checks MUST enforce

### 3a. TTS keys stay kana-keyed (audio must not follow the display)

The exact divergence points, from the inventory:
- **Structurally safe under the post-pass** (audio field ≠ display field):
  speaking (`targetPhrase`), MCQ (`promptAudioText`), match-pairs
  (`pair.source`), translate (no audio). The pass edits the annotation; audio
  reads its own kana field. **Check:** for every surface the pass rewrites,
  assert `getTtsUrl(<the untouched audio field>)` still resolves (property test
  §4a). Also assert the pass's output never mutates any of the audio-key fields
  (deep-equal them pre/post).
- **Structurally unsafe surfaces — must be excluded in v1** because display and
  audio share one string: `grammar_rule.example.ja`, `phrase_card.step.kana`,
  `word_image_mcq.word`, bare `particle_cloze` halves. The post-pass does not
  touch these (it only edits `*Annotation` arrays), so they are safe *by not
  being in scope*. Kanji-ifying them (v2) requires first splitting each into a
  display field + a kana audio field.

### 3b. Grading

- **Typed answers** (`translate`): `gradeTypedAnswer` (`shared/speech/loose-match.ts`)
  compares NFKC-folded, whitespace-stripped, katakana↔hiragana-folded strings
  against `acceptedAnswers` (kana). It does **not** fold kanji↔kana. Since v1 puts
  kanji only on the *prompt/source* display and leaves `acceptedAnswers` kana and
  the learner typing kana (wanakana romaji IME → kana), grading is unaffected.
  **Invariant:** the post-pass never edits `acceptedAnswers`. (A learner typing
  kanji via a real IME already fails today; out of scope.)
- **Build / match tiles:** decided above — **tiles stay kana in v1.** Build
  grading compares placed tile *text* to `correctOrder`; match grading compares
  *pair ids*. Build tiles are the risk (text compare), so they stay kana; match
  sources can show kanji *because* grading is id-based, not text-based. **Check:**
  the pass must not edit `tiles`, `correctOrder`, or `pairs[].id`.
- **Speaking:** ASR scored against `targetPhrase` (kana) via char-overlap, which
  already tolerates kanji drift. Untouched.

### 3c. SRS / vocab continuity

Atom IDs are the SRS/unlock key (`canonicalAtomId` → `ja:<id>`). Kanji is a pure
**display** property injected at render-assembly time; the post-pass never adds,
removes, or renumbers an atom, and never edits `exercisedAtoms`/`atomId`.
**Invariant (test):** the multiset of `atomId`s in a lesson is identical
pre- and post-pass.

### 3d. Mastery fade — minimal v1

The plan's `kanjiMasteryState` (furigana fades as the learner masters each kanji,
mirroring the romaji fade) is **deferred to v2**. v1 ships smaller:
- **Furigana always on.** Every substituted surface renders `<ruby>` with the
  `<rt>` reading visible. No per-kanji mastery store, no fade.
- Reuse of the existing `hideHelper`/`kana-helper` machinery is *not* wired to
  kanji in v1 (it governs romaji-over-kana today). v2 adds a `kanjiMasteryState`
  parallel to the kana exposure store and gates the `<rt>` the same way
  `useRomajiHelperVisible` gates romaji.

This keeps v1 to "correct kanji surfaces with always-on furigana," which is the
shippable, reviewable unit.

---

## 4. Verification harness

### 4a. Property tests (the core gate — Vitest, always-on)

Run over `applyKanjiSurfaces` output for every JA lesson from
`getAvailableMockLessonIds`. For **every annotation segment the pass rewrote**
(`surface !== reading`):
1. **Catalog entry exists** — its `atomId` resolves in `JA_COURSE_ATOMS_BY_ID`
   and the atom is in some `N5_KANJI.anchorVocab` with `introducedAtModule <=`
   the lesson's module.
2. **Kana fallback intact** — `reading` is pure kana and equals the atom's kana
   (the pre-pass surface).
3. **TTS resolves from the untouched key** — for the owning step, `getTtsUrl` of
   the audio field (`targetPhrase`/`audioText`/`pair.source`/…) still returns
   non-null. (Guards 3a.)
4. **Structural immutability** — deep-equal `tiles`, `correctOrder`,
   `pairs[].id`, `acceptedAnswers`, `audioKey`, `audioText`, `targetPhrase`,
   and the atom-id multiset, pre vs post. (Guards 3b + 3c.)

### 4b. Playwright visual pass (`<ruby>` layout)

Follow the `scripts/transit-measure.mjs` precedent: a viewport sweep
(`mobile 390×844 / laptop 1366 / 1080p / 4k`) × theme (light/dark) against the
live `:5173`, driving one pilot-module lesson. Measured assertions:
- **No page-level horizontal overflow** — `documentElement.scrollWidth <=
  clientWidth` on every step (ruby furigana widens glyph boxes; the risk is a
  long `<rt>` reading forcing a line wider than the card).
- **Line-height stability** — the ruby line box must not clip the `<rt>`;
  assert the step container's `scrollHeight <= clientHeight` (no vertical
  clipping) and that `.kana-helper` rects sit fully inside their `<ruby>` parent.
- **Tap targets** — build/match tiles remain ≥ 44px (they stay kana, but the
  sweep guards against ruby leaking into a tile via a mis-scoped edit).
Screenshots land in the scratchpad, same as the transit script.

### 4c. Content gate (Vitest, always-on)

No kanji may leak below the configured start module:
- For every lesson whose module `< KANJI_START_MODULE`, assert **no** annotation
  segment has `surface !== reading` (post-pass).
- Assert the pass is a strict no-op when `KANJI_START_MODULE = 99` (the OFF
  sentinel) — protects `main` while the pilot module is still being chosen.
- Assert m1-m7 (kana-acquisition phase) never kanji-ify regardless of
  `KANJI_START_MODULE` (hard floor — the plan's per-module policy).

---

## 5. Phasing + effort

| Phase | Scope | Effort | Gate to advance |
|---|---|---|---|
| **v1 pilot** | `kanjiRollout.ts` constant + `applyKanjiSurfaces` post-pass (single-atom, dict-form, atom-id-keyed) wired into `getMockLessonContent`; property tests (4a) + content gate (4c); pilot one module by setting `KANJI_START_MODULE`. | **M** (~1 pass fn + 2 test files + 1 constant; no curriculum edits) | 4a/4c green; Playwright 4b clean on pilot module; editorial sign-off on the pilot module's kanji surfaces |
| **v1.1 inflected** | Route inflected single-atom surfaces through `writtenForms.writtenSegments` (picks up the 6 `-ます` atoms + adjective/verb inflections). | **S** | property tests extended; editorial spot-check |
| **rollout** | Lower `KANJI_START_MODULE` module-by-module across m8-m22 (the range the catalog already covers), editorial review per module. | **M** (mostly review, not code) | per-module editorial sign-off |
| **catalog extension m23-27** | Add `N5_KANJI` entries for m23-27 and populate `anchorVocab` for the 22 gap atoms (§6). Net-new authoring + native review. | **L** (content + review; the least-ready slice per the plan) | native editorial review (see `es-content-quality-flag` precedent) |
| **v2 fade store** | `kanjiMasteryState` parallel to kana exposure; gate `<rt>` via a kanji-aware `useRomajiHelperVisible` sibling. | **M** | fade behaves like romaji fade; no SRS coupling change |
| **v2 sentences** | Tokenize sentence surfaces (build on `annotateJapaneseText` DP segmenter) → per-token kanji + okurigana. Unlocks build/listening tiles + sentence targets. | **L** | new tokenization test suite |

Start-module value is a **config constant** (`KANJI_START_MODULE`), never a
hardcode, so the parallel research just sets one number.

---

## 6. Dry-run coverage numbers

Reproduce (behavior-neutral; follows the `buildTileDistractorAudit.test.ts`
env-gate precedent):

```
KANJI_COVERAGE_AUDIT=1 [KANJI_AUDIT_OUT=/path/out.txt] npx vitest run \
  src/features/languages/ja/secondScript/kanjiCoverageAudit.test.ts
```

**Headline:** 98 `N5_KANJI` entries → 113 distinct `anchorVocab` atom ids, **all
113 resolve** (catalog is clean, 0 dangling ids). Of those, **107 carry a kanji
surface**; 6 do not (the `-ます` forms — v1 skips, v1.1 derives). Walked
**153,449** JA lesson strings.

*Keyed on atoms/surfaces (stable against the concurrent info-step purge), not
step counts.*

| unlock module | atoms→kanji | (multi-kanji) | atoms no-kanji | exact occ | substring occ |
|---:|---:|---:|---:|---:|---:|
| m8  | 13 | 0 | 0 | 2287 | 16190 |
| m9  | 7  | 1 | 0 | 221  | 1245  |
| m10 | 7  | 3 | 0 | 476  | 5456  |
| m11 | 7  | 4 | 0 | 636  | 1901  |
| m12 | 6  | 2 | 0 | 167  | 3884  |
| m13 | 3  | 0 | 0 | 505  | 10921 |
| m14 | 7  | 0 | 5 | 752  | 1840  |
| m15 | 6  | 0 | 1 | 180  | 1311  |
| m16 | 6  | 1 | 0 | 269  | 5246  |
| m17 | 6  | 0 | 0 | 50   | 362   |
| m18 | 5  | 0 | 0 | 382  | 1244  |
| m19 | 5  | 1 | 0 | 444  | 1465  |
| m20 | 6  | 1 | 0 | 346  | 6617  |
| m21 | 4  | 0 | 0 | 440  | 1202  |
| m22 | 19 | 8 | 0 | 1285 | 3729  |
| **TOTAL** | **107** | **21** | — | **8440** | **62613** |

- **exact occ** = lesson strings that *equal* an atom's kana — the v1 hook's true
  firing set (single-atom surfaces). **substring occ** = loose superset incl.
  mid-sentence appearances; those need tokenization (v2) before they're safe to
  substitute, and for short kana they are unreliable (see below).
- **unlock module** = earliest `introducedAtModule` among the `N5_KANJI` entries
  anchoring the atom (the plan's eager `<=` gate).
- **21 multi-kanji words** (e.g. 電車, 学校, 銀行): the eager MIN-unlock would show
  them as soon as *one* component kanji is taught, before the learner has seen the
  other. v1 must gate multi-kanji surfaces on the **MAX of their components'
  `introducedAtModule`** (or keep them on the curated `anchorVocab` allowlist and
  set each entry's module to the max). This is a real correctness item for the
  pass, not just a nicety.
- **Short-kana homographs are unreliable and must be excluded from any
  substring-based logic** (the audit flags 50+, e.g. に/き/て/め). This is *the*
  argument for keying on the authored `atomId` (§2) rather than a kana lookup —
  `に` "two" vs the particle `に` collapse in `JA_COURSE_ATOMS_BY_KANA`.

**m23-27 coverage gap:** `N5_KANJI` has **0** entries with
`introducedAtModule >= 23`. **22 atoms authored in m23-27 carry a kanji form but
no `anchorVocab` can unlock them:** 雑誌, 一緒, 会う, 作る, 初めて, 困る, 大切, 強い,
忘れる, 意味, 晩御飯, 暗い, 来年, 来月, 歌う, 物, 狭い, 留学生, 疲れる, 絵, 練習,
辛い. This is the "catalog + authoring gap" slice — exactly where the owner's QA
landed (`ja-m27-5-2`). It stays kana until the catalog is extended and natively
reviewed; **do not start the pilot here.**

---

## 7. Riskiest thing & the first PR

**Riskiest thing:** the display-vs-audio-vs-grading key divergence. The whole
feature is safe *only because* the kanji-ready surfaces keep audio in a separate
kana field and grade on ids — and unsafe the moment a surface shares one string
across display/audio/grading (grammar examples, phrase cards, build tiles). The
mechanism that makes this structural rather than a matter of authoring discipline
is the **post-pass that edits only `*Annotation` fields**. If a future edit lets
kanji into `audioKey`/`example.ja`/a build tile, audio silently goes mute and/or
grading silently rejects correct answers — both are hard to notice in review.
Secondary risk: editorial correctness of the kanji surfaces themselves (wrong
okurigana / conventionally-kana words), which needs native review, not code
(per the `es-content-quality-flag` precedent).

**First PR should contain, and nothing more:**
1. `secondScript/kanjiRollout.ts` — `KANJI_START_MODULE = 99` (OFF).
2. `secondScript/applyKanjiSurfaces.ts` — the post-pass: single-atom,
   dictionary-form, **atom-id-keyed**, multi-kanji gated on MAX-of-components,
   editing only `*Annotation` fields; wired into `getMockLessonContent` beside
   `padBuildTileFloor`.
3. Property test (§4a) + content-gate test (§4c), both always-on.
4. **No curriculum edits, no catalog edits, no start-module change** — the pass
   is a proven no-op at `KANJI_START_MODULE = 99`, so the PR is safe to merge
   before the pilot module is chosen; flipping the constant (a one-line follow-up)
   is the actual pilot.

(The dry-run audit `secondScript/kanjiCoverageAudit.test.ts` already landed with
this spec.)
