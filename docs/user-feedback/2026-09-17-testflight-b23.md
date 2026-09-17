# TestFlight feedback — build 23 (pull 2026-09-17 ~00:25 MDT)

Pull: `node scripts/asc/pull-feedback.mjs $S/tf-b23b` → rows #182–#184, 0 crashes. Device
iPhone16_2 (15 Pro Max), build 23, 06:18–06:21 UTC. All three on `ja-m34-neo-6-challenge`.
Previous wave: `2026-09-16-testflight-b22.md` (#173–#177).

## Items

| # | Tester text | Located | Class / cause | Status |
|---|---|---|---|---|
| 182 | "prevent horizontal orientation swap on iPhone, horizontal should only be iPad" | app-wide | Info.plist allowed landscape on iPhone; Capacitor's bridge VC reads the generic key for every idiom, so a plist-only lock would have locked the iPad too | **FIXED for build 24** — `AppDelegate.application(_:supportedInterfaceOrientationsFor:)`: phone → portrait, pad → all. Verified on a force-rebuilt sim: phone 430×932 under rotation, iPad still 1180×820. |
| 183 | "Horrible defect… is it authoring wrong? Do we have a shit compiler? … too many regressions" | tiles しごと\|を\|**や\|め\|て**\|… with 目/手 kanji | COMPILER CLASS (fourth incident): greedy longest-match over own+earlier atoms; やめて registered only in m36; `unbuildable` accepts any cover of known atoms. Full analysis: `docs/tile-shrapnel-2026-09-17.md`. | **FIXED for build 24** — やめて registered in m34; whole-course `lexiconKanas` + `shrapnel` diagnostic (informational; 113 false / 8 true on v2); two more shipping shreds found and fixed (m32/m33 きかい, おと). Structural close (one content word per chunk) queued behind the lexical sidecar. |
| 184 | "Maybe we have the tiles disappear as they click them in after a certain time count? The dynamic font resizing is weird here" | same step, 13-tile bank | `hugeBank` (≥12 tiles) skips the tray reservation (b14) → tray grows mid-build → b22 FILL shrinks every tile | **FIXED for build 24** — (1) huge banks now reserve ONE tray row up front (measured: without it the first tap grew the tray 46.7→102.7 px and shrank every tile 1.25→0.80; with it the trace shows zero changed frames across the tap, fitScale 1.25 throughout); (2) spent bank tiles collapse after 350 ms on huge banks (Spencer's proposal) so later tray rows are paid for by the bank. Unverified over a full 13-tap build. |

## Found while fixing

- Harness defect: `sim:capture` rebuilt the shell only when the dev-server URL changed; native
  source edits ran the stale binary. Fixed by a `nativeHash` in `sim-stamp.json`.
- Harness expectation for landscape iPad base font updated 15 → 16 px (the `pointer: fine` fix).
- Spencer directive (blocks all authoring): procedural, one-question-at-a-time QA/authoring
  question set with a tool per question — memory `procedural-qa-question-set`.
