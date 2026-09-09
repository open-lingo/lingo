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
- Tile follow-ups from the Duolingo comparison: **grey/light reading instead of
  accent red** (needs code — the tray tile paints the reading in tile colour)
  and **per-row stretch with centred word** (needs a wrapper change in the
  sortable tray). Both agreed in principle 2026-09-09; not built.
- Flat-vector backgrounds via local image gen: **WORKS.** `~/.local/bin/mflux-generate-z-image-turbo --steps 8 --seed 7 --width 1024 --height 1024 --prompt "flat vector illustration in a clean corporate app-marketing style: …"` produced a convincing Duolingo-style torii in one shot (`~/Desktop/torii-flat-vector-test-2026-09-09.png`, ~7 min incl. load; Z-Image-Turbo, 31 GB cached, 128 GB RAM). The generic `mflux-generate` entry points fail here (FLUX.1 caches are empty HF-gated stubs; FLUX.2 klein has no entry point in this install) — use the `-z-image-turbo` binary. Next: a prompt template + seed per course landmark, batch, then vectorise (vtracer) or render at 2048 for backgrounds. Spencer has not yet said go.
- #58 rule-card line (に with こたえる), furigana below 12px (decided: no),
  `scripts/asc/` untracked in the main tree, lingo-data TTS override files and
  deck JSONs uncommitted, the Android session's files uncommitted.

## Process decision (Spencer, 2026-09-09)
Build lanes on **Sonnet**; screenshot review on **Opus** at most; Fable only
for merge/review decisions. Crop screenshots to the region that matters; one
playtest pass per lane. Today's three lanes ran on Fable by default and cost
≈1M subagent tokens.
