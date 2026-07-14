// Ralph-audit grounding: visit EVERY link on /ja/qa and classify the result.
// A link "works" if the SPA renders substantive content at (or via redirect
// from) the target without the error boundary. Output: JSON lines report.
import { chromium } from "@playwright/test";

const BASE = "http://localhost:5173";
const browser = await chromium.launch({ channel: "chromium", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 200)));

await page.goto(`${BASE}/ja/qa`, { waitUntil: "networkidle" });
const links = await page.$$eval("main a[href], div a[href]", (as) =>
  [...new Set(as.map((a) => a.getAttribute("href")))].filter(
    (h) => h && !h.startsWith("#") && !h.startsWith("http"),
  ),
);
console.log(`crawling ${links.length} unique links`);

const report = [];
for (const href of links) {
  consoleErrors.length = 0;
  let status = "ok";
  let detail = "";
  try {
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(600);
    const finalPath = new URL(page.url()).pathname + new URL(page.url()).search;
    const bodyText = (await page.textContent("body"))?.replace(/\s+/g, " ") ?? "";
    const hasError =
      /something went wrong|error boundary|unexpected error|page not found|404/i.test(
        bodyText,
      );
    const target = href.split("?")[0].split("#")[0];
    const redirected = !finalPath.startsWith(target.split("?")[0]);
    if (hasError) {
      status = "error";
      detail = bodyText.slice(0, 160);
    } else if (bodyText.trim().length < 40) {
      status = "blank";
      detail = `only ${bodyText.trim().length} chars of text`;
    } else if (redirected) {
      status = "redirect";
      detail = `→ ${finalPath}`;
    }
    if (consoleErrors.length) {
      detail += ` | pageerror: ${consoleErrors[0]}`;
      if (status === "ok") status = "js-error";
    }
  } catch (e) {
    status = "crash";
    detail = String(e).slice(0, 160);
  }
  report.push({ href, status, detail });
  if (status !== "ok") console.log(`${status.toUpperCase()}  ${href}  ${detail}`);
}

const bad = report.filter((r) => r.status !== "ok");
console.log(`\n${report.length - bad.length}/${report.length} ok, ${bad.length} flagged`);
console.log(JSON.stringify(report, null, 1));
await browser.close();
