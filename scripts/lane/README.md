# Lane toolset

Cuts subagent round-trips and output bytes. Measured 2026-09-18 on three lanes:
SYNC 162 calls/33min/12.2s per call, FB30 273/36min/7.9s, CALIB 112/14min/7.7s —
the lever is FEWER calls and SMALLER results, not more checks.

| Tool | Use it for |
|---|---|
| `test.sh <files/dirs>` | scoped vitest, failures + totals only, `--project curriculum\|app`, `--tsc` |
| `find.mjs "<query>"` | one-call code search: semantic candidates (if indexed) confirmed by grep, top 12; `--lang` also locates a sentence in emitted content |
| `step-url.mjs "<sentence or lessonId>" --lang ja` | dev `?step=N` URL(s) for a screenshot sentence, 0-indexed |
| `stats.mjs <transcript.jsonl>...` | this table, ported — run it on your own lane transcript before reporting done |
| `sim-proof.sh "<lessonId>?step=N" [--scales 100,125] [--simulate build] [--replay <golden>] [--port 54xx] [--lane NAME]` | ONE call proves a step on the real 15 Pro Max sim: sim.lock queueing + an isolated dev-server port + one compact `scale \| verdicts \| screenshot \| fit-scale \| overflow px` table, instead of the boot/tap/probe/shot choreography by hand (measured: GHOST made ~250 raw Bash calls doing this) |

`--help` on every tool. `node --test scripts/lane/*.test.mjs` runs the fixture tests.

## The four efficiency rules

1. **Batch independent commands** into one tool call — don't serialize calls that don't depend on each other.
2. **`tsc` at most twice** per lane (once mid-way, once before reporting done).
3. **Scoped vitest at most 4 runs** — scope to the directory you touched, not the whole suite.
4. **Never dump a file >200 lines or a test log unfiltered** — `head`/`sed -n`/`test.sh` instead of `cat`.
