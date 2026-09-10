#!/usr/bin/env -S npx vite-node
/**
 * Blast-radius measurement for the module-wide filler pool change
 * (moduleCompiler.ts, rep-audit-2026-09-09 finding 2).
 *
 * Compiles every ja/curriculum/ir/*.ir.json module through the real
 * `compileModule()` and dumps every step's rendered surface text to JSON.
 * Run once on the pre-fix tree and once on the post-fix tree (checkout /
 * stash the moduleCompiler.ts change between runs), then diff the two
 * dumps: count how many steps' surface changed, split by filler (id
 * contains "-fill-") vs non-filler, per module. Run with vite-node — plain
 * tsx breaks on `import.meta.env` in shared/config/marketing.ts, same as
 * the rep-audit's own script.
 *
 * Usage:
 *   npx vite-node scripts/fillerPoolBlastRadius.ts dump <out.json>
 *   node scripts/fillerPoolBlastRadius.ts diff <before.json> <after.json>
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compileModule } from "../src/features/lesson/data/moduleCompiler";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IR_DIR = join(__dirname, "../src/features/languages/ja/curriculum/ir");

function surfaceOf(step: unknown): string {
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (v == null) return;
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v as object).forEach(walk);
  };
  walk(step);
  return parts.join("␟");
}

function dump(outPath: string) {
  const irFiles = readdirSync(IR_DIR)
    .filter((f) => f.endsWith(".ir.json"))
    .sort();
  const out: Record<string, unknown> = {};
  for (const f of irFiles) {
    const modId = f.replace(".ir.json", "");
    const ir = JSON.parse(readFileSync(join(IR_DIR, f), "utf8"));
    const compiled = compileModule(ir);
    out[modId] = compiled.map((lesson) => ({
      id: lesson.id,
      steps: (lesson.steps ?? []).map((s: Record<string, unknown>) => ({
        id: s.id,
        type: s.type,
        isFiller: (s.id as string).includes("-fill-"),
        surface: surfaceOf(s),
      })),
    }));
  }
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`wrote ${outPath}`);
}

const [, , cmd, ...args] = process.argv;
if (cmd === "dump") dump(args[0]);
else {
  console.error("usage: npx vite-node scripts/fillerPoolBlastRadius.ts dump <out.json>");
  process.exit(1);
}
