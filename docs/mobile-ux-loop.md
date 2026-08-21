# The mobile UX improvement loop (process)

A semi-autonomous loop that finds mobile UI/UX + stickiness improvements, prototypes
them in isolation, and surfaces a ranked, evidence-backed shortlist — without shipping
anything. First run: 2026-08-20 (proving wave, 3 surfaces). See the review artifact for
that wave's output.

## The one principle
Split work by what each tier is actually good at. Local models on the M5 Max
(`local-model-stack`) measurably CANNOT rank taste — they confidently pick wrong. So:

| tier | job | cost |
|---|---|---|
| **Local (free)** | high-volume grunt: faithful capture; 122B vision judge enumerating problems against a fixed rubric | electricity |
| **Frontier** | the taste half: ideation, ranking, and the *design* of each diff | tokens |
| **Isolation** | a throwaway git worktree off clean `main`; nothing merged; safe beside other sessions | — |

Do NOT route the Claude Code harness at Ollama for this (`ANTHROPIC_BASE_URL` is
unsupported + session-wide). Shell out to Ollama via the `scripts/draft` pattern instead.

## The stages
1. **Setup** — `git worktree add --detach <wt> main`; symlink `node_modules` + `.auth`;
   start a bypass dev server: `VITE_DEV_AUTH_BYPASS=true npm run dev -- --port 5280 --strictPort`.
2. **Capture (local, free)** — `scripts/ux-loop/capture.mjs <outDir> <label> <route> [viewport]`.
   Faithful where `mobile-matrix.mjs` is not: sets `isMobile`+`hasTouch` (so `pointer:coarse`
   matches — the forced-map, no hover), pushes real safe-area insets over CDP
   (`Emulation.setSafeAreaInsetsOverride`, per `tests/mobile/_seed.ts`), and seeds past every
   modal (lang, ftue, funding, cookie, `lingo_placement_dismissed_v2_*`). Viewports from the
   shared `tests/mobile/routes.mjs` matrix (`iphone-14-promax` = the real test device).
3. **Discover (local + frontier)** — `scripts/ux-loop/judge-ux.mjs <dir>` runs the 122B vision
   judge, which ENUMERATES problems only (rubric grounded in `mobile-ui-testing-2026-08-09.md`);
   the frontier reads a couple of surfaces itself and grounds stickiness ideas in the existing
   research (`social-engagement-*`, `srs-memory-retention-*`, `user-feedback/`).
4. **Measure, don't eyeball** — `scripts/ux-loop/measure.mjs <route> [viewport]` returns real
   `getBoundingClientRect` px (captures are DSR ×3 — eyeballing whitespace off them lies).
   This is where over-generated proposals get pruned: a below-fold CTA that isn't, a dead band
   that's mostly the notch inset.
5. **Prototype (frontier fan-out)** — a `Workflow` of N read-only agents, one per proposal,
   each returning structured `{file, oldString, newString}` edits (NOT applying them — worktree
   isolation for agents didn't initialize here; read-only + return-edits is safer anyway).
   `apply-capture.mjs` applies each proposal's edits into the worktree, captures the after-shot
   against the live dev server, then `git checkout --` reverts. Isolated before/after per proposal.
6. **Rank + present** — frontier ranks on evidence (before/after + measurement + self-critique);
   top 5 → a before/after artifact. Nothing merges until the human picks.

## What the proving wave taught
- Over-generation + measurement pruning works: 8 → dropped 3 (already-shipped, no on-surface
  offender, measured-not-below-fold) → 5 recommended.
- The 122B vision judge is flaky on very tall full-page PNGs (4/6 empty — it exhausts
  `num_predict` reasoning about a huge image). Feed it viewport-height shots, not `--full`,
  and raise `num_predict`. Its wins here: 1 genuinely-new finding + corroboration; FPs cheap.
- Tooling lives (uncommitted) in `scripts/ux-loop/` in the wave worktree. Commit it to make
  the loop a first-class, re-runnable process. Nearest prior art already in-repo: `throttle.mjs`
  governor, `runner.mjs` queue, `judge-visual.mjs`, `mobile-matrix.mjs`, the `screenshot` skill,
  the haiku `gate-runner` agent — plus an un-installed official `ralph-loop` plugin in the cache.
