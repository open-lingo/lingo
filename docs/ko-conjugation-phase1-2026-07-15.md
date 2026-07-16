# Korean conjugation trainer — Phase 1 (2026-07-15)

Status: **shipped** (this commit). Generalizes the JA-hardwired conjugation
trainer into a language-agnostic feature and adds a real Korean dataset +
engine. Both JA and KO work end-to-end.

## What shipped

**Generalization (the trainer is now a language capability, not a JA thing).**
- The practice surface consumes a `ConjugationTrainerProvider`
  (`src/shared/conjugation/types.ts`) resolved via
  `useConjugation()` (`src/features/practice/conjugation/useConjugation.ts`)
  off `getLanguageModule(id).conjugation.trainer`. The surface files
  (`ConjugationPracticePage.tsx`, `conjugation/*`, `PracticeGrammarPage.tsx`)
  import **zero** `languages/ja/*` linguistics.
- JA's trainer internals moved from `features/practice/conjugation/*` to
  `features/languages/ja/conjugation/*` and are wrapped by
  `features/languages/ja/conjugation/provider.ts`.
- Providers self-register into a dependency-free registry
  (`src/shared/conjugation/registry.ts`) loaded lazily via
  `features/practice/conjugation/providers.ts` — this ordering fixes an
  import cycle that otherwise poisoned the memoized JA curriculum.

**Korean content** (`features/languages/ko/conjugationEngine.ts`,
`conjugationTables.ts`, `conjugationProvider.ts`): jamo-level engine,
~65 lemmas (verbs + adjectives). Coverage:
- Politeness: 해요체, 반말, 합쇼체
- Tenses/aspect: present, past (-았/었어요), future (-(으)ㄹ 거예요),
  **present progressive -고 있어요** (its own drill tile)
- Negation: short `안` + long `-지 않다`
- Vowel harmony / contraction
- **All major irregulars: ㅂ, ㄷ, ㅅ, 르, ㅎ, ㄹ-stem, 으(ㅡ-deletion), 하다**

**Gating:** Phase 1 gates drills by reached module; the Track-B grammar SRS
integration is intentionally deferred (grading is a no-op for KO — TODO in
`conjugationProvider.ts`).

## Verification (2026-07-15)
- `npx tsc --noEmit` clean for all touched files.
- 1420 tests pass across `languages/{ja,ko}`, `shared/conjugation`,
  `practice/conjugation` (incl. new KO-engine assertions per irregular class).
- Browser: `/ko/practice/conjugation` renders the KO trainer with 요 / 반 /
  다 / 었 / 거 / 고 / 안 form tiles (locked until the learner reaches the
  gating module — expected).

## Phase 2 (not done)
- **KO grammar-SRS grading** — currently a no-op; wire KO drills into
  Track-B SRS (`conjugationProvider.ts` TODO).
- **Combos / free drill for KO** — `supportsCombos: false` today.
- **More lemmas + real module alignment** — expand beyond ~65 and map tiles
  to the actual KO curriculum modules.

## Related
- `docs/ja-ko-parity-audit-2026-07-15.md` — full JA↔KO parity audit; the
  conjugation deep-dive drove this work.
- Same-day sibling changes: videos practice dropped; kanji locked to JA.
