/**
 * The ja lesson-authoring guide is the parent document for every language's
 * guide. Both derived guides open with a provenance block that accounts for
 * each ja section as CARRIED, ADAPTED, or DROPPED-with-a-reason, and the ES
 * guide states the contract in its own words:
 *
 *   "If you find a ja section not in one of these three tables, this file is
 *    incomplete. Say so rather than guessing."
 *
 * That contract is unenforceable by hand. The ja guide gains sections (§4a2
 * arrived 2026-07-28, §4b2/§4c 2026-07-12, §4e–§4g 2026-07-16) and a derived
 * guide silently stops being an adaptation and becomes a snapshot — the same
 * failure class as a hardcoded module list that goes stale (`MODULE_ORDER`
 * frozen at m17 let two modules' prompts skip the comprehensibility gate
 * entirely).
 *
 * So: this test IS the contract. A new ja section fails it until each derived
 * guide says what happens to that section in the target language. Deciding
 * "does not apply" is a legitimate answer — writing nothing is not.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const docs = (name: string) =>
  readFileSync(resolve(process.cwd(), "docs", name), "utf8");

const JA_GUIDE = "lesson-authoring-guide.md";
const DERIVED = [
  { file: "es-lesson-authoring-guide.md", label: "Spanish" },
  { file: "fr-lesson-authoring-guide.md", label: "French" },
] as const;

/**
 * Section ids as the ja guide writes them: "4", "4b2", "13.10", "5.1".
 * The addendum heading under §4e carries no id of its own and rides on 4e.
 */
function jaSectionIds(): string[] {
  const ids: string[] = [];
  for (const line of docs(JA_GUIDE).split("\n")) {
    const m = /^#{2,4}\s+§?(\d+[a-z0-9]*(?:\.\d+)?)[.\s]/.exec(line);
    if (m && !ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

/** "13.10" → "13"; "4b2" → null (not a child, a sibling of §4). */
const parentOf = (id: string): string | null =>
  id.includes(".") ? id.slice(0, id.indexOf(".")) : null;

/**
 * Only the provenance block counts. A §-reference buried in the body is a
 * cross-reference, not an accounting — the whole point is that a reader can
 * open the top of the file and see the full ledger.
 */
function provenanceBlock(file: string): string {
  const text = docs(file);
  const end = text.indexOf("\n## 1.");
  if (end === -1) {
    throw new Error(
      `${file}: no "## 1." heading — the provenance block is delimited by it.`,
    );
  }
  return text.slice(0, end);
}

/** §4 must not be satisfied by §4b, nor §13 by §13.1. */
const mentions = (block: string, id: string) =>
  new RegExp(`§${id.replace(".", "\\.")}(?![\\d.a-z])`).test(block);

describe("authoring guide provenance", () => {
  const ids = jaSectionIds();

  it("finds the ja guide's numbered sections", () => {
    // A parser that silently matched nothing would make every check below
    // pass vacuously, which is the failure mode this whole file exists to
    // prevent in the guides themselves.
    expect(ids.length).toBeGreaterThan(40);
    expect(ids).toContain("4b2");
    expect(ids).toContain("13.10");
  });

  for (const { file, label } of DERIVED) {
    it(`${label}: every ja section is accounted for as carried, adapted, or dropped`, () => {
      const block = provenanceBlock(file);
      const unaccounted = ids.filter((id) => {
        if (mentions(block, id)) return false;
        // A child is covered by its parent's ruling — §14 "not built for ES"
        // settles §14.1–§14.9 — but a parent is NOT covered by one child.
        const p = parentOf(id);
        return !(p && mentions(block, p));
      });
      expect(
        unaccounted,
        `${file} does not account for ja section(s) ${unaccounted.map((s) => `§${s}`).join(", ")}. ` +
          `Add each to the CARRIED / ADAPTED / DROPPED tables in its provenance block. ` +
          `"Does not apply, because X" is a valid entry; silence is not.`,
      ).toEqual([]);
    });
  }
});
