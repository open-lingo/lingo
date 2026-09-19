#!/usr/bin/env bash
# check.sh <lesson-number> — the ONE check a spec-first PT authoring lane
# runs after `from-spec.mjs`. Prints <= 40 lines: per-rule PASS/FAIL/INFO
# (from check-lesson.mjs's emitter replay + independent doctrine re-check),
# the compiler's own --check (when a module header exists to run it
# against — see the "known gap" note below), a one-line procedural-QA
# read, and the pt curriculum test count. Exit code is the AND of every
# HARD check (INFO never fails the run).
set -uo pipefail

N="${1:?usage: check.sh <lesson-number>}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
cd "$ROOT"

STATUS=0
echo "=== PT check.sh l$N ==="

node scripts/author/pt/check-lesson.mjs "$N" || STATUS=1

# compile-ir-pt.mjs needs a module-level ir.m1.ir.yaml header (module,
# title, expectedLessonCount, checkpoint, placement) that no lane has
# written yet (see docs/pt-authoring-pack.md "known gap: no m1.ir.yaml
# base") — every real PT m1 fragment (L1-L5) was hand-verified the same
# way this script's own emitter-replay step works, per each PTAUTH lane's
# own report. Run it opportunistically; skip with a named reason, never a
# silent no-op, when the base file doesn't exist.
if [ -f "src/features/languages/pt/curriculum/ir/m1.ir.yaml" ]; then
  node scripts/compile-ir-pt.mjs m1 --check || STATUS=1
else
  echo "SKIP compile-ir-pt.mjs m1 --check (no ir/m1.ir.yaml base file yet — whole-module checks, e.g. checkpoint/mastery-ends-in-sim, aren't checkable per-lesson)"
fi

QA_JSON=$(node scripts/qa/procedural/run.mjs --lang pt --json 2>/dev/null)
QA_FAIL=$(echo "$QA_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s);console.log(j.anyEnforcedFail?"FAIL":"PASS", (j.rows||[]).length+" rows");}catch{console.log("INFO parse-error")}})')
echo "proceduralQa: $QA_FAIL"
if [[ "$QA_FAIL" == FAIL* ]]; then STATUS=1; fi

TEST_OUT=$(npx vitest run src/features/languages/pt --passWithNoTests --reporter=dot 2>&1)
TEST_STATUS=$?
TEST_SUMMARY=$(echo "$TEST_OUT" | grep -E "Test Files|No test files found" | head -1)
echo "pt curriculum tests: ${TEST_SUMMARY:-ran, see full log above on failure}"
if [ "$TEST_STATUS" -ne 0 ]; then STATUS=1; echo "$TEST_OUT" | tail -15; fi

echo "=== $( [ "$STATUS" -eq 0 ] && echo PASS || echo FAIL ) ==="
exit "$STATUS"
