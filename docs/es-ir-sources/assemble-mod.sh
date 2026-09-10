#!/bin/zsh
# zsh assemble-mod.sh m17  → header + m17-L*.yaml (sorted) + placement → repo IR
set -e
S=${0:A:h}; M=$1
REPO=${LINGO_ROOT:-/Users/lichfield/Documents/projects/lingle/lingo}
OUT=$REPO/src/features/languages/es/curriculum/ir/$M.ir.yaml
FILES=($S/$M-L[0-9]*.yaml); FILES=(${(on)FILES})
{ cat $S/$M-header.yaml; for f in $FILES; do cat $f; echo; done; cat $S/$M-placement.yaml; } > $OUT
echo "lessons: $(grep -c '^  - n: ' $OUT)  lines: $(wc -l < $OUT)  files: ${#FILES}"
