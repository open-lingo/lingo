# Handoff — TestFlight feedback wave 2 (items 36–55), 2026-09-07

Paused at Spencer's request mid-afternoon 2026-09-07. Everything is committed
on branch `feedback-2026-09-05` (26 commits on top of main `9808c41b`); the
worktree is clean. Nothing is merged, pushed, or on a device build.

## State

- Ledger: `docs/user-feedback/2026-09-05-testflight-b5-b6.md` — 55 items with
  statuses. Wave 2 (build 8, items 36–55) is all `fixed` except #54 (open,
  dialogue-comp spacing) and #55 (monitor).
- Live TestFlight: build 8 (approved 2026-09-06). Wave-2 fixes need build 9.
- Wave-2 commits: c1faad87 (furigana overhang, leading, いる/ご飯),
  3425933b (reserved audio slot), b332803f (typed grading edge punctuation),
  40612f16 (drag: live reorder + DragOverlay + hysteresis), 72424e01 (ledger,
  scope docs), then the mobile-fit commit (home min-w-0, practice shells, shop).

## Resume recipe

1. Worktree: `git worktree list` — if `wt-feedback` is gone (`/private/tmp`
   is wiped by OS updates), `git worktree prune && git worktree add <path>
   feedback-2026-09-05`, then `cp <main tree>/.env.native <worktree>/`.
2. Rebase onto main. Main has one new commit, 356a85a8 (ES session's
   `alsoAccepted` grader in `buildAcceptance.ts`). Conflict expected in
   `BuildSentenceStepView.tsx` and `lesson/types.ts` with fbf952e1: take
   main's grader, keep the m30 IR `alsoAccept` entry, and keep the
   `moduleCompiler.ts` hunk only if main's compiler does not already copy IR
   `alsoAccept` onto build steps.
3. Preflight (`npm run preflight` or the script package.json names), then
   build 9: bump `CURRENT_PROJECT_VERSION` to 9 in both pbxproj blocks, run
   the `release-b8.sh` chain from the 49583ccb scratchpad (or reconstruct:
   build:native → `env -u CAP_DEV_SERVER -u CAP_DEV_LOGGING npx cap sync ios`
   → grep-guard no `server` in capacitor.config.json → archive → export with
   ExportOptions.plist → altool upload). Then attach to External Beta and
   POST the beta review submission — approval has been ~1 min every time.
4. Device checks for Spencer on build 9: #1/#38 no sideways scroll on home,
   #36 忙しい flashcard, #46 drag a tile around a 9-tile tray, #48/#53 play
   button no longer jumps, #12 十 reveal.

## Open decisions (Spencer)

- Furigana below the 12px floor? That is the only way to shrink tile rows
  further (#50); the remaining 11px per row is the reading itself.
- Build the に time lesson (`docs/ja-time-ni-lesson-scope.md`)?
- Any-verb drill (`docs/practice-any-verb-drill-scope.md`) and particle
  training (`docs/practice-particle-training-scope.md`) — both costed.
- lingo-data: `pipeline/tts/speech_overrides_ja.json` + new
  `speech_overrides_ja-keita.json` are still uncommitted (clips already on CDN).

## Known loose ends

- `src/features/practice/data/drillUtils.ts` has its own trailing-only
  `normalizeTypedAnswer` (JA type-it drills) — not unified with
  `loose-match.ts`.
- #43 safe-area on the grammar review session was fixed by inspection
  (bypass account had nothing due, so no live screenshot).
- Drag harness: `artifacts/drag/drag-test.mjs` in the worktree (untracked;
  Chromium touch via CDP, reports mid-drag overlaps and post-drop transforms).
