# Task: Performance Budgeting & Planning

**Context:** Open Lingo will grow to include lesson engine, SRS, theme engine, marketplace, analytics, possibly AI, and mobile support. Without discipline, the bundle grows huge and mobile gets slow. Learning apps must feel snappy.

**Status:** Investigation / planning — not implementation yet.

## What Is Performance Budgeting?

Decide how fast the app must feel, and enforce limits so it stays that way.

Instead of: writing features → watching bundle grow → realizing mobile takes 6 seconds to load  
You set guardrails.

## Goals

1. **Investigate** current bundle size and structure
2. **Plan** code-splitting strategy (route-level lazy loading)
3. **Define** performance budget targets
4. **Document** rules and tooling for the team

## Code Splitting Strategy

### Route-level lazy loading (candidates)

| Route / area        | Lazy? | Rationale                        |
|---------------------|-------|----------------------------------|
| Lesson engine       | No    | Critical path                    |
| App shell, auth     | No    | Critical path                    |
| Theme engine        | No    | Core UX                          |
| Marketplace         | Yes   | Not critical for first load      |
| Theme editor        | Yes   | Rarely used                      |
| Admin dashboard     | Yes   | Rarely used                      |
| Settings page       | Yes   | Rarely used                      |
| Analytics dashboard | Yes   | Future, rarely used              |
| AI features         | Yes   | Future, heavy                    |

### React lazy loading pattern

```tsx
const Marketplace = React.lazy(() => import("./Marketplace"));
```

Use with `<Suspense>` at route boundaries.

## Performance Budget Targets

| Metric              | Target                     |
|---------------------|----------------------------|
| Initial JS (gzip)   | < 200–300 KB               |
| Time to interactive | < 2–3 s on mid-tier device |
| Route transitions   | < 200 ms perceived         |
| Lesson interaction  | Instant (no blocking)      |

## Measuring

- **Bundle size**: `npm run build` — inspect output (e.g. `dist/assets/index-*.js`)
- **Profiling**: Chrome DevTools → Performance tab; look for long script evaluation, big scripting chunks, repeated re-renders
- Early on: just track bundle size growth

## Rules to Avoid

1. **Avoid heavy UI libraries** — Tree-shake; don't `import *` from icon packs
2. **Keep lesson engine lean** — Localized state; avoid complex recalculations and deep re-renders
3. **Avoid global state re-renders** — ThemeProvider / context should not cause whole-app re-renders; use CSS vars where possible
4. **Don't premature optimize** — use `useMemo`, `useCallback`, `React.memo` only if profiling shows a problem
5. **Don't put giant JSON in the bundle** — Load from API/CDN
6. **Don't import entire utility libraries** — Import only what you need

## Mobile Considerations (future)

- React Native: JS thread must not block
- Heavy animations cause stutter
- Avoid parsing large lesson JSON synchronously
- Avoid huge arrays in memory during render

## Deliverables (investigation phase)

- [ ] Measure current bundle size (main chunk gzipped)
- [ ] Audit routes and identify lazy-load candidates
- [ ] Propose route-level `React.lazy` structure
- [ ] Document initial budget (e.g. main < 300 KB)
- [ ] Add bundle size tracking to CI or build (optional, later)

## Out of scope (for now)

- Complex metrics or RUM
- React Native–specific optimization
- Full profiling infrastructure

## Files to explore

- `src/routes/*` — route definitions
- `vite.config.*` — build / chunk config
- `package.json` — dependencies (audit for heavy libs)
