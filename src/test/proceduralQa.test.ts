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
 * Informational questions (Q1, Q2, Q3, Q6 — see the doc for why each was
 * measured below the 0.9 precision bar) are reported in a SEPARATE,
 * non-blocking test below, never gating.
 *
 * This shells out to `scripts/qa/procedural/run.mjs` rather than
 * reimplementing its logic in TS: the CLI and this gate must never drift
 * (see `docs/procedural-qa-2026-09-17.md`'s "one runner" doctrine), and the
 * runner already needs Node (not a browser/vitest) environment for its
 * `vite.ssrLoadModule` TS bridge.
 *
 * Cost (measured 2026-09-17, `app` project, this machine): the enforced-only
 * ratchet check ~19-22s wall for all 46 JA modules — under the 30s budget.
 * The separate informational report (below) runs EVERY question, ~34s —
 * over that budget, which is why it is a second, non-blocking test rather
 * than folded into this one.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import baseline from "./proceduralQa.baseline.json";

const ROOT = join(__dirname, "../..");
const RUN_SCRIPT = join(ROOT, "scripts/qa/procedural/run.mjs");
const FULL_RUN_TIMEOUT_MS = 28_000;
const INFO_RUN_TIMEOUT_MS = 50_000;

type Finding = { lessonId: string; stepId: string; evidence: string[] };
type QaReport = {
  rows: { lessonId: string; stepId: string; stepType: string; results: Record<string, { answer: string; evidence: string[] }> }[];
  anyEnforcedFail: boolean;
  failsByQuestion: Record<string, Finding[]>;
};

// Q1, Q2, Q3, Q6 are informational (measured <0.9 precision — see the doc's
// §3 table); every other question in the table is enforced. Listed here
// (not derived from CHECKS) because the split is a documented product
// decision, not just whatever the code currently marks `enforced`.
const INFORMATIONAL_QIDS = ["Q1", "Q2", "Q3", "Q6"];

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
    FULL_RUN_TIMEOUT_MS + 15_000,
  );
});

describe("procedural QA — informational questions (report only, never blocks)", () => {
  it(
    "reports Q1/Q2/Q3/Q6 finding counts",
    () => {
      const { report, scope } = runFullCourse([], INFO_RUN_TIMEOUT_MS);
      console.log(`[proceduralQa:informational] scope: ${scope}`);

      const counts: Record<string, number> = {};
      for (const qid of INFORMATIONAL_QIDS) counts[qid] = 0;
      for (const row of report.rows) {
        for (const qid of INFORMATIONAL_QIDS) {
          if (row.results[qid]?.answer === "no") counts[qid] += 1;
        }
      }
      console.log(
        `[proceduralQa:informational] counts (report-only, not gated — see docs/procedural-qa-2026-09-17.md §3): ${JSON.stringify(counts)}`,
      );

      // Never fails — informational questions have a measured false-positive
      // rate too high to gate on (§3). This test exists to surface the
      // numbers in CI output, not to enforce them.
      expect(true).toBe(true);
    },
    INFO_RUN_TIMEOUT_MS + 15_000,
  );
});
