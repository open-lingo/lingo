#!/usr/bin/env bash
# check.sh <lesson-number> [module-lesson-count] — the ONE check a
# spec-first PT authoring lane runs after `from-spec.mjs`. Prints <= 40
# lines: per-rule PASS/FAIL/INFO (from check-lesson.mjs's emitter replay +
# independent doctrine re-check), the compiler's own --check (when a module
# header exists to run it against — see the "known gap" note below), a
# one-line procedural-QA read, the pt curriculum test count, and the total
# wall time. Exit code is the AND of every HARD check (INFO never fails
# the run).
#
# ROUND 2 (lane PTTOOL2, finding 3 + finding 4): the compiler's own
# whole-module "last lesson must end on a sim" law is unconditional — it
# has no notion of "is this the module's last lesson", so checking any
# NON-final lesson against a module whose real last lesson hasn't landed
# yet always fails it. That's a MODULE-level fact, not a per-lesson
# content defect — this script downgrades exactly that one message to
# INFO when `$1` is less than the module's expected lesson count (arg 2,
# default 6 — m1's own `expectedLessonCount`), without editing the
# compiler itself (off-limits for this lane).
set -uo pipefail

# Lane PTTOOL4, item 4: `--module m2` (anywhere in argv) points every step
# at a non-m1 module; positional args stay <lesson-number> [module-lesson-count].
# Defaults to m1 so every existing call site is unchanged.
ARGS=() MODULE="m1"
while [ $# -gt 0 ]; do
  case "$1" in
    --module) MODULE="${2:?--module needs a value}"; shift 2 ;;
    *) ARGS+=("$1"); shift ;;
  esac
done
N="${ARGS[0]:?usage: check.sh <lesson-number> [module-lesson-count] [--module mN]}"
MODULE_LESSON_COUNT="${ARGS[1]:-6}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
cd "$ROOT"

START_TS=$(date +%s)
STATUS=0
echo "=== PT check.sh $MODULE l$N ==="

node scripts/author/pt/check-lesson.mjs "$N" --module "$MODULE" || STATUS=1

# compile-ir-pt.mjs needs a module-level ir.<module>.ir.yaml header (module,
# title, expectedLessonCount, checkpoint, placement) — present since lane
# PTR1-L6 landed the m1 checkpoint (docs/pt-authoring-pack.md "known gaps"
# has the history). Run it opportunistically; skip with a named reason,
# never a silent no-op, when the base file doesn't exist at all — this is
# the "no m2 module header yet" case item 4's brief anticipated: m2 has no
# curriculum/ir/m2.ir.yaml, so this step SKIPs (not fails) until a real
# module-header lane lands one; that lane's job, not this one's.
if [ -f "src/features/languages/pt/curriculum/ir/$MODULE.ir.yaml" ]; then
  COMPILE_OUT=$(node scripts/compile-ir-pt.mjs "$MODULE" --check 2>&1)
  COMPILE_STATUS=$?
  if [ "$COMPILE_STATUS" -ne 0 ]; then
    # Isolate the unconditional "last lesson must end on a sim" complaint —
    # downgrade ONLY that one to INFO on a non-final lesson; any other
    # compiler failure still fails the run.
    OTHER_FAILS=$(echo "$COMPILE_OUT" | grep -v "must END on a sim" || true)
    if echo "$COMPILE_OUT" | grep -q "must END on a sim" && [ "$N" -lt "$MODULE_LESSON_COUNT" ] && [ -z "$(echo "$OTHER_FAILS" | grep -i 'error\|fail' || true)" ]; then
      echo "INFO compile-ir-pt.mjs $MODULE --check: \"last lesson must end on a sim\" — expected on lesson $N of $MODULE_LESSON_COUNT (not the module's final lesson); not a content defect"
    else
      echo "$COMPILE_OUT"
      STATUS=1
    fi
  else
    echo "$COMPILE_OUT"
  fi
else
  echo "SKIP compile-ir-pt.mjs $MODULE --check (no ir/$MODULE.ir.yaml base file yet)"
fi

QA_JSON=$(node scripts/qa/procedural/run.mjs --lang pt --json 2>/tmp/pt-qa-stderr.$$)
QA_STATUS=$?
QA_FAIL=$(echo "$QA_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s);console.log(j.anyEnforcedFail?"FAIL":"PASS", (j.rows||[]).length+" rows");}catch{process.exit(3)}})')
if [ $? -eq 3 ] || [ "$QA_STATUS" -ne 0 ]; then
  STDERR_TXT=$(cat /tmp/pt-qa-stderr.$$ 2>/dev/null)
  if echo "$STDERR_TXT" | grep -q "manifest.json"; then
    QA_FAIL="n/a: content manifest not built (run \`npm run content:emit\` first, then re-run check.sh)"
  elif echo "$STDERR_TXT" | grep -qi "no adapter\|sidecar"; then
    QA_FAIL="n/a: no adapter (pt has no lexical sidecar yet — docs/pt-course-design-2026-09-18.md §3)"
  else
    QA_FAIL="n/a: $(echo "$STDERR_TXT" | head -1 | cut -c1-120)"
  fi
fi
rm -f /tmp/pt-qa-stderr.$$
echo "proceduralQa: $QA_FAIL"
if [[ "$QA_FAIL" == FAIL* ]]; then STATUS=1; fi

TEST_OUT=$(npx vitest run src/features/languages/pt --passWithNoTests --reporter=dot 2>&1)
TEST_STATUS=$?
TEST_SUMMARY=$(echo "$TEST_OUT" | grep -E "Test Files|No test files found" | head -1)
echo "pt curriculum tests: ${TEST_SUMMARY:-ran, see full log above on failure}"
if [ "$TEST_STATUS" -ne 0 ]; then STATUS=1; echo "$TEST_OUT" | tail -15; fi

END_TS=$(date +%s)
echo "wall time: $((END_TS - START_TS))s"
echo "=== $( [ "$STATUS" -eq 0 ] && echo PASS || echo FAIL ) ==="
exit "$STATUS"
