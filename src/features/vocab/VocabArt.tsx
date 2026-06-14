import type { VocabRow } from "./vocabData";

/**
 * Renders a word's art: vendored SVG / Noto emoji when available, else the raw
 * emoji glyph, else the kana itself. Mirrors the lesson EmojiArt fallback so a
 * missing asset never shows a broken image.
 */
export function VocabArt({ row, size = 40 }: { row: VocabRow; size?: number }) {
  if (row.imageUrl) {
    return (
      <img
        src={row.imageUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="object-contain"
        onError={(e) => {
          // Hide the broken <img> so the glyph fallback (sibling) reads instead.
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <span aria-hidden style={{ fontSize: size * 0.7, lineHeight: 1 }}>
      {row.emoji ?? row.kana}
    </span>
  );
}
