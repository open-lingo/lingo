# emoji-refit pipeline

Re-fits vocab-card emoji across all four courses (ja, ko, es, fr): finds where
the current emoji is a weak or indirect cue, proposes better candidates, and
filters those candidates deterministically before any of it reaches a human.

All steps read/write under one `--out` directory (default `artifacts/emoji-refit`,
gitignored). Every step is resumable — re-running it skips work already on disk
unless you pass `--force`.

## The five steps, in order

1. **Inventory** (vitest, not a script — the registries are TS with the vite
   alias):
   ```bash
   EMOJI_INVENTORY_EMIT=1 EMOJI_REFIT_OUT=<out> \
     npx vitest run src/features/languages/__tests__/emojiInventory.emit.test.ts
   ```
   Writes `<out>/inventory.json`: every vocab/particle/phrase atom in every
   course, its current emoji (if any), and JA's `blocked`/`note`/`pos` extras.
   Skipped by default in the normal suite (gated on `EMOJI_INVENTORY_EMIT=1`).

2. **Score** — local 122B judges fit of the current emoji and proposes
   candidates, in batches of 8:
   ```bash
   node scripts/emoji-refit/score.mjs --out <out> [--course ja] [--force]
   ```
   Writes `<out>/scores/<course>-<batchIndex>.json` per batch (resumable —
   existing batch files are skipped) and a merged `<out>/scores.json`.

3. **Check** — deterministic filter over the model's candidates (Noto
   availability, digit/keycap/flag rejection, in-course collisions), and
   builds the frontier audit set:
   ```bash
   node scripts/emoji-refit/check.mjs --out <out> [--root <repo>]
   ```
   Writes `<out>/noto-index.json` (cached upstream Noto svg/ listing),
   `<out>/checked.json` (scores + per-candidate check), and `<out>/flagged.json`
   — every item with an emoji that scored `fit <= 3` or `indirect`, plus every
   gap (word with no emoji), sorted by course then module.

4. **Audit** — human/frontier, over `flagged.json`. Read every flagged row,
   pick (or reject) a replacement emoji from its checked candidates, and write
   the decisions by hand to `<out>/decisions.json`:
   ```json
   [{ "id": "ja:ike", "action": "replace", "emoji": "🪷" }]
   ```
   **This step is never automatic.** `score.mjs`/`check.mjs` narrow the pool
   and reject unusable candidates, but a vocab gate's pass rate is not a
   quality measure — only a human reading the actual row decides what a
   learner should see. No script writes `decisions.json`.

5. **Art / apply** — takes `decisions.json` and updates the course atom
   files' `emoji:` fields (and vendors any new Noto SVG under
   `src/pub/noto-emoji/svg/` if not already present), one atom at a time,
   with an explicit diff to review before commit. (Implemented in a later
   Wave C task.)

## `--out` convention

Every script takes `--out <dir>` (default `artifacts/emoji-refit`) and reads/
writes exclusively under it — no other cross-step state. Point every step at
the same `--out` for one run. In this repo the convention is
`/Users/lichfield/Documents/projects/lingle/lingo/artifacts/emoji-refit`
(gitignored), so pipeline outputs outlive whatever worktree produced them.
