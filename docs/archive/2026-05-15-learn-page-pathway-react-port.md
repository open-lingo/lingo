> **Status: ARCHIVED — SHIPPED.** Work completed; kept for history. Archived 2026-07-20 (see docs/plan-code-reconciliation-2026-07-20.md §4).

# Learn Page Pathway — React Port

Status: spec ready, agent-executable. Reference mockup approved by user:
`/home/beast/projects/lingle/lingo/src/pub/learn-pathway-mockup.html`

Port the v3 HTML mockup into the React app. Replace the current
linear-list `MainCourseCard` + `CommunityModuleCard` with the accordion
pathway design.

---

## File map

### NEW files

| Path | Purpose |
|---|---|
| `src/features/learn/components/ModuleCard.tsx` | Accordion-card per module. Banner header (gradient + chevron) + body. Body content depends on state: `current` → full pathway + actions; `locked` → preview list + test-out; `completed` → collapsed shell only. |
| `src/features/learn/components/ModulePathway.tsx` | Snake-winding column of `PathwayNode`s inside the current module's body. Owns the curved SVG connector painter (re-runs on resize). |
| `src/features/learn/components/PathwayNode.tsx` | Single circular node — kana glyph inside, status-driven styles (locked / available / current / done), optional review badge, optional pulse + "Continue" flag. |
| `src/features/learn/components/ModulePreview.tsx` | Body shown for locked / preview modules: eyebrow + summary line + numbered lesson list + "Test out of Module N" button (with the explanatory caption). Collapsed by default; expands on click. |
| `src/features/learn/components/SideQuestCard.tsx` | Right-rail bonus deck card. Emoji + title + meta + progress ring. |
| `src/features/learn/components/ProfileCard.tsx` | Right-rail top: avatar + username + level + stats grid (streak/XP/coins) + Shop button. |
| `src/features/learn/components/ResumeBar.tsx` | Sticky pill at bottom of main column — "Current: X · Hiragana" + Return button. |
| `src/features/learn/components/pathway.css` | Module-scoped styles for nodes / path connectors / module banners. Tailwind handles layout; raw CSS handles the visual lift (box-shadow stacking, conic-gradient progress rings, snake offsets via `data-pos` attribute, pulse keyframes). |
| `src/features/learn/useModuleAccordion.ts` | Hook: persists per-course module open/collapsed state to localStorage. Returns `{ isOpen, toggle, expandModule }`. Initial state: current module open, others closed. |
| `src/features/learn/sideQuests.ts` | Mock side-quest data + types. |

### MODIFIED files

| Path | Change |
|---|---|
| `src/features/learn/LearnPage.tsx` | Rewrite. Drop `MainCourseCard` + the community section. New layout: two-column grid (main pathway + side rail), `ResumeBar` sticky at bottom. Keep dev panel. |
| `src/shared/domain/course.ts` | Extend `Module` with optional `accent: { from: string; to: string }` (gradient endpoints). Add `SideQuest` type. Add optional `course.sideQuests`. Keep all existing fields untouched. |
| `src/shared/domain/mockCourse.ts` | Add gradient accent to each JA module (M1 emerald, M2 indigo→violet, M3 pink→rose, M4 amber, M5 sky→blue, M6 teal). Add `sideQuests` array. Insert M0 "Onboarding · Welcome to Japanese" as a completed-by-default module (or treat the existing alphabet-only first lesson as M0 — see implementation note below). Stub the future modules (M4 Numbers, M5 Greetings, M6 Sentences) as `comingSoon: true` with 0 lessons each, locked. |
| `src/features/learn/components/index.ts` | Re-export the new components. Keep the old re-exports for now (don't break imports outside Learn). |

### LEFT IN PLACE (do NOT touch)

- `src/features/learn/components/MainCourseCard.tsx` — orphaned but kept until we're sure nothing else imports it. Remove in a follow-up pass.
- `src/features/learn/components/CommunityModuleCard.tsx` — orphaned but kept for the same reason.
- `src/features/learn/moduleProgress.ts` — `getCurrentModuleIndex`, `getModuleStatus`, `getNextLessonIndex`, `isLessonLocked` are reused by the new components. No changes.
- `src/features/learn/LearnLayout.tsx` — keep the outer `<h1>nav.learn</h1>` for now (the page-title in the mockup is local to LearnPage). The top-bar tab redesign (Learn / Practice / Social) is OUT OF SCOPE for this PR — touches the shared layout.

---

## Data model additions

### `Module.accent`
```ts
export type ModuleAccent = {
  from: string; // CSS color (e.g. "#059669")
  to: string;   // CSS color (e.g. "#047857")
};

export type Module = {
  // ...existing
  accent?: ModuleAccent;
  comingSoon?: boolean;
};
```

Module accent map (use these exact values to match the mockup):
| Module | from → to |
|---|---|
| M0 Onboarding (or alphabet preface) | surface gradient (no color) — use the "completed" treatment from the mockup |
| M1 Hiragana | `#059669` → `#047857` |
| M2 Voicing | `#6366f1` → `#8b5cf6` |
| M3 Katakana | `#ec4899` → `#db2777` |
| M4 Numbers & Counting | `#f59e0b` → `#d97706` |
| M5 Greetings & Self | `#0ea5e9` → `#0284c7` |
| M6 Simple Sentences | `#14b8a6` → `#0d9488` |

### `SideQuest`
```ts
export type SideQuest = {
  id: string;
  title: string;
  emoji: string;
  meta: string;             // e.g. "12 words · senpai, kawaii…"
  unlockAfter?: string;     // lesson or module id; undefined = available now
  progress: number;         // 0–100
  isDaily?: boolean;        // styled differently (warning bg)
};

export type Course = {
  // ...existing
  sideQuests?: SideQuest[];
};
```

Seed JA side quests:
| id | emoji | title | meta | unlockAfter |
|---|---|---|---|---|
| `anime-vocab` | 🌸 | Anime Vocab | "12 words · senpai, kawaii…" | (none — available now) |
| `travel-specifics` | ✈️ | Travel Specifics | "10 words · subway, hotel, taxi" | `ja-m1-complete` |
| `festivals-culture` | ⛩️ | Festivals & Culture | "8 words · 桜, 祭, 神社" | `ja-m2-complete` |
| `gaming-vocab` | 🎮 | Gaming Vocab | "14 words · attack, level up, boss" | `ja-m2-complete` |
| `daily-challenge` | ⚡ | Daily Challenge | "+20 XP · 60s timer" | (none — always available) `isDaily: true` |

These don't need lessons wired up — clicking is a no-op for now (TODO comment).

### `UserStats` (mock data only — wire to localStorage later)
```ts
// src/features/learn/components/ProfileCard.tsx (local to component for MVP)
const MOCK_STATS = {
  username: "spencer",
  level: "A1 Beginner · 38% to A2",
  streak: 4,
  xpToday: 32,
  coins: 24,
};
```

Real wiring deferred. ProfileCard takes these as props from LearnPage; LearnPage hardcodes for MVP.

---

## Component contracts

### `<PathwayNode>`

```tsx
type PathwayNodeProps = {
  glyph: string;             // "あ", "か", "きゃ"
  label: string;             // "Vowels", "Ka-row", "Yōon 1"
  state: "locked" | "available" | "current" | "done";
  positionOffset: -3 | -2 | -1 | 0 | 1 | 2 | 3;  // snake offset bucket
  reviewCount?: number;      // shows "x{N}" badge if > 0
  showContinueFlag?: boolean; // current node only
  onClick?: () => void;
};
```

Render via `data-state` + `data-pos` attributes; CSS in `pathway.css` styles the rest. Locked nodes are pointer-disabled (`cursor: not-allowed`, no onClick).

### `<ModulePathway>`

```tsx
type ModulePathwayProps = {
  lessons: Lesson[];                  // current module's lessons
  completedIds: ReadonlySet<string>;
  currentLessonId: string;
  isLessonLocked: (id: string) => boolean;
  reviewCounts?: Record<string, number>;
  onLessonClick: (lesson: Lesson) => void;
};
```

- Walks `lessons` to assign offsets: pattern `[0, 2, 3, 2, 0, -2, -3, -2, 0, 2, 3, 2, 0, …]` (matches the mockup, big "S" curves)
- Renders a `<PathwayNode>` per lesson
- Renders a `<svg class="path-svg">` absolutely-positioned underneath; on mount + window resize, computes node center coordinates and paints a single cubic-bezier `<path>` connecting them
- Resize observer cleans up on unmount

Extracted helper: `paintPath(svgEl: SVGElement, nodes: HTMLElement[])` — pure function, easy to unit-test.

### `<ModuleCard>`

```tsx
type ModuleCardProps = {
  module: Module;
  moduleNumber: number;         // 0, 1, 2…
  status: "completed" | "current" | "locked";
  isOpen: boolean;
  onToggleOpen: () => void;
  // Pathway slot — only rendered when status==="current" and isOpen
  pathway?: React.ReactNode;
  // Preview slot — only rendered when status==="locked" and isOpen
  preview?: React.ReactNode;
  // Bottom action slot
  actions?: React.ReactNode;
};
```

The card renders the gradient banner from `module.accent` (or the completed-card-treatment if status==="completed"), the chevron, the status pill. Body is opened/closed via `data-open`. Click-anywhere-on-header toggles open. Clicks inside the body don't bubble to the header toggle (use `event.stopPropagation` on `.module-body`).

### `<ResumeBar>`

```tsx
type ResumeBarProps = {
  currentLessonTitle: string;
  currentModuleTitle: string;
  onResume: () => void;
};
```

Sticky pill at `bottom: 12px` (desktop) / `bottom: 80px` (mobile, above bottom-nav if added later). Max-width 420px, centered. Hidden if there's no current lesson (e.g. all complete).

### `<SideQuestCard>`

Same shape as the mockup. Props: `{ quest: SideQuest; locked: boolean; onClick?: () => void }`.

### `<ProfileCard>`

Props: `{ stats: UserStats; onOpenShop: () => void }`. Shop button is a no-op stub for MVP — opens an alert or a placeholder modal.

---

## State / hooks

### `useModuleAccordion(courseId, currentModuleId)`

```ts
type AccordionState = Record<string /* moduleId */, boolean>;

function useModuleAccordion(courseId: string, currentModuleId: string): {
  isOpen: (moduleId: string) => boolean;
  toggle: (moduleId: string) => void;
  expand: (moduleId: string) => void;
};
```

- localStorage key: `lingo_module_open_v1:${courseId}`
- First visit: current module open, others closed (regardless of stored state if no key exists)
- Subsequent visits: respect stored state
- `expand` is used by the test-out flow (after testing-out of M2, M3 expands automatically)

---

## LearnPage skeleton

```tsx
export function LearnPage() {
  // ... existing course/progress/devUnlock setup (preserve verbatim)

  const { isOpen, toggle, expand } = useModuleAccordion(course.id, currentModule.id);
  const currentLesson = currentModule.lessons[nextIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-9">
      <section>
        <h1 className="text-2xl font-bold mb-1 tracking-tight">{course.title}</h1>
        <p className="text-sm text-text-muted mb-5">
          Tap a module to expand. The pulsing node is what we suggest — but you choose.
        </p>

        {course.modules.map((mod, i) => (
          <ModuleCard
            key={mod.id}
            module={mod}
            moduleNumber={i}
            status={getModuleStatus(i, completedSet, course.modules)}
            isOpen={isOpen(mod.id)}
            onToggleOpen={() => toggle(mod.id)}
            pathway={i === currentIdx ? <ModulePathway ... /> : undefined}
            preview={i !== currentIdx ? <ModulePreview ... /> : undefined}
            actions={i === currentIdx ? (
              <>
                <Button onClick={resumeCurrent}>Resume {currentLesson?.title}</Button>
                <Button variant="secondary" onClick={() => testOut(mod.id)}>Test out of {mod.title}</Button>
              </>
            ) : null}
          />
        ))}

        <ResumeBar
          currentLessonTitle={currentLesson?.title ?? ""}
          currentModuleTitle={currentModule.title}
          onResume={resumeCurrent}
        />
      </section>

      <aside className="lg:mt-[78px]">
        <ProfileCard stats={MOCK_STATS} onOpenShop={() => alert("Shop coming soon")} />
        <SideQuests quests={course.sideQuests ?? []} unlockMap={...} />
      </aside>

      <DevPanel ... />
    </div>
  );
}
```

`testOut(moduleId)`: stub for MVP — `console.log("test out of", moduleId)` + alert. Don't auto-mark lessons complete yet (wait for real test-out modal in a follow-up).

---

## Styling

Most of the mockup's CSS comes from inline tokens that already exist in
the Tailwind config. The remaining custom CSS (pathway snake offsets,
conic-gradient progress rings, pulse keyframes, curved SVG connector
stroke styling) goes in `src/features/learn/components/pathway.css`,
imported at the top of `ModulePathway.tsx` (Vite handles the CSS).

Tailwind classes cover: layout grid, card padding, typography, colors
(via theme tokens), borders, shadows. Use `bg-surface`, `border-border`,
`text-text-primary`, `bg-accent`, etc.

Custom CSS handles only:
- `.path-row[data-pos="..."]` offsets (snake)
- `.node-disc` pseudo-elements (lock badge, check badge)
- `.node-disc::before` ring (progress conic-gradient)
- `@keyframes pulse` + `.node[data-state="current"] .node-disc` animation
- `.path-svg path` (curved bezier connector)
- `.continue-flag::after` (callout tail)

Reuse the **exact** values from the approved mockup HTML — no
re-deriving sizes. Copy the relevant CSS blocks verbatim from
`src/pub/learn-pathway-mockup.html` into `pathway.css`, then convert
`:root` / `html.dark` vars to use the existing Tailwind theme tokens
(e.g. `var(--color-border)` → `theme(colors.border.DEFAULT)` — or just
keep CSS vars since they're already wired in `web-adapter.ts`).

---

## Implementation order

1. **Data model first.** Add `ModuleAccent`, `comingSoon`, `SideQuest`,
   `course.sideQuests` to `course.ts`. Run `npm run build` — TS errors
   only on this layer.
2. **Mock data.** Update `mockCourse.ts` with accents + side quests +
   stub M4-M6 modules (`comingSoon: true`, empty `lessons: []`).
   Build clean.
3. **`<PathwayNode>` + `pathway.css`.** Render a static demo node in a
   throwaway page or in LearnPage temporarily to verify it looks right
   against the mockup screenshot.
4. **`<ModulePathway>`.** Wire to the existing `currentModule.lessons`.
   Verify the snake renders at the same shape as the mockup.
5. **`<ModuleCard>`.** Wrap the path. Render the banner + chevron.
   Test the open/closed toggle.
6. **`<ModulePreview>`.** For locked modules; click-to-expand.
7. **`<ProfileCard>`** + **`<SideQuestCard>`**. Render the rail.
8. **`<ResumeBar>`.** Sticky bar at bottom.
9. **`useModuleAccordion` hook.** Replace ad-hoc state with the hook.
10. **LearnPage rewrite.** Compose everything.
11. **Mobile-responsive pass.** Confirm `<lg` collapses correctly:
    profile card moves to top, side quests slot in below, resume bar
    floats above any future bottom-nav.
12. **Build + tests.**
13. **Smoke check** at `/{lang}/learn` with `?dev=1` to verify the
    pathway looks right with all modules unlocked.

---

## Verification

- `npm run build` — must pass clean
- `npm run test:run` — 17/17 (no test changes expected — existing tests
  cover SRS engine + curriculum data, not Learn page)
- Manual smoke on dev server at port 5173 across 3 viewports:
  390px, 820px, 1280px (use Chromium devtools or Playwright if quick)
- No regressions on alphabet practice route (which shares
  `getMockCourse` data)

---

## Out of scope (defer)

- TopBar / nav-tabs redesign (Learn / Practice / Social) — touches
  `LearnLayout`; user said start with Learn-page-only scope.
- Mobile bottom-nav — depends on TopBar redesign decision.
- Shop / store wiring — stubbed.
- Daily Challenge logic — stubbed (just shows the card).
- Test-out modal + auto-complete-on-pass — stubbed (button shows alert).
- TTS license audit — user-deferred to post-MVP.
- Removing the orphaned `MainCourseCard` / `CommunityModuleCard` — leave
  for a follow-up cleanup PR.

---

## Risks

- The path-painter relies on real DOM measurements (`getBoundingClientRect`)
  in `useEffect`. Test in React strict-mode double-render to make sure
  the SVG paints correctly on mount.
- Conic-gradient progress rings: 100% browser support since 2022, but
  smoke-check on Safari (which the user can hit via the dev server) to
  be safe.
- `data-pos` snake offsets use `translateX` — confirm they don't break
  hit-targets for the underlying anchor tags. They shouldn't.
- The accordion-toggle uses `event.target.closest(".path,.module-actions")`
  in the mockup to prevent inner clicks from collapsing the card. In
  React, do this with `event.stopPropagation` on the path / actions
  containers instead — cleaner.
