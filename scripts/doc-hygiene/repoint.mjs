// repoint.mjs — REPOINT-THEN-ARCHIVE proposal engine (cleanup step "A").
//
// The real slop: a doc self-declares dead but is still referenced by 1..9
// others, so it can't just be moved. The fix is to repoint its referrers at
// the successor the dead doc names, THEN archive it. This module builds
// reviewable PROPOSALS (never auto-applies multi-doc edits) for the frontier.
import { readFile } from "node:fs/promises";
import { docStem } from "./refs.mjs";

// A dead-doc banner usually names where to go instead:
//   "... Kept for history — see docs/plan-code-reconciliation-2026-07-20.md §4."
//   "SUPERSEDED by `docs/foo.md`" / "→ docs/bar.md" / "now lives in docs/baz.md"
const SUCCESSOR_RE = /(?:see|superseded by|replaced by|now (?:lives in|at)|→)\s+`?(\.{0,2}\/?(?:docs\/)?[\w./-]+\.md)`?/i;

/** Pull the successor doc path from a dead doc's head matter, or null. */
export function extractSuccessor(headText) {
  const m = headText.match(SUCCESSOR_RE);
  if (!m) return null;
  let p = m[1].replace(/^\.\//, "");
  if (!p.startsWith("docs/") && !p.startsWith("../")) p = `docs/${p}`;
  return p;
}

/** Referrer mention lines for a dead doc (stem match), with line numbers. */
export function mentionLines(referrerText, deadDocPath) {
  const stem = docStem(deadDocPath);
  const out = [];
  referrerText.split("\n").forEach((line, i) => {
    if (line.includes(stem)) out.push({ line: i + 1, text: line.trim().slice(0, 200) });
  });
  return out;
}

// ---- proposal generator (CLI) ---------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const { scanStaleness } = await import("./staleness-scan.mjs");
  const { walk } = await import("./fs-util.mjs");
  const { inboundRefs } = await import("./refs.mjs");
  const { chat, MODELS } = await import("./ollama.mjs");
  const { writeFile, mkdir } = await import("node:fs/promises");

  const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
  const MAIN = arg("main", "/Users/lichfield/Documents/projects/lingle/lingo");
  const WT = process.cwd();
  const NOW = arg("stamp", new Date().toISOString());

  const dead = (await scanStaleness(MAIN)).filter((h) => !h.archived && h.selfDeclared);
  const allDocs = await walk("docs", { exts: [".md"], root: MAIN });
  const corpus = [];
  for (const f of allDocs) { try { corpus.push({ f, text: await readFile(`${MAIN}/${f}`, "utf8") }); } catch {} }

  const editSchema = {
    type: "object",
    properties: {
      edits: {
        type: "array",
        items: {
          type: "object",
          properties: { file: { type: "string" }, oldString: { type: "string" }, newString: { type: "string" }, rationale: { type: "string" } },
          required: ["file", "oldString", "newString"],
        },
      },
    },
    required: ["edits"],
  };

  const proposals = [];
  for (const d of dead) {
    const head = (corpus.find((c) => c.f === d.file)?.text || "").split("\n").slice(0, 12).join("\n");
    const successor = extractSuccessor(head);
    const referrers = inboundRefs(corpus, d.file).map((f) => ({
      file: f, mentions: mentionLines(corpus.find((c) => c.f === f).text, d.file),
    }));
    let edits = null;
    if (successor) {
      // Local coder drafts the exact repoint edits — the grunt, off the frontier.
      const refLines = referrers.flatMap((r) => r.mentions.map((m) => `${r.file}:${m.line}: ${m.text}`)).slice(0, 30).join("\n");
      try {
        const out = await chat(
          `A doc is being archived: ${d.file}. Its successor is: ${successor}. ` +
          `Below are lines in OTHER docs that reference the archived doc by its name-stem ` +
          `"${docStem(d.file)}". For each, produce an exact-string edit that repoints the ` +
          `reference to the successor's stem "${docStem(successor)}", preserving surrounding text. ` +
          `oldString must be a unique substring of the line. JSON only.\n\nREFERENCES:\n${refLines}`,
          { model: MODELS.coder, schema: editSchema, numPredict: 2000 },
        );
        edits = out.edits;
      } catch (e) { edits = null; }
    }
    proposals.push({ deadDoc: d.file, successor, referrerCount: referrers.length, referrers, edits });
  }

  await mkdir(`${WT}/docs/hygiene`, { recursive: true });
  await writeFile(`${WT}/docs/hygiene/repoint-proposals-${NOW.slice(0, 10)}.json`, JSON.stringify({ stamp: NOW, proposals }, null, 2));
  // human-readable
  const md = ["# Repoint-then-archive proposals", "", `Pass ${NOW}. Frontier reviews each before apply.`, ""];
  for (const p of proposals) {
    md.push(`## \`${p.deadDoc}\``);
    md.push(`- successor: ${p.successor ? `\`${p.successor}\`` : "**NONE named — needs a human to pick one**"}`);
    md.push(`- referrers: ${p.referrerCount}`);
    md.push(`- drafted edits: ${p.edits ? p.edits.length : 0}`);
    md.push("");
  }
  await writeFile(`${WT}/docs/hygiene/repoint-proposals.md`, md.join("\n") + "\n");
  console.log(JSON.stringify({ deadDocs: proposals.length, withSuccessor: proposals.filter((p) => p.successor).length, withEdits: proposals.filter((p) => p.edits?.length).length }, null, 2));
}
