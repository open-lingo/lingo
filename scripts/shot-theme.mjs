// Usage: node scripts/shot-theme.mjs <path> <theme> [width] [height] [outfile]
// Themes: light, dark, sepia, amoled
// Writes /tmp/shot-<theme>.png by default.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [path, theme, w = "1440", h = "900", outArg] = process.argv.slice(2);
if (!path || !theme) {
  console.error("usage: node scripts/shot-theme.mjs <path> <theme> [width] [height] [outfile]");
  process.exit(1);
}
const BASE = "http://localhost:5173";
const AUTH = ".auth/user.json";
const OUT = outArg ?? `/tmp/shot-${theme}.png`;
const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}),
});
const page = await ctx.newPage();
try {
  await page.addInitScript(
    ({ themeId, lang }) => {
      try {
        window.localStorage.setItem(
          "open-lingo-themes",
          JSON.stringify({ activeThemeId: themeId, customThemes: [] }),
        );
        const raw = window.localStorage.getItem("open-lingo-settings");
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.learning = {
          learningLanguageId: lang,
          uiLocale: parsed.learning?.uiLocale ?? "en",
          showAlphabetRomanization: parsed.learning?.showAlphabetRomanization ?? true,
          showAlphabetFurigana: parsed.learning?.showAlphabetFurigana ?? true,
        };
        window.localStorage.setItem("open-lingo-settings", JSON.stringify(parsed));
        window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
        // Dismiss cookie banner so it doesn't overlay the bottom of the page.
        window.localStorage.setItem(
          "open-lingo-cookie-consent",
          JSON.stringify({ essential: true, analytics: false, advertising: false }),
        );
      } catch {
        /* ignore */
      }
    },
    { themeId: theme, lang: "ja" },
  );
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT, fullPage: false });
  console.log(OUT);
} finally {
  await browser.close();
}
