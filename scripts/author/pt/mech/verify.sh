#!/usr/bin/env bash
# verify.sh <spec.yaml> <out-dir> — the ONE command a writing lane runs: spec-lint → generator + check.sh (scratch) → sim-check.
# Prints ≤ 40 lines. Exit 0 only when all three pass.
set -uo pipefail
SPEC="${1:?spec}"; OUT="${2:?out-dir}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
RC=0
python3 "$HERE/spec-lint.py" "$SPEC" --fix-allow || RC=1
if [ "$RC" -eq 0 ]; then
  bash "$HERE/run.sh" "$SPEC" "$OUT"; R2=$?; [ "$R2" -ne 0 ] && RC=1
  N=$(grep -m1 '^lesson:' "$SPEC" | awk '{print $2}'); MOD=$(grep -m1 '^id:' "$SPEC" | sed -E 's/.*pt-(m[0-9]+)-.*/\1/')
  python3 "$HERE/sim-check.py" "$SPEC" "$SPEC" --spec || RC=1
fi
echo "verify: $( [ "$RC" -eq 0 ] && echo PASS || echo FAIL )"
exit $RC
