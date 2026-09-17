/**
 * Procedural QA RATCHET gate (2026-09-17 project review — lane A7 drafted
 * the questions, lane A7b converted this into a ratchet and corrected Q4/Q7 —
 * `docs/procedural-qa-2026-09-17.md`).
 *
 * A count may never rise (repo doctrine — `regression-classes` C7). This
 * gate runs the ENFORCED procedural-QA questions (`scripts/qa/procedural/`)
 * over every JA lesson in the emitted runtime JSON and fails ONLY when an
 * enforced question's finding count EXCEEDS its committed baseline
 * (`proceduralQa.baseline.json`) — never on the pre-existing count itself.
 * That baseline is today's TRUE count, corrected 2026-09-17 (A7's original
 * 655 Q7 findings were a checker bug — the ported `hasTtsClip` mirrored only
 * `resolveTtsPath`'s direct hash lookup, not the full `getTtsUrl` fallback
 * chain every real call site uses; true count is 1, see
 * `scripts/qa/procedural/lib/ttsCoverage.mjs` and
 * `docs/procedural-qa-2026-09-17.md` §3/§4) and Q4's original 5 findings
 * were the port using a different, over-sensitive atom source than the real
 * `particleTileSeparation.test.ts` gate it claims to mirror (fixed to 0, see
 * `scripts/qa/procedural/lib/lexicon.mjs`'s `getCourseAtomSurfaces`). Q10's
 * one finding (a raw kanji in a kana-graded dialogue field, m42) was a plain
 * authoring slip, fixed in the IR — baseline 0. Q9's 4 findings (m1's ya/wa
 * kana-row lessons, outside the 10-25 step band) are pre-existing and out of
 * this lane's file-ownership scope — baselined as-is, not fixed here.
 *
 * A raised baseline number requires the same proof as any other ratchet:
 * state the cause, prove it's a re-measurement and not new debt, and flag it
 * explicitly — never quietly re-baseline (`regression-classes` C7,
 * `content-change` §5).
 *
 * 2026-09-17, lane A7c: Q2 and Q3 PROMOTED to enforced (both were
 * informational at v2, measured <0.9 precision). v3 rewrote both
 * dictionary-first against JMdict + the course atom lexicon instead of
 * heuristics alone (`docs/procedural-qa-2026-09-17.md` §3's v2 -> v3
 * table) — Q2 re-measured at 2/2 (100%) true positives (both the same
 * pre-existing `たべすぎた`-before-registration defect, m27, baselined
 * here rather than fixed — out of this lane's file-ownership scope) and
 * Q3 at 0/4,125 hits course-wide (nothing to audit; capability to still
 * say "no" proven separately by `checks.test.mjs`'s planted-defect case).
 * Baseline Q2:2, Q3:0.
 *
 * 2026-09-17, lane A7c (perf follow-up): the informational report that
 * used to live in a second, non-blocking `it()` here (Q1/Q6 counts) is
 * GONE from this file. It was already `skipIf(CI)` (report-only, printed
 * counts for a human), but locally it was the preflight's long pole —
 * lane A5a measured this file at ~83s of an ~91s local suite. It is now a
 * plain CLI report instead: `npm run qa:procedural -- --lang ja
 * --informational-summary` (or scope with `--module mN`). This file now
 * runs ONLY the ratchet.
 *
 * This shells out to `scripts/qa/procedural/run.mjs` rather than
 * reimplementing its logic in TS: the CLI and this gate must never drift
 * (see `docs/procedural-qa-2026-09-17.md`'s "one runner" doctrine), and the
 * runner already needs Node (not a browser/vitest) environment for its
 * `vite.ssrLoadModule` TS bridge.
 *
 * Cost: `run.mjs` also maintains a per-module, content-hash-keyed verdict
 * cache (`lib/verdictCache.mjs`) under `artifacts/qa/procedural/verdicts/`
 * (gitignored) — a REPEATED local run against unchanged content/checkers
 * costs a cache read (measured: 22.4s cold -> 1.0s warm, this machine). A
 * fresh checkout (CI) is always cold, so the CI timeout below is
 * UNCHANGED — the cache cannot help a cold run, only a warm re-run within
 * one workspace. CI runners are ~4x slower than the M5 Max (this machine:
 * ~20-25s cold; CI: budget accordingly).
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import baseline from "./proceduralQa.baseline.json";

const ROOT = join(__dirname, "../..");
const RUN_SCRIPT = join(ROOT, "scripts/qa/procedural/run.mjs");
// CI runners are ~4× slower than the M5 Max (19 s local → 43 s+ on GitHub); budget for the
// full course there, so the newest-5 fallback stays the exception, not the CI default. NOT
// lowered by the verdict cache below — CI always starts cold (fresh checkout, artifacts/
// gitignored), so a cache miss pays the same cost it always did.
const FULL_RUN_TIMEOUT_MS = 150_000;

type Finding = { lessonId: string; stepId: string; evidence: string[] };
type QaReport = {
  rows: { lessonId: string; stepId: string; stepType: string; results: Record<string, { answer: string; evidence: string[] }> }[];
  anyEnforcedFail: boolean;
  failsByQuestion: Record<string, Finding[]>;
};

function moduleIds(): string[] {
  const manifest = JSON.parse(
    require("node:fs").readFileSync(join(ROOT, "src/pub/content/v1/manifest.json"), "utf8"),
  );
  return manifest.languages.ja.modules.map((m: { id: string }) => m.id);
}

// Output goes to a file (`--out`), not stdout: a large captured-error
// stdout has been observed truncated (Node child_process quirk on the
// non-zero-exit path) — a file read has no such cap.
function runProceduralQa(args: string[], timeoutMs?: number): QaReport {
  const scratch = mkdtempSync(join(tmpdir(), "procedural-qa-"));
  const outPath = join(scratch, "report.json");
  try {
    execFileSync(
      process.execPath,
      [RUN_SCRIPT, "--lang", "ja", "--out", outPath, ...args],
      { encoding: "utf8", cwd: ROOT, timeout: timeoutMs, stdio: ["ignore", "ignore", "pipe"] },
    );
  } catch (err) {
    // Non-zero exit (enforced failures) still writes the file before
    // exiting — only re-throw if the file truly never landed (timeout,
    // crash before the write).
    const e = err as { signal?: string | null };
    if (!existsSyncSafe(outPath)) throw err;
    void e;
  }
  const report = JSON.parse(readFileSync(outPath, "utf8"));
  rmSync(scratch, { recursive: true, force: true });
  return report;
}

function existsSyncSafe(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}

/** Full-course run, with the same "fall back to the newest 5 modules on
 *  timeout" defensive scoping the original gate used, so CI hardware
 *  variance never produces a silent narrowing — the scope used is always
 *  logged. */
function runFullCourse(extraArgs: string[], timeoutMs: number): { report: QaReport; scope: string } {
  const all = moduleIds();
  const newest5 = all.slice(-5);
  try {
    const report = runProceduralQa(extraArgs, timeoutMs);
    return { report, scope: `all ${all.length} modules` };
  } catch {
    console.warn(
      `[proceduralQa] full-course run did not finish within budget; falling back to the newest 5 modules (${newest5.join(", ")})`,
    );
    const merged: QaReport = { rows: [], anyEnforcedFail: false, failsByQuestion: {} };
    for (const m of newest5) {
      const r = runProceduralQa([...extraArgs, "--module", m]);
      merged.rows.push(...r.rows);
      merged.anyEnforcedFail = merged.anyEnforcedFail || r.anyEnforcedFail;
      for (const [qid, fails] of Object.entries(r.failsByQuestion)) {
        (merged.failsByQuestion[qid] ??= []).push(...fails);
      }
    }
    return {
      report: merged,
      scope: `newest 5 modules (${newest5.join(", ")}) — fallback, full course exceeded ${timeoutMs}ms`,
    };
  }
}

describe("procedural QA ratchet (enforced questions, JA)", () => {
  it(
    "no enforced question's finding count exceeds its committed baseline",
    () => {
      const { report, scope } = runFullCourse(["--enforced-only"], FULL_RUN_TIMEOUT_MS);
      console.log(`[proceduralQa] scope: ${scope}`);

      const counts: Record<string, number> = {};
      for (const [qid, fails] of Object.entries(report.failsByQuestion)) counts[qid] = fails.length;
      console.log(`[proceduralQa] counts: ${JSON.stringify(counts)}`);

      const baselineMap = baseline as Record<string, number>;
      const regressions: string[] = [];
      for (const [qid, count] of Object.entries(counts)) {
        const allowed = baselineMap[qid] ?? 0;
        if (count > allowed) {
          const findings = report.failsByQuestion[qid]
            .map((f) => `    - ${f.lessonId}/${f.stepId}: ${f.evidence.join("; ")}`)
            .join("\n");
          regressions.push(
            `${qid}: ${count} finding(s), exceeds committed baseline ${allowed} (see src/test/proceduralQa.baseline.json)\n${findings}`,
          );
        }
      }

      expect(
        regressions,
        `procedural-QA ratchet tripped (${scope}) — a count rose above its committed baseline. ` +
          `Either fix the new finding(s), or prove the rise is a re-measurement (not new debt) and ` +
          `update the baseline explicitly (regression-classes C7):\n\n` +
          regressions.join("\n\n"),
      ).toEqual([]);
    },
    FULL_RUN_TIMEOUT_MS + 60_000,
  );
});
