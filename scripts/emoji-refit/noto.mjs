import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

/** Same rules as src/shared/assets/notoEmoji.ts: FE0F dropped, ZWJ kept, lowercase hex, 4-digit pad below 0x100. */
export function notoFilename(emoji) {
  const cps = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined || cp === 0xfe0f) continue;
    cps.push(cp < 0x100 ? cp.toString(16).padStart(4, "0") : cp.toString(16));
  }
  return `emoji_u${cps.join("_")}.svg`;
}

export function isDigitOrKeycap(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  if (cps.includes(0x20e3)) return true;
  if (cps.length === 1 && cps[0] >= 0x30 && cps[0] <= 0x39) return true;
  if (cps[0] === 0x1f522) return true; // 🔢
  return false;
}

export function isFlag(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  return cps.length === 2 && cps.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff);
}

/**
 * Upstream Noto svg/ directory listing, cached once per out dir. The GitHub
 * tree API is unauthenticated here (no GITHUB_TOKEN in this environment); if
 * it 403s/429s, fall back to a per-candidate HEAD against raw.githubusercontent.com
 * — see `headCheckNoto` below, used by check.mjs when the index fetch fails.
 */
export async function loadNotoIndex(out) {
  const cache = join(out, "noto-index.json");
  try { return new Set(JSON.parse(await readFile(cache, "utf8"))); } catch { /* fetch */ }
  const res = await fetch("https://api.github.com/repos/googlefonts/noto-emoji/git/trees/main?recursive=1", {
    headers: { accept: "application/vnd.github+json", "user-agent": "lingo-emoji-refit" },
  });
  if (!res.ok) throw new Error(`github tree ${res.status}`);
  const tree = (await res.json()).tree.filter((t) => t.path.startsWith("svg/emoji_u")).map((t) => t.path.slice(4));
  await writeFile(cache, JSON.stringify(tree));
  return new Set(tree);
}

/**
 * Fallback path when the GitHub tree API is rate-limited: HEAD the raw file
 * per candidate instead of fetching the whole tree. Caches hits/misses to
 * `<out>/noto-index.json` as they're discovered so repeat runs don't re-HEAD.
 */
export async function headCheckNoto(filename) {
  const res = await fetch(`https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/${filename}`, {
    method: "HEAD",
  });
  return res.ok;
}

export async function loadVendored(root) {
  return new Set(await readdir(join(root, "src/pub/noto-emoji/svg")));
}
