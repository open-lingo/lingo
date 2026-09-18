#!/usr/bin/env bash
# A5d — sequential grid runner: iterates model x lang x variant, one Ollama
# call at a time (kappa.mjs itself waits for a free model slot before every
# call, so this is safe even if another lane is using Ollama concurrently).
#
# Usage: scripts/naturalness/run-grid.sh <model-tag> <lang1,lang2,...> <variant1,variant2,...> [rows]
#
# Per lane-common budget: stop a (model,lang) pair after ~20 minutes and
# reduce rows if you hit that — this script does not itself enforce the
# clock, the operator does (see docs/judge-calibration-2026-09-17.md log).
set -euo pipefail
cd "$(dirname "$0")/../.."

MODEL="$1"
IFS=',' read -ra LANGS <<< "$2"
IFS=',' read -ra VARIANTS <<< "$3"
ROWS="${4:-}"

for lang in "${LANGS[@]}"; do
  echo "=== $MODEL / $lang ==="
  for variant in "${VARIANTS[@]}"; do
    echo "--- $MODEL / $lang / $variant ---"
    if [ -n "$ROWS" ]; then
      node scripts/naturalness/kappa.mjs --model "$MODEL" --lang "$lang" --prompt "$variant" --rows "$ROWS" --quiet
    else
      node scripts/naturalness/kappa.mjs --model "$MODEL" --lang "$lang" --prompt "$variant" --quiet
    fi
  done
done
