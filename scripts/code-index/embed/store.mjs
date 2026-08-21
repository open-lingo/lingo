// store.mjs — the hybrid chunk store: SQLite FTS5 (BM25) + sqlite-vec (dense).
// Incremental: a file is re-chunked/re-embedded only when its content hash changes.
// Embeddings come from Ollama (nomic-embed-text, 768-dim), local + free.
import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { createHash } from "node:crypto";
import { chunkSource, chunkMarkdown } from "./chunk.mjs";

const OLLAMA = process.env.OLLAMA_URL || "http://localhost:11434";
export const EMBED_MODEL = process.env.EMBED_MODEL || "nomic-embed-text";
export const DIM = 768;

export function openStore(path) {
  const db = new Database(path);
  sqliteVec.load(db);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (path TEXT PRIMARY KEY, hash TEXT);
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY, path TEXT, startLine INTEGER, endLine INTEGER,
      symbol TEXT, text TEXT
    );
    CREATE INDEX IF NOT EXISTS chunks_path ON chunks(path);
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(text, content='chunks', content_rowid='id');
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(id INTEGER PRIMARY KEY, embedding float[${DIM}]);
  `);
  return db;
}

export function hashOf(s) { return createHash("sha1").update(s).digest("hex").slice(0, 16); }

export function chunkFile(path, source) {
  if (/\.mdx?$/.test(path)) return chunkMarkdown(source, { maxChars: 1200 });
  const lang = path.endsWith(".tsx") ? "tsx" : "ts";
  return chunkSource(source, lang, { maxChars: 1200 });
}

/** Embed one string via Ollama; returns a Float32-ready number[] of length DIM. */
export async function embed(text) {
  const res = await fetch(`${OLLAMA}/api/embeddings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`ollama embed ${res.status}: ${await res.text().catch(() => "")}`);
  const j = await res.json();
  if (!Array.isArray(j.embedding) || j.embedding.length !== DIM) {
    throw new Error(`bad embedding len ${j.embedding?.length} (want ${DIM})`);
  }
  return j.embedding;
}

function dropFile(db, path) {
  const ids = db.prepare("SELECT id FROM chunks WHERE path = ?").all(path).map((r) => r.id);
  if (!ids.length) return;
  const delC = db.prepare("DELETE FROM chunks WHERE id = ?");
  const delF = db.prepare("DELETE FROM chunks_fts WHERE rowid = ?");
  const delV = db.prepare("DELETE FROM chunks_vec WHERE id = ?");
  for (const id of ids) { delC.run(id); delF.run(id); delV.run(id); }
}

/**
 * Index one file into the store. Skips work if the file hash is unchanged.
 * Returns { status: "cached"|"indexed"|"error", chunks }.
 */
export async function indexFile(db, path, source) {
  const h = hashOf(source);
  const prior = db.prepare("SELECT hash FROM files WHERE path = ?").get(path);
  if (prior && prior.hash === h) return { status: "cached", chunks: 0 };

  let pieces;
  try { pieces = chunkFile(path, source); } catch (e) { return { status: "error", chunks: 0, error: String(e).slice(0, 100) }; }
  // Empty / whitespace-only chunks (heading-only md sections, blank code) make
  // Ollama return a length-0 embedding — drop them before embedding.
  pieces = pieces.filter((p) => p.text && p.text.trim().length > 0);

  // Embed everything first (async), THEN commit synchronously in one transaction
  // so a mid-file failure never leaves the file half-indexed, and one bad file
  // can't kill the whole run.
  let vectors;
  try {
    vectors = [];
    for (const p of pieces) vectors.push(await embed(p.symbol ? `${p.symbol}\n${p.text}` : p.text));
  } catch (e) {
    return { status: "error", chunks: 0, error: String(e).slice(0, 100) };
  }

  const insC = db.prepare("INSERT INTO chunks(path, startLine, endLine, symbol, text) VALUES (?,?,?,?,?)");
  const insF = db.prepare("INSERT INTO chunks_fts(rowid, text) VALUES (?, ?)");
  const insV = db.prepare("INSERT INTO chunks_vec(id, embedding) VALUES (?, ?)");
  const commit = db.transaction(() => {
    dropFile(db, path);
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      const info = insC.run(path, p.startLine, p.endLine, p.symbol ?? null, p.text);
      const id = Number(info.lastInsertRowid);
      insF.run(id, p.text);
      // sqlite-vec 0.1.9 vec0 with an explicit INTEGER PK wants a BigInt id and a
      // JSON-string vector (blob / Number id are both rejected).
      insV.run(BigInt(id), JSON.stringify(vectors[i]));
    }
    db.prepare("INSERT INTO files(path, hash) VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET hash = excluded.hash").run(path, h);
  });
  commit();
  return { status: "indexed", chunks: pieces.length };
}

export function stats(db) {
  return {
    files: db.prepare("SELECT COUNT(*) n FROM files").get().n,
    chunks: db.prepare("SELECT COUNT(*) n FROM chunks").get().n,
  };
}
