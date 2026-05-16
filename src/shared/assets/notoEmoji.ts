/**
 * Noto Emoji SVG URL resolver. Source-of-truth pack for vocab card art —
 * Apache 2.0 license, no per-card attribution required.
 *
 * Current implementation hotlinks via jsDelivr. Production bundle path
 * (download SVGs into `src/assets/noto/` + import-glob) is tracked in
 * Task #57. The public surface here stays the same when we swap.
 *
 * Codepoint rules verified by audit (2026-05-16):
 *   - FE0F variation selectors are NEVER part of the filename, single or
 *     ZWJ. `emoji_u2764.svg` works; `emoji_u2764_fe0f.svg` 404s.
 *   - ZWJ (200D) is preserved in ZWJ-sequence filenames.
 *   - Codepoints joined by `_`, lowercase hex, no leading zeros.
 *   - Country flags (regional-indicator pairs) live in
 *     `noto-emoji/third_party/region-flags/`, NOT the main `svg/` dir.
 *     Use `notoFlagUrl` for those.
 */

const NOTO_SVG_BASE =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg";

const NOTO_FLAG_BASE =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/third_party/region-flags/svg";

/** Get the codepoint list of an emoji, stripping FE0F variation selectors. */
export function emojiCodepoints(emoji: string): string[] {
  const out: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0xfe0f) continue;
    out.push(cp.toString(16));
  }
  return out;
}

/**
 * Resolve an emoji character (or ZWJ sequence) to its Noto Emoji SVG URL.
 * Returns `null` for empty / malformed input.
 *
 * @example
 *   notoEmojiUrl("🐟")  // → ".../svg/emoji_u1f41f.svg"
 *   notoEmojiUrl("❤️") // → ".../svg/emoji_u2764.svg" (FE0F stripped)
 *   notoEmojiUrl("👨‍🍳") // → ".../svg/emoji_u1f468_200d_1f373.svg"
 */
export function notoEmojiUrl(emoji: string): string | null {
  const cps = emojiCodepoints(emoji);
  if (cps.length === 0) return null;
  return `${NOTO_SVG_BASE}/emoji_u${cps.join("_")}.svg`;
}

/**
 * Resolve a 2-letter ISO country code to Noto's wave-style flag SVG.
 * Region-flags are NOT under main `svg/` — they live in a side path,
 * still Apache 2.0.
 *
 * @example
 *   notoFlagUrl("JP")  // → ".../region-flags/svg/JP.svg"
 */
export function notoFlagUrl(isoCode: string): string | null {
  const code = isoCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return `${NOTO_FLAG_BASE}/${code}.svg`;
}
