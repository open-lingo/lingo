/**
 * Builds compact JSON stroke-order data for Japanese kana + kanji from KanjiVG.
 *
 * Source: https://github.com/KanjiVG/kanjivg (CC BY-SA 3.0 — see
 * THIRD_PARTY_LICENSES.md). Output JSON is therefore also CC BY-SA 3.0 as a
 * derivative work of the KanjiVG dataset.
 *
 * Run: `node scripts/build-kanjivg-data.mjs`
 * Writes:
 *   src/shared/glyphs/data/hiragana.json
 *   src/shared/glyphs/data/katakana.json
 *   src/shared/glyphs/data/kanji.json     ← the N5_KANJI catalog, incl. exposure tier
 *
 * The kanji set is READ OUT OF `n5Kanji.ts` by regex rather than hardcoded, so
 * adding a glyph to the catalog and re-running this is enough — the same
 * source-scanning trick `emit-tts-deck.mjs` uses. It fails loudly if the regex
 * matches nothing, because a silent zero here looks exactly like success.
 *
 * Output format:
 *   { viewBox: [0,0,109,109],
 *     characters: {
 *       "あ": { strokes: [{ d: "M...", start: [x,y] }, ...] },
 *       ...
 *     } }
 *
 * Re-run only when adding more glyphs or refreshing source data.
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "..", "src", "shared", "glyphs", "data");

// The KanjiVG <path> element always carries `id="kvg:XXXXX-sN"` and `d="..."`,
// but sometimes has other attributes (e.g. `kvg:type="..."`) between them. Match
// the two attributes independently of order.
const PATH_RE = /<path\b([^>]*)\/?>/g;
const ID_RE = /id="kvg:[^"]+-s(\d+)"/;
const D_RE = /\bd="([^"]+)"/;
const START_RE = /^[Mm]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/;

function parseStrokes(svg) {
  const strokes = [];
  let m;
  PATH_RE.lastIndex = 0;
  while ((m = PATH_RE.exec(svg)) !== null) {
    const attrs = m[1];
    const idMatch = ID_RE.exec(attrs);
    const dMatch = D_RE.exec(attrs);
    if (!idMatch || !dMatch) continue;
    const order = parseInt(idMatch[1], 10);
    const d = dMatch[1];
    const startMatch = START_RE.exec(d);
    const start = startMatch ? [parseFloat(startMatch[1]), parseFloat(startMatch[2])] : [0, 0];
    strokes.push({ order, d, start });
  }
  strokes.sort((a, b) => a.order - b.order);
  return strokes.map(({ d, start }) => ({ d, start }));
}

async function fetchSvg(codepoint) {
  const padded = codepoint.toString(16).padStart(5, "0");
  const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${padded}.svg`;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.text();
  } catch (err) {
    console.warn(`fetch failed for U+${padded}: ${err.message}`);
    return null;
  }
}

async function processCharacter(cp) {
  const ch = String.fromCodePoint(cp);
  const svg = await fetchSvg(cp);
  if (!svg) return { ch, entry: null };
  const strokes = parseStrokes(svg);
  if (strokes.length === 0) return { ch, entry: null };
  return { ch, entry: { strokes } };
}

async function runInBatches(items, fn, concurrency) {
  const out = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(fn));
    out.push(...results);
  }
  return out;
}

async function ingestCodepoints(codepoints, fileName) {
  process.stdout.write(`fetching ${codepoints.length} glyphs for ${fileName}…\n`);
  const results = await runInBatches(codepoints, processCharacter, 10);

  const characters = {};
  let count = 0;
  const missing = [];
  for (const { ch, entry } of results) {
    if (entry) {
      characters[ch] = entry;
      count++;
    } else {
      missing.push(ch);
    }
  }
  const out = { viewBox: [0, 0, 109, 109], characters };
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, fileName), JSON.stringify(out));
  console.log(`  wrote ${fileName} — ${count} characters`);
  if (missing.length > 0) {
    console.log(`  NOT IN KANJIVG (${missing.length}): ${missing.join("")}`);
  }
}

function ingest(range, fileName) {
  const [lo, hi] = range;
  const codepoints = [];
  for (let cp = lo; cp <= hi; cp++) codepoints.push(cp);
  return ingestCodepoints(codepoints, fileName);
}

/**
 * The kanji set = every `character:` in the N5_KANJI catalog (both the n5 and
 * the exposure tier — the exposure glyphs are the ones a kana→kanji switchover
 * beat needs most, so they are not optional here).
 */
async function kanjiCodepoints() {
  const src = path.resolve(
    __dirname,
    "..",
    "src",
    "features",
    "languages",
    "ja",
    "secondScript",
    "n5Kanji.ts",
  );
  const text = await readFile(src, "utf8");
  const chars = [...text.matchAll(/character:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (chars.length === 0) {
    throw new Error(
      `no \`character: "…"\` entries found in ${src} — the regex went stale, ` +
        `refusing to write an empty kanji.json`,
    );
  }
  const unique = [...new Set(chars)];
  console.log(`n5Kanji.ts → ${chars.length} entries, ${unique.length} unique glyphs`);
  return unique.map((ch) => ch.codePointAt(0));
}

await mkdir(OUT_DIR, { recursive: true });
await ingest([0x3041, 0x3096], "hiragana.json");
await ingest([0x30a1, 0x30f6], "katakana.json");
await ingestCodepoints(await kanjiCodepoints(), "kanji.json");
console.log("done.");
