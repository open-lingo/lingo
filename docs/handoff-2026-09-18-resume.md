# Resume handoff — written 2026-09-17 evening at the weekly usage limit

Read THIS file and the last 40 lines of `docs/handoff-2026-09-17-project-review.md`. Do not re-read the review docs, lane reports or feedback docs unless a step below points at one — the facts are here.

## 1. Where we are

- **Main = d09abf79** (pushed 18:3x Pacific): every 2026-09-17 lane is on it — builds 26–28 content, A7g (m42 clip), A10 (branded sign-in handoff + Auth0 page branding LIVE + auth0-react 2.26), A3b (breadcrumbs + Send diagnostics), B28A/B28B (all ten build-28 items #186–#195), A11 (dev-only devlog channel + device dev-build script), A5d (judge calibration), verdict-cache key fix, CI split (render gate nightly), KanjiVG data for 練習掃除.
- **Build 29** was uploading from that SHA when we stopped — check `$S/mobile/asc-post29.log` (`review 1: APPROVED` = done) or App Store Connect. If it never uploaded: `cd lingo && git merge --ff-only d09abf79` in the main checkout, bump pbxproj to 29, `UPLOAD=1 zsh $S/mobile/release-b29.sh` then `zsh $S/mobile/asc-post29.sh` (both scripts exist, VER=29 in both). `$S` = the session scratchpad; if it is gone (reboot), rebuild the two scripts from `docs/handoff-2026-09-17-project-review.md`'s release notes.
- **lingo-core main = 4bb1037, deployed**: telemetry errors + diagnostics endpoints, access log now `user=<sha256(sub)[:8]> platform=ios|android|web`.
- **Auth0 tenant**: branding applied (rollback JSON in `scripts/auth0/rollback/`), no custom domain yet (403 = card on file needed).
- **iPad** 00008103-000925E41A29A01E is paired to this Mac; Developer Mode was still OFF.

## 2. Spencer's steps (only he can do these)

1. Walk build 29; sign out and back in once (library bump + branded handoff).
2. Auth0 dashboard → Settings → Billing → card on file → tell Fable → `login.openlingoapp.com` + Route 53 CNAME + page template (`scripts/auth0/page-template.html`, `apply-branding.mjs`).
3. iPad: Settings → Privacy & Security → Developer Mode → on → restart → tell Fable.
4. In the Sync panel: tap **Send diagnostics** and read the 6-char code; **Copy tap replay** after any bad build step and paste it.
5. Decisions still open: docs/project-review-2026-09-17-decisions-and-proposals.md §2/§4 (content packs, dict out of install, learner mix by course, Play closed test, VoiceOver run).

## 3. Resume steps, token-efficient

1. `git -C lingo/.claude/worktrees/feedback-b12 status` + `git log --oneline origin/main..HEAD` — expect nothing unpushed.
2. Read ONLY: this file, ledger tail, `docs/user-feedback/2026-09-17-testflight-b28.md` §2 if a b28 item recurs. Pull new TestFlight feedback with `node scripts/asc/pull-feedback.mjs` and read only rows ≥ 196.
3. Work in Sonnet lanes (branch-per-lane, ≤3), batch 2–3 lane merges per push, preflight once per push in `$S/b26-wt` (needs the JA sidecar + JMdict: `docs/preflight-2026-09-17.md` §8). Fable reads reports, merges, pushes, builds — no inline research it can delegate.
4. Do not re-run the judge grid, the mutation sweep or the calibration; their outputs are committed.

## 4. Next plans — finalize the UI experience

Ordered by user impact; each is one Sonnet lane unless noted.

1. **Build 29 walk fixes** (Spencer's rows ≥ 196) — the recurring classes to expect: tile sizing (use `npm run sim:replay` goldens + `--simulate build`), kanji reveal repaint (#186 fix is unproven live — verify 家/いえ on device), dialogue_listen at 125 % with 3-line transcripts (pre-existing overlap, needs a measured fix), `Feedback.tsx` miss-path explanation clamp (every non-cloze graded step).
2. **Cross-device sync** — install the dev build on the iPad (`scripts/mobile/dev-build-device.sh 00008103-000925E41A29A01E`, `npm run dev:lan`), arm `lingo:devlog`, do one lesson on each device, run `scripts/devlog/sync-timeline.mjs`. Server view showed 6 lesson batches vs 1 SRS sync in 6 h: suspect the SRS queue, not lesson progress.
3. **Sign-in polish** — custom domain + page template once the card is on file; support email on the tenant; verify the branded page on a phone.
4. **Accessibility close-out** — VoiceOver script (docs/accessibility-2026-09-17.md), MCQ Play button under the a11y bypass (A5e finding), reduced-motion pass on the new AuthHandoff.
5. **Content defects surfaced by the calibration sets** — ES/FR 3–4 each (docs/judge-calibration-2026-09-17.md; FR "je n'habite pas le chocolat"), FR Q3's 13 compositional tiles (decisions doc §3).
6. **Small known reds** — gate-mutations Linux ERROR (1 of 181 sim-capture tests fails only on the runner; the next run prints the `not ok` line), errorReporter ignore-list for the benign ResizeObserver message, devlog + Send-diagnostics on-device proofs (skipped at the stop).
7. **Bigger, needs a decision first** — Vite 8 / TS 7 / Vitest 5 (spike branches `spike/*` exist, no doc yet), dnd-kit replacement, content packs, Play closed test (12 testers × 14 days).
