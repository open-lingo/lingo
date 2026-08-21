# code-index

Cheap, local, self-maintaining indexes that make agent work over this large TS
repo (~395k LOC, 1672 files, 304 docs) faster — plus maintenance jobs that keep
the project's own context honest. Built 2026-08-21. See [GOAL.md](./GOAL.md) for
the charter and the research behind it.

## The one law

> **Index feeds grep; it never replaces it.** (Anthropic dropped vector search from
> Claude Code for agentic grep, May 2025; Amazon Science got >90% of RAG quality
> with keyword search and no vector DB, Feb 2026.)

So there are **two layers**: a *precise* one (grep-adjacent, exact) that is primary,
and a *fuzzy* one (embeddings) that is a **candidate generator** — it proposes,
`rg`/read confirms, nothing is ever decided by a similarity score.

## What's here

### Precise layer + maintenance (no model, deterministic)

| Tool | What it does |
|---|---|
| `repo-map.mjs` (+ `-cli`) | tree-sitter symbol extraction + PageRank over the import/ref graph → **`docs/CODE_MAP.md`**, a token-budgeted digest ranked by dependency centrality. Regenerates from source (~2s cold, 281ms warm) so it can't drift. |
| `code-ref-audit.mjs` | Every source path cited in CLAUDE.md/docs that no longer resolves (repo-aware for cross-repo `lingo-core/…`). Catches the rename/move drift the `.md`-only doc-audit misses. |
| `file-watch.mjs` | God-files over the 400-LOC floor, growth vs a baseline, and **orphan modules** (exported symbols nobody imports — via a resolved import graph incl. dynamic `import()` and test edges). |
| `index-job.mjs` | The umbrella (sibling of the docs/INDEX.md job): runs all three, writes `artifacts/code-index/REPORT.md` + `LEDGER.md` + `findings.json`. Findings are a report; only a tool crash fails. Judgment calls (which orphan is really dead) go to the LEDGER. |

### Fuzzy layer (opt-in candidate generator; local Ollama embeddings)

| Tool | What it does |
|---|---|
| `embed/chunk.mjs` | AST-aware chunking (cAST): split at tree-sitter boundaries, merge tiny siblings, split oversized nodes; markdown by heading. Line spans + enclosing symbol per chunk. |
| `embed/store.mjs` | SQLite **FTS5 (BM25)** + **sqlite-vec (dense, nomic-embed-text 768-d)**. Incremental: a file is re-embedded only when its content hash changes. |
| `embed/query.mjs` | Hybrid retrieval: BM25 + vector KNN fused by **RRF** (`embed/rrf.mjs`) → candidates with `path:line`. |
| `embed/embed-cli.mjs` | `index` / `query` CLI over the store. |

## Run it

```bash
# precise layer — regenerate the map + run the maintenance scans
node scripts/code-index/index-job.mjs        # → docs/CODE_MAP.md + artifacts/code-index/REPORT.md

# fuzzy layer — build once (incremental after), then query
node scripts/code-index/embed/embed-cli.mjs index --globs "src docs scripts"
node scripts/code-index/embed/embed-cli.mjs query "how does boot batching work" --k 8
```

Prereqs: `tree-sitter tree-sitter-typescript` (precise), `better-sqlite3 sqlite-vec`
+ `ollama pull nomic-embed-text` (fuzzy). All pure-npm / local — no brew, no
system binaries.

## Tests

`node --test scripts/code-index/*.test.mjs scripts/code-index/embed/*.test.mjs`
— 33 deterministic tests. Everything was built test-first: the local coder
(`qwen3-coder-next`) implemented each pure core from the failing test; the
frontier wrote the tests and judged every output against real repo data. That
judging caught what unit tests alone missed — backtick-fence desync in the
ref extractor, lazy-route/test-only false orphans (259→19), a `bufferSize` limit
on 40 KB+ files, sqlite-vec's BigInt+JSON insert quirk.

## Doctrine (shared with `../doc-hygiene`, `../ux-loop`)

**The objective signal decides; the model never does.** A local model is a free,
exhaustive generator; a measurement / exact tool / test is the judge. Never
auto-apply the generator's list. The embedding index is the sharpest case: it
returns *candidates*, and `rg`/read renders the verdict.

## Next (deferred)

- **CLAUDE.md restructure** — prune, Always/Ask/Never boundaries, replace the
  hand-written file-tree with a reference to the generated `CODE_MAP.md`, move
  sometimes-relevant invariants to skills. Frontier+Spencer work, after this
  tooling (now done). The `LEDGER.md` drift list is the first input.
- **ts-morph caller index** — exact "who-calls-Y"; add only if the repo map
  proves insufficient.
- **Session-start hook** — wire `index-job.mjs` in like the docs/INDEX.md job.
