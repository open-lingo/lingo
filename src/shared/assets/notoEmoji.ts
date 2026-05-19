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

const LINGO_ART_BASE = "/lingo-art/svg";

/**
 * Vocabulary words whose Noto rendering failed the 4-persona audit
 * (2026-05-18: 9yo/16yo/38yo/67yo Opus subagents). Each entry is paired
 * with a custom MIT-licensed SVG under `src/pub/lingo-art/svg/` designed
 * in Noto-adjacent style: flat fill, soft dark outline, saturated colors.
 *
 * Words removed from this map (anata, ani, ane, arimasu, imasu, koe,
 * chichi, haha) deferred for later resolution per
 * `docs/emoji-blocked-words-2026-05-18.md` — taught via particle_cloze /
 * phrase_card / dialogue_listen, NOT wordImageMcq. Those eight kana are
 * registered in `WORD_IMAGE_MCQ_BLOCKLIST` (see _jaGrammarHelpers.ts)
 * which throws at import-time if a lesson tries to image-MCQ them.
 *
 * The custom-art path is preferred over `notoEmojiUrl` when present. Keys
 * are the kana surface form (matches `RowWord.kana`).
 *
 * To add a new word: (1) drop the SVG under `src/pub/lingo-art/svg/`
 * (~128×128 viewBox, transparent bg, 2-2.5px #1e293b outline, flat fill,
 * rounded geometry — match the existing 9 SVGs' style), (2) add the
 * kana→filename entry below, (3) verify at production size (64px) via
 * Playwright or the dev preview page. See
 * `docs/n5-vocab-emoji-reference-2026-05-18.md` for the full vocab→art
 * map (662 N5 words) and `docs/emoji-blocked-words-2026-05-18.md` for the
 * rubric + end-to-end authoring workflow.
 */
const LINGO_CUSTOM_ART: Record<string, string> = {
  つくえ: "desk.svg",
  きょう: "today.svg",
  へや: "room.svg",
  みせ: "shop.svg",
  しゃしん: "photo.svg",
  そら: "sky.svg",
  ひゃく: "hundred.svg",
  ざっし: "magazine.svg",
  どれ: "which.svg",
};

/**
 * Per-word override returning the custom-art URL when a word has one,
 * else `null`. Lookups are kana-keyed so the lesson data's `emoji` field
 * stays untouched (the emoji is the fallback if the custom asset is
 * unavailable).
 */
export function lingoArtUrl(kana: string | undefined): string | null {
  if (!kana) return null;
  const file = LINGO_CUSTOM_ART[kana];
  return file ? `${LINGO_ART_BASE}/${file}` : null;
}

/**
 * Get the codepoint list of an emoji, stripping FE0F variation selectors.
 * Codepoints &lt; 0x100 (digits, `#`, `*`) get zero-padded to 4 hex chars because
 * Noto's keycap filenames are `emoji_u0031_20e3.svg` not `emoji_u31_20e3.svg`.
 */
export function emojiCodepoints(emoji: string): string[] {
  const out: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0xfe0f) continue;
    out.push(cp < 0x100 ? cp.toString(16).padStart(4, "0") : cp.toString(16));
  }
  return out;
}

const REGIONAL_LO = 0x1f1e6;
const REGIONAL_HI = 0x1f1ff;

/**
 * Resolve an emoji character (or ZWJ sequence) to its Noto Emoji SVG URL.
 * Returns `null` for empty / malformed input.
 *
 * Auto-routes regional-indicator pairs (country flags) to `notoFlagUrl`
 * because flags live under `third_party/region-flags/` not the main `svg/`
 * dir.
 *
 * @example
 *   notoEmojiUrl("🐟")  // → "/noto-emoji/svg/emoji_u1f41f.svg"
 *   notoEmojiUrl("❤️") // → "/noto-emoji/svg/emoji_u2764.svg" (FE0F stripped)
 *   notoEmojiUrl("👨‍🍳") // → "/noto-emoji/svg/emoji_u1f468_200d_1f373.svg"
 *   notoEmojiUrl("1️⃣") // → "/noto-emoji/svg/emoji_u0031_20e3.svg" (keycap, zero-padded)
 *   notoEmojiUrl("🇯🇵") // → "/region-flags/svg/JP.svg" (auto flag-route)
 */
export function notoEmojiUrl(emoji: string): string | null {
  const rawCps: number[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0xfe0f) continue;
    rawCps.push(cp);
  }
  if (rawCps.length === 0) return null;
  if (
    rawCps.length === 2 &&
    rawCps.every((cp) => cp >= REGIONAL_LO && cp <= REGIONAL_HI)
  ) {
    const iso = String.fromCharCode(
      ...rawCps.map((cp) => 0x41 + (cp - REGIONAL_LO)),
    );
    return notoFlagUrl(iso);
  }
  const cps = rawCps.map((cp) =>
    cp < 0x100 ? cp.toString(16).padStart(4, "0") : cp.toString(16),
  );
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
