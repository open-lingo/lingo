/**
 * Score every vocab emoji for fit and propose candidates, locally.
 *
 *   node scripts/emoji-refit/score.mjs --out artifacts/emoji-refit [--course ja] [--force]
 *
 * Batches of 8 (measured on classify.mjs: bigger batches drift), rubric in
 * PROSE (schema constrains structure, the prompt carries meaning), one file per
 * batch so a killed run resumes. Skips particles and blocked atoms — they are
 * not image words.
 */
import { readFile, writeFile, mkdir, access, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import { generateJson } from "./ollama.mjs";

export const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

const SCHEMA = {
  type: "object",
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          fit: { type: ["integer", "null"], minimum: 1, maximum: 5 },
          indirect: { type: "boolean" },
          reason: { type: "string" },
          candidates: { type: "array", items: { type: "string" }, maxItems: 3 },
        },
        required: ["id", "fit", "indirect", "reason", "candidates"],
      },
    },
  },
  required: ["scores"],
};

export function buildPrompt(items) {
  const lines = items.map((i) =>
    i.emoji
      ? `${i.id} "${i.surface}" = ${i.gloss} — current emoji ${i.emoji}`
      : `${i.id} "${i.surface}" = ${i.gloss} — no emoji yet`,
  );
  return `You are auditing picture cues for a language-learning app. Each word is shown to a learner with ONE emoji and no other hint; learners are 9 to 67 years old and have never seen the word. Judge how directly the emoji shows the MEANING.

fit scale (use null when there is no current emoji):
5 = the emoji IS the thing (🌙 for "moon").
4 = unmistakable to almost everyone.
3 = needs a hint; several readings are plausible.
2 = shows an associated thing rather than the meaning (🦆 duck for "pond", 🌗 half-moon for "half").
1 = wrong or misleading.

indirect: true when the emoji shows something associated with the meaning instead of the meaning itself, even if the association is strong.

candidates: up to 3 single emoji (no digits, no keycaps, no flags) that would show the meaning MORE directly than the current one. Prefer one plain object over a scene. Give an empty list when no emoji can honestly show the meaning (abstract words, function words, politeness variants).

reason: at most 20 words.

Answer for ALL ${items.length} items, in order, using the exact ids.

${lines.join("\n")}`;
}

export function mergeBatch(items, parsed) {
  const byId = new Map((parsed?.scores ?? []).map((s) => [s.id, s]));
  return items.map((i) => {
    const s = byId.get(i.id);
    if (!s) return { id: i.id, fit: null, indirect: false, reason: "MODEL_MISSING", candidates: [] };
    return {
      id: i.id,
      fit: i.emoji ? (Number.isInteger(s.fit) ? s.fit : null) : null,
      indirect: Boolean(s.indirect),
      reason: String(s.reason ?? "").slice(0, 200),
      candidates: (s.candidates ?? []).filter((c) => typeof c === "string" && c.trim()).slice(0, 3),
    };
  });
}

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const exists = (p) => access(p).then(() => true, () => false);

/**
 * A batch file only counts as "done" if it has at least one row that isn't
 * a MODEL_MISSING placeholder. A batch whose model call failed outright
 * (parsed === null, e.g. the model returned unparseable JSON) merges to a
 * file where EVERY row is MODEL_MISSING via mergeBatch's byId-miss branch —
 * that must be retried on resume, not treated as complete forever.
 */
export function isBatchComplete(rows) {
  return Array.isArray(rows) && rows.length > 0 && rows.some((r) => r?.reason !== "MODEL_MISSING");
}

/** Reads + parses a batch file and returns its rows only if it's a complete
 *  batch per `isBatchComplete`. Returns null (retry) for a missing file, a
 *  corrupt/truncated one (hard kill mid-write — JSON.parse throws), or an
 *  all-MODEL_MISSING one. */
async function loadCompleteBatch(file) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return null;
  }
  let rows;
  try {
    rows = JSON.parse(text);
  } catch {
    return null;
  }
  return isBatchComplete(rows) ? rows : null;
}

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const onlyCourse = flag("course", null);
  const force = process.argv.includes("--force");
  const inv = JSON.parse(await readFile(join(out, "inventory.json"), "utf8"));
  const items = inv.items.filter((i) =>
    (!onlyCourse || i.course === onlyCourse) && !i.blocked && (i.kind === "vocab" || i.kind === "phrase"),
  );
  await mkdir(join(out, "scores"), { recursive: true });
  const t0 = Date.now();
  let tin = 0, tout = 0, done = 0;
  for (const course of ["ja", "ko", "es", "fr"]) {
    const rows = items.filter((i) => i.course === course);
    const batches = chunk(rows, 8);
    for (let b = 0; b < batches.length; b++) {
      const file = join(out, "scores", `${course}-${String(b).padStart(3, "0")}.json`);
      if (!force) {
        const existingRows = await loadCompleteBatch(file);
        if (existingRows) { done++; continue; }
        if (await exists(file)) process.stderr.write(`retrying ${file} (incomplete or corrupt)\n`);
      }
      const r = await generateJson({ prompt: buildPrompt(batches[b]), schema: SCHEMA, numCtx: 8192, numPredict: 2048 });
      tin += r.tokensIn; tout += r.tokensOut;
      // Atomic write: a hard kill mid-write leaves only the .tmp file (not
      // matched by the *.json glob below), never a truncated .json that
      // would crash the merge's JSON.parse.
      const tmp = `${file}.tmp`;
      await writeFile(tmp, JSON.stringify(mergeBatch(batches[b], r.parsed), null, 1));
      await rename(tmp, file);
      done++;
      process.stderr.write(`  ${course} ${b + 1}/${batches.length}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\r`);
    }
  }
  const merged = [];
  for (const f of (await readdir(join(out, "scores"))).sort()) {
    if (!f.endsWith(".json")) continue;
    try {
      merged.push(...JSON.parse(await readFile(join(out, "scores", f), "utf8")));
    } catch (e) {
      // Defensive: atomic writes should make this unreachable going forward,
      // but a file written by an older process (no rename-on-write) could
      // still be sitting truncated on disk. Skip it rather than crash the
      // whole merge — its batch will simply be missing from scores.json
      // until it's re-scored.
      process.stderr.write(`WARN: skipping corrupt batch file ${f}: ${e.message}\n`);
    }
  }
  await writeFile(join(out, "scores.json"), JSON.stringify(merged, null, 1));
  console.log(`scored ${merged.length} items in ${done} batches, ${tin} in / ${tout} out tokens, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
