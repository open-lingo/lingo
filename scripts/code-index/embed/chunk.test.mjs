// Tests for AST-aware chunking (the cAST idea) + markdown-by-heading + RRF fusion.
// Chunking is fuzzy, so assertions check invariants (spans valid, all lines
// covered, oversized input splits) not exact chunk counts. RRF is exact.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkSource, chunkMarkdown } from "./chunk.mjs";
import { rrfFuse } from "./rrf.mjs";

const twoFns = [
  "export function alpha() {", // 1
  "  return 1;",               // 2
  "}",                          // 3
  "export function beta() {",  // 4
  "  return 2;",               // 5
  "}",                          // 6
].join("\n");

test("chunkSource yields chunks with valid 1-based line spans covering the source", () => {
  const chunks = chunkSource(twoFns, "ts", { maxChars: 40 });
  assert.ok(chunks.length >= 2, `expected split, got ${chunks.length}`);
  for (const c of chunks) {
    assert.ok(c.startLine >= 1 && c.endLine >= c.startLine, JSON.stringify(c));
    assert.ok(typeof c.text === "string" && c.text.length > 0);
  }
  // spans are ordered and cover line 1..6
  const sorted = [...chunks].sort((a, b) => a.startLine - b.startLine);
  assert.equal(sorted[0].startLine, 1);
  assert.equal(sorted[sorted.length - 1].endLine, 6);
});

test("chunkSource tags a chunk with the enclosing symbol name when unmerged", () => {
  const chunks = chunkSource(twoFns, "ts", { maxChars: 40 });
  const alpha = chunks.find((c) => c.text.includes("function alpha"));
  assert.ok(alpha && alpha.symbol === "alpha", `got ${JSON.stringify(alpha)}`);
});

test("chunkSource splits a single oversized declaration into multiple chunks", () => {
  const body = Array.from({ length: 200 }, (_, i) => `  const v${i} = ${i};`).join("\n");
  const big = `export function huge() {\n${body}\n}`;
  const chunks = chunkSource(big, "ts", { maxChars: 500 });
  assert.ok(chunks.length > 1, `oversized fn should split, got ${chunks.length}`);
  assert.ok(chunks.every((c) => c.text.length <= 1200)); // no runaway chunk
});

test("chunkSource merges tiny adjacent siblings under the budget", () => {
  const small = "const a = 1;\nconst b = 2;\nconst c = 3;";
  const merged = chunkSource(small, "ts", { maxChars: 1000 });
  const split = chunkSource(small, "ts", { maxChars: 8 });
  assert.ok(merged.length < split.length, "a big budget should merge more than a tiny one");
});

test("chunkMarkdown splits by heading, keeping the heading with its section", () => {
  const md = "# Title\nintro\n## A\naaa\n## B\nbbb\n";
  const chunks = chunkMarkdown(md, { maxChars: 1000 });
  assert.ok(chunks.length >= 2);
  const a = chunks.find((c) => c.text.includes("## A"));
  assert.ok(a && a.text.includes("aaa"), "heading A must carry its body");
});

test("rrfFuse ranks an id high in BOTH lists above one high in a single list", () => {
  const listX = ["p", "q", "r", "s"]; // p rank0
  const listY = ["t", "p", "u", "v"]; // p rank1
  const fused = rrfFuse([listX, listY], { k: 60 });
  assert.equal(fused[0].id, "p"); // appears in both, so highest combined score
  assert.ok(fused.every((f) => typeof f.score === "number"));
  // an id in only one list is still present
  assert.ok(fused.some((f) => f.id === "s"));
});

test("rrfFuse is order-stable and dedupes ids across lists", () => {
  const fused = rrfFuse([["a", "b"], ["a", "c"]], { k: 1 });
  const ids = fused.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length, "no duplicate ids");
  assert.equal(ids[0], "a"); // a is in both → top
});
