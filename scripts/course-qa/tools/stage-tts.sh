#!/bin/zsh
# stage-tts.sh <minutes> — copy freshly generated es clips into lingo/tts-publish, absolute paths only.
set -e
LINGO=/Users/lichfield/Documents/projects/lingle/lingo
DATA=/Users/lichfield/Documents/projects/lingle/lingo-data
n=0
for f in $(find $DATA/out/tts/es -name "*.mp3" -mmin -${1:-10}); do
  b=$(basename "$f")
  if [ ! -f "$LINGO/tts-publish/es/$b" ]; then cp "$f" "$LINGO/tts-publish/es/$b"; n=$((n+1)); fi
done
echo "staged $n new clips; untracked total: $(cd $LINGO && git status --porcelain tts-publish/es | wc -l | tr -d ' ')"
