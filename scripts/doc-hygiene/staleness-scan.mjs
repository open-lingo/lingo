// staleness-scan.mjs — DETERMINISTIC self-flagged-staleness detector.
// Distinguishes a doc that DECLARES ITSELF dead (a top status banner) from one
// that merely MENTIONS staleness as content (an index, a hygiene charter). The
// latter was pass 1's INDEX.md / README.md false-positive.
import { readFile } from "node:fs/promises";
import { walk } from "./fs-util.mjs";

const MARKERS = [
  "SUPERSEDED", "STALE", "DEPRECATED", "OUTDATED", "CANCELLED", "CANCELED",
  "NO LONGER", "OBSOLETE", "ARCHIVED", "DO NOT USE",
];
const HEAD_LINES = 15; // only the top of a file "declares" the whole doc dead

// A line is a genuine SELF-declaration of deadness when it reads like a status
// banner near the very top — `> **Status: STALE SNAPSHOT (…)**`, `**SUPERSEDED
// …**`, `⏵ SUPERSEDED …` — and is NOT talking ABOUT other docs ("~half the
// files are stale", "retire superseded docs").
const BANNER_RE = /^\s*>?\s*\*{0,2}\s*(?:⏵\s*)?(?:status:\s*)?\*{0,2}\s*(SUPERSEDED|STALE|DEPRECATED|OBSOLETE|CANCELL?ED|OUTDATED)\b/i;
const ABOUT_OTHERS_RE = /\b(files?|docs?|directory|folder|most|half|some|many|others?|accumulate)\b[^.]*\b(stale|superseded|archival|obsolete)\b/i;

export function isSelfDeclaration(line, idx) {
  if (idx > 3) return false;                     // banners sit at the very top
  if (ABOUT_OTHERS_RE.test(line)) return false;  // talking about the corpus, not itself
  return BANNER_RE.test(line);
}

/** @returns {Promise<Array<{file, line, marker, text, archived, selfDeclared}>>} */
export async function scanStaleness(root = ".") {
  const files = await walk("docs", { exts: [".md"], root });
  const hits = [];
  for (const f of files) {
    let text;
    try { text = await readFile(`${root}/${f}`, "utf8"); } catch { continue; }
    const head = text.split("\n").slice(0, HEAD_LINES);
    for (let i = 0; i < head.length; i++) {
      const up = head[i].toUpperCase();
      const marker = MARKERS.find((m) => up.includes(m));
      if (marker) {
        hits.push({
          file: f,
          line: i + 1,
          marker,
          text: head[i].trim().slice(0, 160),
          archived: f.startsWith("docs/archive/"),
          selfDeclared: isSelfDeclaration(head[i], i),
        });
        break; // one head-flag per file is enough
      }
    }
  }
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = (() => { const i = process.argv.indexOf("--root"); return i > -1 ? process.argv[i + 1] : "."; })();
  const hits = await scanStaleness(root);
  const actionable = hits.filter((h) => h.selfDeclared && !h.archived);
  console.log(JSON.stringify({
    total: hits.length,
    selfDeclaredActionable: actionable.length,
    mereMentionsExcluded: hits.filter((h) => !h.selfDeclared && !h.archived).length,
    actionable,
  }, null, 2));
}
