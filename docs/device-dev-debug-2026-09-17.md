# Device dev debug (lane A11, 2026-09-17)

Spencer, 2026-09-17: *"can I enable dev mode though and we do a little more active
debugging for everything?"* — pairing an iPad (iOS Developer Mode) to this Mac
(LAN IP `10.15.12.130`), alongside the phone, so a cross-device sync bug (progress/
SRS mismatch between the two, both on the same TestFlight build) can be watched
live instead of reconstructed after the fact from screenshots.

This doc has two halves: **Spencer's steps** (once, on the iPad + the cable) and
**the lead's steps** (building/installing the dev build, arming the devlog channel,
reading it). It also says exactly what is captured and what is not.

## What this buys

A Debug build of the app, installed on a real device, that loads its JS from this
Mac's Vite dev server instead of the bundled `dist/` — so an edit here shows up on
the device on the next reload, no TestFlight build/App Store Connect round trip. On
top of that, an opt-in **devlog channel** streams console output, API requests, SRS
sync transitions, and progress-reconcile decisions from the device to a file on this
Mac, live, so the lead can watch what a real device is doing instead of asking
Spencer to read a screen out loud.

Two independent pieces, and you can use either without the other:

- **The dev-server build** (`scripts/mobile/dev-build-device.sh`) gets fast-iteration
  JS onto a real device. Not new — `capacitor.config.ts`'s `CAP_DEV_SERVER` harness
  already exists for the simulator (`scripts/ux-loop/sim-capture.mjs`); this is the
  same mechanism aimed at `xcrun devicectl` instead of `xcrun simctl`.
- **The devlog channel** (`src/shared/dev/remoteConsole.ts`) works on ANY dev-server
  build — simulator or device — and is armed independently (a localStorage flag or
  a dev-server env var), not tied to the install step above.

## 1. Spencer's steps (once, on the iPad)

1. **Settings → Privacy & Security → Developer Mode → on.** This option only
   appears after the iPad has been connected to this Mac at least once with Xcode
   running (same gotcha as the phone setup — see
   `docs/ios-wrapper-setup-2026-08-06.md` §"e. Getting it onto the phone"). The
   iPad restarts when you turn it on.
2. **Cable to the Mac once, tap Trust** on the iPad when prompted, and unlock it.
   After that first cable pairing, Xcode → Window → Devices and Simulators can
   optionally check **"Connect via network"** so later syncs don't need the cable —
   but the very first pairing needs the wire.
3. That's it on your end. The lead takes it from here — `xcrun devicectl list
   devices` should show the iPad once Developer Mode is on and it's been trusted.

## 2. The lead's steps

### 2a. Find the iPad's UDID

```bash
xcrun devicectl list devices
xcrun devicectl device info details --device <UDID> | grep -E "developerModeStatus|bootState"
```

`(no DDI)` next to the device means Developer Mode isn't actually on yet (see
Spencer's step 1) — it is NOT a cable problem.

### 2b. Start the dev server, from THIS worktree

```bash
npm run dev:lan -- --port 5173
```

`dev:lan` is `vite --host 0.0.0.0` (vs. plain `dev`'s `--host` default of
`localhost`) — the phone/iPad are on the LAN, not this Mac's loopback, so the
server has to actually listen on the Mac's real interface. To arm the devlog
channel automatically for every page load (no localStorage step needed on the
device), start it as:

```bash
VITE_NATIVE=true VITE_DEV_AUTH_BYPASS=true VITE_DEVLOG=1 npm run dev:lan -- --port 5173
```

### 2c. Build + install onto the device

```bash
scripts/mobile/dev-build-device.sh <UDID> --host 10.15.12.130 --port 5173
```

This script (run from **your** lane worktree, not main — a debug build compiled
from an uncommitted lane tree is expected here, unlike the archive builds in
Spencer's `release-b*.sh` scripts, which build from the main checkout on purpose):

1. Prints the exact `npm run dev:lan` line and curls `http://<host>:<port>/__sim/env`
   until it answers (confirms the dev server is up and reachable over LAN before
   touching Xcode).
2. `CAP_DEV_SERVER=http://<host>:<port> npx cap sync ios`.
3. Builds a Debug app for `generic/platform=iOS`, automatic signing via the App
   Store Connect API key (`~/.appstoreconnect/credentials.env` +
   `~/.appstoreconnect/private_keys/AuthKey_SM7MX6WN53.p8` — the same auth
   `release-b28.sh` uses for the archive build; `-allowProvisioningUpdates` lets
   `xcodebuild` refresh the device's provisioning profile non-interactively).
4. `xcrun devicectl device install app` + `device process launch`.
5. **Restores a store-safe `capacitor.config.json`** (`npx cap sync ios` with
   `CAP_DEV_SERVER` unset) so this worktree can't leak a dev-server config into a
   later archive build — `capacitor.config.ts`'s own doc comment: *"Both settings
   are DEBUG-ONLY and must never reach a store build."* This runs automatically at
   the end of every install; `--restore-store-config` also exists as a standalone
   flag if you need to re-run just that step (e.g. after manually re-syncing with
   `CAP_DEV_SERVER` for some other reason).

**Guard:** the script refuses to run against Trap Phone's UDID
(`00008130-000A2DD01179001C`) unless you pass `--i-mean-the-phone` — it keeps the
TestFlight build and its own local SRS/progress state; pointing it at a dev server
would blow that away on the next launch.

### 2d. Arm the devlog channel (if you didn't set `VITE_DEVLOG=1` on the server)

On the device, open the app's dev panel (or any surface that can run a one-liner)
and set:

```js
localStorage.setItem("lingo:devlog", "1");
```

then reload. `VITE_DEVLOG=1` on the dev server (step 2b) does the same thing for
every page load, no per-device step needed — that's the simpler option once you've
confirmed the wiring once.

### 2e. Watch it live

```bash
node scripts/devlog/tail.mjs                      # most-recently-modified device
node scripts/devlog/tail.mjs <device> --kind api   # filter to one record kind
node scripts/devlog/sync-timeline.mjs              # merge the two most-recent devices
node scripts/devlog/sync-timeline.mjs <deviceA> <deviceB>
```

`<device>` strings look like `ios-iPhone-a1b2` (`<platform>-<model>-<last4 of a
random per-install id>`) — `tail.mjs` with no args prints the known devices if you
pass a name it doesn't recognize. Files live at `artifacts/devlog/<device>.jsonl`
(gitignored — see "What is captured", below, for why that still matters).

`sync-timeline.mjs` is the tool for the actual bug this is all for: it merges both
devices' `kind: "sync"` (SRS sync queue transitions), `kind: "reconcile"` (progress
reconcile decisions, including the #176a "Pull from server" diagnostic), and
progress/SRS-shaped `kind: "api"` records into one time-ordered table, so a push
from the phone and a pull on the iPad show up in the SAME timeline with the
server's own `X-Request-Id` on each row — the id CloudWatch logs also carry, for
grepping the exact Lambda invocation.

## 3. What is captured

Six record kinds (`DevLogKind` in `remoteConsole.ts`), one JSONL line per record,
`{t, device, seq, kind, ...}`:

| kind | source | fields |
|---|---|---|
| `console` | `console.log/info/warn/error/debug` | `level`, `msg` (stringified args, redacted, ≤2 KB) |
| `error` | `window.onerror` / `unhandledrejection` | `message`/`reason`, `filename`, `lineno`, `stack` |
| `api` | every `ApiClient` request | `method`, `path`, `status`, `ok`, `ms`, `requestId`, `reqBytes`, `resBytes`, `attempt` |
| `session` | every `sessionLog.ts` event | `type`, `sid`, `payload` (stringified, redacted) |
| `sync` | SRS sync queue transitions (`srsSync.ts`) | `phase` (`enqueued`/`batch_start`/`batch_ok`/`batch_error`), counts, an error MESSAGE |
| `reconcile` | progress reconcile decisions (`progressReconcile.ts`, `pullFromServerIgnoringReset.ts`) | `status`/`reason`, `queued`, `posted`, or `localCount`/`serverCount` |

## 4. What is NOT captured

- **No request or response bodies.** `api` records carry byte COUNTS
  (`reqBytes`/`resBytes`), never the JSON itself — a typed answer, a lesson id list,
  a token, never leaves the device through this channel.
- **No Authorization header, no token, no password.** `safeStringify`'s
  `redactingReplacer` masks any object key matching
  `authorization|cookie|token|password|secret|api_key` (case-insensitive) before a
  `console.log`/`session` payload is ever stringified — tested directly in
  `remoteConsole.test.ts` by logging a fake bearer token and asserting it never
  reaches the POST body.
- **No user id, no email, no free-text answer.** `reconcile`/`sync` events carry
  counts and status strings only; `pullFromServerIgnoringReset`'s hook reports
  `localCount`/`serverCount`, never the query key's user id.
- **Nothing in a production build.** Every hook is gated on
  `import.meta.env.DEV` (checked at CALL time, not module scope — mirrors
  `installSimProbe`/`installDevLog`), which Vite inlines to `false` outside a dev
  server. A TestFlight/App Store build never runs this code, full stop — confirmed
  by grepping the built `dist/assets/*.js` for `/__devlog` (absent from a
  `npm run build`/`npm run build:native` bundle) and by the before/after entry-chunk
  size comparison in the lane report (the code ships as dead-but-present bytes, same
  tradeoff `capacitor.config.ts` already documents for `IS_NATIVE`'s native
  branches — a few hundred bytes, never executed).
- **Nothing without the arm flag.** Even a `DEV` build stays silent until
  `localStorage["lingo:devlog"] === "1"` or the dev server was started with
  `VITE_DEVLOG=1` — a plain `npm run dev`/`npm run dev:lan` captures nothing.

## 5. How to stop it

- **Devlog only:** clear the flag — `localStorage.removeItem("lingo:devlog")` on
  the device, or stop the `VITE_DEVLOG=1` dev server and restart it without that
  var. Takes effect on the next reload.
- **The whole dev build:** delete the app from the device (long-press → Remove
  App), then reinstall the real TestFlight build from the TestFlight app. The dev
  build and the TestFlight build share the same bundle id
  (`com.linguiversal.app`), so only one can be installed at a time on a given
  device — installing one replaces the other. This is also why `dev-build-device.sh`
  refuses Trap Phone by default (§2c guard): a dev install there would silently
  replace the TestFlight build Spencer is using day to day.
- **This worktree leaking a dev-server config into a later archive build:** already
  handled automatically (§2c step 5) — `scripts/mobile/dev-build-device.sh
  --restore-store-config` re-runs it standalone if you ever need to.

## Design notes / what this lane did NOT do

- **Two-tap UI automation on the simulator** (open the Sync panel, then tap "Pull
  from server") is not supported by `scripts/ux-loop/sim-capture.mjs`'s `--tap`
  flag — it clicks exactly one `document.querySelector` match per page load
  (`runTapSequence` in `simProbe.ts`), and every capture is a fresh
  terminate+relaunch (React state does not survive between captures). The
  simulator proof in the lane report instead uses `vite.config.ts`'s existing
  `HARNESS_DRIVE` env-var-driven tapper (`harnessDriverPlugin`, already in this
  repo, unrelated to this lane's files) — `HARNESS_DRIVE="Sync status|Pull from
  server"` taps two buttons by visible text, in sequence, on ONE page load,
  polling until each becomes clickable. See the lane report for the actual
  devlog + timeline output this produced.
- **No new npm dependency** was added (`@capacitor/device` would have given an
  exact device model; not available under this lane's "no new dependencies"
  constraint) — `getDeviceId()` falls back to a UA-sniffed model tag ("iPhone"/
  "iPad"/an Android model string/"browser"), which is enough to tell two DEVICES
  apart (the actual requirement — merging two devices' timelines) even though it
  can't tell two iPhones of the same generation apart by model number.

Ledger: `docs/handoff-2026-09-17-project-review.md`, lines prefixed `A11 —`.
