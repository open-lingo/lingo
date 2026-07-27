> **Status: ARCHIVED — SUPERSEDED by 2026-05-18-home-restructure-design.md.** Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Home page restructure — working notes (2026-05-18)

Pre-design scratchpad. The committed design is `2026-05-18-home-restructure-design.md`. **Implementation status (2026-05-24):** see [handoff-2026-05-24-home-sync-ux.md](../../archive/handoff-2026-05-24-home-sync-ux.md) for wiring table updates.

## What Spencer asked for

> "We are working on a navigation restructure for the home page and documenting movement on other places... right now we need to match this vision I have here for the home screen."

- Match the annotated mockup layout.
- Stylize to fit current theme editor / token system.
- Make elements harmonious; use UI-design judgment but follow Spencer's structure.
- Account for mobile (future).
- Build a mockup before committing.
- Note current and future wiring needs.

## Annotated layout (Spencer's sketch)

```
┌─────────────────────────────────────────────────────────────────┐
│  HERO (existing WelcomeBanner + Fuji image)                     │
│  ┌──────────────┐  ┌──────────────────────────────┐             │
│  │ Start lesson │  │ Summary of where left off    │             │
│  │     CTA      │  │ module name/info, inset view │             │
│  └──────────────┘  └──────────────────────────────┘             │
│  Up first: Vowels — Intro 1                                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐ ┌────────────────────┐
│           Pretty Account Overview        │ │ Social Tab         │
│           (wide, top-left)               │ │  - Friend          │
└──────────────────────────────────────────┘ │    Suggestion      │
┌─────────────────┐ ┌──────────────────────┐ │  - Friend Quest    │
│   Flash Cards   │ │   Daily/Weekly       │ │  - Friend streaks  │
│                 │ │     Quests           │ │  - research other  │
└─────────────────┘ │                      │ │    social features │
┌─────────────────┐ │                      │ │  (tall, full       │
│ Recent Most     │ │                      │ │   right column)    │
│ Used Practice   │ │                      │ │                    │
└─────────────────┘ └──────────────────────┘ └────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│       Community Tab Overview & Recent Articles/Posts            │
└─────────────────────────────────────────────────────────────────┘
```

## Current state (as of 2026-05-18, master branch)

`HomePage.tsx` for signed-in returning users renders, in order:
1. Welcome heading (plain `<h1>`)
2. `nextLesson` continue-card (Fuji bg, single tile)
3. `<ProgressSummary />` — streak, lessons-this-week, cards-due, XP total + daily-goal bar
4. `navCards` — Learn, Flashcards, Practice, Stories (flag), Explore decks
5. `<HomeActivityPanel />` — recent forum threads + new decks + leaderboard

For first-time users: `<WelcomeBanner />` (Fuji hero) + navCards + `<EmptyActivityNotice />`.

Theme tokens (Tailwind via CSS vars): `bg-surface{,-muted,-elevated}`, `border-border`, `text-{primary,secondary,muted}`, `accent{,-hover,-muted}`, `shadow-card/popover`, `rounded-xl`. All theme-editor controlled.

## Existing scaffolds that map to the sketch

| Sketch box | Existing | Wiring? |
|---|---|---|
| Hero CTA | `WelcomeBanner` (first-time only) | Yes — needs to also serve returning users with "continue" copy + lesson summary |
| "Summary of where left off" inset | Implicit in current continue-card | Needs explicit metrics: module progress %, lesson N of M, last completion time |
| Pretty Account Overview | `ProgressSummary` (functional but plain) | Live data already wired (streak/xp/lessons/cards-due/daily-goal); just needs visual upgrade |
| Flash Cards | `FlashcardsCard` (current nav card) | Needs richer: due count, "review N now" CTA — `useCardsDueCount` exists |
| Recent Most Used Practice | Partial — `PracticeCard` is a generic nav tile | New: track last-used practice type (alphabet/kanji/grammar/components), persist in localStorage |
| Daily/Weekly Quests | **None — greenfield** | Need a quests system. Mock first; backend later |
| Social (friends/quests/streaks) | **None — greenfield** | Mock-only for now; pure UI |
| Community Tab Overview & Recent Articles/Posts | `HomeActivityPanel` (forum threads + new decks) | Already exists in spirit; needs visual treatment to match the wide bottom-strip footprint |

## Key constraints noted

- Theme tokens must drive every color decision — no hardcoded hex.
- Avoid streak-guilt language (per `app vision`: "no streak guilt, no fake gamification"). Quests should be opt-in framing.
- Mobile: target single-column stack, hero first, social/community last.
- "Pretty" Account Overview means a visual lift — sparkline / progress ring / kana-mastery dial — not just bigger text.
- Greenfield boxes (Quests, Social) ship as mock UI with a clear `// TODO: wire to backend` boundary so they don't pretend to be real.

## Open questions before design

1. Mockup format — HTML preview or live React dev route gated by `import.meta.env.DEV`?
2. Scope for this pass — visual layout only, or include real wiring for the scaffolded boxes (Progress / Flashcards / Recent Practice / Community)?
3. Quests / Social — mock-only this round, or define the data model now even if backend defers?
4. Should returning-user hero replace the welcome heading + continue-card combo entirely, or layer over them?
5. Nav restructure scope — Spencer mentioned "documenting movement on other places." Are we also touching the top nav / sidebar, or strictly the home page body?
