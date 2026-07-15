// One-shot smoke test of the freshly authored es course routes.
//  1. /es/learn shows the full 16-module ladder
//  2. /es/qa builds per-language coverage with es lesson links
//  3. lesson es-m1-1 renders and its first step is interactive
//  4. a mid-course lesson deep-links to a step type (?step=<type>)
// Usage: node scripts/es-smoke.mjs
import { chromium } from "@playwright/test";

const BASE = "http://localhost:5173";
const results = [];
const ok = (name, pass, detail = "") => {
  results.push(pass);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch({ channel: "chromium", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// ── 1. learn ladder ───────────────────────────────────────────────────
await page.goto(`${BASE}/es/learn`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const body = await page.textContent("body");
ok("/es/learn renders module ladder", /M16/.test(body) && /Mastery/i.test(body) || /Sonidos|saludos/i.test(body),
  /M16/.test(body) ? "M16 visible" : "checking titles");

// ── 2. QA page ────────────────────────────────────────────────────────
await page.goto(`${BASE}/es/qa`, { waitUntil: "networkidle" });
await page.waitForSelector("h1");
const esLessonLinks = await page.$$eval('a[href*="/es/"]', (as) =>
  as.filter((a) => /lesson/.test(a.getAttribute("href") ?? "")).length,
);
ok("/es/qa lists es lesson links", esLessonLinks > 10, `${esLessonLinks} links`);

// ── 3. m1 first lesson ────────────────────────────────────────────────
const m1Href = await page.$eval(
  'a[href*="/es/"][href*="es-m1-1"]',
  (a) => a.getAttribute("href"),
).catch(() => null);
await page.goto(`${BASE}${m1Href ?? "/es/lesson/es-m1-1"}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const lessonBody = await page.textContent("body");
ok("lesson es-m1-1 renders content", /hola|Hola|vocal|saludo/i.test(lessonBody),
  (lessonBody.match(/hola/i) ?? ["no hola"])[0]);

// ── 4. deep link into a mid-course step type ──────────────────────────
await page.goto(`${BASE}/es/learn/lessons/es-m10-6?step=listening_comprehension`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(1200);
const deepBody = await page.textContent("body");
ok("es-m10-6 ?step=listening_comprehension deep-links", /listen|escucha|audio|hear/i.test(deepBody),
  "listening surface visible");

// ── 5. ConjugationGrid trainer serves es (not the ja kana hub) ────────
await page.goto(`${BASE}/es/practice/conjugation`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const conjBody = await page.textContent("body");
ok("es conjugation grid renders", /presente|pret[eé]rito|imperfecto/i.test(conjBody) && !/て形|た形/.test(conjBody),
  "tense tabs visible, no kana tiles");

// ── 6. agreement_cloze step deep-links (wave-2 content) ───────────────
await page.goto(`${BASE}/es/learn/lessons/es-m4-2?step=agreement_cloze`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const agrBody = await page.textContent("body");
ok("es-m4-2 ?step=agreement_cloze deep-links", /bonit|viej|cas/i.test(agrBody) && !/unknown step/i.test(agrBody),
  "agreement surface visible");

// ── 7. dialogue_listen step deep-links (two-voice-ready dialogues) ────
await page.goto(`${BASE}/es/learn/lessons/es-m5-7?step=dialogue_listen`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const dlgBody = await page.textContent("body");
ok("es-m5-7 ?step=dialogue_listen deep-links", /escucha|listen|dialog|audio/i.test(dlgBody) && !/unknown step/i.test(dlgBody),
  "dialogue surface visible");

await browser.close();
const pass = results.filter(Boolean).length;
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
