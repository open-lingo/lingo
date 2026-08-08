/**
 * Generate the PWA / home-screen / iOS app icon set.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes into `src/pub/` (Vite's `publicDir`, served at the site root and
 * referenced from `index.html` / `manifest.webmanifest`) AND into the iOS asset
 * catalog at `ios/App/App/Assets.xcassets/AppIcon.appiconset/`.
 *
 * Uses Playwright's Chromium — already a devDependency — rather than adding an
 * image library. The mark is laid out in CSS and screenshotted at each size, so
 * padding and safe zones are expressed once, declaratively.
 *
 * ── The wordmark is DRAWN, not upscaled (changed 2026-08-07) ─────────────────
 * This script used to composite `src/pub/mark.png`, which is 88×96, so the 512
 * and 1024px outputs were ~6–11× upscales with visibly soft edges. The mark is
 * purely typographic — a heavy "O" with "LINGO" set vertically beside it — so
 * it is now set as live text in Instrument Sans, the app's own display face
 * (`index.html` loads the same family from Google Fonts). Text renders at the
 * target resolution, so every size is crisp and there is no master asset to
 * outgrow. `mark.png` is kept only as the visual reference for this layout.
 *
 * ⚠️ Needs network at generation time to fetch Instrument Sans, and waits on
 * `document.fonts.ready` before screenshotting. If the font fails to load the
 * icons silently fall back to the system sans and the wordmark will look wrong
 * — the script fails loudly instead of shipping that.
 *
 * ⚠️ The mark is WHITE, so it is invisible on a light background. Every icon is
 * composited on the dark brand colour, which is also why `apple-touch-icon`
 * works: iOS ignores alpha and would otherwise paint the mark onto black.
 *
 * ⚠️ These PNGs carry an (opaque) alpha channel. Fine for development builds
 * and for the web manifest; App Store submission rejects alpha in the app icon
 * and would need a flatten pass first. Not a concern under free provisioning.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "src/pub");
const IOS_APPICON = path.join(
  ROOT,
  "ios/App/App/Assets.xcassets/AppIcon.appiconset",
);

/** `--color-background` of the `dark` preset (shared/theme/presets.ts). */
const BRAND_BG = "#171310";

/**
 * `inset` is the share of the canvas left EMPTY around the mark.
 *
 * Maskable icons are cropped to an arbitrary shape by the launcher (circle,
 * squircle, rounded square), and the spec only guarantees the middle 80% —
 * the "safe zone". 30% padding keeps the whole wordmark inside a circle
 * inscribed in that zone; the standard icons can afford tighter framing since
 * nothing crops them.
 *
 * iOS applies its own squircle mask to the app icon and clips slightly more
 * than the corners suggest, so `AppIcon` sits between the two.
 */
const TARGETS = [
  { dir: PUB, file: "icon-192.png", size: 192, inset: 0.14 },
  { dir: PUB, file: "icon-512.png", size: 512, inset: 0.14 },
  { dir: PUB, file: "icon-maskable-512.png", size: 512, inset: 0.3 },
  // 180 is the size iOS actually requests for @3x home screens.
  { dir: PUB, file: "apple-touch-icon.png", size: 180, inset: 0.16 },
  // The iOS app icon. Xcode's single-size slot; the filename and 1024×1024 are
  // both fixed by AppIcon.appiconset/Contents.json. Without this the installed
  // app shows Capacitor's stock blue placeholder, which is what shipped to
  // hardware on 2026-08-07.
  { dir: IOS_APPICON, file: "AppIcon-512@2x.png", size: 1024, inset: 0.18 },
];

/**
 * The wordmark: a heavy "O", with "LINGO" running bottom-to-top beside it.
 *
 * Sizes are expressed as fractions of the icon's inner box so the layout is
 * identical at 180px and 1024px. `writing-mode: vertical-rl` + `rotate(180deg)`
 * is what makes "LINGO" read upward; `vertical-rl` alone reads downward.
 */
function markHtml(size, inset) {
  const inner = Math.round(size * (1 - inset * 2));
  return `
    <body style="margin:0;width:${size}px;height:${size}px;background:${BRAND_BG};
                 display:grid;place-items:center">
      <div style="width:${inner}px;height:${inner}px;display:flex;
                  align-items:center;justify-content:center;
                  gap:${inner * 0.04}px;color:#fff;
                  font-family:'Instrument Sans',sans-serif;font-weight:700;
                  line-height:1">
        <span style="font-size:${inner * 1.16}px;letter-spacing:-0.03em">O</span>
        <span style="writing-mode:vertical-rl;transform:rotate(180deg);
                     font-size:${inner * 0.3}px;letter-spacing:0.02em">LINGO</span>
      </div>
    </body>`;
}

const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@700&display=block";

const browser = await chromium.launch();
try {
  for (const { dir, file, size, inset } of TARGETS) {
    if (!fs.existsSync(dir)) {
      throw new Error(
        `missing output directory ${path.relative(ROOT, dir)} — run ` +
          `\`npx cap add ios\` before generating the app icon`,
      );
    }
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<link rel="stylesheet" href="${FONT_CSS}">${markHtml(size, inset)}`,
      { waitUntil: "networkidle" },
    );
    await page.evaluate(() => document.fonts.ready);

    // Fail rather than ship a system-font wordmark: without the webfont the
    // letterforms and metrics are wrong and nobody would notice until the icon
    // was on a phone.
    const loaded = await page.evaluate(() =>
      document.fonts.check("700 100px 'Instrument Sans'"),
    );
    if (!loaded) {
      throw new Error(
        "Instrument Sans did not load — icons would silently fall back to the " +
          "system sans. Check network access to fonts.googleapis.com and re-run.",
      );
    }

    await page.screenshot({ path: path.join(dir, file), omitBackground: false });
    await page.close();
    console.log(
      `  ${path.relative(ROOT, path.join(dir, file))}  ${size}x${size}  ` +
        `(inset ${Math.round(inset * 100)}%)`,
    );
  }
} finally {
  await browser.close();
}
console.log(`\nWrote ${TARGETS.length} icons.`);
