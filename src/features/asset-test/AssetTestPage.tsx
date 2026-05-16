/**
 * SVG asset pack comparison page. Side-by-side render of Twemoji,
 * Noto Emoji, and OpenMoji for ~16 top-100 Japanese nouns so we can
 * pick a visual style before bundling one.
 *
 * Route: /:lang/asset-test (dev / preview only).
 *
 * Licenses (one-time credit OK for all three):
 *   - Twemoji (jdecked fork) — CC BY 4.0
 *   - Noto Emoji              — Apache 2.0 (assets) / OFL (font)
 *   - OpenMoji                — CC BY-SA 4.0
 *
 * All SVGs hotlinked via jsDelivr from upstream GitHub for the
 * comparison. Production would bundle one chosen pack.
 */
import { useState } from "react";

type Noun = {
  jp: string;
  romaji: string;
  en: string;
  emoji: string;
  // Notes on coverage gaps or alt choices we considered.
  note?: string;
};

// Curated mix from the top-100 Japanese nouns: concrete (animals, nature,
// objects, places) + abstract (love, time, family, friend, money). All
// glyphs verified to exist in Unicode emoji set.
const NOUNS: Noun[] = [
  { jp: "魚",    romaji: "sakana",  en: "fish",     emoji: "🐟" },
  { jp: "猫",    romaji: "neko",    en: "cat",      emoji: "🐱" },
  { jp: "犬",    romaji: "inu",     en: "dog",      emoji: "🐶" },
  { jp: "愛",    romaji: "ai",      en: "love",     emoji: "❤️" },
  { jp: "水",    romaji: "mizu",    en: "water",    emoji: "💧" },
  { jp: "火",    romaji: "hi",      en: "fire",     emoji: "🔥" },
  { jp: "山",    romaji: "yama",    en: "mountain", emoji: "⛰️" },
  { jp: "月",    romaji: "tsuki",   en: "moon",     emoji: "🌙" },
  { jp: "太陽",  romaji: "taiyou",  en: "sun",      emoji: "☀️" },
  { jp: "木",    romaji: "ki",      en: "tree",     emoji: "🌳" },
  { jp: "花",    romaji: "hana",    en: "flower",   emoji: "🌸" },
  { jp: "家",    romaji: "ie",      en: "house",    emoji: "🏠" },
  { jp: "学校",  romaji: "gakkou",  en: "school",   emoji: "🏫" },
  { jp: "本",    romaji: "hon",     en: "book",     emoji: "📖" },
  { jp: "車",    romaji: "kuruma",  en: "car",      emoji: "🚗" },
  { jp: "電車",  romaji: "densha",  en: "train",    emoji: "🚆" },
  { jp: "食べ物", romaji: "tabemono", en: "food",   emoji: "🍱" },
  { jp: "雨",    romaji: "ame",     en: "rain",     emoji: "🌧️" },
  { jp: "雪",    romaji: "yuki",    en: "snow",     emoji: "❄️" },
  { jp: "時間",  romaji: "jikan",   en: "time",     emoji: "⏰" },
  { jp: "お金",  romaji: "okane",   en: "money",    emoji: "💰" },
  { jp: "家族",  romaji: "kazoku",  en: "family",   emoji: "👪" },
  { jp: "友達",  romaji: "tomodachi", en: "friend", emoji: "👫" },
  { jp: "心",    romaji: "kokoro",  en: "heart",    emoji: "💖", note: "alt of 愛" },
];

type Pack = {
  id: string;
  name: string;
  license: string;
  style: string;
  // Build the SVG URL from a normalized codepoint list.
  build: (codepoints: string[]) => string;
};

// Strip variation selectors (FE0F) — none of these three packs key files
// by VS16, so including it produces a 404. ZWJ (200D) is preserved for
// family / handshake-style multi-codepoint sequences.
function codepoints(emoji: string): string[] {
  const out: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (cp === 0xfe0f) continue;
    out.push(cp.toString(16));
  }
  return out;
}

const PACKS: Pack[] = [
  {
    id: "twemoji",
    name: "Twemoji",
    license: "CC BY 4.0",
    style: "Flat color, bold outlines",
    build: (cps) =>
      `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${cps.join("-")}.svg`,
  },
  {
    id: "noto",
    name: "Noto Emoji",
    license: "Apache 2.0",
    style: "Soft, rounded, Google",
    build: (cps) =>
      `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u${cps.join("_")}.svg`,
  },
  {
    id: "openmoji",
    name: "OpenMoji",
    license: "CC BY-SA 4.0",
    style: "Modern flat, geometric",
    build: (cps) =>
      `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest/color/svg/${cps.join("-").toUpperCase()}.svg`,
  },
];

type SizePreset = { label: string; px: number };
const SIZES: SizePreset[] = [
  { label: "S", px: 56 },
  { label: "M", px: 96 },
  { label: "L", px: 144 },
];

function AssetCell({
  src,
  size,
  alt,
}: {
  src: string;
  size: number;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-error/40 bg-error/5 text-[10px] text-error">
          missing
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full select-none object-contain"
          draggable={false}
        />
      )}
    </div>
  );
}

export default function AssetTestPage() {
  const [size, setSize] = useState<number>(96);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Vocab art — pack comparison
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Same {NOUNS.length} nouns rendered across three open-source SVG packs.
          Pick the visual style before we bundle one. All three permit free
          commercial use; only OpenMoji requires share-alike on derivatives.
        </p>
      </header>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Size
        </span>
        {SIZES.map((s) => {
          const active = s.px === size;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setSize(s.px)}
              className={
                "rounded-md border-2 px-3 py-1.5 text-sm font-semibold transition-colors duration-100 " +
                (active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-text-primary hover:border-accent")
              }
            >
              {s.label} · {s.px}px
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(140px,1fr)_repeat(3,minmax(0,1fr))] gap-px overflow-hidden rounded-xl border border-border bg-border">
        <div className="bg-surface px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-secondary">
          Word
        </div>
        {PACKS.map((p) => (
          <div key={p.id} className="bg-surface px-4 py-3">
            <div className="text-sm font-bold text-text-primary">{p.name}</div>
            <div className="text-[11px] text-text-secondary">{p.license}</div>
            <div className="text-[11px] text-text-secondary">{p.style}</div>
          </div>
        ))}

        {NOUNS.map((n) => {
          const cps = codepoints(n.emoji);
          return (
            <div key={n.jp} className="contents">
              <div className="flex flex-col justify-center bg-surface px-4 py-3">
                <div className="font-japanese text-xl font-bold text-text-primary">
                  {n.jp}
                </div>
                <div className="text-xs text-text-secondary">{n.romaji}</div>
                <div className="text-xs font-medium text-text-primary">
                  {n.en}
                </div>
                {n.note && (
                  <div className="mt-1 text-[10px] italic text-text-secondary">
                    {n.note}
                  </div>
                )}
              </div>
              {PACKS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-center bg-surface p-3"
                >
                  <AssetCell
                    src={p.build(cps)}
                    size={size}
                    alt={`${n.en} — ${p.name}`}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <footer className="mt-6 text-xs text-text-secondary">
        <p>
          SVGs hotlinked via jsDelivr for this comparison only — production
          bundle would ship one pack locally. Codepoints normalized (FE0F
          stripped; ZWJ sequences preserved). "missing" cells = no upstream file
          at the resolved URL for that emoji.
        </p>
      </footer>
    </div>
  );
}
