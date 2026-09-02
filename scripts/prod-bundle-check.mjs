#!/usr/bin/env node
/**
 * Prod bundle self-consistency check.
 *
 * Answers "is the deployed SPA serving a complete bundle?" — the question
 * behind every "failed to fetch dynamically imported module" report:
 *   1. Fetch / (no-cache) and locate the entry chunk.
 *   2. Assert the entry carries the vite:preloadError self-heal handler
 *      (shipped f15d8806) — a prod bundle without it means a bad deploy.
 *   3. Extract every `assets/*.js` reference from the entry chunk and HEAD
 *      each one; any non-200 means the deploy purged a chunk it still
 *      references (the s3 sync --delete failure mode).
 *
 * Passing here + a user still seeing the module error = STALE CLIENT
 * (pre-fix tab or service worker one navigation behind), not a bad deploy.
 *
 * Usage: node scripts/prod-bundle-check.mjs [origin]
 *   origin defaults to https://app.openlingoapp.com
 * Exit 0 = consistent; 1 = problems found.
 */

const origin = (process.argv[2] ?? "https://app.openlingoapp.com").replace(/\/$/, "");

const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
};

const indexRes = await fetch(`${origin}/`, { headers: { "Cache-Control": "no-cache" } });
if (!indexRes.ok) {
  fail(`GET ${origin}/ -> ${indexRes.status}`);
  process.exit(1);
}
const html = await indexRes.text();

const entryMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
if (!entryMatch) {
  fail("no entry chunk reference found in index.html");
  process.exit(1);
}
const entryPath = entryMatch[1];
console.log(`entry: ${entryPath}`);

const entryRes = await fetch(`${origin}${entryPath}`);
if (!entryRes.ok) {
  fail(`GET ${entryPath} -> ${entryRes.status}`);
  process.exit(1);
}
const entry = await entryRes.text();

if (entry.includes("vite:preloadError") && entry.includes("chunk-reload-at")) {
  console.log("self-heal handler: present");
} else {
  fail("entry chunk is missing the vite:preloadError self-heal handler");
}

const chunks = [...new Set(entry.match(/assets\/[^"'`]{4,80}\.js/g) ?? [])];
console.log(`referenced chunks: ${chunks.length}`);
if (chunks.length < 50) fail(`suspiciously few chunk references (${chunks.length}) — extraction regex may have rotted`);

let missing = 0;
// Batched to keep this quick without hammering the CDN.
const BATCH = 20;
for (let i = 0; i < chunks.length; i += BATCH) {
  await Promise.all(
    chunks.slice(i, i + BATCH).map(async (c) => {
      const res = await fetch(`${origin}/${c}`, { method: "HEAD" });
      if (!res.ok) {
        missing++;
        fail(`${res.status} ${c}`);
      }
    }),
  );
}

if (missing === 0) console.log("all referenced chunks resolve: OK");
console.log(process.exitCode ? "RESULT: INCONSISTENT" : "RESULT: CONSISTENT");
