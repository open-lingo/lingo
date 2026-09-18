#!/bin/zsh
# Lane A11 (2026-09-17) — device dev build: installs a Debug build of the
# CURRENT worktree onto a real iOS device, pointed at this Mac's Vite dev
# server over LAN, so a cross-device sync bug (phone vs iPad) can be watched
# live via the devlog channel (`src/shared/dev/remoteConsole.ts`,
# `docs/device-dev-debug-2026-09-17.md`). Mirrors the CAP_DEV_SERVER harness
# `capacitor.config.ts` documents and the simulator recipe
# `scripts/ux-loop/sim-capture.mjs`'s `buildAndInstallShell` already uses,
# but for a REAL device (`xcrun devicectl`, not `simctl`) with real
# provisioning (the App Store Connect API key, same auth `scripts/mobile/
# release-b28.sh` in Spencer's scratchpad uses for the archive build).
#
# Usage:
#   scripts/mobile/dev-build-device.sh <UDID> [--host 10.15.12.130] [--port 5173]
#   scripts/mobile/dev-build-device.sh <UDID> --i-mean-the-phone   # Trap Phone only
#   scripts/mobile/dev-build-device.sh --restore-store-config       # undo, no UDID needed
#
# This script does NOT start the dev server itself — it prints the exact
# `npm run dev:lan` line to run in another terminal (or another pane of
# whatever's driving this), then curls `/__sim/env` to confirm it's up
# before touching Xcode. Run it FROM THIS WORKTREE (lane/A11), not main —
# see `docs/device-dev-debug-2026-09-17.md` and the lane brief's
# "Branch-per-lane rule": a debug build compiled from an uncommitted lane
# tree is expected here, unlike the archive builds in `release-b*.sh`,
# which are built from the main checkout on purpose.
set -e
set -o pipefail

TRAP_PHONE_UDID="00008130-000A2DD01179001C"
BUNDLE_ID="com.linguiversal.app"
TEAM_ID="Y462YZGXCZ"

HOST="10.15.12.130"
PORT="5173"
UDID=""
I_MEAN_THE_PHONE=0
RESTORE_ONLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --i-mean-the-phone) I_MEAN_THE_PHONE=1; shift ;;
    --restore-store-config) RESTORE_ONLY=1; shift ;;
    -*) echo "unknown flag: $1"; exit 2 ;;
    *)
      if [ -z "$UDID" ]; then UDID="$1"; else echo "unexpected extra arg: $1"; exit 2; fi
      shift
      ;;
  esac
done

# ── --restore-store-config: undo only, no build ─────────────────────────
# Re-syncs iOS WITHOUT CAP_DEV_SERVER so this worktree's `ios/App/App/`
# cannot leak a dev-server config into a later archive build (see
# capacitor.config.ts's own warning: "Both settings are DEBUG-ONLY and must
# never reach a store build"). Safe to run any time, with or without a
# prior dev build — `cap sync` with no CAP_DEV_SERVER always emits the
# production config, so this is idempotent.
if [ "$RESTORE_ONLY" = "1" ]; then
  echo "== restoring store-safe capacitor config (no CAP_DEV_SERVER) =="
  env -u CAP_DEV_SERVER -u CAP_DEV_LOGGING npx cap sync ios
  grep -q '"server"' ios/App/App/capacitor.config.json && { echo "UNSAFE: server block still present after restore"; exit 1; }
  echo "clean — ios/App/App/capacitor.config.json has no server block"
  exit 0
fi

if [ -z "$UDID" ]; then
  echo "usage: $0 <UDID> [--host <ip>] [--port <port>] [--i-mean-the-phone]"
  echo "       $0 --restore-store-config"
  exit 2
fi

# ── Guard: never point Trap Phone at a dev server by accident ───────────
# Trap Phone keeps the TestFlight build and its own local SRS/progress
# state — see the "Concurrent sessions, same repo" / mobile-build memory.
# A dev build there would blow that state away on next launch.
if [ "$UDID" = "$TRAP_PHONE_UDID" ] && [ "$I_MEAN_THE_PHONE" != "1" ]; then
  echo "REFUSING: $UDID is Trap Phone. It keeps the TestFlight build + local state."
  echo "Pass --i-mean-the-phone if you really mean to point it at a dev server."
  exit 1
fi

DEV_URL="http://${HOST}:${PORT}"

echo "== 1. start the dev server (in another terminal / pane) =="
echo ""
echo "    npm run dev:lan -- --port ${PORT}"
echo ""
echo "waiting for it to answer at ${DEV_URL}/__sim/env ..."
ATTEMPTS=0
until curl -fsS "${DEV_URL}/__sim/env" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 60 ]; then
    echo "FAILED: no response from ${DEV_URL}/__sim/env after 60 attempts."
    echo "Confirm the dev server is running with --host 0.0.0.0 and reachable"
    echo "from this Mac at ${HOST}:${PORT} (same machine, so localhost also works"
    echo "unless something else is bound to :${PORT})."
    exit 1
  fi
  sleep 2
done
echo "dev server is up:"
curl -fsS "${DEV_URL}/__sim/env"
echo ""

# `VITE_NATIVE` must be true on the dev server for the native auth/TTS/
# speech branches to run (see capacitor.config.ts's CAP_DEV_SERVER doc
# comment) — /__sim/env is the one place that's checkable without
# launching the app.
NATIVE_OK=$(curl -fsS "${DEV_URL}/__sim/env" | grep -o '"native":true' || true)
if [ -z "$NATIVE_OK" ]; then
  echo "WARNING: dev server at ${DEV_URL} was NOT started with VITE_NATIVE=true."
  echo "Native-only code paths (auth, TTS host, speech) will silently take the"
  echo "WEB branch on device. Restart it as:"
  echo "    VITE_NATIVE=true VITE_DEV_AUTH_BYPASS=true npm run dev:lan -- --port ${PORT}"
fi

echo "== 2. cap sync ios, pointed at ${DEV_URL} =="
CAP_DEV_SERVER="${DEV_URL}" npx cap sync ios

echo "== 3. build a Debug app for generic/platform=iOS, automatic signing =="
# Auth via the ASC API key (same mechanism `scripts/mobile/release-b28.sh`
# uses for the archive build) — `-allowProvisioningUpdates` lets xcodebuild
# fetch/refresh the device's provisioning profile non-interactively instead
# of needing Xcode's UI + a signed-in Apple ID on this session.
if [ -z "${KEY_ID:-}" ] || [ -z "${ISSUER_ID:-}" ]; then
  if [ -f ~/.appstoreconnect/credentials.env ]; then
    source ~/.appstoreconnect/credentials.env
  fi
fi
if [ -z "${KEY_ID:-}" ] || [ -z "${ISSUER_ID:-}" ]; then
  echo "FAILED: KEY_ID / ISSUER_ID not set and ~/.appstoreconnect/credentials.env not found."
  exit 1
fi
KEYP=~/.appstoreconnect/private_keys/AuthKey_SM7MX6WN53.p8
if [ ! -f "$KEYP" ]; then
  echo "FAILED: auth key not found at $KEYP"
  exit 1
fi

DD="artifacts/ux-loop/DerivedData-a11-device"
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination "generic/platform=iOS" -derivedDataPath "$DD" \
  -allowProvisioningUpdates -authenticationKeyPath "$KEYP" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ISSUER_ID" \
  CODE_SIGN_STYLE=Automatic "DEVELOPMENT_TEAM=${TEAM_ID}" \
  build 2>&1 | tail -40

APP_PATH="$DD/Build/Products/Debug-iphoneos/App.app"
[ -d "$APP_PATH" ] || { echo "FAILED: xcodebuild reported success but $APP_PATH does not exist"; exit 1; }

echo "== 4. install + launch on $UDID =="
xcrun devicectl device install app --device "$UDID" "$APP_PATH"
xcrun devicectl device process launch --device "$UDID" "$BUNDLE_ID"

echo ""
echo "Installed and launched. It's loading ${DEV_URL} — arm the devlog channel"
echo "in the app (Settings/dev panel, or the app's own localStorage) with"
echo "localStorage['lingo:devlog'] = '1', or restart the dev server with"
echo "VITE_DEVLOG=1 so every page load is armed automatically. Tail it with:"
echo "    node scripts/devlog/tail.mjs"
echo ""

echo "== 5. restore store-safe config so this worktree can't leak a dev-server"
echo "      config into a later archive build =="
env -u CAP_DEV_SERVER -u CAP_DEV_LOGGING npx cap sync ios
grep -q '"server"' ios/App/App/capacitor.config.json && { echo "UNSAFE: server block still present after restore"; exit 1; }
echo "done — ios/App/App/capacitor.config.json is store-safe again."
echo "(the device keeps running the dev-server-pointed build already installed;"
echo " this step only prevents step 3's config from surviving into a LATER build.)"
