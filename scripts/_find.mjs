import { chromium } from "@playwright/test";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:430,height:932}, isMobile:true, hasTouch:true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  const k="open-lingo-settings";
  const s=JSON.parse(localStorage.getItem(k)||"{}");
  s.learning={...(s.learning||{}),learningLanguageId:"ko",onboardingCompleted:true,uiLocale:"en"};
  localStorage.setItem(k,JSON.stringify(s));
  localStorage.setItem("lingo_placement_dismissed_v2_ko","1");
  localStorage.setItem("open-lingo-cookie-consent",JSON.stringify({essential:true,advertising:false,decidedAt:"2026-01-01T00:00:00.000Z"}));
});
for (const lesson of ["ko-m1-n-1","ko-m1-n-2","ko-m1-n-3"]) {
  for (let s=0;s<20;s++){
    await page.goto(`http://localhost:5173/ko/learn/lessons/${lesson}?step=${s}`,{waitUntil:"domcontentloaded"});
    await page.waitForTimeout(700);
    const t = await page.evaluate(()=>document.body.innerText.slice(0,120).replace(/\s+/g," "));
    if (/speaking practice/i.test(t)) { console.log(`SPEAKING: ${lesson} step=${s} :: ${t.slice(0,70)}`); }
  }
}
await b.close();
