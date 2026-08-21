// loop.mjs — ONE bounded doc-hygiene pass. Endless-ness is achieved by
// re-running it; each pass completing re-invokes the frontier reviewer.
//
//   node scripts/doc-hygiene/loop.mjs --main <mainTree> [--apply moderate|none]
//
// Design (see GOAL.md): deterministic scans compute ground truth; the local
// 122B judges/drafts; only unambiguous+reversible fixes auto-apply on THIS
// branch; every judgment call is queued to LEDGER.md for the frontier.
//
// Pass-1 lesson baked in: the local model returns "keep" for EVERYTHING, so an
// OBJECTIVE signal (self-declared banner + zero inbound refs) drives the
// archive decision and the model only gets a VETO (declares_itself_dead:false).
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { auditIndex } from "./index-audit.mjs";
import { scanStaleness } from "./staleness-scan.mjs";
import { walk, forIndexCli } from "./fs-util.mjs";
import { inboundRefs as computeInbound } from "./refs.mjs";
import { chat, preflight, MODELS } from "./ollama.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const MAIN = arg("main", "/Users/lichfield/Documents/projects/lingle/lingo");
const APPLY = arg("apply", "moderate"); // moderate | none
const WT = process.cwd();
const NOW = arg("stamp", new Date().toISOString());
const STALE_BUDGET = Number(arg("stale-budget", "24"));
const HY = `${WT}/docs/hygiene`;

const git = (...a) => execFileSync("git", ["-C", WT, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

async function main() {
  await mkdir(HY, { recursive: true });
  const pf = await preflight();
  if (!pf.ok || !pf.judge) throw new Error(`ollama/judge model unavailable: ${JSON.stringify(pf)}`);

  // 1. DETERMINISTIC ground truth (existence read from MAIN so gitignored docs count)
  const { indexText, repoFiles, confirmDead } = await forIndexCli("docs/INDEX.md", MAIN);
  const idx = auditIndex({ indexText, repoFiles, indexDir: "docs" });
  const deadLinks = await confirmDead(idx.deadLinks, "docs");
  // Only docs that DECLARE THEMSELVES dead — not docs that mention "stale".
  const stale = (await scanStaleness(MAIN)).filter((h) => !h.archived && h.selfDeclared);
  const allDocs = await walk("docs", { exts: [".md"], root: MAIN });

  // inbound-reference index: does any OTHER doc mention this file's basename?
  const corpus = [];
  for (const f of allDocs) {
    try { corpus.push({ f, text: await readFile(`${MAIN}/${f}`, "utf8") }); } catch { /* skip */ }
  }
  // Extension-agnostic: docs reference each other by stem, often without `.md`.
  const inboundRefs = (target) => computeInbound(corpus, target);

  // 2. LOCAL-MODEL triage — the model's job is to VETO a false positive, not to
  //    decide archive/keep (pass 1 proved it always says keep).
  const staleSchema = {
    type: "object",
    properties: {
      declares_itself_dead: { type: "boolean" },
      one_line: { type: "string" },
    },
    required: ["declares_itself_dead", "one_line"],
  };
  const triaged = [];
  const budget = stale.slice(0, STALE_BUDGET);
  for (const h of budget) {
    let head = "";
    try { head = (await readFile(`${MAIN}/${h.file}`, "utf8")).split("\n").slice(0, 40).join("\n"); } catch {}
    const inbound = inboundRefs(h.file);
    let judgment;
    try {
      judgment = await chat(
        `Below is the top of a documentation file. Does the file DECLARE ITSELF ` +
        `stale/superseded/obsolete as a whole (a status banner about THIS doc)? ` +
        `Answer declares_itself_dead=false if the word only appears while describing ` +
        `OTHER docs. Give a one_line summary of what the doc is. JSON only.\n\n` +
        `FILE: ${h.file}\n\n${head}`,
        { model: MODELS.judge, schema: staleSchema, numPredict: 700 },
      );
    } catch (e) { judgment = { declares_itself_dead: false, one_line: `probe error: ${String(e).slice(0, 80)}` }; }
    triaged.push({ ...h, inbound, judgment });
  }

  // 3. APPLY (Moderate) — objective signal drives; model vetoes. Archive a
  //    self-declared-dead doc with ZERO inbound refs (moving can't break a link).
  const applied = [];
  if (APPLY !== "none") {
    for (const t of triaged) {
      const safe = t.selfDeclared && t.inbound.length === 0 && t.judgment.declares_itself_dead !== false;
      if (!safe) continue;
      const dest = t.file.replace(/^docs\//, "docs/archive/");
      try {
        await mkdir(`${WT}/${dest.split("/").slice(0, -1).join("/")}`, { recursive: true });
        await rename(`${WT}/${t.file}`, `${WT}/${dest}`);
        git("add", "--", t.file, dest);
        applied.push({ action: "archive", from: t.file, to: dest, why: t.judgment.one_line });
      } catch { /* absent/gitignored in worktree — skip; it gets ledgered */ }
    }
  }

  // 4. LEDGER — everything needing judgment
  const ledgerEntries = [];
  for (const d of deadLinks) ledgerEntries.push({ kind: "dead-index-link", ref: d, action: "confirm gone → strike from INDEX, or repoint" });
  for (const t of triaged) {
    if (applied.find((a) => a.from === t.file)) continue;
    ledgerEntries.push({
      kind: "stale-doc",
      file: t.file, marker: t.marker,
      declares_dead: t.judgment.declares_itself_dead,
      inbound: t.inbound.length,
      note: t.judgment.one_line + (t.inbound.length ? ` (referenced by ${t.inbound.length} docs — moving breaks links; repoint first)` : ""),
    });
  }
  ledgerEntries.push({ kind: "unlisted-docs", count: idx.unlistedDocs.length, sample: idx.unlistedDocs.slice(0, 12), action: "decide which belong in INDEX vs archive" });

  // 5. WRITE report + ledger + machine findings
  const findings = { stamp: NOW, apply: APPLY, deadLinks, unlisted: idx.unlistedDocs, staleSelfDeclared: stale.length, triagedCount: triaged.length, applied, ledger: ledgerEntries };
  await writeFile(`${HY}/findings-${NOW.slice(0, 10)}.json`, JSON.stringify(findings, null, 2));
  await writeFile(`${HY}/REPORT.md`, renderReport({ NOW, MAIN, idx, deadLinks, stale, triaged, applied, ledgerEntries, budget, pf }));
  await appendLedger(ledgerEntries, NOW);

  // 6. COMMIT outputs to the branch (skip husky). Only docs/hygiene — the
  //    tooling may run from a different tree than the one being audited.
  git("add", "--", "docs/hygiene");
  try {
    git("commit", "--no-verify", "-m", `doc-hygiene pass ${NOW.slice(0, 16)}: ${applied.length} archived, ${ledgerEntries.length} queued`);
  } catch { /* nothing to commit */ }

  console.log(JSON.stringify({ applied: applied.length, appliedFiles: applied.map((a) => a.from), deadLinks: deadLinks.length, unlisted: idx.unlistedDocs.length, staleSelfDeclared: stale.length, triaged: triaged.length, ledger: ledgerEntries.length }, null, 2));
}

function renderReport({ NOW, MAIN, idx, deadLinks, stale, triaged, applied, ledgerEntries, budget, pf }) {
  const L = [];
  L.push(`# Doc-Hygiene Report`, ``);
  L.push(`- **Pass:** ${NOW}`, `- **Source tree:** ${MAIN}`, `- **Branch:** doc-hygiene (isolated; review before merge to main)`);
  L.push(`- **Models:** judge=${pf.judge ? MODELS.judge : "MISSING"}, coder=${pf.coder ? "ok" : "MISSING"}`);
  L.push(``, `## Applied this pass (auto, reversible — archive self-dead docs w/ zero inbound refs)`, ``);
  if (applied.length === 0) L.push(`_None qualified this pass._`);
  for (const a of applied) L.push(`- \`${a.from}\` → \`${a.to}\` — ${a.why}`);
  L.push(``, `## Deterministic ground truth`, ``);
  L.push(`- **Dead INDEX links:** ${deadLinks.length} → ${deadLinks.map((d) => `\`${d}\``).join(", ") || "none"}`);
  L.push(`- **Unlisted top-level docs:** ${idx.unlistedDocs.length}`);
  L.push(`- **Self-declared-dead docs outside archive/:** ${stale.length} (triaged ${triaged.length}, budget ${budget.length})`);
  L.push(``, `## Judgment queue (LEDGER.md — frontier adjudicates)`, ``, `- ${ledgerEntries.length} entries queued.`);
  L.push(stale.length > budget.length
    ? `\n> **Coverage cap:** ${stale.length - budget.length} more self-declared docs remain untriaged (budget ${budget.length}/pass). Not implied as clean.`
    : `\n> Full self-declared-dead surface triaged this pass.`);
  return L.join("\n") + "\n";
}

async function appendLedger(entries, NOW) {
  const path = `${HY}/LEDGER.md`;
  let prior = "";
  try { prior = await readFile(path, "utf8"); } catch { prior = `# Doc-Hygiene Ledger — frontier adjudicates\n\nEntries the local agent would NOT auto-apply. Each needs a human/frontier call.\n`; }
  const block = [`\n## Pass ${NOW}\n`];
  for (const e of entries) block.push(`- [ ] **${e.kind}** — ${JSON.stringify(e).slice(0, 400)}`);
  await writeFile(path, prior + block.join("\n") + "\n");
}

main().catch((e) => { console.error("loop failed:", e); process.exit(1); });
