// query.mjs — hybrid retrieval over the chunk store.
// Runs BM25 (FTS5) and dense (sqlite-vec KNN) in parallel, fuses the two ranked
// id-lists with Reciprocal Rank Fusion, and returns candidate chunks with
// path:line. The index PROPOSES; the caller confirms with rg/read — never treat
// a hit as the final answer (Anthropic dropped vector search for agentic grep;
// this feeds grep, it doesn't replace it).
import { embed } from "./store.mjs";
import { rrfFuse } from "./rrf.mjs";

// sanitize a free-text query into an FTS5 MATCH expression (OR of bare terms).
function ftsExpr(q) {
  const terms = q.toLowerCase().match(/[a-z0-9_]+/gi) || [];
  return terms.map((t) => `"${t}"`).join(" OR ");
}

export async function search(db, q, { topK = 10, pool = 40 } = {}) {
  // dense
  let denseIds = [];
  try {
    const qv = await embed(q);
    denseIds = db
      .prepare("SELECT id FROM chunks_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?")
      .all(JSON.stringify(qv), pool)
      .map((r) => String(r.id));
  } catch { /* dense unavailable → lexical-only */ }

  // lexical (BM25)
  let lexIds = [];
  const expr = ftsExpr(q);
  if (expr) {
    lexIds = db
      .prepare("SELECT rowid AS id FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY bm25(chunks_fts) LIMIT ?")
      .all(expr, pool)
      .map((r) => String(r.id));
  }

  const fused = rrfFuse([denseIds, lexIds].filter((l) => l.length), { k: 60 }).slice(0, topK);
  const get = db.prepare("SELECT id, path, startLine, endLine, symbol, text FROM chunks WHERE id = ?");
  return fused.map((f) => {
    const row = get.get(Number(f.id));
    return row && { ...row, score: f.score, ref: `${row.path}:${row.startLine}` };
  }).filter(Boolean);
}
