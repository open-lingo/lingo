#!/usr/bin/env bash
# run.sh <spec.yaml> <out-dir> — generate the fragment from a spec into a SCRATCH dir and check it there.
# Prints at most ~20 lines: the generator's one-line summary, then every FAIL line (or PASS). Exit = check status.
set -uo pipefail
SPEC="${1:?spec}"; OUT="${2:?out-dir}"; N=$(grep -m1 '^lesson:' "$SPEC" | awk '{print $2}'); MOD=$(grep -m1 '^id:' "$SPEC" | sed -E 's/.*pt-(m[0-9]+)-.*/\1/')
mkdir -p "$OUT"
PT_SPEC_OUT_DIR="$OUT" node scripts/author/pt/from-spec.mjs "$SPEC" 2>&1 | grep -E 'spec:|error|Error|wrote|steps|atoms|smallest fix|schedule:|from-spec:|unique|YAML|line [0-9]+, column' | head -8
PT_SPEC_OUT_DIR="$OUT" bash scripts/author/pt/check.sh "$N" 6 --module "$MOD" 2>&1 | grep -E '^(FAIL|=== )|cannot read|spec:' | head -14
