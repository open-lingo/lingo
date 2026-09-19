/**
 * lib/emojiIndex.mjs — the vendored-emoji lookup, generated from
 * `src/pub/noto-emoji/svg/` (the same directory
 * `src/shared/assets/notoEmoji.ts`'s `notoEmojiUrl()` resolves against at
 * runtime — this reimplements its codepoint math in reverse, filename ->
 * glyph, so an author can check "is this emoji vendored" without booting
 * the app). Noto's filenames carry codepoints, not English names
 * (`emoji_u1f431.svg`), so the lookup key is the literal glyph itself —
 * there is no English-name database vendored in this repo to key on.
 */
import { readdirSync } from "node:fs";

const FILE_RE = /^emoji_u([0-9a-f_]+)\.svg$/;

/** filename codepoints "1f468_200d_1f373" -> the rendered glyph string
 *  (ZWJ sequences reconstruct correctly; Noto never encodes FE0F). */
function codepointsToGlyph(cpPart) {
  return cpPart
    .split("_")
    .map((hex) => String.fromCodePoint(parseInt(hex, 16)))
    .join("");
}

/** Map<glyph, filename> for every vendored `noto-emoji/svg/*.svg`. */
export function buildEmojiIndex(svgDir) {
  const index = new Map();
  for (const f of readdirSync(svgDir)) {
    const m = FILE_RE.exec(f);
    if (!m) continue;
    index.set(codepointsToGlyph(m[1]), f);
  }
  return index;
}

export function isVendored(index, emoji) {
  return index.has(emoji);
}
