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

import {
  JA_COURSE_ATOMS,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";

/** Phase 2: route through the language registry per ADR-005. */
function courseAtomsFor(languageId: string): ReadonlyArray<CourseAtom> {
  if (languageId !== "ja") return [];
  return JA_COURSE_ATOMS;
}

const NOTO_SVG_BASE = "/noto-emoji/svg";

const NOTO_FLAG_BASE = "/region-flags/svg";

const LINGO_ART_BASE = "/lingo-art";

/**
 * Vocabulary words with custom art instead of a Noto emoji, keyed
 * `${course}:${surface}` — `surface` is the kana display form for JA, the
 * target-language surface form for KO/ES/FR (whatever `opt.word` /
 * `atom.display` /  `ca.kana` /  a course atom's `surface` field actually
 * holds at each call site — every caller already has that string on hand,
 * none carries the course-atom id, so surface is the only key every
 * resolver call site can build without a registry lookup).
 *
 * Two generations of entries share this map:
 *
 * 1. The original JA-only set (2026-05-18, 4-persona Noto-rendering audit:
 *    9yo/16yo/38yo/67yo Opus subagents) — hand-authored MIT SVGs under
 *    `src/pub/lingo-art/svg/`, flat fill, soft dark outline, saturated
 *    colors, ~128×128 viewBox. Migrated to `ja:<kana>` keys 2026-09-02
 *    (Wave C) without touching the files themselves.
 *
 *    Words removed from this map (anata, ani, ane, arimasu, imasu, koe,
 *    chichi, haha) deferred for later resolution per
 *    `docs/emoji-blocked-words-2026-05-18.md` — taught via particle_cloze /
 *    phrase_card / dialogue_listen, NOT wordImageMcq. Those eight kana are
 *    registered in `WORD_IMAGE_MCQ_BLOCKLIST` (see grammarHelpers.ts) which
 *    throws at import-time if a lesson tries to image-MCQ them.
 *
 * 2. The Wave C emoji-refit "art" decisions (2026-09-02) — words the
 *    frontier audit found NO honest Noto emoji for at all (soy sauce,
 *    genkan, kimchi, ...). Generated via `scripts/emoji-refit/art.mjs`
 *    (local mflux + Z-Image-Turbo, flat-vector-sticker style) and
 *    post-processed PNGs under `src/pub/lingo-art/vocab/<course>/<id>.png`.
 *
 * The custom-art path is preferred over `notoEmojiUrl` when present.
 *
 * To add a new word to generation-1 style: (1) drop an SVG under
 * `src/pub/lingo-art/svg/` (match the existing 9 SVGs' style), (2) add the
 * `<course>:<surface>` → `svg/<file>.svg` entry below, (3) verify at
 * production size (64px). To add a new generation-2 word: run
 * `scripts/emoji-refit/art.mjs`, then add `<course>:<surface>` →
 * `vocab/<course>/<id>.png` below.
 */
const LINGO_CUSTOM_ART: Record<string, string> = {
  "ja:つくえ": "svg/desk.svg",
  "ja:きょう": "svg/today.svg",
  "ja:へや": "svg/room.svg",
  "ja:みせ": "svg/shop.svg",
  "ja:しゃしん": "svg/photo.svg",
  "ja:そら": "svg/sky.svg",
  "ja:ひゃく": "svg/hundred.svg",
  "ja:ざっし": "svg/magazine.svg",
  "ja:どれ": "svg/which.svg",
  // Wave C emoji-refit (2026-09-02) — decisions.json `action: "art"`.
  "ja:しょうゆ": "vocab/ja/shouyu.png",
  "ja:ストーブ": "vocab/ja/sutoobu.png",
  "ja:ポケット": "vocab/ja/poketto.png",
  "ja:こうばん": "vocab/ja/kouban.png",
  "ja:げんかん": "vocab/ja/genkan.png",
  "ja:いけ": "vocab/ja/ike.png",
  "ja:かわ": "vocab/ja/kawa.png",
  "ja:テーブル": "vocab/ja/teeburu.png",
  "ko:배": "vocab/ko/배.png",
  "ko:김치": "vocab/ko/김치.png",
  "ko:비빔밥": "vocab/ko/비빔밥.png",
  "es:mesa": "vocab/es/mesa.png",
};

/**
 * Per-word override returning the custom-art URL when a word has one,
 * else `null`. Lookups are `${course}:${surface}`-keyed — `surface` is
 * kana for JA, the target-language surface form for KO/ES/FR — so the
 * lesson data's `emoji` field stays untouched (the emoji is the fallback
 * if the custom asset is unavailable).
 */
export function lingoArtUrl(
  course: string,
  surface: string | undefined,
): string | null {
  if (!surface) return null;
  const file = LINGO_CUSTOM_ART[`${course}:${surface}`];
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

/**
 * Kana → emoji map derived from the course-atom registry. Every atom that
 * carries an `emoji` field contributes one entry keyed by its `kana` surface
 * form. Used by `PhraseCardStepView` to render a glyph above the meaning
 * when the lesson author hasn't overridden it via `step.emoji`.
 *
 * Built at module-eval — single source of truth is `JA_COURSE_ATOMS`. No
 * separate hand-maintained mirror to drift out of sync.
 */
export const JA_KANA_EMOJI_MAP: ReadonlyMap<string, string> = new Map(
  courseAtomsFor("ja")
    .filter((a): a is typeof a & { emoji: string } => !!a.emoji)
    .map((a) => [a.kana, a.emoji]),
);

/**
 * Look up the canonical emoji for a kana surface form. Returns `null` when
 * the kana isn't in the course atom registry or its atom has no emoji.
 */
export function lookupKanaEmoji(kana: string): string | null {
  return JA_KANA_EMOJI_MAP.get(kana) ?? null;
}
