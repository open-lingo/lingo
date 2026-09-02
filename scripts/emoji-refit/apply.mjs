/**
 *   node scripts/emoji-refit/apply.mjs --out <out> [--root <repo>] [--apply]
 *
 * Turns `<out>/decisions.json` into `<out>/edits.json` — one search/replace
 * pair per decision against that atom's line in its course REGISTRY (the
 * `atom({...})` / `{ id: "..." }` definition, not every ad-hoc inline
 * duplicate of the same surface+emoji elsewhere in curriculum content).
 * Without `--apply` this is a dry-run report only. With `--apply`, each
 * pair is applied via exact string replace, refusing (and reporting,
 * never guessing) any oldString that doesn't match EXACTLY ONCE in its file.
 *
 * Registries:
 *   ja  src/features/languages/ja/courseAtoms.ts        — `{ id: "x", ... }`
 *   ko  src/features/languages/ko/courseAtoms.ts         — `atom({ surface: "x", ... })`
 *   es  src/features/languages/es/curriculum/m*.ts       — `atom({ surface: "x", ... })`
 *   fr  src/features/languages/fr/curriculum/m*.ts       — `atom({ surface: "x", ... })`
 * (excludes *.test.ts and _archive/)
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

function escapeForJs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Registry file list per course, relative to root. */
async function registryFiles(root, course) {
  if (course === "ja") return ["src/features/languages/ja/courseAtoms.ts"];
  if (course === "ko") return ["src/features/languages/ko/courseAtoms.ts"];
  if (course === "es" || course === "fr") {
    const dir = `src/features/languages/${course}/curriculum`;
    const names = await readdir(join(root, dir));
    return names
      .filter((n) => /^m\d+\.ts$/.test(n))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
      .map((n) => `${dir}/${n}`);
  }
  return [];
}

/** Does this line look like a registry atom-definition line (not an inline step-option literal)? */
function isRegistryLine(course, line) {
  if (course === "ja") return /^\s*\{\s*id:\s*"/.test(line);
  return /atom\(\{/.test(line); // ko/es/fr
}

function fieldRegex(course, key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return course === "ja"
    ? new RegExp(`id:\\s*"${esc}"`)
    : new RegExp(`surface:\\s*"${esc}"`);
}

/**
 * Build the replacement line text for one decision against a matched
 * registry line. `action: "replace"` sets/overwrites `emoji:`;
 * `action: "art"` removes an existing `emoji:` field (custom art takes
 * over) — a no-op if the atom already has none.
 */
export function buildNewLine(line, decision) {
  if (decision.action === "art") {
    if (!/emoji:\s*"[^"]*"/.test(line)) return line; // nothing to remove
    return line.replace(/,\s*emoji:\s*"[^"]*"/, "").replace(/emoji:\s*"[^"]*",\s*/, "");
  }
  // replace (covers both true swaps and gap fills)
  const newEmoji = escapeForJs(decision.emoji);
  if (/emoji:\s*"[^"]*"/.test(line)) {
    return line.replace(/emoji:\s*"[^"]*"/, `emoji: "${newEmoji}"`);
  }
  // fill: insert right after the id/surface field (first field on the line).
  const anchor = /(id|surface):\s*"[^"]*",?/;
  const m = anchor.exec(line);
  if (!m) return null; // caller reports as refused
  const insertAt = m.index + m[0].length;
  return `${line.slice(0, insertAt)} emoji: "${newEmoji}",${line.slice(insertAt)}`;
}

/**
 * Find the single registry line for a decision. Uses `inventory` (id ->
 * items[]) to disambiguate a surface that's registered more than once
 * (e.g. ko 머리 exists both SRS-eligible at m1 and non-eligible at m20) by
 * matching the CURRENT emoji recorded at inventory time (undefined/absent
 * for a gap fill).
 */
export function locateMatches(filesText, course, decision, inventoryItems) {
  const key = decision.id.slice(course.length + 1);
  const re = fieldRegex(course, key);
  let matches = [];
  for (const { file, lines } of filesText) {
    lines.forEach((line, idx) => {
      if (isRegistryLine(course, line) && re.test(line)) matches.push({ file, idx, line });
    });
  }
  if (matches.length <= 1) return matches;
  const items = inventoryItems ?? [];
  // Prefer the SRS-eligible registration — Task 7's integrity gate (and the
  // learner-facing surfaces this decision is meant to fix) only care about
  // SRS-eligible atoms; a duplicate surface's non-eligible twin (e.g. a
  // later module's dedicated review copy) is reference data, not the target.
  const srsTrue = items.filter((i) => i.srsEligible !== false);
  const pool = srsTrue.length === 1 ? srsTrue : items;
  const wanted = new Set(pool.map((i) => i.emoji ?? ""));
  const filtered = matches.filter((m) => {
    const em = /emoji:\s*"([^"]*)"/.exec(m.line)?.[1] ?? "";
    return wanted.has(em);
  });
  if (filtered.length === 1) return filtered;
  const pool2 = filtered.length >= 1 ? filtered : matches;
  if (pool2.length <= 1) return pool2;
  // Still tied (e.g. two duplicate registrations with the same, absent,
  // emoji) — fall back to the earliest module, matching this codebase's
  // "first introduction wins" convention elsewhere (lessonAtomIndex.ts).
  const moduleOf = (line) => {
    const m = /fromModule:\s*"m(\d+)"/.exec(line);
    return m ? Number(m[1]) : Infinity;
  };
  const min = Math.min(...pool2.map((m) => moduleOf(m.line)));
  const byModule = pool2.filter((m) => moduleOf(m.line) === min);
  return byModule.length === 1 ? byModule : pool2;
}

export async function buildEdits(root, decisions, inventory) {
  const invById = new Map();
  for (const it of inventory?.items ?? []) {
    (invById.get(it.id) ?? invById.set(it.id, []).get(it.id)).push(it);
  }
  const fileCache = new Map(); // course -> [{file, lines}]
  const edits = [];
  const refused = [];
  const skipped = [];

  for (const d of decisions) {
    const course = d.id.split(":")[0];
    if (!fileCache.has(course)) {
      const files = await registryFiles(root, course);
      const texts = [];
      for (const f of files) {
        const text = await readFile(join(root, f), "utf8");
        texts.push({ file: f, lines: text.split("\n") });
      }
      fileCache.set(course, texts);
    }
    const filesText = fileCache.get(course);
    const matches = locateMatches(filesText, course, d, invById.get(d.id));

    if (matches.length === 0) {
      refused.push({ id: d.id, reason: "no registry line found" });
      continue;
    }
    if (matches.length > 1) {
      refused.push({ id: d.id, reason: `ambiguous — ${matches.length} registry lines matched (${matches.map((m) => `${m.file}:${m.idx + 1}`).join(", ")})` });
      continue;
    }
    const { file, line } = matches[0];
    const newLine = buildNewLine(line, d);
    if (newLine === null) {
      refused.push({ id: d.id, reason: "could not locate id/surface anchor to insert emoji" });
      continue;
    }
    if (newLine === line) {
      skipped.push({ id: d.id, reason: "no-op (art decision, atom already has no emoji)" });
      continue;
    }
    edits.push({ id: d.id, file, oldString: line, newString: newLine });
  }
  return { edits, refused, skipped };
}

async function applyEdits(root, edits) {
  const byFile = new Map();
  for (const e of edits) (byFile.get(e.file) ?? byFile.set(e.file, []).get(e.file)).push(e);
  const applied = [];
  const failed = [];
  for (const [file, fileEdits] of byFile) {
    const path = join(root, file);
    let text = await readFile(path, "utf8");
    for (const e of fileEdits) {
      const count = text.split(e.oldString).length - 1;
      if (count !== 1) {
        failed.push({ id: e.id, file, reason: `oldString matches ${count} times in file (expected 1)` });
        continue;
      }
      text = text.replace(e.oldString, e.newString);
      applied.push({ id: e.id, file });
    }
    await writeFile(path, text);
  }
  return { applied, failed };
}

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const root = flag("root", process.cwd());
  const doApply = process.argv.includes("--apply");
  const decisions = JSON.parse(await readFile(join(out, "decisions.json"), "utf8"));
  let inventory = null;
  try {
    inventory = JSON.parse(await readFile(join(out, "inventory.json"), "utf8"));
  } catch { /* optional */ }

  const { edits, refused, skipped } = await buildEdits(root, decisions, inventory);
  await writeFile(join(out, "edits.json"), JSON.stringify(edits, null, 1));
  await writeFile(join(out, "apply-refused.json"), JSON.stringify(refused, null, 1));
  await writeFile(join(out, "apply-skipped.json"), JSON.stringify(skipped, null, 1));
  console.log(`${edits.length} edit(s) planned, ${refused.length} refused, ${skipped.length} no-op`);
  for (const r of refused) console.log(`  REFUSED ${r.id}: ${r.reason}`);

  if (!doApply) {
    console.log("(dry run — pass --apply to write changes)");
    return;
  }
  const { applied, failed } = await applyEdits(root, edits);
  console.log(`applied ${applied.length}, failed ${failed.length}`);
  for (const f of failed) console.log(`  FAILED ${f.id} in ${f.file}: ${f.reason}`);
  await writeFile(join(out, "apply-result.json"), JSON.stringify({ applied, failed }, null, 1));
  if (failed.length) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
