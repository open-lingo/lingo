# KO-source learner program — rung 1a (2026-09-10)

**Status:** LANDED (this slice), uncommitted in worktree `ja-wave1`.
**Scope:** rung 1 of `docs/ko-source-learner-scope-2026-09-10.md` — "KO→JA
pilot, m1–m8" — narrowed per the launch brief to rung **1a**: de-couple the
three grading paths that assume the instruction language is English, stand
up the content-extraction pipeline, and land an unwired runtime-lookup stub.
Wiring those into step views (rung 1b) and running the actual MT wave are
both explicitly NOT done here.

Read first: `docs/reverse-teaching-readiness-2026-07-29.md` (§1.E = the four
English-shape grading couplings, §3c = the anchor schema this rung
implements, §4 = authoring discipline, §5 = the ko→ja sketch),
`docs/ko-source-rung0-2026-09-10.md`, `docs/ko-source-learner-scope-2026-09-10.md`.

---

## 1. What landed

### 1a. Three of the four grading de-couplings

§1.E named four places where JA grading logic infers something from the
*shape* of the English gloss rather than from structured atom data — which
silently breaks the moment `meaningEn` holds Korean instead of English. Three
are fixed here (behaviour-preserving for English, each with a new test
proving a Korean gloss no longer corrupts the result). The fourth
(`moduleCompiler.ts` dedupe key) is off-limits this rung — described in §3
below instead.

| # | File | Old rule | New rule |
|---|---|---|---|
| 1 | `src/features/languages/ja/jaAcceptedForms.ts` (`NOMINALS` set, ~line 185) | `!/^to /i.test(a.meaningEn)` — "doesn't start with the English verb-gloss shape" | `a.pos !== "verb"` — reads the atom's own `pos` field |
| 2 | `src/features/lesson/data/matchPairsFloor.ts` (`matchGridShape`, JA `buildMeaningFill`) | `/[a-zA-Z]/.test(target \| meaningEn)` — "is this English" spelled as a Latin-script test | new `isGlossText(s)` helper: `/\p{L}/u.test(s) && !/[぀-ヿ一-鿿]/.test(s)` — any instruction-language letters, zero JA script |
| 3 | `src/features/languages/ja/jaSurfaceForms.ts` (~line 91) | Latin-script gloss check gating verb-group resolution | script-agnostic per the same `isGlossText` shape (landed in the prior session; unchanged, re-verified this session) |

**Regression each guards against:** under the old rule #1, a て-form verb
atom given a Korean gloss (which never starts with English "to ") got swept
into `NOMINALS` and offered a copula it can't grammatically carry. Under the
old rule #2, EVERY Korean-glossed meaning-grid target silently misclassified
as `"other"` and dropped out of the match-pairs floor pad (`docs/reverse-
teaching-readiness-2026-07-29.md` §1.E.2) — a JA-target course authored with
Korean glosses (the actual KO→JA pilot) would have every meaning grid under
6 pairs.

**Deliberately left alone (documented, not silently skipped):** the ES leg
of `matchPairsFloor.ts` (`buildEsMeaningFill`, `/[a-zA-Z]/.test(a.gloss)`) —
ES's instruction language is structurally fixed to English and out of this
rung's scope, so it stays Latin-script-keyed with an inline comment
explaining why, rather than being converted to `isGlossText` for a course
this task doesn't touch.

**Files touched:**
- `src/features/languages/ja/jaAcceptedForms.ts` — already landed prior
  session; re-verified this session (no new edits).
- `src/features/languages/ja/jaAcceptedForms.test.ts` — new `describe`
  block, 2 tests (vi.doMock-injected synthetic Korean-glossed atoms).
- `src/features/lesson/data/matchPairsFloor.ts` — new `isGlossText` helper;
  `matchGridShape` and the JA `buildMeaningFill` filter switched to it; ES
  leg left Latin-keyed with a documenting comment.
- `src/features/lesson/data/matchPairsFloorDispatch.test.ts` — new
  `describe` block, 6 tests.
- `src/features/languages/ja/jaSurfaceForms.ts` /
  `jaSurfaceForms.test.ts` — landed prior session, re-verified this
  session, no new edits.

### 1b. Content-catalog extraction pipeline

`scripts/i18n/extract-content-catalog.mjs <lang> <moduleId> [--check] [--out <dir>]`
(lang is currently wired for `"ja"` only — a clear error for anything else,
not a silent empty catalog).

Boots the app's own compiled-content machinery via Vite SSR
(`server.ssrLoadModule`), mirroring `scripts/restamp-from-module.mjs`'s
boot-shim pattern (in-memory `localStorage`/`window`/`document`/`navigator`
shims + `createServer({ middlewareMode: true, appType: "custom" })`), then
walks:
- `JA_COURSE_ATOMS.filter(a => a.fromModule === moduleId)` directly, for
  atom glosses (`meaningEn`, `shortGloss`).
- Every lesson in the module (`getMockCourse("ja").modules.find(...)`, its
  `.lessons[]` + `.lessonGroups[].lessons[]`), through
  `getMockLessonContent(lessonId)` — the fully-compiled, post-pad,
  post-kanji-surface `LessonContent`. This is deliberately the SAME shape
  for hand-authored (m3) and IR-compiled (m6, m7) modules, so one walker
  covers both without touching `moduleCompiler.ts` or parsing IR YAML.
- Per step: `StepBase` fields (`hint`, `explanation`), `prompt` (anchored to
  the step's JA sentence when one is present, else an en-hash fallback),
  `body`/`cultureNote`/`title`, `grammar_rule`-specific fields (`rule`,
  `examples[].en`, `antiPattern.en`/`.why`), MCQ `options[].text`, and
  `match_pairs` `pairs[].target` (kana/romaji targets are excluded by the
  `isGlossText` guard on every extracted string, so a Korean OR English
  meaning target is captured but a kana/romaji one never is).

**Anchor priority**, per §3c: grammar-point anchors (`m<N>/gp:<id>/rule`,
`/ex:<ja>`, `/antipattern`, `/antipattern-why`) → JA-surface anchors
(`m<N>/<lessonId>/ja:<ja-surface>`, when a sibling `targetSentence` /
`correctKana` / `audioText` / `ja` field is present) → atom-gloss anchors
(`m<N>/atom:<kana>/gloss`) → en-hash fallback (`m<N>/<lessonId>/en:<hash>`).
An anchor collision (same key, different English) logs a warning rather than
silently keeping one.

Output: `src/shared/i18n/content/<lang>/<moduleId>.en.json`, shape
`{ schema, moduleId, lang, generatedAt, entryCount, entries: [{anchor, en, enSourceHash}] }`,
sorted by anchor for a stable diff. `--check` compares against a sibling
`<moduleId>.ko.json` (if present) purely by `enSourceHash`, reporting
fresh/stale/missing counts and the list of stale anchors — verified against
a synthetic `m6.ko.json` this session (167 fresh / 83 stale / 85 missing
over a 50/25/25 split, matching expectations exactly) and confirmed
`--check` never writes the `.en.json` file.

**Counts (this session's actual run, `src/shared/i18n/content/ja/`):**

| module | kind | anchors | atom | grammar-point | ja-surface | en-hash |
|---|---|---|---|---|---|---|
| m3 | hand-TS | **256** | 17 | 12 | 33 | 194 |
| m6 | IR | **335** | 29 | 38 | 98 | 170 |
| m7 | IR | **340** | 34 | 24 | 108 | 174 |

All anchors unique within each module (verified programmatically); two
consecutive runs on m6 produced byte-identical output modulo `generatedAt`
(determinism verified both via a throwaway script and via the shipped test).

**Known limitation (by design, not an oversight):** this is a targeted
field-name allowlist, not an exhaustive walk of all ~40 step types in
`src/features/lesson/types.ts` — it covers the field shapes named in the
brief (atom glosses, prompts/hints/explanations, MCQ option text,
match-pairs meaning targets, grammar-rule prose, titles). A step type with a
bespoke English-bearing field outside that list (e.g. a novel step's custom
label) extracts nothing for that field until the allowlist is extended.
Also out of scope: "story mode" reading content (lesson ids prefixed
`story:ja-m<N>-*` in `mockCourse.ts`, e.g. `story:ja-m6-...`) is loaded
through a different content path than `getMockLessonContent` and is skipped
with a warning rather than extracted — confirmed during the m6/m7/m3 runs
(each logged one `getMockLessonContent("story:...") returned null` line).
Rung 1b or a follow-up should decide whether story content needs its own
extraction path before the MT wave, since it's real learner-facing English
text this catalog currently misses.

**Test:** `scripts/i18n/extract-content-catalog.test.mjs` (`node:test`,
run via `node scripts/i18n/extract-content-catalog.test.mjs` — mirrors the
existing `scripts/**/*.test.mjs` convention; these aren't wired into any
`npm test` script today, same as the pre-existing ones in
`scripts/doc-hygiene/` and `scripts/emoji-refit/`). Spawns the real CLI
against a scratch `--out` dir (an integration test, not a mock — the
extractor's entire job is walking real compiled course data, so a mocked
unit test would just test the mock). Asserts: m6's catalog is non-empty,
every anchor unique, every entry has non-empty `en` and a well-formed
16-hex-char hash, two runs are byte-identical (minus `generatedAt`), and
`--check` reports correctly without mutating the `.en.json`. **2/2 passing.**

### 1c. Runtime lookup stub

`src/shared/i18n/content/resolveContentString.ts` — pure function
`resolveContentString(lang, anchor, enText, uiLocale)`:
- `uiLocale === "en"` short-circuits to `enText`.
- Otherwise looks up `./<lang>/<moduleId>.<uiLocale>.json` (moduleId parsed
  from the anchor's leading `m<N>/` segment) among catalogs loaded via
  `import.meta.glob(["./*/*.json", "!./*/*.en.json"], { eager: true })` —
  the same static-bundling pattern `courseAtoms.ts`/`placementBank.ts` use,
  so this is a real lookup table at call time, not I/O.
- Returns the translated `text` only when the catalog entry's
  `enSourceHash` matches `sha256Hex16(enText)` (reusing the existing
  browser-safe SHA-256 at `src/shared/tts/sha256.ts` — confirmed
  byte-identical to Node's `crypto.createHash("sha256")` output this
  session) — i.e. only when fresh. Stale or missing → falls back to
  `enText`.

The core lookup is factored out as `resolveContentStringFromCatalogs(catalogs, ...)`
so it's testable without needing a real `*.ko.json` fixture on disk (none
exist yet — the MT wave hasn't run). `resolveContentString` itself is just
that function bound to the real glob. **NOT wired into any step view.**

**Test:** `src/shared/i18n/content/resolveContentString.test.ts`
(vitest, `app` project) — 10 tests: en-short-circuit, fresh lookup, no
catalog, catalog-without-entry, stale hash, malformed anchor, lang+moduleId
keying, a non-Latin `text` round-trip (checked: this function makes no
script assumption anywhere, unlike the three grading de-couplings above —
it only ever compares hashes), plus two pinning the production wrapper's
current (expected) always-falls-back-to-English behaviour. **10/10 passing.**

**Rung 1b wiring plan** (also documented inline at the bottom of
`resolveContentString.ts`) — step views that would call
`resolveContentString(languageId, anchor, raw, uiLocale)` once a translated
catalog exists:
- `MultipleChoiceStep.tsx` — `prompt`, each `option.text`.
- `GrammarRuleStep.tsx` — `title`, `rule`, `examples[].en`,
  `antiPattern.en`/`.why`, `cultureNote`.
- `InfoStep.tsx` — `title`, `body`.
- `MatchPairsStep.tsx` — meaning-grid `pair.target` only (romaji-grid
  targets stay untranslated by design — same split `matchGridShape` makes).
- Any vocab-intro / flashcard-reviewer / atom-tooltip surface rendering
  `atom.meaningEn` / `atom.shortGloss` — anchor `m<N>/atom:<kana>/gloss`.
- `BuildSentenceStep.tsx`, `FillBlankStep.tsx`, `ParticleClozeStep.tsx`,
  and the other `prompt`-bearing step components — same treatment as MCQ.
- Suggested (not built): a shared `useContentString(languageId, anchor, enText)`
  hook reading `uiLocale` from the existing `useTranslation()` i18next
  instance, so individual step components don't each re-derive `uiLocale`.

---

## 2. The exact `moduleCompiler.ts` change still needed (described, not made)

`moduleCompiler.ts` is off-limits this rung (concurrent JA authoring lanes).
Both items below were re-verified by reading the file THIS session — line
numbers have drifted from the July audit's `:1578,1613` and `:887-888,1039`
(the file has grown to 2,374 lines since then); the numbers below are
current as of 2026-09-10.

**(a) Dedupe key on `meaningEn`, not an anchor** — `moduleCompiler.ts:1953-1954`:

```ts
const usedKey = (tag: string, a: Atom) =>
  `${tag}:${a.kana}|${tag}g:${a.meaningEn}`;
```

This is the fix for the exact bug it was written to catch (この/その both
rendering as `"Pick the word for 'that'"`) — but it works by hashing the
ENGLISH gloss text, which means a KO-glossed course dedupes on Korean
strings coincidentally, and any future re-gloss of an atom's `meaningEn`
silently changes what counts as a duplicate. The fix: key on the atom's own
identity/anchor instead of its rendered gloss —
`` `${tag}:${a.kana}|${tag}g:${a.id ?? a.kana}` `` (or, if two atoms can
share a kana with different ids, whatever atom-identity field already
disambiguates them elsewhere in this file) — so dedup no longer depends on
what language `meaningEn` happens to be in.

**(b) Cue-prefix stripped via an English-word regex** — `moduleCompiler.ts:1137-1138`:

```ts
const meaningOf = (en: string): string =>
  en.replace(/^(?:Say|Ask|Answer|Reply|Tell)\b[^:]{0,40}:\s*/i, "").trim() || en;
```

This strips a register-cue prefix ("Say politely: …") before re-presenting
a sentence's MEANING in filler content (see the doc comment at
`moduleCompiler.ts:1123-1136` for the full "Inv 8" rationale). The regex is
English-word-keyed, so a Korean cue ("정중하게 말해요: …" or whatever the
KO-source authoring convention turns out to be) would pass straight through
un-stripped into a "what does this mean?" filler item — the same
giveaway-answer bug Inv 8 was written to prevent, just for KO instead of EN.
The July audit's recommended fix (§3, "one-time schema hardening" list)
still stands: promote the cue out of the `en` string into a structured
`cue?: string` field on whatever authors a beat's prompt, so `meaningOf`
becomes `beat.en` unconditionally and needs no language-specific stripping
at all. This is a schema change (touches the IR + the beat-authoring
helpers), not a one-line regex swap — bigger than (a), and probably belongs
in the same pass as the dedupe-key fix since both touch the same function's
neighborhood.

---

## 3. Rung 1b (next slice, not started)

1. Wire `resolveContentString` into the step views listed in §1c, behind a
   `useContentString` hook.
2. Make the two `moduleCompiler.ts` changes in §2 (needs the JA authoring
   lanes quiet first — currently m41 is in flight).
3. Extend the extractor's field allowlist to cover story-mode content (§1b
   limitation) if story content is in the KO pilot's scope for m1–m8.
4. Run the MT wave (§4) to actually populate `<moduleId>.ko.json` sidecars
   for m3/m6/m7, then re-run `--check` to confirm nothing's stale, then wire.

---

## 4. MT-wave recipe (for populating the `.ko.json` sidecars)

Grounded in the local-model-stack memory doc (`local-model-stack.md`,
verified working end-to-end 2026-09-02) and this repo's existing generator/
judge doctrine (`docs/handoff-*`, the ES/JA drafting pipeline under
`scripts/draft/`).

1. **Drafter:** `claude-local judge` (= `qwen3.5:122b-a10b-q4_K_M`, 81 GB,
   **non-MLX tag pinned explicitly** — Ollama's `-mlx` variant silently
   ignores the `format` JSON schema and returns prose with a 200, per the
   `ollama/ollama#16563` trap noted in the memory doc; asserting the
   response actually parses is the cheap guard). Feed it the extracted
   `.en.json` catalog entries in batches scoped to one module, translate
   `en → ko` per entry, `format` schema `{anchor, text}[]` keyed to the
   input anchors so nothing can drift out of order.
2. **Category lists go in the PROMPT, not just the schema.** The
   memory doc's 08-20 finding (enum-only labeling made the 122B emit
   consecutive-run garbage; stating categories in prose fixed 81→25
   errors) generalizes directly here: don't rely on a JSON-schema `enum`
   alone to keep the model inside JA-pedagogy conventions (particle
   glosses, honorific register, grammar-point terminology) — state the
   relevant category/register list in the prompt text itself.
3. **Pin the tag, assert the parse, set `think: false` + `num_predict`
   headroom** (~3500, per the memory doc's empty-content trap on this exact
   model) and `num_ctx` explicitly (Ollama defaults to 4096 regardless of
   the model's advertised context).
4. **Frontier review, one module at a time:** a Sonnet subagent reviews
   each module's draft `.ko.json` against its `.en.json` source before it's
   considered a candidate sidecar — mirrors this repo's existing
   local-drafts/frontier-verifies split (`local-model-stack.md`'s
   "spend judgment on the inventory, never the output" framing, and the KO
   course's own R1–R4 re-author doctrine). Sonnet checks: translation
   fidelity, register consistency (the ko instruction text needs to read as
   natural KO prose to a Korean learner, not machine-literal), and that no
   entry silently reveals the JA answer it's meant to be asking about
   (the same Inv-8-family leak class as the cue-prefix issue in §2b).
5. **Payton sample:** per `docs/ko-handoff-payton-2026-09-09.md`'s existing
   role as the KO QA tester, route a sample of the reviewed `.ko.json`
   sidecars (suggest: every `gp:` and `ja:`-anchored entry, since those are
   the highest-leverage/highest-risk — grammar prose and sentence prompts —
   vs. a spot-check of `atom:`/`en:` entries) through the same walk
   protocol already used for KO course QA before any sidecar is treated as
   ship-ready.
6. **Then, and only then:** run `--check` against each `.ko.json` to
   confirm 100% fresh, and proceed to rung 1b wiring.

---

## 5. Gates (this session, all foreground, no thresholds loosened)

- `npx vitest run --project curriculum src/features/languages/ja/jaAcceptedForms.test.ts src/features/languages/ja/jaSurfaceForms.test.ts` → **77 passed (77)**.
- `npx vitest run src/features/lesson/data/matchPairsFloorDispatch.test.ts src/features/lesson/data/matchPairsPairCount.test.ts src/features/lesson/data/matchPairsWordOnly.test.ts` (note: `app` project, not `curriculum` — these live under `src/features/lesson/data/`) → **19 passed (19)**.
- `npx vitest run src/shared/i18n/content/resolveContentString.test.ts` → **10 passed (10)**.
- `node scripts/i18n/extract-content-catalog.test.mjs` → **2 passed (2)**.
- `npx vitest run --project curriculum src/features/languages/ja` → **1 failed, 7285 passed, 5 skipped (7291)** — identical to the pre-existing baseline both before and after this session's changes; the one failure
  (`applyKanjiSurfaces.test.ts` — TTS manifest coverage for `kazaru`/`kabe`/`tana`) traces to `fromModule: "m41"` atoms in `courseAtoms.ts`, i.e. belongs to the concurrently in-flight "Author JA m41" lane, not this work.
- `npx tsc --noEmit` → clean.

---

## 6. What remains

- Rung 1b: wiring (§3.1), the two `moduleCompiler.ts` changes (§3.2, needs
  JA lanes quiet), story-mode extraction coverage decision (§3.3).
- The actual MT wave (§4) — no `.ko.json` sidecar exists anywhere yet; this
  rung intentionally ships the pipeline and the (always-English-fallback)
  runtime stub ahead of any translated content, so both are safe to land
  now and exercised for real the moment translation lands.
- Sibling-parity note (per CLAUDE.md's "always" checklist): this rung
  touches only the `ja` course. `es`/`fr`/`ko` are unaffected — `ko` isn't
  itself a KO-source learner course in this codebase (it's an English-
  instruction Korean-target course, the mirror image of what this program
  is building), and `es` was explicitly left Latin-keyed (§1a) as N/A for
  this rung's scope.
