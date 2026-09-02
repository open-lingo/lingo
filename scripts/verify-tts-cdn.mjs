/**
 * Sample-check that the manifests and the published audio agree.
 *
 *   node scripts/verify-tts-cdn.mjs [--sample 25] [--base https://openlingoapp.com]
 *
 * ## Why this exists
 *
 * A clip that is in the manifest but NOT in the bucket does not 404. The
 * CloudFront distribution maps 403/404 to `index.html` with a 200, so the app
 * fetches ~2.6 KB of HTML, hands it to `decodeAudioData`, and gets
 * "EncodingError: Unable to decode audio data". Nothing in the network tab
 * looks wrong — every request is a 200 — and the symptom reaches you as
 * "some sounds don't play". That cost hours on 2026-07-29.
 *
 * The deploy workflow already asserts the OBJECT COUNT survives a sync, which
 * catches deletion. This catches the other direction: manifest entries added
 * without publishing the matching audio (e.g. a content pack that ships
 * manifest updates but skips `pipeline.tts.upload`).
 *
 * Sampling, not exhaustive: 14.5k HEADs would be slow and the failure modes
 * here are bulk ones — a whole pack unpublished, a prefix wiped. A handful per
 * language finds those immediately.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_DIR = resolve(__dirname, "../src/shared/tts/manifests");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
/**
 * The clips are served from the ASSET origin, which is NOT the apex. Defaulting
 * to `openlingoapp.com` made this script report every single clip missing —
 * the apex answers a `/tts/v1/...` path with index.html and a 200, which is the
 * exact signature this script calls "MISSING". A checker whose own default
 * cries wolf is worse than no checker, so read the base the app actually uses.
 */
function configuredBase() {
  for (const file of [".env.native", ".env"]) {
    try {
      const body = readFileSync(resolve(__dirname, "..", file), "utf-8");
      const found = body.match(/^VITE_ASSET_BASE_URL=(.+)$/m)?.[1]?.trim();
      if (found) return found;
    } catch {
      // Not every checkout has every env file; fall through to the next.
    }
  }
  return "https://app.openlingoapp.com";
}

const BASE = arg("base", configuredBase()).replace(/\/+$/, "");
const SAMPLE = Number(arg("sample", "25"));
const CONCURRENCY = 12;

function pick(arr, n) {
  const out = [];
  const step = Math.max(1, Math.floor(arr.length / n));
  for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
  return out;
}

const targets = [];
for (const file of readdirSync(MANIFEST_DIR).filter((f) => f.endsWith(".json"))) {
  if (file === "index.json") continue;
  const doc = JSON.parse(readFileSync(join(MANIFEST_DIR, file), "utf-8"));
  const hashes = [];
  for (let i = 0; i + 16 <= (doc.hashes ?? "").length; i += 16) {
    hashes.push(doc.hashes.slice(i, i + 16));
  }
  for (const h of pick(hashes, SAMPLE)) {
    targets.push({ lang: doc.lang, url: `${BASE}/${doc.prefix}/${h}.mp3` });
  }
  const overrides = Object.values(doc.overrides ?? {}).map((v) =>
    typeof v === "string" ? v : v[0],
  );
  for (const rel of pick(overrides, Math.ceil(SAMPLE / 2))) {
    targets.push({ lang: `${doc.lang} (override)`, url: `${BASE}/${rel}` });
  }
}

async function probe({ lang, url }) {
  try {
    const res = await fetch(url);
    const type = res.headers.get("content-type") ?? "";
    const ok = res.ok && type.includes("audio");
    return { lang, url, ok, detail: `${res.status} ${type}` };
  } catch (e) {
    return { lang, url, ok: false, detail: String(e).slice(0, 80) };
  }
}

const results = [];
for (let i = 0; i < targets.length; i += CONCURRENCY) {
  results.push(...(await Promise.all(targets.slice(i, i + CONCURRENCY).map(probe))));
}

const bad = results.filter((r) => !r.ok);
const byLang = {};
for (const r of results) {
  byLang[r.lang] ??= { total: 0, bad: 0 };
  byLang[r.lang].total++;
  if (!r.ok) byLang[r.lang].bad++;
}
for (const [lang, s] of Object.entries(byLang)) {
  console.log(`  ${lang.padEnd(18)} ${s.total - s.bad}/${s.total} serving audio`);
}
if (bad.length) {
  console.error(`\n${bad.length} manifest entr${bad.length === 1 ? "y" : "ies"} not serving audio:`);
  for (const r of bad.slice(0, 15)) {
    console.error(`  ${r.detail}  ${r.url}`);
  }
  console.error(
    "\nA 200 with content-type text/html means the object is MISSING — the CDN\n" +
      "falls back to index.html. Publish from lingo-data:\n" +
      "  python -m pipeline.tts.upload --revision <lingo-sha>",
  );
  process.exit(1);
}
console.log(`\nOK — ${results.length} sampled clips all serving audio from ${BASE}`);
