# Resume handoff — written 2026-09-17 evening at the weekly usage limit

Read THIS file and the last 40 lines of `docs/handoff-2026-09-17-project-review.md`. Do not re-read the review docs, lane reports or feedback docs unless a step below points at one — the facts are here.

## 0. Update 2026-09-18 — BUILD 32 APPROVED (afdade80, delivery 6400bec8; outcomes telemetry ON) after BUILD 31 (602eb1ff); APK from the b32 commit on the Desktop

Build 31 = the `feedback-2026-09-14` head after these merges: SYNC (progress:batch tag-abort race, one-time full SRS push, two-device proof), FB30 (#198–#205), CALIB (FR Q3 13→0, calibration extractor), TOOLS (`scripts/lane/`), QUESTS (mounted in beta; server 2a52084 deployed), GHOST (no spent-tile ghost, all bank sizes), SMALLREDS (kanji-catalog ratchet, errorReporter ignore-list, dialogue_listen 125 %, gate-mutations Linux), PACKS (dictionary.lazy OFF), TRAYUX doc. Main went RED on 602eb1ff (dict-loader test timeouts on CI, then a vi.mock leak under isolate:false in the unsharded deploy job) — fixed forward by CIFIX + CIFIX2; **6bbc77de GREEN, prod serves index-BZ3GplAO (build-31 content on the web too)**. Build 33 candidates merged on `feedback-2026-09-14` after b32: KANJICAT (full kanji catalogue). Lanes still running for build 33: CIFIX, GHOST follow-up (merged, unpushed), GLOSS, GHOST follow-up (listening_build/fill_blank ghost), SIMPROOF, INTROFLOOR, MAPPERF. To-dos: §7 below. Ledger: `docs/handoff-2026-09-17-project-review.md` tail.

## 1. Where we are (as of the 2026-09-17 stop)

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

## 5. Addendum (18:50) — build 29 + the iPad dev build

- **BUILD 29 APPROVED** (d09abf79, d864885b); **BUILD 30 APPROVED** (Sync & diagnostics row in the phone account menu, #196). Both devices should be on 30.
- The iPad dev build installed and the devlog channel WORKS (records arrived at `artifacts/devlog/ios-browser-*.jsonl`), but the app cannot sign in: auth0-spa-js throws "must run on a secure origin" because the LAN dev server is plain http. Next session: `brew install mkcert && mkcert -install && mkcert 10.15.12.130`, run Vite with `server.https` (add an env-gated option in vite.config.ts), serve `$(mkcert -CAROOT)/rootCA.pem` to the iPad (Safari → install profile → Settings → General → About → Certificate Trust Settings → full trust), then `scripts/mobile/dev-build-device.sh … --host 10.15.12.130 --port 5173` with `https://`. Until then the iPad should go back to TestFlight (delete the dev build, reinstall from TestFlight).
- Sync debugging without the dev build: build 29 on both devices → one lesson on the phone → Sync panel → Send diagnostics (code) → iPad pull → Send diagnostics (code) → `node scripts/ops/pull-diagnostics.mjs <CODE>` for each + CloudWatch `lingo.access` lines now carry `user=<hash> platform=ios`.

## 6. Cross-device sync — ROOT CAUSE FOUND (2026-09-17 18:58, from diagnostics code CGKYQD + DynamoDB)

Three numbers, same account, same minute:

| Where | Lessons completed | Due cards |
|---|---|---|
| Phone (build 29, Home screen) | **512 of 660** | 151 |
| Server (`lingo_progress` USER#37946008…) | **137** LESSON records, 170 attempts; modules with completions: m1–m6, m11, m28, m30, m34 (m12–m27, m29, m31–m33 have NONE) | 354 |
| iPad (build 29, CGKYQD session log) | **132** → learn map resumes at ja-m31-neo-1 | — |

So the phone's ~375 extra completions are the **test-out / placement seed** that never reached the server (the b19 "490-row batch vs cap 100" class: chunking shipped, but the server still holds only 137 lessons — either the chunks were never re-sent for the seeded lessons, or `progress/lessons/batch` rejects/ignores test-out-sourced rows — check lingo-core `app/progress` for the test-out day-rollup exemption (624e17be) and the client `applyPlacement.ts` / reconcile push set). The iPad faithfully shows what the server has, minus 5 (the newest m34 ones land on the next pull). SRS diverges the same way (phone 151 due vs server 354).

**Fix lane (next session, one Sonnet lane):** (1) reconcile-on-hydrate must push EVERY locally-completed lesson absent from `progress/me` (test-out seeded included, chunked ≤100, idempotent by clientAttemptId), and the server must accept them as completions (source=test_out, no XP, day-rollup exempt); (2) then the iPad pulls 512; (3) SRS: push the phone's full card set once (`srs/sync` full delta) so due counts match; (4) prove with the two-device timeline. Also: **the Sync panel is unreachable on phones** — the account menu (avatar) has no Sync entry and the bottom-tab layout has no mobile-menu button (Spencer, #196 screenshot). Add "Sync & diagnostics" to the account menu.

## 7. To-dos added 2026-09-18 (Spencer: "add the 5 things as to-dos and implement the easy ones")

| # | Item | Owner | Status |
|---|---|---|---|
| T1 | れんしゅうする class: kanji-catalog coverage gate (fail when any live atom with a kanji spelling has an uncatalogued character) + sim capture of the m34 `れんしゅうすることにする` listening_build step at 100 %/125 % as device evidence (b28 #194 left this open) | lane SMALLREDS | in progress |
| T2 | Judge-calibration content defects: ES 3–4 + FR 3–4 (`docs/judge-calibration-2026-09-17.md`; "je n'habite pas le chocolat") + FR Q3's 13 compositional tiles (decisions doc §3) | lane CALIB (queued behind the 4 running lanes) | queued |
| T3 | iPad dev build over HTTPS (mkcert + `server.https` env option in vite.config.ts + CA trust on the iPad) so both real devices stream devlog (§5 recipe) | Fable + Spencer (CA install on the iPad) | waiting for Spencer's nod |
| T4 | Small reds: gate-mutations 1/181 sim-capture test fails only on Linux (runs 35290858536, 35289114892 red; runner now prints the `not ok` line); errorReporter ignore-list for the benign "ResizeObserver loop completed with undelivered notifications"; dialogue_listen 125 % three-line-transcript overlap (b28 #195 residual, `docs/user-feedback/2026-09-17-testflight-b28.md` line ~72) | lane SMALLREDS | in progress |
| T5 | Accessibility close-out: run the VoiceOver script (`docs/accessibility-2026-09-17.md`), MCQ Play button under the a11y bypass (A5e finding), reduced-motion pass on AuthHandoff | needs Spencer's nod (device time) | waiting |

Spencer-only items still open: Auth0 card on file (custom login domain), Identity Center session length (8 h default → 7 d), decisions doc §2/§4 (content packs, dictionary out of the install, learner mix by course, Play closed test, VoiceOver run).
| T6 | New floor: an atom listed in a lesson's `introduces:` must appear in at least one sentence/beat of that lesson (FB30 found とお registered in m32-neo-5 with zero supporting sentence; `atomExposureAudit` only checks later exposure) — informational first, then enforce once the current count is known | lane INTROFLOOR | informational, 2 findings |
| D-とお | DECIDED option 1 → DONE (lane ORPHANS b54f1aff: とお intro + ほんが とお ある in m9-neo-3; clip c44053b0 staged) | — | done |
| T7 | Per-word difficulty statistics: `atom_outcome` event (flag `telemetry.atomOutcomes` OFF), CloudWatch log lines, weekly Logs Insights report script | lane STATS | in progress |
| T8 | Content packs phase 1 DONE behind `dictionary.lazy` (OFF): the kuromoji dict (17 MB, 12 files) is needed from the FIRST JA speaking step (recognizer returns kanji), so for JA learners it is the same bytes, just over the network at first launch; −19.9 MB (−26 %) only for non-JA installs. Keep OFF until the learner mix says otherwise. Phase 2 = per-course lesson-content packs (13 MB, wording fixes without a build) — the broader win | lead decision | flag OFF |
| T9 | Tile tray UX research (ghost vs collapse, answer-window sizing, "what would annoy a user", a11y) → proposal doc; huge-bank decisions deferred until then, bar = "everything fits on the screen" | lane TRAYUX | in progress |
| T10 | Quests: finish UI, mount in beta, recurring easy daily/weekly set via the async pipeline | lane QUESTS | in progress |
| T11 | Spent tiles: no ghost on normal banks either (TRAYUX P2 gap — normal banks keep a 0.4-opacity word copy; huge banks already fade to invisible); footprint frozen, neighbours never move, a11y hidden slot | lane GHOST | in progress |
| T12 | Lane toolset `scripts/lane/` (test.sh, find.mjs, step-url.mjs, stats.mjs, README) + efficiency rules in the lane-briefing skill — measured: 8–12 s per tool call is model latency, so cut calls and output bytes | lane TOOLS | in progress |
| T13 | Re-label the ES/FR calibration sets with the fixed extractor (16/80 rows were foils) | future lane | queued |
| D-catalog | Kanji catalog scope: the coverage sweep found 465 live kanji-bearing atoms, 300 uncatalogued (367 chars) — `N5_KANJI` is a curated subset, so "renshuu-class" inconsistencies (one verb in kana beside kanji siblings) remain possible for any uncatalogued word. Ratchet pinned at 367 (can only fall). Options: (1) catalogue every live N5/N4 Jōyō kanji progressively per module [Fable recommends — consistency is the complaint]; (2) keep the curated subset and add a per-step consistency check instead; (3) both | Spencer | open |
| T14 | One-command simulator proof `scripts/lane/sim-proof.sh` (lock, isolated port, both scales, verdict table, replay) — GHOST spent ~250 Bash calls on sim choreography | lane SIMPROOF | in progress |
| T15 | Lane-speed follow-ups: measure every lane with `scripts/lane/stats.mjs` at merge; next target is call COUNT (per-call latency already 12→5 s under the rules) | lead, ongoing | ongoing |
| D-かいた | DONE (lane ORPHANS: cloze きのう てがみを かいた in m16-neo-10; clip f883bbdb staged); Q11 2 → 0 | — | done |
| T16 | Torii portrait background at 2048² (source is 1024², upscaled 2.3×): generate with Spencer's 2026-09-09 flat-vector template process (seed 7, same prompt, 2048×2048, WebP + srcset) — spec in `$S/briefs/MAPPERF-report.md` §B; art generation is Spencer's | Spencer | open |
| T17 | Landscape pulse ring is now a filled soft disc (compositor-only) instead of a stroked ring — VISUAL CHANGE for Spencer to accept or reject on the iPad in build 32 | Spencer (walk) | open |
| T18 | ≥12-tile answers at 125 % sit 212 px behind the CTA (`ja-m42-neo-challenge?step=11`, stageFits FAIL; 2 % of listening_build) — now reproducible in one call with `scripts/lane/sim-proof.sh` | lane LONGANS | in progress |
| T19 | Content packs phase 2 (per-course packs, bundled m1–3 slice, schema gate, flag `content.packs` OFF, publish script) — ends "every wording fix needs a TestFlight build" | DONE behind the flag (87e5e4d6): native dist 52.4 → 37.2 MB (−29 %) with the flag on; cut-over = T20 |
| T20 | Content packs cut-over: upload `dist-content-packs/` to the CDN under `/content/v2/<contentVersion>/` (needs SSO), flip `content.packs`, then test-out loads a whole course with no module cap (`PlacementTestPage.tsx`) — cap it or prefetch before placement | lead + Spencer (SSO) | queued |
| T21 | Spencer decisions 2026-09-18 15:0x: D-とお/D-かいた = option 1 (lane ORPHANS); D-catalog = option 1, catalogue all live N5/N4 kanji per module (lane KANJICAT); font slider CAPPED at 125 % until a 140 % sweep (sent to lane LONGANS); `telemetry.atomOutcomes` ON for build 32 + lead monitors CloudWatch `lingo.atom_outcome` while Spencer plays (needs SSO); quest resets follow the device timezone (lane QUESTSTZ) | lanes | in progress |
| D-switchover | KANJICAT tripled the kana→kanji switchover backlog (124 → 405 words); review-host capacity (`MAX_SWITCHOVER_BEATS_PER_REVIEW = 2`, `kanjiRollout.ts:133`) is 171 words short, so ~42 % of newly eligible words would skip the graded switchover beat and switch via the fail-open grace window instead. Options: (1) raise the cap 2 → 3 per review [Fable recommends; +1 short beat per review] ; (2) leave at 2 and accept grace-window switchovers; (3) raise to 4 | Spencer | open |
| T22 | module-gate's TTS-deck-emit stage reports 6 pre-existing course-wide JA strings without clips (not Q7-visible step types) — list + generate in the next TTS batch | next TTS lane | queued |
| T23 | New-user first login = ~26 s 404 storm until `POST /users/me` (Riley, Android, 21:39:47–21:40:13 UTC): server auto-provisions on boot/users/me + client orders provisioning before the boot wave | DONE client (eaa8c84d); server 86de731 pushes with build 33 (T27) |
| T24 | In-lesson "Report a problem" (note + diagnostics code) for Android testers + Home menu entry; `docs/android-tester-onboarding.md` | DONE (9ddad1f4; server dde7deb pushes with build 33) |
| T25 | Sync: the 491-row test-out upload fails client-side on the phone (server never sees it); reproduce on the native sim with the real seed, fix, and put queue/reconcile state + last error into Send diagnostics | lane SYNC2 | in progress |
| T26 | Public content browser (`ContentBrowserPage`/`useMarketplaceContent`) calls the admin-only `GET /decks/admin` (404/403 for everyone) — point it at the public decks route | small lane | queued |
| T27 | lingo-core `lane/FIRSTRUN` (86de731: auto-provision on first authenticated request, race-safe) — PUSH WITH build 33, not before (build 32 clients expect a 404 to trigger the username picker; the new sentinel needs the client half) | lead | queued |
| T28 | Short build answers: 117 steps ≤3 tiles (203 <5) across 20 modules are budgeted exemptions of the ANSWER_TILE_FLOOR ratchet — rewrite to ≥5-tile sentences (debuts exempt), lower SHORT_ANSWER_TOTAL_BUDGET per module, stage TTS clips | lanes SHORTANS-A (m12–m29) / SHORTANS-B (m30–m46) | in progress |
| T25 (revised) | Sync = bulk-complete design (Spencer): one request per seed/reconcile diff instead of per-row chunks; legacy queue rows collapse on drain | lane SYNC2 | in progress |
| T29 | Test-suite audit: 19,132 tests / 684 s CPU — 56 files hold 9,905 tests (per-step it.each), top 25 files = 67 % of CPU (whole-course sweeps re-deriving the course each); merge sweeps onto one memoised course walk, collapse per-step expansion, fix the isolate:false order leak (kanjiCoverageAudit), local maxWorkers 50 %, nightly project for property/slow suites; targets < 6,000 tests, top-10 CPU < 60 s, mutation score unchanged | DONE (8e1e7905): 11,396 tests, 204 s CPU, 86 s wall; see docs/testaudit-2026-09-18.md |
| T30 | `SRSCardState.known` never syncs (no server field; pull overwrites) — the due-count mismatch (phone 151 vs server 354) | DONE (client 3 commits; server f501fa9 deployed) — build 34 |
| T31 | Test-out seeds vocab SRS only; grammar SRS (Track B) never seeded → placed learners face a full grammar review backlog | DONE — build 34 |
| T32 | Home/Learn/Practice cards refresh once per completed sync via a single progressChanged signal (Continue button was stale after the build-33 bulk sync); inventory every progress reader + writer, no extra requests | DONE (93f49d4b) — build 34 |
| T33 | PORTUGUESE course (Spencer's friend): phase A design doc (copy JA/ES/FR methods, evidence-backed improvements, PT decisions, 5 lesson briefs, infra checklist) → phase B scaffolding (`pt` registry, IR compiler, gates, TTS, beta flag) → phase C authoring (5 Sonnet lanes, one lesson each) → phase D clips + QA walk + build. Decisions needed: BR vs EU; visibility (beta flag) | lane PTDESIGN (A) | in progress |
| T34 | Portuguese beta reachability: wire `betaAccess` into every course picker/placement via one visibility seam, `/pt/qa/m1` walk page, lingo-data SAMPLE_VOICES pt-BR entries; then phase C = 5 authoring lanes (needs Spencer's BR confirmation + friend's email in the allow-list) | lane PTBETA | in progress |
