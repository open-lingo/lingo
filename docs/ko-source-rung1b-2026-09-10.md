# KO-source learner program — rung 1b (2026-09-10)

**Status:** LANDED (this slice), uncommitted in worktree `ja-wave1`.
**Scope:** rung 1b of `docs/ko-source-learner-scope-2026-09-10.md` — wire the
rung-1a runtime-lookup stub into the step views, land the fourth grading
de-coupling in `moduleCompiler.ts`, decide story-mode scope, and run the
MT-wave pipeline once on one pilot module (m6) end-to-end.

Read first: `docs/ko-source-rung1a-2026-09-10.md` (rung 1a — the anchor
schema, the extractor, the unwired `resolveContentString` stub, and the
three-of-four grading de-couplings that landed there).

---

## 1. The fourth grading de-coupling — `moduleCompiler.ts`

Both fixes described in rung 1a §2 landed, with one deliberate deviation
from the doc's literal suggested one-liner (reasoning below).

### 1a. Dedupe key (filler-variety `usedKey`)

```ts
// OLD
const usedKey = (tag: string, a: Atom) =>
  `${tag}:${a.kana}|${tag}g:${a.meaningEn}`;

// NEW
const usedKey = (tag: string, a: Atom) => `${tag}:${a.kana}`;
```

Rung 1a's suggested fix was `` `${tag}:${a.kana}|${tag}g:${a.id ?? a.kana}` ``.
That's not implementable as written: the local `Atom` type in
`moduleCompiler.ts` has no `id` field, and `CourseAtom.id` (the real
registry type) is documented as "kebab-case romaji of the kana" — i.e. it's
bijectively derived from `kana`. Appending `a.id ?? a.kana` to the key would
either always equal `a.kana` (when falling back) or a value that carries the
same information as `a.kana` under a different encoding (when present) —
functionally a no-op that would have silently misrepresented itself as
still-catching something. Implementing it literally would have been
cosmetic, not a real fix.

**What actually changed:** the key is now keyed on `kana` alone, dropping
the `meaningEn`-language coupling entirely (which was the actual English-shape
dependency rung 1a flagged — `meaningEn` will hold Korean text once a
KO-authored/reverse-teaching design lands, and a Korean string joined into a
dedupe key via `|` is just an opaque unique-enough suffix, not a real
identity check).

**Accepted tradeoff:** this drops the key's secondary role of catching two
*different* atoms that happen to share an English gloss (documented in the
codebase as the この/その ambiguity case) from colliding in the same filler
rotation. `kana` is already the correct primary identity for every
`Map<string, Atom>` in this file (confirmed via `atomIndex()`'s own
first-wins kana-collapse behavior for は — の 花/鼻 ambiguity), so nothing
about *atom* identity is weakened — only the "two atoms, same English word"
cross-check is gone, and that check was itself English-shape-coupled to
begin with.

**Verification:** `reviewFillerVariety.test.ts`'s `"never repeats a filler
prompt within one lesson"` test compiles every real `*.ir.json` module and
asserts no lesson's filler steps share a literal `step.prompt` string — this
is the concrete behavior-preserving safety net for the tradeoff above, and
it stayed green (see §5 gates).

### 1b. Cue-prefix regex (`stripRegisterCue`)

Hoisted the previously-local `meaningOf` closure to an exported,
module-scope, directly-testable function:

```ts
export function stripRegisterCue(en: string): string {
  return en.replace(/^(?:Say|Ask|Answer|Reply|Tell)\b[^:]{0,40}:\s*/i, "").trim() || en;
}
```

The regex itself is **unchanged** — it's anchored on five literal ASCII
English verbs, so it can only ever match Latin-script text starting with one
of them. That's exactly the property rung 1a needed proven: a Korean-language
cue can never match this pattern, so it is neither stripped nor collapsed by
the `|| en` fallback — it passes through byte-for-byte unchanged (fails
*closed*, not silently-wrong). The real fix — a structured `cue?: string`
field promoted out of the `en` string at the IR/beat-authoring layer — is a
schema change touching `curriculum/m*.ts` / IR YAML, which is off-limits
this rung (concurrent JA authoring lanes) and stays future work.

**Known gap, not hidden:** until that schema fix lands, a Korean-authored
cue convention (if one is ever introduced) gets *zero* stripping — the
Inv-8-family "answer reveals the directive, not the meaning" risk reappears
for KO exactly as rung 1a §2b describes for any future non-English cue
convention. Flagged here explicitly so it isn't rediscovered as a surprise.

**Test:** `src/features/lesson/data/moduleCompiler.stripRegisterCue.test.ts`
(8 cases) — English stripping behavior (5 verb forms, case-insensitive, the
empty-collapse guard, a non-cue "Say" sentence with no colon) plus the two
required Korean cases: a cue-shaped Korean sentence and a plain Korean
sentence, both asserted to pass through unchanged.

---

## 2. Step-view wiring

`resolveContentString(lang, anchor, enText, uiLocale)` /
`resolveContentStringFromCatalogs` (rung 1a, `src/shared/i18n/content/resolveContentString.ts`)
is now called from every step view named in the rung-1a brief, via two
call-site hooks in `src/features/lesson/hooks/useContentString.ts`:

- `useContentString(lessonId, anchor | null, enText)` — single field.
- `useContentStrings(lessonId, items[])` — array fields (MCQ options,
  grammar examples, match-pairs targets), to avoid a hooks-in-a-loop
  violation.

Both read `uiLocale` via `useTranslation().i18n.language` (never React
context), so a step view needs no `LanguageProvider` to be testable, and
`en` is a pure passthrough — `resolveContentStringFromCatalogs` returns
`enText` immediately when `uiLocale === "en"`, before any catalog lookup.

Each view derives its own anchors via helpers in
`src/shared/i18n/content/anchors.ts` (mirroring the extractor's own
derivation) plus `courseIdsFromLessonId(lessonId)` — a pure regex parse of
`<languageId>-m<N>-...`, chosen specifically to avoid a `useLanguage()`
context dependency.

### Wiring map

| View | Fields wired | Notes |
|---|---|---|
| `InfoStepView.tsx` | `title`, `body` | |
| `MultipleChoiceStepView.tsx` | `prompt` (before `formatPrompt()`), `hint`, `explanation`, each `option.text` | |
| `BuildSentenceStepView.tsx` | `prompt` (same ordering), `hint`, `explanation` | `promptAnchor` keyed with `step.targetSentence` as the JA surface, matching the extractor's own fallback chain |
| `FillBlankStepView.tsx` | `explanation`, `hint` | |
| `ParticleClozeStepView.tsx` | `explanation` (both render sites) | |
| `MatchPairsStepView.tsx` | `prompt`, each meaning-grid `pair.target` | Resolved via a `Map<pairId, text>` (not array index) since `sourceOrder`/`targetOrder` are independently shuffled copies of `step.pairs`; romaji-grid targets are never extracted (`isGlossText` drops them at catalog-build time), so calling the lookup unconditionally on every pair is safe |
| `PhraseCardStepView.tsx` | `meaningEn` | Resolved through the ATOM catalog (`atomGlossAnchor`, keyed by `step.kana`), not a step-shaped anchor — the extractor's generic `extractStep()` never captures this field, only its atom-gloss loop does |
| `GrammarRuleStepView.tsx` | `title`, `rule`, `examples[].en`, `antiPattern.en`/`.why`, `cultureNote` | `readAloudText` deliberately stays raw English — `useSpeechReadAloud` hardcodes `utterance.lang = "en-US"`, so speaking a translated string through a pinned English voice would be doubly wrong; `antiPattern.ja`/`.romaji` also stay raw (Japanese text, not translatable content) |

`StepRenderer.tsx` passes `lessonId={lessonId ?? step.id}` at all 8 call
sites.

**Test:** `src/features/lesson/hooks/useContentString.test.tsx` mounts a
real `InfoStepView` against a mocked `react-i18next` (mutable locale via
`vi.hoisted`) and a partially-mocked `resolveContentString` module — the
real `resolveContentStringFromCatalogs` pure-lookup logic runs unchanged
against an in-memory fake `m6.ko.json`-shaped catalog (since no real
translated catalog existed on disk when this test was written). 3 cases:
`ko` locale renders the Korean string, `en` locale is a pure passthrough,
and a locale with no matching catalog entry (`es`) also falls back to
English.

---

## 3. Story-mode scope decision

**Decision: OUT of scope for the m1–m8 pilot. Extractor's skip-with-warning
behavior is left as-is.**

Reasoning:
- Story content (`story:ja-m<N>-*` lesson ids in `mockCourse.ts`) is loaded
  through a completely different pipeline —
  `src/features/practice/stories/{StoryProse.tsx,storyBlocks.ts,storyQuestions.ts}`
  — not `getMockLessonContent`/`LessonContent`/step-shaped at all. The
  extractor's targeted field-allowlist design (walking compiled step shapes)
  doesn't apply to it; supporting it would mean building a second, structurally
  different extraction path over story blocks + comprehension questions, not
  extending the existing allowlist.
- Checked `mockCourse.ts` directly for scope impact: of the m1–m8 pilot
  modules, only **m3** (`story:ja-m3-about-me`) and **m7**
  (`story:ja-m7-my-day`) carry a story row at all. m1, m2, m4, m5, m6, m8
  have none. The m6 pilot module used for this rung's MT wave (§4) has zero
  story content, so this decision has no effect on that pilot run.
- Given the bounded impact (2 of 8 pilot modules) and the real cost of a
  second extraction path, deferring is the right call for this rung. A
  follow-up rung should revisit once the m1–m8 step-shaped content is fully
  translated and reviewed, prioritizing m3/m7's story rows specifically
  rather than building general story-pipeline i18n speculatively.

### Update 2026-09-10 — Story mode shipped for m3 + m7

Extended the extractor with a `Story`-keyed section (scoped by `story.module`,
not tile ids — m3 has 2 stories, m7 has 2). Anchors: `en:<hash>` title/theme,
`ja:<sentence>` translation, `gloss:<surface>` word gloss; new kinds
`story-theme`/`story-gloss`. Wired via `useContentString(s)` in
`StoryReaderPage.tsx` only. m3 256→278, m7 350→378 anchors, 0 stale m1–m8.
Drafter got all 38 sentence-glosses' register wrong (plain, should be 해요체
since JA is 100% です/ます) — hand-corrected all 38 + 1 vocab fix (おちゃ→녹차,
matching `m2/atom`). m6/m8 also now show story anchors ("missing", 0 stale) —
drafting those is future-rung scope.

---

## 4. MT-wave pilot — m6

### Tooling

New script: `scripts/i18n/mt-translate-catalog.mjs` — drafts a
`<moduleId>.ko.json` sidecar from an existing `<moduleId>.en.json` via the
local Ollama server, following the rung-1a §4 recipe and reusing
`scripts/draft/throttle.mjs`'s thermal governor:

- **Model:** `qwen3.5:122b-a10b-q4_K_M` (pinned non-mlx tag — the
  `-mlx` variant silently ignores the `format` JSON-schema constraint and
  returns prose with a 200 OK per the `ollama/ollama#16563` trap in the
  local-model-stack memory doc).
- **Batching:** ~40 anchors per call (9 batches for m6's 335 entries), each
  batch built into one prompt that states the anchor categories in PROSE
  (grammar-point rule/example, vocabulary gloss, step-prompt-keyed-to-a-JA-sentence,
  generic step text) rather than relying on the JSON-schema `enum` alone —
  per the memory doc's 08-20 finding that enum-only labeling let this model
  emit consecutive-run garbage.
- **Structure-true instruction:** the prompt extracts the JA surface
  embedded in each anchor (`/gp:.../ex:<ja>`, `/<lessonId>/ja:<ja-surface>`,
  `/atom:<kana>/...`) and explicitly instructs the model to translate
  structure-true to that JA surface, not to the English gloss's often
  idiomatically-smoothed wording.
- **Call shape:** `think: false`, `format` = JSON array schema
  `{anchor, text}[]`, `num_ctx: 16384`, `num_predict` scaled to batch size
  (min 3500, per the memory doc's empty-content trap on this model),
  `temperature: 0.3`.
- **Verification per batch:** response must parse as JSON, must have the
  exact input count, and every returned anchor must be a member of the
  input batch's anchor set — on failure, the batch is retried once as two
  half-batches (each independently re-verified) rather than accepted
  partially or silently dropped.

### Run

- `claude-local` was reachable (`ollama list` shows the pinned tag present,
  81 GB); a direct 5-item smoke batch round-tripped correctly in ~21s, so
  the full run proceeded rather than falling back to the prompt-files-only
  path.
- `node scripts/i18n/extract-content-catalog.mjs ja m6` → **335 anchors**
  → `src/shared/i18n/content/ja/m6.en.json` (unchanged from the rung-1a
  extraction — re-running is deterministic, confirmed by `git status`
  showing no diff on this file).
- `node scripts/i18n/mt-translate-catalog.mjs ja m6` → **335/335 entries
  drafted, 0 batch failures, 0 retries needed**, wall time **6.2 min**
  (well inside the 10-minute budget) → `src/shared/i18n/content/ja/m6.ko.json`.
- `node scripts/i18n/extract-content-catalog.mjs ja m6 --check`:
  ```
  [check] m6 (ja): 335 en anchors
    fresh (ko matches current en):  335
    stale (en changed since ko):    0
    missing (no ko entry yet):      0
  ```

### Anchor breakdown (335 total)

| Category | Count |
|---|---|
| `en:` (generic step text — titles, instructions, options, hints) | 170 |
| `ja:` (prompt/gloss keyed to a JA sentence) | 98 |
| `gp:` (grammar-point rule/example) | 38 |
| `atom:` (vocabulary gloss/shortGloss) | 29 |

### Sample (10 of the 20 hand-checked, one per notable pattern)

```
m6/gp:imasu/ex:ねこが いる。            EN: There's a cat.                KO: 고양이가 있다.
m6/gp:nai-existence/ex:ほんが あらない。 EN: (incorrect)                    KO: (틀림)
m6/gp:location-qa/ex:ねこは どこに いる？ EN: Where's the cat?              KO: 고양이는 어디에 있어요?
m6/atom:ある/gloss                     EN: to be, to have (inanimate)     KO: 있다, 소유하다 (무생물)
m6/atom:に/gloss                       EN: to / at / location             KO: 에 / 장소
m6/ja-m6-neo-10/ja:ほんの うえに かぎが ある  EN: Build: There's a key on the book.   KO: 빌드: 책 위에 열쇠가 있어요.
m6/ja-m6-neo-9/ja:えきで かう           EN: Build: I buy it at the station. KO: 만들기: 역에서 산다.
m6/ja-m6-neo-1/ja:それを みない         EN: Build: I don't look at that one. KO: 빌드: 나는 그것을 보지 않아.
m6/ja-m6-neo-3/en:...(dog)             EN: Pick the word for "dog"        KO: "개"에 해당하는 단어를 고르세요
m6/ja-m6-neo-challenge/en:...          EN: There's no key in the bag.     KO: 가방에 열쇠가 없다.
```

### Quality notes (for the Sonnet fidelity review, §4 step 4 of rung 1a)

Structural fidelity is genuinely good — existence forms (が ある / が いる),
location questions, and negation glosses consistently mirror the JA particle
structure rather than smoothing to idiomatic English-shaped Korean, which
was the whole point of the structure-true instruction. Three concrete issues
a reviewer should fix before this is ship-ready:

1. **Register inconsistency.** Some entries render in plain/written form
   (`있다`, `보지 않아`) and others in polite `-요`/`-어요` form
   (`있어요`, `어디에 있어요?`) — sometimes within the same batch. Needs a
   single register convention decided and normalized across the whole
   catalog, not left to per-batch model drift.
2. **"Build:" prefix translated two different ways** — `빌드:`
   (transliteration) in some entries, `만들기:` (translated) in others.
   Pick one convention.
3. **Occasional added explicit subject not present in the JA source** — e.g.
   それを みない (no subject) → "나는 그것을 보지 않아" (adds 나는/"I").
   JA's pro-drop is exactly the kind of structural feature a "structure-true"
   gloss should preserve when natural in Korean (Korean pro-drops too); a
   few entries over-specify. Worth a targeted pass, not a full re-draft.

None of these are anchor-alignment or hallucination problems — the model
never invented, dropped, or misordered an anchor across all 9 batches, and
the `(incorrect)`-marker convention was followed consistently. This is
exactly the shape of thing the recipe's Sonnet-review step exists to catch.

---

## 5. Gates (this session, all foreground, no thresholds loosened)

- `npx tsc --noEmit -p .` → **0 errors** (both after the step-view wiring
  and after the `moduleCompiler.ts` edits).
- `npx vitest run src/features/lesson/data/moduleCompiler.stripRegisterCue.test.ts src/features/lesson/data/moduleCompiler.diagnostics.test.ts src/features/lesson/data/reviewFillerVariety.test.ts` →
  **1 failed, 47 passed (48)** — the 1 failure is
  `moduleCompiler.diagnostics.test.ts`'s pre-existing `m40.ir.json has zero
  enforced diagnostics` (3 `challenge-not-novel` findings), present before
  any edit in this rung and traced to the concurrently in-flight JA
  authoring lane adjacent to m41 — not this work.
- `npx vitest run --project curriculum src/features/languages/ja` →
  **80 files passed | 2 skipped, 7286 passed | 5 skipped (7291)** — exact
  match to the stated baseline; the dedupe-key/cue-prefix changes are fully
  behavior-preserving for English.
- `npx vitest run --project app src/features/lesson src/shared/i18n` →
  **1 failed, 1213 passed | 17 skipped (1231)**; the 1 failure is the same
  pre-existing `m40` diagnostics case above. All step-view wiring tests and
  the new `useContentString.test.tsx` / `stripRegisterCue.test.ts` pass.
- `node scripts/i18n/extract-content-catalog.mjs ja m6 --check` →
  **335 fresh, 0 stale, 0 missing.**

---

## 6. Files touched this rung

- `src/features/lesson/data/moduleCompiler.ts` — §1 (dedupe key,
  `stripRegisterCue` export).
- `src/features/lesson/data/moduleCompiler.stripRegisterCue.test.ts` (new).
- `src/features/lesson/hooks/useContentString.ts` (new, landed earlier this
  rung — call-site wrapper hooks).
- `src/features/lesson/hooks/useContentString.test.tsx` (new).
- `src/features/lesson/components/StepRenderer.tsx`,
  `InfoStepView.tsx`, `MultipleChoiceStepView.tsx`, `BuildSentenceStepView.tsx`,
  `FillBlankStepView.tsx`, `ParticleClozeStepView.tsx`, `MatchPairsStepView.tsx`,
  `PhraseCardStepView.tsx`, `GrammarRuleStepView.tsx` — §2 wiring.
- `src/shared/i18n/content/resolveContentString.ts` — docstring updates only
  (logic unchanged from rung 1a); `anchors.ts` / `anchors.test.ts` (rung 1a
  artifacts, unchanged this rung).
- `scripts/i18n/mt-translate-catalog.mjs` (new) — §4 MT-wave drafter.
- `src/shared/i18n/content/ja/m6.ko.json` (new) — §4 pilot draft output,
  335 entries, NOT yet Sonnet-reviewed or Payton-sampled (see §7).
- This doc.

Not touched, not mine (concurrent lanes visible in `git status` in the
shared worktree): `scripts/i18n/extract-content-catalog.mjs` (modified by
another session — likely the explanation-anchor fix noted in rung 1a's own
changelog), `src/features/languages/es/__tests__/moduleBarGuards.ts`,
`src/features/languages/es/curriculum/es-quality.test.ts`,
`src/features/languages/fr/__tests__/frSpeechNegation.test.ts`.

---

## 7. Exact next steps

1. **Sonnet fidelity review of `m6.ko.json`** (rung 1a §4 step 4): check
   translation fidelity, normalize the register inconsistency and the
   "Build:"/"빌드:" vs "만들기:" split noted in §4, spot-check for any
   Inv-8-family answer-leak. Do this BEFORE treating the sidecar as
   ship-ready — it is a draft, not reviewed content.
2. **Payton sample** (rung 1a §4 step 5): route every `gp:`- and
   `ja:`-anchored entry (136 of 335 — the highest-leverage grammar prose and
   sentence prompts) plus a spot-check of `atom:`/`en:` entries through the
   existing KO QA walk protocol (`docs/ko-handoff-payton-2026-09-09.md`)
   before shipping.
3. **Extend the MT wave to the rest of m1–m8** using
   `scripts/i18n/mt-translate-catalog.mjs` as-is (already handles batching/
   retry/verification generically per module) — run extractor + drafter +
   `--check` per module, same recipe as §4, budgeting ~6–7 min of local
   model time per ~300-anchor module.
4. **Story-mode extraction** — deferred per §3; revisit once m1–m8
   step-shaped content is translated/reviewed, scoped to m3 + m7 only.
5. Once `m6.ko.json` (and later modules) pass Sonnet review + the Payton
   sample, the runtime wiring in §2 needs no further code changes — it
   already picks up any `<moduleId>.ko.json` sidecar automatically via the
   `import.meta.glob` in `resolveContentString.ts`.
