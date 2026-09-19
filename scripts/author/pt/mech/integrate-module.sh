#!/usr/bin/env bash
# integrate-module.sh <mN> <module-header.ir.yaml> — generate every lesson of a module INTO THE REAL TREE in order
# (l1..l6, each check.sh run sees the previous lessons' real atoms), land the module header, compile.
# Prints ≤ 60 lines. Exit 1 on the first failing lesson.
set -uo pipefail
MOD="${1:?module}"; HDR="${2:?module header yaml}"; HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; ROOT="$(cd "$HERE/../../../.." && pwd)"; cd "$ROOT"
PT=src/features/languages/pt
for K in 1 2 3 4 5 6; do
  SPEC="scripts/author/pt/specs/pt-$MOD-l$K.yaml"; [ -f "$SPEC" ] || { echo "MISSING $SPEC"; exit 1; }
  rm -f "$PT/courseAtoms.$MOD-l$K.ts"   # drop the spine stub; from-spec writes the real one
  node scripts/author/pt/from-spec.mjs "$SPEC" 2>&1 | grep -E 'spec:|error|Error|wrote|steps|atoms' | head -6
  bash scripts/author/pt/check.sh "$K" 6 --module "$MOD" 2>&1 | grep -E '^(FAIL|=== )|cannot read|spec:' | head -8 | sed "s/^/l$K: /"
  if bash scripts/author/pt/check.sh "$K" 6 --module "$MOD" >/dev/null 2>&1; then echo "l$K: check PASS"; else echo "l$K: check FAIL"; exit 1; fi
done
cp "$HDR" "$PT/curriculum/ir/$MOD.ir.yaml"
node scripts/compile-ir-pt.mjs "$MOD" --check 2>&1 | tail -3 && node scripts/compile-ir-pt.mjs "$MOD" 2>&1 | tail -2
echo "integrate $MOD: done"
