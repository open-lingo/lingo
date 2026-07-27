import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The N5 coverage ledger is a build gate, not a note.
 *
 * `docs/RUN-PLAN-n4.md` assigns each of the 74 remaining N5 grammar points to
 * exactly one module, so "N5 is finished" is checkable per module instead of
 * being discovered at m29. Authoring briefs cite the row; this test is what
 * makes citing it non-optional — a module that quietly skips a point it owes
 * fails here rather than leaving a hole nobody notices until the capstone.
 *
 * Only modules that exist yet are checked, so the gate arms itself one module
 * at a time as the run proceeds.
 */

const ROOT = join(__dirname, "..", "..", "..", "..", "..", "..");
const LEDGER = join(ROOT, "docs", "RUN-PLAN-n4.md");
const IR_DIR = join(__dirname, "..", "ir");
const POINTS = join(
  ROOT,
  "src",
  "features",
  "lesson",
  "data",
  "n5-grammar-points.json",
);

/** module number → grammar point ids it owes */
function ledger(): Map<string, string[]> {
  const md = readFileSync(LEDGER, "utf-8");
  const section = md.split("### Assignment")[1]?.split("Untouched at run start")[0];
  if (!section) throw new Error("coverage ledger section missing from RUN-PLAN-n4.md");

  const rows = new Map<string, string[]>();
  for (const line of section.split("\n")) {
    const row = line.match(/^\|\s*(\d+)\s*\|([^|]+)\|/);
    if (!row) continue;
    const ids = row[2]
      .replace(/\*\*/g, "")
      .trim()
      .split(/\s+/)
      .filter((t) => /^[a-z0-9-]+$/.test(t));
    if (ids.length) rows.set(`m${row[1]}`, ids);
  }
  return rows;
}

/** every grammar point id referenced anywhere in a module's IR */
function taughtBy(module: string): Set<string> {
  const src = readFileSync(join(IR_DIR, `${module}.ir.yaml`), "utf-8");
  const ids = new Set<string>();
  for (const m of src.matchAll(/grammarPointId:\s*([a-z0-9-]+)/g)) ids.add(m[1]);
  for (const m of src.matchAll(/(?:exercises|combines):\s*\[([^\]]*)\]/g)) {
    for (const id of m[1].split(",")) {
      const t = id.trim();
      if (t) ids.add(t);
    }
  }
  return ids;
}

describe("N5 coverage ledger", () => {
  const rows = ledger();

  it("assigns only real grammar point ids", () => {
    const raw: unknown = JSON.parse(readFileSync(POINTS, "utf-8"));
    const list = (
      Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>)[0]
    ) as { id: string }[];
    const known = new Set(list.map((p) => p.id));
    const bogus = [...rows].flatMap(([m, ids]) =>
      ids.filter((id) => !known.has(id)).map((id) => `${m}: ${id}`),
    );
    expect(bogus).toEqual([]);
  });

  it("assigns each point to exactly one module", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [module, ids] of rows) {
      for (const id of ids) {
        if (seen.has(id)) dupes.push(`${id}: ${seen.get(id)} and ${module}`);
        else seen.set(id, module);
      }
    }
    expect(dupes).toEqual([]);
  });

  it("every authored module teaches what it owes", () => {
    const missing: string[] = [];
    for (const [module, owed] of rows) {
      if (!existsSync(join(IR_DIR, `${module}.ir.yaml`))) continue; // not authored yet
      const taught = taughtBy(module);
      const gap = owed.filter((id) => !taught.has(id));
      if (gap.length) missing.push(`${module} owes ${gap.join(" ")}`);
    }
    expect(
      missing,
      "Either teach the point in that module's IR, or move it to another " +
        "module's row in docs/RUN-PLAN-n4.md and say why. The spine wins over " +
        "the ledger — but the ledger must then be edited, not ignored.",
    ).toEqual([]);
  });
});
