#!/usr/bin/env node
// index-job.mjs — the umbrella session-start job (sibling of the docs/INDEX.md job).
//
// Regenerates the repo map, then reuses its symbol graph to run the maintenance
// scans and writes ONE report + a judgment ledger:
//
//   1. repo-map      → docs/CODE_MAP.md (+ per-file symbol cache)
//   2. file-watch    → god-files (>floor), growth vs baseline, orphan modules
//                      (importedBy derived from the map's ref→def graph)
//   3. code-ref-audit→ code paths cited in CLAUDE.md that no longer resolve
//
// Findings are a REPORT, never a failure; only a tool CRASH exits non-zero.
// Judgment calls (which orphan to delete, which drift to fix) go to LEDGER.md.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scanFiles } from "./file-watch.mjs";
import { auditCodeRefs } from "./code-ref-audit.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../..");
const OUT = join(ROOT, "artifacts/code-index");
const CACHE = join(OUT, "repo-map-cache.json");
const BASELINE = join(OUT, "loc-baseline.json");
const LOC_FLOOR = 400;

const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
mkdirSync(OUT, { recursive: true });

// ---- 1. regenerate the repo map (writes docs/CODE_MAP.md + the symbol cache) ----
let mapLog = "";
try {
  mapLog = execFileSync("node", [join(here, "repo-map-cli.mjs")], { cwd: ROOT, encoding: "utf8" });
} catch (e) {
  console.error("[index-job] repo-map failed:", String(e).slice(0, 200));
  process.exit(1);
}
const cache = JSON.parse(readFileSync(CACHE, "utf8")); // { path: {hash, defs, refs} }
const paths = Object.keys(cache);

// ---- 2. file-watch: loc + importedBy from a RESOLVED import graph ----
// Orphan detection needs real import edges, not runtime call/JSX refs (those miss
// type-only + re-export usage and over-report every types.ts as dead). Resolve
// each import specifier to a repo file: "@/x" -> src/x, "./x"/"../x" relative,
// bare specifiers are external (skipped). Try the path itself and the usual
// extension / index-file completions against the known file set.
const known = new Set(paths);
const dirOf = (p) => p.split("/").slice(0, -1).join("/");
const normalize = (p) => {
  const parts = [];
  for (const seg of p.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
};
const EXT_TRIES = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx", "/index.mjs", "/index.js"];
function resolveImport(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = "src/" + spec.slice(2);
  else if (spec.startsWith(".")) base = normalize(dirOf(fromFile) + "/" + spec);
  else return null; // external / bare module
  for (const ext of EXT_TRIES) {
    const cand = base + ext;
    if (known.has(cand)) return cand;
  }
  return null;
}
// importedBy(p) = # of OTHER files that import p (by resolved module path)
const referrers = new Map(paths.map((p) => [p, new Set()]));
for (const p of paths) {
  for (const spec of cache[p].imports || []) {
    const target = resolveImport(spec, p);
    if (target && target !== p) referrers.get(target).add(p);
  }
}
// Test files are excluded from the map/ranking, but a shipped file imported ONLY
// by its test is NOT dead — so fold test-file import edges into the graph too (a
// cheap regex; no need to parse them). Otherwise every __tests__ helper and
// test-only-exercised module reads as an orphan.
const testFiles = git("ls-files").split("\n").filter((p) => /\.(test|spec)\.(ts|tsx|mjs)$/.test(p) || p.includes("/__tests__/"));
const IMP_RE = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
for (const tf of testFiles) {
  let src; try { src = readFileSync(join(ROOT, tf), "utf8"); } catch { continue; }
  let m; while ((m = IMP_RE.exec(src))) { const t = resolveImport(m[1], tf); if (t && referrers.has(t)) referrers.get(t).add(tf); }
}
const files = paths.map((p) => {
  let loc = 0;
  try { loc = readFileSync(join(ROOT, p), "utf8").split("\n").length; } catch {}
  return { path: p, loc, importedBy: referrers.get(p).size, exports: (cache[p].defs || []).length };
});
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const watch = scanFiles(files, { locFloor: LOC_FLOOR, baseline });
// An orphan is only interesting if it EXPORTS something nobody imports (a file
// with zero exports is an entrypoint/side-effect module, not dead weight).
const orphans = watch.orphans.filter((f) => f.exports > 0);
// refresh the loc baseline for next run's growth diff
writeFileSync(BASELINE, JSON.stringify(Object.fromEntries(files.map((f) => [f.path, f.loc]))));

// ---- 3. code-ref-audit on CLAUDE.md ----
// Tracked AND untracked-but-not-ignored, so uncommitted tooling doesn't false-flag.
const repoCodeFiles = [
  ...git("ls-files").split("\n"),
  ...git("ls-files", "--others", "--exclude-standard").split("\n"),
].filter((p) => /\.(ts|tsx|mjs|js|cjs|py|css)$/.test(p));
const siblingRepos = {};
for (const name of ["lingo-core", "lingo-data"]) {
  try { siblingRepos[name] = execFileSync("git", ["-C", resolve(ROOT, "..", name), "ls-files"], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).split("\n").filter(Boolean); } catch {}
}
let audit = { ok: [], missing: [], crossRepo: [], placeholders: [] };
try {
  audit = auditCodeRefs({ docText: readFileSync(join(ROOT, "CLAUDE.md"), "utf8"), repoFiles: repoCodeFiles, siblingRepos });
} catch (e) { console.error("[index-job] code-ref-audit skipped:", String(e).slice(0, 120)); }

// ---- write REPORT + LEDGER + machine findings ----
const stamp = new Date().toISOString();
const findings = {
  stamp, locFloor: LOC_FLOOR,
  filesScanned: files.length,
  offenders: watch.offenders.slice(0, 25).map((f) => ({ path: f.path, loc: f.loc })),
  grew: watch.grew.map((f) => ({ path: f.path, loc: f.loc, was: baseline[f.path] })),
  orphans: orphans.map((f) => ({ path: f.path, loc: f.loc, exports: f.exports })),
  driftMissing: audit.missing.map((m) => ({ ref: m.ref, nearest: m.nearest })),
};
writeFileSync(join(OUT, "findings.json"), JSON.stringify(findings, null, 2));

const R = [];
R.push(`# Code-Index Report`, ``, `- **Run:** ${stamp}`, `- **Files scanned:** ${files.length}  ·  LOC floor ${LOC_FLOOR}`);
R.push(`- **Map:** ${mapLog.trim().split("\n").find((l) => l.includes("wrote")) || "docs/CODE_MAP.md"}`);
R.push(``, `## CLAUDE.md code-path drift (${audit.missing.length})`, ``);
if (!audit.missing.length) R.push(`_No stale code paths cited in CLAUDE.md._`);
for (const m of audit.missing) R.push(`- \`${m.ref}\`${m.nearest ? ` → likely \`${m.nearest.replace(ROOT + "/", "")}\`` : "  _(no near match — generated file or gone)_"}`);
R.push(``, `## God-files grown since last run (${watch.grew.length})`, ``);
if (!watch.grew.length) R.push(`_No tracked file grew past baseline this run._`);
for (const f of watch.grew) R.push(`- \`${f.path}\` — ${baseline[f.path]} → ${f.loc} LOC`);
R.push(``, `## Orphan modules — export symbols nobody imports (${orphans.length})`, ``);
if (!orphans.length) R.push(`_None._`);
for (const f of orphans.slice(0, 40)) R.push(`- \`${f.path}\` (${f.exports} exports, ${f.loc} LOC)`);
if (orphans.length > 40) R.push(`- _… ${orphans.length - 40} more (see findings.json)._`);
R.push(``, `## Largest files (top 15)`, ``);
for (const f of watch.offenders.slice(0, 15)) R.push(`- ${f.loc} LOC — \`${f.path}\``);
writeFileSync(join(OUT, "REPORT.md"), R.join("\n") + "\n");

// LEDGER — the judgment calls, for frontier/Spencer
const L = [`# Code-Index Ledger — needs a human/frontier call`, ``, `## Run ${stamp}`, ``];
for (const m of audit.missing) L.push(`- [ ] **drift** \`${m.ref}\` in CLAUDE.md — ${m.nearest ? `repoint to \`${m.nearest.replace(ROOT + "/", "")}\`?` : `confirm gone / generated?`}`);
for (const f of orphans.slice(0, 40)) L.push(`- [ ] **orphan** \`${f.path}\` — dead code to remove, or a false orphan (dynamic import / entrypoint)?`);
writeFileSync(join(OUT, "LEDGER.md"), L.join("\n") + "\n");

console.log(`[index-job] done. drift=${audit.missing.length} grew=${watch.grew.length} orphans=${orphans.length} offenders=${watch.offenders.length}`);
console.log(`  ${join(OUT, "REPORT.md").replace(ROOT + "/", "")}  ·  ${join(OUT, "LEDGER.md").replace(ROOT + "/", "")}`);
