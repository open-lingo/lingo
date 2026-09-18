#!/usr/bin/env node
/**
 * Gloss-aspect fidelity sweep — one-shot runner: extract.mjs then
 * judge.mjs for a language. `npm run gloss-aspect -- ja`.
 *
 * For step-by-step control (checking ollama ps between steps, resuming a
 * partial judge run, re-running just the audit sample) call extract.mjs /
 * judge.mjs / sample-for-audit.mjs directly instead.
 */
import { extractLang } from "./extract.mjs";
import { runLang } from "./judge.mjs";
import fs from "node:fs";
import path from "node:path";

const ARTIFACTS_DIR = path.join(process.cwd(), "artifacts/gloss-aspect");

async function main() {
  const lang = process.argv[2];
  if (!lang) {
    console.error("usage: node scripts/gloss-aspect/run.mjs <lang>  (or: npm run gloss-aspect -- <lang>)");
    process.exit(1);
  }
  const { files, rows } = extractLang(lang);
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, `rows-${lang}.jsonl`),
    rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""),
  );
  console.log(`run.mjs: extracted ${rows.length} rows from ${files.length} ${lang} IR files`);

  const result = await runLang(lang);
  console.log(`run.mjs: done. ${result.mismatches}/${result.count} findings are mismatch -> ${result.findingsFile}`);
}

main().catch((err) => {
  console.error("run.mjs: fatal", err);
  process.exit(1);
});
