/**
 *   node scripts/emoji-refit/check.mjs --out artifacts/emoji-refit [--root <repo>]
 * Deterministic filter over score.mjs candidates + the frontier audit set.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { notoFilename, isDigitOrKeycap, isFlag, loadNotoIndex, loadVendored, headCheckNoto } from "./noto.mjs";

export function checkCandidate(emoji, item, notoIndex, vendored, usedByCourse, unreachable = new Set()) {
  const file = notoFilename(emoji);
  const digit = isDigitOrKeycap(emoji) || isFlag(emoji);
  const collidesWith = (usedByCourse.get(emoji) ?? []).filter((id) => id !== item.id);
  const inNoto = notoIndex.has(file);
  const result = { emoji, file, inNoto, vendored: vendored.has(file), collidesWith, digit, ok: inNoto && !digit && collidesWith.length === 0 };
  // Offline fallback path (see main()): a candidate whose HEAD check
  // couldn't even reach raw.githubusercontent.com is neither confirmed nor
  // denied — mark why `inNoto: false` here, distinct from a genuine 404.
  if (!inNoto && unreachable.has(file)) result.reason = "NOTO_UNREACHABLE";
  return result;
}

export function buildFlagged(items, scores, checked) {
  const byId = new Map(scores.map((s) => [s.id, s]));
  const checkedById = new Map(checked.map((c) => [c.id, c]));
  const order = { ja: 0, ko: 1, es: 2, fr: 3 };
  return items
    .filter((i) => {
      const s = byId.get(i.id);
      if (!s) return false;
      if (!i.emoji) return true;                       // gap
      return s.indirect || (s.fit !== null && s.fit <= 3);
    })
    .map((i) => ({ ...i, score: byId.get(i.id), candidates: checkedById.get(i.id)?.candidates ?? [] }))
    .sort((a, b) => order[a.course] - order[b.course] || a.module.localeCompare(b.module, undefined, { numeric: true }));
}

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const root = flag("root", process.cwd());
  const inv = JSON.parse(await readFile(join(out, "inventory.json"), "utf8"));
  const scores = JSON.parse(await readFile(join(out, "scores.json"), "utf8"));

  // GitHub's tree API is unauthenticated here (no GITHUB_TOKEN available). If
  // it's rate-limited, fall back to HEAD-checking raw.githubusercontent.com
  // per candidate emoji actually proposed by score.mjs, and cache the result
  // to <out>/noto-index.json the same way loadNotoIndex would.
  let notoIndex;
  let unreachable = new Set();
  let notoSource = "github-tree";
  try {
    notoIndex = await loadNotoIndex(out);
  } catch (e) {
    notoSource = "raw-head-fallback";
    process.stderr.write(`noto tree fetch failed (${e.message}); falling back to per-candidate HEAD checks\n`);
    const candidateEmoji = new Set(scores.flatMap((s) => s.candidates ?? []));
    notoIndex = new Set();
    for (const emoji of candidateEmoji) {
      const file = notoFilename(emoji);
      // A true offline run means even the per-candidate HEAD fetch throws
      // (not just a non-ok response) — catch that so the script still
      // finishes and writes checked.json/flagged.json rather than crashing.
      try {
        if (await headCheckNoto(file)) notoIndex.add(file);
      } catch (headErr) {
        unreachable.add(file);
        process.stderr.write(`  HEAD check unreachable for ${file}: ${headErr.message}\n`);
      }
    }
    await writeFile(join(out, "noto-index.json"), JSON.stringify([...notoIndex]));
  }
  process.stderr.write(`noto index source: ${notoSource} (${notoIndex.size} entries, ${unreachable.size} unreachable)\n`);

  const vendored = await loadVendored(root);
  const items = inv.items.filter((i) => !i.blocked && (i.kind === "vocab" || i.kind === "phrase"));
  const used = {};
  for (const i of inv.items) {
    if (!i.emoji) continue;
    (used[i.course] ??= new Map());
    used[i.course].set(i.emoji, [...(used[i.course].get(i.emoji) ?? []), i.id]);
  }
  const itemById = new Map(items.map((i) => [i.id, i]));
  const checked = scores.map((s) => {
    const item = itemById.get(s.id);
    if (!item) return { ...s, candidates: [] };
    return { ...s, candidates: s.candidates.map((c) => checkCandidate(c, item, notoIndex, vendored, used[item.course] ?? new Map(), unreachable)) };
  });
  await writeFile(join(out, "checked.json"), JSON.stringify(checked, null, 1));
  const flagged = buildFlagged(items, scores, checked);
  await writeFile(join(out, "flagged.json"), JSON.stringify(flagged, null, 1));
  const per = {};
  for (const f of flagged) {
    const c = (per[f.course] ??= { gaps: 0, lowFit: 0, indirect: 0, withOkCandidate: 0 });
    if (!f.emoji) c.gaps++; else if (f.score.indirect) c.indirect++; else c.lowFit++;
    if (f.candidates.some((x) => x.ok)) c.withOkCandidate++;
  }
  console.table(per);
  console.log(`flagged ${flagged.length} of ${items.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
