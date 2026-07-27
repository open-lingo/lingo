> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Curriculum restructure — pure-hiragana M1 + compressed M2 (dakuten + yōon)

Status: spec ready, agent-executable. User-approved.

User directives:
- Yōon must NOT appear before all base hiragana are taught — current
  `yo-k` (きゃ) lands before ya-row, violating the small-ゃ/ゅ/ょ
  prereq.
- Less emphasis on yōon: compress because they reuse just-learned
  kana — no need for full per-family multi-sub-lesson treatment.
- Same for dakuten: the kana shapes are already known; what's new
  is the sound. 2 sub-lessons + test per family is plenty.
- Combine all yōon + dakuten into Module 2.

---

## TL;DR

| Module | Was (post-streamline) | Now |
|---|---|---|
| M1 Hiragana | 43 lessons (incl. 2 yōon interleaves) | **~36 lessons** — pure hiragana only |
| M2 Voicing | 28 lessons (dakuten + 3 yōon mini-lessons) | **~21 lessons** — dakuten compressed + yōon compressed |

Yōon rule: ya-row is a prereq. All yōon land in M2 after the full
hiragana basics + dakuten are introduced.

---

## Module 1 — Pure Hiragana

**Rows (in this order):**
vowels → ka → sa → ta → na → ha → ma → ya → ra → wa → recap

**Sub-lesson distribution unchanged from #66 streamline:**
| Row size | Split | Nodes |
|---|---|---|
| 5 kana | 2+2+1+test | 4 |
| 3 kana (ya, wa) | 2+1+test | 3 |

Total: 7 × 5-kana rows + 2 × 3-kana rows + vowels stub + recap
= 28 + 6 + 1 + 1 = **~36 lessons**.

NO yōon in M1. Remove the `yo-k` / `yo-sh-ch` interleaves from
`mockCourse.ts`.

---

## Module 2 — Voicing & Yōon (compressed)

Module 2 has two distinct phases. Order them sequentially: **dakuten
block first, yōon block second.** This keeps the conceptual
separation clean (voicing modifies sound; yōon modifies syllable
shape).

### Phase A: Dakuten (compressed to 2 sub-lessons per row)

Per-row pattern: **Intro 1** + **Intro 2** + **Row test**. Drop the
3rd sub-lesson — the kana shapes are already known so the third
review pass is unnecessary.

Distribution:
| Row | Kana | Split | Nodes |
|---|---|---|---|
| ga | 5 | 3+2+test | 3 |
| za | 5 | 3+2+test | 3 |
| da-ba | 8 | 4+4+test | 3 |
| pa | 5 | 3+2+test | 3 |

Total Phase A: **12 lessons**.

### Phase B: Yōon (compressed — one mega-intro + family practice + capstone)

The small-ゃ/ゅ/ょ rule is uniform. Teach the rule once, then
practice by consonant family. Family count is reduced:

1. **`yoon-intro`** — Single intro lesson teaching the rule. Covers
   the k-family (きゃ/きゅ/きょ) as the worked example. 1 sub-lesson
   (no further split, ~10 steps). Anchor: きょう (today). No test
   (covered by capstone).

2. **`yoon-sh-ch`** — sh-yoon + ch-yoon combined. 1 sub-lesson, 6
   kana intro. Anchors: しゃしん, おちゃ. No test.

3. **`yoon-voiced`** — Dakuten yōon (g-yoon + j-yoon + b-yoon +
   p-yoon combined). 1 sub-lesson, 12 kana. Anchors: ぎゅうにゅう,
   じゅう, びょういん. No test.

4. **`yoon-rare`** — n/h/m/r yōon (the recognition-only ones). 1
   sub-lesson, 12 kana. Anchors: ひゃく, りゅう, りょこう. Sentence-
   example slides for にゃ row. No test.

5. **`yoon-capstone`** — Single row-test covering ALL yōon. ~15-20
   mixed items, struggle-biased. 70% pass threshold (same as other
   row tests). Skippable.

Total Phase B: **5 lessons**.

### Phase B compression rationale

Per spec: "less emphasis for yōon, cram more into each lesson
segment since they just use the kana you just learned". Each yōon
mini-lesson packs more kana intros into a single sub-lesson since
the components are familiar.

### Module 2 recap

End of module: 1 recap lesson mixing items from BOTH dakuten and
yōon phases. ~15 items. (Already shipped in #67; just reassigned to
the new m2 lesson list.)

**Module 2 total: 12 (dakuten) + 5 (yōon) + 1 (recap) = 18 lessons.**

---

## Data model changes

### `RowDef.prerequisites` (NEW)

```ts
export type RowDef = {
  // ... existing
  /** Row IDs that must be completed before this row unlocks. Used by
   *  unlock logic to enforce ya-row → yōon dependency. */
  prerequisites?: string[];
};
```

Add `prerequisites: ["ya"]` to every yōon row. The
`isLessonLocked` / `getModuleStatus` helpers in `moduleProgress.ts`
check the prereq IDs and respect them; without the user completing
ya-row, yōon stays locked even if the user reaches M2.

### Yōon row consolidation

Replace the existing 6 yōon RowDefs in `YOON_ROWS` with 4 new ones:

- `yoon-intro` — kya/kyu/kyo (was `yo-k`)
- `yoon-sh-ch` — sha/shu/sho + cha/chu/cho (was `yo-sh-ch`)
- `yoon-voiced` — gya/gyu/gyo + ja/ju/jo + bya/byu/byo + pya/pyu/pyo
  (was `yo-g-j` + `yo-b-p`)
- `yoon-rare` — nya/nyu/nyo + hya/hyu/hyo + mya/myu/myo + rya/ryu/ryo
  (was `yo-n-h` + `yo-m-r`)

Each new yōon row has `subLessons` explicitly set with ONE
sub-lesson per row (no auto-split via `deriveSubLessons`).

`yoon-capstone` is a separate row-test-only entry (or handled by the
recap lesson — see implementation note below).

### Dakuten subLessons override

The current `deriveSubLessons` auto-splits dakuten rows the same as
hiragana (2+2+1+test for 5-kana, 2+2+2+2+test for 8-kana). Override
`subLessons` on each DAKUTEN_ROW entry explicitly:

```ts
{
  id: "ga",
  // ...existing fields
  subLessons: [
    { suffix: "1", label: "Intro 1", introduces: [が, ぎ, ぐ], anchorWords: [...] },
    { suffix: "2", label: "Intro 2", introduces: [げ, ご], anchorWords: [...], build: {...} },
    { suffix: "test", label: "Row test", introduces: [], anchorWords: [], isTest: true },
  ],
}
```

Same pattern for za / da-ba / pa. da-ba's 8 kana → 4+4+test.

---

## Implementation steps (in order)

1. **Add `prerequisites` field** to `RowDef` type. No behavior
   change yet.

2. **Restructure YOON_ROWS** in `hiraganaCurriculum.ts`:
   - Replace 6 rows with 4 new ones (yoon-intro, yoon-sh-ch,
     yoon-voiced, yoon-rare)
   - Each has `prerequisites: ["ya"]`
   - Each has explicit `subLessons` with ONE Intro sub-lesson only
     (no auto-split)
   - Add `yoon-capstone` as a row-test-only entry (suffix `test`,
     items pulled from all 4 yōon rows)

3. **Override DAKUTEN_ROWS subLessons** to use the 2-sub-lesson
   pattern (3+2+test for 5-kana; 4+4+test for da-ba).

4. **`mockCourse.ts` update:**
   - M1 list: drop yo-k + yo-sh-ch interleaves. Just emit the 9
     base rows + vowels + recap.
   - M2 list: emit dakuten rows (ga/za/da-ba/pa) then yōon rows
     (yoon-intro/yoon-sh-ch/yoon-voiced/yoon-rare/yoon-capstone) +
     recap.

5. **Module-progress prereq enforcement** in
   `moduleProgress.ts` / `isLessonLocked`:
   - For each lesson, check the parent row's `prerequisites` array
   - If any prereq row's sub-lessons aren't ALL in `completedSet`,
     the lesson stays locked even if module is unlocked
   - Lock UI surfaces via existing `state === "locked"` styling

6. **Progress migration** in `mockProgress.ts`:
   - Versioned flag bump: `lingo_progress_migration_v3`
   - For users who completed any old yōon lesson (`ja-m1-yo-k-*`,
     `ja-m1-yo-sh-ch-*`, `ja-m2-yo-g-j-*`, `ja-m2-yo-n-h-*`,
     `ja-m2-yo-m-r-*`, `ja-m2-yo-b-p-*`): mark the corresponding
     new yōon row's sub-lessons complete via mapping table
   - For dakuten sub-lessons (was `ga-1`, `ga-2`, `ga-3`, `ga-test`,
     now `ga-1`, `ga-2`, `ga-test`): drop the `-3` from completed
     ids (no-op, just becomes orphan; not harmful)
   - Idempotent — guard with the migration flag

7. **`generatedHiraganaLessons.ts`** — regenerate the lesson list
   to match new row IDs. `MODULE_RECAP_LESSON_IDS` unchanged
   (`ja-m1-recap` / `ja-m2-recap`).

8. **Recap lesson source pool** — `buildRecapLesson` already pulls
   from `module.lessons`; no change needed, just refresh after the
   data restructure.

9. **Build review tail compatibility** — `buildReviewTailSteps`
   draws from prior lessons across modules. Update its skip logic
   to NOT pull yōon items if the user is on a hiragana lesson
   (avoids the same prereq problem in reverse).

10. **Coverage test update** —
    `src/features/lesson/data/curriculum-coverage.test.ts`
    auto-iterates `ALL_ROWS`. Will pass on the new structure
    unchanged. Verify assertion:
    every kana in YOON_ROWS appears in at least one sub-lesson
    (yoon-capstone has empty introduces; ensure the assertion
    handles `isTest`/no-introduces rows).

11. **Build + test + Playwright smoke** at `/ja/learn?dev=1`:
    - M1 pathway shows ~36 nodes — no yōon between na-row and ha-row
    - M2 pathway shows dakuten cluster first, then yōon cluster, then
      recap
    - Open ya-row, complete all sub-lessons. Verify yōon-intro
      unlocks. Open yo-intro, confirm prereq message gone.

---

## Files touched

### MODIFIED
- `src/shared/domain/course.ts` — add `RowDef.prerequisites`
- `src/features/lesson/data/hiraganaCurriculum.ts` — restructure
  YOON_ROWS (4 rows + capstone), override DAKUTEN_ROWS subLessons
- `src/features/lesson/data/lessonBuilder.ts` — review-tail
  prereq filter
- `src/shared/domain/mockCourse.ts` — m1 yōon removed, m2 reordered
- `src/shared/domain/mockProgress.ts` — v3 migration
- `src/features/lesson/data/generatedHiraganaLessons.ts` —
  regenerated mapping
- `src/features/learn/moduleProgress.ts` (or wherever
  isLessonLocked lives) — prereq enforcement
- `src/features/learn/components/ModulePathway.tsx` — ROW_GLYPH
  mapping update for new yōon ids
- `src/features/japanese/vocabGraduation/` — comment update for
  the new row ids if any anchor mapping references them

### NO changes
- `src/features/lesson/components/steps/*` — visual refresh stays
- Phase 2 vocab graduation + recap + review tail logic — keep
- Speech recognition POC — keep
- Persona-audit-driven fast wins (just landed) — keep

---

## Verification

- `npm run build` clean
- `npm run test:run` — 152 → ~150-152 (some curriculum-coverage
  tests parameterize over `YOON_ROWS` and will shift)
- Playwright smoke confirming m1 = ~36 nodes, m2 = ~21 nodes,
  yōon-intro locked until ya-row complete
- Manual: enable `?dev=1`, visit m1, scroll the pathway — confirm
  no kya/sha nodes between rows. Open m2, confirm dakuten then
  yōon order.

---

## Risks

- **Progress migration is the trickiest piece.** Existing users may
  have ya-row complete but yo-k complete (under the old structure).
  Migration must credit `yo-k-*` → `yoon-intro-*` so they don't
  re-learn anything. Edge case: user completed yo-k but NOT ya-row
  (legacy bug Spencer caught). They'd land in m2 with yoon-intro
  marked complete but ya-row incomplete. Acceptable — they just
  see the m1 ya-row as "in progress".
- **Coverage test** might fail if it asserts yōon row count is 6;
  parameterized assertions on `ALL_ROWS` should be fine, but watch
  for hardcoded magic numbers.
- **vocab graduation `graduateModule` flag**: m2 flag may need to
  reset since m2's lesson set changed materially. Check that
  graduation re-runs cleanly when the new module completes.

---

## Out of scope

- Don't touch the speech recognition POC, persona-audit fast-wins,
  or Phase 2 vocab-graduation code beyond comment refreshes
- Don't regenerate TTS for new anchor words — Spencer will run
  manually after restructure ships (yo-intro/yo-sh-ch/yo-voiced/
  yo-rare anchor strings carry over from the old yōon rows; if any
  new strings are introduced, list them at the end of the agent's
  summary)
- Don't add new lesson kinds (recap stays, row_test stays)
- Don't change the Learn page pathway visual treatment (one-node-
  per-row + curled dots + label pills — final)
