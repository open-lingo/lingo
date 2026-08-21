// fs-util.mjs — shared filesystem helpers for the doc-hygiene loop.
// Existence is judged against the DISK, not git, so gitignored-but-present
// files (docs/research/* are chmod 600) don't read as dead links.
import { readdir, access, stat } from "node:fs/promises";
import { join } from "node:path";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "ios", "android", "tts-publish",
  "drafts", "coverage", ".vite", "screenshots",
]);

/** Recursively list files under `dir` (repo-relative posix), filtered by ext. */
export async function walk(dir, { exts = null, root = "." } = {}) {
  const out = [];
  async function rec(rel) {
    let entries;
    try { entries = await readdir(join(root, rel), { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (e.name.startsWith(".") && e.name !== ".") continue;
      const childRel = rel === "." ? e.name : `${rel}/${e.name}`;
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        await rec(childRel);
      } else if (!exts || exts.some((x) => e.name.endsWith(x))) {
        out.push(childRel);
      }
    }
  }
  await rec(dir === root ? "." : dir);
  return out;
}

/** Does a repo-relative (or ../cross-repo) path exist on disk? */
export async function exists(p, root = ".") {
  try { await access(join(root, p)); return true; } catch { return false; }
}

/** Build the CLI inputs for index-audit: file set + a dead-link confirmer.
 *  `root` should point at the MAIN working tree so gitignored/untracked docs
 *  (docs/research/* is chmod-600 and gitignored) count as existing. */
export async function forIndexCli(indexRelPath, root = ".") {
  const { readFile } = await import("node:fs/promises");
  const indexText = await readFile(join(root, indexRelPath), "utf8");
  const docsFiles = await walk("docs", { exts: [".md", ".txt"], root });
  const rootMd = (await readdir(root, { withFileTypes: true }))
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name);
  const repoFiles = [...docsFiles, ...rootMd];

  async function confirmDead(deadLinks, indexDir) {
    const stillDead = [];
    for (const ref of deadLinks) {
      const candidates = [ref, `${indexDir}/${ref}`];
      let found = false;
      for (const c of candidates) { if (await exists(c, root)) { found = true; break; } }
      if (!found) stillDead.push(ref);
    }
    return stillDead;
  }

  return { indexPath: indexRelPath, indexText, repoFiles, confirmDead };
}
