/**
 *   node scripts/emoji-refit/vendor-noto.mjs --out <out> [--root <repo>] [--dry-run]
 *
 * For every `replace` decision in `<out>/decisions.json`, downloads the Noto
 * SVG for the new emoji into `src/pub/noto-emoji/svg/` if not already
 * vendored there. `art` decisions carry no emoji (custom art takes over) so
 * they're skipped. Resumable: existing files are never re-fetched.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { notoFilename, loadVendored } from "./noto.mjs";

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

export async function planVendor(decisions, vendored) {
  const need = new Map(); // filename -> emoji
  for (const d of decisions) {
    if (d.action !== "replace" || !d.emoji) continue;
    const file = notoFilename(d.emoji);
    if (!vendored.has(file)) need.set(file, d.emoji);
  }
  return need;
}

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const root = flag("root", process.cwd());
  const dryRun = process.argv.includes("--dry-run");
  const decisions = JSON.parse(await readFile(join(out, "decisions.json"), "utf8"));
  const svgDir = join(root, "src/pub/noto-emoji/svg");
  const vendored = await loadVendored(root);
  const need = await planVendor(decisions, vendored);

  console.log(`${need.size} SVG(s) to vendor (of ${decisions.filter((d) => d.action === "replace").length} replace decisions)`);
  if (dryRun) {
    for (const [file, emoji] of need) console.log(`  would fetch ${file} (${emoji})`);
    return;
  }

  await mkdir(svgDir, { recursive: true });
  const fetched = [];
  const failed = [];
  for (const [file, emoji] of need) {
    const dest = join(svgDir, file);
    if (existsSync(dest)) continue; // resumable
    const url = `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/${file}`;
    const res = await fetch(url);
    if (!res.ok) {
      failed.push({ file, emoji, status: res.status });
      process.stderr.write(`  FAILED ${file} (${emoji}) — ${res.status}\n`);
      continue;
    }
    const body = await res.text();
    await writeFile(dest, body);
    fetched.push(file);
    process.stderr.write(`  vendored ${file} (${emoji})\n`);
  }
  await writeFile(join(out, "vendor-noto-report.json"), JSON.stringify({ fetched, failed }, null, 1));
  console.log(`vendored ${fetched.length}, failed ${failed.length}`);
  if (failed.length) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
