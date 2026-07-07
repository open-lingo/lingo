# Conjugation Trainer v1 — implementation spec (2026-07-02)

> **For agentic workers:** execute task-by-task; each task ends with tsc + vitest green.
> Recon behind this design: `docs/conjugation-trainer-recon-2026-07-02.md` (note: recon
> missed that `/practice/conjugation` already exists — this spec upgrades it, not greenfield).

**Goal:** Turn the existing free-form conjugation drill page into a Trainer: per-conjugation-type
*learn → cheat sheet → drill* loops that are unlock-aligned with the learning path and grade into
the Track B grammar FSRS, giving 9 of the 22 pool-less grammar points a real review surface.

**Owner direction (Spencer, 2026-07-02):** "do your best… leave it mostly scaffolded and working…
as long as it goes in line with the learning path and unlocking when they learn things, the vision
is yours." Vision decisions below are final for v1; open questions in the recon doc §g stay open
for later rounds.

## Global constraints
- NO git commands (no commits/stash) — Spencer stages.
- Do NOT touch `ko-*` content or `ko.json` (other maintainer's domain).
- No flip cards; no streak/babying copy ("keep teaching, never scold").
- Comprehensibility: drill verbs/adjectives strictly from `introducedAtModule <= reachedModule`.
- Do NOT modify grammar review session files (`useGrammarReviewSession.ts`,
  `GrammarReviewSessionPage.tsx`, `grammarReviewPools.ts[x]`) — Spencer playtests them 2026-07-03.
  (`POOL_GAP_EXEMPTIONS` in the pools TEST file also stays untouched in v1 — trainer-covered
  points intentionally remain excluded from the step-pool review session; the trainer IS their
  review surface.)
- Match existing design tokens/idioms (accent/surface/border classes, Card/Button components).
- Verify per task: `npx tsc --noEmit` clean; `npx vitest run src/features/practice src/features/flashcards` green.

## Existing assets (read before coding)
- `src/features/languages/ja/conjugationTables.ts` — 88 entries: `VerbEntry` (`group: ichidan|godan|irregular`,
  `forms: Record<ConjugationForm, string>`, `introducedAtModule`), `AdjEntry` (i/na-adj, 4 forms),
  `getVerbsUpToModule`, `getAdjsUpToModule`, `CONJUGATION_FORM_LABELS`, `ADJ_FORM_LABELS`.
- `src/features/practice/ConjugationPracticePage.tsx` — MCQ drill with distractor generation
  (same-verb-wrong-form + same-form-other-verb), `useCourseLevel()` for reached module,
  `recordPracticeResult`/`pickWeighted` (practiceStats) weighting. KEEP this drill engine.
- `src/features/flashcards/engine/grammarSrs.ts` — Track B: `GrammarPoint` (`id`, `module: "mN"`,
  `category`…), `reviewGrammarPoint(pointId, modality, rating)`, `getGrammarCardState(pointId)`.
- `src/features/lesson/data/grammarReviewPools.ts` — `getGrammarRuleStepForPoint(pointId)` returns
  the curriculum's tagged `grammar_rule` step for a point (teach content = curriculum voice, reuse it).
- `src/features/lesson/components/steps/GrammarRuleStepView.tsx` — renders a grammar_rule step.
- Route: `{ path: "conjugation" }` under practice in `src/App.tsx` already exists.

## Type registry (the vision, fixed for v1)

Six trainer types covering 9 grammar points (ids are `POOL_GAP_EXEMPTIONS` members):

| trainer type id | title | category | drilled forms | grammarPointIds |
|---|---|---|---|---|
| `te-form` | て-form | verb | `["te"]` | `["te-form"]` |
| `ta-form` | Plain past (た) | verb | `["ta"]` | `["ta-form"]` |
| `nai-form` | Plain negative (ない) | verb | `["nai"]` | `["nai-form"]` |
| `masu-negative` | Polite negatives | verb | `["masu-neg","masu-past-neg"]` | `["masu-negative","masu-past-negative"]` |
| `v-tai` | Want to (たい) | verb | `["tai"]` | `["v-tai"]` |
| `i-adj-forms` | い-adjective forms | i-adj | `["negative","past","past-negative"]` | `["i-adj-negative","i-adj-past","i-adj-past-negative"]` |

The remaining 13 exempt points (te-compounds, sugiru, ni-iku, koto-ga-aru, tari-tari, nakereba,
hou-ga-ii, to-quotation) need form data that `conjugationTables.ts` doesn't carry — they are v2;
the registry type must make adding them additive (new entry + new form columns), nothing else.

**Unlock rule (learning-path alignment):** `unlockModule(type) = max(parseInt(point.module.slice(1)))`
over its grammarPointIds, resolved from the Track B `GrammarPoint` records. A type is unlocked when
`useCourseLevel() >= unlockModule`. Locked types render with "Unlocks at Module N" — visible but
inert (no fake progress, no countdown nags).

## Task 1 — Data layer: `src/features/practice/conjugation/` (new dir)

**Files:** create `trainerRegistry.ts`, `trainerSession.ts`, `trainerRegistry.test.ts`,
`trainerSession.test.ts`. No UI.

`trainerRegistry.ts`:
```ts
export type TrainerTypeId = "te-form" | "ta-form" | "nai-form" | "masu-negative" | "v-tai" | "i-adj-forms";
export type FormationRow = {
  groupLabel: string;      // "Godan — う・つ・る endings", "Ichidan", "Irregular"
  pattern: string;         // "〜う/つ/る → 〜って"
  exampleDict: string;     // あう
  exampleForm: string;     // あって
};
export type ConjugationTrainerType = {
  id: TrainerTypeId;
  title: string;
  subtitle: string;                       // one factual line, no hype
  category: "verb" | "i-adj";
  verbForms?: ConjugationForm[];          // when category === "verb"
  adjForms?: AdjForm[];                   // when category === "i-adj"
  grammarPointIds: string[];
  formation: FormationRow[];              // the cheat-sheet rows (authored below)
};
export const CONJUGATION_TRAINER_TYPES: ConjugationTrainerType[];
export function getTrainerType(id: string): ConjugationTrainerType | undefined;
export function unlockModuleForType(type: ConjugationTrainerType): number;  // from GrammarPoint.module
export function isTypeUnlocked(type: ConjugationTrainerType, reachedModule: number): boolean;
export function dueGrammarPointCount(type: ConjugationTrainerType, now?: Date): number;
// due = getGrammarCardState(id) exists AND either sub-state due <= now. A NEVER-seen point on an
// UNLOCKED type also counts as due (it needs its first session) — mirror how the grammar queue
// treats unseen-but-unlocked points (read buildGrammarReviewQueue for the exact due predicate).
```

Authored `formation` content (verbatim — these are the standard rules; examples must use verbs
that exist in `VERB_ENTRIES` at low modules):
- **te-form**: Godan う/つ/る→って (あう→あって); Godan む/ぶ/ぬ→んで (のむ→のんで); Godan く→いて (かく→かいて);
  Godan ぐ→いで (およぐ→およいで); Godan す→して (はなす→はなして); Ichidan る→て (たべる→たべて);
  Irregular する→して, くる→きて, いく→いって (special).
- **ta-form**: same sound changes with た/だ (のむ→のんだ, かく→かいた, たべる→たべた, する→した, くる→きた, いく→いった).
- **nai-form**: Godan う-row→あ-row+ない (のむ→のまない, あう→あわない — う→わ exception); Ichidan る→ない (たべる→たべない);
  Irregular する→しない, くる→こない, ある→ない (special).
- **masu-negative**: ます→ません (present neg); ます→ませんでした (past neg). Two rows + one per-group stem reminder row.
- **v-tai**: ます-stem + たい (のみます→のみたい); conjugates like an い-adjective afterward (one note row).
- **i-adj-forms**: 〜い→くない (negative); 〜い→かった (past); 〜い→くなかった (past negative); いい→よく〜 (irregular, よくない/よかった).
Verify every exampleDict/exampleForm pair against `VERB_ENTRIES`/`ADJ_ENTRIES` values — if a chosen
example verb isn't in the tables, pick one that is. (いい may not be an ADJ_ENTRIES member — keep the
row with literal strings; it's reference content, not drill content.)

`trainerSession.ts` (pure logic, UI-independent):
```ts
export type TrainerQuestion = { itemId: string; prompt: string; meaning: string; formLabel: string;
  form: string; correct: string; options: string[] };
export function buildTrainerSession(type, reachedModule, opts?): TrainerQuestion[];
// - pool: getVerbsUpToModule/getAdjsUpToModule(reachedModule) filtered to the type's category
// - question count: 2 per drilled form, clamped to [6, 12]; round-robin forms; no repeated
//   (verb, form) pair within a session while the pool allows it
// - MCQ options: reuse the distractor strategy from ConjugationPracticePage (same-item-wrong-form +
//   same-form-other-item, 3 distractors + correct, shuffled). Extract those generators into this
//   module and have the page import them from here (single source; do not duplicate).
export function sessionRating(results: boolean[]): "again" | "hard" | "good";
// lesson-parity: all correct -> "good"; >=50% correct -> "hard"; else "again"
export function gradeTrainerSession(type, results: boolean[]): void;
// for each grammarPointId: reviewGrammarPoint(id, "production", sessionRating(results))
```

**Tests:** registry — every grammarPointId resolves to a real GrammarPoint AND is a
POOL_GAP_EXEMPTIONS member (import the ids as a literal list in the test, don't import the pools
test file); unlockModuleForType derives correctly (assert te-form's actual module from data);
formation examples verified against table values (loop, not hand-assertions).
Session — count clamps; forms round-robin; pool respects reachedModule; distractors never include
the correct answer; sessionRating boundaries (all true → good; half → hard; below → again);
gradeTrainerSession writes production sub-state for every covered point (seed via localStorage mock
same as grammarSrs.test.ts does).

## Task 2 — UI: trainer hub + type sessions (+ integration)

> **SUPERSEDED (hub only) by the v1.2 addendum, Task 7 (below).** The row-list hub
> described here was replaced by the compact Ink Tiles hub + combined-session UI
> (`practice/conjugation/free`, `practice/conjugation/train`). The per-type session
> (`TrainerTypeSession`, `conjugation/:typeId`) is unchanged.

**Files:** rewrite `src/features/practice/ConjugationPracticePage.tsx` (hub) + create
`src/features/practice/conjugation/TrainerTypeSession.tsx`; add route `conjugation/:typeId`
in `src/App.tsx` next to the existing conjugation route; add the trainer row to
`src/features/practice/PracticeGrammarPage.tsx`; i18n keys in `en.json` only.

**Hub (`/practice/conjugation`):**
1. Header: title "Conjugation trainer", one-line factual sub ("Formation drills for the verb and
   adjective forms the course has introduced").
2. Type list (flat rows, NOT heavy cards-in-cards): each unlocked type shows title, subtitle,
   due badge (`dueGrammarPointCount`, hidden when 0), and navigates to `conjugation/<id>`.
   Locked types: muted row, lock icon, "Unlocks at Module N". Order: unlocked (due first), then locked.
3. "Free drill" section below: the EXISTING custom drill UI (category/form/module pickers + MCQ),
   moved intact — still practiceStats-weighted, still no FSRS writes. Label it "Free drill" with
   sub "Any forms, any pace — doesn't affect your review schedule."

**Type session (`/practice/conjugation/:typeId`):**
1. Guard: unknown id or locked type → redirect to the hub.
2. Layout: focused-flow style shell is NOT required (route isn't in focusedFlow) — normal page is
   fine for v1; keep the header slim: back link to hub + type title.
3. Three segments, in order, as tab-like sections the learner can jump between:
   - **Learn** — render the curriculum's rule card via `getGrammarRuleStepForPoint(firstPointId)`
     inside `GrammarRuleStepView` (pass a no-op onContinue; hide/omit its CTA if the view requires
     one — read the component first). If no tagged rule exists for the point, show the cheat sheet
     as the Learn content (no invented pedagogy copy).
   - **Cheat sheet** — table from `type.formation` (group label / pattern / example), plus an
     auto "Your verbs" strip: up to 8 items from the learner's reached-module pool with
     dictionary → drilled-form for the type's FIRST form (e.g. のむ→のんで), rendered with lang="ja".
   - **Drill** — default landing segment when the type has due points: `buildTrainerSession`
     questions one at a time reusing the hub MCQ presentation (prompt = dictionary + meaning +
     target form label; 4 options; instant verdict styling consistent with the free drill).
     Progress bar (numberless, like lessons). At the end: summary (X/Y correct, per-form breakdown)
     + `gradeTrainerSession` fires EXACTLY ONCE + "Drill again" / "Back to trainer" actions.
4. Keyboard: 1–4 select options, Enter advances (mirror useLessonKeyboard patterns if convenient).

**Grammar hub row (`PracticeGrammarPage.tsx`):** add a "Conjugation trainer" row alongside the
existing "Grammar review" row: due badge = sum of `dueGrammarPointCount` across unlocked types;
links to `/practice/conjugation`. Follow the existing row's exact markup idiom.

**Tests:** session page logic that's extractable stays in Task 1's pure modules (already tested);
add a smoke test only if an existing pattern for page tests exists in features/practice — otherwise
rely on tsc + the Task 1 suites. Do not add heavy RTL page tests that don't match repo conventions.

## Task 3 — Docs + verification sweep
- Update `docs/conjugation-trainer-recon-2026-07-02.md`: prepend a status block ("v1 shipped
  2026-07-02, see conjugation-trainer-v1-spec §registry for what's covered; §g open questions
  still open; 13 points remain v2").
- CLAUDE.md: in the grammar/SRS section, one paragraph: trainer at /practice/conjugation reviews
  9 of the 22 pool-exempt points into Track B production; exemptions list unchanged by design.
- Full `npx vitest run` + `npx tsc --noEmit` green.
- Screenshot pass: hub (mobile 390x844), one type session drill + cheat sheet, grammar hub row.
  (Coordinator does this with scripts/batch-shots.mjs — task lists it for completeness.)

---

# v1.1 addendum — conjugation ENGINE, anti-elimination distractors, stacked forms (2026-07-02, Spencer feedback)

Owner feedback on the shipped drill: "people can just figure these things with deductive
reasoning… the only one starting with mi and ending in nai is that one. we need people to have to
figure out the conjugation, not guess it and have a chance to be right" + "we need stacked
conjugation possible as well for combination stuff."

## Task 4 — Rule-based conjugation engine

**File:** create `src/features/languages/ja/conjugationEngine.ts` (+ test). Pure functions, no React.

```ts
export type ChainForm =
  | "masu" | "masu-neg" | "masu-past" | "masu-past-neg"
  | "te" | "ta" | "nai" | "tai"
  | "nai-past"            // なかった   (nai chain: ない → なかった)
  | "tai-neg"             // たくない   (tai conjugates as い-adj)
  | "tai-past"            // たかった
  | "tai-neg-past";       // たくなかった
export function conjugateVerb(dictionary: string, group: VerbGroup, form: ChainForm): string;
```

Rules (implement per verb group; irregulars する/くる and the いく-te/ta exception and う→わ nai
exception are table-driven inside the engine):
- stems: masu-stem (godan う-row→い-row; ichidan drop る; する→し, くる→き), nai-stem (godan
  う-row→あ-row with う→わ; ichidan drop る; する→し, くる→こ; ある→(ない handled as exception)),
  te/ta sound changes (う/つ/る→って/った; む/ぶ/ぬ→んで/んだ; く→いて/いた; ぐ→いで/いだ;
  す→して/した; いく→いって/いった; ichidan →て/た; する→して/した, くる→きて/きた).
- chains: nai-past = nai-stem+なかった; tai family = masu-stem+たい conjugated as い-adj
  (たくない/たかった/たくなかった); masu family from masu-stem (+ます/ません/ました/ませんでした).

**Ground-truth test (the load-bearing one):** for EVERY entry in `VERB_ENTRIES`, for every form
column it carries (`dictionary` excluded), `conjugateVerb(entry.dictionary, entry.group, form)`
MUST equal the hand-authored table value. The 88-entry table becomes the engine's fixture. Chain
forms get explicit expected-value tests (みる→みたくなかった, のむ→のまなかった, かう→かわない,
いく→いって, する→しなかった, くる→こなかった …).

Adjectives: `conjugateIAdj(dictionary, form: "negative"|"past"|"past-negative")` with the いい→よ〜
exception, ground-truthed against `ADJ_ENTRIES` the same way.

## Task 5 — Anti-elimination distractors + stacked drill

**Extend `trainerSession.ts`:**

```ts
export function generateFormationDistractors(
  dictionary: string, group: VerbGroup, form: ChainForm, correct: string,
): string[];
```
Distractors are SAME-VERB, SAME-TARGET-FORM-FAMILY rule misapplications so every option shares
the stem and the ending shape — only formation knowledge separates them. Error generators (pick
3 distinct, dedupe, never equal to correct, never equal to another real form of the same verb
UNLESS it belongs to the same ending family — e.g. みなかった as a distractor for みない is GOOD):
1. wrong-class: apply the other class's rule (ichidan verb treated as godan: みる→みらない,
   みりました; godan treated as ichidan: のむ→のない/のて).
2. attach-to-dictionary: bolt the suffix on the plain form (みるない, のむて, かうた).
3. wrong sound-change (te/ta/nai only): use a different godan row's change (かく→かって,
   のむ→のみて, かう→かあない).
4. wrong-tense/polarity within the SAME family (nai↔nai-past, tai↔tai-neg, ました↔ます …).
Fallbacks when generators collide (short verbs): permute another sound-change row; NEVER fall
back to other-verb options.

**`buildTrainerSession` switches to engine + formation distractors** for both trainer drills and
the hub Free drill (the old other-verb distractor path is retired for verbs; adjectives get the
same treatment via misapplied i-adj rules: くない/かった misattachments e.g. たかいくない,
attach-to-dictionary, wrong polarity/tense).

**Stacked forms in drills:**
- Registry: add chain forms to existing types — `nai-form` type drills `nai` + `nai-past`;
  `v-tai` drills `tai` + `tai-neg` + `tai-past` + `tai-neg-past`; `masu-negative` already stacked.
  Cheat sheets gain one "stacked" row per added chain (pattern + example, engine-generated).
- Free drill: add the chain forms as toggleable chips alongside the existing ones.
- `ta-form`/`te-form` types stay single-form (their stacking IS the te-compound family = v2).

**Prompt labels** for chains must be unambiguous ("ない form (past)" → なかった; "たい form
(negative past)" → たくなかった) — reuse the disambiguated-label principle from the recon.

Constraints as before (no git; grammar-review session files and ko-* untouched; POOL_GAP_EXEMPTIONS
unchanged; tests + tsc green: `npx vitest run src/features/practice src/features/languages` and the
full flashcards/lesson suites must stay green).

---

# v1.2 addendum — Ink Tiles hub + combine mode (2026-07-02, Spencer's pick)

Owner picked a variation of the Ink Tiles direction (docs/archive/conjugation-trainer-mockups-2026-07-02/)
with two requirements the mockups lacked:
1. **Stacked conjugation via tile combining** — "if plain past and plain negative are selected,
   everything would be a variation of the individuals AND a combination. みた, みない, みたくない…
   something to seamlessly incorporate these ONCE learners get higher proficiency in the
   individuals. more gamified progression but better learning and exposure to what's actually in
   the language."
2. **Vertical compactness** — "they take up so much vertical space… menu selector then a page
   change into the trainer itself… the less people scroll the better." Hub must fit ~one mobile
   viewport; no long scrolling lists.

## Task 6 — Combo data layer (extends src/features/practice/conjugation/)

`comboForms.ts` (new, pure):
```ts
// Which chain form a SET of selected base tiles unlocks. Sets are the six
// tile ids (TrainerTypeId). The engine (conjugationEngine.ts) already
// conjugates every chain form listed here.
export const COMBO_MAP: Array<{ tiles: TrainerTypeId[]; form: ChainForm; label: string }> = [
  { tiles: ["ta-form", "nai-form"],           form: "nai-past",      label: "ない form (past)" },       // みなかった
  { tiles: ["v-tai", "nai-form"],             form: "tai-neg",       label: "たい form (negative)" },   // みたくない
  { tiles: ["v-tai", "ta-form"],              form: "tai-past",      label: "たい form (past)" },       // みたかった
  { tiles: ["v-tai", "nai-form", "ta-form"],  form: "tai-neg-past",  label: "たい form (negative past)" }, // みたくなかった
  { tiles: ["masu", "nai-form"],              form: "masu-neg",      label: "polite negative" },        // みません
  { tiles: ["masu", "ta-form"],               form: "masu-past",     label: "polite past" },            // みました
  { tiles: ["masu", "nai-form", "ta-form"],   form: "masu-past-neg", label: "polite negative past" },   // みませんでした
];
export function combosForSelection(selected: ReadonlySet<TrainerTypeId>): ComboEntry[];
// every COMBO_MAP entry whose tiles ⊆ selected
```
**Registry change (masu collapse, Spencer 2026-07-02):** the `masu-negative` trainer type becomes
`masu` — title "ます form", drills `["masu"]` only (stem formation; the suffix swaps are combo
content). Its `grammarPointIds` stay `["masu-negative","masu-past-negative"]` BUT grading moves to
the form→point map below, so those two points are graded ONLY when their combo forms actually
appear in a session. Keep unlock derivation unchanged.

`trainerSession.ts` additions:
```ts
export const COMBO_PROFICIENCY_MIN_REPS = 3;
export function isTypeProficient(type): boolean;
// production sub-state reps >= COMBO_PROFICIENCY_MIN_REPS on EVERY grammarPointId the type
// grades via its individual forms (for masu: use the masu tile's own proxy — see note below).
// masu note: masu itself has no exempt point; gate masu's proficiency on drill history instead:
// practiceStats for masu-form items (recordPracticeResult already keys per item+form) OR a
// simple localStorage counter bumped per completed masu session — pick the least invasive
// honest signal and document it.
export function buildCombinedSession(selected: TrainerTypeId[], reachedModule, opts?): TrainerQuestion[];
// - individuals: each selected type's forms, as today
// - combos: combosForSelection(selected) forms — ONLY if every selected type isTypeProficient;
//   when unlocked, weight ~40% of questions to combo forms (that's the exposure goal)
// - distractors: generateFormationDistractors already handles every chain form
// - count: clamp [8, 14]
export function gradeCombinedSession(formsDrilled: ChainForm[] /* per-question */, results: boolean[]): void;
// FORM→POINT map: te→te-form; ta→ta-form; nai|nai-past→nai-form; tai*→v-tai;
// masu-neg→masu-negative; masu-past-neg→masu-past-negative; masu|masu-past→NO Track B write
// (masu/polite-past are pooled points, reviewed by the step-pool session — never double-grade).
// Per point: sessionRating() over ONLY the results of questions whose form maps to it;
// grade once per point per session (UI owns the once-guard as before).
```
Adj tiles participate too: i-adj-forms selected alone = today's behavior; no cross-category
combos in v1.2 (verb×adj combos don't exist morphologically).

**Tests:** COMBO_MAP subsets (selection {ta,nai,tai} unlocks nai-past+tai-neg+tai-past+tai-neg-past);
proficiency gate (below-threshold → individuals only, no combo forms in session); combo weighting
bounds; form→point grading map (masu-neg grades masu-negative; masu grades nothing); existing
suites stay green.

## Task 7 — Compact Ink Tiles hub + combined session UI

Replace the hub's row list in ConjugationPracticePage.tsx with the Ink Tiles interaction
(mockup direction C, docs/archive/conjugation-trainer-mockups-2026-07-02/index.html — reuse its visual
vocabulary: ink fill = mastery, ≤3 due pips as peeking cards, big glyph, squash press physics,
--type-* colors as CSS vars local to the feature for now with a comment pointing at future
ThemeTokens slots).

**Layout (one viewport, no scroll on 390×844):** slim header (title + one-line sub) → 2×3 tile
grid (い・ま・て・た・ない・たい order by unlock module) → full-width "Mix — free drill" tile →
sticky bottom action bar. NO per-type rows, NO form chips on the hub.

**Interaction:**
- Tap tile = toggle selected (colored ring + slight lift). Selection state drives the bottom bar:
  - 0 selected: bar shows the ONE recommendation ("Train い-adjectives — 3 waiting") → tap goes
    to that type's page.
  - 1 selected: "Train て-form" → navigates to the existing conjugation/:typeId page (Learn /
    Cheat sheet / Drill unchanged).
  - 2+ selected: "Train together · N forms" → combined drill. If combos unlocked, a small line
    under the button lists them ("+ みなかった・ません unlocked"); if not, factual note
    "Combined forms unlock once each is solid" (no scold, no countdown).
- Locked tiles (module gate): dimmed, lock glyph, "Module 16" caption; not selectable.
- Mix tile → navigates to the free drill as its OWN view (route `conjugation/free` — move the
  existing free-drill UI there wholesale; that alone removes most hub vertical space).
- Combined drill session: new route `conjugation/train?types=a,b,c` (or router state) rendering
  the same one-question-at-a-time drill UI as TrainerTypeSession's drill segment, with
  buildCombinedSession + gradeCombinedSession (once-guard), per-form summary at the end.
- Keyboard: unchanged (1-4, Enter).

i18n en.json only; JA text lang="ja"; no streak/babying copy; tests: hub selection logic that's
extractable goes in the data layer (Task 6 covers it); tsc + full practice/flashcards/lesson
suites green. Update the v1 spec's Task-2 description with a pointer to this addendum. Screenshot
verification happens post-build via scripts/capture-trainer.mjs (coordinator).

---

## v1.3 addendum (2026-07-02, same day) — pair greying, い-adjective stacks, drill-card redesign, kanji exposure

Spencer's asks: (1) grey out hub tiles that can't form a pair with the current selection;
(2) the い tile should pair with "things like past tense"; (3) drill card needs a stacked
4-tile answer design with more color, a bigger/gamified form indicator, and kanji with
furigana in drill words from ~module 10.

**Pair greying (hub).** `canExtendSelection(selected, tile)` (comboForms.ts): with a selection
active, a tile stays clickable only if selection ∪ {tile} is still a subset of some COMBO_MAP
entry; otherwise dimmed + disabled (opacity-35 saturate-0). Selected tiles always clickable
(deselect); empty selection → everything clickable (solo training). て pairs with nothing today
and greys the board when selected — honest: it has no stacks in v1.

**い-adjective stacks.** The い tile now mirrors the ます precedent — its BASE drilled form is the
く-stem negative (い→くない, `adjForms: ["negative"]`); かった and くなかった are combo-exclusive:
`{い,た} → past`, `{い,ない,た} → past-negative` (COMBO_MAP entries carry a `category` so combo
questions conjugate the right pool — verb combos drill verbs, い combos drill adjectives).
Grading: i-adj-past / i-adj-past-negative write ONLY via combos (FORM_TO_POINT), so their due
badges structurally pull learners into stacking, exactly like ません. `isTypeProficient("i-adj-forms")`
gates on i-adj-negative production reps alone (gating on combo-only points would be circular).
No verb×adj cross-category combos exist — たい/ます attach to verb stems only (Spencer's original
"how does tai work with adjectives?" confusion; the answer is it doesn't, and now the UI says so
by greying).

**Drill-card redesign (`DrillQuestionCard.tsx`, shared by TrainerTypeSession + CombinedSession).**
- Form indicator = glyph-chip EQUATION in the tiles' own colors: [た]+[ない] → "ない form (past)"
  (`FORM_TO_TILES` in typeColors.ts, kept in sync with COMBO_MAP). Teaches the hub's tile algebra
  on every question. CombinedSession's header title uses the same chips.
- Answers: vertical stack of 4 full-width tiles (larger tap targets), numbered key chips tinted
  by the drilled form's color (`--fc`), ink-fill hover in the form color (the trainer's ink motif),
  pop animation on correct / shake on wrong (reduced-motion guarded). CSS lives in
  CONJ_TYPE_COLOR_CSS, now scoped `.conj-scope` (hub + both drill views carry the class).
- Free drill (Mix) intentionally still uses its old inline card — it's the sandbox; port later if
  Spencer wants parity.

**Kanji exposure (M10+).** `kanji?: string` on VerbEntry/AdjEntry (69 of 86 entries authored;
kana-preferred words like いい・おいしい・きれい omitted; sense-ambiguous はやい/やさしい omitted).
`writtenForms.ts` derives every conjugated written form by prefix substitution (length-preserving
even for 来る's こ/き readings) → `<ruby>` furigana over the kanji block, applied to prompt,
options, and the answer row when `reachedModule >= KANJI_EXPOSURE_MODULE` (10). Structural
contract machine-enforced in writtenForms.test.ts (every kanji field × every form derives cleanly).

Verified: tsc clean, full suite 2666 green (83 new), light+dark screenshots at 390×844 (hub
greying both directions, per-type drill, feedback states, combined い+た session incl. a live
かった combo question at proficiency).

**Word-class chip (same-day follow-up).** Every drill question shows the word's conjugation class
under the meaning (`WordClassChip`): Godan verb / Ichidan verb / Irregular verb / い-adjective /
Irregular い-adjective (いい only — suppletive よ- stem). Irregulars get an amber sparkle chip so
they register; regulars stay neutral. Learners know WHICH rule to apply and, over sessions,
absorb which words are the irregulars. Data: `TrainerQuestion.wordClass` from the entry's
`group` (verbs) / いい-check (adjectives).

**Drill-card layout v2 (same-day, Spencer's mockup).** Word block left (class chip → word →
meaning, wrapping downward), BUILD STACK right: the target form's tiles stacked vertically in
APPLICATION ORDER (top = apply first) with ↓ connectors — answers "do I do たい first or past
tense?" (FORM_TO_TILES arrays are in application order; scales to 4 chips). Answer tiles:
numbering REMOVED (keyboard 1–4 still answers by position), taller card (min-h 560px), tiles
stretch to fill with centered text. Feedback slot is permanently reserved (lesson stability
rule — options measured pixel-identical before/after submit). English form label DROPPED;
teaching moved into click/tap POPOVERS: the class chip explains its rule (godan row-shift /
ichidan drop-る / する・くる memorize / い-adj replace-い / いい→よ), each glyph chip shows its
registry title + subtitle. Fixed a latent `Popover` primitive bug while wiring this: Portal
mounts children one effect-tick after Popover's layout effect, so panels never got positioned
(parked at -9999) unless a scroll fired — positioning now also runs on panel mount (callback
ref). Queued from the same conversation, NOT yet built: (a) cheat-sheet access from inside
drill sessions (easy — modal button on the combined session; per-type already has the tab);
(b) locked hub tiles becoming clickable with a "you haven't learned this yet — continue anyway?"
don't-show-again dialog instead of hard-locked (medium — unlock-policy change).

---

## v1.4 addendum (2026-07-05) — tabs folded into the drill, measured centering, cheat-sheet peek economy

Spencer: chips positioned badly; Learn/Cheat-sheet tabs redundant ("what is the learn tab even
for"); cheat sheet should be an inset button that shakes when stuck and prices a peek at half
credit; center the word and MEASURE the spacing; scale chips to their count.

**Type page = the drill.** Tab bar removed. The curriculum's tagged rule card (when one exists
for the type's first point) shows ONCE as a first-run intro (mastery 0), "Got it" → drill; types
without a rule card go straight in (their old Learn tab only mirrored the cheat sheet).
CheatSheet extracted to `CheatSheet.tsx`; shared `SessionSummary.tsx` (credit-aware) replaces the
two per-page copies.

**Measured header (eye-tracking-informed).** 1fr/auto/1fr grid, max-w-md: word block on the
card's TRUE centerline (first fixation = the big type; measured offset 0px at 1280 AND 390),
build stack right (end of horizontal scan, before the drop to options), cheat-sheet button left
(discoverable, low salience). Playwright `getBoundingClientRect` measurement is part of the
capture scripts now — spacing claims come with numbers.

**Cheat-sheet button + peek economy.** Opens a Modal with the formation tables for exactly the
current question's tiles (a combo question surfaces every constituent table). Peeking before
answering marks the question **0.5 credit**; after 20s stuck (`STUCK_HINT_MS`) the button shakes
(one shake + gentle recurring wobble, reduced-motion-guarded) and the reserved slot swaps the kbd
hint for "Stuck? Peek at the cheat sheet — half credit." Feedback line names the deal ("Correct —
half credit (cheat sheet used)"). Engine: results are `QuestionCredit` (number|boolean, 0/0.5/1);
`sessionRating` sums credit — full marks → good, ≥50% → hard, so ONE peek caps a session at hard
(a peek is a success, just slower — FSRS Hard is a success). Summary shows halves explicitly
("6 + 2½ / 10", "½ marks are cheat-sheet peeks").

**Card ownership.** DrillQuestionCard now owns the per-question lifecycle (answer state,
keyboard incl. Enter-advance, peek/stuck, modal) and is REMOUNTED per question (key={index});
both session pages slimmed to question list + results + grading. Options pixel-stability
preserved (reserved slot unchanged). Build-stack chips size-adapt: 1 → large, 2 → medium,
3+ → compact.

Verified: 2668 tests green (half-credit rating cases added), tsc clean, measured centering 0px
both viewports, screenshots: layout, intro (te-form), cheat modal, stuck nudge, half-credit
feedback.

**v1.4.1 (2026-07-05) — the combined-forms toggle (gate made explicit).** Spencer's playtest hit
the oversight: combos gated silently on `isTypeProficient` for EVERY selected tile, so a fresh
profile's い+た+ない session was 100% base forms with no explanation ("I am not seeing any paired
trainings here"). Fix: hub "Combined forms" Switch (persisted,
`lingo:conjugation-trainer:combined-mode:v1`, default ON):
- ON — tile greying guides pairable selections AND sessions include the stacked forms
  UNCONDITIONALLY (`buildCombinedSession` opts.combos: "on" | "off" | "auto"; the toggle is
  explicit intent, no hidden gate). Bar always previews what's included ("+ なかった・たかかった…
  included"); proper-subset selections get a path hint ("Add た for stacked forms", smallest
  superset entry).
- OFF — free mixing: no greying, any tiles together, individuals only (`&combos=0` on the train
  route; legacy links without the param default ON).
Mode flips clear the selection (OFF-mode sets can be invalid under ON rules). The proficiency
machinery survives only as the legacy "auto" mode + tests; due-badge economics unchanged — the
combo-exclusive points (ません/ませんでした/i-adj past pair) still clear only via combined
sessions, so default-ON keeps that pull. 2670 tests green (on/off inclusion cases); screenshot-
verified: fresh-store combo question on q2, both toggle states, add-tile hint.

## Addendum v1.5 — Learn-ahead dialog (2026-07-05)

Locked hub tiles are now PRESSABLE (Spencer: "if a user is at module 3 but wants to learn
something they haven't learned, it can pull up a 'don't show again'-able dialogue"). First
selection of a locked tile opens "Looking ahead?" (`LearnAheadDialog.tsx`, standard Modal):
states that Module N introduces the form, that the drill assumes untaught grammar, and that
ahead practice schedules no reviews. "Continue anyway" selects the tile; "Don't ask again"
persists at `lingo:conjugation-trainer:learn-ahead-ack:v1` (`learnAhead.ts`) after which locked
tiles toggle like any other. Deselecting never prompts. The dialog is a courtesy, not a
permission — direct URLs to locked types also work (route guards now pass locked types).

Mechanics (`isSelectionAhead` / `effectivePoolModule` in trainerRegistry):
- **No SRS when ahead** — sessions grade through `gradeTrainerSessionIfOnPath` /
  `gradeCombinedSessionIfOnPath`; ANY ahead tile makes the whole session practice-only (no
  Track B writes, no masu drill-history bump). Summary notes it: "Practice only — ahead of
  your path, so nothing was scheduled for review."
- **Pool override** — ahead sessions draw from the type's unlock module (table entries start
  at m7, so an early learner's reached-module pool is EMPTY); combined selections use the max
  unlock among tiles. Kanji exposure stays gated on the REAL reached module — early learners
  drill in kana.
- Combined-mode pairing greying applies to locked tiles too (same COMBO_MAP algebra); locked
  visuals keep the lock + "Module N" but gain hover/selection ring (type color) once pressable.

Verified: 2682 tests green (12 new: ack persistence, ahead grading gates both session kinds,
pool override), tsc clean; Playwright walk at 1280×800 + 390×844 — dialog centered (offset
≤5px), ack persisted, no re-prompt, ahead て-form session left NO te-form key in Track B,
practice-only note rendered, た+ない locked selection previews みなかった.
