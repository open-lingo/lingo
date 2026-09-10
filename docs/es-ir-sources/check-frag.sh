#!/bin/zsh
# zsh check-frag.sh m17 <tag 1-9> <lesson-file>...  — sandwich between m15 L1/L10 stubs, compile --check
set -e
S=${0:A:h}; M=$1; TAG=$2; shift 2
REPO=${LINGO_ROOT:-/Users/lichfield/Documents/projects/lingle/lingo}
MOD=m990$TAG; IRDIR=$REPO/src/features/languages/es/curriculum/ir; OUT=$IRDIR/$MOD.ir.yaml
python3 - "$S" "$OUT" "$MOD" "$M" "$@" <<'PY'
import re, sys
S, out, mod, M, *files = sys.argv[1:]
head = open(f"{S}/{M}-header.yaml").read(); place = open(f"{S}/{M}-placement.yaml").read()
import os; m15 = open(os.environ.get("LINGO_ROOT", "/Users/lichfield/Documents/projects/lingle/lingo") + "/src/features/languages/es/curriculum/ir/m15.ir.yaml").read()
def block(n):
    return re.search(rf"^  - n: {n}\n.*?(?=^  - n: \d+\n|^placement:)", m15, flags=re.M|re.S).group(0)
frag = "".join(open(f).read().rstrip("\n") + "\n" for f in files)
body = block(1) + frag + block(10)
n=[0]
def renum(m): n[0]+=1; return f"  - n: {n[0]}"
body = re.sub(r"^  - n: \d+", renum, body, flags=re.M)
head = re.sub(r"^module: .*", f"module: {mod}", head, flags=re.M)
head = re.sub(r"^expectedLessonCount: .*", f"expectedLessonCount: {n[0]}", head, flags=re.M)
head = re.sub(r"^checkpoint: .*", "checkpoint: 2", head, flags=re.M)
open(out,"w").write(head+body+place)
PY
cd $REPO; set +e
node scripts/compile-ir-es.mjs $MOD --check 2>&1; rc=$?
rm -f $OUT $REPO/src/features/languages/es/curriculum/$MOD.ts
[[ $rc -eq 0 ]] && echo "FRAGMENT OK" || echo "FRAGMENT FAILED (exit $rc)"; exit $rc
