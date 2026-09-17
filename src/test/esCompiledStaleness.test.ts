/**
 * ES compiled-vs-source staleness gate (2026-09-17 project review, storage
 * lane A6 — docs/progress-sync-contract-2026-09-17.md).
 *
 * The ES curriculum pipeline is YAML IR → `scripts/compile-ir-es.mjs` →
 * committed `src/features/languages/es/curriculum/mN.ts`, which the app
 * imports directly (see that script's header comment for why ES codegens a
 * TS source file instead of interpreting JSON at runtime like JA does). The
 * generated file is committed and NEVER hand-edited — but nothing enforced
 * that rule before this gate: a hand-edit to the compiled `.ts` (or an IR
 * edit that was never recompiled) drifts silently, because the app reads the
 * compiled file, not the IR, and the two only agree if someone remembered to
 * rerun the compiler. `es-compiled-ts-drift` (project memory) records this
 * happening for real during an emoji-refit pass.
 *
 * This test recompiles every `mN.ir.yaml` into a scratch directory (via
 * `ES_COMPILE_OUT_DIR`, an additive env override added to
 * `compile-ir-es.mjs` for exactly this purpose — the real committed files
 * are never written to) and diffs the result byte-for-byte against the
 * committed `mN.ts`. A mismatch means either the IR changed and nobody
 * recompiled, or the compiled file was hand-edited after the fact; either
 * way the two have drifted and the fix is `node scripts/compile-ir-es.mjs
 * mN`, never a hand edit to the `.ts`.
 *
 * Cost: measured at ~2.6s wall for all 36 modules (node startup dominates —
 * ~70ms/module; the compiler itself is a few ms of YAML parse + string
 * templating). Well under the ~10s threshold this lane was told to gate
 * on, so this runs in the normal fast suite, ungated — no slow-test flag
 * needed. If the module count grows enough to change that calculus, gate it
 * the same way `src/features/languages/_content/emitContent.test.ts` does
 * (`describe.skipIf(!process.env.SOME_FLAG)`), not by deleting the gate.
 */
import { describe, expect, it, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(__dirname, "../..");
const IR_DIR = join(ROOT, "src/features/languages/es/curriculum/ir");
const COMMITTED_DIR = join(ROOT, "src/features/languages/es/curriculum");
const COMPILER = join(ROOT, "scripts/compile-ir-es.mjs");

function esModuleIds(): string[] {
  return readdirSync(IR_DIR)
    .filter((f) => /^m\d+\.ir\.yaml$/.test(f))
    .map((f) => f.replace(/\.ir\.yaml$/, ""))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

const scratchDir = mkdtempSync(join(tmpdir(), "es-compiled-staleness-"));

afterAll(() => {
  rmSync(scratchDir, { recursive: true, force: true });
});

interface CompileResult {
  mod: string;
  ok: boolean;
  error?: string;
  stale?: boolean;
  diffPreview?: string;
}

function compileOne(mod: string): CompileResult {
  try {
    execFileSync(process.execPath, [COMPILER, mod], {
      cwd: ROOT,
      env: { ...process.env, ES_COMPILE_OUT_DIR: scratchDir },
      stdio: "pipe",
    });
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr?: Buffer | string }).stderr ?? "")
        : String(err);
    return { mod, ok: false, error: stderr.slice(0, 2000) };
  }

  const freshPath = join(scratchDir, `${mod}.ts`);
  const committedPath = join(COMMITTED_DIR, `${mod}.ts`);
  const fresh = readFileSync(freshPath, "utf8");
  const committed = readFileSync(committedPath, "utf8");

  if (fresh === committed) {
    return { mod, ok: true, stale: false };
  }

  // First differing line, for a useful failure message without dumping two
  // 60KB files into the test output.
  const freshLines = fresh.split("\n");
  const committedLines = committed.split("\n");
  let firstDiff = -1;
  const maxLen = Math.max(freshLines.length, committedLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (freshLines[i] !== committedLines[i]) {
      firstDiff = i;
      break;
    }
  }
  const preview =
    firstDiff >= 0
      ? `line ${firstDiff + 1}:\n  committed: ${JSON.stringify(committedLines[firstDiff] ?? "<EOF>")}\n  recompiled: ${JSON.stringify(freshLines[firstDiff] ?? "<EOF>")}`
      : `same content, different length (${committedLines.length} vs ${freshLines.length} lines)`;

  return { mod, ok: true, stale: true, diffPreview: preview };
}

describe("ES compiled-vs-source staleness", () => {
  const modules = esModuleIds();

  it("found the expected IR modules (m3..m38 as of 2026-09-17 — update this if the range moves)", () => {
    expect(modules.length).toBeGreaterThanOrEqual(30);
    expect(modules[0]).toBe("m3");
  });

  it("every committed mN.ts matches a fresh recompile of its mN.ir.yaml", () => {
    const results = modules.map(compileOne);

    const compileErrors = results.filter((r) => !r.ok);
    const stale = results.filter((r) => r.ok && r.stale);

    if (compileErrors.length > 0) {
      const detail = compileErrors
        .map((r) => `${r.mod}: ${r.error}`)
        .join("\n---\n");
      throw new Error(
        `${compileErrors.length} ES IR module(s) failed to recompile (this is a compiler/IR validity failure, not a staleness diff):\n${detail}`,
      );
    }

    if (stale.length > 0) {
      const detail = stale
        .map((r) => `${r.mod}:\n${r.diffPreview}`)
        .join("\n\n");
      throw new Error(
        `${stale.length} ES module(s) have a committed .ts that does not match a fresh compile of its .ir.yaml: ${stale.map((r) => r.mod).join(", ")}\n\n` +
          `Fix by recompiling from IR (never hand-edit the compiled .ts — see es-compiled-ts-drift in project memory):\n` +
          stale.map((r) => `  node scripts/compile-ir-es.mjs ${r.mod}`).join("\n") +
          `\n\n${detail}`,
      );
    }

    expect(stale).toHaveLength(0);
  });
});
