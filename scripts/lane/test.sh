#!/usr/bin/env bash
# scripts/lane/test.sh — scoped vitest run with a small, agent-sized report.
#
# Runs vitest with json+dot reporters into a scratch file, then prints ONLY
# failing test names + their assertion message (capped to 40 lines) plus the
# pass/fail/skip totals. The full vitest output (stack traces, duplicate
# frames, source snippets) never reaches stdout — that is the whole point:
# fewer bytes per tool call, not more test coverage.
#
# Usage:
#   scripts/lane/test.sh <vitest-file-or-dir>...
#   scripts/lane/test.sh --project curriculum src/features/languages/ja
#   scripts/lane/test.sh --tsc src/features/flashcards/engine
#
# Flags:
#   --project <name>   vitest workspace project: curriculum | app | curriculum-render
#   --tsc              prepend `npx tsc -b`, errors-only output (<=30 lines)
#   -h, --help         this text
#
# Exit code: nonzero if tsc (when requested) or vitest reported any failure.
set -u
here="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$here" || exit 1

usage() { sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

project=""
run_tsc=0
files=()
while [ $# -gt 0 ]; do
  case "$1" in
    --project) project="$2"; shift 2 ;;
    --tsc) run_tsc=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) files+=("$1"); shift ;;
  esac
done

if [ ${#files[@]} -eq 0 ]; then
  echo "test.sh: need at least one vitest file or dir" >&2
  usage >&2
  exit 2
fi
if [ -n "$project" ] && [ "$project" != "curriculum" ] && [ "$project" != "app" ] && [ "$project" != "curriculum-render" ]; then
  echo "test.sh: --project must be curriculum|app|curriculum-render, got \"$project\"" >&2
  exit 2
fi

status=0

if [ "$run_tsc" -eq 1 ]; then
  tsclog="$(mktemp -t lane-tsc)"
  npx tsc -b >"$tsclog" 2>&1
  tsc_code=$?
  if [ "$tsc_code" -ne 0 ]; then
    status=1
    echo "== tsc: FAIL =="
    grep -E "error TS" "$tsclog" | head -30
    n=$(grep -cE "error TS" "$tsclog")
    [ "$n" -gt 30 ] && echo "... ($((n - 30)) more errors omitted)"
  else
    echo "== tsc: clean =="
  fi
  rm -f "$tsclog"
fi

jsonout="$(mktemp -t lane-vitest).json"
vtlog="$(mktemp -t lane-vitest-log)"
projectArgs=()
[ -n "$project" ] && projectArgs=(--project "$project")

npx vitest run "${projectArgs[@]+"${projectArgs[@]}"}" "${files[@]}" --reporter=dot --reporter=json --outputFile="$jsonout" >"$vtlog" 2>&1
vt_code=$?
[ "$vt_code" -ne 0 ] && status=1

if [ -s "$jsonout" ]; then
  node "$here/scripts/lane/lib/print-vitest-summary.mjs" "$jsonout"
else
  echo "== vitest: no JSON report written (config error or no tests matched) =="
  tail -40 "$vtlog"
fi
rm -f "$jsonout" "$vtlog"

exit "$status"
