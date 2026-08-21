// index-audit.mjs — DETERMINISTIC index/reality reconciliation.
//
// Pure core (`auditIndex`) so it is testable without a filesystem; a thin CLI
// at the bottom runs it against the real repo. No LLM — this is ground truth
// the generator must not be trusted to compute.

const REF_RE = /`([^`]+\.(?:md|txt))`/g;

// Lines that DOCUMENT a dead link on purpose ("don't chase them") — their refs
// are intentional, not drift. Skip them.
const SELF_DOCUMENTED_DEAD_RE = /dead link|don't exist|doesn't exist|are gone|is gone|don't chase|no longer exist/i;

// A ref is a template/placeholder (not a real link) if it carries a glob, an
// angle-bracket slot, or the mN/mX module-context placeholder.
function isPlaceholder(ref) {
  return /[<>*]/.test(ref) || /\bm[NX]\b/.test(ref) || /\/m[NX]-/.test(ref) || /mN-/.test(ref);
}

function basename(p) { return p.split("/").pop(); }

/**
 * @param {object} o
 * @param {string} o.indexText   raw text of the index file
 * @param {string[]} o.repoFiles repo-relative posix paths that actually exist
 * @param {string} [o.indexDir]  dir the index lives in (bare refs resolve here)
 * @returns {{refs:string[], deadLinks:string[], unlistedDocs:string[]}}
 */
export function auditIndex({ indexText, repoFiles, indexDir = "docs" }) {
  const fileSet = new Set(repoFiles);
  // basename → true, so a ref by bare name (`STATE.md`) resolves to a file that
  // actually lives in a subdir (`docs/learner-sim/STATE.md`).
  const baseSet = new Set(repoFiles.map(basename));

  // Collect refs line-by-line so we can skip lines that self-document a dead link.
  const refs = [];
  const seen = new Set();
  for (const line of indexText.split("\n")) {
    if (SELF_DOCUMENTED_DEAD_RE.test(line)) continue; // intentional dead link
    for (const m of line.matchAll(REF_RE)) {
      const ref = m[1].trim();
      if (!seen.has(ref)) { seen.add(ref); refs.push(ref); }
    }
  }

  const resolvedRefBasenames = new Set(); // for unlisted reconciliation
  const deadLinks = [];
  for (const ref of refs) {
    if (isPlaceholder(ref)) continue;
    const alive = fileSet.has(ref) || fileSet.has(`${indexDir}/${ref}`) || baseSet.has(basename(ref));
    if (alive) {
      resolvedRefBasenames.add(ref);
      resolvedRefBasenames.add(basename(ref));
    } else {
      deadLinks.push(ref);
    }
  }

  // Unlisted = top-level docs directly under indexDir/ (one path segment past
  // it), *.md, excluding the index itself, whose path/basename never appears
  // among the resolved refs.
  const topLevelPrefix = `${indexDir}/`;
  const unlistedDocs = repoFiles.filter((f) => {
    if (!f.startsWith(topLevelPrefix)) return false;
    const rest = f.slice(topLevelPrefix.length);
    if (rest.includes("/")) return false; // nested (archive/, context/, …) — not top-level
    if (!f.endsWith(".md")) return false;
    if (/\/INDEX\.md$/.test(f) || f === `${indexDir}/INDEX.md`) return false;
    const base = rest;
    return !resolvedRefBasenames.has(f) && !resolvedRefBasenames.has(base);
  });

  return { refs, deadLinks, unlistedDocs };
}

// ---- CLI ------------------------------------------------------------------
// Usage: node index-audit.mjs [indexRelPath] [--root <mainTree>]
if (import.meta.url === `file://${process.argv[1]}`) {
  const argRoot = (() => { const i = process.argv.indexOf("--root"); return i > -1 ? process.argv[i + 1] : "."; })();
  const indexRel = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "docs/INDEX.md";
  const { indexPath, indexText, repoFiles, confirmDead } =
    await import("./fs-util.mjs").then((m) => m.forIndexCli(indexRel, argRoot));
  const indexDir = indexPath.split("/").slice(0, -1).join("/") || ".";
  const { refs, deadLinks, unlistedDocs } = auditIndex({ indexText, repoFiles, indexDir });
  // Drop false positives: a ref that resolves to a file actually present on
  // disk (gitignored, cross-repo, whatever) is NOT dead. Confirm against fs.
  const trulyDead = await confirmDead(deadLinks, indexDir);
  console.log(JSON.stringify({
    index: indexPath,
    refCount: refs.length,
    deadLinks: trulyDead,
    unlistedCount: unlistedDocs.length,
    unlistedDocs,
  }, null, 2));
}
