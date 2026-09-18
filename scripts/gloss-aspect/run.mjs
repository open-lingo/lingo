#!/usr/bin/env node
/**
 * Gloss-aspect fidelity sweep — one-shot runner: extract.mjs then
 * judge.mjs for a language. `npm run gloss-aspect -- ja`.
 *
 * For step-by-step control (checking ollama ps between steps, resuming a
 * partial judge run, re-running just the audit sample) call extract.mjs /
 * judge.mjs / sample-for-audit.mjs directly instead.
 */
import { extractLang, parseModulesArg } from "./extract.mjs";
import { runLang } from "./judge.mjs";
import fs from "node:fs";
import path from "node:path";

const ARTIFACTS_DIR = path.join(process.cwd(), "artifacts/gloss-aspect");

async function main() {
  const lang = process.argv[2];
  if (!lang) {
    console.error(
      "usage: node scripts/gloss-aspect/run.mjs <lang> [--modules m23,m30,m36] [--tag fix]  (or: npm run gloss-aspect -- <lang> [--modules ...] [--tag ...])",
    );
    process.exit(1);
  }
  const modules = parseModulesArg(process.argv.slice(3));
  const tagIdx = process.argv.indexOf("--tag");
  const tag = tagIdx !== -1 ? process.argv[tagIdx + 1] : null;
  const suffix = tag ? `-${tag}` : "";

  const { files, rows } = extractLang(lang, modules);
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(ARTIFACTS_DIR, `rows-${lang}${suffix}.jsonl`),
    rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""),
  );
  console.log(`run.mjs: extracted ${rows.length} rows from ${files.length} ${lang} IR files${modules ? ` (filtered to ${[...modules].join(",")})` : ""}`);

  const result = await runLang(lang, tag);
  console.log(`run.mjs: done. ${result.mismatches}/${result.count} findings are mismatch -> ${result.findingsFile}`);
}

main().catch((err) => {
  console.error("run.mjs: fatal", err);
  process.exit(1);
});
