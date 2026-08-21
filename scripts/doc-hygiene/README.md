# Doc-Hygiene — the weekly context-rot cleanup process

A semi-autonomous loop that hunts **context rot** — stale, contradictory,
duplicated, or mis-indexed docs that silently mislead future readers (human or
model) — and cleans it up on an isolated branch you review before merging.

The local 122B/coder do the grunt (scanning judgment, triage, drafting fixes);
a frontier reviewer (or you) adjudicates the judgment queue. Deterministic JS
scans compute ground truth so no model tokens are spent on facts a regex knows.
See `GOAL.md` for the full rubric and guardrails.

## Run it (weekly)

```
node scripts/doc-hygiene/run.mjs            # moderate auto-apply (default)
node scripts/doc-hygiene/run.mjs --apply none   # report-only, apply nothing
```

Each run:
1. spins a fresh worktree + branch `doc-hygiene/<YYYY-MM-DD>` off the current
   `main` HEAD (so it sees this week's docs; last week's merged fixes don't
   re-surface),
2. runs the scans + local-model triage + repoint-proposal generation,
3. auto-applies **only** the safe reversible category (archive a self-declared-
   dead doc that has zero inbound references),
4. leaves everything on the branch with a `docs/hygiene/REPORT.md`,
   `LEDGER.md`, and `repoint-proposals.md`.

Then **you review and merge what you want** — nothing merges automatically:
```
cd ../.doc-hygiene-worktrees/<date>
open docs/hygiene/REPORT.md docs/hygiene/repoint-proposals.md
git -C <main> merge doc-hygiene/<date>     # or cherry-pick individual fixes
```

## What auto-applies vs. what's queued (Moderate tier)

- **Auto-applied:** archive a doc whose top matter declares it dead AND which
  nothing references (a `git mv` — can't break a link). In practice this fires
  rarely: most dead docs are still cross-referenced.
- **Proposed for your approval** (`repoint-proposals.md`): repoint-then-archive
  — the coder drafts exact edits to repoint each referrer at the dead doc's
  named successor, then archive. These are mechanically exact but can be
  *semantically* wrong (a prose mention of a historical doc may not want the
  successor), so a human approves each.
- **Queued to `LEDGER.md`:** dead index links, unlisted docs, contradictions,
  and any doc with no successor named — judgment calls.

## The scanners (deterministic, testable)

- `index-audit.mjs` — INDEX↔reality drift: dead links (subdir + self-documented
  resolution to avoid false positives) and unlisted docs.
- `staleness-scan.mjs` — docs that DECLARE themselves dead via a top status
  banner (not docs that merely mention "stale").
- `refs.mjs` — inbound-reference matching (extension-agnostic stem match).
- `repoint.mjs` — successor extraction + repoint-edit proposals.

Run the tests: `node --test scripts/doc-hygiene/*.test.mjs`

## Hard rules (see GOAL.md)

Isolated branch only; never touch the shared tree mid-run; explicit-path commits;
preserve every true claim; no silent coverage caps; measure before believing
(hashes, not sizes). The local model's verdict never *decides* an archive — an
objective signal decides and the model only *vetoes* false positives.
