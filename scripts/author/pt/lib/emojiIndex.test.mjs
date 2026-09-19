import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildEmojiIndex, isVendored } from "./emojiIndex.mjs";

test("buildEmojiIndex: a simple single-codepoint filename decodes to its glyph", () => {
  const dir = mkdtempSync(join(tmpdir(), "pttool-emoji-"));
  try {
    writeFileSync(join(dir, "emoji_u1f431.svg"), ""); // cat face
    const idx = buildEmojiIndex(dir);
    assert.equal(idx.get("🐱"), "emoji_u1f431.svg");
    assert.equal(isVendored(idx, "🐱"), true);
    assert.equal(isVendored(idx, "🦄"), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildEmojiIndex: a ZWJ sequence filename reconstructs the joined glyph", () => {
  const dir = mkdtempSync(join(tmpdir(), "pttool-emoji-"));
  try {
    writeFileSync(join(dir, "emoji_u1f468_200d_1f373.svg"), ""); // man cook
    const idx = buildEmojiIndex(dir);
    assert.equal(idx.get("\u{1F468}\u{200D}\u{1F373}"), "emoji_u1f468_200d_1f373.svg");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildEmojiIndex: ignores non-emoji files in the same directory", () => {
  const dir = mkdtempSync(join(tmpdir(), "pttool-emoji-"));
  try {
    writeFileSync(join(dir, "README.md"), "");
    const idx = buildEmojiIndex(dir);
    assert.equal(idx.size, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
