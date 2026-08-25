#!/bin/zsh
# Full-course local-model QA sweep — sequential (one model in VRAM at a time).
cd /Users/lichfield/Documents/projects/lingle/lingo
set -e
for m in m1 m2; do
  for p in confusion retention; do
    echo "=== $m $p ==="
    node scripts/course-qa/walk.mjs --module $m --persona $p --model qwen3.5:122b-a10b-q4_K_M
  done
done
for m in m1 m2 m3 m4 m5 m6 m7 m8 m9 m10; do
  echo "=== $m flow ==="
  node scripts/course-qa/walk.mjs --module $m --persona flow --model qwen3.5:122b-a10b-q4_K_M
done
echo "SWEEP DONE"
