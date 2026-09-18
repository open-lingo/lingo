#!/usr/bin/env bash
# scripts/lane/sim-proof.sh — ONE call proves a step on the real 15 Pro Max
# simulator instead of the boot/install/tap/probe/shot/replay/compare
# choreography a manual sim-capture pass takes (the lane-briefing skill's
# "Lane toolset" section — measured 2026-09-18: GHOST made ~250 Bash calls
# doing this by hand). Wraps scripts/ux-loop/sim-capture.mjs (+
# replay-runner.mjs for --replay) with: sim.lock queueing so two lanes never
# fight over the one real simulator, an ISOLATED dev-server port per run (a
# shared default port silently bound by another worktree reads as "no probe
# report" — see docs/ios-simulator-sizing-harness memory), and ONE compact
# table (scale | verdicts | screenshot | fit-scale | overflow px) instead of
# sim-capture's own full per-tap dump.
#
# Usage:
#   scripts/lane/sim-proof.sh "<lessonId>?step=N" [--scales 100,125]
#     [--simulate build] [--replay <golden>[,<golden2>...]] [--port 54xx]
#     [--lane NAME] [-- <extra sim-capture.mjs flags, e.g. --max-taps 6>]
#
# --simulate build taps through the build with the probe verdicts
# (fitScaleStable, noFlicker, stageFits, bankVisible/overlap-vs-CTA, … — see
# computeBuildVerdicts in sim-capture.mjs); omit it for a plain one-shot
# capture of a non-build step. PASS/FAIL always comes from sim-capture.mjs's
# own exit code — this script explains it, never re-derives it.
#
# Exit code: nonzero if ANY scale capture or replay FAILs.
set -u
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$here" || exit 1
scratch="$(cd "$here/../.." && pwd)"
lock="$scratch/sim.lock"

route="" scales="100,125" simulate="" replay="" port="" lane=""
extra=()
while [ $# -gt 0 ]; do
  case "$1" in
    --scales) scales="$2"; shift 2 ;;
    --simulate) simulate="$2"; shift 2 ;;
    --replay) replay="$2"; shift 2 ;;
    --port) port="$2"; shift 2 ;;
    --lane) lane="$2"; shift 2 ;;
    --) shift; extra=("$@"); break ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) route="$1"; shift ;;
  esac
done
[ -z "$route" ] && { echo "sim-proof.sh: need a route, e.g. \"ja-m15-neo-6?step=15\"" >&2; exit 2; }
[ -z "$lane" ] && lane="$(basename "$here")"

# "<lessonId>?step=N" shorthand -> the real /:lang/learn/lessons/:id route
# (lang = the lessonId's own prefix, e.g. "ja-m15-neo-6" -> ja). A route
# already starting with "/" is passed through unchanged.
if [[ "$route" != /* ]]; then
  lessonId="${route%%\?*}"
  query="${route#*\?}"
  [ "$query" = "$route" ] && query=""
  lang="${lessonId%%-*}"
  route="/${lang}/learn/lessons/${lessonId}${query:+?$query}"
fi

if [ ! -f src/pub/content/v1/manifest.json ]; then
  echo "sim-proof.sh: manifest.json missing — running content:emit…"
  npm run content:emit >/dev/null 2>&1 || { echo "sim-proof.sh: content:emit failed" >&2; exit 1; }
fi

# --- sim.lock: take/refresh it, wait up to 15 min (poll 30s) if another
# lane holds it, ALWAYS release on exit --------------------------------
deadline=$(( $(date +%s) + 900 ))
while :; do
  holder="$(cut -d' ' -f1 "$lock" 2>/dev/null || true)"
  if [ ! -f "$lock" ] || [ "$holder" = "$lane" ]; then
    echo "$lane $(date)" > "$lock"
    break
  fi
  [ "$(date +%s)" -ge "$deadline" ] && { echo "sim-proof.sh: sim.lock held by '$(cat "$lock")' after 15 min — giving up" >&2; exit 1; }
  echo "sim-proof.sh: sim.lock held by '$(cat "$lock")' — waiting…"
  sleep 30
done

# --- isolated dev-server port, stopped on exit no matter what -----------
if [ -z "$port" ]; then
  port=5400
  while lsof -ti "tcp:$port" >/dev/null 2>&1; do port=$((port + 1)); done
fi
export SIM_DEV_PORT="$port"

cleanup() {
  lsof -ti "tcp:$port" 2>/dev/null | xargs -r kill 2>/dev/null
  [ -f "$lock" ] && [ "$(cut -d' ' -f1 "$lock" 2>/dev/null)" = "$lane" ] && rm -f "$lock"
}
trap cleanup EXIT INT TERM

status=0
rows=()
IFS=',' read -ra scale_list <<< "$scales"
[ "${#scale_list[@]}" -eq 0 ] && { echo "sim-proof.sh: --scales produced no values (got \"$scales\")" >&2; exit 2; }
for scale in "${scale_list[@]}"; do
  log="$(mktemp -t sim-proof-log)"
  args=(--route "$route" --font-scale "$scale")
  [ -n "$simulate" ] && args+=(--simulate "$simulate")
  # bash 3.2 (macOS default, `set -u`) throws "unbound variable" expanding
  # an EMPTY array's `[@]}` — this guard is the portable workaround.
  args+=("${extra[@]+"${extra[@]}"}")
  node scripts/ux-loop/sim-capture.mjs "${args[@]}" >"$log" 2>&1
  code=$?
  [ "$code" -ne 0 ] && status=1
  json="$(grep -oE 'wrote [^ ]+\.json' "$log" | head -1 | awk '{print $2}')"
  echo "-- scale ${scale}%: $([ "$code" -eq 0 ] && echo PASS || echo FAIL) --"
  [ "$code" -ne 0 ] && tail -8 "$log"
  rows+=("${scale}|${json}|${code}")
  rm -f "$log"
done

if [ -n "$replay" ]; then
  IFS=',' read -ra goldens <<< "$replay"
  for g in "${goldens[@]}"; do
    rlog="$(mktemp -t sim-proof-replay-log)"
    node scripts/ux-loop/replay-runner.mjs --golden "tests/visual/golden/${g}.replay.json" >"$rlog" 2>&1
    [ $? -ne 0 ] && status=1
    sed -n '/^name /,$p' "$rlog"
    rm -f "$rlog"
  done
fi

node scripts/lane/lib/sim-proof-table.mjs "${rows[@]}" || status=1
exit "$status"
