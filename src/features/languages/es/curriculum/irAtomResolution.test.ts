import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { findEsAtomBySurface } from "../courseAtoms";
import { ES_REVIEW_POOL } from "../esReviewPool";

/**
 * `resolveAtomIds` (grammarHelpers.ts) drops a surface it cannot resolve and
 * says nothing:
 *
 *   for (const s of surfaces) { const id = resolveAtomId(s); if (id) out.push(id); }
 *
 * So an `atoms:` entry that is not a registered atom surface costs that step
 * its SRS credit silently — no throw, no lint, no failing gate. m6 and m12
 * shipped this way for months: every feminine agreement form («bonita»,
 * «blanca», «nueva», «mala», «pequeña», «vieja», «buena», «roja») was declared
 * as the exercised atom while only the masculine form is registered, so the
 * adjective earned nothing in exactly the lessons built to teach it.
 *
 * Declare the REGISTERED surface in `atoms:`. It does not have to match the
 * printed text — `atoms:` is SRS credit, not display.
 */
describe("ES IR — every declared atom surface resolves", () => {
  it("no atoms: entry is silently dropped by resolveAtomIds", () => {
    const pool = new Set(ES_REVIEW_POOL.map((e) => e.surface));
    const dir = path.resolve(__dirname, "ir");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ir.yaml")).sort();
    expect(files.length, "no IR files found — this gate would be vacuous").toBeGreaterThan(0);

    const bad: string[] = [];
    let checked = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
        for (const raw of m[1].split(",")) {
          const surface = raw.trim().replace(/^["']|["']$/g, "");
          if (!surface) continue;
          checked++;
          if (!findEsAtomBySurface(surface) && !pool.has(surface)) {
            bad.push(`${f}: «${surface}» is not a registered atom surface`);
          }
        }
      }
    }
    expect(checked, "no atoms: entries parsed — the regex has drifted").toBeGreaterThan(1000);
    expect([...new Set(bad)], `unresolvable atom surfaces:\n${[...new Set(bad)].join("\n")}`).toEqual([]);
  });
});
