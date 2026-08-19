#!/usr/bin/env node
/**
 * Measure the lesson step scroller, one route per STEP TYPE.
 *
 * Why this exists: the mobile gate's route matrix carries exactly three lesson
 * routes, all of them ja-m4-neo-1, covering two step types (build_sentence and
 * word_image_mcq). Everything else in the course renders a step type the gate
 * has never visited, so "stage does not scroll vertically" was green while
 * saying nothing about eighteen of them.
 *
 * This script picks one (lesson, step) pair per step type out of the visual-QA
 * capture contracts, opens each at phone viewports, and prints
 * `scrollHeight - clientHeight` of the LessonShell scroller — the same
 * measurement the gate makes, over a population that is actually representative.
 *
 * Prereqs: dev server on :5173, and .auth/user.json (npm run test:e2e:auth).
 *
 *   node scripts/measure-step-overflow.mjs
 *
 * Reads /tmp/steptype-routes.json — a {stepType: [lessonId, stepIndex]} map.
 * Rebuild it from any captured module:
 *
 *   python3 - <<'"'"'EOF'"'"'
 *   import json, glob
 *   pairs = {}
 *   for f in sorted(glob.glob("artifacts/visual-qa/ja-m32-<lesson>/contracts.json")):
 *       d = json.load(open(f, encoding="utf-8"))
 *       for i, s in enumerate(d.get("steps") or []):
 *           st = s.get("stepType")
 *           if st and st not in pairs:
 *               pairs[st] = (d["lessonId"], s.get("index", i))
 *   json.dump(pairs, open("/tmp/steptype-routes.json", "w"), ensure_ascii=False, indent=1)
 *   EOF
 */
import { chromium, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

const PAIRS = JSON.parse(readFileSync("/tmp/steptype-routes.json", "utf8"));
const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14-promax", width: 430, height: 932 },
];
const BASE = "http://localhost:5173";

const browser = await chromium.launch();
const rows = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    ...devices["Desktop Chrome"],
    storageState: ".auth/user.json",
    viewport: { width: vp.width, height: vp.height },
    isMobile: false,
  });
  await ctx.addInitScript(() => {
    localStorage.setItem("learningLanguageId", "ja");
  });
  const page = await ctx.newPage();
  for (const [stepType, [lessonId, index]] of Object.entries(PAIRS)) {
    const url = `${BASE}/ja/learn/lessons/${lessonId}?step=${index}&trace-gate=0`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      const stage = page.locator("[data-lesson-stage]").first();
      await stage.waitFor({ state: "visible", timeout: 15000 });
      await page.waitForTimeout(400);
      const m = await stage.evaluate((el) => {
        const s = el.parentElement ?? el;
        return {
          overflow: s.scrollHeight - s.clientHeight,
          sh: s.scrollHeight,
          ch: s.clientHeight,
          seen: el.getAttribute("data-visual-qa-step-type") ?? "unknown",
        };
      });
      rows.push({ vp: vp.name, stepType, seen: m.seen, ...m });
    } catch (e) {
      rows.push({ vp: vp.name, stepType, seen: "ERROR", overflow: -1, sh: 0, ch: 0, err: String(e).slice(0, 80) });
    }
  }
  await ctx.close();
}
await browser.close();
for (const vp of VIEWPORTS) {
  console.log(`\n== ${vp.name} (${vp.width}x${vp.height})`);
  console.log("overflow  step type (rendered)                scrollH/clientH");
  for (const r of rows.filter((x) => x.vp === vp.name).sort((a, b) => b.overflow - a.overflow))
    console.log(
      `${String(r.overflow).padStart(6)}px  ${(r.seen === r.stepType ? r.stepType : `${r.stepType} → ${r.seen}`).padEnd(36)} ${r.sh}/${r.ch}${r.err ? "  " + r.err : ""}`,
    );
}
