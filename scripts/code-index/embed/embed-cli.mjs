#!/usr/bin/env node
// embed-cli.mjs — build and query the hybrid (BM25 + dense) chunk index.
//
//   node scripts/code-index/embed/embed-cli.mjs index [--globs "src docs"]
//   node scripts/code-index/embed/embed-cli.mjs query "how does boot batching work" [--k 8]
//
// The index is a CANDIDATE GENERATOR: it surfaces likely files/spans for an agent
// to then confirm with rg/read. It never decides. Local + free (Ollama embeddings);
// incremental — only changed files are re-embedded.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openStore, indexFile, stats } from "./store.mjs";
import { search } from "./query.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../..");
const DB = join(ROOT, "artifacts/code-index/embed.db");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];

const db = openStore(DB);

if (cmd === "index") {
  const globs = arg("globs", "src docs scripts").split(/\s+/).filter(Boolean);
  const files = execFileSync("git", ["-C", ROOT, "ls-files", ...globs], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 })
    .split("\n")
    .filter((p) => /\.(ts|tsx|mjs|md|mdx)$/.test(p) && !p.endsWith(".d.ts") && !p.includes("/_archive/") && !/\.(test|spec)\.[tj]sx?$/.test(p));
  console.log(`[embed] indexing ${files.length} files → ${DB.replace(ROOT + "/", "")}`);
  const t0 = Date.now();
  let indexed = 0, cached = 0, errored = 0, chunks = 0, done = 0;
  for (const f of files) {
    let src; try { src = readFileSync(join(ROOT, f), "utf8"); } catch { continue; }
    const r = await indexFile(db, f, src);
    if (r.status === "indexed") { indexed++; chunks += r.chunks; }
    else if (r.status === "cached") cached++;
    else { errored++; }
    if (++done % 50 === 0) process.stdout.write(`\r[embed] ${done}/${files.length} (${indexed} new, ${cached} cached, ${chunks} chunks)   `);
  }
  console.log(`\n[embed] done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${indexed} indexed, ${cached} cached, ${errored} err. ${JSON.stringify(stats(db))}`);
} else if (cmd === "query") {
  const q = process.argv[3];
  if (!q) { console.error('usage: embed-cli.mjs query "text" [--k 8]'); process.exit(1); }
  const hits = await search(db, q, { topK: Number(arg("k", "8")) });
  console.log(`\nQ: ${q}\n`);
  for (const h of hits) console.log(`  ${h.score.toFixed(4)}  ${h.ref}${h.symbol ? `  [${h.symbol}]` : ""}`);
  console.log(`\n(candidates — confirm with rg/read; the index proposes, it never decides)`);
} else {
  console.error('usage: embed-cli.mjs index [--globs "src docs"] | query "text" [--k 8]');
  process.exit(1);
}
db.close();
