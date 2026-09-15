#!/usr/bin/env bash
# Extend-answers lane — full 656-row run. Waits for the naturalness sweep
# (scripts/naturalness/judge.mjs sentences) to release the GPU, then runs
# propose -> gate (incl. one retry pass) -> judge-gate (second machine gate,
# reuses the naturalness judge) -> sample-for-audit -> REPORT.md.
#
# Launch with nohup so it survives the driving session's exit:
#   nohup bash scripts/extend-answers/run-full.sh > "$EXTEND_DIR/run-full.log" 2>&1 &
#
# Never launches a second big Ollama model concurrently: propose.mjs's own
# waitForModelSlot() also guards this, this poll is the outer belt-and-braces
# check the brief asked for.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

EXTEND_DIR="${EXTEND_DIR:-/private/tmp/claude-501/-Users-lichfield-Documents-projects-lingle/f70c9300-76dc-4cec-9490-1bf299974b7a/scratchpad/fb16-research/extend}"
export EXTEND_DIR
mkdir -p "$EXTEND_DIR"

echo "run-full.sh: $(date) waiting for judge.mjs sentences to release the GPU..."
while pgrep -f "judge.mjs sentences" > /dev/null 2>&1; do
  sleep 60
done
echo "run-full.sh: $(date) GPU free. Starting the full 656-row pass."

echo "run-full.sh: propose.mjs (initial pass, all rows)..."
node scripts/extend-answers/propose.mjs

echo "run-full.sh: gate.mjs (mechanical gates + one retry pass)..."
node scripts/extend-answers/gate.mjs

echo "run-full.sh: judge-gate.mjs (second machine gate — naturalness judge over every accepted patch)..."
node scripts/extend-answers/judge-gate.mjs

echo "run-full.sh: sample-for-audit.mjs (12% stratified)..."
node scripts/extend-answers/sample-for-audit.mjs

echo "run-full.sh: report.mjs..."
node scripts/extend-answers/report.mjs

echo "run-full.sh: $(date) done. See $EXTEND_DIR/REPORT.md"
