/**
 * Inline-SVG profile banners. Each component is a 6:1 ratio SVG
 * (viewBox 0 0 1200 200) intended to render at any width — the
 * `preserveAspectRatio` choice is up to the caller. The PublicProfile
 * page uses `slice` so the SVG covers the strip without padding bars;
 * the shop-card thumbnail also uses `slice` so it reads as a real
 * banner rather than a letterboxed art tile.
 *
 * Authoring rules:
 *   - Solid colors + simple geometric primitives only (no <image>, no
 *     PNG imports). All art is honest SVG.
 *   - Off-palette colors over textbook tailwind hues — these are
 *     supposed to feel hand-drawn, not generated.
 *   - Each banner gets exactly ONE distinct "thing" the user will
 *     remember (sakura branch, boat, mug, moon, etc.). Avoid kitchen-
 *     sink compositions.
 *
 * Adding a new banner: register the component below, add an entry to
 * `bannerStyles.ts`, then add the matching SKU to both `shopCatalog.ts`
 * and `lingo-core/app/progress/shop_catalog.py`.
 */

import type { SVGProps } from "react";

type BannerProps = SVGProps<SVGSVGElement>;

const BASE_PROPS = {
  viewBox: "0 0 1200 200",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

// ─── 1. Sakura branch ────────────────────────────────────────────────────────

/**
 * A diagonal cherry branch crossing pale sky, with five-petal blossoms
 * clustered on the branch + a handful of falling petals scattered
 * downwind. The sky is a soft peach→blush wash; the branch is a deep
 * mulberry brown (not a tailwind-flat brown) so blossoms read clearly.
 */
export function SakuraBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="sakura-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff1ec" />
          <stop offset="55%" stopColor="#fde0e6" />
          <stop offset="100%" stopColor="#f8c8d4" />
        </linearGradient>
        <symbol id="sakura-blossom" overflow="visible">
          {/* five rounded petals around a tiny gold center */}
          <g>
            <ellipse cx="0" cy="-9" rx="6" ry="9" fill="#fdb4c4" />
            <ellipse
              cx="8.5"
              cy="-2.5"
              rx="6"
              ry="9"
              fill="#fdb4c4"
              transform="rotate(72 8.5 -2.5)"
            />
            <ellipse
              cx="5.5"
              cy="8"
              rx="6"
              ry="9"
              fill="#fdb4c4"
              transform="rotate(144 5.5 8)"
            />
            <ellipse
              cx="-5.5"
              cy="8"
              rx="6"
              ry="9"
              fill="#fdb4c4"
              transform="rotate(216 -5.5 8)"
            />
            <ellipse
              cx="-8.5"
              cy="-2.5"
              rx="6"
              ry="9"
              fill="#fdb4c4"
              transform="rotate(288 -8.5 -2.5)"
            />
            <circle cx="0" cy="0" r="2" fill="#c25a73" />
          </g>
        </symbol>
      </defs>

      <rect width="1200" height="200" fill="url(#sakura-sky)" />

      {/* Branch — slightly tapering main + a couple of off-shoots */}
      <path
        d="M -30 180 C 250 130, 470 90, 720 70 S 1100 30, 1240 18"
        stroke="#5a2a36"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 320 124 C 340 100, 360 80, 380 56"
        stroke="#5a2a36"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 640 80 C 660 64, 680 50, 710 42"
        stroke="#5a2a36"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 920 50 C 940 70, 960 90, 990 102"
        stroke="#5a2a36"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blossom cluster on branch */}
      <use href="#sakura-blossom" x="200" y="148" />
      <use href="#sakura-blossom" x="240" y="138" transform="rotate(12 240 138)" />
      <use href="#sakura-blossom" x="380" y="55" />
      <use href="#sakura-blossom" x="410" y="70" transform="rotate(-18 410 70)" />
      <use href="#sakura-blossom" x="560" y="92" />
      <use href="#sakura-blossom" x="710" y="42" transform="rotate(22 710 42)" />
      <use href="#sakura-blossom" x="820" y="58" />
      <use href="#sakura-blossom" x="990" y="100" transform="rotate(-9 990 100)" />
      <use href="#sakura-blossom" x="1120" y="22" />

      {/* Falling petals — single ellipse each, scattered through air */}
      <ellipse cx="120" cy="60" rx="6" ry="3" fill="#fdb4c4" transform="rotate(25 120 60)" />
      <ellipse cx="470" cy="170" rx="6" ry="3" fill="#fdb4c4" transform="rotate(-35 470 170)" />
      <ellipse cx="600" cy="40" rx="6" ry="3" fill="#fdb4c4" transform="rotate(40 600 40)" />
      <ellipse cx="780" cy="160" rx="6" ry="3" fill="#fdb4c4" transform="rotate(-12 780 160)" />
      <ellipse cx="900" cy="170" rx="6" ry="3" fill="#fdb4c4" transform="rotate(28 900 170)" />
      <ellipse cx="1080" cy="140" rx="6" ry="3" fill="#fdb4c4" transform="rotate(-25 1080 140)" />
    </svg>
  );
}

// ─── 2. Vaporwave sun ────────────────────────────────────────────────────────

/**
 * Synthwave staple — a big disc on the horizon over a perspective grid
 * floor that fades into magenta. The disc is sliced by three horizontal
 * gaps. Off-palette: hot pink, neon orange, electric purple. NO pure
 * tailwind violet — that's how this reads as designed instead of dumped.
 */
export function VaporwaveSunBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="vw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e0b3a" />
          <stop offset="60%" stopColor="#4a1066" />
          <stop offset="100%" stopColor="#8a1a5d" />
        </linearGradient>
        <linearGradient id="vw-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd75e" />
          <stop offset="50%" stopColor="#ff7e3a" />
          <stop offset="100%" stopColor="#ff2f8a" />
        </linearGradient>
        <linearGradient id="vw-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a0e54" />
          <stop offset="100%" stopColor="#0c0220" />
        </linearGradient>
      </defs>

      <rect width="1200" height="200" fill="url(#vw-sky)" />

      {/* Distant tiny stars */}
      <circle cx="80" cy="36" r="1.2" fill="#ffe9f5" />
      <circle cx="220" cy="22" r="1.4" fill="#ffe9f5" />
      <circle cx="370" cy="48" r="1" fill="#ffe9f5" />
      <circle cx="540" cy="18" r="1.2" fill="#ffe9f5" />
      <circle cx="900" cy="40" r="1.1" fill="#ffe9f5" />
      <circle cx="1080" cy="28" r="1.3" fill="#ffe9f5" />
      <circle cx="1160" cy="58" r="1" fill="#ffe9f5" />

      {/* Sun disc — sliced by horizontal gaps */}
      <g>
        <circle cx="600" cy="120" r="80" fill="url(#vw-sun)" />
        {/* Cut into bands by drawing horizon-color stripes over the lower half */}
        <rect x="510" y="148" width="180" height="4" fill="url(#vw-sky)" opacity="0.95" />
        <rect x="510" y="160" width="180" height="5" fill="url(#vw-sky)" opacity="0.95" />
        <rect x="510" y="174" width="180" height="6" fill="url(#vw-sky)" opacity="0.95" />
      </g>

      {/* Horizon line */}
      <line x1="0" y1="145" x2="1200" y2="145" stroke="#ff5fb4" strokeWidth="1.5" />

      {/* Floor */}
      <rect x="0" y="145" width="1200" height="55" fill="url(#vw-floor)" />

      {/* Grid — perspective via path that converges at a vanishing point */}
      <g stroke="#ff5fb4" strokeWidth="1" opacity="0.85">
        {/* Horizontal grid lines (parallel to horizon, getting closer toward bottom) */}
        <line x1="0" y1="155" x2="1200" y2="155" />
        <line x1="0" y1="167" x2="1200" y2="167" />
        <line x1="0" y1="182" x2="1200" y2="182" />
        <line x1="0" y1="198" x2="1200" y2="198" />
        {/* Vanishing-point lines from horizon (600,145) splaying out */}
        <line x1="600" y1="145" x2="-200" y2="220" />
        <line x1="600" y1="145" x2="50" y2="220" />
        <line x1="600" y1="145" x2="260" y2="220" />
        <line x1="600" y1="145" x2="430" y2="220" />
        <line x1="600" y1="145" x2="600" y2="220" />
        <line x1="600" y1="145" x2="770" y2="220" />
        <line x1="600" y1="145" x2="940" y2="220" />
        <line x1="600" y1="145" x2="1150" y2="220" />
        <line x1="600" y1="145" x2="1400" y2="220" />
      </g>
    </svg>
  );
}

// ─── 3. Starry crescent moon ─────────────────────────────────────────────────

/**
 * Deep midnight sky with a crescent moon and scattered stars. Stars are
 * a mix of four-pointed sparkle marks (drawn with two thin diamond
 * paths) and a few classic five-pointed pentagrams for variety.
 */
export function StarryNightBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1335" />
          <stop offset="100%" stopColor="#1b1d4d" />
        </linearGradient>
        <radialGradient id="moon-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff5c7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff5c7" stopOpacity="0" />
        </radialGradient>
        <symbol id="spark4" overflow="visible">
          <path d="M 0 -7 L 1.6 0 L 0 7 L -1.6 0 Z" fill="#ffe6a8" />
          <path d="M -7 0 L 0 1.6 L 7 0 L 0 -1.6 Z" fill="#ffe6a8" />
        </symbol>
        <symbol id="spark5" overflow="visible">
          <path
            d="M 0 -8 L 2.4 -2.5 L 8 -2.5 L 3.4 1 L 5 7 L 0 3.5 L -5 7 L -3.4 1 L -8 -2.5 L -2.4 -2.5 Z"
            fill="#fff5c7"
          />
        </symbol>
      </defs>

      <rect width="1200" height="200" fill="url(#night-sky)" />

      {/* A few tiny dot-stars to fill the field */}
      {Array.from({ length: 28 }).map((_, i) => {
        // deterministic seeded scatter
        const x = (i * 53 + 31) % 1180 + 10;
        const y = ((i * 37 + 19) % 170) + 10;
        const r = i % 3 === 0 ? 1.3 : 0.9;
        return <circle key={i} cx={x} cy={y} r={r} fill="#fffce0" opacity={0.7} />;
      })}

      {/* Crescent moon — outer disc + inner "bite" disc shifted right */}
      <g transform="translate(990 75)">
        <circle r="56" fill="url(#moon-glow)" />
        <circle r="44" fill="#fff6cf" />
        <circle cx="18" cy="-6" r="40" fill="#0b1335" />
        {/* Tiny crater specks on the lit edge */}
        <circle cx="-22" cy="6" r="2.4" fill="#e8d9a0" />
        <circle cx="-12" cy="22" r="1.6" fill="#e8d9a0" />
        <circle cx="-28" cy="-14" r="1.8" fill="#e8d9a0" />
      </g>

      {/* Sparkle stars */}
      <use href="#spark5" x="180" y="50" />
      <use href="#spark4" x="320" y="120" />
      <use href="#spark4" x="450" y="40" />
      <use href="#spark5" x="600" y="150" />
      <use href="#spark4" x="720" y="80" />
      <use href="#spark5" x="820" y="40" />
      <use href="#spark4" x="100" y="150" />
      <use href="#spark4" x="540" y="90" />
      <use href="#spark5" x="380" y="170" />
    </svg>
  );
}

// ─── 4. Pastel hearts confetti ───────────────────────────────────────────────

/**
 * Cream-to-blush wash with hand-rotated hearts in three sizes and three
 * blush tones. No perfect grid — slight x/y jitter and rotation give it
 * a tossed-confetti feel.
 */
export function HeartsConfettiBanner(props: BannerProps) {
  // Heart path centered on (0,0), height ~16
  const heart =
    "M 0 6 C -8 0, -8 -10, 0 -6 C 8 -10, 8 0, 0 6 Z";

  const hearts: Array<{ x: number; y: number; s: number; r: number; c: string }> = [
    { x: 80, y: 50, s: 1.6, r: -10, c: "#ff8aa6" },
    { x: 150, y: 130, s: 1.0, r: 18, c: "#f59ec0" },
    { x: 240, y: 70, s: 1.3, r: 5, c: "#ff8aa6" },
    { x: 310, y: 30, s: 0.8, r: -25, c: "#ffc1d5" },
    { x: 360, y: 140, s: 1.5, r: 12, c: "#f59ec0" },
    { x: 440, y: 90, s: 1.1, r: -8, c: "#ff8aa6" },
    { x: 520, y: 50, s: 1.4, r: 22, c: "#ffc1d5" },
    { x: 580, y: 150, s: 0.9, r: -15, c: "#ff8aa6" },
    { x: 650, y: 110, s: 1.6, r: 6, c: "#f59ec0" },
    { x: 720, y: 35, s: 1.0, r: 30, c: "#ffc1d5" },
    { x: 790, y: 80, s: 1.3, r: -19, c: "#ff8aa6" },
    { x: 860, y: 145, s: 1.2, r: 9, c: "#f59ec0" },
    { x: 930, y: 50, s: 1.5, r: -7, c: "#ffc1d5" },
    { x: 1000, y: 120, s: 1.0, r: 24, c: "#ff8aa6" },
    { x: 1060, y: 30, s: 0.9, r: -12, c: "#f59ec0" },
    { x: 1120, y: 100, s: 1.4, r: 15, c: "#ffc1d5" },
    { x: 1160, y: 160, s: 1.1, r: -22, c: "#ff8aa6" },
  ];

  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="hc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6f1" />
          <stop offset="100%" stopColor="#ffdde6" />
        </linearGradient>
      </defs>
      <rect width="1200" height="200" fill="url(#hc-bg)" />
      {hearts.map((h, i) => (
        <path
          key={i}
          d={heart}
          fill={h.c}
          transform={`translate(${h.x} ${h.y}) rotate(${h.r}) scale(${h.s})`}
        />
      ))}
    </svg>
  );
}

// ─── 5. Coffee steam ─────────────────────────────────────────────────────────

/**
 * Warm tan background, a small coffee mug silhouette on the left, and
 * three wavy steam ribbons rising from it. The right two-thirds are
 * left intentionally negative-space so the curls have room to breathe.
 */
export function CoffeeSteamBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="cs-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6e8d4" />
          <stop offset="100%" stopColor="#e7c9a0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="200" fill="url(#cs-bg)" />

      {/* Tiny coffee bean dots scattered along the bottom for texture */}
      <g fill="#a06a3a" opacity="0.4">
        <ellipse cx="60" cy="186" rx="5" ry="3" />
        <ellipse cx="100" cy="194" rx="5" ry="3" transform="rotate(15 100 194)" />
        <ellipse cx="900" cy="190" rx="5" ry="3" transform="rotate(-12 900 190)" />
        <ellipse cx="1020" cy="184" rx="5" ry="3" transform="rotate(8 1020 184)" />
        <ellipse cx="1100" cy="192" rx="5" ry="3" transform="rotate(20 1100 192)" />
      </g>

      {/* Steam ribbons — three S-curves with diminishing opacity upward */}
      <g
        stroke="#cbb59a"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      >
        <path d="M 230 130 C 215 110, 245 90, 230 70 S 215 40, 230 20" />
        <path
          d="M 280 130 C 295 108, 265 88, 280 66 S 295 36, 280 14"
          opacity="0.85"
        />
        <path
          d="M 330 130 C 315 112, 345 92, 330 72 S 315 42, 330 22"
          opacity="0.7"
        />
      </g>

      {/* Mug — rounded rectangle body + ellipse top (coffee surface) + handle */}
      <g>
        {/* handle */}
        <path
          d="M 330 100 C 372 100, 372 150, 330 150"
          stroke="#3a2516"
          strokeWidth="10"
          fill="none"
          strokeLinejoin="round"
        />
        {/* body */}
        <path
          d="M 215 100 Q 215 170, 280 170 Q 330 170, 330 100 Z"
          fill="#3a2516"
        />
        {/* coffee surface */}
        <ellipse cx="272" cy="100" rx="58" ry="11" fill="#6e3a18" />
        {/* tiny highlight glint */}
        <ellipse cx="250" cy="97" rx="14" ry="2.5" fill="#a86930" opacity="0.7" />
      </g>
    </svg>
  );
}

// ─── 6. Sunset mountains ─────────────────────────────────────────────────────

/**
 * Horizontal gradient bands — orange at top, fading to pink to dusty
 * purple — with layered triangular peaks at the bottom. Three peak
 * layers in decreasing opacity build perceptible depth.
 */
export function SunsetMountainsBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="sm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc77a" />
          <stop offset="40%" stopColor="#ff8b6b" />
          <stop offset="75%" stopColor="#c25a8a" />
          <stop offset="100%" stopColor="#6b3a78" />
        </linearGradient>
      </defs>
      <rect width="1200" height="200" fill="url(#sm-sky)" />

      {/* Sun — partial disc just above the horizon */}
      <circle cx="780" cy="130" r="40" fill="#ffe18a" />
      <circle cx="780" cy="130" r="40" fill="#ffb86b" opacity="0.55" />

      {/* Sun reflection streaks on the deepest layer (suggests water) — */}
      <g stroke="#ffe18a" strokeWidth="1.5" opacity="0.65">
        <line x1="710" y1="185" x2="850" y2="185" />
        <line x1="730" y1="192" x2="830" y2="192" />
        <line x1="750" y1="198" x2="810" y2="198" />
      </g>

      {/* Far peaks */}
      <path
        d="M 0 165 L 100 110 L 200 145 L 330 90 L 430 138 L 540 100 L 660 142 L 780 105 L 920 145 L 1050 100 L 1200 145 L 1200 200 L 0 200 Z"
        fill="#7a4486"
        opacity="0.55"
      />

      {/* Mid peaks */}
      <path
        d="M -10 200 L 80 130 L 180 170 L 290 120 L 400 175 L 540 130 L 660 178 L 790 135 L 920 180 L 1040 138 L 1200 178 L 1210 200 Z"
        fill="#4b2862"
        opacity="0.85"
      />

      {/* Near peaks (darkest) */}
      <path
        d="M -10 200 L 50 165 L 140 200 L 230 160 L 340 200 L 460 165 L 580 200 L 720 170 L 850 200 L 980 165 L 1100 200 L 1210 200 Z"
        fill="#2a1442"
      />
    </svg>
  );
}

// ─── 7. Ocean wave + boat ────────────────────────────────────────────────────

/**
 * Layered teal waves with a simple sailboat silhouette riding the
 * topmost wave crest. The waves are rolling curves stacked at slightly
 * different colors and heights.
 */
export function OceanBoatBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="ob-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfecf1" />
          <stop offset="100%" stopColor="#7fc5c7" />
        </linearGradient>
      </defs>
      <rect width="1200" height="200" fill="url(#ob-sky)" />

      {/* Distant horizon line + a couple of small clouds */}
      <path
        d="M 120 50 q 16 -16 32 0 q 18 -12 30 4 q 14 -6 22 6 z"
        fill="#fff"
        opacity="0.78"
      />
      <path
        d="M 880 35 q 20 -18 38 0 q 22 -14 38 6 q 18 -8 28 8 z"
        fill="#fff"
        opacity="0.78"
      />

      {/* Distant wave layer */}
      <path
        d="M 0 130 Q 100 110, 200 125 T 400 122 T 600 128 T 800 120 T 1000 126 T 1200 124 L 1200 200 L 0 200 Z"
        fill="#5fa9b1"
        opacity="0.7"
      />

      {/* Mid wave */}
      <path
        d="M 0 155 Q 150 140, 280 150 T 540 152 T 800 148 T 1080 153 T 1200 150 L 1200 200 L 0 200 Z"
        fill="#3d8388"
      />

      {/* Boat — riding on the mid-wave crest near 360 */}
      <g transform="translate(380 142)">
        {/* hull */}
        <path
          d="M -42 0 Q -32 14, 0 14 Q 32 14, 42 0 Z"
          fill="#7a3a1e"
        />
        {/* mast */}
        <line x1="-2" y1="0" x2="-2" y2="-46" stroke="#3a2010" strokeWidth="2" />
        {/* sail */}
        <path d="M -2 -46 L -2 -6 L 26 -6 Z" fill="#fff" />
        <path d="M -2 -46 L -2 -6 L -22 -6 Z" fill="#f0e6d2" />
        {/* tiny flag */}
        <path d="M -2 -46 L 8 -42 L -2 -38 Z" fill="#e64a4a" />
      </g>

      {/* Front wave (darkest) */}
      <path
        d="M 0 178 Q 200 168, 380 174 T 720 170 T 1000 174 T 1200 172 L 1200 200 L 0 200 Z"
        fill="#1f5e64"
      />

      {/* A couple of foam dots along the boat's wake */}
      <circle cx="320" cy="156" r="2" fill="#fff" opacity="0.8" />
      <circle cx="330" cy="160" r="1.6" fill="#fff" opacity="0.7" />
      <circle cx="455" cy="158" r="2.2" fill="#fff" opacity="0.8" />
      <circle cx="445" cy="162" r="1.4" fill="#fff" opacity="0.6" />
    </svg>
  );
}

// ─── 8. Meadow flowers ───────────────────────────────────────────────────────

/**
 * Pale sage background with simple grass blades along the bottom and a
 * row of daisies + tulips standing among them. Daisies are five-petal
 * silhouettes; tulips are upward arrowheads on slender stems.
 */
export function MeadowBanner(props: BannerProps) {
  return (
    <svg {...BASE_PROPS} {...props}>
      <defs>
        <linearGradient id="md-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf6df" />
          <stop offset="100%" stopColor="#c2dfb1" />
        </linearGradient>
        <symbol id="md-daisy" overflow="visible">
          {/* Five rounded petals + yellow center */}
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-8"
              rx="4.5"
              ry="7.5"
              fill="#fff"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle r="3.5" fill="#fbd34c" />
        </symbol>
        <symbol id="md-tulip" overflow="visible">
          {/* Tulip cup: three pointed petals */}
          <path d="M -7 0 Q -7 -16, 0 -18 Q 7 -16, 7 0 Q 0 4, -7 0 Z" fill="#ef6c8a" />
          <path d="M -3 -2 Q -3 -14, 0 -16 Q 3 -14, 3 -2 Q 0 -1, -3 -2 Z" fill="#c84a72" />
        </symbol>
      </defs>

      <rect width="1200" height="200" fill="url(#md-sky)" />

      {/* Soft sun in upper right */}
      <circle cx="1060" cy="50" r="36" fill="#fff7c2" opacity="0.85" />

      {/* Grass blades — a forest of thin curves along the bottom */}
      <g stroke="#5b8a4e" strokeWidth="2" strokeLinecap="round" fill="none">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = i * 20 + (i % 3) * 6;
          const tipX = x + (i % 2 === 0 ? 8 : -8);
          const tipY = 160 + ((i * 7) % 15);
          return (
            <path
              key={i}
              d={`M ${x} 200 Q ${(x + tipX) / 2} ${tipY - 6}, ${tipX} ${tipY}`}
              opacity={0.85}
            />
          );
        })}
      </g>

      {/* Daisies on stems */}
      {[
        { x: 110, top: 130 },
        { x: 290, top: 110 },
        { x: 510, top: 132 },
        { x: 700, top: 118 },
        { x: 890, top: 134 },
      ].map((d) => (
        <g key={d.x}>
          {/* Stem */}
          <path
            d={`M ${d.x} 200 Q ${d.x + 4} ${d.top + 40}, ${d.x} ${d.top}`}
            stroke="#5b8a4e"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaf */}
          <path
            d={`M ${d.x - 2} ${d.top + 30} Q ${d.x - 18} ${d.top + 22}, ${d.x - 6} ${d.top + 14}`}
            fill="#5b8a4e"
          />
          {/* Flower head */}
          <use href="#md-daisy" x={d.x} y={d.top} />
        </g>
      ))}

      {/* Tulips */}
      {[
        { x: 200, top: 120 },
        { x: 400, top: 138 },
        { x: 600, top: 124 },
        { x: 800, top: 138 },
        { x: 970, top: 122 },
      ].map((d) => (
        <g key={d.x}>
          <path
            d={`M ${d.x} 200 Q ${d.x - 4} ${d.top + 40}, ${d.x} ${d.top}`}
            stroke="#5b8a4e"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M ${d.x + 4} ${d.top + 18} Q ${d.x + 20} ${d.top + 12}, ${d.x + 10} ${d.top + 28}`}
            fill="#5b8a4e"
          />
          <use href="#md-tulip" x={d.x} y={d.top} />
        </g>
      ))}
    </svg>
  );
}
