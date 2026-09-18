// grep-fallback.mjs — pure-Node recursive grep, used when no standalone `rg`
// binary is on PATH. Confirmed live 2026-09-18: this sandbox's `rg` is only a
// shell FUNCTION (sources the claude binary via ARGV0 trick, see
// ~/.claude/shell-snapshots/*) — invisible to child_process.execFileSync,
// which does a raw PATH lookup and throws ENOENT. Real ripgrep may exist on
// a normal dev machine; find.mjs tries it first and only falls back here.
import { readdirSync, statSync, readFileSync } from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", "ios", "android", "artifacts", ".turbo"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".jsx", ".md", ".mdx", ".json", ".yaml", ".yml", ".css", ".html"]);
const STOP = new Set(["how", "does", "the", "a", "an", "is", "in", "of", "to", "for", "and", "what", "where"]);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function buildMatcher(term) {
  if (/^[A-Za-z0-9_.:/-]+$/.test(term) && !term.includes(" ")) return new RegExp(esc(term), "i");
  const words = (term.match(/[a-z0-9_]+/gi) || []).filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()));
  return new RegExp(words.length ? words.map(esc).join("|") : esc(term), "i");
}

function* walk(root) {
  let entries;
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(root, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (TEXT_EXT.has(path.extname(e.name))) yield p;
  }
}

/** Grep `term` (see buildMatcher) across `roots` (files or dirs). Mirrors
 *  `rg -n -i -m <maxPerFile>`: up to maxPerFile hits per file, as
 *  "path:line:text" strings. */
export function grepFallback(term, roots, { maxPerFile = 3 } = {}) {
  const re = buildMatcher(term);
  const out = [];
  for (const root of roots) {
    let files;
    try { files = statSync(root).isDirectory() ? [...walk(root)] : [root]; } catch { continue; }
    for (const f of files) {
      let text;
      try { text = readFileSync(f, "utf8"); } catch { continue; }
      const lines = text.split("\n");
      let hits = 0;
      for (let i = 0; i < lines.length && hits < maxPerFile; i++) {
        if (re.test(lines[i])) { out.push(`${f}:${i + 1}:${lines[i].trim().slice(0, 200)}`); hits++; }
      }
    }
  }
  return out;
}
