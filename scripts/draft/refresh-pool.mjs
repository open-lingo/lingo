#!/usr/bin/env node
/**
 * refresh-pool.mjs — re-derive a drafted pool's SENTENCES from its frame.
 *
 *   node scripts/draft/refresh-pool.mjs es-m18 es_m18 --through m17
 *
 * A pool file stores the model's SLOT CHOICES plus the strings the frame built
 * from them at draft time. When the frame is corrected — «ver» gaining
 * "watched" for a television complement, «zapatos» gaining its plural article
 * — every stored string downstream of that fact goes stale, and the compiler
 * happily emits the stale one. Redrafting would fix it and also reshuffle
 * which combinations exist, which makes a one-line inventory fix look like a
 * whole-module rewrite.
 *
 * This rebuilds each pick from its own (person, verb, object, time) through
 * the CURRENT frame and reports every difference. Slot choices are untouched,
 * so the module's content is identical apart from the fix. A pick the frame
 * now refuses is dropped and named — that is a real signal, not an error.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const flag = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const [file, frameKey] = [process.argv[2], process.argv[3]];
if (!file || !frameKey) {
  console.error("usage: refresh-pool.mjs <frames-file-suffix> <frameExport> [--through mN] [--write]");
  process.exit(2);
}
const mod = await import(`./frames-${file}.mjs`);
const frame = mod[frameKey];
if (!frame) throw new Error(`no export "${frameKey}" in frames-${file}.mjs`);
await mod.loadNouns(flag("through", "m17"));

const path = join(here, "drafts", `${frame.id}.json`);
const doc = JSON.parse(await readFile(path, "utf8"));

let changed = 0;
const dropped = [];
const kept = [];
for (const p of doc.picks) {
  let built;
  try {
    built = frame.build({ person: p.person, verb: p.verb, object: p.object, time: p.time });
  } catch (e) {
    dropped.push(`${p.verb}.${p.person} — ${e.message}`);
    continue;
  }
  if (built.es !== p.es || built.en !== p.en) {
    changed++;
    console.log(`  ${p.es}\n    es: ${p.es === built.es ? "(same)" : built.es}`);
    console.log(`    en: ${p.en}\n     -> ${built.en}`);
  }
  kept.push({ ...p, ...built });
}
console.log(
  `\n${doc.picks.length} picks · ${changed} restated · ${dropped.length} dropped`,
);
for (const d of dropped) console.log(`  dropped ${d}`);

if (process.argv.includes("--write")) {
  await writeFile(path, JSON.stringify({ ...doc, picks: kept, refreshed: true }, null, 2) + "\n");
  console.log(`wrote ${path}`);
} else {
  console.log("(dry run — pass --write to save)");
}
