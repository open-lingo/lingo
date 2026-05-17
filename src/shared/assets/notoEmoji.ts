/**
 * Noto Emoji SVG URL resolver. Source-of-truth pack for vocab card art —
 * Apache 2.0 license, no per-card attribution required.
 *
 * SVGs are vendored locally under `src/pub/noto-emoji/svg/` (Vite's
 * publicDir is `src/pub`, so they're served at `/noto-emoji/svg/...`).
 * Privacy + offline + cache-busting hygiene — no runtime third-party
 * CDN hop. Only the actually-used glyphs ship in the bundle; the ~3000
 * unused Noto SVGs stay out. To add a new emoji to the curriculum,
 * download its SVG from
 *   https://github.com/googlefonts/noto-emoji/tree/main/svg
 * and drop it under `src/pub/noto-emoji/svg/`.
 *
 * Region flags vendor under `src/pub/region-flags/svg/` (wave-style SVGs
 * from googlefonts/noto-emoji's third_party/region-flags, public-domain).
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

const NOTO_SVG_BASE = "/noto-emoji/svg";

const NOTO_FLAG_BASE = "/region-flags/svg";

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
 *   notoEmojiUrl("🐟")  // → "/noto-emoji/svg/emoji_u1f41f.svg"
 *   notoEmojiUrl("❤️") // → "/noto-emoji/svg/emoji_u2764.svg" (FE0F stripped)
 *   notoEmojiUrl("👨‍🍳") // → "/noto-emoji/svg/emoji_u1f468_200d_1f373.svg"
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
 *   notoFlagUrl("JP")  // → "/region-flags/svg/JP.svg"
 */
export function notoFlagUrl(isoCode: string): string | null {
  const code = isoCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return `${NOTO_FLAG_BASE}/${code}.svg`;
}
