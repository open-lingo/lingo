/**
 * Procedural QA gate (2026-09-17 project review, authoring lane A7 —
 * `docs/procedural-qa-2026-09-17.md`).
 *
 * Runs the ENFORCED procedural-QA questions (`scripts/qa/procedural/`) over
 * every JA lesson in the emitted runtime JSON. Informational questions
 * (Q1, Q2, Q3, Q6 — see the doc for why each was measured below the 0.9
 * precision bar) are skipped here entirely (`--enforced-only`); this gate
 * is about the questions with a proven low false-positive rate.
 *
 * This shells out to `scripts/qa/procedural/run.mjs` rather than
 * reimplementing its logic in TS: the CLI and this gate must never drift
 * (see `docs/procedural-qa-2026-09-17.md`'s "one runner" doctrine), and the
 * runner already needs Node (not a browser/vitest) environment for its
 * `vite.ssrLoadModule` TS bridge.
 *
 * Cost: measured ~19s wall for all 46 JA modules locally (2026-09-17,
 * enforced-only). Under the 30s budget this lane was told to gate on, so
 * it runs full-course — but CI hardware varies, so this still times out
 * defensively at 28s and falls back to the newest 5 modules if the full
 * run doesn't finish, printing which scope it used either way (never a
 * silent narrowing).
 *
 * FINDINGS ARE REPORTED, NOT FIXED, BY THIS LANE (A7's file-ownership
 * rule) — this test is therefore EXPECTED to be red on first landing: it
 * surfaces real, pre-existing content gaps (missing TTS clips on the
 * newest modules, one kanji leaked into a kana-graded dialogue line — see
 * the doc's findings table), not a bug in the runner. That is the point of
 * a procedural gate: it should fail exactly when the invariant it checks
 * is actually violated. Fixing those findings is separate authoring work.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(__dirname, "../..");
const RUN_SCRIPT = join(ROOT, "scripts/qa/procedural/run.mjs");
const FULL_RUN_TIMEOUT_MS = 28_000;

type QaReport = {
  anyEnforcedFail: boolean;
  failsByQuestion: Record<string, { lessonId: string; stepId: string; evidence: string[] }[]>;
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
      [RUN_SCRIPT, "--lang", "ja", "--enforced-only", "--out", outPath, ...args],
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

describe("procedural QA gate (enforced questions, JA)", () => {
  it(
    "every enforced question answers yes (or n/a) across the JA course",
    () => {
      const all = moduleIds();
      const newest5 = all.slice(-5);

      let report: QaReport;
      let scope: string;
      try {
        report = runProceduralQa([], FULL_RUN_TIMEOUT_MS);
        scope = `all ${all.length} modules`;
      } catch {
        // Only reaches here on an actual timeout/crash (runProceduralQa
        // itself swallows the expected "exit 1 on real findings" case) —
        // fall back to the newest 5 modules, one run per module (run.mjs
        // takes a single --module at a time), merged.
        console.warn(
          `[proceduralQa] full-course run did not finish within budget; falling back to the newest 5 modules (${newest5.join(", ")})`,
        );
        const merged: QaReport = { anyEnforcedFail: false, failsByQuestion: {} };
        for (const m of newest5) {
          const r = runProceduralQa(["--module", m]);
          merged.anyEnforcedFail = merged.anyEnforcedFail || r.anyEnforcedFail;
          for (const [qid, fails] of Object.entries(r.failsByQuestion)) {
            (merged.failsByQuestion[qid] ??= []).push(...fails);
          }
        }
        report = merged;
        scope = `newest 5 modules (${newest5.join(", ")}) — fallback, full course exceeded ${FULL_RUN_TIMEOUT_MS}ms`;
      }

      console.log(`[proceduralQa] scope: ${scope}`);
      if (report.anyEnforcedFail) {
        const summary = Object.entries(report.failsByQuestion)
          .map(([qid, fails]) => `${qid}: ${fails.length} failure(s)`)
          .join(", ");
        console.log(`[proceduralQa] ${summary}`);
      }

      expect(
        report.anyEnforcedFail,
        `enforced procedural-QA questions failed (${scope}) — see docs/procedural-qa-2026-09-17.md and run ` +
          `\`node scripts/qa/procedural/run.mjs --lang ja --module <mN>\` for full evidence:\n` +
          JSON.stringify(report.failsByQuestion, null, 1).slice(0, 4000),
      ).toBe(false);
    },
    FULL_RUN_TIMEOUT_MS + 15_000,
  );
});
