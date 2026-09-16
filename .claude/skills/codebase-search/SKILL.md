---
name: codebase-search
description: How to find things in the Open Lingo repo and prove you found the right thing. Read BEFORE grepping blind, before editing a file you located from a screenshot, and before touching anything that might be generated. Covers the code index (CODE_MAP / INDEX / embed CLI), the "prove this file renders that screenshot" rule, the generated artifacts that must never be hand-edited, and the landmines that make the obvious file the wrong one.
---

# Finding code in Open Lingo

Two failure modes cost whole lanes: grepping blind in a 160-doc, 2,000-file repo,
and editing a file that turned out not to be the one in the screenshot. The #165
lane built a shared `ListenPromptHeader` for the listening views — the screenshot
was the **speaking** step's prompt card, so the entire lane missed. #163 was
triaged as content and was app code. Locating is half the work; proving you
located correctly is the other half.

---

## 1. Start from the maps, then grep

**Don't grep `docs/` blind** — roughly half of the ~160 markdown files are stale
or archival, and most (not all) self-flag it.

| You need | Go to |
|---|---|
| Which doc answers a question; which docs are authoritative vs stale | `docs/INDEX.md` — question→doc table, plus the precedence order when docs disagree |
| Which file defines a symbol | `docs/CODE_MAP.md` — `grep -n "<symbolName>" docs/CODE_MAP.md` returns the `### <path>` block it lives under |
| Code health: god-files, orphans, drift | `artifacts/code-index/REPORT.md` + `LEDGER.md` |
| "Where's the code about X" when you don't know the symbol | `node scripts/code-index/embed/embed-cli.mjs query "<text>" [--k 8]` |

Refresh the map when it looks stale:

```bash
node scripts/code-index/repo-map-cli.mjs      # CODE_MAP.md only (~2s cold)
node scripts/code-index/index-job.mjs         # CODE_MAP + REPORT + LEDGER
```

`docs/CODE_MAP.md` is a flat list of `### <path>` headers each followed by its
symbols, ranked by dependency centrality — not a tree, not alphabetical. Its
banner says `do not hand-edit`; regenerate it instead.

**`docs/INDEX.md` is hand-maintained prose**, despite its banner. Nothing
generates its body; `scripts/doc-hygiene/index-audit.mjs` only audits it for dead
links and unlisted docs. If you learn something INDEX.md gets wrong, fix the line.

**The doctrine: the index feeds grep, it never replaces it.** The embedding layer
proposes candidates; `rg` and reading confirm. A semantic hit is not evidence.
Precise grep and read stay primary.

---

## 2. Prove the file before you edit it

Before changing a file you located from a screenshot or a complaint:

1. **Deep-link to the exact step and look.** `?step=N` is **0-indexed**. Review
   lessons carry a dynamic prefix, so the static index shifts — walk `?step=0…N`
   and build the step map rather than counting from the YAML.
   `?trace-gate=0` bypasses the trace gate.
2. **Confirm the component actually mounts there.** `grep` the step type back to
   its view. The b20 doc's step map for `ja-m34-neo-3` was built exactly this way,
   which is why every item in that pull has a file:line.
3. **If you cannot confirm it, say so.** #135 and #139 were both recorded as
   "hits the limits of what a single screenshot can diagnose" and left for a live
   re-walk. That is the correct outcome, not a guess.

## 3. Look for the second copy

Almost every content or grading bug in this repo has a sibling in another file
that nobody backfilled:

- **Two independent leniency lists**, both stale against m11's vocab pack 2:
  `translateVariants.ts`'s `TEMPORALS` (topic-は-optional) and
  `jaAcceptedForms.ts`'s `BARE_TEMPORALS` / `isMovable()` (word-order
  scrambling). Same bug class, two files, one fix session.
- **Three unrelated kanji-surfacing mechanisms** that look like one bug:
  `particle_cloze` blanks are deliberately kana-only by design (`types.ts`,
  affecting all 559 particle-cloze beats); irregular する/くる forms never surface
  because substitution keys off the base verb's kunyomi reading, which doesn't
  survive the く→こ stem mutation; and `dialogue_sim` had no `*Annotation` field at
  all so the surfacer structurally could not reach it. **Do not batch one fix
  across them.**
- **Overlay scroll parity:** the quick-fix reactive modal diverged from
  `RuleHintCard` on one CSS rule (`overflow-y-auto`/`max-h-*`). `LessonIntro.tsx`
  and `TestRunner.tsx` are two more `fixed inset-0` overlays with the same gap.
- **Audio stop paths:** stop-on-navigate was added for lessons; test-out has its
  own `stopAllAudio()` call sites in `PlacementTestPage.tsx`. Fixing one leaves
  the other (#127).

Then name the siblings in your report — see `regression-classes` C3.

## 4. Dead code that looks alive

Grep hits are not proof the code path runs.

- `LANGUAGE_PLACEMENT_CONFIG.ja.reviewLessonRe` is
  `/^ja-m\d+-review-[12]$/`, but live review lessons are named
  `ja-m32-neo-review-1`. **The regex matches nothing**, so the "leave review
  lessons available after a test-out" intent is dead and all 124 review lessons
  auto-complete. `getCurrentModuleIndex` (`moduleProgress.ts`) also does not filter
  review lessons while `getModuleStatus` does — reviving one without the other
  snaps "YOU ARE HERE" back to m1.
- Tailwind `min-[…]` / `max-[…]` arbitrary variants **emit nothing** under this
  repo's `screens` config. They are dead utilities that read as live CSS.
- Grepping compiled source for a literal can return 0 while the runtime value
  exists via a helper — `particle_cloze` is produced by `cloze()` in
  `grammarHelpers.ts`. Probe the runtime value, not the source text.
- The `_archive/` courses are imported by nothing. Never reference them from a
  live path, and never cite them as current behaviour.

## 5. Id and shape landmines

- **m2's row lessons carry `ja-m1-*` ids** (historical). Never infer module
  membership from an id prefix — use the course map. `parseModuleIndex` must accept
  a bare `moduleId`.
- **Eager `m*.ts` glob collectors swallow `mN.test.ts`.** Any glob-derived
  collector needs the negative pattern:
  `["./…/m*.ts", "!./…/m*.test.ts"]` — applied in `curriculum/index.ts`,
  `courseAtoms.ts`, `placementBank.ts`. The symptom is an undefined collection
  ("Cannot read properties of undefined") that looks flaky because it depends on
  which file is the vitest entry.
- **Atom `introducedByLessonId` suppresses the module-fallback unlock path**
  (`lessonAtomIndex.ts`). Before re-pointing an atom, check nothing relied on the
  fallback.
- **`LessonPage` is a god file** — split before lesson-flow changes. Files past
  ~400 LOC are a smell; the god-file list is in the code-index REPORT.
- **Runtime bank ≠ source bank.** `padBuildTileFloor` adds prior-vocab distractor
  tiles at runtime, seeded on step id. Anything checked at author time (an
  `alsoAccepted` alternate, a bespoke pin) must be checked against **source**
  tiles.

## 6. Never hand-edit a generated artifact

Edit the source and regenerate. Every one of these has been hand-edited or read
while stale at least once:

| Generated | Source / regenerate with |
|---|---|
| `src/features/languages/ja/curriculum/ir/mN.ir.json` | `mN.ir.yaml` → `node scripts/compile-ir.mjs mN` |
| ES/FR `curriculum/mN.ts` | `mN.ir.yaml` → `node scripts/compile-ir-es.mjs mN` / `compile-ir-fr.mjs mN` |
| `src/pub/content/v1/**` (gitignored, 13 MB) | `npm run content:emit` |
| `es|fr/curriculum/structure.generated.json`, `ja/curriculum/taughtVocab.generated.json`, `es/curriculum/atoms.generated.json` | `npm run content:emit`; each has a stale-guard test |
| `docs/CODE_MAP.md` | `node scripts/code-index/repo-map-cli.mjs` |
| `sw.js`, `dist/`, `ios/App/App/public` | the build; `sw.js` drift in the code index is expected, ignore it |

`05635129` hand-edited compiled ES `.ts` for m4/m5/m7/m9/m10 emoji without
touching the IR; the next recompile silently reverted all of it. If you must
touch content, read `content-change` first.

**`npm run dev`, never a bare `npx vite`** — `predev` runs `content:emit`, so a
manually started vite serves stale content JSON and you will debug a ghost.

## 7. Fingerprint the served surface before diagnosing "what's live"

A complaint about live behaviour is a claim about a **built** surface, and built
surfaces go stale silently:

- `dist/`, the simulator app and the APK once all carried a current-looking entry
  hash while serving m38-era content — so a "clean boot does not reproduce"
  verdict was taken on the wrong build. **Fingerprint for the NEWEST module**
  (`/ja/learn/lessons/ja-m46-neo-1` renders?), not just the entry hash.
- `npx cap sync` copies `dist/` into `ios/App/App/public` but does **not** prune;
  stale `index-*.js` chunks accumulate (ten generations once).
- Content lives in different chunks per language: ES in the entry
  `index-*.js`, JA in the lazy `mockLessons-*.js`, the learn-map CSS in the lazy
  `TransitLearnPage-*.css`. Grepping the wrong chunk returns 0 and looks like
  absence. Fingerprint `app.openlingoapp.com` — the apex serves a different
  bundle.

## 8. Where the subsystems live

Use `CODE_MAP.md` for symbols; this is only the coarse map.

- Lesson runtime + step views: `src/features/lesson/` (`data/moduleCompiler.ts` is
  the IR→steps compiler; `dev/` holds the QA pages and `tileSizingTokens.ts`)
- Course content: `src/features/languages/{ja,ko,es,fr}/` — `curriculum/`,
  `courseAtoms.ts`, `grammarHelpers.ts`; gates in `__tests__/`
- SRS: `src/features/flashcards/engine/` (+ `srsSync.ts`, `grammarSrs.ts`)
- Placement / test-out: `src/features/placement/engine/`
  (`deriveModuleTestOut.ts`, `applyPlacement.ts`)
- Progress + sync: `src/features/learn/`, `src/shared/hooks`, `bootCache.ts`
- TTS: `src/shared/tts/` (audio itself is **not in this repo**)
- Shared UI primitives: `src/shared/components/ui/` — extend, never fork
- Mobile layout authority: `tests/mobile/` (Chromium — see `mobile-ui-verify` §1)
