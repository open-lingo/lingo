# Grammar Deck v1 Implementation Plan (2026-07-02)

> **For agentic workers:** execute task-by-task with a fresh subagent per task; coordinator reviews between tasks. Steps use checkbox (`- [ ]`) syntax for tracking. **Do NOT commit — Spencer commits on his own cadence.**

**Goal:** Ship a step-based grammar review surface on the practice page: one FSRS-scheduled item per grammar point (Track B), reviewed via interactive lesson steps (cloze / sentence-MCQ / build — NEVER flip cards), with a rotating pool of example steps per point and a machine-enforced comprehensibility gate.

**Architecture:** Data layer adds per-point authored step pools (`grammarReviewPools.ts`) merged with the existing auto-harvested index (`grammarReviewIndex.ts`); rotation is deterministic (reps-seeded). UI layer adds a `GrammarReviewSessionPage` at `/practice/grammar/review` that consumes `buildGrammarReviewQueue()` and renders steps via the existing exported `StepRenderer`, grading into Track B (`reviewGrammarPoint`). No LessonPage changes. No FlashcardsPage changes (flip cards stay vocab-only, per Spencer 2026-07-02).

**Tech Stack:** React 19 + TS strict, existing FSRS Track B (`grammarSrs.ts` — already synced to backend as of 2026-07-01), existing step views, Vitest.

## Global Constraints

- **NO git commits** — leave all changes in the working tree.
- **No flip cards for grammar, ever** ("we avoid flip cards at all cost… purely reserved for word flash cards" — Spencer 2026-07-02). Update the stale header comment in `grammarSrs.ts:6-9` to say grammar renders as interactive steps in the practice-page session (not "only in review lessons").
- **Comprehensibility gate (Spencer's authoring law):** *"if I show them this now, is it reasonable to expect they know this word based on course content?"* Machine-enforced: every pool step's sentence must decompose entirely into atoms with `fromModule` ≤ the point's module, taught conjugation endings, and punctuation (Task 1 test).
- **One scheduled SRS item per grammar point; rotate examples per review** — never one scheduled card per sentence (FSRS sibling-distortion; Bunpro model).
- Don't touch Korean (`ko-*`) content. Track B is JA-only.
- Don't modify `LessonPage.tsx` (god file) except where a task explicitly says so (no task does).
- Don't change review-lesson behavior: `buildSrsReviewLesson.ts` and `getGrammarReviewIndex()` consumers must keep working unchanged.
- New authored sentences need TTS: extend the glob in `scripts/emit-tts-deck.mjs` to match the new file, run the emit+generate pair, then **verify manifest membership** (emitter fails silent — see CLAUDE.md TTS section).
- Existing suite baseline: 187 files / 1430 tests green + `tsc -p tsconfig.app.json --noEmit` clean. Every task ends green.
- Import `grammarSrs` directly from `@/features/flashcards/engine/grammarSrs` (not re-exported from `engine/index.ts`).

## Key pre-verified interfaces (do not re-derive; recon 2026-07-02)

- `StepRenderer` (`src/features/lesson/components/StepRenderer.tsx:37`, exported): `{ step: LessonStep; onComplete: (stepId: string, correct: boolean, progressTicks?: number) => void; onContinue: () => void; isReplayRun?: boolean }`.
- `sentenceMcq()` emits `type: "multiple_choice"` (there is NO `sentence_mcq` step type); `cloze()` emits `particle_cloze`; both set `modality: "production"`. Factories in `src/features/languages/ja/grammarHelpers.ts` (`cloze` :128, `sentenceMcq` :1189, `grammarRule` :205).
- `StepBase` already carries `exercisedGrammar?: string[]` and `modality?: "recognition" | "production" | "both"` (`src/features/lesson/types.ts:36-72`).
- Track B: `buildGrammarReviewQueue(unlocked?, newPerDay?): GrammarReviewQueue` (`grammarSrs.ts:153`) → `{ review, newItems, queue: GrammarReviewItem[], dueCount, newCount, unseenTotal, newCardsAllowed }`; `GrammarReviewItem = { point: GrammarPoint, state: SRSCardState | null, dueModalities: SRSModality[], isNew: boolean }`; `reviewGrammarPoint(pointId, modality, rating, at?)` (`:94`); `getActiveGrammarPoints()` (`:122`).
- Harvested index: `getGrammarReviewIndex(): Map<string, LessonStep[]>` (`src/features/lesson/data/grammarReviewIndex.ts:154`); `getUncoveredGrammarPoints(): string[]` (`:193`).
- Grammar points: `src/features/lesson/data/n5-grammar-points.json` — `{ id, point, pointEn, category, module: "mN", status: "shipped"|"planned", notes?, dependsOn? }`, 93 entries.
- Atoms: `JA_COURSE_ATOMS` (`src/features/languages/ja/courseAtoms.ts:67`) — `{ id, kana, kanji?, romaji, meaningEn, fromModule: "m1".."m27"|"sidequest-survival"|"future", introducedByLessonId?, kind, excludeFromSrs? }`. ⚠️ `fromModule` is the truth for module ordering, NOT `introducedByLessonId`.
- Routes: practice children in `src/App.tsx:349-369`; `PracticeGrammarPage` at `src/features/practice/PracticeGrammarPage.tsx` (static hub, no SRS wiring yet — rows at `:56-93`).
- Grading precedent (`gradeFromLesson`, `srs.ts:212`): wrong → `again`; correct-after-retry → `hard`; correct first try → `good`.
- Rating type: `SRSRating = "again" | "hard" | "good" | "easy"`; `SRSModality = "recognition" | "production"`.

---

### Task 1: Pool data layer + comprehensibility gate

**Files:**
- Create: `src/features/lesson/data/grammarReviewPools.ts`
- Create: `src/features/lesson/data/grammarReviewPools.test.ts`
- Modify: `src/features/lesson/types.ts` (add `grammarPointId?: string` to `GrammarRuleStep`, ~line 399-409)
- Modify: `src/features/languages/ja/grammarHelpers.ts` (`grammarRule()` factory ~:205 — accept + pass through `grammarPointId`)

**Interfaces produced (Tasks 2 & 3 depend on these exact names):**
```ts
// grammarReviewPools.ts
/** Authored per-point pools. Key = grammar point id. Steps MUST set
 *  exercisedGrammar: [pointId] and a unique id `ja-gpool-<pointId>-<n>`. */
export const AUTHORED_GRAMMAR_POOLS: Readonly<Record<string, LessonStep[]>>;

/** Authored pool ∪ harvested index (getGrammarReviewIndex), deduped by step id. */
export function getGrammarPool(pointId: string): LessonStep[];

/** Deterministic rotation: pool[(recognition.reps + production.reps) % pool.length].
 *  state === null → pool[0]. Returns null for empty pool. NO Date.now()/Math.random(). */
export function pickPoolStep(pointId: string, state: SRSCardState | null): LessonStep | null;

/** Memoized scan of all JA mockLessons for a grammar_rule step whose
 *  grammarPointId === pointId (model the memoized-index pattern on
 *  getGrammarReviewIndex). Used to show the rule before a point's FIRST review. */
export function getGrammarRuleStepForPoint(pointId: string): GrammarRuleStep | null;

/** Points needing authored pools: shipped, module ≤ m27, getGrammarPool().length < MIN_POOL_SIZE. */
export const MIN_POOL_SIZE = 3;
export function pointsBelowMinPool(): string[];
```

**Steps:**

- [ ] **1.1 Write failing tests first** (`grammarReviewPools.test.ts`):
  - `pickPoolStep` rotation: fabricate a 3-step pool point (use a particle point with ≥3 harvested clozes, e.g. `wa-topic`), fabricate `SRSCardState`s with reps sums 0/1/2/3 → indices 0/1/2/0. Null state → index 0. Determinism: two calls, same inputs, same step.
  - `getGrammarPool` merges + dedupes: a point present in both authored and harvested sources yields no duplicate step ids.
  - **Comprehensibility gate** (the load-bearing test — iterate ALL pools):
    ```ts
    const PUNCT_RE = /[。、？！?!「」・〜ー…\s0-9０-９]/g;
    // Endings/copulas the course teaches explicitly; extend ONLY with taught forms.
    const TAUGHT_ENDINGS = ["ます","ません","ました","ませんでした","です","でした",
      "じゃない","じゃありません","ください","でしょう"];
    function moduleOrder(m: string): number { const x = /^m(\d+)$/.exec(m); return x ? +x[1] : Infinity; }

    for (const point of GRAMMAR_POINTS.filter(p => p.status === "shipped")) {
      for (const step of getGrammarPool(point.id)) {
        const sentence = stepSentence(step); // helper below
        if (!sentence) continue;
        const allowed = JA_COURSE_ATOMS
          .filter(a => moduleOrder(a.fromModule) <= moduleOrder(point.module))
          .flatMap(a => [a.kana, a.kanji].filter(Boolean) as string[])
          .concat(TAUGHT_ENDINGS, [point.point])
          .sort((a, b) => b.length - a.length); // greedy longest-match
        let residual = sentence.replace(PUNCT_RE, "");
        for (const surface of allowed) residual = residual.split(surface).join("");
        expect(residual, `point ${point.id} step ${step.id}: unexplained "${residual}" in "${sentence}"`).toBe("");
      }
    }
    ```
    `stepSentence(step)`: `particle_cloze` → `prompt.before + correctParticle + prompt.after`; `multiple_choice` → `promptAudioText ?? ""` plus the correct option's text; `listening_build`/`build_sentence` → `targetSentence`. Split `/`、`、`-separated kana/kanji variants like `surfaceVariants` in `moduleConformance.test.ts:66-70` does.
  - **Pool-floor ratchet:** `pointsBelowMinPool()` must equal an explicit exemption list constant `POOL_GAP_EXEMPTIONS: string[]` declared in the test. Task 1 populates it with the current gaps (expected ≈ the `getUncoveredGrammarPoints()` set minus particle-rich points); **Task 2's exit criterion is shrinking it to `[]`**. This makes coverage a ratchet, not a hope.
  - `grammarPointId` plumbing: `grammarRule({ ..., grammarPointId: "x" })` output carries the field; `getGrammarRuleStepForPoint` finds a tagged rule from mockLessons content and returns null for untagged points.
- [ ] **1.2 Run tests, verify they fail** (`npx vitest run src/features/lesson/data/grammarReviewPools.test.ts` — fail on missing module).
- [ ] **1.3 Implement** `grammarReviewPools.ts` per the interface block (memoize `getGrammarRuleStepForPoint` index over `getAvailableMockLessonIds()`/`getMockLessonContent()` filtered to `languageId === "ja"`, skipping `-review-[12]$` lesson ids to avoid the grammarReviewIndex recursion trap). `AUTHORED_GRAMMAR_POOLS = {}` initially (Task 2 fills it). Add the `grammarPointId` field to `GrammarRuleStep` + factory.
- [ ] **1.4 Tag existing `grammarRule` cards.** ~94 `grammarRule(` call sites across `src/features/languages/ja/curriculum/m*.ts`. For each, add `grammarPointId: "<point-id>"` where the card clearly teaches one of the 93 points (match by title/rule text against `point`/`pointEn`/`notes`). **Judgment rule: when a card doesn't map cleanly to exactly one point, leave it untagged** — `getGrammarRuleStepForPoint` returning null is fine (session just skips the rule preface). Do not invent mappings. Report tagged/untagged counts.
- [ ] **1.5 Full verify:** `npx tsc -p tsconfig.app.json --noEmit` clean; `npx vitest run` — full suite green. If the comprehensibility gate fails on EXISTING harvested clozes, do not weaken the gate: report each failure — either the sentence genuinely uses too-advanced vocab (real content bug — list it for the coordinator) or `TAUGHT_ENDINGS`/tokenization needs a defensible extension (justify each addition).

### Task 2: Author pools for uncovered points (+ TTS)

**Files:**
- Modify: `src/features/lesson/data/grammarReviewPools.ts` (fill `AUTHORED_GRAMMAR_POOLS`)
- Modify: `src/features/lesson/data/grammarReviewPools.test.ts` (shrink `POOL_GAP_EXEMPTIONS` to `[]`)
- Modify: `scripts/emit-tts-deck.mjs` (add `grammarReviewPools` to the file glob; verify factory regexes match the shapes used)
- Generated: mp3s under `src/pub/tts/ja/` + `src/pub/tts/manifest.json`

**Interfaces:** consumes Task 1's `AUTHORED_GRAMMAR_POOLS` shape + gate test. Produces content only — no new APIs.

**Steps:**

- [ ] **2.1** Enumerate the gap: run `pointsBelowMinPool()` (a one-off `npx vitest run` of a temporary logging test, or a small tsx script). Expected clusters: adjective-forms, modals, demonstratives, temporal, request-permission, remaining verb-forms, counters beyond 人.
- [ ] **2.2** For each gap point, author steps to reach `MIN_POOL_SIZE = 3` (target 3-5) using existing factories, ids `ja-gpool-<pointId>-<n>`, `exercisedGrammar: [pointId]`:
  - Preferred: `cloze()` where the point has a blankable surface token (e.g. demonstratives これ/それ/あれ as the cloze answer with the other two + one more as options).
  - Otherwise `sentenceMcq()` transformation-style, modeled on `verbMasuSteps()`/`counterNinSteps()` in `grammarReviewIndex.ts:88-149` (correct form vs 3 wrong-form distractors — distractors must be WRONG FORMS of the same content, never unrelated sentences).
  - **Comprehensibility is the law:** every content word must be an atom with `fromModule` ≤ the point's module. Check `courseAtoms.ts` BEFORE writing each sentence; the Task 1 gate will fail the build otherwise. Do not add words to courseAtoms to make sentences work — pick different words.
  - Keep sentences short (4-8 tiles/tokens). New sentence per step — don't recycle one sentence across a point's pool (rotation exists to vary surface forms).
- [ ] **2.3** Shrink `POOL_GAP_EXEMPTIONS` to `[]`; gate + ratchet tests green. If a specific point genuinely cannot be exercised comprehensibly (no early-enough vocab exists), leave it in the exemption list with an inline comment explaining why, and report it.
- [ ] **2.4** TTS: add the file to the emitter glob; run `node scripts/emit-tts-deck.mjs` then `cd ../lingo-core && .venv-tts/bin/python -m scripts.tts.generate --provider edge`; **verify every new `promptAudioText`/`audioText`/`targetSentence` phrase exists in `src/pub/tts/manifest.json`** (python one-liner in CLAUDE.md TTS section). "wrote=0" without manifest verification = not done.
- [ ] **2.5** Full verify: tsc clean + full suite green.

### Task 3: Grammar review session UI + practice-page wiring

**Files:**
- Create: `src/features/practice/grammar/GrammarReviewSessionPage.tsx`
- Create: `src/features/practice/grammar/useGrammarReviewSession.ts` (session state machine — keep the page thin)
- Create: `src/features/practice/grammar/useGrammarReviewSession.test.ts`
- Modify: `src/App.tsx` (~:349 — add lazy route `{ path: "grammar/review", element: <GrammarReviewSessionPage /> }` under practice children, via `lazyRetry` like `PracticeGrammarPage` at `:99-100`)
- Modify: `src/features/practice/PracticeGrammarPage.tsx` (live "Grammar review" row + due badge, replacing/above the disabled "Soon" rows at `:56-93`)
- Modify: `src/features/flashcards/engine/grammarSrs.ts:6-9` (header comment: grammar renders as interactive steps in review lessons AND the practice-page session; still never flip cards)

**Interfaces consumed:** Task 1's `getGrammarPool` / `pickPoolStep` / `getGrammarRuleStepForPoint`; `buildGrammarReviewQueue` / `reviewGrammarPoint` from `grammarSrs.ts`; `StepRenderer` with its exact props (see pre-verified block).

**Session semantics (implement in the hook, test-first):**
- Build queue once per session mount: `buildGrammarReviewQueue()`, take `queue.slice(0, SESSION_CAP)` with `SESSION_CAP = 30`; surplus shows as "N more due" on the summary.
- Per item: resolve `pickPoolStep(point.id, state)`; skip items with null step (and report count via the hook for debugging). If `item.isNew` and `getGrammarRuleStepForPoint(point.id)` exists, show that `grammar_rule` step first (passive, `onContinue` only) — teach before test.
- Grade on the FIRST scored attempt only, `gradeFromLesson` semantics: wrong → `again`, correct-after-retry within the step → `hard`, clean correct → `good`. Modality graded = `step.modality === "recognition" ? "recognition" : "production"` (default production).
- Wrong items re-queue once at session end (replay pass, NOT re-graded — mirrors lesson replay behavior).
- Grade at continue-time via `reviewGrammarPoint(pointId, modality, rating)` — exactly once per scored item per session (guard against double-fire from onComplete re-entry).
- Summary screen: reviewed count, correct count, remaining-due count, CTA back to `langPath("practice/grammar")`.

**Steps:**

- [ ] **3.1** Write failing hook tests (`useGrammarReviewSession.test.ts`, mock `grammarSrs` + pools): session builds ≤30 items; isNew item yields rule-step preface when tagged rule exists; first-attempt-only grading (correct → good; retry → hard; wrong → again + requeued once, second pass not re-graded); exactly one `reviewGrammarPoint` call per scored item; empty queue → immediate "done" state.
- [ ] **3.2** Verify fail, implement hook, verify pass.
- [ ] **3.3** Build the page: render current step via `<StepRenderer step={s} onComplete={...} onContinue={...} />` inside the practice layout; progress indicator (i/N); summary state. Match lesson UI stability rules (bottom-anchored CTA, no layout shift on submit) — the step views already implement this; don't wrap them in anything that scrolls the window.
- [ ] **3.4** Wire `PracticeGrammarPage`: top row "Grammar review" with due badge from `buildGrammarReviewQueue().dueCount` (+ `newCount`), routing to `langPath("practice/grammar/review")`; recompute on `useSRSStoreRevision`-equivalent for the grammar store if one exists, else on mount/focus. Update the `grammarSrs.ts` header comment.
- [ ] **3.5** Full verify: tsc + full suite green. Screenshot pass with the project screenshot skill (`node scripts/shot.mjs /ja/practice/grammar` and `/ja/practice/grammar/review`, `--lang=ja`; remember `VITE_DEV_AUTH_BYPASS=true` dev server — `.auth/user.json` is expired) at default and ≤700px height.

### Task 4: Docs + ship-state sync (coordinator, inline)

- [ ] Update `CLAUDE.md` SRS invariants: grammar surfaces = review lessons + practice-page session (Track B write sites now: review lessons via LessonPage gate + `GrammarReviewSessionPage`); pool/rotation model + comprehensibility gate one-liner.
- [ ] Update `docs/PROJECT_STATE.md` (Recent section) + mark task #6 outcome; note lesson-attach tails (`withGrammarReviewTail`) as the deliberate fast-follow, NOT shipped.
- [ ] Final independent verify: tsc + full suite + both screenshots eyeballed.

## Self-review notes (done at authoring)
- Spec coverage: reviewer-type decision → Task 3 (StepRenderer, no flip cards); example-pool decision → Tasks 1-2 (tag existing via `grammarPointId` + harvested clozes; author gaps; ratchet to zero); comprehensibility → Task 1 gate + Task 2 law; one-item-per-point rotation → `pickPoolStep`; lesson-attach explicitly deferred → Task 4 doc note.
- Type consistency: `pickPoolStep(pointId, state)` naming consistent across Tasks 1/3; `MIN_POOL_SIZE`/`POOL_GAP_EXEMPTIONS` consistent across Tasks 1/2; StepRenderer props match recon verbatim.
- Known risk, accepted: the comprehensibility gate may flag existing harvested clozes (real findings, not gate bugs) — Task 1.5 routes them to the coordinator instead of silently weakening the gate.

---

## v1.1 addendum — caught-up affordances + playtest unblock (2026-07-06)

Shipped after Spencer's playtest attempt found the deck empty ("nothing for me in FSRS"). Two root causes, both fixed:

1. **Simulated profiles never fed the atom gate.** The dev panel's "Mark complete (local)" wrote lesson completions but deliberately skipped atom unlocking — and reached modules (hence active grammar points, hence the whole queue) derive from unlocked atoms, not completions. The flashcard course deck was equally invisible on simulated profiles. Fix: the panel now pairs `devMarkLessonsCompleted` with `devUnlockAtomsForLessons` (`unlockLessonAtoms.ts`) — a local-only union with NO `ATOMS_UNLOCKED_EVENT` push, so simulated unlocks never pollute the account's server backup.
2. **A genuinely caught-up learner hit a dead end.** The empty state said "come back later" with no when and no alternative.

New surface behavior:

- **Dev panel** gains "Make all grammar due" (`devForceAllGrammarDue` in `grammarSrs.ts`): both modalities of every stored Track B entry due now, bury cleared. Never-reviewed points need no forcing — they already queue as new cards.
- **Caught-up empty state** (`GrammarReviewSessionPage`) now reports when the next points fall due (`nextGrammarDue()` — earliest upcoming date + how many land on it: "You're caught up — the next 15 points fall due in 2 days") and offers **Practice anyway**. With no grammar state at all it directs to lessons instead of showing a dead button.
- **Practice sessions** (`?practice=1` → `useGrammarReviewSession({practice: true})`): the queue widens to reviewed-but-not-due points (`buildGrammarReviewQueue` opt `includeNotDue`, appended soonest-due first after due + new), and **nothing is written to Track B** in either pass — trainer learn-ahead parity; grading a session the schedule didn't ask for corrupts FSRS. Summary drops the "More due" stat and states "Practice only — nothing was scheduled for review." Badge counts (`dueCount`/`newCount`) keep their scheduled meaning everywhere.

Verified: 2689 tests green (197 files), tsc clean; screenshot pass — caught-up state (desktop + 390×700), practice session ("Grammar practice" kicker, cloze step, anchored CHECK), dev panel with both tools.

---

## v1.2 addendum — question-quality + player-parity round (2026-07-06)

Spencer's first real playtest surfaced systemic defects (full audit ran across all 463 pool steps). Fixes, by root cause:

**Question quality:**
- **Pre-answer gloss (the big one).** `ParticleClozeStepView` rendered `meaningEn` only post-submit — every semantic cloze (です/でした/じゃないです all grammatical) was a guessing game. Steps rendered via `StepRenderer surface="grammarReview"` now show the English gloss ABOVE the sentence before answering (honest EN→JA production); lessons keep the post-submit reveal (surrounding steps supply context there). Audio stays post-submit — it speaks the answer.
- **Honest instruction labels.** "Pick the particle that fits" was hardcoded; it now applies only when every option is in `PARTICLE_OPTIONS`, else "Complete the sentence" (~95 mislabeled steps fixed with zero content edits).
- **Category eviction.** `NON_REVIEWABLE_CATEGORIES = {number, counter}` filters `getActiveGrammarPoints` — 13 points (numbers, counters, family-register) out of Track B everywhere (deck, badge, review lessons). Their authored steps stay in the pools file as Counters-Trainer material.
- **Harvest attribution window.** `grammarReviewIndex` attributed clozes token→first-shipped-point, contaminating pools (kara-origin held kara-time/-because/て-から; imasu was 100% て-います). Harvested steps now attribute only within `[point.module, point.module+2]` (`HARVEST_WINDOW_MODULES`). Pools 463→355 steps; biggest shrinks kara-origin 22→3, ni-location 46→19, ga-existence 37→12, to-and 25→9; masu-negative emptied (already POOL_GAP-exempt — the Conjugation Trainer is its surface); imasu got an authored replacement trio (ja-gpool-imasu-1..3, TTS generated). 110 stale GATE_EXEMPTIONS entries ratcheted out.
- **Twin-stem dedup.** janai-desu authored stems (がくせい/みず) collided with desu-copula's with opposite answers → now ねこ/ほん (TTS generated).

**Player parity (vs the lesson player):** X-out exit; standard `LessonProgressBar` + explicit count (review queues keep counts); combo/sfx juice via `reportGradedAnswer`/`resetLessonJuice`; per-step focus management; desktop keyboard-hint row; "Review · N left" replay banner; breadcrumbs suppressed (`PracticeLayout`) and shell height matched to lessons; option tiles flex-wrap with `whitespace-nowrap` + length-stepped type (no more mid-word じゃないで/す breaks) — this also applies in lessons.
- **Compact rule refresher.** `GrammarRuleStepView variant="compact"` (deck prefaces only): small pane, title + rule + first example; lessons keep the full hero card.
- **Backlog transparency.** Summary now shows "N more new points waiting behind today's intake" + a **Keep going** button (remounts a fresh session). NB: the "per-day" new-card cap has no daily ledger on either track — it is effectively per-session; a real ledger is an open design decision.

**Romaji word-grouping (app-wide, M3+ learners):** `romajiLexicon.ts` (authored word romaji from 750 course atoms + function words; cost-based segmentation — greedy mis-parsed ねこはいぬです via はい) + `WordToken` in `AnnotatedText` → one grouped ruby ("gakusei") instead of per-glyph "ga ku se i". Kana-phase (M1–M2) keeps per-kana deliberately; particles and unknown conjugations stay per-kana; kana-mastery exposure counters still tick per symbol.

Verified: tsc clean, **198 files / 2704 tests green**; TTS emit+generate run (wrote=5, manifest-verified); screenshot pass (compact rule card, glossed cloze desktop+mobile, backlog summary). Open decisions logged in the session's non-fix list (family-register recategorization, particle-ruby readings, double-romaji dedupe, daily intake ledger, は-option curation, parenthetical cleanup).
