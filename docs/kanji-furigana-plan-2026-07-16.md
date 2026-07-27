# Kanji + furigana — investigation & plan (2026-07-16)

> **⚠️ STALE / SUPERSEDED (2026-07-20).** The "Verdict up front" below — that
> zero lesson content has ever been authored with a kanji surface and that the
> course is "still kana-only" — is NO LONGER TRUE. Kanji recognition went LIVE
> at M8 via `ja/secondScript/kanjiRollout.ts` (furigana window = unlock+2); see
> the pinned invariants §"Script ladder" and `kanji-implementation-spec-2026-07-16.md`.
> This doc is retained for its investigation history only — do not act on its
> "not executed / no code changes" framing.

**Trigger:** Owner QA note: *"I am not seeing kanji where I probably should,
http://localhost:5173/ja/learn/lessons/ja-m27-5-2 was an example, should be
kanji + furigana at that point right?"*

**Verdict up front:** Not a bug, not a renderer regression, and not cheap
to fix. The course is, by original design, still in a "kana-only" phase.
Kanji rendering was scoped as **"Phase 3 — kanji ramp"** back in the
2026-05-14 JA lesson-flow spec and never executed. The renderer already
supports kanji + furigana correctly; **zero lesson content anywhere in the
course (m1 through m27) has ever been authored with a kanji surface form.**
This needs a real content-authoring wave, not a flag flip. No code changes
were made.

---

## 1. What `ja-m27-5-2` actually contains

`src/features/languages/ja/curriculum/m27.ts:1724-1878` — "Production —
modal grammar" (obligation/advice/change patterns: なければなりません /
ほうがいい / になる). Every field a learner sees or hears — `build()`
targets, `speaking()` phrases, `cloze()` answers, `sentenceMcq()` options,
`listeningCompSentence`/`listeningBuildSentence` text — is **pure kana**.
Example: `"ぎんこうに いかなければなりません"` ("I must go to the bank"),
never `"銀行に行かなければなりません"`.

Traced where `ja-m27-5-2` is wired: `mockLessons.ts:229` imports `M27_5_2`
from `curriculum/m27.ts`; `mockLessons.ts:853` registers it under the id
map consumed by the lesson player. No transform sits between the curriculum
source and the renderer that could be "stripping" kanji — confirmed by
grepping for any `toHiragana`/`stripKanji`/kanji-normalization step in the
lesson data pipeline; the only `convertToHiragana` calls
(`features/languages/ja/readingAnnotation/kuroshiro.ts`) are used for
**speech-recognition transcript comparison** (Whisper output → kana) and
async romanization, not for rendering lesson content.

**Where m25-m27 come from:** `git log` on `m25.ts`/`m26.ts`/`m27.ts` shows
their most recent content edit is `73a461e` "listening sentence-first wave
— 381 items across M5-M27" (2026-07-12), preceded by `b076040` (2026-07-07)
and the `09540de` "Phase 1 step 9" file-relocation move. They did not land
today via `7117af9` (today's top-level `Merge branch 'main' of
github.com/open-lingo/lingo`) — both merge parents already had these files
before that merge; that merge just unified several long-running feature
branches (transit map, practice pillars, settings redesign, etc.) into the
branch the owner is now QA-ing, which is likely why m25-27 feels "new" to
this QA pass even though the commits are 4-9 days old.

**Kana-only isn't specific to m25-27** — it's the policy (by omission)
across the *entire* course. Kanji-character grep (`\x{4E00}-\x{9FFF}`)
across `curriculum/m*.ts`:

| Module | kanji chars found | Where |
|---|---|---|
| m4, m6-m8, m10, m11, m13, m15-m18, m21, m23 | 0 | — |
| m9, m12, m19, m20, m22, m24, m26 | 2-6 | English-language explanation prose only |
| m14 | 61 | Counter glosses in prose, e.g. `"個 (こ) is the general counter..."` |
| m5, m25, m27 | 7-8 | Same — parenthetical glosses in explanations |

In **every** case checked (including the high-count m14, which covers
counters 個/枚/本), the kanji appears only inside English-language
`explanation`/`description`/`rule.text` strings as a bracketed gloss for
the human reader of the code — never in a `surface`, `target`, `correctKana`,
tile, or any string actually rendered/spoken/matched as Japanese. So: the
content is kana-only **at the source**, uniformly, for the whole course —
this is not something a renderer strips.

## 2. Furigana/annotation machinery — exists and works, but is unused

`src/shared/readingAnnotation/AnnotatedText.tsx` genuinely supports kanji
ruby annotation today:

- **Segments mode** (`SegmentRender`, lines 226-236): when a
  `JapaneseAnnotation` has `surface !== reading`, it renders
  `<ruby>{surface}<rt>{reading/romaji}</rt></ruby>` — i.e. real kanji +
  furigana. This is exercised by `SpeakingStepView.tsx:157-158`, which
  prefers `step.targetAnnotation` (segments) over plain `targetPhrase` text
  when present.
- The type doc for `JapaneseAnnotation` (`src/shared/japanese/types.ts:4`)
  literally says: *"`surface` is what appears on the baseline (kana for
  now, kanji in Phase 3)."*
- **The catch:** every producer of `JapaneseAnnotation` in the codebase —
  `buildSingletonAnnotation()` in `grammarHelpers.ts:79-84`, and every
  `targetAnnotation:` literal in `lessonBuilder.ts` and the `m1-*.ts`
  files — sets `reading` equal to `surface` (or defaults it to `surface`
  when omitted). **No caller anywhere ever passes a kanji surface with a
  different kana reading.** The kanji-ruby branch of `AnnotatedText` is
  therefore dead code from real content's perspective: it's reachable,
  correct by inspection, but never actually hit.
- Confirmed via test coverage: grepped `AnnotatedText.test.tsx` and the new
  `AnnotatedText.ko.test.tsx` (the recent Korean-support addition
  mentioned in the task) for any kanji character — **zero hits**. The
  `surface ≠ reading` ruby path has no test exercising it either. It's
  unverified in practice, just correct by code reading.
- Ran `npx vitest run src/shared/readingAnnotation/AnnotatedText.test.tsx
  src/shared/readingAnnotation/AnnotatedText.ko.test.tsx` — 6/6 pass
  (baseline is healthy, confirms nothing is currently broken).

This exact gap was foreseen and explicitly deferred. From
`docs/superpowers/specs/2026-05-14-japanese-lesson-flow-design.md:438-444`
(*"Phase 3 (own spec)"*): *"Kanji ramp. The `JapaneseAnnotation.surface`
field is already the place the kanji form lives; the `reading` field is
already where furigana lives. Phase 3 adds a `kanjiMasteryState` parallel
to the kana one and flips `<AnnotatedJa>` to use the kana-over-kanji branch
for any segment whose `surface ≠ reading`."* And from the companion
follow-ups doc (`2026-05-14-japanese-followups.md:122-133`, "12. Phase 3 —
kanji ramp"): *"the renderer's kanji branch just emits a single `<ruby>`
per segment... no renderer change [needed]."* That spec was never picked
up as its own doc/implementation — this plan is effectively the first
concrete follow-through on it.

### A separate, disconnected kanji feature already exists

`src/features/practice/KanjiPracticePage.tsx` (routed at `/practice/kanji`,
reachable from the practice-pillar hub, `src/App.tsx:460`) is a **standalone
flashcard/MCQ drill** built on `src/features/languages/ja/secondScript/n5Kanji.ts`
— a 99-entry N5 kanji catalog (`character`, `onyomi`, `kunyomi`, `meaning`,
`strokeCount`, `anchorVocab`, `introducedAtModule`). It's fully decoupled
from the lesson pathway: it never touches lesson content, and its
`introducedAtModule` values top out at **22** (19 kanji seeded at m22, none
beyond). So even the intentional "kanji track" the codebase already has is
5 modules stale relative to the current course length (m27) — nobody
extended the catalog when m23-27 were authored. This catalog is the
obvious seed data for Phase 3 (see §4).

## 3. De-facto kanji policy in earlier modules (m8-m17)

Same as everywhere else: **kana-only in actual content**, confirmed by the
grep table in §1 (m8, m10, m11, m13, m15-m17 = zero kanji anywhere, incl.
prose; m9, m12, m14 have kanji only inside explanation glosses). Spot-checked
m14 (highest count, 61 occurrences — it's the counters module, 個/枚/本)
directly: every actual step target/tile/answer is kana
(`"りんごを さんこ ください。"`, `"さんぼん"`), kanji shows up only in
prompts/explanations like `"(個/こ = general counter)"`.

So there is **no existing kanji + furigana precedent anywhere in the
course** to extend by example — m8-m17 is not "kanji with readings that
got dropped by m25-27," it's kana-only by the same original design that
covers the whole pathway. "Kanji + furigana in late course" is a net-new
capability activation, not a regression to patch.

## 4. Why this isn't a cheap/safe fix

There is no flag, prop, or wiring gap to flip — no lesson content object
anywhere sets `surface ≠ reading`. Making `ja-m27-5-2` (or any lesson) show
real kanji requires actually writing kanji into the content, which means:

1. **New state**: `kanjiMasteryState` (parallel store to the existing kana
   mastery/exposure tracker) doesn't exist yet — needed for the same
   fade-on-mastery UX the kana romaji helper already has.
2. **Catalog gap**: `N5_KANJI` stops at `introducedAtModule: 22`; m23-27
   need new entries (or a deliberate decision that m23-27 stays kana-only
   and the ramp targets m8-22 first).
3. **Editorial risk**: swapping kana strings for kanji is not mechanical —
   it requires correct kanji form, correct okurigana, and judgment about
   which words are conventionally kanji vs. kana in real Japanese (e.g.
   ください, です, ある are usually kana even for native writers; nouns
   like 銀行, 病院 are usually kanji). Per `~/.claude/projects/.../memory/
   es-content-quality-flag.md` precedent, agent-authored content changes to
   language pedagogy need native-level editorial review before shipping —
   the same caution applies here, probably more so since a wrong kanji
   choice is more visibly wrong than a wrong kana-only sentence.
4. **Scale**: `curriculum/m*.ts` is ~73,100 lines across 44 files, ~6,066
   step-builder calls (`build`/`speaking`/`cloze`/`sentenceMcq`/`vocabMcq`/
   listening variants), ~443 `LessonContent` lesson objects. Hand-editing
   every kana string that should become kanji is not viable, and the task
   explicitly says not to mass-edit.
5. **Test/lint surface**: existing curriculum invariants
   (`assertNoSameAnswerCluster`, `assertAnswerRotation`,
   `listeningGranularity.test.ts`'s flat kana-vs-kanji ban, lesson
   registration tests) may need kanji-awareness once real kanji content
   exists.

## 5. Per-module recommendation

| Modules | Recommendation |
|---|---|
| m1-m7 (kana acquisition) | **No kanji.** Correct as-is — this phase is explicitly about hiragana/katakana literacy; introducing kanji here would undercut the pedagogy. |
| m8-m22 | **Primary Phase-3 target.** `N5_KANJI` already carries `introducedAtModule` values across exactly this range (8-22) with `anchorVocab` tags — i.e. the catalog was seeded with this ramp in mind and never wired up. This is the highest-leverage, lowest-risk place to start: reuse the existing 99-entry catalog instead of inventing a new one. |
| m23-27 | **Catalog + authoring gap.** No `N5_KANJI` entries exist past m22. Before any kanji shows up here (which is exactly where the owner's QA landed), the catalog needs extension plus fresh editorial review — this is the least-ready slice, despite being the one that triggered the complaint. |

## 6. Suggested authoring approach (do not mass-edit curriculum files)

Rather than hand-rewriting thousands of kana strings across 44 files:

1. **Choke-point substitution layer, not per-file edits.** The wiring for
   this already half-exists and lines up cleanly:
   `buildSingletonAnnotation()` (`grammarHelpers.ts:79-84`) already calls
   `resolveAtom(reading)` → `JA_COURSE_ATOMS_BY_KANA.get(reading)`, which
   resolves every kana word to a course **atom id** (e.g. `"ja-m5-1-v-1"`).
   `N5_KANJI[i].anchorVocab` (`secondScript/n5Kanji.ts`) is *already a list
   of these exact atom ids*, not raw words (confirmed:
   `anchorVocab: ["ja-m5-1-v-1", "ja-m5-5-v-hitotsu"]` on the 一 entry).
   So the substitution hook is: after `resolveAtom` produces `atomId`,
   check whether any `N5_KANJI` entry's `anchorVocab` contains it and its
   `introducedAtModule <= currentModule`; if so, override `surface` with
   the kanji form and keep `reading` as the kana — otherwise fall through
   to today's kana-only singleton. This makes kanji activation a **data +
   one small function change**, not a curriculum rewrite: existing
   `build()`/`speaking()`/`cloze()` calls keep passing kana exactly as
   they do today, and kanji surfaces automatically once a word's
   catalog entry + module threshold say it should. (Needs the current
   module number threaded into `buildSingletonAnnotation`'s call sites,
   which it doesn't receive today — the one real plumbing gap.)
2. **Extend `N5_KANJI`** (`secondScript/n5Kanji.ts`) for m23-27: 19 kanji
   entries currently exist for m22 and nothing beyond. Each new entry
   needs `anchorVocab` populated with the atom ids of m23-27 vocabulary
   actually used in `curriculum/m23.ts`-`m27.ts`, so the same substitution
   hook picks them up for free once wired.
3. **Add `kanjiMasteryState`**, mirroring the existing kana
   exposure/mastery store, so the furigana fades the same way romaji
   already does.
4. **Pilot on one module** (recommend m14 — counters, already has the
   densest kanji-relevant vocabulary and existing glosses to crib from),
   verify rendering + fade behavior + SRS/atom-id coupling, get editorial
   sign-off, then roll forward module by module (m8-22 first, m23-27 once
   the catalog is extended).
5. Treat this as its own scoped spec/PROJECT_STATE workstream (it's
   literally pre-scoped as "Phase 3" already) rather than a quick patch —
   size it similarly to the katakana rollout (`b076040`) or listening
   sentence-first wave (`73a461e`), which is the closest precedent for
   "batch content transformation across m5-m27."

## 7. What was changed in this investigation

Nothing in `src/`. This is a research + plan task per instructions (no
cheap/safe fix exists — the gap is a genuine, previously-scoped,
not-yet-built feature, not a wiring bug). Verified baseline health only:
`npx tsc --noEmit` clean; targeted `npx vitest run
src/shared/readingAnnotation/AnnotatedText.test.tsx
src/shared/readingAnnotation/AnnotatedText.ko.test.tsx` — 6/6 pass.
