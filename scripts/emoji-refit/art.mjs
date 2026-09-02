/**
 *   node scripts/emoji-refit/art.mjs --out <out> [--root <repo>] [--only <id>[,<id>...]] [--seed 7]
 *
 * Generates flat-vector-sticker custom art for every `action: "art"` decision
 * in `<out>/decisions.json`, via local mflux + Z-Image-Turbo (offline,
 * ~25s/image — see src/pub/lingo-art/cast/README.md's recipe, the exact
 * style clause below is byte-identical to keep every image reading as one
 * set). Raw renders go to `<out>/art/<course>-<atomId>.png`; each is then
 * post-processed (flood-fill alpha, crop, 1px erode, 64-colour quantize —
 * scripts/emoji-refit/postprocess.py) into
 * `src/pub/lingo-art/vocab/<course>/<atomId>.png`.
 *
 * `--only` re-renders just the listed decision ids (e.g. after a manual
 * visual-review rejection) without regenerating the other 11.
 */
import { mkdir, readFile, rm } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

const flag = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d; };

const STYLE =
  "flat vector sticker, thick dark outline, three flat colours, no gradient, no text, centered on plain white background, Noto emoji style";

export function buildPrompt(artPrompt) {
  return `${artPrompt}, ${STYLE}`;
}

export function rawArtPath(out, decision) {
  const atomId = decision.id.slice(decision.id.indexOf(":") + 1);
  return join(out, "art", `${decision.id.split(":")[0]}-${atomId}.png`);
}

export function finalArtPath(root, decision) {
  const course = decision.id.split(":")[0];
  const atomId = decision.id.slice(decision.id.indexOf(":") + 1);
  return join(root, "src/pub/lingo-art/vocab", course, `${atomId}.png`);
}

async function generateRaw(rawPath, artPrompt, seed) {
  // mflux-generate-z-image-turbo refuses to overwrite an existing output
  // file — it silently auto-suffixes (ja-sutoobu_1.png) instead, which
  // means a regenerate-in-place re-run would postprocess the STALE image
  // and look like a no-op. Delete first so the fixed path is always fresh.
  await rm(rawPath, { force: true });
  execFileSync(
    "mflux-generate-z-image-turbo",
    [
      "--steps", "8",
      "--seed", String(seed),
      "--width", "512",
      "--height", "512",
      "--output", rawPath,
      "--prompt", buildPrompt(artPrompt),
    ],
    { stdio: "inherit" },
  );
}

function postprocess(rawPath, finalPath) {
  execFileSync("python3", [join(__dirname, "postprocess.py"), rawPath, finalPath], { stdio: "inherit" });
}

async function main() {
  const out = flag("out", "artifacts/emoji-refit");
  const root = flag("root", process.cwd());
  const seed = flag("seed", "7");
  const onlyArg = flag("only", null);
  const only = onlyArg ? new Set(onlyArg.split(",")) : null;

  const decisions = JSON.parse(await readFile(join(out, "decisions.json"), "utf8"));
  const art = decisions.filter((d) => d.action === "art" && (!only || only.has(d.id)));
  if (art.length === 0) {
    console.log("no art decisions to generate (check --only ids against decisions.json)");
    return;
  }

  await mkdir(join(out, "art"), { recursive: true });

  const results = [];
  for (const d of art) {
    const rawPath = rawArtPath(out, d);
    const finalPath = finalArtPath(root, d);
    await mkdir(dirname(finalPath), { recursive: true });
    console.log(`generating ${d.id} (seed ${seed})...`);
    await generateRaw(rawPath, d.artPrompt, seed);
    postprocess(rawPath, finalPath);
    const bytes = existsSync(finalPath) ? statSync(finalPath).size : 0;
    results.push({ id: d.id, rawPath, finalPath, bytes, seed: Number(seed) });
  }
  console.log(`generated ${results.length} art image(s)`);
  for (const r of results) console.log(`  ${r.id}: ${r.finalPath} (${r.bytes} bytes, seed ${r.seed})`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
