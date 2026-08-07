/**
 * Generate the PWA / home-screen icon set from `src/pub/mark.png`.
 *
 *   node scripts/generate-icons.mjs
 *
 * Writes into `src/pub/` (Vite's `publicDir`), so the files are served at the
 * site root and referenced from `index.html` / `manifest.webmanifest`.
 *
 * Uses Playwright's Chromium — already a devDependency — rather than adding an
 * image library for six PNGs. The mark is laid out in CSS and screenshotted at
 * each size, so padding and safe zones are expressed once, declaratively.
 *
 * ⚠️ THE SOURCE IS TOO SMALL. `mark.png` is 88×96, so the 512px and 1024px
 * outputs are ~6-11× upscales and WILL look soft next to a real app icon. They
 * are honest placeholders that unblock installability; replace `mark.png` with
 * a ≥1024px master (or an SVG, which would let this script produce genuinely
 * crisp output at every size) and re-run. Do not ship these to an app store.
 *
 * ⚠️ The mark is WHITE with transparency, so it is invisible on a light
 * background. Every icon here is composited on the dark brand colour, which is
 * also why `apple-touch-icon` works: iOS ignores alpha and would otherwise
 * paint the mark onto black.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "src/pub");
const SRC = path.join(PUB, "mark.png");

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
 */
const TARGETS = [
  { file: "icon-192.png", size: 192, inset: 0.14 },
  { file: "icon-512.png", size: 512, inset: 0.14 },
  { file: "icon-maskable-512.png", size: 512, inset: 0.3 },
  // 180 is the size iOS actually requests for @3x home screens.
  { file: "apple-touch-icon.png", size: 180, inset: 0.16 },
];

const markData = fs.readFileSync(SRC).toString("base64");

const browser = await chromium.launch();
try {
  for (const { file, size, inset } of TARGETS) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(`
      <body style="margin:0;width:${size}px;height:${size}px;
                   background:${BRAND_BG};display:grid;place-items:center">
        <img src="data:image/png;base64,${markData}"
             style="width:${Math.round(size * (1 - inset * 2))}px;
                    height:auto;display:block">
      </body>`);
    await page.screenshot({ path: path.join(PUB, file), omitBackground: false });
    await page.close();
    console.log(`  ${file}  ${size}x${size}  (inset ${Math.round(inset * 100)}%)`);
  }
} finally {
  await browser.close();
}
console.log(`\nWrote ${TARGETS.length} icons to src/pub/`);
