// Tests for the tree-sitter repo map — three pure pieces:
//   extractSymbols(source, lang) -> { defs:[{name,kind,line}], refs:[name] }
//   rankFiles(files)             -> files sorted by PageRank over the ref→def graph
//   buildRepoMap(ranked, opts)   -> a token-budgeted markdown digest
//
// Symbol extraction is inherently fuzzy, so those assertions check membership
// (a known export IS found), never exact set equality. Ranking + budgeting are
// deterministic and asserted exactly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractSymbols, rankFiles, buildRepoMap } from "./repo-map.mjs";

test("extractSymbols finds top-level exported declarations with kind + line", () => {
  const src = [
    "import { z } from './z';",       // line 1
    "export function alpha() { return beta(); }", // 2
    "export const gamma = 3;",        // 3
    "export class Delta {}",          // 4
    "export interface Eps { a: number }", // 5
    "export type Zed = string;",      // 6
    "function localOnly() {}",        // 7 (not exported)
  ].join("\n");
  const { defs } = extractSymbols(src, "ts");
  const byName = Object.fromEntries(defs.map((d) => [d.name, d]));
  assert.ok(byName.alpha && byName.alpha.kind === "function");
  assert.ok(byName.gamma && byName.gamma.kind === "const");
  assert.ok(byName.Delta && byName.Delta.kind === "class");
  assert.ok(byName.Eps && byName.Eps.kind === "interface");
  assert.ok(byName.Zed && byName.Zed.kind === "type");
  assert.equal(byName.alpha.line, 2); // 1-based
  // local (non-exported) decls are not top-level exports
  assert.ok(!byName.localOnly);
});

test("extractSymbols parses files larger than the default 32KB parse buffer", () => {
  // node-tree-sitter throws "Invalid argument" for sources over ~32KB unless the
  // parse bufferSize is raised. Real files (AdminOperationsPage.tsx, 40KB) hit this.
  const filler = "// padding comment line to inflate the source\n".repeat(1200); // ~55KB
  const src = filler + "export const bigModuleExport = 42;\n";
  assert.ok(src.length > 40000);
  const { defs } = extractSymbols(src, "tsx");
  assert.ok(defs.some((d) => d.name === "bigModuleExport"), "large file must still yield its export");
});

test("extractSymbols collects referenced identifiers (call + JSX)", () => {
  const src = "export function View(){ helper(); return makeThing(); }";
  const { refs } = extractSymbols(src, "ts");
  assert.ok(refs.includes("helper"));
  assert.ok(refs.includes("makeThing"));
});

test("extractSymbols parses tsx (JSX component references)", () => {
  const src = "export function Page(){ return <Widget/>; }";
  const { refs } = extractSymbols(src, "tsx");
  assert.ok(refs.includes("Widget"), `got ${JSON.stringify(refs)}`);
});

test("extractSymbols captures import + re-export module specifiers", () => {
  const src = [
    "import { helper } from '@/shared/helper';",
    "import Thing from '../thing';",
    "import './sideEffect';",
    "export { reExported } from './barrel';",
    "export function View(){ return helper(); }",
  ].join("\n");
  const { imports } = extractSymbols(src, "ts");
  assert.ok(imports.includes("@/shared/helper"));
  assert.ok(imports.includes("../thing"));
  assert.ok(imports.includes("./sideEffect"));
  assert.ok(imports.includes("./barrel"), `re-export source missing: ${JSON.stringify(imports)}`);
});

test("extractSymbols captures DYNAMIC import() specifiers (lazy routes)", () => {
  const src = "export const Page = lazy(() => import('@/features/admin/AdminHomePage'));";
  const { imports } = extractSymbols(src, "ts");
  assert.ok(
    imports.includes("@/features/admin/AdminHomePage"),
    `dynamic import missing: ${JSON.stringify(imports)}`,
  );
});

test("rankFiles ranks a widely-referenced definer above its referrers", () => {
  const files = [
    { path: "a.ts", defs: [{ name: "A" }], refs: ["helper"] },
    { path: "b.ts", defs: [{ name: "B" }], refs: ["helper"] },
    { path: "helper.ts", defs: [{ name: "helper" }], refs: [] },
  ];
  const ranked = rankFiles(files);
  assert.equal(ranked[0].path, "helper.ts");
  // every input file is present, each carries a numeric score
  assert.equal(ranked.length, 3);
  assert.ok(ranked.every((f) => typeof f.score === "number"));
});

test("rankFiles ignores refs that no file defines (external/library calls)", () => {
  const files = [
    { path: "a.ts", defs: [{ name: "A" }], refs: ["useState", "useEffect"] },
    { path: "b.ts", defs: [{ name: "B" }], refs: ["A"] },
  ];
  const ranked = rankFiles(files);
  assert.equal(ranked[0].path, "a.ts"); // b references A → a wins
});

test("buildRepoMap emits the generated marker and respects the char budget", () => {
  const ranked = [
    { path: "helper.ts", score: 0.5, defs: [{ name: "helper", kind: "function" }] },
    { path: "a.ts", score: 0.25, defs: [{ name: "A", kind: "const" }] },
    { path: "b.ts", score: 0.25, defs: [{ name: "B", kind: "class" }] },
  ];
  const full = buildRepoMap(ranked, { budgetChars: 100000 });
  assert.match(full, /generated by code-index/i);
  assert.ok(full.includes("helper.ts") && full.includes("a.ts") && full.includes("b.ts"));

  // a tiny budget keeps the top-ranked file and drops the rest, noting the cut
  const tight = buildRepoMap(ranked, { budgetChars: 80 });
  assert.ok(tight.includes("helper.ts"), "top-ranked file must survive the budget");
  assert.ok(!tight.includes("b.ts"), "lowest-ranked file must be dropped under tight budget");
  assert.match(tight, /\d+ more/i); // notes how many files were dropped
});
