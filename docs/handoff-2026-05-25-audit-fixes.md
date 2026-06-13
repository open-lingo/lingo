# Session handoff — 2026-05-25 audit fixes + dark: migration

> **Chronologically last session on 2026-05-25.** Earlier same-day handoffs: `handoff-2026-05-25.md` (sub-lesson restructure + SRS review), `handoff-2026-05-25-social-mvp-pass.md` (social wiring + 51 primitives).

## Commits pushed

1. `3707c6c` — Placement test, audit fixes, accessibility pass, test-out wiring (20 files, +1675)
2. `c9681ad` — Migrate ~465 hard-coded `dark:` classes to CSS variable tokens (58 files, +467 −463)

897/897 tests pass. Git clean on main, up to date with origin.

---

## 1. Placement test (shipped)

Full adaptive placement in `src/features/placement/`. See `CLAUDE.md` "Placement test" section for architecture.

- 2-stage adaptive: 8 screening items → probing 3 items/module in boundary zone
- 100% threshold (3/3 per module), 2-consecutive-wrong cutoff
- SRS seeds atoms as `state: "learning"`, `dueDate: today`
- Same engine powers test-out: `/ja/learn/test-out/:moduleId`
- 75-item question bank (3 per module, M3-M27)
- Onboarding prompt on Learn page for new JA users with no completions
- Old `buildPlacementTest.ts` (M1-M3 kana only) superseded

## 2. Test-out enabled

- `TEST_OUT_ENABLED = true` in `LearnCourseMap.tsx`
- Dead `testOut()` replaced with `navigate(langPath('learn/test-out/${mod.id}'))`
- Test-out buttons only on non-completed modules
- Module revisiting: completed modules now show their pathway (not locked out)

## 3. SRS write gate fix (Sev-1)

`LessonPage.tsx:368` regex `/^ja-m[3-7]-review-[12]$/` only matched M3-M7 review lessons. M8-M27 reviews silently got zero SRS credit. Fixed → `/^ja-m\d+-review-[12]$/`.

## 4. Accessibility pass

| Fix | File |
|-----|------|
| Focus management between steps | `LessonPage.tsx` — `stepContainerRef` + `tabIndex={-1}` + `requestAnimationFrame` focus |
| Skip-to-content link | `Layout.tsx` — `sr-only focus:not-sr-only` link targeting `#main-content` |
| PlacementPrompt dialog a11y | `PlacementPrompt.tsx` — `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape |
| WCAG AA contrast fixes | `presets.ts` — dark accent `#047857→#059669`, dark accentHover `#059669→#34d399`, sepia textMuted `#7a756d→#6d6860`, light textMuted `#6b7280→#636b77` |

## 5. Dark: token migration

~465 hard-coded `dark:` Tailwind classes → CSS variable tokens across 58 files.

| Pattern | Token |
|---------|-------|
| `dark:bg-gray-{800,900,950}` | `bg-surface` / `bg-surface-muted` / `bg-surface-elevated` |
| `dark:text-white`, `dark:text-gray-100` | `text-text-primary` |
| `dark:text-gray-300` | `text-text-secondary` |
| `dark:text-gray-{400,500}` | `text-text-muted` |
| `dark:border-gray-*` | `border-border` |

Kept intentionally: 3 `dark:` opacity overrides in hero/banner components, `dark:prose-invert` (required by `@tailwindcss/typography`).

## 6. Mock data → real

- `FlashcardsPage.tsx` — removed `MOCK_WEEK_REVIEWS`, `MOCK_WEEK_TOTAL`, `MOCK_DECK_RETENTION`
- Wired real `weekReviews` (7-day sparkline) and `deckRetentions` from `useFlashcardDueSummary` hook
- New helpers: `computeWeekReviews()`, `computeDeckRetention()` in `useFlashcardDueSummary.ts`

## 7. Audit scores (post-fix)

| Pillar | Before | After |
|--------|--------|-------|
| Curriculum & Content | 9.0 | 9.4 |
| SRS Engine & Review | 9.5 | 9.6 |
| Theme & Settings | 8.5 | 8.5+ |
| Accessibility | 7.5 | improved |

---

## Open items

- **Auth state expired** — `npm run test:e2e:auth` needs re-run for Playwright screenshots
- **Visual verify dark: migration** — passed 897 tests but screenshots were blank (auth expiry). Manual check recommended
- **Answer dispute reporting** — deferred ("for now dont make, we can look later"). Saved in memory
- **Maya (teen) persona** — deferred. Sidequests + skins are the levers, targeting language learners first

## Docs pruned this session

Deleted 14 stale files: 7 `AGENT_CONTEXT`/`AGENT_KICKOFF`/`AI_DELEGATION` task briefs (superseded by CLAUDE.md), `DESIGN_SYSTEM_PLAN` (51 primitives shipped), `SETTINGS_AND_DATES` (built), 3 `COMMUNITY_*_PLANNING` docs (built + wired), `pause-modality-design` (dead scope), `deck-format-example.json` (superseded by `dataformats/`).
