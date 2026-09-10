# Handoff — 2026-09-09: build 9, prod push, practice wave (に lesson, any-verb drill, particle pairs)

Written at ~17:00 PT before a context compaction. Everything below is committed
somewhere; the only uncommitted things are named in "Loose ends".

## Shipped today

- **TestFlight build 9** (delivery `ae6692e1-f41c-45f1-8d79-b0aa31a526c2`):
  APPROVED 16:13 PT, on the External Beta public link. Carries ledger items
  36–61 (`docs/user-feedback/2026-09-05-testflight-b5-b6.md`) except #54
  (open) and #55 (monitor). Spencer's device checklist: #1/#38 home no sideways
  scroll, #36 忙しい, #46/#60 drag, #48/#53 play button, #12/#59 kanji reveal,
  #56 long listen step keeps its label + first line.
- **Prod (web):** main pushed twice — `69f6e51e` (wave-2 merge + handoff) and
  `1b5735c1` (tile leading + 3px furigana band trim). ci/deploy green for
  69f6e51e and prod verified serving the new CSS; the runs for `290035db`
  (ES m17, pushed by me by accident because it was already on local main) and
  `1b5735c1` are green too (deploy success for 1b5735c1; red-main success).
- **Android APK for Maddie:** `~/Desktop/openlingo-android-debug-2026-09-09.apk`
  (38.7 MB, main + the Android session's uncommitted plugin changes; launches on
  the maddie emulator with the qa account).
- **Furigana decision:** keep 12px. Measured on iOS 26 WebKit: the 393px build
  tile was 16px text on a 24px line (dense tile class missed leading-tight) and
  a 12px reading got a 17px ruby band (WebKit ignores line-height on rt; a
  negative margin-bottom is honoured). Shipped: leading-tight + `-3px` →
  plain tile 40→38, ruby tile 57→52, #50 tray 105→98. Staging page:
  https://claude.ai/code/artifact/97aef445-f6a6-48a4-a70a-d42443bcca68

## Practice wave — DONE, playtested, NOT merged (Spencer to approve)

Integration branch **`practice-wave-2026-09-09`** in the worktree
`/private/tmp/claude-501/…/49583ccb…/scratchpad/wt-feedback` (may be wiped by
an OS update — the three source branches live under
`lingo/.claude/worktrees/` and survive): merges of
`worktree-agent-ad9f588f5a938560a` (any-verb drill),
`worktree-agent-ac5c60b1eda08521b` (particle pairs),
`worktree-agent-a15bcc5f6986bca32` (に lesson). No conflicts. **Preflight GREEN**
on the integration branch: 523 test files / 12,791 tests, tsc clean, CI-mode
build OK. If the worktree is gone, re-create the branch from the three agent
branches (`git merge` each onto origin/main) and re-run `npm run preflight`.

### 1. に time lesson — `ja-m11-neo-12` 「に or nothing」
- Slot: after m11-neo-11, before m11-neo-r3. 18 steps (11 authored beats +
  compiler fillers): rule card (clock-or-calendar test, antiPattern あしたに いく),
  6 builds in absolute/relative pairs with a **forced に trap tile** (new IR
  field `bankExtras`), 2 listening-comps, dialogue, challenge; a `pitfall`
  quick-fix card fires on あしたに/あさってに ("に points at a clock or calendar").
- Deviations: no particle-clozes (no ∅ option in the widget and the
  placement policy confines に clozes to ≤m8); べんきょう untaught → はたらく.
- Compiler fixes riding along: `pitfall` works on build mode; the rule card's
  span tip no longer overwrites an authored step tip.
- Gates: module-gate m11 PASS (9182/9182 TTS coverage), full suite 12,515
  passed, tsc clean. Shots: `<worktree a15bcc>/artifacts/ni-lesson/step-00..17.png`.
- TTS: 14 ja + 11 ja-keita clips generated, manifests updated, mp3s staged in
  `tts-publish/` (commit `fed7be85`, separable). `pipeline.tts.upload` NOT run
  (AWS SSO expired) — the deploy's tts-publish route uploads them on merge.

### 2. Any-verb conjugation drill (#41) — `/ja/practice/grammar/conjugation/free`
- Verb browser ("Verbs in this range (N)", kanji+furigana, class chip, search
  above 20), **pin** one verb, two-column form toggles with たべる→ examples,
  every form gated by its teaching module (table in `provider.ts`).
- Engine reality: 14 forms existed, no potential/たら/imperative/passive.
  **Added potential (m24) and たら (m32)** to `conjugationEngine.ts` with
  distractor families; `chainForms14.json` fixture proves the 14 old forms are
  byte-identical. Ripple flagged: `buildTileKanji` now maps potential/たら
  surfaces to kanji in lesson tiles (judged beneficial).
- Tests 1802 passed in scope; blast-radius run 8,980 passed. Shots:
  `<worktree ad9f588>/artifacts/any-verb/01..09.png`.
- Open: imperative/〜な/causative/passive need engine lanes; learn-ahead levels?

### 3. Particle pair training (#44) — `/ja/practice/grammar/particles?mode=combine`
- Reference | Combine toggle (JA only). Six pairs mined from the taught corpus
  (に+から 100, から+まで 23, は+が 132, を+で 65, に+で 44, に+を 154 at m38;
  へ+に dropped — one sentence). Two-blank drill, per-blank grading with the
  correct particle painted into a wrong blank, 3 options with a structurally
  wrong foil, 8-question sessions. Usage card per pair shown once; the に time
  rule card precedes any に pair. Writes `practiceStats("particles")`, grammar
  pillar shows "particles · N today". Tests 326 passed. Shots:
  `<worktree ac5c60>/artifacts/particles/01..11.png`.

### Merge recipe (after Spencer says yes)
1. `git -C <wt> log --oneline origin/main..practice-wave-2026-09-09` (≈16).
2. Rebase/merge onto current origin/main (ES session pushes m18+ from main —
   fetch first), `npm run preflight`, push, watch `ci` + `deploy` conclusions.
3. Build 10: bump `CURRENT_PROJECT_VERSION` to 10 in both pbxproj blocks;
   `release-b9.sh` chain (sed b9→b10, copy `.env.native` into the worktree);
   ASC steps by hand with `scripts/asc/asc.mjs` (my `asc-post9.sh` has a zsh
   quoting bug after the VALID poll).

## Spencer's calls still open
- Tile follow-ups from the Duolingo comparison — Spencer (post-compaction,
  2026-09-09): take Duolingo's **font sizing and alignment only, not its
  colours**. So: grey/light reading is DROPPED; **per-row stretch with centred
  word** is in flight on a Sonnet lane (worktree under `lingo/.claude/worktrees/`,
  branch `worktree-agent-aca5d129a458f4c59`).
- Flat-vector backgrounds via local image gen: **WORKS.** `~/.local/bin/mflux-generate-z-image-turbo --steps 8 --seed 7 --width 1024 --height 1024 --prompt "flat vector illustration in a clean corporate app-marketing style: …"` produced a convincing Duolingo-style torii in one shot (`~/Desktop/torii-flat-vector-test-2026-09-09.png`, ~7 min incl. load; Z-Image-Turbo, 31 GB cached, 128 GB RAM). The generic `mflux-generate` entry points fail here (FLUX.1 caches are empty HF-gated stubs; FLUX.2 klein has no entry point in this install) — use the `-z-image-turbo` binary. Next: a prompt template + seed per course landmark, batch, then vectorise (vtracer) or render at 2048 for backgrounds. Spencer said go (post-compaction): a Sonnet lane is generating the first 20-image set to `~/Desktop/openlingo-backgrounds-2026-09-09/` with a manifest + contact sheet, using OUR palette from the theme tokens.
- #58 rule-card line (に with こたえる), furigana below 12px (decided: no),
  `scripts/asc/` untracked in the main tree, lingo-data TTS override files and
  deck JSONs uncommitted, the Android session's files uncommitted.

## Process decision (Spencer, 2026-09-09)
Build lanes on **Sonnet**; screenshot review on **Opus** at most; Fable only
for merge/review decisions. Crop screenshots to the region that matters; one
playtest pass per lane. Today's three lanes ran on Fable by default and cost
≈1M subagent tokens.

## Fan-out state at ~17:30 PT (second compaction, 2026-09-09)

All lanes on Sonnet (hard rule: every Agent call passes `model`). Branches, none
pushed, none merged; main untouched. Practice-wave merge + build 10 STILL
awaits Spencer's explicit yes.

| Lane | Branch / worktree | State |
|---|---|---|
| Tile per-row stretch + centred word (Duolingo alignment only, NO colours) | `worktree-agent-aca5d129a458f4c59` (`lingo/.claude/worktrees/agent-aca5d129…`), commits 2dd014bc + 76496486 | DONE. BuildSentence + ListeningBuild: tile = `flex flex-col items-center justify-end`, rows `items-stretch`. Box sizes byte-identical; words share one baseline. Crops in `artifacts/tile-align/`. Reviewed by Fable once (build step): good. |
| #58 rule-card line + drill normaliser | `ja-polish-2026-09-09` (`.claude/worktrees/ja-polish`), f2b49063 + d1dd72b2 | DONE. こたえる takes に line in m30-neo-10 rule card; `drillUtils.normalizeTypedAnswer` → shared `typedAnswerKey`. Ledger row 58 cites a one-amend-stale hash — fix wording at merge. |
| Conjugation engine: imperative / 〜な / causative / passive | `conj-forms-2026-09-09` (`.claude/worktrees/conj-forms`), branched from practice-wave, commit 4999ce56 | DONE. All four forms gated `Infinity` (untaught anywhere m1–m38; passive planned m40, causative m45) so they never render as toggles. する suppletive させる/される; くれる imperative くれ; ichidan passive==potential handled in distractors. Fixture chainForms18.json (14 old forms byte-identical). tsc clean; conjugation+practice 50 files / 2019 tests green. Not visually run. |
| JA N4 repetition audit (Spencer: m30 sentences repeat too much, lessons feel long) | `rep-audit-2026-09-09` (`.claude/worktrees/rep-audit`), commit 8c71151b, `docs/ja-n4-repetition-audit-2026-09-09.md` | DONE. Literal repeats capped 2× everywhere (not the driver). Drivers: template near-duplicates (one frame, swapped nouns) + review lessons reusing 64–100% of module sentences (course-wide). N4-specific: 25–49 new atoms/module vs 15 in m20 → 116 words in m30–m34 with ONE carrier sentence. Median steps flat at 18 (m32 = 21). Ranked: (1) ≥2 carriers per new atom (~116 sentences, Sonnet lane); (2) widen filler noun pool to whole module; (3) reject lesson splitting. Awaiting Spencer's pick. |
| Backgrounds | `~/Desktop/openlingo-backgrounds-2026-09-09/` (images/, manifest.json, README.md, contact-sheet.png, generate.py) | 20/20 generated (~21 min, ~63 s each warm); Fable reviewed the contact sheet: strong, on-palette (navy metro-map + brick-red accent, our tokens, not Duolingo). Re-roll: shibuya fixed (seed 208); andes-market still white-card after seeds 204/304, original kept; 22 manifest entries, -v1 originals preserved. FINDING: the app has NO background-image slot (learn map is procedural SVG) — placement is a design call for Spencer. Spencer's note: vectorise (vtracer, not installed) then re-render rather than placing PNGs. Hex codes in prompts leak as text — use colour words. |

Merge order when Spencer says yes: practice-wave → conj-forms (stacked on it)
→ tile branch → ja-polish, each `git merge` onto the integration branch, then
`npm run preflight`, push, watch ci+deploy, build 10.

Peer session lingle-42 (ES, `uds:/tmp/cc-socks/2235.sock`) received the KO
queue (7 items, none kept by me) and my file-ownership list; it will warn
before pushing ES to main.

## SHIPPED ~19:30 PT (Spencer's yes, 2026-09-09) + second fan-out

- **Prod:** origin/main = `82d7a3b0` (practice wave + conj-forms + tile
  alignment + ja-polish + ledger #58) then `7b92d6ac` (iOS build 10 bump). Both:
  ci ✅ deploy ✅ red-main ✅; deploy's own "serves THIS deploy" step confirmed
  entry `assets/index-B39znCZv.js`.
- **TestFlight build 10:** delivery `d4648c03-7a0b-4447-bc88-928766270a58`,
  VALID, What to Test set, attached to External Beta, beta review
  WAITING_FOR_REVIEW (check `/v1/builds/{id}/betaAppReviewSubmission`).
  Release script: `<scratchpad>/release-b10.sh` (sed of b9). ASC lesson:
  `asc.mjs` prints `HTTP 200` on line 1 — strip it before JSON-parsing, and
  call it via a shell function, not a `$ASC` variable (zsh doesn't word-split).
- **Repetition audit → fixes (Spencer: "go with your changes"):**
  - Filler pool module-wide: `filler-pool-2026-09-09` @ `deb4d5b1`
    (moduleCompiler.ts + fillerPoolWidth.test.ts + 2 blast-radius scripts).
    Blast radius: 1187/1550 filler steps (76.6%) re-name a taught word,
    0/6369 non-filler steps changed, step counts identical in all 435 lessons,
    TTS 9182/9182 on m6/m11/m20/m30/m34/m38. Cross-lesson filler picks 3→706.
    NOT merged/pushed yet.
  - ≥2 carrier sentences per new N4 atom (m30–m34): `n4-carriers-2026-09-09`
    (`.claude/worktrees/n4-carriers`) — RUNNING at compaction; see memory.
  - Recycle-rate tool: `recycle-rate-2026-09-09` @ `e3d08dbb`,
    `scripts/ja-recycle-rate.ts` (+lib, +test, own vitest config), report
    `docs/ja-recycle-rate-2026-09-09.md`. Finding: literal ≥20% "any earlier
    verb/noun/adj" is met in 379/380 lessons; the real signal is VERB recycle:
    64/380 lessons <20%, m31 give/receive = 0% on 7/13 lessons. Next lane
    (after carriers lands, stacked on it): re-author m31 verb slots using the
    tool's candidate list, re-run tool to prove movement.
- **Mobile UI wave** — integration branch `mobile-map-wave-2026-09-09`
  (this worktree; merges clean, tsc clean, learn tests 23 files/132 green;
  NOT pushed — background placement is Spencer's design call):
  - `map-bg-2026-09-09` @ `de042877`: torii art (`src/assets/learn/vnm-bg-ja-torii.jpg`,
    86 KB, JA only) as a `position:fixed` layer under the vertical map (NOT
    `background-attachment:fixed` — iOS WebKit ignores it), navy overlay,
    opacity 0.34 (Fable suggests ~0.22 — red beams sit behind M2's title);
    auto-scroll to current station on mount; stops 1.3× (node 22→29px, title
    13.5→17.5px, row tap target 340×76).
  - `module-view-2026-09-09` @ `fa293521`: DistrictView modal on mobile —
    lesson titles 13→16px, rows ≥44px, footer buttons 14px/44px, close 44px;
    desktop pixel-identical. Also `scripts/shot.mjs --touch` and `--click=<sel>`.
  - `station-line-2026-09-09` @ `4488e3bb` (NOT merged into the wave):
    `StationLineMap.tsx` prototype (~80 px/station, level headers, reuses
    ProgressRing/TrainMascotArt/DistrictView) on dev route
    `/:lang/qa/station-line`; doc `docs/learn-station-line-view-2026-09-09.md`.
    Parity gaps before it can replace the mobile map: side quests, N4/N5 tier,
    BackToCurrent, resume bar, dev overlays. Spencer to decide.
- **Backgrounds set:** 22 entries at `~/Desktop/openlingo-backgrounds-2026-09-09/`;
  shibuya re-rolled OK (seed 208), andes-market still white-card (kept v1).

### Open items needing Spencer (unchanged + new)
Device pass on build 9/10; background opacity/placement call; station-line
go/no-go; merge+push of `mobile-map-wave` and `filler-pool` (+carriers, +m31
re-author) — each needs `npm run preflight` then push; `scripts/asc/` still
untracked in the main tree; lingo-data TTS override files + deck JSONs
uncommitted; Android session files uncommitted; FR m3–m10 walks + m10 liaison
listen; KO unaudited delta (Payton); vtracer not installed for the
generate→vectorise→re-render pipeline.
