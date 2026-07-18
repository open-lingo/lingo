import { chromium } from "@playwright/test";
import fs from "node:fs";
const AUTH = ".auth/user.json";
const routes = [
  ["practice-hub", "/ja/practice"],
  ["pillar-reading", "/ja/practice/pillar/reading"],
  ["pillar-listening", "/ja/practice/pillar/listening"],
  ["pillar-speaking", "/ja/practice/pillar/speaking"],
  ["pillar-writing", "/ja/practice/pillar/writing"],
  ["trainer-listening", "/ja/practice/listening"],
  ["trainer-writing", "/ja/practice/writing"],
  ["grammar", "/ja/practice/grammar"],
  ["conjugation", "/ja/practice/conjugation"],
  ["kanji", "/ja/practice/kanji"],
  ["particles", "/ja/practice/particles"],
  ["counters", "/ja/practice/counters"],
  ["reading", "/ja/practice/reading"],
  ["speaking", "/ja/practice/speaking"],
  ["alphabet", "/ja/practice/alphabet"],
  ["flashcards", "/ja/practice/flashcards"],
  ["journey", "/ja/practice/journey"],
  ["stories", "/ja/practice/stories"],
  ["learn-map", "/ja/learn"],
  ["placement", "/ja/learn/placement-test"],
  ["vocab", "/ja/vocab"],
];
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1400, height: 950 }, ...(fs.existsSync(AUTH) ? { storageState: AUTH } : {}) });
const page = await c.newPage();
await page.addInitScript(() => { try {
  localStorage.setItem("learningLanguageId", JSON.stringify("ja"));
  localStorage.setItem("lingo_placement_dismissed_v2_ja","1");
} catch {} });
const results = [];
for (const [name, path] of routes) {
  const errs = [];
  const onErr = (e) => errs.push("PAGEERR: " + e.message);
  const onCon = (m) => { if (m.type()==="error") errs.push("CONSOLE: " + m.text().slice(0,160)); };
  page.on("pageerror", onErr); page.on("console", onCon);
  let status = "?";
  try {
    const resp = await page.goto("http://localhost:5173"+path, { waitUntil: "networkidle", timeout: 20000 });
    status = resp ? resp.status() : "no-resp";
    await page.waitForTimeout(900);
    // dismiss survey/cookie best-effort
    for (let i=0;i<4;i++){ const s=page.getByText("Just curious",{exact:true}).first(); if(await s.isVisible().catch(()=>false)){await s.click().catch(()=>{});await page.waitForTimeout(300);} else break; }
    const ess=page.getByRole("button",{name:"Essential only"}); if(await ess.isVisible().catch(()=>false)) await ess.click().catch(()=>{});
    await page.waitForTimeout(400);
    const bodyLen = (await page.textContent("body").catch(()=>""))?.length ?? 0;
    const crashed = await page.getByText(/Something went wrong|Reload page/).first().isVisible().catch(()=>false);
    await page.screenshot({ path: `/tmp/qa/${name}.png` });
    results.push({ name, path, status, bodyLen, crashed, errs: errs.slice(0,4) });
  } catch (e) {
    results.push({ name, path, status, error: String(e).slice(0,120), errs: errs.slice(0,4) });
  }
  page.off("pageerror", onErr); page.off("console", onCon);
}
await b.close();
fs.writeFileSync("/tmp/qa/results.json", JSON.stringify(results, null, 2));
for (const r of results) console.log(`${r.crashed?"CRASH":r.status} ${r.name.padEnd(20)} body=${r.bodyLen??"-"} ${r.errs?.length?("ERR:"+r.errs.join(" | ")):""}${r.error?(" NAV:"+r.error):""}`);
