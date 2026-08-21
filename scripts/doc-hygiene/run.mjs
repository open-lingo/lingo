#!/usr/bin/env node
// run.mjs — THE WEEKLY DOC-HYGIENE PROCESS.
//
//   node scripts/doc-hygiene/run.mjs [--apply moderate|none]
//
// Each run spins a FRESH dated worktree+branch off the current main HEAD, runs
// the deterministic scans + local-model triage + repoint-proposal generation,
// auto-applies only the safe reversible fixes, and leaves everything on the
// branch with a single REPORT.md to review. Nothing merges automatically —
// review the branch, then `git merge` (or cherry-pick) what you want.
//
// Idempotent: it reads the CURRENT state of main each week, so fixes that were
// merged last week don't re-surface, and new rot does.
import { execFileSync } from "node:child_process";
import { existsSync, symlinkSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const APPLY = arg("apply", "moderate");

// The main tree: normally the repo this script lives in; --main overrides it
// (needed when the tooling is run from a linked worktree during development).
const MAIN = arg("main", null) ||
  execFileSync("git", ["-C", here, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
// quiet variant for idempotent cleanup that is expected to fail on a first run
const gitQuiet = (cwd, ...a) => { try { execFileSync("git", ["-C", cwd, ...a], { stdio: "ignore" }); } catch {} };
const stamp = new Date().toISOString();
const day = stamp.slice(0, 10);
// Hyphen, not slash: a `doc-hygiene` branch would block nested `doc-hygiene/*`
// refs (git refs are files), so weekly branches are siblings.
const branch = `doc-hygiene-${day}`;
const wtRoot = arg("wt-root", resolve(MAIN, "..", ".doc-hygiene-worktrees"));
const WT = join(wtRoot, day);

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 128 * 1024 * 1024 });
}

console.log(`[doc-hygiene] main=${MAIN}`);
console.log(`[doc-hygiene] weekly run ${stamp} → branch ${branch}`);

// 1. Fresh worktree+branch off current main HEAD (idempotent: recreate if stale)
gitQuiet(MAIN, "worktree", "remove", "--force", WT);
gitQuiet(MAIN, "worktree", "prune");
gitQuiet(MAIN, "branch", "-D", branch);
const mainHead = git(MAIN, "rev-parse", "HEAD").trim();
git(MAIN, "worktree", "add", "-b", branch, WT, mainHead);
console.log(`[doc-hygiene] worktree ${WT} @ ${mainHead.slice(0, 8)}`);

// 2. node_modules for tooling deps
const nm = join(WT, "node_modules");
if (!existsSync(nm)) { try { symlinkSync(join(MAIN, "node_modules"), nm); } catch {} }

// 3. Run the passes with cwd = the fresh worktree (so outputs land there), but
//    invoke the tooling by ABSOLUTE path from `here` — the worktree is a
//    checkout of main and need not contain the tooling itself.
const runNode = (script, extra = []) =>
  sh("node", [join(here, script), "--main", MAIN, "--stamp", stamp, ...extra], WT);

console.log(`[doc-hygiene] scan + triage + safe-apply …`);
const loopOut = runNode("loop.mjs", ["--apply", APPLY]);
console.log(loopOut.trim());

console.log(`[doc-hygiene] repoint proposals (local coder) …`);
let repointOut = "{}";
try { repointOut = runNode("repoint.mjs"); console.log(repointOut.trim()); }
catch (e) { console.error("[doc-hygiene] repoint step failed (non-fatal):", String(e).slice(0, 200)); }

// 4. Commit whatever the passes produced (they also self-commit; this catches proposals)
try {
  git(WT, "add", "--", "docs/hygiene");
  git(WT, "commit", "--no-verify", "-m", `doc-hygiene weekly ${day}: proposals + report`);
} catch { /* nothing new */ }

console.log(`\n[doc-hygiene] DONE. Review:`);
console.log(`  cd ${WT} && git log --oneline ${mainHead.slice(0, 8)}..HEAD`);
console.log(`  open docs/hygiene/REPORT.md  and  docs/hygiene/repoint-proposals.md`);
console.log(`  merge when happy:  git -C ${MAIN} merge ${branch}`);
